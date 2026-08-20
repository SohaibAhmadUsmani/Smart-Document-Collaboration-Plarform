# Smart Document Collaboration Platform

Shared monorepo for the Smart Document Collaboration Platform. Work on `dev` through your own feature branch; do not commit directly to `main` or `dev`.

## Repository layout

```text
backend/
	src/
		config/              Shared environment and database configuration
		middleware/          Shared middleware, including authentication/RBAC
		modules/             One end-to-end backend module per owner
		routes/              Central route registration only
		app.js               Express app assembly (no listen call)
		server.js            Local process entry point
frontend/
	src/
		app/                 Application shell and routing
		components/          Shared UI components only
		modules/              One end-to-end frontend module per owner
```

## Ownership map

| Owner | Module | Backend folder | Frontend folder |
| --- | --- | --- | --- |
| Maira | Authentication and access control | `backend/src/modules/auth` | `frontend/src/modules/auth` |
| Khadija | Workspaces, folders, permissions | `backend/src/modules/workspaces` | `frontend/src/modules/workspaces` |
| Muzammil | Document editor | `backend/src/modules/documents` | `frontend/src/modules/editor` |
| Namra | Real-time collaboration | `backend/src/modules/collaboration` | `frontend/src/modules/collaboration` |
| Ayyan | Comments and notifications | `backend/src/modules/comments` | `frontend/src/modules/comments` |
| Aiman | Version history and search | `backend/src/modules/history-search` | `frontend/src/modules/history-search` |
| Shanza | File management, dashboard, activity logs | `backend/src/modules/files-dashboard` | `frontend/src/modules/files-dashboard` |

Each owner should keep their module's routes, controllers/services, database models, validation, tests, and UI together. Shared code belongs in `backend/src/middleware`, `backend/src/config`, or `frontend/src/components` only when it is genuinely cross-module.

## Local setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev:backend
```

The backend health check is available at `http://localhost:5000/health`.

## Branch and PR workflow

Use a branch named `feature/<short-module-name>` from `dev`, for example `feature/auth` or `feature/editor`. Keep commits scoped to your module, sync with `dev` regularly, and open a PR into `dev` when the module slice is ready. PRs should include the affected API/UI/database pieces, migration or environment changes, test commands, and any contract changes other modules need.

Do not commit secrets, `.env` files, generated uploads, or database dumps. Update `.env.example` when adding configuration.