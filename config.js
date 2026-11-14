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
  // The invitation says "until finish", so these end times are a reasonable
  // estimate that keeps calendar apps from rejecting an empty event duration.
  // `end` is optional: when omitted, `calendarDefaultMinutes` is used.
  calendarEvents: [
    {id: 'ceremony', label: 'details.holy', start: '2027-01-17T13:00:00+07:00', end: '2027-01-17T15:00:00+07:00'},
    {id: 'reception', label: 'details.reception', start: '2027-01-17T18:00:00+07:00', end: '2027-01-17T21:00:00+07:00'}
  ],
  calendarDefaultMinutes: 120,
  calendarTimeZone: 'Asia/Jakarta',
  calendarLocation: 'Magnolia Ballroom, Grand Mercure Kemayoran, Jakarta, Indonesia',
  calendarDetails: '',

  // Public address of the published invitation, used as the default base when
  // generating guest links with `node tools/generate-links.js`.
  // Example: 'https://yourname.github.io/wedding-invitation/'
  siteUrl: '',

  // Optional WhatsApp number for the "message us instead" fallback.
  // Country code, digits only, no plus sign. Example: '6281234567890'
  contactWhatsApp: ''
};
