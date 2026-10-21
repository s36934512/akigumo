# Akigumo

Akigumo 是一個以 **Archive、Concept 與圖形關聯** 為核心的全端內容管理系統。專案結合 Angular 前端、Hono/TypeScript 後端，以及負責圖形處理的 Python worker，並以 PostgreSQL、Neo4j 和 Redis 支援持久化資料與非同步工作流程。

目前主要開發分支為 [`develop`](https://github.com/s36934512/akigumo/tree/develop)，功能仍在持續開發中。

## 目錄

- [主要功能與架構](#主要功能與架構)
- [技術組成](#技術組成)
- [環境需求](#環境需求)
- [本機開發設定](#本機開發設定)
- [啟動服務](#啟動服務)
- [常用開發指令](#常用開發指令)
- [專案結構](#專案結構)
- [架構原則](#架構原則)

## 主要功能與架構

- **Archive**：管理內容與檔案，並支援上傳流程。
- **Concept / Ontology**：以概念與語意關係組織內容，支援圖形關聯相關操作。
- **非同步工作流程**：使用持久化 Outbox、task/processor 與 workflow result，將長時間或可重試的工作從 HTTP request 流程中分離。
- **Graph Refinement**：由 Python worker 消費 Redis Streams 工作，執行圖形相關處理並將結果回傳後端。
- **即時同步**：後端透過 SSE 傳送前端需要的更新事件。
- **可重試的工作處理**：系統採用 at-least-once 的非同步處理模型，需透過識別碼與冪等處理應對重複投遞或重試。

### 高階架構

```text
┌──────────────────────┐
│ Angular Frontend     │
│ Archive / Concept UI │
└──────────┬───────────┘
           │ HTTP / SSE
           ▼
┌──────────────────────┐
│ Hono + TypeScript    │
│ API / Workflows      │
│ Outbox / Kernel      │
└─────┬────────┬───────┘
      │        │
      ▼        ▼
 PostgreSQL   Redis Streams
 durable      async messages
 state           │
                 ▼
        ┌──────────────────┐
        │ Python Worker    │
        │ Graph Refinement │
        └────────┬─────────┘
                 │
                 ▼
               Neo4j
         graph relationships
```

## 技術組成

| 區域 | 技術 | 用途 |
|---|---|---|
| 前端 | Angular、TypeScript、RxJS | 使用者介面與互動 |
| 前端資料與 API | TanStack Angular Query、Zod、Orval | 查詢狀態、資料驗證與 API client 產生 |
| 上傳 | Uppy、Tus | 檔案上傳與可續傳流程 |
| 後端 | Node.js、Hono、TypeScript | HTTP API 與應用程式執行環境 |
| 工作流程 | XState、Outbox、Kernel | 持久化工作流程與非同步工作處理 |
| 關聯式資料庫 | PostgreSQL、Prisma | 持久化領域資料與 workflow/outbox 狀態 |
| 圖形資料庫 | Neo4j | 圖形關係與圖形操作 |
| 訊息與快取 | Redis、Redis Streams | 非同步訊息處理與快取 |
| Python worker | Python、Redis、Neo4j driver、Pydantic、structlog | 消費圖形工作並處理結果 |
| 開發環境 | Docker Compose、VS Code Dev Containers | 啟動本機基礎設施與開發容器 |

## 環境需求

- Git
- Node.js 與 npm（版本需求請配合目前 Angular/Node 工具鏈）
- Python **3.13 或更新版本**
- Docker Desktop 或可執行 Docker Compose 的環境

## 本機開發設定

以下指令以 repository 根目錄 `akigumo/` 為起點。若你使用 VS Code Dev Container，也可以先透過 **Dev Containers: Reopen in Container** 開啟開發環境。

### 1. 取得專案

```bash
git clone https://github.com/s36934512/akigumo.git
cd akigumo
```

### 2. 設定環境變數

根目錄提供 `.env.example`，複製成 `.env`：

```bash
cp .env.example .env
```

請依本機環境調整資料庫與 Neo4j 帳密。`.env` 是本機設定檔，不要提交真實密碼或其他機密資訊。

### 3. 啟動基礎設施

在 repository 根目錄執行：

```bash
docker compose up -d postgres redis redis-cache neo4j
```

Compose 服務使用 `.env` 中的設定。若你選擇使用完整的 Dev Container 工作環境，可改用 VS Code 的 Dev Containers 流程。

### 4. 安裝後端依賴並準備資料庫

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
```

### 5. 安裝前端依賴

另開終端機，在 repository 根目錄執行：

```bash
cd frontend
npm install
```

### 6. 安裝 Python worker 依賴

在 repository 根目錄執行：

```bash
python -m pip install -e ./python
```

如果你的系統使用 `python3` 作為 Python 3.13 的命令，請將上述 `python` 換成 `python3`。

## 啟動服務

開發時需要分別啟動前端、後端與 Python worker。請讓三個程序各自運行在獨立終端機中，並先確認 PostgreSQL、Redis、Redis Cache 與 Neo4j 已啟動。

### 後端（Hono）

```bash
cd backend
npx tsx src/index.ts
```

後端目前監聽 `0.0.0.0:3000`。

### 前端（Angular）

```bash
cd frontend
npm start -- --host 0.0.0.0 --allowed-hosts
```

前端開發伺服器預設使用 `4200` port。`--host 0.0.0.0` 可讓伺服器從容器或其他裝置連線；`--allowed-hosts` 是額外傳給 Angular CLI 的開發伺服器選項。

### Python Graph Refinement Worker

請在 repository 根目錄執行：

```bash
python ./python/main.py
```

此程序會啟動 Graph Refinement Worker，從 Redis Streams 消費工作、執行圖形處理，並將結果發布回 Redis。啟動前請確認 Python 依賴及 Redis、Neo4j 連線設定已完成。

### 本機服務入口

| 服務 | 位址 |
|---|---|
| 前端 | `http://localhost:4200` |
| 後端 API | `http://localhost:3000` |
| OpenAPI 文件 | `http://localhost:3000/api/v1/doc` |
| Neo4j Browser | `http://localhost:7474` |

以上位址以目前的本機開發設定為準；若修改 Compose、port 或環境設定，請同步調整。

## 常用開發指令

### Backend

在 `backend/` 目錄中執行：

| 指令 | 用途 |
|---|---|
| `npx tsx src/index.ts` | 直接啟動後端 |
| `npm run dev` | 以 `tsx watch` 啟動並監看檔案變更 |
| `npm run build` | 執行 TypeScript build |
| `npm start` | 執行編譯後的 `dist/index.js` |
| `npm run prisma:generate` | 產生 Prisma Client |
| `npm run prisma:migrate` | 套用 Prisma migrations |

### Frontend

在 `frontend/` 目錄中執行：

| 指令 | 用途 |
|---|---|
| `npm start -- --host 0.0.0.0 --allowed-hosts` | 啟動可從外部連線的 Angular dev server |
| `npm start` | 啟動 Angular dev server |
| `npm run build` | 建置前端 |
| `npm test` | 執行前端測試 |
| `npm run api:gen` | 執行 Orval API client 產生流程 |

### Python

在 repository 根目錄執行：

| 指令 | 用途 |
|---|---|
| `python ./python/main.py` | 啟動 Graph Refinement Worker |
| `python -m pip install -e ./python` | 安裝 Python 專案及其相依套件 |

## 專案結構

```text
akigumo/
├── .devcontainer/        # VS Code Dev Container 設定
├── backend/
│   ├── prisma/           # Prisma schema 與 migrations
│   └── src/
│       ├── api/          # API 相關程式
│       ├── app/          # 應用程式 bootstrap
│       ├── contracts/    # 跨模組資料契約
│       ├── infrastructure/ # 資料庫、Redis、SSE 等基礎設施
│       ├── kernel/       # 非同步工作執行機制
│       ├── modules/      # 依功能切分的後端模組
│       └── workflow/     # Workflow 執行與狀態管理
├── frontend/
│   └── src/
│       ├── app/          # Angular app 與路由
│       ├── entities/     # 領域實體與資料存取
│       ├── features/     # 使用者功能
│       ├── pages/        # 頁面
│       ├── shared/       # 共用工具與 API
│       └── widgets/      # 組合式 UI 區塊（依目前程式為準）
├── python/
│   ├── graph_refinement/ # Graph Refinement Worker 與處理流程
│   ├── infrastructure/   # Python 端資料庫與訊息佇列整合
│   ├── main.py           # Python worker 入口
│   └── pyproject.toml    # Python 專案與依賴
├── compose.yaml          # PostgreSQL、Redis、Neo4j 與 workspace
├── .env.example          # 本機環境變數範本
└── README.md
```

## 架構原則

- **Backend — Vertical Slice Architecture**：以領域功能切分模組，讓 API、workflow 與 processor 的責任盡量留在所屬功能範圍內。
- **Frontend — Feature-Sliced Design（FSD）**：依 app、pages、features、entities、shared 等層級組織程式碼，避免同層 feature 彼此直接依賴。
- **PostgreSQL 管理持久化狀態**：領域資料、workflow 狀態與 Outbox 記錄由關聯式資料庫持久化。
- **Neo4j 管理圖形關係**：圖形關係由圖形資料庫負責，不以 PostgreSQL 複製一份完整圖形狀態。
- **非同步工作使用明確契約**：透過 Outbox、task、processor 與 workflow result 傳遞工作及結果。
- **採用 at-least-once 語意**：不能假設工作只會執行一次；需要重試的處理應設計冪等性。
- **基礎設施與領域流程分離**：Kernel 提供工作執行能力，功能模組負責領域行為。

---

Akigumo 目前仍在積極開發中；實際可用功能、設定與模組結構請以 [`develop` 分支的原始碼](https://github.com/s36934512/akigumo/tree/develop) 為準。
