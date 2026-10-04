
/* ================================================================ espaço a dois: diário, orçamento e metas em comum
   Banco compartilhado do artefato: dupla/<id> é o perfil de cada pessoa; tudo abaixo de dupla/<id>/ só o próprio
   escreve (regra {self}); as duas pessoas leem tudo. O Atlas privado de cada um continua em data/users/<id>. */
const DUO = { started: false, ready: false, err: "", db: null, user: null, me: null, members: {}, docs: { diario: {}, gastos: {}, metas: {}, aportes: {} }, subs: [], msubs: {}, prof: {}, q: Promise.resolve(), mes: mkey(TODAY), humor: null, demo: false, f: {} };
const DUO_CATS = ["Mercado", "Casa", "Restaurantes & passeios", "Viagens", "Contas", "Presentes", "Outros"];
const DUO_SPLIT = [[0.5, "meio a meio"], [1, "só meu"], [0, "pela outra pessoa"]];
async function duoInit() {
  if (DUO.started) return; DUO.started = true;
  try {
    const db = await window.claude?.use?.("db"), user = db ? await window.claude.use("user") : null, me = user ? await user.id() : null;
    if (!db || !me) { DUO.err = "indisponivel"; render(); return; }
    Object.assign(DUO, { db, user, me });
    try { DUO.canW = await user.can("data.write"); } catch { DUO.canW = null; }   // null = a plataforma não disse; aí a escrita recusada decide
    DUO.subs.push(db.collection("dupla").onSnapshot(s => { const m = {}; s.docs.forEach(d => { const v = d.data(); if (v) m[d.id] = v; }); DUO.members = m; duoWatchMembers(); DUO.ready = true; duoProfiles(); duoPaint(); }, e => { DUO.err = e?.code || "erro"; duoPaint(); }));
  } catch (e) { DUO.err = e?.code || "erro"; render(); }
}
function duoWatchMembers() {
  const since = addMonth(mkey(TODAY), -6);
  for (const id of Object.keys(DUO.members)) {
    if (DUO.msubs[id]) continue; DUO.msubs[id] = [];
    for (const kind of ["diario", "gastos", "aportes"]) DUO.msubs[id].push(DUO.db.collection(`dupla/${id}/${kind}`).where("mes", ">=", since).onSnapshot(s => { DUO.docs[kind][id] = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); duoPaint(); }, () => {}));
    DUO.msubs[id].push(DUO.db.collection(`dupla/${id}/metas`).onSnapshot(s => { DUO.docs.metas[id] = Object.fromEntries(s.docs.map(d => [d.id, d.data()])); duoPaint(); }, () => {}));
  }
}
async function duoProfiles() { if (!DUO.user) return; try { const ids = [...new Set([DUO.me, ...Object.keys(DUO.members)])]; DUO.prof = await DUO.user.profiles(ids); duoPaint(); } catch {} }
const duoPaint = debounce(() => { if (PAGE === "dupla") render(); }, 60);
const duoName = id => id === DUO.me || id === "eu" ? "Você" : id === "demo" ? "Chiara (exemplo)" : DUO.prof[id]?.name || "Outra pessoa";
const duoAv = id => DUO.prof[id]?.avatarUrl ? `<img class="duav" src="${esc(DUO.prof[id].avatarUrl)}" alt="">` : `<span class="duav dot" style="--c:${id === DUO.me ? "var(--accent)" : "var(--a-amo)"}">${esc(duoName(id).slice(0, 1))}</span>`;
const duoJoined = () => !!DUO.members[DUO.me];
/* uma escrita por vez, sempre no documento do próprio mês */
function duoWrite(path, fn) {
  DUO.q = DUO.q.then(async () => { try { const ref = DUO.db.doc(path), cur = (await ref.get()).data() || {}; await ref.set(fn(cur)); } catch (e) { toast(e?.code === "invalid_argument" ? "Sem permissão para escrever no espaço a dois. Peça a quem compartilhou: Colaborador(a), se vocês estão na mesma organização do Claude; Editor(a) por convite de e-mail (sem link público), se não estão." : e?.code === "quota_exceeded" ? "O espaço compartilhado encheu." : "Não consegui salvar no espaço a dois. Tente de novo."); } });
  return DUO.q;
}
const duoItems = kind => { const out = []; for (const [uid, ms] of Object.entries(DUO.demo || DUO.preview ? DUO_DEMO()[kind] : DUO.docs[kind])) for (const d of Object.values(ms || {})) for (const it of d?.itens || []) out.push({ ...it, autor: uid }); return out; };
const duoMetas = () => { const out = []; for (const [uid, ms] of Object.entries(DUO.demo || DUO.preview ? DUO_DEMO().metas : DUO.docs.metas)) for (const [id, m] of Object.entries(ms || {})) if (m) out.push({ ...m, id, autor: uid, key: `${uid}:${id}` }); return out; };
function DUO_DEMO() {
  return memo("duodemo", () => { const me = DUO.me || "eu", m = mkey(TODAY), it = (d, t, h) => ({ id: uid(), data: addDays(TODAY, -d), texto: t, humor: h, at: Date.now() - d * 864e5 });
    return { diario: { [me]: { [m]: { mes: m, itens: [it(1, "Jantar em casa com a @Chiara, sem celular na mesa. A melhor conversa da semana.", 5), it(6, "Discutimos por causa da louça. Combinamos uma escala.", 3)] } }, demo: { [m]: { mes: m, itens: [it(2, "Gostei de planejar a viagem juntos. Quero repetir o domingo sem pressa.", 5), it(5, "Semana corrida, quase não nos vimos. Sinto falta.", 2)] } } },
      gastos: { [me]: { [m]: { mes: m, itens: [{ id: uid(), data: addDays(TODAY, -3), desc: "Mercado da semana", valor: 84.3, cat: "Mercado", parte: .5 }, { id: uid(), data: addDays(TODAY, -8), desc: "Cinema", valor: 22, cat: "Restaurantes & passeios", parte: .5 }] } }, demo: { [m]: { mes: m, itens: [{ id: uid(), data: addDays(TODAY, -2), desc: "Luz", valor: 61.2, cat: "Contas", parte: .5 }, { id: uid(), data: addDays(TODAY, -5), desc: "Pizza de sexta", valor: 28, cat: "Restaurantes & passeios", parte: .5 }] } } },
      metas: { demo: { g1: { titulo: "Viagem para a Sicília", tipo: "valor", alvo: 1200, un: "€", prazo: addDays(TODAY, 120), criado: Date.now() } }, [me]: { g2: { titulo: "Um jantar sem celular por semana", tipo: "marco", alvo: "", un: "", prazo: "", criado: Date.now() } } },
      aportes: { [me]: { [m]: { mes: m, itens: [{ id: uid(), meta: "demo:g1", valor: 300, data: addDays(TODAY, -10) }] } }, demo: { [m]: { mes: m, itens: [{ id: uid(), meta: "demo:g1", valor: 250, data: addDays(TODAY, -4) }] } } }, membros: { [me]: { consenteMentor: true }, demo: { consenteMentor: false } } }; });
}
const duoMembers = () => DUO.demo || DUO.preview ? DUO_DEMO().membros : DUO.members;
function duoBalance(mk) {
  const its = duoItems("gastos").filter(g => mkey(g.data || "") === mk), ids = Object.keys(duoMembers()); if (ids.length < 2) return null;
  const [a, b] = ids.includes(DUO.me || "eu") ? [DUO.me || "eu", ids.find(x => x !== (DUO.me || "eu"))] : ids;
  let bal = 0; for (const g of its) { const p = isNum(g.parte) ? +g.parte : .5, other = (1 - p) * (+g.valor || 0); if (g.autor === a) bal += other; else if (g.autor === b) bal -= other; }
  return { a, b, bal, tot: sum(its.map(g => g.valor)), pa: sum(its.filter(g => g.autor === a).map(g => g.valor)), pb: sum(its.filter(g => g.autor === b).map(g => g.valor)) };
}
function pDupla(R) {
  if (!DUO.started) duoInit();
  DUO.demo = DUO.err === "indisponivel";
  const live = DUO.ready && !DUO.err, mem = duoMembers(), ids = Object.keys(mem), joined = DUO.demo || duoJoined(), cons = !!mem[DUO.me || "eu"]?.consenteMentor;
  const head = `<div class="duohead pn"><div class="duomem">${(DUO.demo ? Object.keys(DUO_DEMO().membros) : ids.length ? ids : [DUO.me]).filter(Boolean).map(id => `<span class="duochip">${duoAv(id)}<b>${esc(duoName(id))}</b>${(DUO.demo ? DUO_DEMO().membros : DUO.members)[id]?.consenteMentor ? `<em ${tip("Autorizou o Mentor do Amor a ler o que escreve aqui")}>${ic("spark")}mentor</em>` : ""}</span>`).join("")}</div>
    ${DUO.demo ? `<p class="note">${ic("info")}<span>${DUO.err === "indisponivel" ? "O espaço compartilhado precisa do Atlas aberto no Claude, com a sua conta. " : ""}Abaixo, um exemplo de como fica. Os nomes e textos são fictícios.</span></p>`
      : DUO.canW === false && !joined ? `<p class="note st-warn">${ic("lock")}<span>Seu acesso a este Atlas é só de leitura: você vê o que estiver aqui, mas não consegue entrar nem escrever. Peça a quem compartilhou: Colaborador(a), se vocês estão na mesma organização do Claude; Editor(a) por convite de e-mail (sem link público), se não estão.</span></p>`
      : !joined ? `<p>Cada pessoa continua com o próprio Atlas, privado. Este espaço é o único lugar em comum: um diário a dois, um orçamento compartilhado e metas do casal.</p><div class="row wrap"><button type="button" class="btn primary" data-act="duojoin">${ic("duo")}Entrar no espaço a dois</button></div>`
      : `<div class="row wrap"><label class="chk"><input type="checkbox" id="duo_cons"${cons ? " checked" : ""}> Deixar o Mentor do Amor ler o que eu escrevo aqui</label>${ids.length < 2 ? `<span class="muted small">Falta a outra pessoa: compartilhe este Atlas com ela pelo menu Compartilhar (Colaborador(a) se ela for da sua organização no Claude; se não for, convite por e-mail como Editor(a), sem link público) e peça para ela abrir esta página e entrar.</span>` : ""}</div>`}
    <p class="muted small">${ic("shield")}Só entra aqui o que cada um posta. O mentor lê os textos de quem autorizou, e cada leitura aparece no registro de Privacidade.</p></div>`;
  if (!DUO.demo && !live) return head + `<div class="emptyb">${ic("clock")}<b>${DUO.err ? "Não consegui abrir o espaço compartilhado." : "Conectando ao espaço a dois…"}</b><span>${DUO.err ? "Recarregue a página. Se continuar, o armazenamento compartilhado pode não estar disponível nesta visualização." : ""}</span></div>`;
  const tab = SUB || "diario", ro = !DUO.demo && (!joined || DUO.canW === false);
  /* espaço ainda vazio: mostra como fica, com dados de exemplo marcados */
  const empty = !DUO.demo && !["diario", "gastos", "aportes"].some(k => Object.values(DUO.docs[k]).some(ms => Object.values(ms || {}).some(d => d?.itens?.length))) && !Object.values(DUO.docs.metas).some(ms => Object.keys(ms || {}).length);
  const body = () => tab === "orcamento" ? duoBudget(ro || DUO.preview) : tab === "metas" ? duoGoals(ro || DUO.preview) : duoDiary(ro || DUO.preview);
  if (!empty) return head + body();
  const own = joined ? body() : ""; DUO.preview = true; let prev; try { prev = body(); } finally { DUO.preview = false; }
  return head + own + `<div class="duoprev"><div class="flbl">Como fica quando vocês usarem (exemplo fictício)</div>${prev}</div>`;
}
function duoDiary(ro) {
  const its = duoItems("diario").sort((a, b) => (b.data + (b.at || "")).localeCompare(a.data + (a.at || "")));
  return `<div class="g2c">${ro ? "" : panel(`${ic("pen")}Escrever a dois`, `<textarea id="duo_txt" rows="4" placeholder="Algo que aconteceu entre vocês, um agradecimento, uma conversa importante…">${esc(DUO.f.duo_txt || "")}</textarea><div class="row wrap"><span class="flbl">Como você ficou</span><div class="mchips">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="mchip m${n}" data-duoh="${n}" aria-pressed="${DUO.humor === n}">${n}</button>`).join("")}</div><button type="button" class="btn primary" data-act="duopost"${DUO.demo ? " disabled" : ""}>${ic("send")}Compartilhar</button></div>`, { cls: "span2" })}
    ${panel(`${ic("duo")}Diário a dois <small>${plural(its.length, "entrada", "entradas")} · últimos 6 meses</small>`, its.length ? `<div class="duofeed">${its.map(x => `<article class="duoent${x.autor === (DUO.me || "eu") ? " mine" : ""}">${duoAv(x.autor)}<div><header><b>${esc(duoName(x.autor))}</b><small>${fmtDL(x.data)}</small>${isNum(x.humor) ? `<i class="md m${x.humor}">${x.humor}</i>` : ""}${x.autor === DUO.me && !DUO.demo && !DUO.preview ? `<button type="button" class="vb" data-duodel="diario|${x.id}|${mkey(x.data)}" aria-label="Apagar">${ic("trash")}</button>` : ""}</header><div class="ent-body">${renderEntry({ id: "duo_" + x.id, data: x.data, texto: x.texto, aplicados: [] }, { ro: true })}</div></div></article>`).join("")}</div>` : `<div class="empty">Ainda não há nada aqui. A primeira entrada pode ser só um “obrigado por ontem”.</div>`, { cls: "span2" })}</div>`;
}
function duoBudget(ro) {
  const mk = DUO.mes, its = duoItems("gastos").filter(g => mkey(g.data || "") === mk).sort((a, b) => b.data.localeCompare(a.data)), B = duoBalance(mk), cats = {};
  its.forEach(g => cats[g.cat] = (cats[g.cat] || 0) + (+g.valor || 0));
  const bal = B ? (Math.abs(B.bal) < .01 ? "Vocês estão quites neste mês." : `${duoName(B.bal > 0 ? B.b : B.a)} deve ${eur(Math.abs(B.bal), 2)} para ${duoName(B.bal > 0 ? B.a : B.b)}.`) : "O acerto aparece quando as duas pessoas estiverem no espaço.";
  return `<div class="g2c">${ro ? "" : panel(`${ic("plus")}Novo gasto em comum`, `<div class="form f3"><label>Data<input id="dg_data" type="date" value="${esc(DUO.f.dg_data || TODAY)}"></label><label>Descrição<input id="dg_desc" placeholder="Mercado da semana" value="${esc(DUO.f.dg_desc || "")}"></label><label>Valor<input id="dg_valor" type="number" step="0.01" min="0" value="${esc(DUO.f.dg_valor || "")}"></label><label>Categoria<select id="dg_cat">${DUO_CATS.map(c => `<option${DUO.f.dg_cat === c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select></label><label>Divisão<select id="dg_parte">${DUO_SPLIT.map(([v, l]) => `<option value="${v}"${DUO.f.dg_parte === String(v) ? " selected" : ""}>${l}</option>`).join("")}</select></label></div><div class="row"><button type="button" class="btn primary" data-act="duogasto"${DUO.demo ? " disabled" : ""}>${ic("check")}Adicionar</button></div>`)}
    ${panel(`${ic("coins")}Acerto de ${mlabel(mk)} <span class="row"><button type="button" class="iconbtn" data-duomes="-1" aria-label="Mês anterior">‹</button><button type="button" class="iconbtn" data-duomes="1" aria-label="Próximo mês"${mk >= mkey(TODAY) ? " disabled" : ""}>›</button></span>`, `<div class="kms3">${kmini("var(--accent)", "Total do mês", eur(B?.tot ?? sum(its.map(g => g.valor)), 2), plural(its.length, "gasto", "gastos"))}${B ? kmini("var(--a-fin)", `Pago por ${esc(duoName(B.a))}`, eur(B.pa, 2), "") + kmini("var(--a-amo)", `Pago por ${esc(duoName(B.b))}`, eur(B.pb, 2), "") : ""}</div><p class="duobal">${esc(bal)}</p>${Object.keys(cats).length ? donut(Object.entries(cats).map(([c, v], i) => ({ l: c, v, color: CH_COLS[i % CH_COLS.length] })), eur(sum(Object.values(cats))), "no mês") : ""}`)}
    ${panel(`${ic("list")}Gastos de ${mlabel(mk)}`, its.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Data</th><th>Quem pagou</th><th>Descrição</th><th>Categoria</th><th>Divisão</th><th class="num">Valor</th><th></th></tr></thead><tbody>${its.map(g => `<tr><td>${fmtD(g.data)}</td><td>${esc(duoName(g.autor))}</td><td>${esc(g.desc)}</td><td>${esc(g.cat)}</td><td>${esc(DUO_SPLIT.find(s => s[0] === +g.parte)?.[1] || "meio a meio")}</td><td class="num">${eur(+g.valor, 2)}</td><td>${g.autor === DUO.me && !DUO.demo && !DUO.preview ? `<button type="button" class="vb" data-duodel="gastos|${g.id}|${mkey(g.data)}" aria-label="Apagar">${ic("trash")}</button>` : ""}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhum gasto em comum neste mês.</div>`, { cls: "span2" })}</div>`;
}
function duoGoals(ro) {
  const ms = duoMetas(), ap = duoItems("aportes");
  return `<div class="g2c">${ro ? "" : panel(`${ic("plus")}Nova meta a dois`, `<div class="form f3"><label class="full">Meta<input id="dm_t" placeholder="Viagem para a Sicília" value="${esc(DUO.f.dm_t || "")}"></label><label>Tipo<select id="dm_tipo"><option value="valor">Juntar um valor</option><option value="marco"${DUO.f.dm_tipo === "marco" ? " selected" : ""}>Um marco (feito ou não)</option></select></label><label>Alvo<input id="dm_alvo" type="number" step="any" min="0" placeholder="1200" value="${esc(DUO.f.dm_alvo || "")}"></label><label>Unidade<input id="dm_un" value="${esc(DUO.f.dm_un ?? cur())}"></label><label>Prazo<input id="dm_prazo" type="date" value="${esc(DUO.f.dm_prazo || "")}"></label></div><div class="row"><button type="button" class="btn primary" data-act="duometa"${DUO.demo ? " disabled" : ""}>${ic("check")}Criar meta</button></div>`)}
    ${ms.length ? ms.map(m => { const cs = ap.filter(a => a.meta === m.key), tot = sum(cs.map(a => a.valor)), prog = m.tipo === "marco" ? (cs.length || m.feito ? 1 : 0) : +m.alvo ? clamp(tot / +m.alvo) : 0, by = {}; cs.forEach(c => by[c.autor] = (by[c.autor] || 0) + (+c.valor || 0));
      return panel(`${ic("target")}${esc(m.titulo)} <small>criada por ${esc(duoName(m.autor))}${m.prazo ? ` · até ${fmtDY(m.prazo)}` : ""}</small>`, `<div class="dwrow">${ring(prog, "var(--a-amo)", 70, 8)}<div><div class="kv">${pct(prog)}</div><div class="muted">${m.tipo === "marco" ? (prog ? "feito" : "ainda não") : `${num(tot, 0)} de ${num(+m.alvo, 0)} ${esc(m.un || "")}`}</div><div class="muted small">${Object.entries(by).map(([u, v]) => `${esc(duoName(u))}: ${num(v, 0)}`).join(" · ")}</div></div></div>
        ${ro || DUO.demo ? "" : m.tipo === "marco" ? (prog ? "" : `<button type="button" class="btn sm" data-duoap="${esc(m.key)}|1">${ic("check")}Marcar como feito</button>`) : `<div class="row"><input id="ap_${slug(m.key)}" type="number" step="any" min="0" placeholder="Quanto?" aria-label="Contribuição"><button type="button" class="btn sm" data-duoap="${esc(m.key)}">${ic("plus")}Contribuir</button></div>`}`); }).join("") : panel(`${ic("target")}Metas a dois`, `<div class="empty">Nenhuma meta em comum ainda.</div>`)}</div>`;
}
async function duoShareEntry(id) {
  const e = viewEntry(S.diario.find(x => x.id === id)); if (!e || !DUO.ready || !duoJoined()) { toast("Entre no espaço a dois primeiro (menu A dois)."); return; }
  const mk = mkey(e.data), item = { id: uid(), data: e.data, texto: String(e.texto || "").replace(/^\s*\/.*$/gm, "").trim().slice(0, 8000), humor: e.humor ?? null, at: Date.now(), origem: "diario" };
  await duoWrite(`dupla/${DUO.me}/diario/${mk}`, cur => ({ mes: mk, itens: [...(cur.itens || []), item] }));
  toast("Compartilhado no espaço a dois", { l: "Desfazer", f: () => duoWrite(`dupla/${DUO.me}/diario/${mk}`, cur => ({ mes: mk, itens: (cur.itens || []).filter(x => x.id !== item.id) })) });
}
/* o que o Mentor do Amor pode ler do espaço: só textos de quem autorizou */
function duoFacts() {
  if (!DUO.ready || DUO.demo) return []; const ok = new Set(Object.entries(DUO.members).filter(([, m]) => m?.consenteMentor).map(([id]) => id)); if (!ok.size) return ["Espaço a dois: nenhuma das pessoas autorizou o mentor a ler o espaço compartilhado."];
  const es = duoItems("diario").filter(x => ok.has(x.autor) && x.data >= addDays(TODAY, -45)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 12), ms = duoMetas(), B = duoBalance(mkey(TODAY));
  aiNote("ferr", `espaço a dois: ${plural(es.length, "entrada", "entradas")} de quem autorizou`);
  const L = [`Espaço a dois (compartilhado com a parceria; só textos de quem autorizou: ${[...ok].map(duoName).join(", ")}):`];
  if (es.length) L.push(es.map(x => `- ${fmtD(x.data)}, ${duoName(x.autor)}${isNum(x.humor) ? ` (humor ${x.humor})` : ""}: ${trunc(x.texto, 260)}`).join("\n"));
  if (ms.length) L.push("Metas a dois: " + ms.map(m => m.titulo).join("; "));
  if (B && aiAreaOk("Finanças")) L.push(`Orçamento comum do mês: ${eur(B.tot)} no total.`);
  return L;
}
function duoClick(t) {
  const ds = t.dataset, a = ds.act;
  if (a === "duojoin") { if (!DUO.db || !DUO.me) return true; DUO.db.doc(`dupla/${DUO.me}`).set({ consenteMentor: false, entrou: TODAY, at: Date.now() }).then(() => toast("Você entrou no espaço a dois")).catch(e => toast(e?.code === "invalid_argument" ? "Sem permissão para escrever no espaço a dois. Peça a quem compartilhou: Colaborador(a), se vocês estão na mesma organização do Claude; Editor(a) por convite de e-mail (sem link público), se não estão." : "Não consegui entrar agora.")); return true; }
  if (ds.duoh) { DUO.humor = DUO.humor === +ds.duoh ? null : +ds.duoh; render(); return true; }
  if (a === "duopost") { const tx = ($("#duo_txt")?.value || "").trim(); if (!tx) { toast("Escreva algo para compartilhar."); return true; } const mk = mkey(TODAY), item = { id: uid(), data: TODAY, texto: tx.slice(0, 8000), humor: DUO.humor, at: Date.now() }; DUO.humor = null; duoWrite(`dupla/${DUO.me}/diario/${mk}`, cur => ({ mes: mk, itens: [...(cur.itens || []), item] })).then(() => { DUO.f.duo_txt = ""; const el = $("#duo_txt"); if (el) el.value = ""; toast("Compartilhado"); }); return true; }
  if (a === "duogasto") { const v = parseNum($("#dg_valor")?.value), desc = ($("#dg_desc")?.value || "").trim(), d = $("#dg_data")?.value || TODAY; if (!v || v <= 0 || !desc) { toast("Preencha descrição e valor."); return true; } const mk = mkey(d), item = { id: uid(), data: d, desc, valor: Math.round(v * 100) / 100, cat: $("#dg_cat")?.value || "Outros", parte: +($("#dg_parte")?.value ?? .5), at: Date.now() }; duoWrite(`dupla/${DUO.me}/gastos/${mk}`, cur => ({ mes: mk, itens: [...(cur.itens || []), item] })).then(() => { DUO.f.dg_desc = DUO.f.dg_valor = ""; ["dg_desc", "dg_valor"].forEach(i => { const el = $("#" + i); if (el) el.value = ""; }); toast("Gasto em comum adicionado"); }); return true; }
  if (a === "duometa") { const t0 = ($("#dm_t")?.value || "").trim(); if (!t0) { toast("Dê um nome à meta."); return true; } const id = uid(); DUO.db.doc(`dupla/${DUO.me}/metas/${id}`).set({ titulo: t0, tipo: $("#dm_tipo")?.value || "valor", alvo: parseNum($("#dm_alvo")?.value) || "", un: ($("#dm_un")?.value || "").trim(), prazo: $("#dm_prazo")?.value || "", criado: Date.now() }).then(() => { DUO.f = { ...DUO.f, dm_t: "", dm_alvo: "", dm_prazo: "" }; toast("Meta a dois criada"); }).catch(() => toast("Não consegui criar a meta.")); return true; }
  if (ds.duoap) { const [key, fixed] = ds.duoap.split("|"), v = fixed ? 1 : parseNum($("#ap_" + slug(key))?.value); if (!v || v <= 0) { toast("Informe um valor."); return true; } const mk = mkey(TODAY); duoWrite(`dupla/${DUO.me}/aportes/${mk}`, cur => ({ mes: mk, itens: [...(cur.itens || []), { id: uid(), meta: key, valor: v, data: TODAY }] })).then(() => toast(fixed ? "Marcado como feito" : "Contribuição registrada")); return true; }
  if (ds.duodel) { const [kind, id, mk] = ds.duodel.split("|"); duoWrite(`dupla/${DUO.me}/${kind}/${mk}`, cur => ({ mes: mk, itens: (cur.itens || []).filter(x => x.id !== id) })).then(() => toast("Apagado")); return true; }
  if (ds.duomes) { DUO.mes = addMonth(DUO.mes, +ds.duomes); render(); return true; }
  return false;
}
/* o que se digita nos formulários do espaço fica guardado: tocar no humor ou trocar o mês redesenha a página sem perder o texto */
function duoInput(t) { if (/^(duo_txt|dg_|dm_)/.test(t.id || "")) { DUO.f[t.id] = t.value; return true; } return false; }
function duoChange(t) {
  if (t.id === "duo_cons") { if (!DUO.db || !DUO.me) return true; DUO.db.doc(`dupla/${DUO.me}`).update({ consenteMentor: t.checked, at: Date.now() }).then(() => toast(t.checked ? "O Mentor do Amor pode ler o que você escreve no espaço a dois" : "O mentor não lê mais o que você escreve aqui")).catch(() => toast("Não consegui salvar a preferência.")); return true; }
  return false;
}
