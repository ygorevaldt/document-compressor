# Technical Research: Document Compression Engine & Architecture

**Feature**: Document Compression for PDF and Word Files (`001-compress-documents`)  
**Date**: 2026-09-17  
**Status**: Completed

---

## 1. Document Compression Engines

### 1.1 PDF Compression Strategy
- **Decision**: Hybrid adapter architecture implementing `IPdfCompressorEngine`.
  - **Primary Server/Container Engine**: Ghostscript (`gs`) and `qpdf` executed via a typed child process adapter (`GhostscriptPdfEngine`). Ghostscript optimizes image streams, re-encodes color spaces, deflates object streams, and removes redundant structures with parameters like `-dPDFSETTINGS=/ebook` (Recommended profile) and `-dPDFSETTINGS=/screen` (Maximum profile) plus `-dColorImageResolution=150` / `72`. `qpdf` linearizes and compresses cross-reference streams.
  - **Pure Node/TypeScript Fallback**: `pdf-lib` combined with object de-duplication and Flate compression (`NodePdfEngine`) to allow testing and running in environments where Ghostscript is not installed.
- **Rationale**: Ghostscript is the battle-tested industry standard for document distilling and achieves 40-70% reduction on media-heavy PDFs without altering text vectors or font glyphs. A modular adapter preserves decoupling and allows swapping engines without touching business logic.
- **Alternatives Considered**:
  - *Sharp*: Sharp does not support PDF manipulation or internal PDF stream compression (rejected).
  - *PDFsharp*: .NET library, incompatible with Node.js runtime (rejected).
  - *Pure pdf-lib only*: Great for vector structural manipulation, but lacks built-in JPEG/Flate downsampling algorithms needed for aggressive size reduction on media-heavy PDFs (retained as fallback, not sole engine).

---

### 1.2 DOCX Compression Strategy
- **Decision**: Native OpenXML ZIP pipeline using `adm-zip` and `sharp` (`DocxCompressorEngine`).
  - `.docx` files are standard PKZip archives.
  - The engine unpacks the archive in memory or temporary disk space, identifies all media assets in `word/media/` (JPEG, PNG, TIFF, etc.), and optimizes them using `sharp` according to the selected profile (e.g., re-compressing JPEG with quality 80 for Recommended, quality 65 for Maximum; compressing PNGs via palette quantization).
  - Internal XML files (`word/document.xml`, `word/styles.xml`) are re-deflated at maximum compression level (`DEFLATE` level 9).
  - Original file extensions and internal XML relationship identifiers (`.rels` and `[Content_Types].xml`) are preserved exactly to guarantee zero XML corruption and 100% document fidelity.
- **Rationale**: Embedded raster images account for >90% of the byte size in oversized Word documents. Processing them with `sharp` delivers dramatic reductions (50%+) while keeping all text, tables, styles, and document relationships intact.
- **Alternatives Considered**:
  - *External Office conversion*: Unnecessary overhead and slow for modern `.docx` when direct OpenXML media optimization is faster, safer, and 100% fidelity-preserving.
  - *docxtemplater*: Designed for template variable filling, not stream optimization.

---

### 1.3 Legacy DOC Compression Strategy
- **Decision**: Headless document converter adapter (`LegacyDocCompressorEngine`).
  - Legacy `.doc` (Word 97-2003) uses the proprietary OLE2 Compound File Binary Format (CFBF).
  - In Docker or server environments with LibreOffice available, the file is converted headlessly (`soffice --headless --convert-to docx`) into modern OpenXML, optimized via the high-efficiency `DocxCompressorEngine`, and converted back to `.doc` (or delivered as optimized `.doc`).
  - If LibreOffice is absent, the system detects this capability gap and notifies the user with clear feedback or recommends modernizing the document.
- **Rationale**: Direct binary manipulation of 25-year-old proprietary Microsoft binary OLE formats without LibreOffice is brittle and prone to structural corruption.

---

## 2. Deduplication & Caching Architecture

### 2.1 Content Hashing & Cache Key
- **Decision**: SHA-256 cryptographic hash calculated from the raw uploaded document buffer combined with the compression profile name and parameters:
  $$\text{CacheKey} = \text{SHA256}(\text{FileBuffer} + \text{ProfileName})$$
- **Rationale**: Guarantees deterministic, collision-resistant identification. If a user uploads the exact same 25MB report with the "Recommended" profile, the system detects the hash, skips all compression work, and returns the cached result instantaneously.
- **Alternatives Considered**:
  - *Filename + Timestamp*: Fragile; files are frequently renamed or re-downloaded.
  - *MD5*: Cryptographically deprecated and higher risk of collisions.

---

### 2.2 Database & Persistence
- **Decision**: SQLite with `better-sqlite3` and `drizzle-orm` (or direct typed prepared statements).
  - Lightweight, zero-configuration embedded database stored at `data/compressor.db`.
  - Compressed files stored on local filesystem or mounted volume at `storage/compressed/<hash>-<profile>.<ext>`.
  - Metadata table `compression_cache` tracks:
    - `id` (UUID / ULID)
    - `content_hash` (TEXT, Indexed)
    - `profile` (TEXT)
    - `original_name` (TEXT)
    - `mime_type` (TEXT)
    - `original_size` (INTEGER)
    - `compressed_size` (INTEGER)
    - `bytes_saved` (INTEGER)
    - `reduction_percentage` (REAL)
    - `file_path` (TEXT)
    - `created_at` (INTEGER / TIMESTAMP)
    - `hit_count` (INTEGER)
- **Rationale**: Blazing fast synchronous execution in Node.js, zero network overhead, easily containerized with Docker volumes (`-v ./data:/app/data`), and fully compliant with the Monolith architectural principle.
- **Alternatives Considered**:
  - *PostgreSQL / Redis*: Overkill for a modular single-container monolith, adding unnecessary operational complexity.

---

## 3. Web Framework & Frontend UI

### 3.1 Next.js App Router (Modular Monolith)
- **Decision**: Next.js 14+ with App Router.
  - Server Actions and Route Handlers for file streaming and compression endpoints.
  - Clean separation of concerns:
    - API/Server layer handles multipart file streaming and delegates directly to `CompressionService`.
    - No business logic in UI components or route handlers.
- **Rationale**: Provides full-stack TypeScript cohesion, server-side processing for heavy file buffers, and rich client-side interactivity in a single deployable artifact.

### 3.2 shadcn/ui & Tailwind CSS
- **Decision**: shadcn/ui component library built on Radix UI primitives and Tailwind CSS.
  - Minimalist, distraction-free aesthetic matching Constitution Principle III.
  - Components utilized: `Card`, `Progress`, `Button`, `Badge`, `Tabs`, `Table`, `Alert`, `Dialog`.
  - Lucide React icons for intuitive visual cues (e.g., `FileText`, `ArrowDown`, `CheckCircle2`, `Sparkles`).
- **Rationale**: Highly customizable, accessible (WCAG AA), clean design language without bloated third-party styling dependencies.

---

## 4. Testing Framework

- **Decision**: Vitest with `@testing-library/react` for unit and contract tests; Playwright for end-to-end verification.
- **Test Fixtures**: Realistic, representative documents placed in `tests/fixtures/`:
  - `sample-with-images.pdf` (Multi-page PDF with uncompressed raster images)
  - `sample-document.docx` (OpenXML document with embedded media in `word/media/`)
  - `sample-already-compressed.pdf` (Minimal text PDF to verify anti-inflation logic)
  - `corrupted.pdf` (Invalid header to verify error rejection)
- **Rationale**: Fast execution, native TypeScript support, and enables strict compliance with Constitution Principle V (Spec-Driven TDD with Real Acceptance Testing).
