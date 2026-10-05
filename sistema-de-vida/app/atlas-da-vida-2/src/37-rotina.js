/* ================================================================ Rotina: planejador do dia em blocos de 30 minutos
   Três vistas sincronizadas pela mesma data (RT.d): dia (as horas do dia), semana (sete dias lado a lado com as horas) e mês (grade).
   Blocos em S.rotina: { id, data, ini "07:30", fim "08:00", titulo, cat, rep "" | "diario" | "uteis" | "semanal", exc [datas], feitos {data: 1}, notas }.
   Os compromissos da Agenda (e do Google Calendar) e as tarefas com prazo aparecem junto, só para leitura. */
const RT = { d: TODAY, ini: 6, fim: 24, drag: null };
const RT_SLOT = 22;
const RT_CATS = [["Trabalho", "var(--a-car)"], ["Estudo", "var(--a-apr)"], ["Saúde & treino", "var(--a-fis)"], ["Casa", "var(--a-fam)"], ["Pessoas", "var(--a-ami)"], ["Lazer", "var(--a-laz)"], ["Descanso", "var(--a-men)"], ["Espiritual", "var(--jp-med)"], ["Deslocamento", "var(--muted)"], ["Outro", "var(--ink-2)"]];
const rtCor = c => (RT_CATS.find(x => x[0] === c) || RT_CATS.at(-1))[1];
const REP_TXT = { "": "Não repete", diario: "Todo dia", uteis: "Dias úteis (seg–sex)", semanal: "Toda semana neste dia" };
const m2hm = m => `${pad(Math.floor(m / 60) % 24 === 0 && m >= 1440 ? 24 : Math.floor(m / 60))}:${pad(m % 60)}`;
const hm2min = s => { const m = String(s || "").match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const rtView = () => SUB === "semana" || SUB === "mes" ? SUB : "dia";
const rtWeek = d => { const s = weekStart(d); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
const isoWeek = d => { const x = parse(d); x.setDate(x.getDate() + 3 - (x.getDay() + 6) % 7); const y = new Date(x.getFullYear(), 0, 4); return 1 + Math.round(((x - y) / 864e5 - 3 + (y.getDay() + 6) % 7) / 7); };
/* blocos que valem num dia: os do próprio dia e as repetições */
function rtOcc(d) {
  const dow = parse(d).getDay();
  return (S.rotina || []).filter(b => !(b.exc || []).includes(d) && (b.rep ? b.data <= d && (b.rep === "diario" || (b.rep === "uteis" && dow >= 1 && dow <= 5) || (b.rep === "semanal" && parse(b.data).getDay() === dow)) : b.data === d))
    .map(b => ({ ...b, a: hm2min(b.ini), z: hm2min(b.fim), done: !!(b.feitos || {})[d], day: d }));
}
function rtAgenda(d) {
  const ev = (S.eventos || []).filter(e => e.data === d || (e.ate && e.data <= d && e.ate >= d)).map(e => { const a = hm2min(e.hora), z = hm2min(e.fim) ?? (a != null ? a + 60 : null); return { id: e.id, titulo: e.titulo, a, z, gcal: e.origem === "gcal", local: e.local, dia: a == null || (e.ate && e.data !== d) }; });
  const tar = S.tarefas.filter(t => t.prazo === d && t.status !== "Concluída" && t.status !== "Cancelada");
  return { timed: ev.filter(e => !e.dia), allday: ev.filter(e => e.dia), tar };
}
/* colunas para blocos que se sobrepõem */
function rtLayout(items) {
  const s = [...items].sort((x, y) => x.a - y.a || y.z - x.z), cols = []; let group = [], end = -1;
  const flush = () => { const n = Math.max(...group.map(g => g.col)) + 1; group.forEach(g => g.n = n); group = []; };
  for (const it of s) { if (it.a >= end && group.length) { flush(); cols.length = 0; } let c = cols.findIndex(z => z <= it.a); if (c < 0) { c = cols.length; cols.push(0); } cols[c] = it.z; it.col = c; group.push(it); end = Math.max(end, it.z); }
  if (group.length) flush(); return s;
}
function rtRange(days) {
  /* mostra 06–24 por padrão; amplia se houver bloco fora disso */
  let a = RT.ini * 60, z = RT.fim * 60;
  for (const d of days) for (const x of [...rtOcc(d), ...rtAgenda(d).timed]) { if (x.a != null && x.a < a) a = Math.floor(x.a / 60) * 60; if (x.z != null && x.z > z) z = Math.min(1440, Math.ceil(x.z / 60) * 60); }
  return [a, z];
}
const rtPer = () => { const v = rtView(), d = RT.d;
  if (v === "dia") return { t: fmtDL(d).replace(/^./, c => c.toUpperCase()) + ` de ${d.slice(0, 4)}`, s: d === TODAY ? "hoje" : d === addDays(TODAY, 1) ? "amanhã" : d === addDays(TODAY, -1) ? "ontem" : "" };
  if (v === "semana") { const w = rtWeek(d); return { t: `Semana ${isoWeek(d)} · ${parse(w[0]).getDate()} ${MESES[parse(w[0]).getMonth()].slice(0, 3).toLowerCase()} – ${parse(w[6]).getDate()} ${MESES[parse(w[6]).getMonth()].slice(0, 3).toLowerCase()} ${w[6].slice(0, 4)}`, s: w.includes(TODAY) ? "esta semana" : "" }; }
  return { t: `${MESES[parse(d).getMonth()]} ${d.slice(0, 4)}`, s: d.slice(0, 7) === TODAY.slice(0, 7) ? "este mês" : "" }; };
function rtMini() {
  const d = RT.d, m0 = parse(d.slice(0, 8) + "01"), first = weekStart(iso(m0)), v = rtView(), wk = rtWeek(d);
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(first, i * 7)).filter((w, i) => i < 5 || w.slice(0, 7) === d.slice(0, 7));
  return `<div class="rtmini" aria-label="Calendário"><div class="rtmh"><button type="button" class="iconbtn" data-rtmini="-1" aria-label="Mês anterior">‹</button><b>${MESES[m0.getMonth()]} ${m0.getFullYear()}</b><button type="button" class="iconbtn" data-rtmini="1" aria-label="Próximo mês">›</button></div>
    <table><thead><tr><th title="Número da semana">#</th>${["S", "T", "Q", "Q", "S", "S", "D"].map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${weeks.map(w => `<tr class="${v === "semana" && w === wk[0] ? "sel" : ""}"><td><button type="button" class="rtwk" data-rtgo="semana|${w}" title="Ver a semana ${isoWeek(w)}">${isoWeek(w)}</button></td>${Array.from({ length: 7 }, (_, i) => { const x = addDays(w, i), n = rtOcc(x).length + rtAgenda(x).timed.length; return `<td><button type="button" class="rtmd${x.slice(0, 7) !== d.slice(0, 7) ? " out" : ""}${x === TODAY ? " today" : ""}${x === d && v !== "mes" ? " sel" : ""}" data-rtgo="dia|${x}" aria-label="${fmtDL(x)}">${parse(x).getDate()}${n ? "<i></i>" : ""}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function rtCol(d, a, z, o = {}) {
  const occ = rtLayout(rtOcc(d).filter(b => b.a != null && b.z > b.a)), ag = rtLayout(rtAgenda(d).timed.filter(e => e.a != null)), h = (z - a) / 30 * RT_SLOT;
  const pos = (x, n, col) => `top:${(Math.max(x.a, a) - a) / 30 * RT_SLOT}px;height:${Math.max(RT_SLOT - 2, (Math.min(x.z, z) - Math.max(x.a, a)) / 30 * RT_SLOT - 2)}px;left:calc(${col / n * 100}% + 2px);width:calc(${100 / n}% - 4px)`;
  const slots = Array.from({ length: (z - a) / 30 }, (_, i) => { const m = a + i * 30; return `<div class="rtslot${m % 60 ? " half" : ""}" data-rts="${d}|${m}" title="${m2hm(m)}–${m2hm(m + 30)}"></div>`; }).join("");
  const now = d === TODAY ? (() => { const n = new Date(), m = n.getHours() * 60 + n.getMinutes(); return m >= a && m <= z ? `<div class="rtnow" style="top:${(m - a) / 30 * RT_SLOT}px"></div>` : ""; })() : "";
  const all = [...occ.map(x => ({ x, t: "b" })), ...ag.map(x => ({ x, t: "e" }))], n = Math.max(1, ...occ.map(x => x.n || 1));
  return `<div class="rtcol${d === TODAY ? " today" : ""}" style="height:${h}px" data-rtday="${d}">${slots}
    ${occ.map(b => `<button type="button" class="rtb${b.done ? " done" : ""}${(b.z - b.a) <= 30 ? " short" : ""}" style="${pos(b, b.n || 1, b.col)};--c:${rtCor(b.cat)}" data-rtb="${b.id}|${d}" title="${esc(`${b.ini}–${b.fim} · ${b.titulo}${b.rep ? " · " + REP_TXT[b.rep] : ""}`)}"><b>${esc(b.titulo)}</b><small>${b.ini}–${b.fim}${b.rep ? ` ${ic("repeat")}` : ""}</small></button>`).join("")}
    ${ag.map(e => `<div class="rte${e.gcal ? " gcal" : ""}" style="${pos(e, e.n || 1, e.col)}" title="${esc(`${m2hm(e.a)}–${m2hm(e.z)} · ${e.titulo}${e.local ? " · " + e.local : ""} (Agenda${e.gcal ? ", Google" : ""})`)}"><b>${esc(e.titulo)}</b><small>${m2hm(e.a)}–${m2hm(e.z)} · agenda</small></div>`).join("")}${now}</div>`;
}
function rtTimes(a, z) { return `<div class="rttimes" style="height:${(z - a) / 30 * RT_SLOT}px">${Array.from({ length: (z - a) / 30 }, (_, i) => { const m = a + i * 30; return `<span class="${m % 60 ? "half" : ""}" style="top:${i * RT_SLOT}px">${m % 60 ? ":30" : m2hm(m)}</span>`; }).join("")}</div>`; }
function rtAllday(d) { const A = rtAgenda(d); return [...A.allday.map(e => `<span class="rtad e" title="Agenda">${ic("cal")}${esc(e.titulo)}</span>`), ...A.tar.map(t => `<span class="rtad t" title="Tarefa com prazo">${ic("checksq")}${esc(t.tarefa)}</span>`)].join(""); }
function rtGrid(days) {
  const [a, z] = rtRange(days), one = days.length === 1;
  return `<div class="rtgrid${one ? " one" : ""}" style="--n:${days.length}">
    <div class="rthead"><div class="rtcorner"></div>${days.map(d => `<button type="button" class="rtdh${d === TODAY ? " today" : ""}${d === RT.d && !one ? " sel" : ""}" data-rtgo="dia|${d}"><small>${DOWL[parse(d).getDay()].slice(0, 3)}</small><b>${parse(d).getDate()}</b></button>`).join("")}</div>
    <div class="rtallrow"><div class="rtcorner"><small>dia todo</small></div>${days.map(d => `<div class="rtall">${rtAllday(d)}</div>`).join("")}</div>
    <div class="rtbody">${rtTimes(a, z)}${days.map(d => rtCol(d, a, z)).join("")}</div></div>`;
}
function rtMonth() {
  const d = RT.d, m0 = d.slice(0, 7), first = weekStart(m0 + "-01"), weeks = Array.from({ length: 6 }, (_, i) => addDays(first, i * 7)).filter((w, i) => i < 5 || w.slice(0, 7) === m0);
  return `<div class="rtmonth"><div class="rtmw hd"><span></span>${["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map(x => `<span>${x}</span>`).join("")}</div>${weeks.map(w => `<div class="rtmw"><button type="button" class="rtwk" data-rtgo="semana|${w}" title="Ver a semana">${isoWeek(w)}</button>${Array.from({ length: 7 }, (_, i) => { const x = addDays(w, i), bs = rtOcc(x).sort((p, q) => p.a - q.a), A = rtAgenda(x), items = [...bs.map(b => `<i style="--c:${rtCor(b.cat)}"${b.done ? ' class="done"' : ""}>${b.ini} ${esc(b.titulo)}</i>`), ...A.timed.map(e => `<i class="e">${m2hm(e.a)} ${esc(e.titulo)}</i>`), ...A.allday.map(e => `<i class="e">${esc(e.titulo)}</i>`)];
    return `<button type="button" class="rtmc${x.slice(0, 7) !== m0 ? " out" : ""}${x === TODAY ? " today" : ""}" data-rtgo="dia|${x}" aria-label="${fmtDL(x)}: ${items.length} itens"><b>${parse(x).getDate()}</b>${items.slice(0, 3).join("")}${items.length > 3 ? `<em>+${items.length - 3}</em>` : ""}</button>`; }).join("")}</div>`).join("")}</div>`;
}
function rtResumo(days) {
  const per = {}; let tot = 0, feito = 0;
  for (const d of days) for (const b of rtOcc(d)) { const m = Math.max(0, b.z - b.a); per[b.cat || "Outro"] = (per[b.cat || "Outro"] || 0) + m; tot += m; if (b.done) feito += m; }
  const rows = Object.entries(per).sort((x, y) => y[1] - x[1]);
  return panel(`${ic("clock")}No período <small>${num(tot / 60, 1)} h planejadas · ${tot ? pct(feito / tot) : "–"} feitas</small>`, rows.length ? hbars(rows.map(([c, m]) => ({ l: c, v: m / 60, color: rtCor(c) })), { fmt: v => num(v, 1) + " h" }) : `<div class="empty">Nenhum bloco neste período. Clique numa meia hora (ou arraste por várias) para criar.</div>`);
}
function pRotina() {
  const v = rtView(), P = rtPer(), days = v === "dia" ? [RT.d] : rtWeek(RT.d);
  return `<div class="rt">
    <div class="rtbar"><div class="seg-g" role="group" aria-label="Visualização">${[["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]].map(([k, l]) => `<button type="button" class="seg" data-rtv="${k}" aria-pressed="${v === k}">${l}</button>`).join("")}</div>
      <div class="rtnav"><button type="button" class="iconbtn" data-rtnav="-1" aria-label="${v === "dia" ? "Dia anterior" : v === "semana" ? "Semana anterior" : "Mês anterior"}">‹</button><button type="button" class="btn sm" data-rtnav="0">Hoje</button><button type="button" class="iconbtn" data-rtnav="1" aria-label="${v === "dia" ? "Próximo dia" : v === "semana" ? "Próxima semana" : "Próximo mês"}">›</button></div>
      <div class="rtper"><h2>${esc(P.t)}</h2>${P.s ? `<span class="pill good">${P.s}</span>` : ""}</div>
      <button type="button" class="btn sm primary" data-act="rtnovo">${ic("plus")}Bloco</button></div>
    <div class="rtwrap"><aside class="rtside">${rtMini()}${rtResumo(v === "mes" ? Array.from({ length: 31 }, (_, i) => addDays(RT.d.slice(0, 8) + "01", i)).filter(x => x.slice(0, 7) === RT.d.slice(0, 7)) : days)}
      <div class="rtleg">${RT_CATS.map(([c, col]) => `<span style="--c:${col}"><i></i>${c}</span>`).join("")}<span class="ag"><i></i>Agenda / Google</span></div>
      <p class="muted small">Atalhos: ← → mudam o período, T volta para hoje, D, S e M trocam a vista.</p></aside>
      <section class="rtmain" aria-label="${esc(P.t)}">${v === "mes" ? rtMonth() : rtGrid(days)}</section></div></div>`;
}
/* formulário do bloco */
const RT_TIMES = Array.from({ length: 49 }, (_, i) => i * 30);
function rtForm(id, day, a, z) {
  const b = id ? (S.rotina || []).find(x => x.id === id) : null, o = b ? { ...b } : { data: day || RT.d, ini: m2hm(a ?? 8 * 60), fim: m2hm(z ?? (a ?? 8 * 60) + 30), titulo: "", cat: "Trabalho", rep: "" }, occDay = day || o.data;
  const opt = (sel, from) => RT_TIMES.filter(m => from ? m > 0 : m < 1440).map(m => `<option${m2hm(m) === sel ? " selected" : ""}>${m2hm(m)}</option>`).join("");
  const dlg = $("#dlg");
  dlg.innerHTML = `<form method="dialog" id="rtf" class="rtf"><h3>${b ? "Editar bloco" : "Novo bloco"}</h3><div class="form f2">
    <label class="full">O quê<input type="text" id="rt_t" value="${esc(o.titulo)}" placeholder="Ex.: Inglês, treino, revisão do projeto" required></label>
    <label>Dia<input type="date" id="rt_d" value="${b && b.rep ? o.data : occDay}"${b && b.rep ? " disabled" : ""}></label>
    <label>Categoria<select id="rt_c">${RT_CATS.map(([c]) => `<option${o.cat === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
    <label>Começa<select id="rt_a">${opt(o.ini)}</select></label><label>Termina<select id="rt_z">${opt(o.fim, true)}</select></label>
    <label class="full">Repetir<select id="rt_r">${Object.entries(REP_TXT).map(([k, l]) => `<option value="${k}"${(o.rep || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="full">Notas<input type="text" id="rt_n" value="${esc(o.notas || "")}"></label></div>
    <p class="muted small" id="rt_msg"></p>
    ${b ? `<label class="chk"><input type="checkbox" id="rt_done"${(b.feitos || {})[occDay] ? " checked" : ""}> Feito em ${fmtD(occDay)}</label>${b.rep ? `<p class="muted small">É um bloco que se repete: as mudanças valem para todas as repetições.</p>` : ""}` : ""}
    <div class="dlgfoot"><div>${b ? `<button type="button" class="btn danger" id="rt_del">Excluir${b.rep ? " só este dia" : ""}</button>${b.rep ? `<button type="button" class="btn ghost" id="rt_delall">Excluir a série</button>` : ""}` : ""}</div><div class="row"><button type="button" class="btn" id="rt_x">Cancelar</button><button class="btn primary">Salvar</button></div></div></form>`;
  const msg = () => { const a1 = hm2min($("#rt_a").value), z1 = hm2min($("#rt_z").value), m = $("#rt_msg"); m.textContent = z1 <= a1 ? "O fim precisa ser depois do começo." : `${num((z1 - a1) / 60, (z1 - a1) % 60 ? 1 : 0)} h · ${(z1 - a1) / 30} blocos de 30 min`; m.className = "muted small" + (z1 <= a1 ? " st-crit" : ""); return z1 > a1; };
  $("#rt_a").onchange = () => { const a1 = hm2min($("#rt_a").value), z1 = hm2min($("#rt_z").value); if (z1 <= a1) $("#rt_z").value = m2hm(Math.min(1440, a1 + 30)); msg(); }; $("#rt_z").onchange = msg; msg();
  $("#rt_x").onclick = () => dlg.close();
  if (b) { $("#rt_del").onclick = () => { if (b.rep) { b.exc = [...(b.exc || []), occDay]; } else S.rotina = S.rotina.filter(x => x.id !== b.id); dlg.close(); touch("rotina", { label: "Bloco excluído" }); undoToast("Bloco excluído"); };
    const da = $("#rt_delall"); if (da) da.onclick = () => { S.rotina = S.rotina.filter(x => x.id !== b.id); dlg.close(); touch("rotina", { label: "Série excluída" }); undoToast("Série excluída"); }; }
  $("#rtf").onsubmit = e => { e.preventDefault(); if (!msg()) return; const t = $("#rt_t").value.trim(); if (!t) { $("#rt_t").focus(); return; }
    const rec = { ...(b || { id: uid(), feitos: {}, exc: [] }), titulo: t, cat: $("#rt_c").value, ini: $("#rt_a").value, fim: $("#rt_z").value, rep: $("#rt_r").value, notas: $("#rt_n").value.trim(), data: b && b.rep ? b.data : $("#rt_d").value || occDay };
    if (b) { const dn = $("#rt_done"); rec.feitos = { ...(b.feitos || {}) }; if (dn.checked) rec.feitos[occDay] = 1; else delete rec.feitos[occDay]; S.rotina = S.rotina.map(x => x.id === b.id ? rec : x); } else (S.rotina ||= []).push(rec);
    RT.d = rec.rep ? RT.d : rec.data; dlg.close(); touch("rotina", { label: b ? "Bloco editado" : "Bloco criado" }); if (!b) undoToast(`${rec.titulo}: ${rec.ini}–${rec.fim}`); };
  dlg.showModal(); setTimeout(() => $("#rt_t")?.focus(), 30);
}
/* navegação */
function rtGo(view, d) { if (d) RT.d = d; if (view && view !== rtView()) { setHash("rotina", view); return; } render(); }
function rtShift(k) { const v = rtView(); RT.d = k === 0 ? TODAY : v === "dia" ? addDays(RT.d, k) : v === "semana" ? addDays(RT.d, 7 * k) : addMonths(RT.d.slice(0, 8) + "01", k); render(); }
function rtClick(t) {
  const ds = t.dataset;
  if (ds.rtv) { setHash("rotina", ds.rtv); return true; }
  if (ds.rtnav != null) { rtShift(+ds.rtnav); return true; }
  if (ds.rtmini) { RT.d = addMonths(RT.d.slice(0, 8) + "01", +ds.rtmini); render(); return true; }
  if (ds.rtgo) { const [v, d] = ds.rtgo.split("|"); rtGo(v, d); return true; }
  if (ds.rtb) { const [id, d] = ds.rtb.split("|"); rtForm(id, d); return true; }
  if (ds.rtdone) { const b = (S.rotina || []).find(x => x.id === ds.rtdone); if (b) { b.feitos = { ...(b.feitos || {}) }; if (t.checked) b.feitos[TODAY] = 1; else delete b.feitos[TODAY]; touch("rotina", { label: "Rotina" }); } return true; }
  if (ds.act === "rtnovo") { const n = new Date(), m = RT.d === TODAY ? Math.ceil((n.getHours() * 60 + n.getMinutes()) / 30) * 30 : 9 * 60; rtForm(null, RT.d, Math.min(m, 1410)); return true; }
  return false;
}
/* arrastar sobre as meias horas cria um bloco com a duração escolhida; no toque, um toque abre o formulário */
function rtSlotAt(x, y) { const el = document.elementFromPoint(x, y)?.closest?.(".rtslot"); return el ? el.dataset.rts.split("|") : null; }
function rtPaintDrag() { for (const el of $$(".rtslot.pick")) el.classList.remove("pick"); const D = RT.drag; if (!D) return; const [lo, hi] = [Math.min(D.a, D.b), Math.max(D.a, D.b)]; for (const el of $$(`.rtcol[data-rtday="${D.d}"] .rtslot`)) { const m = +el.dataset.rts.split("|")[1]; if (m >= lo && m <= hi) el.classList.add("pick"); } }
document.addEventListener("pointerdown", e => { const s = e.target.closest?.(".rtslot"); if (!s || e.button > 0) return; const [d, m] = s.dataset.rts.split("|"); RT.drag = { d, a: +m, b: +m, touch: e.pointerType === "touch" }; if (!RT.drag.touch) { e.preventDefault(); rtPaintDrag(); } });
document.addEventListener("pointermove", e => { const D = RT.drag; if (!D || D.touch) return; const hit = rtSlotAt(e.clientX, e.clientY); if (hit && hit[0] === D.d && +hit[1] !== D.b) { D.b = +hit[1]; rtPaintDrag(); } });
document.addEventListener("pointerup", e => { const D = RT.drag; if (!D) return; RT.drag = null; rtPaintDrag(); if (D.touch) { const s = e.target.closest?.(".rtslot"); if (!s || s.dataset.rts !== `${D.d}|${D.a}`) return; } const lo = Math.min(D.a, D.b), hi = Math.max(D.a, D.b) + 30; rtForm(null, D.d, lo, hi); });
document.addEventListener("pointercancel", () => { if (RT.drag) { RT.drag = null; rtPaintDrag(); } });
document.addEventListener("keydown", e => { if (PAGE !== "rotina" || e.target.matches?.("input,textarea,select") || $("#dlg")?.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key; if (k === "ArrowLeft" || k === "ArrowRight") { e.preventDefault(); rtShift(k === "ArrowLeft" ? -1 : 1); } else if (k === "t" || k === "T") rtShift(0); else if ("dDsSmM".includes(k) && k.length === 1) setHash("rotina", { d: "dia", s: "semana", m: "mes" }[k.toLowerCase()]); });
/* a linha do “agora” anda sozinha */
setInterval(() => { if (PAGE !== "rotina") return; const el = $(".rtcol.today .rtnow"); if (!el) return; const [a] = rtRange(rtView() === "dia" ? [RT.d] : rtWeek(RT.d)), n = new Date(); el.style.top = `${(n.getHours() * 60 + n.getMinutes() - a) / 30 * RT_SLOT}px`; }, 60e3);
