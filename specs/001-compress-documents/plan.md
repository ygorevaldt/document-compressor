# Implementation Plan: Document Compression for PDF and Word Files

**Branch**: `001-compress-documents` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from [`specs/001-compress-documents/spec.md`](./spec.md)

---

## Summary

The Document Compressor is a decoupled modular monolith built with Node.js, TypeScript, and Next.js. It compresses `.pdf`, `.docx`, and `.doc` files while strictly preserving 100% of document content, layouts, typography, and page structure. Optimization is achieved by downsampling embedded raster media (via `sharp`), re-deflating OpenXML/PDF object streams, eliminating duplicate structural elements, and stripping redundant metadata. A local SQLite deduplication cache (`better-sqlite3`) prevents redundant re-compression of identical files by indexing content SHA-256 hashes. The user interface leverages **shadcn/ui** and Tailwind CSS to provide a clean, distraction-free, and minimalist experience with drag-and-drop uploading, live progress, before-and-after size metrics, and single-click downloads.

---

## Technical Context

**Language/Version**: Node.js 20+ LTS, TypeScript 5.4+ (Strict Mode: `"strict": true`, `"noImplicitAny": true`)

**Primary Dependencies**:
- **Framework**: Next.js 14+ (App Router, Server Actions, Route Handlers)
- **UI & Styling**: shadcn/ui, Tailwind CSS, Radix UI primitives, Lucide React icons
- **Document Engines**:
  - `sharp` (High-performance image optimization for embedded document media)
  - `adm-zip` (OpenXML `.docx` container extraction, stream deflating, and repacking)
  - `pdf-lib` + `child_process` adapter for Ghostscript (`gs`) and `qpdf` (PDF stream distillation and linearization)
  - Headless LibreOffice / `soffice` adapter for legacy `.doc` conversion and compression
- **Persistence & Caching**: `better-sqlite3` + `drizzle-orm` (Embedded SQLite database)
- **Utilities**: `zod` (runtime contract validation), `crypto` (SHA-256 content hashing)

**Storage**: Local embedded SQLite database (`data/compressor.db`) for deduplication cache metadata; local disk storage (`storage/compressed/`) for cached artifacts; persistent Docker volume mounts.

**Testing**: Vitest for unit and contract testing, `@testing-library/react` for UI components, Playwright for end-to-end integration flows. Real test fixtures in `tests/fixtures/`.

**Target Platform**: Node.js runtime / Linux Docker container (`node:20-bookworm-slim`) / Windows development host.

**Project Type**: Full-stack Decoupled Modular Monolith.

**Performance Goals**:
- Document compression for standard files ($\le 25\text{MB}$) completes in $<15\text{s}$.
- Cache hit retrieval responds in $<100\text{ms}$.
- Average size reduction of $\ge 30\%$ on Recommended profile and $\ge 50\%$ on Maximum profile for media-rich files.

**Constraints**:
- $\le 100\text{MB}$ memory overhead per file processing stream (chunked/stream-oriented handling).
- Maximum upload limit of 100MB per file.
- 100% content preservation (zero missing pages, zero text alteration).
- Zero anti-inflation: Never deliver a file larger than the input.

**Scale/Scope**: Standalone modular monolith supporting single and batch uploads with pluggable format engines.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Modular Monolith & Decoupling**: **PASS**. The system is organized into decoupled domain modules (`compression`, `cache`, `storage`) isolated behind abstract interfaces (`ICompressorEngine`, `ICompressionCache`, `IStorageService`). Presentation (Next.js App Router) depends only on `ICompressionService`.
2. **Strict Static Typing**: **PASS**. TypeScript is configured with `"strict": true`, `"noImplicitAny": true`. All interfaces, DTOs, domain models, and API boundaries have complete static type annotations.
3. **English-Only Codebase**: **PASS**. All module names, class/function identifiers, variables, schemas, comments, docstrings, commits, and engineering documentation are strictly in English.
4. **Clean & Minimalist Interface**: **PASS**. UI is built with shadcn/ui components adhering to a minimalist, distraction-free aesthetic with immediate user feedback and zero visual clutter.
5. **SOLID, Clean Code & DRY**: **PASS**. Single Responsibility for each format engine; Open/Closed for adding new format compressors without modifying core logic; Dependency Inversion via explicit interfaces. Deduplication logic is centralized in the caching module.
6. **Spec-Driven TDD**: **PASS**. Acceptance scenarios from `spec.md` directly map to automated contract, unit, and integration tests in `tests/`. Tests are scheduled to be written and verified failing before implementation.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-compress-documents/
├── plan.md              # This implementation plan
├── research.md          # Technical research & engine decisions
├── data-model.md        # Entities, SQLite schema, state transitions
├── quickstart.md        # Verification and end-to-end execution guide
├── contracts/           # TypeScript and HTTP interface contracts
│   ├── compression-service.ts
│   └── api-spec.md
├── checklists/
│   └── requirements.md  # Spec quality validation checklist
└── tasks.md             # Implementation tasks (generated in Phase 2)
```

### Source Code (Modular Monolith Layout)

```text
compressor-de-documentos/
├── data/                               # Local SQLite database (compressor.db)
├── storage/                            # Persistent storage for compressed artifacts
│   ├── compressed/                     # Content-hashed compressed files
│   └── temp/                           # Ephemeral processing scratch directory
├── src/
│   ├── core/                           # Shared domain models, errors, types
│   │   ├── entities/
│   │   ├── errors/
│   │   └── types/
│   ├── modules/
│   │   ├── compression/                # Compression Domain Module
│   │   │   ├── contracts/              # ICompressorEngine, ICompressionService
│   │   │   ├── engines/                # PdfCompressorAdapter, DocxCompressorAdapter, DocCompressorAdapter
│   │   │   ├── profiles/               # CompressionProfile configurations
│   │   │   └── services/               # CompressionService orchestrator
│   │   ├── cache/                      # Caching & Deduplication Module
│   │   │   ├── contracts/              # ICompressionCache
│   │   │   ├── db/                     # SQLite connection, Drizzle schema & migrations
│   │   │   └── repositories/           # SqliteCompressionCache
│   │   └── storage/                    # Storage Management Module
│   │       ├── contracts/              # IStorageService
│   │       └── services/               # LocalStorageService
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Main compression interface
│   │   └── api/
│   │       ├── compress/route.ts       # POST /api/compress
│   │       ├── download/[id]/route.ts  # GET /api/download/:id
│   │       └── batch/compress/route.ts # POST /api/batch/compress
│   ├── components/                     # UI Layer (shadcn/ui + custom views)
│   │   ├── ui/                         # shadcn/ui components (button, card, progress, etc.)
│   │   ├── file-dropzone.tsx           # Drag & drop upload area
│   │   ├── profile-selector.tsx        # Profile options (Recommended, Maximum, High Fidelity)
│   │   ├── compression-progress.tsx    # Real-time progress indicator
│   │   ├── metrics-dashboard.tsx       # Before/after metrics & download action
│   │   └── batch-queue.tsx             # Multi-file batch queue & summary
│   └── lib/                            # Infrastructure utilities, logging, config
├── tests/
│   ├── fixtures/                       # Real test files (PDFs, DOCX, corrupted files)
│   ├── contract/                       # Engine and repository contract tests
│   ├── unit/                           # Hash calculation, profile resolution, metrics
│   └── integration/                    # End-to-end compression, caching, anti-inflation
├── Dockerfile                          # Multi-stage container with Node.js, GS, QPDF, LibreOffice
├── docker-compose.yml                  # Local development compose with volumes
├── package.json
└── tsconfig.json
```

**Structure Decision**: A single-project decoupled modular monolith. Domain logic and compression engines are completely separated from Next.js presentation components, enabling straightforward unit testing, clean dependency injection, and clear boundaries.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *None* | Architecture strictly adheres to Modular Monolith and Constitution rules. | N/A |
