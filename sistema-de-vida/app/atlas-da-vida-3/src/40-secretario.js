/* ================================================================ Secretário da Vida: o gerente central, numa janela flutuante
   Fica fora do conteúdo que o render redesenha (#sec no body): movível pelo cabeçalho, redimensionável pelo canto, lembra
   posição e tamanho neste aparelho. Quatro partes:
   - Agora: a visão consolidada, calculada aqui mesmo (sem IA), a partir de todas as abas: tarefas, contas, documentos, casa,
     hábitos, rotina, exame da noite, radar (orçamento, humor, metas, sequências), pessoas, idiomas e o jardim.
   - Para decidir: conflitos entre áreas (bloco da rotina × agenda, dia sobrecarregado, prioridades altas atrasadas);
     o Secretário não escolhe, só apresenta as opções.
   - Lembretes: criados por texto ou voz (“me lembre de ligar para a mãe amanhã às 18h”); avisam dentro do Atlas na hora.
   - Conversa: o Claude com ferramentas para ver qualquer aba, consultar os mentores (só para coletar informação), propor
     ações e levantar conflitos. Nada vira registro sem a pessoa confirmar; tudo passa pelo registro de Privacidade.
   Modos (perfis de imposição, editáveis): Enfoque, Ação, Reflexão e Relaxo mudam o tom, o que aparece e a proatividade.
   Dados: secretario = { modo, perfis, conversa, lembretes: [{id, texto, quando, feito, avisado}], decisoes: [{id, chave, escolha, data}], tts }. */
const SEC = { open: false, tab: "agora", input: "", live: null, ouvindo: false, nudge: null, cfg: false, conf: {}, rec: null };
const SEC_MODOS = {
  enfoque: { nome: "Enfoque", ico: "target", desc: "Só o que importa hoje, uma coisa por vez.", tom: "curto e firme; uma coisa por vez; diga o que pode esperar e corte distrações", pro: "media", mostra: "hoje" },
  acao: { nome: "Ação", ico: "bolt", desc: "Tudo o que está pendente, com botões para resolver.", tom: "direto e cobrador, no imperativo; prazos, números e o próximo passo concreto", pro: "alta", mostra: "todos" },
  reflexao: { nome: "Reflexão", ico: "moon", desc: "Padrões da semana e boas perguntas, sem cobrança.", tom: "calmo e curioso; perguntas abertas e padrões; não cobre prazos", pro: "baixa", mostra: "padroes" },
  relaxo: { nome: "Relaxo", ico: "coffee", desc: "Só o crítico. O resto espera.", tom: "leve e gentil; mencione só o que é crítico e incentive o descanso", pro: "minima", mostra: "criticos" } };
const SEC_PRO = { alta: "avisa o crítico e o importante", media: "avisa só o crítico", baixa: "não interrompe; mostra o número no botão", minima: "só os seus lembretes" };
const SEC_MOSTRA = { todos: "tudo o que está pendente", hoje: "as 3 coisas mais importantes", padroes: "padrões e perguntas", criticos: "só o crítico" };
const secData = () => { const d = (S.secretario ||= {}); d.modo ||= "acao"; d.perfis ||= {}; d.conversa ||= []; d.lembretes ||= []; d.decisoes ||= []; return d; };
const secPerfil = (m = secData().modo) => ({ ...SEC_MODOS[m], ...(secData().perfis[m] || {}) });
const secLS = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem("atlas_sec_" + k) || "null"); localStorage.setItem("atlas_sec_" + k, JSON.stringify(v)); } catch { return null; } };
const nowHMs = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const secNowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

/* ---------------------------------------------------------------- a visão consolidada (local, sem IA) */
function secItems() {
  const out = [], add = (o) => out.push({ st: "info", acts: [], ...o }), d = TODAY, h = secNowMin() / 60, R = calcAt(mkey(TODAY));
  const open = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo);
  for (const t of open.filter(t => t.prazo < d).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 6)) add({ id: "tar:" + t.id, area: t.area || "Tarefas", st: "crit", txt: t.tarefa, sub: `atrasada desde ${fmtD(t.prazo)}${t.prio === "Alta" ? " · prioridade alta" : ""}`, go: "metas.tarefas", acts: [["Concluí", `tdone|${t.id}`], ["Adiar para amanhã", `tadiar|${t.id}`]] });
  for (const t of open.filter(t => t.prazo === d)) add({ id: "tar:" + t.id, area: t.area || "Tarefas", st: "warn", txt: t.tarefa, sub: `vence hoje${t.prio === "Alta" ? " · prioridade alta" : ""}`, go: "metas.tarefas", acts: [["Concluí", `tdone|${t.id}`], ["Adiar para amanhã", `tadiar|${t.id}`]] });
  const CD = pdCasaDia(d);
  for (const { c, v } of CD.contas) add({ id: `conta:${c.id}|${v}`, area: "Casa & organização", st: v < d ? "crit" : "warn", txt: `Conta: ${c.conta} · ${eur(+c.valor || 0, 2)}`, sub: v < d ? `venceu ${fmtD(v)}` : v === d ? "vence hoje" : `vence ${fmtD(v)}`, go: "casa.contas", acts: [["Paguei", `conta|${c.id}|${v}`, true]] });
  for (const x of (S.docs || []).filter(x => x.validade && diff(x.validade, d) <= (+S.cfg.alertaDocs || 30))) { const n = diff(x.validade, d); add({ id: "doc:" + x.id, area: "Casa & organização", st: n < 0 ? "crit" : "warn", txt: `Documento: ${x.doc || x.nome || x.tipo || "documento"}`, sub: n < 0 ? `venceu ${fmtD(x.validade)}` : `vence em ${plural(n, "dia", "dias")}`, go: "casa.docs" }); }
  if (CD.rot.length) add({ id: "casa:rot", area: "Casa & organização", st: "info", txt: `Casa: ${plural(CD.rot.length, "rotina pendente", "rotinas pendentes")}`, sub: CD.rot.slice(0, 3).map(r => r.rotina).join(", "), go: "casa.limpeza" });
  for (const a of radarAlerts().slice(0, 5)) add({ id: "radar:" + a.key, area: a.area || "Radar", st: a.st === "crit" ? "crit" : "warn", txt: a.titulo, sub: String(a.texto || "").replace(/<[^>]+>/g, ""), go: a.acao?.[1] || "radar" });
  const hs = S.habitos, hd = hs.filter(x => S.marks[`${x.id}|${d}`]).length;
  if (hs.length && hd < hs.length) add({ id: "hab", area: "Hábitos", st: h >= 19 ? "warn" : "info", txt: `Hábitos: ${hd} de ${hs.length} hoje`, sub: "faltam " + hs.filter(x => !S.marks[`${x.id}|${d}`]).slice(0, 4).map(x => x.nome).join(", "), go: "hab.marcar" });
  const occ = rtOcc(d), nm = secNowMin(), cur = occ.find(b => b.a <= nm && b.z > nm), nx = occ.filter(b => b.a > nm).sort((a, b) => a.a - b.a)[0];
  if (cur) add({ id: "rt:cur", area: "Rotina", st: "info", txt: `Agora: ${cur.titulo}`, sub: `até ${cur.fim}${nx ? ` · depois: ${nx.titulo} às ${nx.ini}` : ""}`, go: "rotina.dia" });
  else if (nx) add({ id: "rt:nx", area: "Rotina", st: "info", txt: `Próximo bloco: ${nx.titulo}`, sub: `às ${nx.ini}`, go: "rotina.dia" });
  if (h >= 19 && !bmEx()[d]) add({ id: "exame", area: "Propósito & espiritualidade", st: "warn", txt: "Exame da noite ainda não feito", sub: "5 minutos; faz o rio do jardim correr", go: "jornada.exame" });
  if (h >= 20 && !isNum(S.saude[d]?.humor)) add({ id: "painel", area: "Saúde mental", st: "info", txt: "Conte o dia no Painel", sub: "o roteiro de áudio leva uns 3 minutos", go: "painel" });
  for (const p of R.pes.filter(p => p.faltam != null && p.faltam >= 0 && p.faltam <= 7)) add({ id: "aniv:" + p.id, area: "Família", st: p.faltam <= 1 ? "warn" : "info", txt: `Aniversário de ${p.nome}`, sub: p.faltam === 0 ? "é hoje" : p.faltam === 1 ? "amanhã" : `em ${p.faltam} dias`, go: "pessoas.lista" });
  const late = R.pes.filter(p => p.st === "crit" && +p.freq).sort((a, b) => b.ratio - a.ratio)[0];
  if (late) add({ id: "pes:" + late.id, area: "Família", st: "info", txt: `Falar com ${late.nome}`, sub: late.txt || "contato atrasado", go: "pessoas.lista" });
  for (const l of secData().lembretes.filter(l => !l.feito && l.quando && l.quando.slice(0, 10) <= d)) { const past = new Date(l.quando) <= new Date(); add({ id: "lem:" + l.id, area: "Lembretes", st: past ? "crit" : "warn", txt: l.texto, sub: `${past ? "era para" : "hoje às"} ${l.quando.slice(11, 16)}${l.quando.slice(0, 10) < d ? ` de ${fmtD(l.quando.slice(0, 10))}` : ""}`, acts: [["Feito", `lemok|${l.id}`]], go: null }); }
  try { const a = jdAsks()[0]; if (a) add({ id: "jd:" + a[3], area: "Propósito & espiritualidade", st: "info", txt: `Jardim: ${a[1]}`, sub: a[2], go: "jornada.jardim" }); } catch {}
  const rk = { crit: 0, warn: 1, info: 2 };
  return out.sort((a, b) => rk[a.st] - rk[b.st]);
}
function secConflitos() {
  const d = TODAY, out = [], dec = new Set(secData().decisoes.filter(x => x.data === d).map(x => x.chave)), D = rtDia(d);
  for (const [bk, ev] of D.conf || []) { const k = `conf:${bk?.id}:${ev?.titulo || ""}`;
    out.push({ chave: k, txt: `O bloco “${bk?.titulo || "da rotina"}” (${bk?.ini || ""}) bate com “${ev?.titulo || "um compromisso"}”`, sub: "Um dos dois precisa mudar de horário, ou você assume a sobreposição.", ops: [["Abrir a Rotina para mover", "go:rotina.dia"], ["Manter os dois", "ok"]] }); }
  const hoje = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo <= d), livre = D.livre || 0;
  if (hoje.length >= 4 && hoje.length * 45 > livre) out.push({ chave: "sobrecarga:" + d, txt: `${plural(hoje.length, "tarefa vence", "tarefas vencem")} até hoje e há ${num(livre / 60, 1)} h livres na rotina`, sub: "Não cabe tudo. Decida o que sai hoje.", ops: [["Adiar as de prioridade baixa e média para amanhã", "adiar_baixas"], ["Manter tudo", "ok"], ["Ver as tarefas", "go:metas.tarefas"]] });
  const altas = hoje.filter(t => t.prio === "Alta" && t.prazo < d);
  if (altas.length >= 3) out.push({ chave: "altas:" + d, txt: `${altas.length} tarefas de prioridade alta estão atrasadas`, sub: "Quando tudo é prioridade, nada é. Qual delas vem primeiro?", ops: [...altas.slice(0, 3).map(t => [`Primeiro: ${trunc(t.tarefa, 40)}`, "first:" + t.id]), ["Pedir ajuda ao Secretário", "ask"]] });
  return out.filter(c => !dec.has(c.chave));
}
function secPadroes() {
  const D = DAILY(), d = TODAY, av = (k, a, b) => { const v = []; for (let i = a; i <= b; i++) { const j = D.idx[addDays(d, -i)], x = j != null ? D.C[k]?.[j] : null; if (isNum(x)) v.push(+x); } return v.length ? avg(v) : null; };
  const L = [], hm = av("bem", 0, 6), hm0 = av("bem", 7, 13), sn = av("sono", 0, 6), ex = Array.from({ length: 7 }, (_, i) => addDays(d, -i)).filter(x => bmEx()[x]).length;
  if (hm != null) L.push(`Humor médio na semana: ${num(hm, 1)}${hm0 != null ? ` (antes: ${num(hm0, 1)})` : ""}`);
  if (sn != null) L.push(`Sono médio: ${num(sn, 1)} h`);
  const hs = S.habitos.length; if (hs) { let k = 0; for (let i = 0; i < 7; i++) k += S.habitos.filter(x => S.marks[`${x.id}|${addDays(d, -i)}`]).length; L.push(`Hábitos na semana: ${pct(k / (hs * 7))}`); }
  L.push(`Exames da noite: ${ex} de 7`);
  return { L, perg: [jQuestion(jDayPillar()), bmDayValue().perg, "O que você pode deixar de carregar esta semana?"] };
}

/* ---------------------------------------------------------------- lembretes: “me lembre de X amanhã às 18h” */
const SEC_DOW = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
function secParseLembrete(txt) {
  let F = fold(txt), t = String(txt), when = null, day = null, hm = null;
  const m1 = F.match(/\bem\s+(\d+|meia|uma|um)\s*(min|minutos?|h|horas?)\b/);
  if (m1) { const n = m1[1] === "meia" ? 30 : /^um/.test(m1[1]) ? 1 : +m1[1], ms = /^m/.test(m1[2]) ? n * 60e3 : (m1[1] === "meia" ? 30 * 60e3 : n * 3600e3); when = new Date(Date.now() + ms); }
  if (!when) {
    if (/\bdepois de amanha\b/.test(F)) day = addDays(TODAY, 2); else if (/\bamanha\b/.test(F)) day = addDays(TODAY, 1); else if (/\bhoje\b/.test(F)) day = TODAY;
    const dm = F.match(/\bdia\s+(\d{1,2})(?:\/(\d{1,2}))?\b/); if (dm) { const y = +TODAY.slice(0, 4), mo = dm[2] ? +dm[2] : +TODAY.slice(5, 7); let c = `${y}-${pad(mo)}-${pad(+dm[1])}`; if (c < TODAY) c = dm[2] ? `${y + 1}-${pad(mo)}-${pad(+dm[1])}` : addMonth(c.slice(0, 7), 1) + "-" + pad(+dm[1]); day = c; }
    const wd = SEC_DOW.findIndex(w => new RegExp(`\\b${w}(-feira)?\\b`).test(F)); if (!day && wd >= 0) { let k = (wd - parse(TODAY).getDay() + 7) % 7 || 7; day = addDays(TODAY, k); }
    const tm = F.match(/\b(?:as|a|ao)\s+(\d{1,2})(?:[:h](\d{2}))?\s*(?:h|horas)?\b/) || F.match(/\b(\d{1,2})[:h](\d{2})\b/) || F.match(/\b(\d{1,2})\s*h\b/);
    if (/\bmeio[- ]dia\b/.test(F)) hm = [12, 0]; else if (tm) hm = [+tm[1], +(tm[2] || 0)];
    if (hm && hm[0] > 23) hm = null;
    if (day || hm) { day ||= TODAY; hm ||= [9, 0]; if (day === TODAY && hm[0] * 60 + hm[1] <= secNowMin() && !/\bhoje\b/.test(F)) day = addDays(TODAY, 1); when = new Date(`${day}T${pad(hm[0])}:${pad(hm[1])}:00`); }
  }
  /* \b do JS não conhece ã/à; as fronteiras aqui são "não letra, não dígito" */
  const W = re => new RegExp(`(?<![\\p{L}\\d])(?:${re})(?![\\p{L}\\d])`, "giu");
  t = t.replace(/^\s*(?:secret[aá]rio,?\s*)?(?:me\s+)?(?:(?:cria(?:r)?\s+(?:um\s+)?)?lembrete|lembr[ae]r?(?:-me)?(?![\p{L}]))\s*(?:de|para|que)?\s*/iu, "")
    .replace(W("em\\s+(?:\\d+|meia|uma|um)\\s*(?:min|minutos?|h|horas?)"), "").replace(W("depois de amanhã|depois de amanha|amanhã|amanha|hoje"), "").replace(W("dia\\s+\\d{1,2}(?:/\\d{1,2})?"), "")
    .replace(W(`(?:(?:na|no)\\s+)?(?:domingo|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado)(?:-feira)?`), "").replace(W("(?:às|as|ao|à|a)\\s+\\d{1,2}(?:[:h]\\d{2})?\\s*(?:h|horas)?"), "").replace(W("\\d{1,2}[:h]\\d{2}"), "").replace(W("(?:(?:ao|à|a)\\s+)?meio[- ]dia"), "").replace(/\s{2,}/g, " ").replace(/[\s,.;]+$/, "").trim();
  if (!t) return null;
  const quando = when ? `${iso(when)}T${pad(when.getHours())}:${pad(when.getMinutes())}` : "";
  return { texto: t[0].toUpperCase() + t.slice(1), quando };
}
function secLembrar(l) { secData().lembretes.push({ id: uid(), texto: l.texto.slice(0, 200), quando: l.quando, feito: false, avisado: false, at: Date.now(), origem: l.origem || "você" }); touch("secretario", { label: "Lembrete criado" }); }
function secTick() {
  if (!LOADED) return; const L = secData().lembretes, now = new Date(), due = L.filter(l => !l.feito && !l.avisado && l.quando && new Date(l.quando) <= now);
  if (due.length) { for (const l of due) l.avisado = true; touch("secretario", { noUndo: true, noRender: true }); SEC.nudge = { txt: due.length === 1 ? `Lembrete: ${due[0].texto}` : `${due.length} lembretes agora`, crit: true, at: Date.now() }; SEC.tab = "lembretes"; SEC.open = true; secLS("open", true); toast(SEC.nudge.txt); secPaint(); return; }
  /* proatividade: avisa uma vez por dia o que é novo, conforme o perfil */
  const pf = secPerfil(); if (SEC.open || pf.pro === "baixa" || pf.pro === "minima") { secFab(); return; }
  const seen = secLS("seen") || {}, day = seen[TODAY] || [], its = secItems().filter(i => i.st === "crit" || (pf.pro === "alta" && i.st === "warn")).filter(i => !day.includes(i.id));
  if (its.length) { SEC.nudge = { txt: its.length === 1 ? its[0].txt : `${plural(its.length, "coisa pede", "coisas pedem")} atenção`, crit: its.some(i => i.st === "crit"), at: Date.now() }; secLS("seen", { [TODAY]: [...day, ...its.map(i => i.id)] }); }
  secFab();
}

/* ---------------------------------------------------------------- conversa com o Claude */
const SEC_ABAS = { saude: ["Saúde física", "Saúde mental"], financas: ["Finanças"], carreira: ["Carreira"], aprendizado: ["Aprendizado"], relacoes: ["Família", "Amor & parceria", "Amizades & social"], lazer: ["Lazer & criatividade"], proposito: ["Propósito & espiritualidade"], casa: ["Casa & organização"] };
function secAbaFacts(aba, ctx) {
  const Hs = []; for (let k = 5; k >= 0; k--) Hs.push(calcAt(addMonth(mkey(TODAY), -k)));
  if (SEC_ABAS[aba]) return SEC_ABAS[aba].map(a => aiAreaOk(a) ? `## ${a}\n${areaFacts(a, Hs).join("\n")}` : `## ${a}\nsetor privado: a pessoa escolheu não compartilhar com a IA`).join("\n\n");
  if (aba === "tarefas") return S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && aiAreaOk(t.area)).sort((a, b) => (a.prazo || "9").localeCompare(b.prazo || "9")).slice(0, 40).map(t => `- [${t.id}] ${t.tarefa} · ${t.prio || "Média"}${t.prazo ? " · prazo " + t.prazo : ""}${t.area ? " · " + t.area : ""}`).join("\n") || "nenhuma tarefa aberta";
  if (aba === "rotina") return [TODAY, addDays(TODAY, 1)].map(dd => { const X = rtDia(dd); return `${dd}: ${rtOcc(dd).map(b => `${b.ini}–${b.fim} ${b.titulo}${b.st ? " (" + b.st + ")" : ""}`).join("; ") || "sem blocos"}. Livre: ${num((X.livre || 0) / 60, 1)} h. Conflitos: ${(X.conf || []).length}.`; }).join("\n");
  if (aba === "jornada") return aiAreaOk("Propósito & espiritualidade") ? [...J_ORDER.map(p => jPilarFacts(p, false).slice(0, 4).join(" ")), `Bússola: prática ${bmScores(28).idx == null ? "sem exames" : pct(bmScores(28).idx)} em 4 semanas; exames em 7 dias: ${Array.from({ length: 7 }, (_, i) => addDays(TODAY, -i)).filter(x => bmEx()[x]).length}.`].join("\n") : "setor privado";
  if (aba === "lembretes") return secData().lembretes.filter(l => !l.feito).map(l => `- ${l.quando || "sem hora"} · ${l.texto}`).join("\n") || "nenhum lembrete pendente";
  if (aba === "agora") return secItems().filter(i => aiAreaOk(i.area)).map(i => `- [${i.st}] ${i.area}: ${i.txt} (${i.sub})`).join("\n");
  return "aba desconhecida";
}
function secPrompt() {
  const pf = secPerfil(), Hs = []; for (let k = 5; k >= 0; k--) Hs.push(calcAt(addMonth(mkey(TODAY), -k)));
  const its = secItems().filter(i => aiAreaOk(i.area)).map(i => `- [${i.st}] ${i.area}: ${i.txt} (${i.sub})`), cf = secConflitos().map(c => `- ${c.txt}`), dec = secData().decisoes.slice(-8).map(x => `- ${x.data}: ${x.txt || x.chave} → ${x.escolha}`);
  return `Você é o Secretário da Vida, o secretário executivo de ${S.cfg.nome || "a pessoa"} dentro do app pessoal "Atlas da Vida". Você é o gerente central: organiza tarefas, gere prazos, lembra o que precisa ser feito, dá a informação crítica na hora certa e mantém tudo em movimento. Forte, confiável, incansável. Escreva em português do Brasil.
MODO ATUAL: ${pf.nome} (${pf.desc}). Tom: ${pf.tom}. Mostre: ${SEC_MOSTRA[pf.mostra] || pf.mostra}.
Regras:
- Baseie-se nos dados; cite números, datas e nomes. Nunca invente. Se faltar dado, diga o que registrar e em qual aba.
- Seja breve e escaneável (até ~150 palavras, salvo pedido), com no máximo 3 próximos passos.
- Nada acontece sem confirmação: para criar, concluir, adiar ou agendar algo, use "propor" (a pessoa confirma no cartão). Nunca diga que fez algo que só propôs.
- Mentores: use "consultar_mentor" só para coletar informação sobre progresso, bloqueios e oportunidades de uma área. Os mentores não decidem nada e você não decide por eles.
- Se houver prioridades conflitantes ou ambiguidade entre áreas (tempo, dinheiro, energia), NÃO escolha: use "levantar_conflito" com 2 a 4 opções claras e espere a decisão.
- Use "ver_aba" para detalhes de uma área antes de afirmar algo sobre ela. Respeite setores privados.

AGORA (${fmtDL(TODAY)}, ${nowHMs()}):
${its.join("\n") || "nada pendente"}
${cf.length ? `\nCONFLITOS ABERTOS:\n${cf.join("\n")}` : ""}
${dec.length ? `\nDECISÕES RECENTES DA PESSOA:\n${dec.join("\n")}` : ""}

VISÃO GERAL DA VIDA:
${councilFacts(Hs).join("\n")}`.slice(0, 110000);
}
function secTools(live) {
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); secPaintLive(); };
  const mids = MIDS.filter(m => !blockedMentor(m));
  return [
    { name: "ver_aba", description: "Lê o estado atual de uma aba do Atlas. Abas: agora (lista consolidada), tarefas, rotina, lembretes, saude, financas, carreira, aprendizado, relacoes, lazer, proposito, casa, jornada. Retorna texto com os dados.",
      inputSchema: { type: "object", properties: { aba: { type: "string", enum: ["agora", "tarefas", "rotina", "lembretes", ...Object.keys(SEC_ABAS), "jornada"] } }, required: ["aba"] },
      execute: inp => { const r = secAbaFacts(String(inp.aba), live.ctx); note("ver_aba", String(inp.aba)); return r; } },
    { name: "consultar_mentor", description: `Pede a um mentor especialista um relatório curto sobre a área dele: progresso, bloqueios e oportunidades. Só coleta informação; o mentor não decide nada. Mentores: ${mids.map(m => `${m} (${MENTOR_DEF[m].nome})`).join(", ")}. Retorna o texto do mentor.`,
      inputSchema: { type: "object", properties: { mentor: { type: "string", enum: mids }, pergunta: { type: "string" } }, required: ["mentor", "pergunta"] },
      execute: async (inp, ctx) => { const mid = String(inp.mentor); if (!MENTOR_DEF[mid] || blockedMentor(mid)) throw new Error("Mentor indisponível ou setor privado.");
        note("consultar_mentor", `${MENTOR_DEF[mid].nome}: ${trunc(inp.pergunta, 60)}`);
        const r = await aiCall(`${MENTOR_DEF[mid].nome} (consultado pelo Secretário)`, () => [{ role: "user", content: mentorPrompt(mid, false) + `\n\nO Secretário da Vida, que coordena o app, pede um relatório para a pessoa. Responda só com informação, em até 120 palavras: progresso, bloqueios e oportunidades, com números. Não proponha registros, não decida nada e não use ferramentas.` }, { role: "user", content: String(inp.pergunta).slice(0, 600) }], { signal: ctx?.signal || live.ctl.signal, modelTier: "quick", cache: true });
        return String(r.text || "").replace(/```atlas[\s\S]*?```/g, "").trim().slice(0, 2500); } },
    { name: "propor", description: "Propõe uma ação que a pessoa confirma ou descarta num cartão. Tipos: tarefa (titulo, prazo, prioridade), lembrete (titulo, quando AAAA-MM-DDTHH:MM), adiar (tarefa_id, prazo), concluir (tarefa_id), bloco (titulo, data, inicio HH:MM, fim HH:MM, categoria da rotina). Nada é feito sem confirmação.",
      inputSchema: { type: "object", properties: { tipo: { type: "string", enum: ["tarefa", "lembrete", "adiar", "concluir", "bloco"] }, titulo: { type: "string" }, prazo: { type: "string" }, prioridade: { type: "string", enum: ["Alta", "Média", "Baixa"] }, quando: { type: "string" }, tarefa_id: { type: "string" }, data: { type: "string" }, inicio: { type: "string" }, fim: { type: "string" }, categoria: { type: "string" }, motivo: { type: "string" } }, required: ["tipo"] },
      execute: inp => { const p = secMkProp(inp); if (p.erro) throw new Error(p.erro); live.acoes.push(p); note("propor", p.rotulo); return { ok: true, status: "aguardando confirmação da pessoa" }; } },
    { name: "levantar_conflito", description: "Leva à pessoa um conflito ou ambiguidade entre prioridades ou áreas, com 2 a 4 opções. Ela decide; você não escolhe. Retorna {ok}.",
      inputSchema: { type: "object", properties: { titulo: { type: "string" }, contexto: { type: "string" }, opcoes: { type: "array", items: { type: "string" } } }, required: ["titulo", "opcoes"] },
      execute: inp => { const ops = (inp.opcoes || []).map(String).filter(Boolean).slice(0, 4); if (ops.length < 2) throw new Error("Dê pelo menos 2 opções."); live.conflitos.push({ id: uid(), titulo: String(inp.titulo).slice(0, 200), contexto: String(inp.contexto || "").slice(0, 400), ops, escolha: null }); note("levantar_conflito", trunc(inp.titulo, 60)); return { ok: true, status: "aguardando decisão" }; } }];
}
function secMkProp(inp) {
  const tipo = String(inp.tipo), id = uid(), t = S.tarefas.find(x => x.id === inp.tarefa_id) || (inp.titulo && S.tarefas.find(x => x.status !== "Concluída" && norm(x.tarefa) === norm(inp.titulo)));
  if (tipo === "tarefa") return { id, tipo, titulo: String(inp.titulo || "").slice(0, 200), prazo: /^\d{4}-\d{2}-\d{2}$/.test(inp.prazo || "") ? inp.prazo : "", prio: ["Alta", "Média", "Baixa"].includes(inp.prioridade) ? inp.prioridade : "Média", motivo: inp.motivo || "", rotulo: `tarefa: ${trunc(inp.titulo, 60)}`, status: "pendente" };
  if (tipo === "lembrete") { const q = String(inp.quando || ""); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(q)) return { erro: "quando precisa ser AAAA-MM-DDTHH:MM" }; return { id, tipo, titulo: String(inp.titulo || "").slice(0, 200), quando: q.slice(0, 16), motivo: inp.motivo || "", rotulo: `lembrete: ${trunc(inp.titulo, 50)} · ${fmtD(q.slice(0, 10))} às ${q.slice(11, 16)}`, status: "pendente" }; }
  if (tipo === "adiar" || tipo === "concluir") { if (!t) return { erro: "Tarefa não encontrada; use o id de ver_aba(tarefas)." }; if (tipo === "adiar" && !/^\d{4}-\d{2}-\d{2}$/.test(inp.prazo || "")) return { erro: "prazo AAAA-MM-DD obrigatório" }; return { id, tipo, tid: t.id, titulo: t.tarefa, prazo: inp.prazo || "", motivo: inp.motivo || "", rotulo: `${tipo}: ${trunc(t.tarefa, 50)}`, status: "pendente" }; }
  if (tipo === "bloco") { const ok = /^\d{2}:\d{2}$/.test(inp.inicio || "") && /^\d{2}:\d{2}$/.test(inp.fim || "") && inp.fim > inp.inicio; if (!ok) return { erro: "inicio e fim HH:MM, fim depois do início" }; return { id, tipo, titulo: String(inp.titulo || "Bloco").slice(0, 80), data: /^\d{4}-\d{2}-\d{2}$/.test(inp.data || "") ? inp.data : TODAY, ini: inp.inicio, fim: inp.fim, cat: RT_CATS.some(c => c[0] === inp.categoria) ? inp.categoria : rtGuessCat(String(inp.titulo || "")), motivo: inp.motivo || "", rotulo: `bloco: ${trunc(inp.titulo, 40)} ${inp.inicio}–${inp.fim}`, status: "pendente" }; }
  return { erro: "tipo desconhecido" };
}
const rtGuessCat = t => (RT_KW.find(([rx]) => rx.test(t)) || [0, "Pessoal"])[1];
async function secAsk(text) {
  text = String(text || "").trim(); if (!text) return;
  const local = secLocal(text); if (local) return;
  const D = secData(), user = { role: "user", content: text, at: Date.now() };
  if (!SAMPLE) { D.conversa.push(user, { role: "assistant", local: true, content: `A IA não está disponível nesta visualização${AI_OFF ? ` (${AI_OFF})` : ""}. Sem ela eu ainda: mostro o **Agora** e o que **Para decidir**, crio **lembretes** (“me lembre de… amanhã às 9”), mudo de **modo** (“modo enfoque”) e abro abas (“abrir finanças”).`, at: Date.now() }); touch("secretario", { noUndo: true, noRender: true }); secPaint(); return; }
  if (SEC.live) { toast("Espere a resposta atual terminar ou toque em Parar."); return; }
  const live = SEC.live = { text: "", uso: [], acoes: [], conflitos: [], ctl: new AbortController(), user };
  SEC.input = ""; SEC.tab = "conversa"; secPaint();
  const hist = D.conversa.slice(-12).filter(x => !x.local).map(x => ({ role: x.role, content: x.role === "assistant" ? x.content + (x.acoes?.length ? `\n[propostas: ${x.acoes.map(a => `${a.rotulo} — ${a.status}`).join("; ")}]` : "") + (x.conflitos?.length ? `\n[conflitos: ${x.conflitos.map(c => `${c.titulo} — ${c.escolha ? "decidido: " + c.escolha : "sem decisão"}`).join("; ")}]` : "") : x.content })).filter(x => x.content.trim());
  try {
    const r = await aiCall("Secretário da Vida", ctx => { live.ctx = ctx; return [{ role: "user", content: secPrompt() }, ...hist, { role: "user", content: text }]; }, { signal: live.ctl.signal, modelTier: "default", cache: false, ...(TOOLS_MAX ? { tools: secTools(live) } : {}), onText: ({ text: t }) => { live.text = t; secPaintLive(); } });
    secFinish(r.text, r.truncated);
  } catch (e) { if (e?.text) secFinish(e.text, true); else { SEC.live = null; secPaint(); } if (e?.code !== "cancelled") aiError(e); }
}
function secFinish(text, cut) {
  const live = SEC.live; if (!live) return; const D = secData();
  D.conversa.push(live.user, { role: "assistant", content: (String(text || "").trim() || "(sem texto)") + (cut ? "\n\n_(resposta interrompida)_" : ""), at: Date.now(), uso: live.uso, acoes: live.acoes, conflitos: live.conflitos });
  if (D.conversa.length > 60) D.conversa = D.conversa.slice(-60);
  SEC.live = null; touch("secretario", { noUndo: true, noRender: true }); secPaint(); secSpeak(text);
}
function secSpeak(text) { if (!secData().tts || !window.speechSynthesis) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text || "").replace(/[*_#`>\[\]]/g, "").slice(0, 900)); u.lang = pdLang(); speechSynthesis.speak(u); } catch {} }
/* comandos que funcionam sem IA */
const SEC_GO = [[/financ|dinheiro|gasto/, "fin.lanc"], [/tarefa/, "metas.tarefas"], [/rotina|agenda/, "rotina.dia"], [/painel/, "painel"], [/jardim/, "jornada.jardim"], [/bussola|exame/, "jornada.exame"], [/jornada/, "jornada.inicio"], [/saude/, "saude.checkin"], [/habito/, "hab.marcar"], [/casa|conta|document/, "casa"], [/idioma|ingles|italiano/, "idiomas"], [/carreira/, "carreira"], [/diario/, "diario"], [/hoje/, "hoje"], [/lazer/, "lazer.inicio"], [/pessoa|relac|famil/, "pessoas.lista"]];
function secLocal(text) {
  const F = fold(text), D = secData(), say = (c) => { D.conversa.push({ role: "user", content: text, at: Date.now() }, { role: "assistant", local: true, content: c, at: Date.now() }); touch("secretario", { noUndo: true, noRender: true }); SEC.input = ""; secPaint(); secSpeak(c); return true; };
  const mm = F.match(/\bmodo\s+(enfoque|foco|acao|reflexao|relaxo|relax|descanso)\b/);
  if (mm) { const m = { foco: "enfoque", relax: "relaxo", descanso: "relaxo" }[mm[1]] || mm[1]; D.modo = m; touch("secretario", { noUndo: true, noRender: true }); return say(`Modo **${SEC_MODOS[m].nome}**: ${SEC_MODOS[m].desc}`); }
  if (/^\s*(secretario,?\s*)?(me\s+)?(lembr|cria(r)?\s+(um\s+)?lembrete|lembrete)/.test(F)) { const l = secParseLembrete(text); if (!l) return say("Lembrar de quê? Ex.: “me lembre de ligar para o banco amanhã às 10”."); if (!l.quando) return say(`Para quando é “${l.texto}”? Diga, por exemplo, “hoje às 18h”, “amanhã às 9” ou “em 30 minutos”.`);
    secLembrar(l); return say(`Combinado: **${l.texto}**, ${l.quando.slice(0, 10) === TODAY ? "hoje" : fmtDL(l.quando.slice(0, 10))} às ${l.quando.slice(11, 16)}. Aviso aqui no Atlas na hora (com o Atlas aberto).`); }
  const go = F.match(/^\s*(abr[ae]|abrir|ir para|vai para|mostra(r)?)\s+(?:a\s+|o\s+)?(?:aba\s+)?(.+)$/);
  if (go) { const hit = SEC_GO.find(([rx]) => rx.test(go[3])); if (hit) { setHash(...hit[1].split(".")); return say(`Abri ${hit[1].split(".")[0]}.`); } }
  if (/^\s*(resumo|o que (tenho|vence|falta)|agenda de hoje|status|como estou)\b/.test(F)) { const its = secFilt(secItems()); return say(its.length ? `${its.slice(0, 6).map(i => `- ${i.st === "crit" ? "**" : ""}${i.txt}${i.st === "crit" ? "**" : ""} · ${i.sub}`).join("\n")}${its.length > 6 ? `\n\n…e mais ${its.length - 6} no Agora.` : ""}` : "Nada pendente agora. Bom momento para respirar ou adiantar algo."); }
  return false;
}

/* ---------------------------------------------------------------- ações confirmadas */
function secDo(code, el) {
  const [k, a, b] = code.split("|");
  if (k === "tdone") { const t = S.tarefas.find(x => x.id === a); if (!t) return; t.status = "Concluída"; t.concluida = TODAY; touch("tarefas", { label: "Tarefa concluída" }); undoToast(`Concluída: ${trunc(t.tarefa, 50)}`); return; }
  if (k === "tadiar") { const t = S.tarefas.find(x => x.id === a); if (!t) return; t.prazo = addDays(TODAY, 1); touch("tarefas", { label: "Tarefa adiada" }); undoToast(`Adiada para amanhã: ${trunc(t.tarefa, 50)}`); return; }
  if (k === "conta") { const c = (S.contasCasa || []).find(z => z.id === a); if (!c) return; c.pagos = { ...(c.pagos || {}), [b]: TODAY }; const ks = ["contasCasa"], cat = /aluguel|condom/i.test(c.cat || "") ? "Moradia" : "Contas da casa"; if (+c.valor > 0 && cat in CAT_DESP) { S.lanc.push({ id: uid(), data: TODAY, tipo: "Despesa", cat, desc: c.conta, valor: +c.valor, conta: c.debito === "Sim" ? "Conta corrente" : "PIX / transferência", origem: "secretário" }); ks.push("lanc"); } touch(...ks, { label: "Conta paga" }); undoToast(`Conta paga: ${c.conta} · ${eur(+c.valor || 0, 2)} lançado`); return; }
  if (k === "lemok") { const l = secData().lembretes.find(x => x.id === a); if (l) { l.feito = true; touch("secretario", { label: "Lembrete feito" }); } return; }
  if (k === "lemdel") { const D = secData(); D.lembretes = D.lembretes.filter(x => x.id !== a); touch("secretario", { label: "Lembrete apagado" }); undoToast("Lembrete apagado"); return; }
}
function secApplyProp(p) {
  if (p.tipo === "tarefa") { S.tarefas.push({ id: uid(), tarefa: p.titulo, projeto: "", area: "", prio: p.prio, prazo: p.prazo, status: "A fazer", concluida: "", meta: "", notas: p.motivo, origem: "Secretário" }); return ["tarefas"]; }
  if (p.tipo === "lembrete") { secData().lembretes.push({ id: uid(), texto: p.titulo, quando: p.quando, feito: false, avisado: false, at: Date.now(), origem: "Secretário" }); return ["secretario"]; }
  if (p.tipo === "adiar") { const t = S.tarefas.find(x => x.id === p.tid); if (t) t.prazo = p.prazo; return ["tarefas"]; }
  if (p.tipo === "concluir") { const t = S.tarefas.find(x => x.id === p.tid); if (t) { t.status = "Concluída"; t.concluida = TODAY; } return ["tarefas"]; }
  if (p.tipo === "bloco") { (S.rotina ||= []).push({ id: uid(), data: p.data, ini: p.ini, fim: p.fim, titulo: p.titulo, cat: p.cat, rep: "", exc: [], st: {}, notas: p.motivo || "" }); return ["rotina"]; }
  return [];
}
function secDecide(chave, txt, escolha, op) {
  const D = secData(); D.decisoes.push({ id: uid(), chave, txt, escolha, data: TODAY, at: Date.now() }); if (D.decisoes.length > 100) D.decisoes = D.decisoes.slice(-100);
  const ks = ["secretario"];
  if (op === "adiar_baixas") { let n = 0; for (const t of S.tarefas) if (t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo <= TODAY && t.prio !== "Alta") { t.prazo = addDays(TODAY, 1); n++; } ks.push("tarefas"); touch(...ks, { label: "Tarefas adiadas" }); undoToast(`${plural(n, "tarefa adiada", "tarefas adiadas")} para amanhã`); return; }
  if (op?.startsWith("first:")) { const t = S.tarefas.find(x => x.id === op.slice(6)); if (t) { t.prio = "Alta"; t.notas = `${t.notas ? t.notas + "\n" : ""}Primeira da fila (decidido em ${fmtD(TODAY)}).`; ks.push("tarefas"); } }
  touch(...ks, { label: "Decisão registrada" });
  if (op?.startsWith("go:")) setHash(...op.slice(3).split("."));
  if (op === "ask") secAsk(`Me ajude a decidir a ordem: ${txt}. Leve em conta prazos, impacto e meu modo atual.`);
}

/* ---------------------------------------------------------------- desenho */
const secFilt = its => { const m = secPerfil().mostra; return m === "criticos" ? its.filter(i => i.st === "crit") : m === "hoje" ? its.filter(i => i.st !== "info").slice(0, 3) : m === "padroes" ? its.filter(i => i.st === "crit") : its; };
function secItemHTML(i) {
  return `<div class="secit st-${i.st}"><i class="secdot"></i><div class="secb"><b>${esc(i.txt)}</b><small>${esc(i.area)} · ${esc(i.sub || "")}</small>${i.acts.length || i.go ? `<div class="secacts">${i.acts.map(([l, c, crit]) => `<button type="button" class="btn sm${crit ? " ghost" : ""}" data-secdo="${esc(c)}"${crit ? ` data-crit="1"` : ""}>${SEC.conf[c] ? `${ic("check")}Confirmar: ${esc(l.toLowerCase())}?` : esc(l)}</button>`).join("")}${i.go ? `<button type="button" class="btn sm ghost" data-secgo="${i.go}">${ic("arrow")}Abrir</button>` : ""}</div>` : ""}</div></div>`;
}
function secAgoraHTML() {
  const pf = secPerfil(), all = secItems(), its = secFilt(all), cf = secConflitos(), hid = all.length - its.length;
  let h = `<div class="secmode"><span>${ic(pf.ico)}<b>${esc(pf.nome)}</b> · ${esc(pf.desc)}</span></div>`;
  if (pf.mostra === "hoje" && its[0]) h += `<div class="secfoco"><small>FOCO AGORA</small><b>${esc(its[0].txt)}</b><span>${esc(its[0].sub)}</span></div>`;
  if (cf.length) h += `<div class="secsec">${ic("flag")}Para você decidir</div>${cf.map((c, i) => `<div class="seccf"><b>${esc(c.txt)}</b><small>${esc(c.sub)}</small><div class="secacts">${c.ops.map(([l, op], j) => `<button type="button" class="btn sm${j ? " ghost" : ""}" data-seccf="${i}|${j}">${esc(l)}</button>`).join("")}</div></div>`).join("")}`;
  if (pf.mostra === "padroes") { const P = secPadroes(); h += `<div class="secsec">${ic("moon")}A semana</div><ul class="secpad">${P.L.map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="secsec">${ic("info")}Para pensar</div><ul class="secpad q">${P.perg.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`; }
  h += `<div class="secsec">${ic("list")}${pf.mostra === "padroes" ? "Só o crítico" : "Agora"}<small>${its.length}${hid ? ` · ${hid} escondido(s) pelo modo` : ""}</small></div>${its.length ? its.map(secItemHTML).join("") : `<div class="secempty">${ic("check")}Nada ${pf.mostra === "criticos" || pf.mostra === "padroes" ? "crítico" : "pendente"} agora.</div>`}`;
  if (hid && pf.mostra !== "todos") h += `<button type="button" class="btn sm ghost secall" data-act="secmodo" data-m="acao">${ic("eye")}Ver tudo (modo Ação)</button>`;
  return h;
}
function secLembHTML() {
  const L = secData().lembretes.filter(l => !l.feito).sort((a, b) => (a.quando || "9").localeCompare(b.quando || "9")), F = secData().lembretes.filter(l => l.feito).slice(-5).reverse(), now = new Date();
  return `<div class="secnew"><input type="text" id="sec_lem" placeholder="Ligar para o banco amanhã às 10" aria-label="Novo lembrete"><button type="button" class="btn sm primary" data-act="seclemadd">${ic("plus")}Lembrar</button></div><small class="muted">Aviso dentro do Atlas na hora marcada, com ele aberto.</small>
    ${L.length ? L.map(l => { const past = l.quando && new Date(l.quando) <= now; return `<div class="secit ${past ? "st-crit" : ""}"><i class="secdot"></i><div class="secb"><b>${esc(l.texto)}</b><small>${l.quando ? `${l.quando.slice(0, 10) === TODAY ? "hoje" : fmtDL(l.quando.slice(0, 10))} às ${l.quando.slice(11, 16)}` : "sem hora"}${l.origem && l.origem !== "você" ? ` · ${esc(l.origem)}` : ""}</small><div class="secacts"><button type="button" class="btn sm" data-secdo="lemok|${l.id}">${ic("check")}Feito</button><button type="button" class="btn sm ghost" data-secdo="lemdel|${l.id}" aria-label="Apagar">${ic("trash")}</button></div></div></div>`; }).join("") : `<div class="secempty">${ic("clock")}Nenhum lembrete pendente.</div>`}
    ${F.length ? `<div class="secsec">Feitos</div>${F.map(l => `<div class="secit done"><i class="secdot"></i><div class="secb"><s>${esc(l.texto)}</s></div></div>`).join("")}` : ""}`;
}
function secPropHTML(mi, p) {
  const lab = { tarefa: "Criar tarefa", lembrete: "Criar lembrete", adiar: "Adiar tarefa", concluir: "Concluir tarefa", bloco: "Criar bloco na rotina" }[p.tipo], det = p.tipo === "tarefa" ? [p.prazo && "até " + fmtD(p.prazo), p.prio].filter(Boolean).join(" · ") : p.tipo === "lembrete" ? `${fmtD(p.quando.slice(0, 10))} às ${p.quando.slice(11, 16)}` : p.tipo === "adiar" ? `novo prazo ${fmtD(p.prazo)}` : p.tipo === "bloco" ? `${fmtD(p.data)} ${p.ini}–${p.fim} · ${p.cat}` : "";
  return `<div class="prop ${p.status}"><div class="prop-t">${ic({ tarefa: "checksq", lembrete: "clock", adiar: "cal", concluir: "check", bloco: "week" }[p.tipo] || "plus")}<div><span class="prop-k">${lab}</span><b>${esc(p.titulo)}</b><small>${esc(det)}</small>${p.motivo ? `<p>${esc(p.motivo)}</p>` : ""}</div></div>
    <div class="prop-a">${p.status === "pendente" ? (mi >= 0 ? `<button type="button" class="btn sm primary" data-secp="${mi}|${p.id}|ok">${ic("check")}Confirmar</button><button type="button" class="btn sm ghost" data-secp="${mi}|${p.id}|no">Descartar</button>` : `<span class="muted">aguarde a resposta terminar</span>`) : p.status === "aceita" ? `<span class="pill good">Feito</span>` : `<span class="pill none">Descartada</span>`}</div></div>`;
}
const secCfHTML = (mi, c) => `<div class="seccf"><b>${ic("flag")}${esc(c.titulo)}</b>${c.contexto ? `<small>${esc(c.contexto)}</small>` : ""}<div class="secacts">${c.ops.map((o, j) => c.escolha ? (c.escolha === o ? `<span class="pill good">${esc(o)}</span>` : "") : `<button type="button" class="btn sm${j ? " ghost" : ""}" data-secc="${mi}|${c.id}|${j}"${mi < 0 ? " disabled" : ""}>${esc(o)}</button>`).join("")}</div></div>`;
function secChatHTML() {
  const D = secData(), L = SEC.live, ai = !!SAMPLE && !AI_OFF;
  const msgs = D.conversa.slice(-30).map((x, k) => { const i = D.conversa.length - Math.min(30, D.conversa.length) + k; return x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content)}</div></div>` : `<div class="msg ai"><div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}${(x.acoes || []).map(p => secPropHTML(i, p)).join("")}${(x.conflitos || []).map(c => secCfHTML(i, c)).join("")}</div></div>`; }).join("");
  const live = L ? `<div class="msg me"><div class="bub">${esc(L.user.content)}</div></div><div class="msg ai" id="seclive"><div class="bub"><div class="lb-text mdx">${L.text ? md(L.text) : `<div class="thinking">${ic("spark")}Verificando as abas…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div><div class="lb-acoes">${L.acoes.map(p => secPropHTML(-1, p)).join("")}${L.conflitos.map(c => secCfHTML(-1, c)).join("")}</div></div></div>` : "";
  const quick = ["O que eu faço agora?", "Como está a minha semana?", "Pergunte aos mentores onde estou travado", "Reorganize o meu dia"];
  return `<div class="secchat" id="secchat">${msgs || `<div class="secempty">${ic("spark")}Pergunte qualquer coisa sobre a sua vida no Atlas. Eu olho as abas, consulto os mentores e trago o que importa. Nada é feito sem você confirmar.${ai ? "" : "<br><br>Sem a IA nesta visualização, eu ainda crio lembretes, mudo de modo e mostro o resumo."}</div>`}${live}</div>
    ${!D.conversa.length && !L ? `<div class="secquick">${quick.map(q => `<button type="button" class="qchip" data-secq="${esc(q)}"${ai ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>` : ""}`;
}
function secCfgHTML() {
  const D = secData();
  return `<div class="secsec">${ic("sliders")}Perfis de imposição</div><p class="small muted">Cada modo muda o tom das respostas, o que aparece no Agora e o quanto eu interrompo. Ajuste como quiser.</p>
    ${Object.keys(SEC_MODOS).map(m => { const p = secPerfil(m); return `<details class="seccfgm" data-m="${m}"${D.modo === m ? " open" : ""}><summary>${ic(p.ico)}<b>${esc(p.nome)}</b>${D.modo === m ? `<span class="pill good">ativo</span>` : ""}</summary>
      <label>Tom<textarea rows="2" data-secpf="${m}|tom">${esc(p.tom)}</textarea></label>
      <label>Interrupções<select data-secpf="${m}|pro">${Object.entries(SEC_PRO).map(([k, l]) => `<option value="${k}"${p.pro === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>No Agora<select data-secpf="${m}|mostra">${Object.entries(SEC_MOSTRA).map(([k, l]) => `<option value="${k}"${p.mostra === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
      ${D.perfis[m] ? `<button type="button" class="btn sm ghost" data-act="secpfreset" data-m="${m}">${ic("undo")}Voltar ao padrão</button>` : ""}</details>`; }).join("")}
    <label class="chk"><input type="checkbox" data-act="sectts"${D.tts ? " checked" : ""}> Ler as respostas em voz alta</label>
    <p class="small muted">${ic("shield")} Na conversa, o Claude lê os dados das abas (menos os setores fora da IA em Privacidade) e cada leitura fica registrada lá. Consultar um mentor é uma chamada a mais.</p>
    ${D.conversa.length ? `<button type="button" class="btn sm ghost" data-act="secclear">${ic("trash")}Limpar a conversa</button>` : ""}`;
}
function secHTML() {
  const D = secData(), pf = secPerfil(), n = secFilt(secItems()).filter(i => i.st !== "info").length, nl = D.lembretes.filter(l => !l.feito && l.quando && new Date(l.quando) <= new Date()).length, ai = !!SAMPLE && !AI_OFF;
  const tabs = [["agora", "Agora", n], ["conversa", "Conversa", 0], ["lembretes", "Lembretes", nl]];
  const body = SEC.cfg ? secCfgHTML() : SEC.tab === "conversa" ? secChatHTML() : SEC.tab === "lembretes" ? secLembHTML() : secAgoraHTML();
  return `<header class="sech" data-secdrag="1"><span class="secav">${ic("brief")}</span><div class="sect"><b>Secretário da Vida</b><small>${esc(pf.nome)} · ${ai ? "IA pronta" : "sem IA: modo local"}</small></div>
      <button type="button" class="iconbtn${SEC.cfg ? " on" : ""}" data-act="seccfg" aria-label="Ajustar perfis" title="Perfis e ajustes">${ic("sliders")}</button><button type="button" class="iconbtn" data-act="secclose" aria-label="Fechar o Secretário">${ic("x")}</button></header>
    <div class="secmodes" role="group" aria-label="Modo">${Object.entries(SEC_MODOS).map(([k]) => { const p = secPerfil(k); return `<button type="button" class="seg" data-act="secmodo" data-m="${k}" aria-pressed="${D.modo === k}" title="${esc(p.desc)}">${ic(p.ico)}${esc(p.nome)}</button>`; }).join("")}</div>
    ${SEC.cfg ? "" : `<nav class="sectabs" role="tablist">${tabs.map(([k, l, c]) => `<button type="button" role="tab" class="${SEC.tab === k ? "on" : ""}" aria-selected="${SEC.tab === k}" data-act="sectab" data-t="${k}">${l}${c ? `<i>${c}</i>` : ""}</button>`).join("")}</nav>`}
    <div class="secbody" id="secbody">${body}</div>
    <footer class="secf"><button type="button" class="secmic${SEC.ouvindo ? " on" : ""}" data-act="secmic" aria-label="${SEC.ouvindo ? "Parar de ouvir" : "Falar com o Secretário"}" aria-pressed="${SEC.ouvindo}">${ic("mic")}</button><textarea id="sec_in" rows="1" placeholder="${SEC.ouvindo ? "Ouvindo…" : "Pergunte, peça ou diga “me lembre de…”"}" aria-label="Mensagem para o Secretário">${esc(SEC.input)}</textarea>${SEC.live ? `<button type="button" class="btn sm" data-act="secstop">${ic("stop")}</button>` : `<button type="button" class="btn sm primary" data-act="secsend" aria-label="Enviar">${ic("send")}</button>`}</footer>
    <i class="secgrip" aria-hidden="true"></i>`;
}
function secFab() {
  let f = $("#secfab"); if (!f) return; const n = LOADED ? secFilt(secItems()).filter(i => i.st === "crit").length + secData().lembretes.filter(l => !l.feito && l.quando && new Date(l.quando) <= new Date()).length : 0, nu = SEC.nudge && !SEC.open && Date.now() - SEC.nudge.at < 15 * 60e3 ? SEC.nudge : null;
  f.hidden = SEC.open; f.innerHTML = `${ic("brief")}<span>Secretário</span>${n ? `<i>${n}</i>` : ""}`; f.classList.toggle("crit", !!n);
  const b = $("#secnudge"); if (b) { b.hidden = !nu || SEC.open; if (nu) b.innerHTML = `<span>${esc(nu.txt)}</span><button type="button" class="btn sm" data-act="secopen">Ver</button><button type="button" class="iconbtn" data-act="secnudgex" aria-label="Dispensar">${ic("x")}</button>`; }
}
function secPaint() {
  const w = $("#sec"); if (!w) return; secFab(); w.hidden = !SEC.open; if (!SEC.open) return;
  const ae = document.activeElement, keep = ae?.id === "sec_in", sb = $("#secbody"), st = sb ? sb.scrollTop : 0;
  /* o perfil que está sendo editado continua aberto depois de redesenhar */
  const pf = [...document.querySelectorAll("#sec .seccfgm")].map(d => [d.dataset.m, d.open]);
  w.innerHTML = secHTML();
  pf.forEach(([m, o]) => { const d = $(`#sec .seccfgm[data-m="${m}"]`); if (d) d.open = o; });
  const ta = $("#sec_in"); if (keep && ta) { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); }
  const ch = $("#secchat"); if (SEC.tab === "conversa" && ch) ch.scrollTop = ch.scrollHeight; else { const b = $("#secbody"); if (b) b.scrollTop = st; }
}
function secPaintLive() { const el = $("#seclive"), L = SEC.live; if (!el || !L) { secPaint(); return; } $(".lb-text", el).innerHTML = L.text ? md(L.text) : `<div class="thinking">${ic("spark")}Verificando as abas…</div>`; $(".lb-uso", el).innerHTML = usoHTML(L.uso); $(".lb-acoes", el).innerHTML = L.acoes.map(p => secPropHTML(-1, p)).join("") + L.conflitos.map(c => secCfHTML(-1, c)).join(""); const ch = $("#secchat"); if (ch) ch.scrollTop = ch.scrollHeight; }
function secPlace() {
  const w = $("#sec"); if (!w) return; if (innerWidth <= 640) { w.style.cssText = ""; return; }
  const p = secLS("pos") || {}, W = clamp(+p.w || 390, 300, innerWidth - 16), H = clamp(+p.h || 600, 340, innerHeight - 16), x = clamp(p.x ?? innerWidth - W - 20, 8, innerWidth - W - 8), y = clamp(p.y ?? innerHeight - H - 20, 8, innerHeight - H - 8);
  Object.assign(w.style, { left: x + "px", top: y + "px", width: W + "px", height: H + "px" });
}
function secToggle(on = !SEC.open) { SEC.open = on; secLS("open", on); if (on) { SEC.nudge = null; secPlace(); } secPaint(); if (on) setTimeout(() => $("#sec_in")?.focus({ preventScroll: true }), 30); }
function secAfterRender() { if (!$("#sec")) return; if (SEC.open && !SEC.live && document.activeElement?.closest?.("#sec") == null) secPaint(); else secFab(); }

/* ---------------------------------------------------------------- voz */
function secMic() {
  if (SEC.ouvindo) { try { SEC.rec?.stop(); } catch {} SEC.ouvindo = false; secPaint(); return; }
  const why = pdVoiceOk(); if (why) { toast(`${PD_WHY[why]} ${PD_DICT[pdPlat()]}`); $("#sec_in")?.focus(); return; }
  const SR = pdSR(), r = new SR(); SEC.rec = r; r.lang = pdLang(); r.interimResults = true; r.continuous = false; let fin = "";
  r.onresult = e => { let it = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) fin += x[0].transcript; else it += x[0].transcript; } const ta = $("#sec_in"); if (ta) ta.value = (fin + it).trim(); SEC.input = (fin + it).trim(); };
  r.onerror = e => { SEC.ouvindo = false; if (e.error === "not-allowed") toast("O microfone foi bloqueado. Libere nas permissões do navegador ou use o ditado do sistema."); secPaint(); };
  r.onend = () => { SEC.ouvindo = false; const t = fin.trim(); secPaint(); if (t) { SEC.input = ""; secAsk(t); } };
  try { r.start(); SEC.ouvindo = true; secPaint(); } catch { SEC.ouvindo = false; }
}

/* ---------------------------------------------------------------- eventos */
function secClick(t) {
  if (!t.closest("#sec,#secfab,#secnudge")) return false;
  const ds = t.dataset, a = ds.act;
  if (t.id === "secfab" || a === "secopen") { secToggle(true); return true; }
  if (a === "secclose") { secToggle(false); return true; }
  if (a === "secnudgex") { SEC.nudge = null; secFab(); return true; }
  if (a === "sectab") { SEC.tab = ds.t; SEC.cfg = false; secPaint(); return true; }
  if (a === "seccfg") { SEC.cfg = !SEC.cfg; secPaint(); return true; }
  if (a === "secmodo") { secData().modo = ds.m; touch("secretario", { noUndo: true, noRender: true }); SEC.tab = "agora"; SEC.cfg = false; secPaint(); toast(`Modo ${SEC_MODOS[ds.m].nome}: ${secPerfil(ds.m).desc}`); return true; }
  if (a === "secpfreset") { delete secData().perfis[ds.m]; touch("secretario", { noUndo: true, noRender: true }); secPaint(); return true; }
  if (a === "sectts") { secData().tts = t.checked; touch("secretario", { noUndo: true, noRender: true }); if (!t.checked) try { speechSynthesis.cancel(); } catch {} return true; }
  if (a === "secclear") { secData().conversa = []; touch("secretario", { label: "Conversa limpa" }); secPaint(); return true; }
  if (a === "secsend") { const v = ($("#sec_in")?.value || "").trim(); SEC.input = ""; secAsk(v); return true; }
  if (a === "secstop") { SEC.live?.ctl.abort(); return true; }
  if (a === "secmic") { secMic(); return true; }
  if (a === "seclemadd") { const v = ($("#sec_lem")?.value || "").trim(); const l = secParseLembrete(/lembr/i.test(v) ? v : "lembre de " + v); if (!l) { toast("Escreva o que lembrar."); return true; } if (!l.quando) { toast("Diga quando: “hoje às 18h”, “amanhã às 9”, “em 30 minutos”."); return true; } secLembrar(l); toast(`Lembrete para ${l.quando.slice(0, 10) === TODAY ? "hoje" : fmtD(l.quando.slice(0, 10))} às ${l.quando.slice(11, 16)}`); secPaint(); return true; }
  if (ds.secgo) { setHash(...ds.secgo.split(".")); if (innerWidth <= 640) secToggle(false); return true; }
  if (ds.secdo) { const c = ds.secdo; if (ds.crit && !SEC.conf[c]) { SEC.conf = { [c]: 1 }; secPaint(); return true; } SEC.conf = {}; secDo(c); secPaint(); return true; }
  if (ds.seccf) { const [i, j] = ds.seccf.split("|").map(Number), c = secConflitos()[i]; if (c) { const [l, op] = c.ops[j]; secDecide(c.chave, c.txt, l, op); secPaint(); } return true; }
  if (ds.secq) { secAsk(ds.secq); return true; }
  if (ds.secp) { const [mi, pid, ok] = ds.secp.split("|"), m = secData().conversa[+mi], p = m?.acoes?.find(x => x.id === pid); if (!p || p.status !== "pendente") return true; if (ok === "ok") { const ks = secApplyProp(p); p.status = "aceita"; touch("secretario", ...ks, { label: `Secretário: ${p.rotulo}` }); undoToast(`Feito: ${p.rotulo}`); } else { p.status = "descartada"; touch("secretario", { noUndo: true, noRender: true }); } secPaint(); return true; }
  if (ds.secc) { const [mi, cid, j] = ds.secc.split("|"), m = secData().conversa[+mi], c = m?.conflitos?.find(x => x.id === cid); if (!c || c.escolha) return true; c.escolha = c.ops[+j]; secDecide("ia:" + c.id, c.titulo, c.escolha); secPaint(); if (SAMPLE && !SEC.live) secAsk(`Decidi: ${c.escolha}. Siga a partir daí.`); return true; }
  return true;
}
function secInput(t) { if (t.id === "sec_in") { SEC.input = t.value; t.style.height = "auto"; t.style.height = Math.min(120, t.scrollHeight) + "px"; return true; } return !!t.closest?.("#sec") && t.id === "sec_lem"; }
function secChange(t) { if (!t.dataset.secpf) return !!t.closest?.("#sec"); const [m, k] = t.dataset.secpf.split("|"), D = secData(); D.perfis[m] = { ...(D.perfis[m] || {}), [k]: t.value }; touch("secretario", { noUndo: true, noRender: true }); secPaint(); return true; }
function secBoot() {
  if ($("#sec")) return;
  document.body.insertAdjacentHTML("beforeend", `<button type="button" id="secfab" class="secfab" aria-label="Abrir o Secretário da Vida"></button><div id="secnudge" class="secnudge" role="status" hidden></div><section id="sec" class="secw" role="dialog" aria-label="Secretário da Vida" hidden></section>`);
  SEC.open = !!secLS("open"); secPlace(); secPaint();
  document.addEventListener("keydown", e => { if (e.target.id === "sec_in" && e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); const v = e.target.value.trim(); SEC.input = ""; e.target.value = ""; secAsk(v); } if (e.target.id === "sec_lem" && e.key === "Enter") { e.preventDefault(); $('[data-act="seclemadd"]')?.click(); } if (e.key === "Escape" && SEC.open && e.target.closest?.("#sec")) secToggle(false); });
  /* mover pelo cabeçalho e guardar o tamanho quando a janela é redimensionada pelo canto */
  let drag = null;
  document.addEventListener("pointerdown", e => { const h = e.target.closest?.("[data-secdrag]"); if (!h || e.target.closest("button") || innerWidth <= 640) return; const w = $("#sec"), r = w.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; h.setPointerCapture?.(e.pointerId); e.preventDefault(); });
  document.addEventListener("pointermove", e => { if (!drag) return; const w = $("#sec"), x = clamp(e.clientX - drag.dx, 4, innerWidth - w.offsetWidth - 4), y = clamp(e.clientY - drag.dy, 4, innerHeight - 60); w.style.left = x + "px"; w.style.top = y + "px"; });
  document.addEventListener("pointerup", () => { if (!drag) return; drag = null; const w = $("#sec"); secLS("pos", { ...(secLS("pos") || {}), x: w.offsetLeft, y: w.offsetTop }); });
  if (window.ResizeObserver) new ResizeObserver(() => { const w = $("#sec"); if (!w || w.hidden || innerWidth <= 640 || drag) return; const p = secLS("pos") || {}; if (Math.abs((p.w || 0) - w.offsetWidth) > 2 || Math.abs((p.h || 0) - w.offsetHeight) > 2) secLS("pos", { ...p, x: w.offsetLeft, y: w.offsetTop, w: w.offsetWidth, h: w.offsetHeight }); }).observe($("#sec"));
  addEventListener("resize", debounce(secPlace, 150));
  setInterval(secTick, 30000); setTimeout(secTick, 1500);
}
