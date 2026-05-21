---
tags:
  - 苍穹外卖
  - AI
  - SpringAI
  - Agent
  - SSE
notes:
---

## AI 点餐助手

AI 点餐助手使用 **ReactAgent**（ReAct 模式），模型可以自主决定何时调用 Tool 查询数据库，并基于查询结果回答用户。支持**同步对话**和**SSE 流式对话**两种模式。

---

## ReactAgent 架构

```
用户消息 → ReactAgent
  → 思考 (Reasoning): 我需要查什么？
  → 行动 (Acting): 调用 searchDishes("辣")
  → 观察 (Observation): 返回 5 道辣菜
  → 思考: 我可以回答用户了
  → 最终回答: "为您找到以下辣菜..."
```

### Agent 配置

```java
// AiConfig.java
@Bean
public ReactAgent chatAgent(ChatClient chatClient, ToolCallback[] dishToolCallbacks) {
    return ReactAgent.builder()
        .name("sky_take_out_agent")
        .chatClient(chatClient)
        .tools(dishToolCallbacks)     // 7 个 Tool
        .systemPrompt("""
            你是小苍，一个专业的外卖点餐助手。
            你可以帮用户推荐菜品、回答菜品相关问题。
            你可以使用提供的工具来查询菜品信息、热销排行、分类列表。
            如果用户问到菜品相关问题，请先使用工具查询，再根据结果回答。
            回复时如果推荐了具体菜品，请在最后单独一行用JSON列出推荐菜品ID
            """)
        .saver(new MemorySaver())     // 内存对话记忆
        .build();
}
```

### 对话记忆

每个用户拥有独立的对话记忆，通过 `threadId` 隔离：

```java
RunnableConfig config = RunnableConfig.builder()
    .threadId("user_" + userId)   // 按用户 ID 隔离
    .build();
AssistantMessage response = agent.call(message, config);
```

> 当前使用 `MemorySaver`（内存），重启后记忆丢失。后续可升级为 Redis/Database 持久化。

---

## DishTools：7 个 Tool 方法

当用户问到菜品相关问题，Agent 会自动调用这些 Tool 查询数据库。

| #   | Tool 方法                             | 功能     | 查询条件                  |
| --- | ----------------------------------- | ------ | --------------------- |
| 1   | `searchDishes(keyword)`             | 搜索可售菜品 | 菜名或分类名模糊匹配，最多 10 条    |
| 2   | `getHotDishes(days)`                | 热销排行   | 指定天数（默认 7 天）销量 Top 10 |
| 3   | `listCategories()`                  | 列出所有分类 | 无参数                   |
| 4   | `getDishesByCategory(categoryName)` | 按分类查菜品 | 分类名称精确匹配              |
| 5   | `getDishDetail(dishId)`             | 菜品详情   | 按 ID 精确查询             |
| 6   | `getSalesTop10(days)`               | 销售排行   | 同 getHotDishes，用于经营分析 |
| 7   | `getAllAvailableDishes()`           | 全部可售菜品 | 无参数                   |

每个 Tool 返回 JSON 字符串，Agent 解析后整合进自然语言回复。

### Tool 实现示例

```java
@Tool(description = "搜索可售菜品。输入关键词，返回匹配的菜品名称、ID、价格和分类。")
public String searchDishes(
    @ToolParam(description = "搜索关键词，如菜名或分类名") String keyword) {
    
    List<Dish> all = dishMapper.list(query);          // 全部可售菜品
    Map<Long, String> catMap = /* 分类ID→名称映射 */;
    
    return JSON.toJSONString(all.stream()
        .filter(d -> d.getName().contains(keyword) 
                  || catMap.get(d.getCategoryId()).contains(keyword))
        .limit(10)
        .map(d -> Map.of("dishId", d.getId(), "name", d.getName(), 
                         "price", d.getPrice(), "category", catMap.get(...)))
        .collect(Collectors.toList()));
}
```

---

## SSE 流式对话 `POST /user/ai/chat/stream`

### 后端实现

使用 `SseEmitter`（Spring MVC 原生 SSE 支持）+ `Flux<NodeOutput>`（ReAct Agent 流式输出）：

```java
@PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public SseEmitter chatStream(@RequestBody AiChatDTO aiChatDTO) {
    SseEmitter emitter = new SseEmitter(300000L);  // 5 分钟超时
    Flux<NodeOutput> stream = aiService.chatStream(userId, message, history);
    
    stream.doOnNext(output -> {
        if (output instanceof StreamingOutput<?> so) {
            String text = extractText(so);  // 从 AssistantMessage/ChatResponse 提取文本
            if (text != null) {
                emitter.send(SseEmitter.event().data(text));  // 逐字发送
            }
        } else if (!output.isEND() && !output.isSTART()) {
            // 工具执行时清空已累积的推理文字，只保留工具调用后的回答
            finalContent.setLength(0);
        }
    })
    .doOnComplete(() -> {
        // 流结束后发送 meta 事件，包含推荐的菜品 ID
        AiChatVO parsed = aiService.parseChatResponse(finalContent.toString());
        emitter.send(SseEmitter.event().name("meta").data(JSON.toJSONString(parsed)));
        emitter.complete();
    })
    .doOnError(error -> {
        emitter.send(SseEmitter.event().name("error").data("AI助手暂时不可用"));
        emitter.complete();
    })
    .subscribe();
    
    return emitter;
}
```

### SSE 事件类型

| event | data | 触发时机 |
|-------|------|----------|
| (无) | 文本片段 | 每个 Token，逐字流式输出 |
| `event: meta` | `{"reply":"...", "suggestedDishIds":[...], "suggestedDishNames":[...]}` | 流结束 |
| `event: error` | 错误消息文本 | 调用失败 |

### 前端 SSE 解析

```typescript
// UserAiChat.tsx 核心逻辑
// 使用 fetch + ReadableStream 手动解析 SSE
const reader = response.body!.getReader();
const decoder = new TextDecoder();
let leftover = '';

while (true) {
    const { done, value } = await reader.read();
    // 处理 SSE 格式：event: xxx / data: xxx / 空行分隔
    // 解析每行，按事件类型分发处理
}

// 流结束后，同步最终内容到 React state
```

### 工具调用时的文字处理

Agent 在调用 Tool 前会产生推理文字（如"我需要先查询一下..."）。当检测到 Tool 执行事件（非 START、非 END 的 NodeOutput），直接清空累积文字，确保用户只看到 Tool 调用后的最终回答。

---

## 同步对话 `POST /user/ai/chat`

```java
public AiChatVO chat(Long userId, String message, List<ChatMessage> history) {
    RunnableConfig config = RunnableConfig.builder()
        .threadId("user_" + userId).build();
    AssistantMessage response = agent.call(message, config);
    return parseChatResponse(response.getText());
}
```

### 响应解析

Agent 回复末尾的 `[id1,id2,...]` 格式被解析为推荐的菜品 ID 列表：

```java
// parseChatResponse()
int lastBracket = response.lastIndexOf('[');
if (lastBracket > 0) {
    String idsPart = response.substring(lastBracket, lastClose + 1);
    dishIds = JSON.parseArray(idsPart, Long.class);
    reply = response.substring(0, lastBracket).trim();
}
// 通过 dishIds 回填 dishNames
```

---

## AiChatVO 数据结构

```java
public class AiChatVO {
    private String reply;                 // 纯文本回复
    private List<Long> suggestedDishIds;  // 推荐的菜品 ID
    private List<String> suggestedDishNames; // 推荐的菜品名称
}
```

---

## 客服业务规划

在 [[技术选型]] 中规划的客服功能：

- **自然语言解析订单**：用户说"我昨天晚上的麻辣香锅怎么还没到"，AI 自动解析出用户ID、订单时间、意图
- **自动调用后台查询/操作**：AI 通过 Tool 调用订单查询、取消订单等接口
- **转人工机制**：AI 不可做决策（如退款），必须转人工处理
- **对话持久化**：使用 Pgsql 持久化对话记录

### 建议新增 Tool

在现有的 7 个菜品 Tool 基础上，扩展客服类 Tool：

| Tool | 功能 |
|------|------|
| `queryOrderStatus(orderNumber)` | 查询订单状态 |
| `queryUserOrders(userId, dateRange)` | 查询用户某时段订单 |
| `cancelOrder(orderId, reason)` | 取消订单（需人工确认） |
| `getEstimatedDelivery(orderId)` | 获取预计送达时间 |
