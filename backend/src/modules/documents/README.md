# Documents Module (DocSync Pro Backend)

**Owner:** Muzammil  
**Role:** Backend Security, OCC, Query Optimization & AST Hardening Specialist  
**Architecture:** Layered RESTful micro-module integrating Mongoose Atlas persistence, ProseMirror AST manipulation, atomic Optimistic Concurrency Control (OCC), query indexing optimizations, and event-driven snapshot checkpoints.

---

## 🛡️ Master Audit Report Resolution Summary (All 46 Issues Fixed)

1. **AST Hardening & Security:**
   - `[Issue #1 & #2]`: Implemented `isSafeUrl()` to strip SVG XSS vectors (`data:image/svg+xml`), `javascript:`, `vbscript:`, and unsafe data URIs while allowing safe schemes (`http:`, `https:`, `mailto:`, `tel:`, safe relative paths, and safe raster base64 images `png/jpeg/webp/gif`).
   - `[Prototype Pollution]`: Stripped reserved keys (`__proto__`, `constructor`, `prototype`) during AST recursion and node sanitization.
   - `[Issue #3]`: HTML-escaped `<, >, ", ', &` via `escapeHtml()` in text nodes before Markdown/HTML exports.
   - `[Issue #8]`: Implemented cryptographically secure RFC 4122 v4 UUID generator `generateUuid()` with backward-compatible fallback.
   - `[Issue #41]`: Preserved newlines (`\n`) in `codeBlock` nodes and structured line-breaks during plain-text extraction.

2. **Atomic OCC & Concurrency Service Layer:**
   - `[Issue #9]`: Implemented atomic Optimistic Concurrency Control (OCC) in `autosaveDocumentContent` using `DocumentModel.findOneAndUpdate({ _id: id, version: baseVersion, isArchived: false }, { $set: { content: sanitizedContent, plainText, lastModifiedBy: userId }, $inc: { version: 1 } }, { new: true, runValidators: true }).lean()`.
   - `[3-Way Merge Support]`: On 409 conflict, retrieves current server state and attaches it to the error payload (`{ currentVersion, baseVersion, serverDocument }`) enabling clients to perform seamless 3-way merges.
   - `[Issue #4]`: Enforced strict workspace boundary scoping across `getDocumentById`, `updateDocumentMetadata`, `autosaveDocumentContent`, `moveToTrash`, and `restoreFromTrash`.
   - `[Issue #13]`: Atomically increments document version (`$inc: { version: 1 }`) on metadata updates (title, cover, icon, folder) and tag modifications.
   - `[Issue #23]`: Applied `.lean()` projections across all read-only and write queries for minimal memory allocation.
   - `[Issue #36]`: Wrapped document duplication in atomic logic with fresh dynamic blockId regeneration.

3. **Mongoose Schema & Index Hardening:**
   - `[Issue #16]`: Added compound index `{ workspaceId: 1, folderId: 1, isArchived: 1 }`.
   - `[Issue #18]`: Added compound index `{ workspaceId: 1, tags: 1, isArchived: 1 }`.
   - `[Issue #19]`: Configured MongoDB TTL index on `scheduledPermanentDeletionAt` with exact `{ expireAfterSeconds: 0, sparse: true }`.
   - `[Issue #21]`: Capped embedded `attachments` array at max 100 items per document.
   - `[Issue #6]`: Validated `downloadUrl` in `AttachmentSubSchema` and `coverImage` in `DocumentSchema` against safe protocols.

4. **Input Validation & Request Guards:**
   - `[Issue #24]`: Enforced maximum AST recursion depth (`maxDepth = 30`) in `checkAstDepth()` to block DoS call-stack recursion bombs.
   - `[Issue #27]`: Strict MongoDB ObjectId regex (`/^[0-9a-fA-F]{24}$/`) and mock ID validation on `:id` route parameters.
   - `[Issue #26]`: Enforced title length cap (max 255 chars) and trimmed whitespace across create and update validations.
   - `[Issue #30]`: Implemented strict whitelist for attachment MIME types (`ALLOWED_ATTACHMENT_MIME_TYPES`).

5. **Controller & Event Bus Resiliency:**
   - `[Issue #32]`: Caught Mongoose duplicate key errors (`code === 11000`) and responded with uniform 409 Conflict.
   - `[Issue #34]`: Standardized uniform JSON error schema: `{ success: false, error: '...', message: '...' }`.
   - `[Issue #33]`: Wrapped `documentEvents.emit()` and `emitDocumentEvent()` in error boundaries and attached unhandled error listeners so listener failures never crash the server.
   - `[Issue #46]`: Sanitized `Content-Disposition` filenames in export downloads to prevent header injection (CRLF, quotes, path traversal).

6. **Search & Starter Templates:**
   - `[Issue #45]`: Escaped regex special characters via `escapeRegex()` and capped search query length to eliminate ReDoS vulnerabilities.
   - `[Issue #43]`: Re-generated dynamic unique `blockId`s (`block_${generateUuid()}`) whenever starter templates (`meeting_notes`, `prd`, `technical_rfc`) are hydrated.

7. **Bilingual Documentation:**
   - Added English JSDoc + `[ROMAN URDU]` contextual inline explanations across all functions, models, validators, controllers, and services.

---

## 🧪 Testing & Verification

Run document module unit tests:
```powershell
npm run test:documents
```

Run full monorepo test suite:
```powershell
npm test
```

Run syntax & import check:
```powershell
npm run check:backend
```

---

## 🇵🇰 [ROMAN URDU] Mukhtasar Khulasa

Yeh module DocSync Pro ke backend document system ko secure, fast, aur resilient banata hai:
- **XSS & SVG Protection:** SVG files aur `javascript:` links ko AST se remove karta hai.
- **OCC Concurrency:** Do users agar aik sath save karein toh version mismatch pe 409 Conflict return karta hai taake data overwrite na ho.
- **Query Optimization:** Lean queries aur compound indexes ke sath database response time ko tez karta hai.
- **Deep AST Security:** Max 30 levels ki depth limit lagata hai taake stack overflow DoS attacks na ho sakein.
- **Unique Block IDs:** Har template aur duplicated document ke blocks ko fresh UUID deta hai.
