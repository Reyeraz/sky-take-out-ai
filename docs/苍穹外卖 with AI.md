---
tags:
  - 苍穹外卖
  - AI
  - SpringAI
  - 项目
notes:
---

## 苍穹外卖 AI 版

基于原版[苍穹外卖](https://www.bilibili.com/video/BV1TP411v7v6)（黑马程序员）的全栈升级版本，集成 Spring AI + 阿里百炼 DashScope（通义千问），打造智能餐饮管理与点餐系统。

代码仓库：`C:\Users\co_an\IdeaProjects\sky-take-out-ai`

---

## 与原版的改进对比

### 前端

| 维度 | 原版 | 本版 |
|------|------|------|
| **框架** | Vue 2 + Element UI | React 19 + TypeScript |
| **样式** | CSS / Element UI 主题 | Tailwind CSS 4 |
| **构建** | Webpack (Vue CLI) | Vite 6 |
| **类型** | JavaScript（无类型） | TypeScript（编译期检查） |
| **路由** | Vue Router（管理端/用户端分离） | React Router 7（单 SPA 双端路由） |
| **图表** | ECharts | Recharts |
| **动画** | 无 | Motion 动效库 |
| **图标** | Element UI 内置 | Lucide React |

### 后端

| 维度 | 原版 | 本版 |
|------|------|------|
| **Spring Boot** | 2.x | 3.5.13 |
| **JDK** | 8/11 | 17 |
| **API 文档** | Knife4j (Swagger 2) | Knife4j + SpringDoc OpenAPI 3 |
| **JWT** | jjwt 0.9.x | jjwt 0.12.6 |
| **JSON** | fastjson | fastjson2 |
| **AI** | 无 | Spring AI + 阿里百炼 DashScope (qwen-plus) |

### 新增 AI 功能

| 功能 | 端 | 说明 |
|------|-----|------|
| **AI 智能推荐** | 用户端 | 基于用户画像的个性化菜品推荐 |
| **每日 AI 推荐** | 用户端 | 今日主题标语 + 6 道推荐菜品 |
| **AI 点餐助手** | 用户端 | ReAct Agent 对话，支持 Tool Calling 查询菜品 |
| **AI 流式对话** | 用户端 | SSE 流式输出，实时打字效果 |
| **AI 销售分析** | 管理端 | AI 分析销售数据，生成运营洞察 |
| **AI 菜单建议** | 管理端 | AI 分析菜单结构，提供优化方案 |
| **AI 菜品描述** | 管理端 | AI 自动生成菜品营销文案 |

---

## 文档索引

- [[AI功能总览与架构]]
- [[AI智能推荐]]
- [[AI点餐助手与客服]]
- [[AI数据分析]]
- [[技术选型]]
