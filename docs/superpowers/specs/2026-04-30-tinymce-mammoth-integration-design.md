# TinyMCE + mammoth.js Integration — Design

**Date:** 2026-04-30
**Status:** Approved
**Scope:** Replace the demonstration `WYSIWYGEditor` in `components/editor-customize.jsx` with TinyMCE 7 community (GPL self-hosted) and add automatic loading of a `.docx` template via mammoth.js.

---

## Goals

1. Real WYSIWYG editing in the Project editor (currently a markdown-style textarea).
2. On opening an empty project, auto-load `assets/docs/template.docx` into the editor.
3. Stay 100% static — must work on GitHub Pages with no backend.
4. No API key, no Tiny Cloud usage, no editor-load limits.

## Non-goals

- Custom skin matching Woden brand (default oxide skin acceptable).
- HTML → Markdown conversion.
- Server-side `.docx` import (TinyMCE premium `importword` plugin requires backend).
- Modifying `storyguide.jsx` rendering — `project.content` is not currently rendered downstream.

## Approach

**Distribution:** TinyMCE and mammoth.js loaded from jsDelivr CDN, consistent with existing React/Tailwind/Babel CDN pattern. Two new `<script>` tags in `index.html`. License key set to `'gpl'`.

**Component contract:** `WYSIWYGEditor` keeps the same props (`{ sectionN, title, content, onChange }`) so `ProjectEditor` and the rest of the file are untouched.

**Data format:** `project.content` becomes an HTML string. Existing seed data has empty `project.content` for all projects, so no migration needed. `StoryGuide` does not consume `project.content`, so no rendering changes needed.

**Template auto-load:** On editor `init` event, if the incoming `content` prop is empty/whitespace, fetch `./assets/docs/template.docx`, convert with `mammoth.convertToHtml({ arrayBuffer })`, call `editor.setContent(html)`, then propagate via `onChange`. Errors (404, parse failure) show a toast and leave the editor empty — never break the demo.

## Architecture

```
[index.html]
  ├── <script src=".../tinymce@7/tinymce.min.js"></script>   ← new
  ├── <script src=".../mammoth@1.8.0/mammoth.browser.min.js"></script>  ← new
  └── existing component scripts (load order preserved)

[components/editor-customize.jsx]
  WYSIWYGEditor (rewritten)
    on mount:
      - wait for window.tinymce to be available
      - tinymce.init({ selector, license_key:'gpl', plugins, toolbar })
      - on editor.init:
          if !content.trim():
            fetch template.docx → mammoth → editor.setContent(html) → onChange(html)
          else:
            editor.setContent(content)
      - on editor input/change: onChange(editor.getContent())
    on unmount:
      - editor.destroy()

[assets/docs/template.docx]
  Placeholder docx with H1, H2, paragraphs, list, blockquote.
  Acts as smoke-test for mammoth conversion. Replaceable later.
```

## TinyMCE config

```js
{
  selector: '#tmce-editor',
  license_key: 'gpl',
  menubar: false,
  branding: false,
  promotion: false,
  statusbar: true,
  plugins: 'lists link autoresize wordcount',
  toolbar: 'undo redo | bold italic | h2 h3 | bullist | blockquote | wordcount',
  content_style: "body { font-family: 'GT Pressura', system-ui, sans-serif; font-size: 14px; color: #131215; }",
  min_height: 360,
}
```

## Edge cases

| Case | Behavior |
|---|---|
| `tinymce` script not yet loaded when component mounts | Poll `window.tinymce` every 50ms, max 5s |
| `assets/docs/template.docx` missing (404) | `toast('Could not load Word template')`, editor stays empty |
| mammoth parse error | Log to console, toast, editor stays empty |
| Component unmount during async init | `cancelled` flag prevents state update; `editor.destroy()` on cleanup |
| `project.content` already has HTML (non-empty) | Skip template load, render existing content |
| AI autofill function reads `content` (HTML now) | Existing regex-based heuristic still works on HTML strings; UI is commented out anyway |

## Files changed

1. **`index.html`** — add 2 `<script>` tags before component scripts.
2. **`components/editor-customize.jsx`** — replace `WYSIWYGEditor` function; rest of file unchanged.
3. **`assets/docs/template.docx`** — new placeholder file.
4. **`docs/superpowers/specs/2026-04-30-tinymce-mammoth-integration-design.md`** — this doc.

## Verification

- Open `index.html` (via `python3 -m http.server`), navigate to a project editor.
- Editor renders with TinyMCE oxide UI.
- On first open of an empty project: template content from `.docx` appears.
- Typing → `onChange` fires → "Save draft" persists HTML to `project.content`.
- Reopen same project → existing HTML loads, template not re-loaded.
- Switch to Step 2 / 3 / Preview without console errors; `editor.destroy()` cleans up.
