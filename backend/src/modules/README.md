# Backend modules

Each module is an end-to-end ownership boundary. Keep routes, controllers, services, validation, models, migrations, and module tests inside the matching folder.

- `auth` - Maira: authentication, sessions, RBAC, users
- `workspaces` - Khadija: workspaces, teams, folders, sharing, permissions
- `documents` - Muzammil: document content and auto-save
- `collaboration` - Namra: WebSocket/Socket.IO and presence
- `comments` - Ayyan: comments, mentions, notifications
- `history-search` - Aiman: versions, diffs, restore, search
- `files-dashboard` - Shanza: files, dashboard, activity logs

Register a module router in `../routes/index.js`. Shared authentication and role checks belong in `../middleware/auth.js`; do not duplicate them inside feature modules.
