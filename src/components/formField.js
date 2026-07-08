// components/formField.js — declarative form field builder.
// field({ label, name, type, value, placeholder, error, hint, options, required })

import { h } from '../utils/dom.js';

export function field({ label, name, type = 'text', value = '', placeholder = '', error = '', hint = '', options = null, required = false, rows = 4 }) {
  const group = h('div', { class: 'form-group' });
  group.append(h('label', { class: 'form-label', for: name }, label + (required ? ' *' : '')));

  let control;
  if (type === 'select') {
    control = h('select', { class: 'select', id: name, name, required });
    for (const opt of options || []) {
      const attrs = { value: opt.value };
      if (opt.value === value) attrs.selected = true;
      control.append(h('option', attrs, opt.label));
    }
  } else if (type === 'textarea') {
    control = h('textarea', { class: 'textarea', id: name, name, placeholder, required, rows }, value);
  } else {
    control = h('input', { class: 'input', id: name, name, type, value, placeholder, required });
  }
  if (error) control.setAttribute('aria-invalid', 'true');
  group.append(control);

  if (hint) group.append(h('div', { class: 'form-hint' }, hint));
  if (error) group.append(h('div', { class: 'form-error' }, error));
  return { group, control };
}

export function getFormData(form) {
  const data = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return data;
}
