# SpeedQuiz — Japanese Learning Platform

A **Fullstack Web Application** designed for efficient Japanese language study.
I developed this to bridge the gap between my professional experience in the **Automotive Industry** and modern web development patterns, focusing on
high-performance data handling and interactive canvas elements.

> **Note:** This site is a private project

## Screenshot

![Project Demo](media/demo.gif)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, Angular Material, RxJS |
| Backend | Spring Boot 3.4 (Java 21), Spring Data JPA, HikariCP, Lombok |
| NLP Service | Python FastAPI, MeCab (Japanese morphological analysis) |
| Database | PostgreSQL 16, SQLite (read-only Anki import) |
| Migrations | Flyway |
| API Contract | OpenAPI 3.0 with code generation (shared between frontend and backend) |
| Infrastructure | Docker Compose, nginx (reverse proxy), multi-stage Docker builds |

## Architecture

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐
│  Browser │────▶│  nginx (:80)  │────▶│  Angular SPA │
└──────────┘     └───────┬───────┘     └──────────────┘
                         │ /api/*
                         ▼
                 ┌───────────────┐     ┌──────────────┐
                 │ Spring Boot   │────▶│ PostgreSQL   │
                 │    (:8080)    │     │   (:5432)    │
                 └───────┬───────┘     └──────────────┘
                         │                    
                         │             ┌──────────────┐
                         │────────────▶│ SQLite (R/O) │
                         │             │  Anki export │
                         │             └──────────────┘
                         │ /parse
                         ▼
                 ┌───────────────┐
                 │ FastAPI+MeCab │
                 │    (:8000)    │
                 └───────────────┘
```

Five containers orchestrated via Docker Compose. nginx serves the Angular SPA and proxies API requests to Spring Boot. The Python microservice handles
Japanese text segmentation via MeCab and is called server-to-server from the backend.

## Design Decisions

**API-First Contract** — A single `api.yaml` OpenAPI spec is the source of truth. The Maven build generates Spring controller interfaces via
`openapi-generator-maven-plugin`; the frontend Dockerfile generates a TypeScript-Angular HTTP client from the same spec. Controllers implement the
generated interfaces, so the API contract is enforced at compile time on both sides.

**Adapter Pattern for Deck Sources** — Cards come from three very different sources: Anki SQLite, user-created decks in PostgreSQL, and the WaniKani
API. Each source is wrapped in an adapter (`AnkiDeckAdapter`, `UserDeckAdapter`, `WaniKaniDeckAdapter`) that translates its native format into a
common `DeckProvider`/`DeckContent` interface. `DeckRegistryService` acts as a facade that unifies all three behind one API.

**Dual Datasource Strategy** — PostgreSQL (via HikariCP connection pool) for application data, SQLite (read-only, via JdbcTemplate) for Anki import.
JPA repositories are used for entities with typed columns (Kanji, UserTableState, Transcripts). JdbcTemplate is used for tables with jsonb blobs or
raw SQL needs (Deck, CardProgress, Session).

**Global Error Handling** — A single `@RestControllerAdvice` handler maps all exceptions to a consistent `ApiError` JSON response with status, error
type, message, and timestamp. Custom exceptions (`KanjiNotFoundException`, `DuplicateTranscriptException`, `WaniKaniException`) map to appropriate
HTTP status codes. No stack traces leak to the client.

**Quiz Validation Strategies** — The frontend uses a Strategy pattern for answer checking. `RomajiConversionStrategy` converts romaji input to hiragana
for exact matching; `LevenshteinStrategy` allows fuzzy matching for English meanings. Strategies are assigned per answer slot based on property type,
so a single card can have both strict kana matching and fuzzy English matching.

**Route-Level Dependency Injection** — Angular's route `providers` array swaps the data source implementation per context. The Anki table route injects
`BackendSourceService` (HTTP calls), while the URL-import route injects `JsonSourceService` (in-memory). Both extend the same `AnkiSourceService`
abstract class, so components are unaware of the data origin.

## Features

**Quiz Engine** — Configurable flashcard decks with pluggable property types (question, answer, hint, image, audio, hiragana, SVG). Answer validation
uses Levenshtein distance for fuzzy matching and a custom romaji-to-hiragana converter so you can type answers in either script.

**Kanji Wall & Stroke Order** — Visual grid of kanji with interactive SVG stroke order diagrams sourced from KanjiVG. Click any kanji to see readings,
meanings, and animated writing order.

**Anki Import** — Reads Anki's SQLite `collection.db` directly (read-only mount), parses the internal field format into structured cards, and renders
them in a paginated table with row-level ignore/restore.

**Japanese Dictionary** — Backed by JMDict_e.xml (~213k entries, indexed at startup) with MeCab-powered text segmentation. Paste a Japanese sentence
and get it broken down into individual words with dictionary lookups.

**WaniKani Integration** — Connects to the WaniKani API to pull assignments and subjects, with token verification, in-memory caching with TTL
expiry, and a dev-cache mode for offline development.

**Stream Transcript Cards** — Upload transcripts (e.g. from Japanese streams), store them with deduplication detection (409 Conflict on duplicate
title+vtuber), and turn them into study material.

**Deck Creator** — Stepper-based UI for building custom flashcard decks with arbitrary properties. Decks are stored as JSONB in PostgreSQL.

**Session System** — Lightweight, passwordless sessions. Users pick a display name (validated and sanitized server-side), get a UUID token stored in
localStorage, and can export/import their profile as JSON for backup.

## Getting Started

```bash
git clone <repository-url>
cp .env.example .env
docker compose up --build
```

The app will be available at `http://localhost:4200?token=portfolio`. The backend runs on `:8080`, but nginx handles the routing so you shouldn't need to access it
directly.

**Local development (without Docker):**

```bash
# Backend (needs PostgreSQL running on :5433)
cd BackendSpeed
./mvnw spring-boot:run -Dspring-boot.run.profiles=local

# Frontend
cd FrontendQuiz
npm install
ng serve
```

## Project Structure

```
├── BackendSpeed/              Spring Boot backend (Java 21)
│   └── src/main/java/.../backendspeed/
│       ├── config/                    Global exception handler, HikariCP datasource, CORS
│       ├── frontendProviders/         REST controllers (implement generated OpenAPI interfaces)
│       ├── infrastructure/
│       │   ├── jm_dict_e/             JMDict XML dictionary (model, service, entity replacer)
│       │   ├── kanjiDetails/          Kanji detail lookup
│       │   └── kanjidict/             Kanji search, MeCab client, import service
│       ├── persistence/
│       │   ├── deck/                  Deck storage (JdbcTemplate + jsonb)
│       │   ├── progress/              Card progress tracking (JdbcTemplate)
│       │   └── session/               Session management (JdbcTemplate)
│       ├── quizFeatures/              Deck registry facade, browsing, DeckProvider interface
│       ├── sourceFeatures/
│       │   ├── adapters/              AnkiDeckAdapter, UserDeckAdapter, WaniKaniDeckAdapter
│       │   ├── ankiParsing/           SQLite → CSV → structured cards pipeline
│       │   ├── externalClients/       WaniKani API client, mapper, verification
│       │   ├── extractCardsFromUrl/   URL-based card import
│       │   ├── htmlTableImport/       HTML table → deck importer
│       │   └── transcriptCards/       Transcript storage, deduplication, mapping
│       └── utils/                     HTML parser, JSON batch importer
├── FrontendQuiz/              Angular 19 SPA
│   └── src/app/
│       ├── features/
│       │   ├── anki-table/            Anki card browser (abstract data source pattern)
│       │   ├── deck-shelf/            Deck overview with grouped accordion UI
│       │   ├── deck-table/            Paginated deck viewer with chooser
│       │   ├── dict/                  Dictionary + MeCab tokenizer UI
│       │   ├── dynamic-card-creator/  Stepper-based deck builder
│       │   ├── extract-cards-from-url/ WaniKani import wizard
│       │   ├── kanji-details/         Single kanji detail view
│       │   ├── kanji-wall/            Visual kanji grid with stroke order
│       │   ├── quiz/                  Quiz engine (board, answer slots, card view, validation)
│       │   └── transcription-translation/ Transcript table + upload
│       ├── interceptor/               HTTP logger interceptor
│       ├── interfaces/                DI tokens for API services
│       ├── layout/                    Side-nav, footer, about page
│       ├── services/                  Shared state & API services
│       ├── site-mode/                 Access gate (portfolio mode)
│       ├── user-store-management/     Session, profile, token interceptor
│       └── widgets/                   Reusable components (modals, paginator, stroke order, upload)
├── PythonDict/                FastAPI microservice for MeCab tokenization
├── compose.yaml               Docker Compose orchestration
├── nginx.conf                 Reverse proxy configuration
└── api.yaml                   OpenAPI 3.0 contract (shared source of truth)
```

## Credits

### KanjiVG

This project includes kanji stroke order diagrams sourced from the [KanjiVG project](https://github.com/KanjiVG/kanjivg), licensed
under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Original author: Ulrich Apel
KanjiVG Website: http://kanjivg.tagaini.net

### Fonts

This project uses the KanjiStrokeOrders font, licensed under the BSD-style license. The stroke order diagrams are copyrighted by Ulrich Apel and the
Wadoku and AAAA projects. For more information, please refer to the [KanjiStrokeOrders font page](http://sites.google.com/site/nihilistorguk/).