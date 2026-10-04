
/* ================================================================ dados de exemplo (fictícios) */
function exampleData() {
  let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(R() * a.length)];
  const D = EMPTY(); D.cfg.nome = "";
  const start = addDays(TODAY, -240), end = addDays(TODAY, -1);
  const TRE = DEFAULT_LISTS().treinos;
  // finanças
  for (let mk = mkey(start); mk <= mkey(TODAY); mk = addMonth(mk, 1)) {
    const d = n => `${mk}-${pad(Math.min(n, dim(mk)))}`;
    const add = (dt, tipo, cat, desc, valor, conta) => { if (dt >= start && dt <= end) D.lanc.push({ id: uid(), data: dt, tipo, cat, desc, valor: Math.round(valor * 100) / 100, conta }); };
    add(d(1), "Despesa", "Moradia", "Aluguel + condomínio", 650, "PIX / transferência");
    add(d(10), "Receita", "Salário", "Salário líquido", 2450, "Conta corrente");
    add(d(28), "Receita", "Rendimentos", "Rendimento da reserva", 14 + R() * 6, "Conta corrente");
    if (R() < .3) add(d(20), "Receita", "Renda extra / freelance", "Projeto freelance", 350 + R() * 250, "PIX / transferência");
    add(d(2), "Despesa", "Transporte", "Passe de transporte", 38, "Cartão de débito");
    add(d(3), "Despesa", "Assinaturas", "Streaming + música", 20.98, "Cartão de crédito");
    add(d(4), "Despesa", "Saúde & bem-estar", "Academia", 34.9, "Cartão de crédito");
    add(d(5), "Despesa", "Contas da casa", "Internet + celular", 35.94, "Conta corrente");
    add(d(12), "Despesa", "Contas da casa", "Luz e gás", 60 + R() * 50, "Conta corrente");
    add(d(9), "Despesa", "Dívidas & financiamentos", "Financiamento estudantil", 90.83, "Conta corrente");
    add(d(7), "Despesa", "Educação & cursos", "Mensalidade do curso", 180, "Conta corrente");
    add(d(10), "Despesa", "Família & ajudas", "Ajuda à família", 75, "PIX / transferência");
    for (let i = 0; i < 6; i++) add(d(1 + Math.floor(R() * 28)), "Despesa", "Mercado", pick(["Supermercado", "Feira", "Padaria"]), 20 + R() * 50, "Cartão de débito");
    for (let i = 0; i < 5; i++) add(d(1 + Math.floor(R() * 28)), "Despesa", "Restaurantes & cafés", pick(["Pizzaria", "Café", "Almoço fora", "Aperitivo"]), 7 + R() * 28, "Cartão de crédito");
    for (let i = 0; i < 2; i++) add(d(1 + Math.floor(R() * 28)), "Despesa", "Lazer & passeios", pick(["Cinema", "Museu", "Show"]), 10 + R() * 30, "Cartão de crédito");
    if (R() < .4) add(d(15), "Despesa", "Roupas", "Roupas", 30 + R() * 80, "Cartão de crédito");
    if (R() < .25) add(d(18), "Despesa", "Viagens", "Viagem de fim de semana", 180 + R() * 300, "Cartão de crédito");
    if (R() < .5) add(d(21), "Despesa", "Livros & materiais", pick(["Livro", "Material do curso"]), 12 + R() * 25, "Cartão de crédito");
    add(d(11), "Aporte", "Reserva de emergência", "Transferência para a reserva", 200, "PIX / transferência");
    add(d(11), "Aporte", "Investimentos", "Aporte mensal", 150, "PIX / transferência");
  }
  Object.assign(D.orc, { "Moradia": 650, "Contas da casa": 110, "Mercado": 260, "Transporte": 60, "Saúde & bem-estar": 50, "Dívidas & financiamentos": 91, "Família & ajudas": 75, "Restaurantes & cafés": 100, "Assinaturas": 25, "Lazer & passeios": 60, "Viagens": 80, "Roupas": 40, "Educação & cursos": 180, "Livros & materiais": 25 });
  let i = 0;
  for (let mk = mkey(start); mk < mkey(TODAY); mk = addMonth(mk, 1), i++) D.patr[mk] = { contas: Math.round(1400 + R() * 300), reserva: 4000 + 200 * i, invest: 2800 + 160 * i, outros: 0, dividas: Math.round(6200 - 91 * i) };
  // saúde + hábitos
  D.habitos = [
    { id: "h1", nome: "Treinar", area: "Saúde física", meta: 4 }, { id: "h2", nome: "Meditar 10 min", area: "Saúde mental", meta: 6 },
    { id: "h3", nome: "Ler 20 páginas", area: "Aprendizado", meta: 5 }, { id: "h4", nome: "Estudar italiano", area: "Aprendizado", meta: 5 },
    { id: "h5", nome: "Dormir até 23h30", area: "Saúde física", meta: 6 }, { id: "h6", nome: "Journaling", area: "Saúde mental", meta: 5 },
    { id: "h7", nome: "Planejar o dia", area: "Casa & organização", meta: 5 }, { id: "h8", nome: "Falar com alguém querido", area: "Amizades & social", meta: 3 },
    { id: "h9", nome: "Prática espiritual", area: "Propósito & espiritualidade", meta: 4 }];
  const pr = { h2: [.45, .88], h3: [.5, .8], h4: [.5, .62], h5: [.35, .6], h6: [.4, .38], h7: [.5, .82], h8: [.3, .5], h9: [.35, .32] };
  let peso = 84.2;
  for (let k = 0, dt = start; dt <= end; k++, dt = addDays(dt, 1)) {
    const p = k / 240, wd = parse(dt).getDay(), e = {};
    /* duas fases de propósito, para os capítulos terem o que achar: prazo apertado (dias 105–146) e um verão leve, com férias (dias 175–216).
       Só mudam médias e probabilidades; a sequência aleatória continua a mesma. */
    const ph = k >= 105 && k < 147 ? -1 : k >= 175 && k < 217 ? 1 : 0;
    const did = {}; for (const h in pr) did[h] = R() < pr[h][0] + (pr[h][1] - pr[h][0]) * p - (ph < 0 ? .2 : 0);
    const tr = R() < [.25, .75, .25, .75, .2, .6, .55][wd] * (.8 + .3 * p) * (ph < 0 ? .45 : 1);
    if (R() < .88) {
      e.sono = Math.round(clamp(6.5 + .8 * p + (did.h5 ? .45 : -.2) + (ph < 0 ? -.9 : ph > 0 ? .7 : 0) + (R() - .5) * 1.4, 4.5, 9) * 2) / 2;
      const boost = (e.sono >= 7.5 ? .35 : -.15) + (did.h2 ? .25 : 0) + (tr ? .2 : 0) + (ph < 0 ? -.6 : ph > 0 ? .8 : 0);
      e.humor = Math.round(clamp(3 + .6 * p + boost + (R() - .5) * 1.8, 1, 5)); e.energia = Math.round(clamp(2.9 + .6 * p + (tr ? .45 : 0) + (e.sono >= 7.5 ? .2 : -.2) + (R() - .5) * 1.8, 1, 5));
      e.estresse = Math.round(clamp(3.3 - .8 * p - (did.h2 ? .35 : 0) - (did.h7 ? .2 : 0) + (ph < 0 ? 1.1 : ph > 0 ? -1 : 0) + (R() - .5) * 1.8, 1, 5)); e.passos = Math.round(6500 + 2000 * p + R() * 3000 + (tr ? 1500 : 0));
      e.qual = Math.round(clamp(2.8 + (e.sono - 6.5) * .7 + (R() - .5) * 1.4, 1, 5));
    }
    if (tr) { e.treino = pick(TRE.slice(0, 6)); e.min = pick([30, 45, 60, 75]); D.marks["h1|" + dt] = 1; }
    if (wd === 1) { peso -= R() * .45 - .1; e.peso = Math.round(peso * 10) / 10; }
    if (Object.keys(e).length) D.saude[dt] = e;
    for (const h in did) if (did[h]) D.marks[h + "|" + dt] = 1;
  }
  // roda + revisões
  const base = [5, 4, 5, 5, 6, 7, 8, 4, 4, 5, 5], trd = [.35, .4, .3, .15, .25, .1, .05, .3, .3, .2, .25];
  AREAS.forEach((a, j) => D.alvo[a] = [8, 8, 8, 8, 8, 9, 9, 7, 7, 8, 8][j]);
  i = 0;
  for (let mk = mkey(start); mk < mkey(TODAY); mk = addMonth(mk, 1), i++) {
    D.roda[mk] = {}; AREAS.forEach((a, j) => D.roda[mk][a] = clamp(Math.round(base[j] + trd[j] * i + (R() - .5) * 1.4), 1, 10));
    D.revisao[mk] = { nota: clamp(6 + Math.round(i / 3), 1, 10), vitorias: pick(["Entreguei o módulo do curso no prazo.", "Primeiro mês sem estourar o orçamento.", "Freelance entregue com elogio do cliente.", "Voltei a treinar 4×/semana."]), naofunc: pick(["Dormi tarde na maioria dos dias.", "Pouco contato com amigos daqui.", "Gastei mais com restaurantes."]), aprendi: pick(["Hábito pequeno vence hábito ambicioso.", "Blocos fixos de estudo funcionam melhor.", "Convidar é mais fácil do que esperar convite."]), foco: pick(["Preparar a entrevista e fechar o diploma.", "Dormir até 23h30 em 5 dias da semana.", "Reconectar com 2 amigos."]) };
  }
  // metas
  const y = TODAY.slice(0, 4), ys = +y;
  D.metas = [
    { meta: "Concluir o Master BIM", area: "Carreira", inicio: addDays(TODAY, -360), prazo: addDays(TODAY, 75), un: "módulos", ini: 0, atual: 5, alvo: 8, proximo: "Modelar instalações hidráulicas" },
    { meta: "Atingir nível B2 em italiano", area: "Aprendizado", inicio: addDays(TODAY, -270), prazo: addDays(TODAY, 90), un: "nível", manual: .6, proximo: "Simulado de leitura no sábado" },
    { meta: "Reserva de emergência de 6 meses", area: "Finanças", inicio: addDays(TODAY, -270), prazo: addDays(TODAY, 90), un: "€", ini: 4000, atual: 5600, alvo: 7000, proximo: "Manter aporte de € 200 no dia 11" },
    { meta: "Chegar a 78 kg", area: "Saúde física", inicio: addDays(TODAY, -240), prazo: addDays(TODAY, 90), un: "kg", ini: 84.2, atual: Math.round(peso * 10) / 10, alvo: 78 },
    { meta: "Ler 12 livros no ano", area: "Aprendizado", inicio: `${y}-01-01`, prazo: `${y}-12-31`, un: "livros", ini: 0, atual: 9, alvo: 12 },
    { meta: "40 conversas longas com a família", area: "Família", inicio: `${y}-01-01`, prazo: `${y}-12-31`, un: "conversas", ini: 0, atual: 31, alvo: 40 },
    { meta: "Rede de 8 amigos próximos na cidade", area: "Amizades & social", inicio: `${y}-01-01`, prazo: `${y}-12-31`, un: "pessoas", ini: 2, atual: 6, alvo: 8 },
    { meta: "Validar o diploma de engenharia", area: "Casa & organização", inicio: addDays(TODAY, -240), prazo: addDays(TODAY, -2), un: "marco", manual: .7, proximo: "Cobrar a tradução juramentada" },
    { meta: "Voluntariado 1×/mês", area: "Propósito & espiritualidade", inicio: `${y}-01-01`, prazo: `${y}-12-31`, un: "ações", ini: 0, atual: 5, alvo: 12 },
    { meta: "Organizar a vida digital", area: "Casa & organização", inicio: addDays(TODAY, -10), prazo: addDays(TODAY, 45), un: "marco", manual: .2 },
    { meta: "Reserva de 12 meses de despesas", area: "Finanças", inicio: `${y}-01-01`, prazo: `${ys + 2}-12-31`, un: "€", ini: 4000, atual: 5600, alvo: 24000 },
    { meta: "Dar aulas em uma pós-graduação", area: "Carreira", inicio: `${y}-01-01`, prazo: `${ys + 4}-12-31`, un: "marco", manual: .1 },
  ].map(m => ({ id: uid(), status: "Ativa", proximo: "", ...m }));
  // tarefas
  const T = (tarefa, projeto, area, prio, dd, status = "A fazer", concl = null, meta = "") => ({ id: uid(), tarefa, projeto, area, prio, prazo: dd == null ? "" : addDays(TODAY, dd), status, concluida: concl == null ? "" : addDays(TODAY, concl), meta });
  D.tarefas = [T("Enviar tradução juramentada", "Validação do diploma", "Casa & organização", "Alta", -7, "Aguardando", null, "Validar o diploma de engenharia"), T("Revisar famílias Revit do módulo", "Master BIM", "Carreira", "Média", -6, "A fazer", null, "Concluir o Master BIM"),
    T("Follow-up com recrutadora", "Troca de emprego", "Carreira", "Média", -3), T("Atualizar portfólio", "Troca de emprego", "Carreira", "Média", 1), T("Renovar CNH (agendar)", "", "Casa & organização", "Alta", 2),
    T("Preparar a 2ª entrevista", "Troca de emprego", "Carreira", "Alta", 4, "Em andamento"), T("Pesquisar passagens para dezembro", "Natal com a família", "Família", "Alta", 6),
    T("Modelar instalações hidráulicas", "Master BIM", "Carreira", "Alta", 8, "Em andamento", null, "Concluir o Master BIM"), T("Backup completo do notebook", "Organização digital", "Casa & organização", "Média", 10, "A fazer", null, "Organizar a vida digital"),
    T("Escrever relatório do módulo", "Master BIM", "Carreira", "Alta", 26, "A fazer", null, "Concluir o Master BIM"), T("Lista de presentes", "Natal com a família", "Família", "Baixa", 49),
    T("Enviar 3 candidaturas", "Troca de emprego", "Carreira", "Alta", -17, "Concluída", -18), T("Pagar taxa da apostila", "Validação do diploma", "Casa & organização", "Média", -22, "Concluída", -20, "Validar o diploma de engenharia"),
    T("Revisar orçamento do mês", "", "Finanças", "Média", -2, "Concluída", -2), T("Ler capítulo de coordenação 4D", "Master BIM", "Carreira", "Baixa", -12, "Concluída", -13, "Concluir o Master BIM"),
    T("Comprar tênis de corrida", "", "Saúde física", "Baixa", -30, "Concluída", -31), T("Marcar check-up anual", "", "Saúde física", "Média", 14),
    T("Inscrição no workshop de BIM 4D", "Master BIM", "Carreira", "Média", -40, "Concluída", -41), T("Organizar pastas de fotos", "Organização digital", "Casa & organização", "Baixa", 20, "A fazer", null, "Organizar a vida digital")];
  // pessoas e contatos
  const P = (nome, relacao, freq, aniv, stopAgo, notas = "") => ({ id: uid(), nome, relacao, freq, aniv: aniv == null ? "" : addDays(TODAY, aniv).replace(/^\d{4}/, "1990"), notas, _stop: stopAgo || 1 });
  D.pessoas = [P("Mãe", "Família", 7, 32, 1, "Gosta de receber fotos do dia a dia."), P("Pai", "Família", 7, 17), P("Rafael (irmão)", "Família", 14, 202, 1, "Vai ser pai em breve."), P("Tia Regina", "Família", 60, 26, 118), P("Chiara", "Parceria", 3, 67),
    P("Marco", "Amizade", 14, 9), P("Pedro (Brasil)", "Amizade", 30, 135, 91), P("Lucas", "Amizade", 21, 271, 1, "Parceiro de trilha."), P("Francesca", "Amizade", 30, 158), P("Davide", "Amizade", 30, 327, 1, "Arquiteto, adora museus."), P("Prof.ª Rossi", "Mentoria", 45, 110, 130, "Professora de italiano; já deu aula em pós.")];
  for (const p of D.pessoas) {
    let dt = addDays(start, Math.floor(R() * p.freq));
    while (dt <= addDays(TODAY, -p._stop)) {
      const tipo = p.relacao === "Família" ? pick(["Ligação", "Videochamada", "Mensagem"]) : p.relacao === "Parceria" ? "Encontro" : pick(["Encontro", "Mensagem", "Ligação"]);
      D.contatos.push({ id: uid(), data: dt, pessoa: p.nome, tipo, qual: clamp(Math.round(3.8 + (R() - .5) * 2), 1, 5), min: tipo === "Mensagem" ? 10 : pick([30, 60, 90]) });
      if (D.saude[dt]?.humor != null && tipo !== "Mensagem" && R() < .6) D.saude[dt].humor = Math.min(5, D.saude[dt].humor + 1);
      dt = addDays(dt, Math.max(1, Math.round(p.freq * (.7 + R() * .5))));
    }
    delete p._stop;
  }
  // aprendizado
  D.aprend = [
    { titulo: "Master BIM — módulos", tipo: "Curso", area: "Carreira", status: "Em andamento", total: 8, atual: 5 },
    { titulo: "Italiano B1 → B2", tipo: "Idioma", area: "Aprendizado", status: "Em andamento", total: 120, atual: 78 },
    { titulo: "Python para engenheiros", tipo: "Curso", area: "Carreira", status: "Em andamento", total: 40, atual: 14 },
    { titulo: "Hábitos Atômicos", tipo: "Livro", area: "Aprendizado", status: "Concluído", total: 320, atual: 320, nota: 5, fim: `${y}-01-28` },
    { titulo: "Deep Work", tipo: "Livro", area: "Carreira", status: "Concluído", total: 300, atual: 300, nota: 4, fim: `${y}-02-26` },
    { titulo: "Essencialismo", tipo: "Livro", area: "Aprendizado", status: "Concluído", total: 270, atual: 270, nota: 5, fim: `${y}-04-25` },
    { titulo: "A Psicologia Financeira", tipo: "Livro", area: "Finanças", status: "Concluído", total: 300, atual: 300, nota: 5, fim: `${y}-05-29` },
    { titulo: "Comunicação Não-Violenta", tipo: "Livro", area: "Amor & parceria", status: "Concluído", total: 280, atual: 280, nota: 4, fim: `${y}-06-30` },
    { titulo: "Sapiens", tipo: "Livro", area: "Aprendizado", status: "Concluído", total: 460, atual: 460, nota: 4, fim: `${y}-08-05` },
    { titulo: "Il nome della rosa", tipo: "Livro", area: "Aprendizado", status: "Em andamento", total: 500, atual: 120 },
  ].map(a => ({ id: uid(), nota: "", fim: "", ...a }));
  for (let dt = start; dt <= end; dt = addDays(dt, 1)) {
    const wd = parse(dt).getDay(), kk = diff(dt, start), leve = kk >= 175 && kk < 217, aperto = kk >= 105 && kk < 147;   // as mesmas fases do laço de saúde
    if ((wd === 2 || wd === 4) && R() < (leve ? .25 : .85)) D.estudo.push({ id: uid(), data: dt, item: "Italiano B1 → B2", horas: pick([1, 1.5]) });
    if ((wd === 0 || wd === 6) && R() < (leve ? .1 : aperto ? .95 : .8)) D.estudo.push({ id: uid(), data: dt, item: "Master BIM — módulos", horas: pick([1.5, 2, 2.5]) * (aperto ? 1.6 : 1) });
    if (wd === 3 && R() < (leve ? .1 : .5)) D.estudo.push({ id: uid(), data: dt, item: "Python para engenheiros", horas: 1 });
    if (R() < (.3 + (wd === 0 || wd === 6 ? .15 : 0)) * (leve ? 1.9 : aperto ? .45 : 1)) { const a = pick([["Trilha nas colinas", "Esporte / ar livre", 4, 0], ["Cinema", "Cultura", 2.5, 18], ["Jantar com amigos", "Social", 3, 30], ["Tocar violão", "Música", 1, 0], ["Museu", "Cultura", 3, 15], ["Jogos de tabuleiro", "Jogos", 3, 0]]);
      D.lazer.push({ id: uid(), data: dt, atividade: a[0], cat: a[1], horas: a[2], custo: a[3], sat: clamp(Math.round(4 + (R() - .5) * 2), 1, 5) }); }
  }
  D.sonhos = [{ sonho: "Ver a aurora boreal", status: "Sonho", custo: 2500 }, { sonho: "Correr a meia maratona", status: "Planejando", custo: 40 }, { sonho: "Viagem para a Sicília", status: "Realizado", custo: 700 }, { sonho: "Esquiar nos Alpes", status: "Planejando", custo: 400 }].map(s => ({ id: uid(), ...s }));
  // casa
  D.docs = [{ doc: "Permesso di soggiorno", validade: addDays(TODAY, 49), acao: "Agendar na Questura" }, { doc: "CNH brasileira", validade: addDays(TODAY, 23), acao: "Agendar no consulado" }, { doc: "Passaporte", validade: addDays(TODAY, 1680), acao: "" }, { doc: "Contrato de aluguel", validade: addDays(TODAY, 640), acao: "" }, { doc: "Codice fiscale", validade: "", acao: "" }].map(d => ({ id: uid(), ...d }));
  D.rotinas = [["Trocar roupa de cama", 7, -4], ["Limpeza pesada do banheiro", 14, -18], ["Limpar a geladeira", 30, -26], ["Backup do computador", 30, -43], ["Revisar senhas", 90, -93], ["Conferir extratos", 7, -5], ["Regar as plantas", 7, -3], ["Revisão da bicicleta", 180, -175]].map(([rotina, freq, u]) => ({ id: uid(), rotina, freq, ultima: addDays(TODAY, u) }));
  D.assin = [["Streaming de vídeo", 9.99, "Mensal", "Médio"], ["Música", 10.99, "Mensal", "Alto"], ["Leitura digital", 9.99, "Mensal", "Baixo"], ["Nuvem", 2.99, "Mensal", "Alto"], ["Academia", 34.9, "Mensal", "Alto"], ["App de idiomas", 84, "Anual", "Médio"], ["Rede profissional premium", 39.99, "Mensal", "Baixo"]].map(([servico, valor, periodo, uso]) => ({ id: uid(), servico, valor, periodo, uso }));
  D.comp = [["Revit / modelagem BIM", 3, 5], ["Coordenação e clash detection", 2, 4], ["Dynamo / Python", 2, 4], ["Italiano técnico", 3, 5], ["Gestão de projetos", 3, 4], ["Inglês", 4, 4]].map(([nome, atual, alvo]) => ({ id: uid(), nome, atual, alvo }));
  D.cand = [{ empresa: "Construtora Alfa", cargo: "Coordenador BIM", data: addDays(TODAY, -30), etapa: "Entrevista", acao: "Preparar o case", dataAcao: addDays(TODAY, 4) }, { empresa: "Engenharia Beta", cargo: "BIM Specialist", data: addDays(TODAY, -18), etapa: "Aplicado", acao: "Follow-up por e-mail", dataAcao: addDays(TODAY, -3) }, { empresa: "Consultoria Zeta", cargo: "BIM Coordinator", data: addDays(TODAY, -38), etapa: "Teste / case", acao: "Entregar teste técnico", dataAcao: addDays(TODAY, 1) }, { empresa: "Studio Gamma", cargo: "BIM Modeler", data: addDays(TODAY, -60), etapa: "Recusado", acao: "", dataAcao: "" }, { empresa: "Delta Engenharia", cargo: "Coordenador de projetos", data: addDays(TODAY, -45), etapa: "Aplicado", acao: "", dataAcao: "" }].map(c => ({ id: uid(), ...c }));
  D.prio = ["Preparar a 2ª entrevista", "Fechar a tradução do diploma", "Treinar 4×"];
  D.regras = [["esselunga", "Mercado"], ["conad", "Mercado"], ["trenitalia", "Transporte"], ["atm milano", "Transporte"], ["netflix", "Assinaturas"], ["spotify", "Assinaturas"], ["farmacia", "Saúde & bem-estar"], ["enel", "Contas da casa"]].map(([termo, cat]) => ({ id: uid(), termo, cat, tipo: "Despesa" }));
  exampleDiary(D, R, start, end);
  exampleMentors(D);
  exampleLab(D);
  return D;
}

/* laboratório de exemplo: experimentos, semanas fechadas, agenda, radar e registro da IA (tudo fictício) */
function exampleLab(D) {
  const keep = S; S = D; applyLists(); VER++;
  try {
    const rnd = mulberry32(2026), mk = mkey(TODAY), at = n => Date.now() - n * 864e5;
    /* noites curtas seguidas costumam vir antes de um dia pesado (para o radar ter o que mostrar) */
    for (const d of Object.keys(D.saude).sort()) { const v = [1, 2, 3].map(k => D.saude[addDays(d, -k + 1)]?.sono).filter(isNum); if (v.length >= 2 && avg(v) < D.cfg.metaSono - 1) { const nx = D.saude[addDays(d, 1 + Math.floor(rnd() * 2))]; if (nx && isNum(nx.humor) && rnd() < .6) nx.humor = Math.min(nx.humor, 2); } }
    const x1 = { id: "ex1", titulo: "Celular fora do quarto", intervencao: "Deixar o celular na sala a partir das 22h", hipotese: "Se eu dormir longe do celular, o humor do dia seguinte melhora.", metrica: "bem", direcao: "aumentar", desenho: "alternado", bloco: 4, dias: 28, inicio: addDays(TODAY, -84), defasagem: 1, status: "concluido", adesao: {}, seed: 4242, criado: at(85) };
    for (const [d, c] of Object.entries(expSchedule(x1))) { const did = c === "B" ? (rnd() < .9 ? 1 : 0) : (rnd() < .08 ? 1 : 0); x1.adesao[d] = did; const nx = addDays(d, 1), h = D.saude[nx]; if (!h || h.humor == null) continue; if (did && rnd() < .38) h.humor = Math.min(5, h.humor + 1); else if (!did && rnd() < .12) h.humor = Math.max(1, h.humor - 1); }
    x1.fim = addDays(x1.inicio, 28);
    const x2 = { id: "ex2", titulo: "Caminhar depois do almoço", intervencao: "Caminhar 20 minutos depois do almoço", hipotese: "Uma caminhada curta depois do almoço segura a energia da tarde.", metrica: "energia", direcao: "aumentar", desenho: "alternado", bloco: 3, dias: 24, inicio: addDays(TODAY, -16), defasagem: 0, status: "ativo", adesao: {}, seed: 777, criado: at(10) };
    for (const [d, c] of Object.entries(expSchedule(x2))) if (d < TODAY) x2.adesao[d] = c === "B" ? (rnd() < .85 ? 1 : 0) : 0;
    D.experimentos = [x1, x2]; VER++;
    const an = expAnalyze(x1); x1.conclusao = `${an.vt}: ${expSentence(x1, an)}`;
    const notes = [["Entreguei o módulo 5 do Master BIM no prazo.", "Dormi tarde três noites seguidas.", "Bloco fixo de estudo no sábado de manhã funciona.", 7], ["Primeira entrevista feita, e fui bem na parte técnica.", "Pulei dois treinos por causa de reunião.", "Treino de manhã não compete com o trabalho.", 6], ["Jantar com amigos e um domingo sem celular.", "Restaurantes passaram do teto de novo.", "Teto semanal é mais fácil de seguir do que o mensal.", 8]];
    notes.forEach(([v, n, a, nota], i) => { const wk = addDays(weekStart(TODAY), -7 * (3 - i)), pr = ["Preparar a 2ª entrevista", "Fechar a tradução do diploma", "Treinar 4×"], feitas = [true, i === 2, i !== 1], nx = i === 2 ? D.prio : pr;
      const d = { status: "fechado", at: parse(addDays(wk, 6)).getTime(), destaques: [], prioAnt: pr, prioFeitas: feitas, vitoria: v, naofunc: n, aprendi: a, nota, proximas: nx }; d.carta = fsLocalLetter(wk, d); D.fechamentos[wk] = d; });
    D.eventos = [["Dentista", 2, "09:30", "10:15", "Studio dentistico"], ["Aula de italiano", 3, "18:30", "20:00", "Scuola Dante"], ["Jantar com a Chiara", 5, "20:00", "", ""], ["Aula de italiano", 10, "18:30", "20:00", "Scuola Dante"], ["Revisão do contrato de aluguel", 12, "11:00", "11:30", "Imobiliária"]].map(([t, k, h, f, l], i) => ({ id: uid(), uid: `ex-ev-${i}`, data: addDays(TODAY, k), hora: h, fim: f, titulo: t, local: l, fonte: "ics" }));
    const pm = addMonth(mk, -1);
    D.radar = { log: [
      { key: `orc:Restaurantes & cafés:${pm}`, tipo: "orcamento", alvo: "Restaurantes & cafés", titulo: "Restaurantes & cafés deve estourar por volta de 22/" + pm.slice(5), criado: `${pm}-12`, prob: .74, verif: `${pm}-${pad(dim(pm))}`, status: "confirmado", conferido: `${mk}-01`, fb: "util" },
      { key: `orc:Lazer & passeios:${pm}`, tipo: "orcamento", alvo: "Lazer & passeios", titulo: "Lazer & passeios deve estourar este mês", criado: `${pm}-15`, prob: .56, verif: `${pm}-${pad(dim(pm))}`, status: "nao", conferido: `${mk}-01` },
      { key: `humor:sono:${addDays(TODAY, -26)}`, tipo: "humor", alvo: "sono", titulo: "Risco de dias difíceis nos próximos 3 dias", criado: addDays(TODAY, -26), prob: .48, verif: addDays(TODAY, -23), status: "confirmado", conferido: addDays(TODAY, -22), fb: "util" },
      { key: `humor:estresse:${addDays(TODAY, -17)}`, tipo: "humor", alvo: "estresse", titulo: "Risco de dias difíceis nos próximos 3 dias", criado: addDays(TODAY, -17), prob: .41, verif: addDays(TODAY, -14), status: "nao", conferido: addDays(TODAY, -13), fb: "falso" },
      { key: `humor:sono:${addDays(TODAY, -8)}`, tipo: "humor", alvo: "sono", titulo: "Risco de dias difíceis nos próximos 3 dias", criado: addDays(TODAY, -8), prob: .52, verif: addDays(TODAY, -5), status: "confirmado", conferido: addDays(TODAY, -4) }] };
    const sozinho = D.diario.find(e => /sozinho/.test(e.texto)); if (sozinho) sozinho.semIA = true;
    D.diario.push({ id: uid(), data: addDays(TODAY, -12), hora: "21:40", titulo: "Terapia", texto: "Sessão de terapia hoje. Falamos da pressão da entrevista e de como eu me cobro demais. Saí mais leve. #terapia #privado", humor: 4, energia: 3, fixado: false, aplicados: [], criado: at(12), editado: at(12) });
    D.diario.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
    const fe = D.diario.filter(e => /#financas/.test(e.texto)).slice(-3).map(e => e.id), all = D.diario.filter(e => e.data >= addDays(TODAY, -30) && !e.semIA && !/#privado/.test(e.texto)).map(e => e.id);
    D.auditoria = [
      { id: uid(), at: at(1), recurso: "Captura", ent: [], nEnt: 0, areas: [], met: [], ferr: ["relato digitado ou ditado"], bloq: 0, bytes: 3150, status: "ok" },
      { id: uid(), at: at(6), recurso: "Leitura do diário", ent: all, nEnt: all.length, areas: ["Saúde mental", "Carreira", "Finanças", "Amizades & social"], met: ["bem", "sono", "estresse", "hab", "gasto"], ferr: [], bloq: 2, bytes: 21480, status: "ok" },
      { id: uid(), at: at(9), recurso: "Mentor do Dinheiro", ent: fe, nEnt: fe.length, areas: ["Finanças"], met: ["gasto", "c:Restaurantes & cafés"], ferr: ["consultar: Gasto do dia · 6 meses", "salvar_memoria: compromisso: teto semanal"], bloq: 0, bytes: 18820, status: "ok" }];
    VER++;
    const props = chapList().filter(c => !c.conf);
    if (props.length > 1) D.capitulos = [{ id: uid(), inicio: props[0].inicio, fim: props[0].fim, titulo: "Chegada e rotina nova", nota: "Os primeiros meses com o curso, a casa nova e a rotina de estudo se firmando." }];
  } finally { S = keep; applyLists(); VER++; }
}

/* entradas do diário de exemplo: o humor de cada texto conversa com o check-in do mesmo dia */
function exampleDiary(D, R, start, end) {
  const DT = [
    [4, "Aula de italiano", "A @[Prof.ª Rossi] corrigiu minha redação e disse que já estou perto do B2. Errei de novo o congiuntivo, mas o vocabulário melhorou muito. #aprendizado #italiano\n- [x] Revisar vocabulário da unidade 7\n- [ ] Assistir um episódio sem legenda\n[[Meta: Atingir nível B2 em italiano]]"],
    [4, "", "Liguei para a @Mãe e para o @Pai. Contaram da reforma da cozinha e rimos muito. A saudade apertou no fim da ligação. #familia"],
    [2, "Dia pesado", "Reunião longa, prazo apertado e dormi mal. Pulei o treino e comi besteira. #mente #corpo\nPreciso proteger o horário de dormir, nem que seja só três dias por semana."],
    [5, "Trattoria com amigos", "Jantar com @Marco e @Francesca na trattoria do bairro. Falamos de trabalho, de viagens e de como é morar fora. Voltei leve. #amizades\n/gasto 28,50 Restaurantes & cafés: Jantar com amigos"],
    [3, "Revisão do orçamento", "Restaurantes passou do limite outra vez. Nada dramático, mas é a terceira vez seguida. #financas\n- [ ] Definir um teto semanal para comer fora\n- [x] Cancelar a leitura digital que não uso\n[[Meta: Reserva de emergência de 6 meses]]"],
    [3, "Entrevista", "Primeira entrevista com a Construtora Alfa. Fui bem na parte técnica e travei no case de coordenação. Anotei as perguntas que me pegaram. #carreira #entrevista\n[[Tarefa: Preparar a 2ª entrevista]]"],
    [5, "", "Corrida de 45 minutos no parque, ritmo confortável. Energia lá em cima o resto do dia. #corpo #corrida"],
    [4, "Dez minutos que mudam o dia", "Meditei antes de abrir o e-mail. [[Hábito: Meditar 10 min]] O dia começou menos reativo. Funciona melhor quando deixo o celular na cozinha. #habitos #mente"],
    [2, "Furei de novo", "Terceira noite seguida dormindo depois da meia-noite. [[Hábito: Dormir até 23h30]] O gatilho é sempre a série depois do jantar. #habitos #sono\n- [ ] Desligar a TV às 22h45 esta semana"],
    [4, "", "Vinte páginas lidas no trem, quase sem perceber. [[Hábito: Ler 20 páginas]] Ler no trajeto é mais fácil do que à noite. #habitos #leitura"],
    [5, "Centro histórico", "Passeio com a @Chiara pelo centro histórico, sem celular. Foi o melhor domingo em semanas. #amor"],
    [4, "Módulo 5 entregue", "Terminei o módulo 5 do Master BIM. Próximo: instalações hidráulicas. Bloquear o sábado de manhã funciona. #carreira #estudo\n[[Meta: Concluir o Master BIM]]"],
    [2, "", "Me senti sozinho hoje. Faz tempo que não falo com o @[Pedro (Brasil)]. #amizades #mente\n- [ ] Mandar mensagem para o Pedro no fim de semana"],
    [5, "Voluntariado", "Manhã na distribuição de alimentos da paróquia. Saí de lá com outra cabeça e com vontade de ir mais vezes. #proposito #voluntariado\n[[Meta: Voluntariado 1×/mês]]"],
    [3, "Organização", "Comecei o backup do notebook e limpei a caixa de e-mails. Falta organizar as fotos. #casa\n- [x] Limpar e-mails antigos\n- [ ] Terminar o backup completo\n[[Tarefa: Backup completo do notebook]]"],
    [4, "", "Li 60 páginas de Il nome della rosa. Lento, mas estou gostando de ler em italiano. #leitura #aprendizado\n[[Livro: Il nome della rosa]]"],
    [5, "Notícia boa", "Videochamada com o @[Rafael (irmão)]: ele vai ser pai! Já estou pensando no presente. #familia"],
    [2, "Diploma", "Ansiedade com a validação do diploma. A tradução juramentada ainda não chegou e o prazo está passando. #mente #documentos\n[[Meta: Validar o diploma de engenharia]]"],
    [5, "Trilha", "Trilha nas colinas com o @Lucas, 12 km. Cansado e feliz. Precisamos repetir no próximo mês. #lazer #amizades"],
    [4, "Semana boa", "Treinei 4 vezes e dormi antes da meia-noite em 5 dias. O que funcionou: separar a roupa de treino na noite anterior. #corpo #sono"],
    [3, "", "Gastei mais do que queria no fim de semana. Nada grave, mas quero ficar de olho nas saídas. #financas #gastos"],
    [4, "Planos de Natal", "Conversa franca com a @Chiara sobre o Natal: uma semana com a família dela e uma no Brasil. Alívio por decidir. #amor #familia\n[[Projeto: Natal com a família]]"],
    [5, "Python valeu a pena", "Automatizei a exportação de quantitativos do Revit com Python. Primeira vez que vejo valor real no curso. #carreira #aprendizado\n[[Curso: Python para engenheiros]]"],
    [4, "", "Meditei 10 minutos antes de dormir. Pensamentos mais calmos e acordei melhor. #mente #meditacao"],
    [3, "", "A @[Tia Regina] ligou e eu não atendi. Fico devendo retorno há semanas. #familia\n- [ ] Ligar para a Tia Regina no domingo"],
    [4, "Revisão da semana", "## Vitória\nEntreguei o relatório parcial do módulo antes do prazo.\n## O que não funcionou\nDormi tarde quarta e quinta.\n## Próxima semana\n- [ ] Dormir até 23h30 em 4 dias\n- [ ] Duas sessões de italiano\n#mente #carreira"],
    [5, "", "Almoço de domingo com a @Chiara e os pais dela. Me senti em casa. #amor #familia"],
    [2, "", "Discussão boba com a @Chiara por causa da louça. Resolvemos à noite, mas fiquei mal o dia todo. #amor #mente"],
    [4, "Freelance entregue", "Projeto freelance entregue e o cliente elogiou. O dinheiro vai direto para a reserva. #carreira #financas"],
    [3, "", "Dia normal. Trabalho, mercado, série. Pouca energia para estudar. #rotina"],
    [4, "Museu", "Museu de arte contemporânea com o @Davide. Ele sabe muito de arquitetura e a conversa rendeu. #lazer #cultura #amizades"],
    [3, "Documentos", "Agendei a renovação da CNH no consulado. Uma preocupação a menos. #casa #documentos\n[[Documento: CNH brasileira]]"],
    [5, "Gratidão", "Três coisas boas: o sol na varanda, a mensagem da @Mãe e o treino que rendeu. #gratidao #proposito"],
    [2, "", "Cansado demais. Dois dias sem treinar e o humor caiu junto. #corpo #mente"],
    [4, "Mentoria", "Conversa com a @[Prof.ª Rossi] sobre dar aulas no futuro. Ela sugeriu começar com workshops curtos. #carreira #proposito\n[[Meta: Dar aulas em uma pós-graduação]]"],
    [4, "", "Violão por meia hora antes de dormir. Fazia tempo que não tocava. #lazer #musica"],
    [3, "", "Mercado e faxina. Cozinhei para a semana toda, menos delivery. #casa #financas"],
    [5, "Aniversário do Marco", "Aniversário do @Marco, festa pequena na casa dele. Conheci gente nova do bairro. #amizades\n/contato @Marco Encontro 120"],
    [4, "", "Sessão de estudo longa no sábado: 2h30 de Master BIM. Rendeu porque deixei o celular em outro cômodo. #estudo #carreira"],
    [3, "", "Domingo preguiçoso. Sem culpa: descanso também conta. #lazer #descanso"],
    [4, "Reserva", "Transferi para a reserva e vi o total subir. Faltam poucos meses para os 6 meses de despesas. #financas\n[[Meta: Reserva de emergência de 6 meses]]"],
    [4, "Ideia de projeto", "Pensei em montar um pequeno guia de BIM em português para quem chega na Itália. Pode virar workshop. #carreira #proposito\n- [ ] Esboçar os tópicos do guia"],
    [2, "", "Recebi a conta de luz e veio alta. Fiquei irritado e descontei no humor. #casa #financas #mente"],
  ];
  const span = diff(end, start), n = DT.length, used = new Set();
  DT.forEach(([m, titulo, texto], k) => {
    // mais densidade nos meses recentes
    const f = Math.pow((k + .5) / n, .8), target = addDays(start, Math.round(f * span));
    let best = null, bd = 99;
    for (let o = -6; o <= 6; o++) { const d = addDays(target, o); if (d < start || d > end || used.has(d)) continue; const h = D.saude[d]?.humor; const score = Math.abs(o) * .3 + (h == null ? 2 : Math.abs(h - m)); if (score < bd) { bd = score; best = d; } }
    const d = best || target; used.add(d);
    if (D.saude[d]) D.saude[d].humor = m; else D.saude[d] = { humor: m };
    D.diario.push({ id: uid(), data: d, hora: pad(19 + Math.floor(R() * 4)) + ":" + pad(Math.floor(R() * 6) * 10), titulo, texto, humor: m, energia: clamp(m + Math.round((R() - .5) * 2), 1, 5), fixado: false, aplicados: [], criado: parse(d).getTime(), editado: parse(d).getTime() });
  });
  /* entradas das duas fases de propósito (ver o laço de saúde) */
  [[109, 2, "Prazo do módulo", "Entrega do módulo 4 na sexta e o projeto do trabalho atrasado. Dormi cinco horas. #prazo #carreira"],
   [121, 2, "", "Semana de prazo apertado: trabalho até tarde e estudo no fim de semana. Nenhum treino. #prazo #corpo"],
   [133, 3, "Entregue", "Entreguei, mas a cabeça continua cheia. Amanhã começa a próxima etapa. #prazo #mente"],
   [142, 2, "", "Acordei cansado e irritado. Muito café, pouca paciência. #prazo #sono"],
   [184, 5, "Palermo", "Primeiro dia de férias em Palermo com a @Chiara. Mercado, mar e nenhuma tela. #viagem #amor"],
   [189, 5, "", "Dia inteiro na praia em Cefalù. Li, nadei e dormi cedo. #viagem #descanso"],
   [195, 4, "Volta", "Último dia de viagem. Volto descansado e com vontade de manter o ritmo leve. #viagem"],
   [209, 4, "", "Agosto sem pressa: cidade vazia, treino de manhã e jantar na varanda. Quero guardar este ritmo. #viagem #descanso"]].forEach(([k, m, titulo, texto]) => {
    let d = addDays(start, k); while (used.has(d)) d = addDays(d, 1); used.add(d);
    if (D.saude[d]) D.saude[d].humor = m; else D.saude[d] = { humor: m };
    D.diario.push({ id: uid(), data: d, hora: pad(19 + Math.floor(R() * 4)) + ":" + pad(Math.floor(R() * 6) * 10), titulo, texto, humor: m, energia: clamp(m + Math.round((R() - .5) * 2), 1, 5), fixado: false, aplicados: [], criado: parse(d).getTime(), editado: parse(d).getTime() });
  });
  D.diario.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const keep = S; S = D; applyLists();
  try { for (const e of D.diario) applyEntryCommands(e, { silent: true }); } finally { S = keep; applyLists(); }
  D.diario.find(e => e.titulo === "Revisão da semana") && (D.diario.find(e => e.titulo === "Revisão da semana").fixado = true);
}

/* mentores de exemplo: memória, plano e uma conversa curta, com números calculados dos próprios dados */
function exampleMentors(D) {
  const keep = S; S = D; applyLists(); VER++;
  try {
    const last = addMonth(mkey(TODAY), -1), Rl = calcAt(last), F = Rl.fin, rest = Rl.orcCats.find(c => c.cat === "Restaurantes & cafés");
    const at = n => Date.now() - n * 864e5, mid = () => uid();
    const sono30 = avg(Object.entries(D.saude).filter(([d]) => d >= addDays(TODAY, -30)).map(([, e]) => e.sono));
    const trein = Object.entries(D.saude).filter(([d, e]) => d >= addDays(TODAY, -28) && e.treino).length / 4;
    D.mentores = {
      fin: { visto: at(9), mem: [
        { id: mid(), at: at(40), tipo: "decisão", texto: "Aporte fixo de € 200 na reserva todo dia 11, logo depois do salário.", fixo: true, origem: "mentor" },
        { id: mid(), at: at(25), tipo: "alerta", texto: `Restaurantes & cafés estourou o orçamento em ${mlabel(last)}${rest ? ` (${eur(rest.real)} de ${eur(rest.plan)})` : ""}.`, fixo: false, origem: "mentor" },
        { id: mid(), at: at(9), tipo: "compromisso", texto: "Testar um teto semanal de € 25 para comer fora durante 4 semanas.", fixo: false, origem: "mentor" },
        { id: mid(), at: at(9), tipo: "preferência", texto: "Prefere metas semanais pequenas a cortes grandes de uma vez.", fixo: false, origem: "mentor" }],
        plano: { at: at(9), foco: "Fechar a reserva de 6 meses sem cortar o lazer com amigos", passos: [
          { id: mid(), texto: "Manter o aporte de € 200 no dia 11", prazo: `${mkey(TODAY)}-11`, feito: true },
          { id: mid(), texto: "Teto de € 25 por semana em restaurantes", prazo: addDays(TODAY, 21), feito: false },
          { id: mid(), texto: "Cancelar as 2 assinaturas de uso baixo", prazo: addDays(TODAY, 7), feito: false }] },
        conversa: [
          { role: "user", content: "Por que meu dinheiro some no fim do mês?", at: at(9) },
          { role: "assistant", at: at(9), content: `Olhei ${mlabel(last)}: receitas de ${eur(F.rec)}, despesas de ${eur(F.desp)} e taxa de poupança de ${pct(F.taxa)}. O vazamento não está nas contas fixas, que batem com o orçamento. Está nas saídas pequenas: **Restaurantes & cafés** somou ${rest ? eur(rest.real) : "–"}${rest?.plan ? ` para um teto de ${eur(rest.plan)}` : ""}.\n\nProposta para as próximas 4 semanas:\n- Teto semanal de € 25 para comer fora, que cabe nos encontros com amigos.\n- Cancelar as duas assinaturas que você marcou como uso baixo.\n- Manter o aporte do dia 11 antes de qualquer gasto.\n\nGuardei isso na memória e volto a medir em 4 semanas.`,
            uso: [{ t: "salvar_memoria", d: "compromisso: teto semanal de € 25" }, { t: "atualizar_plano", d: "3 passos" }],
            acoes: [{ id: mid(), tipo: "tarefa", titulo: "Cancelar assinaturas de uso baixo", prazo: addDays(TODAY, 7), prio: "Média", detalhes: "Leitura digital e rede profissional premium", status: "pendente" }] }] },
      fis: { visto: at(5), mem: [
        { id: mid(), at: at(30), tipo: "fato", texto: "Treina melhor de manhã; à noite costuma desistir.", fixo: true, origem: "mentor" },
        { id: mid(), at: at(5), tipo: "progresso", texto: `Sono médio dos últimos 30 dias: ${num(sono30)} h; treinos: ${num(trein)} por semana.`, fixo: false, origem: "mentor" }],
        plano: { at: at(5), foco: "Dormir 7h30 e manter 4 treinos por semana", passos: [
          { id: mid(), texto: "Separar a roupa de treino na noite anterior", prazo: "", feito: true },
          { id: mid(), texto: "Alarme de desligar telas às 23h", prazo: addDays(TODAY, 2), feito: false }] },
        conversa: [] },
      car: { visto: at(3), mem: [
        { id: mid(), at: at(20), tipo: "decisão", texto: "Foco em vagas de coordenação BIM; deixar de lado vagas só de modelagem.", fixo: true, origem: "mentor" },
        { id: mid(), at: at(3), tipo: "compromisso", texto: "Ensaiar o case da Construtora Alfa em voz alta duas vezes antes da entrevista.", fixo: false, origem: "mentor" }],
        plano: { at: at(3), foco: "Passar na 2ª entrevista da Construtora Alfa", passos: [
          { id: mid(), texto: "Reescrever o case com números de prazo e custo", prazo: addDays(TODAY, 2), feito: false },
          { id: mid(), texto: "Simular a entrevista com o Marco", prazo: addDays(TODAY, 3), feito: false }] },
        conversa: [] },
      conselho: { visto: at(6), mem: [
        { id: mid(), at: at(6), tipo: "decisão", texto: "Prioridades da semana: entrevista, diploma e sono.", fixo: true, origem: "mentor" },
        { id: mid(), at: at(6), tipo: "ideia", texto: "Usar o domingo à noite para a revisão semanal no diário.", fixo: false, origem: "mentor" }],
        plano: { at: at(6), foco: "Semana de entrevista sem abrir mão do sono", passos: [
          { id: mid(), texto: "Preparar a 2ª entrevista", prazo: addDays(TODAY, 4), feito: false },
          { id: mid(), texto: "Cobrar a tradução juramentada", prazo: addDays(TODAY, 1), feito: false },
          { id: mid(), texto: "Dormir até 23h30 em 4 noites", prazo: addDays(TODAY, 6), feito: false }] },
        conversa: [] },
    };
  } finally { S = keep; applyLists(); VER++; }
}
