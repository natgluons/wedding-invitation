(() => {
  const config = window.WEDDING_CONFIG || {};
  const MAX_SEATS = 6;
  const STORAGE_KEY = 'richard-natasha-rsvp';
  const WISH_KEY = 'richard-natasha-wishes';
  const seenWishes = new Set();

  const cover = document.getElementById('cover');
  const invitation = document.getElementById('invitation');
  const envelope = document.getElementById('envelope');
  const skipButton = document.getElementById('skipOpening');
  const openButtons = [document.getElementById('openLetter'), document.getElementById('openLetterButton')];
  let hasOpened = false;
  let openTimers = [];

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const music = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  const MUSIC_VOLUME = 0.5;
  let musicOn = true;
  let musicAvailable = Boolean(music);
  let musicFade = 0;

  function clearOpenTimers() {
    openTimers.forEach(window.clearTimeout);
    openTimers = [];
  }

  // The cover fades away while the invitation fades in beneath it, so the
  // guest never sees an empty screen between the letter and the content.
  function completeOpen() {
    clearOpenTimers();
    cover.hidden = true;
    cover.classList.remove('is-departing');
    invitation.hidden = false;
    if (musicAvailable) musicToggle.hidden = false;
    window.scrollTo({top: 0, behavior: 'instant'});
    if (typeof invitation.focus === 'function') invitation.focus({preventScroll: true});
  }

  function openInvitation(options = {}) {
    if (hasOpened) return;
    hasOpened = true;
    startMusic();
    for (const button of openButtons) button.disabled = true;

    if (options.instant || prefersReducedMotion()) {
      completeOpen();
      return;
    }

    envelope.classList.add('is-opening');
    openTimers.push(window.setTimeout(() => {
      invitation.hidden = false;
      cover.classList.add('is-departing');
    }, 1250));
    openTimers.push(window.setTimeout(completeOpen, 2050));
  }

  function skipOpening() {
    if (!hasOpened) {
      openInvitation({instant: true});
      return;
    }
    if (!cover.hidden) completeOpen();
  }

  for (const button of openButtons) button.addEventListener('click', () => openInvitation());
  if (skipButton) skipButton.addEventListener('click', skipOpening);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') skipOpening();
  });

  function updateMusicButton(playing) {
    if (!musicToggle) return;
    musicToggle.classList.toggle('is-paused', !playing);
    musicToggle.setAttribute('aria-pressed', String(playing));
    musicToggle.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  }

  function fadeMusic(target) {
    window.clearInterval(musicFade);
    musicFade = window.setInterval(() => {
      const diff = target - music.volume;
      if (Math.abs(diff) < 0.03) {
        music.volume = target;
        window.clearInterval(musicFade);
        return;
      }
      music.volume = Math.min(1, Math.max(0, music.volume + Math.sign(diff) * 0.03));
    }, 60);
  }

  // Browsers only allow sound after a tap, so this runs from the open button.
  function startMusic() {
    if (!music || !musicOn) return;
    music.volume = 0;
    const playback = music.play();
    if (playback && typeof playback.then === 'function') {
      playback
        .then(() => { fadeMusic(MUSIC_VOLUME); updateMusicButton(true); })
        .catch(() => updateMusicButton(false));
    } else {
      fadeMusic(MUSIC_VOLUME);
      updateMusicButton(true);
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (music.paused) {
        musicOn = true;
        startMusic();
      } else {
        musicOn = false;
        window.clearInterval(musicFade);
        music.pause();
        updateMusicButton(false);
      }
    });
  }

  if (music) {
    music.addEventListener('error', () => {
      musicAvailable = false;
      if (musicToggle) musicToggle.hidden = true;
    });
  }

  // ---------------------------------------------------------------------
  // One-time reveals while reading
  // Content stays visible without JavaScript; only `.motion-ready` hides
  // items until they are observed, and each item reveals once.
  // ---------------------------------------------------------------------
  const revealGroups = document.querySelectorAll('[data-reveal-group]');
  for (const group of revealGroups) {
    [...group.children].forEach((child, index) => {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--reveal-delay', `${Math.min(index * 80, 360)}ms`);
    });
  }

  const revealTargets = [...document.querySelectorAll('[data-reveal]')];

  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, {threshold: 0.16, rootMargin: '0px 0px -8% 0px'});
    for (const target of revealTargets) observer.observe(target);
  } else {
    for (const target of revealTargets) target.classList.add('is-visible');
  }

  const params = new URLSearchParams(window.location.search);
  const guestNameInput = document.getElementById('guestName');
  const guestCountSelect = document.getElementById('guestCount');
  const guestMessageInput = document.getElementById('guestMessage');
  const form = document.getElementById('rsvpForm');
  const formStatus = document.getElementById('formStatus');
  const submitButton = form.querySelector('.form-submit');
  const coverGuest = document.getElementById('coverGuest');
  const coverSeats = document.getElementById('coverSeats');
  const guestSeatNote = document.getElementById('guestSeatNote');
  const letterFor = document.getElementById('letterFor');
  const honeypot = document.getElementById('rsvpWebsite');

  const wishForm = document.getElementById('wishForm');
  const wishNameInput = document.getElementById('wishName');
  const wishMessageInput = document.getElementById('wishMessage');
  const wishStatus = document.getElementById('wishStatus');
  const wishList = document.getElementById('wishList');
  const wishesEmpty = document.getElementById('wishesEmpty');
  const wishSubmit = wishForm.querySelector('.form-submit');

  const clampSeats = (value) => Math.min(MAX_SEATS, Math.max(1, value));
  const backendEndpoint = () => (config.rsvpEndpoint || '').trim();

  function setStatus(element, message, state) {
    element.textContent = message;
    element.className = state ? `form-status is-${state}` : 'form-status';
  }

  // Reads `/alice` style links. Directory URLs (ending in /) are ignored so a
  // GitHub Pages project path is never mistaken for a guest name.
  function nameFromPath() {
    const pathname = window.location.pathname;
    if (!pathname || pathname.endsWith('/')) return '';
    let segment = pathname.slice(pathname.lastIndexOf('/') + 1);
    try {
      segment = decodeURIComponent(segment);
    } catch {}
    if (!segment || segment.includes('.')) return '';
    return segment;
  }

  // Restore a previous RSVP so guests can review or update it.
  function readSavedResponse() {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveResponse(payload) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({...payload, savedAt: Date.now()}));
    } catch {}
  }

  const saved = readSavedResponse();
  if (saved && saved.name) {
    guestNameInput.value = saved.name;
    if (saved.message) guestMessageInput.value = saved.message;
    if (saved.guests) guestCountSelect.value = String(clampSeats(Number(saved.guests) || 1));
    if (saved.attendance) {
      const input = form.querySelector(`input[name="attendance"][value="${saved.attendance}"]`);
      if (input) input.checked = true;
    }
    if (saved.events) {
      const input = form.querySelector(`input[name="events"][value="${saved.events}"]`);
      if (input) input.checked = true;
    }
    const when = new Date(saved.savedAt || Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    setStatus(formStatus, `You responded on ${when}. Submit again if you need to update your answer.`, 'saved');
  }

  // Personalised links:
  //   /alice                     -> "Dear Alice & Guest", 2 seats
  //   /alice?plus=0              -> "Dear Alice", 1 seat
  //   /alice?guests=3            -> "Dear Alice & Guests", 3 seats
  //   ?name=Alice / ?to=Alice    -> same as a path link
  const rawName = params.get('name') || params.get('to') || nameFromPath();
  const cleanName = rawName.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  // /alice and ?name=alice read better as "Alice"; mixed-case names are left alone.
  const invitedName = cleanName && cleanName === cleanName.toLowerCase()
    ? cleanName.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : cleanName;
  const requestedSeats = Number.parseInt(params.get('guests') || '', 10);

  if (invitedName) {
    const plusOne = params.get('plus') !== '0';
    const seats = Number.isFinite(requestedSeats)
      ? clampSeats(requestedSeats)
      : (plusOne ? 2 : 1);
    const guestLabel = seats === 1 ? '' : seats === 2 ? ' & Guest' : ' & Guests';

    coverGuest.hidden = false;
    coverGuest.textContent = `Dear ${invitedName}${guestLabel},`;
    coverSeats.hidden = false;
    coverSeats.textContent = `We have reserved ${seats} seat${seats === 1 ? '' : 's'} in your name`;
    letterFor.textContent = `For ${invitedName}`;

    guestNameInput.value = invitedName;
    guestCountSelect.value = String(seats);
    guestSeatNote.hidden = false;
    guestSeatNote.textContent = `Your invitation includes ${seats} seat${seats === 1 ? '' : 's'}.`;
    if (!wishNameInput.value) wishNameInput.value = invitedName;
  } else if (Number.isFinite(requestedSeats)) {
    guestCountSelect.value = String(clampSeats(requestedSeats));
  }

  // Countdown to the ceremony: Sunday, 17 January 2027, 18:00 WIB (UTC+7).
  const weddingDate = new Date('2027-01-17T18:00:00+07:00');
  const countdown = {
    days: document.getElementById('countDays'),
    hours: document.getElementById('countHours'),
    minutes: document.getElementById('countMinutes'),
    seconds: document.getElementById('countSeconds')
  };
  const pad = (value, length = 2) => String(value).padStart(length, '0');

  function updateCountdown() {
    const remaining = weddingDate.getTime() - Date.now();
    if (remaining <= 0) {
      countdown.days.textContent = '000';
      countdown.hours.textContent = countdown.minutes.textContent = countdown.seconds.textContent = '00';
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    countdown.days.textContent = pad(Math.floor(totalSeconds / 86400), 3);
    countdown.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    countdown.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    countdown.seconds.textContent = pad(totalSeconds % 60);
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Copy buttons for bank details.
  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    document.body.removeChild(area);
    return copied;
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {}
    }
    return fallbackCopy(text);
  }

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = document.getElementById(button.dataset.copy);
      if (!target) return;
      const original = button.textContent;
      const copied = await copyToClipboard(target.textContent.trim());
      button.textContent = copied ? 'Copied!' : 'Couldn’t copy';
      window.setTimeout(() => { button.textContent = original; }, 1600);
    });
  });

  // ---------------------------------------------------------------------
  // Backend helpers
  // ---------------------------------------------------------------------

  // Posts as text/plain so browsers skip the CORS preflight that Apps Script
  // cannot answer, then retries opaquely for endpoints without CORS headers.
  async function postToBackend(payload) {
    const endpoint = backendEndpoint();
    if (!endpoint) return {ok: false, reason: 'unconfigured'};

    const body = JSON.stringify(payload);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body
      });
      if (response.ok) {
        let result = null;
        try { result = await response.json(); } catch {}
        if (!result || result.ok !== false) return {ok: true};
      }
    } catch {}

    try {
      await fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body,
        keepalive: true
      });
      return {ok: true, opaque: true};
    } catch {
      return {ok: false, reason: 'network'};
    }
  }

  // Apps Script cannot set CORS headers reliably, so wishes are read with
  // JSONP there and with plain fetch for any other endpoint.
  function fetchWishes() {
    const endpoint = backendEndpoint();
    if (!endpoint) return Promise.resolve([]);
    if (/script\.google\.com/.test(endpoint)) return jsonpWishes(endpoint);

    const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=wishes`;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    return fetch(url, {signal: controller.signal})
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && Array.isArray(data.wishes) ? data.wishes : [])
      .catch(() => [])
      .finally(() => window.clearTimeout(timer));
  }

  function jsonpWishes(endpoint) {
    return new Promise((resolve) => {
      const callbackName = `weddingWishes_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement('script');
      let settled = false;

      const finish = (wishes) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        try { delete window[callbackName]; } catch {}
        script.remove();
        resolve(Array.isArray(wishes) ? wishes : []);
      };
      const timer = window.setTimeout(() => finish([]), 10000);

      window[callbackName] = (data) => finish(data && data.wishes);
      script.onerror = () => finish([]);
      script.src = `${endpoint}${endpoint.includes('?') ? '&' : '?'}action=wishes&callback=${callbackName}`;
      document.body.appendChild(script);
    });
  }

  // ---------------------------------------------------------------------
  // RSVP
  // ---------------------------------------------------------------------
  const attendanceInputs = form.querySelectorAll('input[name="attendance"]');
  const eventInputs = form.querySelectorAll('input[name="events"]');

  function syncAttendance() {
    const attending = form.querySelector('input[name="attendance"]:checked').value === 'attending';
    guestCountSelect.disabled = !attending;
    for (const input of eventInputs) input.disabled = !attending;
  }
  for (const input of attendanceInputs) input.addEventListener('change', syncAttendance);
  syncAttendance();

  function buildWhatsAppLink(payload) {
    const number = String(config.contactWhatsApp || '').replace(/\D/g, '');
    if (!number) return null;
    const eventLabels = {
      both: 'Holy Matrimony + Reception',
      'holy-matrimony': 'Holy Matrimony only',
      reception: 'Reception only'
    };
    const lines = [
      'RSVP for Richard & Natasha',
      `Name: ${payload.name}`,
      `Attendance: ${payload.attendance === 'attending' ? 'Attending' : 'Not attending'}`,
      payload.attendance === 'attending' ? `Events: ${eventLabels[payload.events] || eventLabels.both}` : null,
      payload.attendance === 'attending' ? `Guests: ${payload.guests}` : null,
      payload.message ? `Note: ${payload.message}` : null
    ].filter(Boolean);
    return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    // Honeypot: real guests never fill this field out.
    if (honeypot && honeypot.value.trim() !== '') {
      setStatus(formStatus, 'Thank you. Your RSVP has been received.', 'success');
      return;
    }

    const attending = form.querySelector('input[name="attendance"]:checked').value === 'attending';
    const payload = {
      type: 'rsvp',
      name: guestNameInput.value.trim().slice(0, 100),
      attendance: attending ? 'attending' : 'not-attending',
      events: attending ? form.querySelector('input[name="events"]:checked').value : '',
      guests: attending ? clampSeats(Number(guestCountSelect.value) || 1) : 0,
      message: guestMessageInput.value.trim().slice(0, 500),
      invitedAs: invitedName,
      submittedAt: new Date().toISOString(),
      page: window.location.href
    };

    const label = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    setStatus(formStatus, 'Sending your RSVP…', 'pending');

    const result = await postToBackend(payload);

    submitButton.disabled = false;
    submitButton.textContent = label;

    if (result.ok) {
      saveResponse(payload);
      setStatus(formStatus, 'Thank you, your RSVP has been received. We can’t wait to celebrate with you!', 'success');
      return;
    }

    if (result.reason === 'unconfigured') {
      setStatus(formStatus, 'Preview only: RSVP was not sent or saved. Add your Google Apps Script URL to config.js to start receiving responses.', 'error');
      return;
    }

    setStatus(formStatus, 'We couldn’t send your RSVP automatically. Please try again.', 'error');
    const whatsapp = buildWhatsAppLink(payload);
    if (whatsapp) {
      const link = document.createElement('a');
      link.href = whatsapp;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Message us on WhatsApp instead →';
      formStatus.append(' ', link);
    }
  });

  // ---------------------------------------------------------------------
  // Wishes / guestbook
  // ---------------------------------------------------------------------
  function readLocalWishes() {
    try {
      const list = JSON.parse(window.localStorage.getItem(WISH_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveLocalWish(wish) {
    const list = [wish, ...readLocalWishes()].slice(0, 50);
    try { window.localStorage.setItem(WISH_KEY, JSON.stringify(list)); } catch {}
    return list;
  }

  function formatWishDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
  }

  function renderWishes(wishes) {
    const seen = new Set();
    const visible = wishes
      .filter((wish) => wish && String(wish.message || '').trim() && String(wish.name || '').trim())
      .filter((wish) => {
        const key = `${wish.name}|${wish.message}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
      .slice(0, 30);

    wishList.textContent = '';
    wishesEmpty.hidden = visible.length > 0;

    for (const wish of visible) {
      const item = document.createElement('li');
      item.className = 'wish-item';

      const wishKey = `${String(wish.name).trim()}|${String(wish.message).trim()}`.toLowerCase();
      if (!seenWishes.has(wishKey) && !prefersReducedMotion()) {
        item.classList.add('wish-item--enter');
      }
      seenWishes.add(wishKey);

      const text = document.createElement('p');
      text.className = 'wish-text';
      text.textContent = `“${String(wish.message).trim()}”`;

      const meta = document.createElement('p');
      meta.className = 'wish-meta';
      const date = formatWishDate(wish.submittedAt);
      meta.textContent = date ? `${String(wish.name).trim()} · ${date}` : String(wish.name).trim();

      item.append(text, meta);
      wishList.append(item);
    }
  }

  async function loadWishes() {
    const local = readLocalWishes();
    if (local.length) renderWishes(local);
    const remote = await fetchWishes();
    renderWishes([...local, ...remote]);
  }

  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!wishForm.reportValidity()) return;

    const wish = {
      type: 'wish',
      name: wishNameInput.value.trim().slice(0, 60),
      message: wishMessageInput.value.trim().slice(0, 300),
      submittedAt: new Date().toISOString(),
      page: window.location.href
    };
    if (!wish.name || !wish.message) return;

    const label = wishSubmit.textContent;
    wishSubmit.disabled = true;
    wishSubmit.textContent = 'Sending your wish…';
    setStatus(wishStatus, 'Sending your wish…', 'pending');

    const result = await postToBackend(wish);

    wishSubmit.disabled = false;
    wishSubmit.textContent = label;

    if (result.ok) {
      const local = saveLocalWish(wish);
      renderWishes([...local, ...(await fetchWishes())]);
      wishMessageInput.value = '';
      setStatus(wishStatus, 'Thank you, your wish has been added to our letter.', 'success');
      return;
    }

    if (result.reason === 'unconfigured') {
      const local = saveLocalWish(wish);
      renderWishes(local);
      wishMessageInput.value = '';
      setStatus(wishStatus, 'Saved on this device only. Add your Google Apps Script URL to config.js so every guest’s wish is collected.', 'saved');
      return;
    }

    setStatus(wishStatus, 'We couldn’t send your wish. Please try again in a moment.', 'error');
  });

  loadWishes();
})();
