/* ================================================================ Administração Pessoal: o Conselho de Administração da vida
   Os mentores de todas as áreas se reúnem como diretores, cada um com o próprio prompt e a própria memória (mentorPrompt
   em modo conselho); o Intermediador conduz a sessão por uma máquina de estados e responde só em JSON; o CEO (a pessoa)
   responde, intervém e decide. Tudo fica em S.conselho, no mesmo armazenamento das outras abas. */
const conselhoConfig = {
  fases: ["REVISAO_ATA", "ABERTURA", "RELATORIOS", "CRUZAMENTO", "DEBATE", "CONTEMPLACAO", "CONFLITOS", "PREVISOES", "DELIBERACOES", "ATA"],
  diretores: ["fis", "men", "fin", "car", "apr", "fam", "amo", "ami", "laz", "pro", "cas", "bm"],
  convidados: ["esp", "med", "tao", "bud", "lzlei", "lzfil", "lzjog", "lzvia", "lzcaf", "lzavi", "lzest"],
  maxTurnos: 40, maxFalasPorFase: 3, palavrasPorFala: 150, resumoACada: 5, palavrasBriefing: 300,
  relatoriosEmSequencia: true,       // na fase de relatórios os diretores falam em ordem, sem uma chamada do Intermediador antes de cada um
  esperaMs: [2000, 4000],            // novas tentativas só para falha passageira do serviço (upstream_error)
  tierIntermediador: "default", tierMentor: "default", tierResumo: "quick", tierAta: "complex",
  cadencia: "semanal",               // ordinária: semanal ou mensal
  minAcoes: 1, maxAcoes: 5,
  maxReplicas: 2,                    // modo observador: réplicas diretas seguidas entre diretores, sem o Intermediador no meio
};
/* o que a pessoa pode ajustar na própria aba (o resto fica no código) */
const CS_EDIT = [["maxTurnos", "Turnos por sessão", 12, 80], ["maxFalasPorFase", "Falas por mentor em cada fase", 1, 6], ["palavrasPorFala", "Palavras por fala", 60, 300], ["resumoACada", "Resumo corrente a cada (turnos)", 3, 12], ["palavrasBriefing", "Palavras por briefing", 120, 600]];
const csCfg = () => ({ ...conselhoConfig, ...(S.conselho?.cfg || {}) });
const CS_FASE = {
  REVISAO_ATA: ["Revisão da ata", "Revisar as ações da ata anterior: o que foi feito, o que não foi e por quê. Pergunte aos diretores responsáveis e ao CEO."],
  ABERTURA: ["Abertura", "Definir com o CEO o foco da sessão (revisão geral, um tema ou uma crise), à luz do tipo de sessão e do que a revisão mostrou."],
  RELATORIOS: ["Relatórios", "Cada diretor apresenta estado atual, tendência (↑ ↓ →), uma vitória e um ponto de atenção."],
  CRUZAMENTO: ["Cruzamento", "Correlações entre áreas, disputas por tempo, energia, dinheiro e atenção, e efeitos em cascata. Chame os diretores cujas áreas se afetam."],
  DEBATE: ["Debate", "Os 1 a 3 temas mais relevantes, explorados a fundo com as técnicas. Poucos temas, bem explorados."],
  CONTEMPLACAO: ["Contemplação", "Sentido, valores e coerência entre quem o CEO é e como vive. Desacelere; fale com o CEO; a Bússola e o Propósito podem contribuir."],
  CONFLITOS: ["Conflitos", "Transformar os conflitos em trade-offs explícitos (opção, o que custa, para quem) e levá-los ao CEO para decidir."],
  PREVISOES: ["Previsões", "Cenário se nada mudar e cenário com as ações aplicadas, em 1, 5 e 10 anos."],
  DELIBERACOES: ["Deliberações", "Decisões do CEO e 3 a 5 ações com área, prazo e critério de sucesso. Confirme com o CEO."],
  ATA: ["Ata", "Gerar a ata da sessão."],
};
const CS_TIPOS = { ordinaria: ["Ordinária", "Revisão geral da semana ou do mês."], trimestral: ["Trimestral", "Balanço profundo e ajuste de metas."], anual: ["Anual", "Visão, valores e direção de longo prazo."], extraordinaria: ["Extraordinária", "Uma crise ou um alerta grave, com foco nele."] };
const CS_ST = { aberta: "aberta", feita: "feita", nao_feita: "não feita", proposta: "aguardando aprovação", recusada: "recusada" };
/* abas onde as ações do Conselho aparecem para marcar como feitas */
const CS_PAGE_AREAS = { ...PAGE_AREAS, carreira: ["Carreira"], idiomas: ["Aprendizado"], lazer: ["Lazer & criatividade"], jornada: ["Propósito & espiritualidade", "Bússola moral"] };
const CS = { tipo: "ordinaria", foco: "", obs: false, input: "", busy: false, ctl: null, status: "", live: null, ver: null, area: "geral", stick: true };

/* ---------------------------------------------------------------- estado e rótulos */
const csD = () => (S.conselho ||= { cfg: {}, atas: [], sessao: null });
const csArea = mid => mid === "bm" ? "Bússola moral" : MENTOR_DEF[mid]?.area || MENTOR_DEF[mid]?.gate || "";
const csMidOfArea = a => a === "Bússola moral" ? "bm" : AREA_INFO[a]?.id || null;
const csNome = q => q === "int" ? "Intermediador" : q === "ceo" ? "Você (CEO)" : q === "sis" ? "Atlas" : MENTOR_DEF[q]?.nome || q;
const csSave = (label) => touch("conselho", label ? { label } : { noUndo: true, noRender: true });
const csWords = (s, n) => { const w = String(s || "").trim().split(/\s+/); return w.length <= n ? String(s || "").trim() : w.slice(0, n).join(" ") + "…"; };
const csIdx = f => conselhoConfig.fases.indexOf(f);
const csNext = f => conselhoConfig.fases[Math.min(csIdx(f) + 1, conselhoConfig.fases.length - 1)];
function csSeats() { const C = csCfg(); return { dir: C.diretores.filter(m => MENTOR_DEF[m] && !blockedMentor(m)), conv: C.convidados.filter(m => MENTOR_DEF[m] && !blockedMentor(m)), priv: [...C.diretores, ...C.convidados].filter(m => MENTOR_DEF[m] && blockedMentor(m)) }; }
const csAtaUlt = () => csD().atas.at(-1) || null;
const csAbertas = () => csD().atas.flatMap(a => (a.acoes || []).filter(x => x.status === "aberta").map(x => ({ ...x, ata: a.id, data: a.data })));
const csMsg = (quem, texto, extra = {}) => { const m = { id: uid(), quem, texto, fase: csD().sessao?.fase, at: Date.now(), ...extra }; csD().sessao.msgs.push(m); return m; };

/* ---------------------------------------------------------------- briefing por área (local, sem IA, ~300 palavras) */
function csBrief(mid) {
  const def = MENTOR_DEF[mid], m = mget(mid), C = csCfg(), L = [], Hs = []; for (let k = 5; k >= 0; k--) Hs.push(calcAt(addMonth(mkey(TODAY), -k)));
  const cur = Hs.at(-1), a = def.area; let sem = false, trend = "?", head = "";
  if (blockedMentor(mid)) return { txt: "Setor privado: a pessoa escolheu não compartilhar esta área com a IA.", sem: true, priv: true, head: "setor privado", trend: "?" };
  if (a) {
    const A = cur.areas.find(x => x.a === a) || {}, ser = Hs.map(h => h.areas.find(x => x.a === a)?.dados), last = ser.at(-1), old = ser.at(-4);
    trend = !isNum(last) || !isNum(old) ? "?" : last - old >= .5 ? "↑" : old - last >= .5 ? "↓" : "→";
    const ms = cur.metas.filter(x => x.area === a && x.ativa !== false), hs = cur.hab.filter(h => h.area === a), ts = cur.tar.filter(t => t.area === a && t.open), late = ts.filter(t => t.prazo && t.prazo < TODAY);
    const sp = specFacts(mid, Hs).map(x => trunc(String(x).replace(/\s+/g, " "), 220)).slice(0, 3);
    sem = !isNum(last) && !ms.length && !hs.length && !ts.length;
    head = `placar ${isNum(last) ? num(last) : "–"}/10 ${trend}${isNum(A.perc) ? `, percepção ${A.perc}` : ""}${late.length ? `, ${plural(late.length, "tarefa atrasada", "tarefas atrasadas")}` : ""}`;
    L.push(`ESTADO: placar de dados (0–10) ${Hs.slice(-4).map((h, i) => `${mabbr(h.mk)} ${isNum(ser[i + 2]) ? num(ser[i + 2]) : "–"}`).join(", ")}; tendência de 3 meses ${trend}; percepção na Roda ${A.perc ?? "–"} (alvo ${A.alvo ?? "–"}).`);
    if (ms.length) L.push("METAS: " + ms.slice(0, 3).map(x => `"${x.meta}" ${pct(x.prog)}${x.esp != null ? ` (esperado ${pct(x.esp)})` : ""}${x.prazo ? `, prazo ${x.prazo}` : ""}, ${x.rt}`).join("; ") + ".");
    if (hs.length) L.push("HÁBITOS: " + hs.slice(0, 3).map(h => `${h.nome} ${pct(h.pm)} da meta, sequência ${h.streak}`).join("; ") + ".");
    if (ts.length) L.push(`TAREFAS: ${ts.length} abertas, ${late.length} atrasadas${late.length ? ` (${late.slice(0, 3).map(t => `${t.tarefa}, ${fmtD(t.prazo)}`).join("; ")})` : ""}.`);
    if (sp.length) L.push("NÚMEROS: " + sp.join(" | "));
    const al = [...radarAlerts().filter(x => x.area === a && x.tipo !== "sequencia").map(x => x.titulo), ...ms.filter(x => x.st === "crit").map(x => `meta em risco: ${x.meta}`)];
    if (al.length) L.push("ALERTAS: " + [...new Set(al)].slice(0, 3).join("; ") + ".");
    const es = aiEntries(S.diario.filter(e => e.data >= addDays(TODAY, -21) && parseEntry(e.texto).areas.includes(a)).sort((x, y) => y.data.localeCompare(x.data)));
    if (es.length) L.push(`DIÁRIO (21 dias): ${plural(es.length, "entrada", "entradas")}; a mais recente, ${fmtD(es[0].data)}: "${trunc(snippet(es[0], 160), 160)}".`);
  } else {
    const facts = MENTOR_DEF[mid].jor ? (mid === "bm" ? jBmFacts() : jPilarFacts(jMidP(mid), false)) : MENTOR_DEF[mid].lz ? lzFacts(MENTOR_DEF[mid].lz) : [];
    const txt = facts.join(" ").replace(/\s+/g, " ").trim(); sem = txt.length < 60;
    head = trunc(txt, 90) || "sem registros"; L.push("ESTADO: " + (txt || "sem registros nesta área."));
  }
  const conv = m.conversa?.length ? `última conversa com a pessoa em ${fmtD(iso(new Date(m.visto || m.conversa.at(-1).at)))}` : "nunca conversaram";
  const mem = m.mem.slice(-3).map(x => `${x.tipo}: ${trunc(x.texto, 90)}`);
  L.push(`ÚLTIMAS INTERAÇÕES: ${conv}${mem.length ? `; memória recente: ${mem.join("; ")}` : ""}.`);
  const pend = [...(m.plano?.passos || []).filter(p => !p.feito).slice(0, 3).map(p => `${p.texto}${p.prazo ? ` (até ${fmtD(p.prazo)})` : ""}`), ...csAbertas().filter(x => x.mid === mid).map(x => `ação do Conselho: ${x.acao} (até ${fmtD(x.prazo)})`)];
  if (pend.length) L.push("AÇÕES PENDENTES: " + pend.join("; ") + ".");
  if (sem) L.unshift("SEM DADOS SUFICIENTES nesta área: diga isso na reunião e o que precisaria ser registrado.");
  return { txt: csWords(L.join("\n"), C.palavrasBriefing), sem, head: sem ? "sem dados suficientes" : head, trend };
}
function csBriefOf(mid) { const s = csD().sessao; if (!s) return csBrief(mid); return s.briefs[mid] ||= csBrief(mid); }

/* ---------------------------------------------------------------- chamadas: falha passageira tenta de novo com espera; o resto pausa */
const csSleep = (ms, sig) => new Promise((ok, no) => { const t = setTimeout(ok, ms); sig?.addEventListener("abort", () => { clearTimeout(t); no({ code: "cancelled" }); }, { once: true }); });
function csStatus(t) { CS.status = t; const el = $("#csstatus"); if (el) el.textContent = t; }
async function csCall(recurso, build, opts) {
  const C = csCfg(), s = csD().sessao;
  for (let i = 0; ; i++) {
    try { s.chamadas = (s.chamadas || 0) + 1; return await aiCall(`Conselho · ${recurso}`, build, { signal: CS.ctl.signal, cache: false, ...opts }); }
    catch (e) {
      if (e?.code === "cancelled" || CS.ctl.signal.aborted) throw { code: "cancelled" };
      const transient = !e?.code || e.code === "upstream_error";
      if (!transient || i >= C.esperaMs.length) throw e;
      csStatus(`A IA falhou (${e?.code || "conexão"}). Nova tentativa ${i + 1} de ${C.esperaMs.length} em ${Math.round(C.esperaMs[i] / 1000)} s…`);
      await csSleep(C.esperaMs[i], CS.ctl.signal);
    }
  }
}
const CS_ERR = { rate_limited: "Limite de uso do Claude atingido por agora. A sessão ficou pausada com tudo salvo; tente de novo daqui a pouco.", upstream_error: "O serviço do Claude falhou mesmo depois de novas tentativas. A sessão ficou pausada com tudo salvo.", not_granted: "Este app não tem permissão para usar o Claude nesta visualização.", session_expired: "Sua sessão no Claude expirou: entre de novo e retome.", refused: "O Claude recusou este pedido. Pule a fase ou reformule pela intervenção.", prompt_too_large: "A sessão ficou grande demais para uma chamada. Encerre e gere a ata.", invalid_json: "O Intermediador não devolveu o formato esperado." };

/* ---------------------------------------------------------------- Intermediador: decide o próximo turno, só em JSON */
function csTranscript(n = 10) { const s = csD().sessao; return s.msgs.slice(Math.max(s.resumoAte || 0, s.msgs.length - n)).filter(m => m.quem !== "sis" || m.fase).map(m => m.quem === "sis" ? `[Atlas] ${m.texto}` : m.quem === "int" ? `[Intermediador → ${csNome(m.para)}] ${m.texto}` : `[${csNome(m.quem)}] ${m.texto}`).join("\n"); }
function csIntPersona() {
  return `Você é o Intermediador do Conselho de Administração da vida de ${S.cfg.nome || "uma pessoa"} (o CEO), no app pessoal "Atlas da Vida". Os diretores são os mentores das áreas da vida; o CEO é a própria pessoa e toma todas as decisões finais.
QUEM VOCÊ É: facilitador neutro, com a escuta de um terapeuta, o rigor de um consultor estratégico e a curiosidade de um filósofo. Não representa nenhuma área: sua lealdade é ao todo e à verdade. Tom respeitoso, direto e humano; nem coach motivacional, nem auditor frio. Desconforto produtivo sim, julgamento não. Honestidade acima de conforto, sem elogios vazios. Dados antes de opiniões, sem ignorar o que os dados não medem. Nenhuma área é mais importante que o todo. Português do Brasil.
RESPONSABILIDADES: conduzir o roteiro e decidir quem fala; garantir que todas as áreas participem, inclusive as negligenciadas; apontar causa e efeito entre áreas; detectar padrões, promessas não cumpridas e contradições entre discurso e dados; transformar conflitos vagos em trade-offs explícitos para o CEO decidir; proteger a profundidade (poucos temas, bem explorados).
TÉCNICAS: 5 porquês, advogado do diabo, inversão ("como piorar esta área de propósito?"), espelho, projeção temporal (1, 5 e 10 anos), perspectiva cruzada, pausa contemplativa, custo da inação.
PERGUNTAS TÍPICAS: O que estamos evitando discutir? Qual área está pagando o preço do sucesso de outra? Seus dados confirmam o que você está dizendo? Esse objetivo ainda faz sentido ou é inércia? O que você já sabe, mas ainda não admitiu? Você está otimizando partes ou o conjunto?
REGRAS DE INTERVENÇÃO: interrompa generalizações sem dados ("está tudo bem") e repetições; desacelere quando o CEO responder rápido demais a algo difícil; nomeie o elefante na sala, com respeito; nunca decida pelo CEO: apresente opções, consequências e trade-offs.`;
}
function csIntPrompt(nota) {
  const s = csD().sessao, C = csCfg(), st = csSeats(), F = s.fase, fi = csIdx(F), ult = csAtaUlt();
  const falas = Object.entries(s.falas || {}).filter(([k]) => k.startsWith(F + "|")).map(([k, n]) => `${k.split("|")[1]} ${n}`).join(", ") || "nenhuma";
  const ab = csAbertas();
  return `${csIntPersona()}

ROTEIRO (máquina de estados): ${C.fases.join(" → ")}. Você só pode ficar na fase atual ou passar para a seguinte.
FASE ATUAL: ${F} (${fi + 1} de ${C.fases.length}). Objetivo: ${CS_FASE[F][1]}
TIPO DE SESSÃO: ${CS_TIPOS[s.tipo][0]} (${CS_TIPOS[s.tipo][1]})${s.foco ? `. FOCO PEDIDO PELO CEO: ${s.foco}` : ""}.
LIMITES: turno ${s.turno + 1} de ${C.maxTurnos} (restam ${C.maxTurnos - s.turno}; deixe turnos para CONFLITOS e DELIBERAÇÕES). Cada mentor fala no máximo ${C.maxFalasPorFase} vezes por fase. Falas nesta fase: ${falas}.
DIRETORES (id: nome · área · manchete do briefing):
${st.dir.map(m => `- ${m}: ${MENTOR_DEF[m].nome} · ${csArea(m)} · ${csBriefOf(m).head}`).join("\n")}
${st.conv.length ? `CONVIDADOS (chame só quando o tema tocar neles):\n${st.conv.map(m => `- ${m}: ${MENTOR_DEF[m].nome} · ${MENTOR_DEF[m].papel}`).join("\n")}` : ""}${st.priv.length ? `\nFORA DA SESSÃO (setor privado, não chame): ${st.priv.map(m => MENTOR_DEF[m].nome).join(", ")}` : ""}
${s.obs ? `MODO OBSERVADOR: o CEO assiste à reunião e entra quando quiser; ela segue sem esperar por ele. NÃO use "CEO" como próximo. Faça os diretores debaterem entre si: dê a palavra a quem foi citado, questionado ou afetado pela última fala, peça réplicas, contrapontos e dados que confirmem ou desmintam. Em CONFLITOS e DELIBERACOES, peça aos diretores propostas de definição com trade-offs explícitos (o que cada opção custa e para quem); ninguém decide: o CEO aprova ou recusa depois, na ata. Quando o CEO entrar na discussão (falas [Você (CEO)]), leve o que ele disse à mesa na próxima pergunta.` : `CEO: a própria pessoa. Use "CEO" para perguntar, confirmar ou pedir uma decisão; a sessão pausa até a resposta.`}
ATA ANTERIOR: ${ult ? `${fmtD(ult.data)} (${CS_TIPOS[ult.tipo]?.[0] || ult.tipo}), foco "${ult.foco}". Pergunta de reflexão deixada: "${ult.pergunta_reflexao}". Pontos de atenção: ${(ult.pontos_atencao || []).join("; ") || "nenhum"}.` : "não há; esta é a primeira sessão."}
AÇÕES DO CONSELHO EM ABERTO: ${ab.length ? ab.map(x => `[${x.area}] ${x.acao} (até ${x.prazo}; critério: ${x.criterio})`).join("; ") : "nenhuma"}.
RESUMO CORRENTE DA SESSÃO: ${s.resumo || "(ainda não há)"}
FALAS RECENTES:
${csTranscript() || "(a sessão está começando)"}
${nota ? `\nATENÇÃO: ${nota}\n` : ""}
RESPONDA SOMENTE com um objeto JSON, sem nenhum texto fora dele:
{"fase":"${F}${fi < C.fases.length - 2 ? `|${csNext(F)}` : ""}","proximo":"<id de diretor ou convidado${s.obs ? "" : " | CEO"} | FIM>","pergunta":"o que você diz agora a quem vai falar (até 90 palavras)","motivo":"por que esta pessoa e esta pergunta agora (uma frase)"}
Mude "fase" para a seguinte quando o objetivo da atual estiver cumprido; a "pergunta" então já abre a nova fase. Use "FIM" só para encerrar a reunião e gerar a ata.`;
}
function csValid(d) {
  const s = csD().sessao, st = csSeats(), ok = [...st.dir, ...st.conv, ...(s.obs ? [] : ["CEO"]), "FIM"];
  if (!d || typeof d !== "object" || Array.isArray(d)) return "não é um objeto JSON";
  if (![s.fase, csNext(s.fase)].includes(d.fase)) return `fase "${d.fase}" inválida: use ${s.fase} ou ${csNext(s.fase)}`;
  if (s.obs && d.proximo === "CEO") return `modo observador: o CEO só assiste; passe a palavra a um diretor (${st.dir.join(", ")})`;
  if (!ok.includes(d.proximo)) return `proximo "${d.proximo}" inválido: use um destes ids ${ok.join(", ")}`;
  if (d.proximo !== "FIM" && (typeof d.pergunta !== "string" || d.pergunta.trim().length < 3)) return "pergunta vazia";
  return "";
}
async function csDecide() {
  const C = csCfg(); let nota = "", lastErr = "";
  for (let tent = 0; tent < 2; tent++) {
    csStatus(tent ? "O Intermediador respondeu fora do formato; pedindo de novo…" : "O Intermediador está decidindo quem fala…");
    try {
      const r = await csCall("Intermediador", () => csIntPrompt(nota), { json: true, modelTier: C.tierIntermediador });
      const d = r && typeof r === "object" && "data" in r && !("fase" in r) ? r.data : r;
      lastErr = csValid(d); if (!lastErr) return d;
    } catch (e) { if (e?.code !== "invalid_json") throw e; lastErr = "a resposta não era JSON"; }
    nota = `sua resposta anterior foi inválida (${lastErr}). Responda apenas o objeto JSON, exatamente no formato pedido.`;
  }
  return { invalido: lastErr };
}

/* ---------------------------------------------------------------- diretores: o próprio prompt e a própria memória, com o briefing */
function csMentorPrompt(mid, pergunta) {
  const s = csD().sessao, C = csCfg(), b = csBriefOf(mid), st = csSeats();
  const base = mentorPrompt(mid, false, { dados: `BRIEFING DA SUA ÁREA PARA A REUNIÃO (${csArea(mid)}):\n${b.txt}` }).replace(/^- Use as ferramentas.*$/m, "- Nesta reunião você só fala: não usa ferramentas nem o bloco atlas.");
  const citados = st.dir.filter(m => m !== mid && (pergunta.includes(MENTOR_DEF[m].nome) || pergunta.includes(csArea(m)) || s.msgs.slice(-3).some(x => x.quem === m)));
  return `${base}

REUNIÃO DO CONSELHO DE ADMINISTRAÇÃO DA VIDA
Agora você participa como diretor da sua área numa reunião em que os mentores do Atlas se reúnem como diretores de uma mesma empresa: a vida desta pessoa, que é o CEO e decide tudo. Quem conduz é o Intermediador.
- Fale dentro da sua competência, mas pensando no todo. Traga dados concretos do briefing (números, datas, metas, recaídas, padrões), não opiniões genéricas.
- Se uma decisão ou um hábito de outra área afeta a sua, questione o diretor dela pelo nome.
- Sem dados suficientes, diga "Sem dados suficientes" e o que precisaria ser registrado. Nunca invente.
- Até ~${C.palavrasPorFala} palavras, falando ao Intermediador e ao CEO. Sem elogios vazios, sem cumprimentos. Não decida pelo CEO.${s.obs ? `\n- MODO OBSERVADOR: o CEO assiste. Debata com os outros diretores: concorde, discorde, peça dados. Para questionar alguém, chame pelo nome exato (por exemplo, "${MENTOR_DEF[st.dir.find(m => m !== mid) || mid].nome}"), e ele poderá responder direto a você. Proponha definições, não decida.` : ""}
FASE: ${CS_FASE[s.fase][0]}: ${CS_FASE[s.fase][1]}${s.fase === "RELATORIOS" ? `\nFORMATO DO RELATÓRIO: **Estado:** … **Tendência:** ↑, ↓ ou → (e por quê) **Vitória:** … **Atenção:** …` : ""}
OUTRAS ÁREAS (manchetes): ${st.dir.filter(m => m !== mid).map(m => `${csArea(m)}: ${csBriefOf(m).head}`).join("; ")}
${citados.length ? `BRIEFINGS RELEVANTES:\n${citados.map(m => `## ${csArea(m)} (${MENTOR_DEF[m].nome})\n${csBriefOf(m).txt}`).join("\n")}\n` : ""}RESUMO DA SESSÃO: ${s.resumo || "(ainda não há)"}
FALAS RECENTES:
${csTranscript(6) || "(nenhuma)"}
PERGUNTA DO INTERMEDIADOR PARA VOCÊ: """${pergunta}"""`;
}
async function csMentor(mid, pergunta, resp) {
  const s = csD().sessao, C = csCfg(), b = csBriefOf(mid), key = `${s.fase}|${mid}`;
  s.falas[key] = (s.falas[key] || 0) + 1;
  if (b.priv) { csMsg("sis", `${MENTOR_DEF[mid].nome} não participa: setor privado.`); return; }
  /* relatório de área sem dados: o próprio Atlas registra, sem gastar uma chamada */
  if (b.sem && s.fase === "RELATORIOS") { csMsg(mid, `**Sem dados suficientes** para um relatório de ${csArea(mid)}. Para eu ter o que dizer na próxima sessão, registre ${MENTOR_DEF[mid].area ? "metas, hábitos ou registros desta área" : "as práticas e reflexões desta área"} no Atlas.`, { local: true }); return; }
  const msg = csMsg(mid, "", { live: true, ...(resp ? { resp } : {}) }); CS.live = msg; render();
  csStatus(`${MENTOR_DEF[mid].nome} está falando…`);
  try {
    const r = await csCall(MENTOR_DEF[mid].nome, () => csMentorPrompt(mid, pergunta), { modelTier: C.tierMentor, onText: ({ text }) => { msg.texto = text; csPaintLive(msg); } });
    msg.texto = csWords(r.text, Math.round(C.palavrasPorFala * 1.4)) || "Sem dados suficientes.";
  } catch (e) { if (e?.text) msg.texto = csWords(e.text, Math.round(C.palavrasPorFala * 1.4)) + " _(interrompida)_"; else s.msgs.splice(s.msgs.indexOf(msg), 1); throw e; }
  finally { delete msg.live; CS.live = null; }
}

/* ---------------------------------------------------------------- resumo corrente, a cada N turnos */
async function csResumo() {
  const s = csD().sessao, C = csCfg(), novas = s.msgs.slice(s.resumoAte || 0); if (!novas.length) return;
  csStatus("Atualizando o resumo corrente da sessão…");
  const r = await csCall("Resumo corrente", () => `TAREFA: RESUMO DO CONSELHO
Você mantém o resumo corrente de uma reunião do Conselho de Administração da vida de uma pessoa (o CEO). Atualize o resumo anterior incorporando as falas novas, em até 250 palavras, em português: temas em discussão, dados citados (com números), tensões entre áreas, o que o CEO disse e decidiu, perguntas em aberto. Só o texto do resumo.
RESUMO ANTERIOR: ${s.resumo || "(nenhum)"}
FALAS NOVAS:
${novas.map(m => m.quem === "int" ? `[Intermediador → ${csNome(m.para)}] ${m.texto}` : `[${csNome(m.quem)}] ${m.texto}`).join("\n")}`, { modelTier: C.tierResumo });
  s.resumo = String(r.text || "").trim().slice(0, 4000); s.resumoAte = s.msgs.length;
}

/* ---------------------------------------------------------------- ata: JSON validado; ações viram memória do mentor da área */
function csAtaPrompt(nota) {
  const s = csD().sessao, C = csCfg(), st = csSeats(), areas = [...st.dir.map(csArea), "Geral"], ab = csAbertas();
  return `TAREFA: ATA DO CONSELHO
${csIntPersona()}

A reunião terminou. Escreva a ata a partir do resumo e das falas. Use só o que foi dito e os dados dos briefings; não invente decisões que o CEO não tomou (decisões pendentes viram pontos de atenção).
TIPO: ${CS_TIPOS[s.tipo][0]}. FOCO: ${s.foco || "revisão geral"}.${s.obs ? `\nMODO OBSERVADOR: o CEO assistiu e não decidiu durante a reunião. Em "decisoes" ponha só o que ele mesmo afirmou nas falas [Você (CEO)] (ou nada). Em "propostas", as definições que os diretores propuseram, cada uma com a área e o trade-off. As ações também são propostas: o CEO aprova ou recusa cada uma depois.` : ""}
ÁREAS VÁLIDAS: ${areas.join(" | ")}
PLACAR DE DADOS POR ÁREA (0–10, calculado dos registros): ${st.dir.map(m => `${csArea(m)}: ${csBriefOf(m).head}`).join("; ")}
AÇÕES DA ATA ANTERIOR EM ABERTO (id: ação): ${ab.map(x => `${x.id}: ${x.acao}`).join("; ") || "nenhuma"}
RESUMO CORRENTE: ${s.resumo || "(nenhum)"}
FALAS DESDE O RESUMO:
${csTranscript(40)}
${nota ? `\nATENÇÃO: ${nota}\n` : ""}
RESPONDA SOMENTE com um objeto JSON:
{"insights":["3 principais insights"],"decisoes":["decisões tomadas pelo CEO"],${s.obs ? `"propostas":[{"texto":"definição proposta","area":"uma das áreas válidas","tradeoff":"o que custa e para quem"}],` : ""}"acoes":[{"area":"uma das áreas válidas","acao":"ação concreta","prazo":"AAAA-MM-DD","criterio":"como saber que foi feita"}],"notas":{"<área>":{"nota":0,"justificativa":"uma frase com dados"},"geral":0},"pontos_atencao":["..."],"pergunta_reflexao":"uma pergunta final","transcricao_resumida":"a sessão em até 200 palavras","revisao_acoes":[{"id":"id de ação anterior","status":"feita|nao_feita"}]}
Regras: de ${C.minAcoes} a ${C.maxAcoes} ações (o ideal são 3 a 5), cada uma com área, prazo depois de ${TODAY} e critério de sucesso; notas de 0 a 10 para cada área que participou, com justificativa; "revisao_acoes" só para ações anteriores cujo status ficou claro na sessão.`;
}
function csAtaNorm(d) {
  const C = csCfg(), st = csSeats(), areas = [...st.dir.map(csArea), "Geral"], s = csD().sessao;
  if (!d || typeof d !== "object") return [null, "não é um objeto JSON"];
  const arr = v => Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : [];
  const acoes = (Array.isArray(d.acoes) ? d.acoes : []).filter(x => x && x.acao).slice(0, C.maxAcoes).map(x => { const area = areas.includes(x.area) ? x.area : "Geral"; return { id: uid(), area, mid: csMidOfArea(area), acao: String(x.acao).slice(0, 300), prazo: /^\d{4}-\d{2}-\d{2}$/.test(x.prazo || "") && x.prazo >= TODAY ? x.prazo : addDays(TODAY, 7), criterio: String(x.criterio || "").slice(0, 300), status: s.obs ? "proposta" : "aberta" }; });
  const propostas = !s.obs ? [] : (Array.isArray(d.propostas) ? d.propostas : []).filter(x => x && x.texto).slice(0, 8).map(x => ({ texto: String(x.texto).slice(0, 400), area: areas.includes(x.area) ? x.area : "Geral", tradeoff: String(x.tradeoff || "").slice(0, 300), status: "proposta" }));
  const ceoFalou = s.msgs.some(m => m.quem === "ceo");
  if (acoes.length < C.minAcoes) return [null, `a ata precisa de pelo menos ${C.minAcoes} ação concreta`];
  const notas = {}; for (const [k, v] of Object.entries(d.notas || {})) { if (k === "geral") continue; if (!areas.includes(k) || !v) continue; const n = +v.nota; if (isNum(n)) notas[k] = { nota: clamp(Math.round(n * 10) / 10, 0, 10), justificativa: String(v.justificativa || "").slice(0, 300) }; }
  const g = +d.notas?.geral; notas.geral = isNum(g) ? clamp(Math.round(g * 10) / 10, 0, 10) : null;
  const placar = {}; for (const m of st.dir) { if (!MENTOR_DEF[m].area) continue; const v = calcAt(mkey(TODAY)).areas.find(x => x.a === MENTOR_DEF[m].area)?.dados; placar[csArea(m)] = isNum(v) ? v : null; }
  return [{ id: s.id, data: TODAY, tipo: s.tipo, foco: s.foco || "Revisão geral", insights: arr(d.insights).slice(0, 5), decisoes: s.obs && !ceoFalou ? [] : arr(d.decisoes), ...(s.obs ? { observador: true, propostas } : {}), acoes, notas, placar_dados: placar, pontos_atencao: arr(d.pontos_atencao), pergunta_reflexao: String(d.pergunta_reflexao || "").slice(0, 400), transcricao_resumida: String(d.transcricao_resumida || s.resumo || "").slice(0, 3000), turnos: s.turno, chamadas: s.chamadas || 0, revisao: (Array.isArray(d.revisao_acoes) ? d.revisao_acoes : []).filter(x => x && ["feita", "nao_feita"].includes(x.status)) }, ""];
}
async function csAta() {
  const C = csCfg(), s = csD().sessao; let nota = "", err = "";
  if (s.resumoAte < s.msgs.length - 30) await csResumo();
  for (let tent = 0; tent < 2; tent++) {
    csStatus(tent ? "A ata veio fora do formato; pedindo de novo…" : "O Intermediador está redigindo a ata…");
    try {
      const r = await csCall("Ata", () => csAtaPrompt(nota), { json: true, modelTier: C.tierAta });
      const [ata, e] = csAtaNorm(r && typeof r === "object" && "data" in r && !("acoes" in r) ? r.data : r); err = e;
      if (ata) {
        const D = csD(), ids = new Set(csAbertas().map(x => x.id));
        for (const rv of ata.revisao) if (ids.has(rv.id)) for (const a of D.atas) for (const x of a.acoes || []) if (x.id === rv.id) x.status = rv.status;
        delete ata.revisao; D.atas.push(ata); D.sessao = null; CS.ver = ata.id;
        for (const x of ata.acoes) if (x.status === "aberta") csMemAcao(x);
        touch("conselho", "mentores", { label: "Ata do Conselho" }); toast(ata.observador ? "Ata registrada. As propostas esperam a sua aprovação." : "Ata registrada. As ações já aparecem nas abas das áreas."); return true;
      }
    } catch (e) { if (e?.code !== "invalid_json") throw e; err = "a resposta não era JSON"; }
    nota = `a ata anterior foi recusada (${err}). Responda só o JSON, no formato pedido.`;
  }
  throw { code: "invalid_json", message: err };
}

/* ---------------------------------------------------------------- a máquina de estados */
function csFase(f, porque) {
  const s = csD().sessao; if (s.fase === f) return;
  s.fase = f; csMsg("sis", `${CS_FASE[f][0]}${porque ? ` · ${porque}` : ""}`, { divisor: true, fase: f });
  if (f === "RELATORIOS") s.relFila = csSeats().dir.slice();
}
async function csStep() {
  const s = csD().sessao, C = csCfg();
  if (s.fase === "ATA") { await csAta(); return "fim"; }
  if (s.turno >= C.maxTurnos) { csFase("ATA", `limite de ${C.maxTurnos} turnos`); return "ok"; }
  if (s.fase === "REVISAO_ATA" && !csAtaUlt()) { csFase("ABERTURA", "primeira sessão, não há ata anterior"); }
  if (s.fase === "RELATORIOS" && C.relatoriosEmSequencia && s.relFila?.length) {
    const mid = s.relFila.shift(), q = `${MENTOR_DEF[mid].nome}, seu relatório: estado atual, tendência, uma vitória e um ponto de atenção, com dados.`;
    csMsg("int", q, { para: mid, auto: true }); s.turno++; await csMentor(mid, q); return "ok";
  }
  /* poucos turnos restantes: o código garante que a sessão chegue às deliberações */
  if (C.maxTurnos - s.turno <= 2 && csIdx(s.fase) < csIdx("DELIBERACOES")) csFase("DELIBERACOES", "restam poucos turnos");
  const d = await csDecide(); s.turno++;
  if (d.invalido) { const nx = csNext(s.fase); csMsg("sis", `O Intermediador não respondeu no formato esperado duas vezes (${d.invalido}). Seguimos para a próxima fase.`); csFase(nx); return "ok"; }
  if (d.fase !== s.fase) csFase(d.fase);
  if (d.proximo === "FIM") { csFase("ATA", "o Intermediador encerrou a reunião"); return "ok"; }
  csMsg("int", String(d.pergunta).trim(), { para: d.proximo, motivo: String(d.motivo || "").slice(0, 300) });
  if (d.proximo === "CEO") { s.aguardaCEO = true; return "ceo"; }
  if (s.fase === "RELATORIOS") s.relFila = (s.relFila || []).filter(m => m !== d.proximo);
  if ((s.falas[`${s.fase}|${d.proximo}`] || 0) >= C.maxFalasPorFase) { csMsg("sis", `${MENTOR_DEF[d.proximo].nome} já falou ${C.maxFalasPorFase} vezes nesta fase; a palavra volta ao Intermediador.`); return "ok"; }
  await csMentor(d.proximo, String(d.pergunta));
  await csReplica(d.proximo);
  return "ok";
}
/* modo observador: quem foi chamado pelo nome responde direto, até maxReplicas vezes seguidas */
async function csReplica(de) {
  const s = csD().sessao, C = csCfg(); if (!s?.obs || s.fase === "RELATORIOS") return;
  let quem = de;
  for (let n = 0; n < C.maxReplicas && csD().sessao === s && !s.pausada && s.turno < C.maxTurnos; n++) {
    const m = s.msgs.at(-1); if (!m || m.quem !== quem || m.local) return;
    const st = csSeats(), alvo = [...st.dir, ...st.conv].find(x => x !== quem && m.texto.includes(MENTOR_DEF[x].nome));
    if (!alvo || (s.falas[`${s.fase}|${alvo}`] || 0) >= C.maxFalasPorFase) return;
    csSave(); render(); s.turno++;
    await csMentor(alvo, `${MENTOR_DEF[quem].nome} se dirigiu a você: """${trunc(m.texto, 500)}""" Responda diretamente a ${MENTOR_DEF[quem].nome}, com dados.`, quem);
    quem = alvo;
  }
}
async function csRun() {
  const s = csD().sessao; if (!s || CS.busy) return;
  if (!SAMPLE) { toast("A IA do Claude não está disponível nesta visualização."); return; }
  CS.busy = true; CS.ctl = new AbortController(); s.pausada = false; s.erro = null; render();
  try {
    while (csD().sessao && !s.pausada && !s.aguardaCEO) {
      const r = await csStep(); csSave(); render();
      if (r === "fim") break;
      if (csD().sessao && s.turno && s.turno % csCfg().resumoACada === 0 && s.resumoAte < s.msgs.length && s.fase !== "ATA" && !s.aguardaCEO) { await csResumo(); csSave(); }
    }
  } catch (e) {
    if (csD().sessao) { if (e?.code !== "cancelled") { s.erro = CS_ERR[e?.code] || `A sessão parou: ${e?.message || e?.code || "erro desconhecido"}. Tudo foi salvo.`; } s.pausada = true; csSave(); }
  } finally { CS.busy = false; CS.ctl = null; CS.status = ""; render(); }
}
function csStart() {
  const D = csD(); if (D.sessao) return;
  const st = csSeats(), s = D.sessao = { id: uid(), tipo: CS.tipo, foco: CS.foco.trim(), inicio: Date.now(), fase: "REVISAO_ATA", turno: 0, chamadas: 0, falas: {}, msgs: [], resumo: "", resumoAte: 0, briefs: {}, relFila: [], aguardaCEO: false, pausada: false, erro: null, obs: !!CS.obs };
  for (const m of [...st.dir, ...st.priv]) s.briefs[m] = csBrief(m);
  const sem = st.dir.filter(m => s.briefs[m].sem).map(m => csArea(m));
  csMsg("sis", `Sessão ${CS_TIPOS[s.tipo][0].toLowerCase()} aberta${s.foco ? ` com o foco "${s.foco}"` : ""}. Briefings prontos para ${plural(st.dir.length, "diretor", "diretores")}${sem.length ? `; sem dados suficientes: ${sem.join(", ")}` : ""}${st.priv.length ? `; fora por privacidade: ${st.priv.map(csArea).join(", ")}` : ""}.${s.obs ? " Modo observador: os diretores discutem entre si e a reunião segue sem esperar por você; entre quando quiser e aprove as propostas no fim." : ""}`);
  csMsg("sis", CS_FASE.REVISAO_ATA[0], { divisor: true, fase: "REVISAO_ATA" });
  CS.foco = ""; CS.ver = null; csSave("Sessão do Conselho aberta"); csRun();
}
function csCEO(texto) {
  const s = csD().sessao, t = String(texto || "").trim(); if (!s || !t) return;
  csMsg("ceo", t, { interv: !s.aguardaCEO }); s.aguardaCEO = false; CS.input = ""; CS.stick = true; csSave(); render();
  if (!CS.busy) csRun();
}
function csPausar() { const s = csD().sessao; if (!s) return; s.pausada = true; CS.ctl?.abort(); csSave(); render(); }
function csPular() {
  const s = csD().sessao; if (!s || s.fase === "ATA") return;
  const was = CS.busy; CS.ctl?.abort(); s.aguardaCEO = false; s.relFila = [];
  csFase(csNext(s.fase), "pulada pelo CEO"); csSave();
  if (was) setTimeout(() => { const x = csD().sessao; if (x) { x.pausada = false; csRun(); } }, 50); else render();
}
function csEncerrar() {
  const s = csD().sessao; if (!s) return;
  CS.ctl?.abort(); s.aguardaCEO = false; csFase("ATA", "encerrada pelo CEO"); csSave();
  setTimeout(() => { const x = csD().sessao; if (x) { x.pausada = false; csRun(); } }, 50);
}

/* ---------------------------------------------------------------- sessão extraordinária: sugerida por um mentor quando há alerta grave */
function csAlerta() {
  const out = []; if (csD().sessao) return out;
  for (const a of radarAlerts().filter(x => x.st === "crit" && aiAreaOk(x.area) && x.tipo !== "sequencia")) { const mid = AREA_INFO[a.area]?.id; if (mid && !out.some(o => o.mid === mid)) out.push({ mid, titulo: a.titulo, texto: a.texto }); }
  const Hs = [calcAt(addMonth(mkey(TODAY), -3)), calcAt(mkey(TODAY))];
  for (const A of Hs[1].areas) { const old = Hs[0].areas.find(x => x.a === A.a)?.dados; if (isNum(A.dados) && isNum(old) && old - A.dados >= 2 && aiAreaOk(A.a)) { const mid = AREA_INFO[A.a]?.id; if (mid && !out.some(o => o.mid === mid)) out.push({ mid, titulo: `${A.a} caiu ${num(old - A.dados)} pontos em 3 meses`, texto: `Placar de dados de ${num(old)} para ${num(A.dados)}.` }); } }
  return out.slice(0, 3);
}
const csProxOrd = () => { const u = [...csD().atas].reverse().find(a => a.tipo === "ordinaria"); return u ? addDays(u.data, csCfg().cadencia === "mensal" ? 30 : 7) : TODAY; };

/* ---------------------------------------------------------------- ações nas abas das áreas */
const csMemAcao = x => { if (x.mid && MENTOR_DEF[x.mid]) addMemory(x.mid, { tipo: "compromisso", texto: `Conselho de ${fmtD(TODAY)}: ${x.acao} (até ${fmtD(x.prazo)}; critério: ${x.criterio})`, origem: "conselho" }); };
function csSetSt(ataId, acaoId, st) {
  const a = csD().atas.find(x => x.id === ataId), x = a?.acoes.find(y => y.id === acaoId); if (!x || !CS_ST[st]) return;
  const aprova = x.status === "proposta" && st === "aberta"; x.status = st; x.em = TODAY;
  if (aprova) { csMemAcao(x); touch("conselho", "mentores", { label: "Ação do Conselho aprovada" }); } else touch("conselho", { label: `Ação do Conselho: ${CS_ST[st]}` });
}
function csSetProp(ataId, i, st) {
  const a = csD().atas.find(x => x.id === ataId), p = a?.propostas?.[+i]; if (!p || p.status !== "proposta" || !["aprovada", "recusada"].includes(st)) return;
  p.status = st; p.em = TODAY; if (st === "aprovada") a.decisoes.push(`${p.texto} (aprovada por você em ${fmtD(TODAY)})`);
  touch("conselho", { label: `Proposta do Conselho ${st}` });
}
const csPendentes = () => csD().atas.flatMap(a => [...(a.propostas || []).map((p, i) => ({ k: "p", a, p, i })).filter(x => x.p.status === "proposta"), ...(a.acoes || []).filter(x => x.status === "proposta").map(x => ({ k: "a", a, x }))]);
const csPendHTML = q => q.k === "p" ? `<li class="csac"><span class="mav sm" style="--c:var(--accent)">${ic("flag")}</span><div><b>${esc(q.p.texto)}</b><small>${esc(q.p.area)}${q.p.tradeoff ? ` · trade-off: ${esc(q.p.tradeoff)}` : ""} · ata de ${fmtD(q.a.data)}</small></div><span class="row"><button type="button" class="btn sm" data-cspr="${q.a.id}|${q.i}|aprovada">${ic("check")}Aprovar</button><button type="button" class="btn sm ghost" data-cspr="${q.a.id}|${q.i}|recusada">Recusar</button></span></li>`
  : `<li class="csac"><span class="mav sm" style="--c:${q.x.mid ? mcol(q.x.mid) : "var(--accent)"}">${ic(q.x.mid ? mico(q.x.mid) : "council")}</span><div><b>${esc(q.x.acao)}</b><small>ação proposta · ${esc(q.x.area)} · até ${fmtD(q.x.prazo)}${q.x.criterio ? ` · critério: ${esc(q.x.criterio)}` : ""}</small></div><span class="row"><button type="button" class="btn sm" data-csst="${q.a.id}|${q.x.id}|aberta">${ic("check")}Aprovar</button><button type="button" class="btn sm ghost" data-csst="${q.a.id}|${q.x.id}|recusada">Recusar</button></span></li>`;
function csAcaoHTML(x) {
  const late = x.prazo < TODAY;
  return `<li class="csac${late ? " late" : ""}"><span class="mav sm" style="--c:${x.mid ? mcol(x.mid) : "var(--accent)"}">${ic(x.mid ? mico(x.mid) : "council")}</span><div><b>${esc(x.acao)}</b><small>${esc(x.area)} · até ${fmtD(x.prazo)}${late ? " · atrasada" : ""}${x.criterio ? ` · critério: ${esc(x.criterio)}` : ""}</small></div><span class="row"><button type="button" class="btn sm" data-csst="${x.ata}|${x.id}|feita" aria-label="Marcar como feita">${ic("check")}Feita</button><button type="button" class="btn sm ghost" data-csst="${x.ata}|${x.id}|nao_feita">Não feita</button></span></li>`;
}
function csStrip() {
  if (PAGE === "admin" || !LOADED) return "";
  const as = CS_PAGE_AREAS[PAGE]; if (!as) return "";
  const xs = csAbertas().filter(x => as.includes(x.area)); if (!xs.length) return "";
  return `<section class="csstrip" aria-label="Ações do Conselho"><header>${ic("council")}<b>Ações do Conselho</b><a href="#admin">ver a ata</a></header><ul>${xs.map(x => csAcaoHTML(x)).join("")}</ul></section>`;
}

/* ---------------------------------------------------------------- página */
function csMsgHTML(m) {
  if (m.quem === "sis") return m.divisor ? `<div class="csdiv"><span>${esc(m.texto)}</span></div>` : `<div class="cssys">${ic("info")}${esc(m.texto)}</div>`;
  const int = m.quem === "int", ceo = m.quem === "ceo", c = int ? "var(--accent)" : ceo ? "var(--good)" : mcol(m.quem);
  const av = int ? `<span class="mav csintav" style="--c:${c}">${ic("council")}</span>` : ceo ? `<span class="mav" style="--c:${c}">${ic("user")}</span>` : mavatar(m.quem);
  const who = int ? `Intermediador${m.para ? ` <span class="muted">→ ${esc(csNome(m.para === "CEO" ? "ceo" : m.para))}</span>` : ""}` : ceo ? `Você (CEO)${m.interv ? ` <span class="muted">· intervenção</span>` : ""}` : `${esc(MENTOR_DEF[m.quem]?.nome || m.quem)} <span class="muted">· ${esc(csArea(m.quem))}${m.resp ? ` · responde a ${esc(MENTOR_DEF[m.resp]?.nome || m.resp)}` : ""}</span>`;
  return `<article class="csm${int ? " int" : ""}${ceo ? " ceo" : ""}${m.live ? " live" : ""}" id="csm_${m.id}" style="--c:${c}">${av}<div class="csb"><header>${who}</header><div class="cstx">${m.texto ? md(m.texto) : `<span class="thinking">${ic("spark")}pensando…</span>`}</div>${int && m.motivo ? `<details class="csmot"><summary>por quê</summary>${esc(m.motivo)}</details>` : ""}</div></article>`;
}
function csPaintLive(m) { const el = $(`#csm_${m.id} .cstx`); if (el) { el.innerHTML = md(m.texto); const ch = $("#cschat"); if (ch && CS.stick) ch.scrollTop = ch.scrollHeight; } }
function csFasesHTML(s) {
  const C = conselhoConfig, fi = csIdx(s.fase);
  return `<ol class="csfases" aria-label="Fases da sessão">${C.fases.map((f, i) => `<li class="${i < fi ? "ok" : i === fi ? "cur" : ""}"${i === fi ? ' aria-current="step"' : ""}><i>${i + 1}</i><span>${CS_FASE[f][0]}</span></li>`).join("")}</ol>`;
}
function csSessaoHTML(s) {
  const C = csCfg(), run = CS.busy, ai = !!SAMPLE;
  const ctrl = `<div class="row wrap csctrl">${run ? `<button type="button" class="btn sm" data-csa="pausar">${ic("stop")}Pausar</button>` : `<button type="button" class="btn sm primary" data-csa="continuar"${ai && !s.aguardaCEO ? "" : " disabled"}>${ic("spark")}${s.erro ? "Tentar de novo" : "Continuar"}</button>`}
    <button type="button" class="btn sm ghost" data-csa="pular"${s.fase === "ATA" ? " disabled" : ""}>Pular fase</button><button type="button" class="btn sm ghost" data-csa="encerrar"${s.fase === "ATA" && run ? " disabled" : ""}>${ic("check")}Encerrar e gerar ata</button>
    <span class="muted csmeta">turno ${s.turno} de ${C.maxTurnos} · ${plural(s.chamadas || 0, "chamada", "chamadas")} à IA</span></div>`;
  const err = s.erro ? `<div class="banner warn">${ic("info")}<span>${esc(s.erro)}</span></div>` : "";
  const st = run ? `<div class="csstatus" id="csstatus" role="status">${esc(CS.status || "Trabalhando…")}</div>` : s.obs && !s.erro ? `<div class="csstatus" role="status">Reunião pausada. Tudo está salvo: toque em Continuar para os diretores seguirem.</div>` : s.aguardaCEO ? `<div class="csstatus ceo" role="status">${ic("user")}O Intermediador espera a sua resposta.</div>` : !s.erro ? `<div class="csstatus" role="status">Sessão pausada. Tudo está salvo: continue quando quiser.</div>` : "";
  const ph = s.aguardaCEO ? "Sua resposta ao Intermediador (Enter envia)" : s.obs ? "Entrar na discussão: diga algo à mesa; a reunião continua depois (Enter envia)" : "Intervir: diga algo à mesa a qualquer momento (Enter envia)";
  return `${csFasesHTML(s)}${ctrl}${err}
    <div class="cschat" id="cschat" aria-live="polite">${s.msgs.map(csMsgHTML).join("")}</div>${st}
    <div class="csin${s.aguardaCEO ? " ceo" : ""}"><textarea id="cs_in" rows="2" placeholder="${ph}">${esc(CS.input)}</textarea><button type="button" class="btn primary" data-csa="enviar">${s.aguardaCEO ? "Responder" : s.obs ? "Entrar" : "Intervir"}</button></div>`;
}
function csIniciarHTML() {
  const ai = !!SAMPLE, al = csAlerta(), C = csCfg(), st = csSeats(), u = csAtaUlt(), po = csProxOrd();
  return `${al.length ? `<div class="csalerts" aria-label="Sessões extraordinárias sugeridas">${al.map(a => `<div class="csal" style="--c:${mcol(a.mid)}">${mavatar(a.mid, "sm")}<div><b>${esc(MENTOR_DEF[a.mid].nome)} sugere uma sessão extraordinária</b><span>${esc(a.titulo)}. <small>${esc(trunc(a.texto, 150))}</small></span></div><button type="button" class="btn sm" data-csa="convocar" data-mid="${a.mid}">Convocar</button></div>`).join("")}</div>` : ""}
    ${panel(`${ic("council")}Iniciar sessão`, `<p class="muted">O Intermediador conduz 10 fases, da revisão da ata anterior à nova ata. ${plural(st.dir.length, "diretor participa", "diretores participam")}${st.conv.length ? ` e ${plural(st.conv.length, "convidado pode", "convidados podem")} ser chamado` : ""}; você responde, intervém e decide. Uma sessão completa faz algo como ${Math.round(C.maxTurnos * 1.5)} chamadas à IA no máximo.</p>
      <div class="form f2"><label>Tipo<select id="cs_tipo">${Object.entries(CS_TIPOS).map(([k, [l, d]]) => `<option value="${k}"${CS.tipo === k ? " selected" : ""}>${l}: ${d}</option>`).join("")}</select></label>
      <label>Foco (opcional)<input type="text" id="cs_foco" value="${esc(CS.foco)}" placeholder="Ex.: equilíbrio entre trabalho e saúde"></label></div>
      <label class="cschk"><input type="checkbox" id="cs_obs"${CS.obs ? " checked" : ""}><span><b>Modo observador</b>: os diretores discutem o tema entre si e a reunião segue sem esperar por você. Entre na discussão quando quiser; no fim, você aprova ou recusa as propostas.</span></label>
      <div class="row wrap"><button type="button" class="btn primary" data-csa="iniciar"${ai ? "" : " disabled"}>${ic("spark")}Iniciar sessão</button><span class="muted">${u ? `Última sessão em ${fmtD(u.data)}. ` : "Ainda não houve sessão. "}Próxima ordinária (${C.cadencia}): ${po <= TODAY ? "já pode acontecer" : fmtD(po)}.</span></div>
      ${ai ? "" : `<p class="note">A IA do Claude não está disponível nesta visualização: as atas, as ações e o gráfico continuam abaixo.</p>`}`, { cls: "csstart" })}
    ${u ? csAtaHTML(u, true) : ""}`;
}
function csAtaHTML(a, resumo) {
  const nt = Object.entries(a.notas || {}).filter(([k]) => k !== "geral");
  return panel(`${ic("file")}Ata de ${fmtD(a.data)} · ${esc(CS_TIPOS[a.tipo]?.[0] || a.tipo)}`, `<p class="lead">${esc(a.foco)}</p>
    <div class="csata">
      <section><h3>Principais insights</h3><ol>${a.insights.map(x => `<li>${esc(x)}</li>`).join("") || "<li class='muted'>nenhum</li>"}</ol></section>
      ${a.decisoes.length ? `<section><h3>Decisões do CEO</h3><ul>${a.decisoes.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
      ${a.propostas?.length ? `<section><h3>Propostas de definição</h3><ul class="csacs">${a.propostas.map((p, i) => p.status === "proposta" ? csPendHTML({ k: "p", a, p, i }) : `<li>${esc(p.texto)} ${pill(p.status === "aprovada" ? "good" : "none", p.status)}</li>`).join("")}</ul></section>` : ""}
      <section><h3>Ações${a.observador ? " propostas" : ""}</h3><table class="dt"><thead><tr><th>Área</th><th>Ação</th><th>Prazo</th><th>Critério</th><th>Status</th></tr></thead><tbody>${a.acoes.map(x => `<tr><td>${esc(x.area)}</td><td>${esc(x.acao)}</td><td>${fmtD(x.prazo)}</td><td>${esc(x.criterio)}</td><td>${x.status === "aberta" ? `<button type="button" class="btn sm" data-csst="${a.id}|${x.id}|feita">Feita</button><button type="button" class="btn sm ghost" data-csst="${a.id}|${x.id}|nao_feita">Não feita</button>` : x.status === "proposta" ? `<button type="button" class="btn sm" data-csst="${a.id}|${x.id}|aberta">Aprovar</button><button type="button" class="btn sm ghost" data-csst="${a.id}|${x.id}|recusada">Recusar</button>` : pill(x.status === "feita" ? "good" : x.status === "recusada" ? "none" : "crit", CS_ST[x.status])}</td></tr>`).join("")}</tbody></table></section>
      ${resumo ? "" : `<section><h3>Notas de saúde</h3><p><b>Geral: ${a.notas?.geral ?? "–"}/10</b></p><table class="dt"><thead><tr><th>Área</th><th>Nota do Conselho</th><th>Placar dos dados</th><th>Justificativa</th></tr></thead><tbody>${nt.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.nota}</td><td>${a.placar_dados?.[k] != null ? num(a.placar_dados[k]) : "–"}</td><td>${esc(v.justificativa)}</td></tr>`).join("")}</tbody></table></section>
      ${a.pontos_atencao.length ? `<section><h3>Pontos de atenção</h3><ul>${a.pontos_atencao.map(x => `<li>${esc(x)}</li>`).join("")}</ul></section>` : ""}
      ${a.transcricao_resumida ? `<section><h3>A sessão em resumo</h3><p>${esc(a.transcricao_resumida)}</p></section>` : ""}`}
      ${a.pergunta_reflexao ? `<blockquote class="csq">${esc(a.pergunta_reflexao)}</blockquote>` : ""}
    </div>`, { act: resumo ? `<button type="button" class="btn sm ghost" data-csa="ver" data-id="${a.id}">Ata completa</button>` : `<button type="button" class="btn sm ghost" data-csa="fechar">Fechar</button>` });
}
function csLadoHTML() {
  const D = csD(), ab = csAbertas(), C = csCfg(), atas = D.atas;
  const areas = [...new Set(atas.flatMap(a => Object.keys(a.notas || {}).filter(k => k !== "geral")))];
  const L = atas.map(a => fmtD(a.data)), series = [{ name: "Geral", color: "var(--accent)", data: atas.map(a => a.notas?.geral ?? null) }];
  if (CS.area !== "geral" && areas.includes(CS.area)) series.push({ name: CS.area, color: acol(CS.area) || "var(--good)", data: atas.map(a => a.notas?.[CS.area]?.nota ?? null) }, { name: "Placar dos dados", color: "var(--muted)", dash: true, fill: false, data: atas.map(a => a.placar_dados?.[CS.area] ?? null) });
  const pend = csPendentes();
  return `<aside class="csside">
    ${pend.length ? panel(`${ic("flag")}Aguardando sua aprovação <small>${pend.length}</small>`, `<ul class="csacs">${pend.map(csPendHTML).join("")}</ul>`, { cls: "cspend" }) : ""}
    ${panel(`${ic("check")}Ações em aberto <small>${ab.length}</small>`, ab.length ? `<ul class="csacs">${ab.map(x => csAcaoHTML(x)).join("")}</ul>` : `<p class="muted">Nenhuma ação em aberto.</p>`)}
    ${panel(`${ic("scatter")}Evolução das notas`, `${atas.length ? `<label class="cssel">Área<select id="cs_area"><option value="geral">Só a geral</option>${areas.map(a => `<option${CS.area === a ? " selected" : ""}>${esc(a)}</option>`).join("")}</select></label>${lineChart(L, series, { w: 320, h: 180, min: 0, max: 10, fmt: v => num(v, 1), empty: "Notas aparecem depois da primeira ata." })}` : `<p class="muted">As notas aparecem depois da primeira ata.</p>`}`)}
    ${panel(`${ic("file")}Histórico de atas`, atas.length ? `<ul class="csatas">${[...atas].reverse().map(a => `<li><button type="button" class="csatab" data-csa="ver" data-id="${a.id}"><span><b>${fmtD(a.data)}</b> · ${esc(CS_TIPOS[a.tipo]?.[0] || a.tipo)}</span><small>${esc(trunc(a.foco, 60))} · nota ${a.notas?.geral ?? "–"}</small></button></li>`).join("")}</ul>` : `<p class="muted">Nenhuma ata ainda.</p>`)}
    <details class="pn cscfg"><summary>${ic("sliders")}Parâmetros do Conselho</summary><div class="form f1">${CS_EDIT.map(([k, l, lo, hi]) => `<label>${l}<input type="number" min="${lo}" max="${hi}" data-cscfg="${k}" value="${C[k]}"></label>`).join("")}
      <label>Ordinária<select data-cscfg="cadencia">${["semanal", "mensal"].map(v => `<option${C.cadencia === v ? " selected" : ""}>${v}</option>`).join("")}</select></label>
      <label>Relatórios em sequência<select data-cscfg="relatoriosEmSequencia"><option value="1"${C.relatoriosEmSequencia ? " selected" : ""}>sim, um diretor após o outro</option><option value="0"${C.relatoriosEmSequencia ? "" : " selected"}>não, o Intermediador escolhe</option></select></label></div>
      <p class="muted">Diretores: ${C.diretores.map(m => MENTOR_DEF[m]?.nome).join(", ")}. Convidados: ${C.convidados.map(m => MENTOR_DEF[m]?.nome).join(", ")}.</p></details>
  </aside>`;
}
function pAdmin() {
  const D = csD(), s = D.sessao, ver = CS.ver && D.atas.find(a => a.id === CS.ver);
  const main = s ? panel(`${ic("council")}Sessão ${esc(CS_TIPOS[s.tipo][0].toLowerCase())}${s.foco ? ` · ${esc(s.foco)}` : ""}${s.obs ? ` <span class="pill good">modo observador</span>` : ""}`, csSessaoHTML(s), { cls: "cssess" }) : ver ? csAtaHTML(ver, false) : csIniciarHTML();
  return `${aiBanner()}<div class="csgrid"><div class="csmain">${main}</div>${csLadoHTML()}</div>`;
}
function csAfterRender() { const ch = $("#cschat"); if (ch && CS.stick) ch.scrollTop = ch.scrollHeight; }

/* ---------------------------------------------------------------- eventos */
function csClick(t) {
  const ds = t.dataset;
  if (ds.csst) { const [a, x, st] = ds.csst.split("|"); csSetSt(a, x, st); return true; }
  if (ds.cspr) { const [a, i, st] = ds.cspr.split("|"); csSetProp(a, i, st); return true; }
  const a = ds.csa; if (!a) return false;
  if (a === "iniciar") csStart();
  else if (a === "continuar") csRun();
  else if (a === "pausar") csPausar();
  else if (a === "pular") csPular();
  else if (a === "encerrar") csEncerrar();
  else if (a === "enviar") csCEO($("#cs_in")?.value);
  else if (a === "ver") { CS.ver = ds.id; render(); scrollTo(0, 0); }
  else if (a === "fechar") { CS.ver = null; render(); }
  else if (a === "convocar") { CS.tipo = "extraordinaria"; const al = csAlerta().find(x => x.mid === ds.mid); CS.foco = al ? al.titulo : ""; render(); $("#cs_foco")?.focus(); }
  return true;
}
function csInput(t) {
  if (t.id === "cs_in") { CS.input = t.value; return true; }
  if (t.id === "cs_foco") { CS.foco = t.value; return true; }
  return false;
}
function csChange(t) {
  if (t.id === "cs_tipo") { CS.tipo = t.value; return true; }
  if (t.id === "cs_obs") { CS.obs = t.checked; return true; }
  if (t.id === "cs_area") { CS.area = t.value; render(); return true; }
  const k = t.dataset.cscfg; if (!k) return false;
  const D = csD(), e = CS_EDIT.find(x => x[0] === k);
  D.cfg[k] = e ? clamp(Math.round(+t.value || conselhoConfig[k]), e[2], e[3]) : k === "relatoriosEmSequencia" ? t.value === "1" : t.value;
  touch("conselho", { label: "Parâmetros do Conselho" }); return true;
}
function csKey(e) { if (e.target.id === "cs_in" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); csCEO(e.target.value); return true; } return false; }
const csScroll = e => { if (e.target.id === "cschat") { const c = e.target; CS.stick = c.scrollHeight - c.scrollTop - c.clientHeight < 40; } };
document.addEventListener("scroll", csScroll, true);
document.addEventListener("keydown", e => { if (PAGE === "admin") csKey(e); });

/* ---------------------------------------------------------------- dados de exemplo (fictícios) */
function csExemplo() {
  const d = n => addDays(TODAY, -n), ac = (area, acao, prazo, criterio, status) => ({ id: uid(), area, mid: csMidOfArea(area), acao, prazo, criterio, status });
  const nt = (o, g) => ({ ...Object.fromEntries(Object.entries(o).map(([k, [n, j]]) => [k, { nota: n, justificativa: j }])), geral: g });
  return { cfg: {}, sessao: null, atas: [
    { id: "ata_ex1", data: d(37), tipo: "ordinaria", foco: "Revisão geral do mês", insights: ["O sono curto nas semanas de entrega derruba o humor dois dias depois.", "Restaurantes cresceram junto com as noites de trabalho até tarde.", "Os estudos de inglês só avançam quando têm horário fixo."], decisoes: ["Proteger 7 h de sono nas noites antes de entrega."], acoes: [ac("Saúde física", "Deitar até 23h30 nas noites antes de entrega", d(23), "5 de 7 noites com 7 h ou mais", "feita"), ac("Finanças", "Teto semanal de € 25 em restaurantes", d(9), "4 semanas dentro do teto", "nao_feita"), ac("Aprendizado", "Bloco fixo de inglês terça e quinta às 19h", d(16), "8 blocos registrados no mês", "feita")], notas: nt({ "Saúde física": [6.1, "sono médio 6,6 h e 2 treinos por semana"], "Saúde mental": [6.4, "humor médio 3,6 com quedas após noites curtas"], "Finanças": [6.8, "poupança de 18% contra meta de 20%"], "Carreira": [7, "duas entrevistas avançaram"], "Aprendizado": [5.2, "9 h de estudo contra meta de 24"], "Família": [6, "contato semanal com a mãe"], "Amizades & social": [5, "um encontro no mês"], "Casa & organização": [6.5, "documentos em dia"] }, 6.1), placar_dados: { "Saúde física": 6.3, "Saúde mental": 6.2, "Finanças": 7.1, "Carreira": 6.8, "Aprendizado": 5, "Família": 6.4, "Amizades & social": 4.8, "Casa & organização": 6.9 }, pontos_atencao: ["Amizades em queda há três meses."], pergunta_reflexao: "O que você está adiando que pediria só uma conversa?", transcricao_resumida: "Sessão de exemplo: os diretores apontaram a ligação entre sono, humor e gastos; o CEO decidiu proteger o sono antes das entregas.", turnos: 24, chamadas: 31 },
    { id: "ata_ex2", data: d(9), tipo: "ordinaria", foco: "Energia e foco nas semanas de entrega", insights: ["Proteger o sono funcionou: 6 de 7 noites acima de 7 h.", "O teto de restaurantes falhou porque não havia alternativa para os jantares tardios.", "Amizades seguem sem iniciativa."], decisoes: ["Cozinhar no domingo para as noites de entrega.", "Convidar um amigo por semana, sem esperar convite."], acoes: [ac("Finanças", "Preparar 3 jantares no domingo para as noites de entrega", d(-5), "2 semanas sem jantar fora por cansaço", "aberta"), ac("Amizades & social", "Convidar um amigo por semana", d(-12), "3 encontros marcados no mês", "aberta"), ac("Saúde física", "Manter o horário de dormir nas noites antes de entrega", d(-19), "sono médio de 7 h ou mais", "aberta")], notas: nt({ "Saúde física": [6.9, "sono médio subiu para 7,1 h"], "Saúde mental": [6.8, "humor médio 3,9, sem quedas longas"], "Finanças": [6.4, "restaurantes 22% acima do teto"], "Carreira": [7.2, "uma proposta em negociação"], "Aprendizado": [6, "15 h de estudo"], "Família": [6.2, "visita marcada"], "Amizades & social": [4.6, "nenhum encontro em 3 semanas"], "Casa & organização": [6.6, "conta de luz paga com atraso de 2 dias"] }, 6.4), placar_dados: { "Saúde física": 7, "Saúde mental": 6.6, "Finanças": 6.5, "Carreira": 7, "Aprendizado": 5.8, "Família": 6.3, "Amizades & social": 4.5, "Casa & organização": 6.7 }, pontos_atencao: ["Amizades: o placar caiu pelo terceiro mês.", "Restaurantes ligados ao cansaço, não ao lazer."], pergunta_reflexao: "Se a sua vida fosse uma empresa, qual área você está tratando como custo e não como investimento?", transcricao_resumida: "Sessão de exemplo: a ação de sono foi cumprida; a de restaurantes não, por falta de alternativa. O CEO decidiu cozinhar aos domingos e tomar a iniciativa com os amigos.", turnos: 28, chamadas: 36 },
  ] };
}
