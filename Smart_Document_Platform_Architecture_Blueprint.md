# Smart Document Collaboration Platform
## Software Architecture and System Design Blueprint

Prepared for: Full development team, pre-implementation review
Source: Attached project specification PDF (Smart Document Collaboration Platform)
Scope: Architecture and design only. No implementation code included.

---

## 1. Project Overview

The platform is a web application where a team can create, edit, comment on, share, search, and version documents together in real time. Think of it as a lightweight blend of Google Docs (real-time editing), Notion (workspaces and folders), and a document manager (file uploads, permissions, search).

**End-to-end user journey (as defined in the spec):**

1. **Registration** — user signs up with email, verifies email, then logs in. A session is created and maintained until logout or expiry.
2. **Workspace entry** — user lands on a Dashboard showing recent documents, "my documents," "shared with me," favorites, recent activity, and their workspaces.
3. **Organization** — user creates or joins a Workspace, creates Folders inside it, and creates Documents inside folders (or at workspace root).
4. **Document creation** — user opens the rich-text editor and writes content (headings, text formatting, lists, links, images, tables, code blocks, quotes, file attachments). Changes autosave.
5. **Collaboration** — other workspace members with access open the same document. All active editors see each other's presence, cursors, and edits live.
6. **Commenting** — users highlight content, add comments, @mention teammates, reply, resolve, or delete comments. Mentioned users get notified.
7. **Versioning** — every major change is captured as a version. Users can browse history, see who changed what and when, and restore an old version.
8. **Sharing** — the document owner sets sharing mode (Private, Workspace-only, Anyone with link) and assigns permission levels (Owner, Editor, Commenter, Viewer) to specific people or the whole workspace.
9. **Search** — user searches globally across documents, folders, users, and workspace content, with partial match and filters.
10. **File management** — user uploads, downloads, renames, deletes, and moves files and folders, for supported formats (PDF, DOCX, XLSX, PNG, JPG).

This flow is the backbone the rest of this blueprint is organized around.

---

## 2. Critical Functional Modules

Based directly on the spec's "Core Requirements" (sections 1 to 11), the system has eleven functional modules:

| # | Module | Responsibility |
|---|--------|-----------------|
| 1 | Authentication | Sign up, login, logout, forgot password, email verification, session management |
| 2 | Workspace & Organization | Workspaces, Folders, Documents, Teams, workspace membership |
| 3 | Document Editor | Rich-text editing surface and autosave |
| 4 | Real-Time Collaboration | Live multi-user editing, presence, cursors, sync |
| 5 | Comments | Add, reply, mention, resolve, delete comments |
| 6 | Version History | Snapshotting, diffing (conceptually), restoring documents |
| 7 | Sharing & Permissions | Access modes and role-based permission enforcement |
| 8 | Search | Global search across entities with partial match and filters |
| 9 | Notifications | Event-driven alerts to users |
| 10 | Dashboard | Aggregated personalized view of activity and content |
| 11 | File Management | Upload, download, rename, delete, move, organize files/folders |

Two cross-cutting modules are implied by the spec but not user-facing: **Activity Log** (spec lists it as a database entity, feeding Dashboard and Notifications) and **API/Backend Gateway** (spec requires REST APIs for every module above).

---

## 3. Module Ownership and Boundaries

Each module below is written so one developer, or one small pair, can own it without stepping on another module's data or routes.

| Module | Owns | Does NOT own | Talks to via |
|--------|------|----------------|----------------|
| Authentication | User identity, credentials, sessions, email verification tokens, password reset tokens | Workspace membership, roles | Issues identity token consumed by all other modules |
| Workspace & Organization | Workspace, Folder, Team records and hierarchy, Workspace Member records | Document content, permissions logic detail | Provides workspace/folder IDs to Document and Permission modules |
| Document Editor | Document content blocks, autosave, structural document data | Who can access it (that's Permissions), how it syncs live (that's Real-Time) | Reads document via Document Architecture API, writes autosave events |
| Real-Time Collaboration | Live session state, presence, cursor broadcast, change propagation | Persisted document content (that's Document Editor's DB write), permission checks | Subscribes to document channel, calls Permission check on join |
| Comments | Comment records, threads, mention parsing, resolve state | Document body content, notification delivery mechanics | Emits mention/comment events to Notification module |
| Version History | Version snapshots, diffs, restore operations | Live editing session | Listens to Document Editor save events |
| Sharing & Permissions | Permission records, sharing mode, role evaluation | Enforcement inside UI components (each module enforces using this module's decisions) | Exposes a single "can user X do Y on document Z" check used by every module |
| Search | Search index, query handling, filters | Source-of-truth data (it indexes copies) | Subscribes to change events from Document, Folder, User, Workspace modules |
| Notifications | Notification records, delivery, read/unread state | The business event itself (only reacts to events) | Consumes events from Comments, Sharing, Document, Permission modules |
| Dashboard | Aggregation queries/views only | No original data | Reads from Document, Workspace, Activity Log |
| File Management | File metadata, storage pointers, folder placement of files | Document body embedding logic (Editor references file URLs) | Provides file records consumed by Editor and Document Architecture |

**Principle:** every module owns its own database tables and exposes an API/service interface. No module reaches into another module's tables directly. Cross-module needs go through the API layer or an internal event/message.

---

## 4. Module Dependencies

**Dependency map:**

```
Authentication  ─────────────────────────────┐
     │                                        │
     ▼                                        ▼
Workspace & Organization ───────────► Sharing & Permissions
     │                                        │
     ▼                                        ▼
Document Editor  ◄──────────────────► Real-Time Collaboration
     │        │                                │
     ▼        ▼                                ▼
 Comments  Version History              (uses Permissions to gate access)
     │        │
     ▼        ▼
Notifications  Search
     │
     ▼
  Dashboard
     │
     ▼
File Management (parallel branch, feeds Editor + Dashboard)
```

**Direct dependencies**
- Every module depends on **Authentication** (must know who the user is).
- **Workspace & Organization** depends on Authentication only.
- **Document Editor** depends on Workspace (needs a folder/workspace to live in) and Permissions (must check access before allowing edit).
- **Real-Time Collaboration** depends on Document Editor (edits the same content) and Permissions (must check access before allowing a socket join).
- **Comments** and **Version History** both depend on Document Editor.
- **Notifications** depends on Comments, Sharing & Permissions, and Document Editor (they are the event sources).
- **Search** depends on Document Editor, Workspace, and Authentication (search results are permission-filtered).
- **Dashboard** depends on Document Editor, Workspace, Notifications, and File Management (it aggregates all of them).
- **File Management** depends on Authentication and Workspace, and feeds into Document Editor (attachments) and Dashboard (recent files).

**Indirect dependencies**
- Real-Time Collaboration indirectly depends on Workspace (through Permissions and Document Editor).
- Notifications indirectly depends on Workspace (through Sharing, since sharing changes originate from workspace membership).
- Dashboard indirectly depends on Permissions (through everything it aggregates being permission-filtered).

**Shared services** (used by nearly every module, so they should be built early and treated as platform infrastructure, not "someone's module"):
- **Permission Check Service** — one shared function every module calls before returning or mutating data.
- **Event Bus / internal pub-sub** — used by Comments, Sharing, Document Editor, and File Management to notify Search and Notifications without tight coupling.
- **Identity/Session Service** — issued by Authentication, verified by every API request.

**Critical integration points**
- Document Editor ↔ Real-Time Collaboration (must agree on the same document data model).
- Sharing & Permissions ↔ every module (single source of truth for access decisions).
- Comments/Sharing/Document ↔ Notifications (event contract must be agreed early).
- Document Editor ↔ Search (index update contract).

---

## 5. Document Architecture

A **Document** is the central object in the system. Conceptually:

- A Document belongs to exactly one **Workspace**, and optionally sits inside one **Folder** (or workspace root).
- A Document has **content** made of rich-text blocks (paragraphs, headings, lists, tables, code blocks, quotes, images, links) as defined in spec section 3.
- A Document has an **owner** (creator, by default Owner-level permission) and a set of **Permissions** records granting Editor / Commenter / Viewer to other users or the whole workspace.
- A Document has a **sharing mode**: Private, Workspace-only, or Anyone-with-link.
- A Document has a stream of **Comments**, each optionally anchored to a piece of content, with replies, mentions, and resolve state.
- A Document has a history of **Versions**, each version capturing a snapshot at a point in time, tied to the user who made the change.
- A Document can reference **Files** (attachments uploaded through File Management).
- Every meaningful change to a Document generates an **Activity Log** entry (who did what, when) which feeds the Dashboard and Notifications.

```
Workspace
   └── Folder (optional nesting)
          └── Document
                 ├── Content (blocks)
                 ├── Permissions (who can Own/Edit/Comment/View)
                 ├── Comments (threaded, mentions, resolve)
                 ├── Versions (snapshots + author + timestamp)
                 ├── Files (attachments)
                 └── Activity Log entries
```

This is the conceptual shape; exact block/version storage strategy is marked "To Be Decided" in Section 22.

---

## 6. Real-Time Collaboration Architecture

**Goal:** multiple users editing the same document see each other's changes live, as required by spec section 4.

**High-level flow:**

1. When a user opens a document, the client opens a WebSocket (Socket.IO, per the recommended stack) connection and joins a "room" identified by the document ID.
2. Before the join is accepted, the server checks with the **Permission Check Service** that this user has at least Viewer access (Editor access to send changes).
3. On join, the server broadcasts a **presence** event to the room: this user is now active, with a display name/avatar and a color assigned for their cursor.
4. As the user edits, the client sends granular **change events** (not the whole document) to the server, which the server relays to all other participants in that room, and also queues for persistence (autosave, per spec section 3).
5. **Cursor and selection position** are broadcast the same way as content changes, but are ephemeral (not persisted).
6. **Online/offline status**: presence is removed when a socket disconnects; a short grace period can smooth over brief network drops rather than instantly showing "offline."
7. **Synchronization / conflict handling**: when two users edit the same region at the same time, the system needs a merge strategy so no one's edit is silently lost. The specific algorithm (Operational Transformation vs CRDT) is not specified in the PDF and is marked "To Be Decided" (see Section 22), but the architecture assumes changes are small, ordered operations rather than whole-document overwrites, so a merge strategy can be layered in.

**Presence and sync responsibilities split:**

| Concern | Owned by |
|---------|----------|
| Who is currently viewing/editing | Real-Time module (ephemeral, in-memory/session store) |
| What the document actually contains | Document Editor module (persisted) |
| Whether a user is allowed to join/edit | Permission Check Service |

No implementation code is specified here per instructions; this section stays at the "what happens and why" level.

---

## 7. Authentication and Authorization

**Authentication** (proving who you are) and **Authorization** (deciding what you can do) are deliberately separate concerns.

**Authentication flow (from spec section 1):**
- Sign Up → creates a User record, sends verification email.
- Email Verification → user must verify before full access (exact restrictions before verification: To Be Decided).
- Login → validates credentials, creates a session.
- Session Management → session stays valid until logout or expiry.
- Forgot Password → generates a reset token, emailed, single-use.
- Logout → invalidates the session.

**Authorization chain**, top to bottom:

```
User (authenticated identity)
   │
   ▼
Workspace Membership (is this user even in the workspace?)
   │
   ▼
Role within Workspace (member / admin — exact roles: To Be Decided,
   spec only defines document-level roles explicitly)
   │
   ▼
Document Permission (Owner / Editor / Commenter / Viewer — spec section 7)
   │
   ▼
Sharing Mode gate (Private / Workspace-only / Anyone with link)
```

Every API request and every socket action should pass through this chain via the shared Permission Check Service (Section 4), so the logic exists in exactly one place.

---

## 8. Data Architecture

Conceptual entities, straight from the spec's Database Requirements list, plus their relationships.

| Entity | Key relationships |
|--------|---------------------|
| **Users** | has many Workspace Members, Documents (as owner), Comments, Notifications, Activity Logs |
| **Workspaces** | has many Workspace Members, Folders, Documents, Teams |
| **Workspace Members** | belongs to one Workspace, belongs to one User, has a role |
| **Documents** | belongs to one Workspace, belongs to zero-or-one Folder, has one owner (User), has many Comments, Versions, Permissions, Files, Activity Logs |
| **Folders** | belongs to one Workspace, can contain many Documents, can nest (self-referencing parent folder) |
| **Comments** | belongs to one Document, belongs to one User (author), can reply to another Comment (self-referencing parent), can mention many Users |
| **Document Versions** | belongs to one Document, belongs to one User (who made the change), has a timestamp |
| **Permissions** | belongs to one Document, belongs to one User or one Workspace (whole-workspace grant), has a role (Owner/Editor/Commenter/Viewer) |
| **Notifications** | belongs to one User (recipient), references a source event (comment, share, mention, update) |
| **Files** | belongs to one Workspace, optionally attached to one Document or placed in one Folder, belongs to one uploader (User) |
| **Activity Logs** | belongs to one Document or Workspace, belongs to one User (actor), records an action type and timestamp |

```
Users ─┬─< Workspace Members >─┬─ Workspaces ─┬─< Folders (self-ref nesting)
       │                        │              ├─< Documents ─┬─< Comments (self-ref replies)
       │                        │              │               ├─< Document Versions
       │                        │              │               ├─< Permissions
       │                        │              │               ├─< Files
       │                        │              │               └─< Activity Logs
       │                        │              └─< Teams
       ├─< Notifications
       └─< Files (uploader)
```

Exact column-level schema is intentionally not specified here since the spec does not define field-level detail; that belongs in the ERD deliverable the team produces during implementation planning.

---

## 9. API Architecture

Major API groups required, matching spec's Backend Requirements list one-to-one:

| API Group | Purpose |
|-----------|---------|
| Auth API | Sign up, login, logout, verify email, forgot/reset password, session refresh |
| Users API | Profile data, user lookup (for mentions, sharing), account settings |
| Workspaces API | Create/manage workspaces, teams, workspace membership |
| Folders API | Create/rename/move/delete folders, list folder contents |
| Documents API | CRUD for documents, autosave endpoint, document metadata |
| Comments API | Create/reply/resolve/delete comments, list comments per document |
| Permissions API | Grant/revoke/change roles, set sharing mode, check access |
| Version History API | List versions, view a version, restore a version |
| File Uploads API | Upload/download/rename/delete/move files |
| Notifications API | List notifications, mark read, notification preferences (if any) |
| Search API | Global search with filters across documents/folders/users/content |
| Real-Time Gateway | Not a REST group, but the WebSocket namespace/events for presence and live sync, gated by the same auth/permission checks as the REST APIs |

Every group above sits behind the Auth API's session check and, where relevant, the Permissions API's access check. No endpoint-level code is specified, only responsibility.

---

## 10. Frontend Architecture

Major frontend areas, at the page/section level (Next.js + React + TypeScript + Tailwind, per recommended stack):

| Area | Responsibility |
|------|-----------------|
| Auth pages | Sign up, login, forgot password, verify email screens |
| Dashboard page | Recent documents, my documents, shared with me, favorites, recent activity, workspace list |
| Workspace shell | Sidebar/navigation showing folders, documents, teams within the current workspace |
| Document Editor page | The rich-text canvas, toolbar, autosave indicator, presence avatars/cursors |
| Comments panel | Threaded comment list attached to the open document, mention input |
| Version History panel | List of past versions, preview, restore action |
| Sharing modal | Sharing mode toggle, per-user/workspace permission assignment |
| Search overlay/page | Global search input, filters, result grouping by type |
| Notifications panel | List of notifications, read/unread state |
| File Manager view | Upload, browse, rename, move, delete files and folders |

Shared/reusable components implied by "reusable components" in the technical requirements: buttons, modals, avatars/presence indicators, rich-text toolbar elements, permission badges, toast/notification popups. These should live in a shared component library so no module rebuilds its own button or modal.

---

## 11. Backend Architecture

Grouping backend responsibility by module (Node.js/NestJS or Python/FastAPI, per recommended stack):

```
                     ┌────────────────────┐
                     │   API Gateway /     │
                     │   Auth Middleware   │
                     └─────────┬───────────┘
      ┌───────────────┬────────┼─────────┬───────────────┬──────────────┐
      ▼               ▼        ▼         ▼               ▼              ▼
 Auth Service   Workspace   Document   Permission   Comment/Notif   File Service
                Service     Service    Service      Service
      │               │        │         │               │              │
      └───────────────┴────────┴─────────┴───────────────┴──────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                        ▼
                  PostgreSQL (records)     Object Storage (files)
                        │
                        ▼
                Real-Time Gateway (Socket.IO) ── separate process/service,
                talks to Document + Permission services
                        │
                        ▼
                  Search Service (own index, fed by events)
```

Services communicate either through direct API calls (synchronous, e.g. Real-Time asking Permission "can this user edit") or through an internal event bus (asynchronous, e.g. Comment Service telling Notification Service "a mention happened"). Which transport is used for which call is a design decision the team should lock down early (see Section 21).

---

## 12. Storage Architecture

Two storage layers, matching the recommended stack:

**PostgreSQL** stores structured, relational data: Users, Workspaces, Workspace Members, Folders, Documents (metadata + content, if stored as structured blocks or JSON), Comments, Document Versions (metadata, and possibly content snapshots), Permissions, Notifications, File metadata, Activity Logs.

**Object storage (AWS S3 or Cloudflare R2)** stores binary/file data: uploaded attachments (PDF, DOCX, XLSX, PNG, JPG), and possibly embedded images pasted into documents. PostgreSQL keeps a pointer (URL/key) to the object storage location; it does not store the file bytes itself.

```
Client uploads file
      │
      ▼
File Service validates (type, size)
      │
      ├──► Object Storage (S3 / R2): stores actual file bytes
      │
      └──► PostgreSQL: stores File record (name, type, size, owner,
                        folder/document link, storage key/URL)
```

Whether document *content itself* (rich text) lives as structured rows, a JSON blob column, or a hybrid is not specified in the PDF and is marked "To Be Decided."

---

## 13. Search Architecture

The spec requires global search across Documents, Folders, Users, and Workspace content, with partial matching and filters (section 8).

**Conceptual flow:**

1. Whenever a Document, Folder, or User is created or updated, an event is emitted (via the shared event bus, Section 4).
2. A Search Indexing component listens for these events and updates a search index (a dedicated search store is recommended for partial-match performance; the exact technology, e.g. Postgres full-text search vs a separate engine, is "To Be Decided").
3. When a user searches, the query hits the Search API, which:
   - Applies the user's permission scope first (only returns results the user can actually access).
   - Matches partially across titles/content/names.
   - Applies any filters (type: document/folder/user, workspace, date, etc., as needed).
4. Results are grouped by entity type before returning to the frontend.

Permission filtering must happen inside the Search Service itself, not as a frontend-only filter, or private documents could leak into search results.

---

## 14. Notification Architecture

Trigger events, per spec section 9:

| Event | Recipient(s) | Source module |
|-------|--------------|-----------------|
| Someone mentions you | Mentioned user | Comments |
| Document shared with you | New grantee | Sharing & Permissions |
| Someone comments on your document | Document owner (and thread participants) | Comments |
| Someone replies to your comment | Original commenter | Comments |
| Permission changes | Affected user | Sharing & Permissions |
| Document updated | Watchers/collaborators (exact audience: To Be Decided) | Document Editor |

**Flow:** source module emits an event on the shared event bus → Notification Service creates a Notification record for each relevant recipient → Notification appears in the Notifications panel (and optionally pushed live via the same real-time channel used for collaboration, if the team wants live notification badges).

Email vs in-app-only delivery is not specified in the PDF and is marked "To Be Decided."

---

## 15. Version History Architecture

Per spec section 6:

- **Creation:** every "major" document change creates a Version record. What counts as "major" (every keystroke vs every autosave interval vs every explicit save) is not defined in the PDF and is marked "To Be Decided" — architecturally, the safest default is tying version creation to the autosave interval or to editing-session boundaries, not every keystroke, to avoid excessive storage.
- **Storage:** each Version references the Document, the authoring User, a timestamp, and a snapshot of content at that point (or a diff from the prior version — exact strategy "To Be Decided").
- **Viewing:** users can list versions (author + timestamp shown, per spec) and open a specific version read-only.
- **Comparing:** the spec does not explicitly require a diff/compare UI, only "view previous versions" and "see who/when changed" — a compare view is a reasonable enhancement but is not a stated requirement, so it is optional.
- **Restoring:** restoring a version should create a *new* current version (a copy of the old content becomes the new latest state) rather than deleting history, so no data is lost and the restore itself is auditable.

---

## 16. Permission Model

**Four permission levels (spec section 7), from most to least access:**

| Level | Can do |
|-------|--------|
| **Owner** | Full control: edit content, manage comments, manage permissions/sharing, delete document, restore versions |
| **Editor** | Edit content, add/reply/resolve comments, view version history (restore rights: To Be Decided) |
| **Commenter** | View content, add/reply comments, cannot edit document content |
| **Viewer** | Read-only access to content, cannot comment or edit |

**Three sharing modes (spec section 7):**

| Mode | Meaning |
|------|---------|
| **Private** | Only explicitly granted users (via Permissions records) can access, regardless of workspace membership |
| **Workspace-only** | Any member of the owning workspace can access, at a default role (which default role: To Be Decided) |
| **Anyone with link** | Anyone possessing the link can access, at a default role (which default role, and whether login is still required: To Be Decided) |

The Permission Check Service (Section 4) is the single place that combines sharing mode + explicit Permissions records + workspace membership into one access decision, used consistently by Document Editor, Real-Time Collaboration, Comments, Search, and Version History.

---

## 17. System Architecture Diagram

```
                                   ┌─────────────────────────┐
                                   │        Frontend          │
                                   │  Next.js / React / TS    │
                                   │  (Auth, Dashboard, Editor,│
                                   │   Comments, Sharing,      │
                                   │   Search, Notifications,  │
                                   │   File Manager UI)        │
                                   └────────────┬─────────────┘
                                                │  REST (HTTPS)         │ WebSocket
                                                ▼                        ▼
                          ┌─────────────────────────────┐   ┌─────────────────────────┐
                          │   Backend / API Layer         │   │  Real-Time Gateway       │
                          │  (NestJS or FastAPI)           │◄──►  (Socket.IO)             │
                          │  Auth · Users · Workspaces ·   │   │  Presence · Cursors ·    │
                          │  Folders · Documents ·         │   │  Live change sync         │
                          │  Comments · Permissions ·      │   └─────────────────────────┘
                          │  Versions · Files · Search ·   │
                          │  Notifications                 │
                          └───────┬──────────┬─────────────┘
                                  │          │
                     ┌────────────┘          └───────────────┐
                     ▼                                        ▼
           ┌───────────────────┐                    ┌───────────────────────┐
           │   PostgreSQL        │                    │   Object Storage        │
           │  Users, Workspaces,  │                    │  AWS S3 / Cloudflare R2 │
           │  Documents, Folders, │                    │  (uploaded files,       │
           │  Comments, Versions, │                    │   attachments)          │
           │  Permissions,        │                    └───────────────────────┘
           │  Notifications,      │
           │  File metadata,      │
           │  Activity Logs       │
           └───────────────────┘
                     │
                     ▼
           ┌───────────────────┐
           │   Search Index       │
           │  (fed by change      │
           │   events)             │
           └───────────────────┘
```

Authentication middleware sits in front of every request into the Backend/API Layer and the Real-Time Gateway (both check the same session/identity).

---

## 18. Module Interaction Flow

**User creates a document**
Frontend → Documents API (create) → checks Workspace/Folder validity → Permission Service auto-grants Owner to creator → Document record created → Activity Log entry → Search index updated.

**User edits a document**
Frontend Editor → Real-Time Gateway (if collaborators present) or directly to Documents API (autosave) → Permission Service checks Editor+ access → content persisted → Version History may snapshot → Search index updated → Activity Log entry.

**Multiple users edit simultaneously**
Each client connects to Real-Time Gateway room for that document ID → Permission Service checks each joiner → change events relayed between all connected clients → each change also flows to Documents API for persistence → presence/cursor updates broadcast continuously, not persisted.

**User adds a comment**
Frontend → Comments API → Permission Service checks Commenter+ access → Comment record created → if @mention present, Comments module emits mention event → Notification Service creates notification for mentioned user(s) → Activity Log entry.

**User mentions another user**
Comment/edit text parsed for @mentions → Users API resolves mention to a real user (must be workspace member, typically) → mention event emitted → Notification created for that user.

**User shares a document**
Frontend Sharing modal → Permissions API → updates sharing mode and/or grants a Permission record → Notification Service notifies the newly granted user(s) → Activity Log entry.

**User restores an old version**
Frontend Version History panel → Version History API (restore) → Permission Service checks Owner (or Editor, per Section 15's open item) access → prior snapshot copied forward as new current Version → Document content updated → Activity Log entry → Search index updated.

**User uploads a file**
Frontend File Manager or Editor attachment control → File Uploads API → validates type/size → stores bytes in Object Storage → stores File record (with Document/Folder link) in PostgreSQL → Activity Log entry → if attached inline to a document, Document content references the file.

---

## 19. Critical Technical Challenges

| Challenge | Why it's hard | Recommended high-level approach |
|-----------|----------------|-----------------------------------|
| **Real-time collaboration** | Multiple clients must see a consistent view of a constantly changing document with low latency | Central Real-Time Gateway (Socket.IO) as the single relay per document room; server is source of truth for ordering events |
| **Concurrent editing** | Two users editing the same region at once can conflict or overwrite each other | Send granular operations (not full-document overwrites); adopt a merge strategy (OT or CRDT, decision "To Be Decided") so edits combine rather than clobber |
| **Permissions** | Every module needs consistent, correct access checks, and getting it wrong risks data leaks | One shared Permission Check Service used everywhere, so the rule set exists in exactly one place |
| **Version history** | Storing a full snapshot per change is expensive; storing only diffs makes restore complex | Snapshot at meaningful boundaries (autosave intervals/session end) rather than every keystroke; keep restore as "copy forward," never destructive |
| **Autosave** | Saving too often wastes resources; saving too rarely risks data loss | Debounce/batch autosave on a short interval plus on explicit triggers (e.g. tab close, idle pause) |
| **Data consistency** | Real-time edits, autosave, and version history all touch the same document concurrently | Real-Time Gateway and Documents API must agree on one persistence path so nothing is written out of order or lost |
| **Search** | Partial match + filters + permission scoping must all stay fast as content grows | Dedicated, event-fed search index rather than querying PostgreSQL directly for every search; always scope by permission before returning results |
| **File management** | Large files, varied formats, and access control all intersect | Offload byte storage to Object Storage (S3/R2) entirely; PostgreSQL only ever stores metadata and pointers |
| **Notifications** | Many modules generate events; recipients and delivery timing vary by event type | Central event bus feeding one Notification Service, rather than each module writing notifications directly |

---

## 20. Development Dependency Order

**Phase 1 — Foundation (build first, everything else depends on it)**
1. Authentication (identity/session)
2. Workspace & Organization (workspaces, folders, membership)
3. Permission Check Service (shared, used by everything after this point)
4. Core database schema for all entities (Section 8)

**Phase 2 — Core content (can start once Phase 1's contracts are agreed, even before Phase 1 is fully built, using mocked auth/permission responses)**
5. Document Editor (content CRUD + autosave)
6. File Management (upload/storage pipeline)

**Phase 3 — Parallel tracks (once Document Editor's data model is stable)**
These can be built simultaneously by different developers:
- Real-Time Collaboration (needs Document Editor's data model + Permission Service)
- Comments (needs Document Editor + Permission Service)
- Version History (needs Document Editor)
- Sharing & Permissions UI/API (extends the Permission Service)

**Phase 4 — Dependent on Phase 3 outputs**
- Notifications (needs event contracts from Comments and Sharing to exist)
- Search (needs Document/Folder/User data stable enough to index)

**Phase 5 — Aggregation**
- Dashboard (needs Documents, Notifications, File Management, Activity Log all producing real data)

**Must-wait items:** Notifications and Search should not start in earnest until the event bus contract (what event, what payload) is agreed across Comments, Sharing, and Document Editor. Dashboard should not start until at least Documents and Notifications are functional, or its team will be building against a moving target.

---

## 21. Team Integration Strategy

- **Shared data models** — the entity list in Section 8 should be turned into one agreed schema document/ERD before any module writes migrations, so no two developers invent conflicting shapes for the same entity.
- **API contracts** — each API group in Section 9 should have its request/response shape agreed (e.g. via a shared OpenAPI/Swagger spec or a shared TypeScript types package) before frontend and backend developers split off to work independently.
- **Module boundaries** — enforce the ownership table in Section 3: a developer should not directly query another module's tables; they call that module's API/service.
- **Git workflow** — one branch per module/feature, merged via pull request into a shared integration branch, with the API contract files treated as reviewed, protected artifacts since multiple modules depend on them.
- **Environment variables** — a single `.env.example` maintained centrally (DB connection, object storage keys, session secret, WebSocket config) so no developer's local setup silently diverges.
- **Integration points** — the Permission Check Service and the event bus (Section 4) are the two pieces every module touches; whoever builds these should treat their interfaces as a stable contract and version any breaking change.
- **Testing responsibilities** — each module owner is responsible for unit tests on their own service; integration tests across modules (e.g. "sharing a document triggers a notification") should be owned jointly by whichever two module owners are involved, written after both sides' contracts are stable.

---

## 22. Risks and Missing Decisions

Everything below is not defined in the PDF. Marked "To Be Decided" (TBD) so the team makes an explicit choice rather than an accidental one.

| Item | Why it matters |
|------|------------------|
| **TBD** — Conflict resolution algorithm for concurrent edits (OT vs CRDT vs simpler last-write-wins per block) | Directly affects how reliable real-time collaboration feels; hard to change later without a rewrite |
| **TBD** — What triggers a new Version snapshot (every keystroke, autosave interval, explicit save, session end) | Affects storage cost and how useful history actually is |
| **TBD** — Document content storage format (structured relational blocks vs JSON blob vs hybrid) | Affects how easy real-time sync, search indexing, and version diffing are to build |
| **TBD** — Workspace-level roles beyond document permissions (e.g. is there a workspace "admin"?) | Spec only defines document-level roles explicitly; workspace administration needs are implied but unstated |
| **TBD** — Default access level granted by "Workspace-only" and "Anyone with link" modes | Needed to actually implement the Permission Check Service correctly |
| **TBD** — Whether unverified (pre-email-verification) users get any access at all | Security-relevant; affects Auth module's gating logic |
| **TBD** — Whether Editors can restore old versions, or only Owners | Affects the Permission Model's exact enforcement |
| **TBD** — Notification delivery channels (in-app only, or also email) | Affects scope of the Notification module significantly |
| **TBD** — Search engine choice (Postgres full-text vs dedicated engine like Elasticsearch/Meilisearch) | Affects infrastructure complexity and search quality at scale |
| **TBD** — File size/type limits beyond the five listed formats | Needed for File Management validation rules |
| **TBD** — Document diff/compare UI in Version History | Spec only requires viewing and restoring, not comparing; team should confirm whether compare is in scope |
| **TBD** — Audience for "document updated" notifications (all collaborators? only those who commented?) | Affects Notification volume and relevance |

None of these are assumed or answered in this blueprint. Each should be resolved by the team (or instructor, if this is a graded requirement) before the relevant module is built.

---

## 23. Final Recommended Architecture

The system is best understood as five layers working together:

1. **Frontend (Next.js/React/TS)** — presents Dashboard, Editor, Comments, Sharing, Search, Notifications, and File Manager as distinct, cleanly separated areas built on a shared component library.
2. **Backend API layer (NestJS/FastAPI)** — one service per functional module (Auth, Workspace, Document, Comments, Permissions, Versions, Files, Search, Notifications), all sitting behind shared Auth middleware and a shared Permission Check Service, so access rules exist in exactly one place.
3. **Real-Time layer (Socket.IO)** — a separate gateway handling presence, cursors, and live change propagation, coordinating with the Document service for persistence and the Permission service for access control.
4. **Data layer** — PostgreSQL for all structured/relational data (Section 8's entity list), Object Storage (S3/R2) for file bytes, and a dedicated Search Index kept in sync via events.
5. **Cross-cutting glue** — an internal event bus connects modules that need to react to each other's changes (Comments/Sharing → Notifications, Document/Folder/User changes → Search) without those modules being tightly coupled to each other's internals.

Every module in Section 2 maps cleanly onto this layered structure, every dependency in Section 4 flows in one direction (nothing circular), and every open question in Section 22 is called out rather than silently assumed. This gives the team a shared map to divide work (Section 20/21) and a single source of truth to build against before implementation starts.
