// pages/health.js — Health Profile module (full implementation).
// View, create, and edit a single health profile per user.
// Uses existing reusable components: formField, modal, emptyState, spinner, toast.

import { h, icon, clear } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { field, getFormData } from '../components/formField.js';
import { openModal } from '../components/modal.js';
import { emptyState } from '../components/emptyState.js';
import { spinner } from '../components/spinner.js';
import toast from '../components/toast.js';
import { navigate } from '../router.js';
import { formatDate } from '../utils/format.js';
import {
  getProfile,
  upsertProfile,
  calculateAge,
  parseList,
  listToString,
} from '../services/healthService.js';

const GENDER_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export async function healthPage() {
  const root = h('div', { class: 'stack-lg' });
  root.append(spinner());

  try {
    const profile = await getProfile();
    clear(root);
    if (profile) {
      renderViewMode(root, profile);
    } else {
      renderEmpty(root);
    }
  } catch (err) {
    clear(root);
    root.append(errorCard(err));
  }

  return dashboardLayout(root);
}

// ── Empty state (no profile yet) ──────────────────────

function renderEmpty(root) {
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-center' },
      h('div', { class: 'widget-icon' }, icon('heart')),
      h('h1', {}, 'Health Profile')
    ),
    h('p', { class: 'text-muted' }, 'Store your medical details and generate a digital health card.')
  );
  root.append(header);

  root.append(emptyState({
    icon: '❤️',
    title: 'No health profile yet',
    message: 'Create your health profile to keep your medical information safe and accessible.',
    action: h('button', { class: 'btn btn-primary btn-lg', onclick: () => openForm(root, null) },
      icon('plus'), 'Create Profile'),
  }));
}

// ── View mode (profile exists) ────────────────────────

function renderViewMode(root, profile) {
  const age = profile.age || calculateAge(profile.date_of_birth);
  const header = h('div', { class: 'page-header' },
    h('div', { class: 'row-between' },
      h('div', {},
        h('div', { class: 'row-center' },
          h('div', { class: 'widget-icon' }, icon('heart')),
          h('h1', {}, 'Health Profile')
        ),
        h('p', { class: 'text-muted' }, `Last updated ${formatDate(profile.updated_at)}`)
      ),
      h('button', { class: 'btn btn-primary btn-lg', onclick: () => openForm(root, profile) },
        icon('settings'), 'Edit Profile')
    )
  );
  root.append(header);

  // Personal information card
  root.append(sectionCard('Personal Information', [
    row('Full Name', profile.full_name),
    row('Date of Birth', profile.date_of_birth ? formatDate(profile.date_of_birth) : null),
    row('Age', age != null ? `${age} years` : null),
    row('Gender', profile.gender ? capitalize(profile.gender) : null),
    row('Blood Group', profile.blood_group),
    row('Height', profile.height),
    row('Weight', profile.weight),
  ]));

  // Medical information card
  root.append(sectionCard('Medical Information', [
    row('Allergies', profile.allergies?.length ? profile.allergies.join(', ') : null),
    row('Existing Conditions', profile.medical_conditions?.length ? profile.medical_conditions.join(', ') : null),
    row('Current Medications', profile.current_medications?.length ? profile.current_medications.join(', ') : null),
    row('Disabilities', profile.disabilities?.length ? profile.disabilities.join(', ') : null),
    row('Notes', profile.notes),
  ]));

  // Emergency information card
  root.append(sectionCard('Emergency Information', [
    row('Emergency Contact', profile.emergency_contact_name),
    row('Relationship', profile.emergency_contact_relationship),
    row('Phone Number', profile.emergency_contact_phone),
    row('Family Doctor', profile.doctor_name),
    row('Doctor Phone', profile.doctor_phone),
  ]));

  // Optional information card
  root.append(sectionCard('Insurance Information', [
    row('Insurance Provider', profile.insurance_provider),
    row('Policy Number', profile.insurance_number),
  ]));
}

// ── Form (create / edit) ──────────────────────────────

function openForm(root, profile) {
  const isEdit = !!profile;
  const form = h('form', { class: 'stack' });

  // Personal
  const fullName = field({ label: 'Full Name', name: 'full_name', value: profile?.full_name || '', placeholder: 'e.g. Ramesh Kumar', required: true });
  const dob = field({ label: 'Date of Birth', name: 'date_of_birth', type: 'date', value: profile?.date_of_birth || '', hint: 'Age is calculated automatically.' });
  const gender = field({ label: 'Gender', name: 'gender', type: 'select', value: profile?.gender || '', options: GENDER_OPTIONS });
  const bloodGroup = field({ label: 'Blood Group', name: 'blood_group', type: 'select', value: profile?.blood_group || '', options: BLOOD_GROUP_OPTIONS, required: true });
  const height = field({ label: 'Height', name: 'height', value: profile?.height || '', placeholder: 'e.g. 5\'6" or 168 cm' });
  const weight = field({ label: 'Weight', name: 'weight', value: profile?.weight || '', placeholder: 'e.g. 70 kg' });

  // Medical
  const allergies = field({ label: 'Allergies', name: 'allergies', value: listToString(profile?.allergies), placeholder: 'Comma-separated, e.g. Penicillin, Dust' });
  const conditions = field({ label: 'Existing Medical Conditions', name: 'medical_conditions', value: listToString(profile?.medical_conditions), placeholder: 'Comma-separated, e.g. Diabetes, Hypertension' });
  const medications = field({ label: 'Current Medications', name: 'current_medications', value: listToString(profile?.current_medications), placeholder: 'Comma-separated, e.g. Metformin, Insulin' });
  const disabilities = field({ label: 'Disabilities (optional)', name: 'disabilities', value: listToString(profile?.disabilities), placeholder: 'Comma-separated, e.g. Hearing impairment' });
  const notes = field({ label: 'Notes', name: 'notes', type: 'textarea', value: profile?.notes || '', placeholder: 'Any additional health notes...', rows: 3 });

  // Emergency
  const ecName = field({ label: 'Emergency Contact Name', name: 'emergency_contact_name', value: profile?.emergency_contact_name || '', placeholder: 'e.g. Suresh Kumar', required: true });
  const ecRel = field({ label: 'Relationship', name: 'emergency_contact_relationship', value: profile?.emergency_contact_relationship || '', placeholder: 'e.g. Son, Spouse' });
  const ecPhone = field({ label: 'Phone Number', name: 'emergency_contact_phone', value: profile?.emergency_contact_phone || '', placeholder: 'e.g. 9876543210', required: true });
  const docName = field({ label: 'Family Doctor Name', name: 'doctor_name', value: profile?.doctor_name || '', placeholder: 'e.g. Dr. Sharma' });
  const docPhone = field({ label: 'Doctor Phone Number', name: 'doctor_phone', value: profile?.doctor_phone || '', placeholder: 'e.g. 9876543210' });

  // Insurance
  const insProvider = field({ label: 'Insurance Provider', name: 'insurance_provider', value: profile?.insurance_provider || '', placeholder: 'e.g. Star Health' });
  const insNumber = field({ label: 'Insurance Policy Number', name: 'insurance_number', value: profile?.insurance_number || '', placeholder: 'e.g. POL/2024/123456' });

  form.append(
    sectionLabel('Personal Information'),
    fullName.group,
    h('div', { class: 'grid grid-2' }, dob.group, gender.group),
    h('div', { class: 'grid grid-3' }, bloodGroup.group, height.group, weight.group),

    sectionLabel('Medical Information'),
    allergies.group,
    conditions.group,
    medications.group,
    disabilities.group,
    notes.group,

    sectionLabel('Emergency Information'),
    ecName.group,
    h('div', { class: 'grid grid-2' }, ecRel.group, ecPhone.group),
    h('div', { class: 'grid grid-2' }, docName.group, docPhone.group),

    sectionLabel('Insurance Information (Optional)'),
    h('div', { class: 'grid grid-2' }, insProvider.group, insNumber.group),
  );

  const submitBtn = h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' },
    isEdit ? 'Save Changes' : 'Create Profile');
  form.append(submitBtn);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = getFormData(form);

    const errors = validate(data);
    if (errors.length) {
      toast.error('Please fix the following', errors.join(' · '));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.replaceChildren(spinner(false));

    const payload = {
      full_name: data.full_name.trim(),
      date_of_birth: data.date_of_birth || null,
      age: calculateAge(data.date_of_birth),
      gender: data.gender || null,
      blood_group: data.blood_group,
      height: data.height?.trim() || null,
      weight: data.weight?.trim() || null,
      allergies: parseList(data.allergies),
      medical_conditions: parseList(data.medical_conditions),
      current_medications: parseList(data.current_medications),
      disabilities: parseList(data.disabilities),
      notes: data.notes?.trim() || null,
      emergency_contact_name: data.emergency_contact_name.trim(),
      emergency_contact_relationship: data.emergency_contact_relationship?.trim() || null,
      emergency_contact_phone: data.emergency_contact_phone.trim(),
      doctor_name: data.doctor_name?.trim() || null,
      doctor_phone: data.doctor_phone?.trim() || null,
      insurance_provider: data.insurance_provider?.trim() || null,
      insurance_number: data.insurance_number?.trim() || null,
    };

    try {
      await upsertProfile(payload);
      toast.success(isEdit ? 'Profile Updated' : 'Profile Created',
        isEdit ? 'Your health profile has been saved.' : 'Your health profile is now set up.');
      modal.close();
      await reload(root);
    } catch (err) {
      toast.error('Save failed', err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Save Changes' : 'Create Profile';
    }
  });

  const modal = openModal({
    title: isEdit ? 'Edit Health Profile' : 'Create Health Profile',
    content: form,
    actions: [],
  });
}

function validate(data) {
  const errors = [];
  if (!data.full_name?.trim()) errors.push('Full name is required');
  if (!data.blood_group) errors.push('Blood group is required');
  if (!data.emergency_contact_name?.trim()) errors.push('Emergency contact name is required');
  if (!data.emergency_contact_phone?.trim()) errors.push('Emergency contact phone is required');
  if (data.date_of_birth) {
    const dob = new Date(data.date_of_birth);
    if (isNaN(dob.getTime())) errors.push('Invalid date of birth');
    else if (dob > new Date()) errors.push('Date of birth cannot be in the future');
  }
  return errors;
}

// ── Shared render helpers ─────────────────────────────

function sectionCard(title, rows) {
  const items = rows.filter((r) => r.value != null && r.value !== '');
  return h('div', { class: 'card' },
    h('h3', { style: { marginBottom: 'var(--space-4)' } }, title),
    items.length === 0
      ? h('p', { class: 'text-muted' }, 'Not provided')
      : h('div', { class: 'stack' }, ...items.map((r) =>
          h('div', { class: 'row-between', style: { paddingBlock: 'var(--space-2)', borderBottom: '1px solid var(--border)' } },
            h('span', { class: 'text-muted' }, r.label),
            h('span', { style: { fontWeight: '700', textAlign: 'right' } }, r.value)
          )
        ))
  );
}

function row(label, value) {
  return { label, value };
}

function sectionLabel(text) {
  return h('div', { style: {
    fontWeight: '700', fontSize: 'var(--font-size-lg)',
    color: 'var(--color-primary-700)',
    marginTop: 'var(--space-2)', marginBottom: 'var(--space-1)',
  } }, text);
}

function errorCard(err) {
  return h('div', { class: 'card', style: { borderColor: 'var(--color-danger-500)' } },
    h('h3', { style: { color: 'var(--color-danger-600)' } }, 'Could not load profile'),
    h('p', { class: 'text-muted' }, err.message || 'Please try again.'),
    h('button', { class: 'btn btn-primary', style: { marginTop: 'var(--space-4)' }, onclick: () => navigate('/health') }, 'Retry')
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

async function reload(root) {
  clear(root);
  root.append(spinner());
  try {
    const profile = await getProfile();
    clear(root);
    if (profile) renderViewMode(root, profile);
    else renderEmpty(root);
  } catch (err) {
    clear(root);
    root.append(errorCard(err));
  }
}
