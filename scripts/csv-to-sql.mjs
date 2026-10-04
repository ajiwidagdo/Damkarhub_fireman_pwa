#!/usr/bin/env node
/* ============================================================
   csv-to-sql.mjs — Convert CSV dummy data → SQL seed Supabase
   Cara pakai: node scripts/csv-to-sql.mjs
   Input : docs/template-dummy-{K,NK,SOS}.csv
   Output: docs/seed-dummy-YYYY-MM-DD.sql
   - Parser RFC-4180 inline (tanpa dependensi)
   - UUID v4 via crypto.randomUUID()
   - Format INSERT 9 kolom (tanpa owner_email, sesuai live DB)
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const OWNER_EMAIL = 'petugas@damkarhub.id';
const TENANT_ID = '06622c4b-2610-427e-9ee4-cce5a80ad1f1';

/* ---------- kolom CSV per modul (urutan = urutan header) ---------- */
const COLS = {
  k: 'tanggal,pukul,tglTerima,jamTerima,jamTiba,jamMulai,tglSelesai,jamSelesai,jenis,lokasiDetail,dusun,rtrw,kel,kec,kabkota,koordinat,pNama,pHP,penyebab,objekTerbakar,luasArea,nilaiAset,kerugian,asetSelamat,lRingan,lBerat,mnggal,armada,durasi,jarak,air,kronologi,tindakan,kendala,unsur,regu,personil,keterangan'.split(','),
  nk: 'tanggal,pukul,tglTerima,jamTerima,tglMulai,jamMulai,tglSelesai,jamSelesai,jenis,lokasiDetail,dusun,rtrw,kel,kec,kabkota,koordinat,idNama,idUsia,idJK,pHP,objek,lokasiOp,ukuran,armada,durasi,jarak,air,kronologi,tindakan,kendala,unsur,regu,personil,keterangan'.split(','),
  sos: 'tanggal,pukul,tglSelesai,jamSelesai,tempat,rangkaian,kategori,peserta_nama,peserta_jumlah,armada,air,durasi,catatanEvaluasi,regu,personil'.split(',')
};
const REQUIRED = { k: ['tanggal', 'jenis'], nk: ['tanggal', 'jenis'], sos: ['tanggal', 'tempat'] };

/* ---------- parser CSV RFC-4180 minimal ---------- */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v.trim() !== ''));
}

/* ---------- helper ---------- */
const splitPipe = (v) => String(v || '').split('|').map(s => s.trim()).filter(Boolean);
const ts = (tgl, jam) => {
  if (!tgl) return null;
  const t = String(tgl).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  let j = String(jam || '00:00').slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(j)) j = '00:00';
  return `${t} ${j}:00+07`;
};
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

/* ---------- bangun payload data per modul (format collectForm) ---------- */
function buildData(module, r) {
  const id = randomUUID();
  const base = { id, data_schema_version: '1.0' };
  const g = (k) => r[k] ?? '';
  if (module === 'k') {
    return {
      ...base,
      tanggal: g('tanggal'), pukul: g('pukul'), tglTerima: g('tglTerima'), jamTerima: g('jamTerima'),
      jamTiba: g('jamTiba'), jamMulai: g('jamMulai'), tglSelesai: g('tglSelesai'), jamSelesai: g('jamSelesai'),
      jenis: g('jenis'), lokasiDetail: g('lokasiDetail'), dusun: g('dusun'), rtrw: g('rtrw'),
      kel: g('kel'), kec: g('kec'), kabkota: g('kabkota'), koordinat: g('koordinat'),
      korbanList: [],
      pNama: g('pNama'), pHP: g('pHP'), penyebab: g('penyebab'), objekTerbakar: g('objekTerbakar'),
      luasArea: g('luasArea'),
      nilaiAset: g('nilaiAset') || '0', kerugian: g('kerugian') || '0', asetSelamat: g('asetSelamat') || '0',
      lRingan: g('lRingan') || '0', lBerat: g('lBerat') || '0', mnggal: g('mnggal') || '0',
      armada: g('armada'), durasi: g('durasi'), jarak: g('jarak'), air: g('air'),
      kronologi: g('kronologi'), tindakan: g('tindakan'),
      kendala: splitPipe(r.kendala), unsur: g('unsur'),
      regu: g('regu'), personil: splitPipe(r.personil).join('\n'),
      foto1: '', foto2: '', keterangan: g('keterangan')
    };
  }
  if (module === 'nk') {
    return {
      ...base,
      tanggal: g('tanggal'), pukul: g('pukul'), tglTerima: g('tglTerima'), jamTerima: g('jamTerima'),
      tglMulai: g('tglMulai'), jamMulai: g('jamMulai'), tglSelesai: g('tglSelesai'), jamSelesai: g('jamSelesai'),
      jenis: g('jenis'), lokasiDetail: g('lokasiDetail'), dusun: g('dusun'), rtrw: g('rtrw'),
      kel: g('kel'), kec: g('kec'), kabkota: g('kabkota'), koordinat: g('koordinat'),
      idNama: g('idNama'), idUsia: g('idUsia'), idJK: g('idJK'), pHP: g('pHP'),
      idDusun: '', idRtrw: '', idKel: '', idKec: '', idKabkota: '',
      objek: g('objek'), lokasiOp: g('lokasiOp'), ukuran: g('ukuran'),
      durasi: g('durasi'), armada: g('armada'), jarak: g('jarak'), air: g('air'),
      kronologi: g('kronologi'), tindakan: g('tindakan'),
      kendala: splitPipe(r.kendala),
      lRingan: g('lRingan') || '0', lBerat: g('lBerat') || '0', mnggal: g('mnggal') || '0',
      unsur: g('unsur'), regu: g('regu'), personil: splitPipe(r.personil).join('\n'),
      foto1: '', foto2: '', keterangan: g('keterangan')
    };
  }
  // sos
  return {
    ...base,
    tanggal: g('tanggal'), pukul: g('pukul'), tglSelesai: g('tglSelesai'), jamSelesai: g('jamSelesai'),
    tempat: g('tempat'), rangkaian: splitPipe(r.rangkaian).join('\n'), kategori: g('kategori'),
    pesertaList: [{ nama: g('peserta_nama'), jumlah: g('peserta_jumlah') || '0', dusun: '', rtrw: '', kel: '', kec: '', kabkota: '' }],
    armada: g('armada'), air: g('air'), durasi: g('durasi'), catatanEvaluasi: g('catatanEvaluasi'),
    regu: g('regu'), personil: splitPipe(r.personil).join('\n'),
    foto1: '', foto2: ''
  };
}

function receivedTs(module, d) {
  if (module === 'sos') return ts(d.tanggal, d.pukul);
  return ts(d.tglTerima, d.jamTerima) || ts(d.tglMulai, d.jamMulai) || ts(d.tanggal, d.pukul);
}

/* ---------- main ---------- */
const today = new Date().toISOString().slice(0, 10);
const values = [];
const counts = { k: 0, nk: 0, sos: 0 };

for (const module of ['k', 'nk', 'sos']) {
  const file = path.join(ROOT, 'docs', `template-dummy-${module.toUpperCase()}.csv`);
  let text;
  try { text = readFileSync(file, 'utf8'); }
  catch { console.error(`SKIP: ${file} tidak ditemukan`); continue; }
  const rows = parseCSV(text);
  if (!rows.length) continue;
  const header = rows[0].map(h => h.trim());
  const expected = COLS[module];
  if (header.join(',') !== expected.join(',')) {
    console.error(`WARNING ${file}: header tidak sesuai ekspektasi, kolom dipetakan by name`);
  }
  for (let i = 1; i < rows.length; i++) {
    const r = {};
    header.forEach((h, idx) => { r[h] = (rows[i][idx] ?? '').trim(); });
    const missing = REQUIRED[module].filter(k => !r[k]);
    if (missing.length) {
      console.error(`SKIP baris ${i + 1} (${module.toUpperCase()}): field wajib kosong: ${missing.join(', ')}`);
      continue;
    }
    const data = buildData(module, r);
    const iat = ts(data.tanggal, data.pukul);
    const rat = receivedTs(module, data);
    const json = JSON.stringify(data);
    values.push(
      `  (${sqlStr(data.id)}, '${module}', ${sqlStr(json)}::jsonb, false,\n` +
      `   (SELECT oid FROM owner), '${TENANT_ID}', 'DONE',\n` +
      `   ${iat ? sqlStr(iat) : 'NULL'}, ${rat ? sqlStr(rat) : 'NULL'})`
    );
    counts[module]++;
  }
}

if (!values.length) {
  console.error('Tidak ada row valid. SQL tidak dibuat.');
  process.exit(1);
}

const sql = `-- =====================================================
-- DAMKARHUB SATRIA — SEED DUMMY DATA (dari CSV)
-- Dibuat: ${today} via scripts/csv-to-sql.mjs
-- ${counts.k} Kebakaran, ${counts.nk} Penyelamatan, ${counts.sos} Sosialisasi
-- Tenant: ${TENANT_ID}
-- Owner : ${OWNER_EMAIL}
--
-- CARA PAKAI: Supabase Dashboard → SQL Editor → Paste → Run
-- CATATAN : idempoten (ON CONFLICT DO UPDATE) — aman dijalankan ulang
-- =====================================================

BEGIN;

-- Guard: pastikan akun petugas sudah ada di Authentication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '${OWNER_EMAIL}') THEN
    RAISE EXCEPTION 'User ${OWNER_EMAIL} tidak ditemukan di auth.users. Buat akun dulu di Authentication → Users.';
  END IF;
END $$;

WITH owner AS (
  SELECT id AS oid FROM auth.users WHERE email = '${OWNER_EMAIL}' LIMIT 1
)
INSERT INTO reports (id, module, data, deleted, owner, tenant_id, status, incident_at, report_received_at)
VALUES
${values.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  data = EXCLUDED.data,
  deleted = EXCLUDED.deleted,
  owner = EXCLUDED.owner,
  tenant_id = EXCLUDED.tenant_id,
  status = EXCLUDED.status,
  incident_at = EXCLUDED.incident_at,
  report_received_at = EXCLUDED.report_received_at;

COMMIT;

-- Verify (expected: k=${counts.k} / nk=${counts.nk} / sos=${counts.sos})
-- SELECT module, COUNT(*) FROM reports
-- WHERE tenant_id = '${TENANT_ID}' AND deleted = false
-- GROUP BY module ORDER BY module;
`;

const outFile = path.join(ROOT, 'docs', `seed-dummy-${today}.sql`);
writeFileSync(outFile, sql);
console.log(`OK: ${values.length} row (${counts.k} k / ${counts.nk} nk / ${counts.sos} sos) → ${outFile}`);
