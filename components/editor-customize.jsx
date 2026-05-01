const { useState: useStateE, useRef: useRefE, useEffect: useEffectE } = React;

const TEMPLATE_DOCX_URL = './assets/docs/template.docx';

// Wait for `window.tinymce` and `window.mammoth` to become available.
// Both are loaded via <script> in index.html; this guards against init races.
function waitForGlobal(name, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (window[name]) return resolve(window[name]);
    const start = Date.now();
    const tick = () => {
      if (window[name]) return resolve(window[name]);
      if (Date.now() - start > timeoutMs) return reject(new Error(`${name} not loaded`));
      setTimeout(tick, 50);
    };
    tick();
  });
}

// Map common Word paragraph/run styles to semantic HTML+classes so we can
// re-style them in TinyMCE's content_style. Mammoth strips visual styling by
// design — this preserves at least the *named* styles from the .docx.
const MAMMOTH_STYLE_MAP = [
  "p[style-name='Title'] => h1.doc-title:fresh",
  "p[style-name='Subtitle'] => p.doc-subtitle:fresh",
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote.intense:fresh",
  "p[style-name='Caption'] => p.caption:fresh",
  "p[style-name='List Paragraph'] => p.list-paragraph:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => em.intense",
  "r[style-name='Subtle Emphasis'] => em.subtle",
  "r[style-name='Book Title'] => cite",
  "r[style-name='Code'] => code",
  "p[style-name='Code'] => pre:fresh",
];

// Scope every selector in a docx-preview <style> block under a wrapper class so
// the document's CSS doesn't bleed into TinyMCE's chrome / parent body styles.
function scopeDocxCss(css, scopeSelector) {
  if (!css) return '';
  // Naive but adequate: prefix each selector at the start of a rule. Skips @-rules.
  return css.replace(/(^|\})\s*([^@{}][^{}]*)\{/g, (m, brace, selectors) => {
    const scoped = selectors
      .split(',')
      .map((sel) => {
        const s = sel.trim();
        if (!s) return s;
        // Avoid scoping html/body — rewrite them to the wrapper instead.
        if (/^(html|body)\b/i.test(s)) return scopeSelector + s.replace(/^(html|body)/i, '');
        return `${scopeSelector} ${s}`;
      })
      .filter(Boolean)
      .join(', ');
    return `${brace} ${scoped} {`;
  });
}

async function loadTemplateDocxAsHtml() {
  const res = await fetch(TEMPLATE_DOCX_URL);
  if (!res.ok) throw new Error(`Template fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();

  // Preferred path: docx-preview renders the .docx with full visual fidelity
  // (inline styles + a <style> block with named-style classes).
  if (window.docx && typeof window.docx.renderAsync === 'function') {
    try {
      const htmlContainer = document.createElement('div');
      const styleContainer = document.createElement('div');
      await window.docx.renderAsync(buf, htmlContainer, styleContainer, {
        inWrapper: false,            // we handle our own wrapper class
        ignoreWidth: false,
        ignoreHeight: true,          // page height would clip content in the editor
        ignoreFonts: false,
        breakPages: false,           // no page breaks inside the editor
        ignoreLastRenderedPageBreak: true,
        experimental: true,          // enables tab/list improvements
        trimXmlDeclaration: true,
        useBase64URL: true,          // embed images as data: URLs
        renderHeaders: false,
        renderFooters: false,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      // Pull <style> contents out of the style container and scope them.
      const SCOPE = '.wdn-docx';
      const cssChunks = Array.from(styleContainer.querySelectorAll('style'))
        .map((s) => scopeDocxCss(s.textContent || '', SCOPE))
        .join('\n');

      // Embed the <style> block inside the returned HTML so the styling
      // survives a save/reload cycle (TinyMCE preserves it because of
      // extended_valid_elements: '*[*]'). The init-time head injection below
      // still runs as a belt-and-braces safeguard.
      const html =
        `<style data-docx="1">${cssChunks}</style>` +
        `<div class="wdn-docx">${htmlContainer.innerHTML}</div>`;
      return { html, css: cssChunks };
    } catch (err) {
      console.warn('[loadTemplateDocxAsHtml] docx-preview failed, falling back to mammoth:', err);
    }
  }

  // Fallback: mammoth. Strips visual styling by design but always works.
  const mammoth = await waitForGlobal('mammoth');
  const convertImage = mammoth.images.imgElement((image) =>
    image.read('base64').then((data) => ({
      src: `data:${image.contentType};base64,${data}`,
    })),
  );
  const result = await mammoth.convertToHtml({
    arrayBuffer: buf,
    styleMap: MAMMOTH_STYLE_MAP,
    convertImage,
    includeDefaultStyleMap: true,
  });
  return { html: result.value || '', css: '' };
}

function WYSIWYGEditor({ sectionN, title, content, onChange }) {
  const containerRef = useRefE(null);
  const editorRef = useRefE(null);
  const onChangeRef = useRefE(onChange);
  const initialContentRef = useRefE(content);
  const [loading, setLoading] = useStateE(true);

  // Keep latest onChange in a ref so the (one-shot) editor handlers always see it.
  useEffectE(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffectE(() => {
    let cancelled = false;
    const target = containerRef.current;
    if (!target) return;

    (async () => {
      try {
        const tinymce = await waitForGlobal('tinymce');
        if (cancelled) return;

        await tinymce.init({
          target,
          license_key: 'gpl',
          branding: false,
          promotion: false,
          statusbar: true,
          menubar: 'file edit view insert format tools table help',
          plugins: 'accordion advlist anchor autolink autoresize autosave charmap code codesample directionality emoticons fullscreen help image importcss insertdatetime link lists media nonbreaking pagebreak preview quickbars save searchreplace table visualblocks visualchars wordcount',
          toolbar1: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor removeformat',
          toolbar2: 'link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | blockquote codesample hr | searchreplace visualblocks code fullscreen preview help',
          toolbar_mode: 'sliding',
          quickbars_selection_toolbar: 'bold italic underline | quicklink h2 h3 blockquote',
          quickbars_insert_toolbar: 'quickimage quicktable',
          contextmenu: 'link image table',
          // Static-host friendly: paste images inline as base64 instead of uploading.
          automatic_uploads: false,
          paste_data_images: true,
          // Preserve as much Word/Office formatting as the GPL build allows.
          // (1:1 fidelity requires the premium PowerPaste plugin.)
          paste_as_text: false,
          paste_block_drop: false,
          paste_merge_formats: true,
          paste_webkit_styles: 'all',
          paste_remove_styles_if_webkit: false,
          // Allow any tag/attribute through TinyMCE's schema; we narrow CSS
          // properties via valid_styles below and clean Word junk in
          // paste_postprocess.
          extended_valid_elements: '*[*]',
          valid_children: '+body[style]',
          valid_styles: {
            '*':
              'color,background-color,background,font-family,font-size,font-weight,font-style,font-variant,' +
              'text-align,text-decoration,text-indent,text-transform,line-height,letter-spacing,' +
              'margin,margin-top,margin-right,margin-bottom,margin-left,' +
              'padding,padding-top,padding-right,padding-bottom,padding-left,' +
              'border,border-top,border-right,border-bottom,border-left,' +
              'border-color,border-style,border-width,border-collapse,border-spacing,' +
              'width,height,max-width,min-width,vertical-align,white-space,' +
              'list-style,list-style-type,list-style-position,' +
              'float,clear,display,' +
              // Word-specific properties we deliberately keep so list rendering survives.
              'mso-list,mso-level-number-format,mso-level-text,mso-level-tab-stop,' +
              'mso-pagination,mso-spacerun,mso-line-height-rule',
          },
          // Strip Word-specific noise (mso-* CSS, MsoNormal classes, <o:p>) on paste.
          paste_postprocess: (editor, args) => {
            const root = args.node;
            if (!root || !root.querySelectorAll) return;

            // Remove Word namespaced placeholder elements (<o:p>, <w:*>, <m:*>).
            Array.from(root.getElementsByTagName('*')).forEach((el) => {
              const tag = el.tagName ? el.tagName.toLowerCase() : '';
              if (tag.startsWith('o:') || tag.startsWith('w:') || tag.startsWith('m:')) {
                // Replace with its children to keep text content.
                const parent = el.parentNode;
                if (!parent) return;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
              }
            });

            // Strip noisy mso-* declarations but keep ones that drive list/page layout.
            // Without these, Word lists collapse into flat paragraphs.
            const KEEP_MSO_PROPS = /^mso-(list|level-|pagination|line-height-rule|spacerun)/i;
            root.querySelectorAll('[style]').forEach((el) => {
              const cleaned = (el.getAttribute('style') || '')
                .split(';')
                .map((s) => s.trim())
                .filter((s) => {
                  if (!s) return false;
                  if (/^tab-stops/i.test(s)) return false;
                  if (/^page-break-/i.test(s)) return false;
                  if (/^mso-/i.test(s)) return KEEP_MSO_PROPS.test(s);
                  return true;
                })
                .join('; ');
              if (cleaned) el.setAttribute('style', cleaned);
              else el.removeAttribute('style');
            });

            // Drop most Mso* classes but keep MsoListParagraph* — paired with the
            // mso-list style above to reconstruct Word's list indentation.
            const KEEP_MSO_CLASS = /^MsoListParagraph/i;
            root.querySelectorAll('[class]').forEach((el) => {
              const cls = (el.getAttribute('class') || '')
                .split(/\s+/)
                .filter((c) => c && (!/^Mso/i.test(c) || KEEP_MSO_CLASS.test(c)))
                .join(' ');
              if (cls) el.setAttribute('class', cls);
              else el.removeAttribute('class');
            });

            // Remove empty <span> wrappers Word loves to emit.
            root.querySelectorAll('span').forEach((el) => {
              if (!el.attributes.length && el.parentNode) {
                while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                el.parentNode.removeChild(el);
              }
            });
          },
          file_picker_types: 'image',
          file_picker_callback: (cb, value, meta) => {
            if (meta.filetype !== 'image') return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
              const file = input.files && input.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => cb(reader.result, { title: file.name });
              reader.readAsDataURL(file);
            };
            input.click();
          },
          image_caption: true,
          image_advtab: true,
          link_default_target: '_blank',
          link_assume_external_targets: true,
          table_default_attributes: { border: '1' },
          table_default_styles: { 'border-collapse': 'collapse', 'width': '100%' },
          table_class_list: [
            { title: 'None', value: '' },
            { title: 'Bordered', value: 'tbl-bordered' },
            { title: 'Striped', value: 'tbl-striped' },
          ],
          codesample_languages: [
            { text: 'HTML/XML', value: 'markup' },
            { text: 'JavaScript', value: 'javascript' },
            { text: 'CSS', value: 'css' },
            { text: 'TypeScript', value: 'typescript' },
            { text: 'JSON', value: 'json' },
            { text: 'Bash', value: 'bash' },
            { text: 'Python', value: 'python' },
          ],
          font_family_formats:
            "GT Pressura='GT Pressura', system-ui, sans-serif;" +
            "System='-apple-system', BlinkMacSystemFont, sans-serif;" +
            "Serif=Georgia, 'Times New Roman', serif;" +
            "Mono='SF Mono', Menlo, ui-monospace, monospace;" +
            // Common Word fonts — listed so pasted Word content keeps its family
            // name in the dropdown rather than silently falling back.
            "Calibri=Calibri, Candara, Segoe, 'Segoe UI', Optima, Arial, sans-serif;" +
            "Cambria=Cambria, Georgia, serif;" +
            "Times New Roman='Times New Roman', Times, serif;" +
            "Arial=Arial, Helvetica, sans-serif;" +
            "Helvetica=Helvetica, Arial, sans-serif;" +
            "Georgia=Georgia, serif;" +
            "Verdana=Verdana, Geneva, sans-serif;" +
            "Tahoma=Tahoma, Geneva, sans-serif;" +
            "Courier New='Courier New', Courier, monospace",
          font_size_formats: '11px 12px 13px 14px 16px 18px 20px 24px 32px 40px',
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Quote=blockquote; Code=pre',
          content_style: "body { font-family: 'GT Pressura', system-ui, -apple-system, sans-serif; font-size: 14px; color: #131215; line-height: 1.6; padding: 8px 12px; } table.tbl-bordered td, table.tbl-bordered th { border: 1px solid #BEBEBE; padding: 6px 8px; } table.tbl-striped tr:nth-child(even) { background: #F3F3F3; }",
          min_height: 520,
          autoresize_bottom_margin: 20,
          placeholder: `Write the ${title} section here…`,
          setup: (ed) => {
            editorRef.current = ed;
            // Pull any <style data-docx> blocks out of saved content and apply
            // them to the iframe head — required for subsequent reloads where
            // we go through this fast-path branch (no docx render).
            const reapplyDocxStyles = (htmlString) => {
              try {
                const matches = htmlString.match(/<style[^>]*data-docx[^>]*>([\s\S]*?)<\/style>/gi);
                if (!matches || !matches.length) return;
                const doc = ed.getDoc();
                if (!doc || !doc.head) return;
                matches.forEach((tag) => {
                  const css = tag.replace(/^<style[^>]*>/i, '').replace(/<\/style>$/i, '');
                  const styleEl = doc.createElement('style');
                  styleEl.setAttribute('data-source', 'docx-template');
                  styleEl.appendChild(doc.createTextNode(css));
                  doc.head.appendChild(styleEl);
                });
              } catch (e) {
                console.warn('[WYSIWYGEditor] failed to reapply docx css:', e);
              }
            };

            ed.on('init', async () => {
              if (cancelled) return;
              const initial = initialContentRef.current;
              if (initial && initial.trim()) {
                reapplyDocxStyles(initial);
                ed.setContent(initial);
                setLoading(false);
                return;
              }
              try {
                const { html, css } = await loadTemplateDocxAsHtml();
                if (cancelled) return;
                // Inject the document's own CSS into the editor iframe head so
                // classes like .docx-paragraph etc. resolve to their Word styles.
                if (css) {
                  try {
                    const doc = ed.getDoc();
                    if (doc && doc.head) {
                      const styleEl = doc.createElement('style');
                      styleEl.setAttribute('data-source', 'docx-template');
                      styleEl.appendChild(doc.createTextNode(css));
                      doc.head.appendChild(styleEl);
                    }
                  } catch (cssErr) {
                    console.warn('[WYSIWYGEditor] failed to inject docx css:', cssErr);
                  }
                }
                ed.setContent(html);
                onChangeRef.current && onChangeRef.current(html);
                if (typeof toast === 'function') toast('Template loaded from Word ✓');
              } catch (err) {
                console.warn('[WYSIWYGEditor] template load failed:', err);
                if (typeof toast === 'function') toast('Could not load Word template');
              } finally {
                if (!cancelled) setLoading(false);
              }
            });
            ed.on('input change keyup undo redo SetContent', () => {
              const fn = onChangeRef.current;
              if (fn) fn(ed.getContent());
            });
          },
        });
      } catch (err) {
        console.warn('[WYSIWYGEditor] TinyMCE init failed:', err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      const ed = editorRef.current;
      if (ed) {
        try { ed.destroy(); } catch (e) { /* ignore */ }
        editorRef.current = null;
      }
    };
  }, []);

  return (
      <div className="flex flex-col flex-1 relative">
        {loading && (
            <div className="px-4 py-2.5 text-[11px] font-mono text-ink-faint border-b-[1.5px] border-light-gray bg-paper-warm">
              Loading editor…
            </div>
        )}
        <textarea ref={containerRef} defaultValue={content} />
      </div>
  );
}

const PALETTES = [
  { id: 'espresso', name: 'Espresso',  colors: ['#3B2A1F', '#E8D5B7', '#D4572A', '#F7F1E5'] },
  { id: 'slate',    name: 'Slate',     colors: ['#1C2B3A', '#C8D8E8', '#3A7CA5', '#F4F7FA'] },
  { id: 'forest',   name: 'Forest',    colors: ['#1A3A2A', '#B8D8C8', '#2D7A4F', '#F2F7F4'] },
  { id: 'dusk',     name: 'Dusk',      colors: ['#2D1B4E', '#D4C8F0', '#7C4DBC', '#F7F4FD'] },
  { id: 'clay',     name: 'Clay',      colors: ['#3D2B1A', '#F0DDD0', '#C0622A', '#FDF6F2'] },
  { id: 'minimal',  name: 'Minimal',   colors: ['#131215', '#EAEAEA', '#EA3323', '#FFFFFF'] },
];

function aiAutofillFromContent({ content, project, template }) {
  const text = (content || '').toLowerCase();
  const words = (content || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const firstSentence = (content || '').match(/[^.!?\n]+[.!?]/);
  const description = firstSentence
      ? firstSentence[0].trim().slice(0, 220)
      : (wordCount > 0 ? words.slice(0, 24).join(' ') + (wordCount > 24 ? '…' : '') : `${project.name} — strategic narrative draft.`);

  const cat = template?.category || '';
  let paletteId = cat === 'it' ? 'slate'
      : cat === 'manufacturing' ? 'clay'
      : cat === 'management' ? 'minimal'
      : cat === 'consumer' ? 'espresso'
      : 'forest';
  if (/forest|green|sustain|nature|organic/.test(text)) paletteId = 'forest';
  if (/luxury|premium|craft|night|elegant/.test(text)) paletteId = 'dusk';
  if (/coffee|food|warm|artisan|hand/.test(text)) paletteId = 'espresso';
  if (/tech|saas|platform|software|api|cloud/.test(text)) paletteId = 'slate';
  if (/industrial|factory|manufactur|machin/.test(text)) paletteId = 'clay';

  const promptHints = [];
  if (/saas|platform|software|api|cloud|developer/.test(text)) promptHints.push('Audience: technical buyers in software organisations. Avoid marketing fluff. Lean on plain-spoken precision.');
  if (/enterprise|compliance|audit|governance|regulat/.test(text)) promptHints.push('Emphasise governance, audit trails, and predictability. Buyer is risk-aware.');
  if (/coffee|food|consumer|lifestyle|community/.test(text)) promptHints.push('Audience: everyday consumers. Use warm, approachable language; lean on values and identity.');
  if (/industrial|manufactur|operations|supply chain|fasten|connector/.test(text)) promptHints.push('Audience: operations leaders. Emphasise precision, reliability, and total operational perspective.');
  if (/sustain|carbon|green|ethical/.test(text)) promptHints.push('Sustainability is a load-bearing theme — surface it without greenwashing.');
  if (promptHints.length === 0) promptHints.push(`Tone: confident, plain-spoken. Audience inferred from a ${wordCount}-word brief.`);
  if (template) promptHints.push(`Template context — ${template.name}: ${template.description}`);
  const preprompt = promptHints.join('\n\n');

  return { description, paletteId, preprompt };
}

function ProjectEditor({ nav, projectId, role = 'manager' }) {
  const project = window.WODEN.PROJECTS.find(p => p.id === projectId);
  const backRoute = role === 'admin' ? '/admin/projects'
      : role === 'client' ? '/client'
      : '/manager/projects';

  if (!project) {
    return (
        <div className="animate-screen-in text-center py-16">
          <p className="text-ink-soft mb-4">Project not found.</p>
          <Button variant="primary" onClick={() => nav(backRoute)}>Back to projects</Button>
        </div>
    );
  }

  const isClient = role === 'client';
  const canManageTeam = role === 'client' || role === 'admin' || role === 'manager';
  const lastStep = 3;

  const [flowStep, setFlowStep] = useStateE(1);
  const [content, setContent] = useStateE(project.content || '');
  const [brandColors, setBrandColors] = useStateE(() => {
    if (Array.isArray(project.palette) && project.palette.length) {
      // New format: array of {hex, role} objects
      if (project.palette[0] && typeof project.palette[0] === 'object' && project.palette[0].hex) {
        return project.palette;
      }
      // Legacy format: flat array of hex strings — migrate to named roles
      const defaultRoles = ['primary', 'secondary', 'accent', 'background'];
      return project.palette.map((hex, i) => ({ hex, role: defaultRoles[i] || 'custom' }));
    }
    return [
      { hex: '#131215', role: 'primary' },
      { hex: '#FFFFFF', role: 'background' },
    ];
  });
  const [description, setDescription] = useStateE(project.description || '');
  const [logo, setLogo] = useStateE(project.logo || null);
  const [team, setTeam] = useStateE(Array.isArray(project.team) ? [...project.team] : []);
  const [inviteEmail, setInviteEmail] = useStateE('');
  const [aiBusy, setAiBusy] = useStateE(false);
  const fileRef = useRefE(null);

  const cos = window.WODEN.getProjectClients(project);
  const tpl = window.WODEN.getProjectTemplate(project);

  const persist = () => {
    project.content = content;
    project.description = description;
    project.logo = logo;
    project.palette = brandColors;
    project.team = team;
    project.updated = 'just now';
  };

  const saveDraft = () => { persist(); toast('Draft saved'); };
  const generate = () => { persist(); project.status = 'review'; toast('Project generated ✓'); nav(backRoute); };

  const onLogoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast('Logo must be under 2MB');
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const runAiAutofill = () => {
    if (aiBusy) return;
    setAiBusy(true);
    setTimeout(() => {
      const out = aiAutofillFromContent({ content, project, template: tpl });
      setDescription(out.description);
      if (PALETTES.find(p => p.id === out.paletteId)) setPalette(out.paletteId);
      setAiBusy(false);
      toast('Auto-filled from project content ✨');
    }, 600 + Math.random() * 500);
  };

  const addTeamMember = () => {
    const v = inviteEmail.trim().toLowerCase();
    if (!v) return;
    if (!/.+@.+\..+/.test(v)) return toast('Enter a valid email');
    if (team.includes(v)) return toast('Already on the team');
    const updated = [...team, v];
    setTeam(updated); project.team = updated; project.updated = 'just now';
    setInviteEmail('');
    toast('Member added');
  };
  const removeTeamMember = (em) => {
    const updated = team.filter(t => t !== em);
    setTeam(updated); project.team = updated; project.updated = 'just now';
    toast('Member removed');
  };

  const goStep = (n) => { persist(); setFlowStep(n); };

  const StepBtn = ({ n, label }) => (
      <button type="button" onClick={() => goStep(n)} className={`group flex items-center gap-2 text-[13px] font-medium rounded-full pr-2 pl-1 py-0.5 transition-colors hover:bg-super-light-gray ${flowStep >= n ? 'text-contrast' : 'text-ink-faint'}`} aria-label={`Go to step ${n}`}>
        <span className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold font-mono transition-all ${flowStep >= n ? 'bg-contrast border-contrast text-base' : 'border-ink-faint'}`}>{n}</span>
        <span className={flowStep === n ? 'underline underline-offset-4 decoration-2' : ''}>{label}</span>
      </button>
  );

  return (
      <div className="animate-screen-in">
        <div className="flex mb-2">
          <a className="font-mono text-ink-soft text-[11px] cursor-pointer hover:underline" onClick={() => flowStep > 1 ? goStep(flowStep - 1) : nav(backRoute)}>← {flowStep > 1 ? 'BACK' : 'PROJECTS'}</a>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {tpl && <Badge>{tpl.category}</Badge>}
              <Badge variant={project.status === 'published' ? 'accent' : project.status === 'review' ? 'soft' : 'default'}>{project.status}</Badge>
            </div>
            <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">{project.name}</h1>
            <div className="font-mono text-[11px] text-ink-soft mt-1.5 flex flex-wrap gap-1">
              {cos.length > 0
                  ? cos.map((c, i) => <span key={c.id} className="inline-block">{c.name}{i < cos.length - 1 ? ' ·' : ''}</span>)
                  : <span className="text-ink-faint italic">no client linked</span>}
            </div>
            <div className="flex items-center mt-3 flex-wrap gap-y-2">
              <StepBtn n={1} label="Content" />
              <div className="w-8 h-[1.5px] bg-light-gray mx-2" />
              <StepBtn n={2} label="Brand" />
              <div className="w-8 h-[1.5px] bg-light-gray mx-2" />
              <StepBtn n={3} label="Team" />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => { persist(); nav('/preview/' + project.id); }}>Preview</Button>
            {flowStep === 1 && <><Button variant="ghost" size="sm" onClick={saveDraft}>Save draft</Button><Button variant="primary" onClick={() => goStep(2)}>Next step →</Button></>}
            {flowStep === 2 && <>
              <Button variant="ghost" onClick={() => goStep(1)}>← Back</Button>
              <Button variant="primary" onClick={() => goStep(3)}>Next step →</Button>
            </>}
            {flowStep === 3 && <>
              <Button variant="ghost" onClick={() => goStep(2)}>← Back</Button>
              <Button variant="primary" onClick={generate}>{isClient ? 'Save Story Guide' : 'Generate Story Guide ✓'}</Button>
            </>}
          </div>
        </div>

        {flowStep === 1 && <Card pad="p-0" className="overflow-hidden flex flex-col"><WYSIWYGEditor title="StoryGuide" content={content} onChange={setContent} /></Card>}
        {flowStep === 2 && (
            <div className="flex flex-col gap-6 max-w-[720px]">
              {/*<Card pad="p-5 sm:p-6" className="bg-paper-warm border-primary/30">*/}
              {/*  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">*/}
              {/*    <div className="flex-1 min-w-0">*/}
              {/*      <h3 className="text-base font-bold mb-0.5 flex items-center gap-2"><span aria-hidden>✨</span>Auto-fill with AI</h3>*/}
              {/*      <p className="text-ink-soft text-[12.5px] leading-snug m-0">Generate description, palette, and pre-prompt from your Step 1 content. You can edit the result.</p>*/}
              {/*    </div>*/}
              {/*    <Button variant="primary" size="sm" onClick={runAiAutofill} className={aiBusy ? 'opacity-70 pointer-events-none' : ''}>*/}
              {/*      {aiBusy*/}
              {/*          ? <><span className="inline-flex gap-1 items-center"><span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce-dots_1s_infinite]"/><span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce-dots_1s_infinite_0.15s]"/><span className="w-1.5 h-1.5 rounded-full bg-current animate-[bounce-dots_1s_infinite_0.3s]"/></span>Thinking</>*/}
              {/*          : <>Auto-fill ✨</>}*/}
              {/*    </Button>*/}
              {/*  </div>*/}
              {/*  {!content.trim() && <p className="font-mono text-[10px] text-ink-faint mt-2.5">Step 1 is empty — fill in some content first for richer suggestions.</p>}*/}
              {/*</Card>*/}

              <Card pad="p-5 sm:p-7">
                <h3 className="text-lg font-bold mb-1">Project description</h3>
                <p className="text-ink-soft text-[13px] mb-3.5">A short note on what this StoryGuide is for.</p>
                <textarea className="w-full px-3.5 py-2.5 border border-gray rounded-lg bg-base text-contrast text-sm focus:outline-none focus:border-primary focus:shadow-focus" rows={3} placeholder="e.g. Brand voice refresh ahead of Q3 launch…" value={description} onChange={e => setDescription(e.target.value)} />
              </Card>

              <Card pad="p-5 sm:p-7">
                <h3 className="text-lg font-bold mb-1">Brand palette</h3>
                <p className="text-ink-soft text-[13px] mb-5">Define the colours that make up this client's identity.</p>

                {/* Preview strip */}
                {brandColors.length > 0 && (
                    <div className="flex rounded-xl overflow-hidden mb-6 h-12 border border-light-gray shadow-sm">
                      {brandColors.map((c, i) => (
                          <div key={i} className="flex-1 transition-all" style={{background: c.hex}} title={`${c.role}: ${c.hex}`} />
                      ))}
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                  {brandColors.map((color, idx) => (
                      <div key={idx} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-light-gray bg-base hover:border-ink-faint transition-colors">
                        {/* Colour swatch + native picker */}
                        <label className="relative shrink-0 cursor-pointer" title="Pick colour">
                          <div className="w-8 h-8 rounded-lg border border-black/10 shadow-sm transition-transform group-hover:scale-105" style={{background: color.hex}} />
                          <input type="color" value={color.hex} onChange={e => {
                            const updated = [...brandColors];
                            updated[idx] = { ...updated[idx], hex: e.target.value };
                            setBrandColors(updated);
                          }} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                        </label>

                        {/* Hex text input */}
                        <input
                            type="text"
                            value={color.hex}
                            maxLength={7}
                            onChange={e => {
                              const v = e.target.value;
                              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                                const updated = [...brandColors];
                                updated[idx] = { ...updated[idx], hex: v };
                                setBrandColors(updated);
                              }
                            }}
                            className="w-[6.5rem] px-2 py-1 rounded-md bg-super-light-gray text-contrast text-[12px] font-mono tracking-wide border-0 focus:outline-none focus:ring-1 focus:ring-primary"
                        />

                        {/* Role badge / dropdown */}
                        <select
                            value={color.role}
                            onChange={e => {
                              const updated = [...brandColors];
                              updated[idx] = { ...updated[idx], role: e.target.value };
                              setBrandColors(updated);
                            }}
                            className="flex-1 px-2 py-1 rounded-md bg-super-light-gray text-contrast text-[12px] font-medium border-0 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                        >
                          <option value="primary">Primary</option>
                          <option value="secondary">Secondary</option>
                          <option value="accent">Accent</option>
                          <option value="background">Background</option>
                          <option value="surface">Surface</option>
                          <option value="text">Text</option>
                          <option value="border">Border</option>
                          <option value="custom">Custom</option>
                        </select>

                        {/* Remove — only visible on hover */}
                        <button
                            type="button"
                            onClick={() => setBrandColors(brandColors.filter((_, i) => i !== idx))}
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-ink-faint hover:text-contrast hover:bg-light-gray transition-all text-base leading-none shrink-0 ${brandColors.length > 1 ? 'opacity-0 group-hover:opacity-100' : 'invisible'}`}
                            aria-label="Remove colour"
                        >×</button>
                      </div>
                  ))}
                </div>

                <button
                    type="button"
                    onClick={() => setBrandColors([...brandColors, { hex: '#8B8B8B', role: 'custom' }])}
                    className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-light-gray text-[12px] font-medium text-ink-soft hover:text-contrast hover:border-ink-faint transition-colors w-full justify-center"
                >
                  <span className="text-base leading-none">+</span>
                  Add colour
                </button>
              </Card>

              <Card pad="p-5 sm:p-7">
                <h3 className="text-lg font-bold mb-1">Logo</h3>
                <p className="text-ink-soft text-[13px] mb-3.5">SVG / PNG / JPG, up to 2MB. Used in StoryGuide previews and exports.</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-20 h-20 rounded-xl border border-light-gray bg-paper-warm flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? <img src={logo} alt="Logo preview" className="max-w-full max-h-full object-contain" /> : <span className="text-ink-faint font-mono text-[10px] uppercase">No logo</span>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogoFile} />
                  <Button size="sm" variant="ghost" onClick={() => fileRef.current && fileRef.current.click()}>{logo ? 'Replace' : 'Upload logo'}</Button>
                  {logo && <Button size="sm" variant="ghost" onClick={() => setLogo(null)}>Remove</Button>}
                </div>
              </Card>
            </div>
        )}

        {flowStep === 3 && (
            <div className="flex flex-col gap-6 max-w-[860px]">
              <Card pad="p-5 sm:p-7">
                <div className="flex justify-between items-start gap-3 flex-wrap mb-3">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Assigned employees</h3>
                    <p className="text-ink-soft text-[13px] m-0">{canManageTeam ? "Add colleagues who should be able to preview this StoryGuide. They'll see it as read-only." : 'Employees assigned to this project.'}</p>
                  </div>
                  <Badge>{team.length} member{team.length === 1 ? '' : 's'}</Badge>
                </div>

                {canManageTeam && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
                      <Input placeholder="name@company.co" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTeamMember()} className="flex-1" />
                      <Button variant="primary" onClick={addTeamMember}>Add to project</Button>
                    </div>
                )}

                {team.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-light-gray rounded-lg">
                      <p className="text-ink-faint font-mono text-[11px] uppercase tracking-wider mb-1">No employees yet</p>
                      <p className="text-ink-soft text-[13px] m-0">{canManageTeam ? 'Add an email above to assign your first team member.' : 'No employees have been assigned yet.'}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                      {team.map((em, i) => (
                          <div key={em} className="flex items-center gap-3 p-2.5 border border-light-gray rounded-lg flex-wrap sm:flex-nowrap hover:border-contrast transition-colors">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{em[0].toUpperCase()}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold truncate">{em.split('@')[0]}</div>
                              <div className="font-mono text-ink-soft text-[11px] truncate">{em}</div>
                            </div>
                            <Badge>{i === 0 ? 'Active' : 'Invited'}</Badge>
                            {canManageTeam && <Button size="sm" variant="ghost" className="shrink-0" onClick={() => removeTeamMember(em)}>Remove</Button>}
                          </div>
                      ))}
                    </div>
                )}
              </Card>

              <Card pad="p-5 sm:p-6" className="bg-paper-warm">
                <div className="font-bold text-[10px] uppercase tracking-widest text-ink-soft mb-2">Role · Client Employee</div>
                <p className="text-ink-soft text-[13px] m-0">Employees see this project on their Home page with a single Preview button. They can read the StoryGuide but cannot edit content, brand, or team.</p>
              </Card>
            </div>
        )}
      </div>
  );
}

function Team({ projectId }) {
  const project = window.WODEN.PROJECTS.find(p => p.id === projectId) || window.WODEN.PROJECTS[0];
  const [emails, setEmails] = useStateE(project ? [...project.team] : []);
  const [inv, setInv] = useStateE('');
  const add = () => { if (!inv.trim()) return; const updated = [...emails, inv.trim()]; if (project) project.team = updated; setEmails(updated); setInv(''); toast('Invite sent'); };
  return (
      <div className="animate-screen-in">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start mb-1.5"><h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-bold leading-tight tracking-tight">Team</h1><div className="self-start"><Badge>{emails.length} members</Badge></div></div>
        {project && <p className="font-mono text-ink-soft text-[11px] tracking-[0.1em] mb-1.5">{project.name.toUpperCase()}</p>}
        <p className="text-ink-soft mb-6">Invite colleagues to access this project's StoryGuide.</p>
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <Card><h3 className="text-lg font-bold mb-3">Members</h3><div className="flex flex-col gap-2">{emails.map((e, i) => (<div key={i} className="flex items-center gap-3 p-2.5 border-[1.5px] border-contrast rounded-lg flex-wrap sm:flex-nowrap"><div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">{e[0].toUpperCase()}</div><div className="flex-1 min-w-0"><div className="font-bold truncate">{e.split('@')[0]}</div><div className="font-mono text-ink-soft text-[11px] truncate">{e}</div></div><Badge>{i === 0 ? 'Active' : 'Invited'}</Badge><Button size="sm" variant="ghost" className="shrink-0" onClick={() => { const u = emails.filter((_, j) => j !== i); if (project) project.team = u; setEmails(u); toast('Removed'); }}>Remove</Button></div>))}</div></Card>
          <Card><h3 className="text-lg font-bold mb-3">Invite by email</h3><Input placeholder="name@company.co" value={inv} onChange={e => setInv(e.target.value)} className="mb-2.5" onKeyDown={e => e.key === 'Enter' && add()} /><Button variant="primary" className="w-full justify-center" onClick={add}>Send invite</Button><div className="my-6 border-t border-light-gray" /><Label>Role</Label><p className="text-ink-soft text-[13px] mt-1 m-0">Client Employee · read-only StoryGuide + chat.</p></Card>
        </div>
      </div>
  );
}

Object.assign(window, { ProjectEditor, Team });
