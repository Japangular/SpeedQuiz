# SpeedQuiz — Japanese Learning Platform

A fullstack web application I built to move from the **automotive industry** into
modern web development, using my own Japanese study as the problem domain. The
focus is on patterns that hold up at scale: a single API contract enforced on
both sides, adapter-based source integration, and per-property validation
strategies.

> **Note:** This site is a private project.

## Screenshot

![Project Demo](media/demo.gif)

## Tech Stack

| Layer          | Technology                                                    |
|----------------|---------------------------------------------------------------|
| Frontend       | Angular 19, Angular Material, RxJS                            |
| Backend        | Spring Boot 3.4 (Java 21), Spring Data JPA, HikariCP, Lombok  |
| NLP Service    | Python FastAPI, MeCab (Japanese morphological analysis)       |
| Database       | PostgreSQL 16, SQLite (read-only Anki import)                 |
| Migrations     | Flyway                                                        |
| API Contract   | OpenAPI 3.0 with code generation (shared by frontend/backend) |
| Infrastructure | Docker Compose, nginx reverse proxy, multi-stage builds       |

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

Five containers orchestrated via Docker Compose. Nginx serves the Angular SPA
and proxies API requests to Spring Boot. The Python microservice handles
Japanese text segmentation via MeCab and is called server-to-server from the
backend.

## Design Decisions

**API-First Contract** — A single `api.yaml` OpenAPI spec is the source of
truth. The Maven build generates Spring controller interfaces via
`openapi-generator-maven-plugin`; the frontend Dockerfile generates a
TypeScript-Angular HTTP client from the same spec. Controllers implement the
generated interfaces, so the API contract is enforced at compile time on both
sides.

**Adapter Pattern for Deck Sources** — Cards come from three sources:
Anki SQLite, HTML resource files (JLPT lists from Tanos), and user-created
PostgreSQL decks. Each source has an adapter that translates its native format
into a common `DeckProvider` / `DeckContent` interface, and
`DeckRegistryService` acts as a facade that unifies all three behind one API.
Further providers could fit the same shape — e.g. token-based external
platforms like WaniKani.

**Dual Datasource Strategy** — PostgreSQL (via HikariCP connection pool) for
application data, SQLite (read-only, via JdbcTemplate) for Anki import. JPA
repositories are used for entities with typed columns (Kanji, UserTableState,
Transcripts). JdbcTemplate is used for tables with jsonb blobs or raw SQL needs
(Deck, CardProgress, Session).

**Global Error Handling** — A single `@RestControllerAdvice` handler maps all
exceptions to a consistent `ApiError` JSON response with status, error type,
message, and timestamp. Custom exceptions map to appropriate HTTP status codes.
No stack traces leak to the client.

**Per-Property Quiz Validation** — Each card property (question, answer, hint,
hiragana, …) declares its type, and the frontend selects a validator function
per answer slot from that type. Hiragana fields convert romaji input to kana on
the fly and require an exact match; plain answer fields use Levenshtein
distance for fuzzy matching. A single card can mix strict kana matching for the
reading slot with fuzzy English matching for the meaning slot.

**Route-Level Dependency Injection** — Angular's route `providers` array swaps
the data source implementation per context. The Anki table route injects
`BackendSourceService` (HTTP calls), while the URL-import route injects
`JsonSourceService` (in-memory). Both extend the same `AnkiSourceService`
abstract class, so components are unaware of the data origin.

## Features

**Quiz Engine** — Configurable flashcard decks with pluggable property types
(question, answer, hint, image, audio, hiragana, SVG). Answer validation uses
Levenshtein distance for fuzzy matching and a custom romaji-to-hiragana
converter so you can type answers in either script.

**Kanji Wall & Stroke Order** — Visual grid of kanji with interactive SVG
stroke order diagrams sourced from KanjiVG. Click any kanji to see readings,
meanings, and animated writing order.

**Anki Import** — Reads Anki's SQLite `collection.db` directly (read-only
mount), parses the internal field format into structured cards, and renders
them in a paginated table with row-level ignore/restore.

**Japanese Dictionary** — Backed by JMDict_e.xml (~213k entries, indexed at
startup) with MeCab-powered text segmentation. Paste a Japanese sentence and
get it broken down into individual words with dictionary lookups.

**Stream Transcript Cards** — Upload Japanese livestream subtitles, store them
with deduplication detection (409 Conflict on duplicate title + vtuber), and
turn them into study material.

**Deck Creator** — Stepper-based UI for building custom flashcard decks with
arbitrary properties. Decks are stored as JSONB in PostgreSQL.

**Extract Cards from URL/Paste** — Paste tab-separated or newline-grouped
content (e.g. from spreadsheets or WaniKani level pages), have columns
auto-classified as question/answer/hiragana, preview, and save as a user deck.

**Session System** — Lightweight, passwordless sessions. Users pick a display
name (validated and sanitized server-side), get a UUID token stored in
localStorage, and can export/import their profile as HMAC-signed JSON for
backup.

## Getting Started

```bash
git clone <repository-url>
cp .env.example .env
docker compose up --build
```

The app is available at `http://localhost:4200?token=portfolio`. The
`?token=portfolio` query parameter is the portfolio-mode entry through the
access gate. The backend runs on `:8080`; nginx proxies all API traffic, so you
don't need to hit it directly.

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
│       ├── deckPersistence/           User-deck persistence port adapter
│       ├── frontendProviders/         REST controllers (implement generated OpenAPI interfaces)
│       ├── infrastructure/
│       │   ├── jm_dict_e/             JMDict XML dictionary (model, service, entity replacer)
│       │   └── kanjidict/             Kanji search, MeCab client, import service
│       ├── persistence/
│       │   ├── deck/                  Deck storage (JdbcTemplate + jsonb)
│       │   ├── progress/              Card progress tracking (JdbcTemplate)
│       │   └── session/               Session management (JdbcTemplate)
│       ├── quizFeatures/              Deck registry facade, browsing, DeckProvider interface
│       ├── sourceFeatures/
│       │   ├── adapters/              AnkiDeckAdapter, UserDeckAdapter
│       │   ├── ankiParsing/           SQLite → CSV → structured cards pipeline
│       │   ├── htmlTableImport/       HTML table → deck importer (JLPT lists)
│       │   └── transcriptCards/       Transcript storage, deduplication, mapping
│       └── utils/                     HTML parser, JSON batch importer
├── FrontendQuiz/              Angular 19 SPA
│   └── src/app/
│       ├── features/
│       │   ├── anki-table/            Anki card browser (abstract data source pattern)
│       │   ├── deck-bar/              Deck switcher bar
│       │   ├── deck-shelf/            Deck overview with grouped accordion UI
│       │   ├── dict/                  Dictionary + MeCab tokenizer UI
│       │   ├── dynamic-card-creator/  Stepper-based deck builder
│       │   ├── extract-cards-from-url/ Paste / URL → deck stepper
│       │   ├── kanji-wall/            Visual kanji grid with stroke order
│       │   ├── quiz/                  Quiz engine (board, answer slots, validation strategies)
│       │   └── transcription-translation/ Transcript table + upload
│       ├── interceptor/               HTTP logger / error interceptors
│       ├── interfaces/                DI tokens for API services
│       ├── layout/                    Side-nav, footer, about page
│       ├── services/                  Shared state & API services
│       ├── site-mode/                 Access gate (portfolio mode)
│       ├── store/                     NgRx Signals deck store
│       ├── user-store-management/     Session, profile, token interceptor
│       └── widgets/                   Reusable components (modals, stroke order, upload)
├── PythonDict/                FastAPI microservice for MeCab tokenization
├── compose.yaml               Docker Compose orchestration
├── nginx.conf                 Reverse proxy configuration
└── api.yaml                   OpenAPI 3.0 contract (shared source of truth)
```

## Credits

### KanjiVG

This project includes kanji stroke order diagrams sourced from the
[KanjiVG project](https://github.com/KanjiVG/kanjivg), licensed under
[Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Original author: Ulrich Apel
KanjiVG website: http://kanjivg.tagaini.net

### Fonts

This project uses the KanjiStrokeOrders font, licensed under a BSD-style
license. The stroke order diagrams are copyrighted by Ulrich Apel and the
Wadoku and AAAA projects. See `THIRD_PARTY_LICENSES.md` for the full license
text. For more information, see the
[KanjiStrokeOrders font page](http://sites.google.com/site/nihilistorguk/).