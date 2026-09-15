# Akigumo

Full-stack web application built with **Angular, Hono, TypeScript, and Docker**.

本專案以現代前後端分離架構開發，Frontend 使用 Angular，Backend 使用 Hono，並透過 Docker Compose 與 Dev Container 建立一致的開發環境。

---

## Overview

Akigumo 是一個前後端分離的 Full-stack Web Application，主要目標是建立一套容易開發、測試與部署的專案架構。

目前專案已完成：

* Angular Frontend
* Hono Backend API
* Frontend / Backend API 串接
* Docker Compose 開發環境
* VS Code Dev Container
* 自動安裝 Root、Frontend、Backend dependencies
* Health Check API
* GitHub 專案管理

---

## Tech Stack

### Frontend

* Angular 22
* TypeScript
* RxJS
* Angular Router
* Angular SSR
* Vitest

### Backend

* Hono
* TypeScript
* Node.js
* `@hono/node-server`
* tsx

### Development Environment

* Docker
* Docker Compose
* VS Code Dev Containers
* Node.js 22
* npm

### Code Quality

* Biome
* TypeScript

---

## Architecture

```text
┌──────────────────────────────┐
│          Browser             │
│                              │
│      http://localhost:4200   │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│       Angular Frontend       │
│                              │
│       Port: 4200             │
│                              │
│       /api/**                │
└──────────────┬───────────────┘
               │
               │ Angular Dev Proxy
               │
               ▼
┌──────────────────────────────┐
│        Hono Backend          │
│                              │
│       Port: 3000             │
│                              │
│       GET /api/health        │
└──────────────────────────────┘
```

Frontend 開發環境透過 Angular Proxy 將 `/api/**` request 轉送至 Hono Backend。

例如：

```text
Browser
  ↓
http://localhost:4200/api/health
  ↓
Angular Dev Proxy
  ↓
http://localhost:3000/api/health
  ↓
Hono
```

Backend 目前提供 Health Check API：

```http
GET /api/health
```

Response：

```json
{
  "status": "ok",
  "service": "backend"
}
```

---

## Project Structure

```text
akigumo/
├── .devcontainer/
│   └── devcontainer.json
│
├── .vscode/
│
├── backend/
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   ├── proxy.conf.json
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── biome.json
├── compose.yaml
├── package.json
├── package-lock.json
└── README.md
```

---

## Development Environment

本專案使用 **Docker Compose + VS Code Dev Container** 建立開發環境。

Docker Compose 提供：

* Node.js 22 開發環境
* Frontend `4200` port
* Backend `3000` port
* `/workspace` 專案目錄掛載

```yaml
services:
  workspace:
    image: mcr.microsoft.com/devcontainers/javascript-node:22
    volumes:
      - .:/workspace:cached
    working_dir: /workspace
    command: sleep infinity
    ports:
      - "4200:4200"
      - "3000:3000"
```

Dev Container 建立完成後，會自動安裝：

```text
Root dependencies
Frontend dependencies
Backend dependencies
```

因此不需要每次建立新的開發環境後，再手動進入每個資料夾執行 `npm install`。

---

## Getting Started

### Requirements

建議使用：

* Docker Desktop
* Visual Studio Code
* Dev Containers extension
* Git

如果使用 Dev Container，Node.js 與 npm 已由 Container 提供，不需要在主機額外安裝 Node.js。

---

## Run with Dev Container

### 1. Clone the repository

```bash
git clone https://github.com/s36934512/akigumo.git
cd akigumo
```

### 2. Open with Visual Studio Code

```bash
code .
```

### 3. Reopen in Container

在 VS Code 中：

```text
Ctrl + Shift + P
```

選擇：

```text
Dev Containers: Reopen in Container
```

第一次建立 Container 時，會自動執行 dependencies installation。

---

## Start Backend

進入 Backend：

```bash
cd backend
```

啟動 development server：

```bash
npm run dev
```

Backend 預設執行於：

```text
http://localhost:3000
```

Health Check：

```text
http://localhost:3000/api/health
```

---

## Start Frontend

另外開啟一個 Terminal：

```bash
cd frontend
```

啟動 Angular development server：

```bash
npm start
```

Frontend 預設執行於：

```text
http://localhost:4200
```

開啟：

```text
http://localhost:4200
```

即可使用 Frontend。

---

## API

### Health Check

```http
GET /api/health
```

Response：

```json
{
  "status": "ok",
  "service": "backend"
}
```

這個 endpoint 可用於確認 Backend Server 是否正常運作。

---

## Development Commands

### Root

安裝 Root dependencies：

```bash
npm install
```

---

### Frontend

安裝 dependencies：

```bash
cd frontend
npm install
```

啟動 development server：

```bash
npm start
```

Build：

```bash
npm run build
```

Test：

```bash
npm test
```

---

### Backend

安裝 dependencies：

```bash
cd backend
npm install
```

Development：

```bash
npm run dev
```

Build：

```bash
npm run build
```

Production start：

```bash
npm start
```

---

## Frontend API Proxy

Frontend 開發環境使用 Angular Proxy：

```text
frontend/proxy.conf.json
```

設定：

```json
{
  "/api/**": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

因此 Frontend 不需要直接將 API URL 寫成：

```text
http://localhost:3000/api/health
```

而是可以使用：

```text
/api/health
```

由 Angular Development Server 負責轉送至 Backend。

這樣可以讓 Frontend 與 Backend 的 API 路徑保持一致，也降低開發環境中的 CORS 與 URL 設定問題。

---

## Environment Configuration

敏感或環境相關設定不直接提交至 Git。

`.gitignore` 會排除：

```text
.env
.env.*
```

同時保留：

```text
.env.example
```

因此未來如果需要加入 API URL、Database connection 或其他環境設定，可以使用：

```text
.env.example
```

提供其他開發者需要設定的變數名稱，而不暴露實際敏感資訊。

---

## Git & GitHub

本專案使用 Git 進行版本控制，並託管於 GitHub。

Repository：

https://github.com/s36934512/akigumo

GitHub Repository：

```text
s36934512/akigumo
```

專案採用：

```text
main
```

作為主要 branch。

---

## Docker Development Workflow

整體開發流程：

```text
GitHub
   │
   │ git clone
   ▼
Local Project
   │
   │ VS Code
   ▼
Dev Container
   │
   ├── Angular
   │     └── :4200
   │
   └── Hono
         └── :3000
```

透過 Dev Container，可以讓不同電腦上的開發環境維持一致，降低 Node.js 版本或系統環境造成的問題。

---

## Current Status

### Completed

* [x] Angular Frontend
* [x] Hono Backend
* [x] Frontend / Backend API communication
* [x] Health Check API
* [x] Docker Compose development environment
* [x] VS Code Dev Container
* [x] Automatic dependency installation
* [x] GitHub repository
* [x] `.gitignore` configuration

### Planned

* [ ] Expand backend API
* [ ] Connect frontend features with backend services
* [ ] Add automated tests
* [ ] Improve error handling
* [ ] Add production Docker configuration
* [ ] Add Docker image build
* [ ] Add GitHub Actions CI/CD
* [ ] Deploy production environment

---

## Why This Project

這個專案除了實作 Web Application 本身，也著重於完整的開發流程：

```text
Frontend
    ↓
Backend API
    ↓
Docker
    ↓
Dev Container
    ↓
Git
    ↓
GitHub
    ↓
CI/CD
    ↓
Production
```

目標是建立一個可以從本機開發、版本控制，到後續自動化建置與部署的完整 Full-stack 開發流程。

---

## License

This project is for learning and portfolio purposes.
