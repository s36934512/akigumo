# Akigumo

Akigumo 是一個以 **Archive、Concept（Ontology）與圖形關聯** 為核心的全端內容管理系統。使用者可以管理檔案與內容、建立概念及其關係，並透過搜尋與圖形視覺化探索資料。

專案採用 Angular 前端、Hono / TypeScript 後端，以及獨立的 Python Graph Refinement Worker。PostgreSQL 保存主要領域資料與工作流程狀態，Neo4j 管理圖形關係，Redis 負責非同步訊息與快取，Meilisearch 提供全文搜尋。

> 目前以 [`develop` 分支](https://github.com/s36934512/akigumo/tree/develop) 作為主要開發版本。功能與介面仍在持續演進中。

## 目錄

- [功能概覽](#功能概覽)
- [系統架構](#系統架構)
- [技術組成](#技術組成)
- [環境需求](#環境需求)
- [使用 Dev Container（建議）](#使用-dev-container建議)
- [手動設定開發環境](#手動設定開發環境)
- [啟動與服務入口](#啟動與服務入口)
- [常用指令](#常用指令)
- [專案結構](#專案結構)
- [資料與可靠性設計](#資料與可靠性設計)

## 功能概覽

### Archive 管理

- 以 Archive 組織內容與檔案，支援檔案上傳及內容瀏覽。
- 提供 Archive 詳細資料與結構檢視。
- 支援 Archive 與 Concept 的關聯管理。
- 提供 Trash、刪除與還原流程，讓刪除操作具備可追蹤的生命週期。
- 前端提供檔案拖放上傳、檔案瀏覽與詳細資訊介面。

### Concept / Ontology 管理

- 建立及管理 Concept。
- 建立 Concept 之間的成對關係。
- 將 Concept 關聯至 Archive，並依 Concept 查詢相關 Archive。
- 透過 Neo4j 保存及查詢圖形關係。

### 搜尋

- 使用 Meilisearch 建立 Archive 與 Concept 的獨立搜尋索引。
- 透過 Search Sync 工作流程同步索引資料。
- 將索引同步工作與主要資料操作分離，支援失敗重試。

### 非同步工作處理

- 以持久化 Workflow 管理跨步驟工作。
- 透過 Outbox 將資料庫交易與非同步工作發布銜接。
- 使用 Redis Streams 傳遞 Graph Refinement 工作及結果。
- 以可重試、冪等的處理方式應對重複投遞及暫時性故障。

## 系統架構

```text
┌───────────────────────────────┐
│       Angular Frontend        │
│ Explorer / Archive / Ontology │
└───────────────┬───────────────┘
                │ HTTP / SSE / Tus
                ▼
┌───────────────────────────────┐
│       Hono + TypeScript       │
│ API / Domain Modules          │
│ Workflow / Kernel / Outbox    │
└───────┬──────────┬────────────┘
        │          │
        ▼          ▼
   PostgreSQL   Redis / Redis Streams
   Domain data       │
   Workflow state   │
   Outbox            ▼
              ┌──────────────────┐
              │  Python Worker  │
              │ Graph Refinement│
              └────────┬─────────┘
                       │
                       ▼
                     Neo4j

   Hono Backend ───────────────► Meilisearch
                   Search Sync
```

各元件的主要責任：

| 元件 | 責任 |
|---|---|
| Angular | Archive 瀏覽、上傳、Concept 管理與使用者互動 |
| Hono | HTTP API、模組註冊及應用程式啟動 |
| PostgreSQL | Archive、File、Concept、Deletion、Workflow 與 Outbox 等持久化資料 |
| Neo4j | Concept、Archive 等資料的圖形關係與圖形查詢 |
| Redis | 非同步工作訊息、Redis Streams 與快取 |
| Python Worker | 消費 Graph Refinement 工作並執行圖形處理 |
| Meilisearch | Archive 與 Concept 搜尋索引 |

## 技術組成

| 區域 | 技術 | 用途 |
|---|---|---|
| 前端 | Angular 22、TypeScript、RxJS | SPA 介面與互動 |
| UI | Optimus UI、Angular CDK、Tailwind CSS、SCSS | 元件、互動及樣式 |
| 前端資料 | TanStack Angular Query、Zod、Orval | API 查詢、資料驗證與 API client 產生 |
| 檔案上傳 | Uppy、Tus | 檔案上傳流程 |
| 圖形視覺化 | Cytoscape.js、cytoscape-cola | 圖形呈現與配置 |
| 後端 | Node.js、Hono、TypeScript、Zod OpenAPI | HTTP API 與應用程式服務 |
| 工作流程 | XState 5、Outbox、Kernel | 持久化工作流程與非同步任務執行 |
| 關聯式資料庫 | PostgreSQL 18、Prisma 7 | 領域資料與工作狀態 |
| 圖形資料庫 | Neo4j | 圖形關係 |
| 訊息與快取 | Redis 8、Redis Streams | 非同步訊息與快取 |
| 搜尋 | Meilisearch | 搜尋索引與查詢 |
| Python Worker | Python 3.13+、Pydantic、Redis、Neo4j Driver、structlog | 圖形工作處理 |
| 開發環境 | Docker Compose、VS Code Dev Containers | 開發容器與基礎設施 |

## 環境需求

- Git
- Docker Desktop，或支援 Docker Compose 的環境
- VS Code 與 Dev Containers 擴充套件（若使用建議的開發方式）
- Node.js / npm（手動設定時使用）
- Python 3.13 或更新版本（手動設定時使用）

## 使用 Dev Container（建議）

Repository 已提供 Dev Container 設定。Dev Container 會啟動 workspace 與所需基礎設施，並透過初始化腳本安裝前後端及 Python 依賴、產生 Prisma Client、執行資料庫 migration。

1. Clone 專案：

   ```bash
   git clone https://github.com/s36934512/akigumo.git
   cd akigumo
   ```

2. 建立本機環境設定：

   ```bash
   cp .env.example .env
   ```

   請依需求調整 PostgreSQL、Neo4j 與 Meilisearch 設定。範例中的帳密僅供本機開發使用，不應直接用於正式環境。

3. 使用 VS Code 開啟專案資料夾，執行 **Dev Containers: Reopen in Container**。

4. 等待 `.devcontainer/setup.sh` 完成。初始化程序會安裝 root、frontend、backend 的 npm dependencies，執行 Prisma generate / migrate，並建立 `python/.venv` 及安裝 Python 專案。

5. 在 workspace 終端機啟動所有開發程序：

   ```bash
   npm run dev
   ```

根目錄的 `npm run dev` 會透過 concurrently 同時啟動 Backend、Frontend 與 Python Worker，並以不同名稱標示各程序輸出。

## 手動設定開發環境

以下指令以 repository 根目錄為起點。若使用 Dev Container，通常不需要另外執行這些步驟。

### 1. 設定環境變數

```bash
cp .env.example .env
```

請確認 `.env` 中的 PostgreSQL、Neo4j、Meilisearch 帳密與本機環境一致。

### 2. 啟動基礎設施

```bash
docker compose up -d postgres redis redis-cache neo4j meilisearch
```

Compose 會啟動以下服務：

- PostgreSQL
- Redis（訊息與工作流程使用）
- Redis Cache
- Neo4j（含 APOC plugin）
- Meilisearch

### 3. 安裝 Node.js 依賴

在 repository 根目錄執行：

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 4. 設定資料庫

```bash
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
```

### 5. 建立 Python 虛擬環境並安裝依賴

在 repository 根目錄執行：

```bash
python3.13 -m venv python/.venv
python/.venv/bin/python -m pip install --upgrade pip
python/.venv/bin/python -m pip install -e ./python
```

若作業系統的 Python 3.13 執行檔名稱不同，請調整第一行命令。根目錄的開發啟動腳本預期 Python 環境位於 `python/.venv`。

## 啟動與服務入口

### 一次啟動所有開發程序

完成依賴安裝與基礎設施啟動後，在 repository 根目錄執行：

```bash
npm run dev
```

此命令會同時啟動三個程序：

| 程序 | 執行內容 | 說明 |
|---|---|---|
| Backend | `npm run dev:backend` | Hono API，使用 tsx watch |
| Frontend | `npm run dev:frontend` | Angular development server |
| Worker | `npm run dev:worker` | Python Graph Refinement Worker |

### 個別啟動

也可以在 repository 根目錄分別執行：

```bash
npm run dev:backend
npm run dev:frontend
npm run dev:worker
```

### 本機服務入口

| 服務 | 位址 |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:3000/api/v1 |
| OpenAPI 文件 | http://localhost:3000/api/v1/doc |
| Neo4j Browser | http://localhost:7474 |
| Meilisearch | http://localhost:7700 |

前端目前主要路由：

| 路由 | 頁面 |
|---|---|
| `/explorer` | Archive 瀏覽 |
| `/ontology` | Concept / Ontology 管理 |
| `/archive/:archiveId` | Archive 詳細資料 |
| `/trash` | Archive Trash |

## 常用指令

在 repository 根目錄執行：

| 指令 | 用途 |
|---|---|
| `npm run dev` | 同時啟動 Backend、Frontend、Python Worker |
| `npm run dev:backend` | 僅啟動 Backend |
| `npm run dev:frontend` | 僅啟動 Frontend |
| `npm run dev:worker` | 僅啟動 Python Worker |

Backend（`backend/`）：

| 指令 | 用途 |
|---|---|
| `npm run dev` | 以 tsx watch 啟動後端 |
| `npm run build` | TypeScript build |
| `npm start` | 執行編譯後的 `dist/index.js` |
| `npm run prisma:generate` | 產生 Prisma Client |
| `npm run prisma:migrate` | 套用已建立的 Prisma migrations |

Frontend（`frontend/`）：

| 指令 | 用途 |
|---|---|
| `npm start` | 啟動 Angular development server |
| `npm run build` | 建置前端 |
| `npm test` | 執行前端測試 |
| `npm run api:gen` | 執行 Orval API client 產生流程 |

Python（repository 根目錄）：

| 指令 | 用途 |
|---|---|
| `python/.venv/bin/python python/main.py` | 啟動 Graph Refinement Worker |
| `python/.venv/bin/python -m pip install -e ./python` | 安裝 Python 專案依賴 |

## 專案結構

以下列出主要目錄，細部模組請以 repository 目前內容為準。

```text
akigumo/
├── .devcontainer/
│   ├── devcontainer.json     # Dev Container 設定
│   ├── Dockerfile            # Workspace image
│   └── setup.sh              # 開發環境初始化
├── backend/
│   ├── prisma/
│   │   └── models/           # Prisma schema、models 與 migrations
│   └── src/
│       ├── api/              # API 共用程式
│       ├── app/              # Bootstrap、module registration
│       ├── config/           # 後端設定
│       ├── contracts/        # 跨模組資料契約
│       ├── infrastructure/   # PostgreSQL、Redis、Neo4j、SSE 等整合
│       ├── kernel/           # Task dispatch 與 execution
│       ├── modules/
│       │   ├── archive/      # Archive、上傳、Trash、刪除與還原
│       │   ├── graph/        # Graph 相關功能
│       │   ├── ontology/     # Concept / Ontology 管理
│       │   ├── search/       # 搜尋與索引同步
│       │   └── system/       # 系統功能
│       ├── schema/           # 共用 schema
│       ├── utils/            # 工具程式
│       └── workflow/         # Workflow 執行與狀態管理
├── frontend/
│   └── src/
│       ├── app/              # App、路由與 Layout
│       ├── entities/         # 領域實體
│       ├── features/         # 上傳、刪除、還原、Concept 等功能
│       ├── pages/            # Explorer、Archive、Ontology、Trash 頁面
│       ├── shared/           # 共用程式
│       ├── types/            # 型別定義
│       └── widgets/          # 組合式 UI 區塊
├── python/
│   ├── graph_refinement/     # Graph Refinement 工作處理
│   ├── infrastructure/       # Python 端基礎設施整合
│   ├── main.py               # Worker 入口
│   └── pyproject.toml        # Python 專案設定
├── scripts/
│   └── dev.sh                # 同時啟動三個開發程序
├── compose.yaml              # Workspace 與基礎設施服務
├── package.json              # Root scripts
└── README.md
```

## 資料與可靠性設計

### 資料職責分離

- **PostgreSQL 是主要持久化資料來源**：保存領域資料、工作流程狀態及 Outbox 記錄。
- **Neo4j 專責圖形關係**：用於圖形關聯的建立與查詢，不取代 PostgreSQL 的主要領域資料。
- **Redis Streams 負責工作訊息傳遞**：讓後端與 Python Worker 能以非同步方式協作。
- **Meilisearch 保存搜尋索引**：索引透過同步工作更新，與主要領域資料分開管理。

### Workflow、Outbox 與重試

系統使用持久化 Workflow 與 Outbox 協調跨元件工作。資料庫中的 Outbox 記錄可作為待發布工作的持久化依據；Worker 與消費端則需要考慮訊息重複投遞、處理中斷及重試。

因此，非同步工作採用 **at-least-once** 的處理思維，而不是假設每個工作只會執行一次。需要重試的操作應設計冪等性，並以明確的工作識別資訊關聯請求、執行結果與 Workflow 狀態。

### Archive 刪除與還原

Archive 刪除流程與實際資料永久移除分開處理。刪除操作會進入 Trash / Deletion 流程，並可透過還原操作恢復；永久刪除則應與一般刪除區分。檔案是否能移除，也必須考慮是否仍被其他 Archive 引用。

---

Akigumo 仍在持續開發中。README 會隨主要開發流程更新；實際功能、設定與執行方式請以 [`develop` 分支原始碼](https://github.com/s36934512/akigumo/tree/develop) 為準。
