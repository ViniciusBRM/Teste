
/* ================================================================ capítulos da vida: fases detectadas nos seus dados, confirmadas por você */
const CH = { sel: null, ai: {}, busy: false, ctl: null, ano: null, opt: { trechos: true, fin: true }, pdf: false };
const CH_FEATS = [["bem", "avg", "humor"], ["sono", "avg", "sono"], ["estresse", "avg", "estresse"], ["hab", "avg", "hábitos"], ["gasto", "sum", "gastos"], ["contatos", "sum", "contatos"], ["estudo", "sum", "estudo"], ["lazer", "sum", "lazer"], ["palavras", "sum", "escrita"]];
const CH_COLS = ["var(--accent)", "var(--a-men)", "var(--a-fin)", "var(--a-car)", "var(--a-apr)", "var(--a-fam)", "var(--a-amo)", "var(--a-laz)", "var(--a-pro)", "var(--a-fis)"];
function chapWeeks() {
  return memo("chweeks", () => {
    const D = DAILY(), by = new Map();
    for (let i = 0; i < D.N; i++) { const wk = weekStart(D.dates[i]); if (!by.has(wk)) by.set(wk, []); by.get(wk).push(i); }
    const out = [];
    for (const [wk, ix] of by) {
      const f = {}; for (const [k, agg] of CH_FEATS) { const c = D.C[k]; if (!c) { f[k] = null; continue; } const v = ix.map(i => c[i]).filter(isNum); f[k] = v.length ? (agg === "sum" ? sum(v) * 7 / ix.length : avg(v)) : null; }
      out.push({ wk, f, tags: {}, people: {}, ents: [] });
    }
    const pos = new Map(out.map((w, i) => [w.wk, i]));
    for (const e of S.diario) { const v = viewEntry(e); if (!v) continue; const i = pos.get(weekStart(e.data)); if (i == null) continue; const w = out[i], p = parseEntry(v.texto); w.ents.push(e.id); p.tags.forEach(t => w.tags[t] = (w.tags[t] || 0) + 1); p.people.forEach(n => w.people[n] = (w.people[n] || 0) + 1); }
    return out.sort((a, b) => a.wk.localeCompare(b.wk));
  });
}
/* segmentação ótima (programação dinâmica) com penalidade por capítulo e mínimo de 4 semanas */
function chapSegments(W, fac = 1.0) {
  const n = W.length; if (n < 8) return n ? [[0, n]] : [];
  const ks = CH_FEATS.map(f => f[0]).filter(k => W.some(w => isNum(w.f[k]))), d = ks.length;
  const X = W.map(() => new Array(d).fill(0));
  /* ruído de cada métrica medido pelas diferenças de uma semana para a seguinte (mediana, robusta a mudanças de fase),
     e não pelo desvio total, que já inclui as próprias fases e deixaria o detector cego para elas */
  const med = a => { const s = [...a].sort((x, y) => x - y), h = s.length >> 1; return s.length ? (s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2) : 0; };
  ks.forEach((k, j) => { const v = W.map(w => w.f[k]).filter(isNum), m = avg(v), sdT = Math.sqrt(variance(v)) || 1, dif = [];
    for (let i = 1; i < n; i++) if (isNum(W[i].f[k]) && isNum(W[i - 1].f[k])) dif.push(Math.abs(W[i].f[k] - W[i - 1].f[k]));
    const sdD = med(dif) / (.6745 * Math.SQRT2), sd = sdD > 1e-9 ? Math.max(.35 * sdT, Math.min(sdD, sdT)) : sdT;
    W.forEach((w, i) => { X[i][j] = isNum(w.f[k]) ? (w.f[k] - m) / sd : 0; }); });
  const S1 = [new Array(d).fill(0)], S2 = [new Array(d).fill(0)];
  for (let i = 0; i < n; i++) { S1.push(S1[i].map((s, j) => s + X[i][j])); S2.push(S2[i].map((s, j) => s + X[i][j] ** 2)); }
  const cost = (a, b) => { let c = 0; const L = b - a; for (let j = 0; j < d; j++) { const s = S1[b][j] - S1[a][j]; c += (S2[b][j] - S2[a][j]) - s * s / L; } return c; };
  const solve = beta => { const F = new Array(n + 1).fill(Infinity), P = new Array(n + 1).fill(0); F[0] = -beta; const mn = 4;
    for (let t = mn; t <= n; t++) for (let s = 0; s <= t - mn; s++) { if (s && s < mn) continue; const v = F[s] + cost(s, t) + beta; if (v < F[t]) { F[t] = v; P[t] = s; } }
    const segs = []; let t = n; while (t > 0) { const s = P[t]; segs.unshift([s, t]); t = s; } return segs; };
  let beta = d * fac * Math.log(n), segs = solve(beta);
  for (let k = 0; k < 6 && segs.length > Math.max(2, Math.round(n / 6)); k++) { beta *= 1.5; segs = solve(beta); }
  return segs;
}
function chapSummary(W, a, b) {
  const seg = W.slice(a, b), rest = [...W.slice(0, a), ...W.slice(b)], f = {};
  for (const [k] of CH_FEATS) { const v = seg.map(w => w.f[k]).filter(isNum), all = W.map(w => w.f[k]).filter(isNum), sd = Math.sqrt(variance(all)) || 1; f[k] = { v: avg(v), z: v.length && all.length ? (avg(v) - avg(all)) / sd : 0 }; }
  const cnt = ws => { const o = {}; ws.forEach(w => Object.entries(w.tags).forEach(([t, c]) => o[t] = (o[t] || 0) + c)); return o; }, ci = cnt(seg), co = cnt(rest);
  const areaTags = new Set(AREAS.map(a => AREA_INFO[a].tag)), tagsAll = Object.entries(ci).filter(([t, c]) => c >= 2 && t !== "privado" && !privateTags().has(t)).map(([t, c]) => [t, c / seg.length - (co[t] || 0) / Math.max(1, rest.length), c]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]);
  const tags = [...tagsAll.filter(x => !areaTags.has(x[0])), ...tagsAll.filter(x => areaTags.has(x[0]))].slice(0, 4);
  const pp = {}; seg.forEach(w => Object.entries(w.people).forEach(([n, c]) => pp[n] = (pp[n] || 0) + c));
  const people = Object.entries(pp).sort((x, y) => y[1] - x[1]).slice(0, 4);
  const ents = seg.flatMap(w => w.ents).map(id => S.diario.find(e => e.id === id)).filter(Boolean);
  return { f, tags, people, ents, ini: seg[0].wk, fim: addDays(seg.at(-1).wk, 6), semanas: seg.length };
}
const CH_DESC = [["bem", 1, "leve"], ["bem", -1, "pesada"], ["sono", -1, "de pouco sono"], ["estresse", 1, "de muito estresse"], ["gasto", 1, "de gastos altos"], ["estudo", 1, "de estudo"], ["contatos", 1, "social"], ["lazer", 1, "de lazer"], ["palavras", 1, "de muita escrita"]];
function chapAutoTitle(sm) {
  const tag = sm.tags[0]?.[0], ds = CH_DESC.filter(([k, s]) => sm.f[k] && sm.f[k].z * s >= .6).sort((x, y) => Math.abs(sm.f[y[0]].z) - Math.abs(sm.f[x[0]].z));
  const ar = tag && AREAS.find(a => AREA_INFO[a].tag === tag);   // tag de área vira o nome da área, com acento
  if (tag) return `Fase ${ar ? ashort(ar) : tag.replace(/-/g, " ")}${ds[0] ? " · " + ds[0][2] : ""}`;
  if (ds[0]) return `Semanas ${ds[0][2] === "leve" ? "leves" : ds[0][2] === "pesada" ? "pesadas" : ds[0][2]}`;
  return `De ${fmtD(sm.ini)} a ${fmtD(sm.fim)}`;
}
/* capítulos: os confirmados mandam; propostas preenchem só o que ninguém confirmou */
function chapList() {
  return memo("chlist", () => {
    const W = chapWeeks(), segs = chapSegments(W), conf = [...(S.capitulos || [])].sort((a, b) => a.inicio.localeCompare(b.inicio)), out = [];
    const wi = d => { let i = W.findIndex(w => w.wk >= weekStart(d)); return i < 0 ? W.length : i; };
    for (const c of conf) { const a = wi(c.inicio), b = Math.max(a + 1, Math.min(W.length, wi(addDays(c.fim, 1)))); if (a >= W.length) continue; out.push({ ...c, conf: true, sm: chapSummary(W, a, b), a, b }); }
    for (const [a, b] of segs) { const ini = W[a].wk, fim = addDays(W[b - 1].wk, 6); if (out.some(c => c.conf && c.inicio <= fim && c.fim >= ini)) continue; const sm = chapSummary(W, a, b), ai = CH.ai[ini]; out.push({ id: "p:" + ini, inicio: ini, fim, titulo: ai?.titulo || chapAutoTitle(sm), nota: ai?.frase || "", conf: false, sm, a, b, ia: !!ai }); }
    return out.sort((x, y) => x.inicio.localeCompare(y.inicio));
  });
}
function chapTimeline(L, w = 900) {
  const W = chapWeeks(); if (!W.length) return emptyChart("Registre algumas semanas para ver a linha do tempo.");
  const H = 168, Lp = 8, Rp = 8, n = W.length, X = i => Lp + i * (w - Lp - Rp) / n, bw = (w - Lp - Rp) / n, Y = v => 150 - (v - 1) / 4 * 76;
  let g = "";
  L.forEach((c, k) => { const x0 = X(c.a), x1 = X(c.b), col = CH_COLS[k % CH_COLS.length], sel = CH.sel === c.id;
    g += `<g class="chseg click" data-chsel="${esc(c.id)}"><rect x="${(x0 + 1).toFixed(1)}" y="6" width="${Math.max(2, x1 - x0 - 2).toFixed(1)}" height="40" rx="6" fill="${col}" fill-opacity="${sel ? .5 : c.conf ? .32 : .14}" stroke="${col}" stroke-width="${sel ? 2 : 1.2}"${c.conf ? "" : ' stroke-dasharray="4 3"'} ${tip(`${c.titulo}\n${fmtDY(c.inicio)} a ${fmtDY(c.fim)} · ${c.sm.semanas} semanas${c.conf ? "" : "\nproposta: toque para ver e confirmar"}`)}/>
      ${x1 - x0 > 46 ? `<text x="${(x0 + 7).toFixed(1)}" y="23" class="chlbl">${esc(trunc(c.titulo, Math.max(4, Math.floor((x1 - x0 - 12) / 6.6))))}</text><text x="${(x0 + 7).toFixed(1)}" y="38" class="ax">${fmtD(c.inicio)}</text>` : ""}</g>`; });
  for (const v of [1, 3, 5]) g += `<line x1="${Lp}" x2="${w - Rp}" y1="${Y(v)}" y2="${Y(v)}" class="gl"/><text x="${w - Rp}" y="${Y(v) - 3}" class="ax" text-anchor="end">${v}</text>`;
  const P = W.map((wk, i) => isNum(wk.f.bem) ? [X(i) + bw / 2, Y(wk.f.bem)] : null), segs = []; let cur = [];
  P.forEach(p => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
  for (const s of segs) g += `<path d="${smoothPath(s)}" fill="none" stroke="var(--ink-2)" stroke-width="1.6" opacity=".8"/>`;
  W.forEach((wk, i) => { if (wk.wk.slice(8, 10) <= "07" && i) g += `<text x="${X(i).toFixed(1)}" y="${H - 2}" class="ax" text-anchor="middle">${mabbr(mkey(addDays(wk.wk, 6)))}</text>`; });
  for (const x of (S.experimentos || []).filter(e => e.status === "concluido" && e.fim)) { const i = W.findIndex(z => z.wk === weekStart(x.fim)); if (i >= 0) g += `<path d="M${(X(i) + bw / 2).toFixed(1)},56 l5,6 -5,6 -5,-6z" class="chmk" ${tip(`Experimento concluído: ${x.titulo}`)}/>`; }
  return `<div class="hscroll">${svgWrap(w, H, g, "Linha do tempo dos capítulos com o humor semanal")}</div><div class="legend"><span><i style="background:var(--accent);opacity:.6"></i>capítulo confirmado</span><span><i class="dash"></i>proposta</span><span><i style="background:var(--ink-2)"></i>humor médio da semana</span><span><i class="dia"></i>experimento concluído</span></div>`;
}
function chapDetail(c) {
  const sm = c.sm, f = sm.f, es = sm.ents.map(viewEntry).filter(e => e && isNum(e.humor)), best = [...es].sort((a, b) => b.humor - a.humor || words(b.texto) - words(a.texto))[0], worst = [...es].sort((a, b) => a.humor - b.humor)[0];
  const dz = (k, fmt) => f[k] && isNum(f[k].v) ? `${fmt(f[k].v)} · ${f[k].z >= .3 ? "acima" : f[k].z <= -.3 ? "abaixo" : "perto"} do seu normal` : "sem dados";
  const tasks = S.tarefas.filter(t => t.status === "Concluída" && t.concluida >= c.inicio && t.concluida <= c.fim).length, exps = (S.experimentos || []).filter(x => x.fim && x.fim >= c.inicio && x.fim <= c.fim);
  return panel(`${ic("chapters")}${esc(c.titulo)} <small>${fmtDY(c.inicio)} a ${fmtDY(c.fim)} · ${plural(sm.semanas, "semana", "semanas")}${c.conf ? " · confirmado" : " · proposta"}</small>`, `
    <div class="krow">${kmini("var(--a-men)", "Humor médio", f.bem && isNum(f.bem.v) ? num(f.bem.v) : "–", dz("bem", v => num(v)).split(" · ")[1] || "")}${kmini("var(--a-fis)", "Sono", f.sono && isNum(f.sono.v) ? num(f.sono.v) + " h" : "–", dz("sono", v => num(v)).split(" · ")[1] || "")}${kmini("var(--a-fin)", "Gasto por semana", f.gasto && isNum(f.gasto.v) ? eur(f.gasto.v) : "–", dz("gasto", eur).split(" · ")[1] || "")}${kmini("var(--accent)", "No diário", sm.ents.length, `${tasks} tarefas concluídas`)}</div>
    <div class="row wrap">${sm.tags.map(([t]) => `<button type="button" class="tg" data-ent="tag|${esc(t)}">#${esc(t)}</button>`).join("")}${sm.people.map(([n, k]) => `<button type="button" class="mn" data-ent="p|${esc(n)}">@${esc(n)} <small>${k}</small></button>`).join("")}</div>
    <div class="form f2"><label class="full">Nome do capítulo<input id="ch_t" value="${esc(c.titulo)}"></label><label class="full">O capítulo em uma frase<input id="ch_n" value="${esc(c.nota || "")}" placeholder="O que essa fase foi para você"></label>
      ${c.conf ? `<label>Começa em<input id="ch_i" type="date" value="${c.inicio}"></label><label>Termina em<input id="ch_f" type="date" value="${c.fim}"></label>` : ""}</div>
    <div class="row wrap">${c.conf ? `<button type="button" class="btn sm primary" data-chsave="${esc(c.id)}">${ic("check")}Salvar</button><button type="button" class="btn sm ghost" data-chunconf="${esc(c.id)}">Desfazer confirmação</button>` : `<button type="button" class="btn sm primary" data-chconf="${esc(c.id)}">${ic("check")}Confirmar capítulo</button><button type="button" class="btn sm" data-chmerge="${esc(c.id)}">Juntar com o próximo</button>`}</div>
    ${exps.length ? `<div class="flbl">Experimentos concluídos nesta fase</div>${exps.map(x => `<div class="li"><span class="t">${esc(x.titulo)}</span>${vpill(expAnalyze(x))}</div>`).join("")}` : ""}
    ${best || worst ? `<div class="flbl">Dias que marcaram</div><div class="bls">${[best, worst].filter((e, i, a) => e && a.indexOf(e) === i).map(entryLine).join("")}</div>` : ""}`, { cls: "span2 chdet", style: `--c:${CH_COLS[Math.max(0, chapList().findIndex(x => x.id === c.id)) % CH_COLS.length]}` });
}
function pCapitulos(R) {
  if (SUB === "livro") return pLivro(R);
  const L = chapList(), sel = L.find(c => c.id === CH.sel), conf = L.filter(c => c.conf).length;
  return `<p class="lead">A vida não anda em meses; anda em fases. O Atlas procura mudanças sustentadas nos seus números semanais (humor, sono, estresse, hábitos, gastos, contatos, estudo, lazer e escrita) e propõe capítulos. Você confirma, ajusta os limites e dá nome.</p>
    ${kpiRow([kmini("var(--accent)", "Capítulos", L.length, `${conf} confirmados · ${L.length - conf} propostas`), kmini("var(--a-men)", "Semanas analisadas", chapWeeks().length, chapWeeks().length ? `desde ${fmtDY(chapWeeks()[0].wk)}` : ""), kmini("var(--a-apr)", "Capítulo atual", L.at(-1) ? esc(trunc(L.at(-1).titulo, 26)) : "–", L.at(-1) ? `desde ${fmtD(L.at(-1).inicio)}` : "")])}
    <div class="g2c">${vis("chtl", "Linha do tempo", chapTimeline(L, Math.max(640, Math.min(1200, (REPW || 900) - 40))), { cls: "span2", sub: "toque num capítulo para ver, nomear e confirmar", nofocus: true, act: `<button type="button" class="btn sm" data-act="chai"${SAMPLE && !AI_OFF && !CH.busy ? "" : " disabled"}>${ic("spark")}${CH.busy ? "Nomeando…" : "Nomear propostas com IA"}</button>` })}
      ${sel ? chapDetail(sel) : ""}
      ${panel(`${ic("list")}Capítulos <small>${L.length}</small>`, L.length ? `<div class="chlist">${[...L].reverse().map((c, k) => `<button type="button" class="chrow${c.id === CH.sel ? " on" : ""}" data-chsel="${esc(c.id)}" style="--c:${CH_COLS[(L.length - 1 - k) % CH_COLS.length]}"><span class="chdot"></span><span class="t"><b>${esc(c.titulo)}</b><small>${fmtD(c.inicio)}/${c.inicio.slice(2, 4)} a ${fmtD(c.fim)}/${c.fim.slice(2, 4)} · ${plural(c.sm.semanas, "semana", "semanas")}${c.nota ? " · " + esc(trunc(c.nota, 60)) : ""}</small></span>${c.conf ? pill("good", "confirmado") : pill("none", c.ia ? "proposta · IA" : "proposta")}</button>`).join("")}</div>` : `<div class="empty">Ainda há poucas semanas de dados para propor capítulos (mínimo de 8).</div>`, { cls: "span2" })}</div>`;
}
async function chapAI() {
  const L = chapList().filter(c => !c.conf); if (!L.length) { toast("Todas as fases já estão confirmadas."); return; }
  CH.busy = true; CH.ctl = new AbortController(); render();
  const build = ctx => { const mo = aiAreaOk("Saúde mental"), fi = aiAreaOk("Saúde física"), fin = aiAreaOk("Finanças");
    [mo && "bem", fi && "sono", mo && "estresse", "hab", fin && "gasto", "contatos", "estudo", "lazer"].filter(Boolean).forEach(k => aiNote("met", k, ctx));
    return `TAREFA: CAPITULOS
Você dá nome às fases da vida de uma pessoa a partir de resumos numéricos e dos temas que distinguem cada fase. Português do Brasil. Nomes curtos (2 a 5 palavras), concretos, sem clichê, sem inventar fatos. Para cada fase, uma frase de até 20 palavras.
Responda só com JSON: {"capitulos":[{"id":"...","titulo":"...","frase":"..."}]}
Fases:
${L.map(c => { const f = c.sm.f, z = k => f[k] && isNum(f[k].v) ? `${num(f[k].v)} (z ${num(f[k].z, 1)})` : "–"; const es = aiEntries(c.sm.ents.filter(e => aiAllowed(e)), ctx);
  return `- id ${c.id}: ${fmtDY(c.inicio)} a ${fmtDY(c.fim)} (${c.sm.semanas} semanas). ${[mo && `humor ${z("bem")}`, fi && `sono ${z("sono")}`, mo && `estresse ${z("estresse")}`, `hábitos ${z("hab")}`, fin && `gastos/semana ${z("gasto")}`, `contatos/semana ${z("contatos")}`, `estudo h/semana ${z("estudo")}`].filter(Boolean).join("; ")}. Temas distintivos: ${c.sm.tags.map(t => "#" + t[0]).join(", ") || "nenhum"}. Títulos de entradas: ${es.map(e => e.titulo).filter(Boolean).slice(0, 6).join(" | ") || "–"}.`; }).join("\n")}`; };
  try { const r = await aiCall("Capítulos", build, { json: true, signal: CH.ctl.signal, modelTier: "quick" }); let n = 0;
    for (const x of Array.isArray(r?.capitulos) ? r.capitulos : []) { const c = L.find(z => z.id === x.id); if (c && x.titulo) { CH.ai[c.inicio] = { titulo: trunc(String(x.titulo), 60), frase: trunc(String(x.frase || ""), 160) }; n++; } }
    VER++; toast(n ? plural(n, "fase nomeada", "fases nomeadas") + ": confirme as que fizerem sentido" : "A IA não devolveu nomes válidos.");
  } catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { CH.busy = false; render(); }
}
function chapClick(t) {
  const ds = t.dataset, L = () => chapList(), find = id => L().find(c => c.id === id);
  if (ds.chsel) { CH.sel = CH.sel === ds.chsel ? null : ds.chsel; render(); return true; }
  if (ds.act === "chai") { chapAI(); return true; }
  if (ds.chconf) { const c = find(ds.chconf); if (!c) return true; const rec = { id: uid(), inicio: c.inicio, fim: c.fim, titulo: ($("#ch_t")?.value || c.titulo).trim(), nota: ($("#ch_n")?.value || c.nota || "").trim() }; S.capitulos = [...(S.capitulos || []), rec]; CH.sel = rec.id; touch("capitulos", { label: "Capítulo confirmado" }); return true; }
  if (ds.chmerge) { const all = L(), i = all.findIndex(c => c.id === ds.chmerge), nx = all[i + 1]; if (i < 0 || !nx) { toast("Não há capítulo depois deste."); return true; } if (nx.conf) { toast("O próximo já está confirmado: ajuste as datas dele."); return true; } const rec = { id: uid(), inicio: all[i].inicio, fim: nx.fim, titulo: all[i].titulo, nota: all[i].nota || "" }; S.capitulos = [...(S.capitulos || []), rec]; CH.sel = rec.id; touch("capitulos", { label: "Capítulos unidos" }); return true; }
  if (ds.chsave) { const c = (S.capitulos || []).find(x => x.id === ds.chsave); if (!c) return true; const i = $("#ch_i")?.value || c.inicio, f = $("#ch_f")?.value || c.fim; if (f < i) { toast("A data final vem antes da inicial."); return true; } Object.assign(c, { titulo: ($("#ch_t")?.value || c.titulo).trim(), nota: ($("#ch_n")?.value || "").trim(), inicio: i, fim: f }); touch("capitulos", { label: "Capítulo editado" }); return true; }
  if (ds.chunconf) { S.capitulos = (S.capitulos || []).filter(x => x.id !== ds.chunconf); CH.sel = null; touch("capitulos", { label: "Confirmação desfeita" }); undoToast("Capítulo voltou a ser proposta"); return true; }
  if (ds.act === "bookpdf") { bookPDF(); return true; }
  if (ds.chano) { CH.ano = ds.chano; render(); return true; }
  return false;
}
function chapChange(t) { if (t.id === "bk_trechos") { CH.opt.trechos = t.checked; return true; } if (t.id === "bk_fin") { CH.opt.fin = t.checked; return true; } return false; }

/* ---------------------------------------------------------------- livro do ano em PDF */
function bookYears() { const ys = new Set([...S.diario.map(e => e.data), ...Object.keys(S.saude), ...S.lanc.map(l => l.data)].filter(Boolean).map(d => d.slice(0, 4))); return [...ys].sort(); }
function bookData(ano) {
  const ini = ano + "-01-01", fim = ano + "-12-31", D = DAILY(), idx = D.dates.map((d, i) => [d, i]).filter(([d]) => d >= ini && d <= fim).map(x => x[1]);
  const col = k => idx.map(i => D.C[k]?.[i]).filter(isNum);
  const ms = []; for (let m = 1; m <= 12; m++) { const mk = `${ano}-${pad(m)}`; ms.push({ mk, bem: avg(idx.filter(i => mkey(D.dates[i]) === mk).map(i => D.C.bem[i]).filter(isNum)) }); }
  const lanc = S.lanc.filter(l => l.data >= ini && l.data <= fim), rec = sum(lanc.filter(l => l.tipo === "Receita").map(l => l.valor)), desp = sum(lanc.filter(l => l.tipo === "Despesa").map(l => l.valor));
  const ents = S.diario.filter(e => e.data >= ini && e.data <= fim).map(viewEntry).filter(Boolean);
  const pc = {}; S.contatos.filter(c => c.data >= ini && c.data <= fim).forEach(c => pc[c.pessoa] = (pc[c.pessoa] || 0) + 1); ents.forEach(e => parseEntry(e.texto).people.forEach(n => pc[n] = (pc[n] || 0) + 1));
  const chs = chapList().filter(c => c.fim >= ini && c.inicio <= fim);
  return { ano, ms, nums: [["Humor médio", num(avg(col("bem"))) + " / 5"], ["Sono médio", num(avg(col("sono"))) + " h"], ["Dias com treino", String(sum(col("treino")))], ["Hábitos cumpridos", pct(avg(col("hab")))], ["Horas de estudo", num(sum(col("estudo")), 0)], ["Livros concluídos", String(S.aprend.filter(a => a.tipo === "Livro" && a.status === "Concluído" && (a.fim || "").startsWith(ano)).length)], ["Contatos com pessoas", String(S.contatos.filter(c => c.data >= ini && c.data <= fim).length)], ["Entradas no diário", String(ents.length)], ["Palavras escritas", num(sum(ents.map(e => words(e.texto))), 0)], ["Tarefas concluídas", String(S.tarefas.filter(t => t.status === "Concluída" && (t.concluida || "").startsWith(ano)).length)], ...(CH.opt.fin ? [["Receitas", eur(rec)], ["Despesas", eur(desp)], ["Guardado", rec ? pct((rec - desp) / rec) + " da receita" : "–"]] : [])],
    pessoas: Object.entries(pc).sort((a, b) => b[1] - a[1]).slice(0, 6), chs, ents, exps: (S.experimentos || []).filter(x => x.status === "concluido" && (x.fim || "").startsWith(ano)), semanas: Object.entries(S.fechamentos || {}).filter(([wk, f]) => wk.startsWith(ano) && f.status === "fechado") };
}
function pLivro(R) {
  const ys = bookYears(), ano = CH.ano && ys.includes(CH.ano) ? CH.ano : ys.at(-1) || TODAY.slice(0, 4), B = bookData(ano);
  return `<p class="lead">Um livro do seu ano, montado com o que você registrou: os números, os capítulos, as pessoas que estiveram perto, os experimentos e trechos do diário. Gerado aqui mesmo, em PDF; entradas trancadas só entram se o cofre estiver aberto.</p>
    <div class="row wrap">${ys.map(y => `<button type="button" class="seg" data-chano="${y}" aria-pressed="${y === ano}">${y}</button>`).join("")}</div>
    <div class="g2c">${panel(`${ic("chapters")}Livro de ${ano}`, `<ol class="bookidx"><li><b>Capa</b> · ${esc(S.cfg.nome || "Atlas da Vida")}</li><li><b>O ano em números</b> · ${B.nums.length} indicadores e o humor mês a mês</li><li><b>Capítulos</b> · ${plural(B.chs.length, "capítulo", "capítulos")}${B.chs.length ? ": " + B.chs.map(c => esc(c.titulo)).join(", ") : ""}</li><li><b>Pessoas do ano</b> · ${B.pessoas.map(p => esc(p[0])).join(", ") || "–"}</li><li><b>O que aprendi</b> · ${plural(B.exps.length, "experimento", "experimentos")} e ${plural(B.semanas.length, "semana fechada", "semanas fechadas")}</li></ol>
      <label class="chk"><input type="checkbox" id="bk_trechos"${CH.opt.trechos ? " checked" : ""}> Incluir trechos do diário</label><label class="chk"><input type="checkbox" id="bk_fin"${CH.opt.fin ? " checked" : ""}> Incluir números de dinheiro</label>
      <div class="row wrap"><button type="button" class="btn primary" data-act="bookpdf"${CH.pdf ? " disabled" : ""}>${ic("download")}${CH.pdf ? "Montando o PDF…" : "Gerar PDF"}</button></div>${DL ? "" : `<p class="note">${ic("info")}Baixar arquivos não está disponível nesta visualização.</p>`}`)}
      ${vis("bkmes", `Humor mês a mês · ${ano}`, lineChart(B.ms.map(m => mabbr(m.mk)), [{ name: "Humor médio", color: "var(--a-men)", data: B.ms.map(m => m.bem) }], { h: 200, legend: false, w: 520, min: 1, max: 5, fmt: v => num(v, 1) }), { sub: "o mesmo gráfico vai para o livro" })}</div>`;
}
const PDF_MAP = { "→": "->", "←": "<-", "✓": "v", "✔": "v", "★": "*", "☐": "[ ]", "≥": ">=", "≤": "<=", "−": "-", "·": "·", " ": " " };
const pdfTxt = s => String(s ?? "").replace(/[→←✓✔★☐≥≤− ]/g, c => PDF_MAP[c] ?? "").replace(/[^\x09\x0a\x0d\x20-\x7e -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, "");
/* texto corrido para o livro: sem linhas que são só ligações ou comandos, sem #temas, ligações e menções viram nome */
const plainMD = s => String(s || "").replace(/^\s*(\[\[[^\]]+\]\]\s*)+$/gm, "").replace(/(^|\s)#[\p{L}\d_-]+/gu, "").replace(/\[\[(?:[^\]:]*:\s*)?([^\]]+)\]\]/g, "$1").replace(/@\[([^\]]+)\]/g, "$1").replace(/(^|\s)@(\S+)/g, "$1$2").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^\s*#{1,4}\s+/gm, "").replace(/^\s*\/.*$/gm, "").replace(/^\s*[-*]\s+\[[ xX]\]\s+/gm, "• ").replace(/\n{3,}/g, "\n\n").trim();
async function loadJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = res; s.onerror = () => rej(new Error("load")); document.head.appendChild(s); });
  return window.jspdf?.jsPDF;
}
async function bookPDF() {
  if (CH.pdf) return; CH.pdf = true; render();
  try {
    const JsPDF = await loadJsPDF(); if (!JsPDF) throw new Error("load");
    const ys = bookYears(), ano = CH.ano && ys.includes(CH.ano) ? CH.ano : ys.at(-1) || TODAY.slice(0, 4), B = bookData(ano);
    const doc = new JsPDF({ unit: "mm", format: "a5" }), PW = 148, PH = 210, M = 16, TW = PW - 2 * M; let y = M, page = 1;
    const ink = [32, 36, 44], mut = [120, 128, 140], acc = [79, 99, 224];
    const foot = () => { doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(...mut); doc.text(pdfTxt(`Atlas da Vida · ${ano}`), M, PH - 8); doc.text(String(page), PW - M, PH - 8, { align: "right" }); };
    const newPage = () => { foot(); doc.addPage(); page++; y = M; };
    const need = h => { if (y + h > PH - 16) newPage(); };
    const para = (t, { size = 10, font = "times", style = "normal", color = ink, gap = 1.6, lh = .42 } = {}) => { doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color); for (const ln of doc.splitTextToSize(pdfTxt(t), TW)) { need(size * lh); doc.text(ln, M, y); y += size * lh; } y += gap; };
    const h1 = t => { need(16); doc.setFont("times", "bold"); doc.setFontSize(19); doc.setTextColor(...ink); doc.text(pdfTxt(t), M, y + 6); y += 12; doc.setDrawColor(...acc); doc.setLineWidth(.6); doc.line(M, y, M + 18, y); y += 6; };
    /* capa */
    doc.setFillColor(22, 26, 34); doc.rect(0, 0, PW, PH, "F"); doc.setTextColor(240, 242, 246); doc.setFont("times", "normal"); doc.setFontSize(54); doc.text(ano, M, 92);
    doc.setFontSize(16); doc.setFont("times", "italic"); doc.text(pdfTxt("O ano em capítulos"), M, 104); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(170, 178, 192); doc.text(pdfTxt(S.cfg.nome || "Atlas da Vida"), M, 186); doc.text(pdfTxt(`Gerado em ${fmtDY(TODAY)} pelo Atlas da Vida 2`), M, 192);
    doc.setFillColor(...acc); doc.rect(M, 110, 22, 1.2, "F"); doc.addPage(); page++; y = M;
    /* números */
    h1("O ano em números"); doc.setFont("helvetica", "normal");
    for (const [l, v] of B.nums) { need(6.3); doc.setFontSize(9); doc.setTextColor(...mut); doc.text(pdfTxt(l), M, y); doc.setFont("helvetica", "bold"); doc.setTextColor(...ink); doc.text(pdfTxt(v), PW - M, y, { align: "right" }); doc.setFont("helvetica", "normal"); doc.setDrawColor(225, 228, 234); doc.setLineWidth(.2); doc.line(M, y + 2, PW - M, y + 2); y += 6.3; }
    y += 4; need(52); doc.setFontSize(9); doc.setTextColor(...mut); doc.text(pdfTxt("Humor médio por mês (1 a 5)"), M, y); y += 4;
    const ch = 32, bw = TW / 12; B.ms.forEach((m, i) => { const v = m.bem; if (isNum(v)) { const h = (v - 1) / 4 * ch; doc.setFillColor(70, 190, 170); doc.rect(M + i * bw + 1, y + ch - h, bw - 2, h, "F"); } doc.setFontSize(6.5); doc.setTextColor(...mut); doc.text(pdfTxt(mabbr(m.mk)), M + i * bw + bw / 2, y + ch + 4, { align: "center" }); });
    y += ch + 10;
    if (B.pessoas.length) { need(20); doc.setFont("times", "bold"); doc.setFontSize(12); doc.setTextColor(...ink); doc.text(pdfTxt("Pessoas do ano"), M, y); y += 6; para(B.pessoas.map(([n, k]) => `${n} (${k})`).join(" · "), { size: 10 }); }
    /* capítulos */
    newPage(); h1("Capítulos");
    if (!B.chs.length) para("Ainda não há capítulos neste ano. Eles aparecem quando houver pelo menos oito semanas de registros.", { style: "italic" });
    B.chs.forEach((c, k) => { need(30); doc.setFont("times", "bold"); doc.setFontSize(14); doc.setTextColor(...ink); for (const ln of doc.splitTextToSize(pdfTxt(`${k + 1}. ${c.titulo}`), TW)) { doc.text(ln, M, y); y += 6; }
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...mut); doc.text(pdfTxt(`${fmtDY(c.inicio)} a ${fmtDY(c.fim)} · ${c.sm.semanas} semanas${c.conf ? "" : " · proposta do Atlas"}`), M, y); y += 5;
      if (c.nota) para(c.nota, { size: 10.5, style: "italic" });
      const f = c.sm.f; para([isNum(f.bem?.v) && `humor ${num(f.bem.v)}`, isNum(f.sono?.v) && `sono ${num(f.sono.v)} h`, isNum(f.hab?.v) && `hábitos ${pct(f.hab.v)}`, CH.opt.fin && isNum(f.gasto?.v) && `${eur(f.gasto.v)} por semana`, c.sm.tags.length && "temas: " + c.sm.tags.map(t => "#" + t[0]).join(" "), c.sm.people.length && "com: " + c.sm.people.map(p => p[0]).join(", ")].filter(Boolean).join(" · "), { size: 8.5, font: "helvetica", color: mut });
      if (CH.opt.trechos) { const es = c.sm.ents.map(viewEntry).filter(e => e && plainMD(e.texto).length > 40).sort((a, b) => (b.humor ?? 0) - (a.humor ?? 0) || words(b.texto) - words(a.texto)).slice(0, 2);
        for (const e of es) { need(14); doc.setDrawColor(...acc); doc.setLineWidth(.5); const y0 = y - 3; para(`${fmtDL(e.data)}${e.titulo ? " · " + e.titulo : ""}`, { size: 8, font: "helvetica", style: "bold", color: mut, gap: .6 }); para(trunc(plainMD(e.texto), 520), { size: 9.5, gap: 2.4 }); doc.line(M - 3, y0, M - 3, y - 3); } }
      y += 4; });
    /* aprendizados */
    newPage(); h1("O que aprendi");
    if (B.exps.length) for (const x of B.exps) { para(x.titulo, { size: 11.5, style: "bold", gap: .6 }); para(x.conclusao || "", { size: 9.5 }); }
    else para("Nenhum experimento concluído neste ano.", { style: "italic" });
    if (B.semanas.length) { y += 2; para(`${plural(B.semanas.length, "semana fechada", "semanas fechadas")} no ano. Aprendizados das últimas:`, { size: 10, style: "bold" }); for (const [wk, f] of B.semanas.slice(-8)) if (f.aprendi) para(`${fmtD(wk)}: ${f.aprendi}`, { size: 9.5 }); }
    y += 6; para("Escrito por você, organizado pelo Atlas da Vida 2.", { size: 9, style: "italic", color: mut });
    foot();
    const ok = await saveFile(`atlas-livro-${ano}.pdf`, doc.output("blob")); if (ok) toast(`Livro de ${ano}: ${plural(page, "página", "páginas")}`);
  } catch (e) { toast(e?.message === "load" ? "Não consegui carregar o gerador de PDF. Verifique a conexão e tente de novo." : "Não foi possível montar o PDF agora."); console.warn(e); }
  finally { CH.pdf = false; render(); }
}
