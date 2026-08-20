# Frontend module guide

The frontend scaffold is intentionally framework-neutral until the team selects the app framework. Add the chosen framework entry files under `src/app`, keep shared UI in `src/components`, and place each owner's screens, API client, state, and tests in their matching `src/modules/<module>` folder.

Do not put feature-specific components in `src/components`. Cross-module API contracts should be documented in the owning backend module and consumed through a small client in the matching frontend module.
