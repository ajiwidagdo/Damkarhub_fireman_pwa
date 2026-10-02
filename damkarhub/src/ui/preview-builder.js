/* ===================== PREVIEW BUILDER (template preview laporan) =====================
   Di-extract dari index.html (const PreviewBuilder). Logic 100% identik.
   Dipakai oleh: mod-k.js, mod-nk.js, mod-sos.js. Global: App (App.settings).
   ========================================================================= */

export const PreviewBuilder = {
  section(title, icon, content, accentColor = 'text-gray-500') {
    return `<div class="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <h4 class="text-[11px] font-black uppercase tracking-widest ${accentColor} mb-3 flex items-center gap-2">
        <i class="fa-solid ${icon}"></i>${title}
      </h4>
      <div class="space-y-2">${content}</div>
    </div>`;
  },
  row(label, value) {
    return `<div class="flex gap-3 text-sm">
      <span class="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0 w-24 text-[11px] uppercase tracking-wide pt-0.5">${label}</span>
      <span class="text-gray-800 dark:text-gray-100 font-bold flex-1 break-words">${value || '-'}</span>
    </div>`;
  },
  header(title, icon, gradient) {
    return `<div class="bg-gradient-to-br ${gradient} text-white p-5 rounded-2xl mb-4 shadow-lg relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
      <div class="relative z-10 flex items-center gap-3">
        <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl backdrop-blur">${icon}</div>
        <div>
          <h3 class="font-black text-lg tracking-tight">${title}</h3>
          <p class="text-xs opacity-90">${App.settings.instansi || ''}</p>
          <p class="text-[10px] opacity-70">${App.settings.daerah || ''}</p>
        </div>
      </div>
    </div>`;
  }
};

globalThis.PreviewBuilder = PreviewBuilder;
