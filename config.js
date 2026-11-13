/* ------------------------------------------------------------------
   Wedding invitation settings
   Edit this one file, then reload the page. Nothing else needs changing.
------------------------------------------------------------------- */
window.WEDDING_CONFIG = {
  // Google Apps Script Web App URL (see README → "RSVP backend").
  // Leave blank to keep the form in preview mode: nothing is sent or saved.
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfycbyqwO8aTk6kJJXZQpbFDJoFfIY3adJMOUPVsQq0yl-_Uy2cCsk0hhW-sT_vFX8uugL9/exec',

  // Fast opening check; Apps Script still authorizes saved data and submissions.
  validationEndpoint: 'https://wedding-invitation-validation.richardputra2910.workers.dev/validate',

  // Event start in ISO-8601 with the event's local offset (Asia/Jakarta).
  weddingDate: '2027-01-17T18:00:00+07:00',
  // Calendar events have no fixed end time because the invitation says "until finish".
  calendarEvents: [
    {id: 'ceremony', label: 'details.holy', start: '2027-01-17T11:00:00+07:00'},
    {id: 'reception', label: 'details.reception', start: '2027-01-17T18:00:00+07:00'}
  ],
  calendarLocation: 'Magnolia Ballroom, Grand Mercure Kemayoran, Jakarta, Indonesia',

  // Public address of the published invitation, used as the default base when
  // generating guest links with `node tools/generate-links.js`.
  // Example: 'https://yourname.github.io/wedding-invitation/'
  siteUrl: '',

  // Optional WhatsApp number for the "message us instead" fallback.
  // Country code, digits only, no plus sign. Example: '6281234567890'
  contactWhatsApp: ''
};
