// pages/medicines.js — Medicine Reminder module (full implementation).
// List, search, sort, filter, add/edit/delete, mark-as-taken, and reminder history.

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { field, getFormData } from '../components/formField.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { emptyState } from '../components/emptyState.js';
import { spinner } from '../components/spinner.js';
import toast from '../components/toast.js';
import { navigate } from '../router.js';
import { formatDate, formatTime } from '../utils/format.js';
import {
  listMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  findDuplicate,
  markTaken,
  listTodayLogs,
  timeOfDay,
  isMedicineActiveToday,
  isMissed,
  isUpcoming,
} from '../services/medicinesService.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'night', label: 'Night' },
];

const FOOD_OPTIONS = [
  { value: '', label: 'Anytime' },
  { value: 'before_food', label: 'Before food' },
  { value: 'after_food', label: 'After food' },
  { value: 'with_food', label: 'With food' },
  { value: 'anytime', label: 'Anytime' },
];

const FREQ_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

let viewState = { search: '', filter: 'all', sort: 'time' };

export async function medicinesPage() {
  const root = h('div', { class: 'stack-lg' });
  root.append(spinner());

  try {
    await loadAndRender(root);
  } catch (err) {
    renderError(root, err);
  }

  return dashboardLayout(root);
}

async function loadAndRender(root) {
  const [medicines, todayLogs] = await Promise.all([
    listMedicines(),
    listTodayLogs(),
  ]);

  const takenIds = new Set(
    todayLogs.filter((l) => l.status === 'taken').map((l) => l.medicine_id)
  );

  clear(root);
  renderHeader(root, medicines.length, takenIds.size);
  renderToolbar(root);

  const filtered = applyFilters(medicines);
  const listContainer = h('div', { id: 'med-list' });
  root.append(listContainer);
  renderList(listContainer, filtered, takenIds);
}

function renderHeader(root, total, taken) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-between' },
      h('div', {},
        h('div', { class: 'row-center' },
          h('div', { class: 'widget-icon' }, icon('pill')),
          h('h1', {}, 'Medicine Reminders')
        ),
        h('p', { class: 'text-muted' }, `${total} medicine${total !== 1 ? 's' : ''} · ${taken} taken today`)
      ),
      h('button', { class: 'btn btn-primary btn-lg', onclick: () => openMedicineForm(root) },
        icon('plus'), 'Add Medicine'
      )
    )
  );
  root.append(header);
}

function renderToolbar(root) {
  const searchInput = h('input', {
    class: 'input',
    type: 'search',
    placeholder: 'Search medicines...',
    value: viewState.search,
    oninput: (e) => { viewState.search = e.target.value; refreshList(root); },
  });
  searchInput.style.maxWidth = '320px';

  const filterBar = h('div', { class: 'row' });
  for (const f of FILTERS) {
    filterBar.append(h('button', {
      class: `btn btn-sm ${viewState.filter === f.value ? 'btn-primary' : 'btn-outline'}`,
      onclick: () => { viewState.filter = f.value; refreshList(root); },
    }, f.label));
  }

  const sortSelect = h('select', {
    class: 'select',
    style: { maxWidth: '200px' },
    onchange: (e) => { viewState.sort = e.target.value; refreshList(root); },
  },
    h('option', { value: 'time' }, 'Sort by Time'),
    h('option', { value: 'name' }, 'Sort by Name'),
    h('option', { value: 'recent' }, 'Sort by Recent')
  );
  sortSelect.value = viewState.sort;

  const toolbar = h('div', { class: 'card' },
    h('div', { class: 'row-between' },
      searchInput,
      sortSelect
    ),
    h('div', { style: { marginTop: 'var(--space-4)' } }, filterBar)
  );
  root.append(toolbar);
}

function applyFilters(medicines) {
  let result = medicines.filter((m) => isMedicineActiveToday(m));

  if (viewState.search.trim()) {
    const q = viewState.search.toLowerCase();
    result = result.filter((m) =>
      m.name?.toLowerCase().includes(q) ||
      m.purpose?.toLowerCase().includes(q) ||
      m.notes?.toLowerCase().includes(q)
    );
  }

  if (viewState.filter !== 'all') {
    result = result.filter((m) => timeOfDay(m.reminder_time) === viewState.filter);
  }

  if (viewState.sort === 'name') {
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (viewState.sort === 'recent') {
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    result.sort((a, b) => (a.reminder_time || '').localeCompare(b.reminder_time || ''));
  }

  return result;
}

function refreshList(root) {
  const listEl = root.querySelector('#med-list');
  if (!listEl) return;
  listEl.replaceChildren(spinner());
  listMedicines().then((medicines) => {
    listTodayLogs().then((logs) => {
      const takenIds = new Set(logs.filter((l) => l.status === 'taken').map((l) => l.medicine_id));
      const filtered = applyFilters(medicines);
      clear(listEl);
      renderList(listEl, filtered, takenIds);
    });
  }).catch((err) => {
    clear(listEl);
    listEl.append(renderErrorCard(err));
  });
}

function renderList(container, medicines, takenIds) {
  if (medicines.length === 0) {
    container.append(
      emptyState({
        icon: '💊',
        title: 'No medicines found',
        message: viewState.search || viewState.filter !== 'all'
          ? 'Try a different search or filter.'
          : 'Add your first medicine reminder to get started.',
        action: h('button', { class: 'btn btn-primary btn-lg', onclick: () => {
          const root = container.closest('.stack-lg');
          openMedicineForm(root);
        } }, icon('plus'), 'Add Medicine'),
      })
    );
    return;
  }

  const list = h('div', { class: 'list' });
  for (const med of medicines) {
    list.append(renderMedicineCard(med, takenIds.has(med.id), container));
  }
  container.append(list);
}

function renderMedicineCard(med, isTaken, container) {
  const tod = timeOfDay(med.reminder_time);
  const missed = isMissed(med, isTaken);
  const upcoming = isUpcoming(med, isTaken);

  const statusBadge = isTaken
    ? h('span', { class: 'badge badge-success' }, 'Taken')
    : missed
      ? h('span', { class: 'badge badge-danger' }, 'Missed')
      : upcoming
        ? h('span', { class: 'badge badge-warning' }, 'Upcoming')
        : h('span', { class: 'badge' }, 'Scheduled');

  const foodLabel = FOOD_OPTIONS.find((f) => f.value === (med.food_timing || ''))?.label || 'Anytime';

  const card = h('div', { class: 'card card-hover', style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' } },
    h('div', { class: 'row-between' },
      h('div', { class: 'row-center' },
        h('div', { class: 'feature-icon-wrap', style: { width: '48px', height: '48px', marginBottom: '0' } }, icon('pill')),
        h('div', {},
          h('h3', { style: { marginBottom: '0' } }, med.name),
          h('div', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
            med.dosage ? `${med.dosage} · ` : '', med.purpose || '')
        )
      ),
      statusBadge
    ),
    h('div', { class: 'row', style: { fontSize: 'var(--font-size-sm)' } },
      h('span', { class: 'badge' }, formatTime(med.reminder_time)),
      h('span', { class: 'text-muted' }, tod.charAt(0).toUpperCase() + tod.slice(1)),
      h('span', { class: 'text-muted' }, '·'),
      h('span', { class: 'text-muted' }, foodLabel),
      med.frequency === 'weekly' ? h('span', { class: 'text-muted' }, '· Weekly') : null
    ),
    med.notes ? h('p', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } }, med.notes) : null,
    h('div', { class: 'row', style: { marginTop: 'var(--space-2)' } },
      isTaken
        ? h('span', { class: 'badge badge-success', style: { display: 'flex', alignItems: 'center', gap: 'var(--space-2)' } },
            icon('check'), 'Taken today')
        : h('button', {
            class: 'btn btn-secondary',
            onclick: async () => {
              try {
                const scheduled = new Date();
                const [hh, mm] = (med.reminder_time || '').split(':').map(Number);
                scheduled.setHours(hh || 0, mm || 0, 0, 0);
                await markTaken(med.id, scheduled.toISOString());
                toast.success('Marked as Taken', `${med.name} recorded at ${formatTime(new Date())}.`);
                const root = container.closest('.stack-lg');
                refreshList(root);
              } catch (err) {
                toast.error('Could not mark', err.message);
              }
            },
          }, icon('check'), 'Mark as Taken'),
      h('button', { class: 'btn btn-outline', onclick: () => openMedicineForm(container.closest('.stack-lg'), med) }, 'Edit'),
      h('button', { class: 'btn btn-ghost', style: { color: 'var(--color-danger-600)' }, onclick: async () => {
        const ok = await confirmDialog({
          title: 'Delete medicine?',
          message: `Are you sure you want to delete "${med.name}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        });
        if (!ok) return;
        try {
          await deleteMedicine(med.id);
          toast.success('Medicine Deleted', `${med.name} has been removed.`);
          const root = container.closest('.stack-lg');
          refreshList(root);
        } catch (err) {
          toast.error('Delete failed', err.message);
        }
      } }, 'Delete')
    )
  );

  return card;
}

// ── Add / Edit form ───────────────────────────────────

function openMedicineForm(root, med = null) {
  const isEdit = !!med;
  const form = h('form', { class: 'stack' });

  const name = field({ label: 'Medicine Name', name: 'name', value: med?.name || '', placeholder: 'e.g. Metformin', required: true });
  const dosage = field({ label: 'Dosage', name: 'dosage', value: med?.dosage || '', placeholder: 'e.g. 500mg, 1 tablet' });
  const purpose = field({ label: 'Purpose', name: 'purpose', value: med?.purpose || '', placeholder: 'e.g. Blood pressure' });
  const frequency = field({ label: 'Frequency', name: 'frequency', type: 'select', value: med?.frequency || 'daily', options: FREQ_OPTIONS, required: true });
  const reminderTime = field({ label: 'Reminder Time', name: 'reminder_time', type: 'time', value: med?.reminder_time || '', required: true });
  const startDate = field({ label: 'Start Date', name: 'start_date', type: 'date', value: med?.start_date || '' });
  const endDate = field({ label: 'End Date', name: 'end_date', type: 'date', value: med?.end_date || '', hint: 'Leave empty for ongoing.' });
  const foodTiming = field({ label: 'Before / After Food', name: 'food_timing', type: 'select', value: med?.food_timing || '', options: FOOD_OPTIONS });
  const notes = field({ label: 'Notes', name: 'notes', type: 'textarea', value: med?.notes || '', placeholder: 'Any special instructions...', rows: 3 });

  form.append(name.group, dosage.group, purpose.group, frequency.group, reminderTime.group,
    h('div', { class: 'grid grid-2' }, startDate.group, endDate.group),
    foodTiming.group, notes.group);

  const submitBtn = h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' },
    isEdit ? 'Save Changes' : 'Add Medicine');

  form.append(submitBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getFormData(form);

    // Validation
    const errors = validateMedicine(data);
    if (errors.length) {
      toast.error('Please fix the following', errors.join(' · '));
      return;
    }

    // Duplicate check
    try {
      const dup = await findDuplicate(data.name, data.reminder_time, med?.id);
      if (dup) {
        const proceed = await confirmDialog({
          title: 'Duplicate medicine?',
          message: `A medicine named "${dup.name}" already has a reminder at ${formatTime(dup.reminder_time)}. Add anyway?`,
          confirmLabel: 'Add Anyway',
        });
        if (!proceed) return;
      }
    } catch {
      // Non-fatal — proceed with save
    }

    submitBtn.disabled = true;
    submitBtn.replaceChildren(spinner(false));

    const payload = {
      name: data.name.trim(),
      dosage: data.dosage?.trim() || null,
      purpose: data.purpose?.trim() || null,
      frequency: data.frequency,
      reminder_time: data.reminder_time,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      food_timing: data.food_timing || null,
      notes: data.notes?.trim() || null,
      active: true,
    };

    try {
      if (isEdit) {
        await updateMedicine(med.id, payload);
        toast.success('Medicine Updated', `${payload.name} has been updated.`);
      } else {
        await createMedicine(payload);
        toast.success('Medicine Added', `${payload.name} reminder is set for ${formatTime(payload.reminder_time)}.`);
      }
      modal.close();
      refreshList(root);
    } catch (err) {
      toast.error(isEdit ? 'Update failed' : 'Add failed', err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Add Medicine';
    }
  });

  const modal = openModal({
    title: isEdit ? 'Edit Medicine' : 'Add Medicine',
    content: form,
    actions: [],
  });
}

function validateMedicine(data) {
  const errors = [];
  if (!data.name?.trim()) errors.push('Name is required');
  if (!data.reminder_time) errors.push('Reminder time is required');
  if (data.start_date && data.end_date) {
    if (new Date(data.end_date) < new Date(data.start_date)) {
      errors.push('End date cannot be before start date');
    }
  }
  return errors;
}

// ── Reminder History ──────────────────────────────────

export async function reminderHistoryPage() {
  const root = h('div', { class: 'stack-lg' });
  root.append(spinner());

  try {
    const logs = await listReminderLogs(null, 100);
    clear(root);
    renderHistory(root, logs);
  } catch (err) {
    clear(root);
    root.append(renderErrorCard(err));
  }

  return dashboardLayout(root);
}

function renderHistory(root, logs) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' },
      h('div', { class: 'widget-icon' }, icon('info')),
      h('h1', {}, 'Reminder History')
    ),
    h('p', { class: 'text-muted' }, 'Your recent medicine activity.')
  );
  root.append(header);

  if (logs.length === 0) {
    root.append(emptyState({
      icon: '📋',
      title: 'No history yet',
      message: 'Your medicine activity will appear here once you start marking doses.',
    }));
    return;
  }

  const list = h('div', { class: 'list' });
  for (const log of logs) {
    const medName = log.medicines?.name || 'Unknown medicine';
    const medDosage = log.medicines?.dosage;

    const statusBadge =
      log.status === 'taken' ? h('span', { class: 'badge badge-success' }, 'Taken')
      : log.status === 'missed' ? h('span', { class: 'badge badge-danger' }, 'Missed')
      : log.status === 'upcoming' ? h('span', { class: 'badge badge-warning' }, 'Upcoming')
      : h('span', { class: 'badge' }, 'Skipped');

    list.append(h('div', { class: 'list-item', style: { flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-2)' } },
      h('div', { class: 'row-between' },
        h('div', {},
          h('div', { style: { fontWeight: '700' } }, medName),
          medDosage ? h('div', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } }, medDosage) : null
        ),
        statusBadge
      ),
      h('div', { class: 'row', style: { fontSize: 'var(--font-size-sm)' } },
        log.scheduled_time ? h('span', { class: 'text-muted' }, `Scheduled: ${formatTime(log.scheduled_time)}`) : null,
        log.taken_at ? h('span', { class: 'text-muted' }, `Taken: ${formatTime(log.taken_at)}`) : null,
        h('span', { class: 'text-muted' }, `· ${formatDate(log.created_at)}`)
      )
    ));
  }
  root.append(list);
}

// ── Error helpers ────────────────────────────────────

function renderError(root, err) {
  clear(root);
  root.append(renderErrorCard(err));
}

function renderErrorCard(err) {
  return h('div', { class: 'card', style: { borderColor: 'var(--color-danger-500)' } },
    h('h3', { style: { color: 'var(--color-danger-600)' } }, 'Something went wrong'),
    h('p', { class: 'text-muted' }, err.message || 'Could not load medicines. Please try again.'),
    h('button', { class: 'btn btn-primary', style: { marginTop: 'var(--space-4)' }, onclick: () => navigate('/medicines') }, 'Retry')
  );
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
