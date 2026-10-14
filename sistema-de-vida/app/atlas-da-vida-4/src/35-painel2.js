/* ================================================================ Painel do dia, parte 2: o resto das abas do dia num formulário só
   Tarefas (concluir e criar), pessoas, estudo e idiomas, leitura, casa (limpeza feita, conta paga), peso, receitas e aportes.
   Tudo passa pela mesma revisão e pelo mesmo “desfazer” do painel. O texto e a voz preenchem estas seções também. */
PD_KEYS.push("peso"); PD_LBL.peso = "Peso";
const pdL = () => { PD.L ||= {}; for (const k of ["tar", "cont", "est", "ler"]) PD.L[k] ||= []; PD.chk ||= {}; for (const k of ["tdone", "rot", "conta"]) PD.chk[k] ||= {}; return PD.L; };
const PD_SEC = [["sec_saude", "Saúde", "pulse"], ["sec_din", "Finanças", "coins"], ["sec_hab", "Hábitos", "repeat"], ["sec_tar", "Tarefas", "checksq"], ["sec_pes", "Pessoas", "users"], ["sec_est", "Estudo & idiomas", "book"], ["sec_jor", "Jornada & lazer", "lotus"], ["sec_bm", "Bússola & rotina", "compass"], ["sec_casa", "Casa", "house"], ["sec_dia", "Diário", "pen"]];
const CT_TIPOS = ["Encontro", "Ligação", "Videochamada", "Mensagem", "Evento / grupo"];
const estItens = () => ["Inglês", "Italiano", ...S.aprend.filter(a => a.status === "Em andamento" && !/^(inglês|italiano)$/i.test(a.titulo)).map(a => a.titulo)];
const lerItens = () => S.aprend.filter(a => a.status === "Em andamento" && (a.tipo === "Livro" || +a.total)).map(a => a.titulo);
/* as pessoais primeiro (os exemplos do roteiro saem delas), depois as minhas do Cockpit */
function pdTarefasDia(d = PD.date) { return [...S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo <= d).sort((a, b) => a.prazo.localeCompare(b.prazo)), ...ckMinhasAte(d)]; }
function pdCasaDia(d = PD.date) {
  const rot = S.rotinas.filter(r => { const prox = r.ultima && +r.freq ? addDays(r.ultima, +r.freq) : d; return prox <= d && r.ultima !== d; });
  const contas = []; for (const c of S.contasCasa || []) for (const v of contaOcorr(c, addDays(d, -30), addDays(d, 3))) if (!contaPaga(c, v)) contas.push({ c, v });
  return { rot, contas };
}
/* estado do dia por aba: “ok” quando a aba já tem registro no dia, “pend” quando há algo no painel esperando para ir */
function pdMapa(rows) {
  const d = PD.date, B = pdBase(d), s = S.saude[d] || {}, has = id => rows.some(r => r.on && r.id.startsWith(id));
  const st = { sec_saude: [["humor", "sono", "energia", "estresse", "passos", "treino", "peso"].some(k => s[k] != null && s[k] !== ""), has("s.")], sec_din: [S.lanc.some(l => l.data === d), has("g.")], sec_hab: [S.habitos.some(h => S.marks[`${h.id}|${d}`]), has("h.")],
    sec_tar: [S.tarefas.some(t => t.concluida === d) || ckMinhas(t => t.concluida === d).length > 0, has("t.")], sec_pes: [S.contatos.some(c => c.data === d), has("c.")], sec_est: [S.estudo.some(x => x.data === d), has("e.") || has("r.")],
    sec_jor: [B.sess.length > 0 || B.lz.length > 0, has("j.") || has("l.")], sec_casa: [S.rotinas.some(r => r.ultima === d) || (S.contasCasa || []).some(c => Object.values(c.pagos || {}).includes(d)), has("k.")], sec_dia: [B.ent.length > 0, has("d.")], sec_bm: [!!bmEx()[d] || rtOcc(d).some(b => b.st), has("b.") || has("q.")] };
  return `<nav class="pdmapa" aria-label="Abas do dia">${PD_SEC.map(([id, l, i]) => { const [ok, pend] = st[id] || []; return `<a href="#painel" class="pdmc${ok ? " ok" : ""}${pend ? " pend" : ""}" data-pdgo="${id}" title="${ok ? "já tem registro neste dia" : pend ? "há registros esperando para salvar" : "nada ainda"}">${ic(ok ? "check" : i)}<span>${l}</span>${pend ? "<i></i>" : ""}</a>`; }).join("")}</nav>`;
}
function pdMoreHTML(C) {
  const L = pdL(), d = PD.date, tds = pdTarefasDia(), CD = pdCasaDia(), V = PD.v, s = S.saude[d] || {};
  const del = (k, i) => `<button type="button" class="vb" data-pdldel="${k}|${i}" aria-label="Remover">${ic("x")}</button>`, src = r => r.src === "texto" ? `<em class="pdsrc s-texto">do texto</em>` : "";
  const opt = (list, v) => `<option value=""></option>${list.map(x => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("")}`;
  const inp = (k, i, f, v, ph, mode = "text") => `<input type="text" data-pdl="${k}|${i}|${f}" id="pdl_${k}${i}${f}" value="${esc(v ?? "")}" placeholder="${ph}" inputmode="${mode}" autocomplete="off" aria-label="${ph}">`;
  const sel = (k, i, f, list, v, lab) => `<select data-pdl="${k}|${i}|${f}" id="pdl_${k}${i}${f}" aria-label="${lab}">${opt(list, v)}</select>`;
  return `
    <div class="pdblk" id="sec_tar"><div class="pdfl"><span class="pdlab">${ic("checksq")}Tarefas</span><small class="pdhint">${tds.length ? `${tds.length} vencendo até ${fmtD(d)}` : "nada vencendo"}</small></div>
      ${tds.map(t => `<label class="ckl pdck"><input type="checkbox" data-pdck="tdone|${t.id}"${PD.chk.tdone[t.id] ? " checked" : ""}><span>Concluí: ${esc(t.tarefa)}<small class="${t.prazo < d ? "st-crit" : "muted"}">${t.prazo < d ? "atrasada" : "vence hoje"}</small></span></label>`).join("")}
      ${L.tar.map((r, i) => `<div class="pdlr">${inp("tar", i, "t", r.t, "Nova tarefa: ligar para o banco até sexta !alta")}${del("tar", i)}${src(r)}</div>`).join("")}
      <button type="button" class="btn sm" data-pdladd="tar">${ic("plus")}Nova tarefa</button></div>
    <div class="pdblk" id="sec_pes"><div class="pdfl"><span class="pdlab">${ic("users")}Pessoas com quem falou</span></div>
      ${L.cont.map((r, i) => `<div class="pdlr pdl4">${sel("cont", i, "pessoa", S.pessoas.map(p => p.nome), r.pessoa, "Pessoa")}${sel("cont", i, "tipo", CT_TIPOS, r.tipo, "Tipo")}${inp("cont", i, "min", r.min, "min", "numeric")}${del("cont", i)}${src(r)}${r.pessoa || !r.raw ? "" : `<small class="pdmsg warn">Não achei “${esc(r.raw)}” em Relações</small>`}</div>`).join("")}
      <button type="button" class="btn sm" data-pdladd="cont">${ic("plus")}Contato</button></div>
    <div class="pdblk" id="sec_est"><div class="pdfl"><span class="pdlab">${ic("book")}Estudo, idiomas e leitura</span></div>
      ${L.est.map((r, i) => `<div class="pdlr pdl3">${sel("est", i, "item", estItens(), r.item, "O que estudou")}${inp("est", i, "min", r.min, "min", "numeric")}${del("est", i)}${src(r)}</div>`).join("")}
      ${L.ler.map((r, i) => `<div class="pdlr pdl3">${sel("ler", i, "item", lerItens(), r.item, "Livro ou curso")}${inp("ler", i, "pag", r.pag, "páginas/aulas", "numeric")}${del("ler", i)}${src(r)}</div>`).join("")}
      <div class="row wrap"><button type="button" class="btn sm" data-pdladd="est">${ic("plus")}Estudo ou idioma</button><button type="button" class="btn sm" data-pdladd="ler">${ic("plus")}Leitura</button></div></div>
    <div class="pdblk" id="sec_casa"><div class="pdfl"><span class="pdlab">${ic("house")}Casa</span><small class="pdhint">${CD.rot.length + CD.contas.length ? "o que está vencido ou vence em até 3 dias" : "nada pendente"}</small></div>
      ${CD.rot.map(r => `<label class="ckl pdck"><input type="checkbox" data-pdck="rot|${r.id}"${PD.chk.rot[r.id] ? " checked" : ""}><span>Fiz: ${esc(r.rotina)}<small class="muted">${esc(r.nivel || "")}${r.min ? ` · ${r.min} min` : ""}</small></span></label>`).join("")}
      ${CD.contas.map(({ c, v }) => `<label class="ckl pdck"><input type="checkbox" data-pdck="conta|${c.id}|${v}"${PD.chk.conta[`${c.id}|${v}`] ? " checked" : ""}><span>Paguei: ${esc(c.conta)} · ${eur(+c.valor || 0, 2)}<small class="${v < d ? "st-crit" : "muted"}">vence ${fmtD(v)}</small></span></label>`).join("")}</div>
    <div class="pdrow3"><div class="pdf ${pdSt(C, "peso")}" data-pdbox="peso"><div class="pdfl"><label for="pd_peso">Peso (kg)</label>${s.peso ? `<em class="pdsrc">${num(s.peso)} salvo</em>` : ""}</div><div class="pdfi"><input type="text" id="pd_peso" data-pdf="peso" inputmode="decimal" autocomplete="off" value="${esc(V.peso ?? "")}" placeholder="72,5" aria-describedby="pdm_peso"></div>${pdMsg(C, "peso")}</div></div>${pdMore3HTML()}`;
}
/* texto e voz: o que antes virava “outros registros” agora cai na seção da aba */
function pdReset2() { const L = pdL(); for (const k of Object.keys(L)) L[k] = L[k].filter(r => r.src !== "texto"); }
function pdParse2(c, a, take) {
  const L = pdL();
  if (c === "receita" || c === "aporte") { const mm = a.match(/^([\d.,]+)\s*(.*)$/); if (mm) PD.gastos.push({ id: uid(), v: mm[1], d: mm[2].replace(/^[^:]*:\s*/, "").trim(), cat: "", tipo: c === "receita" ? "Receita" : "Aporte", src: "texto" }); return true; }
  if (c === "peso") { take("peso", a.trim()); return true; }
  if (c === "tarefa") { L.tar.push({ id: uid(), t: a.trim(), src: "texto" }); return true; }
  if (c === "contato") { const tk = (a.match(/@\[([^\]]+)\]|@(\S+)/) || []), nome = tk[1] || tk[2] || "", p = resolvePerson(nome), tipo = findIn(CT_TIPOS, a.replace(/@\[[^\]]*\]|@\S+/g, "").replace(/\d+/g, "").trim()) || "Encontro", mn = (a.replace(/@\[[^\]]*\]/g, "").match(/(\d{1,3})\s*$/) || [])[1] || "";
    L.cont.push({ id: uid(), pessoa: p || "", raw: nome, tipo, min: mn, src: "texto" }); return true; }
  if (c === "estudo") { const mm = a.match(/^([\d.,]+)\s*h?\s*(.*)$/i); if (mm) { const it = mm[2].trim(), item = estItens().find(x => norm(x) === norm(it)) || estItens().find(x => norm(it).includes(norm(x)) || norm(x).includes(norm(it))) || it; L.est.push({ id: uid(), item, min: String(Math.round(parseNum(mm[1]) * 60)), src: "texto" }); } return true; }
  if (c === "ler") { const mm = a.match(/^(\d+)\s+(.*)$/); if (mm) L.ler.push({ id: uid(), item: lerItens().find(x => norm(x).includes(norm(mm[2]))) || mm[2], pag: mm[1], src: "texto" }); return true; }
  return false;
}
function pdCheck2(set, V) {
  if (V.peso !== "" && V.peso != null) { const v = pdMoney(V.peso); if (v == null || isNaN(v)) set("peso", "err", "Ex.: 72,5"); else if (v < 20 || v > 400) set("peso", "err", "Entre 20 e 400 kg"); else set("peso", "ok", ""); }
  const L = pdL();
  L.cont.forEach((r, i) => { if (r.min && !(+r.min > 0 && +r.min <= 900)) set(`cont${i}`, "err", "Minutos inválidos"); });
  L.est.forEach((r, i) => { if (r.item && !(+r.min > 0 && +r.min <= 900)) set(`est${i}`, "err", "Informe os minutos"); });
  L.ler.forEach((r, i) => { if (r.item && !(+r.pag > 0)) set(`ler${i}`, "err", "Informe as páginas"); });
}
function pdRows2(rows, cmd, B, d, bad) {
  const L = pdL(), V = PD.v;
  if (V.peso !== "" && V.peso != null && !bad("peso")) { const v = pdMoney(V.peso), old = S.saude[d]?.peso; if (old == null || Math.abs(old - v) > 1e-9) cmd("s.peso", `/peso ${fmtDec(v)}`, { kind: old == null ? "novo" : "subst", old: old == null ? "" : num(old) + " kg", dest: "saude" }); }
  for (const t of S.tarefas) if (PD.chk.tdone[t.id] && t.status !== "Concluída") rows.push({ id: `t.done.${t.id}`, txt: `Tarefa concluída: ${t.tarefa}`, kind: "novo", dest: "tarefas", on: true, apply: () => { const x = S.tarefas.find(z => z.id === t.id); if (x) { x.status = "Concluída"; x.concluida = d; } return ["tarefas"]; } });
  for (const t of ckMinhas(t => ckOpen(t) && PD.chk.tdone[t.id])) rows.push({ id: `t.done.${t.id}`, txt: `Tarefa concluída: ${t.tarefa}`, kind: "novo", dest: "ckTar", on: true, apply: () => { const x = (S.ckTar || []).find(z => z.id === t.id); if (x) ckMarca(x, "concluída", d); return ["ckTar"]; } });
  L.tar.forEach(r => { const t = String(r.t || "").trim(); if (t.length < 3) return; const dup = S.tarefas.some(x => x.status !== "Concluída" && norm(x.tarefa) === norm(t.replace(/\s+at[eé].*$/, "").replace(/!\w+/, "").trim())); cmd(`t.n.${r.id}`, `/tarefa ${t}`, { kind: dup ? "dup" : "novo", old: dup ? "tarefa igual já aberta" : "", on: !dup, dest: "tarefas" }); });
  L.cont.forEach((r, i) => { if (!r.pessoa || bad(`cont${i}`)) return; const dup = S.contatos.some(c => c.data === d && c.pessoa === r.pessoa); cmd(`c.${r.id}`, `/contato ${personTok(r.pessoa)} ${r.tipo || "Encontro"}${r.min ? " " + r.min : ""}`, { kind: dup ? "dup" : "novo", old: dup ? "já há contato com essa pessoa neste dia" : "", on: !dup, dest: "contatos" }); });
  L.est.forEach((r, i) => { if (!r.item || bad(`est${i}`)) return; const h = Math.round(+r.min / 60 * 100) / 100, lang = /^ingl/i.test(r.item) ? "en" : /^italia/i.test(r.item) ? "it" : null, dup = S.estudo.some(x => x.data === d && norm(x.item) === norm(r.item) && Math.abs(x.horas - h) < .01);
    if (lang) rows.push({ id: `e.${r.id}`, txt: `${r.item}: ${r.min} min`, kind: dup ? "dup" : "novo", old: dup ? "sessão igual já registrada" : "", dest: "estudo", on: !dup, apply: () => { S.estudo.push({ id: uid(), data: d, item: LANG[lang].item, horas: h, lang, hab: "", rec: "", origem: "painel" }); return ["estudo"]; } });
    else cmd(`e.${r.id}`, `/estudo ${fmtDec(h)} ${r.item}`, { kind: dup ? "dup" : "novo", old: dup ? "sessão igual já registrada" : "", on: !dup, dest: "estudo" }); });
  L.ler.forEach((r, i) => { if (!r.item || bad(`ler${i}`)) return; cmd(`r.${r.id}`, `/ler ${+r.pag} ${r.item}`, { dest: "aprend" }); });
  for (const r of S.rotinas) if (PD.chk.rot[r.id]) rows.push({ id: `k.r.${r.id}`, txt: `Casa: ${r.rotina} feita`, kind: "novo", dest: "rotinas", on: true, apply: () => { const x = S.rotinas.find(z => z.id === r.id); if (x) x.ultima = d; return ["rotinas"]; } });
  for (const key of Object.keys(PD.chk.conta)) { if (!PD.chk.conta[key]) continue; const [cid, v] = key.split("|"), c = (S.contasCasa || []).find(z => z.id === cid); if (!c || contaPaga(c, v)) continue;
    rows.push({ id: `k.c.${key}`, txt: `Conta paga: ${c.conta} · ${eur(+c.valor || 0, 2)}`, kind: "novo", dest: "contasCasa", on: true, apply: () => { const x = S.contasCasa.find(z => z.id === cid); x.pagos = { ...(x.pagos || {}), [v]: d }; const ks = ["contasCasa"], cat = /aluguel|condom/i.test(x.cat || "") ? "Moradia" : "Contas da casa";
      if (+x.valor > 0 && cat in CAT_DESP) { S.lanc.push({ id: uid(), data: d, tipo: "Despesa", cat, desc: x.conta, valor: +x.valor, conta: x.debito === "Sim" ? "Conta corrente" : "PIX / transferência", origem: "casa" }); ks.push("lanc"); } return ks; } }); }
  pdRows3(rows, d);
}
const pdLtotal = () => { const L = pdL(); return L.tar.length + L.cont.length + L.est.length + L.ler.length; };
function pd2Click(t) {
  const ds = t.dataset;
  if (ds.pdgo) { document.getElementById(ds.pdgo)?.scrollIntoView({ behavior: "smooth", block: "start" }); return true; }
  if (ds.pdladd) { const L = pdL(), k = ds.pdladd; L[k].push({ id: uid(), src: "mao", ...(k === "cont" ? { tipo: "Encontro" } : {}) }); pdStore(); render(); setTimeout(() => document.querySelector(`#sec_${{ tar: "tar", cont: "pes", est: "est", ler: "est" }[k]} .pdlr:last-of-type input, #sec_${{ tar: "tar", cont: "pes", est: "est", ler: "est" }[k]} .pdlr:last-of-type select`)?.focus(), 30); return true; }
  if (ds.pdldel) { const [k, i] = ds.pdldel.split("|"); pdL()[k].splice(+i, 1); pdStore(); render(); return true; }
  if (ds.pdck) { const [k, ...rest] = ds.pdck.split("|"), key = rest.join("|"); pdL(); delete PD.chkT?.[ds.pdck]; if (t.checked) PD.chk[k][key] = 1; else delete PD.chk[k][key]; pdStore(); pdPaint(); return true; }
  return false;
}
function pd2Input(t) { if (t.dataset.pdl) { const [k, i, f] = t.dataset.pdl.split("|"), r = pdL()[k][+i]; if (r) { r[f] = t.value; r.src = "mao"; } pdStore(); if (t.tagName !== "SELECT") pdPaint(); return true; } return false; }
function pd2Change(t) { if (t.dataset.pdl) { if (t.tagName === "SELECT") { const [k, i, f] = t.dataset.pdl.split("|"), r = pdL()[k][+i]; if (r) { r[f] = t.value; r.src = "mao"; } pdStore(); pdPaint(); } return true; } return false; }
