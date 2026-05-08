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

// ── FieldRenderer ────────────────────────────────────────────────────────
// Single component that switches over field.type. Other types added in later tasks.
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
  if (field.type === 'divider') {
    return <hr className="border-0 border-t border-light-gray my-2" />;
  }
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
  if (field.type === 'table') {
    const cfg = field.config || {};
    const cols = Array.isArray(cfg.columns) ? cfg.columns : [];
    const rows = Math.max(1, cfg.rows || 1);
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
  return (
    <div className="text-ink-faint text-sm font-mono">[{field.type}] field renderer not yet implemented.</div>
  );
}

// ── SectionForm ──────────────────────────────────────────────────────────
// Renders all fields with hover-toolbar (↑↓ ✎ 🗑) + "+ Add field" button.
// Field create/edit goes through FieldConfigModal.
function SectionForm({ section, values, onValueChange, onSectionChange, onSaveFieldDefault, template }) {
  const [editing, setEditing] = useStateFB(null); // field id being edited
  const [creating, setCreating] = useStateFB(false);

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
    onValueChange(f.id, undefined, { drop: true });
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
    if (idx < 0) { setEditing(null); return; }
    const updated = { ...section.fields[idx], label: field.label, config: field.config };
    const nextFields = section.fields.slice();
    nextFields[idx] = updated;
    onSectionChange({ ...section, fields: nextFields });
    if (opts.saveAsDefault && onSaveFieldDefault) onSaveFieldDefault(updated);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {section.fields.length === 0 && (
        <p className="text-ink-faint text-sm font-mono italic">No fields in this section yet.</p>
      )}
      {section.fields.map((f, idx) => (
        <div key={f.id} className="group relative border border-transparent hover:border-light-gray rounded-xl p-3 -m-3 transition-colors">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-base/80 backdrop-blur-sm rounded-md p-1">
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

// ── FieldConfigModal ─────────────────────────────────────────────────────
// Single modal for create + edit. mode='create' shows the type grid; 'edit' hides it.
function FieldConfigModal({ mode, initialField, sectionTemplateKey, template, onSave, onClose }) {
  const isEdit = mode === 'edit';
  const [type, setType] = useStateFB(initialField?.type || 'text');
  const [label, setLabel] = useStateFB(initialField?.label || '');
  const [config, setConfig] = useStateFB(
    initialField?.config ? JSON.parse(JSON.stringify(initialField.config)) : FIELD_TYPES[type].defaultConfig()
  );
  const [saveAsDefault, setSaveAsDefault] = useStateFB(false);

  // In create mode, reset config when type changes.
  useEffectFB(() => {
    if (!isEdit) setConfig(FIELD_TYPES[type].defaultConfig());
  }, [type, isEdit]);

  const tDef = FIELD_TYPES[type];
  const labelRequired = tDef.requiresLabel;
  const labelOk = !labelRequired || label.trim().length > 0;
  const wide = type === 'table';

  const submit = () => {
    if (!labelOk) { window.toast && window.toast('Label is required'); return; }
    const finalLabel = labelRequired ? label.trim() : (label.trim() || tDef.label);
    const field = isEdit
      ? { ...initialField, label: finalLabel, config }
      : { ...createDefaultField(type), label: finalLabel, config };
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
          {labelRequired ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-mono uppercase tracking-widest text-ink-faint">Label*</label>
              <input
                className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Mission"
              />
            </div>
          ) : (
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

// ── AddSectionModal ──────────────────────────────────────────────────────
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

// ── SectionMetaModal ─────────────────────────────────────────────────────
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
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <window.Button variant="ghost" onClick={onClose}>Cancel</window.Button>
          <window.Button variant="primary" onClick={() => onSave(text)}>Save</window.Button>
        </div>
      </div>
    </div>
  );
}

// ── ExportModal ──────────────────────────────────────────────────────────
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

Object.assign(window, { FIELD_TYPES, newId, createDefaultField, FieldRenderer, SectionForm, FieldConfigModal, AddSectionModal, SectionMetaModal, ExportModal });
