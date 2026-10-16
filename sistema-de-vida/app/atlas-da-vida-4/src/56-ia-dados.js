
/* ================================================================ IA com acesso aos dados no detalhe
   Os mentores recebem, no próprio pedido, os registros completos da área deles (linha por linha, do mais recente ao mais
   antigo): centenas de lançamentos cabem com folga no limite de 256 KB do pedido. Todas as IAs ganham a ferramenta ler_dados, que
   lê qualquer conjunto do Atlas: catálogo, filtro por período, texto e campo, paginação, e soma ou contagem por mês ou por
   campo. Fica de fora só o que a pessoa deixou fora da IA em Privacidade (setor sem IA, entrada trancada, #privado). */
const IAD_SKIP = new Set(["priv", "auditoria", "integ", "uso", "mentores", "secretario", "conselho", "hojeCtx", "ckSnap"]);
const IAD_HIDE = new Set(["id", "upd", "at", "criado", "editado", "uid", "r", "cifra", "ok"]);
const IAD_LBL = { orc: "Orçamento por categoria (teto mensal)", patr: "Patrimônio por mês", saldoConta: "Saldo da conta (série)", projetos: "Projetos e aquisições",
  fut: "Futuro financeiro", importacoes: "Importações de extrato", cfg: "Ajustes e metas pessoais", listas: "Listas (categorias, contas, tipos)", marks: "Hábitos feitos (dia a dia)",
  roda: "Roda da Vida (notas)", alvo: "Roda da Vida (alvos)", revisao: "Revisões mensais", prio: "Prioridades da semana", experimentos: "Experimentos", radar: "Radar",
  fechamentos: "Fechamentos semanais", capitulos: "Capítulos da vida", resumos: "Resumos mensais", bussola: "Bússola moral", bmExames: "Exame da noite",
  bmDecisoes: "Decisões (Bússola)", jornada: "Jornada existencial", carreira: "Carreira (hub)", lazerHub: "Lazer (hub)", idiomas: "Idiomas", jardim: "Jardim interior",
  filosofia: "Filosofia", psique: "Psicologia", ck: "Cockpit (perfil e projetos)", ckTar: "Cockpit · tarefas", ckRisk: "Cockpit · riscos", ckIss: "Cockpit · problemas",
  ckLog: "Cockpit · diário de bordo", ckDec: "Cockpit · decisões", ckMeet: "Cockpit · reuniões", ckBim: "Cockpit · tracker BIM", ckEl: "Cockpit · elaborati",
  ckLic: "Cockpit · lições", ckRel: "Cockpit · relatórios", nutri: "Nutri (perfil e plano)", nutriLog: "Alimentação (registros)", treino: "Personal (perfil e plano)",
  treinoLog: "Treinos (registros)", corridas: "Corridas", rotinaModelos: "Modelos de rotina", areasCfg: "Áreas (ajustes)", saude: "Check-ins diários (saúde)" };
const IAD_AREA_OF = { lanc: "Finanças", orc: "Finanças", patr: "Finanças", saldoConta: "Finanças", projetos: "Finanças", fut: "Finanças", importacoes: "Finanças", assin: "Finanças",
  regras: "Finanças", vidaItens: "Finanças", contasCasa: "Casa & organização", docs: "Casa & organização", rotinas: "Casa & organização", compras: "Casa & organização",
  nutri: "Saúde física", nutriLog: "Saúde física", treino: "Saúde física", treinoLog: "Saúde física", corridas: "Saúde física", psique: "Saúde mental", estudo: "Aprendizado",
  idiomas: "Aprendizado", cand: "Carreira", comp: "Carreira", oport: "Carreira", cadTec: "Carreira", carreira: "Carreira", lazer: "Lazer & criatividade", sonhos: "Lazer & criatividade",
  lazerHub: "Lazer & criatividade", jornada: "Propósito & espiritualidade", bussola: "Propósito & espiritualidade", bmExames: "Propósito & espiritualidade",
  bmDecisoes: "Propósito & espiritualidade", jardim: "Propósito & espiritualidade", filosofia: "Propósito & espiritualidade" };
const iadArea = k => k.startsWith("ck") ? "Carreira" : IAD_AREA_OF[k] || null;
/* o que é “da área” de cada mentor (spec “conjunto:filtro”: saude:fis, pessoas:Família, tarefas:<área>) */
const IAD_MINE = {
  "Finanças": ["orc", "assin", "saldoConta", "patr", "projetos", "fut", "vidaItens", "importacoes", "regras", "contasCasa", "lanc"],
  "Saúde física": ["saude:fis", "treinoLog", "corridas", "nutriLog"], "Saúde mental": ["saude:men", "psique", "diario"],
  "Carreira": ["cand", "comp", "oport", "carreira", "cadTec"], "Aprendizado": ["aprend", "estudo", "idiomas"],
  "Família": ["pessoas:Família", "contatos:Família"], "Amor & parceria": ["pessoas:Parceria", "contatos:Parceria"], "Amizades & social": ["pessoas:Amizade", "contatos:Amizade"],
  "Lazer & criatividade": ["lazer", "sonhos", "lazerHub"], "Propósito & espiritualidade": ["revisao", "bussola", "bmExames", "bmDecisoes", "jornada", "jardim", "filosofia"],
  "Casa & organização": ["docs", "rotinas", "contasCasa", "compras", "eventos"] };
const IAD_MID = { ck: ["ck", "ckTar", "ckRisk", "ckIss", "ckDec", "ckMeet", "ckBim", "ckEl", "ckLic", "ckLog"], nutri: ["nutri", "nutriLog", "saude:fis"],
  personal: ["treino", "treinoLog", "corridas", "saude:fis"], psi: ["psique", "saude:men", "diario"], conselho: [] };
const IAD_FIS = ["sono", "qual", "passos", "treino", "min", "peso", "km", "kcal", "prot"], IAD_MEN = ["humor", "energia", "estresse"];
const iadMine = mid => { const d = MENTOR_DEF[mid]; if (!d) return []; if (IAD_MID[mid]) return IAD_MID[mid]; const a = d.area || d.gate; return a ? [...(IAD_MINE[a] || []), `tarefas:${a}`, `metas:${a}`, `habitos:${a}`] : []; };
const iadLabel = k => DSETS[k] || IAD_LBL[k] || k;

/* ---------------------------------------------------------------- linhas de um conjunto, já filtradas pela privacidade */
function iadRaw(spec, ctx = AICTX) {
  const [k, f] = String(spec).split(":"), area = iadArea(k);
  if (IAD_SKIP.has(k) || !(k in S)) return null;
  if (area && !aiAreaOk(area)) return { k, f, bloq: true };
  if (area) aiNote("area", area, ctx);
  let rows = null, obj = null;
  if (k === "saude") { const okF = aiAreaOk("Saúde física"), okM = aiAreaOk("Saúde mental"), want = f === "fis" ? IAD_FIS : f === "men" ? IAD_MEN : [...IAD_FIS, ...IAD_MEN, "nota", "obs"];
    if (okF && want.some(x => IAD_FIS.includes(x))) aiNote("area", "Saúde física", ctx); if (okM && want.some(x => IAD_MEN.includes(x))) aiNote("area", "Saúde mental", ctx);
    rows = Object.entries(S.saude || {}).map(([d, e]) => { const o = { data: d }; for (const [x, v] of Object.entries(e || {})) { if (!want.includes(x) && f) continue; if (IAD_FIS.includes(x) && !okF) continue; if (IAD_MEN.includes(x) && !okM) continue; o[x] = v; } return o; }).filter(o => Object.keys(o).length > 1); }
  else if (k === "diario") rows = aiEntries(S.diario || [], ctx).map(e => { const v = viewEntry(e) || e; return { data: e.data, hora: e.hora, titulo: v.titulo, humor: aiAreaOk("Saúde mental") ? e.humor : undefined, energia: aiAreaOk("Saúde mental") ? e.energia : undefined, texto: v.texto, fixado: e.fixado || undefined }; });
  else if (k === "pessoas" || k === "contatos") { const rel = nome => S.pessoas.find(p => p.nome === nome)?.relacao, okR = r => aiAreaOk(relArea(r)) && (!f || r === f || (f === "Amizade" && r === "Comunidade"));
    rows = k === "pessoas" ? S.pessoas.filter(p => okR(p.relacao)).map(p => ({ ...p, aniv: p.aniv ? (anivAno(p.aniv) ? p.aniv : "--" + p.aniv.slice(5)) : "" })) : S.contatos.filter(c => okR(rel(c.pessoa)));
    (f ? [relArea(f)] : [...new Set(rows.map(p => relArea(p.relacao || rel(p.pessoa))))]).forEach(a => aiNote("area", a, ctx)); }
  else if (k === "marks") { const hab = Object.fromEntries((S.habitos || []).map(h => [h.id, h]));
    rows = Object.entries(S.marks || {}).filter(([, v]) => v).map(([key]) => { const [hid, d] = key.split("|"), h = hab[hid]; return h && aiAreaOk(h.area) ? { data: d, habito: h.nome, area: h.area } : null; }).filter(Boolean); }
  else if (["tarefas", "metas", "habitos", "aprend"].includes(k)) rows = (S[k] || []).filter(x => aiAreaOk(x.area) && (!f || x.area === f));
  else if (Array.isArray(S[k])) rows = S[k];
  else obj = S[k];
  return { k, f, rows, obj };
}
const iadDateCol = rows => ["data", "prazo", "inicio", "validade", "concluida"].find(c => rows.some(r => r && r[c]));
function iadCols(k, rows) {
  const pref = (typeof dsFields === "function" ? dsFields(k) : []).map(f => f[0]), cnt = {};
  for (const r of rows) for (const [c, v] of Object.entries(r || {})) if (!IAD_HIDE.has(c) && v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)) cnt[c] = (cnt[c] || 0) + 1;
  return [...pref.filter(c => cnt[c]), ...Object.keys(cnt).filter(c => !pref.includes(c)).sort((a, b) => cnt[b] - cnt[a])];
}
/* célula: aninhados (ex.: exercícios e séries de um treino) vão inteiros em JSON até 4.000 caracteres; o orçamento do bloco limita o total */
const IAD_CEL = 4000;
const iadVal = v => v == null || v === "" ? "" : typeof v === "number" ? String(Math.round(v * 100) / 100) : typeof v === "boolean" ? (v ? "sim" : "não")
  : typeof v === "object" ? (j => (j.length > IAD_CEL ? j.slice(0, IAD_CEL) + "…" : j).replace(/\|/g, "/"))(JSON.stringify(v)) : String(v).replace(/\s*\n\s*/g, " ⏎ ").replace(/\|/g, "/");
const iadBytes = s => ENC.encode(s).length;
/* tabela: cabeçalho + linhas (mais recente primeiro), até caber em `max` bytes */
function iadTable(rows, cols, max, skip = 0) {
  const head = cols.join("|"), out = [head]; let used = iadBytes(head) + 1, n = 0;
  for (let i = skip; i < rows.length; i++) { const ln = cols.map(c => iadVal(rows[i][c])).join("|"), b = iadBytes(ln) + 1; if (used + b > max) break; out.push(ln); used += b; n++; }
  return { txt: out.join("\n"), n, resto: rows.length - skip - n };
}
const iadSort = rows => { const dc = iadDateCol(rows); return { dc, rows: dc ? [...rows].sort((a, b) => String(b[dc] || "").localeCompare(String(a[dc] || ""))) : rows }; };
function iadRange(rows, dc) { const ds = rows.map(r => r[dc]).filter(Boolean).sort(); return ds.length ? `${ds[0]} a ${ds.at(-1)}` : ""; }

/* ---------------------------------------------------------------- bloco “dados completos da área” para o pedido */
function iadBloco(specs, maxBytes = 140000, ctx = AICTX) {
  const parts = specs.map(s => ({ s, d: iadRaw(s, ctx) })).filter(x => x.d && !x.d.bloq && (x.d.obj != null ? Object.keys(x.d.obj || {}).length : x.d.rows?.length));
  /* os pequenos primeiro: sempre cabem; o maior (ex.: lançamentos) usa o que sobra */
  parts.forEach(p => p.sz = p.d.obj != null ? iadBytes(JSON.stringify(p.d.obj)) : p.d.rows.length * 60);
  parts.sort((a, b) => a.sz - b.sz);
  const out = []; let left = maxBytes;
  for (const { s, d } of parts) {
    const k = d.k, nome = iadLabel(k) + (d.f ? ` (${d.f === "fis" ? "corpo" : d.f === "men" ? "mente" : d.f})` : "");
    if (left < 400) { out.push(`### ${nome}: não coube aqui; use ler_dados com conjunto "${s}".`); continue; }
    if (d.obj != null) { let js = JSON.stringify(d.obj); if (iadBytes(js) > left - 200) js = js.slice(0, Math.max(0, left - 300)) + "…(cortado: use ler_dados)"; const t = `### ${nome} (JSON)\n${js}`; out.push(t); left -= iadBytes(t) + 2; continue; }
    const { dc, rows } = iadSort(d.rows), cols = iadCols(k, rows), T = iadTable(rows, cols, left - 200);
    const t = `### ${nome}: ${plural(rows.length, "registro", "registros")}${dc ? `, ${iadRange(rows, dc)}` : ""}${T.resto ? ` (aqui os ${T.n} mais recentes; os outros ${T.resto} pelo ler_dados)` : ""}\n${T.txt}`;
    out.push(t); left -= iadBytes(t) + 2;
  }
  return out.join("\n\n");
}
/* catálogo: todos os conjuntos com dados que a IA pode ler */
function iadCatalogo() {
  const L = [];
  for (const k of Object.keys(S)) { if (IAD_SKIP.has(k)) continue; const a = iadArea(k); if (a && !aiAreaOk(a)) continue;
    const v = S[k], n = k === "saude" ? Object.keys(v || {}).length : Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0; if (!n) continue;
    L.push(`${k} (${iadLabel(k)}, ${Array.isArray(v) || k === "saude" ? n + " registros" : "objeto"})`); }
  return L.join("; ");
}
function iadPromptMentor(mid, fallback, maxBytes) {
  const mine = iadMine(mid), bloco = mine.length && maxBytes > 2000 ? iadBloco(mine, maxBytes) : "";
  return `\n\n${bloco ? `DADOS COMPLETOS DA SUA ÁREA (registro por registro, do mais recente ao mais antigo; campos separados por |). Analise no detalhe: some, compare períodos, ache padrões e exceções, cite datas, descrições e valores exatos.\n${bloco}\n\n` : ""}${fallback ? `OUTROS DADOS DO ATLAS (não vêm neste pedido; se precisar de algum, diga qual): ${iadCatalogo() || "nenhum"}.` : `OUTROS DADOS DO ATLAS (você pode ler todos): ${iadCatalogo() || "nenhum"}. Use a ferramenta ler_dados para ver qualquer um deles registro por registro, filtrar por período, texto ou campo, e somar ou contar por mês ou por campo. Não narre a consulta.`}`;
}

/* ---------------------------------------------------------------- ferramenta ler_dados */
function iadQuery(inp, ctx) {
  const lim = 30000, sp = String(inp?.conjunto || "").trim();
  if (!sp) return `Catálogo (conjunto: rótulo, tamanho): ${iadCatalogo()}.\nFiltros por conjunto: "saude:fis" ou "saude:men", "pessoas:Família", "tarefas:<área>".`;
  const [k0, f] = sp.split(":"), k = k0 in S ? k0 : Object.keys(S).find(x => norm(iadLabel(x)) === norm(k0) || norm(x) === norm(k0));
  if (!k || IAD_SKIP.has(k)) throw new Error(`Conjunto desconhecido: ${sp}. Chame sem "conjunto" para ver o catálogo.`);
  const d = iadRaw(f ? `${k}:${f}` : k, ctx);
  if (!d) throw new Error(`Conjunto desconhecido: ${sp}.`);
  if (d.bloq) throw new Error("A pessoa deixou esse setor fora da IA em Privacidade. Não use.");
  if (d.obj != null) { const js = JSON.stringify(d.obj); return js.length > lim ? js.slice(0, lim) + "…(cortado)" : js; }
  let { dc, rows } = iadSort(d.rows);
  const de = /^\d{4}-\d{2}(-\d{2})?$/.test(inp.de || "") ? inp.de : "", ate = /^\d{4}-\d{2}(-\d{2})?$/.test(inp.ate || "") ? inp.ate : "";
  if (dc && de) rows = rows.filter(r => String(r[dc] || "") >= de);
  if (dc && ate) rows = rows.filter(r => String(r[dc] || "").slice(0, ate.length) <= ate);
  const q = norm(inp.busca || ""); if (q) rows = rows.filter(r => norm(Object.values(r).map(iadVal).join(" ")).includes(q));
  if (inp.campo) { const c = String(inp.campo), v = norm(String(inp.valor ?? "")); rows = rows.filter(r => norm(iadVal(r[c])) === v || (v && norm(iadVal(r[c])).includes(v))); }
  const cols = iadCols(k, rows);
  if (inp.agrupar) {
    const g = String(inp.agrupar), sv = inp.somar ? String(inp.somar) : "", G = {};
    for (const r of rows) { const key = g === "mes" ? String(r[dc] || "").slice(0, 7) : g === "ano" ? String(r[dc] || "").slice(0, 4) : iadVal(r[g]) || "(vazio)"; const x = G[key] ||= { s: 0, n: 0 }; x.n++; if (sv && isNum(+r[sv])) x.s += +r[sv]; }
    const ks = Object.keys(G).sort((a, b) => ["mes", "ano"].includes(g) ? b.localeCompare(a) : sv ? G[b].s - G[a].s : G[b].n - G[a].n);
    return `${iadLabel(k)}: ${rows.length} registros${de || ate ? ` (${de || "início"} a ${ate || "hoje"})` : ""}${q ? `, busca "${inp.busca}"` : ""}${inp.campo ? `, ${inp.campo}=${inp.valor}` : ""}, agrupado por ${g}\n${g}|${sv ? "soma de " + sv + "|" : ""}registros\n` + ks.map(x => `${x}|${sv ? Math.round(G[x].s * 100) / 100 + "|" : ""}${G[x].n}`).join("\n").slice(0, lim);
  }
  const skip = clamp(+inp.pular || 0, 0, 1e6), take = clamp(+inp.limite || 300, 1, 2000);
  const T = iadTable(rows.slice(0, skip + take), cols, lim, skip);
  return `${iadLabel(k)}: ${rows.length} registros${de || ate ? ` (${de || "início"} a ${ate || "hoje"})` : ""}${q ? `, busca "${inp.busca}"` : ""}; mostrando ${T.n} a partir do ${skip + 1}º (mais recente primeiro)${rows.length - skip - T.n > 0 ? `; faltam ${rows.length - skip - T.n}: use pular=${skip + T.n}` : ""}.\n${T.txt}`;
}
function iadTool(note, getCtx) {
  return { name: "ler_dados",
    description: "Lê qualquer conjunto de dados do Atlas registro por registro. Sem 'conjunto': devolve o catálogo. Com 'conjunto': filtra por período (de/ate), texto (busca) e campo=valor; com 'agrupar' (mes, ano ou um campo) soma 'somar' ou conta; sem 'agrupar' devolve as linhas (mais recentes primeiro), com 'limite' e 'pular' para paginar. Retorna texto em tabela, campos separados por |.",
    inputSchema: { type: "object", properties: { conjunto: { type: "string", description: "chave do catálogo, ex.: lanc, saude:fis, tarefas, pessoas:Família" }, de: { type: "string", description: "AAAA-MM-DD ou AAAA-MM" }, ate: { type: "string", description: "AAAA-MM-DD ou AAAA-MM" },
      busca: { type: "string", description: "texto em qualquer campo" }, campo: { type: "string" }, valor: { type: "string" }, agrupar: { type: "string", description: "mes, ano ou nome de um campo" }, somar: { type: "string", description: "campo numérico a somar, ex.: valor" },
      limite: { type: "number", description: "linhas (padrão 300)" }, pular: { type: "number" } } },
    execute: inp => { const ctx = getCtx?.(); const r = iadQuery(inp || {}, ctx); note?.("ler_dados", [inp?.conjunto || "catálogo", inp?.de && `de ${inp.de}`, inp?.ate && `até ${inp.ate}`, inp?.busca && `“${inp.busca}”`, inp?.campo && `${inp.campo}=${inp.valor}`, inp?.agrupar && `por ${inp.agrupar}`].filter(Boolean).join(" · ")); return r; } };
}
/* lista final de ferramentas: ler_dados entra no fim e, se a visualização aceita menos ferramentas, ocupa a última vaga
   (sai a última do agente: a ordem de cada agente é a prioridade dele) */
function iadCabe(lista) {
  const t = lista.find(x => x.name === "ler_dados"), L = lista.filter(x => x.name !== "ler_dados");
  if (!t) return TOOLS_MAX && L.length > TOOLS_MAX ? L.slice(0, TOOLS_MAX) : L;
  return TOOLS_MAX && L.length + 1 > TOOLS_MAX ? [...L.slice(0, TOOLS_MAX - 1), t] : [...L, t];
}
/* para as IAs de tarefa única: o catálogo no pedido e a ferramenta, quando a visualização permite ferramentas */
const iadNota = () => `\n\nDADOS DO ATLAS: você pode ler todos, registro por registro, com a ferramenta ler_dados (catálogo: ${iadCatalogo() || "vazio"}). Use-a para conferir detalhes antes de afirmar algo. Não narre a consulta: o texto que você escrever é a resposta final, sem frases como "vou consultar os dados".`;
