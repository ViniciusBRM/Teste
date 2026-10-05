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
const JD = { sel: "portao", txt: {}, fx: null, h: null };
const jdData = () => { const d = (S.jardim ||= {}); d.pedras ||= []; d.talhos ||= []; d.templo ||= {}; d.folhas ||= []; d.cam ||= {}; return d; };
const JD_ARV = {
  esp: { nome: "Ameixeira", art: "a", x: 500, y: 178, lx: 556, ly: 140, an: "start", sim: "Floresce no inverno, em galho nu, e renasce a cada ano: a fé que persevera e o Espírito que recomeça. Na pintura chinesa, a ameixeira é a primeira flor depois do frio." },
  med: { nome: "Bambu", art: "o", x: 892, y: 588, lx: 892, ly: 612, sim: "Oco por dentro e flexível ao vento: a mente que se esvazia e não quebra." },
  tao: { nome: "Pinheiro", art: "o", x: 112, y: 588, lx: 112, ly: 612, sim: "Verde no inverno: a constância que não força, símbolo taoista de longevidade." },
  bud: { nome: "Figueira-bodhi", art: "a", x: 500, y: 958, lx: 584, ly: 905, an: "start", sim: "A árvore sob a qual Siddhartha despertou: sentar-se e ver com clareza." } };
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
  { id: "bosque", nome: "Caminho circular", area: "os quatro pilares", t: "aberto desde o começo", prog: () => [1, 1], d: "M822 500A322 322 0 1 1 178 500A322 322 0 1 1 822 500" },
  { id: "margem", nome: "Descida à margem", area: "o rio e o lago de lótus", t: "1 reflexão em qualquer pilar", prog: () => [J_ORDER.reduce((s, p) => s + jP(p).refl.length, 0), 1], d: "M803 612C730 640 640 660 566 656" },
  { id: "ponte", nome: "Ponte do centro", area: "a pedreira e a oficina", t: "3 noites de exame da Bússola", prog: () => [Object.keys(bmEx()).length, 3], d: "M406 506H594" },
  { id: "escada", nome: "Escadaria do templo", area: "o templo", t: "1 pedra lavrada", prog: () => [jdData().pedras.filter(p => p.lav).length, 1], d: "M198 392C280 404 360 404 436 400" },
  { id: "mirante", nome: "Subida ao mirante", area: "a mandala e a bússola vistas do alto", t: "as quatro árvores ao menos em broto", prog: () => [J_ORDER.filter(p => jdTree(p).s >= 1).length, 4], d: "M779 338C800 310 806 290 800 272" }];
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

/* ---------------------------------------------------------------- desenho: jardim circular em yin-yang, em tinta-aguada
   Disco de raio 300 no centro (500, 500): o yin (tinta) e o yang (papel) separados pelo rio, que corre no S.
   O olho do yang (500, 350) guarda o templo; o olho do yin (500, 650) é o lago de lótus; no centro, onde as forças se
   encontram, a Bússola, atravessada pela ponte. Os quatro pilares ficam nos pontos cardeais, como na mandala
   (Espiritismo ao norte, Meditação a leste, Budismo ao sul, Taoísmo a oeste); nas diagonais, a pedreira, o mirante,
   a oficina e o portão da lua. Tudo pintado com pincel: traço com bordas irregulares (filtro jdink) e aguadas (jdwash). */
const INK = "#26221e", PAPER = "#f2ead9", SEAL = "#b23a2a";
const jdR = (s, i) => { const x = Math.sin((s + 1) * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
const jdStroke = (d, w, op = .85, extra = "") => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round" filter="url(#jdink)"${extra}/>`;
const jdSealSym = { esp: `<path d="M0 6c-5-3-4-8 0-12c4 4 5 9 0 12Z" fill="${PAPER}"/>`, med: `<path d="M-5.5 2a6 6 0 1 1 9 2" fill="none" stroke="${PAPER}" stroke-width="2.2" stroke-linecap="round"/>`,
  tao: `<circle r="6" fill="none" stroke="${PAPER}" stroke-width="1.4"/><path d="M0-6a3 3 0 0 1 0 6a3 3 0 0 0 0 6a6 6 0 0 1 0-12Z" fill="${PAPER}"/>`,
  bud: `<circle r="5.5" fill="none" stroke="${PAPER}" stroke-width="1.4"/>${[0, 45, 90, 135].map(a => `<line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="${PAPER}" stroke-width="1.1" transform="rotate(${a})"/>`).join("")}<circle r="1.6" fill="${PAPER}"/>` };
const jdSeal = (x, y, pid, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" class="jd-seal"><rect x="-10" y="-10" width="20" height="20" rx="3" fill="${SEAL}" filter="url(#jdink)"/>${jdSealSym[pid]}</g>`;
function jdLeaf(T) { if (T.dorm) return "#8f8a7f"; const tint = { primavera: "#6f9a58", verão: "#4b7a48", outono: "#9a8a3e", inverno: "#5a6e60" }[jdSeason()[0]]; return `color-mix(in srgb,${tint} ${Math.round(18 + 42 * T.v)}%,${INK})`; }
const jdBlade = (x, y, a, len, w = .2) => `<path d="M0 0Q${len * .5} ${-len * w} ${len} 0Q${len * .5} ${len * w * .6} 0 0Z" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)})"/>`;
function jdTreeSVG(T, fx) {
  const pid = T.pid, A = JD_ARV[pid], col = J_PIL[pid].cor, s = T.s, z = [0, 0, 0, .8, .93, 1.05][s], H = 160 * z, x = A.x, y = A.y, leaf = jdLeaf(T), fo = T.dorm ? .35 : .45 + .45 * T.v, sel = JD.sel === "arv:" + pid;
  let g = `<ellipse cx="${x}" cy="${y + 2}" rx="${30 + s * 6}" ry="${5 + s}" class="jd-soil" filter="url(#jdwash)"/>`, cv = "", fr = [];
  if (s === 0) g += `<circle cx="${x}" cy="${y - 3}" r="5" fill="${INK}" class="jd-seed"/>`;
  else if (s <= 2) { const h = s === 1 ? 34 : 64; cv += jdStroke(`M${x} ${y}q5 ${-h / 2} -1 ${-h}`, 3); cv += `<g fill="${leaf}" fill-opacity="${fo}">${(s === 1 ? [h * .6, h] : [h * .4, h * .62, h * .82, h]).flatMap(k => [jdBlade(x, y - k, -150, 22), jdBlade(x, y - k, -30, 22)]).join("")}</g>`; }
  else if (pid === "esp") {
    /* ameixeira: tronco nodoso, galhos em ângulo, flores no galho nu (floresce no inverno) */
    g += jdStroke(`M${x - 4} ${y}C${x - 12} ${y - H * .25} ${x + 12} ${y - H * .4} ${x - 2} ${y - H * .62}`, 11 * z, .9) + jdStroke(`M${x - 2} ${y - H * .62}C${x - 10} ${y - H * .74} ${x - 26 * z} ${y - H * .8} ${x - 44 * z} ${y - H * .98}`, 5 * z) + jdStroke(`M${x + 2} ${y - H * .42}C${x + 20 * z} ${y - H * .5} ${x + 34 * z} ${y - H * .66} ${x + 52 * z} ${y - H * .78}L${x + 64 * z} ${y - H * .96}`, 4.5 * z) + jdStroke(`M${x - 2} ${y - H * .62}L${x + 6 * z} ${y - H}`, 3 * z, .8) + jdStroke(`M${x - 30 * z} ${y - H * .84}L${x - 22 * z} ${y - H * 1.02}`, 2, .7);
    const pts = [[-44, .98], [-30, .9], [-36, .82], [-22, 1.02], [6, 1], [2, .86], [20, .52], [34, .64], [46, .72], [56, .86], [64, .96], [-14, .74], [12, .9], [40, .82], [-8, .66], [28, .58]], nb = T.dorm ? 2 : Math.round(5 + 11 * T.v);
    cv += pts.slice(0, nb).map(([dx, dy], i) => { const cx = x + dx * z, cy = y - H * dy; return `<g class="jd-blos" style="animation-delay:${(i * .2).toFixed(1)}s">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(cx + Math.cos(a * Math.PI / 180) * 2.6).toFixed(1)}" cy="${(cy + Math.sin(a * Math.PI / 180) * 2.6).toFixed(1)}" r="2.3" fill="#d4606a" fill-opacity=".8"/>`).join("")}<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1" fill="${INK}"/></g>`; }).join("");
    fr = [[-30, .9], [46, .72], [6, 1], [20, .52], [-14, .74], [56, .86], [-36, .82], [34, .64]].map(([dx, dy]) => [x + dx * z + 4, y - H * dy + 5]);
  } else if (pid === "med") {
    /* bambu: colmos em segmentos, folhas em lâmina, mais escuras na frente */
    const dxs = [-10, 8, 22, -24, 34], hs = [1, .88, .72, .8, .62];
    for (let i = 0; i < s; i++) { const xx = x + dxs[i] * z, hh = H * hs[i], seg = 22 * z, op = i < 2 ? .85 : .45;
      for (let k = 0; k * seg < hh - 4; k++) cv += `<line x1="${xx + k * .4}" y1="${y - k * seg - 2}" x2="${xx + (k + 1) * .4}" y2="${y - Math.min(hh, (k + 1) * seg) + 2}" stroke="${INK}" stroke-opacity="${op}" stroke-width="${6 * z}" stroke-linecap="butt" filter="url(#jdink)"/><path d="M${xx - 4 * z} ${y - (k + 1) * seg + 2}q${4 * z} -3 ${8 * z} 0" stroke="${INK}" stroke-opacity="${op}" fill="none" stroke-width="1.4"/>`;
      cv += `<g fill="${leaf}" fill-opacity="${(fo * (i < 2 ? 1 : .7)).toFixed(2)}">${[[0, -160, 30], [0, -125, 26], [0, -20, 28], [.25, 175, 24], [.25, -10, 22], [.45, 200, 20]].map(([dy, a, l], j) => jdBlade(xx + 2, y - hh * (1 - dy) + 4, a + jdR(i, j) * 16, l * z + 6, .17)).join("")}</g>`; }
    fr = [[-10, .96], [8, .84], [22, .7], [-24, .76], [34, .6], [-6, .7], [14, .58], [0, .5]].map(([dx, dy]) => [x + dx * z + 8, y - H * dy]);
  } else if (pid === "tao") {
    /* pinheiro: tronco torcido e copas planas como nuvens, com agulhas em leque */
    g += jdStroke(`M${x + 4} ${y}C${x - 10} ${y - H * .3} ${x + 18} ${y - H * .5} ${x - 6} ${y - H * .78}C${x - 14} ${y - H * .9} ${x - 4} ${y - H * .98} ${x + 6} ${y - H}`, 9 * z, .9) + jdStroke(`M${x + 6} ${y - H * .48}C${x + 30 * z} ${y - H * .5} ${x + 44 * z} ${y - H * .58} ${x + 60 * z} ${y - H * .56}`, 4 * z) + jdStroke(`M${x - 4} ${y - H * .7}C${x - 24 * z} ${y - H * .72} ${x - 40 * z} ${y - H * .78} ${x - 56 * z} ${y - H * .76}`, 3.5 * z);
    for (const [dx, dy, w] of [[58, .58, 34], [-54, .78, 32], [4, 1.02, 30], [-10, .5, 22]]) { const cx = x + dx * z, cy = y - H * dy, rw = w * z;
      cv += `<ellipse cx="${cx}" cy="${cy}" rx="${rw}" ry="${rw * .32}" fill="${leaf}" fill-opacity="${(fo * .8).toFixed(2)}" filter="url(#jdwash)"/><g stroke="${INK}" stroke-opacity="${(fo * .9).toFixed(2)}" stroke-width="1">${Array.from({ length: 9 }, (_, k) => { const a = Math.PI + k / 8 * Math.PI; return `<line x1="${cx}" y1="${cy + 2}" x2="${(cx + Math.cos(a) * rw).toFixed(1)}" y2="${(cy + Math.sin(a) * rw * .55).toFixed(1)}"/>`; }).join("")}</g>`; }
    fr = [[58, .6], [-54, .8], [4, 1.04], [-10, .52], [70, .56], [-66, .76], [14, 1], [46, .62]].map(([dx, dy]) => [x + dx * z, y - H * dy + 4]);
  } else {
    /* figueira-bodhi: tronco largo, raízes aéreas e folhas em coração */
    g += jdStroke(`M${x - 9 * z} ${y}C${x - 6 * z} ${y - H * .3} ${x - 4} ${y - H * .42} ${x - 2} ${y - H * .56}`, 12 * z, .9) + jdStroke(`M${x + 9 * z} ${y}C${x + 6 * z} ${y - H * .3} ${x + 4} ${y - H * .42} ${x + 2} ${y - H * .56}`, 6 * z, .7);
    for (const dx of [-30, -14, 16, 32]) g += jdStroke(`M${x + dx * z} ${y - H * .55}q${dx * .1} ${H * .25} ${dx * .15} ${H * .5}`, 1.2, .5);
    const heart = (cx, cy, a, r) => `<path d="M0 ${r}C${-r * 1.3} ${-r * .1} ${-r * .5} ${-r * 1.1} 0 ${-r * .4}C${r * .5} ${-r * 1.1} ${r * 1.3} ${-r * .1} 0 ${r}Z" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${a.toFixed(0)})"/>`;
    cv += `<g fill="${leaf}" fill-opacity="${(fo * .85).toFixed(2)}" stroke="${INK}" stroke-opacity=".55" stroke-width=".9">${Array.from({ length: 26 }, (_, i) => { const a = jdR(i, 5) * Math.PI, r = 10 + jdR(i, 6) * 44; return heart(x + Math.cos(a) * r * z * 1.25, y - H * .66 - Math.sin(a) * r * z * .62, (jdR(i, 7) - .5) * 70 + 180, 10 * z + 3); }).join("")}</g>`;
    fr = [[-34, .64], [30, .62], [-14, .8], [14, .78], [0, .66], [-44, .7], [44, .7], [0, .9]].map(([dx, dy]) => [x + dx * z, y - H * dy]);
  }
  if (s >= 3) { cv += fr.slice(0, Math.min(8, T.frutos)).map(([fx1, fy]) => `<circle cx="${fx1.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.3" class="jd-fruit" style="fill:${col}"/>`).join("");
    if (s === 5) cv += Array.from({ length: 5 }, (_, i) => `<circle cx="${(x - 40 + jdR(i, 21) * 80).toFixed(0)}" cy="${(y - H * (.3 + jdR(i, 22) * .5)).toFixed(0)}" r="2.2" fill="#d4606a" fill-opacity=".7" class="jd-petal" style="animation-delay:${i * 1.1}s"/>`).join(""); }
  const pl = Array.from({ length: Math.min(5, T.plantas) }, (_, i) => { const px = x + [-38, 36, -50, 48, -26][i], py = y + [4, 6, -2, 0, 9][i]; return `<g fill="${col}" fill-opacity=".7">${jdBlade(px, py, -120, 11)}${jdBlade(px, py, -60, 11)}${jdBlade(px, py, -90, 8)}</g>`; }).join("");
  const drops = fx ? `<g class="jd-drops">${[-14, 0, 14].map((d, i) => `<ellipse cx="${x + d}" cy="${y - Math.max(30, H)}" rx="2.4" ry="4" style="animation-delay:${i * .18}s"/>`).join("")}</g>` : "";
  const lx = A.lx ?? x, ly = A.ly ?? y + 22, an = A.an || "middle", sx = an === "start" ? lx - 16 : an === "end" ? lx + 16 : lx - 46;
  return `<g class="jd-hot jd-tree${sel ? " on" : ""}${T.dorm ? " jd-dorm" : ""}" data-act="jdsel" data-k="arv:${pid}" role="button" tabindex="0" aria-label="${esc(A.nome)} de ${esc(J_PIL[pid].nome)}: ${T.nome}" data-tip="${esc(A.nome)} · ${esc(J_PIL[pid].nome)} · ${T.nome}${T.dorm ? " (dormindo)" : ""}">
    <rect x="${x - 62}" y="${y - Math.max(48, H + 14)}" width="124" height="${Math.max(48, H + 14) + 14}" fill="transparent"/>${g}<g class="${T.dorm ? "" : "jd-sway"}" style="--d:${(4.4 + J_ORDER.indexOf(pid) * .7).toFixed(1)}s">${cv}</g>${pl}${drops}
    ${jdSeal(sx, ly - 4, pid, .9)}<text x="${lx}" y="${ly}" text-anchor="${an}" class="jd-lbl">${esc(J_PIL[pid].nome)}</text><text x="${lx}" y="${ly + 13}" text-anchor="${an}" class="jd-sub">${esc(A.nome)} · ${T.nome}</text></g>`;
}
function jdTemploSVG() {
  /* pavilhão chinês no olho do yang: plataforma, piso e altar, quatro colunas, porta da lua, telhado de beirais curvos, vitral redondo, sino */
  const D = jdData().templo, fx = JD.fx?.k === "build" ? JD.fx.id : "", c = id => D[id] ? `jd-t-on${fx === id ? " jd-pop" : ""}` : "jd-ghost", sel = JD.sel === "templo", lock = !jdCamOpen("escada");
  let g = `<circle cx="500" cy="350" r="64" class="jd-eye" filter="url(#jdwash)"/>`;
  g += `<g class="${c("alicerce")}"><path d="M436 400L564 400L556 414L444 414Z" class="jd-stone"/><path d="M484 414h32M480 419h40M476 424h48" class="jd-step"/></g>`;
  g += `<g class="${c("piso")}"><rect x="444" y="392" width="112" height="8" class="jd-wood"/></g>`;
  [["esp", 452], ["med", 474], ["tao", 521], ["bud", 543]].forEach(([pid, x]) => { g += `<g class="${c("col_" + pid)}"><rect x="${x}" y="350" width="5.5" height="42" class="jd-col"/><rect x="${x - 2}" y="346" width="9.5" height="5" style="${D["col_" + pid] ? `fill:${J_PIL[pid].cor}` : ""}" class="jd-cap"/></g>`; });
  g += `<g class="${c("portal")}"><circle cx="500" cy="374" r="15" class="jd-door"/></g>`;
  if (D.piso) g += `<g class="${jdChama() ? "jd-flame" : "jd-ember"}"><rect x="495" y="383" width="10" height="9" class="jd-altar"/><path d="M500 382c-5-5-3-10 0-15c3 5 5 10 0 15Z"/></g>`;
  g += `<g class="${c("telhado")}"><path d="M426 340C452 340 476 330 500 312C524 330 548 340 574 340C568 345 566 348 560 350L440 350C434 348 432 345 426 340Z" class="jd-roof"/><path d="M426 340q-6-6-4-12M574 340q6-6 4-12" class="jd-eave"/><path d="M494 312h12" class="jd-eave"/></g>`;
  const vit = D.vitral ? J_ORDER.flatMap((pid, k) => J_PIL[pid].est.map((e, i) => `<path d="${jPetal(1.5, 8, 2.4)}" transform="translate(500 332) rotate(${(k * 5 + i) * 18})" style="fill:${J_PIL[pid].cor};fill-opacity:${J_FILL[jEstV(pid, e.id)]};stroke:${J_PIL[pid].cor};stroke-width:.5"/>`)).join("") : "";
  g += `<g class="${c("vitral")}"><circle cx="500" cy="332" r="9.5" class="jd-glass"/>${vit}</g>`;
  g += `<g class="${c("sino")}"><line x1="568" y1="344" x2="568" y2="356" class="jd-cord"/><path d="M562 366q0-11 6-11t6 11Z" class="jd-bell"/></g>`;
  const n = JD_TEMPLO.filter(t => D[t.id]).length;
  return `<g class="jd-hot jd-templo${sel ? " on" : ""}${lock ? " jd-lockd" : ""}" data-act="jdsel" data-k="templo" role="button" tabindex="0" aria-label="Templo: ${n} de ${JD_TEMPLO.length} partes" data-tip="Templo · ${n} de ${JD_TEMPLO.length} partes"><circle cx="500" cy="358" r="72" fill="transparent"/>${g}</g>`;
}
function jdScene() {
  const sky = jdSky(), R = jdRio(), T = Object.fromEntries(J_ORDER.map(p => [p, jdTree(p)])), D = jdData(), st = jdStock(), night = sky === "noite";
  const RIVER = "M500 200A150 150 0 0 1 500 500A150 150 0 0 0 500 800";
  let g = `<defs>
    <filter id="jdink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5"/></filter>
    <filter id="jdwash" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="16" result="d"/><feGaussianBlur in="d" stdDeviation="2.4"/></filter>
    <filter id="jdblur" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="jdgrain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .24  0 0 0 .09 0"/></filter>
    <radialGradient id="jdyin" cx="62%" cy="58%" r="70%"><stop offset="0" stop-color="${INK}" stop-opacity=".9"/><stop offset=".6" stop-color="${INK}" stop-opacity=".74"/><stop offset="1" stop-color="${INK}" stop-opacity=".5"/></radialGradient>
    <radialGradient id="jdyang" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#e9dcc2"/></radialGradient></defs>`;
  g += `<rect width="1000" height="1000" fill="${PAPER}"/><rect width="1000" height="1000" filter="url(#jdgrain)"/>`;
  /* nuvens auspiciosas e o sol ou a lua, fora do círculo */
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" class="jd-cloud">${jdStroke("M0 0c0-14 20-14 20 0c0-18 28-18 28 0c0-12 18-12 18 0M6 0c0 6 8 6 8 0M30 0c0 7 10 7 10 0", 2.2, .45)}</g>`;
  g += cloud(54, 132, 1.2) + cloud(840, 900, 1.1) + cloud(70, 905, .9) + cloud(780, 70, .8);
  let top = "";
  if (night || sky === "aurora") top += Array.from({ length: 26 }, (_, i) => { const a = jdR(i, 1) * 6.283, r = 478 + jdR(i, 2) * 220, x = 500 + Math.cos(a) * r, y = 500 + Math.sin(a) * r; return x < 0 || x > 1000 || y < 0 || y > 1000 ? "" : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(.8 + jdR(i, 3)).toFixed(1)}" class="jd-star" style="animation-delay:${(jdR(i, 4) * 3).toFixed(1)}s"/>`; }).join("");
  if (night || sky === "aurora" || sky === "entardecer") { const f = jdMoonF(), ill = (1 - Math.cos(2 * Math.PI * f)) / 2;
    top += `<g class="jd-moon" data-tip="Lua de hoje: ${f < .03 || f > .97 ? "nova" : f < .22 ? "crescente" : f < .28 ? "quarto crescente" : f < .47 ? "gibosa crescente" : f < .53 ? "cheia" : f < .72 ? "gibosa minguante" : f < .78 ? "quarto minguante" : "minguante"} (${Math.round(ill * 100)}% iluminada)"><circle cx="925" cy="78" r="34" fill="#fdf6d8" opacity=".16" filter="url(#jdblur)"/>${jMoon(ill, 24, "#fdf6d8").replace(/^<svg[^>]*>/, `<svg x="899" y="52" width="52" height="52" viewBox="0 0 51 51">`)}</g>`; }
  else g += `<circle cx="925" cy="80" r="30" fill="${SEAL}" fill-opacity=".82" filter="url(#jdwash)" class="jd-sun"/>`;
  /* título vertical e selo do jardim */
  g += `<text x="38" y="300" class="jd-title" transform="rotate(90 38 300)">jardim interior</text>${jdSeal(38, 262, "tao", 1.1)}`;
  /* anel enso e o caminho circular */
  g += `<circle cx="500" cy="500" r="468" fill="none" stroke="${INK}" stroke-width="13" stroke-opacity=".82" stroke-dasharray="2700 240" stroke-linecap="round" transform="rotate(-62 500 500)" filter="url(#jdink)"/><circle cx="500" cy="500" r="458" fill="none" stroke="${INK}" stroke-width="3" stroke-opacity=".35" stroke-dasharray="40 14 90 22 160 30" filter="url(#jdink)"/>`;
  /* yin e yang */
  g += `<circle cx="500" cy="500" r="302" fill="url(#jdyang)"/><path d="M500 200A300 300 0 0 1 500 800A150 150 0 0 1 500 500A150 150 0 0 0 500 200Z" fill="url(#jdyin)" filter="url(#jdwash)" class="jd-yin"/>`;
  g += `<circle cx="500" cy="500" r="301" fill="none" stroke="${INK}" stroke-width="4" stroke-opacity=".7" filter="url(#jdink)"/>`;
  /* caminhos (o circular é o bosque) */
  for (const c of JD_CAM) { const op = jdCamOpen(c.id), rd = !op && jdCamReady(c), cls = op ? "jd-cam" : rd ? "jd-cam jd-ready" : "jd-cam jd-off", [a, b] = c.prog();
    g += `<g class="jd-hot${JD.sel === "cam:" + c.id ? " on" : ""}${JD.fx?.k === "cam" && JD.fx.id === c.id ? " jd-open" : ""}" data-act="jdsel" data-k="cam:${c.id}" role="button" tabindex="0" aria-label="${esc(c.nome)}: ${op ? "aberto" : rd ? "pronto para abrir" : `fechado, ${Math.min(a, b)} de ${b}`}" data-tip="${esc(c.nome)} · ${op ? "aberto" : rd ? "pronto para abrir" : `${c.t} (${Math.min(a, b)} de ${b})`}"><path d="${c.d}" class="jd-hitw"/><path d="${c.d}" class="jd-cambed"/><path d="${c.d}" class="${cls}"/></g>`; }
  g += `<path d="M234 766L272 728" class="jd-cambed"/><path d="M234 766L272 728" class="jd-cam"/>`;
  /* o rio no S, entre as forças opostas */
  const w = 10 + 14 * R.f;
  g += `<g class="jd-hot jd-rio${JD.sel === "rio" ? " on" : ""}" data-act="jdsel" data-k="rio" role="button" tabindex="0" aria-label="Rio: ${R.st}" data-tip="Rio · ${R.st} · ${R.n} de 14 noites de exame"><path d="${RIVER}" class="jd-hitw"/><path id="jdriver" d="${RIVER}" class="jd-water" style="stroke-width:${w.toFixed(1)}" filter="url(#jdwash)"/>${R.n ? `<path d="${RIVER}" class="jd-flow" style="stroke-width:${(w * .35).toFixed(1)};animation-duration:${(7 - 5 * R.f).toFixed(1)}s"/>` : ""}${[0, 1, 2].map(i => `<path d="M${492 + i * 4} ${215 + i * 8}q8 -4 16 0" class="jd-ripple"/>`).join("")}</g>`;
  /* olho do yin: lago de lótus */
  const nl = jdLotus();
  g += `<g class="jd-hot jd-lago${JD.sel === "lago" ? " on" : ""}" data-act="jdsel" data-k="lago" role="button" tabindex="0" aria-label="Lago de lótus: ${nl} de 7 flores" data-tip="Lago de lótus · ${nl} de 7 flores esta semana"><circle cx="500" cy="650" r="62" class="jd-pondeye" filter="url(#jdwash)"/>
    ${Array.from({ length: 7 }, (_, i) => { const a = i / 7 * 6.283 + .4, r = i === 6 ? 0 : 36, lx = 500 + Math.cos(a) * r, ly = 650 + Math.sin(a) * r * .8; return `<g><ellipse cx="${lx.toFixed(0)}" cy="${ly.toFixed(0)}" rx="12" ry="7" class="jd-pad" filter="url(#jdink)"/><path d="M${lx.toFixed(0)} ${ly.toFixed(0)}l10 -3" stroke="${PAPER}" stroke-width="1.4"/>${i < nl ? `<g class="jd-lotus" style="animation-delay:${i * .25}s"><path d="M${lx.toFixed(0)} ${(ly - 2).toFixed(0)}c-9-3-10-12-9-15c4 1 7 6 9 10c2-4 5-9 9-10c1 3 0 12-9 15Z"/><path d="M${lx.toFixed(0)} ${(ly - 2).toFixed(0)}c-3-4-3-11 0-16c3 5 3 12 0 16Z" class="jd-lc"/></g>` : ""}</g>`; }).join("")}</g>`;
  /* centro: a ponte atravessa o rio e a Bússola marca o ponto de equilíbrio */
  if (jdCamOpen("ponte")) g += `<g class="jd-bridge"><path d="M440 506Q470 486 500 486Q530 486 560 506" class="jd-arch"/><path d="M440 506H560" class="jd-deck"/></g>`;
  else g += `<path d="M440 506Q470 486 500 486Q530 486 560 506" class="jd-arch jd-ruin"/>`;
  const v = bmDayValue(), ang = { norte: -90, leste: 0, sul: 90, oeste: 180, centro: -90 }[v.ax];
  g += `<g class="jd-hot jd-plaza${JD.sel === "praca" ? " on" : ""}" data-act="jdsel" data-k="praca" role="button" tabindex="0" aria-label="Bússola no centro: valor do dia, ${esc(v.nome)}" data-tip="Bússola · valor do dia: ${esc(v.nome)}"><circle cx="500" cy="500" r="34" class="jd-mosaic" filter="url(#jdink)"/><circle cx="500" cy="500" r="24" class="jd-mosaic2"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a % 90 ? 17 : 29, t = (a - 90) * Math.PI / 180; return `<path d="M500 500L${(500 + Math.cos(t - .16) * 7).toFixed(1)} ${(500 + Math.sin(t - .16) * 7).toFixed(1)}L${(500 + Math.cos(t) * r).toFixed(1)} ${(500 + Math.sin(t) * r).toFixed(1)}L${(500 + Math.cos(t + .16) * 7).toFixed(1)} ${(500 + Math.sin(t + .16) * 7).toFixed(1)}Z" class="jd-rose${a % 90 ? " sm" : ""}"/>`; }).join("")}
    <g class="jd-needle" style="transform:rotate(${ang + 90}deg)"><path d="M500 474L504 500L500 505L496 500Z" fill="${SEAL}"/></g></g>`;
  /* noroeste: a pedreira (pedras de estudioso e pedras brutas) */
  const brutas = D.pedras.filter(p => !p.lav), POS = [[150, 282], [212, 300], [268, 268], [300, 214], [116, 222]];
  g += `<g class="jd-hot jd-quarry${JD.sel === "pedreira" ? " on" : ""}" data-act="jdsel" data-k="pedreira" role="button" tabindex="0" aria-label="Pedreira: ${plural(brutas.length, "pedra bruta", "pedras brutas")}" data-tip="Pedreira · ${plural(brutas.length, "pedra bruta", "pedras brutas")} · ${plural(Math.max(0, st.pedras), "lavrada", "lavradas")} no estoque">
    <path d="M150 248C132 210 150 176 136 146C150 118 182 120 192 100C214 110 222 140 238 152C252 182 230 206 244 236C226 254 180 260 150 248Z" class="jd-rockw" filter="url(#jdwash)"/>${jdStroke("M150 248C132 210 150 176 136 146C150 118 182 120 192 100C214 110 222 140 238 152C252 182 230 206 244 236", 3, .8)}
    <ellipse cx="178" cy="160" rx="9" ry="13" class="jd-hole"/><ellipse cx="206" cy="196" rx="7" ry="10" class="jd-hole"/><ellipse cx="170" cy="214" rx="6" ry="5" class="jd-hole"/>${jdStroke("M224 170q10 20 0 44M150 190q-6 14 4 30", 1.6, .5)}
    ${Array.from({ length: Math.min(12, Math.max(0, st.pedras)) }, (_, i) => `<rect x="${60 + (i % 3) * 17}" y="${300 - Math.floor(i / 3) * 10}" width="15" height="8.5" class="jd-block"/>`).join("")}<text x="190" y="88" text-anchor="middle" class="jd-lbl">Pedreira</text></g>`;
  brutas.slice(0, 5).forEach((p, i) => { const [x, y] = POS[i], k = jdMarks(p).length, pts = Array.from({ length: 7 }, (_, j) => { const a = j / 7 * 6.283, r = 13 + jdR(j, p.id.length + i) * 7 - k * 1.5; return `${(x + Math.cos(a) * r * 1.2).toFixed(1)},${(y + Math.sin(a) * r * .8).toFixed(1)}`; }).join(" ");
    g += `<g class="jd-hot jd-raw${JD.sel === "ped:" + p.id ? " on" : ""}${JD.fx?.id === p.id ? " jd-hit" : ""}" data-act="jdsel" data-k="ped:${p.id}" role="button" tabindex="0" aria-label="Pedra bruta: ${esc(p.nome)}, ${k} de 3 golpes" data-tip="${esc(p.nome)} · ${Math.min(k, 3)} de 3 golpes"><polygon points="${pts}" class="jd-rock" filter="url(#jdink)"/>${k >= 3 ? `<circle cx="${x}" cy="${y}" r="22" class="jd-ready-ring"/>` : ""}<text x="${x}" y="${y + 26}" text-anchor="middle" class="jd-sub">${esc(trunc(p.nome, 14))}</text></g>`; });
  /* nordeste: o mirante sobre montanhas na névoa */
  g += `<g class="jd-hot jd-mir${JD.sel === "mirante" ? " on" : ""}" data-act="jdsel" data-k="mirante" role="button" tabindex="0" aria-label="Mirante" data-tip="Mirante · a mandala e a bússola vistas do alto">
    <path d="M700 250C730 200 750 160 778 130C796 160 806 190 836 220C850 236 868 244 880 252Z" class="jd-mnt2" filter="url(#jdwash)"/><path d="M736 268C760 236 786 210 808 176C828 214 846 240 872 270Z" class="jd-mnt" filter="url(#jdwash)"/>${jdStroke("M778 130C796 160 806 190 836 220M808 176C828 214 846 240 872 270", 2.2, .7)}
    <path d="M726 238h140M712 256h120" class="jd-mist"/><g transform="translate(778 122)"><path d="M-12 0q12-6 24 0" class="jd-eave"/><line x1="-7" y1="0" x2="-7" y2="8" class="jd-cord"/><line x1="7" y1="0" x2="7" y2="8" class="jd-cord"/><circle cx="0" cy="4" r="3" class="jd-mini"/></g><text x="822" y="296" text-anchor="middle" class="jd-lbl">Mirante</text></g>`;
  /* sudeste: a oficina, com toras e tábuas */
  g += `<g class="jd-hot jd-shop${JD.sel === "oficina" ? " on" : ""}${JD.fx?.k === "talho" ? " jd-hit" : ""}" data-act="jdsel" data-k="oficina" role="button" tabindex="0" aria-label="Oficina: ${plural(st.toras, "tora", "toras")} e ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}" data-tip="Oficina · ${plural(st.toras, "tora", "toras")} · ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}"><rect x="690" y="700" width="230" height="200" fill="transparent"/>
    <path d="M770 760L812 730L854 760Z" class="jd-thatch" filter="url(#jdwash)"/>${jdStroke("M766 762C790 752 800 740 812 730C824 740 834 752 858 762", 3.2, .85)}<line x1="778" y1="762" x2="778" y2="800" class="jd-post"/><line x1="846" y1="762" x2="846" y2="800" class="jd-post"/><rect x="792" y="782" width="40" height="5" class="jd-wood"/>
    ${Array.from({ length: Math.min(10, st.toras) }, (_, i) => { const row = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3, k = i - [0, 4, 7, 9][row], cx = 716 + k * 14 + row * 7, cy = 846 - row * 12; return `<circle cx="${cx}" cy="${cy}" r="7" class="jd-log" filter="url(#jdink)"/><circle cx="${cx}" cy="${cy}" r="2.6" class="jd-ring"/>`; }).join("")}
    ${Array.from({ length: Math.min(8, Math.max(0, st.tabuas)) }, (_, i) => `<rect x="808" y="${846 - i * 5.5}" width="56" height="4.5" class="jd-plank"/>`).join("")}<text x="790" y="880" text-anchor="middle" class="jd-lbl">Oficina</text></g>`;
  /* sudoeste: o portão da lua */
  g += `<g class="jd-hot jd-gate${JD.sel === "portao" ? " on" : ""}" data-act="jdsel" data-k="portao" role="button" tabindex="0" aria-label="Portão da lua: como o jardim funciona" data-tip="Portão da lua · como o jardim funciona"><rect x="150" y="750" width="120" height="120" fill="transparent"/>
    <path d="M160 790h104v60h-104Z" class="jd-wall" filter="url(#jdink)"/><path d="M154 790q58 -10 116 0" class="jd-eave"/><circle cx="212" cy="824" r="22" class="jd-moongate"/>${jdStroke("M190 846a22 22 0 1 1 44 0", 2.4, .85)}<text x="212" y="886" text-anchor="middle" class="jd-lbl">Portão da lua</text></g>`;
  /* os quatro pilares, nos pontos cardeais */
  for (const pid of J_ORDER) g += jdTreeSVG(T[pid], JD.fx?.k === "rega" && JD.fx.id === pid);
  g += jdTemploSVG();
  /* névoa sobre o que ainda está fechado */
  const FOG = { margem: [[500, 650, 80, 72]], ponte: [[196, 220, 120, 110], [790, 800, 120, 100]], escada: [[500, 352, 92, 84]], mirante: [[800, 210, 105, 90]] };
  for (const [cam, es] of Object.entries(FOG)) if (!jdCamOpen(cam)) g += `<g class="jd-fogg"><g filter="url(#jdblur)">${es.map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="jd-fog" style="animation-delay:${i * 1.3}s"/>`).join("")}</g><g transform="translate(${es[0][0] - 8} ${es[0][1] - 10})" class="jd-lock"><rect x="0" y="8" width="16" height="12" rx="2"/><path d="M3 8V5a5 5 0 0 1 10 0V8" fill="none"/></g></g>`;
  /* vagalumes ou borboletas: as noites de exame da semana */
  const nv = jdVaga();
  if (night) g += `<rect width="1000" height="1000" class="jd-nightveil"/>`;
  if (sky === "entardecer") g += `<rect width="1000" height="1000" class="jd-duskveil"/>`;
  g += top + Array.from({ length: nv }, (_, i) => { const a = jdR(i, 11) * 6.283, r = 120 + jdR(i, 12) * 200, x = 500 + Math.cos(a) * r, y = 500 + Math.sin(a) * r; return night || sky === "entardecer" ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.8" class="jd-fly" style="animation-delay:${(i * .7).toFixed(1)}s"/>` : `<g class="jd-bfly" style="animation-delay:${(i * .9).toFixed(1)}s"><path d="M${x.toFixed(0)} ${y.toFixed(0)}l-7-6q-2 7 7 6l7-6q2 7-7 6Z"/></g>`; }).join("");
  return `<div class="jdscene">${svgWrap(1000, 1000, g, `Jardim interior em forma de yin-yang: ${J_ORDER.map(p => `${JD_ARV[p].nome} (${J_PIL[p].nome}) ${T[p].nome}`).join(", ")}; rio ${R.st}; templo com ${JD_TEMPLO.filter(t => D.templo[t.id]).length} de ${JD_TEMPLO.length} partes`, "chart jdsvg sky-" + sky)}</div>`;
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
    return `<h3 style="color:${P.cor}">${ic(P.ico)}${esc(A.nome)} · ${esc(P.nome)}</h3><p class="muted">${esc(A.sim)}</p>
      <div class="jdstat"><b>${T.nome}</b>${T.prox ? `<span>faltam ${T.falta} pontos para ${T.prox}</span>` : "<span>estágio máximo</span>"}</div><div class="jdbar" style="--c:${P.cor}"><i style="width:${Math.round(100 * T.pr)}%"></i></div>
      <table class="dt jdtab"><tbody>${T.parts.map(([l, v, mx]) => `<tr><td>${esc(l)}</td><td class="num">${v} / ${mx}</td></tr>`).join("")}<tr><th>crescimento</th><th class="num">${T.g}</th></tr></tbody></table>
      <p class="small">${T.dorm ? `${ic("moon")}<b>Dormindo:</b> nenhum dia com ${esc(P.nome)} nas últimas 2 semanas. Ela não morre; acorda com o primeiro cuidado.` : `${ic("leaf")}<b>Verde:</b> ${plural(T.dias, "dia", "dias")} com ${esc(P.nome)} nas últimas 2 semanas (7 já deixam a copa plena).`}<br>${ic("star")}<b>Frutos:</b> ${plural(T.frutos, "reflexão", "reflexões")} em 30 dias.${T.plantas ? ` <b>Mudas ao pé:</b> ${plural(T.plantas, "prática ativa", "práticas ativas")}.` : ""}</p>
      <div class="flbl">Regar com uma reflexão</div><p class="bmq">${ic("info")}<span>${esc(q)}</span></p>
      <textarea class="jta" rows="3" data-jdt="rega:${id}" placeholder="Escreva o que essa pergunta desperta. Vai para as reflexões de ${esc(P.nome)}.">${esc(JD.txt["rega:" + id] || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdrega" data-p="${id}">${ic("leaf")}Regar</button><a class="btn sm ghost" href="#jornada.${P.sub}">${ic("arrow")}Abrir o pilar</a></div>`;
  }
  if (area === "rio") {
    const R = jdRio(), nf = D.folhas.length, hoje = D.folhas.filter(f => f.data === TODAY).length;
    return `<h3>${ic("wave")}O rio</h3><p class="muted">Corre com as noites de exame da Bússola: consciência que volta todos os dias ao próprio leito.</p>
      <div class="jdstat"><b>${R.st}</b><span>${R.n} de 14 noites com exame</span></div><div class="jdbar" style="--c:#4f9fd8"><i style="width:${Math.round(100 * R.f)}%"></i></div>
      ${jdEns(JD_ENS.rio)}<a class="btn sm" href="#jornada.exame">${ic("moon")}Fazer o exame da noite</a>
      <div class="flbl">Soltar uma folha</div><p class="small muted">Escreva o que você entrega ao rio: uma mágoa, uma preocupação, um apego. A folha leva o texto embora: ele <b>não é guardado</b> em lugar nenhum, só a data.</p>
      <textarea class="jta" rows="2" id="jd_folha" data-jdt="folha" placeholder="O que eu solto hoje…">${esc(JD.txt.folha || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdfolha">${ic("leaf")}Soltar no rio</button><span class="muted small">${plural(nf, "folha solta", "folhas soltas")}${hoje ? `, ${hoje} hoje` : ""}</span></div>${jdEns(JD_ENS.folha)}`;
  }
  if (area === "lago") { const n = jdLotus(), ss = jData().sess.filter(x => x.data >= addDays(TODAY, -6) && (x.pid === "med" || x.pid === "bud"));
    return `<h3>${ic("lotus")}O lago de lótus</h3><p class="muted">Uma flor para cada dia da última semana com sessão de meditação ou de prática budista.</p><div class="jdstat"><b>${n} de 7 flores</b><span>${plural(ss.length, "sessão", "sessões")}, ${sum(ss.map(x => +x.min || 0))} min</span></div>
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
    return `<h3>${ic("box")}A pedreira</h3><p class="muted">Cada pedra bruta é uma inclinação que você decidiu trabalhar (a reforma íntima). Ela vira pedra lavrada depois de três dias em que você a percebeu e agiu, e as pedras lavradas constroem o templo.</p>
      <div class="jdstat"><b>${plural(br.length, "pedra bruta", "pedras brutas")}</b><span>${plural(lv.length, "lavrada", "lavradas")} ao todo · ${plural(Math.max(0, st.pedras), "no estoque", "no estoque")}</span></div>
      ${br.length ? `<div class="jdlist">${br.map(x => `<button type="button" class="jdli" data-act="jdsel" data-k="ped:${x.id}"><b>${esc(x.nome)}</b><small>${Math.min(3, jdMarks(x).length)} de 3</small></button>`).join("")}</div>` : ""}
      <div class="flbl">Extrair uma pedra</div>${br.length >= 5 ? `<p class="small muted">Cinco pedras brutas de uma vez já é muito: lavre uma antes de extrair outra.</p>` : `<div class="form f1"><label>Inclinação a trabalhar<input type="text" maxlength="40" data-jdt="pnome" value="${esc(JD.txt.pnome || "")}" placeholder="impaciência, maledicência, orgulho…"></label>
      <label>Valor-antídoto (opcional)<select data-jdt="pval"><option value="">nenhum</option>${BM_V.map(v => `<option value="${v.id}"${JD.txt.pval === v.id ? " selected" : ""}>${esc(v.nome)}</option>`).join("")}</select></label></div><button type="button" class="btn sm primary" data-act="jdpedra">${ic("plus")}Extrair</button>`}
      ${jdEns(JD_ENS.pedra)}`;
  }
  if (area === "oficina") {
    const tl = D.talhos.slice().reverse().slice(0, 5), pid = JD.txt.tpid || "med";
    return `<h3>${ic("brief")}A oficina</h3><p class="muted">A madeira bruta vem das sessões de prática: cada sessão registrada é uma tora. Três toras e uma frase sobre o que a prática está esculpindo em você viram uma tábua (e a frase vira um aprendizado no pilar).</p>
      <div class="jdstat"><b>${plural(st.toras, "tora", "toras")}</b><span>${plural(Math.max(0, st.tabuas), "tábua", "tábuas")} no estoque · ${plural(D.talhos.length, "talhada", "talhadas")} ao todo</span></div>
      <div class="flbl">Talhar uma tábua</div><div class="form f1"><label>Pilar<select data-jdt="tpid">${J_ORDER.map(p => `<option value="${p}"${p === pid ? " selected" : ""}>${esc(J_PIL[p].nome)}</option>`).join("")}</select></label></div>
      <textarea class="jta" rows="2" data-jdt="talho" placeholder="O que a prática está esculpindo em mim?">${esc(JD.txt.talho || "")}</textarea>
      <div class="row wrap"><button type="button" class="btn sm primary" data-act="jdtalho"${st.toras >= 3 ? "" : " disabled"}>${ic("edit")}Talhar (3 toras)</button>${st.toras < 3 ? `<a class="btn sm ghost" href="#jornada.praticas">${ic("plus")}Registrar uma sessão</a>` : ""}</div>
      ${tl.length ? `<ul class="jdmarks">${tl.map(t => { const r = jP(t.pid).refl.find(x => x.id === t.refl); return `<li><small>${fmtD(t.data)}</small><span style="color:${J_PIL[t.pid].cor}">${esc(J_PIL[t.pid].nome)}</span><span>${esc(trunc(r?.texto || "", 90))}</span></li>`; }).join("")}</ul>` : ""}${jdEns(JD_ENS.madeira)}`;
  }
  if (area === "templo") {
    const T = D.templo;
    return `<h3>${ic("house")}O templo</h3><p class="muted">Construído em ordem, com o que você lavrou e talhou. Algumas partes pedem algo da jornada.</p>
      <div class="jdstat"><b>${JD_TEMPLO.filter(t => T[t.id]).length} de ${JD_TEMPLO.length} partes</b><span>estoque: ${plural(Math.max(0, st.pedras), "pedra", "pedras")} · ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}</span></div>
      ${T.piso ? `<p class="small">${ic("flame")}A chama do altar está <b>${jdChama() ? "acesa" : "apagada"}</b>: ela acende quando há exame da noite hoje ou ontem.</p>` : ""}
      <ol class="jdparts">${JD_TEMPLO.map(t => { const c = jdCan(t); return `<li class="${T[t.id] ? "ok" : c.ok ? "can" : ""}"><div><b>${esc(t.nome)}</b><small>${t.p ? plural(t.p, "pedra", "pedras") : ""}${t.p && t.m ? " + " : ""}${t.m ? plural(t.m, "tábua", "tábuas") : ""}</small></div>
        ${T[t.id] ? `<details><summary>${ic("check")}construído ${fmtD(T[t.id])}</summary><p class="small">${esc(t.sim)}</p>${jdEns(t.ens)}</details>` : c.ok ? `<p class="small">${esc(t.sim)}</p><button type="button" class="btn sm primary" data-act="jdbuild" data-id="${t.id}">${ic("plus")}Construir</button>` : `<small class="muted">falta: ${esc(c.falta.join("; "))}</small>`}</li>`; }).join("")}</ol>`;
  }
  if (area === "praca") {
    const v = bmDayValue(), sc = bmScores(28);
    return `<h3>${ic("compass")}A praça da Bússola</h3><p class="muted">No centro do jardim, a rosa dos ventos: os quatro rumos da Bússola moral orientam o jardim. A agulha aponta o rumo do valor do dia.</p>
      <div class="jdstat" style="--c:${bmAx(v.ax).cor}"><b>${esc(v.nome)}</b><span>${esc(bmAx(v.ax).rumo)} · ${esc(bmAx(v.ax).nome)}</span></div><p><b>${esc(v.acao)}</b></p><p class="bmq">${ic("info")}<span>${esc(v.perg)}</span></p>
      <div class="jdaxes">${BM_AX.map(a => { const s = sc.ax[a.id]; return `<div><span style="color:${a.cor}">${esc(a.rumo)}</span><div class="jdbar" style="--c:${a.cor}"><i style="width:${s == null ? 0 : Math.round(100 * s)}%"></i></div><small>${s == null ? "–" : pct(s)}</small></div>`; }).join("")}</div>
      <p class="small muted">Prática de cada rumo nas notas do exame das últimas 4 semanas.</p><div class="row wrap"><a class="btn sm" href="#jornada.exame">${ic("moon")}Exame da noite</a><a class="btn sm ghost" href="#jornada.bussola">${ic("compass")}Abrir a Bússola</a></div>`;
  }
  if (area === "mirante") return `<h3>${ic("eye")}O mirante</h3><p class="muted">Do alto, o jardim inteiro: a mandala mostra as estações dos quatro caminhos; a bússola, os valores.</p>${jMandala({ mini: true })}
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
  return `<p class="lead">Saúde espiritual: um jardim circular, pintado a tinta, em forma de yin-yang. O rio corre no S entre as forças opostas; no olho do yang ergue-se o templo, no olho do yin floresce o lago de lótus, e no centro, onde tudo se equilibra, está a Bússola. Os quatro pilares guardam os pontos cardeais, como na mandala. É ${est}; à noite os vagalumes aparecem e a lua é a de hoje.</p>
    ${kpiRow([kmini("var(--jp-tao)", "Árvores", `${sum(T.map(t => t.s))} de 20`, `estágios somados · ${T.filter(t => t.dorm).length ? `${T.filter(t => t.dorm).length} dormindo` : "todas acordadas"}`), kmini("#4f9fd8", "Rio", R.st, `${R.n} de 14 noites de exame`), kmini("var(--jp-bud)", "Templo", `${nb} de ${JD_TEMPLO.length}`, `${plural(Math.max(0, st.pedras), "pedra", "pedras")} e ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")} no estoque`), kmini("var(--jp-med)", "Caminhos", `${nc} de ${JD_CAM.length}`, JD_CAM.some(c => !jdCamOpen(c.id) && jdCamReady(c)) ? "há um pronto para abrir" : "abrem com marcos da jornada")])}
    <div class="jdlay"><section class="pn jdmain">${jdScene()}<div class="jdplaces" role="toolbar" aria-label="Lugares do jardim">${places.map(([k, l, i]) => `<button type="button" class="chip${JD.sel === k ? " on" : ""}${jdLocked(k) ? " lk" : ""}" data-act="jdsel" data-k="${k}">${ic(jdLocked(k) ? "lock" : i)}${esc(l)}</button>`).join("")}</div></section>
      <aside class="pn jdaside" aria-live="polite">${jdAside()}</aside></div>
    <div class="g2c">${panel(`${ic("clock")}Diário do jardim`, jdJournal())}${panel(`${ic("list")}O jardim e a jornada`, `<table class="dt jdtab"><thead><tr><th>No jardim</th><th>Na jornada</th><th class="num">Agora</th></tr></thead><tbody>
      ${J_ORDER.map(p => { const t = T[J_ORDER.indexOf(p)]; return `<tr><td>${esc(JD_ARV[p].nome)}</td><td>${esc(J_PIL[p].nome)}: estações, reflexões, sessões e notas</td><td class="num">${t.g} pts · ${t.nome}</td></tr>`; }).join("")}
      <tr><td>Rio</td><td>Noites de exame da Bússola, 14 dias</td><td class="num">${R.n}</td></tr><tr><td>Lótus</td><td>Dias com meditação ou Budismo, 7 dias</td><td class="num">${jdLotus()}</td></tr><tr><td>Vagalumes</td><td>Exames, 7 dias</td><td class="num">${jdVaga()}</td></tr>
      <tr><td>Toras</td><td>Sessões de prática (menos 3 por tábua)</td><td class="num">${st.toras}</td></tr><tr><td>Pedras lavradas</td><td>Inclinações trabalhadas em 3 dias</td><td class="num">${st.lav}</td></tr><tr><td>Vitral</td><td>Estações da mandala ao menos brotando</td><td class="num">${jdBrot()} de 20</td></tr></tbody></table>`)}</div>`;
}

/* ---------------------------------------------------------------- ações */
function jdFolhaAnim() {
  const svg = $(".jdsvg"), p = $("#jdriver"); if (!svg || !p) return;
  const ns = "http://www.w3.org/2000/svg", g = document.createElementNS(ns, "g"); g.setAttribute("class", "jd-leaf");
  g.innerHTML = `<path d="M-10 0Q0-7 10 0Q0 7-10 0Z" fill="#c98a2b"/><path d="M-10 0H10" stroke="#7a4f18" stroke-width="1"/>`;
  const an = document.createElementNS(ns, "animateMotion"); an.setAttribute("dur", "5s"); an.setAttribute("fill", "freeze"); an.setAttribute("rotate", "auto"); an.setAttribute("begin", "indefinite"); an.setAttribute("path", p.getAttribute("d")); an.setAttribute("keyPoints", "0.42;1"); an.setAttribute("keyTimes", "0;1"); an.setAttribute("calcMode", "linear");
  g.appendChild(an); svg.appendChild(g); try { an.beginElement(); } catch {} setTimeout(() => g.remove(), 5200);
}
function jdClick(t) {
  const ds = t.dataset, a = ds.act; if (!a?.startsWith("jd")) return false;
  const D = jdData();
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
