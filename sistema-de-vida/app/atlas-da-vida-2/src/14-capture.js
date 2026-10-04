
/* ================================================================ captura sem atrito: escreva ou dite, o Atlas separa os registros */
const CAP = { text: "", data: TODAY, items: [], diario: true, entrada: "", busy: false, ctl: null, src: "local", off: new Set(), duvidas: [] };
/* dobra acentos e caixa sem mudar o comprimento: os índices batem com o texto original */
function fold(s) { let o = ""; for (let i = 0; i < s.length; i++) { const c = s[i]; let f = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); if (f.length !== 1) f = /[̀-ͯ]/.test(c) ? " " : (c.toLowerCase()[0] || " "); o += f; } return o; }
const CAP_VERBS = "gastei|paguei|comprei|torrei|recebi|ganhei|guardei|investi|aportei|poupei|dormi|corri|caminhei|andei|pedalei|nadei|treinei|malhei|meditei|estudei|li|liguei|telefonei|falei|conversei|almocei|jantei|encontrei|sai|fui|assisti|joguei|toquei|preciso|tenho|lembrar|pesei|bebi|escrevi|planejei|rezei|orei|visitei|mandei|fiz|humor|energia|estresse";
const AMT = "(?:€|r\\$|eur|us\\$)?\\s*(\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)\\s*(?:€|euros?|reais|conto?s?|pila)?";
const CAP_TREINO = [[/\b(corri|corrida|correndo)\b/, "Corrida"], [/\b(caminhei|caminhada)\b/, "Caminhada"], [/\b(pedalei|bike|bicicleta|ciclismo)\b/, "Bicicleta"], [/\b(nadei|natacao|piscina)\b/, "Natação"], [/\b(musculacao|academia|malhei|treino de forca|treinei)\b/, "Musculação"], [/\b(yoga|ioga|alonguei|alongamento|pilates)\b/, "Yoga / alongamento"], [/\b(futebol|volei|basquete|tenis|padel)\b/, "Esporte coletivo"]];
const CAP_HAB = [[/^medit/, /\bmedit\w*/], [/^ler$|^leitura/, /\b(li|lendo|leitura|lido)\b/], [/^estud/, /\bestud\w*/], [/^trein|^malh|^exerc/, /\b(treinei|malhei|academia|corri|nadei|pedalei|musculacao)\b/], [/^plane/, /\bplanej\w*/], [/^dorm/, /\b(dormi|deitei)\s+(cedo|antes)/], [/^journal|^escrev/, /\b(journaling|escrevi no diario)\b/], [/^falar|^ligar/, /\b(liguei|telefonei|falei com)\b/], [/^pratic|^rez|^orar/, /\b(rezei|orei|missa|oracao|pratica espiritual)\b/], [/^camin/, /\bcaminhei\b/], [/^beb/, /\bbebi\b/]];
const CAP_MOOD = [[5, /\b(otim[oa]|incrivel|maravilhos[oa]|excelente|radiante|muito bem)\b/], [1, /\b(pessim[oa]|horrivel|terrivel|arrasad[oa]|muito mal)\b/], [4, /\b(bem|feliz|animad[oa]|bom|leve|tranquil[oa]|produtiv[oa])\b/], [2, /\b(mal|cansad[oa]|triste|desanimad[oa]|ansios[oa]|estressad[oa]|irritad[oa]|pesad[oa]|ruim)\b/], [3, /\b(ok|normal|mais ou menos|neutro|razoavel)\b/]];
const capNum = s => parseNum(String(s).replace(/\.(?=\d{3}\b)/g, ""));
/* número para comando: vírgula decimal e sem separador de milhar (o comando lê “1.250” como 1,25) */
const fmtDec = v => String(Math.round(v * 100) / 100).replace(".", ",");
function capMinutes(F) {
  let m = F.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora|horas)\b(?:\s*e\s*(meia|\d+)\s*(?:min|minutos)?)?/); if (m) return Math.round(capNum(m[1]) * 60 + (m[2] === "meia" ? 30 : +m[2] || 0));
  m = F.match(/(\d{1,2})h(\d{2})\b/); if (m) return +m[1] * 60 + +m[2];
  m = F.match(/(\d+)\s*(?:min|mins|minutos|minutinhos)\b/); return m ? +m[1] : null;
}
const capClean = s => String(s || "").replace(/^[\s,:;–-]*(?:(?:no|na|nos|nas|em|de|do|da|com|pelo|pela|num|numa|para|pra|pro|o|a|um|uma|uns|umas|hoje|ontem)\s+)*/i, "").replace(/[\s.,;:!–-]+$/, "").replace(/\s{2,}/g, " ").trim();
const capNoun = s => s.replace(/\balmocei\b/i, "almoço").replace(/\bjantei\b/i, "jantar").replace(/\btomei (um )?caf[eé]\b/i, "café").replace(/\blanchei\b/i, "lanche");
const personTok = n => /\s|[()]/.test(n) ? `@[${n}]` : `@${n}`;
/* acha pessoas cadastradas no trecho; aceita “minha mãe”, nome e primeiro nome */
function capPeople(orig, F) {
  const out = []; for (const p of S.pessoas) {
    const cands = [p.nome, p.nome.replace(/\s*\(.*?\)\s*/g, " ").trim(), p.nome.split(/\s+/)[0]].filter((x, i, a) => x && x.length >= 2 && a.indexOf(x) === i);
    for (const c of cands) { const rx = new RegExp(`(^|[^\\p{L}\\p{N}@])(${fold(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\p{L}\\p{N}])`, "u"), m = F.match(rx);
      if (m) { const i = m.index + m[1].length; out.push({ nome: p.nome, i, len: m[2].length, surf: orig.slice(i, i + m[2].length) }); break; } }
  }
  return out.sort((a, b) => a.i - b.i);
}
function capSplit(orig) {
  const F = fold(orig), cuts = [0], rx = new RegExp(`[;!?\\n]+|\\.(?!\\d)|,\\s*(?=(?:e\\s+)?(?:${CAP_VERBS})\\b)|\\s+e\\s+(?=(?:${CAP_VERBS})\\b)`, "g"); let m;
  while ((m = rx.exec(F))) { cuts.push(m.index, m.index + m[0].length); }
  cuts.push(orig.length); const out = [];
  for (let i = 0; i < cuts.length; i += 2) { const a = cuts[i], b = cuts[i + 1]; const t = orig.slice(a, b); if (t.trim()) out.push({ o: t, F: F.slice(a, b) }); }
  return out;
}
function capParse(text) {
  const lines = [], add = (line, o = {}) => { if (!lines.some(x => x.line === line)) lines.push({ line, ...o }); };
  const whole = fold(text), workout = new Set();
  let prevO = "";
  for (const { o, F } of capSplit(text)) {
    let m;
    /* dinheiro */
    if ((m = F.match(new RegExp(`\\b(recebi|ganhei|entrou|entraram|caiu|cairam|faturei)\\b\\s*(?:o\\s+|a\\s+|uns?\\s+)?${AMT}\\s*(.*)$`)))) { const v = capNum(m[2]); if (v) add(`/receita ${fmtDec(v)} ${capClean(o.slice(m.index + m[0].length - m[3].length)) || capClean(o.slice(0, m.index)) || "Receita"}`); }
    else if ((m = F.match(new RegExp(`\\b(guardei|investi|aportei|poupei|separei)\\b\\s*${AMT}\\s*(.*)$`)))) { const v = capNum(m[2]), rest = capClean(o.slice(m.index + m[0].length - m[3].length)), rf = fold(rest);
      const cat = /reserva|emergencia/.test(rf) ? "Reserva de emergência" : /previd/.test(rf) ? "Previdência" : /invest|acoes|fundo|tesouro|cdb|etf/.test(rf) || m[1] === "investi" ? "Investimentos" : "Objetivo específico";
      if (v) add(`/aporte ${fmtDec(v)} ${findIn(CAT_APO, cat) || CAT_APO[0]}: ${rest || cat}`); }
    else if ((m = F.match(/\bcomprei\s+(.+?)\s+(?:por|a)\s+(?:€|r\$)?\s*(\d+(?:[.,]\d{1,2})?)/))) { const v = capNum(m[2]); if (v) add(`/gasto ${fmtDec(v)} ${capClean(o.slice(m.index + 8, m.index + 8 + m[1].length))}`); }
    else if ((m = F.match(new RegExp(`\\b(gastei|paguei|comprei|torrei|custou|custaram|saiu|sairam|deu)\\b\\s*(?:uns?\\s+|umas?\\s+|quase\\s+|mais de\\s+|cerca de\\s+)?${AMT}\\s*(.*)$`)))) {
      const v = capNum(m[2]); let desc = capClean(o.slice(m.index + m[0].length - m[3].length)); if (!desc) desc = capClean(capNoun(o.slice(0, m.index))) || capClean(capNoun(prevO)).replace(/^(?:e|depois)\s+/i, "");
      if (v) add(`/gasto ${fmtDec(v)} ${capNoun(desc).replace(/@/g, "")}`); }
    else if ((m = F.match(/(?:€|r\$)\s*(\d+(?:[.,]\d{1,2})?)|(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?|reais)\b/))) { const v = capNum(m[1] || m[2]), around = capClean(capNoun((o.slice(0, m.index) + " " + o.slice(m.index + m[0].length)).replace(/\bpor\s*$/i, ""))); if (v && !/\b(meta|guardei|investi)\b/.test(F)) add(`/gasto ${fmtDec(v)} ${around || "gasto"}`); }
    /* sono, passos, peso */
    if ((m = F.match(/\bdormi\s+(?:d[ae]s?\s+)(\d{1,2})(?:[:h](\d{2}))?\s*h?\s+(?:ate|as|a)\s+(?:as\s+)?(\d{1,2})(?:[:h](\d{2}))?/))) { let h = (+m[3] + (+m[4] || 0) / 60) - (+m[1] + (+m[2] || 0) / 60); if (h <= 0) h += 24; if (h > 0 && h <= 16) add(`/sono ${fmtDec(Math.round(h * 4) / 4)}`); }
    else if ((m = F.match(/\b(?:dormi|noite de)\s+(?:umas?\s+|cerca de\s+|quase\s+|so\s+|apenas\s+|mais ou menos\s+)?(\d+(?:[.,]\d+)?)\s*(?:h|horas?)(?:\s*e\s*(meia|\d+)\s*(?:min|minutos)?|(\d{2})\b)?/))) { const h = capNum(m[1]) + (m[2] === "meia" ? .5 : m[2] ? +m[2] / 60 : m[3] ? +m[3] / 60 : 0); if (h > 0 && h <= 16) add(`/sono ${fmtDec(Math.round(h * 4) / 4)}`); }
    if ((m = F.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*(mil)?\s*passos/))) { const v = capNum(m[1]) * (m[2] ? 1000 : 1); if (v) add(`/passos ${Math.round(v)}`); }
    if ((m = F.match(/\b(?:pesei|peso|balanca(?:\s+(?:marcou|deu))?)\s*(?:de\s+|:)?\s*(\d{2,3}(?:[.,]\d{1,2})?)\s*(?:kg|quilos)?/))) { const v = capNum(m[1]); if (v >= 20 && v <= 400) add(`/peso ${fmtDec(v)}`); }
    /* treino */
    for (const [rx, lab] of CAP_TREINO) if (rx.test(F)) { const tipo = findIn(TREINOS, lab) || "Outro", mn = capMinutes(F); workout.add(tipo); add(`/treino ${tipo}${mn ? " " + mn : ""}`); break; }
    /* humor, energia, estresse */
    for (const [k, w] of [["humor", "humor"], ["energia", "energia"], ["estresse", "estresse"]]) if ((m = F.match(new RegExp(`\\b${w}\\s*(?:de|em|:|=|foi|ficou|esta|tava|estava)?\\s*([1-5])\\b`)))) add(`/${k} ${m[1]}`);
    if (!/\bhumor\s*[1-5]/.test(F) && (m = F.match(/\b(?:me sinto|me senti|estou|to|tou|dia foi|hoje foi|o dia foi|foi um dia)\s+(?:muito\s+|bem\s+|meio\s+)?(.{2,24})/))) { const seg = F.slice(m.index); for (const [v, rx] of CAP_MOOD) if (rx.test(seg)) { add(`/humor ${v}`, { inf: true }); break; } }
    /* contatos */
    const tipoC = /\b(videochamada|chamada de video|facetime)\b/.test(F) ? "Videochamada" : /\b(liguei|telefonei|por telefone|ligacao)\b/.test(F) ? "Ligação" : /\b(mensagem|msg|whats|zap|mandei)\b/.test(F) ? "Mensagem" : /\b(almocei|jantei|encontrei|sai|tomei|vi|visitei|fui ver|passei o dia|caminhei|corri|treinei)\b.*\bcom\b|\bencontrei\b|\bvisitei\b/.test(F) ? "Encontro" : /\b(falei|conversei)\b/.test(F) ? "Encontro" : null;
    if (tipoC) { const ps = capPeople(o, F), mn = capMinutes(F); for (const p of ps) add(`/contato ${personTok(p.nome)} ${tipoC}${mn && !/\b(gastei|paguei)\b/.test(F) ? " " + mn : ""}`); }
    /* estudo, leitura, lazer */
    if ((m = F.match(/\bestudei\s+(?:uns?\s+|umas?\s+|por\s+)?(\d+(?:[.,]\d+)?)\s*(h|horas?|min|minutos)\b\s*(?:de|do|da)?\s*(.*)$/))) { const h = /^m/.test(m[2]) ? capNum(m[1]) / 60 : capNum(m[1]); add(`/estudo ${fmtDec(h)} ${capClean(o.slice(m.index + m[0].length - m[3].length)) || "Estudo"}`); }
    else if ((m = F.match(/\bestudei\s+(.+?)\s+(?:por\s+)?(\d+(?:[.,]\d+)?)\s*(h|horas?|min|minutos)\b/))) { const h = /^m/.test(m[3]) ? capNum(m[2]) / 60 : capNum(m[2]); add(`/estudo ${fmtDec(h)} ${capClean(o.slice(m.index + 8, m.index + 8 + m[1].length))}`); }
    if ((m = F.match(/\bli\s+(\d+)\s+paginas?(?:\s+(?:de|do|da)\s+(.+))?/))) { const book = m[2] ? S.aprend.find(a => fold(a.titulo).includes(capClean(m[2]).slice(0, 18))) : null, open = S.aprend.filter(a => a.tipo === "Livro" && a.status === "Em andamento"), it = book || (open.length === 1 ? open[0] : null); if (it) add(`/ler ${m[1]} ${it.titulo}`); }
    if ((m = F.match(/\b(fui ao|fui a|fui num|fui numa|assisti|joguei|toquei|vi um filme|passeei|fiz (?:uma )?trilha)\b(.*)$/)) && /(\d+(?:[.,]\d+)?)\s*(?:h|horas?)\b/.test(F)) { const h = capNum(F.match(/(\d+(?:[.,]\d+)?)\s*(?:h|horas?)\b/)[1]), at = capClean(o.slice(m.index).replace(/\d+(?:[.,]\d+)?\s*(?:h|horas?)\b.*/i, "")); if (h && at) add(`/lazer ${fmtDec(h)} ${at.slice(0, 40)}`); }
    /* tarefas */
    if ((m = F.match(/\b(preciso|tenho que|tenho de|nao (?:posso )?esquecer de|lembrar de|devo|vou ter que)\s+(.+)$/))) { const t = capClean(o.slice(m.index + m[0].length - m[2].length)); if (t.length >= 3) add(`/tarefa ${t}`); }
    prevO = o;
  }
  /* hábitos: verbo no texto inteiro; treino detectado também marca o hábito de treinar */
  for (const h of S.habitos) { const key = fold(h.nome).split(/\s+/)[0], pair = CAP_HAB.find(([k]) => k.test(key)), rx = pair ? pair[1] : new RegExp(`\\b${key.slice(0, Math.max(4, key.length - 2))}\\w*`);
    if (rx.test(whole) || (workout.size && /^trein|^exerc|^malh/.test(key))) add(`/habito ${h.nome}`); }
  return lines;
}
/* texto da entrada: pessoas viram menções */
function capMarkup(text) {
  const F = fold(text), ps = capPeople(text, F); let out = text;
  for (const p of [...ps].reverse()) if (out[p.i - 1] !== "@") out = out.slice(0, p.i) + personTok(p.nome) + out.slice(p.i + p.len);
  return out.trim();
}
function capDate(text) { const F = fold(text); return /\banteontem\b/.test(F) ? addDays(TODAY, -2) : /\bontem\b/.test(F) && !/\bhoje\b/.test(F) ? addDays(TODAY, -1) : TODAY; }
function capRefresh(o = {}) {
  if (!o.keepAI) { const prev = new Map(CAP.items.map(x => [x.line, x])); CAP.items = capParse(CAP.text).map(x => ({ ...x, src: "local", on: prev.has(x.line) ? prev.get(x.line).on : !x.inf && !CAP.off.has(x.line) })); CAP.entrada = ""; CAP.src = "local"; CAP.duvidas = []; if (!o.keepDate) CAP.data = capDate(CAP.text); }
  for (const it of CAP.items) { const r = runCmd(it.line, { date: CAP.data || TODAY, area: "", humor: null }); it.ok = !!r.ok; it.txt = r.ok ? r.txt : r.err; if (!r.ok) it.on = false; }
  for (const id of ["cap_prev", "hj_capprev"]) { const el = document.getElementById(id); if (el) el.innerHTML = capPreviewHTML(id === "hj_capprev" ? "h" : "d"); }
  for (const id of ["cap_n", "hj_capn"]) { const el = document.getElementById(id); if (el) el.textContent = capCountTxt(); }
}
const capCountTxt = () => { const n = CAP.items.filter(x => x.on).length; return n ? plural(n, "registro selecionado", "registros selecionados") + (CAP.diario && CAP.text.trim() ? " + entrada no diário" : "") : CAP.diario && CAP.text.trim() ? "Só a entrada no diário" : "Nada para salvar ainda"; };
const CAP_ICO = { gasto: "coins", receita: "coins", aporte: "coins", sono: "clock", passos: "arrow", peso: "pulse", treino: "pulse", humor: "mood", energia: "bolt", estresse: "pulse", contato: "users", estudo: "book", ler: "book", lazer: "palette", tarefa: "checksq", habito: "repeat", meta: "target" };
function capPreviewHTML(p) {
  if (!CAP.text.trim()) return `<div class="capex"><span class="flbl">Exemplos que o Atlas entende</span><p>“Dormi 7h e meia, corri 30 min. Almocei com o Marco, gastei 18 euros. Preciso ligar para o banco até sexta.”</p><p>“Ontem estudei 1h de italiano, li 20 páginas e meditei. Me sinto bem.”</p></div>`;
  const rows = CAP.items.map((it, i) => { const cmd = it.line.match(/^\/(\p{L}+)/u)?.[1] || ""; return `<div class="capi${it.ok ? "" : " bad"}${it.on ? " on" : ""}"><label class="ckl"><input type="checkbox" data-capon="${i}"${it.on ? " checked" : ""}${it.ok ? "" : " disabled"}><span>${ic(CAP_ICO[norm(cmd)] || "bolt")}<b>${esc(it.txt || it.line)}</b>${it.inf ? `<em class="muted"> · inferido do texto, confira</em>` : ""}${it.src === "ia" ? `<em class="muted"> · IA</em>` : ""}</span></label><input class="capl" id="${p}_cl${i}" data-capline="${i}" value="${esc(it.line)}" aria-label="Comando do registro" spellcheck="false"></div>`; }).join("");
  return `${CAP.entrada ? `<div class="capent"><span class="flbl">Entrada organizada${CAP.src === "ia" ? " pela IA" : ""}</span><div class="ent-body">${renderEntry({ id: "cap", data: CAP.data, texto: CAP.entrada, aplicados: [] }, { ro: true })}</div></div>` : ""}
    ${rows ? `<div class="capis">${rows}</div>` : `<div class="empty">Nenhum registro reconhecido. Ele vai só para o diário; ou use “Organizar com IA”.</div>`}${CAP.duvidas.length ? `<div class="note st-warn">${ic("info")}<span>${CAP.duvidas.map(esc).join(" · ")}</span></div>` : ""}`;
}
function captureFormHTML(p) {
  const ai = !!SAMPLE && !AI_OFF;
  return `<textarea id="${p === "h" ? "hj_cap" : "cap_txt"}" class="captxt" rows="${p === "h" ? 3 : 5}" placeholder="Escreva ou dite o que aconteceu. Ex.: dormi 7h, corri 30 min, almocei com o Marco por 18 euros, preciso ligar para o banco até sexta" aria-label="O que aconteceu">${esc(CAP.text)}</textarea>
    <div class="caprow"><label class="capd">Dia<input type="date" id="${p}_capdata" value="${CAP.data || TODAY}"></label><label class="chk"><input type="checkbox" id="${p}_capdia"${CAP.diario ? " checked" : ""}> Guardar também no diário</label><span class="muted small">${ic("mic")}No celular, toque no microfone do teclado para ditar.</span></div>
    <div id="${p === "h" ? "hj_capprev" : "cap_prev"}" class="capprev">${capPreviewHTML(p)}</div>
    <div class="capfoot"><span class="muted small" id="${p === "h" ? "hj_capn" : "cap_n"}">${capCountTxt()}</span><div class="row wrap">${CAP.busy ? `<button type="button" class="btn sm" data-act="capstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn sm" data-act="capai"${ai && CAP.text.trim() ? "" : " disabled"} title="${ai ? "A IA reescreve a entrada e separa os registros. Você revisa antes de salvar." : "A IA não está disponível nesta visualização"}">${ic("spark")}Organizar com IA</button>`}<button type="button" class="btn sm primary" data-act="capsave"${CAP.text.trim() ? "" : " disabled"}>${ic("check")}Salvar tudo</button></div></div>`;
}
function openCapture(text) {
  if (text != null) { CAP.text = text; capRefresh(); }
  const d = $("#dlg"); d.innerHTML = `<form method="dialog" id="capf" class="wide cap"><div class="caph"><h3>${ic("bolt")}Capturar</h3><button type="button" class="iconbtn" id="capx" aria-label="Fechar">${ic("x")}</button></div><p class="muted small">Um texto só, do jeito que você falaria. O Atlas separa gastos, sono, treino, hábitos, contatos, estudo e tarefas; você confere e salva tudo de uma vez.</p>${captureFormHTML("d")}</form>`;
  if (!d.open) d.showModal(); $("#capx").onclick = () => d.close();
  setTimeout(() => { const t = $("#cap_txt"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 40);
}
function capSave() {
  const date = CAP.data || TODAY, keys = new Set(), applied = []; let humor = null;
  for (const it of CAP.items) if (it.on) { const r = runCmd(it.line, { date, area: "", humor: null }); if (!r.ok) continue; r.apply().forEach(k => keys.add(k)); applied.push(it.line); const hm = it.line.match(/^\/humor\s+([1-5])/); if (hm) humor = +hm[1]; }
  const body = (CAP.entrada || capMarkup(CAP.text)).trim();
  if (CAP.diario && body) { S.diario.push({ id: uid(), data: date, hora: date === TODAY ? nowHM() : "", titulo: "", texto: body + (applied.length ? "\n\n" + applied.join("\n") : ""), humor: humor ?? S.saude[date]?.humor ?? null, energia: S.saude[date]?.energia ?? null, fixado: false, aplicados: [...applied], criado: Date.now(), editado: Date.now(), origem: "captura" }); keys.add("diario"); }
  if (!keys.size) { toast("Nada selecionado para salvar."); return; }
  const n = applied.length; Object.assign(CAP, { text: "", items: [], entrada: "", duvidas: [], data: TODAY, off: new Set() });
  if ($("#dlg").open && $("#capf")) $("#dlg").close();
  touch(...keys, { label: "Captura" }); undoToast(n ? `${plural(n, "registro salvo", "registros salvos")}${keys.has("diario") ? " + entrada no diário" : ""}` : "Entrada salva no diário");
}
async function capAI() {
  if (!SAMPLE || CAP.busy || !CAP.text.trim()) return;
  CAP.busy = true; CAP.ctl = new AbortController(); capRepaint();
  const fin = aiAreaOk("Finanças"), build = ctx => {
    const pes = S.pessoas.filter(p => aiAreaOk(relArea(p.relacao))).map(p => p.nome), habs = S.habitos.filter(h => aiAreaOk(h.area)).map(h => h.nome);
    aiNote("ferr", "relato digitado ou ditado", ctx);
    return `TAREFA: CAPTURA
Você organiza um relato livre (às vezes ditado por voz, com erros de transcrição) em registros do app pessoal "Atlas da Vida". Hoje é ${TODAY} (${DOWL[parse(TODAY).getDay()]}). Dia do relato, salvo indicação no texto: ${CAP.data || TODAY}.
Responda só com JSON neste formato: {"data":"AAAA-MM-DD","entrada":"texto","comandos":["/gasto 18 Restaurantes & cafés: almoço"],"duvidas":["pergunta curta"]}
Regras:
- "entrada": o relato reescrito, limpo, em primeira pessoa, sem acrescentar nada que não foi dito. Marque pessoas cadastradas como @Nome (use @[Nome Composto] quando houver espaço ou parênteses) e use #tema só quando for óbvio.
- "comandos": um por fato registrável, só nestes formatos:
${Object.entries(CMD).filter(([k]) => fin || !["gasto", "receita", "aporte"].includes(k)).map(([k, c]) => `  ${c.ex}  (${c.d})`).join("\n")}
- Pessoas cadastradas: ${pes.join(", ") || "nenhuma"}. Hábitos: ${habs.join(", ") || "nenhum"}. Treinos: ${TREINOS.join(", ")}. Estudo: ${S.aprend.filter(a => a.status === "Em andamento").map(a => a.titulo).join(", ") || "nenhum"}.
${fin ? `- Categorias de despesa: ${Object.keys(CAT_DESP).join(", ")}. Receita: ${CAT_REC.join(", ")}. Aporte: ${CAT_APO.join(", ")}.` : "- Não crie comandos de dinheiro (a pessoa deixou Finanças fora da IA)."}
- Valores com vírgula decimal. Faltou valor, pessoa ou dia? Não invente: escreva a dúvida em "duvidas".
- Não crie humor, energia ou estresse a partir de impressão vaga; só quando a pessoa disser um número ou algo inequívoco.
Relato:
"""${CAP.text.slice(0, 6000)}"""`; };
  try {
    const r = await aiCall("Captura", build, { json: true, signal: CAP.ctl.signal, modelTier: "quick" });
    const cmds = Array.isArray(r?.comandos) ? r.comandos.map(x => String(x).trim()).filter(x => /^\/\p{L}+/u.test(x) && CMD[norm(x.slice(1).split(/\s/)[0])]) : [];
    if (/^\d{4}-\d{2}-\d{2}$/.test(r?.data || "")) CAP.data = r.data;
    CAP.items = cmds.map(line => ({ line, src: "ia", on: true })); CAP.entrada = String(r?.entrada || "").trim(); CAP.duvidas = (Array.isArray(r?.duvidas) ? r.duvidas : []).map(String).slice(0, 4); CAP.src = "ia";
    capRefresh({ keepAI: true });
  } catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { CAP.busy = false; capRepaint(); }
}
function capRepaint() { if ($("#capf")) { const v = CAP.text; $("#capf").innerHTML = `<div class="caph"><h3>${ic("bolt")}Capturar</h3><button type="button" class="iconbtn" id="capx" aria-label="Fechar">${ic("x")}</button></div>${captureFormHTML("d")}`; $("#capx").onclick = () => $("#dlg").close(); } else if (PAGE === "hoje") render(); }
const capDeb = debounce(() => capRefresh(), 220);
function capInput(t) {
  if (t.id === "cap_txt" || t.id === "hj_cap") { CAP.text = t.value; capDeb(); for (const b of $$('[data-act="capsave"],[data-act="capai"]')) b.disabled = !t.value.trim() || (b.dataset.act === "capai" && (!SAMPLE || !!AI_OFF)); return true; }
  return false;
}
function capChange(t) {
  if (t.dataset.capline != null) { const it = CAP.items[+t.dataset.capline]; if (it) { it.line = t.value.trim(); it.on = true; capRefresh({ keepAI: true }); } return true; }
  if (t.id === "d_capdata" || t.id === "h_capdata") { CAP.data = t.value || TODAY; capRefresh({ keepAI: true, keepDate: true }); return true; }
  if (t.id === "d_capdia" || t.id === "h_capdia") { CAP.diario = t.checked; capRefresh({ keepAI: true, keepDate: true }); return true; }
  return false;
}
function capClick(t) {
  const a = t.dataset.act;
  if (a === "cap") { openCapture(); return true; }
  if (t.dataset.capon != null) { const it = CAP.items[+t.dataset.capon]; if (it) { it.on = t.checked; if (!it.on) CAP.off.add(it.line); else CAP.off.delete(it.line); const el = t.closest(".capi"); el?.classList.toggle("on", it.on); for (const id of ["cap_n", "hj_capn"]) { const n = document.getElementById(id); if (n) n.textContent = capCountTxt(); } } return true; }
  if (a === "capsave") { capSave(); return true; }
  if (a === "capai") { capAI(); return true; }
  if (a === "capstop") { CAP.ctl?.abort(); return true; }
  return false;
}
