# Akigumo

**Akigumo** 是一個以檔案管理與知識關聯為核心的全端內容管理系統，主要用於整理漫畫及其他數位檔案。

除了基本的檔案管理，系統也引入 Concept（概念）與 Ontology（本體）來描述內容之間的關係，並透過圖形資料庫建立可查詢的知識網絡。

專案採用 Angular、Hono、PostgreSQL、Neo4j 等技術，並透過 Workflow、Outbox 與 Redis Streams 協調跨服務的非同步工作。

> 專案目前仍在積極開發中，部分功能尚未完成。以下功能說明以目前 develop 分支的實作狀態為準。

## Features

### Archive Management

- 透過 Archive 組織與管理檔案。
- 支援檔案上傳與拖放操作。
- 瀏覽 Archive 內容及詳細資訊。
- 管理 Archive 與 Concept 之間的關聯。
- 支援 Archive 刪除、Trash 與還原流程。
- 提供檔案與 Archive 的生命週期管理。

### Concept & Ontology

- 建立、編輯及刪除 Concept。
- 建立 Concept 之間的關聯。
- 將 Concept 與 Archive 連結。
- 查詢 Concept 所關聯的 Archive。
- 使用 Neo4j 管理及查詢圖形關係。
- 透過圖形視覺化探索概念之間的關聯。

### Search

- 使用 Meilisearch 提供全文搜尋。
- 分別管理 Archive 與 Concept 搜尋索引。
- 透過非同步同步流程更新搜尋資料。
- 將搜尋索引與主要領域資料分離。

## Architecture

```text
                 Angular Frontend
          Explorer / Archive / Concept
                       |
                  HTTP / SSE / Tus
                       |
                       v
              Hono + TypeScript
          +------------------------+
          |      API Layer         |
          |    Domain Modules      |
          |    Workflow Engine     |
          |    Outbox Processing   |
          +------------------------+
               |       |       |
               v       v       v
          PostgreSQL  Redis  Meilisearch
               |       |
               |       | Redis Streams
               |       v
               |   Python Worker
               |       |
               |       v
               |     Neo4j
               |
         Domain Data
         Workflow State
         Outbox Records
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| Angular | 使用者介面、Archive 瀏覽、檔案管理及 Concept 操作 |
| Hono | HTTP API、業務邏輯與模組整合 |
| PostgreSQL | 主要領域資料、Workflow 狀態與 Outbox |
| Neo4j | Concept、Archive 及其圖形關係 |
| Redis | 非同步訊息、Redis Streams 與快取 |
| Python Worker | Graph Refinement 工作處理 |
| Meilisearch | 全文搜尋與索引管理 |

### Data Ownership

系統將不同類型的資料分配給適合的儲存系統：

- **PostgreSQL**：主要資料來源（Source of Truth），負責領域資料與交易一致性。
- **Neo4j**：負責圖形關係的建立與查詢。
- **Redis**：負責訊息傳遞、工作佇列與快取。
- **Meilisearch**：負責搜尋索引，不作為主要資料來源。

這種設計讓各個元件能夠獨立負責不同工作，同時降低系統之間的耦合。

## Reliability Design

### Workflow & Outbox

系統使用 Workflow 與 Outbox 管理跨服務的非同步工作。

主要流程：

1. 在 PostgreSQL 交易中保存領域資料與待處理工作。
2. Outbox 負責追蹤尚未發布的工作。
3. 透過 Redis Streams 傳遞工作訊息。
4. Worker 接收訊息並執行對應工作。
5. 處理結果回傳後更新 Workflow 狀態。

透過這種方式，避免資料庫交易完成後，因訊息發布失敗而遺失後續工作。

### Idempotency & Retry

由於非同步訊息可能重複投遞，系統採用 At-least-once 的處理策略。

- 需要重試的操作必須考慮冪等性。
- Neo4j 使用 MERGE 避免重複建立相同關係。
- Workflow 保存工作執行狀態。
- 失敗的工作依照重試策略重新執行。
- 超過重試限制後標記為失敗，避免無限重試。

### Archive Lifecycle

Archive 的刪除與檔案實體的永久刪除分開處理。

- Archive 刪除後進入 Trash。
- 支援從 Trash 還原 Archive。
- 永久刪除與一般刪除分離。
- File 的移除需要考慮是否仍被其他 Archive 引用。

## Tech Stack

| Category | Technology |
|---|---|
| Frontend | Angular 22, TypeScript |
| UI | Optimus UI, Angular CDK, Tailwind CSS, SCSS |
| State / Data Fetching | TanStack Angular Query, RxJS |
| API Client | Orval, Zod |
| File Upload | Uppy, Tus |
| Graph Visualization | Cytoscape.js, cytoscape-cola |
| Backend | Node.js, Hono, TypeScript |
| API Documentation | Zod OpenAPI |
| Workflow | XState 5 |
| ORM | Prisma 7 |
| Relational Database | PostgreSQL 18 |
| Graph Database | Neo4j |
| Message Broker / Cache | Redis 8, Redis Streams |
| Search Engine | Meilisearch |
| Worker | Python 3.13+, Pydantic, Neo4j Driver |
| Infrastructure | Docker Compose, Caddy |
| Development | VS Code Dev Containers |

## Project Structure

```text
akigumo/
├── .devcontainer/           # Dev Container configuration
├── backend/
│   ├── prisma/              # Database schema and migrations
│   └── src/
│       ├── api/             # API utilities
│       ├── app/             # Application bootstrap
│       ├── config/          # Configuration
│       ├── contracts/       # Shared contracts
│       ├── infrastructure/  # Database and external services
│       ├── kernel/          # Task execution
│       ├── modules/
│       │   ├── archive/     # Archive and file management
│       │   ├── graph/       # Graph operations
│       │   ├── ontology/    # Concept management
│       │   ├── search/      # Search synchronization
│       │   └── system/      # System modules
│       ├── workflow/         # Workflow management
│       └── index.ts         # Application entry point
│
├── frontend/
│   └── src/
│       ├── app/             # Application and routing
│       ├── entities/        # Domain entities
│       ├── features/        # Feature modules
│       ├── pages/           # Page components
│       ├── shared/          # Shared utilities
│       ├── types/           # Type definitions
│       └── widgets/         # UI composition
│
├── python/
│   ├── graph_refinement/    # Graph refinement logic
│   ├── infrastructure/      # Infrastructure integration
│   ├── main.py              # Worker entry point
│   └── pyproject.toml
│
├── scripts/
│   └── dev.sh               # Development process launcher
│
├── compose.yaml             # Development environment
├── compose.prod.yaml        # Production environment
├── Caddyfile
├── package.json
└── README.md
```

## Getting Started

### Requirements

- Git
- Docker Desktop / Docker Engine
- Docker Compose
- VS Code
- VS Code Dev Containers Extension

### 1. Clone Repository

```bash
git clone https://github.com/s36934512/akigumo.git
cd akigumo
```

### 2. Configure Environment

```bash
cp .env.example .env
```

依照需求調整 `.env` 中的 PostgreSQL、Neo4j、Meilisearch 等設定。

### 3. Open Dev Container

使用 VS Code 開啟專案，執行：

```text
Dev Containers: Reopen in Container
```

初始化程序會安裝：

- Root npm dependencies
- Frontend npm dependencies
- Backend npm dependencies
- Prisma Client 與資料庫 Migration
- Python dependencies

Python 環境透過 `uv sync` 建立。

### 4. Start Development

在 Dev Container 的終端機執行：

```bash
npm run dev
```

根目錄的啟動指令會同時啟動：

- Backend
- Frontend
- Python Worker

也可以個別啟動：

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:worker
```

## Services

### Development Environment

開發環境使用 Docker Compose 管理基礎設施。

```bash
docker compose up -d
```

主要服務：

| Service | Description |
|---|---|
| PostgreSQL | Relational database |
| Redis | Message processing |
| Redis Cache | Cache storage |
| Neo4j | Graph database |
| Meilisearch | Search engine |
| Caddy | Development reverse proxy |
| pgAdmin | PostgreSQL administration |
| RedisInsight | Redis monitoring and management |

### Service Endpoints

| Service | URL |
|---|---|
| Application (Caddy) | http://localhost:8421 |
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| OpenAPI Documentation | http://localhost:3000/api/v1/doc |
| Neo4j Browser | http://localhost:7474 |
| Meilisearch | http://localhost:7700 |
| pgAdmin | http://localhost:5050 |
| RedisInsight | http://localhost:5540 |

部分服務使用 Docker Compose 內部網路通訊，並非全部直接對外開放。

## Useful Commands

### Root

| Command | Description |
|---|---|
| `npm run dev` | Start all development processes |
| `npm run dev:backend` | Start backend |
| `npm run dev:frontend` | Start frontend |
| `npm run dev:worker` | Start Python worker |

### Backend

在 `backend/` 目錄執行：

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build TypeScript |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Apply database migrations |

### Frontend

在 `frontend/` 目錄執行：

| Command | Description |
|---|---|
| `npm start` | Start Angular development server |
| `npm run build` | Build frontend |
| `npm test` | Run tests |
| `npm run api:gen` | Generate API client |

## Production Deployment (尚未完成)

專案提供獨立的 `compose.prod.yaml`，用於正式環境部署。

正式環境設定範例：

```bash
cp .env.prod.example .env.prod
```

調整正式環境所需的資料庫帳密、Meilisearch 金鑰及 Docker Hub 映像設定後，執行：

```bash
docker compose \
  -f compose.prod.yaml \
  --env-file .env.prod \
  up -d
```

正式環境包含：

- PostgreSQL
- Redis
- Redis Cache
- Neo4j
- Meilisearch
- Backend
- Python Worker
- Caddy / Frontend

正式環境應使用獨立且安全的帳密，並妥善保存持久化資料。

---

## License

License 尚未指定。

---

**Akigumo** — Organize files, connect concepts, and explore relationships.