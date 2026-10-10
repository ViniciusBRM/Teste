
/* ================================================================ privacidade: cofre com senha, “sem IA” e registro do que a IA leu */
const COFRE = { key: null, plain: new Map(), busy: false, err: "", msg: "" };
const cryptoOk = () => !!(window.crypto && crypto.subtle && crypto.getRandomValues);
function b64(buf) { const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey("raw", ENC.encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function sealWith(key, obj) { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENC.encode(JSON.stringify(obj))); return { iv: b64(iv), ct: b64(ct) }; }
async function openWith(key, box) { const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv) }, key, unb64(box.ct)); return JSON.parse(new TextDecoder().decode(pt)); }
/* entrada como deve aparecer na tela: trancada e fechada = null; trancada e aberta nesta sessão = com o texto em memória */
const viewEntry = e => !e?.cifra ? e : COFRE.plain.has(e.id) ? { ...e, ...COFRE.plain.get(e.id), _aberta: true } : null;
async function cofreCreate(pass) {
  if (!cryptoOk()) throw new Error("sem-cripto");
  const salt = crypto.getRandomValues(new Uint8Array(16)), iter = 310000, key = await deriveKey(pass, salt, iter);
  S.priv.cofre = { salt: b64(salt), iter, check: await sealWith(key, { ok: "atlas" }), criado: TODAY };
  COFRE.key = key; touch("priv", { label: "Cofre criado", noUndo: true });
}
async function cofreUnlock(pass) {
  const c = S.priv?.cofre; if (!c || !cryptoOk()) return false;
  try { const key = await deriveKey(pass, unb64(c.salt), c.iter), v = await openWith(key, c.check); if (v?.ok !== "atlas") return false; COFRE.key = key; await cofreDecryptAll(); return true; }
  catch { return false; }
}
async function cofreDecryptAll() {
  let falhas = 0; for (const e of S.diario) if (e.cifra && !COFRE.plain.has(e.id)) { try { COFRE.plain.set(e.id, await openWith(COFRE.key, e.cifra)); } catch { falhas++; } }
  /* uma entrada que não abre com esta senha (cifrada com outra ou corrompida) não some calada */
  if (falhas) toast(`${plural(falhas, "entrada protegida não abriu", "entradas protegidas não abriram")} com esta senha`); return falhas;
}
function cofreLock() { COFRE.key = null; COFRE.plain.clear(); if (DIA.draft?.lock) { DIA.draft = null; storeDraft(); } render(); toast("Cofre trancado: as entradas protegidas sumiram da tela"); }
async function sealEntry(e, plain) { e.cifra = await sealWith(COFRE.key, { titulo: plain.titulo || "", texto: plain.texto || "" }); e.titulo = ""; e.texto = ""; e.semIA = true; COFRE.plain.set(e.id, { titulo: plain.titulo || "", texto: plain.texto || "" }); }
async function lockEntry(id) {
  const e = S.diario.find(x => x.id === id); if (!e || e.cifra) return;
  if (!COFRE.key) { toast(S.priv?.cofre ? "Destranque o cofre em Privacidade para trancar entradas." : "Crie o cofre em Privacidade primeiro."); setHash("privacidade"); return; }
  await sealEntry(e, { titulo: e.titulo, texto: e.texto }); touch("diario", { label: "Entrada trancada", noUndo: true }); toast("Entrada trancada com a sua senha");
}
async function unlockEntryForGood(id) {
  const e = S.diario.find(x => x.id === id); if (!e?.cifra || !COFRE.key) return;
  const p = COFRE.plain.get(e.id) || await openWith(COFRE.key, e.cifra); e.titulo = p.titulo; e.texto = p.texto; delete e.cifra; COFRE.plain.delete(e.id);
  touch("diario", { label: "Entrada destrancada" }); toast("Entrada destrancada (continua fora da IA até você mudar)");
}
async function cofreChange(oldp, newp) {
  if (!(await cofreUnlock(oldp))) return "A senha atual não confere.";
  const salt = crypto.getRandomValues(new Uint8Array(16)), iter = 310000, key = await deriveKey(newp, salt, iter);
  for (const e of S.diario) if (e.cifra) { const p = COFRE.plain.get(e.id) || await openWith(COFRE.key, e.cifra); e.cifra = await sealWith(key, p); }
  S.priv.cofre = { salt: b64(salt), iter, check: await sealWith(key, { ok: "atlas" }), criado: S.priv.cofre.criado, trocada: TODAY };
  COFRE.key = key; touch("priv", "diario", { label: "Senha do cofre trocada", noUndo: true }); return "";
}

/* ---------------------------------------------------------------- o que pode ir para a IA */
const semIA = () => S.priv?.semIA || [];
const aiAreaOk = a => !a || !semIA().includes(a);
function aiAllowed(e) {
  if (!e || e.cifra || e.semIA) return false;
  const p = parseEntry(e.texto); if (p.tags.includes("privado")) return false;
  return !p.areas.some(a => semIA().includes(a));
}
function metricArea(k) {
  if (["sono", "qual", "passos", "treino", "min", "peso", "km", "kcal", "prot"].includes(k)) return "Saúde física";
  if (["humor", "bem", "energia", "estresse", "dhumor"].includes(k)) return "Saúde mental";
  if (k === "gasto" || k === "receita" || k.startsWith("g:") || k.startsWith("c:")) return "Finanças";
  if (k === "estudo" || k === "idi") return "Aprendizado";
  if (k === "ckh" || k === "ckc") return "Carreira";
  if (k === "psis" || k === "psir") return "Saúde mental";
  if (k === "lazer" || k === "lazsat") return "Lazer & criatividade";
  if (k === "jmin" || k === "jdia" || k === "bmidx") return "Propósito & espiritualidade";
  if (k.startsWith("h:")) return S.habitos.find(h => "h:" + h.id === k)?.area || null;
  if (k.startsWith("p:")) { const p = S.pessoas.find(x => "p:" + x.nome === k); return p ? relArea(p.relacao) : null; }
  if (k.startsWith("t:")) return tagArea(k.slice(2));
  return null;
}
const aiMetricOk = k => aiAreaOk(metricArea(k)) && !privateTags().has(k.startsWith("t:") ? k.slice(2) : "");
/* temas que só aparecem em entradas protegidas: nunca saem em nenhum texto enviado */
function privateTags() {
  return memo("privtags", () => { const ok = new Set(), no = new Set();
    for (const e of S.diario) { const v = viewEntry(e); if (!v) continue; const tg = parseEntry(v.texto).tags; (aiAllowed(e) ? tg.forEach(t => ok.add(t)) : tg.forEach(t => no.add(t))); }
    return new Set([...no].filter(t => !ok.has(t) && t !== "privado")); });
}
function aiScrub(s) { const pt = privateTags(); return !pt.size ? s : String(s).replace(/#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu, (m, t) => pt.has(slug(t)) ? "#(tema privado)" : m); }
const aiScrubInput = inp => typeof inp === "string" ? aiScrub(inp) : inp.map(t => ({ ...t, content: aiScrub(t.content) }));

/* contexto de leitura: cada recurso que chama a IA anota o que leu, e o registro guarda isso */
let AICTX = null;
const aiCtx = recurso => ({ recurso, ent: new Set(), areas: new Set(), met: new Set(), ferr: [], bloq: 0 });
function aiEntries(list, ctx = AICTX) {
  const out = []; for (const e of list) { if (aiAllowed(e)) { out.push(e); ctx?.ent.add(e.id); parseEntry(e.texto).areas.forEach(a => ctx?.areas.add(a)); } else if (ctx) ctx.bloq++; }
  return out;
}
const aiNote = (kind, v, ctx = AICTX) => { if (!ctx || v == null) return; if (kind === "area") ctx.areas.add(v); else if (kind === "met") ctx.met.add(v); else if (kind === "ent") ctx.ent.add(v); else if (kind === "ferr") ctx.ferr.push(v); };
function aiLog(ctx, bytes, status) {
  S.auditoria ||= [];
  S.auditoria.unshift({ id: uid(), at: Date.now(), recurso: ctx.recurso, ent: [...ctx.ent].slice(0, 120), nEnt: ctx.ent.size, areas: [...ctx.areas].slice(0, 11), met: [...ctx.met].slice(0, 40), ferr: ctx.ferr.slice(0, 24), bloq: ctx.bloq, bytes, status });
  if (S.auditoria.length > 400) S.auditoria.length = 400;
  touch("auditoria", { noUndo: true, noRender: true });
}
/* porta única para a IA: monta o pedido com o filtro de privacidade, envia e registra */
async function aiCall(recurso, build, { json = false, ctx: ext = null, ...sopts } = {}) {
  if (!SAMPLE) throw { code: AI_OFF ? "not_granted" : "unavailable", message: "IA indisponível" };
  const ctx = ext || aiCtx(recurso); let input;
  AICTX = ctx; try { input = build(ctx); } finally { AICTX = null; }
  input = aiScrubInput(input);
  const bytes = ENC.encode(typeof input === "string" ? input : JSON.stringify(input)).length;
  try { const r = json ? await SAMPLE.json(input, sopts) : await SAMPLE(input, sopts); aiLog(ctx, bytes, "ok"); return r; }
  catch (e) { aiLog(ctx, bytes, e?.code === "cancelled" ? "cancelada" : "erro: " + (e?.code || "desconhecido")); throw e; }
}
/* dados de um dia para a IA, sem nada dos setores bloqueados */
function aiDayFacts(d) {
  const s = S.saude[d] || {}, out = [];
  if (aiAreaOk("Saúde física")) { if (isNum(s.sono)) out.push(`sono ${num(s.sono)} h`); if (s.treino) out.push(`${s.treino}${s.min ? " " + s.min + " min" : ""}`); if (isNum(s.passos)) out.push(`${num(s.passos, 0)} passos`); }
  if (aiAreaOk("Saúde mental")) { if (isNum(s.humor)) out.push(`humor ${s.humor}/5`); if (isNum(s.energia)) out.push(`energia ${s.energia}/5`); if (isNum(s.estresse)) out.push(`estresse ${s.estresse}/5`); }
  const hs = S.habitos.filter(h => aiAreaOk(h.area)); if (hs.length && d <= TODAY) out.push(`${hs.filter(h => S.marks[`${h.id}|${d}`]).length}/${hs.length} hábitos`);
  if (aiAreaOk("Finanças")) { const g = sum(S.lanc.filter(l => l.data === d && l.tipo === "Despesa").map(l => l.valor)); if (g) out.push(`${eur(g)} em gastos`); }
  const cs = S.contatos.filter(c => c.data === d && aiAreaOk(relArea(S.pessoas.find(p => p.nome === c.pessoa)?.relacao))); if (cs.length) out.push("contato com " + cs.map(c => c.pessoa).join(", "));
  if (aiAreaOk("Aprendizado")) { const h = sum(S.estudo.filter(x => x.data === d).map(x => x.horas)); if (h) out.push(`${num(h)} h de estudo`); }
  return out;
}
/* menções a pessoas e humor contados só nas entradas que podem ir para a IA */
function aiPeopleStats() {
  return memo("aipeople", () => { const o = {}; for (const e of S.diario) { if (!aiAllowed(e)) continue; for (const n of parseEntry(e.texto).people) { const x = o[n] ||= { n: 0, ms: [] }; x.n++; if (isNum(e.humor)) x.ms.push(+e.humor); } }
    for (const x of Object.values(o)) x.mood = avg(x.ms); return o; });
}
const blockedMentor = mid => { const a = MENTOR_DEF[mid]?.area || MENTOR_DEF[mid]?.gate; return !!a && !aiAreaOk(a); };

/* ---------------------------------------------------------------- página Privacidade */
const PV = { f: "", det: null };
function protStats() {
  const locked = S.diario.filter(e => e.cifra), noai = S.diario.filter(e => !e.cifra && !aiAllowed(e));
  return { locked, noai, total: S.diario.length };
}
function pPrivacidade(R) {
  const c = S.priv?.cofre, ps = protStats(), log = S.auditoria || [], d30 = Date.now() - 30 * 864e5, last30 = log.filter(x => x.at >= d30);
  const read = new Set(log.flatMap(x => x.ent)), readPct = ps.total ? [...read].filter(id => S.diario.some(e => e.id === id)).length / ps.total : null;
  const recs = [...new Set(log.map(x => x.recurso))], rows = log.filter(x => !PV.f || x.recurso === PV.f).slice(0, 60);
  const cofre = !cryptoOk() ? `<p class="note st-warn">${ic("info")}Este navegador não oferece criptografia segura nesta página. As outras proteções continuam valendo.</p>`
    : !c ? `<p class="muted">Crie uma senha só sua. As entradas que você trancar ficam cifradas (AES-256) antes de sair do aparelho: nem o Atlas, nem a IA, nem quem tiver acesso ao armazenamento consegue ler sem a senha.</p>
      <div class="form f2"><label>Senha (mínimo 8 caracteres)<input id="cf_p1" type="password" autocomplete="new-password"></label><label>Repita a senha<input id="cf_p2" type="password" autocomplete="new-password"></label></div>
      <p class="note st-warn">${ic("info")}Se você esquecer essa senha, as entradas trancadas não podem ser recuperadas por ninguém.</p><div class="row"><button type="button" class="btn primary" data-act="cfcreate"${COFRE.busy ? " disabled" : ""}>${ic("lock")}${COFRE.busy ? "Criando…" : "Criar cofre"}</button></div>`
    : !COFRE.key ? `<p class="muted">Cofre criado em ${fmtDY(c.criado)}. ${plural(ps.locked.length, "entrada trancada", "entradas trancadas")}: elas aparecem como cadeados no diário até você destrancar nesta sessão.</p>
      <div class="row wrap"><input id="cf_p" type="password" placeholder="Senha do cofre" autocomplete="current-password" aria-label="Senha do cofre"><button type="button" class="btn primary" data-act="cfopen"${COFRE.busy ? " disabled" : ""}>${ic("unlock")}${COFRE.busy ? "Abrindo…" : "Destrancar"}</button></div>`
    : `<div class="row wrap"><span class="pill good">${ic("unlock")}Destrancado nesta sessão</span><span class="muted">${plural(ps.locked.length, "entrada trancada", "entradas trancadas")} visível(is) só para você agora.</span></div>
      <div class="row wrap"><button type="button" class="btn" data-act="cflock">${ic("lock")}Trancar agora</button><button type="button" class="btn sm" data-act="cfbulk">${ic("lock")}Trancar todas com #privado (${S.diario.filter(e => !e.cifra && parseEntry(e.texto).tags.includes("privado")).length})</button></div>
      <details class="ctx"><summary>${ic("sliders")}Trocar a senha</summary><div class="form f3"><label>Senha atual<input id="cf_o" type="password" autocomplete="current-password"></label><label>Nova senha<input id="cf_n1" type="password" autocomplete="new-password"></label><label>Repita<input id="cf_n2" type="password" autocomplete="new-password"></label></div><div class="row"><button type="button" class="btn sm" data-act="cfchange">Trocar e recifrar tudo</button></div></details>`;
  const areas = `<div class="areatgl">${AREAS.map((a, i) => `<label class="atgl" style="--c:${acol(a)}"><input type="checkbox" id="pv_a${i}" data-semia="${esc(a)}"${semIA().includes(a) ? " checked" : ""}><span>${ic(AREA_INFO[a].ico)}${esc(ashort(a))}</span></label>`).join("")}</div>`;
  const tbl = rows.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Quando</th><th>Recurso</th><th class="num">Entradas</th><th>Setores</th><th>Métricas e ferramentas</th><th class="num">Tamanho</th><th>Status</th></tr></thead><tbody>${rows.map(x => `<tr class="click" data-pvdet="${x.id}" tabindex="0"><td>${fmtDY(iso(new Date(x.at)))} ${new Date(x.at).toTimeString().slice(0, 5)}</td><td><b>${esc(x.recurso)}</b></td><td class="num">${x.nEnt}${x.bloq ? ` <small class="muted">(${x.bloq} barrada${x.bloq > 1 ? "s" : ""})</small>` : ""}</td><td>${x.areas.map(a => areaTag(a)).join(" ") || "–"}</td><td class="small">${esc([...x.met.map(k => metric(k)?.l || k), ...x.ferr].slice(0, 5).join(" · ")) || "–"}</td><td class="num">${num(x.bytes / 1024, 1)} KB</td><td>${x.status === "ok" ? pill("good", "ok") : pill(x.status === "cancelada" ? "none" : "warn", x.status)}</td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhuma chamada à IA registrada ainda. Toda conversa com mentor, leitura do diário, captura organizada, busca por significado, carta da semana ou nome de capítulo aparece aqui, com o que foi lido.</div>`;
  return `<p class="lead">Você decide o que sai do aparelho. Três camadas: o cofre cifra entradas com uma senha só sua; “sem IA” deixa entradas ou setores inteiros fora de qualquer pedido à IA; e o registro mostra o que cada mentor e recurso leu, quando e quanto.</p>
    ${kpiRow([kmini("var(--accent)", "Chamadas à IA · 30 dias", last30.length, `${plural(new Set(last30.flatMap(x => x.ent)).size, "entrada lida", "entradas lidas")}`), kmini("var(--a-men)", "Diário já lido pela IA", pct(readPct), `de ${plural(ps.total, "entrada", "entradas")} no total`), kmini("var(--a-cas)", "Entradas trancadas", ps.locked.length, c ? "cifradas com a sua senha" : "cofre ainda não criado"), kmini("var(--warn)", "Fora da IA", ps.noai.length + ps.locked.length, `${semIA().length ? plural(semIA().length, "setor bloqueado", "setores bloqueados") + " · " : ""}#privado e “sem IA”`)])}
    <div class="g2c">
      ${panel(`${ic("lock")}Cofre com senha`, cofre + (COFRE.err ? `<p class="note st-crit">${esc(COFRE.err)}</p>` : COFRE.msg ? `<p class="note st-good">${esc(COFRE.msg)}</p>` : ""))}
      ${panel(`${ic("noai")}Setores sem IA`, `<p class="muted">Marque um setor e nada dele vai para a IA: nem as entradas que falam dele, nem os números, nem o mentor da área. O Conselho vê só que o setor existe.</p>${areas}<p class="note">${ic("info")}<span>Para uma entrada só: marque “Não enviar à IA” no editor, use a tag <code>#privado</code> ou tranque no cofre.</span></p>`)}
      ${panel(`${ic("eye")}Registro de leitura da IA <small>${plural(log.length, "chamada", "chamadas")}</small>`, `<div class="row wrap"><select id="pv_f" class="auto" aria-label="Filtrar por recurso"><option value="">Todos os recursos</option>${recs.map(r => `<option${PV.f === r ? " selected" : ""}>${esc(r)}</option>`).join("")}</select><button type="button" class="btn sm" data-act="pvcsv"${log.length ? "" : " disabled"}>${ic("download")}CSV</button><button type="button" class="btn sm ghost" data-act="pvclear"${log.length ? "" : " disabled"}>${ic("trash")}Limpar registro</button></div>${tbl}`, { cls: "span2" })}
      ${panel(`${ic("shield")}Entradas protegidas <small>${ps.locked.length + ps.noai.length}</small>`, ps.locked.length + ps.noai.length ? `<div class="bls">${[...ps.locked, ...ps.noai].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 14).map(e => { const v = viewEntry(e); return v ? entryLine(v) : `<div class="bl locked"><span class="bld">${fmtD(e.data)}</span><span class="blt"><b>${ic("lock")}Entrada trancada</b><small>destranque o cofre para ler</small></span></div>`; }).join("")}</div>` : `<div class="empty">Nenhuma entrada protegida ainda.</div>`, { cls: "span2" })}
    </div>`;
}
function pvDetail(id) {
  const x = (S.auditoria || []).find(z => z.id === id); if (!x) return;
  const es = x.ent.map(i => S.diario.find(e => e.id === i)).filter(Boolean);
  $("#dlg").innerHTML = `<form method="dialog" class="wide"><h3>${esc(x.recurso)} · ${fmtDY(iso(new Date(x.at)))} ${new Date(x.at).toTimeString().slice(0, 5)}</h3>
    <div class="kms3">${kmini("var(--accent)", "Entradas lidas", x.nEnt, x.bloq ? `${x.bloq} barradas pela privacidade` : "nenhuma barrada")}${kmini("var(--a-car)", "Tamanho do pedido", num(x.bytes / 1024, 1) + " KB", x.status)}${kmini("var(--a-men)", "Setores", x.areas.length, x.areas.map(ashort).join(", ") || "–")}</div>
    ${x.met.length ? `<div class="flbl">Métricas consultadas</div><div class="tagcloud">${x.met.map(k => `<span class="chip">${esc(metric(k)?.l || k)}</span>`).join("")}</div>` : ""}
    ${x.ferr.length ? `<div class="flbl">Ferramentas usadas</div><div class="tagcloud">${x.ferr.map(f => `<span class="chip">${esc(f)}</span>`).join("")}</div>` : ""}
    <div class="flbl">Entradas que foram enviadas</div>${es.length ? `<div class="bls">${es.slice(0, 40).map(e => { const v = viewEntry(e); return v ? entryLine(v) : ""; }).join("")}</div>${x.nEnt > es.length ? `<div class="more">+${x.nEnt - es.length} entradas já apagadas ou além do limite do registro</div>` : ""}` : `<div class="empty">Nenhuma entrada do diário foi enviada nesta chamada.</div>`}
    <div class="dlgfoot"><span></span><button type="button" class="btn" id="pvclose">Fechar</button></div></form>`;
  const d = $("#dlg"); d.showModal(); $("#pvclose").onclick = () => d.close();
}
function privClick(t) {
  const a = t.dataset.act;
  if (a === "cfcreate") { const p1 = $("#cf_p1")?.value || "", p2 = $("#cf_p2")?.value || ""; COFRE.err = COFRE.msg = "";
    if (p1.length < 8) { COFRE.err = "Use pelo menos 8 caracteres."; render(); return true; } if (p1 !== p2) { COFRE.err = "As duas senhas não são iguais."; render(); return true; }
    COFRE.busy = true; render(); cofreCreate(p1).then(() => { COFRE.msg = "Cofre criado e destrancado nesta sessão. Tranque entradas pelo cadeado no diário."; }).catch(() => { COFRE.err = "Não foi possível criar o cofre neste navegador."; }).finally(() => { COFRE.busy = false; render(); }); return true; }
  if (a === "cfopen") { const p = $("#cf_p")?.value || ""; COFRE.err = COFRE.msg = ""; COFRE.busy = true; render();
    cofreUnlock(p).then(ok => { if (ok) COFRE.msg = "Destrancado. Ao recarregar a página, o cofre fecha de novo."; else COFRE.err = "Senha incorreta."; }).finally(() => { COFRE.busy = false; VER++; render(); }); return true; }
  if (a === "cflock") { COFRE.msg = COFRE.err = ""; cofreLock(); return true; }
  if (a === "cfbulk") { (async () => { let n = 0; for (const e of S.diario) if (!e.cifra && parseEntry(e.texto).tags.includes("privado")) { await sealEntry(e, { titulo: e.titulo, texto: e.texto }); n++; } if (n) touch("diario", { label: "Entradas #privado trancadas", noUndo: true }); toast(n ? plural(n, "entrada trancada", "entradas trancadas") : "Nenhuma entrada com #privado aberta"); })(); return true; }
  if (a === "cfchange") { const o = $("#cf_o")?.value || "", n1 = $("#cf_n1")?.value || "", n2 = $("#cf_n2")?.value || ""; COFRE.err = COFRE.msg = "";
    if (n1.length < 8 || n1 !== n2) { COFRE.err = n1.length < 8 ? "A nova senha precisa de 8 caracteres ou mais." : "As novas senhas não são iguais."; render(); return true; }
    COFRE.busy = true; render(); cofreChange(o, n1).then(err => { if (err) COFRE.err = err; else COFRE.msg = "Senha trocada e todas as entradas recifradas."; }).finally(() => { COFRE.busy = false; render(); }); return true; }
  if (t.dataset.pvdet) { pvDetail(t.dataset.pvdet); return true; }
  if (a === "pvcsv") { saveFile(`atlas-registro-ia-${TODAY}.csv`, "﻿" + csvBuild(["Quando", "Recurso", "Entradas lidas", "Barradas", "Setores", "Métricas", "Ferramentas", "Bytes", "Status"], (S.auditoria || []).map(x => [new Date(x.at).toISOString(), x.recurso, x.nEnt, x.bloq, x.areas.join("; "), x.met.join("; "), x.ferr.join("; "), x.bytes, x.status]))); return true; }
  if (a === "pvclear") { if (!t.dataset.c) { t.dataset.c = 1; t.innerHTML = ic("trash") + "Confirmar: limpar registro"; return true; } S.auditoria = []; touch("auditoria", { label: "Registro da IA limpo" }); undoToast("Registro limpo"); return true; }
  if (a === "dlock") { lockEntry(t.dataset.id); return true; }
  if (a === "dunlock") { unlockEntryForGood(t.dataset.id); return true; }
  if (a === "dopencofre") { setHash("privacidade"); return true; }
  return false;
}
function privChange(t) {
  if (t.dataset.semia) { const a = t.dataset.semia, s = new Set(semIA()); t.checked ? s.add(a) : s.delete(a); S.priv = { ...S.priv, semIA: AREAS.filter(x => s.has(x)) }; touch("priv", { label: t.checked ? `${ashort(a)} fora da IA` : `${ashort(a)} liberado para a IA` }); return true; }
  if (t.id === "pv_f") { PV.f = t.value; render(); return true; }
  return false;
}
