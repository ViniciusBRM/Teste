
/* ================================================================ busca por significado: “quando foi a última vez que me senti assim?” */
const SEM = { q: "", res: null, busy: false, ctl: null, sim: null, useAI: true, sumBusy: false, sumCtl: null, sumN: 0 };
const EMO = {
  tristeza: ["triste", "trist", "chor", "sozinh", "solid", "saudad", "vazi", "desanim", "deprim", "abatid", "melancol", "perdid", "pra baixo"],
  ansiedade: ["ansios", "ansied", "preocup", "nervos", "medo", "insegur", "tens", "aperto", "trav", "panico", "angust", "apreens"],
  raiva: ["raiva", "irrit", "brav", "frustr", "injust", "descont", "revolt", "impacien"],
  cansaco: ["cansad", "cansac", "exaust", "esgot", "sem energia", "pesad", "dormi mal", "sono ruim", "moid"],
  alegria: ["feliz", "alegr", "leve", "rimos", "riso", "rir", "otim", "incrivel", "divert", "animad", "empolg", "gostos", "maravilh"],
  orgulho: ["orgulh", "conquist", "consegu", "entreg", "venci", "elogi", "realiz", "termin", "aprovad"],
  calma: ["calm", "paz", "tranquil", "seren", "descans", "relax", "devagar"],
  gratidao: ["grat", "agradec", "sorte", "abencoad"],
  conexao: ["abraç", "abrac", "carinho", "junt", "conexao", "amor", "amig", "familia", "conversa"],
};
const EMO_NEG = new Set(["tristeza", "ansiedade", "raiva", "cansaco"]);
const SEM_STOP = new Set([...STOP, "senti", "sinto", "sentir", "vezes", "ultima", "quando", "como", "foi", "estava", "estou", "assim", "algum", "alguma", "tempo", "coisa", "coisas", "fiquei", "ficar"]);
/* radical simples do português: corta sufixos comuns para “cansado/cansada/cansaço” se encontrarem */
function stemPT(w) {
  if (w.length <= 4) return w;
  for (const suf of ["amentos", "imentos", "amento", "imento", "mente", "acoes", "icoes", "ações", "ções", "cao", "ção", "ismos", "ismo", "istas", "ista", "ando", "endo", "indo", "aram", "eram", "iram", "avam", "ados", "adas", "idos", "idas", "ado", "ada", "ido", "ida", "ava", "ei", "ou", "ar", "er", "ir", "as", "es", "os", "a", "o", "s"])
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  return w;
}
const semToks = t => (norm(t).match(/[a-z0-9]+/g) || []).filter(w => w.length >= 3 && !SEM_STOP.has(w)).map(stemPT);
function emoOf(text) { const n = norm(text), o = {}; for (const [k, ws] of Object.entries(EMO)) { const c = ws.filter(w => n.includes(w)).length; if (c) o[k] = c; } return o; }
/* índice local: entradas legíveis neste aparelho (as trancadas só se o cofre estiver aberto) */
function semIndex() {
  return memo("semidx", () => {
    const docs = [], df = {};
    for (const e of S.diario) { const v = viewEntry(e); if (!v) continue; const tx = `${v.titulo || ""} ${v.texto || ""}`, toks = semToks(tx), tf = {}; toks.forEach(t => tf[t] = (tf[t] || 0) + 1); Object.keys(tf).forEach(t => df[t] = (df[t] || 0) + 1); const p = parseEntry(v.texto); docs.push({ e: v, id: e.id, tf, len: toks.length, emo: emoOf(tx), tags: p.tags, people: p.people }); }
    const N = docs.length, avgLen = avg(docs.map(d => d.len)) || 1;
    return { docs, df, N, avgLen };
  });
}
function semScore(q, opts = {}) {
  const I = semIndex(), qt = semToks(q), qe = emoOf(q), qn = norm(q), k1 = 1.4, b = .75;
  const tagQ = (qn.match(/#([a-z0-9_-]+)/g) || []).map(t => t.slice(1)), pesQ = S.pessoas.filter(p => qn.includes(norm(p.nome).split(" ")[0])).map(p => p.nome);
  const neg = Object.keys(qe).some(k => EMO_NEG.has(k)), pos = Object.keys(qe).some(k => !EMO_NEG.has(k));
  const out = [];
  for (const d of I.docs) {
    if (opts.skip && d.id === opts.skip) continue;
    let s = 0; for (const t of new Set(qt)) { const f = d.tf[t]; if (!f) continue; const idf = Math.log(1 + (I.N - I.df[t] + .5) / (I.df[t] + .5)); s += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * d.len / I.avgLen)); }
    let emo = 0; for (const k of Object.keys(qe)) if (d.emo[k]) emo += 1.6 + .3 * Math.min(3, d.emo[k]);
    s += emo; s += tagQ.filter(t => d.tags.includes(t)).length * 2.5 + pesQ.filter(n => d.people.includes(n)).length * 2;
    if (opts.like) { s += opts.like.tags.filter(t => d.tags.includes(t)).length * 1.2 + opts.like.people.filter(n => d.people.includes(n)).length * .8; if (isNum(opts.like.humor) && isNum(d.e.humor)) s += Math.max(0, 1.2 - Math.abs(opts.like.humor - d.e.humor) * .6); }
    if (isNum(d.e.humor)) { if (neg && !pos) s += d.e.humor <= 2 ? 1.1 : d.e.humor >= 4 ? -.8 : 0; if (pos && !neg) s += d.e.humor >= 4 ? 1.1 : d.e.humor <= 2 ? -.8 : 0; }
    if (s > .4) out.push({ id: d.id, e: d.e, s, emo: Object.keys(d.emo).filter(k => qe[k] || opts.like?.emo?.[k]) });
  }
  return out.sort((a, b) => b.s - a.s);
}
const EMO_L = { tristeza: "tristeza", ansiedade: "ansiedade", raiva: "raiva", cansaco: "cansaço", alegria: "alegria", orgulho: "orgulho", calma: "calma", gratidao: "gratidão", conexao: "conexão" };
async function semAsk(q) {
  q = String(q || "").trim(); if (!q) return; SEM.q = q; SEM.sim = null;
  const local = semScore(q).slice(0, 30); SEM.res = { q, items: local.slice(0, 10).map(x => ({ id: x.id, motivo: x.emo.length ? "sentimento parecido: " + x.emo.map(k => EMO_L[k]).join(", ") : "palavras em comum" })), resposta: "", src: "local", n: local.length };
  render();
  if (!SEM.useAI || !SAMPLE || AI_OFF) return;
  const cands = local.filter(x => aiAllowed(S.diario.find(e => e.id === x.id))); if (!cands.length && !Object.keys(S.resumos || {}).length) return;
  SEM.busy = true; SEM.ctl = new AbortController(); render();
  const build = ctx => { const es = aiEntries(cands.map(x => S.diario.find(e => e.id === x.id)), ctx), mo = aiAreaOk("Saúde mental"), rs = Object.entries(S.resumos || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 18);
    return `TAREFA: BUSCA NO DIARIO
Uma pessoa faz uma pergunta ao próprio diário. Encontre as entradas que respondem pelo SIGNIFICADO (sentimentos, situações, padrões), não só por palavras iguais. Português do Brasil.
Responda só com JSON: {"resposta":"2 a 4 frases que respondem à pergunta citando datas","entradas":[{"id":"...","motivo":"até 15 palavras"}]} com no máximo 8 entradas, da mais relevante para a menos. Use apenas ids da lista. Se nada responder, diga isso em "resposta" e devolva lista vazia. Não invente.
Pergunta: """${q.slice(0, 500)}"""
Hoje: ${TODAY}.
${rs.length ? `Resumos mensais já feitos (contexto de período):\n${rs.map(([mk, r]) => `- ${mlabel(mk)}: ${r.texto}`).join("\n")}\n` : ""}Entradas candidatas:
${es.map(e => `- id ${e.id} · ${fmtDY(e.data)}${mo && isNum(e.humor) ? ` · humor ${e.humor}/5` : ""}${e.titulo ? ` · “${e.titulo}”` : ""}: ${snippet(e, 380)}`).join("\n") || "(nenhuma)"}`; };
  try { const r = await aiCall("Busca no diário", build, { json: true, signal: SEM.ctl.signal, modelTier: "quick" }), ok = new Set(cands.map(x => x.id));
    const items = (Array.isArray(r?.entradas) ? r.entradas : []).filter(x => ok.has(String(x.id))).slice(0, 8).map(x => ({ id: String(x.id), motivo: trunc(String(x.motivo || ""), 120) }));
    SEM.res = { q, items: items.length ? items : SEM.res.items, resposta: String(r?.resposta || "").trim(), src: items.length ? "ia" : "local", n: local.length };
  } catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { SEM.busy = false; render(); }
}
function openSimilar(id) {
  const e0 = S.diario.find(x => x.id === id), e = viewEntry(e0); if (!e) { toast("Destranque o cofre para usar esta entrada."); return; }
  const p = parseEntry(e.texto), like = { tags: p.tags, people: p.people, humor: e.humor, emo: emoOf(e.titulo + " " + e.texto) };
  const r = semScore(`${e.titulo || ""} ${e.texto}`, { skip: id, like }).slice(0, 8);
  SEM.sim = { id, data: e.data, titulo: e.titulo || fmtDL(e.data), items: r.map(x => ({ id: x.id, motivo: [x.emo.length && "sentimento: " + x.emo.map(k => EMO_L[k]).join(", "), parseEntry(x.e.texto).tags.filter(t => like.tags.includes(t)).map(t => "#" + t).join(" "), parseEntry(x.e.texto).people.filter(n => like.people.includes(n)).map(n => "@" + n).join(" ")].filter(Boolean).join(" · ") || "palavras em comum" })) };
  DRAWER = null; if (PAGE === "diario" && SUB === "perguntar") render(); else setHash("diario", "perguntar");
}
/* resumos mensais: feitos uma vez, guardados e reaproveitados nas perguntas sobre períodos */
async function semSummarize() {
  if (!SAMPLE || SEM.sumBusy) return; const by = {};
  for (const e of S.diario) if (aiAllowed(e)) (by[mkey(e.data)] ||= []).push(e);
  const todo = Object.entries(by).filter(([mk, es]) => es.length >= 3 && mk < mkey(TODAY) && (!S.resumos?.[mk] || S.resumos[mk].n !== es.length)).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  if (!todo.length) { toast("Os meses com 3 ou mais entradas já estão resumidos."); return; }
  SEM.sumBusy = true; SEM.sumN = 0; SEM.sumCtl = new AbortController(); render();
  try {
    for (const [mk, es] of todo) {
      const r = await aiCall(`Resumo de ${mlabel(mk)}`, ctx => { const ok = aiEntries(es.sort((a, b) => a.data.localeCompare(b.data)), ctx); return `TAREFA: RESUMO MENSAL\nResuma em até 70 palavras, em português do Brasil e em terceira pessoa neutra, o que aconteceu e como a pessoa se sentiu em ${mlabel(mk)}, só com base nestas entradas do diário. Cite temas e situações concretas, sem julgamentos e sem inventar.\n${ok.map(e => `- ${fmtD(e.data)}: ${snippet(e, 300)}`).join("\n")}`; }, { signal: SEM.sumCtl.signal, modelTier: "quick" });
      S.resumos = { ...(S.resumos || {}), [mk]: { texto: trunc(r.text, 600), n: es.length, at: Date.now() } }; SEM.sumN++; touch("resumos", { noUndo: true, noRender: true }); render();
    }
    toast(`${plural(SEM.sumN, "mês resumido", "meses resumidos")}`);
  } catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { SEM.sumBusy = false; render(); }
}
function semResults(res, title) {
  return panel(title, `${res.resposta ? `<div class="semans">${ic("spark")}<div class="mdx">${md(res.resposta)}</div></div>` : ""}${res.items.length ? `<div class="semlist">${res.items.map((x, i) => { const e0 = S.diario.find(e => e.id === x.id), e = viewEntry(e0); return e ? `<div class="semit"><span class="semn">${i + 1}</span>${entryLine(e)}<small class="semwhy">${esc(x.motivo)}</small></div>` : ""; }).join("")}</div>` : `<div class="empty">Nada encontrado com esse sentido. Tente descrever a situação com outras palavras.</div>`}`, { cls: "span2" });
}
function pPerguntar(R) {
  const I = semIndex(), ai = !!SAMPLE && !AI_OFF, rs = Object.entries(S.resumos || {}).sort((a, b) => b[0].localeCompare(a[0]));
  const ex = ["Quando me senti sozinho?", "O que me ajudou das outras vezes que travei?", "Momentos de orgulho no trabalho", "Dias em que o cansaço pesou", "Quando eu ri muito com amigos?"];
  return `<div class="semhead pn"><div class="semin">${ic("search")}<input id="sem_q" type="search" placeholder="Pergunte ao seu diário… ex.: quando foi a última vez que me senti assim?" value="${esc(SEM.q)}" aria-label="Pergunta ao diário"><button type="button" class="btn primary" data-act="semgo">${SEM.busy ? "Pensando…" : "Perguntar"}</button></div>
      <div class="row wrap"><label class="chk"><input type="checkbox" id="sem_ai"${SEM.useAI && ai ? " checked" : ""}${ai ? "" : " disabled"}> Usar a IA para entender a pergunta</label><span class="muted small">${plural(I.N, "entrada legível", "entradas legíveis")} neste aparelho · as protegidas nunca vão para a IA</span></div>
      <div class="tagcloud">${ex.map(q => `<button type="button" class="qchip" data-semq="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>
    <div class="g2c">${SEM.sim ? semResults({ items: SEM.sim.items, resposta: "" }, `${ic("wave")}Parecidas com “${esc(trunc(SEM.sim.titulo, 50))}” <small>${fmtDY(SEM.sim.data)}</small>`) : ""}
      ${SEM.res ? semResults(SEM.res, `${ic("search")}“${esc(trunc(SEM.res.q, 70))}” <small>${SEM.res.src === "ia" ? "a IA reordenou" : "busca local"} · ${plural(SEM.res.n, "candidata", "candidatas")}</small>`) : !SEM.sim ? (() => { const ex0 = semScore(ex[0]).slice(0, 5);
        return semResults({ items: ex0.map(x => ({ id: x.id, motivo: x.emo.length ? "sentimento parecido: " + x.emo.map(k => EMO_L[k]).join(", ") : "palavras em comum" })), resposta: "" }, `${ic("search")}Exemplo: “${esc(ex[0])}” <small>busca local, sem IA · a busca entende variações de palavras (cansado, cansaço), sentimentos parecidos (sozinho, solidão) e o humor do dia; com a IA ligada, ela lê as melhores candidatas e explica</small>`); })() : ""}
      ${panel(`${ic("book")}Resumos mensais <small>${rs.length}</small>`, `<p class="muted small">Resumos curtos de cada mês ajudam a responder perguntas sobre períodos (“como estava em março?”). São feitos uma vez, só com entradas liberadas para a IA, e ficam guardados.</p>${rs.slice(0, 6).map(([mk, r]) => `<details class="fsold"><summary><b>${mlabel(mk)}</b> <span class="muted">${plural(r.n, "entrada", "entradas")}</span></summary><p>${esc(r.texto)}</p></details>`).join("")}<div class="row wrap">${SEM.sumBusy ? `<button type="button" class="btn sm" data-act="semsumstop">${ic("stop")}Parar (${SEM.sumN} feitos)</button>` : `<button type="button" class="btn sm" data-act="semsum"${ai ? "" : " disabled"}>${ic("spark")}Resumir meses que faltam</button>`}</div>`, { cls: "span2" })}</div>`;
}
function semClick(t) {
  const a = t.dataset.act;
  if (a === "semgo") { semAsk($("#sem_q")?.value || ""); return true; }
  if (t.dataset.semq) { const i = $("#sem_q"); if (i) i.value = t.dataset.semq; semAsk(t.dataset.semq); return true; }
  if (a === "semsum") { semSummarize(); return true; }
  if (a === "semsumstop") { SEM.sumCtl?.abort(); return true; }
  return false;
}
function semChange(t) { if (t.id === "sem_ai") { SEM.useAI = t.checked; return true; } return false; }
