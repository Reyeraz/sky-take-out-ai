# AI 功能增强实施计划（基于 Spring AI + Spring AI Alibaba）

## 一、技术选型

| 组件 | 用途 | 版本 |
|------|------|------|
| **Spring AI** | 统一 AI 调用抽象层（ChatClient、结构化输出、Advisors） | 1.0.0 |
| **Spring AI Alibaba** | 阿里云 DashScope（通义千问）集成 | 1.0.0-M5 |
| Spring Boot | 已有，提供自动配置 | 3.5.13（已有） |
| Java | 已有 | 17（已有） |
| Redis (Jedis) | 已有，缓存 AI 结果 | 已有 |

### 为什么用 Spring AI + Spring AI Alibaba

1. **Spring AI** 提供统一的 `ChatClient` API，一行代码切换 OpenAI / DeepSeek / 通义千问 / Kimi 等任何兼容提供商
2. **结构化输出**（`BeanOutputConverter`）：直接让 LLM 返回 Java Bean，无需手动解析 JSON
3. **Advisors 机制**：后续可低成本扩展 RAG、对话记忆（`ChatMemory`）、安全护栏
4. **Spring AI Alibaba** 原生集成阿里云 DashScope（通义千问），适合国内部署场景
5. **Spring Boot Auto-configuration**：`application.yml` 一行配置即可切换模型，无需手动写 HTTP 客户端

---

## 二、依赖 & 配置

### 2.1 父 POM 新增依赖管理

在 `sky-take-out/pom.xml` 的 `<dependencyManagement>` 中添加：

```xml
<properties>
    <!-- 新增 -->
    <spring-ai.version>1.0.0</spring-ai.version>
    <spring-ai-alibaba.version>1.0.0-M5</spring-ai-alibaba.version>
</properties>

<dependencyManagement>
    <dependencies>
        <!-- 新增：Spring AI BOM -->
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>${spring-ai.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <!-- 新增：Spring AI Alibaba BOM -->
        <dependency>
            <groupId>com.alibaba.cloud.ai</groupId>
            <artifactId>spring-ai-alibaba-bom</artifactId>
            <version>${spring-ai-alibaba.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### 2.2 sky-server/pom.xml 新增依赖

```xml
<!-- Spring AI OpenAI Starter (支持 OpenAI 兼容接口: DeepSeek, Kimi, Qwen等) -->
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-openai-spring-boot-starter</artifactId>
</dependency>

<!-- Spring AI Alibaba Starter (阿里云 DashScope 通义千问) -->
<dependency>
    <groupId>com.alibaba.cloud.ai</groupId>
    <artifactId>spring-ai-alibaba-starter</artifactId>
</dependency>
```

### 2.3 application.yml 新增配置

```yaml
spring:
  ai:
    # 默认使用 DashScope（通义千问）
    dashscope:
      api-key: ${DASHSCOPE_API_KEY:}
      chat:
        options:
          model: qwen-plus
          temperature: 0.7
    # OpenAI 兼容接口（DeepSeek 等，作为备选）
    openai:
      api-key: ${OPENAI_API_KEY:}
      base-url: https://api.deepseek.com
      chat:
        options:
          model: deepseek-chat
          temperature: 0.7
```

### 2.4 application-dev.yml 新增配置

```yaml
spring:
  ai:
    dashscope:
      api-key: sk-your-dashscope-key-here
      chat:
        options:
          model: qwen-plus
          temperature: 0.7
    openai:
      api-key: sk-your-deepseek-key-here
      base-url: https://api.deepseek.com
      chat:
        options:
          model: deepseek-chat
```

---

## 三、新增文件清单

```
sky-server/src/main/java/com/sky/ai/
├── config/
│   └── AiConfig.java                    # ChatClient Bean 配置（注入哪个模型）
├── service/
│   ├── AiService.java                   # AI 服务接口
│   └── impl/
│       ├── AiRecommendServiceImpl.java   # 智能推荐实现
│       ├── AiChatServiceImpl.java        # 对话助手实现
│       └── AiAdminServiceImpl.java       # 管理端 AI 分析实现
└── controller/
    ├── user/
    │   └── AiController.java            # C 端 AI 接口
    └── admin/
        └── AiAdminController.java        # 管理端 AI 接口

sky-pojo/src/main/java/com/sky/
├── dto/
│   ├── AiChatDTO.java                   # AI 对话请求 DTO
│   └── AiDishDescriptionDTO.java        # 菜品描述生成请求 DTO
└── vo/
    ├── AiRecommendVO.java               # 推荐结果 VO
    ├── AiDailyVO.java                   # 今日推荐 VO
    ├── AiChatVO.java                    # 对话回复 VO
    ├── AiSalesAnalysisVO.java           # 销售分析 VO
    └── AiMenuSuggestionVO.java          # 菜单建议 VO
```

---

## 四、具体功能 & 接口

### 功能 1：C 端 — AI 智能推荐（核心）
**接口**: `POST /user/ai/recommend`

| 项 | 说明 |
|----|------|
| 认证 | 需要 JWT Token |
| 请求体 | 无（从 JWT 获取 userId） |
| Spring AI 用法 | `ChatClient` + `BeanOutputConverter<List<AiRecommendVO>>` 结构化返回 |

**流程**:
1. 从 `BaseContext.getCurrentId()` 获取 userId
2. 查询用户最近 30 天已完成订单 → 构建用户画像（常点分类、口味偏好、价格区间、时段偏好）
3. 查询当前起售菜品列表
4. 使用 `ChatClient` 发送 prompt，通过 `BeanOutputConverter` 自动反序列化为 `List<AiRecommendVO>`
5. 根据返回的 dishId 补充完整菜品信息返回

**降级方案**: LLM 调用失败时 → 返回用户历史订单中频次最高的 5 道菜品

---

### 功能 2：C 端 — 今日 AI 推荐
**接口**: `GET /user/ai/daily`

| 项 | 说明 |
|----|------|
| 认证 | 需要 JWT Token |
| 缓存 | Redis `ai:daily:YYYY-MM-DD`，当天有效 |

**流程**:
1. 先查 Redis 缓存，命中直接返回
2. 查询近期热销 Top10 + 新品（近 7 天上架）
3. 结合当前季节/时段构建 prompt 发送 LLM
4. 结构化输出 `List<AiDailyVO>`，写入 Redis 缓存

---

### 功能 3：C 端 — AI 点餐助手（对话式）
**接口**: `POST /user/ai/chat`

| 项 | 说明 |
|----|------|
| 请求体 | `AiChatDTO { message, history }` |
| Spring AI 用法 | `ChatClient` + Advisors 链（PromptAdvisor 注入菜品上下文） |

**流程**:
1. 接收用户消息 + 可选对话历史
2. 通过 `PromptAdvisor` 将当前可售菜品列表注入系统提示词
3. 调用 LLM 获取自然语言回复
4. 回复中如包含菜品名，自动附加 dishId 供前端跳转

---

### 功能 4：管理端 — AI 销售分析报告
**接口**: `GET /admin/ai/sales-analysis?days=7`

| 项 | 说明 |
|----|------|
| 参数 | `days`（默认 7，可选 30） |

**流程**:
1. 查询近 N 天销量/营业额/菜品排行（复用 `ReportService` 方法）
2. 将数据 + 提示词发送 LLM
3. 返回结构化分析报告（趋势、爆款、滞销预警、建议）

---

### 功能 5：管理端 — AI 菜单优化建议
**接口**: `GET /admin/ai/menu-suggestion`

**流程**:
1. 统计各菜品销量、估算利润
2. 发送 LLM 分析
3. 返回：应推广菜品、应下架菜品、建议新增品类

---

### 功能 6：管理端 — AI 生成菜品描述
**接口**: `POST /admin/ai/dish-description`

| 项 | 说明 |
|----|------|
| 请求体 | `AiDishDescriptionDTO { name, categoryName, ingredients }` |

**流程**:
1. 接收菜品基本信息
2. 发送 LLM 要求生成 2-3 句吸引人的菜品描述
3. 返回描述文案列表

---

## 五、代码架构

### 5.1 AiConfig.java — ChatClient Bean 配置

```java
@Configuration
public class AiConfig {

    // 默认使用 DashScope
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
            .defaultAdvisors(new SimpleLoggerAdvisor())  // 记录请求日志
            .build();
    }
}
```

> Spring AI Alibaba 自动配置会提供 `DashScopeChatModel` Bean；如果在 yaml 中配置了 openai 则提供 `OpenAiChatModel`。`ChatClient.Builder` 自动注入当前激活的 `ChatModel`。

### 5.2 AiRecommendServiceImpl — 结构化输出示例

```java
@Service
public class AiRecommendServiceImpl implements AiService {

    private final ChatClient chatClient;
    // Mapper 注入...

    public List<AiRecommendVO> recommend(Long userId) {
        // 1. 构建用户画像
        String userProfile = buildUserProfile(userId);
        // 2. 获取可用菜品
        String dishesJson = getAvailableDishesJson();

        // 3. Spring AI 结构化输出 — 一行代码搞定 JSON→Bean 转换
        return chatClient.prompt()
            .system("你是外卖推荐助手，只返回 JSON 格式数据")
            .user(u -> u.text("""
                用户偏好：{profile}
                可售菜品：{dishes}
                请推荐 5 道菜品。
                """, userProfile, dishesJson))
            .call()
            .entity(new ParameterizedTypeReference<List<AiRecommendVO>>() {});
    }
}
```

---

## 六、实施步骤

### 步骤 1：添加依赖
- 修改 `sky-take-out/pom.xml`：添加 `spring-ai-bom` 和 `spring-ai-alibaba-bom` 到 `<dependencyManagement>`
- 修改 `sky-server/pom.xml`：添加 `spring-ai-openai-spring-boot-starter` 和 `spring-ai-alibaba-starter`

### 步骤 2：添加配置
- 在 `application.yml` 添加 `spring.ai.dashscope` 和 `spring.ai.openai` 配置
- 在 `application-dev.yml` 添加实际 API Key（或通过环境变量注入）

### 步骤 3：创建 DTO/VO
在 `sky-pojo` 模块创建 6 个类：
- `AiChatDTO.java` — 对话请求（message + history）
- `AiDishDescriptionDTO.java` — 菜品描述生成请求
- `AiRecommendVO.java` — 推荐菜品（dishId, dishName, reason）
- `AiDailyVO.java` — 今日推荐（复用 AiRecommendVO 结构 + 日期）
- `AiChatVO.java` — 对话回复（reply + suggestedDishIds）
- `AiSalesAnalysisVO.java` — 销售分析（summary, highlights, warnings, suggestions）
- `AiMenuSuggestionVO.java` — 菜单建议（promoteList, demoteList, newCategoryIdeas）

### 步骤 4：创建 AiConfig
- `sky-server/.../ai/config/AiConfig.java` — ChatClient Bean 配置

### 步骤 5：实现 AI Service
- `AiService.java` 接口（推荐、今日推荐）
- `AiRecommendServiceImpl.java` — 实现推荐逻辑
- `AiChatServiceImpl.java` — 实现对话逻辑
- `AiAdminServiceImpl.java` — 实现分析/建议/描述生成逻辑

### 步骤 6：创建 Controller
- `com.sky.controller.user.AiController.java` — 3 个 C 端接口
- `com.sky.controller.admin.AiAdminController.java` — 3 个管理端接口
- 所有接口添加 Swagger `@Tag` / `@Operation` 注解

### 步骤 7：添加 Mapper 查询方法
- `OrderMapper` 新增：`getCompletedOrdersByUserId(Long userId, LocalDateTime startTime)`
- `OrderDetailMapper` 新增：`getByOrderIds(List<Long> orderIds)`
- 对应的 XML 映射文件

### 步骤 8：编译验证
- `mvn clean compile` 确认无编译错误
- 启动服务，通过 Swagger UI 测试各接口

---

## 七、降级策略

| 场景 | 处理方式 |
|------|----------|
| LLM API 不可达 | 返回基于规则的推荐（用户历史高频菜品 / 热销 topN） |
| LLM 返回格式异常 | 解析失败时降级为规则推荐，记录错误日志 |
| API Key 未配置 | 启动时警告日志，接口返回友好提示：`"AI 服务暂未配置，请联系管理员"` |
| 用户无历史订单 | 返回全站热销 topN 作为冷启动推荐 |

---

## 八、后续可扩展方向（本期不实现）

- **RAG 知识库**：将菜品信息、营养数据向量化，通过 `VectorStore` 做语义检索
- **多轮对话记忆**：使用 `ChatMemory` + `MessageChatMemoryAdvisor` 实现上下文连续对话
- **图像识别**：用户拍照 → 通义千问 VL 识别食材 → 推荐对应菜品
- **实时大屏**：WebSocket 推送 AI 实时销售数据 + 预测曲线
- **Spring AI Alibaba 更多能力**：Tongyi 语音合成（菜品播报）、文档解析（供应商合同）
