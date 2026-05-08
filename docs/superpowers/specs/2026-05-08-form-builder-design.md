# Form Builder — Editor Schema Rewrite

**Date:** 2026-05-08
**Scope:** Project editor only (`components/editor-customize.jsx` + new module). StoryGuide preview rendering and persistence are out of scope for v1.
**Status:** Approved by user, ready for implementation planning.

---

## 1. Overview

Replace the current hardcoded 14-step wizard schema (`SECTION_TITLES` global + `SECTION_FIELDS` static map keyed by step number) with a per-project, fully editable section/field model. Templates ship with default section schemas that seed new projects. Users can:

- Insert new sections anywhere in the wizard via a `+` slot between pills.
- Add/edit/remove/reorder fields inside any section through a unified form-builder UI.
- Attach optional AI-hint metadata to each section.
- Optionally save section/field changes as the new default for the project's template.

The visual layout of the editor (wizard pills, section cards, brand step, team step, header bar) is **unchanged**. New affordances (`+` between pills, per-field toolbar, "Add field" button, metadata chip, Export modal) layer onto existing card/button atoms without introducing new design tokens.

On final step, **"Generate Story Guide"** serializes the project to a self-contained JSON envelope (sections + values + brand + team) and offers Copy/Download.

---

## 2. Goals / Non-goals

### Goals

- Per-project section/field schema, fully editable.
- Backend-friendly serializable JSON shape (stable IDs, no array-index keys, version field on envelope).
- Field-type registry approach so adding new types later = one entry in a table.
- Visual parity with current editor.
- Clean break: no migration code for legacy `project.sectionData` (project state is not persisted across reloads anyway).

### Non-goals (v1)

- Rendering custom sections/fields in the StoryGuide preview (`components/storyguide.jsx` remains hardcoded against `MERIDIAN`).
- Persisting projects to `localStorage` or any backend.
- Drag-and-drop field reorder (use ↑/↓ buttons).
- Injecting `section.metadata` into the AI chat panel at runtime.
- Real auth/permissions on "Save as default for template" (any role can do it in the prototype).

---

## 3. Data model

Source of truth: `project.sections[]` (schema) + `project.sectionValues` (data). Both live on the in-memory `window.WODEN.PROJECTS[i]` object.

### Section

```js
{
  id: 'sec_a8f2',                  // stable, generated on creation
  templateKey: 'mission-vision',   // present iff origin === 'template'; nullable otherwise
  title: 'Mission & Vision',
  origin: 'template' | 'custom',
  metadata: '',                    // free-text AI hint, default ''
  fields: [Field, ...]
}
```

### Field

```js
{
  id: 'fld_3c91',
  templateFieldKey: 'mission',     // present iff origin === 'template'
  type: 'text' | 'number' | 'image' | 'table' | 'list' | 'divider' | 'quote',
  label: 'Mission',                // required except for type='divider'
  required: false,                 // reserved for future, default false
  config: { ...typeSpecific },     // see §4 Field type registry
  origin: 'template' | 'custom'
}
```

### Values

```js
project.sectionValues = {
  [sectionId]: {
    [fieldId]: <jsonSerializableValue>
  }
}
```

Schema and values are stored as **separate objects** during editing (cleaner edits, easier diff against template). They are merged at export time so each output field carries an inline `value`.

### ID generation

```js
function newId(prefix) {
  if (crypto.randomUUID) return prefix + '_' + crypto.randomUUID().slice(0, 8);
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
```

### Project-level fields untouched by this work

`project.id`, `project.name`, `project.description`, `project.status`, `project.templateId`, `project.palette`, `project.fonts`, `project.logo`, `project.team` — all retained as-is and serialized in the export envelope. The legacy `project.content` and `project.sectionData` are removed entirely.

### Constraints

- `origin: 'template'` sections **cannot be deleted** by the user. Their fields can be edited, removed, or reordered.
- `origin: 'custom'` sections can be deleted (with confirmation).
- Field type cannot be changed after creation (delete + recreate instead).
- Brand step (palette/fonts/logo) and Team step are not represented in `project.sections` — they remain dedicated steps with dedicated state.

---

## 4. Field type registry

Defined as a single table in `components/form-builder.jsx`. Adding a new type = one row + one render branch in `FieldRenderer`.

```js
const FIELD_TYPES = {
  text:    { label: 'Text',    icon: '¶', requiresLabel: true,  defaultConfig: { placeholder: '' },                    defaultValue: '' },
  number:  { label: 'Number',  icon: '#', requiresLabel: true,  defaultConfig: { placeholder: '' },                    defaultValue: '' },
  image:   { label: 'Image',   icon: '◇', requiresLabel: true,  defaultConfig: {},                                     defaultValue: null },
  table:   { label: 'Table',   icon: '▦', requiresLabel: true,  defaultConfig: { description: '', rows: 3, columns: [{ id, label: 'Column 1' }] }, defaultValue: [['']] },
  list:    { label: 'List',    icon: '•', requiresLabel: true,  defaultConfig: { style: 'bullet' },                    defaultValue: [''] },
  divider: { label: 'Divider', icon: '—', requiresLabel: false, defaultConfig: {},                                     defaultValue: null },
  quote:   { label: 'Quote',   icon: '"', requiresLabel: false, defaultConfig: {},                                     defaultValue: { author: '', text: '' } },
};
```

### Per-type contracts

| Type    | `config`                                                              | `value`                                | Section-form rendering                                                |
|---------|------------------------------------------------------------------------|----------------------------------------|-----------------------------------------------------------------------|
| text    | `{ placeholder?: string }`                                             | `string`                               | textarea, 4 rows                                                      |
| number  | `{ placeholder?: string }`                                             | `string` (raw input string)            | `<input type="number">`                                               |
| image   | `{}`                                                                   | `string \| null` (DataURL)             | upload + preview, mirrors logo handling at editor-customize.jsx:482   |
| table   | `{ description?: string, rows: number, columns: { id, label }[] }`     | `string[][]` (rows × columns)          | editable cells; rows/cols fixed by config                             |
| list    | `{ style: 'bullet' \| 'numbered' }`                                    | `string[]`                             | array of input rows with "+ item" / "×"                               |
| divider | `{}`                                                                   | `null`                                 | `<hr>` styled with `border-light-gray`                                |
| quote   | `{}`                                                                   | `{ author: string, text: string }`     | two inputs: Author, Quote text                                        |

### `FieldConfigModal` (single modal for all types)

Layout:
1. **Type grid** at top: 7 chips from `FIELD_TYPES`. Visible only in `mode='create'`. Hidden in `mode='edit'` (type immutable post-creation).
2. **Config form** below, dynamic by selected type:
   - text/number: `Label*`, `Placeholder`
   - image: `Label*`
   - table: `Label*`, `Description`, `Rows count`, `Column names` (dynamic add/remove list)
   - list: `Label*`, `Style` radio (bullet/numbered)
   - divider: empty body, just shows preview line
   - quote: optional `Label`
3. **`Save as default for this template`** checkbox — visible only when project has a template attached.
4. Footer: `[ Cancel ] [ Add field / Save changes ]`.

Width: default 480px (Modal atom). Override to `w-[640px]` for table-type via passthrough className on the modal content wrapper (one-off, no global atom change).

### Edge cases

- **Table rows/columns shrink:** `confirm()` with row/col count diff; orphan cells dropped.
- **Table rows/columns grow:** new cells initialized to `''`.
- **Field deletion:** `confirm()` listing field label; value purged from `sectionValues`.
- **Section deletion (custom only):** `confirm()` listing field count; entire `sectionValues[sectionId]` purged.

---

## 5. Module layout

### New file: `components/form-builder.jsx`

Exports via `Object.assign(window, {...})`:

- `FIELD_TYPES` — registry table
- `newId(prefix)` — UUID helper with fallback
- `createDefaultField(type)` — builds a fresh `Field` with defaults
- `<FieldRenderer>` — renders a single field in the section form (props: `field, value, onValueChange, onEditField, onDeleteField, onMoveUp, onMoveDown`)
- `<SectionForm>` — replaces existing `SectionForm` in `editor-customize.jsx`. Props: `section, values, onValuesChange, onSectionChange, template, onSaveAsTemplateDefault`. Renders header (title + metadata chip + delete-section button if `origin='custom'`), maps fields to `<FieldRenderer>`, renders "+ Add field" dashed button.
- `<FieldConfigModal>` — props: `mode: 'create' | 'edit', initialField?, sectionTemplateKey, template, onSave, onClose`
- `<SectionMetaModal>` — props: `section, onSave, onClose`
- `<AddSectionModal>` — props: `afterIndex, template, onCreate, onClose`
- `<ExportModal>` — props: `payload, onClose` (renders JSON preview, Copy + Download buttons)

### Changes to `data.js`

- Each entry in `TEMPLATES` (currently 4: `t-it`, `t-management`, `t-manufacturing`, `t-consumer`) gains a required `defaultSections: SectionSchema[]` array. Today all four use the same flat `SECTION_TITLES` list, so for v1 **all four templates share an identical `defaultSections`** (the 14-section set with curated fields for sections 1–6 mirroring the current `SECTION_FIELDS`, generic `Content`/`Notes` for sections 7–14). Per-template differentiation is deferred. Define the shared default once (`const DEFAULT_SECTIONS = [...]`) and reference from each template. `SECTION_TITLES` itself is deleted.
- New helpers exported on `window.WODEN`:
  - `ensureProjectSections(project, template)` — idempotent initializer.
  - `applySectionDefaultToTemplate(template, section)` — appends/upserts section into `template.defaultSections`.
  - `applyFieldDefaultToTemplate(template, sectionTemplateKey, field)` — replaces the matching template field, or appends if no match.
  - `replaceTemplateSectionDefault(template, section)` — full replacement of a section's default by `templateKey` (used when "Save as default" is toggled on edit of a template-origin section).
  - `buildExport(project, template)` — assembles the export envelope (see §6).

### Changes to `components/editor-customize.jsx`

- Delete `SECTION_FIELDS`, `GENERIC_FIELDS`, `getSectionFields`, local `SectionForm`. (`WYSIWYGEditor` and the `loadTemplateDocxAsHtml` block are unrelated and left untouched.)
- In `ProjectEditor`:
  - On mount: `ensureProjectSections(project, tpl)`.
  - Replace `[sectionData, setSectionData]` and `setSectionField` with `[sections, setSections]` and `[sectionValues, setSectionValues]`.
  - `WizardStrip` reads `sections` for pill list. Insert an inline `AddSectionSlot` helper (defined locally inside `editor-customize.jsx`, not part of the form-builder module — it's purely a styled `+` button) between every pair of pills, before the first, and before Brand. Each slot opens `<AddSectionModal>` from the form-builder module.
  - `BRAND_STEP = sections.length + 1`, `TEAM_STEP = sections.length + 2`.
  - Section-step renders `<SectionForm>` with new module's component.
  - "Generate Story Guide" button at last step calls `buildExport(...)` and opens `<ExportModal>`.

### Changes to `index.html`

Add one script tag in the correct order:

```html
<script type="text/babel" src="components/shell.jsx"></script>
<script type="text/babel" src="components/form-builder.jsx"></script>   <!-- NEW -->
<script type="text/babel" src="components/auth-dashboards.jsx"></script>
<script type="text/babel" src="components/editor-customize.jsx"></script>
<script type="text/babel" src="components/storyguide.jsx"></script>
<script type="text/babel" src="components/app.jsx"></script>
```

(Insert after `shell.jsx` and before any consumer.)

---

## 6. UI flows

### A. Insert section between pills

Wizard pill strip gets a 24×24 dashed-border `+` button between every pair of section pills, before the first, and before Brand. No `+` between Brand and Team or after Team.

Click → `<AddSectionModal afterIndex={i}>`:

```
┌─ New section ──────────────────────────────────────┐
│  Section name*                                      │
│  [____________________]                             │
│  e.g. "Competitive Landscape"                       │
│                                                     │
│  ☐ Save as default for this template                │
│                                                     │
│             [ Cancel ]   [ Add section ]            │
└─────────────────────────────────────────────────────┘
```

On submit:
- `newSection = { id: newId('sec'), title, origin: 'custom', metadata: '', fields: [] }`
- Inserted at `sections.splice(afterIndex + 1, 0, newSection)`.
- `flowStep` advances to the new section.
- If checkbox on: `applySectionDefaultToTemplate(template, newSection)` (template gets a copy with no `id` and a derived `templateKey`).

### B. Section metadata

In each section card header, a small chip next to the title:
- Empty: `[+ Add metadata]` (mono uppercase, dashed)
- Filled: `[Metadata: "first 30 chars…" ✎]`

Click → `<SectionMetaModal>` with one textarea. Save writes `section.metadata`.

### C. Add field

Dashed full-width button at the bottom of the section card (style mirrors editor-customize.jsx:862 "Add colour"):

```
[ + Add field ]
```

Click → `<FieldConfigModal mode='create'>`.

On Save:
- New field appended to `section.fields`.
- `value = FIELD_TYPES[type].defaultValue` written to `sectionValues[sectionId][fieldId]`.
- If "Save as default" on: `applyFieldDefaultToTemplate(template, section.templateKey, field)`.

### D. Edit / delete / reorder field

Each field is wrapped in a hover card with a right-aligned toolbar:

```
┌─ [ field rendered ] ──── [↑] [↓] [✎] [🗑] ─┐
└─────────────────────────────────────────────┘
```

- `[↑] [↓]` swap with neighbour; disabled at edges.
- `[✎]` opens `<FieldConfigModal mode='edit' initialField={field}>`. On save, field updated in place (id retained, value retained unless config shrinks table dimensions).
- `[🗑]` confirms and removes field + its value entry.

Toolbar visible on hover (desktop) and always visible on mobile/touch (`md:opacity-0 md:group-hover:opacity-100`).

### E. Delete section

Section header (only when `origin='custom'`): `[🗑 Delete section]` button. `confirm()` → splices from `sections` and removes `sectionValues[sectionId]`.

Template-origin sections have **no delete affordance** (mandatory by design).

### F. "Save as default for this template" semantics

Single shared checkbox in `AddSectionModal`, `FieldConfigModal`, and (optionally) `SectionMetaModal`. Visible only if `template != null`.

- **New section save-as-default:** copy section sans `id`, with `templateKey: slugify(title)`, append to `template.defaultSections`.
- **New field save-as-default:** append to `template.defaultSections[?].fields` where `?` matches by `templateKey`. If section is `origin='custom'` and not yet saved as template default, the checkbox is disabled with tooltip "Save the section as template default first."
- **Editing existing template-origin section/field with checkbox on:** full replacement of the matching default by `templateKey` / `templateFieldKey` (`replaceTemplateSectionDefault`).
- Toast: `Saved as default — affects new projects` after success.

### G. Generate / Export

Final step (Team) button `Generate Story Guide ✓`:

1. Calls `persist()` (in-memory mutation as today).
2. Calls `payload = buildExport(project, template)`.
3. Opens `<ExportModal payload={...}>`.
4. Sets `project.status = 'review'`.

`<ExportModal>`:

```
┌─ Story Guide ready ─────────────────────────────────┐
│  Your StoryGuide is ready as JSON.                  │
│                                                     │
│  ┌─ JSON preview (collapsible, scrollable) ─┐       │
│  │ {"schemaVersion":1, …}                    │       │
│  └────────────────────────────────────────────┘       │
│                                                     │
│  [ Copy JSON ]  [ Download .json ]  [ Close ]       │
└─────────────────────────────────────────────────────┘
```

- `Copy JSON` → `navigator.clipboard.writeText(JSON.stringify(payload, null, 2))` + toast.
- `Download .json` → `Blob` → object URL → click hidden `<a download="storyguide-{slug}.json">`.

### H. Visual fidelity guarantees

- `WizardStrip`: same pills, same colour states, same overflow scroll, same gap. Add `<AddSectionSlot>` interleaved.
- Section card: same `Card pad="p-5 sm:p-7"`, same heading, same Tip block. Inside, `<FieldRenderer type='text'>` outputs the same textarea with the same Tailwind classes as today (cf. editor-customize.jsx:472).
- Brand step: untouched.
- Team step: untouched.
- Header (title, badges, Preview/Save draft/Back/Next): untouched.

---

## 7. Output JSON envelope

```js
{
  schemaVersion: 1,
  exportedAt: '2026-05-08T12:34:56.789Z',
  project: {
    id, name, description, status, templateId, templateName,
  },
  sections: [
    {
      id, templateKey, title, origin, metadata,
      fields: [
        {
          id, templateFieldKey, type, label, required,
          config,
          origin,
          value,                      // inlined from sectionValues
        }
      ]
    }
  ],
  brand: {
    palette: project.palette,         // [{hex, role}]
    fonts: project.fonts,             // {heading, body}
    logo: project.logo,               // dataURL or null
  },
  team: project.team,                 // [emails]
}
```

### Why values inline (not split)

Backend integration prefers a single contiguous tree — easier to render reports, easier to ship to LLM as context. Internally during edit we keep schema (`project.sections`) and data (`project.sectionValues`) separate for cleaner edits and template-default diff. Merge happens only at export.

---

## 8. Resolved decisions

1. **Custom sections per-project + opt-in template default** — chosen over per-project-only and per-template-only.
2. **All template-shipped fields are fully editable/removable** (not locked).
3. **Template-origin sections are mandatory**, cannot be deleted by the user. Custom sections deletable.
4. **Save-as-default replaces the template default entirely** (no merge).
5. **Section metadata flows only into export JSON** in v1; no chat injection.
6. **Brand + team go inside the export JSON envelope.**
7. **Visual fidelity preserved** — no design tokens added.
8. **Reorder via ↑/↓ buttons**, no drag-and-drop in v1.

---

## 9. Risks

| Risk | Mitigation |
|---|---|
| Project state lost on page refresh (existing prototype behaviour). | Accept for v1. Export modal gives the user explicit "save to file" affordance. `localStorage` sync is a separate task if desired. |
| `FieldConfigModal` width tight for table column-name lists. | One-off `w-[640px]` className override on the modal content wrapper for `type='table'`. |
| `crypto.randomUUID()` missing on legacy Safari. | Fallback to `Date.now() + Math.random()` slug. |
| "Save as default" mutates global `TEMPLATES`, visible to all in-memory projects. | Intentional. Show toast "Saved as default — affects new projects" so the user knows. |
| Large image DataURLs bloat export JSON. | Acceptable in prototype. Backend integration will replace with upload + URL. |

---

## 10. Out of scope

- Persisting `project.sections` / `project.sectionValues` to `localStorage` or a backend.
- Rendering custom sections/fields in `components/storyguide.jsx`.
- Drag-and-drop field reorder.
- Real-time AI chat injection of `section.metadata`.
- Permission/role checks on the "Save as default" affordance (any role can do it in the prototype).
- Validation of `field.required` (reserved field, not yet enforced).
