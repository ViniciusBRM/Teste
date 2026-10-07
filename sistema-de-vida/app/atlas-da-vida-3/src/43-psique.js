/* ================================================================ Psicologia: o trabalho terapêutico ligado à jornada
   Acompanha a terapia de verdade (sessões, processos, padrões) e o trabalho entre sessões (reflexões e registros de
   pensamento), e conversa com o resto do Atlas: sessões e processos se ligam aos pilares e aos valores da Bússola; um
   registro de pensamento vira triagem estoica; padrões aparecem na Filosofia com o exercício que conversa com eles; a pauta
   da próxima sessão junta o que veio das triagens, dos mentores e dos padrões em alta. O Terapeuta é um agente com memória
   que muda de forma (profundo, escuta, direto, acolhimento, socrático) conforme o pedido ou o jeito de escrever.
   Dados: psique = { cfg: {terapeuta, abordagem, freq, proxima}, sessoes: [{id, data, temas, insights, padroes, processo, pilares,
   valores, tarefa, antes, depois, privado}], processos: [{id, titulo, objetivo, inicio, status, pilar, valor, marcos: [{data, txt}]}],
   padroes: [{id, nome, tipo, desc, gatilhos, ajuda, valor, privado, criado}], reflexoes: [{id, data, at, tipo, texto, situacao,
   pensamento, emocao, intensidade, favor, contra, alternativa, depende, processo, padroes, estoico, levar, privado}],
   pauta: [{id, txt, origem, data, feito}], modo: {fixo, atual, motivo} }. Tudo é da área Saúde mental (Privacidade). */
const PSI = { sess: null, proc: null, pad: null, refl: null, rtipo: "diaria", ver: null };
const psiD = () => { const d = (S.psique ||= {}); d.cfg ||= {}; d.sessoes ||= []; d.processos ||= []; d.padroes ||= []; d.reflexoes ||= []; d.pauta ||= []; d.modo ||= { fixo: "auto", atual: "escuta", motivo: "" }; return d; };
const PSI_OK = () => aiAreaOk("Saúde mental");
const PSI_MODOS = {
  profundo: { nome: "Profundo", ico: "layers", d: "camadas de significado, história e o que não está dito", tom: "Trabalhe em profundidade, à maneira psicodinâmica, junguiana e existencial: associações, repetições, a história por trás, sonhos se aparecerem, o que a pessoa evita dizer. Ofereça hipóteses com delicadeza, como perguntas, nunca como sentença. Pode ser mais longo e mais lento." },
  escuta: { nome: "Escuta", ico: "users", d: "espaço para você falar", tom: "Escuta ativa, centrada na pessoa (Rogers): reflita o que ouviu com as palavras dela, nomeie o sentimento, e faça UMA pergunta aberta que convide a continuar. Respostas curtas; não dê conselhos nem técnicas, a não ser que ela peça." },
  direto: { nome: "Direto", ico: "target", d: "estrutura clara, baseada em evidências", tom: "Seja direto e lógico, à maneira da TCC, da ACT e da DBT: nomeie o padrão, explique o mecanismo em poucas linhas, proponha 1 a 3 passos concretos e mensuráveis, cite a base (por exemplo, reestruturação cognitiva, exposição, ativação comportamental, defusão) sem jargão." },
  acolhimento: { nome: "Acolhimento", ico: "heart", d: "segurança, validação e calma", tom: "Acolha primeiro (terapia focada na compaixão): valide o que a pessoa sente, normalize sem minimizar, traga calma ao corpo (respiração, chão) e só depois, se ela quiser, pense junto. Tom quente, frases simples, sem pressa e sem tarefas." },
  socratico: { nome: "Socrático", ico: "info", d: "perguntas para você chegar às respostas", tom: "Questionamento socrático: faça 2 ou 3 perguntas bem formuladas, em sequência lógica, que levem a pessoa a examinar evidências, alternativas e consequências e a chegar às próprias conclusões. Não responda por ela." } };
/* sinais explícitos no texto (e o jeito de escrever) que pedem uma forma */
const PSI_SINAIS = [
  [/\b(s[óo]|apenas)\s+(quero|preciso)\s+(desabafar|falar|ser ouvid)|me escut|deixa eu falar|preciso falar/i, "escuta", "você pediu para ser ouvido"],
  [/\b(me d[aáê]|quero|preciso de)\s+(algo|uma?|umas?)?\s*(pr[aá]tic|ferrament|t[eé]cnica|dica|passo|plano|exerc[ií]cio)|o que (eu )?fa[cç]o|seja direto|sem rodeio/i, "direto", "você pediu algo prático"],
  [/\b(estou|t[oô]|me sinto)\s+(muito\s+)?(mal|triste|p[eé]ssim|sozinh|com medo|ansios|desesperad|arrasad|esgotad)|chorei|chorando|n[aã]o aguento/i, "acolhimento", "você está sofrendo agora"],
  [/me (questione|questiona|provoque|provoca)|me ajude a pensar|me fa[cç]a perguntas|socr[aá]tic/i, "socratico", "você pediu perguntas"],
  [/\b(no fundo|por que eu sempre|desde (pequen|crian)|inf[aâ]ncia|sonhei|um sonho|meu pai|minha m[aã]e|o que isso diz de mim)/i, "profundo", "você trouxe algo de fundo"]];
function psiDetect(text) {
  const M = psiD().modo; if (M.fixo !== "auto") { M.atual = M.fixo; M.motivo = "forma escolhida por você"; return; }
  const s = PSI_SINAIS.find(([rx]) => rx.test(text));
  if (s) { M.atual = s[1]; M.motivo = s[2]; return; }
  const w = text.split(/\s+/).length;
  if (w > 120 && !/\?/.test(text)) { M.atual = "escuta"; M.motivo = "você está trazendo muito para fora"; return; }
  if (w < 14 && /\?$/.test(text.trim())) { M.atual = M.atual === "acolhimento" ? "acolhimento" : "direto"; M.motivo = "pergunta curta e objetiva"; return; }
  M.motivo ||= "mantendo a forma da conversa";
}
const PSI_TIPOS_PAD = ["pensamento", "emoção", "comportamento", "relacional", "esquema", "defesa"];
const PSI_DIARIAS = ["O que mais pesou hoje, e onde isso aparece no corpo?", "Que pensamento se repetiu hoje? Ele é verdadeiro, útil, gentil?", "O que eu evitei hoje, e o que eu sentiria se não evitasse?", "Em que momento eu fui fiel a mim hoje?", "O que da última sessão apareceu na minha semana?", "Que parte de mim pediu cuidado hoje?", "O que disto depende de mim, e o que eu posso soltar?"];
const psiPergunta = () => PSI_DIARIAS[Math.floor(parse(TODAY).getTime() / 864e5) % PSI_DIARIAS.length];
function psiPautaAdd(txt, origem) { const P = psiD(), t = String(txt || "").trim(); if (!t || P.pauta.some(x => !x.feito && norm(x.txt) === norm(t))) return null; const r = { id: uid(), txt: t.slice(0, 400), origem: origem || null, data: TODAY, feito: false }; P.pauta.push(r); return r; }
/* ocorrências de cada padrão: sessões, reflexões e triagens que o citam */
function psiOcorr(id, dias = 90) { const P = psiD(), from = addDays(TODAY, -dias + 1); return [...P.sessoes.filter(s => s.data >= from && (s.padroes || []).includes(id)).map(s => ({ k: "sess", data: s.data })), ...P.reflexoes.filter(r => r.data >= from && (r.padroes || []).includes(id)).map(r => ({ k: "refl", data: r.data }))]; }
const psiProcN = id => { const P = psiD(); return P.sessoes.filter(s => s.processo === id).length + P.reflexoes.filter(r => r.processo === id).length; };
const psiProx = () => { const c = psiD().cfg; if (c.proxima && c.proxima >= TODAY) return c.proxima; const u = psiD().sessoes.map(s => s.data).sort().at(-1); return u && c.freq ? addDays(u, c.freq === "quinzenal" ? 14 : c.freq === "mensal" ? 30 : 7) : null; };
/* sugestões automáticas para a pauta: padrões em alta, humor baixo, triagens que ainda pesam */
function psiSugestoes() {
  const out = [], P = psiD();
  for (const p of P.padroes) { const n = psiOcorr(p.id, 30).length; if (n >= 3) out.push(`O padrão “${p.nome}” apareceu ${n} vezes nos últimos 30 dias`); }
  const hum = Array.from({ length: 7 }, (_, i) => S.saude[addDays(TODAY, -i)]?.humor).filter(isNum); if (hum.length >= 3 && avg(hum) <= 2.6) out.push(`Humor médio de ${num(avg(hum))} nos últimos 7 dias`);
  const dec = bmDec().filter(x => !x.rev && x.data >= addDays(TODAY, -21)); if (dec.length) out.push(`Decisão recente ainda sem revisita: “${trunc(dec.at(-1).t || "dilema", 60)}”`);
  return out.filter(s => !P.pauta.some(x => !x.feito && norm(x.txt) === norm(s)));
}

/* ---------------------------------------------------------------- o que o Terapeuta (e os outros) leem */
function psiFacts() {
  if (!PSI_OK()) return ["Saúde mental está fora da IA em Privacidade: nada da Psicologia foi enviado."];
  const P = psiD(), L = [], c = P.cfg, ok = x => !x.privado;
  L.push(`TERAPIA: ${c.terapeuta ? `com ${c.terapeuta}` : "profissional não informado"}${c.abordagem ? `, abordagem ${c.abordagem}` : ""}${c.freq ? `, ${c.freq}` : ""}; próxima sessão ${psiProx() ? fmtD(psiProx()) : "sem data"}.`);
  const pr = P.processos.filter(p => p.status !== "concluído"); if (pr.length) L.push("PROCESSOS EM CURSO:\n" + pr.map(p => `- “${p.titulo}” (desde ${fmtD(p.inicio)}, ${p.status}): ${p.objetivo || ""}; ${psiProcN(p.id)} registros ligados${p.marcos?.length ? `; marcos: ${p.marcos.slice(-3).map(m => `${fmtD(m.data)} ${trunc(m.txt, 80)}`).join("; ")}` : ""}${p.pilar ? `; ligado a ${J_PIL[p.pilar]?.nome}` : ""}${p.valor ? `; valor ${bmV(p.valor)?.nome}` : ""}`).join("\n"));
  const ss = P.sessoes.filter(ok).slice(-6).reverse(); if (ss.length) L.push("SESSÕES RECENTES:\n" + ss.map(s => `- ${fmtD(s.data)}: temas ${(s.temas || []).join(", ") || "–"}; insight: ${trunc(s.insights || "–", 220)}${(s.padroes || []).length ? `; padrões: ${s.padroes.map(id => P.padroes.find(p => p.id === id)?.nome).filter(Boolean).join(", ")}` : ""}${s.tarefa ? `; tarefa entre sessões: ${trunc(s.tarefa, 120)}` : ""}${isNum(s.antes) && isNum(s.depois) ? `; humor ${s.antes}→${s.depois}` : ""}`).join("\n"));
  const pd = P.padroes.filter(ok); if (pd.length) L.push("PADRÕES NOMEADOS (ocorrências em 30 e 90 dias):\n" + pd.map(p => `- ${p.nome} (${p.tipo}): ${trunc(p.desc || "", 120)}; ${psiOcorr(p.id, 30).length}/${psiOcorr(p.id).length}${p.gatilhos ? `; gatilhos: ${trunc(p.gatilhos, 80)}` : ""}${p.ajuda ? `; o que ajuda: ${trunc(p.ajuda, 80)}` : ""}`).join("\n"));
  const rf = P.reflexoes.filter(ok).slice(-8).reverse(); if (rf.length) L.push("ENTRE SESSÕES:\n" + rf.map(r => `- ${fmtD(r.data)} [${r.tipo}] ${r.tipo === "pensamento" ? `situação: ${trunc(r.situacao, 100)}; pensamento: ${trunc(r.pensamento, 100)}; ${r.emocao || "emoção"} ${r.intensidade ?? "?"}/100${r.alternativa ? `; alternativa: ${trunc(r.alternativa, 100)}` : ""}` : trunc(r.texto, 220)}`).join("\n"));
  const pa = P.pauta.filter(x => !x.feito); if (pa.length) L.push("PAUTA DA PRÓXIMA SESSÃO: " + pa.map(x => `${x.txt}${x.origem ? ` (de ${x.origem.rot})` : ""}`).join("; "));
  const dias = Array.from({ length: 7 }, (_, i) => addDays(TODAY, -i)).map(d => [d, aiDayFacts(d)]).filter(([, f]) => f.length); if (dias.length) L.push("ÚLTIMOS DIAS: " + dias.map(([d, f]) => `${fmtD(d)} ${f.join(", ")}`).join(" | "));
  return L;
}
/* resumo curto que a Filosofia, os mentores da Jornada e o Conselho recebem (nada marcado como só seu) */
function psiFactsBrief() {
  if (!PSI_OK()) return []; const P = psiD(), pr = P.processos.filter(p => p.status === "ativo"), pd = P.padroes.filter(p => !p.privado).map(p => [p, psiOcorr(p.id, 30).length]).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (!pr.length && !pd.length) return [];
  return [`TRABALHO PSICOLÓGICO (resumo): ${pr.length ? `processos ativos: ${pr.map(p => `“${p.titulo}”`).join(", ")}` : "sem processo ativo"}${pd.length ? `; padrões mais presentes: ${pd.map(([p, n]) => `${p.nome} (${n} em 30 dias)`).join(", ")}` : ""}; ${P.pauta.filter(x => !x.feito).length} tema(s) na pauta da próxima sessão.`];
}
function psiPrompt(fallback, cx) {
  const def = MENTOR_DEF.psi, m = mget("psi"), M = psiD().modo, md0 = PSI_MODOS[M.atual] || PSI_MODOS.escuta;
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-24)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}${x.origem !== "mentor" ? " · " + x.origem : ""}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const plan = m.plano ? `Foco: ${m.plano.foco}\n` + m.plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${p.prazo})` : ""}`).join("\n") : "Ainda não há plano entre sessões.";
  const facts = cx ? [cx.dados] : [...psiFacts(), ...(PSI_OK() ? filFacts().slice(0, 2) : []), `JORNADA: valores em foco na Bússola ${bmFoco().map(id => bmV(id)?.nome).join(", ") || "nenhum"}; pilares mais vivos nas 4 semanas: ${J_ORDER.map(p => [J_PIL[p].nome, jActDays(p).size]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, k]) => `${n} (${k} dias)`).join(", ")}.`, ...(bmDec().length ? [`DECISÕES RECENTES (Bússola): ${bmDec().slice(-3).map(x => `“${trunc(x.t || "dilema", 60)}”`).join(", ")}.`] : [])];
  const fb = fallback ? `\n\nFORMATO: escreva a resposta normalmente. Para guardar memória ou atualizar o plano entre sessões, termine com um bloco exatamente assim (omita o que não houver):\n\`\`\`atlas\n{"memorias":[{"tipo":"insight","texto":"..."}],"plano":{"foco":"...","passos":[{"texto":"...","prazo":"AAAA-MM-DD"}]}}\n\`\`\`` : "";
  return `Você é ${def.nome}, ${def.papel}, na aba Psicologia do app pessoal "Atlas da Vida". Você simula com fidelidade um psicoterapeuta experiente e integrativo: conhece a psicanálise (Freud, Klein, Winnicott, Bion, Lacan), a psicologia analítica (Jung), as terapias psicodinâmicas breves, a TCC (Beck), a terapia do esquema (Young), a ACT, a DBT, a terapia focada na compaixão (Gilbert), a abordagem centrada na pessoa (Rogers), a Gestalt, a logoterapia e a psicoterapia existencial (Frankl, Yalom), a sistêmica e a narrativa. Escolhe a lente pelo que a pessoa traz, não por escola.
FORMA AGORA: ${md0.nome} (${md0.d}). ${md0.tom}
Motivo da forma: ${M.motivo || "padrão"}. Se perceber que a pessoa pede outra forma, explicitamente ou pelo jeito de escrever, use ajustar_modo e mude já nesta resposta.
COMO ESTAR COM A PESSOA:
- Português do Brasil, segunda pessoa, linguagem humana e precisa. Nada de clichês de autoajuda.
- Use os dados abaixo (sessões, processos, padrões, registros entre sessões, a jornada, o estoicismo e as decisões) e mostre como o trabalho psicológico conversa com eles quando isso ajudar, sem forçar a ponte.
- O estoicismo é aliado, não mordaça: valide a emoção antes de examinar o juízo; quando a pessoa quiser separar o que depende e o que não depende dela, use triagem_estoica.
- Você é apoio entre sessões, não substitui a terapia nem o profissional dela: não dá diagnóstico, não fala de medicação; quando algo pedir a sessão, use levar_para_sessao.
- Anote padrões que se repetem (anotar_padrao) só quando houver evidência em mais de um momento, e diga isso à pessoa.
- Segurança: diante de ideação suicida, autolesão, violência ou risco à vida, acolha, seja claro sobre buscar ajuda agora (na Itália, 112 e o Telefono Amico 02 2327 2327; no Brasil, CVV 188, 24 horas) e não siga com o trabalho comum.
- ${fallback ? "Use o bloco atlas" : "Use as ferramentas"} para guardar na memória insights e combinados (frases curtas, com data) e para o plano entre sessões.

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
${facts.join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}

PLANO ENTRE SESSÕES:
${plan}${fb}`.slice(0, 120000);
}
function psiTools(live, T) {
  const keep = ["salvar_memoria", "atualizar_plano", "buscar_diario"], out = T.filter(t => keep.includes(t.name)), P = psiD();
  const sm = out.find(t => t.name === "salvar_memoria"); if (sm) sm.inputSchema.properties.tipo.enum = ["insight", "combinado", "progresso", "preferência", "alerta", "fato"];
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  out.push(
    { name: "ajustar_modo", description: "Muda a forma da conversa quando a pessoa pede ou quando o jeito dela pede: profundo, escuta, direto, acolhimento ou socratico. Diga o motivo em poucas palavras. Retorna {ok}.",
      inputSchema: { type: "object", properties: { modo: { type: "string", enum: Object.keys(PSI_MODOS) }, motivo: { type: "string" } }, required: ["modo"] },
      execute: inp => { if (!PSI_MODOS[inp.modo]) return { ok: false }; if (P.modo.fixo !== "auto") return { ok: false, motivo: "a pessoa fixou a forma" }; P.modo.atual = inp.modo; P.modo.motivo = String(inp.motivo || "").slice(0, 120); touch("psique", { noUndo: true, noRender: true }); note("ajustar_modo", `${PSI_MODOS[inp.modo].nome}${inp.motivo ? ": " + trunc(inp.motivo, 60) : ""}`); return { ok: true }; } },
    { name: "anotar_padrao", description: "Registra um padrão que se repete (pensamento, emoção, comportamento, relacional, esquema ou defesa), com uma descrição curta e a evidência. Se já existir um com o mesmo nome, só acrescenta a evidência. Retorna {ok}.",
      inputSchema: { type: "object", properties: { nome: { type: "string" }, tipo: { type: "string", enum: PSI_TIPOS_PAD }, descricao: { type: "string" }, evidencia: { type: "string" } }, required: ["nome", "tipo"] },
      execute: inp => { const nome = String(inp.nome || "").trim().slice(0, 80); if (!nome) return { ok: false }; let p = P.padroes.find(x => norm(x.nome) === norm(nome));
        if (!p) { p = { id: uid(), nome, tipo: PSI_TIPOS_PAD.includes(inp.tipo) ? inp.tipo : "pensamento", desc: String(inp.descricao || "").slice(0, 300), gatilhos: "", ajuda: "", valor: "", privado: false, criado: TODAY, origem: "terapeuta" }; P.padroes.push(p); }
        if (inp.evidencia) addMemory("psi", { tipo: "insight", texto: `Padrão “${nome}”: ${String(inp.evidencia).slice(0, 200)}` });
        touch("psique", "mentores", { noUndo: true, noRender: true }); note("anotar_padrao", nome); return { ok: true }; } },
    { name: "levar_para_sessao", description: "Põe um tema na pauta da próxima sessão com o profissional. Uma frase clara. Retorna {ok}.",
      inputSchema: { type: "object", properties: { tema: { type: "string" } }, required: ["tema"] },
      execute: inp => { const r = psiPautaAdd(inp.tema, { k: "mentor", id: "psi", rot: MENTOR_DEF.psi.nome }); touch("psique", { noUndo: true, noRender: true }); note("levar_para_sessao", trunc(inp.tema, 80)); return { ok: true, duplicado: !r }; } },
    { name: "sugerir_reflexao", description: "Deixa uma pergunta para a pessoa refletir entre sessões; ela aparece em Entre sessões. Retorna {ok}.",
      inputSchema: { type: "object", properties: { pergunta: { type: "string" } }, required: ["pergunta"] },
      execute: inp => { (P.cfg.perguntas ||= []).push({ id: uid(), q: String(inp.pergunta || "").slice(0, 300), data: TODAY, feita: false }); touch("psique", { noUndo: true, noRender: true }); note("sugerir_reflexao", trunc(inp.pergunta, 80)); return { ok: true }; } },
    ...filTools(live).filter(t => t.name === "triagem_estoica"));
  return out;
}
Object.assign(MENTOR_DEF, { psi: { page: "psi", sub: "terapeuta", gate: "Saúde mental", cor: "#7aa6a1", ico: "brain", nome: "O Terapeuta", papel: "psicoterapeuta integrativo de apoio entre sessões (não substitui a terapia)", arq: "um psicoterapeuta experiente e integrativo, que escolhe a lente pelo que a pessoa traz",
  voz: "Fala como um psicoterapeuta experiente: escuta antes de falar, nomeia o que percebe com delicadeza, liga o que a pessoa vive aos padrões e à história dela, e muda a forma (profunda, de escuta, direta, acolhedora ou socrática) conforme o momento. Não diagnostica.",
  facts: () => psiFacts(), prompt: psiPrompt, tools: psiTools, before: text => { psiDetect(text); touch("psique", { noUndo: true, noRender: true }); } } });
if (!MIDS.includes("psi")) MIDS.push("psi");
J_QUICK.psi = ["Só preciso desabafar", "Me dê algo prático para esta semana", "Por que eu sempre faço isso?", "Me faça perguntas sobre isso", "Como a minha terapia conversa com a minha jornada?"];

/* ---------------------------------------------------------------- formulários */
const psiChip = (on, attr, txt, c = "") => `<button type="button" class="chip${on ? " on" : ""}" ${attr} aria-pressed="${on}"${c ? ` style="--c:${c}"` : ""}>${esc(txt)}</button>`;
const psiLinks = (o, pre) => `<div class="flbl">Ligar à jornada</div><div class="row wrap">${J_ORDER.map(p => psiChip((o.pilares || []).includes(p), `data-${pre}pil="${p}"`, J_PIL[p].nome, J_PIL[p].cor)).join("")}</div>
  <div class="row wrap psivals">${BM_V.filter(v => bmFoco().includes(v.id) || (o.valores || []).includes(v.id)).map(v => psiChip((o.valores || []).includes(v.id), `data-${pre}val="${v.id}"`, v.nome)).join("") || `<span class="muted small">Valores em foco na Bússola aparecem aqui.</span>`}</div>`;
const psiPadSel = (o, pre) => { const P = psiD(); return `<div class="flbl">Padrões</div><div class="row wrap">${P.padroes.map(p => psiChip((o.padroes || []).includes(p.id), `data-${pre}pad="${p.id}"`, p.nome)).join("") || `<span class="muted small">Nomeie padrões na aba Padrões.</span>`}</div>`; };
const psiProcSel = (o, k) => `<label>Processo<select data-${k}="processo"><option value="">nenhum</option>${psiD().processos.filter(p => p.status !== "concluído" || p.id === o.processo).map(p => `<option value="${p.id}"${o.processo === p.id ? " selected" : ""}>${esc(p.titulo)}</option>`).join("")}</select></label>`;
const psiTA = (o, k, attr, l, ph, rows = 2) => `<label>${l}<textarea rows="${rows}" data-${attr}="${k}" placeholder="${esc(ph)}">${esc(o[k] || "")}</textarea></label>`;
const psiHum = (o, k, attr, l) => `<label>${l}<select data-${attr}="${k}"><option value="">–</option>${[1, 2, 3, 4, 5].map(n => `<option${+o[k] === n ? " selected" : ""}>${n}</option>`).join("")}</select></label>`;
function psiSessForm() {
  const o = PSI.sess;
  return `<div class="psiform"><div class="form f2"><label>Data<input type="date" data-pss="data" value="${o.data}"></label>${psiProcSel(o, "pss")}</div>
    <div class="form f1"><label>Temas (separados por vírgula)<input type="text" data-pss="temasTxt" value="${esc(o.temasTxt || "")}" placeholder="trabalho, pai, autocrítica"></label>
    ${psiTA(o, "insights", "pss", "Insights", "O que ficou claro, o que surpreendeu", 3)}${psiTA(o, "tarefa", "pss", "Para trabalhar até a próxima", "O combinado entre sessões")}</div>
    ${psiPadSel(o, "pss")}${psiLinks(o, "pss")}
    <div class="form f2">${psiHum(o, "antes", "pss", "Como cheguei (1–5)")}${psiHum(o, "depois", "pss", "Como saí (1–5)")}</div>
    <label class="chk"><input type="checkbox" data-pss="privado"${o.privado ? " checked" : ""}> Só meu: não vai para nenhuma IA</label>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="psisesssave">${ic("check")}Guardar sessão</button><button type="button" class="btn sm ghost" data-act="psix">Cancelar</button></div></div>`;
}
function psiReflForm() {
  const o = PSI.refl, t = o.tipo;
  const corpo = t === "pensamento" ? `<div class="form f1">${psiTA(o, "situacao", "psr", "Situação", "O que aconteceu, onde, com quem")}${psiTA(o, "pensamento", "psr", "Pensamento automático", "O que passou pela cabeça na hora")}</div>
      <div class="form f2"><label>Emoção<input type="text" data-psr="emocao" value="${esc(o.emocao || "")}" placeholder="ansiedade, raiva, vergonha"></label><label>Intensidade (0–100)<input type="number" min="0" max="100" data-psr="intensidade" value="${o.intensidade ?? ""}"></label></div>
      <div class="form f2">${psiTA(o, "favor", "psr", "Evidências a favor", "")}${psiTA(o, "contra", "psr", "Evidências contra", "")}</div>
      <div class="form f1">${psiTA(o, "alternativa", "psr", "Pensamento alternativo, mais justo", "Como um amigo sábio veria isso?")}${psiTA(o, "depende", "psr", "O que disto depende de mim (estoicismo)", "Escolha, esforço, resposta")}</div>`
    : `<p class="bmq">${ic("info")}<span>${esc(t === "diaria" ? psiPergunta() : o.pergunta || "Escreva livremente.")}</span></p><div class="form f1">${psiTA(o, "texto", "psr", "Reflexão", "", 4)}</div>`;
  return `<div class="psiform"><div class="segs" role="group" aria-label="Tipo">${[["diaria", "Pergunta do dia"], ["pensamento", "Registro de pensamento"], ["livre", "Livre"]].map(([k, l]) => `<button type="button" class="seg" data-act="psirtipo" data-v="${k}" aria-pressed="${t === k}">${l}</button>`).join("")}</div>
    ${corpo}<div class="form f2">${psiProcSel(o, "psr")}<span></span></div>${psiPadSel(o, "psr")}
    <label class="chk"><input type="checkbox" data-psr="levar"${o.levar ? " checked" : ""}> Levar para a próxima sessão</label><label class="chk"><input type="checkbox" data-psr="privado"${o.privado ? " checked" : ""}> Só meu: não vai para nenhuma IA</label>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="psireflsave">${ic("check")}Guardar</button>${t === "pensamento" ? `<button type="button" class="btn sm" data-act="psitriagem">${ic("flag")}Guardar e fazer a triagem estoica</button>` : ""}<button type="button" class="btn sm ghost" data-act="psix">Cancelar</button></div></div>`;
}
function psiProcForm() {
  const o = PSI.proc;
  return `<div class="psiform"><div class="form f1"><label>Título<input type="text" data-psp="titulo" value="${esc(o.titulo || "")}" placeholder="Ex.: a autocrítica no trabalho"></label>${psiTA(o, "objetivo", "psp", "O que eu quero entender ou mudar", "", 2)}</div>
    <div class="form f2"><label>Início<input type="date" data-psp="inicio" value="${o.inicio}"></label><label>Situação<select data-psp="status">${["ativo", "pausado", "concluído"].map(s => `<option${o.status === s ? " selected" : ""}>${s}</option>`).join("")}</select></label>
    <label>Pilar ligado<select data-psp="pilar"><option value="">nenhum</option>${J_ORDER.map(p => `<option value="${p}"${o.pilar === p ? " selected" : ""}>${J_PIL[p].nome}</option>`).join("")}</select></label>
    <label>Valor da Bússola<select data-psp="valor"><option value="">nenhum</option>${BM_V.map(v => `<option value="${v.id}"${o.valor === v.id ? " selected" : ""}>${v.nome}</option>`).join("")}</select></label></div>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="psiprocsave">${ic("check")}Guardar processo</button><button type="button" class="btn sm ghost" data-act="psix">Cancelar</button></div></div>`;
}
function psiPadForm() {
  const o = PSI.pad;
  return `<div class="psiform"><div class="form f2"><label>Nome<input type="text" data-psd="nome" value="${esc(o.nome || "")}" placeholder="Ex.: ruminação, perfeccionismo"></label><label>Tipo<select data-psd="tipo">${PSI_TIPOS_PAD.map(t => `<option${o.tipo === t ? " selected" : ""}>${t}</option>`).join("")}</select></label></div>
    <div class="form f1">${psiTA(o, "desc", "psd", "Como ele aparece", "")}${psiTA(o, "gatilhos", "psd", "Gatilhos", "")}${psiTA(o, "ajuda", "psd", "O que ajuda", "")}</div>
    <div class="form f2"><label>Valor da Bússola que é o antídoto<select data-psd="valor"><option value="">nenhum</option>${BM_V.map(v => `<option value="${v.id}"${o.valor === v.id ? " selected" : ""}>${v.nome}</option>`).join("")}</select></label><span></span></div>
    <label class="chk"><input type="checkbox" data-psd="privado"${o.privado ? " checked" : ""}> Só meu: não vai para nenhuma IA</label>
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="psipadsave">${ic("check")}Guardar padrão</button><button type="button" class="btn sm ghost" data-act="psix">Cancelar</button></div></div>`;
}

/* ---------------------------------------------------------------- páginas */
const psiPadNome = id => psiD().padroes.find(p => p.id === id)?.nome || "";
const psiProcNome = id => psiD().processos.find(p => p.id === id)?.titulo || "";
function psiTags(o) { return [...(o.pilares || []).map(p => `<span class="jtag sm" style="--c:${J_PIL[p]?.cor}">${esc(J_PIL[p]?.nome || p)}</span>`), ...(o.valores || []).map(v => `<span class="jtag sm">${esc(bmV(v)?.nome || v)}</span>`), ...(o.padroes || []).map(id => `<span class="chip xs">${esc(psiPadNome(id))}</span>`)].join(""); }
function psiSessCard(s) {
  return `<article class="psicard"><header><b>${fmtDL(s.data)}</b>${s.processo ? `<span class="muted small">· ${esc(psiProcNome(s.processo))}</span>` : ""}${s.privado ? `<span class="muted small">${ic("lock")}só meu</span>` : ""}${isNum(s.antes) && isNum(s.depois) ? `<span class="small">humor ${s.antes} → ${s.depois}</span>` : ""}</header>
    ${(s.temas || []).length ? `<p class="small"><span class="flbl">Temas</span>${s.temas.map(esc).join(" · ")}</p>` : ""}${s.insights ? `<p>${esc(s.insights)}</p>` : ""}${s.tarefa ? `<p class="small">${ic("arrow")}${esc(s.tarefa)}</p>` : ""}<div class="row wrap">${psiTags(s)}</div></article>`;
}
function psiReflCard(r) {
  return `<article class="psicard sm"><header><b>${fmtD(r.data)}</b><span class="muted small">${r.tipo === "pensamento" ? "registro de pensamento" : r.tipo === "diaria" ? "pergunta do dia" : "livre"}</span>${r.levar ? `<span class="small">${ic("flag")}na pauta</span>` : ""}${r.estoico ? `<a class="small" href="#jornada.filosofia">${ic("column")}triagem estoica</a>` : ""}${r.privado ? `<span class="muted small">${ic("lock")}só meu</span>` : ""}</header>
    ${r.tipo === "pensamento" ? `<p class="small"><b>${esc(r.situacao || "")}</b></p><p class="small"><i>${esc(r.pensamento || "")}</i> · ${esc(r.emocao || "")} ${r.intensidade ?? ""}${r.alternativa ? `<br>${ic("arrow")}${esc(r.alternativa)}` : ""}</p>` : `${r.pergunta ? `<p class="small muted">${esc(r.pergunta)}</p>` : ""}<p>${esc(trunc(r.texto || "", 400))}</p>`}<div class="row wrap">${psiTags(r)}${r.processo ? `<span class="muted small">· ${esc(psiProcNome(r.processo))}</span>` : ""}</div></article>`;
}
function psiInicio() {
  const P = psiD(), pr = P.processos.filter(p => p.status === "ativo"), prox = psiProx(), sug = psiSugestoes(), pa = P.pauta.filter(x => !x.feito);
  const s90 = P.sessoes.filter(s => s.data >= addDays(TODAY, -89)).length, r7 = P.reflexoes.filter(r => r.data >= addDays(TODAY, -6)).length;
  const fios = [...filD().triagens.filter(t => t.terapia).slice(-3).map(t => ({ d: t.data, txt: `Triagem estoica levada à terapia: “${trunc(t.sit, 70)}”`, go: "jornada.filosofia" })),
    ...P.reflexoes.filter(r => r.estoico).slice(-3).map(r => ({ d: r.data, txt: `Registro de pensamento que virou triagem estoica`, go: "jornada.filosofia" })),
    ...P.sessoes.filter(s => (s.pilares || []).length || (s.valores || []).length).slice(-3).map(s => ({ d: s.data, txt: `Sessão ligada a ${[...(s.pilares || []).map(p => J_PIL[p]?.nome), ...(s.valores || []).map(v => bmV(v)?.nome)].join(", ")}`, go: "psi.sessoes" })),
    ...P.processos.filter(p => p.pilar || p.valor).map(p => ({ d: p.inicio, txt: `Processo “${p.titulo}” ligado a ${[J_PIL[p.pilar]?.nome, bmV(p.valor)?.nome].filter(Boolean).join(" e ")}`, go: "psi.processos" })),
    ...P.padroes.filter(p => filPadAplica(p.nome + " " + (p.desc || ""))).slice(0, 3).map(p => ({ d: p.criado, txt: `Padrão “${p.nome}” tem um exercício estoico na Filosofia`, go: "jornada.filosofia" }))].sort((a, b) => (b.d || "").localeCompare(a.d || "")).slice(0, 8);
  return `<p class="lead">Um lugar para o trabalho psicológico de verdade: o que acontece nas sessões, o que você faz entre elas e como isso conversa com a sua jornada, com as filosofias que te guiam e com as decisões que você toma. Não substitui o seu terapeuta: ajuda a chegar mais inteiro a cada sessão.</p>
    ${kpiRow([kmini("var(--a-men)", "Sessões · 90 dias", String(s90), P.cfg.terapeuta ? `com ${esc(P.cfg.terapeuta)}` : "registre as suas sessões"), kmini("var(--accent)", "Próxima sessão", prox ? fmtD(prox) : "–", prox ? relDay(prox) : "defina a frequência"), kmini("var(--a-pro)", "Processos ativos", String(pr.length), pr[0] ? esc(trunc(pr[0].titulo, 30)) : "nenhum"), kmini("var(--good)", "Entre sessões · 7 dias", String(r7), r7 ? "reflexões e registros" : "uma pergunta por dia ajuda")])}
    <div class="g2c">
      ${panel(`${ic("flag")}Pauta da próxima sessão`, `${pa.length ? `<ul class="psipauta">${pa.map(x => `<li><span>${esc(x.txt)}${x.origem ? ` <small class="muted">· ${esc(x.origem.rot)}</small>` : ""}</span><button type="button" class="btn sm ghost" data-act="psipautaok" data-id="${x.id}">${ic("check")}Levado</button></li>`).join("")}</ul>` : `<p class="muted">Nada na pauta ainda.</p>`}
        ${sug.length ? `<div class="flbl">Sugestões do Atlas</div><ul class="psisug">${sug.map((s, i) => `<li><span>${esc(s)}</span><button type="button" class="btn sm" data-act="psisug" data-i="${i}">${ic("plus")}Pôr na pauta</button></li>`).join("")}</ul>` : ""}
        <div class="row wrap psiadd"><input type="text" id="psi_pauta" placeholder="Algo que você quer levar" aria-label="Novo tema da pauta"><button type="button" class="btn sm" data-act="psipautaadd">${ic("plus")}Pôr na pauta</button></div>`)}
      ${panel(`${ic("sun")}Pergunta de hoje`, `<p class="bmq">${ic("info")}<span>${esc(psiPergunta())}</span></p><button type="button" class="btn sm primary" data-act="psinovarefl" data-v="diaria">${ic("pen")}Responder</button> <a class="btn sm ghost" href="#psi.entre">Registro de pensamento</a>`)}
      ${panel(`${ic("layers")}Processos em curso`, pr.length ? pr.map(p => `<div class="psiproc"><b>${esc(p.titulo)}</b><small class="muted">desde ${fmtD(p.inicio)} · ${plural(psiProcN(p.id), "registro", "registros")}${p.pilar ? ` · ${esc(J_PIL[p.pilar].nome)}` : ""}${p.valor ? ` · ${esc(bmV(p.valor)?.nome)}` : ""}</small><p class="small">${esc(p.objetivo || "")}</p></div>`).join("") : `<p class="muted">Um processo é um tema que você está trabalhando ao longo de várias sessões.</p>`, { act: `<a class="lnk" href="#psi.processos">Todos</a>` })}
      ${panel(`${ic("link")}Fios com a jornada`, fios.length ? `<ul class="psifios">${fios.map(f => `<li><a href="#${f.go}">${esc(f.txt)}</a><small class="muted">${f.d ? fmtD(f.d) : ""}</small></li>`).join("")}</ul>` : `<p class="muted">Quando você ligar sessões a pilares e valores, levar triagens estoicas à terapia ou nomear padrões, os fios aparecem aqui.</p>`)}
    </div>`;
}
function psiSessoes() {
  const P = psiD(), c = P.cfg;
  return `<div class="g2c">${panel(`${ic("brief")}A terapia`, `<div class="form f2"><label>Profissional<input type="text" data-psc="terapeuta" value="${esc(c.terapeuta || "")}" placeholder="Nome ou iniciais"></label><label>Abordagem<input type="text" data-psc="abordagem" value="${esc(c.abordagem || "")}" placeholder="psicanálise, TCC, junguiana…"></label>
      <label>Frequência<select data-psc="freq"><option value="">–</option>${["semanal", "quinzenal", "mensal"].map(f => `<option${c.freq === f ? " selected" : ""}>${f}</option>`).join("")}</select></label><label>Próxima sessão<input type="date" data-psc="proxima" value="${c.proxima || ""}"></label></div>`)}
    ${panel(`${ic("plus")}Registrar sessão`, PSI.sess ? psiSessForm() : `<p class="muted">Logo depois da sessão, em poucos minutos: temas, insights, padrões e o combinado.</p><button type="button" class="btn sm primary" data-act="psinovasess">${ic("plus")}Nova sessão</button>`)}</div>
    ${panel(`${ic("list")}Sessões`, P.sessoes.length ? P.sessoes.slice().sort((a, b) => b.data.localeCompare(a.data)).map(psiSessCard).join("") : `<p class="muted">Nenhuma sessão registrada.</p>`)}`;
}
function psiProcessos() {
  const P = psiD();
  return `${panel(`${ic("plus")}Processo`, PSI.proc ? psiProcForm() : `<button type="button" class="btn sm primary" data-act="psinovoproc">${ic("plus")}Novo processo</button>`)}
    ${P.processos.map(p => { const tl = [...P.sessoes.filter(s => s.processo === p.id).map(s => ({ d: s.data, k: "Sessão", t: s.insights || (s.temas || []).join(", ") })), ...P.reflexoes.filter(r => r.processo === p.id).map(r => ({ d: r.data, k: r.tipo === "pensamento" ? "Registro" : "Reflexão", t: r.pensamento || r.texto })), ...(p.marcos || []).map(m => ({ d: m.data, k: "Marco", t: m.txt }))].sort((a, b) => b.d.localeCompare(a.d));
      return panel(`${esc(p.titulo)} <small>${esc(p.status)}</small>`, `<p>${esc(p.objetivo || "")}</p><p class="small muted">desde ${fmtD(p.inicio)}${p.pilar ? ` · <a href="#jornada.${J_PIL[p.pilar].sub}">${esc(J_PIL[p.pilar].nome)}</a>` : ""}${p.valor ? ` · <a href="#jornada.bussola">${esc(bmV(p.valor)?.nome)}</a>` : ""}</p>
        <ol class="psitl">${tl.map(x => `<li><small>${fmtD(x.d)} · ${esc(x.k)}</small><span>${esc(trunc(x.t || "", 180))}</span></li>`).join("") || `<li class="muted">Ligue sessões e reflexões a este processo.</li>`}</ol>
        <div class="row wrap psiadd"><input type="text" data-psimarco="${p.id}" placeholder="Um marco: o que mudou" aria-label="Novo marco"><button type="button" class="btn sm" data-act="psimarco" data-id="${p.id}">${ic("plus")}Marco</button>${["ativo", "pausado", "concluído"].filter(s => s !== p.status).map(s => `<button type="button" class="btn sm ghost" data-act="psipst" data-id="${p.id}" data-v="${s}">${s === "ativo" ? "Retomar" : s === "pausado" ? "Pausar" : "Concluir"}</button>`).join("")}</div>`); }).join("")}`;
}
function psiEntre() {
  const P = psiD(), qs = (P.cfg.perguntas || []).filter(q => !q.feita);
  return `<div class="g2c">${panel(`${ic("pen")}Entre sessões`, PSI.refl ? psiReflForm() : `<p class="muted">O trabalho continua entre as sessões: uma pergunta por dia, ou um registro de pensamento quando algo pesar.</p><div class="row wrap"><button type="button" class="btn sm primary" data-act="psinovarefl" data-v="diaria">${ic("sun")}Pergunta do dia</button><button type="button" class="btn sm" data-act="psinovarefl" data-v="pensamento">${ic("brain")}Registro de pensamento</button><button type="button" class="btn sm ghost" data-act="psinovarefl" data-v="livre">${ic("pen")}Livre</button></div>`)}
    ${panel(`${ic("info")}Perguntas deixadas pelo Terapeuta`, qs.length ? `<ul class="psisug">${qs.map(q => `<li><span>${esc(q.q)}</span><button type="button" class="btn sm" data-act="psiq" data-id="${q.id}">${ic("pen")}Responder</button></li>`).join("")}</ul>` : `<p class="muted">Quando o Terapeuta deixar uma pergunta para refletir, ela aparece aqui.</p>`)}</div>
    ${panel(`${ic("list")}Registros`, P.reflexoes.length ? P.reflexoes.slice().sort((a, b) => b.at - a.at).slice(0, 30).map(psiReflCard).join("") : `<p class="muted">Nada registrado ainda.</p>`)}`;
}
function psiPadroes() {
  const P = psiD();
  return `${panel(`${ic("plus")}Padrão`, PSI.pad ? psiPadForm() : `<p class="muted">Um padrão é algo que se repete: um pensamento, uma reação, um jeito de se relacionar. Nomear ajuda a reconhecê-lo na hora.</p><button type="button" class="btn sm primary" data-act="psinovopad">${ic("plus")}Nomear um padrão</button>`)}
    <div class="g2c">${P.padroes.map(p => { const o30 = psiOcorr(p.id, 30).length, o90 = psiOcorr(p.id).length, fe = filPadAplica(p.nome + " " + (p.desc || "")), v = p.valor ? bmV(p.valor) : null;
      return panel(`${esc(p.nome)} <small>${esc(p.tipo)}${p.privado ? " · só meu" : ""}</small>`, `${p.desc ? `<p>${esc(p.desc)}</p>` : ""}<p class="small"><b>${o30}</b> vez(es) em 30 dias · <b>${o90}</b> em 90${p.gatilhos ? ` · gatilhos: ${esc(p.gatilhos)}` : ""}</p>${p.ajuda ? `<p class="small">${ic("check")}${esc(p.ajuda)}</p>` : ""}
        ${fe ? `<p class="small psistoa">${ic("column")}<span><b>Estoicismo:</b> ${esc(fe[1])} <small class="muted">${esc(fe[2])}</small></span></p>` : ""}${v ? `<p class="small">${ic("compass")}Antídoto na Bússola: <a href="#jornada.bussola">${esc(v.nome)}</a>. <span class="muted">${esc(trunc(v.t?.estoico || "", 160))}</span></p>` : ""}
        <div class="row wrap"><button type="button" class="btn sm" data-act="psipadtri" data-id="${p.id}">${ic("flag")}Triagem estoica</button><button type="button" class="btn sm ghost" data-act="psipadpauta" data-id="${p.id}">${ic("plus")}Pôr na pauta</button></div>`); }).join("") || ""}</div>`;
}
function psiTerapeuta() {
  const M = psiD().modo, md0 = PSI_MODOS[M.atual] || PSI_MODOS.escuta;
  return `<div class="psimodos" role="group" aria-label="Forma da conversa"><button type="button" class="chip${M.fixo === "auto" ? " on" : ""}" data-act="psimodo" data-v="auto" aria-pressed="${M.fixo === "auto"}">${ic("spark")}Automático</button>${Object.entries(PSI_MODOS).map(([k, x]) => `<button type="button" class="chip${M.fixo === k ? " on" : ""}" data-act="psimodo" data-v="${k}" aria-pressed="${M.fixo === k}" title="${esc(x.d)}">${ic(x.ico)}${esc(x.nome)}</button>`).join("")}</div>
    <p class="small psimodo">${ic(md0.ico)}Forma agora: <b>${esc(md0.nome)}</b> — ${esc(md0.d)}${M.motivo ? ` <span class="muted">(${esc(M.motivo)})</span>` : ""}. ${M.fixo === "auto" ? "Mudo conforme o que você pede ou o jeito de escrever; toque numa forma para fixá-la." : "Fixada por você; toque em Automático para eu voltar a ajustar."}</p>
    ${jChat("psi", { intro: "Pode começar por onde quiser. Se quiser só desabafar, me diga; se quiser algo prático, também. Eu me ajusto.", quick: J_QUICK.psi, recLabel: "", priv: "O Terapeuta lê as sessões, processos, padrões e registros entre sessões (menos os marcados como só seus), os últimos dias de humor e sono, e um resumo da jornada, da Bússola e da Filosofia. Se a Saúde mental estiver fora da IA em Privacidade, ele não conversa. Em crise: na Itália 112 ou Telefono Amico 02 2327 2327; no Brasil, CVV 188." })}`;
}
function pPsique() {
  return SUB === "sessoes" ? psiSessoes() : SUB === "processos" ? psiProcessos() : SUB === "entre" ? psiEntre() : SUB === "padroes" ? psiPadroes() : SUB === "terapeuta" ? psiTerapeuta() : psiInicio();
}

/* ---------------------------------------------------------------- ações */
const psiToggle = (arr, v) => arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
function psiSaveRefl(triagem) {
  const o = PSI.refl, P = psiD(), t = o.tipo;
  if (t === "pensamento" ? !(o.situacao || "").trim() || !(o.pensamento || "").trim() : !(o.texto || "").trim()) { toast(t === "pensamento" ? "Escreva a situação e o pensamento." : "Escreva a reflexão."); return null; }
  const rec = { id: uid(), data: TODAY, at: Date.now(), tipo: t, pergunta: t === "diaria" ? psiPergunta() : o.pergunta || "", texto: (o.texto || "").trim(), situacao: (o.situacao || "").trim(), pensamento: (o.pensamento || "").trim(), emocao: (o.emocao || "").trim(), intensidade: isNum(+o.intensidade) && o.intensidade !== "" ? clamp(Math.round(+o.intensidade), 0, 100) : null, favor: (o.favor || "").trim(), contra: (o.contra || "").trim(), alternativa: (o.alternativa || "").trim(), depende: (o.depende || "").trim(), processo: o.processo || "", padroes: o.padroes || [], levar: !!o.levar, privado: !!o.privado, estoico: !!triagem };
  P.reflexoes.push(rec); if (o.qid) { const q = (P.cfg.perguntas || []).find(x => x.id === o.qid); if (q) q.feita = true; }
  if (rec.levar) psiPautaAdd(t === "pensamento" ? `Registro de ${fmtD(rec.data)}: “${trunc(rec.pensamento, 100)}”` : `Reflexão de ${fmtD(rec.data)}: ${trunc(rec.texto, 100)}`, { k: "refl", id: rec.id, rot: "Entre sessões" });
  PSI.refl = null; return rec;
}
function psiClick(t) {
  const ds = t.dataset, a = ds.act, P = psiD();
  if (a === "jcheck" && ds.mid === "psi") { askMentor("psi", "Faça um acompanhamento entre sessões: 1) o que você percebe nas minhas últimas sessões, registros e padrões, com datas; 2) como isso conversa com a minha jornada, a Bússola e as triagens estoicas; 3) o que levar para a próxima sessão; 4) uma pergunta para eu refletir nesta semana. Atualize o plano entre sessões.", "check"); return true; }
  for (const [pre, o] of [["pss", PSI.sess], ["psr", PSI.refl]]) { if (!o) continue;
    if (ds[pre + "pil"]) { o.pilares = psiToggle(o.pilares || [], ds[pre + "pil"]); render(); return true; }
    if (ds[pre + "val"]) { o.valores = psiToggle(o.valores || [], ds[pre + "val"]); render(); return true; }
    if (ds[pre + "pad"]) { o.padroes = psiToggle(o.padroes || [], ds[pre + "pad"]); render(); return true; } }
  if (!a?.startsWith("psi")) return false;
  if (a === "psix") { PSI.sess = PSI.refl = PSI.proc = PSI.pad = null; render(); return true; }
  if (a === "psinovasess") { PSI.sess = { data: TODAY, temasTxt: "", insights: "", tarefa: "", padroes: [], pilares: [], valores: [], processo: P.processos.find(p => p.status === "ativo")?.id || "" }; render(); return true; }
  if (a === "psisesssave") { const o = PSI.sess; if (!o.insights?.trim() && !o.temasTxt?.trim()) { toast("Escreva ao menos os temas ou um insight."); return true; }
    const rec = { id: uid(), data: o.data || TODAY, temas: (o.temasTxt || "").split(",").map(s => s.trim()).filter(Boolean), insights: (o.insights || "").trim(), tarefa: (o.tarefa || "").trim(), padroes: o.padroes || [], pilares: o.pilares || [], valores: o.valores || [], processo: o.processo || "", antes: o.antes ? +o.antes : null, depois: o.depois ? +o.depois : null, privado: !!o.privado };
    P.sessoes.push(rec); P.pauta.filter(x => !x.feito).forEach(x => { x.feito = true; x.em = rec.data; }); if (P.cfg.proxima && P.cfg.proxima <= rec.data) P.cfg.proxima = "";
    PSI.sess = null; touch("psique", { label: "Sessão registrada" }); undoToast("Sessão registrada; a pauta foi marcada como levada"); return true; }
  if (a === "psinovarefl") { PSI.refl = { tipo: ds.v || "diaria", padroes: [], processo: P.processos.find(p => p.status === "ativo")?.id || "" }; if (SUB !== "entre") setHash("psi", "entre"); else render(); return true; }
  if (a === "psiq") { const q = (P.cfg.perguntas || []).find(x => x.id === ds.id); PSI.refl = { tipo: "livre", pergunta: q?.q || "", qid: ds.id, padroes: [] }; render(); return true; }
  if (a === "psirtipo") { PSI.refl.tipo = ds.v; render(); return true; }
  if (a === "psireflsave") { if (psiSaveRefl(false)) { touch("psique", { label: "Registro entre sessões" }); undoToast("Guardado"); } return true; }
  if (a === "psitriagem") { const r = psiSaveRefl(true); if (!r) return true; filTriNova({ k: "psi", id: r.id, rot: `Registro de pensamento de ${fmtD(r.data)}`, go: "psi.entre", txt: `${r.situacao}. Pensamento: ${r.pensamento}` }); if (r.depende) FIL.tri.meu = r.depende; touch("psique", { label: "Registro entre sessões" }); setHash("jornada", "filosofia"); return true; }
  if (a === "psinovoproc") { PSI.proc = { titulo: "", objetivo: "", inicio: TODAY, status: "ativo", pilar: "", valor: "" }; render(); return true; }
  if (a === "psiprocsave") { const o = PSI.proc; if (!o.titulo?.trim()) { toast("Dê um título ao processo."); return true; } P.processos.push({ id: uid(), titulo: o.titulo.trim(), objetivo: (o.objetivo || "").trim(), inicio: o.inicio || TODAY, status: o.status || "ativo", pilar: o.pilar || "", valor: o.valor || "", marcos: [] }); PSI.proc = null; touch("psique", { label: "Processo criado" }); return true; }
  if (a === "psimarco") { const p = P.processos.find(x => x.id === ds.id), el = $(`[data-psimarco="${ds.id}"]`), v = el?.value.trim(); if (!p || !v) return true; (p.marcos ||= []).push({ data: TODAY, txt: v.slice(0, 300) }); touch("psique", { label: "Marco do processo" }); return true; }
  if (a === "psipst") { const p = P.processos.find(x => x.id === ds.id); if (p) { p.status = ds.v; touch("psique", { label: `Processo ${ds.v}` }); } return true; }
  if (a === "psinovopad") { PSI.pad = { nome: "", tipo: "pensamento", desc: "", gatilhos: "", ajuda: "", valor: "" }; render(); return true; }
  if (a === "psipadsave") { const o = PSI.pad; if (!o.nome?.trim()) { toast("Dê um nome ao padrão."); return true; } P.padroes.push({ id: uid(), nome: o.nome.trim().slice(0, 80), tipo: o.tipo || "pensamento", desc: (o.desc || "").trim(), gatilhos: (o.gatilhos || "").trim(), ajuda: (o.ajuda || "").trim(), valor: o.valor || "", privado: !!o.privado, criado: TODAY }); PSI.pad = null; touch("psique", { label: "Padrão nomeado" }); return true; }
  if (a === "psipadtri") { const p = P.padroes.find(x => x.id === ds.id); if (p) { filTriNova({ k: "pad", id: p.id, rot: `Padrão · ${p.nome}`, go: "psi.padroes", txt: `${p.nome}${p.desc ? `: ${p.desc}` : ""}` }); setHash("jornada", "filosofia"); } return true; }
  if (a === "psipadpauta") { const p = P.padroes.find(x => x.id === ds.id); if (p && psiPautaAdd(`O padrão “${p.nome}”: ${psiOcorr(p.id, 30).length} vez(es) em 30 dias`, { k: "pad", id: p.id, rot: "Padrões" })) { touch("psique", { label: "Pauta" }); toast("Na pauta da próxima sessão"); } return true; }
  if (a === "psipautaadd") { const el = $("#psi_pauta"); if (psiPautaAdd(el?.value)) touch("psique", { label: "Pauta" }); return true; }
  if (a === "psisug") { const s = psiSugestoes()[+ds.i]; if (s && psiPautaAdd(s, { k: "auto", rot: "Atlas" })) touch("psique", { label: "Pauta" }); return true; }
  if (a === "psipautaok") { const x = P.pauta.find(z => z.id === ds.id); if (x) { x.feito = true; x.em = TODAY; touch("psique", { label: "Pauta" }); } return true; }
  if (a === "psimodo") { P.modo.fixo = ds.v; if (ds.v !== "auto") { P.modo.atual = ds.v; P.modo.motivo = "forma escolhida por você"; } else P.modo.motivo = ""; touch("psique", { noUndo: true }); return true; }
  return true;
}
function psiInput(t) {
  for (const [k, o] of [["pss", PSI.sess], ["psr", PSI.refl], ["psp", PSI.proc], ["psd", PSI.pad]]) if (t.dataset[k] && o && t.type !== "checkbox") { o[t.dataset[k]] = t.value; return true; }
  if (t.dataset.psc) { psiD().cfg[t.dataset.psc] = t.value; touch("psique", { noUndo: true, noRender: true }); return true; }
  return false;
}
function psiChange(t) {
  for (const [k, o] of [["pss", PSI.sess], ["psr", PSI.refl], ["psp", PSI.proc], ["psd", PSI.pad]]) if (t.dataset[k] && o) { o[t.dataset[k]] = t.type === "checkbox" ? t.checked : t.value; return true; }
  if (t.dataset.psc) { psiD().cfg[t.dataset.psc] = t.value; touch("psique", { label: "Dados da terapia" }); return true; }
  return false;
}

/* ---------------------------------------------------------------- dados de exemplo (fictícios) */
function psiExemplo() {
  const d = n => addDays(TODAY, -n);
  return { cfg: { terapeuta: "Dra. L.", abordagem: "psicodinâmica breve", freq: "semanal", proxima: addDays(TODAY, 2), perguntas: [{ id: "pq1", q: "Quando a autocrítica aparece, de quem é a voz?", data: d(3), feita: false }] },
    processos: [{ id: "pp1", titulo: "A autocrítica no trabalho", objetivo: "Entender de onde vem a cobrança e trabalhar com menos medo de errar", inicio: d(60), status: "ativo", pilar: "bud", valor: "paciencia", marcos: [{ data: d(20), txt: "Percebi que a voz da cobrança soa como a do meu pai" }] },
      { id: "pp2", titulo: "Luto pela mudança de país", objetivo: "Dar lugar ao que ficou no Brasil sem me fechar à vida aqui", inicio: d(120), status: "pausado", pilar: "esp", valor: "", marcos: [] }],
    padroes: [{ id: "pd1", nome: "Ruminação", tipo: "pensamento", desc: "Repasso conversas à noite procurando o que eu deveria ter dito", gatilhos: "conflitos no trabalho, cansaço", ajuda: "escrever e deixar para amanhã", valor: "paciencia", privado: false, criado: d(50) },
      { id: "pd2", nome: "Perfeccionismo", tipo: "esquema", desc: "Só entrego quando está impecável, e então atraso", gatilhos: "entregas visíveis", ajuda: "definir antes o que é bom o bastante", valor: "humildade", privado: false, criado: d(40) }],
    sessoes: [{ id: "ps1", data: d(14), temas: ["trabalho", "pai"], insights: "A cobrança que sinto no trabalho repete o tom de casa; percebi isso pela primeira vez sem me defender.", tarefa: "Notar quando a voz da cobrança aparece e de quem ela parece ser", padroes: ["pd2"], pilares: ["bud"], valores: ["paciencia"], processo: "pp1", antes: 2, depois: 3, privado: false },
      { id: "ps2", data: d(7), temas: ["entrega atrasada", "sono"], insights: "Quando atraso, durmo mal e rumino; o atraso vem do perfeccionismo, não da preguiça.", tarefa: "Definir o 'bom o bastante' antes de começar", padroes: ["pd1", "pd2"], pilares: [], valores: ["equilibrio"], processo: "pp1", antes: 2, depois: 4, privado: false }],
    reflexoes: [{ id: "pr1", data: d(5), at: Date.now() - 5 * 864e5, tipo: "pensamento", situacao: "O cliente respondeu seco ao novo cronograma", pensamento: "Ele acha que eu sou incompetente", emocao: "vergonha", intensidade: 70, favor: "a mensagem foi curta", contra: "ele aprovou o cronograma; ele escreve curto com todos", alternativa: "Ele estava ocupado; o cronograma foi aceito", depende: "Cumprir o novo prazo e manter a comunicação clara", processo: "pp1", padroes: ["pd1"], levar: false, privado: false, estoico: true, texto: "", pergunta: "" },
      { id: "pr2", data: d(1), at: Date.now() - 864e5, tipo: "diaria", pergunta: PSI_DIARIAS[1], texto: "Repeti para mim que deveria ter feito melhor a apresentação. Não é verdadeiro: ela foi boa o bastante para o objetivo.", situacao: "", pensamento: "", processo: "pp1", padroes: ["pd1", "pd2"], levar: true, privado: false, estoico: false }],
    pauta: [{ id: "pa1", txt: "Reflexão de ontem: a cobrança depois da apresentação", origem: { k: "refl", id: "pr2", rot: "Entre sessões" }, data: d(1), feito: false }, { id: "pa2", txt: "Triagem estoica: “Fico remoendo a conversa difícil com o meu irmão”", origem: { k: "tri", id: "ftr2", rot: "Filosofia" }, data: d(2), feito: false }],
    modo: { fixo: "auto", atual: "escuta", motivo: "" } };
}
