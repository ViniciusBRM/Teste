/* ================================================================ lembretes com data e hora: um só modelo para o Secretário, a Rotina e o calendário
   S.secretario.lembretes = [{ id, texto, quando: "AAAA-MM-DDTHH:MM" (a primeira vez), rep: "" | diario | uteis | semanal | mensal | anual,
   min (avisa N min antes), feito / avisado (sem repetição), feitos / avisados { dia: 1 } e exc [dias pulados] (com repetição), at, origem,
   gcal { on, id, sig, at } }]. Aparecem na hora exata na grade da Rotina (Dia e Semana), no Mês, no minicalendário, nos Próximos 7 dias
   do Hoje e no Agora do Secretário. O formulário é o mesmo no Secretário, no painel da Rotina e no cartão: lê a frase (“dentista 25/10
   às 15h”) e preenche Data e Hora enquanto se escreve, para conferir antes de salvar; o que estiver nos campos é o que vale.
   Com “Também no Google Agenda”, vira evento com aviso no Google (toca no celular com o Atlas fechado). O id de cada evento criado fica
   também em S.integ.lemGc { idDoLembrete: { e: idDoEvento, d: dia } }: se o lembrete some (apagado ou desfeito), o evento sai do Google. */
const LEM_REP = { "": "Não repete", diario: "Todo dia", uteis: "Dias úteis (seg–sex)", semanal: "Toda semana", mensal: "Todo mês", anual: "Todo ano" };
const LEM_MIN = [0, 5, 10, 15, 30, 60, 120, 1440];
const lemMinTxt = m => +m >= 1440 ? "1 dia antes" : +m >= 60 ? `${+m / 60} h antes` : +m ? `${+m} min antes` : "na hora";
const lemList = () => secData().lembretes;
const lemDia = l => { const d = String(l?.quando || "").slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : ""; };
const lemHM = l => { const h = String(l?.quando || "").slice(11, 16); return /^\d{2}:\d{2}$/.test(h) ? h : ""; };
const LEM = { tipo: "data", draft: {}, ed: "", novo: false };   // tipo do formulário no painel da Rotina; rascunhos; edição no Secretário

/* ---------------------------------------------------------------- quando acontece */
function lemNoDia(l, d) {
  const d0 = lemDia(l); if (!d0 || !d || d < d0) return false;
  if (!l.rep) return d === d0;
  if ((l.exc || []).includes(d)) return false;
  const x = parse(d), x0 = parse(d0), w = x.getDay();
  if (l.rep === "diario") return true;
  if (l.rep === "uteis") return w >= 1 && w <= 5;
  if (l.rep === "semanal") return w === x0.getDay();
  if (l.rep === "mensal") return x.getDate() === x0.getDate();   // dia 31 pula os meses que não têm 31, como no Google
  if (l.rep === "anual") return evNoDia({ data: d0, rep: "anual" }, d);
  return false;
}
const lemFeito = (l, d) => l.rep ? !!(l.feitos || {})[d] : !!l.feito;
const lemT = (d, hm) => new Date(`${d}T${hm}:00`);
/* ocorrências de um dia, para a grade, o mês e o Hoje */
function lemDoDia(d) {
  const out = [];
  for (const l of lemList()) { const hm = lemHM(l); if (hm && lemNoDia(l, d)) out.push({ id: l.id, l, texto: l.texto, hm, a: hm2min(hm), d, feito: lemFeito(l, d) }); }
  return out.sort((p, q) => p.a - q.a);
}
/* próxima ocorrência ainda não feita (a de hoje conta, mesmo se a hora passou) */
function lemProx(l, from = TODAY) {
  const d0 = lemDia(l); if (!d0) return ""; if (!l.rep) return d0;
  let d = from > d0 ? from : d0;
  for (let i = 0; i < 400; i++, d = addDays(d, 1)) if (lemNoDia(l, d) && !(l.feitos || {})[d]) return d;
  return "";
}
function lemRepTxt(rep, d) {
  if (!rep || !d) return ""; const x = parse(d), w = x.getDay();
  return rep === "diario" ? "todo dia" : rep === "uteis" ? "dias úteis" : rep === "semanal" ? `${w === 0 || w === 6 ? "todo" : "toda"} ${DOWL[w]}` : rep === "mensal" ? `todo dia ${x.getDate()}` : rep === "anual" ? `todo ano em ${fmtD(d)}` : "";
}
const lemQuandoTxt = (d, hm) => `${d === TODAY ? "hoje" : d === addDays(TODAY, 1) ? "amanhã" : d === addDays(TODAY, -1) ? "ontem" : fmtDL(d)} às ${hm}`;
/* o que já devia ter acontecido e não foi marcado: os avulsos vencidos e as repetições de hoje que passaram */
function lemAtrasados(now = new Date()) {
  const hoje = iso(now), out = [];
  for (const l of lemList()) { const hm = lemHM(l); if (!hm) continue;
    if (!l.rep) { if (!l.feito && lemT(lemDia(l), hm) <= now) out.push({ l, d: lemDia(l) }); continue; }
    if (lemNoDia(l, hoje) && !(l.feitos || {})[hoje] && lemT(hoje, hm) <= now) out.push({ l, d: hoje }); }
  return out;
}
/* para o Agora do Secretário: avulsos de hoje ou vencidos e repetições de hoje, ainda não feitos */
function lemDeHoje(d = TODAY, now = new Date()) {
  const out = [];
  for (const l of lemList()) { const hm = lemHM(l); if (!hm) continue;
    const dd = l.rep ? (lemNoDia(l, d) ? d : "") : lemDia(l); if (!dd || dd > d || lemFeito(l, dd)) continue;
    out.push({ l, d: dd, hm, passou: lemT(dd, hm) <= now }); }
  return out.sort((p, q) => (p.d + p.hm).localeCompare(q.d + q.hm));
}
/* avisos devidos agora: na hora (ou N min antes), uma vez; repetições valem para hoje e para amanhã cedo (aviso antes da meia-noite) */
function lemDevidos(now = new Date()) {
  const out = [], hoje = iso(now);
  for (const l of lemList()) { const hm = lemHM(l); if (!hm || l.on === false) continue; const min = +l.min || 0;
    if (!l.rep) { if (l.feito || l.avisado) continue; const t = lemT(lemDia(l), hm); if (now >= new Date(t - min * 60e3)) out.push({ l, d: lemDia(l), t }); continue; }
    for (const d of [hoje, addDays(hoje, 1)]) { if (!lemNoDia(l, d) || (l.feitos || {})[d] || (l.avisados || {})[d]) continue;
      const t = lemT(d, hm); if (now >= new Date(t - min * 60e3) && now - t < 12 * 3600e3) out.push({ l, d, t }); } }
  return out.sort((p, q) => p.t - q.t);
}
/* chamado pelo relógio do Secretário: devolve true quando avisou */
function lemTick(now = new Date()) {
  if (!LOADED) return false; const due = lemDevidos(now); if (!due.length) return false;   /* no modo exemplo também (como antes): é parte da demonstração */
  const hoje = iso(now);
  for (const x of due) { if (!x.l.rep) { x.l.avisado = true; continue; } const a = {}; for (const [k, v] of Object.entries(x.l.avisados || {})) if (k >= addDays(hoje, -7)) a[k] = v; a[x.d] = 1; x.l.avisados = a; }
  touch("secretario", { noUndo: true, noRender: true });
  const um = x => `Lembrete: ${x.l.texto}${x.t > now || x.d !== hoje ? ` (${lemQuandoTxt(x.d, lemHM(x.l))})` : ""}`;
  const txt = due.length === 1 ? um(due[0]) : `${due.length} lembretes: ${due.map(x => x.l.texto).join(", ")}`;
  SEC.nudge = { txt, crit: true, at: Date.now() }; SEC.tab = "lembretes"; SEC.open = true; secLS("open", true); toast(txt); secPaint();
  lsNotifica(txt); if (secData().lsSom) lsSom();
  return true;
}

/* ---------------------------------------------------------------- feito, apagar */
function lemFeitoSet(id, d, v = true) {
  const l = lemList().find(x => x.id === id); if (!l) return null;
  if (l.rep) { const f = { ...(l.feitos || {}) }; if (v) f[d] = 1; else delete f[d]; l.feitos = f; } else l.feito = !!v;
  touch("secretario", { label: `${v ? "Lembrete feito" : "Lembrete reaberto"}: ${trunc(l.texto, 40)}` }); return l;
}
function lemApagar(id, d, so) {
  const D = secData(), l = D.lembretes.find(x => x.id === id); if (!l) return;
  if (so && l.rep && d) { l.exc = [...new Set([...(l.exc || []), d])]; touch("secretario", { label: `Lembrete fora de ${fmtD(d)}: ${trunc(l.texto, 40)}` }); undoToast(`${trunc(l.texto, 40)}: saiu só de ${fmtDL(d)}${l.gcal?.on ? " (no Google, use “Atualizar no Google”)" : ""}`); return; }
  D.lembretes = D.lembretes.filter(x => x !== l); touch("secretario", { label: `Lembrete apagado: ${trunc(l.texto, 40)}` });
  undoToast(`Lembrete apagado: ${trunc(l.texto, 40)}${lemGcReg()[l.id] ? ", também do Google Agenda" : ""}`);
  if (lemGcReg()[l.id]) lemGcSync();
}

/* ---------------------------------------------------------------- ler a frase: “dentista 25/10 às 15h”, “remédio todo dia às 8” */
const LEM_MES = { janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11, jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
const LEM_NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, dez: 10, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50 };
const LEM_DOWF = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const LEM_PER = { manha: 9 * 60, tarde: 15 * 60, noite: 20 * 60, madrugada: 6 * 60, cedo: 8 * 60 };
const lemN = s => /^\d+$/.test(s) ? +s : LEM_NUM[s] ?? NaN;
function lemData(dd, mm, yy, hoje) {
  if (!(mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31)) return null;
  const y0 = yy ? (+yy < 100 ? 2000 + +yy : +yy) : +hoje.slice(0, 4), ok = y => { const x = new Date(y, mm - 1, dd); return x.getMonth() === mm - 1 ? iso(x) : null; };
  let r = ok(y0); if (!r) return null; if (!yy && r < hoje) r = ok(y0 + 1) || r; return r;
}
/* o próximo dia N do mês (este mês, se ainda não passou; senão o próximo mês que tem o dia N) */
function lemDiaDoMes(n, hoje, passouHoje = false) {
  const x = parse(hoje.slice(0, 8) + "01");
  for (let i = 0; i < 14; i++) { const c = new Date(x.getFullYear(), x.getMonth() + i, n), s = iso(c); if (c.getDate() === n && (s > hoje || (s === hoje && !passouHoje))) return s; }
  return null;
}
function lemParse(txt, now = new Date()) {
  const T = String(txt || "").slice(0, 300), F = fold(T), cut = [], hoje = iso(now), nm = now.getHours() * 60 + now.getMinutes();
  let day = null, hm = null, rep = "", wd = -1, prox = false, per = "", hojeX = false, rel = null, mdia = 0, meiaNoite = false, temData = false;
  const W = s => new RegExp(`(?<![a-z0-9])(?:${s})(?![a-z0-9])`, "g");
  const hit = (re, fn) => { for (const m of F.matchAll(re)) { const a = m.index, z = a + m[0].length; if (cut.some(([p, q]) => a < q && z > p)) continue; if (fn(m, a, z) === false) continue; cut.push([a, z]); } };
  const DW = "segunda|terca|quarta|quinta|sexta|sabado|domingo";
  /* repetição */
  hit(W("(?:(?:todos|todas) os dias|todo santo dia|diariamente|todo dia(?!\\s+\\d))"), () => { rep = "diario"; });
  hit(W("(?:em |nos )?dias uteis|de segunda a sexta(?:-feira)?"), () => { rep = "uteis"; });
  hit(W(`(?:toda|todas as|todo|todos os)\\s+(${DW})s?(?:-feira|\\s+feira)?s?`), m => { rep = "semanal"; wd = LEM_DOWF.indexOf(m[1]); temData = true; });
  hit(W("toda semana|todas as semanas|semanalmente"), () => { rep ||= "semanal"; });
  hit(W("todo dia (\\d{1,2})(?: de cada mes| do mes)?"), m => { const n = +m[1]; if (n < 1 || n > 31) return false; rep = "mensal"; mdia = n; temData = true; });
  hit(W("todo mes|todos os meses|mensalmente"), () => { rep ||= "mensal"; });
  hit(W("todo ano|todos os anos|anualmente"), () => { rep ||= "anual"; });
  /* daqui a / em N minutos ou horas */
  hit(W("(?:em|daqui a|daqui)\\s+(?:(meia)\\s+hora|(\\d+|uma|um|duas|dois|tres)\\s*(?:h|hs|horas?)(?:\\s*e\\s*(?:(meia)|(\\d{1,2})\\s*(?:min|minutos?)?)|(\\d{2})(?!\\d))?|(\\d+|um|uma|dois|duas|tres|cinco|dez|quinze|vinte|trinta|quarenta|cinquenta)\\s*(?:min|mins|minutos?))"), m => {
    const mins = m[1] ? 30 : m[2] != null ? lemN(m[2]) * 60 + (m[3] ? 30 : m[4] ? +m[4] : m[5] ? +m[5] : 0) : lemN(m[6]);
    if (!(mins > 0) || mins > 7 * 1440) return false; rel = mins; });
  /* dia */
  hit(W("depois de amanha"), () => { day = addDays(hoje, 2); temData = true; });
  hit(W("amanha"), () => { day ??= addDays(hoje, 1); temData = true; });
  hit(W("hoje"), () => { day ??= hoje; hojeX = true; temData = true; });
  hit(W("(?:(?:no|para o|pro|ate o|ate)\\s+)?(?:dia\\s+)?(\\d{1,2})/(\\d{1,2})(?:/(\\d{4}|\\d{2}))?"), m => { const r = lemData(+m[1], +m[2], m[3], hoje); if (!r) return false; day = r; temData = true; });
  hit(W(`(?:(?:no|para o|pro|ate o|ate)\\s+)?(?:dia\\s+)?(\\d{1,2})\\s+de\\s+(${Object.keys(LEM_MES).join("|")})\\.?(?:\\s+de\\s+(\\d{4}))?`), m => { const r = lemData(+m[1], LEM_MES[m[2]] + 1, m[3], hoje); if (!r) return false; day = r; temData = true; });
  hit(W("(?:(?:no|para o|pro|ate o)\\s+)?dia\\s+(\\d{1,2})(?!\\s*[/:h\\d])"), m => { const n = +m[1]; if (n < 1 || n > 31) return false; day = lemDiaDoMes(n, hoje); temData = !!day; if (!day) return false; });
  hit(W(`(?:(?:na|no|nesta|neste|esta|este|para|pra)\\s+)?(?:(proxim[oa])\\s+)?(${DW})(?:-feira|\\s+feira)?(?:\\s+(que vem))?(?!\\s+(?:vez|vezes|chance|opcao|mao|parte|via|guerra))`), m => { if (wd >= 0) return false; wd = LEM_DOWF.indexOf(m[2]); prox = !!(m[1] || m[3]); temData = true; });
  hit(W("(?:na\\s+)?(?:semana que vem|proxima semana)"), () => { if (wd < 0 && !day) { day = weekStart(addDays(hoje, 7)); temData = true; } });
  /* hora */
  hit(W("(?:(?:ao|a|as)\\s+)?meio[- ]dia(?:\\s+e\\s+meia)?"), m => { hm = 12 * 60 + (/meia$/.test(m[0]) ? 30 : 0); });
  hit(W("(?:(?:a|as)\\s+)?meia[- ]noite"), () => { hm = 0; meiaNoite = true; });
  hit(W("(?:(as|a|ao|pelas|la pelas|para as|pras|ate as)\\s+)?(\\d{1,2})(?:(:|h)(\\d{2}))?\\s*(hs?(?![a-z])|horas?)?(?:\\s+e\\s+(meia|quinze|\\d{1,2})(?!\\s*(?:min|minutos|[/:\\d])))?(?:\\s+(?:da|de)\\s+(manha|tarde|noite|madrugada))?"), (m, a, z) => {
    const [, pre, hh, sep, mm, suf, e, pd] = m, orig = T.slice(a, a + 3).toLowerCase();
    let ok = !!(sep && mm) || /^hs?$/.test(suf || "") || !!pd;
    if (!ok && pre) { const acento = orig.startsWith("às") || orig.startsWith("à "), depois = F.slice(z);
      ok = pre === "as" ? (acento || /^\s*(?:$|[,.;!?)]|(?:da|de|do|no|na|em|e|amanha|hoje|depois|dia|pra|para|todo|toda|todos|todas|segunda|terca|quarta|quinta|sexta|sabado|domingo)(?![a-z]))/.test(depois) || /^horas?$/.test(suf || ""))
        : pre === "a" || pre === "ao" ? (acento || /^horas?$/.test(suf || "")) : true; }
    if (!ok) return false;
    let h = +hh, mi = mm ? +mm : e === "meia" ? 30 : e === "quinze" ? 15 : e ? +e : 0;
    if (pd === "tarde" || pd === "noite") { if (h < 12) h += 12; else if (h === 12 && pd === "noite") { h = 0; meiaNoite = true; } }
    if (h > 23 || mi > 59) return false; hm = h * 60 + mi; });
  /* “à noite”, “de manhã”, “pela tarde” (o “hoje”/“amanhã” antes já saiu); “cedo” só logo depois de hoje/amanhã (“dormir cedo” não é hora) */
  hit(W("(?:(?:de|pela|a|na|nesta|esta)\\s+)(manha|tarde|noite|madrugada)|(?:bem\\s+)?cedo"), (m, a) => { if (!m[1] && !/(?:amanha|hoje)\s+$/.test(F.slice(Math.max(0, a - 8), a))) return false; per = m[1] || "cedo"; });
  /* juntar */
  let d = day, achouHora = hm != null || rel != null;
  if (hm == null && per) { hm = LEM_PER[per]; achouHora = true; }
  if (rel != null) { const t = new Date(now.getTime() + rel * 60e3); d = iso(t); hm = t.getHours() * 60 + t.getMinutes(); temData = true; }
  else {
    if (wd >= 0 && !day) { let k = (wd - now.getDay() + 7) % 7; if (k === 0 && (prox || (hm ?? 9 * 60) <= nm)) k = 7; d = addDays(hoje, k); }
    if (rep === "mensal" && mdia && !day) d = lemDiaDoMes(mdia, hoje, (hm ?? 9 * 60) <= nm);
    if (!d && (hm != null || rep)) { d = hoje; if ((hm ?? 9 * 60) <= nm && !hojeX) d = addDays(hoje, 1); }
    if (meiaNoite && d) d = addDays(d, 1);
    if (d && hm == null) hm = d === hoje ? Math.min(23 * 60 + 30, (Math.floor(nm / 60) + 1) * 60) : 9 * 60;
  }
  /* o texto sem as expressões de tempo */
  let t = "", last = 0; for (const [a, z] of cut.sort((p, q) => p[0] - q[0])) { t += T.slice(last, a) + " "; last = Math.max(last, z); } t += T.slice(last);
  t = t.replace(/^\s*(?:secret[aá]rio,?\s*)?(?:me\s+)?(?:(?:cria(?:r)?\s+(?:um\s+)?)?lembrete:?|lembr[ae]r?(?:-me)?(?![\p{L}]))\s*(?:de|para|que)?\s*/iu, "")
    .replace(/\s{2,}/g, " ").replace(/\s+([,.;:!?])/g, "$1").replace(/^[\s,;:.–—-]+/, "");
  for (let i = 0; i < 3; i++) t = t.replace(/(?:[\s,;:.–—-]+|\s+(?:de|para|pra|no|na|em|às|as|à|e))+$/iu, "");
  t = t.trim();
  return { texto: t ? t[0].toUpperCase() + t.slice(1) : "", data: d || "", hora: hm != null ? m2hm(hm) : "", rep, achou: { data: temData, hora: achouHora, rep: !!rep } };
}

/* ---------------------------------------------------------------- formulário (o mesmo nos três lugares) */
function lemHoraSug(d) { if (d !== TODAY) return "09:00"; return m2hm(Math.min(23 * 60 + 30, Math.ceil((nowMin() + 15) / 30) * 30)); }
const lemDKey = (p, id) => p + (id ? ":" + id : "");
function lemFormHTML(p, l = null, pre = {}) {
  const dr = LEM.draft[lemDKey(p, l?.id)], D = secData();
  const v = dr || { t: l ? l.texto : pre.texto || "", d: l ? lemDia(l) || TODAY : pre.d || TODAY, h: l ? lemHM(l) || "09:00" : pre.h || lemHoraSug(pre.d || TODAY), r: l ? l.rep || "" : pre.rep || "", m: l ? +l.min || 0 : 0, g: l ? !!l.gcal?.on : !!D.lemGcal, soft: !l && !pre.d ? "1" : "" };
  const fl = dr ? Object.entries(dr.f || {}).map(([k, x]) => ` data-${k}="${x}"`).join("") : v.soft ? ' data-dsoft="1"' : "";
  const i = s => `lf_${p}_${s}`;
  return `<div class="lemf" data-lemf="${p}" data-lemid="${esc(l?.id || "")}"${fl}>
    <label class="lemf-t" for="${i("t")}"><span>Lembrar de</span><input type="text" class="lf-t" id="${i("t")}" value="${esc(v.t)}" placeholder="Ex.: dentista 25/10 às 15h" autocomplete="off" maxlength="240" enterkeyhint="done"></label>
    <div class="lemf-r">
      <label for="${i("d")}"><span>Data</span><input type="date" class="lf-d" id="${i("d")}" value="${esc(v.d)}"></label>
      <label for="${i("h")}"><span>Hora</span><input type="time" class="lf-h" id="${i("h")}" value="${esc(v.h)}"></label>
      <label for="${i("r")}"><span>Repetir</span><select class="lf-r" id="${i("r")}">${Object.entries(LEM_REP).map(([k, x]) => `<option value="${k}"${k === v.r ? " selected" : ""}>${x}</option>`).join("")}</select></label>
      <label for="${i("m")}"><span>Avisar</span><select class="lf-m" id="${i("m")}">${LEM_MIN.map(m => `<option value="${m}"${m === +v.m ? " selected" : ""}>${lemMinTxt(m)}</option>`).join("")}</select></label>
    </div>
    <p class="lemf-pv" aria-live="polite">${lemPrevHTML(lemLerV(v))}</p>
    <div class="lemf-f"><label class="chk"><input type="checkbox" class="lf-g"${v.g ? " checked" : ""}><span>Também no Google Agenda (avisa no celular)</span></label>
      <div class="row">${l ? `<button type="button" class="btn sm ghost" data-lemx="${p}">Cancelar</button>` : ""}<button type="button" class="btn sm primary" data-lemsave="${p}">${ic(l ? "check" : "bell")}${l ? "Salvar" : "Lembrar"}</button></div></div></div>`;
}
const lemLerV = v => { const P = lemParse(v.t); return { texto: P.texto, d: v.d, h: v.h, r: v.r, m: +v.m || 0, g: !!v.g }; };
function lemLer(root) {
  const q = c => root.querySelector(c), P = lemParse(q(".lf-t")?.value || "");
  return { texto: P.texto.slice(0, 200), d: q(".lf-d")?.value || "", h: (q(".lf-h")?.value || "").slice(0, 5), r: q(".lf-r")?.value || "", m: +(q(".lf-m")?.value || 0), g: !!q(".lf-g")?.checked, P };
}
function lemPrevHTML(o) {
  if (!o.texto) return `Escreva o que lembrar. A data e a hora podem ir na frase (“dentista 25/10 às 15h”, “remédio todo dia às 8”) ou nos campos.`;
  if (!o.d || !o.h) return `<span class="st-warn">Falta ${!o.d ? "a data" : "a hora"}.</span>`;
  const t = lemT(o.d, o.h), passou = !o.r && new Date(t - o.m * 60e3) <= new Date();
  return `<b>${esc(trunc(o.texto, 70))}</b> · ${esc(lemQuandoTxt(o.d, o.h))}${o.r ? ` · ${esc(lemRepTxt(o.r, o.d))}` : ""}${o.m ? ` · aviso ${esc(lemMinTxt(o.m))}` : ""} · aparece na Rotina${o.g ? " e no Google Agenda" : ""}${passou ? ` · <span class="st-warn">esse horário já passou: avisa assim que salvar</span>` : ""}`;
}
function lemPrev(root) { const pv = root.querySelector(".lemf-pv"); if (pv) pv.innerHTML = lemPrevHTML(lemLer(root)); }
/* a frase preenche os campos que a pessoa ainda não mexeu; a data “de partida” (hoje) muda até com só a hora (às 9 depois das 9 = amanhã) */
function lemAuto(root) {
  const P = lemParse(root.querySelector(".lf-t").value), ds = root.dataset, set = (c, v) => { const el = root.querySelector(c); if (el && v && el.value !== v) el.value = v; };
  if (!ds.mand && (P.achou.data || (P.achou.hora && ds.dsoft))) set(".lf-d", P.data);
  if (!ds.manh && P.achou.hora) set(".lf-h", P.hora);
  if (!ds.manr && P.achou.rep) set(".lf-r", P.rep);
}
function lemDraft(root) {
  const p = root.dataset.lemf, q = c => root.querySelector(c), f = {}; for (const k of ["mand", "manh", "manr", "dsoft"]) if (root.dataset[k]) f[k] = root.dataset[k];
  LEM.draft[lemDKey(p, root.dataset.lemid)] = { t: q(".lf-t").value, d: q(".lf-d").value, h: q(".lf-h").value, r: q(".lf-r").value, m: q(".lf-m").value, g: q(".lf-g").checked, f };
}
function lemSalvar(root) {
  const p = root.dataset.lemf, id = root.dataset.lemid, o = lemLer(root), foco = c => root.querySelector(c)?.focus();
  if (!o.texto) { toast("Escreva o que lembrar."); foco(".lf-t"); return null; }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(o.d)) { toast("Escolha a data do lembrete."); foco(".lf-d"); return null; }
  if (!/^\d{2}:\d{2}$/.test(o.h)) { toast("Escolha a hora do lembrete."); foco(".lf-h"); return null; }
  const quando = `${o.d}T${o.h}`, D = secData(); let l = id ? D.lembretes.find(x => x.id === id) : null;
  if (id && !l) { toast("Esse lembrete não existe mais."); return null; }
  if (l) {
    const mudou = l.quando !== quando || (l.rep || "") !== o.r || (+l.min || 0) !== o.m;
    Object.assign(l, { texto: o.texto, quando, rep: o.r, min: o.m });
    if (mudou) { l.avisado = false; l.feito = false; if (l.avisados) { const a = { ...l.avisados }; delete a[TODAY]; delete a[addDays(TODAY, 1)]; l.avisados = a; } if (!o.r) { delete l.feitos; delete l.avisados; delete l.exc; } }
  } else { l = { id: uid(), texto: o.texto, quando, rep: o.r, min: o.m, feito: false, avisado: false, at: Date.now(), origem: "você" }; D.lembretes.push(l); }
  if (!!D.lemGcal !== o.g) D.lemGcal = o.g;
  delete LEM.draft[lemDKey(p, id)]; if (p === "rt") LEM.novo = true; if (p === "sece") LEM.ed = "";
  touch("secretario", { label: `${id ? "Lembrete alterado" : "Lembrete criado"}: ${trunc(o.texto, 40)}` });
  undoToast(`${id ? "Lembrete alterado" : "Lembrete criado"}: ${trunc(o.texto, 40)} · ${lemQuandoTxt(o.d, o.h)}${o.r ? ` · ${lemRepTxt(o.r, o.d)}` : ""}`);
  if (o.g && (!l.gcal?.on || lemGcDesatual(l))) lemGcalPor(l); else if (!o.g && l.gcal?.on) lemGcalTira(l);
  return l;
}
function lemDepois(p) {
  if (p === "dlg") $("#dlg")?.close();
  secPaint(); if (p === "sec") setTimeout(() => $("#sec [data-lemf=sec] .lf-t")?.focus(), 0);
}
function lemEnter(el) { const root = el.closest("[data-lemf]"); if (!root) return; const l = lemSalvar(root); if (l) lemDepois(root.dataset.lemf); }

/* ---------------------------------------------------------------- listas, cartão e diálogo */
function lemItemHTML(l, ctx) {
  const hm = lemHM(l), d = l.rep ? lemProx(l) : lemDia(l), feito = d ? lemFeito(l, d) : false, now = new Date(), atras = !!(hm && d && !feito && lemT(d, hm) <= now);
  const quando = hm && d ? lemQuandoTxt(d, hm) : "sem data e hora", gc = l.gcal?.on ? (lemGcDesatual(l) ? " · <span class=\"st-warn\">Google desatualizado</span>" : " · Google Agenda") : "";
  return `<div class="lemit${atras ? " st-crit" : ""}"><span class="lemic">${ic("bell")}</span><div class="lemb"><b>${esc(l.texto)}</b><small>${esc(quando)}${l.rep ? ` · ${esc(lemRepTxt(l.rep, lemDia(l)))}` : ""}${+l.min ? ` · aviso ${esc(lemMinTxt(l.min))}` : ""}${gc}${l.origem && l.origem !== "você" ? ` · ${esc(l.origem)}` : ""}</small></div>
    <div class="lemacts">${atras || (d === TODAY && !feito) ? `<button type="button" class="btn sm" data-lemok="${esc(l.id)}|${d}|1">${ic("check")}Feito</button>` : ""}${hm && d ? `<button type="button" class="iconbtn" data-lemver="${d}" aria-label="Ver ${esc(l.texto)} na Rotina" title="Ver na Rotina">${ic("cal")}</button>` : ""}<button type="button" class="iconbtn" data-lemed="${esc(l.id)}|${ctx}" aria-label="Editar o lembrete ${esc(l.texto)}" title="Editar">${ic("edit")}</button><button type="button" class="iconbtn" data-lemdel="${esc(l.id)}" aria-label="Apagar o lembrete ${esc(l.texto)}" title="Apagar">${ic("trash")}</button></div></div>`;
}
/* pendentes primeiro (avulsos não feitos e repetições pela próxima vez), em ordem de hora */
function lemPendentes() {
  return lemList().filter(l => l.rep || !l.feito).map(l => { const d = l.rep ? lemProx(l) : lemDia(l), hm = lemHM(l); return { l, k: d && hm ? `${d}T${hm}` : "9999" }; }).sort((p, q) => p.k.localeCompare(q.k)).map(x => x.l);
}
function lemListaHTML(ctx, max = 40) {
  const L = lemPendentes(); if (!L.length) return "";
  return `<div class="lemlista">${L.slice(0, max).map(l => ctx === "sec" && LEM.ed === l.id ? lemFormHTML("sece", l) : lemItemHTML(l, ctx)).join("")}${L.length > max ? `<p class="muted small">+ ${L.length - max} lembretes</p>` : ""}</div>`;
}
function lemDlg(id, pre = {}) {
  const l = id ? lemList().find(x => x.id === id) : null, dlg = $("#dlg"); if (id && !l) return;
  dlg.innerHTML = `<form method="dialog" class="rtcard lemdlg"><div class="rtch"><span class="rtcc lemcc"></span><div><h3>${l ? "Editar lembrete" : "Novo lembrete"}</h3><p class="muted small">Aparece na Rotina na hora marcada e avisa pelo Secretário, com o Atlas aberto. Marcando o Google Agenda, avisa também no celular.</p></div><button type="button" class="iconbtn" data-rtcx="1" aria-label="Fechar">${ic("x")}</button></div>${lemFormHTML("dlg", l, pre)}</form>`;
  if (!dlg.open) dlg.showModal(); setTimeout(() => dlg.querySelector(".lf-t")?.focus(), 30);
}
function lemCard(id, d) {
  const l = lemList().find(x => x.id === id); if (!l) return; const dlg = $("#dlg"), hm = lemHM(l), feito = lemFeito(l, d), gr = lemGcReg()[l.id];
  const gbtn = LEMGC.busy === l.id ? `<span class="muted small">Google Agenda…</span>` : `<button type="button" class="btn sm ghost" data-lemgc="${esc(l.id)}">${ic("cal")}${l.gcal?.on ? (lemGcDesatual(l) ? "Atualizar no Google" : "Tirar do Google") : "Pôr no Google Agenda"}</button>`;
  dlg.innerHTML = `<form method="dialog" class="rtcard lemdlg"><div class="rtch"><span class="rtcc lemcc"></span><div><h3>${ic("bell")}${esc(l.texto)}</h3><p class="muted small">Lembrete · ${esc(lemQuandoTxt(d, hm))}${l.rep ? ` · ${esc(lemRepTxt(l.rep, lemDia(l)))}` : ""} · aviso ${esc(lemMinTxt(l.min))}${l.gcal?.on || gr ? ` · ${lemGcDesatual(l) ? "Google desatualizado" : "no Google Agenda"}` : ""}${feito ? " · feito" : ""}${l.origem && l.origem !== "você" ? ` · criado por ${esc(l.origem)}` : ""}</p></div><button type="button" class="iconbtn" data-rtcx="1" aria-label="Fechar">${ic("x")}</button></div>
    <div class="row wrap rtca"><button type="button" class="btn sm${feito ? "" : " primary"}" data-lemok="${esc(l.id)}|${d}|${feito ? 0 : 1}">${ic(feito ? "undo" : "check")}${feito ? "Reabrir" : "Feito"}</button><button type="button" class="btn sm" data-lemed="${esc(l.id)}|dlg">${ic("edit")}Editar</button>${gbtn}
      ${l.rep ? `<button type="button" class="btn sm ghost danger" data-lemdel="${esc(l.id)}|${d}|so">${ic("trash")}Tirar só deste dia</button><button type="button" class="btn sm ghost danger" data-lemdel="${esc(l.id)}">${ic("trash")}Apagar todos</button>` : `<button type="button" class="btn sm ghost danger" data-lemdel="${esc(l.id)}">${ic("trash")}Apagar</button>`}</div></form>`;
  if (!dlg.open) dlg.showModal();
}

/* ---------------------------------------------------------------- eventos (chamados antes dos outros: valem também dentro do Secretário) */
function lemClick(t) {
  const ds = t.dataset;
  if (ds.lemsave != null) { const root = t.closest("[data-lemf]"); if (root) { const l = lemSalvar(root); if (l) lemDepois(root.dataset.lemf); } return true; }
  if (ds.lemx != null) { const p = ds.lemx, root = t.closest("[data-lemf]"); if (root) delete LEM.draft[lemDKey(p, root.dataset.lemid)]; if (p === "sece") { LEM.ed = ""; secPaint(); } else if (p === "dlg") $("#dlg").close(); return true; }
  if (ds.rtlem) { const [id, d] = ds.rtlem.split("|"); lemCard(id, d); return true; }
  if (ds.lemok) { const [id, d, v] = ds.lemok.split("|"), on = v !== "0", l = lemFeitoSet(id, d, on); if (l) { if ($("#dlg").open && $("#dlg .lemdlg")) lemCard(id, d); secPaint(); undoToast(`${on ? "Feito" : "Reaberto"}: ${trunc(l.texto, 40)}`); } return true; }
  if (ds.lemed) { const [id, ctx] = ds.lemed.split("|"); if (ctx === "sec") { LEM.ed = id; secPaint(); setTimeout(() => $("#sec [data-lemf=sece] .lf-t")?.focus(), 0); } else lemDlg(id); return true; }
  if (ds.lemdel) { const [id, d, so] = ds.lemdel.split("|"); if (t.closest("#dlg")) $("#dlg").close(); lemApagar(id, d, so === "so"); secPaint(); return true; }
  if (ds.lemgc) { const l = lemList().find(x => x.id === ds.lemgc); if (l) { if (l.gcal?.on && !lemGcDesatual(l)) lemGcalTira(l); else lemGcalPor(l); } return true; }
  if (ds.lemtipo) { LEM.tipo = ds.lemtipo; LEM.novo = true; render(); setTimeout(() => $(LEM.tipo === "data" ? "[data-lemf=rt] .lf-t" : "#ls_t")?.focus(), 0); return true; }
  if (ds.act === "lsnovo") { LEM.novo = !t.closest("details")?.open; return true; }
  if (ds.act === "lemnovo") { lemDlg(null, { d: RT.d, h: lemHoraSug(RT.d) }); return true; }
  if (ds.lemver) { RT.d = ds.lemver; if (t.closest("#sec") && innerWidth <= 640) secToggle(false); if ($("#dlg").open) $("#dlg").close(); if (PAGE === "rotina" && SUB === "dia") render(); else setHash("rotina", "dia"); return true; }
  return false;
}
function lemInput(t) {
  const root = t.closest?.("[data-lemf]"); if (!root) return false; const ds = root.dataset;
  if (t.classList.contains("lf-t")) lemAuto(root); else if (t.classList.contains("lf-d")) { ds.mand = "1"; delete ds.dsoft; } else if (t.classList.contains("lf-h")) ds.manh = "1";
  lemPrev(root); lemDraft(root); return true;
}
function lemChange(t) {
  const root = t.closest?.("[data-lemf]"); if (!root) return false; const ds = root.dataset;
  if (t.classList.contains("lf-r")) ds.manr = "1"; else if (t.classList.contains("lf-d")) { ds.mand = "1"; delete ds.dsoft; } else if (t.classList.contains("lf-h")) ds.manh = "1";
  lemPrev(root); lemDraft(root); return true;
}

/* ---------------------------------------------------------------- Google Agenda: um evento por lembrete, com a repetição e o aviso */
const lemGcReg = () => ((S.integ ||= {}).lemGc ||= {});
const lemSig = l => [l.texto, l.quando, l.rep || "", +l.min || 0, (l.exc || []).join(",")].join("|");
const lemGcDesatual = l => !!l.gcal?.on && (l.gcal.sig !== lemSig(l) || !lemGcReg()[l.id]);
const LEMGC = { busy: "", sync: false };
const lemRRule = l => ({ diario: "RRULE:FREQ=DAILY", uteis: "RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", semanal: "RRULE:FREQ=WEEKLY", mensal: "RRULE:FREQ=MONTHLY", anual: "RRULE:FREQ=YEARLY" })[l.rep] || "";
const lemLoc = x => `${iso(x)}T${pad(x.getHours())}:${pad(x.getMinutes())}:00`;
/* apaga o evento de um lembrete: pelo id guardado; sem id, procura a marca do lembrete na agenda perto do dia */
async function lemGcTira0(lid, r) {
  if (r?.e) { try { await MCP.callTool(GC_SRV, "delete_event", { eventId: r.e, notificationLevel: "NONE" }); } catch (e) { if (!/not.?found|404|410|gone|deleted/i.test(`${e?.code || ""} ${e?.message || e}`)) throw e; } return; }
  const d = r?.d || TODAY, res = await MCP.callTool(GC_SRV, "list_events", { startTime: `${addDays(d, -1)}T00:00:00`, endTime: `${addDays(d, 2)}T00:00:00`, fullText: `${GC_LEMB}l:${lid}`, pageSize: 50, timeZone: tzLocal() }, { cache: false });
  const pl = res?.payload ?? {}, lista = Array.isArray(pl) ? pl : pl.events ?? pl.items ?? pl.result?.events ?? pl.data?.events ?? [];
  for (const id of new Set(lista.filter(ev => String(ev?.description || "").includes(`${GC_LEMB}l:${lid}`)).map(ev => ev.recurringEventId || ev.id).filter(Boolean))) await MCP.callTool(GC_SRV, "delete_event", { eventId: id, notificationLevel: "NONE" });
}
async function lemGcalPor(l0) {
  if (!MCP) { toast(EX_MODE ? "Desligue o modo exemplo para usar o Google Agenda." : "O Google Agenda não está disponível nesta visualização: o lembrete fica só no Atlas."); return false; }
  if (LEMGC.busy) return false; LEMGC.busy = l0.id; secPaint(); const lid = l0.id;
  try {
    const R = lemGcReg(); if (R[lid] || l0.gcal?.on) { await lemGcTira0(lid, R[lid] || { d: lemDia(l0) }); delete R[lid]; }
    const l = lemList().find(x => x.id === lid); if (!l) return false;
    const d = lemDia(l), hm = lemHM(l), ini = lemT(d, hm), fim = new Date(ini.getTime() + 15 * 60e3), rr = lemRRule(l);
    const ex = rr && (l.exc || []).length ? [`EXDATE;TZID=${tzLocal()}:${l.exc.map(x => `${x.replace(/-/g, "")}T${hm.replace(":", "")}00`).join(",")}`] : [];
    const res = await MCP.callTool(GC_SRV, "create_event", { summary: `🔔 ${l.texto}`, startTime: lemLoc(ini), endTime: lemLoc(fim), timeZone: tzLocal(), ...(rr ? { recurrenceData: [rr, ...ex] } : {}),
      overrideReminders: [{ method: "popup", minutes: +l.min || 0 }], useDefaultReminders: false, availability: "AVAILABILITY_FREE",
      description: `Lembrete do Atlas da Vida${l.rep ? ` (${lemRepTxt(l.rep, d)})` : ""}. Para mudar ou tirar, use o Atlas: Rotina › Lembretes. ${GC_LEMB}l:${lid}` });
    const eid = lsIdDe(res), L = lemList().find(x => x.id === lid);
    if (!L) { await lemGcTira0(lid, { e: eid, d }).catch(() => {}); return false; }   // apagado enquanto o Google respondia
    L.gcal = { on: true, id: eid, sig: lemSig(L), at: Date.now() }; lemGcReg()[lid] = { e: eid, d };
    touch("secretario", "integ", { noUndo: true }); toast(`${trunc(L.texto, 40)}: no Google Agenda${L.rep ? `, ${lemRepTxt(L.rep, d)}` : ""}, com aviso ${lemMinTxt(L.min)}.`); return true;
  } catch (e) { toast(gcErr(e)); return false; }
  finally { LEMGC.busy = ""; secPaint(); if ($("#dlg").open && $("#dlg .lemdlg") && !$("#dlg [data-lemf]")) { const l = lemList().find(x => x.id === lid); if (l) lemCard(lid, lemProx(l) || lemDia(l)); } }
}
async function lemGcalTira(l0) {
  if (!MCP) { toast("O Google Agenda não está disponível nesta visualização: o evento continua lá até você apagar no Google."); return false; }
  if (LEMGC.busy) return false; LEMGC.busy = l0.id; secPaint(); const lid = l0.id;
  try { const R = lemGcReg(); await lemGcTira0(lid, R[lid] || { e: l0.gcal?.id, d: lemDia(l0) }); delete R[lid]; const L = lemList().find(x => x.id === lid); if (L) L.gcal = null;
    touch("secretario", "integ", { noUndo: true }); toast(`${trunc(l0.texto, 40)} saiu do Google Agenda.`); return true; }
  catch (e) { toast(gcErr(e)); return false; }
  finally { LEMGC.busy = ""; secPaint(); }
}
/* depois de desfazer, refazer ou apagar: evento de lembrete que não existe mais sai do Google. Lembrete que voltou sem evento no registro
   aparece como “Google desatualizado”: “Atualizar no Google” procura pela marca e refaz, sem duplicar */
async function lemGcSync() {
  if (!LOADED || EX_MODE) return; const R = lemGcReg(), ids = new Set(lemList().map(l => l.id));
  const orf = Object.entries(R).filter(([lid]) => !ids.has(lid)); if (!orf.length || !MCP || LEMGC.sync) return;
  LEMGC.sync = true; let n = 0;
  try { for (const [lid, r] of orf) { try { await lemGcTira0(lid, r); delete lemGcReg()[lid]; n++; } catch (e) { console.warn("lembrete no Google", e); } } }
  finally { LEMGC.sync = false; if (n) touch("integ", { noUndo: true, noRender: true }); }
}

/* ---------------------------------------------------------------- Próximos dias do Hoje: a próxima vez de cada lembrete */
function lemAgendaItens(until) {
  const out = [];
  for (const l of lemList()) { const hm = lemHM(l); if (!hm) continue;
    if (!l.rep) { if (l.feito || lemDia(l) > until) continue; out.push({ d: lemDia(l), l: `${hm} · ${l.texto}`, s: "lembrete", ico: "bell", a: null, lem: `${l.id}|${lemDia(l)}` }); continue; }
    const d = lemProx(l); if (d && d <= until) out.push({ d, l: `${hm} · ${l.texto}`, s: lemRepTxt(l.rep, lemDia(l)), ico: "bell", a: null, lem: `${l.id}|${d}` }); }
  return out;
}
