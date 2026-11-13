(() => {
  const config = window.WEDDING_CONFIG || {};
  let invitationReady = !String(config.rsvpEndpoint || '').trim();
  let invitationChecking = !invitationReady;
  let invitationStatusKey = '';
  let invitationRetry = false;
  const MAX_SEATS = 4;
  const inviteCode = new URLSearchParams(window.location.search).get('code') || '';
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
      "details.calendar": "Add to calendar",
      "details.calendarBoth": "Both events",
      "details.calendarClose": "Close",
      "details.calendarChoose": "Choose your calendar app.",
      "details.calendarTitle": "Richard & Natasha — {event}",
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
      "rsvp.lateNotice": "If you are replying within two weeks of the wedding, or need to change your plans later, please contact us directly.",
      "rsvp.attendance": "Attendance",
      "rsvp.attendYes": "✓ I will attend",
      "rsvp.attendNo": "× I can't attend",
      "rsvp.events": "Which events will you join?",
      "rsvp.eventsPlaceholder": "Select events",
      "dynamic.inviteLoading": "Checking your invitation…",
      "dynamic.responseLoading": "Loading your saved response…",
      "dynamic.responseUnavailable": "We couldn’t load your saved response. Reload to try again.",
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
      "rsvp.countHint": "Please list the names of additional guests in the private note below.",
      "rsvp.note": "Guest names & dietary needs (optional)",
      "rsvp.privateHint": "Only visible to us.",
      "rsvp.notePlaceholder": "Names of additional guests, dietary needs, or accessibility requests",
      "rsvp.submit": "Submit RSVP",
      "rsvp.savedTitle": "Your saved response",
      "rsvp.edit": "Edit response",
      "rsvp.cancel": "Cancel",
      "rsvp.saveChanges": "Save changes",
      "rsvp.savedAttendance": "Attendance",
      "rsvp.savedEvents": "Events",
      "rsvp.savedGuests": "People",
      "rsvp.savedNote": "Private note",
      "rsvp.savedDate": "Saved",
      "gift.intro": "WITH GRATITUDE",
      "gift.title": "Wedding Gift",
      "gift.body": "Your presence is the greatest gift we could ask for. If you would like to bless us with something more, a contribution toward our first home would be received with heartfelt thanks.",
      "gift.domesticTab": "Domestic",
      "gift.internationalTab": "International",
      "gift.domestic": "DOMESTIC TRANSFER",
      "gift.international": "INTERNATIONAL TRANSFER",
      "gift.bank": "Bank",
      "gift.bankTransfer": "Bank transfer",
      "gift.swift": "SWIFT / BIC",
      "gift.accountNumber": "Account number",
      "gift.accountName": "Account name",
      "gift.bankAddress": "Bank address",
      "gift.note": "Please use your full name as the transfer reference. For transfer assistance, please contact us directly.",
      "gift.copyAccount": "Copy account number",
      "gift.copySwift": "Copy SWIFT code",
      "gift.copy": "Copy",
      "gift.network": "Network",
      "gift.wallet": "Wallet address",
      "gift.memo": "Memo / tag",
      "gift.details": "Details",
      "gift.link": "Link",
      "gift.paypalAccount": "PayPal account",
      "gift.openPaypal": "Open PayPal",
      "gift.openLink": "Open link",
      "gift.methods": "Gift methods",
      "gift.unavailable": "Gift details are being prepared.",
      "gift.networkNote": "Use the selected network when sending.",
      "wishes.intro": "FROM THE HEART",
      "wishes.title": "Words of Love",
      "wishes.body": "Leave a wish for the two of us. Your message will be public in the Words of Love feed.",
      "wishes.name": "Your name",
      "wishes.namePlaceholder": "Your name",
      "wishes.wish": "Your wish",
      "wishes.wishPlaceholder": "A few words for Richard & Natasha",
      "wishes.submit": "Send your wish",
      "wishes.edit": "Edit your wish",
      "wishes.update": "Save changes",
      "wishes.editHint": "One wish per invitation. You can come back and edit yours anytime.",
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
      "dynamic.wishSuccess": "Thank you, your wish has been saved. You can return to edit it.",
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
      "details.calendar": "Tambah ke kalender",
      "details.calendarBoth": "Kedua acara",
      "details.calendarClose": "Tutup",
      "details.calendarChoose": "Pilih aplikasi kalender Anda.",
      "details.calendarTitle": "Richard & Natasha — {event}",
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
      "rsvp.lateNotice": "Jika Anda mengonfirmasi dalam 14 hari menjelang pernikahan, atau perlu mengubah rencana setelahnya, silakan hubungi kami langsung.",
      "rsvp.attendance": "Kehadiran",
      "rsvp.attendYes": "✓ Saya akan hadir",
      "rsvp.attendNo": "× Saya tidak bisa hadir",
      "rsvp.events": "Acara yang akan Anda hadiri",
      "rsvp.eventsPlaceholder": "Pilih acara",
      "dynamic.inviteLoading": "Memeriksa undangan Anda…",
      "dynamic.responseLoading": "Memuat jawaban Anda yang tersimpan…",
      "dynamic.responseUnavailable": "Jawaban Anda belum dapat dimuat. Muat ulang halaman untuk mencoba lagi.",
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
      "rsvp.countHint": "Tuliskan nama tamu tambahan di catatan pribadi di bawah.",
      "rsvp.note": "Nama tamu & kebutuhan makan (opsional)",
      "rsvp.privateHint": "Hanya terlihat oleh kami.",
      "rsvp.notePlaceholder": "Nama tamu tambahan, pantangan makanan, atau kebutuhan aksesibilitas",
      "rsvp.submit": "Kirim RSVP",
      "rsvp.savedTitle": "Jawaban Anda tersimpan",
      "rsvp.edit": "Ubah jawaban",
      "rsvp.cancel": "Batal",
      "rsvp.saveChanges": "Simpan perubahan",
      "rsvp.savedAttendance": "Kehadiran",
      "rsvp.savedEvents": "Acara",
      "rsvp.savedGuests": "Jumlah orang",
      "rsvp.savedNote": "Catatan pribadi",
      "rsvp.savedDate": "Tersimpan",
      "gift.intro": "DENGAN RASA SYUKUR",
      "gift.title": "Hadiah Pernikahan",
      "gift.body": "Kehadiran Anda adalah hadiah terindah bagi kami. Jika ingin memberikan hadiah, dukungan Anda untuk mewujudkan rumah pertama kami akan sangat berarti.",
      "gift.domesticTab": "Dalam Negeri",
      "gift.internationalTab": "Luar Negeri",
      "gift.domestic": "TRANSFER DALAM NEGERI",
      "gift.international": "TRANSFER LUAR NEGERI",
      "gift.bank": "Bank",
      "gift.bankTransfer": "Transfer bank",
      "gift.swift": "SWIFT / BIC",
      "gift.accountNumber": "Nomor rekening",
      "gift.accountName": "Nama rekening",
      "gift.bankAddress": "Alamat bank",
      "gift.note": "Cantumkan nama lengkap Anda pada keterangan transfer. Jika ada pertanyaan, silakan hubungi kami.",
      "gift.copyAccount": "Salin nomor rekening",
      "gift.copySwift": "Salin kode SWIFT",
      "gift.copy": "Salin",
      "gift.network": "Jaringan",
      "gift.wallet": "Alamat dompet",
      "gift.memo": "Memo / tag",
      "gift.details": "Keterangan",
      "gift.link": "Tautan",
      "gift.paypalAccount": "Akun PayPal",
      "gift.openPaypal": "Buka PayPal",
      "gift.openLink": "Buka tautan",
      "gift.methods": "Pilihan hadiah",
      "gift.unavailable": "Informasi hadiah sedang disiapkan.",
      "gift.networkNote": "Gunakan jaringan yang dipilih saat mengirim.",
      "wishes.intro": "DARI HATI",
      "wishes.title": "Ucapan untuk Kami",
      "wishes.body": "Tuliskan doa dan harapan untuk kami. Pesan Anda akan ditampilkan di bagian Ucapan untuk Kami agar dapat dibaca tamu lain.",
      "wishes.name": "Nama Anda",
      "wishes.namePlaceholder": "Nama Anda",
      "wishes.wish": "Ucapan Anda",
      "wishes.wishPlaceholder": "Tuliskan pesan untuk Richard & Natasha",
      "wishes.submit": "Kirim ucapan",
      "wishes.edit": "Ubah ucapan Anda",
      "wishes.update": "Simpan perubahan",
      "wishes.editHint": "Satu ucapan untuk setiap undangan. Anda bisa kembali untuk mengubahnya kapan saja.",
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
      "dynamic.wishSuccess": "Terima kasih, ucapan Anda sudah tersimpan. Anda bisa kembali untuk mengubahnya.",
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

    renderCalendarTimes();
    renderGuestCopy();
    renderInvitationGate();
    renderSavedStatus();
    renderOwnWish();
    renderGifts();
    if (submitButton) submitButton.textContent = t(editingSavedResponse ? 'rsvp.saveChanges' : 'rsvp.submit');
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
    const blend = 1 - Math.exp(-elapsed / 300);
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
  const form = document.getElementById('rsvpForm');
  const formStatus = document.getElementById('formStatus');
  const submitButton = form.querySelector('button[type="submit"]');
  const rsvpFields = document.getElementById('rsvpFields');
  const savedRsvp = document.getElementById('savedRsvp');
  const savedRsvpDetails = document.getElementById('savedRsvpDetails');
  const editRsvpButton = document.getElementById('editRsvp');
  const cancelRsvpEdit = document.getElementById('cancelRsvpEdit');
  const coverGuest = document.getElementById('coverGuest');
  const guestSeatNote = document.getElementById('guestSeatNote');
  const letterFor = document.getElementById('letterFor');
  const honeypot = document.getElementById('rsvpWebsite');

  const wishForm = document.getElementById('wishForm');
  const wishNameInput = document.getElementById('wishName');
  const wishMessageInput = document.getElementById('wishMessage');
  const wishStatus = document.getElementById('wishStatus');
  const wishList = document.getElementById('wishList');
  const wishesEmpty = document.getElementById('wishesEmpty');
  const wishSubmit = wishForm.querySelector('button[type=submit]');
  const wishFields = document.getElementById('wishFields');
  const savedWishBox = document.getElementById('savedWish');
  const cancelWish = document.getElementById('cancelWish');
  let ownWish = null;
  let editingWish = false;

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

  let savedResponse = null;
  let editingSavedResponse = false;
  function clearRsvpFields() {
    for (const input of form.querySelectorAll('input[name="attendance"]')) input.checked = false;
    form.elements.events.value = '';
    guestCountSelect.value = '';
  }
  function fillRsvpFields(response) {
    const value = response || {};
    for (const input of form.querySelectorAll('input[name="attendance"]')) input.checked = input.value === value.attendance;
    form.elements.events.value = value.events || '';
    guestCountSelect.value = value.attendance === 'attending' && value.guests ? String(value.guests) : '';
    syncAttendance();
  }
  function savedDate(value) {
    const date = typeof value === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(value)
      ? new Date(value.replace(' ', 'T') + '+07:00') : new Date(value || Date.now());
    return date.toLocaleDateString(currentLang === 'id' ? 'id-ID' : 'en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta'});
  }
  function renderSavedResponse() {
    if (!savedResponse) { savedRsvp.hidden = true; return; }
    const attending = savedResponse.attendance === 'attending';
    const attendanceText = t(attending ? 'dynamic.waAttending' : 'dynamic.waNotAttending');
    const eventText = savedResponse.events ? t(({both:'rsvp.both','holy-matrimony':'rsvp.holyOnly',reception:'rsvp.receptionOnly'})[savedResponse.events] || 'rsvp.both') : '';
    const rows = [
      [t('rsvp.savedAttendance'), attendanceText],
      ...(attending ? [[t('rsvp.savedEvents'), eventText], [t('rsvp.savedGuests'), String(savedResponse.guests || '')]] : []),
      [t('rsvp.savedDate'), savedDate(savedResponse.submittedAt)]
    ];
    savedRsvpDetails.replaceChildren(...rows.flatMap(([label, value]) => {
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value;
      return [dt, dd];
    }));
    savedRsvp.hidden = editingSavedResponse;
    rsvpFields.hidden = !editingSavedResponse;
  }
  function beginRsvpEdit() {
    editingSavedResponse = true;
    fillRsvpFields(savedResponse);
    renderSavedResponse();
    cancelRsvpEdit.hidden = false;
    editRsvpButton.hidden = true;
    submitButton.textContent = t('rsvp.saveChanges');
    setStatus(formStatus, '', '');
  }
  editRsvpButton.addEventListener('click', beginRsvpEdit);
  cancelRsvpEdit.addEventListener('click', () => {
    editingSavedResponse = false;
    fillRsvpFields(savedResponse);
    renderSavedResponse();
    cancelRsvpEdit.hidden = true;
    editRsvpButton.hidden = false;
    submitButton.textContent = t('rsvp.submit');
    setStatus(formStatus, '', '');
  });
  function renderSavedStatus() { renderSavedResponse(); }

  // URL name is provisional; verified sheet names are used exactly as entered.
  const rawName = params.get('name') || params.get('to') || nameFromPath();
  const invitedName = rawName.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 100);
  const requestedSeats = Number.parseInt(params.get('guests') || '', 10);
  let verifiedGuest = null;
  let invitationDetailsReady = !backendEndpoint();
  let personalization = {invitedName: '', seats: null};

  if (invitedName && !backendEndpoint()) {
    const plusOne = params.get('plus') !== '0';
    const seats = Number.isFinite(requestedSeats)
      ? clampSeats(requestedSeats)
      : (plusOne ? 2 : 1);
    personalization = {invitedName, seats};

    guestNameInput.value = invitedName;
    if (!wishNameInput.value) wishNameInput.value = invitedName;
  } else if (invitedName) {
    // URL names are provisional display copy only; code verification supplies
    // the authoritative name and allowance before RSVP can be submitted.
    personalization = {invitedName, seats: null};
    guestNameInput.value = invitedName;
  }

  // Guests must explicitly confirm their party size, including on personalised links.
  guestCountSelect.value = '';

  function renderGuestCopy() {
    document.getElementById('guestNameDisplay').textContent = guestNameInput.value || '—';
    document.getElementById('wishNameDisplay').textContent = guestNameInput.value || '—';
    if (!personalization.invitedName) {
      coverGuest.hidden = true;
      guestSeatNote.hidden = true;
      letterFor.textContent = t('cover.letterForYou');
      return;
    }

    coverGuest.hidden = false;
    coverGuest.textContent = format(t('dynamic.guestGreeting'), {
      name: personalization.invitedName,
      label: ''
    });
    letterFor.textContent = format(t('dynamic.letterFor'), {name: personalization.invitedName});
    guestSeatNote.hidden = true;
  }

  // Countdown to the ceremony: Sunday, 17 January 2027, 18:00 WIB (UTC+7).
  const weddingDate = new Date(config.weddingDate || '2027-01-17T18:00:00+07:00');
  const countdown = {
    days: document.getElementById('countDays'),
    hours: document.getElementById('countHours'),
    minutes: document.getElementById('countMinutes'),
    seconds: document.getElementById('countSeconds')
  };
  const pad = (value, length = 2) => String(value).padStart(length, '0');

  function updateCountdown() {
    const remaining = weddingDate.getTime() - Date.now();
    const lateNotice = document.getElementById('rsvpLateNotice');
    if (lateNotice) lateNotice.hidden = remaining < 0 || remaining > 14 * 24 * 60 * 60 * 1000;
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

  // Sheet-driven gift methods remain independent of the display language.
  let giftData = null;
  let giftGroup = 'domestic';
  const giftMethod = {domestic:'bca', international:'bank'};
  const giftAccount = {};
  const giftTabs = Array.from(document.querySelectorAll('.gift-tabs [role="tab"]'));
  const methodNames = {bca:'BCA', jago:'Jago', bank:'Bank transfer', paypal:'PayPal', crypto:'Crypto'};

  function giftText(tag, value, className) {
    const node = document.createElement(tag); node.textContent = value;
    if (className) node.className = className;
    return node;
  }

  function giftField(list, key, value, id) {
    if (!value) return;
    const row = document.createElement('div');
    const label = giftText('dt', t(key));
    const dd = document.createElement('dd');
    const text = giftText('span', value); text.id = id;
    const copy = document.createElement('button');
    copy.className = 'gift-copy gift-copy-inline';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<rect class="copy-shape" x="8" y="8" width="12" height="12" rx="2"/><path class="copy-shape" d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/><path class="copy-check" d="m5 12 4 4L19 6"/>';
    copy.append(icon);
    copy.type = 'button'; copy.dataset.copy = id;
    copy.setAttribute('aria-label', `${t('gift.copy')}: ${t(key)}`);
    copy.title = copy.getAttribute('aria-label');
    dd.append(text, copy); row.append(label, dd); list.append(row);
  }

  function tabKeys(event, tabs, current, choose) {
    let index = tabs.indexOf(current);
    if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') index = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else return;
    event.preventDefault(); choose(tabs[index]);
    document.getElementById(tabs[index].id)?.focus();
  }

  function renderGifts() {
    const section = document.getElementById('gift');
    const empty = Array.isArray(giftData) && giftData.length === 0;
    section.hidden = false;
    document.querySelector('.head-nav a[href="#gift"]').hidden = false;
    document.querySelector('.gift-tabs').hidden = empty;
    if (empty) {
      document.getElementById('domesticPanel').hidden = false;
      document.getElementById('domesticPanel').replaceChildren(giftText('p', t('gift.unavailable'), 'gift-note'));
      document.getElementById('internationalPanel').hidden = true;
      return;
    }
    const groups = ['domestic', 'international'];
    if (giftData && !giftData.some(row => row.group === giftGroup)) giftGroup = groups.find(group => giftData.some(row => row.group === group)) || 'domestic';
    for (const group of groups) {
      const tab = document.getElementById(group + 'Tab');
      const panel = document.getElementById(group + 'Panel');
      const rows = (giftData || []).filter(row => row.group === group);
      tab.hidden = Boolean(giftData && !rows.length);
      const active = giftGroup === group;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active; panel.replaceChildren();
      if (!giftData) { panel.append(giftText('p', t('gift.unavailable'), 'gift-note')); continue; }
      if (!rows.length) continue;
      const order = ['bca','jago','bank','paypal','crypto'];
      const methods = [...new Set(rows.map(row => row.method))].sort((a,b) => order.indexOf(a) - order.indexOf(b));
      if (!methods.includes(giftMethod[group])) giftMethod[group] = methods[0];
      const tabs = document.createElement('div'); tabs.className = 'gift-method-tabs';
      tabs.setAttribute('role','tablist'); tabs.setAttribute('aria-label', t('gift.methods'));
      const methodPanelId = group + '-gift-method-panel';
      for (const method of methods) {
        const button = giftText('button', method === 'bank' ? t('gift.bankTransfer') : methodNames[method] || method);
        button.id = group + '-gift-' + method; button.type = 'button'; button.setAttribute('role','tab');
        button.setAttribute('aria-controls', methodPanelId);
        button.setAttribute('aria-selected', String(method === giftMethod[group]));
        button.tabIndex = method === giftMethod[group] ? 0 : -1;
        const choose = selected => {giftMethod[group] = selected.dataset.method; renderGifts();};
        button.dataset.method = method;
        button.addEventListener('click', () => {choose(button); document.getElementById(button.id).focus();});
        button.addEventListener('keydown', event => tabKeys(event, Array.from(tabs.children), button, choose));
        tabs.append(button);
      }
      panel.append(tabs);
      const content = document.createElement('div'); content.id = methodPanelId;
      content.setAttribute('role','tabpanel'); content.setAttribute('aria-labelledby', group + '-gift-' + giftMethod[group]);
      const accounts = rows.filter(row => row.method === giftMethod[group]);
      const choiceKey = group + '-' + giftMethod[group];
      let account = accounts.find(row => row.id === giftAccount[choiceKey]) || accounts[0];
      if (accounts.length > 1 || account.method === 'crypto') {
        const label = giftText('label', t(account.method === 'crypto' ? 'gift.network' : 'gift.accountNumber'), 'form-label');
        label.htmlFor = group + '-gift-account';
        const select = document.createElement('select'); select.id = label.htmlFor; select.className = 'field gift-network';
        for (const row of accounts) select.add(new Option(row.network || row.label, row.id));
        select.value = account.id;
        select.addEventListener('change', () => {giftAccount[choiceKey] = select.value; renderGifts(); document.getElementById(select.id)?.focus();});
        content.append(label, select);
      }
      content.append(giftText('p', account.method === 'crypto' ? account.network : account.label, 'gift-bank'));
      const list = document.createElement('dl'); list.className = 'gift-details';
      const id = 'gift-value-' + account.id + '-';
      if (account.method === 'crypto') giftField(list, 'gift.network', account.network, id + 'network');
      giftField(list, account.method === 'crypto' ? 'gift.wallet' : account.method === 'paypal' ? 'gift.paypalAccount' : 'gift.accountNumber', account.account, id + 'account');
      giftField(list, 'gift.accountName', account.accountName, id + 'name');
      giftField(list, 'gift.swift', account.swift, id + 'swift');
      giftField(list, 'gift.bankAddress', account.bankAddress, id + 'bank-address');
      giftField(list, 'gift.memo', account.memo, id + 'memo');
      giftField(list, 'gift.details', account.details, id + 'details');
      giftField(list, 'gift.link', account.link, id + 'link');
      content.append(list);
      if (account.link && /^https:\/\//i.test(account.link)) {
        const link = giftText('a', t(account.method === 'paypal' ? 'gift.openPaypal' : 'gift.openLink'), 'gift-copy gift-open-link');
        link.href = account.link; link.target = '_blank'; link.rel = 'noopener noreferrer'; content.append(link);
      }
      if (account.example) {
        content.querySelectorAll('.gift-open-link').forEach(link => link.remove());
      } else if (account.method === 'crypto') content.append(giftText('p', t('gift.networkNote'), 'gift-note'));
      panel.append(content);
    }
  }
  giftTabs.forEach(tab => {
    const choose = selected => {giftGroup = selected.id === 'domesticTab' ? 'domestic' : 'international'; renderGifts();};
    tab.addEventListener('click', () => choose(tab));
    tab.addEventListener('keydown', event => tabKeys(event, giftTabs.filter(item => !item.hidden), tab, choose));
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

  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const target = document.getElementById(button.dataset.copy);
    if (!target) return;
    const originalLabel = button.getAttribute('aria-label');
    const copied = await copyToClipboard(target.textContent.trim());
    button.dataset.copyState = copied ? 'copied' : 'failed';
    button.setAttribute('aria-label', t(copied ? 'dynamic.copied' : 'dynamic.copyFailed'));
    button.title = t(copied ? 'dynamic.copied' : 'dynamic.copyFailed');
    window.setTimeout(() => {
      delete button.dataset.copyState;
      button.setAttribute('aria-label', originalLabel); button.title = originalLabel;
    }, 1600);
  });

  // ---------------------------------------------------------------------
  // Backend helpers
  // ---------------------------------------------------------------------

  let querySequence = 0;
  // Reads prefer the validation Worker, which forwards to Apps Script
  // server-side and returns plain JSON with CORS. The direct Apps Script path
  // needs a <script> tag (JSONP) because it cannot set CORS headers, and mobile
  // browsers block that; the Worker remains the fallback-safe route.
  async function workerProxyQuery(parameters) {
    const worker = String(config.validationEndpoint || '').trim();
    if (!worker) throw new Error('no worker');
    const proxy = new URL('/rsvp', worker);
    Object.entries(parameters).forEach(([key, value]) => proxy.searchParams.set(key, value));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(proxy.href, {signal:controller.signal, cache:'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function backendQuery(parameters) {
    const url = new URL(backendEndpoint());
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, value));
    // Try the CORS proxy first; it avoids JSONP entirely.
    if (/script\.google\.com/.test(url.hostname)) {
      try {
        return await workerProxyQuery(parameters);
      } catch { /* Fall through to the JSONP path below. */ }
    }
    // Apps Script uses one JSONP request, avoiding duplicate sheet executions.
    if (url.hostname !== 'script.google.com') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(url.href, {signal:controller.signal, cache:'no-store'});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } finally { clearTimeout(timer); }
    }
    return new Promise((resolve, reject) => {
      const callback = 'wedding_' + Date.now() + '_' + (++querySequence);
      const script = document.createElement('script');
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Invitation lookup timed out'));
      }, 20000);
      const cleanup = () => {
        clearTimeout(timer); script.remove();
        window[callback] = () => {};
        setTimeout(() => { delete window[callback]; }, 60000);
      };
      window[callback] = result => { cleanup(); resolve(result); };
      script.onerror = () => {
        cleanup();
        reject(new Error('Invitation script request blocked'));
      };
      url.searchParams.set('callback', callback); script.src = url.href;
      document.body.appendChild(script);
    });
  }

  function renderInvitationGate() {
    const status = document.getElementById('invitationStatus');
    status.textContent = invitationStatusKey ? t(invitationStatusKey) : '';
    // Keep the message slot in the layout while verification waits for the animation.
    status.hidden = false;
    status.style.visibility = invitationStatusKey && (!invitationChecking || openingAnimationDone) ? 'visible' : 'hidden';
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
    invitationDetailsReady = false;
    wishFields.inert = true;
    renderOwnWish();
    setInvitationGate('dynamic.inviteLoading');
    rsvpFields.inert = true;
    submitButton.disabled = true;
    guestCountSelect.disabled = true;
    setStatus(formStatus, t('dynamic.inviteLoading'), 'pending');
    if (!/^[a-zA-Z0-9]{8,64}$/.test(inviteCode)) {
      personalization = {invitedName: '', seats: null};
      guestNameInput.value = '';
      renderGuestCopy();
      invitationChecking = false;
      setStatus(formStatus, t('dynamic.inviteInvalid'), 'error');
      setInvitationGate('dynamic.inviteInvalid');
      return;
    }
    let earlyValidated = false;
    try {
      const worker = String(config.validationEndpoint || '').trim();
      if (worker) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        try {
          const response = await fetch(worker, {
            method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'},
            body:JSON.stringify({code:inviteCode}), signal:controller.signal, cache:'no-store'
          });
          const edge = await response.json();
          if (response.status === 400 || response.status === 403) {
            personalization = {invitedName:'', seats:null}; guestNameInput.value=''; renderGuestCopy();
            invitationChecking=false;
            setInvitationGate('dynamic.inviteInvalid');
            setStatus(formStatus,t('dynamic.inviteInvalid'),'error');
            return;
          }
          if (response.ok && edge.ok && edge.guest && String(edge.guest.name||'').trim() && Number.isInteger(edge.guest.maxGuests) && edge.guest.maxGuests >= 1 && edge.guest.maxGuests <= 100) {
            earlyValidated = true;
            verifiedGuest = edge.guest;
            invitationReady = true; invitationChecking = false;
            personalization = {invitedName:verifiedGuest.name,seats:verifiedGuest.maxGuests};
            guestNameInput.value = verifiedGuest.name; wishNameInput.value = verifiedGuest.name;
            renderGuestCopy(); setInvitationGate('');
            setStatus(formStatus,t('dynamic.responseLoading'),'pending');
            setStatus(wishStatus,t('dynamic.responseLoading'),'pending');
            finishOpening();
          }
        } catch { /* A temporary Worker failure falls back to private-sheet validation. */ }
        finally { clearTimeout(timer); }
      }
      const result = await backendQuery({action: 'guest', code: inviteCode});
      if (!result.ok || !result.guest || !String(result.guest.name || '').trim() || !Number.isInteger(result.guest.maxGuests) || result.guest.maxGuests < 1 || result.guest.maxGuests > 100) {
        personalization = {invitedName: '', seats: null};
        guestNameInput.value = '';
        renderGuestCopy();
        invitationChecking = false;
        setStatus(formStatus, t('dynamic.inviteInvalid'), 'error');
        if (!earlyValidated) setInvitationGate('dynamic.inviteInvalid');
        verifiedGuest = null; renderOwnWish();
        setStatus(wishStatus, t('dynamic.inviteInvalid'), 'error'); return;
      }
      verifiedGuest = result.guest;
      invitationDetailsReady = true;
      wishFields.inert = false;
      setStatus(wishStatus, '', '');
      invitationReady = true;
      invitationChecking = false;
      setInvitationGate('');
      personalization = {invitedName: verifiedGuest.name, seats: verifiedGuest.maxGuests};
      guestNameInput.value = verifiedGuest.name;
      guestNameInput.readOnly = true;
      wishNameInput.value = verifiedGuest.name;
      giftData = Array.isArray(result.gifts) ? result.gifts : null;
      renderGifts();
      ownWish = result.wish || null;
      editingWish = false;
      renderOwnWish();
      guestCountSelect.replaceChildren(guestCountSelect.options[0]);
      for (let count = 1; count <= verifiedGuest.maxGuests; count++) {
        guestCountSelect.add(new Option(String(count), String(count)));
      }
      guestCountSelect.value = '';
      renderGuestCopy();
      savedResponse = result.response && result.response.attendance ? {
        ...result.response,
        name: verifiedGuest.name
      } : null;
      editingSavedResponse = false;
      if (savedResponse) fillRsvpFields(savedResponse);
      else clearRsvpFields();
      renderSavedResponse();
      cancelRsvpEdit.hidden = true;
      editRsvpButton.hidden = false;
      rsvpFields.inert = false;
      submitButton.disabled = false;
      syncAttendance();
      setStatus(formStatus, '', '');
      finishOpening();
    } catch {
      invitationChecking = false;
      if (earlyValidated) {
        setStatus(formStatus, t('dynamic.responseUnavailable'), 'error');
        setStatus(wishStatus, t('dynamic.responseUnavailable'), 'error');
      } else {
        personalization = {invitedName:'',seats:null}; guestNameInput.value=''; renderGuestCopy();
        setStatus(formStatus, t('dynamic.inviteUnavailable'), 'error');
        setInvitationGate('dynamic.inviteUnavailable', true);
      }
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
    // Retrying the same request ID does not create another wish or RSVP.
    if (!payload.code || !payload.requestId) return {ok: false, reason: 'network'};
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

  // Apps Script cannot set CORS headers reliably, so the wishes feed goes
  // through the Worker proxy first and falls back to JSONP.
  function fetchWishes() {
    const endpoint = backendEndpoint();
    if (!endpoint) return Promise.resolve([]);
    if (/script\.google\.com/.test(endpoint)) {
      return workerProxyQuery({action: 'wishes'})
        .then(result => result.wishes || [])
        .catch(() => jsonpWishes(endpoint));
    }

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
    const attendance = form.querySelector('input[name="attendance"]:checked');
    const attending = Boolean(attendance && attendance.value === 'attending');
    guestCountSelect.disabled = !attending || Boolean(backendEndpoint() && (!verifiedGuest || !invitationDetailsReady));
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
    if (backendEndpoint() && (!verifiedGuest || !invitationDetailsReady)) {
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

    const attendance = form.querySelector('input[name="attendance"]:checked');
    if (!attendance) return;
    const attending = attendance.value === 'attending';
    const payload = {
      type: 'rsvp',
      code: inviteCode,
      requestId: crypto.randomUUID(),
      name: guestNameInput.value.trim().slice(0, 100),
      attendance: attending ? 'attending' : 'not-attending',
      events: attending ? eventSelect.value : '',
      guests: attending ? Number(guestCountSelect.value) : 0,
      invitedAs: verifiedGuest ? verifiedGuest.name : invitedName,
      submittedAt: new Date().toISOString(),
      page: window.location.origin + window.location.pathname
    };

    submitButton.disabled = true;
    submitButton.textContent = t('dynamic.sendingRsvp');
    rsvpFields.inert = true;
    setStatus(formStatus, t('dynamic.sendingRsvp'), 'pending');

    const result = await postToBackend(payload);

    submitButton.disabled = false;
    rsvpFields.inert = false;
    submitButton.textContent = t(editingSavedResponse ? 'rsvp.saveChanges' : 'rsvp.submit');

    if (result.ok) {
      savedResponse = {
        ...payload,
        name: verifiedGuest ? verifiedGuest.name : payload.name,
        submittedAt: result.submittedAt || new Date().toISOString()
      };
      editingSavedResponse = false;
      submitButton.textContent = t('rsvp.submit');
      fillRsvpFields(savedResponse);
      rsvpFields.hidden = true;
      savedRsvp.hidden = false;
      cancelRsvpEdit.hidden = true;
      editRsvpButton.hidden = false;
      renderSavedResponse();
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
  function formatWishDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(currentLang === 'id' ? 'id-ID' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function renderWishes(wishes) {
    latestWishes = wishes;
    const visible = wishes
      .filter(wish => wish && String(wish.message || '').trim() && String(wish.name || '').trim())
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

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
      renderWishes([]);
    }
  }

  function renderOwnWish() {
    savedWishBox.hidden = !ownWish || editingWish;
    wishFields.hidden = Boolean(ownWish && !editingWish);
    cancelWish.hidden = !ownWish;
    wishSubmit.textContent = t(ownWish ? 'wishes.update' : 'wishes.submit');
    wishSubmit.disabled = Boolean(backendEndpoint() && (!verifiedGuest || !invitationDetailsReady));
    if (ownWish) document.getElementById('savedWishMessage').textContent = `“${ownWish.message}”`;
  }

  document.getElementById('editWish').addEventListener('click', () => {
    editingWish = true;
    wishMessageInput.value = ownWish.message;
    renderOwnWish();
    setStatus(wishStatus, '', '');
    wishMessageInput.focus();
  });
  cancelWish.addEventListener('click', () => {
    editingWish = false;
    wishMessageInput.value = ownWish.message;
    renderOwnWish();
    setStatus(wishStatus, '', '');
    document.getElementById('editWish').focus();
  });

  wishForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!wishForm.reportValidity()) return;
    if (backendEndpoint() && (!verifiedGuest || !invitationDetailsReady)) {
      setStatus(wishStatus, t('dynamic.inviteInvalid'), 'error'); return;
    }
    const wish = {
      type: 'wish', code: inviteCode, requestId: crypto.randomUUID(),
      name: verifiedGuest ? verifiedGuest.name : wishNameInput.value.trim(),
      message: wishMessageInput.value.trim().slice(0, 300)
    };
    if (!wish.name || !wish.message) return;
    wishFields.inert = true;
    wishSubmit.disabled = true;
    setStatus(wishStatus, t('dynamic.sendingWish'), 'pending');
    const result = await postToBackend(wish);
    wishFields.inert = false;
    if (result.ok) {
      ownWish = result.wish || {...wish, submittedAt: new Date().toISOString()};
      editingWish = false;
      renderOwnWish();
      // A successful response includes the moderated feed; no second request.
      if (Array.isArray(result.wishes)) renderWishes(result.wishes);
      setStatus(wishStatus, t('dynamic.wishSuccess'), 'success');
      return;
    }
    renderOwnWish();
    setStatus(wishStatus, t(result.reason === 'unconfigured' ? 'dynamic.rsvpPreview' : 'dynamic.wishError'), 'error');
  });

  // Calendar files contain event information only, never invitation credentials.
  function calendarTimestamp(value) {
    return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  function calendarEscape(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n')
      .replace(/;/g, '\\;').replace(/,/g, '\\,');
  }

  function calendarFold(line) {
    // RFC 5545 folds at 75 octets, without splitting a UTF-8 character.
    let result = '', chunk = '', bytes = 0;
    for (const character of line) {
      const length = new TextEncoder().encode(character).length;
      if (bytes + length > 75) { result += chunk + '\r\n'; chunk = ' '; bytes = 1; }
      chunk += character; bytes += length;
    }
    return result + chunk;
  }

  // Calendar exports end at `event.end` when set, otherwise after a short
  // default duration. An empty range is rejected by most calendar clients.
  function calendarEnd(event) {
    if (event.end) return new Date(event.end);
    const minutes = Number(config.calendarDefaultMinutes) || 120;
    return new Date(new Date(event.start).getTime() + minutes * 60000);
  }

  function buildCalendar(events) {
    const stamp = calendarTimestamp(Date.now());
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Richard and Natasha//Wedding Invitation//EN', 'CALSCALE:GREGORIAN'];
    for (const event of events) {
      lines.push('BEGIN:VEVENT', `UID:richard-natasha-20270117-${event.id}@wedding-invitation`,
        `DTSTAMP:${stamp}`, `DTSTART:${calendarTimestamp(event.start)}`,
        `DTEND:${calendarTimestamp(calendarEnd(event))}`,
        `SUMMARY:${calendarEscape(format(t('details.calendarTitle'), {event: t(event.label)}))}`,
        `LOCATION:${calendarEscape(config.calendarLocation)}`,
        ...(config.calendarDetails ? [`DESCRIPTION:${calendarEscape(config.calendarDetails)}`] : []),
        'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(calendarFold).join('\r\n') + '\r\n';
  }

  function googleCalendarLink(event) {
    // Enter through `www.google.com/calendar/render`. Unlike
    // `calendar.google.com/calendar/r/eventedit`, this host answers a plain
    // request with a 302 that keeps the query string on the calendar host, and
    // that redirect is what the Android Calendar app follows when it takes over
    // the link. The `/r/eventedit` path redirects to accounts.google.com
    // instead, so the app has nothing to open and no new event appears.
    const url = new URL('https://www.google.com/calendar/render');
    const params = {
      action: 'TEMPLATE',
      dates: `${calendarTimestamp(event.start)}/${calendarTimestamp(calendarEnd(event))}`,
      stz: config.calendarTimeZone,
      etz: config.calendarTimeZone,
      text: format(t('details.calendarTitle'), {event: t(event.label)}),
      location: config.calendarLocation
    };
    if (config.calendarDetails) params.details = config.calendarDetails;
    url.search = new URLSearchParams(params).toString();
    return url.toString();
  }

  function renderCalendarTimes() {
    for (const event of config.calendarEvents || []) {
      const googleLink = document.querySelector(`[data-google-calendar="${event.id}"]`);
      if (googleLink) googleLink.href = googleCalendarLink(event);
    }
  }

  const calendarDialog = document.getElementById('calendarDialog');
  calendarDialog.addEventListener('close', () => document.getElementById('openCalendar').focus());
  document.getElementById('openCalendar').addEventListener('click', () => calendarDialog.showModal());
  document.getElementById('closeCalendar').addEventListener('click', () => calendarDialog.close());
  calendarDialog.addEventListener('click', event => {
    if (event.target !== calendarDialog) return;
    const bounds = calendarDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) calendarDialog.close();
  });
  for (const button of calendarDialog.querySelectorAll('[data-calendar]')) {
    button.addEventListener('click', () => {
      const choice = button.dataset.calendar;
      const events = (config.calendarEvents || []).filter(event => choice === 'both' || event.id === choice);
      if (!events.length) return;
      const url = URL.createObjectURL(new Blob([buildCalendar(events)], {type: 'text/calendar;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url; link.download = `richard-natasha-${choice}.ics`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      calendarDialog.close();
    });
  }

  applyLanguage(currentLang);
  loadInvitation();
  openingAssetsReady.then(() => {
    clearTimeout(window.assetLoadTimeout);
    document.documentElement.classList.remove('assets-loading');
  });
  loadWishes();
})();
