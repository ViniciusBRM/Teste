
/* ================================================================ diário de cada setor e de cada elemento */
const SJ = { el: {}, q: "", all: {}, lim: {} };
const sjEl = (k, id, l, sub, i, c) => ({ key: `${k}|${id}`, k, id, l, sub, i, c });
const metasIn = as => S.metas.filter(m => as.includes(m.area)).map(m => sjEl("meta", m.id, m.meta, "Meta · " + ashort(m.area), "target", acol(m.area)));
const SJ_DEF = {
  fin: { nome: "Finanças", tag: "financas", areas: ["Finanças"], tags: ["financas", "dinheiro", "compras"], cmds: ["gasto", "receita", "aporte"], c: "var(--a-fin)",
    prompts: ["Uma compra que valeu cada centavo", "Um gasto de que me arrependi, e por quê", "Como me sinto em relação a dinheiro hoje", "Uma decisão financeira que estou adiando", "Se sobrasse dinheiro este mês, para onde ele iria?"],
    els: () => [...metasIn(["Finanças"]), ...S.sonhos.filter(x => +x.custo > 0).map(x => sjEl("sonho", x.id, x.sonho, `Sonho · ${eur(+x.custo)}`, "spark", "var(--a-laz)"))] },
  saude: { nome: "Saúde", tag: "corpo", areas: ["Saúde física", "Saúde mental"], tags: ["corpo", "mente", "saude", "sono", "treino"], cmds: ["sono", "humor", "energia", "estresse", "passos", "peso", "treino"], c: "var(--a-fis)",
    prompts: ["Como o meu corpo está hoje", "O que melhorou (ou piorou) o meu sono", "O treino de hoje: o que eu senti", "O que pesou na cabeça esta semana", "Um sinal do corpo que ando ignorando"],
    els: () => metasIn(["Saúde física", "Saúde mental"]) },
  hab: { nome: "Hábitos", tag: "habitos", areas: [], tags: ["habito", "habitos", "rotina"], kinds: ["hab"], cmds: ["habito"], c: "var(--a-men)",
    prompts: ["O hábito que mais custou hoje, e o que ajudou", "Quando eu falho, o que vem antes?", "Gatilho, rotina e recompensa: como funcionou", "Um hábito que quero ajustar (sem abandonar)", "O que mudou desde que comecei"],
    els: () => S.habitos.map(h => sjEl("hab", h.id, h.nome, "Hábito · " + ashort(h.area), "repeat", acol(h.area))) },
  metas: { nome: "Metas & tarefas", tag: "metas", areas: [], tags: ["metas", "meta", "projeto", "planejamento"], kinds: ["meta", "tar", "proj"], cmds: ["meta", "tarefa"], c: "var(--accent)",
    prompts: ["Por que esta meta ainda importa", "O próximo passo menor possível", "O que está travando o avanço", "Uma vitória pequena desta semana", "Se eu desistisse, o que perderia?"],
    els: () => [...S.metas.map(m => sjEl("meta", m.id, m.meta, "Meta · " + ashort(m.area), "target", acol(m.area))), ...[...new Set(S.tarefas.map(t => t.projeto).filter(Boolean))].map(p => sjEl("proj", p, p, "Projeto", "flag", "var(--accent)"))] },
  pessoas: { nome: "Relações", tag: "relacoes", areas: ["Família", "Amor & parceria", "Amizades & social"], tags: ["relacoes", "familia", "amor", "amizades"], kinds: ["p"], cmds: ["contato"], c: "var(--a-fam)",
    prompts: ["Uma conversa que ficou comigo", "Alguém de quem sinto falta", "O que eu admiro nessa pessoa", "Algo que quero dizer e ainda não disse", "Como posso estar mais presente"],
    els: () => S.pessoas.map(p => sjEl("p", p.nome, p.nome, p.relacao || "Pessoa", "users", acol(relArea(p.relacao)))) },
  cresc: { nome: "Crescimento", tag: "aprendizado", areas: ["Carreira", "Aprendizado", "Lazer & criatividade"], tags: ["carreira", "aprendizado", "lazer", "estudo"], kinds: ["apr", "sonho"], cmds: ["estudo", "lazer", "ler"], c: "var(--a-apr)",
    prompts: ["O que aprendi hoje, com as minhas palavras", "Uma ideia que quero testar", "Onde quero estar daqui a um ano", "Um momento que me recarregou", "O trecho (ou a aula) que ficou comigo"],
    els: () => [...S.aprend.map(a => sjEl("apr", a.id, a.titulo, `${a.tipo || "Item"} · ${a.status || ""}`, "book", acol(a.area || "Aprendizado"))), ...metasIn(["Carreira", "Aprendizado", "Lazer & criatividade"]), ...S.sonhos.map(x => sjEl("sonho", x.id, x.sonho, "Sonho · " + (x.status || ""), "spark", "var(--a-laz)"))] },
  casa: { nome: "Casa & docs", tag: "casa", areas: ["Casa & organização"], tags: ["casa", "documentos", "organizacao"], kinds: ["doc"], c: "var(--a-cas)",
    prompts: ["O canto da casa que mais me incomoda", "Uma pendência de papelada para resolver", "Como eu quero que a casa se sinta", "O que posso doar ou descartar"],
    els: () => [...S.docs.map(d => sjEl("doc", d.id, d.doc, d.validade ? "Documento · vence " + fmtD(d.validade) : "Documento", "file", "var(--a-cas)")), ...metasIn(["Casa & organização"])] },
  roda: { nome: "Roda da Vida", tag: "roda", areas: [], tags: ["roda", "revisao", "equilibrio"], c: "var(--accent)",
    prompts: ["Qual área pediu mais atenção esta semana", "Onde me sinto em equilíbrio", "Uma área que deixei de lado, e por quê", "O que mudaria a nota dessa área no mês que vem"],
    els: () => AREAS.filter(aativa).map(a => sjEl("area", a, ashort(a), "Área da vida", AREA_INFO[a].ico, acol(a))) },
};
function entTok(k, id) {
  if (k === "p") return /\s|[()]/.test(id) ? `@[${id}]` : `@${id}`;
  if (k === "tag") return `#${id}`;
  if (k === "area") return `#${AREA_INFO[id]?.tag || slug(id)}`;
  const f = { meta: () => ["Meta", S.metas.find(x => x.id === id)?.meta], tar: () => ["Tarefa", S.tarefas.find(x => x.id === id)?.tarefa], proj: () => ["Projeto", id],
    apr: () => { const a = S.aprend.find(x => x.id === id); return [a?.tipo === "Livro" ? "Livro" : "Curso", a?.titulo]; }, doc: () => ["Documento", S.docs.find(x => x.id === id)?.doc],
    sonho: () => ["Sonho", S.sonhos.find(x => x.id === id)?.sonho], hab: () => ["Hábito", S.habitos.find(x => x.id === id)?.nome] }[k];
  const [w, l] = f ? f() : []; return l ? `[[${w}: ${l}]]` : "";
}
const ENT_PAGE = { p: "pessoas", meta: "metas", tar: "metas", proj: "metas", apr: "cresc", sonho: "cresc", doc: "casa", hab: "hab", area: "roda" };
function entPage(k, id) { if (ENT_PAGE[k]) return ENT_PAGE[k]; if (k === "tag") { const a = tagArea(id); return a ? Object.keys(SJ_DEF).find(p => SJ_DEF[p].areas.includes(a)) || "roda" : null; } return null; }
const moodOf = e => isNum(e.humor) ? +e.humor : isNum(S.saude[e.data]?.humor) ? +S.saude[e.data].humor : null;
const byDate = (a, b) => (b.data + (b.hora || "")).localeCompare(a.data + (a.hora || ""));
function inSector(def, e) {
  const p = parseEntry(e.texto);
  return p.areas.some(a => def.areas.includes(a)) || p.tags.some(t => def.tags.includes(t)) || p.links.some(l => def.kinds?.includes(l.k)) || (def.kinds?.includes("p") && p.people.length > 0) || p.cmds.some(c => def.cmds?.includes(c.name));
}
function elEntries(el) { return el.k === "area" ? S.diario.filter(e => parseEntry(e.texto).areas.includes(el.id)).sort(byDate) : backlinks(el.k, el.id); }
function sjData(pg) {
  return memo("sj:" + pg, () => {
    const def = SJ_DEF[pg], ents = (pg === "roda" ? S.diario.filter(e => parseEntry(e.texto).areas.length) : S.diario.filter(e => inSector(def, e))).sort(byDate);
    const els = def.els(), seen = new Set(els.map(x => x.key)), tc = {};
    if (pg !== "roda") for (const e of ents) for (const t of parseEntry(e.texto).tags) if (!def.tags.includes(t) && !AREAS.some(a => AREA_INFO[a].tag === t)) tc[t] = (tc[t] || 0) + 1;
    for (const t of Object.keys(tc)) if (!seen.has("tag|" + t)) els.push(sjEl("tag", t, "#" + t, "Tema", "hash", tagArea(t) ? acol(tagArea(t)) : def.c));
    for (const x of els) { const es = elEntries(x); x.n = es.length; x.last = es[0]?.data || ""; x.mood = avg(es.map(moodOf).filter(isNum)); }
    els.sort((a, b) => (b.n - a.n) || (b.last || "").localeCompare(a.last || "") || a.l.localeCompare(b.l));
    return { def, ents, els };
  });
}
function newDraft(preset = {}) { return { data: TODAY, hora: nowHM(), titulo: "", texto: "", humor: S.saude[TODAY]?.humor ?? null, energia: S.saude[TODAY]?.energia ?? null, apply: true, ...preset }; }
function focusComposer() { setTimeout(() => { const t = $("#dz_texto"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); t.scrollIntoView({ block: "center", behavior: "smooth" }); } }, 80); }
/* abre o diário do setor certo com o elemento selecionado e o editor já marcado */
function writeAbout(k, id, preset = {}) {
  const pg = entPage(k, id), tok = entTok(k, id);
  DIA.draft = newDraft({ texto: tok ? tok + " " : "", ...preset }); storeDraft(); DRAWER = null;
  if (!pg) { setHash("diario", "feed"); focusComposer(); return; }
  SJ.el[pg] = `${k}|${id}`;
  if (location.hash.slice(1) === pg + ".diario") render(); else location.hash = pg + ".diario";
  focusComposer();
}
function sjWeeks(list) {
  const N = 26, end = addDays(TODAY, -((parse(TODAY).getDay() + 6) % 7)), wk = [];
  for (let i = N - 1; i >= 0; i--) { const s = addDays(end, -7 * i), e7 = addDays(s, 6), es = list.filter(e => e.data >= s && e.data <= e7); wk.push({ s, n: es.length, m: avg(es.map(moodOf).filter(isNum)) }); }
  const mx = Math.max(1, ...wk.map(w => w.n)), W = 8, G = 3, H = 38;
  return `<svg class="sjw" viewBox="0 0 ${N * (W + G) - G} ${H}" preserveAspectRatio="none" role="img" aria-label="Entradas por semana nas últimas 26 semanas">${wk.map((w, i) => { const h = w.n ? Math.max(4, H * w.n / mx) : 2, c = !w.n ? "var(--line-2)" : w.m == null ? "var(--accent)" : w.m >= 4 ? "var(--good)" : w.m <= 2.5 ? "var(--crit)" : "var(--warn)";
    return `<rect x="${i * (W + G)}" y="${H - h}" width="${W}" height="${h}" rx="2" fill="${c}"><title>Semana de ${fmtD(w.s)}: ${plural(w.n, "entrada", "entradas")}${w.m != null ? ` · humor ${num(w.m)}` : ""}</title></rect>`; }).join("")}</svg>`;
}
function sjMemories(list) {
  const out = []; for (const [d, l] of [[30, "Há um mês"], [91, "Há três meses"], [182, "Há seis meses"], [365, "Há um ano"]]) {
    const c = addDays(TODAY, -d), e = list.find(x => x.data >= addDays(c, -3) && x.data <= addDays(c, 3)); if (e && !out.some(o => o[1].id === e.id)) out.push([l, e]); }
  return out;
}
function sjCo(list, skip) {
  const c = {}; for (const e of list) { const p = parseEntry(e.texto);
    for (const n of p.people) c["p|" + n] = (c["p|" + n] || 0) + 1; for (const t of p.tags) c["tag|" + t] = (c["tag|" + t] || 0) + 1;
    for (const l of p.links) if (l.k !== "x" && l.k !== "dia") c[`${l.k}|${l.id}`] = (c[`${l.k}|${l.id}`] || 0) + 1; }
  return Object.entries(c).filter(([k]) => k !== skip).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => { const [kk, ...r] = k.split("|"), id = r.join("|");
    const l = kk === "p" ? "@" + id : kk === "tag" ? "#" + id : (resolveLink(entTok(kk, id).slice(2, -2)).l || id);
    return `<button type="button" class="${kk === "p" ? "mn" : kk === "tag" ? "tg" : "lk k-" + kk}" data-ent="${esc(k)}">${esc(trunc(l, 34))} <small>${n}</small></button>`; }).join("");
}
function pSetorDiario(R) {
  const pg = PAGE, { def, ents, els } = sjData(pg), base = diaryStats().base;
  const selKey = SJ.el[pg] && els.some(x => x.key === SJ.el[pg]) ? SJ.el[pg] : null, sel = selKey ? els.find(x => x.key === selKey) : null;
  const scope = sel ? elEntries(sel) : ents, q = norm(SJ.q), list = q ? scope.filter(e => norm(e.titulo + " " + e.texto).includes(q)) : scope;
  const mood = avg(scope.map(moodOf).filter(isNum)), month = scope.filter(e => mkey(e.data) === mkey(TODAY)).length, wds = sum(scope.map(e => words(e.texto)));
  let wstreak = 0; for (let i = 0; ; i++) { const s = addDays(TODAY, -((parse(TODAY).getDay() + 6) % 7) - 7 * i); if (scope.some(e => e.data >= s && e.data <= addDays(s, 6))) wstreak++; else if (i > 0) break; if (i > 104) break; }
  const name = sel ? sel.l : def.nome, col = sel?.c || def.c;
  const hero = `<section class="sjhero" style="--c:${col}"><div class="sjh-t"><div class="crumb">${sel ? `Diário de ${esc(def.nome)} · ${esc(sel.sub)}` : "Diário do setor"}</div><h2>${sel ? ic(sel.i) : ""}${esc(name)}</h2>
      <p>${scope.length ? `${plural(scope.length, "entrada", "entradas")} · última ${relDay(scope[0].data)}` : sel ? "Nada escrito sobre isso ainda. Comece abaixo." : "Nada escrito neste setor ainda. Comece abaixo."}</p></div>
    <div class="sjk">${kmini(col, "Este mês", month, plural(month, "entrada", "entradas"))}${kmini("var(--a-men)", "Humor nesses dias", num(mood), mood != null && base != null ? `${sgn(mood - base)} vs. média ${num(base)}` : "poucos dados", mood != null && base != null ? (mood - base >= .2 ? "good" : mood - base <= -.2 ? "crit" : "") : "")}${kmini("var(--a-apr)", "Semanas seguidas", wstreak, "com pelo menos uma entrada")}${kmini("var(--a-car)", "Palavras", num(wds, 0), scope.length ? `${num(wds / scope.length, 0)} por entrada` : "")}</div>
    <div class="sjh-w"><span class="flbl">Últimas 26 semanas</span>${sjWeeks(scope)}</div></section>`;
  const showAll = SJ.all[pg], vis = showAll ? els : els.slice(0, 11);
  const chips = `<section class="sjels" aria-label="Elementos de ${esc(def.nome)}"><button type="button" class="sjel all" data-sjel="" aria-pressed="${!sel}" style="--c:${def.c}">${ic("book")}<span class="sje-t"><b>Todo o setor</b><small>${plural(ents.length, "entrada", "entradas")}</small></span></button>
    ${vis.map(x => `<button type="button" class="sjel${x.n ? "" : " zero"}" data-sjel="${esc(x.key)}" aria-pressed="${x.key === selKey}" style="--c:${x.c}">${ic(x.i)}<span class="sje-t"><b>${esc(x.l)}</b><small>${x.n ? `${plural(x.n, "entrada", "entradas")} · ${relDay(x.last)}` : esc(x.sub)}</small></span>${x.mood != null ? `<i class="md m${clamp(Math.round(x.mood), 1, 5)}" title="Humor médio ${num(x.mood)}">${num(x.mood)}</i>` : ""}</button>`).join("")}
    ${els.length > 11 ? `<button type="button" class="sjel more" data-sjall="1">${ic(showAll ? "x" : "plus")}<span class="sje-t"><b>${showAll ? "Mostrar menos" : `Ver todos (${els.length})`}</b><small>${showAll ? "voltar aos principais" : "inclui os ainda sem entradas"}</small></span></button>` : ""}</section>`;
  const tok = sel ? entTok(sel.k, sel.id) : `#${def.tag}`, qd = def.prompts[(parse(TODAY).getDate() + pg.length) % def.prompts.length];
  const opener = DIA.draft ? composerHTML() : `<button type="button" class="czopen sjopen" data-sjnew="1" style="--c:${col}">${ic("pen")}<span>${sel ? `Escrever sobre ${esc(sel.l)}…` : `Escrever no diário de ${esc(def.nome)}…`}</span><small>já vem marcado com <code>${esc(tok)}</code> · aparece aqui, no diário geral e nos cruzamentos</small></button>`;
  const shown = list.slice(0, SJ.lim[pg] || 30), byM = {};
  for (const e of shown) (byM[mkey(e.data)] ||= []).push(e);
  const feed = Object.entries(byM).map(([k, es]) => `<div class="mgroup"><div class="mhead">${mlabel(k)}<small>${plural(es.length, "entrada", "entradas")}</small></div>${es.map(e => entryCard(e)).join("")}</div>`).join("")
    + (list.length > shown.length ? `<button type="button" class="btn" data-sjmore="1">${ic("plus")}Mostrar mais ${Math.min(30, list.length - shown.length)} de ${list.length - shown.length}</button>` : "");
  const empty = `<div class="emptyb">${ic("pen")}<b>${q ? "Nenhuma entrada com essa busca." : sel ? `Ainda não há entradas sobre ${esc(sel.l)}.` : "Este setor ainda não tem entradas."}</b><span>${q ? "Limpe a busca para ver tudo." : `Use uma das perguntas ao lado ou escreva livremente. Tudo que você marcar com ${esc(tok)} cai aqui automaticamente.`}</span></div>`;
  const months = []; for (let i = 11; i >= 0; i--) { const m = addMonth(mkey(TODAY), -i); months.push([mabbr(m), scope.filter(e => mkey(e.data) === m).length]); }
  const mem = sjMemories(scope), co = sjCo(scope, selKey);
  const focus = sel ? panel(`${ic(sel.i)}${esc(trunc(sel.l, 40))}`, `<div class="muted small">${esc(sel.sub)}${scope.length ? ` · primeira menção ${fmtDY(scope.at(-1).data)}` : ""}</div>
      ${colChart(months.map(m => m[0]), [{ name: "Entradas", color: col, data: months.map(m => m[1]) }], { h: 120, legend: false, w: 300 })}
      <div class="row wrap">${sel.k === "area" ? `<a class="btn sm" href="#mentor.${AREA_INFO[sel.id].id}">${ic("spark")}Mentor de ${esc(ashort(sel.id))}</a>` : `<button type="button" class="btn sm" data-ent="${esc(sel.key)}">${ic("file")}Abrir ficha</button>`}<button type="button" class="btn sm" data-sjask="1"${scope.length ? "" : " disabled"}>${ic("spark")}Perguntar ao mentor</button></div>`, { cls: "sjfocus", style: `--c:${col}` })
    : panel(`${ic("spark")}Pergunta do dia`, `<p class="sjq">${esc(qd)}</p><button type="button" class="btn sm primary" data-sjp="${def.prompts.indexOf(qd)}">${ic("pen")}Responder no diário</button>`, { cls: "sjfocus", style: `--c:${col}` });
  const side = `<aside class="sjside">${focus}
    ${panel(`${ic("list")}Para começar a escrever`, `<div class="sjps">${def.prompts.map((p, i) => `<button type="button" class="sjp" data-sjp="${i}">${esc(p)}</button>`).join("")}</div>`)}
    ${co ? panel(`${ic("link")}Aparece junto <small>nessas entradas</small>`, `<div class="tagcloud">${co}</div>`) : ""}
    ${mem.length ? panel(`${ic("clock")}Lembranças`, `<div class="bls">${mem.map(([l, e]) => `<div class="flbl">${l}</div>${entryLine(e)}`).join("")}</div>`) : ""}</aside>`;
  return `<div class="sj">${hero}${chips}<div class="sjbody">${side}<div class="sjmain"><div class="dhead">${opener}</div>
    <div class="dsearch sjsearch">${ic("search")}<input id="sj_q" type="search" placeholder="Buscar ${sel ? "nas entradas sobre " + esc(trunc(sel.l, 30)) : "no diário de " + esc(def.nome)}" value="${esc(SJ.q)}" aria-label="Buscar neste diário"></div>
    ${feed || empty}</div></div></div>`;
}
function sjClick(t) {
  const ds = t.dataset;
  if (ds.sjel != null) { SJ.el[PAGE] = ds.sjel || null; SJ.lim[PAGE] = 30; render(); return true; }
  if (ds.sjall) { SJ.all[PAGE] = !SJ.all[PAGE]; render(); return true; }
  if (ds.sjmore) { SJ.lim[PAGE] = (SJ.lim[PAGE] || 30) + 30; render(); return true; }
  if (ds.sjnew || ds.sjp != null) {
    const def = SJ_DEF[PAGE]; if (!def) return false; const [k, ...r] = (SJ.el[PAGE] || "").split("|"), id = r.join("|"), tok = SJ.el[PAGE] ? entTok(k, id) : `#${def.tag}`;
    const pr = ds.sjp != null ? def.prompts[+ds.sjp] : "";
    DIA.draft = newDraft({ titulo: pr, texto: tok ? tok + " " : "" }); storeDraft(); render(); focusComposer(); return true;
  }
  if (ds.sjask) {
    const sel = SJ.el[PAGE], { els, ents, def } = sjData(PAGE), x = els.find(e => e.key === sel); if (!x) return true;
    const es = elEntries(x).slice(0, 8), a = x.k === "area" ? x.id : x.k === "p" ? relArea(S.pessoas.find(p => p.nome === x.id)?.relacao) : x.k === "hab" ? S.habitos.find(h => h.id === x.id)?.area : x.k === "meta" ? S.metas.find(m => m.id === x.id)?.area : def.areas[0];
    const mid = a && AREA_INFO[a] ? AREA_INFO[a].id : "conselho";
    MST.input[mid] = `Releia o que escrevi sobre ${x.l} no meu diário (${plural(x.n, "entrada", "entradas")}, as mais recentes abaixo) e me diga o que se repete, o que mudou e um próximo passo.\n\n${es.map(e => `--- ${fmtDL(e.data)}${e.titulo ? " · " + e.titulo : ""}\n${trunc(e.texto, 600)}`).join("\n")}`;
    setHash("mentor", mid); return true;
  }
  if (ds.jw) { const [k, ...r] = ds.jw.split("|"); writeAbout(k, r.join("|")); return true; }
  return false;
}
