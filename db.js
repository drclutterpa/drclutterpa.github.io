// ══════════════════════════════════════════════════════════
// BookKit — Shared Data Layer
// One API for all pages. Demo mode => localStorage.
// Live mode (Supabase keys set in config.js) => Supabase.
//
// Live security model:
//   • Customers (anon key) can INSERT a booking and look up ONE
//     booking by its code (via the get_booking_by_code RPC).
//   • The public key CANNOT list/read every customer's record.
//   • Admin actions (list all, approve, deny, status, delete)
//     require a signed-in admin (Supabase Auth).
//
// Requires (live mode only): the supabase-js library loaded before
// this file, i.e. <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// ══════════════════════════════════════════════════════════
(function () {
  const cfg = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG : {};
  const PREFIX = cfg.storagePrefix || 'drclutter';
  const BKEY = PREFIX + '_bookings';
  const photoKey = (code) => PREFIX + '_photos_' + code;

  function isDemo() {
    return !cfg.supabase || !cfg.supabase.url ||
           cfg.supabase.url === 'YOUR_SUPABASE_URL' || !cfg.supabase.anonKey ||
           cfg.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY';
  }

  // Lazy Supabase client (only created in live mode, on first use)
  let _client = null;
  function sb() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase library not loaded. Add the supabase-js <script> tag to <head>.');
    }
    _client = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
    return _client;
  }

  // ── Format a YYYY-MM-DD date as "Thu, Jun 18" (local, no off-by-one) ──
  function formatDate(d) {
    if (!d) return '';
    const p = String(d).split('-');
    if (p.length === 3) {
      const dt = new Date(+p[0], +p[1] - 1, +p[2]);
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return d;
  }

  // ── Map a Supabase row to the shape the pages expect ──
  function fromRow(r) {
    return {
      code: r.code,
      name: r.name,
      phone: r.phone,
      address: r.address,
      town: r.town,
      notes: r.notes || '',
      size: r.truck_size,
      price: r.estimated_price,
      date: r.pickup_date,
      dateDisplay: formatDate(r.pickup_date),
      time: r.pickup_time,
      status: r.status,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
      deniedAt: r.denied_at,
      denyReason: r.deny_reason || '',
      photos: Array.isArray(r.photos) ? r.photos : [],
      photoCount: Array.isArray(r.photos) ? r.photos.length : 0
    };
  }

  const DB = {
    isDemo,

    // ── Auth (live admin only) ──
    async signIn(email, password) {
      if (isDemo()) return { ok: true };
      const { error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { ok: true };
    },
    async signOut() {
      if (isDemo()) return;
      try { await sb().auth.signOut(); } catch (e) {}
    },
    async hasSession() {
      if (isDemo()) return false;
      const { data } = await sb().auth.getSession();
      return !!(data && data.session);
    },

    // ── Create a booking (book.html) ──
    // b: app-shape booking. b.photoFiles = File[]; b.photoDataUrls = string[] (demo previews)
    async createBooking(b) {
      if (isDemo()) {
        const list = JSON.parse(localStorage.getItem(BKEY) || '[]');
        list.push({
          code: b.code, name: b.name, phone: b.phone, address: b.address,
          town: b.town, notes: b.notes, photoCount: (b.photoFiles || []).length,
          size: b.size, price: b.price, date: b.date, dateDisplay: b.dateDisplay,
          time: b.time, status: 'pending', createdAt: new Date().toISOString()
        });
        localStorage.setItem(BKEY, JSON.stringify(list));
        if (b.photoDataUrls && b.photoDataUrls.length) {
          localStorage.setItem(photoKey(b.code), JSON.stringify(b.photoDataUrls));
        }
        return { ok: true };
      }
      // Live: upload photos to storage, then insert the row
      const photoUrls = [];
      for (const file of (b.photoFiles || [])) {
        const path = `bookings/${b.code}/${Date.now()}_${file.name}`;
        const { error: upErr } = await sb().storage.from('photos').upload(path, file);
        if (!upErr) {
          const { data: urlData } = sb().storage.from('photos').getPublicUrl(path);
          photoUrls.push(urlData.publicUrl);
        }
      }
      const { error } = await sb().from('bookings').insert({
        code: b.code, name: b.name, phone: b.phone, address: b.address,
        town: b.town, notes: b.notes, photos: photoUrls, truck_size: b.size,
        estimated_price: b.price, pickup_date: b.date, pickup_time: b.time,
        status: 'pending'
      });
      if (error) throw error;
      return { ok: true };
    },

    // ── List all bookings (admin.html) ──
    async getBookings() {
      if (isDemo()) return JSON.parse(localStorage.getItem(BKEY) || '[]');
      const { data, error } = await sb()
        .from('bookings').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(fromRow);
    },

    // ── Look up one booking by code (tracker.html) — safe for anon ──
    async getBookingByCode(code) {
      if (isDemo()) {
        const list = JSON.parse(localStorage.getItem(BKEY) || '[]');
        return list.find(b => b.code === code) || null;
      }
      const { data, error } = await sb().rpc('get_booking_by_code', { p_code: code });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row ? fromRow(row) : null;
    },

    // ── Update a booking (admin.html) ──
    async updateBooking(code, patch) {
      if (isDemo()) {
        const list = JSON.parse(localStorage.getItem(BKEY) || '[]');
        const job = list.find(b => b.code === code);
        if (job) { Object.assign(job, patch); localStorage.setItem(BKEY, JSON.stringify(list)); }
        return { ok: true };
      }
      const dbPatch = {};
      if ('status' in patch) dbPatch.status = patch.status;
      if ('denyReason' in patch) dbPatch.deny_reason = patch.denyReason;
      if ('approvedAt' in patch) dbPatch.approved_at = patch.approvedAt;
      if ('deniedAt' in patch) dbPatch.denied_at = patch.deniedAt;
      if (patch.status === 'complete') dbPatch.completed_at = new Date().toISOString();
      const { error } = await sb().from('bookings').update(dbPatch).eq('code', code);
      if (error) throw error;
      return { ok: true };
    },

    // ── Delete a booking (admin.html) ──
    async deleteBooking(code) {
      if (isDemo()) {
        let list = JSON.parse(localStorage.getItem(BKEY) || '[]');
        list = list.filter(b => b.code !== code);
        localStorage.setItem(BKEY, JSON.stringify(list));
        localStorage.removeItem(photoKey(code));
        return { ok: true };
      }
      const { error } = await sb().from('bookings').delete().eq('code', code);
      if (error) throw error;
      return { ok: true };
    },

    // ── Photos for a job (admin.html) ──
    getPhotos(job) {
      if (!isDemo()) return (job && job.photos) ? job.photos : [];
      return JSON.parse(localStorage.getItem(photoKey(job.code)) || '[]');
    }
  };

  window.DB = DB;
})();
