
/* ================================================================ render */
let RELAYOUT = false;
function greet() { const h = new Date().getHours(); return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }
function measureGrid() { const m = $("#main"); if (!m) return; const cs = getComputedStyle(m), w = m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); REPW = Math.round(w - (railOn() ? 316 : 0)); }
function render() {
  const R = calcAt(REF); VIS = {};
  if (!RELAYOUT) measureGrid();
  const nm = S.cfg.nome ? esc(S.cfg.nome.split(" ")[0]) : "";
  const pages = {
    visao: () => [nm ? `Olá, ${nm}` : "Visão geral", `Como a vida está indo em ${mlabel(REF)}${R.corte ? ` · dados até ${fmtD(R.corte)}` : ""}`, rOverview],
    painel: () => ["Painel do dia", "Os essenciais do dia em um minuto, por texto ou voz. Você revisa antes de ir para as abas.", pPainel],
    rotina: () => ["Rotina", "Planeje e registre o dia em blocos de 30 minutos", pRotina],
    hoje: () => [`${greet()}${nm ? ", " + nm : ""}`, fmtDL(TODAY)[0].toUpperCase() + fmtDL(TODAY).slice(1), pHoje2],
    diario: () => ["Diário", "Escreva, marque pessoas e temas, registre dados e veja o que se repete", pDiario],
    psi: () => ["Psicologia", { inicio: "O trabalho terapêutico, ligado à sua jornada", sessoes: "O que acontece nas sessões", processos: "Os temas que você trabalha ao longo do tempo", entre: "O trabalho entre as sessões", padroes: "O que se repete, e o que ajuda", terapeuta: "Um apoio entre sessões que muda de forma conforme o que você precisa" }[SUB] || "", pPsique],
    trabalho: () => ["Cockpit de Trabalho", { dashboard: "Tendências, comparações e a visão por pessoa e por projeto no período", hoje: "Prioridades, alertas e o briefing do dia", semana: "Prazos da semana, capacidade e a weekly review", mes: "Prazos, marcos e feriados do mês", kanban: "Arraste entre as colunas para mudar o status", lista: "Todas as tarefas, em ordem de prioridade sugerida", gantt: "Caminho crítico, folgas e atrasos em cascata, em dias úteis", riscos: "Risk Register: probabilidade × impacto, gatilho, dono e mitigação", problemas: "Issue Log: soluções com prós, contras, esforço e impacto", equipe: "Carga, desenvolvimento e delegação", pessoa: "Tarefas, PDI, 1:1 e feedback", log: "O que aconteceu, em ordem: eventos, demandas, escopo, cliente, conversas", decisoes: "Decision Log: o que foi decidido e por quê", bim: "Modelos federados, clash, consegne IFC, pGI/BEP e LOIN", entregas: "Elenco elaborati: revisões e aprovação", reunioes: "Pauta, ata e ações que viram tarefas", relatorios: "Briefing, weekly review, relatório mensal e comunicações em italiano", licoes: "Lições aprendidas para reusar entre projetos", contexto: "Seu perfil, a equipe, os projetos e o agente" }[SUB] || "", pTrabalho],
    admin: () => ["Administração Pessoal", "O Conselho de Administração da sua vida: os mentores reunidos, conduzidos pelo Intermediador, e você decide", pAdmin],
    mentores: () => ["Mentores", "Um agente para cada área, com memória do que vocês combinaram", pMentores],
    mentor: () => [esc(MENTOR_DEF[SUB].nome), esc(MENTOR_DEF[SUB].papel[0].toUpperCase() + MENTOR_DEF[SUB].papel.slice(1)), pMentor],
    cruz: () => ["Cruzamentos", "Descubra o que anda junto na sua vida: escolha duas métricas ou deixe o Atlas procurar", rCruz],
    fin: () => ["Finanças", SUB === "futuro" ? "Reserva, TFR e previdência" : SUB === "vida" ? "Contas dos dois países, somadas em euro" : mlabel(REF), { rel: rFin, lanc: pLanc, orc: pOrc, futuro: pFuturo, vida: pVida, projetos: pFinProjetos, diario: pSetorDiario }[SUB]],
    saude: () => ["Saúde", mlabel(REF), { rel: rSaude, checkin: pCheckin, diario: pSetorDiario }[SUB]],
    hab: () => ["Hábitos", mlabel(REF), { rel: rHab, marcar: pHabMarcar, diario: pSetorDiario }[SUB]],
    metas: () => ["Metas & tarefas", mlabel(REF), { rel: rMetas, lista: pMetasLista, tarefas: pTarefas, diario: pSetorDiario }[SUB]],
    pessoas: () => ["Relações", mlabel(REF), { rel: rRel, lista: pPessoas, contatos: pContatos, diario: pSetorDiario }[SUB]],
    cresc: () => ["Crescimento", mlabel(REF), { rel: rCresc, aprend: pAprend, lazer: pLazer, diario: pSetorDiario }[SUB]],
    casa: () => ["Casa & docs", { painel: "O que vence, o que limpar e o que comprar", limpeza: "Rotinas do leve ao pesado", compras: "A lista da semana, por seção do mercado", contas: "Calendário de vencimentos", docs: "Contratos, contas anuais e onde estão guardados", diario: "Diário da casa" }[SUB] || "", SUB === "diario" ? pSetorDiario : pCasa2],
    idiomas: () => ["Idiomas", "Inglês primeiro, italiano em seguida, no ritmo que a sua semana permite", pIdiomas],
    mapa: () => ["Mapa do Atlas", "Cada aba, o problema que ela resolve e para onde os dados vão", pMapa], roda: () => ["Roda da Vida", SUB === "diario" ? "Um diário para cada área da vida" : "Percepção, alvos e revisão mensal", SUB === "diario" ? pSetorDiario : pRoda],
    dados: () => ["Dados", "Edite qualquer registro como numa planilha, filtre, altere em massa, importe e exporte", pDados],
    integ: () => ["Integrações", "Notion, agenda, Apple Health, Google Fit e bancos, nos dois sentidos onde dá", pInteg],
    ajustes: () => ["Ajustes", "Metas, áreas, listas, mentores e aparência", pAjustes],
    lazer: () => ["Lazer", { inicio: "Oito temas, cada um com um mentor que conversa no seu nível", existencial: "Os quatro mentores da Jornada, dentro do Lazer" }[SUB] || (lzDiv(SUB)?.mid ? `${esc(lzDiv(SUB).nome)} com ${esc(MENTOR_DEF[lzDiv(SUB).mid].nome)}` : ""), pLazerHub],
    carreira: () => ["Carreira", { panorama: "Onde você está, aonde quer chegar, como e com o quê", avaliacao: "O retrato de hoje: perfil, competências, pontos fortes e gaps", portfolio: "Os projetos que provam o que você sabe", decisoes: "Cenários comparados com os seus critérios e pesos", mercado: "Referências de mercado e o dossiê para negociar", objetivos: "O norte, as trilhas e os objetivos com prazo", geotecnia: "Uma frente nova, no seu ritmo", plano: "Do gap à ação, com marcos verificáveis", biblioteca: "Normas, cursos, livros e ferramentas por tópico", caderno: "Caderno técnico de engenharia", rede: "Contatos, cadência e oportunidades" }[SUB] || "", pCarreiraHub],
    jornada: () => ["Jornada existencial", { inicio: "Quatro pilares, cinco mentores e a bússola no centro", jardim: "Saúde espiritual: o jardim interior que cresce com a sua jornada", confluencias: "Onde os quatro caminhos se encontram", praticas: "Programas guiados, sessões de prática e o que elas mudam", bussola: "Bússola moral: valores, princípios e perguntas das cinco tradições", exame: "O exame da noite: valores, vigilância e serviço", decidir: "Oito perguntas antes de decidir", caminhos: "Os seus desafios, um por um", navegante: "O Navegante, mentor da Bússola moral" }[SUB] || esc(J_PIL[J_SUB2P[SUB]]?.lema || ""), pJornada],
    semana: () => ["Fechamento da semana", `Semana de ${wkLabel(fsWk())}`, pSemana],
    radar: () => ["Radar", "Alertas antes que aconteçam, com evidência do seu histórico e conferência depois", pRadar],
    exp: () => ["Experimentos", "Teste uma mudança e meça o efeito em você", pExp],
    capitulos: () => ["Capítulos", SUB === "livro" ? "O livro do seu ano, em PDF" : "As fases da sua vida, detectadas nos seus dados", pCapitulos],
    dupla: () => ["A dois", "Diário, orçamento e metas em comum com quem você escolher", pDupla],
    privacidade: () => ["Privacidade", "Cofre com senha, setores fora da IA e o registro do que a IA leu", pPrivacidade],
  };
  const [title, sub, fn] = (pages[PAGE] || pages.visao)();
  let body; try { body = fn(R); } catch (err) { console.error(err); body = `<div class="emptyb">${ic("info")}<b>Esta página encontrou um problema ao desenhar.</b><span>${esc(String(err?.message || err))}</span><a class="btn sm" href="#visao">Voltar para a visão geral</a></div>`; }
  const vazio = LOADED && !IS_EXAMPLE && !["lanc", "diario", "metas", "tarefas", "habitos", "pessoas", "saude"].some(k => Object.keys(S[k] || {}).length);
  const banner = EX_MODE ? exBanner() : vazio ? `<div class="banner">${ic("info")}<span><b>Atlas vazio.</b> Comece registrando, importe o backup do Atlas 2 em Dados → Importar, ou ligue o <b>Exemplo</b> no topo para ver tudo preenchido com dados fictícios (nada é salvo).</span></div>` : IS_EXAMPLE && LOADED ? `<div class="banner">${ic("info")}<span><b>Dados de exemplo.</b> São fictícios, para você ver tudo funcionando. Ao editar qualquer coisa eles viram seus e passam a ser salvos.</span><button type="button" class="btn sm primary" id="startEmpty">Começar do zero</button></div>` : "";
  const ae = document.activeElement, focusId = ae?.id, selS = ae?.selectionStart, selE = ae?.selectionEnd, scT = ae?.scrollTop, chat = $("#mchat"), chatTop = chat ? chat.scrollTop : null, chatBottom = chat ? chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40 : true;
  $("#nav").innerHTML = navHTML(R);
  $("#main").innerHTML = `${topbar(R, title, sub)}${banner}${tabHead()}${subtabs()}${csStrip()}<div class="page p-${PAGE}${SUB ? " s-" + SUB : ""}">${body}</div>${isReport() ? reportTabs() : ""}`;
  $("#drawerwrap").innerHTML = drawerHTML(R);
  if (PAGE !== "trabalho") { document.body.classList.remove("ckside-on", "ckdmeet-on"); if (CK.dash) CK.dash.reuniao = false; }
  document.body.classList.toggle("navopen", NAVOPEN); document.body.classList.toggle("drawer-on", !!DRAWER);
  saveStatus();
  if (focusId) { const el = document.getElementById(focusId); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (selS != null) el.setSelectionRange(selS, selE ?? selS); } catch {} if (scT) el.scrollTop = scT; } }
  const nc = $("#mchat"); if (nc) nc.scrollTop = chatBottom || chatTop == null ? nc.scrollHeight : chatTop;
  if (DIA.focus) { const el = $("#e_" + DIA.focus); if (el) { el.scrollIntoView({ block: "center" }); DIA.focus = null; } }
  if (!RELAYOUT) { const vg = $(".vg"); if (vg && Math.abs(vg.clientWidth - REPW) > 8) { REPW = vg.clientWidth; RELAYOUT = true; try { render(); } finally { RELAYOUT = false; } } }
  if (!RELAYOUT) pack();
  csAfterRender();
  secAfterRender();
}

/* ================================================================ empacotamento: nenhum buraco entre os cartões
   Grades de cartões viram "alvenaria": cada cartão ocupa linhas de 4px conforme a altura real, a grade preenche
   os vãos (dense) e o último cartão de cada coluna estica até a base. Grades de itens iguais dividem a última linha. */
const PACK_SEL = ".vg,.g2c,.g3c", FILL_SEL = ".mgrid,.jmgrid,.pgrid,.sjels,.sjside,.hgrid2,.xgrid,.krow,.minis", PACK_ROW = 4;
let PACK_RO = null, PACK_RAF = 0;
const PACK_H = new WeakMap(), PACK_W = new WeakMap();
/* só listas longas por natureza (agenda, listas, tabelas compridas) podem ganhar rolagem; gráficos e placares nunca */
const listy = k => k.getBoundingClientRect().height > 520 && (!!k.querySelector(".agenda,.list,.bls") || k.querySelectorAll("tbody tr").length > 14);
function packGrid(g) {
  const cs = getComputedStyle(g), cols = cs.gridTemplateColumns.split(" ").length, gap = parseFloat(cs.columnGap) || 16;
  const kids = [...g.children].filter(k => getComputedStyle(k).display !== "none");
  g.classList.add("packed");
  for (const k of kids) { k.style.gridRowEnd = ""; k.style.height = ""; k.style.minHeight = ""; k.style.maxHeight = ""; k.classList.remove("grown", "capped"); }
  const span = () => kids.forEach(k => { k.style.gridRowEnd = `span ${Math.max(1, Math.ceil((k.getBoundingClientRect().height + gap) / PACK_ROW))}`; });
  const gaps = () => { const rs = kids.map(k => k.getBoundingClientRect()), bottom = Math.max(...rs.map(r => r.bottom));
    return { rs, list: rs.map((r, i) => { let to = bottom; rs.forEach((o, j) => { if (j !== i && o.top >= r.bottom - 1 && o.left < r.right - 2 && o.right > r.left + 2) to = Math.min(to, o.top - gap); }); return to; }) }; };
  span();
  if (cols > 1 && kids.length > 1) {
    /* vão grande ao lado de uma lista longa: a lista ganha rolagem interna em vez de o cartão curto inchar */
    for (let it = 0; it < 3; it++) {
      const { rs, list } = gaps(); let changed = false;
      rs.forEach((r, i) => { const ext = list[i] - r.bottom; if (ext <= Math.max(140, r.height * .45)) return;
        rs.forEach((o, j) => { if (j === i || kids[j].classList.contains("capped") || kids[i].classList.contains("capped")) return;
          const side = o.right <= r.left + 2 || o.left >= r.right - 2, spans = o.top < r.bottom && o.bottom >= list[i] - PACK_ROW - 4;
          if (side && spans && listy(kids[j])) { const h = Math.max(360, Math.round(o.height - ext)); if (h < o.height - 40) { kids[j].style.maxHeight = h + "px"; kids[j].classList.add("capped"); changed = true; } } }); });
      if (!changed) break; span();
    }
    const { rs, list } = gaps();
    rs.forEach((r, i) => { if (list[i] - r.bottom > 2) { /* altura mínima, não fixa: se o conteúdo crescer depois (prévia, formulário), o cartão cresce e a grade se refaz */
      /* cartão com rolagem interna (lista longa) fica com altura fixa: o que passar rola por dentro em vez de invadir o vizinho */
      const h = Math.round(list[i] - r.top) + "px"; if (kids[i].classList.contains("capped")) { kids[i].style.maxHeight = ""; kids[i].style.height = h; } else kids[i].style.minHeight = h; kids[i].classList.add("grown"); } });
  }
  for (const k of kids) { PACK_H.set(k, k.getBoundingClientRect().height); PACK_RO?.observe(k); }
}
function fillRow(g) {
  const kids = [...g.children].filter(k => getComputedStyle(k).display !== "none");
  for (const k of kids) k.style.gridColumn = "";
  const cs = getComputedStyle(g), tr = cs.gridTemplateColumns.split(" ").map(parseFloat), cols = tr.length, gap = parseFloat(cs.columnGap) || 0;
  if (cols < 2 || kids.length < 2) return;
  const rs = kids.map(k => k.getBoundingClientRect()), top = Math.max(...rs.map(r => r.top)), tol = Math.min(...rs.map(r => r.height)) / 2, last = kids.filter((k, i) => top - rs[i].top < tol);
  const spans = last.map(k => Math.max(1, Math.round((k.getBoundingClientRect().width + gap) / (tr[0] + gap)))), free = cols - sum(spans);
  if (free <= 0 || free >= cols) return;
  last.forEach((k, i) => { k.style.gridColumn = `span ${spans[i] + Math.floor(free / last.length) + (i < free % last.length ? 1 : 0)}`; });
}
function pack() {
  const m = $("#main"); if (!m) return;
  PACK_RO?.disconnect();
  if (!PACK_RO && "ResizeObserver" in window) PACK_RO = new ResizeObserver(ents => {
    if (ents.some(e => { const r = e.target.getBoundingClientRect(), w = PACK_W.get(e.target); return w != null ? Math.abs(r.width - w) > 1 : Math.abs(r.height - (PACK_H.get(e.target) ?? -9)) > 1; })) { cancelAnimationFrame(PACK_RAF); PACK_RAF = requestAnimationFrame(pack); }
  });
  for (const g of m.querySelectorAll(FILL_SEL)) { fillRow(g); PACK_W.set(g, g.getBoundingClientRect().width); PACK_RO?.observe(g); }
  for (const g of [...m.querySelectorAll(PACK_SEL)].reverse()) packGrid(g);
}

/* ================================================================ eventos */
const CLICK_SEL = "[data-rtb],button,input[type=checkbox],a[data-act],[data-act],[data-edit],[data-ent],[data-xf],[data-ref],[data-go],[data-cx],[data-dday],[data-ckday],[data-add],[data-mark],[data-done],[data-goentry],[data-newp],[data-pvdet],[data-chsel],[data-bmv],[data-cktask],[data-ckmemb],[data-ckproj],[data-ckmarco],[data-ckpessoa],[data-ckrisk],[data-ckiss],[data-ckdec],[data-cklic],[data-ckbim],[data-ckel],[data-ckmeetv],[data-ckrel],[data-ckdrill],[data-ckdper],[data-ckdnav],[data-ckdsec],[data-ckwmv],[data-ckwhide]";
document.addEventListener("click", e => {
  const t = e.target.closest(CLICK_SEL); if (!t || t.disabled) return;
  if (t.tagName === "A" && t.getAttribute("href")?.startsWith("#") && !t.dataset.act) { NAVOPEN = false; DRAWER = null; return; }
  if (t.closest("#pal")) { if (t.dataset.pal != null) palRun(+t.dataset.pal); return; }
  if (t.dataset.aci != null) { acPick(+t.dataset.aci); return; }
  if (ckClick(t) || secClick(t) || csClick(t) || filClick(t) || psiClick(t) || rtClick(t) || pd3Click(t) || pdClick(t) || gcClick(t) || hjClick(t) || casaClick(t) || futClick(t) || idiClick(t) || cr2Click(t) || capClick(t) || jmClick(t) || jdClick(t) || bmClick(t) || jClick(t) || crClick(t) || crClick2(t) || lzClick(t) || pjClick(t) || privClick(t) || expClick(t) || radarClick(t) || weekClick(t) || chapClick(t) || semClick(t) || duoClick(t) || integ2Click(t) || sjClick(t) || diaryClick(t) || mentorClick(t) || reportClick(t) || dataClick(t) || integClick(t) || settingsClick(t)) return;
  const ds = t.dataset, a = ds.act;
  if (a === "menu") { NAVOPEN = !NAVOPEN; document.body.classList.toggle("navopen", NAVOPEN); return; }
  if (a === "pal") { NAVOPEN = false; document.body.classList.remove("navopen"); openPalette(); return; }
  if (a === "mprev" || a === "mnext") { REF = addMonth(REF, a === "mprev" ? -1 : 1); render(); return; }
  if (a === "mnow") { REF = mkey(TODAY); render(); return; }
  if (a === "undo") { undo(); return; } if (a === "redo") { redo(); return; }
  if (a === "closedrawer") { DRAWER = null; render(); return; }
  if (a === "closefocus") { $("#focusdlg").close(); return; }
  if (a === "qtar") { const i = t.closest(".pn,.tcol")?.querySelector(".quick input") || $("#qt_in") || $("#hj_tar"); if (i) { quickTask(i.value); i.value = ""; } return; }
  if (a === "qlanc") { const i = $("#ql_in"); if (i) { quickLanc(i.value); i.value = ""; } return; }
  if (a === "extog") { exToggle(); return; }
  if ((t.id === "startEmpty" || t.id === "wipe") && EX_MODE) { toast("Desligue o modo exemplo antes."); return; }
  if (t.id === "startEmpty" || t.id === "wipe") { if (t.id === "wipe" && !t.dataset.c) { t.dataset.c = 1; t.textContent = "Confirmar: apagar tudo"; return; } S = EMPTY(); VER++; IS_EXAMPLE = false; applyLists(); KEYS.forEach(k => dirty.add(k)); snapAll(); UNDO.length = 0; REDO.length = 0; flushSoon(0); render(); toast("Tudo vazio. Comece por Ajustes, Metas e o Diário."); return; }
  if (t.id === "loadEx") { exOn(); return; }
  if (ds.per) { PER = +ds.per; render(); return; }
  if (ds.xf) { const i = ds.xf.indexOf("|"), k = ds.xf.slice(0, i), v = ds.xf.slice(i + 1), f = xf(); f[k] = f[k] === v ? null : v; render(); return; }
  if (ds.xfclear) { if (ds.xfclear === "*") XFP[PAGE + "." + (SUB || "")] = {}; else xf()[ds.xfclear] = null; render(); return; }
  if (ds.ref) { REF = ds.ref; render(); toast(`Analisando ${mlabel(REF)}`); return; }
  if (ds.go) { const [p, s] = ds.go.split("."); setHash(p, s); return; }
  if (ds.add) { openForm(ds.add, null, Object.fromEntries([["meta", ds.presetMeta], ["area", ds.presetArea], ["projeto", ds.presetProj], ["item", ds.presetItem]].filter(x => x[1] != null))); return; }
  if (ds.edit) { if (ds.edit === "diario") { openComposer(ds.id); return; } openForm(ds.edit, ds.id); return; }
  if (ds.ent) { const i = ds.ent.indexOf("|"); openEnt(ds.ent.slice(0, i), ds.ent.slice(i + 1)); return; }
  if (ds.mark) { const k = ds.mark; if (S.marks[k]) delete S.marks[k]; else S.marks[k] = 1; touch("marks", { label: "Hábito marcado" }); return; }
  if (ds.done) { S.rotinas = S.rotinas.map(r => r.id === ds.done ? { ...r, ultima: TODAY } : r); touch("rotinas", { label: "Rotina feita" }); undoToast("Rotina registrada hoje"); return; }
  if (ds.sd) { const d = ds.day || CHECKIN || TODAY, cur = S.saude[d] || {}; S.saude[d] = { ...cur, [ds.sd]: cur[ds.sd] === +ds.v ? null : +ds.v }; touch("saude", { label: "Check-in" }); return; }
  if (ds.ckday) { CHECKIN = ds.ckday === TODAY ? null : ds.ckday; if (PAGE !== "saude" || SUB !== "checkin") setHash("saude", "checkin"); else { render(); window.scrollTo({ top: 0, behavior: "smooth" }); } return; }
  if (ds.vtab) { TABLEV.has(ds.vtab) ? TABLEV.delete(ds.vtab) : TABLEV.add(ds.vtab); render(); return; }
  if (ds.vcsv) { exportVis(ds.vcsv); return; }
  if (ds.vfocus) { openFocus(ds.vfocus); return; }
  if (ds.tfs) { TF.status = ds.tfs; render(); return; }
  if (ds.lft != null) { LF.tipo = ds.lft; render(); return; }
});
document.addEventListener("keydown", e => {
  const tg = e.target, typing = tg.matches?.("input,textarea,select,[contenteditable]");
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#pal").open ? $("#pal").close() : openPalette(); return; }
  if ($("#pal").open && tg.id === "palq") {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); PALSEL = clamp(PALSEL + (e.key === "ArrowDown" ? 1 : -1), 0, Math.max(0, PALITEMS.length - 1)); palUpdate(); return; }
    if (e.key === "Enter") { e.preventDefault(); palRun(PALSEL); return; }
  }
  if (tg.id === "dz_texto" && AC.open) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); AC.sel = clamp(AC.sel + (e.key === "ArrowDown" ? 1 : -1), 0, AC.items.length - 1); acUpdate(tg); return; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); acPick(AC.sel); return; }
    if (e.key === "Escape") { e.preventDefault(); AC.open = false; $("#ac").hidden = true; return; }
  }
  if (tg.id === "dz_texto" && (e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); saveDraft(); return; }
  if ((tg.id === "cap_txt" || tg.id === "hj_cap") && (e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); capRefresh({ keepAI: CAP.src === "ia", keepDate: true }); capSave(); return; }
  if (tg.id === "pd_txt" && (e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); pdParse(); $('[data-act="pdrev"],[data-act="pdsave"]')?.click(); return; }
  if (tg.id === "cp_in" && e.key === "Enter") { e.preventDefault(); cpAdd(tg.value); return; }
  if (tg.id === "sem_q" && e.key === "Enter") { e.preventDefault(); semAsk(tg.value); return; }
  if (tg.id === "cf_p" && e.key === "Enter") { e.preventDefault(); $('[data-act="cfopen"]')?.click(); return; }
  if (tg.id === "m_in" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); askMentor(tg.closest("[data-mid]")?.dataset.mid || SUB, tg.value); return; }
  if (tg.id?.startsWith("mq_") && e.key === "Enter") { e.preventDefault(); $(`[data-mquick="${tg.id.slice(3)}"]`)?.click(); return; }
  if (tg.id === "memnew" && e.key === "Enter") { e.preventDefault(); $('[data-act="memadd"]')?.click(); return; }
  if ((tg.id === "qt_in" || tg.id === "hj_tar") && e.key === "Enter") { e.preventDefault(); quickTask(tg.value); tg.value = ""; return; }
  if (tg.id === "ql_in" && e.key === "Enter") { e.preventDefault(); quickLanc(tg.value); tg.value = ""; return; }
  if (tg.id === "nt_q" && e.key === "Enter") { e.preventDefault(); $('[data-act="ntsearch"]')?.click(); return; }
  if (tg.id === "nt_pq" && e.key === "Enter") { e.preventDefault(); $('[data-act="ntpaisearch"]')?.click(); return; }
  if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
  if (e.key === "Escape") { if (AC.open) { AC.open = false; $("#ac").hidden = true; return; } if (DRAWER) { DRAWER = null; render(); return; } if (NAVOPEN) { NAVOPEN = false; document.body.classList.remove("navopen"); return; } }
  if ((e.key === "Enter" || e.key === " ") && tg.matches?.('tr.click,[role="button"],[role="link"],.kc.click')) { e.preventDefault(); tg.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});
const reRender = debounce(() => render(), 220);
document.addEventListener("input", e => {
  const t = e.target;
  if (ckInput(t) || secInput(t) || csInput(t) || filInput(t) || psiInput(t) || rtInput(t) || pdInput(t) || cr2Input(t) || diaryInput(t) || capInput(t) || weekInput(t) || duoInput(t) || jmInput(t) || jdInput(t) || bmInput(t) || jInput(t) || crInput(t) || lzInput(t) || pjInput(t)) return;
  if (t.id === "palq") { PALSEL = 0; palUpdate(); return; }
  if (t.id === "dq") { DIA.q = t.value; reRender(); return; }
  if (t.id === "sj_q") { SJ.q = t.value; reRender(); return; }
  if (t.id === "tf_q") { TF.q = t.value; reRender(); return; }
  if (t.id === "lf_q") { LF.q = t.value; reRender(); return; }
  if (t.id === "dg_q") { DG.q = t.value; DG.page = 0; reRender(); return; }
  if (t.id === "m_in") { MST.input[t.closest("[data-mid]")?.dataset.mid || SUB] = t.value; return; }
  if (t.id === "memnew") { MST.memNew = t.value; return; }
  if (t.id === "nt_q") { NT.q = t.value; return; } if (t.id === "nt_pq") { NT.pq = t.value; return; }
  if (t.id === "ql_in" || t.id === "qt_in" || t.id === "hj_tar") { quickHint(t.id, t.value); return; }
  if (t.dataset.roda != null) { S.roda[REF] = { ...(S.roda[REF] || {}), [t.dataset.roda]: +t.value }; const o = t.parentElement.querySelector("output"); if (o) o.textContent = t.value; }
});
document.addEventListener("change", e => {
  const t = e.target, v = t.value;
  if (ckChange(t) || secChange(t) || csChange(t) || filChange(t) || psiChange(t) || rtChange(t) || pdChange(t) || hjChange(t) || futChange(t) || idiChange(t) || capChange(t) || jdChange(t) || bmChange(t) || jChange(t) || crChange(t) || crChange2(t) || lzChange(t) || pjChange(t) || privChange(t) || weekChange(t) || chapChange(t) || semChange(t) || duoChange(t) || integ2Change(t) || reportChange(t) || dataChange(t) || importChange(t) || integChange(t) || settingsChange(t)) return;
  if (t.dataset.roda != null) touch("roda", { label: "Nota da Roda" });
  else if (t.dataset.prio != null) { S.prio[+t.dataset.prio] = v; touch("prio", { label: "Prioridade" }); }
  else if (t.dataset.alvo != null) { S.alvo[t.dataset.alvo] = v === "" ? null : +v; touch("alvo", { label: "Alvo da área" }); }
  else if (t.dataset.rev) { S.revisao[REF] = { ...(S.revisao[REF] || {}), [t.dataset.rev]: t.dataset.rev === "nota" ? (v === "" ? null : +v) : v }; touch("revisao", { label: "Revisão mensal" }); }
  else if (t.dataset.orc) { if (v === "") delete S.orc[t.dataset.orc]; else S.orc[t.dataset.orc] = +v; touch("orc", { label: "Orçamento" }); }
  else if (t.dataset.patr) { S.patr[REF] = { ...(S.patr[REF] || {}), [t.dataset.patr]: v === "" ? "" : +v }; touch("patr", { label: "Patrimônio" }); }
  else if (t.dataset.cfg) { S.cfg[t.dataset.cfg] = t.type === "checkbox" ? t.checked : t.type === "number" ? (v === "" ? "" : +v) : v; touch("cfg", { label: "Ajuste" }); }
  else if (t.dataset.sdi) { const d = t.dataset.day || CHECKIN || TODAY, val = t.type === "number" ? (v === "" ? null : +v) : v; S.saude[d] = { ...(S.saude[d] || {}), [t.dataset.sdi]: val }; touch("saude", { label: "Check-in" }); }
  else if (t.id === "ck_day") { CHECKIN = v && v !== TODAY ? v : null; render(); }
  else if (t.id === "cmpSel") { CMP = v; render(); }
  else if (t.id === "areaSel") { xf().area = v || null; render(); }
  else if (t.id === "dz_modelo") { const tp = TEMPLATES[v]; if (tp && DIA.draft) { DIA.draft.texto = (DIA.draft.texto ? DIA.draft.texto.replace(/\s+$/, "") + "\n\n" : "") + tp[1]; if (!DIA.draft.titulo && v !== "livre") DIA.draft.titulo = tp[0]; storeDraft(); render(); setTimeout(() => { const ta = $("#dz_texto"); if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); } }, 30); } }
  else if (t.id === "tf_area") { TF.area = v; render(); } else if (t.id === "tf_proj") { TF.proj = v; render(); } else if (t.id === "lf_cat") { LF.cat = v; render(); }
});
document.addEventListener("focusout", e => { if (e.target.id === "dz_texto") setTimeout(() => { if (document.activeElement?.id !== "dz_texto" && !document.activeElement?.closest?.("#ac")) { AC.open = false; const b = $("#ac"); if (b) b.hidden = true; } }, 150); });
/* dicas: mouse, teclado e toque */
function showTip(el, x, y) { const tp = $("#tip"); tp.textContent = el.dataset.tip; tp.hidden = false; const w = tp.offsetWidth, h = tp.offsetHeight; tp.style.left = Math.max(8, Math.min(x + 14, innerWidth - w - 8)) + "px"; tp.style.top = (y + 18 + h > innerHeight ? y - h - 12 : y + 18) + "px"; }
document.addEventListener("mouseover", e => { const el = e.target.closest?.("[data-tip]"); if (!el) { $("#tip").hidden = true; return; } showTip(el, e.clientX, e.clientY); });
document.addEventListener("mousemove", e => { const tp = $("#tip"); if (tp.hidden) return; const el = e.target.closest?.("[data-tip]"); if (el) showTip(el, e.clientX, e.clientY); });
document.addEventListener("focusin", e => { const el = e.target.closest?.("[data-tip]"); if (el) { const r = el.getBoundingClientRect(); showTip(el, r.left, r.bottom - 10); } });
document.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; const el = e.target.closest?.("[data-tip]"); if (!el) { $("#tip").hidden = true; return; } showTip(el, e.clientX, e.clientY); clearTimeout(showTip.t); showTip.t = setTimeout(() => { $("#tip").hidden = true; }, 2600); });
document.addEventListener("scroll", () => { $("#tip").hidden = true; }, { passive: true, capture: true });
window.addEventListener("hashchange", route);
window.addEventListener("resize", debounce(() => { const old = REPW; measureGrid(); if (Math.abs(old - REPW) > 8 && isReport()) render(); else pack(); }, 180));

/* ================================================================ inicialização */
(async function init() {
  try { const th = localStorage.getItem("atlas_theme"); if (th) document.documentElement.dataset.theme = th; } catch {}
  /* banco vazio começa vazio: o exemplo só aparece pelo botão Exemplo (os testes ligam a demonstração com __atlasDemo) */
  const DEMO = window.__atlasDemo === true;
  S = DEMO ? exampleData() : EMPTY(); IS_EXAMPLE = DEMO; VER++; applyLists();
  REF = +TODAY.slice(8) <= 7 ? addMonth(mkey(TODAY), -1) : mkey(TODAY);
  DIA.draft = loadDraft(); snapAll(); route();
  const use = n => { try { return Promise.resolve(window.claude?.use?.(n)).catch(() => null); } catch { return Promise.resolve(null); } };
  use("sample").then(async s => { SAMPLE = s || null; if (s) { const lim = await s.limits().catch(() => null); TOOLS_MAX = lim?.tools ? (lim.tools.maxCount || 8) : 0; } if (["mentores", "mentor", "diario"].includes(PAGE)) render(); });
  use("downloads").then(d => { DL = d || null; });
  use("mcp").then(async m => { MCP = m || null; await notionStatus(); if (PAGE === "integ") render(); gcAuto(); });
  const loaded = await loadStore();
  if (Object.keys(loaded).length) { const E = EMPTY(); S = { ...E, ...loaded, priv: { ...E.priv, ...(loaded.priv || {}) }, radar: { ...E.radar, ...(loaded.radar || {}) }, cfg: { ...E.cfg, ...(loaded.cfg || {}) }, integ: { ...E.integ, ...(loaded.integ || {}), notion: { ...E.integ.notion, ...(loaded.integ?.notion || {}) } }, listas: { ...E.listas, ...(loaded.listas || {}) } }; IS_EXAMPLE = false; }
  applyLists(); VER++; LOADED = true; snapAll(); UNDO.length = 0; REDO.length = 0;
  try { radarSync(); } catch (e) { console.warn("radar", e); }
  try { ckSnapTake(); } catch (e) { console.warn("ckSnap", e); }
  render();
  secBoot();
})();
