---
tags:
  - 苍穹外卖
  - AI
  - SpringAI
  - 数据分析
  - 管理端
notes:
---

## AI 数据分析（管理端）

管理端 AI 功能通过 `/admin/ai` 接口提供，包括**销售分析报告**、**菜单优化建议**和**菜品描述生成**。全部使用 ChatClient 结构化 JSON 模式。

---

## AI 销售分析 `GET /admin/ai/sales-analysis?days=7`

### 流程

```
Controller → Service.getSalesAnalysis(days)
  → 1. orderMapper.getSalesTop10(beginTime, endTime) 查询销量数据
  → 2. ChatClient 调用 AI 分析
  → 3. parseSalesAnalysisResponse() 解析 JSON
```

### AI Prompt

```
系统：你是一个专业的餐饮数据分析师。你必须只返回纯JSON格式的数据。

用户：近{days}天销量排行数据：[{name, number}, ...]

      请分析数据并返回JSON：
      {"summary":"总体分析",
       "highlights":["亮点1","亮点2"],
       "warnings":["预警1"],
       "suggestions":["建议1"],
       "trendDescription":"趋势描述"}
      只返回JSON。
```

### 响应结构

```java
public class AiSalesAnalysisVO {
    private String period;              // "近7天"
    private String summary;             // 总体分析（一段文字）
    private List<String> highlights;    // 亮点（如"麻辣香锅持续热销"）
    private List<String> warnings;      // 预警（如"酸菜鱼销量下滑"）
    private List<String> suggestions;   // 建议（如"加大川菜推广力度"）
    private String trendDescription;    // 趋势描述
}
```

### 降级

```java
// AI 调用失败时
AiSalesAnalysisVO.builder()
    .period("近" + days + "天")
    .summary("AI服务暂时不可用，无法生成分析报告。")
    .highlights(Collections.emptyList())
    .warnings(Collections.emptyList())
    .suggestions(Collections.emptyList())
    .build();
```

---

## AI 菜单建议 `GET /admin/ai/menu-suggestion`

### 流程

```
Controller → Service.getMenuSuggestion()
  → 1. 查询全部可售菜品 + 全部分类
  → 2. 构建 {name, categoryId, price} 列表 + 分类映射
  → 3. ChatClient 调用 AI 分析
  → 4. parseMenuSuggestionResponse() 解析
```

### AI Prompt

```
系统：你是一个专业的餐饮菜单顾问。你必须只返回纯JSON格式的数据。

用户：当前菜单数据：[{name, categoryId, price}, ...]
      分类映射：{"1":"川菜", "2":"湘菜", ...}

      请分析并返回JSON：
      {"promoteList":["应推广菜品"],
       "demoteList":["建议下架菜品"],
       "newCategoryIdeas":["建议新品类"],
       "summary":"总结建议"}
      只返回JSON。
```

### 响应结构

```java
public class AiMenuSuggestionVO {
    private List<String> promoteList;      // 应推广的菜品/策略
    private List<String> demoteList;       // 建议下架的菜品
    private List<String> newCategoryIdeas; // 建议新增的品类
    private String summary;                // 总结建议
}
```

### 前端展示

AdminAi 页面以卡片形式展示分析结果，分区显示：
- 应推广（绿色）
- 建议下架（红色）
- 建议新品类（蓝色）
- 总结文字（灰色背景）

---

## AI 菜品描述生成 `POST /admin/ai/dish-description`

### 流程

```
Controller → Service.generateDishDescription(name, categoryName, ingredients)
  → ChatClient 调用 AI
  → 返回 List<String>（3 句描述文案）
```

### 请求参数

```java
public class AiDishDescriptionDTO {
    private String name;              // 菜品名称，如"麻辣香锅"
    private String categoryName;      // 分类，如"川菜"
    private List<String> ingredients; // 食材列表，如["牛肉","辣椒","花椒"]
}
```

### AI Prompt

```
系统：你是一个专业的美食文案撰写师。你必须只返回纯JSON格式的数据。

用户：菜品名称：麻辣香锅
      分类：川菜
      食材：牛肉、辣椒、花椒

      请生成3句吸引人的菜品描述文案。返回JSON格式：
      ["描述1","描述2","描述3"]
      只返回JSON。
```

### 降级

```java
// AI 调用失败时返回通用文案
List.of(
    "精选优质食材，匠心烹制而成",
    "口感鲜美，回味无穷",
    "招牌推荐，不容错过"
);
```

### 前端交互

AdminAi 页面提供表单输入（菜品名、分类、食材），点击生成后显示 3 条文案：
- 菜品名称输入框
- 菜品分类输入框
- 食材输入框（逗号分隔，前端自动 split）
- 生成按钮（BrainCircuit 图标）
- 结果以灰色卡片逐条展示

---

## 前端 AdminAi 页面结构

```
AdminAi.tsx
├── 标题：AI 智能助手
└── 2 列网格布局
    ├── 左列：菜单优化建议卡片
    │   ├── 标题 + 描述
    │   ├── 生成按钮（Sparkles 图标）
    │   └── 结果展示（summary + promoteList + demoteList + newCategoryIdeas）
    └── 右列：菜品描述生成卡片
        ├── 标题 + 描述
        ├── 3 个输入框（菜名、分类、食材）
        ├── 生成按钮（BrainCircuit 图标）
        └── 3 条描述结果
```

---

## 与 C 端 AI 功能对比

| 维度 | C 端 AI | 管理端 AI |
|------|---------|-----------|
| API 前缀 | `/user/ai` | `/admin/ai` |
| 认证 | 用户 JWT | 员工 JWT |
| 模式 | ChatClient + ReactAgent | 仅 ChatClient |
| 主要功能 | 推荐、对话 | 分析、建议、生成 |
| 流式 | 支持（SSE） | 不支持 |
| 用户上下文 | 高（画像、历史、偏好） | 低（仅数据） |
