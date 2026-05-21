---
tags:
  - 苍穹外卖
  - AI
  - SpringAI
  - 架构
notes:
---

## AI 功能总览

所有 AI 功能通过 **Spring AI** 框架集成，底层大模型为 **阿里百炼 DashScope**（通义千问 qwen-plus）。

### AI 模块结构

```
com.sky.ai/
├── config/
│   └── AiConfig.java          # AI Bean 配置
├── service/
│   ├── AiService.java         # AI 服务接口（7个方法）
│   └── impl/
│       ├── AiRecommendServiceImpl.java  # 核心 AI 实现（605行）
│       ├── AiChatServiceImpl.java      # 对话委托
│       └── AiAdminServiceImpl.java     # 管理端委托
└── tool/
    └── DishTools.java         # ReAct Agent 的 7 个 @Tool 方法
```

### AI 接口一览

| 接口路径 | 方法 | 说明 |
|----------|------|------|
| `/user/ai/recommend` | POST | AI 智能推荐（个性化） |
| `/user/ai/daily` | GET | 今日 AI 推荐（全局） |
| `/user/ai/chat` | POST | AI 点餐助手对话（同步） |
| `/user/ai/chat/stream` | POST | AI 流式对话（SSE） |
| `/admin/ai/sales-analysis` | GET | AI 销售分析报告 |
| `/admin/ai/menu-suggestion` | GET | AI 菜单优化建议 |
| `/admin/ai/dish-description` | POST | AI 生成菜品描述 |

---

## 两种 AI 调用模式

### 模式一：ChatClient（结构化 JSON 任务）

用于需要**确定输出格式**的场景。系统 Prompt 强制要求 AI 只返回纯 JSON，不包含 Markdown 标记。

```java
// AiConfig.java - 创建 ChatClient Bean
@Bean
public ChatClient chatClient(ChatClient.Builder builder) {
    return builder.build();
}

// 使用示例：个性化推荐
String response = chatClient.prompt()
    .system("你是一个专业的外卖点餐推荐助手。你必须只返回纯JSON格式的数据...")
    .user("用户偏好：%s\n今日可售菜品：%s".formatted(userProfile, dishesJson))
    .call()
    .content();
// 然后用 fastjson2 解析 JSON 响应
```

适用场景：
- AI 智能推荐 → 返回 `{"recommendations":[{dishId, reason}]}`
- 每日推荐 → 返回 `{"slogan":"...", "recommendations":[...]}`
- 销售分析 → 返回 `{"summary":"...", "highlights":[...], ...}`
- 菜单建议 → 返回 `{"promoteList":[...], "demoteList":[...], ...}`
- 菜品描述 → 返回 `["描述1", "描述2", "描述3"]`

### 模式二：ReactAgent（对话式 Tool Calling）

用于**自由对话 + 按需查询**的场景。Agent 可以自主决定调用哪些 Tool，形成 ReAct 循环（思考 → 行动 → 观察）。

```java
// AiConfig.java - 创建 ReactAgent Bean
@Bean
public ReactAgent chatAgent(ChatClient chatClient, ToolCallback[] dishToolCallbacks) {
    return ReactAgent.builder()
        .name("sky_take_out_agent")
        .chatClient(chatClient)
        .tools(dishToolCallbacks)       // 注册 7 个 @Tool 方法
        .systemPrompt("""
            你是小苍，一个专业的外卖点餐助手...
            如果用户问到菜品相关问题，请先使用工具查询，再根据结果回答。
            回复时推荐了具体菜品，请在最后单独一行用JSON列出推荐菜品ID：[id1,id2,...]
            """)
        .saver(new MemorySaver())       // 对话记忆
        .build();
}

// ToolCallbacks 通过方法引用自动生成
@Bean
public ToolCallback[] dishToolCallbacks(DishTools dishTools) {
    return MethodToolCallbackProvider.builder()
        .toolObjects(dishTools)
        .build()
        .getToolCallbacks();
}
```

适用场景：
- AI 点餐助手对话（同步 + 流式）

---

## Redis 缓存策略

| 缓存 Key | TTL | 说明 |
|----------|-----|------|
| `ai:recommend:user_{userId}` | 3600s (1h) | 用户个性化推荐，降低 AI 调用成本 |
| `ai:daily:{date}` | 至午夜 00:00 | 每日推荐，当天不变 |
| 降级数据 | 600s (10min) | AI 调用失败时的 fallback 缓存 |

```java
// 每日推荐：TTL 精确计算到午夜
long secondsUntilMidnight = LocalDateTime.now().until(
    LocalDate.now().plusDays(1).atStartOfDay(), ChronoUnit.SECONDS);
redisTemplate.opsForValue().set(cacheKey, JSON.toJSONString(dailyVO), 
    secondsUntilMidnight, TimeUnit.SECONDS);
```

---

## 降级机制（Fallback）

**所有 AI 调用均有 try-catch 降级处理**，确保大模型服务不可用时系统仍可正常运行：

| 功能 | 降级策略 |
|------|----------|
| 个性化推荐 | 查询用户历史订单 → 取常点菜品 Top 5；新用户则取热销 Top 5 |
| 每日推荐 | 取近 7 天热销 Top 6，slogan 固定为"今日精选推荐" |
| 点餐对话 | 返回"AI 助手暂时不可用，请稍后再试。" |
| 销售分析 | 返回 summary="AI 服务暂时不可用" |
| 菜单建议 | 返回空列表 + summary="AI 服务暂时不可用" |
| 菜品描述 | 返回 3 句通用文案 |

---

## 用户画像构建

`buildUserProfile()` 方法分析用户近 30 天订单，提取：

- **常点菜品**：Top 5 菜名
- **偏好分类**：通过菜品 → 分类映射获取分类名称
- **消费区间**：最低 ~ 最高消费
- **偏好时段**：早餐（<10点）、午餐（10-14点）、晚餐（>14点）
- **历史订单数**

```java
// 画像输出示例
"常点菜品：麻辣香锅、宫保鸡丁、酸菜鱼、小炒肉、蒜蓉西兰花；
 偏好分类：川菜、湘菜；
 消费区间：¥25 ~ ¥88；
 偏好时段：午餐；
 历史订单数：15"
```

画像作为用户 prompt 的一部分传给 AI，实现个性化推荐。
