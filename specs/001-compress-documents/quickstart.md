# Quickstart & Verification Guide: Document Compressor

**Feature**: Document Compression for PDF and Word Files (`001-compress-documents`)  
**Target Environment**: Node.js 20+ LTS / Next.js / Docker

---

## 1. Prerequisites & Environment Setup

### 1.1 Local Development
Ensure the following tools are installed:
- **Node.js**: $\ge 20.10.0$ LTS
- **npm** or **pnpm**
- *(Optional for full PDF optimization)*: **Ghostscript** (`gs`) and **qpdf** installed locally (or run via Docker).

### 1.2 Docker Setup
A Dockerfile and `docker-compose.yml` are provided with Ghostscript, QPDF, and LibreOffice pre-installed:
```bash
# Build and run with Docker
docker compose up --build
```
The application will be accessible at `http://localhost:3000`.

---

## 2. Installation & Database Initialization

```bash
# Install dependencies
npm install

# Initialize local SQLite database and migrations
npm run db:migrate
```

---

## 3. Running Automated Tests (Constitution Gate)

In accordance with **Constitution Principle V (Spec-Driven TDD)**, test suites validate real document processing without fictitious mocks:

```bash
# Run all unit and contract tests
npm run test

# Run contract tests specifically
npm run test:contract

# Run integration tests against real test fixtures (PDF, DOCX)
npm run test:integration
```

Expected test outcomes:
- `tests/contract/test_compression_engine.ts`: Confirms `DocxCompressorEngine` and `PdfCompressorEngine` satisfy `ICompressorEngine`.
- `tests/integration/test_pdf_compression.ts`: Proves a real PDF with uncompressed images shrinks by $\ge 30\%$ with zero text or page loss.
- `tests/integration/test_docx_compression.ts`: Proves a real DOCX with images shrinks by $\ge 30\%$ and retains all XML structure.
- `tests/integration/test_cache_deduplication.ts`: Proves submitting the same file twice produces an immediate cache hit (`wasCached: true`) with $0$ redundant compression cycles.
- `tests/integration/test_anti_inflation.ts`: Proves already optimized files trigger anti-inflation protection.

---

## 4. End-to-End Validation Scenario

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

2. **Single Document Flow**:
   - Drag and drop a test document (e.g. `tests/fixtures/sample-with-images.pdf`).
   - Select the **Recommended** profile.
   - Click **Compress Document**.
   - Verify progress bar and real-time transition to the Results screen.
   - Verify metrics: Original size, Compressed size, Reduction %, and Download button.
   - Click **Download** and verify the downloaded file opens correctly.

3. **Deduplication Verification Flow**:
   - Drag and drop the **exact same file** again with the same profile.
   - Click **Compress Document**.
   - Notice the response completes in $<100\text{ms}$ with the badge **"Retrieved from Cache"**.
   - Check SQLite database (`data/compressor.db`):
     ```bash
     sqlite3 data/compressor.db "SELECT content_hash, profile, hit_count FROM compression_cache;"
     ```
     Verify `hit_count` incremented to `2`.

4. **Batch Document Flow**:
   - Drag and drop 3 documents simultaneously (`.pdf` and `.docx`).
   - Click **Compress All**.
   - Verify individual progress meters for each file and aggregate reduction metrics upon completion.
