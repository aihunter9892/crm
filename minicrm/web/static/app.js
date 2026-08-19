/* ============================================================
   MiniCRM front-end — vanilla JS, no build step.
   Talks only to /api/*  (the REST adapter over the shared core).
   ============================================================ */

const state = { meta: null, view: null, cache: {} };

/* ---------------- tiny helpers ---------------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const titleCase = (s) => String(s ?? '').replace(/_/g, ' ')
  .replace(/\b\w/g, c => c.toUpperCase());

function money(n) {
  const v = Number(n || 0);
  if (v >= 1e7) return '₹' + (v / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (v >= 1e5) return '₹' + (v / 1e5).toFixed(1).replace(/\.0$/, '') + ' L';
  return '₹' + v.toLocaleString('en-IN');
}

function initials(name) {
  if (!name) return '–';
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ago(iso) {
  if (!iso) return 'never';
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const isOverdue = (t) => t.due_date && t.status !== 'completed' &&
  t.due_date < new Date().toISOString().slice(0, 10);

/* ---------------- colour maps ---------------- */
const STAGE_TONE = {
  qualification: 'grey', needs_analysis: 'blue', proposal: 'amber',
  negotiation: 'purple', closed_won: 'green', closed_lost: 'red',
};
const TONE = { grey: '', blue: 'blue', amber: 'amber', green: 'green', red: 'red', purple: '' };
const PRIORITY_TONE = { low: 'grey', medium: 'blue', high: 'amber', urgent: 'red' };
const STATUS_TONE = {
  new: 'blue', contacted: 'amber', qualified: 'green', unqualified: 'red',
  converted: 'green', open: 'blue', in_progress: 'amber', completed: 'green', deferred: 'grey',
};
const badge = (val, tone) =>
  `<span class="badge ${TONE[tone] ?? tone ?? ''}">${esc(titleCase(val))}</span>`;

/* ---------------- API ---------------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data?.error || {};
    const detail = Array.isArray(data?.detail)
      ? data.detail.map(d => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join(' · ')
      : null;
    throw new Error(err.message || detail || data?.detail || `Request failed (${res.status})`);
  }
  return data;
}

/* ---------------- toasts ---------------- */
function toast(title, msg = '', kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<strong>${esc(title)}</strong>${msg ? `<span>${esc(msg)}</span>` : ''}`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------------- modal ---------------- */
function openModal(title, bodyHTML, footHTML) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHTML;
  $('#modalFoot').innerHTML = footHTML;
  $('#modalBackdrop').hidden = false;
}
function closeModal() { $('#modalBackdrop').hidden = true; }
$('#modalClose').onclick = closeModal;
$('#modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') closeModal(); };
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeDrawer(); $('#searchResults').hidden = true; }
});

/* ---------------- drawer ---------------- */
function openDrawer(html) {
  $('#drawer').innerHTML = html;
  $('#drawerBackdrop').hidden = false;
}
function closeDrawer() { $('#drawerBackdrop').hidden = true; }
$('#drawerBackdrop').onclick = (e) => { if (e.target.id === 'drawerBackdrop') closeDrawer(); };

/* ============================================================
   FORM ENGINE — one definition drives create + edit modals
   ============================================================ */
function fieldHTML(f, value) {
  const v = value ?? f.default ?? '';
  const req = f.required ? ' <span class="req">*</span>' : '';
  let input;
  if (f.type === 'select') {
    const opts = (typeof f.options === 'function' ? f.options() : f.options) || [];
    input = `<select name="${f.name}">${f.allowEmpty !== false ? '<option value="">— none —</option>' : ''}` +
      opts.map(o => {
        const val = o.value ?? o;
        const lbl = o.label ?? titleCase(o);
        return `<option value="${esc(val)}"${String(val) === String(v) ? ' selected' : ''}>${esc(lbl)}</option>`;
      }).join('') + `</select>`;
  } else if (f.type === 'textarea') {
    input = `<textarea name="${f.name}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea>`;
  } else {
    input = `<input name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}"
             placeholder="${esc(f.placeholder || '')}"${f.step ? ` step="${f.step}"` : ''}>`;
  }
  return `<div class="field ${f.full ? 'full' : ''}"><label>${esc(f.label)}${req}</label>${input}</div>`;
}

function readForm(fields) {
  const out = {};
  fields.forEach(f => {
    const el = $(`[name="${f.name}"]`, $('#modalBody'));
    if (!el) return;
    let v = el.value.trim();
    if (v === '') { if (f.required) out[f.name] = ''; return; }
    if (f.type === 'number') v = Number(v);
    out[f.name] = v;
  });
  return out;
}

function formModal({ title, fields, values = {}, submitLabel = 'Save', onSubmit }) {
  openModal(title,
    `<div id="formErr"></div><div class="form-grid">${fields.map(f => fieldHTML(f, values[f.name])).join('')}</div>`,
    `<button class="btn btn-ghost" id="mCancel">Cancel</button>
     <button class="btn btn-primary" id="mSave">${esc(submitLabel)}</button>`);
  $('#mCancel').onclick = closeModal;
  $('#mSave').onclick = async () => {
    const payload = readForm(fields);
    const missing = fields.filter(f => f.required && !payload[f.name]).map(f => f.label);
    if (missing.length) {
      $('#formErr').innerHTML = `<div class="form-error">Required: ${esc(missing.join(', '))}</div>`;
      return;
    }
    $('#mSave').disabled = true;
    try {
      await onSubmit(payload);
      closeModal();
    } catch (e) {
      $('#formErr').innerHTML = `<div class="form-error">${esc(e.message)}</div>`;
      $('#mSave').disabled = false;
    }
  };
}

const userOptions = () => (state.meta?.users || []).map(u => ({ value: u.id, label: u.name }));
const enumOptions = (key) => (state.meta?.[key] || []).map(v => ({ value: v, label: titleCase(v) }));
async function accountOptions() {
  if (!state.cache.accounts) state.cache.accounts = await api('/api/accounts?limit=300');
  return state.cache.accounts.map(a => ({ value: a.id, label: a.name }));
}

/* ============================================================
   RECORD FORMS
   ============================================================ */
const LEAD_FIELDS = () => [
  { name: 'first_name', label: 'First name', required: true },
  { name: 'last_name', label: 'Last name', required: true },
  { name: 'company', label: 'Company' },
  { name: 'title', label: 'Job title' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'source', label: 'Source', type: 'select', options: enumOptions('lead_sources'), allowEmpty: false, default: 'other' },
  { name: 'status', label: 'Status', type: 'select', options: enumOptions('lead_statuses'), allowEmpty: false, default: 'new' },
  { name: 'rating', label: 'Rating', type: 'select', options: enumOptions('ratings'), allowEmpty: false, default: 'warm' },
  { name: 'owner_id', label: 'Owner', type: 'select', options: userOptions },
];

const ACCOUNT_FIELDS = () => [
  { name: 'name', label: 'Account name', required: true, full: true },
  { name: 'industry', label: 'Industry' },
  { name: 'website', label: 'Website' },
  { name: 'phone', label: 'Phone' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country', default: 'India' },
  { name: 'employees', label: 'Employees', type: 'number' },
  { name: 'annual_revenue', label: 'Annual revenue (₹)', type: 'number' },
  { name: 'owner_id', label: 'Owner', type: 'select', options: userOptions },
];

const CONTACT_FIELDS = (accOpts) => [
  { name: 'first_name', label: 'First name', required: true },
  { name: 'last_name', label: 'Last name', required: true },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone' },
  { name: 'title', label: 'Job title' },
  { name: 'account_id', label: 'Account', type: 'select', options: accOpts },
  { name: 'owner_id', label: 'Owner', type: 'select', options: userOptions },
];

const DEAL_FIELDS = (accOpts) => [
  { name: 'name', label: 'Deal name', required: true, full: true },
  { name: 'account_id', label: 'Account', type: 'select', options: accOpts, required: true, allowEmpty: false },
  { name: 'amount', label: 'Amount (₹)', type: 'number', default: 0 },
  { name: 'stage', label: 'Stage', type: 'select', options: enumOptions('deal_stages'), allowEmpty: false, default: 'qualification' },
  { name: 'close_date', label: 'Expected close', type: 'date' },
  { name: 'source', label: 'Source', type: 'select', options: enumOptions('lead_sources') },
  { name: 'owner_id', label: 'Owner', type: 'select', options: userOptions },
];

const TASK_FIELDS = () => [
  { name: 'subject', label: 'Subject', required: true, full: true },
  { name: 'description', label: 'Description', type: 'textarea', full: true },
  { name: 'assignee_id', label: 'Assignee', type: 'select', options: userOptions },
  { name: 'due_date', label: 'Due date', type: 'date' },
  { name: 'priority', label: 'Priority', type: 'select', options: enumOptions('priorities'), allowEmpty: false, default: 'medium' },
  { name: 'status', label: 'Status', type: 'select', options: enumOptions('task_statuses'), allowEmpty: false, default: 'open' },
];

const ACTIVITY_FIELDS = () => [
  { name: 'type', label: 'Type', type: 'select', options: enumOptions('activity_types'), allowEmpty: false, default: 'call' },
  { name: 'subject', label: 'Subject', required: true },
  { name: 'notes', label: 'Notes', type: 'textarea', full: true },
  { name: 'owner_id', label: 'Logged by', type: 'select', options: userOptions },
];

/* ---------------- create actions ---------------- */
async function createLead() {
  formModal({
    title: 'New Lead', fields: LEAD_FIELDS(), submitLabel: 'Create lead',
    onSubmit: async (p) => { await api('/api/leads', { method: 'POST', body: p }); toast('Lead created', p.first_name + ' ' + p.last_name); refresh(); },
  });
}
async function createAccount() {
  formModal({
    title: 'New Account', fields: ACCOUNT_FIELDS(), submitLabel: 'Create account',
    onSubmit: async (p) => { await api('/api/accounts', { method: 'POST', body: p }); state.cache.accounts = null; toast('Account created', p.name); refresh(); },
  });
}
async function createContact(accountId) {
  const opts = await accountOptions();
  formModal({
    title: 'New Contact', fields: CONTACT_FIELDS(opts), values: { account_id: accountId },
    submitLabel: 'Create contact',
    onSubmit: async (p) => { await api('/api/contacts', { method: 'POST', body: p }); toast('Contact created'); refresh(); },
  });
}
async function createDeal(accountId, stage) {
  const opts = await accountOptions();
  formModal({
    title: 'New Deal', fields: DEAL_FIELDS(opts), values: { account_id: accountId, stage },
    submitLabel: 'Create deal',
    onSubmit: async (p) => { await api('/api/deals', { method: 'POST', body: p }); toast('Deal created', p.name); refresh(); },
  });
}
async function createTask(related) {
  formModal({
    title: 'New Task', fields: TASK_FIELDS(), submitLabel: 'Create task',
    onSubmit: async (p) => {
      if (related) { p.related_type = related.type; p.related_id = related.id; }
      await api('/api/tasks', { method: 'POST', body: p });
      toast('Task created', p.subject); refresh();
    },
  });
}
async function logActivity(related) {
  formModal({
    title: 'Log Activity', fields: ACTIVITY_FIELDS(), submitLabel: 'Log it',
    onSubmit: async (p) => {
      if (related) { p.related_type = related.type; p.related_id = related.id; }
      await api('/api/activities', { method: 'POST', body: p });
      toast('Activity logged', p.subject); refresh();
    },
  });
}

$('#btnCreate').onclick = () => {
  openModal('Create a record', `
    <div class="mini-list">
      ${[['lead', 'Lead', 'A new prospect, not yet qualified'],
         ['account', 'Account', 'A company you sell to'],
         ['contact', 'Contact', 'A person at an account'],
         ['deal', 'Deal', 'An opportunity in your pipeline'],
         ['task', 'Task', 'A follow-up to do'],
         ['activity', 'Activity', 'A call, email or meeting that happened']]
      .map(([k, t, d]) => `<div class="mini-item" data-create="${k}" style="cursor:pointer">
        <div><strong>${t}</strong><div class="muted" style="color:var(--ink-faint);font-size:12px">${d}</div></div>
        <span class="link">Create →</span></div>`).join('')}
    </div>`, '');
  $$('[data-create]').forEach(el => el.onclick = () => {
    const k = el.dataset.create;
    ({ lead: createLead, account: createAccount, contact: () => createContact(), deal: () => createDeal(), task: () => createTask(), activity: () => logActivity() })[k]();
  });
};

/* ============================================================
   VIEWS
   ============================================================ */
const view = (html) => { $('#view').innerHTML = html; };
const loading = () => view('<div class="loading"><div class="spinner"></div>Loading…</div>');
const emptyRow = (cols, msg) =>
  `<tr><td colspan="${cols}"><div class="empty"><strong>Nothing here yet</strong>${esc(msg)}</div></td></tr>`;

/* ---------- DASHBOARD ---------- */
async function viewDashboard() {
  loading();
  const d = await api('/api/dashboard');
  const k = d.kpis;
  const maxStage = Math.max(1, ...d.pipeline_by_stage.map(s => s.total));
  const maxOwner = Math.max(1, ...d.revenue_by_owner.map(o => o.open_value + o.won_value));
  const maxSrc = Math.max(1, ...d.leads_by_source.map(s => s.count));

  view(`
  <div class="page-head">
    <div><h1>Dashboard</h1><p>Everything happening across your pipeline right now.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-ghost btn-sm" onclick="location.hash='#/reports'">View reports →</button>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><label>Open pipeline</label><div class="val">${money(k.open_pipeline_value)}</div><div class="sub">${k.open_deal_count} open deals</div></div>
    <div class="kpi"><label>Weighted forecast</label><div class="val">${money(k.weighted_pipeline_value)}</div><div class="sub">amount × probability</div></div>
    <div class="kpi"><label>Won this month</label><div class="val">${money(k.won_this_month_value)}</div><div class="sub">${k.won_this_month_count} deals closed</div></div>
    <div class="kpi"><label>Win rate</label><div class="val">${k.win_rate_pct}%</div><div class="sub">of all closed deals</div></div>
    <div class="kpi"><label>Avg deal size</label><div class="val">${money(k.avg_deal_size)}</div><div class="sub">across open deals</div></div>
    <div class="kpi"><label>Open tasks</label><div class="val">${k.open_tasks}</div><div class="sub">${k.overdue_tasks} overdue</div></div>
    <div class="kpi"><label>New leads</label><div class="val">${k.new_leads}</div><div class="sub">awaiting first touch</div></div>
    <div class="kpi"><label>Accounts</label><div class="val">${k.total_accounts}</div><div class="sub">${k.total_contacts} contacts</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-head"><h3>Pipeline by stage</h3><div class="spacer"></div>
        <span class="count-pill">${money(k.open_pipeline_value)} open</span></div>
      <div class="card-body">
        ${d.pipeline_by_stage.map(s => `
          <div class="bar-row">
            <span class="lbl">${esc(titleCase(s.stage))}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${(s.total / maxStage * 100).toFixed(1)}%"></span></span>
            <span class="amt">${money(s.total)}<span style="color:var(--ink-faint);font-weight:500"> · ${s.count}</span></span>
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Closing in next 30 days</h3></div>
      <div class="card-body">
        ${k.closing_next_30_days.length ? `<div class="mini-list">${k.closing_next_30_days.map(dd => `
          <div class="mini-item" onclick="showDeal('${dd.id}')" style="cursor:pointer">
            <div><strong>${esc(dd.name)}</strong>
              <div style="color:var(--ink-faint);font-size:11.5px">${esc(dd.account_name || '')} · ${fmtDate(dd.close_date)}</div></div>
            <div style="text-align:right"><div style="font-weight:700">${money(dd.amount)}</div>
              ${badge(dd.stage, STAGE_TONE[dd.stage])}</div>
          </div>`).join('')}</div>`
        : '<div class="empty">No deals closing in the next 30 days.</div>'}
      </div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:16px">
    <div class="card">
      <div class="card-head"><h3>Rep performance</h3></div>
      <div class="card-body">
        ${d.revenue_by_owner.map(o => `
          <div class="bar-row">
            <span class="lbl"><span class="avatar-sm">${initials(o.owner_name)}</span>${esc((o.owner_name || '').split(' ')[0])}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${((o.open_value + o.won_value) / maxOwner * 100).toFixed(1)}%"></span></span>
            <span class="amt">${money(o.won_value)}<span style="color:var(--ink-faint);font-weight:500"> won</span></span>
          </div>`).join('') || '<div class="empty">No owners yet.</div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Leads by source</h3></div>
      <div class="card-body">
        ${d.leads_by_source.map(s => `
          <div class="bar-row">
            <span class="lbl">${esc(titleCase(s.source))}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${(s.count / maxSrc * 100).toFixed(1)}%"></span></span>
            <span class="amt">${s.count}</span>
          </div>`).join('') || '<div class="empty">No leads yet.</div>'}
      </div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:16px">
    <div class="card">
      <div class="card-head"><h3>Recent activity</h3></div>
      <div class="card-body">
        ${d.recent_activities.length ? `<div class="timeline">${d.recent_activities.map(a => `
          <div class="tl-item">
            <div class="tl-head"><span class="tl-sub">${esc(a.subject)}</span>${badge(a.type, 'grey')}
              <span class="tl-time">${ago(a.occurred_at)} · ${esc(a.owner_name || 'system')}</span></div>
            ${a.notes ? `<div class="tl-notes">${esc(a.notes)}</div>` : ''}
          </div>`).join('')}</div>` : '<div class="empty">No activity logged yet.</div>'}
      </div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Overdue tasks</h3><div class="spacer"></div>
        <span class="badge red">${k.overdue_tasks}</span></div>
      <div class="card-body">
        ${d.overdue_tasks.length ? `<div class="mini-list">${d.overdue_tasks.map(t => `
          <div class="mini-item">
            <div><strong>${esc(t.subject)}</strong>
              <div style="color:var(--red);font-size:11.5px">Due ${fmtDate(t.due_date)} · ${esc(t.assignee_name || 'unassigned')}</div></div>
            <button class="btn btn-ghost btn-sm" onclick="completeTask('${t.id}')">Done</button>
          </div>`).join('')}</div>` : '<div class="empty">Nothing overdue. Nice.</div>'}
      </div>
    </div>
  </div>`);
}

/* ---------- LEADS ---------- */
async function viewLeads() {
  loading();
  const f = state.filters?.leads || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/leads?' + qs);

  view(`
  <div class="page-head">
    <div><h1>Leads</h1><p>Prospects that have not been qualified into accounts yet.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="createLead()">+ New Lead</button>
  </div>

  <div class="toolbar">
    <input type="search" id="fq" placeholder="Search name, company, email…" value="${esc(f.q || '')}">
    <select id="fstatus">${optList('lead_statuses', f.status, 'All statuses')}</select>
    <select id="fsource">${optList('lead_sources', f.source, 'All sources')}</select>
    <select id="frating">${optList('ratings', f.rating, 'All ratings')}</select>
    <select id="fowner">${ownerList(f.owner_id)}</select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} leads</span>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Company</th><th>Contact</th><th>Source</th>
      <th>Rating</th><th>Status</th><th>Owner</th><th>Created</th></tr></thead>
    <tbody>
      ${rows.length ? rows.map(l => `
        <tr onclick="showLead('${l.id}')">
          <td><strong>${esc(l.full_name)}</strong><div class="muted">${esc(l.title || '')}</div></td>
          <td>${esc(l.company || '—')}</td>
          <td>${esc(l.email || '—')}<div class="muted">${esc(l.phone || '')}</div></td>
          <td>${badge(l.source, 'grey')}</td>
          <td>${badge(l.rating, l.rating === 'hot' ? 'red' : l.rating === 'warm' ? 'amber' : 'blue')}</td>
          <td>${badge(l.status, STATUS_TONE[l.status])}</td>
          <td><span class="avatar-sm">${initials(l.owner_name)}</span>${esc((l.owner_name || '—').split(' ')[0])}</td>
          <td class="muted">${ago(l.created_at)}</td>
        </tr>`).join('') : emptyRow(8, 'Create your first lead to get started.')}
    </tbody></table></div>`);

  wireFilters('leads', { q: 'fq', status: 'fstatus', source: 'fsource', rating: 'frating', owner_id: 'fowner' });
}

/* ---------- ACCOUNTS ---------- */
async function viewAccounts() {
  loading();
  const f = state.filters?.accounts || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/accounts?' + qs);
  const industries = [...new Set(rows.map(r => r.industry).filter(Boolean))].sort();

  view(`
  <div class="page-head">
    <div><h1>Accounts</h1><p>Companies you sell to, with their contacts and open pipeline.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="createAccount()">+ New Account</button>
  </div>

  <div class="toolbar">
    <input type="search" id="fq" placeholder="Search name, website, city…" value="${esc(f.q || '')}">
    <select id="find"><option value="">All industries</option>
      ${industries.map(i => `<option${f.industry === i ? ' selected' : ''}>${esc(i)}</option>`).join('')}</select>
    <select id="fowner">${ownerList(f.owner_id)}</select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} accounts</span>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Account</th><th>Industry</th><th>Location</th><th class="num">Employees</th>
      <th class="num">Contacts</th><th class="num">Open pipeline</th><th>Owner</th></tr></thead>
    <tbody>
      ${rows.length ? rows.map(a => `
        <tr onclick="showAccount('${a.id}')">
          <td><strong>${esc(a.name)}</strong><div class="muted">${esc(a.website || '')}</div></td>
          <td>${a.industry ? badge(a.industry, 'grey') : '—'}</td>
          <td>${esc(a.city || '—')}<div class="muted">${esc(a.country || '')}</div></td>
          <td class="num">${a.employees ? a.employees.toLocaleString('en-IN') : '—'}</td>
          <td class="num">${a.contact_count}</td>
          <td class="num">${a.open_pipeline ? money(a.open_pipeline) : '—'}<div class="muted">${a.deal_count} deals</div></td>
          <td><span class="avatar-sm">${initials(a.owner_name)}</span>${esc((a.owner_name || '—').split(' ')[0])}</td>
        </tr>`).join('') : emptyRow(7, 'Add an account or convert a lead.')}
    </tbody></table></div>`);

  wireFilters('accounts', { q: 'fq', industry: 'find', owner_id: 'fowner' });
}

/* ---------- CONTACTS ---------- */
async function viewContacts() {
  loading();
  const f = state.filters?.contacts || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/contacts?' + qs);

  view(`
  <div class="page-head">
    <div><h1>Contacts</h1><p>People. Usually attached to an account.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="createContact()">+ New Contact</button>
  </div>

  <div class="toolbar">
    <input type="search" id="fq" placeholder="Search name, email, account…" value="${esc(f.q || '')}">
    <select id="fowner">${ownerList(f.owner_id)}</select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} contacts</span>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Name</th><th>Title</th><th>Account</th><th>Email</th><th>Phone</th><th>Owner</th></tr></thead>
    <tbody>
      ${rows.length ? rows.map(c => `
        <tr onclick="showContact('${c.id}')">
          <td><span class="avatar-sm">${initials(c.full_name)}</span><strong>${esc(c.full_name)}</strong></td>
          <td>${esc(c.title || '—')}</td>
          <td>${c.account_name ? `<span class="link">${esc(c.account_name)}</span>` : '—'}</td>
          <td>${esc(c.email || '—')}</td>
          <td>${esc(c.phone || '—')}</td>
          <td>${esc((c.owner_name || '—').split(' ')[0])}</td>
        </tr>`).join('') : emptyRow(6, 'No contacts match this filter.')}
    </tbody></table></div>`);

  wireFilters('contacts', { q: 'fq', owner_id: 'fowner' });
}

/* ---------- PIPELINE (kanban) ---------- */
async function viewPipeline() {
  loading();
  const board = await api('/api/pipeline');
  const stages = state.meta.deal_stages;

  view(`
  <div class="page-head">
    <div><h1>Pipeline</h1><p>Drag a card to move the deal to another stage.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="createDeal()">+ New Deal</button>
  </div>

  <div class="kanban" id="kanban">
    ${stages.map(s => {
      const col = board[s];
      return `<section class="kcol" data-stage="${s}">
        <div class="kcol-head">
          <div class="t"><span><span class="dot ${STAGE_TONE[s] === 'grey' ? 'purple' : STAGE_TONE[s]}"></span>${esc(titleCase(s))}</span>
            <span class="n">${col.count}</span></div>
          <div class="v">${money(col.total)}</div>
        </div>
        <div class="kcol-body">
          ${col.deals.map(d => `
            <article class="kcard" draggable="true" data-id="${d.id}" onclick="showDeal('${d.id}')">
              <div class="kt">${esc(d.name)}</div>
              <div class="ka">${esc(d.account_name || '')}</div>
              <div class="kf">
                <span class="kamt">${money(d.amount)}</span>
                <span title="${esc(d.owner_name || '')}"><span class="avatar-sm" style="margin:0">${initials(d.owner_name)}</span></span>
              </div>
              <div class="ka" style="margin:6px 0 0">${d.close_date ? 'Close ' + fmtDate(d.close_date) : 'No close date'} · ${d.probability}%</div>
            </article>`).join('')}
        </div>
      </section>`;
    }).join('')}
  </div>`);

  wireKanban();
}

function wireKanban() {
  let dragId = null;
  $$('.kcard').forEach(c => {
    c.addEventListener('dragstart', e => {
      dragId = c.dataset.id; c.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    c.addEventListener('dragend', () => { c.classList.remove('dragging'); dragId = null; });
  });
  $$('.kcol').forEach(col => {
    col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drop'); });
    col.addEventListener('dragleave', () => col.classList.remove('drop'));
    col.addEventListener('drop', async e => {
      e.preventDefault(); col.classList.remove('drop');
      if (!dragId) return;
      const stage = col.dataset.stage;
      try {
        if (stage === 'closed_lost') {
          const reason = prompt('Why was this deal lost? (required)');
          if (!reason) { toast('Move cancelled', 'A lost reason is required.', 'err'); return; }
          await api(`/api/deals/${dragId}/stage`, { method: 'POST', body: { stage, lost_reason: reason } });
        } else {
          await api(`/api/deals/${dragId}/stage`, { method: 'POST', body: { stage } });
        }
        toast('Deal moved', titleCase(stage));
        viewPipeline();
      } catch (err) { toast('Could not move deal', err.message, 'err'); }
    });
  });
}

/* ---------- DEALS (list) ---------- */
async function viewDeals() {
  loading();
  const f = state.filters?.deals || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/deals?' + qs);
  const total = rows.reduce((s, d) => s + (d.amount || 0), 0);

  view(`
  <div class="page-head">
    <div><h1>Deals</h1><p>The full list view of your pipeline.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-ghost" onclick="location.hash='#/pipeline'">Kanban view</button>
    <button class="btn btn-primary" onclick="createDeal()">+ New Deal</button>
  </div>

  <div class="toolbar">
    <input type="search" id="fq" placeholder="Search deal or account…" value="${esc(f.q || '')}">
    <select id="fstage">${optList('deal_stages', f.stage, 'All stages')}</select>
    <select id="fowner">${ownerList(f.owner_id)}</select>
    <select id="fopen"><option value="">All deals</option>
      <option value="true"${f.open_only === 'true' ? ' selected' : ''}>Open only</option></select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} deals · ${money(total)}</span>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Deal</th><th>Account</th><th class="num">Amount</th><th>Stage</th>
      <th class="num">Prob.</th><th>Close date</th><th>Owner</th></tr></thead>
    <tbody>
      ${rows.length ? rows.map(d => `
        <tr onclick="showDeal('${d.id}')">
          <td><strong>${esc(d.name)}</strong><div class="muted">${esc(d.contact_name || '')}</div></td>
          <td>${esc(d.account_name || '—')}</td>
          <td class="num">${money(d.amount)}</td>
          <td>${badge(d.stage, STAGE_TONE[d.stage])}</td>
          <td class="num">${d.probability}%</td>
          <td>${fmtDate(d.close_date)}</td>
          <td><span class="avatar-sm">${initials(d.owner_name)}</span>${esc((d.owner_name || '—').split(' ')[0])}</td>
        </tr>`).join('') : emptyRow(7, 'No deals match this filter.')}
    </tbody></table></div>`);

  wireFilters('deals', { q: 'fq', stage: 'fstage', owner_id: 'fowner', open_only: 'fopen' });
}

/* ---------- TASKS ---------- */
async function viewTasks() {
  loading();
  const f = state.filters?.tasks || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/tasks?' + qs);

  view(`
  <div class="page-head">
    <div><h1>Tasks</h1><p>Follow-ups across leads, accounts, contacts and deals.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="createTask()">+ New Task</button>
  </div>

  <div class="toolbar">
    <input type="search" id="fq" placeholder="Search subject…" value="${esc(f.q || '')}">
    <select id="fstatus">${optList('task_statuses', f.status, 'All statuses')}</select>
    <select id="fpri">${optList('priorities', f.priority, 'All priorities')}</select>
    <select id="fowner">${ownerList(f.assignee_id, 'All assignees')}</select>
    <select id="fover"><option value="">Any due date</option>
      <option value="true"${f.overdue_only === 'true' ? ' selected' : ''}>Overdue only</option></select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} tasks</span>
  </div>

  <div class="table-wrap"><table>
    <thead><tr><th>Subject</th><th>Related to</th><th>Assignee</th><th>Due</th>
      <th>Priority</th><th>Status</th><th></th></tr></thead>
    <tbody>
      ${rows.length ? rows.map(t => `
        <tr>
          <td><strong>${esc(t.subject)}</strong><div class="muted">${esc(t.description || '')}</div></td>
          <td>${t.related_type ? badge(t.related_type, 'grey') : '—'}</td>
          <td><span class="avatar-sm">${initials(t.assignee_name)}</span>${esc((t.assignee_name || 'Unassigned').split(' ')[0])}</td>
          <td style="${isOverdue(t) ? 'color:var(--red);font-weight:650' : ''}">${fmtDate(t.due_date)}</td>
          <td>${badge(t.priority, PRIORITY_TONE[t.priority])}</td>
          <td>${badge(t.status, STATUS_TONE[t.status])}</td>
          <td style="text-align:right">${t.status !== 'completed'
            ? `<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();completeTask('${t.id}')">Done</button>` : ''}</td>
        </tr>`).join('') : emptyRow(7, 'No tasks match this filter.')}
    </tbody></table></div>`);

  wireFilters('tasks', { q: 'fq', status: 'fstatus', priority: 'fpri', assignee_id: 'fowner', overdue_only: 'fover' });
}

/* ---------- ACTIVITIES ---------- */
async function viewActivities() {
  loading();
  const f = state.filters?.activities || {};
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const rows = await api('/api/activities?limit=100&' + qs);

  view(`
  <div class="page-head">
    <div><h1>Activities</h1><p>Every call, email, meeting and note logged in the CRM.</p></div>
    <div class="spacer"></div>
    <button class="btn btn-primary" onclick="logActivity()">+ Log Activity</button>
  </div>

  <div class="toolbar">
    <select id="ftype">${optList('activity_types', f.type, 'All types')}</select>
    <select id="fowner">${ownerList(f.owner_id, 'All users')}</select>
    <div class="spacer"></div>
    <span class="count-pill">${rows.length} activities</span>
  </div>

  <div class="card"><div class="card-body">
    ${rows.length ? `<div class="timeline">${rows.map(a => `
      <div class="tl-item">
        <div class="tl-head"><span class="tl-sub">${esc(a.subject)}</span>${badge(a.type, 'grey')}
          ${a.related_type ? badge(a.related_type, 'blue') : ''}
          <span class="tl-time">${fmtDate(a.occurred_at)} · ${esc(a.owner_name || 'system')}</span></div>
        ${a.notes ? `<div class="tl-notes">${esc(a.notes)}</div>` : ''}
      </div>`).join('')}</div>` : '<div class="empty">No activities logged yet.</div>'}
  </div></div>`);

  wireFilters('activities', { type: 'ftype', owner_id: 'fowner' });
}

/* ---------- REPORTS ---------- */
async function viewReports() {
  loading();
  const [d, stale] = await Promise.all([
    api('/api/dashboard'),
    api('/api/reports/stale-accounts?days=30'),
  ]);
  const stages = d.pipeline_by_stage.filter(s => !s.stage.startsWith('closed'));
  const maxCount = Math.max(1, ...stages.map(s => s.count));

  view(`
  <div class="page-head">
    <div><h1>Reports</h1><p>The rollups an AI agent will read later, when we wire up MCP.</p></div>
  </div>

  <div class="grid-2-even">
    <div class="card">
      <div class="card-head"><h3>Sales funnel</h3></div>
      <div class="card-body"><div class="funnel">
        ${stages.map(s => `
          <div class="funnel-step">
            <div class="funnel-bar" style="width:${Math.max(18, s.count / maxCount * 100)}%">${esc(titleCase(s.stage))} · ${s.count}</div>
            <div class="meta">${money(s.total)}</div>
          </div>`).join('')}
      </div></div>
    </div>

    <div class="card">
      <div class="card-head"><h3>Rep leaderboard</h3></div>
      <div class="card-body">
        <table style="font-size:12.5px"><thead><tr><th>Rep</th><th class="num">Open</th><th class="num">Won</th><th class="num">Deals</th></tr></thead>
        <tbody>${d.revenue_by_owner.map(o => `<tr style="cursor:default">
          <td><span class="avatar-sm">${initials(o.owner_name)}</span>${esc(o.owner_name)}</td>
          <td class="num">${money(o.open_value)}</td>
          <td class="num" style="color:var(--green)">${money(o.won_value)}</td>
          <td class="num">${o.deal_count}</td></tr>`).join('')}</tbody></table>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-head"><h3>Accounts going cold</h3><div class="spacer"></div>
      <span class="count-pill">Open pipeline, no activity in 30 days</span></div>
    <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0"><table>
      <thead><tr><th>Account</th><th>Owner</th><th class="num">Open deals</th>
        <th class="num">Open value</th><th>Last activity</th><th></th></tr></thead>
      <tbody>
        ${stale.length ? stale.map(a => `
          <tr onclick="showAccount('${a.id}')">
            <td><strong>${esc(a.name)}</strong></td>
            <td>${esc(a.owner_name || '—')}</td>
            <td class="num">${a.open_deals}</td>
            <td class="num">${money(a.open_value)}</td>
            <td><span class="badge ${a.last_activity ? 'amber' : 'red'}">${ago(a.last_activity)}</span></td>
            <td style="text-align:right"><span class="link">Open →</span></td>
          </tr>`).join('') : emptyRow(6, 'Every account has been touched recently.')}
      </tbody></table></div>
  </div>`);
}

/* ============================================================
   DETAIL DRAWERS
   ============================================================ */
function drawerShell({ title, sub, tone, actions, body }) {
  return `
  <div class="drawer-head">
    <div class="row">
      <div style="flex:1">
        <h2>${title}</h2>
        <div class="sub">${sub}</div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${tone || ''}</div>
      </div>
      <button class="icon-btn" onclick="closeDrawer()">✕</button>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">${actions || ''}</div>
  </div>
  <div class="drawer-body">${body}</div>`;
}

const kv = (pairs) => `<dl class="kv">${pairs.map(([k, v]) =>
  `<dt>${esc(k)}</dt><dd>${v ?? '—'}</dd>`).join('')}</dl>`;

const timelineHTML = (acts) => acts.length
  ? `<div class="timeline">${acts.map(a => `
      <div class="tl-item">
        <div class="tl-head"><span class="tl-sub">${esc(a.subject)}</span>${badge(a.type, 'grey')}
          <span class="tl-time">${fmtDate(a.occurred_at)} · ${esc(a.owner_name || '')}</span></div>
        ${a.notes ? `<div class="tl-notes">${esc(a.notes)}</div>` : ''}</div>`).join('')}</div>`
  : '<div class="empty">No activity yet.</div>';

const taskListHTML = (tasks) => tasks.length
  ? `<div class="mini-list">${tasks.map(t => `
      <div class="mini-item">
        <div><strong>${esc(t.subject)}</strong>
          <div style="font-size:11.5px;color:${isOverdue(t) ? 'var(--red)' : 'var(--ink-faint)'}">
            ${t.due_date ? 'Due ' + fmtDate(t.due_date) : 'No due date'} · ${esc(t.assignee_name || 'unassigned')}</div></div>
        <div style="display:flex;gap:6px;align-items:center">${badge(t.status, STATUS_TONE[t.status])}
          ${t.status !== 'completed' ? `<button class="btn btn-ghost btn-sm" onclick="completeTask('${t.id}')">Done</button>` : ''}</div>
      </div>`).join('')}</div>`
  : '<div class="empty">No tasks yet.</div>';

async function showAccount(id) {
  const d = await api(`/api/accounts/${id}`);
  const a = d.account;
  openDrawer(drawerShell({
    title: esc(a.name),
    sub: `${esc(a.industry || 'Unknown industry')} · ${esc(a.city || '')} ${esc(a.country || '')}`,
    tone: `${badge('account', 'blue')}${a.open_pipeline ? `<span class="badge green">${money(a.open_pipeline)} open</span>` : ''}`,
    actions: `
      <button class="btn btn-primary btn-sm" onclick="createDeal('${a.id}')">+ Deal</button>
      <button class="btn btn-ghost btn-sm" onclick="createContact('${a.id}')">+ Contact</button>
      <button class="btn btn-ghost btn-sm" onclick="createTask({type:'account',id:'${a.id}'})">+ Task</button>
      <button class="btn btn-ghost btn-sm" onclick="logActivity({type:'account',id:'${a.id}'})">Log activity</button>
      <button class="btn btn-ghost btn-sm" onclick="editAccount('${a.id}')">Edit</button>`,
    body: `
      <div class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
        ${kv([
          ['Website', a.website ? `<a class="link" href="${esc(a.website)}" target="_blank">${esc(a.website)}</a>` : null],
          ['Phone', esc(a.phone)],
          ['Employees', a.employees ? a.employees.toLocaleString('en-IN') : null],
          ['Annual revenue', a.annual_revenue ? money(a.annual_revenue) : null],
          ['Owner', esc(a.owner_name)],
          ['Created', fmtDate(a.created_at)],
        ])}
      </div></div>

      <div class="card"><div class="card-head"><h3>Deals</h3><div class="spacer"></div>
        <span class="count-pill">${d.deals.length}</span></div><div class="card-body">
        ${d.deals.length ? `<div class="mini-list">${d.deals.map(x => `
          <div class="mini-item" style="cursor:pointer" onclick="showDeal('${x.id}')">
            <div><strong>${esc(x.name)}</strong><div style="font-size:11.5px;color:var(--ink-faint)">
              ${fmtDate(x.close_date)} · ${x.probability}%</div></div>
            <div style="text-align:right"><div style="font-weight:700">${money(x.amount)}</div>
              ${badge(x.stage, STAGE_TONE[x.stage])}</div></div>`).join('')}</div>`
          : '<div class="empty">No deals yet.</div>'}
      </div></div>

      <div class="card"><div class="card-head"><h3>Contacts</h3><div class="spacer"></div>
        <span class="count-pill">${d.contacts.length}</span></div><div class="card-body">
        ${d.contacts.length ? `<div class="mini-list">${d.contacts.map(c => `
          <div class="mini-item" style="cursor:pointer" onclick="showContact('${c.id}')">
            <div><span class="avatar-sm">${initials(c.full_name)}</span><strong>${esc(c.full_name)}</strong>
              <div style="font-size:11.5px;color:var(--ink-faint);margin-left:33px">${esc(c.title || '')}</div></div>
            <span style="font-size:11.5px;color:var(--ink-faint)">${esc(c.email || '')}</span></div>`).join('')}</div>`
          : '<div class="empty">No contacts yet.</div>'}
      </div></div>

      <div class="card"><div class="card-head"><h3>Open tasks</h3></div>
        <div class="card-body">${taskListHTML(d.tasks)}</div></div>

      <div class="card"><div class="card-head"><h3>Activity timeline</h3></div>
        <div class="card-body">${timelineHTML(d.activities)}</div></div>`,
  }));
}

async function showContact(id) {
  const d = await api(`/api/contacts/${id}`);
  const c = d.contact;
  openDrawer(drawerShell({
    title: esc(c.full_name),
    sub: `${esc(c.title || 'No title')} ${c.account_name ? '· ' + esc(c.account_name) : ''}`,
    tone: badge('contact', 'blue'),
    actions: `
      <button class="btn btn-primary btn-sm" onclick="createTask({type:'contact',id:'${c.id}'})">+ Task</button>
      <button class="btn btn-ghost btn-sm" onclick="logActivity({type:'contact',id:'${c.id}'})">Log activity</button>
      ${c.account_id ? `<button class="btn btn-ghost btn-sm" onclick="showAccount('${c.account_id}')">View account</button>` : ''}`,
    body: `
      <div class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
        ${kv([['Email', esc(c.email)], ['Phone', esc(c.phone)], ['Account', esc(c.account_name)],
              ['Owner', esc(c.owner_name)], ['Created', fmtDate(c.created_at)]])}
      </div></div>
      <div class="card"><div class="card-head"><h3>Tasks</h3></div>
        <div class="card-body">${taskListHTML(d.tasks)}</div></div>
      <div class="card"><div class="card-head"><h3>Activity</h3></div>
        <div class="card-body">${timelineHTML(d.activities)}</div></div>`,
  }));
}

async function showDeal(id) {
  const d = await api(`/api/deals/${id}`);
  const x = d.deal;
  const stages = state.meta.deal_stages;
  openDrawer(drawerShell({
    title: esc(x.name),
    sub: `${esc(x.account_name || '')} ${x.contact_name ? '· ' + esc(x.contact_name) : ''}`,
    tone: `${badge(x.stage, STAGE_TONE[x.stage])}<span class="badge green">${money(x.amount)}</span>
           <span class="badge grey">${x.probability}% likely</span>`,
    actions: `
      <select id="stageSel" style="height:32px;border:1px solid var(--line);border-radius:8px;padding:0 9px;font-size:12.5px">
        ${stages.map(s => `<option value="${s}"${s === x.stage ? ' selected' : ''}>${titleCase(s)}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" id="stageGo">Move stage</button>
      <button class="btn btn-ghost btn-sm" onclick="createTask({type:'deal',id:'${x.id}'})">+ Task</button>
      <button class="btn btn-ghost btn-sm" onclick="logActivity({type:'deal',id:'${x.id}'})">Log activity</button>`,
    body: `
      <div class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
        ${kv([['Amount', money(x.amount)], ['Stage', badge(x.stage, STAGE_TONE[x.stage])],
              ['Probability', x.probability + '%'], ['Expected close', fmtDate(x.close_date)],
              ['Source', x.source ? titleCase(x.source) : null], ['Owner', esc(x.owner_name)],
              ['Lost reason', esc(x.lost_reason)], ['Created', fmtDate(x.created_at)]])}
      </div></div>
      <div class="card"><div class="card-head"><h3>Tasks</h3></div>
        <div class="card-body">${taskListHTML(d.tasks)}</div></div>
      <div class="card"><div class="card-head"><h3>Activity</h3></div>
        <div class="card-body">${timelineHTML(d.activities)}</div></div>`,
  }));

  $('#stageGo').onclick = async () => {
    const stage = $('#stageSel').value;
    const body = { stage };
    if (stage === 'closed_lost') {
      const reason = prompt('Why was this deal lost? (required)');
      if (!reason) return toast('Cancelled', 'A lost reason is required.', 'err');
      body.lost_reason = reason;
    }
    try {
      await api(`/api/deals/${id}/stage`, { method: 'POST', body });
      toast('Stage updated', titleCase(stage));
      showDeal(id); refresh();
    } catch (e) { toast('Failed', e.message, 'err'); }
  };
}

async function showLead(id) {
  const d = await api(`/api/leads/${id}`);
  const l = d.lead;
  const converted = !!l.converted_at;
  openDrawer(drawerShell({
    title: esc(l.full_name),
    sub: `${esc(l.title || '')} ${l.company ? '· ' + esc(l.company) : ''}`,
    tone: `${badge(l.status, STATUS_TONE[l.status])}${badge(l.rating, l.rating === 'hot' ? 'red' : 'amber')}${badge(l.source, 'grey')}`,
    actions: converted
      ? `<button class="btn btn-ghost btn-sm" onclick="showAccount('${l.converted_account_id}')">View account</button>`
      : `<button class="btn btn-primary btn-sm" onclick="convertLead('${l.id}','${esc(l.company || l.full_name)}')">Convert →</button>
         <button class="btn btn-ghost btn-sm" onclick="createTask({type:'lead',id:'${l.id}'})">+ Task</button>
         <button class="btn btn-ghost btn-sm" onclick="logActivity({type:'lead',id:'${l.id}'})">Log activity</button>
         <button class="btn btn-ghost btn-sm" onclick="editLead('${l.id}')">Edit</button>`,
    body: `
      ${converted ? `<div class="card"><div class="card-body" style="background:var(--green-bg);border-radius:var(--r-lg)">
        <strong style="color:var(--green)">Converted ${ago(l.converted_at)}</strong>
        <div style="font-size:12.5px;color:var(--ink-soft);margin-top:3px">
          This lead became an account, a contact${l.converted_deal_id ? ' and a deal' : ''}.</div></div></div>` : ''}
      <div class="card"><div class="card-head"><h3>Details</h3></div><div class="card-body">
        ${kv([['Email', esc(l.email)], ['Phone', esc(l.phone)], ['Company', esc(l.company)],
              ['Source', titleCase(l.source)], ['Owner', esc(l.owner_name)], ['Created', fmtDate(l.created_at)]])}
      </div></div>
      <div class="card"><div class="card-head"><h3>Tasks</h3></div>
        <div class="card-body">${taskListHTML(d.tasks)}</div></div>
      <div class="card"><div class="card-head"><h3>Activity</h3></div>
        <div class="card-body">${timelineHTML(d.activities)}</div></div>`,
  }));
}

/* ---------- actions ---------- */
async function convertLead(id, company) {
  formModal({
    title: 'Convert lead',
    fields: [
      { name: 'deal_name', label: 'Deal name (leave blank to skip creating a deal)', full: true, default: `${company} - new opportunity` },
      { name: 'deal_amount', label: 'Deal amount (₹)', type: 'number', default: 0 },
    ],
    submitLabel: 'Convert',
    onSubmit: async (p) => {
      const r = await api(`/api/leads/${id}/convert`, { method: 'POST', body: p });
      state.cache.accounts = null;
      toast('Lead converted', `${r.account.name} · ${r.contact.full_name}${r.deal ? ' · deal created' : ''}`);
      closeDrawer(); refresh();
    },
  });
}

async function editAccount(id) {
  const d = await api(`/api/accounts/${id}`);
  formModal({
    title: 'Edit account', fields: ACCOUNT_FIELDS(), values: d.account, submitLabel: 'Save changes',
    onSubmit: async (p) => {
      await api(`/api/accounts/${id}`, { method: 'PATCH', body: p });
      state.cache.accounts = null; toast('Account updated'); showAccount(id); refresh();
    },
  });
}

async function editLead(id) {
  const d = await api(`/api/leads/${id}`);
  formModal({
    title: 'Edit lead', fields: LEAD_FIELDS(), values: d.lead, submitLabel: 'Save changes',
    onSubmit: async (p) => {
      await api(`/api/leads/${id}`, { method: 'PATCH', body: p });
      toast('Lead updated'); showLead(id); refresh();
    },
  });
}

async function completeTask(id) {
  try {
    await api(`/api/tasks/${id}/complete`, { method: 'POST' });
    toast('Task completed');
    refresh(); closeDrawer();
  } catch (e) { toast('Failed', e.message, 'err'); }
}

/* ============================================================
   FILTERS + SEARCH + ROUTER
   ============================================================ */
function optList(metaKey, current, allLabel) {
  return `<option value="">${esc(allLabel)}</option>` +
    (state.meta?.[metaKey] || []).map(v =>
      `<option value="${v}"${current === v ? ' selected' : ''}>${titleCase(v)}</option>`).join('');
}
function ownerList(current, allLabel = 'All owners') {
  return `<option value="">${esc(allLabel)}</option>` +
    (state.meta?.users || []).map(u =>
      `<option value="${u.id}"${current === u.id ? ' selected' : ''}>${esc(u.name)}</option>`).join('');
}

function wireFilters(viewName, map) {
  state.filters = state.filters || {};
  const apply = () => {
    const f = {};
    Object.entries(map).forEach(([key, elId]) => { const el = $('#' + elId); if (el) f[key] = el.value; });
    state.filters[viewName] = f;
    route();
  };
  Object.values(map).forEach(elId => {
    const el = $('#' + elId);
    if (!el) return;
    if (el.tagName === 'SELECT') el.onchange = apply;
    else {
      let t;
      el.oninput = () => { clearTimeout(t); t = setTimeout(apply, 320); };
    }
  });
  const q = $('#fq');
  if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/* ---------- global search ---------- */
let searchTimer;
$('#globalSearch').oninput = (e) => {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (q.length < 2) { $('#searchResults').hidden = true; return; }
  searchTimer = setTimeout(async () => {
    const r = await api('/api/search?q=' + encodeURIComponent(q));
    const groups = [
      ['Accounts', r.accounts, a => [a.name, a.industry || '', `showAccount('${a.id}')`]],
      ['Contacts', r.contacts, c => [c.full_name, c.account_name || '', `showContact('${c.id}')`]],
      ['Deals', r.deals, d => [d.name, money(d.amount), `showDeal('${d.id}')`]],
      ['Leads', r.leads, l => [l.full_name, l.company || '', `showLead('${l.id}')`]],
    ].filter(([, rows]) => rows.length);

    $('#searchResults').innerHTML = groups.length
      ? groups.map(([label, rows, fmt]) => `<div class="sr-group">${label}</div>` +
          rows.map(row => { const [t, s, fn] = fmt(row);
            return `<div class="sr-item" onclick="${fn};hideSearch()"><span>${esc(t)}</span><small>${esc(s)}</small></div>`;
          }).join('')).join('')
      : '<div class="sr-empty">No matches.</div>';
    $('#searchResults').hidden = false;
  }, 260);
};
function hideSearch() { $('#searchResults').hidden = true; $('#globalSearch').value = ''; }
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) $('#searchResults').hidden = true;
});

/* ---------- router ---------- */
const ROUTES = {
  dashboard: viewDashboard, leads: viewLeads, accounts: viewAccounts,
  contacts: viewContacts, pipeline: viewPipeline, deals: viewDeals,
  tasks: viewTasks, activities: viewActivities, reports: viewReports,
};

async function route() {
  const name = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
  const fn = ROUTES[name] || viewDashboard;
  state.view = name;
  $$('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.view === name));
  try { await fn(); } catch (e) { view(`<div class="empty"><strong>Could not load this view</strong>${esc(e.message)}</div>`); }
  updateBadges();
}

async function updateBadges() {
  try {
    const k = (await api('/api/dashboard')).kpis;
    $('#badge-leads').textContent = k.new_leads || '';
    $('#badge-tasks').textContent = k.overdue_tasks || '';
  } catch { /* ignore */ }
}

const refresh = () => { state.cache = {}; route(); };
$('#btnRefresh').onclick = refresh;
window.addEventListener('hashchange', route);

/* ---------- boot ---------- */
(async function boot() {
  try {
    state.meta = await api('/api/meta');
  } catch (e) {
    view(`<div class="empty"><strong>API not reachable</strong>${esc(e.message)}</div>`);
    return;
  }
  route();
})();

/* expose the handlers the inline onclick attributes need */
Object.assign(window, {
  showAccount, showContact, showDeal, showLead, closeDrawer, completeTask,
  createLead, createAccount, createContact, createDeal, createTask, logActivity,
  convertLead, editAccount, editLead, hideSearch,
});
