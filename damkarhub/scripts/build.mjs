// Build DAMKARHUB Fireman → folder dist/ (siap Vercel / Cloudflare Pages / Capacitor `webDir`)
// - Tailwind dikompilasi jadi CSS statis (tanpa CDN, tanpa JIT di HP)
// - FontAwesome, jsPDF, jsPDF-AutoTable disalin dari node_modules ke dist/vendor
// - index.html: blok <!-- CDN:START --> … <!-- CDN:END --> diganti aset lokal
// - service-worker.js: nama cache diberi hash otomatis, jadi tiap deploy baru ter-update sendiri
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const nm = (...p) => path.join(root, 'node_modules', ...p);
const out = (...p) => path.join(dist, ...p);
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

function need(file, hint) {
  if (!existsSync(file)) {
    console.error(`\n✗ File tidak ditemukan: ${path.relative(root, file)}\n  ${hint}\n`);
    process.exit(1);
  }
  return file;
}

console.log('→ Membersihkan dist/');
rmSync(dist, { recursive: true, force: true });
mkdirSync(out('vendor', 'fontawesome', 'css'), { recursive: true });
mkdirSync(out('vendor', 'fontawesome', 'webfonts'), { recursive: true });

console.log('→ Menyalin manifest, ikon & aset gambar');
cpSync(path.join(root, 'manifest.json'), out('manifest.json'));
cpSync(path.join(root, 'icons'), out('icons'), { recursive: true });
if (existsSync(path.join(root, 'assets'))) cpSync(path.join(root, 'assets'), out('assets'), { recursive: true });

console.log('→ Kompilasi Tailwind');
const tw = need(nm('tailwindcss', 'lib', 'cli.js'), 'Jalankan `npm install` dulu.');
execFileSync(process.execPath, [tw, '-c', 'tailwind.config.js', '-i', 'scripts/tailwind-input.css', '-o', 'dist/tailwind.css', '--minify'], { cwd: root, stdio: 'inherit' });

console.log('→ FontAwesome');
const fa = nm('@fortawesome', 'fontawesome-free');
cpSync(need(path.join(fa, 'css', 'all.min.css'), 'Paket @fortawesome/fontawesome-free belum terpasang.'), out('vendor', 'fontawesome', 'css', 'all.min.css'));
for (const f of ['fa-solid-900.woff2', 'fa-brands-400.woff2', 'fa-regular-400.woff2']) {
  cpSync(need(path.join(fa, 'webfonts', f), 'Berkas font FontAwesome tidak ada.'), out('vendor', 'fontawesome', 'webfonts', f));
}

console.log('→ jsPDF & AutoTable');
cpSync(need(nm('jspdf', 'dist', 'jspdf.umd.min.js'), 'Paket jspdf belum terpasang.'), out('vendor', 'jspdf.umd.min.js'));
cpSync(need(nm('jspdf-autotable', 'dist', 'jspdf.plugin.autotable.min.js'), 'Paket jspdf-autotable belum terpasang.'), out('vendor', 'jspdf.plugin.autotable.min.js'));

console.log('→ Menulis index.html (CDN → lokal)');
let html = readFileSync(path.join(root, 'index.html'), 'utf8');
const re = /<!-- CDN:START[\s\S]*?<!-- CDN:END -->\n?/;
if (!re.test(html)) { console.error('✗ Penanda <!-- CDN:START --> / <!-- CDN:END --> tidak ada di index.html'); process.exit(1); }
html = html.replace(re, [
  '<link rel="stylesheet" href="vendor/fontawesome/css/all.min.css">',
  '<script src="vendor/jspdf.umd.min.js"></script>',
  '<script src="vendor/jspdf.plugin.autotable.min.js"></script>',
  ''
].join('\n'));
// Tailwind di paling akhir <head> agar urutannya sama dengan perilaku CDN sebelumnya (utilitas menimpa CSS kustom)
if (!html.includes('</head>')) { console.error('✗ </head> tidak ditemukan'); process.exit(1); }
html = html.replace('</head>', '<link rel="stylesheet" href="tailwind.css">\n</head>');
writeFileSync(out('index.html'), html);

console.log('→ Service worker');
let sw = readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const hash = createHash('sha256')
  .update(html).update(readFileSync(out('tailwind.css'))).update(sw)
  .digest('hex').slice(0, 8);
const cacheName = `damkarhub-v${pkg.version}-${hash}`;
if (!/const CACHE_NAME = '[^']*';/.test(sw)) { console.error('✗ CACHE_NAME tidak ditemukan di service-worker.js'); process.exit(1); }
sw = sw.replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = '${cacheName}';`);
writeFileSync(out('service-worker.js'), sw);

console.log(`\n✓ Selesai — dist/ siap deploy (cache: ${cacheName})`);
