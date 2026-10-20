"use strict";
/* ================================================================ utilidades */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
/* a data de hoje muda com o app aberto (virada do dia em 11-main.js) */
let TODAY = iso(new Date());
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const mkey = s => s.slice(0, 7);
const addMonth = (mk, n) => { const d = parse(mk + "-01"); d.setMonth(d.getMonth() + n); return iso(d).slice(0, 7); };
const dim = mk => { const d = parse(mk + "-01"); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const mlabel = mk => `${MESES[+mk.slice(5) - 1]} ${mk.slice(0, 4)}`;
const mabbr = mk => MESES[+mk.slice(5) - 1].slice(0, 3);
const DOWS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DOWL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const fmtD = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "";
const fmtDY = s => s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : "";
const fmtDL = s => { if (!s) return ""; const d = parse(s); return `${DOWS[d.getDay()].toLowerCase()}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`; };
const relDay = s => { if (!s) return ""; const n = diff(s, TODAY); return n === 0 ? "hoje" : n === -1 ? "ontem" : n === 1 ? "amanhã" : n < 0 ? `há ${-n} dias` : `em ${n} dias`; };
const weekStart = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
const cur = () => S?.cfg?.moeda || "€";
const eur = (v, d = 0) => v == null || isNaN(v) ? "–" : (v < 0 ? "−" : "") + cur() + " " + Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const eurK = v => v == null || isNaN(v) ? "–" : Math.abs(v) >= 10000 ? (v < 0 ? "−" : "") + cur() + " " + (Math.abs(v) / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil" : eur(v);
const num = (v, d = 1) => v == null || isNaN(v) ? "–" : (+v).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (v, d = 0) => v == null || isNaN(v) ? "–" : (v * 100).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
const sgn = (v, f = x => num(x)) => v == null || isNaN(v) ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "±") + f(Math.abs(v));
const avg = a => { const b = a.filter(v => v != null && v !== "" && !isNaN(v)); return b.length ? b.reduce((x, y) => x + +y, 0) / b.length : null; };
const sum = a => a.reduce((x, y) => x + (+y || 0), 0);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 10);
const norm = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const words = s => (String(s ?? "").match(/[\p{L}\p{N}]+/gu) || []).length;
const trunc = (s, n) => { s = String(s ?? "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const isNum = v => v != null && v !== "" && !isNaN(v);
function pearson(xs, ys) { const n = xs.length; if (n < 3) return null; const mx = avg(xs), my = avg(ys); let a = 0, b = 0, c = 0; for (let i = 0; i < n; i++) { const dx = xs[i] - mx, dy = ys[i] - my; a += dx * dy; b += dx * dx; c += dy * dy; } return b && c ? a / Math.sqrt(b * c) : null; }
function regress(p) { if (p.length < 6) return null; const mx = avg(p.map(q => q.x)), my = avg(p.map(q => q.y)); let sxy = 0, sxx = 0, syy = 0;
  for (const q of p) { sxy += (q.x - mx) * (q.y - my); sxx += (q.x - mx) ** 2; syy += (q.y - my) ** 2; }
  if (!sxx) return null; const b = sxy / sxx; return { a: my - b * mx, b, r: syy ? sxy / Math.sqrt(sxx * syy) : 0 }; }
const movAvg = (a, k) => a.map((_, i) => avg(a.slice(Math.max(0, i - k + 1), i + 1)));
const pill = (st, txt) => `<span class="pill ${st || "none"}">${esc(txt)}</span>`;

/* números e datas vindos de arquivos (extratos, planilhas) */
function parseNum(s) {
  if (typeof s === "number") return s; s = String(s ?? "").trim(); if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /^[-−–]/.test(s) || /-$/.test(s);
  s = s.replace(/[^\d.,]/g, ""); if (!s) return null;
  const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
  s = lc > ld ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  const v = parseFloat(s); return isNaN(v) ? null : neg ? -v : v;
}
function parseDateAny(s, fmt = "dmy") {
  s = String(s ?? "").trim(); let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/); if (!m) return null;
  let [a, b, y] = [+m[1], +m[2], +m[3]]; if (y < 100) y += 2000;
  const [d, mo] = fmt === "mdy" ? [b, a] : [a, b];
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null; return `${y}-${pad(mo)}-${pad(d)}`;
}
function guessDateFmt(vals) {
  let dmy = 0, mdy = 0; for (const v of vals) { const m = String(v ?? "").trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.]\d{2,4}/); if (!m) continue; if (+m[1] > 12) dmy++; if (+m[2] > 12) mdy++; }
  return mdy > dmy ? "mdy" : "dmy";
}
function csvParse(text) {
  text = String(text).replace(/^﻿/, ""); const first = text.split(/\r?\n/, 1)[0] || "";
  const delim = [";", ",", "\t"].map(c => [c, first.split(c).length - 1]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"' && f === "") q = true;
    else if (c === delim) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += c;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(x => x !== ""));
}
function csvBuild(header, rows, delim = ",") {
  const cell = v => { const s = v == null ? "" : String(v); return /[",;\n\r\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return [header, ...rows].map(r => r.map(cell).join(delim)).join("\r\n");
}
/* ZIP sem compressão (para exportar o diário como cofre de Markdown) */
const ENC = new TextEncoder();
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
/* .ics: linhas com CRLF, dobradas em 75 bytes (RFC 5545; a continuação começa com um espaço), sem partir caracteres */
function icsFold(ln) {
  const enc = new TextEncoder(); if (enc.encode(ln).length <= 75) return ln;
  const parts = []; let cur = "", n = 0, max = 75;
  for (const ch of ln) { const b = enc.encode(ch).length; if (n + b > max) { parts.push(cur); cur = ""; n = 0; max = 74; } cur += ch; n += b; }
  return [...parts, cur].join("\r\n ");
}
const icsJoin = ls => ls.map(icsFold).join("\r\n") + "\r\n";
function zipFiles(files) {
  const parts = [], central = []; let off = 0;
  const now = new Date(), dt = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF, dd = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  for (const f of files) {
    const name = ENC.encode(f.name), data = typeof f.data === "string" ? ENC.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, dt, true); h.setUint16(12, dd, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, dt, true); c.setUint16(14, dd, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  }
  const csize = central.reduce((s, p) => s + p.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: "application/zip" });
}

/* ================================================================ áreas da vida */
const AREAS = ["Saúde física", "Saúde mental", "Finanças", "Carreira", "Aprendizado", "Família", "Amor & parceria", "Amizades & social", "Lazer & criatividade", "Propósito & espiritualidade", "Casa & organização"];
const AREA_INFO = {
  "Saúde física": { id: "fis", tag: "corpo", curto: "Corpo", ico: "pulse" },
  "Saúde mental": { id: "men", tag: "mente", curto: "Mente", ico: "brain" },
  "Finanças": { id: "fin", tag: "financas", curto: "Finanças", ico: "coins" },
  "Carreira": { id: "car", tag: "carreira", curto: "Carreira", ico: "brief" },
  "Aprendizado": { id: "apr", tag: "aprendizado", curto: "Aprendizado", ico: "book" },
  "Família": { id: "fam", tag: "familia", curto: "Família", ico: "family" },
  "Amor & parceria": { id: "amo", tag: "amor", curto: "Amor", ico: "heart" },
  "Amizades & social": { id: "ami", tag: "amizades", curto: "Amizades", ico: "users" },
  "Lazer & criatividade": { id: "laz", tag: "lazer", curto: "Lazer", ico: "palette" },
  "Propósito & espiritualidade": { id: "pro", tag: "proposito", curto: "Propósito", ico: "compass" },
  "Casa & organização": { id: "cas", tag: "casa", curto: "Casa", ico: "house" },
};
const acol = a => AREA_INFO[a] ? `var(--a-${AREA_INFO[a].id})` : "var(--muted)";
const alabel = a => S.areasCfg?.[a]?.rotulo || a;
const ashort = a => S.areasCfg?.[a]?.rotulo || AREA_INFO[a]?.curto || a;
const aativa = a => S.areasCfg?.[a]?.ativa !== false;
const apeso = a => { const p = S.areasCfg?.[a]?.peso; return p == null || p === "" ? 1 : +p; };
const TAG_AREA = { ...Object.fromEntries(AREAS.map(a => [AREA_INFO[a].tag, a])),
  saude: "Saúde física", treino: "Saúde física", sono: "Saúde física", corrida: "Saúde física", ansiedade: "Saúde mental", terapia: "Saúde mental", meditacao: "Saúde mental",
  dinheiro: "Finanças", gastos: "Finanças", trabalho: "Carreira", entrevista: "Carreira", estudo: "Aprendizado", leitura: "Aprendizado", livro: "Aprendizado",
  relacionamento: "Amor & parceria", amigos: "Amizades & social", hobby: "Lazer & criatividade", viagem: "Lazer & criatividade", espiritualidade: "Propósito & espiritualidade",
  voluntariado: "Propósito & espiritualidade", gratidao: "Propósito & espiritualidade", organizacao: "Casa & organização", documentos: "Casa & organização" };
const tagArea = t => TAG_AREA[slug(t)] || null;
const GRUPOS = ["Essencial", "Estilo de vida", "Crescimento"];
const GCOL = { "Essencial": "var(--g-ess)", "Estilo de vida": "var(--g-est)", "Crescimento": "var(--g-cre)", "Poupança": "var(--g-pou)" };

/* listas editáveis em Ajustes */
const DEFAULT_LISTS = () => ({
  desp: { "Moradia": "Essencial", "Contas da casa": "Essencial", "Mercado": "Essencial", "Transporte": "Essencial", "Saúde & bem-estar": "Essencial", "Dívidas & financiamentos": "Essencial", "Impostos & taxas": "Essencial", "Família & ajudas": "Essencial", "Restaurantes & cafés": "Estilo de vida", "Assinaturas": "Estilo de vida", "Cuidados pessoais": "Estilo de vida", "Lazer & passeios": "Estilo de vida", "Viagens": "Estilo de vida", "Roupas": "Estilo de vida", "Casa & utensílios": "Estilo de vida", "Presentes & doações": "Estilo de vida", "Educação & cursos": "Crescimento", "Livros & materiais": "Crescimento", "Outros": "Estilo de vida" },
  rec: ["Salário", "Renda extra / freelance", "Benefícios", "Rendimentos", "Reembolsos", "Outras receitas"],
  apo: ["Reserva de emergência", "Investimentos", "Previdência", "Objetivo específico"],
  contas: ["Conta corrente", "Cartão de crédito", "Cartão de débito", "PIX / transferência", "Dinheiro"],
  treinos: ["Musculação", "Corrida", "Caminhada", "Bicicleta", "Natação", "Yoga / alongamento", "Esporte coletivo", "Outro"],
  relacao: ["Família", "Parceria", "Amizade", "Trabalho", "Mentoria", "Comunidade"],
  lazer: ["Hobby criativo", "Esporte / ar livre", "Cultura", "Passeio", "Viagem", "Social", "Descanso", "Jogos", "Música"],
  aprend: ["Livro", "Curso", "Idioma", "Certificação", "Podcast / vídeo", "Workshop"],
});
let CAT_DESP, CAT_REC, CAT_APO, CONTAS, TREINOS, RELACAO, LAZER_CAT, APR_TIPOS;
function applyLists() {
  const D = DEFAULT_LISTS(), L = S.listas || {};
  CAT_DESP = L.desp && Object.keys(L.desp).length ? L.desp : D.desp; CAT_REC = L.rec?.length ? L.rec : D.rec; CAT_APO = L.apo?.length ? L.apo : D.apo;
  CONTAS = L.contas?.length ? L.contas : D.contas; TREINOS = L.treinos?.length ? L.treinos : D.treinos; RELACAO = L.relacao?.length ? L.relacao : D.relacao;
  LAZER_CAT = L.lazer?.length ? L.lazer : D.lazer; APR_TIPOS = L.aprend?.length ? L.aprend : D.aprend;
}
const relArea = r => ({ "Família": "Família", "Parceria": "Amor & parceria", "Amizade": "Amizades & social", "Trabalho": "Carreira", "Mentoria": "Carreira", "Comunidade": "Propósito & espiritualidade" }[r] || "Amizades & social");

/* ================================================================ estado */
const KEYS = ["cfg", "lanc", "orc", "patr", "saude", "habitos", "marks", "roda", "alvo", "revisao", "metas", "tarefas", "pessoas", "contatos", "aprend", "estudo", "lazer", "sonhos", "docs", "rotinas", "assin", "comp", "cand", "prio", "diario", "mentores", "listas", "regras", "areasCfg", "integ", "experimentos", "radar", "fechamentos", "capitulos", "resumos", "auditoria", "priv", "eventos", "bussola", "bmExames", "bmDecisoes", "projetos", "saldoConta", "importacoes", "jornada", "carreira", "lazerHub", "contasCasa", "compras", "cadTec", "oport", "idiomas", "fut", "vidaItens", "hojeCtx", "rotina", "rotinaModelos", "jardim", "secretario", "conselho", "filosofia", "psique", "ck", "ckTar", "ckRisk", "ckIss", "ckLog", "ckDec", "ckMeet", "ckBim", "ckEl", "ckLic", "ckRel", "ckSnap", "nutri", "nutriLog", "treino", "treinoLog", "corridas", "uso", "guia", "inspira", "rotinaAtiv"];
const EMPTY = () => ({
  cfg: { nome: "", moeda: "€", metaPoup: .2, metaReserva: 6, usoSobra: .7, maxParcela: .3, metaSono: 7.5, metaTreinos: 4, metaPassos: 8000, metaEstudo: 24, metaLivros: 12, metaLazer: 6, alertaDocs: 90, alertaAniv: 30, mentorNivel: "default", mentorTom: "Direto e caloroso", mentorNotion: true },
  lanc: [], orc: {}, patr: {}, saude: {}, habitos: [], marks: {}, roda: {}, alvo: {}, revisao: {}, metas: [], tarefas: [],
  pessoas: [], contatos: [], aprend: [], estudo: [], lazer: [], sonhos: [], docs: [], rotinas: [], assin: [], comp: [], cand: [], prio: ["", "", ""],
  diario: [], mentores: {}, listas: DEFAULT_LISTS(), regras: [], areasCfg: {}, integ: { notion: { pai: null, hist: [], tarefas: null } },
  experimentos: [], radar: { log: [] }, fechamentos: {}, capitulos: [], resumos: {}, auditoria: [], priv: { semIA: [], cofre: null }, eventos: [], bussola: { foco: [] }, bmExames: {}, bmDecisoes: [], projetos: [], saldoConta: null, importacoes: [], jornada: { p: {}, conf: { vivos: [], notas: {}, circulos: [] } }, carreira: {}, lazerHub: {}, contasCasa: [], compras: [], cadTec: [], oport: [], idiomas: {}, fut: {}, vidaItens: [], hojeCtx: {}, rotina: [], rotinaModelos: [], rotinaAtiv: { outras: [], fonte: "" }, guia: { plano: null, segue: true }, inspira: { ativo: "", esforco: "medio", tela: false, ativs: {}, minhas: [] }, jardim: { pedras: [], talhos: [], templo: {}, folhas: [], cam: {} }, secretario: { modo: "acao", perfis: {}, conversa: [], lembretes: [], decisoes: [] }, conselho: { cfg: {}, atas: [], sessao: null }, filosofia: { triagens: [], lentes: [] }, psique: { cfg: {}, sessoes: [], processos: [], padroes: [], reflexoes: [], pauta: [], modo: { fixo: "auto", atual: "escuta", motivo: "" } }, ck: {}, ckTar: [], ckRisk: [], ckIss: [], ckLog: [], ckDec: [], ckMeet: [], ckBim: [], ckEl: [], ckLic: [], ckRel: [], ckSnap: [], nutri: {}, nutriLog: [], treino: {}, treinoLog: [], corridas: [], uso: { desde: null, r: {}, a: {}, ia: {} }
});
let S = EMPTY(), REF = mkey(TODAY), IS_EXAMPLE = true, STORE = null, LOADED = false, VER = 0, DBH = null;
applyLists();

/* memória de cálculo: invalida a cada mudança de dados */
const MEMOS = new Map();
function memo(key, fn) { const k = key + "|" + VER; if (MEMOS.has(k)) return MEMOS.get(k); if (MEMOS.size > 400) MEMOS.clear(); const v = fn(); MEMOS.set(k, v); return v; }

/* desfazer / refazer por fotografia das chaves alteradas */
let SNAP = {};
const UNDO = [], REDO = [];
function snapAll() { SNAP = {}; for (const k of KEYS) SNAP[k] = JSON.stringify(S[k] ?? null); }
function touch(...keys) {
  const opts = keys.length && typeof keys[keys.length - 1] === "object" ? keys.pop() : {};
  const before = {}, after = {};
  for (const k of keys) { const now = JSON.stringify(S[k] ?? null); if (now !== SNAP[k]) { before[k] = SNAP[k]; after[k] = now; SNAP[k] = now; if (!EX_MODE && !IS_EXAMPLE) walPut(k, now); } }
  if (Object.keys(before).length && !opts.noUndo) { UNDO.push({ b: before, l: opts.label || "", h: hxNovo(before, after, opts) }); if (UNDO.length > 80) UNDO.shift(); REDO.length = 0; }
  VER++;
  if (EX_MODE) {} else if (IS_EXAMPLE) { IS_EXAMPLE = false; KEYS.forEach(k => dirty.add(k)); } else Object.keys(before).forEach(k => dirty.add(k));
  if (keys.includes("listas")) applyLists();
  if (!EX_MODE) flushSoon();
  if (!opts.noRender) render();
}
function swapState(from, to, msg) {
  const e = from.pop(); if (!e) { toast(msg[1]); return; }
  const back = {};
  for (const k in e.b) { back[k] = SNAP[k]; S[k] = e.b[k] == null ? EMPTY()[k] : JSON.parse(e.b[k]); SNAP[k] = e.b[k] ?? JSON.stringify(S[k]); dirty.add(k); if (!EX_MODE) walPut(k, SNAP[k]); }
  to.push({ b: back, l: e.l, h: e.h }); hxMarca(e.h, from === UNDO); VER++; applyLists(); flushSoon(); render();
  toast(e.l ? `${msg[0]}: ${e.l}` : msg[0], { l: from === UNDO ? "Refazer" : "Desfazer", f: from === UNDO ? redo : undo });
  if ("secretario" in e.b || "integ" in e.b) lemGcSync();   /* lembrete que sumiu ou voltou: o evento no Google acompanha */
}
const undo = () => UNDO.length ? swapState(UNDO, REDO, ["Desfeito", "Nada para desfazer"]) : EX_MODE ? toast("Nada para desfazer") : hxVolta();   /* memória vazia (recarregou): o histórico guardado */
const redo = () => swapState(REDO, UNDO, ["Refeito", "Nada para refazer"]);
/* ---------------------------------------------------------------- histórico de alterações
   Cada passo desfazível também entra aqui, com o que mudou item a item (não a chave inteira): lançamento criado, campo mudado,
   bloco apagado. Fica neste aparelho (localStorage atlas4_hx, até 150 passos), sobrevive a recarregar a página, e cada passo pode
   ser desfeito sozinho, mesmo depois de outros: volta só o que aquele passo mudou e que não mudou de novo depois (o resto fica
   como está, e o aviso conta quantas partes ficaram). O passo mais recente desfaz pela fotografia (UNDO), exato.
   Passo: { h, t, l (rótulo), pg (aba), k: { chave: operações }, s: resumo, u: desfeito, of/dir (quando desfaz ou refaz outro) }.
   Operações: ["+", caminho, item, i] item criado numa lista com id; ["-", caminho, item, i] apagado; ["~", caminho, id, { campo:
   [tinha antes, valor antes, tem depois, valor depois] }] campos mudados; ["=", caminho, tinha, antes, tem, depois] o resto. */
const HX = { L: [], ok: false, seq: 0, ult: "", ultT: 0, t: null, st: null, max: 150, kb: 900, gesto: 0 };
/* o aviso automático só vale para o que a pessoa acabou de fazer (toque, tecla, digitação), não para gravações em segundo plano */
for (const ev of ["pointerdown", "keydown", "submit", "change", "input"]) document.addEventListener(ev, () => { HX.gesto = Date.now(); }, true);
const HXK = "atlas4_hx", HX_INT = new Set(["upd", "at", "ts", "updatedAt", "editado"]);
const hxClone = v => v == null || typeof v !== "object" ? v : JSON.parse(JSON.stringify(v));
const hxIdList = a => Array.isArray(a) && a.every(x => isObj(x) && x.id != null);
const hxVazio = v => v == null || (Array.isArray(v) ? !v.length : isObj(v) && !Object.keys(v).length);
function hxDiff(b, a, path, ops) {
  if (jeq(b, a)) return;
  if (hxIdList(b) && hxIdList(a)) {
    const B = new Map(b.map((x, i) => [String(x.id), [x, i]])), A = new Map(a.map((x, i) => [String(x.id), [x, i]]));
    for (const [id, [x, i]] of B) if (!A.has(id)) ops.push(["-", path, x, i]);
    for (const [id, [x, i]] of A) { const o = B.get(id); if (!o) { ops.push(["+", path, x, i]); continue; } if (jeq(o[0], x)) continue;
      const f = {}; for (const k of new Set([...Object.keys(o[0]), ...Object.keys(x)])) if (!jeq(o[0][k], x[k])) f[k] = [k in o[0], o[0][k] ?? null, k in x, x[k] ?? null];
      ops.push(["~", path, id, f]); }
    return;
  }
  if (isObj(b) && isObj(a)) {
    for (const k of new Set([...Object.keys(b), ...Object.keys(a)])) {
      if (!(k in a)) { if (!hxVazio(b[k])) ops.push(["=", [...path, k], true, b[k], false, null]); } else if (!(k in b)) { if (!hxVazio(a[k])) ops.push(["=", [...path, k], false, null, true, a[k]]); } else hxDiff(b[k], a[k], [...path, k], ops); }
    return;
  }
  ops.push(["=", path, b !== undefined && b !== null, b ?? null, a !== undefined && a !== null, a ?? null]);
}
/* aplica as operações ao valor atual: dir -1 desfaz, +1 refaz. Só muda o que ainda está como o passo deixou */
function hxAplica(root, ops, dir) {
  let ok = 0, conf = 0;
  const no = (path, n) => { let o = root; const ks = ["v", ...path]; for (const k of ks.slice(0, ks.length - n)) { if (o == null || typeof o !== "object" || !(k in o)) return null; o = o[k]; } return o; };
  const igual = (obj, k, h, v) => { const tem = obj != null && typeof obj === "object" && k in obj && obj[k] !== undefined; return h ? tem && jeq(obj[k], v) : !tem || obj[k] === null; };
  const troca = (obj, k, fromH, fromV, toH, toV) => {
    if (igual(obj, k, fromH, fromV)) { if (toH) obj[k] = hxClone(toV); else if (Array.isArray(obj) || k === "v") obj[k] = null; else delete obj[k]; return 1; }
    return igual(obj, k, toH, toV) ? 0 : -1; };
  for (const op of dir < 0 ? [...ops].reverse() : ops) {
    const t = op[0], path = op[1];
    if (t === "=") { const par = no(path, 1); if (par == null || typeof par !== "object") { conf++; continue; } const k = ["v", ...path].at(-1);
      const r = dir < 0 ? troca(par, k, op[4], op[5], op[2], op[3]) : troca(par, k, op[2], op[3], op[4], op[5]); if (r < 0) conf++; else ok += r; continue; }
    const list = no(path, 0); if (!Array.isArray(list)) { conf++; continue; }
    if (t === "+" || t === "-") { const item = op[2], i = list.findIndex(x => String(x?.id) === String(item.id)), poe = (t === "+") === (dir > 0);
      if (poe && i < 0) { list.splice(Math.min(op[3], list.length), 0, hxClone(item)); ok++; } else if (!poe && i >= 0) { list.splice(i, 1); ok++; }
      continue; }
    if (t === "~") { const it = list.find(x => String(x?.id) === String(op[2])); if (!it) { conf++; continue; }
      for (const [k, [hb, bv, ha, av]] of Object.entries(op[3])) { const r = dir < 0 ? troca(it, k, ha, av, hb, bv) : troca(it, k, hb, bv, ha, av); if (r < 0) conf++; else ok += r; } }
  }
  return { ok, conf };
}
const hxTitulo = x => { if (x == null || typeof x !== "object") return x == null ? "" : String(x); for (const k of ["titulo", "texto", "tarefa", "nome", "desc", "meta", "conta", "doc", "sonho", "rotina", "empresa", "titulo_it", "item", "pergunta", "situacao", "cod", "habito", "assunto"]) if (typeof x[k] === "string" && x[k].trim()) return x[k]; return ""; };
/* resumo: quantos itens criados, apagados e campos mudados, e o nome dos primeiros itens */
function hxResumo(k) {
  const s = { a: 0, r: 0, m: 0, it: [] }, nome = x => { const t = hxTitulo(x); if (t && s.it.length < 3 && !s.it.includes(t)) s.it.push(trunc(t, 50)); };
  for (const ops of Object.values(k || {})) for (const op of ops) {
    if (op[0] === "+") { s.a++; nome(op[2]); } else if (op[0] === "-") { s.r++; nome(op[2]); } else if (op[0] === "~") s.m += Math.max(1, Object.keys(op[3]).filter(f => !HX_INT.has(f)).length);
    else if (!op[2] && op[4] && isObj(op[5])) { s.a++; nome(op[5]); } else if (op[2] && !op[4] && isObj(op[3])) { s.r++; nome(op[3]); } else s.m++; }
  return s;
}
function hxCarrega() { if (HX.ok) return; HX.ok = true; try { const v = JSON.parse(localStorage.getItem(HXK) || "[]"); if (Array.isArray(v)) HX.L = [...v.filter(e => e && e.h), ...HX.L]; } catch {} }
function hxProc(e) {
  if (!e?.raw) return; const k = {};
  try { for (const [key, [b, a]] of Object.entries(e.raw)) { const ops = []; hxDiff(b == null ? null : JSON.parse(b), a == null ? null : JSON.parse(a), [], ops); if (ops.length) k[key] = ops; } e.k = k; }
  catch (err) { console.warn("histórico", err); e.k = null; }
  delete e.raw; e.s = hxResumo(e.k);
}
function hxNovo(before, after, opts) {
  if (EX_MODE || !LOADED) return "";
  hxCarrega(); const h = "h" + Date.now().toString(36) + (++HX.seq).toString(36), raw = {};
  for (const k in before) raw[k] = [before[k] ?? null, after[k] ?? null];
  const e = { h, t: Date.now(), l: String(opts.label || "").slice(0, 120), pg: typeof PAGE === "string" ? PAGE + (SUB ? "." + SUB : "") : "", raw, ...(opts.hxOf ? { of: opts.hxOf, dir: opts.hxDir } : {}) };
  HX.L.push(e); HX.ult = h; HX.ultT = Date.now();
  if (e.of) hxMarca(h, false);
  clearTimeout(HX.t); HX.t = setTimeout(hxDepois, 40);
  return h;
}
/* depois do clique: calcula as diferenças, mostra Desfazer se nada foi avisado e algo foi criado ou apagado, e guarda */
function hxDepois() {
  for (const e of HX.L) if (e.raw) hxProc(e);
  const e = HX.L.at(-1);
  if (e && !e.of && e.h === HX.ult && UNDO.at(-1)?.h === e.h && TST.at < e.t && (e.s?.a || e.s?.r) && e.t - HX.gesto < 2000) toast(hxRotulo(e), hxAct(e.h));
  hxGuarda();
}
const hxGet = h => (hxCarrega(), HX.L.find(x => x.h === h));
function hxRotulo(e) {
  const s = e.s || {}, it = s.it?.length ? `: ${s.it.join(", ")}` : "";
  if (e.l) return e.l + (s.it?.length && !s.it.some(t => e.l.includes(t)) && (s.a || s.r) ? it : "");
  return s.a && !s.r ? `${plural(s.a, "item criado", "itens criados")}${it}` : s.r && !s.a ? `${plural(s.r, "item apagado", "itens apagados")}${it}` : "Alteração salva";
}
function hxMarca(h, desfeito, n = 0) { const e = h && hxGet(h); if (!e || n > 8) return; e.u = desfeito; if (e.of) hxMarca(e.of, e.dir < 0 ? !desfeito : desfeito, n + 1); hxGuarda(); }
function hxGuarda() {
  clearTimeout(HX.st); HX.st = setTimeout(() => {
    if (EX_MODE) return; for (const e of HX.L) if (e.raw) hxProc(e);
    try { const g = JSON.parse(localStorage.getItem(HXK) || "[]"), meus = new Set(HX.L.map(e => e.h)); if (Array.isArray(g)) { const de = g.filter(e => e?.h && !meus.has(e.h)); if (de.length) HX.L = [...HX.L, ...de].sort((a, b) => a.t - b.t); } } catch {}
    let L = HX.L.slice(-HX.max).map(e => { const j = e.k ? JSON.stringify(e.k) : ""; return j.length > 250000 ? { ...e, k: null, grande: true } : e; }), js = JSON.stringify(L);
    while (js.length > HX.kb * 1000 && L.length > 10) { L = L.slice(Math.ceil(L.length / 5)); js = JSON.stringify(L); }
    try { localStorage.setItem(HXK, js); } catch { try { L = L.slice(-30); localStorage.setItem(HXK, JSON.stringify(L)); } catch {} }
    if (HX.L.length > HX.max + 50) HX.L = HX.L.slice(-HX.max);
  }, 300);
}
/* o botão Desfazer de um aviso desfaz aquele passo, mesmo que outro tenha vindo depois */
const hxAct = h => h ? { l: "Desfazer", h, f: () => hxDesfazer(h) } : { l: "Desfazer", f: undo };
function hxDesfazer(h, dir = -1) {
  if (!h) { dir < 0 ? undo() : redo(); return; }
  if (dir < 0 && UNDO.at(-1)?.h === h) { undo(); return; }
  if (dir > 0 && REDO.at(-1)?.h === h) { redo(); return; }
  const e = hxGet(h); if (!e) { toast("Esse passo não está mais no histórico deste aparelho."); return; }
  hxProc(e);
  if (!e.k) { toast("Esse passo foi grande demais para guardar no histórico: só dava para desfazer na hora."); return; }
  if (dir < 0 ? e.u : !e.u) { toast(dir < 0 ? "Esse passo já foi desfeito." : "Esse passo já está valendo."); return; }
  if (EX_MODE) { toast("Desligue o modo exemplo para mexer no histórico dos seus dados."); return; }
  const keys = Object.keys(e.k).filter(k => KEYS.includes(k)); let ok = 0, conf = 0;
  for (const k of keys) { const root = { v: hxClone(S[k] ?? null) }, r = hxAplica(root, e.k[k], dir); S[k] = root.v ?? EMPTY()[k]; ok += r.ok; conf += r.conf; }
  const antes = HX.ult; touch(...keys, { label: `${dir < 0 ? "Desfeito" : "Refeito"}: ${e.l || hxRotulo(e)}`, hxOf: h, hxDir: dir });
  if (HX.ult === antes) hxMarca(h, dir < 0);   /* nada mudou de fato (já estava assim): só marca */
  toast(`${dir < 0 ? "Desfeito" : "Refeito"}: ${e.l || hxRotulo(e)}${conf ? ` · ${plural(conf, "parte mudou", "partes mudaram")} depois e ficou como está` : ""}`, { l: dir < 0 ? "Refazer" : "Desfazer", h, f: () => hxDesfazer(h, -dir) });
  if (keys.includes("secretario") || keys.includes("integ")) lemGcSync();
  if (typeof hxPaint === "function") hxPaint();
}


/* ================================================================ gravação
   Cada chave de S é um documento s_<chave> em data/users/<id>. Acima de ~180 KB, o valor vira partes s_<chave>.g<geração>.<i>
   e o documento principal (o cabeçalho) aponta para a geração completa: as partes novas entram antes, o cabeçalho troca de
   geração depois e só então a geração velha sai, então uma gravação interrompida nunca mistura duas versões.
   Cada gravação leva uma revisão (r). Antes de gravar, o app confere a revisão no banco: se outro aparelho (ou outra aba)
   gravou depois da última leitura, junta as duas versões em 3 vias em vez de sobrescrever. O documento s__rev guarda a
   revisão de cada chave e avisa os outros aparelhos ao vivo; uma trava curta (acquire em s__lock) evita que dois aparelhos
   leiam-juntem-gravem a mesma chave ao mesmo tempo.
   Edição pendente fica também num diário de escrita neste aparelho (localStorage, atlas4_wal_<chave>) até chegar ao banco:
   se a aba fechar antes, a próxima abertura reaplica. Ao esconder ou fechar a aba, a gravação sai na hora. */
const dirty = new Set(); let saveTimer = null, FLUSHING = null, SAVE_ERR = null, LAST_SAVE = 0, DB_FAIL = null, WATCH = null;
const PARTS = {}, LIMIT = 180000, BASE = {}, REV = {}, MYREVS = new Set(), WALT = {}; let WSEQ = 0; const TAB = Math.random().toString(36).slice(2, 10);
const espera = ms => new Promise(r => setTimeout(r, ms));
function slices(v) {
  const items = Array.isArray(v) ? v : Object.entries(v || {}), out = []; let cur = [], size = 0;
  for (const it of items) { const s = ENC.encode(JSON.stringify(it)).length + 1; if (size + s > LIMIT && cur.length) { out.push(cur); cur = []; size = 0; } cur.push(it); size += s; }
  if (cur.length || !out.length) out.push(cur);
  return out.map(c => Array.isArray(v) ? c : Object.fromEntries(c));
}

/* junta em 3 vias: b = o que este aparelho leu (base comum), l = este aparelho, r = o banco agora.
   Listas de itens com id se juntam item a item, objetos campo a campo. Apagado de um lado e intacto do outro sai;
   editado de um lado e apagado do outro fica; os dois mudaram o mesmo valor simples: vale este aparelho.
   Sem base (b undefined), nada é apagado: entra a união dos dois lados. */
const jeq = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
const idList = a => Array.isArray(a) && a.every(x => isObj(x) && x.id != null);
function merge3(b, l, r) {
  if (jeq(l, r)) return l;
  if (b !== undefined && jeq(b, l)) return r;
  if (b !== undefined && jeq(b, r)) return l;
  if (idList(l) && idList(r) && (b == null || idList(b))) {
    const B = new Map((b || []).map(x => [String(x.id), x])), L = new Set(l.map(x => String(x.id))), R = new Map(r.map(x => [String(x.id), x])), out = [];
    for (const x of l) { const id = String(x.id); if (R.has(id)) out.push(merge3(B.get(id), x, R.get(id))); else if (!B.has(id) || !jeq(B.get(id), x)) out.push(x); }
    for (const x of r) { const id = String(x.id); if (L.has(id)) continue; if (!B.has(id) || !jeq(B.get(id), x)) out.push(x); }
    return out;
  }
  if (isObj(l) && isObj(r) && (b == null || isObj(b))) {
    const bb = b || {}, o = {};
    for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) {
      if (key in l && key in r) o[key] = merge3(key in bb ? bb[key] : undefined, l[key], r[key]);
      else { const v = key in l ? l[key] : r[key]; if (!(key in bb) || !jeq(bb[key], v)) o[key] = v; }
    }
    return o;
  }
  return l;
}

/* monta o valor de uma chave a partir do cabeçalho e das partes (geração nova s_k.gN.i ou antiga s_k.i) */
function partName(k, g, i) { return g != null ? `s_${k}.g${g}.${i}` : `s_${k}.${i}`; }
async function assemble(k, m, part) {
  if (!m) return undefined;
  if (!m.parts) return m.v;
  const sl = [];
  for (let i = 0; i < m.parts; i++) { const d = await part(partName(k, m.g, i)); if (!d) console.warn("parte ausente", k, i); sl.push(d?.v ?? (m.kind === "a" ? [] : {})); }
  return m.kind === "a" ? sl.flat() : Object.assign({}, ...sl);
}
const revOf = m => m ? (m.r ?? "t" + (m.at || 0)) : null;
const partsOf = m => m?.parts ? { n: m.parts, g: m.g ?? null } : { n: 0, g: null };
async function readRemote(k) {
  const col = STORE.col, h = await col.doc("s_" + k).get(), m = h.exists ? clone(h.data()) : null;
  const v = await assemble(k, m, async id => { const d = await col.doc(id).get(); return d.exists ? d.data() : null; });
  return { m, v: v === undefined ? undefined : clone(v) };
}
async function writeKey(k, v, r) {
  const col = STORE.col, old = PARTS[k] || { n: 0, g: null }, at = Date.now();
  let now = { n: 0, g: null };
  if (v === null || typeof v !== "object" || ENC.encode(JSON.stringify(v)).length <= LIMIT) await col.doc("s_" + k).set({ v: v ?? null, at, r });
  else {
    const sl = slices(v), g = (old.g || 0) + 1; now = { n: sl.length, g };
    for (let i = 0; i < sl.length; i++) await col.doc(partName(k, g, i)).set({ v: sl[i] });
    await col.doc("s_" + k).set({ parts: sl.length, kind: Array.isArray(v) ? "a" : "o", g, at, r });
  }
  PARTS[k] = now;
  if (old.n && (old.g !== now.g || !now.n)) for (let i = 0; i < old.n; i++) await col.doc(partName(k, old.g, i)).delete().catch(() => {});
}
/* trava cooperativa: espera até ~12 s se outro aparelho está gravando; sem a função (runtime antigo) ou com erro, grava assim mesmo */
let LOCK_AT = 0;
async function lockSave() {
  if (Date.now() - LOCK_AT < 3000) return;   /* a trava dura 5 s: renova só depois de 3 s, não a cada chave */
  const ref = STORE.col.doc("s__lock"); if (typeof ref.acquire !== "function") return;
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    try { const r = await ref.acquire({ holder: TAB, ttlMs: 5000 }); if (!r || r.acquired !== false) { LOCK_AT = Date.now(); return; } } catch (e) { return; }
    await espera(300 + Math.random() * 500);
  }
}
function dropUndo(k) { for (const L of [UNDO, REDO]) { for (const e of L) delete e.b[k]; for (let i = L.length - 1; i >= 0; i--) if (!Object.keys(L[i].b).length) L.splice(i, 1); } }
let JUNTOU = new Set();
async function saveKey(k) {
  const s0 = WSEQ; await lockSave();
  const h = await STORE.col.doc("s_" + k).get(), m = h.exists ? clone(h.data()) : null, rr = revOf(m);
  PARTS[k] = partsOf(m);
  let v = S[k] ?? null;
  if (rr !== (REV[k] ?? null)) {   /* outro aparelho gravou esta chave depois da última leitura: junta em vez de sobrescrever */
    const remote = await assemble(k, m, async id => { const d = await STORE.col.doc(id).get(); return d.exists ? d.data() : null; });
    if (remote !== undefined) {
      const base = BASE[k] != null ? JSON.parse(BASE[k]) : undefined, mg = merge3(base, clone(v), clone(remote));
      if (!jeq(mg, v)) { v = mg; S[k] = mg; SNAP[k] = JSON.stringify(mg); dropUndo(k); VER++; if (k === "listas") applyLists(); JUNTOU.add(k); }
    }
  }
  const r = TAB + "." + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  MYREVS.add(r); if (MYREVS.size > 300) MYREVS.delete(MYREVS.values().next().value);
  await writeKey(k, v, r);
  BASE[k] = JSON.stringify(v); REV[k] = r;
  if (WALT[k] && WALT[k] <= s0) walDrop(k);   /* sem edição nova durante a gravação: o diário desta chave já cumpriu o papel */
  return r;
}
/* as revisões da rodada vão juntas, numa gravação só, para o documento que avisa os outros aparelhos */
async function revNote(revs) {
  if (!Object.keys(revs).length) return; const meta = STORE.col.doc("s__rev");
  try { await meta.update(revs); } catch (e) { if (e?.code === "invalid_argument") await meta.set(revs).catch(() => {}); }
}
async function flush() {
  if (!STORE || EX_MODE || DB_FAIL) return; const keys = [...dirty]; dirty.clear(); if (!keys.length) return;
  saveStatus("saving"); const feitos = new Set(), revs = {};
  try {
    LOCK_AT = 0;
    for (const k of keys) { if (STORE.kind === "db") revs[k] = await saveKey(k); else localStorage.setItem("atlas_" + k, JSON.stringify(S[k])); feitos.add(k); }
    if (STORE.kind === "db") await revNote(revs);
    SAVE_ERR = null; LAST_SAVE = Date.now(); saveStatus();
  } catch (e) {
    if (STORE.kind === "db") revNote(revs).catch(() => {});
    keys.forEach(k => { if (!feitos.has(k)) dirty.add(k); }); SAVE_ERR = e?.code || "erro"; saveStatus();
    if (SAVE_ERR === "quota_exceeded") toast("O espaço de dados encheu. Exporte um backup em Integrações e apague registros antigos em Dados.");
    else if (SAVE_ERR === "revoked" || SAVE_ERR === "not_granted") toast("Esta visualização perdeu acesso ao armazenamento. Recarregue a página.");
    else { clearTimeout(saveTimer); saveTimer = setTimeout(() => flushSoon(0), 6000); }
  }
  if (JUNTOU.size) { const n = JUNTOU.size; JUNTOU = new Set(); renderQuieto(); toast(n > 1 ? `Juntei ${n} conjuntos com o que foi registrado em outro aparelho.` : "Juntei com o que foi registrado em outro aparelho."); }
}
function flushSoon(ms = 700) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { if (FLUSHING) FLUSHING.then(() => flushSoon(150)); else FLUSHING = flush().finally(() => { FLUSHING = null; }); }, ms);
}
/* ao esconder ou fechar a aba (no celular, trocar de app), grava na hora em vez de esperar */
function flushNow() {
  if (!dirty.size || !STORE || EX_MODE || DB_FAIL) return; clearTimeout(saveTimer);
  if (FLUSHING) FLUSHING.then(() => flushNow()); else FLUSHING = flush().finally(() => { FLUSHING = null; });
}
document.addEventListener("visibilitychange", () => { if (document.hidden) flushNow(); });
window.addEventListener("pagehide", flushNow);

/* uso das abas e da IA (só para você decidir o que fixar no menu e quanto a IA custa): conta na memória e marca a chave como
   pendente sem gravar agora; vai junto com a próxima gravação, ao esconder a aba ou, no máximo, um minuto depois */
let USO_T = null;
function usoConta(tipo, k, n = 1) {
  if (!LOADED || EX_MODE || IS_EXAMPLE || !STORE || !k) return;
  const u = (S.uso ||= { desde: TODAY, r: {}, a: {}, ia: {} }); u.desde ||= TODAY; u[tipo] ||= {};
  if (tipo === "ia") { const m = (u.ia[TODAY.slice(0, 7)] ||= { n: 0, kb: 0 }); m.n++; m.kb += Math.round(n / 1024); }
  else u[tipo][k] = (u[tipo][k] || 0) + n;
  SNAP.uso = JSON.stringify(u); dirty.add("uso");
  if (!USO_T) USO_T = setTimeout(() => { USO_T = null; if (dirty.has("uso") && !FLUSHING) flushSoon(0); }, 60000);
}

/* diário de escrita: a edição que ainda não chegou ao banco fica neste aparelho, com a revisão em que se baseou */
const WALP = "atlas4_wal_";
function walPut(k, json) { if (STORE?.kind !== "db" || EX_MODE) return; try { localStorage.setItem(WALP + k, `{"b":${JSON.stringify(REV[k] ?? null)},"t":${Date.now()},"v":${json}}`); WALT[k] = ++WSEQ; } catch {} }
function walDrop(k) { try { localStorage.removeItem(WALP + k); } catch {} delete WALT[k]; }
function walRead() {
  const o = {};
  try { for (let i = 0; i < localStorage.length; i++) { const n = localStorage.key(i); if (!n?.startsWith(WALP)) continue; const k = n.slice(WALP.length); if (!KEYS.includes(k)) continue; try { o[k] = JSON.parse(localStorage.getItem(n)); } catch {} } } catch {}
  return o;
}
/* depois de ler o banco: o que ficou pendente na visita anterior volta e é gravado. Se ninguém gravou a chave desde então,
   a versão pendente vale inteira; se alguém gravou, entra a união das duas (nada se perde). */
function walApply() {
  let n = 0;
  for (const [k, e] of Object.entries(walRead())) {
    if (!e || !("v" in e)) { walDrop(k); continue; }
    if (jeq(e.v, S[k])) { walDrop(k); continue; }
    S[k] = (e.b ?? null) === (REV[k] ?? null) ? e.v : merge3(undefined, e.v, S[k]);
    SNAP[k] = JSON.stringify(S[k] ?? null); dirty.add(k); WALT[k] = ++WSEQ; n++;
  }
  if (n) { if ("listas" in S) applyLists(); VER++; }
  return n;
}

/* aviso ao vivo: quando outro aparelho grava, a chave que não tem edição pendente aqui é relida */
const PULL = new Set(); let pullT = null;
function watchRevs() {
  if (STORE?.kind !== "db" || WATCH || DB_FAIL) return;
  try {
    WATCH = STORE.col.doc("s__rev").onSnapshot(snap => { const d = snap.exists ? snap.data() || {} : {}; for (const k of KEYS) { const r = d[k]; if (r && r !== REV[k] && !MYREVS.has(r)) { PULL.add(k); clearTimeout(pullT); pullT = setTimeout(pullRemote, 300); } } },
      e => { WATCH = null; if (e?.code !== "revoked") setTimeout(watchRevs, 30000); });
  } catch (e) { WATCH = null; }
}
/* no modo exemplo a releitura espera (S é o exemplo): as chaves ficam na fila e entram nos seus dados quando ele desligar */
let PULLING = null;
function pullRemote() { if (EX_MODE) return; return PULLING ||= pullRemote0().finally(() => { PULLING = null; }); }
async function pullRemote0() {
  if (FLUSHING) await FLUSHING.catch(() => {});
  const ks = [...PULL]; PULL.clear(); let n = 0;
  for (const k of ks) {
    if (dirty.has(k)) continue;   /* edição pendente aqui: a gravação junta as duas versões */
    try {
      const { m, v } = await readRemote(k); const rr = revOf(m);
      if (EX_MODE) { PULL.add(k); continue; }
      if (!m || rr === REV[k] || dirty.has(k)) continue;
      S[k] = v; BASE[k] = SNAP[k] = JSON.stringify(v ?? null); REV[k] = rr; PARTS[k] = partsOf(m); dropUndo(k); n++;
      if (k === "listas") applyLists();
    } catch (e) { console.warn("atualizar", k, e); }
  }
  if (n) { VER++; renderQuieto(); toast("Atualizado com o que foi registrado em outro aparelho."); }
}
/* redesenha sem tirar da mão o campo que está sendo digitado: espera ele perder o foco */
let RQ = false;
function renderQuieto() {
  if (document.activeElement?.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=button]), textarea, select, [contenteditable=true]")) { RQ = true; return; }
  RQ = false; render();
}
document.addEventListener("focusout", () => { if (RQ) setTimeout(() => { if (RQ) renderQuieto(); }, 200); });

/* leitura ao abrir. Banco presente e lendo: valores, base e revisões. Banco presente mas sem responder depois de 4 tentativas
   (1, 2 e 4 s de espera): devolve null e o app abre sem gravar no banco, guardando o que for registrado no diário de escrita
   até a conta responder. Sem banco (sem conta nesta visualização): modo local, no navegador. */
async function loadStore() {
  const loaded = {}; let db = null, id = null;
  try { db = await window.claude?.use?.("db"); const user = db ? await window.claude.use("user") : null; id = user ? await user.id() : null; } catch { db = null; }
  if (db && id) {
    DBH = db; const col = db.collection("data/users/" + id); STORE = { kind: "db", col };
    let snap = null, err = null;
    for (const w of [0, 1000, 2000, 4000]) {
      if (w) await espera(w);
      try { snap = await col.limit(1000).get(); break; } catch (e) { err = e; if (["revoked", "not_granted", "capability_disabled", "capability_removed", "invalid_argument"].includes(e?.code)) break; }
    }
    if (!snap) { DB_FAIL = err?.code || "erro"; return null; }
    DB_FAIL = null;
    const docs = {}; for (const d of snap.docs) docs[d.id] = d.data();
    for (const k of KEYS) {
      const m = docs["s_" + k]; if (!m) continue;
      const js = JSON.stringify((await assemble(k, m, async n => docs[n] || null)) ?? null);
      loaded[k] = JSON.parse(js); BASE[k] = js; REV[k] = revOf(m); PARTS[k] = partsOf(m);
    }
    return loaded;
  }
  STORE = { kind: "local" }; for (const k of KEYS) try { const v = localStorage.getItem("atlas_" + k); if (v) loaded[k] = JSON.parse(v); } catch {}
  return loaded;
}
/* junta o que veio do banco com os padrões das chaves que ganharam campos novos */
function comPadroes(loaded) {
  const E = EMPTY();
  return { ...E, ...loaded, priv: { ...E.priv, ...(loaded.priv || {}) }, radar: { ...E.radar, ...(loaded.radar || {}) }, cfg: { ...E.cfg, ...(loaded.cfg || {}) }, integ: { ...E.integ, ...(loaded.integ || {}), notion: { ...E.integ.notion, ...(loaded.integ?.notion || {}) } }, listas: { ...E.listas, ...(loaded.listas || {}) } };
}
/* a conta não respondeu ao abrir: tenta de novo a cada 15 s, ao voltar para a aba e no botão. Quando responde, o que foi
   registrado nesse meio-tempo se junta ao que está no banco (base vazia: nada do banco é apagado). */
let RETRY_T = null, RETRYING = false;
async function retryLoad() {
  if (!DB_FAIL || RETRYING) return; RETRYING = true; clearTimeout(RETRY_T); saveStatus("saving");
  try {
    const loaded = await loadStore();
    if (loaded === null) { RETRY_T = setTimeout(retryLoad, 15000); saveStatus(); render(); return; }
    const full = comPadroes(loaded), E = EMPTY();
    for (const k of KEYS) S[k] = dirty.has(k) ? merge3(E[k], S[k], full[k]) : full[k];
    applyLists(); VER++; snapAll(); UNDO.length = 0; REDO.length = 0;
    walApply(); flushSoon(0); watchRevs(); render(); toast("Conectado à sua conta. O que você registrou enquanto isso foi juntado.");
  } finally { RETRYING = false; }
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && DB_FAIL) retryLoad(); });

/* ================================================================ avisos */
/* Um aviso que vem logo depois de uma mudança desfazível ganha o botão Desfazer (daquele passo). Um aviso sem botão não apaga o
   Desfazer que está na tela: o texto entra junto. Com uma janela (diálogo) aberta, o aviso aparece dentro dela, por cima do fundo;
   se a janela fecha com o Desfazer na tela, ele volta para a página. Com o mouse ou o foco em cima, não some. */
const TST = { at: 0, act: null, txt: "", el: null };
function toastEl() {
  const base = $("#toast"), dlg = [...document.querySelectorAll("dialog[open]")].filter(d => { try { return d.matches(":modal"); } catch { return false; } }).at(-1);
  if (!dlg) { for (const x of $$(".toast.dlgt")) x.hidden = true; return base; }
  if (base) base.hidden = true;
  let el = dlg.querySelector(":scope > .toast.dlgt"); if (!el) { el = document.createElement("div"); el.className = "toast dlgt"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); el.hidden = true; dlg.appendChild(el); }
  if (!dlg.dataset.tobs) { dlg.dataset.tobs = "1"; new MutationObserver(() => { const t = TST.el; if (t && !t.isConnected && t.dataset.dlg === dlg.id && !t.hidden && dlg.open && TST.act) dlg.appendChild(t); }).observe(dlg, { childList: true }); }
  el.dataset.dlg = dlg.id || ""; return el;
}
function toast(t, act) {
  t = String(t ?? "");
  if (!act && HX.ult && Date.now() - HX.ultT < 600 && UNDO.at(-1)?.h === HX.ult) act = hxAct(HX.ult);
  const el = toastEl(); if (!el) return;
  if (!act && TST.act && !el.hidden && Date.now() - TST.at < 4000) { if (!TST.txt.includes(t)) { TST.txt += ` · ${t}`; const sp = el.querySelector("span"); if (sp) sp.textContent = TST.txt; } return; }
  for (const x of $$("#toastAct")) x.removeAttribute("id");   /* o botão do aviso visível é o único #toastAct */
  el.innerHTML = `<span>${esc(t)}</span>${act ? `<button type="button" class="tbtn" id="toastAct">${esc(act.l)}</button>` : ""}`;
  el.hidden = false; TST.at = Date.now(); TST.act = act || null; TST.txt = t; TST.el = el;
  if (act) el.querySelector(".tbtn").onclick = () => { el.hidden = true; TST.act = null; act.f(); };
  if (!el.dataset.hv) { el.dataset.hv = "1"; const fim = ms => { clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; TST.act = null; }, ms); };
    el.addEventListener("mouseenter", () => clearTimeout(toast.t)); el.addEventListener("focusin", () => clearTimeout(toast.t)); el.addEventListener("mouseleave", () => fim(2500)); }
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; TST.act = null; }, act ? 8000 : 2600);
}
document.addEventListener("close", e => { const t = e.target?.querySelector?.(":scope > .toast.dlgt"); if (t && !t.hidden && TST.act && Date.now() - TST.at < 7000) { const txt = TST.txt, a = TST.act; t.remove(); toast(txt, a); } }, true);
const undoToast = msg => toast(msg, hxAct(HX.ult && Date.now() - HX.ultT < 1500 ? HX.ult : UNDO.at(-1)?.h));
function saveStatus(st) {
  const el = $("#savest"); if (!el) return;
  const t = EX_MODE ? ["ex", "Modo exemplo · não salvo"] : st === "saving" ? ["saving", "Salvando…"] : DB_FAIL ? ["err", "Sem conexão com a conta · guardando neste aparelho"] : SAVE_ERR ? ["err", "Não salvo · tentando de novo"] : IS_EXAMPLE ? ["ex", "Exemplo · não salvo"]
    : STORE?.kind === "db" ? ["ok", "Salvo na sua conta"] : STORE?.kind === "local" ? ["local", "Salvo neste navegador"] : ["ex", "Conectando…"];
  el.className = "savest " + t[0]; el.textContent = t[1];
}
