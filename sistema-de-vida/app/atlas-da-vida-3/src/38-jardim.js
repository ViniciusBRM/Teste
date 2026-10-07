/* ================================================================ saúde espiritual: o jardim interior
   Um jardim que cresce com o que a jornada já registra, sem pontos inventados:
   - quatro árvores, uma por pilar: crescem com as estações do caminho, reflexões, sessões e notas do cotidiano;
     o verde depende dos dias com o pilar nas últimas 2 semanas (sem cuidado a árvore dorme, nunca morre);
     os frutos são as reflexões dos últimos 30 dias. Regar = escrever uma reflexão, que vai para o pilar.
   - o rio corre com as noites de exame da Bússola (14 dias); vagalumes (ou borboletas de dia) são os exames da semana;
     soltar uma folha no rio é um gesto de desapego: o texto não é guardado, só a data.
   - o lago de lótus floresce com os dias de meditação ou prática budista na semana.
   - pedra bruta = uma imperfeição nomeada; cada golpe de cinzel é um dia em que você a percebeu e trabalhou
     (ou em que praticou o valor-antídoto no exame da noite); com 3 dias, ela pode ser lavrada.
   - madeira bruta = sessões de prática; 3 toras + uma frase sobre o que a prática esculpe viram uma tábua.
   - o templo é construído com pedras lavradas e tábuas, em ordem, e algumas partes pedem algo da jornada.
   - cinco caminhos se abrem com marcos da jornada; a Bússola é a rosa dos ventos da praça e a Mandala, o vitral do templo.
   Dados: jardim = { pedras: [{id, nome, val, criada, marcas:[{data, txt}], lav}], talhos: [{id, data, pid, refl}], templo: {parte: data},
   folhas: [{data, at}], cam: {id: data} }. */
const JD = { sel: "portao", txt: {}, fx: null, h: null, lbl: false };
/* os selos usam a fonte de pincel Ma Shan Zheng (só 6 caracteres, pelo Google Fonts); sem ela, ficam os símbolos desenhados */
const jdCJK = () => { try { document.fonts?.load('20px "Ma Shan Zheng"', "道").then(f => { if (f?.length) document.documentElement.classList.add("jd-cjk"); }).catch(() => {}); } catch {} };
if (document.readyState === "complete") jdCJK(); else window.addEventListener("load", jdCJK);
document.fonts?.ready?.then(jdCJK);
const jdData = () => { const d = (S.jardim ||= {}); d.pedras ||= []; d.talhos ||= []; d.templo ||= {}; d.folhas ||= []; d.cam ||= {}; return d; };
const JD_ARV = {
  esp: { nome: "Ameixeira", art: "a", estilo: "xieyi, o pincel livre", cena: "brota da pedra no olho do yang e floresce sob a lua", sim: "Floresce no inverno, em galho nu, e renasce a cada ano: a fé que persevera e o Espírito que recomeça. Cresce da pedra das imperfeições em direção à luz.", insc: { l: ["Nascer, morrer,", "renascer ainda", "e progredir sem cessar."], f: "túmulo de Kardec" } },
  med: { nome: "Bambu", art: "o", estilo: "pintura chan (zen)", cena: "enso e bambu ao luar, pintados em branco sobre o yin", sim: "Oco por dentro e flexível ao vento: a mente que se esvazia e não quebra. O enso se fecha conforme a prática cresce.", insc: { l: ["Sentado em silêncio,", "a primavera chega", "e a relva cresce sozinha."], f: "Zenrin Kushu" } },
  tao: { nome: "Pinheiro", art: "o", estilo: "shanshui, montanha e água", cena: "na encosta, junto à cascata que alimenta o rio; o mirante fica no pico", sim: "Verde no inverno: a constância que não força, símbolo taoista de longevidade. Em flor, a garça dos imortais passa pelo pico.", insc: { l: ["A bondade suprema", "é como a água."], f: "Tao Te Ching, 8" } },
  bud: { nome: "Figueira-bodhi", art: "a", estilo: "baimiao, o traço fino em branco reservado sobre o yin", cena: "sobre o assento vazio, onde o rio chega ao mar, abaixo do lago de lótus", sim: "A árvore sob a qual Siddhartha despertou. O assento vazio é o modo antigo de representar o Buda: a presença sem figura.", insc: { l: ["Do monte de lixo", "à beira da estrada", "nasce o lótus."], f: "Dhammapada, 58" } } };
const JD_SIMB = {
  rio: "O S do yin-yang. Nasce no norte, junto ao Espiritismo, e deságua no sul, junto ao Budismo: separa e une as duas forças.",
  lago: "O olho do yin: a luz que nasce dentro do escuro, como o lótus que floresce da lama.",
  pedreira: "O olho do yang: a sombra dentro da luz. Cada pedra lavrada abre um furo na grande pedra, como a água esculpe as pedras do lago Tai.",
  oficina: "A cabana do eremita no bambuzal, do lado do yin: o trabalho silencioso da prática. As tábuas são lâminas de bambu, como os livros antigos.",
  templo: "No centro, onde as forças se tocam, o pavilhão se ergue sobre a Bússola. O que ainda falta construir aparece só como esboço a carvão.",
  praca: "A rosa dos ventos gravada no chão do templo, no ponto de equilíbrio do yin-yang.",
  mirante: "O pavilhão no pico da montanha taoista, de onde se vê o jardim inteiro.",
  portao: "O portão da lua, a entrada pelo lado do yang." };
const JD_EST = [[0, "semente"], [3, "broto"], [10, "muda"], [22, "árvore jovem"], [38, "árvore adulta"], [55, "em flor"]];
const JD_ENS = {
  rio: ["A bondade suprema é como a água: beneficia as dez mil coisas e não disputa.", "Tao Te Ching, 8"],
  folha: ["Todas as coisas condicionadas são impermanentes; quem vê isso com sabedoria se afasta do sofrimento.", "Dhammapada, 277"],
  pedra: ["Reconhece-se o verdadeiro espírita pela sua transformação moral e pelos esforços que emprega para domar suas más inclinações.", "O Evangelho segundo o Espiritismo, cap. XVII, item 4"],
  madeira: ["Os irrigadores conduzem a água; os flecheiros endireitam a flecha; os carpinteiros moldam a madeira; os sábios moldam a si mesmos.", "Dhammapada, 80"],
  lotus: ["Como o lótus nasce na lama e floresce limpo acima da água, assim quem desperta vive no mundo sem se manchar por ele.", "imagem do Budismo, a partir do Anguttara Nikaya"] };
const JD_TEMPLO = [
  { id: "alicerce", nome: "Alicerce", p: 3, m: 0, sim: "Humildade: tudo o que vier depois se apoia aqui.", ens: ["Todo aquele que ouve estas minhas palavras e as pratica será comparado a um homem prudente, que edificou a sua casa sobre a rocha.", "Mateus 7, 24"] },
  { id: "piso", nome: "Piso e altar", p: 2, m: 1, req: ["alicerce"], sim: "O chão de cada dia: a prática pequena e repetida. A chama do altar acende nas noites de exame.", ens: ["A árvore que mal se abraça nasce de um broto minúsculo; a torre de nove andares começa com um monte de terra.", "Tao Te Ching, 64"] },
  ...J_ORDER.map(pid => ({ id: "col_" + pid, nome: `Coluna de ${J_PIL[pid].nome}`, p: 1, m: 1, req: ["piso"], pid, sim: `Um dos quatro apoios. Pede a ${JD_ARV[pid].nome} ao menos em muda.`, ens: J_PIL[pid].ens[0],
    cond: { t: `${JD_ARV[pid].nome} (${J_PIL[pid].nome}) ao menos em muda`, ok: () => jdTree(pid).s >= 2 } })),
  { id: "telhado", nome: "Telhado", p: 0, m: 3, req: ["col_esp", "col_med", "col_tao", "col_bud"], sim: "O abrigo que os quatro caminhos sustentam juntos.", ens: ["Abrem-se portas e janelas para fazer um cômodo; é o vazio dentro dele que o torna útil.", "Tao Te Ching, 11"] },
  { id: "portal", nome: "Portal", p: 1, m: 1, req: ["piso"], sim: "A entrada guardada pelos valores que você escolheu.", ens: ["A mente precede todas as coisas; a mente é o seu chefe, e por ela são feitas.", "Dhammapada, 1"],
    cond: { t: "ao menos um valor em foco na Bússola", ok: () => bmFoco().length > 0 } },
  { id: "vitral", nome: "Vitral da mandala", p: 2, m: 0, req: ["telhado"], sim: "A luz entra pela mandala: o que você já vê em si.", ens: ["Conhece-te a ti mesmo.", "O Livro dos Espíritos, q. 919"],
    cond: { t: "5 estações da mandala ao menos brotando", ok: () => jdBrot() >= 5 } },
  { id: "sino", nome: "Sino", p: 0, m: 1, req: ["telhado"], sim: "O chamado de volta ao presente.", ens: ["Cada vez que o sino toca, pare, respire e volte para casa em si mesmo.", "prática do sino da atenção plena, no zen"],
    cond: { t: "um programa guiado concluído", ok: () => J_PROG.some(pr => jProgInfo(pr)?.fim) } }];
const JD_CAM = [
  { id: "bosque", nome: "Caminho circular", area: "os quatro pilares", t: "aberto desde o começo", prog: () => [1, 1], d: "M126 716A432 432 0 1 1 94 352" },
  { id: "margem", nome: "Descida à margem", area: "o rio e o lago de lótus", t: "1 reflexão em qualquer pilar", prog: () => [J_ORDER.reduce((s, p) => s + jP(p).refl.length, 0), 1], d: "M196 804C228 792 248 780 266 772C296 760 326 752 356 748C388 744 410 742 438 740" },
  { id: "ponte", nome: "Ponte sobre o rio", area: "a pedra no olho do yang e a oficina do eremita", t: "3 noites de exame da Bússola", prog: () => [Object.keys(bmEx()).length, 3], d: "M772 318C754 310 742 306 732 304C712 302 690 298 668 294" },
  { id: "escada", nome: "Escadaria do templo", area: "o templo", t: "1 pedra lavrada", prog: () => [jdData().pedras.filter(p => p.lav).length, 1], d: "M452 340C446 370 434 404 426 426C421 442 417 456 415 468" },
  { id: "mirante", nome: "Subida ao mirante", area: "a mandala e a bússola vistas do alto", t: "as quatro árvores ao menos em broto", prog: () => [J_ORDER.filter(p => jdTree(p).s >= 1).length, 4], d: "M98 646L122 606L104 566L138 528L118 486L148 446L132 404L150 360L150 344" }];
const JD_AREA = { margem: ["rio", "lago"], ponte: ["pedreira", "oficina", "ped"], escada: ["templo"], mirante: ["mirante"] };

/* ---------------------------------------------------------------- o que cresce e por quê */
function jdTree(pid) {
  const P = jP(pid), est = jEstSum(pid), sess = jData().sess.filter(x => x.pid === pid).length;
  const parts = [["estações do caminho (2 por nível)", 2 * est, 30], ["reflexões", Math.min(20, P.refl.length), 20], ["sessões de prática", Math.min(20, sess), 20], ["notas do cotidiano", Math.min(10, P.cot.length), 10]];
  const g = sum(parts.map(p => p[1])); let s = 0; JD_EST.forEach(([t], i) => { if (g >= t) s = i; });
  const dias = jActDays(pid, addDays(TODAY, -13), TODAY).size, nx = JD_EST[s + 1];
  return { pid, g, s, nome: JD_EST[s][1], parts, dias, v: Math.min(1, dias / 7), dorm: dias === 0, frutos: P.refl.filter(r => r.data >= addDays(TODAY, -29)).length, prox: nx?.[1] || null, falta: nx ? nx[0] - g : 0, pr: nx ? (g - JD_EST[s][0]) / (nx[0] - JD_EST[s][0]) : 1,
    plantas: P.prat.filter(x => x.status === "ativa").length };
}
const jdBrot = () => J_ORDER.reduce((s, p) => s + J_PIL[p].est.filter(e => jEstV(p, e.id) >= 2).length, 0);
function jdRio() { const n = Array.from({ length: 14 }, (_, i) => addDays(TODAY, -i)).filter(d => bmEx()[d]).length; return { n, f: n / 14, st: n === 0 ? "parado" : n < 5 ? "fio d'água" : n < 10 ? "correndo" : "cheio" }; }
const jdLotus = () => new Set(jData().sess.filter(x => x.data >= addDays(TODAY, -6) && (x.pid === "med" || x.pid === "bud")).map(x => x.data)).size;
const jdVaga = () => Array.from({ length: 7 }, (_, i) => addDays(TODAY, -i)).filter(d => bmEx()[d]).length;
const jdChama = () => !!(bmEx()[TODAY] || bmEx()[addDays(TODAY, -1)]);
function jdMarks(p) {
  const m = new Map((p.marcas || []).map(x => [x.data, { data: x.data, txt: x.txt, ex: false }]));
  if (p.val) for (const [d, e] of Object.entries(bmEx())) if (d >= p.criada && e.n?.[p.val] === 2 && !m.has(d)) m.set(d, { data: d, txt: `praticou ${bmV(p.val)?.nome || "o antídoto"} no exame da noite`, ex: true });
  return [...m.values()].sort((a, b) => a.data < b.data ? -1 : 1);
}
function jdStock() {
  const D = jdData(), lav = D.pedras.filter(p => p.lav).length, tab = D.talhos.length, built = JD_TEMPLO.filter(t => D.templo[t.id]);
  return { lav, tab, pedras: lav - sum(built.map(t => t.p)), tabuas: tab - sum(built.map(t => t.m)), toras: Math.max(0, jData().sess.length - 3 * tab), brutas: D.pedras.filter(p => !p.lav).length };
}
function jdCan(t) {
  const D = jdData(), st = jdStock(), falta = [];
  for (const r of t.req || []) if (!D.templo[r]) falta.push(`antes: ${JD_TEMPLO.find(x => x.id === r).nome.toLowerCase()}`);
  if (st.pedras < t.p) falta.push(`${plural(t.p - st.pedras, "pedra lavrada", "pedras lavradas")} a mais`);
  if (st.tabuas < t.m) falta.push(`${plural(t.m - st.tabuas, "tábua", "tábuas")} a mais`);
  if (t.cond && !t.cond.ok()) falta.push(t.cond.t);
  return { ok: !falta.length, falta };
}
const jdCamOpen = id => id === "bosque" || !!jdData().cam[id];
const jdCamReady = c => { const [a, b] = c.prog(); return a >= b; };
function jdLocked(k) { const area = k.split(":")[0]; for (const [cam, as] of Object.entries(JD_AREA)) if (as.includes(area) && !jdCamOpen(cam)) return JD_CAM.find(c => c.id === cam); return null; }
function jdSeason() { const m = +TODAY.slice(5, 7); return m >= 3 && m <= 5 ? ["primavera", "#79c25f"] : m >= 6 && m <= 8 ? ["verão", "#3e9447"] : m >= 9 && m <= 11 ? ["outono", "#b59f3a"] : ["inverno", "#5f8a64"]; }
function jdHour() { return JD.h ?? new Date().getHours(); }
function jdSky() { const h = jdHour(); return h >= 5 && h < 7 ? "aurora" : h >= 7 && h < 17 ? "dia" : h >= 17 && h < 20 ? "entardecer" : "noite"; }
function jdMoonF() { const ph = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853 + 29.530588853) % 29.530588853 / 29.530588853; return ph; }

/* ---------------------------------------------------------------- desenho: o jardim é o próprio taiji, pintado a tinta
   Leque redondo de raio 460 no centro (500, 500). O S do yin-yang é o rio: nasce no norte, junto ao Espiritismo, e deságua no
   sul, junto ao Budismo (o rio que chega ao mar). O yang (papel) fica a oeste, com a cabeça no alto; o yin (tinta) a leste,
   com a cabeça embaixo. Olho do yang: a pedra de estudioso, as imperfeições dentro da luz (cada pedra lavrada abre nela um
   furo, como a água que esculpe as pedras do lago Tai). Olho do yin: o lago de lótus, a flor que nasce do escuro. No centro,
   onde as forças se tocam, o pavilhão do templo sobre a Bússola. Cada pilar num gênero da pintura chinesa:
   Espiritismo em xieyi (ameixeira que brota da pedra e floresce sob a lua), Taoísmo em shanshui (montanha, pinheiro,
   cascata e o mirante no pico), Meditação em pintura chan (enso e bambu ao luar, em branco sobre o yin) e Budismo em baimiao
   (figueira-bodhi sobre o assento vazio), com o lótus em mogu (só cor, sem contorno). O templo é jiehua, o desenho
   de arquitetura: o que ainda não foi construído aparece só como esboço a carvão.
   Unidade: uma técnica (traço de pincel jdBr com o mesmo tremor de tinta, aguadas jdwash) e uma paleta (tinta, papel, ocre,
   índigo acinzentado, carmim e o vermelho do selo); no yang pinta-se com tinta, no yin com o branco reservado do papel.
   O jardim inteiro está sempre presente: o que ainda não cresceu aparece em esboço de tinta rala, e a prática o preenche.
   O qi (jdQi*) liga tudo num ciclo: a pérola desce o rio e cada lugar responde com o mesmo gesto de onda. */
/* uma paleta só, a da pintura de tinta com cor leve (qianjiang): tinta, papel, ocre, índigo acinzentado, carmim e o vermelho do selo.
   Regra do taiji: no yang (papel) pinta-se com tinta; no yin (tinta), com o branco reservado do papel. */
const INK = "#1d1915", PAPER = "#f1e6cf", PALE = "#efe5cf", SEAL = "#b0352a", GOLD = "#d9c497", QIAN = "#a3814f", DAI = "#5d7180", ROUGE = "#b8566a", JD_SEAL = { esp: "灵", med: "禅", tao: "道", bud: "佛" };
const jdR = (s, i) => { const x = Math.sin((s + 1) * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
const jf = v => (+v).toFixed(1);
const jdRad = d => d * Math.PI / 180;
const jdPol = (a, r, c = [500, 500]) => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
function jdIsDark(x, y) { if (Math.hypot(x - 500, y - 270) < 230) return false; if (Math.hypot(x - 500, y - 730) < 230) return true; return x > 500; }
function jdSpl(pts, n = 8) {
  if (pts.length < 3) { const [a, b] = pts; return Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); }
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts.at(-1)); return out;
}
/* traço de pincel: contorno preenchido com largura que varia (pressão no início, barriga em m, ponta afinando até b) */
function jdBr(pts, w, o = {}) {
  const P = jdSpl(pts, o.n || 8), L = P.length, a = o.a ?? .5, b = o.b ?? .05, m = o.m ?? .25, J = o.j ?? .08, sd = o.sd ?? pts.length, sm = x => x * x * (3 - 2 * x), lf = [], rt = [];
  for (let i = 0; i < L; i++) {
    const p = P[i], q0 = P[Math.max(0, i - 1)], q1 = P[Math.min(L - 1, i + 1)], dx = q1[0] - q0[0], dy = q1[1] - q0[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, t = i / (L - 1);
    const k = (t < m ? a + (1 - a) * sm(t / m) : 1 + (b - 1) * sm((t - m) / ((1 - m) || 1))) * (1 + J * (jdR(i, sd) - .5) * 2), h = Math.max(.12, w * k / 2);
    lf.push(`${jf(p[0] + nx * h)} ${jf(p[1] + ny * h)}`); rt.push(`${jf(p[0] - nx * h)} ${jf(p[1] - ny * h)}`);
  }
  return `M${lf.join("L")}L${rt.reverse().join("L")}Z`;
}
const jdF = (d, c, op = 1, x = "") => `<path d="${d}" fill="${c}" fill-opacity="${jf(op)}"${x}/>`;
const jdCurve = pts => "M" + jdSpl(pts, 6).map(p => `${jf(p[0])} ${jf(p[1])}`).join("L");
function jdBlade(x, y, ang, len, w, bend = .1, sd = 1) { const a = jdRad(ang), c = Math.cos(a), s = Math.sin(a); return jdBr([[x, y], [x + c * len * .5 - s * len * bend, y + s * len * .5 + c * len * bend], [x + c * len, y + s * len]], w, { a: .1, m: .34, b: 0, n: 6, j: .04, sd }); }
/* pontos de musgo (taidian): manchinhas horizontais em cachos, a assinatura da pintura de paisagem */
const jdMoss = (x, y, n, sp, c = INK, op = .85) => Array.from({ length: n }, (_, i) => `<ellipse cx="${jf(x + (jdR(i, x) - .5) * sp * 2)}" cy="${jf(y + (jdR(i, y) - .5) * sp * .7)}" rx="${jf(1.6 + jdR(i, 3) * 1.8)}" ry="${jf(1 + jdR(i, 4) * .8)}" fill="${c}" fill-opacity="${op}" transform="rotate(${jf((jdR(i, 5) - .5) * 40)} ${jf(x + (jdR(i, x) - .5) * sp * 2)} ${jf(y + (jdR(i, y) - .5) * sp * .7)})"/>`).join("");
function jdSPts(off = 0, n = 48) { const out = []; for (let i = 0; i <= n; i++) out.push(jdPol(-Math.PI / 2 + Math.PI * i / n, 230 + off, [500, 270])); for (let i = 1; i <= n; i++) out.push(jdPol(-Math.PI / 2 - Math.PI * i / n, 230 - off, [500, 730])); return out; }
const JD_RIVER = "M500 40A230 230 0 0 1 500 500A230 230 0 0 0 500 960";
/* selo vermelho: o caractere (fonte de pincel, se carregou) ou o símbolo desenhado */
const JD_SYM = { esp: `<path d="M0 6c-5-3-4-8 0-12c4 4 5 9 0 12Z" fill="${PAPER}"/>`, med: `<path d="M-5.5 2a6 6 0 1 1 9 2" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round"/>`,
  tao: `<circle r="6" fill="none" stroke="${PAPER}" stroke-width="1.4"/><path d="M0-6a3 3 0 0 1 0 6a3 3 0 0 0 0 6a6 6 0 0 1 0-12Z" fill="${PAPER}"/>`,
  bud: `<circle r="5.5" fill="none" stroke="${PAPER}" stroke-width="1.4"/>${[0, 45, 90, 135].map(a => `<line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="${PAPER}" stroke-width="1.1" transform="rotate(${a})"/>`).join("")}<circle r="1.6" fill="${PAPER}"/>` };
const jdSeal = (x, y, pid, s = 1) => `<g transform="translate(${jf(x)} ${jf(y)}) scale(${s})" class="jd-seal"><rect x="-10" y="-10" width="20" height="20" rx="2.5" fill="${SEAL}" filter="url(#jdink)"/><g class="jd-seal-s">${JD_SYM[pid]}</g><text class="jd-seal-c" y="6.5" text-anchor="middle">${JD_SEAL[pid]}</text></g>`;
/* inscrição (tikuan): título, poucas linhas e o selo, como numa pintura de rolo */
function jdInsc(x, y, pid, light, an = "start") {
  const I = JD_ARV[pid].insc, col = light ? PALE : INK, sx = an === "end" ? x + 16 : x - 16;
  return `<g class="jd-insc" fill="${col}"><text x="${x}" y="${y}" text-anchor="${an}" class="jd-it">${esc(J_PIL[pid].nome.toUpperCase())}</text>${I.l.map((l, i) => `<text x="${x}" y="${y + 18 + i * 15}" text-anchor="${an}" class="jd-il">${esc(l)}</text>`).join("")}<text x="${x}" y="${y + 22 + I.l.length * 15}" text-anchor="${an}" class="jd-is">— ${esc(I.f)}</text>${jdSeal(sx, y - 5, pid, .85)}</g>`;
}
const jdHit = (k, label, tip, body, extra = "") => `<g class="jd-hot${JD.sel === k ? " on" : ""}${extra}" data-act="jdsel" data-k="${k}" role="button" tabindex="0" aria-label="${esc(label)}" data-tip="${esc(tip)}">${body}</g>`;

/* ---------------------------------------------------------------- norte: Espiritismo (ameixeira sobre a pedra, sob a lua) */
const JD_PLUM = [[[[452, 290], [440, 256], [426, 226], [416, 198], [416, 172]], 19, 3], [[[416, 174], [440, 160], [466, 151]], 6.4, 3], [[[466, 151], [490, 135], [514, 128]], 4.4, 3],
  [[[416, 188], [398, 172], [386, 151], [380, 127]], 5.8, 3], [[[380, 127], [384, 105], [378, 87]], 3, 4], [[[432, 228], [408, 232], [384, 228], [362, 216]], 5.2, 4], [[[490, 135], [498, 115], [494, 97]], 2.6, 4],
  [[[384, 228], [372, 244], [360, 251]], 2.6, 5], [[[386, 151], [364, 147], [348, 137]], 2.6, 5], [[[440, 160], [448, 140], [444, 122]], 2.4, 5]];
const JD_PLUM_FL = [[466, 151, 3], [488, 136, 3], [512, 129, 3], [398, 172, 3], [386, 152, 3], [381, 129, 3], [442, 160, 3], [416, 174, 3], [384, 106, 4], [378, 89, 4], [498, 115, 4], [494, 98, 4], [408, 232, 4], [384, 228, 4], [362, 217, 4], [428, 214, 4],
  [360, 251, 5], [372, 244, 5], [364, 147, 5], [348, 137, 5], [448, 140, 5], [444, 122, 5], [516, 142, 5], [406, 196, 5]];
const jdBranch = (pts, w, ink, op, sd) => jdF(jdBr(pts, w * 1.25, { a: .95, m: .08, b: .35, sd, j: .14 }), ink, op * .32) + jdF(jdBr(pts.map(([x, y]) => [x + .6, y + .4]), w * .62, { a: .9, m: .1, b: .25, sd: sd + 1, j: .1 }), ink, op * .95);
function jdBloss(x, y, r, i) {
  const rot = jdR(i, 3) * 72; let g = "";
  for (let k = 0; k < 5; k++) { const a = jdRad(rot + k * 72); g += `<circle cx="${jf(x + Math.cos(a) * r * .6)}" cy="${jf(y + Math.sin(a) * r * .6)}" r="${jf(r * .52)}" fill="${ROUGE}" fill-opacity=".42" stroke="${ROUGE}" stroke-opacity=".8" stroke-width=".7"/>`; }
  return g + [0, 1, 2, 3].map(k => { const a = jdRad(rot + k * 90 + 20); return `<line x1="${jf(x)}" y1="${jf(y)}" x2="${jf(x + Math.cos(a) * r * .62)}" y2="${jf(y + Math.sin(a) * r * .62)}" stroke="${INK}" stroke-width=".5" stroke-opacity=".7"/>`; }).join("") + `<circle cx="${jf(x)}" cy="${jf(y)}" r="${jf(r * .2)}" fill="${QIAN}"/>`;
}
function jdMoonSVG() {
  const f = jdMoonF(), ill = (1 - Math.cos(2 * Math.PI * f)) / 2, x = 404, y = 126, r = 40, side = f < .5 ? 0 : 1, tsw = ill < .5 ? side : 1 - side, nome = f < .03 || f > .97 ? "nova" : f < .22 ? "crescente" : f < .28 ? "quarto crescente" : f < .47 ? "gibosa crescente" : f < .53 ? "cheia" : f < .72 ? "gibosa minguante" : f < .78 ? "quarto minguante" : "minguante";
  const unlit = ill > .97 ? "" : `<path d="M${x} ${y - r}A${r} ${r} 0 0 ${side} ${x} ${y + r}A${jf(Math.max(.1, Math.abs(1 - 2 * ill) * r))} ${r} 0 0 ${tsw} ${x} ${y - r}Z" class="jd-unlit"/>`;
  return `<g class="jd-moon" data-tip="Lua de hoje: ${nome} (${Math.round(ill * 100)}% iluminada)"><circle cx="${x}" cy="${y}" r="${r + 52}" fill="url(#jdhalo)" pointer-events="none"/><circle cx="${x}" cy="${y}" r="${r}" class="jd-moondisc"/>${unlit}</g>`;
}
function jdPlum(T, fx) {
  const s = T.s, ink = T.dorm ? "#857e72" : INK, op = T.dorm ? .6 : .8 + .18 * T.v; let g = "", br = "";
  if (s === 0) g += `<ellipse cx="470" cy="214" rx="4" ry="5.5" fill="${ink}" class="jd-seed"/>`;
  else if (s <= 2) { br += jdBranch(s === 1 ? [[466, 232], [454, 198], [448, 176]] : [[468, 234], [448, 198], [438, 168]], s === 1 ? 4 : 6, ink, op, 3); if (s === 2) br += jdBranch([[448, 198], [470, 182], [490, 178]], 3, ink, op, 5);
    g += (s === 1 ? [[448, 175]] : [[438, 167], [490, 177], [460, 190]]).map(([x, y], i) => T.dorm ? `<circle cx="${x}" cy="${y}" r="2.2" fill="${ink}"/>` : `<g class="jd-blos">${jdBloss(x, y, 6, i)}</g>`).join(""); }
  else { for (const [pts, w, ms] of JD_PLUM) if (s >= ms) br += jdBranch(pts, w, ink, op, pts[0][0]);
    br += [[440, 238], [424, 210], [420, 188]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.6" fill="${ink}"/>`).join("");
    const fl = JD_PLUM_FL.filter(f => s >= f[2]), n = T.dorm ? 0 : Math.round(fl.length * (.3 + .7 * T.v));
    g += fl.slice(0, n).map(([x, y], i) => `<g class="jd-blos" style="animation-delay:${(i * .1).toFixed(2)}s">${jdBloss(x, y, 6.2, i)}</g>`).join("") + fl.slice(n).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${ink}" fill-opacity=".9"/><circle cx="${x + .6}" cy="${y - .6}" r=".9" fill="${ROUGE}"/>`).join("");
    g += [[470, 162], [496, 145], [394, 162], [385, 140], [414, 242], [366, 226], [508, 137], [446, 169]].slice(0, Math.min(8, T.frutos)).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" class="jd-fruit" fill="${QIAN}"/>`).join("");
    if (s === 5 && !T.dorm) g += [[430, 180], [470, 165], [380, 200], [505, 160], [350, 160]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${ROUGE}" fill-opacity=".7" class="jd-petal" style="animation-delay:${i * 1.3}s"/>`).join(""); }
  const pl = jdOrchids(T.plantas, [[434, 336], [566, 340], [418, 332], [586, 336], [452, 342]]);
  return `<rect x="340" y="80" width="190" height="200" fill="transparent"/><g filter="url(#jdink)">${br}</g>${g}${pl}${fx ? jdDrops(440, 190) : ""}`;
}
const jdTone = (x, y) => jdIsDark(x, y) ? PALE : INK;
/* o jardim inteiro já está pintado em esboço: a forma adulta de cada árvore aparece em tinta rala, e a prática a preenche */
const JD_SK = { s: 5, dorm: true, sk: true, v: 1, g: 55, frutos: 0, plantas: 0 };
const jdSketch = (T, fn, dark) => T.s >= 5 ? "" : `<g class="jd-sketch" filter="url(#jdsketch)" opacity="${dark ? .34 : .3}" pointer-events="none">${fn(JD_SK, false).replace(/<rect [^>]*fill="transparent"\/>/g, "")}</g>`;
const jdOrchids = (n, P) => P.slice(0, Math.min(5, n)).map(([x, y], i) => `<g>${[[-128, 26, .22], [-96, 30, .12], [-64, 22, -.2], [-150, 16, .3]].map(([a, l, b], k) => jdF(jdBlade(x, y, a, l, 2.6, b, i * 7 + k), jdTone(x, y), .8)).join("")}</g>`).join("");
const jdDrops = (x, y) => `<g class="jd-drops">${[-12, 0, 12].map((d, i) => `<ellipse cx="${x + d}" cy="${y}" rx="2.3" ry="3.8" style="animation-delay:${i * .18}s"/>`).join("")}</g>`;
function jdRock(nh) {
  const c = [500, 272], P = [[-42, 52], [-52, 30], [-46, 4], [-56, -22], [-44, -48], [-22, -62], [-4, -52], [14, -66], [36, -56], [46, -32], [38, -8], [54, 18], [44, 44], [28, 60], [0, 64], [-22, 62]].map(([x, y]) => [c[0] + x, c[1] + y]);
  const d = jdCurve([...P, P[0], P[1]]) + "Z", H = [[-18, -30, 8, 12], [16, -8, 7, 10], [-24, 24, 6, 9], [22, 32, 8, 6], [-2, -44, 5, 7], [30, -36, 5, 6]];
  let g = `<ellipse cx="500" cy="336" rx="78" ry="9" fill="${INK}" fill-opacity=".16" filter="url(#jdwash)"/><path d="${d}" fill="url(#jdrock)" filter="url(#jdink)"/><path d="${d}" fill="${INK}" fill-opacity=".18" filter="url(#jdwash)"/>`;
  g += [[[-30, -40], [-20, -10], [-27, 20]], [[10, -46], [22, -20], [16, 10]], [[28, -30], [40, 0], [30, 34]], [[-36, 10], [-20, 30], [-4, 48]], [[-6, -20], [2, 6], [-8, 30]]].map((p, i) => jdF(jdBr(p.map(([x, y]) => [c[0] + x, c[1] + y]), 3, { a: .3, m: .4, b: .1, sd: i + 3 }), PAPER, .2)).join("");
  g += jdF(jdBr(P.slice(0, 8), 4.2, { a: .6, m: .2, b: .3, sd: 5 }), INK, .95) + jdF(jdBr(P.slice(8, 15), 3.4, { a: .5, m: .3, b: .4, sd: 9 }), INK, .9);
  g += H.map(([x, y, rx, ry], i) => i < nh ? `<g class="jd-hole"><ellipse cx="${c[0] + x}" cy="${c[1] + y}" rx="${rx * .85}" ry="${ry * .85}" fill="url(#jdholeg)"/><path d="M${c[0] + x - rx * .85} ${c[1] + y}a${rx * .85} ${ry * .85} 0 0 1 ${rx * 1.7} 0" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>` : i < 2 ? `<ellipse cx="${c[0] + x}" cy="${c[1] + y}" rx="${rx * .6}" ry="${ry * .6}" fill="${INK}" fill-opacity=".55"/>` : "").join("");
  return g + jdMoss(504, 212, 7, 22) + jdMoss(458, 228, 4, 10) + jdMoss(546, 262, 3, 8);
}

/* ---------------------------------------------------------------- oeste: Taoísmo (montanha, cascata, pinheiro, mirante) */
function jdPeak(P, fill, edge, sd) { const d = jdCurve(P) + "Z"; return `<path d="${d}" fill="${fill}" filter="url(#jdwash)"/>` + (edge ? jdF(jdBr(P.slice(Math.floor(P.length * .2), Math.ceil(P.length * .55)), edge, { a: .2, m: .6, b: .4, sd, j: .25 }), INK, .7) + jdF(jdBr(P.slice(Math.floor(P.length * .5)), edge * .55, { a: .6, m: .2, b: .2, sd: sd + 1, j: .2 }), INK, .5) : ""); }
function jdMountains() {
  let g = jdPeak([[236, 600], [252, 470], [270, 404], [292, 374], [318, 392], [338, 448], [356, 520], [364, 600]], "url(#jdfar)", 0, 1);
  g += jdPeak([[66, 610], [74, 540], [88, 472], [98, 414], [110, 366], [126, 326], [146, 304], [166, 302], [182, 318], [190, 352], [198, 396], [214, 446], [232, 506], [248, 610]], "url(#jdmtn)", 3.8, 31);
  g += jdPeak([[196, 612], [210, 540], [228, 488], [250, 458], [270, 462], [284, 492], [294, 540], [302, 612]], "url(#jdmtn2)", 2.6, 37);
  for (let i = 0; i < 16; i++) { const L = i < 9, t = (i % 9) / 9, x0 = L ? 136 - t * 46 + jdR(i, 1) * 8 : 172 + t * 40, y0 = L ? 318 + t * 170 : 330 + t * 150, dx = L ? -10 - jdR(i, 2) * 14 : 10 + jdR(i, 2) * 14, dy = 34 + jdR(i, 3) * 40;
    g += jdF(jdBr([[x0, y0], [x0 + dx * .4, y0 + dy * .5], [x0 + dx, y0 + dy]], 1.6, { a: .5, m: .3, b: .05, sd: i + 20 }), INK, .42); }
  for (let i = 0; i < 6; i++) { const x0 = 238 + i * 9, y0 = 470 + jdR(i, 4) * 14; g += jdF(jdBr([[x0, y0], [x0 + 4, y0 + 24], [x0 + 2, y0 + 50]], 1.3, { a: .5, m: .3, b: .05, sd: i + 50 }), INK, .38); }
  g += jdMoss(148, 306, 7, 16) + jdMoss(118, 382, 5, 12) + jdMoss(190, 360, 4, 10) + jdMoss(98, 452, 4, 10) + jdMoss(256, 462, 5, 10) + jdMoss(212, 440, 3, 8) + jdMoss(296, 380, 3, 9, INK, .5);
  g += `<path d="${jdCurve([[188, 392], [190, 440], [194, 492], [198, 546], [202, 596]])}" fill="none" stroke="${PAPER}" stroke-width="6.5" stroke-linecap="round" stroke-opacity=".97" class="jd-fall"/>` + jdF(jdBr([[183, 394], [184, 444], [188, 496], [192, 548]], 2, { a: .5, m: .3, b: .05, sd: 34 }), INK, .7) + jdF(jdBr([[194, 390], [196, 440], [200, 492], [204, 544]], 1.6, { a: .5, m: .3, b: .05, sd: 35 }), INK, .5) + jdMoss(186, 388, 3, 6) + [0, 1, 2].map(i => `<path d="M${190 + i * 2} ${430 + i * 40}v22" stroke="${INK}" stroke-opacity=".18" stroke-width=".8"/>`).join("");
  return g + `<g filter="url(#jdblur8)"><ellipse cx="170" cy="598" rx="130" ry="16" fill="${PAPER}" fill-opacity=".9"/><ellipse cx="190" cy="430" rx="60" ry="8" fill="${PAPER}" fill-opacity=".75"/><ellipse cx="204" cy="600" rx="40" ry="11" fill="${PAPER}" fill-opacity=".92"/><ellipse cx="296" cy="420" rx="40" ry="7" fill="${PAPER}" fill-opacity=".6"/></g>`;
}
const jdNeedles = (x, y, r, op, ink) => `<g stroke="${ink}" stroke-opacity="${jf(op)}" stroke-width=".95" stroke-linecap="round">${Array.from({ length: 9 }, (_, k) => { const a = Math.PI + (k + .5) / 9 * Math.PI; return `<line x1="${jf(x)}" y1="${jf(y)}" x2="${jf(x + Math.cos(a) * r)}" y2="${jf(y + Math.sin(a) * r * .8)}"/>`; }).join("")}</g>`;
function jdPad(x, y, w, op, ink) { const n = Math.max(2, Math.round(w / 9)); let g = `<ellipse cx="${x}" cy="${y + 2}" rx="${w / 2}" ry="${jf(w / 6.5)}" fill="${ink}" fill-opacity="${jf(.24 * op)}" filter="url(#jdwash)"/>`; for (let i = 0; i < n; i++) g += jdNeedles(x - w / 2 + (i + .5) * w / n, y + 1 - Math.sin((i + .5) / n * Math.PI) * w / 9, w / n * .85 + 4, op, ink); return g; }
const jdCrane = (x, y) => `<g class="jd-crane">${jdF(jdBr([[x - 4, y], [x - 16, y - 18], [x - 34, y - 26]], 7, { a: .8, m: .3, b: .1 }), PAPER, .95, ` stroke="${INK}" stroke-width=".7"`)}${jdF(jdBr([[x - 22, y - 22], [x - 30, y - 25], [x - 37, y - 27]], 4, { a: .9, m: .2, b: .05 }), INK, .9)}${jdF(jdBr([[x + 2, y], [x - 8, y - 12], [x - 20, y - 30]], 6, { a: .8, m: .3, b: .1 }), PAPER, .95, ` stroke="${INK}" stroke-width=".7"`)}<ellipse cx="${x}" cy="${y + 1}" rx="9" ry="3.6" fill="${PAPER}" stroke="${INK}" stroke-width=".8" transform="rotate(-8 ${x} ${y + 1})"/><path d="M${x + 8} ${y}l12 -5" stroke="${INK}" stroke-width="1.4"/><circle cx="${x + 20}" cy="${y - 5}" r="1.8" fill="${SEAL}"/><path d="M${x - 8} ${y + 2}l-14 3M${x - 8} ${y + 3}l-13 5" stroke="${INK}" stroke-width=".8"/></g>`;
function jdPine(T, fx) {
  const s = T.s, ink = T.dorm ? "#857e72" : INK, op = T.dorm ? .55 : .8 + .18 * T.v, nd = T.dorm ? .45 : .62 + .38 * T.v; let tr = "", g = "";
  g += `<path d="M236 628C240 606 256 598 276 600C290 604 294 618 290 632Z" fill="${INK}" fill-opacity=".62" filter="url(#jdwash)"/>` + jdMoss(264, 602, 4, 10);
  if (s === 0) g += `<ellipse cx="262" cy="596" rx="3.5" ry="5" fill="${ink}" class="jd-seed"/>`;
  else if (s <= 2) { tr += jdBranch(s === 1 ? [[262, 602], [260, 588], [262, 576]] : [[262, 602], [257, 582], [265, 564], [274, 550]], s === 1 ? 2.8 : 4.4, ink, op, 40); g += (s === 1 ? [[262, 574, 18]] : [[274, 546, 24], [256, 570, 16], [282, 562, 16]]).map(([x, y, w]) => jdPad(x, y, w, nd, ink)).join(""); }
  else {
    tr += jdBranch([[260, 604], [253, 584], [263, 564], [281, 548], [297, 530], [307, 508]], 11, ink, op, 41);
    tr += jdBranch([[284, 546], [308, 544], [332, 549], [352, 559]], 4.6, ink, op, 42) + jdBranch([[263, 574], [242, 568], [222, 570]], 3.6, ink, op, 43);
    if (s >= 4) tr += jdBranch([[307, 510], [314, 490], [310, 470]], 4, ink, op, 44) + jdBranch([[257, 592], [279, 595], [300, 603]], 3, ink, op, 45);
    tr += [[258, 590], [262, 570], [278, 552], [292, 536], [303, 516]].slice(0, s + 1).map(([x, y]) => `<path d="M${x - 4} ${y}a4 3 0 0 1 8 0" fill="none" stroke="${PAPER}" stroke-opacity=".6" stroke-width="1"/>`).join("");
    const pads = [[344, 549, 40, 3], [320, 540, 30, 3], [228, 561, 26, 3], [310, 463, 32, 4], [290, 485, 24, 4], [296, 597, 22, 4], [364, 564, 24, 5], [326, 450, 22, 5], [212, 576, 20, 5]];
    g += pads.filter(p => s >= p[3]).map(([x, y, w]) => jdPad(x, y, w, nd, ink)).join("");
    g += [[338, 556], [230, 568], [312, 470], [318, 548], [290, 492], [296, 604], [362, 570], [214, 582]].slice(0, Math.min(8, T.frutos)).map(([x, y]) => `<ellipse cx="${x}" cy="${y + 4}" rx="2.8" ry="3.8" class="jd-fruit" fill="${QIAN}"/>`).join("");
    if (s === 5 && !T.dorm) g += jdCrane(214, 372);
  }
  return `<rect x="200" y="440" width="180" height="195" fill="transparent"/>${tr}${g}${jdGrass(T.plantas, [[248, 610], [280, 612], [240, 618], [290, 618], [262, 622]])}${fx ? jdDrops(300, 480) : ""}`;
}
const jdGrass = (n, P) => P.slice(0, Math.min(5, n)).map(([x, y], i) => [[-110, 14, .2], [-80, 17, .05], [-60, 12, -.2]].map(([a, l, b], k) => jdF(jdBlade(x, y, a, l, 2, b, i * 5 + k), jdTone(x, y), jdIsDark(x, y) ? .7 : .85)).join("")).join("");

/* ---------------------------------------------------------------- leste: Meditação (enso e bambu ao luar, em branco sobre o yin) */
function jdEnso(p) { const c = [796, 546], r = 92, a0 = -62, n = Math.max(8, Math.round(54 * p)), pts = Array.from({ length: n + 1 }, (_, i) => jdPol(jdRad(a0 + 360 * p * i / n), r + (jdR(i, 7) - .5) * 3, c));
  const tail = pts.slice(Math.floor(n * .62)), streak = off => `M${tail.map(([x, y]) => { const dx = x - c[0], dy = y - c[1], k = (Math.hypot(dx, dy) + off) / Math.hypot(dx, dy); return `${jf(c[0] + dx * k)} ${jf(c[1] + dy * k)}`; }).join("L")}`;
  return `<g class="jd-enso"><g filter="url(#jdink)">${jdF(jdBr(pts, 17, { a: .95, m: .04, b: .22, n: 4, j: .1 }), PALE, .86)}</g>${[-4.5, -1.2, 2.4, 5].map((o, i) => `<path d="${streak(o)}" fill="none" stroke="#3b3631" stroke-opacity="${[.55, .4, .5, .35][i]}" stroke-width="${[1.1, .7, .9, .6][i]}" stroke-dasharray="${[70, 30, 50, 90][i]} ${[18, 26, 10, 30][i]}"/>`).join("")}</g>`; }
function jdBamboo(T, fx) {
  const s = T.s, col = T.dorm ? "#a8a193" : PALE, op = T.dorm ? .5 : .64 + .34 * T.v, base = 654, X = [792, 816, 770, 838, 750], HH = [184, 158, 136, 116, 98], k = s >= 3 ? 1 : s === 2 ? .6 : .36; let g = "";
  if (s === 0) g += `<ellipse cx="792" cy="650" rx="3.5" ry="5" fill="${col}" class="jd-seed"/>`;
  for (let i = 0; i < s; i++) {
    const x = X[i], h = HH[i] * k, seg = 25, back = i >= 2 ? .55 : 1, lean = (i % 2 ? .03 : -.02);
    for (let y = base; y > base - h + 6; y -= seg) { const y2 = Math.max(base - h, y - seg + 3);
      g += jdF(jdBr([[x + (base - y) * lean, y - 1.6], [x + (base - y2) * lean, y2 + 1]], 6.4 - i * .5, { a: .95, m: .05, b: .92, j: .02, n: 3, sd: y }), col, op * back) + `<path d="M${jf(x + (base - y2) * lean - 4.5)} ${jf(y2)}q4.5-2.6 9 0" stroke="${col}" stroke-opacity="${jf(op * back)}" fill="none" stroke-width="1.3"/>`; }
    const tx = x + h * lean, ty = base - h, L = (a, l, xx = tx, yy = ty, sd = 1) => jdF(jdBlade(xx, yy, a, l * 1.2, 7.4, .08, sd), col, op * back * .95);
    g += L(150 + i * 6, 32, tx, ty, i) + L(118, 26, tx, ty, i + 1) + L(40 - i * 4, 28, tx, ty, i + 2);
    if (s >= 3) g += L(160, 26, tx - h * lean * .4, ty + h * .35, i + 3) + L(132, 22, tx - h * lean * .4, ty + h * .35, i + 4) + L(24, 24, tx, ty + h * .55, i + 5) + L(58, 20, tx, ty + h * .55, i + 6);
  }
  g += [[774, 656], [822, 658], [800, 660], [746, 656], [846, 654], [760, 662], [834, 662], [788, 664]].slice(0, s ? Math.min(8, T.frutos) : 0).map(([x, y], i) => jdF(jdBr([[x, y], [x + 1, y - 6], [x, y - 12]], 5, { a: .95, m: .2, b: 0, n: 4, sd: i }), QIAN, .85)).join("");
  if (s === 5 && !T.dorm) g += `<g class="jd-bird"><ellipse cx="822" cy="${base - 128}" rx="7" ry="4.6" fill="${PALE}" fill-opacity=".9"/><circle cx="828" cy="${base - 132}" r="3" fill="${PALE}"/><path d="M831 ${base - 132}l4 1" stroke="${PALE}" stroke-width="1.2"/><path d="M816 ${base - 127}l-9 4" stroke="${PALE}" stroke-width="2"/></g>`;
  return `<rect x="730" y="440" width="140" height="230" fill="transparent"/>${g}${jdGrass(T.plantas, [[760, 658], [828, 660], [744, 662], [846, 660], [806, 664]])}${fx ? jdDrops(796, 480) : ""}`;
}

/* ---------------------------------------------------------------- sul: Budismo (figueira-bodhi em baimiao sobre o assento vazio) e o lótus */
function jdBLeaf(x, y, ang, s, op) { const t = `M0 ${-s}C${jf(s * .9)} ${jf(-s * 1.3)} ${jf(s * 1.3)} ${jf(-s * .1)} ${jf(s * .55)} ${jf(s * .55)}C${jf(s * .3)} ${jf(s * .8)} ${jf(s * .12)} ${jf(s * 1.05)} 0 ${jf(s * 2)}C${jf(-s * .12)} ${jf(s * 1.05)} ${jf(-s * .3)} ${jf(s * .8)} ${jf(-s * .55)} ${jf(s * .55)}C${jf(-s * 1.3)} ${jf(-s * .1)} ${jf(-s * .9)} ${jf(-s * 1.3)} 0 ${-s}Z`;
  return `<g transform="translate(${jf(x)} ${jf(y)}) rotate(${jf(ang)})"><path d="${t}" fill="${QIAN}" fill-opacity="${jf(.3 * op)}" stroke="${PALE}" stroke-opacity="${jf(.92 * op)}" stroke-width="1"/><path d="M0 ${-s * .8}V${jf(s * 1.6)}" stroke="${PALE}" stroke-opacity="${jf(.55 * op)}" stroke-width=".6"/></g>`; }
const JD_BODHI_L = Array.from({ length: 30 }, (_, i) => { const t = (i * .618) % 1, a = Math.PI * (-.05 + 1.1 * t), rr = .35 + ((i * .382) % 1) * .7; return [642 + Math.cos(a) * 112 * rr, 724 - Math.sin(a) * 84 * rr, (jdR(i, 63) - .5) * 50 - Math.cos(a) * 35, 8.5 + jdR(i, 64) * 2.5]; }).filter(([x, y]) => Math.hypot(x - 500, y - 730) > 76 && Math.hypot(x - 500, y - 500) < 440);
function jdBodhi(T, fx) {
  const s = T.s, op = T.dorm ? .5 : .62 + .38 * T.v, gd = T.dorm ? "#a8a193" : PALE; let g = "";
  const ln = (pts, w, o2 = {}) => jdF(jdBr(pts, w * 1.35, { a: .7, m: .2, b: .3, ...o2 }), gd, op);
  // o assento vazio fica ao pé do tronco, à frente dele: a figueira cresce por trás do lugar onde se senta
  const seat = `<g class="jd-seat" stroke="${gd}" stroke-opacity="${jf(op)}" fill="none" stroke-width="1.2"><ellipse cx="663" cy="894" rx="28" ry="7" fill="${INK}" fill-opacity=".55"/><path d="M635 894V905Q663 913 691 905V894"/>${[645, 654, 663, 672, 681].map(x => `<path d="M${x - 4} 909q4-7 8 0"/>`).join("")}${s === 5 && !T.dorm ? `<circle cx="663" cy="900" r="4"/><path d="M663 896v8M659 900h8"/>` : ""}</g>`;
  const halo = s === 5 && !T.dorm ? `<g class="jd-halo" fill="none" stroke="${PALE}">${[16, 24, 32].map((r, i) => `<circle cx="663" cy="868" r="${r}" stroke-opacity="${[.6, .38, .2][i]}" stroke-width="${1.2 - i * .3}"/>`).join("")}</g>` : "";
  if (s === 0) g += `<ellipse cx="662" cy="878" rx="3.5" ry="5" fill="${gd}" class="jd-seed"/>`;
  else if (s <= 2) { g += ln([[664, 884], [660, 862], [654, 842]], s === 1 ? 2.4 : 3.6); g += (s === 1 ? [[654, 840, -20, 6]] : [[654, 840, -20, 7], [646, 850, 30, 6.5], [668, 852, -40, 6.5], [658, 862, 50, 6]]).map(([x, y, a, z]) => jdBLeaf(x, y, a, z, op)).join(""); }
  else {
    const L = [[650, 886], [648, 842], [644, 802], [640, 772]], Rr = [[676, 886], [671, 844], [664, 806], [656, 774]];
    g += ln(L, 2.2, { a: .9, b: .6 }) + ln(Rr, 2, { a: .9, b: .6 }) + ln([[662, 878], [658, 846], [652, 814]], 1, { a: .5, b: .2 }) + ln([[640, 884], [628, 892]], 1.4) + ln([[684, 884], [698, 890]], 1.4);
    g += ln([[646, 774], [624, 744], [600, 726], [578, 716]], 2.6, { a: .9, m: .1, b: .2 }) + ln([[650, 772], [652, 732], [648, 700]], 2.2, { a: .9, m: .1, b: .2 }) + ln([[656, 782], [684, 758], [702, 746]], 2, { a: .9, m: .1, b: .2 });
    if (s >= 4) g += ln([[624, 744], [612, 714], [606, 694]], 1.6, { a: .9, b: .1 }) + ln([[684, 758], [700, 726], [702, 704]], 1.4, { a: .9, b: .1 });
    g += [[600, 727], [624, 745], [690, 752]].map(([x, y], i) => `<path d="M${x} ${y}q${(i - 1) * 3} 30 ${(i - 1) * 2} ${56 - i * 8}" stroke="${gd}" stroke-opacity="${jf(op * .55)}" fill="none" stroke-width=".8"/>`).join("");
    const nL = T.sk ? 28 : Math.round([0, 0, 0, 16, 22, 28][s] * (T.dorm ? .3 : .45 + .55 * T.v));
    g += JD_BODHI_L.slice(0, nL).map(([x, y, a, z]) => jdBLeaf(x, y, a, z, op)).join("");
    g += [[600, 712], [640, 690], [680, 716], [620, 700], [660, 676], [700, 730], [590, 740], [670, 700]].slice(0, Math.min(8, T.frutos)).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" class="jd-fruit" fill="${QIAN}"/>`).join("");
    if (T.dorm || T.v < .4) g += [[620, 820], [690, 840]].map(([x, y], i) => `<g class="jd-petal" style="animation-delay:${i * 2}s">${jdBLeaf(x, y, 20 + i * 40, 5.5, .7)}</g>`).join("");
  }
  return `<rect x="560" y="640" width="160" height="280" fill="transparent"/>${g}${halo}${seat}${jdGrass(T.plantas, [[626, 896], [700, 890], [614, 902], [708, 898], [622, 888]])}${fx ? jdDrops(640, 660) : ""}`;
}
function jdLotusPond() {
  const nl = jdLotus(), pads = [[472, 714, 15], [530, 750, 13], [488, 764, 11], [532, 704, 10], [456, 744, 9]], fl = [[476, 702], [526, 734], [500, 744], [540, 694], [458, 728], [512, 712], [486, 684]];
  let g = `<circle cx="500" cy="730" r="64" fill="${PAPER}" fill-opacity=".96" filter="url(#jdsoft)"/><circle cx="500" cy="730" r="60" fill="${DAI}" fill-opacity=".1"/>` + [44, 28].map((r, i) => `<ellipse cx="${506 - i * 6}" cy="${736 + i * 4}" rx="${r}" ry="${r * .42}" fill="none" stroke="${INK}" stroke-opacity=".14" stroke-width=".8" class="jd-rip"/>`).join("");
  g += pads.map(([x, y, r], i) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${jf(r * .62)}" fill="${INK}" fill-opacity=".42" filter="url(#jdwash)"/><ellipse cx="${x}" cy="${y}" rx="${jf(r * .45)}" ry="${jf(r * .28)}" fill="${INK}" fill-opacity=".3"/>${[0, 60, 120, 180, 240, 300].map(a => `<path d="M${x} ${y}l${jf(Math.cos(jdRad(a + i * 13)) * r * .9)} ${jf(Math.sin(jdRad(a + i * 13)) * r * .55)}" stroke="${PAPER}" stroke-opacity=".3" stroke-width=".6"/>`).join("")}</g>`).join("");
  g += fl.map(([x, y], i) => i < nl ? `<g class="jd-lotus" style="animation-delay:${i * .25}s">${[-46, -18, 18, 46, 0].map((a, k) => `<path d="M${x} ${y}c-4-4-5-11 0-16c5 5 4 12 0 16Z" transform="rotate(${a} ${x} ${y})" fill="${ROUGE}" fill-opacity="${k === 4 ? .35 : .6}" stroke="${ROUGE}" stroke-opacity=".75" stroke-width=".5"/>`).join("")}<circle cx="${x}" cy="${y - 4}" r="2" fill="${QIAN}"/></g>` : i < nl + 2 ? `<path d="M${x} ${y}c-3-3-4-9 0-13c4 4 3 10 0 13Z" fill="${ROUGE}" fill-opacity=".4"/>` : "").join("");
  return g;
}

/* ---------------------------------------------------------------- centro: o templo (jiehua) sobre a Bússola */
function jdTemploSVG() {
  const D = jdData().templo, fx = JD.fx?.k === "build" ? JD.fx.id : "", c = id => D[id] ? `jd-t-on${fx === id ? " jd-pop" : ""}` : "jd-ghost", lock = !jdCamOpen("escada"), n = JD_TEMPLO.filter(t => D[t.id]).length;
  let g = `<g class="${c("alicerce")}"><path d="M428 508V521A72 18 0 0 0 572 521V508" class="jd-stone"/><ellipse cx="500" cy="508" rx="72" ry="18" class="jd-stone"/>${[446, 470, 500, 530, 554].map(x => `<path d="M${x} ${x === 500 ? 526 : 523}v-6" class="jd-joint"/>`).join("")}</g>`;
  g += `<g class="${c("piso")}"><ellipse cx="500" cy="505" rx="55" ry="12" class="jd-floor"/></g>`;
  if (D.piso) g += `<g class="${jdChama() ? "jd-flame" : "jd-ember"}"><path d="M492 503h16l-2-8h-12Z" class="jd-altar"/><path d="M494 503v3M506 503v3" class="jd-joint"/>${jdChama() ? `<path d="M500 494c-6-8 6-12 0-20c-6-8 5-12 1-20" class="jd-smoke"/><circle cx="500" cy="494" r="1.8" class="jd-glow"/>` : ""}</g>`;
  [["esp", 458], ["med", 482], ["tao", 518], ["bud", 542]].forEach(([pid, x]) => { g += `<g class="${c("col_" + pid)}"><rect x="${x - 2.6}" y="450" width="5.2" height="${x === 482 || x === 518 ? 58 : 54}" class="jd-col"/><rect x="${x - 4}" y="446" width="8" height="5" class="jd-cap"/></g>`; });
  g += `<g class="${c("portal")}"><path d="M404 500V470M426 500V470" class="jd-post"/><path d="M398 468Q415 462 432 468M400 474H430" class="jd-lintel"/><path d="M396 466l-3-4M434 466l3-4" class="jd-lintel"/></g>`;
  g += `<g class="${c("telhado")}"><path d="M424 448C450 446 474 434 494 410H506C526 434 550 446 576 448C566 452 556 456 548 456Q500 462 452 456C444 456 434 452 424 448Z" class="jd-roof"/>${[452, 466, 480, 494, 506, 520, 534, 548].map(x => `<path d="M${x} ${452 + Math.abs(x - 500) * -.04}l${(x - 500) * .06} -${16 - Math.abs(x - 500) * .2}" class="jd-tile"/>`).join("")}<path d="M424 448q-8-4-8-12M576 448q8-4 8-12" class="jd-eave"/><path d="M500 410v-8" class="jd-eave"/><circle cx="500" cy="398" r="4.2" class="jd-finial"/></g>`;
  const vit = D.vitral ? J_ORDER.flatMap((pid, k) => J_PIL[pid].est.map((e, i) => `<path d="${jPetal(1.4, 7.4, 2.2)}" transform="translate(500 436) rotate(${(k * 5 + i) * 18})" style="fill:${QIAN};fill-opacity:${J_FILL[jEstV(pid, e.id)]};stroke:${INK};stroke-opacity:.6;stroke-width:.4"/>`)).join("") : "";
  g += `<g class="${c("vitral")}"><circle cx="500" cy="436" r="9" class="jd-glass"/>${vit}</g>`;
  g += `<g class="${c("sino")}"><path d="M584 437v14" class="jd-cord"/><path d="M578 462q0-11 6-11t6 11Z" class="jd-bell"/></g>`;
  return `<g class="jd-hot jd-templo${JD.sel === "templo" ? " on" : ""}${lock ? " jd-lockd" : ""}" data-act="jdsel" data-k="templo" role="button" tabindex="0" aria-label="Templo: ${n} de ${JD_TEMPLO.length} partes" data-tip="Templo · ${n} de ${JD_TEMPLO.length} partes"><g transform="translate(500 500) scale(1.22) translate(-500 -500)" filter="url(#jdink)"><path d="M392 528V396H600V528Z" fill="transparent"/>${g}</g></g>`;
}
function jdCompass() {
  const v = bmDayValue(), ang = { norte: -90, leste: 0, sul: 90, oeste: 180, centro: -90 }[v.ax], t = jdRad(ang);
  const rose = [0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a % 90 ? 14 : 24, q = jdRad(a - 90), e = (aa, rr) => `${jf(500 + Math.cos(aa) * rr)} ${jf(508 + Math.sin(aa) * rr * .3)}`; return `<path d="M500 508L${e(q - .2, 5)}L${e(q, r)}L${e(q + .2, 5)}Z" class="jd-rose${a % 90 ? " sm" : ""}"/>`; }).join("");
  return jdHit("praca", `Bússola, no centro do templo: valor do dia, ${v.nome}`, `Bússola · valor do dia: ${v.nome}`, `<g transform="translate(500 500) scale(1.22) translate(-500 -500)"><ellipse cx="500" cy="508" rx="34" ry="10.5" class="jd-mosaic"/>${rose}<path d="M500 508L${jf(500 + Math.cos(t) * 22)} ${jf(508 + Math.sin(t) * 6.6)}" class="jd-needle-l"/><circle cx="${jf(500 + Math.cos(t) * 22)}" cy="${jf(508 + Math.sin(t) * 6.6)}" r="2" fill="${SEAL}"/></g>`, " jd-plaza");
}

/* ---------------------------------------------------------------- a oficina do eremita, a ponte, o portão da lua e os caminhos */
function jdOficina(st) {
  const night = jdSky() === "noite", toras = Math.min(8, st.toras), tab = Math.min(10, Math.max(0, st.tabuas));
  let g = `<path d="M766 306L810 278L854 306Z" fill="${PALE}" fill-opacity=".2" filter="url(#jdwash)"/>` + jdF(jdBr([[762, 308], [786, 294], [810, 278], [834, 294], [858, 308]], 3.4, { a: .5, m: .5, b: .4 }), PALE, .85);
  g += Array.from({ length: 7 }, (_, i) => jdF(jdBr([[778 + i * 9, 300 - Math.abs(3 - i) * 2], [774 + i * 10, 306]], 1.2, { a: .8, m: .5, b: .2 }), PALE, .45)).join("");
  g += `<path d="M774 308V344M846 308V344" stroke="${PALE}" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/><path d="M766 344H854" stroke="${PALE}" stroke-opacity=".55" stroke-width="1.6"/><rect x="800" y="318" width="20" height="26" fill="${night ? "#f2c46d" : INK}" fill-opacity="${night ? .55 : .35}" stroke="${PALE}" stroke-opacity=".7" stroke-width="1"/>`;
  g += Array.from({ length: toras }, (_, i) => `<path d="M${858 + i * 3} 344L${868 + i * 3.6} ${292 + (i % 3) * 3}" stroke="${PALE}" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round"/>`).join("");
  if (tab) g += `<g class="jd-slips">${Array.from({ length: tab }, (_, i) => `<rect x="${742 + i * 4.6}" y="324" width="3.6" height="22" fill="${QIAN}" fill-opacity=".55" stroke="${PALE}" stroke-width=".5"/>`).join("")}<path d="M740 330H${746 + tab * 4.6}M740 340H${746 + tab * 4.6}" stroke="${SEAL}" stroke-width=".9"/></g>`;
  return jdHit("oficina", `Oficina do eremita: ${plural(st.toras, "tora", "toras")} e ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}`, `Oficina · ${plural(st.toras, "tora", "toras")} · ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}`, `<rect x="730" y="268" width="160" height="90" fill="transparent"/>${g}`, `${JD.fx?.k === "talho" ? " jd-hit" : ""} jd-shop`);
}
function jdPortao() {
  const cx = 214, cy = 222, r = 15, ring = Array.from({ length: 26 }, (_, i) => jdPol(jdRad(-96 + i * 14.6), r, [cx, cy]));
  /* muro caiado (o próprio papel), telhado a pincel e a abertura redonda deixando ver a sombra do outro lado */
  const g = jdF(jdBr([[168, 204], [168, 240]], 1.6, { a: .6, m: .3, b: .6, sd: 86 }), INK, .45) + jdF(jdBr([[260, 204], [260, 240]], 1.6, { a: .6, m: .3, b: .6, sd: 87 }), INK, .45) + jdF(jdBr([[162, 199], [214, 195], [266, 199]], 7, { a: .7, m: .3, b: .6, sd: 81 }), INK, .88)
    + jdF(jdBr([[164, 199], [156, 192]], 3, { a: .9, m: .3, b: .1, sd: 82 }), INK, .8) + jdF(jdBr([[264, 199], [272, 192]], 3, { a: .9, m: .3, b: .1, sd: 83 }), INK, .8)
    + `<circle cx="${cx}" cy="${cy}" r="${r - 1}" fill="${INK}" fill-opacity=".42" filter="url(#jdwash)"/>` + jdF(jdBr(ring, 3, { a: .8, m: .2, b: .45, sd: 84, j: .12 }), INK, .85)
    + jdF(jdBr([[166, 242], [214, 243], [264, 241]], 2.2, { a: .5, m: .4, b: .3, sd: 85 }), INK, .5) + jdMoss(176, 240, 3, 6) + jdMoss(252, 240, 3, 6);
  return jdHit("portao", "Portão da lua: como o jardim funciona", "Portão da lua · o portão do céu, no noroeste · como o jardim funciona", `<circle cx="214" cy="218" r="42" fill="transparent"/>${g}`, " jd-gate");
}
/* os oito trigramas na ordem do Rei Wen (norte ☵ água, nordeste ☶ montanha, leste ☳ trovão e madeira, sudeste ☴ vento,
   sul ☲ fogo e luz, sudoeste ☷ terra, oeste ☱ lago, noroeste ☰ céu, o "portão do céu") marcam o anel da mandala */
const JD_BAGUA = [[-90, [0, 1, 0], "☵ água"], [-45, [1, 0, 0], "☶ montanha"], [0, [0, 0, 1], "☳ trovão"], [45, [1, 1, 0], "☴ vento"], [90, [1, 0, 1], "☲ fogo"], [135, [0, 0, 0], "☷ terra"], [180, [0, 1, 1], "☱ lago"], [-135, [1, 1, 1], "☰ céu"]];
function jdBagua() {
  return JD_BAGUA.map(([deg, L]) => { const [x, y] = jdPol(jdRad(deg), 447), col = jdIsDark(x, y) ? PALE : INK;
    return `<g transform="translate(${jf(x)} ${jf(y)}) rotate(${deg + 90})" stroke="${col}" stroke-opacity=".62" stroke-width="2.4" stroke-linecap="round">${L.map((yang, k) => { const yy = (k - 1) * 4.8; return yang ? `<path d="M-8 ${yy}H8"/>` : `<path d="M-8 ${yy}H-2.2M2.2 ${yy}H8"/>`; }).join("")}</g>`; }).join("");
}
function jdCams() {
  let g = "";
  for (const c of JD_CAM) { const op = jdCamOpen(c.id), rd = !op && jdCamReady(c), [a, b] = c.prog(), cls = op ? "jd-cam" : rd ? "jd-cam jd-ready" : "jd-cam jd-off";
    let vis = c.id === "escada" && op ? "" : `<path d="${c.d}" class="jd-cambed${op ? "" : " off"}"/><path d="${c.d}" class="${cls}"/>`;
    if (c.id === "ponte") vis += op ? `<g class="jd-bridge"><path d="M708 306Q730 284 752 306" class="jd-arch"/><path d="M706 304H754" class="jd-deck"/>${[714, 722, 730, 738, 746].map(x => `<path d="M${x} ${304 - 7 + Math.abs(x - 730) * .25}v-7" class="jd-rail"/>`).join("")}<path d="M712 291Q730 280 748 291" class="jd-rail"/></g>` : `<path d="M708 306Q730 284 752 306" class="jd-arch jd-ruin"/>`;
    if (c.id === "escada" && op) vis += `<path d="${c.d}" class="jd-cam" style="stroke-dasharray:none;stroke-width:16;stroke-opacity:.5"/>` + jdSpl([[452, 340], [440, 384], [426, 424], [418, 456]], 6).filter((_, i) => i % 2 === 1).map(([x, y]) => `<path d="M${jf(x - 8)} ${jf(y)}h16" class="jd-step"/>`).join("");
    g += `<g class="jd-hot${JD.sel === "cam:" + c.id ? " on" : ""}${JD.fx?.k === "cam" && JD.fx.id === c.id ? " jd-open" : ""}" data-act="jdsel" data-k="cam:${c.id}" role="button" tabindex="0" aria-label="${esc(c.nome)}: ${op ? "aberto" : rd ? "pronto para abrir" : `fechado, ${Math.min(a, b)} de ${b}`}" data-tip="${esc(c.nome)} · ${op ? "aberto" : rd ? "pronto para abrir" : `${c.t} (${Math.min(a, b)} de ${b})`}"><path d="${c.d}" class="jd-hitw"/>${vis}</g>`; }
  return g;
}

/* ---------------------------------------------------------------- o qi: um ciclo de 24 s que liga os quatro pilares
   Uma pérola de luz desce o rio da nascente (Espiritismo, norte) ao mar (Budismo, sul), passando pela Meditação, pelo templo
   e pelo lado do Taoísmo; cada lugar responde quando ela passa, com o mesmo gesto de onda; depois a névoa sobe pelo anel do
   oeste e o ciclo recomeça. Tudo em SMIL (animate, animateMotion, animateTransform) num grupo sem transform próprio, que o
   Safari e o Chrome executam igual; com "reduzir movimento" o qi não é desenhado. */
const JD_QI = { dur: 24, rio: .62, esp: .02, med: .155, templo: .31, tao: .465, lago: .53, bud: .6 };
const jdQiOn = () => !(typeof jmReduced === "function" && jmReduced());
const jdKT = (t, w) => [Math.max(.001, t - w * .35), t, Math.min(.998, t + w)].map(v => v.toFixed(3));
const jdLoop = `dur="${JD_QI.dur}s" repeatCount="indefinite"`;
function jdQiRing(x, y, t, r0 = 10, r1 = 84) {
  if (!jdQiOn()) return ""; const [a, , b] = jdKT(t, .09), kt = `0;${a};${b};1`;
  return `<circle cx="${x}" cy="${y}" r="${r0}" fill="none" stroke="${jdTone(x, y)}" stroke-width="1.5" opacity="0"><animate attributeName="r" values="${r0};${r0};${r1};${r1}" keyTimes="${kt}" ${jdLoop}/><animate attributeName="opacity" values="0;.6;0;0" keyTimes="${kt}" ${jdLoop}/></circle>`;
}
function jdQiSway(x, y, t, deg) {
  if (!jdQiOn()) return ""; const [a, m, b] = jdKT(t, .1), r = v => `${v} ${x} ${y}`;
  return `<animateTransform attributeName="transform" type="rotate" values="${r(0)};${r(0)};${r(-deg)};${r(deg * .45)};${r(0)};${r(0)}" keyTimes="0;${a};${m};${((+m + +b) / 2).toFixed(3)};${b};1" ${jdLoop}/>`;
}
/* pétalas da ameixeira que caem quando o qi passa pela nascente */
const jdQiPetals = (T) => !jdQiOn() || T.s < 3 || T.dorm ? "" : [[466, 151, 0], [398, 172, .012], [488, 136, .024]].map(([x, y, d]) => { const [a, , b] = jdKT(JD_QI.esp + d, .16);
  return `<circle cx="${x}" cy="${y}" r="2.6" fill="${ROUGE}" fill-opacity=".75" opacity="0"><animateMotion path="M0 0C8 16 -6 30 6 48C12 58 4 70 10 82" keyPoints="0;0;1;1" keyTimes="0;${a};${b};1" calcMode="linear" ${jdLoop}/><animate attributeName="opacity" values="0;0;.9;0;0" keyTimes="0;${a};${((+a + +b) / 2).toFixed(3)};${b};1" ${jdLoop}/></circle>`; }).join("");
function jdQiPearl() {
  if (!jdQiOn()) return ""; const r = JD_QI.rio, mp = id => `<mpath href="#${id}" xlink:href="#${id}"/>`;
  return `<g class="jd-qi" pointer-events="none"><path id="jdqiring" d="M500 934A434 434 0 0 1 500 66" fill="none"/>
    <circle r="22" fill="url(#jdpearl)" opacity="0"><animateMotion keyPoints="0;1;1" keyTimes="0;${r};1" calcMode="linear" ${jdLoop}>${mp("jdriver")}</animateMotion><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.02;${(r - .02).toFixed(2)};${r};1" ${jdLoop}/></circle>
    <ellipse rx="46" ry="14" fill="${INK}" fill-opacity=".16" filter="url(#jdblur8)" opacity="0"><animateMotion keyPoints="0;0;1;1" keyTimes="0;${(r + .02).toFixed(2)};.97;1" calcMode="linear" rotate="auto" ${jdLoop}>${mp("jdqiring")}</animateMotion><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${(r + .02).toFixed(2)};${(r + .07).toFixed(2)};.92;.97;1" ${jdLoop}/></ellipse></g>`;
}
const jdQiWaves = () => jdQiOn() ? `<g class="jd-qiwave" pointer-events="none">${jdQiRing(440, 196, JD_QI.esp)}${jdQiRing(792, 560, JD_QI.med)}${jdQiRing(500, 500, JD_QI.templo, 14, 110)}${jdQiRing(268, 560, JD_QI.tao)}${jdQiRing(500, 730, JD_QI.lago, 8, 58)}${jdQiRing(640, 800, JD_QI.bud)}</g>` : "";

/* ---------------------------------------------------------------- composição */
function jdScene() {
  const sky = jdSky(), night = sky === "noite", R = jdRio(), T = Object.fromEntries(J_ORDER.map(p => [p, jdTree(p)])), D = jdData(), st = jdStock(), lav = D.pedras.filter(p => p.lav).length;
  const dark = [...Array.from({ length: 91 }, (_, i) => jdPol(jdRad(-90 + i * 2), 460)), ...jdSPts(0).reverse()].map(p => `${jf(p[0])} ${jf(p[1])}`).join("L");
  let g = `<defs>
    <clipPath id="jdclip"><circle cx="500" cy="500" r="460"/></clipPath>
    <filter id="jdink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.5"/></filter>
    <filter id="jdwash" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="12" result="d"/><feGaussianBlur in="d" stdDeviation="1.6" result="b"/><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="5" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.42 1.16" result="ga"/><feComposite in="b" in2="ga" operator="in"/></filter>
    <filter id="jddry" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".35 .35" numOctaves="2" seed="4" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="s"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="9" result="n2"/><feDisplacementMap in="s" in2="n2" scale="2.5"/></filter>
    <filter id="jddryv" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".08 .9" numOctaves="2" seed="6" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="s"/><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="2" result="n2"/><feDisplacementMap in="s" in2="n2" scale="2.4"/></filter>
    <filter id="jdsoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="jdsketch"><feColorMatrix type="saturate" values="0"/></filter>
    <radialGradient id="jdpearl" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="${PAPER}" stop-opacity=".95"/><stop offset=".7" stop-color="${INK}" stop-opacity=".28"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
    <filter id="jdblur8" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="jdblur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="jdgrain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .42  0 0 0 0 .33  0 0 0 0 .2  0 0 0 .1 0"/></filter>
    <filter id="jdfiber"><feTurbulence type="fractalNoise" baseFrequency=".012 .22" numOctaves="2" seed="11"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .07 -.01"/></filter>
    <radialGradient id="jdrock" cx="62%" cy="30%" r="80%"><stop offset="0" stop-color="#5a524a"/><stop offset=".55" stop-color="#2a251f"/><stop offset="1" stop-color="#14110e"/></radialGradient>
    <radialGradient id="jdholeg" cx="40%" cy="70%" r="70%"><stop offset="0" stop-color="${PAPER}" stop-opacity=".95"/><stop offset=".75" stop-color="#cfc2a6" stop-opacity=".9"/><stop offset="1" stop-color="#6d6152" stop-opacity=".9"/></radialGradient>
    <radialGradient id="jdage" cx="50%" cy="50%" r="50%"><stop offset=".7" stop-color="#8a6a3c" stop-opacity="0"/><stop offset="1" stop-color="#8a6a3c" stop-opacity=".22"/></radialGradient>
    <radialGradient id="jdhalo" cx="50%" cy="50%" r="50%"><stop offset=".42" stop-color="${INK}" stop-opacity="0"/><stop offset=".47" stop-color="${INK}" stop-opacity=".2"/><stop offset=".7" stop-color="${INK}" stop-opacity=".07"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
    <linearGradient id="jdmtn" gradientUnits="userSpaceOnUse" x1="0" y1="300" x2="0" y2="610"><stop offset="0" stop-color="${INK}" stop-opacity=".62"/><stop offset=".45" stop-color="#7a6542" stop-opacity=".34"/><stop offset="1" stop-color="#7a6542" stop-opacity="0"/></linearGradient>
    <linearGradient id="jdmtn2" gradientUnits="userSpaceOnUse" x1="0" y1="456" x2="0" y2="612"><stop offset="0" stop-color="${INK}" stop-opacity=".55"/><stop offset=".5" stop-color="#7a6542" stop-opacity=".28"/><stop offset="1" stop-color="#7a6542" stop-opacity="0"/></linearGradient>
    <linearGradient id="jdfar" gradientUnits="userSpaceOnUse" x1="0" y1="372" x2="0" y2="600"><stop offset="0" stop-color="#4c6276" stop-opacity=".38"/><stop offset="1" stop-color="#4c6276" stop-opacity="0"/></linearGradient>
    <radialGradient id="jdyinfade" cx="50%" cy="50%" r="50%"><stop offset=".72" stop-color="${PAPER}" stop-opacity="0"/><stop offset="1" stop-color="${PAPER}" stop-opacity=".38"/></radialGradient></defs>`;
  /* o leque: papel, fibras, borda envelhecida e moldura */
  g += `<circle cx="500" cy="500" r="472" class="jd-mount"/><circle cx="500" cy="500" r="460" fill="${PAPER}"/><g clip-path="url(#jdclip)"><rect width="1000" height="1000" filter="url(#jdgrain)"/><rect width="1000" height="1000" filter="url(#jdfiber)"/>`;
  /* yin: aguada de tinta, mais escura junto ao S, abrindo em névoa perto da borda */
  g += `<path d="M${dark}Z" fill="${INK}" fill-opacity=".74" filter="url(#jdwash)" class="jd-yin"/><g clip-path="url(#jdyinclip)"><path d="${JD_RIVER}" fill="none" stroke="${INK}" stroke-width="150" stroke-opacity=".3" filter="url(#jdblur)"/></g><clipPath id="jdyinclip"><path d="M${dark}Z"/></clipPath><circle cx="500" cy="500" r="460" fill="url(#jdyinfade)"/>`;
  /* o rio no S: papel reservado, linhas de água (shuiwen) correndo da fonte ao mar */
  const w = 16 + 18 * R.f, nlin = R.n ? 2 + Math.round(3 * R.f) : 1;
  g += jdHit("rio", `Rio: ${R.st}`, `Rio · ${R.st} · ${R.n} de 14 noites de exame`, `<path d="${JD_RIVER}" class="jd-hitw"/><path id="jdriver" d="${JD_RIVER}" fill="none" stroke="${PAPER}" stroke-width="${jf(w)}" stroke-opacity=".93" filter="url(#jdsoft)"/><path d="${JD_RIVER}" fill="none" stroke="${DAI}" stroke-width="${jf(w * .8)}" stroke-opacity=".1"/>
    ${Array.from({ length: nlin }, (_, i) => { const off = (i - (nlin - 1) / 2) * (w / (nlin + 1)), pts = jdSPts(off, 40); return `<path d="M${pts.map(p => `${jf(p[0])} ${jf(p[1])}`).join("L")}" class="jd-flow${R.n ? "" : " still"}" style="animation-duration:${jf(9 - 5 * R.f)}s;animation-delay:-${i * 1.7}s"/>`; }).join("")}
    ${jdF(jdBr(jdSPts(-w / 2 - 1, 40).filter((_, i) => i % 2 === 0), 1.6, { a: .3, m: .5, b: .3, j: .25, sd: 70 }), INK, .45)}`, " jd-rio");
  /* o anel do bagua, o caminho circular e os outros caminhos (pedras de passo) */
  g += `<g class="jd-bagua">${jdBagua()}</g>` + jdCams();
  /* norte: lua, ameixeira, pedra */
  g += jdMoonSVG();
  g += jdHit("arv:esp", `${JD_ARV.esp.nome} de Espiritismo: ${T.esp.nome}`, `${JD_ARV.esp.nome} · Espiritismo · ${T.esp.nome}${T.esp.dorm ? " (dormindo)" : ""}`, jdSketch(T.esp, jdPlum) + `<g>${jdPlum(T.esp, JD.fx?.k === "rega" && JD.fx.id === "esp")}${jdQiSway(452, 292, JD_QI.esp + .01, 1.1)}</g>` + jdQiPetals(T.esp) + jdInsc(554, 122, "esp", false), ` jd-tree${T.esp.dorm ? " jd-dorm" : ""}`);
  const brutas = D.pedras.filter(p => !p.lav), POS = [[590, 236], [614, 288], [586, 330], [640, 238], [556, 360]];
  g += jdHit("pedreira", `Pedreira, no olho do yang: ${plural(brutas.length, "pedra bruta", "pedras brutas")}`, `Pedreira · a pedra no olho do yang · ${plural(lav, "furo", "furos")} lavrados · ${plural(Math.max(0, st.pedras), "pedra", "pedras")} no estoque`, `<circle cx="500" cy="272" r="70" fill="transparent"/>${jdRock(Math.min(6, lav))}${Array.from({ length: Math.min(6, Math.max(0, st.pedras)) }, (_, i) => `<ellipse cx="${664 + (i % 2) * 1.5}" cy="${334 - i * 9}" rx="${16 - i * 2}" ry="${jf(5.6 - i * .4)}" class="jd-cairn"/>`).join("")}`, " jd-quarry");
  brutas.slice(0, 5).forEach((p, i) => { const [x, y] = POS[i], k = jdMarks(p).length, pts = Array.from({ length: 8 }, (_, j) => { const a = j / 8 * 6.283, r = 12 + jdR(j, p.id.length + i) * 6 - Math.min(3, k) * 1.4; return [x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * .8]; });
    g += jdHit("ped:" + p.id, `Pedra bruta: ${p.nome}, ${k} de 3 golpes`, `${p.nome} · ${Math.min(k, 3)} de 3 golpes`, `<path d="${jdCurve([...pts, pts[0], pts[1]])}Z" fill="${INK}" fill-opacity=".62" filter="url(#jdwash)"/>${jdF(jdBr(pts.slice(0, 5), 2.2, { a: .5, m: .3, b: .3, sd: i }), INK, .9)}${jdMoss(x, y - 9, 2, 6)}${k >= 3 ? `<circle cx="${x}" cy="${y}" r="20" class="jd-ready-ring"/>` : ""}${JD.lbl ? `<text x="${x}" y="${y + 24}" text-anchor="middle" class="jd-plabel">${esc(trunc(p.nome, 16))}</text>` : ""}`, `${JD.fx?.id === p.id ? " jd-hit" : ""} jd-raw`); });
  /* oeste: montanha, pinheiro, mirante */
  g += jdMountains();
  g += jdHit("mirante", "Mirante, no pico", "Mirante · a mandala e a bússola vistas do alto", `<rect x="150" y="280" width="60" height="44" fill="transparent"/><g transform="translate(178 300)"><path d="M-12 0q12-7 24 0" class="jd-eave"/><path d="M-13 0q-3-1-4-4M13 0q3-1 4-4" class="jd-eave"/><path d="M0-6v-4" class="jd-cord"/><path d="M-7 0v9M7 0v9" class="jd-cord"/><path d="M-10 9h20" class="jd-cord"/></g>`, " jd-mir");
  g += jdHit("arv:tao", `${JD_ARV.tao.nome} de Taoísmo: ${T.tao.nome}`, `${JD_ARV.tao.nome} · Taoísmo · ${T.tao.nome}${T.tao.dorm ? " (dormindo)" : ""}`, jdSketch(T.tao, jdPine) + `<g>${jdPine(T.tao, JD.fx?.k === "rega" && JD.fx.id === "tao")}${jdQiSway(262, 604, JD_QI.tao, 1.6)}</g>` + jdInsc(122, 684, "tao", false), ` jd-tree${T.tao.dorm ? " jd-dorm" : ""}`);
  /* leste: enso, bambu e a oficina */
  g += jdHit("arv:med", `${JD_ARV.med.nome} de Meditação: ${T.med.nome}`, `${JD_ARV.med.nome} · Meditação · ${T.med.nome}${T.med.dorm ? " (dormindo)" : ""}`, `<g opacity=".22" pointer-events="none">${jdEnso(1)}</g>` + jdEnso(.45 + .5 * Math.min(1, T.med.g / 55)) + jdSketch(T.med, jdBamboo, true) + `<g class="jd-qsway-med">${jdBamboo(T.med, JD.fx?.k === "rega" && JD.fx.id === "med")}${jdQiSway(792, 654, JD_QI.med, 2.4)}</g>` + jdInsc(896, 380, "med", true, "end"), ` jd-tree${T.med.dorm ? " jd-dorm" : ""}`);
  g += jdOficina(st);
  /* sul: lago de lótus (olho do yin), figueira-bodhi e o assento vazio */
  const nl = jdLotus();
  g += jdHit("lago", `Lago de lótus, no olho do yin: ${nl} de 7 flores`, `Lago de lótus · olho do yin · ${nl} de 7 flores esta semana`, jdLotusPond(), " jd-lago");
  g += jdHit("arv:bud", `${JD_ARV.bud.nome} de Budismo: ${T.bud.nome}`, `${JD_ARV.bud.nome} · Budismo · ${T.bud.nome}${T.bud.dorm ? " (dormindo)" : ""}`, jdSketch(T.bud, jdBodhi, true) + `<g>${jdBodhi(T.bud, JD.fx?.k === "rega" && JD.fx.id === "bud")}${jdQiSway(662, 886, JD_QI.bud, 1.2)}</g>` + jdInsc(386, 596, "bud", true), ` jd-tree${T.bud.dorm ? " jd-dorm" : ""}`);
  /* centro: templo e bússola */
  g += jdTemploSVG() + jdCompass();
  g += jdPortao();
  /* selo do jardim */
  g += `<g class="jd-seal jd-gseal" transform="translate(312 902)"><rect x="-11" y="-21" width="22" height="42" rx="2.5" fill="${SEAL}" filter="url(#jdink)"/><g class="jd-seal-s"><circle cy="-9" r="5.5" fill="none" stroke="${PAPER}" stroke-width="1.4"/><path d="M-5 6h10M0 1v10" stroke="${PAPER}" stroke-width="1.6"/></g><text class="jd-seal-c" y="-3" text-anchor="middle">心</text><text class="jd-seal-c" y="16" text-anchor="middle">园</text></g>`;
  /* nomes dos lugares (opcional) */
  if (JD.lbl) g += [[500, 350, "Pedreira"], [810, 372, "Oficina"], [500, 548, "Templo · Bússola"], [150, 290, "Mirante"], [500, 815, "Lago de lótus"], [228, 238, "Portão da lua"], [660, 172, "Rio"]].map(([x, y, t]) => `<text x="${x}" y="${y}" text-anchor="middle" class="jd-plabel">${t}</text>`).join("");
  /* o qi que percorre o jardim */
  g += jdQiWaves() + jdQiPearl();
  /* névoa sobre o que ainda está fechado */
  const FOG = { margem: [[500, 730, 82, 74], [262, 776, 54, 34]], ponte: [[806, 318, 84, 56], [560, 282, 120, 92]], escada: [[500, 462, 96, 74]], mirante: [[150, 342, 70, 52]] };
  for (const [cam, es] of Object.entries(FOG)) if (!jdCamOpen(cam)) g += `<g class="jd-fogg"><g filter="url(#jdblur)">${es.map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="jd-fog" style="animation-delay:${i * 1.3}s"/>`).join("")}</g></g>`;
  /* noite, entardecer, vagalumes ou borboletas (as noites de exame da semana) */
  if (night) g += `<rect width="1000" height="1000" class="jd-nightveil"/>` + jdMoonSVG();
  if (sky === "entardecer") g += `<rect width="1000" height="1000" class="jd-duskveil"/>`;
  g += Array.from({ length: jdVaga() }, (_, i) => { const a = jdR(i, 11) * 6.283, r = 140 + jdR(i, 12) * 220, x = 500 + Math.cos(a) * r, y = 500 + Math.sin(a) * r; return night || sky === "entardecer" ? `<circle cx="${jf(x)}" cy="${jf(y)}" r="2.8" class="jd-fly" style="animation-delay:${(i * .7).toFixed(1)}s"/>` : `<g class="jd-bfly" style="animation-delay:${(i * .9).toFixed(1)}s"><path d="M${jf(x)} ${jf(y)}c-4-7-12-6-9 1c-5 2-2 7 3 4l6-5c-2 6 3 9 6 4c4 1 6-4 1-5c4-6-3-9-7-4Z" fill="${jdIsDark(x, y) ? PALE : INK}" fill-opacity=".22" stroke="${jdIsDark(x, y) ? PALE : INK}" stroke-opacity=".8" stroke-width=".8" transform="scale(.8)" transform-origin="${jf(x)} ${jf(y)}"/></g>`; }).join("");
  g += `<circle cx="500" cy="500" r="460" fill="url(#jdage)" pointer-events="none"/></g><circle cx="500" cy="500" r="460" fill="none" stroke="${INK}" stroke-width="1.6" stroke-opacity=".7" pointer-events="none"/>`;
  return `<div class="jdscene">${svgWrap(1000, 1000, g, `Jardim interior em yin-yang: ${J_ORDER.map(p => `${JD_ARV[p].nome} (${J_PIL[p].nome}) ${T[p].nome}`).join(", ")}; rio ${R.st}; templo com ${JD_TEMPLO.filter(t => D.templo[t.id]).length} de ${JD_TEMPLO.length} partes`, "chart jdsvg sky-" + sky)}</div>`;
}

/* ---------------------------------------------------------------- painéis */
function jdAsks() {
  const out = [], D = jdData(), st = jdStock();
  for (const c of JD_CAM) if (!jdCamOpen(c.id) && jdCamReady(c)) out.push([100, `Abrir: ${c.nome}`, `leva até ${c.area}`, "cam:" + c.id]);
  for (const t of JD_TEMPLO) if (!D.templo[t.id] && jdCamOpen("escada") && jdCan(t).ok) { out.push([90, `Construir: ${t.nome}`, t.sim, "templo"]); break; }
  for (const p of D.pedras) if (!p.lav && jdMarks(p).length >= 3) out.push([85, `Lavrar a pedra: ${p.nome}`, "três golpes já foram dados", "ped:" + p.id]);
  if (!bmEx()[TODAY]) out.push([jdHour() >= 18 ? 75 : 55, "Fazer o exame da noite", `rio ${jdRio().st}: ${jdRio().n} de 14 noites; cada exame o faz correr`, "rio"]);
  const T = J_ORDER.map(jdTree).sort((a, b) => a.v - b.v)[0];
  if (T.v < 1) out.push([60 + (1 - T.v) * 10, `Regar ${JD_ARV[T.pid].art} ${JD_ARV[T.pid].nome}`, T.dorm ? `dorme: nenhum dia com ${J_PIL[T.pid].nome} em 2 semanas` : `${plural(T.dias, "dia", "dias")} com ${J_PIL[T.pid].nome} em 2 semanas`, "arv:" + T.pid]);
  if (jdCamOpen("ponte") && st.toras >= 3) out.push([50, "Talhar uma tábua", `${plural(st.toras, "tora", "toras")} esperando na oficina`, "oficina"]);
  const semMarca = D.pedras.find(p => !p.lav && !(p.marcas || []).some(m => m.data === TODAY) && jdMarks(p).length < 3);
  if (jdCamOpen("ponte") && semMarca) out.push([45, `Observar: ${semMarca.nome}`, "quando apareceu hoje, e o que você fez?", "ped:" + semMarca.id]);
  if (jdCamOpen("ponte") && !D.pedras.length) out.push([40, "Extrair a primeira pedra", "nomeie uma inclinação para trabalhar", "pedreira"]);
  return out.sort((a, b) => b[0] - a[0]).slice(0, 3);
}
const jdEns = ([q, src]) => `<blockquote class="jquote sm">${esc(q)}<cite>${esc(src)}</cite></blockquote>`;
const jdBack = () => `<button type="button" class="btn sm ghost" data-act="jdsel" data-k="portao">${ic("back")}Voltar ao portão</button>`;
function jdLockPanel(c, oque) {
  const [a, b] = c.prog(), rd = a >= b;
  return `<h3>${ic("lock")}${esc(oque)}</h3><p>Para chegar até ${esc(c.area)}, abra a <b>${esc(c.nome)}</b>.</p><p class="muted">Pede: ${esc(c.t)}. Agora: <b>${Math.min(a, b)} de ${b}</b>.</p><div class="jdbar"><i style="width:${Math.round(100 * Math.min(1, a / b))}%"></i></div>
    ${rd ? `<button type="button" class="btn primary" data-act="jdcam" data-id="${c.id}">${ic("unlock")}Abrir o caminho</button>` : ""}${jdBack()}`;
}
function jdAside() {
  const k = JD.sel || "portao", [area, id] = k.split(":"), D = jdData(), st = jdStock(), lk = jdLocked(k);
  if (lk && area !== "cam") return jdLockPanel(lk, { rio: "O rio", lago: "O lago de lótus", pedreira: "A pedreira", oficina: "A oficina", ped: "A pedreira", templo: "O templo", mirante: "O mirante" }[area]);
  if (area === "arv") {
    const T = jdTree(id), A = JD_ARV[id], P = J_PIL[id], q = jQuestion(id);
    return `<h3 style="color:${P.cor}">${ic(P.ico)}${esc(A.nome)} · ${esc(P.nome)}</h3><p class="muted">${esc(A.sim)}</p><p class="small jdsimb">${ic("palette")}<span>Pintada em ${esc(A.estilo)}: ${esc(A.cena)}.</span></p>
      <div class="jdstat"><b>${T.nome}</b>${T.prox ? `<span>faltam ${T.falta} pontos para ${T.prox}</span>` : "<span>estágio máximo</span>"}</div><div class="jdbar" style="--c:${P.cor}"><i style="width:${Math.round(100 * T.pr)}%"></i></div>
      <table class="dt jdtab"><tbody>${T.parts.map(([l, v, mx]) => `<tr><td>${esc(l)}</td><td class="num">${v} / ${mx}</td></tr>`).join("")}<tr><th>crescimento</th><th class="num">${T.g}</th></tr></tbody></table>
      <p class="small">${T.dorm ? `${ic("moon")}<b>Dormindo:</b> nenhum dia com ${esc(P.nome)} nas últimas 2 semanas. Ela não morre; acorda com o primeiro cuidado.` : `${ic("leaf")}<b>Verde:</b> ${plural(T.dias, "dia", "dias")} com ${esc(P.nome)} nas últimas 2 semanas (7 já deixam a copa plena).`}<br>${ic("star")}<b>Frutos:</b> ${plural(T.frutos, "reflexão", "reflexões")} em 30 dias.${T.plantas ? ` <b>Mudas ao pé:</b> ${plural(T.plantas, "prática ativa", "práticas ativas")}.` : ""}</p>
      <div class="flbl">Regar com uma reflexão</div><p class="bmq">${ic("info")}<span>${esc(q)}</span></p>
      <textarea class="jta" rows="3" data-jdt="rega:${id}" placeholder="Escreva o que essa pergunta desperta. Vai para as reflexões de ${esc(P.nome)}.">${esc(JD.txt["rega:" + id] || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdrega" data-p="${id}">${ic("leaf")}Regar</button><a class="btn sm ghost" href="#jornada.${P.sub}">${ic("arrow")}Abrir o pilar</a></div>`;
  }
  if (area === "rio") {
    const R = jdRio(), nf = D.folhas.length, hoje = D.folhas.filter(f => f.data === TODAY).length;
    return `<h3>${ic("wave")}O rio</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.rio)}</span></p><p class="muted">Corre com as noites de exame da Bússola: consciência que volta todos os dias ao próprio leito.</p>
      <div class="jdstat"><b>${R.st}</b><span>${R.n} de 14 noites com exame</span></div><div class="jdbar" style="--c:#4f9fd8"><i style="width:${Math.round(100 * R.f)}%"></i></div>
      ${jdEns(JD_ENS.rio)}<a class="btn sm" href="#jornada.exame">${ic("moon")}Fazer o exame da noite</a>
      <div class="flbl">Soltar uma folha</div><p class="small muted">Escreva o que você entrega ao rio: uma mágoa, uma preocupação, um apego. A folha leva o texto embora: ele <b>não é guardado</b> em lugar nenhum, só a data.</p>
      <textarea class="jta" rows="2" id="jd_folha" data-jdt="folha" placeholder="O que eu solto hoje…">${esc(JD.txt.folha || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdfolha">${ic("leaf")}Soltar no rio</button><span class="muted small">${plural(nf, "folha solta", "folhas soltas")}${hoje ? `, ${hoje} hoje` : ""}</span></div>${jdEns(JD_ENS.folha)}`;
  }
  if (area === "lago") { const n = jdLotus(), ss = jData().sess.filter(x => x.data >= addDays(TODAY, -6) && (x.pid === "med" || x.pid === "bud"));
    return `<h3>${ic("lotus")}O lago de lótus</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.lago)}</span></p><p class="muted">Uma flor para cada dia da última semana com sessão de meditação ou de prática budista.</p><div class="jdstat"><b>${n} de 7 flores</b><span>${plural(ss.length, "sessão", "sessões")}, ${sum(ss.map(x => +x.min || 0))} min</span></div>
      ${jdEns(JD_ENS.lotus)}<a class="btn sm" href="#jornada.praticas">${ic("plus")}Registrar uma sessão</a>`; }
  if (area === "pedreira" || area === "ped") {
    const p = area === "ped" ? D.pedras.find(x => x.id === id) : null;
    if (p) { const ms = jdMarks(p), k = ms.length, hj = (p.marcas || []).find(m => m.data === TODAY);
      return `<h3>${ic("box")}Pedra bruta: ${esc(p.nome)}</h3><p class="muted">Extraída ${relDay(p.criada)}${p.val ? `; antídoto: <b>${esc(bmV(p.val)?.nome || "")}</b> (os dias em que você o pratica no exame da noite também contam)` : ""}.</p>
        <div class="jdstat"><b>${p.lav ? "lavrada" : `${Math.min(k, 3)} de 3 golpes`}</b><span>${p.lav ? fmtD(p.lav) : "um golpe por dia em que você percebe e trabalha"}</span></div><div class="jdbar" style="--c:#a08a6a"><i style="width:${Math.round(100 * Math.min(1, k / 3))}%"></i></div>
        ${ms.length ? `<ul class="jdmarks">${ms.map(m => `<li><small>${fmtD(m.data)}</small> ${m.ex ? ic("compass") : ic("edit")}<span>${esc(m.txt || "percebi")}</span></li>`).join("")}</ul>` : ""}
        ${p.lav ? jdEns(JD_ENS.pedra) : `<div class="flbl">Golpe de cinzel</div><textarea class="jta" rows="2" data-jdt="marca:${p.id}" placeholder="Quando ${esc(p.nome.toLowerCase())} apareceu hoje, e o que você fez com isso?">${esc(JD.txt["marca:" + p.id] ?? hj?.txt ?? "")}</textarea>
        <div class="row wrap"><button type="button" class="btn sm${k >= 3 ? "" : " primary"}" data-act="jdmarca" data-id="${p.id}">${ic("edit")}${hj ? "Atualizar o golpe de hoje" : "Dar o golpe de hoje"}</button>${k >= 3 ? `<button type="button" class="btn sm primary" data-act="jdlavra" data-id="${p.id}">${ic("star")}Lavrar a pedra</button>` : ""}<button type="button" class="btn sm ghost" data-act="jdpdel" data-id="${p.id}">${ic("trash")}Devolver à montanha</button></div>`}
        <button type="button" class="btn sm ghost" data-act="jdsel" data-k="pedreira">${ic("back")}Pedreira</button>`; }
    const br = D.pedras.filter(x => !x.lav), lv = D.pedras.filter(x => x.lav);
    return `<h3>${ic("box")}A pedreira</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.pedreira)}</span></p><p class="muted">Cada pedra bruta é uma inclinação que você decidiu trabalhar (a reforma íntima). Ela vira pedra lavrada depois de três dias em que você a percebeu e agiu, e as pedras lavradas constroem o templo.</p>
      <div class="jdstat"><b>${plural(br.length, "pedra bruta", "pedras brutas")}</b><span>${plural(lv.length, "lavrada", "lavradas")} ao todo · ${plural(Math.max(0, st.pedras), "no estoque", "no estoque")}</span></div>
      ${br.length ? `<div class="jdlist">${br.map(x => `<button type="button" class="jdli" data-act="jdsel" data-k="ped:${x.id}"><b>${esc(x.nome)}</b><small>${Math.min(3, jdMarks(x).length)} de 3</small></button>`).join("")}</div>` : ""}
      <div class="flbl">Extrair uma pedra</div>${br.length >= 5 ? `<p class="small muted">Cinco pedras brutas de uma vez já é muito: lavre uma antes de extrair outra.</p>` : `<div class="form f1"><label>Inclinação a trabalhar<input type="text" maxlength="40" data-jdt="pnome" value="${esc(JD.txt.pnome || "")}" placeholder="impaciência, maledicência, orgulho…"></label>
      <label>Valor-antídoto (opcional)<select data-jdt="pval"><option value="">nenhum</option>${BM_V.map(v => `<option value="${v.id}"${JD.txt.pval === v.id ? " selected" : ""}>${esc(v.nome)}</option>`).join("")}</select></label></div><button type="button" class="btn sm primary" data-act="jdpedra">${ic("plus")}Extrair</button>`}
      ${jdEns(JD_ENS.pedra)}`;
  }
  if (area === "oficina") {
    const tl = D.talhos.slice().reverse().slice(0, 5), pid = JD.txt.tpid || "med";
    return `<h3>${ic("brief")}A oficina do eremita</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.oficina)}</span></p><p class="muted">A madeira bruta vem das sessões de prática: cada sessão registrada é uma tora. Três toras e uma frase sobre o que a prática está esculpindo em você viram uma tábua (e a frase vira um aprendizado no pilar).</p>
      <div class="jdstat"><b>${plural(st.toras, "tora", "toras")}</b><span>${plural(Math.max(0, st.tabuas), "tábua", "tábuas")} no estoque · ${plural(D.talhos.length, "talhada", "talhadas")} ao todo</span></div>
      <div class="flbl">Talhar uma tábua</div><div class="form f1"><label>Pilar<select data-jdt="tpid">${J_ORDER.map(p => `<option value="${p}"${p === pid ? " selected" : ""}>${esc(J_PIL[p].nome)}</option>`).join("")}</select></label></div>
      <textarea class="jta" rows="2" data-jdt="talho" placeholder="O que a prática está esculpindo em mim?">${esc(JD.txt.talho || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdtalho"${st.toras >= 3 ? "" : " disabled"}>${ic("edit")}Talhar (3 toras)</button>${st.toras < 3 ? `<a class="btn sm ghost" href="#jornada.praticas">${ic("plus")}Registrar uma sessão</a>` : ""}</div>
      ${tl.length ? `<ul class="jdmarks">${tl.map(t => { const r = jP(t.pid).refl.find(x => x.id === t.refl); return `<li><small>${fmtD(t.data)}</small><span style="color:${J_PIL[t.pid].cor}">${esc(J_PIL[t.pid].nome)}</span><span>${esc(trunc(r?.texto || "", 90))}</span></li>`; }).join("")}</ul>` : ""}${jdEns(JD_ENS.madeira)}`;
  }
  if (area === "templo") {
    const T = D.templo;
    return `<h3>${ic("house")}O templo</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.templo)}</span></p><p class="muted">Construído em ordem, com o que você lavrou e talhou. Algumas partes pedem algo da jornada.</p>
      <div class="jdstat"><b>${JD_TEMPLO.filter(t => T[t.id]).length} de ${JD_TEMPLO.length} partes</b><span>estoque: ${plural(Math.max(0, st.pedras), "pedra", "pedras")} · ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}</span></div>
      ${T.piso ? `<p class="small">${ic("flame")}A chama do altar está <b>${jdChama() ? "acesa" : "apagada"}</b>: ela acende quando há exame da noite hoje ou ontem.</p>` : ""}
      <ol class="jdparts">${JD_TEMPLO.map(t => { const c = jdCan(t); return `<li class="${T[t.id] ? "ok" : c.ok ? "can" : ""}"><div><b>${esc(t.nome)}</b><small>${t.p ? plural(t.p, "pedra", "pedras") : ""}${t.p && t.m ? " + " : ""}${t.m ? plural(t.m, "tábua", "tábuas") : ""}</small></div>
        ${T[t.id] ? `<details><summary>${ic("check")}construído ${fmtD(T[t.id])}</summary><p class="small">${esc(t.sim)}</p>${jdEns(t.ens)}</details>` : c.ok ? `<p class="small">${esc(t.sim)}</p><button type="button" class="btn sm primary" data-act="jdbuild" data-id="${t.id}">${ic("plus")}Construir</button>` : `<small class="muted">falta: ${esc(c.falta.join("; "))}</small>`}</li>`; }).join("")}</ol>`;
  }
  if (area === "praca") {
    const v = bmDayValue(), sc = bmScores(28);
    return `<h3>${ic("compass")}A Bússola, no centro</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.praca)}</span></p><p class="muted">No centro do jardim, a rosa dos ventos: os quatro rumos da Bússola moral orientam o jardim. A agulha aponta o rumo do valor do dia.</p>
      <div class="jdstat" style="--c:${bmAx(v.ax).cor}"><b>${esc(v.nome)}</b><span>${esc(bmAx(v.ax).rumo)} · ${esc(bmAx(v.ax).nome)}</span></div><p><b>${esc(v.acao)}</b></p><p class="bmq">${ic("info")}<span>${esc(v.perg)}</span></p>
      <div class="jdaxes">${BM_AX.map(a => { const s = sc.ax[a.id]; return `<div><span style="color:${a.cor}">${esc(a.rumo)}</span><div class="jdbar" style="--c:${a.cor}"><i style="width:${s == null ? 0 : Math.round(100 * s)}%"></i></div><small>${s == null ? "–" : pct(s)}</small></div>`; }).join("")}</div>
      <p class="small muted">Prática de cada rumo nas notas do exame das últimas 4 semanas.</p><div class="row wrap"><a class="btn sm" href="#jornada.exame">${ic("moon")}Exame da noite</a><a class="btn sm ghost" href="#jornada.bussola">${ic("compass")}Abrir a Bússola</a></div>`;
  }
  if (area === "mirante") return `<h3>${ic("eye")}O mirante</h3><p class="small jdsimb">${ic("info")}<span>${esc(JD_SIMB.mirante)}</span></p><p class="muted">Do alto, o jardim inteiro: a mandala mostra as estações dos quatro caminhos; a bússola, os valores.</p>${jMandala({ mini: true })}
      <div class="row wrap"><a class="btn sm" href="#jornada.inicio">${ic("lotus")}Explorar a mandala</a><a class="btn sm ghost" href="#jornada.bussola">${ic("compass")}Explorar a bússola</a></div>`;
  if (area === "cam") { const c = JD_CAM.find(x => x.id === id), [a, b] = c.prog(), op = jdCamOpen(id);
    return `<h3>${ic(op ? "unlock" : "lock")}${esc(c.nome)}</h3><p>Leva a ${esc(c.area)}.</p>${op ? `<p class="muted">${id === "bosque" ? "Aberta desde o primeiro dia." : `Aberta em ${fmtD(jdData().cam[id])}.`}</p>` : `<p class="muted">Pede: ${esc(c.t)}. Agora: <b>${Math.min(a, b)} de ${b}</b>.</p><div class="jdbar"><i style="width:${Math.round(100 * Math.min(1, a / b))}%"></i></div>${a >= b ? `<button type="button" class="btn primary" data-act="jdcam" data-id="${id}">${ic("unlock")}Abrir o caminho</button>` : ""}`}${jdBack()}`; }
  const asks = jdAsks();
  return `<h3>${ic("sprout")}O seu jardim interior</h3><p class="muted">Tudo aqui cresce com o que você já vive na jornada: nada de pontos inventados. Toque em qualquer parte do jardim.</p>
    <div class="flbl">O que o jardim pede hoje</div>${asks.length ? `<ol class="jdasks">${asks.map(([, t, s, kk]) => `<li><button type="button" class="jdli" data-act="jdsel" data-k="${kk}"><b>${esc(t)}</b><small>${esc(s)}</small></button></li>`).join("")}</ol>` : `<p class="muted">Nada urgente. Passeie.</p>`}
    <div class="flbl">Como cada coisa cresce</div><ul class="jdrules">
      <li>${ic("leaf")}<span><b>Árvores</b>: estações do caminho, reflexões, sessões e notas do pilar. O verde vem dos dias com o pilar em 2 semanas. Regar é escrever uma reflexão.</span></li>
      <li>${ic("wave")}<span><b>Rio</b>: noites de exame da Bússola em 14 dias. <b>Lótus</b>: dias de meditação ou prática budista na semana. <b>Vagalumes</b>: exames da semana.</span></li>
      <li>${ic("box")}<span><b>Pedras</b>: uma inclinação nomeada; 3 dias percebidos e trabalhados a lavram. <b>Madeira</b>: cada sessão de prática é uma tora; 3 viram uma tábua.</span></li>
      <li>${ic("house")}<span><b>Templo</b>: pedras e tábuas, em ordem. <b>Caminhos</b>: abrem com marcos da jornada.</span></li></ul>`;
}
function jdJournal() {
  const D = jdData(), ev = [];
  for (const [id, d] of Object.entries(D.cam)) { const c = JD_CAM.find(x => x.id === id); if (c) ev.push([d, "unlock", `Caminho aberto: ${c.nome}`]); }
  for (const p of D.pedras) { ev.push([p.criada, "box", `Pedra extraída: ${p.nome}`]); if (p.lav) ev.push([p.lav, "star", `Pedra lavrada: ${p.nome}`]); }
  for (const t of D.talhos) ev.push([t.data, "edit", `Tábua talhada (${J_PIL[t.pid]?.nome || ""})`]);
  for (const t of JD_TEMPLO) if (D.templo[t.id]) ev.push([D.templo[t.id], "house", `Templo: ${t.nome}`]);
  const fd = {}; for (const f of D.folhas) fd[f.data] = (fd[f.data] || 0) + 1; for (const [d, n] of Object.entries(fd)) ev.push([d, "leaf", `${plural(n, "folha solta", "folhas soltas")} no rio`]);
  ev.sort((a, b) => a[0] < b[0] ? 1 : -1);
  return ev.length ? `<ul class="jdjour">${ev.slice(0, 14).map(([d, i, t]) => `<li><small>${fmtD(d)}</small>${ic(i)}<span>${esc(t)}</span></li>`).join("")}</ul>` : `<div class="empty">Os marcos do jardim aparecem aqui: caminhos abertos, pedras lavradas, partes do templo.</div>`;
}
function pJardim() {
  const T = J_ORDER.map(jdTree), R = jdRio(), D = jdData(), st = jdStock(), nb = JD_TEMPLO.filter(t => D.templo[t.id]).length, nc = JD_CAM.filter(c => jdCamOpen(c.id)).length, [est] = jdSeason();
  const places = [["portao", "Portão da lua", "sprout"], ...J_ORDER.map(p => ["arv:" + p, JD_ARV[p].nome, J_PIL[p].ico]), ["rio", "Rio", "wave"], ["lago", "Lótus", "lotus"], ["praca", "Bússola", "compass"], ["pedreira", "Pedreira", "box"], ["oficina", "Oficina", "brief"], ["templo", "Templo", "house"], ["mirante", "Mirante", "eye"]];
  setTimeout(() => { const sc = $(".jdscene"); if (sc && sc.scrollWidth > sc.clientWidth) { sc.scrollLeft = JD.sx ?? (sc.scrollWidth - sc.clientWidth) / 2; sc.addEventListener("scroll", () => { JD.sx = sc.scrollLeft; }, { passive: true });
    if (JD.center) { const el = sc.querySelector(`[data-k="${JD.sel}"]`); if (el) { const r = el.getBoundingClientRect(), rs = sc.getBoundingClientRect(); sc.scrollLeft += r.left + r.width / 2 - (rs.left + rs.width / 2); JD.sx = sc.scrollLeft; } } } JD.center = false; }, 0);
  setTimeout(() => { if (JD.fx && Date.now() - JD.fx.at > 200) JD.fx = null; if (JD.scroll && innerWidth < 1100) { JD.scroll = false; $(".jdaside")?.scrollIntoView({ block: "start", behavior: "smooth" }); } }, 2200);
  return `<p class="lead">Saúde espiritual: o jardim é o próprio yin-yang, pintado a tinta num leque redondo. O rio é o S: nasce junto ao Espiritismo, no norte, e chega ao mar junto ao Budismo, no sul. No olho do yang fica a pedra das imperfeições; no olho do yin, o lago de lótus; no centro, onde as forças se tocam, o templo sobre a Bússola. Cada pilar ocupa o seu ponto cardeal, como na mandala, pintado no seu próprio gênero. É ${est}; à noite os vagalumes aparecem e a lua é a de hoje.</p>
    ${kpiRow([kmini("var(--jp-tao)", "Árvores", `${sum(T.map(t => t.s))} de 20`, `estágios somados · ${T.filter(t => t.dorm).length ? `${T.filter(t => t.dorm).length} dormindo` : "todas acordadas"}`), kmini("#4f9fd8", "Rio", R.st, `${R.n} de 14 noites de exame`), kmini("var(--jp-bud)", "Templo", `${nb} de ${JD_TEMPLO.length}`, `${plural(Math.max(0, st.pedras), "pedra", "pedras")} e ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")} no estoque`), kmini("var(--jp-med)", "Caminhos", `${nc} de ${JD_CAM.length}`, JD_CAM.some(c => !jdCamOpen(c.id) && jdCamReady(c)) ? "há um pronto para abrir" : "abrem com marcos da jornada")])}
    <div class="jdlay"><section class="pn jdmain">${jdScene()}<div class="jdplaces" role="toolbar" aria-label="Lugares do jardim">${places.map(([k, l, i]) => `<button type="button" class="chip${JD.sel === k ? " on" : ""}${jdLocked(k) ? " lk" : ""}" data-act="jdsel" data-k="${k}">${ic(jdLocked(k) ? "lock" : i)}${esc(l)}</button>`).join("")}<button type="button" class="chip jdlblt${JD.lbl ? " on" : ""}" data-act="jdlbl" aria-pressed="${!!JD.lbl}">${ic("list")}Nomes no desenho</button></div></section>
      <aside class="pn jdaside" aria-live="polite">${jdAside()}</aside></div>
    <div class="g2c">${panel(`${ic("clock")}Diário do jardim`, jdJournal())}${panel(`${ic("palette")}O projeto do jardim`, `<div class="hscroll"><table class="dt jdtab jdproj"><thead><tr><th>Lugar</th><th>Pintura</th><th>Símbolo</th><th>Cresce com</th><th class="num">Agora</th></tr></thead><tbody>
      ${J_ORDER.map((p, i) => { const t = T[i], A = JD_ARV[p]; return `<tr><td><b>${esc(J_PIL[p].nome)}</b><br><small>${["norte", "leste", "sul", "oeste"][i]} · ${esc(A.nome)}</small></td><td>${esc(A.estilo)}</td><td>${esc(A.cena)}</td><td>estações, reflexões, sessões e notas do pilar</td><td class="num">${t.g} pts<br><small>${t.nome}</small></td></tr>`; }).join("")}
      <tr><td><b>Rio</b><br><small>o S</small></td><td>linhas de água (shuiwen)</td><td>${esc(JD_SIMB.rio)}</td><td>noites de exame, 14 dias</td><td class="num">${R.n}</td></tr>
      <tr><td><b>Pedra</b><br><small>olho do yang</small></td><td>pedra de estudioso</td><td>${esc(JD_SIMB.pedreira)}</td><td>inclinações trabalhadas em 3 dias</td><td class="num">${st.lav} furos</td></tr>
      <tr><td><b>Lótus</b><br><small>olho do yin</small></td><td>mogu, só cor</td><td>${esc(JD_SIMB.lago)}</td><td>dias com meditação ou Budismo, 7 dias</td><td class="num">${jdLotus()} de 7</td></tr>
      <tr><td><b>Templo</b><br><small>centro</small></td><td>jiehua, o traço de arquitetura</td><td>${esc(JD_SIMB.templo)}</td><td>pedras lavradas e tábuas</td><td class="num">${nb} de ${JD_TEMPLO.length}</td></tr>
      <tr><td><b>Oficina</b><br><small>nordeste, no yin</small></td><td>cabana do eremita</td><td>${esc(JD_SIMB.oficina)}</td><td>sessões de prática (toras)</td><td class="num">${st.toras} toras</td></tr>
      <tr><td><b>Vagalumes</b></td><td>pontos de luz</td><td>a consciência que acende à noite</td><td>exames, 7 dias</td><td class="num">${jdVaga()}</td></tr></tbody></table>`)}</div>`;
}

/* ---------------------------------------------------------------- ações */
function jdFolhaAnim() {
  const svg = $(".jdsvg"), p = $("#jdriver"); if (!svg || !p) return;
  const ns = "http://www.w3.org/2000/svg", g = document.createElementNS(ns, "g"); g.setAttribute("class", "jd-leaf");
  g.innerHTML = `<path d="M-10 0Q0-7 10 0Q0 7-10 0Z" fill="${QIAN}" fill-opacity=".8" stroke="${INK}" stroke-width=".7"/><path d="M-10 0H10" stroke="${INK}" stroke-opacity=".7" stroke-width=".8"/>`;
  const an = document.createElementNS(ns, "animateMotion"); an.setAttribute("dur", "5s"); an.setAttribute("fill", "freeze"); an.setAttribute("rotate", "auto"); an.setAttribute("begin", "indefinite"); an.setAttribute("path", p.getAttribute("d")); an.setAttribute("keyPoints", "0.42;1"); an.setAttribute("keyTimes", "0;1"); an.setAttribute("calcMode", "linear");
  g.appendChild(an); svg.appendChild(g); try { an.beginElement(); } catch {} setTimeout(() => g.remove(), 5200);
}
function jdClick(t) {
  const ds = t.dataset, a = ds.act; if (!a?.startsWith("jd")) return false;
  const D = jdData();
  if (a === "jdlbl") { JD.lbl = !JD.lbl; render(); return true; }
  if (a === "jdsel") { JD.sel = ds.k; JD.scroll = true; JD.center = !!t.closest(".jdplaces"); render(); return true; }
  if (a === "jdrega") { const pid = ds.p, r = jSaveRefl(pid, JD.txt["rega:" + pid], "reflexão", [], false, { origem: "jardim" }); if (!r) return true; JD.txt["rega:" + pid] = ""; JD.fx = { k: "rega", id: pid, at: Date.now() }; touch("jornada", { label: "Árvore regada" }); toast(`${JD_ARV[pid].nome} regada · reflexão guardada em ${J_PIL[pid].nome}`); return true; }
  if (a === "jdfolha") { D.folhas.push({ data: TODAY, at: Date.now() }); JD.txt.folha = ""; const el = $("#jd_folha"); if (el) el.value = ""; touch("jardim", { label: "Folha solta", noUndo: true, noRender: true }); jdFolhaAnim(); toast("A folha seguiu o rio. O texto não foi guardado."); setTimeout(() => { if (PAGE === "jornada" && SUB === "jardim") render(); }, 5300); return true; }
  if (a === "jdpedra") { const nome = String(JD.txt.pnome || "").trim().slice(0, 40); if (!nome) { toast("Dê um nome à inclinação."); return true; } if (D.pedras.filter(p => !p.lav).length >= 5) { toast("Lavre uma pedra antes de extrair outra."); return true; }
    const p = { id: uid(), nome: nome[0].toUpperCase() + nome.slice(1), val: BM_V.some(v => v.id === JD.txt.pval) ? JD.txt.pval : "", criada: TODAY, marcas: [], at: Date.now() }; D.pedras.push(p); JD.txt.pnome = ""; JD.txt.pval = ""; JD.sel = "ped:" + p.id; JD.fx = { k: "pedra", id: p.id, at: Date.now() }; touch("jardim", { label: "Pedra extraída" }); return true; }
  if (a === "jdmarca") { const p = D.pedras.find(x => x.id === ds.id); if (!p) return true; const k = "marca:" + p.id, hj = (p.marcas ||= []).find(m => m.data === TODAY), txt = String(JD.txt[k] ?? hj?.txt ?? "").trim();
    if (!txt) { toast(`Escreva quando ${p.nome.toLowerCase()} apareceu e o que você fez.`); return true; }
    if (hj) hj.txt = txt.slice(0, 600); else p.marcas.push({ data: TODAY, txt: txt.slice(0, 600) }); delete JD.txt[k]; JD.fx = { k: "golpe", id: p.id, at: Date.now() }; touch("jardim", { label: "Golpe de cinzel" });
    const n = jdMarks(p).length; toast(n >= 3 ? "Três golpes: a pedra já pode ser lavrada" : `Golpe dado: ${Math.min(n, 3)} de 3`); return true; }
  if (a === "jdlavra") { const p = D.pedras.find(x => x.id === ds.id); if (!p || p.lav || jdMarks(p).length < 3) return true; p.lav = TODAY; JD.sel = "pedreira"; JD.fx = { k: "lavra", id: p.id, at: Date.now() }; touch("jardim", { label: "Pedra lavrada" }); toast(`Pedra lavrada: ${p.nome}. Ela vai para o estoque do templo.`); return true; }
  if (a === "jdpdel") { D.pedras = D.pedras.filter(x => x.id !== ds.id); JD.sel = "pedreira"; touch("jardim", { label: "Pedra devolvida" }); undoToast("Pedra devolvida à montanha"); return true; }
  if (a === "jdtalho") { const st = jdStock(); if (st.toras < 3) { toast("São precisas 3 toras: cada sessão de prática é uma."); return true; } const pid = J_ORDER.includes(JD.txt.tpid) ? JD.txt.tpid : "med", r = jSaveRefl(pid, JD.txt.talho, "aprendizado", [], false, { origem: "jardim" }); if (!r) return true;
    D.talhos.push({ id: uid(), data: TODAY, pid, refl: r.id }); JD.txt.talho = ""; JD.fx = { k: "talho", id: "oficina", at: Date.now() }; touch("jardim", "jornada", { label: "Tábua talhada" }); toast(`Tábua talhada · aprendizado guardado em ${J_PIL[pid].nome}`); return true; }
  if (a === "jdbuild") { const t = JD_TEMPLO.find(x => x.id === ds.id); if (!t || D.templo[t.id] || !jdCan(t).ok) return true; D.templo[t.id] = TODAY; JD.fx = { k: "build", id: t.id, at: Date.now() }; touch("jardim", { label: `Templo: ${t.nome}` }); toast(`${t.nome} construído. ${t.sim}`); return true; }
  if (a === "jdcam") { const c = JD_CAM.find(x => x.id === ds.id); if (!c || jdCamOpen(c.id) || !jdCamReady(c)) return true; D.cam[c.id] = TODAY; JD.fx = { k: "cam", id: c.id, at: Date.now() }; JD.sel = { margem: "rio", ponte: "pedreira", escada: "templo", mirante: "mirante" }[c.id] || "portao"; touch("jardim", { label: `Caminho aberto: ${c.nome}` }); toast(`${c.nome} aberta: agora você chega a ${c.area}.`); return true; }
  return false;
}
function jdInput(t) { const k = t.dataset.jdt; if (!k) return false; JD.txt[k] = t.value; return true; }
function jdChange(t) { const k = t.dataset.jdt; if (!k) return false; JD.txt[k] = t.value; return true; }
