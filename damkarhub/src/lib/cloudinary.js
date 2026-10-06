/* ===================== CLOUDINARY ===================== */
/* Upload foto laporan ke Cloudinary (unsigned preset).
   URL disimpan di reports.photo_urls; base64 tidak lagi dikirim ke DB. */
export const Cloudinary = {
  get cfg() { try { return SyncConfig.CLOUDINARY || {}; } catch (e) { return {}; } },
  get enabled() { const c = this.cfg; return !!(c.CLOUD_NAME && c.PRESET); },

  isUrl(s) { return typeof s === 'string' && /^https?:\/\//i.test(s); },
  isBase64(s) { return typeof s === 'string' && s.startsWith('data:image'); },

  // base64 dataURL → Blob (untuk upload foto pending)
  b64ToBlob(b64) {
    const [head, data] = b64.split(',');
    const mime = (head.match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const bin = atob(data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },

  // Kompres file gambar → Blob JPEG (maxDim px, quality)
  compressToBlob(file, maxDim = 1280, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error('baca file gagal'));
      r.onload = e => {
        const img = new Image();
        img.onerror = () => reject(new Error('gambar rusak'));
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > h) { if (w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } }
          else { if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; } }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(b => b ? resolve(b) : reject(new Error('kompres gagal')), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      r.readAsDataURL(file);
    });
  },

  // Upload blob → secure_url. Retry 3x dengan backoff.
  async uploadFoto(blob, tenantId) {
    const c = this.cfg;
    if (!this.enabled) throw new Error('Cloudinary belum dikonfigurasi');
    const folder = `damkarhub/satria/${tenantId || 'tanpa-tenant'}`;
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const fd = new FormData();
        fd.append('file', blob, 'foto.jpg');
        fd.append('upload_preset', c.PRESET);
        fd.append('folder', folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${c.CLOUD_NAME}/image/upload`, {
          method: 'POST', body: fd
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error?.message || ('upload gagal (' + res.status + ')'));
        if (!j.secure_url) throw new Error('URL tidak diterima');
        return j.secure_url;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    throw lastErr;
  },

  // URL thumbnail untuk list (transformasi Cloudinary on-the-fly)
  thumb(url, w = 300) {
    if (!this.isUrl(url) || !url.includes('/upload/')) return url;
    return url.replace('/upload/', `/upload/w_${w},c_limit,q_auto/`);
  }
};
globalThis.Cloudinary = Cloudinary;
