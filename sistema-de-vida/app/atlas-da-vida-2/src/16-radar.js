
/* ================================================================ radar: alertas antecipados, com evidência e conferência posterior */
/* contas fixas: mesma descrição, cerca de uma vez por mês, em pelo menos 2 dos 3 meses completos anteriores, e estável:
   valor quase igual (variação ≤ 5%) ou mesmo dia do mês (±3 dias, contando a virada) com valor parecido (≤ 25%).
   Assim aluguel, assinatura e conta de luz entram; a pizzaria que por acaso aparece uma vez por mês, não. */
const daySpread = ds => { const s = [...ds].sort((a, b) => a - b); let gap = s[0] + 31 - s.at(-1); for (let i = 1; i < s.length; i++) gap = Math.max(gap, s[i] - s[i - 1]); return 31 - gap; };
function fixedItems() {
  return memo("fixed", () => {
    const ms = [1, 2, 3].map(k => addMonth(mkey(TODAY), -k)), by = {};
    for (const l of S.lanc) { if (l.tipo !== "Despesa" || !l.data || !ms.includes(mkey(l.data))) continue; const k = l.cat + "|" + norm(l.desc), o = by[k] ||= { cat: l.cat, desc: l.desc, key: norm(l.desc), months: new Set(), vals: [], days: [] }; o.months.add(mkey(l.data)); o.vals.push(+l.valor || 0); o.days.push(+l.data.slice(8)); }
    return Object.values(by).filter(o => { if (o.months.size < 2 || o.vals.length > o.months.size + 1) return false; const m = avg(o.vals), cv = m > 0 ? Math.sqrt(variance(o.vals)) / m : 1;
      return cv <= .05 || (daySpread(o.days) <= 3 && cv <= .25); }).map(o => ({ cat: o.cat, desc: o.desc, key: o.key, valor: avg(o.vals), dia: Math.round(avg(o.days)) }));
  });
}
const isFixed = l => l.tipo === "Despesa" && fixedItems().some(f => f.cat === l.cat && f.key === norm(l.desc));
/* orçamento: contas fixas entram uma vez, no valor de sempre; o resto do mês é simulado com os gastos variáveis reais dos últimos 90 dias */
function radarBudget() {
  return memo("radbud", () => {
    const mk = mkey(TODAY), R = calcAt(mk), day = +TODAY.slice(8), rem = dim(mk) - day, out = [], FX = fixedItems();
    const days = []; for (let k = 90; k >= 1; k--) days.push(addDays(TODAY, -k));
    const varDaily = filt => { const m = {}; for (const l of S.lanc) if (l.tipo === "Despesa" && l.data >= days[0] && l.data < TODAY && filt(l) && !isFixed(l)) m[l.data] = (m[l.data] || 0) + (+l.valor || 0); return days.map(d => m[d] || 0); };
    const pend = filt => sum(FX.filter(f => filt({ cat: f.cat }) && !S.lanc.some(l => l.tipo === "Despesa" && mkey(l.data || "") === mk && l.cat === f.cat && norm(l.desc) === f.key)).map(f => f.valor));
    /* “estourar” = passar do teto com folga (3% ou € 2), para centavos não virarem alerta */
    const sim = (spent, fixedPend, plan, daily, seed) => {
      const rnd = mulberry32(seed), N = 800, cross = [], tots = [], lim = plan + Math.max(plan * .03, 2); let over = 0;
      for (let s = 0; s < N; s++) { let acc = spent + fixedPend, at = acc > lim ? 0 : null; for (let k = 1; k <= rem; k++) { acc += daily[(rnd() * daily.length) | 0]; if (at == null && acc > lim) at = k; } tots.push(acc); if (acc > lim) { over++; cross.push(at); } }
      cross.sort((a, b) => a - b); tots.sort((a, b) => a - b); const q = f => cross.length ? cross[Math.min(cross.length - 1, Math.floor(cross.length * f))] : null;
      return { p: over / N, med: tots[N >> 1], d25: q(.25), d50: q(.5), d75: q(.75) };
    };
    for (const c of Object.keys(S.orc).filter(c => +S.orc[c] > 0)) {
      const filt = l => l.cat === c, daily = varDaily(filt), plan = +S.orc[c], spent = R.fin.cat[c] || 0, fp = pend(filt);
      if (!daily.some(v => v) && !fp) { out.push({ cat: c, plan, spent, fixo: 0, p: spent > plan ? 1 : 0, med: spent, over: spent > plan }); continue; }
      const r = sim(spent, fp, plan, daily, hashStr(c + mk));
      out.push({ cat: c, plan, spent, fixo: fp, ...r, over: spent > plan, date: r.d50 != null ? addDays(TODAY, r.d50) : null, lo: r.d25 != null ? addDays(TODAY, r.d25) : null, hi: r.d75 != null ? addDays(TODAY, r.d75) : null });
    }
    return out.sort((a, b) => b.p - a.p);
  });
}
/* humor: sinais que costumam vir antes de um dia ruim, medidos no seu histórico */
function radarMood() {
  return memo("radmood", () => {
    const D = DAILY(), N = D.N, C = D.C, bem = C.bem, meta = S.cfg.metaSono || 7.5;
    const win = (c, i, w, need) => { if (!c) return null; const v = []; for (let j = i - w + 1; j <= i; j++) if (j >= 0 && isNum(c[j])) v.push(+c[j]); return v.length >= need ? v : null; };
    const SIG = [
      { id: "sono", l: `noites curtas: média abaixo de ${num(meta - 1)} h nos últimos 3 dias`, area: "Saúde física", acao: ["Dormir mais cedo hoje", "saude.checkin"], f: i => { const v = win(C.sono, i, 3, 2); return v ? avg(v) < meta - 1 : null; } },
      { id: "estresse", l: "estresse 4 ou 5 em 2 dos últimos 3 dias", area: "Saúde mental", acao: ["Conversar com o Mentor da Mente", "mentor.men"], f: i => { const v = win(C.estresse, i, 3, 2); return v ? v.filter(x => x >= 4).length >= 2 : null; } },
      { id: "habitos", l: "menos de 40% dos hábitos cumpridos nos últimos 3 dias", area: null, acao: ["Marcar os hábitos de hoje", "hab.marcar"], f: i => { const v = win(C.hab, i, 3, 3); return v ? avg(v) < .4 : null; } },
      { id: "isolamento", l: "7 dias sem contato registrado com ninguém", area: "Amizades & social", acao: ["Ver quem está há tempo sem contato", "pessoas.lista"], f: i => { const v = win(C.contatos, i, 7, 6); return v ? sum(v) === 0 : null; } },
      { id: "sedentario", l: "7 dias sem treino", area: "Saúde física", acao: ["Planejar um treino curto", "saude.checkin"], f: i => { const v = win(C.treino, i, 7, 5); return v ? sum(v) === 0 : null; } },
      { id: "humor", l: "humor 2 ou menos ontem ou hoje", area: "Saúde mental", acao: ["Escrever no diário", "diario.feed"], f: i => { const v = win(bem, i, 2, 1); return v ? v.some(x => x <= 2) : null; } },
    ];
    const outc = i => { let k = 0, hit = false; for (let j = i + 1; j <= i + 3 && j < N; j++) if (isNum(bem[j])) { k++; if (bem[j] <= 2) hit = true; } return k >= 2 ? hit : null; };
    let bn = 0, bh = 0; const st = SIG.map(s => ({ ...s, n: 0, hits: 0 }));
    for (let i = 0; i < N - 3; i++) { const o = outc(i); if (o == null) continue; bn++; if (o) bh++; st.forEach((s, k) => { if (SIG[k].f(i) === true) { s.n++; if (o) s.hits++; } }); }
    const base = bn ? bh / bn : null, now = N - 1;
    for (const s of st) { s.p = s.n ? s.hits / s.n : null; s.lift = s.p != null && base ? s.p / base : null; let a = s.f(now); if (a == null) a = s.f(now - 1); s.ativo = a === true; s.ok = s.n >= 6 && s.lift != null && s.lift >= 1.3 && s.p >= .25; }
    return { base, bn, sig: st };
  });
}
function radarGoals() {
  return memo("radgoal", () => calcAt(mkey(TODAY)).metas.filter(m => m.ativa && m.rt !== "Concluída" && m.prazo && m.inicio && m.prazo >= TODAY).map(m => {
    const el = diff(TODAY, m.inicio); if (el < 14) return null;
    if (m.prog <= 0) return { m, proj: null, late: null, txt: `Sem progresso registrado em ${el} dias` };
    const proj = addDays(m.inicio, Math.round(el / m.prog)), late = diff(proj, m.prazo);
    return late > 7 ? { m, proj, late, txt: `No ritmo atual termina em ${fmtDY(proj)}, ${plural(late, "dia", "dias")} depois do prazo` } : null;
  }).filter(Boolean));
}
/* lista única de alertas ativos */
function radarAlerts() {
  return memo("radalerts", () => {
    const out = [], mk = mkey(TODAY), bud = radarBudget(), mood = radarMood();
    for (const b of bud) {
      if (b.over) out.push({ key: `orc:${b.cat}:${mk}`, tipo: "orcamento", st: "crit", area: "Finanças", titulo: `${b.cat} já passou do teto`, texto: `${eur(b.spent)} de ${eur(b.plan)} no mês.`, prob: 1, verif: `${mk}-${pad(dim(mk))}`, acao: ["Ver lançamentos", "fin.lanc"], alvo: b.cat, fato: true });
      else if (b.p >= .6 && b.med > b.plan * 1.05) out.push({ key: `orc:${b.cat}:${mk}`, tipo: "orcamento", st: b.p >= .8 ? "crit" : "warn", area: "Finanças", titulo: b.spent + b.fixo > b.plan * 1.03 ? `${b.cat} vai passar do teto com as contas fixas` : `${b.cat} deve estourar ${b.date ? "por volta de " + fmtD(b.date) : "este mês"}`, texto: b.spent + b.fixo > b.plan * 1.03 ? `Faltam ${eur(b.fixo)} em contas fixas este mês, o que já leva ${b.cat} a ${eur(b.spent + b.fixo)}, acima do teto de ${eur(b.plan)}.` : `${eur(b.spent)} de ${eur(b.plan)} gastos${b.fixo ? ` e ${eur(b.fixo)} em contas fixas ainda por vir` : ""}; no seu ritmo de gastos variáveis dos últimos 90 dias, ${pct(b.p)} das simulações passam do teto (fechamento provável: ${eur(b.med)})${b.lo && b.hi && b.lo !== b.hi ? `, quase sempre entre ${fmtD(b.lo)} e ${fmtD(b.hi)}` : ""}.`, prob: b.p, verif: `${mk}-${pad(dim(mk))}`, acao: ["Ajustar teto ou ritmo", "fin.orc"], alvo: b.cat });
    }
    const act = mood.sig.filter(s => s.ativo && s.ok).sort((a, b) => b.p - a.p);
    if (act.length) { const s = act[0]; out.push({ key: `humor:${s.id}:${TODAY}`, tipo: "humor", st: s.p >= .5 ? "crit" : "warn", area: s.area || "Saúde mental", titulo: `Risco de dias difíceis nos próximos 3 dias`, texto: `Agora: ${act.map(x => x.l).join("; ")}. Quando isso aconteceu antes (${s.n} vezes), em ${pct(s.p)} delas veio um dia com humor 2 ou menos logo depois; normalmente é ${pct(mood.base)}.`, prob: s.p, verif: addDays(TODAY, 3), acao: s.acao, alvo: s.id }); }
    for (const g of radarGoals().filter(g => g.late == null || g.late > 30).sort((a, b) => a.m.prazo.localeCompare(b.m.prazo)).slice(0, 3)) out.push({ key: `meta:${g.m.id}:${mk}`, tipo: "meta", st: g.late == null || g.late > 30 ? "crit" : "warn", area: g.m.area, titulo: g.m.meta, texto: `${g.txt}. Progresso ${pct(g.m.prog)}, prazo ${fmtDY(g.m.prazo)}.`, prob: null, verif: g.m.prazo, acao: ["Abrir a meta", null], ent: `meta|${g.m.id}`, alvo: g.m.id });
    const R = calcAt(mkey(TODAY));
    for (const h of R.hab.filter(h => h.streak >= 4 && !S.marks[`${h.id}|${TODAY}`]).sort((a, b) => b.streak - a.streak).slice(0, 2)) out.push({ key: `seq:${h.id}:${TODAY}`, tipo: "sequencia", st: "warn", area: h.area, titulo: `Sequência de ${h.streak} dias em ${h.nome}`, texto: "Ainda não marcado hoje. Um dia perdido zera a contagem.", prob: null, acao: ["Marcar agora", null], mark: `${h.id}|${TODAY}`, alvo: h.id, nolog: true });
    return out.sort((a, b) => (a.st === "crit" ? 0 : 1) - (b.st === "crit" ? 0 : 1) || (b.prob ?? 0) - (a.prob ?? 0));
  });
}
/* registro: guarda cada alerta previsto e confere depois se aconteceu */
function radarCheck(it) {
  if (it.tipo === "orcamento") { const mk = it.key.split(":").at(-1), spent = sum(S.lanc.filter(l => l.tipo === "Despesa" && l.cat === it.alvo && mkey(l.data || "") === mk).map(l => l.valor)), plan = +S.orc[it.alvo] || 0; return plan ? (spent > plan ? "confirmado" : "nao") : "sem dados"; }
  if (it.tipo === "humor") { const D = DAILY(); let k = 0, hit = false; for (let j = 1; j <= 3; j++) { const i = D.idx[addDays(it.criado, j)], v = i != null ? D.C.bem[i] : null; if (isNum(v)) { k++; if (v <= 2) hit = true; } } return k ? (hit ? "confirmado" : "nao") : "sem dados"; }
  if (it.tipo === "meta") { const m = S.metas.find(x => x.id === it.alvo); if (!m) return "sem dados"; const done = m.status === "Concluída" || (calcAt(mkey(TODAY)).metas.find(x => x.id === m.id)?.prog ?? 0) >= 1; return done ? "nao" : "confirmado"; }
  return "sem dados";
}
function radarSync() {
  if (!LOADED) return; S.radar ||= { log: [] }; const log = S.radar.log ||= []; let ch = false;
  for (const a of radarAlerts()) if (!a.nolog && !log.some(x => x.key === a.key)) { log.unshift({ key: a.key, tipo: a.tipo, alvo: a.alvo, titulo: a.titulo, criado: TODAY, prob: a.prob, verif: a.verif || addDays(TODAY, 3), status: a.fato ? "fato" : "aberto" }); ch = true; }
  for (const it of log) if (it.status === "aberto" && it.verif < TODAY) { it.status = radarCheck(it); it.conferido = TODAY; ch = true; }
  if (log.length > 300) { log.length = 300; ch = true; }
  if (ch && !IS_EXAMPLE) touch("radar", { noUndo: true, noRender: true });
}
function radarAccuracy() {
  const v = (S.radar?.log || []).filter(x => x.status === "confirmado" || x.status === "nao"), by = {};
  for (const x of v) { const o = by[x.tipo] ||= { n: 0, ok: 0 }; o.n++; if (x.status === "confirmado") o.ok++; }
  return { n: v.length, ok: v.filter(x => x.status === "confirmado").length, by, fb: (S.radar?.log || []).filter(x => x.fb), util: (S.radar?.log || []).filter(x => x.fb === "util").length };
}
const RAD_T = { orcamento: "Orçamento", humor: "Humor", meta: "Metas", sequencia: "Sequências" };
function alertCard(a, compact) {
  const lg = (S.radar?.log || []).find(x => x.key === a.key);
  return `<div class="ralert ${a.st}" style="--c:${acol(a.area)}"><div class="rah">${ic(a.tipo === "orcamento" ? "coins" : a.tipo === "humor" ? "mood" : a.tipo === "meta" ? "target" : "repeat")}<b>${esc(a.titulo)}</b>${a.prob != null && !a.fato ? `<span class="rprob" ${tip("Probabilidade estimada a partir do seu próprio histórico")}>${pct(a.prob)}</span>` : ""}</div><p>${esc(a.texto)}</p>
    <div class="row wrap">${a.mark ? `<button type="button" class="btn sm" data-mark="${a.mark}">${ic("check")}${esc(a.acao[0])}</button>` : a.ent ? `<button type="button" class="btn sm" data-ent="${esc(a.ent)}">${esc(a.acao[0])}</button>` : a.acao?.[1] ? `<button type="button" class="btn sm" data-go="${a.acao[1]}">${esc(a.acao[0])}</button>` : ""}${!compact && lg && !a.fato ? `<span class="rfb">Este alerta é <button type="button" class="seg" data-radfb="${esc(a.key)}|util" aria-pressed="${lg.fb === "util"}">útil</button><button type="button" class="seg" data-radfb="${esc(a.key)}|falso" aria-pressed="${lg.fb === "falso"}">alarme falso</button></span>` : ""}</div></div>`;
}
function pRadar(R) {
  const al = radarAlerts(), bud = radarBudget(), mood = radarMood(), acc = radarAccuracy(), goals = radarGoals(), log = S.radar?.log || [];
  const actSig = mood.sig.filter(s => s.ativo && s.ok), risk = actSig.length ? Math.max(...actSig.map(s => s.p)) : mood.base;
  const rows = bud.filter(b => b.p >= .05 || b.over).slice(0, 12).map(b => ({ l: b.cat, v: b.over ? 1 : b.p, txt: b.over ? "já passou" : pct(b.p), sub: `${eur(b.spent)} de ${eur(b.plan)}${b.fixo ? ` + ${eur(b.fixo)} fixos` : ""}${b.date && !b.over ? ` · provável ${fmtD(b.date)}` : ""}`, color: b.over || b.p >= .8 ? "var(--crit)" : b.p >= .5 ? "var(--warn)" : "var(--accent)" }));
  return `<p class="lead">O radar olha para frente. Cada alerta vem com a evidência do seu próprio histórico e fica registrado; quando o prazo passa, o Atlas confere se aconteceu. É assim que você sabe se pode confiar nele.</p>
    ${kpiRow([kmini("var(--crit)", "Alertas agora", al.length, `${al.filter(a => a.st === "crit").length} críticos`), kmini("var(--a-men)", "Risco de dia difícil · 3 dias", pct(risk), actSig.length ? "sinais ativos agora" : `sua média: ${pct(mood.base)}`, actSig.length ? "crit" : ""), kmini("var(--accent)", "Acerto do radar", acc.n ? pct(acc.ok / acc.n) : "–", acc.n ? `${acc.ok} de ${acc.n} alertas conferidos se confirmaram` : "ainda sem alertas conferidos"), kmini("var(--a-fin)", "Orçamento em risco", bud.filter(b => b.p >= .6 && !b.over).length, `${bud.filter(b => b.over).length} já passaram do teto`)])}
    <div class="g2c">
      ${panel(`${ic("radar")}Alertas agora <small>${al.length}</small>`, al.length ? al.map(a => alertCard(a)).join("") : `<div class="empty">Nada no radar. Os sinais que costumam vir antes de problemas estão quietos.</div>`)}
      ${vis("radbud", "Chance de estourar o orçamento", hbars(rows, { max: 1, fmt: v => pct(v) }), { sub: "contas fixas entram uma vez; o resto do mês é simulado 800 vezes com seus gastos variáveis dos últimos 90 dias", table: () => ({ cols: [{ l: "Categoria" }, { l: "Gasto", num: true, f: v => eur(v) }, { l: "Teto", num: true, f: v => eur(v) }, { l: "Chance de estourar", num: true, f: v => pct(v) }, { l: "Data provável" }], rows: bud.map(b => [b.cat, b.spent, b.plan, b.over ? 1 : b.p, b.over ? "já passou" : b.date ? fmtDY(b.date) : "–"]) }) })}
      ${vis("radsig", "Sinais que costumam vir antes de um dia ruim", `<div class="hscroll"><table class="dt sigt"><thead><tr><th>Sinal</th><th class="num">Vezes</th><th class="num" title="Dia com humor 2 ou menos nos 3 dias seguintes">Depois</th><th class="num">Normal</th><th class="num">Risco</th><th>Agora</th></tr></thead><tbody>${mood.sig.map(s => `<tr${s.ok ? "" : ' class="dim"'}><td>${esc(s.l)}</td><td class="num">${s.n}</td><td class="num">${s.p == null ? "–" : pct(s.p)}</td><td class="num">${pct(mood.base)}</td><td class="num">${s.lift == null ? "–" : num(s.lift, 1) + "×"}</td><td>${s.ativo ? pill(s.ok ? "crit" : "warn", "sim") : `<span class="muted">não</span>`}</td></tr>`).join("")}</tbody></table></div><p class="note">${ic("info")}<span>“Dia ruim” é humor 2 ou menos em algum dos 3 dias seguintes. Sinais com menos de 6 ocorrências, ou que não aumentam o risco pelo menos 1,3×, ficam apagados e não geram alerta.</span></p>`, { sub: `${mood.bn} dias do seu histórico com desfecho conhecido` })}
      ${panel(`${ic("target")}Metas fora do ritmo <small>${goals.length}</small>`, goals.length ? goals.map(g => `<button type="button" class="li click" data-ent="meta|${g.m.id}"><div class="t">${esc(g.m.meta)}<div class="m">${esc(g.txt)}</div></div>${pill(g.late == null || g.late > 30 ? "crit" : "warn", pct(g.m.prog))}</button>`).join("") : `<div class="empty">Todas as metas com prazo estão no ritmo para terminar a tempo.</div>`)}
      ${panel(`${ic("clock")}Histórico e acerto <small>${log.length}</small>`, `${acc.n ? `<div class="tagcloud">${Object.entries(acc.by).map(([k, o]) => `<span class="chip">${RAD_T[k] || k}: ${o.ok}/${o.n} confirmados</span>`).join("")}${acc.fb.length ? `<span class="chip">você marcou ${acc.util} de ${acc.fb.length} como úteis</span>` : ""}</div>` : ""}<div class="list">${log.slice(0, 14).map(x => `<div class="li"><div class="t">${esc(x.titulo)}<div class="m">${RAD_T[x.tipo] || x.tipo} · emitido ${fmtDY(x.criado)}${x.prob != null && x.status !== "fato" ? ` · ${pct(x.prob)}` : ""}${x.status === "aberto" ? ` · confere em ${fmtDY(x.verif)}` : ""}</div></div>${pill({ confirmado: "crit", nao: "good", aberto: "none", fato: "warn", "sem dados": "none" }[x.status] || "none", { confirmado: "aconteceu", nao: "não aconteceu", aberto: "aguardando", fato: "já era fato", "sem dados": "sem dados" }[x.status] || x.status)}</div>`).join("") || `<div class="empty">Os alertas emitidos aparecem aqui com o resultado da conferência.</div>`}</div>`)}
    </div>`;
}
function radarClick(t) {
  if (t.dataset.radfb) { const [key, v] = t.dataset.radfb.split("|"), it = (S.radar?.log || []).find(x => x.key === key); if (it) { it.fb = it.fb === v ? null : v; touch("radar", { label: "Avaliação do alerta" }); } return true; }
  return false;
}
