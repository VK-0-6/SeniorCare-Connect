// src/pages/trustedContacts.js — Trusted Contacts page.

import { h, icon } from '../utils/dom.js';
import { dashboardLayout } from '../components/pageLayout.js';
import { createReadButton } from '../services/voiceService.js';
import { spinner } from '../components/spinner.js';
import { emptyState } from '../components/emptyState.js';
import { field } from '../components/formField.js';
import { openModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { listContacts, createContact, updateContact, deleteContact } from '../services/contactsService.js';

export function trustedContactsPage() {
  const listContainer = h('div', { class: 'stack' });

  async function loadContacts() {
    while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
    listContainer.appendChild(spinner());

    try {
      const contacts = await listContacts();
      while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);

      if (!contacts || contacts.length === 0) {
        listContainer.appendChild(
          emptyState({
            title: 'No trusted contacts',
            message: 'Add family members or friends who should be notified in case of an emergency.',
            icon: '👥',
          })
        );
        return;
      }

      contacts.forEach((contact) => {
        const contactCard = h('div', { class: 'card' },
          h('div', { class: 'row-between' },
            h('div', { class: 'stack' },
              h('h3', { style: { marginBottom: '0' } }, contact.name),
              h('p', { class: 'text-muted', style: { marginBottom: 'var(--space-2)' } },
                contact.relationship || 'Emergency Contact'),
              h('a', {
                href: `tel:${contact.phone}`,
                class: 'row-center',
                style: { gap: 'var(--space-2)', color: 'var(--color-primary-600)', fontWeight: '700', textDecoration: 'none' },
              },
                icon('phone'),
                h('span', {}, contact.phone)
              )
            ),
            h('div', { class: 'row', style: { gap: 'var(--space-2)', alignItems: 'flex-start' } },
              h('button', {
                class: 'btn btn-outline',
                title: 'Edit contact',
                onclick: () => openContactModal(contact),
              }, 'Edit'),
              h('button', {
                class: 'btn btn-ghost',
                style: { color: 'var(--color-danger-600)' },
                title: 'Delete contact',
                onclick: async () => {
                  const ok = await confirmDialog({
                    title: 'Delete contact?',
                    message: `Are you sure you want to remove "${contact.name}"? This cannot be undone.`,
                    confirmLabel: 'Delete',
                    danger: true,
                  });
                  if (!ok) return;
                  try {
                    await deleteContact(contact.id);
                    toast.success('Contact Deleted', `${contact.name} has been removed.`);
                    loadContacts();
                  } catch (err) {
                    toast.error('Delete failed', err.message);
                  }
                },
              }, icon('trash'), ' Delete')
            )
          )
        );
        listContainer.appendChild(contactCard);
      });
    } catch (error) {
      while (listContainer.firstChild) listContainer.removeChild(listContainer.firstChild);
      listContainer.appendChild(
        h('div', { class: 'card' },
          h('p', { class: 'text-muted' }, 'Failed to load contacts. Please refresh the page.')
        )
      );
    }
  }

  function openContactModal(contact = null) {
    const isEdit = !!contact;

    const nameField = field({ label: 'Full Name', name: 'name', placeholder: 'e.g. Jane Doe', required: true });
    const relationshipField = field({ label: 'Relationship', name: 'relationship', placeholder: 'e.g. Daughter, Neighbour', required: true });
    const phoneField = field({ label: 'Phone Number', name: 'phone', type: 'tel', placeholder: 'e.g. +91 98765 43210', required: true });

    if (isEdit) {
      nameField.control.value = contact.name || '';
      relationshipField.control.value = contact.relationship || '';
      phoneField.control.value = contact.phone || '';
    }

    const form = h('form', { class: 'stack' },
      nameField.group,
      relationshipField.group,
      phoneField.group
    );

    openModal({
      title: isEdit ? 'Edit Trusted Contact' : 'Add Trusted Contact',
      content: form,
      actions: [
        {
          label: isEdit ? 'Update Contact' : 'Save Contact',
          variant: 'primary',
          onClick: async ({ close }) => {
            const formData = new FormData(form);
            const contactData = {
              name: formData.get('name')?.trim(),
              relationship: formData.get('relationship')?.trim(),
              phone: formData.get('phone')?.trim(),
            };

            if (!contactData.name || !contactData.relationship || !contactData.phone) {
              toast.error('Validation Error', 'Please fill in all required fields.');
              return;
            }

            try {
              if (isEdit) {
                await updateContact(contact.id, contactData);
                toast.success('Contact Updated', `${contactData.name} has been saved.`);
              } else {
                await createContact(contactData);
                toast.success('Contact Added', `${contactData.name} has been added.`);
              }
              loadContacts();
              close();
            } catch (error) {
              toast.error('Error', isEdit ? 'Failed to update contact.' : 'Failed to save contact.');
            }
          },
        },
      ],
    });
  }

  // Initial load
  loadContacts();

  const content = h('div', { class: 'stack-lg' },
    h('div', { class: 'page-header' },
      h('div', {},
        h('div', { class: 'row-center' },
          h('div', { class: 'widget-icon' }, icon('users')),
          h('h1', {}, 'Trusted Contacts')
        ),
        h('p', { class: 'text-muted' }, 'Your emergency circle')
      ),
      h('button', {
        class: 'btn btn-primary btn-lg',
        onclick: () => openContactModal(),
      }, icon('plus'), h('span', {}, 'Add Contact')),
      createReadButton(async () => {
        const contacts = await listContacts();
        return `You have ${contacts.length} trusted contact${contacts.length !== 1 ? 's' : ''} in your emergency circle.`;
      })
    ),
    listContainer
  );

  return dashboardLayout(content);
}
