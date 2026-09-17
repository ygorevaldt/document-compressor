# HTTP API & Server Contracts: Document Compressor

**Feature**: Document Compression for PDF and Word Files (`001-compress-documents`)  
**Protocol**: HTTP/1.1 & HTTP/2 (Next.js Route Handlers & Server Actions)

---

## 1. Single Document Compression

### `POST /api/compress`

Processes a single document (`.pdf`, `.docx`, or `.doc`).

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: `Binary File` (Required, max 100MB)
  - `profile`: `string` (Optional, enum: `recommended` | `maximum` | `high_fidelity`, default: `recommended`)

#### Responses

##### 200 OK
Returned when the file is processed (either newly compressed or served from cache).

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

##### 400 Bad Request
Returned when file format is invalid, file is empty, or password-protected.

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DOCUMENT_FORMAT",
    "message": "The uploaded file format is unsupported. Only .pdf, .docx, and .doc files are permitted."
  }
}
```

##### 413 Payload Too Large
```json
{
  "success": false,
  "error": {
    "code": "FILE_SIZE_EXCEEDED",
    "message": "Uploaded file exceeds maximum limit of 100MB."
  }
}
```

---

## 2. File Download

### `GET /api/download/:jobId`

Streams the compressed document file to the client.

#### Response Headers
- `Content-Type`: `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `Content-Disposition`: `attachment; filename="quarterly-report-compressed.pdf"`
- `Content-Length`: `<compressedSize>`

---

## 3. Batch Document Compression

### `POST /api/batch/compress`

Queues or executes compression for multiple files.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `files`: `Binary File[]` (Up to 10 files per batch)
  - `profile`: `string` (`recommended` | `maximum` | `high_fidelity`)

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "batchId": "a910bf4c-83b4-4b5c-a541-11d27cbca912",
    "totalFiles": 3,
    "totalOriginalBytes": 45000000,
    "totalCompressedBytes": 21000000,
    "totalBytesSaved": 24000000,
    "overallReductionPercentage": 53.33,
    "items": [
      {
        "fileName": "report1.pdf",
        "status": "completed",
        "originalSize": 15000000,
        "compressedSize": 7000000,
        "bytesSaved": 8000000,
        "reductionPercentage": 53.33,
        "downloadUrl": "/api/download/..."
      },
      {
        "fileName": "corrupted.pdf",
        "status": "failed",
        "error": "File header is corrupted."
      }
    ]
  }
}
```
