/* ================================================================ jornada existencial: quatro pilares, cinco mentores e a bússola no centro
   Dados numa chave só, jornada: { p: { esp|med|tao|bud: { est, prat, refl, cot } }, conf: { vivos, notas, circulos } }.
   O mentor de cada pilar lê o que está registrado nele (menos as reflexões marcadas como só suas) e um resumo dos outros;
   cada conversa e cada círculo passam por aiCall e aparecem no registro de Privacidade. */
const J = { dr: {}, cot: {}, q: { txt: "", p: [], tipo: "reflexão" }, rev: "", circ: { q: "", quem: ["esp", "med", "tao", "bud"], busy: false, ctl: null, txt: "" }, open: {} };
const J_ORDER = ["esp", "med", "tao", "bud"];
const J_TIPOS = ["reflexão", "insight", "aprendizado", "dúvida"];
const J_EST = [[0, "ainda não"], [1, "semente"], [2, "brotando"], [3, "florescendo"]];
const J_PIL = {
  esp: { sub: "espiritismo", nome: "Espiritismo", mid: "esp", cor: "var(--jp-esp)", ico: "flame",
    lema: "Fé raciocinada, reforma íntima e caridade: o Espírito que evolui.",
    intro: "A Doutrina Espírita, codificada por Allan Kardec a partir de 1857, une ciência, filosofia e moral. Somos Espíritos imortais que progridem por muitas existências, sob a lei de causa e efeito; o caminho é a transformação moral e a caridade, e a fé que se apoia na razão.",
    est: [
      { id: "principios", nome: "Os princípios", desc: "Deus como inteligência suprema, a imortalidade da alma, a reencarnação, a comunicabilidade dos Espíritos e a pluralidade dos mundos habitados.", sinal: "Consigo explicar os princípios com as minhas palavras." },
      { id: "estudo", nome: "Estudo", desc: "Ler e estudar as obras básicas com regularidade, sozinho ou em grupo, voltando sempre às fontes.", sinal: "Tenho um ritmo de estudo e volto às fontes quando surge uma dúvida." },
      { id: "fe", nome: "Fé raciocinada", desc: "Compreender antes de crer: examinar, perguntar e aceitar o que passa pela razão (O Evangelho segundo o Espiritismo, cap. XIX).", sinal: "Minha fé convive bem com perguntas." },
      { id: "reforma", nome: "Reforma íntima", desc: "Conhecer as próprias imperfeições e trabalhá-las uma a uma: vigiar e orar.", sinal: "Percebo as más inclinações mais cedo e reajo menos." },
      { id: "caridade", nome: "Caridade vivida", desc: "Benevolência para com todos, indulgência para as imperfeições dos outros e perdão das ofensas (O Livro dos Espíritos, q. 886), em gestos concretos.", sinal: "O serviço ao próximo faz parte da minha semana." }],
    ens: [
      ["Reconhece-se o verdadeiro espírita pela sua transformação moral e pelos esforços que emprega para domar suas más inclinações.", "O Evangelho segundo o Espiritismo, cap. XVII, item 4"],
      ["Fé inabalável só o é a que pode encarar frente a frente a razão, em todas as épocas da Humanidade.", "O Evangelho segundo o Espiritismo, cap. XIX, item 7"],
      ["Fora da caridade não há salvação.", "O Evangelho segundo o Espiritismo, cap. XV"],
      ["Nascer, morrer, renascer ainda e progredir sem cessar, tal é a lei.", "inscrição no túmulo de Allan Kardec, em Paris"],
      ["Espíritas! amai-vos, este o primeiro ensinamento; instruí-vos, este o segundo.", "O Evangelho segundo o Espiritismo, cap. VI, item 5"],
      ["Um sábio da Antiguidade vos disse: conhece-te a ti mesmo.", "O Livro dos Espíritos, q. 919"]],
    perg: ["Que imperfeição minha esta semana me mostrou com mais clareza?", "Se esta dificuldade é uma lição, o que ela está me ensinando?", "A quem posso estender hoje a caridade da indulgência?", "O que eu faria diferente se lembrasse que esta existência é uma entre muitas?", "Minha fé de hoje passaria pelo crivo da razão?"],
    cat: [
      { t: "Culto do Evangelho no lar", tipo: "prática", d: "Uma vez por semana, no mesmo dia e hora: prece, leitura de um trecho de O Evangelho segundo o Espiritismo, um breve comentário e a prece final." },
      { t: "Prece ao acordar e ao deitar", tipo: "prática", d: "Poucos minutos, com palavras próprias: agradecer, pedir força e orientação, lembrar de alguém que precisa." },
      { t: "Exame de consciência", tipo: "exercício", d: "À noite, rever o dia como propõe O Livro dos Espíritos (q. 919): o que fiz de bem, onde falhei, o que levo para amanhã. Pode ser feito no Exame da noite da Bússola." },
      { t: "Uma imperfeição por mês", tipo: "exercício", d: "Escolher uma inclinação (impaciência, orgulho, maledicência) e observá-la todos os dias, anotando quando aparece e o que você fez com ela." },
      { t: "Caridade semanal", tipo: "prática", d: "Um gesto concreto por semana: visita, doação, voluntariado na casa espírita ou no bairro." },
      { t: "Frequentar uma casa espírita", tipo: "prática", d: "Palestras públicas, passe e um grupo de estudo, como o Estudo Sistematizado da Doutrina Espírita (ESDE)." },
      { t: "O Livro dos Espíritos (Allan Kardec, 1857)", tipo: "leitura", d: "A base da doutrina: 1019 perguntas sobre Deus, o Espírito, as leis morais, as esperanças e consolações. Dá para ler uma pergunta por dia." },
      { t: "O Evangelho segundo o Espiritismo (Allan Kardec, 1864)", tipo: "leitura", d: "A moral do Cristo à luz da doutrina; é o livro lido no Culto do Evangelho no lar." },
      { t: "O Céu e o Inferno (Allan Kardec, 1865)", tipo: "leitura", d: "A justiça divina e relatos sobre a situação dos Espíritos depois da morte." },
      { t: "A Gênese (Allan Kardec, 1868)", tipo: "leitura", d: "A criação, os milagres e as predições examinados à luz da razão e da ciência." },
      { t: "Nosso Lar (André Luiz, psicografia de Chico Xavier, 1944)", tipo: "leitura", d: "Clássico da literatura espírita brasileira sobre a vida no plano espiritual." }],
    cot: "Onde a fé raciocinada, a caridade ou a vigilância mudaram algo no seu dia?" },
  med: { sub: "meditacao", nome: "Meditação", mid: "med", cor: "var(--jp-med)", ico: "breath",
    lema: "A atenção que volta, gentilmente, para o agora.",
    intro: "A meditação treina a atenção e o modo de se relacionar com o que surge: respiração, corpo, emoções e pensamentos. Ela atravessa tradições (budista, taoista, contemplativa) e é estudada pela ciência; aqui é o pilar da prática diária, que sustenta os outros três.",
    est: [
      { id: "chegar", nome: "Chegar à almofada", desc: "Sentar com regularidade, mesmo por poucos minutos: o hábito vem antes da profundidade.", sinal: "Medito na maioria dos dias, mesmo que pouco." },
      { id: "estabilizar", nome: "Estabilizar a atenção", desc: "Perceber a mente dispersa e trazê-la de volta à respiração, sem brigar (samatha).", sinal: "Percebo mais rápido quando me distraí." },
      { id: "observar", nome: "Observar sem reagir", desc: "Ver sensações, emoções e pensamentos surgirem e passarem (vipassana).", sinal: "Consigo sentir uma emoção forte sem que ela me arraste." },
      { id: "dia", nome: "Levar para o dia", desc: "Atenção plena nas tarefas comuns: comer, caminhar, ouvir alguém.", sinal: "Tenho momentos de presença no meio do dia, sem estar sentado na almofada." },
      { id: "presenca", nome: "Presença aberta", desc: "Repousar na própria consciência, com menos esforço e mais gentileza.", sinal: "Às vezes a quietude aparece sozinha." }],
    ens: [
      ["Prestar atenção de um modo particular: de propósito, no momento presente e sem julgamento.", "Jon Kabat-Zinn, definição de mindfulness"],
      ["Inspirando, sei que inspiro; expirando, sei que expiro.", "a partir do Ānāpānasati Sutta (MN 118)"],
      ["Na mente do principiante há muitas possibilidades; na do especialista, poucas.", "Shunryu Suzuki, Mente zen, mente de principiante"],
      ["Onde quer que você vá, lá está você.", "Jon Kabat-Zinn"],
      ["Lavar a louça para lavar a louça.", "Thich Nhat Hanh, O milagre da atenção plena"]],
    perg: ["O que está presente agora, no corpo, antes de qualquer pensamento?", "Qual pensamento mais voltou hoje, e o que ele quer?", "Em que momento de hoje estive presente por inteiro?", "O que acontece se eu não fizer nada com esta emoção, só senti-la?"],
    cat: [
      { t: "Respiração consciente (10 min)", tipo: "prática", d: "Sentar, sentir a respiração entrando e saindo e, a cada distração, voltar sem crítica. É a base do Ānāpānasati." },
      { t: "Escaneamento do corpo (15 min)", tipo: "prática", d: "Percorrer o corpo dos pés à cabeça, notando as sensações sem mudar nada (o body scan do programa MBSR)." },
      { t: "Meditação caminhando", tipo: "prática", d: "Dez minutos andando devagar, sentindo cada passo: levantar, mover, apoiar." },
      { t: "Pausa de três minutos", tipo: "exercício", d: "Em três tempos: o que está aqui agora; a respiração; o corpo inteiro. Ajuda no meio de um dia difícil (vem do programa MBCT)." },
      { t: "Bondade amorosa (mettā)", tipo: "prática", d: "Cinco a dez minutos desejando bem a si, a alguém querido, a alguém neutro, a alguém difícil e a todos os seres." },
      { t: "Uma tarefa em atenção plena", tipo: "exercício", d: "Escolher uma atividade do dia (lavar a louça, tomar o café) e fazê-la inteira, sem tela." },
      { t: "O milagre da atenção plena (Thich Nhat Hanh)", tipo: "leitura", d: "Pequeno e prático, com exercícios para o dia a dia." },
      { t: "Mente zen, mente de principiante (Shunryu Suzuki)", tipo: "leitura", d: "Palestras sobre o zazen e a atitude de começar sempre de novo." },
      { t: "Viver a catástrofe total (Jon Kabat-Zinn)", tipo: "leitura", d: "O programa de redução de estresse baseado em mindfulness (MBSR), passo a passo." },
      { t: "Satipaṭṭhāna Sutta (MN 10)", tipo: "leitura", d: "O discurso clássico sobre os quatro fundamentos da atenção plena: corpo, sensações, mente e fenômenos." }],
    cot: "Onde a atenção plena apareceu, ou faltou, no seu dia?" },
  tao: { sub: "taoismo", nome: "Taoísmo", mid: "tao", cor: "var(--jp-tao)", ico: "yinyang",
    lema: "Seguir o curso natural, como a água: simplicidade, suavidade e não forçar.",
    intro: "O Taoísmo nasce do Tao Te Ching, atribuído a Laozi, e dos escritos de Zhuangzi. O Tao é o caminho e a fonte de todas as coisas, e não se deixa dizer; o sábio vive em harmonia com ele pela simplicidade, pela suavidade e pelo wu wei, a ação que não força.",
    est: [
      { id: "desacelerar", nome: "Desacelerar", desc: "Perceber o próprio ritmo e o da natureza; fazer menos para notar mais.", sinal: "Notei quando estava forçando o passo." },
      { id: "simples", nome: "Simplicidade", desc: "Pu, o bloco não talhado: voltar ao simples, com menos posses, menos pretensões e menos desejos (Tao Te Ching, cap. 19).", sinal: "Tirei algo da vida em vez de acrescentar." },
      { id: "suave", nome: "Suavidade", desc: "Ceder como a água, que vence o duro sem lutar (Tao Te Ching, cap. 78).", sinal: "Respondi a um conflito com suavidade em vez de rigidez." },
      { id: "wuwei", nome: "Wu wei", desc: "Agir sem forçar: fazer o necessário no tempo certo e deixar o resto seguir o seu curso.", sinal: "Algo se resolveu porque esperei a hora certa." },
      { id: "raiz", nome: "Retornar à raiz", desc: "A quietude que renova: “retornar à raiz chama-se quietude” (Tao Te Ching, cap. 16).", sinal: "Tenho momentos de quietude que me devolvem a mim." }],
    ens: [
      ["O Tao que pode ser dito não é o Tao eterno.", "Tao Te Ching, cap. 1"],
      ["A bondade suprema é como a água: beneficia todas as coisas e não disputa.", "Tao Te Ching, cap. 8"],
      ["Quem conhece os outros é sábio; quem conhece a si mesmo é iluminado.", "Tao Te Ching, cap. 33"],
      ["Quem sabe se contentar é rico.", "Tao Te Ching, cap. 33"],
      ["A viagem de mil léguas começa com um passo.", "Tao Te Ching, cap. 64"],
      ["Trinta raios convergem no cubo; é o vazio do centro que torna a roda útil.", "Tao Te Ching, cap. 11"],
      ["Zhuangzi sonhou que era uma borboleta; ao acordar, já não sabia se era Zhuangzi que sonhara ser borboleta ou uma borboleta que sonhava ser Zhuangzi.", "Zhuangzi, cap. 2"]],
    perg: ["Onde estou forçando algo que pediria só paciência?", "O que eu poderia tirar da minha vida, em vez de acrescentar?", "Como a água agiria nesta situação?", "O que acontece quando paro de querer controlar o resultado?"],
    cat: [
      { t: "Sentar e esquecer (zuowang)", tipo: "prática", d: "Sentar em quietude, soltando as ideias e o esforço, como na prática descrita no Zhuangzi (cap. 6)." },
      { t: "Caminhada na natureza", tipo: "prática", d: "Caminhar sem destino e sem tela, observando a água, as árvores e o vento: como cada coisa segue o seu curso." },
      { t: "Qigong ou tai chi (10 min)", tipo: "prática", d: "Movimentos lentos coordenados com a respiração; aprender com um professor ou um vídeo de confiança." },
      { t: "Fazer menos", tipo: "exercício", d: "Uma vez por semana, tirar um compromisso, uma posse ou uma tarefa desnecessária." },
      { t: "Esperar antes de forçar", tipo: "exercício", d: "Diante de um impasse, esperar um dia antes de insistir e observar o que muda sozinho." },
      { t: "Um capítulo por dia", tipo: "exercício", d: "O Tao Te Ching tem 81 capítulos curtos: ler um por dia e levar uma frase consigo." },
      { t: "Tao Te Ching (Laozi)", tipo: "leitura", d: "Os 81 capítulos sobre o Tao e a virtude (de). Vale comparar duas traduções." },
      { t: "Zhuangzi", tipo: "leitura", d: "Histórias e paradoxos sobre liberdade, mudança e a relatividade dos pontos de vista." },
      { t: "A via de Chuang Tzu (Thomas Merton)", tipo: "leitura", d: "Leituras livres de Zhuangzi por um monge cristão: uma porta de entrada acessível." }],
    cot: "Onde você agiu, ou deixou de agir, como a água hoje?" },
  bud: { sub: "budismo", nome: "Budismo", mid: "bud", cor: "var(--jp-bud)", ico: "dharma",
    lema: "Ver com clareza, soltar a sede e cultivar a compaixão.",
    intro: "O Budismo parte das Quatro Nobres Verdades ensinadas por Siddhartha Gautama, o Buda: há sofrimento, ele tem uma origem (a sede, taṇhā), ele pode cessar, e há um caminho, o Nobre Caminho Óctuplo, que une conduta ética (sīla), concentração (samādhi) e sabedoria (paññā).",
    est: [
      { id: "confianca", nome: "Confiança", desc: "Saddhā: a confiança que nasce de experimentar o ensinamento, não de aceitá-lo às cegas (Kalama Sutta).", sinal: "Pratico porque vejo efeito, não por obrigação." },
      { id: "sila", nome: "Conduta (sīla)", desc: "Os cinco preceitos e a fala correta como base da paz interior.", sinal: "Minha fala ficou mais cuidadosa." },
      { id: "samadhi", nome: "Concentração (samādhi)", desc: "Uma mente estável e serena, cultivada pela meditação.", sinal: "Consigo manter a atenção por mais tempo." },
      { id: "panna", nome: "Sabedoria (paññā)", desc: "Ver a impermanência, a insatisfatoriedade e o não-eu nas próprias experiências.", sinal: "Uma perda doeu menos porque vi que tudo passa." },
      { id: "coracao", nome: "Coração sem medida", desc: "Os quatro estados sublimes: bondade, compaixão, alegria com a alegria alheia e equanimidade.", sinal: "Desejei bem a alguém de quem não gosto." }],
    ens: [
      ["O ódio nunca cessa pelo ódio; só pelo não-ódio ele cessa. Esta é uma lei eterna.", "Dhammapada, verso 5"],
      ["A mente precede todas as coisas; a mente é a guia e a criadora.", "Dhammapada, verso 1"],
      ["Todas as coisas condicionadas são impermanentes; quem vê isso com sabedoria se afasta do sofrimento.", "Dhammapada, verso 277"],
      ["Quando vocês souberem por si mesmos que algo é benéfico, então pratiquem-no.", "Kalama Sutta (AN 3.65), em síntese"],
      ["Todas as coisas condicionadas estão sujeitas a passar; esforcem-se com diligência.", "últimas palavras do Buda, Mahāparinibbāna Sutta (DN 16)"],
      ["A amizade nobre é a vida santa inteira.", "Upaḍḍha Sutta (SN 45.2)"]],
    perg: ["O que estou segurando que me faz sofrer?", "O que nesta situação é impermanente, e como isso muda o meu olhar?", "Minhas palavras de hoje foram verdadeiras, úteis e gentis?", "Quem é o “eu” que se sentiu ofendido?"],
    cat: [
      { t: "Os cinco preceitos", tipo: "prática", d: "Abster-se de matar, de tomar o que não foi dado, de conduta sexual nociva, da fala falsa e de intoxicantes que turvam a mente. Relembrá-los toda manhã." },
      { t: "As cinco recordações", tipo: "exercício", d: "Recitar: envelhecer, adoecer e morrer fazem parte da minha natureza; vou me separar de tudo o que amo; minhas ações são a minha verdadeira herança (AN 5.57)." },
      { t: "Os quatro estados sublimes", tipo: "prática", d: "Uma semana para cada: mettā (bondade), karuṇā (compaixão), muditā (alegria com o bem alheio) e upekkhā (equanimidade)." },
      { t: "Generosidade (dāna)", tipo: "prática", d: "Um ato de doação por semana, de tempo, atenção ou bens, sem esperar retorno." },
      { t: "Fala correta por um dia", tipo: "exercício", d: "Um dia inteiro sem fofoca, exagero ou palavras ásperas; à noite, rever." },
      { t: "Contemplar a impermanência", tipo: "exercício", d: "No fim do dia, notar três coisas que mudaram: no corpo, no humor, ao redor." },
      { t: "Dhammapada", tipo: "leitura", d: "423 versos curtos atribuídos ao Buda; ler um por dia é uma boa prática." },
      { t: "O que o Buda ensinou (Walpola Rahula)", tipo: "leitura", d: "Introdução clara e fiel às fontes: as Quatro Nobres Verdades, o carma, o não-eu e a meditação." },
      { t: "A essência dos ensinamentos de Buda (Thich Nhat Hanh)", tipo: "leitura", d: "As Nobres Verdades e o Caminho em linguagem simples e prática." },
      { t: "Dhammacakkappavattana Sutta (SN 56.11)", tipo: "leitura", d: "O primeiro discurso: o Caminho do Meio e as Quatro Nobres Verdades." }],
    cot: "Onde a impermanência, a compaixão ou a fala correta apareceram no seu dia?" },
};
const J_SUB2P = Object.fromEntries(J_ORDER.map(p => [J_PIL[p].sub, p]));
const J_QUICK = {
  esp: ["Como entender um sofrimento à luz da lei de causa e efeito?", "Me ajude a começar o Culto do Evangelho no lar", "Que parte de O Livro dos Espíritos estudar agora?"],
  med: ["Minha mente não para: como recomeçar?", "Monte uma prática de 10 minutos para esta semana", "Como levar a atenção plena para o trabalho?"],
  tao: ["Onde estou forçando a vida?", "Me explique o wu wei com um exemplo do meu dia", "Conte uma história de Zhuangzi para hoje"],
  bud: ["Como lidar com o apego a um resultado?", "O que é o não-eu, na prática?", "Uma contemplação sobre a impermanência"],
  bm: ["Como praticar melhor os valores em foco?", "Leia o meu último mês de exames", "Qual caminho de mudança faz mais sentido para mim agora?"],
};
/* onde convergem e onde divergem */
const J_CONV = [
  { id: "atencao", t: "Atenção e vigilância", esp: "“Vigiai e orai” e o exame de consciência (O Livro dos Espíritos, q. 919)", med: "Sati, a atenção plena, é a própria prática", tao: "“Quem conhece a si mesmo é iluminado” (Tao Te Ching, 33)", bud: "Atenção correta, um dos passos do Nobre Caminho Óctuplo" },
  { id: "mudanca", t: "Tudo muda", esp: "Lei de progresso: o Espírito evolui sempre, nada fica parado", med: "Ver sensações e pensamentos surgirem e passarem", tao: "“O retorno é o movimento do Tao” (Tao Te Ching, 40)", bud: "Anicca: as coisas condicionadas são impermanentes (Dhammapada, 277)" },
  { id: "causa", t: "Causa e efeito", esp: "Lei de causa e efeito: colhemos o que semeamos, nesta e em outras existências", med: "Ver como um pensamento gera uma emoção e uma ação", tao: "O que é rígido se quebra; o flexível permanece (Tao Te Ching, 76)", bud: "Kamma: as intenções moldam o que vem depois" },
  { id: "soltar", t: "Soltar", esp: "Desprendimento dos bens, que são empréstimo (O Evangelho segundo o Espiritismo, cap. XVI)", med: "Deixar o pensamento passar sem segui-lo", tao: "O vazio do vaso é o que o torna útil (Tao Te Ching, 11)", bud: "O fim da sede (taṇhā) é o fim do sofrimento" },
  { id: "compaixao", t: "Compaixão em ação", esp: "Caridade: benevolência, indulgência e perdão (O Livro dos Espíritos, q. 886)", med: "Mettā, a meditação da bondade amorosa", tao: "A compaixão é o primeiro dos três tesouros (Tao Te Ching, 67)", bud: "Karuṇā e os quatro estados sublimes" },
  { id: "serenidade", t: "Serenidade", esp: "“Bem-aventurados os brandos e pacíficos” (O Evangelho segundo o Espiritismo, cap. IX)", med: "Equanimidade diante do que surge", tao: "A água turva clareia quando fica parada (Tao Te Ching, 15)", bud: "Upekkhā, a equanimidade" },
];
const J_DIV = [
  { t: "O que somos", esp: "Um Espírito individual e imortal, que evolui por muitas existências", med: "Como técnica, não exige crença: serve a qualquer visão", tao: "Parte do fluxo do Tao; o eu rígido é que nos separa dele", bud: "Anattā: não há um eu permanente, só processos em mudança" },
  { t: "O absoluto", esp: "Deus, “inteligência suprema, causa primária de todas as coisas” (O Livro dos Espíritos, q. 1)", med: "Neutra: cada praticante traz a sua fé", tao: "O Tao, impessoal e sem nome, fonte de tudo", bud: "Não teísta: o foco é o fim do sofrimento, não um criador" },
  { t: "Depois da morte", esp: "O Espírito continua no mundo espiritual e reencarna", med: "Não se pronuncia", tao: "A morte como transformação natural, que o sábio aceita (Zhuangzi)", bud: "Renascimento sem alma que transmigra: a continuidade do carma, até o nibbāna" },
];
const J_INTEG = [
  { t: "Ritual da manhã em quatro tempos", p: ["esp", "med", "tao", "bud"], d: "Uma prece curta (Espiritismo), cinco minutos de respiração (Meditação), a pergunta “onde não preciso forçar hoje?” (Taoísmo) e a intenção de não ferir com palavras (Budismo)." },
  { t: "Exame da noite ampliado", p: ["esp", "med", "tao", "bud"], d: "O exame da Bússola com uma pergunta de cada pilar: o que aprendi (Espiritismo), onde estive presente (Meditação), onde forcei (Taoísmo), o que soltei (Budismo)." },
  { t: "Caminhada contemplativa", p: ["med", "tao", "esp"], d: "Vinte minutos ao ar livre: atenção aos passos, observar o curso natural das coisas e, no fim, uma prece de gratidão." },
  { t: "Caridade com atenção plena", p: ["esp", "bud", "med"], d: "Um gesto de serviço feito com presença total e sem esperar retorno: caridade, dāna e atenção no mesmo ato." },
];

/* ---------------------------------------------------------------- dados */
const jData = () => { const d = (S.jornada ||= {}); d.p ||= {}; d.conf ||= {}; d.conf.vivos ||= []; d.conf.notas ||= {}; d.conf.circulos ||= []; return d; };
function jP(pid) { const p = (jData().p[pid] ||= {}); p.est ||= {}; p.prat ||= []; p.refl ||= []; p.cot ||= []; return p; }
const jMidP = mid => J_ORDER.find(p => J_PIL[p].mid === mid);
const jDayN = () => Math.floor(parse(TODAY).getTime() / 864e5);
const jPick = (a, k) => a[((k % a.length) + a.length) % a.length];
const jTeach = (pid, k = jDayN()) => jPick(J_PIL[pid].ens, k);
const jQuestion = (pid, k = jDayN()) => jPick(J_PIL[pid].perg, k + 1);
const jDayPillar = () => jPick(J_ORDER, jDayN());
function jActDays(pid, from = addDays(TODAY, -27), to = TODAY) {
  const P = jP(pid), s = new Set(), add = d => { if (d && d >= from && d <= to) s.add(d); };
  P.refl.forEach(r => add(r.data)); P.cot.forEach(c => add(c.data)); P.prat.forEach(p => (p.marcas || []).forEach(add));
  (mget(J_PIL[pid].mid).conversa || []).forEach(x => x.role === "user" && add(iso(new Date(x.at))));
  return s;
}
/* ritmo como lua: 16 dias com o pilar em 4 semanas (quatro por semana) já é lua cheia */
function jMoonInfo(pid) {
  const n = jActDays(pid).size, f = Math.min(1, n / 16);
  const nome = n === 0 ? "lua nova" : f < .4 ? "lua crescente" : f < .6 ? "quarto crescente" : f < 1 ? "lua gibosa" : "lua cheia";
  return { n, f, nome };
}
function jMoon(f, r = 11, col = "var(--c)") {
  const c = r + 1.5, rx = Math.abs(1 - 2 * f) * r;
  const lit = f <= .02 ? "" : f >= .98 ? `<circle cx="${c}" cy="${c}" r="${r}" fill="${col}"/>` : `<path d="M${c} ${c - r}A${r} ${r} 0 0 1 ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${f < .5 ? 0 : 1} ${c} ${c - r}Z" fill="${col}"/>`;
  return `<svg class="jmoon" viewBox="0 0 ${2 * c} ${2 * c}" width="${2 * c}" height="${2 * c}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${r}" fill="color-mix(in srgb,${col} 12%,transparent)" stroke="${col}" stroke-width="1.2"/>${lit}</svg>`;
}
function jWeeks(pid, n = 12) { const w0 = weekStart(TODAY), out = []; for (let i = n - 1; i >= 0; i--) { const ws = addDays(w0, -7 * i); out.push({ ws, n: jActDays(pid, ws, addDays(ws, 6)).size }); } return out; }
const jEstV = (pid, sid) => jP(pid).est[sid]?.v || 0;
const jEstSum = pid => J_PIL[pid].est.reduce((s, e) => s + jEstV(pid, e.id), 0);
const jAdopted = () => J_ORDER.flatMap(pid => jP(pid).prat.filter(x => x.status === "ativa").map(x => ({ ...x, pid })));
const jChip = (pid, on, act, extra = "") => `<button type="button" class="jchip${on ? " on" : ""}" style="--c:${J_PIL[pid].cor}" ${act}${extra}>${ic(J_PIL[pid].ico)}${esc(J_PIL[pid].nome)}</button>`;
/* pontes: pares de pilares que aparecem juntos (reflexões que tocam mais de um pilar e temas marcados como vivos) */
function jBridges() {
  const W = {}, k = (a, b) => [a, b].sort().join("|"), add = (a, b) => { if (a !== b) W[k(a, b)] = (W[k(a, b)] || 0) + 1; };
  for (const pid of J_ORDER) for (const r of jP(pid).refl) for (const o of r.tambem || []) add(pid, o);
  for (const id of jData().conf.vivos) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) add(J_ORDER[i], J_ORDER[j]);
  return W;
}
function jRecommend(pid, inp, fonte = "mentor") {
  const P = jP(pid), t = String(inp.titulo || "").trim().slice(0, 140); if (!t) return null;
  if (P.prat.some(x => norm(x.titulo) === norm(t))) return null;
  const rec = { id: uid(), titulo: t, tipo: ["prática", "leitura", "exercício"].includes(inp.tipo) ? inp.tipo : "prática", desc: String(inp.descricao || inp.desc || "").slice(0, 500), porque: String(inp.porque || "").slice(0, 300), fonte, status: fonte === "mentor" ? "sugerida" : "ativa", marcas: [], criado: Date.now() };
  P.prat.push(rec); return rec;
}

/* ---------------------------------------------------------------- mentores da jornada (entram em MENTOR_DEF) */
Object.assign(MENTOR_DEF, {
  esp: { jor: "esp", gate: "Propósito & espiritualidade", cor: "var(--jp-esp)", ico: "flame", nome: "O Benfeitor", papel: "mentor do Espiritismo kardecista", arq: "o benfeitor da tradição espírita: sereno, fraterno e firme",
    voz: "Fala como os benfeitores da literatura espírita: sereno, fraterno, consolador e firme. Une as três faces da doutrina, ciência, filosofia e moral, na fé raciocinada. Explica as leis morais (de Deus, de causa e efeito, de progresso, de justiça, amor e caridade), a reencarnação, a vida no mundo espiritual, a prece e o passe a partir das obras de Allan Kardec (O Livro dos Espíritos, O Livro dos Médiuns, O Evangelho segundo o Espiritismo, O Céu e o Inferno, A Gênese), e conhece a literatura subsidiária (Léon Denis, Chico Xavier, Divaldo Franco), distinguindo-a da codificação. Consola sem anestesiar: a dor tem causa e sentido, e nenhuma prova é castigo eterno. Pergunta mais do que prega. Reconhece com honestidade o que em textos do século XIX era do seu tempo.",
    limite: "Você é uma IA que fala a partir da Doutrina Espírita: não é um Espírito comunicante nem mensagem mediúnica, e diz isso com simplicidade se a pessoa perguntar." },
  med: { jor: "med", gate: "Propósito & espiritualidade", cor: "var(--jp-med)", ico: "breath", nome: "Guia da Atenção", papel: "mentor da prática de meditação", arq: "a voz de um professor de meditação experiente: simples, gentil e concreta",
    voz: "Fala pouco e com espaço, como um professor experiente de meditação: simples, concreto, gentil e com bom humor. Conhece samatha e vipassana, o Ānāpānasati e o Satipaṭṭhāna, o zazen, a bondade amorosa, o escaneamento do corpo, os programas MBSR e MBCT e a pesquisa científica sobre meditação, separando o que está bem demonstrado do que ainda é promessa. Ensina pela experiência: muitas vezes convida a uma respiração antes de responder, propõe micropráticas e pergunta o que a pessoa notou. Normaliza as dificuldades (sono, agitação, tédio, dor, dúvida) e ajusta a prática à vida real.",
    limite: "A meditação pode trazer à tona material difícil; recomende ir com calma e buscar acompanhamento quando surgir algo pesado." },
  tao: { jor: "tao", gate: "Propósito & espiritualidade", cor: "var(--jp-tao)", ico: "yinyang", nome: "Sábio do Vale", papel: "mentor do Taoísmo", arq: "um velho sábio do vale (“o espírito do vale não morre”, Tao Te Ching, 6)",
    voz: "Fala como os antigos sábios taoistas: poucas palavras, imagens da natureza (a água, o vale, o bloco não talhado, a raiz), paradoxos gentis e humor leve, à maneira de Laozi e Zhuangzi, sem fingir ser eles. Conhece o Tao Te Ching, o Zhuangzi e o Liezi, os conceitos de Tao, de (virtude), wu wei, ziran (o que é assim por si), pu (simplicidade), yin e yang, e as práticas de quietude, qigong e tai chi; distingue a filosofia taoista (daojia) da religião taoista (daojiao). Não dá ordens: devolve perguntas, aponta com delicadeza o que está sendo forçado e mostra o caminho mais simples. Às vezes responde com uma pequena história.",
    limite: "" },
  bud: { jor: "bud", gate: "Propósito & espiritualidade", cor: "var(--jp-bud)", ico: "dharma", nome: "Kalyāṇamitta", papel: "mentor do Budismo, o nobre amigo do caminho", arq: "o kalyāṇamitta, o nobre amigo que o Buda chamou de “a vida santa inteira”",
    voz: "Fala como um nobre amigo do Dhamma: calmo, claro, compassivo e preciso. Conhece as Quatro Nobres Verdades, o Nobre Caminho Óctuplo, as três características (impermanência, insatisfatoriedade, não-eu), a originação interdependente, o carma, os cinco preceitos, os quatro estados sublimes e as práticas de meditação; conhece o Cânone Páli e as escolas Theravāda, Mahāyāna, Zen e Vajrayāna, e diz de qual tradição fala quando elas divergem. Usa termos em páli ou sânscrito com a tradução. Convida a experimentar e verificar, sem dogma (Kalama Sutta), e ensina com parábolas quando ajudam.",
    limite: "Reconheça com respeito as diferenças em relação ao Espiritismo (o não-eu diante do Espírito imortal), sem hierarquizar." },
  bm: { jor: "bm", gate: "Propósito & espiritualidade", cor: "var(--a-pro)", ico: "compass", nome: "O Navegante", papel: "mentor da Bússola moral", arq: "um timoneiro experiente que ajuda a manter o rumo dos valores",
    voz: "Fala como um timoneiro experiente: prático, firme e acolhedor. Conhece os 17 valores da Bússola e as cinco tradições que a fundamentam (Espiritismo, Estoicismo, Taoísmo, Confucionismo e Budismo). Ajuda a pôr valores em prática, a ler o exame da noite sem culpa (a pergunta é “o que aprendi?”, não “fui bom?”), a pensar dilemas com as oito perguntas e a seguir os caminhos de mudança: do preconceito à igualdade, da superioridade à humildade, do individualismo à fraternidade, paciência e equilíbrio, do vazio ao sentido. Não decide pela pessoa: ilumina as opções e o que cada uma tende a plantar.",
    limite: "" },
});
MIDS.push(...["esp", "med", "tao", "bud", "bm"].filter(m => !MIDS.includes(m)));
const J_MIDS = ["esp", "med", "tao", "bud", "bm"];
const jSubOfMid = mid => mid === "bm" ? "navegante" : J_PIL[jMidP(mid)]?.sub || "inicio";

/* ---------------------------------------------------------------- o que cada mentor recebe */
function jPilarFacts(pid, full) {
  const P = jP(pid), D = J_PIL[pid], L = [], mo = jMoonInfo(pid);
  L.push(`Estações do caminho (autoavaliação qualitativa: ainda não, semente, brotando, florescendo): ${D.est.map(e => `${e.nome}: ${J_EST[jEstV(pid, e.id)][1]}${P.est[e.id]?.at && jEstV(pid, e.id) ? ` (desde ${fmtD(iso(new Date(P.est[e.id].at)))})` : ""}`).join("; ")}.`);
  L.push(`Ritmo: ${plural(mo.n, "dia", "dias")} com o pilar nas últimas 4 semanas (${mo.nome}); por semana, das mais antigas às recentes: ${jWeeks(pid).map(w => w.n).join(", ")}.`);
  const at = P.prat.filter(x => x.status === "ativa"), from = addDays(TODAY, -27);
  if (at.length) L.push("Práticas adotadas:\n" + at.map(x => { const m = (x.marcas || []).filter(d => d >= from); return `- ${x.titulo} (${x.tipo}${x.fonte === "mentor" ? `, sugerida por ${MENTOR_DEF[D.mid].nome}` : ""}): ${m.length}× em 4 semanas${x.marcas?.length ? `, última em ${fmtD(x.marcas.slice().sort().at(-1))}` : ""}`; }).join("\n"));
  else L.push("Ainda não adotou práticas neste pilar.");
  if (!full) { const r = P.refl.filter(x => !x.priv).sort((a, b) => b.at - a.at)[0]; if (r) L.push(`Reflexão mais recente (${fmtD(r.data)}): ${trunc(r.texto, 200)}`); return L; }
  const sug = P.prat.filter(x => x.status === "sugerida"); if (sug.length) L.push("Sugestões suas ainda não adotadas (não repita): " + sug.map(x => x.titulo).join("; "));
  const rs = P.refl.filter(x => !x.priv).sort((a, b) => b.at - a.at), np = P.refl.length - rs.length;
  if (rs.length) L.push("Reflexões (mais novas primeiro):\n" + rs.slice(0, 12).map(r => `- ${fmtD(r.data)} [${r.tipo}]${r.tambem?.length ? ` (também toca: ${r.tambem.map(o => J_PIL[o].nome).join(", ")})` : ""}: ${trunc(r.texto, 420)}`).join("\n"));
  if (np) L.push(`${plural(np, "reflexão marcada", "reflexões marcadas")} como só da pessoa: não foram enviadas e você não as conhece.`);
  const cs = P.cot.slice().sort((a, b) => b.at - a.at).slice(0, 8); if (cs.length) L.push("No cotidiano (como o pilar aparece na vida):\n" + cs.map(c => `- ${fmtD(c.data)}${c.area ? ` [${c.area}]` : ""}: ${trunc(c.texto, 260)}`).join("\n"));
  const fora = J_ORDER.flatMap(o => o === pid ? [] : jP(o).refl.filter(r => !r.priv && (r.tambem || []).includes(pid)).map(r => `- ${fmtD(r.data)}, escrita em ${J_PIL[o].nome}: ${trunc(r.texto, 220)}`));
  if (fora.length) L.push("Reflexões de outros pilares que tocam este:\n" + fora.slice(0, 5).join("\n"));
  return L;
}
function jCommonFacts(skip) {
  const L = [], C = jData().conf;
  L.push("OS OUTROS PILARES DA PESSOA:\n" + J_ORDER.filter(p => p !== skip).map(p => `## ${J_PIL[p].nome} (mentor: ${MENTOR_DEF[J_PIL[p].mid].nome})\n${jPilarFacts(p, false).join("\n")}`).join("\n"));
  const sc = bmScores(28); L.push(`Bússola moral: valores em foco ${bmFoco().map(id => bmV(id).nome).join(", ") || "nenhum"}; prática dos valores nas últimas 4 semanas ${sc.idx == null ? "sem exames" : pct(sc.idx)} em ${sc.dias} noites com exame.`);
  if (C.vivos.length) L.push("Temas de confluência que a pessoa marcou como vivos na própria vida: " + C.vivos.map(id => { const t = J_CONV.find(x => x.id === id); return t ? t.t + (C.notas[id] ? ` (nota: ${trunc(C.notas[id], 160)})` : "") : ""; }).filter(Boolean).join("; "));
  const ci = C.circulos.slice(-2); if (ci.length) L.push("Círculos recentes dos mentores:\n" + ci.map(c => `- ${fmtD(iso(new Date(c.at)))}: “${trunc(c.pergunta, 140)}” → ${trunc(jSection(c.texto, "Onde convergem") || c.texto, 260)}`).join("\n"));
  return L;
}
function jBmFacts() {
  const sc = bmScores(28), L = [], le = !!S.bussola?.navLe;
  L.push(`Valores em foco: ${bmFoco().map(id => `${bmV(id).nome} (${bmV(id).acao})`).join("; ") || "nenhum ainda"}.`);
  L.push(`Exame da noite: ${sc.dias} noites com exame nas últimas 4 semanas, ${bmStreak()} seguidas até hoje; prática média ${sc.idx == null ? "–" : pct(sc.idx)} (notas 0 esqueci, 1 tentei, 2 pratiquei).`);
  const vv = Object.entries(sc.val).sort((a, b) => b[1] - a[1]); if (vv.length) L.push("Prática por valor (4 semanas): " + vv.map(([id, v]) => `${bmV(id).nome} ${pct(v)}`).join(", ") + ".");
  L.push("Evolução semanal (prática; noites com exame): " + bmWeeks(8).map(w => `${fmtD(w.wk)} ${w.idx == null ? "–" : pct(w.idx)}; ${w.cons == null ? "–" : pct(w.cons)}`).join(" | "));
  if (le) {
    const ex = Object.entries(bmEx()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).filter(([, e]) => e.bem || e.falha || e.vigia || e.servico || e.sentido || e.amanha);
    if (ex.length) L.push("Textos dos exames recentes (a pessoa permitiu a leitura):\n" + ex.map(([d, e]) => `- ${fmtD(d)}: ${[e.bem && "agi bem: " + e.bem, e.falha && "falhei: " + e.falha, e.vigia && "vigilância: " + e.vigia, e.servico && "serviço: " + e.servico, e.sentido && "sentido: " + e.sentido, e.amanha && "amanhã: " + e.amanha].filter(Boolean).map(x => trunc(x, 200)).join(" · ")}`).join("\n"));
    const ds = bmDec().slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6); if (ds.length) L.push("Decisões guardadas:\n" + ds.map(x => `- ${fmtD(x.data)} “${trunc(x.t || "dilema", 80)}”: ${trunc(x.dec || "", 160)}${x.rev ? ` · revisitada, alinhamento ${x.rev.nota}/5: ${trunc(x.rev.txt, 140)}` : ""}`).join("\n"));
  } else L.push("Os textos do exame da noite e das decisões NÃO foram enviados (a pessoa não liberou a leitura); trabalhe com as notas e, se precisar, peça que ela conte.");
  L.push("Caminhos de mudança que a pessoa nomeou: " + BM_CAM.map(c => c.t).join("; ") + ".");
  return L;
}
function jSection(txt, head) { const m = String(txt || "").match(new RegExp(`#+\\s*${head}[^\\n]*\\n([\\s\\S]*?)(?=\\n#+\\s|$)`, "i")); return m ? m[1].trim() : ""; }
function jPrompt(mid, fallback) {
  const def = MENTOR_DEF[mid], m = mget(mid), pid = jMidP(mid), D = pid ? J_PIL[pid] : null;
  const facts = pid ? [`PILAR: ${D.nome}`, ...jPilarFacts(pid, true), ...jCommonFacts(pid)] : [...jBmFacts(), ...jCommonFacts(null)];
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-24)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}${x.origem !== "mentor" ? " · " + x.origem : ""}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const plan = m.plano ? `Foco: ${m.plano.foco}\n` + m.plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${p.prazo})` : ""}`).join("\n") : "Ainda não há caminho combinado.";
  const fb = fallback ? `\n\nFORMATO: escreva a resposta normalmente. Para guardar memória, atualizar o caminho combinado${pid ? ", recomendar práticas" : ""} ou propor hábitos e tarefas, termine com um bloco exatamente assim (omita o que não houver):\n\`\`\`atlas\n{"memorias":[{"tipo":"insight","texto":"..."}],"plano":{"foco":"...","passos":[{"texto":"...","prazo":"AAAA-MM-DD"}]},${pid ? `"praticas":[{"tipo":"prática","titulo":"...","descricao":"...","porque":"..."}],` : ""}"propostas":[{"tipo":"habito","titulo":"...","vezes_por_semana":3}]}\n\`\`\`` : "";
  return `Você é ${def.nome}, ${def.papel} na aba Jornada existencial do app pessoal "Atlas da Vida". Você personifica ${def.arq}.
A pessoa orienta a vida por quatro pilares: Espiritismo kardecista, meditação, Taoísmo e Budismo, e usa uma Bússola moral de 17 valores. Há um mentor para cada pilar e o Navegante para a Bússola; vocês são companheiros de caminho dela, não juízes.
QUEM VOCÊ É: ${def.voz}
COMO CONVERSAR:
- Português do Brasil, segunda pessoa, linguagem clara e respeitosa. Profundo sem ser pesado; até ~220 palavras, salvo se pedirem mais.
- Fale com a autenticidade e o vocabulário da sua tradição; use termos originais com tradução quando ajudar. Cite obra, capítulo, sutra ou verso só quando tiver certeza; sem certeza, diga “a tradição ensina” e não invente referência.
- Discuta, aprofunde, contemple: pode terminar com uma pergunta para contemplar ou uma prática pequena. Dúvidas e críticas são bem-vindas; reconheça tensões e limites da sua tradição com honestidade.
- Quando a pessoa trouxer outro pilar, mostre convergências e diferenças com respeito, sem fundir tudo nem hierarquizar. Use os dados abaixo e cite datas do que ela escreveu; não invente fatos sobre ela.
- Se o texto mostrar sofrimento intenso, desesperança ou risco à própria vida, acolha primeiro e indique ajuda agora (no Brasil, CVV 188, 24 horas; na Europa, 112) e cuidado profissional, que as próprias tradições recomendam; não dê diagnóstico.${def.limite ? "\n- " + def.limite : ""}
- ${fallback ? "Use o bloco atlas" : "Use as ferramentas"} para: guardar na memória insights, dúvidas em aberto e compromissos (frases curtas, com data); atualizar o caminho combinado (um foco e até 5 passos) quando ele mudar;${pid ? " recomendar práticas, leituras ou exercícios, que entram na lista do pilar e a pessoa adota se quiser;" : ""} propor hábitos ou tarefas (a pessoa aprova antes)${fallback ? "" : "; buscar no diário; deixar recado para outro mentor quando algo tocar outro pilar"}. Não salve trivialidades nem repita a memória.

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
${facts.join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}

CAMINHO COMBINADO:
${plan}${fb}`.slice(0, 120000);
}
function jTools(mid, live, base) {
  const pid = jMidP(mid), keep = ["salvar_memoria", "atualizar_plano", "propor", "buscar_diario", "recado", "buscar_notion"], T = base.filter(t => keep.includes(t.name));
  const sm = T.find(t => t.name === "salvar_memoria"); if (sm) sm.inputSchema.properties.tipo.enum = ["insight", "dúvida", "compromisso", "progresso", "decisão", "preferência", "ideia", "fato"];
  if (pid) T.splice(1, 0, { name: "recomendar", description: "Acrescenta à lista do pilar uma prática, leitura ou exercício para esta pessoa agora; ela decide se adota. Título curto (em leituras, com o autor), descrição prática de como fazer e, em 'porque', uma frase sobre por que serve para ela. Retorna {ok}.",
    inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["prática", "leitura", "exercício"] }, titulo: { type: "string" }, descricao: { type: "string" }, porque: { type: "string" } }, required: ["tipo", "titulo", "descricao"] },
    execute: inp => { const r = jRecommend(pid, inp); if (r) { touch("jornada", { noUndo: true, noRender: true }); live.uso.push({ t: "recomendar", d: `${r.tipo}: ${trunc(r.titulo, 80)}` }); aiNote("ferr", `recomendar: ${trunc(r.titulo, 60)}`, live.ctx); paintLive(); } return { ok: true, duplicado: !r }; } });
  return T;
}

/* ---------------------------------------------------------------- desenho: mandala e lótus */
function jPetal(r0, r1, w) { const m = (r0 + r1) / 2; return `M0 ${-r0}C${w} ${-(r0 + (m - r0) * .55)} ${w * .9} ${-(m + (r1 - m) * .45)} 0 ${-r1}C${-w * .9} ${-(m + (r1 - m) * .45)} ${-w} ${-(r0 + (m - r0) * .55)} 0 ${-r0}Z`; }
const J_FILL = [0, .28, .58, .92];
function jMandala() {
  const W = 520, C = 260, ang = { esp: -90, med: 0, bud: 90, tao: 180 }, sc = bmScores(28);
  let g = `<circle cx="${C}" cy="${C}" r="236" class="jm-o"/><circle cx="${C}" cy="${C}" r="168" class="jm-i"/>`;
  for (const pid of J_ORDER) {
    const D = J_PIL[pid], a0 = ang[pid], mo = jMoonInfo(pid);
    D.est.forEach((e, i) => { const v = jEstV(pid, e.id), a = a0 + (i - 2) * 15 + 90;
      g += `<g class="jm-p click" data-act="jgo" data-go="jornada.${D.sub}" role="button" tabindex="0" aria-label="${esc(D.nome)}: ${esc(e.nome)}, ${J_EST[v][1]}" transform="translate(${C} ${C}) rotate(${a})"><path d="${jPetal(64, 158, 13)}" style="fill:${D.cor};fill-opacity:${J_FILL[v]};stroke:${D.cor}"${v ? "" : ' stroke-dasharray="3 3"'}/></g>`; });
    const t = a0 * Math.PI / 180, x = C + 200 * Math.cos(t), y = C + 200 * Math.sin(t);
    g += `<g class="jm-l click" data-act="jgo" data-go="jornada.${D.sub}" role="button" tabindex="0" aria-label="Abrir ${esc(D.nome)}" style="--c:${D.cor}"><g transform="translate(${(x - 12.5).toFixed(1)} ${(y - 30).toFixed(1)})">${jMoon(mo.f, 11, D.cor).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g><text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle" class="jm-t" style="fill:${D.cor}">${esc(D.nome)}</text></g>`;
  }
  g += `<g class="jm-c click" data-act="jgo" data-go="jornada.bussola" role="button" tabindex="0" aria-label="Bússola moral"><circle cx="${C}" cy="${C}" r="50"/><text x="${C}" y="${C - 3}" text-anchor="middle" class="jm-ct">Bússola</text><text x="${C}" y="${C + 14}" text-anchor="middle" class="jm-cs">${sc.idx == null ? "sem exames" : "prática " + pct(sc.idx)}</text></g>`;
  return `<div class="jmandala">${svgWrap(W, W, g, "Mandala da jornada: cinco pétalas por pilar, uma para cada estação do caminho; quanto mais cheia, mais florescida. A lua mostra o ritmo das últimas 4 semanas e a bússola fica no centro")}</div>`;
}
function jLotus(pid, size = 120) {
  const D = J_PIL[pid], C = 60; let g = "";
  D.est.forEach((e, i) => { const v = jEstV(pid, e.id); g += `<path transform="translate(${C} ${C + 8}) rotate(${(i - 2) * 30})" d="${jPetal(4, 52, 12)}" style="fill:${D.cor};fill-opacity:${J_FILL[v]};stroke:${D.cor}"${v ? "" : ' stroke-dasharray="3 3"'}/>`; });
  return `<svg class="jlotus" viewBox="0 0 120 76" width="${size}" height="${Math.round(size * 76 / 120)}" role="img" aria-label="Estações de ${esc(D.nome)}: ${D.est.map(e => `${e.nome} ${J_EST[jEstV(pid, e.id)][1]}`).join(", ")}">${g}</svg>`;
}
function jStrip(pid) { const ws = jWeeks(pid), D = J_PIL[pid]; return `<div class="jstrip" style="--c:${D.cor}" aria-label="Ritmo das últimas 12 semanas">${ws.map(w => `<i title="semana de ${fmtD(w.ws)}: ${plural(w.n, "dia", "dias")}" style="opacity:${w.n ? (.25 + .75 * Math.min(1, w.n / 5)).toFixed(2) : .12}"></i>`).join("")}</div>`; }

/* ---------------------------------------------------------------- conversa embutida */
function jChat(mid, o = {}) {
  const def = MENTOR_DEF[mid], m = mget(mid), L = MST.live?.mid === mid ? MST.live : null, ai = !!SAMPLE && !AI_OFF, blk = blockedMentor(mid);
  let lastDay = "";
  const msgs = (m.conversa || []).map((x, i) => { const d = iso(new Date(x.at)), sep = d !== lastDay ? `<div class="daysep"><span>${relDay(d) === "hoje" ? "Hoje" : fmtDL(d)}</span></div>` : ""; lastDay = d;
    return sep + (x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content).replace(/\n/g, "<br>")}</div></div>` : `<div class="msg ai">${mavatar(mid, "sm")}<div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}${(x.acoes || []).map(p => propHTML(mid, i, p)).join("")}</div></div>`); }).join("");
  const live = L ? `${L.user ? `<div class="msg me"><div class="bub">${esc(L.user.content).replace(/\n/g, "<br>")}</div></div>` : ""}<div class="msg ai" id="livebubble">${mavatar(mid, "sm")}<div class="bub"><div class="lb-text mdx">${L.text ? md(liveText(L.text)) : `<div class="thinking">${ic("spark")}Contemplando…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div><div class="lb-acoes">${L.acoes.map(p => propHTML(mid, -1, p)).join("")}</div></div></div>` : "";
  const intro = !m.conversa?.length && !L ? `<div class="mintro jintro">${mavatar(mid, "lg")}<h3>${esc(def.nome)}</h3><p>${esc(def.arq[0].toUpperCase() + def.arq.slice(1))}.</p><p class="muted">${o.intro || "Traga uma dúvida, um insight ou algo que aconteceu. O que vocês combinarem fica guardado."}</p></div>` : "";
  const on = ai && !MST.live && !blk;
  const plan = m.plano ? `<div class="jplan"><span class="flbl">Caminho combinado</span><b>${esc(m.plano.foco)}</b>${m.plano.passos.map(p => `<label class="ckl${p.feito ? " done" : ""}"><input type="checkbox" data-pstep="${mid}|${p.id}"${p.feito ? " checked" : ""}><span>${esc(p.texto)}${p.prazo ? ` <small class="muted">${relDay(p.prazo)}</small>` : ""}</span></label>`).join("")}</div>` : "";
  const mems = [...(m.mem || [])].sort((a, b) => (b.fixo - a.fixo) || b.at - a.at);
  return `<section class="pn jment" data-mid="${mid}" id="jment" style="--c:${mcol(mid)}">
    <header class="jmh">${mavatar(mid)}<div><h2>${esc(def.nome)}</h2><small>${esc(def.papel)}</small></div></header>
    ${blk ? `<div class="banner warn">${ic("lock")}<span>${esc(def.gate || "")} está fora da IA em Privacidade. Libere o setor para conversar com ${esc(def.nome)}.</span></div>` : aiBanner()}
    <div class="mchat" id="mchat" aria-live="polite">${intro}${msgs}${live}</div>
    <div class="mquick">${(o.quick || J_QUICK[mid] || []).map(q => `<button type="button" class="qchip" data-mq="${esc(q)}"${on ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>
    <div class="minput"><textarea id="m_in" rows="2" placeholder="${ai ? `Escreva para ${esc(def.nome)}… (Enter envia)` : "A IA não está disponível nesta visualização"}"${ai && !blk ? "" : " disabled"} aria-label="Mensagem para ${esc(def.nome)}">${esc(MST.input[mid] || "")}</textarea>${MST.live ? `<button type="button" class="btn" data-act="mstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn primary" data-act="msend"${on ? "" : " disabled"}>${ic("send")}Enviar</button>`}</div>
    <div class="row wrap jmacts"><button type="button" class="btn sm" data-act="jcheck" data-mid="${mid}"${on ? "" : " disabled"}>${ic("refresh")}Acompanhamento</button>${o.rec ? `<button type="button" class="btn sm" data-act="jrec" data-mid="${mid}"${on ? "" : " disabled"}>${ic("book")}${o.recLabel || "Recomendar práticas"}</button>` : ""}${m.conversa?.length ? `<button type="button" class="btn sm ghost" data-act="mclear">${ic("trash")}Limpar conversa</button>` : ""}</div>
    ${plan}
    <details class="jmem"${J.open["mem" + mid] ? " open" : ""} data-act="jopen" data-k="mem${mid}"><summary>${ic("memory")}O que ${esc(def.nome)} guarda <small>${mems.length}</small></summary>
      <div class="mems">${mems.slice(0, 12).map(x => `<div class="mem${x.fixo ? " fixo" : ""}"><span class="mtag t-${slug(x.tipo)}">${esc(x.tipo)}</span><p>${esc(x.texto)}</p><div class="mmeta"><span>${fmtD(iso(new Date(x.at)))}${x.origem && x.origem !== "mentor" ? " · " + esc(x.origem) : ""}</span><button type="button" class="vb" data-mpin="${mid}|${x.id}" aria-label="${x.fixo ? "Desafixar" : "Fixar"}">${ic("pin")}</button><button type="button" class="vb" data-mdel="${mid}|${x.id}" aria-label="Esquecer">${ic("trash")}</button></div></div>`).join("") || `<div class="empty">Nada guardado ainda.</div>`}</div></details>
    <p class="muted small jpriv">${ic("shield")}${o.priv || "Ao conversar, o mentor lê o que você registra neste pilar (menos as reflexões marcadas como só suas) e um resumo dos outros pilares. Cada conversa aparece em Privacidade."}</p></section>`;
}

/* ---------------------------------------------------------------- páginas */
function pJornada(R) {
  if (SUB === "inicio") return jInicio();
  if (J_SUB2P[SUB]) return jPilar(J_SUB2P[SUB]);
  if (SUB === "confluencias") return jConf();
  if (SUB === "navegante") return jBmNav() + jNavegante();
  return jBmNav() + pBussola(R);
}
function jBmNav() {
  const it = [["bussola", "A bússola", "compass"], ["exame", "Exame da noite", "moon"], ["decidir", "Decidir", "flag"], ["caminhos", "Caminhos", "sprout"], ["navegante", "O Navegante", "spark"]];
  return `<nav class="jbmnav" aria-label="Bússola moral">${it.map(([k, l, i]) => `<a href="#jornada.${k}" class="${SUB === k ? "on" : ""}"${SUB === k ? ' aria-current="page"' : ""}>${ic(i)}${l}</a>`).join("")}</nav>`;
}
function jInicio() {
  const pid = jDayPillar(), D = J_PIL[pid], [q, src] = jTeach(pid), tot = J_ORDER.reduce((s, p) => s + jActDays(p).size, 0), all = new Set(J_ORDER.flatMap(p => [...jActDays(p)]));
  const flor = J_ORDER.reduce((s, p) => s + J_PIL[p].est.filter(e => jEstV(p, e.id) === 3).length, 0), rmes = J_ORDER.reduce((s, p) => s + jP(p).refl.filter(r => r.data >= addDays(TODAY, -29)).length, 0);
  const viva = J_ORDER.map(p => [p, jActDays(p).size]).sort((a, b) => b[1] - a[1])[0];
  const rev = jRevisit(), feed = J_ORDER.flatMap(p => [...jP(p).refl.map(r => ({ ...r, pid: p, k: "refl" })), ...jP(p).cot.map(c => ({ ...c, pid: p, k: "cot", tipo: "no cotidiano" }))]).sort((a, b) => b.at - a.at).slice(0, 7);
  const Q = J.q;
  return `<p class="lead">Um espaço para acompanhar e aprofundar o seu caminho pelos quatro pilares que orientam a sua vida, com um mentor para cada um, um lugar onde eles se encontram e a Bússola moral no centro. Não é um formulário: volte quando quiser, escreva o que viveu e converse.</p>
    ${kpiRow([kmini("var(--jp-med)", "Dias na jornada · 4 semanas", `${all.size} de 28`, `${plural(tot, "registro-dia", "registros-dia")} somando os pilares`), kmini(viva[1] ? J_PIL[viva[0]].cor : "var(--muted)", "Pilar mais vivo", viva[1] ? esc(J_PIL[viva[0]].nome) : "–", viva[1] ? `${jMoonInfo(viva[0]).nome} · ${plural(viva[1], "dia", "dias")}` : "comece por qualquer um"), kmini("var(--jp-bud)", "Estações florescendo", `${flor} de 20`, "autoavaliação, sem pressa"), kmini("var(--jp-esp)", "Reflexões · 30 dias", rmes, rmes ? "continue escrevendo" : "a primeira está a um toque")])}
    <div class="g2c jhome">
      ${vis("jmandala", "Mandala da jornada", jMandala(), { sub: "cada pétala é uma estação do caminho; a lua mostra o ritmo de 4 semanas; toque para entrar", nofocus: true })}
      ${panel(`${ic("sun")}Hoje na jornada`, `<div class="jday" style="--c:${D.cor}"><span class="jtag">${ic(D.ico)}${esc(D.nome)}</span><blockquote class="jquote">${esc(q)}<cite>${esc(src)}</cite></blockquote><p class="bmq">${ic("info")}<span>${esc(jQuestion(pid))}</span></p></div>
        <div class="flbl">Uma reflexão rápida</div><textarea class="jta" rows="3" data-jq="1" placeholder="O que você viveu, percebeu ou aprendeu?">${esc(Q.txt)}</textarea>
        <div class="row wrap jqrow">${J_ORDER.map(p => jChip(p, Q.p.includes(p), `data-act="jqp" data-p="${p}"`)).join("")}</div>
        <div class="row wrap jqrow"><div class="segs">${J_TIPOS.map(t => `<button type="button" class="seg" data-act="jqt" data-v="${t}" aria-pressed="${Q.tipo === t}">${t}</button>`).join("")}</div><button type="button" class="btn sm primary" data-act="jqsave">${ic("check")}Guardar</button></div>`, { cls: "jhoje" })}
      ${panel(`${ic("council")}Seus mentores`, `<div class="jmgrid">${J_MIDS.map(mid => { const def = MENTOR_DEF[mid], m = mget(mid), pid = jMidP(mid), last = m.conversa?.length ? relDay(iso(new Date(m.conversa.at(-1).at))) : "";
          return `<a class="jmc" href="#jornada.${jSubOfMid(mid)}" style="--c:${mcol(mid)}">${mavatar(mid)}<span><b>${esc(def.nome)}</b><small>${pid ? esc(J_PIL[pid].nome) : "Bússola moral"}</small><em>${m.plano ? esc(trunc(m.plano.foco, 60)) : last ? `conversaram ${last}` : "ainda não conversaram"}</em></span></a>`; }).join("")}</div>`, { cls: "span2" })}
      ${rev ? panel(`${ic("clock")}Para revisitar`, `<p class="muted">${esc(rev.quando)} você escreveu, em ${esc(J_PIL[rev.pid].nome)}:</p><blockquote class="jquote sm" style="--c:${J_PIL[rev.pid].cor}">${esc(trunc(rev.r.texto, 420))}<cite>${fmtDY(rev.r.data)} · ${esc(rev.r.tipo)}</cite></blockquote>
        <label class="flbl" for="jrev">O que mudou desde então?</label><textarea id="jrev" class="jta" rows="2" data-jrev="1" placeholder="Releia com calma. O que você vê agora?">${esc(J.rev)}</textarea><div class="row"><button type="button" class="btn sm" data-act="jrevsave" data-p="${rev.pid}" data-id="${rev.r.id}">${ic("check")}Guardar como reflexão</button></div>`) : ""}
      ${panel(`${ic("week")}Ritmo das últimas 12 semanas`, J_ORDER.map(p => `<div class="jrr"><a href="#jornada.${J_PIL[p].sub}" style="--c:${J_PIL[p].cor}">${jMoon(jMoonInfo(p).f, 8, J_PIL[p].cor)}${esc(J_PIL[p].nome)}</a>${jStrip(p)}</div>`).join("") + `<p class="muted small">Cada quadradinho é uma semana; mais forte, mais dias com o pilar (reflexões, práticas, notas do cotidiano e conversas).</p>`)}
      ${panel(`${ic("list")}Recentes`, feed.length ? `<div class="jfeed">${feed.map(x => `<a class="jfi" href="#jornada.${J_PIL[x.pid].sub}" style="--c:${J_PIL[x.pid].cor}"><span class="jtag sm">${esc(J_PIL[x.pid].nome)} · ${esc(x.tipo)}</span><span>${x.priv ? `${ic("lock")}<i class="muted">reflexão só sua</i>` : esc(trunc(x.texto, 150))}</span><small class="muted">${relDay(x.data)}</small></a>`).join("")}</div>` : `<div class="empty">As reflexões e notas dos quatro pilares aparecem aqui.</div>`)}
    </div>`;
}
function jRevisit() {
  for (const [dias, folga, quando] of [[365, 15, "Há um ano"], [90, 10, "Há três meses"], [30, 5, "Há um mês"]]) {
    const alvo = addDays(TODAY, -dias), c = J_ORDER.flatMap(pid => jP(pid).refl.filter(r => !r.de && Math.abs(diff(r.data, alvo)) <= folga && !J_ORDER.some(o => jP(o).refl.some(z => z.de === r.id))).map(r => ({ pid, r })));
    if (c.length) return { ...c.sort((a, b) => Math.abs(diff(a.r.data, alvo)) - Math.abs(diff(b.r.data, alvo)))[0], quando };
  }
  return null;
}
function jPilar(pid) {
  const D = J_PIL[pid], P = jP(pid), mo = jMoonInfo(pid), [q, src] = jTeach(pid), mid = D.mid;
  const dr = J.dr[pid] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }, cd = J.cot[pid] ||= { txt: "", area: "" };
  const refl = P.refl.slice().sort((a, b) => b.at - a.at), allR = J.open["refl" + pid];
  const from = addDays(TODAY, -27), ativas = P.prat.filter(x => x.status === "ativa"), sug = P.prat.filter(x => x.status === "sugerida"), outras = P.prat.filter(x => x.status === "pausada" || x.status === "concluída");
  const cat = D.cat.map((c, i) => ({ ...c, i })).filter(c => !P.prat.some(x => norm(x.titulo) === norm(c.t)));
  const tipoIc = { "prática": "repeat", "leitura": "book", "exercício": "target" };
  const cots = P.cot.slice().sort((a, b) => b.at - a.at), byArea = {}; cots.forEach(c => c.area && (byArea[c.area] = (byArea[c.area] || 0) + 1));
  const est = D.est.map((e, i) => { const v = jEstV(pid, e.id), at = P.est[e.id]?.at;
    return `<div class="jst v${v}"><span class="jsn">${i + 1}</span><div><b>${esc(e.nome)}</b><p>${esc(e.desc)}</p><p class="muted small">Sinal de que está acontecendo: ${esc(e.sinal)}</p>
      <div class="segs jsegs" role="group" aria-label="${esc(e.nome)}">${J_EST.map(([n, l]) => `<button type="button" class="seg" data-act="jest" data-p="${pid}" data-s="${e.id}" data-v="${n}" aria-pressed="${v === n}">${l}</button>`).join("")}${at && v ? `<small class="muted">desde ${fmtD(iso(new Date(at)))}</small>` : ""}</div></div></div>`; }).join("");
  const rcard = r => `<article class="jrf${r.priv ? " priv" : ""}"><header><span class="jtag sm">${esc(r.tipo)}</span>${(r.tambem || []).map(o => `<span class="jtag sm" style="--c:${J_PIL[o].cor}">${esc(J_PIL[o].nome)}</span>`).join("")}${r.priv ? `<span class="jtag sm lock">${ic("lock")}só sua</span>` : ""}<small class="muted">${fmtDY(r.data)}</small></header><p>${esc(r.texto).replace(/\n/g, "<br>")}</p>
    <footer><button type="button" class="lnk" data-act="jrask" data-p="${pid}" data-id="${r.id}"${r.priv ? " disabled" : ""}>${ic("spark")}levar a ${esc(MENTOR_DEF[mid].nome)}</button><button type="button" class="lnk" data-act="jrlock" data-p="${pid}" data-id="${r.id}">${ic(r.priv ? "unlock" : "lock")}${r.priv ? "liberar ao mentor" : "manter só para mim"}</button><button type="button" class="lnk" data-act="jrdel" data-p="${pid}" data-id="${r.id}">apagar</button></footer></article>`;
  const pcard = x => { const m = (x.marcas || []).filter(d => d >= from).length, hoje = (x.marcas || []).includes(TODAY);
    return `<div class="jpc"><span class="jpi">${ic(tipoIc[x.tipo] || "repeat")}</span><div><b>${esc(x.titulo)}</b>${x.desc ? `<p>${esc(x.desc)}</p>` : ""}${x.porque ? `<p class="muted small">${ic("spark")}${esc(x.porque)}</p>` : ""}<small class="muted">${x.tipo} · ${m ? `${m}× em 4 semanas` : "ainda sem registro"}${x.fonte === "mentor" ? ` · sugerida por ${esc(MENTOR_DEF[mid].nome)}` : x.fonte === "você" ? " · sua" : ""}</small></div>
      <div class="jpa"><button type="button" class="btn sm${hoje ? " primary" : ""}" data-act="jmark" data-p="${pid}" data-id="${x.id}" aria-pressed="${hoje}">${ic("check")}${hoje ? "Feita hoje" : "Fiz hoje"}</button><button type="button" class="lnk" data-act="jpst" data-p="${pid}" data-id="${x.id}" data-v="pausada">pausar</button><button type="button" class="lnk" data-act="bmhab" data-hab="${esc(trunc(x.titulo, 60))}">virar hábito</button></div></div>`; };
  const scard = (x, k) => `<div class="jpc sug"><span class="jpi">${ic(tipoIc[x.tipo] || "repeat")}</span><div><b>${esc(x.titulo || x.t)}</b><p>${esc(x.desc || x.d)}</p>${x.porque ? `<p class="muted small">${ic("spark")}${esc(x.porque)}</p>` : ""}<small class="muted">${x.tipo}${x.fonte === "mentor" ? ` · sugerida por ${esc(MENTOR_DEF[mid].nome)}` : ""}</small></div><div class="jpa"><button type="button" class="btn sm" data-act="jadopt" data-p="${pid}" ${k}>${ic("plus")}Adotar</button>${x.fonte === "mentor" ? `<button type="button" class="lnk" data-act="jpst" data-p="${pid}" data-id="${x.id}" data-v="remover">dispensar</button>` : ""}</div></div>`;
  return `<div class="jcols" style="--c:${D.cor}">
    <div class="jleft">
      <section class="pn jhero"><div class="jh1"><span class="jhi">${ic(D.ico)}</span><div><h2>${esc(D.nome)}</h2><p class="jlema">${esc(D.lema)}</p></div></div>
        <div class="jh2"><div class="jhm">${jLotus(pid, 150)}<div>${jMoon(mo.f, 13, D.cor)}<b>${esc(mo.nome[0].toUpperCase() + mo.nome.slice(1))}</b><small class="muted">${plural(mo.n, "dia", "dias")} com o pilar em 4 semanas</small>${jStrip(pid)}</div></div>
          <blockquote class="jquote">${esc(q)}<cite>${esc(src)}</cite></blockquote></div>
        <p class="bmq">${ic("info")}<span>Para contemplar hoje: ${esc(jQuestion(pid))}</span><button type="button" class="lnk" data-act="jqask" data-p="${pid}">responder</button></p>
        <details class="jsobre"><summary>Sobre o pilar</summary><p>${esc(D.intro)}</p></details>
        <button type="button" class="btn sm jgochat" data-act="jtochat">${ic("spark")}Conversar com ${esc(MENTOR_DEF[mid].nome)}</button></section>
      ${panel(`${ic("sprout")}Estações do caminho`, `<p class="muted">Não é uma escada nem uma nota: é como você sente cada dimensão hoje. Ajuste quando perceber mudança; a data fica guardada.</p><div class="jest">${est}</div>`)}
      ${panel(`${ic("pen")}Reflexões, insights e aprendizados <small>${P.refl.length}</small>`, `<textarea class="jta" rows="4" data-jr="${pid}" placeholder="O que você percebeu, aprendeu ou está perguntando?">${esc(dr.txt)}</textarea>
        <div class="row wrap jqrow"><div class="segs">${J_TIPOS.map(t => `<button type="button" class="seg" data-act="jrtipo" data-p="${pid}" data-v="${t}" aria-pressed="${dr.tipo === t}">${t}</button>`).join("")}</div></div>
        <div class="row wrap jqrow"><span class="flbl">Também toca</span>${J_ORDER.filter(o => o !== pid).map(o => jChip(o, dr.tambem.includes(o), `data-act="jrtam" data-p="${pid}" data-o="${o}"`)).join("")}</div>
        <div class="row wrap jqrow"><label class="ckl jprivck"><input type="checkbox" data-act="jrpriv" data-p="${pid}"${dr.priv ? " checked" : ""}><span>Só para mim (o mentor não lê)</span></label><button type="button" class="btn sm primary" data-act="jrsave" data-p="${pid}">${ic("check")}Guardar</button></div>
        <div class="jrlist">${(allR ? refl : refl.slice(0, 5)).map(rcard).join("") || `<div class="empty">Sua primeira reflexão sobre ${esc(D.nome)} pode ser uma frase.</div>`}</div>${refl.length > 5 ? `<button type="button" class="lnk" data-act="jtoggle" data-k="refl${pid}">${allR ? "mostrar menos" : `ver todas (${refl.length})`}</button>` : ""}`)}
      ${panel(`${ic("book")}Práticas, leituras e exercícios`, `${ativas.length ? `<div class="flbl">Minhas práticas</div><div class="jplist">${ativas.map(pcard).join("")}</div>` : `<p class="muted">Adote uma prática abaixo, ou peça ao mentor uma sugestão para o seu momento.</p>`}
        ${sug.length ? `<div class="flbl">Sugeridas por ${esc(MENTOR_DEF[mid].nome)}</div><div class="jplist">${sug.map(x => scard(x, `data-id="${x.id}"`)).join("")}</div>` : ""}
        <details class="jcat"${J.open["cat" + pid] ? " open" : ""} data-act="jopen" data-k="cat${pid}"><summary>Da tradição <small>${cat.length}</small></summary><div class="jplist">${cat.map(c => scard({ ...c, fonte: "base" }, `data-k="${c.i}"`)).join("")}</div></details>
        ${outras.length ? `<details class="jcat"><summary>Pausadas e concluídas <small>${outras.length}</small></summary><div class="jplist">${outras.map(x => `<div class="jpc sug"><span class="jpi">${ic(tipoIc[x.tipo] || "repeat")}</span><div><b>${esc(x.titulo)}</b><small class="muted">${x.status} · ${(x.marcas || []).length}× no total</small></div><div class="jpa"><button type="button" class="btn sm" data-act="jpst" data-p="${pid}" data-id="${x.id}" data-v="ativa">retomar</button></div></div>`).join("")}</div></details>` : ""}
        <div class="row wrap jpadd"><select id="jpn_tipo_${pid}" aria-label="Tipo"><option>prática</option><option>leitura</option><option>exercício</option></select><input id="jpn_${pid}" type="text" placeholder="Acrescentar uma prática sua" aria-label="Nova prática"><button type="button" class="btn sm" data-act="jpadd" data-p="${pid}">${ic("plus")}Acrescentar</button></div>`)}
      ${panel(`${ic("house")}No cotidiano`, `<p class="muted">${esc(D.cot)}</p><textarea class="jta" rows="3" data-jc="${pid}" placeholder="Uma situação concreta: no trabalho, em casa, com alguém">${esc(cd.txt)}</textarea>
        <div class="row wrap jqrow"><select data-jca="${pid}" aria-label="Área da vida"><option value="">área da vida (opcional)</option>${AREAS.map(a => `<option${cd.area === a ? " selected" : ""}>${esc(a)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-act="jcsave" data-p="${pid}">${ic("check")}Guardar</button></div>
        ${Object.keys(byArea).length ? `<div class="flbl">Onde ${esc(D.nome)} mais aparece</div>${hbars(Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => ({ l: ashort(a), v: n, color: D.cor, txt: String(n) })), {})}` : ""}
        <div class="jclist">${cots.slice(0, J.open["cot" + pid] ? 99 : 5).map(c => `<div class="jcn"><small class="muted">${fmtDY(c.data)}${c.area ? " · " + esc(ashort(c.area)) : ""}</small><p>${esc(c.texto)}</p><button type="button" class="lnk" data-act="jcdel" data-p="${pid}" data-id="${c.id}">apagar</button></div>`).join("")}</div>${cots.length > 5 ? `<button type="button" class="lnk" data-act="jtoggle" data-k="cot${pid}">${J.open["cot" + pid] ? "mostrar menos" : `ver todas (${cots.length})`}</button>` : ""}`)}
    </div>
    <aside class="jright">${jChat(mid, { rec: true })}</aside></div>`;
}
function jConf() {
  const C = jData().conf, W = jBridges(), pos = { esp: [260, 56], med: [462, 200], bud: [260, 344], tao: [58, 200] }, mx = Math.max(1, ...Object.values(W));
  let g = "";
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a = J_ORDER[i], b = J_ORDER[j], w = W[[a, b].sort().join("|")] || 0, [x1, y1] = pos[a], [x2, y2] = pos[b];
    g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="jn-e" style="stroke-width:${w ? 1.5 + 9 * w / mx : 1};opacity:${w ? .35 + .55 * w / mx : .25}"${w ? "" : ' stroke-dasharray="4 5"'}/>${w ? `<g class="jn-wg"><circle cx="${x1 + (x2 - x1) * .36}" cy="${y1 + (y2 - y1) * .36}" r="11"/><text x="${x1 + (x2 - x1) * .36}" y="${y1 + (y2 - y1) * .36 + 4}" text-anchor="middle" class="jn-w">${w}</text></g>` : ""}`; }
  for (const p of J_ORDER) { const [x, y] = pos[p], D = J_PIL[p]; g += `<g class="click" data-act="jgo" data-go="jornada.${D.sub}" role="button" tabindex="0" aria-label="${esc(D.nome)}"><circle cx="${x}" cy="${y}" r="44" class="jn-n" style="stroke:${D.cor};fill:color-mix(in srgb,${D.cor} 16%,var(--surface))"/><text x="${x}" y="${y + 4}" text-anchor="middle" class="jn-t">${esc(D.nome)}</text></g>`; }
  const pontes = J_ORDER.flatMap(p => jP(p).refl.filter(r => r.tambem?.length).map(r => ({ ...r, pid: p }))).sort((a, b) => b.at - a.at);
  const ci = C.circulos.slice().sort((a, b) => b.at - a.at), K = J.circ, ai = !!SAMPLE && !AI_OFF && !blockedMentor("esp");
  const row = (t, viv) => `<tr><th>${esc(t.t)}${viv != null ? `<button type="button" class="jviv${viv ? " on" : ""}" data-act="jviv" data-id="${t.id}" aria-pressed="${viv}">${ic(viv ? "check" : "plus")}${viv ? "vivo em mim" : "vive em mim?"}</button>` : ""}</th>${J_ORDER.map(p => `<td style="--c:${J_PIL[p].cor}">${esc(t[p])}</td>`).join("")}</tr>`;
  return `<p class="lead">Onde os quatro caminhos se encontram. Eles convergem muito na prática e na ética, e divergem em algumas afirmações sobre o que somos; honrar as duas coisas é o que permite uma vida integrada sem misturar tudo.</p>
    <div class="g2c">
      ${vis("jnet", "As pontes da sua jornada", svgWrap(520, 400, g, "Rede dos quatro pilares; as linhas mais grossas ligam pilares que aparecem juntos nas suas reflexões e nos temas que você marcou como vivos"), { sub: "linhas mais grossas: pilares que andam juntos nas suas reflexões (“também toca”) e nos temas vivos", nofocus: true })}
      ${panel(`${ic("council")}Círculo dos mentores`, `<p class="muted">Traga uma pergunta e os mentores conversam entre si: cada um na voz da sua tradição, depois onde convergem, onde divergem e uma prática que une os pilares.</p>
        <textarea class="jta" rows="3" data-jcircq="1" placeholder="Ex.: Como lidar com a raiva de alguém que me prejudicou?">${esc(K.q)}</textarea>
        <div class="row wrap jqrow">${J_ORDER.map(p => jChip(p, K.quem.includes(p), `data-act="jcq" data-m="${p}"`)).join("")}<button type="button" class="jchip${K.quem.includes("bm") ? " on" : ""}" style="--c:var(--a-pro)" data-act="jcq" data-m="bm">${ic("compass")}Navegante</button></div>
        <div class="row wrap">${K.busy ? `<button type="button" class="btn" data-act="jcstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn primary" data-act="jcgo"${ai ? "" : " disabled"}>${ic("spark")}Reunir o círculo</button>`}</div>
        ${K.busy || K.txt ? `<div class="jcirc mdx">${K.txt ? md(K.txt) : `<div class="thinking">${ic("spark")}Os mentores estão se reunindo…</div>`}</div>` : ""}
        ${ci.length ? `<div class="flbl">Círculos anteriores</div>${ci.slice(0, 6).map(c => `<details class="fsold"><summary><b>${esc(trunc(c.pergunta, 90))}</b> <span class="muted">${fmtDY(iso(new Date(c.at)))}</span></summary><div class="mdx">${md(c.texto)}</div><div class="row"><button type="button" class="lnk" data-act="jcirdel" data-id="${c.id}">apagar</button></div></details>`).join("")}` : ""}
        <p class="muted small">${ic("shield")}Vai para a IA: a pergunta e o mesmo resumo da jornada que cada mentor lê (sem as reflexões só suas). Aparece em Privacidade.</p>`, { cls: "jcircp" })}
      ${panel(`${ic("link")}Onde convergem`, `<div class="hscroll"><table class="dt jconv"><thead><tr><th></th>${J_ORDER.map(p => `<th style="color:${J_PIL[p].cor}">${esc(J_PIL[p].nome)}</th>`).join("")}</tr></thead><tbody>${J_CONV.map(t => row(t, C.vivos.includes(t.id))).join("")}</tbody></table></div>
        <div class="jconv-m">${J_CONV.map(t => `<details class="fsold"><summary><b>${esc(t.t)}</b>${C.vivos.includes(t.id) ? ` <span class="jtag sm">vivo em mim</span>` : ""}</summary><dl class="bmtrad">${J_ORDER.map(p => `<dt>${esc(J_PIL[p].nome)}</dt><dd>${esc(t[p])}</dd>`).join("")}</dl><button type="button" class="jviv${C.vivos.includes(t.id) ? " on" : ""}" data-act="jviv" data-id="${t.id}">${C.vivos.includes(t.id) ? "vivo em mim" : "vive em mim?"}</button></details>`).join("")}</div>
        ${C.vivos.length ? `<div class="flbl">Como esses temas aparecem na sua vida</div>${C.vivos.map(id => { const t = J_CONV.find(x => x.id === id); return t ? `<label class="jnote">${esc(t.t)}<textarea rows="2" data-jtn="${id}" placeholder="Um exemplo seu, recente">${esc(C.notas[id] || "")}</textarea></label>` : ""; }).join("")}` : `<p class="muted small">Marque os temas que você sente vivos em você; eles engrossam as pontes da rede e os mentores passam a considerá-los.</p>`}`, { cls: "span2" })}
      ${panel(`${ic("globe")}Onde divergem, com respeito`, `<div class="hscroll"><table class="dt jconv"><thead><tr><th></th>${J_ORDER.map(p => `<th style="color:${J_PIL[p].cor}">${esc(J_PIL[p].nome)}</th>`).join("")}</tr></thead><tbody>${J_DIV.map(t => row(t, null)).join("")}</tbody></table></div>
        <div class="jconv-m">${J_DIV.map(t => `<details class="fsold"><summary><b>${esc(t.t)}</b></summary><dl class="bmtrad">${J_ORDER.map(p => `<dt>${esc(J_PIL[p].nome)}</dt><dd>${esc(t[p])}</dd>`).join("")}</dl></details>`).join("")}</div>
        <p class="note">${ic("info")}<span>Não é preciso resolver essas diferenças para praticar. Muita gente vive bem com a pergunta aberta; os mentores de cada pilar podem aprofundar a visão de cada tradição.</span></p>`, { cls: "span2" })}
      ${panel(`${ic("repeat")}Práticas que unem os pilares`, `<div class="bmprat">${J_INTEG.map(x => `<div class="bmp"><div><b>${esc(x.t)}</b><p>${esc(x.d)}</p><div class="row wrap">${x.p.map(p => `<span class="jtag sm" style="--c:${J_PIL[p].cor}">${esc(J_PIL[p].nome)}</span>`).join("")}</div></div><button type="button" class="btn sm ghost" data-act="bmhab" data-hab="${esc(x.t)}">${ic("repeat")}Hábito</button></div>`).join("")}</div>`)}
      ${panel(`${ic("link")}Pontes que você percebeu <small>${pontes.length}</small>`, pontes.length ? `<div class="jfeed">${pontes.slice(0, 8).map(r => `<a class="jfi" href="#jornada.${J_PIL[r.pid].sub}" style="--c:${J_PIL[r.pid].cor}"><span class="jtag sm">${esc(J_PIL[r.pid].nome)} → ${r.tambem.map(o => esc(J_PIL[o].nome)).join(", ")}</span><span>${r.priv ? `<i class="muted">reflexão só sua</i>` : esc(trunc(r.texto, 160))}</span><small class="muted">${relDay(r.data)}</small></a>`).join("")}</div>` : `<div class="empty">Ao escrever uma reflexão, marque “também toca” quando ela falar de mais de um pilar. Essas pontes aparecem aqui e na rede.</div>`)}
    </div>`;
}
function jNavegante() {
  const le = !!S.bussola?.navLe, sc = bmScores(28);
  return `<div class="jcols" style="--c:var(--a-pro)"><div class="jleft">
      ${panel(`${ic("compass")}O Navegante`, `<p>O Navegante acompanha a sua Bússola: ajuda a pôr os valores em foco em prática, a ler o exame da noite sem culpa (a pergunta é “o que aprendi?”, não “fui bom?”), a pensar dilemas com as oito perguntas e a seguir os caminhos de mudança. Fala a partir das cinco tradições da Bússola e não decide por você: ilumina as opções e o que cada uma tende a plantar.</p>
        ${kpiRow([kmini("var(--accent)", "Valores em foco", bmFoco().length ? bmFoco().map(id => esc(bmV(id).nome)).join(", ") : "nenhum", `<a class="lnk" href="#jornada.bussola">escolher na bússola</a>`), kmini("var(--a-pro)", "Prática · 4 semanas", sc.idx == null ? "–" : pct(sc.idx), `${sc.dias} noites com exame`)])}`)}
      ${panel(`${ic("shield")}O que o Navegante lê`, `<p class="muted">Sempre: os valores em foco e as notas do exame (esqueci, tentei, pratiquei), com a evolução por semana, e um resumo dos quatro pilares.</p>
        <label class="ckl"><input type="checkbox" data-act="bmnavle"${le ? " checked" : ""}><span>Deixar o Navegante ler também os textos do exame da noite e das decisões</span></label>
        <p class="muted small">${le ? "Liberado: os textos das últimas duas semanas de exames e das últimas decisões vão junto em cada conversa." : "Hoje os textos ficam só com você. A entrada que o exame grava no diário continua fora da IA."}</p>`)}
    </div><aside class="jright">${jChat("bm", { intro: "Traga um valor que quer praticar, um dilema ou o que apareceu no exame da noite.", priv: "O Navegante lê os valores em foco, as notas do exame e um resumo dos pilares; os textos do exame e das decisões só se você liberar ao lado. Cada conversa aparece em Privacidade." })}</aside></div>`;
}
/* cartão em Hoje */
function jHoje() {
  const pid = jDayPillar(), D = J_PIL[pid], [q, src] = jTeach(pid), at = jAdopted().slice(0, 6);
  return panel(`${ic("lotus")}Jornada de hoje`, `<div class="jday" style="--c:${D.cor}"><span class="jtag">${ic(D.ico)}${esc(D.nome)}</span><blockquote class="jquote sm">${esc(q)}<cite>${esc(src)}</cite></blockquote><p class="bmq">${ic("info")}<span>${esc(jQuestion(pid))}</span></p></div>
    ${at.length ? `<div class="flbl">Práticas</div><div class="jhmk">${at.map(x => { const on = (x.marcas || []).includes(TODAY); return `<button type="button" class="jchip${on ? " on" : ""}" style="--c:${J_PIL[x.pid].cor}" data-act="jmark" data-p="${x.pid}" data-id="${x.id}" aria-pressed="${on}">${ic(on ? "check" : J_PIL[x.pid].ico)}${esc(trunc(x.titulo, 34))}</button>`; }).join("")}</div>` : ""}
    <div class="row wrap"><a class="btn sm" href="#jornada.${D.sub}">${ic("pen")}Escrever uma reflexão</a></div>`, { act: `<a class="lnk" href="#jornada">jornada</a>` });
}

/* ---------------------------------------------------------------- círculo dos mentores */
async function jCircle() {
  const K = J.circ, q = K.q.trim(); if (!SAMPLE || K.busy) return;
  if (!q) { toast("Escreva a pergunta para o círculo."); return; }
  if (!K.quem.length) { toast("Escolha pelo menos um mentor."); return; }
  const quem = J_MIDS.filter(m => K.quem.includes(m === "bm" ? "bm" : jMidP(m)));
  K.busy = true; K.txt = ""; K.ctl = new AbortController(); render();
  const build = () => `TAREFA: CÍRCULO DOS MENTORES
Os mentores da Jornada existencial de uma pessoa conversam sobre a pergunta dela. Ela orienta a vida por Espiritismo kardecista, meditação, Taoísmo e Budismo, e usa uma Bússola moral de 17 valores.
Participantes e vozes:
${quem.map(m => `- ${MENTOR_DEF[m].nome} (${MENTOR_DEF[m].papel}): ${MENTOR_DEF[m].voz}`).join("\n")}
Escreva em markdown, português do Brasil, segunda pessoa, até ${120 + 80 * quem.length} palavras no total, exatamente com estes títulos:
${quem.map(m => `## ${MENTOR_DEF[m].nome}`).join("\n")}
## Onde convergem
## Onde divergem
## Uma prática que une os pilares
## Pergunta para levar
Em cada voz, 2 a 4 frases autênticas da tradição; os mentores podem se responder. Não hierarquize as tradições nem as funda numa só; em “Onde divergem”, mostre as diferenças com respeito, ou diga que aqui não divergem. Cite fonte só quando tiver certeza. Use os dados da pessoa abaixo quando ajudarem, com datas. Se a pergunta mostrar sofrimento intenso ou risco à própria vida, comece acolhendo e indicando ajuda agora (CVV 188 no Brasil, 112 na Europa).
PERGUNTA: """${q.slice(0, 2000)}"""
DADOS DA JORNADA:
${J_ORDER.map(p => `## ${J_PIL[p].nome}\n${jPilarFacts(p, false).join("\n")}`).join("\n")}
${jCommonFacts("todos").slice(1).join("\n")}`;
  try {
    const r = await aiCall("Círculo dos mentores", build, { signal: K.ctl.signal, modelTier: "default", cache: false, onText: ({ text }) => { K.txt = text; const el = $(".jcirc"); if (el) el.innerHTML = md(text); else render(); } });
    const texto = r.text.trim(), rec = { id: uid(), at: Date.now(), pergunta: q, quem, texto };
    jData().conf.circulos.push(rec); if (jData().conf.circulos.length > 30) jData().conf.circulos.shift();
    const conv = jSection(texto, "Onde convergem");
    for (const m of quem) addMemory(m, { tipo: "círculo", texto: `Círculo de ${fmtD(TODAY)} sobre “${trunc(q, 100)}”${conv ? `: ${trunc(conv, 260)}` : ""}`, origem: "círculo" });
    K.q = ""; K.txt = texto; touch("jornada", "mentores", { label: "Círculo dos mentores" });
  } catch (e) { if (e?.text) K.txt = e.text; if (e?.code !== "cancelled") aiError(e); }
  finally { K.busy = false; render(); }
}

/* ---------------------------------------------------------------- eventos */
function jSaveRefl(pid, txt, tipo, tambem = [], priv = false, extra = {}) {
  const t = String(txt || "").trim(); if (!t) { toast("Escreva algo antes de guardar."); return null; }
  const r = { id: uid(), data: TODAY, at: Date.now(), tipo, texto: t.slice(0, 6000), tambem: tambem.filter(o => o !== pid), priv: !!priv, ...extra };
  jP(pid).refl.push(r); return r;
}
function jClick(t) {
  const ds = t.dataset, a = ds.act, pid = ds.p;
  if (a === "jtochat") { const el = $("#m_in"); $("#jment")?.scrollIntoView({ block: "start", behavior: "smooth" }); el?.focus({ preventScroll: true }); return true; }
  if (a === "jgo") { const [p, s] = ds.go.split("."); setHash(p, s); return true; }
  if (a === "jopen") { setTimeout(() => { J.open[ds.k] = t.open; }, 0); return false; }
  if (a === "jtoggle") { J.open[ds.k] = !J.open[ds.k]; render(); return true; }
  if (a === "jest") { const P = jP(pid), v = +ds.v, cur = P.est[ds.s]?.v || 0; if (cur === v) return true; P.est[ds.s] = { v, at: Date.now() }; touch("jornada", { label: "Estação do caminho" }); return true; }
  if (a === "jrtipo") { (J.dr[pid] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }).tipo = ds.v; render(); return true; }
  if (a === "jrtam") { const d = J.dr[pid] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }, i = d.tambem.indexOf(ds.o); i >= 0 ? d.tambem.splice(i, 1) : d.tambem.push(ds.o); render(); return true; }
  if (a === "jrpriv") { const d = J.dr[pid] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }; d.priv = t.checked; return true; }
  if (a === "jrsave") { const d = J.dr[pid] || {}; const r = jSaveRefl(pid, d.txt, d.tipo || "reflexão", d.tambem || [], d.priv); if (!r) return true; J.dr[pid] = { txt: "", tipo: d.tipo || "reflexão", tambem: [], priv: false }; touch("jornada", { label: "Reflexão guardada" }); toast(r.priv ? "Guardada só para você" : "Reflexão guardada"); return true; }
  if (a === "jrlock") { const r = jP(pid).refl.find(x => x.id === ds.id); if (r) { r.priv = !r.priv; touch("jornada", { label: r.priv ? "Reflexão só sua" : "Reflexão liberada ao mentor" }); } return true; }
  if (a === "jrdel") { const P = jP(pid); P.refl = P.refl.filter(x => x.id !== ds.id); touch("jornada", { label: "Reflexão apagada" }); undoToast("Reflexão apagada"); return true; }
  if (a === "jrask") { const r = jP(pid).refl.find(x => x.id === ds.id); if (!r) return true; const mid = J_PIL[pid].mid; MST.input[mid] = `Sobre a minha ${r.tipo} de ${fmtDL(r.data)}:\n\n“${r.texto}”\n\nO que você vê aqui, e como posso aprofundar?`; render(); const el = $("#m_in"); if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); } return true; }
  if (a === "jqask") { const d = J.dr[pid] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }; if (!d.txt.trim()) d.txt = `${jQuestion(pid)}\n\n`; render(); const el = $(`[data-jr="${pid}"]`); if (el) { el.scrollIntoView({ block: "center" }); el.focus({ preventScroll: true }); el.setSelectionRange(el.value.length, el.value.length); } return true; }
  if (a === "jadopt") { const P = jP(pid); let x;
    if (ds.id) { x = P.prat.find(z => z.id === ds.id); if (x) x.status = "ativa"; }
    else { const c = J_PIL[pid].cat[+ds.k]; if (c) x = jRecommend(pid, { tipo: c.tipo, titulo: c.t, descricao: c.d }, "base"); }
    if (x) { touch("jornada", { label: "Prática adotada" }); toast(`Adotada: ${trunc(x.titulo, 50)}`); } return true; }
  if (a === "jmark") { const x = jP(pid).prat.find(z => z.id === ds.id); if (!x) return true; x.marcas ||= []; const i = x.marcas.indexOf(TODAY); i >= 0 ? x.marcas.splice(i, 1) : x.marcas.push(TODAY); touch("jornada", { label: i >= 0 ? "Prática desmarcada" : "Prática feita hoje" }); return true; }
  if (a === "jpst") { const P = jP(pid), x = P.prat.find(z => z.id === ds.id); if (!x) return true; if (ds.v === "remover") P.prat = P.prat.filter(z => z.id !== ds.id); else x.status = ds.v; touch("jornada", { label: ds.v === "remover" ? "Sugestão dispensada" : `Prática ${ds.v}` }); if (ds.v !== "ativa") undoToast(ds.v === "remover" ? "Sugestão dispensada" : "Prática pausada"); return true; }
  if (a === "jpadd") { const el = $(`#jpn_${pid}`), v = (el?.value || "").trim(); if (!v) { toast("Escreva o nome da prática."); return true; } const r = jRecommend(pid, { tipo: $(`#jpn_tipo_${pid}`)?.value, titulo: v }, "você"); if (!r) { toast("Essa prática já está na lista."); return true; } touch("jornada", { label: "Prática acrescentada" }); return true; }
  if (a === "jcsave") { const d = J.cot[pid] || {}, v = String(d.txt || "").trim(); if (!v) { toast("Escreva a situação antes de guardar."); return true; } jP(pid).cot.push({ id: uid(), data: TODAY, at: Date.now(), texto: v.slice(0, 3000), area: d.area || "" }); J.cot[pid] = { txt: "", area: d.area || "" }; touch("jornada", { label: "Nota do cotidiano" }); return true; }
  if (a === "jcdel") { const P = jP(pid); P.cot = P.cot.filter(x => x.id !== ds.id); touch("jornada", { label: "Nota apagada" }); undoToast("Nota apagada"); return true; }
  if (a === "jcheck" && MENTOR_DEF[ds.mid]?.lz) { askMentor(ds.mid, lzCheckText(ds.mid), "check"); return true; }
  if (a === "jrec" && MENTOR_DEF[ds.mid]?.lz) { askMentor(ds.mid, lzRecText(ds.mid)); return true; }
  if (a === "jcheck") { askMentor(ds.mid, ds.mid === "bm" ? "Faça um acompanhamento da minha Bússola: 1) o que você percebe nas notas e na evolução dos valores em foco, em poucas linhas; 2) onde estou firme e onde estou à deriva; 3) um ajuste para a próxima semana; 4) uma pergunta para levar. Atualize o caminho combinado se fizer sentido e guarde na memória só o essencial." : "Faça um acompanhamento da minha jornada neste pilar: 1) o que você percebe no meu caminho (estações, ritmo, reflexões e cotidiano), em poucas linhas e citando datas; 2) um ponto de luz e um ponto de atenção; 3) uma contemplação para esta semana; 4) até 2 práticas, leituras ou exercícios para agora, usando recomendar; 5) atualize o caminho combinado se fizer sentido. Guarde na memória só o essencial.", "check"); return true; }
  if (a === "jrec") { askMentor(ds.mid, "Recomende 2 ou 3 práticas, leituras ou exercícios para o meu momento neste pilar, usando recomendar, e diga em uma linha por que cada um serve para mim agora."); return true; }
  if (a === "jqp") { const i = J.q.p.indexOf(pid); i >= 0 ? J.q.p.splice(i, 1) : J.q.p.push(pid); render(); return true; }
  if (a === "jqt") { J.q.tipo = ds.v; render(); return true; }
  if (a === "jqsave") { if (!J.q.p.length) { toast("Escolha a qual pilar a reflexão pertence."); return true; } const [p0, ...rest] = J.q.p, r = jSaveRefl(p0, J.q.txt, J.q.tipo, rest); if (!r) return true; J.q = { txt: "", p: [], tipo: J.q.tipo }; touch("jornada", { label: "Reflexão guardada" }); toast(`Guardada em ${J_PIL[p0].nome}`); return true; }
  if (a === "jrevsave") { const r = jSaveRefl(pid, J.rev, "revisita", [], false, { de: ds.id }); if (!r) return true; J.rev = ""; touch("jornada", { label: "Revisita guardada" }); toast("Guardada: a reflexão antiga e a nova ficam ligadas"); return true; }
  if (a === "jviv") { const v = jData().conf.vivos, i = v.indexOf(ds.id); i >= 0 ? v.splice(i, 1) : v.push(ds.id); touch("jornada", { label: "Tema de confluência" }); return true; }
  if (a === "jcq") { const k = ds.m, i = J.circ.quem.indexOf(k); i >= 0 ? J.circ.quem.splice(i, 1) : J.circ.quem.push(k); render(); return true; }
  if (a === "jcgo") { jCircle(); return true; }
  if (a === "jcstop") { J.circ.ctl?.abort(); return true; }
  if (a === "jcirdel") { const C = jData().conf; C.circulos = C.circulos.filter(x => x.id !== ds.id); touch("jornada", { label: "Círculo apagado" }); undoToast("Círculo apagado"); return true; }
  if (a === "bmnav") { const v = bmV(ds.id); MST.input.bm = `Quero aprofundar o valor ${v.nome}. ${v.acao} Como praticar isso no meu momento?`; setHash("jornada", "navegante"); return true; }
  if (a === "bmnavle") { (S.bussola ||= { foco: [] }).navLe = t.checked; touch("bussola", { label: t.checked ? "Navegante lê os textos" : "Textos só com você" }); return true; }
  return false;
}
function jInput(t) {
  const ds = t.dataset;
  if (ds.jr) { (J.dr[ds.jr] ||= { txt: "", tipo: "reflexão", tambem: [], priv: false }).txt = t.value; return true; }
  if (ds.jc) { (J.cot[ds.jc] ||= { txt: "", area: "" }).txt = t.value; return true; }
  if (ds.jq) { J.q.txt = t.value; return true; }
  if (ds.jrev) { J.rev = t.value; return true; }
  if (ds.jcircq) { J.circ.q = t.value; return true; }
  return false;
}
function jChange(t) {
  const ds = t.dataset;
  if (ds.jca) { (J.cot[ds.jca] ||= { txt: "", area: "" }).area = t.value; return true; }
  if (ds.jtn) { jData().conf.notas[ds.jtn] = t.value.trim(); touch("jornada", { label: "Nota do tema", noRender: true }); return true; }
  return false;
}
