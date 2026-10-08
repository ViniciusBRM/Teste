/* ================================================================ Cockpit de Trabalho: dados e motor
   Gestão do trabalho de engenharia (tarefas, projetos, riscos, problemas, diário de bordo, decisões, equipe, BIM, elaborati)
   com um agente PMO que lê tudo e só PROPÕE alterações: nada é gravado sem a aprovação da pessoa (um clique ou "ok").
   Dados (cada lista é uma chave própria, para crescer sem estourar o limite de um documento):
   ck = { perfil: {nome, profissao, cidade, area, funcoes, extra}, membros: [{id, nome, papel, nivel, foco, horas, tags, eu, ativo}],
          projetos: [{id, nome, cliente, fase, cor, ativo}], marcos: [{id, projeto, nome, tipo, data, feito}],
          pdi: {membroId: {trilha, comps: [{id, nome, desc, tags, nivel, alvo, hist: [{data, nivel}]}], metas: [{id, txt, prazo, feito}]}},
          seq: {T, R, P, ...}, cfg: {foco, patrono, jornada}, brief: {data, txt} }
   ckTar  = [{id, cod, titulo, projeto, resp, prazo, inicio, esforco, feito, status, prio, impacto, deps, tags, marco, notas, criada, concluida, origem, hist}]
   ckRisk = [{id, cod, desc, projeto, prob, imp, gatilho, dono, mitig, status, criado, tarefas, origem}]
   ckIss  = [{id, cod, titulo, desc, projeto, sev, status, resp, prazo, criado, solucoes: [{id, titulo, desc, pros, contras, esforco, impacto, resp, prazo, fonte}], escolhida, tarefas, resolvido}]
   ckLog  = [{id, cod, data, at, tipo, texto, projeto, ligados: [cod]}]
   ckDec  = [{id, cod, data, titulo, contexto, decisao, justificativa, alternativas, norma, projeto, quem, status}]
   ckMeet = [{id, cod, tipo: 1a1|reuniao, membro, data, titulo, projeto, participantes, pauta, notas, feedback: [{tipo, txt}], acoes: [{id, txt, resp, prazo, tarefa}]}]
   ckBim  = [{id, cod, tipo: modelo|clash|ifc|bep|loin, projeto, ...}]   ckEl = [{id, cod, projeto, codigo, titulo, disciplina, fase, rev, prevista, emissao, stato, resp, revisoes}]
   ckLic  = [{id, cod, titulo, contexto, licao, aplicar, tags, projeto, data}]   ckRel = [{id, tipo, titulo, periodo, at, txt, ai}] */
const CK_LS = (k, v) => { try { if (v === undefined) return localStorage.getItem("atlas_ck_" + k); localStorage.setItem("atlas_ck_" + k, v); } catch { return null; } };
const CK = { chat: CK_LS("chat") != null ? CK_LS("chat") !== "0" : innerWidth > 1180, f: { proj: "", resp: "", tag: "", q: "", st: "" }, mes: null, sort: "score", eis: false, drag: null, deleg: "", gproj: "", quick: null, form: null, lf: "", lproj: "", risco: null, prob: null, sol: null, xtr: null, pessoa: null, meet: null, rel: null, com: { tipo: "email_cliente", txt: "", proj: "" }, live: null, bimTipo: "modelo" };
const CK_STATUS = ["a fazer", "em andamento", "bloqueada", "em revisão", "concluída"];
const CK_PRIO = ["alta", "média", "baixa"], CK_IMP = ["alto", "médio", "baixo"];
const CK_KEYS = { T: "ckTar", R: "ckRisk", P: "ckIss", E: "ckLog", D: "ckDec", M: "ckMeet", B: "ckBim", EL: "ckEl", L: "ckLic" };
const ckD = () => { const c = (S.ck ||= {}); c.perfil ||= {}; c.membros ||= []; c.projetos ||= []; c.marcos ||= []; c.pdi ||= {}; c.seq ||= {}; c.cfg ||= {};
  if (!c.membros.some(m => m.eu)) c.membros.unshift({ id: "eu", eu: true, nome: "Eu", papel: "", nivel: "Coordenador", foco: "", horas: 20, tags: [], ativo: true }); return c; };
const ckA = k => (S[k] ||= []);
const ckT = () => ckA("ckTar");
const ckOpen = t => t.status !== "concluída";
const ckM = id => ckD().membros.find(m => m.id === id);
const ckMN = id => { const m = ckM(id); return !m ? (id ? "?" : "sem responsável") : m.eu ? "Eu" : m.nome; };
const ckMNa = id => { const m = ckM(id); return !m ? "sem responsável" : m.eu ? `${ckD().perfil.nome?.split(" ")[0] || "o usuário"} (o próprio usuário)` : m.nome; };
const ckP = id => ckD().projetos.find(p => p.id === id);
const ckPN = id => ckP(id)?.nome || (id ? "?" : "sem projeto");
const ckEquipe = () => ckD().membros.filter(m => m.ativo !== false);
const ckMult = m => (CK_AGENTE.niveis.find(([n]) => norm(n) === norm(m?.nivel)) || [0, 1])[1];
const ckHpd = m => (+m?.horas || +ckD().cfg.foco * 5 || 30) / 5;
/* códigos legíveis (T12, R3…): o maior entre o contador e o que já existe, para nunca repetir */
function ckCod(pre) { const c = ckD(), k = CK_KEYS[pre], mx = Math.max(0, ...ckA(k).map(x => +String(x.cod || "").slice(pre.length) || 0)); c.seq[pre] = Math.max(c.seq[pre] || 0, mx) + 1; return pre + c.seq[pre]; }
const ckFind = (k, ref) => { const r = norm(String(ref ?? "").replace(/^#/, "")); return r ? ckA(k).find(x => x.id === ref || norm(x.cod) === r) : null; };
const ckTarRef = ref => ckFind("ckTar", ref);

/* ---------------------------------------------------------------- calendário de dias úteis (Itália, com o padroeiro local) */
function ckEaster(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return `${y}-${pad(mo)}-${pad(da)}`; }
const CK_FEST = [["01-01", "Capodanno"], ["01-06", "Epifania"], ["04-25", "Festa della Liberazione"], ["05-01", "Festa del Lavoro"], ["06-02", "Festa della Repubblica"], ["08-15", "Ferragosto"], ["11-01", "Ognissanti"], ["12-08", "Immacolata"], ["12-25", "Natale"], ["12-26", "Santo Stefano"]];
function ckFeriados(y) { return memo("ckfer" + y, () => { const pt = ckD().cfg.patrono ?? "06-24", m = new Map(CK_FEST.map(([md, n]) => [`${y}-${md}`, n])); m.set(addDays(ckEaster(y), 1), "Lunedì dell'Angelo"); if (pt) m.set(`${y}-${pt}`, m.get(`${y}-${pt}`) || "Patrono"); for (const f of ckD().cfg.ferias || []) if (f.startsWith(String(y))) m.set(f, "Férias / folga"); return m; }); }
const ckFer = d => ckFeriados(+d.slice(0, 4)).get(d) || "";
const ckUtil = d => { const w = parse(d).getDay(); return w > 0 && w < 6 && !ckFer(d); };
const ckNextU = d => { let x = d; for (let i = 0; i < 30 && !ckUtil(x); i++) x = addDays(x, 1); return x; };
const ckPrevU = d => { let x = d; for (let i = 0; i < 30 && !ckUtil(x); i++) x = addDays(x, -1); return x; };
function ckAddU(d, n) { let x = n >= 0 ? ckNextU(d) : ckPrevU(d), k = Math.abs(n); const s = n >= 0 ? 1 : -1; while (k > 0) { x = addDays(x, s); if (ckUtil(x)) k--; } return x; }
/* dias úteis de a até b: positivo se b vem depois; 0 no mesmo dia */
function ckDiffU(a, b) { if (!a || !b) return null; if (a === b) return 0; const s = b > a ? 1 : -1; let x = a, n = 0; for (let i = 0; i < 1500 && x !== b; i++) { x = addDays(x, s); if (ckUtil(x)) n += s; } return n; }
const ckToday = () => ckNextU(TODAY);

/* ---------------------------------------------------------------- caminho crítico (CPM em dias úteis)
   Duração = horas restantes ÷ horas por dia do responsável (h/semana ÷ 5). Ida: início mais cedo (ES) = depois da última
   dependência aberta, nunca antes de hoje. Volta: término mais tarde (LF) = o prazo da tarefa ou o início mais tarde das
   sucessoras (o que vier antes); sem nenhum dos dois, o fim previsto do projeto. Folga = dias úteis entre ES e LS. */
const ckRem = t => Math.max(.5, (+t.esforco || 4) * (1 - clamp((+t.feito || 0) / 100)));
const ckDur = t => Math.max(1, Math.ceil(ckRem(t) / ckHpd(ckM(t.resp))));
function ckCPM() {
  return memo("ckcpm", () => {
    const open = ckT().filter(ckOpen), by = new Map(open.map(t => [t.id, t])), today = ckToday(), R = {};
    const preds = id => [...new Set(by.get(id).deps || [])].filter(d => by.has(d) && d !== id);
    const succ = new Map(open.map(t => [t.id, []])); open.forEach(t => preds(t.id).forEach(p => succ.get(p).push(t.id)));
    const indeg = new Map(open.map(t => [t.id, preds(t.id).length])), q = open.filter(t => !indeg.get(t.id)).map(t => t.id), order = [];
    while (q.length) { const id = q.shift(); order.push(id); for (const s of succ.get(id)) { indeg.set(s, indeg.get(s) - 1); if (!indeg.get(s)) q.push(s); } }
    const ciclo = open.filter(t => !order.includes(t.id)).map(t => t.id); order.push(...ciclo);
    for (const id of order) { const t = by.get(id), dur = ckDur(t), base = t.status === "em andamento" || !t.inicio || t.inicio <= today ? today : ckNextU(t.inicio); let es = base, drv = null;
      for (const p of preds(id)) if (R[p]) { const n = ckAddU(R[p].ef, 1); if (n > es) { es = n; drv = p; } }
      R[id] = { es, ef: ckAddU(es, dur - 1), dur, drv, base, efBase: ckAddU(base, dur - 1) }; }
    const fim = {}; for (const t of open) { const k = t.projeto || "_"; if (!fim[k] || R[t.id].ef > fim[k]) fim[k] = R[t.id].ef; }
    for (const id of [...order].reverse()) { const t = by.get(id), r = R[id]; let lf = t.prazo ? ckPrevU(t.prazo) : null;
      for (const s of succ.get(id)) if (R[s]?.ls) { const v = ckAddU(R[s].ls, -1); if (!lf || v < lf) lf = v; }
      if (!lf) lf = fim[t.projeto || "_"] > r.ef ? fim[t.projeto || "_"] : r.ef;
      r.lf = lf; r.ls = ckAddU(lf, -(r.dur - 1)); r.folga = ckDiffU(r.es, r.ls); r.atraso = !!t.prazo && r.ef > t.prazo; r.crit = r.folga <= 0; r.succ = succ.get(id); }
    /* atraso em cascata: a tarefa atrasa só porque uma predecessora a empurrou */
    const cascata = []; for (const t of open) { const r = R[t.id]; if (!r.atraso || !r.drv || !t.prazo || r.efBase > t.prazo) continue; let o = r.drv, guard = 0; while (R[o]?.drv && R[R[o].drv] && guard++ < 40) { if (R[o].atraso && (!R[o].drv || R[o].efBase > (by.get(o).prazo || "9999"))) break; o = R[o].drv; } cascata.push({ id: t.id, origem: o }); }
    /* caminho que define o fim de cada projeto: da tarefa que termina por último, seguindo a predecessora que a empurra */
    const caminho = {}; for (const k of Object.keys(fim)) { const last = open.filter(t => (t.projeto || "_") === k).sort((a, b) => R[b.id].ef.localeCompare(R[a.id].ef) || R[a.id].folga - R[b.id].folga)[0]; const ch = []; let x = last?.id, g = 0; while (x && g++ < 60) { ch.unshift(x); x = R[x].drv; } caminho[k] = ch; }
    return { R, ciclo, cascata, caminho, fim };
  });
}
const ckC = id => ckCPM().R[id] || null;

/* ---------------------------------------------------------------- prioridade: Eisenhower + prazo + caminho crítico */
function ckPrio(t) {
  return memo("ckprio" + t.id, () => {
    const C = ckC(t.id), r = [], dias = t.prazo ? ckDiffU(TODAY, t.prazo) : null, mk = t.marco ? ckD().marcos.find(m => m.id === t.marco) : null, nSucc = C?.succ?.length || 0;
    let s = 0;
    if (!ckOpen(t)) return { s: -1, q: 0, r: [], urg: false, imp: false };
    if (dias != null && dias < 0) { s += 45; r.push(`vencida há ${plural(-dias, "dia útil", "dias úteis")}`); }
    else if (dias != null && dias <= 2) { s += 25; r.push(dias === 0 ? "vence hoje" : `vence em ${plural(dias, "dia útil", "dias úteis")}`); }
    else if (dias != null && dias <= 5) { s += 10; r.push(`vence em ${dias} dias úteis`); }
    if (C?.crit) { s += 20; r.push(C.folga < 0 ? `caminho crítico com folga negativa (${C.folga})` : "no caminho crítico (folga 0)"); }
    else if (C && C.folga <= 2) { s += 8; r.push(`folga de ${plural(C.folga, "dia útil", "dias úteis")}`); }
    if (C?.atraso) { s += 15; r.push(`término previsto ${fmtD(C.ef)}, depois do prazo`); }
    if (nSucc) { s += 6 * nSucc; r.push(`libera ${plural(nSucc, "tarefa", "tarefas")}`); }
    if (t.prio === "alta") s += 15; else if (t.prio === "média") s += 6;
    if (t.impacto === "alto") { s += 12; r.push("impacto alto"); } else if (t.impacto === "médio") s += 5;
    if ((t.tags || []).includes("Cliente")) { s += 6; r.push("cliente"); }
    const mkd = mk && !mk.feito ? ckDiffU(TODAY, mk.data) : null; if (mkd != null && mkd <= 10) { s += 8; r.push(`marco “${mk.nome}” em ${mkd} dias úteis`); }
    if (t.status === "bloqueada") r.push("bloqueada");
    const urg = (dias != null && dias <= 3) || (C && C.folga <= 1), imp = t.prio === "alta" || t.impacto === "alto" || !!C?.crit || nSucc >= 2 || (t.tags || []).includes("Cliente") || (mkd != null && mkd <= 10);
    return { s, q: urg && imp ? 1 : imp ? 2 : urg ? 3 : 4, r, urg, imp, dias };
  });
}
const CK_Q = { 1: ["Fazer já", "crit"], 2: ["Agendar", "good"], 3: ["Delegar", "warn"], 4: ["Adiar ou eliminar", "none"] };
/* ordem sugerida: primeiro o quadrante (fazer já, agendar, delegar, adiar), dentro dele o score */
const ckSorted = list => [...list].sort((a, b) => (ckPrio(a).q || 9) - (ckPrio(b).q || 9) || ckPrio(b).s - ckPrio(a).s || (a.prazo || "9").localeCompare(b.prazo || "9"));

/* ---------------------------------------------------------------- carga da equipe (próximos N dias úteis) */
function ckAgendaH(d0, d1) {
  const [j0, j1] = (ckD().cfg.jornada || "08:30-17:30").split("-").map(hm2min); let h = 0;
  for (const e of S.eventos || []) { if (e.data < d0 || e.data > d1 || !ckUtil(e.data)) continue; const a = hm2min(e.hora), z = hm2min(e.fim) ?? (a != null ? a + 60 : null); if (a == null) continue; h += Math.max(0, Math.min(z, j1) - Math.max(a, j0)) / 60; }
  return h;
}
function ckCarga(mid, n = 10, extra = 0) {
  return memo(`ckcarga${mid}|${n}|${extra}`, () => {
    const m = ckM(mid), d0 = ckToday(), d1 = ckAddU(d0, n - 1), C = ckCPM().R; let dem = 0; const ts = [];
    for (const t of ckT()) { if (!ckOpen(t) || t.resp !== mid || !C[t.id]) continue; const r = C[t.id]; if (r.es > d1) continue; const a = r.es < d0 ? d0 : r.es, z = r.ef > d1 ? d1 : r.ef, k = Math.max(1, ckDiffU(a, z) + 1); const h = ckRem(t) * k / r.dur; dem += h; ts.push(t.id); }
    const ag = m?.eu ? ckAgendaH(d0, d1) : 0, cap = Math.max(1, ckHpd(m) * n - ag), load = (dem + extra) / cap;
    const st = load > 1.1 ? "crit" : load > .9 ? "warn" : !m?.eu && load < .35 ? "idle" : "good";
    return { dem, cap, ag, load, st, ts, d1 };
  });
}
const CK_CST = { crit: "sobrecarga", warn: "no limite", idle: "com folga", good: "equilibrada" };

/* ---------------------------------------------------------------- delegação: nível, carga, prazo e objetivo de aprendizado */
function ckPdi(mid) { const p = (ckD().pdi[mid] ||= { trilha: "", comps: [], metas: [] }); p.comps ||= []; p.metas ||= []; return p; }
function ckDeleg(spec) {
  const tags = spec.tags || [], esf = +spec.esforco || 8, complexa = tags.some(x => ["Coordenação", "Cliente"].includes(x)) || esf >= 24 || (spec.prio === "alta" && spec.folga != null && spec.folga <= 2);
  return ckEquipe().filter(m => !(spec.excl || []).includes(m.id)).map(m => {
    const mult = ckMult(m), h = esf * mult, cg = ckCarga(m.id, 10, h), pdi = ckPdi(m.id), r = [];
    const forte = tags.filter(x => (m.tags || []).includes(x) || pdi.comps.some(c => (c.tags || []).includes(x) && c.nivel >= 3));
    const aprende = pdi.comps.filter(c => (c.tags || []).some(x => tags.includes(x)) && c.nivel < (c.alvo ?? 3));
    const junior = mult >= 1.5;
    let cabe = true; if (spec.prazo) { const ate = ckDiffU(ckToday(), spec.prazo) + 1, livre = ckHpd(m) * Math.max(0, ate) - ckCarga(m.id, Math.max(1, ate)).dem; cabe = livre >= h; r.push(cabe ? `cabe até ${fmtD(spec.prazo)} (≈${num(h, 0)} h)` : `não cabe até ${fmtD(spec.prazo)}: precisaria de ≈${num(h, 0)} h`); }
    let s = 0;
    if (forte.length) { s += 35; r.push(`domina ${forte.join(", ")}`); }
    if (aprende.length) { s += 25; r.push(`aprendizado do PDI: ${aprende.map(c => c.nome).slice(0, 2).join(", ")}`); }
    s += 25 * (1 - Math.min(1.2, cg.load)); r.push(`carga em 10 dias úteis: ${pct(cg.load)}`);
    if (!cabe) s -= 30;
    if (junior && complexa) { s -= 25; r.push("tarefa complexa para o nível: precisa de revisão"); }
    if (m.eu) { s -= 12; r.push("você coordena: delegue se outra pessoa couber"); }
    if (mult > 1) r.push(`fator de tempo ${num(mult, 1)}× (${m.nivel})`);
    const revisor = junior ? ckEquipe().filter(x => x.id !== m.id && ckMult(x) <= 1.0).sort((a, b) => ckCarga(a.id).load - ckCarga(b.id).load)[0] : null;
    const tradeoff = junior && aprende.length ? `aprendizado × tempo: +${num(h - esf, 0)} h e revisão de ${revisor ? ckMN(revisor.id) : "alguém sênior"} (≈${num(Math.max(1, esf * .15), 0)} h)` : junior ? `mais tempo (+${num(h - esf, 0)} h) sem ganho de PDI declarado` : forte.length ? "rápido e seguro, sem ganho de aprendizado" : "";
    return { id: m.id, nome: ckMN(m.id), s: Math.round(s), r, h, cabe, carga: cg.load, revisor: revisor?.id || "", tradeoff, aprende: aprende.map(c => c.nome) };
  }).sort((a, b) => b.s - a.s);
}

/* ---------------------------------------------------------------- alertas proativos (sem IA) */
const ckRiscoScore = r => (+r.prob || 0) * (+r.imp || 0);
function ckAlertas() {
  return memo("ckalert", () => {
    const out = [], C = ckCPM(), add = (st, k, txt, cite = [], go = "") => out.push({ st, k, txt, cite, go }), T = ckT(), by = id => T.find(t => t.id === id);
    const venc = T.filter(t => ckOpen(t) && t.prazo && t.prazo < TODAY); if (venc.length) add("crit", "vencidas", `${plural(venc.length, "tarefa vencida", "tarefas vencidas")}: ${venc.slice(0, 4).map(t => `${t.cod} ${trunc(t.titulo, 40)} (${ckMN(t.resp)}, ${fmtD(t.prazo)})`).join("; ")}`, venc.map(t => t.cod), "trabalho.lista");
    const prev = T.filter(t => ckOpen(t) && C.R[t.id]?.atraso && t.prazo >= TODAY); if (prev.length) add("warn", "previsao", `${plural(prev.length, "tarefa termina", "tarefas terminam")} depois do prazo pelo caminho crítico: ${prev.slice(0, 4).map(t => `${t.cod} (previsto ${fmtD(C.R[t.id].ef)}, prazo ${fmtD(t.prazo)})`).join("; ")}`, prev.map(t => t.cod), "trabalho.gantt");
    const cas = {}; for (const c of C.cascata) (cas[c.origem] ||= []).push(c.id); for (const [o, ids] of Object.entries(cas)) { const ot = by(o); if (ot) add("crit", "cascata", `Atraso em cascata a partir de ${ot.cod} “${trunc(ot.titulo, 40)}”: empurra ${ids.map(i => by(i)?.cod).join(", ")} para depois do prazo`, [ot.cod, ...ids.map(i => by(i)?.cod)], "trabalho.gantt"); }
    for (const mk of ckD().marcos.filter(m => !m.feito && m.data >= TODAY)) { const ts = T.filter(t => ckOpen(t) && t.marco === mk.id), late = ts.filter(t => C.R[t.id]?.ef > mk.data); if (late.length) add("crit", "marco", `Marco “${mk.nome}” (${fmtD(mk.data)}, ${ckPN(mk.projeto)}) em risco: ${late.map(t => `${t.cod} termina ${fmtD(C.R[t.id].ef)}`).join("; ")}`, late.map(t => t.cod), "trabalho.gantt"); }
    if (C.ciclo.length) add("crit", "ciclo", `Dependência circular entre ${C.ciclo.map(id => by(id)?.cod).join(", ")}: corrija as dependências`, C.ciclo.map(id => by(id)?.cod), "trabalho.lista");
    for (const m of ckEquipe()) { const cg = ckCarga(m.id); if (cg.st === "crit") add("crit", "carga", `${m.eu ? "Você está" : m.nome + " está"} com ${pct(cg.load)} da capacidade nos próximos 10 dias úteis (${num(cg.dem, 0)} h para ${num(cg.cap, 0)} h${cg.ag ? `, já descontadas ${num(cg.ag, 0)} h de agenda` : ""})`, [], "trabalho.equipe"); else if (cg.st === "idle") add("info", "ociosa", `${m.nome} está com ${pct(cg.load)} da capacidade nos próximos 10 dias úteis: dá para delegar`, [], "trabalho.equipe"); }
    const blq = T.filter(t => t.status === "bloqueada"); if (blq.length) add("warn", "bloqueada", `${plural(blq.length, "tarefa bloqueada", "tarefas bloqueadas")}: ${blq.slice(0, 4).map(t => `${t.cod} ${trunc(t.titulo, 36)}`).join("; ")}`, blq.map(t => t.cod), "trabalho.kanban");
    const sem = T.filter(t => ckOpen(t) && (!t.resp || !t.prazo)); if (sem.length) add("info", "incompleta", `${plural(sem.length, "tarefa", "tarefas")} sem responsável ou prazo: ${sem.slice(0, 5).map(t => t.cod).join(", ")}`, sem.map(t => t.cod), "trabalho.lista");
    for (const r of ckA("ckRisk").filter(r => ["aberto", "monitorando"].includes(r.status) && ckRiscoScore(r) >= 15 && !(r.tarefas || []).some(id => by(id) && ckOpen(by(id))) && !(r.mitig || "").trim())) add("crit", "risco", `Risco ${r.cod} com score ${ckRiscoScore(r)} sem plano de mitigação: ${trunc(r.desc, 70)}`, [r.cod], "trabalho.riscos");
    for (const p of ckA("ckIss").filter(p => ["aberto", "em análise"].includes(p.status) && diff(TODAY, p.criado || TODAY) >= 3 && !(p.solucoes || []).length)) add("warn", "problema", `Problema ${p.cod} aberto há ${diff(TODAY, p.criado)} dias sem soluções propostas: ${trunc(p.titulo, 60)}`, [p.cod], "trabalho.problemas");
    for (const m of ckEquipe().filter(m => !m.eu)) { const u = ckA("ckMeet").filter(x => x.tipo === "1a1" && x.membro === m.id).map(x => x.data).sort().at(-1), d = u ? diff(TODAY, u) : null; if (d == null || d > (+ckD().cfg.ciclo1a1 || 14)) add("info", "1a1", `${m.nome}: ${u ? `último 1:1 há ${d} dias` : "nenhum 1:1 registrado"}`, [], "trabalho.equipe"); }
    const elAtr = ckA("ckEl").filter(e => e.prevista && e.prevista < TODAY && !["emesso", "approvato"].includes(e.stato)); if (elAtr.length) add("warn", "elaborati", `${plural(elAtr.length, "elaborato atrasado", "elaborati atrasados")}: ${elAtr.slice(0, 4).map(e => `${e.cod} ${e.codigo || trunc(e.titulo, 30)}`).join("; ")}`, elAtr.map(e => e.cod), "trabalho.entregas");
    const clash = ckA("ckBim").filter(b => b.tipo === "clash" && (b.snaps || []).length >= 2).filter(b => { const s = b.snaps.slice(-2); return s[1].abertos > s[0].abertos; }); if (clash.length) add("warn", "clash", `Clash em alta: ${clash.map(b => `${b.disc || "?"} (${b.snaps.at(-2).abertos} → ${b.snaps.at(-1).abertos} abertos)`).join("; ")}`, clash.map(b => b.cod), "trabalho.bim");
    const ord = { crit: 0, warn: 1, info: 2 }; return out.sort((a, b) => ord[a.st] - ord[b.st]);
  });
}

/* ---------------------------------------------------------------- riscos sugeridos a partir de tarefas e eventos (sem IA) */
const CK_RX = [
  [/variant|modific|ampliament|nuova richiesta|richiesta (del|dal) cliente|mudan[cç]a de escopo|escopo|scope/i, "Mudança de escopo sem formalização contratual (variante)", 4, 4, "pedido de alteração do cliente sem ordem formal", "Formalizar a variante por escrito antes de produzir; registrar impacto em prazo e custo"],
  [/dati mancant|in attesa|aguardando|falta(m)? (dado|o levantamento)|rilievo|topograf|sondagg|geotecn/i, "Dados de entrada atrasados (levantamento, geotecnia, sondagens)", 3, 4, "dado de entrada não recebido na data combinada", "Pedir os dados por escrito com data; trabalhar com hipóteses declaradas e marcar o que depende delas"],
  [/interferenz|sottoserviz|rete (gas|idrica|elettrica)|enel|italgas|smat/i, "Interferências com sottoservizi não mapeados", 3, 4, "cadastro de redes incompleto", "Solicitar as cartografias aos gestores das redes e prever investigações"],
  [/espropri|esproprio|occupazion/i, "Atraso no plano particellare / espropri", 3, 3, "particelle sem titular identificado", "Antecipar visure catastali e o piano particellare"],
  [/parer[ei]|autorizzazion|conferenza dei servizi|nulla osta|soprintendenz|parecer|licen[cç]a ambiental/i, "Atraso em pareceres e autorizações de entes", 3, 4, "parecer não emitido no prazo", "Mapear os entes, prazos legais e pré-consultas; preparar a documentação completa"],
  [/clash|interferenza (tra|fra) modell|federat/i, "Clash não resolvidos entre disciplinas antes da entrega", 3, 3, "clash abertos crescendo entre duas verificações", "Reunião de coordenação BIM semanal e regras de clash por disciplina"],
  [/idraulic|drenagg|invarianza|compatibilit[aà] idraulic|attraversament/i, "Compatibilidade hidráulica não verificada a tempo", 3, 4, "relação hidráulica sem verificação pelo ente", "Pré-dimensionar cedo e alinhar com o ente as hipóteses (TR, franco)"]];
function ckRiscosSug() {
  return memo("ckrsug", () => {
    const ex = ckA("ckRisk").map(r => norm(r.desc)), out = [], seen = new Set(), C = ckCPM();
    const has = d => ex.some(e => e.includes(norm(d).slice(0, 28))) || seen.has(d);
    for (const e of ckA("ckLog").filter(x => x.data >= addDays(TODAY, -45)).sort((a, b) => b.at - a.at)) for (const [rx, d, p, i, g, m] of CK_RX) if (rx.test(e.texto) && !has(d)) { seen.add(d); out.push({ desc: d, prob: p, imp: i, gatilho: g, mitig: m, projeto: e.projeto || "", fonte: `${e.cod} (${fmtD(e.data)})`, cite: [e.cod] }); }
    for (const mk of ckD().marcos.filter(m => !m.feito && m.data >= TODAY)) { const late = ckT().filter(t => ckOpen(t) && t.marco === mk.id && C.R[t.id]?.ef > mk.data); const d = `Slittamento della consegna “${mk.nome}”`; if (late.length && !has(d)) { seen.add(d); out.push({ desc: d, prob: 4, imp: 5, gatilho: "tarefas do marco terminando depois da data", mitig: `Replanejar ${late.map(t => t.cod).join(", ")}: realocar, reduzir escopo ou negociar a data`, projeto: mk.projeto, fonte: late.map(t => t.cod).join(", "), cite: late.map(t => t.cod) }); } }
    const jr = {}; for (const t of ckT().filter(t => ckOpen(t) && C.R[t.id]?.crit && ckMult(ckM(t.resp)) >= 1.5 && !t.revisor)) (jr[t.resp] ||= []).push(t);
    for (const [mid, ts] of Object.entries(jr)) { const d = `Tarefas críticas de ${ckMN(mid)} (júnior) sem revisor`; if (!has(d)) { seen.add(d); out.push({ desc: d, prob: 3, imp: 4, gatilho: "erro detectado só na verificação final", mitig: `Definir revisor e um ponto de controle no meio de ${ts.map(t => t.cod).join(", ")}`, projeto: ts[0].projeto, fonte: ts.map(t => t.cod).join(", "), cite: ts.map(t => t.cod) }); } }
    for (const m of ckEquipe()) { const cg = ckCarga(m.id); const crit = ckT().filter(t => ckOpen(t) && t.resp === m.id && C.R[t.id]?.crit); const d = `Concentração de carga crítica em ${ckMN(m.id)}`; if (cg.load > 1.1 && crit.length && !has(d)) { seen.add(d); out.push({ desc: d, prob: 4, imp: 4, gatilho: "carga acima de 110% com tarefas críticas", mitig: "Delegar tarefas não críticas e proteger blocos de foco", projeto: "", fonte: crit.map(t => t.cod).join(", "), cite: crit.map(t => t.cod) }); } }
    return out.slice(0, 8);
  });
}

/* ---------------------------------------------------------------- entrada rápida: t:/r:/p:/d:/e: + @pessoa #tag !prio 8h data [projeto] */
const CK_DOW = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6, sáb: 6, lun: 1, mar: 2, mer: 3, gio: 4, ven: 5 };
function ckParseData(s) {
  const n = norm(s); if (/\bhoje\b|\boggi\b/.test(n)) return TODAY; if (/\bamanha\b|\bdomani\b/.test(n)) return addDays(TODAY, 1);
  let m = n.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/); if (m) { let y = m[3] ? +m[3] : +TODAY.slice(0, 4); if (y < 100) y += 2000; const d = `${y}-${pad(+m[2])}-${pad(+m[1])}`; return !m[3] && d < TODAY ? `${y + 1}-${pad(+m[2])}-${pad(+m[1])}` : d; }
  m = n.match(/\b(?:ate |entro |por )?(dom|seg|ter|qua|qui|sex|sab|lun|mar|mer|gio|ven)[a-z]*\b/); if (m) { const w = CK_DOW[m[1]], d0 = parse(TODAY).getDay(); return addDays(TODAY, ((w - d0 + 7) % 7) || 7); }
  m = n.match(/\bem (\d{1,2}) dias? uteis\b/); if (m) return ckAddU(TODAY, +m[1]);
  return "";
}
function ckParseQuick(txt) {
  let s = String(txt || "").trim(), tipo = "e"; const m0 = s.match(/^(t|tarefa|r|risco|p|problema|d|decis[aã]o|e|log|evento)\s*:\s*/i);
  if (m0) { tipo = { t: "t", tarefa: "t", r: "r", risco: "r", p: "p", problema: "p", d: "d", decisao: "d", decisão: "d", e: "e", log: "e", evento: "e" }[norm(m0[1])] || "e"; s = s.slice(m0[0].length); }
  const o = { tipo, tags: [], resp: "", prio: "", esforco: "", prazo: "", projeto: "" }; const M = ckEquipe(), P = ckD().projetos;
  s = s.replace(/@([\p{L}]+)/gu, (x, n) => { const nn = norm(n), mm = ["eu", "mim", "me", "io"].includes(nn) ? M.find(m => m.eu) : M.find(m => norm(m.nome).split(" ")[0] === nn || norm(m.nome).startsWith(nn)); if (mm) { o.resp = mm.id; return ""; } return x; });
  s = s.replace(/#([\p{L}\p{N}_-]+)/gu, (x, t) => { const tg = CK_AGENTE.tags.find(z => norm(z) === norm(t) || norm(z).startsWith(norm(t))) || t; if (!o.tags.includes(tg)) o.tags.push(tg); return ""; });
  s = s.replace(/!(alta|m[eé]dia|baixa|alto|basso)\b/i, (x, p) => { o.prio = { alta: "alta", media: "média", média: "média", baixa: "baixa", alto: "alta", basso: "baixa" }[norm(p)] || ""; return ""; });
  s = s.replace(/(?:^|\s)~?(\d+(?:[.,]\d+)?)\s?h\b/i, (x, h) => { o.esforco = parseNum(h); return " "; });
  s = s.replace(/\[([^\]]+)\]|\+([\p{L}\p{N}_-]+)/gu, (x, a, b) => { const q = norm(a || b), p = P.find(p => norm(p.nome).includes(q) || norm(p.nome).split(/\s+/).some(w => w.startsWith(q) && q.length >= 3)); if (p) { o.projeto = p.id; return ""; } return x; });
  const dm = s.match(/\b(?:at[eé]|entro|para|per|prazo)?\s*(hoje|oggi|amanh[aã]|domani|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|(?:seg|ter|qua|qui|sex|lun|mar|mer|gio|ven)[a-zà-ú]*(?:-feira)?|em \d{1,2} dias? [úu]teis)\b/i);
  if (dm) { const d = ckParseData(dm[1]); if (d) { o.prazo = d; s = s.replace(dm[0], " "); } }
  o.texto = s.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim(); return o;
}
/* classificação local de um evento do diário de bordo (a IA refina quando disponível) */
const CK_LOGT = [["escopo", /variant|escopo|scope|modific|ampliament|aggiunt/i], ["cliente", /cliente|committente|stazione appaltante|rup\b/i], ["demanda", /nuova richiesta|pedido|pediu|richiesta|demanda|preciso entregar/i], ["decisão", /decid|decidimos|si [eè] deciso|definimos|optamos/i], ["problema", /problema|errore|erro|non funziona|bug|incongruen/i], ["risco", /risco|rischio|pode atrasar|potrebbe/i], ["conversa", /conversa|parlato|falei|telefonata|call|riunione/i]];
const ckLogTipo = txt => (CK_LOGT.find(([, rx]) => rx.test(txt)) || ["evento"])[0];
const CK_LOG_TIPOS = ["evento", "demanda", "escopo", "cliente", "conversa", "decisão", "problema", "risco", "nota"];

/* ---------------------------------------------------------------- o que o agente lê (estado completo, com códigos) */
function ckFacts() {
  const c = ckD(), C = ckCPM(), T = ckT(), L = [], open = ckSorted(T.filter(ckOpen)), lin = t => { const r = C.R[t.id], p = ckPrio(t); return `- ${t.cod} “${t.titulo}” | ${ckPN(t.projeto)} | resp ${ckMNa(t.resp)} | ${t.status}${t.feito ? ` ${t.feito}%` : ""} | prazo ${t.prazo ? fmtDY(t.prazo) : "—"} | esforço ${t.esforco || "?"} h | prio ${t.prio || "–"} | impacto ${t.impacto || "–"}${(t.tags || []).length ? ` | tags ${t.tags.join(", ")}` : ""}${(t.deps || []).length ? ` | depende de ${t.deps.map(d => T.find(x => x.id === d)?.cod).filter(Boolean).join(", ")}` : ""}${r ? ` | CPM ES ${fmtD(r.es)} EF ${fmtD(r.ef)} folga ${r.folga}${r.crit ? " CRÍTICA" : ""}${r.atraso ? " ATRASO PREVISTO" : ""}` : ""} | Eisenhower ${CK_Q[p.q][0]} (score ${p.s}${p.r.length ? ": " + p.r.join(", ") : ""})${t.marco ? ` | marco ${c.marcos.find(m => m.id === t.marco)?.nome || "?"}` : ""}${t.notas ? ` | notas: ${trunc(t.notas, 120)}` : ""}`; };
  L.push(`HOJE: ${fmtDL(TODAY)} (${TODAY})${ckUtil(TODAY) ? ", dia útil" : `, não é dia útil; o próximo é ${fmtDL(ckToday())}`}. Feriados nos próximos 30 dias: ${Array.from({ length: 30 }, (_, i) => addDays(TODAY, i)).filter(ckFer).map(d => `${fmtD(d)} ${ckFer(d)}`).join(", ") || "nenhum"}.`);
  L.push("PROJETOS:\n" + (c.projetos.map(p => `- ${p.nome}${p.cliente ? ` | cliente ${p.cliente}` : ""}${p.fase ? ` | fase ${p.fase}` : ""}${p.ativo === false ? " | encerrado" : ""} | fim previsto pelo CPM ${C.fim[p.id] ? fmtD(C.fim[p.id]) : "—"} | caminho que define o fim: ${(C.caminho[p.id] || []).map(id => T.find(t => t.id === id)?.cod).join(" → ") || "—"}`).join("\n") || "- nenhum"));
  const mks = c.marcos.filter(m => !m.feito); if (mks.length) L.push("MARCOS (consegne, revisioni, approvazioni):\n" + mks.sort((a, b) => a.data.localeCompare(b.data)).map(m => `- ${fmtDY(m.data)} ${m.tipo || "marco"} “${m.nome}” | ${ckPN(m.projeto)} | ${ckDiffU(TODAY, m.data)} dias úteis`).join("\n"));
  L.push(`TAREFAS ABERTAS (${open.length}, em ordem de prioridade sugerida):\n` + (open.map(lin).join("\n") || "- nenhuma"));
  const done = T.filter(t => !ckOpen(t) && t.concluida >= addDays(TODAY, -21)); if (done.length) L.push("CONCLUÍDAS NAS ÚLTIMAS 3 SEMANAS: " + done.map(t => `${t.cod} ${trunc(t.titulo, 40)} (${ckMN(t.resp)}, ${fmtD(t.concluida)}${t.prazo ? t.concluida <= t.prazo ? ", no prazo" : `, ${ckDiffU(t.prazo, t.concluida)} d.u. de atraso` : ""})`).join("; "));
  L.push("EQUIPE E CARGA (próximos 10 dias úteis):\n" + ckEquipe().map(m => { const cg = ckCarga(m.id), p = ckPdi(m.id), u = ckA("ckMeet").filter(x => x.tipo === "1a1" && x.membro === m.id).sort((a, b) => b.data.localeCompare(a.data))[0];
    return `- ${ckMNa(m.id)} | ${m.papel || "–"} | nível ${m.nivel || "–"} (fator ${ckMult(m)}×) | ${m.horas || 0} h/sem | carga ${pct(cg.load)} (${num(cg.dem, 0)}/${num(cg.cap, 0)} h, ${CK_CST[cg.st]})${cg.ag ? ` | agenda ${num(cg.ag, 0)} h` : ""} | em andamento: ${T.filter(t => t.resp === m.id && t.status === "em andamento").map(t => t.cod).join(", ") || "nada"}${m.foco ? ` | foco: ${m.foco}` : ""}${p.comps.length ? ` | PDI${p.trilha ? ` (${CK_TRILHAS[p.trilha]?.nome || p.trilha})` : ""}: ${p.comps.map(x => `${x.nome} ${x.nivel}/${x.alvo ?? 3}`).join("; ")}` : ""}${p.metas.filter(x => !x.feito).length ? ` | metas: ${p.metas.filter(x => !x.feito).map(x => `${trunc(x.txt, 60)}${x.prazo ? ` até ${fmtD(x.prazo)}` : ""}`).join("; ")}` : ""}${!m.eu ? ` | último 1:1 ${u ? fmtD(u.data) : "nunca"}` : ""}`; }).join("\n"));
  const rk = ckA("ckRisk").filter(r => r.status !== "fechado"); if (rk.length) L.push("RISCOS (Risk Register):\n" + rk.sort((a, b) => ckRiscoScore(b) - ckRiscoScore(a)).map(r => `- ${r.cod} ${r.desc} | ${ckPN(r.projeto)} | P${r.prob}×I${r.imp}=${ckRiscoScore(r)} | gatilho: ${r.gatilho || "–"} | dono ${ckMNa(r.dono)} | mitigação: ${r.mitig || "nenhuma"} | ${r.status}${(r.tarefas || []).length ? ` | tarefas ${r.tarefas.map(id => T.find(t => t.id === id)?.cod).filter(Boolean).join(", ")}` : ""}`).join("\n"));
  const sg = ckRiscosSug(); if (sg.length) L.push("RISCOS QUE O MOTOR DETECTOU (ainda não registrados): " + sg.map(r => `${r.desc} [fonte ${r.fonte}]`).join("; "));
  const is = ckA("ckIss").filter(p => p.status !== "resolvido"); if (is.length) L.push("PROBLEMAS (Issue Log):\n" + is.map(p => `- ${p.cod} ${p.titulo} | ${ckPN(p.projeto)} | severidade ${p.sev} | ${p.status} | aberto em ${fmtD(p.criado)}${p.resp ? ` | resp ${ckMNa(p.resp)}` : ""}${p.desc ? ` | ${trunc(p.desc, 160)}` : ""}${(p.solucoes || []).length ? ` | soluções: ${p.solucoes.map((s, i) => `${i + 1}) ${s.titulo}${p.escolhida === s.id ? " [ESCOLHIDA]" : ""}`).join("; ")}` : ""}`).join("\n"));
  const lg = ckA("ckLog").filter(e => e.data >= addDays(TODAY, -21)).sort((a, b) => b.at - a.at).slice(0, 30); if (lg.length) L.push("DIÁRIO DE BORDO (21 dias):\n" + lg.map(e => `- ${e.cod} ${fmtD(e.data)} [${e.tipo}]${e.projeto ? ` ${ckPN(e.projeto)}:` : ""} ${trunc(e.texto, 220)}`).join("\n"));
  const dc = ckA("ckDec").slice(-12).reverse(); if (dc.length) L.push("DECISÕES (Decision Log):\n" + dc.map(d => `- ${d.cod} ${fmtD(d.data)} ${d.titulo}: ${trunc(d.decisao || "", 140)}${d.justificativa ? ` | porque ${trunc(d.justificativa, 140)}` : ""}${d.norma ? ` | norma ${d.norma}` : ""}${d.status === "revista" ? " | REVISTA" : ""}`).join("\n"));
  const bm = ckA("ckBim"); if (bm.length) L.push("TRACKER BIM:\n" + bm.map(b => `- ${b.cod} ${b.tipo} | ${ckPN(b.projeto)} | ${ckBimLinha(b)}`).join("\n"));
  const el = ckA("ckEl").filter(e => e.stato !== "approvato" || e.emissao >= addDays(TODAY, -30)); if (el.length) L.push("ELABORATI:\n" + el.map(e => `- ${e.cod} ${e.codigo || ""} ${trunc(e.titulo, 60)} | ${ckPN(e.projeto)} | ${e.fase || ""} rev ${e.rev || "–"} | ${e.stato} | prevista ${e.prevista ? fmtD(e.prevista) : "–"}${e.emissao ? ` | emessa ${fmtD(e.emissao)}` : ""}`).join("\n"));
  const mt = ckA("ckMeet").filter(x => x.data >= addDays(TODAY, -30)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8); if (mt.length) L.push("REUNIÕES E 1:1 (30 dias):\n" + mt.map(x => `- ${x.cod} ${fmtD(x.data)} ${x.tipo === "1a1" ? `1:1 com ${ckMN(x.membro)}` : x.titulo}${(x.feedback || []).length ? ` | feedback: ${x.feedback.map(f => `${f.tipo}: ${trunc(f.txt, 80)}`).join("; ")}` : ""}${(x.acoes || []).length ? ` | ações: ${x.acoes.map(a => `${trunc(a.txt, 60)} (${ckMN(a.resp)}${a.prazo ? `, ${fmtD(a.prazo)}` : ""})`).join("; ")}` : ""}`).join("\n"));
  const lc = ckA("ckLic"); if (lc.length) L.push("LIÇÕES APRENDIDAS: " + lc.slice(-10).map(l => `${l.cod} ${l.titulo}`).join("; "));
  const al = ckAlertas(); L.push("ALERTAS (calculados agora; comece por eles):\n" + (al.map(a => `- [${a.st === "crit" ? "CRÍTICO" : a.st === "warn" ? "ATENÇÃO" : "info"}] ${a.txt}`).join("\n") || "- nenhum"));
  aiNote("area", "Carreira");
  return L;
}
function ckBimLinha(b) {
  if (b.tipo === "modelo") return `${b.disc || "?"} “${b.nome || ""}” v${b.versao || "?"} LOD ${b.lod || "?"} | ${b.stato || "?"} | atualizado ${b.data ? fmtD(b.data) : "–"}${b.resp ? ` | ${ckMN(b.resp)}` : ""}`;
  if (b.tipo === "clash") { const s = b.snaps || [], u = s.at(-1); return `${b.disc || "?"} | ${u ? `${u.abertos} abertos, ${u.resolvidos} resolvidos em ${fmtD(u.data)}` : "sem verificação"}${s.length > 1 ? ` | antes ${s.at(-2).abertos} abertos` : ""}`; }
  if (b.tipo === "ifc") return `${b.nome || "consegna IFC"} ${b.schema || "IFC 4.3"} | prevista ${b.prevista ? fmtD(b.prevista) : "–"}${b.entregue ? ` | entregue ${fmtD(b.entregue)}` : ""} | ${b.stato || "?"}${b.verificado ? " | verificada" : ""}`;
  if (b.tipo === "bep") return `pGI/BEP v${b.versao || "?"} | ${b.stato || "?"} | ${b.data ? fmtD(b.data) : "–"}${b.notas ? ` | ${trunc(b.notas, 80)}` : ""}`;
  if (b.tipo === "loin") return `${b.objeto || "?"} (${b.fase || "?"}) | ${b.requisito || ""} | ${b.ok ? "conforme" : "não conforme"} | ${b.data ? fmtD(b.data) : "–"}`;
  return "";
}
function ckPrompt(fallback) {
  const fb = fallback ? `\n\nFORMATO (esta visualização não aceita ferramentas): escreva a resposta normalmente; para propor alterações, termine com um bloco exatamente assim, omitindo o que não houver:\n\`\`\`atlas\n{"acoes_ck":[{"tipo":"criar_tarefa","dados":{"titulo":"...","projeto":"nome do projeto","responsavel":"nome","prazo":"AAAA-MM-DD","esforco_h":8,"prioridade":"alta","impacto":"alto","tags":["BIM"],"depende_de":["T3"]}},{"tipo":"atualizar_tarefa","dados":{"tarefa":"T4","responsavel":"nome","prazo":"AAAA-MM-DD","status":"em andamento"}},{"tipo":"registrar_risco","dados":{"descricao":"...","probabilidade":3,"impacto":4,"gatilho":"...","dono":"nome","mitigacao":"..."}},{"tipo":"registrar_problema","dados":{"titulo":"...","descricao":"...","severidade":"alta"}},{"tipo":"propor_solucao","dados":{"problema":"P2","solucoes":[{"titulo":"...","pros":"...","contras":"...","esforco_h":6,"impacto":"...","responsavel":"nome","prazo":"AAAA-MM-DD"}]}},{"tipo":"registrar_evento","dados":{"texto":"...","tipo":"cliente"}},{"tipo":"registrar_decisao","dados":{"titulo":"...","decisao":"...","justificativa":"...","norma":"..."}}]}\n\`\`\`` : "";
  return `${ckEspec()}

${ckContexto()}

FERRAMENTAS: ${fallback ? "use o bloco atlas descrito no fim" : "as de escrita só criam propostas (cartões de aprovação); as de leitura respondem na hora"}. Ao citar uma tarefa, risco, problema, evento, decisão ou elaborato, use o código.
FORMATO DA RESPOSTA: curto e escaneável; listas numeradas para propostas; datas no formato dd/mm; termine sempre com "Próximos passos" (quem, o quê, até quando, e o que precisa de aprovação ou decisão sua).

ESTADO (tudo o que está registrado agora):
${ckFacts().join("\n\n")}${fb}`.slice(0, 150000);
}

/* ---------------------------------------------------------------- propostas: nada grava sem aprovação */
const CK_PT = { criar_tarefa: ["Nova tarefa", "plus"], atualizar_tarefa: ["Alterar tarefa", "pen"], registrar_risco: ["Registrar risco", "flag"], registrar_problema: ["Registrar problema", "info"], propor_solucao: ["Soluções para problema", "spark"], registrar_evento: ["Registrar no diário de bordo", "pen"], registrar_decisao: ["Registrar decisão", "check"] };
const ckMemb = n => { const q = norm(String(n || "").replace(/^@/, "")); if (!q) return null; return ckEquipe().find(m => m.id === n || (m.eu && ["eu", "mim", "voce", "você", norm(ckD().perfil.nome || "#"), norm(ckD().perfil.nome?.split(" ")[0] || "#")].includes(q)) || norm(m.nome) === q || norm(m.nome).split(" ")[0] === q) || null; };
const ckProj = n => { const q = norm(n); if (!q) return null; return ckD().projetos.find(p => p.id === n || norm(p.nome) === q) || ckD().projetos.find(p => norm(p.nome).includes(q) || q.includes(norm(p.nome))) || null; };
const ckDate = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) ? s : "";
const ckEnum = (v, list, def) => { const n = norm(v); return list.find(x => norm(x) === n) || def; };
/* normaliza e valida; devolve {dados, erro} */
function ckValida(tipo, d) {
  d = d || {}; const out = {}, err = [];
  const resp = k => { if (d[k] == null || d[k] === "") return ""; const m = ckMemb(d[k]); if (!m) err.push(`pessoa “${d[k]}” não existe na equipe`); return m?.id || ""; };
  const proj = () => { if (!d.projeto) return ""; const p = ckProj(d.projeto); if (!p) err.push(`projeto “${d.projeto}” não existe`); return p?.id || ""; };
  if (tipo === "criar_tarefa") { out.titulo = String(d.titulo || "").trim().slice(0, 200); if (!out.titulo) err.push("falta o título"); out.projeto = proj(); out.resp = resp("responsavel"); out.prazo = ckDate(d.prazo); out.esforco = isNum(d.esforco_h) ? Math.max(0, +d.esforco_h) : ""; out.prio = ckEnum(d.prioridade, CK_PRIO, "média"); out.impacto = ckEnum(d.impacto, CK_IMP, "médio"); out.tags = (d.tags || []).map(t => CK_AGENTE.tags.find(x => norm(x) === norm(t)) || String(t)).slice(0, 6); out.deps = (d.depende_de || []).map(r => { const t = ckTarRef(r); if (!t) err.push(`dependência “${r}” não existe`); return t?.id; }).filter(Boolean); out.notas = String(d.notas || "").slice(0, 600); out.inicio = ckDate(d.inicio); out.problema = d.problema ? ckFind("ckIss", d.problema)?.id || "" : ""; out.risco = d.risco ? ckFind("ckRisk", d.risco)?.id || "" : ""; out.marco = d.marco ? ckD().marcos.find(m => m.id === d.marco || norm(m.nome) === norm(d.marco))?.id || "" : ""; }
  if (tipo === "atualizar_tarefa") { const t = ckTarRef(d.tarefa); if (!t) err.push(`tarefa “${d.tarefa}” não existe`); out.tarefa = t?.id || ""; const c = {};
    if (d.titulo) c.titulo = String(d.titulo).slice(0, 200); if (d.responsavel != null && d.responsavel !== "") c.resp = resp("responsavel"); if (d.prazo) c.prazo = ckDate(d.prazo); if (d.inicio) c.inicio = ckDate(d.inicio); if (isNum(d.esforco_h)) c.esforco = +d.esforco_h; if (isNum(d.progresso)) c.feito = clamp(Math.round(+d.progresso), 0, 100);
    if (d.status) c.status = ckEnum(d.status, CK_STATUS, t?.status); if (d.prioridade) c.prio = ckEnum(d.prioridade, CK_PRIO, t?.prio); if (d.impacto) c.impacto = ckEnum(d.impacto, CK_IMP, t?.impacto); if (d.tags) c.tags = d.tags.map(x => CK_AGENTE.tags.find(z => norm(z) === norm(x)) || String(x));
    if (d.depende_de) c.deps = d.depende_de.map(r => ckTarRef(r)?.id).filter(Boolean); if (d.notas) c.notas = String(d.notas).slice(0, 600); if (d.projeto) c.projeto = proj();
    out.campos = c; out.motivo = String(d.motivo || "").slice(0, 300); if (!Object.keys(c).length) err.push("nenhum campo para alterar"); }
  if (tipo === "registrar_risco") { out.desc = String(d.descricao || "").trim().slice(0, 300); if (!out.desc) err.push("falta a descrição"); out.prob = clamp(Math.round(+d.probabilidade || 3), 1, 5); out.imp = clamp(Math.round(+d.impacto || 3), 1, 5); out.gatilho = String(d.gatilho || "").slice(0, 200); out.dono = resp("dono"); out.mitig = String(d.mitigacao || "").slice(0, 500); out.projeto = proj(); out.fonte = String(d.fonte || "").slice(0, 120); }
  if (tipo === "registrar_problema") { out.titulo = String(d.titulo || "").trim().slice(0, 200); if (!out.titulo) err.push("falta o título"); out.desc = String(d.descricao || "").slice(0, 800); out.sev = ckEnum(d.severidade, CK_PRIO, "média"); out.projeto = proj(); out.resp = resp("responsavel"); out.prazo = ckDate(d.prazo); }
  if (tipo === "propor_solucao") { const p = ckFind("ckIss", d.problema); if (!p) err.push(`problema “${d.problema}” não existe`); out.problema = p?.id || ""; out.solucoes = (d.solucoes || []).slice(0, 3).map(s => ({ id: uid(), titulo: String(s.titulo || "").slice(0, 160), desc: String(s.descricao || "").slice(0, 500), pros: String(s.pros || "").slice(0, 300), contras: String(s.contras || "").slice(0, 300), esforco: isNum(s.esforco_h) ? +s.esforco_h : "", impacto: String(s.impacto || "").slice(0, 200), resp: s.responsavel ? ckMemb(s.responsavel)?.id || "" : "", prazo: ckDate(s.prazo), fonte: "PMO" })).filter(s => s.titulo); if (out.solucoes.length < 2) err.push("proponha 2 ou 3 soluções"); }
  if (tipo === "registrar_evento") { out.texto = String(d.texto || "").trim().slice(0, 1200); if (!out.texto) err.push("falta o texto"); out.tipo = ckEnum(d.tipo, CK_LOG_TIPOS, ckLogTipo(out.texto)); out.projeto = proj(); out.data = ckDate(d.data) || TODAY; }
  if (tipo === "registrar_decisao") { out.titulo = String(d.titulo || "").trim().slice(0, 200); if (!out.titulo) err.push("falta o título"); out.decisao = String(d.decisao || "").slice(0, 800); out.justificativa = String(d.justificativa || "").slice(0, 800); out.alternativas = String(d.alternativas || "").slice(0, 500); out.norma = String(d.norma || "").slice(0, 200); out.contexto = String(d.contexto || "").slice(0, 500); out.projeto = proj(); out.quem = resp("quem"); }
  return { dados: out, erro: err.join("; ") };
}
function ckNovaTarefa(o, origem) {
  const t = { id: uid(), cod: ckCod("T"), titulo: o.titulo, projeto: o.projeto || "", resp: o.resp || "", prazo: o.prazo || "", inicio: o.inicio || "", esforco: o.esforco ?? "", feito: 0, status: o.status || "a fazer", prio: o.prio || "média", impacto: o.impacto || "médio", deps: o.deps || [], tags: o.tags || [], marco: o.marco || "", notas: o.notas || "", criada: TODAY, concluida: "", origem: origem || null, revisor: o.revisor || "", hist: [] };
  ckT().push(t); if (o.problema) { const p = ckFind("ckIss", o.problema); if (p) (p.tarefas ||= []).push(t.id); } if (o.risco) { const r = ckFind("ckRisk", o.risco); if (r) (r.tarefas ||= []).push(t.id); } return t;
}
function ckAplica(p) {
  const d = p.dados, org = { k: "pmo", rot: CK_AGENTE.nome };
  if (p.tipo === "criar_tarefa") { const t = ckNovaTarefa(d, org); return [t.cod, ["ckTar", "ckIss", "ckRisk"]]; }
  if (p.tipo === "atualizar_tarefa") { const t = ckT().find(x => x.id === d.tarefa); if (!t) return [null]; const antes = {}; for (const k of Object.keys(d.campos)) antes[k] = t[k]; Object.assign(t, d.campos); if (d.campos.status === "concluída" && !t.concluida) { t.concluida = TODAY; t.feito = 100; } (t.hist ||= []).push({ at: Date.now(), por: CK_AGENTE.nome, antes, depois: d.campos, motivo: d.motivo || "" }); return [t.cod, ["ckTar"]]; }
  if (p.tipo === "registrar_risco") { const r = { id: uid(), cod: ckCod("R"), ...d, status: "aberto", criado: TODAY, tarefas: [], origem: org }; ckA("ckRisk").push(r); return [r.cod, ["ckRisk"]]; }
  if (p.tipo === "registrar_problema") { const x = { id: uid(), cod: ckCod("P"), ...d, status: "aberto", criado: TODAY, solucoes: [], escolhida: "", tarefas: [], origem: org }; ckA("ckIss").push(x); return [x.cod, ["ckIss"]]; }
  if (p.tipo === "propor_solucao") { const x = ckA("ckIss").find(i => i.id === d.problema); if (!x) return [null]; (x.solucoes ||= []).push(...d.solucoes); if (x.status === "aberto") x.status = "em análise"; return [x.cod, ["ckIss"]]; }
  if (p.tipo === "registrar_evento") { const e = { id: uid(), cod: ckCod("E"), at: Date.now(), ...d, origem: org }; ckA("ckLog").push(e); return [e.cod, ["ckLog"]]; }
  if (p.tipo === "registrar_decisao") { const x = { id: uid(), cod: ckCod("D"), data: TODAY, ...d, status: "vigente", origem: org }; ckA("ckDec").push(x); return [x.cod, ["ckDec"]]; }
  return [null];
}
function ckDecide(mid, p, ok, quiet) {
  if (!p || p.status !== "pendente") return false;
  if (!ok) { p.status = "descartada"; if (!quiet) touch("mentores", { label: "Proposta descartada" }); return true; }
  const v = ckValida(p.tipo, p.raw); if (v.erro) { p.status = "descartada"; p.erro = v.erro; if (!quiet) { touch("mentores", { noUndo: true }); toast("Não deu para aplicar: " + v.erro); } return false; }
  const [ref, keys] = ckAplica({ tipo: p.tipo, dados: v.dados }); if (!ref) { p.status = "descartada"; p.erro = "o registro não existe mais"; if (!quiet) touch("mentores", { noUndo: true }); return false; }
  p.status = "aceita"; p.ref = ref; if (!quiet) { touch(...keys, "mentores", "ck", { label: `${CK_PT[p.tipo][0]} (${ref})` }); undoToast(`${CK_PT[p.tipo][0]}: ${ref}`); } return keys;
}
/* aprovar várias de uma vez (botão ou “ok” no chat) */
function ckDecideMany(ps, ok) {
  const keys = new Set(["mentores", "ck"]), refs = []; let n = 0;
  for (const p of ps) { const k = ckDecide("ck", p, ok, true); if (k) { n++; if (Array.isArray(k)) k.forEach(x => keys.add(x)); if (p.ref) refs.push(p.ref); } }
  touch(...keys, { label: ok ? `Aprovadas ${n} propostas do ${CK_AGENTE.nome}` : "Propostas descartadas" }); return { n, refs, falhas: ps.filter(p => p.erro).map(p => p.erro) };
}
const ckPendentes = () => { const cv = mget("ck").conversa || []; const out = []; cv.forEach((m, mi) => (m.acoes || []).forEach(p => { if (p.ck && p.status === "pendente") out.push({ p, mi }); })); return out; };
function ckResumo(p) {
  const d = p.raw || {}, T = (l, v) => v != null && v !== "" && !(Array.isArray(v) && !v.length) ? `<span><b>${l}</b> ${esc(Array.isArray(v) ? v.join(", ") : v)}</span>` : "";
  if (p.tipo === "criar_tarefa") return `<b class="ckpt">${esc(d.titulo || "")}</b><div class="ckpf">${T("projeto", d.projeto)}${T("resp.", d.responsavel)}${T("prazo", d.prazo && fmtDY(d.prazo))}${T("esforço", isNum(d.esforco_h) ? d.esforco_h + " h" : "")}${T("prio", d.prioridade)}${T("impacto", d.impacto)}${T("tags", d.tags)}${T("depende de", d.depende_de)}</div>${d.notas ? `<p>${esc(d.notas)}</p>` : ""}`;
  if (p.tipo === "atualizar_tarefa") { const t = ckTarRef(d.tarefa), lab = { titulo: "título", responsavel: "responsável", prazo: "prazo", inicio: "início", esforco_h: "esforço (h)", progresso: "progresso (%)", status: "status", prioridade: "prioridade", impacto: "impacto", tags: "tags", depende_de: "depende de", notas: "notas", projeto: "projeto" }, cur = { titulo: t?.titulo, responsavel: ckMN(t?.resp), prazo: t?.prazo && fmtDY(t.prazo), inicio: t?.inicio && fmtDY(t.inicio), esforco_h: t?.esforco, progresso: t?.feito, status: t?.status, prioridade: t?.prio, impacto: t?.impacto, tags: (t?.tags || []).join(", "), depende_de: (t?.deps || []).map(id => ckT().find(x => x.id === id)?.cod).join(", "), notas: trunc(t?.notas || "", 40), projeto: ckPN(t?.projeto) };
    return `<b class="ckpt">${esc(t ? `${t.cod} ${t.titulo}` : d.tarefa || "?")}</b><div class="ckdiff">${Object.keys(lab).filter(k => d[k] != null && d[k] !== "").map(k => `<span>${lab[k]}: <s>${esc(cur[k] ?? "–")}</s> → <b>${esc(Array.isArray(d[k]) ? d[k].join(", ") : k === "prazo" || k === "inicio" ? fmtDY(d[k]) : d[k])}</b></span>`).join("")}</div>${d.motivo ? `<p>${esc(d.motivo)}</p>` : ""}`; }
  if (p.tipo === "registrar_risco") return `<b class="ckpt">${esc(d.descricao || "")}</b><div class="ckpf">${T("P×I", `${d.probabilidade || "?"}×${d.impacto || "?"} = ${(+d.probabilidade || 0) * (+d.impacto || 0)}`)}${T("dono", d.dono)}${T("gatilho", d.gatilho)}${T("projeto", d.projeto)}</div>${d.mitigacao ? `<p><b>Mitigação:</b> ${esc(d.mitigacao)}</p>` : ""}`;
  if (p.tipo === "registrar_problema") return `<b class="ckpt">${esc(d.titulo || "")}</b><div class="ckpf">${T("severidade", d.severidade)}${T("projeto", d.projeto)}${T("resp.", d.responsavel)}${T("prazo", d.prazo && fmtDY(d.prazo))}</div>${d.descricao ? `<p>${esc(trunc(d.descricao, 300))}</p>` : ""}`;
  if (p.tipo === "propor_solucao") return `<b class="ckpt">${esc(ckFind("ckIss", d.problema)?.cod || d.problema || "")} ${esc(ckFind("ckIss", d.problema)?.titulo || "")}</b><ol class="cksols">${(d.solucoes || []).map(s => `<li><b>${esc(s.titulo || "")}</b><small>${[s.esforco_h != null && s.esforco_h !== "" && `${s.esforco_h} h`, s.responsavel, s.prazo && fmtDY(s.prazo)].filter(Boolean).map(esc).join(" · ")}</small>${s.pros ? `<span class="good">+ ${esc(s.pros)}</span>` : ""}${s.contras ? `<span class="bad">− ${esc(s.contras)}</span>` : ""}${s.impacto ? `<span>${esc(s.impacto)}</span>` : ""}</li>`).join("")}</ol>`;
  if (p.tipo === "registrar_evento") return `<div class="ckpf">${T("tipo", d.tipo)}${T("projeto", d.projeto)}</div><p>${esc(trunc(d.texto || "", 400))}</p>`;
  if (p.tipo === "registrar_decisao") return `<b class="ckpt">${esc(d.titulo || "")}</b><p>${esc(d.decisao || "")}</p>${d.justificativa ? `<p class="muted">Porque: ${esc(d.justificativa)}</p>` : ""}<div class="ckpf">${T("norma", d.norma)}${T("projeto", d.projeto)}</div>`;
  return "";
}
function ckPropHTML(mid, mi, p) {
  const [lab, ico] = CK_PT[p.tipo] || ["Proposta", "plus"];
  return `<div class="prop ckprop ${p.status}"><div class="prop-t">${ic(ico)}<div><span class="prop-k">${p.n ? `#${p.n} · ` : ""}${lab}</span>${ckResumo(p)}${p.erro ? `<p class="st-crit small">${esc(p.erro)}</p>` : ""}</div></div>
    <div class="prop-a">${p.status === "pendente" ? (mi >= 0 ? `<button type="button" class="btn sm primary" data-prop="${mid}|${mi}|${p.id}|ok">${ic("check")}Aprovar</button><button type="button" class="btn sm ghost" data-prop="${mid}|${mi}|${p.id}|no">Descartar</button>` : `<span class="muted">aguarde a resposta terminar</span>`) : p.status === "aceita" ? `<span class="pill good">Aprovada${p.ref ? " · " + esc(p.ref) : ""}</span>` : `<span class="pill none">Descartada</span>`}</div></div>`;
}
/* “ok”, “aprova”, “vai” (tudo) · “aprova 1 e 3” · “descarta” / “não” */
const CK_SIM = /^(ok|okay|aprova(do|da|r)?|aprovo|aprovad[oa]s?|vai|pode ir|manda|confirmo|confirma(do)?|sim|fechado|bora)\b/i, CK_NAO = /^(n[aã]o|descarta(r)?|descarte|cancela(r)?|recusa(r)?|nada disso)\b/i;
function ckIntercept(text) {
  const t = String(text || "").trim(), pend = ckPendentes(); if (!pend.length) return false;
  const sim = CK_SIM.test(t), nao = CK_NAO.test(t), rest = t.replace(CK_SIM, "").replace(CK_NAO, "").trim(); if (!sim && !nao) return false;
  const toks = rest.split(/[\s,.;:!]+/).filter(Boolean), okTok = /^(\d+|e|tudo|todas?|todos|as|os|s[oó]|apenas|pode|isso|ent[aã]o|por|favor|obrigad[oa]|valeu|essas?|esses?)$/i; if (toks.some(x => !okTok.test(x))) return false;
  const nums = toks.filter(x => /^\d+$/.test(x)).map(Number);
  const lastMi = Math.max(...pend.map(x => x.mi)), alvo = nums.length ? pend.filter(x => x.mi === lastMi && nums.includes(x.p.n)) : pend; if (!alvo.length) return false;
  const r = ckDecideMany(alvo.map(x => x.p), sim), m = mstate("ck");
  m.conversa.push({ role: "user", content: t, at: Date.now(), mode: "chat" }, { role: "assistant", content: sim ? `Aprovado${r.n !== 1 ? "s" : ""}: ${r.refs.join(", ") || "nada a aplicar"}.${r.falhas.length ? ` Não apliquei: ${r.falhas.join("; ")}.` : ""}` : `Descartei ${plural(alvo.length, "proposta", "propostas")}.`, at: Date.now(), local: true });
  MST.input.ck = ""; touch("mentores", { noUndo: true }); scrollChat(); return true;
}

/* ---------------------------------------------------------------- ferramentas do agente */
function ckTools(live) {
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  const prop = (tipo, inp) => { const v = ckValida(tipo, inp); if (v.erro) return { ok: false, erro: v.erro }; const n = live.acoes.filter(a => a.ck).length + 1, p = { id: uid(), ck: true, tipo, raw: JSON.parse(JSON.stringify(inp)), status: "pendente", n }; live.acoes.push(p); note(tipo, `#${n} ${trunc(inp.titulo || inp.descricao || inp.texto || inp.tarefa || inp.problema || "", 60)}`); return { ok: true, status: `proposta #${n} aguardando aprovação; nada foi gravado` }; };
  const S_T = { type: "string" }, S_N = { type: "number" }, S_A = { type: "array", items: { type: "string" } }, nomes = ckEquipe().map(m => m.eu ? "eu" : m.nome);
  const tarefaProps = { titulo: S_T, projeto: { type: "string", description: "nome do projeto" }, responsavel: { type: "string", description: `uma de: ${nomes.join(", ")}` }, prazo: { type: "string", description: "AAAA-MM-DD" }, inicio: { type: "string", description: "AAAA-MM-DD, opcional" }, esforco_h: S_N, prioridade: { type: "string", enum: CK_PRIO }, impacto: { type: "string", enum: CK_IMP }, tags: { type: "array", items: { type: "string" }, description: `de preferência: ${CK_AGENTE.tags.join(", ")}` }, depende_de: { type: "array", items: { type: "string" }, description: "códigos das tarefas (T3)" }, notas: S_T };
  const T = {
    listar_tarefas: { description: "Lista tarefas com filtros (responsável, projeto, status, tag, prazo até) e devolve código, prazo, CPM (folga, crítica, atraso previsto) e prioridade.", inputSchema: { type: "object", properties: { responsavel: S_T, projeto: S_T, status: { type: "string", enum: CK_STATUS }, tag: S_T, prazo_ate: { type: "string", description: "AAAA-MM-DD" }, incluir_concluidas: { type: "boolean" } } },
      execute: inp => { const m = inp.responsavel ? ckMemb(inp.responsavel) : null, p = inp.projeto ? ckProj(inp.projeto) : null, C = ckCPM().R;
        const r = ckSorted(ckT().filter(t => (inp.incluir_concluidas || ckOpen(t)) && (!m || t.resp === m.id) && (!p || t.projeto === p.id) && (!inp.status || t.status === inp.status) && (!inp.tag || (t.tags || []).some(x => norm(x) === norm(inp.tag))) && (!inp.prazo_ate || (t.prazo && t.prazo <= inp.prazo_ate)))).slice(0, 40);
        note("listar_tarefas", `${r.length} tarefas`); return r.map(t => ({ cod: t.cod, titulo: t.titulo, projeto: ckPN(t.projeto), resp: ckMN(t.resp), status: t.status, prazo: t.prazo, esforco_h: t.esforco, folga: C[t.id]?.folga ?? null, critica: !!C[t.id]?.crit, atraso_previsto: !!C[t.id]?.atraso, termino_previsto: C[t.id]?.ef || null, eisenhower: CK_Q[ckPrio(t).q][0] })); } },
    criar_tarefa: { description: "PROPÕE uma tarefa nova (vira cartão de aprovação; nada é gravado). Dados completos: responsável, prazo, esforço, projeto, prioridade, impacto, tags e dependências.", inputSchema: { type: "object", properties: tarefaProps, required: ["titulo", "responsavel", "prazo", "esforco_h"] }, execute: inp => prop("criar_tarefa", inp) },
    atualizar_tarefa: { description: "PROPÕE alterar uma tarefa existente (responsável para delegar, prazo, status, prioridade, progresso, dependências…). Diga o motivo.", inputSchema: { type: "object", properties: { tarefa: { type: "string", description: "código (T12)" }, ...tarefaProps, progresso: { type: "number", description: "0–100" }, status: { type: "string", enum: CK_STATUS }, motivo: S_T }, required: ["tarefa"] }, execute: inp => prop("atualizar_tarefa", inp) },
    registrar_risco: { description: "PROPÕE registrar um risco no Risk Register (probabilidade e impacto de 1 a 5, gatilho, dono, plano de mitigação).", inputSchema: { type: "object", properties: { descricao: S_T, probabilidade: S_N, impacto: S_N, gatilho: S_T, dono: S_T, mitigacao: S_T, projeto: S_T, fonte: { type: "string", description: "códigos ou dados que motivam o risco" } }, required: ["descricao", "probabilidade", "impacto", "mitigacao"] }, execute: inp => prop("registrar_risco", inp) },
    registrar_problema: { description: "PROPÕE registrar um problema no Issue Log.", inputSchema: { type: "object", properties: { titulo: S_T, descricao: S_T, severidade: { type: "string", enum: CK_PRIO }, projeto: S_T, responsavel: S_T, prazo: S_T }, required: ["titulo", "severidade"] }, execute: inp => prop("registrar_problema", inp) },
    propor_solucao: { description: "PROPÕE 2 ou 3 soluções para um problema registrado, cada uma com prós, contras, esforço (h), impacto, responsável sugerido e prazo. Depois a pessoa escolhe uma e a converte em tarefas.", inputSchema: { type: "object", properties: { problema: { type: "string", description: "código (P2)" }, solucoes: { type: "array", items: { type: "object", properties: { titulo: S_T, descricao: S_T, pros: S_T, contras: S_T, esforco_h: S_N, impacto: S_T, responsavel: S_T, prazo: S_T }, required: ["titulo", "pros", "contras"] } } }, required: ["problema", "solucoes"] }, execute: inp => prop("propor_solucao", inp) },
    registrar_evento: { description: "PROPÕE registrar algo no diário de bordo (evento, demanda nova, mudança de escopo, pedido do cliente, conversa relevante).", inputSchema: { type: "object", properties: { texto: S_T, tipo: { type: "string", enum: CK_LOG_TIPOS }, projeto: S_T, data: S_T }, required: ["texto"] }, execute: inp => prop("registrar_evento", inp) },
    registrar_decisao: { description: "PROPÕE registrar uma decisão técnica no Decision Log, com justificativa, alternativas consideradas e a norma aplicável.", inputSchema: { type: "object", properties: { titulo: S_T, decisao: S_T, justificativa: S_T, alternativas: S_T, norma: S_T, contexto: S_T, projeto: S_T, quem: S_T }, required: ["titulo", "decisao", "justificativa"] }, execute: inp => prop("registrar_decisao", inp) },
    sugerir_delegacao: { description: "Calcula quem deve fazer uma tarefa (existente pelo código, ou descrita) pelo nível, carga, prazo e objetivo de aprendizado do PDI. Devolve o ranking com motivos e o trade-off. Para efetivar, proponha atualizar_tarefa.", inputSchema: { type: "object", properties: { tarefa: { type: "string", description: "código (T12), se já existir" }, titulo: S_T, esforco_h: S_N, tags: S_A, prazo: S_T } },
      execute: inp => { const t = inp.tarefa ? ckTarRef(inp.tarefa) : null, C = t ? ckC(t.id) : null; const r = ckDeleg({ tags: t?.tags || inp.tags || [], esforco: t?.esforco || inp.esforco_h, prazo: t?.prazo || ckDate(inp.prazo), prio: t?.prio, folga: C?.folga, excl: [] }); note("sugerir_delegacao", t?.cod || trunc(inp.titulo || "", 40)); return r.slice(0, 4).map(x => ({ pessoa: x.nome, pontuacao: x.s, motivos: x.r, horas_estimadas: Math.round(x.h), cabe_no_prazo: x.cabe, carga_10du: Math.round(x.carga * 100) + "%", revisor_sugerido: x.revisor ? ckMN(x.revisor) : null, tradeoff: x.tradeoff })); } },
    calcular_caminho_critico: { description: "Calcula o caminho crítico (CPM em dias úteis com feriados italianos) de um projeto ou de todos: início e término previstos, folgas, tarefas críticas e atrasos em cascata.", inputSchema: { type: "object", properties: { projeto: S_T } },
      execute: inp => { const p = inp.projeto ? ckProj(inp.projeto) : null, C = ckCPM(), ts = ckT().filter(t => ckOpen(t) && (!p || t.projeto === p.id)); note("calcular_caminho_critico", p?.nome || "todos"); const cod = id => ckT().find(t => t.id === id)?.cod;
        return { projeto: p?.nome || "todos", fim_previsto: p ? C.fim[p.id] || null : Object.values(C.fim).sort().at(-1) || null, caminho: p ? (C.caminho[p.id] || []).map(cod) : Object.fromEntries(Object.entries(C.caminho).map(([k, v]) => [ckPN(k === "_" ? "" : k), v.map(cod)])), tarefas: ts.map(t => ({ cod: t.cod, inicio: C.R[t.id].es, termino: C.R[t.id].ef, folga: C.R[t.id].folga, critica: C.R[t.id].crit, atraso_previsto: C.R[t.id].atraso })), cascata: C.cascata.map(c => ({ tarefa: cod(c.id), origem: cod(c.origem) })), ciclos: C.ciclo.map(cod) }; } },
    gerar_briefing: { description: "Monta os dados do briefing (diário: 3 prioridades, bloqueios, prazos próximos, quem precisa de apoio; semanal: concluído, atrasado e por quê, plano da próxima semana). Você redige a partir deles.", inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["diario", "semanal"] } } },
      execute: inp => { note("gerar_briefing", inp.tipo || "diario"); return inp.tipo === "semanal" ? ckWeeklyData() : ckBriefData(); } },
    gerar_relatorio: { description: "Devolve os números do mês (ou de outro período) para o relatório à diretoria, que você redige em italiano: concluídas, no prazo, atrasos, riscos, problemas, decisões, elaborati, BIM, equipe.", inputSchema: { type: "object", properties: { mes: { type: "string", description: "AAAA-MM; padrão: mês atual" } } },
      execute: inp => { const mk = /^\d{4}-\d{2}$/.test(inp.mes || "") ? inp.mes : mkey(TODAY); note("gerar_relatorio", mlabel(mk)); return ckMesData(mk); } } };
  return CK_AGENTE.ferramentas.filter(n => T[n]).map(n => ({ name: n, ...T[n] }));
}
/* sem ferramentas: lê o bloco atlas */
function ckParseBlock(b, live) { for (const a of b.acoes_ck || []) { if (!CK_PT[a.tipo]) continue; const v = ckValida(a.tipo, a.dados); const n = live.acoes.filter(x => x.ck).length + 1; live.acoes.push({ id: uid(), ck: true, tipo: a.tipo, raw: a.dados || {}, status: "pendente", n, erro: v.erro || "" }); } }

Object.assign(MENTOR_DEF, { ck: { page: "trabalho", sub: "hoje", gate: "Carreira", cor: "var(--a-car)", ico: "gauge", nome: CK_AGENTE.nome, papel: "PMO sênior em infraestrutura viária, especialista em BIM e mentor da equipe", arq: "um PMO sênior de infraestrutura viária na Itália, especialista em BIM e mentor de engenheiros júnior",
  voz: "Direto e concreto, cita códigos e datas, abre com os alertas, deixa os trade-offs explícitos e sempre termina com próximos passos; conversa em português e escreve os entregáveis em italiano técnico formal.",
  facts: () => ckFacts(), prompt: ckPrompt, tools: live => ckTools(live), intercept: ckIntercept, parseBlock: ckParseBlock } });
if (!MIDS.includes("ck")) MIDS.push("ck");
Object.assign(USO_TXT, { listar_tarefas: ["list", "Listou tarefas"], criar_tarefa: ["plus", "Propôs tarefa"], atualizar_tarefa: ["pen", "Propôs alteração"], registrar_risco: ["flag", "Propôs risco"], registrar_problema: ["info", "Propôs problema"], propor_solucao: ["spark", "Propôs soluções"], registrar_evento: ["pen", "Propôs registro no diário"], registrar_decisao: ["check", "Propôs decisão"], sugerir_delegacao: ["users", "Calculou a delegação"], calcular_caminho_critico: ["arrow", "Calculou o caminho crítico"], gerar_briefing: ["sun", "Montou o briefing"], gerar_relatorio: ["table", "Levantou os números"] });
const CK_QUICK = ["Quais são as minhas 3 prioridades hoje?", "Onde estou sobrecarregado e o que delegar?", "O que está atrasando em cascata?", "Que riscos você vê nas tarefas e no diário de bordo?", "Monte o briefing de hoje", "Redija um aggiornamento alla direzione"];
