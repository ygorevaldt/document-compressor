---
description: "Task list for Document Compression for PDF and Word Files"
---

# Tasks: Document Compression for PDF and Word Files

**Input**: Design documents from [`specs/001-compress-documents/`](./)  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: Automated tests are **MANDATORY** per Constitution Principle V (Spec-Driven TDD). For every user story, tests matching the specification's acceptance criteria MUST be written first and proven to fail before implementation begins.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and tooling configuration

- [X] T001 Initialize Node.js 20+ Next.js 14+ project with TypeScript strict mode in `package.json` and `tsconfig.json`
- [X] T002 Install core runtime dependencies (`next`, `react`, `react-dom`, `better-sqlite3`, `drizzle-orm`, `sharp`, `adm-zip`, `pdf-lib`, `zod`, `clsx`, `tailwind-merge`, `lucide-react`) in `package.json`
- [X] T003 [P] Install dev and test dependencies (`vitest`, `@testing-library/react`, `@types/node`, `@types/better-sqlite3`, `@types/adm-zip`, `playwright`, `tailwindcss`, `postcss`, `autoprefixer`) in `package.json`
- [X] T004 [P] Configure Tailwind CSS and PostCSS in `tailwind.config.ts` and `postcss.config.mjs`
- [X] T005 [P] Configure Vitest test runner with TypeScript path aliases in `vitest.config.ts`
- [X] T006 [P] Setup containerized multi-stage Docker environment with Ghostscript, QPDF, and LibreOffice in `Dockerfile` and `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure and persistence that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create shared domain entities, value objects, and error definitions in `src/core/types/document.ts` and `src/core/errors/domain-errors.ts`
- [X] T008 Implement SQLite connection, Drizzle schema, and cache migration runner in `src/modules/cache/db/schema.ts` and `src/modules/cache/db/connection.ts`
- [X] T009 [P] Implement local file storage service for persistent compressed artifacts and temporary files in `src/modules/storage/services/local-storage-service.ts`
- [X] T010 [P] Implement SQLite deduplication cache repository adhering to `ICompressionCache` in `src/modules/cache/repositories/sqlite-compression-cache.ts`
- [X] T011 [P] Implement SHA-256 content hashing and file signature/MIME detection utility in `src/lib/hash-utils.ts` and `src/lib/file-detector.ts`
- [X] T012 [P] Setup test fixtures with real documents (uncompressed PDF with images, DOCX with media, minimal PDF, corrupted file) in `tests/fixtures/`
- [X] T013 Setup base shadcn/ui components (`Button`, `Card`, `Progress`, `Badge`, `Alert`, `Tabs`) in `src/components/ui/`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Single Document Compression (Priority: P1) 🎯 MVP

**Goal**: User uploads a single `.pdf`, `.docx`, or `.doc` file, selects standard compression, views real-time progress, sees before/after metrics, and downloads the compressed file. Deduplication cache avoids re-compression of identical files, and anti-inflation logic ensures files never grow larger.

**Independent Test**: Upload a sample PDF or DOCX file with images; verify output size decreases by $\ge 30\%$, verify 100% content/page preservation, verify download works.

### Tests for User Story 1 (MANDATORY - Spec-Driven TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [X] T014 [P] [US1] Contract test for `DocxCompressorEngine` and `PdfCompressorEngine` adhering to `ICompressorEngine` in `tests/contract/test_compression_engine.test.ts`
- [X] T015 [P] [US1] Contract test for `SqliteCompressionCache` adhering to `ICompressionCache` in `tests/contract/test_sqlite_cache.test.ts`
- [X] T016 [P] [US1] Integration test for real DOCX compression and media optimization in `tests/integration/test_docx_compression.test.ts`
- [X] T017 [P] [US1] Integration test for real PDF compression and stream optimization in `tests/integration/test_pdf_compression.test.ts`
- [X] T018 [P] [US1] Integration test for SQLite deduplication cache hit and anti-inflation protection in `tests/integration/test_cache_deduplication.test.ts`

### Implementation for User Story 1

- [X] T019 [P] [US1] Implement `DocxCompressorEngine` using `adm-zip` and `sharp` image optimization in `src/modules/compression/engines/docx-compressor-engine.ts`
- [X] T020 [P] [US1] Implement `PdfCompressorEngine` using Ghostscript/QPDF adapter with `pdf-lib` fallback in `src/modules/compression/engines/pdf-compressor-engine.ts`
- [X] T021 [P] [US1] Implement `LegacyDocCompressorEngine` using headless LibreOffice conversion adapter in `src/modules/compression/engines/legacy-doc-compressor-engine.ts`
- [X] T022 [US1] Implement core `CompressionService` orchestrator coordinating cache check, engine dispatch, anti-inflation check, and storage in `src/modules/compression/services/compression-service.ts`
- [X] T023 [US1] Implement single document compression API route handler in `src/app/api/compress/route.ts`
- [X] T024 [P] [US1] Implement file streaming download route handler in `src/app/api/download/[id]/route.ts`
- [X] T025 [P] [US1] Implement minimalist drag-and-drop file upload zone component in `src/components/file-dropzone.tsx`
- [X] T026 [P] [US1] Implement real-time compression progress indicator component in `src/components/compression-progress.tsx`
- [X] T027 [P] [US1] Implement before-and-after metrics dashboard and download action component in `src/components/metrics-dashboard.tsx`
- [X] T028 [US1] Assemble the main single-document compression interface in `src/app/page.tsx`

**Checkpoint**: User Story 1 should be fully functional and testable independently (MVP Complete).

---

## Phase 4: User Story 2 - Compression Profiles & Quality Controls (Priority: P2)

**Goal**: User selects between *Recommended* (balanced 150 DPI), *Maximum* (aggressive 72 DPI), and *High Fidelity* (archival 300 DPI) profiles to control compression intensity and quality tradeoffs.

**Independent Test**: Compress the same graphic-heavy document under "Maximum" and "High Fidelity", verifying Maximum produces smaller byte size while both preserve layout and text.

### Tests for User Story 2 (MANDATORY - Spec-Driven TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [X] T029 [P] [US2] Unit tests for compression profile parameter resolution and validation in `tests/unit/test_compression_profiles.test.ts`
- [X] T030 [P] [US2] Integration tests verifying size and visual fidelity differences between Maximum and High Fidelity profiles in `tests/integration/test_compression_profiles.test.ts`

### Implementation for User Story 2

- [X] T031 [P] [US2] Implement profile definitions and parameter mappings (*Recommended*, *Maximum*, *High Fidelity*) in `src/modules/compression/profiles/compression-profiles.ts`
- [X] T032 [US2] Update `DocxCompressorEngine` and `PdfCompressorEngine` to apply profile-specific quality and DPI thresholds in `src/modules/compression/engines/docx-compressor-engine.ts` and `src/modules/compression/engines/pdf-compressor-engine.ts`
- [X] T033 [P] [US2] Implement profile selector tabs component with clear descriptions and visual badges in `src/components/profile-selector.tsx`
- [X] T034 [US2] Integrate profile selection into `src/app/page.tsx` and pass profile parameters through `src/app/api/compress/route.ts`

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Batch Document Compression (Priority: P3)

**Goal**: User selects multiple documents simultaneously, triggers batch compression, observes per-file progress, handles failures gracefully with error isolation, and downloads individual files or a combined zip archive.

**Independent Test**: Upload 3 mixed files (PDF + DOCX + invalid file); verify valid files compress, invalid file shows clear error, and overall batch summary displays aggregate savings.

### Tests for User Story 3 (MANDATORY - Spec-Driven TDD) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [X] T035 [P] [US3] Unit tests for batch queue orchestration, progress aggregation, and error isolation in `tests/unit/test_batch_processor.test.ts`
- [X] T036 [P] [US3] Integration test for batch compression API endpoint processing mixed documents in `tests/integration/test_batch_compression.test.ts`

### Implementation for User Story 3

- [X] T037 [P] [US3] Implement `BatchCompressionService` orchestrating concurrent processing and zip archive bundling in `src/modules/compression/services/batch-compression-service.ts`
- [X] T038 [US3] Implement batch compression API route handler in `src/app/api/batch/compress/route.ts`
- [X] T039 [P] [US3] Implement batch queue manager and multi-file progress list component in `src/components/batch-queue.tsx`
- [X] T040 [P] [US3] Implement batch summary metrics view and bulk zip download component in `src/components/batch-summary.tsx`
- [X] T041 [US3] Integrate batch processing mode and multi-file drag-and-drop handling into `src/app/page.tsx`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, cleanup, and hardening

- [X] T042 [P] Implement automatic temporary file cleanup cron/scheduled job in `src/modules/storage/services/cleanup-service.ts`
- [X] T043 [P] Verify zero TypeScript compiler errors (`tsc --noEmit`) and configure strict ESLint rules in `.eslintrc.json`
- [X] T044 [P] Run complete automated test suite and generate test coverage report in `tests/`
- [X] T045 Execute end-to-end quickstart validation scenarios defined in `specs/001-compress-documents/quickstart.md`
- [X] T046 [P] Add comprehensive project documentation and API usage guide in `README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**.
- **User Story 1 (Phase 3)**: Depends on Foundational completion. Delivers the standalone MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion. Enhances compression profiles.
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion. Enhances multi-file processing.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Within Each User Story

1. Tests MUST be written first and proven to FAIL (TDD Red Phase).
2. Domain engines and services implemented to pass tests (TDD Green Phase).
3. API route handlers and server actions wired to services.
4. UI components built and integrated.
5. Refactor under test safety.

### Parallel Opportunities

- **Phase 1 Setup**: `T003`, `T004`, `T005`, `T006` can run in parallel.
- **Phase 2 Foundational**: `T009`, `T010`, `T011`, `T012` can run in parallel after `T007` and `T008`.
- **Phase 3 Tests (US1)**: `T014`, `T015`, `T016`, `T017`, `T018` can all be authored in parallel.
- **Phase 3 Engines (US1)**: `T019`, `T020`, `T021` can be implemented in parallel.
- **Phase 3 UI (US1)**: `T025`, `T026`, `T027` can be implemented in parallel.
- **Phase 4 & 5**: Once US1 completes, US2 (Profiles) and US3 (Batch) can be worked on concurrently by different developers.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001` - `T006`)
2. Complete Phase 2: Foundational (`T007` - `T013`)
3. Complete Phase 3: User Story 1 (`T014` - `T028`)
4. **STOP and VALIDATE**: Run `npm run test` and perform quickstart verification on single PDF & Word compression.
5. Deploy MVP!

### Incremental Delivery

1. Setup + Foundational → Solid base ready.
2. User Story 1 → Single document compression with deduplication cache (MVP ready).
3. User Story 2 → Multi-profile quality controls (Recommended, Maximum, High Fidelity).
4. User Story 3 → Batch compression with aggregate progress and bulk download.
5. Polish & Hardening → Production ready.
