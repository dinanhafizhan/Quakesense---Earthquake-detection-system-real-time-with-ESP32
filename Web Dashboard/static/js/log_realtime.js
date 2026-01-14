// Render satu item log sesuai level (info/warning/danger)
function renderLogItem(item) {
  const palettes = {
    info:   { border:'#27b33c', badge:'#27b33c', text:'#27b33c' },
    warning:{ border:'#f59e0b', badge:'#f59e0b', text:'#b45309' },
    danger: { border:'#ff7b6a', badge:'#ff7b6a', text:'#b91c1c' }
  };
  const p = palettes[item.level] || palettes.info;

  return `
    <div class="relative border-2 rounded-2xl p-4 pl-6 flex items-center gap-5"
         style="border-color:${p.border}; border-left-width:12px;">

      <div class="px-4 py-1 rounded-full text-white text-sm" style="background:${p.badge}">
        ${item.time}
      </div>

      <div>
        <p class="font-semibold" style="color:${p.text}">Wilayah ${item.wilayah}:</p>
        <p class="" style="color:${p.text}">${item.message}</p>
      </div>
    </div>
  `;
}

async function loadLogs() {
  try {
    const res = await fetch('/api/logs');
    const logs = await res.json();
    const list = document.getElementById('logList');
    const empty = document.getElementById('emptyLogs');

    if (!Array.isArray(logs) || logs.length === 0) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    list.innerHTML = logs.map(renderLogItem).join('');
  } catch (e) {
    console.error('Gagal memuat log:', e);
  }
}

function initLogPage() {
  const btnClear = document.getElementById('btnClearLogs');
  if (btnClear) {
    btnClear.addEventListener('click', async () => {
      if (!confirm('Hapus semua log?')) return;
      await fetch('/api/logs/clear', { method: 'POST' });
      loadLogs();
    });
  }

  // initial + interval
  loadLogs();
  setInterval(loadLogs, 3000);
}

// Auto-init saat DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogPage);
} else {
  initLogPage();
}
