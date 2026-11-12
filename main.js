(() => {
  const config = window.WEDDING_CONFIG || {};
  let invitationReady = !String(config.rsvpEndpoint || '').trim();
  let invitationChecking = !invitationReady;
  let invitationStatusKey = '';
  let invitationRetry = false;
  const MAX_SEATS = 4;
  const inviteCode = new URLSearchParams(window.location.search).get('code') || '';
  const STORAGE_KEY = 'richard-natasha-rsvp:' + (inviteCode || 'preview');
  const WISH_KEY = 'richard-natasha-wishes';
  const LANG_KEY = 'richard-natasha-lang';
  const seenWishes = new Set();
  const params = new URLSearchParams(window.location.search);
  let latestWishes = [];

  const translations = {
    en: {
      "meta.title": "Richard & Natasha · A Wedding Invitation",
      "meta.description": "The wedding of Richard Putra and Kristy Natasha Yohanes, Sunday, 17 January 2027, Jakarta.",
      "head.brand": "A LETTER TO YOU",
      "head.navAria": "Invitation sections",
      "nav.details": "Details",
      "nav.story": "Story",
      "nav.rsvp": "RSVP",
      "nav.gift": "Gift",
      "nav.wishes": "Wishes",
      "cover.aria": "Wedding invitation opening",
      "cover.eyebrow": "A WEDDING INVITATION",
      "cover.sub": "Sunday · 17 January 2027 · Jakarta",
      "cover.openAria": "Open wedding invitation letter",
      "cover.letterForYou": "For You",
      "cover.peekSmall": "A day to remember",
      "cover.open": 'Open the letter',
      "cover.hint": "Tap the seal to open your invitation.",
      "cover.skip": "Skip the opening",
      "hero.aria": "The wedding of Richard and Natasha",
      "hero.alt": "Placeholder couple portrait in traditional hanfu, replace with the couple's prewedding photograph",
      "hero.eyebrow": "THE WEDDING OF",
      "hero.intro": "With joyful hearts and our families,<br />we invite you to celebrate our wedding.",
      "hero.date": "SUNDAY · 17 JANUARY 2027 · JAKARTA",
      "details.intro": "THE DAY WE SAY I DO",
      "details.title": "Wedding Details",
      "details.holy": "Holy Matrimony",
      "details.reception": "Reception",
      "details.date": "Sunday, 17 January 2027",
      "details.holyTime": "11:00 WIB – finish",
      "details.receptionTime": "18:00 WIB – finish",
      "details.venue": "Grand Mercure Kemayoran<br />Magnolia Ballroom, Jakarta, Indonesia",
      "details.viewLocation": 'View location',
      "countdown.aria": "Countdown to the wedding",
      "countdown.intro": "COUNTING DOWN TO FOREVER",
      "countdown.title": "We can’t wait",
      "countdown.groupAria": "Time remaining until the wedding",
      "countdown.days": "Days",
      "countdown.hours": "Hours",
      "countdown.minutes": "Minutes",
      "countdown.seconds": "Seconds",
      "countdown.note": "Sunday, 17 January 2027 · 18:00 WIB",
      "story.intro": "A JOURNEY OF TWO",
      "story.title": "Our Story",
      "story.photoAlt": "Placeholder hanfu couple photo",
      "story.lead": "Ours is a love written across cities and time zones, and now, finally, we are counting down to the day we say “I do.”",
      "story.m1date": "APRIL 2021",
      "story.m1title": "How We Met",
      "story.m1text": "We met for the first time, never imagining that such a simple encounter would be the beginning of our story.",
      "story.m2date": "JUNE 1, 2023",
      "story.m2title": "Our First Date",
      "story.m2text": "Our first date was at Mall Kelapa Gading. What started as a simple meal turned into hours of conversation, and before we knew it, time had flown by.",
      "story.m3date": "JUNE 2, 2025",
      "story.m3title": "The Proposal",
      "story.m3text": "After years of making memories together, Richard asked Natasha to marry him. With happy tears and a heart full of love, she said yes.",
      "story.m4date": "2025–2026",
      "story.m4title": "Miles Apart, Still Together",
      "story.m4text": "Natasha moved to London to pursue her studies at Imperial College London. Though thousands of miles apart, we stayed close through phone calls, everyday stories, and counting down the days until we could see each other again.",
      "story.m5date": "JANUARY 17, 2027",
      "story.m5title": "A New Chapter",
      "story.m5text": "After everything we've shared and all the miles we've crossed, we're finally getting married. We can't wait to celebrate this special day with the family and friends we love.",
      "story.next": "THE NEXT CHAPTER BEGINS",
      "portrait.aria": "A moment together",
      "portrait.intro": "THROUGH EVERY SEASON",
      "portrait.title": "You, me,<br />and all that’s to come.",
      "gallery.intro": "LITTLE MOMENTS, A LIFETIME OF LOVE",
      "gallery.title": "Together, Always",
      "rsvp.intro": "WE SAVED YOU A SEAT",
      "rsvp.title": "Will You Join Us?",
      "rsvp.body": 'Your presence would mean the world to us.<br /><span class="rsvp-deadline">Kindly respond by 3 January 2027.</span>',
      "rsvp.attendance": "Attendance",
      "rsvp.attendYes": "✓ I will attend",
      "rsvp.attendNo": "× I can't attend",
      "rsvp.events": "Which events will you join?",
      "rsvp.eventsPlaceholder": "Select events",
      "dynamic.inviteLoading": "Checking your invitation…",
      "dynamic.inviteInvalid": "Please use your personal invitation link to RSVP. If it no longer works, contact us.",
      "dynamic.inviteUnavailable": "We couldn’t check your invitation. Please reload to try again.",
      "dynamic.inviteRejected": "Your RSVP was not saved. Please check your invitation and party size, then try again.",
      "rsvp.both": "Holy Matrimony + Reception",
      "rsvp.holyOnly": "Holy Matrimony only",
      "rsvp.receptionOnly": "Reception only",
      "rsvp.name": "Your name",
      "rsvp.namePlaceholder": "Full name",
      "rsvp.count": "How many people are coming?",
      "rsvp.countPlaceholder": "Select number of people",
      "rsvp.count1": "Just me (1)",
      "rsvp.count2": "2 people",
      "rsvp.count3": "3 people",
      "rsvp.count4": "4 people",
      "rsvp.countHint": "Please include the names of anyone joining you in the note below.",
      "rsvp.note": "A note for us (optional)",
      "rsvp.notePlaceholder": "Your wishes, guest names, or dietary notes",
      "rsvp.submit": "Submit RSVP",
      "gift.intro": "WITH GRATITUDE",
      "gift.title": "Wedding Gift",
      "gift.body": "Your presence is the greatest gift we could ask for. If you would like to bless us with something more, a contribution toward our first home would be received with heartfelt thanks.",
      "gift.domesticTab": "Domestic",
      "gift.internationalTab": "International",
      "gift.domestic": "DOMESTIC TRANSFER",
      "gift.international": "INTERNATIONAL TRANSFER",
      "gift.bank": "Bank",
      "gift.swift": "SWIFT / BIC",
      "gift.accountNumber": "Account number",
      "gift.accountName": "Account name",
      "gift.bankAddress": "Bank address",
      "gift.note": "Please use your full name as the transfer reference. For transfer assistance, please contact us directly.",
      "gift.copyAccount": "Copy account number",
      "gift.copySwift": "Copy SWIFT code",
      "wishes.intro": "FROM THE HEART",
      "wishes.title": "Words of Love",
      "wishes.body": "Leave a wish for the two of us. Every message becomes part of the story we keep.",
      "wishes.name": "Your name",
      "wishes.namePlaceholder": "Your name",
      "wishes.wish": "Your wish",
      "wishes.wishPlaceholder": "A few words for Richard & Natasha",
      "wishes.submit": "Send your wish →",
      "wishes.empty": "No wishes yet. Be the first to leave one.",
      "footer.title": "Thank You",
      "footer.text": "For being part of this beautiful chapter of our lives.",
      "dynamic.savedStatus": "You responded on {date}. Submit again if you need to update your answer.",
      "dynamic.copied": "Copied!",
      "dynamic.copyFailed": "Couldn’t copy",
      "dynamic.sendingRsvp": "Sending your RSVP…",
      "dynamic.rsvpSuccess": "Thank you, your RSVP has been received. We can’t wait to celebrate with you!",
      "dynamic.rsvpPreview": "Preview only: RSVP was not sent or saved. Add your Google Apps Script URL to config.js to start receiving responses.",
      "dynamic.rsvpError": "We couldn’t send your RSVP automatically. Please try again.",
      "dynamic.whatsapp": "Message us on WhatsApp instead →",
      "dynamic.sendingWish": "Sending your wish…",
      "dynamic.wishSuccess": "Thank you, your wish has been added to our letter.",
      "dynamic.wishSaved": "Saved on this device only. Add your Google Apps Script URL to config.js so every guest’s wish is collected.",
      "dynamic.wishError": "We couldn’t send your wish. Please try again in a moment.",
      "dynamic.honeypot": "Thank you. Your RSVP has been received.",
      "dynamic.guestGreeting": "Dear {name}{label},",
      "dynamic.guestGreetingLabel": " & Guest",
      "dynamic.guestGreetingLabelPlural": " & Guests",
      "dynamic.seatsReserved": "We have reserved {n} place in your name",
      "dynamic.seatsReservedPlural": "We have reserved {n} places in your name",
      "dynamic.seatsInvitation": "Your invitation includes {n} place.",
      "dynamic.seatsInvitationPlural": "Your invitation includes {n} places.",
      "dynamic.letterFor": "For {name}",
      "dynamic.musicPause": "Pause background music",
      "dynamic.musicPlay": "Play background music",
      "dynamic.waTitle": "RSVP for Richard & Natasha",
      "dynamic.waName": "Name",
      "dynamic.waAttendance": "Attendance",
      "dynamic.waEvents": "Events",
      "dynamic.waGuests": "Guests",
      "dynamic.waNote": "Note",
      "dynamic.waAttending": "Attending",
      "dynamic.waNotAttending": "Not attending"
    },
    id: {
      "meta.title": "Richard & Natasha · Undangan Pernikahan",
      "meta.description": "Pernikahan Richard Putra dan Kristy Natasha Yohanes, Minggu, 17 Januari 2027, Jakarta.",
      "head.brand": "SEBUAH SURAT UNTUKMU",
      "head.navAria": "Bagian undangan",
      "nav.details": "Detail",
      "nav.story": "Kisah",
      "nav.rsvp": "RSVP",
      "nav.gift": "Hadiah",
      "nav.wishes": "Ucapan",
      "cover.aria": "Pembuka undangan pernikahan",
      "cover.eyebrow": "UNDANGAN PERNIKAHAN",
      "cover.sub": "Minggu · 17 Januari 2027 · Jakarta",
      "cover.openAria": "Buka surat undangan pernikahan",
      "cover.letterForYou": "Untukmu",
      "cover.peekSmall": "Hari yang tak terlupakan",
      "cover.open": 'Buka surat',
      "cover.hint": "Ketuk segelnya untuk membuka undangan.",
      "cover.skip": "Lewati pembuka",
      "hero.aria": "Pernikahan Richard dan Natasha",
      "hero.alt": "Foto pasangan dalam pakaian hanfu, ganti dengan foto prewedding pasangan",
      "hero.eyebrow": "PERNIKAHAN",
      "hero.intro": "Dengan hati yang penuh sukacita dan bersama keluarga kami,<br />kami mengundang Anda untuk merayakan pernikahan kami.",
      "hero.date": "MINGGU · 17 JANUARI 2027 · JAKARTA",
      "details.intro": "HARI KAMI MENGUCAPKAN JANJI",
      "details.title": "Detail Acara",
      "details.holy": "Pemberkatan Pernikahan",
      "details.reception": "Resepsi",
      "details.date": "Minggu, 17 Januari 2027",
      "details.holyTime": "11:00 WIB – selesai",
      "details.receptionTime": "18:00 WIB – selesai",
      "details.venue": "Grand Mercure Kemayoran<br />Magnolia Ballroom, Jakarta, Indonesia",
      "details.viewLocation": 'Lihat lokasi',
      "countdown.aria": "Hitung mundur menuju pernikahan",
      "countdown.intro": "MENGHITUNG HARI MENUJU SELAMANYA",
      "countdown.title": "Kami sangat menantikan hari bahagia ini",
      "countdown.groupAria": "Sisa waktu menuju pernikahan",
      "countdown.days": "Hari",
      "countdown.hours": "Jam",
      "countdown.minutes": "Menit",
      "countdown.seconds": "Detik",
      "countdown.note": "Minggu, 17 Januari 2027 · 18:00 WIB",
      "story.intro": "PERJALANAN KAMI BERDUA",
      "story.title": "Kisah Kami",
      "story.photoAlt": "Foto pasangan hanfu",
      "story.lead": "Kisah kami terjalin di antara kota dan zona waktu. Kini, kami menghitung hari menuju janji suci.",
      "story.m1date": "APRIL 2021",
      "story.m1title": "Pertama Bertemu",
      "story.m1text": "Saat itu kami belum tahu, pertemuan sederhana tersebut akan menjadi awal dari kisah kami.",
      "story.m2date": "1 JUNI 2023",
      "story.m2title": "Kencan Pertama",
      "story.m2text": "Kencan pertama kami di Mall Kelapa Gading. Rencana makan bersama berubah menjadi obrolan panjang berjam-jam.",
      "story.m3date": "2 JUNI 2025",
      "story.m3title": "Pertunangan",
      "story.m3text": "Dengan penuh haru dan bahagia, Natasha menjawab, “Ya.”",
      "story.m4date": "2025–2026",
      "story.m4title": "Menjalani Hubungan Jarak Jauh",
      "story.m4text": "Natasha melanjutkan studi di Imperial College London. Meski terpisah ribuan kilometer, kami tetap dekat lewat telepon dan cerita sehari-hari, sambil menanti waktu untuk bertemu lagi.",
      "story.m5date": "17 JANUARI 2027",
      "story.m5title": "Awal Babak Baru",
      "story.m5text": "Setelah melalui begitu banyak cerita bersama, kini kami akan menikah. Kami ingin merayakan kebahagiaan ini bersama keluarga dan sahabat terkasih.",
      "story.next": "BAB BARU DIMULAI",
      "portrait.aria": "Momen bersama",
      "portrait.intro": "DI SETIAP MUSIM KEHIDUPAN",
      "portrait.title": "Aku, kamu,<br />dan segala yang akan datang.",
      "gallery.intro": "MOMEN KECIL, CINTA SEPANJANG MASA",
      "gallery.title": "Selalu Bersama",
      "rsvp.intro": "KAMI MENYIAPKAN TEMPAT UNTUK ANDA",
      "rsvp.title": "Maukah Anda Bergabung?",
      "rsvp.body": 'Kehadiran Anda sangat berarti bagi kami.<br /><span class="rsvp-deadline">Mohon konfirmasi kehadiran sebelum 3 Januari 2027.</span>',
      "rsvp.attendance": "Kehadiran",
      "rsvp.attendYes": "✓ Saya akan hadir",
      "rsvp.attendNo": "× Saya tidak bisa hadir",
      "rsvp.events": "Acara yang akan Anda hadiri",
      "rsvp.eventsPlaceholder": "Pilih acara",
      "dynamic.inviteLoading": "Memeriksa undangan Anda…",
      "dynamic.inviteInvalid": "Silakan gunakan tautan undangan pribadi Anda untuk RSVP. Hubungi kami jika tautan tidak berfungsi.",
      "dynamic.inviteUnavailable": "Undangan belum dapat diperiksa. Muat ulang halaman untuk mencoba lagi.",
      "dynamic.inviteRejected": "RSVP belum tersimpan. Periksa undangan dan jumlah tamu Anda, lalu coba lagi.",
      "rsvp.both": "Pemberkatan + Resepsi",
      "rsvp.holyOnly": "Hanya Pemberkatan",
      "rsvp.receptionOnly": "Hanya Resepsi",
      "rsvp.name": "Nama Anda",
      "rsvp.namePlaceholder": "Nama lengkap",
      "rsvp.count": "Berapa orang yang akan datang?",
      "rsvp.countPlaceholder": "Pilih jumlah orang",
      "rsvp.count1": "Hanya saya (1)",
      "rsvp.count2": "2 orang",
      "rsvp.count3": "3 orang",
      "rsvp.count4": "4 orang",
      "rsvp.countHint": "Tuliskan nama tamu lain yang ikut di kolom catatan di bawah.",
      "rsvp.note": "Catatan untuk kami (opsional)",
      "rsvp.notePlaceholder": "Ucapan, nama tamu, atau pantangan makanan",
      "rsvp.submit": "Kirim RSVP",
      "gift.intro": "DENGAN RASA SYUKUR",
      "gift.title": "Hadiah Pernikahan",
      "gift.body": "Kehadiran Anda adalah hadiah terindah bagi kami. Jika ingin memberikan hadiah, dukungan Anda untuk mewujudkan rumah pertama kami akan sangat berarti.",
      "gift.domesticTab": "Dalam Negeri",
      "gift.internationalTab": "Luar Negeri",
      "gift.domestic": "TRANSFER DALAM NEGERI",
      "gift.international": "TRANSFER LUAR NEGERI",
      "gift.bank": "Bank",
      "gift.swift": "SWIFT / BIC",
      "gift.accountNumber": "Nomor rekening",
      "gift.accountName": "Nama rekening",
      "gift.bankAddress": "Alamat bank",
      "gift.note": "Cantumkan nama lengkap Anda pada keterangan transfer. Jika ada pertanyaan, silakan hubungi kami.",
      "gift.copyAccount": "Salin nomor rekening",
      "gift.copySwift": "Salin kode SWIFT",
      "wishes.intro": "DARI HATI",
      "wishes.title": "Ucapan untuk Kami",
      "wishes.body": "Tuliskan doa dan harapan untuk kami. Setiap pesan akan menjadi kenangan yang berharga.",
      "wishes.name": "Nama Anda",
      "wishes.namePlaceholder": "Nama Anda",
      "wishes.wish": "Ucapan Anda",
      "wishes.wishPlaceholder": "Tuliskan pesan untuk Richard & Natasha",
      "wishes.submit": "Kirim ucapan →",
      "wishes.empty": "Belum ada ucapan. Anda bisa menjadi yang pertama.",
      "footer.title": "Terima Kasih",
      "footer.text": "Terima kasih telah menjadi bagian dari kisah indah kami.",
      "dynamic.savedStatus": "Jawaban Anda tersimpan pada {date}. Kirim ulang formulir jika ingin mengubahnya.",
      "dynamic.copied": "Tersalin!",
      "dynamic.copyFailed": "Gagal menyalin",
      "dynamic.sendingRsvp": "Mengirim konfirmasi kehadiran…",
      "dynamic.rsvpSuccess": "Terima kasih, konfirmasi kehadiran Anda sudah kami terima. Kami sangat menantikan hari istimewa ini bersama Anda!",
      "dynamic.rsvpPreview": "Mode pratinjau: RSVP tidak dikirim atau disimpan. Tambahkan URL Google Apps Script Anda di config.js untuk mulai menerima respons.",
      "dynamic.rsvpError": "Kami tidak dapat mengirim RSVP Anda secara otomatis. Silakan coba lagi.",
      "dynamic.whatsapp": "Hubungi kami lewat WhatsApp →",
      "dynamic.sendingWish": "Mengirim ucapan…",
      "dynamic.wishSuccess": "Terima kasih, ucapan Anda sudah kami terima.",
      "dynamic.wishSaved": "Hanya tersimpan di perangkat ini. Tambahkan URL Google Apps Script Anda di config.js agar ucapan setiap tamu terkumpul.",
      "dynamic.wishError": "Kami tidak dapat mengirim ucapan Anda. Silakan coba lagi sebentar lagi.",
      "dynamic.honeypot": "Terima kasih. RSVP Anda telah kami terima.",
      "dynamic.guestGreeting": "Untuk {name}{label},",
      "dynamic.guestGreetingLabel": " & tamu",
      "dynamic.guestGreetingLabelPlural": " & para tamu",
      "dynamic.seatsReserved": "Kami telah menyiapkan {n} tempat untuk Anda",
      "dynamic.seatsReservedPlural": "Kami telah menyiapkan {n} tempat untuk Anda",
      "dynamic.seatsInvitation": "Undangan ini berlaku untuk {n} orang.",
      "dynamic.seatsInvitationPlural": "Undangan ini berlaku untuk {n} orang.",
      "dynamic.letterFor": "Untuk {name}",
      "dynamic.musicPause": "Jeda musik latar",
      "dynamic.musicPlay": "Putar musik latar",
      "dynamic.waTitle": "RSVP untuk Richard & Natasha",
      "dynamic.waName": "Nama",
      "dynamic.waAttendance": "Kehadiran",
      "dynamic.waEvents": "Acara",
      "dynamic.waGuests": "Jumlah tamu",
      "dynamic.waNote": "Catatan",
      "dynamic.waAttending": "Hadir",
      "dynamic.waNotAttending": "Tidak hadir"
    }
  };

  function detectLanguage() {
    const param = (params.get('lang') || params.get('language') || '').toLowerCase();
    if (param === 'en' || param === 'id') return param;
    const pathname = window.location.pathname;
    if (pathname && !pathname.endsWith('/')) {
      let segment = pathname.slice(pathname.lastIndexOf('/') + 1);
      try { segment = decodeURIComponent(segment); } catch {}
      segment = segment.toLowerCase();
      if (segment === 'en' || segment === 'id') return segment;
    }
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored === 'en' || stored === 'id') return stored;
    } catch {}
    return 'en';
  }

  let currentLang = detectLanguage();

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
  }

  function format(template, vars) {
    return String(template).replace(/\{(\w+)\}/g, (match, name) =>
      vars && name in vars ? String(vars[name]) : match
    );
  }

  function applyLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;

    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.textContent = t(el.dataset.i18n);
    }
    for (const el of document.querySelectorAll('[data-i18n-html]')) {
      el.innerHTML = t(el.dataset.i18nHtml);
    }
    for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    }
    for (const el of document.querySelectorAll('[data-i18n-aria]')) {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    }
    for (const el of document.querySelectorAll('[data-i18n-alt]')) {
      el.setAttribute('alt', t(el.dataset.i18nAlt));
    }

    document.title = t('meta.title');
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t('meta.description'));

    for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    }

    renderGuestCopy();
    renderInvitationGate();
    renderSavedStatus();
    if (latestWishes.length) renderWishes(latestWishes);
    if (music) updateMusicButton(!music.paused);
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    try { window.localStorage.setItem(LANG_KEY, lang); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
    applyLanguage(lang);
  }

  for (const button of document.querySelectorAll('.lang-switch [data-lang]')) {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  }

  const cover = document.getElementById('cover');
  const invitation = document.getElementById('invitation');
  const envelope = document.getElementById('envelope');
  const skipButton = document.getElementById('skipOpening');
  const openButtons = [document.getElementById('openLetter')];
  let hasOpened = false;
  let openingAnimationDone = false;
  let openingDepartureStarted = false;
  let openTimers = [];

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Opening assets and guest verification load together; later photos stay lazy.
  const openingAssets = [
    'assets/svg/bg-cover.svg',
    'assets/svg/envelope-back.svg', 'assets/svg/envelope-front.svg',
    'assets/svg/envelope-flap.svg', 'assets/svg/wax-seal.svg'
  ];
  const openingAssetsReady = Promise.race([Promise.allSettled([
    document.fonts.ready,
    document.querySelector('.hero-image').decode().catch(() => {}),
    ...openingAssets.map((src) => new Promise((resolve) => {
      const image = new Image();
      image.onload = image.onerror = resolve;
      image.src = src;
    }))
  ]), new Promise(resolve => setTimeout(resolve, 10000))]);

  // Measure document geometry only when layout changes. Scrolling only
  // reads scrollY and updates transforms on visible photo layers.
  const photoScenes = [
    ['.hero', '.hero-image'],
    ['.portrait-interlude', '.portrait-interlude > img'],
    ['.closing-photo', '.closing-portrait']
  ].map(([scene, image]) => ({scene: document.querySelector(scene), image: document.querySelector(image), lastOffset: null}));
  const storyPainting = {scene: document.querySelector('#story'), image: document.querySelector('.painting-story'), lastOffset: null};
  const photoMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let photoFrame = 0;
  let photoMeasurementsDirty = true;
  function documentTop(element) {
    let top = 0;
    for (let parent = element; parent; parent = parent.offsetParent) top += parent.offsetTop;
    return top;
  }
  let lastPhotoTick = 0;
  function updatePhotoWipes(now) {
    photoFrame = 0;
    const elapsed = lastPhotoTick ? Math.min(32, Math.max(1, now - lastPhotoTick)) : 16;
    lastPhotoTick = now;
    const blend = 1 - Math.exp(-elapsed / 55);
    let settling = false;
    if (photoMeasurementsDirty) {
      for (const photo of photoScenes) {
        const frame = photo.image.parentElement;
        photo.top = documentTop(frame);
        photo.frameHeight = frame.clientHeight;
        photo.height = photo.image.clientHeight;
      }
      storyPainting.top = documentTop(storyPainting.scene);
      storyPainting.height = storyPainting.scene.clientHeight;
      photoMeasurementsDirty = false;
    }
    const scrollTop = scrollY;
    const viewport = innerHeight;
    for (const photo of photoScenes) {
      const top = photo.top - scrollTop;
      const bottom = top + photo.frameHeight;
      if (!photo.height || bottom <= 0 || top >= viewport) continue;
      const minimum = Math.min(viewport, bottom) - photo.height - top;
      const maximum = Math.max(0, top) - top;
      const desired = photoMotion.matches ? 0 : top < 0 ? -top * .85
        : photo.scene.matches('.hero') ? 0 : -top * .85;
      const target = photoMotion.matches ? 0 : Math.max(minimum, Math.min(maximum, desired));
      let offset = photoMotion.matches || photo.lastOffset === null
        ? target : photo.lastOffset + (target - photo.lastOffset) * blend;
      // Ease through small touch changes, but never uncover the image edge.
      if (!photoMotion.matches) offset = Math.max(minimum, Math.min(maximum, offset));
      if (Math.abs(target - offset) < .15) offset = target;
      else settling = true;
      if (photo.lastOffset !== null && Math.abs(offset - photo.lastOffset) < .01) continue;
      photo.image.style.transform = `translate3d(0, ${offset}px, 0)`;
      photo.lastOffset = offset;
    }
    if (innerWidth >= 960 || photoMotion.matches) {
      storyPainting.image.style.removeProperty('transform');
      storyPainting.lastOffset = null;
    } else {
      const top = storyPainting.top - scrollTop;
      if (top < viewport && top + storyPainting.height > 0) {
        const progress = Math.max(-1, Math.min(1,
          (viewport / 2 - top - storyPainting.height / 2) / ((viewport + storyPainting.height) / 2)));
        const target = progress * 70;
        let offset = storyPainting.lastOffset === null ? target
          : storyPainting.lastOffset + (target - storyPainting.lastOffset) * blend;
        if (Math.abs(target - offset) < .15) offset = target;
        else settling = true;
        if (storyPainting.lastOffset === null || Math.abs(offset - storyPainting.lastOffset) >= .01) {
          storyPainting.image.style.transform = `translate3d(0, ${offset}px, 0)`;
          storyPainting.lastOffset = offset;
        }
      }
    }
    if (settling) requestPhotoWipes();
    else lastPhotoTick = 0;
  }
  function requestPhotoWipes() {
    if (!photoFrame) photoFrame = requestAnimationFrame(updatePhotoWipes);
  }
  function measurePhotoWipes() {
    photoMeasurementsDirty = true;
    requestPhotoWipes();
  }
  window.addEventListener('scroll', requestPhotoWipes, {passive:true});
  window.addEventListener('resize', measurePhotoWipes);
  photoMotion.addEventListener('change', requestPhotoWipes);
  const photoLayoutObserver = new ResizeObserver(measurePhotoWipes);
  document.querySelectorAll('main > section, footer').forEach(section => photoLayoutObserver.observe(section));
  photoScenes.forEach(({image}) => image.addEventListener('load', measurePhotoWipes));
  document.fonts.ready.then(measurePhotoWipes);
  const visiblePhotos = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('photo-in-view', entry.isIntersecting));
  }, {rootMargin:'100px'});
  photoScenes.forEach(({scene}) => visiblePhotos.observe(scene));
  visiblePhotos.observe(storyPainting.scene);
  requestPhotoWipes();

  const music = document.getElementById('bgMusic');
  const musicToggle = document.getElementById('musicToggle');
  const MUSIC_VOLUME = 0.5;
  let musicOn = true;
  let musicAvailable = Boolean(music);
  let musicFade = 0;
  let musicStarting = false;
  let resumeMusicOnFocus = false;

  function clearOpenTimers() {
    openTimers.forEach(window.clearTimeout);
    openTimers = [];
  }

  // The cover fades away while the invitation fades in beneath it, so the
  // guest never sees an empty screen between the letter and the content.
  function completeOpen() {
    if (!invitationReady) return;
    clearOpenTimers();
    cover.hidden = true;
    cover.classList.remove('is-departing');
    invitation.hidden = false;
    if (musicAvailable) musicToggle.hidden = false;
    window.scrollTo({top: 0, behavior: 'instant'});
    if (typeof invitation.focus === 'function') invitation.focus({preventScroll: true});
  }

  function finishOpening() {
    if (!hasOpened || !openingAnimationDone || openingDepartureStarted) return;
    renderInvitationGate();
    if (!invitationReady || invitationChecking) return;
    openingDepartureStarted = true;
    startMusic();
    if (prefersReducedMotion()) { completeOpen(); return; }
    invitation.hidden = false;
    cover.classList.add('is-departing');
    openTimers.push(window.setTimeout(completeOpen, 800));
  }

  function openInvitation(options = {}) {
    if (hasOpened || (!invitationReady && !invitationChecking)) return;
    hasOpened = true;
    for (const button of openButtons) button.disabled = true;
    if (options.instant || prefersReducedMotion()) {
      openingAnimationDone = true;
      finishOpening();
      return;
    }
    envelope.classList.add('is-opening');
    openTimers.push(window.setTimeout(() => {
      openingAnimationDone = true;
      finishOpening();
    }, 1600));
  }

  function skipOpening() {
    if (!hasOpened) openInvitation({instant: true});
    else {
      openingAnimationDone = true;
      finishOpening();
    }
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
    musicToggle.setAttribute('aria-label', playing ? t('dynamic.musicPause') : t('dynamic.musicPlay'));
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
    if (!music || !musicOn || document.hidden || !document.hasFocus()) return;
    musicStarting = true;
    music.volume = 0;
    const playback = music.play();
    if (playback && typeof playback.then === 'function') {
      playback
        .then(() => {
          musicStarting = false;
          if (document.hidden || !document.hasFocus() || !musicOn) {
            resumeMusicOnFocus = musicOn;
            music.pause();
            updateMusicButton(false);
            return;
          }
          fadeMusic(MUSIC_VOLUME);
          updateMusicButton(true);
        })
        .catch(() => { musicStarting = false; updateMusicButton(false); });
    } else {
      musicStarting = false;
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
        resumeMusicOnFocus = false;
        window.clearInterval(musicFade);
        music.pause();
        updateMusicButton(false);
      }
    });
  }

  function suspendMusic() {
    if (!music) return;
    resumeMusicOnFocus = resumeMusicOnFocus || (musicOn && (!music.paused || musicStarting));
    window.clearInterval(musicFade);
    music.pause();
    updateMusicButton(false);
  }

  function restoreMusic() {
    if (document.hidden || !document.hasFocus() || !resumeMusicOnFocus || !musicOn || !musicAvailable) return;
    resumeMusicOnFocus = false;
    startMusic();
  }

  window.addEventListener('blur', suspendMusic);
  window.addEventListener('focus', restoreMusic);
  window.addEventListener('pagehide', suspendMusic);
  window.addEventListener('pageshow', restoreMusic);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) suspendMusic();
    else restoreMusic();
  });

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
    if (!segment || segment.includes('.') || /^(en|id)$/i.test(segment)) return '';
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

  let savedResponse = readSavedResponse();
  if (savedResponse && savedResponse.name) {
    guestNameInput.value = savedResponse.name;
    if (savedResponse.message) guestMessageInput.value = savedResponse.message;
    if (savedResponse.attendance) {
      const input = form.querySelector(`input[name="attendance"][value="${savedResponse.attendance}"]`);
      if (input) input.checked = true;
    }
    if (savedResponse.events) {
      const select = form.elements.events;
      if ([...select.options].some(option => option.value === savedResponse.events)) {
        select.value = savedResponse.events;
      }
    }
  } else {
    savedResponse = null;
  }

  function renderSavedStatus(force = false) {
    if (!savedResponse) return;
    if (!force && !formStatus.classList.contains('is-saved')) return;
    const when = new Date(savedResponse.savedAt || Date.now()).toLocaleDateString(
      currentLang === 'id' ? 'id-ID' : 'en-GB',
      {day: 'numeric', month: 'long', year: 'numeric'}
    );
    setStatus(formStatus, format(t('dynamic.savedStatus'), {date: when}), 'saved');
  }

  renderSavedStatus(true);

  // Personalised links:
  //   /alice                     -> "Dear Alice & Guest", 2 places
  //   /alice?plus=0              -> "Dear Alice", 1 place
  //   /alice?guests=3            -> "Dear Alice & Guests", 3 places
  //   ?name=Alice / ?to=Alice    -> same as a path link
  //   ?lang=id / ?lang=en        -> language, also accepted as /id or /en
  const rawName = params.get('name') || params.get('to') || nameFromPath();
  const cleanName = rawName.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  // /alice and ?name=alice read better as "Alice"; mixed-case names are left alone.
  const invitedName = cleanName && cleanName === cleanName.toLowerCase()
    ? cleanName.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    : cleanName;
  const requestedSeats = Number.parseInt(params.get('guests') || '', 10);
  let verifiedGuest = null;
  let personalization = {invitedName: '', seats: 0};

  if (invitedName && !backendEndpoint()) {
    const plusOne = params.get('plus') !== '0';
    const seats = Number.isFinite(requestedSeats)
      ? clampSeats(requestedSeats)
      : (plusOne ? 2 : 1);
    personalization = {invitedName, seats};

    guestNameInput.value = invitedName;
    if (!wishNameInput.value) wishNameInput.value = invitedName;
  }

  // Guests must explicitly confirm their party size, including on personalised links.
  guestCountSelect.value = '';

  function renderGuestCopy() {
    document.getElementById('guestNameDisplay').textContent = guestNameInput.value || '—';
    if (!personalization.invitedName) {
      coverGuest.hidden = true;
      coverSeats.hidden = true;
      guestSeatNote.hidden = true;
      letterFor.textContent = t('cover.letterForYou');
      return;
    }

    const seats = personalization.seats;
    const labelKey = seats === 1 ? '' : seats === 2
      ? 'dynamic.guestGreetingLabel'
      : 'dynamic.guestGreetingLabelPlural';
    const guestLabel = labelKey ? t(labelKey) : '';

    coverGuest.hidden = false;
    coverGuest.textContent = format(t('dynamic.guestGreeting'), {
      name: personalization.invitedName,
      label: guestLabel
    });
    coverSeats.hidden = false;
    coverSeats.textContent = format(
      t(seats === 1 ? 'dynamic.seatsReserved' : 'dynamic.seatsReservedPlural'),
      {n: seats}
    );
    letterFor.textContent = format(t('dynamic.letterFor'), {name: personalization.invitedName});
    guestSeatNote.hidden = true;
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

  // Transfer choice is independent of the display language.
  const giftTabs = Array.from(document.querySelectorAll('.gift-tabs [role="tab"]'));
  function selectGiftTab(selected) {
    giftTabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  giftTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectGiftTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % giftTabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + giftTabs.length) % giftTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = giftTabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectGiftTab(giftTabs[next]);
      giftTabs[next].focus();
    });
  });

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
      button.textContent = copied ? t('dynamic.copied') : t('dynamic.copyFailed');
      window.setTimeout(() => {
        button.textContent = button.dataset.i18n ? t(button.dataset.i18n) : original;
      }, 1600);
    });
  });

  // ---------------------------------------------------------------------
  // Backend helpers
  // ---------------------------------------------------------------------

  let querySequence = 0;
  async function backendQuery(parameters) {
    const url = new URL(backendEndpoint());
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const jsonRequest = fetch(url.href, {signal: controller.signal, cache: 'no-store'})
      .then(response => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      });
    let cancelScript = () => {};
    const scriptRequest = new Promise((resolve, reject) => {
      const callback = 'wedding_' + Date.now() + '_' + (++querySequence);
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('Invitation lookup timed out')); }, 20000);
      const cleanup = () => {
        clearTimeout(timer);
        script.remove();
        // A redirected JSONP response may still execute after the JSON fetch wins.
        window[callback] = () => {};
        setTimeout(() => { delete window[callback]; }, 60000);
      };
      cancelScript = cleanup;
      window[callback] = result => { cleanup(); resolve(result); };
      script.onerror = () => { cleanup(); reject(new Error('Invitation script request blocked')); };
      const scriptUrl = new URL(url);
      scriptUrl.searchParams.set('callback', callback);
      script.src = scriptUrl.href;
      document.body.appendChild(script);
    });
    try {
      return await Promise.any([jsonRequest, scriptRequest]);
    } finally {
      clearTimeout(timeout);
      controller.abort();
      cancelScript();
    }
  }

  function renderInvitationGate() {
    const status = document.getElementById('invitationStatus');
    status.textContent = invitationStatusKey ? t(invitationStatusKey) : '';
    status.hidden = !invitationStatusKey || (invitationChecking && !openingAnimationDone);
    status.classList.toggle('is-error', Boolean(invitationStatusKey && invitationStatusKey !== 'dynamic.inviteLoading'));
    for (const button of openButtons) button.disabled = (!invitationReady && !invitationChecking) || hasOpened;
    const retry = document.getElementById('retryInvitation');
    retry.hidden = !invitationRetry;
    retry.textContent = currentLang === 'id' ? 'Coba lagi' : 'Try again';
  }

  function setInvitationGate(key, retry = false) {
    invitationStatusKey = key;
    invitationRetry = retry;
    renderInvitationGate();
  }

  document.getElementById('retryInvitation').addEventListener('click', loadInvitation);

  async function loadInvitation() {
    if (!backendEndpoint()) { renderInvitationGate(); return; }
    invitationReady = false;
    invitationChecking = true;
    setInvitationGate('dynamic.inviteLoading');
    submitButton.disabled = true;
    guestCountSelect.disabled = true;
    setStatus(formStatus, t('dynamic.inviteLoading'), 'pending');
    if (!/^[a-zA-Z0-9]{8,64}$/.test(inviteCode)) {
      invitationChecking = false;
      setStatus(formStatus, t('dynamic.inviteInvalid'), 'error');
      setInvitationGate('dynamic.inviteInvalid');
      return;
    }
    try {
      const result = await backendQuery({action: 'guest', code: inviteCode});
      if (!result.ok || !result.guest || !Number.isInteger(result.guest.maxGuests) || result.guest.maxGuests < 1 || result.guest.maxGuests > 100) {
        invitationChecking = false;
        setStatus(formStatus, t('dynamic.inviteInvalid'), 'error');
        setInvitationGate('dynamic.inviteInvalid'); return;
      }
      verifiedGuest = result.guest;
      invitationReady = true;
      invitationChecking = false;
      setInvitationGate('');
      personalization = {invitedName: verifiedGuest.name, seats: verifiedGuest.maxGuests};
      guestNameInput.value = verifiedGuest.name;
      guestNameInput.readOnly = true;
      if (!wishNameInput.value) wishNameInput.value = verifiedGuest.name;
      guestCountSelect.replaceChildren(guestCountSelect.options[0]);
      for (let count = 1; count <= verifiedGuest.maxGuests; count++) {
        guestCountSelect.add(new Option(String(count), String(count)));
      }
      guestCountSelect.value = '';
      renderGuestCopy();
      submitButton.disabled = false;
      syncAttendance();
      setStatus(formStatus, '', '');
      finishOpening();
    } catch {
      invitationChecking = false;
      setStatus(formStatus, t('dynamic.inviteUnavailable'), 'error');
      setInvitationGate('dynamic.inviteUnavailable', true);
    }
  }

  async function postToBackend(payload) {
    const endpoint = backendEndpoint();
    if (!endpoint) return {ok: false, reason: 'unconfigured'};
    const body = JSON.stringify(payload);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: {'Content-Type': 'text/plain;charset=utf-8'}, body
      });
      if (response.ok) {
        const result = await response.json();
        if (typeof result.ok === 'boolean') return result;
      }
    } catch {}
    // An unreadable response is never treated as a successful RSVP.
    // Retrying the same request ID is idempotent on the server.
    if (payload.type !== 'rsvp') return {ok: false, reason: 'network'};
    try {
      await fetch(endpoint, {method: 'POST', mode: 'no-cors',
        headers: {'Content-Type': 'text/plain;charset=utf-8'}, body});
      for (let attempt = 0; attempt < 5; attempt++) {
        const receipt = await backendQuery({action: 'receipt', code: inviteCode, requestId: payload.requestId});
        if (!receipt.pending) return receipt;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch {}
    return {ok: false, reason: 'network'};
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
  const eventSelect = form.elements.events;
  eventSelect.value = '';

  function syncAttendance() {
    const attending = form.querySelector('input[name="attendance"]:checked').value === 'attending';
    guestCountSelect.disabled = !attending || Boolean(backendEndpoint() && !verifiedGuest);
    eventSelect.disabled = !attending;
  }
  for (const input of attendanceInputs) input.addEventListener('change', syncAttendance);
  syncAttendance();

  function buildWhatsAppLink(payload) {
    const number = String(config.contactWhatsApp || '').replace(/\D/g, '');
    if (!number) return null;
    const eventLabels = {
      both: t('rsvp.both'),
      'holy-matrimony': t('rsvp.holyOnly'),
      reception: t('rsvp.receptionOnly')
    };
    const lines = [
      t('dynamic.waTitle'),
      `${t('dynamic.waName')}: ${payload.name}`,
      `${t('dynamic.waAttendance')}: ${payload.attendance === 'attending' ? t('dynamic.waAttending') : t('dynamic.waNotAttending')}`,
      payload.attendance === 'attending' ? `${t('dynamic.waEvents')}: ${eventLabels[payload.events] || eventLabels.both}` : null,
      payload.attendance === 'attending' ? `${t('dynamic.waGuests')}: ${payload.guests}` : null,
      payload.message ? `${t('dynamic.waNote')}: ${payload.message}` : null
    ].filter(Boolean);
    return `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (backendEndpoint() && !verifiedGuest) {
      setStatus(formStatus, t('dynamic.inviteInvalid'), 'error'); return;
    }
    if (!form.reportValidity()) return;
    if (verifiedGuest && Number(guestCountSelect.value) > verifiedGuest.maxGuests) {
      setStatus(formStatus, t('dynamic.inviteRejected'), 'error'); return;
    }

    // Honeypot: real guests never fill this field out.
    if (honeypot && honeypot.value.trim() !== '') {
      setStatus(formStatus, t('dynamic.honeypot'), 'success');
      return;
    }

    const attending = form.querySelector('input[name="attendance"]:checked').value === 'attending';
    const payload = {
      type: 'rsvp',
      code: inviteCode,
      requestId: crypto.randomUUID(),
      name: guestNameInput.value.trim().slice(0, 100),
      attendance: attending ? 'attending' : 'not-attending',
      events: attending ? eventSelect.value : '',
      guests: attending ? Number(guestCountSelect.value) : 0,
      message: guestMessageInput.value.trim().slice(0, 500),
      invitedAs: verifiedGuest ? verifiedGuest.name : invitedName,
      submittedAt: new Date().toISOString(),
      page: window.location.origin + window.location.pathname
    };

    submitButton.disabled = true;
    submitButton.textContent = t('dynamic.sendingRsvp');
    setStatus(formStatus, t('dynamic.sendingRsvp'), 'pending');

    const result = await postToBackend(payload);

    submitButton.disabled = false;
    submitButton.textContent = t('rsvp.submit');

    if (result.ok) {
      saveResponse(payload);
      savedResponse = {...payload, savedAt: Date.now()};
      setStatus(formStatus, t('dynamic.rsvpSuccess'), 'success');
      return;
    }

    if (result.reason === 'unconfigured') {
      setStatus(formStatus, t('dynamic.rsvpPreview'), 'error');
      return;
    }

    setStatus(formStatus, t(result.error ? 'dynamic.inviteRejected' : 'dynamic.rsvpError'), 'error');
    const whatsapp = buildWhatsAppLink(payload);
    if (whatsapp) {
      const link = document.createElement('a');
      link.href = whatsapp;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = t('dynamic.whatsapp');
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
    return date.toLocaleDateString(currentLang === 'id' ? 'id-ID' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function renderWishes(wishes) {
    latestWishes = wishes;
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
    if (backendEndpoint()) {
      renderWishes(await fetchWishes());
    } else {
      renderWishes(readLocalWishes());
    }
  }

  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!wishForm.reportValidity()) return;

    const wish = {
      type: 'wish',
      name: wishNameInput.value.trim().slice(0, 60),
      message: wishMessageInput.value.trim().slice(0, 300),
      submittedAt: new Date().toISOString(),
      page: window.location.origin + window.location.pathname
    };
    if (!wish.name || !wish.message) return;

    wishSubmit.disabled = true;
    wishSubmit.textContent = t('dynamic.sendingWish');
    setStatus(wishStatus, t('dynamic.sendingWish'), 'pending');

    const result = await postToBackend(wish);

    wishSubmit.disabled = false;
    wishSubmit.textContent = t('wishes.submit');

    if (result.ok) {
      renderWishes(await fetchWishes());
      wishMessageInput.value = '';
      setStatus(wishStatus, t('dynamic.wishSuccess'), 'success');
      return;
    }

    if (result.reason === 'unconfigured') {
      const local = saveLocalWish(wish);
      renderWishes(local);
      wishMessageInput.value = '';
      setStatus(wishStatus, t('dynamic.wishSaved'), 'saved');
      return;
    }

    setStatus(wishStatus, t('dynamic.wishError'), 'error');
  });

  applyLanguage(currentLang);
  loadInvitation();
  openingAssetsReady.then(() => {
    clearTimeout(window.assetLoadTimeout);
    document.documentElement.classList.remove('assets-loading');
  });
  loadWishes();
})();
