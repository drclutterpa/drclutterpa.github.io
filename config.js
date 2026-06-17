// ══════════════════════════════════════════════════════════
// BOOKING APP — CLIENT CONFIG
// Change these values per client. All pages read from here.
// ══════════════════════════════════════════════════════════

const APP_CONFIG = {

  // ── Business Info ──
  businessName: 'Dr Clutter',
  tagline: 'Lehigh Valley Junk Removal',
  phone: '+16103930024',
  phoneDisplay: '(610) 393-0024',
  website: 'https://drclutterpa.github.io',
  yearFounded: 2011,

  // ── Branding ──
  colors: {
    primary: '#16a34a',       // Main brand color (buttons, links, accents)
    primaryDark: '#15803d',   // Hover state
    primaryLight: '#dcfce7',  // Light tint (backgrounds, badges)
    adminHeader: '#1a1a2e',   // Admin dashboard header
  },
  logo: 'assets/mascot-icon.png',        // 192x192 icon
  logoLarge: 'assets/mascot.png',        // 512x512 for PWA splash
  logoTransparent: 'assets/mascot-t.png', // Transparent background version

  // ── Pricing Tiers ──
  pricing: [
    { id: '1/10', label: '1/10 Truck', sublabel: 'A few items', price: 150, icon: '📦' },
    { id: '2/10', label: '2/10 Truck', sublabel: 'Small room cleanout', price: 250, icon: '📦📦' },
    { id: '1/2',  label: '1/2 Truck',  sublabel: 'Garage or basement', price: 550, icon: '🚛' },
    { id: 'full', label: 'Full Truck',  sublabel: 'Whole house cleanout', price: 1050, icon: '🚛🚛' },
  ],

  // ── Scheduling ──
  schedule: {
    daysOut: 14,              // How many days ahead customers can book
    sameDayCutoffHour: 12,    // No same-day bookings after noon
    timeSlots: [
      '8:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '12:00 PM - 2:00 PM',
      '2:00 PM - 4:00 PM',
      '4:00 PM - 6:00 PM',
    ],
    maxPerSlot: 3,
    blockedDays: [0],         // 0 = Sunday. Add 6 for Saturday.
  },

  // ── Photos ──
  photos: {
    maxCount: 5,
    maxSizeMB: 10,
  },

  // ── Admin ──
  admin: {
    pin: '2011',
    dashboardTitle: 'Crew Dashboard',
  },

  // ── Copy / Messaging ──
  copy: {
    bookingHeader: 'Book a Pickup',
    walkAwayGuarantee: true,
    walkAwayText: "Look at the price, and if it's not what you expected — walk away. No fee, no guilt.",
    confirmationMessage: "We'll text you a confirmation within the hour.",
    footerText: 'Family-run since 2011',
  },

  // ── Backend (leave as-is for demo mode) ──
  supabase: {
    url: 'https://pyyjjhllfmfdkddcldsl.supabase.co',
    anonKey: 'sb_publishable_A6SYDtrtK1puXTO-p-lUSg_4kWR8Ila',
  },

  // ── Storage keys (namespace per client to avoid collisions) ──
  storagePrefix: 'drclutter',
};

// ── Helper: check if we're in demo mode ──
APP_CONFIG.isDemoMode = APP_CONFIG.supabase.url === 'YOUR_SUPABASE_URL';

// ── Helper: get localStorage key with prefix ──
APP_CONFIG.storageKey = function(key) {
  return this.storagePrefix + '_' + key;
};
