/* Vowfable Maker's Note — safe, independent EN/ID translations.
   The existing invitation's main.js language switch updates <html lang="…">.
   Watching only this attribute keeps the new component independent of RSVP and wishes. */
(() => {
  'use strict';
  const copy = {
    en: {
      'vowfable.photoAlt': 'Richard and Natasha wearing traditional hanfu',
      'vowfable.photoCaption': 'A little piece of our story',
      'vowfable.eyebrow': 'A LITTLE NOTE FROM US',
      'vowfable.heading': 'Made with love, by us.',
      'vowfable.body': "We personally designed and built this wedding invitation, piece by piece, as a small part of our story. If you'd love something just as personal for your special day, we'd be delighted to create it with you.",
      'vowfable.studio': 'Bespoke Digital Wedding Invitations',
      'vowfable.credit': 'Made by',
      'vowfable.cta': 'Visit Our Studio',
      'vowfable.fineprint': 'Explore our designs, packages & details'
    },
    id: {
      'vowfable.photoAlt': 'Richard dan Natasha mengenakan busana hanfu tradisional',
      'vowfable.photoCaption': 'Sepenggal kecil kisah kami',
      'vowfable.eyebrow': 'PESAN KECIL DARI KAMI',
      'vowfable.heading': 'Dibuat sendiri, dengan cinta.',
      'vowfable.body': 'Undangan pernikahan ini kami rancang dan bangun sendiri, satu detail demi satu detail, sebagai bagian dari kisah kami. Jika Anda ingin undangan yang sama personalnya untuk hari istimewa Anda, kami dengan senang hati membantu mewujudkannya.',
      'vowfable.studio': 'Undangan Pernikahan Digital Custom',
      'vowfable.credit': 'Dibuat oleh',
      'vowfable.cta': 'Kunjungi Studio Kami',
      'vowfable.fineprint': 'Jelajahi desain, paket, dan informasi kami'
    }
  };
  function translate() {
    const lang = String(document.documentElement.lang || 'en').toLowerCase().startsWith('id') ? 'id' : 'en';
    const dict = copy[lang];
    const card = document.getElementById('vowfable-outro');
    if (!card) return;
    card.querySelectorAll('[data-vf-i18n]').forEach(el => {
      el.textContent = dict[el.dataset.vfI18n] || copy.en[el.dataset.vfI18n] || '';
    });
    card.querySelectorAll('[data-vf-alt]').forEach(el => {
      el.alt = dict[el.dataset.vfAlt] || copy.en[el.dataset.vfAlt] || '';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', translate, {once:true});
  else translate();
  new MutationObserver(translate).observe(document.documentElement, {attributes:true, attributeFilter:['lang','data-lang']});
})();
