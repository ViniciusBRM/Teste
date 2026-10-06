/* ================================================================ painel do dia: os campos essenciais, por texto ou voz, com revisão antes de salvar
   Não guarda nada próprio: cada linha confirmada vira o mesmo registro que as abas usam (comandos “/” do diário, jornada.sess, diário).
   Voz: Web Speech API do navegador quando existe e o microfone está liberado; sem ela, o ditado do sistema escreve nos mesmos campos. */
const PD_SCALES = [["humor", "Humor"], ["energia", "Energia"], ["estresse", "Estresse"]];
const PD_LBL = { humor: "Humor", energia: "Energia", estresse: "Estresse", sono: "Sono", passos: "Passos", treino: "Treino", min: "Minutos de treino", pmin: "Minutos de prática", ppid: "Pilar", lzat: "Atividade de lazer", lzh: "Horas de lazer", gastos: "Gastos", habitos: "Hábitos", texto: "Texto do dia" };
const PD_REQ_OPC = ["humor", "energia", "estresse", "sono", "passos", "treino", "gastos", "habitos", "texto"];
const PD_REQ_DEF = ["humor", "sono"];
const PD_KEYS = ["humor", "energia", "estresse", "sono", "passos", "treino", "min", "ppid", "pmin", "lzat", "lzh"];
const pdNew = (date = TODAY) => ({ bm: {}, rt: {}, chkT: {}, date, dateSrc: "", v: { ppid: "med" }, src: {}, gastos: [], habs: {}, hsrc: {}, text: "", diario: true, xoff: [], off: [], on: [], extras: [], L: { tar: [], cont: [], est: [], ler: [] }, chk: { tdone: {}, rot: {}, conta: {} }, step: "form", done: null, inf: [] });
let PD = pdLoad() || pdNew();
function pdLoad() { try { const v = JSON.parse(localStorage.getItem("atlas_painel") || "null"); return v && v.date && v.v ? { ...pdNew(v.date), ...v, step: "form", done: null } : null; } catch { return null; } }
const pdStore = debounce(() => { if (EX_MODE) return; try { pdEmpty() ? localStorage.removeItem("atlas_painel") : localStorage.setItem("atlas_painel", JSON.stringify({ ...PD, done: null, step: "form" })); } catch {} }, 400);
const pdEmpty = () => !Object.keys(PD.bm || {}).length && !Object.keys(PD.rt || {}).length && !PD.text.trim() && !PD.gastos.some(g => g.v || g.d) && !pdLtotal() && !Object.values(PD.chk || {}).some(o => Object.keys(o).length) && !Object.keys(PD.hsrc).length && !Object.values(PD.src).some(s => s && s !== "base");
const pdReq = () => Array.isArray(S.cfg.pdReq) ? S.cfg.pdReq : PD_REQ_DEF;
const pdRev = () => S.cfg.pdRev !== false;
const pdLang = () => S.cfg.pdLang || "pt-BR";

/* ---------------------------------------------------------------- números falados e formatos aceitos */
const PD_NW = { zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezasseis: 16, dezessete: 17, dezassete: 17, dezoito: 18, dezenove: 19, dezanove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900 };
const PD_UNIT = /^(h|horas?|minutos?|min|passos|euros?|reais|real|quilos?|kg|paginas?|km|quilometros?)$/;
const PD_PRE = /^(humor|energia|estresse|dormi|gastei|paguei|custou|caminhei|corri|meditei|li|pesei|treinei|estudei|nota)$/;
/* troca números por extenso por dígitos. Livre (campo único): converte tudo. No texto do dia: só perto de unidade ou de palavra-chave,
   para “comprei um café” continuar sendo texto */
function pdWords(s, livre = false) {
  const toks = String(s || "").match(/\p{L}+|\d+(?:[.,]\d+)?|\s+|[^\p{L}\d\s]+/gu) || [], F = toks.map(t => fold(t));
  const isW = i => F[i] != null && (F[i] in PD_NW || F[i] === "mil"), CUR = /^(euros?|reais|real)$/;
  const nextWord = i => { let j = i; while (j < toks.length && /^\s+$/.test(toks[j])) j++; return j; };
  let out = "", i = 0;
  while (i < toks.length) {
    if (!isW(i) || (F[i] === "mil" && /^\d/.test(toks[i - 1] === " " ? toks[i - 2] || "" : toks[i - 1] || ""))) { out += toks[i]; i++; continue; }
    let total = 0, cur = 0, j = i, last = i, words = 0, mag = 0, cents = null;
    while (j < toks.length) {
      if (isW(j)) { const w = F[j];
        if (w === "mil") { cur = (cur || 1) * 1000; total += cur; cur = 0; mag = 1000; }
        else { const v = PD_NW[w], cv = total + cur; if (words && cv && !(v < 10 ? cv % 10 === 0 : v < 100 ? cv % 100 === 0 : cv % 1000 === 0)) break; cur += v; mag = v; }
        words++; last = j; j = nextWord(j + 1);
        if (F[j] === "e" && isW(nextWord(j + 1))) { const k = nextWord(j + 1), v = PD_NW[F[k]] ?? 0, cv = total + cur;
          if (F[k] !== "mil" && !(v < 10 ? cv % 10 === 0 : v < 100 ? cv % 100 === 0 : cv % 1000 === 0)) {
            /* “dezoito e cinquenta euros” = 18,50 */
            let k2 = k, cc = v;
            const kk = nextWord(k + 1); if (F[kk] === "e" && isW(nextWord(kk + 1)) && PD_NW[F[nextWord(kk + 1)]] < 10 && v % 10 === 0) { k2 = nextWord(kk + 1); cc = v + PD_NW[F[k2]]; }
            if (cc < 100 && CUR.test(F[nextWord(k2 + 1)] || "")) { cents = cc; last = k2; }
            break; }
          j = k; }
        continue; }
      break;
    }
    let val = total + cur + (cents != null ? cents / 100 : 0), end = last + 1;
    /* “sete e meia” e “sete vírgula cinco” */
    const a = nextWord(end), b = nextWord(a + 1);
    if (F[a] === "e" && F[b] === "meia" && val <= 24) { val += .5; end = b + 1; }
    else if (F[a] === "virgula" && (isW(b) || /^\d+$/.test(toks[b] || ""))) { const d = isW(b) ? PD_NW[F[b]] : +toks[b]; if (d != null && d < 100) { val = parseFloat(`${val}.${d}`); end = b + 1; } }
    const prevW = q => { q--; while (q >= 0 && /^\s+$/.test(toks[q])) q--; return q; };
    let p = prevW(i); if (p >= 0 && /^(de|em|foi|ficou|esta|tava|estava|=|:)$/.test(F[p])) p = prevW(p);
    const nx = nextWord(end), solo = words === 1 && (F[i] === "um" || F[i] === "uma"), ok = livre ? !solo || PD_UNIT.test(F[nx] || "") : PD_UNIT.test(F[nx] || "") || (!solo && p >= 0 && PD_PRE.test(F[p] || ""));
    if (ok) { out += String(val).replace(".", ",") + (F[p] === "dormi" && !PD_UNIT.test(F[nx] || "") ? "h" : ""); i = end; } else { out += toks.slice(i, last + 1).join(""); i = last + 1; }
  }
  return out;
}
/* horas: 7 · 7,5 · 7h30 · 7:30 · 7 e meia · 7 horas e 15 · 90 min */
function pdHours(s) {
  const f = fold(pdWords(s, true)).trim(); if (!f) return null; let m;
  if ((m = f.match(/(\d+(?:[.,]\d+)?)\s*(?:h|horas?)?\s*e\s*meia/))) return capNum(m[1]) + .5;
  if ((m = f.match(/^(?:.*[^\d.,])?(\d{1,2})\s*(?:[:h]|horas?\s*e)\s*(\d{1,2})\s*(?:min|minutos)?\s*$/))) return +m[1] + +m[2] / 60;
  if ((m = f.match(/^(\d+)\s*(?:min|minutos)$/))) return +m[1] / 60;
  if ((m = f.match(/^(?:.*[^\d.,])?(\d+(?:[.,]\d+)?)\s*(?:h|hs|horas?)?\s*$/))) return capNum(m[1]);
  return null;
}
const pdHoursOk = s => /^\s*\d{1,2}(?:[.,]\d{1,2})?\s*(?:h|hs|horas?)?\s*$|^\s*\d{1,2}\s*(?:[:h]|horas?\s*e)\s*\d{1,2}\s*(?:min|minutos)?\s*$|^\s*\d{1,3}\s*(?:min|minutos)\s*$/i.test(fold(s)) || /e\s*meia/.test(fold(s));
/* inteiros: 8000 · 8.000 · 8 000 · 8k · 8 mil · oito mil */
function pdInt(s) {
  const f = fold(pdWords(s, true)).trim(); if (!f) return null; let m;
  if ((m = f.match(/^(\d+(?:[.,]\d+)?)\s*(k|mil)\b/))) return Math.round(capNum(m[1]) * 1000);
  if ((m = f.match(/^(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:\s*\p{L}+)*$/u))) return +m[1].replace(/[.\s]/g, "");
  return NaN;
}
function pdMin(s) { const f = fold(pdWords(s, true)).trim(); if (!f) return null; const c = capMinutes(f); if (c != null) return c; const m = f.match(/^(\d{1,4})\s*(?:m|min|minutos)?$/); return m ? +m[1] : NaN; }
/* dinheiro: 12 · 12,50 · 12.50 · 1.250,00 · € 12 · 12 euros */
function pdMoney(s) {
  const f = fold(pdWords(s, true)).replace(/\s+/g, " ").trim(); if (!f) return null;
  const m = f.match(/^(?:€|r\$|eur)?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(?:€|eur|euros?|reais)?$/); return m ? capNum(m[1]) : NaN;
}
function pdScale(s, k) {
  const f = fold(pdWords(s, true)); let m = f.match(/\b([1-5])\b/); if (m) return +m[1];
  if (k === "humor") for (const [v, rx] of CAP_MOOD) if (rx.test(f)) return v;
  if (k === "energia" || k === "estresse") { if (/\b(muito alt[oa]|altissim[oa]|maxim[oa])\b/.test(f)) return 5; if (/\b(alt[oa]|bastante)\b/.test(f)) return 4; if (/\b(medi[oa]|normal|regular)\b/.test(f)) return 3; if (/\b(muito baix[oa]|nenhum[a]?|zero)\b/.test(f)) return 1; if (/\b(baix[oa]|pouc[oa])\b/.test(f)) return 2; }
  if (/\b(um|uma)\b/.test(f)) return 1;
  return null;
}
/* “dormi 7 e meia” e “dormi 7,5” sem unidade: o leitor da captura precisa do “h” */
const pdNorm = t => t.replace(/\b(\d{1,2})\s+e\s+meia\b/gi, "$1,5").replace(/\b(dormi\s+(?:umas?\s+|cerca de\s+|quase\s+|s[oó]\s+|apenas\s+)?)(\d{1,2}(?:[.,]\d{1,2})?)(?!\d|[.,]\d|\s*(?:h(?:\d|\b)|hs\b|horas?\b|:|e\s+\d))/gi, "$1$2h");
const pdFmt = v => v == null || isNaN(v) ? "" : fmtDec(v);

/* ---------------------------------------------------------------- o que o dia já tem (as abas) */
function pdBase(d = PD.date) {
  const s = S.saude[d] || {};
  return { humor: s.humor ?? null, energia: s.energia ?? null, estresse: s.estresse ?? null, sono: s.sono ?? null, passos: s.passos ?? null, treino: s.treino || "", min: s.min ?? "",
    gastos: S.lanc.filter(l => l.data === d && l.tipo === "Despesa"), sess: jData().sess.filter(x => x.data === d), lz: S.lazer.filter(x => x.data === d), ent: S.diario.filter(e => e.data === d) };
}
/* campos que a pessoa não mexeu acompanham o que as abas têm para o dia */
function pdSyncBase() {
  const B = pdBase();
  for (const k of ["humor", "energia", "estresse", "sono", "passos", "treino", "min"]) if (!PD.src[k] || PD.src[k] === "base") { const b = B[k]; PD.v[k] = b == null || b === "" ? "" : k === "treino" ? b : pdFmt(+b); PD.src[k] = b == null || b === "" ? "" : "base"; }
  for (const h of S.habitos) if (!PD.hsrc[h.id]) delete PD.habs[h.id];
}
const pdHabOn = h => PD.hsrc[h.id] ? !!PD.habs[h.id] : !!S.marks[`${h.id}|${PD.date}`];

/* ---------------------------------------------------------------- validação em tempo real */
function pdCheck() {
  const V = PD.v, f = {}, set = (k, st, msg) => { f[k] = { st, msg }; };
  for (const [k] of PD_SCALES) { const x = V[k]; if (x !== "" && x != null) { const n = +x; if (!(Number.isInteger(n) && n >= 1 && n <= 5)) set(k, "err", "Use um número de 1 a 5"); else set(k, PD.inf.includes(k) ? "warn" : "ok", PD.inf.includes(k) ? "Inferido do texto: confira" : ""); } }
  if (V.sono !== "" && V.sono != null) { const h = pdHours(V.sono); if (h == null || isNaN(h) || !pdHoursOk(V.sono)) set("sono", "err", "Formato inválido. Ex.: 7,5 · 7h30 · 7 e meia"); else if (h < 0 || h > 16) set("sono", "err", "Entre 0 e 16 horas"); else if (h < 4 || h > 12) set("sono", "warn", `${pdFmt(h)} h é incomum: confira`); else set("sono", "ok", /[h:]|meia|min/i.test(V.sono) ? `= ${pdFmt(h)} h` : ""); }
  if (V.passos !== "" && V.passos != null) { const n = pdInt(V.passos); if (n == null || isNaN(n)) set("passos", "err", "Só números. Ex.: 8000 · 8.000 · 8 mil"); else if (n > 100000) set("passos", "err", "Acima de 100 mil: confira"); else if (n > 50000) set("passos", "warn", "Mais de 50 mil passos: confira"); else set("passos", "ok", /\D/.test(V.passos.trim()) ? `= ${num(n, 0)}` : ""); }
  if (V.min !== "" && V.min != null) { const n = pdMin(V.min); if (n == null || isNaN(n) || !Number.isInteger(n)) set("min", "err", "Minutos inteiros. Ex.: 45 · 1h15"); else if (n < 1 || n > 600) set("min", "err", "Entre 1 e 600 minutos"); else if (!V.treino) set("min", "warn", "Sem tipo: vai como “Outro”"); else set("min", "ok", /\D/.test(V.min.trim()) ? `= ${n} min` : ""); }
  if (V.pmin !== "" && V.pmin != null) { const n = pdMin(V.pmin); if (n == null || isNaN(n) || !Number.isInteger(n)) set("pmin", "err", "Minutos inteiros. Ex.: 20"); else if (n < 1 || n > 600) set("pmin", "err", "Entre 1 e 600 minutos"); else set("pmin", "ok", ""); }
  const hasAt = !!String(V.lzat || "").trim(), hasH = V.lzh !== "" && V.lzh != null;
  if (hasH) { const h = pdHours(V.lzh); if (h == null || isNaN(h)) set("lzh", "err", "Formato inválido. Ex.: 2 · 1,5 · 1h30 · 90 min"); else if (h <= 0 || h > 24) set("lzh", "err", "Entre 0 e 24 horas"); else if (!hasAt) set("lzat", "err", "Diga qual foi a atividade"); else set("lzh", "ok", /[h:]|meia|min/i.test(V.lzh) ? `= ${pdFmt(h)} h` : ""); }
  else if (hasAt) set("lzh", "err", "Quantas horas?");
  PD.gastos.forEach((g, i) => { const has = String(g.v || "").trim(), hd = String(g.d || "").trim(); if (!has && !hd) return; if (!has) { set(`g${i}`, "err", "Falta o valor"); return; } const v = pdMoney(g.v); if (v == null || isNaN(v)) set(`g${i}`, "err", "Valor inválido. Ex.: 12,50 · 1.250,00"); else if (v <= 0) set(`g${i}`, "err", "O valor precisa ser maior que zero"); else if (v > 100000) set(`g${i}`, "err", "Valor alto demais para um gasto do dia"); else if (v >= 1000) set(`g${i}`, "warn", `${eur(v, 2)}: valor alto, confira`); else set(`g${i}`, "ok", ""); });
  if (PD.date > TODAY) set("date", "err", "Dia no futuro: o painel registra o que já aconteceu");
  else if (PD.date < addDays(TODAY, -60)) set("date", "warn", "Mais de 60 dias atrás: confira o dia");
  /* soma de horas do dia */
  const hs = (pdHours(V.sono) || 0) + (hasH ? pdHours(V.lzh) || 0 : 0) + ((pdMin(V.min) || 0) + (pdMin(V.pmin) || 0)) / 60;
  if (hs > 24 && !f.sono?.st?.startsWith("e")) set("sono", "warn", `Sono, lazer, treino e prática somam ${num(hs, 1)} h no dia: confira`);
  pdCheck2(set, V);
  /* obrigatórios */
  const filled = { humor: V.humor !== "" && V.humor != null, energia: V.energia !== "" && V.energia != null, estresse: V.estresse !== "" && V.estresse != null, sono: V.sono !== "" && V.sono != null, passos: V.passos !== "" && V.passos != null, treino: !!V.treino,
    gastos: PD.gastos.some(g => String(g.v || "").trim()) || pdBase().gastos.length > 0, habitos: S.habitos.some(pdHabOn), texto: !!PD.text.trim() };
  const missing = pdReq().filter(k => PD_REQ_OPC.includes(k) && !filled[k] && !(k === "habitos" && !S.habitos.length));
  for (const k of missing) if (!f[k]) set(k, "req", "Obrigatório");
  const errs = Object.entries(f).filter(([, x]) => x.st === "err"), warns = Object.entries(f).filter(([, x]) => x.st === "warn");
  return { f, errs, warns, missing, filled: Object.values(filled).filter(Boolean).length };
}

/* ---------------------------------------------------------------- o texto do dia preenche os campos */
const PD_PRAT = [[/\b(meditei|meditacao|medita\w*|respirei|respiracao|atencao plena|mindfulness)\b/, "med"], [/\b(rezei|orei|oracao|prece|evangelho|passe|centro espirita)\b/, "esp"], [/\b(qigong|chi kung|tai chi|zuowang|tao te ching)\b/, "tao"], [/\b(metta|vipassana|budis\w*|sutra|recitei|recitacao)\b/, "bud"]];
function pdParse(o = {}) {
  /* volta ao que as abas têm o que veio do texto antes; o que foi digitado ou falado no campo fica */
  for (const k of PD_KEYS) if (PD.src[k] === "texto") { PD.src[k] = ""; if (k !== "ppid") PD.v[k] = ""; }
  PD.inf = []; PD.gastos = PD.gastos.filter(g => g.src !== "texto"); pdReset2(); pdReset3();
  for (const id of Object.keys(PD.hsrc)) if (PD.hsrc[id] === "texto") { delete PD.hsrc[id]; delete PD.habs[id]; }
  pdSyncBase();
  const txt = pdNorm(pdWords(PD.text)), extras = [];
  if (!txt.trim()) { PD.extras = []; return; }
  if (!PD.dateSrc) { const d = capDate(txt); if (d !== PD.date) { PD.date = d; pdSyncBase(); } }
  const take = (k, val, inf) => { if (PD.src[k] === "mao" || PD.src[k] === "voz") return; PD.v[k] = val; PD.src[k] = "texto"; if (inf) PD.inf.push(k); };
  let lz = false;
  for (const it of capParse(txt)) { const m = it.line.match(/^\/(\p{L}+)\s*(.*)$/u); if (!m) continue; const c = norm(m[1]), a = m[2];
    if (["humor", "energia", "estresse"].includes(c)) take(c, a.trim(), it.inf);
    else if (c === "sono" || c === "passos") take(c, a.trim());
    else if (c === "treino") { const mn = a.match(/(\d{1,3})\s*$/); take("treino", findIn(TREINOS, a.replace(/\d+\s*$/, "").trim()) || "Outro"); if (mn) take("min", mn[1]); }
    else if (c === "gasto") { const mm = a.match(/^([\d.,]+)\s*(.*)$/); if (mm) PD.gastos.push({ id: uid(), v: mm[1], d: mm[2].trim(), cat: "", src: "texto" }); }
    else if (c === "habito") { const h = S.habitos.find(x => norm(x.nome) === norm(a)); if (h && !PD.hsrc[h.id]) { PD.habs[h.id] = true; PD.hsrc[h.id] = "texto"; } }
    else if (c === "lazer") { const mm = a.match(/^([\d.,]+)\s*(.*)$/); if (!mm) continue;
      /* o mesmo lazer já digitado no campo não vira um segundo registro */
      const fld = norm(String(PD.v.lzat || "")), at = norm(mm[2]); if (fld && (at.includes(fld) || fld.includes(at))) continue;
      if (!lz && PD.src.lzat !== "mao" && PD.src.lzh !== "mao" && PD.src.lzat !== "voz") { take("lzh", mm[1]); take("lzat", mm[2]); lz = true; } else extras.push(it.line); }
    else if (pdParse2(c, a, take)) {}
    else extras.push(it.line);
  }
  /* prática da jornada: verbo + minutos no mesmo trecho */
  if (PD.src.pmin !== "mao" && PD.src.pmin !== "voz") for (const { F } of capSplit(txt)) { const hit = PD_PRAT.find(([rx]) => rx.test(F)); if (!hit) continue; const mn = capMinutes(F); if (mn) { take("ppid", hit[1]); take("pmin", String(mn)); break; } }
  pdParse3(txt);
  PD.extras = extras;
}

/* ---------------------------------------------------------------- o que vai ser salvo: uma linha por registro, comparada com o que o dia já tem */
const PD_DEST = { bmExames: ["Jornada › Exame da noite", "jornada.exame"], rotina: ["Rotina", "rotina.dia"], rotinas: ["Casa › Limpeza", "casa.limpeza"], contasCasa: ["Casa › Contas", "casa.contas"], saude: ["Saúde › Check-in", "saude.checkin"], lanc: ["Finanças › Lançamentos", "fin.lanc"], marks: ["Hábitos", "hab.marcar"], jornada: ["Jornada › Práticas", "jornada.praticas"], lazer: ["Lazer", "cresc.lazer"], diario: ["Diário", "diario.feed"], tarefas: ["Tarefas", "metas.tarefas"], contatos: ["Relações › Contatos", "pessoas.contatos"], estudo: ["Crescimento", "cresc.aprend"], aprend: ["Crescimento", "cresc.aprend"], metas: ["Metas", "metas.lista"] };
function pdRows() {
  const d = PD.date, B = pdBase(d), C = pdCheck(), V = PD.v, rows = [], bad = k => C.f[k]?.st === "err";
  const ctx = { date: d, area: "", humor: +V.humor || null };
  const cmd = (id, line, o = {}) => { const r = runCmd(line, ctx); if (!r.ok) return; rows.push({ id, line, txt: r.txt.replace(/ em \d{2}\/\d{2}(\/\d{2,4})?$/, ""), kind: o.kind || "novo", old: o.old ?? "", dest: o.dest, apply: r.apply, on: o.on ?? true }); };
  for (const k of ["humor", "energia", "estresse", "sono", "passos"]) {
    if (bad(k)) continue; const x = V[k], old = B[k], src = PD.src[k];
    const val = x === "" || x == null ? null : k === "sono" ? pdHours(x) : k === "passos" ? pdInt(x) : +x;
    if (val != null && !isNaN(val) && (old == null || Math.abs(+old - val) > 1e-9)) cmd(`s.${k}`, `/${k} ${k === "passos" ? Math.round(val) : fmtDec(val)}`, { kind: old == null ? "novo" : "subst", old: old == null ? "" : k === "sono" ? pdFmt(+old) + " h" : k === "passos" ? num(old, 0) : old + "/5", dest: "saude" });
    else if (val == null && old != null && src === "mao") rows.push({ id: `s.${k}`, txt: `${PD_LBL[k]}: apagar o registro do dia`, kind: "apagar", old: String(old), dest: "saude", on: true, apply: () => { const s = { ...(S.saude[d] || {}) }; delete s[k]; S.saude[d] = s; return ["saude"]; } });
  }
  if (!bad("min")) { const tipo = V.treino, mn = V.min === "" || V.min == null ? "" : pdMin(V.min);
    if (tipo || mn) { const t = tipo || "Outro"; if (t !== B.treino || String(mn) !== String(B.min ?? "")) cmd("s.treino", `/treino ${t}${mn ? " " + mn : ""}`, { kind: B.treino ? "subst" : "novo", old: B.treino ? `${B.treino}${B.min ? " " + B.min + " min" : ""}` : "", dest: "saude" }); }
    else if (B.treino && PD.src.treino === "mao") rows.push({ id: "s.treino", txt: "Treino: apagar o registro do dia", kind: "apagar", old: B.treino, dest: "saude", on: true, apply: () => { const s = { ...(S.saude[d] || {}) }; delete s.treino; delete s.min; S.saude[d] = s; return ["saude"]; } }); }
  PD.gastos.forEach((g, i) => { if (!String(g.v || "").trim() || bad(`g${i}`)) return; const v = pdMoney(g.v), desc = String(g.d || "").trim().replace(/[:@#]/g, " ").trim();
    const tp = g.tipo || "Despesa", cmdn = { Receita: "receita", Aporte: "aporte" }[tp] || "gasto", dup = tp === "Despesa" ? B.gastos.find(l => Math.abs(l.valor - v) < .005 && (!desc || norm(l.desc) === norm(desc) || norm(l.cat) === norm(desc))) : S.lanc.find(l => l.data === d && l.tipo === tp && Math.abs(l.valor - v) < .005);
    const cats = tp === "Receita" ? CAT_REC : tp === "Aporte" ? CAT_APO : Object.keys(CAT_DESP), cat = g.cat && cats.includes(g.cat) ? g.cat : "";
    cmd(`g.${g.id}`, `/${cmdn} ${fmtDec(v)} ${cat ? cat + ": " : ""}${desc || (cat ? "" : tp === "Despesa" ? "Gasto do dia" : tp)}`.trim(), { kind: dup ? "dup" : "novo", old: dup ? `já existe ${eur(dup.valor, 2)} · ${dup.desc}` : "", on: !dup, dest: "lanc" }); });
  for (const h of S.habitos) { const has = !!S.marks[`${h.id}|${d}`]; if (!PD.hsrc[h.id]) continue; const want = !!PD.habs[h.id];
    if (want && !has) cmd(`h.${h.id}`, `/habito ${h.nome}`, { dest: "marks" });
    else if (!want && has) rows.push({ id: `h.${h.id}`, txt: `Hábito: desmarcar ${h.nome}`, kind: "apagar", old: "feito", dest: "marks", on: true, apply: () => { delete S.marks[`${h.id}|${d}`]; return ["marks"]; } }); }
  if (V.pmin !== "" && V.pmin != null && !bad("pmin")) { const p = J_PIL[V.ppid] ? V.ppid : "med", mn = pdMin(V.pmin), dup = B.sess.find(x => x.pid === p && +x.min === mn);
    rows.push({ id: "j.sess", txt: `Prática: ${J_PIL[p].nome} · ${mn} min`, kind: dup ? "dup" : "novo", old: dup ? `já existe ${dup.tec} · ${dup.min} min` : "", dest: "jornada", on: !dup, apply: () => { jData().sess.push({ id: uid(), at: Date.now(), data: d, pid: p, tec: J_TEC[p][0], min: mn, qual: null, antes: null, depois: null, notas: "Painel do dia" }); return ["jornada"]; } }); }
  if (String(V.lzat || "").trim() && V.lzh !== "" && V.lzh != null && !bad("lzh") && !bad("lzat")) { const h = pdHours(V.lzh), at = String(V.lzat).trim(), dup = B.lz.find(x => norm(x.atividade) === norm(at));
    cmd("l.lz", `/lazer ${fmtDec(Math.round(h * 100) / 100)} ${at}`, { kind: dup ? "dup" : "novo", old: dup ? `já existe ${dup.atividade} · ${num(dup.horas, 1)} h` : "", on: !dup, dest: "lazer" }); }
  pdRows2(rows, cmd, B, d, bad);
  (PD.extras || []).forEach((line, i) => { const c = norm(line.slice(1).split(/\s/)[0]), dest = { receita: "lanc", aporte: "lanc", tarefa: "tarefas", contato: "contatos", estudo: "estudo", ler: "aprend", meta: "metas", peso: "saude", lazer: "lazer" }[c] || "diario";
    const arg = norm(line.replace(/^\/\p{L}+\s+/u, "").replace(/^[\d.,]+\s*/, "")), dup = c === "tarefa" ? S.tarefas.some(t => t.status !== "Concluída" && norm(t.tarefa) === norm(line.replace(/^\/tarefa\s+/, "").replace(/\s+at[eé].*$/, "")))
      : c === "lazer" ? B.lz.some(x => norm(x.atividade).includes(arg) || arg.includes(norm(x.atividade))) : c === "estudo" ? S.estudo.some(x => x.data === d && arg.includes(norm(x.item))) : false;
    cmd(`x.${i}.${line}`, line, { kind: dup ? "dup" : "novo", old: dup ? (c === "tarefa" ? "tarefa igual já aberta" : "parece já registrado neste dia") : "", on: !dup && !PD.xoff.includes(line), dest }); });
  if (PD.diario && PD.text.trim()) { const body = capMarkup(PD.text), dup = B.ent.find(e => norm(e.texto).startsWith(norm(body).slice(0, 120)));
    rows.push({ id: "d.ent", txt: `Diário: “${trunc(PD.text.trim().replace(/\s+/g, " "), 90)}”`, kind: dup ? "dup" : "novo", old: dup ? "entrada igual já existe neste dia" : "", dest: "diario", on: !dup, diary: body }); }
  for (const r of rows) if (PD.off.includes(r.id)) r.on = false; else if (PD.on?.includes(r.id)) r.on = true;
  return rows;
}
/* aplica as linhas marcadas de uma vez: um só “desfazer” volta tudo */
function pdSave(rows = pdRows()) {
  const C = pdCheck(); if (C.errs.length || C.missing.length) { toast(C.errs.length ? "Corrija os campos marcados antes de salvar." : `Falta preencher: ${C.missing.map(k => PD_LBL[k]).join(", ")}.`); pdPaint(); return false; }
  const keys = new Set(), done = [], d = PD.date; let ent = null;
  for (const r of rows) { if (!r.on) continue; if (r.diary) { ent = r; continue; } r.apply().forEach(k => keys.add(k)); done.push(r); }
  if (ent) { const hm = +PD.v.humor || S.saude[d]?.humor || null, lines = done.filter(r => r.line).map(r => r.line);
    S.diario.push({ id: uid(), data: d, hora: d === TODAY ? nowHM() : "", titulo: "", texto: ent.diary + (lines.length ? "\n\n" + lines.join("\n") : ""), humor: hm, energia: +PD.v.energia || S.saude[d]?.energia || null, fixado: false, aplicados: lines, criado: Date.now(), editado: Date.now(), origem: "painel" }); keys.add("diario"); done.push(ent); }
  if (!keys.size) { toast("Nada novo para salvar: o dia já tem esses registros."); return false; }
  const dests = [...new Set(done.map(r => r.dest))].filter(k => PD_DEST[k]);
  stopVoice(); PD = { ...pdNew(d), dateSrc: PD.dateSrc, done: { n: done.length, dests, at: Date.now() } }; pdStore();
  touch(...keys, { label: "Painel do dia" }); undoToast(`${plural(done.length, "registro salvo", "registros salvos")} em ${dests.map(k => PD_DEST[k][0].split(" › ")[0]).filter((x, i, a) => a.indexOf(x) === i).join(", ")}`);
  return true;
}

/* ---------------------------------------------------------------- voz */
const VOZ = { sr: null, on: null, interim: "", msg: "", st: "", blocked: "" };
const pdSR = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;
function pdPlat() { const ua = navigator.userAgent || ""; return /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /Mac/i.test(ua) ? "mac" : /Win/i.test(ua) ? "win" : "outro"; }
const PD_DICT = { win: "No Windows, clique no campo e tecle Win + H para ditar.", mac: "No Mac, clique no campo e use a tecla de ditado (ou Fn duas vezes).", ios: "No iPhone ou iPad, toque no campo e no microfone do teclado.", android: "No Android, toque no campo e no microfone do teclado.", outro: "Use o ditado do seu sistema no campo, ou digite." };
const PD_WHY = { nosr: "Este navegador não tem reconhecimento de voz embutido (o Firefox não tem).", iframe: "A janela onde o Atlas está aberto não liberou o microfone para a página.", perm: "O microfone foi negado para esta página.", rede: "O serviço de voz do navegador não respondeu.", mic: "Nenhum microfone encontrado." };
function pdVoiceOk() {
  if (VOZ.blocked) return VOZ.blocked; if (!pdSR()) return "nosr";
  try { const pp = document.permissionsPolicy || document.featurePolicy; if (pp?.allowsFeature && !pp.allowsFeature("microphone")) return "iframe"; } catch {}
  return "";
}
function stopVoice() { const r = VOZ.sr; VOZ.sr = null; VOZ.on = null; VOZ.interim = ""; if (r) try { r.abort(); } catch {} }
const PD_MIC_LBL = { texto: "o dia", humor: "humor", energia: "energia", estresse: "estresse", sono: "sono", passos: "passos", treino: "treino", gasto: "um gasto", prat: "a prática", lazer: "o lazer" };
function pdMic(target) {
  if (VOZ.sr) { const same = VOZ.on === target; stopVoice(); pdVoicePaint(); if (same) return; }
  const why = pdVoiceOk();
  if (why) { pdFallback(target, why); return; }
  let r; try { r = new (pdSR())(); } catch { pdFallback(target, "nosr"); return; }
  r.lang = pdLang(); r.interimResults = true; r.continuous = target === "texto"; r.maxAlternatives = 1;
  Object.assign(VOZ, { sr: r, on: target, interim: "", st: "on", msg: `Ouvindo ${PD_MIC_LBL[target] || ""}… fale naturalmente.` });
  r.onresult = e => { let fin = "", tmp = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) fin += x[0].transcript; else tmp += x[0].transcript; } if (fin.trim()) pdHeard(target, fin.trim()); VOZ.interim = tmp; pdVoicePaint(); };
  r.onerror = e => { const c = e.error; if (c === "aborted") return; if (c === "not-allowed" || c === "service-not-allowed") { VOZ.blocked = "perm"; pdFallback(target, "perm"); return; }
    if (c === "network") { VOZ.blocked = "rede"; pdFallback(target, "rede"); return; } if (c === "audio-capture") { VOZ.blocked = "mic"; pdFallback(target, "mic"); return; }
    Object.assign(VOZ, { st: "warn", msg: c === "no-speech" ? "Não ouvi nada. Toque no microfone e fale de novo." : c === "language-not-supported" ? `O navegador não reconhece ${pdLang()}. Troque o idioma em Ajustar o painel.` : `A voz parou (${c}).` }); pdVoicePaint(); };
  r.onend = () => { if (VOZ.sr !== r) return; VOZ.sr = null; VOZ.on = null; VOZ.interim = ""; if (VOZ.st === "on") { VOZ.st = ""; VOZ.msg = ""; } pdVoicePaint(); };
  try { r.start(); } catch { stopVoice(); pdFallback(target, "perm"); return; }
  pdVoicePaint();
}
function pdFallback(target, why) {
  Object.assign(VOZ, { st: "warn", msg: `${PD_WHY[why] || ""} ${PD_DICT[pdPlat()]}`.trim() });
  pdVoicePaint();
  const id = { texto: "pd_txt", sono: "pd_sono", passos: "pd_passos", treino: "pd_min", prat: "pd_pmin", lazer: "pd_lzat", gasto: null }[target] ?? "pd_txt";
  if (target === "gasto") { pdAddGasto(); return; }
  setTimeout(() => { const el = document.getElementById(id); if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch {} } }, 30);
}
/* o que foi ouvido vai para o campo certo */
function pdHeard(target, said) {
  const set = (k, v) => { PD.v[k] = v; PD.src[k] = "voz"; PD.inf = PD.inf.filter(x => x !== k); };
  let ok = true;
  if (target === "texto") { PD.text = (PD.text.trim() ? PD.text.trim() + (/[.!?]$/.test(PD.text.trim()) ? " " : ". ") : "") + said.charAt(0).toUpperCase() + said.slice(1); pdParse(); const t = $("#pd_txt"); if (t) t.value = PD.text; }
  else if (target === "humor" || target === "energia" || target === "estresse") { const n = pdScale(said, target); if (n) set(target, String(n)); else ok = false; }
  else if (target === "sono") { const h = pdHours(said); if (h != null && !isNaN(h)) set("sono", pdFmt(Math.round(h * 4) / 4)); else ok = false; }
  else if (target === "passos") { const n = pdInt(said); if (n != null && !isNaN(n)) set("passos", String(n)); else ok = false; }
  else if (target === "treino") { const F = fold(pdWords(said, true)), hit = CAP_TREINO.find(([rx]) => rx.test(F)), tipo = (hit && findIn(TREINOS, hit[1])) || findIn(TREINOS, F.replace(/\d+.*$/, "").trim()), mn = capMinutes(F) ?? (F.match(/\b(\d{1,3})\b/) || [])[1];
    if (tipo) set("treino", tipo); if (mn) set("min", String(mn)); ok = !!(tipo || mn); }
  else if (target === "gasto") { const F = pdWords(said, true), m = fold(F).match(new RegExp(AMT)); if (m && capNum(m[1])) { const desc = capClean((F.slice(0, m.index) + " " + F.slice(m.index + m[0].length)).replace(/\b(gastei|paguei|custou|de|com)\b/gi, " ")); PD.gastos = PD.gastos.filter(g => String(g.v || "").trim() || String(g.d || "").trim()); PD.gastos.push({ id: uid(), v: fmtDec(capNum(m[1])), d: desc, cat: "", src: "voz" }); } else ok = false; }
  else if (target === "prat") { const F = fold(pdWords(said, true)), hit = PD_PRAT.find(([rx]) => rx.test(F)), mn = capMinutes(F) ?? (F.match(/\b(\d{1,3})\b/) || [])[1]; if (hit) set("ppid", hit[1]); if (mn) set("pmin", String(mn)); ok = !!mn; }
  else if (target === "lazer") { const F = pdWords(said, true), h = F.match(/(\d+(?:[.,]\d+)?)\s*(h|horas?|min|minutos)\b/i), at = capClean(F.replace(h?.[0] || "", "").replace(/\b(fui|ao|a|no|na|por|durante|de)\b/gi, " ")); if (h) set("lzh", /^m/i.test(h[2]) ? pdFmt(capNum(h[1]) / 60) : h[1]); if (at) set("lzat", at[0].toUpperCase() + at.slice(1)); ok = !!(h || at); }
  Object.assign(VOZ, ok ? { st: "ok", msg: `Ouvi: “${said}”` } : { st: "warn", msg: `Ouvi “${said}”, mas não achei ${target === "gasto" ? "um valor" : "um número"} para ${PD_MIC_LBL[target] || "o campo"}. Tente de novo ou digite.` });
  pdStore(); pdPaint();
}
function pdVoicePaint() {
  const el = $("#pd_vbar"); if (el) { el.className = `pdvbar ${VOZ.st || ""}`; el.innerHTML = pdVbarHTML(); }
  for (const b of $$("[data-pdmic]")) { const on = VOZ.on === b.dataset.pdmic; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }
}
const pdVbarHTML = () => VOZ.msg || VOZ.interim ? `${ic(VOZ.st === "warn" ? "info" : "mic")}<span>${esc(VOZ.msg)}${VOZ.interim ? ` <i>“${esc(VOZ.interim)}”</i>` : ""}</span>${VOZ.sr ? `<button type="button" class="btn sm" data-act="pdstop">${ic("stop")}Parar</button>` : ""}` : "";

/* ---------------------------------------------------------------- tela */
const pdMicBtn = (t, lbl) => `<button type="button" class="pdmic${VOZ.on === t ? " on" : ""}" data-pdmic="${t}" aria-pressed="${VOZ.on === t}" aria-label="Ditar ${lbl}" title="Ditar ${lbl}">${ic("mic")}</button>`;
function pdMsg(C, k) { const x = C.f[k]; return `<small class="pdmsg${x ? " " + x.st : ""}" id="pdm_${k}" aria-live="polite">${x?.msg ? esc(x.msg) : ""}</small>`; }
const pdSt = (C, k) => C.f[k]?.st || "";
const pdSrcTag = k => ({ texto: "do texto", voz: "por voz", base: "já salvo" }[PD.src[k]] ? `<em class="pdsrc s-${PD.src[k]}">${{ texto: "do texto", voz: "por voz", base: "já salvo" }[PD.src[k]]}</em>` : "");
const pdReqMark = k => pdReq().includes(k) ? `<b class="pdreq" title="Obrigatório">*</b>` : "";
function pdField(C, k, lbl, input, mic, extra = "") { return `<div class="pdf ${pdSt(C, k)}" data-pdbox="${k}"><div class="pdfl"><label for="pd_${k}">${lbl}${pdReqMark(k)}</label>${pdSrcTag(k)}</div><div class="pdfi">${input}${mic || ""}</div>${pdMsg(C, k)}${extra}</div>`; }
const pdIn = (k, ph, mode = "decimal") => `<input type="text" id="pd_${k}" data-pdf="${k}" inputmode="${mode}" autocomplete="off" value="${esc(PD.v[k] ?? "")}" placeholder="${ph}" aria-describedby="pdm_${k}"${pdSt(pdCheck(), k) === "err" ? ' aria-invalid="true"' : ""}>`;
function pPainel() {
  if (PD.step !== "rev") pdSyncBase();
  const C = pdCheck(), B = pdBase(), V = PD.v, d = PD.date, why = pdVoiceOk(), rev = PD.step === "rev";
  const done = PD.done && Date.now() - PD.done.at < 10 * 60 * 1000 ? `<div class="pn pddone">${ic("check")}<div><b>${plural(PD.done.n, "registro salvo", "registros salvos")}.</b><span>Já aparecem em: ${PD.done.dests.map(k => `<a class="lnk" href="#${PD_DEST[k][1]}">${PD_DEST[k][0]}</a>`).join(" · ")}</span></div><button type="button" class="iconbtn" data-act="pddone" aria-label="Fechar aviso">${ic("x")}</button></div>` : "";
  if (rev) return done + pdReviewHTML();
  const scale = k => { const inv = k === "estresse"; return `<div class="pdf pds ${pdSt(C, k)}" data-pdbox="${k}"><div class="pdfl"><span class="pdlab">${PD_LBL[k]}${pdReqMark(k)}</span>${pdSrcTag(k)}</div><div class="pdfi"><div class="mchips" role="group" aria-label="${PD_LBL[k]} de 1 a 5">${[1, 2, 3, 4, 5].map(v => `<button type="button" class="mchip m${inv ? 6 - v : v}" data-pdsc="${k}|${v}" aria-pressed="${String(V[k]) === String(v)}">${v}</button>`).join("")}</div>${pdMicBtn(k, PD_LBL[k].toLowerCase())}</div>${pdMsg(C, k)}</div>`; };
  const gl = PD.gastos.length ? PD.gastos : [];
  const gastos = gl.map((g, i) => `<div class="pdg ${pdSt(C, `g${i}`)}"><select id="pd_gt${i}" data-pdg="${i}|tipo" class="pdgt" aria-label="Tipo ${i + 1}">${["Despesa", "Receita", "Aporte"].map(x => `<option${(g.tipo || "Despesa") === x ? " selected" : ""}>${x}</option>`).join("")}</select><input type="text" id="pd_gv${i}" data-pdg="${i}|v" inputmode="decimal" autocomplete="off" value="${esc(g.v)}" placeholder="12,50" aria-label="Valor do gasto ${i + 1}" aria-describedby="pdm_g${i}"${pdSt(C, `g${i}`) === "err" ? ' aria-invalid="true"' : ""}><input type="text" id="pd_gd${i}" data-pdg="${i}|d" autocomplete="off" value="${esc(g.d)}" placeholder="almoço, mercado…" aria-label="Descrição do gasto ${i + 1}"><select id="pd_gc${i}" data-pdg="${i}|cat" aria-label="Categoria do gasto ${i + 1}"><option value="">${esc((g.tipo || "Despesa") === "Despesa" && autoCat(g.d) ? "auto: " + autoCat(g.d) : "auto")}</option>${(g.tipo === "Receita" ? CAT_REC : g.tipo === "Aporte" ? CAT_APO : Object.keys(CAT_DESP)).map(c => `<option${g.cat === c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select><button type="button" class="vb" data-pdgdel="${i}" aria-label="Remover gasto ${i + 1}">${ic("x")}</button>${pdMsg(C, `g${i}`)}</div>`).join("");
  const habs = S.habitos.map(h => { const on = pdHabOn(h); return `<button type="button" class="hbtn pdh${on ? " on" : ""}" data-pdhab="${h.id}" aria-pressed="${on}" style="--c:${acol(h.area)}"><span class="hck">${ic("check")}</span><span class="hn">${esc(h.nome)}${PD.hsrc[h.id] === "texto" ? "<small>do texto</small>" : ""}</span></button>`; }).join("");
  const rows = pdRows(), on = rows.filter(r => r.on), nSub = on.filter(r => r.kind === "subst" || r.kind === "apagar").length;
  const block = C.errs.length || C.missing.length;
  const sess = B.sess.length ? `<small class="pdhint">Já neste dia: ${B.sess.map(x => `${esc(J_PIL[x.pid]?.nome || x.pid)} ${x.min} min`).join(", ")}</small>` : "";
  const lzs = B.lz.length ? `<small class="pdhint">Já neste dia: ${B.lz.map(x => `${esc(x.atividade)} ${num(x.horas, 1)} h`).join(", ")}</small>` : "";
  return `${done}<div class="pd">
    ${pdRoteiroHTML()}
    <section class="pn pdtxt" aria-label="Conte o dia">
      <div class="pdday ${pdSt(C, "date")}"><label class="pdd">Dia<input type="date" id="pd_date" value="${d}" max="${TODAY}"></label><div class="seg-g" role="group" aria-label="Atalhos de dia"><button type="button" class="seg" data-pdday="${TODAY}" aria-pressed="${d === TODAY}">Hoje</button><button type="button" class="seg" data-pdday="${addDays(TODAY, -1)}" aria-pressed="${d === addDays(TODAY, -1)}">Ontem</button></div>${pdMsg(C, "date")}
        <span class="pdvst ${why ? "off" : ""}" title="${esc(why ? PD_WHY[why] + " " + PD_DICT[pdPlat()] : "Voz pelo navegador, em " + pdLang())}">${ic("mic")}${why ? "voz pelo ditado do sistema" : "voz pronta · " + pdLang()}</span></div>
      <div class="pdbig"><textarea id="pd_txt" class="captxt" rows="3" placeholder="Fale ou escreva o dia. Ex.: dormi 7 e meia, humor 4, corri 30 min, gastei 18 euros no almoço, meditei 15 min" aria-label="Conte o dia">${esc(PD.text)}</textarea><button type="button" class="pdmicbig${VOZ.on === "texto" ? " on" : ""}" data-pdmic="texto" aria-pressed="${VOZ.on === "texto"}" aria-label="Falar o dia">${ic("mic")}<span>${VOZ.on === "texto" ? "Parar" : "Falar"}</span></button></div>
      <div id="pd_vbar" class="pdvbar ${VOZ.st || ""}" role="status" aria-live="polite">${pdVbarHTML()}</div>
      <p class="muted small">O texto preenche os campos abaixo. O que você digitar ou falar num campo prevalece sobre o texto.</p>
    </section>
    <section class="pn pdform" aria-label="Campos do dia">
      ${pdMapa(rows)}
      <div class="pdrow3" id="sec_saude">${scale("humor")}${scale("energia")}${scale("estresse")}</div>
      <div class="pdrow3">
        ${pdField(C, "sono", "Sono (h)", pdIn("sono", "7,5 · 7h30"), pdMicBtn("sono", "sono"))}
        ${pdField(C, "passos", "Passos", pdIn("passos", "8000", "numeric"), pdMicBtn("passos", "passos"))}
        <div class="pdf ${pdSt(C, "min") || pdSt(C, "treino")}" data-pdbox="min"><div class="pdfl"><label for="pd_treino">Treino${pdReqMark("treino")}</label>${pdSrcTag("treino")}</div><div class="pdfi pdtr"><select id="pd_treino" data-pdf="treino" aria-label="Tipo de treino"><option value="">—</option>${TREINOS.map(t => `<option${V.treino === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</select><input type="text" id="pd_min" data-pdf="min" inputmode="numeric" autocomplete="off" value="${esc(V.min ?? "")}" placeholder="min" aria-label="Minutos de treino" aria-describedby="pdm_min"${pdSt(C, "min") === "err" ? ' aria-invalid="true"' : ""}>${pdMicBtn("treino", "treino")}</div>${pdMsg(C, "min")}${C.f.treino ? pdMsg(C, "treino") : ""}</div>
      </div>
      <div class="pdblk ${pdSt(C, "gastos")}" data-pdbox="gastos" id="sec_din"><div class="pdfl"><span class="pdlab">${ic("coins")}Dinheiro: gastos, receitas e aportes${pdReqMark("gastos")}</span>${B.gastos.length ? `<small class="pdhint">Já neste dia: ${plural(B.gastos.length, "gasto", "gastos")}, ${eur(sum(B.gastos.map(l => l.valor)), 2)}</small>` : ""}</div>
        <div class="pdgs">${gastos}</div><div class="row wrap"><button type="button" class="btn sm" data-act="pdgadd">${ic("plus")}Gasto</button><button type="button" class="btn sm ghost${VOZ.on === "gasto" ? " on" : ""}" data-pdmic="gasto" aria-pressed="${VOZ.on === "gasto"}">${ic("mic")}Ditar gasto</button></div>${pdMsg(C, "gastos")}</div>
      <div class="pdblk ${pdSt(C, "habitos")}" data-pdbox="habitos" id="sec_hab"><div class="pdfl"><span class="pdlab">${ic("repeat")}Hábitos${pdReqMark("habitos")}</span><small class="pdhint">${S.habitos.filter(pdHabOn).length} de ${S.habitos.length}</small></div>${habs ? `<div class="pdhabs">${habs}</div>` : `<div class="empty">Crie hábitos em <a class="lnk" href="#hab.marcar">Hábitos</a>.</div>`}${pdMsg(C, "habitos")}</div>
      <div class="pdrow2" id="sec_jor">
        <div class="pdf ${pdSt(C, "pmin")}" data-pdbox="pmin"><div class="pdfl"><label for="pd_pmin">${ic("lotus")}Prática da jornada</label>${pdSrcTag("pmin")}</div><div class="pdfi pdtr"><select id="pd_ppid" data-pdf="ppid" aria-label="Pilar">${J_ORDER.map(p => `<option value="${p}"${V.ppid === p ? " selected" : ""}>${esc(J_PIL[p].nome)}</option>`).join("")}</select><input type="text" id="pd_pmin" data-pdf="pmin" inputmode="numeric" autocomplete="off" value="${esc(V.pmin ?? "")}" placeholder="min" aria-label="Minutos de prática" aria-describedby="pdm_pmin"${pdSt(C, "pmin") === "err" ? ' aria-invalid="true"' : ""}>${pdMicBtn("prat", "a prática")}</div>${pdMsg(C, "pmin")}${sess}</div>
        <div class="pdf ${pdSt(C, "lzh") || pdSt(C, "lzat")}" data-pdbox="lzh"><div class="pdfl"><label for="pd_lzat">${ic("palette")}Lazer</label>${pdSrcTag("lzat")}</div><div class="pdfi pdtr"><input type="text" id="pd_lzat" data-pdf="lzat" autocomplete="off" value="${esc(V.lzat ?? "")}" placeholder="cinema, leitura…" aria-label="Atividade de lazer" aria-describedby="pdm_lzat"${pdSt(C, "lzat") === "err" ? ' aria-invalid="true"' : ""}><input type="text" id="pd_lzh" data-pdf="lzh" inputmode="decimal" autocomplete="off" value="${esc(V.lzh ?? "")}" placeholder="h" aria-label="Horas de lazer" aria-describedby="pdm_lzh"${pdSt(C, "lzh") === "err" ? ' aria-invalid="true"' : ""}>${pdMicBtn("lazer", "o lazer")}</div>${pdMsg(C, "lzat")}${pdMsg(C, "lzh")}${lzs}</div>
      </div>
      ${pdMoreHTML(C)}
      <div class="pdblk" id="sec_dia"><label class="chk"><input type="checkbox" id="pd_diario"${PD.diario ? " checked" : ""}> ${ic("pen")}Guardar o texto do dia no Diário${pdReqMark("texto")}</label>${C.f.texto ? pdMsg(C, "texto") : ""}
        ${(PD.extras || []).length ? `<div class="flbl">Outros registros achados no texto</div><div class="pdx">${PD.extras.map(line => { const r = runCmd(line, { date: d, area: "", humor: null }); return `<label class="chk"><input type="checkbox" data-pdx="${esc(line)}"${PD.xoff.includes(line) ? "" : " checked"}${r.ok ? "" : " disabled"}> ${esc(r.ok ? r.txt.replace(/ em \d{2}\/\d{2}(\/\d{2,4})?$/, "") : line + " · " + r.err)}</label>`; }).join("")}</div>` : ""}</div>
    </section>
    <footer class="pdfoot" id="pd_foot">${pdFootHTML(C, on, nSub, block)}</footer>
    <details class="pn pdcfg"><summary>${ic("sliders")}Ajustar o painel</summary>
      <div class="flbl">Campos obrigatórios</div><div class="pdreqs">${PD_REQ_OPC.map(k => `<label class="chk"><input type="checkbox" data-pdreq="${k}"${pdReq().includes(k) ? " checked" : ""}> ${PD_LBL[k]}</label>`).join("")}</div>
      <div class="form f3"><label>Idioma da voz<select id="pd_lang">${[["pt-BR", "Português (Brasil)"], ["pt-PT", "Português (Portugal)"]].map(([v, l]) => `<option value="${v}"${pdLang() === v ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>
      <label class="chk"><input type="checkbox" id="pd_rev"${pdRev() ? " checked" : ""}> Revisar antes de salvar (desligado: salva direto, sem as linhas marcadas como repetidas)</label>
      <p class="muted small">Voz: ${why ? esc(PD_WHY[why]) + " " + esc(PD_DICT[pdPlat()]) : "o navegador transcreve a fala; no Chrome o áudio passa pelo serviço de voz do Google, no Safari pelo da Apple."} O Atlas só recebe o texto.</p>
    </details>
  </div>`;
}
function pdFootHTML(C, on, nSub, block) {
  return `<div class="pdinfo">${pdFootInfo(C, on, nSub)}</div><div class="row"><button type="button" class="btn sm ghost" data-act="pdclear"${pdEmpty() ? " disabled" : ""}>Limpar</button><button type="button" class="btn primary" data-act="${pdRev() ? "pdrev" : "pdsave"}"${block || !on.length ? " disabled" : ""}>${ic("check")}${pdRev() ? "Revisar e salvar" : "Salvar"}</button></div>`;
}
function pdFootInfo(C, on, nSub) {
  return C.errs.length ? `<span class="st-crit">${ic("info")}${plural(C.errs.length, "campo com erro", "campos com erro")}: ${C.errs.map(([k]) => esc(PD_LBL[k] || (k.startsWith("g") ? "gasto" : k === "date" ? "dia" : k))).join(", ")}</span>`
    : C.missing.length ? `<span class="st-warn">${ic("info")}Falta: ${C.missing.map(k => PD_LBL[k]).join(", ")}</span>`
    : on.length ? `<span>${plural(on.length, "registro", "registros")} para ${fmtD(PD.date)}${nSub ? ` · ${plural(nSub, "altera o que já existia", "alteram o que já existia")}` : ""}${C.warns.length ? ` · <span class="st-warn">${plural(C.warns.length, "aviso", "avisos")}</span>` : ""}</span>` : `<span class="muted">Nada novo ainda para ${fmtD(PD.date)}</span>`;
}
const PD_KIND = { novo: ["Novo", ""], subst: ["Substitui", "warn"], apagar: ["Apaga", "crit"], dup: ["Repetido?", "warn"] };
function pdReviewHTML() {
  const rows = pdRows(), n = rows.filter(r => r.on).length, C = pdCheck();
  const groups = Object.keys(PD_DEST).map(k => [k, rows.filter(r => r.dest === k)]).filter(([, rs]) => rs.length);
  return `<section class="pn pdrev" aria-label="Revisar">
    <div class="pdrevh"><div><h3>${ic("checksq")}Revise o que vai para as abas</h3><p class="muted small">${fmtDL(PD.date)} · marque o que deve ser salvo. Linhas “Substitui” trocam o valor que o dia já tinha; “Repetido?” parecem já registradas e vêm desmarcadas.</p></div></div>
    ${C.warns.length ? `<div class="note st-warn">${ic("info")}<span>${C.warns.map(([k, x]) => `${esc(PD_LBL[k] || k)}: ${esc(x.msg)}`).join(" · ")}</span></div>` : ""}
    ${groups.map(([k, rs]) => `<div class="pdgrp"><div class="flbl">${esc(PD_DEST[k][0])}</div>${rs.map(r => `<label class="pdr k-${r.kind}${r.on ? " on" : ""}"><input type="checkbox" data-pdrow="${esc(r.id)}"${r.on ? " checked" : ""}><span class="pdk ${PD_KIND[r.kind][1]}">${PD_KIND[r.kind][0]}</span><b>${esc(r.txt)}</b>${r.old ? `<small>${r.kind === "subst" ? "antes: " : ""}${esc(r.old)}</small>` : ""}</label>`).join("")}</div>`).join("") || `<div class="empty">Nada novo para salvar.</div>`}
    <div class="pdfoot"><div class="pdinfo"><span>${plural(n, "registro marcado", "registros marcados")}</span></div><div class="row"><button type="button" class="btn sm" data-act="pdback">${ic("back")}Voltar e editar</button><button type="button" class="btn primary" data-act="pdsave"${n ? "" : " disabled"}>${ic("check")}Confirmar e salvar</button></div></div>
  </section>`;
}
/* atualiza só o que muda enquanto a pessoa digita: sem redesenhar a página, o cursor não pula */
function pdPaint() {
  if (PAGE !== "painel") return;
  const ae = document.activeElement;
  if (PD.step === "rev" || !$("#pd_foot")) { render(); return; }
  const C = pdCheck();
  for (const box of $$("[data-pdbox]")) { const k = box.dataset.pdbox, st = k === "min" ? pdSt(C, "min") || pdSt(C, "treino") : k === "lzh" ? pdSt(C, "lzh") || pdSt(C, "lzat") : pdSt(C, k); box.classList.remove("ok", "err", "warn", "req"); if (st) box.classList.add(st); }
  for (const m of $$(".pdmsg[id^=pdm_]")) { const k = m.id.slice(4), x = C.f[k]; m.className = `pdmsg${x ? " " + x.st : ""}`; m.textContent = x?.msg || ""; }
  for (const el of $$("[data-pdf],[data-pdg]")) { const k = el.dataset.pdf || `g${el.dataset.pdg.split("|")[0]}`; if (el.dataset.pdg && !el.dataset.pdg.endsWith("|v")) continue; el.toggleAttribute("aria-invalid", C.f[k]?.st === "err"); if (el.dataset.pdf && el !== ae && el.tagName !== "SELECT" && el.value !== String(PD.v[el.dataset.pdf] ?? "")) el.value = PD.v[el.dataset.pdf] ?? ""; if (el.tagName === "SELECT" && el.dataset.pdf && el.value !== String(PD.v[el.dataset.pdf] ?? "")) el.value = PD.v[el.dataset.pdf] ?? ""; }
  for (const b of $$("[data-pdsc]")) { const [k, v] = b.dataset.pdsc.split("|"); b.setAttribute("aria-pressed", String(PD.v[k]) === v); }
  for (const b of $$("[data-pdhab]")) { const h = S.habitos.find(x => x.id === b.dataset.pdhab); if (h) { const on = pdHabOn(h); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); } }
  const dd = $("#pd_date"); if (dd && dd !== ae && dd.value !== PD.date) { render(); return; }
  /* a lista de gastos e os registros extras mudam de tamanho: redesenha a página quando a estrutura mudou */
  if ($$(".pdg").length !== PD.gastos.length || $$("[data-pdx]").length !== (PD.extras || []).length || $$(".pdlr").length !== pdLtotal()) { render(); return; }
  PD.gastos.forEach((g, i) => { for (const f of ["v", "d"]) { const el = document.getElementById(`pd_g${f}${i}`); if (el && el !== ae && el.value !== g[f]) el.value = g[f]; } });
  for (const s of $$(".pdsrc")) s.remove();
  for (const box of $$("[data-pdbox]")) { const k = { min: "treino", lzh: "lzat" }[box.dataset.pdbox] || box.dataset.pdbox, tag = pdSrcTag(k === "pmin" ? "pmin" : k); if (tag) box.querySelector(".pdfl")?.insertAdjacentHTML("beforeend", tag); }
  /* o rodapé muda por dentro: trocar os botões no meio de um clique (o campo perde o foco e valida) faria o clique se perder */
  const rows = pdRows(), on = rows.filter(r => r.on), foot = $("#pd_foot"), mp = $(".pdmapa"), mh = pdMapa(rows); if (mp && mp.outerHTML !== mh) mp.outerHTML = mh;
  foot.querySelector(".pdinfo").innerHTML = pdFootInfo(C, on, on.filter(r => r.kind === "subst" || r.kind === "apagar").length);
  const go = foot.querySelector('[data-act="pdrev"],[data-act="pdsave"]'), cl = foot.querySelector('[data-act="pdclear"]');
  if (go) go.disabled = !!(C.errs.length || C.missing.length) || !on.length; if (cl && !cl.dataset.c) cl.disabled = pdEmpty();
  pdRotPaint();
}
function pdAddGasto() { PD.gastos.push({ id: uid(), v: "", d: "", cat: "", src: "mao" }); pdStore(); render(); setTimeout(() => document.getElementById(`pd_gv${PD.gastos.length - 1}`)?.focus(), 30); }
const pdParseDeb = debounce(() => { pdParse(); pdStore(); pdPaint(); }, 250);

/* ---------------------------------------------------------------- eventos */
function pdInput(t) {
  if (pd2Input(t)) return true;
  if (t.id === "pd_txt") { PD.text = t.value; pdParseDeb(); return true; }
  if (t.dataset.pdf) { const k = t.dataset.pdf; PD.v[k] = t.value; PD.src[k] = "mao"; PD.inf = PD.inf.filter(x => x !== k); pdStore(); pdPaint(); return true; }
  if (t.dataset.pdg) { const [i, f] = t.dataset.pdg.split("|"), g = PD.gastos[+i]; if (g) { g[f] = t.value; g.src = "mao"; } pdStore(); if (f !== "cat") pdPaint(); return true; }
  return false;
}
function pdChange(t) {
  if (pd2Change(t)) return true;
  if (t.id === "pd_date") { PD.date = t.value || TODAY; PD.dateSrc = "mao"; PD.off = []; pdSyncBase(); pdStore(); render(); return true; }
  if (t.dataset.pdf && t.tagName === "SELECT") { PD.v[t.dataset.pdf] = t.value; PD.src[t.dataset.pdf] = "mao"; pdStore(); pdPaint(); return true; }
  if (t.dataset.pdg) { if (t.tagName === "SELECT") { const [i, f] = t.dataset.pdg.split("|"), g = PD.gastos[+i]; if (g) { g[f] = t.value; if (f === "tipo") { g.cat = ""; g.src = "mao"; } } pdStore(); f === "tipo" ? render() : pdPaint(); } return true; }
  if (t.dataset.pdf || t.id === "pd_txt") return true;
  if (t.id === "pd_diario") { PD.diario = t.checked; pdStore(); pdPaint(); return true; }
  if (t.id === "pd_lang") { S.cfg.pdLang = t.value; stopVoice(); touch("cfg", { label: "Idioma da voz", noUndo: true }); return true; }
  if (t.id === "pd_rev") { S.cfg.pdRev = t.checked; touch("cfg", { label: "Revisão do painel", noUndo: true }); return true; }
  if (t.dataset.pdreq) { const set = new Set(pdReq()); t.checked ? set.add(t.dataset.pdreq) : set.delete(t.dataset.pdreq); S.cfg.pdReq = PD_REQ_OPC.filter(k => set.has(k)); touch("cfg", { label: "Campos obrigatórios", noUndo: true }); return true; }
  return false;
}
function pdClick(t) {
  const ds = t.dataset, a = ds.act;
  if (pd2Click(t)) return true;
  if (ds.pdmic) { pdMic(ds.pdmic); return true; }
  if (a === "pdstop") { stopVoice(); VOZ.st = ""; VOZ.msg = ""; pdVoicePaint(); return true; }
  if (ds.pdsc) { const [k, v] = ds.pdsc.split("|"); PD.v[k] = String(PD.v[k]) === v ? "" : v; PD.src[k] = "mao"; PD.inf = PD.inf.filter(x => x !== k); pdStore(); pdPaint(); return true; }
  if (ds.pdhab) { const h = S.habitos.find(x => x.id === ds.pdhab); if (h) { const cur = pdHabOn(h); PD.habs[h.id] = !cur; PD.hsrc[h.id] = "mao"; if (PD.habs[h.id] === !!S.marks[`${h.id}|${PD.date}`]) { delete PD.habs[h.id]; delete PD.hsrc[h.id]; } } pdStore(); pdPaint(); return true; }
  if (ds.pdday) { PD.date = ds.pdday; PD.dateSrc = "mao"; PD.off = []; pdSyncBase(); pdStore(); render(); return true; }
  if (ds.pdgdel != null) { PD.gastos.splice(+ds.pdgdel, 1); pdStore(); render(); return true; }
  if (ds.pdx != null) { const l = ds.pdx; PD.xoff = t.checked ? PD.xoff.filter(x => x !== l) : [...new Set([...PD.xoff, l])]; pdStore(); pdPaint(); return true; }
  if (ds.pdrow != null) { const id = ds.pdrow; PD.off = PD.off.filter(x => x !== id); PD.on = (PD.on || []).filter(x => x !== id); if (t.checked) PD.on.push(id); else PD.off.push(id); t.closest(".pdr")?.classList.toggle("on", t.checked); const n = $$("[data-pdrow]").filter(x => x.checked).length, b = $('[data-act="pdsave"]'); if (b) b.disabled = !n; const s = $(".pdrev .pdinfo span"); if (s) s.textContent = plural(n, "registro marcado", "registros marcados"); return true; }
  if (a === "pdgadd") { pdAddGasto(); return true; }
  if (a === "pdrev") { const C = pdCheck(); if (C.errs.length || C.missing.length) { pdPaint(); toast("Corrija os campos marcados antes de revisar."); return true; } stopVoice(); PD.step = "rev"; PD.on = []; render(); window.scrollTo({ top: 0 }); return true; }
  if (a === "pdback") { PD.step = "form"; render(); return true; }
  if (a === "pdsave") { if (pdSave()) window.scrollTo({ top: 0 }); return true; }
  if (a === "pddone") { PD.done = null; render(); return true; }
  if (a === "pdclear") { if (!ds.c) { t.dataset.c = 1; t.textContent = "Limpar tudo?"; setTimeout(() => { if (t.isConnected) { delete t.dataset.c; t.textContent = "Limpar"; } }, 3000); return true; } stopVoice(); PD = pdNew(PD.date); VOZ.msg = ""; VOZ.st = ""; pdStore(); render(); toast("Painel limpo. Nada foi apagado das abas."); return true; }
  return false;
}
