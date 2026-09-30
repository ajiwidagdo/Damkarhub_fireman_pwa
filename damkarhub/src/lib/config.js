/* ===================== CONFIG (data global aplikasi) =====================
   Di-extract dari index.html (const Config). Logic 100% identik.
   CATATAN: file ini sengaja classic script (BUKAN ES module) —
   App.settings di index.html butuh Config saat inline script di-parse,
   sedangkan module scripts bersifat deferred (dievaluasi SETELAH parse).
   ========================================================================= */

const Config = {
  DB_NAME: 'DamkarHubDB',
  PROVINSI: [
    'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Jambi', 'Sumatera Selatan',
    'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung', 'Kepulauan Riau',
    'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Banten',
    'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
    'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara',
    'Sulawesi Utara', 'Sulawesi Tengah', 'Sulawesi Selatan', 'Sulawesi Tenggara',
    'Gorontalo', 'Sulawesi Barat',
    'Maluku', 'Maluku Utara',
    'Papua', 'Papua Barat', 'Papua Selatan', 'Papua Tengah', 'Papua Pegunungan', 'Papua Barat Daya'
  ],
  DEFAULT_EXPORT_COLS: {
    k:   ['Tanggal','Jenis Kejadian','Penyebab','Objek','Kerugian','Alamat Korban','Data Korban','Respon Time','Jarak Tempuh','Kendala','Keterangan'],
    nk:  ['Tanggal','Jenis Giat','Data Pelapor','Alamat Pelapor','Objek','Durasi & Jarak','Kendala','Keterangan'],
    sos: ['Tanggal','Sasaran Edukasi','Nama Instansi','Alamat Instansi','Jumlah Peserta','Keterangan']
  },
  DB_VERSION: 3,
  STORES: { k:'kebakaran', nk:'non_kebakaran', sos:'sosialisasi', settings:'settings', personil:'personil', regu:'regu', sync:'sync_queue' },
  MONTHS: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
  MONTHS_SHORT: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'],
  DAYS: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  THEME_COLORS: { k:'#dc2626', nk:'#f59e0b', sos:'#10b981', beranda:'#dc2626', dashboard:'#dc2626', riwayat:'#111827', sistem:'#3b82f6' },
  TIME_SLOTS: [
    { key: 'Dini Hari', range: '00:00 - 05:59', icon: 'fa-moon', color: 'bg-purple-500' },
    { key: 'Pagi',      range: '06:00 - 10:59', icon: 'fa-sun', color: 'bg-amber-500' },
    { key: 'Siang',     range: '11:00 - 14:59', icon: 'fa-cloud-sun', color: 'bg-orange-500' },
    { key: 'Sore',      range: '15:00 - 17:59', icon: 'fa-cloud-sun', color: 'bg-rose-500' },
    { key: 'Malam',     range: '18:00 - 23:59', icon: 'fa-star', color: 'bg-indigo-500' }
  ],
  KATEGORI_OPTIONS: [
    'MAS - Masyarakat (Pemukiman / Warga)',
    'EDU - Sektor Pendidikan (Sekolah / Kampus)',
    'KTOR - Perkantoran (Swasta / Pemerintahan)',
    'IND - Industri (Pabrik / Gudang)',
    'RS - Rumah Sakit / Faskes',
    'FASUM - Fasilitas Umum (Mal, Pasar, Transportasi)',
    'REL - Relawan (Organisasi / Komunitas Tanggap Bencana)',
    'LLN - Lainnya'
  ],
  KENDALA_OPTIONS: [
    'Akses Jalan Sempit',
    'Sumber Air Terbatas',
    'Keterlambatan Informasi',
    'Cuaca / Angin Kencang',
    'Peralatan Terbatas',
    'Lainnya'
  ],
  DEFAULT_SETTINGS: {
    id: 'global',
    instansi: 'UPTD PENANGGULANGAN KEBAKARAN',
    daerah: 'KOTA BANJAR',
    kantor: '',
    pimpinan: '1. Wali Kota Banjar\n2. Wakil Wali Kota Banjar\n3. Sekretaris Daerah Kota Banjar\n4. Kepala Pelaksana BPBD Kota Banjar c/q Kepala UPTD Penanggulangan Kebakaran Kota Banjar'
  }
};

globalThis.Config = Config;
