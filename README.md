# Site Nest

Site Nest is a local-first Windows desktop workspace for collecting and using websites in one focused window. It combines personal websites, work systems, research resources, Chrome bookmark imports, schedules, controlled page actions, browser identities, and the Xiaoxu companion assistant.

## Highlights

- Three workspaces: Personal, Work, and Research, each with its own sites, tabs, groups, ordering, and recent activity.
- Embedded websites powered by Electron `WebContentsView`, with navigation history, refresh, zoom, login windows, safe popup handling, and external browser fallback.
- Site library with custom groups, compact card/list layouts, search, pinning, workspace filters, and persistent tab organization.
- Local schedules with date ranges, all-day events, recurrence, reminders, priorities, colors, tags, notes, a 24-hour conflict timeline, and completion tracking.
- Timeline views for work and personal records, including yearly month scale, monthly day scale, detail cards, filtering, and zooming.
- Chrome bookmark import from local `Bookmarks` and `AccountBookmarks` files. Imports are read-only and do not modify Chrome or Google bookmarks.
- Optional Google Drive synchronization for an allowlisted subset of Site Nest data. Browser sessions, cookies, tokens, API keys, credentials, page contents, and form data remain local.
- Controlled userscripts with review screens, domain matching, permissions, isolated execution, approval records, and redacted execution logs.
- Local Chrome extension loading for unpacked Manifest V2/V3 extensions, with per-identity enable/disable, toolbar actions, popup support, and permission review.
- Built-in automation center with check-ins, site assistants, schedules, execution history, and real status reporting.
- Xiaoxu companion assistant floating inside the current webpage. It supports optional weather, focus and wellness reminders, local conversation memory, DeepSeek-compatible questions, page summaries, and selection explanations.
- Zoho Desk read-only connector with OAuth, ticket lists, public thread context, caching, refresh, and triage metrics.
- Persistent browser identities for ordinary websites, NodeSeek, and SAP Support, with explicit session boundaries.

## Privacy and security boundaries

Site Nest stores application state in the local Electron `userData` directory. Sensitive credentials are kept through Electron `safeStorage` where supported. Google synchronization uses an explicit allowlist and removes authentication parameters from URLs before upload.

Site Nest does not read Chrome passwords, browser history, cookies, or open tabs during bookmark import. It does not upload page contents, form input, cookies, browser sessions, OAuth credentials, or execution logs to Google Drive.

Page AI features use visible page text only after the relevant safety checks. Login, authorization, payment, and password pages are blocked from page summarization. AI results are presented as assistance and are not claimed to be live web search.

Loaded extensions run inside Electron's extension compatibility layer. "Loaded" means the extension was accepted by the runtime; it does not guarantee complete compatibility with every Chrome API. Bitwarden account unlocking and autofill should be validated in the target environment.

## Current limitations

- Google does not provide a general Chrome Sync bookmark read/write API for ordinary desktop applications. Site Nest currently imports Chrome bookmarks read-only.
- NodeSeek, SAP, Zoho, and other websites may still require their own login, verification, CAPTCHA, permissions, or account access.
- Check-ins run while Site Nest is running; a fully closed application does not wake Windows to run them.
- Electron extension compatibility varies by extension. Chrome Web Store online installation is not included.
- The Zoho connector is read-only and requires the user's own OAuth client and organization configuration.

## Development

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build:code
```

The project uses Electron 44, Node.js, and plain HTML/CSS/JavaScript. `build:code` performs syntax validation only. Packaging commands create Windows artifacts:

```powershell
npm run package:portable
npm run package:win
```

## Repository contents

- `electron/` — main-process services, browser integration, storage, sync, automation, and security boundaries.
- `renderer/` — application UI and interaction logic.
- `test/` — unit and Electron integration tests.
- `docs/` — architecture, integration, release, and feature documentation.
- `assets/` — application assets.

The latest application version in this repository is **0.5.17**.

## License and dependency note

Review the licenses of all dependencies before distributing a closed-source build. The extension compatibility layer currently uses `electron-chrome-extensions`, whose distribution terms should be evaluated for the intended release model.
