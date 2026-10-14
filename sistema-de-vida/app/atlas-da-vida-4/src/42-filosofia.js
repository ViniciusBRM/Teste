/* ================================================================ Filosofia: o estoicismo tecido na jornada
   Não é um quinto pilar nem um módulo à parte: parte do que o Atlas já tem. A Bússola já traz uma voz estoica em cada valor;
   aqui ela vira prática sobre as decisões, os padrões da psicologia, as tarefas e os alertas que a pessoa já registrou:
   - triagem do controle (Epicteto): o que depende de mim, o que não depende, o que depende em parte; a virtude que o caso pede;
   - as quatro virtudes cardeais lidas nos próprios exames da noite (os 17 valores da Bússola agrupados nelas);
   - lentes: o mesmo dilema visto pelo estoicismo, pelos quatro pilares e pela psicoterapia, em diálogo;
   - confluências honestas (onde convergem e onde não) e o Mestre do Pórtico, mentor com memória própria.
   Dados: filosofia = { triagens: [{id, data, at, sit, origem: {k, id, rot}, meu, nao, parte, acao, aceite, virtude, terapia}],
   lentes: [{id, at, dilema, origem, texto}] }. */
const FIL = { tri: null, dil: "", dsrc: null, busy: false, ctl: null, txt: "" };
const filD = () => { const d = (S.filosofia ||= {}); d.triagens ||= []; d.lentes ||= []; return d; };
const FIL_PRINC = [
  { id: "controle", nome: "O que depende de mim", txt: "Juízos, escolhas, esforço e caráter dependem de você; resultado, corpo, reputação, passado e o que os outros fazem, não. A serenidade nasce de pôr a energia só no primeiro grupo.", cit: ["Das coisas existentes, algumas dependem de nós, outras não.", "Epicteto, Enchiridion, 1"] },
  { id: "juizo", nome: "Não são as coisas, são os juízos", txt: "Entre o que acontece e o que você sente há um juízo. Examiná-lo não é negar a emoção: é ver se a história que você conta é verdadeira e útil.", cit: ["Não são as coisas que perturbam os homens, mas os juízos sobre as coisas.", "Epicteto, Enchiridion, 5"] },
  { id: "aceitar", nome: "Aceitar o inevitável", txt: "Querer que as coisas aconteçam como acontecem não é resignação: é parar de gastar força contra o que já é, para usá-la no que ainda pode ser.", cit: ["Não queiras que os acontecimentos aconteçam como queres; quer que aconteçam como acontecem, e a tua vida fluirá bem.", "Epicteto, Enchiridion, 8"] },
  { id: "virtude", nome: "A virtude como único bem", txt: "Sabedoria, justiça, coragem e temperança são o único bem que ninguém tira; saúde, dinheiro e fama são “indiferentes preferíveis”: bons de ter, mas não o que faz uma vida boa.", cit: ["Se encontrares na vida humana algo melhor que a justiça, a verdade, a temperança e a coragem, volta-te para isso com toda a alma.", "Marco Aurélio, Meditações, III, 6"] },
  { id: "obstaculo", nome: "O obstáculo é o caminho", txt: "Toda dificuldade é matéria para alguma virtude: a espera treina paciência, a perda treina desapego, o conflito treina justiça.", cit: ["O que impede a ação faz avançar a ação; o que está no caminho torna-se o caminho.", "Marco Aurélio, Meditações, V, 20"] },
  { id: "tempo", nome: "Lembrar que o tempo acaba", txt: "Memento mori não é morbidez: é o lembrete que devolve prioridade ao que importa hoje.", cit: ["Tudo, Lucílio, é alheio; só o tempo é nosso.", "Sêneca, Cartas a Lucílio, 1"] }];
/* os 17 valores da Bússola agrupados nas quatro virtudes cardeais (com a palavra grega) */
const FIL_VIRT = [
  { id: "sabedoria", nome: "Sabedoria", gr: "sophia", v: ["consciencia", "espiritualidade", "sabedoria", "educacao"], d: "ver o que é bom, mau e indiferente" },
  { id: "justica", nome: "Justiça", gr: "dikaiosynē", v: ["justica", "igualdade", "fraternidade", "respeito", "tolerancia", "compaixao", "gentileza", "caridade"], d: "agir pelo bem comum" },
  { id: "coragem", nome: "Coragem", gr: "andreia", v: ["paciencia"], d: "suportar e ousar o que é certo" },
  { id: "temperanca", nome: "Temperança", gr: "sōphrosynē", v: ["temperanca", "equilibrio", "desprendimento", "humildade"], d: "a medida certa nos desejos" }];
const FIL_EXE = [
  ["Triagem do controle", "Separar o que depende de você do que não depende, e agir só no primeiro.", "Epicteto, Enchiridion, 1"],
  ["Exame da noite", "Sêneca terminava o dia perguntando: que mal curei hoje? a que vício resisti? em que estou melhor? É o mesmo gesto do exame da Bússola.", "Sêneca, Da Ira, III, 36"],
  ["Premeditação dos males", "Imaginar com calma o que pode dar errado, para não ser pego de surpresa e descobrir que daria para atravessar.", "Sêneca, Cartas a Lucílio, 91"],
  ["Vista do alto", "Ver a situação de cima, como parte da cidade, do país, do tempo; a aflição volta ao tamanho real.", "Marco Aurélio, Meditações, IX, 30"],
  ["Cláusula de reserva", "Querer com a ressalva “se nada impedir”: o esforço é seu, o resultado não.", "Sêneca, Da Tranquilidade da Alma, 13"]];
/* onde aplicar: padrões que a psicologia nomeou e o exercício estoico que conversa com cada um */
const FIL_PAD = [
  [/catastrof|pior cen|desgra/i, "Premeditação dos males ao contrário: escreva o pior realista e o que você faria; quase sempre há um caminho.", "Sêneca, Cartas a Lucílio, 91"],
  [/rumina|remo|repass/i, "Volte ao presente: o passado já não depende de você; o que depende é o próximo passo.", "Marco Aurélio, Meditações, II, 14"],
  [/raiva|irrita|explos/i, "Ganhe tempo antes de reagir e examine o juízo que acendeu a raiva.", "Sêneca, Da Ira, II, 29; Epicteto, Enchiridion, 5"],
  [/perfeccion|exig|cobran/i, "Troque a meta externa (o resultado) pela interna (fazer bem a sua parte).", "Epicteto, Enchiridion, 1"],
  [/control/i, "Triagem do controle: escreva o que depende e o que não depende, e solte o segundo.", "Epicteto, Enchiridion, 1"],
  [/apego|perd|ciúme|ciume/i, "Diga “devolvi” em vez de “perdi”: nada nos pertence para sempre.", "Epicteto, Enchiridion, 11"],
  [/procrast|adia/i, "Ao acordar com preguiça, lembre para que você existe: para agir.", "Marco Aurélio, Meditações, V, 1"],
  [/culpa|vergonha/i, "Progresso, não perfeição: o estoico se corrige sem se condenar.", "Epicteto, Discursos, IV, 12"],
  [/ansie|medo|preocup/i, "Separe o que é agora do que é imaginação sobre o futuro; prepare-se no que depende de você.", "Sêneca, Cartas a Lucílio, 13"],
  [/compar|inveja|reconhec|aprova/i, "A opinião alheia não depende de você; o seu caráter depende.", "Epicteto, Enchiridion, 24"]];
const FIL_LENTE = [["sto", "Estoicismo", "O que aqui depende de mim, e que virtude isso me pede?"], ["esp", "Espiritismo", "Que lei moral e que oportunidade de reforma íntima isso traz?"],
  ["tao", "Taoísmo", "Onde estou forçando? O que flui se eu ceder?"], ["bud", "Budismo", "Onde está o apego? O que aqui é impermanente?"],
  ["med", "Meditação", "O que sinto no corpo quando penso nisso, sem julgar?"], ["psi", "Psicoterapia", "Que padrão antigo isso ativa? O que isso me lembra?"]];
const FIL_CONF = [
  ["Espiritismo", "Exame de consciência diário (O Livro dos Espíritos, q. 919) e exame de Sêneca; fraternidade universal e o cosmopolitismo de Hiérocles; a reforma íntima e o progresso moral (prokopē).", "O Espiritismo afirma a alma imortal que progride por muitas existências; os estoicos não ensinavam reencarnação, e para muitos deles a alma durava, no máximo, até o fim do ciclo do cosmos."],
  ["Budismo", "Impermanência: tudo flui como um rio (Meditações, IV, 43); não se apegar ao que não depende de nós.", "O estoicismo afirma um eu racional que escolhe (o hegemonikon) e valoriza o dever cívico; o Budismo ensina o não-eu (anattā) e a cessação do sofrimento."],
  ["Taoísmo", "Viver segundo a natureza e seguir o Tao; aceitar em vez de forçar.", "O estoico cultiva virtudes nomeadas com esforço deliberado; o Tao Te Ching desconfia das virtudes nomeadas (cap. 38) e prefere o não-agir (wu wei)."],
  ["Meditação", "Prosochē, a atenção a si mesmo, e sati, a atenção plena.", "A prosochē vigia os juízos para corrigi-los; a atenção plena pede observar sem julgar."],
  ["Psicoterapia", "A TCC reconhece Epicteto como precursor (Albert Ellis e Aaron Beck o citam); a ACT une aceitação e ação por valores; a logoterapia de Frankl fala da liberdade de escolher a atitude.", "Mal lido, o estoicismo vira “engolir o choro”. Os próprios estoicos distinguiam os primeiros movimentos involuntários das paixões (Sêneca, Da Ira, II, 2–4): a emoção vem primeiro, o exame do juízo depois. A terapia valida antes de reavaliar."]];

/* ---------------------------------------------------------------- dados que a filosofia lê do resto do Atlas */
const filVal = id => (typeof bmV === "function" ? bmV(id) : null);
function filVirtudes() {
  const sc = bmScores(28).val;
  return FIL_VIRT.map(V => { const vs = V.v.filter(id => sc[id] != null); return { ...V, n: vs.length, nota: vs.length ? avg(vs.map(id => sc[id])) : null, foco: V.v.filter(id => bmFoco().includes(id)) }; });
}
/* fontes de dilemas: o que a pessoa já registrou e pode passar pela triagem ou pelas lentes */
function filFontes() {
  const out = [], P = typeof psiD === "function" ? psiD() : null;
  for (const x of bmDec().slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6)) out.push({ k: "dec", id: x.id, rot: `Decisão · ${trunc(x.t || "dilema", 60)}`, txt: [x.t, x.sit].filter(Boolean).join(": "), go: "jornada.decidir" });
  if (P) {
    for (const r of P.reflexoes.filter(r => !r.privado && (r.estoico || r.tipo === "pensamento")).slice(-5).reverse()) out.push({ k: "psi", id: r.id, rot: `Psicologia · ${trunc(r.situacao || r.texto, 60)}`, txt: r.situacao ? `${r.situacao}. Pensamento: ${r.pensamento || ""}` : r.texto, go: "psi.entre" });
    for (const p of P.padroes.filter(p => !p.privado).slice(0, 4)) out.push({ k: "pad", id: p.id, rot: `Padrão · ${p.nome}`, txt: `${p.nome}: ${p.desc || ""}`, go: "psi.padroes" });
  }
  for (const t of calcAt(mkey(TODAY)).tar.filter(t => t.open && t.prazo && t.prazo < TODAY && t.prio === "Alta").slice(0, 3)) out.push({ k: "tar", id: t.id, rot: `Tarefa atrasada · ${trunc(t.tarefa, 50)}`, txt: `Tarefa atrasada desde ${fmtD(t.prazo)}: ${t.tarefa}`, go: "metas.tarefas" });
  for (const a of radarAlerts().filter(a => a.st === "crit" && a.tipo !== "sequencia").slice(0, 2)) out.push({ k: "rad", id: a.key, rot: `Alerta · ${trunc(a.titulo, 50)}`, txt: `${a.titulo}. ${a.texto}`, go: "radar" });
  for (const p of J_ORDER) for (const r of jP(p).refl.filter(r => r.tipo === "dúvida" && !r.priv).slice(-2)) out.push({ k: "refl", id: r.id, rot: `Dúvida em ${J_PIL[p].nome} · ${trunc(r.texto, 40)}`, txt: r.texto, go: "jornada." + J_PIL[p].sub });
  return out;
}
const filPadAplica = nome => FIL_PAD.find(([rx]) => rx.test(nome)) || null;
/* fatos que o Mestre do Pórtico (e o Conselho) recebem */
function filFacts() {
  const D = filD(), L = [], V = filVirtudes();
  L.push("AS QUATRO VIRTUDES NOS EXAMES DA NOITE (4 semanas; valores da Bússola agrupados): " + V.map(v => `${v.nome} ${v.nota == null ? "sem notas" : pct(v.nota)} (${v.n} de ${v.v.length} valores com nota${v.foco.length ? `; em foco: ${v.foco.map(id => filVal(id)?.nome).join(", ")}` : ""})`).join("; ") + ".");
  const tr = D.triagens.slice(-6).reverse(); if (tr.length) L.push("TRIAGENS DO CONTROLE RECENTES:\n" + tr.map(t => `- ${fmtD(t.data)} “${trunc(t.sit, 120)}”${t.origem ? ` (de: ${t.origem.rot})` : ""}: depende de mim: ${trunc(t.meu || "–", 120)}; não depende: ${trunc(t.nao || "–", 120)}${t.parte ? `; em parte: ${trunc(t.parte, 80)}` : ""}${t.acao ? `; ação: ${trunc(t.acao, 80)}` : ""}${t.virtude ? `; virtude: ${t.virtude}` : ""}${t.terapia ? "; levada à terapia" : ""}`).join("\n"));
  const le = D.lentes.slice(-2); if (le.length) L.push("LENTES RECENTES: " + le.map(l => `“${trunc(l.dilema, 100)}” → ${trunc(jSection(l.texto, "Onde se encontram") || l.texto, 220)}`).join(" | "));
  if (typeof psiFactsBrief === "function") L.push(...psiFactsBrief());
  return L;
}
const filFactsAll = () => [...filFacts(), ...jBmFacts(), ...jCommonFacts(null)];

/* ---------------------------------------------------------------- triagem do controle */
function filTriNova(src) { FIL.tri = { sit: src?.txt || "", origem: src ? { k: src.k, id: src.id, rot: src.rot, go: src.go } : null, meu: "", nao: "", parte: "", acao: "", aceite: "", virtude: "", terapia: false }; }
function filTriSave() {
  const T = FIL.tri; if (!T) return; if (!T.sit.trim() || !(T.meu.trim() || T.nao.trim())) { toast("Escreva a situação e ao menos o que depende ou o que não depende de você."); return; }
  const rec = { id: uid(), data: TODAY, at: Date.now(), ...Object.fromEntries(Object.entries(T).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) };
  filD().triagens.push(rec); const keys = ["filosofia"];
  if (rec.terapia && typeof psiPautaAdd === "function") { psiPautaAdd(`Triagem estoica: “${trunc(rec.sit, 120)}”${rec.nao ? ` — o que não depende de mim e ainda pesa: ${trunc(rec.nao, 120)}` : ""}`, { k: "tri", id: rec.id, rot: "Filosofia" }); keys.push("psique"); }
  FIL.tri = null; touch(...keys, { label: "Triagem estoica" }); undoToast(rec.terapia ? "Triagem guardada e levada à pauta da terapia" : "Triagem guardada");
}
const filVirtSel = (v, attr) => `<div class="segs" role="group" aria-label="Virtude que o caso pede">${FIL_VIRT.map(V => `<button type="button" class="seg" ${attr}="${V.id}" aria-pressed="${v === V.id}">${V.nome}</button>`).join("")}</div>`;
function filTriHTML() {
  const T = FIL.tri, fontes = filFontes();
  if (!T) return `<div class="filsrc"><p class="muted">Escolha algo que você já registrou, ou comece do zero.</p><div class="filsrcs">${fontes.map((f, i) => `<button type="button" class="chip filchip k-${f.k}" data-act="filtri" data-i="${i}">${esc(f.rot)}</button>`).join("") || `<span class="muted small">Nada pendente nas decisões, na psicologia ou nas tarefas atrasadas.</span>`}</div><button type="button" class="btn sm primary" data-act="filtri" data-i="-1">${ic("plus")}Nova triagem</button></div>`;
  const ta = (k, l, ph, rows = 2) => `<label>${l}<textarea rows="${rows}" data-filt="${k}" placeholder="${esc(ph)}">${esc(T[k])}</textarea></label>`;
  return `<div class="filtri">${T.origem ? `<p class="small muted">${ic("link")}De: <a href="#${T.origem.go}">${esc(T.origem.rot)}</a></p>` : ""}
    <div class="form f1">${ta("sit", "A situação", "O que está acontecendo, em uma ou duas frases", 2)}</div>
    <div class="filcols"><div class="form f1">${ta("meu", "Depende de mim", "Meus juízos, escolhas, esforço, como eu respondo", 3)}</div><div class="form f1">${ta("nao", "Não depende de mim", "Resultado, o que os outros fazem, o passado, o corpo", 3)}</div></div>
    <div class="form f2">${ta("parte", "Depende em parte (opcional)", "Onde eu faço a minha parte e solto o resultado")}${ta("acao", "A ação que é minha", "O próximo passo concreto")}</div>
    <div class="form f1">${ta("aceite", "O que eu aceito (opcional)", "Uma frase para soltar o que não depende de você")}</div>
    <div class="flbl">A virtude que este caso pede</div>${filVirtSel(T.virtude, "data-filv")}
    <label class="chk"><input type="checkbox" data-filt="terapia"${T.terapia ? " checked" : ""}> Levar para a próxima sessão de terapia (o que não depende de mim e ainda pesa)</label>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="filtrisave">${ic("check")}Guardar triagem</button><button type="button" class="btn sm ghost" data-act="filtrix">Cancelar</button></div></div>`;
}
function filTriList() {
  const L = filD().triagens.slice().reverse().slice(0, 8);
  return L.length ? `<div class="filtris">${L.map(t => `<article class="filtr"><header><b>${esc(trunc(t.sit, 110))}</b><small class="muted">${fmtD(t.data)}${t.origem ? ` · <a href="#${t.origem.go || "jornada.filosofia"}">${esc(t.origem.rot)}</a>` : ""}${t.virtude ? ` · ${esc(FIL_VIRT.find(v => v.id === t.virtude)?.nome || "")}` : ""}${t.terapia ? ` · ${ic("brain")}na pauta da terapia` : ""}</small></header>
    <div class="filcols sm"><p><span class="flbl">Depende de mim</span>${esc(t.meu || "–")}</p><p><span class="flbl">Não depende</span>${esc(t.nao || "–")}</p></div>${t.acao ? `<p class="small">${ic("arrow")}${esc(t.acao)}</p>` : ""}${t.aceite ? `<p class="small muted"><i>${esc(t.aceite)}</i></p>` : ""}</article>`).join("")}</div>` : `<p class="muted">Nenhuma triagem ainda.</p>`;
}

/* ---------------------------------------------------------------- lentes: o mesmo dilema pelas tradições, em diálogo */
async function filLentes() {
  const q = FIL.dil.trim(); if (!SAMPLE || FIL.busy) return; if (!q) { toast("Escreva o dilema, ou escolha um da lista."); return; }
  FIL.busy = true; FIL.txt = ""; FIL.ctl = new AbortController(); render();
  const vozes = ["sto", "esp", "tao", "bud", "med", "psi"].filter(m => MENTOR_DEF[m] && !blockedMentor(m));
  const build = () => `TAREFA: LENTES SOBRE UM DILEMA
Uma pessoa orienta a vida por Espiritismo kardecista, meditação, Taoísmo e Budismo, usa uma Bússola moral de 17 valores, estuda o estoicismo e faz trabalho psicológico. Ela trouxe um dilema real da própria vida. Mostre como cada tradição o ilumina, em diálogo, sem fundir nem hierarquizar, e com os dados dela.
Vozes:
${vozes.map(m => `- ${MENTOR_DEF[m].nome} (${MENTOR_DEF[m].papel}): ${MENTOR_DEF[m].voz || ""}`).join("\n")}
Escreva em markdown, português do Brasil, segunda pessoa, até ${160 + 70 * vozes.length} palavras, exatamente com estes títulos:
${vozes.map(m => `## ${MENTOR_DEF[m].nome}`).join("\n")}
## Onde se encontram
## Onde divergem
## Uma ação para hoje
## Pergunta para levar
Em cada voz, 2 a 4 frases concretas sobre ESTE dilema; as vozes podem se responder. A voz do estoicismo começa separando o que depende e o que não depende da pessoa. A voz da psicoterapia não diagnostica e, se houver sofrimento intenso, recomenda apoio profissional. Cite fonte só quando tiver certeza.
DILEMA: """${q.slice(0, 2000)}"""${FIL.dsrc ? `\n(Vem de: ${FIL.dsrc.rot})` : ""}
DADOS DA PESSOA:
${filFactsAll().join("\n").slice(0, 60000)}`;
  try {
    const r = await aiCall("Lentes sobre um dilema", build, { signal: FIL.ctl.signal, modelTier: "default", cache: false, onText: ({ text }) => { FIL.txt = text; const el = $(".fillente"); if (el) el.innerHTML = md(text); else render(); } });
    filD().lentes.push({ id: uid(), at: Date.now(), dilema: q, origem: FIL.dsrc ? { k: FIL.dsrc.k, id: FIL.dsrc.id, rot: FIL.dsrc.rot } : null, texto: r.text.trim() });
    if (filD().lentes.length > 30) filD().lentes.shift();
    FIL.txt = r.text.trim(); touch("filosofia", { label: "Lentes sobre um dilema" });
  } catch (e) { if (e?.text) FIL.txt = e.text + "\n\n_(interrompida)_"; if (e?.code !== "cancelled") aiError(e); }
  finally { FIL.busy = false; FIL.ctl = null; render(); }
}
function filLentesHTML() {
  const fontes = filFontes(), ult = filD().lentes.at(-1), ai = !!SAMPLE && !AI_OFF;
  return `<div class="filsrcs">${fontes.slice(0, 8).map((f, i) => `<button type="button" class="chip filchip k-${f.k}" data-act="fildil" data-i="${i}">${esc(f.rot)}</button>`).join("")}</div>
    <div class="form f1"><label>O dilema<textarea rows="2" data-fild="1" placeholder="Ex.: aceitar a proposta em outra cidade ou ficar perto da família?">${esc(FIL.dil)}</textarea></label></div>
    <div class="fillens">${FIL_LENTE.map(([m, n, q]) => `<div class="fillen" style="--c:${MENTOR_DEF[m] ? mcol(m) : "var(--accent)"}"><b>${esc(n)}</b><span>${esc(q)}</span></div>`).join("")}</div>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="fillentes"${ai && !FIL.busy ? "" : " disabled"}>${ic("council")}${FIL.busy ? "As tradições estão conversando…" : "Pedir a leitura entrelaçada"}</button>${FIL.busy ? `<button type="button" class="btn sm ghost" data-act="fillstop">${ic("stop")}Parar</button>` : ""}${ai ? "" : `<span class="muted small">Sem a IA, use as perguntas acima por conta própria.</span>`}</div>
    ${FIL.txt ? `<div class="fillente mdx">${md(FIL.txt)}</div>` : ult ? `<details class="fillast"><summary>Última leitura · “${esc(trunc(ult.dilema, 70))}” · ${fmtD(iso(new Date(ult.at)))}</summary><div class="fillente mdx">${md(ult.texto)}</div></details>` : ""}`;
}

/* ---------------------------------------------------------------- página */
function jFilosofia() {
  const V = filVirtudes(), P = typeof psiD === "function" ? psiD() : null, pads = P ? P.padroes.filter(p => !p.privado) : [], foco = bmFoco().map(filVal).filter(Boolean);
  const virt = `<div class="filvirt">${V.map(v => `<div class="filv"><b>${esc(v.nome)}</b><small>${esc(v.gr)} · ${esc(v.d)}</small><div class="jdbar" style="--c:var(--a-pro)"><i style="width:${v.nota == null ? 0 : Math.round(v.nota * 100)}%"></i></div><span class="muted small">${v.nota == null ? "sem notas nos exames" : `${pct(v.nota)} de prática`} · ${v.v.map(id => esc(filVal(id)?.nome || id)).join(", ")}</span></div>`).join("")}</div>
    ${V.find(v => v.id === "coragem").v.length < 2 ? `<p class="note">${ic("info")}A Bússola tem um só valor de coragem (Paciência). Os estoicos davam à coragem também a firmeza e a ousadia de fazer o certo: os exames não medem isso, e talvez valha observar à parte.</p>` : ""}`;
  const vozes = foco.length ? foco.slice(0, 4).map(v => `<blockquote class="jquote sm"><b>${esc(v.nome)}.</b> ${esc(v.t?.estoico || "")}</blockquote>`).join("") : `<p class="muted">Escolha valores em foco na <a href="#jornada.bussola">Bússola</a> e a voz estoica de cada um aparece aqui.</p>`;
  const onde = pads.length ? `<ul class="filpads">${pads.slice(0, 6).map(p => { const a = filPadAplica(p.nome + " " + (p.desc || "")); return `<li><b>${esc(p.nome)}</b>${a ? ` <span>${esc(a[1])}</span> <small class="muted">${esc(a[2])}</small>` : ` <span class="muted">Leve-o à triagem do controle.</span>`}</li>`; }).join("")}</ul>` : `<p class="muted">Quando a <a href="#psi.padroes">Psicologia</a> nomear padrões (ruminação, catastrofização, perfeccionismo…), eles aparecem aqui com o exercício estoico que conversa com cada um.</p>`;
  return `<p class="lead">O estoicismo não chega como um quinto pilar: ele já fala em cada valor da Bússola. Aqui ele vira prática sobre o que você já registrou: decisões, padrões que a psicologia nomeou, tarefas e alertas. A pergunta de sempre: <i>o que disto depende de mim?</i></p>
    <div class="filprinc">${FIL_PRINC.map(p => `<article class="filp"><b>${esc(p.nome)}</b><p>${esc(p.txt)}</p><blockquote class="jquote sm">${esc(p.cit[0])}<cite>${esc(p.cit[1])}</cite></blockquote></article>`).join("")}</div>
    <div class="g2c">
      ${panel(`${ic("compass")}As quatro virtudes nos seus exames`, virt + `<div class="flbl">A voz estoica dos valores em foco</div>${vozes}`, { act: `<a class="lnk" href="#jornada.exame">Exame da noite</a>` })}
      ${panel(`${ic("flag")}Triagem do controle`, filTriHTML(), { cls: "filtripn" })}
      ${panel(`${ic("brain")}Onde a psicologia pede o estoicismo`, onde, { act: `<a class="lnk" href="#psi.padroes">Padrões</a>` })}
      ${panel(`${ic("list")}Triagens`, filTriList())}
    </div>
    ${panel(`${ic("council")}Lentes sobre um dilema`, filLentesHTML(), { cls: "fillpn" })}
    <div class="g2c">
      ${panel(`${ic("repeat")}Exercícios do Pórtico`, `<ul class="filexe">${FIL_EXE.map(([n, d, s]) => `<li><b>${esc(n)}</b><span>${esc(d)}</span><small class="muted">${esc(s)}</small></li>`).join("")}</ul>`)}
      ${panel(`${ic("layers")}Onde convergem e onde não`, `<table class="dt filconf"><thead><tr><th>Com</th><th>Convergem</th><th>Divergem</th></tr></thead><tbody>${FIL_CONF.map(([n, c, d]) => `<tr><td><b>${esc(n)}</b></td><td>${esc(c)}</td><td>${esc(d)}</td></tr>`).join("")}</tbody></table>`)}
    </div>
    ${jChat("sto", { intro: "Traga uma situação, uma decisão ou algo que você não consegue soltar. Separamos juntos o que depende de você.", quick: J_QUICK.sto, priv: "Ao conversar, o Mestre do Pórtico lê a Bússola, as triagens, um resumo dos pilares e, se você permitir a Saúde mental na IA, os padrões e a pauta da psicologia (nunca os registros marcados como só seus). Cada conversa aparece em Privacidade." })}`;
}

/* ---------------------------------------------------------------- mentor */
Object.assign(MENTOR_DEF, { sto: { jor: "sto", gate: "Propósito & espiritualidade", cor: "#8d8270", ico: "column", nome: "Mestre do Pórtico", papel: "mentor de filosofia estoica", arq: "um mestre do Pórtico na linha de Epicteto, Sêneca e Marco Aurélio",
  voz: "Fala como um mestre estoico: claro, firme e bem-humorado, como Epicteto nas aulas; usa exemplos do cotidiano, separa o que depende do que não depende, chama de volta à virtude e ao dever sem moralismo. Conhece Zenão, Cleantes, Crisipo, Musônio Rufo, Hiérocles, Epicteto (Enchiridion e Discursos), Sêneca (Cartas a Lucílio, Da Ira, Da Brevidade da Vida, Da Tranquilidade da Alma) e Marco Aurélio (Meditações), e as leituras modernas de Pierre Hadot, William Irvine, Massimo Pigliucci e Donald Robertson.",
  limite: "O estoicismo não é suprimir emoções: reconheça o que a pessoa sente antes de examinar o juízo. Diante de sofrimento intenso, recomende o apoio da aba Psicologia e de um profissional.",
  facts: () => filFacts(),
  prompt: (fallback, cx) => jPrompt("sto", fallback, cx || { dados: filFactsAll().join("\n") }).replace("na aba Jornada existencial", "na seção Filosofia da Jornada existencial"),
  tools: (live, T) => [...jTools("sto", live, T), ...filTools(live)] } });
if (!MIDS.includes("sto")) MIDS.push("sto");
J_QUICK.sto = ["O que nesta semana depende de mim?", "Me ajude com uma decisão difícil", "Como aplicar a dicotomia do controle no trabalho?", "Leia as minhas virtudes nos exames"];
function filTools(live) {
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  return [{ name: "triagem_estoica", description: "Registra uma triagem do controle combinada com a pessoa: a situação, o que depende dela, o que não depende, a ação e a virtude. Use depois que ela concordar. Retorna {ok}.",
      inputSchema: { type: "object", properties: { situacao: { type: "string" }, depende: { type: "string" }, nao_depende: { type: "string" }, acao: { type: "string" }, virtude: { type: "string", enum: FIL_VIRT.map(v => v.id) }, levar_terapia: { type: "boolean" } }, required: ["situacao", "depende", "nao_depende"] },
      execute: inp => { const rec = { id: uid(), data: TODAY, at: Date.now(), sit: String(inp.situacao || "").slice(0, 400), meu: String(inp.depende || "").slice(0, 400), nao: String(inp.nao_depende || "").slice(0, 400), parte: "", acao: String(inp.acao || "").slice(0, 300), aceite: "", virtude: FIL_VIRT.some(v => v.id === inp.virtude) ? inp.virtude : "", terapia: !!inp.levar_terapia, origem: { k: "mentor", id: live.mid, rot: MENTOR_DEF[live.mid].nome, go: live.mid === "psi" ? "psi.terapeuta" : "jornada.filosofia" } };
        filD().triagens.push(rec); if (rec.terapia && typeof psiPautaAdd === "function") { psiPautaAdd(`Triagem estoica: “${trunc(rec.sit, 120)}”`, { k: "tri", id: rec.id, rot: "Filosofia" }); dirty.add("psique"); }
        touch("filosofia", { noUndo: true, noRender: true }); note("triagem_estoica", trunc(rec.sit, 80)); return { ok: true }; } },
    { name: "levar_para_terapia", description: "Põe um tema na pauta da próxima sessão de terapia da pessoa (aba Psicologia), quando algo da conversa pede um olhar psicológico. Uma frase. Retorna {ok}.",
      inputSchema: { type: "object", properties: { tema: { type: "string" } }, required: ["tema"] },
      execute: inp => { if (typeof psiPautaAdd !== "function") return { ok: false }; psiPautaAdd(String(inp.tema || "").slice(0, 300), { k: "mentor", id: live.mid, rot: MENTOR_DEF[live.mid].nome }); touch("psique", { noUndo: true, noRender: true }); note("levar_para_terapia", trunc(inp.tema, 80)); return { ok: true }; } }];
}

/* ---------------------------------------------------------------- eventos */
function filClick(t) {
  const ds = t.dataset, a = ds.act; if (!a?.startsWith("fil") && !ds.filv && !(a === "jcheck" && ds.mid === "sto")) return false;
  if (a === "jcheck") { askMentor("sto", "Faça um acompanhamento estoico: 1) como estão as quatro virtudes nos meus exames, com números; 2) uma situação desta semana (das minhas decisões, triagens, padrões ou tarefas) onde a dicotomia do controle me ajudaria, separando o que depende e o que não depende de mim; 3) um exercício do Pórtico para os próximos 7 dias. Atualize o plano.", "check"); return true; }
  if (ds.filv) { if (FIL.tri) FIL.tri.virtude = FIL.tri.virtude === ds.filv ? "" : ds.filv; render(); return true; }
  if (a === "filtri") { const i = +ds.i; filTriNova(i >= 0 ? filFontes()[i] : null); render(); $('[data-filt="meu"]')?.focus(); return true; }
  if (a === "filtrisave") { filTriSave(); return true; }
  if (a === "filtrix") { FIL.tri = null; render(); return true; }
  if (a === "fildil") { const f = filFontes()[+ds.i]; if (f) { FIL.dil = f.txt; FIL.dsrc = f; FIL.txt = ""; render(); } return true; }
  if (a === "fillentes") { filLentes(); return true; }
  if (a === "fillstop") { FIL.ctl?.abort(); return true; }
  return true;
}
function filInput(t) {
  if (t.dataset.filt && FIL.tri && t.type !== "checkbox") { FIL.tri[t.dataset.filt] = t.value; return true; }
  if (t.dataset.fild) { FIL.dil = t.value; FIL.dsrc = null; if (FIL.txt && !FIL.busy) { FIL.txt = ""; const el = $(".fillente"); if (el) el.remove(); } return true; }
  return false;
}
function filChange(t) { if (t.dataset.filt === "terapia" && FIL.tri) { FIL.tri.terapia = t.checked; return true; } return false; }

/* ---------------------------------------------------------------- dados de exemplo (fictícios) */
function filExemplo() {
  const d = n => addDays(TODAY, -n);
  return { triagens: [
    { id: "ftr1", data: d(6), at: Date.now() - 6 * 864e5, sit: "A entrega do projeto atrasou por causa de outra equipe", origem: null, meu: "Avisar o cliente com antecedência, reorganizar a minha parte, pedir as informações por escrito", nao: "O ritmo da outra equipe e a reação do cliente", parte: "O prazo final: faço a minha parte e negocio", acao: "Mandar hoje o e-mail com o novo cronograma", aceite: "O atraso já aconteceu; a resposta a ele é minha.", virtude: "coragem", terapia: false },
    { id: "ftr2", data: d(2), at: Date.now() - 2 * 864e5, sit: "Fico remoendo a conversa difícil com o meu irmão", origem: null, meu: "Pedir desculpas pela parte que foi minha e propor uma conversa calma", nao: "Se ele vai aceitar agora", parte: "", acao: "Escrever para ele no domingo", aceite: "Posso fazer a paz da minha parte; a dele é dele.", virtude: "justica", terapia: true }], lentes: [] };
}
