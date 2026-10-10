
/* ================================================================ Dados: editor de planilha para cada conjunto */
const DSETS = {
  lanc: "Lançamentos", tarefas: "Tarefas", metas: "Metas", habitos: "Hábitos", saude: "Check-ins", diario: "Diário", pessoas: "Pessoas", contatos: "Contatos", aprend: "Aprendizado", estudo: "Sessões de estudo",
  lazer: "Lazer", sonhos: "Sonhos", docs: "Documentos", rotinas: "Rotinas", assin: "Assinaturas", comp: "Competências", cand: "Candidaturas", regras: "Regras de categorização", eventos: "Agenda (compromissos)", contasCasa: "Contas da casa", compras: "Lista de compras", cadTec: "Caderno técnico", oport: "Oportunidades profissionais", vidaItens: "Itália e Brasil", rotina: "Rotina (blocos)",
};
const SAUDE_F = [["data", "Data", "date"], ["sono", "Sono (h)", "num"], ["humor", "Humor", "num"], ["energia", "Energia", "num"], ["estresse", "Estresse", "num"], ["qual", "Qualidade do sono", "num"], ["passos", "Passos", "num"], ["treino", "Treino", () => TREINOS], ["min", "Minutos", "num"], ["peso", "Peso", "num"], ["nota", "Nota", "text"]];
const DIARIO_F = [["data", "Data", "date"], ["hora", "Hora", "text"], ["titulo", "Título", "text"], ["humor", "Humor", "num"], ["energia", "Energia", "num"], ["texto", "Texto", "long"]];
const DG = { q: "", sort: null, dir: 1, page: 0, sel: new Set(), bulkF: "", bulkV: "" };
const dsFields = k => k === "saude" ? SAUDE_F : k === "diario" ? DIARIO_F : SCH[k]?.f || [];
function dsRows(k) { if (k === "saude") return Object.entries(S.saude).map(([d, e]) => ({ id: d, data: d, ...e })); return S[k] || []; }
function dsCount(k) { return k === "saude" ? Object.keys(S.saude).length : (S[k] || []).length; }
function pDados(R) {
  const k = SUB && DSETS[SUB] ? SUB : "lanc", F = dsFields(k), q = norm(DG.q);
  let rows = dsRows(k).filter(r => !q || norm(F.map(f => r[f[0]] ?? "").join(" ")).includes(q));
  if (DG.sort) { const s = DG.sort, ty = F.find(f => f[0] === s)?.[2]; rows = [...rows].sort((a, b) => { const x = a[s] ?? "", y = b[s] ?? ""; return (ty === "num" ? (+x || 0) - (+y || 0) : String(x).localeCompare(String(y), "pt-BR")) * DG.dir; }); }
  else if (F.some(f => f[0] === "data")) rows = [...rows].sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
  const size = 40, pages = Math.max(1, Math.ceil(rows.length / size)); DG.page = Math.min(DG.page, pages - 1);
  const shown = rows.slice(DG.page * size, DG.page * size + size), allSel = shown.length && shown.every(r => DG.sel.has(r.id));
  const cell = (r, [f, , ty]) => { const v = r[f] ?? "", id = `c_${k}_${slug(String(r.id))}_${f}`, d = `data-cell="${k}|${esc(String(r.id))}|${f}"`, opts = optsOf(ty, r);
    if (ty === "long") return `<td class="long"><button type="button" class="lnk" data-dedit="${esc(r.id)}">${esc(trunc(v, 80)) || "—"}</button></td>`;
    if (opts) return `<td><select id="${id}" ${d} aria-label="${f}">${["", ...opts.filter(x => x !== "")].map(x => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("")}${v && !opts.includes(v) ? `<option selected>${esc(v)}</option>` : ""}</select></td>`;
    return `<td${ty === "num" ? ' class="num"' : ""}><input id="${id}" ${d} type="${ty === "num" ? "number" : ty === "date" ? "date" : "text"}"${ty === "num" ? ' step="any"' : ""} value="${esc(v)}" aria-label="${f}"></td>`; };
  return `<div class="dados"><aside class="dslist pn">${Object.entries(DSETS).map(([kk, l]) => `<a href="#dados.${kk}" class="dsi${kk === k ? " on" : ""}"><span>${esc(l)}</span><em>${dsCount(kk)}</em></a>`).join("")}</aside>
    <section class="pn dgrid"><header><h2>${esc(DSETS[k])} <small>${plural(rows.length, "linha", "linhas")}</small></h2><div class="row wrap">${k !== "saude" && k !== "diario" ? addBtn(k, "Nova linha") : k === "diario" ? `<button type="button" class="btn sm" data-act="dznew">${ic("pen")}Nova entrada</button>` : `<a class="btn sm" href="#saude.checkin">${ic("plus")}Novo check-in</a>`}<button type="button" class="btn sm" data-act="dgcsv">${ic("download")}CSV</button><label class="btn sm filebtn">${ic("upload")}Importar CSV<input type="file" id="dg_file" accept=".csv,text/csv,text/plain" hidden></label></div></header>
      <div class="filters"><div class="dsearch">${ic("search")}<input id="dg_q" type="search" placeholder="Filtrar ${esc(DSETS[k].toLowerCase())}" value="${esc(DG.q)}" aria-label="Filtrar"></div>
        ${DG.sel.size ? `<div class="bulk"><b>${DG.sel.size} selecionada(s)</b><select id="dg_bf" aria-label="Campo"><option value="">Alterar campo…</option>${F.filter(f => f[2] !== "long" && f[0] !== "data" || k !== "saude").filter(f => f[2] !== "long").map(f => `<option value="${f[0]}"${DG.bulkF === f[0] ? " selected" : ""}>${esc(f[1])}</option>`).join("")}</select>${DG.bulkF ? (() => { const ff = F.find(f => f[0] === DG.bulkF), o = optsOf(ff?.[2], {}); return o ? `<select id="dg_bv" aria-label="Novo valor"><option value=""></option>${o.map(x => `<option${x === DG.bulkV ? " selected" : ""}>${esc(x)}</option>`).join("")}</select>` : `<input id="dg_bv" type="${ff?.[2] === "num" ? "number" : ff?.[2] === "date" ? "date" : "text"}" value="${esc(DG.bulkV)}" aria-label="Novo valor">`; })() + `<button type="button" class="btn sm" data-act="dgbulk">Aplicar</button>` : ""}${k !== "saude" ? `<button type="button" class="btn sm" data-act="dgdup">${ic("copy")}Duplicar</button>` : ""}<button type="button" class="btn sm danger" data-act="dgdel">${ic("trash")}Excluir</button><button type="button" class="lnk" data-act="dgnone">limpar seleção</button></div>` : `<span class="muted small">Edite direto nas células; tudo salva ao sair do campo. Ctrl+Z desfaz.</span>`}</div>
      <div class="hscroll"><table class="dt edit"><thead><tr><th class="chkc"><input type="checkbox" data-act="dgall"${allSel ? " checked" : ""} aria-label="Selecionar a página"></th>${F.map(([f, l]) => `<th><button type="button" class="sortb" data-sort="${f}">${esc(l)}${DG.sort === f ? (DG.dir > 0 ? " ▲" : " ▼") : ""}</button></th>`).join("")}<th></th></tr></thead>
      <tbody>${shown.map(r => `<tr${DG.sel.has(r.id) ? ' class="sel"' : ""}><td class="chkc"><input type="checkbox" data-dgsel="${esc(String(r.id))}"${DG.sel.has(r.id) ? " checked" : ""} aria-label="Selecionar linha"></td>${F.map(f => cell(r, f)).join("")}<td>${k !== "saude" && k !== "diario" ? `<button type="button" class="vb" data-edit="${k}" data-id="${esc(r.id)}" aria-label="Abrir formulário">${ic("edit")}</button>` : ""}</td></tr>`).join("") || `<tr><td colspan="${F.length + 2}" class="empty">Nada aqui ainda.</td></tr>`}</tbody></table></div>
      ${pages > 1 ? `<div class="pager"><button type="button" class="btn sm" data-dgpage="${DG.page - 1}"${DG.page ? "" : " disabled"}>‹ Anterior</button><span>Página ${DG.page + 1} de ${pages}</span><button type="button" class="btn sm" data-dgpage="${DG.page + 1}"${DG.page < pages - 1 ? "" : " disabled"}>Próxima ›</button></div>` : ""}</section></div>`;
}
function setCell(k, id, f, raw, ty) {
  const v = ty === "num" ? (raw === "" ? (k === "saude" ? null : "") : +raw) : raw;
  if (k === "saude") { const e = { ...(S.saude[id] || {}) }; if (f === "data") { if (!raw || raw === id) return; if (S.saude[raw]) { toast("Já existe check-in nessa data."); render(); return; } delete S.saude[id]; S.saude[raw] = e; } else { if (v == null || v === "") delete e[f]; else e[f] = v; S.saude[id] = e; } touch("saude", { label: "Check-in editado" }); return; }
  const r = S[k].find(x => String(x.id) === id); if (!r) return;
  if (k === "pessoas" && f === "nome" && r.nome !== v) renamePerson(r.nome, v);
  const oldCat = r.cat; r[f] = v; r.upd = Date.now(); if (k === "tarefas" && f === "status" && v === "Concluída" && !r.concluida) r.concluida = TODAY;
  if (k === "lanc" && f === "cat" && v && v !== oldCat && r.desc) setTimeout(() => offerRule(r.desc, r.tipo || "Despesa", v), 300);
  touch(k, "contatos", "diario", { label: `${DSETS[k]} editado` });
}
function dataClick(t) {
  const ds = t.dataset, k = SUB && DSETS[SUB] ? SUB : "lanc";
  if (ds.sort) { DG.dir = DG.sort === ds.sort ? -DG.dir : 1; DG.sort = ds.sort; render(); return true; }
  if (ds.dgpage != null) { DG.page = +ds.dgpage; render(); return true; }
  if (ds.dgsel != null) { const id = ds.dgsel; if (DG.sel.has(id)) DG.sel.delete(id); else DG.sel.add(id); render(); return true; }
  if (ds.act === "dgall") { const F = dsFields(k), q = norm(DG.q); const ids = dsRows(k).filter(r => !q || norm(F.map(f => r[f[0]] ?? "").join(" ")).includes(q)).slice(DG.page * 40, DG.page * 40 + 40).map(r => String(r.id)); const all = ids.every(i => DG.sel.has(i)); ids.forEach(i => all ? DG.sel.delete(i) : DG.sel.add(i)); render(); return true; }
  if (ds.act === "dgnone") { DG.sel.clear(); render(); return true; }
  if (ds.act === "dgdel") { if (!t.dataset.c) { t.dataset.c = 1; t.innerHTML = ic("trash") + `Confirmar: excluir ${DG.sel.size}`; return true; } const n = DG.sel.size; if (k === "saude") DG.sel.forEach(d => delete S.saude[d]); else S[k] = S[k].filter(r => !DG.sel.has(String(r.id))); DG.sel.clear(); touch(k, { label: `${n} linha(s) excluída(s)` }); undoToast(`${plural(n, "linha excluída", "linhas excluídas")}`); return true; }
  if (ds.act === "dgdup") { const add = S[k].filter(r => DG.sel.has(String(r.id))).map(r => ({ ...clone(r), id: uid() })); S[k].push(...add); DG.sel.clear(); touch(k, { label: "Linhas duplicadas" }); undoToast(`${plural(add.length, "linha duplicada", "linhas duplicadas")}`); return true; }
  if (ds.act === "dgbulk") { const f = DG.bulkF, raw = $("#dg_bv")?.value ?? "", ty = dsFields(k).find(x => x[0] === f)?.[2]; if (!f) return true; const v = ty === "num" ? (raw === "" ? "" : +raw) : raw;
    if (k === "saude") DG.sel.forEach(d => { S.saude[d] = { ...(S.saude[d] || {}), [f]: v }; }); else S[k].forEach(r => { if (DG.sel.has(String(r.id))) { r[f] = v; r.upd = Date.now(); } });
    const n = DG.sel.size; DG.sel.clear(); DG.bulkF = ""; DG.bulkV = ""; touch(k, { label: `Alterado em ${n} linha(s)` }); undoToast(`${plural(n, "linha alterada", "linhas alteradas")}`); return true; }
  if (ds.act === "dgcsv") { const F = dsFields(k), rows = dsRows(k); saveFile(`atlas-${slug(DSETS[k])}-${TODAY}.csv`, "\uFEFF" + csvBuild(F.map(f => f[1]), rows.map(r => F.map(f => r[f[0]] ?? "")))); return true; }
  return false;
}
function dataChange(t) {
  if (t.dataset.cell) { const [k, id, f] = t.dataset.cell.split("|"), ty = dsFields(k).find(x => x[0] === f)?.[2]; setCell(k, id, f, t.value, ty); return true; }
  if (t.id === "dg_bf") { DG.bulkF = t.value; DG.bulkV = ""; render(); return true; }
  if (t.id === "dg_bv") { DG.bulkV = t.value; return true; }
  if (t.id === "dg_file") { readFile(t).then(f => openImport(SUB && DSETS[SUB] ? SUB : "lanc", csvParse(f.text), f.name)).catch(() => toast("Não consegui ler o arquivo.")); return true; }
  return false;
}

/* ================================================================ importação de CSV com mapeamento de colunas */
const IMP = { k: "", rows: [], head: [], map: {}, fmt: "dmy", inv: false, conta: "", hasHead: true, over: {} };
const BANK_F = [["data", "Data"], ["desc", "Descrição"], ["valor", "Valor (com sinal)"], ["deb", "Débito / saída"], ["cred", "Crédito / entrada"]];
const GUESS = { data: /data|date|fecha|giorno|dt\b|dia/, desc: /descr|hist|memo|causale|detal|estabel|payee|nome|titulo|title/, valor: /valor|amount|importo|montante|value|quantia/, deb: /d[eé]bito|uscit|debit|sa[ií]da|withdraw/, cred: /cr[eé]dito|entrat|credit|entrada|deposit/,
  sono: /sono|sleep/, passos: /passos|steps|passi/, peso: /peso|weight/, humor: /humor|mood/, energia: /energia|energy/, estresse: /estresse|stress/, min: /min/, treino: /treino|workout|exerc/ };
function openImport(k, rows, name) {
  if (!rows.length) { toast("O arquivo está vazio."); return; }
  const first = rows[0], hasHead = first.some(c => c && parseNum(c) == null && !parseDateAny(c));
  Object.assign(IMP, { k, rows, hasHead, head: hasHead ? first : first.map((_, i) => `Coluna ${i + 1}`), name, map: {}, inv: false, conta: k === "lanc" ? CONTAS[0] : "", over: {} });
  const fields = k === "lanc" ? BANK_F : dsFields(k).filter(f => f[2] !== "long" || k === "diario").map(f => [f[0], f[1]]);
  for (const [f, l] of fields) { const rx = GUESS[f] || new RegExp(norm(l).replace(/[^a-z0-9]+/g, ".?").slice(0, 12)); const i = IMP.head.findIndex(h => rx.test(norm(h)) || norm(h) === norm(l) || norm(h) === f); if (i >= 0 && !Object.values(IMP.map).includes(i)) IMP.map[f] = i; }
  const di = IMP.map.data; IMP.fmt = di != null ? guessDateFmt(rows.slice(hasHead ? 1 : 0).map(r => r[di])) : "dmy";
  renderImport();
}
function impRows() {
  const body = IMP.rows.slice(IMP.hasHead ? 1 : 0), M = IMP.map, get = (r, f) => M[f] != null && M[f] !== "" ? r[M[f]] : undefined, out = [];
  if (IMP.k === "lanc") {
    for (const r of body) { const d = parseDateAny(get(r, "data"), IMP.fmt); let v = parseNum(get(r, "valor")); if (v == null) { const db = parseNum(get(r, "deb")), cr = parseNum(get(r, "cred")); v = cr ? Math.abs(cr) : db ? -Math.abs(db) : null; } if (!d || v == null || !v) continue; if (IMP.inv) v = -v;
      const desc = String(get(r, "desc") || "").trim(), tipo = v > 0 ? "Receita" : "Despesa", mkk = merchantKey(desc), cat = IMP.over[tipo + "|" + mkk] || autoCat(desc, tipo) || (tipo === "Receita" ? "Outras receitas" : "Outros");
      const dup = S.lanc.some(l => l.data === d && Math.abs(+l.valor - Math.abs(v)) < .005 && norm(l.desc) === norm(desc));
      out.push({ id: uid(), data: d, tipo, cat, desc, valor: Math.round(Math.abs(v) * 100) / 100, conta: IMP.conta, origem: "extrato", _dup: dup, _mk: mkk, _ov: !!IMP.over[tipo + "|" + mkk] }); }
    return out;
  }
  const F = dsFields(IMP.k);
  for (const r of body) { const o = { id: uid() }; let any = false; for (const [f, , ty] of F) { const raw = get(r, f); if (raw == null || raw === "") continue; any = true; o[f] = ty === "num" ? parseNum(raw) : ty === "date" ? parseDateAny(raw, IMP.fmt) || "" : String(raw).trim(); } if (any) out.push(o); }
  return out;
}
function renderImport() {
  const k = IMP.k, fields = k === "lanc" ? BANK_F : dsFields(k).filter(f => f[2] !== "long" || k === "diario").map(f => [f[0], f[1]]), rows = impRows(), dups = rows.filter(r => r._dup).length;
  const sel = f => `<select data-impmap="${f}" aria-label="Coluna para ${f}"><option value="">—</option>${IMP.head.map((h, i) => `<option value="${i}"${IMP.map[f] === i ? " selected" : ""}>${esc(h || "Coluna " + (i + 1))}</option>`).join("")}</select>`;
  const cols = k === "lanc" ? [["data", "Data"], ["tipo", "Tipo"], ["cat", "Categoria"], ["desc", "Descrição"], ["valor", "Valor"]] : fields;
  $("#dlg").innerHTML = `<form method="dialog" id="impf" class="wide"><h3>Importar ${esc(IMP.name || "arquivo")} → ${esc(DSETS[k])}</h3>
    <div class="form f3">${fields.map(([f, l]) => `<label>${esc(l)}${sel(f)}</label>`).join("")}<label>Formato da data<select id="imp_fmt"><option value="dmy"${IMP.fmt === "dmy" ? " selected" : ""}>dia/mês/ano</option><option value="mdy"${IMP.fmt === "mdy" ? " selected" : ""}>mês/dia/ano</option></select></label>
    ${k === "lanc" ? `<label>Conta<select id="imp_conta">${CONTAS.map(c => `<option${IMP.conta === c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label><label class="chk"><input type="checkbox" id="imp_inv"${IMP.inv ? " checked" : ""}> Gastos vêm positivos (inverter sinal)</label>` : ""}<label class="chk"><input type="checkbox" id="imp_head"${IMP.hasHead ? " checked" : ""}> A primeira linha é cabeçalho</label></div>
    <div class="flbl">Prévia · ${plural(rows.length, "linha válida", "linhas válidas")}${dups ? ` · ${dups} parecem duplicadas e serão ignoradas` : ""}</div>
    <div class="hscroll" style="max-height:260px"><table class="dt"><thead><tr>${cols.map(c => `<th>${esc(c[1])}</th>`).join("")}</tr></thead><tbody>${rows.slice(0, k === "lanc" ? 40 : 12).map(r => `<tr${r._dup ? ' class="dim"' : ""}>${cols.map(([f]) => f === "cat" && k === "lanc" ? `<td><select data-impcat="${esc(r.tipo + "|" + r._mk)}" aria-label="Categoria"${r._mk ? "" : " disabled"}>${(r.tipo === "Receita" ? CAT_REC : Object.keys(CAT_DESP)).map(c => `<option${c === r.cat ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>${r._ov ? `<small class="st-good"> aprendido</small>` : ""}</td>` : `<td>${esc(f === "valor" && k === "lanc" ? eur(r.valor, 2) : r[f] ?? "")}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${cols.length}" class="empty">Nenhuma linha válida com esse mapeamento.</td></tr>`}</tbody></table></div>
    ${k === "lanc" ? `<p class="note">As categorias vêm das suas regras, do seu histórico e de palavras-chave. Corrija uma linha e todas do mesmo estabelecimento acompanham; ao importar, cada correção vira regra para os próximos extratos${Object.keys(IMP.over).length ? ` (${plural(Object.keys(IMP.over).length, "correção", "correções")} agora)` : ""}.</p>` : ""}
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="impcancel">Cancelar</button><button type="button" class="btn primary" id="impok"${rows.length - dups ? "" : " disabled"}>Importar ${rows.length - dups}</button></div></div></form>`;
  const d = $("#dlg"); if (!d.open) d.showModal();
  $("#impcancel").onclick = () => d.close();
  $("#impok").onclick = () => { const add = impRows().filter(r => !r._dup).map(r => { delete r._dup; delete r._mk; delete r._ov; return r; }); let learned = 0; if (k === "lanc") for (const [key, cat] of Object.entries(IMP.over)) { const [tipo, mk] = key.split("|"), ex = add.find(r => r.tipo === tipo && merchantKey(r.desc) === mk); if (ex && learnRule(ex.desc, tipo, cat, true)) learned++; } if (k === "saude") for (const r of add) { const dt = r.data; if (!dt) continue; delete r.id; delete r.data; S.saude[dt] = { ...(S.saude[dt] || {}), ...Object.fromEntries(Object.entries(r).filter(([, v]) => v != null && v !== "")) }; } else S[k].push(...add); d.close(); touch(k, ...(learned ? ["regras"] : []), { label: `Importação: ${add.length} linha(s)` }); undoToast(`${plural(add.length, "linha importada", "linhas importadas")} em ${DSETS[k]}${learned ? ` · ${plural(learned, "regra aprendida", "regras aprendidas")}` : ""}`); };
}
function importChange(t) {
  if (t.dataset.impcat) { IMP.over[t.dataset.impcat] = t.value; renderImport(); return true; }
  if (t.dataset.impmap) { IMP.map[t.dataset.impmap] = t.value === "" ? null : +t.value; renderImport(); return true; }
  if (t.id === "imp_fmt") { IMP.fmt = t.value; renderImport(); return true; }
  if (t.id === "imp_inv") { IMP.inv = t.checked; renderImport(); return true; }
  if (t.id === "imp_conta") { IMP.conta = t.value; return true; }
  if (t.id === "imp_head") { IMP.hasHead = t.checked; IMP.head = t.checked ? IMP.rows[0] : IMP.rows[0].map((_, i) => `Coluna ${i + 1}`); renderImport(); return true; }
  return false;
}

/* ================================================================ Notion (conector do Claude) */
const NT = { status: "?", q: "", res: [], busy: "", pv: null, pq: "", pres: [], err: "" };
function notionErr(e) {
  const c = e?.code, m = { needs_reauth: "Reconecte o Notion em claude.ai › Configurações › Conectores.", server_not_connected: "Adicione o Notion em claude.ai › Configurações › Conectores.", selection_required: "Você tem mais de uma conexão do Notion: escolha qual usar no aviso do Claude.", not_in_manifest: "O Notion não foi permitido para esta página. Libere nas permissões do artefato.", blocked_by_policy: "Sua organização bloqueou essa ação do Notion.", approval_required: "Essa ação do Notion precisa de aprovação da sua organização.", server_unavailable: "O Notion não respondeu agora. Tente de novo em instantes.", tool_error: "O Notion recusou: " + (e?.message || "erro na ferramenta"), not_granted: "O Notion não está liberado nesta visualização.", capability_disabled: "O Notion não está disponível nesta visualização." }[c];
  return m || "Não foi possível falar com o Notion agora.";
}
async function notionStatus() {
  if (!MCP) { NT.status = "off"; return; }
  try { const r = await MCP.listTools("Notion"), s = r.servers?.find(x => x.server === "Notion"); NT.status = !s ? "absent" : s.authStatus === "needs_reauth" ? "reauth" : s.tools?.length ? "ok" : "absent"; NOTION_OK = NT.status === "ok"; }
  catch { NT.status = "unknown"; NOTION_OK = true; }
}
const notionUrl = p => (JSON.stringify(p || "").match(/https:\/\/(?:www\.|app\.)?notion\.(?:so|com)\/[^\s"\\)]+/) || [])[0] || "";
/* o texto da página vem em markdown estendido do Notion, embrulhado em marcações: fica só o conteúdo legível */
function notionText(t) {
  t = String(t || ""); const m = t.match(/<content>([\s\S]*?)<\/content>/); if (m) t = m[1];
  return t.replace(/<\/?[a-z][^>]*>/gi, "").replace(/\{color="[^"]*"\}/g, "").split("\n").map(l => l.replace(/^\t+/, "").trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
async function notionCreate(title, content) {
  if (!MCP) { toast("O Notion não está disponível nesta visualização."); return null; }
  const pai = S.integ?.notion?.pai, input = { pages: [{ properties: { title: String(title).slice(0, 200) }, content: String(content).slice(0, 90000) }] };
  if (pai?.id) input.parent = { page_id: pai.id, type: "page_id" }; else input.creation_mode = "draft";
  toast("Enviando ao Notion…");
  try {
    const r = await MCP.callTool("Notion", "notion-create-pages", input), url = notionUrl(r.payload ?? r.content);
    S.integ.notion.hist = [{ at: Date.now(), titulo: title, url, destino: pai?.title || "rascunho privado" }, ...(S.integ.notion.hist || [])].slice(0, 40);
    touch("integ", { noUndo: true }); toast(`Página criada no Notion${pai?.title ? " em " + pai.title : " como rascunho privado"}`, { l: "Ver em Integrações", f: () => setHash("integ") }); return url;
  } catch (e) { toast(notionErr(e)); return null; }
}
function entryMD(e) { const ctx = dayContext(e.data); return `## ${fmtDY(e.data)}${e.titulo ? " · " + e.titulo : ""}\n${isNum(e.humor) ? `*Humor ${e.humor}/5${isNum(e.energia) ? ` · energia ${e.energia}/5` : ""}*\n` : ""}\n${String(e.texto).replace(/@\[([^\]]+)\]/g, "**$1**").replace(/(^|[\s(])@([\p{L}\p{N}][\p{L}\p{N}_.-]*)/gu, "$1**$2**").replace(/\[\[(?:[^\]:]*:\s*)?([^\]]+)\]\]/g, "*$1*")}\n${ctx.items.length ? `\n> Dados do dia: ${ctx.items.map(i => i[1]).join(" · ")}\n` : ""}`; }
function notionExportEntries(es, title) { es = es.filter(e => !e.cifra); if (!es.length) { toast("Nenhuma entrada para enviar (trancadas não saem do Atlas)."); return; } notionCreate(title, es.sort((a, b) => a.data.localeCompare(b.data)).map(entryMD).join("\n")); }
function monthMD(R) {
  const H = history(2), P = H[0], F = R.fin, ins = insights(R, history(PER)).slice(0, 6);
  return `**Índice de vida:** ${R.indice ?? "–"}/100${isNum(P.indice) && isNum(R.indice) ? ` (${sgn(R.indice - P.indice, v => num(v, 0))} vs ${mlabel(P.mk)})` : ""}\n\n## Áreas\n${R.areas.map(a => `- **${a.a}:** dados ${a.dados ?? "–"} · percepção ${a.perc ?? "–"} · alvo ${a.alvo ?? "–"} — ${a.ind}`).join("\n")}\n\n## Finanças\n- Receitas ${eur(F.rec)} · despesas ${eur(F.desp)} · resultado ${eur(F.res)}\n- Taxa de poupança ${pct(F.taxa)} (meta ${pct(S.cfg.metaPoup)}) · reserva ${R.reserva == null ? "–" : num(R.reserva) + " meses"}\n${R.orcCats.filter(c => c.st === "crit").map(c => `- Acima do orçamento: ${c.cat} (${eur(c.real)} de ${eur(c.plan)})`).join("\n")}\n\n## Saúde\n- Sono ${num(R.sono)} h · humor ${num(R.humor)}/5 · energia ${num(R.energia)}/5 · estresse ${num(R.estresse)}/5 · ${R.treinos} treinos\n\n## Metas\n${R.metas.filter(m => m.ativa).map(m => `- [${m.rt === "Concluída" ? "x" : " "}] ${m.meta} — ${pct(m.prog)} (${m.rt})`).join("\n")}\n\n## O que os dados dizem\n${ins.map(i => `- **${i.k}:** ${i.t.replace(/<[^>]+>/g, "")} ${i.a}`).join("\n")}\n\n## Revisão\n- Vitórias: ${R.rev.vitorias || "–"}\n- O que não funcionou: ${R.rev.naofunc || "–"}\n- Aprendi: ${R.rev.aprendi || "–"}\n- Foco do próximo mês: ${R.rev.foco || "–"}\n`;
}
const tasksMD = R => [...new Set(R.tar.filter(t => t.open).map(t => t.projeto || ""))].map(p => `${p ? `## ${p}\n` : "## Sem projeto\n"}${R.tar.filter(t => t.open && (t.projeto || "") === p).map(t => `- [ ] ${t.tarefa}${t.prazo ? ` (até ${fmtDY(t.prazo)})` : ""}${t.prio === "Alta" ? " **alta**" : ""}${t.meta ? ` — meta: ${t.meta}` : ""}`).join("\n")}`).join("\n\n");
async function notionSearch(q, target) {
  if (!MCP) { toast("O Notion não está disponível nesta visualização."); return; }
  NT.busy = target; NT.err = ""; render();
  try { const r = await MCP.callTool("Notion", "notion-search", { query: q, page_size: 10 }); const res = (r.payload?.results || []).filter(x => x.id); if (target === "pai") NT.pres = res; else NT.res = res; if (!res.length) NT.err = "Nada encontrado com esses termos."; }
  catch (e) { NT.err = notionErr(e); }
  finally { NT.busy = ""; render(); }
}
async function notionPreview(id) {
  NT.busy = "pv"; NT.err = ""; render();
  try { const r = await MCP.callTool("Notion", "notion-fetch", { id }), p = r.payload || {}; const text = notionText(p.text); NT.pv = { id, title: p.title || NT.res.find(x => x.id === id)?.title || "Página do Notion", url: p.url || "", text }; }
  catch (e) { NT.err = notionErr(e); }
  finally { NT.busy = ""; render(); }
}

/* ================================================================ exportações em arquivo */
const fname = s => String(s).replace(/[\\/:*?"<>|#^[\]]+/g, "-").replace(/\s+/g, " ").trim().slice(0, 90) || "sem título";
function exportBackup() { saveFile(`atlas-da-vida-backup-${TODAY}.json`, JSON.stringify({ app: "Atlas da Vida", versao: 3, exportado: new Date().toISOString(), dados: Object.fromEntries(KEYS.map(k => [k, S[k]])) }, null, 1)); }
function exportVault() {
  const files = [], ents = S.diario.map(e => viewEntry(e) || { ...e, titulo: "Entrada trancada", texto: "(cifrada com a senha do cofre)" }).sort((a, b) => a.data.localeCompare(b.data)), name = e => `${e.data}${e.titulo ? " - " + fname(e.titulo) : ""}-${e.id.slice(0, 4)}`;
  const toLinks = t => String(t).replace(/@\[([^\]]+)\]/g, "[[$1]]").replace(/(^|[\s(,;])@([\p{L}\p{N}][\p{L}\p{N}_.-]*[\p{L}\p{N}]|[\p{L}\p{N}])/gu, (m, a, n) => `${a}[[${resolvePerson(n) || n}]]`).replace(/\[\[(?:Meta|Tarefa|Projeto|Livro|Curso|Idioma|Aprendizado|Pessoa|Documento|Doc|Sonho)\s*:\s*([^\]]+)\]\]/gi, "[[$1]]").replace(/^\s*\/(\S+)(.*)$/gm, "> registro: /$1$2");
  for (const e of ents) { const p = parseEntry(e.texto), ctx = dayContext(e.data);
    files.push({ name: `Atlas da Vida/Diário/${name(e)}.md`, data: `---\ndata: ${e.data}\n${e.hora ? `hora: "${e.hora}"\n` : ""}${isNum(e.humor) ? `humor: ${e.humor}\n` : ""}${isNum(e.energia) ? `energia: ${e.energia}\n` : ""}tags: [${p.tags.join(", ")}]\npessoas: [${p.people.map(x => `"[[${x}]]"`).join(", ")}]\nareas: [${p.areas.map(a => `"${a}"`).join(", ")}]\n---\n# ${e.titulo || fmtDL(e.data)}\n\n${toLinks(e.texto)}\n${ctx.items.length ? `\n## Contexto do dia\n${ctx.items.map(i => `- ${i[1]}`).join("\n")}\n` : ""}` }); }
  const R = calcAt(mkey(TODAY));
  for (const p of R.pes) files.push({ name: `Atlas da Vida/Pessoas/${fname(p.nome)}.md`, data: `---\nrelacao: ${p.relacao}\nfrequencia_dias: ${p.freq || ""}\nultimo_contato: ${p.ult || ""}\naniversario: ${p.aniv || ""}\n---\n# ${p.nome}\n\n${p.notas || ""}\n\n## Contatos\n${S.contatos.filter(c => c.pessoa === p.nome).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30).map(c => `- ${c.data} · ${c.tipo}${c.qual ? ` · qualidade ${c.qual}/5` : ""}`).join("\n")}\n` });
  for (const m of R.metas) files.push({ name: `Atlas da Vida/Metas/${fname(m.meta)}.md`, data: `---\narea: "${m.area}"\nstatus: ${m.status}\ninicio: ${m.inicio || ""}\nprazo: ${m.prazo || ""}\nprogresso: ${Math.round(m.prog * 100)}\n---\n# ${m.meta}\n\nRitmo: ${m.rt}. Próximo passo: ${m.proximo || "–"}.\n\n## Tarefas\n${R.tar.filter(t => t.meta === m.meta).map(t => `- [${t.status === "Concluída" ? "x" : " "}] ${t.tarefa}${t.prazo ? ` (${t.prazo})` : ""}`).join("\n")}\n` });
  files.push({ name: "Atlas da Vida/Atlas.md", data: `# Atlas da Vida\n\nExportado em ${fmtDY(TODAY)}.\n\n- ${ents.length} entradas em [[Diário]]\n- ${R.pes.length} pessoas\n- ${R.metas.length} metas\n\n## Mês atual\n${monthMD(R)}` });
  saveFile(`atlas-da-vida-cofre-${TODAY}.zip`, zipFiles(files));
}
function exportCalendar() {
  const R = calcAt(mkey(TODAY)), until = addDays(TODAY, 366), ev = [], us = d => `${d.slice(5, 7)}/${d.slice(8, 10)}/${d.slice(0, 4)}`;
  R.tar.filter(t => t.open && t.prazo && t.prazo >= TODAY && t.prazo <= until).forEach(t => ev.push([`Tarefa: ${t.tarefa}`, t.prazo, [t.projeto && "Projeto: " + t.projeto, t.meta && "Meta: " + t.meta, t.area && "Área: " + t.area, "Prioridade: " + t.prio].filter(Boolean).join(" · ")]));
  R.pes.filter(p => p.prox).forEach(p => ev.push([`Aniversário de ${p.nome}`, p.prox, p.notas || p.relacao]));
  R.docs.filter(d => d.validade && d.validade >= TODAY && d.validade <= until).forEach(d => { ev.push([`Vence: ${d.doc}`, d.validade, d.acao || ""]); const av = addDays(d.validade, -S.cfg.alertaDocs); if (av >= TODAY) ev.push([`Renovar: ${d.doc}`, av, `Vence em ${fmtDY(d.validade)}. ${d.acao || ""}`]); });
  R.metas.filter(m => m.ativa && m.rt !== "Concluída" && m.prazo && m.prazo >= TODAY && m.prazo <= until).forEach(m => ev.push([`Prazo da meta: ${m.meta}`, m.prazo, `${m.area} · progresso ${pct(m.prog)}`]));
  R.rot.filter(r => r.prox && r.prox <= until).forEach(r => ev.push([r.rotina, r.prox < TODAY ? TODAY : r.prox, `Rotina a cada ${r.freq} dias`]));
  S.cand.filter(c => c.dataAcao && c.dataAcao >= TODAY && !["Aceito", "Recusado", "Desisti"].includes(c.etapa)).forEach(c => ev.push([`${c.acao || "Próxima ação"} · ${c.empresa}`, c.dataAcao, `${c.cargo} · etapa: ${c.etapa}`]));
  for (const mid of MIDS) for (const p of mget(mid).plano?.passos || []) if (!p.feito && p.prazo && p.prazo >= TODAY) ev.push([p.texto, p.prazo, `Plano do ${MENTOR_DEF[mid].nome}`]);
  if (!ev.length) { toast("Nada com data para exportar."); return; }
  saveFile(`atlas-agenda-${TODAY}.csv`, csvBuild(["Subject", "Start Date", "Start Time", "End Date", "End Time", "All Day Event", "Description", "Location", "Private"], ev.sort((a, b) => a[1].localeCompare(b[1])).map(([s, d, ds]) => [s, us(d), "", us(d), "", "True", ds, "", "True"])));
}
function exportTodoist() {
  const R = calcAt(mkey(TODAY)), open = R.tar.filter(t => t.open), projs = [...new Set(open.map(t => t.projeto || ""))].sort((a, b) => (a === "") - (b === "") || a.localeCompare(b));
  if (!open.length) { toast("Nenhuma tarefa aberta para exportar."); return; }
  const rows = []; for (const p of projs) { if (p) rows.push(["section", p, "", "", "", "", "", "", "", ""]); for (const t of open.filter(x => (x.projeto || "") === p)) rows.push(["task", t.tarefa, [t.meta && "Meta: " + t.meta, t.area && "Área: " + t.area, t.notas].filter(Boolean).join(" · "), { Alta: 1, Média: 2, Baixa: 3 }[t.prio] || 4, 1, "", "", t.prazo || "", t.prazo ? "en" : "", ""]); }
  saveFile(`atlas-tarefas-todoist-${TODAY}.csv`, csvBuild(["TYPE", "CONTENT", "DESCRIPTION", "PRIORITY", "INDENT", "AUTHOR", "RESPONSIBLE", "DATE", "DATE_LANG", "TIMEZONE"], rows));
}
function importBackup(text) {
  let o; try { o = JSON.parse(text); } catch { toast("Esse arquivo não é um backup válido (JSON)."); return; }
  const d = o?.dados && typeof o.dados === "object" ? o.dados : o; const ks = KEYS.filter(k => k in d);
  if (!ks.length) { toast("Não encontrei dados do Atlas nesse arquivo."); return; }
  $("#dlg").innerHTML = `<form method="dialog"><h3>Restaurar backup</h3><p>O arquivo tem ${ks.length} conjuntos de dados${o.exportado ? `, exportado em ${fmtDY(o.exportado.slice(0, 10))}` : ""}: ${ks.map(k => DSETS[k] || k).join(", ")}.</p><p class="note">Os dados atuais desses conjuntos serão substituídos. Dá para desfazer com Ctrl+Z logo em seguida.</p><div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="bkno">Cancelar</button><button type="button" class="btn primary" id="bkok">Restaurar</button></div></div></form>`;
  const dl = $("#dlg"); dl.showModal(); $("#bkno").onclick = () => dl.close();
  $("#bkok").onclick = () => { const E = EMPTY(); for (const k of ks) S[k] = k === "cfg" ? { ...E.cfg, ...d.cfg } : d[k]; dl.close(); touch(...ks, { label: "Backup restaurado" }); undoToast("Backup restaurado"); };
}
function importPasteTasks() {
  const v = ($("#paste_t")?.value || "").split("\n").map(l => l.replace(/^\s*(?:[-*•]\s*(?:\[[ xX]\]\s*)?|\d+[.)]\s*)/, "").trim()).filter(Boolean);
  if (!v.length) { toast("Cole uma lista com uma tarefa por linha."); return; }
  let n = 0; for (const l of v) { const r = CMD.tarefa.p(l, { date: TODAY, area: "" }); if (r.ok) { r.apply(); n++; } }
  $("#paste_t").value = ""; touch("tarefas", { label: "Tarefas coladas" }); undoToast(`${plural(n, "tarefa criada", "tarefas criadas")}`);
}

/* ================================================================ Integrações */
function pInteg(R) {
  const st = { ok: ["good", "Conectado"], reauth: ["warn", "Precisa reconectar"], absent: ["crit", "Não conectado"], off: ["none", "Indisponível nesta visualização"], unknown: ["none", "Status desconhecido"], "?": ["none", "Verificando…"] }[NT.status] || ["none", "–"];
  const pai = S.integ?.notion?.pai, hist = S.integ?.notion?.hist || [], on = !!MCP && NT.status !== "off";
  const res = (list, act) => list.map(x => `<div class="nres"><div><b>${esc(x.title || "Sem título")}</b><small>${esc([x.type, x.path, x.timestamp && fmtDY(String(x.timestamp).slice(0, 10))].filter(Boolean).join(" · "))}</small>${x.highlight ? `<p>${esc(trunc(String(x.highlight).replace(/\*\*/g, ""), 160))}</p>` : ""}</div><div class="row">${act(x)}</div></div>`).join("");
  return `<p class="lead">O Atlas conversa com outros apps de duas formas: ao vivo com o Notion, pelo conector da sua conta Claude, e por arquivos nos formatos que Google Agenda, Apple Health, Google Fit, Todoist, Obsidian, planilhas e bancos entendem. Onde dá, a troca vai e volta.</p>
  <div class="g2c">${gcPanel()}${pIntegTwoWay(R)}
    ${panel(`${ic("globe")}Notion <span class="pill ${st[0]}">${st[1]}</span>`, `${!on ? `<p class="note">O conector não está disponível nesta visualização. Abra o artefato no Claude com o Notion conectado em Configurações › Conectores.</p>` : ""}
      <div class="flbl">Destino das exportações</div><div class="row wrap"><span class="chip">${pai ? esc(pai.title) : "Rascunho privado (padrão)"}</span>${pai ? `<button type="button" class="lnk" data-act="ntpaiclear">usar rascunho privado</button>` : ""}</div>
      <div class="row"><input id="nt_pq" type="search" placeholder="Buscar página do Notion para usar como destino" value="${esc(NT.pq)}"${on ? "" : " disabled"}><button type="button" class="btn sm" data-act="ntpaisearch"${on ? "" : " disabled"}>${NT.busy === "pai" ? "Buscando…" : "Buscar"}</button></div>
      ${res(NT.pres, x => `<button type="button" class="btn sm" data-ntpai="${esc(x.id)}">Usar como destino</button>`)}
      <div class="flbl">Enviar ao Notion</div><div class="xgrid">${[["ntmonth", "file", "Relatório do mês", mlabel(REF)], ["ntdiary7", "pen", "Diário · 7 dias", "entradas com dados do dia"], ["ntdiary30", "pen", "Diário · 30 dias", "entradas com dados do dia"], ["nttasks", "checksq", "Tarefas abertas", "como lista de caixas"], ["ntplans", "flag", "Planos dos mentores", "foco e passos de cada área"]].map(([a, i, l, s]) => `<button type="button" class="xbtn" data-act="${a}"${on ? "" : " disabled"}>${ic(i)}<span><b>${l}</b><small>${s}</small></span></button>`).join("")}</div>
      <div class="flbl">Trazer do Notion</div><div class="row"><input id="nt_q" type="search" placeholder="Buscar páginas no seu Notion" value="${esc(NT.q)}"${on ? "" : " disabled"}><button type="button" class="btn sm" data-act="ntsearch"${on ? "" : " disabled"}>${NT.busy === "res" ? "Buscando…" : "Buscar"}</button></div>
      ${NT.err ? `<p class="note st-warn">${esc(NT.err)}</p>` : ""}${res(NT.res, x => `<button type="button" class="btn sm" data-ntpv="${esc(x.id)}">${NT.busy === "pv" ? "Abrindo…" : "Ver"}</button>`)}
      ${NT.pv ? `<div class="ntpv"><div class="row"><b>${esc(NT.pv.title)}</b>${NT.pv.url ? `<a class="lnk" href="${esc(NT.pv.url)}" target="_blank" rel="noopener">abrir no Notion</a>` : ""}</div><pre>${esc(trunc(NT.pv.text, 1800))}</pre><div class="row wrap"><button type="button" class="btn sm primary" data-act="ntimpdiary">${ic("pen")}Importar como entrada do diário</button><button type="button" class="btn sm" data-act="ntimptasks"${/- \[ \]/.test(NT.pv.text) ? "" : " disabled"}>${ic("checksq")}Importar caixas abertas como tarefas (${(NT.pv.text.match(/^\s*- \[ \]/gm) || []).length})</button></div></div>` : ""}
      ${hist.length ? `<div class="flbl">Enviados</div><div class="list">${hist.slice(0, 8).map(h => `<div class="li"><div class="t">${esc(h.titulo)}<div class="m">${fmtDY(iso(new Date(h.at)))} · ${esc(h.destino)}</div></div>${h.url ? `<a class="lnk" href="${esc(h.url)}" target="_blank" rel="noopener">abrir</a>` : ""}</div>`).join("")}</div>` : ""}
      <label class="chk"><input type="checkbox" id="cfg_mentorNotion" data-cfg="mentorNotion"${S.cfg.mentorNotion ? " checked" : ""}> Mentores podem buscar no meu Notion durante a conversa</label>`)}
    <div class="stack">${panel(`${ic("download")}Exportar para outros apps`, `<div class="xgrid">${[["xbackup", "box", "Backup completo", "JSON · restaura tudo no Atlas"], ["xvault", "book", "Diário para Obsidian/Logseq", "ZIP de Markdown com [[ligações]]"], ["xcal", "cal", "Agenda para Google Agenda", "CSV · prazos, aniversários, documentos"], ["ixicsout", "cal", "Agenda em .ics", "Apple, Outlook, Google · em .zip"], ["xtodoist", "checksq", "Tarefas para o Todoist", "CSV no modelo de importação"], ["xmonthmd", "file", "Relatório do mês", "Markdown"]].map(([a, i, l, s]) => `<button type="button" class="xbtn" data-act="${a}">${ic(i)}<span><b>${l}</b><small>${s}</small></span></button>`).join("")}<a class="xbtn" href="#dados">${ic("table")}<span><b>Qualquer tabela em CSV</b><small>em Dados, abra o conjunto e exporte</small></span></a></div>${DL ? "" : `<p class="note">Baixar arquivos não está disponível nesta visualização.</p>`}`)}
    ${panel(`${ic("upload")}Importar`, `<div class="xgrid"><label class="xbtn filebtn">${ic("coins")}<span><b>Extrato do banco</b><small>CSV · categoriza e ignora duplicados</small></span><input type="file" id="imp_bank" accept=".csv,text/csv,text/plain" hidden></label><label class="xbtn filebtn">${ic("pulse")}<span><b>Dados de saúde</b><small>CSV de app de sono, passos ou peso</small></span><input type="file" id="imp_health" accept=".csv,text/csv,text/plain" hidden></label><label class="xbtn filebtn">${ic("box")}<span><b>Restaurar backup</b><small>JSON exportado pelo Atlas</small></span><input type="file" id="imp_backup" accept=".json,application/json" hidden></label></div>
      <div class="flbl">Colar lista de tarefas</div><textarea id="paste_t" rows="4" placeholder="Uma por linha. Funciona com listas do Notion, Todoist, Trello ou Markdown (- [ ] item). Prazos como “até 15/10” e “!alta” são reconhecidos."></textarea><div class="row"><button type="button" class="btn sm" data-act="pastetasks">${ic("plus")}Criar tarefas</button></div>`)}</div></div>`;
}
function integClick(t) {
  const a = t.dataset.act, R = calcAt(REF);
  if (a === "ntsearch") { const q = ($("#nt_q")?.value || "").trim(); NT.q = q; if (q) notionSearch(q, "res"); return true; }
  if (a === "ntpaisearch") { const q = ($("#nt_pq")?.value || "").trim(); NT.pq = q; if (q) notionSearch(q, "pai"); return true; }
  if (t.dataset.ntpai) { const x = NT.pres.find(r => r.id === t.dataset.ntpai); if (x) { S.integ.notion.pai = { id: x.id, title: x.title, url: x.url }; NT.pres = []; touch("integ", { label: "Destino do Notion definido" }); } return true; }
  if (a === "ntpaiclear") { S.integ.notion.pai = null; touch("integ", { label: "Destino do Notion: rascunho" }); return true; }
  if (t.dataset.ntpv) { notionPreview(t.dataset.ntpv); return true; }
  if (a === "ntimpdiary" && NT.pv) { S.diario.push({ id: uid(), data: TODAY, hora: nowHM(), titulo: NT.pv.title, texto: NT.pv.text.slice(0, 20000) + (NT.pv.url ? `\n\n[importado do Notion](${NT.pv.url})` : ""), humor: null, energia: null, fixado: false, aplicados: [], criado: Date.now(), editado: Date.now(), origem: "notion" }); touch("diario", { label: "Página do Notion importada" }); undoToast("Página importada para o diário"); return true; }
  if (a === "ntimptasks" && NT.pv) { const ls = NT.pv.text.split("\n").map(l => l.match(/^\s*- \[ \]\s+(.*)$/)).filter(Boolean).map(m => m[1].trim()); let n = 0; for (const l of ls) { const r = CMD.tarefa.p(l, { date: TODAY, area: "" }); if (r.ok) { r.apply(); n++; } } touch("tarefas", { label: "Tarefas do Notion" }); undoToast(`${plural(n, "tarefa importada", "tarefas importadas")} do Notion`); return true; }
  if (a === "ntmonth") { notionCreate(`Atlas da Vida · ${mlabel(REF)}`, monthMD(R)); return true; }
  if (a === "ntdiary7" || a === "ntdiary30") { const n = a === "ntdiary7" ? 7 : 30; notionExportEntries(S.diario.filter(e => e.data >= addDays(TODAY, -n)), `Diário · ${fmtDY(addDays(TODAY, -n))} a ${fmtDY(TODAY)}`); return true; }
  if (a === "nttasks") { notionCreate(`Tarefas abertas · ${fmtDY(TODAY)}`, tasksMD(R)); return true; }
  if (a === "ntplans") { notionCreate(`Planos dos mentores · ${fmtDY(TODAY)}`, MIDS.filter(m => mget(m).plano).map(m => `## ${MENTOR_DEF[m].nome}\n**Foco:** ${mget(m).plano.foco}\n${mget(m).plano.passos.map(p => `- [${p.feito ? "x" : " "}] ${p.texto}${p.prazo ? ` (até ${fmtDY(p.prazo)})` : ""}`).join("\n")}`).join("\n\n") || "Nenhum plano ainda."); return true; }
  if (a === "revnotion") { notionCreate(`Revisão · ${mlabel(REF)}`, monthMD(R)); return true; }
  if (a === "xbackup") { exportBackup(); return true; } if (a === "xvault") { exportVault(); return true; } if (a === "xcal") { exportCalendar(); return true; } if (a === "xtodoist") { exportTodoist(); return true; }
  if (a === "xmonthmd") { saveFile(`atlas-${REF}.md`, `# Atlas da Vida · ${mlabel(REF)}\n\n${monthMD(R)}`); return true; }
  if (a === "pastetasks") { importPasteTasks(); return true; }
  return false;
}
function integChange(t) {
  if (t.id === "imp_bank") { readFile(t).then(f => openImport("lanc", csvParse(f.text), f.name)).catch(() => toast("Não consegui ler o arquivo.")); t.value = ""; return true; }
  if (t.id === "imp_health") { readFile(t).then(f => { const rows = csvParse(f.text); if (isFit(rows)) healthPreview(fitParse(rows)); else openImport("saude", rows, f.name); }).catch(() => toast("Não consegui ler o arquivo.")); t.value = ""; return true; }
  if (t.id === "imp_backup") { readFile(t).then(f => importBackup(f.text)).catch(() => toast("Não consegui ler o arquivo.")); t.value = ""; return true; }
  return false;
}

/* ================================================================ Ajustes */
const LIST_EDIT = [["desp", "Categorias de despesa", "Uma por linha: Categoria | Grupo (Essencial, Estilo de vida ou Crescimento)"], ["rec", "Categorias de receita", "Uma por linha"], ["apo", "Tipos de aporte", "Uma por linha"], ["contas", "Contas e formas de pagamento", "Uma por linha"], ["treinos", "Tipos de treino", "Uma por linha"], ["relacao", "Tipos de relação", "Uma por linha"], ["lazer", "Categorias de lazer", "Uma por linha"], ["aprend", "Tipos de aprendizado", "Uma por linha"]];
function pAjustes(R) {
  const C = S.cfg, theme = (() => { try { return localStorage.getItem("atlas_theme") || "sistema"; } catch { return "sistema"; } })();
  const f = [["nome", "Seu nome", "text"], ["metaPoup", "Meta de taxa de poupança (0–1)", "number"], ["metaReserva", "Reserva de emergência (meses)", "number"], ["metaSono", "Sono (h/noite)", "number"], ["metaTreinos", "Treinos por semana", "number"], ["metaPassos", "Passos por dia", "number"], ["metaEstudo", "Horas de estudo por mês", "number"], ["metaLivros", "Livros no ano", "number"], ["metaLazer", "Horas de lazer por semana", "number"], ["alertaDocs", "Avisar documentos (dias antes)", "number"], ["alertaAniv", "Avisar aniversários (dias antes)", "number"]];
  const listVal = k => k === "desp" ? Object.entries(CAT_DESP).map(([c, g]) => `${c} | ${g}`).join("\n") : ({ rec: CAT_REC, apo: CAT_APO, contas: CONTAS, treinos: TREINOS, relacao: RELACAO, lazer: LAZER_CAT, aprend: APR_TIPOS }[k] || []).join("\n");
  return `<div class="g2c">
    ${panel("Perfil e metas", `<div class="form f2">${f.map(([k, l, t]) => `<label>${l}<input id="cfg_${k}" type="${t}" step="any" data-cfg="${k}" value="${esc(C[k] ?? "")}"></label>`).join("")}<label>Moeda<select id="cfg_moeda" data-cfg="moeda">${["€", "R$", "US$", "£"].map(m => `<option${C.moeda === m ? " selected" : ""}>${m}</option>`).join("")}</select></label></div>`)}
    ${panel("Mentores", `<div class="form f2"><label>Profundidade das respostas<select id="cfg_mentorNivel" data-cfg="mentorNivel">${[["quick", "Rápida (respostas em segundos)"], ["default", "Equilibrada"], ["complex", "Profunda (pensa mais, demora mais)"]].map(([k, l]) => `<option value="${k}"${C.mentorNivel === k ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Tom<select id="cfg_mentorTom" data-cfg="mentorTom">${["Direto e caloroso", "Acolhedor e paciente", "Desafiador e exigente", "Técnico e objetivo"].map(m => `<option${C.mentorTom === m ? " selected" : ""}>${m}</option>`).join("")}</select></label></div><label class="chk"><input type="checkbox" id="cfg_mentorNotion2" data-cfg="mentorNotion"${C.mentorNotion ? " checked" : ""}> Permitir que os mentores busquem no meu Notion</label>
      <p class="note">Acompanhamentos e o Conselho usam um nível acima do escolhido. As conversas usam a sua conta do Claude.</p><div class="row wrap"><button type="button" class="btn sm danger" data-act="memwipe">${ic("trash")}Apagar memória dos mentores</button></div>`)}
    ${panel("Cockpit de Trabalho", `<label class="chk"><input type="checkbox" id="cfg_ckVida" data-cfg="ckVida"${C.ckVida !== false ? " checked" : ""}> Mostrar minhas tarefas do Cockpit no Hoje, no Secretário, na Rotina, no Painel do dia e no Fechamento da semana</label><p class="note">Só as tarefas em que o responsável é você. Concluir fora do Cockpit é o mesmo que concluir nele; mudar prazo continua sendo no Cockpit, por causa das dependências.</p>`)}
    ${panel("Áreas da vida <small>nome exibido, peso no índice e alvo</small>", `<div class="hscroll"><table class="dt"><thead><tr><th>Área</th><th>Nome exibido</th><th class="num">Peso</th><th class="num">Alvo</th><th>No índice</th></tr></thead><tbody>${AREAS.map((a, i) => `<tr><td>${areaDot(a)}${esc(a)}</td><td><input id="ar_l${i}" type="text" data-acfg="${esc(a)}|rotulo" value="${esc(S.areasCfg?.[a]?.rotulo || "")}" placeholder="${esc(AREA_INFO[a].curto)}"></td><td class="num"><select id="ar_p${i}" data-acfg="${esc(a)}|peso">${[0, .5, 1, 1.5, 2, 3].map(v => `<option value="${v}"${apeso(a) === v ? " selected" : ""}>${num(v, v % 1 ? 1 : 0)}×</option>`).join("")}</select></td><td class="num"><input id="ar_a${i}" type="number" min="0" max="10" data-alvo="${esc(a)}" value="${S.alvo[a] ?? ""}" style="width:70px"></td><td><input id="ar_on${i}" type="checkbox" data-acfg="${esc(a)}|ativa"${aativa(a) ? " checked" : ""} aria-label="Contar ${esc(a)} no índice"></td></tr>`).join("")}</tbody></table></div><p class="note">Peso 2× faz a área contar o dobro no Índice de vida; 0× ou desmarcar tira a área do índice (ela continua nos relatórios).</p>`, { cls: "span2" })}
    ${panel("Listas e categorias", `<div class="lists">${LIST_EDIT.map(([k, l, h]) => `<label>${l}<textarea id="ls_${k}" rows="${k === "desp" ? 10 : 5}" data-list="${k}" spellcheck="false">${esc(listVal(k))}</textarea><small class="muted">${h}</small></label>`).join("")}</div><div class="row wrap"><button type="button" class="btn sm primary" data-act="listsave">${ic("check")}Salvar listas</button><button type="button" class="btn sm ghost" data-act="listreset">Restaurar padrão</button></div>`, { cls: "span2" })}
    ${panel("Aparência", `<div class="segs">${[["sistema", "Seguir o sistema"], ["dark", "Escuro"], ["light", "Claro"]].map(([k, l]) => `<button type="button" class="seg" data-theme="${k}" aria-pressed="${theme === k}">${l}</button>`).join("")}</div>`)}
    ${panel("Seus dados", `<p class="muted">${STORE?.kind === "db" ? "Salvos na sua conta, de forma privada: só você vê." : STORE?.kind === "local" ? "Salvos apenas neste navegador. Exporte backups com frequência." : "Conectando ao armazenamento…"}${IS_EXAMPLE ? " Agora você está vendo dados de exemplo." : ""}</p><div class="row wrap"><button type="button" class="btn sm" data-act="xbackup">${ic("download")}Exportar backup</button><button type="button" class="btn sm" id="loadEx">Carregar dados de exemplo</button><button type="button" class="btn sm danger" id="wipe">Apagar tudo e começar do zero</button></div>
      <div class="flbl">Como o índice é calculado</div><p class="muted small">Cada área recebe um placar de 0 a 10: a média dos componentes que têm dados (metas da área no ritmo, hábitos da área em % da meta e até 3 métricas próprias, como taxa de poupança ou contatos em dia). Componente sem dados é ignorado, nunca conta como zero. O índice é a média das áreas, ponderada pelos pesos acima, × 10.</p>`)}</div>`;
}
function settingsClick(t) {
  const a = t.dataset.act;
  if (a === "listsave") { const L = { ...(S.listas || {}) }; for (const [k] of LIST_EDIT) { const v = ($("#ls_" + k)?.value || "").split("\n").map(x => x.trim()).filter(Boolean);
      if (k === "desp") { const o = {}; for (const ln of v) { const [c, g] = ln.split("|").map(x => x.trim()); if (c) o[c] = GRUPOS.find(x => norm(x) === norm(g || "")) || "Estilo de vida"; } if (Object.keys(o).length) L.desp = o; } else if (v.length) L[k] = [...new Set(v)]; }
    S.listas = L; touch("listas", { label: "Listas atualizadas" }); toast("Listas salvas"); return true; }
  if (a === "listreset") { S.listas = DEFAULT_LISTS(); touch("listas", { label: "Listas restauradas" }); undoToast("Listas restauradas ao padrão"); return true; }
  if (a === "memwipe") { if (!t.dataset.c) { t.dataset.c = 1; t.innerHTML = ic("trash") + "Confirmar: apagar tudo dos mentores"; return true; } S.mentores = {}; touch("mentores", { label: "Mentores zerados" }); undoToast("Memória dos mentores apagada"); return true; }
  if (t.dataset.theme) { const v = t.dataset.theme, r = document.documentElement; if (v === "sistema") delete r.dataset.theme; else r.dataset.theme = v; try { v === "sistema" ? localStorage.removeItem("atlas_theme") : localStorage.setItem("atlas_theme", v); } catch {} render(); return true; }
  return false;
}
function settingsChange(t) {
  if (t.dataset.acfg) { const [a, f] = t.dataset.acfg.split("|"), c = S.areasCfg[a] = { ...(S.areasCfg[a] || {}) }; c[f] = f === "ativa" ? t.checked : f === "peso" ? +t.value : t.value.trim(); touch("areasCfg", { label: "Área ajustada" }); return true; }
  return false;
}
