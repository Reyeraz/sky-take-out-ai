---
tags:
  - 苍穹外卖
  - AI
  - SpringAI
  - 推荐系统
notes:
---

## AI 智能推荐

AI 推荐系统有两个接口：**个性化推荐**（按用户）和**每日推荐**（全局统一）。

---

## 个性化推荐 `POST /user/ai/recommend`

### 整体流程

```
前端请求 → Controller → Service.recommend(userId)
  → 1. 检查 Redis 缓存 (key: "ai:recommend:user_{userId}")
  → 2. 缓存未命中 → buildUserProfile(userId) 构建用户画像
  → 3. getAvailableDishesJson() 获取今日可售菜品
  → 4. ChatClient.prompt() 调用 AI
  → 5. parseRecommendResponse() 解析 JSON 响应
  → 6. 写入 Redis（TTL=3600s）
  → 7. AI 调用失败 → fallbackRecommend() 降级
```

### 用户画像构建

参见 [[AI功能总览与架构#用户画像构建]]，核心逻辑：
- 取近 30 天已完成订单
- 统计菜品频次 → Top 5
- 映射分类偏好
- 分析消费区间和时段偏好

### AI Prompt

```
系统：你是一个专业的外卖点餐推荐助手。你必须只返回纯JSON格式的数据，
      不要包含任何解释或markdown标记。

用户：用户偏好：{常点菜品、偏好分类、消费区间、偏好时段、历史订单数}
      今日可售菜品（JSON格式）：[{dishId, name, category, price, description}, ...]

      请根据用户偏好和可售菜品，推荐5道菜品。返回格式：
      {"recommendations":[{"dishId":数字,"reason":"推荐理由"}]}
      只返回JSON，不要其他内容。
```

### 响应解析

```java
// parseRecommendResponse() 核心逻辑
1. JSON.parseObject(response).getJSONArray("recommendations") 
   → 转为 List<AiRecommendVO>
2. 从 dishesJson 构建 Map<Long, Dish> 用于回填 dishName/price/image
3. 过滤掉 AI 返回了但数据库中不存在的 dishId
```

### 降级推荐

```java
// fallbackRecommend()
if (用户无历史订单) {
    // 返回近30天全站热销 Top 5，reason = "近期热销"
} else {
    // 返回用户历史常点菜品 Top 5，reason = "根据您的点单习惯推荐"
}
```

### Redis 缓存策略

| 场景 | Key | TTL | 原因 |
|------|-----|-----|------|
| AI 调用成功 | `ai:recommend:user_{userId}` | 3600s (1h) | 平衡新鲜度与成本 |
| AI 调用失败（降级数据） | 同上 | 600s (10min) | 降级数据可能不准确，短 TTL |

---

## 每日推荐 `GET /user/ai/daily`

### 与个性化推荐的区别

| 维度 | 个性化推荐 | 每日推荐 |
|------|-----------|----------|
| 输入 | 用户画像 | 热销数据 |
| 输出数量 | 5 道 | 6 道 |
| 主题标语 | 无 | 有 slogan |
| 缓存 Key | 按用户 | 按日期 |
| TTL | 1 小时 | 至午夜 |
| 用户相关 | 是 | 否（全局统一） |

### 整体流程

```
Controller → Service.getDailyRecommend()
  → 1. 检查 Redis (key: "ai:daily:{today}")
  → 2. getAvailableDishesJson() + getHotDishesJson()
  → 3. ChatClient 调用 AI（数据中花括号需转义）
  → 4. parseDailyResponse() 解析
  → 5. 写入 Redis（TTL = 到午夜的秒数）
```

### AI Prompt

```
系统：你是一个专业的外卖推荐助手。你必须只返回纯JSON格式的数据。

用户：今日可售菜品：{JSON数组}
      近期热销菜品：{JSON数组}

      请为今天推荐一个主题标语和6道推荐菜品。返回格式：
      {"slogan":"今日主题标语","recommendations":[{"dishId":数字,"reason":"推荐理由"}]}
      只返回JSON，不要其他内容。
```

### 降级策略

```java
// fallbackDailyRecommend()
slogan = "今日精选推荐"
recommendations = 近7天热销 Top 6，reason = "近期热销"
```

---

## AiRecommendVO 数据结构

```java
public class AiRecommendVO {
    private Long dishId;        // 菜品 ID
    private String dishName;    // 菜品名称（由 Service 回填）
    private String image;       // 菜品图片（由 Service 回填）
    private BigDecimal price;   // 价格（由 Service 回填）
    private String reason;      // AI 生成的推荐理由
    private String categoryName;// 分类名称
}
```

> dishId 和 reason 由 AI 返回，dishName/price/image 由后端从数据库回填，防止 AI 编造不存在的数据。
