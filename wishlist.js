(() => {
  const config = window.WEDDING_CONFIG || {};
  const LANG_KEY = 'richard-natasha-lang';
  const params = new URLSearchParams(window.location.search);
  const inviteCode = (params.get('code') || '').trim();
  const VALID_CODE = /^[a-zA-Z0-9]{8,64}$/;

  const translations = {
    en: {
      'meta.title': 'Wishlist · Richard & Natasha',
      'wishlist.intro': 'WITH GRATITUDE',
      'wishlist.title': 'Wedding Wishlist',
      'wishlist.body': 'Should you wish to bless us with a gift, here are a few things that would help us begin our home together. Claiming an item simply lets other guests know it is already taken care of.',
      'wishlist.back': 'Back to invitation',
      'wishlist.toGift': 'Other ways to give',
      'wishlist.empty': 'The wishlist is being prepared.',
      'wishlist.note': 'Changed your mind? You can release an item you claimed so another guest may choose it.',
      'wishlist.cancel': 'Cancel',
      'wishlist.loading': 'Opening the wishlist…',
      'wishlist.error': 'The wishlist could not be loaded just now.',
      'wishlist.retry': 'Try again',
      'wishlist.needsInvite': 'Open your personal invitation link to see and claim gifts.',
      'wishlist.invalidInvite': 'This invitation link is not recognised.',
      'wishlist.progress': '{taken} of {total} gifts claimed',
      'wishlist.claim': 'Claim this gift',
      'wishlist.claimAria': 'Claim {name}',
      'wishlist.releaseAria': 'Release {name}',
      'wishlist.taken': 'Taken',
      'wishlist.claimedByYou': 'Claimed by you',
      'wishlist.release': 'Release',
      'wishlist.viewStore': 'View item',
      'wishlist.claimTitle': 'Claim this gift?',
      'wishlist.claimBody': 'That tells other guests {name} is already taken care of. You can release it later if you change your mind.',
      'wishlist.claimConfirm': 'Yes, claim it',
      'wishlist.releaseTitle': 'Release this gift?',
      'wishlist.releaseBody': 'This makes {name} available to other guests again.',
      'wishlist.releaseConfirm': 'Release it',
      'wishlist.claimDone': 'Thank you. {name} is noted as yours.',
      'wishlist.releaseDone': '{name} is available for other guests again.',
      'wishlist.alreadyTaken': 'Another guest just claimed {name}.',
      'wishlist.failed': 'That did not go through. Please try again.'
    },
    id: {
      'meta.title': 'Daftar Hadiah · Richard & Natasha',
      'wishlist.intro': 'DENGAN RASA SYUKUR',
      'wishlist.title': 'Daftar Hadiah',
      'wishlist.body': 'Jika ingin memberikan hadiah, berikut beberapa hal yang akan membantu kami memulai rumah pertama. Menandai suatu hadiah hanya memberi tahu tamu lain bahwa hadiah tersebut sudah dipenuhi.',
      'wishlist.back': 'Kembali ke undangan',
      'wishlist.toGift': 'Cara lain memberi hadiah',
      'wishlist.empty': 'Daftar hadiah sedang disiapkan.',
      'wishlist.note': 'Berubah pikiran? Anda dapat melepas hadiah yang sudah Anda tandai agar tamu lain bisa memilihnya.',
      'wishlist.cancel': 'Batal',
      'wishlist.loading': 'Membuka daftar hadiah…',
      'wishlist.error': 'Daftar hadiah belum dapat dimuat saat ini.',
      'wishlist.retry': 'Coba lagi',
      'wishlist.needsInvite': 'Buka tautan undangan pribadi Anda untuk melihat dan menandai hadiah.',
      'wishlist.invalidInvite': 'Tautan undangan ini tidak dikenali.',
      'wishlist.progress': '{taken} dari {total} hadiah sudah ditandai',
      'wishlist.claim': 'Tandai hadiah ini',
      'wishlist.claimAria': 'Tandai {name}',
      'wishlist.releaseAria': 'Lepas {name}',
      'wishlist.taken': 'Sudah diambil',
      'wishlist.claimedByYou': 'Anda tandai',
      'wishlist.release': 'Lepas',
      'wishlist.viewStore': 'Lihat barang',
      'wishlist.claimTitle': 'Tandai hadiah ini?',
      'wishlist.claimBody': 'Ini memberi tahu tamu lain bahwa {name} sudah dipenuhi. Anda bisa melepasnya nanti jika berubah pikiran.',
      'wishlist.claimConfirm': 'Ya, tandai',
      'wishlist.releaseTitle': 'Lepas hadiah ini?',
      'wishlist.releaseBody': 'Ini membuat {name} tersedia lagi untuk tamu lain.',
      'wishlist.releaseConfirm': 'Lepas hadiah',
      'wishlist.claimDone': 'Terima kasih. {name} tercatat untuk Anda.',
      'wishlist.releaseDone': '{name} kembali tersedia untuk tamu lain.',
      'wishlist.alreadyTaken': 'Tamu lain baru saja menandai {name}.',
      'wishlist.failed': 'Belum berhasil. Silakan coba lagi.'
    }
  };

  function detectLanguage() {
    const param = (params.get('lang') || params.get('language') || '').toLowerCase();
    if (param === 'en' || param === 'id') return param;
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored === 'en' || stored === 'id') return stored;
    } catch {}
    return 'en';
  }

  let currentLang = detectLanguage();
  const t = key => (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
  const fill = (template, vars) => String(template).replace(/\{(\w+)\}/g, (match, key) => (key in vars ? vars[key] : match));

  const grid = document.getElementById('wishlistGrid');
  const statusBox = document.getElementById('wishlistStatus');
  const emptyBox = document.getElementById('wishlistEmpty');
  const noteBox = document.getElementById('wishlistNote');
  const progressBox = document.getElementById('wishlistProgress');
  const dialog = document.getElementById('claimDialog');
  const dialogTitle = dialog.querySelector('#claimTitle');
  const dialogText = dialog.querySelector('#claimText');
  const dialogConfirm = dialog.querySelector('#claimConfirm');
  const dialogCancel = dialog.querySelector('#claimCancel');

  // The invitation carries `?code=`; keep it on every link we generate so the
  // guest never loses their identity by navigating around the site. The hash
  // (e.g. `#gift`) is preserved, because it is where the guest should land.
  function withCode(href) {
    const url = new URL(href, window.location.href);
    if (inviteCode) url.searchParams.set('code', inviteCode);
    url.searchParams.set('lang', currentLang);
    return url.pathname + url.search + url.hash;
  }

  let wishlist = null;
  let loadState = 'loading';

  const workerBase = () => String(config.validationEndpoint || '').trim();
  const backendEndpoint = () => String(config.rsvpEndpoint || '').trim();

  // Reads go through the validation Worker first: Apps Script answers with a
  // cross-origin redirect and cannot set CORS headers, which mobile browsers
  // block. The Worker forwards server-side and returns plain JSON.
  async function proxyQuery(parameters) {
    const base = workerBase();
    if (!base) throw new Error('no worker');
    const proxy = new URL('/rsvp', base);
    Object.entries(parameters).forEach(([key, value]) => proxy.searchParams.set(key, value));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(proxy.href, {signal: controller.signal, cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function backendQuery(parameters) {
    const endpoint = backendEndpoint();
    if (!endpoint) throw new Error('no backend');
    try {
      return await proxyQuery(parameters);
    } catch {
      // Direct fetch only works when the endpoint is same-origin or CORS-enabled;
      // JSONP is deliberately not used here, because mobile browsers block it.
      const url = new URL(endpoint);
      Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url.href, {signal: controller.signal, cache: 'no-store'});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } finally { clearTimeout(timer); }
    }
  }

  function setStatus(message, tone) {
    statusBox.textContent = message || '';
    statusBox.classList.toggle('is-error', tone === 'error');
    statusBox.classList.toggle('is-success', tone === 'success');
    // Keep a retry affordance reachable when the body failed to load.
    if (loadState === 'error' && message) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'text-button';
      retry.style.marginTop = '10px';
      retry.textContent = t('wishlist.retry');
      retry.addEventListener('click', loadWishlist);
      statusBox.append(document.createElement('br'), retry);
    }
  }

  function ornament() {
    const span = document.createElement('span');
    span.className = 'wishlist-ornament';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 3.5c2.4 2.7 3.6 5 3.6 7a3.6 3.6 0 0 1-7.2 0c0-2 1.2-4.3 3.6-7Z"/><path d="M5 14c2.6.6 4.3 2 5 4M19 14c-2.6.6-4.3 2-5 4"/></svg>';
    return span;
  }

  function figure(gift) {
    const wrap = document.createElement('div');
    // A linked image is decorative: the name sits right below it, so the alt
    // text is left empty to avoid announcing the item twice.
    if (!gift.image) {
      wrap.className = 'wishlist-figure wishlist-figure--plain';
      wrap.append(ornament());
      return wrap;
    }
    wrap.className = 'wishlist-figure';
    const img = document.createElement('img');
    img.src = gift.image;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => {
      // A dead image link must not leave a broken frame behind.
      wrap.replaceWith(figure({...gift, image: ''}));
    }, {once: true});
    wrap.append(img);
    return wrap;
  }

  function card(gift, busy) {
    const mine = gift.mine === true;
    const item = document.createElement('li');
    item.className = 'wishlist-card' + (gift.claimed ? ' wishlist-card--claimed' : '') + (busy ? ' wishlist-card--busy' : '');

    item.append(figure(gift));

    const body = document.createElement('div');
    body.className = 'wishlist-body';

    const name = document.createElement('h2');
    name.className = 'wishlist-name';
    name.textContent = gift.name;
    body.append(name);

    if (gift.description) {
      const description = document.createElement('p');
      description.className = 'wishlist-description';
      description.textContent = gift.description;
      body.append(description);
    }

    if (gift.price) {
      const price = document.createElement('p');
      price.className = 'wishlist-price';
      price.textContent = gift.price;
      body.append(price);
    }

    const actions = document.createElement('div');
    actions.className = 'wishlist-actions';

    if (mine) {
      // Only the guest who claimed an item sees a release control. Everyone
      // else just sees that it is taken, without learning who took it.
      const badge = document.createElement('span');
      badge.className = 'wishlist-mine';
      badge.textContent = t('wishlist.claimedByYou');
      const release = document.createElement('button');
      release.type = 'button';
      release.className = 'wishlist-release';
      release.textContent = t('wishlist.release');
      release.setAttribute('aria-label', fill(t('wishlist.releaseAria'), {name: gift.name}));
      release.disabled = Boolean(busy);
      release.addEventListener('click', () => confirmChange(gift, true));
      actions.append(badge, release);
    } else if (gift.claimed) {
      const badge = document.createElement('span');
      badge.className = 'wishlist-taken';
      badge.textContent = t('wishlist.taken');
      actions.append(badge);
    } else if (canClaim) {
      const claim = document.createElement('button');
      claim.type = 'button';
      claim.className = 'wishlist-claim';
      claim.textContent = t('wishlist.claim');
      claim.setAttribute('aria-label', fill(t('wishlist.claimAria'), {name: gift.name}));
      claim.disabled = Boolean(busy);
      claim.addEventListener('click', () => confirmChange(gift, false));
      actions.append(claim);
    }

    if (gift.link) {
      const link = document.createElement('a');
      link.className = 'wishlist-link';
      link.href = gift.link;
      link.target = '_blank';
      link.rel = 'noopener noreferrer nofollow';
      link.textContent = t('wishlist.viewStore');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '12'); icon.setAttribute('height', '12');
      icon.setAttribute('fill', 'none'); icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '1.6'); icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round'); icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<path d="M9 6h9v9m0-9-9 9"/><path d="M15 15v3H6V9h3"/>';
      link.append(icon);
      actions.append(link);
    }

    if (actions.childElementCount) body.append(actions);
    item.append(body);
    return item;
  }

  // Only a verified invitation may claim: claims are bound to the code, so an
  // open page without one is read-only.
  let canClaim = false;
  let busyClaim = '';

  function render() {
    grid.textContent = '';
    const list = wishlist || [];
    emptyBox.hidden = Boolean(list.length) || loadState !== 'ready';
    noteBox.hidden = !list.some(gift => gift.mine);
    const claimed = list.filter(gift => gift.claimed).length;
    progressBox.hidden = !list.length;
    if (list.length) progressBox.textContent = fill(t('wishlist.progress'), {taken: claimed, total: list.length});
    for (const gift of list) grid.append(card(gift, busyClaim === gift.id));
    for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    document.title = t('meta.title');
    document.getElementById('backLink').href = withCode(getBackTarget());
    document.getElementById('giftBack').href = withCode('index.html#gift');
    for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === currentLang));
    }
  }

  function getBackTarget() {
    // Returning to the invitation should land where the guest left off.
    const from = (params.get('from') || '').trim();
    if (/^#[a-z-]+$/i.test(from)) return 'index.html' + from;
    return 'index.html#gift';
  }

  // `notice` keeps a confirmation visible across the refresh that follows a
  // claim: the list must be re-read from the sheet, but the success message
  // should not be wiped by that reload.
  async function loadWishlist(notice) {
    if (!VALID_CODE.test(inviteCode)) {
      loadState = inviteCode ? 'invalid' : 'needsInvite';
      canClaim = false;
      wishlist = [];
      setStatus(t(inviteCode ? 'wishlist.invalidInvite' : 'wishlist.needsInvite'), inviteCode ? 'error' : '');
      render();
      return;
    }
    loadState = 'loading';
    canClaim = false;
    setStatus(t('wishlist.loading'), '');
    render();
    try {
      const result = await backendQuery({action: 'guest', code: inviteCode});
      if (!result || result.ok !== true || !result.guest) {
        loadState = 'invalid';
        wishlist = [];
        setStatus(t('wishlist.invalidInvite'), 'error');
        render();
        return;
      }
      wishlist = Array.isArray(result.wishlist) ? result.wishlist.map(normalize) : [];
      canClaim = true;
      loadState = 'ready';
      setStatus(notice ? notice.text : '', notice ? notice.tone : '');
    } catch {
      loadState = 'error';
      wishlist = null;
      // A confirmation from a write that did land is still the more useful
      // message, so it outranks the refresh failure.
      setStatus(notice ? notice.text : t('wishlist.error'), notice ? notice.tone : 'error');
    }
    render();
  }

  // Every field is coerced to the shape the renderer expects. The page trusts
  // the backend for content, but never for types.
  function normalize(gift) {
    const id = String(gift.id || '');
    return {
      id,
      name: String(gift.name || ''),
      description: String(gift.description || ''),
      image: /^https:\/\//i.test(String(gift.image || '')) ? String(gift.image) : '',
      link: /^https?:\/\//i.test(String(gift.link || '')) ? String(gift.link) : '',
      price: String(gift.price || ''),
      claimed: gift.claimed === true,
      // `mine` comes from the backend, which knows the claimer but only ever
      // tells the guest about their own claim.
      mine: gift.mine === true
    };
  }

  let pending = null;

  function confirmChange(gift, release) {
    pending = {gift, release};
    dialogTitle.textContent = t(release ? 'wishlist.releaseTitle' : 'wishlist.claimTitle');
    dialogText.textContent = fill(t(release ? 'wishlist.releaseBody' : 'wishlist.claimBody'), {name: gift.name});
    dialogConfirm.textContent = t(release ? 'wishlist.releaseConfirm' : 'wishlist.claimConfirm');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else submitChange();
  }

  async function submitChange() {
    if (!pending) return;
    const {gift, release} = pending;
    pending = null;
    if (dialog.open) dialog.close();
    busyClaim = gift.id;
    render();
    const payload = {
      type: 'claim', code: inviteCode, requestId: crypto.randomUUID(),
      id: gift.id, release
    };
    let notice;
    try {
      const result = await postClaim(payload);
      if (!result || result.ok !== true) {
        notice = {text: t('wishlist.failed'), tone: 'error'};
      } else if (release) {
        notice = {text: fill(t('wishlist.releaseDone'), {name: gift.name}), tone: 'success'};
      } else if (result.byOther) {
        notice = {text: fill(t('wishlist.alreadyTaken'), {name: gift.name}), tone: 'error'};
      } else {
        notice = {text: fill(t('wishlist.claimDone'), {name: gift.name}), tone: 'success'};
      }
    } catch {
      notice = {text: t('wishlist.failed'), tone: 'error'};
    }
    busyClaim = '';
    setStatus(notice.text, notice.tone);
    // Re-read the list so the page reflects the sheet, not the optimistic click.
    await loadWishlist(notice);
  }

  // Writes still go straight to Apps Script, exactly like RSVP and wishes; the
  // Worker only ever proxies reads. A lost response is recovered through the
  // receipt lookup so a claim is never reported as failed when it landed.
  async function postClaim(payload) {
    const endpoint = backendEndpoint();
    if (!endpoint) return {ok: false, reason: 'unconfigured'};
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const result = await response.json();
        if (typeof result.ok === 'boolean') return result;
      }
    } catch {}
    try {
      await fetch(endpoint, {
        method: 'POST', mode: 'no-cors',
        headers: {'Content-Type': 'text/plain;charset=utf-8'}, body: JSON.stringify(payload)
      });
      for (let attempt = 0; attempt < 4; attempt++) {
        const receipt = await backendQuery({action: 'receipt', code: inviteCode, requestId: payload.requestId});
        if (receipt && receipt.ok === true && !receipt.pending) return receipt;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch {}
    return {ok: false, reason: 'network'};
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    document.documentElement.lang = lang;
    try { window.localStorage.setItem(LANG_KEY, lang); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
    render();
  }

  for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  }
  dialogConfirm.addEventListener('click', submitChange);
  dialogCancel.addEventListener('click', () => { pending = null; dialog.close(); });
  dialog.addEventListener('cancel', () => { pending = null; });
  // Clicking the backdrop dismisses without submitting.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      pending = null;
      dialog.close();
    }
  });

  document.documentElement.lang = currentLang;
  render();
  loadWishlist();
})();
