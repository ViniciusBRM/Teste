/* ================================================================ Cockpit de Trabalho: Dashboard (analítico)
   Hoje, Semana e Mês dizem o que fazer agora; o Dashboard mostra tendências, comparações e a visão por pessoa e por projeto
   no período escolhido (com o período anterior ao lado). Todos os números vêm da camada de agregação (49-cockpit-agg.js), e
   cada número clicável leva à aba certa com exatamente os itens que o compõem (drill-down).
   Filtros: na sessão (sessionStorage). Layout (ordem e widgets ocultos): ck.cfg.dash, no banco privado. */
const CKD_LS = "atlas_ck_dash";
function ckDashS() {
  if (!CK.dash) { let s = null; try { s = JSON.parse(sessionStorage.getItem(CKD_LS) || "null"); } catch {} CK.dash = { per: "mes", ref: TODAY, ini: "", fim: "", pes: "", proj: "", tag: "", sec: 0, ...(s || {}), reuniao: false, edit: false }; }
  const d = CK.dash; if (d.pes && !ckM(d.pes)) d.pes = ""; if (d.proj && !ckP(d.proj)) d.proj = ""; return d;
}
function ckDashSave() { try { const { reuniao, edit, ...o } = CK.dash; sessionStorage.setItem(CKD_LS, JSON.stringify(o)); } catch {} }
const ckDashF = () => { const d = ckDashS(); return { pes: d.pes, proj: d.proj, tag: d.tag }; };
const ckDashP = () => { const d = ckDashS(); return ckPeriodo(d.per, d.ref || TODAY, ckCal(), d.ini, d.fim); };
function ckDashAgg() { const F = ckDashF(), P = ckDashP(); return memo(`ckdash|${JSON.stringify(F)}|${P.tipo}|${P.ini}|${P.fim}`, () => ckAgg(ckDados(), F, P, ckCtx())); }

/* ---------------------------------------------------------------- drill-down: o conjunto exato de itens vai para a aba certa */
let CK_DR = {}, CK_DRN = 0;
const CK_DRV = { tar: "lista", gantt: "gantt", risk: "riscos", iss: "problemas", dec: "decisoes", log: "log", el: "entregas", bim: "bim", meet: "reunioes", pessoa: "pessoa" };
function ckDr(kind, idsList, label, extra = {}) { const k = "d" + (++CK_DRN); CK_DR[k] = { kind: kind === "gantt" ? "tar" : kind, view: extra.view || CK_DRV[kind], ids: [...new Set(idsList || [])], label, extra }; return k; }
const ckDrA = (kind, idsList, label, extra) => `data-ckdrill="${ckDr(kind, idsList, label, extra)}" role="button" tabindex="0"`;
function ckDrillGo(k) {
  const d = CK_DR[k]; if (!d) return; const F = ckDashF();
  if (d.extra.pessoa) CK.pessoa = d.extra.pessoa;
  if (d.view === "pessoa") { CK.drill = null; CK.drillSet = null; setHash("trabalho", "pessoa"); return; }
  CK.drill = { view: d.view, kind: d.kind, ids: d.ids, label: d.label, from: "Dashboard" }; CK.drillSet = new Set(d.ids);
  /* os filtros do Dashboard seguem junto, a menos que escondam algum item do conjunto (a lista tem de bater com o número) */
  const L = { tar: ckT(), risk: ckA("ckRisk"), iss: ckA("ckIss"), dec: ckA("ckDec"), log: ckA("ckLog"), el: ckA("ckEl"), bim: ckA("ckBim"), meet: ckA("ckMeet"), lic: ckA("ckLic") }[d.kind] || [], its = L.filter(x => CK.drillSet.has(x.id));
  const all = fn => its.every(fn), proj = F.proj && all(x => x.projeto === F.proj) ? F.proj : "";
  CK.f = { proj, resp: d.kind === "tar" && F.pes && all(x => x.resp === F.pes) ? F.pes : "", tag: (d.kind === "tar" || d.kind === "lic") && F.tag && all(x => (x.tags || []).includes(F.tag)) ? F.tag : "", q: "", st: "" };
  if (d.extra.bimTipo) CK.bimTipo = d.extra.bimTipo;
  if (d.view === "gantt") CK.gproj = d.extra.gproj != null && all(x => x.projeto === d.extra.gproj) ? d.extra.gproj : proj;
  if (d.view === "lista") { CK.eis = false; CK.listaN = Math.max(200, d.ids.length); }
  if (d.view === "riscos") CK.rcell = "";
  if (d.view === "log") { CK.lf = ""; CK.lq = ""; CK.lproj = proj; }
  if (d.view === "decisoes") CK.dq = ""; if (d.view === "licoes") CK.lcq = ""; if (d.view === "reunioes") CK.meet = null;
  setHash("trabalho", d.view);
}
const ckDrillOn = kind => !!CK.drill && CK.drill.kind === kind && CK.drill.view === SUB;
const ckDrillHas = (kind, id) => !ckDrillOn(kind) || (CK.drillSet ||= new Set(CK.drill.ids)).has(id);
function ckDrillChip(view) { const d = CK.drill; if (!d || d.view !== view) return ""; return `<div class="ckdrill">${ic("filter")}<span>Do ${esc(d.from)}: <b>${esc(d.label)}</b> · ${plural(d.ids.length, "item", "itens")}</span><button type="button" class="btn sm ghost" data-act="ckdrillx">${ic("x")}Limpar</button><a class="lnk" href="#trabalho.dashboard">voltar ao Dashboard</a></div>`; }

/* ---------------------------------------------------------------- pequenos gráficos próprios do Dashboard */
const ckPctT = v => v == null ? "–" : pct(v);
function ckDelta(cur, prev, { up = true, fmt = v => num(v, 0), unit = "", punit = unit } = {}) {
  if (!isNum(cur) || !isNum(prev)) return `<span class="dl none">sem base anterior</span>`;
  const d = cur - prev; if (Math.abs(d) < 1e-9) return `<span class="dl none">= período anterior</span>`;
  const good = up ? d > 0 : d < 0; return `<span class="dl ${good ? "good" : "crit"}">${d > 0 ? "▲" : "▼"} ${esc(fmt(Math.abs(d)))}${unit} <em>vs anterior (${esc(fmt(prev))}${punit})</em></span>`;
}
function ckStack(parts, o = {}) { const tot = sum(parts.map(p => p.v)); if (!tot) return emptyChart(o.empty || "Sem horas no período.");
  return `<div class="ckstack">${parts.filter(p => p.v > 0).map(p => `<i style="width:${(p.v / tot * 100).toFixed(2)}%;background:${p.color}" ${p.dr ? `data-ckdrill="${p.dr}"` : ""} ${tip(`${p.l}: ${num(p.v, 1)} h (${pct(p.v / tot)})`)}></i>`).join("")}</div>${legend(parts.map(p => ({ name: `${p.l} · ${num(p.v, 0)} h (${pct(p.v / tot)})`, color: p.color })))}`; }
function ckRadar(comps, o = {}) {
  const n = comps.length; if (n < 3) return comps.length ? `<div class="ckmicro">${comps.map(c => `<div><span>${esc(c.nome)}</span>${ckBarra(c.nivel / 4, c.alvo / 4)}<b>${c.nivel}/${c.alvo}</b></div>`).join("")}</div>` : emptyChart("Sem competências no PDI.");
  const W = 320, H = 210, cx = 160, cy = 106, r = 58, pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r * v / 4, cy + Math.sin(a) * r * v / 4]; };
  let g = ""; for (const v of [1, 2, 3, 4]) g += `<polygon points="${comps.map((_, i) => pt(i, v).map(z => z.toFixed(1)).join(",")).join(" ")}" class="rgrid"/>`;
  comps.forEach((c, i) => { const [x, y] = pt(i, 4), [lx, ly] = pt(i, 4.9); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rgrid"/><text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" class="ax rl" text-anchor="${lx < cx - 6 ? "end" : lx > cx + 6 ? "start" : "middle"}">${esc(trunc(c.nome, 15))}</text>`; });
  const poly = (k, col, dash, op) => `<polygon points="${comps.map((c, i) => pt(i, c[k]).map(z => z.toFixed(1)).join(",")).join(" ")}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="2"${dash ? ' stroke-dasharray="4 3"' : ""}/>`;
  g += poly("alvo", "var(--muted)", true, 0) + poly("nivel", o.cor || "var(--a-apr)", false, .15) + comps.map((c, i) => { const [x, y] = pt(i, c.nivel); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${o.cor || "var(--a-apr)"}" ${tip(`${c.nome}: nível ${c.nivel} de ${c.alvo} (${CK_NIVEL_COMP[c.nivel] || ""})`)}/>`; }).join("");
  return svgWrap(W, H, g, "Radar do PDI", "chart ckradar");
}
const ckBarra = (v, mark) => `<span class="ckbarmini" aria-hidden="true"><i style="width:${Math.round(clamp(v) * 100)}%"></i>${mark != null ? `<b style="left:${Math.round(clamp(mark) * 100)}%"></b>` : ""}</span>`;
const ckSemLbl = w => fmtD(w);
const ckCorPes = id => { const i = ckD().membros.findIndex(m => m.id === id); return CK_CORES[(i < 0 ? 0 : i) % CK_CORES.length]; };
const ckVazioW = (txt, aba, lbl) => `<div class="empty">${esc(txt)}${aba ? ` Registre em <a class="lnk" href="#trabalho.${aba}">${esc(lbl)}</a>.` : ""}</div>`;

/* ---------------------------------------------------------------- widgets */
const CKW = [
  ["kpis", "andamento", "KPIs do período", 12], ["burnup", "andamento", "Burnup: planejado × realizado", 6], ["status", "andamento", "Status por semana", 6], ["fluxo", "andamento", "Throughput, lead time e cycle time", 12],
  ["esforco", "andamento", "Esforço por projeto e por tag", 6], ["marcos", "andamento", "Previsão dos marcos", 6], ["carga", "equipe", "Carga × capacidade", 6], ["comp", "equipe", "Comparativo por pessoa", 6],
  ["heat", "equipe", "Horas por pessoa e dia útil", 12], ["pessoas", "equipe", "Desenvolvimento e 1:1", 12],
  ["matriz", "riscos", "Riscos: probabilidade × impacto", 4], ["top5", "riscos", "Top 5 riscos", 8], ["problemas", "riscos", "Problemas abertos × resolvidos", 12],
  ["clash", "bim", "Clash por par de disciplinas", 6], ["modelos", "bim", "Modelos, LOIN e BEP", 6], ["funil", "bim", "Elaborati e consegne IFC", 12],
  ["decisoes", "conh", "Decisões do período", 4], ["diario", "conh", "Diário de bordo: eventos e demandas", 8], ["licoes", "conh", "Lições do período", 12],
  ["agenda", "agenda", "Minha agenda", 12], ["insights", "insights", "Insights do PMO", 12]];
const CKW_SEC = { andamento: "Andamento", equipe: "Equipe", riscos: "Riscos e problemas", bim: "BIM e entregas", conh: "Conhecimento e decisões", agenda: "Minha agenda", insights: "Insights do PMO" };
/* a ordem visível é por seção (na ordem em que aparecem) e, dentro dela, por widget: mover dentro da seção troca vizinhos;
   no limite da seção, a seção inteira troca de lugar com a vizinha */
function ckDashGroups(ordem) { const G = []; for (const id of ordem) { const s = CKW.find(w => w[0] === id)[1]; let g = G.find(x => x.s === s); if (!g) G.push(g = { s, ids: [] }); g.ids.push(id); } return G; }
function ckDashMove(ordem, id, dir) {
  const G = ckDashGroups(ordem), gi = G.findIndex(g => g.ids.includes(id)), g = G[gi], k = g.ids.indexOf(id), j = k + dir;
  if (j >= 0 && j < g.ids.length) [g.ids[k], g.ids[j]] = [g.ids[j], g.ids[k]];
  else if (G[gi + dir]) [G[gi], G[gi + dir]] = [G[gi + dir], G[gi]];
  return G.flatMap(x => x.ids);
}
function ckDashLayout() { const c = ckD().cfg.dash || {}, ids = CKW.map(w => w[0]), ord = [...(c.ordem || []).filter(x => ids.includes(x)), ...ids.filter(x => !(c.ordem || []).includes(x))]; return { ordem: ord, ocultos: (c.ocultos || []).filter(x => ids.includes(x)) }; }

function ckW_kpis(A) {
  const c = A.kpis.cur, p = A.kpis.prev, P = A.P, k = (cor, l, v, d, dr) => `<div class="km ckkm${dr ? " click" : ""}" style="--c:${cor}" ${dr || ""}><div class="kml">${l}</div><div class="kmv">${v}</div><div class="kms">${d}</div></div>`;
  return `<div class="krow ckkrow">${[
    k("var(--a-car)", "Concluídas / planejadas", `${c.concl} / ${c.plan}`, ckDelta(c.concl, p.concl), ckDrA("tar", c.conclIds, `concluídas em ${P.label}`)),
    k("var(--good)", "% no prazo", ckPctT(c.pctPrazo), `${c.nComPrazo} com prazo · ${ckDelta(c.pctPrazo == null ? null : c.pctPrazo * 100, p.pctPrazo == null ? null : p.pctPrazo * 100, { unit: " p.p.", punit: "%" })}`, ckDrA("tar", c.prazoIds, `concluídas com prazo em ${P.label}`)),
    k("var(--crit)", "Atrasos", String(c.atrasos), ckDelta(c.atrasos, p.atrasos, { up: false }), ckDrA("tar", c.atrIds, `atrasadas em ${P.label}`)),
    k("var(--warn)", "Menor folga (caminho crítico)", c.minF == null ? "–" : `${c.minF} d.u.`, c.fonteF === "snap" ? "do registro diário" : ckDelta(c.minF, p.minF, { unit: " d.u." }), c.minIds.length ? ckDrA("gantt", c.minIds, "tarefas com a menor folga") : ""),
    k("var(--a-fam)", `Riscos altos (≥ ${ckLim("riscoAlto")})`, String(c.riscosAltos), ckDelta(c.riscosAltos, p.riscosAltos, { up: false }), ckDrA("risk", c.riscoIds, "riscos com score alto")),
    k("var(--a-amo)", "Problemas abertos", String(c.probAbertos), `${c.tRes == null ? "sem resolvidos" : `resolução média ${num(c.tRes, 1)} d.u.`} · ${ckDelta(c.probAbertos, p.probAbertos, { up: false })}`, ckDrA("iss", c.probIds, "problemas abertos no fim do período")),
    k("var(--a-apr)", "Elaborati entregues / previstos", `${c.elEnt} / ${c.elPrev}`, ckDelta(c.elPrev ? c.elEnt / c.elPrev * 100 : null, p.elPrev ? p.elEnt / p.elPrev * 100 : null, { unit: " p.p.", punit: "%" }), ckDrA("el", c.elIds, `elaborati previstos em ${P.label}`)),
    k("var(--a-men)", "Clash abertos", String(c.clash), ckDelta(c.clash, p.clash, { up: false }), ckDrA("bim", c.clashIds, "verificações de clash", { bimTipo: "clash" }))].join("")}</div><p class="muted small">Comparação com ${fmtDY(P.prev.ini)} a ${fmtDY(P.prev.fim)} (${P.prev.du} dias úteis${P.prev.parcial ? ": o período está em andamento, então vale o mesmo trecho do anterior" : ""}). ${P.du} dias úteis no período. Concluídas, % no prazo e atrasos contam até hoje; riscos, problemas e clash são os abertos agora.</p>`;
}
function ckW_burnup(A) {
  const B = A.burnup; if (!B.total) return ckVazioW("Nenhuma tarefa com prazo no período.", "lista", "Lista");
  const L = B.pts.map(x => fmtD(x.d)), hi = B.pts.findIndex(x => x.d >= TODAY);
  return lineChart(L, [{ name: "Escopo", color: "var(--muted)", data: B.pts.map(x => x.escopo), dash: true, fill: false, dots: false }, { name: "Planejado (prazos)", color: "var(--a-apr)", data: B.pts.map(x => x.plan), fill: false, dots: false }, { name: "Realizado", color: "var(--good)", data: B.pts.map(x => x.real), dots: false }], { w: vw(6), h: 220, fmt: v => num(v, 0), hi: hi >= 0 ? hi : null, maxLabels: 8 }) + `<p class="muted small"><a class="lnk" ${ckDrA("tar", B.ids, "escopo do período (tarefas com prazo no período)")}>${B.feitas} de ${B.total} tarefas do escopo concluídas</a></p>`;
}
function ckW_status(A) {
  const S2 = A.status, K = S2.map(s => ckDr("tar", s.conclIds, `concluídas na semana de ${fmtD(s.w)}`));
  return colChart(S2.map(s => ckSemLbl(s.w)), [{ name: "A fazer", color: "var(--muted)", data: S2.map(s => s["a fazer"]) }, { name: "Em andamento", color: "var(--accent)", data: S2.map(s => s["em andamento"]) }, { name: "Em revisão", color: "var(--a-apr)", data: S2.map(s => s["em revisão"]) }, { name: "Bloqueada", color: "var(--crit)", data: S2.map(s => s.bloqueada) }], { stacked: true, w: vw(6), h: 220, line: [{ name: "Concluídas na semana", color: "var(--good)", data: S2.map(s => s.concluidas) }], keys: K, click: "ckdrill" }) + `<p class="muted small">Situação no fim de cada semana, reconstituída pelas datas e pelo histórico de status de cada tarefa. Clique numa semana para ver as concluídas.</p>`;
}
function ckW_fluxo(A) {
  const Fx = A.fluxo, L = Fx.map(x => ckSemLbl(x.w)), K = Fx.map(x => ckDr("tar", x.ids, `concluídas na semana de ${fmtD(x.w)}`)), nC = sum(Fx.map(x => x.nCycle)), nT = sum(Fx.map(x => x.thr));
  return `<div class="ck2col"><div>${colChart(L, [{ name: "Throughput (concluídas)", color: "var(--a-car)", data: Fx.map(x => x.thr) }], { w: vw(6), h: 200, keys: K, click: "ckdrill", legend: false })}<p class="muted small">Throughput por semana · ${nT} no total</p></div>
    <div>${lineChart(L, [{ name: "Lead time (d.u.)", color: "var(--a-apr)", data: Fx.map(x => x.lead), fill: false }, { name: "Cycle time (d.u.)", color: "var(--a-men)", data: Fx.map(x => x.cycle), fill: false }], { w: vw(6), h: 200, fmt: v => num(v, 1) })}<p class="muted small">Médias semanais em dias úteis. Cycle time em ${nC} de ${nT} tarefas (só as que têm a entrada em “em andamento” registrada).</p></div></div>`;
}
function ckW_esforco(A) {
  const E = A.esforco, row = (o, nome, cor) => Object.entries(o).sort((a, b) => (b[1].feito + b[1].plan) - (a[1].feito + a[1].plan)).map(([k, v]) => { const tot = v.feito + v.plan; return `<div class="cksb" ${ckDrA("tar", v.ids, `${nome}: ${k ? (nome === "Projeto" ? ckPN(k) : k) : "sem projeto"}`)}><span class="hbl">${esc(nome === "Projeto" ? ckPN(k) : k)}</span><div class="cksbt">${v.feito ? `<i style="width:${(v.feito / mx * 100).toFixed(1)}%;background:${cor}" ${tip(`concluído: ${num(v.feito, 1)} h`)}></i>` : ""}${v.plan ? `<i class="pl" style="width:${(v.plan / mx * 100).toFixed(1)}%;background:${cor}" ${tip(`planejado: ${num(v.plan, 1)} h`)}></i>` : ""}</div><em>${num(tot, 0)} h</em></div>`; }).join("");
  const all = [...Object.values(E.proj), ...Object.values(E.tag)], mx = Math.max(1, ...all.map(v => v.feito + v.plan));
  if (!Object.keys(E.proj).length) return ckVazioW("Sem horas concluídas ou planejadas no período.", "lista", "Lista");
  return `<div class="flbl">Por projeto</div>${row(E.proj, "Projeto", "var(--a-car)")}<div class="flbl">Por tag <small class="muted">(tarefa com várias tags conta em cada uma)</small></div>${row(E.tag, "Tag", "var(--a-apr)")}${legend([{ name: "Concluído no período", color: "var(--ink-2)" }, { name: "Planejado pelo CPM até o fim do período (claro)", color: "color-mix(in srgb, var(--ink-2) 40%, transparent)" }])}`;
}
function ckW_marcos(A) {
  const M = A.marcos; if (!M.length) return ckVazioW("Nenhum marco no período nem nos 3 meses seguintes.", "contexto", "Contexto");
  return `<ul class="ckmklist">${M.map(m => `<li class="${m.st}" ${ckDrA("gantt", m.ids, `tarefas do marco “${m.nome}”`, { gproj: m.projeto })}><span class="pill ${m.st === "risco" ? "crit" : m.st === "ok" ? "good" : "none"}">${m.st === "risco" ? "em risco" : m.st === "ok" ? "no prazo" : m.st === "feito" ? "cumprido" : "sem tarefas"}</span><b>${esc(m.nome)}</b><small class="muted">${esc(ckPN(m.projeto))} · ${esc(m.tipo || "")}</small><span class="ckmkd">prazo ${fmtD(m.data)}${m.prev ? ` · previsto ${fmtD(m.prev)}${m.desvio ? ` <b class="${m.desvio > 0 ? "st-crit" : "st-good"}">${m.desvio > 0 ? "+" : ""}${m.desvio} d.u.</b>` : ""}` : ""}</span></li>`).join("")}</ul><p class="muted small">Previsto = o maior término pelo caminho crítico das tarefas abertas ligadas ao marco (a mesma conta do alerta).</p>`;
}
function ckW_carga(A) {
  const rows = A.equipe; if (!rows.length) return ckVazioW("Ninguém na equipe.", "contexto", "Contexto");
  return `<div class="ckcarga">${rows.map(x => { const c = x.carga, pl = c.plan, re = c.real;
    return `<div class="ckcr" ${ckDrA("pessoa", [], `carga de ${ckMN(x.id)}`, { pessoa: x.id, view: "pessoa" })}><span class="ckav">${esc(ckIni(x.id))}</span><span class="cknm"><b>${esc(ckMN(x.id))}</b>${pl ? `<small>planejado: ${num(pl.dem, 0)} de ${num(pl.cap, 0)} h · ${pl.n} d.u.${pl.ag ? ` · ${num(pl.ag, 0)} h de agenda` : ""}</small>` : ""}${re ? `<small>realizado: ${num(re.h, 0)} de ${num(re.cap, 0)} h · ${re.n} d.u.</small>` : ""}</span>
      <span class="ckcrb">${pl ? `<span class="ckload" ${tip(`planejado ${pct(pl.load)}`)}><i class="st-bg-${pl.st === "idle" ? "none" : pl.st}" style="width:${Math.min(100, Math.round(pl.load * 100))}%"></i></span><em class="ckloadt st-${pl.st === "idle" ? "none" : pl.st}">${pct(pl.load)} · ${CK_CST[pl.st]}</em>` : ""}${re ? `<span class="ckload" ${tip(`realizado ${pct(re.load)}`)}><i style="width:${Math.min(100, Math.round(re.load * 100))}%;background:var(--ink-2)"></i></span><em class="ckloadt">${pct(re.load)} realizado</em>` : ""}</span></div>`; }).join("")}</div><p class="muted small">Planejado: o mesmo cálculo do card “Minha carga”, de hoje até o fim do período. Realizado: horas das tarefas concluídas ÷ capacidade dos dias já passados.</p>`;
}
function ckW_comp(A) {
  const rows = A.equipe; if (!rows.length) return ckVazioW("Ninguém na equipe.", "contexto", "Contexto");
  return `<div class="hscroll"><table class="dt"><thead><tr><th>Pessoa</th><th class="num">Concluídas</th><th class="num">Atrasadas</th><th class="num">Bloqueadas</th><th class="num">% no prazo</th><th>8 semanas</th></tr></thead><tbody>${rows.map(x => `<tr><td><b>${esc(ckMN(x.id))}</b></td><td class="num"><a class="lnk" ${ckDrA("tar", x.conclIds, `concluídas por ${ckMN(x.id)}`)}>${x.concl}</a></td><td class="num${x.atr ? " st-crit" : ""}"><a class="lnk" ${ckDrA("tar", x.atrIds, `atrasadas de ${ckMN(x.id)}`)}>${x.atr}</a></td><td class="num"><a class="lnk" ${ckDrA("tar", x.blqIds, `bloqueadas de ${ckMN(x.id)}`)}>${x.blq}</a></td><td class="num">${ckPctT(x.pct)} ${ckDelta(x.pct == null ? null : x.pct * 100, x.pctPrev == null ? null : x.pctPrev * 100, { unit: " p.p.", punit: "%" }).replace(/<em>.*?<\/em>/, "")}</td><td>${spark(x.sem.map(s => s.pct == null ? null : s.pct * 100), ckCorPes(x.id), { min: 0, max: 100, w: 110, h: 26 })}</td></tr>`).join("")}</tbody></table></div><p class="muted small">A linha de 8 semanas é o % no prazo semana a semana (concluídas com prazo).</p>`;
}
function ckW_heat(A) {
  const H = A.heat; if (!H.rows.length || !H.cols.length) return ckVazioW("Sem dias úteis no período.", "", "");
  const c = v => v <= 0 ? "var(--cell)" : `color-mix(in srgb, var(--accent) ${Math.round(clamp(v / 1.1) * 85 + 10)}%, var(--cell))`;
  return `<div class="hscroll"><div class="ckheatm" style="grid-template-columns:minmax(90px,140px) repeat(${H.cols.length},minmax(${H.semanal ? 30 : 22}px,1fr))"><div></div>${H.cols.map(d => `<div class="hh${d === TODAY || (H.semanal && d === weekStart(TODAY)) ? " now" : ""}">${H.semanal ? fmtD(d) : `${DOWS[parse(d).getDay()][0]}<br>${+d.slice(8)}`}</div>`).join("")}
    ${H.rows.map(r => `<div class="ckhn">${esc(ckMN(r.id))}</div>${r.cells.map((x, j) => `<div class="ckhc2${x.v > ckLim("cargaCritica") ? " over" : ""}${H.cols[j] < TODAY ? " past" : ""}" style="background:${c(x.v)}" ${x.ids.length ? `data-ckdrill="${ckDr("tar", x.ids, `${ckMN(r.id)} · ${H.semanal ? "semana de " : ""}${fmtD(H.cols[j])}`)}"` : ""} ${tip(`${ckMN(r.id)} · ${H.semanal ? "semana de " : ""}${fmtDL(H.cols[j])}\n${num(x.h, 1)} h de ${num(x.cap, 1)} h (${pct(x.v)})${H.cols[j] < TODAY ? " · realizado" : " · planejado"}`)}></div>`).join("")}`).join("")}</div></div>
    <p class="muted small">Dias passados: horas das tarefas concluídas no dia. De hoje em diante: horas planejadas pelo caminho crítico. Borda vermelha: acima de ${pct(ckLim("cargaCritica"))} da capacidade.${H.semanal ? " Período longo: uma coluna por semana." : ""}</p>`;
}
function ckW_pessoas(A) {
  const ps = A.pessoas.filter(p => !ckM(p.id)?.eu); if (!ps.length) return ckVazioW("Ninguém na equipe além de você.", "contexto", "Contexto");
  return `<div class="ckpcards">${ps.map(p => { const m = ckM(p.id), tr = CK_TRILHAS[p.trilha], lim1 = ckLim("ciclo1a1");
    return `<article class="ckpcard" style="--c:${ckCorPes(p.id)}"><header><span class="ckav">${esc(ckIni(p.id))}</span><div><b>${esc(m.nome)}</b><small class="muted">${esc([m.papel, m.nivel].filter(Boolean).join(" · "))}</small></div><button type="button" class="btn sm ghost" ${ckDrA("pessoa", [], m.nome, { pessoa: p.id, view: "pessoa" })}>Abrir</button></header>
      ${p.comps.length ? ckRadar(p.comps, { cor: ckCorPes(p.id) }) : `<p class="muted small">Sem PDI. Defina a trilha na página da pessoa.</p>`}
      ${tr ? `<div class="flbl">Trilha: ${esc(tr.nome)} · ${ckPctT(p.pct)} do alvo</div><div class="ckmicro">${p.comps.map(c => `<div><span>${esc(c.nome)}</span>${ckBarra(c.nivel / 4, c.alvo / 4)}<b>${c.nivel}/${c.alvo}</b></div>`).join("")}</div>` : ""}
      ${p.evo.some(x => x.v != null) ? `<div class="flbl">Evolução (nível médio, 10 semanas)</div>${spark(p.evo.map(x => x.v), ckCorPes(p.id), { min: 0, max: 4, w: 220, h: 34 })}` : ""}
      <div class="ckpfoot"><a class="lnk${p.dias1a1 == null || p.dias1a1 > lim1 ? " st-warn" : ""}" ${ckDrA("meet", p.meetIds, `1:1 com ${m.nome}`)}>${p.dias1a1 == null ? "nenhum 1:1" : `último 1:1 há ${p.dias1a1} dias`}</a><span>${p.pend.length ? `<a class="lnk" ${ckDrA("meet", [...new Set(p.pend.map(a => a.meet))], `1:1 com compromissos pendentes de ${m.nome}`)}>${plural(p.pend.length, "compromisso pendente", "compromissos pendentes")}</a>` : "sem compromissos pendentes"}</span></div></article>`; }).join("")}</div>`;
}
function ckW_matriz(A) {
  const M = A.riscos.matriz, tot = sum(Object.values(M).map(x => x.length)); if (!tot) return ckVazioW("Nenhum risco aberto no fim do período.", "riscos", "Riscos");
  return `<div class="ckheat"><div class="ckhy">Probabilidade</div>${[5, 4, 3, 2, 1].map(p => `<div class="ckhl">${p}</div>${[1, 2, 3, 4, 5].map(i => { const xs = M[`${p}|${i}`] || []; return `<div class="ckhc ${ckBand(p * i)}${xs.length ? " has" : ""}" ${xs.length ? ckDrA("risk", xs, `riscos P${p} × I${i}`) : ""} ${tip(`P${p} × I${i} = ${p * i} · ${plural(xs.length, "risco", "riscos")}`)}>${xs.length || ""}</div>`; }).join("")}`).join("")}<div></div><div></div>${[1, 2, 3, 4, 5].map(i => `<div class="ckhl">${i}</div>`).join("")}<div class="ckhx">Impacto</div></div><p class="muted small">${plural(A.riscos.abertos, "risco aberto", "riscos abertos")} · ${A.riscos.novos} novo(s) no período</p>`;
}
function ckW_top5(A) {
  const T = A.riscos.top; if (!T.length) return ckVazioW("Nenhum risco aberto.", "riscos", "Riscos");
  return `<ol class="cktop">${T.map(r => `<li ${ckDrA("risk", [r.id], `${r.cod}`)}><span class="pill ${ckBand(r.score)}">${r.score}</span><b>${esc(r.cod)}</b><span>${esc(trunc(r.desc, 90))}</span>${r.semMitig ? `<span class="pill crit">sem plano de mitigação</span>` : `<small class="muted">${esc(ckMN(r.dono))}</small>`}</li>`).join("")}</ol>${A.riscos.semMitigIds.length ? `<p class="small"><a class="lnk st-crit" ${ckDrA("risk", A.riscos.semMitigIds, "riscos abertos sem plano de mitigação")}>${plural(A.riscos.semMitigIds.length, "risco aberto sem plano", "riscos abertos sem plano")}</a></p>` : ""}`;
}
function ckW_problemas(A) {
  const Pb = A.problemas, L = Pb.sem.map(s => ckSemLbl(s.w)), K = Pb.sem.map(s => ckDr("iss", [...s.aIds, ...s.rIds], `problemas abertos ou resolvidos na semana de ${fmtD(s.w)}`));
  if (!Pb.sem.some(s => s.abertos || s.resolvidos || s.estoque)) return ckVazioW("Nenhum problema registrado.", "problemas", "Problemas");
  return `<div class="ck2col"><div>${colChart(L, [{ name: "Abertos na semana", color: "var(--warn)", data: Pb.sem.map(s => s.abertos) }, { name: "Resolvidos na semana", color: "var(--good)", data: Pb.sem.map(s => s.resolvidos) }], { w: vw(6), h: 200, keys: K, click: "ckdrill", line: [{ name: "Em aberto no fim da semana", color: "var(--ink-2)", data: Pb.sem.map(s => s.estoque) }] })}<p class="muted small">Tempo médio de resolução no período: ${Pb.tRes == null ? "–" : `${num(Pb.tRes, 1)} dias úteis (${Pb.nRes})`}</p></div>
    <div><div class="flbl">Idade dos abertos</div>${Pb.idade.length ? `<ul class="ckidade">${Pb.idade.slice(0, 8).map(x => `<li ${ckDrA("iss", [x.id], x.cod)}><b>${esc(x.cod)}</b><span>${esc(trunc(x.titulo, 60))}</span><em class="${x.dias > 10 ? "st-crit" : x.dias > 5 ? "st-warn" : ""}">${x.dias} d</em>${x.semSol ? `<span class="pill warn">sem solução</span>` : ""}</li>`).join("")}</ul>${Pb.semSolIds.length ? `<a class="lnk" ${ckDrA("iss", Pb.semSolIds, "problemas abertos sem solução proposta")}>${plural(Pb.semSolIds.length, "aberto sem solução proposta", "abertos sem solução proposta")}</a>` : ""}` : `<p class="muted">Nenhum aberto.</p>`}</div></div>`;
}
function ckW_clash(A) {
  const C = A.bim.clash; if (!C.length) return ckVazioW("Sem verificações de clash até o fim do período.", "bim", "Tracker BIM");
  return `<div class="ckclash">${C.map(x => `<div ${ckDrA("bim", [x.id], `clash ${x.disc}`, { bimTipo: "clash" })}><b>${esc(x.disc)}</b><small class="muted">${esc(ckPN(x.projeto))}</small>${spark(x.serie.map(s => s.abertos), "var(--warn)", { min: 0, w: 140, h: 30 })}<span><b>${x.abertos}</b> abertos${x.delta != null ? ` <em class="${x.delta > 0 ? "st-crit" : x.delta < 0 ? "st-good" : "muted"}">${x.delta > 0 ? "▲" : x.delta < 0 ? "▼" : "="} ${Math.abs(x.delta)}</em>` : ""} · ${x.resolvidos} resolvidos</span></div>`).join("")}</div>`;
}
function ckW_modelos(A) {
  const B = A.bim, st = Object.entries(B.modelos); if (!B.nMod && !B.loin.n && !B.bep) return ckVazioW("Sem modelos, LOIN ou BEP registrados.", "bim", "Tracker BIM");
  const COR = { approvato: "var(--good)", federato: "var(--good)", pubblicato: "var(--good)", "in verifica": "var(--warn)", "in produzione": "var(--muted)" };
  return `${B.nMod ? hbars(st.map(([k, v]) => ({ l: k, v: v.length, color: COR[k] || "var(--muted)" })), { fmt: v => num(v, 0) }) : ""}
    <div class="ckmods">${st.map(([k, v]) => `<a class="lnk" ${ckDrA("bim", v, `modelos ${k}`, { bimTipo: "modelo" })}>${v.length} ${esc(k)}</a>`).join(" · ")}</div>
    <div class="krow">${kmini("var(--a-men)", "LOIN conforme", B.loin.n ? pct(B.loin.ok / B.loin.n) : "–", `${B.loin.ok} de ${B.loin.n}${B.loin.nokIds.length ? ` · <a class="lnk" ${ckDrA("bim", B.loin.nokIds, "verificações LOIN não conformes", { bimTipo: "loin" })}>${B.loin.nokIds.length} não conforme(s)</a>` : ""}`)}${kmini("var(--a-car)", "pGI / BEP", B.bep ? `v${esc(B.bep.versao || "?")}` : "–", B.bep ? `${esc(B.bep.stato || "")} · ${fmtD(B.bep.data)}` : "sem registro")}</div>`;
}
function ckW_funil(A) {
  const E = A.el, B = A.bim; if (!E.total && !B.ifc.prev) return ckVazioW("Sem elaborati nem consegne IFC.", "entregas", "Entregas");
  return `<div class="ck2col"><div><div class="flbl">Funil de elaborati (cada etapa inclui as seguintes)</div>${funnel(E.funil.map((x, i) => ({ l: x.s, v: x.n, color: ["var(--muted)", "var(--warn)", "var(--a-apr)", "var(--good)"][i] })))}<div class="ckmods">${E.funil.map(x => `<a class="lnk" ${ckDrA("el", x.ids, `elaborati em ${x.s} ou adiante`)}>${x.n} ${esc(x.s)}</a>`).join(" · ")}${E.aRevIds.length ? ` · <a class="lnk st-warn" ${ckDrA("el", E.aRevIds, "elaborati da revisionare")}>${E.aRevIds.length} da revisionare</a>` : ""}${E.atrIds.length ? ` · <a class="lnk st-crit" ${ckDrA("el", E.atrIds, "elaborati atrasados")}>${E.atrIds.length} atrasado(s)</a>` : ""}</div>
      <div class="flbl">Por revisão</div><div class="ckmods">${Object.entries(E.rev).sort().map(([r, v]) => `<a class="lnk" ${ckDrA("el", v, `elaborati na revisão ${r}`)}>rev ${esc(r)}: ${v.length}</a>`).join(" · ")}</div></div>
    <div><div class="krow">${kmini("var(--a-apr)", "Elaborati previstos no período", `${E.ent} / ${E.prev}`, `<a class="lnk" ${ckDrA("el", E.prevIds, "elaborati previstos no período")}>emitidos até o fim do período</a>`)}${kmini("var(--a-car)", "Consegne IFC no período", `${B.ifc.ent} / ${B.ifc.prev}`, B.ifc.pendIds.length ? `<a class="lnk st-warn" ${ckDrA("bim", B.ifc.pendIds, "consegne IFC pendentes", { bimTipo: "ifc" })}>${B.ifc.pendIds.length} pendente(s)</a>` : "entregues / previstas")}</div></div></div>`;
}
function ckW_decisoes(A) {
  const C = A.conh; if (!C.dec) return ckVazioW("Nenhuma decisão no período.", "decisoes", "Decisões");
  return hbars(Object.entries(C.porProj).map(([k, v]) => ({ l: ckPN(k), v: v.length, color: ckCor(k) })), { fmt: v => num(v, 0) }) + `<p class="small"><a class="lnk" ${ckDrA("dec", C.decIds, "decisões do período")}>${plural(C.dec, "decisão", "decisões")} no período</a></p>`;
}
function ckW_diario(A) {
  const C = A.conh, L = C.logSem.map(s => ckSemLbl(s.w)), K = C.logSem.map(s => ckDr("log", s.ids, `eventos da semana de ${fmtD(s.w)}`));
  if (!C.logSem.some(s => s.total)) return ckVazioW("Nada no diário de bordo nessas semanas.", "log", "Diário de bordo");
  const sinal = C.escopo > C.escopoPrev && C.escopo >= 2;
  return colChart(L, [{ name: "Escopo, demanda e cliente", color: "var(--warn)", data: C.logSem.map(s => s.escopo) }, { name: "Outros eventos", color: "var(--muted)", data: C.logSem.map(s => s.outros) }], { stacked: true, w: vw(8), h: 200, keys: K, click: "ckdrill" }) + `<p class="small ${sinal ? "st-warn" : "muted"}">${sinal ? ic("flag") : ""}<a class="lnk" ${ckDrA("log", C.escIds, "eventos de escopo, demanda e cliente no período")}>${plural(C.escopo, "evento", "eventos")} de escopo, demanda ou cliente no período</a> (anterior: ${C.escopoPrev})${sinal ? " — sinal de mudança de escopo" : ""}.</p>`;
}
function ckW_licoes(A) { const C = A.conh; return C.lic ? `<ul class="ckmini">${C.licT.map(l => `<li ${ckDrA("lic", [l.id], l.cod, { view: "licoes" })}><b>${esc(l.cod)}</b> ${esc(l.titulo)}</li>`).join("")}</ul>` : ckVazioW("Nenhuma lição registrada no período.", "licoes", "Lições"); }
function ckW_agenda(A) {
  const G = A.agenda, cor = { tecnica: "var(--a-car)", coordenacao: "var(--a-apr)", equipe: "var(--a-men)", admin: "var(--a-cas)" }, nome = Object.fromEntries(CK_AGENDA.map(([k, l]) => [k, l]));
  if (!G.tot) return ckVazioW("Sem horas suas no período (tarefas, reuniões ou 1:1).", "lista", "Lista");
  return `${ckStack(["tecnica", "coordenacao", "equipe", "admin"].map(k => ({ l: nome[k], v: G.h[k], color: cor[k], dr: G.ids[k].length ? ckDr("tar", G.ids[k], `minhas tarefas · ${nome[k]}`) : "" })))}
    ${G.alerta ? `<p class="ckalertbox crit">${ic("flag")}A execução técnica ocupa ${pct(G.share.tecnica)} do seu tempo e a coordenação só ${pct(G.share.coordenacao)} (limites: ${pct(ckLim("agendaTecnicaMax"))} e ${pct(ckLim("agendaCoordMin"))}). A execução está comprometendo a coordenação: delegue tarefas técnicas.</p>` : ""}
    <p class="muted small">Estimativa: esforço das suas tarefas concluídas e planejadas no período, por tag (sem tag conta como técnica); ${num(G.agendaH, 0)} h de reuniões da agenda contam como coordenação; cada 1:1 vale ${num(ckLim("horas1a1"), 2)} h de equipe e cada revisão ${pct(ckLim("revisaoFrac"))} do esforço da tarefa.</p>`;
}
function ckW_insights(A) {
  const I = ckD().dashIns, ai = !!SAMPLE && !AI_OFF && !blockedMentor("ck"), cv = mget("ck").conversa || [], mi = I ? cv.findIndex(x => x.insId === I.msgId) : -1, msg = mi >= 0 ? cv[mi] : null;
  const btn = `<button type="button" class="btn sm${I ? "" : " primary"}" data-act="ckdashins"${ai && !CK.insLoading ? "" : " disabled"}>${ic("spark")}${CK.insLoading ? "Analisando…" : I ? "Gerar de novo" : "Gerar insights do período"}</button><button type="button" class="btn sm ghost" data-act="ckdashrel">${ic("table")}Gerar relatório do período</button>`;
  if (!I) return `<p class="muted">O PMO lê os números deste período (e do anterior) e aponta de 3 a 5 tendências, com a fonte de cada uma e uma ação que você aprova com uma palavra. Não repete os alertas do Hoje.</p><div class="row wrap">${btn}</div>${ai ? "" : `<p class="muted small">A IA não está disponível nesta visualização.</p>`}`;
  return `<p class="muted small">${esc(I.label)} · gerado ${relDay(iso(new Date(I.at)))}${I.label !== A.P.label || JSON.stringify(I.F || {}) !== JSON.stringify(A.F) ? " · <b>outro período ou filtro</b>" : ""}</p><ol class="ckins">${I.itens.map((x, i) => `<li><b>${esc(x.titulo)}</b><p>${esc(x.texto)}</p>${(x.fontes || []).length ? `<small class="muted">Fontes: ${x.fontes.map(esc).join(" · ")}</small>` : ""}${msg?.acoes?.find(p => p.insN === i + 1) ? propHTML("ck", mi, msg.acoes.find(p => p.insN === i + 1)) : ""}</li>`).join("")}</ol><div class="row wrap">${btn}</div><p class="muted small">As ações também ficam no chat do PMO: “ok” aprova todas, “aprova 1 e 3” só essas.</p>`;
}
const CKW_FN = { kpis: ckW_kpis, burnup: ckW_burnup, status: ckW_status, fluxo: ckW_fluxo, esforco: ckW_esforco, marcos: ckW_marcos, carga: ckW_carga, comp: ckW_comp, heat: ckW_heat, pessoas: ckW_pessoas, matriz: ckW_matriz, top5: ckW_top5, problemas: ckW_problemas, clash: ckW_clash, modelos: ckW_modelos, funil: ckW_funil, decisoes: ckW_decisoes, diario: ckW_diario, licoes: ckW_licoes, agenda: ckW_agenda, insights: ckW_insights };
/* a versão em tabela de cada widget (a mesma fonte dos gráficos) */
function ckWTab(id, A) {
  const P = A.P, r1 = v => v == null ? null : Math.round(v * 10) / 10;
  if (id === "kpis") { const c = A.kpis.cur, p = A.kpis.prev, r = (l, a, b) => [l, a, b]; return { cols: [{ l: "Indicador" }, { l: P.label }, { l: "Anterior" }], rows: [r("Concluídas", c.concl, p.concl), r("Planejadas", c.plan, p.plan), r("% no prazo", ckPctT(c.pctPrazo), ckPctT(p.pctPrazo)), r("Atrasos", c.atrasos, p.atrasos), r("Menor folga (d.u.)", c.minF ?? "–", p.minF ?? "–"), r("Riscos altos", c.riscosAltos, p.riscosAltos), r("Problemas abertos", c.probAbertos, p.probAbertos), r("Resolução média (d.u.)", c.tRes == null ? "–" : num(c.tRes, 1), p.tRes == null ? "–" : num(p.tRes, 1)), r("Elaborati entregues/previstos", `${c.elEnt}/${c.elPrev}`, `${p.elEnt}/${p.elPrev}`), r("Clash abertos", c.clash, p.clash)] }; }
  if (id === "burnup") return { cols: [{ l: "Dia" }, { l: "Escopo", num: true }, { l: "Planejado", num: true }, { l: "Realizado", num: true }], rows: A.burnup.pts.map(x => [fmtDY(x.d), x.escopo, x.plan, x.real]) };
  if (id === "status") return { cols: [{ l: "Semana" }, ...["a fazer", "em andamento", "em revisão", "bloqueada"].map(l => ({ l, num: true })), { l: "concluídas na semana", num: true }], rows: A.status.map(s => [fmtDY(s.w), s["a fazer"], s["em andamento"], s["em revisão"], s.bloqueada, s.concluidas]) };
  if (id === "fluxo") return { cols: [{ l: "Semana" }, { l: "Throughput", num: true }, { l: "Lead time (d.u.)", num: true }, { l: "Cycle time (d.u.)", num: true }, { l: "n cycle", num: true }], rows: A.fluxo.map(x => [fmtDY(x.w), x.thr, r1(x.lead), r1(x.cycle), x.nCycle]) };
  if (id === "esforco") return { cols: [{ l: "Tipo" }, { l: "Nome" }, { l: "Concluído (h)", num: true }, { l: "Planejado (h)", num: true }], rows: [...Object.entries(A.esforco.proj).map(([k, v]) => ["projeto", ckPN(k), r1(v.feito), r1(v.plan)]), ...Object.entries(A.esforco.tag).map(([k, v]) => ["tag", k, r1(v.feito), r1(v.plan)])] };
  if (id === "marcos") return { cols: [{ l: "Marco" }, { l: "Projeto" }, { l: "Prazo" }, { l: "Previsto" }, { l: "Desvio (d.u.)", num: true }, { l: "Situação" }], rows: A.marcos.map(m => [m.nome, ckPN(m.projeto), fmtDY(m.data), m.prev ? fmtDY(m.prev) : "", m.desvio, m.st]) };
  if (id === "carga") return { cols: [{ l: "Pessoa" }, { l: "Planejado (h)", num: true }, { l: "Capacidade (h)", num: true }, { l: "Carga planejada", num: true }, { l: "Realizado (h)", num: true }, { l: "Utilização realizada", num: true }], rows: A.equipe.map(x => [ckMN(x.id), r1(x.carga.plan?.dem), r1(x.carga.plan?.cap), x.carga.plan ? pct(x.carga.plan.load) : "", r1(x.carga.real?.h), x.carga.real ? pct(x.carga.real.load) : ""]) };
  if (id === "comp") return { cols: [{ l: "Pessoa" }, { l: "Concluídas", num: true }, { l: "Atrasadas", num: true }, { l: "Bloqueadas", num: true }, { l: "% no prazo" }, { l: "% anterior" }], rows: A.equipe.map(x => [ckMN(x.id), x.concl, x.atr, x.blq, ckPctT(x.pct), ckPctT(x.pctPrev)]) };
  if (id === "heat") return { cols: [{ l: "Pessoa" }, ...A.heat.cols.map(c => ({ l: fmtD(c), num: true }))], rows: A.heat.rows.map(r => [ckMN(r.id), ...r.cells.map(x => Math.round(x.h * 10) / 10)]) };
  if (id === "matriz" || id === "top5") return { cols: [{ l: "Risco" }, { l: "Score", num: true }, { l: "Sem mitigação" }], rows: A.riscos.top.map(r => [`${r.cod} ${r.desc}`, r.score, r.semMitig ? "sim" : ""]) };
  if (id === "problemas") return { cols: [{ l: "Semana" }, { l: "Abertos", num: true }, { l: "Resolvidos", num: true }, { l: "Em aberto", num: true }], rows: A.problemas.sem.map(s => [fmtDY(s.w), s.abertos, s.resolvidos, s.estoque]) };
  if (id === "clash") return { cols: [{ l: "Disciplinas" }, { l: "Abertos", num: true }, { l: "Resolvidos", num: true }, { l: "Variação", num: true }], rows: A.bim.clash.map(x => [x.disc, x.abertos, x.resolvidos, x.delta]) };
  if (id === "funil") return { cols: [{ l: "Etapa" }, { l: "Elaborati", num: true }], rows: A.el.funil.map(x => [x.s, x.n]) };
  if (id === "diario") return { cols: [{ l: "Semana" }, { l: "Escopo/demanda/cliente", num: true }, { l: "Outros", num: true }], rows: A.conh.logSem.map(s => [fmtDY(s.w), s.escopo, s.outros]) };
  if (id === "agenda") return { cols: [{ l: "Categoria" }, { l: "Horas", num: true }, { l: "Fração" }], rows: Object.entries(A.agenda.h).map(([k, v]) => [k, Math.round(v * 10) / 10, ckPctT(A.agenda.share[k])]) };
  return null;
}

/* ---------------------------------------------------------------- a página */
function ckDashFiltros() {
  const d = ckDashS(), P = ckDashP(), tags = [...new Set([...CK_AGENTE.tags, ...ckT().flatMap(t => t.tags || [])])];
  return `<div class="ckdf"><div class="segs" role="group" aria-label="Período">${Object.entries(CK_PER).map(([k, l]) => `<button type="button" class="seg" data-ckdper="${k}" aria-pressed="${d.per === k}">${l}</button>`).join("")}</div>
    ${d.per === "custom" ? `<label class="lbl ckdi">de<input type="date" id="ckd_ini" value="${esc(d.ini || P.ini)}"></label><label class="lbl ckdi">até<input type="date" id="ckd_fim" value="${esc(d.fim || P.fim)}"></label>` : `<button type="button" class="btn sm ghost" data-ckdnav="-1" aria-label="Período anterior">‹</button><b class="ckdl">${esc(P.label)}</b><button type="button" class="btn sm ghost" data-ckdnav="1" aria-label="Próximo período">›</button>${(d.ref || TODAY) !== TODAY ? `<button type="button" class="btn sm ghost" data-ckdnav="0">Atual</button>` : ""}`}
    <select id="ckd_pes" aria-label="Pessoa"><option value="">Toda a equipe</option>${ckEquipe().map(m => `<option value="${m.id}"${d.pes === m.id ? " selected" : ""}>${esc(m.eu ? "Eu" : m.nome)}</option>`).join("")}</select>
    <select id="ckd_proj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${d.proj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select>
    <select id="ckd_tag" aria-label="Tag"><option value="">Todas as tags</option>${tags.map(t => `<option${d.tag === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>
    <span class="ckdact"><button type="button" class="btn sm${d.edit ? " primary" : " ghost"}" data-act="ckdedit" aria-pressed="${d.edit}">${ic("sliders")}Personalizar</button><button type="button" class="btn sm ghost" data-act="ckdmeet">${ic("expand")}Modo reunião</button></span></div>
    <p class="muted small ckdsub">${P.du} dias úteis · comparado com ${fmtDY(P.prev.ini)} a ${fmtDY(P.prev.fim)}${P.prev.parcial ? " (mesmo trecho)" : ""}${d.pes || d.proj || d.tag ? ` · filtros: ${[d.pes && ckMN(d.pes), d.proj && ckPN(d.proj), d.tag && "#" + d.tag].filter(Boolean).map(esc).join(", ")} <button type="button" class="lnk" data-act="ckdfx">limpar</button>` : ""}. A pessoa filtra o que tem responsável; a tag vale para tarefas e lições.${ckA("ckSnap").length ? ` Registro diário desde ${fmtD(ckA("ckSnap")[0].d)}.` : ""}</p>`;
}
function ckDashV() {
  CK_DR = {}; CK_DRN = 0;
  if (ckVazio()) return ckOnboard();
  const d = ckDashS(), A = ckDashAgg(), L = ckDashLayout(), vis0 = L.ordem.filter(id => !L.ocultos.includes(id) || d.edit);
  const sec = {}; for (const id of vis0) { const w = CKW.find(x => x[0] === id); (sec[w[1]] ||= []).push(w); }
  const secs = Object.keys(sec), cur = d.reuniao ? secs[clamp(d.sec || 0, 0, secs.length - 1)] : null;
  const card = ([id, s, t, span]) => { let body; try { body = CKW_FN[id](A); } catch (e) { console.error(e); body = `<div class="empty">Não deu para calcular este widget: ${esc(e.message)}</div>`; }
    const tab = ckWTab(id, A), hid = L.ocultos.includes(id), G = ckDashGroups(L.ordem), gi = G.findIndex(g => g.ids.includes(id)), k = G[gi].ids.indexOf(id), first = gi === 0 && k === 0, last = gi === G.length - 1 && k === G[gi].ids.length - 1;
    const act = d.edit ? `<span class="ckwed"><button type="button" class="vb" data-ckwmv="${id}|-1" aria-label="Subir ${esc(t)}" title="${k ? "Subir" : "Subir a seção"}"${first ? " disabled" : ""}>${ic("back")}</button><button type="button" class="vb" data-ckwmv="${id}|1" aria-label="Descer ${esc(t)}" title="${k < G[gi].ids.length - 1 ? "Descer" : "Descer a seção"}"${last ? " disabled" : ""}>${ic("arrow")}</button><button type="button" class="vb${hid ? " on" : ""}" data-ckwhide="${id}" aria-label="${hid ? "Mostrar" : "Ocultar"} ${esc(t)}" title="${hid ? "Mostrar" : "Ocultar"}">${ic(hid ? "eye" : "x")}</button></span>` : "";
    return vis(`ckw-${id}`, t, body, { cls: `s${span}${hid ? " ckhid" : ""} ckw`, table: tab ? () => tab : null, act }); };
  const corpo = d.reuniao ? `<div class="ckmeeth"><b>${esc(CKW_SEC[cur])}</b><span>${secs.indexOf(cur) + 1} de ${secs.length} · ${esc(A.P.label)}</span><span class="muted small">← → muda a seção · Esc sai</span><button type="button" class="btn sm" data-ckdsec="-1">${ic("back")}</button><button type="button" class="btn sm" data-ckdsec="1">${ic("arrow")}</button><button type="button" class="btn sm primary" data-act="ckdmeet">Sair</button></div><div class="vg">${sec[cur].map(card).join("")}</div>`
    : secs.map(s => `<h3 class="ckdsec">${esc(CKW_SEC[s])}</h3><div class="vg">${sec[s].map(card).join("")}</div>`).join("");
  return `${d.reuniao ? "" : ckDashFiltros()}${d.edit ? `<p class="note">${ic("info")}As setas mudam a ordem dentro da seção; na ponta da seção, levam a seção inteira. O × oculta. A ordem e o que fica oculto valem em todos os seus aparelhos.${L.ocultos.length ? ` <button type="button" class="lnk" data-act="ckdreset">Mostrar todos e voltar à ordem original</button>` : ""}</p>` : ""}${corpo}`;
}

/* ---------------------------------------------------------------- insights do PMO e relatório do período */
function ckAggResumo(A) {
  const k = A.kpis, r = x => x == null ? null : Math.round(x * 100) / 100;
  return { periodo: { label: A.P.label, ini: A.P.ini, fim: A.P.fim, dias_uteis: A.P.du, anterior: A.P.prev }, filtros: { pessoa: A.F.pes ? ckMN(A.F.pes) : "todas", projeto: A.F.proj ? ckPN(A.F.proj) : "todos", tag: A.F.tag || "todas" },
    kpis: { atual: { concluidas: k.cur.concl, planejadas: k.cur.plan, pct_no_prazo: r(k.cur.pctPrazo), atrasos: k.cur.atrasos, menor_folga: k.cur.minF, riscos_altos: k.cur.riscosAltos, problemas_abertos: k.cur.probAbertos, resolucao_media_du: r(k.cur.tRes), elaborati: `${k.cur.elEnt}/${k.cur.elPrev}`, clash: k.cur.clash }, anterior: { concluidas: k.prev.concl, pct_no_prazo: r(k.prev.pctPrazo), atrasos: k.prev.atrasos, riscos_altos: k.prev.riscosAltos, problemas_abertos: k.prev.probAbertos, clash: k.prev.clash } },
    pct_no_prazo_por_pessoa_semanal: Object.fromEntries(A.equipe.map(x => [ckMN(x.id), x.sem.map(s => ({ semana: s.w, concluidas_com_prazo: s.n, pct: r(s.pct) }))])),
    pessoas: A.equipe.map(x => ({ nome: ckMN(x.id), concluidas: x.concl, atrasadas: x.atr, bloqueadas: x.blq, pct: r(x.pct), pct_anterior: r(x.pctPrev), carga_planejada: x.carga.plan ? r(x.carga.plan.load) : null, utilizacao_realizada: x.carga.real ? r(x.carga.real.load) : null })),
    fluxo_semanal: A.fluxo.map(x => ({ semana: x.w, throughput: x.thr, lead_du: r(x.lead), cycle_du: r(x.cycle) })), marcos: A.marcos.map(m => ({ nome: m.nome, prazo: m.data, previsto: m.prev, desvio_du: m.desvio, situacao: m.st })),
    riscos_top: A.riscos.top.map(x => ({ cod: x.cod, score: x.score, sem_mitigacao: x.semMitig })), problemas: { abertos: A.problemas.abertos, sem_solucao: A.problemas.semSolIds.length, mais_antigo_dias: A.problemas.idade[0]?.dias ?? null },
    clash: A.bim.clash.map(x => ({ par: x.disc, abertos: x.abertos, variacao: x.delta })), elaborati: { previstos: A.el.prev, emitidos: A.el.ent, atrasados: A.el.atrIds.length },
    diario: { escopo_demanda_cliente: A.conh.escopo, anterior: A.conh.escopoPrev, decisoes: A.conh.dec, licoes: A.conh.lic }, minha_agenda: { horas: Object.fromEntries(Object.entries(A.agenda.h).map(([k, v]) => [k, Math.round(v)])), alerta: A.agenda.alerta },
    pdi: A.pessoas.map(p => ({ nome: ckMN(p.id), pct_do_alvo: r(p.pct), dias_desde_1a1: p.dias1a1, compromissos_pendentes: p.pend.length })) };
}
async function ckDashInsights() {
  if (!SAMPLE) { toast(AI_OFF || "A IA não está disponível nesta visualização."); return; }
  if (blockedMentor("ck")) { toast("Carreira está fora da IA em Privacidade."); return; }
  const A = ckDashAgg(), prev = ckD().dashIns; CK.insLoading = true; render();
  try {
    const r = await aiCall("Cockpit · insights do Dashboard", () => `${ckEspec()}\n\n${ckContexto()}\n\nTAREFA: INSIGHTS DO DASHBOARD
Gere de 3 a 5 insights ANALÍTICOS sobre o período abaixo: tendências e comparações (entre semanas, entre o período e o anterior, entre pessoas ou projetos), por exemplo “% no prazo de X caiu de 80% para 55% em 3 semanas”. Use só os números dos DADOS e cite-os. Não repita os ALERTAS DE HOJE (eles já aparecem na aba Hoje) nem os insights anteriores.
Para cada insight, no máximo uma ação concreta, aprovável com uma palavra, num destes tipos e com os mesmos campos das ferramentas: criar_tarefa {titulo, responsavel, prazo AAAA-MM-DD, esforco_h, projeto, prioridade, impacto, tags}, atualizar_tarefa {tarefa, responsavel, prazo, status, prioridade, motivo}, registrar_risco {descricao, probabilidade, impacto, gatilho, dono, mitigacao}, registrar_decisao {titulo, decisao, justificativa}, registrar_evento {texto, tipo}. Sem ação, use null.
Responda em JSON: {"insights":[{"titulo":"...","texto":"...","fontes":["widget ou códigos"],"acao":{"tipo":"...","dados":{...}} ou null}]}
DADOS DO PERÍODO: ${JSON.stringify(ckAggResumo(A))}
ALERTAS DE HOJE (não repetir): ${ckAlertas().map(a => a.txt).join(" | ") || "nenhum"}
INSIGHTS ANTERIORES (não repetir): ${(prev?.itens || []).map(x => x.titulo).join(" | ") || "nenhum"}`, { json: true, modelTier: "default" });
    const its = (Array.isArray(r?.insights) ? r.insights : []).slice(0, 5).map(x => ({ titulo: String(x.titulo || "").slice(0, 160), texto: String(x.texto || "").slice(0, 700), fontes: (x.fontes || []).map(String).slice(0, 6), acao: x.acao && CK_PT[x.acao.tipo] ? x.acao : null })).filter(x => x.titulo && x.texto);
    if (!its.length) { CK.insLoading = false; toast("O PMO não devolveu insights. Tente de novo."); render(); return; }
    const acoes = []; its.forEach((x, i) => { if (!x.acao) return; const v = ckValida(x.acao.tipo, x.acao.dados); acoes.push({ id: uid(), ck: true, tipo: x.acao.tipo, raw: x.acao.dados || {}, status: v.erro ? "descartada" : "pendente", erro: v.erro || "", n: acoes.length + 1, insN: i + 1 }); });
    const msgId = "ins_" + uid(), m = mstate("ck");
    m.conversa.push({ role: "user", content: `Insights do Dashboard: ${A.P.label}`, at: Date.now(), mode: "chat" }, { role: "assistant", content: `**Insights do Dashboard · ${A.P.label}**\n\n${its.map((x, i) => `${i + 1}. **${x.titulo}**: ${x.texto}${x.fontes.length ? ` _(fontes: ${x.fontes.join(", ")})_` : ""}`).join("\n")}`, at: Date.now(), uso: [], acoes, insId: msgId });
    if (m.conversa.length > 40) m.conversa = m.conversa.slice(-40);
    ckD().dashIns = { at: Date.now(), label: A.P.label, ini: A.P.ini, fim: A.P.fim, F: A.F, msgId, itens: its.map(({ acao, ...x }) => x) };
    CK.insLoading = false; touch("mentores", "ck", { noUndo: true });
  } catch (e) { CK.insLoading = false; if (e?.code !== "cancelled") aiError(e); else render(); }
}
function ckDashRelatorio() { const P = ckDashP(), F = ckDashF(); CK.relPer = { ini: P.ini, fim: P.fim, label: P.label, F, tipo: P.tipo }; CK.relPerKey = ""; CK.rel = "periodo"; setHash("trabalho", "relatorios"); }

/* ---------------------------------------------------------------- ações */
function ckDashClick(t) {
  const ds = t.dataset, a = ds.act, d = ckDashS();
  if (ds.ckdrill) { ckDrillGo(ds.ckdrill); return true; }
  if (ds.ckdper) { const P0 = ckDashP(); d.per = ds.ckdper; if (d.per === "custom") { d.ini = P0.ini; d.fim = P0.fim; } ckDashSave(); render(); return true; }
  if (ds.ckdnav != null) { if (ds.ckdnav === "0") d.ref = TODAY; else { const n = +ds.ckdnav, r = d.ref || TODAY; d.ref = d.per === "semana" ? addDays(r, 7 * n) : d.per === "trimestre" ? addMonth(r.slice(0, 7), 3 * n) + "-01" : d.per === "ano" ? `${+r.slice(0, 4) + n}-01-01` : addMonth(r.slice(0, 7), n) + "-01"; } ckDashSave(); render(); return true; }
  if (ds.ckdsec) { ckDashSec(+ds.ckdsec); return true; }
  if (ds.ckwmv) { const [id, dir] = ds.ckwmv.split("|"), L = ckDashLayout(); L.ordem = ckDashMove(L.ordem, id, +dir); ckD().cfg.dash = { ...L }; touch("ck", { label: "Ordem do Dashboard" }); return true; }
  if (ds.ckwhide) { const L = ckDashLayout(), id = ds.ckwhide; L.ocultos = L.ocultos.includes(id) ? L.ocultos.filter(x => x !== id) : [...L.ocultos, id]; ckD().cfg.dash = { ...L }; touch("ck", { label: L.ocultos.includes(id) ? "Widget oculto" : "Widget visível" }); return true; }
  if (!a?.startsWith("ckd") && a !== "ckdrillx") return false;
  if (a === "ckdrillx") { CK.drill = null; CK.drillSet = null; render(); return true; }
  if (a === "ckdfx") { d.pes = d.proj = d.tag = ""; ckDashSave(); render(); return true; }
  if (a === "ckdedit") { d.edit = !d.edit; render(); return true; }
  if (a === "ckdreset") { ckD().cfg.dash = { ordem: [], ocultos: [] }; touch("ck", { label: "Layout do Dashboard" }); return true; }
  if (a === "ckdmeet") { ckDashMeet(!d.reuniao); return true; }
  if (a === "ckdashins") { ckDashInsights(); return true; }
  if (a === "ckdashrel") { ckDashRelatorio(); return true; }
  return false;
}
/* as seções visíveis (as que têm algum widget não oculto), na ordem do layout */
function ckDashSecs() { const L = ckDashLayout(), out = []; for (const id of L.ordem) { if (L.ocultos.includes(id)) continue; const s = CKW.find(w => w[0] === id)[1]; if (!out.includes(s)) out.push(s); } return out; }
function ckDashSec(dir) { const d = ckDashS(), n = ckDashSecs().length; d.sec = clamp((d.sec || 0) + dir, 0, Math.max(0, n - 1)); render(); window.scrollTo({ top: 0 }); }
function ckDashMeet(on) {
  const d = ckDashS(); d.reuniao = on; d.sec = 0; d.edit = false;
  if (on) { try { document.documentElement.requestFullscreen?.()?.catch?.(() => {}); } catch {} } else if (document.fullscreenElement) { try { document.exitFullscreen(); } catch {} }
  render(); window.scrollTo({ top: 0 });
}
function ckDashChange(t) {
  const d = ckDashS();
  if (t.id === "ckd_pes" || t.id === "ckd_proj" || t.id === "ckd_tag") { d[t.id.slice(4)] = t.value; ckDashSave(); render(); return true; }
  if (t.id === "ckd_ini" || t.id === "ckd_fim") { if (!t.value) return true; d[t.id.slice(4)] = t.value; if (d.fim < d.ini) { if (t.id === "ckd_ini") d.fim = d.ini; else d.ini = d.fim; } ckDashSave(); render(); return true; }
  return false;
}
document.addEventListener("keydown", e => {
  if (PAGE !== "trabalho" || SUB !== "dashboard" || !CK.dash?.reuniao || e.target.matches?.("input,textarea,select")) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); ckDashSec(e.key === "ArrowRight" ? 1 : -1); }
  if (e.key === "Escape") { e.preventDefault(); ckDashMeet(false); }
});
