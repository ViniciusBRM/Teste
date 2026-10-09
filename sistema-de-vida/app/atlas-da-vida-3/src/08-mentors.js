
/* ================================================================ mentores IA: um agente por área + o Conselho */
let SAMPLE = null, TOOLS_MAX = 0, AI_OFF = "", MCP = null, NOTION_OK = false;
const MENTOR_DEF = {
  conselho: { area: null, nome: "Conselho", papel: "conselho que coordena todos os mentores e olha a vida inteira", foco: "equilíbrio entre áreas, as 3 prioridades da semana e conflitos de tempo, energia e dinheiro", met: "revisão semanal, regra das 3 prioridades, matriz importante × urgente, custo de oportunidade", ico: "council" },
  fis: { area: "Saúde física", nome: "Mentor do Corpo", papel: "treinador de saúde física", foco: "sono, treinos, passos, peso e energia", met: "consistência acima de intensidade, sobrecarga progressiva, higiene do sono, metas mínimas viáveis, gatilhos de hábito" },
  men: { area: "Saúde mental", nome: "Mentor da Mente", papel: "mentor de bem-estar emocional (não é terapeuta)", foco: "humor, estresse, energia, rotina e o que aparece no diário", met: "reestruturação de pensamentos no estilo TCC, registro de gatilhos, rotina de recuperação, autocompaixão prática" },
  fin: { area: "Finanças", nome: "Mentor do Dinheiro", papel: "consultor de finanças pessoais", foco: "orçamento, poupança, reserva de emergência, dívidas e assinaturas", met: "pague-se primeiro, 50/30/20 como referência, tetos semanais, avalanche de dívidas, custo por uso" },
  car: { area: "Carreira", nome: "Mentor da Carreira", papel: "mentor de carreira", foco: "candidaturas, entrevistas, competências e posicionamento profissional", met: "método STAR, mapa de competências, networking intencional, portfólio com resultados mensuráveis" },
  apr: { area: "Aprendizado", nome: "Mentor do Aprendizado", papel: "mentor de estudos", foco: "horas de estudo, livros, idiomas e cursos", met: "prática deliberada, repetição espaçada, blocos fixos de estudo, ensinar para aprender" },
  fam: { area: "Família", nome: "Mentor da Família", papel: "mentor de relações familiares", foco: "frequência e qualidade do contato com a família e datas importantes", met: "rituais de contato, perguntas abertas, presença à distância, planejamento de visitas" },
  amo: { area: "Amor & parceria", nome: "Mentor do Amor", papel: "mentor de relacionamento amoroso", foco: "tempo de qualidade, conflitos e planos a dois", met: "proporção de 5 interações positivas para 1 negativa (Gottman), comunicação não-violenta, rituais de conexão" },
  ami: { area: "Amizades & social", nome: "Mentor das Amizades", papel: "mentor de vida social", foco: "rede de amigos, frequência de contato e iniciativa", met: "convidar em vez de esperar, encontros recorrentes, círculos de proximidade" },
  laz: { area: "Lazer & criatividade", nome: "Mentor do Lazer", papel: "mentor de lazer e criatividade", foco: "horas de lazer, satisfação, hobbies e a lista de sonhos", met: "lazer ativo × passivo, estado de flow, orçamento de diversão, próximo passo para cada sonho" },
  pro: { area: "Propósito & espiritualidade", nome: "Mentor do Propósito", papel: "mentor de propósito e valores", foco: "valores, voluntariado, prática espiritual e sentido", met: "clarificação de valores, ikigai, gratidão, contribuição" },
  cas: { area: "Casa & organização", nome: "Mentor da Casa", papel: "mentor de organização da vida prática", foco: "documentos, rotinas da casa, burocracia e vida digital", met: "GTD, rotinas com gatilho, revisão semanal, lotes de tarefas" },
};
const MIDS = Object.keys(MENTOR_DEF);
const mcol = mid => MENTOR_DEF[mid]?.cor || (MENTOR_DEF[mid]?.area ? acol(MENTOR_DEF[mid].area) : "var(--accent)");
const mico = mid => MENTOR_DEF[mid]?.ico || AREA_INFO[MENTOR_DEF[mid]?.area]?.ico || "spark";
const mavatar = (mid, cls = "") => `<span class="mav ${cls}" style="--c:${mcol(mid)}">${ic(mico(mid))}</span>`;
const QUICK = {
  conselho: ["Quais são minhas 3 prioridades desta semana?", "Onde as áreas estão em conflito?", "O que estou negligenciando?"],
  fis: ["Por que minha energia oscila?", "Monte meu plano de treinos da semana"], men: ["O que mais afeta meu humor?", "Como lidar melhor com o estresse desta semana?"],
  fin: ["Onde posso economizar sem sofrer?", "Quanto falta para a reserva e em quanto tempo chego lá?"], car: ["Me prepare para a próxima entrevista", "Quais competências devo priorizar?"],
  apr: ["Como acelerar meu progresso nos estudos?", "Que livro ou curso faz sentido agora?"], fam: ["Quem da família estou deixando de lado?"], amo: ["Ideias para um tempo de qualidade a dois"],
  ami: ["Quem estou deixando de lado?", "Como ampliar minha rede na cidade?"], laz: ["Ideias de lazer barato para este mês", "Qual sonho dá para começar agora?"],
  pro: ["Como trazer mais sentido para a semana?"], cas: ["O que vence nas próximas semanas?", "Monte uma rotina de organização leve"],
};
const MST = { input: {}, live: null, memF: "todos", memNew: "" };
const mget = mid => S.mentores?.[mid] || { mem: [], plano: null, conversa: [], visto: 0 };
const mstate = mid => (S.mentores[mid] ||= { mem: [], plano: null, conversa: [], visto: 0 });
function areaScoreNow(mid) { const R = calcAt(mkey(TODAY)), a = MENTOR_DEF[mid]?.area; return a ? R.areas.find(x => x.a === a)?.dados ?? null : R.indice == null ? null : R.indice / 10; }
function addMemory(mid, it) {
  const m = mstate(mid), t = String(it.texto || "").trim(); if (!t || m.mem.some(x => norm(x.texto) === norm(t))) return null;
  const rec = { id: uid(), at: Date.now(), tipo: it.tipo || "fato", texto: t.slice(0, 500), fixo: !!it.fixo, origem: it.origem || "mentor" }; m.mem.push(rec);
  if (m.mem.length > 140) { const i = m.mem.findIndex(x => !x.fixo); if (i >= 0) m.mem.splice(i, 1); }
  return rec;
}
function setPlan(mid, p) {
  const m = mstate(mid), old = m.plano?.passos || [];
  m.plano = { at: Date.now(), foco: String(p.foco || m.plano?.foco || "").slice(0, 200), passos: (Array.isArray(p.passos) ? p.passos : []).slice(0, 6).map(s => { const tx = String(s.texto || s).slice(0, 200), prev = old.find(o => norm(o.texto) === norm(tx)); return { id: prev?.id || uid(), texto: tx, prazo: /^\d{4}-\d{2}-\d{2}$/.test(s.prazo || "") ? s.prazo : prev?.prazo || "", feito: prev?.feito || false, tarefaId: prev?.tarefaId || "" }; }) };
}
function sinceLast(mid) {
  const m = mget(mid), def = MENTOR_DEF[mid], since = m.visto ? iso(new Date(m.visto)) : addDays(TODAY, -14), out = [], inA = x => !def.area || x.area === def.area;
  const done = S.tarefas.filter(t => t.status === "Concluída" && t.concluida >= since && inA(t)).length; if (done) out.push(plural(done, "tarefa concluída", "tarefas concluídas"));
  const ents = S.diario.filter(e => e.data >= since && (!def.area || parseEntry(e.texto).areas.includes(def.area))).length; if (ents) out.push(plural(ents, "entrada no diário", "entradas no diário"));
  const sc = areaScoreNow(mid), prev = m.ultimo?.dados; if (isNum(sc) && isNum(prev) && Math.abs(sc - prev) >= .3) out.push(`placar ${sc > prev ? "subiu" : "caiu"} ${num(Math.abs(sc - prev))}`);
  const late = calcAt(mkey(TODAY)).metas.filter(x => inA(x) && x.st === "crit" && x.ativa).length; if (late) out.push(plural(late, "meta em risco", "metas em risco"));
  return { since, out };
}

/* ---------------------------------------------------------------- contexto que o mentor recebe */
function areaFacts(a, Hs) {
  const cur = Hs.at(-1), A = cur.areas.find(x => x.a === a), L = [];
  L.push(`Placar de dados da área (0–10) por mês: ${Hs.map(h => `${mabbr(h.mk)} ${h.areas.find(x => x.a === a)?.dados ?? "–"}`).join(", ")}. Nota que a pessoa se dá na Roda da Vida: ${A.perc ?? "sem nota"} (alvo ${A.alvo ?? "–"}). Resumo: ${A.ind}.`);
  const ms = cur.metas.filter(m => m.area === a);
  if (ms.length) L.push("Metas:\n" + ms.map(m => `- "${m.meta}" [${m.rt}] progresso ${pct(m.prog)}${m.esp != null ? ` (esperado agora ${pct(m.esp)})` : ""}${m.prazo ? `, prazo ${m.prazo}` : ""}${isNum(m.atual) ? `, atual ${m.atual} de ${m.alvo} ${m.un || ""}` : ""}${m.proximo ? `, próximo passo: ${m.proximo}` : ""}, ${m.abertas} tarefa(s) aberta(s)`).join("\n"));
  const hs = cur.hab.filter(h => h.area === a);
  if (hs.length) L.push("Hábitos (mês atual):\n" + hs.map(h => `- ${h.nome}: meta ${h.meta}×/semana, ${pct(h.pm)} da meta, sequência atual ${h.streak} dia(s)`).join("\n"));
  const ts = cur.tar.filter(t => t.area === a && t.open).sort((x, y) => (x.prazo || "9").localeCompare(y.prazo || "9")).slice(0, 12);
  if (ts.length) L.push("Tarefas abertas:\n" + ts.map(t => `- ${t.tarefa} [${t.al}]${t.prazo ? ` prazo ${t.prazo}` : ""}, prioridade ${t.prio}${t.projeto ? `, projeto ${t.projeto}` : ""}`).join("\n"));
  const dn = cur.tar.filter(t => t.area === a && t.status === "Concluída" && t.concluida >= addDays(TODAY, -30));
  if (dn.length) L.push(`Concluídas nos últimos 30 dias: ${dn.map(t => `${t.tarefa} (${fmtD(t.concluida)})`).join("; ")}.`);
  aiNote("area", a);
  const es = aiEntries(S.diario.filter(e => e.data >= addDays(TODAY, -45) && parseEntry(e.texto).areas.includes(a)).sort((x, y) => y.data.localeCompare(x.data))).slice(0, 10);
  if (es.length) L.push("Diário recente sobre a área:\n" + es.map(e => `- ${fmtD(e.data)} (humor ${e.humor ?? "?"})${e.titulo ? ` "${e.titulo}"` : ""}: ${snippet(e, 320)}`).join("\n"));
  return L;
}
function relFacts(rel) {
  const R = calcAt(mkey(TODAY)), ps = R.pes.filter(p => p.relacao === rel || (rel === "Amizade" && p.relacao === "Comunidade")), st = { people: aiPeopleStats() };
  if (!ps.length) return [`Nenhuma pessoa cadastrada com relação "${rel}".`];
  return ["Pessoas:\n" + ps.map(p => `- ${p.nome}: ${p.txt}${p.ult ? `, último contato há ${p.dias} dia(s)` : ""}, quer falar a cada ${p.freq || "?"} dias, ${p.n} contatos registrados${p.prox ? `, aniversário ${fmtD(p.prox)} (em ${p.faltam} dias)` : ""}${st.people[p.nome] ? `, ${st.people[p.nome].n} menções no diário com humor médio ${num(st.people[p.nome].mood)}` : ""}${p.notas ? `. Notas: ${p.notas}` : ""}`).join("\n")];
}
function specFacts(mid, Hs) {
  const cur = Hs.at(-1), L = [], m6 = Hs.map(h => mabbr(h.mk));
  const serie = (l, f) => `${l}: ${Hs.map((h, i) => `${m6[i]} ${f(h)}`).join(", ")}`;
  const infl = (target, n = 6) => !aiMetricOk(target) ? "(métrica de setor privado)" : influencers(target, { days: 180, min: 20 }).filter(i => aiMetricOk(i.k)).slice(0, n).map(i => `${i.l} (r=${num(i.r, 2)}, ${i.sig ? "consistente" : "pode ser acaso"}${i.groups ? `; ${i.groups.bin ? "com" : "alto"}: ${num(i.groups.a)} × ${i.groups.bin ? "sem" : "baixo"}: ${num(i.groups.b)}` : ""})`).join("; ");
  if (mid === "fis") { L.push(serie("Sono médio (h)", h => num(h.sono)), serie("Treinos no mês", h => h.treinos), serie("Passos/dia", h => num(h.passos, 0)), `Peso mais recente: ${cur.peso ?? "–"} kg. Metas da pessoa: sono ${S.cfg.metaSono} h, ${S.cfg.metaTreinos} treinos/semana, ${S.cfg.metaPassos} passos.`, `O que mais se associa à energia: ${infl("energia")}.`); }
  if (mid === "men") { L.push(serie("Humor médio (1–5)", h => num(h.humor)), serie("Estresse médio", h => num(h.estresse)), serie("Energia média", h => num(h.energia)), `O que mais se associa ao humor do dia: ${infl("bem", 8)}.`); const ins = insights(cur, Hs).filter(i => ["Saúde mental", "Saúde física"].includes(i.area) && aiAreaOk(i.area)).slice(0, 4); if (ins.length) L.push("Achados automáticos: " + ins.map(i => i.t.replace(/<[^>]+>/g, "")).join(" ")); }
  if (mid === "fin") { L.push(...pjFacts()); L.push(serie("Receitas", h => eur(h.fin.rec)), serie("Despesas", h => eur(h.fin.desp)), serie("Taxa de poupança", h => pct(h.fin.taxa)), `Meta de poupança ${pct(S.cfg.metaPoup)}. Reserva cobre ${cur.reserva == null ? "?" : num(cur.reserva)} meses (meta ${S.cfg.metaReserva}). Patrimônio líquido ${eur(cur.pl)}. Projeção de despesas do mês: ${cur.proj == null ? "–" : eur(cur.proj)} para orçamento de ${eur(cur.orcTot)}.`, "Orçamento do mês por categoria (real/plano): " + cur.orcCats.map(c => `${c.cat} ${eur(c.real)}/${c.plan ? eur(c.plan) : "sem plano"}${c.st === "crit" ? " ESTOUROU" : c.st === "warn" ? " acima do ritmo" : ""}`).join("; "), `Assinaturas: ${eur(cur.assMes, 2)}/mês; uso baixo: ${cur.ass.filter(a => a.uso === "Baixo").map(a => `${a.servico} (${eur(a.mensal, 2)})`).join(", ") || "nenhuma"}.`, "Maiores despesas do mês: " + cur.lm.filter(l => l.tipo === "Despesa").sort((a, b) => b.valor - a.valor).slice(0, 6).map(l => `${l.desc} ${eur(l.valor)} (${l.cat})`).join("; ")); }
  if (mid === "car") { L.push(...crFacts()); L.push("Candidaturas:\n" + (S.cand.map(c => `- ${c.empresa} · ${c.cargo}: ${c.etapa}${c.acao ? `, próxima ação "${c.acao}" em ${c.dataAcao || "?"}` : ""}`).join("\n") || "nenhuma"), "Competências (atual/alvo, 1–5): " + (S.comp.map(c => `${c.nome} ${c.atual}/${c.alvo}`).join("; ") || "nenhuma")); }
  if (mid === "apr") { L.push(serie("Horas de estudo", h => num(h.horasEst)), `Livros concluídos no ano: ${cur.livros} (meta ${S.cfg.metaLivros}). Meta de estudo: ${S.cfg.metaEstudo} h/mês.`, "Em andamento: " + S.aprend.filter(a => a.status === "Em andamento").map(a => `${a.titulo} (${a.tipo}, ${a.atual || 0}/${a.total || "?"}, ${num(sum(S.estudo.filter(e => e.item === a.titulo && e.data >= addDays(TODAY, -90)).map(e => e.horas)))} h em 90 dias)`).join("; ")); }
  if (mid === "fam") L.push(...relFacts("Família"));
  if (mid === "amo") L.push(...relFacts("Parceria"), ...duoFacts());
  if (mid === "ami") L.push(...relFacts("Amizade"));
  if (mid === "laz") { L.push(serie("Horas de lazer", h => num(h.horasLaz)), serie("Satisfação média", h => num(h.lazSat)), "Lista de sonhos: " + (S.sonhos.map(s => `${s.sonho} (${s.status}${s.custo ? `, ~${eur(+s.custo)}` : ""})`).join("; ") || "vazia")); }
  if (mid === "pro") { const rv = Object.entries(S.revisao).sort().slice(-3); if (rv.length) L.push("Revisões mensais recentes:\n" + rv.map(([k, r]) => `- ${mlabel(k)}: vitórias "${r.vitorias || ""}"; aprendi "${r.aprendi || ""}"; foco "${r.foco || ""}"`).join("\n")); }
  if (mid === "cas") { L.push("Documentos: " + (cur.docs.map(d => `${d.doc} (${d.txt}${d.dias != null ? `, ${d.dias} dias` : ""}${d.acao ? `, ação: ${d.acao}` : ""})`).join("; ") || "nenhum"), "Rotinas: " + (cur.rot.map(r => `${r.rotina} (${r.txt}${r.prox ? `, próxima ${r.prox}` : ""})`).join("; ") || "nenhuma")); }
  return L;
}
function councilFacts(Hs) {
  const cur = Hs.at(-1), L = [];
  L.push(`Índice de vida (0–100): ${Hs.map(h => `${mabbr(h.mk)} ${h.indice ?? "–"}`).join(", ")}.`);
  L.push("Áreas (placar de dados; percepção; alvo; tendência de 3 meses):\n" + cur.areas.map(a => { if (!aiAreaOk(a.a)) return `- ${a.a}: setor privado (a pessoa escolheu não compartilhar dados desta área com a IA)`; aiNote("area", a.a); const old = Hs.at(-4)?.areas.find(x => x.a === a.a)?.dados; return `- ${a.a}: ${a.dados ?? "–"}; ${a.perc ?? "–"}; ${a.alvo ?? "–"}; ${isNum(a.dados) && isNum(old) ? sgn(a.dados - old) : "–"} · ${a.ind}`; }).join("\n"));
  const risk = cur.metas.filter(m => m.ativa && ["crit", "warn"].includes(m.st) && aiAreaOk(m.area)); if (risk.length) L.push("Metas em atenção ou risco: " + risk.map(m => `${m.meta} (${m.area}, ${m.rt}, ${pct(m.prog)} de progresso)`).join("; "));
  L.push("Achados automáticos: " + insights(cur, Hs).filter(i => aiAreaOk(i.area)).slice(0, 6).map(i => `[${i.k}] ${i.t.replace(/<[^>]+>/g, "")}`).join(" "));
  L.push("Prioridades que a pessoa escreveu para a semana: " + (S.prio.filter(Boolean).join("; ") || "nenhuma"));
  const pl = MIDS.filter(m => m !== "conselho" && mget(m).plano && !blockedMentor(m)).map(m => `- ${MENTOR_DEF[m].nome}: foco "${mget(m).plano.foco}"; pendentes: ${mget(m).plano.passos.filter(p => !p.feito).map(p => p.texto).join("; ") || "nenhum"}`);
  if (pl.length) L.push("Planos dos mentores:\n" + pl.join("\n"));
  const nx = [...cur.tar.filter(t => t.open && t.prazo && t.prazo <= addDays(TODAY, 7) && aiAreaOk(t.area)).map(t => `tarefa "${t.tarefa}" ${t.prazo}`), ...cur.pes.filter(p => p.faltam != null && p.faltam <= 14 && aiAreaOk(relArea(p.relacao))).map(p => `aniversário de ${p.nome} ${p.prox}`), ...(aiAreaOk("Casa & organização") ? cur.venc.filter(v => v.dias <= 30).map(v => `${v.k} "${v.t}" em ${v.dias} dias`) : [])];
  if (nx.length) L.push("Próximos dias: " + nx.join("; "));
  const es = aiEntries(S.diario.filter(e => e.data >= addDays(TODAY, -14)).sort((a, b) => b.data.localeCompare(a.data))).slice(0, 8);
  if (es.length) L.push("Diário das últimas 2 semanas:\n" + es.map(e => `- ${fmtD(e.data)}${aiAreaOk("Saúde mental") ? ` (humor ${e.humor ?? "?"})` : ""}: ${snippet(e, 220)}`).join("\n"));
  L.push(...labFacts());
  return L;
}
/* cx = { dados }: modo conselho. A identidade, a memória e o plano ficam; os DADOS viram o briefing da reunião */
function mentorPrompt(mid, fallback, cx) {
  if (MENTOR_DEF[mid].prompt) return MENTOR_DEF[mid].prompt(fallback, cx);
  if (MENTOR_DEF[mid].jor) return jPrompt(mid, fallback, cx);
  if (MENTOR_DEF[mid].lz) return lzPrompt(mid, fallback, cx);
  const def = MENTOR_DEF[mid], m = mget(mid), Hs = []; for (let k = 5; k >= 0; k--) Hs.push(calcAt(addMonth(mkey(TODAY), -k)));
  const facts = cx ? [cx.dados] : def.area ? [...areaFacts(def.area, Hs), ...specFacts(mid, Hs), ...labFacts(def.area)] : councilFacts(Hs);
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-24)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}${x.origem !== "mentor" ? " · " + x.origem : ""}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const plan = m.plano ? `Foco: ${m.plano.foco}\n` + m.plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${p.prazo})` : ""}`).join("\n") : "Ainda não há plano.";
  const sl = sinceLast(mid);
  const care = def.area === "Saúde mental" ? "\n- Você não substitui terapia. Diante de sinais de crise ou risco, recomende com cuidado procurar ajuda profissional ou um serviço de emergência local." : def.area === "Saúde física" ? "\n- Não dê diagnóstico médico; para dor, lesão ou sintomas, recomende um profissional de saúde." : def.area === "Finanças" ? "\n- Não recomende produtos financeiros específicos; fale de comportamento, orçamento e prioridades." : "";
  const fb = fallback ? `\n\nFORMATO: escreva a resposta normalmente. Se quiser salvar memória, atualizar o plano ou propor registros, termine com um bloco exatamente assim (omita o bloco se não houver nada):\n\`\`\`atlas\n{"memorias":[{"tipo":"compromisso","texto":"..."}],"plano":{"foco":"...","passos":[{"texto":"...","prazo":"AAAA-MM-DD"}]},"propostas":[{"tipo":"tarefa","titulo":"...","prazo":"AAAA-MM-DD","prioridade":"Média","detalhes":"..."}]}\n\`\`\`` : "";
  return `Você é o ${def.nome}, ${def.papel}, dentro do app pessoal "Atlas da Vida". Foco: ${def.foco}. Repertório: ${def.met}.
Você acompanha esta pessoa ao longo do tempo: tem uma memória do que vocês combinaram e um plano atual, abaixo. Tom: ${S.cfg.mentorTom || "direto e caloroso"}. Escreva em português do Brasil.
Regras:
- Baseie-se nos dados abaixo e cite números e datas. Nunca invente dados; se faltar informação, diga exatamente o que registrar no app.
- Seja breve e escaneável (até ~180 palavras, salvo se pedirem mais), com no máximo 3 ações concretas.
- Quando fizer sentido, traga UMA ideia nova (um experimento de 1–2 semanas) que a pessoa ainda não tentou, explicando por que serve para o caso dela.
- ${fallback ? "Use o bloco atlas" : "Use as ferramentas"} para: salvar na memória decisões, compromissos, preferências e progressos (frases curtas, com data); atualizar o plano quando ele mudar; propor tarefas, metas ou hábitos (a pessoa aprova antes de virar registro)${fallback ? "" : "; consultar e cruzar métricas ou buscar no diário para checar hipóteses antes de afirmar algo; deixar recado para outro mentor quando algo afetar outra área"}.
- Não repita o que já está na memória e não salve trivialidades. Respeite a autonomia da pessoa: ofereça, não imponha.${care}

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
${facts.join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}

PLANO ATUAL:
${plan}

DESDE A ÚLTIMA CONVERSA (${m.visto ? fmtDY(sl.since) : "primeira conversa"}): ${sl.out.join("; ") || "nada relevante registrado"}.${fb}`.slice(0, 120000);
}

/* ---------------------------------------------------------------- ferramentas do agente */
function mentorTools(mid, live) {
  const def = MENTOR_DEF[mid], keys = metricList().filter(m => aiMetricOk(m.k)).map(m => `${m.k} (${m.l})`).join(", ");
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  const T = [
    { name: "salvar_memoria", description: "Guarda algo importante sobre a pessoa para lembrar nas próximas conversas: decisão, compromisso, preferência, progresso, ideia, alerta ou fato. Frase curta e específica, com data se houver. Retorna {ok}.",
      inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["decisão", "compromisso", "preferência", "progresso", "ideia", "alerta", "fato"] }, texto: { type: "string" }, fixar: { type: "boolean", description: "true para algo que deve ficar sempre visível" } }, required: ["tipo", "texto"] },
      execute: inp => { const r = addMemory(mid, { tipo: String(inp.tipo || "fato"), texto: String(inp.texto || ""), fixo: !!inp.fixar }); if (r) { touch("mentores", { noUndo: true, noRender: true }); note("salvar_memoria", `${r.tipo}: ${trunc(r.texto, 90)}`); } return { ok: true, duplicado: !r }; } },
    { name: "atualizar_plano", description: "Substitui o plano desta área: um foco (frase curta) e de 1 a 5 passos, cada um com prazo opcional AAAA-MM-DD. Passos com o mesmo texto mantêm o status de feito. Retorna {ok}.",
      inputSchema: { type: "object", properties: { foco: { type: "string" }, passos: { type: "array", items: { type: "object", properties: { texto: { type: "string" }, prazo: { type: "string" } }, required: ["texto"] } } }, required: ["foco", "passos"] },
      execute: inp => { setPlan(mid, inp); touch("mentores", { noUndo: true, noRender: true }); note("atualizar_plano", `${trunc(inp.foco, 70)} · ${(inp.passos || []).length} passos`); return { ok: true }; } },
    { name: "propor", description: "Propõe criar um registro que a pessoa aprova ou descarta: tarefa, meta, hábito ou lembrete (lembrete vira tarefa com prazo). Nada é criado sem aprovação. Retorna {ok, status}.",
      inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["tarefa", "meta", "habito", "lembrete"] }, titulo: { type: "string" }, prazo: { type: "string", description: "AAAA-MM-DD" }, prioridade: { type: "string", enum: ["Alta", "Média", "Baixa"] }, detalhes: { type: "string" }, meta_relacionada: { type: "string", description: "nome exato de uma meta existente" }, alvo: { type: "number", description: "valor alvo, para metas numéricas" }, unidade: { type: "string" }, vezes_por_semana: { type: "number", description: "para hábitos" } }, required: ["tipo", "titulo"] },
      execute: inp => { const p = mkProposal(inp); live.acoes.push(p); note("propor", `${p.tipo}: ${trunc(p.titulo, 70)}`); return { ok: true, status: "aguardando aprovação da pessoa" }; } },
    { name: "consultar", description: `Série mensal de uma métrica diária nos últimos N meses (2–24). Use a chave da métrica. Disponíveis: ${keys}. Retorna {metrica, agregacao, meses:[{mes, valor}]}.`,
      inputSchema: { type: "object", properties: { metrica: { type: "string" }, meses: { type: "number" } }, required: ["metrica"] },
      execute: inp => { const m = metric(String(inp.metrica)) || metricList().find(x => norm(x.l) === norm(inp.metrica)); if (!m) throw new Error("Métrica desconhecida. Use uma das chaves da lista."); if (!aiMetricOk(m.k)) throw new Error("Essa métrica é de um setor que a pessoa marcou como privado. Não use."); aiNote("met", m.k, live.ctx); const s = aggSeries(m.k, "m", clamp(+inp.meses || 6, 2, 24)); note("consultar", `${m.l} · ${s.keys.length} meses`); return { metrica: m.l, agregacao: m.agg === "sum" ? "soma no mês" : "média no mês", meses: s.keys.map((k, i) => ({ mes: k, valor: s.vals[i] == null ? null : Math.round(s.vals[i] * 100) / 100 })) }; } },
    { name: "cruzar", description: "Cruza duas métricas diárias (chaves de consultar) e devolve correlação r, número de dias e a média de Y quando X está alto × baixo (ou com × sem, se X for sim/não). defasagem=1 compara X de um dia com Y do dia seguinte.",
      inputSchema: { type: "object", properties: { x: { type: "string" }, y: { type: "string" }, dias: { type: "number" }, defasagem: { type: "number" } }, required: ["x", "y"] },
      execute: inp => { const a = metric(String(inp.x)), b = metric(String(inp.y)); if (!a || !b) throw new Error("Métrica desconhecida."); if (!aiMetricOk(a.k) || !aiMetricOk(b.k)) throw new Error("Uma das métricas é de um setor privado. Não use."); aiNote("met", a.k, live.ctx); aiNote("met", b.k, live.ctx); const c = crossData(a.k, b.k, { days: clamp(+inp.dias || 180, 30, 730), lag: clamp(+inp.defasagem || 0, 0, 7) }); note("cruzar", `${a.l} × ${b.l}${c?.r != null ? ` · r ${num(c.r, 2)}` : ""}`); if (c?.rel) return { x: a.l, y: b.l, aviso: "Uma métrica é parte da outra (ou a mesma medida): a correlação vem da conta, não da vida. Não interprete." };
        const fz = czForca(c), r2 = v => v == null ? null : Math.round(v * 100) / 100;
        return c ? { x: a.l, y: b.l, r: r2(c.r), dias: c.n, dias_efetivos: c.neff == null ? null : Math.round(c.neff), intervalo_95: c.lo == null ? null : [r2(c.lo), r2(c.hi)], confianca: fz.t, leitura: c.r == null ? "dados insuficientes" : `correlação ${rWord(c.r)} ${c.r >= 0 ? "positiva" : "negativa"} (${fz.t})`, y_quando_x_alto_ou_sim: c.groups ? Math.round(c.groups.a * 100) / 100 : null, y_quando_x_baixo_ou_nao: c.groups ? Math.round(c.groups.b * 100) / 100 : null } : { erro: "sem dados" }; } },
    { name: "buscar_diario", description: "Busca entradas do diário por termo, tema (tag sem #) e/ou pessoa nos últimos N dias. Retorna até 8 trechos com data e humor.",
      inputSchema: { type: "object", properties: { termo: { type: "string" }, tema: { type: "string" }, pessoa: { type: "string" }, dias: { type: "number" } } },
      execute: inp => { const from = addDays(TODAY, -clamp(+inp.dias || 120, 7, 730)), q = norm(inp.termo || ""), tg = slug(inp.tema || ""), pe = inp.pessoa ? resolvePerson(String(inp.pessoa).replace(/^@/, "")) : null;
        const r = aiEntries(S.diario.filter(e => { if (e.data < from || !aiAllowed(e)) return false; const p = parseEntry(e.texto); return (!q || norm(e.titulo + " " + e.texto).includes(q)) && (!tg || p.tags.includes(tg)) && (!pe || p.people.includes(pe)); }).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8), live.ctx);
        note("buscar_diario", [inp.termo, inp.tema && "#" + inp.tema, pe && "@" + pe].filter(Boolean).join(" ") + ` · ${plural(r.length, "entrada", "entradas")}`); return r.map(e => ({ data: e.data, humor: e.humor ?? null, titulo: e.titulo || "", trecho: snippet(e, 400) })); } },
    { name: "recado", description: "Deixa um recado curto na memória de outro mentor ou do Conselho quando algo desta conversa afeta outra área (ex.: o teto de gastos que afeta o lazer).",
      inputSchema: { type: "object", properties: { para: { type: "string", enum: MIDS.filter(x => x !== mid) }, texto: { type: "string" } }, required: ["para", "texto"] },
      execute: inp => { const to = String(inp.para); if (!MENTOR_DEF[to] || to === mid) throw new Error("Destino inválido."); addMemory(to, { tipo: "recado", texto: String(inp.texto), origem: "recado do " + def.nome }); touch("mentores", { noUndo: true, noRender: true }); note("recado", `para ${MENTOR_DEF[to].nome}: ${trunc(inp.texto, 70)}`); return { ok: true }; } },
  ];
  if (NOTION_OK && S.cfg.mentorNotion) T.push({ name: "buscar_notion", description: "Busca páginas no Notion da pessoa por palavras-chave e devolve até 5 resultados com título, link e trecho. Use para projetos, anotações e planos que estão lá.",
    inputSchema: { type: "object", properties: { consulta: { type: "string" } }, required: ["consulta"] },
    execute: async (inp, ctx) => { const res = await MCP.callTool("Notion", "notion-search", { query: String(inp.consulta).slice(0, 200), page_size: 5 }, { signal: ctx.signal }); const rs = (res.payload?.results || []).slice(0, 5).map(x => ({ titulo: x.title, link: x.url, trecho: trunc(String(x.highlight || "").replace(/\*\*/g, ""), 300) })); note("buscar_notion", `“${trunc(inp.consulta, 40)}” · ${rs.length} páginas`); return rs; } });
  const out = def.tools ? def.tools(live, T) : def.jor ? jTools(mid, live, T) : def.lz ? lzTools(mid, live, T) : T;
  return TOOLS_MAX && TOOLS_MAX < out.length ? out.slice(0, TOOLS_MAX) : out;
}
function mkProposal(inp) {
  const tipo = ["tarefa", "meta", "habito", "lembrete"].includes(inp.tipo) ? inp.tipo : "tarefa";
  return { id: uid(), tipo, titulo: String(inp.titulo || "").slice(0, 200), prazo: /^\d{4}-\d{2}-\d{2}$/.test(inp.prazo || "") ? inp.prazo : "", prio: ["Alta", "Média", "Baixa"].includes(inp.prioridade) ? inp.prioridade : "Média", detalhes: String(inp.detalhes || "").slice(0, 400), meta: String(inp.meta_relacionada || ""), alvo: isNum(inp.alvo) ? +inp.alvo : "", un: String(inp.unidade || ""), vezes: isNum(inp.vezes_por_semana) ? +inp.vezes_por_semana : "", status: "pendente" };
}

/* ---------------------------------------------------------------- conversa */
async function askMentor(mid, text, mode = "chat") {
  text = String(text || "").trim(); if (!text) return;
  if (!MST.live && MENTOR_DEF[mid]?.intercept?.(text)) return;
  if (!SAMPLE) { toast(AI_OFF || "A IA do Claude não está disponível nesta visualização."); return; }
  if (MST.live) { toast("Espere a resposta atual terminar ou toque em Parar."); return; }
  if (blockedMentor(mid)) { toast(`${ashort(MENTOR_DEF[mid].area || MENTOR_DEF[mid].gate)} está fora da IA em Privacidade. Libere o setor para conversar com este mentor.`); return; }
  MENTOR_DEF[mid].before?.(text);
  const m = mget(mid), user = { role: "user", content: text, at: Date.now(), mode };
  const live = MST.live = { mid, text: "", uso: [], acoes: [], ctl: new AbortController(), user, mode };
  MST.input[mid] = ""; render(); scrollChat();
  const fallback = !TOOLS_MAX;
  const hist = m.conversa.slice(-12).map(x => ({ role: x.role, content: x.role === "assistant" ? x.content + (x.uso?.length ? `\n\n[ações que você executou: ${x.uso.map(u => `${u.t} (${u.d})`).join("; ")}]` : "") + (x.acoes?.length ? `\n[propostas: ${x.acoes.map(a => `${a.tipo} "${a.titulo}" — ${a.status}`).join("; ")}]` : "") : x.content })).filter(x => x.content.trim());
  const lv = S.cfg.mentorNivel || "default", tier = mode === "chat" ? lv : lv === "quick" ? "default" : "complex";
  try {
    const r = await aiCall(MENTOR_DEF[mid].nome, ctx => { live.ctx = ctx; return [{ role: "user", content: mentorPrompt(mid, fallback) }, ...hist, { role: "user", content: text }]; }, { signal: live.ctl.signal, modelTier: tier, cache: false, ...(fallback ? {} : { tools: mentorTools(mid, live) }), onText: ({ text: t }) => { live.text = t; paintLive(); } });
    finishMentor(r.text, r.truncated);
  } catch (e) {
    const soft = ["tools_unavailable", "invalid_request", "upstream_error", "transform_error", "prompt_too_large", "empty_completion"].includes(e?.code) || !e?.code;
    if (soft && !fallback && !e?.text) { console.warn("mentor: tentando sem ferramentas após", e?.code, e?.message); TOOLS_MAX = 0; MST.live = null; return askMentor(mid, text, mode); }
    if (e?.text) finishMentor(e.text, true); else { MST.live = null; render(); }
    if (e?.code !== "cancelled") aiError(e);
  }
}
function finishMentor(text, cut) {
  const live = MST.live; if (!live) return;
  let content = String(text || ""); const mm = content.match(/```atlas\s*([\s\S]*?)```/);
  if (mm) { try { const b = JSON.parse(mm[1]); for (const x of b.memorias || []) { const r = addMemory(live.mid, { tipo: x.tipo, texto: x.texto }); if (r) live.uso.push({ t: "salvar_memoria", d: `${r.tipo}: ${trunc(r.texto, 90)}` }); } if (b.plano?.foco) { setPlan(live.mid, b.plano); live.uso.push({ t: "atualizar_plano", d: trunc(b.plano.foco, 70) }); } if (MENTOR_DEF[live.mid]?.parseBlock) MENTOR_DEF[live.mid].parseBlock(b, live); else for (const p of b.propostas || []) live.acoes.push(mkProposal(p)); const pid = jMidP(live.mid); if (pid) for (const x of b.praticas || []) { const r = jRecommend(pid, x); if (r) live.uso.push({ t: "recomendar", d: `${r.tipo}: ${trunc(r.titulo, 80)}` }); }
    const lzd = MENTOR_DEF[live.mid]?.lz; if (lzd) { for (const x of b.sugestoes || []) { const r = lzSugAdd(lzd, x); if (r) live.uso.push({ t: "recomendar", d: trunc(r.titulo, 80) }); } if (b.nivel?.nivel) { const n = clamp(Math.round(+b.nivel.nivel), 1, 4); lzData().nivel[lzd] = n; live.uso.push({ t: "ajustar_nivel", d: `${LZ_NIV[n]}: ${trunc(String(b.nivel.motivo || ""), 60)}` }); } } } catch {} content = content.replace(mm[0], "").trim(); }
  content = content.replace(/```atlas[\s\S]*$/, "").trim();
  if (live.uso.some(u => u.t === "recomendar")) dirty.add(MENTOR_DEF[live.mid]?.lz ? "lazerHub" : "jornada");
  if (live.uso.some(u => u.t === "ajustar_nivel")) dirty.add("lazerHub");
  const m = mstate(live.mid); m.conversa.push(live.user, { role: "assistant", content: (content || "(sem texto)") + (cut ? "\n\n_(resposta interrompida)_" : ""), at: Date.now(), uso: live.uso, acoes: live.acoes });
  if (m.conversa.length > 40) m.conversa = m.conversa.slice(-40);
  m.visto = Date.now(); m.ultimo = { at: Date.now(), dados: areaScoreNow(live.mid) };
  MST.live = null; touch("mentores", { noUndo: true }); scrollChat();
}
function aiError(e) {
  const c = e?.code;
  if (c === "not_granted") AI_OFF = "Você não permitiu que este app use o Claude nesta visualização. Mentores e leituras ficam em modo consulta: memória e planos continuam editáveis.";
  else if (c === "sampling_disabled" || c === "capability_disabled" || c === "capability_removed" || c === "not_declared") AI_OFF = "A IA do Claude não está disponível para esta conta ou visualização.";
  const msg = { rate_limited: "Muitas perguntas seguidas. Espere um pouco e tente de novo.", refused: "O Claude não respondeu a esse pedido. Reformule a pergunta.", prompt_too_large: "O contexto ficou grande demais. Limpe a conversa deste mentor e tente de novo.", session_expired: "Sua sessão expirou. Entre de novo no Claude e recarregue.", empty_completion: "A resposta veio vazia. Tente pedir de outro jeito.", invalid_json: "A resposta não veio no formato esperado. Tente de novo." }[c];
  toast(AI_OFF && ["not_granted", "sampling_disabled", "capability_disabled", "capability_removed", "not_declared"].includes(c) ? AI_OFF : msg || `A resposta foi interrompida (código: ${c || "desconhecido"}). Tente de novo em instantes.`);
  render();
}
const liveText = t => String(t || "").replace(/```atlas[\s\S]*$/, "").trim();
function paintLive() {
  const el = $("#livebubble"), L = MST.live; if (!el || !L) return;
  $(".lb-text", el).innerHTML = L.text ? md(liveText(L.text)) : `<div class="thinking">${ic("spark")}Pensando… ${L.mode === "chat" ? "" : "fazendo o acompanhamento"}</div>`;
  $(".lb-uso", el).innerHTML = usoHTML(L.uso); $(".lb-acoes", el).innerHTML = L.acoes.map(p => propHTML(L.mid, -1, p)).join("");
  scrollChat(true);
}
function scrollChat(soft) { const c = $("#mchat"); if (c && (!soft || c.scrollHeight - c.scrollTop - c.clientHeight < 160)) c.scrollTop = c.scrollHeight; }
const USO_TXT = { ver_aba: ["eye", "Olhou a aba"], consultar_mentor: ["council", "Consultou o mentor"], levantar_conflito: ["flag", "Levou para você decidir"], salvar_memoria: ["memory", "Guardou na memória"], atualizar_plano: ["flag", "Atualizou o plano"], propor: ["plus", "Propôs"], consultar: ["table", "Consultou"], cruzar: ["scatter", "Cruzou"], buscar_diario: ["pen", "Buscou no diário"], recado: ["link", "Deixou recado"], buscar_notion: ["search", "Buscou no Notion"], recomendar: ["book", "Recomendou"], ajustar_nivel: ["sprout", "Ajustou o nível"] };
const usoHTML = us => (us || []).map(u => `<span class="uso">${ic(USO_TXT[u.t]?.[0] || "bolt")}<b>${USO_TXT[u.t]?.[1] || u.t}</b> ${esc(u.d)}</span>`).join("");
function propHTML(mid, mi, p) {
  if (p.ck) return ckPropHTML(mid, mi, p);
  const lab = { tarefa: "Tarefa", meta: "Meta", habito: "Hábito", lembrete: "Lembrete" }[p.tipo];
  return `<div class="prop ${p.status}"><div class="prop-t">${ic({ tarefa: "checksq", meta: "target", habito: "repeat", lembrete: "clock" }[p.tipo] || "plus")}<div><span class="prop-k">${lab} proposta</span><b>${esc(p.titulo)}</b><small>${[p.prazo && "até " + fmtD(p.prazo), p.tipo !== "habito" && p.prio, p.vezes && p.vezes + "×/semana", isNum(p.alvo) && `alvo ${p.alvo} ${p.un || ""}`, p.meta && "meta: " + p.meta].filter(Boolean).map(esc).join(" · ")}</small>${p.detalhes ? `<p>${esc(p.detalhes)}</p>` : ""}</div></div>
    <div class="prop-a">${p.status === "pendente" ? (mi >= 0 ? `<button type="button" class="btn sm primary" data-prop="${mid}|${mi}|${p.id}|ok">${ic("check")}Criar</button><button type="button" class="btn sm ghost" data-prop="${mid}|${mi}|${p.id}|no">Descartar</button>` : `<span class="muted">aguarde a resposta terminar</span>`) : p.status === "aceita" ? `<span class="pill good">Criada</span>` : `<span class="pill none">Descartada</span>`}</div></div>`;
}
function decideProposal(mid, mi, pid, ok) {
  const msg = mstate(mid).conversa[mi], p = msg?.acoes?.find(x => x.id === pid); if (!p || p.status !== "pendente") return;
  if (p.ck) { ckDecide(mid, p, ok); return; }
  const area = MENTOR_DEF[mid].area || MENTOR_DEF[mid].gate || "", keys = ["mentores"];
  if (!ok) { p.status = "descartada"; touch("mentores", { label: "Proposta descartada" }); return; }
  if (p.tipo === "tarefa" || p.tipo === "lembrete") { const meta = S.metas.find(m => norm(m.meta) === norm(p.meta))?.meta || ""; S.tarefas.push({ id: p.ref = uid(), tarefa: p.titulo, projeto: "", area: area || (meta ? S.metas.find(m => m.meta === meta).area : ""), prio: p.prio, prazo: p.prazo, status: "A fazer", concluida: "", meta, notas: p.detalhes, origem: MENTOR_DEF[mid].nome }); keys.push("tarefas"); }
  if (p.tipo === "meta") { S.metas.push({ id: p.ref = uid(), meta: p.titulo, area: area || "Casa & organização", status: "Ativa", inicio: TODAY, prazo: p.prazo, un: p.un, ini: p.alvo !== "" ? 0 : "", atual: p.alvo !== "" ? 0 : "", alvo: p.alvo, manual: p.alvo !== "" ? "" : 0, proximo: p.detalhes, origem: MENTOR_DEF[mid].nome }); keys.push("metas"); }
  if (p.tipo === "habito") { S.habitos.push({ id: p.ref = uid(), nome: p.titulo, area: area || "Saúde mental", meta: p.vezes || 5 }); keys.push("habitos"); }
  p.status = "aceita"; touch(...keys, { label: `${p.tipo} criada pelo mentor` }); undoToast(`${{ tarefa: "Tarefa", meta: "Meta", habito: "Hábito", lembrete: "Lembrete" }[p.tipo]} criado(a)`);
}

/* ---------------------------------------------------------------- páginas */
function pMentores(R) {
  const H = history(6), ins = insights(R, H);
  const card = mid => { const def = MENTOR_DEF[mid], m = mget(mid), sc = areaScoreNow(mid), A = def.area ? R.areas.find(x => x.a === def.area) : null;
    const P = calcAt(addMonth(mkey(TODAY), -1)), prevSc = def.area ? P.areas.find(x => x.a === def.area)?.dados ?? null : P.indice == null ? null : P.indice / 10;
    const pend = (m.conversa || []).reduce((k, x) => k + (x.acoes || []).filter(a => a.status === "pendente").length, 0), sl = sinceLast(mid), nx = m.plano?.passos.find(p => !p.feito);
    const nud = def.area ? ins.find(i => i.area === def.area) : ins[0];
    const ser = H.map(h => def.area ? h.areas.find(x => x.a === def.area)?.dados : h.indice == null ? null : h.indice / 10);
    return `<article class="mcard${mid === "conselho" ? " wide" : ""}" style="--c:${mcol(mid)}"><header>${mavatar(mid)}<div><h3>${esc(def.nome)}</h3><span class="muted">${def.area ? esc(ashort(def.area)) : "Todas as áreas"}</span></div>${pend ? `<em class="nb acc" title="Propostas aguardando você">${pend}</em>` : ""}<div class="msc"><b>${sc == null ? "–" : num(sc)}</b>${isNum(sc) && isNum(prevSc) ? `<small class="${sc >= prevSc ? "st-good" : "st-crit"}">${sc >= prevSc ? "▲" : "▼"} ${num(Math.abs(sc - prevSc))}</small>` : ""}</div></header>
      <div class="mspark">${spark(ser, mcol(mid), { min: 0, max: 10 })}</div>
      <div class="mfoc"><span class="flbl">Plano</span>${m.plano ? `<b>${esc(m.plano.foco)}</b>${nx ? `<small>Próximo: ${esc(nx.texto)}${nx.prazo ? ` · ${relDay(nx.prazo)}` : ""}</small>` : `<small>Todos os passos feitos</small>`}` : `<span class="muted">Ainda sem plano. Peça um acompanhamento.</span>`}</div>
      ${nud ? `<div class="mnud ${nud.st}">${ic("bolt")}<span>${nud.t}</span></div>` : ""}
      <footer><span class="muted">${m.conversa?.length ? `conversa ${relDay(iso(new Date(m.visto || m.conversa.at(-1).at)))}` : "nunca conversaram"} · ${plural((m.mem || []).length, "memória", "memórias")}${sl.out.length && m.visto ? ` · desde então: ${esc(sl.out.slice(0, 2).join(", "))}` : ""}</span><a class="btn sm${mid === "conselho" ? " primary" : ""}" href="#mentor.${mid}">${ic("spark")}Conversar</a></footer></article>`; };
  return `${aiBanner()}<p class="lead">Um mentor para cada área da vida e um Conselho que olha o todo. Cada um lê os seus números e o seu diário, lembra do que vocês combinaram e propõe melhorias, que só viram tarefa, meta ou hábito quando você aprova.</p>
    <div class="mgrid">${MIDS.filter(m => !MENTOR_DEF[m].jor && !MENTOR_DEF[m].lz && !MENTOR_DEF[m].page).map(card).join("")}</div>
    <div class="mhead jmh2">${ic("palette")}Mentores do lazer<small>um para cada tema, do básico ao avançado</small></div>
    <div class="jmgrid">${LZ_MIDS.map(mid => { const def = MENTOR_DEF[mid]; return `<a class="jmc" href="#lazer.${def.lz}" style="--c:${mcol(mid)}">${mavatar(mid)}<span><b>${esc(def.nome)}</b><small>${esc(lzDiv(def.lz).nome)}</small><em>${esc(def.arq)}</em></span></a>`; }).join("")}</div>
    <div class="mhead jmh2">${ic("lotus")}Mentores da vida interior<small>um para cada pilar, o Navegante da Bússola, o Mestre do Pórtico e o Terapeuta</small></div>
    <div class="jmgrid">${[...J_MIDS, "sto", "psi"].map(mid => { const def = MENTOR_DEF[mid], m = mget(mid), pid = jMidP(mid); return `<a class="jmc" href="#${mid === "psi" ? "psi.terapeuta" : "jornada." + jSubOfMid(mid)}" style="--c:${mcol(mid)}">${mavatar(mid)}<span><b>${esc(def.nome)}</b><small>${pid ? esc(J_PIL[pid].nome) : mid === "sto" ? "Filosofia · estoicismo" : mid === "psi" ? "Psicologia" : "Bússola moral"}</small><em>${m.plano ? esc(trunc(m.plano.foco, 60)) : m.conversa?.length ? `conversaram ${relDay(iso(new Date(m.conversa.at(-1).at)))}` : esc(def.papel)}</em></span></a>`; }).join("")}</div>`;
}
function aiBanner() {
  if (AI_OFF) return `<div class="banner warn">${ic("info")}<span>${esc(AI_OFF)}</span></div>`;
  if (!SAMPLE && LOADED) return `<div class="banner">${ic("info")}<span>Os mentores usam a IA do Claude, que não respondeu nesta visualização. Memória, planos e propostas continuam visíveis e editáveis.</span></div>`;
  return "";
}
function pMentor(R) {
  const mid = SUB, def = MENTOR_DEF[mid], m = mget(mid), L = MST.live?.mid === mid ? MST.live : null, sc = areaScoreNow(mid), sl = sinceLast(mid);
  const A = def.area ? R.areas.find(x => x.a === def.area) : null, H = history(6);
  const ser = H.map(h => def.area ? h.areas.find(x => x.a === def.area)?.dados : h.indice == null ? null : h.indice / 10);
  const metas = def.area ? R.metas.filter(x => x.area === def.area && x.ativa && x.rt !== "Concluída") : R.metas.filter(x => x.ativa && x.st === "crit");
  const habs = def.area ? R.hab.filter(h => h.area === def.area) : [];
  const ins = insights(R, H).filter(i => !def.area || i.area === def.area).slice(0, 3);
  let lastDay = "";
  const msgs = (m.conversa || []).map((x, i) => { const d = iso(new Date(x.at)), sep = d !== lastDay ? `<div class="daysep"><span>${relDay(d) === "hoje" ? "Hoje" : fmtDL(d)}</span></div>` : ""; lastDay = d;
    return sep + (x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content).replace(/\n/g, "<br>")}</div></div>` : `<div class="msg ai">${mavatar(mid, "sm")}<div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}${(x.acoes || []).map(p => propHTML(mid, i, p)).join("")}</div></div>`); }).join("");
  const live = L ? `${L.user ? `<div class="msg me"><div class="bub">${esc(L.user.content).replace(/\n/g, "<br>")}</div></div>` : ""}<div class="msg ai" id="livebubble">${mavatar(mid, "sm")}<div class="bub"><div class="lb-text mdx">${L.text ? md(liveText(L.text)) : `<div class="thinking">${ic("spark")}Pensando…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div><div class="lb-acoes">${L.acoes.map(p => propHTML(mid, -1, p)).join("")}</div></div></div>` : "";
  const intro = !m.conversa?.length && !L ? `<div class="mintro">${mavatar(mid, "lg")}<h3>${esc(def.nome)}</h3><p>${esc(def.papel[0].toUpperCase() + def.papel.slice(1))}. Foco em ${esc(def.foco)}.</p><p class="muted">Ele lê seus números, metas, hábitos e o que você escreve no diário${def.area ? ` sobre ${esc(ashort(def.area))}` : ""}. O que vocês combinarem fica guardado na memória ao lado.</p></div>` : "";
  const memF = MST.memF, mems = [...(m.mem || [])].sort((a, b) => (b.fixo - a.fixo) || b.at - a.at).filter(x => memF === "todos" || x.tipo === memF);
  const tipos = ["todos", ...new Set((m.mem || []).map(x => x.tipo))];
  const ai = !!SAMPLE && !AI_OFF;
  return `${aiBanner()}<div class="mroom" style="--c:${mcol(mid)}">
    <aside class="mprof pn">${mavatar(mid, "lg")}<h2>${esc(def.nome)}</h2><p class="muted">${def.area ? esc(alabel(def.area)) : "Todas as áreas"}</p>
      <div class="mscore">${ring(sc == null ? 0 : sc / 10, mcol(mid), 88, 9)}<div><b>${sc == null ? "–" : num(sc)}</b><small>placar de dados</small>${A?.perc != null ? `<small>você se dá ${A.perc} · alvo ${A.alvo ?? "–"}</small>` : ""}</div></div>
      <div class="mspark">${spark(ser, mcol(mid), { min: 0, max: 10 })}</div>
      ${sl.out.length ? `<div class="since"><span class="flbl">Desde a última conversa</span><ul>${sl.out.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${metas.length ? `<div class="flbl">Metas</div>${metas.slice(0, 5).map(x => `<button type="button" class="mrow" data-ent="meta|${x.id}"><span>${esc(trunc(x.meta, 42))}</span>${pill(x.st, pct(x.prog))}</button>`).join("")}` : ""}
      ${habs.length ? `<div class="flbl">Hábitos</div>${habs.map(h => `<div class="mrow"><span>${esc(h.nome)}</span>${pill(h.st, h.pm == null ? "–" : pct(h.pm))}</div>`).join("")}` : ""}
      ${ins.length ? `<div class="flbl">O que os dados dizem</div>${ins.map(i => `<div class="insight ${i.st}"><div class="ik">${esc(i.k)}</div><p>${i.t}</p></div>`).join("")}` : ""}
      <div class="row wrap" style="margin-top:12px"><button type="button" class="btn sm" data-act="mcheck"${ai && !MST.live ? "" : " disabled"}>${ic("refresh")}Acompanhamento ${mid === "conselho" ? "semanal" : "da área"}</button>${m.conversa?.length ? `<button type="button" class="btn sm ghost" data-act="mclear">${ic("trash")}Limpar conversa</button>` : ""}</div></aside>
    <section class="mchatw pn"><div class="mchat" id="mchat" aria-live="polite">${intro}${msgs}${live}</div>
      <div class="mquick">${(QUICK[mid] || []).concat(mid === "conselho" ? [] : ["Que experimento novo eu poderia testar?", "Revise meu plano"]).map(q => `<button type="button" class="qchip" data-mq="${esc(q)}"${ai && !MST.live ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>
      <div class="minput"><textarea id="m_in" rows="2" placeholder="${ai ? `Escreva para o ${esc(def.nome)}… (Enter envia, Shift+Enter quebra linha)` : "A IA não está disponível nesta visualização"}"${ai ? "" : " disabled"} aria-label="Mensagem para o mentor">${esc(MST.input[mid] || "")}</textarea>${MST.live ? `<button type="button" class="btn" data-act="mstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn primary" data-act="msend"${ai ? "" : " disabled"}>${ic("send")}Enviar</button>`}</div></section>
    <aside class="mside">
      ${panel(`${ic("flag")}Plano`, m.plano ? `<div class="pfoc">${esc(m.plano.foco)}</div><div class="psteps">${m.plano.passos.map(p => `<div class="pstep${p.feito ? " done" : ""}"><label class="ckl"><input type="checkbox" data-pstep="${mid}|${p.id}"${p.feito ? " checked" : ""}><span>${esc(p.texto)}</span></label><div class="pmeta">${p.prazo ? `<span class="${!p.feito && p.prazo < TODAY ? "st-crit" : "muted"}">${relDay(p.prazo)}</span>` : ""}${p.tarefaId ? `<button type="button" class="lnk" data-ent="tar|${p.tarefaId}">tarefa</button>` : `<button type="button" class="lnk" data-ptask="${mid}|${p.id}">virar tarefa</button>`}</div></div>`).join("")}</div><div class="muted small">Atualizado ${relDay(iso(new Date(m.plano.at)))}</div>
        <div class="row wrap"><button type="button" class="btn sm ghost" data-act="mplannotion">${ic("upload")}Enviar ao Notion</button></div>` : `<div class="empty">Sem plano ainda. Peça um “Acompanhamento” e o mentor monta um com você.</div>`)}
      ${panel(`${ic("memory")}Memória <small>${(m.mem || []).length}</small>`, `<div class="segs">${tipos.map(t => `<button type="button" class="seg" data-memf="${esc(t)}" aria-pressed="${memF === t}">${esc(t)}</button>`).join("")}</div>
        <div class="mems">${mems.map(x => `<div class="mem${x.fixo ? " fixo" : ""}"><span class="mtag t-${slug(x.tipo)}">${esc(x.tipo)}</span><p>${esc(x.texto)}</p><div class="mmeta"><span>${fmtD(iso(new Date(x.at)))}${x.origem && x.origem !== "mentor" ? " · " + esc(x.origem) : ""}</span><button type="button" class="vb" data-mpin="${mid}|${x.id}" title="${x.fixo ? "Desafixar" : "Fixar"}" aria-label="${x.fixo ? "Desafixar" : "Fixar"}">${ic("pin")}</button><button type="button" class="vb" data-mdel="${mid}|${x.id}" title="Esquecer" aria-label="Esquecer">${ic("trash")}</button></div></div>`).join("") || `<div class="empty">Nada guardado ainda.</div>`}</div>
        <div class="memadd"><input id="memnew" type="text" placeholder="Anote algo para o mentor lembrar" value="${esc(MST.memNew)}" aria-label="Nova memória"><button type="button" class="btn sm" data-act="memadd">${ic("plus")}Guardar</button></div>`)}</aside></div>`;
}
function mentorClick(t) {
  const ds = t.dataset, mid = t.closest("[data-mid]")?.dataset.mid || SUB;
  if (ds.act === "msend") { const v = $("#m_in")?.value || ""; askMentor(mid, v); return true; }
  if (ds.act === "mstop") { MST.live?.ctl.abort(); return true; }
  if (ds.act === "mcheck") { askMentor(mid, mid === "conselho" ? "Faça a revisão semanal do Conselho: 1) leitura do momento em 3 linhas com números; 2) áreas que avançaram e as que ficaram para trás desde a última conversa; 3) conflitos entre áreas (tempo, energia, dinheiro); 4) as 3 prioridades da semana e o que pausar; 5) uma ideia nova para a semana. Atualize o plano com as prioridades, deixe recados aos mentores das áreas envolvidas e guarde só o essencial." : "Faça o acompanhamento desta área agora: 1) diagnóstico em 3 linhas com números; 2) o que melhorou e o que piorou desde a última conversa; 3) riscos; 4) até 3 melhorias concretas e 1 experimento novo adaptado ao meu cenário. Depois atualize o plano e guarde na memória só o essencial.", "check"); return true; }
  if (ds.act === "mclear") { if (!t.dataset.c) { t.dataset.c = 1; t.innerHTML = ic("trash") + "Confirmar: limpar"; return true; } mstate(mid).conversa = []; touch("mentores", { label: "Conversa limpa" }); undoToast("Conversa limpa (a memória continua)"); return true; }
  if (ds.mq) { askMentor(mid, ds.mq); return true; }
  if (ds.prop) { const [m, mi, pid, d] = ds.prop.split("|"); decideProposal(m, +mi, pid, d === "ok"); return true; }
  if (ds.pstep) { const [m, id] = ds.pstep.split("|"), p = mstate(m).plano?.passos.find(x => x.id === id); if (p) { p.feito = !p.feito; touch("mentores", { label: p.feito ? "Passo feito" : "Passo reaberto" }); } return true; }
  if (ds.ptask) { const [m, id] = ds.ptask.split("|"), p = mstate(m).plano?.passos.find(x => x.id === id); if (p) { const tid = uid(); S.tarefas.push({ id: tid, tarefa: p.texto, projeto: "", area: MENTOR_DEF[m].area || "", prio: "Média", prazo: p.prazo, status: "A fazer", concluida: "", meta: "", origem: MENTOR_DEF[m].nome }); p.tarefaId = tid; touch("tarefas", "mentores", { label: "Passo virou tarefa" }); undoToast("Tarefa criada a partir do plano"); } return true; }
  if (ds.memf) { MST.memF = ds.memf; render(); return true; }
  if (ds.mpin) { const [m, id] = ds.mpin.split("|"), x = mstate(m).mem.find(z => z.id === id); if (x) { x.fixo = !x.fixo; touch("mentores", { label: "Memória fixada" }); } return true; }
  if (ds.mdel) { const [m, id] = ds.mdel.split("|"); mstate(m).mem = mstate(m).mem.filter(z => z.id !== id); touch("mentores", { label: "Memória apagada" }); undoToast("Memória apagada"); return true; }
  if (ds.act === "memadd") { const v = ($("#memnew")?.value || "").trim(); if (!v) return true; addMemory(mid, { tipo: "fato", texto: v, origem: "você" }); MST.memNew = ""; touch("mentores", { label: "Memória adicionada" }); return true; }
  if (ds.act === "mplannotion") { const m = mget(mid); if (m.plano) notionCreate(`Plano · ${MENTOR_DEF[mid].nome} · ${fmtDY(TODAY)}`, `**Foco:** ${m.plano.foco}\n\n${m.plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${fmtDY(p.prazo)})` : ""}`).join("\n")}\n\n## Memória\n${m.mem.filter(x => x.fixo).concat(m.mem.filter(x => !x.fixo).slice(-8)).map(x => `- **${x.tipo}:** ${x.texto}`).join("\n")}`); return true; }
  return false;
}
