# 苍穹外卖 AI 版 (Sky Take-Out AI)

基于原版[苍穹外卖](https://www.bilibili.com/video/BV1TP411v7v6)（黑马程序员）的全栈升级版本，集成 AI 大模型能力，打造智能餐饮管理与点餐系统。

***

## 与原版苍穹外卖的改进对比

### 一、前端技术栈全面升级

| 维度        | 原版                        | 本版                                    |
| --------- | ------------------------- | ------------------------------------- |
| **框架**    | Vue 2 + Element UI        | **React 19** + TypeScript             |
| **样式方案**  | CSS / Element UI 主题       | **Tailwind CSS 4** 原子化样式              |
| **构建工具**  | Webpack (Vue CLI)         | **Vite 6**（极速 HMR）                    |
| **类型系统**  | JavaScript（无类型）           | **TypeScript**（编译期类型检查）               |
| **路由**    | Vue Router（管理端 / 用户端分离项目） | **React Router 7**（管理端 + 用户端合为单一 SPA） |
| **图表**    | ECharts                   | **Recharts**（React 原生图表）              |
| **动画**    | 无                         | **Motion** 动效库                        |
| **图标**    | Element UI 内置             | **Lucide React**                      |
| **AI 前端** | 无                         | Google Gemini SDK（`@google/genai`）    |

### 二、后端技术栈迭代

| 维度              | 原版                              | 本版                                   |
| --------------- | ------------------------------- | ------------------------------------ |
| **Spring Boot** | 2.x                             | **3.5.13**                           |
| **JDK**         | 8 / 11                          | **17**                               |
| **API 文档**      | Knife4j (Swagger 2)             | **Knife4j + SpringDoc OpenAPI 3**    |
| **JWT**         | jjwt 0.9.x                      | **jjwt 0.12.6**                      |
| **JSON**        | fastjson                        | **fastjson2**                        |
| **数据库连接池**      | Druid (spring-boot 2.x starter) | **Druid spring-boot-3-starter**      |
| **AI 后端**       | 无                               | **Spring AI + 阿里百炼 DashScope**（通义千问） |
| **敏感配置**        | 硬编码 YAML 中                      | **系统环境变量**                           |

### 三、新增 AI 智能功能

| 功能模块             | 说明                               |
| ---------------- | -------------------------------- |
| **AI 智能聊天**（用户端） | 用户可与 AI 交流点餐建议、菜品推荐              |
| **AI 数据分析**（管理端） | AI 辅助分析销售数据、运营洞察                 |
| **AI 菜单建议**      | 基于 AI 的菜品搭配与套餐推荐                 |
| **后端 AI 问答**     | Spring AI 集成 DashScope，支持服务端智能问答 |

### 四、架构与开发体验

| 维度          | 原版                       | 本版                                            |
| ----------- | ------------------------ | --------------------------------------------- |
| **前后端部署**   | Nginx 静态托管 + Spring Boot | **Vite 开发服务器**（端口 3000）+ Spring Boot（端口 8080） |
| **环境变量管理**  | 明文写在 YAML 中              | **系统环境变量**（`BAILIAN_API_KEY`、`WEB_CONNENT` 等） |
| **代码质量**    | 无 TypeScript             | **TypeScript** 编译时检查                          |
| **SPA 一体化** | 管理端/用户端独立构建部署            | **单项目双端路由**（`/admin` + `/user`）               |
| **热更新**     | Webpack HMR              | **Vite HMR**（毫秒级）                             |

***

## 项目结构

```
sky-take-out-ai/
├── backfront/sky-take-out/          # 后端 Maven 多模块项目
│   ├── sky-common/                  # 公共模块：工具类、异常、JWT、常量
│   ├── sky-pojo/                    # 数据对象：Entity、DTO、VO
│   ├── sky-server/                  # 主服务：Controller、Service、Mapper、配置
│   │   └── src/main/resources/
│   │       ├── application.yml              # 主配置（占位符引用）
│   │       └── application-dev.yml          # 开发环境配置（系统变量引用）
│   └── pom.xml                      # 父 POM
├── front/                           # 前端 React SPA 项目
│   ├── src/
│   │   ├── pages/                   # 页面组件
│   │   │   ├── admin/               # 管理端页面
│   │   │   └── *.tsx                # 用户端页面
│   │   ├── layouts/                 # 布局组件
│   │   ├── api/                     # API 客户端
│   │   └── App.tsx                  # 路由入口
│   ├── .env.example                 # 环境变量模板
│   ├── vite.config.ts               # Vite 配置
│   └── package.json
├── .gitignore
└── README.md
```

***

## 功能概览

### 管理端 (`/admin`)

- 仪表盘 — 核心数据看板
- 员工管理 — 账号 CRUD、状态管理
- 分类管理 — 菜品/套餐分类
- 菜品管理 — 菜品 CRUD、图片上传
- 套餐管理 — 套餐组合管理
- 订单管理 — 订单查看、状态流转
- 数据报表 — 销售统计图表（Recharts）
- **AI 分析** — AI 辅助运营决策
- 店铺管理 — 店铺信息设置

### 用户端 (`/user`)

- 首页 — 菜品/套餐浏览
- 菜品浏览 — 分类筛选
- **AI 聊天** — 智能点餐助手
- 购物车 — 添加/修改/删除
- 下单结算 — 地址选择、下单
- 订单管理 — 订单状态跟踪
- 地址簿 — 收货地址管理
- 个人中心 — 用户信息

***

## 部署指南

### 环境要求

| 依赖          | 版本要求 | 说明          |
| ----------- | ---- | ----------- |
| **JDK**     | 17+  | 后端运行环境      |
| **Maven**   | 3.8+ | 后端构建        |
| **Node.js** | 18+  | 前端运行环境      |
| **npm**     | 9+   | 前端包管理       |
| **MySQL**   | 8.0+ | 主数据库        |
| **Redis**   | 7.0+ | 缓存与 Session |

### 一、系统环境变量配置

在操作系统（或 IDE）中设置以下环境变量：

| 变量名                | 说明                     | 示例值                   |
| ------------------ | ---------------------- | --------------------- |
| `WEB_CONNENT`      | 数据库 / Redis 主机地址       |  `localhost`          |
| `BAILIAN_API_KEY`  | 阿里百炼 DashScope API Key | `sk-xxxxxxxxxxxxxxxx` |
| `DEEPSEEK_API_KEY` | DeepSeek API Key（预留）   | `sk-xxxxxxxxxxxxxxxx` |

**Windows（系统环境变量）：**

```
setx WEB_CONNENT "your-db-host"
setx BAILIAN_API_KEY "your-bailian-key"
```

**macOS / Linux：**

```bash
export WEB_CONNENT="your-db-host"
export BAILIAN_API_KEY="your-bailian-key"
```

### 二、数据库初始化

1. 在 MySQL 中创建数据库：

```sql
CREATE DATABASE sky_take_out DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

1. 导入原版苍穹外卖的 SQL 初始化脚本（含建表与初始数据）。
2. 确认 `application-dev.yml` 中的连接配置与你的环境一致。

### 三、后端启动

```bash
# 进入后端项目目录
cd backfront/sky-take-out

# 编译打包（跳过测试）
mvn clean package -DskipTests

# 启动服务
cd sky-server
mvn spring-boot:run
```

后端启动后访问：

- API 服务：`http://localhost:8080`
- API 文档（Knife4j）：`http://localhost:8080/swagger-ui.html`
- OpenAPI 3 文档：`http://localhost:8080/v3/api-docs`

### 四、前端启动

```bash
# 进入前端目录
cd front

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端开发服务器：`http://localhost:3000`

### 五、生产构建

**前端构建：**

```bash
cd front
npm run build
# 产物在 dist/ 目录
```

**后端构建：**

```bash
cd backfront/sky-take-out
mvn clean package -DskipTests
# jar 包在 sky-server/target/
```

将前端 `dist/` 部署到 Nginx，后端 `jar` 使用 `java -jar` 运行。Nginx 需配置反向代理将 `/api` 请求转发至后端 8080 端口。

### 六、完整访问地址

| 页面        | URL                                     |
| --------- | --------------------------------------- |
| 用户端首页     | `http://localhost:3000/user`            |
| 用户登录      | `http://localhost:3000/login`           |
| 管理端登录     | `http://localhost:3000/admin/login`     |
| 管理端首页     | `http://localhost:3000/admin`           |
| 后端 API 文档 | `http://localhost:8080/swagger-ui.html` |

***

## 技术栈速览

**前端**
React 19 · TypeScript 5.8 · Vite 6 · Tailwind CSS 4 · React Router 7 · Recharts · Axios · Motion · Lucide React · Google GenAI

**后端**
Spring Boot 3.5 · Java 17 · MyBatis 3.0 · Druid 1.2 · Redis (Jedis) · Spring AI · Knife4j · SpringDoc OpenAPI 3 · jjwt 0.12 · Apache POI 5.3 · FastJSON2

**AI 能力**
Spring AI · 阿里百炼 DashScope (qwen-plus) · Google Gemini

***

## 安全提示

- 所有敏感配置已改用系统环境变量，请勿将真实 Key 硬编码到配置文件中
- 数据库密码、Redis 密码建议也改用环境变量（当前 `application-dev.yml` 中仍为明文，待替换）
- JWT `admin-secret-key` 建议改用环境变量，生产环境使用高强度的随机密钥
- 前端 `.env.local` 不会被 Git 追踪（已配置 `.gitignore`）

