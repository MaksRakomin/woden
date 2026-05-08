# Form Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the editor's hardcoded 14-step section schema with a per-project, fully editable section/field model backed by a clean JSON envelope on export.

**Architecture:** A new module `components/form-builder.jsx` owns the field-type registry and all field/section/modal components. `data.js` ships per-template `defaultSections[]` and helpers (`ensureProjectSections`, `applySectionDefaultToTemplate`, `applyFieldDefaultToTemplate`, `replaceTemplateSectionDefault`, `buildExport`). `editor-customize.jsx` is reduced to wizard chrome + Brand/Team steps and delegates the section form to the new module. No backend, no persistence, no preview rendering in v1.

**Tech Stack:** React 18 + Babel Standalone (no bundler), Tailwind utility classes, existing atoms from `components/shell.jsx` (Card, Button, Modal, Badge, Input, toast).

**Spec:** `docs/superpowers/specs/2026-05-08-form-builder-design.md`

**Conventions:**
- Manual browser verification replaces automated tests (no test runner).
- Dev server: `python3 -m http.server 8080`, open `http://localhost:8080`.
- Commit after each task with conventional-commit messages (`feat:`, `refactor:`, `chore:`).
- All paths are repo-relative.

---

## Phase 0 — Foundations

### Task 1: Create `form-builder.jsx` skeleton with `FIELD_TYPES` registry

**Files:**
- Create: `components/form-builder.jsx`

- [ ] **Step 1: Create the file with registry, ID helper, and `createDefaultField`**

```jsx
const { useState: useStateFB, useRef: useRefFB, useEffect: useEffectFB, useMemo: useMemoFB } = React;

// Stable-ish ID. crypto.randomUUID where available, fallback otherwise.
function newId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return prefix + '_' + crypto.randomUUID().slice(0, 8);
  }
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Field type registry. Adding a new type = one entry here + one branch in FieldRenderer.
const FIELD_TYPES = {
  text:    { label: 'Text',    icon: '¶', requiresLabel: true,  defaultConfig: () => ({ placeholder: '' }),                      defaultValue: () => '' },
  number:  { label: 'Number',  icon: '#', requiresLabel: true,  defaultConfig: () => ({ placeholder: '' }),                      defaultValue: () => '' },
  image:   { label: 'Image',   icon: '◇', requiresLabel: true,  defaultConfig: () => ({}),                                       defaultValue: () => null },
  table:   { label: 'Table',   icon: '▦', requiresLabel: true,  defaultConfig: () => ({ description: '', rows: 3, columns: [{ id: newId('col'), label: 'Column 1' }] }), defaultValue: () => [['']] },
  list:    { label: 'List',    icon: '•', requiresLabel: true,  defaultConfig: () => ({ style: 'bullet' }),                      defaultValue: () => [''] },
  divider: { label: 'Divider', icon: '—', requiresLabel: false, defaultConfig: () => ({}),                                       defaultValue: () => null },
  quote:   { label: 'Quote',   icon: '"', requiresLabel: false, defaultConfig: () => ({}),                                       defaultValue: () => ({ author: '', text: '' }) },
};

function createDefaultField(type) {
  const t = FIELD_TYPES[type];
  if (!t) throw new Error(`Unknown field type: ${type}`);
  return {
    id: newId('fld'),
    type,
    label: t.requiresLabel ? '' : t.label,
    required: false,
    config: t.defaultConfig(),
    origin: 'custom',
  };
}

// Components added in subsequent tasks.

Object.assign(window, { FIELD_TYPES, newId, createDefaultField });
```

- [ ] **Step 2: Wire script tag in `index.html`**

Open `index.html` and update the script block (line 60–64) to:

```html
<script type="text/babel" src="components/shell.jsx"></script>
<script type="text/babel" src="components/form-builder.jsx"></script>
<script type="text/babel" src="components/auth-dashboards.jsx"></script>
<script type="text/babel" src="components/editor-customize.jsx"></script>
<script type="text/babel" src="components/storyguide.jsx"></script>
<script type="text/babel" src="components/app.jsx"></script>
```

- [ ] **Step 3: Verify in browser**

Run: `python3 -m http.server 8080` (background), open `http://localhost:8080`, open DevTools console.

Expected: no errors. Type `window.FIELD_TYPES` in console — expect object with 7 keys. Type `window.createDefaultField('text')` — expect `{id: 'fld_...', type: 'text', label: '', required: false, config: {placeholder: ''}, origin: 'custom'}`.

- [ ] **Step 4: Commit**

```bash
git add index.html components/form-builder.jsx
git commit -m "feat(form-builder): add field-type registry and ID helper"
```

---

### Task 2: Define shared `DEFAULT_SECTIONS` in `data.js` and attach to all templates

**Files:**
- Modify: `data.js:18-23` (TEMPLATES) + add `DEFAULT_SECTIONS` constant above

- [ ] **Step 1: Add `DEFAULT_SECTIONS` constant**

Insert after the `CLIENT_COMPANIES` block, before `TEMPLATES`. The 14 sections mirror current `SECTION_TITLES` with curated fields for sections 1–6 (from old `SECTION_FIELDS`) and generic Content/Notes pairs for 7–14:

```js
// Shared default schema used as the seed for new projects across all 4 templates in v1.
// Per-template differentiation is deferred — same set everywhere for now.
const DEFAULT_SECTIONS = [
  { templateKey: 'cover', title: 'Cover', fields: [
    { templateFieldKey: 'clientName', type: 'text', label: 'Client name', config: { placeholder: 'Meridian Coffee Co.' } },
    { templateFieldKey: 'tagline',    type: 'text', label: 'Tagline',     config: { placeholder: 'Coffee with conviction.' } },
    { templateFieldKey: 'preparedBy', type: 'text', label: 'Prepared by', config: { placeholder: 'Woden' } },
    { templateFieldKey: 'version',    type: 'text', label: 'Version',     config: { placeholder: '1.3' } },
  ]},
  { templateKey: 'narrative', title: 'Strategic Narrative', fields: [
    { templateFieldKey: 'origin',     type: 'text', label: 'Origin',     config: { placeholder: 'In 2014, a barista named Ana…' } },
    { templateFieldKey: 'conflict',   type: 'text', label: 'Conflict',   config: { placeholder: 'Three farmers. Seven middlemen…' } },
    { templateFieldKey: 'resolution', type: 'text', label: 'Resolution', config: { placeholder: 'Meridian began as a single direct-trade relationship…' } },
  ]},
  { templateKey: 'mission-vision', title: 'Mission & Vision', fields: [
    { templateFieldKey: 'mission', type: 'text', label: 'Mission', config: { placeholder: 'To connect growers and drinkers…' } },
    { templateFieldKey: 'vision',  type: 'text', label: 'Vision',  config: { placeholder: 'A coffee industry where every cup traces…' } },
  ]},
  { templateKey: 'target-audience', title: 'Target Audience', fields: [
    { templateFieldKey: 'p1Name',  type: 'text', label: 'Persona 1 name',  config: { placeholder: 'Conscious Casey' } },
    { templateFieldKey: 'p1Quote', type: 'text', label: 'Persona 1 quote', config: { placeholder: 'I want to know where my money actually goes.' } },
    { templateFieldKey: 'p2Name',  type: 'text', label: 'Persona 2 name',  config: { placeholder: 'Office Owen' } },
    { templateFieldKey: 'p2Quote', type: 'text', label: 'Persona 2 quote', config: { placeholder: 'I buy coffee for 50 people…' } },
  ]},
  { templateKey: 'positioning', title: 'Positioning Statement', fields: [
    { templateFieldKey: 'positioning', type: 'text', label: 'Positioning statement', config: { placeholder: 'For people who care where their coffee comes from…' } },
  ]},
  { templateKey: 'pillars', title: 'Brand Pillars', fields: [
    { templateFieldKey: 'pillar1', type: 'text', label: 'Pillar 1', config: { placeholder: 'Transparent' } },
    { templateFieldKey: 'pillar2', type: 'text', label: 'Pillar 2', config: { placeholder: 'Rigorous' } },
    { templateFieldKey: 'pillar3', type: 'text', label: 'Pillar 3', config: { placeholder: 'Warm' } },
    { templateFieldKey: 'pillar4', type: 'text', label: 'Pillar 4', config: { placeholder: 'Curious' } },
  ]},
  { templateKey: 'core-messaging',     title: 'Core Messaging',        fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'tone-of-voice',      title: 'Tone of Voice',         fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'brand-values',       title: 'Brand Values',          fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'brand-personality',  title: 'Brand Personality',     fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'visual-identity',    title: 'Visual Identity',       fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'photography',        title: 'Photography & Imagery', fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'applications',       title: 'Applications',          fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
  { templateKey: 'glossary',           title: 'Glossary',              fields: [
    { templateFieldKey: 'content', type: 'text', label: 'Content', config: { placeholder: 'Fill this section…' } },
    { templateFieldKey: 'notes',   type: 'text', label: 'Notes',   config: { placeholder: '' } },
  ]},
];
```

- [ ] **Step 2: Attach `defaultSections: DEFAULT_SECTIONS` to all 4 entries in `TEMPLATES`**

Replace the existing `TEMPLATES` block:

```js
const TEMPLATES = [
  { id: 't-it',            name: 'IT Company',            category: 'it',            description: 'Tech, SaaS, dev tooling. Emphasis on product narrative and technical credibility.', defaultSections: DEFAULT_SECTIONS },
  { id: 't-management',    name: 'Management Consulting', category: 'management',    description: 'Advisory and consulting firms. Emphasis on outcomes, frameworks, and trust.',         defaultSections: DEFAULT_SECTIONS },
  { id: 't-manufacturing', name: 'Manufacturing',         category: 'manufacturing', description: 'Industrial, B2B, supply chain. Emphasis on operational expertise and reliability.',  defaultSections: DEFAULT_SECTIONS },
  { id: 't-consumer',      name: 'Consumer Brand',        category: 'consumer',      description: 'Direct-to-consumer, lifestyle. Emphasis on values, identity, and emotional connection.', defaultSections: DEFAULT_SECTIONS },
];
```

- [ ] **Step 3: Delete `SECTION_TITLES`**

Remove the `const SECTION_TITLES = [...]` block (data.js:58-63) and its reference in the `Object.assign(window.WODEN, ...)` block at the bottom of the file.

- [ ] **Step 4: Verify in browser**

Reload `http://localhost:8080`. In console: `window.WODEN.TEMPLATES[0].defaultSections.length` → expect `14`. `window.WODEN.SECTION_TITLES` → expect `undefined`.

(NOTE: At this point `editor-customize.jsx` will fail because it references `window.WODEN.SECTION_TITLES`. That is fixed in Task 5. Don't navigate to a project editor yet — verify only the dashboard loads.)

- [ ] **Step 5: Commit**

```bash
git add data.js
git commit -m "feat(data): seed templates with DEFAULT_SECTIONS schema"
```

---

### Task 3: Add data helpers to `data.js` (`ensureProjectSections`, template default upserts, `buildExport`)

**Files:**
- Modify: `data.js` (append helpers, expose on `window.WODEN`)

- [ ] **Step 1: Add the helper functions before the final `Object.assign(window.WODEN, ...)` block**

```js
// Idempotent: builds project.sections + project.sectionValues from the project's template.
function ensureProjectSections(project, template) {
  if (project.sections && Array.isArray(project.sections)) return;
  const src = (template && template.defaultSections) || [];
  project.sections = src.map(s => ({
    id: newIdData('sec'),
    templateKey: s.templateKey,
    title: s.title,
    origin: 'template',
    metadata: '',
    fields: (s.fields || []).map(f => ({
      id: newIdData('fld'),
      templateFieldKey: f.templateFieldKey,
      type: f.type,
      label: f.label,
      required: !!f.required,
      config: JSON.parse(JSON.stringify(f.config || {})),
      origin: 'template',
    })),
  }));
  project.sectionValues = {};
}

// Local copy of newId so data.js doesn't depend on form-builder.jsx load order.
function newIdData(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return prefix + '_' + crypto.randomUUID().slice(0, 8);
  }
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function slugifyKey(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
}

// Append a section's schema (no ids, no values) to template.defaultSections.
// Used when "Save as default" is checked on a brand-new section.
function applySectionDefaultToTemplate(template, section) {
  if (!template) return;
  if (!Array.isArray(template.defaultSections)) template.defaultSections = [];
  const templateKey = section.templateKey || slugifyKey(section.title);
  const def = {
    templateKey,
    title: section.title,
    fields: (section.fields || []).map(f => ({
      templateFieldKey: f.templateFieldKey || slugifyKey(f.label),
      type: f.type,
      label: f.label,
      required: !!f.required,
      config: JSON.parse(JSON.stringify(f.config || {})),
    })),
  };
  const existingIdx = template.defaultSections.findIndex(s => s.templateKey === templateKey);
  if (existingIdx >= 0) template.defaultSections[existingIdx] = def;
  else template.defaultSections.push(def);
}

// Replace a section default by templateKey (used when editing template-origin section's metadata/title).
function replaceTemplateSectionDefault(template, section) {
  applySectionDefaultToTemplate(template, section); // same upsert semantics
}

// Append/replace a single field on a section default by templateFieldKey.
function applyFieldDefaultToTemplate(template, sectionTemplateKey, field) {
  if (!template || !sectionTemplateKey) return;
  if (!Array.isArray(template.defaultSections)) return;
  const sec = template.defaultSections.find(s => s.templateKey === sectionTemplateKey);
  if (!sec) return;
  const fieldKey = field.templateFieldKey || slugifyKey(field.label);
  const def = {
    templateFieldKey: fieldKey,
    type: field.type,
    label: field.label,
    required: !!field.required,
    config: JSON.parse(JSON.stringify(field.config || {})),
  };
  if (!Array.isArray(sec.fields)) sec.fields = [];
  const idx = sec.fields.findIndex(f => f.templateFieldKey === fieldKey);
  if (idx >= 0) sec.fields[idx] = def;
  else sec.fields.push(def);
}

// Builds the export envelope. Values are inlined into each field for backend-friendliness.
function buildExport(project, template) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      description: project.description || '',
      status: project.status,
      templateId: project.templateId || null,
      templateName: (template && template.name) || null,
    },
    sections: (project.sections || []).map(s => ({
      id: s.id,
      templateKey: s.templateKey || null,
      title: s.title,
      origin: s.origin,
      metadata: s.metadata || '',
      fields: (s.fields || []).map(f => ({
        id: f.id,
        templateFieldKey: f.templateFieldKey || null,
        type: f.type,
        label: f.label,
        required: !!f.required,
        config: f.config,
        origin: f.origin,
        value: ((project.sectionValues || {})[s.id] || {})[f.id] ?? null,
      })),
    })),
    brand: {
      palette: project.palette || [],
      fonts: project.fonts || null,
      logo: project.logo || null,
    },
    team: project.team || [],
  };
}
```

- [ ] **Step 2: Expose helpers on `window.WODEN`**

Find the final `Object.assign(window.WODEN, { ... })` block in `data.js` and add the new exports. Example merged shape:

```js
Object.assign(window.WODEN, {
  MOCK_USERS, CLIENT_COMPANIES, PROJECTS, MANAGERS, TEMPLATES, MERIDIAN,
  CHAT_SUGGESTIONS, mockChatReply,
  getProjectClients, getProjectManagers, getProjectTemplate,
  // new helpers:
  DEFAULT_SECTIONS,
  ensureProjectSections,
  applySectionDefaultToTemplate,
  replaceTemplateSectionDefault,
  applyFieldDefaultToTemplate,
  buildExport,
});
```

(Adjust to whatever keys are already there — keep existing exports, add the new ones.)

- [ ] **Step 3: Verify in browser**

Reload `http://localhost:8080`. In console:

```js
const p = window.WODEN.PROJECTS[0];
const t = window.WODEN.getProjectTemplate(p);
window.WODEN.ensureProjectSections(p, t);
console.log(p.sections.length, p.sectionValues);
```

Expected: `14 {}`. Run `window.WODEN.ensureProjectSections(p, t)` again — `p.sections.length` still `14` (idempotent).

```js
console.log(window.WODEN.buildExport(p, t));
```

Expected: object with `schemaVersion: 1`, `sections: Array(14)`, each section's fields each having a `value` property (all `null`).

- [ ] **Step 4: Commit**

```bash
git add data.js
git commit -m "feat(data): add ensureProjectSections, template default helpers, buildExport"
```

---

## Phase 1 — Wire editor to new model (no field-type rendering yet)

### Task 4: Replace `ProjectEditor` state and remove legacy section schema

**Files:**
- Modify: `components/editor-customize.jsx:404-504` (delete `SECTION_FIELDS`, `GENERIC_FIELDS`, `getSectionFields`, local `SectionForm`)
- Modify: `components/editor-customize.jsx:550-700` (rework `ProjectEditor` state + `WizardStrip`)

- [ ] **Step 1: Delete legacy schema and local `SectionForm`**

In `components/editor-customize.jsx`, delete the entire block from `// ── 14-section wizard field schema ───` (line 404) through the closing `}` of `function SectionForm({ step, values, onField, logo, onLogoFile }) { ... }` (~line 504). The replacement (`window.SectionForm`) is added in Task 6.

- [ ] **Step 2: Update `ProjectEditor` state initialization**

Replace the existing block starting around line 568:

```jsx
  // 14 wizard sections + Brand (15) + Team (16)
  const SECTION_TITLES = window.WODEN.SECTION_TITLES;
  const SECTION_COUNT = SECTION_TITLES.length; // 14
  const BRAND_STEP = SECTION_COUNT + 1;        // 15
  const TEAM_STEP  = SECTION_COUNT + 2;        // 16
  const lastStep = TEAM_STEP;
```

with:

```jsx
  // Initialize project.sections / project.sectionValues from template defaults.
  const tplForSeed = window.WODEN.getProjectTemplate(project);
  window.WODEN.ensureProjectSections(project, tplForSeed);

  const [sections, setSections] = useStateE(() => project.sections);
  const [sectionValues, setSectionValues] = useStateE(() => project.sectionValues || {});
  const SECTION_COUNT = sections.length;
  const BRAND_STEP = SECTION_COUNT + 1;
  const TEAM_STEP  = SECTION_COUNT + 2;
  const lastStep = TEAM_STEP;
```

Also delete the old `[content, setContent]` and `[sectionData, setSectionData]` and the `setSectionField` helper from `ProjectEditor`.

- [ ] **Step 3: Update `persist()`**

Replace the existing `persist()`:

```jsx
  const persist = () => {
    project.sections = sections;
    project.sectionValues = sectionValues;
    project.description = description;
    project.logo = logo;
    project.palette = brandColors;
    project.fonts = brandFonts;
    project.team = team;
    project.updated = 'just now';
  };
```

(Note: `project.content` and `project.sectionData` are no longer written.)

- [ ] **Step 4: Update `WizardStrip` to render from `sections`**

Replace the existing `WizardStrip` component:

```jsx
  const WizardStrip = () => (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-light-gray items-center">
      {sections.map((s, i) => <WizardPill key={s.id} n={i + 1} label={s.title} />)}
      <WizardPill n={BRAND_STEP} label="Brand" />
      <WizardPill n={TEAM_STEP}  label="Team" />
    </div>
  );
```

(`+`-slots between pills are added in Task 12.)

- [ ] **Step 5: Update the section-step section header label**

Replace the line that reads:
```jsx
                ? `Section ${flowStep} of ${SECTION_COUNT} · ${SECTION_TITLES[flowStep - 1]}`
```
with:
```jsx
                ? `Section ${flowStep} of ${SECTION_COUNT} · ${sections[flowStep - 1].title}`
```

- [ ] **Step 6: Replace the section-step body with a placeholder until Task 6 adds `<SectionForm>`**

Inside the `{isSectionStep && (...)}` block, replace the inner `<Card pad="p-5 sm:p-7">…<SectionForm step={flowStep} … /></Card>` with this temporary stub. We will swap it for the real `<window.SectionForm>` in Task 6.

```jsx
              <Card pad="p-5 sm:p-7">
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint mb-1">
                  Section {String(flowStep).padStart(2, '0')}
                </div>
                <h2 className="text-2xl font-bold mb-5">{sections[flowStep - 1].title}</h2>
                <p className="text-ink-soft text-sm">Field rendering wired in Task 6. Section has {sections[flowStep - 1].fields.length} fields.</p>
              </Card>
```

- [ ] **Step 7: Verify in browser**

Reload `http://localhost:8080`. Sign in (any role), open a project (e.g. Meridian → Brand Strategy 2024). Navigate the wizard 1 → 14 → Brand → Team. Expected:
- All 14 section pills render with correct titles.
- Each section card shows "Field rendering wired in Task 6. Section has N fields." with N = 4, 3, 2, 4, 1, 4, 2, 2, 2, 2, 2, 2, 2, 2 for sections 1..14.
- Brand and Team steps work as before (palette, fonts, logo, members).
- Generate button still does the old `nav(backRoute)` (Export modal added in Task 16).

- [ ] **Step 8: Commit**

```bash
git add components/editor-customize.jsx
git commit -m "refactor(editor): switch ProjectEditor to project.sections data model"
```

---

## Phase 2 — Field rendering inside section form

### Task 5: Implement `<FieldRenderer>` for `text` and `number`

**Files:**
- Modify: `components/form-builder.jsx`

- [ ] **Step 1: Add `FieldRenderer` (text + number branches) and a placeholder switch for other types**

Append before the `Object.assign(window, …)` line:

```jsx
function FieldRenderer({ field, value, onValueChange }) {
  if (field.type === 'text') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>
        <textarea
          className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
          rows={4}
          placeholder={field.config.placeholder || ''}
          value={value || ''}
          onChange={e => onValueChange(e.target.value)}
        />
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>
        <input
          type="number"
          className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
          placeholder={field.config.placeholder || ''}
          value={value ?? ''}
          onChange={e => onValueChange(e.target.value)}
        />
      </div>
    );
  }
  // Other types added in Tasks 7–10.
  return (
    <div className="text-ink-faint text-sm font-mono">[{field.type}] field renderer not yet implemented.</div>
  );
}
```

- [ ] **Step 2: Add `<SectionForm>` (minimal — header + fields list, no toolbar/add yet)**

```jsx
function SectionForm({ section, values, onValueChange }) {
  return (
    <div className="flex flex-col gap-5">
      {section.fields.length === 0 && (
        <p className="text-ink-faint text-sm font-mono italic">No fields in this section yet.</p>
      )}
      {section.fields.map(f => (
        <FieldRenderer
          key={f.id}
          field={f}
          value={values[f.id]}
          onValueChange={(v) => onValueChange(f.id, v)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Export both**

Update the `Object.assign(window, ...)` line at the bottom of `form-builder.jsx`:

```jsx
Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm });
```

- [ ] **Step 4: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): FieldRenderer for text/number, base SectionForm"
```

---

### Task 6: Wire `<SectionForm>` into `ProjectEditor`

**Files:**
- Modify: `components/editor-customize.jsx` (the section-step body added as stub in Task 4 Step 6)

- [ ] **Step 1: Replace the stub with real form**

Locate the placeholder Card from Task 4 and replace with:

```jsx
              <Card pad="p-5 sm:p-7">
                <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint mb-1">
                  Section {String(flowStep).padStart(2, '0')}
                </div>
                <h2 className="text-2xl font-bold mb-5">{sections[flowStep - 1].title}</h2>
                <window.SectionForm
                  section={sections[flowStep - 1]}
                  values={sectionValues[sections[flowStep - 1].id] || {}}
                  onValueChange={(fieldId, v) => {
                    const sid = sections[flowStep - 1].id;
                    setSectionValues(prev => ({
                      ...prev,
                      [sid]: { ...(prev[sid] || {}), [fieldId]: v },
                    }));
                  }}
                />
              </Card>
```

- [ ] **Step 2: Verify in browser**

Reload, open a project, walk through sections 1–6. Expected:
- Cover (1): 4 text inputs with labels Client name / Tagline / Prepared by / Version, with placeholders.
- Strategic Narrative (2): 3 textareas Origin / Conflict / Resolution.
- Mission & Vision (3): 2 textareas.
- Target Audience (4): 4 inputs.
- Positioning (5): 1 textarea.
- Brand Pillars (6): 4 inputs.
- Sections 7–14: 2 textareas (Content, Notes).

Type into a few fields, navigate forward, navigate back — values must persist across steps.

- [ ] **Step 3: Commit**

```bash
git add components/editor-customize.jsx
git commit -m "feat(editor): render section forms via window.SectionForm"
```

---

### Task 7: Implement `image`, `divider`, `quote` field renderers

**Files:**
- Modify: `components/form-builder.jsx` (`FieldRenderer`)

- [ ] **Step 1: Add `image` branch**

Insert the following branches in `FieldRenderer` before the catch-all `return`:

```jsx
  if (field.type === 'image') {
    const onFile = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { window.toast && window.toast('Image must be under 2MB'); return; }
      const reader = new FileReader();
      reader.onload = () => onValueChange(reader.result);
      reader.readAsDataURL(file);
    };
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-20 h-20 rounded-xl border border-light-gray bg-paper-warm flex items-center justify-center overflow-hidden shrink-0">
            {value
              ? <img src={value} alt={field.label} className="max-w-full max-h-full object-contain" />
              : <span className="text-ink-faint font-mono text-[12px] uppercase">No image</span>}
          </div>
          <label className="px-3 py-2 rounded-lg border border-light-gray text-sm cursor-pointer hover:border-contrast transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            {value ? 'Replace' : 'Upload image'}
          </label>
          {value && (
            <button type="button" onClick={() => onValueChange(null)} className="px-3 py-2 rounded-lg border border-light-gray text-sm hover:border-contrast transition-colors">Remove</button>
          )}
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Add `divider` branch**

```jsx
  if (field.type === 'divider') {
    return <hr className="border-0 border-t border-light-gray my-2" />;
  }
```

- [ ] **Step 3: Add `quote` branch**

```jsx
  if (field.type === 'quote') {
    const v = value || { author: '', text: '' };
    return (
      <div className="flex flex-col gap-1.5">
        {field.label && <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>}
        <div className="flex flex-col gap-2 px-4 py-3 border-l-2 border-primary bg-paper-warm rounded-r-lg">
          <textarea
            className="w-full px-3 py-2 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus italic"
            rows={3}
            placeholder="Quote text"
            value={v.text}
            onChange={e => onValueChange({ ...v, text: e.target.value })}
          />
          <input
            className="w-full px-3 py-2 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
            placeholder="Author"
            value={v.author}
            onChange={e => onValueChange({ ...v, author: e.target.value })}
          />
        </div>
      </div>
    );
  }
```

- [ ] **Step 4: Verify in browser**

Reload. Manually inject a test field via console:

```js
const p = window.WODEN.PROJECTS[0];
p.sections[0].fields.push(window.createDefaultField('image'));
p.sections[0].fields.push(window.createDefaultField('divider'));
p.sections[0].fields.push(window.createDefaultField('quote'));
```

Reopen project (or full reload — sections regenerate from template; instead modify the section *after* opening: easier to verify by adding via Task 9 once available). For this task, verify by editing `p.sections[0].fields` BEFORE opening the editor: refresh after the console patch, then go to Cover step. Image/Divider/Quote render as designed. Image upload works (use a small PNG).

- [ ] **Step 5: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): image, divider, quote field renderers"
```

---

### Task 8: Implement `list` field renderer

**Files:**
- Modify: `components/form-builder.jsx` (`FieldRenderer`)

- [ ] **Step 1: Add `list` branch**

```jsx
  if (field.type === 'list') {
    const items = Array.isArray(value) ? value : [''];
    const setItems = (next) => onValueChange(next);
    const numbered = field.config.style === 'numbered';
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>
        <div className="flex flex-col gap-1.5">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-5 text-ink-faint font-mono text-[12px] text-right shrink-0">{numbered ? `${idx + 1}.` : '•'}</span>
              <input
                className="flex-1 px-3 py-2 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                placeholder="List item"
                value={it}
                onChange={e => { const next = [...items]; next[idx] = e.target.value; setItems(next); }}
              />
              <button
                type="button"
                onClick={() => { const next = items.filter((_, i) => i !== idx); setItems(next.length ? next : ['']); }}
                className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray transition-colors text-base leading-none shrink-0"
                aria-label="Remove item"
              >×</button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems([...items, ''])}
          className="mt-1 px-3 py-2 rounded-xl border border-dashed border-light-gray text-[12px] font-medium text-ink-soft hover:text-contrast hover:border-ink-faint transition-colors w-full"
        >+ Add item</button>
      </div>
    );
  }
```

- [ ] **Step 2: Verify in browser**

Inject via console before opening editor:
```js
const p = window.WODEN.PROJECTS[0];
delete p.sections;          // force re-seed
window.location.reload();   // start fresh
```

After reload, in console:
```js
const p = window.WODEN.PROJECTS[0];
const t = window.WODEN.getProjectTemplate(p);
window.WODEN.ensureProjectSections(p, t);
const f = window.createDefaultField('list');
f.label = 'My list';
p.sections[0].fields.push(f);
```

Open project → Cover. Expected: list with one empty input, "+ Add item" button. Add 2 items, remove one, type text. Switch to step 2 and back — values persist (after Task 6 wiring already handles this).

Toggle to numbered: `f.config.style = 'numbered'` — numbers `1.`, `2.` appear instead of bullets.

- [ ] **Step 3: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): list field renderer"
```

---

### Task 9: Implement `table` field renderer

**Files:**
- Modify: `components/form-builder.jsx` (`FieldRenderer`)

- [ ] **Step 1: Add `table` branch**

```jsx
  if (field.type === 'table') {
    const cfg = field.config || {};
    const cols = Array.isArray(cfg.columns) ? cfg.columns : [];
    const rows = Math.max(1, cfg.rows || 1);
    // Normalize value to a [rows][cols] grid of strings.
    const grid = (() => {
      const v = Array.isArray(value) ? value : [];
      const out = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols.length; c++) {
          row.push((v[r] && typeof v[r][c] === 'string') ? v[r][c] : '');
        }
        out.push(row);
      }
      return out;
    })();
    const setCell = (r, c, val) => {
      const next = grid.map(row => row.slice());
      next[r][c] = val;
      onValueChange(next);
    };
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">{field.label}</label>
        {cfg.description && <p className="text-ink-soft text-sm m-0">{cfg.description}</p>}
        <div className="overflow-x-auto rounded-lg border border-light-gray">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-paper-warm">
                {cols.map(col => (
                  <th key={col.id} className="px-3 py-2 text-left text-[12px] font-mono uppercase tracking-widest text-ink-faint border-b border-light-gray">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-t border-light-gray p-0">
                      <input
                        className="w-full px-3 py-2 bg-base text-contrast text-sm focus:outline-none focus:bg-paper-warm"
                        value={cell}
                        onChange={e => setCell(ri, ci, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
```

- [ ] **Step 2: Verify in browser**

In console (after fresh reload + ensureProjectSections):
```js
const f = window.createDefaultField('table');
f.label = 'Q3 numbers';
f.config.description = 'Top channels.';
f.config.rows = 2;
f.config.columns = [
  { id: 'c1', label: 'Channel' },
  { id: 'c2', label: 'Revenue' },
];
window.WODEN.PROJECTS[0].sections[0].fields.push(f);
```

Open project → Cover. Expected: a 2-row × 2-col editable grid with description above. Type into cells; navigate away and back — values persist.

- [ ] **Step 3: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): table field renderer"
```

---

## Phase 3 — Field create / edit / delete / reorder

### Task 10: Build `<FieldConfigModal>` shell with type grid + per-type config form

**Files:**
- Modify: `components/form-builder.jsx`

- [ ] **Step 1: Add `FieldConfigModal`**

```jsx
function FieldConfigModal({ mode, initialField, sectionTemplateKey, template, onSave, onClose }) {
  // mode: 'create' | 'edit'
  const isEdit = mode === 'edit';
  const [type, setType] = useStateFB(initialField?.type || 'text');
  const [label, setLabel] = useStateFB(initialField?.label || '');
  const [config, setConfig] = useStateFB(initialField?.config ? JSON.parse(JSON.stringify(initialField.config)) : FIELD_TYPES[type].defaultConfig());
  const [saveAsDefault, setSaveAsDefault] = useStateFB(false);

  // Reset config when type changes (only meaningful in 'create' mode).
  useEffectFB(() => {
    if (!isEdit) setConfig(FIELD_TYPES[type].defaultConfig());
  }, [type, isEdit]);

  const tDef = FIELD_TYPES[type];
  const labelRequired = tDef.requiresLabel;
  const labelOk = !labelRequired || label.trim().length > 0;
  const wide = type === 'table';

  const submit = () => {
    if (!labelOk) { window.toast && window.toast('Label is required'); return; }
    const field = isEdit
      ? { ...initialField, label: labelRequired ? label.trim() : (label.trim() || tDef.label), config }
      : { ...createDefaultField(type), label: labelRequired ? label.trim() : (label.trim() || tDef.label), config };
    onSave(field, { saveAsDefault });
  };

  return (
    <div className="fixed inset-0 bg-black/45 z-[200] grid place-items-center p-3" onClick={onClose}>
      <div
        className={`bg-base border border-light-gray rounded-[24px] ${wide ? 'w-[640px]' : 'w-[480px]'} max-w-[calc(100vw-24px)] p-5 sm:p-8 shadow-lg`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Edit field' : 'Add field'}</h3>
          <window.Button variant="ghost" size="sm" onClick={onClose}>✕</window.Button>
        </div>

        {!isEdit && (
          <>
            <div className="text-[12px] font-mono uppercase tracking-widest text-ink-faint mb-2">Field type</div>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {Object.entries(FIELD_TYPES).map(([k, t]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={`flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border text-[12px] font-medium transition-colors ${type === k ? 'border-primary bg-primary-bg-subtle text-secondary' : 'border-light-gray hover:border-contrast'}`}
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-4">
          {labelRequired && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Label*</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Mission"
              />
            </div>
          )}

          {!labelRequired && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Label (optional)</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={tDef.label}
              />
            </div>
          )}

          {(type === 'text' || type === 'number') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Placeholder</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                value={config.placeholder || ''}
                onChange={e => setConfig({ ...config, placeholder: e.target.value })}
              />
            </div>
          )}

          {type === 'list' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Style</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={config.style === 'bullet'} onChange={() => setConfig({ ...config, style: 'bullet' })} />
                  Bullets
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" checked={config.style === 'numbered'} onChange={() => setConfig({ ...config, style: 'numbered' })} />
                  Numbered
                </label>
              </div>
            </div>
          )}

          {type === 'table' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Description</label>
                <input
                  className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                  value={config.description || ''}
                  onChange={e => setConfig({ ...config, description: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Rows</label>
                <input
                  type="number"
                  min={1}
                  className="w-32 px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                  value={config.rows || 1}
                  onChange={e => setConfig({ ...config, rows: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Columns</label>
                <div className="flex flex-col gap-2">
                  {(config.columns || []).map((col, idx) => (
                    <div key={col.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 px-3 py-2 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                        value={col.label}
                        onChange={e => {
                          const next = config.columns.slice();
                          next[idx] = { ...col, label: e.target.value };
                          setConfig({ ...config, columns: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = config.columns.filter((_, i) => i !== idx);
                          setConfig({ ...config, columns: next.length ? next : [{ id: newId('col'), label: 'Column 1' }] });
                        }}
                        className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray transition-colors text-base leading-none shrink-0"
                        aria-label="Remove column"
                      >×</button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, columns: [...(config.columns || []), { id: newId('col'), label: `Column ${(config.columns || []).length + 1}` }] })}
                  className="mt-1 px-3 py-2 rounded-xl border border-dashed border-light-gray text-[12px] font-medium text-ink-soft hover:text-contrast hover:border-ink-faint transition-colors w-full"
                >+ Add column</button>
              </div>
            </>
          )}

          {type === 'divider' && (
            <div className="px-3 py-3 border border-light-gray rounded-lg bg-paper-warm">
              <hr className="border-0 border-t border-light-gray my-2" />
              <p className="text-ink-soft text-sm m-0 text-center">Horizontal rule. No configuration needed.</p>
            </div>
          )}

          {template && (
            <label className="flex items-start gap-2 mt-2 cursor-pointer">
              <input type="checkbox" checked={saveAsDefault} onChange={e => setSaveAsDefault(e.target.checked)} className="mt-1" />
              <span className="text-sm text-ink-soft">Save as default for <strong>{template.name}</strong> template</span>
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <window.Button variant="ghost" onClick={onClose}>Cancel</window.Button>
          <window.Button variant="primary" onClick={submit}>{isEdit ? 'Save changes' : 'Add field'}</window.Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export**

Update the bottom export line:
```jsx
Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm, FieldConfigModal });
```

- [ ] **Step 3: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): FieldConfigModal with type grid and per-type config"
```

---

### Task 11: Wire Add Field / Edit Field / Delete / Reorder into `<SectionForm>`

**Files:**
- Modify: `components/form-builder.jsx` (`SectionForm`, add `onSectionChange` prop and toolbar)
- Modify: `components/editor-customize.jsx` (pass new props to `<window.SectionForm>`)

- [ ] **Step 1: Replace `<SectionForm>` with the toolbar-enabled version**

```jsx
function SectionForm({ section, values, onValueChange, onSectionChange, onSaveFieldDefault, template }) {
  const [editing, setEditing] = useStateFB(null);     // field id being edited
  const [creating, setCreating] = useStateFB(false);

  const updateField = (idx, mutator) => {
    const nextFields = section.fields.slice();
    nextFields[idx] = mutator(nextFields[idx]);
    onSectionChange({ ...section, fields: nextFields });
  };

  const moveField = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= section.fields.length) return;
    const next = section.fields.slice();
    [next[idx], next[j]] = [next[j], next[idx]];
    onSectionChange({ ...section, fields: next });
  };

  const deleteField = (idx) => {
    const f = section.fields[idx];
    if (!window.confirm(`Delete field "${f.label || f.type}"? Existing data will be lost.`)) return;
    const nextFields = section.fields.filter((_, i) => i !== idx);
    onSectionChange({ ...section, fields: nextFields });
    if (values && f.id in values) onValueChange(f.id, undefined, { drop: true });
  };

  const handleCreate = (field, opts) => {
    const newField = { ...field, origin: 'custom' };
    onSectionChange({ ...section, fields: [...section.fields, newField] });
    onValueChange(newField.id, FIELD_TYPES[newField.type].defaultValue());
    if (opts.saveAsDefault && onSaveFieldDefault) onSaveFieldDefault(newField);
    setCreating(false);
  };

  const handleEdit = (field, opts) => {
    const idx = section.fields.findIndex(f => f.id === editing);
    if (idx < 0) return;
    updateField(idx, (prev) => ({ ...prev, label: field.label, config: field.config }));
    if (opts.saveAsDefault && onSaveFieldDefault) onSaveFieldDefault({ ...section.fields[idx], label: field.label, config: field.config });
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {section.fields.length === 0 && (
        <p className="text-ink-faint text-sm font-mono italic">No fields in this section yet.</p>
      )}
      {section.fields.map((f, idx) => (
        <div key={f.id} className="group relative border border-transparent hover:border-light-gray rounded-xl p-3 -m-3 transition-colors">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-base/80 backdrop-blur-sm rounded-md p-1">
            <button type="button" disabled={idx === 0} onClick={() => moveField(idx, -1)} className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move up">↑</button>
            <button type="button" disabled={idx === section.fields.length - 1} onClick={() => moveField(idx, 1)} className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Move down">↓</button>
            <button type="button" onClick={() => setEditing(f.id)} className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray transition-colors" aria-label="Edit field">✎</button>
            <button type="button" onClick={() => deleteField(idx)} className="w-7 h-7 rounded-md text-ink-faint hover:text-contrast hover:bg-light-gray transition-colors" aria-label="Delete field">🗑</button>
          </div>
          <FieldRenderer
            field={f}
            value={values[f.id]}
            onValueChange={(v) => onValueChange(f.id, v)}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setCreating(true)}
        className="px-3 py-2 rounded-xl border border-dashed border-light-gray text-[12px] font-medium text-ink-soft hover:text-contrast hover:border-ink-faint transition-colors w-full"
      >+ Add field</button>

      {creating && (
        <FieldConfigModal
          mode="create"
          template={template}
          sectionTemplateKey={section.templateKey}
          onSave={handleCreate}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (() => {
        const f = section.fields.find(ff => ff.id === editing);
        if (!f) return null;
        return (
          <FieldConfigModal
            mode="edit"
            initialField={f}
            template={template}
            sectionTemplateKey={section.templateKey}
            onSave={handleEdit}
            onClose={() => setEditing(null)}
          />
        );
      })()}
    </div>
  );
}
```

- [ ] **Step 2: Update editor to pass new props and handle value drops**

In `components/editor-customize.jsx`, locate the `<window.SectionForm ...>` call from Task 6 and replace with:

```jsx
                <window.SectionForm
                  section={sections[flowStep - 1]}
                  values={sectionValues[sections[flowStep - 1].id] || {}}
                  template={tpl}
                  onValueChange={(fieldId, v, opts) => {
                    const sid = sections[flowStep - 1].id;
                    setSectionValues(prev => {
                      const next = { ...prev, [sid]: { ...(prev[sid] || {}) } };
                      if (opts && opts.drop) delete next[sid][fieldId];
                      else next[sid][fieldId] = v;
                      return next;
                    });
                  }}
                  onSectionChange={(updated) => {
                    setSections(prev => prev.map((s, i) => i === flowStep - 1 ? updated : s));
                  }}
                  onSaveFieldDefault={(field) => {
                    if (!tpl) return;
                    window.WODEN.applyFieldDefaultToTemplate(tpl, sections[flowStep - 1].templateKey, field);
                    window.toast && window.toast('Saved as default — affects new projects');
                  }}
                />
```

- [ ] **Step 3: Verify in browser**

Reload, open a project → Cover. Expected:
- Hover any field: ↑ ↓ ✎ 🗑 toolbar appears top-right.
- Click ✎ on Client name → modal opens with Label = "Client name", Placeholder set. Change label to "Brand name", Save → field re-renders with new label.
- Click 🗑 → confirm → field removed.
- Click "+ Add field" → modal opens with type grid; pick "List", label "Steps", style numbered → Add → field appended, list renderer with one input.
- Add another field, click ↑ to reorder. Add divider → renders.

- [ ] **Step 4: Commit**

```bash
git add components/form-builder.jsx components/editor-customize.jsx
git commit -m "feat(form-builder): add/edit/delete/reorder fields with toolbar"
```

---

## Phase 4 — Section operations

### Task 12: Build `<AddSectionModal>` and insert `+` slots in `WizardStrip`

**Files:**
- Modify: `components/form-builder.jsx` (add `AddSectionModal`)
- Modify: `components/editor-customize.jsx` (add `AddSectionSlot` inline, wire into `WizardStrip`)

- [ ] **Step 1: Add `AddSectionModal` to `form-builder.jsx`**

```jsx
function AddSectionModal({ template, onCreate, onClose }) {
  const [title, setTitle] = useStateFB('');
  const [saveAsDefault, setSaveAsDefault] = useStateFB(false);
  const submit = () => {
    const t = title.trim();
    if (!t) { window.toast && window.toast('Section name is required'); return; }
    onCreate({
      id: newId('sec'),
      templateKey: null,
      title: t,
      origin: 'custom',
      metadata: '',
      fields: [],
    }, { saveAsDefault });
  };
  return (
    <div className="fixed inset-0 bg-black/45 z-[200] grid place-items-center p-3" onClick={onClose}>
      <div className="bg-base border border-light-gray rounded-[24px] w-[480px] max-w-[calc(100vw-24px)] p-5 sm:p-8 shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold">New section</h3>
          <window.Button variant="ghost" size="sm" onClick={onClose}>✕</window.Button>
        </div>
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Section name*</label>
          <input
            autoFocus
            className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
            placeholder='e.g. "Competitive Landscape"'
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>
        {template && (
          <label className="flex items-start gap-2 mb-2 cursor-pointer">
            <input type="checkbox" checked={saveAsDefault} onChange={e => setSaveAsDefault(e.target.checked)} className="mt-1" />
            <span className="text-sm text-ink-soft">Save as default for <strong>{template.name}</strong> template</span>
          </label>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <window.Button variant="ghost" onClick={onClose}>Cancel</window.Button>
          <window.Button variant="primary" onClick={submit}>Add section</window.Button>
        </div>
      </div>
    </div>
  );
}
```

Update bottom export:
```jsx
Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm, FieldConfigModal, AddSectionModal });
```

- [ ] **Step 2: Add inline `AddSectionSlot` and modal state in `ProjectEditor`**

In `components/editor-customize.jsx`, inside `ProjectEditor`, add new state above the `WizardStrip` definition:

```jsx
  const [addSectionAfter, setAddSectionAfter] = useStateE(null); // index after which to insert; null = closed
```

Replace `WizardStrip` with:

```jsx
  const AddSectionSlot = ({ afterIndex }) => (
    <button
      type="button"
      onClick={() => setAddSectionAfter(afterIndex)}
      className="shrink-0 w-6 h-6 rounded-full border border-dashed border-light-gray text-ink-faint text-[12px] leading-none hover:text-contrast hover:border-contrast transition-colors"
      aria-label={`Insert section after position ${afterIndex + 1}`}
    >+</button>
  );

  const WizardStrip = () => (
    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 border-b border-light-gray items-center">
      <AddSectionSlot afterIndex={-1} />
      {sections.map((s, i) => (
        <React.Fragment key={s.id}>
          <WizardPill n={i + 1} label={s.title} />
          <AddSectionSlot afterIndex={i} />
        </React.Fragment>
      ))}
      <WizardPill n={BRAND_STEP} label="Brand" />
      <WizardPill n={TEAM_STEP}  label="Team" />
    </div>
  );
```

- [ ] **Step 3: Render the modal at the bottom of `ProjectEditor`'s JSX (before the closing `</div>`)**

Add this just before the final closing `</div>` of the editor's return:

```jsx
        {addSectionAfter !== null && (
          <window.AddSectionModal
            template={tpl}
            onClose={() => setAddSectionAfter(null)}
            onCreate={(newSection, opts) => {
              const insertAt = addSectionAfter + 1;
              setSections(prev => {
                const next = prev.slice();
                next.splice(insertAt, 0, newSection);
                return next;
              });
              setSectionValues(prev => ({ ...prev, [newSection.id]: {} }));
              setFlowStep(insertAt + 1);
              if (opts.saveAsDefault && tpl) {
                window.WODEN.applySectionDefaultToTemplate(tpl, newSection);
                window.toast && window.toast('Saved as default — affects new projects');
              }
              setAddSectionAfter(null);
            }}
          />
        )}
```

- [ ] **Step 4: Verify in browser**

Reload, open a project. Expected:
- Hover the wizard strip — small dashed `+` slots appear between every pair of pills, before the first, and before Brand. None between Brand and Team or after Team.
- Click `+` between sections 3 and 4 → modal opens. Type "Competitive Landscape" → Add section. Wizard now has 15 sections; new pill appears at position 4; editor jumps to it; section card shows "No fields in this section yet."
- Click `+` again at end → add another → shows up before Brand.

- [ ] **Step 5: Commit**

```bash
git add components/form-builder.jsx components/editor-customize.jsx
git commit -m "feat(editor): insert custom sections via + slots between wizard pills"
```

---

### Task 13: Build `<SectionMetaModal>` and metadata chip in section header

**Files:**
- Modify: `components/form-builder.jsx` (add `SectionMetaModal`)
- Modify: `components/editor-customize.jsx` (chip + state)

- [ ] **Step 1: Add `SectionMetaModal` to `form-builder.jsx`**

```jsx
function SectionMetaModal({ section, onSave, onClose }) {
  const [text, setText] = useStateFB(section.metadata || '');
  return (
    <div className="fixed inset-0 bg-black/45 z-[200] grid place-items-center p-3" onClick={onClose}>
      <div className="bg-base border border-light-gray rounded-[24px] w-[480px] max-w-[calc(100vw-24px)] p-5 sm:p-8 shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-bold">Section metadata</h3>
          <window.Button variant="ghost" size="sm" onClick={onClose}>✕</window.Button>
        </div>
        <div className="flex flex-col gap-1.5 mb-2">
          <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">AI hint (optional)</label>
          <textarea
            className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
            rows={5}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Used as context for AI assists in this section."
          />
          <p className="text-ink-soft text-xs mt-1 m-0">Stored on the section. Exported in the JSON envelope.</p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <window.Button variant="ghost" onClick={onClose}>Cancel</window.Button>
          <window.Button variant="primary" onClick={() => onSave(text)}>Save</window.Button>
        </div>
      </div>
    </div>
  );
}
```

Update export:
```jsx
Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm, FieldConfigModal, AddSectionModal, SectionMetaModal });
```

- [ ] **Step 2: Wire metadata chip into the section card in `editor-customize.jsx`**

Replace the section-step Card body. Locate the current Card (post-Task 6 wiring) and replace its inner contents with:

```jsx
              <Card pad="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-ink-faint">Section {String(flowStep).padStart(2, '0')}</div>
                    <h2 className="text-2xl font-bold mt-1">{sections[flowStep - 1].title}</h2>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMetaFor(sections[flowStep - 1].id)}
                      className={`text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${sections[flowStep - 1].metadata ? 'border-primary text-secondary bg-primary-bg-subtle' : 'border-dashed border-light-gray text-ink-faint hover:text-contrast hover:border-contrast'} transition-colors`}
                    >
                      {sections[flowStep - 1].metadata
                        ? `Metadata: "${sections[flowStep - 1].metadata.slice(0, 30)}${sections[flowStep - 1].metadata.length > 30 ? '…' : ''}" ✎`
                        : '+ Add metadata'}
                    </button>
                    {sections[flowStep - 1].origin === 'custom' && (
                      <button
                        type="button"
                        onClick={() => {
                          const sec = sections[flowStep - 1];
                          const filled = Object.keys((sectionValues[sec.id] || {})).length;
                          if (!window.confirm(`Delete section "${sec.title}"? ${filled ? `${filled} filled fields will be lost.` : 'It has no filled fields yet.'}`)) return;
                          setSections(prev => prev.filter((_, i) => i !== flowStep - 1));
                          setSectionValues(prev => { const n = { ...prev }; delete n[sec.id]; return n; });
                          setFlowStep(Math.max(1, flowStep - 1));
                        }}
                        className="text-[11px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border border-light-gray text-ink-faint hover:text-contrast hover:border-contrast transition-colors"
                      >🗑 Delete section</button>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  <window.SectionForm
                    section={sections[flowStep - 1]}
                    values={sectionValues[sections[flowStep - 1].id] || {}}
                    template={tpl}
                    onValueChange={(fieldId, v, opts) => {
                      const sid = sections[flowStep - 1].id;
                      setSectionValues(prev => {
                        const next = { ...prev, [sid]: { ...(prev[sid] || {}) } };
                        if (opts && opts.drop) delete next[sid][fieldId];
                        else next[sid][fieldId] = v;
                        return next;
                      });
                    }}
                    onSectionChange={(updated) => {
                      setSections(prev => prev.map((s, i) => i === flowStep - 1 ? updated : s));
                    }}
                    onSaveFieldDefault={(field) => {
                      if (!tpl) return;
                      window.WODEN.applyFieldDefaultToTemplate(tpl, sections[flowStep - 1].templateKey, field);
                      window.toast && window.toast('Saved as default — affects new projects');
                    }}
                  />
                </div>
              </Card>
```

Add the `metaFor` state alongside other useState hooks in `ProjectEditor`:

```jsx
  const [metaFor, setMetaFor] = useStateE(null); // section id whose metadata is being edited
```

And render the modal near `<window.AddSectionModal>`:

```jsx
        {metaFor && (() => {
          const sec = sections.find(s => s.id === metaFor);
          if (!sec) return null;
          return (
            <window.SectionMetaModal
              section={sec}
              onClose={() => setMetaFor(null)}
              onSave={(text) => {
                setSections(prev => prev.map(s => s.id === metaFor ? { ...s, metadata: text } : s));
                setMetaFor(null);
              }}
            />
          );
        })()}
```

- [ ] **Step 3: Verify in browser**

Reload, open a project, walk through:
- On any section card: chip "+ Add metadata" appears next to title.
- Click it → modal → enter "Audience: technical buyers, plain-spoken." → Save. Chip now shows `Metadata: "Audience: technical buyers, p…" ✎`.
- Re-click → modal pre-filled. Clear text → Save. Chip returns to "+ Add metadata".
- For a custom section (created in Task 12): "🗑 Delete section" button appears. Click → confirm → section removed; flowStep moves to previous.
- For a template-origin section: no delete button.

- [ ] **Step 4: Commit**

```bash
git add components/form-builder.jsx components/editor-customize.jsx
git commit -m "feat(editor): section metadata modal + delete custom sections"
```

---

## Phase 5 — Save-as-default for editing template-origin sections (incremental)

### Task 14: When editing a template-origin field with `saveAsDefault`, replace template field default

**Files:**
- Modify: `components/editor-customize.jsx` (extend `onSaveFieldDefault` already present from Task 11)

- [ ] **Step 1: Verify and extend the existing `onSaveFieldDefault` handler**

`window.WODEN.applyFieldDefaultToTemplate` (Task 3) already upserts by `templateFieldKey`. The handler from Task 11 already calls it. The only gap: in **edit mode**, the field must carry `templateFieldKey` for the upsert to match. Newly-created fields don't have one — make sure the existing field carries the key it was seeded with.

In `components/form-builder.jsx`, inside `FieldConfigModal`'s `submit()`, ensure edit mode preserves `templateFieldKey`:

```jsx
    const field = isEdit
      ? { ...initialField, label: labelRequired ? label.trim() : (label.trim() || tDef.label), config }
      : { ...createDefaultField(type), label: labelRequired ? label.trim() : (label.trim() || tDef.label), config };
```

Already does `...initialField` spread, which preserves `templateFieldKey`. ✓ No code change needed; this step is verification only.

- [ ] **Step 2: Verify in browser**

Reload, open a project → Cover. Click ✎ on "Client name". Change label to "Brand name". Check "Save as default for IT Company template" (or whichever template the project uses). Save.

In console:
```js
const tpl = window.WODEN.TEMPLATES.find(t => t.id === window.WODEN.PROJECTS[0].templateId);
const cover = tpl.defaultSections.find(s => s.templateKey === 'cover');
console.log(cover.fields.find(f => f.templateFieldKey === 'clientName'));
```

Expected: object with `label: 'Brand name'`. (Other templates' `cover.fields` are unaffected because all four templates point to the **same** `DEFAULT_SECTIONS` reference — so this update propagates to all 4 in v1. Note this in the toast wording or accept as designed shared-default behaviour. For v1 this is acceptable.)

- [ ] **Step 3: Commit (no code change)**

If no code was modified in Step 1 (verification only), skip the commit. Otherwise:
```bash
git add components/form-builder.jsx
git commit -m "chore(form-builder): preserve templateFieldKey in field edit"
```

---

## Phase 6 — Export

### Task 15: Build `<ExportModal>` with JSON preview, Copy, and Download

**Files:**
- Modify: `components/form-builder.jsx`

- [ ] **Step 1: Add `ExportModal`**

```jsx
function ExportModal({ payload, project, onClose }) {
  const json = useMemoFB(() => JSON.stringify(payload, null, 2), [payload]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      window.toast && window.toast('JSON copied to clipboard');
    } catch (e) {
      window.toast && window.toast('Copy failed — select text manually');
    }
  };
  const download = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = (project?.name || 'storyguide').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storyguide';
    a.href = url;
    a.download = `${slug}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <div className="fixed inset-0 bg-black/45 z-[200] grid place-items-center p-3" onClick={onClose}>
      <div className="bg-base border border-light-gray rounded-[24px] w-[720px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] flex flex-col p-5 sm:p-8 shadow-lg" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-bold">Story Guide ready</h3>
          <window.Button variant="ghost" size="sm" onClick={onClose}>✕</window.Button>
        </div>
        <p className="text-ink-soft text-sm mb-3">Your Story Guide is ready as JSON. Copy it or download a file.</p>
        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-light-gray bg-paper-warm p-3 mb-4">
          <pre className="text-[12px] font-mono whitespace-pre-wrap break-all m-0">{json}</pre>
        </div>
        <div className="flex justify-end gap-2">
          <window.Button variant="ghost" onClick={onClose}>Close</window.Button>
          <window.Button variant="ghost" onClick={download}>Download .json</window.Button>
          <window.Button variant="primary" onClick={copy}>Copy JSON</window.Button>
        </div>
      </div>
    </div>
  );
}
```

Update export:
```jsx
Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm, FieldConfigModal, AddSectionModal, SectionMetaModal, ExportModal });
```

- [ ] **Step 2: Commit**

```bash
git add components/form-builder.jsx
git commit -m "feat(form-builder): ExportModal with copy and download"
```

---

### Task 16: Wire `Generate Story Guide` to build payload and open `<ExportModal>`

**Files:**
- Modify: `components/editor-customize.jsx` (`generate` function + render slot)

- [ ] **Step 1: Add export state**

In `ProjectEditor`, add:

```jsx
  const [exportPayload, setExportPayload] = useStateE(null);
```

Replace the existing `generate` with:

```jsx
  const generate = () => {
    persist();
    project.status = 'review';
    const payload = window.WODEN.buildExport(project, tpl);
    setExportPayload(payload);
    window.toast && window.toast('Story Guide generated ✓');
  };
```

(The original `nav(backRoute)` is removed — user closes the modal manually.)

- [ ] **Step 2: Render the modal near other modals**

Add near `<window.AddSectionModal>` block:

```jsx
        {exportPayload && (
          <window.ExportModal
            payload={exportPayload}
            project={project}
            onClose={() => setExportPayload(null)}
          />
        )}
```

- [ ] **Step 3: Verify in browser**

Reload, open a project. Fill a few fields. Walk to Team step. Click "Generate Story Guide ✓". Expected:
- Toast "Story Guide generated ✓".
- ExportModal opens showing JSON. JSON should include: `schemaVersion: 1`, sections with inlined `value`s for the fields you typed into, brand palette/fonts/logo, team emails.
- Click "Copy JSON" → toast "JSON copied to clipboard". Paste into a text editor — confirm it matches.
- Click "Download .json" → file `<slug>.json` downloads.
- Close modal → editor returns to last step.

- [ ] **Step 4: Commit**

```bash
git add components/editor-customize.jsx
git commit -m "feat(editor): Generate button opens ExportModal with JSON envelope"
```

---

## Phase 7 — Cleanup and full smoke

### Task 17: Final cleanup and smoke test

**Files:**
- Modify: `components/editor-customize.jsx` (remove dead state if any remains)

- [ ] **Step 1: Audit `editor-customize.jsx` for dead state**

Check for and remove any leftover references to:
- `[content, setContent]` — should already be removed in Task 4.
- `aiAutofillFromContent`, `runAiAutofill`, `aiBusy`, `setAiBusy` — only used by the commented-out auto-fill card; remove if no live caller remains.
- `PALETTES` constant — was only used by the AI auto-fill recommendation. Remove if `runAiAutofill` is removed.

If any of these are still present and unreferenced, delete them.

- [ ] **Step 2: Full smoke test across roles**

Run `python3 -m http.server 8080`. For each role (admin / manager / client), log in via `RoleSwitcher`, open a project, and verify:

**Section editing:**
- All 14 default sections render.
- Each renderable type (text, number, image, table, list, divider, quote) works:
  - In console pre-add (or via "+ Add field" UI) one field of each remaining type into Cover.
  - Type into each, navigate forward and back; values persist.

**Field operations:**
- Reorder via ↑/↓.
- Edit changes label and config.
- Delete with confirm purges value.

**Section operations:**
- Insert custom section between any two pills via `+` slot.
- Add metadata to a section; chip updates.
- Delete custom section with confirm.
- Template-origin section has no delete affordance.

**Save-as-default:**
- Add a section with checkbox checked; in console verify `tpl.defaultSections` has the new entry.
- Add a field with checkbox; verify appended to the matching `defaultSections[i].fields`.
- Edit a template-origin field with checkbox; verify it replaces by `templateFieldKey`.

**Export:**
- Generate Story Guide → modal shows JSON with sections, brand, team. Copy works. Download works.

**Visual parity:**
- Wizard pills have same colour states (active/done/default) as before.
- Section card matches old layout (header + form + Tip block — leave Tip block as-is from existing code).
- Brand step and Team step unchanged.

- [ ] **Step 3: Commit any cleanup**

```bash
git add components/editor-customize.jsx
git commit -m "chore(editor): remove dead AI auto-fill state and palette consts"
```

(Skip commit if nothing was removed.)

---

## Self-review checklist

Spec coverage map (each spec section → task that covers it):

- §1 Overview → entire plan
- §2 Goals/Non-goals → §2 in plan; non-goals enforced by absence of tasks
- §3 Data model → Tasks 2, 3, 4
- §4 Field type registry → Tasks 1, 5, 7, 8, 9
- §5 Module layout → Tasks 1, 2, 3, 4
- §6 UI flows
  - A Insert section → Task 12
  - B Section metadata → Task 13
  - C Add field → Tasks 10, 11
  - D Edit/delete/reorder → Task 11
  - E Delete section → Task 13
  - F Save-as-default → Tasks 11, 12, 14
  - G Generate / Export → Tasks 15, 16
  - H Visual fidelity → enforced through reusing existing classes; verified in Task 17
- §7 Output JSON → Task 3 (`buildExport`) + Task 16 (UI)
- §8 Resolved decisions → reflected throughout
- §9 Risks → mitigations baked into tasks (e.g., 640px wide modal in Task 10, fallback `newId` in Task 1)
- §10 Out of scope → no tasks for these

Type/method consistency check:
- `ensureProjectSections(project, template)` — defined Task 3, called Task 4. ✓
- `applySectionDefaultToTemplate(template, section)` — Task 3, called Task 12. ✓
- `applyFieldDefaultToTemplate(template, sectionTemplateKey, field)` — Task 3, called Task 11 + verified Task 14. ✓
- `buildExport(project, template)` — Task 3, called Task 16. ✓
- `FIELD_TYPES[type].defaultValue()` — Task 1 (functions, not values), called Task 11. ✓
- `<window.SectionForm>` props (`section, values, onValueChange, onSectionChange, onSaveFieldDefault, template`) — defined Task 11, used Task 13. ✓

No placeholders. No "TBD"/"TODO". Every code-touching step has a code block.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-08-form-builder.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach?
