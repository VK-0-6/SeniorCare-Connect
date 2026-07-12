// pages/dashboard.js — main dashboard with live medicine data.

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { createReadButton } from '../services/voiceService.js';
import { emptyState } from '../components/emptyState.js';
import { spinner } from '../components/spinner.js';
import { navigate } from '../router.js';
import { formatTime, timeFromNow, formatDate } from '../utils/format.js';
import {
  listMedicines,
  listTodayLogs,
  timeOfDay,
  isMedicineActiveToday,
  isMissed,
  isUpcoming,
} from '../services/medicinesService.js';
import { getProfile } from '../services/healthService.js';

const QUICK_ACTIONS = [
  { route: '/sos',      label: 'Emergency SOS',   icon: 'sos'   },
  { route: '/medicines', label: 'Medicines',       icon: 'pill'  },
  { route: '/qr',       label: 'Health Card',      icon: 'qr'    },
  { route: '/contacts', label: 'Trusted Contacts', icon: 'users' },
  { route: '/ai-reader', label: 'AI Reader',       icon: 'ai'    },
];

export async function dashboardPage() {
  const root = h('div', { class: 'stack-lg' });
  root.append(spinner());

  try {
    const [medicines, todayLogs, healthProfile] = await Promise.all([
      listMedicines(),
      listTodayLogs(),
      getProfile(),
    ]);

    const takenIds = new Set(
      todayLogs.filter((l) => l.status === 'taken').map((l) => l.medicine_id)
    );

    const activeMeds = medicines.filter((m) => isMedicineActiveToday(m));
    const todayList = activeMeds;

    const upcomingMeds = activeMeds
      .filter((m) => isUpcoming(m, takenIds.has(m.id)))
      .sort((a, b) => (a.reminder_time || '').localeCompare(b.reminder_time || ''));

    const missedMeds = activeMeds.filter((m) => isMissed(m, takenIds.has(m.id)));

    const takenCount = activeMeds.filter((m) => takenIds.has(m.id)).length;
    const totalCount = activeMeds.length;
    const progressPct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

    clear(root);
    renderDashboard(root, { todayList, upcomingMeds, missedMeds, takenCount, totalCount, progressPct, takenIds, healthProfile });
  } catch (err) {
    clear(root);
    root.append(h('div', { class: 'card', style: { borderColor: 'var(--color-danger-500)' } },
      h('h3', { style: { color: 'var(--color-danger-600)' } }, 'Could not load dashboard'),
      h('p', { class: 'text-muted' }, err.message || 'Please try again.'),
      h('button', { class: 'btn btn-primary', style: { marginTop: 'var(--space-4)' }, onclick: () => navigate('/dashboard') }, 'Retry')
    ));
  }

  return dashboardLayout(root);
}

function renderDashboard(root, data) {
  const { todayList, upcomingMeds, missedMeds, takenCount, totalCount, progressPct, takenIds, healthProfile } = data;

  const header = h('div', { class: 'page-header' },
    h('h1', {}, 'Good day'),
    h('p', { class: 'text-muted' }, 'Here is your health at a glance.'),
    createReadButton(() => `Welcome. You have ${todayList.length} medicine${todayList.length !== 1 ? 's' : ''} scheduled today.`)
  );

  // Progress widget
  const progressWidget = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, "Today's Progress"),
      h('span', { class: 'badge badge-success' }, `${progressPct}%`)
    ),
    h('div', { style: { marginTop: 'var(--space-3)' } },
      h('div', { style: {
        height: '24px', borderRadius: 'var(--radius-full)',
        background: 'var(--color-gray-200)', overflow: 'hidden',
      } },
        h('div', { style: {
          height: '100%', width: `${progressPct}%`,
          background: 'linear-gradient(90deg, var(--color-secondary-500), var(--color-primary-500))',
          borderRadius: 'var(--radius-full)', transition: 'width 0.6s ease',
        } })
      ),
      h('p', { class: 'text-muted', style: { marginTop: 'var(--space-3)', fontSize: 'var(--font-size-lg)' } },
        h('strong', {}, `${takenCount}`), ` of ${totalCount} medicines taken today`
      )
    )
  );

  // Today's medicines widget
  const todayWidget = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, "Today's Medicines"),
      h('a', { href: '#/medicines', onclick: (e) => { e.preventDefault(); navigate('/medicines'); } }, 'View all')
    ),
    todayList.length === 0
      ? emptyState({ icon: '💊', title: 'No medicines today', message: 'Add your first medicine reminder.' })
      : h('div', { class: 'list' }, ...todayList.slice(0, 4).map((med) =>
          medListItem(med, takenIds.has(med.id))
        ))
  );

  // Upcoming reminders widget
  const upcomingWidget = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, 'Upcoming Reminders'),
      h('a', { href: '#/medicines', onclick: (e) => { e.preventDefault(); navigate('/medicines'); } }, 'View all')
    ),
    upcomingMeds.length === 0
      ? emptyState({ icon: '⏰', title: 'No upcoming reminders' })
      : h('div', { class: 'list' }, ...upcomingMeds.slice(0, 4).map((med) =>
          h('div', { class: 'list-item' },
            h('div', { class: 'feature-icon-wrap', style: { width: '40px', height: '40px', marginBottom: '0' } }, icon('pill')),
            h('div', { class: 'grow' },
              h('div', { style: { fontWeight: '700' } }, med.name),
              h('div', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
                formatTime(med.reminder_time), ' · ', timeFromNow(med.reminder_time ? `${med.reminder_time}` : new Date()))
            )
          )
        ))
  );

  // Missed medicines widget
  const missedWidget = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, 'Missed Medicines'),
      missedMeds.length > 0 ? h('span', { class: 'badge badge-danger' }, missedMeds.length) : null
    ),
    missedMeds.length === 0
      ? emptyState({ icon: '✅', title: 'No missed medicines', message: 'Great job staying on track!' })
      : h('div', { class: 'list' }, ...missedMeds.slice(0, 4).map((med) =>
          h('div', { class: 'list-item' },
            h('div', { class: 'feature-icon-wrap', style: { width: '40px', height: '40px', marginBottom: '0', background: 'var(--color-danger-500)' } }, icon('pill')),
            h('div', { class: 'grow' },
              h('div', { style: { fontWeight: '700' } }, med.name),
              h('div', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
                'Was due at ', formatTime(med.reminder_time))
            ),
            h('button', { class: 'btn btn-secondary btn-sm', onclick: () => navigate('/medicines') }, 'Take')
          )
        ))
  );

  // Emergency SOS widget
  const sos = h('div', { class: 'card widget' },
    h('h3', {}, 'Emergency SOS'),
    h('p', { class: 'text-muted' }, 'One tap alerts your trusted contacts.'),
    h('button', { class: 'sos-button', onclick: () => navigate('/sos') }, icon('sos'), 'SOS')
  );

  // Health profile card widget
  const profilePct = calcProfileCompletion(healthProfile);
  const health = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, 'Health Summary'),
      h('a', { href: '#/health', onclick: (e) => { e.preventDefault(); navigate('/health'); } }, healthProfile ? 'Edit' : 'Create')
    ),
    healthProfile
      ? h('div', { class: 'stack' },
          // Completion bar
          h('div', {},
            h('div', { class: 'row-between', style: { marginBottom: 'var(--space-2)' } },
              h('span', { class: 'text-muted' }, 'Profile Completion'),
              h('span', { class: profilePct === 100 ? 'badge badge-success' : 'badge badge-warning' }, `${profilePct}%`)
            ),
            h('div', { style: { height: '8px', borderRadius: '4px', background: 'var(--color-gray-200)', overflow: 'hidden' } },
              h('div', { style: {
                height: '100%', width: `${profilePct}%`,
                background: profilePct === 100 ? 'var(--color-secondary-500)' : 'var(--color-primary-600)',
                transition: 'width 0.5s ease',
              } })
            )
          ),
          h('div', { class: 'row-between' },
            h('span', { class: 'text-muted' }, 'Blood Group'),
            h('span', { class: 'badge badge-primary', style: { fontSize: 'var(--font-size-lg)' } }, healthProfile.blood_group || '—')
          ),
          h('div', { class: 'row-between' },
            h('span', { class: 'text-muted' }, 'Emergency Contact'),
            healthProfile.emergency_contact_name
              ? h('span', { style: { fontWeight: '700', textAlign: 'right' } },
                  healthProfile.emergency_contact_name,
                  healthProfile.emergency_contact_phone ? ` · ${healthProfile.emergency_contact_phone}` : '')
              : h('span', { class: 'badge badge-warning' }, 'Not set')
          ),
          h('div', { class: 'row-between' },
            h('span', { class: 'text-muted' }, 'Last Updated'),
            h('span', { class: 'text-muted' }, formatDate(healthProfile.updated_at))
          )
        )
      : emptyState({ icon: '❤️', title: 'Profile not set up', message: 'Add your medical details.' })
  );

  // QR health card widget
  const qrWidget = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, 'QR Health Card'),
      h('a', { href: '#/qr', onclick: (e) => { e.preventDefault(); navigate('/qr'); } }, 'Open')
    ),
    healthProfile
      ? h('div', { class: 'stack' },
          h('div', { class: 'row-between' },
            h('span', { class: 'text-muted' }, 'Status'),
            h('span', { class: 'badge badge-success' }, 'Available')
          ),
          h('p', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
            'Your QR health card is ready to scan and share.'),
          h('button', { class: 'btn btn-primary btn-block', onclick: () => navigate('/qr') },
            icon('qr'), 'View QR Card')
        )
      : h('div', { class: 'stack' },
          h('div', { class: 'row-between' },
            h('span', { class: 'text-muted' }, 'Status'),
            h('span', { class: 'badge badge-warning' }, 'Not Available')
          ),
          h('p', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
            'Create a health profile to generate your QR card.'),
          h('button', { class: 'btn btn-outline btn-block', onclick: () => navigate('/health') },
            'Create Profile')
        )
  );

  // Quick actions widget
  const quick = h('div', { class: 'card widget' },
    h('h3', {}, 'Quick Actions'),
    h('div', { class: 'grid grid-2' }, ...QUICK_ACTIONS.map((a) =>
      h('button', {
        class: 'btn btn-ghost card card-hover quick-action',
        onclick: () => navigate(a.route),
      }, h('div', { class: 'quick-action-icon' }, icon(a.icon)), h('div', { class: 'quick-action-label' }, a.label))
    ))
  );

  // Recent activity widget
  const activity = h('div', { class: 'card widget' },
    h('div', { class: 'widget-header' },
      h('h3', {}, 'Recent Activity'),
      h('a', { href: '#/medicines/history', onclick: (e) => { e.preventDefault(); navigate('/medicines/history'); } }, 'View all')
    ),
    emptyState({ icon: '📋', title: 'No recent activity' })
  );

  // AI assistant shortcut
  const ai = h('div', { class: 'card widget', style: { background: 'var(--color-primary-50)', borderColor: 'var(--color-primary-100)' } },
    h('div', { class: 'row-center' },
      h('div', { class: 'widget-icon' }, icon('ai')),
      h('div', { class: 'grow' },
        h('h3', {}, 'AI Medicine Reader'),
        h('p', { class: 'text-muted' }, 'Snap a photo and hear a simple explanation.')
      ),
      h('button', { class: 'btn btn-primary', onclick: () => navigate('/ai-reader') }, 'Open')
    )
  );

  root.append(header);
  root.append(h('div', { class: 'widget-grid' }, progressWidget, todayWidget, upcomingWidget, missedWidget));
  root.append(h('div', { class: 'widget-grid' }, sos, health, qrWidget));
  root.append(quick);
  root.append(h('div', { class: 'widget-grid' }, activity, ai));
}

function calcProfileCompletion(profile) {
  if (!profile) return 0;
  const fields = [
    'full_name', 'date_of_birth', 'blood_group',
    'allergies', 'conditions',
    'emergency_contact_name', 'emergency_contact_phone',
  ];
  const filled = fields.filter((f) => {
    const v = profile[f];
    if (v == null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  }).length;
  return Math.round((filled / fields.length) * 100);
}

function medListItem(med, isTaken) {
  return h('div', { class: 'list-item' },
    h('div', { class: 'feature-icon-wrap', style: {
      width: '40px', height: '40px', marginBottom: '0',
      background: isTaken ? 'var(--color-secondary-500)' : 'var(--color-primary-600)',
    } }, icon(isTaken ? 'check' : 'pill')),
    h('div', { class: 'grow' },
      h('div', { style: { fontWeight: '700' } }, med.name),
      h('div', { class: 'text-muted', style: { fontSize: 'var(--font-size-sm)' } },
        formatTime(med.reminder_time), med.dosage ? ` · ${med.dosage}` : '')
    ),
    isTaken
      ? h('span', { class: 'badge badge-success' }, 'Taken')
      : h('span', { class: 'badge badge-warning' }, 'Pending')
  );
}

function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}
