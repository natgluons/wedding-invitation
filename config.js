/* ------------------------------------------------------------------
   Wedding invitation settings
   Edit this one file, then reload the page. Nothing else needs changing.
------------------------------------------------------------------- */
window.WEDDING_CONFIG = {
  // Google Apps Script Web App URL (see README → "RSVP backend").
  // Leave blank to keep the form in preview mode: nothing is sent or saved.
  rsvpEndpoint: '',

  // Public address of the published invitation, used as the default base when
  // generating guest links with `node tools/generate-links.js`.
  // Example: 'https://yourname.github.io/wedding-invitation/'
  siteUrl: '',

  // Optional WhatsApp number for the "message us instead" fallback.
  // Country code, digits only, no plus sign. Example: '6281234567890'
  contactWhatsApp: ''
};
