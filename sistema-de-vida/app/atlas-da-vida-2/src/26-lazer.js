/* ================================================================ lazer: oito divisões temáticas, cada uma com um mentor
   Dados na chave lazerHub: { perfil (gostos, o que evita, notas por divisão), nivel (nível da conversa), sug (sugestões dos
   mentores), filmes, jogos, viagens, temas, avTemas, voos, perguntas, cafe: { equip, log, provar } }. Os livros moram em
   S.aprend (tipo Livro), para contar em Aprendizado; o tempo vai para S.lazer (ou S.estudo, nos Estudos). A divisão
   Existencial usa os quatro mentores da Jornada, sem duplicar nada. */
const LZ = { f: {}, flt: {}, reg: "todas", ex: "esp" };
const LZ_NIV = ["a descobrir", "iniciante", "intermediário", "avançado", "especialista"];
const LZ_DIV = [
  { id: "leitura", nome: "Leitura", ico: "book", cor: "var(--a-apr)", mid: "lzlei", cat: "Cultura", rec: "livros" },
  { id: "filmes", nome: "Filmes e séries", ico: "film", cor: "var(--a-amo)", mid: "lzfil", cat: "Cultura", rec: "filmes ou séries" },
  { id: "jogos", nome: "Jogos", ico: "gamepad", cor: "var(--a-laz)", mid: "lzjog", cat: "Jogos", rec: "jogos" },
  { id: "viagens", nome: "Viagens", ico: "globe", cor: "var(--a-car)", mid: "lzvia", cat: "Viagem", rec: "destinos ou roteiros" },
  { id: "cafe", nome: "Café", ico: "coffee", cor: "#c08552", mid: "lzcaf", cat: "Hobby criativo", rec: "cafés, receitas ou técnicas" },
  { id: "aviacao", nome: "Aviação", ico: "plane", cor: "#4fa3e3", mid: "lzavi", cat: "Hobby criativo", rec: "voos no simulador, aeronaves ou temas de estudo" },
  { id: "estudos", nome: "Estudos", ico: "atom", cor: "var(--a-pro)", mid: "lzest", cat: null, rec: "temas, livros ou vídeos" },
  { id: "existencial", nome: "Existencial", ico: "lotus", cor: "var(--jp-med)", mid: null },
];
const lzDiv = id => LZ_DIV.find(d => d.id === id);
const LZ_REG = ["Arredores", "Itália", "Europa", "Japão", "Brasil", "Outros"];
const LZ_AREA_EST = ["Astronomia e física", "Engenharia e megaconstruções", "Filosofia e espiritualidade", "Outros"];
const LZ_METODO = ["Espresso", "V60", "Moka", "Prensa francesa", "AeroPress", "Cold brew", "Outro"];
const LZ_SIM = ["X-Plane", "Microsoft Flight Simulator", "Outro"];
/* listas genéricas: status [valor, rótulo] e campos [chave, rótulo, tipo, opções] */
const LZ_LIST = {
  leitura: { nome: "Livros", st: [["Quero fazer", "quero ler"], ["Em andamento", "lendo"], ["Pausado", "pausado"], ["Concluído", "lido"], ["Abandonado", "abandonei"]], f: [["t", "Título"], ["autor", "Autor"], ["gen", "Gênero"]] },
  filmes: { nome: "Filmes e séries", st: [["quero", "quero ver"], ["vendo", "vendo"], ["visto", "visto"], ["abandonei", "abandonei"]], f: [["t", "Título"], ["tipo", "Tipo", "sel", ["Filme", "Série"]], ["ano", "Ano"], ["gen", "Gênero"], ["onde", "Onde assistir"]] },
  jogos: { nome: "Jogos", st: [["quero", "quero jogar"], ["jogando", "jogando"], ["pausado", "pausado"], ["zerado", "zerado"]], f: [["t", "Jogo"], ["plat", "Plataforma"], ["gen", "Gênero"]] },
  viagens: { nome: "Viagens", st: [["ideia", "ideia"], ["planejando", "planejando"], ["reservado", "reservado"], ["feita", "feita"]], f: [["t", "Destino"], ["reg", "Região", "sel", LZ_REG], ["ini", "Ida", "date"], ["fim", "Volta", "date"], ["orc", "Orçamento (€)", "number"]] },
  estudos: { nome: "Temas de estudo", st: [["quero", "quero estudar"], ["estudando", "estudando"], ["explorado", "explorado"]], f: [["t", "Tema"], ["area", "Área", "sel", LZ_AREA_EST], ["fonte", "Fonte (livro, curso, vídeo)"]] },
  aviacao: { nome: "Temas de aviação", st: [["quero", "quero estudar"], ["estudando", "estudando"], ["explorado", "explorado"]], f: [["t", "Tema"], ["fonte", "Fonte (vídeo, manual, curso)"]] },
};
const LZ_PONTES = [
  [["leitura", "estudos"], "A ficção científica dura (Planetes, Clarke, Asimov) leva direto a órbitas, detritos espaciais e relatividade; a filosofia atravessa as duas."],
  [["filmes", "leitura"], "Sherlock Holmes, O Senhor dos Anéis e Duna existem nas duas formas: comparar o livro com a adaptação é um ótimo exercício de crítica."],
  [["aviacao", "estudos"], "Aerodinâmica, motores e estruturas são engenharia aplicada; um voo no simulador é um laboratório de física."],
  [["viagens", "cafe"], "Origens como Brasil, Etiópia e Colômbia podem virar roteiro, e o V60 é japonês (Hario): uma cafeteria de método em Tóquio é parte da viagem."],
  [["viagens", "aviacao"], "Planeje no simulador a rota da próxima viagem real, com os mesmos aeroportos e procedimentos."],
  [["jogos", "estudos"], "The Settlers e Minecraft ensinam logística, economia e engenharia; o Pokémon TCG é probabilidade na prática."],
  [["existencial", "estudos"], "Espiritismo e filosofia aparecem em Leitura, Estudos e Existencial: o Professor e o Benfeitor podem discutir ciência e espiritualidade."],
];

/* ---------------------------------------------------------------- dados */
function lzData() {
  const d = (S.lazerHub ||= {});
  d.perfil ||= {}; d.nivel ||= {}; d.sug ||= {}; d.filmes ||= []; d.jogos ||= []; d.viagens ||= []; d.temas ||= []; d.avTemas ||= []; d.voos ||= []; d.perguntas ||= [];
  d.cafe ||= {}; d.cafe.equip ||= []; d.cafe.log ||= []; d.cafe.provar ||= [];
  return d;
}
const lzPerf = div => { const p = (lzData().perfil[div] ||= {}); p.gosto ||= []; p.evito ||= []; return p; };
const lzBooks = () => S.aprend.filter(a => a.tipo === "Livro").map(a => (a.id ||= uid(), a));
const lzItems = div => div === "leitura" ? lzBooks() : { filmes: lzData().filmes, jogos: lzData().jogos, viagens: lzData().viagens, estudos: lzData().temas, aviacao: lzData().avTemas }[div] || [];
const lzKey = div => div === "leitura" ? "aprend" : "lazerHub";
const lzT = x => x.titulo ?? x.t ?? "";
const lzNiv = div => lzData().nivel[div] || 0;
const lzSec = s => { s = String(s ?? "").trim(); if (!s) return null; if (s.includes(":")) { const [m, x] = s.split(":"); return (+m || 0) * 60 + (+x || 0); } return isNum(+s) ? +s : null; };
const lzMMSS = n => n == null ? "–" : `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")}`;
/* café: proporção = água (ou rendimento) ÷ dose; perda = (verde − torrado) ÷ verde; DTR = (total − 1º crack) ÷ total */
function lzCafeCalc(e) {
  if (e.tipo === "torra") { const v = +e.verde, t = +e.torrado, T = lzSec(e.total), fc = lzSec(e.fc); return { perda: v > 0 && t > 0 ? (v - t) / v : null, dtr: T > 0 && fc != null && fc < T ? (T - fc) / T : null, dev: T > 0 && fc != null && fc < T ? T - fc : null }; }
  const d = +e.dose, a = +e.agua; return { ratio: d > 0 && a > 0 ? a / d : null };
}
const lzMin = (div, from = mkey(TODAY) + "-01") => div === "estudos" ? sum(S.estudo.filter(e => e.data >= from && lzData().temas.some(t => norm(t.t) === norm(e.item))).map(e => +e.horas || 0)) : sum(S.lazer.filter(l => l.lz === div && l.data >= from).map(l => +l.horas || 0));
function lzSugAdd(div, inp) {
  const t = String(inp.titulo || "").trim().slice(0, 160); if (!t) return null; const S0 = (lzData().sug[div] ||= []);
  if (S0.some(x => norm(x.titulo) === norm(t)) || lzItems(div).some(x => norm(lzT(x)) === norm(t)) || (div === "cafe" && lzData().cafe.provar.some(x => norm(x.t) === norm(t)))) return null;
  const rec = { id: uid(), titulo: t, sub: String(inp.detalhe || inp.sub || "").slice(0, 200), porque: String(inp.porque || "").slice(0, 300), at: Date.now() }; S0.push(rec); return rec;
}

/* ---------------------------------------------------------------- mentores */
Object.assign(MENTOR_DEF, {
  lzlei: { lz: "leitura", gate: "Lazer & criatividade", cor: "var(--a-apr)", ico: "book", nome: "O Bibliotecário", papel: "mentor de leitura", arq: "um bibliotecário erudito e apaixonado, que lembra onde cada livro conversa com outro",
    voz: "Fala como um bibliotecário apaixonado que leu de tudo. Conhece ficção científica (de Júlio Verne e H. G. Wells a Asimov, Clarke, Le Guin, Herbert e Liu Cixin), literatura espírita (Kardec, Léon Denis, Chico Xavier, Divaldo Franco), filosofia (dos gregos a Camus), mistério e investigação (Conan Doyle, Agatha Christie, Dan Brown), romances históricos (Noah Gordon) e mangá de ficção científica como Planetes. Recomenda pela razão do gosto, não pela lista dos mais vendidos; pergunta o que tocou a pessoa no último livro; monta trilhas de leitura (por exemplo, de Sherlock Holmes ao raciocínio dedutivo e daí à filosofia da ciência).", limite: "Não conte finais nem reviravoltas sem a pessoa pedir." },
  lzfil: { lz: "filmes", gate: "Lazer & criatividade", cor: "var(--a-amo)", ico: "film", nome: "O Curador", papel: "mentor de filmes e séries", arq: "um curador de cinemateca, exigente com a qualidade e entusiasmado com obras-primas",
    voz: "Fala como um curador de cinemateca: exigente com a qualidade (direção, roteiro, fotografia, trilha, montagem), entusiasmado com obras-primas e sincero sobre o que é banal. Conhece ficção científica (de 2001 e Blade Runner a Interestelar e Duna), faroeste (John Ford, Sergio Leone, Clint Eastwood e os revisionistas), épicos e clássicos, e séries de prestígio. Explica por que uma obra é boa e ensina a enxergar a linguagem do cinema.", limite: "Respeite sempre o que a pessoa evita (veja os dados): se um título tiver tensão ou cenas fortes, avise antes de recomendar." },
  lzjog: { lz: "jogos", gate: "Lazer & criatividade", cor: "var(--a-laz)", ico: "gamepad", nome: "Mestre de Jogo", papel: "mentor de jogos", arq: "um designer de jogos e jogador veterano, que enxerga sistemas e estratégias",
    voz: "Fala como um designer de jogos e jogador experiente, com bom humor: analisa sistemas, mecânicas, economia e estratégia. Conhece construção de decks e meta do Pokémon TCG, Pokémon GO (eventos, reides, batalhas), Minecraft (redstone, automação, construção), Fortnite e jogos de estratégia e economia como The Settlers. Sugere jogos inteligentes e envolventes (estratégia, construção, quebra-cabeça, simulação) e mostra o que a mecânica ensina (logística, probabilidade, planejamento).", limite: "Diga quando uma informação de meta ou de evento pode estar desatualizada." },
  lzvia: { lz: "viagens", gate: "Lazer & criatividade", cor: "var(--a-car)", ico: "globe", nome: "O Cartógrafo", papel: "mentor de viagens", arq: "um viajante-cartógrafo que une geografia, história, comida e logística",
    voz: "Fala como um viajante-cartógrafo: geografia, história, comida e logística na mesma conversa. Conhece bem a Itália e os Alpes, a Europa, o Japão (rotas, trens, estações do ano) e o Brasil, e parte sempre da cidade-base da pessoa (veja os dados). Planeja de verdade: melhor época, como chegar (trem, carro, avião), quanto tempo ficar, custo aproximado e o que reservar com antecedência.", limite: "Preços, horários e regras de entrada mudam: diga para conferir na fonte oficial antes de reservar." },
  lzcaf: { lz: "cafe", gate: "Lazer & criatividade", cor: "#c08552", ico: "coffee", nome: "Mestre de Torra", papel: "mentor de café", arq: "um barista e torrador experiente, preciso e curioso",
    voz: "Fala como um barista e torrador experiente: proporções, tempos, temperaturas e o porquê de cada variável. Conhece torra (curva, primeiro crack, tempo de desenvolvimento, perda de peso), moagem, espresso (dose, rendimento, tempo), métodos filtrados como o V60, química da extração (TDS e rendimento de extração), origens e processos (lavado, natural, honey) e o protocolo de cupping da SCA. Usa os registros de torra e de extração da pessoa para ajustar a receita, mudando uma variável por vez.", limite: "" },
  lzavi: { lz: "aviacao", gate: "Lazer & criatividade", cor: "#4fa3e3", ico: "plane", nome: "O Comandante", papel: "mentor de aviação", arq: "um comandante de linha aérea com alma de engenheiro",
    voz: "Fala como um comandante de linha aérea com alma de engenheiro: precisão técnica, calma de cabine e fascínio pela máquina. Conhece aerodinâmica, motores, sistemas, meteorologia, navegação, procedimentos (checklists, fraseologia, SID e STAR, aproximações ILS e RNAV) e a história da aviação; nos simuladores X-Plane e Microsoft Flight Simulator, planeja um voo realista do plano de voo ao pouso. Usa unidades e termos corretos (nós, pés, nível de voo, QNH) e explica-os quando a pessoa está começando.", limite: "Lembre, quando fizer sentido, que simulador não substitui instrução de voo real." },
  lzest: { lz: "estudos", gate: "Aprendizado", cor: "var(--a-pro)", ico: "atom", nome: "O Professor", papel: "mentor de estudos em ciência, engenharia e filosofia", arq: "um grande professor e divulgador, à maneira de Carl Sagan e Richard Feynman",
    voz: "Fala como um grande divulgador: intuição primeiro, depois o modelo e, se a pessoa quiser, as equações. Conhece astronomia e astrofísica (buracos negros, relatividade restrita e geral, gravitação, física quântica, cosmologia, teoria das cordas), engenharia (estruturas, geotecnia, megaconstruções como pontes, túneis, barragens e arranha-céus) e filosofia da ciência e da mente, em diálogo respeitoso com a espiritualidade. Faz perguntas socráticas e propõe experimentos mentais.", limite: "Separe com clareza o que é ciência estabelecida, o que é hipótese (a teoria das cordas ainda não tem confirmação experimental) e o que é especulação." },
});
const LZ_MIDS = LZ_DIV.filter(d => d.mid).map(d => d.mid);
MIDS.push(...LZ_MIDS.filter(m => !MIDS.includes(m)));
const LZ_QUICK = {
  leitura: ["O que ler depois de Sherlock Holmes?", "Uma ficção científica que una ciência e espiritualidade", "Monte uma trilha de leitura de filosofia"],
  filmes: ["Um faroeste clássico para este fim de semana", "Ficção científica de alta qualidade que eu talvez não conheça", "Por que Matrix virou um marco?"],
  jogos: ["Um jogo de estratégia na linha de The Settlers", "Como montar um deck competitivo no Pokémon TCG?", "Um projeto de redstone para começar"],
  viagens: ["Um fim de semana perto de casa", "Roteiro de 15 dias no Japão", "Quando ir ao Brasil, e para onde"],
  cafe: ["Meu espresso está ácido: o que ajusto?", "Uma receita de V60 para um café natural", "Como ler a minha curva de torra?"],
  aviacao: ["Planeje um voo realista de 1 hora no simulador", "Como funciona uma aproximação ILS?", "O que acontece numa falha de motor na decolagem?"],
  estudos: ["O que acontece no horizonte de eventos?", "Explique a relatividade geral sem equações", "Como se constrói um túnel sob os Alpes?"],
};
const lzCheckText = mid => "Faça um acompanhamento do meu lazer nesta divisão: 1) o que você percebe nos meus registros e gostos, em poucas linhas; 2) uma sugestão para esta semana, usando recomendar; 3) uma pergunta para aprofundarmos; 4) se eu já demonstro mais domínio do que o nível atual, suba o nível com ajustar_nivel.";
const lzRecText = mid => `Recomende 3 ${lzDiv(MENTOR_DEF[mid].lz).rec} para mim agora, usando recomendar, e diga em uma linha por que cada um combina com o meu gosto (e respeita o que evito).`;
function lzFacts(div) {
  const D = lzData(), L = [], P = lzPerf(div), fmtR = r => r == null ? "–" : `1:${num(r, 1)}`;
  L.push(`Gosta de: ${P.gosto.join(", ") || "não informado"}. Evita: ${P.evito.join(", ") || "nada informado"}.${P.notas ? ` Notas: ${P.notas}` : ""}`);
  const list = (lbl, xs, f) => xs.length && L.push(`${lbl}:\n` + xs.slice(0, 15).map(f).join("\n"));
  if (LZ_LIST[div]) { const st = LZ_LIST[div].st; for (const [v, l] of st) list(`${LZ_LIST[div].nome} (${l})`, lzItems(div).filter(x => (x.status || st[0][0]) === v), x => `- ${lzT(x)}${x.autor ? `, ${x.autor}` : ""}${x.tipo && div === "filmes" ? ` (${x.tipo}${x.ano ? ", " + x.ano : ""})` : ""}${x.plat ? ` (${x.plat})` : ""}${x.reg ? ` [${x.reg}]` : ""}${x.ini ? ` ${x.ini}${x.fim ? " a " + x.fim : ""}` : ""}${x.area && div === "estudos" ? ` [${x.area}]` : ""}${isNum(+x.nota) && +x.nota ? `, nota ${x.nota}/5` : ""}${x.notas ? ` · ${trunc(x.notas, 140)}` : ""}`); }
  if (div === "leitura") L.push(`Livros lidos no ano: ${lzBooks().filter(b => b.status === "Concluído" && (b.fim || "").slice(0, 4) === TODAY.slice(0, 4)).length} (meta ${S.cfg.metaLivros || "–"}).`);
  if (div === "cafe") { if (D.cafe.equip.length) L.push("Equipamento: " + D.cafe.equip.map(e => e.t + (e.notas ? ` (${e.notas})` : "")).join("; ")); list("Registros recentes (torras e extrações)", D.cafe.log.slice().sort((a, b) => b.data.localeCompare(a.data)), e => { const c = lzCafeCalc(e); return e.tipo === "torra" ? `- ${e.data} torra de ${e.cafe || "?"}: ${e.verde || "?"} g verdes → ${e.torrado || "?"} g, perda ${c.perda == null ? "–" : pct(c.perda, 1)}, total ${e.total || "?"}, 1º crack ${e.fc || "?"}, DTR ${c.dtr == null ? "–" : pct(c.dtr, 1)}${e.nota ? `, nota ${e.nota}/5` : ""}${e.notas ? ` · ${trunc(e.notas, 120)}` : ""}` : `- ${e.data} ${e.metodo || "?"} de ${e.cafe || "?"}: ${e.dose || "?"} g → ${e.agua || "?"} g (${fmtR(c.ratio)}), ${e.tempo || "?"}${e.moagem ? `, moagem ${e.moagem}` : ""}${e.temp ? `, ${e.temp} °C` : ""}${e.nota ? `, nota ${e.nota}/5` : ""}${e.notas ? ` · ${trunc(e.notas, 120)}` : ""}`; }); list("Para provar", D.cafe.provar.filter(x => !x.feito), x => `- ${x.t}${x.sub ? ` (${x.sub})` : ""}`); }
  if (div === "aviacao") { const v = D.voos; if (v.length) L.push(`Diário de bordo: ${v.length} voos, ${num(sum(v.map(x => +x.dur || 0)) / 60, 1)} h no total.\n` + v.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 10).map(x => `- ${x.data} ${x.sim || ""}: ${x.aeronave || "?"} ${x.de || "?"} → ${x.para || "?"}, ${x.dur || "?"} min${x.notas ? ` · ${trunc(x.notas, 100)}` : ""}`).join("\n")); }
  if (div === "estudos") { const h = {}; for (const e of S.estudo) h[norm(e.item)] = (h[norm(e.item)] || 0) + (+e.horas || 0); const hs = D.temas.filter(t => h[norm(t.t)]); if (hs.length) L.push("Horas de estudo por tema: " + hs.map(t => `${t.t} ${num(h[norm(t.t)], 1)} h`).join("; ")); list("Perguntas que intrigam a pessoa", D.perguntas, x => `- ${x.t}`); }
  const sg = D.sug[div] || []; if (sg.length) L.push("Sugestões suas ainda não adotadas (não repita): " + sg.map(x => x.titulo).join("; "));
  return L;
}
function lzPrompt(mid, fallback) {
  const def = MENTOR_DEF[mid], div = def.lz, D = lzDiv(div), m = mget(mid), n = lzNiv(div);
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-24)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}${x.origem !== "mentor" ? " · " + x.origem : ""}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const plan = m.plano ? `Foco: ${m.plano.foco}\n` + m.plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${p.prazo})` : ""}`).join("\n") : "Ainda não há plano.";
  const outros = LZ_DIV.filter(d => d.id !== div).map(d => d.id === "existencial" ? `- Existencial: espiritismo, meditação, Taoísmo e Budismo (há uma aba Jornada existencial com mentores próprios)` : `- ${d.nome} (mentor: ${MENTOR_DEF[d.mid].nome}): gosta de ${lzPerf(d.id).gosto.slice(0, 6).join(", ") || "não informado"}${lzPerf(d.id).evito.length ? `; evita ${lzPerf(d.id).evito.join(", ")}` : ""}`);
  const nivTxt = n ? `A conversa está no nível "${LZ_NIV[n]}".` : "O nível ainda não foi descoberto: comece com uma pergunta curta para sentir o quanto a pessoa já sabe, ou pelo básico, e ajuste.";
  const fb = fallback ? `\n\nFORMATO: escreva a resposta normalmente. Para guardar memória, recomendar, ajustar o nível ou propor hábitos e tarefas, termine com um bloco exatamente assim (omita o que não houver):\n\`\`\`atlas\n{"memorias":[{"tipo":"preferência","texto":"..."}],"sugestoes":[{"titulo":"...","detalhe":"...","porque":"..."}],"nivel":{"nivel":2,"motivo":"..."},"propostas":[{"tipo":"habito","titulo":"...","vezes_por_semana":2}]}\n\`\`\`` : "";
  return `Você é ${def.nome}, ${def.papel} na aba Lazer do app pessoal "Atlas da Vida". Você personifica ${def.arq}.
QUEM VOCÊ É: ${def.voz}
COMO CONVERSAR:
- Português do Brasil, segunda pessoa. Você é um parceiro de conversa, não um catálogo: entusiasmo genuíno, uma pergunta que provoca, nada de palestra. Até ~200 palavras, salvo se pedirem mais.
- PROGRESSÃO: ${nivTxt} No nível iniciante, use imagens e exemplos; no intermediário, conceitos e porquês; no avançado, termos técnicos, fontes e nuances; no especialista, debate de igual para igual, controvérsias e literatura de referência. Suba o nível quando a pessoa mostrar domínio e desça se ela se perder, usando ${fallback ? "o campo nivel do bloco atlas" : "ajustar_nivel"} com o motivo.
- Respeite os gostos e, sobretudo, o que a pessoa evita.
- Quando fizer sentido, conecte com os outros temas de lazer dela (abaixo) e mostre a ponte.
- Cite obras, autores e dados só quando tiver certeza.${def.limite ? "\n- " + def.limite : ""}
- ${fallback ? "Use o bloco atlas" : "Use as ferramentas"} para: recomendar (vai para as sugestões da divisão, a pessoa adota se quiser), guardar na memória preferências e descobertas (frases curtas), atualizar o plano quando houver um projeto (uma leitura, uma viagem, um voo), propor hábitos ou tarefas${fallback ? "" : " e deixar recado para outro mentor"}. Não salve trivialidades.

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
DIVISÃO: ${D.nome}
${lzFacts(div).join("\n")}
OUTROS TEMAS DE LAZER DA PESSOA:
${outros.join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}

PLANO:
${plan}${fb}`.slice(0, 120000);
}
function lzTools(mid, live, base) {
  const div = MENTOR_DEF[mid].lz, keep = ["salvar_memoria", "atualizar_plano", "propor", "buscar_diario", "recado", "buscar_notion"], T = base.filter(t => keep.includes(t.name));
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  T.splice(1, 0, { name: "recomendar", description: `Acrescenta às sugestões da divisão ${lzDiv(div).nome} um item para a pessoa (${lzDiv(div).rec}); ela decide se adota. Título exato (em livros, filmes e jogos, o nome oficial), um detalhe curto (autor, ano, plataforma, região ou receita) e, em 'porque', uma frase sobre por que combina com ela. Retorna {ok}.`,
    inputSchema: { type: "object", properties: { titulo: { type: "string" }, detalhe: { type: "string" }, porque: { type: "string" } }, required: ["titulo"] },
    execute: inp => { const r = lzSugAdd(div, inp); if (r) { touch("lazerHub", { noUndo: true, noRender: true }); note("recomendar", trunc(r.titulo, 80)); } return { ok: true, duplicado: !r }; } },
    { name: "ajustar_nivel", description: "Muda o nível da conversa nesta divisão (1 iniciante, 2 intermediário, 3 avançado, 4 especialista) quando a pessoa mostrar mais ou menos domínio. Diga o motivo. Retorna {ok}.",
      inputSchema: { type: "object", properties: { nivel: { type: "number" }, motivo: { type: "string" } }, required: ["nivel", "motivo"] },
      execute: inp => { const n = clamp(Math.round(+inp.nivel || 0), 1, 4); lzData().nivel[div] = n; addMemory(mid, { tipo: "progresso", texto: `Nível da conversa: ${LZ_NIV[n]} (${trunc(String(inp.motivo || ""), 160)})` }); touch("lazerHub", "mentores", { noUndo: true, noRender: true }); note("ajustar_nivel", `${LZ_NIV[n]}: ${trunc(String(inp.motivo || ""), 60)}`); return { ok: true }; } });
  return T;
}

/* ---------------------------------------------------------------- páginas */
function pLazerHub(R) {
  if (SUB === "inicio") return lzInicio(R);
  if (SUB === "existencial") return lzExistencial();
  return lzDivPage(SUB, R);
}
function lzStat(d) {
  const D = lzData(), it = lzItems(d.id);
  if (d.id === "leitura") { const l = it.filter(b => b.status === "Em andamento").length, ano = it.filter(b => b.status === "Concluído" && (b.fim || "").slice(0, 4) === TODAY.slice(0, 4)).length; return `${l} lendo · ${ano} lidos no ano`; }
  if (d.id === "filmes") return `${it.filter(x => x.status === "vendo").length} vendo · ${it.filter(x => (x.status || "quero") === "quero").length} na lista`;
  if (d.id === "jogos") return `${it.filter(x => x.status === "jogando").length} jogando · ${it.length} na coleção`;
  if (d.id === "viagens") { const nx = it.filter(x => x.ini && x.ini >= TODAY && x.status !== "feita").sort((a, b) => a.ini.localeCompare(b.ini))[0]; return nx ? `${nx.t} ${relDay(nx.ini)}` : `${it.filter(x => x.status !== "feita").length} em ideia ou plano`; }
  if (d.id === "cafe") { const l = D.cafe.log.slice().sort((a, b) => b.data.localeCompare(a.data))[0]; return l ? `último registro ${relDay(l.data)}` : `${D.cafe.equip.length} equipamentos`; }
  if (d.id === "aviacao") return `${num(sum(D.voos.map(v => +v.dur || 0)) / 60, 1)} h de voo · ${D.voos.length} voos`;
  if (d.id === "estudos") return `${it.filter(x => x.status === "estudando").length} estudando · ${it.length} temas`;
  if (d.id === "existencial") return `${J_ORDER.reduce((s, p) => s + jActDays(p).size, 0)} registros-dia em 4 semanas`;
  return "";
}
function lzInicio(R) {
  const D = lzData(), nx = D.viagens.filter(x => x.ini && x.ini >= TODAY && x.status !== "feita").sort((a, b) => a.ini.localeCompare(b.ini))[0];
  return `<p class="lead">O seu hub de lazer: oito temas, cada um com um mentor que conversa no seu nível e vai subindo com você. Registre o que lê, assiste, joga, prova e voa, e use os mentores para descobrir o próximo passo.</p>
    ${kpiRow([kmini("var(--a-laz)", "Lazer no mês", num(R.horasLaz) + " h", `${R.lazN} registros`), kmini("var(--a-apr)", "Livros no ano", R.livros, `meta ${S.cfg.metaLivros || "–"}`), kmini("var(--a-car)", "Próxima viagem", nx ? esc(nx.t) : "–", nx ? relDay(nx.ini) : "nenhuma com data"), kmini("#4fa3e3", "Horas de voo", num(sum(D.voos.map(v => +v.dur || 0)) / 60, 1) + " h", "no simulador")])}
    <div class="lzgrid">${LZ_DIV.map(d => { const mid = d.mid, n = lzNiv(d.id); return `<a class="lzcard" href="#lazer.${d.id}" style="--c:${d.cor}"><span class="lzci">${ic(d.ico)}</span><div><b>${esc(d.nome)}</b><small>${esc(lzStat(d))}</small><em>${mid ? `${esc(MENTOR_DEF[mid].nome)}${n ? ` · nível ${LZ_NIV[n]}` : ""}` : "mentores da Jornada"}</em><span class="lztags">${lzPerf(d.id).gosto.slice(0, 4).map(g => `<i>${esc(g)}</i>`).join("")}</span></div></a>`; }).join("")}</div>
    <div class="g2c">
      ${panel(`${ic("link")}Pontes entre os temas`, `<div class="lzpontes">${LZ_PONTES.map(([ps, t]) => `<div class="lzponte"><div class="row wrap">${ps.map(p => `<a class="jtag sm" style="--c:${lzDiv(p).cor}" href="#lazer.${p}">${esc(lzDiv(p).nome)}</a>`).join("")}</div><p>${esc(t)}</p></div>`).join("")}</div>`)}
      ${panel(`${ic("council")}Os mentores`, `<div class="jmgrid">${LZ_MIDS.map(mid => { const def = MENTOR_DEF[mid], m = mget(mid); return `<a class="jmc" href="#lazer.${def.lz}" style="--c:${mcol(mid)}">${mavatar(mid)}<span><b>${esc(def.nome)}</b><small>${esc(lzDiv(def.lz).nome)}</small><em>${m.conversa?.length ? `conversaram ${relDay(iso(new Date(m.conversa.at(-1).at)))}` : esc(def.arq)}</em></span></a>`; }).join("")}<a class="jmc" href="#lazer.existencial" style="--c:var(--jp-med)"><span class="mav" style="--c:var(--jp-med)">${ic("lotus")}</span><span><b>Mentores da Jornada</b><small>Existencial</small><em>Benfeitor, Guia da Atenção, Sábio do Vale e Kalyāṇamitta</em></span></a></div>`)}
    </div>`;
}
function lzPerfilPanel(div) {
  const P = lzPerf(div), D = lzDiv(div), chips = (k, cls) => P[k].map((g, i) => `<span class="lzchip ${cls}">${esc(g)}<button type="button" data-act="lzprm" data-d="${div}" data-k="${k}" data-i="${i}" aria-label="Tirar ${esc(g)}">×</button></span>`).join("");
  return panel(`${ic("heart")}O seu gosto`, `<div class="flbl">Gosto de</div><div class="row wrap">${chips("gosto", "") || `<span class="muted small">nada ainda</span>`}</div>
    <div class="row wrap cradd"><input type="text" id="lzg_${div}" placeholder="Acrescentar um gosto (autor, gênero, jogo, lugar…)"><button type="button" class="btn sm" data-act="lzpadd" data-d="${div}" data-k="gosto">${ic("plus")}Gosto</button></div>
    <div class="flbl">Evito</div><div class="row wrap">${chips("evito", "no") || `<span class="muted small">nada informado</span>`}</div>
    <div class="row wrap cradd"><input type="text" id="lze_${div}" placeholder="O que você não quer (o mentor respeita)"><button type="button" class="btn sm" data-act="lzpadd" data-d="${div}" data-k="evito">${ic("plus")}Evito</button></div>
    <label class="flbl" for="lzn_${div}">Notas</label><textarea id="lzn_${div}" rows="2" data-lzn="${div}" placeholder="Contexto que ajuda o mentor">${esc(P.notas || "")}</textarea>`, { style: `--c:${D.cor}` });
}
function lzListPanel(div) {
  const C = LZ_LIST[div], F = LZ.f, flt = LZ.flt[div] || "todos", items = lzItems(div).filter(x => (flt === "todos" || (x.status || C.st[0][0]) === flt) && (div !== "viagens" || LZ.reg === "todas" || x.reg === LZ.reg));
  const order = Object.fromEntries(C.st.map(([v], i) => [v, i])), sorted = items.slice().sort((a, b) => ((order[a.status] ?? 0) === 1 ? -1 : 0) - ((order[b.status] ?? 0) === 1 ? -1 : 0) || (order[a.status] ?? 0) - (order[b.status] ?? 0) || (a.ini || "").localeCompare(b.ini || ""));
  const field = ([k, l, tp, opts]) => tp === "sel" ? `<label>${l}<select data-lzf="${div}.${k}">${opts.map(o => `<option${F[div + "." + k] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label>` : `<label>${l}<input type="${tp || "text"}" data-lzf="${div}.${k}" value="${esc(F[div + "." + k] || "")}"${tp === "number" ? ' min="0"' : ""}></label>`;
  const card = x => { const st = x.status || C.st[0][0], nota = +x.nota || 0, sub = [x.autor, x.tipo && div === "filmes" ? x.tipo : "", x.ano, x.plat, x.reg, x.area && div === "estudos" ? x.area : "", x.fonte].filter(Boolean).join(" · ");
    const hrs = div === "estudos" ? sum(S.estudo.filter(e => norm(e.item) === norm(lzT(x))).map(e => +e.horas || 0)) : 0;
    return `<article class="lzit s-${slug(st)}"><header><b>${esc(lzT(x))}</b>${x.gen ? `<span class="jtag sm">${esc(x.gen)}</span>` : ""}${x.ini ? `<small class="muted">${fmtD(x.ini)}${x.fim ? " a " + fmtD(x.fim) : ""}${x.ini >= TODAY && st !== "feita" ? ` · ${relDay(x.ini)}` : ""}</small>` : ""}</header>${sub ? `<small class="muted">${esc(sub)}${x.orc ? ` · ${eur(+x.orc)}` : ""}${hrs ? ` · ${num(hrs, 1)} h estudadas` : ""}</small>` : hrs ? `<small class="muted">${num(hrs, 1)} h estudadas</small>` : ""}
      <div class="row wrap lzrow"><div class="segs">${C.st.map(([v, l]) => `<button type="button" class="seg" data-act="lzst" data-d="${div}" data-id="${x.id}" data-v="${esc(v)}" aria-pressed="${st === v}">${l}</button>`).join("")}</div>
      ${div === "viagens" || div === "estudos" || div === "aviacao" ? "" : `<span class="lzstars" role="group" aria-label="Nota">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="lzs${n <= nota ? " on" : ""}" data-act="lznota" data-d="${div}" data-id="${x.id}" data-v="${n}" aria-label="${n} de 5">★</button>`).join("")}</span>`}</div>
      <input type="text" class="lznotas" data-lzin="${div}|${x.id}" value="${esc(x.notas || "")}" placeholder="${div === "viagens" ? "o que ver, onde ficar, reservas" : "impressões, citações, por que gostou"}" aria-label="Notas">
      <div class="row wrap lzacts">${div === "viagens" && +x.orc > 0 && !x.proj ? `<button type="button" class="lnk" data-act="lzproj" data-id="${x.id}">planejar o custo em Finanças</button>` : ""}${x.proj ? `<span class="muted small">custo em Finanças</span>` : ""}${div === "estudos" ? `<button type="button" class="lnk" data-act="lzest1" data-id="${x.id}">registrar 1 h de estudo</button>` : ""}<button type="button" class="lnk" data-act="lzask" data-d="${div}" data-id="${x.id}">conversar sobre isto</button><button type="button" class="lnk" data-act="lzdel" data-d="${div}" data-id="${x.id}">apagar</button></div></article>`; };
  return panel(`${ic(lzDiv(div).ico)}${esc(C.nome)} <small>${lzItems(div).length}</small>`, `<div class="row wrap lzfilt"><div class="segs"><button type="button" class="seg" data-act="lzflt" data-d="${div}" data-v="todos" aria-pressed="${flt === "todos"}">todos</button>${C.st.map(([v, l]) => `<button type="button" class="seg" data-act="lzflt" data-d="${div}" data-v="${esc(v)}" aria-pressed="${flt === v}">${l}</button>`).join("")}</div>
      ${div === "viagens" ? `<div class="row wrap">${["todas", ...LZ_REG].map(r => `<button type="button" class="jchip${LZ.reg === r ? " on" : ""}" style="--c:var(--a-car)" data-act="lzreg" data-v="${r}">${r}</button>`).join("")}</div>` : ""}</div>
    <div class="lzits">${sorted.map(card).join("") || `<div class="empty">Nada aqui ainda.</div>`}</div>
    <details class="lzadd"${LZ.f["open." + div] ? " open" : ""}><summary>${ic("plus")}Acrescentar</summary><div class="form f2">${C.f.map(field).join("")}</div><div class="row"><button type="button" class="btn sm primary" data-act="lzadd" data-d="${div}">${ic("check")}Guardar</button></div></details>`, { cls: "span2", style: `--c:${lzDiv(div).cor}` });
}
function lzSugPanel(div) {
  const sg = lzData().sug[div] || []; if (!sg.length) return "";
  return panel(`${ic("spark")}Sugeridos por ${esc(MENTOR_DEF[lzDiv(div).mid].nome)} <small>${sg.length}</small>`, `<div class="lzsugs">${sg.map(x => `<div class="lzsug"><div><b>${esc(x.titulo)}</b>${x.sub ? ` <span class="muted small">${esc(x.sub)}</span>` : ""}${x.porque ? `<p class="small muted">${esc(x.porque)}</p>` : ""}</div><div class="row"><button type="button" class="btn sm" data-act="lzsugok" data-d="${div}" data-id="${x.id}">${ic("plus")}${div === "cafe" ? "Para provar" : "Adotar"}</button><button type="button" class="lnk" data-act="lzsugno" data-d="${div}" data-id="${x.id}">dispensar</button></div></div>`).join("")}</div>`, { style: `--c:${lzDiv(div).cor}` });
}
function lzTempoForm(div) {
  const F = LZ.f, est = div === "estudos";
  return `<div class="lztempo"><input type="number" min="0" step="0.25" data-lzf="t.${div}.h" value="${esc(F[`t.${div}.h`] || "")}" placeholder="horas" aria-label="Horas"><input type="text" data-lzf="t.${div}.o" value="${esc(F[`t.${div}.o`] || "")}" placeholder="${est ? "tema estudado" : "o quê (opcional)"}" aria-label="O quê">${est ? "" : `<select data-lzf="t.${div}.s" aria-label="Satisfação">${[5, 4, 3, 2, 1].map(n => `<option value="${n}"${+F[`t.${div}.s`] === n ? " selected" : ""}>${"★".repeat(n)}</option>`).join("")}</select>`}<button type="button" class="btn sm" data-act="lztempo" data-d="${div}">${ic("clock")}Registrar tempo</button></div>`;
}
function lzHero(div) {
  const D = lzDiv(div), def = MENTOR_DEF[D.mid], n = lzNiv(div), mes = lzMin(div);
  return `<section class="pn lzhero" style="--c:${D.cor}"><div class="lzh1"><span class="jhi">${ic(D.ico)}</span><div><h2>${esc(D.nome)}</h2><p class="muted">Com ${esc(def.nome)}: ${esc(def.arq)}.</p></div></div>
    <div class="lzh2"><div><span class="flbl">Nível da conversa</span><div class="segs">${LZ_NIV.map((l, i) => `<button type="button" class="seg" data-act="lzniv" data-d="${div}" data-v="${i}" aria-pressed="${n === i}">${l}</button>`).join("")}</div><p class="muted small">O mentor sobe o nível quando você mostra domínio, e você pode mudar quando quiser.</p></div>
      <div><span class="flbl">Neste mês</span><b class="lzh">${num(mes, 1)} h</b>${lzTempoForm(div)}</div></div>
    <button type="button" class="btn sm jgochat" data-act="jtochat">${ic("spark")}Conversar com ${esc(def.nome)}</button></section>`;
}
function lzCafe() {
  const D = lzData().cafe, F = LZ.f, f = k => esc(F["c." + k] || "");
  const log = D.log.slice().sort((a, b) => b.data.localeCompare(a.data) || b.at - a.at);
  const ex = log.filter(e => e.tipo !== "torra"), tr = log.filter(e => e.tipo === "torra");
  return `${panel(`${ic("coffee")}Equipamento <small>${D.equip.length}</small>`, `<div class="crlist">${D.equip.map(e => `<div class="cri"><div><b>${esc(e.t)}</b>${e.notas ? ` <span class="muted">${esc(e.notas)}</span>` : ""}</div><button type="button" class="vb" data-act="lzeqdel" data-id="${e.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("") || `<div class="empty">Cadastre a máquina, o moedor e os acessórios.</div>`}</div>
      <div class="row wrap cradd"><input type="text" data-lzf="c.eq" value="${f("eq")}" placeholder="Equipamento (ex.: moedor, modelo)"><input type="text" data-lzf="c.eqn" value="${f("eqn")}" placeholder="Detalhe (marca, ajuste)"><button type="button" class="btn sm" data-act="lzeqadd">${ic("plus")}Acrescentar</button></div>`)}
    ${panel(`${ic("pulse")}Registrar extração`, `<div class="form f2"><label>Café<input type="text" data-lzf="c.cafe" value="${f("cafe")}" placeholder="origem, produtor, torra"></label><label>Método<select data-lzf="c.metodo">${LZ_METODO.map(o => `<option${F["c.metodo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label>
      <label>Dose (g)<input type="number" step="0.1" min="0" data-lzf="c.dose" value="${f("dose")}"></label><label>Bebida ou água (g)<input type="number" step="0.1" min="0" data-lzf="c.agua" value="${f("agua")}"></label><label>Tempo (s ou m:ss)<input type="text" data-lzf="c.tempo" value="${f("tempo")}" placeholder="28 ou 2:45"></label><label>Moagem<input type="text" data-lzf="c.moagem" value="${f("moagem")}"></label>
      <label>Temperatura (°C)<input type="number" min="0" data-lzf="c.temp" value="${f("temp")}"></label><label>Nota (1 a 5)<input type="number" min="1" max="5" data-lzf="c.nota" value="${f("nota")}"></label></div><div class="form f1"><label>Notas sensoriais<input type="text" data-lzf="c.notas" value="${f("notas")}" placeholder="acidez, doçura, corpo, retrogosto"></label></div>
      <div class="row"><span class="muted small">Proporção calculada: ${(() => { const r = lzCafeCalc({ dose: F["c.dose"], agua: F["c.agua"] }).ratio; return r ? `1:${num(r, 1)}` : "informe dose e bebida"; })()}</span><button type="button" class="btn sm primary" data-act="lzcafe" data-t="extracao">${ic("check")}Guardar extração</button></div>`)}
    ${panel(`${ic("flame")}Registrar torra`, `<div class="form f2"><label>Café verde<input type="text" data-lzf="c.tcafe" value="${f("tcafe")}" placeholder="origem e processo"></label><label>Verde (g)<input type="number" min="0" data-lzf="c.verde" value="${f("verde")}"></label><label>Torrado (g)<input type="number" min="0" data-lzf="c.torrado" value="${f("torrado")}"></label>
      <label>Tempo total (m:ss)<input type="text" data-lzf="c.total" value="${f("total")}" placeholder="10:30"></label><label>1º crack (m:ss)<input type="text" data-lzf="c.fc" value="${f("fc")}" placeholder="8:45"></label><label>Nota (1 a 5)<input type="number" min="1" max="5" data-lzf="c.tnota" value="${f("tnota")}"></label></div><div class="form f1"><label>Notas<input type="text" data-lzf="c.tnotas" value="${f("tnotas")}" placeholder="perfil, cor, aroma, descanso"></label></div>
      <div class="row"><span class="muted small">Perda = (verde − torrado) ÷ verde; DTR = (total − 1º crack) ÷ total.</span><button type="button" class="btn sm primary" data-act="lzcafe" data-t="torra">${ic("check")}Guardar torra</button></div>`)}
    ${panel(`${ic("table")}Diário do café <small>${log.length}</small>`, log.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Dia</th><th>Tipo</th><th>Café</th><th class="num">Medidas</th><th class="num">Resultado</th><th class="num">Nota</th><th></th></tr></thead><tbody>${log.slice(0, 20).map(e => { const c = lzCafeCalc(e); return e.tipo === "torra"
        ? `<tr><td>${fmtD(e.data)}</td><td>torra</td><td>${esc(e.cafe || "")}<div class="muted small">${esc(e.notas || "")}</div></td><td class="num">${e.verde || "?"} → ${e.torrado || "?"} g · ${esc(e.total || "?")} (1º crack ${esc(e.fc || "?")})</td><td class="num">perda ${c.perda == null ? "–" : pct(c.perda, 1)} · DTR ${c.dtr == null ? "–" : pct(c.dtr, 1)}</td><td class="num">${e.nota || ""}</td><td><button type="button" class="vb" data-act="lzlogdel" data-id="${e.id}" aria-label="Apagar">${ic("trash")}</button></td></tr>`
        : `<tr><td>${fmtD(e.data)}</td><td>${esc(e.metodo || "")}</td><td>${esc(e.cafe || "")}<div class="muted small">${esc(e.notas || "")}</div></td><td class="num">${e.dose || "?"} g → ${e.agua || "?"} g · ${esc(e.tempo || "?")}${e.temp ? ` · ${e.temp} °C` : ""}</td><td class="num">${c.ratio ? `1:${num(c.ratio, 1)}` : "–"}</td><td class="num">${e.nota || ""}</td><td><button type="button" class="vb" data-act="lzlogdel" data-id="${e.id}" aria-label="Apagar">${ic("trash")}</button></td></tr>`; }).join("")}</tbody></table></div>
      <p class="muted small">${ex.length ? `${plural(ex.length, "extração", "extrações")}, nota média ${num(avg(ex.map(e => +e.nota).filter(Boolean)) || 0, 1)}` : ""}${ex.length && tr.length ? " · " : ""}${tr.length ? `${plural(tr.length, "torra", "torras")}, perda média ${pct(avg(tr.map(e => lzCafeCalc(e).perda).filter(isNum)) || 0, 1)}` : ""}</p>` : `<div class="empty">As torras e extrações aparecem aqui, com a proporção, a perda de peso e o DTR calculados.</div>`, { cls: "span2" })}
    ${D.provar.length ? panel(`${ic("star")}Para provar`, `<div class="crlist">${D.provar.map(x => `<div class="cri"><div>${x.feito ? `<s class="muted">${esc(x.t)}</s>` : `<b>${esc(x.t)}</b>`}${x.sub ? ` <span class="muted small">${esc(x.sub)}</span>` : ""}</div><div class="row"><button type="button" class="lnk" data-act="lzprov" data-id="${x.id}">${x.feito ? "desfazer" : "provei"}</button><button type="button" class="vb" data-act="lzprovdel" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></div></div>`).join("")}</div>`) : ""}`;
}
function lzAviacao() {
  const D = lzData(), F = LZ.f, f = k => esc(F["v." + k] || ""), v = D.voos.slice().sort((a, b) => b.data.localeCompare(a.data)), h = sum(v.map(x => +x.dur || 0)) / 60, bySim = {}, acs = new Set();
  v.forEach(x => { bySim[x.sim || "Outro"] = (bySim[x.sim || "Outro"] || 0) + (+x.dur || 0) / 60; if (x.aeronave) acs.add(norm(x.aeronave)); });
  return `${panel(`${ic("plane")}Diário de bordo`, `${kpiRow([kmini("#4fa3e3", "Horas de voo", num(h, 1) + " h", plural(v.length, "voo", "voos")), kmini("var(--a-car)", "Aeronaves", acs.size, "diferentes"), kmini("var(--a-pro)", "Por simulador", Object.entries(bySim).map(([s, x]) => `${esc(s.replace("Microsoft Flight Simulator", "MSFS"))} ${num(x, 1)} h`).join(" · ") || "–", "")])}
      <div class="form f2"><label>Data<input type="date" data-lzf="v.data" value="${f("data") || TODAY}"></label><label>Simulador<select data-lzf="v.sim">${LZ_SIM.map(o => `<option${F["v.sim"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label><label>Aeronave<input type="text" data-lzf="v.aeronave" value="${f("aeronave")}" placeholder="ex.: A320neo"></label><label>Duração (min)<input type="number" min="0" data-lzf="v.dur" value="${f("dur")}"></label>
      <label>De (ICAO)<input type="text" data-lzf="v.de" value="${f("de")}" placeholder="ex.: LIMF" maxlength="4"></label><label>Para (ICAO)<input type="text" data-lzf="v.para" value="${f("para")}" maxlength="4"></label></div><div class="form f1"><label>Notas<input type="text" data-lzf="v.notas" value="${f("notas")}" placeholder="procedimentos, meteorologia, o que aprendeu"></label></div>
      <div class="row"><button type="button" class="btn sm primary" data-act="lzvoo">${ic("check")}Guardar voo</button></div>
      ${v.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Dia</th><th>Rota</th><th>Aeronave</th><th>Simulador</th><th class="num">Min</th><th></th></tr></thead><tbody>${v.slice(0, 15).map(x => `<tr><td>${fmtD(x.data)}</td><td><b>${esc(x.de || "?")} → ${esc(x.para || "?")}</b><div class="muted small">${esc(x.notas || "")}</div></td><td>${esc(x.aeronave || "")}</td><td>${esc(x.sim || "")}</td><td class="num">${x.dur || ""}</td><td><button type="button" class="vb" data-act="lzvoodel" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></td></tr>`).join("")}</tbody></table></div>` : ""}`, { cls: "span2", style: "--c:#4fa3e3" })}
    ${lzListPanel("aviacao")}`;
}
function lzEstudosExtra() {
  const D = lzData();
  return panel(`${ic("info")}Perguntas que me intrigam <small>${D.perguntas.length}</small>`, `<div class="crlist">${D.perguntas.map(x => `<div class="cri"><div>${esc(x.t)}</div><div class="row"><button type="button" class="lnk" data-act="lzpask" data-id="${x.id}">levar ao Professor</button><button type="button" class="vb" data-act="lzpdel" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></div></div>`).join("") || `<div class="empty">Ex.: “O que existe dentro de um buraco negro?”, “Como uma barragem resiste à pressão da água?”</div>`}</div>
    <div class="row wrap cradd"><input type="text" id="lzpq" placeholder="Uma pergunta que não sai da sua cabeça"><button type="button" class="btn sm" data-act="lzpadd2">${ic("plus")}Guardar</button></div>`, { style: "--c:var(--a-pro)" });
}
function lzDivPage(div) {
  const D = lzDiv(div); if (!D?.mid) return lzInicio(calcAt(REF));
  const def = MENTOR_DEF[D.mid];
  const body = div === "cafe" ? lzCafe() : div === "aviacao" ? lzAviacao() : lzListPanel(div);
  return `<div class="jcols lzcols" style="--c:${D.cor}"><div class="jleft">${lzHero(div)}<div class="g2c">${lzPerfilPanel(div)}${lzSugPanel(div) || panel(`${ic("spark")}Sugestões`, `<p class="muted">Peça a ${esc(def.nome)} recomendações: elas aparecem aqui para você adotar ou dispensar.</p>`, { style: `--c:${D.cor}` })}${body}${div === "estudos" ? lzEstudosExtra() : ""}</div></div>
    <aside class="jright">${jChat(D.mid, { rec: true, recLabel: "Recomendar", quick: LZ_QUICK[div], intro: `Converse sobre ${D.nome.toLowerCase()} no seu ritmo: ${def.nome} começa pelo básico e vai aprofundando conforme você mostra o que já sabe.`, priv: `Ao conversar, ${def.nome} lê os seus gostos, o que você evita, os registros desta divisão e um resumo dos outros temas de lazer. Cada conversa aparece em Privacidade.` })}</aside></div>`;
}
function lzExistencial() {
  const pid = LZ.ex in J_PIL ? LZ.ex : "esp", D = J_PIL[pid];
  return `<p class="lead">O lado existencial do seu lazer mora na Jornada existencial, com os quatro mentores dos pilares. Aqui você conversa com eles sem sair do Lazer; tudo o que fizer aparece também na Jornada.</p>
    <div class="lzexc">${J_ORDER.map(p => { const P = J_PIL[p], mo = jMoonInfo(p); return `<button type="button" class="lzex${p === pid ? " on" : ""}" style="--c:${P.cor}" data-act="lzex" data-v="${p}" aria-pressed="${p === pid}">${jMoon(mo.f, 10, P.cor)}<span><b>${esc(P.nome)}</b><small>${esc(MENTOR_DEF[P.mid].nome)} · ${esc(mo.nome)}</small></span></button>`; }).join("")}</div>
    <div class="jcols" style="--c:${D.cor}"><div class="jleft">
      <section class="pn jhero"><div class="jh1"><span class="jhi">${ic(D.ico)}</span><div><h2>${esc(D.nome)}</h2><p class="jlema">${esc(D.lema)}</p></div></div><blockquote class="jquote">${esc(jTeach(pid)[0])}<cite>${esc(jTeach(pid)[1])}</cite></blockquote><p class="bmq">${ic("info")}<span>${esc(jQuestion(pid))}</span></p><div class="row wrap"><a class="btn sm" href="#jornada.${D.sub}">${ic("arrow")}Abrir ${esc(D.nome)} na Jornada</a><button type="button" class="btn sm jgochat" data-act="jtochat">${ic("spark")}Conversar com ${esc(MENTOR_DEF[D.mid].nome)}</button></div></section>
      ${panel(`${ic("heart")}O seu gosto`, `<div class="row wrap">${lzPerf("existencial").gosto.map(g => `<span class="lzchip">${esc(g)}</span>`).join("") || `<span class="muted small">—</span>`}</div><p class="muted small">Para editar, use os pilares da Jornada ou as notas abaixo.</p><textarea rows="2" data-lzn="existencial" placeholder="Notas">${esc(lzPerf("existencial").notas || "")}</textarea>`)}
    </div><aside class="jright">${jChat(D.mid, { rec: true })}</aside></div>`;
}

/* ---------------------------------------------------------------- eventos */
function lzClick(t) {
  const ds = t.dataset, a = ds.act; if (!a || !a.startsWith("lz")) return false;
  const D = lzData(), div = ds.d;
  if (a === "lzniv") { D.nivel[div] = +ds.v; touch("lazerHub", { label: "Nível da conversa" }); return true; }
  if (a === "lzpadd") { const el = $(`#lz${ds.k === "gosto" ? "g" : "e"}_${div}`), v = (el?.value || "").trim(); if (!v) return true; const P = lzPerf(div); if (!P[ds.k].some(x => norm(x) === norm(v))) P[ds.k].push(v); touch("lazerHub", { label: ds.k === "gosto" ? "Gosto" : "Evito" }); return true; }
  if (a === "lzprm") { const P = lzPerf(div); P[ds.k].splice(+ds.i, 1); touch("lazerHub", { label: "Gosto removido" }); undoToast("Removido"); return true; }
  if (a === "lzflt") { LZ.flt[div] = ds.v; render(); return true; }
  if (a === "lzreg") { LZ.reg = ds.v; render(); return true; }
  if (a === "lzst") { const x = lzItems(div).find(z => z.id === ds.id); if (!x) return true; x.status = ds.v; if (div === "leitura") { if (ds.v === "Concluído") { x.fim ||= TODAY; if (+x.total) x.atual = x.total; } else if (ds.v !== "Concluído") delete x.fim; } touch(lzKey(div), { label: "Status" }); return true; }
  if (a === "lznota") { const x = lzItems(div).find(z => z.id === ds.id); if (!x) return true; x.nota = +x.nota === +ds.v ? "" : +ds.v; touch(lzKey(div), { label: "Nota" }); return true; }
  if (a === "lzdel") { if (div === "leitura") S.aprend = S.aprend.filter(z => z.id !== ds.id); else { const k = { filmes: "filmes", jogos: "jogos", viagens: "viagens", estudos: "temas", aviacao: "avTemas" }[div]; D[k] = D[k].filter(z => z.id !== ds.id); } touch(lzKey(div), { label: "Apagado" }); undoToast("Apagado"); return true; }
  if (a === "lzadd") { const F = LZ.f, C = LZ_LIST[div], rec = { id: uid() }; for (const [k, , tp, opts] of C.f) { const v = F[`${div}.${k}`]; rec[k] = tp === "sel" ? (v || opts[0]) : String(v ?? "").trim(); }
    if (!rec.t) { toast("Dê um título."); return true; } rec.status = C.st[0][0]; if (rec.orc) rec.orc = +rec.orc || "";
    if (div === "leitura") S.aprend.push({ id: rec.id, titulo: rec.t, tipo: "Livro", area: "Lazer & criatividade", status: rec.status, total: "", atual: "", nota: "", autor: rec.autor, gen: rec.gen });
    else D[{ filmes: "filmes", jogos: "jogos", viagens: "viagens", estudos: "temas", aviacao: "avTemas" }[div]].push({ ...rec, criado: Date.now() });
    C.f.forEach(([k]) => delete F[`${div}.${k}`]); touch(lzKey(div), { label: "Acrescentado" }); return true; }
  if (a === "lzsugok") { const sg = D.sug[div] || [], x = sg.find(z => z.id === ds.id); if (!x) return true; D.sug[div] = sg.filter(z => z.id !== ds.id);
    if (div === "cafe") D.cafe.provar.push({ id: uid(), t: x.titulo, sub: x.sub, feito: false });
    else if (div === "leitura") S.aprend.push({ id: uid(), titulo: x.titulo, tipo: "Livro", area: "Lazer & criatividade", status: "Quero fazer", total: "", atual: "", nota: "", autor: x.sub, notas: x.porque });
    else { const st = LZ_LIST[div].st[0][0], k = { filmes: "filmes", jogos: "jogos", viagens: "viagens", estudos: "temas", aviacao: "avTemas" }[div]; D[k].push({ id: uid(), t: x.titulo, status: st, notas: [x.sub, x.porque].filter(Boolean).join(" · "), ...(div === "viagens" ? { reg: "Outros" } : {}), ...(div === "estudos" ? { area: "Outros" } : {}), criado: Date.now() }); }
    touch("lazerHub", ...(div === "leitura" ? ["aprend"] : []), { label: "Sugestão adotada" }); toast("Adotada"); return true; }
  if (a === "lzsugno") { D.sug[div] = (D.sug[div] || []).filter(z => z.id !== ds.id); touch("lazerHub", { label: "Sugestão dispensada" }); return true; }
  if (a === "lztempo") { const F = LZ.f, h = +F[`t.${div}.h`]; if (!(h > 0)) { toast("Informe as horas."); return true; } const o = String(F[`t.${div}.o`] || "").trim();
    if (div === "estudos") { S.estudo.push({ id: uid(), data: TODAY, item: o || "Estudos livres", horas: h }); touch("estudo", { label: "Sessão de estudo" }); }
    else { const Dv = lzDiv(div); S.lazer.push({ id: uid(), data: TODAY, atividade: o ? `${Dv.nome}: ${o}` : Dv.nome, cat: Dv.cat, horas: h, custo: "", sat: +F[`t.${div}.s`] || 5, lz: div }); touch("lazer", { label: "Tempo de lazer" }); }
    delete F[`t.${div}.h`]; delete F[`t.${div}.o`]; toast(`${num(h, 2)} h registradas`); return true; }
  if (a === "lzask") { const x = lzItems(div).find(z => z.id === ds.id); if (!x) return true; const mid = lzDiv(div).mid; MST.input[mid] = `Quero conversar sobre “${lzT(x)}”${x.notas ? ` (minhas notas: ${x.notas})` : ""}.`; render(); const el = $("#m_in"); if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); } return true; }
  if (a === "lzproj") { const x = D.viagens.find(z => z.id === ds.id); if (!x || x.proj) return true; const id = uid(); S.projetos = [...(S.projetos || []), { id, criado: Date.now(), nome: `Viagem: ${x.t}`, tipo: "projeto", cat: "Viagem", prio: "desejo", valor: +x.orc, prazo: x.ini || addDays(TODAY, 90), status: "planejando", forma: "poupar", entrada: "", taxa: "", parcelas: "", etapas: [], notas: "Criado no Lazer", aportes: [], mentor: [] }]; x.proj = id; touch("projetos", "lazerHub", { label: "Custo da viagem" }); undoToast("Projeto criado em Finanças › Projetos & aquisições"); return true; }
  if (a === "lzest1") { const x = D.temas.find(z => z.id === ds.id); if (!x) return true; S.estudo.push({ id: uid(), data: TODAY, item: x.t, horas: 1 }); if ((x.status || "quero") === "quero") x.status = "estudando"; touch("estudo", "lazerHub", { label: "1 h de estudo" }); toast(`1 h de estudo em ${x.t}`); return true; }
  if (a === "lzeqadd") { const v = String(LZ.f["c.eq"] || "").trim(); if (!v) return true; D.cafe.equip.push({ id: uid(), t: v, notas: String(LZ.f["c.eqn"] || "").trim() }); delete LZ.f["c.eq"]; delete LZ.f["c.eqn"]; touch("lazerHub", { label: "Equipamento" }); return true; }
  if (a === "lzeqdel") { D.cafe.equip = D.cafe.equip.filter(z => z.id !== ds.id); touch("lazerHub", { label: "Equipamento apagado" }); undoToast("Apagado"); return true; }
  if (a === "lzcafe") { const F = LZ.f, g = k => String(F["c." + k] ?? "").trim();
    const e = ds.t === "torra" ? { id: uid(), at: Date.now(), data: TODAY, tipo: "torra", cafe: g("tcafe"), verde: +g("verde") || "", torrado: +g("torrado") || "", total: g("total"), fc: g("fc"), nota: +g("tnota") || "", notas: g("tnotas") }
      : { id: uid(), at: Date.now(), data: TODAY, tipo: "extracao", cafe: g("cafe"), metodo: g("metodo") || "Espresso", dose: +g("dose") || "", agua: +g("agua") || "", tempo: g("tempo"), moagem: g("moagem"), temp: +g("temp") || "", nota: +g("nota") || "", notas: g("notas") };
    if (ds.t === "torra" ? !(e.verde && e.torrado) : !(e.dose && e.agua)) { toast(ds.t === "torra" ? "Informe o peso verde e o torrado." : "Informe a dose e a bebida."); return true; }
    D.cafe.log.push(e); Object.keys(F).filter(k => k.startsWith("c.") && !["c.metodo", "c.eq", "c.eqn"].includes(k)).forEach(k => delete F[k]); touch("lazerHub", { label: ds.t === "torra" ? "Torra registrada" : "Extração registrada" }); return true; }
  if (a === "lzlogdel") { D.cafe.log = D.cafe.log.filter(z => z.id !== ds.id); touch("lazerHub", { label: "Registro apagado" }); undoToast("Registro apagado"); return true; }
  if (a === "lzprov") { const x = D.cafe.provar.find(z => z.id === ds.id); if (x) { x.feito = !x.feito; touch("lazerHub", { label: "Para provar" }); } return true; }
  if (a === "lzprovdel") { D.cafe.provar = D.cafe.provar.filter(z => z.id !== ds.id); touch("lazerHub", { label: "Apagado" }); return true; }
  if (a === "lzvoo") { const F = LZ.f, g = k => String(F["v." + k] ?? "").trim(); const v = { id: uid(), data: g("data") || TODAY, sim: g("sim") || LZ_SIM[0], aeronave: g("aeronave"), de: g("de").toUpperCase(), para: g("para").toUpperCase(), dur: +g("dur") || "", notas: g("notas") };
    if (!v.dur) { toast("Informe a duração em minutos."); return true; } D.voos.push(v); ["aeronave", "de", "para", "dur", "notas"].forEach(k => delete F["v." + k]); touch("lazerHub", { label: "Voo registrado" }); toast(`Voo ${v.de || "?"} → ${v.para || "?"} registrado`); return true; }
  if (a === "lzvoodel") { D.voos = D.voos.filter(z => z.id !== ds.id); touch("lazerHub", { label: "Voo apagado" }); undoToast("Voo apagado"); return true; }
  if (a === "lzpadd2") { const v = ($("#lzpq")?.value || "").trim(); if (!v) return true; D.perguntas.push({ id: uid(), t: v, data: TODAY }); touch("lazerHub", { label: "Pergunta" }); return true; }
  if (a === "lzpdel") { D.perguntas = D.perguntas.filter(z => z.id !== ds.id); touch("lazerHub", { label: "Pergunta apagada" }); return true; }
  if (a === "lzpask") { const x = D.perguntas.find(z => z.id === ds.id); if (!x) return true; MST.input.lzest = x.t; render(); const el = $("#m_in"); if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); } return true; }
  if (a === "lzex") { LZ.ex = ds.v; render(); return true; }
  return false;
}
function lzInput(t) {
  const ds = t.dataset;
  if (ds.lzf) { LZ.f[ds.lzf] = t.value; if (/^c\.(dose|agua)$/.test(ds.lzf)) { const el = t.closest(".pn")?.querySelector(".row .muted.small"); const r = lzCafeCalc({ dose: LZ.f["c.dose"], agua: LZ.f["c.agua"] }).ratio; if (el) el.textContent = `Proporção calculada: ${r ? `1:${num(r, 1)}` : "informe dose e bebida"}`; } return true; }
  return false;
}
function lzChange(t) {
  const ds = t.dataset;
  if (ds.lzf) { LZ.f[ds.lzf] = t.value; return true; }
  if (ds.lzn) { lzPerf(ds.lzn).notas = t.value.trim(); touch("lazerHub", { label: "Notas", noRender: true }); return true; }
  if (ds.lzin) { const [div, id] = ds.lzin.split("|"), x = lzItems(div).find(z => z.id === id); if (x) { x.notas = t.value.trim(); touch(lzKey(div), { label: "Notas", noRender: true }); } return true; }
  return false;
}
