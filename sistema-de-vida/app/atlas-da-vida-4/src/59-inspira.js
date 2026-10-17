
/* ================================================================ Inspiração: aquecer o cérebro para começar uma atividade
   Cada atividade traz: por que vale, um texto curto, um aquecimento de 5 minutos em 3 passos, desafios pequenos para o primeiro
   passo, perguntas para pensar, frases (só com autor e obra conferidos), vídeos e músicas (links de busca: não quebram quando um
   vídeo sai do ar) e recursos. A base são os gostos do Lazer e as atividades da rotina; as “sugeridas” são vizinhas delas.
   Atividades próprias ficam em S.inspira.minhas; o que foi começado, em S.inspira.ativs[id] = { n, ultima, desafios }.
   A IA de acompanhamento (src/60-coach.js) é ativada daqui e assume o perfil da atividade. */
const YT = q => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
const INSP_GRUPOS = [["estudo", "Estudo"], ["criar", "Criar e construir"], ["corpo", "Corpo e mente"], ["espirito", "Espírito"], ["lazer", "Lazer"], ["sugeridas", "Sugeridas"], ["minhas", "Minhas"]];
const INSP = [
  { id: "ingles", nome: "Inglês", g: "estudo", ico: "globe", cor: "var(--a-car)", aba: "idiomas", rot: /english|ingl[eê]s|inglese/i,
    por: "O idioma que abre a maior parte da ciência, da engenharia e do cinema que você gosta.",
    texto: "Fluência é volume de contato com atenção. Trinta minutos de inglês que você entende quase tudo valem mais que duas horas de algo difícil demais. Hoje, escolha uma coisa que você leria ou veria de qualquer jeito e faça em inglês.",
    aquec: ["Leia em voz alta um parágrafo curto (notícia, letra de música, legenda).", "Anote 3 palavras ou expressões novas com uma frase sua para cada uma.", "Diga em inglês, em 3 frases, o que vai estudar agora e por quê."],
    desafios: ["Assista a 6 minutos do 6 Minute English sem legenda; depois com legenda.", "Escreva 5 linhas sobre o seu dia, sem tradutor.", "Explique em inglês um conceito de engenharia que você domina."],
    perguntas: ["Em que situação real você quer estar à vontade em inglês daqui a 6 meses?", "Qual tipo de conteúdo você consome em português que poderia trocar por inglês?"],
    frases: [["Os limites da minha linguagem significam os limites do meu mundo.", "Ludwig Wittgenstein, Tractatus Logico-Philosophicus, 5.6"]],
    videos: [["BBC Learning English: 6 Minute English", "BBC 6 Minute English"], ["Engenharia explicada em inglês", "Practical Engineering"]],
    musicas: [["The Beatles: Abbey Road (cante junto com a letra)", "The Beatles Abbey Road full album"]],
    recursos: [["BBC Learning English", "https://www.bbc.co.uk/learningenglish"], ["Anki (repetição espaçada)", "https://apps.ankiweb.net"]] },
  { id: "italiano", nome: "Italiano", g: "estudo", ico: "globe", cor: "#3fae6a", aba: "idiomas", rot: /italian/i,
    por: "A língua da casa, do trabalho e das pessoas em volta: cada avanço aparece no mesmo dia.",
    texto: "Você vive dentro do italiano: o ganho está em transformar o que já ouve em algo que você usa de propósito. Hoje, pegue uma situação do dia (uma reunião, uma conversa no mercado) e treine as frases que faltaram.",
    aquec: ["Lembre de uma frase que você ouviu hoje e não soube responder; escreva como diria agora.", "Leia uma manchete do dia em voz alta e explique com as suas palavras.", "Escolha 3 pronomes ou preposições que confundem e faça uma frase com cada."],
    desafios: ["Escreva um e-mail curto de trabalho sem tradutor e revise com o dicionário Treccani.", "Assista 10 minutos de um programa da RaiPlay e anote 5 expressões.", "Grave um áudio de 1 minuto contando o seu fim de semana."],
    perguntas: ["Que conversa você evita por causa do italiano?", "Qual registro falta mais: o técnico do trabalho ou o do dia a dia?"],
    frases: [["Fatti non foste a viver come bruti, / ma per seguir virtute e canoscenza.", "Dante Alighieri, Inferno, canto XXVI, 119–120"], ["Quem não conhece línguas estrangeiras nada sabe da sua própria.", "Goethe, Máximas e reflexões"]],
    videos: [["Italiano Automatico", "Italiano Automatico"], ["Easy Italian (entrevistas na rua)", "Easy Italian street interviews"]],
    musicas: [["Lucio Dalla: Caruso", "Lucio Dalla Caruso"], ["Paolo Conte: Azzurro", "Paolo Conte Azzurro"]],
    recursos: [["RaiPlay", "https://www.raiplay.it"], ["Vocabolario Treccani", "https://www.treccani.it/vocabolario/"]] },
  { id: "engenharia", nome: "Engenharia e estudo técnico", g: "estudo", ico: "column", cor: "var(--a-car)", aba: "carreira.caderno", rot: /t[eé]cnic|bim|geotec|engenhar|ingegner/i,
    por: "Engenharia civil, BIM, geotecnia e megaconstruções: o que você estuda e o que faz no trabalho.",
    texto: "Toda obra grande começa como uma pergunta pequena e bem feita: por que esta solução e não outra? Hoje, escolha um elemento (uma fundação, um muro de contenção, um modelo BIM) e entenda uma decisão de projeto até o fim.",
    aquec: ["Escreva no topo de uma folha a pergunta técnica que você quer responder hoje.", "Desenhe à mão, em 2 minutos, o esquema do problema (cargas, solo, apoios).", "Liste o que você já sabe e o que precisa procurar (norma, livro, modelo)."],
    desafios: ["Resolva um exercício de mecânica dos solos sem olhar a resposta e confira.", "Abra um modelo BIM e explique a um colega imaginário a lógica de um elemento.", "Leia uma seção do Eurocódigo 7 e anote no Caderno técnico o que mudaria na sua prática."],
    perguntas: ["Que decisão técnica do seu trabalho você aceita sem entender por completo?", "O que você gostaria de saber fazer melhor que todos na equipe?"],
    frases: [["Toda obra deve atender à solidez, à utilidade e à beleza.", "Vitrúvio, De Architectura, livro I, cap. 3 (firmitas, utilitas, venustas)"]],
    videos: [["Practical Engineering", "Practical Engineering Grady"], ["Megaconstruções e como foram feitas", "Real Engineering megaproject"]],
    musicas: [["Bach: Variações Goldberg (Glenn Gould, 1981)", "Glenn Gould Goldberg Variations 1981"], ["Philip Glass: Koyaanisqatsi", "Philip Glass Koyaanisqatsi"]],
    recursos: [["Eurocódigos (JRC)", "https://eurocodes.jrc.ec.europa.eu"], ["buildingSMART (IFC, openBIM)", "https://www.buildingsmart.org"]] },
  { id: "ciencia", nome: "Astronomia e física", g: "estudo", ico: "atom", cor: "var(--a-pro)", aba: "lazer.estudos", rot: /astro|f[ií]sica|ci[eê]ncia/i, mentor: "lzest",
    por: "Buracos negros, relatividade, gravitação, cordas: as perguntas grandes que você gosta de perseguir.",
    texto: "A física moderna é feita de ideias que pareceram absurdas antes de parecer óbvias. Hoje, pegue uma delas (a curvatura do espaço-tempo, o horizonte de eventos) e tente explicá-la com um desenho, sem fórmula.",
    aquec: ["Escreva a pergunta que você quer entender, do jeito mais ingênuo possível.", "Desenhe a situação (um corpo, uma luz, um observador).", "Anote o que você acha que acontece antes de ler a resposta."],
    desafios: ["Explique em 5 linhas por que nada escapa de um buraco negro.", "Assista a um vídeo e escreva a dúvida que ficou.", "Abra o Stellarium e encontre a constelação que está no céu de Turim agora."],
    perguntas: ["Que ideia da física mudou o jeito como você vê o mundo?", "Se pudesse fazer uma pergunta a Einstein, qual seria?"],
    frases: [["Nós somos uma maneira de o cosmos conhecer a si mesmo.", "Carl Sagan, Cosmos (1980)"], ["A imaginação é mais importante que o conhecimento.", "Albert Einstein, entrevista ao Saturday Evening Post (1929)"]],
    videos: [["Kurzgesagt: buracos negros", "Kurzgesagt black holes"], ["Relatividade explicada", "relatividade geral explicada"]],
    musicas: [["Hans Zimmer: Interstellar", "Hans Zimmer Interstellar soundtrack"], ["Holst: Os Planetas", "Holst The Planets"]],
    recursos: [["NASA: imagem astronômica do dia", "https://apod.nasa.gov/apod/"], ["Stellarium Web (o céu agora)", "https://stellarium-web.org"]] },
  { id: "filosofia", nome: "Filosofia", g: "estudo", ico: "chapters", cor: "var(--a-men)", aba: "jornada.filosofia", rot: /filosof/i,
    por: "O estoicismo já está na sua Jornada; a filosofia dá as perguntas certas para o resto.",
    texto: "Filosofar é parar uma ideia no meio do caminho e perguntar se ela se sustenta. Hoje, escolha uma frase em que você acredita e procure o melhor argumento contra ela.",
    aquec: ["Escreva uma crença sua em uma frase.", "Escreva o argumento mais forte contra ela.", "Diga o que mudaria na sua semana se o argumento contrário estivesse certo."],
    desafios: ["Leia um verbete da Stanford Encyclopedia e resuma em 5 linhas.", "Aplique a dicotomia do controle a um problema real de hoje.", "Escreva um diálogo curto entre Sêneca e você sobre o seu tempo."],
    perguntas: ["O que você faz por hábito e nunca questionou?", "Que virtude falta mais nesta semana?"],
    frases: [["Não é que tenhamos pouco tempo, mas desperdiçamos muito.", "Sêneca, Sobre a brevidade da vida, I"], ["Não são as coisas que perturbam os homens, mas as opiniões sobre as coisas.", "Epicteto, Manual, 5"]],
    videos: [["Clóvis de Barros Filho", "Clóvis de Barros Filho palestra"], ["Estoicismo, introdução", "estoicismo introdução Sêneca Epicteto"]],
    musicas: [["Arvo Pärt: Spiegel im Spiegel", "Arvo Pärt Spiegel im Spiegel"]],
    recursos: [["Stanford Encyclopedia of Philosophy", "https://plato.stanford.edu"]] },
  { id: "leitura", nome: "Leitura", g: "lazer", ico: "book", cor: "var(--a-apr)", aba: "lazer.leitura", rot: /lettura|leitura|reading|livro|libro/i, mentor: "lzlei",
    por: "Ficção científica, mistério, espiritismo e filosofia: os livros que você já escolheu.",
    texto: "Ler bem é ler devagar o suficiente para que o livro converse com você. Hoje, antes de abrir, lembre onde a história parou e o que você espera do próximo capítulo.",
    aquec: ["Lembre em uma frase onde a leitura parou.", "Escreva uma previsão para o próximo capítulo.", "Desligue as notificações por 30 minutos."],
    desafios: ["Leia 20 páginas e anote uma frase que valha guardar.", "Ao terminar, registre no Lazer com nota e uma linha.", "Leia um conto de Sherlock Holmes no original, no Project Gutenberg."],
    perguntas: ["Que personagem você seria nesta história?", "O que este livro está te ensinando sem dizer?"],
    frases: [["Um leitor vive mil vidas antes de morrer. O homem que nunca lê vive apenas uma.", "George R. R. Martin, A Dança dos Dragões (2011)"], ["Sempre imaginei que o Paraíso fosse uma espécie de biblioteca.", "Jorge Luis Borges, Poema dos dons (1960)"]],
    videos: [["Resenhas de ficção científica", "melhores livros ficção científica"]],
    musicas: [["Erik Satie: Gymnopédies", "Erik Satie Gymnopédies"], ["Max Richter: Sleep", "Max Richter Sleep"]],
    recursos: [["Project Gutenberg (clássicos grátis)", "https://www.gutenberg.org"]] },
  { id: "cinema", nome: "Filmes e séries", g: "lazer", ico: "film", cor: "var(--a-amo)", aba: "lazer.filmes", mentor: "lzfil",
    por: "Ficção científica, velho oeste e clássicos de qualidade: assistir como quem lê.",
    texto: "Um bom filme pede atenção inteira. Hoje, escolha um título que alguém que você respeita considera obra-prima e assista sem celular por perto.",
    aquec: ["Leia só a sinopse, sem spoilers.", "Descubra quem dirigiu e o que mais fez.", "Escolha um detalhe para observar: a luz, a trilha ou a montagem."],
    desafios: ["Assista e escreva 3 linhas: o que funcionou, o que não, uma cena.", "Reveja uma cena favorita e observe como foi filmada.", "Registre no Lazer e peça ao mentor um próximo título no mesmo nível."],
    perguntas: ["Que filme mudou o seu jeito de ver alguma coisa?", "O que um clássico tem que um filme comum não tem?"],
    frases: [["Tudo o que temos de decidir é o que fazer com o tempo que nos é dado.", "Gandalf, em J. R. R. Tolkien, A Sociedade do Anel"], ["Existe uma diferença entre conhecer o caminho e percorrer o caminho.", "Morpheus, em Matrix (1999)"]],
    videos: [["Análises de cinema", "film analysis cinematography"]],
    musicas: [["Ennio Morricone: Il buono, il brutto, il cattivo", "Ennio Morricone Il buono il brutto il cattivo"], ["Howard Shore: O Senhor dos Anéis", "Howard Shore Lord of the Rings soundtrack"]],
    recursos: [["Letterboxd", "https://letterboxd.com"]] },
  { id: "jogos", nome: "Jogos de estratégia", g: "lazer", ico: "gamepad", cor: "var(--a-laz)", aba: "lazer.jogos", rot: /jogo|gioc|game|fortnite|minecraft/i, mentor: "lzjog",
    por: "Fortnite, Minecraft, Pokémon TCG e The Settlers: jogos que pedem planejamento.",
    texto: "Jogar bem é aprender um sistema. Hoje, escolha uma mecânica que você ainda faz no automático e jogue uma partida só para entendê-la.",
    aquec: ["Defina um objetivo para a partida que não seja só vencer.", "Revise uma estratégia ou um deck por 2 minutos.", "Combine com você mesmo a hora de parar."],
    desafios: ["Monte um deck de Pokémon TCG com um tema e teste 3 partidas.", "Construa no Minecraft uma estrutura de engenharia real (uma ponte, um arco).", "Termine uma partida de Settlers anotando a sua economia a cada 10 min."],
    perguntas: ["O que este jogo te ensina sobre decisões?", "Quando jogar descansa e quando cansa?"],
    frases: [["Jogar um jogo é a tentativa voluntária de superar obstáculos desnecessários.", "Bernard Suits, A Cigarra (1978)"]],
    videos: [["Estratégia de Pokémon TCG", "Pokemon TCG deck building strategy"], ["Engenharia no Minecraft", "Minecraft engineering build"]],
    musicas: [["C418: Minecraft Volume Alpha", "C418 Minecraft Volume Alpha"]],
    recursos: [["BoardGameGeek", "https://boardgamegeek.com"]] },
  { id: "viagens", nome: "Planejar uma viagem", g: "lazer", ico: "globe", cor: "var(--a-car)", aba: "lazer.viagens", mentor: "lzvia",
    por: "Arredores de Turim, Itália, Europa, Japão e Brasil: planejar já é metade da viagem.",
    texto: "Uma boa viagem começa com uma pergunta: o que eu quero sentir lá? Hoje, escolha um destino e desenhe um dia perfeito nele, hora a hora.",
    aquec: ["Escolha o destino e a estação do ano.", "Escreva o que quer viver lá (não só ver).", "Descubra como chegar de trem ou avião saindo de Turim."],
    desafios: ["Monte um bate-volta de trem a partir de Turim para o próximo sábado livre.", "Faça o orçamento de uma viagem e coloque em Finanças › Projetos.", "Peça ao mentor de Viagens um roteiro de 3 dias."],
    perguntas: ["Que lugar você adia há anos?", "Viajar sozinho, a dois ou com a família: o que muda o roteiro?"],
    frases: [["Viajar é fatal para o preconceito, a intolerância e a estreiteza de espírito.", "Mark Twain, A Viagem dos Inocentes (1869)"]],
    videos: [["Roteiros pelo Piemonte", "Piemonte cosa vedere"], ["Japão para quem vai pela primeira vez", "Japan first time travel guide"]],
    musicas: [["Ludovico Einaudi (nascido em Turim): Experience", "Ludovico Einaudi Experience"]],
    recursos: [["Rome2Rio (como chegar)", "https://www.rome2rio.com"], ["Trenitalia", "https://www.trenitalia.com"]] },
  { id: "cafe", nome: "Café de especialidade", g: "criar", ico: "coffee", cor: "#c08552", aba: "lazer.cafe", mentor: "lzcaf",
    por: "Torra, moagem, espresso e V60: o seu laboratório de precisão em casa.",
    texto: "Uma xícara boa é uma receita controlada: proporção, moagem, temperatura e tempo. Hoje, mude uma variável só e prove a diferença.",
    aquec: ["Anote a receita de sempre (gramas, água, tempo).", "Escolha uma única variável para mudar.", "Prepare duas xícaras lado a lado e prove em silêncio."],
    desafios: ["V60: teste a técnica de James Hoffmann e compare com a sua.", "Ajuste o espresso para 1:2 em 28 a 30 s e anote o sabor.", "Torre um lote pequeno e registre a curva e o resultado no Lazer."],
    perguntas: ["Que sabor você está tentando encontrar?", "O que a sua melhor xícara do mês tinha de diferente?"],
    frases: [["…as ideias se põem em marcha como os batalhões do Grande Exército no campo de batalha.", "Honoré de Balzac, Tratado dos excitantes modernos (1839), sobre o café"]],
    videos: [["James Hoffmann: V60", "James Hoffmann ultimate V60 technique"], ["Espresso: como regular", "espresso dial in guide"]],
    musicas: [["João Gilberto: Chega de Saudade", "João Gilberto Chega de Saudade"]],
    recursos: [["Barista Hustle", "https://www.baristahustle.com"]] },
  { id: "aviacao", nome: "Aviação e simulação de voo", g: "criar", ico: "plane", cor: "#4fa3e3", aba: "lazer.aviacao", mentor: "lzavi",
    por: "Estudo de aeronaves, X-Plane e Microsoft Flight Simulator: engenharia que voa.",
    texto: "Voar no simulador é treinar procedimento: checklist, briefing, decisão. Hoje, planeje um voo real, com rota, combustível e meteorologia, e voe como se houvesse passageiros.",
    aquec: ["Escolha a rota (sugestão: Turim–Nice ou Turim–Roma).", "Gere o plano no SimBrief e leia o briefing.", "Revise o checklist de partida da aeronave."],
    desafios: ["Faça uma aproximação ILS manual até o pouso.", "Simule uma falha de motor na decolagem e siga o procedimento.", "Assista a um episódio do Aviões e Músicas sobre a aeronave que você voa."],
    perguntas: ["Que procedimento você ainda faz sem entender?", "Que aeronave você quer dominar até o fim do ano?"],
    frases: [["O avião é uma máquina, sem dúvida, mas que instrumento de análise!", "Antoine de Saint-Exupéry, Terra dos Homens (1939)"]],
    videos: [["Aviões e Músicas (Lito Sousa)", "Aviões e Músicas Lito Sousa"], ["MSFS: aproximação ILS", "MSFS ILS approach tutorial"]],
    musicas: [["John Williams: Flying Theme (E.T.)", "John Williams E.T. Flying Theme"]],
    recursos: [["SimBrief (plano de voo)", "https://www.simbrief.com"], ["SKYbrary (segurança de voo)", "https://skybrary.aero"]] },
  { id: "treino", nome: "Treino", g: "corpo", ico: "dumbbell", cor: "var(--a-sau)", aba: "saude.treinos", rot: /palestra|treino|academia|gym|stretching|alongamento/i,
    por: "A academia da semana: força que sustenta o resto.",
    texto: "O treino que conta é o que acontece. Hoje, entre com um objetivo pequeno e claro para uma série só, e cumpra.",
    aquec: ["Abra a ficha e veja a carga sugerida para hoje.", "Escolha o exercício em que quer progredir.", "5 minutos de mobilidade antes de começar."],
    desafios: ["Bata a carga ou as repetições sugeridas no exercício principal.", "Registre todas as séries de trabalho na hora.", "Termine com 5 minutos de alongamento."],
    perguntas: ["Como está a energia hoje, de 1 a 5?", "O que o corpo pediu nesta semana?"],
    frases: [["Mente sã em corpo são.", "Juvenal, Sátiras, X, 356"]],
    videos: [["Execução correta", "Jeff Nippard technique"], ["Treino explicado em português", "Renato Cariani treino"]],
    musicas: [["AC/DC: Back in Black", "AC/DC Back in Black album"]],
    recursos: [["ExRx (biblioteca de exercícios)", "https://exrx.net"]] },
  { id: "meditacao", nome: "Meditação", g: "espirito", ico: "lotus", cor: "var(--jp-med)", aba: "jornada.meditacao", rot: /medita/i,
    por: "Poucos minutos por dia que sustentam todo o resto.",
    texto: "Meditar não é esvaziar a mente, é perceber para onde ela vai e voltar. Hoje, conte quantas vezes você volta: cada volta é uma repetição do treino.",
    aquec: ["Sente-se e deixe o celular longe.", "Três respirações lentas, contando 4 para entrar e 6 para sair.", "Escolha a âncora: respiração, sons ou corpo."],
    desafios: ["10 minutos contando as voltas para a âncora.", "Uma caminhada de 10 minutos prestando atenção nos passos.", "Registre a sessão na Jornada com o estado antes e depois."],
    perguntas: ["Para onde a mente foi mais vezes hoje?", "O que mudou depois de meditar?"],
    frases: [["O milagre não é andar sobre a água, é andar sobre a terra verde, no momento presente.", "Thich Nhat Hanh, Touching Peace (1992)"], ["Uma jornada de mil li começa sob os pés.", "Lao-Tsé, Tao Te Ching, 64"]],
    videos: [["Meditação guiada (Monja Coen)", "Monja Coen meditação guiada"]],
    musicas: [["Hiroshi Yoshimura: Music for Nine Postcards", "Hiroshi Yoshimura Music for Nine Postcards"]],
    recursos: [["Plum Village (meditações guiadas)", "https://plumvillage.app"]] },
  { id: "espiritismo", nome: "Estudo espírita", g: "espirito", ico: "book", cor: "var(--jp-esp, var(--accent))", aba: "jornada.espiritismo", rot: /spirit|esp[ií]rit|vangelo|evangelho|kardec/i,
    por: "Leitura espírita, Evangelho no Lar e o estudo da doutrina: fé que pede razão.",
    texto: "O estudo espírita pede as duas coisas: o coração aberto e o raciocínio desperto. Hoje, leia um trecho curto e pergunte como ele se aplica a uma situação concreta da sua semana.",
    aquec: ["Uma prece curta, com as suas palavras.", "Leia um item de O Evangelho segundo o Espiritismo.", "Escreva em uma frase o que o trecho pede de você."],
    desafios: ["Leia um capítulo e anote uma dúvida para levar ao grupo.", "Aplique o trecho a uma relação difícil desta semana.", "Registre a leitura como prática na Jornada."],
    perguntas: ["Que inclinação você está trabalhando agora?", "Onde a caridade coube nesta semana?"],
    frases: [["Reconhece-se o verdadeiro espírita pela sua transformação moral e pelos esforços que emprega para domar suas más inclinações.", "Allan Kardec, O Evangelho segundo o Espiritismo, cap. XVII, item 4"], ["Fé inabalável só o é a que pode encarar frente a frente a razão, em todas as épocas da Humanidade.", "Allan Kardec, O Evangelho segundo o Espiritismo, cap. XIX, item 7"]],
    videos: [["Haroldo Dutra Dias", "Haroldo Dutra Dias palestra"], ["Divaldo Franco", "Divaldo Franco palestra"]],
    musicas: [["Bach: Ária na corda Sol", "Bach Air on the G String"]],
    recursos: [["Kardecpedia (obras de Kardec)", "https://kardecpedia.com"], ["Federação Espírita Brasileira", "https://www.febnet.org.br"]] },
  { id: "tao", nome: "Taoísmo e Budismo", g: "espirito", ico: "yinyang", cor: "var(--jp-tao, var(--accent))", aba: "jornada.taoismo",
    por: "Os outros dois pilares da sua Jornada: o caminho do equilíbrio e o da atenção.",
    texto: "O Tao fala de agir sem forçar; o Buda, de ver as coisas como são. Hoje, escolha uma situação em que você está forçando e experimente ceder um pouco.",
    aquec: ["Leia um capítulo curto do Tao Te Ching.", "Releia uma frase em voz baixa, devagar.", "Escreva onde ela toca a sua semana."],
    desafios: ["Escolha um capítulo e viva a frase dele por um dia.", "Faça uma tarefa do dia sem pressa, como prática.", "Registre a reflexão na Jornada."],
    perguntas: ["Onde você está forçando o que não precisa?", "O que você precisa soltar?"],
    frases: [["Quem conhece os outros é inteligente; quem conhece a si mesmo é iluminado.", "Lao-Tsé, Tao Te Ching, 33"], ["Tudo o que somos é resultado do que pensamos.", "Dhammapada, verso 1"]],
    videos: [["Alan Watts sobre o Tao", "Alan Watts Tao"]],
    musicas: [["Guqin: música chinesa tradicional", "guqin traditional chinese music"]],
    recursos: [["Tao Te Ching no Project Gutenberg", "https://www.gutenberg.org/ebooks/search/?query=tao+te+ching"]] },
  /* sugeridas: vizinhas das de cima */
  { id: "escrita", nome: "Escrever (ensaio, diário longo)", g: "sugeridas", ico: "pen", cor: "var(--a-men)", aba: "diario",
    por: "Liga a filosofia, a leitura e o Diário: escrever é pensar com mais nitidez.",
    texto: "Você não escreve o que pensa, descobre o que pensa ao escrever. Hoje, escolha uma pergunta da semana e escreva 15 minutos sem parar e sem corrigir.",
    aquec: ["Escreva a pergunta no topo.", "Programe 15 minutos.", "Comece com “O que eu sei é…”."],
    desafios: ["Um ensaio de 300 palavras sobre uma ideia de filosofia.", "Uma carta para você daqui a um ano.", "Reescreva a entrada do Diário mais importante do mês."],
    perguntas: ["O que você ainda não disse a si mesmo?", "Que ideia você repete e nunca escreveu?"],
    frases: [["Escrevo inteiramente para descobrir o que estou pensando.", "Joan Didion, Por que escrevo (1976)"]],
    videos: [["Como escrever ensaios", "how to write an essay clearly"]],
    musicas: [["Nils Frahm: Says", "Nils Frahm Says"]], recursos: [] },
  { id: "ceu", nome: "Observar o céu", g: "sugeridas", ico: "star", cor: "var(--a-pro)", aba: "lazer.estudos",
    por: "A astronomia que você estuda, vista a olho nu ou com binóculo, na varanda.",
    texto: "Depois de ler sobre galáxias, ver Júpiter com um binóculo muda tudo. Hoje, confira o céu e encontre um objeto: uma constelação, um planeta, a Lua.",
    aquec: ["Veja a previsão de nuvens para a noite.", "Abra o Stellarium e escolha um alvo.", "Desligue as luzes 10 minutos antes para os olhos se acostumarem."],
    desafios: ["Ache Júpiter ou Saturno e anote a hora.", "Desenhe a Lua como você vê, com as crateras.", "Fotografe uma constelação com o celular em modo noturno."],
    perguntas: ["Quanto tempo a luz daquela estrela levou para chegar até você?", "O que muda quando você olha para cima?"],
    frases: [["Olhe de novo para esse ponto. É aqui. É a nossa casa.", "Carl Sagan, Pálido Ponto Azul (1994)"]],
    videos: [["Astronomia para iniciantes", "stargazing for beginners"]],
    musicas: [["Vangelis: Heaven and Hell (abertura de Cosmos)", "Vangelis Heaven and Hell Cosmos"]],
    recursos: [["Stellarium Web", "https://stellarium-web.org"], ["Clear Outside (nuvens)", "https://clearoutside.com"]] },
  { id: "esboco", nome: "Esboço à mão", g: "sugeridas", ico: "edit", cor: "var(--a-laz)", aba: "lazer",
    por: "Desenhar estruturas e lugares treina o olho do engenheiro e acalma a mente.",
    texto: "Desenhar é olhar com o lápis. Hoje, sente-se diante de uma ponte, um prédio ou um objeto e desenhe por 10 minutos, sem apagar.",
    aquec: ["Escolha o que vai desenhar.", "Olhe 1 minuto sem desenhar.", "Comece pelas linhas principais, como um esquema estrutural."],
    desafios: ["Um esboço de uma ponte de Turim.", "O mesmo objeto em 3 minutos, depois em 10.", "Desenhe o corte de um muro de contenção de cabeça."],
    perguntas: ["O que você viu desenhando que não tinha visto antes?"],
    frases: [["Um desenho é uma linha que saiu para passear.", "Paul Klee, Caderno de esboços pedagógico (1925), em paráfrase"]],
    videos: [["Urban sketching para iniciantes", "urban sketching for beginners"]],
    musicas: [["Lo-fi para desenhar", "lofi hip hop drawing"]],
    recursos: [["Urban Sketchers", "https://urbansketchers.org"]] },
  { id: "construir", nome: "Montar e construir", g: "sugeridas", ico: "box", cor: "var(--a-car)", aba: "lazer",
    por: "LEGO Technic, maquetes de aviões ou pontes: engenharia com as mãos, por prazer.",
    texto: "Montar à mão devolve o que o computador tira: a sensação do material. Hoje, monte algo pequeno e entenda por que cada peça está ali.",
    aquec: ["Separe as peças por tipo.", "Leia o manual até a primeira etapa difícil.", "Combine com você um tempo, sem pressa de terminar."],
    desafios: ["Monte um mecanismo (engrenagem, alavanca) e explique a transmissão.", "Faça a maquete de uma treliça com palitos e teste a carga.", "Monte um avião em escala e estude a aerodinâmica dele."],
    perguntas: ["Que mecanismo você gostaria de entender de verdade?"],
    frases: [], videos: [["LEGO Technic: mecanismos", "LEGO Technic mechanisms explained"]], musicas: [["Daft Punk: Random Access Memories", "Daft Punk Random Access Memories"]],
    recursos: [["LEGO Technic", "https://www.lego.com/themes/technic"]] },
  { id: "programar", nome: "Programar para a engenharia", g: "sugeridas", ico: "layers", cor: "var(--a-apr)", aba: "carreira.plano",
    por: "Python e Dynamo automatizam o BIM e os cálculos repetitivos: tempo devolvido.",
    texto: "Toda tarefa repetida três vezes merece um script. Hoje, escolha uma conta ou um passo do BIM que você faz sempre à mão e automatize uma parte dele.",
    aquec: ["Escreva a tarefa em passos, como uma receita.", "Marque o passo mais chato.", "Procure um exemplo pronto parecido."],
    desafios: ["Um script em Python que calcula um empuxo de terra.", "Um gráfico do Dynamo que renomeia elementos em lote.", "Uma planilha que confere uma verificação de norma."],
    perguntas: ["Que tarefa do trabalho você gostaria de nunca mais fazer à mão?"],
    frases: [["O programador, como o poeta, trabalha só um pouco afastado do puro material do pensamento.", "Fred Brooks, O Mítico Homem-Mês (1975)"]],
    videos: [["Python para engenheiros civis", "Python for civil engineers"], ["Dynamo para Revit", "Dynamo Revit tutorial beginner"]],
    musicas: [["Tycho: Dive", "Tycho Dive album"]],
    recursos: [["Dynamo BIM", "https://dynamobim.org"], ["Documentação do Python", "https://docs.python.org/3/"]] },
  { id: "cozinha", nome: "Cozinhar com método", g: "sugeridas", ico: "flame", cor: "#d9783a", aba: "saude.alimentacao",
    por: "A mesma precisão do café, aplicada à comida, e um jeito de cuidar da alimentação.",
    texto: "Cozinhar bem é entender três ou quatro técnicas e repetir. Hoje, escolha uma técnica (selar, emulsionar, assar) e faça um prato só para praticá-la.",
    aquec: ["Escolha a técnica do dia.", "Separe e pese os ingredientes antes de ligar o fogo.", "Leia a receita inteira uma vez."],
    desafios: ["Um risotto piemontês do começo ao fim.", "Um molho emulsionado sem talhar.", "Um prato com proteína que caiba na meta do Nutri."],
    perguntas: ["Que prato da infância você gostaria de saber fazer?"],
    frases: [["Diz-me o que comes e te direi quem és.", "Brillat-Savarin, A fisiologia do gosto (1825), aforismo IV"]],
    videos: [["Técnica de cozinha", "Ethan Chlebowski technique"], ["Paola Carosella", "Paola Carosella receita"]],
    musicas: [["Paolo Conte (de Asti)", "Paolo Conte best songs"]],
    recursos: [["Serious Eats", "https://www.seriouseats.com"]] },
  { id: "escuta", nome: "Ouvir um álbum inteiro", g: "sugeridas", ico: "wave", cor: "var(--a-amo)", aba: "lazer",
    por: "Escuta atenta, como ler um livro: descanso que não é rolagem de tela.",
    texto: "Um álbum foi pensado como uma obra, do começo ao fim. Hoje, escolha um disco inteiro e ouça sem fazer outra coisa.",
    aquec: ["Escolha o álbum e o lugar.", "Leia 2 minutos sobre como foi gravado.", "Fones, luz baixa, celular longe."],
    desafios: ["Ouça The Dark Side of the Moon inteiro.", "Ouça Kind of Blue e repare no silêncio entre as notas.", "Escreva 3 linhas sobre o que sentiu."],
    perguntas: ["Que música marcou cada fase da sua vida?"],
    frases: [["Sem música, a vida seria um erro.", "Friedrich Nietzsche, Crepúsculo dos ídolos, Máximas e flechas, 33"]],
    videos: [["Como um álbum clássico foi feito", "making of classic album documentary"]],
    musicas: [["Pink Floyd: The Dark Side of the Moon", "Pink Floyd The Dark Side of the Moon full album"], ["Miles Davis: Kind of Blue", "Miles Davis Kind of Blue full album"]], recursos: [] },
  { id: "caminhada", nome: "Caminhada sem destino", g: "sugeridas", ico: "leaf", cor: "var(--a-sau)", aba: "hoje",
    por: "Junta movimento, Taoísmo e os passeios: as melhores ideias vêm andando.",
    texto: "Caminhar sem destino é deixar o pensamento andar no ritmo das pernas. Hoje, saia 20 minutos sem fone e sem rota.",
    aquec: ["Veja o tempo no Hoje.", "Deixe o fone em casa.", "Leve uma pergunta para pensar no caminho."],
    desafios: ["20 minutos por uma rua que você nunca andou.", "Suba ao Monte dei Cappuccini no fim da tarde.", "Ao voltar, escreva a ideia que apareceu."],
    perguntas: ["Que pergunta você vai levar para a caminhada?"],
    frases: [["Só têm valor os pensamentos que nos vêm ao caminhar.", "Friedrich Nietzsche, Crepúsculo dos ídolos, Máximas e flechas, 34"]],
    videos: [["Meditação andando", "Thich Nhat Hanh walking meditation"]], musicas: [], recursos: [] },
  { id: "ensinar", nome: "Explicar o que aprendeu", g: "sugeridas", ico: "brain", cor: "var(--a-pro)", aba: "carreira.caderno",
    por: "O jeito mais rápido de fixar o estudo técnico e os idiomas: explicar para alguém.",
    texto: "Se você não consegue explicar de forma simples, ainda não entendeu. Hoje, escolha o que estudou nesta semana e explique como se fosse para um colega júnior.",
    aquec: ["Escolha um conceito.", "Escreva a explicação em palavras simples, sem jargão.", "Marque onde travou: é ali que falta estudo."],
    desafios: ["Explique um conceito de geotecnia em 5 frases para um leigo.", "Grave um áudio de 2 minutos explicando em inglês.", "Ensine a um colega da equipe numa conversa de café."],
    perguntas: ["O que você entendeu de verdade nesta semana?"],
    frases: [["O que eu não consigo criar, eu não entendo.", "Richard Feynman, no quadro-negro em 1988"]],
    videos: [["A técnica Feynman", "Feynman technique explained"]], musicas: [], recursos: [] },
  { id: "bem", nome: "Fazer o bem", g: "sugeridas", ico: "heart", cor: "var(--a-amo)", aba: "jornada.espiritismo",
    por: "A caridade que o estudo espírita pede, em uma ação concreta por semana.",
    texto: "Um gesto pequeno e certo vale mais que uma intenção grande. Hoje, escolha uma pessoa ou causa e faça uma coisa por ela.",
    aquec: ["Pense em quem precisa de algo que você pode dar (tempo, atenção, ajuda).", "Escolha uma ação de até 30 minutos.", "Marque na Rotina quando vai fazer."],
    desafios: ["Ligue para alguém que está sozinho.", "Procure um voluntariado em Turim para um sábado.", "Ajude um colega júnior sem que ele peça."],
    perguntas: ["Quem precisaria de você nesta semana?"],
    frases: [["Fora da caridade não há salvação.", "Allan Kardec, O Evangelho segundo o Espiritismo, cap. XV"]],
    videos: [], musicas: [], recursos: [["Volontariato em Turim (busca)", "https://www.google.com/search?q=volontariato+Torino"]] },
];
const INS = { sel: "", grupo: "", q: "", t0: 0, passo: -1, des: {} };
const insData = () => { const d = (S.inspira ||= {}); d.ativs ||= {}; d.minhas ||= []; d.esforco ||= "medio"; return d; };
const insTodas = () => [...INSP, ...insData().minhas.map(m => ({ g: "minhas", ico: "spark", cor: "var(--accent)", aquec: [], desafios: [], perguntas: [], frases: [], videos: [], musicas: [], recursos: [], ...m }))];
const insAtv = id => insTodas().find(a => a.id === id);
/* o próximo bloco da rotina que combina com uma atividade (para “para começar agora”) */
function insDaRotina() {
  /* um título pode casar com mais de uma (“leitura espírita”): a leitura genérica fica por último */
  const m = nowMin(); for (const b of rtOcc(TODAY).sort((x, y) => x.a - y.a)) { if (b.z <= m) continue; const c = INSP.filter(x => x.rot?.test(b.titulo)), a = c.find(x => x.id !== "leitura") || c[0]; if (a) return { a, b }; }
  return null;
}
function insCard(a) {
  const st = insData().ativs[a.id];
  return `<button type="button" class="inscard${INS.sel === a.id ? " on" : ""}" data-insa="${esc(a.id)}" style="--c:${a.cor}" aria-pressed="${INS.sel === a.id}"><span class="insico">${ic(a.ico)}</span><b>${esc(a.nome)}</b><small>${esc(a.por || "")}</small>${st?.n ? `<i>${plural(st.n, "começo", "começos")}</i>` : ""}</button>`;
}
function insDetalhe(a) {
  const st = insData().ativs[a.id] || {}, co = typeof coAtivo === "function" && coAtivo() === a.id, d = INS.des[a.id] ?? 0, link = (l, u) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a>`;
  const passo = INS.t0 && INS.sel === a.id ? Math.min(2, Math.floor((Date.now() - INS.t0) / 100e3)) : -1;
  return `<section class="pn insdet" style="--c:${a.cor}" aria-label="${esc(a.nome)}"><header class="insh"><span class="insico big">${ic(a.ico)}</span><div><h2>${esc(a.nome)}</h2>${a.por ? `<p class="muted">${esc(a.por)}</p>` : ""}</div>
      <div class="row wrap"><button type="button" class="btn sm${co ? "" : " primary"}" data-act="coon" data-a="${esc(a.id)}">${ic("spark")}${co ? "Acompanhamento ativo" : "Ativar acompanhamento"}</button>${a.aba ? `<a class="btn sm ghost" href="#${esc(a.aba)}">abrir no Atlas</a>` : ""}${a.g === "minhas" ? `<button type="button" class="btn sm ghost" data-insdel="${esc(a.id)}" aria-label="Apagar ${esc(a.nome)}">${ic("trash")}</button>` : ""}</div></header>
    ${a.texto ? `<p class="instx">${esc(a.texto)}</p>` : ""}
    ${a.aquec?.length ? `<div class="insblk"><div class="flbl">Aquecimento de 5 minutos</div><ol class="insaq">${a.aquec.map((x, i) => `<li class="${passo === i ? "on" : passo > i ? "ok" : ""}">${esc(x)}</li>`).join("")}</ol>
      <button type="button" class="btn sm" data-act="insgo" data-a="${esc(a.id)}">${ic("clock")}${INS.t0 && INS.sel === a.id ? "Recomeçar o aquecimento" : "Começar o aquecimento"}</button>${INS.t0 && INS.sel === a.id ? `<span class="muted small" id="insclk"></span>` : ""}</div>` : ""}
    ${a.desafios?.length ? `<div class="insblk"><div class="flbl">Primeiro passo de hoje</div><p class="insdes">${esc(a.desafios[d % a.desafios.length])}</p><div class="row wrap"><button type="button" class="btn sm primary" data-act="insfeito" data-a="${esc(a.id)}">${ic("check")}Comecei</button><button type="button" class="lnk" data-act="insoutro" data-a="${esc(a.id)}">outro desafio</button></div>${st.n ? `<small class="muted">${plural(st.n, "vez", "vezes")} começada, a última em ${fmtDL(st.ultima)}.</small>` : ""}</div>` : ""}
    ${a.frases?.length ? `<div class="insblk">${a.frases.map(([f, s]) => `<blockquote class="hjq1"><p>${esc(f)}</p><cite>${esc(s)}</cite></blockquote>`).join("")}</div>` : ""}
    ${a.perguntas?.length ? `<div class="insblk"><div class="flbl">Para pensar</div><ul>${a.perguntas.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
    <div class="insmid">${a.videos?.length ? `<div><div class="flbl">${ic("film")}Vídeos</div><ul>${a.videos.map(([l, q]) => `<li>${link(l, YT(q))}</li>`).join("")}</ul></div>` : ""}${a.musicas?.length ? `<div><div class="flbl">${ic("wave")}Música para o clima</div><ul>${a.musicas.map(([l, q]) => `<li>${link(l, YT(q))}</li>`).join("")}</ul></div>` : ""}${a.recursos?.length ? `<div><div class="flbl">${ic("link")}Recursos</div><ul>${a.recursos.map(([l, u]) => `<li>${link(l, u)}</li>`).join("")}</ul></div>` : ""}</div>
    ${a.videos?.length || a.musicas?.length ? `<p class="muted small">Vídeos e músicas abrem uma busca no YouTube numa aba nova: o link não quebra quando um vídeo sai do ar.</p>` : ""}
    ${a.g === "minhas" && !a.texto ? `<div class="insblk"><button type="button" class="btn sm" data-act="insgera" data-a="${esc(a.id)}"${SAMPLE && !AI_OFF ? "" : " disabled"}>${ic("spark")}Montar a inspiração com a IA</button>${INS.gerando === a.id ? `<span class="muted small">montando…</span>` : ""}</div>` : ""}
  </section>`;
}
function pInspira() {
  const D = insData(), q = normNome(INS.q), lista = insTodas().filter(a => (!INS.grupo || a.g === INS.grupo) && (!q || normNome(`${a.nome} ${a.por || ""}`).includes(q)));
  const agora = insDaRotina(), sel = insAtv(INS.sel) || (agora?.a) || null;
  if (sel && !INS.sel) INS.sel = sel.id;
  return `${agora ? `<div class="pn insnow">${ic("clock")}<span>Próximo na sua rotina: <b>${esc(agora.b.titulo)}</b> às ${agora.b.ini} → <button type="button" class="lnk" data-insa="${esc(agora.a.id)}">${esc(agora.a.nome)}</button></span></div>` : ""}
    <div class="insbar"><div class="seg-g" role="group" aria-label="Grupos"><button type="button" class="seg" data-insg="" aria-pressed="${!INS.grupo}">Todas</button>${INSP_GRUPOS.filter(([k]) => k !== "minhas" || D.minhas.length).map(([k, l]) => `<button type="button" class="seg" data-insg="${k}" aria-pressed="${INS.grupo === k}">${l}</button>`).join("")}</div>
      <input type="search" id="ins_q" value="${esc(INS.q)}" placeholder="Buscar atividade" aria-label="Buscar atividade"></div>
    <div class="insgrid">${lista.map(insCard).join("") || `<div class="empty">Nenhuma atividade com esse nome.</div>`}</div>
    ${sel ? insDetalhe(sel) : ""}
    ${panel(`${ic("plus")}Minhas atividades`, `<p class="muted small">Uma atividade que não está na lista. Dá para montar a inspiração com a IA (texto, aquecimento, desafios e perguntas).</p><div class="form f2"><label>Nome<input type="text" id="ins_nn" placeholder="Ex.: Violão"></label><label>Por que ela importa<input type="text" id="ins_np" placeholder="Ex.: tocar com a família no domingo"></label></div><button type="button" class="btn sm primary" data-act="insadd">${ic("plus")}Adicionar</button>`)}`;
}
function insTick() { const el = $("#insclk"); if (!el || !INS.t0) return; const s = Math.max(0, 300 - Math.floor((Date.now() - INS.t0) / 1000)); el.textContent = s ? `${Math.floor(s / 60)}:${pad(s % 60)} restantes` : "pronto: hora de começar"; const p = Math.min(2, Math.floor((Date.now() - INS.t0) / 100e3)); $$(".insaq li").forEach((li, i) => { li.classList.toggle("on", i === p && s > 0); li.classList.toggle("ok", i < p || !s); }); if (!s) INS.t0 = 0; }
setInterval(() => { if (PAGE === "inspira") insTick(); }, 1000);
async function insGerar(a) {
  if (!SAMPLE || AI_OFF) return; INS.gerando = a.id; render();
  try { const r = await aiCall("Inspiração", () => [{ role: "user", content: `Monte uma ficha de inspiração em português do Brasil para começar a atividade “${a.nome}”${a.por ? ` (por que importa: ${a.por})` : ""}. Responda só JSON: {"texto": "3 a 4 frases que animam e dizem como começar hoje", "aquec": ["3 passos de um aquecimento de 5 minutos"], "desafios": ["3 primeiros passos pequenos e concretos"], "perguntas": ["2 perguntas para pensar"], "videos": [["rótulo", "termos de busca no YouTube"]]}. Não invente citações.` }], { json: true, modelTier: "default" });
    const j = r && typeof r === "object" ? r : {}, m = insData().minhas.find(x => x.id === a.id); if (m && j.texto) { Object.assign(m, { texto: String(j.texto).slice(0, 600), aquec: (j.aquec || []).slice(0, 3).map(String), desafios: (j.desafios || []).slice(0, 3).map(String), perguntas: (j.perguntas || []).slice(0, 3).map(String), videos: (j.videos || []).slice(0, 3).filter(v => Array.isArray(v) && v.length === 2).map(v => v.map(String)) }); touch("inspira", { label: "Inspiração montada" }); }
  } catch (e) { aiError(e); } finally { INS.gerando = ""; render(); }
}
function insClick(t) {
  const ds = t.dataset;
  if (ds.insa != null) { INS.sel = ds.insa; INS.t0 = 0; render(); setTimeout(() => $(".insdet")?.scrollIntoView({ block: "start", behavior: "smooth" }), 30); return true; }
  if (ds.insg != null) { INS.grupo = ds.insg; render(); return true; }
  if (ds.act === "insgo") { INS.sel = ds.a; INS.t0 = Date.now(); render(); insTick(); return true; }
  if (ds.act === "insoutro") { INS.des[ds.a] = (INS.des[ds.a] ?? 0) + 1; render(); return true; }
  if (ds.act === "insfeito") { const a = insAtv(ds.a), s = (insData().ativs[ds.a] ||= { n: 0, desafios: [] }); s.n++; s.ultima = TODAY; const dz = a?.desafios?.[(INS.des[ds.a] ?? 0) % (a.desafios.length || 1)]; if (dz) s.desafios = [...(s.desafios || []), { data: TODAY, txt: dz }].slice(-30); touch("inspira", { label: "Atividade começada" }); undoToast(`Boa: ${a?.nome || "atividade"} começada.`); return true; }
  if (ds.act === "insadd") { const n = $("#ins_nn")?.value.trim().slice(0, 60), p = $("#ins_np")?.value.trim().slice(0, 160); if (!n) { toast("Dê um nome à atividade."); return true; } const id = "m_" + uid(); insData().minhas.push({ id, nome: n, por: p || "" }); INS.sel = id; INS.grupo = ""; touch("inspira", { label: "Atividade nova" }); return true; }
  if (ds.insdel) { insData().minhas = insData().minhas.filter(m => m.id !== ds.insdel); if (INS.sel === ds.insdel) INS.sel = ""; touch("inspira", { label: "Atividade apagada" }); undoToast("Atividade apagada"); return true; }
  if (ds.act === "insgera") { const a = insAtv(ds.a); if (a) insGerar(a); return true; }
  return false;
}
function insInput(t) { if (t.id !== "ins_q") return false; INS.q = t.value; const p = t.selectionStart; render(); const n = $("#ins_q"); if (n) { n.focus({ preventScroll: true }); n.setSelectionRange(p, p); } return true; }
