
/* ================================================================ Guia do Atlas: o que preencher em cada área, no painel do Secretário
   Pedido ao Secretário (“abre o guia”, “como preencho finanças?”, ou pela IA com a ferramenta abrir_guia) ou pela aba Guia da janela
   dele, que fica aberta enquanto você navega. “Acompanhar a aba” faz o guia mostrar a seção da aba em que você está.
   O conteúdo de cada área é genérico (está no código). O plano pessoal (quando e com que frequência preencher, encaixado na rotina de
   cada um) fica só no banco da pessoa: S.guia.plano = { base, atualizado, resumo: {dia, semana, mes}, itens: [{ id, aba, titulo,
   quando, freq, min, como, gatilho: { titulo, dias, min } }] }. “Criar os lembretes do plano” transforma os gatilhos em lembretes
   semanais (Rotina › Lembretes), com o que fazer na nota. */
const GUIA = {
  hoje: { t: "Hoje", o: ["As 4 perguntas de “Como você está agora?”: humor, energia, tempo livre e dinheiro para lazer.", "Nada mais: frase, ideias e o que vence hoje vêm sozinhos; clima e notícias vêm da última previsão gravada (a atualização automática está desligada)."], min: "Humor e energia (2 toques).", rap: "Abra de manhã, toque nas 4 respostas e leia o resumo do topo.", freq: "Todo dia, de manhã", tempo: 1 },
  painel: { t: "Painel do dia", o: ["Sono, humor, energia e estresse.", "Treino, passos e peso (quando tiver).", "Gastos e receitas do dia (“gastei 12,50 no almoço”).", "Hábitos feitos, contatos com pessoas, estudo, leitura e lazer.", "Uma frase do dia, que vai para o Diário.", "Tarefas novas e contas pagas."], min: "Sono, humor e os gastos.", rap: "Fale o dia de uma vez no campo grande (ou pelo microfone), confira em “Revisar e salvar”. Tudo vai para as abas certas.", freq: "Todo dia, à noite", tempo: 3 },
  rotina: { t: "Rotina", o: ["A semana em blocos de 30 min: aplique um modelo com “Preencher” (Básica, Intermediária ou Avançada).", "Para um horário solto, toque na meia hora: a lista traz as atividades do Standard (com a cor) e as Outras que você cadastrar.", "Durante ou no fim do dia, marque os blocos como feito, parcial ou pulado (ou “Capturar o dia” por voz).", "Lembretes das atividades que você não quer esquecer."], min: "Preencher a semana com um modelo, uma vez por semana.", rap: "Domingo ou segunda: Preencher › escolha o nível › Preencher. À noite: Capturar o dia, por voz.", freq: "Semanal (montar) e diária (marcar)", tempo: 2 },
  inspira: { t: "Inspiração", o: ["Escolha a atividade que vai começar e use o aquecimento de 5 minutos.", "Se quiser companhia, ative a IA de acompanhamento da atividade.", "Suas atividades próprias em “Minhas atividades”."], min: "Nada obrigatório: é para usar antes de começar algo.", rap: "Antes do bloco de estudo, leitura ou projeto: abra a atividade, leia o texto curto e faça o primeiro passo do desafio.", freq: "Quando for começar uma atividade", tempo: 5 },
  trabalho: { t: "Cockpit de Trabalho", o: ["Contexto (uma vez): seu perfil, a equipe e os projetos com marcos.", "Tarefas com prazo, estimativa e projeto; status ao longo do dia.", "Diário de bordo: o que aconteceu, riscos (r:), problemas (p:) e decisões (d:).", "Reuniões e entregas quando houver."], min: "Atualizar o status das tarefas do dia.", rap: "Alt+Shift+N de qualquer aba: “t: revisar prancha 12 sex @Ana [Projeto]”. No fim do dia, Hoje › marque o que andou.", freq: "Todo dia útil (início e fim do expediente)", tempo: 5 },
  diario: { t: "Diário", o: ["O que aconteceu, o que sentiu, o que aprendeu.", "@pessoa, #tema e [[meta]] ligam o texto ao resto do Atlas.", "Linhas com / registram dados (“/gasto 12 almoço”)."], min: "A frase do dia no Painel já entra aqui.", rap: "Uma entrada mais longa por semana; no dia a dia, a frase do Painel basta.", freq: "Semanal (texto longo)", tempo: 10 },
  jornada: { t: "Jornada existencial", o: ["Sessões de prática (meditação, estudo espírita, leitura) em Práticas, com o estado antes e depois.", "Exame da noite na Bússola moral.", "Uma vez por semana, a autoavaliação dos Centros de força.", "A estação de cada pilar, quando mudar."], min: "O exame da noite (1 a 2 min).", rap: "Depois de meditar, registre a sessão em Práticas (1 toque); antes de dormir, o exame da noite.", freq: "Diária (exame) e semanal (centros)", tempo: 3 },
  psi: { t: "Psicologia", o: ["Logo depois de cada sessão: temas, um insight e o combinado.", "Entre sessões: a pergunta do dia ou um registro de pensamento quando algo pesar.", "Padrões que se repetem, com nome."], min: "A sessão, no mesmo dia.", rap: "Sessões › nova sessão: três linhas (tema, insight, combinado).", freq: "A cada sessão", tempo: 5 },
  mentores: { t: "Mentores", o: ["Nada para preencher: converse quando precisar de um olhar de fora sobre uma área.", "Aceite (ou não) as propostas: só viram tarefa, meta ou hábito com o seu ok."], min: "—", rap: "Uma pergunta concreta ao mentor da área que mais pesou na semana.", freq: "Semanal, se quiser", tempo: 5 },
  admin: { t: "Administração Pessoal", o: ["Uma sessão do Conselho por mês: escolha o tipo e, se quiser, um foco.", "Marque as ações da ata como feitas ao longo do mês."], min: "A sessão mensal.", rap: "Primeira semana do mês: Iniciar sessão e responder quando o Intermediador chamar.", freq: "Mensal", tempo: 25 },
  fin: { t: "Finanças", o: ["Lançamentos: gastos e receitas (pelo Painel do dia, por voz, ou importando o extrato).", "Orçamento & patrimônio: teto por categoria, assinaturas e o patrimônio no fim do mês.", "Futuro financeiro: reserva, TFR e previdência (revisar de vez em quando).", "Itália & Brasil: prazos de documentos e custo de cada lado.", "Projetos & aquisições: o que você quer comprar ou financiar."], min: "Os gastos do dia no Painel e o patrimônio no fim do mês.", rap: "No dia: fale os gastos no Painel. Na semana: importe o extrato e confira as categorias. No mês: patrimônio e orçamento.", freq: "Diária (gastos), semanal (conferir), mensal (fechar)", tempo: 10 },
  saude: { t: "Saúde", o: ["Check-in: sono, humor, energia, estresse, passos, peso (pelo Painel; aqui só para corrigir).", "Treinos: a ficha e as séries na hora do treino; corridas.", "Alimentação: refeições e água, se estiver seguindo um plano com o Nutri."], min: "Sono e humor pelo Painel; o treino quando houver.", rap: "Na academia: Treinos › Treinar e marque as séries. Peso de manhã, 2 a 4 vezes por semana.", freq: "Diária (check-in) e a cada treino", tempo: 2 },
  hab: { t: "Hábitos", o: ["Poucos hábitos (3 a 5), cada um com meta de dias por semana.", "Marcar os feitos (pelo Painel do dia)."], min: "Marcar no Painel.", rap: "Fale “meditei, alonguei” no Painel; aqui só para criar e corrigir.", freq: "Diária (marcar) e mensal (rever a lista)", tempo: 1 },
  metas: { t: "Metas & tarefas", o: ["Metas com número e prazo.", "Tarefas com prazo (e prioridade quando importar), ligadas a uma meta.", "Concluir ao fazer."], min: "Capturar a tarefa na hora (botão Capturar).", rap: "Capturar (raio no topo): “Pagar o seguro até sexta !alta”. Na revisão da semana, ligue tarefas às metas.", freq: "Quando surgir (tarefas) e semanal (revisão)", tempo: 3 },
  pessoas: { t: "Relações", o: ["As pessoas importantes com a cadência de contato (de quanto em quanto tempo quer falar).", "Contatos: ligação, encontro, mensagem (pelo Painel)."], min: "Os contatos pelo Painel (“liguei para a mãe 20 min”).", rap: "Uma vez por semana, olhe quem está ficando distante e mande uma mensagem.", freq: "Diária (contatos) e semanal (quem está distante)", tempo: 2 },
  cresc: { t: "Crescimento", o: ["Aprendizado: o que você está estudando ou lendo, com o total de páginas ou aulas.", "Horas de estudo e páginas lidas (pelo Painel).", "Lazer & sonhos: experiências que quer viver."], min: "Estudo e leitura pelo Painel.", rap: "Ao começar um livro ou curso, cadastre uma vez; depois só o Painel.", freq: "Diária (horas) e mensal (sonhos)", tempo: 2 },
  carreira: { t: "Carreira", o: ["Perfil, cargo e avaliação atual (uma vez, revisar a cada trimestre).", "Objetivos e plano de ação: cada gap vira ação com prazo.", "Caderno técnico: fórmulas, normas e lições de obra.", "Rede profissional: contatos de trabalho com cadência.", "Decisões e mercado quando houver."], min: "Uma nota no Caderno técnico depois de estudar.", rap: "Depois de cada estudo técnico, 2 min no Caderno; uma vez por mês, o Plano de ação.", freq: "Semanal (caderno) e mensal (plano)", tempo: 5 },
  idiomas: { t: "Idiomas", o: ["Nível atual e meta de cada idioma (uma vez).", "Minutos por dia e janela de estudo.", "Cada sessão de estudo (pelo Painel ou aqui)."], min: "As sessões pelo Painel (“estudei 1 h de inglês”).", rap: "Na revisão da semana, olhe o plano; no dia, só a sessão.", freq: "A cada sessão", tempo: 1 },
  lazer: { t: "Lazer", o: ["Seus gostos em cada tema (uma vez).", "Registros: livro terminado, filme ou série, jogo, viagem, café novo, voo simulado.", "Conversas com o mentor do tema quando quiser ideias."], min: "Registrar quando terminar algo.", rap: "Ao fim de um livro ou filme: um registro com nota e uma frase.", freq: "Quando terminar algo", tempo: 1 },
  casa: { t: "Casa & docs", o: ["Limpeza: rotinas do leve ao pesado; marcar ao fazer.", "Compras: a lista (itens fixos voltam sozinhos).", "Contas: vencimentos; “Paguei” lança em Finanças.", "Documentos: onde estão e quando vencem."], min: "Marcar as contas pagas.", rap: "Uma vez por semana: limpeza feita, lista de compras e contas da semana.", freq: "Semanal", tempo: 5 },
  roda: { t: "Roda da Vida", o: ["Uma nota de 0 a 10 para cada área: como você sente que ela vai.", "A revisão do mês: o que funcionou e o que mudar."], min: "As notas.", rap: "Último fim de semana do mês, 10 minutos.", freq: "Mensal", tempo: 10 },
  semana: { t: "Fechamento da semana", o: ["Siga os passos: números, destaques, o que foi cumprido.", "As 3 prioridades da semana seguinte."], min: "As 3 prioridades.", rap: "Domingo à noite ou segunda: 15 minutos, de cima para baixo.", freq: "Semanal", tempo: 15 },
  radar: { t: "Radar", o: ["Marcar cada alerta como útil ou alarme falso (o Radar aprende)."], min: "—", rap: "Olhe no fechamento da semana.", freq: "Semanal", tempo: 1 },
  cruz: { t: "Cruzamentos", o: ["Nada para preencher: escolha uma pergunta (humor, sono, energia…) e leia as pistas.", "Uma pista forte pode virar experimento."], min: "—", rap: "Uma vez por mês, depois de pelo menos 20 dias de registros.", freq: "Mensal", tempo: 5 },
  exp: { t: "Experimentos", o: ["A hipótese, a métrica e o desenho (antes e depois, ou dias alternados).", "Nos dias do teste, seguir o que o Hoje indica e registrar normalmente."], min: "—", rap: "Crie a partir de uma pista dos Cruzamentos.", freq: "Quando houver um teste", tempo: 3 },
  capitulos: { t: "Capítulos", o: ["Dar nome às fases que o Atlas detecta.", "No fim do ano, gerar o livro em PDF."], min: "—", rap: "Uma vez por trimestre, 5 minutos.", freq: "Trimestral", tempo: 5 },
  dupla: { t: "A dois", o: ["O convite e o que compartilhar (uma vez).", "O que vocês decidirem registrar juntos: diário, orçamento comum, metas."], min: "—", rap: "Combine com a pessoa um momento fixo por semana.", freq: "Semanal, se usar", tempo: 5 },
  visao: { t: "Visão geral", o: ["Nada para preencher: é o retrato do mês com o que você registrou."], min: "—", rap: "Olhe no fechamento da semana e no do mês; toque no mês do gráfico para comparar.", freq: "Semanal (olhar)", tempo: 2 },
  mapa: { t: "Mapa do Atlas", o: ["Nada para preencher: índice de todas as abas e de para onde vão os dados."], min: "—", rap: "Use quando não lembrar onde algo fica.", freq: "Quando precisar", tempo: 0 },
  dados: { t: "Dados", o: ["Corrigir registros em massa, filtrar e exportar."], min: "—", rap: "Use para arrumar, não para registrar.", freq: "Quando precisar", tempo: 0 },
  integ: { t: "Integrações", o: ["Google Calendar (sincroniza sozinho depois de ligado), Notion, extratos.", "Backup completo."], min: "O backup do mês.", rap: "Primeira semana do mês: Exportar › Backup completo.", freq: "Mensal (backup)", tempo: 1 },
  privacidade: { t: "Privacidade", o: ["Setores que a IA não lê e o cofre com senha (uma vez)."], min: "—", rap: "Revise quando mudar o que quer compartilhar com a IA.", freq: "Uma vez", tempo: 3 },
  ajustes: { t: "Ajustes", o: ["As metas (sono, poupança, passos, estudo, lazer, livros, treinos), as listas e a aparência (uma vez)."], min: "—", rap: "Comece pelas metas: os relatórios passam a comparar com elas.", freq: "Uma vez (revisar a cada trimestre)", tempo: 5 },
};
/* ordem do índice: o que se preenche todo dia primeiro */
const GUIA_ORD = ["hoje", "painel", "rotina", "inspira", "trabalho", "saude", "fin", "jornada", "psi", "hab", "metas", "pessoas", "cresc", "idiomas", "carreira", "lazer", "casa", "diario", "semana", "roda", "admin", "mentores", "visao", "radar", "cruz", "exp", "capitulos", "dupla", "integ", "ajustes", "privacidade", "dados", "mapa"];
const GU = { sec: "", q: "" };
const guData = () => { const g = (S.guia ||= {}); g.segue ??= true; return g; };
const guAtual = () => GUIA[PAGE] ? PAGE : "";
/* quando a pessoa tem plano: itens do plano para esta aba (e para o dia/hora de agora) */
const guItensDe = aba => (guData().plano?.itens || []).filter(i => i.aba === aba || i.aba?.split(".")[0] === aba);
function guProximo(now = new Date()) {
  const P = guData().plano; if (!P?.itens?.length) return null;
  const dow = now.getDay(), m = now.getHours() * 60 + now.getMinutes(), cands = [];
  for (let k = 0; k < 8; k++) { const d = (dow + k) % 7, dia = addDays(TODAY, k);
    for (const i of P.itens) { const g = i.gatilho; if (!g?.titulo) continue; if (g.dias?.length && !g.dias.includes(d)) continue;
      for (const b of rtOcc(dia)) if (normNome(b.titulo) === normNome(g.titulo)) { const a = hm2min(b.ini) - (+g.min || 0) + k * 1440; if (a >= m - 20) cands.push({ i, dia, ini: b.ini, a }); } } }
  return cands.sort((x, y) => x.a - y.a)[0] || null;
}
function guSecaoHTML(k, aberta) {
  const g = GUIA[k]; if (!g) return ""; const pl = guItensDe(k), info = TAB_INFO[k] || {};
  return `<details class="gusec" data-gu="${k}"${aberta ? " open" : ""}><summary><b>${esc(g.t)}</b><small>${esc(pl.length ? pl.map(i => i.freq).filter((x, j, a) => a.indexOf(x) === j).join(" · ") : g.freq)}${g.tempo ? ` · ~${g.tempo} min` : ""}</small></summary>
    ${info.missao ? `<p class="gumis">${esc(info.missao)}</p>` : ""}
    <div class="gulbl">O que preencher</div><ul>${g.o.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
    ${g.min && g.min !== "—" ? `<div class="gulbl">O mínimo que já vale</div><p>${esc(g.min)}</p>` : ""}
    <div class="gulbl">Jeito rápido</div><p>${esc(g.rap)}</p>
    ${pl.length ? `<div class="gulbl">No seu plano</div><ul class="gupl">${pl.map(i => `<li><b>${esc(i.quando)}</b> · ${esc(i.freq)}${i.min ? ` · ${i.min} min` : ""}<br><span>${esc(i.como)}</span></li>`).join("")}</ul>` : ""}
    <a class="lnk small" href="#${k}">abrir ${esc(g.t)}</a></details>`;
}
function guPlanoHTML() {
  const P = guData().plano; if (!P?.itens?.length) return `<div class="secsec">${ic("cal")}Seu plano</div><small class="muted">Ainda sem plano pessoal de preenchimento. O guia abaixo traz a frequência sugerida de cada área.</small>`;
  const nx = guProximo(), R = P.resumo || {}, ls = lsData(), criados = P.itens.filter(i => i.gatilho?.titulo && guTemLeb(i.id)).length, comG = P.itens.filter(i => i.gatilho?.titulo).length;
  const grupos = [["diária", "Todo dia"], ["semanal", "Toda semana"], ["mensal", "Todo mês"], ["tri", "A cada trimestre"], ["outra", "Quando acontecer"]];
  const grupo = i => /di[aá]ria|todo dia|dias úteis/i.test(i.freq) ? "diária" : /seman/i.test(i.freq) ? "semanal" : /mens/i.test(i.freq) ? "mensal" : /trimes/i.test(i.freq) ? "tri" : "outra";
  return `<div class="secsec">${ic("cal")}Seu plano<small>${esc(P.base || "")}</small></div>
    ${nx ? `<div class="secfoco"><small>PRÓXIMO PREENCHIMENTO</small><b>${esc(nx.i.titulo)}</b><span>${nx.dia === TODAY ? "hoje" : fmtDL(nx.dia)} · ${esc(nx.i.quando)}${nx.i.min ? ` · ${nx.i.min} min` : ""}</span><a class="lnk small" href="#${esc(nx.i.aba)}">abrir</a></div>` : ""}
    ${R.dia || R.semana || R.mes ? `<p class="small muted">Tempo: ${[R.dia && `~${R.dia} min por dia`, R.semana && `~${R.semana} min por semana`, R.mes && `~${R.mes} min por mês`].filter(Boolean).join(" · ")}.</p>` : ""}
    ${grupos.map(([g, l]) => { const its = P.itens.filter(i => grupo(i) === g); return its.length ? `<div class="gulbl">${l}</div><ul class="gupl">${its.map(i => `<li><b>${esc(i.titulo)}</b> · ${esc(i.quando)}${i.min ? ` · ${i.min} min` : ""}<br><span>${esc(i.como)}</span></li>`).join("")}</ul>` : ""; }).join("")}
    ${comG ? `<div class="row wrap">${criados < comG ? `<button type="button" class="btn sm primary" data-act="guleb">${ic("clock")}Criar os lembretes do plano (${comG - criados})</button>` : `<span class="pill good">Lembretes do plano criados</span>`}${criados ? `<button type="button" class="btn sm ghost" data-act="gulebx">Tirar os lembretes do plano</button>` : ""}</div><small class="muted">Viram lembretes semanais na Rotina, ligados à atividade de cada momento, com o que fazer na nota.</small>` : ""}`;
}
function guHTML() {
  const G = guData(), q = normNome(GU.q), cur = guAtual(), sec = G.segue && cur ? cur : GU.sec;
  const ks = GUIA_ORD.filter(k => GUIA[k] && (!q || normNome(`${GUIA[k].t} ${GUIA[k].o.join(" ")} ${GUIA[k].rap}`).includes(q)));
  return `<div class="gutop"><input type="search" id="gu_q" value="${esc(GU.q)}" placeholder="Buscar no guia (ex.: gastos, treino)" aria-label="Buscar no guia"><label class="chk"><input type="checkbox" data-act="guseg"${G.segue ? " checked" : ""}><span>Acompanhar a aba</span></label></div>
    ${q ? "" : guPlanoHTML()}
    ${sec && GUIA[sec] && !q ? `<div class="secsec">${ic("compass")}${cur === sec ? "Nesta aba" : "Seção aberta"}</div>${guSecaoHTML(sec, true)}` : ""}
    <div class="secsec">${ic("list")}${q ? `Resultado (${ks.length})` : "Todas as áreas"}</div>${ks.filter(k => q || k !== sec).map(k => guSecaoHTML(k, !!q && ks.length <= 3)).join("") || `<div class="secempty">Nada encontrado para “${esc(GU.q)}”.</div>`}`;
}
/* abrir o guia numa seção (pedido em texto, pela IA ou pela paleta) */
function guAbrir(aba) { const k = GUIA[aba] ? aba : GUIA[String(aba || "").split(".")[0]] ? String(aba).split(".")[0] : ""; GU.sec = k; GU.q = ""; if (k && k !== guAtual()) guData().segue = false; SEC.tab = "guia"; SEC.cfg = false; if (!SEC.open) secToggle(true); else secPaint(); }
const GU_PEDE = /\b(tutorial|guia|manual|como (?:eu )?(?:preencho|preencher|uso|usar|registro|registrar)|o que (?:eu )?(?:preencho|preencher|registro|registrar))\b/;
function guLocal(F) {
  if (!GU_PEDE.test(F)) return null;
  const chave = k => { const w = normNome(GUIA[k].t).split(" ").filter(x => x.length >= 4); return w[0] || normNome(GUIA[k].t); };
  const alvo = Object.keys(GUIA).find(k => new RegExp(`\\b${chave(k)}`).test(F)) || (SEC_GO.find(([rx]) => rx.test(F)) || [])[1]?.split(".")[0];
  guAbrir(alvo || guAtual());
  return alvo && GUIA[alvo] ? `Abri o guia em **${GUIA[alvo].t}**, aqui ao lado. Ele fica aberto enquanto você navega.` : `Abri o guia aqui ao lado${guAtual() ? `, na seção de **${GUIA[guAtual()].t}**` : ""}. Ele fica aberto enquanto você navega.`;
}
/* lembretes do plano: um por gatilho, com a nota do que fazer e o id do item do plano (para tirar depois). Se a pessoa já tem um
   lembrete da mesma atividade nos mesmos dias, a nota do plano entra nele (dois lembretes da mesma atividade não tocam: vale o primeiro);
   tirar o plano devolve a nota original e mantém o lembrete. */
const guTemLeb = id => lsData().some(r => r.plano === id || r.planoNota === id);
function guLembretes(criar) {
  const P = guData().plano; if (!P?.itens) return;
  if (!criar) { let n = 0; for (const r of lsData()) if (r.planoNota) { r.nota = r.notaOrig || ""; delete r.notaOrig; delete r.planoNota; n++; }
    n += lsData().filter(r => r.plano).length; secData().semanais = lsData().filter(r => !r.plano); touch("secretario", { label: "Lembretes do plano" }); undoToast(`${plural(n, "lembrete do plano saiu", "lembretes do plano saíram")}`); return; }
  let n = 0, j = 0; for (const i of P.itens) { const g = i.gatilho; if (!g?.titulo || guTemLeb(i.id)) continue;
    const dias = lsOrdDow(g.dias || []), nota = `${i.titulo}${i.min ? `, ${i.min} min` : ""}`;
    const ex = lsData().find(r => !r.plano && !r.planoNota && normNome(r.titulo) === normNome(g.titulo) && (!r.dias?.length || !dias.length || r.dias.some(d => dias.includes(d))));
    if (ex) { ex.notaOrig = ex.nota || ""; ex.nota = ex.nota ? `${ex.nota} · ${nota}` : nota; ex.planoNota = i.id; j++; continue; }
    lsData().push({ id: uid(), titulo: g.titulo, dias, min: +g.min || 0, on: true, nota, plano: i.id }); n++; }
  touch("secretario", { label: "Lembretes do plano" }); undoToast(`${plural(n, "lembrete criado", "lembretes criados")} a partir do plano${j ? ` · ${j} juntado(s) a lembrete(s) que você já tinha` : ""}`);
}
function guClick(t) {
  const ds = t.dataset;
  if (ds.act === "guseg") { guData().segue = t.checked; touch("guia", { noUndo: true, noRender: true }); secPaint(); return true; }
  if (ds.act === "guleb") { guLembretes(true); secPaint(); return true; }
  if (ds.act === "gulebx") { guLembretes(false); secPaint(); return true; }
  return false;
}
function guInput(t) { if (t.id !== "gu_q") return false; GU.q = t.value; const p = t.selectionStart; secPaint(); const n = $("#gu_q"); if (n) { n.focus({ preventScroll: true }); n.setSelectionRange(p, p); } return true; }
