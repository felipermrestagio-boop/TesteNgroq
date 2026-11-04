// Failover entre várias URLs de API (ex.: dois domínios ngrok apontando para o mesmo backend).
// A URL ativa só muda quando ela falha: principal -> reserva -> principal -> ...
// Uso: const { r, base, tentativas, ms } = await API.apiFetch("/api/health");
(function () {
  // Troque pelos seus domínios. Também dá para editar pela tela (fica salvo no navegador).
  const PADRAO = [
    "https://SEU-DOMINIO-PRINCIPAL.ngrok-free.app",
    "https://SEU-DOMINIO-RESERVA.ngrok-free.app"
  ];
  const NGROK = { "ngrok-skip-browser-warning": "1" }; // evita a página de aviso do ngrok
  const TIMEOUT_MS = 8000; // tempo máximo por tentativa

  let ativa = 0;               // índice da URL em uso
  const simuladas = new Set(); // bases "derrubadas" de propósito, para testar

  const limpar = (u) => u.trim().replace(/\/+$/, "");

  function getBases() {
    try {
      const salvo = JSON.parse(localStorage.getItem("apiBases"));
      if (Array.isArray(salvo) && salvo.length) return salvo.map(limpar);
    } catch (e) { /* usa o padrão */ }
    return PADRAO.map(limpar);
  }

  function setBases(lista) {
    const bases = lista.map(limpar).filter(Boolean);
    localStorage.setItem("apiBases", JSON.stringify(bases));
    ativa = 0;
  }

  // Começa pela URL ativa e, se ela falhar, segue a lista em círculo
  function ordem() {
    const bases = getBases();
    const i = ativa % bases.length;
    return [...bases.slice(i), ...bases.slice(0, i)];
  }

  async function tentar(base, path, options) {
    if (simuladas.has(base)) throw new Error("falha simulada");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(base + path, {
        ...options,
        headers: { ...NGROK, ...(options.headers || {}) },
        signal: ctrl.signal
      });
      // 429 = limite estourado; 502+ = túnel/API fora do ar. Isso aciona o failover.
      if (r.status === 429 || r.status >= 502) throw new Error("HTTP " + r.status);
      return r;
    } finally {
      clearTimeout(timer);
    }
  }

  async function apiFetch(path, options = {}) {
    const t0 = performance.now();
    const tentativas = [];
    for (const base of ordem()) {
      try {
        const r = await tentar(base, path, options);
        ativa = Math.max(0, getBases().indexOf(base)); // fica nesta URL até ela falhar
        tentativas.push({ base, ok: true });
        return { r, base, tentativas, ms: performance.now() - t0 };
      } catch (e) {
        tentativas.push({ base, ok: false, erro: e.name === "AbortError" ? "timeout" : e.message });
      }
    }
    const erro = new Error("Todas as APIs falharam");
    erro.tentativas = tentativas;
    erro.ms = performance.now() - t0;
    throw erro;
  }

  window.API = {
    apiFetch,
    getBases,
    setBases,
    ativa: () => getBases()[ativa % getBases().length],
    simular: (base, ligado) => (ligado ? simuladas.add(base) : simuladas.delete(base)),
    resetar: () => { ativa = 0; } // volta a começar pela principal
  };
})();
