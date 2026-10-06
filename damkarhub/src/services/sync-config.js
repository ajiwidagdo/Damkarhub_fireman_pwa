/* ===================== SINKRONISASI PUSAT (SUPABASE) ===================== */
/* Offline-first: laporan selalu disimpan lokal dulu, lalu dikirim ke server saat ada sinyal.
   Isi URL & ANON_KEY dari Supabase (Project Settings → API). Kosong = fitur nonaktif, aplikasi tetap lokal. */
export const SyncConfig = {
  URL: 'https://wanrxqxobsgbaflfmrhe.supabase.co',
  ANON_KEY: 'sb_publishable_4EDl3A9Kuv3Q9aOzKCQHoQ_aeUAPD-Q',
  DEFAULT_TENANT_CODE: 'DAMKARHUB.BANJAR113',
  CLOUDINARY: {
    CLOUD_NAME: 'cyokyuio',
    PRESET: 'satria_unsigned'
  },
  PAGE: 100,
  CHUNK: 10,
  INTERVAL_MS: 120000
};
globalThis.SyncConfig = SyncConfig;
