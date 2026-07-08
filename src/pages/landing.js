// pages/landing.js — public landing page (premium healthcare redesign).

import { h, icon } from '../utils/dom.js';
import { pageLayout } from '../components/pageLayout.js';
import { navigate } from '../router.js';
import toast from '../components/toast.js';

const FEATURES = [
  { icon: 'pill', title: 'Medicine Reminders', body: 'Never miss a dose. Set daily or weekly reminders with one tap.' },
  { icon: 'sos', title: 'Emergency SOS', body: 'One tap alerts your trusted contacts and shares your live location.' },
  { icon: 'heart', title: 'Health Profile', body: 'Keep your medical info in one safe, shareable digital health card.' },
  { icon: 'qr', title: 'QR Health Card', body: 'Generate and scan QR codes to share medical info instantly.' },
  { icon: 'ai', title: 'AI Medicine Reader', body: 'Snap a photo of any medicine and hear a simple explanation aloud.' },
  { icon: 'mic', title: 'Voice Friendly', body: 'Navigate and set reminders with your voice — built for seniors.' },
];

const STATS = [
  { n: '12k+', l: 'Seniors helped' },
  { n: '98%', l: 'Reminders on time' },
  { n: '24/7', l: 'Emergency ready' },
  { n: '4.9★', l: 'User rating' },
];

const TESTIMONIALS = [
  { quote: 'I never forget my BP tablets anymore. The big buttons and clear voice reminders make it so easy.', name: 'Lakshmi R.', role: 'Age 68, Hyderabad', color: 'var(--color-primary-600)' },
  { quote: 'The SOS button gives me peace of mind. My son gets my location instantly if I ever need help.', name: 'Ramesh K.', role: 'Age 72, Vijayawada', color: 'var(--color-secondary-600)' },
  { quote: 'I scanned my medicines and the AI explained them in simple words. It even read it aloud for me.', name: 'Saroja D.', role: 'Age 65, Guntur', color: 'var(--color-accent-500)' },
];

const FAQS = [
  { q: 'Is SeniorCare Connect free to use?', a: 'Yes. Creating an account and using the core features — medicine reminders, health profile, and emergency SOS — is free.' },
  { q: 'Do I need to be good with technology?', a: 'No. Every screen is designed for seniors: large fonts, big buttons, clear labels, and voice controls. If you can make a phone call, you can use SeniorCare.' },
  { q: 'Is my health information safe?', a: 'Yes. Your data is encrypted and only visible to you. We never share your information with anyone unless you choose to share your QR health card.' },
  { q: 'Can I use it in Telugu?', a: 'Telugu language support is coming soon. The app is already designed to be multilingual-ready.' },
  { q: 'Will it work on my phone?', a: 'SeniorCare Connect works in any web browser on your phone, tablet, or computer. An Android app is coming soon.' },
];

export function landingPage() {
  const root = h('div', { class: 'landing' });

  // Hero
  const hero = h('section', { class: 'hero' },
    h('div', { class: 'container hero-inner' },
      h('div', { class: 'hero-text' },
        h('span', { class: 'hero-badge' }, h('span', { class: 'dot' }), 'Trusted by families across India'),
        h('h1', { class: 'hero-title' }, 'Your health, ', h('span', { class: 'accent' }, 'simplified.')),
        h('p', { class: 'hero-subtitle' },
          'SeniorCare Connect helps you manage medicines, emergencies, and your health profile — designed to be easy to read and easy to use.'
        ),
        h('div', { class: 'hero-actions' },
          h('button', { class: 'btn btn-primary btn-lg', onclick: () => navigate('/register') }, icon('plus'), 'Get Started Free'),
          h('button', { class: 'btn btn-outline btn-lg', onclick: () => navigate('/login') }, 'Sign In')
        ),
        h('div', { class: 'hero-trust' },
          h('div', { class: 'avatars' },
            h('div', { class: 'avatar', style: { background: 'var(--color-primary-600)' } }, 'LR'),
            h('div', { class: 'avatar', style: { background: 'var(--color-secondary-600)' } }, 'RK'),
            h('div', { class: 'avatar', style: { background: 'var(--color-accent-500)' } }, 'SD'),
            h('div', { class: 'avatar', style: { background: 'var(--color-warning-500)' } }, '+')
          ),
          h('span', {}, 'Loved by 12,000+ seniors and their families')
        )
      ),
      h('div', { class: 'hero-visual' },
        h('div', { class: 'hero-blob b1' }),
        h('div', { class: 'hero-blob b2' }),
        h('div', { class: 'hero-card' },
          h('div', { class: 'ring' },
            h('div', { class: 'ring-inner' },
              h('div', { class: 'num' }, '72%'),
              h('div', { class: 'lbl' }, 'On-time doses')
            )
          ),
          h('div', { class: 'vitals' },
            h('div', { class: 'vital' }, h('div', { class: 'v' }, '120/80'), h('div', { class: 'k' }, 'Blood pressure')),
            h('div', { class: 'vital' }, h('div', { class: 'v' }, '8:00 PM'), h('div', { class: 'k' }, 'Next: BP tablet')),
            h('div', { class: 'vital' }, h('div', { class: 'v' }, 'O+'), h('div', { class: 'k' }, 'Blood group')),
            h('div', { class: 'vital' }, h('div', { class: 'v' }, 'Active'), h('div', { class: 'k' }, 'SOS ready'))
          )
        )
      )
    )
  );

  // Stats band
  const stats = h('section', { class: 'section', style: { paddingTop: '0' } },
    h('div', { class: 'container' },
      h('div', { class: 'stats-band reveal' }, ...STATS.map((s) =>
        h('div', { class: 'stat' }, h('div', { class: 'n' }, s.n), h('div', { class: 'l' }, s.l))
      ))
    )
  );

  // Features
  const features = h('section', { class: 'section' },
    h('div', { class: 'container' },
      h('div', { class: 'section-head reveal' },
        h('span', { class: 'section-eyebrow' }, 'Features'),
        h('h2', { class: 'section-title' }, 'Everything you need, nothing you don\'t'),
        h('p', { class: 'section-sub' }, 'Six thoughtful tools that work together to keep you safe and healthy.')
      ),
      h('div', { class: 'grid grid-3' }, ...FEATURES.map((f) =>
        h('div', { class: 'feature-card reveal' },
          h('div', { class: 'feature-icon-wrap' }, icon(f.icon)),
          h('h3', {}, f.title),
          h('p', {}, f.body)
        )
      ))
    )
  );

  // Testimonials
  const testimonials = h('section', { class: 'section', style: { background: 'var(--bg-subtle)' } },
    h('div', { class: 'container' },
      h('div', { class: 'section-head reveal' },
        h('span', { class: 'section-eyebrow' }, 'Testimonials'),
        h('h2', { class: 'section-title' }, 'Seniors and families trust us'),
        h('p', { class: 'section-sub' }, 'Real stories from people who use SeniorCare Connect every day.')
      ),
      h('div', { class: 'grid grid-3' }, ...TESTIMONIALS.map((t) =>
        h('div', { class: 'testi-card reveal' },
          h('div', { class: 'testi-stars' }, '★★★★★'),
          h('p', { class: 'testi-quote' }, `"${t.quote}"`),
          h('div', { class: 'testi-author' },
            h('div', { class: 'avatar', style: { background: t.color } }, t.name.split(' ').map((w) => w[0]).join('')),
            h('div', {}, h('div', { class: 'name' }, t.name), h('div', { class: 'role' }, t.role))
          )
        )
      ))
    )
  );

  // FAQ
  const faq = h('section', { class: 'section' },
    h('div', { class: 'container', style: { maxWidth: '760px' } },
      h('div', { class: 'section-head reveal' },
        h('span', { class: 'section-eyebrow' }, 'FAQ'),
        h('h2', { class: 'section-title' }, 'Questions, answered'),
        h('p', { class: 'section-sub' }, 'Everything you want to know before you get started.')
      ),
      h('div', { class: 'reveal' }, ...FAQS.map((f, i) => {
        const item = h('div', { class: 'faq-item' },
          h('button', { class: 'faq-q', onclick: () => item.classList.toggle('open') },
            f.q,
            h('span', { class: 'chev' }, '⌄')
          ),
          h('div', { class: 'faq-a' }, h('p', {}, f.a))
        );
        return item;
      }))
    )
  );

  // Contact
  const contact = h('section', { class: 'section', style: { background: 'var(--bg-subtle)' } },
    h('div', { class: 'container' },
      h('div', { class: 'section-head reveal' },
        h('span', { class: 'section-eyebrow' }, 'Contact'),
        h('h2', { class: 'section-title' }, 'We are here for you'),
        h('p', { class: 'section-sub' }, 'Have a question or need help getting started? Reach out anytime.')
      ),
      h('div', { class: 'contact-band reveal' },
        h('div', {},
          h('div', { class: 'contact-info-item' },
            h('div', { class: 'ico' }, icon('mail')),
            h('div', {}, h('div', { style: { fontWeight: '700' } }, 'Email us'), h('div', { class: 'text-muted' }, 'support@seniorcareconnect.app'))
          ),
          h('div', { class: 'contact-info-item' },
            h('div', { class: 'ico' }, icon('info')),
            h('div', {}, h('div', { style: { fontWeight: '700' } }, 'Support hours'), h('div', { class: 'text-muted' }, 'Monday to Friday, 9am to 6pm'))
          ),
          h('div', { class: 'contact-info-item' },
            h('div', { class: 'ico' }, icon('heart')),
            h('div', {}, h('div', { style: { fontWeight: '700' } }, 'Emergency'), h('div', { class: 'text-muted' }, 'Use the SOS button in the app for emergencies'))
          )
        ),
        h('div', {},
          h('form', { class: 'stack', onsubmit: (e) => {
            e.preventDefault();
            toast.success('Message sent', 'We will reply soon.');
            e.target.reset();
          } },
            h('input', { class: 'input', placeholder: 'Your name', required: true, name: 'name' }),
            h('input', { class: 'input', type: 'email', placeholder: 'Email address', required: true, name: 'email' }),
            h('textarea', { class: 'textarea', placeholder: 'How can we help?', required: true, name: 'message' }),
            h('button', { class: 'btn btn-primary btn-block btn-lg', type: 'submit' }, 'Send Message')
          )
        )
      )
    )
  );

  // CTA
  const cta = h('section', { class: 'section', style: { paddingTop: '0' } },
    h('div', { class: 'container' },
      h('div', { class: 'cta-band reveal' },
        h('h2', {}, 'Ready to take control of your health?'),
        h('p', {}, 'Join SeniorCare Connect today. It only takes a minute to get started.'),
        h('button', { class: 'btn btn-secondary btn-lg', onclick: () => navigate('/register') }, icon('plus'), 'Create your free account')
      )
    )
  );

  root.append(hero, stats, features, testimonials, faq, contact, cta);

  // Reveal-on-scroll observer (attached after render).
  requestAnimationFrame(() => {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
    root.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  });

  return pageLayout(root);
}
