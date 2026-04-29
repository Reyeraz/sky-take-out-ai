# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Backend (from backfront/sky-take-out/)
mvn clean compile -q                     # full project compile
mvn compile -pl sky-server -am -q        # compile only sky-server + deps
mvn spring-boot:run -pl sky-server       # start backend on :8080

# Frontend (from front/)
npm install                              # install dependencies
npm run dev                              # Vite dev server on :3000
npm run lint                             # tsc --noEmit type check
npm run build                            # production build to dist/

# Backend API docs (when running)
# http://localhost:8080/swagger-ui.html
# http://localhost:8080/v3/api-docs
```

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `WEB_CONNENT` | MySQL + Redis host address |
| `BAILIAN_API_KEY` | Alibaba Bailian DashScope API key (for AI features) |
| `DASHSCOPE_API_KEY` | Alternative DashScope key name |

Database: MySQL `sky_take_out`, user `root`. Redis on the same host. The `application-dev.yml` overrides the placeholder configs from `application.yml` with concrete values (host from `WEB_CONNENT`, hardcoded credentials).

## Architecture

**Backend** (`backfront/sky-take-out/`) — Maven multi-module, Java 17, Spring Boot 3.5.13:

- `sky-common` — shared utils, JWT, exception hierarchy, `Result<T>` response wrapper, `BaseContext` (thread-local user ID holder)
- `sky-pojo` — all DTOs, VOs, Entity classes (Lombok-based, no logic)
- `sky-server` — main Spring Boot app, contains ALL business logic:
  - `com.sky.controller.admin` / `controller.user` — REST controllers, split into two API groups (Swagger tags: 管理端接口 / 用户端接口)
  - `com.sky.service` / `service.impl` — service interfaces + implementations
  - `com.sky.mapper` — MyBatis mapper interfaces (XML in `resources/mapper/`)
  - `com.sky.ai.config` — AI bean wiring (ChatClient, ReactAgent, ToolCallbacks)
  - `com.sky.ai.tool.DishTools` — `@Tool`-annotated methods that the Agent can call (DB queries)
  - `com.sky.config.WebMvcConfiguration` — CORS, JWT interceptors, Swagger, custom Jackson ObjectMapper (FastJSON2-backed)
  - `com.sky.task` — `@Scheduled` tasks: order status processing, WebSocket broadcast

**Frontend** (`front/`) — React 19 + TypeScript + Vite 6 + Tailwind CSS 4:

- Single SPA with two route groups under `App.tsx`:
  - `/admin/*` → `AdminLayout` (sidebar nav) → pages in `pages/admin/`
  - `/user/*` → `UserLayout` (bottom tab bar) → pages at `pages/` root
- `api/client.ts` — Axios instance, injects `token` header from localStorage, unwraps `Result<T>` (expects `code === 1`)
- State is local `useState` per page; no global store

**AI Architecture (key design decisions):**

- `AiConfig` creates two beans: `ChatClient` (for structured JSON-prompt tasks) and `ReactAgent` (for conversational chat with tool calling)
- Structured tasks (`recommend`, `getDailyRecommend`, `getSalesAnalysis`, `getMenuSuggestion`, `generateDishDescription`) use `ChatClient` with pre-loaded data + strict JSON output format
- Conversational chat (`chat`, `chatStream`) uses `ReactAgent` with 7 `@Tool` methods in `DishTools` — the agent dynamically queries dishes, categories, and sales data via the ReAct loop
- `agent.call(message, config)` for sync chat; `agent.stream(message, config)` returns `Flux<NodeOutput>` for SSE streaming
- Streaming: `StreamingOutput` wraps LLM text chunks (extract via `getOriginData()` → `AssistantMessage` or `ChatResponse`); non-streaming `NodeOutput` marks tool execution transitions
- Conversation memory per user: `RunnableConfig.threadId("user_" + userId)` + `MemorySaver`
- All AI calls have try-catch fallbacks returning canned responses when the AI service is unavailable
- Daily recommendations cached in Redis with TTL to midnight

**JWT Auth flow:** All `/admin/**` and `/user/**` paths are intercepted by `JwtTokenAdminInterceptor`, which reads the `token` header, validates the JWT, and sets the user/employee ID into `BaseContext`.

## Important Constraints

- Redis config MUST use `spring.data.redis.*` prefix — `spring.redis.*` was removed in Spring Boot 3.5 and is silently ignored
- Datasource config MUST use `spring.datasource.druid.*` (not bare `spring.datasource.*`) for Druid auto-configuration
- `spring.main.allow-circular-references=true` is set in application.yml — the project may have circular Spring bean dependencies; removing this could break startup
- The request body `@RequestBody` deserialization uses a custom `JacksonObjectMapper` (with FastJSON2 backing). Ensure DTO inner classes are `public static`. Chinese text in request bodies works correctly (curl encoding issues are a client-side problem, not the app)
