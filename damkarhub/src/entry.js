/* Entry point untuk bundling esbuild — urutan SAMA dengan script tags di index.html.
   Semua modul komunikasi via globalThis, jadi bundle preserves behavior. */
import './ui/builders.js';
import './ui/preview-builder.js';
import './ui/ui.js';
import './lib/cloudinary.js';
import './lib/helpers.js';
import './lib/db.js';
import './lib/auth.js';
import './services/sync-config.js';
import './services/sync.js';
import './services/export.js';
import './modules/report-module.js';
import './modules/mod-k.js';
import './modules/mod-nk.js';
import './modules/mod-sos.js';
import './app/render-layouts.js';
import './app/app.js';
