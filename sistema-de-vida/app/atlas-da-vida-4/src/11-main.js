
/* ================================================================ render */
let RELAYOUT = false;
function greet() { const h = new Date().getHours(); return h < 5 ? "Boa noite" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite"; }
function measureGrid() { const m = $("#main"); if (!m) return; const cs = getComputedStyle(m), w = m.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); REPW = Math.round(w - (railOn() ? 316 : 0)); }
function render() {
  const R = calcAt(REF); VIS = {}; VW_IDS.clear(); if (!RELAYOUT) CTAB.d = {};
  if (!RELAYOUT) measureGrid();
  const nm = S.cfg.nome ? esc(S.cfg.nome.split(" ")[0]) : "";
  const pages = {
    visao: () => [nm ? `Olá, ${nm}` : "Visão geral", `Como a vida está indo em ${mlabel(REF)}${R.corte ? ` · dados até ${fmtD(R.corte)}` : ""}`, rOverview],
    painel: () => ["Painel do dia", "Os essenciais do dia em um minuto, por texto ou voz. Você revisa antes de ir para as abas.", pPainel],
    rotina: () => ["Rotina", "Planeje e registre o dia em blocos de 30 minutos", pRotina],
    inspira: () => ["Inspiração", "Antes de começar: aquecer a cabeça, escolher o primeiro passo e, se quiser, chamar a IA de acompanhamento", pInspira],
    hoje: () => [`${greet()}${nm ? ", " + nm : ""}`, fmtDL(TODAY)[0].toUpperCase() + fmtDL(TODAY).slice(1), pHoje2],
    diario: () => ["Diário", "Escreva, marque pessoas e temas, registre dados e veja o que se repete", pDiario],
    psi: () => ["Psicologia", { inicio: "O trabalho terapêutico, ligado à sua jornada", sessoes: "O que acontece nas sessões", processos: "Os temas que você trabalha ao longo do tempo", entre: "O trabalho entre as sessões", padroes: "O que se repete, e o que ajuda", terapeuta: "Um apoio entre sessões que muda de forma conforme o que você precisa" }[SUB] || "", pPsique],
    trabalho: () => ["Cockpit de Trabalho", { dashboard: "Tendências, comparações e a visão por pessoa e por projeto no período", hoje: "Prioridades, alertas e o briefing do dia", semana: "Prazos da semana, capacidade e a weekly review", mes: "Prazos, marcos e feriados do mês", kanban: "Arraste entre as colunas para mudar o status", lista: "Todas as tarefas, em ordem de prioridade sugerida", gantt: "Caminho crítico, folgas e atrasos em cascata, em dias úteis", riscos: "Risk Register: probabilidade × impacto, gatilho, dono e mitigação", problemas: "Issue Log: soluções com prós, contras, esforço e impacto", equipe: "Carga, desenvolvimento e delegação", pessoa: "Tarefas, PDI, 1:1 e feedback", log: "O que aconteceu, em ordem: eventos, demandas, escopo, cliente, conversas", decisoes: "Decision Log: o que foi decidido e por quê", bim: "Modelos federados, clash, consegne IFC, pGI/BEP e LOIN", entregas: "Elenco elaborati: revisões e aprovação", reunioes: "Pauta, ata e ações que viram tarefas", relatorios: "Briefing, weekly review, relatório mensal e comunicações em italiano", licoes: "Lições aprendidas para reusar entre projetos", contexto: "Seu perfil, a equipe, os projetos e o agente" }[SUB] || "", pTrabalho],
    admin: () => ["Administração Pessoal", "O Conselho de Administração da sua vida: os mentores reunidos, conduzidos pelo Intermediador, e você decide", pAdmin],
    mentores: () => ["Mentores", "Um agente para cada área, com memória do que vocês combinaram", pMentores],
    mentor: () => [esc(MENTOR_DEF[SUB].nome), esc(MENTOR_DEF[SUB].papel[0].toUpperCase() + MENTOR_DEF[SUB].papel.slice(1)), pMentor],
    cruz: () => ["Cruzamentos", "Pistas sobre o que anda junto entre as áreas da sua vida, com o grau de confiança, para virar experimento", rCruz],
    fin: () => ["Finanças", SUB === "futuro" ? "Reserva, TFR e previdência" : SUB === "vida" ? "Contas dos dois países, somadas em euro" : mlabel(REF), { rel: rFin, lanc: pLanc, orc: pOrc, futuro: pFuturo, vida: pVida, projetos: pFinProjetos, diario: pSetorDiario }[SUB]],
    saude: () => ["Saúde", SUB === "alimentacao" ? "Calorias, macros, água, peso e metas, com o Nutri" : SUB === "treinos" ? "Fichas, cargas, corrida e progresso, com o Personal" : mlabel(REF), { rel: rSaude, checkin: pCheckin, alimentacao: pAlimentacao, treinos: pTreinos, diario: pSetorDiario }[SUB]],
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
    jornada: () => ["Jornada existencial", { inicio: "Quatro pilares, cinco mentores e a bússola no centro", jardim: "Saúde espiritual: o jardim interior que cresce com a sua jornada", confluencias: "Onde os quatro caminhos se encontram", praticas: "Programas guiados, sessões de prática e o que elas mudam", centros: "Os centros de força do perispírito, à luz da Doutrina Espírita", bussola: "Bússola moral: valores, princípios e perguntas das cinco tradições", exame: "O exame da noite: valores, vigilância e serviço", decidir: "Oito perguntas antes de decidir", caminhos: "Os seus desafios, um por um", navegante: "O Navegante, mentor da Bússola moral" }[SUB] || esc(J_PIL[J_SUB2P[SUB]]?.lema || ""), pJornada],
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
  const banner = EX_MODE ? exBanner() : DB_FAIL && LOADED ? `<div class="banner warn" role="alert">${ic("info")}<span><b>Sua conta não respondeu</b> (${esc(DB_FAIL)}). O que você registrar agora fica guardado neste aparelho e entra na conta quando ela responder; o app tenta de novo a cada 15 segundos.</span><button type="button" class="btn sm primary" data-act="dbretry">Tentar agora</button></div>`
    : vazio ? `<div class="banner">${ic("info")}<span><b>Atlas vazio.</b> Para trazer o que você já tem no Atlas 3: lá, Integrações → Exportar → <b>Backup completo</b>; aqui, Integrações → Importar → <b>Restaurar backup</b>. Ou comece pelo Painel do dia, ou ligue o <b>Exemplo</b> no topo para ver tudo preenchido com dados fictícios (nada é salvo).</span><button type="button" class="btn sm" data-go="integ">Ir para Integrações</button></div>`
    : STORE?.kind === "local" && LOADED && !IS_EXAMPLE ? `<div class="banner warn">${ic("info")}<span><b>Sem conta nesta visualização:</b> os dados ficam só neste navegador. Exporte backups em Integrações com frequência.</span></div>` : IS_EXAMPLE && LOADED ? `<div class="banner">${ic("info")}<span><b>Dados de exemplo.</b> São fictícios, para você ver tudo funcionando. Ao editar qualquer coisa eles viram seus e passam a ser salvos.</span><button type="button" class="btn sm primary" id="startEmpty">Começar do zero</button></div>` : "";
  const ae = document.activeElement, focusSel = !ae?.id && ae && ae !== document.body ? a11ySel(ae) : null, focusId = ae?.id, selS = ae?.selectionStart, selE = ae?.selectionEnd, scT = ae?.scrollTop, chat = $("#mchat"), chatTop = chat ? chat.scrollTop : null, chatBottom = chat ? chat.scrollHeight - chat.scrollTop - chat.clientHeight < 40 : true;
  $("#nav").innerHTML = navHTML(R);
  $("#main").innerHTML = `${topbar(R, title, sub)}${banner}${tabHead()}${subtabs()}${csStrip()}${isReport() && LOADED && REF !== mkey(TODAY) ? refBar() : ""}<div class="page p-${PAGE}${SUB ? " s-" + SUB : ""}">${body}</div>${isReport() ? reportTabs() : ""}`;
  if (SEC.open && SEC.tab === "guia" && guData().segue) secPaint();   /* o guia acompanha a aba */
  coFab();
  $("#drawerwrap").innerHTML = drawerHTML(R);
  if (PAGE !== "saude" || !["alimentacao", "treinos"].includes(SUB)) document.body.classList.remove("sdside-on");
  if (PAGE !== "trabalho") { document.body.classList.remove("ckside-on", "ckdmeet-on"); if (CK.dash) CK.dash.reuniao = false; }
  document.body.classList.toggle("navopen", NAVOPEN); document.body.classList.toggle("drawer-on", !!DRAWER);
  saveStatus();
  if (focusId) { const el = document.getElementById(focusId); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (selS != null) el.setSelectionRange(selS, selE ?? selS); } catch {} if (scT) el.scrollTop = scT; } }
  const nc = $("#mchat"); if (nc) nc.scrollTop = chatBottom || chatTop == null ? nc.scrollHeight : chatTop;
  if (DIA.focus) { const el = $("#e_" + DIA.focus); if (el) { el.scrollIntoView({ block: "center" }); DIA.focus = null; } }
  if (!RELAYOUT) { const vg = $(".vg"); if (vg && Math.abs(vg.clientWidth - REPW) > 8) { REPW = vg.clientWidth; RELAYOUT = true; try { render(); } finally { RELAYOUT = false; } } }
  if (!RELAYOUT) pack();
  a11yPass();
  if (focusSel && !RELAYOUT) { const el = document.querySelector(focusSel); if (el && el !== document.activeElement) { if (el.dataset.rvi != null) a11yRove(el); el.focus({ preventScroll: true }); } }
  csAfterRender();
  secAfterRender();
}

/* ================================================================ acessibilidade: tudo que responde ao clique responde ao teclado
   Elementos clicáveis que não são botão nem link ganham tabindex, papel de botão e nome (do data-tip, do title ou do texto).
   Grupos grandes do mesmo tipo (os dias de um heatmap, as barras de um Gantt, as linhas de um relatório) viram uma parada só
   do Tab: as setas andam pelo mais próximo naquela direção, Home e End vão às pontas. Campos sem nome ganham o do
   placeholder ou do rótulo mais próximo. Roda depois de cada render, em #main e na gaveta. */
const A11Y_NATIVE = "button,a[href],input,select,textarea,summary,details,label,option";
const a11yName = el => String(el.dataset.tip || el.getAttribute("title") || el.querySelector?.("title")?.textContent || "").replace(/\s*\n\s*/g, " · ").replace(/\s+/g, " ").trim().slice(0, 180);
function a11ySel(el) {
  const k = Object.keys(el.dataset || {}).find(x => x !== "tip" && x !== "rvi"); if (!k) return null;
  const at = "data-" + k.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
  try { return `${el.tagName.toLowerCase()}[${at}="${CSS.escape(el.getAttribute(at))}"]`; } catch { return null; }
}
function a11yRove(el) { const g = el.closest("[data-rvg]") || el.parentElement; g?.querySelectorAll("[data-rvi]").forEach(x => x.setAttribute("tabindex", x === el ? "0" : "-1")); }
function a11yPass() {
  for (const sc of [document.getElementById("main"), document.getElementById("drawerwrap")]) {
    if (!sc) continue;
    const grupos = new Map();
    for (const el of sc.querySelectorAll(CLICK_SEL)) {
      if (el.matches(A11Y_NATIVE) || el.parentElement?.closest("button,a[href]")) continue;
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      if (!el.getAttribute("role")) el.setAttribute("role", "button");
      if (!el.getAttribute("aria-label") && !(el.textContent || "").trim()) { const n = a11yName(el); if (n) el.setAttribute("aria-label", n); }
      const k = Object.keys(el.dataset).find(x => x !== "tip" && x !== "rvi") || "", box = el.closest("svg") || el.parentElement, key = box;
      if (!grupos.has(key)) grupos.set(key, { k, els: [] }); grupos.get(key).els.push(el);
    }
    for (const [box, g] of grupos) {
      if (g.els.length < 24) continue;
      box.setAttribute("data-rvg", ""); const cur = g.els.find(x => x.getAttribute("tabindex") === "0" && x.dataset.rvi != null && x.dataset.rvcur) || g.els.at(-1);
      g.els.forEach((x, i) => { x.dataset.rvi = i; x.setAttribute("tabindex", x === cur ? "0" : "-1"); });
      if (!box.getAttribute("aria-label") && box.tagName.toLowerCase() !== "svg") box.setAttribute("aria-label", "Use as setas para andar entre os itens");
    }
    for (const f of sc.querySelectorAll("input:not([type=hidden]),select,textarea")) {
      if (f.labels?.length || f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || f.title) continue;
      let n = f.placeholder;
      if (!n) { let p = f.previousElementSibling; while (p && !n) { if (p.matches(".flbl,.lbl,.mt,b,strong,small,span,h3,h4")) n = p.textContent; p = p.previousElementSibling; } }
      if (!n) n = f.closest("section,.pn,form")?.querySelector("h2,h3,legend")?.textContent;
      if (n) f.setAttribute("aria-label", n.replace(/\s+/g, " ").trim().slice(0, 120));
    }
  }
}
/* setas dentro de um grupo: o item mais próximo na direção, pela posição na tela */
function a11yArrow(e) {
  const el = e.target; if (el?.dataset?.rvi == null) return false;
  const g = el.closest("[data-rvg]") || el.parentElement, its = [...g.querySelectorAll("[data-rvi]")]; if (!its.length) return false;
  let nx = null;
  if (e.key === "Home") nx = its[0]; else if (e.key === "End") nx = its.at(-1);
  else {
    const c = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 }), a = c(el.getBoundingClientRect()), d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key]; if (!d) return false;
    let best = Infinity;
    for (const x of its) { if (x === el) continue; const b = c(x.getBoundingClientRect()), dx = b.x - a.x, dy = b.y - a.y, along = dx * d[0] + dy * d[1]; if (along <= 1) continue; const cost = along + 3 * Math.abs(d[0] ? dy : dx); if (cost < best) { best = cost; nx = x; } }
    if (!nx) { const i = its.indexOf(el) + (d[0] + d[1] > 0 ? 1 : -1); nx = its[i] || null; }
  }
  if (!nx) return true;
  e.preventDefault(); a11yRove(nx); nx.focus(); return true;
}

/* ================================================================ empacotamento: nenhum buraco entre os cartões
   Grades de cartões viram "alvenaria": cada cartão ocupa linhas de 4px conforme a altura real, a grade preenche
   os vãos (dense) e o último cartão de cada coluna estica até a base. Grades de itens iguais dividem a última linha. */
const PACK_SEL = ".vg,.g2c,.g3c,.cadgrid", FILL_SEL = ".mgrid,.jmgrid,.pgrid,.sjels,.sjside,.hgrid2,.xgrid,.krow,.minis,.filprinc,.crlibs,.insgrid,.lzgrid,.ckpeople", PACK_ROW = 4;
let PACK_RO = null, PACK_RAF = 0;
const PACK_H = new WeakMap(), PACK_W = new WeakMap(), PACK_N = new WeakMap();
/* só listas longas por natureza (agenda, listas, tabelas compridas) podem ganhar rolagem; gráficos e placares nunca */
const listy = k => k.getBoundingClientRect().height > 520 && (!!k.querySelector(".agenda,.list,.bls") || k.querySelectorAll("tbody tr").length > 14);
function packGrid(g) {
  const cs = getComputedStyle(g), cols = cs.gridTemplateColumns.split(" ").length, gap = parseFloat(cs.columnGap) || 16;
  const kids = [...g.children].filter(k => getComputedStyle(k).display !== "none");
  g.classList.add("packed");
  for (const t of g.querySelectorAll(":scope > * textarea[data-pkta]")) { t.style.height = t.dataset.pkta; delete t.dataset.pkta; }
  for (const k of kids) { k.style.gridRowEnd = ""; k.style.height = ""; k.style.minHeight = ""; k.style.maxHeight = ""; k.classList.remove("grown", "capped"); if (k.dataset.pkfull) { k.style.gridColumn = ""; k.style.gridRow = ""; delete k.dataset.pkfull; } }
  const span = () => kids.forEach(k => { const h = k.getBoundingClientRect().height; PACK_N.set(k, h); k.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + gap) / PACK_ROW))}`; });
  const gaps = () => { const rs = kids.map(k => k.getBoundingClientRect()), bottom = Math.max(...rs.map(r => r.bottom));
    return { rs, list: rs.map((r, i) => { let to = bottom; rs.forEach((o, j) => { if (j !== i && o.top >= r.bottom - 1 && o.left < r.right - 2 && o.right > r.left + 2) to = Math.min(to, o.top - gap); }); return to; }) }; };
  span();
  if (cols > 1 && kids.length && !g.classList.contains("vg")) { packCards(g, kids, cols, gap); for (const k of kids) { PACK_H.set(k, k.getBoundingClientRect().height); PACK_RO?.observe(k); } return; }
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
  if (g.classList.contains("vg") && cols > 1 && kids.length > 1) vgPlan(g, kids);
}
/* grade de cartões (2 ou 3 colunas): cada cartão vai para a coluna mais curta ou ocupa a largura toda, o que deixar menos vazio.
   Testa as combinações (até 2^10; acima disso melhora uma escolha por vez). Conta o vazio que sobra: buraco entre cartões pesa o
   dobro do que só estica o último cartão de uma coluna; alargar um cartão que não era largo custa um pouco, para o desenho original
   ficar quando a diferença é pequena. Cartão com gráfico de largura fixa não é alargado (o gráfico ficaria esticado). */
/* até onde o conteúdo de um cartão chega à direita (texto, campos, imagens, caixas com fundo ou borda), em px a partir da esquerda */
function pkDireita(k) {
  const cr = k.getBoundingClientRect(); let mx = 0, n = 0; const rg = document.createRange();
  const tw = document.createTreeWalker(k, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: x => x.nodeType === 1 && getComputedStyle(x).display === "none" ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  for (let x = tw.nextNode(); x && n < 3000; x = tw.nextNode(), n++) {
    if (x.nodeType === 3) { if (x.textContent.trim()) { rg.selectNodeContents(x); for (const q of rg.getClientRects()) mx = Math.max(mx, q.right); } continue; }
    if (/^(svg|IMG|CANVAS|INPUT|SELECT|TEXTAREA|BUTTON|VIDEO)$/.test(x.tagName)) { mx = Math.max(mx, x.getBoundingClientRect().right); continue; }
    const cs = getComputedStyle(x); if (!/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) || parseFloat(cs.borderBottomWidth) || parseFloat(cs.borderRightWidth)) mx = Math.max(mx, x.getBoundingClientRect().right);
  }
  return mx - cr.left;
}
let PK_LADO = true;   /* conta o vazio à direita de um cartão alargado (os testes comparam com e sem) */
function packCards(g, kids, cols, gap) {
  const W = g.getBoundingClientRect().width, R = PACK_ROW, rows = h => Math.max(1, Math.ceil((h + gap) / R)), PEN = 15;
  const full0 = kids.map(k => k.getBoundingClientRect().width >= W - 2), hS = kids.map(k => k.getBoundingClientRect().height), hF = hS.slice();
  const ids = kids.map((k, i) => i).filter(i => !full0[i] && !kids[i].querySelector("svg.chart")), bit = new Map(ids.map((i, b) => [i, b]));
  /* vazio à direita de um cartão alargado cujo conteúdo não acompanha a largura (mapa de calor, formulário curto), em colunas×linhas */
  const colW = (W - (cols - 1) * (parseFloat(getComputedStyle(g).columnGap) || gap)) / cols, lado = kids.map(() => 0);
  if (ids.length) { ids.forEach(i => { kids[i].style.gridColumn = "1 / -1"; });
    ids.forEach(i => { const k = kids[i]; hF[i] = k.getBoundingClientRect().height; const sobra = k.getBoundingClientRect().width - parseFloat(getComputedStyle(k).paddingRight || 0) - pkDireita(k); if (sobra > 120 && PK_LADO) lado[i] = sobra / colW * rows(hF[i]); });
    ids.forEach(i => { kids[i].style.gridColumn = ""; }); }
  const sim = mask => {
    const colH = new Array(cols).fill(0), last = new Array(cols).fill(-1), pl = []; let estica = 0, buraco = 0, n1 = 0;
    const fecha = top => { for (let c = 0; c < cols; c++) { const d = top - colH[c]; if (d <= 0) continue; if (last[c] >= 0) { pl[last[c]].g += d; estica += d; } else buraco += d; } };
    kids.forEach((k, i) => { const f = full0[i] || (bit.has(i) && (mask >> bit.get(i)) & 1);
      if (f) { const top = Math.max(...colH), n = rows(hF[i]); fecha(top); pl.push({ i, f: true, c: 0, top, n, g: 0 }); colH.fill(top + n); last.fill(-1); if (!full0[i]) { n1++; estica += lado[i]; } }
      else { let c = 0; for (let j = 1; j < cols; j++) if (colH[j] < colH[c]) c = j; const n = rows(hS[i]); pl.push({ i, f: false, c, top: colH[c], n, g: 0 }); colH[c] += n; last[c] = pl.length - 1; } });
    fecha(Math.max(...colH));
    return { s: estica + 2 * buraco + PEN * n1, pl };
  };
  let best = sim(kids.length === 1 && ids.length === 1 ? 1 : 0);   /* cartão sozinho na grade: largura toda (as outras colunas ficariam vazias) */
  if (kids.length === 1) { /* decidido acima */ }
  else if (ids.length <= 10) { for (let m = 1; m < 1 << ids.length; m++) { const r = sim(m); if (r.s < best.s) best = r; } }
  else { let mask = 0; for (let ch = true; ch;) { ch = false; for (let b = 0; b < ids.length; b++) { const r = sim(mask ^ (1 << b)); if (r.s < best.s) { best = r; mask ^= 1 << b; ch = true; } } } }
  for (const p of best.pl) { const k = kids[p.i]; k.dataset.pkfull = p.f && !full0[p.i] ? "w" : "1"; k.style.gridColumn = p.f ? "1 / -1" : `${p.c + 1} / span 1`; k.style.gridRow = `${p.top + 1} / span ${p.n + p.g}`;
    PACK_N.set(k, p.f ? hF[p.i] : hS[p.i]);
    if (p.g > 0) { k.style.minHeight = Math.round((p.n + p.g) * R - gap) + "px"; k.classList.add("grown");
      /* cartão esticado com campo de texto: o campo ganha a altura que sobrou, em vez de ficar vazio embaixo */
      const ta = [...k.querySelectorAll("textarea")].filter(t => t.offsetHeight >= 40).at(-1);
      if (ta) { const extra = Math.round((p.n + p.g) * R - gap - k.getBoundingClientRect().height); if (extra > 0) { ta.dataset.pkta = ta.style.height; ta.style.height = (ta.getBoundingClientRect().height + extra) + "px"; } } } }
}
/* grade de relatório (12 colunas): vão que nenhum cartão de cima consegue cobrir esticando para baixo é coberto alargando um cartão
   vizinho (à esquerda ou à direita) cuja faixa de altura cabe inteira nas colunas livres. A posição dos outros cartões não muda
   (a colocação densa põe o cartão alargado no mesmo lugar). Gráfico desenhado com vw(n, id) é redesenhado na largura nova;
   gráfico de largura fixa não é alargado (ficaria esticado). No máximo 3 redesenhos para o mesmo estado da tela. */
function vgPlan(g, kids) {
  if (VG_BUSY || REPW < 760 || !g.isConnected) return;
  const gr = g.getBoundingClientRect(), gap = parseFloat(getComputedStyle(g).columnGap) || 16, cw = (gr.width - 11 * gap) / 12, R = 8;
  const it = kids.map(k => { const r = k.getBoundingClientRect(), t = r.top - gr.top; return { k, vid: k.dataset.vid, c0: Math.round((r.left - gr.left) / (cw + gap)), c1: Math.round((r.right - gr.left + gap) / (cw + gap)), t, b: r.bottom - gr.top, nb: t + (PACK_N.get(k) ?? r.height) }; });
  const H = Math.ceil(Math.max(...it.map(x => x.b)) / R); if (!H) return;
  const occ = new Uint8Array(12 * H), mark = (c0, c1, t, b) => { for (let y = Math.max(0, Math.floor(t / R)); y < Math.min(H, Math.ceil(b / R)); y++) for (let c = c0; c < c1; c++) occ[y * 12 + c] = 1; };
  it.forEach(x => mark(x.c0, x.c1, x.t, x.nb));   /* conta como vazio também o que um cartão só cobre por ter sido esticado */
  const free = (c, x) => it.every(o => o === x || o.c0 > c || o.c1 <= c || o.nb <= x.t + 2 || o.t >= x.nb - 2);
  const vazio = (c0, c1, t, b) => { let n = 0; for (let y = Math.max(0, Math.floor(t / R)); y < Math.min(H, Math.ceil(b / R)); y++) for (let c = c0; c < c1; c++) n += !occ[y * 12 + c]; return n * R; };
  const fix = {};
  for (let volta = 0; volta < 6; volta++) {
    let best = null;
    for (const x of it) {
      if (!x.vid || x.c1 - x.c0 >= 12 || (x.k.querySelector("svg.chart") && !VW_IDS.has(x.vid))) continue;
      for (const dir of [1, -1]) { let c0 = x.c0, c1 = x.c1;
        for (;;) { const c = dir > 0 ? c1 : c0 - 1; if (c < 0 || c > 11 || !free(c, x)) break; if (dir > 0) c1++; else c0--; }
        if (c1 - c0 === x.c1 - x.c0) continue;
        const ganho = dir > 0 ? vazio(x.c1, c1, x.t, x.nb) : vazio(c0, x.c0, x.t, x.nb);
        if (ganho > (best?.ganho || 0)) best = { x, c0, c1, ganho }; }
    }
    if (!best || best.ganho < 100) break;
    mark(best.c0, best.c1, best.x.t, best.x.nb); best.x.c0 = best.c0; best.x.c1 = best.c1; fix[best.x.vid] = best.c1 - best.c0;
  }
  if (!Object.keys(fix).length) return;
  const key = vgKey(); if (VG_FIX.k !== key) VG_FIX = { k: key, s: {}, n: 0 };
  if (VG_FIX.n >= 3) return;
  VG_FIX.n++; Object.assign(VG_FIX.s, fix);
  VG_BUSY = true; try { render(); } finally { VG_BUSY = false; }
  pack();   /* nova rodada sobre a grade redesenhada (o limite de 3 por estado encerra) */
}
function fillRow(g) {
  const kids = [...g.children].filter(k => getComputedStyle(k).display !== "none");
  for (const k of kids) k.style.gridColumn = "";
  const cs = getComputedStyle(g), tr = cs.gridTemplateColumns.split(" ").map(parseFloat), cols = tr.length, gap = parseFloat(cs.columnGap) || 0;
  if (cols < 2 || !kids.length) return;
  if (kids.length === 1) { kids[0].style.gridColumn = "1 / -1"; return; }   /* item sozinho numa grade de várias colunas: a linha toda */
  const rs = kids.map(k => k.getBoundingClientRect()), top = Math.max(...rs.map(r => r.top)), tol = Math.min(...rs.map(r => r.height)) / 2, last = kids.filter((k, i) => top - rs[i].top < tol);
  const spans = last.map(k => Math.max(1, Math.round((k.getBoundingClientRect().width + gap) / (tr[0] + gap)))), free = cols - sum(spans);
  if (free <= 0 || free >= cols) return;
  last.forEach((k, i) => { k.style.gridColumn = `span ${spans[i] + Math.floor(free / last.length) + (i < free % last.length ? 1 : 0)}`; });
}
/* duas colunas lado a lado (conteúdo + lateral): a mais curta cresce até a altura útil da tela, sem passar da outra, e, se ainda
   for mais curta, acompanha a rolagem. Coluna que acompanha a rolagem e é mais alta que a tela para com a base visível. */
const COLS_SEL = ".rtlay,.ckwrap,.sdwrap,.jcols,.sjbody,.csgrid,.diary,.dados,.rep,.jdlay", CF_TOP = 12;
const cfVis = k => getComputedStyle(k).display !== "none" && k.getBoundingClientRect().height > 0;
const cfPlain = cs => !/grid|table/.test(cs.display) && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) && cs.backgroundImage === "none" && !parseFloat(cs.borderTopWidth) && !parseFloat(cs.borderBottomWidth);
/* o que cresce na coluna curta: o marcado (data-cfgrow), a conversa de um mentor, ou o último cartão (se for um bloco de texto, a caixa de texto) */
function cfElastic(col) {
  const x = col.querySelector("[data-cfgrow]") || col.querySelector(".mchat"); if (x && cfVis(x)) return [x, "height"];
  let e = col;
  for (let d = 0; d < 6; d++) { const last = [...e.children].filter(cfVis).at(-1); if (!last) break; e = last; if (!(cfPlain(getComputedStyle(last)) && last.children.length)) break; }
  if (e === col) return [col, "minHeight"];
  const ta = [...e.querySelectorAll("textarea")].filter(cfVis).at(-1); if (ta && ta.offsetHeight >= 60) return [ta, "height"];
  return [e, "minHeight"];
}
function colFit(c) {
  for (const e of c.querySelectorAll("[data-cfp]")) { e.style[e.dataset.cfp] = e.dataset.cfo || ""; delete e.dataset.cfp; delete e.dataset.cfo; }
  const cols = [...c.children].filter(cfVis);
  for (const k of [...c.children]) { k.classList.remove("cfstick"); if (k.dataset.cft) { k.style.top = ""; delete k.dataset.cft; } }
  if (cols.length !== 2) return;
  const [a, b] = cols.map(k => k.getBoundingClientRect());
  if (!(a.right <= b.left + 1 || b.right <= a.left + 1)) return;   /* empilhadas (tela estreita): nada a acertar */
  let hs = Math.min(a.height, b.height), hl = Math.max(a.height, b.height); const sh = cols[a.height <= b.height ? 0 : 1], lg = cols[a.height <= b.height ? 1 : 0], avail = innerHeight - 28;   /* = as laterais com altura máxima de 100vh − 28px */
  /* a coluna mais longa tem a conversa de um mentor: a conversa encolhe (até 280 px, rolando por dentro) antes de a outra coluna esticar */
  const ch = hl - hs >= 24 && lg.querySelector(".mchat");
  if (ch && cfVis(ch)) { const cur = ch.getBoundingClientRect().height, cut = Math.round(Math.min(hl - hs, cur - Math.max(280, parseFloat(getComputedStyle(ch).minHeight) || 0)));
    if (cut > 8) { ch.dataset.cfp = "height"; ch.dataset.cfo = ch.style.height; ch.style.height = Math.round(parseFloat(getComputedStyle(ch).height) - cut) + "px"; hl = lg.getBoundingClientRect().height; } }
  if (hl - hs >= 24) {
    const F = Math.min(hl, Math.max(hs, avail)), grow = Math.round(F - hs);
    if (grow > 0) { const [e, prop] = cfElastic(sh); e.dataset.cfp = prop; e.dataset.cfo = e.style[prop]; e.style[prop] = Math.round(parseFloat(getComputedStyle(e).height) + grow) + "px"; }
    if (F < hl - 24) sh.classList.add("cfstick");
  }
  for (const k of cols) { const h = k.getBoundingClientRect().height;
    if (getComputedStyle(k).position === "sticky") { k.dataset.cft = "1"; k.style.top = (h > avail + 4 ? Math.round(innerHeight - h - CF_TOP) : CF_TOP) + "px"; }
    PACK_H.set(k, h); PACK_RO?.observe(k); }
}
function pack() {
  const m = $("#main"); if (!m) return;
  PACK_RO?.disconnect();
  if (!PACK_RO && "ResizeObserver" in window) PACK_RO = new ResizeObserver(ents => {
    if (ents.some(e => { const r = e.target.getBoundingClientRect(), w = PACK_W.get(e.target); return w != null ? Math.abs(r.width - w) > 1 : Math.abs(r.height - (PACK_H.get(e.target) ?? -9)) > 1; })) { cancelAnimationFrame(PACK_RAF); PACK_RAF = requestAnimationFrame(pack); }
  });
  for (const g of m.querySelectorAll(FILL_SEL)) { fillRow(g); PACK_W.set(g, g.getBoundingClientRect().width); PACK_RO?.observe(g); }
  for (const g of [...m.querySelectorAll(PACK_SEL)].reverse()) if (g.isConnected) packGrid(g);
  for (const c of $("#main").querySelectorAll(COLS_SEL)) colFit(c);
}

/* ================================================================ eventos */
const CLICK_SEL = "[data-rtb],[data-rtitem],button,input[type=checkbox],a[data-act],[data-act],[data-edit],[data-ent],[data-xf],[data-ref],[data-go],[data-cx],[data-dday],[data-ckday],[data-add],[data-mark],[data-done],[data-goentry],[data-newp],[data-pvdet],[data-chsel],[data-bmv],[data-cktask],[data-ckmemb],[data-ckproj],[data-ckmarco],[data-ckpessoa],[data-ckrisk],[data-ckiss],[data-ckdec],[data-cklic],[data-ckbim],[data-ckel],[data-ckmeetv],[data-ckrel],[data-ckdrill],[data-ckdper],[data-ckdnav],[data-ckdsec],[data-ckwmv],[data-ckwhide],[data-czver],[data-cf]";
document.addEventListener("click", e => {
  const t = e.target.closest(CLICK_SEL); if (!t || t.disabled) return;
  if (t.tagName === "A" && t.getAttribute("href")?.startsWith("#") && !t.dataset.act) { NAVOPEN = false; DRAWER = null; return; }
  if (t.closest("#pal")) { if (t.dataset.pal != null) palRun(+t.dataset.pal); return; }
  if (t.dataset.aci != null) { acPick(+t.dataset.aci); return; }
  if (lemClick(t) || hxClick(t) || avalClick(t) || sdClick(t) || nuClick(t) || trClick(t) || cfClick(t) || ckClick(t) || guClick(t) || coClick(t) || secClick(t) || csClick(t) || filClick(t) || psiClick(t) || rtcClick(t) || rtClick(t) || lsClick(t) || insClick(t) || pd3Click(t) || pdClick(t) || gcClick(t) || hjClick(t) || casaClick(t) || futClick(t) || idiClick(t) || cr2Click(t) || capClick(t) || jmClick(t) || jdClick(t) || bmClick(t) || jClick(t) || crClick(t) || crClick2(t) || lzClick(t) || pjClick(t) || privClick(t) || expClick(t) || radarClick(t) || weekClick(t) || chapClick(t) || semClick(t) || duoClick(t) || integ2Click(t) || sjClick(t) || diaryClick(t) || mentorClick(t) || reportClick(t) || dataClick(t) || integClick(t) || settingsClick(t)) return;
  const ds = t.dataset, a = ds.act;
  if (a === "menu") { NAVOPEN = !NAVOPEN; document.body.classList.toggle("navopen", NAVOPEN); return; }
  if (a === "pal") { NAVOPEN = false; document.body.classList.remove("navopen"); openPalette(); return; }
  if (a === "mprev" || a === "mnext") { REF = addMonth(REF, a === "mprev" ? -1 : 1); render(); return; }
  if (a === "mnow") { REF = mkey(TODAY); render(); return; }
  if (a === "dbretry") { retryLoad(); return; }
  if (a === "passosok") { S.cfg.passosOk = true; touch("cfg", { label: "Primeiros passos dispensados" }); return; }
  if (a === "navmais") { NAVMAIS = !NAVMAIS; try { localStorage.setItem("atlas4_navmais", NAVMAIS ? "1" : "0"); } catch {} $("#nav").innerHTML = navHTML(calcAt(REF)); saveStatus(); $("#nav [data-act=navmais]")?.focus(); return; }
  if (a === "menupad") { S.cfg.menu = null; touch("cfg", { label: "Menu padrão" }); return; }
  if (a === "menuuso") { const r = S.uso?.r || {}; S.cfg.menu = NAV.flatMap(g => g[1]).map(x => x[0]).filter(k => r[k]).sort((x, y) => r[y] - r[x]).slice(0, 8); if (!S.cfg.menu.length) S.cfg.menu = null; touch("cfg", { label: "Menu pelas mais usadas" }); return; }
  if (a === "undo") { undo(); return; } if (a === "redo") { redo(); return; }
  if (a === "closedrawer") { DRAWER = null; render(); return; }
  if (a === "closefocus") { $("#focusdlg").close(); return; }
  if (a === "qtar") { const i = t.closest(".pn,.tcol")?.querySelector(".quick input") || $("#qt_in") || $("#hj_tar"); if (i) { quickTask(i.value); i.value = ""; } return; }
  if (a === "qlanc") { const i = $("#ql_in"); if (i) { quickLanc(i.value); i.value = ""; } return; }
  if (a === "extog") { exToggle(); return; }
  if (a === "exoff") { exOff(); return; }
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
  if (e.key === "Enter" && tg.classList?.contains("lf-t") && !e.isComposing) { e.preventDefault(); lemEnter(tg); return; }
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
  if (["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key) && !typing && a11yArrow(e)) return;
  if ((e.key === "Enter" || e.key === " ") && tg.matches?.('tr.click,[role="button"],[role="link"],.kc.click')) { e.preventDefault(); tg.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
});
const reRender = debounce(() => render(), 220);
document.addEventListener("input", e => {
  const t = e.target;
  if (lemInput(t) || hxInput(t) || nuInput(t) || trInput(t) || cfInput(t) || ckInput(t) || secInput(t) || guInput(t) || insInput(t) || coInput(t) || csInput(t) || filInput(t) || psiInput(t) || rtcInput(t) || rtInput(t) || pdInput(t) || cr2Input(t) || diaryInput(t) || capInput(t) || weekInput(t) || duoInput(t) || jmInput(t) || jdInput(t) || bmInput(t) || jInput(t) || crInput(t) || lzInput(t) || pjInput(t)) return;
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
  if (lemChange(t) || nuChange(t) || trChange(t) || cfChange(t) || ckChange(t) || coChange(t) || secChange(t) || csChange(t) || filChange(t) || psiChange(t) || rtcChange(t) || rtChange(t) || lsChange(t) || pdChange(t) || hjChange(t) || futChange(t) || idiChange(t) || capChange(t) || jdChange(t) || bmChange(t) || jChange(t) || crChange(t) || crChange2(t) || lzChange(t) || pjChange(t) || privChange(t) || weekChange(t) || chapChange(t) || semChange(t) || duoChange(t) || integ2Change(t) || reportChange(t) || dataChange(t) || importChange(t) || integChange(t) || settingsChange(t)) return;
  if (t.dataset.roda != null) touch("roda", { label: "Nota da Roda" });
  else if (t.dataset.prio != null) { S.prio[+t.dataset.prio] = v; touch("prio", { label: "Prioridade" }); }
  else if (t.dataset.alvo != null) { S.alvo[t.dataset.alvo] = v === "" ? null : +v; touch("alvo", { label: "Alvo da área" }); }
  else if (t.dataset.rev) { S.revisao[REF] = { ...(S.revisao[REF] || {}), [t.dataset.rev]: t.dataset.rev === "nota" ? (v === "" ? null : +v) : v }; touch("revisao", { label: "Revisão mensal" }); }
  else if (t.dataset.orc) { if (v === "") delete S.orc[t.dataset.orc]; else S.orc[t.dataset.orc] = +v; touch("orc", { label: "Orçamento" }); }
  else if (t.dataset.patr) { S.patr[REF] = { ...(S.patr[REF] || {}), [t.dataset.patr]: v === "" ? "" : +v }; touch("patr", { label: "Patrimônio" }); }
  else if (t.dataset.cfgext) { S.cfg.ext = { ...(S.cfg.ext || {}), [t.dataset.cfgext]: t.checked }; if (t.dataset.cfgext === "clima") { HJ.wx = null; HJ.wxSt = ""; } if (t.dataset.cfgext === "noticias") { HJ.news = null; HJ.newsSt = ""; } touch("cfg", { label: "Serviços externos" }); }
  else if (t.dataset.menufix) { const fx = new Set(menuFixos()); if (t.checked) fx.add(t.dataset.menufix); else fx.delete(t.dataset.menufix); S.cfg.menu = NAV.flatMap(g => g[1]).map(x => x[0]).filter(k => fx.has(k)); touch("cfg", { label: "Menu" }); }
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
/* a dica de um item também aparece quando ele recebe foco pelo teclado */
document.addEventListener("focusin", e => { const el = e.target.closest?.("[data-tip]"); if (el && el.matches(":focus-visible")) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.bottom); } });
document.addEventListener("focusout", e => { if (e.target.closest?.("[data-tip]")) $("#tip").hidden = true; });
window.addEventListener("hashchange", route);
window.addEventListener("resize", debounce(() => { const old = REPW; measureGrid(); if (Math.abs(old - REPW) > 8 && isReport()) render(); else pack(); }, 180));

/* ================================================================ virada do dia
   com o app aberto depois da meia-noite, tudo passa a gravar no dia novo; o que guardou a data da abertura acompanha
   se ainda estava nela (um rascunho do Painel do dia fica no dia em que foi escrito) */
const refDe = d => +d.slice(8) <= 7 ? addMonth(mkey(d), -1) : mkey(d);
function diaVirou() {
  const novo = iso(new Date()); if (novo === TODAY || !LOADED) return false;
  /* redesenhar agora tiraria da mão o campo que está sendo digitado: espera ele perder o foco */
  if (document.activeElement?.matches?.("input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]")) return false;
  const old = TODAY; TODAY = novo;
  if (REF === refDe(old)) REF = refDe(novo); else if (REF === mkey(old)) REF = mkey(novo);
  if (CAP.data === old) CAP.data = novo;
  if (RT.d === old) RT.d = novo;
  let rasc = false; if (PD.date === old) { if (pdEmpty()) { PD = pdNew(novo); pdStore(); } else rasc = true; }
  Object.assign(HJ, { wx: null, wxSt: "", news: null, newsSt: "" }); HJ.skip.clear();
  VER++;
  try { radarSync(); } catch (e) { console.warn("radar", e); }
  try { ckSnapTake(); } catch (e) { console.warn("ckSnap", e); }
  render();
  toast(`Novo dia: os registros agora vão para ${fmtDL(novo)}${rasc ? `. O rascunho do Painel do dia continua em ${fmtD(old)}` : ""}`);
  return true;
}
setInterval(diaVirou, 60e3);
document.addEventListener("visibilitychange", () => { if (!document.hidden) diaVirou(); });
window.addEventListener("focus", () => diaVirou());
document.addEventListener("focusout", () => setTimeout(diaVirou, 250));

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
  use("mcp").then(async m => { MCP = m || null; await notionStatus(); if (PAGE === "integ") render(); gcAuto(); lemGcSync(); });
  const loaded = await loadStore();   /* null: a conta existe mas não respondeu */
  if (loaded && Object.keys(loaded).length) { S = comPadroes(loaded); IS_EXAMPLE = false; }
  applyLists(); VER++; LOADED = true; snapAll(); UNDO.length = 0; REDO.length = 0;
  if (STORE?.kind === "db" && !DB_FAIL) { const n = walApply(); if (n) { IS_EXAMPLE = false; flushSoon(0); setTimeout(() => toast(n > 1 ? `Recuperei ${n} alterações que não tinham chegado à conta.` : "Recuperei uma alteração que não tinha chegado à conta."), 400); } watchRevs(); }
  if (DB_FAIL) RETRY_T = setTimeout(retryLoad, 15000);
  try { radarSync(); } catch (e) { console.warn("radar", e); }
  try { ckSnapTake(); } catch (e) { console.warn("ckSnap", e); }
  render();
  secBoot(); coInit(); lemGcSync();
})();
