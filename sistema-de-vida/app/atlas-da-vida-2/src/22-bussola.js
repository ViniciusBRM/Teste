/* ================================================================ bússola moral: valores, decisões, exame da noite e caminhos
   Dados em três chaves: bussola (foco), bmExames (um registro por noite), bmDecisoes. Nada daqui vai para a IA, exceto o texto
   de uma decisão quando a pessoa pede o olhar das cinco tradições (e isso entra no registro de Privacidade). */
const BM = { sel: null, dia: null, draft: null, ai: "", busy: false, ctl: null };
const BM_TRAD = [["kardec", "Espiritismo"], ["estoico", "Estoicismo"], ["tao", "Taoismo"], ["conf", "Confucionismo"], ["buda", "Budismo"]];
const BM_AX = [
  { id: "centro", nome: "Consciência", rumo: "Centro", sub: "a agulha: perceber", cor: "var(--accent)" },
  { id: "norte", nome: "Sentido", rumo: "Norte", sub: "para onde vou", cor: "var(--a-pro)" },
  { id: "leste", nome: "O outro", rumo: "Leste", sub: "justiça e igualdade", cor: "var(--a-car)" },
  { id: "sul", nome: "O coração", rumo: "Sul", sub: "compaixão em ação", cor: "var(--a-amo)" },
  { id: "oeste", nome: "O próprio", rumo: "Oeste", sub: "equilíbrio e desapego", cor: "var(--a-men)" },
];
/* os 17 valores: os 14 que você escolheu e três que eles pedem (Humildade, Caridade, Temperança) */
const BM_V = [
  { id: "consciencia", nome: "Consciência", ax: "centro", hab: "Exame da noite (5 min)",
    sint: "A agulha da bússola: perceber o que penso, sinto e faço no momento em que acontece, e rever o dia à noite.",
    t: { kardec: "“Conhece-te a ti mesmo” é, para os Espíritos, o meio mais eficaz de melhorar, com o exame de consciência ao fim de cada dia proposto por Santo Agostinho (O Livro dos Espíritos, q. 919).", estoico: "Prosoché, a atenção vigilante a si mesmo. Sêneca revia cada noite o seu dia (Da Ira, III, 36).", tao: "“Quem conhece os outros é sábio; quem conhece a si mesmo é iluminado” (Tao Te Ching, 33).", conf: "Zengzi: “Todo dia me examino em três pontos” (Analectos 1.4).", buda: "Sati, a atenção plena: ver o pensamento surgir sem ser arrastado por ele." },
    falta: "Viver no automático: reagir antes de perceber.", excesso: "Autovigilância culpada, que se condena em vez de se conhecer.",
    acao: "Antes de agir, perceber; depois de agir, rever.", pratica: "Três respirações antes de responder ao que incomodou; cinco minutos de exame à noite.",
    perg: "O que estou sentindo agora, e é esse sentimento que está decidindo por mim?", liga: ["sabedoria", "paciencia", "humildade"] },
  { id: "espiritualidade", nome: "Espiritualidade", ax: "norte", hab: "Intenção ao acordar e prece ou meditação curta",
    sint: "Saber-se espírito em evolução: cada dia é matéria-prima do progresso da alma, não uma prova a ser vencida sozinho.",
    t: { kardec: "Somos Espíritos imortais em aprendizado; pela lei do progresso ninguém fica para trás para sempre, e cada existência é oportunidade de crescer (O Livro dos Espíritos, parte 3).", estoico: "Viver de acordo com o Logos, a razão que ordena o todo, e ver-se como parte dele.", tao: "Seguir o Tao, o curso natural das coisas, agindo sem forçar (wu wei).", conf: "Cultivar a si mesmo para cumprir o “mandato do Céu” no lugar em que se está.", buda: "O caminho é a própria prática: cada instante de atenção e de bondade é um passo." },
    falta: "Vida sem horizonte: só sobreviver ao dia.", excesso: "Espiritualidade de fuga: usar a fé para não olhar a própria vida, ou para se sentir acima dos outros.",
    acao: "Tratar cada dificuldade como lição e cada pessoa como companheira de caminho.", pratica: "Ao acordar, uma intenção para o dia; uma prece, leitura ou meditação curta.",
    perg: "O que esta situação está me pedindo para aprender?", liga: ["sabedoria", "desprendimento", "caridade"] },
  { id: "sabedoria", nome: "Sabedoria", ax: "norte", hab: "Ler 10 min de uma das tradições",
    sint: "Ver as coisas como são e agir de acordo: conhecimento iluminado pelo amor.",
    t: { kardec: "A fé raciocinada: compreender antes de crer, e unir o saber à moral.", estoico: "Sophia, a primeira das quatro virtudes: distinguir o que é bom, o que é mau e o que é indiferente.", tao: "“Saber parar evita o perigo; saber contentar-se evita a desonra” (Tao Te Ching, 44).", conf: "“Saber o que se sabe e reconhecer o que não se sabe: isso é saber” (Analectos 2.17).", buda: "Prajñā: ver a impermanência e a interdependência de todas as coisas." },
    falta: "Agir por impulso ou pela opinião alheia.", excesso: "Intelectualismo: saber muito para se sentir superior.",
    acao: "Diante da dúvida, perguntar, ouvir e esperar antes de concluir.", pratica: "Ler dez minutos de uma das tradições e levar uma frase para o dia.",
    perg: "Estou vendo o fato ou o meu julgamento sobre o fato?", liga: ["consciencia", "humildade", "equilibrio"] },
  { id: "humildade", nome: "Humildade", ax: "norte", hab: "Três mestres: o que aprendi com alguém hoje",
    sint: "Saber o próprio tamanho: nem maior nem menor que ninguém. O antídoto da superioridade.",
    t: { kardec: "O orgulho e o egoísmo são os maiores obstáculos ao progresso (O Livro dos Espíritos, q. 785); “Bem-aventurados os pobres de espírito” (O Evangelho segundo o Espiritismo, cap. VII).", estoico: "Marco Aurélio, imperador, escrevia a si mesmo: “Cuida para não te tornares um César” (Meditações, 6.30).", tao: "“Quem se exibe não brilha; quem se gaba não tem mérito” (Tao Te Ching, 24). A água busca os lugares baixos e por isso alimenta tudo (cap. 8).", conf: "“Andando com outras duas pessoas, certamente encontro nelas um mestre” (Analectos 7.22).", buda: "Māna, a comparação “sou melhor, igual ou pior”, é raiz de sofrimento; até “sou igual” é vaidade. A cura é soltar o eu que compara." },
    falta: "Superioridade: medir os outros pela minha régua.", excesso: "Autodepreciação: achar-se menos, que é vaidade às avessas.",
    acao: "Procurar em cada pessoa algo a aprender.", pratica: "Anotar no exame uma coisa que aprendi hoje com alguém de quem eu esperava pouco.",
    perg: "Estou me comparando? Com que régua, e quem me deu essa régua?", liga: ["igualdade", "respeito", "sabedoria"] },
  { id: "justica", nome: "Justiça", ax: "leste", hab: "Mesma régua para todos",
    sint: "Dar a cada um o que lhe é devido, e o devido a todos é dignidade.",
    t: { kardec: "A lei de justiça, amor e caridade: querer para os outros o que se quer para si (O Livro dos Espíritos, parte 3, cap. XI).", estoico: "Dikaiosynē: agir pelo bem comum, porque nascemos para cooperar, como as mãos e os pés (Meditações, 2.1).", tao: "“O Caminho do Céu não tem favoritos” (Tao Te Ching, 79): a justiça não depende de quem é a pessoa.", conf: "Yi, o reto: fazer o certo mesmo quando não convém.", buda: "Ação correta, um dos passos do Nobre Caminho Óctuplo." },
    falta: "Duas medidas: uma régua para os meus, outra para os outros.", excesso: "Justiçamento: julgar sem misericórdia.",
    acao: "Aplicar a mesma régua a todos, a começar por mim.", pratica: "Ao julgar alguém, perguntar se julgaria igual um amigo, ou a mim mesmo.",
    perg: "Se eu estivesse do outro lado, acharia isto justo?", liga: ["igualdade", "compaixao", "consciencia"] },
  { id: "igualdade", nome: "Igualdade", ax: "leste", hab: "Notar e nomear julgamentos automáticos",
    sint: "Toda pessoa tem a mesma origem e o mesmo destino. Cor, fé e origem são vestes de uma existência, não a essência.",
    t: { kardec: "“Todos os homens são iguais perante Deus” (O Livro dos Espíritos, q. 803). O homem de bem é benevolente com todos “sem distinção de raças nem de crenças, porque em todos os homens vê irmãos” (O Evangelho segundo o Espiritismo, cap. XVII). Pela reencarnação, o mesmo Espírito pode nascer em qualquer povo, cor ou religião.", estoico: "Sêneca, sobre o escravo: “aquele a quem chamas escravo nasceu da mesma semente que tu” (Cartas a Lucílio, 47). Somos cidadãos do mundo.", tao: "“O sábio não tem coração fixo: faz do coração do povo o seu coração” (Tao Te Ching, 49).", conf: "“Dentro dos quatro mares, todos são irmãos” (Analectos 12.5).", buda: "“Não é pelo nascimento que alguém é nobre ou vil; é pelas ações” (Sutta Nipata, Vasala Sutta)." },
    falta: "Preconceito: ver o grupo antes da pessoa.", excesso: "Uma igualdade que apaga diferenças e ignora a história e as feridas reais de cada grupo.",
    acao: "Ver a pessoa antes do grupo, e o espírito antes da pessoa.", pratica: "Quando surgir um julgamento sobre cor, religião ou origem: nomear (“isto é um julgamento aprendido, não um fato”) e desejar bem àquela pessoa em silêncio.",
    perg: "Se esta pessoa fosse de outra cor, religião ou país, eu pensaria e agiria do mesmo jeito?", liga: ["fraternidade", "humildade", "justica"] },
  { id: "fraternidade", nome: "Fraternidade", ax: "leste", hab: "Um gesto para alguém fora do meu círculo",
    sint: "Somos uma família espiritual: o bem de um não se separa do bem de todos.",
    t: { kardec: "“Fora da caridade não há salvação” (O Evangelho segundo o Espiritismo, cap. XV): ninguém evolui sozinho.", estoico: "Os círculos de Hiérocles: trazer os círculos de fora (estranhos, outros povos) para mais perto, como se fossem parentes.", tao: "As dez mil coisas nascem de uma mesma fonte (Tao Te Ching, 42).", conf: "Ren, a humanidade, é “amar as pessoas” (Analectos 12.22).", buda: "A originação interdependente: nada existe isolado." },
    falta: "Individualismo: “cada um por si”.", excesso: "Fraternidade só com os do meu grupo.",
    acao: "Pensar em “nós” antes de “eu”, e alargar o “nós”.", pratica: "Um gesto de cuidado com alguém de fora do meu círculo habitual.",
    perg: "Quem fica de fora do meu “nós”, e por quê?", liga: ["caridade", "igualdade", "desprendimento"] },
  { id: "respeito", nome: "Respeito", ax: "leste", hab: "Repetir o que o outro disse antes de responder",
    sint: "Reconhecer a dignidade do outro, também quando discordo dele.",
    t: { kardec: "O homem de bem “respeita nos outros todas as convicções sinceras” (O Evangelho segundo o Espiritismo, cap. XVII).", estoico: "Quando alguém te ofende, lembra que age pelo que lhe parece certo (Epicteto, Enchiridion, 42).", tao: "“Gerar sem possuir, agir sem se apoiar, conduzir sem dominar” (Tao Te Ching, 10).", conf: "Li, a forma respeitosa de tratar cada pessoa, e o “não faças aos outros o que não queres para ti” (Analectos 15.24).", buda: "Fala correta: não ferir com palavras." },
    falta: "Desprezo, ironia, falar do outro pelas costas.", excesso: "Respeito servil, que se cala diante do erro.",
    acao: "Discordar da ideia sem diminuir a pessoa.", pratica: "Numa conversa difícil, repetir com as minhas palavras o que o outro disse antes de responder.",
    perg: "Eu falaria assim se a pessoa estivesse presente?", liga: ["tolerancia", "educacao", "humildade"] },
  { id: "tolerancia", nome: "Tolerância", ax: "leste", hab: "Ouvir alguém de outra fé pela voz dele",
    sint: "Acolher a diferença de crença, costume e caminho, sem renunciar ao que é justo.",
    t: { kardec: "A lei de liberdade inclui a liberdade de consciência (O Livro dos Espíritos, parte 3, cap. X); há bons Espíritos em todas as religiões.", estoico: "“Os homens existem uns para os outros: ensina-os ou suporta-os” (Meditações, 8.59).", tao: "Como o vale recebe as águas, o Tao acolhe as dez mil coisas sem escolher entre elas.", conf: "“O nobre busca a harmonia, não a uniformidade” (Analectos 13.23).", buda: "Examinar os ensinamentos por si mesmo, sem fanatismo (Kalama Sutta)." },
    falta: "Intolerância religiosa ou cultural, como a desconfiança automática de muçulmanos.", excesso: "Tolerar a injustiça e a violência.",
    acao: "Conhecer a fé ou o costume do outro pelas palavras dele, não pelos estereótipos.", pratica: "Ler ou ouvir alguém de outra fé falando dela na própria voz, por exemplo um muçulmano falando do Islã.",
    perg: "Conheço isto pela fonte ou pelo que dizem sobre ela?", liga: ["respeito", "igualdade", "sabedoria"] },
  { id: "compaixao", nome: "Compaixão", ax: "sul", hab: "Metta: 5 min de bondade amorosa",
    sint: "Sentir com o outro e querer o fim do seu sofrimento, inclusive do meu.",
    t: { kardec: "Caridade é “benevolência para com todos, indulgência para as imperfeições dos outros, perdão das ofensas” (O Livro dos Espíritos, q. 886).", estoico: "“A bondade é invencível, se for sincera” (Meditações, 11.18).", tao: "O primeiro dos três tesouros é a compaixão (Tao Te Ching, 67).", conf: "Mêncio: todo ser humano tem um coração que não suporta o sofrimento alheio, como quem vê uma criança prestes a cair num poço (Mêncio, 2A6).", buda: "Mettā e karuṇā, a bondade e a compaixão: “O ódio não cessa pelo ódio, só pelo amor” (Dhammapada, 5)." },
    falta: "Indiferença: o sofrimento alheio não me diz respeito.", excesso: "Pena que diminui o outro, ou cuidado que se esgota sem cuidar de si.",
    acao: "Diante de quem sofre, perguntar: do que você precisa?", pratica: "Cinco minutos desejando bem a mim, a alguém querido, a um desconhecido e a alguém de quem não gosto.",
    perg: "Que dor pode estar por trás da atitude desta pessoa?", liga: ["caridade", "paciencia", "igualdade"] },
  { id: "gentileza", nome: "Gentileza", ax: "sul", hab: "Agradecer pelo nome a quem me atende",
    sint: "Compaixão nos gestos pequenos: o tom de voz, o cumprimento, a paciência na fila.",
    t: { kardec: "O homem de bem é “bom, humano e benevolente para com todos” (O Evangelho segundo o Espiritismo, cap. XVII).", estoico: "“Onde houver um ser humano, há lugar para um benefício” (Sêneca, Da Vida Feliz, 24).", tao: "O macio vence o duro: nada é mais suave que a água, e nada a supera contra o que é rígido (Tao Te Ching, 78).", conf: "“O Mestre era afável, mas firme” (Analectos 7.38).", buda: "Fala amável: palavras verdadeiras, úteis e ditas na hora certa." },
    falta: "Aspereza, pressa, tratar pessoas como obstáculos.", excesso: "Agradar para ser aceito.",
    acao: "Tratar quem me serve como trataria quem admiro.", pratica: "Olhar nos olhos e agradecer pelo nome a quem me atende.",
    perg: "Como quero que esta pessoa se sinta depois de falar comigo?", liga: ["educacao", "compaixao", "paciencia"] },
  { id: "educacao", nome: "Educação", ax: "sul", hab: "Uma cortesia deliberada no momento difícil",
    sint: "A formação do caráter que aparece nas maneiras: cortesia por fora, refinamento moral por dentro.",
    t: { kardec: "A educação moral, bem entendida, é a chave do progresso (O Livro dos Espíritos, q. 917).", estoico: "A filosofia como cuidado da alma; o progresso moral (prokopē) é gradual e diário.", tao: "O sábio ensina sem palavras, pelo exemplo (Tao Te Ching, 2).", conf: "Aprender sempre e expressar o respeito nas formas (li): “Aprender e praticar no tempo certo, não é uma alegria?” (Analectos 1.1).", buda: "Sīla, a conduta ética treinada todos os dias." },
    falta: "Grosseria; parar de aprender.", excesso: "Etiqueta usada para excluir ou se sentir acima.",
    acao: "Ser o exemplo do que quero ver.", pratica: "Uma cortesia deliberada em cada interação difícil do dia.",
    perg: "Meu jeito de agir ensinaria algo bom a quem me observa?", liga: ["respeito", "gentileza", "sabedoria"] },
  { id: "caridade", nome: "Caridade", ax: "sul", hab: "Um gesto de serviço anônimo",
    sint: "O amor em ação, sem esperar retorno: o caminho mais direto para preencher o vazio.",
    t: { kardec: "“Fora da caridade não há salvação” (O Evangelho segundo o Espiritismo, cap. XV); “que a mão esquerda não saiba o que faz a direita” (cap. XIII).", estoico: "Sêneca: dar sem registrar o benefício, como quem semeia (Dos Benefícios).", tao: "“O sábio não acumula: quanto mais faz pelos outros, mais tem” (Tao Te Ching, 81).", conf: "“Quem quer firmar-se, ajuda os outros a se firmarem” (Analectos 6.30).", buda: "Dāna, a generosidade, a primeira das perfeições." },
    falta: "Viver só para si.", excesso: "Caridade para ser visto, ou que tira a autonomia do outro.",
    acao: "Fazer por alguém, todo dia, algo que ninguém precisa saber.", pratica: "Um gesto de serviço anônimo por dia, anotado no exame da noite.",
    perg: "A quem posso ser útil hoje, sem que isso me traga nada?", liga: ["fraternidade", "compaixao", "desprendimento"] },
  { id: "paciencia", nome: "Paciência", ax: "oeste", hab: "Três respirações antes de reagir",
    sint: "Dar tempo ao tempo, às pessoas e a mim mesmo: a força que não precisa reagir.",
    t: { kardec: "“A paciência também é uma caridade” (O Evangelho segundo o Espiritismo, cap. IX, “Bem-aventurados os brandos e pacíficos”).", estoico: "“Não são as coisas que nos perturbam, mas os juízos que fazemos delas” (Epicteto, Enchiridion, 5).", tao: "“Quem consegue, aquietando-se, deixar a água turva clarear aos poucos?” (Tao Te Ching, 15).", conf: "“Não queiras pressa: com pressa não se chega” (Analectos 13.17).", buda: "Khanti, a paciência, é uma das perfeições." },
    falta: "Irritação, pressa, explodir.", excesso: "Passividade: esperar quando é hora de agir.",
    acao: "Responder em vez de reagir.", pratica: "Na irritação, três respirações e a pergunta: isto vai importar daqui a um ano?",
    perg: "O que exatamente está fora do meu controle aqui?", liga: ["equilibrio", "compaixao", "consciencia"] },
  { id: "equilibrio", nome: "Equilíbrio", ax: "oeste", hab: "De manhã: o que depende de mim hoje",
    sint: "O caminho do meio, nem excesso nem falta: a tranquilidade de quem sabe o que depende de si.",
    t: { kardec: "A lei de conservação ensina a usar os bens sem abuso; o excesso é desvio (O Livro dos Espíritos, parte 3, cap. V).", estoico: "“Algumas coisas dependem de nós, outras não” (Epicteto, Enchiridion, 1): daí nasce a tranquilidade (ataraxia).", tao: "O vazio no centro do cubo faz a roda girar (Tao Te Ching, 11); agir sem forçar (wu wei).", conf: "O Meio-Termo (Zhongyong): a harmonia de não pender para nenhum extremo.", buda: "O Caminho do Meio, entre a indulgência e a mortificação; upekkhā, a equanimidade." },
    falta: "Oscilar entre extremos; ser levado pelas circunstâncias.", excesso: "Indiferença fria disfarçada de equilíbrio.",
    acao: "Separar o que depende de mim do que não depende, e pôr a energia só no primeiro.", pratica: "De manhã, listar o que depende de mim hoje; à noite, soltar o resto.",
    perg: "Estou indo a um extremo? Qual seria o caminho do meio?", liga: ["paciencia", "temperanca", "sabedoria"] },
  { id: "temperanca", nome: "Temperança", ax: "oeste", hab: "Pausa de 10 min antes de um impulso",
    sint: "Comedimento no comer, falar, comprar e desejar: usar sem ser usado.",
    t: { kardec: "Distinguir o necessário do supérfluo e conhecer o limite do necessário (O Livro dos Espíritos, parte 3, cap. V).", estoico: "Sōphrosynē, a moderação, uma das quatro virtudes cardeais.", tao: "O segundo tesouro é a frugalidade (Tao Te Ching, 67); “quem sabe se contentar é rico” (cap. 33).", conf: "“Passar do ponto é tão ruim quanto não chegar” (Analectos 11.16).", buda: "Moderação no alimento e nos sentidos: observar o desejo sem obedecê-lo." },
    falta: "Compulsão: comer, comprar ou rolar a tela para preencher o vazio.", excesso: "Rigidez e privação como castigo.",
    acao: "Antes de consumir, perguntar se é necessidade ou fuga.", pratica: "Uma pausa de dez minutos antes de uma compra ou de um impulso.",
    perg: "O que estou tentando preencher com isto?", liga: ["desprendimento", "equilibrio", "consciencia"] },
  { id: "desprendimento", nome: "Desprendimento", ax: "oeste", hab: "Soltar uma coisa por semana",
    sint: "Soltar o supérfluo (coisas, status, ter razão) para abrir espaço ao essencial.",
    t: { kardec: "“Não se pode servir a Deus e a Mamon” (O Evangelho segundo o Espiritismo, cap. XVI): os bens são empréstimo para o bem, não identidade.", estoico: "Nunca dizer “perdi”, mas “devolvi” (Epicteto, Enchiridion, 11).", tao: "O vazio do vaso é o que o torna útil (Tao Te Ching, 11).", conf: "O nobre não se aflige quando não é reconhecido (Analectos 1.1).", buda: "A sede de ter e de ser (taṇhā) é a origem do sofrimento; soltá-la é a liberdade (segunda e terceira Nobres Verdades)." },
    falta: "Apego a coisas, à imagem e ao próprio ponto de vista.", excesso: "Desapego como fuga dos vínculos e das responsabilidades.",
    acao: "Segurar as coisas com a mão aberta.", pratica: "Doar ou soltar uma coisa por semana; uma vez por dia, abrir mão de ter razão.",
    perg: "Do que tenho medo de abrir mão, e o que isso diz de onde ponho o meu valor?", liga: ["temperanca", "caridade", "espiritualidade"] },
];
const bmV = id => BM_V.find(v => v.id === id);
const bmAx = id => BM_AX.find(a => a.id === id);
/* o tecido: cada valor prepara o seguinte, e o último devolve ao primeiro */
const BM_CICLO = ["consciencia", "humildade", "igualdade", "justica", "fraternidade", "caridade", "desprendimento", "temperanca", "equilibrio", "paciencia", "compaixao", "gentileza", "respeito", "tolerancia", "educacao", "espiritualidade", "sabedoria"];
const BM_CICLO_TXT = {
  consciencia: "percebe o orgulho", humildade: "abre espaço para ver o outro como igual", igualdade: "é a base da justiça", justica: "se completa na fraternidade",
  fraternidade: "se realiza na caridade", caridade: "pede desprendimento", desprendimento: "se sustenta na temperança", temperanca: "traz equilíbrio",
  equilibrio: "dá chão à paciência", paciencia: "torna possível a compaixão", compaixao: "aparece como gentileza", gentileza: "é a forma do respeito",
  respeito: "amadurece em tolerância", tolerancia: "se aprende pela educação", educacao: "forma o espírito", espiritualidade: "dá sentido à sabedoria", sabedoria: "aprofunda a consciência",
};
/* onde as cinco tradições convergem (a ética) e onde divergem (a metafísica) */
const BM_CONV = [
  ["Conhecer a si mesmo", { kardec: "Exame de consciência diário (LE q. 919)", estoico: "Revisão noturna de Sêneca (Da Ira III, 36)", tao: "“Conhecer a si mesmo é iluminação” (TTC 33)", conf: "“Examino-me três vezes ao dia” (An. 1.4)", buda: "Atenção plena (sati)" }],
  ["Todos são iguais", { kardec: "Iguais perante Deus (LE q. 803); “sem distinção de raças nem de crenças” (ESE XVII)", estoico: "“Da mesma semente que tu” (Sêneca, Carta 47)", tao: "O coração do povo como o seu (TTC 49)", conf: "“Todos são irmãos” (An. 12.5)", buda: "Nobre pelas ações, não pelo nascimento (Vasala Sutta)" }],
  ["Amar e servir", { kardec: "Fora da caridade não há salvação (ESE XV)", estoico: "Nascemos para cooperar (Med. 2.1)", tao: "Quanto mais dá, mais tem (TTC 81)", conf: "Firmar os outros (An. 6.30)", buda: "Mettā, karuṇā, dāna" }],
  ["Soltar o supérfluo", { kardec: "Deus e Mamon (ESE XVI)", estoico: "“Devolvi”, não “perdi” (Ench. 11)", tao: "O vazio útil do vaso (TTC 11)", conf: "Sem ressentimento por não ser reconhecido (An. 1.1)", buda: "Fim da sede (taṇhā)" }],
  ["Serenidade diante do que não controlo", { kardec: "Brandos e pacíficos (ESE IX)", estoico: "O que depende de nós (Ench. 1, 5)", tao: "A água turva clareia parada (TTC 15)", conf: "O Meio-Termo (Zhongyong)", buda: "Equanimidade (upekkhā)" }],
  ["Causa e efeito", { kardec: "Lei de causa e efeito e reencarnação; causas atuais e anteriores das aflições (ESE V)", estoico: "O caráter é feito do que se pratica todo dia", tao: "A viagem de mil léguas começa com um passo (TTC 64)", conf: "Cultivar a si mesmo, depois a família, depois o mundo (O Grande Saber)", buda: "Kamma: somos herdeiros das nossas ações" }],
];
const BM_Q = [
  ["pausa", "Pausa", "O que estou sentindo agora? Esse sentimento está decidindo por mim?", "Epicteto: “Espera, impressão, deixa-me ver quem és” (Discursos II, 18)."],
  ["controle", "Controle", "O que aqui depende de mim, e o que não depende?", "Estoicismo (Enchiridion, 1)."],
  ["reciproco", "Reciprocidade", "Eu aceitaria esta decisão se estivesse no lugar de cada pessoa afetada?", "Confúcio (Analectos 15.24) e a lei de justiça, amor e caridade."],
  ["troca", "Teste da troca", "Se a pessoa envolvida fosse de outra cor, religião ou origem, eu decidiria igual?", "Igualdade perante Deus (O Livro dos Espíritos, q. 803)."],
  ["sementes", "Sementes", "Que sementes isto planta, em mim e nos outros, daqui a um ano?", "Lei de causa e efeito; kamma."],
  ["agua", "Como a água", "Estou forçando? Existe um caminho mais simples e suave?", "Wu wei (Tao Te Ching, 8 e 78)."],
  ["soltar", "Soltar", "O que estou tentando ganhar ou proteger: imagem, posse, ter razão? Posso soltar?", "Desprendimento; a sede (taṇhā)."],
  ["bem", "O homem de bem", "O que faria aqui a pessoa que eu quero ser daqui a dez anos?", "O homem de bem (ESE XVII), o nobre (junzi), o sábio estoico."],
];
const BM_CAM = [
  { id: "igualdade", t: "Do preconceito à igualdade", ico: "duo", v: ["igualdade", "tolerancia", "compaixao"],
    comp: "Preconceitos contra pessoas negras e muçulmanas são hábitos mentais aprendidos: na cultura, na mídia, na história. Ter um pensamento automático não define você; o que define é o que faz com ele. Para o Espiritismo, cor e religião são vestes de uma existência, e você mesmo pode ter vivido, ou viver um dia, como negro ou como muçulmano. Para o Budismo, o pensamento surge e passa, e você não precisa segui-lo. É um processo de anos, e cada vez que você percebe já é um passo.",
    nota: "Kardec escreveu no século XIX, e alguns textos dele refletem a hierarquia racial daquela época. O princípio que ele mesmo pôs no centro, a igualdade perante Deus e a reencarnação em qualquer povo, é o que permanece: dá para honrar a doutrina e corrigir o que nela era do tempo.",
    prat: [["Notar e nomear", "Quando surgir um julgamento automático, dizer por dentro: “isto é um julgamento aprendido, não um fato”, e registrar na vigilância do exame da noite."], ["Teste da troca", "Antes de concluir algo sobre alguém, trocar mentalmente a cor, a religião ou a origem da pessoa e ver se a conclusão muda."], ["Metta direcionada", "Cinco minutos por dia desejando bem a uma pessoa negra e a uma pessoa muçulmana concretas. Em um estudo, seis semanas de meditação de bondade amorosa reduziram o viés automático contra outros grupos (Kang, Gray e Dovidio, 2014)."], ["Ouvir as vozes", "Ler autores negros e muçulmanos na voz deles: Carolina Maria de Jesus (Quarto de Despejo), Conceição Evaristo, Djamila Ribeiro (Pequeno Manual Antirracista), Rumi, Naguib Mahfouz."], ["Contato real", "Conversar, trabalhar e comer junto. O convívio próximo, entre iguais, é uma das formas mais estudadas de reduzir preconceito (a hipótese do contato, de Gordon Allport)."], ["Reparar sem se condenar", "Se agir com preconceito: reconhecer, pedir desculpas quando couber e anotar o que aprendeu."]] },
  { id: "humildade", t: "Da superioridade à humildade", ico: "user", v: ["humildade", "respeito", "sabedoria"],
    comp: "A sensação de superioridade costuma proteger algo frágil: o medo de não valer. Por isso ela anda junto com o vazio. Quem se mede o tempo todo nunca descansa, porque sempre haverá alguém “acima” e a necessidade de alguém “abaixo”. Todas as tradições apontam a mesma saída: parar de medir. O Espiritismo chama o orgulho de maior obstáculo ao progresso; o Tao lembra que a água vence por ficar embaixo; o Budismo mostra que a comparação inteira, até o “sou igual”, nasce de um eu que precisa se defender.",
    prat: [["Três mestres", "Todo dia, anotar uma coisa que aprendeu com alguém de quem esperava pouco (Analectos 7.22)."], ["O defeito próprio primeiro", "“É fácil ver as faltas dos outros, difícil ver as próprias” (Dhammapada, 252): ao criticar alguém, procurar o mesmo traço em si."], ["Serviço invisível", "Fazer um bem que ninguém vai saber, para que o valor não dependa do aplauso."], ["A quem serve a comparação?", "Ao se pegar comparando, perguntar o que está tentando proteger."]] },
  { id: "fraternidade", t: "Do individualismo à fraternidade", ico: "users", v: ["fraternidade", "caridade", "igualdade"],
    comp: "O individualismo promete liberdade e costuma entregar solidão. Para o Espiritismo ninguém evolui sozinho; para os estoicos somos como as mãos e os pés de um mesmo corpo (Meditações, 2.1); para o Budismo nada existe separado; para Confúcio a humanidade se cultiva nas relações. Fraternidade não é sentimento, é prática: pequenos gestos que alargam o “nós”.",
    prat: [["Círculos de Hiérocles", "Uma vez por semana, desenhar os círculos (eu, família, amigos, vizinhos, cidade, outros povos) e fazer um gesto concreto pelo círculo mais distante."], ["Ouvir sem consertar", "Uma conversa por dia em que só escuta, sem aconselhar."], ["Algo coletivo", "Voluntariado, grupo de estudo, casa espírita, uma causa: um compromisso fixo com outras pessoas."]] },
  { id: "paciencia", t: "Paciência, tranquilidade e equilíbrio", ico: "leaf", v: ["paciencia", "equilibrio", "temperanca"],
    comp: "Paciência não é força de vontade: é ver com clareza o que depende de você. A irritação quase sempre vem de exigir que algo fora do seu controle seja diferente. A tranquilidade não é ausência de problemas; é a água que, parada, deixa a lama assentar (Tao Te Ching, 15). E o equilíbrio nasce de pequenas escolhas repetidas, não de grandes decisões.",
    prat: [["Dicotomia do controle", "De manhã, separar no papel o que depende de você hoje e o que não depende."], ["Três respirações", "Antes de responder ao que irritou, três respirações lentas."], ["Premeditação", "De manhã, imaginar os contratempos prováveis do dia e como quer responder a eles (Marco Aurélio, Meditações, 2.1)."], ["Meditação sentada", "Dez minutos por dia, só observando a respiração."], ["Caminhar sem tela", "Uma caminhada curta sem celular."]] },
  { id: "vazio", t: "Do vazio ao sentido", ico: "spark", v: ["desprendimento", "caridade", "espiritualidade"],
    comp: "O vazio existencial não é defeito seu: é uma pergunta. O Tao lembra que o vazio do vaso é o que o torna útil (cap. 11); ele pode ser espaço, não só falta. O Budismo mostra por que tentar preenchê-lo com coisas, aprovação ou distração o deixa mais faminto (taṇhā): o desprendimento não esvazia, abre lugar. E as cinco tradições convergem num ponto: o sentido aparece quando a atenção sai de si e vai para o outro, servir, cuidar, criar vínculo. Nos dias sem vontade, Marco Aurélio dizia a si mesmo: “levanto-me para fazer o trabalho de um ser humano” (Meditações, 5.1). Para o Espiritismo, cada existência tem um propósito e nenhuma dor é sem sentido nem para sempre.",
    cuidado: true,
    prat: [["Um gesto de serviço por dia", "Pequeno e concreto, anotado no exame da noite."], ["Uma conexão real por dia", "Uma mensagem ou conversa de verdade com alguém."], ["Três coisas boas", "Antes de dormir, três coisas boas do dia e por que aconteceram."], ["Soltar uma coisa por semana", "Doar, encerrar ou deixar ir algo que só ocupa espaço."], ["Natureza", "Um tempo ao ar livre, sem tela."], ["A pergunta da semana", "Para quem a minha existência faz diferença? Para quem eu quero que faça?"]] },
];
/* ---------------------------------------------------------------- dados */
const bmFoco = () => (S.bussola ||= { foco: [] }).foco ||= [];
const bmEx = () => (S.bmExames ||= {});
const bmDec = () => (S.bmDecisoes ||= []);
/* nota de cada valor numa noite: 0 esqueci ou agi contra, 1 lembrei e tentei, 2 pratiquei */
function bmScores(dias, ate = TODAY) {
  const from = addDays(ate, -dias + 1), by = {}; let n = 0;
  for (const [d, e] of Object.entries(bmEx())) { if (d < from || d > ate) continue; n++; for (const [id, v] of Object.entries(e.n || {})) if (isNum(v)) (by[id] ||= []).push(+v); }
  const val = Object.fromEntries(Object.entries(by).map(([id, a]) => [id, avg(a) / 2]));
  const ax = Object.fromEntries(BM_AX.map(a => { const vs = BM_V.filter(v => v.ax === a.id && val[v.id] != null).map(v => val[v.id]); return [a.id, vs.length ? avg(vs) : null]; }));
  const all = Object.values(by).flat();
  return { val, ax, idx: all.length ? avg(all) / 2 : null, dias: n, cons: n / dias };
}
function bmStreak() { let k = 0, d = bmEx()[TODAY] ? TODAY : addDays(TODAY, -1); while (bmEx()[d]) { k++; d = addDays(d, -1); } return k; }
function bmWeeks(n = 12) {
  const out = [], w0 = weekStart(TODAY), first = Object.keys(bmEx()).sort()[0];
  for (let i = n - 1; i >= 0; i--) { const ws = addDays(w0, -7 * i), we = addDays(ws, 6), sc = bmScores(7, we < TODAY ? we : TODAY); out.push({ wk: ws, idx: sc.idx, cons: !first || we < first ? null : Object.keys(bmEx()).filter(d => d >= ws && d <= we).length / (we < TODAY ? 7 : diff(TODAY, ws) + 1) }); }
  return out;
}
function bmDayValue() { const ids = bmFoco().length ? bmFoco() : BM_V.map(v => v.id), k = Math.floor(parse(TODAY).getTime() / 864e5); return bmV(ids[((k % ids.length) + ids.length) % ids.length]) || BM_V[0]; }
function bmSet(d, patch, label) { const e = { n: {}, ...(bmEx()[d] || {}) }; S.bmExames = { ...bmEx(), [d]: { ...e, ...patch, at: Date.now() } }; touch("bmExames", { label: label || "Exame da noite", noRender: true }); }
/* ---------------------------------------------------------------- desenho */
const bmAxPill = id => { const a = bmAx(id); return `<span class="bmax" style="--c:${a.cor}">${esc(a.rumo)} · ${esc(a.nome)}</span>`; };
const bmChip = (id, on) => { const v = bmV(id), a = bmAx(v.ax); return `<button type="button" class="bmchip${on ? " on" : ""}" data-bmv="${v.id}" style="--c:${a.cor}">${esc(v.nome)}</button>`; };
function bmCompass(sc) {
  const W = 600, C = 300, R = 200, SPREAD = { 3: 24, 4: 26, 5: 22 }, sel = BM.sel || bmFoco()[0] || "consciencia", ang = { norte: -90, leste: 0, sul: 90, oeste: 180 };
  let g = `<circle cx="${C}" cy="${C}" r="${R + 46}" class="bmc-o"/><circle cx="${C}" cy="${C}" r="${R - 70}" class="bmc-i"/>`;
  for (let k = 0; k < 72; k++) { const a = k * 5 * Math.PI / 180, r1 = R + 46, r2 = r1 - (k % 18 === 0 ? 14 : k % 2 ? 4 : 8); g += `<line x1="${(C + r1 * Math.cos(a)).toFixed(1)}" y1="${(C + r1 * Math.sin(a)).toFixed(1)}" x2="${(C + r2 * Math.cos(a)).toFixed(1)}" y2="${(C + r2 * Math.sin(a)).toFixed(1)}" class="bmc-t"/>`; }
  for (const a of BM_AX.filter(a => a.id !== "centro")) { const t = ang[a.id] * Math.PI / 180, r = a.id === "leste" || a.id === "oeste" ? 100 : 92, x = C + r * Math.cos(t), y = C + r * Math.sin(t);
    g += `<text x="${x.toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" class="bmc-ax" style="fill:${a.cor}">${esc(a.rumo.toUpperCase())}</text><text x="${x.toFixed(1)}" y="${(y + 12).toFixed(1)}" text-anchor="middle" class="bmc-axs">${esc(a.nome)}</text>`; }
  const v0 = bmV(sel), ta = v0.ax === "centro" ? -90 : ang[v0.ax];
  BM_V.filter(v => v.ax !== "centro").forEach(v => {
    const vs = BM_V.filter(x => x.ax === v.ax), i = vs.indexOf(v), t = (ang[v.ax] + (i - (vs.length - 1) / 2) * (SPREAD[vs.length] || 20)) * Math.PI / 180, r = R - 20, x = C + r * Math.cos(t), y = C + r * Math.sin(t), s = sc.val[v.id], col = bmAx(v.ax).cor, on = sel === v.id, foc = bmFoco().includes(v.id);
    const lx = C + (r + 18) * Math.cos(t), ly = C + (r + 18) * Math.sin(t), cs = Math.cos(t), an = cs > .35 ? "start" : cs < -.35 ? "end" : "middle", dy = Math.sin(t) > .5 ? 12 : Math.sin(t) < -.5 ? -4 : 4;
    g += `<g class="bmc-v click${on ? " on" : ""}" data-bmv="${v.id}" role="button" tabindex="0" aria-label="${esc(v.nome)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 12 : 10}" style="fill:${col};fill-opacity:${s == null ? .18 : (.25 + .75 * s).toFixed(2)};stroke:${col}"${foc ? ' class="foc"' : ""}/><text x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" text-anchor="${an}" class="bmc-l">${esc(v.nome)}</text></g>`;
  });
  const tt = ta * Math.PI / 180, nx = C + 64 * Math.cos(tt), ny = C + 64 * Math.sin(tt), px = -Math.sin(tt) * 7, py = Math.cos(tt) * 7;
  g += `<path d="M${nx.toFixed(1)},${ny.toFixed(1)} L${(C + px).toFixed(1)},${(C + py).toFixed(1)} L${(C - px).toFixed(1)},${(C - py).toFixed(1)}Z" class="bmc-n"/>`;
  const sc0 = sc.val.consciencia;
  g += `<g class="bmc-v click${sel === "consciencia" ? " on" : ""}" data-bmv="consciencia" role="button" tabindex="0" aria-label="Consciência"><circle cx="${C}" cy="${C}" r="34" class="bmc-c" style="fill-opacity:${sc0 == null ? .25 : (.3 + .7 * sc0).toFixed(2)}"/><text x="${C}" y="${C + 4}" text-anchor="middle" class="bmc-cl">Consciência</text></g>`;
  return `<div class="bmcomp">${svgWrap(W, W, g, "Bússola moral: os 17 valores em quatro rumos e a consciência no centro; a cor mais forte indica valor mais praticado nas últimas 4 semanas")}</div>`;
}
function bmDetail(v, sc) {
  const a = bmAx(v.ax), foc = bmFoco().includes(v.id), s = sc.val[v.id];
  return panel(`${ic("compass")}${esc(v.nome)} ${bmAxPill(v.ax)}`, `<p class="bmsint">${esc(v.sint)}</p>
    <div class="bmgrid"><div><span class="flbl">Princípio de ação</span><p><b>${esc(v.acao)}</b></p></div><div><span class="flbl">Prática</span><p>${esc(v.pratica)}</p></div></div>
    <p class="bmq">${ic("info")}<span>${esc(v.perg)}</span></p>
    <div class="bmsombra"><div><span class="flbl">Quando falta</span><p>${esc(v.falta)}</p></div><div><span class="flbl">Quando passa do ponto</span><p>${esc(v.excesso)}</p></div></div>
    <div class="flbl">Nas cinco tradições</div><dl class="bmtrad">${BM_TRAD.map(([k, l]) => `<dt>${l}</dt><dd>${esc(v.t[k])}</dd>`).join("")}</dl>
    <div class="flbl">Tece com</div><div class="row wrap">${v.liga.map(id => bmChip(id)).join("")}</div>
    <div class="row wrap bmacts"><button type="button" class="btn sm${foc ? "" : " primary"}" data-act="bmfoco" data-id="${v.id}">${ic(foc ? "check" : "target")}${foc ? "Em foco (tirar)" : "Pôr em foco"}</button><button type="button" class="btn sm" data-act="bmhab" data-hab="${esc(v.hab)}">${ic("repeat")}Virar hábito: ${esc(v.hab)}</button><span class="muted small">${s == null ? "sem notas nas últimas 4 semanas" : `prática nas últimas 4 semanas: ${pct(s)}`}</span></div>`, { cls: "bmdet", style: `--c:${a.cor}` });
}
function pBussola(R) {
  if (SUB === "exame") return bmExame();
  if (SUB === "decidir") return bmDecidir();
  if (SUB === "caminhos") return bmCaminhos();
  const sc = bmScores(28), v = bmV(BM.sel || bmFoco()[0] || "consciencia"), wk = bmWeeks(12), st = bmStreak();
  return `<p class="lead">Um instrumento para orientar decisões e acompanhar a evolução: 17 valores em quatro rumos (o sentido, o outro, o coração e o próprio), com a consciência no centro. Cada valor traz o que dizem o Espiritismo, o Estoicismo, o Taoismo, o Confucionismo e o Budismo, um princípio de ação, uma prática e uma pergunta. Escolha até três para pôr em foco; o exame da noite mede o caminho.</p>
    ${kpiRow([kmini("var(--accent)", "Valores em foco", bmFoco().length ? bmFoco().map(id => esc(bmV(id).nome)).join(", ") : "nenhum", bmFoco().length ? `${bmFoco().length} de 3` : "toque num valor e ponha em foco"), kmini("var(--a-pro)", "Prática · 4 semanas", sc.idx == null ? "–" : pct(sc.idx), "média das notas do exame (0 a 2)"), kmini("var(--a-men)", "Consciência · 4 semanas", `${sc.dias} de 28`, "noites com exame"), kmini("var(--a-amo)", "Exames seguidos", st, st ? "noites" : "comece hoje")])}
    <div class="g2c bmmap">
      ${vis("bmcomp", "A bússola", bmCompass(sc), { sub: "toque num valor; a cor mais forte é o mais praticado nas últimas 4 semanas, e a agulha aponta o valor escolhido", nofocus: true })}
      ${bmDetail(v, sc)}
      ${panel(`${ic("list")}Os 17 valores`, BM_AX.map(a => `<div class="bmrow"><span class="bmrl" style="--c:${a.cor}"><b>${esc(a.rumo)} · ${esc(a.nome)}</b><small>${esc(a.sub)}</small></span><div class="row wrap">${BM_V.filter(x => x.ax === a.id).map(x => bmChip(x.id, x.id === v.id)).join("")}</div></div>`).join("") + `<p class="muted small">Os 14 valores que você escolheu, mais três que eles pedem: Humildade (o antídoto da superioridade), Caridade (o amor em ação) e Temperança (o comedimento).</p>`)}
      ${panel(`${ic("refresh")}Como os valores se tecem`, `<p class="muted">Não são uma lista: cada um prepara o seguinte, e o último devolve ao primeiro.</p><ol class="bmciclo">${BM_CICLO.map((id, i) => `<li>${bmChip(id)} <span>${esc(BM_CICLO_TXT[id])}${i === BM_CICLO.length - 1 ? "" : "…"}</span></li>`).join("")}</ol>`)}
      ${panel(`${ic("globe")}Onde as tradições convergem`, `<div class="hscroll bmconv-wrap"><table class="dt bmconv"><thead><tr><th></th>${BM_TRAD.map(([, l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>${BM_CONV.map(([t, o]) => `<tr><th>${esc(t)}</th>${BM_TRAD.map(([k]) => `<td>${esc(o[k])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="bmconv-m">${BM_CONV.map(([t, o]) => `<details class="fsold"><summary><b>${esc(t)}</b></summary><dl class="bmtrad">${BM_TRAD.map(([k, l]) => `<dt>${l}</dt><dd>${esc(o[k])}</dd>`).join("")}</dl></details>`).join("")}</div>
        <p class="note">${ic("info")}<span>Elas convergem na ética e divergem na metafísica: o Espiritismo fala de um Espírito individual que evolui por muitas existências; o Budismo ensina que não há um eu permanente (anattā), e o carma é a continuidade das ações; o Estoicismo vê uma razão impessoal no todo; Tao e Confúcio falam pouco do além. A Bússola usa o que elas têm em comum para agir, e respeita as diferenças no que cada uma afirma sobre o que somos.</span></p>`, { cls: "span2" })}
      ${vis("bmtrend", "Evolução semanal", lineChart(wk.map(w => fmtD(w.wk)), [{ name: "Prática dos valores avaliados", color: "var(--a-pro)", data: wk.map(w => w.idx == null ? null : w.idx * 100) }, { name: "Noites com exame", color: "var(--a-men)", data: wk.map(w => w.cons == null ? null : w.cons * 100) }], { h: 210, w: 620, min: 0, max: 100, fmt: v => num(v, 0) + "%", empty: "Faça o exame da noite por alguns dias para ver a evolução." }), { cls: "span2", sub: "tendência importa mais que o número: é autoavaliação, e perceber uma falha também é consciência" })}
    </div>`;
}
function bmExame() {
  const d = BM.dia || TODAY, e = bmEx()[d] || { n: {} }, foco = bmFoco().length ? bmFoco() : ["consciencia", "paciencia", "compaixao"], outros = BM_V.filter(v => !foco.includes(v.id));
  const nota = id => { const v = bmV(id), cur = e.n?.[id]; return `<div class="bmnota"><span><b>${esc(v.nome)}</b><small>${esc(v.acao)}</small></span><div class="mchips">${[[0, "esqueci"], [1, "tentei"], [2, "pratiquei"]].map(([n, l]) => `<button type="button" class="seg" data-act="bmnota" data-id="${id}" data-v="${n}" aria-pressed="${cur === n}">${l}</button>`).join("")}</div></div>`; };
  const tx = (k, l, ph) => `<label>${l}<textarea rows="2" data-bmf="${k}" placeholder="${esc(ph)}">${esc(e[k] || "")}</textarea></label>`;
  const hist = Object.keys(bmEx()).sort().reverse().slice(0, 10);
  return `<p class="lead">Cinco minutos antes de dormir, como propõe Santo Agostinho em O Livro dos Espíritos (q. 919), como fazia Sêneca e como Zengzi se examinava três vezes ao dia. Sem tribunal: a pergunta não é “fui bom?”, é “o que aprendi?”.</p>
    <div class="g2c">
      ${panel(`${ic("moon")}Exame de ${d === TODAY ? "hoje" : fmtDL(d)}`, `<div class="row bmdia"><button type="button" class="iconbtn" data-act="bmdia" data-k="-1" aria-label="Dia anterior">‹</button><b>${fmtDY(d)}</b><button type="button" class="iconbtn" data-act="bmdia" data-k="1" aria-label="Dia seguinte"${d >= TODAY ? " disabled" : ""}>›</button>${bmEx()[d] ? pill("good", "registrado") : ""}</div>
        <div class="flbl">Valores em foco${bmFoco().length ? "" : " (sugestão: escolha os seus na Bússola)"}</div>${foco.map(nota).join("")}
        <details class="bmmais"><summary>Avaliar outros valores</summary>${outros.map(v => nota(v.id)).join("")}</details>
        <div class="form f1">${tx("bem", "Onde agi bem hoje?", "Um momento em que um valor guiou você")}${tx("falha", "Onde falhei, e por quê?", "Sem culpa: o que estava sentindo, o que estava protegendo")}${tx("vigia", "Vigilância: notei algum julgamento automático sobre alguém (cor, religião, origem)? O que fiz com ele?", "Perceber já é consciência")}${tx("servico", "Um gesto de serviço ou caridade", "Mesmo pequeno")}${tx("sentido", "O que deu sentido ao dia?", "Uma pessoa, um momento, uma coisa bem feita")}${tx("amanha", "Amanhã vou…", "Uma intenção concreta")}</div>
        <div class="row wrap"><button type="button" class="btn sm" data-act="bmdiario">${ic("pen")}Guardar no diário (fora da IA)</button></div>`, { cls: "bmexame" })}
      ${panel(`${ic("info")}Como ler as notas`, `<p><b>0, esqueci:</b> não lembrei do valor, ou agi contra ele. <b>1, tentei:</b> lembrei e tentei. <b>2, pratiquei:</b> o valor guiou uma escolha.</p><p class="muted">A média vira a prática da semana, de 0% a 100%. Ninguém chega a 100%, e não é esse o objetivo: o que mostra a evolução é a tendência ao longo dos meses. Notar um julgamento automático e registrá-lo na vigilância não é falha, é a Consciência funcionando.</p>
        <div class="flbl">Últimos exames</div>${hist.length ? `<div class="list">${hist.map(k => { const x = bmEx()[k], ns = Object.values(x.n || {}).filter(isNum); return `<button type="button" class="li click" data-act="bmdiaset" data-d="${k}"><span class="t">${fmtDL(k)}<div class="m">${ns.length ? `prática ${pct(avg(ns) / 2)} em ${plural(ns.length, "valor", "valores")}` : "sem notas"}${x.vigia ? " · vigilância" : ""}${x.servico ? " · serviço" : ""}</div></span></button>`; }).join("")}</div>` : `<div class="empty">Nenhum exame ainda.</div>`}`)}
    </div>`;
}
function bmDecidir() {
  const dr = BM.draft ||= { t: "", sit: "", q: {}, vals: [], dec: "" }, decs = [...bmDec()].sort((a, b) => b.data.localeCompare(a.data)), ai = SAMPLE && !AI_OFF;
  return `<p class="lead">Para dilemas éticos, morais ou existenciais: oito perguntas, uma de cada fonte, antes de decidir. Responda só as que ajudarem. Depois de uma semana, volte e veja o que a decisão plantou: é a lei de causa e efeito vista de perto.</p>
    <div class="g2c">
      ${panel(`${ic("compass")}Novo dilema`, `<div class="form f1"><label>Em poucas palavras<input data-bmd="t" value="${esc(dr.t)}" placeholder="Ex.: responder à crítica do colega"></label><label>A situação<textarea rows="3" data-bmd="sit" placeholder="O que aconteceu, quem está envolvido, o que está em jogo">${esc(dr.sit)}</textarea></label>
        ${BM_Q.map(([k, l, q, src]) => `<label><span class="bmql"><b>${esc(l)}</b> ${esc(q)} <small class="muted">${esc(src)}</small></span><textarea rows="2" data-bmdq="${k}">${esc(dr.q[k] || "")}</textarea></label>`).join("")}</div>
        <div class="flbl">Valores em jogo</div><div class="row wrap">${BM_V.map(v => `<button type="button" class="bmchip${dr.vals.includes(v.id) ? " on" : ""}" data-act="bmdval" data-id="${v.id}" style="--c:${bmAx(v.ax).cor}">${esc(v.nome)}</button>`).join("")}</div>
        <div class="form f1"><label>A decisão<textarea rows="2" data-bmd="dec" placeholder="O que vou fazer, e qual valor me guia">${esc(dr.dec)}</textarea></label></div>
        ${BM.ai ? `<div class="semans">${ic("spark")}<div class="mdx">${md(BM.ai)}</div></div>` : ""}
        <div class="row wrap">${BM.busy ? `<button type="button" class="btn" data-act="bmdstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn" data-act="bmdai"${ai ? "" : " disabled"}>${ic("spark")}O olhar das cinco tradições</button>`}<button type="button" class="btn primary" data-act="bmdsave">${ic("check")}Guardar decisão</button></div>
        <p class="muted small">${ic("shield")}Só o que está neste formulário vai para a IA, e apenas quando você toca no botão; a chamada aparece no registro de Privacidade.</p>`, { cls: "bmdec" })}
      ${panel(`${ic("clock")}Decisões e o que plantaram <small>${decs.length}</small>`, decs.length ? decs.map(x => { const due = diff(TODAY, x.data) >= 7;
        return `<details class="fsold"${x.id === BM.open ? " open" : ""}><summary><b>${esc(x.t || "Dilema")}</b> <span class="muted">${fmtDY(x.data)}${x.rev ? ` · revisitada: alinhamento ${x.rev.nota}/5` : due ? " · pronta para revisitar" : ""}</span></summary>
          <div class="row wrap">${(x.vals || []).map(id => bmChip(id)).join("")}</div>${x.sit ? `<p class="muted">${esc(x.sit)}</p>` : ""}<p><b>Decisão:</b> ${esc(x.dec || "–")}</p>${x.ia ? `<details><summary class="muted small">olhar das cinco tradições</summary><div class="mdx">${md(x.ia)}</div></details>` : ""}
          ${x.rev ? `<p><b>O que plantou:</b> ${esc(x.rev.txt)}</p>` : due ? `<div class="form f1"><label>O que aconteceu depois? Que efeitos teve, em mim e nos outros?<textarea rows="2" data-bmrev="${x.id}"></textarea></label></div><div class="row wrap"><span class="flbl">Quanto agi de acordo com os meus valores</span>${[1, 2, 3, 4, 5].map(n => `<button type="button" class="seg" data-act="bmrnota" data-id="${x.id}" data-v="${n}">${n}</button>`).join("")}</div>` : `<p class="muted small">Dá para revisitar a partir de ${fmtD(addDays(x.data, 7))}.</p>`}
          <div class="row"><button type="button" class="lnk" data-act="bmddel" data-id="${x.id}">apagar</button></div></details>`; }).join("") : `<div class="empty">As decisões guardadas aparecem aqui. Uma semana depois, o Atlas pede para você olhar o que elas plantaram.</div>`)}
    </div>`;
}
function bmCaminhos() {
  return `<p class="lead">Os desafios que você nomeou, um por um: o que está acontecendo, o que as tradições oferecem e práticas pequenas o bastante para caber num dia. Qualquer prática pode virar hábito no Atlas com um toque. É um processo, não uma conquista: cada recaída percebida já é um passo.</p>
    <div class="g2c">${BM_CAM.map(c => panel(`${ic(c.ico)}${esc(c.t)}`, `<p>${esc(c.comp)}</p>${c.nota ? `<p class="note">${ic("info")}<span>${esc(c.nota)}</span></p>` : ""}${c.cuidado ? `<p class="note st-warn bmcare">${ic("heart")}<span>A depressão também é uma condição de saúde, e a Bússola não substitui cuidado profissional; o próprio Espiritismo recomenda tratar o corpo e a mente com os recursos da medicina. Se o peso ficar grande demais, ou se surgirem pensamentos de não querer viver, fale com alguém agora: no Brasil, CVV, ligue 188 (24 horas, gratuito) ou cvv.org.br; na Europa, 112. O check-in de humor e o Mentor da Mente ajudam a acompanhar, mas não substituem uma pessoa.</span></p>` : ""}
      <div class="flbl">Valores que trabalham aqui</div><div class="row wrap">${c.v.map(id => bmChip(id)).join("")}</div>
      <div class="flbl">Práticas</div><div class="bmprat">${c.prat.map(([t, d]) => `<div class="bmp"><div><b>${esc(t)}</b><p>${esc(d)}</p></div><button type="button" class="btn sm ghost" data-act="bmhab" data-hab="${esc(t)}" aria-label="Virar hábito: ${esc(t)}">${ic("repeat")}Hábito</button></div>`).join("")}</div>`, { cls: "bmcam" + (c.cuidado ? " span2" : "") })).join("")}</div>`;
}
/* cartão em Hoje */
function bmHoje() {
  const v = bmDayValue(), done = !!bmEx()[TODAY], a = bmAx(v.ax);
  return panel(`${ic("compass")}Bússola de hoje`, `<div class="bmday" style="--c:${a.cor}"><b>${esc(v.nome)}</b><p>${esc(v.acao)}</p><p class="muted small">Prática: ${esc(v.pratica)}</p><p class="bmq">${ic("info")}<span>${esc(v.perg)}</span></p></div><div class="row wrap"><a class="btn sm${done ? "" : " primary"}" href="#bussola.exame">${ic(done ? "check" : "moon")}${done ? "Exame de hoje feito" : "Exame da noite"}</a></div>`, { act: `<a class="lnk" href="#bussola">bússola</a>` });
}
/* ---------------------------------------------------------------- IA: o olhar das cinco tradições */
async function bmAI() {
  const dr = BM.draft; if (!SAMPLE || BM.busy || !dr) return;
  if (!(dr.sit || dr.t).trim()) { toast("Descreva o dilema antes."); return; }
  BM.busy = true; BM.ai = ""; BM.ctl = new AbortController(); render();
  const build = () => `TAREFA: BUSSOLA MORAL
Você ajuda uma pessoa a pensar um dilema ético, moral ou existencial à luz de cinco tradições: Espiritismo kardecista (evolução do Espírito, lei de causa e efeito, caridade), Estoicismo, Taoismo, Confucionismo e Budismo. Ela é espírita e tem afinidade com as outras quatro. Português do Brasil, segunda pessoa, respeitoso e prático, até 280 palavras, em markdown.
Não decida por ela. Mostre o que cada tradição iluminaria aqui (uma linha cada, citando a fonte só se tiver certeza), depois 2 caminhos possíveis com o que cada um tende a plantar, e termine com uma única pergunta para ela levar.
Se o texto sugerir risco à própria vida ou desesperança grave, comece acolhendo e indique buscar ajuda agora (no Brasil, CVV 188; na Europa, 112), sem sermão.
Dilema: ${dr.t || "(sem título)"}
Situação: """${String(dr.sit || "").slice(0, 2500)}"""
Respostas dela às perguntas: ${BM_Q.filter(([k]) => dr.q[k]).map(([k, l]) => `${l}: ${String(dr.q[k]).slice(0, 400)}`).join(" | ") || "nenhuma"}
Valores em jogo: ${dr.vals.map(id => bmV(id).nome).join(", ") || "não marcados"}
Decisão que está considerando: ${dr.dec || "ainda nenhuma"}`;
  try { const r = await aiCall("Bússola moral", build, { signal: BM.ctl.signal, modelTier: "default", cache: false, onText: ({ text }) => { BM.ai = text; const el = $(".bmdec .semans .mdx"); if (el) el.innerHTML = md(text); else render(); } }); BM.ai = r.text.trim(); }
  catch (e) { if (e?.text) BM.ai = e.text; if (e?.code !== "cancelled") aiError(e); }
  finally { BM.busy = false; render(); }
}
/* ---------------------------------------------------------------- eventos */
function bmClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.bmv && !a) { BM.sel = ds.bmv; if (PAGE !== "bussola" || SUB !== "mapa") setHash("bussola", "mapa"); else render(); return true; }
  if (a === "bmfoco") { const f = bmFoco(), i = f.indexOf(ds.id); let msg; if (i >= 0) f.splice(i, 1); else { if (f.length >= 3) { msg = `${bmV(f[0]).nome} saiu do foco`; f.shift(); } f.push(ds.id); } touch("bussola", { label: "Valores em foco" }); if (msg) toast(msg); return true; }
  if (a === "bmhab") { const nome = ds.hab; if ((S.habitos || []).some(h => norm(h.nome) === norm(nome))) { toast("Esse hábito já está na sua lista."); return true; } S.habitos.push({ id: uid(), nome, area: AREAS.find(x => /prop/i.test(x)) || AREAS[0], meta: 5 }); touch("habitos", { label: "Hábito da Bússola" }); undoToast(`Hábito criado: ${nome}`); return true; }
  if (a === "bmnota") { const d = BM.dia || TODAY, e = bmEx()[d] || { n: {} }, v = +ds.v, cur = e.n?.[ds.id]; bmSet(d, { n: { ...(e.n || {}), [ds.id]: cur === v ? null : v } }, "Nota do exame"); render(); return true; }
  if (a === "bmdia") { const d = addDays(BM.dia || TODAY, +ds.k); BM.dia = d > TODAY ? TODAY : d; render(); return true; }
  if (a === "bmdiaset") { BM.dia = ds.d; render(); window.scrollTo({ top: 0 }); return true; }
  if (a === "bmdiario") { const d = BM.dia || TODAY, e = bmEx()[d]; if (!e) { toast("Preencha o exame antes."); return true; }
    const ns = Object.entries(e.n || {}).filter(([, v]) => isNum(v)).map(([id, v]) => `- ${bmV(id).nome}: ${["esqueci", "tentei", "pratiquei"][v]}`);
    const texto = [ns.length ? `## Valores\n${ns.join("\n")}` : "", e.bem && `## Onde agi bem\n${e.bem}`, e.falha && `## Onde falhei\n${e.falha}`, e.vigia && `## Vigilância\n${e.vigia}`, e.servico && `## Serviço\n${e.servico}`, e.sentido && `## O que deu sentido\n${e.sentido}`, e.amanha && `## Amanhã\n${e.amanha}`].filter(Boolean).join("\n\n") + "\n#bussola";
    const ex = S.diario.find(x => x.origem === "bussola" && x.data === d);
    if (ex) Object.assign(ex, { texto, editado: Date.now() }); else S.diario.push({ id: uid(), data: d, hora: nowHM(), titulo: "Exame da noite", texto, humor: null, energia: null, fixado: false, aplicados: [], criado: Date.now(), editado: Date.now(), origem: "bussola", semIA: true });
    touch("diario", { label: "Exame no diário" }); toast(ex ? "Entrada do diário atualizada" : "Exame guardado no diário, fora da IA"); return true; }
  if (a === "bmdval") { const dr = BM.draft ||= { t: "", sit: "", q: {}, vals: [], dec: "" }, i = dr.vals.indexOf(ds.id); i >= 0 ? dr.vals.splice(i, 1) : dr.vals.push(ds.id); render(); return true; }
  if (a === "bmdai") { bmAI(); return true; }
  if (a === "bmdstop") { BM.ctl?.abort(); return true; }
  if (a === "bmdsave") { const dr = BM.draft; if (!dr || !(dr.t || dr.sit || dr.dec).trim()) { toast("Escreva o dilema ou a decisão antes de guardar."); return true; }
    const rec = { id: uid(), data: TODAY, t: dr.t.trim(), sit: dr.sit.trim(), q: { ...dr.q }, vals: [...dr.vals], dec: dr.dec.trim(), ia: BM.ai || "" }; S.bmDecisoes = [...bmDec(), rec]; BM.draft = null; BM.ai = ""; BM.open = rec.id;
    touch("bmDecisoes", { label: "Decisão guardada" }); undoToast("Decisão guardada: em uma semana, volte para ver o que ela plantou"); return true; }
  if (a === "bmrnota") { const x = bmDec().find(z => z.id === ds.id); if (!x) return true; const txt = ($(`[data-bmrev="${ds.id}"]`)?.value || "").trim(); if (!txt) { toast("Escreva o que aconteceu antes de dar a nota."); return true; }
    x.rev = { data: TODAY, txt, nota: +ds.v }; BM.open = x.id; touch("bmDecisoes", { label: "Decisão revisitada" }); return true; }
  if (a === "bmddel") { const i = bmDec().findIndex(z => z.id === ds.id); if (i < 0) return true; S.bmDecisoes = bmDec().filter(z => z.id !== ds.id); touch("bmDecisoes", { label: "Decisão apagada" }); undoToast("Decisão apagada"); return true; }
  return false;
}
function bmChange(t) {
  if (t.dataset.bmf) { const d = BM.dia || TODAY; bmSet(d, { [t.dataset.bmf]: t.value.trim() }, "Exame da noite"); return true; }
  return false;
}
function bmInput(t) {
  if (t.dataset.bmd || t.dataset.bmdq) { const dr = BM.draft ||= { t: "", sit: "", q: {}, vals: [], dec: "" }; if (t.dataset.bmd) dr[t.dataset.bmd] = t.value; else dr.q[t.dataset.bmdq] = t.value; return true; }
  return false;
}
