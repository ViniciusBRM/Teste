/* ================================================================ Cockpit de Trabalho: camada de agregação
   Funções puras: recebem os dados (ckDados()), os filtros {pes, proj, tag}, o período (ckPeriodo) e um contexto
   {hoje, cal, R, lim} e devolvem números e, para cada número, os ids que o compõem (o drill-down usa os mesmos ids, então a
   lista aberta sempre bate com o número). Nada aqui lê o estado do app nem grava. Quem usa: o Dashboard, os KPIs do Hoje, o
   mapa de Riscos, a Equipe e os relatórios.
   Definições (iguais na tela, nos testes e no relatório):
   - concluídas no período: data de conclusão dentro do período; planejadas: prazo dentro do período;
   - % no prazo: das concluídas no período que tinham prazo, as concluídas até o prazo;
   - atrasos: prazo dentro do período e já passado, sem conclusão até o prazo (concluída depois também conta);
   - lead time: criação → conclusão; cycle time: primeira entrada em “em andamento” → conclusão (só quem tem esse registro);
   - aberto no fim do período (riscos): criado até o fim e não fechado/mitigado até o fim (a data de fechamento é a da última
     revisão); problema aberto: criado até o fim e não resolvido até o fim;
   - carga: o mesmo cálculo do card “Minha carga” (ckCargaCalc) para os dias de hoje em diante; para os dias já passados,
     utilização realizada = horas das tarefas concluídas ÷ capacidade. */
function ckDados() { const c = ckD(); return { tar: ckT(), risk: ckA("ckRisk"), iss: ckA("ckIss"), log: ckA("ckLog"), dec: ckA("ckDec"), meet: ckA("ckMeet"), bim: ckA("ckBim"), el: ckA("ckEl"), lic: ckA("ckLic"), snap: ckA("ckSnap"), membros: c.membros.filter(m => m.ativo !== false), projetos: c.projetos, marcos: c.marcos, pdi: c.pdi, cfg: c.cfg, eventos: S.eventos || [] }; }
function ckCtx() { const C = ckCPM(); return { hoje: TODAY, cal: ckCal(), R: C.R, cpm: C, lim: ckLims() }; }
const ckDu = (a, b, cal) => !a || !b || b < a ? 0 : cal.diff(a, b) + (cal.util(a) ? 1 : 0);
const ckDias = (a, b, cal) => { const out = []; if (!a || !b || b < a) return out; let x = cal.next(a); while (x <= b) { out.push(x); x = cal.add(x, 1); } return out; };
const ckIn = (d, a, b) => !!d && d >= a && d <= b;
const ckAvg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

/* ---------------------------------------------------------------- período e comparação */
const CK_PER = { semana: "Semana", mes: "Mês", trimestre: "Trimestre", ano: "Ano", custom: "Personalizado" };
function ckPeriodo(tipo, ref, cal, ini0, fim0, hoje = TODAY) {
  const y = +ref.slice(0, 4), m = +ref.slice(5, 7), last = (yy, mm) => `${yy}-${pad(mm)}-${pad(new Date(yy, mm, 0).getDate())}`;
  let ini, fim, pIni, pFim, label;
  if (tipo === "semana") { ini = weekStart(ref); fim = addDays(ini, 6); pIni = addDays(ini, -7); pFim = addDays(ini, -1); label = `semana de ${fmtD(ini)} a ${fmtD(fim)}`; }
  else if (tipo === "trimestre") { const q = Math.floor((m - 1) / 3), m0 = q * 3 + 1; ini = `${y}-${pad(m0)}-01`; fim = last(y, m0 + 2); const pm = m0 - 3 < 1 ? 10 : m0 - 3, py = m0 - 3 < 1 ? y - 1 : y; pIni = `${py}-${pad(pm)}-01`; pFim = last(py, pm + 2); label = `${q + 1}º trimestre de ${y}`; }
  else if (tipo === "ano") { ini = `${y}-01-01`; fim = `${y}-12-31`; pIni = `${y - 1}-01-01`; pFim = `${y - 1}-12-31`; label = String(y); }
  else if (tipo === "custom" && ini0 && fim0 && fim0 >= ini0) { ini = ini0; fim = fim0; const n = Math.max(1, ckDu(ini, fim, cal)); pFim = cal.add(cal.prev(addDays(ini, -1)), 0); pIni = cal.add(pFim, -(n - 1)); label = `${fmtDY(ini)} a ${fmtDY(fim)}`; }
  else { ini = `${y}-${pad(m)}-01`; fim = last(y, m); const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y; pIni = `${py}-${pad(pm)}-01`; pFim = last(py, pm); label = mlabel(ini.slice(0, 7)); tipo = "mes"; }
  /* período em andamento: compara com o mesmo trecho do período anterior (mesmo número de dias úteis), não com ele inteiro */
  let parcial = false; const pFimTot = pFim;
  if (ini <= hoje && fim > hoje) { const n = ckDu(ini, hoje, cal); if (n >= 1) { const pf = cal.add(cal.next(pIni), n - 1); if (pf < pFim) { pFim = pf; parcial = true; } } }
  /* semanas para as tendências: as do período até hoje (nada de semana futura), e no mínimo as 8 que terminam ali */
  const end = ini > hoje || fim < hoje ? fim : hoje, ws = []; let w = weekStart(end); const w0 = weekStart(ini); while (w >= w0 || ws.length < 8) { ws.unshift(w); w = addDays(w, -7); if (ws.length > 60) break; }
  return { tipo, ini, fim, label, du: ckDu(ini, fim, cal), dias: ckDias(ini, fim, cal), semanas: ws, prev: { ini: pIni, fim: pFim, du: ckDu(pIni, pFim, cal), parcial, fimTotal: pFimTot } };
}

/* ---------------------------------------------------------------- filtros (a pessoa filtra o que tem responsável) */
const ckFT = F => t => (!F.pes || t.resp === F.pes) && (!F.proj || t.projeto === F.proj) && (!F.tag || (t.tags || []).includes(F.tag));
const ckFR = F => r => (!F.pes || r.dono === F.pes) && (!F.proj || r.projeto === F.proj);
const ckFI = F => p => (!F.pes || p.resp === F.pes) && (!F.proj || p.projeto === F.proj);
const ckFD = F => d => (!F.pes || d.quem === F.pes) && (!F.proj || d.projeto === F.proj);
const ckFL = F => e => !F.proj || e.projeto === F.proj;
const ckFE = F => e => (!F.pes || e.resp === F.pes) && (!F.proj || e.projeto === F.proj);
const ckFB = F => b => (!F.proj || b.projeto === F.proj) && (!F.pes || b.tipo !== "modelo" || b.resp === F.pes);
const ckFLic = F => l => (!F.proj || l.projeto === F.proj) && (!F.tag || (l.tags || []).includes(F.tag));
const ids = a => a.map(x => x.id);

/* ---------------------------------------------------------------- KPIs do período (atual e anterior) */
function ckRiscoAbertoEm(r, d) { if (!r.criado || r.criado > d) return false; const fechou = ["fechado", "mitigado"].includes(r.status) ? (r.revisto || r.criado) : null; return !fechou || fechou > d; }
const ckProbAbertoEm = (p, d) => !!p.criado && p.criado <= d && (!p.resolvido || p.resolvido > d);
function ckClashEm(b, d) { const s = (b.snaps || []).filter(x => x.data <= d); return s.length ? s.at(-1) : null; }
function ckSnapEm(D, d) { let r = null; for (const s of D.snap || []) if (s.d <= d && (!r || s.d > r.d)) r = s; return r; }
function ckKpiJanela(D, F, ini, fim, X) {
  const T = D.tar.filter(ckFT(F)), hoje = X.hoje;
  const concl = T.filter(t => ckIn(t.concluida, ini, fim)), plan = T.filter(t => ckIn(t.prazo, ini, fim)), comPrazo = concl.filter(t => t.prazo), noPrazo = comPrazo.filter(t => t.concluida <= t.prazo);
  const atr = plan.filter(t => t.prazo < hoje && (!t.concluida || t.concluida > t.prazo));
  let minF = null, minIds = [], fonteF = "cpm";
  if (fim >= hoje) { const ab = T.filter(t => ckOpen(t) && X.R[t.id]); for (const t of ab) { const f = X.R[t.id].folga; if (minF == null || f < minF) { minF = f; minIds = [t.id]; } else if (f === minF) minIds.push(t.id); } }
  else { const s = ckSnapEm(D, fim); fonteF = "snap"; if (s && !F.tag) minF = F.pes ? s.pes?.[F.pes]?.minF ?? null : F.proj ? s.proj?.[F.proj]?.minF ?? null : s.minF ?? null; }
  const rk = D.risk.filter(ckFR(F)).filter(r => ckRiscoAbertoEm(r, fim) && ckRiscoScore(r) >= X.lim.riscoAlto);
  const pb = D.iss.filter(ckFI(F)).filter(p => ckProbAbertoEm(p, fim)), res = D.iss.filter(ckFI(F)).filter(p => ckIn(p.resolvido, ini, fim) && p.criado);
  const tRes = ckAvg(res.map(p => Math.max(0, X.cal.diff(p.criado, p.resolvido))));
  const elP = D.el.filter(ckFE(F)).filter(e => ckIn(e.prevista, ini, fim)), elE = elP.filter(e => e.emissao && e.emissao <= fim);
  const cl = D.bim.filter(b => b.tipo === "clash" && ckFB(F)(b)).map(b => [b, ckClashEm(b, fim)]).filter(x => x[1]);
  return { concl: concl.length, conclIds: ids(concl), plan: plan.length, planIds: ids(plan), pctPrazo: comPrazo.length ? noPrazo.length / comPrazo.length : null, nComPrazo: comPrazo.length, prazoIds: ids(comPrazo),
    atrasos: atr.length, atrIds: ids(atr), minF, minIds, fonteF, riscosAltos: rk.length, riscoIds: ids(rk), probAbertos: pb.length, probIds: ids(pb), tRes, nRes: res.length,
    elPrev: elP.length, elEnt: elE.length, elIds: ids(elP), clash: cl.reduce((s, [, x]) => s + (+x.abertos || 0), 0), clashIds: cl.map(([b]) => b.id) };
}
function ckKpis(D, F, P, X) { return { cur: ckKpiJanela(D, F, P.ini, P.fim, X), prev: ckKpiJanela(D, F, P.prev.ini, P.prev.fim, X) }; }
/* os 5 KPIs operacionais do Hoje, agora fora da tela */
function ckKpisHoje(D, X) {
  const eu = D.membros.find(m => m.eu)?.id || "eu", T = D.tar, ate5 = X.cal.add(X.cal.next(X.hoje), 4);
  const meu = T.filter(t => ckOpen(t) && t.resp === eu), venc = T.filter(t => ckOpen(t) && t.prazo && t.prazo < X.hoje), prox = T.filter(t => ckOpen(t) && t.prazo && t.prazo >= X.hoje && t.prazo <= ate5), blq = T.filter(t => t.status === "bloqueada");
  return { eu, meu, venc, prox, blq, ate5 };
}

/* ---------------------------------------------------------------- andamento */
/* status de uma tarefa num dia, reconstituído pela criação, conclusão e o histórico de mudanças de status */
function ckStatusEm(t, d) {
  if (!t.criada || t.criada > d) return null;
  if (t.concluida && t.concluida <= d) return "concluída";
  const hs = (t.hist || []).filter(h => h.depois?.status);
  let st = null; for (const h of hs) { const hd = iso(new Date(h.at)); if (hd <= d) st = h.depois.status; }
  if (st === "concluída") st = "em revisão";
  return st || hs[0]?.antes?.status || (ckOpen(t) ? t.status : "a fazer");
}
const ckInicio = t => { const h = (t.hist || []).find(h => h.depois?.status === "em andamento"); return h ? iso(new Date(h.at)) : null; };
function ckBurnup(D, F, P, X) {
  const T = D.tar.filter(ckFT(F)), escopo = T.filter(t => ckIn(t.prazo, P.ini, P.fim));
  const pts = P.dias.map(d => ({ d, escopo: escopo.filter(t => !t.criada || t.criada <= d).length, plan: escopo.filter(t => t.prazo <= d).length, real: d <= X.hoje ? escopo.filter(t => t.concluida && t.concluida <= d).length : null }));
  return { pts, ids: ids(escopo), total: escopo.length, feitas: escopo.filter(t => t.concluida && t.concluida <= P.fim).length };
}
function ckStatusSemanal(D, F, P) {
  const T = D.tar.filter(ckFT(F));
  return P.semanas.map(w => { const e = addDays(w, 6), c = { "a fazer": 0, "em andamento": 0, "bloqueada": 0, "em revisão": 0 }, concl = T.filter(t => ckIn(t.concluida, w, e));
    for (const t of T) { const s = ckStatusEm(t, e); if (s && s !== "concluída") c[s] = (c[s] || 0) + 1; }
    return { w, ...c, concluidas: concl.length, conclIds: ids(concl) }; });
}
function ckFluxo(D, F, P, X) {
  const T = D.tar.filter(ckFT(F));
  return P.semanas.map(w => { const e = addDays(w, 6), cs = T.filter(t => ckIn(t.concluida, w, e)), lead = cs.filter(t => t.criada).map(t => Math.max(0, X.cal.diff(t.criada, t.concluida))), cyc = cs.map(t => [t, ckInicio(t)]).filter(([, i]) => i).map(([t, i]) => Math.max(0, X.cal.diff(i, t.concluida)));
    return { w, thr: cs.length, ids: ids(cs), lead: ckAvg(lead), cycle: ckAvg(cyc), nCycle: cyc.length }; });
}
/* horas planejadas pelo CPM de uma tarefa aberta dentro de [a, b] */
function ckHorasPlan(t, r, a, b, cal) { if (!r || r.ef < a || r.es > b) return 0; const x = r.es < a ? a : r.es, z = r.ef > b ? b : r.ef, k = Math.max(1, cal.diff(x, z) + 1); return ckRem(t) * k / r.dur; }
function ckEsforco(D, F, P, X) {
  const T = D.tar.filter(ckFT(F)), fut0 = X.cal.next(X.hoje > P.ini ? X.hoje : P.ini), proj = {}, tag = {};
  const add = (o, k, campo, h, id) => { const r = (o[k] ||= { feito: 0, plan: 0, ids: [] }); r[campo] += h; if (!r.ids.includes(id)) r.ids.push(id); };
  for (const t of T) { let h = 0, campo = null;
    if (ckIn(t.concluida, P.ini, P.fim)) { h = +t.esforco || 0; campo = "feito"; } else if (ckOpen(t) && P.fim >= fut0) { h = ckHorasPlan(t, X.R[t.id], fut0, P.fim, X.cal); campo = "plan"; }
    if (!campo || !h) continue; add(proj, t.projeto || "", campo, h, t.id); for (const g of (t.tags || []).length ? t.tags : ["sem tag"]) add(tag, g, campo, h, t.id); }
  return { proj, tag };
}
function ckMarcos(D, F, P, X) {
  return D.marcos.filter(m => (!F.proj || m.projeto === F.proj) && (ckIn(m.data, P.ini, P.fim) || (!m.feito && m.data >= P.ini && m.data <= addDays(P.fim, 92)))).sort((a, b) => a.data.localeCompare(b.data)).map(m => {
    const r = ckMarcoPrev(m, D.tar, X.R), desv = r.prev ? X.cal.diff(m.data, r.prev) : null;
    return { id: m.id, nome: m.nome, tipo: m.tipo, data: m.data, projeto: m.projeto, feito: !!m.feito, prev: r.prev, desvio: desv, st: m.feito ? "feito" : r.late.length ? "risco" : r.ts.length ? "ok" : "sem", ids: ids(r.ts), late: ids(r.late) }; });
}

/* ---------------------------------------------------------------- equipe */
function ckCargaPeriodo(D, F, P, X, m) {
  const T = D.tar.filter(t => (!F.proj || t.projeto === F.proj) && (!F.tag || (t.tags || []).includes(F.tag))), hojeU = X.cal.next(X.hoje), hpd = ckHpdOf(m, D.cfg), out = { id: m.id };
  const fimPas = X.cal.prev(addDays(X.hoje, -1));
  if (P.ini <= fimPas) { const a = P.ini, b = P.fim < fimPas ? P.fim : fimPas, n = ckDu(a, b, X.cal), cs = T.filter(t => t.resp === m.id && ckIn(t.concluida, a, b)), h = cs.reduce((s, t) => s + (+t.esforco || 0), 0), ag = m.eu ? ckAgendaHOf(D.eventos, D.cfg, a, b, X.cal) : 0, cap = Math.max(1, hpd * n - ag);
    out.real = { n, h, cap, load: h / cap, ids: ids(cs) }; }
  if (P.fim >= hojeU) { const a = P.ini > hojeU ? X.cal.next(P.ini) : hojeU; out.plan = ckCargaCalc({ tasks: T, R: X.R, membro: m, d0: a, d1: P.fim, eventos: D.eventos, cfg: D.cfg, lim: X.lim }); }
  return out;
}
function ckEquipeComp(D, F, P, X) {
  return D.membros.filter(m => !F.pes || m.id === F.pes).map(m => { const Fm = { ...F, pes: m.id }, k = ckKpiJanela(D, Fm, P.ini, P.fim, X), kp = ckKpiJanela(D, Fm, P.prev.ini, P.prev.fim, X), T = D.tar.filter(ckFT(Fm)), blq = T.filter(t => t.status === "bloqueada");
    const sem = P.semanas.slice(-8).map(w => { const e = addDays(w, 6), cs = T.filter(t => ckIn(t.concluida, w, e) && t.prazo); return { w, n: cs.length, pct: cs.length ? cs.filter(t => t.concluida <= t.prazo).length / cs.length : null }; });
    return { id: m.id, concl: k.concl, conclIds: k.conclIds, atr: k.atrasos, atrIds: k.atrIds, blq: blq.length, blqIds: ids(blq), pct: k.pctPrazo, pctPrev: kp.pctPrazo, nComPrazo: k.nComPrazo, sem, carga: ckCargaPeriodo(D, F, P, X, m) }; });
}
/* horas por pessoa e dia útil: realizadas (concluídas no dia) até ontem, planejadas pelo CPM de hoje em diante */
function ckHeat(D, F, P, X) {
  const T = D.tar.filter(t => (!F.proj || t.projeto === F.proj) && (!F.tag || (t.tags || []).includes(F.tag))), semanal = P.dias.length > 45, cols = semanal ? P.semanas.filter(w => addDays(w, 6) >= P.ini && w <= P.fim) : P.dias;
  const rows = D.membros.filter(m => !F.pes || m.id === F.pes).map(m => { const hpd = ckHpdOf(m, D.cfg), mine = T.filter(t => t.resp === m.id);
    const val = (a, b) => { const n = Math.max(1, ckDu(a, b, X.cal)); let h = 0; const parts = [];
      for (const t of mine) { if (t.concluida && ckIn(t.concluida, a, b) && t.concluida < X.hoje) { h += +t.esforco || 0; parts.push(t.id); } else if (ckOpen(t) && b >= X.hoje) { const x = ckHorasPlan(t, X.R[t.id], a < X.hoje ? X.cal.next(X.hoje) : a, b, X.cal); if (x) { h += x; parts.push(t.id); } } }
      return { h, cap: hpd * n, v: h / (hpd * n), ids: parts }; };
    return { id: m.id, cells: cols.map(c => semanal ? val(c, addDays(c, 6) > P.fim ? P.fim : addDays(c, 6)) : val(c, c)) }; });
  return { semanal, cols, rows };
}
const ckPdiPct = p => (p?.comps || []).length ? ckAvg(p.comps.map(x => clamp((+x.nivel || 0) / (+(x.alvo ?? 3) || 3)))) : null;
const ckNivelEm = (c, d) => { const h = (c.hist || []).filter(x => x.data <= d).at(-1); return h ? +h.nivel : null; };
function ckPessoaCard(D, F, P, X, m) {
  const p = D.pdi[m.id] || { comps: [], metas: [] }, um = D.meet.filter(x => x.tipo === "1a1" && x.membro === m.id).sort((a, b) => b.data.localeCompare(a.data)), u = um[0];
  const evo = P.semanas.slice(-10).map(w => { const e = addDays(w, 6), v = (p.comps || []).map(c => ckNivelEm(c, e)).filter(isNum); return { w, v: v.length ? ckAvg(v) : null }; });
  const byId = new Map(D.tar.map(t => [t.id, t])), pend = um.flatMap(x => (x.acoes || []).filter(a => a.tarefa ? (byId.get(a.tarefa) && ckOpen(byId.get(a.tarefa))) : x === u).map(a => ({ ...a, de: x.data, meet: x.id })));
  return { id: m.id, trilha: p.trilha || "", comps: (p.comps || []).map(c => ({ nome: c.nome, nivel: +c.nivel || 0, alvo: +(c.alvo ?? 3) })), pct: ckPdiPct(p), evo, ult1a1: u?.data || null, dias1a1: u ? diff(X.hoje, u.data) : null, meetIds: um.map(x => x.id), pend, metas: (p.metas || []).filter(x => !x.feito) };
}

/* ---------------------------------------------------------------- riscos e problemas */
function ckMatrizRiscos(risks, d) { const M = {}; for (const r of risks) { if (d ? !ckRiscoAbertoEm(r, d) : r.status === "fechado") continue; const k = `${r.prob}|${r.imp}`; (M[k] ||= []).push(r.id); } return M; }
const ckSemMitig = (r, tarById) => !(r.mitig || "").trim() && !(r.tarefas || []).some(id => tarById.get(id) && ckOpen(tarById.get(id)));
function ckRiscos(D, F, P, X) {
  const R = D.risk.filter(ckFR(F)), ab = R.filter(r => ckRiscoAbertoEm(r, P.fim)), byId = new Map(D.tar.map(t => [t.id, t]));
  const top = [...ab].sort((a, b) => ckRiscoScore(b) - ckRiscoScore(a) || (a.criado || "").localeCompare(b.criado || "")).slice(0, 5).map(r => ({ id: r.id, cod: r.cod, desc: r.desc, score: ckRiscoScore(r), semMitig: ckSemMitig(r, byId), dono: r.dono, status: r.status }));
  return { matriz: ckMatrizRiscos(R, P.fim), abertos: ab.length, abIds: ids(ab), top, novos: R.filter(r => ckIn(r.criado, P.ini, P.fim)).length, novosIds: ids(R.filter(r => ckIn(r.criado, P.ini, P.fim))), semMitigIds: ids(ab.filter(r => ckSemMitig(r, byId))) };
}
function ckProblemas(D, F, P, X) {
  const I = D.iss.filter(ckFI(F)), ab = I.filter(p => ckProbAbertoEm(p, P.fim));
  const sem = P.semanas.map(w => { const e = addDays(w, 6), a = I.filter(p => ckIn(p.criado, w, e)), r = I.filter(p => ckIn(p.resolvido, w, e)); return { w, abertos: a.length, resolvidos: r.length, aIds: ids(a), rIds: ids(r), estoque: I.filter(p => ckProbAbertoEm(p, e)).length }; });
  const idade = ab.map(p => ({ id: p.id, cod: p.cod, titulo: p.titulo, sev: p.sev, dias: diff(P.fim < X.hoje ? P.fim : X.hoje, p.criado), semSol: !(p.solucoes || []).length })).sort((a, b) => b.dias - a.dias);
  const res = I.filter(p => ckIn(p.resolvido, P.ini, P.fim) && p.criado);
  return { sem, idade, abertos: ab.length, abIds: ids(ab), semSolIds: idade.filter(x => x.semSol).map(x => x.id), tRes: ckAvg(res.map(p => Math.max(0, X.cal.diff(p.criado, p.resolvido)))), nRes: res.length, resIds: ids(res) };
}

/* ---------------------------------------------------------------- BIM e entregas */
const CK_ELF = ["in redazione", "in verifica", "emesso", "approvato"];
function ckBimAgg(D, F, P, X) {
  const B = D.bim.filter(ckFB(F)), cl = B.filter(b => b.tipo === "clash").map(b => { const s = (b.snaps || []).filter(x => x.data <= P.fim).slice(-8), u = s.at(-1), a = s.at(-2); return { id: b.id, cod: b.cod, disc: b.disc || "?", projeto: b.projeto, serie: s, abertos: u?.abertos ?? null, resolvidos: u?.resolvidos ?? null, delta: u && a ? u.abertos - a.abertos : null }; }).filter(x => x.serie.length);
  const mods = B.filter(b => b.tipo === "modelo"), loin = B.filter(b => b.tipo === "loin"), bep = B.filter(b => b.tipo === "bep").sort((a, b) => (b.data || "").localeCompare(a.data || "")), ifc = B.filter(b => b.tipo === "ifc");
  const st = {}; for (const m of mods) (st[m.stato || "?"] ||= []).push(m.id);
  const ifcP = ifc.filter(x => ckIn(x.prevista, P.ini, P.fim)), ifcE = ifcP.filter(x => x.entregue && x.entregue <= P.fim);
  return { clash: cl, modelos: st, nMod: mods.length, loin: { ok: loin.filter(x => x.ok).length, n: loin.length, nokIds: ids(loin.filter(x => !x.ok)), ids: ids(loin) }, bep: bep[0] ? { id: bep[0].id, versao: bep[0].versao, stato: bep[0].stato, data: bep[0].data } : null, ifc: { prev: ifcP.length, ent: ifcE.length, ids: ids(ifcP), pendIds: ids(ifcP.filter(x => !ifcE.includes(x))) } };
}
function ckElAgg(D, F, P, X) {
  const E = D.el.filter(ckFE(F)), fun = CK_ELF.map(s => { const xs = E.filter(e => CK_ELF.indexOf(e.stato) >= CK_ELF.indexOf(s)); return { s, n: xs.length, ids: ids(xs) }; }), rev = {};
  for (const e of E) (rev[e.rev || "–"] ||= []).push(e.id);
  const prev = E.filter(e => ckIn(e.prevista, P.ini, P.fim)), ent = prev.filter(e => e.emissao && e.emissao <= P.fim), aRev = E.filter(e => e.stato === "da revisionare"), atr = E.filter(e => e.prevista && e.prevista < X.hoje && !["emesso", "approvato"].includes(e.stato));
  return { funil: fun, rev, prev: prev.length, ent: ent.length, prevIds: ids(prev), entIds: ids(ent), aRevIds: ids(aRev), atrIds: ids(atr), total: E.length };
}

/* ---------------------------------------------------------------- conhecimento e decisões */
const CK_ESCOPO = ["escopo", "demanda", "cliente"];
function ckConhecimento(D, F, P, X) {
  const dec = D.dec.filter(ckFD(F)).filter(d => ckIn(d.data, P.ini, P.fim)), porProj = {}; for (const d of dec) (porProj[d.projeto || ""] ||= []).push(d.id);
  const L = D.log.filter(ckFL(F)), sem = P.semanas.map(w => { const e = addDays(w, 6), xs = L.filter(x => ckIn(x.data, w, e)), es = xs.filter(x => CK_ESCOPO.includes(x.tipo)); return { w, total: xs.length, escopo: es.length, outros: xs.length - es.length, ids: ids(xs), escIds: ids(es) }; });
  const escP = L.filter(x => ckIn(x.data, P.ini, P.fim) && CK_ESCOPO.includes(x.tipo)), escA = L.filter(x => ckIn(x.data, P.prev.ini, P.prev.fim) && CK_ESCOPO.includes(x.tipo));
  const lic = D.lic.filter(ckFLic(F)).filter(l => ckIn(l.data, P.ini, P.fim));
  return { dec: dec.length, decIds: ids(dec), porProj, logSem: sem, escopo: escP.length, escopoPrev: escA.length, escIds: ids(escP), logN: L.filter(x => ckIn(x.data, P.ini, P.fim)).length, logIds: ids(L.filter(x => ckIn(x.data, P.ini, P.fim))), lic: lic.length, licIds: ids(lic), licT: lic.map(l => ({ id: l.id, cod: l.cod, titulo: l.titulo })) };
}

/* ---------------------------------------------------------------- minha agenda (estimada pelo esforço e pelas reuniões) */
function ckAgendaCat(tags) { for (const [k, , ts] of CK_AGENDA) if (ts.some(x => (tags || []).includes(x))) return k; return "tecnica"; }
function ckMinhaAgenda(D, F, P, X) {
  const eu = D.membros.find(m => m.eu)?.id || "eu", h = { tecnica: 0, coordenacao: 0, equipe: 0, admin: 0 }, idsCat = { tecnica: [], coordenacao: [], equipe: [], admin: [] }, fut0 = X.cal.next(X.hoje > P.ini ? X.hoje : P.ini);
  const T = D.tar.filter(t => !F.proj || t.projeto === F.proj);
  for (const t of T) { let x = 0;
    if (t.resp === eu && ckIn(t.concluida, P.ini, P.fim)) x = +t.esforco || 0; else if (t.resp === eu && ckOpen(t) && P.fim >= fut0) x = ckHorasPlan(t, X.R[t.id], fut0, P.fim, X.cal);
    if (x) { const c = ckAgendaCat(t.tags); h[c] += x; idsCat[c].push(t.id); }
    if (t.revisor === eu && ckIn(t.concluida, P.ini, P.fim)) { h.equipe += (+t.esforco || 0) * X.lim.revisaoFrac; idsCat.equipe.push(t.id); } }
  const ag = ckAgendaHOf(D.eventos, D.cfg, P.ini, P.fim, X.cal); h.coordenacao += ag;
  const ms = D.meet.filter(x => ckIn(x.data, P.ini, P.fim) && (!F.proj || !x.projeto || x.projeto === F.proj));
  for (const x of ms) { if (x.tipo === "1a1") h.equipe += X.lim.horas1a1; else h.coordenacao += X.lim.horasReuniao; }
  const tot = h.tecnica + h.coordenacao + h.equipe + h.admin, sh = k => tot ? h[k] / tot : null;
  const alerta = tot > 0 && sh("tecnica") > X.lim.agendaTecnicaMax && sh("coordenacao") < X.lim.agendaCoordMin;
  return { h, tot, share: { tecnica: sh("tecnica"), coordenacao: sh("coordenacao"), equipe: sh("equipe"), admin: sh("admin") }, agendaH: ag, meetIds: ids(ms), ids: idsCat, alerta };
}

/* ---------------------------------------------------------------- tudo de uma vez */
function ckAgg(D, F, P, X) {
  return { P, F, kpis: ckKpis(D, F, P, X), burnup: ckBurnup(D, F, P, X), status: ckStatusSemanal(D, F, P), fluxo: ckFluxo(D, F, P, X), esforco: ckEsforco(D, F, P, X), marcos: ckMarcos(D, F, P, X),
    equipe: ckEquipeComp(D, F, P, X), heat: ckHeat(D, F, P, X), pessoas: D.membros.filter(m => !F.pes || m.id === F.pes).map(m => ckPessoaCard(D, F, P, X, m)), riscos: ckRiscos(D, F, P, X), problemas: ckProblemas(D, F, P, X),
    bim: ckBimAgg(D, F, P, X), el: ckElAgg(D, F, P, X), conh: ckConhecimento(D, F, P, X), agenda: ckMinhaAgenda(D, F, P, X) };
}

/* ---------------------------------------------------------------- snapshot diário (o que as datas não reconstituem) */
function ckSnapCalc(D, X) {
  const T = D.tar, open = T.filter(ckOpen), st = {}, pes = {}, proj = {};
  for (const t of open) st[t.status] = (st[t.status] || 0) + 1;
  const minOf = ts => { let m = null; for (const t of ts) { const f = X.R[t.id]?.folga; if (f != null && (m == null || f < m)) m = f; } return m; };
  for (const m of D.membros) { const ts = open.filter(t => t.resp === m.id), c = ckCargaCalc({ tasks: T, R: X.R, membro: m, d0: X.cal.next(X.hoje), d1: X.cal.add(X.cal.next(X.hoje), X.lim.janelaCarga - 1), eventos: D.eventos, cfg: D.cfg, lim: X.lim });
    pes[m.id] = { ab: ts.length, atr: ts.filter(t => t.prazo && t.prazo < X.hoje).length, blq: ts.filter(t => t.status === "bloqueada").length, carga: Math.round(c.load * 100) / 100, minF: minOf(ts) }; }
  for (const p of D.projetos) { const ts = open.filter(t => t.projeto === p.id); if (ts.length) proj[p.id] = { ab: ts.length, minF: minOf(ts) }; }
  return { d: X.hoje, ab: open.length, venc: open.filter(t => t.prazo && t.prazo < X.hoje).length, st, minF: minOf(open), crit: open.filter(t => X.R[t.id]?.crit).length, pes, proj,
    rAltos: D.risk.filter(r => ckRiscoAbertoEm(r, X.hoje) && ckRiscoScore(r) >= X.lim.riscoAlto).length, rAb: D.risk.filter(r => ckRiscoAbertoEm(r, X.hoje)).length, pAb: D.iss.filter(p => ckProbAbertoEm(p, X.hoje)).length,
    clash: D.bim.filter(b => b.tipo === "clash").reduce((s, b) => s + (+ckClashEm(b, X.hoje)?.abertos || 0), 0), elAtr: D.el.filter(e => e.prevista && e.prevista < X.hoje && !["emesso", "approvato"].includes(e.stato)).length };
}
/* grava (ou atualiza) o registro de hoje; nunca no modo exemplo nem com dados de exemplo */
function ckSnapTake() {
  if (!LOADED || EX_MODE || IS_EXAMPLE || (!ckT().length && ckD().membros.length <= 1)) return false;
  const s = ckSnapCalc(ckDados(), ckCtx()), L = ckA("ckSnap"), i = L.findIndex(x => x.d === s.d), old = i >= 0 ? JSON.stringify(L[i]) : null;
  if (old === JSON.stringify(s)) return false;
  if (i >= 0) L[i] = s; else { L.push(s); L.sort((a, b) => a.d.localeCompare(b.d)); }
  touch("ckSnap", { noUndo: true, noRender: true }); return true;
}
