/* ================================================================ Cockpit de Trabalho: riscos, problemas, diário de bordo, decisões,
   lições e reuniões. O que a pessoa registra aqui grava direto; o que o PMO sugere chega como proposta no chat. */
const CK_RST = ["aberto", "monitorando", "mitigado", "ocorrido", "fechado"], CK_IST = ["aberto", "em análise", "solução escolhida", "resolvido"];
const ckBand = s => s >= 15 ? "crit" : s >= 8 ? "warn" : "good";
const ckCods = ids => (ids || []).map(id => ckT().find(t => t.id === id)).filter(Boolean).map(t => `<button type="button" class="lnk" data-cktask="${t.id}">${esc(t.cod)}</button>${!ckOpen(t) ? "✓" : ""}`).join(" ");

/* ---------------------------------------------------------------- Riscos */
function ckRiscosV() {
  const R = ckA("ckRisk"), ab = R.filter(r => r.status !== "fechado" && (!CK.f.proj || r.projeto === CK.f.proj)), ign = ckD().cfg.rsIgn || [], sug = ckRiscosSug().filter(s => !ign.includes(s.desc)), cell = CK.rcell;
  const MZ = ckMatrizRiscos(ab); /* a mesma matriz do Dashboard (49-cockpit-agg.js) */
  const heat = `<div class="ckheat" role="table" aria-label="Probabilidade × impacto"><div class="ckhy">Probabilidade</div>${[5, 4, 3, 2, 1].map(p => `<div class="ckhl">${p}</div>${[1, 2, 3, 4, 5].map(i => { const n = (MZ[`${p}|${i}`] || []).length, s = p * i; return `<button type="button" class="ckhc ${ckBand(s)}${n ? " has" : ""}${cell === `${p}|${i}` ? " on" : ""}" data-ckrcell="${p}|${i}" data-tip="${esc(`P${p} × I${i} = ${s} · ${plural(n, "risco", "riscos")}`)}" aria-label="${esc(`Probabilidade ${p}, impacto ${i}: ${n} riscos`)}">${n || ""}</button>`; }).join("")}`).join("")}<div></div><div></div>${[1, 2, 3, 4, 5].map(i => `<div class="ckhl">${i}</div>`).join("")}<div class="ckhx">Impacto</div></div><p class="muted small ckleg"><span class="pill crit">≥ 15 alto</span> <span class="pill warn">8–14 médio</span> <span class="pill good">≤ 7 baixo</span></p>`;
  const rows = (cell ? ab.filter(r => `${r.prob}|${r.imp}` === cell) : R.filter(r => !CK.f.proj || r.projeto === CK.f.proj)).filter(r => ckDrillHas("risk", r.id)).sort((a, b) => (a.status === "fechado") - (b.status === "fechado") || ckRiscoScore(b) - ckRiscoScore(a));
  return `${ckDrillChip("riscos")}<div class="ckfil"><select data-ckf="proj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${CK.f.proj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-ckrisk="">${ic("plus")}Novo risco</button><button type="button" class="btn sm" data-act="ckask" data-v="riscos">${ic("spark")}Varredura com o PMO</button>${cell ? `<button type="button" class="lnk" data-ckrcell="">Limpar célula</button>` : ""}</div>
    <div class="g2c">${panel(`${ic("grid")}Mapa de calor <small>${plural(ab.length, "risco aberto", "riscos abertos")}</small>`, heat)}
      ${panel(`${ic("radar")}Detectados pelo motor <small>${sug.length}</small>`, sug.length ? `<ul class="cksugl">${sug.map((s, i) => `<li><div><b>${esc(s.desc)}</b><small class="muted">P${s.prob} × I${s.imp} = ${s.prob * s.imp} · fonte: ${esc(s.fonte)}${s.projeto ? ` · ${esc(ckPN(s.projeto))}` : ""}</small><small>${esc(s.mitig)}</small></div><div class="row"><button type="button" class="btn sm" data-cksugreg="${i}">${ic("plus")}Registrar</button><button type="button" class="btn sm ghost" data-cksugign="${i}">Ignorar</button></div></li>`).join("")}</ul>` : `<p class="muted">Cruzo o diário de bordo (variantes, dados faltando, entes, sottoservizi, idráulica), os marcos em risco, as tarefas críticas com júnior sem revisor e a carga. Nada novo agora.</p>`)}</div>
    ${panel(`${ic("flag")}Risk Register`, rows.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Cód.</th><th>Risco</th><th class="num">P</th><th class="num">I</th><th>Score</th><th>Gatilho</th><th>Dono</th><th>Mitigação</th><th>Tarefas</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(r => { const s = ckRiscoScore(r); return `<tr class="${r.status === "fechado" ? "muted" : ""}"><td class="mono">${esc(r.cod)}</td><td><b>${esc(r.desc)}</b>${r.projeto ? `<br><small class="muted">${esc(ckPN(r.projeto))}</small>` : ""}</td><td class="num">${r.prob}</td><td class="num">${r.imp}</td><td><span class="pill ${ckBand(s)}">${s}</span></td><td class="small">${esc(r.gatilho || "–")}</td><td>${esc(ckMN(r.dono))}</td><td class="small">${esc(r.mitig || "–")}</td><td>${ckCods(r.tarefas)}</td><td><select data-ckrst="${r.id}" aria-label="Status do risco">${CK_RST.map(x => `<option${r.status === x ? " selected" : ""}>${x}</option>`).join("")}</select></td><td class="ckrowa"><button type="button" class="vb" data-ckrisk="${r.id}" aria-label="Editar">${ic("edit")}</button><button type="button" class="vb" data-ckrtar="${r.id}" title="Tarefa de mitigação" aria-label="Criar tarefa de mitigação">${ic("plus")}</button></td></tr>`; }).join("")}</tbody></table></div>` : `<div class="empty">Nenhum risco registrado.</div>`)}`;
}
function ckRiscoForm(id, preset = {}) {
  const r = id ? ckA("ckRisk").find(x => x.id === id) : null;
  ckDlg({ titulo: r ? `${r.cod} · Risco` : "Novo risco", rec: r ? { ...r } : { prob: 3, imp: 3, status: "aberto", dono: ckEquipe().find(m => m.eu)?.id || "", projeto: CK.f.proj || "", ...preset },
    campos: [["desc", "Risco", "text", null, 1], ["projeto", "Projeto", "sel", ckProjOpts()], ["prob", "Probabilidade (1–5)", "sel", [1, 2, 3, 4, 5]], ["imp", "Impacto (1–5)", "sel", [1, 2, 3, 4, 5]], ["dono", "Dono", "sel", ckMembOpts("sem dono")], ["status", "Status", "sel", CK_RST], ["gatilho", "Gatilho (o sinal de que vai acontecer)", "text", null, 1], ["mitig", "Plano de mitigação", "area", 3]],
    salvar: x => { if (!x.desc) return "Descreva o risco."; x.prob = +x.prob; x.imp = +x.imp; if (r) Object.assign(r, x, { revisto: TODAY }); else ckA("ckRisk").push({ id: uid(), cod: ckCod("R"), ...x, criado: TODAY, tarefas: [], origem: preset.origem || { k: "manual" } }); touch("ckRisk", "ck", { label: r ? `Risco ${r.cod} editado` : "Risco registrado" }); },
    excluir: r ? () => { S.ckRisk = ckA("ckRisk").filter(x => x.id !== r.id); touch("ckRisk", { label: `Risco ${r.cod} excluído` }); } : null });
}

/* ---------------------------------------------------------------- Problemas e soluções */
function ckProblemasV() {
  const P = ckA("ckIss").filter(p => (!CK.f.proj || p.projeto === CK.f.proj) && ckDrillHas("iss", p.id)), ab = P.filter(p => p.status !== "resolvido").sort((a, b) => CK_PRIO.indexOf(a.sev) - CK_PRIO.indexOf(b.sev) || (a.criado || "").localeCompare(b.criado || "")), fe = P.filter(p => p.status === "resolvido").sort((a, b) => (b.resolvido || "").localeCompare(a.resolvido || ""));
  const card = p => { const idade = diff(TODAY, p.criado || TODAY);
    return `<article class="pn ckiss ${p.sev === "alta" ? "crit" : p.sev === "média" ? "warn" : ""}"><header><span class="ckcod">${esc(p.cod)}</span><h3>${esc(p.titulo)}</h3><span class="pill ${p.sev === "alta" ? "crit" : p.sev === "média" ? "warn" : "none"}">${esc(p.sev)}</span><span class="pill none">${esc(p.status)}</span></header>
      <p class="small muted">${esc(ckPN(p.projeto))} · aberto ${idade ? `há ${plural(idade, "dia", "dias")}` : "hoje"}${p.resp ? ` · ${esc(ckMN(p.resp))}` : ""}${p.prazo ? ` · prazo ${fmtD(p.prazo)}` : ""}${p.resolvido ? ` · resolvido em ${fmtD(p.resolvido)}` : ""}</p>${p.desc ? `<p>${esc(p.desc)}</p>` : ""}
      ${(p.solucoes || []).length ? `<div class="cksolg">${p.solucoes.map((s, i) => `<div class="cksol${p.escolhida === s.id ? " on" : ""}"><b>${i + 1}. ${esc(s.titulo)}</b>${s.desc ? `<p class="small">${esc(s.desc)}</p>` : ""}${s.pros ? `<p class="small good">+ ${esc(s.pros)}</p>` : ""}${s.contras ? `<p class="small bad">− ${esc(s.contras)}</p>` : ""}<p class="small muted">${[s.esforco !== "" && s.esforco != null && `${s.esforco} h`, s.impacto && `impacto: ${s.impacto}`, s.resp && ckMN(s.resp), s.prazo && `até ${fmtD(s.prazo)}`, s.fonte && `por ${s.fonte}`].filter(Boolean).map(esc).join(" · ")}</p>
        <div class="row wrap">${p.escolhida === s.id ? `<span class="pill good">escolhida</span><button type="button" class="btn sm primary" data-ckconv="${p.id}|${s.id}">${ic("plus")}Converter em tarefa</button>` : p.status !== "resolvido" ? `<button type="button" class="btn sm" data-ckesc="${p.id}|${s.id}">Escolher</button>` : ""}<button type="button" class="vb" data-cksoldel="${p.id}|${s.id}" aria-label="Remover solução">${ic("trash")}</button></div></div>`).join("")}</div>` : `<p class="muted small">Sem soluções ainda.</p>`}
      ${(p.tarefas || []).length ? `<p class="small">${ic("list")}Tarefas: ${ckCods(p.tarefas)}</p>` : ""}
      <div class="row wrap">${p.status !== "resolvido" ? `<button type="button" class="btn sm" data-ckisssol="${p.id}">${ic("spark")}2–3 soluções com o PMO</button><button type="button" class="btn sm ghost" data-ckaddsol="${p.id}">${ic("plus")}Solução</button><button type="button" class="btn sm ghost" data-ckissok="${p.id}">${ic("check")}Resolvido</button>` : `<button type="button" class="btn sm ghost" data-cklicde="${p.id}">${ic("book")}Registrar lição</button>`}<button type="button" class="vb" data-ckiss="${p.id}" aria-label="Editar">${ic("edit")}</button></div></article>`; };
  return `${ckDrillChip("problemas")}<div class="ckfil"><select data-ckf="proj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${CK.f.proj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-ckiss="">${ic("plus")}Novo problema</button></div>
    ${ab.length ? `<div class="ckissl">${ab.map(card).join("")}</div>` : `<div class="empty">Nenhum problema aberto.</div>`}
    ${fe.length ? `<details class="ckfeitos"${ckDrillOn("iss") ? " open" : ""}><summary>${plural(fe.length, "problema resolvido", "problemas resolvidos")}</summary><div class="ckissl">${fe.slice(0, 20).map(card).join("")}</div></details>` : ""}`;
}
function ckIssForm(id) {
  const p = id ? ckA("ckIss").find(x => x.id === id) : null;
  ckDlg({ titulo: p ? `${p.cod} · Problema` : "Novo problema", rec: p ? { ...p } : { sev: "média", status: "aberto", projeto: CK.f.proj || "" },
    campos: [["titulo", "Problema", "text", null, 1], ["projeto", "Projeto", "sel", ckProjOpts()], ["sev", "Severidade", "sel", CK_PRIO], ["status", "Status", "sel", CK_IST], ["resp", "Responsável", "sel", ckMembOpts()], ["prazo", "Prazo", "date"], ["desc", "Descrição, contexto e o que já se sabe", "area", 4]],
    salvar: x => { if (!x.titulo) return "Escreva o problema."; if (p) { Object.assign(p, x); if (x.status === "resolvido" && !p.resolvido) p.resolvido = TODAY; } else ckA("ckIss").push({ id: uid(), cod: ckCod("P"), ...x, criado: TODAY, solucoes: [], escolhida: "", tarefas: [] }); touch("ckIss", "ck", { label: p ? `Problema ${p.cod} editado` : "Problema registrado" }); },
    excluir: p ? () => { S.ckIss = ckA("ckIss").filter(x => x.id !== p.id); touch("ckIss", { label: `Problema ${p.cod} excluído` }); } : null });
}
function ckSolForm(pid) {
  const p = ckA("ckIss").find(x => x.id === pid); if (!p) return;
  ckDlg({ titulo: `${p.cod} · Nova solução`, rec: { resp: "", prazo: "" },
    campos: [["titulo", "Solução", "text", null, 1], ["desc", "Como", "area", 2], ["pros", "Prós", "text", null, 1], ["contras", "Contras", "text", null, 1], ["esforco", "Esforço (h)", "num"], ["impacto", "Impacto", "text"], ["resp", "Responsável sugerido", "sel", ckMembOpts("—")], ["prazo", "Prazo", "date"]],
    salvar: x => { if (!x.titulo) return "Dê um nome à solução."; (p.solucoes ||= []).push({ id: uid(), ...x, fonte: "você" }); if (p.status === "aberto") p.status = "em análise"; touch("ckIss", { label: `Solução para ${p.cod}` }); } });
}

/* ---------------------------------------------------------------- Diário de bordo */
const CK_TAREFA_RX = /^\s*(?:[-*•]\s*)?(fazer|preparar|enviar|mandar|revisar|rever|verificar|conferir|corrigir|atualizar|ligar|chamar|marcar|agendar|pedir|solicitar|entregar|preciso|precisamos|devo|temos que|aggiornare|inviare|preparare|verificare|controllare|chiamare|richiedere|consegnare|bisogna|serve)\b/i;
function ckExtrLocal(texto, projeto) {
  const out = []; const linhas = String(texto || "").split(/\n|(?<=[.;!?])\s+/).map(s => s.trim()).filter(s => s.length > 6);
  for (const l of linhas) { const q = ckParseQuick(l), base = { projeto: q.projeto || projeto || "", resp: q.resp, prazo: q.prazo, tags: q.tags, esforco: q.esforco };
    if (/decid|abbiamo deciso|si [eè] deciso|definimos|optamos|scelt[oa]/i.test(l)) out.push({ k: "d", sel: true, titulo: trunc(q.texto, 90), decisao: q.texto, ...base });
    else if (/risco|rischio|pode atrasar|potrebbe|pu[oò] slittare|se n[aã]o/i.test(l)) out.push({ k: "r", sel: true, desc: trunc(q.texto, 160), prob: 3, imp: 3, ...base });
    else if (/problema|errore|erro\b|non funziona|n[aã]o funciona|incongruen|manca|faltou/i.test(l)) out.push({ k: "p", sel: true, titulo: trunc(q.texto, 120), sev: "média", ...base });
    else if (CK_TAREFA_RX.test(l) || q.prazo || q.resp) out.push({ k: "t", sel: true, titulo: trunc(q.texto.replace(/^[-*•]\s*/, ""), 120), ...base }); }
  return out.slice(0, 12);
}
async function ckExtrIA(e) {
  if (!SAMPLE) { toast(AI_OFF || "A IA não está disponível nesta visualização."); return; }
  CK.xtr = { ...CK.xtr, id: e.id, loading: true }; render();
  try {
    const r = await aiCall("Cockpit · diário de bordo", () => `TAREFA: EXTRAIR DO DIÁRIO DE BORDO
Você é o PMO de um coordenador de projetos de infraestrutura viária na Itália. Leia o registro abaixo e extraia apenas o que estiver explícito ou claramente implícito: tarefas, riscos, decisões e problemas. Não invente prazos nem responsáveis: deixe vazio se não estiver no texto. Use nomes da equipe exatamente como abaixo.
EQUIPE: ${ckEquipe().map(m => m.eu ? "eu" : m.nome).join(", ")}
PROJETOS: ${ckD().projetos.map(p => p.nome).join(", ") || "nenhum"}
HOJE: ${TODAY}
REGISTRO (${e.cod}, ${fmtDY(e.data)}${e.projeto ? `, projeto ${ckPN(e.projeto)}` : ""}): ${e.texto}
Responda em JSON: {"tipo": um de ${JSON.stringify(CK_LOG_TIPOS)}, "tarefas":[{"titulo","responsavel","prazo":"AAAA-MM-DD","esforco_h","tags":[],"prioridade":"alta|média|baixa"}], "riscos":[{"descricao","probabilidade":1-5,"impacto":1-5,"gatilho","mitigacao"}], "decisoes":[{"titulo","decisao","justificativa"}], "problemas":[{"titulo","descricao","severidade"}]}`, { json: true, modelTier: "default" });
    const it = [...(r.tarefas || []).map(x => ({ k: "t", sel: true, titulo: x.titulo, resp: ckMemb(x.responsavel)?.id || "", prazo: ckDate(x.prazo), esforco: isNum(x.esforco_h) ? +x.esforco_h : "", tags: x.tags || [], prio: ckEnum(x.prioridade, CK_PRIO, "média"), projeto: e.projeto })), ...(r.riscos || []).map(x => ({ k: "r", sel: true, desc: x.descricao, prob: clamp(+x.probabilidade || 3, 1, 5), imp: clamp(+x.impacto || 3, 1, 5), gatilho: x.gatilho || "", mitig: x.mitigacao || "", projeto: e.projeto })), ...(r.decisoes || []).map(x => ({ k: "d", sel: true, titulo: x.titulo, decisao: x.decisao || x.titulo, justificativa: x.justificativa || "", projeto: e.projeto })), ...(r.problemas || []).map(x => ({ k: "p", sel: true, titulo: x.titulo, desc: x.descricao || "", sev: ckEnum(x.severidade, CK_PRIO, "média"), projeto: e.projeto }))].filter(x => x.titulo || x.desc);
    if (r.tipo && CK_LOG_TIPOS.includes(r.tipo)) e.tipo = r.tipo;
    CK.xtr = { id: e.id, itens: it, fonte: "IA" }; touch("ckLog", { noUndo: true });
  } catch (err) { CK.xtr = { ...CK.xtr, loading: false }; aiError(err); }
}
function ckXtrCriar() {
  const x = CK.xtr, e = ckA("ckLog").find(z => z.id === x?.id); if (!x) return; const made = [], keys = new Set(["ck"]);
  for (const it of x.itens.filter(i => i.sel)) {
    if (it.k === "t") { const t = ckNovaTarefa({ titulo: it.titulo, projeto: it.projeto, resp: it.resp || ckEquipe().find(m => m.eu)?.id || "", prazo: it.prazo, esforco: it.esforco, tags: it.tags, prio: it.prio || "média" }, { k: "log", id: e?.id, rot: e ? `diário ${e.cod}` : "diário" }); made.push(t.cod); keys.add("ckTar"); }
    if (it.k === "r") { const r = { id: uid(), cod: ckCod("R"), desc: it.desc, projeto: it.projeto, prob: it.prob || 3, imp: it.imp || 3, gatilho: it.gatilho || "", dono: it.resp || ckEquipe().find(m => m.eu)?.id || "", mitig: it.mitig || "", status: "aberto", criado: TODAY, tarefas: [], origem: { k: "log", id: e?.id } }; ckA("ckRisk").push(r); made.push(r.cod); keys.add("ckRisk"); }
    if (it.k === "d") { const d = { id: uid(), cod: ckCod("D"), data: e?.data || TODAY, titulo: it.titulo, decisao: it.decisao || it.titulo, justificativa: it.justificativa || "", alternativas: "", norma: "", projeto: it.projeto, quem: "eu", status: "vigente", origem: { k: "log", id: e?.id } }; ckA("ckDec").push(d); made.push(d.cod); keys.add("ckDec"); }
    if (it.k === "p") { const p = { id: uid(), cod: ckCod("P"), titulo: it.titulo, desc: it.desc || "", projeto: it.projeto, sev: it.sev || "média", status: "aberto", criado: TODAY, solucoes: [], escolhida: "", tarefas: [], origem: { k: "log", id: e?.id } }; ckA("ckIss").push(p); made.push(p.cod); keys.add("ckIss"); } }
  if (e) { e.ligados = [...(e.ligados || []), ...made]; keys.add("ckLog"); }
  CK.xtr = null; touch(...keys, { label: `Do diário: ${made.join(", ")}` }); undoToast(made.length ? `Criados: ${made.join(", ")}` : "Nada selecionado");
}
const CK_XK = { t: "Tarefa", r: "Risco", d: "Decisão", p: "Problema" };
function ckLogV() {
  const L = ckA("ckLog"), q = norm(CK.lq || ""), fil = L.filter(e => ckDrillHas("log", e.id) && (!CK.lf || e.tipo === CK.lf) && (!CK.lproj || e.projeto === CK.lproj) && (!q || norm(e.texto + " " + e.cod).includes(q))).sort((a, b) => b.data.localeCompare(a.data) || b.at - a.at);
  const by = {}; for (const e of fil.slice(0, 120)) (by[e.data] ||= []).push(e);
  const xe = CK.xtr ? L.find(z => z.id === CK.xtr.id) : null;
  const xtr = xe ? panel(`${ic("spark")}Extrair de ${esc(xe.cod)}${CK.xtr.fonte ? ` <small>${CK.xtr.fonte === "IA" ? "pela IA" : "pelo motor local"}</small>` : ""}`, CK.xtr.loading ? `<div class="thinking">${ic("spark")}Lendo o registro…</div>` : `${(CK.xtr.itens || []).length ? `<ul class="ckxtr">${CK.xtr.itens.map((it, i) => `<li><label class="chk"><input type="checkbox" data-ckxsel="${i}"${it.sel ? " checked" : ""}> <span class="pill none">${CK_XK[it.k]}</span> <b>${esc(it.titulo || it.desc)}</b></label><small class="muted">${[it.resp && ckMN(it.resp), it.prazo && fmtD(it.prazo), it.esforco && it.esforco + " h", (it.tags || []).join(", "), it.k === "r" && `P${it.prob}×I${it.imp}`].filter(Boolean).map(esc).join(" · ")}</small></li>`).join("")}</ul>` : `<p class="muted">Nada para extrair pelo motor local.</p>`}
      <div class="row wrap">${(CK.xtr.itens || []).some(i => i.sel) ? `<button type="button" class="btn sm primary" data-act="ckxcriar">${ic("check")}Criar selecionados</button>` : ""}${CK.xtr.fonte !== "IA" ? `<button type="button" class="btn sm" data-ckxia="${xe.id}"${SAMPLE && !AI_OFF ? "" : " disabled"}>${ic("spark")}Extrair com IA</button>` : ""}<button type="button" class="btn sm ghost" data-act="ckxfechar">Fechar</button></div>`) : "";
  return `${ckDrillChip("log")}${panel(`${ic("pen")}Novo registro`, `<div class="form f1"><textarea id="ck_logtxt" rows="3" placeholder="O que aconteceu: nova demanda, mudança de escopo, pedido do cliente, conversa relevante. Ex.: O RUP pediu a variante do tracciato no km 3+200; precisamos revisar o drenaggio até sexta @Ana." aria-label="Registro do diário de bordo">${esc(CK.logtxt || "")}</textarea></div>
      <div class="row wrap"><select id="ck_logproj" aria-label="Projeto"><option value="">sem projeto</option>${ckD().projetos.filter(p => p.ativo !== false).map(p => `<option value="${p.id}"${CK.logproj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select><select id="ck_logtipo" aria-label="Tipo"><option value="">tipo automático</option>${CK_LOG_TIPOS.map(t => `<option${CK.logtipo === t ? " selected" : ""}>${t}</option>`).join("")}</select><input type="date" id="ck_logdata" value="${CK.logdata || TODAY}" aria-label="Data"><button type="button" class="btn sm primary" data-act="cklogadd">${ic("check")}Registrar</button></div>`)}
    ${xtr}
    <div class="ckfil"><input type="search" id="ck_lq" placeholder="Buscar no diário" value="${esc(CK.lq || "")}" aria-label="Buscar no diário"><select id="ck_lf" aria-label="Tipo"><option value="">Todos os tipos</option>${CK_LOG_TIPOS.map(t => `<option${CK.lf === t ? " selected" : ""}>${t}</option>`).join("")}</select><select id="ck_lproj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${CK.lproj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select><span class="muted small">${plural(fil.length, "registro", "registros")}</span></div>
    ${Object.keys(by).length ? `<div class="cklog">${Object.entries(by).map(([d, es]) => `<section><h4>${relDay(d) === "hoje" ? "Hoje" : relDay(d) === "ontem" ? "Ontem" : fmtDL(d)}</h4>${es.map(e => `<article class="cklogi t-${slug(e.tipo)}"><span class="ckcod">${esc(e.cod)}</span><span class="pill none">${esc(e.tipo)}</span>${e.projeto ? `<span class="ckdot" style="--pc:${ckCor(e.projeto)}"></span><small class="muted">${esc(ckPN(e.projeto))}</small>` : ""}<p>${esc(e.texto)}</p>${(e.ligados || []).length ? `<small class="muted">gerou ${esc(e.ligados.join(", "))}</small>` : ""}<div class="row ckrowa"><button type="button" class="btn sm ghost" data-ckxtr="${e.id}">${ic("spark")}Extrair</button><button type="button" class="vb" data-cklogdel="${e.id}" aria-label="Apagar registro">${ic("trash")}</button></div></article>`).join("")}</section>`).join("")}</div>` : `<div class="empty">Nada registrado com esses filtros.</div>`}`;
}

/* ---------------------------------------------------------------- Decisões e lições */
function ckDecisoesV() {
  const q = norm(CK.dq || ""), D = ckA("ckDec").filter(d => ckDrillHas("dec", d.id) && (!CK.f.proj || d.projeto === CK.f.proj) && (!q || norm(`${d.cod} ${d.titulo} ${d.decisao} ${d.justificativa} ${d.norma}`).includes(q))).sort((a, b) => b.data.localeCompare(a.data));
  return `${ckDrillChip("decisoes")}<div class="ckfil"><input type="search" id="ck_dq" placeholder="Buscar decisão, norma ou justificativa" value="${esc(CK.dq || "")}" aria-label="Buscar decisão"><select data-ckf="proj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${CK.f.proj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-ckdec="">${ic("plus")}Nova decisão</button></div>
    ${D.length ? `<div class="ckdecl">${D.map(d => `<article class="pn ckdec${d.status !== "vigente" ? " old" : ""}"><header><span class="ckcod">${esc(d.cod)}</span><h3>${esc(d.titulo)}</h3><span class="pill ${d.status === "vigente" ? "good" : "none"}">${esc(d.status || "vigente")}</span><button type="button" class="vb" data-ckdec="${d.id}" aria-label="Editar">${ic("edit")}</button></header>
      <p class="small muted">${fmtDY(d.data)}${d.projeto ? ` · ${esc(ckPN(d.projeto))}` : ""}${d.quem ? ` · ${esc(ckMN(d.quem))}` : ""}${d.norma ? ` · ${ic("book")}${esc(d.norma)}` : ""}</p>${d.contexto ? `<p class="small"><b>Contexto:</b> ${esc(d.contexto)}</p>` : ""}<p><b>Decisão:</b> ${esc(d.decisao)}</p>${d.justificativa ? `<p class="small"><b>Por quê:</b> ${esc(d.justificativa)}</p>` : ""}${d.alternativas ? `<p class="small muted"><b>Alternativas descartadas:</b> ${esc(d.alternativas)}</p>` : ""}</article>`).join("")}</div>` : `<div class="empty">Nenhuma decisão registrada. Decisões técnicas com justificativa e norma ajudam em auditorias, verificas e revisões.</div>`}`;
}
function ckDecForm(id) {
  const d = id ? ckA("ckDec").find(x => x.id === id) : null;
  ckDlg({ titulo: d ? `${d.cod} · Decisão` : "Nova decisão", wide: true, rec: d ? { ...d } : { data: TODAY, status: "vigente", quem: ckEquipe().find(m => m.eu)?.id || "", projeto: CK.f.proj || "" },
    campos: [["titulo", "Decisão (título)", "text", null, 1], ["data", "Data", "date"], ["projeto", "Projeto", "sel", ckProjOpts()], ["quem", "Quem decidiu", "sel", ckMembOpts("—")], ["status", "Status", "sel", ["vigente", "revista", "revogada"]], ["norma", "Norma ou referência", "text"], ["contexto", "Contexto", "area", 2], ["decisao", "O que foi decidido", "area", 2], ["justificativa", "Justificativa", "area", 3], ["alternativas", "Alternativas consideradas", "area", 2]],
    salvar: x => { if (!x.titulo) return "Dê um título."; if (d) Object.assign(d, x); else ckA("ckDec").push({ id: uid(), cod: ckCod("D"), ...x }); touch("ckDec", "ck", { label: d ? `Decisão ${d.cod} editada` : "Decisão registrada" }); },
    excluir: d ? () => { S.ckDec = ckA("ckDec").filter(x => x.id !== d.id); touch("ckDec", { label: `Decisão ${d.cod} excluída` }); } : null });
}
function ckLicoesV() {
  const q = norm(CK.lcq || ""), L = ckA("ckLic").filter(l => ckDrillHas("lic", l.id) && (!q || norm(`${l.titulo} ${l.contexto} ${l.licao} ${l.aplicar} ${(l.tags || []).join(" ")}`).includes(q)) && (!CK.f.tag || (l.tags || []).includes(CK.f.tag))).sort((a, b) => b.data.localeCompare(a.data));
  const tags = [...new Set(ckA("ckLic").flatMap(l => l.tags || []))];
  return `${ckDrillChip("licoes")}<div class="ckfil"><input type="search" id="ck_lcq" placeholder="Buscar lição" value="${esc(CK.lcq || "")}" aria-label="Buscar lição"><select data-ckf="tag" aria-label="Tag"><option value="">Todas as tags</option>${[...new Set([...CK_AGENTE.tags, ...tags])].map(t => `<option${CK.f.tag === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-cklic="">${ic("plus")}Nova lição</button></div>
    ${L.length ? `<div class="ckdecl">${L.map(l => `<article class="pn ckdec"><header><span class="ckcod">${esc(l.cod)}</span><h3>${esc(l.titulo)}</h3><button type="button" class="vb" data-cklic="${l.id}" aria-label="Editar">${ic("edit")}</button></header><p class="small muted">${fmtDY(l.data)}${l.projeto ? ` · ${esc(ckPN(l.projeto))}` : ""}${(l.tags || []).length ? ` · ${l.tags.map(esc).join(", ")}` : ""}</p>${l.contexto ? `<p class="small"><b>O que aconteceu:</b> ${esc(l.contexto)}</p>` : ""}<p><b>Lição:</b> ${esc(l.licao)}</p>${l.aplicar ? `<p class="small"><b>Como aplicar no próximo projeto:</b> ${esc(l.aplicar)}</p>` : ""}</article>`).join("")}</div>` : `<div class="empty">Nenhuma lição ainda. Ao resolver um problema, registre o que fica para os próximos projetos.</div>`}`;
}
function ckLicForm(id, preset = {}) {
  const l = id ? ckA("ckLic").find(x => x.id === id) : null;
  ckDlg({ titulo: l ? `${l.cod} · Lição` : "Nova lição aprendida", rec: l ? { ...l } : { data: TODAY, tags: [], ...preset },
    campos: [["titulo", "Lição (título)", "text", null, 1], ["projeto", "Projeto", "sel", ckProjOpts()], ["data", "Data", "date"], ["tags", "Tags", "multi", CK_AGENTE.tags], ["contexto", "O que aconteceu", "area", 2], ["licao", "O que aprendemos", "area", 2], ["aplicar", "Como aplicar no próximo projeto", "area", 2]],
    salvar: x => { if (!x.titulo) return "Dê um título."; if (l) Object.assign(l, x); else ckA("ckLic").push({ id: uid(), cod: ckCod("L"), ...x, origem: preset.origem || null }); touch("ckLic", "ck", { label: l ? "Lição editada" : "Lição registrada" }); },
    excluir: l ? () => { S.ckLic = ckA("ckLic").filter(x => x.id !== l.id); touch("ckLic", { label: "Lição excluída" }); } : null });
}

/* ---------------------------------------------------------------- Reuniões e 1:1 (pauta, ata e ações que viram tarefas) */
function ckMeetForm() {
  const o = CK.meet, um = o.tipo === "1a1";
  return `<div class="ckmeetf"><div class="form f3">${um ? `<label>Com<select data-ckmt="membro">${ckEquipe().filter(m => !m.eu).map(m => `<option value="${m.id}"${o.membro === m.id ? " selected" : ""}>${esc(m.nome)}</option>`).join("")}</select></label>` : `<label class="full">Reunião<input type="text" data-ckmt="titulo" value="${esc(o.titulo || "")}" placeholder="Coordinamento BIM · Variante SP"></label>`}<label>Data<input type="date" data-ckmt="data" value="${o.data}"></label>${um ? "" : `<label>Projeto<select data-ckmt="projeto">${ckProjOpts().map(([v, l]) => `<option value="${v}"${o.projeto === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label><label class="full">Participantes<input type="text" data-ckmt="participantes" value="${esc(o.participantes || "")}" placeholder="RUP, progettisti, BIM manager…"></label>`}</div>
    <div class="form f1"><label>Pauta (uma por linha)<textarea rows="${um ? 4 : 3}" data-ckmt="pauta">${esc(o.pauta || "")}</textarea></label><label>${um ? "Notas do 1:1" : "Ata: o que foi discutido e decidido"}<textarea rows="3" data-ckmt="notas">${esc(o.notas || "")}</textarea></label></div>
    ${um ? `<div class="flbl">Feedback</div>${(o.feedback || []).map((f, i) => `<div class="ckrowf"><select data-ckmf="${i}|tipo" aria-label="Tipo de feedback">${["reconhecimento", "ajuste", "orientação"].map(x => `<option${f.tipo === x ? " selected" : ""}>${x}</option>`).join("")}</select><input type="text" data-ckmf="${i}|txt" value="${esc(f.txt || "")}" placeholder="Comportamento concreto e o efeito" aria-label="Feedback"><button type="button" class="vb" data-ckmfdel="${i}" aria-label="Remover">${ic("x")}</button></div>`).join("")}<button type="button" class="btn sm ghost" data-act="ckmfadd">${ic("plus")}Feedback</button>` : ""}
    <div class="flbl">${um ? "Compromissos" : "Ações"} (com responsável viram tarefas)</div>${(o.acoes || []).map((a, i) => `<div class="ckrowf"><input type="text" data-ckma="${i}|txt" value="${esc(a.txt || "")}" placeholder="O quê" aria-label="Ação"><select data-ckma="${i}|resp" aria-label="Responsável">${ckMembOpts("—").map(([v, l]) => `<option value="${v}"${a.resp === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select><input type="date" data-ckma="${i}|prazo" value="${a.prazo || ""}" aria-label="Prazo"><button type="button" class="vb" data-ckmadel="${i}" aria-label="Remover">${ic("x")}</button></div>`).join("")}<button type="button" class="btn sm ghost" data-act="ckmaadd">${ic("plus")}${um ? "Compromisso" : "Ação"}</button>
    <div class="row wrap ckmeetb"><button type="button" class="btn sm primary" data-act="ckmeetsave">${ic("check")}Salvar${(o.acoes || []).some(a => a.txt && a.resp) ? " e criar as tarefas" : ""}</button><button type="button" class="btn sm ghost" data-act="ckmeetx">Cancelar</button></div></div>`;
}
function ckMeetSave() {
  const o = CK.meet; if (!o) return; if (o.tipo !== "1a1" && !o.titulo?.trim()) { toast("Dê um nome à reunião."); return; }
  const x = { id: o.id || uid(), cod: o.cod || ckCod("M"), tipo: o.tipo, membro: o.membro || "", data: o.data || TODAY, titulo: o.tipo === "1a1" ? `1:1 com ${ckMN(o.membro)}` : o.titulo.trim(), projeto: o.projeto || "", participantes: o.participantes || "", pauta: o.pauta || "", notas: o.notas || "", feedback: (o.feedback || []).filter(f => f.txt?.trim()), acoes: [] };
  const made = [];
  for (const a of (o.acoes || []).filter(a => a.txt?.trim())) { const r = { id: a.id || uid(), txt: a.txt.trim(), resp: a.resp || "", prazo: a.prazo || "", tarefa: a.tarefa || "" }; if (r.resp && !r.tarefa) { const t = ckNovaTarefa({ titulo: r.txt, resp: r.resp, prazo: r.prazo, projeto: x.projeto, tags: x.tipo === "1a1" ? [] : ["Coordenação"] }, { k: "reuniao", id: x.id, rot: `${x.cod} ${x.titulo}` }); r.tarefa = t.id; made.push(t.cod); } x.acoes.push(r); }
  const L = ckA("ckMeet"), i = L.findIndex(z => z.id === x.id); if (i >= 0) L[i] = x; else L.push(x);
  CK.meet = null; touch("ckMeet", "ckTar", "ck", { label: `${x.titulo} registrada` }); undoToast(`${x.cod} salva${made.length ? `; tarefas ${made.join(", ")}` : ""}`);
}
function ckReunioesV() {
  const M = ckA("ckMeet").filter(x => (!CK.f.proj || x.projeto === CK.f.proj) && ckDrillHas("meet", x.id)).sort((a, b) => b.data.localeCompare(a.data));
  return `${ckDrillChip("reunioes")}${panel(`${ic("users")}${CK.meet ? (CK.meet.tipo === "1a1" ? "1:1" : "Reunião") : "Nova reunião"}`, CK.meet ? ckMeetForm() : `<p class="muted small">Modelo: pauta, ata e ações. Cada ação com responsável vira uma tarefa ligada à reunião.</p><div class="row wrap"><button type="button" class="btn sm primary" data-act="cknewmeet">${ic("plus")}Reunião</button>${ckEquipe().filter(m => !m.eu).map(m => `<button type="button" class="btn sm ghost" data-ck1a1="${m.id}">1:1 com ${esc(m.nome)}</button>`).join("")}</div>`)}
    ${M.length ? `<div class="ckdecl">${M.slice(0, 40).map(x => `<article class="pn ckdec"><header><span class="ckcod">${esc(x.cod)}</span><h3>${esc(x.titulo)}</h3><small class="muted">${fmtDY(x.data)}${x.projeto ? ` · ${esc(ckPN(x.projeto))}` : ""}</small><button type="button" class="vb" data-ckmeetv="${x.id}" aria-label="Editar">${ic("edit")}</button></header>${x.pauta ? `<p class="small"><b>Pauta:</b> ${esc(x.pauta.split("\n").filter(Boolean).join(" · "))}</p>` : ""}${x.notas ? `<p class="small">${esc(trunc(x.notas, 400))}</p>` : ""}${(x.feedback || []).length ? `<p class="small">${x.feedback.map(f => `<span class="pill ${f.tipo === "reconhecimento" ? "good" : f.tipo === "ajuste" ? "warn" : "none"}">${esc(f.tipo)}</span> ${esc(f.txt)}`).join("<br>")}</p>` : ""}${(x.acoes || []).length ? `<ul class="ckmini">${x.acoes.map(a => `<li>${esc(a.txt)} <small class="muted">${esc(ckMN(a.resp))}${a.prazo ? ` · ${fmtD(a.prazo)}` : ""}</small>${a.tarefa ? ` <button type="button" class="lnk" data-cktask="${a.tarefa}">${esc(ckT().find(t => t.id === a.tarefa)?.cod || "")}</button>` : ""}</li>`).join("")}</ul>` : ""}<div class="row wrap"><button type="button" class="btn sm ghost" data-ckverbale="${x.id}"${SAMPLE && !AI_OFF ? "" : " disabled"}>${ic("pen")}Verbale in italiano</button></div></article>`).join("")}</div>` : `<div class="empty">Nenhuma reunião registrada.</div>`}`;
}

/* ---------------------------------------------------------------- ações */
function ckClick2(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.ckrisk != null) { ckRiscoForm(ds.ckrisk); return true; }
  if (ds.ckrcell != null) { CK.rcell = ds.ckrcell === CK.rcell ? "" : ds.ckrcell; render(); return true; }
  if (ds.ckrtar) { const r = ckA("ckRisk").find(x => x.id === ds.ckrtar); if (r) ckTarForm(null, { titulo: `Mitigar ${r.cod}: ${trunc(r.mitig || r.desc, 80)}`, projeto: r.projeto, resp: r.dono, prio: ckRiscoScore(r) >= 15 ? "alta" : "média", impacto: ckRiscoScore(r) >= 15 ? "alto" : "médio", risco: r.id, notas: `Risco ${r.cod}: ${r.desc}`, origem: { k: "risco", id: r.id, rot: `risco ${r.cod}` } }); return true; }
  if (ds.cksugreg != null) { const s = ckRiscosSug().filter(x => !(ckD().cfg.rsIgn || []).includes(x.desc))[+ds.cksugreg]; if (s) ckRiscoForm(null, { desc: s.desc, prob: s.prob, imp: s.imp, gatilho: s.gatilho, mitig: s.mitig, projeto: s.projeto, origem: { k: "motor", fonte: s.fonte } }); return true; }
  if (ds.cksugign != null) { const s = ckRiscosSug().filter(x => !(ckD().cfg.rsIgn || []).includes(x.desc))[+ds.cksugign]; if (s) { (ckD().cfg.rsIgn ||= []).push(s.desc); touch("ck", { label: "Sugestão de risco ignorada" }); } return true; }
  if (ds.ckiss != null) { ckIssForm(ds.ckiss); return true; }
  if (ds.ckaddsol) { ckSolForm(ds.ckaddsol); return true; }
  if (ds.ckisssol) { const p = ckA("ckIss").find(x => x.id === ds.ckisssol); if (p) ckAsk(`Analise o problema ${p.cod} “${p.titulo}”. Consulte o contexto (tarefas, caminho crítico, decisões, riscos, diário de bordo, normas aplicáveis) e use propor_solucao com 2 ou 3 soluções reais, cada uma com prós, contras, esforço em horas, impacto no prazo e na qualidade, responsável sugerido e prazo. Diga qual você recomenda e por quê.`); return true; }
  if (ds.ckesc) { const [pid, sid] = ds.ckesc.split("|"), p = ckA("ckIss").find(x => x.id === pid); if (p) { p.escolhida = sid; p.status = "solução escolhida"; touch("ckIss", { label: `Solução escolhida para ${p.cod}` }); } return true; }
  if (ds.ckconv) { const [pid, sid] = ds.ckconv.split("|"), p = ckA("ckIss").find(x => x.id === pid), s = p?.solucoes.find(x => x.id === sid); if (s) ckTarForm(null, { titulo: s.titulo, resp: s.resp || ckEquipe().find(m => m.eu)?.id || "", prazo: s.prazo, esforco: s.esforco, projeto: p.projeto, prio: p.sev, impacto: p.sev === "alta" ? "alto" : "médio", notas: `Solução para ${p.cod} (${p.titulo}).${s.desc ? " " + s.desc : ""}`, problema: p.id, origem: { k: "problema", id: p.id, rot: `problema ${p.cod}` } }); return true; }
  if (ds.cksoldel) { const [pid, sid] = ds.cksoldel.split("|"), p = ckA("ckIss").find(x => x.id === pid); if (p) { p.solucoes = p.solucoes.filter(x => x.id !== sid); if (p.escolhida === sid) p.escolhida = ""; touch("ckIss", { label: "Solução removida" }); } return true; }
  if (ds.ckissok) { const p = ckA("ckIss").find(x => x.id === ds.ckissok); if (p) { p.status = "resolvido"; p.resolvido = TODAY; touch("ckIss", { label: `${p.cod} resolvido` }); toast(`${p.cod} resolvido`, { l: "Registrar lição", f: () => ckLicDe(p) }); } return true; }
  if (ds.cklicde) { const p = ckA("ckIss").find(x => x.id === ds.cklicde); if (p) ckLicDe(p); return true; }
  if (ds.ckdec != null) { ckDecForm(ds.ckdec); return true; }
  if (ds.cklic != null) { ckLicForm(ds.cklic); return true; }
  if (ds.ckxtr) { const e = ckA("ckLog").find(x => x.id === ds.ckxtr); if (e) { CK.xtr = { id: e.id, itens: ckExtrLocal(e.texto, e.projeto), fonte: "local" }; render(); } return true; }
  if (ds.ckxia) { const e = ckA("ckLog").find(x => x.id === ds.ckxia); if (e) ckExtrIA(e); return true; }
  if (ds.ckxsel != null) { const it = CK.xtr?.itens?.[+ds.ckxsel]; if (it) { it.sel = t.checked; render(); } return true; }
  if (ds.cklogdel) { if (!t.dataset.c) { t.dataset.c = 1; t.classList.add("on"); t.title = "Toque de novo para apagar"; toast("Toque de novo para apagar o registro."); return true; } S.ckLog = ckA("ckLog").filter(x => x.id !== ds.cklogdel); touch("ckLog", { label: "Registro apagado" }); undoToast("Registro apagado"); return true; }
  if (ds.ckmeetv) { const x = ckA("ckMeet").find(z => z.id === ds.ckmeetv); if (x) { CK.meet = JSON.parse(JSON.stringify(x)); if (x.tipo === "1a1") { CK.pessoa = x.membro; setHash("trabalho", "pessoa"); } else if (SUB !== "reunioes") setHash("trabalho", "reunioes"); else render(); } return true; }
  if (ds.ckmfdel != null) { CK.meet.feedback.splice(+ds.ckmfdel, 1); render(); return true; }
  if (ds.ckmadel != null) { CK.meet.acoes.splice(+ds.ckmadel, 1); render(); return true; }
  if (ds.ckverbale) { const x = ckA("ckMeet").find(z => z.id === ds.ckverbale); if (x) ckGerar("verbale", { meet: x }); return true; }
  if (!a?.startsWith("ck")) return ckClick3(t);
  if (a === "cklogadd") { const txt = ($("#ck_logtxt")?.value || "").trim(); if (!txt) { toast("Escreva o registro."); return true; } const e = { id: uid(), cod: ckCod("E"), data: $("#ck_logdata")?.value || TODAY, at: Date.now(), tipo: $("#ck_logtipo")?.value || ckLogTipo(txt), texto: txt.slice(0, 2000), projeto: $("#ck_logproj")?.value || "" }; ckA("ckLog").push(e); CK.logtxt = ""; CK.logtipo = ""; const it = ckExtrLocal(e.texto, e.projeto); CK.xtr = it.length ? { id: e.id, itens: it, fonte: "local" } : null; touch("ckLog", "ck", { label: `Diário ${e.cod}` }); toast(`${e.cod} registrado${it.length ? `; achei ${plural(it.length, "item", "itens")} para extrair` : ""}`); return true; }
  if (a === "ckxcriar") { ckXtrCriar(); return true; }
  if (a === "ckxfechar") { CK.xtr = null; render(); return true; }
  if (a === "cknewmeet") { CK.meet = { tipo: "reuniao", data: TODAY, titulo: "", projeto: CK.f.proj || "", participantes: "", pauta: "", notas: "", acoes: [{ txt: "", resp: "", prazo: "" }] }; render(); return true; }
  if (a === "ckmfadd") { (CK.meet.feedback ||= []).push({ tipo: "reconhecimento", txt: "" }); render(); return true; }
  if (a === "ckmaadd") { (CK.meet.acoes ||= []).push({ txt: "", resp: CK.meet.membro || "", prazo: "" }); render(); return true; }
  if (a === "ckmeetsave") { ckMeetSave(); return true; }
  if (a === "ckmeetx") { CK.meet = null; render(); return true; }
  return ckClick3(t);
}
function ckLicDe(p) { const s = p.solucoes?.find(x => x.id === p.escolhida); ckLicForm(null, { titulo: `Lição de ${p.cod}: ${trunc(p.titulo, 70)}`, projeto: p.projeto, contexto: [p.desc, s ? `Solução adotada: ${s.titulo}` : ""].filter(Boolean).join(" "), origem: { k: "problema", id: p.id } }); }
function ckInput2(t) {
  if (t.id === "ck_logtxt") { CK.logtxt = t.value; return true; }
  if (t.id === "ck_lq") { CK.lq = t.value; reRender(); return true; }
  if (t.id === "ck_dq") { CK.dq = t.value; reRender(); return true; }
  if (t.id === "ck_lcq") { CK.lcq = t.value; reRender(); return true; }
  if (t.dataset.ckmt && CK.meet) { CK.meet[t.dataset.ckmt] = t.value; return true; }
  if (t.dataset.ckmf && CK.meet) { const [i, k] = t.dataset.ckmf.split("|"); CK.meet.feedback[+i][k] = t.value; return true; }
  if (t.dataset.ckma && CK.meet) { const [i, k] = t.dataset.ckma.split("|"); CK.meet.acoes[+i][k] = t.value; return true; }
  return ckInput3(t);
}
function ckChange2(t) {
  if (t.id === "ck_lf") { CK.lf = t.value; render(); return true; }
  if (t.id === "ck_lproj") { CK.lproj = t.value; render(); return true; }
  if (t.id === "ck_logproj") { CK.logproj = t.value; return true; }
  if (t.id === "ck_logtipo") { CK.logtipo = t.value; return true; }
  if (t.dataset.ckrst) { const r = ckA("ckRisk").find(x => x.id === t.dataset.ckrst); if (r) { r.status = t.value; r.revisto = TODAY; touch("ckRisk", { label: `${r.cod}: ${t.value}` }); } return true; }
  if (t.dataset.ckmt && CK.meet) { CK.meet[t.dataset.ckmt] = t.value; if (t.dataset.ckmt === "membro") render(); return true; }
  if (t.dataset.ckmf && CK.meet) { const [i, k] = t.dataset.ckmf.split("|"); CK.meet.feedback[+i][k] = t.value; return true; }
  if (t.dataset.ckma && CK.meet) { const [i, k] = t.dataset.ckma.split("|"); CK.meet.acoes[+i][k] = t.value; if (k === "resp") render(); return true; }
  return ckChange3(t);
}
