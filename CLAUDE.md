# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

There is no build step and no package manager. Open `index.html` directly in a browser, or serve the directory with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

The app uses React 18 + Babel Standalone loaded from CDN. JSX is transpiled in-browser at runtime — no compilation required.

## Architecture

### No Module System

This is a plain HTML/JSX prototype. There is no bundler, no `package.json`, and no `import`/`export`. All files are loaded as `<script>` tags in `index.html` in a specific order that matters:

```
data.js               → window.WODEN (global data store)
components/shell.jsx  → shared atoms (Card, Note, Rect, Lines, toast, useRoute, useRole, SideNav, ...)
components/auth-dashboards.jsx → Login + 4 role dashboards
components/editor-customize.jsx → ProjectEditor, Customize, Team
components/storyguide.jsx → StoryGuide renderer + ChatPanel
components/app.jsx    → App root, routing, Tweaks panel — mounts React
```

Each component file ends with `Object.assign(window, { ... })` to expose its symbols globally. Components in later files can use symbols from earlier files because of script load order.

### Routing

Hash-based: `window.location.hash` drives navigation. `useRoute()` in `shell.jsx` listens to `hashchange`. The `App` component in `app.jsx` does string-matching on the route to render screens — there is no router library.

### State / Persistence

All state is in React `useState`. Persistence is via `localStorage`:
- `wdn-role` — current demo role (`admin` | `manager` | `client` | `employee`)
- `wdn-tweaks` — Tweaks panel settings (navPattern, rhythm, chatMode, showAnnotations)
- `wdn-sg-theme` — StoryGuide theme (`light` | `night`)
- `wdn-chat` — chat message history

### Data

`data.js` populates `window.WODEN` with mock seed data: `MOCK_USERS`, `CLIENT_COMPANIES`, `MANAGERS`, `SECTION_TITLES`, `MERIDIAN` (full brand data for the demo client), `CHAT_SUGGESTIONS`, and `mockChatReply()`.

All components read from `window.WODEN` directly — there is no state management library.

### Roles

Four roles control which nav items and screens are shown:
- `admin` — Woden super-admin: full platform overview, managers, clients, stats
- `manager` — Woden strategist: their own projects and clients
- `client` — Client admin (Meridian Coffee Co.): StoryGuide, Customize, Team, Settings
- `employee` — Client employee: read-only StoryGuide + AI chat

The `RoleSwitcher` overlay lets you swap roles at any time without logging out, for demo purposes.

### StoryGuide Renderer

`StoryGuide` in `storyguide.jsx` supports four `navPattern` variants (`toc`, `scrollspy`, `paginated`, `book`, `drawer`) and four `rhythm` layout variants (`editorial`, `centered`, `split`, `fullbleed`). These are toggled via the Tweaks panel and stored in `localStorage['wdn-tweaks']`.

The chat panel (`ChatPanel`) is a simulated AI assistant — responses come from `mockChatReply()` in `data.js`, not a real API.

### Edit Mode Protocol

`app.jsx` listens for `postMessage` events (`__activate_edit_mode` / `__deactivate_edit_mode`) to show/hide the Tweaks panel. This is designed for iframe embedding in an external tool. When tweaks change, `__edit_mode_set_keys` is posted back to the parent. The `DEFAULT_TWEAKS` block is delimited by `/*EDITMODE-BEGIN*/` and `/*EDITMODE-END*/` comments for external tooling to patch.

### Styling

`styles.css` defines all design tokens as CSS custom properties under `:root` (`--wdn-primary`, `--ink`, `--paper`, `--accent`, etc.). Use these variables for any new styles — no hardcoded color values.

GT Pressura is the brand font, loaded via `@font-face` from `assets/fonts/gt-pressura/`.

## Key Conventions

- **No tests** — there is no test runner configured.
- **No linter** — no ESLint config present.
- **Script order is load order** — adding a new component file requires a new `<script type="text/babel">` tag in `index.html` in the correct position.
- **Global namespace** — new symbols must be added to `window` via `Object.assign(window, {...})` at the bottom of each file to be accessible in later scripts.
- **No real backend** — all data is mock. Network calls, auth, and AI responses are all simulated.

## MCP Server Workflow

**Priority order:** Memory Bank → Sequential Thinking → Context7 → Serena/Filesystem → Memory Bank (save)

**Server Triggers & Usage:**

- **Memory Bank** (`server-memory`):
    - **Use:** Start of session (fetch known tech stack/patterns) & End of session (save new architectural decisions, tech additions, or solved issues).
    - **Skip:** Temporary session data.

- **Sequential Thinking** (`sequential-thinking`):
    - **Use:** Complex tasks (>3 steps), migrations, large refactors, or deep debugging.
    - **Skip:** Simple typos, single-file edits.

- **Context7** (`mcp-server`):
    - **Use:** Fetching latest API docs/migration guides for external libraries (Expo, React Navigation, Zod, Firebase, etc.).
    - **Skip:** Standard JS/TS features.

- **Serena** (`serena`):
    - **Use:** **ALL CODE OPERATIONS.** Use LSP tools (`find_symbol`, `replace_symbol_body`, `find_referencing_symbols`) instead of reading whole files or grep.
    - **Skip:** Non-code files (logs, configs).

- **Filesystem** (`server-filesystem`):
    - **Use:** Non-code files (`.env`, `package.json`, `.md`, logs). Batch operations on configs.
    - **Skip:** Code parsing or symbol searching.

- **Puppeteer** (`server-puppeteer`):
    - **Use:** ONLY for UI/Visual layout testing.
    - **Skip:** API testing or general checks (resource-heavy).
