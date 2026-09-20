# Akigumo

Full-stack web application built with **Angular, Hono, TypeScript, and Docker**.

Akigumo is a TypeScript-based full-stack application designed with a focus on **clear architecture, reproducible development environments, and maintainable system boundaries**.

The project uses Angular for the frontend, Hono for the backend API, and Docker Compose with VS Code Dev Containers to provide a consistent development environment.

---

## Overview

Akigumo is a full-stack web application developed with a separated frontend and backend architecture.

The project focuses not only on application features, but also on establishing a development and backend architecture that is:

* Easy to run from a clean environment
* Reproducible across development machines
* Clearly separated by responsibility
* Suitable for incremental development and refactoring
* Maintainable as the system grows

The current project includes:

* Angular frontend
* Hono backend API
* Frontend / Backend API communication
* Docker Compose development environment
* VS Code Dev Container
* Automatic dependency installation
* Environment variable configuration
* Backend health check API
* Git-based version control
* GitHub repository

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
* Node.js 22
* `@hono/node-server`
* `tsx`

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

## Application Overview

The current application uses a separated frontend and backend architecture.

```text
┌──────────────────────────────┐
│           Browser            │
│                              │
│      http://localhost:4200   │
└──────────────┬───────────────┘
               │
               │ HTTP
               ▼
┌──────────────────────────────┐
│      Angular Frontend        │
│                              │
│          Port 4200            │
│                              │
│          /api/**              │
└──────────────┬───────────────┘
               │
               │ Angular Dev Proxy
               ▼
┌──────────────────────────────┐
│        Hono Backend          │
│                              │
│          Port 3000            │
│                              │
│       GET /api/health        │
└──────────────────────────────┘
```

During development, the Angular development server proxies `/api/**` requests to the Hono backend.

For example:

```text
Browser
   │
   │ http://localhost:4200/api/health
   ▼
Angular Dev Proxy
   │
   │ http://localhost:3000/api/health
   ▼
Hono Backend
```

This allows frontend code to use the same `/api/**` path regardless of the backend's development port.

---

## Project Structure

The project is organized into separate frontend and backend applications.

```text
akigumo/
├── .devcontainer/
│   └── devcontainer.json
│
├── .vscode/
│
├── backend/
│   ├── src/
│   ├── .env.example
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

The backend is being developed incrementally around explicit application, configuration, infrastructure, and runtime responsibilities rather than relying on a single application layer.

As the architecture evolves, detailed architecture documentation will be maintained separately from this README.

---

## Development Environment

Akigumo uses **Docker Compose + VS Code Dev Containers** to provide a consistent development environment.

The development container provides:

* Node.js 22
* Frontend port `4200`
* Backend port `3000`
* `/workspace` project directory
* A consistent Node.js development environment

The current Compose configuration is conceptually:

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

When the Dev Container is created, the configured `postCreateCommand` automatically installs dependencies for:

```text
Root
Frontend
Backend
```

This allows a clean checkout of the repository to be prepared without manually entering each project directory and running `npm install`.

---

## Requirements

Recommended tools:

* Docker Desktop
* Visual Studio Code
* Dev Containers extension
* Git

When using the Dev Container, Node.js and npm are provided by the container, so they do not need to be installed separately on the host machine.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/s36934512/akigumo.git
cd akigumo
```

### 2. Open the project with Visual Studio Code

```bash
code .
```

### 3. Reopen in Dev Container

In Visual Studio Code:

```text
Ctrl + Shift + P
```

Select:

```text
Dev Containers: Reopen in Container
```

The first container creation will install the project dependencies automatically.

### 4. Configure environment variables

Environment-specific configuration is kept outside version control.

For the backend, create a local `.env` from the provided example:

```bash
cp backend/.env.example backend/.env
```

The `.env.example` file documents the environment variables required by the application without exposing local or sensitive values.

---

## Start Backend

Open a terminal inside the Dev Container:

```bash
cd backend
```

Start the development server:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

## Start Frontend

Open another terminal:

```bash
cd frontend
```

Start the Angular development server:

```bash
npm start
```

The frontend runs on:

```text
http://localhost:4200
```

Open:

```text
http://localhost:4200
```

to access the application.

---

## API

### Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "service": "backend"
}
```

This endpoint can be used to verify that the backend server is running correctly.

---

## Frontend API Proxy

The frontend development environment uses Angular's development proxy configuration:

```text
frontend/proxy.conf.json
```

Example:

```json
{
  "/api/**": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Frontend code can therefore communicate with the backend through:

```text
/api/health
```

instead of directly using:

```text
http://localhost:3000/api/health
```

The development proxy keeps the frontend API path independent from the backend development port and avoids unnecessary cross-origin configuration during local development.

---

## Environment Configuration

Environment-specific configuration is not committed to Git.

The repository ignores local environment files such as:

```text
.env
.env.*
```

while allowing example configuration files to be committed:

```text
.env.example
```

Example files define the required variable names and provide a starting point for a new development environment without exposing actual credentials or machine-specific configuration.

For example:

```bash
cp backend/.env.example backend/.env
```

Developers should update the local `.env` file with values appropriate for their environment.

---

## Development Commands

### Root

Install root dependencies:

```bash
npm install
```

### Frontend

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm start
```

Build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

### Backend

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm start
```

---

## Development Workflow

The intended development workflow is:

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
   │      └── :4200
   │
   └── Hono
          └── :3000
```

The Dev Container provides a consistent runtime environment, while the repository contains the configuration required to recreate the development setup.

A clean checkout should therefore be able to reproduce the development environment without relying on machine-specific Node.js configuration.

---

## Current Status

### Completed

* [x] Angular frontend
* [x] Hono backend
* [x] Frontend / Backend API communication
* [x] Health Check API
* [x] Docker Compose development environment
* [x] VS Code Dev Container
* [x] Automatic dependency installation
* [x] Environment example configuration
* [x] Git configuration
* [x] GitHub repository
* [x] Clean-environment setup verification

### In Progress

* [ ] Backend architecture refinement
* [ ] Domain and application boundaries
* [ ] Infrastructure organization
* [ ] Workflow and runtime architecture
* [ ] Shared contracts
* [ ] Event and message processing architecture
* [ ] Frontend feature integration

### Planned

* [ ] Expand application features
* [ ] Expand backend APIs
* [ ] Add automated tests
* [ ] Improve error handling
* [ ] Production Docker configuration
* [ ] Docker image build
* [ ] GitHub Actions CI/CD
* [ ] Production deployment

---

## Architecture Direction

Akigumo is developed incrementally rather than through a complete rewrite.

The project follows a **slice-by-slice development and refactoring approach**:

```text
Define responsibility
        ↓
Implement one slice
        ↓
Verify behavior
        ↓
Build / test
        ↓
Review boundaries
        ↓
Continue with the next slice
```

The goal is to keep architectural decisions explicit while allowing the application to evolve without introducing unnecessary framework-level abstractions.

Detailed architectural decisions will be documented separately as the system becomes more stable.

---

## Why This Project

Akigumo is intended to demonstrate more than the implementation of individual frontend or backend features.

The project focuses on the engineering process behind a maintainable full-stack application:

```text
Frontend
   ↓
Backend API
   ↓
Application Architecture
   ↓
Infrastructure
   ↓
Docker Development Environment
   ↓
Git
   ↓
GitHub
   ↓
CI/CD
   ↓
Production
```

The long-term goal is to build a full-stack system that can be developed locally, reproduced from a clean checkout, tested, version-controlled, and eventually deployed through an automated workflow.

---

## Repository

GitHub:

https://github.com/s36934512/akigumo

---

## License

This project is for learning and portfolio purposes.
