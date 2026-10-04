
/* ================================================================ motor de cálculo (regras da planilha, agora com pesos por área) */
let PER = 6, CMP = "ant";              // janela dos relatórios (meses) e base de comparação dos KPIs
function calc() {
  const C = S.cfg, mk = REF, mIni = mk + "-01", mFim = `${mk}-${pad(dim(mk))}`;
  const inM = d => d && d >= mIni && d <= mFim;
  const DR = mk < mkey(TODAY) ? dim(mk) : mk > mkey(TODAY) ? 0 : +TODAY.slice(8);
  const corte = DR === 0 ? null : (mk < mkey(TODAY) ? mFim : TODAY);
  const yIni = mk.slice(0, 4) + "-01-01", yFim = mk.slice(0, 4) + "-12-31";
  const daysYear = corte ? diff(corte, yIni) + 1 : 0;
  const R = { mk, DR, corte };
  // finanças
  const byM = m => { const o = { rec: 0, desp: 0, apo: 0, cat: {}, grp: {} }; for (const l of S.lanc) if (l.data && mkey(l.data) === m) { const v = +l.valor || 0; if (l.tipo === "Receita") o.rec += v; else if (l.tipo === "Aporte") o.apo += v; else { o.desp += v; o.cat[l.cat] = (o.cat[l.cat] || 0) + v; const g = CAT_DESP[l.cat] || "Estilo de vida"; o.grp[g] = (o.grp[g] || 0) + v; } } o.res = o.rec - o.desp; o.taxa = o.rec > 0 ? o.res / o.rec : null; return o; };
  const F = R.fin = byM(mk);
  R.series = []; for (let k = 11; k >= 0; k--) { const m = addMonth(mk, -k); const o = byM(m); o.mk = m; R.series.push(o); }
  R.lm = S.lanc.filter(l => inM(l.data));
  const orcTot = sum(Object.values(S.orc)); R.orcTot = orcTot;
  const ritmo = dim(mk) ? DR / dim(mk) : 0; R.ritmo = ritmo;
  R.orcCats = Object.keys(CAT_DESP).map(c => { const real = F.cat[c] || 0, plan = +S.orc[c] || 0; const p = plan ? real / plan : null;
    const st = plan ? (p > 1 ? "crit" : p > ritmo + .15 ? "warn" : "good") : (real ? "none" : null);
    return { cat: c, grupo: CAT_DESP[c], real, plan, p, st }; }).filter(x => x.real || x.plan);
  for (const c of Object.keys(F.cat)) if (!(c in CAT_DESP)) R.orcCats.push({ cat: c, grupo: "Estilo de vida", real: F.cat[c], plan: 0, p: null, st: "none" });
  const pk = Object.keys(S.patr).filter(k => k <= mk).sort();
  const pl = k => { const p = S.patr[k]; return (+p.contas || 0) + (+p.reserva || 0) + (+p.invest || 0) + (+p.outros || 0) - (+p.dividas || 0); };
  R.pl = pk.length ? pl(pk.at(-1)) : null; R.plVar = pk.length > 1 ? pl(pk.at(-1)) - pl(pk.at(-2)) : null; R.plMes = pk.at(-1);
  const despMeses = R.series.filter(s => s.desp > 0 && s.mk <= mk).slice(-6).map(s => s.desp);
  R.reserva = pk.length && despMeses.length ? (+S.patr[pk.at(-1)].reserva || 0) / avg(despMeses) : null;
  R.dist = GRUPOS.map(g => ({ g, v: F.grp[g] || 0 }));
  R.proj = DR && DR < dim(mk) ? F.desp / DR * dim(mk) : null;
  // saúde
  const sd = Object.entries(S.saude).filter(([d]) => inM(d)).map(([, e]) => e);
  const av = k => avg(sd.map(e => e[k]));
  R.sono = av("sono"); R.humor = av("humor"); R.energia = av("energia"); R.estresse = av("estresse"); R.passos = av("passos"); R.qualSono = av("qual");
  R.treinos = sd.filter(e => e.treino).length; R.minTreino = sum(sd.map(e => e.min)); R.diasReg = sd.length;
  const pesos = Object.entries(S.saude).filter(([d, e]) => e.peso && (!corte || d <= corte)).sort(); R.peso = pesos.length ? pesos.at(-1)[1].peso : null;
  // hábitos
  R.hab = S.habitos.map(h => {
    let feitos = 0; for (let d = 1; d <= DR; d++) if (S.marks[`${h.id}|${mk}-${pad(d)}`]) feitos++;
    let streak = 0, d0 = S.marks[`${h.id}|${TODAY}`] ? TODAY : addDays(TODAY, -1); while (S.marks[`${h.id}|${d0}`]) { streak++; d0 = addDays(d0, -1); }
    const pm = DR && h.meta ? Math.min(1, feitos / (h.meta * DR / 7)) : null;
    return { ...h, feitos, pDias: DR ? feitos / DR : null, pm, streak, st: pm == null ? "none" : pm >= .9 ? "good" : pm >= .6 ? "warn" : "crit" };
  });
  R.habMeta = avg(R.hab.map(h => h.pm));
  // metas
  R.metas = S.metas.map(m => {
    const hasNum = [m.ini, m.atual, m.alvo].every(isNum) && +m.alvo !== +m.ini;
    const prog = m.status === "Concluída" ? 1 : hasNum ? clamp((+m.atual - +m.ini) / (+m.alvo - +m.ini)) : clamp(+m.manual || 0);
    const esp = m.inicio && m.prazo ? (m.prazo <= m.inicio ? 1 : clamp(diff(TODAY, m.inicio) / diff(m.prazo, m.inicio))) : null;
    let rt, st;
    if (m.status === "Concluída" || prog >= 1) [rt, st] = ["Concluída", "good"];
    else if (m.status === "Pausada" || m.status === "Abandonada") [rt, st] = [m.status, "none"];
    else if (esp == null) [rt, st] = ["Sem prazo", "none"];
    else if (m.prazo < TODAY) [rt, st] = ["Vencida", "crit"];
    else if (prog >= esp - .1) [rt, st] = ["No ritmo", "good"];
    else if (prog >= esp - .25) [rt, st] = ["Atenção", "warn"];
    else [rt, st] = ["Atrasada", "crit"];
    const dur = m.prazo ? diff(m.prazo, m.inicio || TODAY) : null;
    const hz = dur == null ? "" : dur <= 183 ? "Curto" : dur <= 731 ? "Médio" : "Longo";
    const ts = S.tarefas.filter(t => t.meta === m.meta), abertas = ts.filter(t => !["Concluída", "Cancelada"].includes(t.status)).length;
    return { ...m, prog, esp, rt, st, hz, dias: m.prazo && rt !== "Concluída" ? diff(m.prazo, TODAY) : null, abertas, ntar: ts.length, ativa: !["Pausada", "Abandonada"].includes(m.status) };
  });
  const and = R.metas.filter(m => m.ativa && m.rt !== "Concluída");
  R.metasAnd = and.length; R.metasRitmo = and.filter(m => m.rt === "No ritmo").length; R.metasAtras = and.filter(m => m.st === "crit").length;
  R.metasProg = avg(and.map(m => m.prog));
  // tarefas
  R.tar = S.tarefas.map(t => {
    const done = t.status === "Concluída", canc = t.status === "Cancelada";
    let al, st;
    if (done) [al, st] = ["Feita", "good"]; else if (canc) [al, st] = ["Cancelada", "none"]; else if (!t.prazo) [al, st] = ["Sem prazo", "none"];
    else if (t.prazo < TODAY) [al, st] = ["Atrasada", "crit"]; else if (t.prazo === TODAY) [al, st] = ["Vence hoje", "warn"];
    else if (diff(t.prazo, TODAY) <= 7) [al, st] = ["Próximos 7 dias", "warn"]; else [al, st] = ["No prazo", "none"];
    const urg = t.prazo && diff(t.prazo, TODAY) <= 3, open = !done && !canc;
    const quad = !open ? "" : t.prio === "Alta" ? (urg ? "1 · Fazer já" : "2 · Agendar") : (urg ? "3 · Resolver rápido" : "4 · Depois");
    return { ...t, al, st, quad, open };
  });
  R.tarAbertas = R.tar.filter(t => t.open).length; R.tarAtras = R.tar.filter(t => t.st === "crit").length;
  R.tar7 = R.tar.filter(t => t.open && t.st === "warn").length; R.tarConcl = R.tar.filter(t => t.status === "Concluída" && inM(t.concluida)).length;
  // pessoas
  R.pes = S.pessoas.map(p => {
    const cs = S.contatos.filter(c => c.pessoa === p.nome && c.data <= TODAY).map(c => c.data).sort();
    const ult = cs.at(-1) || "", dias = ult ? diff(TODAY, ult) : null;
    let st, txt; if (!+p.freq) [st, txt] = ["none", "Sem frequência"]; else if (!ult) [st, txt] = ["crit", "Sem registro"];
    else if (dias > p.freq) [st, txt] = ["crit", "Atrasado"]; else if (dias >= .8 * p.freq) [st, txt] = ["warn", "Em breve"]; else [st, txt] = ["good", "Em dia"];
    let prox = null; if (p.aniv) { const a = parse(p.aniv); let d = new Date(+TODAY.slice(0, 4), a.getMonth(), a.getDate()); if (iso(d) < TODAY) d.setFullYear(d.getFullYear() + 1); prox = iso(d); }
    return { ...p, ult, dias, st, txt, ratio: p.freq ? (ult ? dias / p.freq : 99) : 0, prox, faltam: prox ? diff(prox, TODAY) : null, n: cs.length };
  });
  const comFreq = R.pes.filter(p => +p.freq);
  R.relEmDia = comFreq.length ? comFreq.filter(p => p.st === "good" || p.st === "warn").length / comFreq.length : null;
  R.relAtras = R.pes.filter(p => p.st === "crit").length;
  R.contMes = S.contatos.filter(c => inM(c.data));
  // aprendizado / lazer
  R.horasEst = sum(S.estudo.filter(e => inM(e.data)).map(e => e.horas));
  R.livros = S.aprend.filter(a => a.tipo === "Livro" && a.status === "Concluído" && a.fim >= yIni && a.fim <= yFim).length;
  const lz = S.lazer.filter(l => inM(l.data)); R.horasLaz = sum(lz.map(l => l.horas)); R.lazN = lz.length; R.lazSat = avg(lz.map(l => l.sat)); R.lazCusto = sum(lz.map(l => l.custo));
  // diário do mês
  const dm = S.diario.filter(e => inM(e.data)); R.diaN = dm.length; R.diaHumor = avg(dm.map(e => e.humor)); R.diaPal = sum(dm.map(e => words(e.texto)));
  // casa
  R.docs = S.docs.map(d => { const dias = d.validade ? diff(d.validade, TODAY) : null; const st = dias == null ? "none" : dias < 0 ? "crit" : dias <= C.alertaDocs ? "warn" : "good";
    return { ...d, dias, st, txt: { none: "Sem validade", crit: "Vencido", warn: "Renovar", good: "Válido" }[st] }; });
  R.rot = S.rotinas.map(r => { const prox = r.ultima && +r.freq ? addDays(r.ultima, +r.freq) : null; const dias = prox ? diff(prox, TODAY) : null; const st = dias == null ? "none" : dias < 0 ? "crit" : dias <= 7 ? "warn" : "good";
    return { ...r, prox, dias, st, txt: { none: "Sem registro", crit: "Atrasada", warn: "Em breve", good: "Em dia" }[st] }; });
  const perM = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 };
  R.ass = S.assin.map(a => ({ ...a, mensal: (+a.valor || 0) / (perM[a.periodo] || 1) }));
  R.assMes = sum(R.ass.map(a => a.mensal)); R.economia = sum(R.ass.filter(a => a.uso === "Baixo").map(a => a.mensal));
  R.casaAlertas = R.docs.filter(d => d.st === "crit" || d.st === "warn").length + R.rot.filter(r => r.st === "crit").length;
  // carreira
  R.compPct = avg(S.comp.filter(c => +c.alvo).map(c => Math.min(1, c.atual / c.alvo)));
  R.candAtivas = S.cand.filter(c => ["Aplicado", "Entrevista", "Teste / case", "Proposta"].includes(c.etapa)).length;
  // roda: percepção do mês ou do último mês anterior com nota
  const rodaKeys = Object.keys(S.roda).filter(k => k <= mk).sort();
  const perc = a => { for (let i = rodaKeys.length - 1; i >= 0; i--) { const v = S.roda[rodaKeys[i]][a]; if (v != null && v !== "") return { v: +v, k: rodaKeys[i], i }; } return null; };
  // áreas
  const share = arr => { const n = arr.filter(x => x.st !== "none").length; return n ? arr.filter(x => x.st === "good").length / n : null; };
  const relShare = rel => { const ps = R.pes.filter(p => p.relacao === rel && +p.freq); return ps.length ? ps.filter(p => p.st === "good" || p.st === "warn").length / ps.length : null; };
  const relQual = rel => { const names = new Set(S.pessoas.filter(p => p.relacao === rel).map(p => p.nome)); const q = avg(R.contMes.filter(c => names.has(c.pessoa)).map(c => +c.qual)); return q == null ? null : (q - 1) / 4; };
  const relInd = rel => { const ps = R.pes.filter(p => p.relacao === rel && +p.freq); return `${ps.filter(p => p.st === "good" || p.st === "warn").length} de ${ps.length} em dia · ${R.contMes.filter(c => ps.some(p => p.nome === c.pessoa)).length} contatos no mês`; };
  const has = v => v != null && !isNaN(v);
  const spec = {
    "Saúde física": [[DR && R.diasReg ? Math.min(1, R.treinos / (C.metaTreinos * DR / 7)) : null, has(R.sono) ? Math.min(1, R.sono / C.metaSono) : null, has(R.passos) ? Math.min(1, R.passos / C.metaPassos) : null], (has(R.sono) ? `Sono ${num(R.sono)} h · ` : "") + `${R.treinos} treinos`],
    "Saúde mental": [[has(R.humor) ? (R.humor - 1) / 4 : null, has(R.estresse) ? (5 - R.estresse) / 4 : null, has(R.energia) ? (R.energia - 1) / 4 : null], has(R.humor) ? `Humor ${num(R.humor)} · estresse ${num(R.estresse)} (1–5)` : "Sem registros de humor"],
    "Finanças": [[has(F.taxa) ? Math.min(1, Math.max(0, F.taxa) / C.metaPoup) : null, has(R.reserva) ? Math.min(1, R.reserva / C.metaReserva) : null, share(R.orcCats.filter(c => c.st))], (has(F.taxa) ? `Poupança ${pct(F.taxa)}` : "Sem receitas") + (has(R.reserva) ? ` · reserva ${num(R.reserva)} meses` : "")],
    "Carreira": [[R.compPct, null, null], `${R.candAtivas} candidaturas ativas` + (has(R.compPct) ? ` · competências ${pct(R.compPct)} do alvo` : "")],
    "Aprendizado": [[DR && S.estudo.length ? Math.min(1, R.horasEst / (C.metaEstudo * DR / dim(mk))) : null, daysYear && S.aprend.some(a => a.tipo === "Livro") ? Math.min(1, R.livros / Math.max(.5, C.metaLivros * daysYear / 365)) : null], `${num(R.horasEst)} h de estudo · ${R.livros} livros no ano`],
    "Família": [[relShare("Família"), relQual("Família")], relInd("Família")],
    "Amor & parceria": [[relShare("Parceria"), relQual("Parceria")], relInd("Parceria")],
    "Amizades & social": [[relShare("Amizade"), relQual("Amizade")], relInd("Amizade")],
    "Lazer & criatividade": [[DR && S.lazer.length ? Math.min(1, R.horasLaz / (C.metaLazer * DR / 7)) : null, has(R.lazSat) ? (R.lazSat - 1) / 4 : null], `${num(R.horasLaz)} h de lazer · ${R.lazN} atividades`],
    "Propósito & espiritualidade": [[], ""],
    "Casa & organização": [[share(R.docs), share(R.rot)], `${R.docs.filter(d => d.st === "warn" || d.st === "crit").length} doc(s) p/ renovar · ${R.rot.filter(r => r.st === "crit").length} rotina(s) atrasada(s)`],
  };
  R.areas = AREAS.map(a => {
    const ms = R.metas.filter(m => m.area === a && m.ativa); const metas = ms.length ? ms.filter(m => ["No ritmo", "Concluída", "Sem prazo"].includes(m.rt)).length / ms.length : null;
    const hs = R.hab.filter(h => h.area === a && h.pm != null); const hab = hs.length ? avg(hs.map(h => h.pm)) : null;
    const comps = [metas, hab, ...spec[a][0]].filter(v => v != null && !isNaN(v));
    const dados = comps.length ? Math.round(avg(comps) * 100) / 10 : null;
    const p = perc(a), prev = p ? (() => { for (let i = p.i - 1; i >= 0; i--) { const v = S.roda[rodaKeys[i]][a]; if (v != null && v !== "") return +v; } return null; })() : null;
    let ind = spec[a][1]; if (!ind) ind = hab != null || metas != null ? [hab != null ? `${pct(hab)} da meta dos hábitos` : "", metas != null ? `${pct(metas)} das metas no ritmo` : ""].filter(Boolean).join(" · ") : "Ligue hábitos e metas a esta área";
    return { a, dados, perc: p?.v ?? null, prev, alvo: S.alvo[a] ?? null, ind, metasP: metas, habP: hab, st: dados == null ? "none" : dados >= 7 ? "good" : dados >= 5 ? "warn" : "crit" };
  });
  const act = R.areas.filter(a => a.dados != null && aativa(a.a) && apeso(a.a) > 0), wsum = sum(act.map(a => apeso(a.a)));
  R.indiceRaw = wsum ? sum(act.map(a => a.dados * apeso(a.a))) / wsum * 10 : null; R.indice = R.indiceRaw == null ? null : Math.round(R.indiceRaw);
  R.areas.forEach(a => { a.contrib = wsum && act.includes(a) ? a.dados * apeso(a.a) / wsum * 10 : 0; });
  const ps = R.areas.map(a => a.perc).filter(v => v != null); R.percep = ps.length ? avg(ps) : null;
  // reflexão e faixas de 28 dias
  R.foco = (S.revisao[addMonth(mk, -1)] || {}).foco || ""; R.rev = S.revisao[mk] || {};
  R.days28 = []; const endD = corte || TODAY; for (let k = 27; k >= 0; k--) { const d = addDays(endD, -k); const n = S.habitos.length ? S.habitos.filter(h => S.marks[`${h.id}|${d}`]).length / S.habitos.length : null; R.days28.push({ d, humor: S.saude[d]?.humor ?? null, hab: d <= TODAY ? n : null }); }
  // próximos 7 dias
  R.aniv7 = R.pes.filter(p => p.faltam != null && p.faltam <= 7).length;
  R.venc = [...R.docs.filter(d => d.dias != null && d.dias <= C.alertaDocs).map(d => ({ t: d.doc, k: "documento", dias: d.dias, id: d.id, key: "docs" })), ...R.rot.filter(r => r.dias != null && r.dias <= 7).map(r => ({ t: r.rotina, k: "rotina", dias: r.dias, id: r.id, key: "rotinas" }))].sort((a, b) => a.dias - b.dias);
  R.prox7 = R.tar7 + R.aniv7 + R.venc.filter(v => v.dias >= 0 && v.dias <= 7).length;
  return R;
}
function calcAt(mk) { return memo("calc:" + mk, () => { const keep = REF; REF = mk; try { return calc(); } finally { REF = keep; } }); }
function history(n) { const v = []; for (let k = n - 1; k >= 0; k--) v.push(calcAt(addMonth(REF, -k))); return v; }
/* base de comparação escolhida no filtro: mês anterior, média de 3 meses ou mesmo mês do ano anterior */
function cmpBase(get) {
  if (CMP === "ano") return get(calcAt(addMonth(REF, -12)));
  if (CMP === "m3") return avg([1, 2, 3].map(k => get(calcAt(addMonth(REF, -k)))));
  return get(calcAt(addMonth(REF, -1)));
}
const CMP_TXT = { ant: "vs mês anterior", m3: "vs média de 3 meses", ano: "vs mesmo mês do ano passado" };

/* ================================================================ tabela diária: base de todos os cruzamentos */
const DAILY = () => memo("daily", buildDaily);
function buildDaily() {
  const minOf = a => a.length ? a.reduce((x, y) => x < y ? x : y) : null;
  const dates0 = [Object.keys(S.saude), S.lanc.map(l => l.data), Object.keys(S.marks).map(k => k.split("|")[1]), S.estudo.map(e => e.data), S.lazer.map(e => e.data), S.contatos.map(c => c.data), S.diario.map(e => e.data), S.tarefas.map(t => t.concluida)].map(a => minOf(a.filter(Boolean)));
  let start = minOf(dates0.filter(Boolean)) || addDays(TODAY, -90); if (start < addDays(TODAY, -730)) start = addDays(TODAY, -730);
  const dates = []; for (let d = start; d <= TODAY; d = addDays(d, 1)) dates.push(d);
  const N = dates.length, idx = {}; dates.forEach((d, i) => idx[d] = i);
  const C = {}, col = () => new Array(N).fill(null);
  const zero = (k, from) => { C[k] = col(); if (!from) return; const s = Math.max(0, from < start ? 0 : idx[from] ?? 0); for (let i = s; i < N; i++) C[k][i] = 0; };
  const [fS, fL, fM, fE, fZ, fC, fD, fT] = dates0;
  for (const k of ["sono", "humor", "energia", "estresse", "qual", "passos", "peso", "treino", "min"]) C[k] = col();
  for (const [d, e] of Object.entries(S.saude)) { const i = idx[d]; if (i == null) continue;
    for (const k of ["sono", "humor", "energia", "estresse", "qual", "passos", "peso"]) if (isNum(e[k])) C[k][i] = +e[k];
    if (Object.keys(e).some(k => k !== "peso")) { C.treino[i] = e.treino ? 1 : 0; C.min[i] = e.treino ? (+e.min || 0) : 0; } }
  zero("hab", fM); for (const h of S.habitos) zero("h:" + h.id, fM);
  if (fM && S.habitos.length) for (let i = idx[fM] ?? 0; i < N; i++) { let n = 0; for (const h of S.habitos) if (S.marks[h.id + "|" + dates[i]]) { n++; C["h:" + h.id][i] = 1; } C.hab[i] = n / S.habitos.length; }
  zero("gasto", fL); zero("receita", fL); for (const g of GRUPOS) zero("g:" + g, fL);
  for (const l of S.lanc) { const i = idx[l.data]; if (i == null) continue; const v = +l.valor || 0;
    if (l.tipo === "Despesa") { C.gasto[i] += v; const g = CAT_DESP[l.cat] || "Estilo de vida"; C["g:" + g][i] += v; const ck = "c:" + l.cat; if (!C[ck]) zero(ck, fL); C[ck][i] += v; }
    else if (l.tipo === "Receita") C.receita[i] += v; }
  zero("estudo", fE); for (const e of S.estudo) { const i = idx[e.data]; if (i != null) C.estudo[i] += +e.horas || 0; }
  zero("lazer", fZ); C.lazsat = col(); const ls = {};
  for (const e of S.lazer) { const i = idx[e.data]; if (i == null) continue; C.lazer[i] += +e.horas || 0; if (isNum(e.sat)) (ls[i] = ls[i] || []).push(+e.sat); }
  for (const i in ls) C.lazsat[i] = avg(ls[i]);
  zero("contatos", fC); C.contq = col(); const cq = {};
  const fP = minOf([fC, fD].filter(Boolean));
  const pk = n => "p:" + n; for (const p of S.pessoas) zero(pk(p.nome), fP);
  for (const c of S.contatos) { const i = idx[c.data]; if (i == null) continue; C.contatos[i]++; if (isNum(c.qual)) (cq[i] = cq[i] || []).push(+c.qual); if (C[pk(c.pessoa)]) C[pk(c.pessoa)][i] = 1; }
  for (const i in cq) C.contq[i] = avg(cq[i]);
  zero("diario", fD); zero("palavras", fD); zero("mencoes", fD); C.dhumor = col(); const dh = {};
  for (const e of S.diario) { const i = idx[e.data]; if (i == null) continue; const p = parseEntry(e.texto);
    C.diario[i] = 1; C.palavras[i] += words(e.texto); C.mencoes[i] += p.people.length; if (isNum(e.humor)) (dh[i] = dh[i] || []).push(+e.humor);
    for (const t of p.tags) { const k = "t:" + t; if (!C[k]) zero(k, fD); C[k][i] = 1; }
    for (const n of p.people) if (C[pk(n)]) C[pk(n)][i] = 1; }
  for (const i in dh) C.dhumor[i] = avg(dh[i]);
  zero("tarefas", fT); for (const t of S.tarefas) { const i = idx[t.concluida]; if (i != null && t.status === "Concluída") C.tarefas[i]++; }
  const fV = minOf((S.eventos || []).map(e => e.data).filter(Boolean)); if (fV) { zero("eventos", fV); for (const e of S.eventos) { const i = idx[e.data]; if (i != null) C.eventos[i]++; } }
  C.bem = C.humor.map((v, i) => v ?? C.dhumor[i]);   // humor do dia: check-in ou, na falta, o humor do diário
  return { dates, idx, C, N };
}
/* catálogo de métricas diárias para o explorador e para os mentores */
function metricList() {
  return memo("metrics", () => {
    const D = DAILY(), L = [], has = k => D.C[k] && D.C[k].some(v => v != null);
    const add = (k, l, grp, agg, fmt, o = {}) => { if (has(k)) L.push({ k, l, grp, agg, fmt, ...o }); };
    const f1 = v => num(v, 1), f0 = v => num(v, 0), fp = v => pct(v), fe = v => eur(v);
    add("bem", "Humor do dia", "Bem-estar", "avg", f1, { lo: 1, hi: 5 });
    add("humor", "Humor (check-in)", "Bem-estar", "avg", f1, { lo: 1, hi: 5 });
    add("energia", "Energia", "Bem-estar", "avg", f1, { lo: 1, hi: 5 });
    add("estresse", "Estresse", "Bem-estar", "avg", f1, { lo: 1, hi: 5, inv: true });
    add("sono", "Sono (h)", "Corpo", "avg", f1);
    add("qual", "Qualidade do sono", "Corpo", "avg", f1, { lo: 1, hi: 5 });
    add("passos", "Passos", "Corpo", "avg", f0);
    add("treino", "Treinou", "Corpo", "avg", fp, { bin: true });
    add("min", "Minutos de treino", "Corpo", "sum", f0);
    add("peso", "Peso (kg)", "Corpo", "avg", f1);
    add("hab", "Hábitos cumpridos", "Hábitos", "avg", fp);
    for (const h of S.habitos) add("h:" + h.id, "Hábito: " + h.nome, "Hábitos", "avg", fp, { bin: true });
    add("gasto", "Gasto do dia", "Dinheiro", "sum", fe);
    for (const g of GRUPOS) add("g:" + g, "Gasto · " + g, "Dinheiro", "sum", fe);
    Object.keys(D.C).filter(k => k.startsWith("c:")).map(k => [k, sum(D.C[k])]).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k]) => add(k, "Gasto · " + k.slice(2), "Dinheiro", "sum", fe));
    add("estudo", "Horas de estudo", "Crescimento", "sum", f1);
    add("lazer", "Horas de lazer", "Crescimento", "sum", f1);
    add("lazsat", "Satisfação no lazer", "Crescimento", "avg", f1, { lo: 1, hi: 5 });
    add("contatos", "Contatos com pessoas", "Relações", "sum", f0);
    add("contq", "Qualidade dos contatos", "Relações", "avg", f1, { lo: 1, hi: 5 });
    Object.keys(D.C).filter(k => k.startsWith("p:")).map(k => [k, sum(D.C[k])]).filter(x => x[1] >= 3).sort((a, b) => b[1] - a[1]).slice(0, 12).forEach(([k]) => add(k, "Com " + k.slice(2), "Relações", "avg", fp, { bin: true }));
    add("tarefas", "Tarefas concluídas", "Metas", "sum", f0);
    add("eventos", "Compromissos na agenda", "Metas", "sum", f0);
    add("diario", "Escreveu no diário", "Diário", "avg", fp, { bin: true });
    add("palavras", "Palavras no diário", "Diário", "sum", f0);
    add("dhumor", "Humor no diário", "Diário", "avg", f1, { lo: 1, hi: 5 });
    add("mencoes", "Menções a pessoas", "Diário", "sum", f0);
    Object.keys(D.C).filter(k => k.startsWith("t:")).map(k => [k, sum(D.C[k])]).filter(x => x[1] >= 3).sort((a, b) => b[1] - a[1]).slice(0, 16).forEach(([k]) => add(k, "#" + k.slice(2), "Diário", "avg", fp, { bin: true }));
    return L;
  });
}
const metric = k => metricList().find(m => m.k === k);
const mfmt = (k, v) => (metric(k)?.fmt || (x => num(x)))(v);
const family = k => k === "gasto" || k === "receita" || k.startsWith("g:") || k.startsWith("c:") ? "gasto" : k === "hab" || k.startsWith("h:") ? "hab" : ["diario", "palavras", "mencoes"].includes(k) ? "diario" : ["treino", "min"].includes(k) ? "treino" : ["humor", "dhumor", "bem"].includes(k) ? "humor" : k;
function aggSeries(k, gran = "m", n = 6, end = TODAY) {
  const D = DAILY(), m = metric(k) || { agg: "avg" }, c = D.C[k];
  if (!c) return { keys: [], labels: [], vals: [] };
  const endI = D.idx[end] ?? D.N - 1;
  if (gran === "d") { const s = Math.max(0, endI - n + 1); const keys = D.dates.slice(s, endI + 1); return { keys, labels: keys.map(fmtD), vals: c.slice(s, endI + 1) }; }
  const keyOf = gran === "w" ? weekStart : mkey, g = new Map();
  for (let i = 0; i <= endI; i++) { const kk = keyOf(D.dates[i]); if (!g.has(kk)) g.set(kk, []); g.get(kk).push(c[i]); }
  const keys = [...g.keys()].slice(-n);
  return { keys, labels: keys.map(kk => gran === "w" ? fmtD(kk) : mabbr(kk)), vals: keys.map(kk => { const v = g.get(kk).filter(x => x != null); return v.length ? (m.agg === "sum" ? sum(v) : avg(v)) : null; }) };
}
function crossData(kx, ky, { lag = 0, days = 180, gran = "d" } = {}) {
  const D = DAILY(), pts = [];
  if (!D.C[kx] || !D.C[ky]) return null;
  if (gran === "d") { const X = D.C[kx], Y = D.C[ky], s = Math.max(0, D.N - days); for (let i = s; i < D.N - lag; i++) { const x = X[i], y = Y[i + lag]; if (x != null && y != null) pts.push({ x, y, d: D.dates[i] }); } }
  else { const n = gran === "w" ? Math.ceil(days / 7) : Math.max(3, Math.ceil(days / 30)); const A = aggSeries(kx, gran, n), B = aggSeries(ky, gran, n); for (let i = 0; i < A.vals.length - lag; i++) { const x = A.vals[i], y = B.vals[i + lag]; if (x != null && y != null) pts.push({ x, y, d: A.keys[i] }); } }
  const r = pearson(pts.map(p => p.x), pts.map(p => p.y)), fit = regress(pts);
  let groups = null; const bin = metric(kx)?.bin || (pts.length && pts.every(p => p.x === 0 || p.x === 1));
  if (bin) { const A = pts.filter(p => p.x >= .5).map(p => p.y), B = pts.filter(p => p.x < .5).map(p => p.y); if (A.length >= 3 && B.length >= 3) groups = { a: avg(A), b: avg(B), na: A.length, nb: B.length, bin: true }; }
  else if (pts.length >= 12) { const so = [...pts].sort((a, b) => a.x - b.x), q = Math.floor(so.length / 3); groups = { a: avg(so.slice(-q).map(p => p.y)), b: avg(so.slice(0, q).map(p => p.y)), na: q, nb: q, bin: false }; }
  return { pts, r, n: pts.length, fit, groups };
}
const rWord = r => { const a = Math.abs(r ?? 0); return a >= .5 ? "forte" : a >= .3 ? "moderada" : a >= .15 ? "fraca" : "desprezível"; };
function influencers(target = "bem", { days = 180, lag = 0, min = 20 } = {}) {
  return memo(`infl:${target}:${days}:${lag}:${min}`, () => {
    const out = [];
    for (const m of metricList()) {
      if (family(m.k) === family(target)) continue;
      const c = crossData(m.k, target, { lag, days }); if (!c || c.n < min || c.r == null) continue;
      if (c.groups?.bin && (c.groups.na < 5 || c.groups.nb < 5)) continue;
      out.push({ k: m.k, l: m.l, r: c.r, n: c.n, groups: c.groups, grp: m.grp, fit: c.fit });
    }
    return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  });
}
const CORE_KEYS = ["sono", "qual", "bem", "energia", "estresse", "passos", "treino", "hab", "gasto", "estudo", "lazer", "contatos", "diario", "tarefas"];

/* ================================================================ insights automáticos (sem IA) */
function insights(R, H) {
  const out = [], C = S.cfg, ini = addDays(R.corte || TODAY, -PER * 30);
  const days = Object.entries(S.saude).filter(([d]) => d >= ini && d <= (R.corte || TODAY));
  const cmp = (filt, key) => { const A = days.filter(([d, e]) => filt(d, e) === true && e[key] != null).map(([, e]) => +e[key]), B = days.filter(([d, e]) => filt(d, e) === false && e[key] != null).map(([, e]) => +e[key]);
    return A.length >= 5 && B.length >= 5 ? { a: avg(A), b: avg(B), na: A.length, nb: B.length } : null; };
  let x = cmp((d, e) => e.sono == null ? null : e.sono >= C.metaSono, "humor");
  if (x) out.push({ w: Math.abs(x.a - x.b), st: x.a > x.b ? "good" : "none", area: "Saúde física", k: "Sono → humor", t: `Nos dias com ≥ ${num(C.metaSono)} h de sono seu humor médio foi <b>${num(x.a)}</b>, contra <b>${num(x.b)}</b> nos outros.`, a: x.a > x.b ? "Proteger o horário de dormir é a alavanca mais barata para o humor." : "Sono não explica seu humor neste período." });
  x = cmp((d, e) => !!e.treino, "energia");
  if (x) out.push({ w: Math.abs(x.a - x.b), st: "good", area: "Saúde física", k: "Treino → energia", t: `Em dias de treino a energia média foi <b>${num(x.a)}</b>; sem treino, <b>${num(x.b)}</b>.`, a: x.a > x.b ? "Treinar está pagando de volta em disposição." : "Os treinos podem estar pesados: reveja intensidade ou horário." });
  if (S.habitos.length) { x = cmp(d => S.habitos.filter(h => S.marks[`${h.id}|${d}`]).length / S.habitos.length >= .7, "estresse");
    if (x) out.push({ w: Math.abs(x.a - x.b), st: x.a < x.b ? "good" : "warn", area: "Saúde mental", k: "Hábitos → estresse", t: `Dias com ≥ 70% dos hábitos cumpridos tiveram estresse <b>${num(x.a)}</b>, contra <b>${num(x.b)}</b> nos demais.`, a: "A rotina cumprida segura o estresse; proteja os 3 hábitos-âncora." }); }
  const wd = [0, 1, 2, 3, 4, 5, 6].map(w => avg(days.filter(([d, e]) => parse(d).getDay() === w && e.humor != null).map(([, e]) => +e.humor)));
  const valid = wd.map((v, i) => [v, i]).filter(p => p[0] != null);
  if (valid.length >= 5) { const lo = valid.reduce((a, b) => a[0] < b[0] ? a : b), hi = valid.reduce((a, b) => a[0] > b[0] ? a : b);
    if (hi[0] - lo[0] >= .3) out.push({ w: (hi[0] - lo[0]) * .8, st: "warn", area: "Saúde mental", k: "Padrão semanal", t: `${DOWL[lo[1]][0].toUpperCase() + DOWL[lo[1]].slice(1)} é seu pior dia (humor ${num(lo[0])}); ${DOWL[hi[1]]}, o melhor (${num(hi[0])}).`, a: "Planeje algo leve ou prazeroso para o pior dia da semana." }); }
  if (R.proj != null && R.orcTot) out.push({ w: R.proj > R.orcTot ? 2 : .4, st: R.proj > R.orcTot ? "crit" : "good", area: "Finanças", k: "Projeção do mês", t: `No ritmo atual as despesas fecham o mês em <b>${eur(R.proj)}</b>, para um orçamento de ${eur(R.orcTot)}.`, a: R.proj > R.orcTot ? `Para caber, o gasto diário precisa cair para ${eur((R.orcTot - R.fin.desp) / Math.max(1, dim(R.mk) - R.DR))} até o fim do mês.` : "Mantendo esse ritmo, sobra para a meta de poupança." });
  const prev = H.slice(-4, -1);
  if (prev.length) { const curC = R.fin.cat; let best = null;
    for (const c in curC) { const base = avg(prev.map(h => h.fin.cat[c] || 0)); const dlt = curC[c] - base; if (base > 0 && dlt > 25 && (!best || dlt > best.d)) best = { c, d: dlt, base }; }
    if (best) out.push({ w: Math.min(2, best.d / 100), st: "warn", area: "Finanças", k: "Gasto fora do padrão", t: `<b>${esc(best.c)}</b> está ${eur(best.d)} acima da média dos 3 meses anteriores (${eur(best.base)}).`, a: "Veja os lançamentos dessa categoria em Finanças." }); }
  const gap = R.areas.filter(a => a.dados != null && a.perc != null).sort((a, b) => Math.abs(b.perc - b.dados) - Math.abs(a.perc - a.dados))[0];
  if (gap && Math.abs(gap.perc - gap.dados) >= 2) out.push({ w: Math.abs(gap.perc - gap.dados) / 2, st: "warn", area: gap.a, k: "Percepção × dados", t: `Em <b>${esc(ashort(gap.a))}</b> você se dá ${num(gap.perc, 0)}, mas os registros indicam ${num(gap.dados)}.`, a: gap.perc > gap.dados ? "Os números estão piores que a sensação: confira metas e hábitos da área." : "Você está sendo duro consigo: os dados mostram avanço." });
  const risk = R.metas.filter(m => m.st === "crit" && m.ativa);
  if (risk.length) out.push({ w: 1.5 + risk.length * .2, st: "crit", area: risk[0].area, k: "Metas em risco", t: `${risk.length} meta(s) atrasada(s) ou vencida(s): ${risk.slice(0, 2).map(m => `<b>${esc(m.meta)}</b>`).join(", ")}${risk.length > 2 ? "…" : ""}.`, a: "Replaneje o prazo ou quebre a meta em uma tarefa para esta semana." });
  // cruzamentos com o diário e com hábitos
  const inf = influencers("bem", { days: PER * 30, min: 20 });
  const hb = inf.filter(i => i.k.startsWith("h:") && i.groups?.bin).sort((a, b) => (b.groups.a - b.groups.b) - (a.groups.a - a.groups.b))[0];
  if (hb && hb.groups.a - hb.groups.b >= .25) { const h = S.habitos.find(z => "h:" + z.id === hb.k); out.push({ w: (hb.groups.a - hb.groups.b) * 1.2, st: "good", area: h?.area || "Saúde mental", k: "Hábito que mais ajuda", t: `Nos dias em que você faz <b>${esc(h?.nome || hb.l)}</b> o humor médio é <b>${num(hb.groups.a)}</b>, contra ${num(hb.groups.b)} sem ele.`, a: "Se tiver que escolher um hábito numa semana difícil, escolha este." }); }
  const pp = inf.filter(i => i.k.startsWith("p:") && i.groups?.bin).sort((a, b) => (b.groups.a - b.groups.b) - (a.groups.a - a.groups.b))[0];
  if (pp && pp.groups.a - pp.groups.b >= .3) { const nome = pp.k.slice(2), pe = S.pessoas.find(p => p.nome === nome); out.push({ w: (pp.groups.a - pp.groups.b), st: "good", area: pe ? relArea(pe.relacao) : "Amizades & social", k: "Quem te faz bem", t: `Nos dias em que você está com <b>${esc(nome)}</b> (contato ou diário) seu humor fica em <b>${num(pp.groups.a)}</b>, contra ${num(pp.groups.b)} nos outros.`, a: "Marque o próximo encontro antes que o mês acabe." }); }
  const tg = inf.filter(i => i.k.startsWith("t:") && i.groups?.bin).sort((a, b) => (a.groups.a - a.groups.b) - (b.groups.a - b.groups.b))[0];
  if (tg && tg.groups.b - tg.groups.a >= .5) out.push({ w: (tg.groups.b - tg.groups.a) * .9, st: "warn", area: tagArea(tg.k.slice(2)) || "Saúde mental", k: "Tema que pesa", t: `Dias com <b>#${esc(tg.k.slice(2))}</b> no diário têm humor <b>${num(tg.groups.a)}</b>, contra ${num(tg.groups.b)} nos outros.`, a: "Vale conversar com o mentor da área sobre esse tema." });
  // achados de cada área (sem cruzamento): orçamento, poupança, relações, documentos, estudo, carreira, lazer, sono, propósito
  const over = R.orcCats.filter(c => c.st === "crit").sort((a, b) => b.p - a.p);
  if (over.length) out.push({ w: 1.2 + over.length * .15, st: "crit", area: "Finanças", k: "Orçamento estourado", t: `${over.length === 1 ? "Uma categoria passou" : over.length + " categorias passaram"} do teto: ${over.slice(0, 3).map(c => `<b>${esc(c.cat)}</b> (${pct(c.p)})`).join(", ")}.`, a: "Ajuste o teto ou compense em outra categoria ainda este mês." });
  if (R.fin.taxa != null) { const ok = R.fin.taxa >= C.metaPoup; out.push({ w: ok ? .45 : 1.1, st: ok ? "good" : "warn", area: "Finanças", k: "Taxa de poupança", t: `Você guardou <b>${pct(R.fin.taxa)}</b> da receita em ${mlabel(R.mk)}; a meta é ${pct(C.metaPoup)}.`, a: ok ? "Direcione o excedente para a meta financeira mais próxima." : `Faltaram ${eur((C.metaPoup - R.fin.taxa) * R.fin.rec)} para bater a meta.` }); }
  if (R.economia > 0) out.push({ w: .7, st: "warn", area: "Finanças", k: "Assinaturas pouco usadas", t: `<b>${eur(R.economia, 2)}/mês</b> vão para serviços que você marcou como pouco usados.`, a: "Cancele ou pause um deles esta semana." });
  if (R.reserva != null && R.reserva < C.metaReserva) out.push({ w: .55, st: "warn", area: "Finanças", k: "Reserva de emergência", t: `A reserva cobre <b>${num(R.reserva)} meses</b> de despesas; a meta é ${C.metaReserva}.`, a: "Mantenha o aporte automático logo depois de receber." });
  const late = R.pes.filter(p => p.st === "crit" && +p.freq).sort((a, b) => b.ratio - a.ratio);
  if (late.length) out.push({ w: .9 + late.length * .1, st: "warn", area: relArea(late[0].relacao), k: "Contato atrasado", t: `${late.slice(0, 3).map(p => `<b>${esc(p.nome)}</b> (${p.ult ? p.dias + " dias" : "nunca"})`).join(", ")} ${late.length > 1 ? "passaram" : "passou"} da frequência que você definiu.`, a: "Uma mensagem curta hoje já reinicia a contagem." });
  const dc = R.docs.filter(d => d.st === "crit" || (d.st === "warn" && d.dias <= 60)).sort((a, b) => a.dias - b.dias);
  if (dc.length) out.push({ w: dc[0].st === "crit" ? 1.6 : 1, st: dc[0].st === "crit" ? "crit" : "warn", area: "Casa & organização", k: "Documentos", t: dc.slice(0, 2).map(d => `<b>${esc(d.doc)}</b> ${d.dias < 0 ? "venceu" : `vence em ${d.dias} dias`}`).join("; ") + ".", a: dc[0].acao ? `Próxima ação: ${dc[0].acao}.` : "Agende a renovação agora." });
  if (R.DR && S.estudo.length) { const meta = C.metaEstudo * R.DR / dim(R.mk); if (meta) out.push(R.horasEst < meta * .8 ? { w: .7, st: "warn", area: "Aprendizado", k: "Estudo abaixo do ritmo", t: `<b>${num(R.horasEst)} h</b> de estudo no período, para ${num(meta)} h esperadas pela meta mensal.`, a: "Bloqueie duas sessões fixas na agenda desta semana." } : { w: .35, st: "good", area: "Aprendizado", k: "Estudo em dia", t: `<b>${num(R.horasEst)} h</b> de estudo, acima do ritmo da meta (${num(meta)} h).`, a: "Mantenha os blocos fixos que estão funcionando." }); }
  const ca = S.cand.filter(c => c.dataAcao && c.dataAcao < TODAY && !["Aceito", "Recusado", "Desisti"].includes(c.etapa));
  if (ca.length) out.push({ w: .9, st: "warn", area: "Carreira", k: "Candidaturas paradas", t: `${ca.map(c => `<b>${esc(c.empresa)}</b>`).join(", ")}: a próxima ação passou do prazo.`, a: "Um follow-up curto mantém a candidatura viva." });
  if (R.DR && S.lazer.length) { const m = C.metaLazer * R.DR / 7; if (R.horasLaz < m * .7) out.push({ w: .6, st: "warn", area: "Lazer & criatividade", k: "Pouco lazer", t: `<b>${num(R.horasLaz)} h</b> de lazer no mês, abaixo das ${num(m, 0)} h da sua meta.`, a: "Agende algo prazeroso como se fosse compromisso." }); else if (R.lazSat != null) out.push({ w: .3, st: "good", area: "Lazer & criatividade", k: "Lazer em dia", t: `<b>${num(R.horasLaz)} h</b> de lazer com satisfação média de ${num(R.lazSat)}/5.`, a: "Repita o que teve nota mais alta." }); }
  if (R.sono != null && R.sono < C.metaSono - .3) out.push({ w: .8, st: "warn", area: "Saúde física", k: "Sono abaixo da meta", t: `Média de <b>${num(R.sono)} h</b> por noite, para uma meta de ${num(C.metaSono)} h.`, a: "Antecipe o horário de dormir em 20 minutos por uma semana." });
  const ph = R.hab.find(h => h.area === "Propósito & espiritualidade" && h.pm != null);
  if (ph) out.push({ w: .45, st: ph.st === "good" ? "good" : "warn", area: "Propósito & espiritualidade", k: ph.nome, t: `<b>${pct(ph.pm)}</b> da meta de “${esc(ph.nome)}” no mês.`, a: ph.st === "good" ? "Bom ritmo; registre no diário o que essa prática tem trazido." : "Reduza a meta semanal para algo que caiba na rotina." });
  return out.sort((a, b) => b.w - a.w);
}
