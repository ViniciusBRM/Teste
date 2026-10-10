/* ================================================================ Jornada → Espiritismo → Centros de força
   Os chakras lidos à luz da Doutrina Espírita: os sete centros de força do perispírito descritos por André Luiz (coronário,
   cerebral, laríngeo, cardíaco, esplênico, gástrico e genésico), cada um com o chakra correspondente, a função, as virtudes da
   Bússola que o trabalham (leitura do Atlas, não doutrina), o que os seus dados mostram, uma pergunta e as práticas.
   A autoavaliação é semanal (1 a 5). A harmonização guiada, uma prece pelos sete centros, vira uma sessão de prática do
   Espiritismo: aparece em Práticas, no ritmo do pilar, no jardim e nos Cruzamentos.
   Dados: jornada.cf = { av: { segunda-feira: { centro: 1..5 } } }; as sessões ficam em jornada.sess (pilar "esp"). */
const CF_TEC = "Harmonização dos centros de força";
const CF_ESC = ["", "em desarmonia", "inquieto", "oscilando", "sereno", "em harmonia"];
const CF = [
  { id: "cor", nome: "Coronário", chakra: "Sahasrara", local: "alto da cabeça", x: 120, y: 40,
    funcao: "Recebe primeiro os estímulos do Espírito e do plano superior e comanda os demais centros; nele se assenta a ligação com a mente. Associado à epífise, a “glândula da vida mental”.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX; Missionários da Luz, cap. 2",
    val: ["espiritualidade", "humildade", "desprendimento"], prat: ["Prece ao acordar e ao deitar", "Culto do Evangelho no lar"],
    perg: "O que tem ocupado o meu pensamento quando estou sozinho: isso me eleva ou me prende?",
    prece: "Pense no alto da cabeça. Com gratidão, eleve o pensamento a Deus e entregue o que não depende de você. Que a sua mente se abra às boas inspirações." },
  { id: "cer", nome: "Cerebral", chakra: "Ajna", local: "fronte, entre as sobrancelhas", x: 120, y: 66,
    funcao: "Governa o córtex e o sistema nervoso, sustenta os sentidos e marca o ritmo das glândulas endócrinas. É o centro do pensamento que discerne.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["consciencia", "sabedoria", "justica"], prat: ["Exame de consciência", "O Livro dos Espíritos (Allan Kardec, 1857)"],
    perg: "Que pensamento repetido eu alimentei hoje sem examinar?",
    prece: "Leve a atenção à fronte. Aquiete os pensamentos e peça discernimento: ver com clareza e julgar com justiça, começando por você." },
  { id: "lar", nome: "Laríngeo", chakra: "Vishuddha", local: "garganta", x: 120, y: 112,
    funcao: "Controla sobretudo a respiração e a fonação: o sopro e a palavra.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["educacao", "gentileza", "paciencia"], prat: ["Vigilância da palavra"],
    perg: "As minhas palavras de hoje consolaram ou feriram?",
    prece: "Sinta o ar passar pela garganta. Que a sua palavra seja verdadeira, branda e útil, e que você saiba calar quando o silêncio for caridade." },
  { id: "car", nome: "Cardíaco", chakra: "Anahata", local: "centro do peito", x: 120, y: 166,
    funcao: "Dirige a emotividade e a circulação das forças de base.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["compaixao", "caridade", "fraternidade", "tolerancia"], prat: ["Caridade semanal", "Culto do Evangelho no lar"],
    perg: "A quem preciso estender hoje a indulgência que eu gostaria de receber?",
    prece: "Leve a atenção ao centro do peito. Envolva em pensamento de paz quem você ama e quem o feriu. Perdoe, peça perdão e deseje o bem." },
  { id: "esp", nome: "Esplênico", chakra: "Svadhisthana (na lista de Leadbeater, o centro do baço ocupa esse lugar)", local: "região do baço, à esquerda do abdome", x: 150, y: 210,
    funcao: "Regula a distribuição e a circulação dos recursos vitais por todo o corpo: a vitalidade.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["equilibrio"], prat: ["Frequentar uma casa espírita"],
    perg: "Onde estou gastando energia vital à toa: excesso, pressa, noites curtas?",
    prece: "Pense na vitalidade que circula pelo corpo. Agradeça ao corpo, instrumento da sua evolução, e proponha-se a cuidar dele com descanso, movimento e medida." },
  { id: "gas", nome: "Gástrico", chakra: "Manipura", local: "região do estômago (plexo solar)", x: 120, y: 236,
    funcao: "Responde pela penetração de alimentos e fluidos no organismo: o que assimilamos, no prato e nas emoções.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["temperanca"], prat: ["Água fluidificada"],
    perg: "O que eu engoli hoje sem digerir: comida, raiva, preocupação?",
    prece: "Leve a atenção à região do estômago. Que você receba o alimento com gratidão e medida, e não guarde o que precisa ser perdoado." },
  { id: "gen", nome: "Genésico", chakra: "Muladhara (a energia criadora também é ligada ao Svadhisthana)", local: "base do tronco", x: 120, y: 296,
    funcao: "Sede do sexo como templo modelador de formas e estímulos: a energia criadora, da vida e das obras.",
    fonte: "André Luiz: Entre a Terra e o Céu, cap. XX",
    val: ["respeito", "igualdade"], prat: [],
    perg: "Estou usando a minha energia criadora com respeito, a mim e ao outro?",
    prece: "Pense na energia criadora. Que ela sirva ao amor e à vida, com respeito a você e ao outro, e se transforme também em trabalho e criação." }];
const CF_ABRE = "Sente-se com a coluna ereta e os pés no chão; se quiser, deixe um copo de água ao lado. Respire devagar algumas vezes. Eleve o pensamento a Deus e peça a presença dos bons Espíritos, com a intenção de servir e de melhorar.";
const CF_FECHA = "Agradeça a assistência recebida. Se deixou água ao lado, beba-a agora: na tradição espírita, é a água fluidificada. Leve para o dia uma intenção concreta.";
const cfC = id => CF.find(c => c.id === id);
const cfNome = id => cfC(id)?.nome || id;
const cfD = () => { const d = jData(); d.cf ||= {}; d.cf.av ||= {}; return d.cf; };
const CFV = { sel: "cor", txt: "", dur: 60, voz: false };
const CFH = { on: false, i: 0, t0: 0, pausaEm: 0, gasto: 0, h: null, fim: false, antes: "", depois: "", nota: "", ini: 0 };

/* ---------------------------------------------------------------- o que os dados mostram (14 dias; valores da Bússola em 28) */
const cfDe = (dias = 14) => addDays(TODAY, -dias + 1);
function cfSaude(k, dias = 14) { const a = cfDe(dias), v = Object.entries(S.saude || {}).filter(([d, e]) => d >= a && d <= TODAY && isNum(e?.[k]) && e[k] !== "").map(([, e]) => +e[k]); return v.length ? { m: avg(v), n: v.length } : null; }
function cfSess(tecs, dias = 14) { const a = cfDe(dias), ss = jData().sess.filter(x => x.data >= a && x.data <= TODAY && (!tecs || tecs.includes(x.tec))); return { n: ss.length, min: sum(ss.map(x => +x.min || 0)) }; }
function cfMarcas(titulo, dias = 14) { const a = cfDe(dias), p = jP("esp").prat.find(x => norm(x.titulo) === norm(titulo)); return p ? (p.marcas || []).filter(d => d >= a && d <= TODAY).length : null; }
function cfValores(ids, dias = 28) { const sc = bmScores(dias), vs = ids.filter(id => sc.val[id] != null); return { m: vs.length ? avg(vs.map(id => sc.val[id])) : null, por: Object.fromEntries(ids.map(id => [id, sc.val[id] ?? null])), noites: sc.dias }; }
function cfSinais(id) {
  const c = cfC(id), V = cfValores(c.val), out = [], add = (l, v, s = "") => out.push({ l, v, s });
  if (id === "cor") { const s = cfSess(["Prece", "Culto do Evangelho", CF_TEC]); add("Dias com o Espiritismo", `${jActDays("esp", cfDe()).size} de 14`, "reflexões, práticas, sessões e conversas"); add("Prece, Evangelho e harmonização", plural(s.n, "sessão", "sessões"), s.min ? `${num(s.min, 0)} min` : ""); }
  if (id === "cer") { const q = cfSaude("qual"), e = cfSaude("estresse"), h = sum((S.estudo || []).filter(x => x.data >= cfDe() && x.data <= TODAY).map(x => +x.horas || 0)); add("Qualidade do sono", q ? `${num(q.m, 1)} de 5` : "–", q ? `${q.n} noites` : "sem check-in"); add("Estresse", e ? `${num(e.m, 1)} de 5` : "–", e ? "quanto menor, melhor" : "sem check-in"); add("Estudo", `${num(h, 1)} h`, "Crescimento"); }
  if (id === "lar") { const s = cfSess(["Respiração (ānāpānasati)", "Pausa de três minutos"]); add("Respiração e pausas", `${num(s.min, 0)} min`, plural(s.n, "sessão", "sessões")); const m = cfMarcas("Vigilância da palavra"); if (m != null) add("Vigilância da palavra", `${m}×`, "prática adotada"); }
  if (id === "car") { const h = cfSaude("humor"), ct = (S.contatos || []).filter(x => x.data >= cfDe() && x.data <= TODAY).length, m = cfMarcas("Caridade semanal"); add("Humor", h ? `${num(h.m, 1)} de 5` : "–", h ? `${h.n} dias` : "sem check-in"); add("Contatos com pessoas", String(ct), "Relações"); if (m != null) add("Caridade semanal", `${m}×`, "prática adotada"); }
  if (id === "esp") { const s = cfSaude("sono"), p = cfSaude("passos"), tr = Object.entries(S.saude || {}).filter(([d, e]) => d >= cfDe() && d <= TODAY && e?.treino).length; add("Sono", s ? `${num(s.m, 1)} h` : "–", s ? `meta ${num(+S.cfg?.metaSono || 7.5, 1)} h` : "sem check-in"); add("Dias com treino", `${tr} de 14`, "check-in"); if (p) add("Passos", num(p.m, 0), "média por dia"); }
  if (id === "gas") { const L = (S.nutriLog || []).filter(x => x.data >= cfDe() && x.data <= TODAY), dias = [...new Set(L.map(x => x.data))], alc = new Set(L.filter(x => ["cerveja", "vinho"].includes(x.base)).map(x => x.data)).size, M = typeof nuMetas === "function" ? nuMetas() : null;
    add("Dias com a alimentação registrada", `${dias.length} de 14`, "Saúde › Alimentação");
    if (dias.length && M?.ok) { const ok = dias.filter(d => Math.abs(sum(L.filter(x => x.data === d).map(x => +x.kcal || 0)) - M.kcal) <= M.kcal * .1).length; add("Na meta de calorias (±10%)", `${ok} de ${dias.length}`, `meta ${num(M.kcal, 0)} kcal`); }
    if (dias.length) add("Dias com álcool", String(alc), "cerveja ou vinho registrados"); }
  if (id === "gen") add("O que o Atlas mede aqui", "nada", "só a sua autoavaliação e as suas reflexões");
  add("Virtudes no exame da noite", V.m == null ? "–" : pct(V.m), V.noites ? `${c.val.map(v => bmV(v)?.nome).join(", ")} · ${plural(V.noites, "noite", "noites")} em 28 dias` : "sem exames em 28 dias");
  return out;
}
/* autoavaliação: a da semana atual, a da anterior e as últimas 12 semanas */
const cfSemana = (w = weekStart(TODAY)) => cfD().av[w] || {};
function cfFacts() {
  const w = weekStart(TODAY), a = cfSemana(w), b = cfSemana(addDays(w, -7)), s = cfSess([CF_TEC], 28), L = [];
  const fm = o => CF.map(c => `${c.nome} ${o[c.id] ?? "–"}`).join(", ");
  if (!Object.keys(a).length && !Object.keys(b).length && !s.n) return ["Centros de força (André Luiz): ainda sem autoavaliação nem harmonização registrada."];
  L.push(`Centros de força (autoavaliação semanal, 1 em desarmonia a 5 em harmonia): esta semana: ${fm(a)}; semana passada: ${fm(b)}.`);
  const bx = CF.filter(c => a[c.id] && a[c.id] <= 2).map(c => c.nome); if (bx.length) L.push(`Centros que a pessoa sente em desarmonia esta semana: ${bx.join(", ")}.`);
  L.push(`Harmonizações guiadas nas últimas 4 semanas: ${s.n}${s.n ? ` (${num(s.min, 0)} min)` : ""}.`);
  return L;
}

/* ---------------------------------------------------------------- telas */
function cfNav() {
  const it = [["espiritismo", "O pilar", "flame"], ["centros", "Centros de força", "lotus"]];
  return `<nav class="jbmnav" aria-label="Espiritismo">${it.map(([k, l, i]) => `<a href="#jornada.${k}" class="${SUB === k ? "on" : ""}"${SUB === k ? ' aria-current="page"' : ""}>${ic(i)}${l}</a>`).join("")}</nav>`;
}
const cfCor = n => n ? `color-mix(in srgb,var(--jp-esp) ${[0, 24, 40, 56, 72, 90][n]}%,var(--surface))` : "var(--surface-2)";
function cfMapa() {
  const a = cfSemana(), sel = CFV.sel;
  const nodes = CF.map(c => { const n = a[c.id], on = c.id === sel;
    return `<g class="cfn${on ? " on" : ""}" data-cf="${c.id}" role="button" tabindex="0" aria-pressed="${on}" aria-label="Centro ${esc(c.nome)}${n ? `, ${n} de 5 (${CF_ESC[n]})` : ", sem autoavaliação nesta semana"}">
      <line x1="${c.x + 13}" y1="${c.y}" x2="182" y2="${c.y}" class="cfl"/>${on ? `<circle cx="${c.x}" cy="${c.y}" r="17" class="cfsel"/>` : ""}<circle cx="${c.x}" cy="${c.y}" r="11.5" class="cfd${n ? "" : " vazio"}" style="fill:${cfCor(n)}"/>
      ${n ? `<text x="${c.x}" y="${c.y + 4}" class="cfnum">${n}</text>` : ""}<text x="188" y="${c.y + 4}" class="cflab">${esc(c.nome)}</text></g>`; }).join("");
  return `<svg viewBox="0 0 270 340" class="cfsvg" role="group" aria-label="Os sete centros de força">
    <defs><radialGradient id="cfaura" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="var(--jp-esp)" stop-opacity=".22"/><stop offset="1" stop-color="var(--jp-esp)" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="120" cy="176" rx="104" ry="166" fill="url(#cfaura)"/>
    <circle cx="120" cy="70" r="27" class="cfbody"/><path d="M70 150 Q72 106 120 102 Q168 106 170 150 L162 290 Q150 326 120 330 Q90 326 78 290 Z" class="cfbody"/>
    <line x1="120" y1="30" x2="120" y2="312" class="cfaxis"/>${nodes}</svg>`;
}
function cfDetalhe(c) {
  const V = cfValores(c.val), P = jP("esp"), cat = J_PIL.esp.cat;
  const pr = c.prat.map(t => { const x = P.prat.find(z => norm(z.titulo) === norm(t)), i = cat.findIndex(k => norm(k.t) === norm(t)), hoje = (x?.marcas || []).includes(TODAY);
    return `<div class="cfpr"><span>${esc(t)}</span>${x && x.status === "ativa" ? `<button type="button" class="btn sm${hoje ? " primary" : ""}" data-act="jmark" data-p="esp" data-id="${x.id}" aria-pressed="${hoje}">${ic("check")}${hoje ? "Feita hoje" : "Fiz hoje"}</button>` : i >= 0 ? `<button type="button" class="btn sm ghost" data-act="jadopt" data-p="esp"${x ? ` data-id="${x.id}"` : ` data-k="${i}"`}>${ic("plus")}Adotar</button>` : ""}</div>`; }).join("");
  return `<div class="cfdh"><span class="cfdot" style="background:${cfCor(cfSemana()[c.id])}"></span><div><h2>Centro ${esc(c.nome.toLowerCase())}</h2><small class="muted">chakra correspondente: ${esc(c.chakra)} · ${esc(c.local)}</small></div></div>
    <p>${esc(c.funcao)}</p><p class="muted small">${ic("book")}${esc(c.fonte)}</p>
    <div class="flbl">Virtudes que o trabalham <small>Bússola · leitura do Atlas</small></div><div class="cfvals">${c.val.map(id => `<span class="jtag sm">${esc(bmV(id)?.nome || id)}${V.por[id] != null ? ` · ${pct(V.por[id])}` : ""}</span>`).join("")}</div>
    <div class="flbl">O que os seus dados mostram <small>14 dias</small></div><div class="cfsin">${cfSinais(c.id).map(s => `<div><span>${esc(s.l)}</span><b>${esc(s.v)}</b><small class="muted">${esc(s.s)}</small></div>`).join("")}</div>
    <div class="flbl">Para contemplar</div><p class="bmq">${ic("info")}<span>${esc(c.perg)}</span></p>
    <textarea class="jta" rows="2" id="cf_refl" placeholder="Escreva o que percebeu; vai para as reflexões do Espiritismo">${esc(CFV.txt)}</textarea><div class="row"><button type="button" class="btn sm primary" data-act="cfrsave" data-cf="${c.id}">${ic("check")}Guardar reflexão</button></div>
    ${pr ? `<div class="flbl">Práticas que ajudam</div><div class="cfprs">${pr}</div>` : ""}`;
}
function cfAvaliacao() {
  const w = weekStart(TODAY), a = cfSemana(w), b = cfSemana(addDays(w, -7));
  return panel(`${ic("sliders")}Como cada centro está nesta semana`, `<p class="muted small">De 1 (${CF_ESC[1]}) a 5 (${CF_ESC[5]}). Não é medida: é como você sente cada aspecto da vida que o centro representa. Vale para a semana de ${fmtD(w)} a ${fmtD(addDays(w, 6))}.</p>
    <div class="cfavs">${CF.map(c => `<div class="cfav"><b>${esc(c.nome)}</b><div class="segs" role="group" aria-label="${esc(c.nome)}">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="seg" data-cfav="${c.id}|${n}" aria-pressed="${a[c.id] === n}" title="${CF_ESC[n]}">${n}</button>`).join("")}</div><small class="muted">${b[c.id] ? `semana passada: ${b[c.id]}` : ""}</small></div>`).join("")}</div>`);
}
function cfHistorico() {
  const w0 = weekStart(TODAY), wks = Array.from({ length: 12 }, (_, i) => addDays(w0, -7 * (11 - i))), ss = jData().sess.filter(x => x.tec === CF_TEC).sort((x, y) => y.data.localeCompare(x.data));
  const grid = `<div class="cfheat" style="--n:${wks.length}"><span></span>${wks.map(w => `<small>${fmtD(w)}</small>`).join("")}${CF.map(c => `<b>${esc(c.nome)}</b>${wks.map(w => { const n = cfSemana(w)[c.id]; return `<i style="background:${cfCor(n)}" ${tip(`${c.nome}, semana de ${fmtD(w)}: ${n ? `${n} (${CF_ESC[n]})` : "sem autoavaliação"}`)}>${n || ""}</i>`; }).join("")}`).join("")}</div>`;
  return panel(`${ic("week")}Últimas 12 semanas`, `${grid}<div class="flbl">Harmonizações guiadas <small>${ss.length}</small></div>${ss.length ? `<div class="cfhist">${ss.slice(0, 8).map(x => `<div><b>${fmtD(x.data)}</b><span>${num(+x.min || 0, 0)} min</span><small class="muted">${x.antes && x.depois ? `estado ${x.antes} → ${x.depois}` : ""}${x.notas && x.notas !== CF_TEC ? ` · ${esc(trunc(x.notas, 80))}` : ""}</small></div>`).join("")}</div>` : `<p class="muted small">Nenhuma ainda. Cada harmonização vira uma sessão de prática do Espiritismo.</p>`}`);
}
function cfBase() {
  return `<details class="pn cfbase"><summary>${ic("book")}Base doutrinária e limites</summary>
    <p>Allan Kardec não usa a palavra chakra. A doutrina fala do <b>perispírito</b>, o envoltório fluídico que liga o Espírito ao corpo (O Livro dos Espíritos, q. 93 a 95 e 135), e dos <b>fluidos</b>, que o pensamento e a vontade modificam (A Gênese, cap. XIV).</p>
    <p>Os <b>centros de força</b> aparecem na obra de André Luiz, psicografada por Chico Xavier: sete centros do perispírito (coronário, cerebral, laríngeo, cardíaco, esplênico, gástrico e genésico), descritos em Entre a Terra e o Céu (cap. XX) e retomados em Evolução em Dois Mundos. Em Missionários da Luz, a epífise aparece como a glândula da vida mental.</p>
    <p><b>Onde se encontram com os chakras:</b> sete centros de energia ao longo do corpo, do alto da cabeça à base do tronco, ligados ao estado da mente. <b>Onde se separam:</b> nomes e funções próprios (o esplênico vem da lista de Leadbeater, que põe um centro no baço; o gástrico e o genésico não seguem a lista clássica) e, sobretudo, o foco: no espiritismo, a harmonia dos centros vem do pensamento, da conduta moral, da prece e do passe, não de técnicas para “abrir” ou “ativar” chakras, cores ou cristais.</p>
    <p>O passe e a água fluidificada são assistência fluídica oferecida nas casas espíritas e não substituem tratamento médico, como a própria orientação espírita lembra. As ligações com os valores da Bússola e com os seus dados são uma leitura do Atlas para a reflexão, não doutrina nem diagnóstico.</p></details>`;
}
function cfHarmHTML() {
  if (!CFH.on) return "";
  const P = cfPassos(), s = P[CFH.i];
  if (CFH.fim) return `<section class="pn cfharm fim" aria-live="polite"><h2>${ic("check")}Harmonização concluída</h2><p class="muted">${num(Math.max(1, Math.round(CFH.gasto / 6e4)), 0)} min. Registre como sessão de prática do Espiritismo.</p>
    <div class="form f3"><label>Antes (1 a 5)<select id="cfh_antes"><option value=""></option>${[1, 2, 3, 4, 5].map(n => `<option${+CFH.antes === n ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>Depois (1 a 5)<select id="cfh_depois"><option value=""></option>${[1, 2, 3, 4, 5].map(n => `<option${+CFH.depois === n ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>Nota<input type="text" id="cfh_nota" value="${esc(CFH.nota)}" placeholder="o que sentiu, por quem orou"></label></div>
    <div class="row wrap"><button type="button" class="btn primary" data-act="cfhsave">${ic("check")}Registrar sessão</button><button type="button" class="btn ghost" data-act="cfhdesc">Não registrar</button></div></section>`;
  const c = s.c;
  return `<section class="pn cfharm" aria-live="polite"><div class="cfhtop"><span class="jtag sm">${CFH.i + 1} de ${P.length}</span><b>${esc(s.t)}</b>${c ? `<small class="muted">${esc(c.local)}</small>` : ""}</div>
    <p class="cfhtxt">${esc(s.txt)}</p><div class="cfhbar"><i id="cfh_bar"></i></div><p class="muted small"><span id="cfh_t"></span></p>
    <div class="row wrap"><button type="button" class="btn sm" data-act="cfhpause">${CFH.pausaEm ? `${ic("bolt")}Continuar` : `${ic("stop")}Pausar`}</button><button type="button" class="btn sm" data-act="cfhnext">${CFH.i < P.length - 1 ? "Próximo" : "Concluir"}</button><button type="button" class="btn sm ghost" data-act="cfhstop">Encerrar</button></div></section>`;
}
function pCentros() {
  const c = cfC(CFV.sel) || CF[0];
  return `${cfNav()}<p class="lead">Na tradição indiana, os chakras são centros de energia ao longo do corpo. Na Doutrina Espírita, André Luiz descreve sete <b>centros de força</b> no perispírito, o corpo espiritual, que o pensamento e a conduta harmonizam. Toque num centro para ver a função, as virtudes que o trabalham e o que os seus dados mostram.</p>
    ${cfHarmHTML()}
    <div class="cfgrid"><section class="pn cfmap">${cfMapa()}
      <div class="cfstart"><label class="lbl">Tempo por centro<select id="cfh_dur"${CFH.on ? " disabled" : ""}>${[[30, "30 segundos"], [60, "1 minuto"], [120, "2 minutos"]].map(([v, l]) => `<option value="${v}"${CFV.dur === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="ckl"><input type="checkbox" id="cfh_voz"${CFV.voz ? " checked" : ""}><span>Ler em voz alta</span></label>
        <button type="button" class="btn primary" data-act="cfhini"${CFH.on ? " disabled" : ""}>${ic("lotus")}Harmonização guiada</button></div>
      <p class="muted small">Uma prece pelos sete centros, do coronário ao genésico, como no passe. Vira uma sessão de prática do Espiritismo.</p></section>
      <section class="pn cfdet">${cfDetalhe(c)}</section></div>
    <div class="g2c">${cfAvaliacao()}${cfHistorico()}</div>${cfBase()}`;
}
/* resumo para a página do pilar */
function cfPainelPilar() {
  const a = cfSemana(), n = Object.keys(a).length, s = cfSess([CF_TEC], 28);
  return panel(`${ic("lotus")}Centros de força`, `<div class="cfmini">${CF.map(c => `<a href="#jornada.centros" data-act="cfgo" data-cf="${c.id}" class="cfm" ${tip(`${c.nome}: ${a[c.id] ? `${a[c.id]} (${CF_ESC[a[c.id]]})` : "sem autoavaliação nesta semana"}`)}><i style="background:${cfCor(a[c.id])}">${a[c.id] || ""}</i><small>${esc(c.nome)}</small></a>`).join("")}</div>
    <p class="muted small">Os sete centros do perispírito descritos por André Luiz, que correspondem aos chakras. ${n ? `Autoavaliação desta semana: ${n} de 7.` : "Ainda sem autoavaliação nesta semana."} ${s.n ? `${plural(s.n, "harmonização", "harmonizações")} em 4 semanas.` : ""}</p>
    <div class="row wrap"><a class="btn sm" href="#jornada.centros">${ic("lotus")}Abrir os centros de força</a></div>`);
}

/* ---------------------------------------------------------------- harmonização guiada */
const cfPassos = () => [{ t: "Abertura", txt: CF_ABRE, dur: Math.min(CFV.dur, 45) }, ...CF.map(c => ({ t: `Centro ${c.nome.toLowerCase()}`, c, txt: c.prece, dur: CFV.dur })), { t: "Encerramento", txt: CF_FECHA, dur: Math.min(CFV.dur, 45) }];
function cfFala(txt) { if (!CFV.voz || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = "pt-BR"; u.rate = .92; speechSynthesis.speak(u); } catch {} }
function cfhTick() {
  if (!CFH.on || CFH.fim) return; if (PAGE !== "jornada" || SUB !== "centros") { cfhParar(); return; }
  const P = cfPassos(), s = P[CFH.i]; if (!s) return; const el = (CFH.pausaEm || Date.now()) - CFH.t0, f = Math.min(1, el / (s.dur * 1000));
  const bar = $("#cfh_bar"), tt = $("#cfh_t"); if (bar) bar.style.width = `${(f * 100).toFixed(1)}%`; if (tt) { const r = Math.max(0, Math.ceil(s.dur - el / 1000)); tt.textContent = CFH.pausaEm ? "em pausa" : `${Math.floor(r / 60)}:${pad(r % 60)}`; }
  if (f >= 1 && !CFH.pausaEm) cfhAvancar();
}
function cfhAvancar() {
  const P = cfPassos(); CFH.gasto += Date.now() - CFH.t0;
  if (CFH.i >= P.length - 1) { CFH.fim = true; clearInterval(CFH.h); CFH.h = null; try { speechSynthesis?.cancel(); } catch {} render(); return; }
  CFH.i++; CFH.t0 = Date.now(); CFV.sel = P[CFH.i].c?.id || CFV.sel; render(); cfFala(P[CFH.i].txt);
}
function cfhParar() { clearInterval(CFH.h); Object.assign(CFH, { on: false, i: 0, t0: 0, pausaEm: 0, gasto: 0, h: null, fim: false, antes: "", depois: "", nota: "" }); try { speechSynthesis?.cancel(); } catch {} }
function cfhIniciar() { cfhParar(); Object.assign(CFH, { on: true, i: 0, t0: Date.now(), ini: Date.now() }); CFH.h = setInterval(cfhTick, 250); render(); cfFala(CF_ABRE); setTimeout(() => $(".cfharm")?.scrollIntoView({ block: "start", behavior: "smooth" }), 60); }

/* ---------------------------------------------------------------- ações */
function cfClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.cfav) { const [id, n] = ds.cfav.split("|"), w = weekStart(TODAY), av = cfD().av, cur = { ...(av[w] || {}) }; if (cur[id] === +n) delete cur[id]; else cur[id] = +n; if (Object.keys(cur).length) av[w] = cur; else delete av[w]; touch("jornada", { label: `Centro ${cfNome(id).toLowerCase()}: ${cur[id] || "sem nota"}` }); return true; }
  if (a === "cfgo") { if (CFV.sel !== ds.cf) CFV.txt = ""; CFV.sel = ds.cf; return true; }   // o link segue para #jornada.centros
  if (ds.cf && !a) { if (CFV.sel !== ds.cf) CFV.txt = ""; CFV.sel = ds.cf; render(); return true; }
  if (a === "cfrsave") { const txt = String($("#cf_refl")?.value || CFV.txt).trim(), id = ds.cf || CFV.sel; if (!txt) { toast("Escreva a reflexão."); return true; }
    jP("esp").refl.push({ id: uid(), at: Date.now(), data: TODAY, texto: txt.slice(0, 4000), tipo: "reflexão", tambem: [], priv: false, cf: id }); CFV.txt = ""; touch("jornada", { label: `Reflexão (centro ${cfNome(id).toLowerCase()})` }); toast("Guardada nas reflexões do Espiritismo."); return true; }
  if (a === "cfhini") { cfhIniciar(); return true; }
  if (a === "cfhpause") { if (CFH.pausaEm) { CFH.t0 += Date.now() - CFH.pausaEm; CFH.pausaEm = 0; } else CFH.pausaEm = Date.now(); render(); cfhTick(); return true; }
  if (a === "cfhnext") { if (CFH.pausaEm) { CFH.t0 += Date.now() - CFH.pausaEm; CFH.pausaEm = 0; } cfhAvancar(); return true; }
  if (a === "cfhstop") { const g = CFH.gasto + (CFH.on && !CFH.fim ? Date.now() - CFH.t0 : 0); if (g >= 6e4) { CFH.gasto = g; CFH.fim = true; clearInterval(CFH.h); CFH.h = null; try { speechSynthesis?.cancel(); } catch {} } else cfhParar(); render(); return true; }
  if (a === "cfhdesc") { cfhParar(); render(); toast("Harmonização não registrada."); return true; }
  if (a === "cfhsave") { const n = v => { const x = +v; return x >= 1 && x <= 5 ? x : ""; }, min = Math.max(1, Math.round(CFH.gasto / 6e4));
    jData().sess.push({ id: uid(), at: Date.now(), data: TODAY, pid: "esp", tec: CF_TEC, min, qual: "", antes: n($("#cfh_antes")?.value), depois: n($("#cfh_depois")?.value), notas: String($("#cfh_nota")?.value || "").trim().slice(0, 300) || CF_TEC });
    cfhParar(); touch("jornada", { label: "Harmonização registrada" }); undoToast(`Harmonização registrada: ${min} min`); return true; }
  return false;
}
function cfInput(t) {
  if (t.id === "cf_refl") { CFV.txt = t.value; return true; }
  if (t.id === "cfh_nota") { CFH.nota = t.value; return true; }
  return false;
}
function cfChange(t) {
  if (t.id === "cfh_dur") { CFV.dur = +t.value || 60; return true; }
  if (t.id === "cfh_voz") { CFV.voz = t.checked; if (!t.checked) try { speechSynthesis?.cancel(); } catch {} return true; }
  if (t.id === "cfh_antes") { CFH.antes = t.value; return true; }
  if (t.id === "cfh_depois") { CFH.depois = t.value; return true; }
  return false;
}

/* ---------------------------------------------------------------- exemplo (fictício): autoavaliações das últimas 8 semanas */
function cfExemplo(D) {
  const rnd = mulberry32(1857), w0 = weekStart(TODAY), base = { cor: 4, cer: 3, lar: 3, car: 4, esp: 2, gas: 3, gen: 4 }, av = {};
  for (let k = 7; k >= 0; k--) { const w = addDays(w0, -7 * k), o = {}; for (const c of CF) { if (k === 0 && ["gas", "gen"].includes(c.id)) continue; o[c.id] = clamp(Math.round(base[c.id] + (rnd() - .45) * 1.6 + (7 - k) * .08), 1, 5); } av[w] = o; }
  D.jornada ||= {}; D.jornada.cf = { av };
}
