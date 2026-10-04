
/* ================================================================ diário: análise do texto */
const RX_TOK = /\[\[([^\]\n]{1,120})\]\]|(^|[\s(,;:"'“‘])@(?:\[([^\]\n]{1,60})\]|([\p{L}\p{N}](?:[\p{L}\p{N}_.\-ªº]*[\p{L}\p{N}ªº])?))|(^|[\s(,;])#([\p{L}\p{N}][\p{L}\p{N}_\-]{0,40})/gu;
const RX_CMD = /^\s*\/([\p{L}]+)\b\s*(.*)$/u, RX_CK = /^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/;
let PARSE_VER = -1; const PARSE_CACHE = new Map();
function resolvePerson(raw) {
  const n = norm(raw); if (!n) return null;
  const p = S.pessoas.find(p => norm(p.nome) === n) || S.pessoas.find(p => norm(p.nome.replace(/\s*\(.*?\)\s*/g, " ")) === n) || S.pessoas.find(p => norm(p.nome).split(/\s+/)[0] === n);
  return p ? p.nome : null;
}
function resolveLink(raw) {
  const m = raw.match(/^\s*(Meta|Tarefa|Projeto|Livro|Curso|Idioma|Aprendizado|Pessoa|Documento|Doc|Sonho|Hábito|Habito|Diário|Diario|Dia)\s*:\s*(.+)$/i);
  const kind = m ? norm(m[1]) : null, t = (m ? m[2] : raw).trim(), n = norm(t);
  const tryMeta = () => { const x = S.metas.find(z => norm(z.meta) === n) || S.metas.find(z => norm(z.meta).startsWith(n)); return x && { k: "meta", id: x.id, l: x.meta }; };
  const tryTar = () => { const x = S.tarefas.find(z => norm(z.tarefa) === n) || S.tarefas.find(z => norm(z.tarefa).startsWith(n)); return x && { k: "tar", id: x.id, l: x.tarefa }; };
  const tryProj = () => { const x = S.tarefas.find(z => z.projeto && norm(z.projeto) === n); return x && { k: "proj", id: x.projeto, l: x.projeto }; };
  const tryApr = () => { const x = S.aprend.find(z => norm(z.titulo) === n) || S.aprend.find(z => norm(z.titulo).startsWith(n)); return x && { k: "apr", id: x.id, l: x.titulo }; };
  const tryP = () => { const x = resolvePerson(t); return x && { k: "p", id: x, l: x }; };
  const tryDoc = () => { const x = S.docs.find(z => norm(z.doc) === n); return x && { k: "doc", id: x.id, l: x.doc }; };
  const trySonho = () => { const x = S.sonhos.find(z => norm(z.sonho) === n); return x && { k: "sonho", id: x.id, l: x.sonho }; };
  const tryHab = () => { const x = S.habitos.find(z => norm(z.nome) === n) || S.habitos.find(z => norm(z.nome).startsWith(n)); return x && { k: "hab", id: x.id, l: x.nome }; };
  const tryDia = () => { const d = /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : parseDateAny(t); return d && { k: "dia", id: d, l: fmtDL(d) }; };
  const by = { meta: [tryMeta], tarefa: [tryTar], projeto: [tryProj], livro: [tryApr], curso: [tryApr], idioma: [tryApr], aprendizado: [tryApr], pessoa: [tryP], documento: [tryDoc], doc: [tryDoc], sonho: [trySonho], habito: [tryHab], diario: [tryDia], dia: [tryDia] };
  for (const f of by[kind] || [tryMeta, tryTar, tryProj, tryApr, tryP, tryDoc, trySonho, tryHab, tryDia]) { const r = f(); if (r) return r; }
  return { k: "x", id: t, l: t };
}
function parseEntry(text) {
  if (PARSE_VER !== VER) { PARSE_CACHE.clear(); PARSE_VER = VER; }
  text = String(text || ""); if (PARSE_CACHE.has(text)) return PARSE_CACHE.get(text);
  const people = new Set(), unknown = new Set(), tags = new Set(), links = [], cmds = [], checks = { total: 0, done: 0, open: [] };
  text.split("\n").forEach((ln, i) => {
    for (const m of ln.matchAll(RX_TOK)) {
      if (m[1] != null) { const r = resolveLink(m[1]); if (!links.some(l => l.k === r.k && l.id === r.id)) links.push(r); }
      else if (m[3] != null || m[4] != null) { const raw = m[3] ?? m[4], p = resolvePerson(raw); if (p) people.add(p); else unknown.add(raw); }
      else if (m[6] != null) { const s = slug(m[6]); if (s && !/^\d+$/.test(s)) tags.add(s); }
    }
    const c = ln.match(RX_CMD); if (c && CMD[norm(c[1])]) cmds.push({ i, line: ln.trim(), name: norm(c[1]), args: c[2].trim() });
    const k = ln.match(RX_CK); if (k) { checks.total++; if (k[1].trim()) checks.done++; else checks.open.push(k[2].trim()); }
  });
  const areas = new Set([...tags].map(tagArea).filter(Boolean));
  for (const l of links) { if (l.k === "meta") { const a = S.metas.find(m => m.id === l.id)?.area; if (a) areas.add(a); } if (l.k === "tar") { const a = S.tarefas.find(t => t.id === l.id)?.area; if (a) areas.add(a); }
    if (l.k === "apr") areas.add(S.aprend.find(x => x.id === l.id)?.area || "Aprendizado"); if (l.k === "doc") areas.add("Casa & organização"); if (l.k === "sonho") areas.add("Lazer & criatividade");
    if (l.k === "hab") { const a = S.habitos.find(h => h.id === l.id)?.area; if (a) areas.add(a); } }
  for (const p of people) { const pe = S.pessoas.find(x => x.nome === p); if (pe) areas.add(relArea(pe.relacao)); }
  const r = { people: [...people], unknown: [...unknown], tags: [...tags], links, cmds, checks, areas: [...areas] };
  PARSE_CACHE.set(text, r); return r;
}

/* ================================================================ comandos: registrar dados escrevendo no diário */
function findIn(list, q) { const n = norm(q); if (!n) return null; return list.find(x => norm(x) === n) || list.find(x => norm(x).startsWith(n)) || list.find(x => norm(x).includes(n)) || null; }
const KW_CAT = [[/supermerc|mercado|feira|padaria|esselunga|conad|coop|lidl|carrefour|aldi|pingo doce|continente|hortifruti|a[cç]ougue/, "Mercado"], [/restaur|pizz|bar\b|caf[eé]|caffe|trattoria|osteria|lanche|burger|sushi|delivery|ifood|glovo|deliveroo|aperitivo|almo[cç]o|jantar/, "Restaurantes & cafés"], [/uber|t[aá]xi|metr[oô]|[oô]nibus|bus\b|trem|treno|trenitalia|italo|gasolina|combust|ped[aá]gio|estacionamento|passe/, "Transporte"], [/netflix|spotify|prime|disney|youtube|icloud|google one|assinatura|streaming/, "Assinaturas"], [/farm[aá]c|farmacia|m[eé]dic|dentista|exame|academia|gym|psic[oó]log|terapia/, "Saúde & bem-estar"], [/aluguel|affitto|condom[ií]nio|rent\b/, "Moradia"], [/\bluz\b|energia|enel|\bg[aá]s\b|[aá]gua|internet|celular|telefone|vodafone|\btim\b|wind|iliad|fastweb/, "Contas da casa"], [/livro|livraria|libreria|kindle/, "Livros & materiais"], [/curso|corso|udemy|coursera|mensalidade|faculdade/, "Educação & cursos"], [/roupa|zara|h&m|decathlon|uniqlo|cal[cç]ado|t[eê]nis/, "Roupas"], [/hotel|airbnb|booking|ryanair|easyjet|passagem|voo|viagem/, "Viagens"], [/cinema|museu|show|teatro|ingresso|parque/, "Lazer & passeios"], [/presente|doa[cç][aã]o|gift/, "Presentes & doações"], [/imposto|taxa|multa|tribut/, "Impostos & taxas"], [/cabelo|barbearia|manicure|cosm[eé]t/, "Cuidados pessoais"], [/ikea|utens[ií]lio|m[oó]vel|leroy/, "Casa & utensílios"]];
function autoCat(desc, tipo = "Despesa") {
  const d = norm(desc); if (!d) return null;
  const rule = (S.regras || []).find(r => r.termo && (r.tipo || "Despesa") === tipo && d.includes(norm(r.termo))); if (rule) return rule.cat;
  const same = S.lanc.filter(l => l.tipo === tipo && l.desc && norm(l.desc) === d); if (same.length) { const c = {}; same.forEach(l => c[l.cat] = (c[l.cat] || 0) + 1); return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0]; }
  if (tipo === "Receita") return /sal[aá]rio|stipendio|salary|payroll/.test(d) ? "Salário" : /freela|projeto|cliente|nota fiscal/.test(d) ? "Renda extra / freelance" : /rendimento|juros|dividend/.test(d) ? "Rendimentos" : /reembols|estorno|rimborso/.test(d) ? "Reembolsos" : null;
  if (tipo === "Despesa") for (const [rx, c] of KW_CAT) if (rx.test(d) && c in CAT_DESP) return c;
  return null;
}
function dateFrom(t, base) {
  let m = t.match(/(?:^|\s)(?:at[eé]\s+|para\s+|em\s+|dia\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|$|[.,;!])/i);
  if (m) { let y = m[3] ? +m[3] : +base.slice(0, 4); if (y < 100) y += 2000; let d = `${y}-${pad(+m[2])}-${pad(+m[1])}`; if (!m[3] && d < base) d = `${y + 1}-${pad(+m[2])}-${pad(+m[1])}`; return { d, rest: t.replace(m[0], " ") }; }
  if ((m = t.match(/(?:^|\s)(?:at[eé]\s+)?amanh[ãa](?=\s|$|[.,;!])/i))) return { d: addDays(base, 1), rest: t.replace(m[0], " ") };
  if ((m = t.match(/(?:^|\s)(?:at[eé]\s+)?hoje(?=\s|$|[.,;!])/i))) return { d: base, rest: t.replace(m[0], " ") };
  if ((m = t.match(/(?:^|\s)em\s+(\d{1,3})\s+dias?(?=\s|$|[.,;!])/i))) return { d: addDays(base, +m[1]), rest: t.replace(m[0], " ") };
  if ((m = t.match(/(?:^|\s)(?:at[eé]\s+|na\s+|no\s+)?(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)(?:-feira)?(?=\s|$|[.,;!])/i))) { const w = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"].indexOf(norm(m[1])); let k = (w - parse(base).getDay() + 7) % 7 || 7; return { d: addDays(base, k), rest: t.replace(m[0], " ") }; }
  return { d: "", rest: t };
}
const clean = s => s.replace(/\s{2,}/g, " ").replace(/^[\s:–-]+|[\s–-]+$/g, "").trim();
function moneyCmd(tipo, a, ctx) {
  const m = a.match(/^(?:€|R\$|\$)?\s*([\d.,]+)\s*(?:€|reais|euros?)?\s*(.*)$/i); if (!m) return { err: `Comece pelo valor. Ex.: /${tipo === "Despesa" ? "gasto" : tipo.toLowerCase()} 12,50 descrição` };
  const valor = parseNum(m[1]); if (!valor || valor <= 0) return { err: "Valor inválido" };
  const cats = tipo === "Receita" ? CAT_REC : tipo === "Aporte" ? CAT_APO : Object.keys(CAT_DESP);
  let rest = clean(m[2].replace(/@\[[^\]]*\]|@\S+/g, "").replace(/#\S+/g, "")), cat = null, desc = rest;
  const ci = rest.indexOf(":"); if (ci > 0) { const c = findIn(cats, rest.slice(0, ci)); if (c) { cat = c; desc = clean(rest.slice(ci + 1)); } }
  if (!cat) { const c = cats.find(c => norm(rest).startsWith(norm(c))); if (c) { cat = c; desc = clean(rest.slice(c.length)); } }
  if (!cat) cat = autoCat(desc, tipo) || (tipo === "Receita" ? "Outras receitas" : tipo === "Aporte" ? cats[0] : "Outros");
  desc = desc || cat;
  return { ok: true, txt: `${tipo} de ${eur(valor, 2)} · ${cat}${desc !== cat ? " · " + desc : ""}`, apply: () => { S.lanc.push({ id: uid(), data: ctx.date, tipo, cat, desc, valor, conta: tipo === "Despesa" ? "Cartão de débito" : "Conta corrente", origem: "diário" }); return ["lanc"]; } };
}
const CMD = {
  gasto: { ex: "/gasto 12,50 Restaurantes & cafés: almoço", d: "Registra uma despesa no dia da entrada", p: (a, c) => moneyCmd("Despesa", a, c) },
  receita: { ex: "/receita 350 Projeto freelance", d: "Registra uma receita", p: (a, c) => moneyCmd("Receita", a, c) },
  aporte: { ex: "/aporte 200 Reserva de emergência", d: "Registra um aporte", p: (a, c) => moneyCmd("Aporte", a, c) },
  tarefa: { ex: "/tarefa Ligar para o banco até 15/10 !alta", d: "Cria uma tarefa (prazo e prioridade opcionais)", p: (a, ctx) => {
    let t = a, prio = "Média"; t = t.replace(/!(alta|m[eé]dia|baixa)\b/i, (_, p) => { prio = /^a/i.test(p) ? "Alta" : /^b/i.test(p) ? "Baixa" : "Média"; return " "; });
    const dt = dateFrom(t, ctx.date); t = dt.rest;
    const tg = (t.match(/#([\p{L}\p{N}_-]+)/u) || [])[1], area = (tg && tagArea(tg)) || ctx.area || "";
    const ml = t.match(/\[\[(?:Meta:\s*)?([^\]]+)\]\]/i), meta = ml ? (S.metas.find(m => norm(m.meta) === norm(ml[1]))?.meta || "") : "";
    t = clean(t.replace(/\[\[[^\]]*\]\]/g, "").replace(/#[\p{L}\p{N}_-]+/gu, "")); if (!t) return { err: "Escreva o que precisa ser feito" };
    return { ok: true, txt: `Tarefa: ${t}${dt.d ? " · até " + fmtD(dt.d) : ""} · ${prio}${area ? " · " + ashort(area) : ""}`, apply: () => { S.tarefas.push({ id: uid(), tarefa: t, projeto: "", area, prio, prazo: dt.d, status: "A fazer", concluida: "", meta, origem: "diário" }); return ["tarefas"]; } }; } },
  humor: { ex: "/humor 4", d: "Humor do dia (1–5)", p: (a, c) => scaleCmd("humor", "Humor", a, c) },
  energia: { ex: "/energia 3", d: "Energia do dia (1–5)", p: (a, c) => scaleCmd("energia", "Energia", a, c) },
  estresse: { ex: "/estresse 2", d: "Estresse do dia (1–5)", p: (a, c) => scaleCmd("estresse", "Estresse", a, c) },
  sono: { ex: "/sono 7,5", d: "Horas de sono", p: (a, c) => numCmd("sono", "Sono", a, c, v => num(v) + " h", 0, 16) },
  passos: { ex: "/passos 9000", d: "Passos do dia", p: (a, c) => numCmd("passos", "Passos", a, c, v => num(v, 0), 0, 100000) },
  peso: { ex: "/peso 80,2", d: "Peso em kg", p: (a, c) => numCmd("peso", "Peso", a, c, v => num(v) + " kg", 20, 400) },
  treino: { ex: "/treino Corrida 45", d: "Treino e minutos", p: (a, ctx) => {
    const mn = a.match(/(\d{1,3})\s*(?:min|m|′)?\b/), tipo = findIn(TREINOS, clean(a.replace(mn?.[0] || "", ""))) || "Outro", min = mn ? +mn[1] : "";
    return { ok: true, txt: `Treino: ${tipo}${min ? ` · ${min} min` : ""} em ${fmtD(ctx.date)}`, apply: () => { S.saude[ctx.date] = { ...(S.saude[ctx.date] || {}), treino: tipo, min }; return ["saude"]; } }; } },
  habito: { ex: "/habito Meditar", d: "Marca um hábito como feito", p: (a, ctx) => {
    const h = S.habitos.find(h => norm(h.nome) === norm(a)) || S.habitos.find(h => norm(h.nome).startsWith(norm(a))) || S.habitos.find(h => norm(h.nome).includes(norm(a)));
    if (!a || !h) return { err: "Hábito não encontrado. Ex.: /habito " + (S.habitos[0]?.nome || "Meditar") };
    return { ok: true, txt: `Hábito feito: ${h.nome} em ${fmtD(ctx.date)}`, apply: () => { S.marks[`${h.id}|${ctx.date}`] = 1; return ["marks"]; } }; } },
  contato: { ex: "/contato @Mãe Ligação 30", d: "Registra um contato com alguém", p: (a, ctx) => {
    const ms = [...(" " + a).matchAll(RX_TOK)].map(m => m[3] ?? m[4]).filter(Boolean), pessoa = ms.map(resolvePerson).find(Boolean) || resolvePerson(a.split(/\s+/)[0]);
    if (!pessoa) return { err: "Mencione uma pessoa cadastrada: /contato @Nome" };
    const tipo = findIn(["Encontro", "Ligação", "Videochamada", "Mensagem", "Evento / grupo"], a.replace(/@\[[^\]]*\]|@\S+/g, "").replace(/\d+/g, "").trim()) || "Encontro", mn = a.replace(/@\[[^\]]*\]/g, "").match(/(\d{1,3})/);
    return { ok: true, txt: `Contato: ${pessoa} · ${tipo}${mn ? ` · ${mn[1]} min` : ""}`, apply: () => { S.contatos.push({ id: uid(), data: ctx.date, pessoa, tipo, qual: ctx.humor || 4, min: mn ? +mn[1] : "", origem: "diário" }); return ["contatos"]; } }; } },
  estudo: { ex: "/estudo 1,5 Italiano", d: "Sessão de estudo em horas", p: (a, ctx) => {
    const m = a.match(/^([\d.,]+)\s*h?\s*(.*)$/i); if (!m) return { err: "Ex.: /estudo 1,5 Italiano" }; const h = parseNum(m[1]); if (!h) return { err: "Horas inválidas" };
    const q = clean(m[2]), it = q ? (S.aprend.find(x => norm(x.titulo).includes(norm(q)))?.titulo || q) : "Estudo";
    return { ok: true, txt: `Estudo: ${num(h)} h · ${it}`, apply: () => { S.estudo.push({ id: uid(), data: ctx.date, item: it, horas: h, origem: "diário" }); return ["estudo"]; } }; } },
  lazer: { ex: "/lazer 2 Cinema", d: "Atividade de lazer em horas", p: (a, ctx) => {
    const m = a.match(/^([\d.,]+)\s*h?\s*(.*)$/i); if (!m || !clean(m[2])) return { err: "Ex.: /lazer 2 Cinema" }; const h = parseNum(m[1]) || 1, at = clean(m[2]);
    const prev = [...S.lazer].reverse().find(x => norm(x.atividade) === norm(at)), cat = prev?.cat || "Passeio";
    return { ok: true, txt: `Lazer: ${at} · ${num(h)} h · ${cat}`, apply: () => { S.lazer.push({ id: uid(), data: ctx.date, atividade: at, cat, horas: h, custo: 0, sat: ctx.humor || 4, origem: "diário" }); return ["lazer"]; } }; } },
  meta: { ex: "/meta Concluir o Master BIM = 6", d: "Atualiza o valor atual de uma meta (= valor ou +1)", p: (a) => {
    const m = a.match(/^(.*?)\s*(=|\+)\s*([\d.,]+)\s*$/); if (!m) return { err: "Ex.: /meta Nome da meta = 6  ou  /meta Nome + 1" };
    const mt = S.metas.find(x => norm(x.meta) === norm(m[1])) || S.metas.find(x => norm(x.meta).includes(norm(m[1]))); if (!mt) return { err: "Meta não encontrada" };
    const v = parseNum(m[3]), nv = m[2] === "+" ? (+mt.atual || 0) + v : v;
    return { ok: true, txt: `Meta “${trunc(mt.meta, 40)}”: ${isNum(mt.atual) ? mt.atual : "–"} → ${num(nv, nv % 1 ? 1 : 0)}${mt.un ? " " + mt.un : ""}`, apply: () => { const x = S.metas.find(z => z.id === mt.id); x.atual = nv; x.upd = Date.now(); return ["metas"]; } }; } },
  ler: { ex: "/ler 30 Il nome della rosa", d: "Avança páginas/aulas de um item de aprendizado", p: (a) => {
    const m = a.match(/^([\d.,]+)\s+(.*)$/); if (!m) return { err: "Ex.: /ler 30 Título do livro" };
    const it = S.aprend.find(x => norm(x.titulo).includes(norm(m[2]))); if (!it) return { err: "Item não encontrado em Aprendizado" };
    const n = parseNum(m[1]), nv = Math.min(+it.total || Infinity, (+it.atual || 0) + n);
    return { ok: true, txt: `${it.titulo}: ${it.atual || 0} → ${nv}${it.total ? " de " + it.total : ""}`, apply: () => { const x = S.aprend.find(z => z.id === it.id); x.atual = nv; if (x.total && nv >= x.total && x.status !== "Concluído") { x.status = "Concluído"; x.fim = TODAY; } return ["aprend"]; } }; } },
};
function scaleCmd(k, l, a, ctx) { const v = parseInt(a, 10); if (!(v >= 1 && v <= 5)) return { err: `Use um número de 1 a 5: /${k} 4` }; return { ok: true, txt: `${l} ${v}/5 em ${fmtD(ctx.date)}`, apply: () => { S.saude[ctx.date] = { ...(S.saude[ctx.date] || {}), [k]: v }; return ["saude"]; } }; }
function numCmd(k, l, a, ctx, f, lo, hi) { const v = parseNum(a); if (v == null || v < lo || v > hi) return { err: `Valor inválido para ${l.toLowerCase()}` }; return { ok: true, txt: `${l}: ${f(v)} em ${fmtD(ctx.date)}`, apply: () => { S.saude[ctx.date] = { ...(S.saude[ctx.date] || {}), [k]: v }; return ["saude"]; } }; }
function runCmd(line, ctx) { const m = line.match(RX_CMD); if (!m) return { err: "Comando desconhecido" }; const c = CMD[norm(m[1])]; if (!c) return { err: `Comando desconhecido: /${m[1]}. Use /${Object.keys(CMD).slice(0, 6).join(", /")}…` }; return c.p(m[2].trim(), ctx); }
function cmdCtx(e) { const p = parseEntry(e.texto); return { date: e.data || TODAY, area: p.areas[0] || "", humor: e.humor || null }; }
function applyEntryCommands(e, o = {}) {
  const p = parseEntry(e.texto), ctx = cmdCtx(e), keys = new Set(), errs = []; let n = 0; e.aplicados = e.aplicados || [];
  for (const c of p.cmds) { if (e.aplicados.includes(c.line)) continue; const r = runCmd(c.line, ctx); if (!r.ok) { errs.push(r.err); continue; } r.apply().forEach(k => keys.add(k)); e.aplicados.push(c.line); n++; }
  if (n && !o.silent) VER++;
  return { n, keys: [...keys], errs };
}
function previewCommand(line, date = TODAY) { return runCmd(line, { date, area: "", humor: null }); }
function runQuickCommand(line) { const r = previewCommand(line); if (!r.ok) { toast(r.err); return; } const keys = r.apply(); touch(...keys, { label: r.txt }); undoToast("Registrado: " + r.txt); }

/* ================================================================ diário: renderização */
function tokHTML(m) {
  if (m[1] != null) { const r = resolveLink(m[1]); return r.k === "x" ? `<span class="lk unk" title="Não encontrei esse item">[[${esc(m[1])}]]</span>` : `<button type="button" class="lk k-${r.k}" data-ent="${r.k}|${esc(r.id)}">${ic({ meta: "target", tar: "checksq", proj: "flag", apr: "book", p: "users", doc: "file", sonho: "spark", hab: "repeat", dia: "cal" }[r.k] || "link")}${esc(r.l)}</button>`; }
  if (m[3] != null || m[4] != null) { const raw = m[3] ?? m[4], p = resolvePerson(raw); return p ? `<button type="button" class="mn" data-ent="p|${esc(p)}">@${esc(raw)}</button>` : `<button type="button" class="mn unk" data-newp="${esc(raw)}" title="Pessoa ainda não cadastrada: toque para cadastrar">@${esc(raw)}</button>`; }
  const s = slug(m[6]), a = tagArea(s); return `<button type="button" class="tg"${a ? ` style="--c:${acol(a)}"` : ""} data-ent="tag|${esc(s)}">#${esc(m[6])}</button>`;
}
const fmtPlain = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<i>$2</i>");
function inlineEntry(s) {
  let out = "", last = 0;
  for (const m of s.matchAll(RX_TOK)) { const pre = m[2] ?? m[5] ?? ""; out += fmtPlain(s.slice(last, m.index) + pre) + tokHTML(m); last = m.index + m[0].length; }
  return out + fmtPlain(s.slice(last));
}
function renderEntry(e, o = {}) {
  const lines = String(e.texto || "").split("\n"), ctx = cmdCtx(e); let h = "", list = null;
  const close = () => { if (list) { h += `</${list}>`; list = null; } };
  lines.forEach((ln, i) => {
    let m;
    if ((m = ln.match(RX_CMD)) && CMD[norm(m[1])]) { close(); const done = (e.aplicados || []).includes(ln.trim()), r = done ? null : runCmd(ln.trim(), ctx), pv = done ? runCmd(ln.trim(), ctx) : r;
      h += `<div class="cmdl ${done ? "ok" : r.ok ? "pend" : "bad"}">${ic("bolt")}<span>${esc(pv.ok ? pv.txt : ln.trim())}</span>${done ? `<em>registrado</em>` : r.ok && !o.ro ? `<button type="button" class="lnk" data-applycmd="${e.id}">Registrar</button>` : r.ok ? "" : `<em class="err">${esc(r.err)}</em>`}</div>`; }
    else if ((m = ln.match(RX_CK))) { if (list !== "ul ck") { close(); h += `<ul class="ck">`; list = "ul ck"; } h += `<li><label class="ckl"><input type="checkbox" data-ck="${e.id}|${i}"${m[1].trim() ? " checked" : ""}${o.ro ? " disabled" : ""}><span>${inlineEntry(m[2])}</span></label></li>`; }
    else if ((m = ln.match(/^\s*#{1,3}\s+(.+)/))) { close(); h += `<h4>${inlineEntry(m[1])}</h4>`; }
    else if ((m = ln.match(/^\s*[-*•]\s+(.*)/))) { if (list !== "ul") { close(); h += "<ul>"; list = "ul"; } h += `<li>${inlineEntry(m[1])}</li>`; }
    else if ((m = ln.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); h += "<ol>"; list = "ol"; } h += `<li>${inlineEntry(m[1])}</li>`; }
    else if ((m = ln.match(/^\s*>\s?(.*)/))) { close(); h += `<blockquote>${inlineEntry(m[1])}</blockquote>`; }
    else if (!ln.trim()) close();
    else { close(); h += `<p>${inlineEntry(ln)}</p>`; }
  });
  close();
  return h.replace(/<\/?ul ck>/g, t => t.startsWith("</") ? "</ul>" : `<ul class="ck">`);
}
/* contexto do dia: o que os outros registros dizem sobre a data da entrada */
function dayContext(d) {
  const s = S.saude[d] || {}, hs = S.habitos.filter(h => S.marks[`${h.id}|${d}`]), ls = S.lanc.filter(l => l.data === d && l.tipo === "Despesa"), gasto = sum(ls.map(l => l.valor));
  const cs = S.contatos.filter(c => c.data === d), ts = S.tarefas.filter(t => t.concluida === d && t.status === "Concluída"), es = S.estudo.filter(x => x.data === d), lz = S.lazer.filter(x => x.data === d);
  const items = [];
  if (isNum(s.sono)) items.push(["moon", `Sono ${num(s.sono)} h`, s.sono >= S.cfg.metaSono ? "good" : "warn"]);
  if (isNum(s.humor)) items.push(["mood", `Humor ${s.humor}/5`, s.humor >= 4 ? "good" : s.humor <= 2 ? "crit" : ""]);
  if (isNum(s.energia)) items.push(["bolt", `Energia ${s.energia}/5`, ""]);
  if (isNum(s.estresse)) items.push(["pulse", `Estresse ${s.estresse}/5`, s.estresse >= 4 ? "crit" : ""]);
  if (s.treino) items.push(["pulse", `${s.treino}${s.min ? " " + s.min + " min" : ""}`, "good"]);
  if (isNum(s.passos)) items.push(["arrow", `${num(s.passos, 0)} passos`, ""]);
  if (S.habitos.length && d <= TODAY) items.push(["repeat", `${hs.length}/${S.habitos.length} hábitos`, hs.length / S.habitos.length >= .7 ? "good" : ""]);
  if (ls.length) items.push(["coins", `${eur(gasto)} em ${plural(ls.length, "gasto", "gastos")}`, ""]);
  if (cs.length) items.push(["users", cs.map(c => c.pessoa).join(", "), ""]);
  if (ts.length) items.push(["checksq", plural(ts.length, "tarefa concluída", "tarefas concluídas"), "good"]);
  if (es.length) items.push(["book", `${num(sum(es.map(x => x.horas)))} h de estudo`, ""]);
  if (lz.length) items.push(["palette", lz.map(x => x.atividade).join(", "), ""]);
  return { items, hs, ls, cs, ts, es, lz, s, gasto };
}
const ctxChips = ctx => ctx.items.length ? ctx.items.map(([i, t, st]) => `<span class="cx ${st}">${ic(i === "moon" ? "clock" : i)}${esc(t)}</span>`).join("") : `<span class="muted">Nenhum outro registro neste dia.</span>`;

/* ================================================================ estatísticas do diário (base dos cruzamentos) */
const STOP = new Set("a o as os um uma uns umas de da do das dos e é em no na nos nas por para pra com sem que se me mas mais muito muita pouco já não sim eu ele ela eles elas nós você vocês meu minha meus minhas seu sua dele dela isso esse essa este esta aqui lá hoje dia foi ser ter tem tive estou está estava era são como quando onde ao à às até porque também só bem então depois antes ainda vez vezes fiz fui vou vai ter tinha nada tudo todo toda outro outra sobre entre".split(" "));
function diaryStats() {
  return memo("dstats", () => {
    const D = DAILY(), tags = {}, people = {}, areas = {}, ent = S.diario;
    const moodOn = d => { const i = D.idx[d]; return i == null ? null : D.C.bem[i]; };
    const base = avg(D.C.bem);
    for (const e of ent) { const p = parseEntry(e.texto), m = e.humor ?? moodOn(e.data);
      for (const t of p.tags) { const x = tags[t] ||= { n: 0, moods: [], last: "" }; x.n++; if (isNum(m)) x.moods.push(+m); if (e.data > x.last) x.last = e.data; }
      for (const n of p.people) { const x = people[n] ||= { n: 0, moods: [], last: "" }; x.n++; if (isNum(m)) x.moods.push(+m); if (e.data > x.last) x.last = e.data; }
      for (const a of p.areas) areas[a] = (areas[a] || 0) + 1; }
    for (const o of [...Object.values(tags), ...Object.values(people)]) o.mood = avg(o.moods);
    let streak = 0; const has = new Set(ent.map(e => e.data)); for (let d = has.has(TODAY) ? TODAY : addDays(TODAY, -1); has.has(d); d = addDays(d, -1)) streak++;
    const good = {}, bad = {};
    for (const e of ent) { const m = e.humor; if (!isNum(m) || m === 3) continue; const bag = m >= 4 ? good : bad;
      for (const w of new Set((norm(e.texto.replace(/@\[[^\]]*\]|@\S+|#\S+|\[\[[^\]]*\]\]|^\s*\/.*$/gm, " ")).match(/[a-z]{4,}/g) || []).filter(w => !STOP.has(w)))) bag[w] = (bag[w] || 0) + 1; }
    const nG = ent.filter(e => e.humor >= 4).length || 1, nB = ent.filter(e => isNum(e.humor) && e.humor <= 2).length || 1;
    const lift = (A, nA, Bg, nBg) => Object.entries(A).filter(([, c]) => c >= 2).map(([w, c]) => [w, c / nA - (Bg[w] || 0) / nBg, c]).sort((a, b) => b[1] - a[1]).slice(0, 12);
    return { tags, people, areas, base, streak, words: sum(ent.map(e => words(e.texto))), goodTerms: lift(good, nG, bad, nB), badTerms: lift(bad, nB, good, nG) };
  });
}
/* entradas que citam algo (backlinks) */
function backlinks(k, id) {
  return S.diario.filter(e => { const p = parseEntry(e.texto); return k === "p" ? p.people.includes(id) : k === "tag" ? p.tags.includes(id) : p.links.some(l => l.k === k && String(l.id) === String(id)); }).sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
}
const snippet = (e, n = 150) => trunc(String(e.texto).replace(/\[\[(?:[^\]:]*:\s*)?([^\]]*)\]\]/g, "$1").replace(/@\[([^\]]*)\]/g, "@$1").replace(/^\s*[-*]\s+\[[ xX]\]\s+/gm, "☐ ").replace(/^\s*#{1,3}\s+/gm, ""), n);
const entryLine = e => `<button type="button" class="bl" data-goentry="${e.id}"><span class="bld">${fmtD(e.data)}</span><span class="blt"><b>${esc(e.titulo || trunc(e.texto.split("\n")[0], 50))}</b><small>${esc(snippet(e, 120))}</small></span>${isNum(e.humor) ? `<i class="md m${e.humor}" title="Humor ${e.humor}/5">${e.humor}</i>` : ""}</button>`;

/* ================================================================ diário: página */
const DIA = { draft: null, q: "", tag: null, pessoa: null, area: null, mood: null, per: "all", pin: false, focus: null, day: null, ai: null, aiBusy: false };
const TEMPLATES = {
  livre: ["Livre", ""],
  manha: ["Manhã", "## Intenção do dia\n\n## Três prioridades\n- [ ] \n- [ ] \n- [ ] \n## Grato por\n- "],
  noite: ["Noite", "## O que aconteceu\n\n## O que aprendi\n\n## Amanhã\n- [ ] "],
  semana: ["Revisão da semana", "## Vitória da semana\n\n## O que não funcionou\n\n## O que aprendi\n\n## Próxima semana\n- [ ] \n- [ ] \n#mente"],
  gratidao: ["Gratidão", "Três coisas boas de hoje:\n1. \n2. \n3. \n#gratidao"],
  conversa: ["Conversa importante", "Conversa com @\n\n**O que foi dito:**\n\n**O que eu senti:**\n\n**Próximo passo:**\n- [ ] "],
};
function loadDraft() { try { const v = localStorage.getItem("atlas_draft"); return v ? JSON.parse(v) : null; } catch { return null; } }
const storeDraft = debounce(() => { try { DIA.draft ? localStorage.setItem("atlas_draft", JSON.stringify(DIA.draft)) : localStorage.removeItem("atlas_draft"); } catch {} }, 400);
function openComposer(edit, preset = {}) {
  const e = edit ? S.diario.find(x => x.id === edit) : null, v = e ? viewEntry(e) : null;
  if (e && !v) { toast("Esta entrada está trancada. Destranque o cofre em Privacidade para editar."); setHash("privacidade"); return; }
  DIA.draft = e ? { id: e.id, data: e.data, hora: e.hora || "", titulo: v.titulo || "", texto: v.texto || "", humor: e.humor ?? null, energia: e.energia ?? null, apply: true, semIA: !!e.semIA, lock: !!e.cifra } : newDraft(preset);
  storeDraft(); if (PAGE !== "diario" && PAGE !== "hoje" && SUB !== "diario") { setHash("diario", "feed"); } else render();
  focusComposer();
}
function composerHTML() {
  const d = DIA.draft; if (!d) return `<button type="button" class="czopen" data-act="dznew">${ic("pen")}<span>Escreva sobre o seu dia…</span><small>@ pessoas · # temas · [[ ligações · / registrar dados</small></button>`;
  const sc = (k, v) => [1, 2, 3, 4, 5].map(n => `<button type="button" class="mchip m${n}" data-dzm="${k}|${n}" aria-pressed="${v === n}" aria-label="${k} ${n}">${n}</button>`).join("");
  return `<section class="composer" id="composer" aria-label="Escrever no diário">
    <div class="cz-top"><input id="dz_titulo" class="cz-title" type="text" placeholder="Título (opcional)" value="${esc(d.titulo)}" aria-label="Título"><div class="row"><input id="dz_data" type="date" value="${d.data}" aria-label="Data"><input id="dz_hora" type="time" value="${esc(d.hora)}" aria-label="Hora"></div></div>
    <div class="cz-moods"><span class="flbl">Humor</span><div class="mchips">${sc("humor", d.humor)}</div><span class="flbl">Energia</span><div class="mchips">${sc("energia", d.energia)}</div>
      <select id="dz_modelo" aria-label="Modelo">${Object.entries(TEMPLATES).map(([k, [l]]) => `<option value="${k}">${k === "livre" ? "Modelo…" : l}</option>`).join("")}</select></div>
    <div class="cz-tools" role="toolbar" aria-label="Inserir">${[["@", "at", "Pessoa"], ["#", "hash", "Tema"], ["[[", "link", "Ligação"], ["/", "bolt", "Registrar"], ["- [ ] ", "checksq", "Lista"], ["## ", "list", "Título"]].map(([ins, i, l]) => `<button type="button" class="tb" data-ins="${esc(ins)}">${ic(i)}<span>${l}</span></button>`).join("")}</div>
    <textarea id="dz_texto" class="dz" rows="9" spellcheck="true" placeholder="Como foi o dia? Ex.: Almocei com @Marco, falamos do #trabalho. [[Meta: Concluir o Master BIM]]&#10;/gasto 18 almoço&#10;- [ ] mandar o portfólio">${esc(d.texto)}</textarea>
    <div class="cz-live" id="dz_live">${liveHTML(d)}</div>
    <div class="cz-priv"><label class="chk"><input type="checkbox" id="dz_semia"${d.semIA || d.lock ? " checked" : ""}${d.lock ? " disabled" : ""}> ${ic("noai")}Não enviar à IA</label><label class="chk${COFRE.key ? "" : " off"}"><input type="checkbox" id="dz_lock"${d.lock ? " checked" : ""}${COFRE.key ? "" : " disabled"}> ${ic("lock")}Trancar com a senha${S.priv?.cofre ? (COFRE.key ? "" : ` <button type="button" class="lnk" data-act="dopencofre">destrancar o cofre</button>`) : ` <button type="button" class="lnk" data-act="dopencofre">criar cofre</button>`}</label></div>
    <div class="cz-foot"><label class="chk"><input type="checkbox" id="dz_apply"${d.apply ? " checked" : ""}> Registrar os comandos “/” ao salvar</label><div class="row"><button type="button" class="btn" data-act="dzcancel">${d.id ? "Cancelar edição" : "Descartar"}</button><button type="button" class="btn primary" data-act="dzsave">${ic("check")}Salvar entrada</button></div></div></section>`;
}
function liveHTML(d) {
  const p = parseEntry(d.texto), ctx = { date: d.data, area: p.areas[0] || "", humor: d.humor };
  const parts = [...p.people.map(n => `<span class="lv ok">${ic("users")}${esc(n)}</span>`), ...p.unknown.map(n => `<button type="button" class="lv warn" data-newp="${esc(n)}">${ic("plus")}Cadastrar ${esc(n)}</button>`),
    ...p.tags.map(t => `<span class="lv"${tagArea(t) ? ` style="--c:${acol(tagArea(t))}"` : ""}>#${esc(t)}</span>`), ...p.links.map(l => `<span class="lv ${l.k === "x" ? "warn" : "ok"}">${ic(l.k === "x" ? "info" : "link")}${esc(l.l)}</span>`),
    ...p.cmds.map(c => { const r = runCmd(c.line, ctx); return `<span class="lv ${r.ok ? "cmd" : "bad"}">${ic("bolt")}${esc(r.ok ? r.txt : r.err)}</span>`; })];
  if (p.checks.total) parts.push(`<span class="lv">${ic("checksq")}${p.checks.done}/${p.checks.total} itens</span>`);
  return parts.length ? `<span class="flbl">Detectado</span>${parts.join("")}` : `<span class="muted">Dica: digite @ para marcar alguém, # para um tema, [[ para ligar a uma meta ou tarefa e / para registrar gastos, treinos, humor…</span>`;
}
async function saveDraft() {
  const d = DIA.draft; if (!d) return; if (!d.texto.trim() && !d.titulo.trim()) { toast("Escreva algo antes de salvar."); return; }
  if (d.lock && !COFRE.key) { toast("Destranque o cofre para salvar uma entrada trancada."); return; }
  const e = d.id ? S.diario.find(x => x.id === d.id) : null;
  /* cópia de trabalho com o texto aberto: os comandos rodam nela e, se for trancar, ela é cifrada antes de entrar no estado salvo */
  const w = { ...(e || { id: uid(), fixado: false, aplicados: [], criado: Date.now() }), data: d.data || TODAY, hora: d.hora, titulo: d.titulo.trim(), texto: d.texto, humor: d.humor, energia: d.energia, editado: Date.now(), semIA: !!(d.semIA || d.lock) };
  delete w.cifra; w.aplicados = [...(w.aplicados || [])];
  const res = d.apply ? applyEntryCommands(w) : { n: 0, keys: [], errs: [] };
  if (d.lock) await sealEntry(w, { titulo: w.titulo, texto: w.texto }); else COFRE.plain.delete(w.id);
  if (e) { for (const k of Object.keys(e)) if (!(k in w)) delete e[k]; Object.assign(e, w); } else S.diario.push(w);
  DIA.draft = null; storeDraft(); DIA.focus = w.id;
  touch("diario", ...res.keys, { label: "Entrada do diário" });
  toast(res.n ? `Entrada salva · ${plural(res.n, "registro criado", "registros criados")}${res.errs.length ? ` · ${res.errs.length} com erro` : ""}` : "Entrada salva", { l: "Desfazer", f: undo });
}
function filteredEntries() {
  const q = norm(DIA.q), from = { "30": addDays(TODAY, -30), "90": addDays(TODAY, -90), ano: TODAY.slice(0, 4) + "-01-01", all: "0000" }[DIA.per];
  const any = DIA.q || DIA.tag || DIA.pessoa || DIA.area || DIA.mood;
  return S.diario.filter(e0 => { const e = viewEntry(e0); if (!e) return !any && e0.data >= from && (!DIA.pin || e0.fixado); if (e.data < from) return false; if (DIA.pin && !e.fixado) return false; const p = parseEntry(e.texto);
    if (DIA.tag && !p.tags.includes(DIA.tag)) return false; if (DIA.pessoa && !p.people.includes(DIA.pessoa)) return false; if (DIA.area && !p.areas.includes(DIA.area)) return false;
    if (DIA.mood && e.humor !== DIA.mood) return false; if (q && !norm(e.titulo + " " + e.texto).includes(q)) return false; return true; })
    .sort((a, b) => (b.fixado - a.fixado) || (b.data + (b.hora || "")).localeCompare(a.data + (a.hora || "")));
}
function lockedCard(e) {
  const dd = parse(e.data);
  return `<article class="ent locked" id="e_${e.id}"><div class="ent-date"><b>${dd.getDate()}</b><span>${DOWS[dd.getDay()]}</span><small>${mabbr(mkey(e.data))}${e.hora ? " · " + esc(e.hora) : ""}</small>${isNum(e.humor) ? `<i class="md m${e.humor}" title="Humor ${e.humor}/5">${e.humor}</i>` : ""}</div>
    <div class="ent-main"><header><span class="ent-nt">${ic("lock")}Entrada trancada</span><div class="ent-act"><button type="button" class="btn sm" data-act="dopencofre">${ic("unlock")}Destrancar o cofre</button></div></header><div class="ent-body"><p class="muted">O texto está cifrado com a sua senha. ${isNum(e.humor) ? "A data e o humor continuam nos gráficos; o resto só aparece com o cofre aberto." : "A data continua nos gráficos; o resto só aparece com o cofre aberto."}</p></div></div></article>`;
}
function entryCard(e0, o = {}) {
  const e = viewEntry(e0); if (!e) return lockedCard(e0);
  const p = parseEntry(e.texto), ctx = dayContext(e.data), dd = parse(e.data), area = p.areas[0], noai = !aiAllowed(e0);
  return `<article class="ent${e.fixado ? " pinned" : ""}${DIA.focus === e.id ? " focus" : ""}" id="e_${e.id}">
    <div class="ent-date"><b>${dd.getDate()}</b><span>${DOWS[dd.getDay()]}</span><small>${mabbr(mkey(e.data))}${e.hora ? " · " + esc(e.hora) : ""}</small>${isNum(e.humor) ? `<i class="md m${e.humor}" title="Humor ${e.humor}/5">${e.humor}</i>` : ""}</div>
    <div class="ent-main"><header>${e.titulo ? `<h3>${esc(e.titulo)}</h3>` : `<span class="ent-nt">${fmtDL(e.data)}</span>`}<div class="ent-act">${e0.cifra ? `<span class="pinb lockb">${ic("lock")}Trancada</span>` : noai ? `<span class="pinb noaib" title="Fica fora de qualquer pedido à IA">${ic("noai")}Sem IA</span>` : ""}${e.fixado ? `<span class="pinb">${ic("pin")}Fixada</span>` : ""}
      <button type="button" class="vb" data-dpin="${e.id}" title="${e.fixado ? "Desafixar" : "Fixar no topo"}" aria-label="${e.fixado ? "Desafixar" : "Fixar"}">${ic("pin")}</button>
      ${noai ? "" : `<button type="button" class="vb" data-dask="${e.id}" title="Perguntar ao mentor" aria-label="Perguntar ao mentor sobre esta entrada">${ic("spark")}</button>`}
      <button type="button" class="vb" data-dsim="${e.id}" title="Quando me senti assim?" aria-label="Encontrar entradas parecidas">${ic("wave")}</button>
      ${DUO.ready && !e0.cifra ? `<button type="button" class="vb" data-dduo="${e.id}" title="Compartilhar no espaço a dois" aria-label="Compartilhar no espaço a dois">${ic("duo")}</button>` : ""}
      ${e0.cifra ? "" : `<button type="button" class="vb" data-dnotion="${e.id}" title="Enviar ao Notion" aria-label="Enviar ao Notion">${ic("upload")}</button>`}
      <button type="button" class="vb" data-act="${e0.cifra ? "dunlock" : "dlock"}" data-id="${e.id}" title="${e0.cifra ? "Destrancar de vez" : "Trancar com a senha"}" aria-label="${e0.cifra ? "Destrancar de vez" : "Trancar com a senha"}">${ic(e0.cifra ? "unlock" : "lock")}</button>
      <button type="button" class="vb" data-dedit="${e.id}" title="Editar" aria-label="Editar">${ic("edit")}</button>
      <button type="button" class="vb" data-ddel="${e.id}" title="Excluir" aria-label="Excluir">${ic("trash")}</button></div></header>
      <div class="ent-body">${renderEntry(e)}</div>
      <footer><div class="ent-meta">${area ? areaTag(area) : ""}${p.checks.total ? `<span class="chip">${ic("checksq")}${p.checks.done}/${p.checks.total}</span>` : ""}${isNum(e.energia) ? `<span class="chip">Energia ${e.energia}/5</span>` : ""}<span class="chip">${plural(words(e.texto), "palavra", "palavras")}</span></div>
      ${o.noctx ? "" : `<details class="ctx"${DIA.focus === e.id ? " open" : ""}><summary>${ic("link")}Contexto do dia <span class="muted">· ${ctx.items.length ? ctx.items.slice(0, 3).map(i => i[1]).join(" · ") : "sem outros registros"}</span></summary><div class="cxs">${ctxChips(ctx)}</div></details>`}</footer></div></article>`;
}
function pDiario(R) {
  const v = SUB || "feed", st = diaryStats();
  const head = `<div class="dhead">${composerHTML()}</div>`;
  if (v === "cal") return diaryCal(R, st) ;
  if (v === "perguntar") return pPerguntar(R);
  if (v === "analise") return diaryAnalysis(R, st);
  const list = filteredEntries(), byM = {};
  for (const e of list) (byM[e.fixado ? "fix" : mkey(e.data)] ||= []).push(e);
  const topTags = Object.entries(st.tags).sort((a, b) => b[1].n - a[1].n).slice(0, 14), topP = Object.entries(st.people).sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  const side = `<aside class="dside"><div class="pn"><div class="dsearch">${ic("search")}<input id="dq" type="search" placeholder="Buscar no diário" value="${esc(DIA.q)}" aria-label="Buscar no diário"></div>
      <div class="segs">${[["30", "30 dias"], ["90", "90 dias"], ["ano", "Ano"], ["all", "Tudo"]].map(([k, l]) => `<button type="button" class="seg" data-dper="${k}" aria-pressed="${DIA.per === k}">${l}</button>`).join("")}</div>
      <div class="flbl">Humor</div><div class="mchips">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="mchip m${n}" data-dmood="${n}" aria-pressed="${DIA.mood === n}">${n}</button>`).join("")}<button type="button" class="seg" data-dpinf="1" aria-pressed="${DIA.pin}">${ic("pin")}Fixadas</button></div>
      <div class="flbl">Temas</div><div class="tagcloud">${topTags.map(([t, x]) => `<button type="button" class="tg${DIA.tag === t ? " on" : ""}" data-dtag="${esc(t)}"${tagArea(t) ? ` style="--c:${acol(tagArea(t))}"` : ""}>#${esc(t)} <small>${x.n}</small></button>`).join("") || `<span class="muted">Use # nas entradas.</span>`}</div>
      <div class="flbl">Pessoas</div><div class="tagcloud">${topP.map(([n, x]) => `<button type="button" class="mn${DIA.pessoa === n ? " on" : ""}" data-dpes="${esc(n)}">@${esc(n)} <small>${x.n}</small></button>`).join("") || `<span class="muted">Use @ para mencionar.</span>`}</div>
      <div class="flbl">Áreas</div><div class="tagcloud">${Object.entries(st.areas).sort((a, b) => b[1] - a[1]).map(([a, n]) => `<button type="button" class="atag click${DIA.area === a ? " on" : ""}" style="--c:${acol(a)}" data-darea="${esc(a)}">${esc(ashort(a))} <small>${n}</small></button>`).join("")}</div></div>
    <div class="pn dstats">${kmini("var(--accent)", "Entradas", S.diario.length, `${plural(st.streak, "dia seguido", "dias seguidos")} escrevendo`)}${kmini("var(--a-men)", "Humor nas entradas", num(avg(S.diario.map(e => e.humor))), `base do período ${num(st.base)}`)}${kmini("var(--a-apr)", "Palavras", num(st.words, 0), `${num(st.words / Math.max(1, S.diario.length), 0)} por entrada`)}</div></aside>`;
  const active = [DIA.q && `“${DIA.q}”`, DIA.tag && "#" + DIA.tag, DIA.pessoa && "@" + DIA.pessoa, DIA.area && ashort(DIA.area), DIA.mood && "humor " + DIA.mood, DIA.pin && "fixadas"].filter(Boolean);
  const feed = Object.entries(byM).map(([k, es]) => `<div class="mgroup"><div class="mhead">${k === "fix" ? "Fixadas" : mlabel(k)}<small>${plural(es.length, "entrada", "entradas")}</small></div>${es.map(e => entryCard(e)).join("")}</div>`).join("");
  return `<div class="diary">${side}<div class="dmain">${head}${active.length ? `<div class="xfbar"><span class="xfl">Filtrando</span>${active.map(a => `<span class="xfc">${esc(a)}</span>`).join("")}<button type="button" class="lnk" data-act="dclear">Limpar filtros</button><span class="muted">${plural(list.length, "entrada", "entradas")}</span></div>` : ""}${feed || `<div class="emptyb">${ic("pen")}<b>${S.diario.length ? "Nenhuma entrada com esses filtros." : "Seu diário está vazio."}</b><span>${S.diario.length ? "Limpe os filtros para ver tudo." : "Escreva a primeira entrada acima. Marque pessoas com @ e temas com #: o Atlas cruza isso com seus outros dados."}</span></div>`}</div></div>`;
}
function diaryCal(R, st) {
  const map = {}; for (const e of S.diario) map[e.data] = avg([map[e.data], e.humor].filter(isNum)) ?? 3;
  const day = DIA.day || S.diario.map(e => e.data).sort().at(-1) || TODAY, es = S.diario.filter(e => e.data === day), ctx = dayContext(day);
  const mk = REF, cnt = {}; S.diario.filter(e => mkey(e.data) === mk).forEach(e => cnt[e.data] = (cnt[e.data] || 0) + 1);
  return `<div class="dhead">${composerHTML()}</div><div class="g2c">
    ${vis("dcal", "Ano no diário", calYear(map, { mode: "div", min: 1, max: 5, fmt: v => `humor ${num(v)} · entrada no diário`, click: "dday" }), { sub: "cada quadrado é um dia com entrada, colorido pelo humor · toque para abrir", cls: "span2" })}
    ${vis("dmes", `Entradas em ${mlabel(mk)}`, calMonth(mk, cnt, { fmt: v => plural(v, "entrada", "entradas"), click: "dday", zero: "sem entrada" }), { sub: "mude o mês no topo" })}
    ${panel(`${fmtDL(day)}`, `<div class="cxs">${ctxChips(ctx)}</div>${es.length ? es.map(e => entryCard(e, { noctx: true })).join("") : `<div class="empty">Nenhuma entrada neste dia. <button type="button" class="lnk" data-dnewday="${day}">Escrever sobre este dia</button></div>`}`, { cls: "dayp" })}</div>`;
}
function diaryAnalysis(R, st) {
  const tags = Object.entries(st.tags).filter(([, x]) => x.n >= 2 && x.mood != null).map(([t, x]) => ({ l: "#" + t, v: x.mood - st.base, sub: `${x.n} entradas · humor ${num(x.mood)}`, go: `data-ent="tag|${esc(t)}"` })).sort((a, b) => b.v - a.v);
  const ppl = Object.entries(st.people).filter(([, x]) => x.n >= 2 && x.mood != null).map(([n, x]) => ({ l: "@" + n, v: x.mood - st.base, sub: `${x.n} menções · humor ${num(x.mood)}`, go: `data-ent="p|${esc(n)}"` })).sort((a, b) => b.v - a.v);
  const wk = aggSeries("diario", "w", 16), wp = aggSeries("palavras", "w", 16);
  const D = DAILY(), pairs = []; for (let i = 0; i < D.N; i++) if (isNum(D.C.humor[i]) && isNum(D.C.dhumor[i])) pairs.push({ x: D.C.humor[i], y: D.C.dhumor[i], d: D.dates[i] });
  const r = pearson(pairs.map(p => p.x), pairs.map(p => p.y));
  const ar = Object.entries(st.areas).sort((a, b) => b[1] - a[1]);
  const terms = (arr, cls) => arr.length ? `<div class="terms">${arr.map(([w, l, c]) => `<span class="term ${cls}" style="--w:${clamp(.4 + l * 2, .4, 1)}" ${tip(`${w}: aparece em ${c} entradas`)}>${esc(w)}</span>`).join("")}</div>` : `<div class="empty">Escreva mais entradas com humor marcado.</div>`;
  return `<div class="g2c">
    ${vis("dtag", "Humor por tema", diverge(tags.slice(0, 12), { fmt: v => sgn(v) }), { sub: `diferença para o humor médio (${num(st.base)}) · toque para abrir o tema`, table: () => ({ cols: [{ l: "Tema" }, { l: "Diferença", num: true }, { l: "Detalhe" }], rows: tags.map(t => [t.l, t.v, t.sub]) }) })}
    ${vis("dpes", "Pessoas e humor", diverge(ppl.slice(0, 12), { fmt: v => sgn(v) }), { sub: "humor nos dias em que a pessoa aparece no diário, contra a média", table: () => ({ cols: [{ l: "Pessoa" }, { l: "Diferença", num: true }, { l: "Detalhe" }], rows: ppl.map(t => [t.l, t.v, t.sub]) }) })}
    ${vis("dwk", "Ritmo de escrita", colChart(wk.labels, [{ name: "Dias com entrada", color: "var(--accent)", data: wk.vals.map(v => v == null ? 0 : Math.round(v * 7)) }], { h: 210, line: [{ name: "Palavras ÷ 50", color: "var(--a-apr)", data: wp.vals.map(v => v == null ? null : v / 50), fmt: v => num(v * 50, 0) + " palavras" }] }), { sub: "últimas 16 semanas" })}
    ${vis("dar", "Áreas mais presentes", donut(ar.map(([a, n]) => ({ l: ashort(a), v: n, color: acol(a), key: a })), String(sum(ar.map(x => x[1]))), "citações", { fmt: v => plural(v, "entrada", "entradas") }), { sub: "pelas tags, pessoas e metas citadas" })}
    ${vis("dterm", "Palavras de dias bons e difíceis", `<div class="mt">Mais comuns em dias com humor 4–5</div>${terms(st.goodTerms, "good")}<div class="mt" style="margin-top:14px">Mais comuns em dias com humor 1–2</div>${terms(st.badTerms, "crit")}`, { sub: "frequência relativa, sem palavras comuns" })}
    ${vis("dconf", "O diário confirma o check-in?", pairs.length >= 8 ? scatter(pairs, { xl: "Humor no check-in", yl: "Humor no diário", xr: [1, 5], yr: [1, 5], jitter: [.35, .35], fit: true, diag: true }) + `<p class="note">Correlação ${rWord(r)} (r = ${num(r, 2)}) em ${pairs.length} dias. ${Math.abs(r) >= .5 ? "Os dois registros contam a mesma história." : "Os registros divergem: vale olhar os dias em que eles discordam."}</p>` : emptyChart("Faltam dias com check-in e diário ao mesmo tempo."), { sub: "cada ponto é um dia com os dois registros" })}
    ${vis("dai", "Leitura do período pelo mentor", diaryAIBlock(), { sub: "resumo, padrões e sugestões dos últimos 30 dias", cls: "span2", nofocus: true })}</div>`;
}
function diaryAIBlock() {
  const a = DIA.ai;
  return `<div class="aiblk">${a ? `<div class="mdx">${md(a.text)}</div>${a.done ? `<div class="row"><button type="button" class="btn sm" data-act="daisave">${ic("pen")}Salvar como entrada</button><button type="button" class="btn sm" data-act="dainotion">${ic("upload")}Enviar ao Notion</button><button type="button" class="btn sm ghost" data-act="dairun">${ic("refresh")}Gerar de novo</button></div>` : ""}` : `<p class="muted">O mentor lê as entradas dos últimos 30 dias junto com seus números (humor, sono, gastos, hábitos) e devolve temas recorrentes, o que te faz bem, alertas e duas sugestões práticas.</p>`}
    ${DIA.aiBusy ? `<div class="thinking">${ic("spark")}Lendo seu diário…<button type="button" class="btn sm" data-act="daistop">${ic("stop")}Parar</button></div>` : !a ? `<button type="button" class="btn primary" data-act="dairun">${ic("spark")}Ler meus últimos 30 dias</button>` : ""}${AI_OFF ? `<p class="note">${esc(AI_OFF)}</p>` : ""}</div>`;
}

/* ================================================================ fichas (pessoa, meta, tarefa, tema…) */
let DRAWER = null;
function openEnt(k, id) { if (k === "dia") { DIA.day = id; setHash("diario", "cal"); return; } DRAWER = { k, id }; render(); setTimeout(() => $("#drawer .dwx")?.focus(), 40); }
function drawerHTML(R) {
  if (!DRAWER) return ""; const b = drawerBody(R); if (!b) { DRAWER = null; return ""; }
  return `<div class="scrim" data-act="closedrawer"></div><aside class="drawer" id="drawer" role="dialog" aria-modal="true" aria-label="${esc(b.t)}"><header><div><div class="crumb">${esc(b.k)}</div><h2>${b.h || esc(b.t)}</h2></div><button type="button" class="iconbtn dwx" data-act="closedrawer" aria-label="Fechar">${ic("x")}</button></header><div class="dwb">${b.body}</div></aside>`;
}
function blSection(list, empty = "Nenhuma entrada cita isso ainda.") { return `<div class="flbl">No diário</div>${list.length ? `<div class="bls">${list.slice(0, 12).map(entryLine).join("")}</div>${list.length > 12 ? `<div class="more">+${list.length - 12} entradas</div>` : ""}` : `<div class="empty">${empty}</div>`}`; }
function drawerBody(R) {
  const { k, id } = DRAWER, D = DAILY();
  if (k === "p") {
    const p = R.pes.find(x => x.nome === id); if (!p) return null;
    const cs = S.contatos.filter(c => c.pessoa === p.nome).sort((a, b) => b.data.localeCompare(a.data)), bl = backlinks("p", p.nome), col = D.C["p:" + p.nome];
    const on = col ? avg(D.C.bem.filter((v, i) => col[i] === 1)) : null, off = col ? avg(D.C.bem.filter((v, i) => col[i] === 0)) : null;
    const months = []; for (let i = 11; i >= 0; i--) { const m = addMonth(mkey(TODAY), -i); months.push([mabbr(m), cs.filter(c => mkey(c.data) === m).length]); }
    return { k: p.relacao, t: p.nome, body: `<div class="dwrow">${pill(p.st, p.txt)}<span class="muted">${p.ult ? `último contato ${relDay(p.ult)}` : "sem contatos registrados"} · falar a cada ${p.freq || "–"} dias</span></div>
      <div class="row wrap"><button type="button" class="btn sm primary" data-quickcont="${esc(p.nome)}">${ic("check")}Falei hoje</button><button type="button" class="btn sm" data-jw="p|${esc(p.nome)}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm ghost" data-edit="pessoas" data-id="${p.id}">${ic("edit")}Editar</button></div>
      <div class="kms3">${kmini(acol(relArea(p.relacao)), "Contatos", cs.length, `${cs.filter(c => c.data >= addDays(TODAY, -90)).length} nos últimos 90 dias`)}${kmini("var(--a-men)", "Humor juntos", num(on), on != null && off != null ? `${sgn(on - off)} vs dias sem` : "poucos dados")}${kmini("var(--a-fam)", "Aniversário", p.prox ? fmtD(p.prox) : "–", p.faltam != null ? relDay(p.prox) : "")}</div>
      ${p.notas ? `<p class="note">${esc(p.notas)}</p>` : ""}<div class="flbl">Contatos por mês</div>${colChart(months.map(m => m[0]), [{ name: "Contatos", color: acol(relArea(p.relacao)), data: months.map(m => m[1]) }], { h: 150, legend: false, w: 520 })}
      ${blSection(bl)}<div class="flbl">Últimos contatos</div>${cs.slice(0, 6).map(c => `<div class="li click" data-edit="contatos" data-id="${c.id}"><div class="t">${esc(c.tipo)}<div class="m">${fmtDL(c.data)}${c.min ? ` · ${c.min} min` : ""}</div></div><span class="chip">qualidade ${c.qual || "–"}/5</span></div>`).join("") || `<div class="empty">Nenhum ainda.</div>`}` };
  }
  if (k === "meta") {
    const m = R.metas.find(x => x.id === id); if (!m) return null; const ts = R.tar.filter(t => t.meta === m.meta), bl = backlinks("meta", m.id);
    return { k: `Meta · ${ashort(m.area)}`, t: m.meta, body: `<div class="dwrow">${ring(m.prog, acol(m.area), 74, 8)}<div><div class="kv">${pct(m.prog)}</div><div class="muted">esperado agora: ${m.esp == null ? "–" : pct(m.esp)} · ${pill(m.st, m.rt)}</div>${m.prazo ? `<div class="muted">prazo ${fmtDY(m.prazo)} (${relDay(m.prazo)})</div>` : ""}</div></div>
      ${isNum(m.atual) ? `<div class="note">Atual: <b>${num(+m.atual, m.atual % 1 ? 1 : 0)} ${esc(m.un || "")}</b> · alvo ${num(+m.alvo, m.alvo % 1 ? 1 : 0)} · início ${num(+m.ini, m.ini % 1 ? 1 : 0)}</div>` : ""}${m.proximo ? `<div class="note">${ic("arrow")}Próximo passo: <b>${esc(m.proximo)}</b></div>` : ""}
      <div class="row wrap"><button type="button" class="btn sm ghost" data-edit="metas" data-id="${m.id}">${ic("edit")}Editar</button><button type="button" class="btn sm" data-add="tarefas" data-preset-meta="${esc(m.meta)}" data-preset-area="${esc(m.area)}">${ic("plus")}Tarefa para esta meta</button><button type="button" class="btn sm" data-jw="meta|${m.id}">${ic("pen")}Escrever sobre</button><a class="btn sm" href="#mentor.${AREA_INFO[m.area]?.id || "conselho"}">${ic("spark")}Mentor de ${esc(ashort(m.area))}</a></div>
      <div class="flbl">Tarefas ligadas (${ts.filter(t => t.open).length} abertas)</div>${ts.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}"${t.status === "Concluída" ? " checked" : ""}><span class="${t.open ? "" : "done"}">${esc(t.tarefa)}</span></label>${pill(t.st, t.al)}</div>`).join("") || `<div class="empty">Nenhuma tarefa ligada.</div>`}${blSection(bl)}` };
  }
  if (k === "tar") {
    const t = R.tar.find(x => x.id === id); if (!t) return null; const bl = backlinks("tar", t.id);
    return { k: `Tarefa${t.projeto ? " · " + t.projeto : ""}`, t: t.tarefa, body: `<div class="dwrow">${pill(t.st, t.al)}<span class="muted">${t.prazo ? `prazo ${fmtDL(t.prazo)}` : "sem prazo"} · prioridade ${esc(t.prio || "–")} · ${esc(t.status)}</span></div>
      <div class="row wrap"><button type="button" class="btn sm ${t.open ? "primary" : ""}" data-tdone="${t.id}">${ic("check")}${t.open ? "Concluir" : "Reabrir"}</button><button type="button" class="btn sm" data-jw="tar|${t.id}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm ghost" data-edit="tarefas" data-id="${t.id}">${ic("edit")}Editar</button></div>
      ${t.meta ? `<div class="note">${ic("target")}Meta: <button type="button" class="lnk" data-ent="meta|${S.metas.find(m => m.meta === t.meta)?.id || ""}">${esc(t.meta)}</button></div>` : ""}${t.notas ? `<p class="note">${esc(t.notas)}</p>` : ""}${blSection(bl)}` };
  }
  if (k === "tag") {
    const x = diaryStats().tags[id], bl = backlinks("tag", id), a = tagArea(id), col = D.C["t:" + id], on = col ? avg(D.C.bem.filter((v, i) => col[i] === 1)) : null;
    const months = []; for (let i = 11; i >= 0; i--) { const m = addMonth(mkey(TODAY), -i); months.push([mabbr(m), bl.filter(e => mkey(e.data) === m).length]); }
    return { k: a ? `Tema · ${ashort(a)}` : "Tema", t: "#" + id, body: `<div class="kms3">${kmini(a ? acol(a) : "var(--accent)", "Entradas", bl.length, x?.last ? `última ${relDay(x.last)}` : "")}${kmini("var(--a-men)", "Humor nesses dias", num(on), `média geral ${num(diaryStats().base)}`)}${kmini("var(--a-apr)", "Área", a ? ashort(a) : "–", a ? "pelo nome do tema" : "tema livre")}</div>
      ${colChart(months.map(m => m[0]), [{ name: "Entradas", color: a ? acol(a) : "var(--accent)", data: months.map(m => m[1]) }], { h: 150, legend: false, w: 520 })}<div class="row wrap"><button type="button" class="btn sm primary" data-jw="tag|${esc(id)}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm" data-dtag="${esc(id)}" data-goto-diary="1">${ic("search")}Filtrar o diário por #${esc(id)}</button></div>${blSection(bl)}` };
  }
  if (k === "apr") {
    const a = S.aprend.find(x => x.id === id); if (!a) return null; const ses = S.estudo.filter(e => e.item === a.titulo), bl = backlinks("apr", a.id), pr = a.status === "Concluído" ? 1 : +a.total ? clamp(+a.atual / +a.total) : 0;
    return { k: `${a.tipo} · ${ashort(a.area || "Aprendizado")}`, t: a.titulo, body: `<div class="dwrow">${ring(pr, acol(a.area || "Aprendizado"), 74, 8)}<div><div class="kv">${pct(pr)}</div><div class="muted">${esc(a.status)} · ${a.atual || 0} de ${a.total || "–"}</div><div class="muted">${num(sum(ses.map(s => s.horas)))} h em ${plural(ses.length, "sessão", "sessões")}</div></div></div>
      <div class="row wrap"><button type="button" class="btn sm" data-add="estudo" data-preset-item="${esc(a.titulo)}">${ic("plus")}Registrar sessão</button><button type="button" class="btn sm" data-jw="apr|${a.id}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm ghost" data-edit="aprend" data-id="${a.id}">${ic("edit")}Editar</button></div>${blSection(bl)}` };
  }
  if (k === "proj") {
    const ts = R.tar.filter(t => t.projeto === id); if (!ts.length) return null; const done = ts.filter(t => t.status === "Concluída").length, bl = backlinks("proj", id);
    return { k: "Projeto", t: id, body: `<div class="dwrow">${ring(done / ts.length, "var(--accent)", 74, 8)}<div><div class="kv">${done}/${ts.length}</div><div class="muted">tarefas concluídas · ${ts.filter(t => t.st === "crit").length} atrasada(s)</div></div></div>
      ${ts.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}"${t.status === "Concluída" ? " checked" : ""}><span class="${t.open ? "" : "done"}">${esc(t.tarefa)}</span></label>${pill(t.st, t.al)}</div>`).join("")}<div class="row wrap"><button type="button" class="btn sm" data-add="tarefas" data-preset-proj="${esc(id)}">${ic("plus")}Tarefa no projeto</button><button type="button" class="btn sm" data-jw="proj|${esc(id)}">${ic("pen")}Escrever sobre</button></div>${blSection(bl)}` };
  }
  if (k === "doc" || k === "sonho") {
    const key = k === "doc" ? "docs" : "sonhos", x = S[key].find(z => z.id === id); if (!x) return null; const bl = backlinks(k, id);
    return { k: k === "doc" ? "Documento" : "Sonho", t: x.doc || x.sonho, body: `${k === "doc" ? `<div class="note">Validade: <b>${x.validade ? fmtDY(x.validade) + " (" + relDay(x.validade) + ")" : "sem validade"}</b>${x.acao ? `<br>Próxima ação: ${esc(x.acao)}` : ""}</div>` : `<div class="note">${esc(x.status)}${x.custo ? ` · custo estimado ${eur(+x.custo)}` : ""}</div>`}<div class="row"><button type="button" class="btn sm" data-jw="${k}|${x.id}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm ghost" data-edit="${key}" data-id="${x.id}">${ic("edit")}Editar</button></div>${blSection(bl)}` };
  }
  if (k === "hab") {
    const h = R.hab.find(x => x.id === id); if (!h) return null; const bl = backlinks("hab", h.id), on = !!S.marks[`${h.id}|${TODAY}`];
    let d30 = 0; for (let i = 0; i < 30; i++) if (S.marks[`${h.id}|${addDays(TODAY, -i)}`]) d30++;
    const months = []; for (let i = 11; i >= 0; i--) { const m = addMonth(mkey(TODAY), -i); let n = 0; for (let d = 1; d <= 31; d++) if (S.marks[`${h.id}|${m}-${pad(d)}`]) n++; months.push([mabbr(m), n]); }
    return { k: `Hábito · ${ashort(h.area)}`, t: h.nome, body: `<div class="kms3">${kmini(acol(h.area), "Sequência", plural(h.streak, "dia", "dias"), on ? "feito hoje" : "ainda não hoje")}${kmini("var(--a-men)", "Últimos 30 dias", `${d30}/30`, `meta ${h.meta || "–"} por semana`)}${kmini("var(--a-apr)", "No diário", bl.length, bl[0] ? "última " + relDay(bl[0].data) : "sem entradas")}</div>
      <div class="row wrap"><button type="button" class="btn sm ${on ? "" : "primary"}" data-mark="${h.id}|${TODAY}">${ic("check")}${on ? "Desmarcar hoje" : "Feito hoje"}</button><button type="button" class="btn sm" data-jw="hab|${h.id}">${ic("pen")}Escrever sobre</button><button type="button" class="btn sm ghost" data-edit="habitos" data-id="${h.id}">${ic("edit")}Editar</button></div>
      <div class="flbl">Dias feitos por mês</div>${colChart(months.map(m => m[0]), [{ name: "Dias", color: acol(h.area), data: months.map(m => m[1]) }], { h: 150, legend: false, w: 520 })}${blSection(bl)}` };
  }
  return null;
}

/* ================================================================ diário: eventos */
function diaryClick(t) {
  const ds = t.dataset;
  if (ds.act === "dznew") { openComposer(); return true; }
  if (ds.act === "dzcancel") { DIA.draft = null; storeDraft(); render(); return true; }
  if (ds.act === "dzsave") { saveDraft(); return true; }
  if (ds.act === "dclear") { Object.assign(DIA, { q: "", tag: null, pessoa: null, area: null, mood: null, pin: false }); render(); return true; }
  if (ds.dzm) { const [k, n] = ds.dzm.split("|"); DIA.draft[k] = DIA.draft[k] === +n ? null : +n; storeDraft(); render(); return true; }
  if (ds.ins != null) { insertAtCaret(ds.ins); return true; }
  if (ds.ck) { const [id, i] = ds.ck.split("|"), e = S.diario.find(x => x.id === id); if (!e) return true; const ls = e.texto.split("\n"); ls[+i] = ls[+i].replace(/\[( |x|X)\]/, m => m === "[ ]" ? "[x]" : "[ ]"); e.texto = ls.join("\n"); touch("diario", { label: "Item marcado" }); return true; }
  if (ds.applycmd) { const e = S.diario.find(x => x.id === ds.applycmd); if (!e) return true; const r = applyEntryCommands(e); touch("diario", ...r.keys, { label: "Comandos registrados" }); toast(r.n ? plural(r.n, "registro criado", "registros criados") : r.errs[0] || "Nada para registrar", r.n ? { l: "Desfazer", f: undo } : null); return true; }
  if (ds.dpin) { const e = S.diario.find(x => x.id === ds.dpin); e.fixado = !e.fixado; touch("diario", { label: e.fixado ? "Entrada fixada" : "Entrada desafixada" }); return true; }
  if (ds.dedit) { openComposer(ds.dedit); return true; }
  if (ds.ddel) { if (t.dataset.c) { S.diario = S.diario.filter(x => x.id !== ds.ddel); touch("diario", { label: "Entrada excluída" }); undoToast("Entrada excluída"); } else { t.dataset.c = 1; t.classList.add("confirm"); t.setAttribute("title", "Toque de novo para excluir"); toast("Toque de novo na lixeira para excluir esta entrada"); } return true; }
  if (ds.dsim) { openSimilar(ds.dsim); return true; }
  if (ds.dduo) { duoShareEntry(ds.dduo); return true; }
  if (ds.dask) { const e = S.diario.find(x => x.id === ds.dask); const a = parseEntry(e.texto).areas[0]; const mid = a ? AREA_INFO[a].id : "conselho"; MST.input[mid] = `Sobre minha entrada de ${fmtDL(e.data)}${e.titulo ? ` (“${e.titulo}”)` : ""}:\n\n${e.texto}\n\nO que você percebe aqui e o que sugere?`; setHash("mentor", mid); return true; }
  if (ds.dnotion) { const e = S.diario.find(x => x.id === ds.dnotion); if (e?.cifra) { toast("Entradas trancadas não saem do Atlas."); return true; } notionExportEntries([e], e.titulo || `Diário · ${fmtDL(e.data)}`); return true; }
  if (ds.dtag) { DIA.tag = DIA.tag === ds.dtag && !ds.gotoDiary ? null : ds.dtag; if (ds.gotoDiary) { DRAWER = null; setHash("diario", "feed"); } else render(); return true; }
  if (ds.dpes) { DIA.pessoa = DIA.pessoa === ds.dpes ? null : ds.dpes; render(); return true; }
  if (ds.darea) { DIA.area = DIA.area === ds.darea ? null : ds.darea; render(); return true; }
  if (ds.dmood) { DIA.mood = DIA.mood === +ds.dmood ? null : +ds.dmood; render(); return true; }
  if (ds.dper) { DIA.per = ds.dper; render(); return true; }
  if (ds.dpinf) { DIA.pin = !DIA.pin; render(); return true; }
  if (ds.dday) { DIA.day = ds.dday; if (SUB !== "cal") setHash("diario", "cal"); else render(); return true; }
  if (ds.dnewday) { openComposer(null, { data: ds.dnewday, hora: "" }); return true; }
  if (ds.goentry) { const e = S.diario.find(x => x.id === ds.goentry); if (e) { DRAWER = null; DIA.focus = e.id; Object.assign(DIA, { q: "", tag: null, pessoa: null, area: null, mood: null, pin: false, per: "all" }); setHash("diario", "feed"); } return true; }
  if (ds.newp) { openForm("pessoas", null, { nome: ds.newp }); return true; }
  if (ds.dwrite) { DRAWER = null; const n = ds.dwrite; openComposer(null, { texto: (/\s|[()]/.test(n) ? `@[${n}] ` : `@${n} `) }); return true; }
  if (ds.quickcont) { S.contatos.push({ id: uid(), data: TODAY, pessoa: ds.quickcont, tipo: "Encontro", qual: 4, min: "" }); touch("contatos", { label: "Contato registrado" }); undoToast(`Contato com ${ds.quickcont} registrado hoje`); return true; }
  if (ds.tdone) { const x = S.tarefas.find(z => z.id === ds.tdone); if (x) { const done = x.status !== "Concluída"; x.status = done ? "Concluída" : "A fazer"; x.concluida = done ? TODAY : ""; touch("tarefas", { label: done ? "Tarefa concluída" : "Tarefa reaberta" }); if (done) undoToast("Tarefa concluída"); } return true; }
  if (ds.act === "dairun") { diaryAI(); return true; }
  if (ds.act === "daistop") { DIA.aiCtl?.abort(); return true; }
  if (ds.act === "daisave" && DIA.ai) { S.diario.push({ id: uid(), data: TODAY, hora: nowHM(), titulo: "Leitura do mês pelo mentor", texto: DIA.ai.text + "\n#mente", humor: null, energia: null, fixado: false, aplicados: [], criado: Date.now(), editado: Date.now() }); touch("diario", { label: "Leitura salva no diário" }); undoToast("Leitura salva no diário"); return true; }
  if (ds.act === "dainotion" && DIA.ai) { notionCreate("Leitura do diário · " + mlabel(mkey(TODAY)), DIA.ai.text); return true; }
  return false;
}
/* inserção de atalhos e autocompletar no editor */
function insertAtCaret(ins) {
  const ta = $("#dz_texto"); if (!ta) return; const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
  let txt = ins; if (["- [ ] ", "## ", "/"].includes(ins) && s > 0 && v[s - 1] !== "\n") txt = "\n" + ins; else if ((ins === "@" || ins === "#" || ins === "[[") && s > 0 && !/\s/.test(v[s - 1])) txt = " " + ins;
  ta.value = v.slice(0, s) + txt + v.slice(e); ta.focus(); const p = s + txt.length; ta.setSelectionRange(p, p); ta.dispatchEvent(new Event("input", { bubbles: true }));
}
const AC = { open: false, items: [], sel: 0, start: 0, kind: "" };
function acCandidates(ta) {
  const pos = ta.selectionStart, before = ta.value.slice(0, pos); let m;
  if ((m = before.match(/(?:^|[\s(])@(\[?)([^\s\]@]{0,30})$/))) { const q = m[2]; return { kind: "@", start: pos - q.length - 1 - m[1].length, items: S.pessoas.map(p => ({ l: p.nome, s: p.relacao, ins: (/\s|[()]/.test(p.nome) ? `@[${p.nome}]` : `@${p.nome}`) + " " })).filter(x => fuzzy(x.l, q) >= 0).sort((a, b) => fuzzy(b.l, q) - fuzzy(a.l, q)).slice(0, 8) }; }
  if ((m = before.match(/(?:^|[\s(])#([\p{L}\p{N}_-]{0,30})$/u))) { const q = m[1], st = diaryStats().tags, all = [...new Set([...Object.keys(st).sort((a, b) => st[b].n - st[a].n), ...AREAS.map(a => AREA_INFO[a].tag)])]; return { kind: "#", start: pos - q.length - 1, items: all.filter(t => fuzzy(t, q) >= 0).slice(0, 8).map(t => ({ l: "#" + t, s: tagArea(t) ? ashort(tagArea(t)) : st[t] ? plural(st[t].n, "entrada", "entradas") : "", ins: `#${t} ` })) }; }
  if ((m = before.match(/\[\[([^\]\n]{0,40})$/))) { const km = m[1].match(/^\s*(meta|tarefa|projeto|livro|curso|documento|sonho|h[aá]bito)\s*:\s*(.*)$/i), kf = km ? norm(km[1]) : null, q = km ? km[2] : m[1]; const all = [...S.metas.map(x => ["Meta", x.meta]), ...S.tarefas.filter(x => !["Concluída", "Cancelada"].includes(x.status)).map(x => ["Tarefa", x.tarefa]), ...[...new Set(S.tarefas.map(x => x.projeto).filter(Boolean))].map(p => ["Projeto", p]), ...S.aprend.map(x => [x.tipo === "Livro" ? "Livro" : "Curso", x.titulo]), ...S.docs.map(x => ["Documento", x.doc]), ...S.sonhos.map(x => ["Sonho", x.sonho]), ...S.habitos.map(x => ["Hábito", x.nome])];
    return { kind: "[[", start: pos - m[1].length - 2, items: all.filter(([k, l]) => (!kf || norm(k) === kf || (kf === "habito" && k === "Hábito") || (kf === "livro" && k === "Curso") || (kf === "curso" && k === "Livro")) && fuzzy(l, q) >= 0).sort((a, b) => fuzzy(b[1], q) - fuzzy(a[1], q)).slice(0, 9).map(([k, l]) => ({ l, s: k, ins: `[[${k}: ${l}]] ` })) }; }
  if ((m = before.match(/(?:^|\n)\/([\p{L}]{0,12})$/u))) { const q = m[1]; return { kind: "/", start: pos - q.length - 1, items: Object.entries(CMD).filter(([k]) => fuzzy(k, q) >= 0).map(([k, c]) => ({ l: "/" + k, s: c.d + " · " + c.ex, ins: `/${k} ` })).slice(0, 10) }; }
  return null;
}
function caretXY(ta) {
  const m = document.createElement("div"), cs = getComputedStyle(ta);
  for (const p of ["boxSizing", "width", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderLeftWidth", "borderRightWidth", "tabSize"]) m.style[p] = cs[p];
  Object.assign(m.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word", top: "0", left: "-9999px" });
  m.textContent = ta.value.slice(0, ta.selectionStart); const sp = document.createElement("span"); sp.textContent = "​"; m.appendChild(sp); document.body.appendChild(m);
  const r = ta.getBoundingClientRect(), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.6, x = r.left + sp.offsetLeft - ta.scrollLeft, y = r.top + sp.offsetTop - ta.scrollTop + lh + 4;
  m.remove(); return { x: Math.max(8, Math.min(x, innerWidth - 320)), y: y + 230 > innerHeight ? Math.max(8, y - lh - 238) : y };
}
function acUpdate(ta) {
  const c = acCandidates(ta), box = $("#ac");
  if (!c || !c.items.length) { AC.open = false; box.hidden = true; return; }
  Object.assign(AC, { open: true, items: c.items, start: c.start, kind: c.kind, sel: Math.min(AC.sel, c.items.length - 1) });
  const xy = caretXY(ta); box.style.left = xy.x + "px"; box.style.top = xy.y + "px";
  box.innerHTML = `<div class="ach">${{ "@": "Pessoas", "#": "Temas", "[[": "Ligar a", "/": "Registrar" }[c.kind]}</div>` + c.items.map((it, i) => `<button type="button" class="aci${i === AC.sel ? " on" : ""}" data-aci="${i}" role="option" aria-selected="${i === AC.sel}"><b>${esc(it.l)}</b>${it.s ? `<small>${esc(it.s)}</small>` : ""}</button>`).join("");
  box.hidden = false;
}
function acPick(i) {
  const ta = $("#dz_texto"), it = AC.items[i]; if (!ta || !it) return; const pos = ta.selectionStart, v = ta.value;
  ta.value = v.slice(0, AC.start) + it.ins + v.slice(pos); const p = AC.start + it.ins.length; ta.setSelectionRange(p, p); AC.open = false; $("#ac").hidden = true; ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
}
function diaryInput(t) {
  if (!DIA.draft) return false;
  const map = { dz_titulo: "titulo", dz_data: "data", dz_hora: "hora", dz_texto: "texto" };
  if (map[t.id]) { DIA.draft[map[t.id]] = t.value; storeDraft(); if (t.id === "dz_texto" || t.id === "dz_data") { const lv = $("#dz_live"); if (lv) lv.innerHTML = liveHTML(DIA.draft); } if (t.id === "dz_texto") acUpdate(t); return true; }
  if (t.id === "dz_apply") { DIA.draft.apply = t.checked; storeDraft(); return true; }
  if (t.id === "dz_semia") { DIA.draft.semIA = t.checked; storeDraft(); return true; }
  if (t.id === "dz_lock") { DIA.draft.lock = t.checked; if (t.checked) DIA.draft.semIA = true; storeDraft(); render(); return true; }
  return false;
}

/* ================================================================ leitura do diário pela IA */
async function diaryAI() {
  if (!SAMPLE) { toast(AI_OFF || "A IA não está disponível nesta visualização."); return; }
  const from = addDays(TODAY, -30), es0 = S.diario.filter(e => e.data >= from).sort((a, b) => a.data.localeCompare(b.data)), es = es0.filter(aiAllowed);
  if (!es.length) { toast(es0.length ? "Todas as entradas dos últimos 30 dias estão protegidas da IA." : "Não há entradas nos últimos 30 dias."); return; }
  const build = c => {
    aiEntries(es, c); const R = calcAt(mkey(TODAY)), mo = aiAreaOk("Saúde mental"), fi = aiAreaOk("Saúde física"), tg = {};
    for (const e of es) { const m = e.humor; for (const t of parseEntry(e.texto).tags) { const x = tg[t] ||= { n: 0, ms: [] }; x.n++; if (isNum(m)) x.ms.push(+m); } }
    const med = [fi && `sono ${num(R.sono)} h`, mo && `humor ${num(R.humor)}/5`, mo && `estresse ${num(R.estresse)}/5`, `hábitos ${pct(R.habMeta)} da meta`, aiAreaOk("Finanças") && `despesas ${eur(R.fin.desp)}`].filter(Boolean);
    [fi && "sono", mo && "bem", mo && "estresse", "hab", aiAreaOk("Finanças") && "gasto"].filter(Boolean).forEach(k => aiNote("met", k, c));
    const ctx = `Período: ${fmtDY(from)} a ${fmtDY(TODAY)}.\nMédias do mês: ${med.join(", ")}.\nTemas e humor médio: ${Object.entries(tg).filter(([, x]) => x.n >= 2).map(([t, x]) => `#${t} (${x.n}${mo ? `, humor ${num(avg(x.ms))}` : ""})`).join(", ") || "nenhum repetido"}\n\nEntradas:\n` + es.map(e => `--- ${fmtDL(e.data)}${e.titulo ? " · " + e.titulo : ""}${mo ? ` · humor ${e.humor ?? "?"}` : ""}\n${trunc(e.texto, 700)}\n[dados do dia: ${aiDayFacts(e.data).join("; ") || "nenhum"}]`).join("\n");
    return `Você é o mentor pessoal de diário de uma pessoa que usa o app "Atlas da Vida". Escreva em português do Brasil, direto e caloroso, sem clichês de autoajuda.\nLeia as entradas e os dados do dia de cada uma e responda em markdown com estas seções curtas:\n## O que se repetiu\n## O que te faz bem (com evidência dos números)\n## Sinais de atenção\n## Duas sugestões práticas para as próximas 2 semanas\nCite datas e números concretos. Não invente nada que não esteja nos dados. Se notar sinais de sofrimento intenso, sugira com cuidado buscar apoio profissional.\n\n${ctx.slice(0, 60000)}`;
  };
  DIA.aiBusy = true; DIA.ai = { text: "", done: false }; DIA.aiCtl = new AbortController(); render();
  try {
    const r = await aiCall("Leitura do diário", build, { signal: DIA.aiCtl.signal, modelTier: S.cfg.mentorNivel || "default", cache: false, onText: ({ text }) => { DIA.ai.text = text; const el = $(".aiblk .mdx"); if (el) el.innerHTML = md(text); } });
    DIA.ai = { text: r.text, done: true };
  } catch (e) { DIA.ai = e.text ? { text: e.text, done: true } : null; if (e.code !== "cancelled") aiError(e); }
  finally { DIA.aiBusy = false; render(); }
}
