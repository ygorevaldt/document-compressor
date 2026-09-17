# Document Compressor

> High-performance, lossless document compression for PDF, DOCX, and legacy DOC files with automated deduplication caching and anti-inflation protection.

---

## 📖 Overview

**Document Compressor** is a decoupled modular monolith engineered in **TypeScript**, **Node.js 20+**, and **Next.js 14**. It enables individuals and automated workflows to drastically reduce file sizes ($\ge 30\%$ on average, up to $70\%$ on media-heavy documents) while guaranteeing **100% fidelity**:
- **Zero text or font alteration**
- **Zero layout distortion**
- **Zero missing pages or XML metadata corruption**
- **Anti-Inflation Guarantee**: If a file is already optimized, the original is returned without expansion.

---

## ⚡ Core Features

- **Multi-Format Support**:
  - **PDF**: Stream distillation via Ghostscript/QPDF adapter with pure Node.js/TypeScript fallback using `pdf-lib` and `sharp`.
  - **DOCX**: Native OpenXML ZIP pipeline extracting embedded media, re-compressing raster images with MozJPEG / PNG palette quantization via `sharp`, and re-deflating XML streams.
  - **DOC**: Legacy Word 97-2003 conversion and distillation via headless LibreOffice adapter.
- **Smart Deduplication Cache**:
  - SHA-256 content hashing prevents redundant re-compression of identical files.
  - Cache hits respond in $<100\text{ms}$ with zero CPU/disk re-encoding.
  - Embedded SQLite database powered by `better-sqlite3` and `drizzle-orm`.
- **Compression Profiles**:
  - **Recommended** (150 DPI, JPEG quality 80, PNG palette quantization): Balanced everyday sharing and email.
  - **Maximum** (72 DPI, JPEG quality 65, downscale $>1200\text{px}$): Aggressive reduction for tight portal upload limits.
  - **High Fidelity** (300 DPI, JPEG quality 90, archival preservation): Best quality for printing and legal archives.
- **Single & Batch Modes**:
  - Process single files with instant before/after metrics.
  - Process batches of up to 10 mixed files with error isolation and bulk ZIP bundle download.
- **Light & Dark Mode**:
  - Automatically matches system preference by default, with an accessible 3-state switcher (Claro, Sistema, Escuro).
- **Safe & Confidential Storage**:
  - Local documents are strictly isolated in `storage/` and never tracked by Git.
  - In cloud/production environments, files use ephemeral storage (`os.tmpdir()`) or mounted volumes (`STORAGE_DIR`).
- **Clean Minimalist UI**:
  - Built with Tailwind CSS and shadcn/ui components for a frictionless, distraction-free user experience.

---

## 🏗️ Architecture

```text
src/
├── core/                       # Shared domain entities, value objects, and typed errors
│   ├── errors/domain-errors.ts
│   └── types/document.ts
├── modules/
│   ├── compression/            # Compression domain module
│   │   ├── contracts/          # ICompressorEngine, ICompressionService
│   │   ├── engines/            # PdfCompressorEngine, DocxCompressorEngine, LegacyDocCompressorEngine
│   │   ├── profiles/           # Compression profile definitions & mappings
│   │   └── services/           # CompressionService, BatchCompressionService
│   ├── cache/                  # Deduplication caching module
│   │   ├── contracts/          # ICompressionCache
│   │   ├── db/                 # SQLite connection, Drizzle schema & migrations
│   │   └── repositories/       # SqliteCompressionCache
│   └── storage/                # Storage & cleanup module
│       ├── contracts/          # IStorageService
│       └── services/           # LocalStorageService, CleanupService
├── app/                        # Next.js App Router (Presentation & API)
│   ├── api/
│   │   ├── compress/route.ts
│   │   ├── download/[id]/route.ts
│   │   ├── batch/compress/route.ts
│   │   └── download/batch/[fileName]/route.ts
│   ├── layout.tsx
│   └── page.tsx
└── components/                 # Minimalist shadcn/ui and custom views
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.10.0+ LTS
- npm or pnpm

### Quickstart (Local)
```bash
# 1. Clone repository
git clone https://github.com/ygorevaldt/compressor-de-documentos.git
cd compressor-de-documentos

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup
For full containerized execution with Ghostscript, QPDF, and LibreOffice pre-configured:
```bash
# Start container in detached mode
npm run compose:up

# Rebuild container with latest changes
npm run compose:build

# View container logs
npm run compose:logs

# Stop container
npm run compose:stop

# Stop and remove containers
npm run compose:down
```

---

## 📡 HTTP API Reference

### 1. Single Document Compression
- **Endpoint**: `POST /api/compress`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file (`.pdf`, `.docx`, `.doc` $\le 500$MB)
  - `profile`: `recommended` | `maximum` | `high_fidelity` (Optional, default: `recommended`)
- **Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "c3b9d1d5-912f-4886-9a2f-e8b2641a1cf1",
    "fileName": "quarterly-report.pdf",
    "format": "pdf",
    "originalSize": 18452000,
    "compressedSize": 8214000,
    "bytesSaved": 10238000,
    "reductionPercentage": 55.48,
    "wasCached": false,
    "wasInflatedPrevented": false,
    "downloadUrl": "/api/download/c3b9d1d5-912f-4886-9a2f-e8b2641a1cf1",
    "executionDurationMs": 1420
  }
}
```

### 2. File Download
- **Endpoint**: `GET /api/download/:jobId`
- Streams the compressed document binary with appropriate `Content-Disposition` and `Content-Type`.

### 3. Batch Document Compression
- **Endpoint**: `POST /api/batch/compress`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `files`: Multiple binary files (up to 10, $\le 500$MB each)
  - `profile`: `recommended` | `maximum` | `high_fidelity`
- **Response**: Returns per-file status with error isolation and a bulk ZIP download URL (`zipDownloadUrl`).

### 4. Batch ZIP Download
- **Endpoint**: `GET /api/download/batch/:fileName`
- Streams the bundled ZIP archive containing all successfully compressed files.

---

## 🧪 Testing & Quality Gates

In accordance with **Constitution Principle V (Spec-Driven TDD)**, all test suites execute against authentic document fixtures:

```bash
# Run all unit, contract, and integration tests
npm run test

# Run tests with V8 code coverage report
npx vitest run --coverage

# Run TypeScript type check
npx tsc --noEmit

# Run strict ESLint verification
npm run lint

# Build production bundle
npm run build
```

---

## 👤 Autor

Criado e desenvolvido por **Ygor Evaldt**  
- GitHub: [@ygorevaldt](https://github.com/ygorevaldt)

---

## 📜 Licença

Distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
