/* ================================================================ Rotina: atividades com cor e lista suspensa em cada meia hora
   Clicar numa meia hora vazia da grade (ou arrastar por várias) abre ali mesmo uma lista suspensa: primeiro as atividades do
   Standard Semanal, cada uma com a cor fixa do modelo; depois as “Outras”, cadastradas aqui com a cor escolhida no seletor.
   Escolher preenche a faixa com um bloco da cor da atividade. Encostado num bloco igual do mesmo dia, o bloco cresce em vez de
   virar outro (como células vizinhas da planilha); horário já ocupado fica como está. A lista padrão vem do modelo salvo com
   “Standard” no nome (ou do escolhido em “Atividades e cores”); as outras ficam em S.rotinaAtiv.outras = [{ id, nome, cor, tx, cat }].
   O mesmo nome digitado no formulário, no texto rápido, no Capturar ou vindo do Secretário recebe a cor da atividade. */
const RTA_PALETA = ["#9BC2E6", "#F8CBAD", "#C6E0B4", "#FFE699", "#D9D2E9", "#B4C6E7", "#F4B183", "#A9D08E", "#FFD966", "#C9A0DC", "#8EA9DB", "#E2A1A1"];
const RTA = { ap: null, el: null };
const rtaD = () => (S.rotinaAtiv ||= { outras: [], fonte: "" });
const rtaK = s => fold(String(s || "").trim().replace(/\s+/g, " "));
/* modelos de onde sai a lista padrão: o escolhido; senão os que têm “Standard” no nome; senão os de nível; senão todos */
function rtaFontes() {
  const M = (S.rotinaModelos || []).filter(m => Array.isArray(m.semana) && m.semana.length), f = rtaD().fonte;
  if (f) { const m = M.find(x => x.id === f); if (m) return [m]; }
  const std = M.filter(m => /standard/i.test(m.nome || "")); if (std.length) return std;
  const niv = M.filter(m => m.nivel); return niv.length ? niv : M;
}
/* atividades padrão: um item por nome, com a cor que mais aparece (em minutos) e a categoria do modelo */
function rtaPadrao() {
  const map = new Map();
  const add = (nome, cat, cor, tx, min) => { const k = rtaK(nome); if (!k) return;
    const a = map.get(k) || { nome: String(nome).trim(), cat: cat || "Outro", cores: new Map(), min: 0 }; a.min += min;
    const c = rtHex(cor); if (c) { const ck = c.toLowerCase() + "|" + (rtHex(tx) || "").toLowerCase(), x = a.cores.get(ck) || { cor: c, tx: rtHex(tx) || "", min: 0 }; x.min += min; a.cores.set(ck, x); }
    map.set(k, a); };
  const F = rtaFontes();
  if (F.length) for (const m of F) for (const [, ini, fim, nome, cat, cor, tx] of m.semana) add(nome, cat, cor, tx, Math.max(0, hm2min(fim) - hm2min(ini)));
  else for (const m of RT_MOD0) for (const [ini, fim, nome, cat] of m.b) add(nome, cat, "", "", Math.max(0, hm2min(fim) - hm2min(ini)));
  return [...map.values()].map(a => { const { cor = "", tx = "" } = [...a.cores.values()].sort((p, q) => q.min - p.min)[0] || {};
    return { nome: a.nome, cat: a.cat, cor, tx: cor ? tx || rtTx(cor) : "", min: a.min, grupo: "p" }; }).sort((p, q) => p.nome.localeCompare(q.nome, "pt"));
}
const rtaNomeGrupo = () => { const F = rtaFontes(); return !F.length ? "Padrão do Atlas" : F.some(m => /standard/i.test(m.nome || "")) ? "Standard Semanal" : `Padrão · ${trunc(F.map(m => m.nome).join(", "), 40)}`; };
const rtaOutras = () => (rtaD().outras || []).map(a => ({ ...a, tx: rtHex(a.tx) || rtTx(a.cor), grupo: "o" })).sort((p, q) => p.nome.localeCompare(q.nome, "pt"));
const rtaTodas = () => [...rtaPadrao(), ...rtaOutras()];
const rtaPorNome = n => { const k = rtaK(n); return k ? rtaTodas().find(a => rtaK(a.nome) === k) || null : null; };
/* cor de um bloco pelo nome: { cor, tx } da atividade com esse nome, ou nada (fica a cor da categoria) */
const rtCorAtiv = n => { const a = rtaPorNome(n); return a && rtHex(a.cor) ? { cor: a.cor, tx: rtHex(a.tx) || rtTx(a.cor) } : {}; };
const rtaSw = a => rtHex(a.cor) ? `background:${a.cor};color:${rtHex(a.tx) || rtTx(a.cor)}` : `background:${rtCor(a.cat)};color:#fff`;
const rtaCorLivre = () => { const usadas = new Set(rtaTodas().map(a => (a.cor || "").toLowerCase())); return RTA_PALETA.find(c => !usadas.has(c.toLowerCase())) || RTA_PALETA[(rtaD().outras || []).length % RTA_PALETA.length]; };

/* ---------------------------------------------------------------- preencher: só o que está livre, juntando com o bloco igual encostado */
function rtaEncher(d, a, z, at) {
  const occ = rtOcc(d).map(b => [b.a, b.z]).sort((p, q) => p[0] - q[0]), seg = []; let s = a;
  for (const [x0, x1] of occ) { if (x1 <= s || x0 >= z) continue; if (x0 > s) seg.push([s, Math.min(x0, z)]); s = Math.max(s, x1); if (s >= z) break; }
  if (s < z) seg.push([s, z]);
  const cor = rtHex(at.cor), tx = cor ? rtHex(at.tx) || rtTx(cor) : "", cat = at.cat || rtGuessCat(at.nome);
  const igual = b => !b.rep && b.data === d && rtaK(b.titulo) === rtaK(at.nome) && (rtHex(b.cor) || "").toLowerCase() === (cor || "").toLowerCase() && !rtSt(b, d);
  let livre = 0;
  for (const [s0, e0] of seg) {
    livre += e0 - s0; S.rotina ||= [];
    const L = S.rotina.find(b => igual(b) && hm2min(b.fim) === s0), R = S.rotina.find(b => igual(b) && hm2min(b.ini) === e0);
    if (L && R) { L.fim = R.fim; S.rotina = S.rotina.filter(b => b !== R); }
    else if (L) L.fim = m2hm(e0);
    else if (R) R.ini = m2hm(s0);
    else S.rotina.push({ id: uid(), data: d, ini: m2hm(s0), fim: m2hm(e0), titulo: at.nome, cat, rep: "", exc: [], st: {}, notas: "", ...(cor ? { cor, tx } : {}) });
  }
  return [seg.length, livre];
}
function rtaAplicar(at, keys = []) {
  const ap = RTA.ap; if (!ap) return; rtaFechar();
  if (ap.modo === "trocar") {
    const b = (S.rotina || []).find(x => x.id === ap.bid); if (!b) { if (keys.length) touch(...keys, { label: "Nova atividade" }); return; }
    b.titulo = at.nome; b.cat = at.cat || b.cat;
    if (rtHex(at.cor)) { b.cor = at.cor; b.tx = rtHex(at.tx) || rtTx(at.cor); } else { delete b.cor; delete b.tx; }
    touch("rotina", ...keys, { label: `Atividade: ${at.nome}` }); undoToast(`${at.nome}${b.rep ? " em todas as repetições" : ""}`); return;
  }
  const [n, livre] = rtaEncher(ap.d, ap.a, ap.z, at);
  if (!n) { if (keys.length) touch(...keys, { label: "Nova atividade" }); toast("Esse horário já está ocupado."); return; }
  touch("rotina", ...keys, { label: `Preencher: ${at.nome}` });
  undoToast(`${at.nome}: ${m2hm(ap.a)}–${m2hm(ap.z)}${livre < ap.z - ap.a ? ` (${durTxt(livre)} livres; o resto já tinha bloco)` : ""}`);
}

/* ---------------------------------------------------------------- a lista suspensa (fica fora do #main: a grade redesenha sem fechá-la) */
function rtaAbrir(o) { RTA.ap = { q: "", ativo: 0, n: 0, nova: null, ...o }; rtaPaint(); setTimeout(() => { if (!RTA.ap) return; const el = RTA.ap.toque ? RTA.el : RTA.el?.querySelector("#rta_q, #rta_nn"); el?.focus({ preventScroll: true }); }, 0); }
function rtaFechar() { RTA.ap = null; if (RTA.el) { RTA.el.hidden = true; RTA.el.innerHTML = ""; } for (const el of $$(".rtslot.pick")) el.classList.remove("pick"); }
function rtaLista() {
  const ap = RTA.ap, q = rtaK(ap.q), ok = a => !q || rtaK(a.nome).includes(q) || rtaK(a.cat).includes(q);
  const P = rtaPadrao().filter(ok), O = rtaOutras().filter(ok), criar = q && !rtaTodas().some(a => rtaK(a.nome) === q) ? ap.q.trim().replace(/\s+/g, " ").slice(0, 40) : "";
  return { P, O, criar };
}
function rtaHTML() {
  const ap = RTA.ap; if (ap.nova) return rtaNovaHTML();
  const { P, O, criar } = rtaLista(), n = P.length + O.length; ap.n = n + (criar ? 1 : 0); ap.ativo = Math.min(ap.ativo, Math.max(0, ap.n - 1));
  const op = (a, i) => `<div role="option" id="rta_o${i}" class="rtao${i === ap.ativo ? " on" : ""}" data-rtao="${i}" aria-selected="${i === ap.ativo}"><i class="rtasw" style="${rtaSw(a)}" aria-hidden="true">Aa</i><span>${esc(a.nome)}</span><small>${esc(a.cat || "")}</small></div>`;
  const grupo = (id, nome, itens, base, vazio) => `<div role="group" aria-labelledby="${id}"><div class="rtag" id="${id}">${nome}<small>${itens.length}</small></div>${itens.length ? itens.map((a, i) => op(a, base + i)).join("") : `<p class="rtavz">${vazio}</p>`}</div>`;
  const quando = ap.modo === "trocar" ? "Trocar a atividade do bloco" : `${m2hm(ap.a)}–${m2hm(ap.z)} · ${fmtDL(ap.d)}`;
  return `<div class="rtah"><div><b>${ap.modo === "trocar" ? "Trocar atividade" : "Preencher"}</b><small>${esc(quando)}</small></div><div class="rtahb"><button type="button" class="iconbtn" data-rta="ger" aria-label="Atividades e cores (gerenciar)" title="Atividades e cores">${ic("palette")}</button><button type="button" class="iconbtn" data-rta="x" aria-label="Fechar a lista">${ic("x")}</button></div></div>
    <input type="search" id="rta_q" class="rtaq" placeholder="Buscar ou criar atividade" value="${esc(ap.q)}" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls="rta_l" aria-activedescendant="${ap.n ? `rta_o${ap.ativo}` : ""}" autocomplete="off">
    <div class="rtal" id="rta_l" role="listbox" aria-label="Atividades">${grupo("rta_gp", esc(rtaNomeGrupo()), P, 0, ap.q ? "Nada com esse nome." : "Nenhum modelo salvo ainda.")}${grupo("rta_go", "Outras", O, P.length, ap.q ? "Nada com esse nome." : "Nenhuma ainda: crie em “Nova atividade”.")}${criar ? `<div role="option" id="rta_o${n}" class="rtao rtacriar${n === ap.ativo ? " on" : ""}" data-rtao="${n}" aria-selected="${n === ap.ativo}">${ic("plus")}<span>Criar “${esc(criar)}” em Outras</span></div>` : ""}</div>
    <div class="rtaf"><button type="button" class="btn sm" data-rta="nova">${ic("plus")}Nova atividade</button>${ap.modo === "encher" ? `<button type="button" class="btn sm ghost" data-rta="lem" title="Lembrete com data e hora neste horário">${ic("bell")}Lembrete aqui</button><button type="button" class="btn sm ghost" data-rta="form">Mais opções…</button>` : ""}</div>`;
}
function rtaNovaHTML() {
  const ap = RTA.ap, n = ap.nova, rot = ap.modo === "encher" ? "Salvar e preencher" : ap.modo === "trocar" ? "Salvar e trocar" : "Salvar";
  return `<form class="rtanova" id="rta_f"><div class="rtah"><div><b>Nova atividade</b><small>entra no grupo “Outras”</small></div><button type="button" class="iconbtn" data-rta="x" aria-label="Fechar a lista">${ic("x")}</button></div>
    <label>Nome<input type="text" id="rta_nn" maxlength="40" value="${esc(n.nome)}" autocomplete="off"></label>
    <div class="rtanr"><label>Cor<input type="color" id="rta_nc" value="${n.cor}"></label><label>Categoria<select id="rta_nk">${RT_CATS.map(([c]) => `<option${c === n.cat ? " selected" : ""}>${c}</option>`).join("")}</select></label></div>
    <div class="rtaprev" id="rta_pv" style="background:${n.cor};color:${rtTx(n.cor)}">${esc(n.nome || "Prévia do bloco")}</div>
    <p class="rtamsg" id="rta_msg" role="alert"></p>
    <div class="rtaf"><button type="button" class="btn sm ghost" data-rta="volta">Voltar</button><button class="btn sm primary">${rot}</button></div></form>`;
}
function rtaSel() {
  for (const el of $$(".rtslot.pick")) el.classList.remove("pick");
  const ap = RTA.ap; if (!ap || ap.modo !== "encher") return;
  for (const el of $$(`.rtcol[data-rtday="${ap.d}"] .rtslot`)) { const m = +el.dataset.rts.split("|")[1]; if (m >= ap.a && m < ap.z) el.classList.add("pick"); }
}
function rtaPos() {
  const ap = RTA.ap, el = RTA.el; if (!ap || !el || el.hidden) return;
  if (PAGE !== "rotina") { rtaFechar(); return; }
  if (innerWidth <= 600) { el.classList.add("sheet"); el.style.left = el.style.top = ""; return; }
  el.classList.remove("sheet");
  const a1 = ap.modo === "trocar" ? $(`.rtb[data-rtb="${ap.bid}|${ap.d}"]`) || $(`.rtb[data-rtb^="${ap.bid}|"]`) : $(`.rtslot[data-rts="${ap.d}|${ap.a}"]`), a2 = ap.modo === "trocar" ? a1 : $(`.rtslot[data-rts="${ap.d}|${ap.z - 30}"]`) || a1;
  const r1 = a1?.getBoundingClientRect(), r2 = a2?.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, sc = $("#rtscroll")?.getBoundingClientRect();
  if (r1 && (r2.bottom <= 0 || r1.top >= innerHeight || sc && (r2.bottom <= sc.top || r1.top >= sc.bottom || r1.right <= sc.left || r1.left >= sc.right))) { rtaFechar(); return; }
  const r = r1 ? { left: r1.left, top: r1.top, bottom: r2.bottom } : { left: innerWidth / 2 - w / 2, top: 96, bottom: 96 };
  let top = r.bottom + 4; if (top + h > innerHeight - 8) top = r.top - h - 4 >= 8 ? r.top - h - 4 : Math.max(8, innerHeight - h - 8);
  el.style.left = `${Math.round(Math.min(Math.max(8, r.left), innerWidth - w - 8))}px`; el.style.top = `${Math.round(top)}px`;
}
function rtaPaint() { const el = rtaEl(); if (!RTA.ap) { rtaFechar(); return; } el.hidden = false; el.innerHTML = rtaHTML(); el.setAttribute("aria-label", RTA.ap.modo === "trocar" ? "Trocar a atividade do bloco" : "Escolher a atividade da faixa"); rtaSel(); rtaPos(); }
/* refaz só a lista (a busca continua com o foco e o cursor onde estavam) */
function rtaPaintLista() {
  const el = RTA.el, t = document.createElement("div"); t.innerHTML = rtaHTML();
  el.querySelector("#rta_l").replaceWith(t.querySelector("#rta_l")); el.querySelector("#rta_q").setAttribute("aria-activedescendant", RTA.ap.n ? `rta_o${RTA.ap.ativo}` : ""); rtaPos();
}
function rtaMarca() {
  const ap = RTA.ap, el = RTA.el;
  for (const o of el.querySelectorAll("[data-rtao]")) { const on = +o.dataset.rtao === ap.ativo; o.classList.toggle("on", on); o.setAttribute("aria-selected", on); if (on) o.scrollIntoView({ block: "nearest" }); }
  el.querySelector("#rta_q")?.setAttribute("aria-activedescendant", ap.n ? `rta_o${ap.ativo}` : "");
}
function rtaEscolher(i) {
  const { P, O, criar } = rtaLista(), opts = [...P, ...O];
  if (i < opts.length) rtaAplicar(opts[i]); else if (criar) rtaNova(criar);
}
function rtaNova(nome = "") { RTA.ap.nova = { nome, cor: rtaCorLivre(), cat: nome ? rtGuessCat(nome) : "Outro" }; rtaPaint(); setTimeout(() => { const i = RTA.el?.querySelector("#rta_nn"); if (i) { i.focus(); i.select(); } }, 0); }
/* nome repetido não entra: nem igual a uma atividade do Standard, nem a outra das Outras (ignorando maiúsculas e acentos) */
function rtaNomeLivre(nome, exceto) { const k = rtaK(nome); return !!k && !rtaTodas().some(a => rtaK(a.nome) === k && (!exceto || a.id !== exceto)); }
function rtaSalvarNova() {
  const ap = RTA.ap, nome = $("#rta_nn").value.trim().replace(/\s+/g, " "), cor = rtHex($("#rta_nc").value) || rtaCorLivre(), cat = $("#rta_nk").value, msg = $("#rta_msg");
  if (!nome) { msg.textContent = "Dê um nome à atividade."; $("#rta_nn").focus(); return; }
  if (!rtaNomeLivre(nome)) { msg.textContent = `“${nome}” já está na lista.`; $("#rta_nn").focus(); return; }
  const at = { id: uid(), nome, cor, tx: rtTx(cor), cat };
  rtaD().outras = [...(rtaD().outras || []), at];
  if (ap.modo === "lista") { rtaFechar(); touch("rotinaAtiv", { label: "Nova atividade" }); undoToast(`Nova atividade: ${nome}`); return; }
  rtaAplicar({ ...at, grupo: "o" }, ["rotinaAtiv"]);
}
function rtaEl() {
  if (RTA.el) return RTA.el;
  const el = document.createElement("div"); el.id = "rta"; el.className = "rta"; el.hidden = true; el.tabIndex = -1; el.setAttribute("role", "dialog"); document.body.appendChild(el); RTA.el = el;
  el.addEventListener("focusout", e => { if (RTA.ap && e.relatedTarget && !el.contains(e.relatedTarget)) rtaFechar(); });
  el.addEventListener("click", e => {
    const t = e.target.closest("[data-rtao],[data-rta]"); if (!t || !RTA.ap) return; e.stopPropagation();
    if (t.dataset.rtao != null) { rtaEscolher(+t.dataset.rtao); return; }
    const a = t.dataset.rta, ap = RTA.ap;
    if (a === "x") rtaFechar();
    else if (a === "nova") rtaNova(ap.q.trim() && !rtaPorNome(ap.q) ? ap.q.trim().slice(0, 40) : "");
    else if (a === "volta") { ap.nova = null; rtaPaint(); setTimeout(() => RTA.el?.querySelector("#rta_q")?.focus(), 0); }
    else if (a === "form") { rtaFechar(); rtForm(null, ap.d, ap.a, ap.z); }
    else if (a === "lem") { rtaFechar(); lemDlg(null, { d: ap.d, h: m2hm(ap.a) }); }
    else if (a === "ger") { rtaFechar(); rtaDlg(); }
  });
  el.addEventListener("input", e => {
    const ap = RTA.ap; if (!ap) return;
    if (e.target.id === "rta_q") { ap.q = e.target.value; ap.ativo = 0; rtaPaintLista(); return; }
    if (ap.nova && (e.target.id === "rta_nn" || e.target.id === "rta_nc")) { ap.nova.nome = $("#rta_nn").value; ap.nova.cor = rtHex($("#rta_nc").value) || ap.nova.cor;
      const pv = $("#rta_pv"); pv.textContent = ap.nova.nome.trim() || "Prévia do bloco"; pv.style.background = ap.nova.cor; pv.style.color = rtTx(ap.nova.cor); $("#rta_msg").textContent = ""; }
  });
  el.addEventListener("change", e => { if (e.target.id === "rta_nk" && RTA.ap?.nova) RTA.ap.nova.cat = e.target.value; });
  el.addEventListener("submit", e => { e.preventDefault(); if (RTA.ap?.nova) rtaSalvarNova(); });
  el.addEventListener("keydown", e => {
    const ap = RTA.ap; if (!ap) return; e.stopPropagation();
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (ap.nova) { ap.nova = null; rtaPaint(); setTimeout(() => RTA.el?.querySelector("#rta_q")?.focus(), 0); } else rtaFechar(); return; }
    if (ap.nova || e.target.id !== "rta_q") return;
    const N = Math.max(1, ap.n);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); ap.ativo = (ap.ativo + (e.key === "ArrowDown" ? 1 : -1) + N) % N; rtaMarca(); }
    else if (e.key === "Home" && e.ctrlKey || e.key === "PageUp") { e.preventDefault(); ap.ativo = 0; rtaMarca(); }
    else if (e.key === "End" && e.ctrlKey || e.key === "PageDown") { e.preventDefault(); ap.ativo = N - 1; rtaMarca(); }
    else if (e.key === "Enter") { e.preventDefault(); if (ap.n) rtaEscolher(ap.ativo); else if (ap.q.trim()) rtaNova(ap.q.trim().slice(0, 40)); }
  });
  return el;
}
/* fora da lista, ela fecha; ao rolar ou mudar o tamanho da janela, acompanha a célula; ao trocar de aba, fecha */
document.addEventListener("pointerdown", e => { if (RTA.ap && !e.target.closest?.("#rta")) rtaFechar(); }, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && RTA.ap && !e.target.closest?.("#rta")) rtaFechar(); });
document.addEventListener("scroll", () => { if (RTA.ap) rtaPos(); }, true);
window.addEventListener("resize", () => { if (RTA.ap) rtaPos(); });
window.addEventListener("hashchange", () => { if (RTA.ap) rtaFechar(); });
/* depois que a Rotina redesenha: marca de novo a faixa e reposiciona */
function rtaSync() { if (!RTA.ap) return; if (PAGE !== "rotina") { rtaFechar(); return; } rtaSel(); rtaPos(); }

/* ---------------------------------------------------------------- “Atividades e cores”: a lista padrão e o cadastro das outras */
function rtaDlg() {
  const dlg = $("#dlg"), P = rtaPadrao(), O = rtaOutras(), M = (S.rotinaModelos || []).filter(m => m.semana?.length), F = rtaD().fonte ? [] : rtaFontes();
  const catSel = (sel, attr) => `<select ${attr}>${RT_CATS.map(([c]) => `<option${c === sel ? " selected" : ""}>${c}</option>`).join("")}</select>`;
  dlg.innerHTML = `<form method="dialog" class="rtadlg" id="rtadf"><div class="rtch"><div><h3>Atividades e cores</h3><p class="muted small">É a lista suspensa de cada meia hora da grade. A cor vai junto para o bloco.</p></div><button type="button" class="iconbtn" data-rtadx aria-label="Fechar">${ic("x")}</button></div>
    <div class="flbl">Standard Semanal · ${P.length} ${P.length === 1 ? "atividade" : "atividades"} · cor fixa do modelo</div>
    <label class="rtadsrc">Vem do modelo<select id="rtad_f"><option value="">Automático${F.length ? ` (${esc(trunc(F.map(m => m.nome).join(", "), 60))})` : M.length ? "" : " (modelos prontos do Atlas)"}</option>${M.map(m => `<option value="${esc(m.id)}"${rtaD().fonte === m.id ? " selected" : ""}>${esc(m.nome)}</option>`).join("")}</select></label>
    <div class="rtadp">${P.map(a => `<span class="rtadc" style="${rtaSw(a)}" title="${esc(a.cat)} · ${durTxt(a.min)} por semana no modelo">${esc(a.nome)}</span>`).join("") || `<p class="muted small">Sem atividades: salve um modelo na Rotina (Modelos e atalhos).</p>`}</div>
    <div class="flbl">Outras · ${O.length}</div>
    <div class="rtado">${O.map(a => `<div class="rtadr"><input type="color" value="${a.cor}" data-rtadc="${a.id}" aria-label="Cor de ${esc(a.nome)}"><input type="text" value="${esc(a.nome)}" data-rtadn="${a.id}" maxlength="40" aria-label="Nome da atividade">${catSel(a.cat, `data-rtadk="${a.id}" aria-label="Categoria de ${esc(a.nome)}"`)}<button type="button" class="iconbtn" data-rtadd="${a.id}" aria-label="Excluir ${esc(a.nome)}">${ic("trash")}</button></div>`).join("") || `<p class="muted small">Nenhuma ainda.</p>`}</div>
    <div class="rtadr rtadnova"><input type="color" id="rtad_nc" value="${rtaCorLivre()}" aria-label="Cor da nova atividade"><input type="text" id="rtad_nn" maxlength="40" placeholder="Nova atividade" aria-label="Nome da nova atividade">${catSel("Outro", `id="rtad_nk" aria-label="Categoria da nova atividade"`)}<button type="button" class="btn sm" data-rtada>${ic("plus")}Adicionar</button></div>
    <p class="muted small" id="rtad_msg" role="status"></p>
    <p class="muted small">Mudar a cor, o nome ou a categoria de uma atividade de “Outras” atualiza os blocos que já a usam. Excluir só tira da lista: os blocos ficam.</p></form>`;
  const msg = t => { const m = $("#rtad_msg"); if (m) m.textContent = t; };
  const achar = id => (rtaD().outras || []).find(a => a.id === id);
  const blocosDe = a => (S.rotina || []).filter(b => rtaK(b.titulo) === rtaK(a.nome) && (rtHex(b.cor) || "").toLowerCase() === (a.cor || "").toLowerCase());
  $("[data-rtadx]", dlg).onclick = () => dlg.close();
  $("#rtad_f").onchange = e => { rtaD().fonte = e.target.value; touch("rotinaAtiv", { label: "Lista padrão das atividades" }); rtaDlg(); };
  for (const i of $$("[data-rtadc]", dlg)) i.onchange = () => { const a = achar(i.dataset.rtadc), c = rtHex(i.value); if (!a || !c) return; const bs = blocosDe(a);
    a.cor = c; a.tx = rtTx(c); for (const b of bs) { b.cor = c; b.tx = a.tx; } touch("rotinaAtiv", ...(bs.length ? ["rotina"] : []), { label: `Cor de ${a.nome}` }); msg(`${a.nome}: cor nova${bs.length ? ` em ${plural(bs.length, "bloco", "blocos")}` : ""}.`); };
  for (const i of $$("[data-rtadn]", dlg)) i.onchange = () => { const a = achar(i.dataset.rtadn), nome = i.value.trim().replace(/\s+/g, " "); if (!a) return;
    if (!nome || !rtaNomeLivre(nome, a.id)) { i.value = a.nome; msg(nome ? `“${nome}” já está na lista.` : "O nome não pode ficar vazio."); return; }
    const bs = blocosDe(a); for (const b of bs) b.titulo = nome; a.nome = nome; touch("rotinaAtiv", ...(bs.length ? ["rotina"] : []), { label: "Atividade renomeada" }); msg(`Renomeada${bs.length ? ` em ${plural(bs.length, "bloco", "blocos")}` : ""}.`); };
  for (const s of $$("[data-rtadk]", dlg)) s.onchange = () => { const a = achar(s.dataset.rtadk); if (!a) return; const bs = blocosDe(a);
    a.cat = s.value; for (const b of bs) b.cat = s.value; touch("rotinaAtiv", ...(bs.length ? ["rotina"] : []), { label: `Categoria de ${a.nome}` }); msg(`${a.nome}: ${s.value}.`); };
  for (const b of $$("[data-rtadd]", dlg)) b.onclick = () => { const a = achar(b.dataset.rtadd); if (!a) return; rtaD().outras = rtaD().outras.filter(x => x.id !== a.id); touch("rotinaAtiv", { label: "Atividade excluída" }); undoToast(`${a.nome} saiu da lista (os blocos ficam)`); rtaDlg(); };
  const nova = () => { const nome = $("#rtad_nn").value.trim().replace(/\s+/g, " "), cor = rtHex($("#rtad_nc").value) || rtaCorLivre();
    if (!nome) { msg("Dê um nome à atividade."); $("#rtad_nn").focus(); return; } if (!rtaNomeLivre(nome)) { msg(`“${nome}” já está na lista.`); $("#rtad_nn").focus(); return; }
    rtaD().outras = [...(rtaD().outras || []), { id: uid(), nome, cor, tx: rtTx(cor), cat: $("#rtad_nk").value }]; touch("rotinaAtiv", { label: "Nova atividade" }); rtaDlg(); msg(`${nome} entrou em Outras.`); setTimeout(() => $("#rtad_nn")?.focus(), 0); };
  $("[data-rtada]", dlg).onclick = nova;
  $("#rtad_nn").onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); nova(); } };
  $("#rtad_nn").oninput = () => { const k = $("#rtad_nk"); if (k && k.dataset.mexido !== "1") k.value = rtGuessCat($("#rtad_nn").value); };
  $("#rtad_nk").onchange = e => { e.target.dataset.mexido = "1"; };
  $("#rtadf").onsubmit = e => e.preventDefault();
  if (!dlg.open) dlg.showModal();
}
