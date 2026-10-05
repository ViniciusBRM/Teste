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
  esp: { nome: "Oliveira", x: 105, y: 352, sim: "Árvore da paz: cresce devagar, vive séculos e dá fruto para os outros, como a caridade." },
  med: { nome: "Bambu", x: 238, y: 318, sim: "Oco por dentro e flexível ao vento: a mente que se esvazia e não quebra." },
  tao: { nome: "Pinheiro", x: 135, y: 488, sim: "Verde no inverno: a constância que não força, símbolo taoista de longevidade." },
  bud: { nome: "Figueira-bodhi", x: 282, y: 470, sim: "A árvore sob a qual Siddhartha despertou: sentar-se e ver com clareza." } };
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
  { id: "bosque", nome: "Trilha do bosque", area: "as quatro árvores", t: "aberto desde o começo", prog: () => [1, 1], d: "M430 410 C380 405 330 400 230 395" },
  { id: "margem", nome: "Descida à margem", area: "o rio e o lago de lótus", t: "1 reflexão em qualquer pilar", prog: () => [J_ORDER.reduce((s, p) => s + jP(p).refl.length, 0), 1], d: "M440 440 C460 470 470 485 492 488" },
  { id: "ponte", nome: "Ponte da pedreira", area: "a pedreira e a oficina", t: "3 noites de exame da Bússola", prog: () => [Object.keys(bmEx()).length, 3], d: "M470 405 C520 400 560 396 586 394 L632 392 C680 394 720 405 770 420" },
  { id: "escada", nome: "Escadaria do templo", area: "o templo", t: "1 pedra lavrada", prog: () => [jdData().pedras.filter(p => p.lav).length, 1], d: "M432 368 C440 340 455 310 478 276" },
  { id: "mirante", nome: "Subida ao mirante", area: "a mandala e a bússola vistas do alto", t: "as quatro árvores ao menos em broto", prog: () => [J_ORDER.filter(p => jdTree(p).s >= 1).length, 4], d: "M200 392 C185 330 170 260 120 186" }];
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
function jdLeaf(T, ever) { if (T.dorm) return "#9b9682"; const base = ever ? "#2f7d4f" : jdSeason()[1]; return `color-mix(in srgb,${base} ${Math.round(45 + 55 * T.v)}%,#9b9682)`; }
function jdHour() { return JD.h ?? new Date().getHours(); }
function jdSky() { const h = jdHour(); return h >= 5 && h < 7 ? "aurora" : h >= 7 && h < 17 ? "dia" : h >= 17 && h < 20 ? "entardecer" : "noite"; }
function jdMoonF() { const ph = (((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853 + 29.530588853) % 29.530588853 / 29.530588853; return ph; }

/* ---------------------------------------------------------------- desenho */
const jdR = (s, i) => { const x = Math.sin((s + 1) * 12.9898 + i * 78.233) * 43758.5453; return x - Math.floor(x); };
function jdTreeSVG(T, fx) {
  const pid = T.pid, A = JD_ARV[pid], col = J_PIL[pid].cor, s = T.s, z = [0, 0, 0, .72, .9, 1.04][s], H = 150 * z, x = A.x, y = A.y, leaf = jdLeaf(T, pid === "tao"), sel = JD.sel === "arv:" + pid;
  let g = `<ellipse cx="${x}" cy="${y + 3}" rx="${26 + s * 7}" ry="${6 + s * 1.4}" class="jd-soil"/>`, cv = "", fr = [];
  if (s === 0) g += `<ellipse cx="${x}" cy="${y - 1}" rx="5.5" ry="4" style="fill:${col}" class="jd-seed"/>`;
  else if (s <= 2) { const h = s === 1 ? 22 : 44; cv += `<path d="M${x} ${y}q3 ${-h / 2} 0 ${-h}" class="jd-stem"/>`; for (const k of s === 1 ? [h] : [h * .5, h * .78, h]) for (const sg of [-1, 1]) cv += `<ellipse cx="${x + sg * 9}" cy="${y - k + 2}" rx="10" ry="4.4" transform="rotate(${sg * -30} ${x + sg * 7} ${y - k + 2})" style="fill:${leaf}"/>`; }
  else if (pid === "esp") {
    g += `<path d="M${x - 6} ${y}C${x - 9} ${y - H * .3} ${x + 7} ${y - H * .38} ${x + 1} ${y - H * .56}L${x + 7} ${y - H * .56}C${x + 12} ${y - H * .36} ${x + 2} ${y - H * .26} ${x + 6} ${y}Z" class="jd-trunk"/>`;
    for (const [dx, dy, rx, ry] of [[-24, .6, 32, 20], [22, .64, 33, 21], [0, .82, 36, 23]]) cv += `<ellipse cx="${x + dx * z}" cy="${y - H * dy}" rx="${rx * z}" ry="${ry * z}" style="fill:color-mix(in srgb,${leaf} 72%,#c4cdb4)"/>`;
    fr = [[-26, .6], [20, .66], [-6, .84], [10, .78], [30, .6], [-14, .7], [4, .9], [-30, .66]].map(([dx, dy]) => [x + dx * z, y - H * dy]);
  } else if (pid === "med") {
    const n = s, dxs = [-14, 2, 16, -26, 28], hs = [1, .86, .94, .72, .78];
    for (let i = 0; i < n; i++) { const xx = x + dxs[i] * z, hh = H * hs[i];
      cv += `<line x1="${xx}" y1="${y}" x2="${xx + 2}" y2="${y - hh}" class="jd-bamboo" style="stroke:color-mix(in srgb,${leaf} 60%,#c7b25a);stroke-width:${5.5 * z}"/>`;
      for (let k = 18 * z; k < hh - 6; k += 18 * z) cv += `<line x1="${xx - 3 * z}" y1="${y - k}" x2="${xx + 3 * z + 1}" y2="${y - k}" class="jd-node"/>`;
      for (const r of [-38, 30, -64, 58]) cv += `<ellipse cx="${xx + 2 + Math.sign(r) * 9 * z}" cy="${y - hh + 6}" rx="${13 * z}" ry="${2.6}" transform="rotate(${r} ${xx + 2} ${y - hh + 6})" style="fill:${leaf}"/>`; }
    fr = [[-14, .9], [2, .78], [16, .86], [-26, .64], [28, .7], [-10, .5], [8, .58], [20, .42]].map(([dx, dy]) => [x + dx * z + 6, y - H * dy]);
  } else if (pid === "tao") {
    g += `<rect x="${x - 4 * z}" y="${y - H * .32}" width="${8 * z}" height="${H * .32}" class="jd-trunk"/>`;
    for (const [w, b, t] of [[74, .26, .58], [58, .46, .78], [40, .66, 1]]) cv += `<path d="M${x - w * z / 2} ${y - H * b}L${x} ${y - H * t}L${x + w * z / 2} ${y - H * b}Z" style="fill:${leaf}"/>`;
    fr = [[-18, .32], [16, .34], [-10, .52], [12, .5], [0, .7], [-6, .84], [22, .3], [-24, .3]].map(([dx, dy]) => [x + dx * z, y - H * dy]);
  } else {
    g += `<path d="M${x - 10 * z} ${y}C${x - 6 * z} ${y - H * .3} ${x - 4 * z} ${y - H * .4} ${x - 3} ${y - H * .55}L${x + 3} ${y - H * .55}C${x + 4 * z} ${y - H * .4} ${x + 6 * z} ${y - H * .3} ${x + 10 * z} ${y}Z" class="jd-trunk"/>`;
    for (const dx of [-26, -10, 12, 28]) g += `<line x1="${x + dx * z}" y1="${y - H * .52}" x2="${x + dx * z * 1.1}" y2="${y - H * .08}" class="jd-root"/>`;
    cv += `<path d="M${x} ${y - H * .48}C${x - 70 * z} ${y - H * .5} ${x - 62 * z} ${y - H * 1.02} ${x} ${y - H * .9}C${x + 62 * z} ${y - H * 1.02} ${x + 70 * z} ${y - H * .5} ${x} ${y - H * .48}Z" style="fill:${leaf}"/>`;
    fr = [[-34, .64], [30, .62], [-14, .78], [14, .76], [0, .62], [-40, .74], [38, .74], [0, .86]].map(([dx, dy]) => [x + dx * z, y - H * dy]);
  }
  if (s >= 3) { cv += fr.slice(0, Math.min(8, T.frutos)).map(([fx1, fy]) => `<circle cx="${fx1.toFixed(1)}" cy="${fy.toFixed(1)}" r="3.4" class="jd-fruit" style="fill:${col}"/>`).join("");
    if (s === 5) cv += Array.from({ length: 7 }, (_, i) => { const a = jdR(i, pid.length) * 6.28, r = 24 * z + jdR(i + 3, 2) * 18 * z, cx = x + Math.cos(a) * r, cy = y - H * .7 + Math.sin(a) * r * .6; return `<g class="jd-flower"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" style="fill:color-mix(in srgb,${col} 55%,#fff)"/><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.5" fill="#f6d36b"/></g>`; }).join(""); }
  const pl = Array.from({ length: Math.min(5, T.plantas) }, (_, i) => { const px = x + [-36, 34, -48, 46, -24][i], py = y + [6, 8, -2, 0, 12][i]; return `<g class="jd-plant"><path d="M${px} ${py}v-9" style="stroke:${col}"/><ellipse cx="${px - 4}" cy="${py - 8}" rx="4" ry="2" style="fill:${col}"/><ellipse cx="${px + 4}" cy="${py - 10}" rx="4" ry="2" style="fill:${col}"/></g>`; }).join("");
  const drops = fx ? `<g class="jd-drops">${[-14, 0, 14].map((d, i) => `<ellipse cx="${x + d}" cy="${y - Math.max(30, H)}" rx="2.6" ry="4" style="animation-delay:${i * .18}s"/>`).join("")}</g>` : "";
  return `<g class="jd-hot jd-tree${sel ? " on" : ""}${T.dorm ? " jd-dorm" : ""}" data-act="jdsel" data-k="arv:${pid}" role="button" tabindex="0" aria-label="${esc(A.nome)} de ${esc(J_PIL[pid].nome)}: ${T.nome}" data-tip="${esc(A.nome)} · ${esc(J_PIL[pid].nome)} · ${T.nome}${T.dorm ? " (dormindo)" : ""}">
    <rect x="${x - 50}" y="${y - Math.max(40, H + 10)}" width="100" height="${Math.max(40, H + 10) + 14}" fill="transparent"/>${g}<g class="${T.dorm ? "" : "jd-sway"}" style="--d:${(4.2 + J_ORDER.indexOf(pid) * .7).toFixed(1)}s">${cv}</g>${pl}${drops}
    <text x="${x}" y="${y + 22}" text-anchor="middle" class="jd-lbl">${esc(A.nome)}</text><text x="${x}" y="${y + 34}" text-anchor="middle" class="jd-sub" style="fill:${col}">${T.nome}</text></g>`;
}
function jdTemploSVG() {
  const D = jdData().templo, fx = JD.fx?.k === "build" ? JD.fx.id : "", c = id => D[id] ? `jd-t-on${fx === id ? " jd-pop" : ""}` : "jd-ghost", sel = JD.sel === "templo", lock = !jdCamOpen("escada");
  let g = `<ellipse cx="480" cy="262" rx="128" ry="17" class="jd-plat"/>`;
  g += `<g class="${c("alicerce")}"><rect x="385" y="238" width="190" height="22" class="jd-stone"/>${D.alicerce ? [415, 450, 485, 520, 555].map(x => `<line x1="${x}" y1="238" x2="${x}" y2="260" class="jd-joint"/>`).join("") + `<line x1="385" y1="249" x2="575" y2="249" class="jd-joint"/>` : ""}</g>`;
  g += `<g class="${c("piso")}"><rect x="398" y="226" width="164" height="12" class="jd-wood"/></g>`;
  [["esp", 412], ["med", 452], ["tao", 496], ["bud", 536]].forEach(([pid, x]) => { g += `<g class="${c("col_" + pid)}"><rect x="${x}" y="152" width="12" height="74" class="jd-stone"/><rect x="${x - 3}" y="146" width="18" height="7" style="${D["col_" + pid] ? `fill:${J_PIL[pid].cor}` : ""}" class="jd-cap"/></g>`; });
  g += `<g class="${c("portal")}"><path d="M466 226V190a14 14 0 0 1 28 0V226Z" class="jd-door"/></g>`;
  if (D.piso) g += `<g class="${jdChama() ? "jd-flame" : "jd-ember"}"><rect x="474" y="216" width="12" height="10" class="jd-altar"/><path d="M480 214c-5-5-3-10 0-15c3 5 5 10 0 15Z"/></g>`;
  g += `<g class="${c("telhado")}"><path d="M384 152L480 100L576 152Z" class="jd-roof"/><rect x="390" y="146" width="180" height="8" class="jd-wood"/></g>`;
  const vit = D.vitral ? J_ORDER.flatMap((pid, k) => J_PIL[pid].est.map((e, i) => { const a = (k * 5 + i) * 18 - 90; return `<path d="${jPetal(2, 11, 3)}" transform="translate(480 130) rotate(${a + 90})" style="fill:${J_PIL[pid].cor};fill-opacity:${J_FILL[jEstV(pid, e.id)]};stroke:${J_PIL[pid].cor};stroke-width:.6"/>`; })).join("") : "";
  g += `<g class="${c("vitral")}"><circle cx="480" cy="130" r="13" class="jd-glass"/>${vit}</g>`;
  g += `<g class="${c("sino")}"><line x1="600" y1="240" x2="600" y2="176" class="jd-post"/><line x1="588" y1="176" x2="612" y2="176" class="jd-post"/><path d="M592 196q0-14 8-14t8 14Z" class="jd-bell"/></g>`;
  const n = JD_TEMPLO.filter(t => D[t.id]).length;
  return `<g class="jd-hot jd-templo${sel ? " on" : ""}${lock ? " jd-lockd" : ""}" data-act="jdsel" data-k="templo" role="button" tabindex="0" aria-label="Templo: ${n} de ${JD_TEMPLO.length} partes" data-tip="Templo · ${n} de ${JD_TEMPLO.length} partes"><rect x="370" y="92" width="250" height="180" fill="transparent"/>${g}</g>`;
}
function jdScene() {
  const sky = jdSky(), R = jdRio(), T = Object.fromEntries(J_ORDER.map(p => [p, jdTree(p)])), D = jdData(), st = jdStock(), fx = JD.fx, night = sky === "noite";
  const SKY = { aurora: ["#f6c8a8", "#c9d8f0"], dia: ["#9cc8f0", "#dcecf7"], entardecer: ["#f2a46b", "#f5d6a8"], noite: ["#0e1a3a", "#283a6a"] }[sky];
  const RIVER = "M960 118C900 190 760 232 690 300S604 372 606 420S556 515 612 558S664 610 640 642";
  let g = `<defs><linearGradient id="jdsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[0]}"/><stop offset="1" stop-color="${SKY[1]}"/></linearGradient><filter id="jdblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter><radialGradient id="jdglow"><stop offset="0" stop-color="#fff6b0"/><stop offset="1" stop-color="#fff6b0" stop-opacity="0"/></radialGradient></defs>`;
  g += `<rect width="1000" height="640" fill="url(#jdsky)"/>`;
  let top = "";
  if (night || sky === "aurora") top += Array.from({ length: 34 }, (_, i) => `<circle cx="${(jdR(i, 1) * 1000).toFixed(0)}" cy="${(jdR(i, 2) * 110).toFixed(0)}" r="${(.6 + jdR(i, 3) * 1.1).toFixed(1)}" class="jd-star" style="animation-delay:${(jdR(i, 4) * 3).toFixed(1)}s"/>`).join("");
  if (night || sky === "aurora" || sky === "entardecer") { const f = jdMoonF(), ill = (1 - Math.cos(2 * Math.PI * f)) / 2;
    top += `<g class="jd-moon" data-tip="Lua de hoje: ${f < .03 || f > .97 ? "nova" : f < .22 ? "crescente" : f < .28 ? "quarto crescente" : f < .47 ? "gibosa crescente" : f < .53 ? "cheia" : f < .72 ? "gibosa minguante" : f < .78 ? "quarto minguante" : "minguante"} (${Math.round(ill * 100)}% iluminada)"><circle cx="860" cy="52" r="26" fill="#fdf6d8" opacity=".14"/>${jMoon(ill, 18, "#fdf6d8").replace(/^<svg[^>]*>/, `<svg x="840" y="32" width="40" height="40" viewBox="0 0 39 39">`)}</g>`; }
  else g += `<circle cx="860" cy="58" r="44" fill="url(#jdglow)" opacity=".7"/><circle cx="860" cy="58" r="18" class="jd-sun"/>`;
  g += `<path d="M0 150L90 92L170 132L260 78L350 128L430 96L520 136L610 84L700 130L790 90L880 126L1000 88V180H0Z" class="jd-mnt2"/><path d="M0 172L120 128L230 160L330 120L420 150L540 118L650 156L760 124L880 152L1000 130V200H0Z" class="jd-mnt"/>`;
  g += `<rect x="0" y="168" width="1000" height="472" class="jd-ground"/><ellipse cx="200" cy="420" rx="230" ry="150" class="jd-meadow"/><ellipse cx="110" cy="168" rx="90" ry="40" class="jd-hill"/>`;
  /* rio e lago */
  const w = 12 + 16 * R.f, lago = jdCamOpen("margem");
  g += `<g class="jd-hot jd-rio${JD.sel === "rio" ? " on" : ""}" data-act="jdsel" data-k="rio" role="button" tabindex="0" aria-label="Rio: ${R.st}" data-tip="Rio · ${R.st} · ${R.n} de 14 noites de exame"><path d="${RIVER}" class="jd-hitw"/><path id="jdriver" d="${RIVER}" class="jd-water" style="stroke-width:${w.toFixed(1)}"/>${R.n ? `<path d="${RIVER}" class="jd-flow" style="stroke-width:${(w * .45).toFixed(1)};animation-duration:${(7 - 5 * R.f).toFixed(1)}s"/>` : ""}</g>`;
  const nl = jdLotus();
  g += `<g class="jd-hot jd-lago${JD.sel === "lago" ? " on" : ""}" data-act="jdsel" data-k="lago" role="button" tabindex="0" aria-label="Lago de lótus: ${nl} de 7 flores" data-tip="Lago de lótus · ${nl} de 7 flores esta semana"><ellipse cx="552" cy="502" rx="74" ry="30" class="jd-pond"/>${Array.from({ length: 7 }, (_, i) => { const lx = 500 + i * 17 + jdR(i, 9) * 6, ly = 492 + jdR(i, 7) * 22; return `<ellipse cx="${lx.toFixed(0)}" cy="${ly.toFixed(0)}" rx="7" ry="3.4" class="jd-pad"/>${i < nl ? `<g class="jd-lotus" style="animation-delay:${i * .25}s"><path d="M${lx.toFixed(0)} ${(ly - 1).toFixed(0)}c-9-3-10-12-9-15c4 1 7 6 9 10c2-4 5-9 9-10c1 3 0 12-9 15Z"/><path d="M${lx.toFixed(0)} ${(ly - 1).toFixed(0)}c-3-4-3-11 0-16c3 5 3 12 0 16Z" class="jd-lc"/></g>` : ""}`; }).join("")}</g>`;
  /* caminhos */
  for (const c of JD_CAM) { const op = jdCamOpen(c.id), rd = !op && jdCamReady(c), cls = op ? "jd-cam" : rd ? "jd-cam jd-ready" : "jd-cam jd-off", [a, b] = c.prog();
    g += `<g class="jd-hot${JD.sel === "cam:" + c.id ? " on" : ""}${JD.fx?.k === "cam" && JD.fx.id === c.id ? " jd-open" : ""}" data-act="jdsel" data-k="cam:${c.id}" role="button" tabindex="0" aria-label="${esc(c.nome)}: ${op ? "aberto" : rd ? "pronto para abrir" : `fechado, ${Math.min(a, b)} de ${b}`}" data-tip="${esc(c.nome)} · ${op ? "aberto" : rd ? "pronto para abrir" : `${c.t} (${Math.min(a, b)} de ${b})`}"><path d="${c.d}" class="jd-hitw"/><path d="${c.d}" class="${cls}"/></g>`; }
  g += `<path d="M430 640C430 560 430 500 430 452" class="jd-cam"/>`;
  if (jdCamOpen("ponte")) g += `<g class="jd-bridge"><path d="M584 398Q608 380 634 396" class="jd-arch"/><line x1="586" y1="392" x2="632" y2="390" class="jd-deck"/></g>`;
  else g += `<path d="M584 398Q608 380 634 396" class="jd-arch jd-ruin"/>`;
  /* pedreira e oficina */
  const brutas = D.pedras.filter(p => !p.lav), POS = [[752, 418], [806, 402], [860, 420], [912, 404], [834, 452]];
  g += `<g class="jd-hot jd-quarry${JD.sel === "pedreira" ? " on" : ""}" data-act="jdsel" data-k="pedreira" role="button" tabindex="0" aria-label="Pedreira: ${plural(brutas.length, "pedra bruta", "pedras brutas")}" data-tip="Pedreira · ${plural(brutas.length, "pedra bruta", "pedras brutas")} · ${plural(st.pedras, "lavrada", "lavradas")} no estoque"><path d="M700 380L712 300L768 252L866 240L1000 258V482L900 474L820 462L736 446Z" class="jd-cliff"/><path d="M760 300L800 280M880 270L930 290M720 360L745 340" class="jd-crack"/>
    ${Array.from({ length: Math.min(12, Math.max(0, st.pedras)) }, (_, i) => `<rect x="${928 + (i % 3) * 18}" y="${446 - Math.floor(i / 3) * 10}" width="16" height="9" class="jd-block"/>`).join("")}</g>`;
  brutas.slice(0, 5).forEach((p, i) => { const [x, y] = POS[i], k = jdMarks(p).length, pts = Array.from({ length: 7 }, (_, j) => { const a = j / 7 * 6.283, r = 15 + jdR(j, p.id.length + i) * 7 - k * 1.6; return `${(x + Math.cos(a) * r * 1.2).toFixed(1)},${(y + Math.sin(a) * r * .8).toFixed(1)}`; }).join(" ");
    g += `<g class="jd-hot jd-raw${JD.sel === "ped:" + p.id ? " on" : ""}${JD.fx?.id === p.id ? " jd-hit" : ""}" data-act="jdsel" data-k="ped:${p.id}" role="button" tabindex="0" aria-label="Pedra bruta: ${esc(p.nome)}, ${k} de 3 golpes" data-tip="${esc(p.nome)} · ${Math.min(k, 3)} de 3 golpes"><polygon points="${pts}" class="jd-rock"/>${k >= 3 ? `<circle cx="${x}" cy="${y}" r="24" class="jd-ready-ring"/>` : ""}<text x="${x}" y="${y + 30}" text-anchor="middle" class="jd-sub">${esc(trunc(p.nome, 14))}</text></g>`; });
  g += `<g class="jd-hot jd-shop${JD.sel === "oficina" ? " on" : ""}${JD.fx?.k === "talho" ? " jd-hit" : ""}" data-act="jdsel" data-k="oficina" role="button" tabindex="0" aria-label="Oficina: ${plural(st.toras, "tora", "toras")} e ${plural(st.tabuas, "tábua", "tábuas")}" data-tip="Oficina · ${plural(st.toras, "tora", "toras")} · ${plural(Math.max(0, st.tabuas), "tábua", "tábuas")}"><rect x="740" y="500" width="240" height="120" rx="10" fill="transparent"/><rect x="830" y="538" width="64" height="8" class="jd-wood"/><line x1="836" y1="546" x2="836" y2="570" class="jd-post"/><line x1="888" y1="546" x2="888" y2="570" class="jd-post"/>
    ${Array.from({ length: Math.min(10, st.toras) }, (_, i) => { const row = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3, k = i - [0, 4, 7, 9][row]; return `<circle cx="${770 + k * 15 + row * 7.5}" cy="${590 - row * 13}" r="7.5" class="jd-log"/><circle cx="${770 + k * 15 + row * 7.5}" cy="${590 - row * 13}" r="3" class="jd-ring"/>`; }).join("")}
    ${Array.from({ length: Math.min(8, Math.max(0, st.tabuas)) }, (_, i) => `<rect x="908" y="${594 - i * 6}" width="58" height="5" class="jd-plank"/>`).join("")}<text x="860" y="616" text-anchor="middle" class="jd-lbl">Oficina</text></g>`;
  /* praça da bússola */
  const v = bmDayValue(), ang = { norte: -90, leste: 0, sul: 90, oeste: 180, centro: -90 }[v.ax];
  g += `<g class="jd-hot jd-plaza${JD.sel === "praca" ? " on" : ""}" data-act="jdsel" data-k="praca" role="button" tabindex="0" aria-label="Praça da Bússola: valor do dia, ${esc(v.nome)}" data-tip="Praça da Bússola · valor do dia: ${esc(v.nome)}"><circle cx="430" cy="410" r="44" class="jd-mosaic"/><circle cx="430" cy="410" r="30" class="jd-mosaic2"/>
    ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => { const r = a % 90 ? 22 : 38, t = (a - 90) * Math.PI / 180; return `<path d="M430 410L${(430 + Math.cos(t - .14) * 9).toFixed(1)} ${(410 + Math.sin(t - .14) * 9).toFixed(1)}L${(430 + Math.cos(t) * r).toFixed(1)} ${(410 + Math.sin(t) * r).toFixed(1)}L${(430 + Math.cos(t + .14) * 9).toFixed(1)} ${(410 + Math.sin(t + .14) * 9).toFixed(1)}Z" class="jd-rose${a % 90 ? " sm" : ""}"/>`; }).join("")}
    <g class="jd-needle" style="transform:rotate(${ang + 90}deg)"><path d="M430 380L436 410L430 416L424 410Z" style="fill:${bmAx(v.ax).cor}"/></g><text x="430" y="372" text-anchor="middle" class="jd-sub">N</text><text x="430" y="472" text-anchor="middle" class="jd-lbl">Bússola</text></g>`;
  /* mirante */
  g += `<g class="jd-hot jd-mir${JD.sel === "mirante" ? " on" : ""}" data-act="jdsel" data-k="mirante" role="button" tabindex="0" aria-label="Mirante" data-tip="Mirante · a mandala e a bússola vistas do alto"><rect x="60" y="120" width="110" height="70" fill="transparent"/><path d="M96 170V146L110 134L124 146V170" class="jd-kiosk"/><circle cx="110" cy="152" r="6" class="jd-mini"/><text x="110" y="190" text-anchor="middle" class="jd-lbl">Mirante</text></g>`;
  /* árvores */
  for (const pid of [...J_ORDER].sort((a, b) => JD_ARV[a].y - JD_ARV[b].y)) g += jdTreeSVG(T[pid], JD.fx?.k === "rega" && JD.fx.id === pid);
  g += jdTemploSVG();
  /* portão */
  g += `<g class="jd-hot jd-gate${JD.sel === "portao" ? " on" : ""}" data-act="jdsel" data-k="portao" role="button" tabindex="0" aria-label="Portão: como o jardim funciona" data-tip="Portão · como o jardim funciona"><rect x="396" y="588" width="68" height="52" fill="transparent"/><line x1="404" y1="636" x2="404" y2="596" class="jd-post"/><line x1="456" y1="636" x2="456" y2="596" class="jd-post"/><path d="M396 598Q430 586 464 598" class="jd-gatebar"/><line x1="400" y1="606" x2="460" y2="606" class="jd-post"/></g>`;
  /* névoa sobre o que ainda está fechado */
  const FOG = { margem: [[552, 500, 96, 46]], ponte: [[850, 420, 170, 90], [860, 560, 140, 60]], escada: [[480, 185, 140, 95]], mirante: [[110, 158, 80, 50]] };
  for (const [cam, es] of Object.entries(FOG)) if (!jdCamOpen(cam)) g += `<g class="jd-fogg"><g filter="url(#jdblur)">${es.map(([x, y, rx, ry], i) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" class="jd-fog" style="animation-delay:${i * 1.3}s"/>`).join("")}</g><g transform="translate(${es[0][0] - 8} ${es[0][1] - 10})" class="jd-lock"><rect x="0" y="8" width="16" height="12" rx="2"/><path d="M3 8V5a5 5 0 0 1 10 0V8" fill="none"/></g></g>`;
  /* vagalumes ou borboletas: as noites de exame da semana */
  const nv = jdVaga();
  if (night) g += `<rect width="1000" height="640" class="jd-nightveil"/>`;
  if (sky === "entardecer") g += `<rect width="1000" height="640" class="jd-duskveil"/>`;
  g += top + Array.from({ length: nv }, (_, i) => { const x = 160 + jdR(i, 11) * 420, y = 300 + jdR(i, 12) * 200; return night || sky === "entardecer" ? `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="2.6" class="jd-fly" style="animation-delay:${(i * .7).toFixed(1)}s"/>` : `<g class="jd-bfly" style="animation-delay:${(i * .9).toFixed(1)}s"><path d="M${x.toFixed(0)} ${y.toFixed(0)}l-6-5q-2 6 6 5l6-5q2 6-6 5Z"/></g>`; }).join("");
  return `<div class="jdscene">${svgWrap(1000, 640, g, `Jardim interior: árvores ${J_ORDER.map(p => `${JD_ARV[p].nome} ${T[p].nome}`).join(", ")}; rio ${R.st}; templo com ${JD_TEMPLO.filter(t => D.templo[t.id]).length} de ${JD_TEMPLO.length} partes`, "chart jdsvg sky-" + sky)}</div>`;
}

/* ---------------------------------------------------------------- painéis */
function jdAsks() {
  const out = [], D = jdData(), st = jdStock();
  for (const c of JD_CAM) if (!jdCamOpen(c.id) && jdCamReady(c)) out.push([100, `Abrir: ${c.nome}`, `leva até ${c.area}`, "cam:" + c.id]);
  for (const t of JD_TEMPLO) if (!D.templo[t.id] && jdCamOpen("escada") && jdCan(t).ok) { out.push([90, `Construir: ${t.nome}`, t.sim, "templo"]); break; }
  for (const p of D.pedras) if (!p.lav && jdMarks(p).length >= 3) out.push([85, `Lavrar a pedra: ${p.nome}`, "três golpes já foram dados", "ped:" + p.id]);
  if (!bmEx()[TODAY]) out.push([jdHour() >= 18 ? 75 : 55, "Fazer o exame da noite", `rio ${jdRio().st}: ${jdRio().n} de 14 noites; cada exame o faz correr`, "rio"]);
  const T = J_ORDER.map(jdTree).sort((a, b) => a.v - b.v)[0];
  if (T.v < 1) out.push([60 + (1 - T.v) * 10, `Regar a ${JD_ARV[T.pid].nome}`, T.dorm ? `dorme: nenhum dia com ${J_PIL[T.pid].nome} em 2 semanas` : `${plural(T.dias, "dia", "dias")} com ${J_PIL[T.pid].nome} em 2 semanas`, "arv:" + T.pid]);
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
  const places = [["portao", "Portão", "sprout"], ...J_ORDER.map(p => ["arv:" + p, JD_ARV[p].nome, J_PIL[p].ico]), ["rio", "Rio", "wave"], ["lago", "Lótus", "lotus"], ["praca", "Bússola", "compass"], ["pedreira", "Pedreira", "box"], ["oficina", "Oficina", "brief"], ["templo", "Templo", "house"], ["mirante", "Mirante", "eye"]];
  setTimeout(() => { const sc = $(".jdscene"); if (sc && sc.scrollWidth > sc.clientWidth) { sc.scrollLeft = JD.sx ?? (sc.scrollWidth - sc.clientWidth) / 2; sc.addEventListener("scroll", () => { JD.sx = sc.scrollLeft; }, { passive: true });
    if (JD.center) { const el = sc.querySelector(`[data-k="${JD.sel}"]`); if (el) { const r = el.getBoundingClientRect(), rs = sc.getBoundingClientRect(); sc.scrollLeft += r.left + r.width / 2 - (rs.left + rs.width / 2); JD.sx = sc.scrollLeft; } } } JD.center = false; }, 0);
  setTimeout(() => { if (JD.fx && Date.now() - JD.fx.at > 200) JD.fx = null; if (JD.scroll && innerWidth < 1100) { JD.scroll = false; $(".jdaside")?.scrollIntoView({ block: "start", behavior: "smooth" }); } }, 2200);
  return `<p class="lead">Saúde espiritual: um jardim que é seu e responde ao seu cultivo. Cada árvore é um dos quatro caminhos, o rio é a consciência de cada noite, as pedras são as inclinações que você trabalha, e o templo vai se erguendo com o que você lavra. É ${est}; à noite os vagalumes aparecem e a lua é a de hoje.</p>
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
