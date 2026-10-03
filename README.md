# Akigumo

**Akigumo** is a full-stack content management system built with Angular, Hono, TypeScript, PostgreSQL, Neo4j, Redis, and Python.

The project is designed around explicit system boundaries, durable asynchronous workflows, and a separation between relational state, graph relationships, runtime infrastructure, and frontend features.

> **Development status:** Active development on `develop`.

---

## Overview

Akigumo is a file-system-like content management system that combines structured metadata with a graph-based relationship model.

The system is built around several distinct responsibilities:

```text
                         ┌──────────────────────┐
                         │      Angular         │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │ HTTP
                                    ▼
                         ┌──────────────────────┐
                         │        Hono          │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
              PostgreSQL          Redis            Neo4j
              durable state      runtime/MQ       graph state
                    │               │                │
                    │               ▼                │
                    │         Kernel / Queue         │
                    │               │                │
                    │               ▼                │
                    │          Workflows              │
                    │             XState              │
                    │               │                │
                    └───────────────┼────────────────┘
                                    │
                                    ▼
                             Python Workers
                           Graph Refinement
```

The project is intentionally developed around explicit boundaries rather than introducing a large application framework or a generic abstraction layer.

---

## Key Architecture

### PostgreSQL — Durable State

PostgreSQL is the primary source of truth for durable application state.

It stores:

- Domain entities
- Workflow state
- Workflow events
- Outbox records
- File and Archive state
- Persistent application metadata

Prisma is used for database access and schema management.

The Outbox pattern is used to make durable state changes and asynchronous work creation part of the same transactional boundary.

```text
Domain operation
      │
      ▼
PostgreSQL transaction
      │
      ├── Update domain state
      │
      └── Create Outbox record
                │
                ▼
          asynchronous dispatch
```

---

### Neo4j — Relationship Source of Truth

Neo4j is used for graph relationships and graph-oriented operations.

The relational database does not attempt to duplicate the graph merely for ORM convenience.

Graph operations are represented as asynchronous work and executed through the graph refinement pipeline.

This keeps the responsibilities of the two databases explicit:

```text
PostgreSQL
    │
    └── Entity / state / durable workflow data

Neo4j
    │
    └── Relationship / graph data
```

---

### Redis — Runtime Infrastructure

Redis is used for runtime communication and infrastructure rather than as the primary durable application database.

The current system uses separate Redis instances for different responsibilities:

```text
Redis
├── Workflow / graph message streams
└── Runtime messaging

Redis Cache
└── Application cache
```

Redis Streams are used for asynchronous communication between backend components and graph-processing workers.

The architecture assumes asynchronous delivery can be retried, so consumers use durable identifiers and idempotency mechanisms rather than relying on exactly-once message delivery.

---

## Kernel

Akigumo contains a dedicated **Kernel** responsible for durable asynchronous task execution.

The Kernel separates:

```text
Command
   │
   ▼
Workflow transition
   │
   ▼
Durable Outbox
   │
   ▼
Task
   │
   ▼
Kernel Runtime
   │
   ▼
Processor
   │
   ▼
Workflow Result
```

A Kernel task is an executable unit of asynchronous work.

The current Kernel includes:

- Task contracts
- Processor definitions
- Processor registry
- Dispatcher
- Dispatch runtime
- BullMQ task execution
- Retry handling
- Processing leases
- Processing ownership
- Non-retryable errors
- Workflow result publishing

The runtime uses an at-least-once execution model.

Tasks therefore use durable identifiers and processing ownership to prevent duplicate delivery from producing duplicate state transitions.

---

## Outbox and Dispatch

The Outbox provides the durable boundary between database state and asynchronous processing.

A simplified flow is:

```text
Application
    │
    ▼
PostgreSQL transaction
    │
    ├── Domain state
    │
    └── Outbox
          │
          ▼
    Outbox Dispatcher
          │
          ▼
       Task Queue
          │
          ▼
       Processor
```

The dispatcher claims pending work using database locking and `FOR UPDATE SKIP LOCKED`.

Processing records include a processing identifier and lease information so that abandoned work can be recovered.

Current Kernel configuration includes:

```text
Maximum attempts:             5
Processing lease timeout:    10 minutes
Dispatch polling interval:   5 seconds
```

---

## Workflow Engine

Long-running or multi-step operations are represented as workflows using **XState**.

Workflow state is persisted in PostgreSQL rather than existing only in process memory.

```text
Workflow
   │
   ├── state
   ├── context
   └── snapshot
          │
          ▼
      PostgreSQL
```

Workflow results are represented by a shared versioned contract:

```text
WorkflowResult v1.0.0
```

A result contains:

- `workflowId`
- operation
- source `outboxId`
- success or failure result

This gives the Workflow Engine a durable identifier with which to establish result idempotency.

A simplified asynchronous workflow looks like:

```text
API Request
    │
    ▼
Create Workflow
    │
    ▼
Persist Workflow + Outbox
    │
    ▼
Kernel Task
    │
    ▼
Processor
    │
    ▼
Workflow Result
    │
    ▼
Redis Stream
    │
    ▼
Workflow Engine
    │
    ▼
XState Transition
    │
    ▼
Next Outbox / Task
```

---

## Graph Refinement Pipeline

Graph operations can be delegated to the Python graph refinement worker.

The current architecture separates the request and result paths:

```text
Backend
   │
   ▼
Graph Intent
   │
   ▼
Redis Stream
   │
   ▼
Python Graph Refinement Worker
   │
   ├── Neo4j
   │
   └── processing
   │
   ▼
Graph Operation Result
   │
   ▼
Backend
   │
   ▼
Durable Outbox
   │
   ▼
Workflow Result
```

The Python side currently contains:

- Redis message processing
- Graph refinement worker
- Neo4j integration
- Graph operation executors
- Concept processing
- File processing

Python dependencies are managed through `pyproject.toml`.

---

## Application Modules

The backend follows a **Vertical Slice Architecture**.

Features are organized around capabilities rather than forcing all code into generic global layers.

Current modules include:

```text
modules/
├── archive/
│   ├── archive-concept
│   ├── archive-delete
│   ├── archive-integration
│   ├── archive-structure
│   └── archive-upload
│
├── graph/
│   ├── graph-result
│   └── graph-sync
│
├── ontology/
│   ├── ontology-delete
│   ├── ontology-editor
│   ├── ontology-registry
│   └── ontology-resolver
│
└── system/
    ├── archive
    └── workflow-bootstrap
```

Each module can expose the capabilities it owns:

```text
Module
├── Routes
├── Workflows
└── Processors
```

For example:

```ts
export const capability = {
    workflows: [...],
    processors: [...],
    routes: [...],
};
```

Module registration is centralized while the implementation remains inside the feature slice.

---

## Archive

The **Archive** domain represents persistent content and its relationship with files.

The upload flow uses a durable workflow rather than treating file upload as a single synchronous request.

The current upload architecture integrates:

- Tus
- Uppy
- Archive workflow
- PostgreSQL
- Outbox
- Kernel
- Graph synchronization

A simplified upload lifecycle is:

```text
Client
  │
  ▼
Archive Intent
  │
  ▼
Create durable File / Archive state
  │
  ▼
Tus Upload
  │
  ▼
Upload Finished
  │
  ▼
Archive Workflow
  │
  ▼
Graph Integration
```

Tus is handled by the backend infrastructure while the domain-level state transition remains controlled by the Archive workflow.

---

## Ontology

The Ontology subsystem provides graph-oriented semantic operations.

Current slices include:

- Registry
- Editor
- Resolver
- Delete

Ontology operations use the same workflow and asynchronous processing infrastructure as other modules.

For example:

```text
Ontology API
     │
     ▼
Workflow
     │
     ▼
Outbox
     │
     ▼
Kernel
     │
     ▼
Processor
     │
     ▼
Workflow Result
```

This keeps synchronous HTTP handling separate from durable asynchronous execution.

---

## Contracts

Shared contracts define the language between asynchronous system components.

Examples include:

```text
Task
WorkflowResult
Result
ErrorDetail
Graph Operation
Workflow Events
```

Workflow results currently use:

```text
version: 1.0.0
```

The result model distinguishes:

```text
SUCCESS
FAILURE
```

with standardized error details for failure results.

Event definitions are generated from processor definitions so that success and failure event schemas remain consistent.

For example:

```text
PROCESSOR_SUCCEEDED
PROCESSOR_FAILED
```

This prevents each feature from inventing an incompatible asynchronous result format.

---

## Frontend

The frontend is built with **Angular 22** and follows **Feature-Sliced Design (FSD)** principles.

The frontend currently contains:

- Angular
- Angular SSR
- RxJS
- Uppy
- Tus
- Orval-generated API clients
- Zod
- Vitest

API contracts are generated from the backend API definition using Orval.

The frontend therefore separates generated API infrastructure from feature-level application code.

Conceptually:

```text
Angular
│
├── app
│
├── pages
├── widgets
├── features
├── entities
└── shared
    └── api
```

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| Angular 22 | Frontend framework |
| TypeScript | Application language |
| RxJS | Reactive programming |
| Angular SSR | Server-side rendering |
| Uppy | Upload UI / client upload management |
| Tus | Resumable uploads |
| Orval | API client generation |
| Zod | Runtime validation |
| Vitest | Testing |

### Backend

| Technology | Purpose |
|---|---|
| Hono | HTTP API |
| TypeScript | Application language |
| Node.js | Backend runtime |
| Prisma | PostgreSQL access |
| XState | Workflow state machines |
| BullMQ | Task execution |
| Redis Streams | Asynchronous messaging |
| Zod | Contract validation |
| Pino | Logging |
| Tus | File upload server |

### Data / Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL | Durable relational state |
| Neo4j | Graph relationships |
| Redis | Messaging / runtime infrastructure |
| Redis Cache | Application cache |
| Docker Compose | Local infrastructure |
| Dev Containers | Reproducible development environment |

### Python

| Technology | Purpose |
|---|---|
| Python 3.13+ | Graph processing runtime |
| Neo4j driver | Graph database access |
| Redis | Message processing |
| Pydantic | Data validation |
| Structlog | Structured logging |

---

## Repository Structure

The repository is organized as a multi-part full-stack application:

```text
akigumo/
├── .devcontainer/
│
├── backend/
│   ├── prisma/
│   └── src/
│       ├── api/
│       ├── app/
│       ├── config/
│       ├── contracts/
│       ├── infrastructure/
│       ├── kernel/
│       ├── modules/
│       └── workflow/
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── entities/
│       ├── features/
│       ├── pages/
│       ├── shared/
│       └── widgets/
│
├── python/
│   ├── graph_refinement/
│   └── infrastructure/
│
├── compose.yaml
├── package.json
└── README.md
```

The backend is intentionally separated into:

```text
Application
Contracts
Infrastructure
Kernel
Modules
Workflow
```

rather than placing all backend code into a single generic service layer.

---

## Development Environment

Akigumo uses Docker Compose together with a VS Code Dev Container.

The development environment currently includes:

```text
┌───────────────────────────────────────────────┐
│                 Dev Container                 │
│                                               │
│  Node.js / TypeScript                         │
│  Angular :4200                                │
│  Hono    :3000                                │
└───────────────────────┬───────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
     PostgreSQL       Redis         Neo4j
          │             │
          │             ├── Redis MQ
          │             └── Redis Cache
          │
          └── Durable state
```

Docker Compose currently provides:

- PostgreSQL 18
- Redis 8
- Dedicated Redis cache instance
- Neo4j
- Development workspace

---

## Requirements

Recommended:

- Docker Desktop
- Visual Studio Code
- Dev Containers extension
- Git

The Dev Container provides the Node.js development environment.

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/s36934512/akigumo.git
cd akigumo
```

### 2. Open in VS Code

```bash
code .
```

Then select:

```text
Dev Containers: Reopen in Container
```

### 3. Configure environment variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

Update the values for your local environment.

The Compose environment expects configuration for:

```text
PostgreSQL
Redis
Neo4j
```

### 4. Generate Prisma client

Inside the backend:

```bash
cd backend
npm run prisma:generate
```

### 5. Apply database migrations

```bash
npm run prisma:migrate
```

### 6. Start the backend

```bash
npm run dev
```

Backend:

```text
http://localhost:3000
```

### 7. Start the frontend

In another terminal:

```bash
cd frontend
npm start
```

Frontend:

```text
http://localhost:4200
```

---

## Development Commands

### Backend

```bash
cd backend
```

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Apply migrations:

```bash
npm run prisma:migrate
```

### Frontend

```bash
cd frontend
```

Development:

```bash
npm start
```

Build:

```bash
npm run build
```

Tests:

```bash
npm test
```

Generate API client:

```bash
npm run api:gen
```

---

## Architecture Principles

Akigumo is developed around a small number of explicit architectural rules.

### 1. Durable state belongs in PostgreSQL

PostgreSQL owns persistent application state.

Redis is not treated as a replacement for durable domain storage.

### 2. Graph relationships belong in Neo4j

Neo4j is the source of truth for graph relationships.

Graph data is not duplicated into PostgreSQL simply to make ORM access easier.

### 3. Asynchronous work crosses a durable boundary

Long-running or asynchronous operations are represented through:

```text
Outbox → Task → Processor → Result
```

rather than hiding background work inside HTTP handlers.

### 4. Workflows own orchestration

A Workflow describes the business process and its state transitions.

Infrastructure details such as Redis, BullMQ, or Neo4j are not part of workflow logic.

### 5. Kernel owns task execution

The Kernel provides the generic runtime for durable asynchronous tasks.

Feature modules provide processors; the Kernel does not contain feature-specific business logic.

### 6. Contracts are explicit

Communication between system boundaries uses versioned, validated contracts.

### 7. At-least-once delivery is assumed

Message delivery and task execution are not treated as exactly-once.

Consumers therefore use durable identifiers and idempotency mechanisms where required.

### 8. Abstractions represent real boundaries

The project avoids introducing abstractions merely for the sake of abstraction.

An abstraction should represent an actual infrastructure, runtime, or domain boundary.

---

## Current Development Status

The repository has moved beyond the initial application skeleton and currently contains a functioning asynchronous backend architecture.

### Implemented

- [x] Angular frontend
- [x] Hono backend
- [x] PostgreSQL integration
- [x] Prisma schema and migrations
- [x] Neo4j integration
- [x] Redis infrastructure
- [x] Redis Streams
- [x] BullMQ task execution
- [x] Durable Outbox
- [x] Kernel task runtime
- [x] Processor registry
- [x] XState workflow engine
- [x] Persisted workflow state
- [x] Versioned Workflow Result contract
- [x] Workflow result idempotency handling
- [x] Graph refinement pipeline
- [x] Python graph worker
- [x] Tus upload server
- [x] Archive upload workflow
- [x] Ontology workflows
- [x] Graph synchronization
- [x] Orval-generated frontend API clients
- [x] Docker Compose development environment
- [x] VS Code Dev Container

### In Progress

- [ ] Broader automated test coverage
- [ ] More complete failure-path verification
- [ ] Upload consistency and recovery handling
- [ ] Further frontend feature development
- [ ] Additional graph operations
- [ ] Production deployment architecture

---

## Design Goal

Akigumo is not intended to be a collection of isolated CRUD endpoints.

The project is being developed as a system where:

```text
Frontend
   │
   ▼
Domain API
   │
   ▼
Workflow
   │
   ▼
Durable State
   │
   ▼
Outbox
   │
   ▼
Kernel
   │
   ▼
Processor
   │
   ├──────────────► PostgreSQL
   │
   ├──────────────► Neo4j
   │
   └──────────────► Python
             │
             ▼
          Result
             │
             ▼
        Workflow
```

The main engineering focus is therefore on **clear boundaries, durable asynchronous execution, explicit contracts, and reproducible development infrastructure**.

---

## Repository

GitHub:

https://github.com/s36934512/akigumo

Development branch:

https://github.com/s36934512/akigumo/tree/develop

---

## License

This project is currently developed as a personal learning and portfolio project.