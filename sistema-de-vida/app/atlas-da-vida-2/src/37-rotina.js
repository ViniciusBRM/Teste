/* ================================================================ Rotina: planejador do dia em blocos de 30 minutos
   Vistas dia, semana e mês sincronizadas pela mesma data (RT.d). A grade cobre as 24 h com rolagem própria, cabeçalho e horas fixos,
   e abre perto de agora (ou do primeiro bloco). Blocos: S.rotina = { id, data, ini, fim, titulo, cat, rep, exc[], st{dia: feito|parcial|pulado}, notas }
   (o antigo feitos{dia:1} continua valendo como “feito”). Modelos: S.rotinaModelos. A Agenda e o Google aparecem tracejados, só leitura.
   Arrastar no vazio cria; arrastar um bloco move (também entre dias na semana); a alça de baixo estica. Um bloco repetido movido vira
   exceção naquele dia e uma cópia avulsa no novo horário, como nas agendas. */
const RT = { d: TODAY, drag: null, mv: null, just: 0, q: "", pick: false, scrolled: "" };
const RT_Z = { compacto: 18, normal: 28, grande: 40 };
const rtSH = () => RT_Z[S.cfg.rtZoom] || RT_Z.normal;
const RT_CATS = [["Trabalho", "var(--a-car)"], ["Estudo", "var(--a-apr)"], ["Saúde & treino", "var(--a-fis)"], ["Casa", "var(--a-fam)"], ["Pessoas", "var(--a-ami)"], ["Lazer", "var(--a-laz)"], ["Descanso", "var(--a-men)"], ["Espiritual", "var(--jp-med)"], ["Deslocamento", "var(--muted)"], ["Outro", "var(--ink-2)"]];
const rtCor = c => (RT_CATS.find(x => x[0] === c) || RT_CATS.at(-1))[1];
const REP_TXT = { "": "Não repete", diario: "Todo dia", uteis: "Dias úteis (seg–sex)", semanal: "Toda semana neste dia" };
const ST_TXT = { feito: "Feito", parcial: "Parcial", pulado: "Pulado" };
const m2hm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const hm2min = s => { const m = String(s || "").match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const rtView = () => SUB === "semana" || SUB === "mes" ? SUB : "dia";
const rtWeek = d => { const s = weekStart(d); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
const isoWeek = d => { const x = parse(d); x.setDate(x.getDate() + 3 - (x.getDay() + 6) % 7); const y = new Date(x.getFullYear(), 0, 4); return 1 + Math.round(((x - y) / 864e5 - 3 + (y.getDay() + 6) % 7) / 7); };
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const rtWake = () => [hm2min(S.cfg.rtAcordar || "06:30"), hm2min(S.cfg.rtDormir || "23:00")];
const durTxt = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}` : `${m} min`;
const rtSt = (b, d) => (b.st || {})[d] || ((b.feitos || {})[d] ? "feito" : "");
/* blocos que valem num dia: os do próprio dia e as repetições */
function rtOcc(d) {
  const dow = parse(d).getDay();
  return (S.rotina || []).filter(b => !(b.exc || []).includes(d) && (b.rep ? b.data <= d && (b.rep === "diario" || (b.rep === "uteis" && dow >= 1 && dow <= 5) || (b.rep === "semanal" && parse(b.data).getDay() === dow)) : b.data === d))
    .map(b => { const st = rtSt(b, d); return { ...b, a: hm2min(b.ini), z: hm2min(b.fim), st, done: st === "feito", day: d }; }).filter(b => b.a != null && b.z > b.a);
}
function rtAgenda(d) {
  const ev = (S.eventos || []).filter(e => e.data === d || (e.ate && e.data <= d && e.ate >= d)).map(e => { const a = hm2min(e.hora), z = hm2min(e.fim) ?? (a != null ? a + 60 : null); return { id: e.id, titulo: e.titulo, a, z: z != null && z <= a ? 1440 : z, gcal: e.origem === "gcal", local: e.local, link: e.link, dia: a == null || (e.ate && e.data !== d) }; });
  const tar = S.tarefas.filter(t => t.prazo === d && t.status !== "Concluída" && t.status !== "Cancelada");
  return { timed: ev.filter(e => !e.dia), allday: ev.filter(e => e.dia), tar };
}
/* colunas para itens que se sobrepõem */
function rtLayout(items) {
  const s = [...items].sort((x, y) => x.a - y.a || y.z - x.z), cols = []; let group = [], end = -1;
  const flush = () => { const n = Math.max(...group.map(g => g.col)) + 1; group.forEach(g => g.n = n); group = []; };
  for (const it of s) { if (it.a >= end && group.length) { flush(); cols.length = 0; } let c = cols.findIndex(z => z <= it.a); if (c < 0) { c = cols.length; cols.push(0); } cols[c] = it.z; it.col = c; group.push(it); end = Math.max(end, it.z); }
  if (group.length) flush(); return s;
}
/* análise do dia: planejado, agenda, livre dentro do horário acordado, janelas livres, conflitos, longos períodos sem pausa */
function rtDia(d) {
  const bs = rtOcc(d), A = rtAgenda(d), [w0, w1] = rtWake(), busy = [...bs, ...A.timed.filter(e => e.a != null)].map(x => [x.a, x.z]).sort((p, q) => p[0] - q[0]);
  const uni = []; for (const [a, z] of busy) { if (uni.length && a <= uni.at(-1)[1]) uni.at(-1)[1] = Math.max(uni.at(-1)[1], z); else uni.push([a, z]); }
  const livres = []; let cur = w0; for (const [a, z] of uni) { if (a > cur) { const s = Math.ceil(cur / 30) * 30, e = Math.floor(Math.min(a, w1) / 30) * 30; if (e - s >= 30) livres.push([s, e]); } cur = Math.max(cur, z); if (cur >= w1) break; }
  if (cur < w1) { const s = Math.ceil(cur / 30) * 30, e = Math.floor(w1 / 30) * 30; if (e - s >= 30) livres.push([s, e]); }
  const conf = []; for (const b of bs) for (const e of A.timed) if (e.a != null && b.a < e.z && e.a < b.z) conf.push([b, e]);
  const work = bs.filter(b => b.cat !== "Descanso").sort((p, q) => p.a - q.a), longos = []; let st = null, en = null;
  for (const b of work) { if (st == null || b.a > en) { if (st != null && en - st > 180) longos.push([st, en]); st = b.a; en = b.z; } else en = Math.max(en, b.z); } if (st != null && en - st > 180) longos.push([st, en]);
  const plan = sum(bs.map(b => b.z - b.a)), feito = sum(bs.filter(b => b.st === "feito").map(b => b.z - b.a)) + sum(bs.filter(b => b.st === "parcial").map(b => (b.z - b.a) / 2));
  const acordado = (w1 > w0 ? w1 - w0 : 1440 - w0 + w1), livre = sum(livres.map(([a, z]) => z - a));
  return { bs, A, plan, feito, livres, livre, conf, longos, acordado, agenda: sum(A.timed.filter(e => e.a != null).map(e => Math.min(e.z, 1440) - e.a)) };
}
/* adesão: ocorrências passadas nas últimas 4 semanas */
function rtAdesao(n = 28) {
  const per = {}, wk = {}; for (let k = 1; k <= n; k++) { const d = addDays(TODAY, -k), w = weekStart(d); for (const b of rtOcc(d)) { const m = b.z - b.a, v = b.st === "feito" ? m : b.st === "parcial" ? m / 2 : 0, c = b.cat || "Outro"; (per[c] ||= [0, 0]); per[c][0] += v; per[c][1] += m; (wk[w] ||= [0, 0]); wk[w][0] += v; wk[w][1] += m; } }
  const tot = Object.values(per).reduce((s, [v, m]) => [s[0] + v, s[1] + m], [0, 0]);
  return { per, wk, tot, pct: tot[1] ? tot[0] / tot[1] : null };
}
/* ---------------------------------------------------------------- tela */
const rtPer = () => { const v = rtView(), d = RT.d;
  if (v === "dia") return { t: fmtDL(d).replace(/^./, c => c.toUpperCase()), y: d.slice(0, 4), s: d === TODAY ? "hoje" : d === addDays(TODAY, 1) ? "amanhã" : d === addDays(TODAY, -1) ? "ontem" : "" };
  if (v === "semana") { const w = rtWeek(d), a = parse(w[0]), z = parse(w[6]); return { t: `${a.getDate()}${a.getMonth() !== z.getMonth() ? " " + MESES[a.getMonth()].slice(0, 3).toLowerCase() : ""} – ${z.getDate()} ${MESES[z.getMonth()].slice(0, 3).toLowerCase()}`, y: `semana ${isoWeek(d)} · ${w[6].slice(0, 4)}`, s: w.includes(TODAY) ? "esta semana" : "" }; }
  return { t: MESES[parse(d).getMonth()], y: d.slice(0, 4), s: d.slice(0, 7) === TODAY.slice(0, 7) ? "este mês" : "" }; };
function rtMini() {
  const d = RT.d, m0 = parse(d.slice(0, 8) + "01"), first = weekStart(iso(m0)), v = rtView(), wk = rtWeek(d);
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(first, i * 7)).filter((w, i) => i < 5 || w.slice(0, 7) === d.slice(0, 7));
  return `<div class="rtmini" role="dialog" aria-label="Escolher data"><div class="rtmh"><button type="button" class="iconbtn" data-rtmini="-1" aria-label="Mês anterior">‹</button><b>${MESES[m0.getMonth()]} ${m0.getFullYear()}</b><button type="button" class="iconbtn" data-rtmini="1" aria-label="Próximo mês">›</button></div>
    <table><thead><tr><th title="Número da semana">#</th>${["S", "T", "Q", "Q", "S", "S", "D"].map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${weeks.map(w => `<tr class="${v === "semana" && w === wk[0] ? "sel" : ""}"><td><button type="button" class="rtwk" data-rtgo="semana|${w}" title="Ver a semana ${isoWeek(w)}">${isoWeek(w)}</button></td>${Array.from({ length: 7 }, (_, i) => { const x = addDays(w, i), n = rtOcc(x).length + rtAgenda(x).timed.length; return `<td><button type="button" class="rtmd${x.slice(0, 7) !== d.slice(0, 7) ? " out" : ""}${x === TODAY ? " today" : ""}${x === d && v === "dia" ? " sel" : ""}" data-rtgo="dia|${x}" aria-label="${fmtDL(x)}">${parse(x).getDate()}${n ? "<i></i>" : ""}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
/* faixa da semana: navegação rápida em qualquer largura, com as horas planejadas e o que foi cumprido */
function rtStrip() {
  const w = rtWeek(RT.d), v = rtView();
  return `<div class="rtstrip" role="tablist" aria-label="Dias da semana"><button type="button" class="iconbtn rtsw" data-rtnavw="-1" aria-label="Semana anterior">‹</button>${w.map(d => { const X = rtDia(d), p = X.plan, f = p ? X.feito / p : 0, on = v === "dia" && d === RT.d;
    return `<button type="button" role="tab" aria-selected="${on}" class="rtsd${on ? " on" : ""}${d === TODAY ? " today" : ""}" data-rtgo="dia|${d}"><small>${DOWL[parse(d).getDay()].slice(0, 3)}</small><b>${parse(d).getDate()}</b><span class="rtsm">${p ? `${num(p / 60, p % 60 ? 1 : 0)} h` : "livre"}</span><i class="rtsb"><u style="width:${clamp(f) * 100}%"></u></i></button>`; }).join("")}<button type="button" class="iconbtn rtsw" data-rtnavw="1" aria-label="Próxima semana">›</button></div>`;
}
function rtCol(d) {
  const H = rtSH(), X = rtDia(d), occ = rtLayout(X.bs), ag = rtLayout(X.A.timed.filter(e => e.a != null)), [w0, w1] = rtWake(), cf = new Set(X.conf.map(([b]) => b.id));
  const pos = (x, n, col) => `top:${x.a / 30 * H}px;height:${Math.max(H - 2, (Math.min(x.z, 1440) - x.a) / 30 * H - 2)}px;left:calc(${col / n * 100}% + 2px);width:calc(${100 / n}% - 4px)`;
  const slots = Array.from({ length: 48 }, (_, i) => `<div class="rtslot${i % 2 ? " half" : ""}" data-rts="${d}|${i * 30}" data-h="${m2hm(i * 30)}"></div>`).join("");
  const sleep = w1 > w0 ? `<div class="rtsleep" style="top:0;height:${w0 / 30 * H}px"></div><div class="rtsleep" style="top:${w1 / 30 * H}px;height:${(1440 - w1) / 30 * H}px"></div>` : `<div class="rtsleep" style="top:${w1 / 30 * H}px;height:${(w0 - w1) / 30 * H}px"></div>`;
  const now = d === TODAY ? `<div class="rtnow" style="top:${nowMin() / 30 * H}px"><span>${m2hm(nowMin())}</span></div>` : "";
  return `<div class="rtcol${d === TODAY ? " today" : ""}" style="height:${48 * H}px" data-rtday="${d}">${sleep}${slots}
    ${occ.map(b => { const len = b.z - b.a, tiny = len / 30 * H < 34; return `<div role="button" tabindex="0" class="rtb${b.st ? " st-" + b.st : ""}${tiny ? " tiny" : ""}${cf.has(b.id) ? " conf" : ""}" style="${pos(b, b.n || 1, b.col)};--c:${rtCor(b.cat)}" data-rtb="${b.id}|${d}" title="${esc(`${b.ini}–${b.fim} · ${b.titulo}${b.rep ? " · " + REP_TXT[b.rep] : ""}${b.st ? " · " + ST_TXT[b.st] : ""}`)}"><b>${b.st === "feito" ? "✓ " : b.st === "pulado" ? "✕ " : ""}${esc(b.titulo)}</b><small>${b.ini}–${b.fim}${b.rep ? ` ${ic("repeat")}` : ""}</small><i class="rtrs" data-rtrs="${b.id}|${d}" aria-hidden="true"></i></div>`; }).join("")}
    ${ag.map(e => `<div class="rte${e.gcal ? " gcal" : ""}" style="${pos(e, e.n || 1, e.col)}" title="${esc(`${m2hm(e.a)}–${m2hm(Math.min(e.z, 1440))} · ${e.titulo}${e.local ? " · " + e.local : ""} (Agenda${e.gcal ? ", Google" : ""})`)}"><b>${esc(e.titulo)}</b><small>${m2hm(e.a)} · ${e.gcal ? "Google" : "agenda"}</small></div>`).join("")}${now}</div>`;
}
function rtAllday(d) { const A = rtAgenda(d); return [...A.allday.map(e => `<span class="rtad e" title="Agenda">${ic("cal")}${esc(e.titulo)}</span>`), ...A.tar.map(t => `<span class="rtad t" title="Tarefa com prazo">${ic("checksq")}${esc(t.tarefa)}</span>`)].join(""); }
function rtGrid(days) {
  const H = rtSH(), one = days.length === 1, hasAll = days.some(d => { const A = rtAgenda(d); return A.allday.length || A.tar.length; });
  return `<div class="rtgrid${one ? " one" : ""}" style="--n:${days.length};--sh:${H}px"><div class="rtscroll" id="rtscroll">
    <div class="rthead"><div class="rtcorner">${ic("clock")}</div>${days.map(d => { const X = rtDia(d); return `<button type="button" class="rtdh${d === TODAY ? " today" : ""}" data-rtgo="dia|${d}"><small>${DOWL[parse(d).getDay()].slice(0, 3)}</small><b>${parse(d).getDate()}</b>${one ? "" : `<em>${X.plan ? durTxt(X.plan) : "–"}</em>`}</button>`; }).join("")}</div>
    ${hasAll ? `<div class="rtallrow"><div class="rtcorner"><small>dia todo</small></div>${days.map(d => `<div class="rtall">${rtAllday(d)}</div>`).join("")}</div>` : ""}
    <div class="rtbody"><div class="rttimes" style="height:${48 * H}px">${Array.from({ length: 48 }, (_, i) => `<span class="${i % 2 ? "half" : ""}" style="top:${i * H}px">${i % 2 ? ":30" : m2hm(i * 30)}</span>`).join("")}</div>${days.map(rtCol).join("")}</div></div></div>`;
}
function rtMonth() {
  const d = RT.d, m0 = d.slice(0, 7), first = weekStart(m0 + "-01"), weeks = Array.from({ length: 6 }, (_, i) => addDays(first, i * 7)).filter((w, i) => i < 5 || w.slice(0, 7) === m0);
  return `<div class="rtmonth"><div class="rtmw hd"><span>#</span>${["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map(x => `<span>${x}</span>`).join("")}</div>${weeks.map(w => `<div class="rtmw"><button type="button" class="rtwk" data-rtgo="semana|${w}" title="Ver a semana">${isoWeek(w)}</button>${Array.from({ length: 7 }, (_, i) => { const x = addDays(w, i), X = rtDia(x), bs = X.bs.sort((p, q) => p.a - q.a), items = [...bs.map(b => `<i style="--c:${rtCor(b.cat)}"${b.st ? ` class="st-${b.st}"` : ""}>${b.ini} ${esc(b.titulo)}</i>`), ...X.A.timed.map(e => `<i class="e">${m2hm(e.a)} ${esc(e.titulo)}</i>`), ...X.A.allday.map(e => `<i class="e">${esc(e.titulo)}</i>`)], pf = X.plan ? X.feito / X.plan : 0;
    return `<button type="button" class="rtmc${x.slice(0, 7) !== m0 ? " out" : ""}${x === TODAY ? " today" : ""}" data-rtgo="dia|${x}" aria-label="${fmtDL(x)}: ${items.length} itens"><span class="rtmct"><b>${parse(x).getDate()}</b>${X.plan ? `<small>${durTxt(X.plan)}</small>` : ""}</span>${X.plan && x < TODAY ? `<i class="rtsb"><u style="width:${clamp(pf) * 100}%"></u></i>` : ""}${items.slice(0, 3).join("")}${items.length > 3 ? `<em>+${items.length - 3}</em>` : ""}</button>`; }).join("")}</div>`).join("")}</div>`;
}
function rtInsights(days) {
  const v = rtView(), d = RT.d, today = days.includes(TODAY), out = [];
  if (today) { const X = rtDia(TODAY), n = nowMin(), cur = X.bs.find(b => b.a <= n && b.z > n), nx = X.bs.filter(b => b.a > n).sort((p, q) => p.a - q.a)[0];
    out.push(`<div class="pn rtnowc">${cur ? `<div><small>Agora</small><b style="--c:${rtCor(cur.cat)}">${esc(cur.titulo)}</b><span>até ${cur.fim} · faltam ${durTxt(cur.z - n)}</span><div class="row wrap">${["feito", "parcial", "pulado"].map(s => `<button type="button" class="btn sm${cur.st === s ? " primary" : ""}" data-rtst="${cur.id}|${TODAY}|${s}">${ST_TXT[s]}</button>`).join("")}</div></div>` : `<div><small>Agora</small><b>Nenhum bloco</b><span>${X.livres.find(([a, z]) => a <= n + 30 && z > n) ? "tempo livre" : ""}</span></div>`}${nx ? `<div><small>A seguir · em ${durTxt(nx.a - n)}</small><b style="--c:${rtCor(nx.cat)}">${esc(nx.titulo)}</b><span>${nx.ini}–${nx.fim}</span></div>` : ""}</div>`); }
  /* plano do período */
  const Xs = days.map(rtDia), plan = sum(Xs.map(x => x.plan)), feito = sum(Xs.map(x => x.feito)), livre = sum(Xs.map(x => x.livre)), per = {};
  for (const x of Xs) for (const b of x.bs) per[b.cat || "Outro"] = (per[b.cat || "Outro"] || 0) + (b.z - b.a);
  const passado = days.filter(x => x < TODAY || x === TODAY);
  const hh = m => m >= 600 ? `${num(m / 60, 0)} h` : m >= 60 ? `${num(m / 60, m % 60 ? 1 : 0)} h` : `${Math.round(m)} min`;
  out.push(panel(`${ic("clock")}${v === "dia" ? "O dia" : v === "semana" ? "A semana" : "O mês"} em números`, `<div class="rtkpis"><div><b>${hh(plan)}</b><small>planejado</small></div><div><b>${hh(sum(Xs.map(x => x.agenda)))}</b><small>agenda</small></div><div><b>${hh(livre)}</b><small>livre acordado</small></div><div><b>${plan && passado.length ? pct(feito / plan) : "–"}</b><small>cumprido</small></div></div>
    ${Object.keys(per).length ? hbars(Object.entries(per).sort((p, q) => q[1] - p[1]).map(([c, m]) => ({ l: c, v: m / 60, color: rtCor(c) })), { fmt: x => num(x, 1) + " h" }) : `<div class="empty">Nada planejado. Arraste na grade, use a linha de criação rápida ou aplique um modelo.</div>`}`));
  if (v === "dia") { const X = Xs[0], al = [];
    for (const [b, e] of X.conf) al.push(`<li class="crit">${ic("info")}<span><b>${esc(b.titulo)}</b> (${b.ini}–${b.fim}) bate com <b>${esc(e.titulo)}</b> da agenda.</span></li>`);
    for (const [a, z] of X.longos) al.push(`<li class="warn">${ic("info")}<span>${durTxt(z - a)} seguidos sem pausa (${m2hm(a)}–${m2hm(z)}). Uma pausa de 10 min a cada 90 ajuda a manter o foco.</span></li>`);
    if (X.plan > X.acordado * .85) al.push(`<li class="warn">${ic("info")}<span>${pct(X.plan / X.acordado)} do tempo acordado está planejado: sobra pouco para imprevistos.</span></li>`);
    const [w0, w1] = rtWake(), sono = (w0 - w1 + 1440) % 1440 / 60; if (sono < (S.cfg.metaSono || 7.5)) al.push(`<li class="warn">${ic("moon")}<span>A janela de sono (${S.cfg.rtDormir || "23:00"}–${S.cfg.rtAcordar || "06:30"}) dá ${num(sono, 1)} h, abaixo da sua meta de ${num(S.cfg.metaSono || 7.5, 1)} h.</span></li>`);
    out.push(panel(`${ic("spark")}Janelas livres <small>dentro do horário acordado</small>`, X.livres.length ? `<div class="rtfree">${X.livres.map(([a, z]) => `<button type="button" class="chip" data-rtfree="${d}|${a}|${z}" title="Criar um bloco aqui">${m2hm(a)}–${m2hm(z)} · ${durTxt(z - a)}</button>`).join("")}</div>` : `<div class="empty">Sem janelas de 30 min livres.</div>`) +
      (al.length ? panel(`${ic("radar")}Atenção`, `<ul class="rtal">${al.join("")}</ul>`) : "")); }
  const AD = rtAdesao(), wks = Object.keys(AD.wk).sort();
  out.push(panel(`${ic("checksq")}Cumprimento · 4 semanas <small>${AD.pct == null ? "sem histórico" : pct(AD.pct) + " do planejado"}</small>`, AD.pct == null ? `<div class="empty">Marque os blocos como feito, parcial ou pulado: aqui aparece quanto da rotina vira realidade, por categoria.</div>`
    : `${hbars(Object.entries(AD.per).filter(([, [, m]]) => m).sort((p, q) => q[1][1] - p[1][1]).map(([c, [v2, m]]) => ({ l: c, v: v2 / m, color: rtCor(c) })), { fmt: pct, max: 1 })}<div class="rtwks">${wks.map(w => { const [v2, m] = AD.wk[w]; return `<span title="Semana de ${fmtD(w)}: ${pct(v2 / m)}"><i style="height:${Math.max(4, v2 / m * 40)}px"></i><small>${fmtD(w)}</small></span>`; }).join("")}</div>`));
  /* ações */
  const mods = [...RT_MOD0, ...(S.rotinaModelos || [])];
  out.push(panel(`${ic("list")}Modelos e atalhos`, `<div class="form f1"><label>Aplicar um modelo ${v === "dia" ? "neste dia" : "nesta semana"}<div class="row"><select id="rt_mod">${mods.map(m => `<option value="${m.id}"${m.id === RT.mod ? " selected" : ""}>${esc(m.nome)}</option>`).join("")}</select><button type="button" class="btn sm" data-act="rtmod">Aplicar</button></div></label></div>
    <div class="row wrap">${v === "dia" ? `<button type="button" class="btn sm" data-act="rtcopy">${ic("copy")}Copiar o dia…</button><button type="button" class="btn sm ghost" data-act="rtclear">${ic("trash")}Limpar o dia</button>` : `<button type="button" class="btn sm" data-act="rtsavemod">${ic("plus")}Salvar a semana como modelo</button><button type="button" class="btn sm" data-act="rtcopyw">${ic("copy")}Copiar para a próxima semana</button>`}</div>
    <details class="futd"><summary>Ajustes da grade</summary><div class="form f3"><label>Acordo<input type="time" step="1800" data-rtcfg="rtAcordar" value="${esc(S.cfg.rtAcordar || "06:30")}"></label><label>Durmo<input type="time" step="1800" data-rtcfg="rtDormir" value="${esc(S.cfg.rtDormir || "23:00")}"></label><label>Tamanho<select data-rtcfg="rtZoom">${Object.keys(RT_Z).map(k => `<option${(S.cfg.rtZoom || "normal") === k ? " selected" : ""}>${k}</option>`).join("")}</select></label></div><p class="muted small">Teclado: ← → período · T hoje · D S M vistas · N novo bloco.</p></details>`));
  return out.join("");
}
function pRotina() {
  const v = rtView(), P = rtPer(), days = v === "dia" ? [RT.d] : v === "semana" ? rtWeek(RT.d) : Array.from({ length: 31 }, (_, i) => addDays(RT.d.slice(0, 8) + "01", i)).filter(x => x.slice(0, 7) === RT.d.slice(0, 7));
  const qp = RT.q.trim() ? rtParse(RT.q) : null;
  setTimeout(rtScrollTo, 0);
  return `<div class="rt2">
    <div class="rtt">
      <div class="rtnav"><button type="button" class="iconbtn" data-rtnav="-1" aria-label="${v === "dia" ? "Dia anterior" : v === "semana" ? "Semana anterior" : "Mês anterior"}">‹</button><button type="button" class="btn sm" data-rtnav="0">Hoje</button><button type="button" class="iconbtn" data-rtnav="1" aria-label="${v === "dia" ? "Próximo dia" : v === "semana" ? "Próxima semana" : "Próximo mês"}">›</button></div>
      <div class="rtper"><button type="button" class="rtpt" data-act="rtpick" aria-expanded="${RT.pick}"><b>${esc(P.t)}</b><small>${esc(P.y)}${P.s ? ` · <em>${P.s}</em>` : ""}</small>${ic("cal")}</button>${RT.pick ? rtMini() : ""}</div>
      <div class="seg-g rtviews" role="group" aria-label="Visualização">${[["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]].map(([k, l]) => `<button type="button" class="seg" data-rtv="${k}" aria-pressed="${v === k}">${l}</button>`).join("")}</div>
      <button type="button" class="btn sm primary" data-act="rtnovo">${ic("plus")}Novo bloco</button>
    </div>
    <div class="rtq"><span>${ic("plus")}</span><input type="text" id="rt_q" value="${esc(RT.q)}" placeholder="Criar rápido: inglês amanhã 20h 30min · academia seg qua sex 18:30–19:30 · reunião 14h–15h30" aria-label="Criar bloco por texto" autocomplete="off"><button type="button" class="btn sm primary" data-act="rtqadd"${qp?.ok ? "" : " disabled"}>Criar</button>
      <div class="rtqp${qp ? (qp.ok ? " ok" : " bad") : ""}" id="rt_qp">${qp ? rtQpHTML(qp) : ""}</div></div>
    ${v !== "mes" ? rtStrip() : ""}
    <div class="rtlay"><section class="rtcal" aria-label="${esc(P.t)}">${v === "mes" ? rtMonth() : rtGrid(v === "dia" ? [RT.d] : rtWeek(RT.d))}</section>
      <aside class="rtins">${rtInsights(days)}</aside></div></div>`;
}
/* abre a grade perto de agora (hoje) ou do primeiro bloco; só ao mudar de dia/vista */
function rtScrollTo() {
  const sc = $("#rtscroll"); if (!sc) return; const key = rtView() + RT.d + rtSH();
  sc.addEventListener("scroll", () => { RT.top = sc.scrollTop; RT.left = sc.scrollLeft; }, { passive: true });
  if (RT.scrolled === key) { sc.scrollTop = RT.top || 0; sc.scrollLeft = RT.left || 0; return; } RT.scrolled = key;
  const days = rtView() === "dia" ? [RT.d] : rtWeek(RT.d), firsts = days.flatMap(d => rtOcc(d).map(b => b.a)), m = days.includes(TODAY) ? nowMin() - 90 : firsts.length ? Math.min(...firsts) - 30 : rtWake()[0];
  sc.scrollTop = Math.max(0, m / 30 * rtSH()); RT.top = sc.scrollTop; RT.left = sc.scrollLeft = 0;
}
/* ---------------------------------------------------------------- criação rápida por texto */
const RT_KW = [[/ingl|italian|estud|curso|aula|leitur.*t[eé]cnic|bim|revit/i, "Estudo"], [/academi|trein|corr|camin|pedal|nata|yoga|alonga|m[eé]dico|dentista/i, "Saúde & treino"], [/reuni|trabalh|projet|cliente|relat|obra|escrit/i, "Trabalho"], [/mercad|limp|casa|lava|cozinh|compra/i, "Casa"], [/lig|fam[ií]lia|m[aã]e|pai|amig|jantar com|almo[cç]o com|encontr/i, "Pessoas"], [/medit|ora[cç]|prece|evangel|culto|missa/i, "Espiritual"], [/leitur|livro|filme|s[eé]rie|jogo|caf[eé]|passeio|cinema/i, "Lazer"], [/descans|cochil|pausa|soneca/i, "Descanso"], [/desloc|trem|[oô]nibus|metr|carro|viagem/i, "Deslocamento"]];
const RT_DOW = [["dom", 0], ["seg", 1], ["ter", 2], ["qua", 3], ["qui", 4], ["sex", 5], ["sab", 6], ["sáb", 6]];
function rtParse(txt) {
  let t = " " + String(txt || "").trim() + " ", f = fold(t); const cut = rx => { const m = f.match(rx); if (m) { t = t.slice(0, m.index) + " ".repeat(m[0].length) + t.slice(m.index + m[0].length); f = fold(t); } return m; };
  let dias = [], rep = "", m;
  if (cut(/\b(todo dia|todos os dias|diariamente)\b/)) rep = "diario";
  else if (cut(/\b(dias uteis|de segunda a sexta|seg a sex|segunda a sexta)\b/)) rep = "uteis";
  const dows = []; f.replace(/\b(dom|seg|ter|qua|qui|sex|sab)(?:unda|ca|rta|inta|ta|ado|ingo)?(?:-feira)?\b/g, (w, k) => { dows.push(RT_DOW.find(x => x[0] === k)[1]); return w; });
  if (dows.length) { cut(/\b((?:dom|seg|ter|qua|qui|sex|sab)\w*(?:-feira)?[\s,e]*)+\b/); for (const dw of dows) { let k = (dw - parse(RT.d).getDay() + 7) % 7; dias.push(addDays(RT.d, k)); } if (dows.length > 1 || /\b(toda|todas|sempre)\b/.test(f)) { rep = rep || "semanal"; cut(/\b(toda|todas|sempre)\b/); } }
  if ((m = cut(/\bdepois de amanha\b/))) dias = [addDays(TODAY, 2)]; else if ((m = cut(/\bamanha\b/))) dias = [addDays(TODAY, 1)]; else if ((m = cut(/\bhoje\b/))) dias = [TODAY];
  if ((m = cut(/\b(\d{1,2})\/(\d{1,2})\b/))) { let y = +RT.d.slice(0, 4), x = `${y}-${pad(+m[2])}-${pad(+m[1])}`; if (x < TODAY) x = `${y + 1}-${pad(+m[2])}-${pad(+m[1])}`; dias = [x]; }
  if (!dias.length) dias = [RT.d];
  const hm = s => { const k = s.match(/(\d{1,2})(?:[:h](\d{2})?)?/); return +k[1] * 60 + (+k[2] || 0); };
  let a = null, z = null, dur = null;
  if ((m = cut(/\b(?:das?\s+)?(\d{1,2}(?:[:h]\d{2}|h))\s*(?:-|–|as|ate|a)\s*(\d{1,2}(?:[:h]\d{2}|h)?)\b/))) { a = hm(m[1]); z = hm(m[2]); }
  else if ((m = cut(/\b(?:as\s+|a partir das\s+)?(\d{1,2}(?::\d{2}|h\d{2}|h))(?=\s|$)/))) a = hm(m[1]);
  if ((m = cut(/\b(\d+(?:[.,]\d+)?)\s*(h|hora|horas)\s*(?:e\s*)?(\d{1,2})?\s*(?:min)?\b|\b(\d{1,3})\s*(min|minutos)\b/))) dur = m[4] ? +m[4] : Math.round(parseNum(m[1]) * 60 + (+m[3] || 0));
  let titulo = clean(t.replace(/\b(as|às|das|de|por|para|em|no|na)\s*$/i, "").replace(/^\s*(de|às|as)\s+/i, "")).replace(/\s+(as|às|de|e)$/i, "").trim();
  titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  if (a == null) return { ok: false, err: "Diga o horário: 20h, 18:30, 14h–15h30", titulo };
  a = Math.floor(a / 30) * 30; if (z == null) z = a + Math.max(30, Math.ceil((dur || 30) / 30) * 30); else z = Math.ceil(z / 30) * 30;
  if (z <= a || z > 1440) return { ok: false, err: "O fim precisa ser depois do começo e no mesmo dia", titulo };
  if (!titulo) return { ok: false, err: "Diga o que é: inglês, academia, reunião…" };
  const cat = (RT_KW.find(([rx]) => rx.test(fold(titulo))) || [0, "Outro"])[1];
  return { ok: true, titulo, cat, ini: m2hm(a), fim: m2hm(z), dias: [...new Set(dias)].sort(), rep };
}
function rtQpHTML(q) { return q.ok ? `${ic("check")}<span>Vai criar <b>${esc(q.titulo)}</b> · ${q.ini}–${q.fim} · <i style="color:${rtCor(q.cat)}">${q.cat}</i> · ${q.rep ? REP_TXT[q.rep].toLowerCase() + (q.rep === "semanal" ? ` (${q.dias.map(x => DOWL[parse(x).getDay()].slice(0, 3)).join(", ")})` : "") + ` a partir de ${fmtD(q.dias[0])}` : q.dias.map(x => `${DOWL[parse(x).getDay()].slice(0, 3)} ${fmtD(x)}`).join(", ")}. Enter cria.</span>` : `${ic("info")}<span>${esc(q.err)}</span>`; }
function rtQAdd() {
  const q = rtParse(RT.q); if (!q.ok) { toast(q.err); return; }
  const novos = (q.rep && q.rep !== "semanal" ? [q.dias[0]] : q.dias).map(d => ({ id: uid(), data: d, ini: q.ini, fim: q.fim, titulo: q.titulo, cat: q.cat, rep: q.rep, exc: [], st: {}, notas: "" }));
  (S.rotina ||= []).push(...novos); RT.q = ""; if (rtView() === "dia" && !novos.some(b => rtOcc(RT.d).some(x => x.id === b.id))) RT.d = novos[0].data;
  touch("rotina", { label: "Bloco por texto" }); undoToast(`${plural(novos.length, "bloco criado", "blocos criados")}: ${q.titulo} ${q.ini}–${q.fim}`);
}
/* ---------------------------------------------------------------- modelos */
const RT_MOD0 = [
  { id: "m_util", nome: "Dia útil equilibrado", fixo: true, b: [["06:30", "07:00", "Acordar, água e alongar", "Saúde & treino"], ["07:00", "07:30", "Café e plano do dia", "Descanso"], ["08:30", "10:30", "Foco profundo (sem e-mail)", "Trabalho"], ["10:30", "11:00", "Pausa e e-mails", "Descanso"], ["11:00", "12:30", "Reuniões e coordenação", "Trabalho"], ["12:30", "13:30", "Almoço longe da tela", "Descanso"], ["13:30", "15:30", "Foco profundo 2", "Trabalho"], ["15:30", "17:30", "Tarefas curtas e fechamento", "Trabalho"], ["18:30", "19:30", "Treino", "Saúde & treino"], ["20:00", "20:30", "Inglês", "Estudo"], ["22:00", "22:30", "Leitura sem tela", "Lazer"]] },
  { id: "m_foco", nome: "Foco profundo (estudo ou projeto)", fixo: true, b: [["08:00", "09:30", "Bloco de foco 1", "Estudo"], ["09:30", "10:00", "Pausa com movimento", "Descanso"], ["10:00", "11:30", "Bloco de foco 2", "Estudo"], ["11:30", "12:00", "Revisar e anotar", "Estudo"], ["14:00", "15:30", "Bloco de foco 3", "Estudo"]] },
  { id: "m_fds", nome: "Fim de semana leve", fixo: true, b: [["08:30", "09:30", "Café sem pressa", "Descanso"], ["10:00", "11:30", "Mercado e casa", "Casa"], ["12:00", "14:00", "Almoço com alguém", "Pessoas"], ["15:00", "17:00", "Passeio ou programa ao ar livre", "Lazer"], ["18:00", "19:00", "Ligar para a família no Brasil", "Pessoas"], ["21:00", "22:00", "Filme ou série", "Lazer"]] },
];
function rtAplicar(mod, dias) {
  let n = 0, pulados = 0;
  for (const d of dias) { const dow = parse(d).getDay(), list = mod.semana ? mod.semana.filter(x => x[0] === dow).map(x => x.slice(1)) : mod.b, ex = rtDia(d);
    for (const [ini, fim, titulo, cat] of list) { const a = hm2min(ini), z = hm2min(fim); if ([...ex.bs, ...ex.A.timed].some(x => x.a != null && x.a < z && a < x.z)) { pulados++; continue; } (S.rotina ||= []).push({ id: uid(), data: d, ini, fim, titulo, cat, rep: "", exc: [], st: {}, notas: "" }); n++; } }
  touch("rotina", { label: `Modelo: ${mod.nome}` }); undoToast(`${plural(n, "bloco aplicado", "blocos aplicados")}${pulados ? ` · ${pulados} pulado(s) por conflito` : ""}`);
}
function rtCopiar(de, para) {
  const ex = rtDia(para); let n = 0, p = 0;
  for (const b of rtOcc(de)) { if ([...ex.bs, ...ex.A.timed].some(x => x.a != null && x.a < b.z && b.a < x.z)) { p++; continue; } S.rotina.push({ id: uid(), data: para, ini: b.ini, fim: b.fim, titulo: b.titulo, cat: b.cat, rep: "", exc: [], st: {}, notas: b.notas || "" }); n++; }
  return [n, p];
}
/* ---------------------------------------------------------------- cartão e formulário do bloco */
const RT_TIMES = Array.from({ length: 49 }, (_, i) => i * 30);
function rtCard(id, day) {
  const b = (S.rotina || []).find(x => x.id === id); if (!b) return; const st = rtSt(b, day), dlg = $("#dlg");
  dlg.innerHTML = `<form method="dialog" class="rtcard" style="--c:${rtCor(b.cat)}"><div class="rtch"><span class="rtcc"></span><div><h3>${esc(b.titulo)}</h3><p class="muted small">${fmtDL(day)} · ${b.ini}–${b.fim} · ${durTxt(hm2min(b.fim) - hm2min(b.ini))}<br>${esc(b.cat)}${b.rep ? ` · ${REP_TXT[b.rep]}` : ""}</p>${b.notas ? `<p>${esc(b.notas)}</p>` : ""}</div><button type="button" class="iconbtn" data-rtcx="1" aria-label="Fechar">${ic("x")}</button></div>
    <div class="flbl">Como foi${day > TODAY ? " (ainda não aconteceu)" : ""}</div><div class="seg-g rtsts">${["feito", "parcial", "pulado"].map(s => `<button type="button" class="seg" data-rtst="${b.id}|${day}|${s}" aria-pressed="${st === s}">${ST_TXT[s]}</button>`).join("")}</div>
    <div class="row wrap rtca"><button type="button" class="btn sm" data-rtedit="${b.id}|${day}">${ic("edit")}Editar</button><button type="button" class="btn sm" data-rtdup="${b.id}|${day}">${ic("copy")}Duplicar</button><button type="button" class="btn sm ghost" data-rtdel="${b.id}|${day}">${ic("trash")}${b.rep ? "Excluir neste dia" : "Excluir"}</button>${b.rep ? `<button type="button" class="btn sm ghost" data-rtdelall="${b.id}">Excluir a série</button>` : ""}</div></form>`;
  if (!dlg.open) dlg.showModal();
}
function rtForm(id, day, a, z) {
  const b = id ? (S.rotina || []).find(x => x.id === id) : null, o = b ? { ...b } : { data: day || RT.d, ini: m2hm(a ?? 8 * 60), fim: m2hm(z ?? (a ?? 8 * 60) + 30), titulo: "", cat: "Trabalho", rep: "" }, occDay = day || o.data;
  const opt = (sel, fim) => RT_TIMES.filter(m => fim ? m > 0 : m < 1440).map(m => `<option${m2hm(m) === sel ? " selected" : ""}>${m2hm(m)}</option>`).join("");
  const dlg = $("#dlg");
  dlg.innerHTML = `<form method="dialog" id="rtf" class="rtf"><h3>${b ? "Editar bloco" : "Novo bloco"}</h3><div class="form f2">
    <label class="full">O quê<input type="text" id="rt_t" value="${esc(o.titulo)}" placeholder="Ex.: Inglês, treino, revisão do projeto" autocomplete="off"></label>
    <label>Dia<input type="date" id="rt_d" value="${b && b.rep ? o.data : occDay}"${b && b.rep ? " disabled" : ""}></label>
    <label>Categoria<select id="rt_c">${RT_CATS.map(([c]) => `<option${o.cat === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>
    <label>Começa<select id="rt_a">${opt(o.ini)}</select></label><label>Termina<select id="rt_z">${opt(o.fim, true)}</select></label>
    <label class="full">Repetir<select id="rt_r">${Object.entries(REP_TXT).map(([k, l]) => `<option value="${k}"${(o.rep || "") === k ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    <label class="full">Notas<input type="text" id="rt_n" value="${esc(o.notas || "")}"></label></div>
    <div class="rtdur" role="group" aria-label="Duração rápida">${[30, 60, 90, 120].map(m => `<button type="button" class="chip" data-rtdur="${m}">${durTxt(m)}</button>`).join("")}</div>
    <p class="muted small" id="rt_msg"></p>
    ${b && b.rep ? `<p class="muted small">Repete: as mudanças valem para todas as repetições. Para mudar só um dia, arraste o bloco na grade.</p>` : ""}
    <div class="dlgfoot"><div></div><div class="row"><button type="button" class="btn" id="rt_x">Cancelar</button><button class="btn primary">Salvar</button></div></div></form>`;
  const msg = () => { const a1 = hm2min($("#rt_a").value), z1 = hm2min($("#rt_z").value), m = $("#rt_msg"); m.textContent = z1 <= a1 ? "O fim precisa ser depois do começo." : `${durTxt(z1 - a1)} · ${(z1 - a1) / 30} meias horas`; m.className = "muted small" + (z1 <= a1 ? " st-crit" : ""); return z1 > a1; };
  $("#rt_a").onchange = () => { const a1 = hm2min($("#rt_a").value), z1 = hm2min($("#rt_z").value); if (z1 <= a1) $("#rt_z").value = m2hm(Math.min(1440, a1 + 30)); msg(); }; $("#rt_z").onchange = msg; msg();
  for (const c of $$("[data-rtdur]", dlg)) c.onclick = () => { $("#rt_z").value = m2hm(Math.min(1440, hm2min($("#rt_a").value) + +c.dataset.rtdur)); msg(); };
  $("#rt_x").onclick = () => dlg.close();
  $("#rtf").onsubmit = e => { e.preventDefault(); if (!msg()) return; const t = $("#rt_t").value.trim(); if (!t) { $("#rt_t").focus(); $("#rt_msg").textContent = "Dê um nome ao bloco."; return; }
    const rec = { ...(b || { id: uid(), st: {}, exc: [] }), titulo: t, cat: $("#rt_c").value, ini: $("#rt_a").value, fim: $("#rt_z").value, rep: $("#rt_r").value, notas: $("#rt_n").value.trim(), data: b && b.rep ? b.data : $("#rt_d").value || occDay };
    if (b) S.rotina = S.rotina.map(x => x.id === b.id ? rec : x); else (S.rotina ||= []).push(rec);
    if (!rec.rep && rtView() === "dia") RT.d = rec.data; dlg.close(); touch("rotina", { label: b ? "Bloco editado" : "Bloco criado" }); if (!b) undoToast(`${rec.titulo}: ${rec.ini}–${rec.fim}`); };
  dlg.showModal(); setTimeout(() => $("#rt_t")?.focus(), 30);
}
function rtSetSt(id, d, s) { const b = (S.rotina || []).find(x => x.id === id); if (!b) return; b.st = { ...(b.st || {}) }; const cur = rtSt(b, d); if (b.feitos?.[d]) { b.feitos = { ...b.feitos }; delete b.feitos[d]; } if (cur === s) delete b.st[d]; else b.st[d] = s; touch("rotina", { label: `Bloco: ${ST_TXT[s]}` }); }
/* mover um bloco (ou só este dia de um bloco que repete) */
function rtMover(id, de, para, a, z) {
  const b = S.rotina.find(x => x.id === id); if (!b) return;
  if (b.rep) { b.exc = [...(b.exc || []), de]; const st = rtSt(b, de); S.rotina.push({ id: uid(), data: para, ini: m2hm(a), fim: m2hm(z), titulo: b.titulo, cat: b.cat, rep: "", exc: [], st: st ? { [para]: st } : {}, notas: b.notas || "", serie: b.id }); }
  else { b.data = para; b.ini = m2hm(a); b.fim = m2hm(z); if (de !== para && b.st?.[de]) { b.st = { [para]: b.st[de] }; } }
  touch("rotina", { label: "Bloco movido" }); undoToast(`${b.titulo}: ${m2hm(a)}–${m2hm(z)}${de !== para ? " · " + fmtD(para) : ""}${b.rep ? " (só este dia)" : ""}`);
}
/* ---------------------------------------------------------------- navegação e eventos */
function rtGo(view, d) { if (d) RT.d = d; RT.pick = false; if (view && view !== rtView()) { setHash("rotina", view); return; } render(); }
function rtShift(k) { const v = rtView(); RT.pick = false; RT.d = k === 0 ? TODAY : v === "dia" ? addDays(RT.d, k) : v === "semana" ? addDays(RT.d, 7 * k) : addMonths(RT.d.slice(0, 8) + "01", k); render(); }
function rtClick(t) {
  const ds = t.dataset;
  if (Date.now() - RT.just < 350 && (ds.rtb || t.closest?.(".rtb"))) return true;
  if (ds.rtv) { RT.pick = false; setHash("rotina", ds.rtv); return true; }
  if (ds.rtnav != null) { rtShift(+ds.rtnav); return true; }
  if (ds.rtnavw != null) { RT.d = addDays(RT.d, 7 * +ds.rtnavw); render(); return true; }
  if (ds.rtmini) { RT.d = addMonths(RT.d.slice(0, 8) + "01", +ds.rtmini); render(); return true; }
  if (ds.act === "rtpick") { RT.pick = !RT.pick; render(); return true; }
  if (ds.rtgo) { const [v, d] = ds.rtgo.split("|"); rtGo(v, d); return true; }
  if (ds.rtb) { const [id, d] = ds.rtb.split("|"); rtCard(id, d); return true; }
  if (ds.rtst) { const [id, d, s] = ds.rtst.split("|"); rtSetSt(id, d, s); if ($("#dlg").open && $(".rtcard")) rtCard(id, d); return true; }
  if (ds.rtcx) { $("#dlg").close(); return true; }
  if (ds.rtedit) { const [id, d] = ds.rtedit.split("|"); rtForm(id, d); return true; }
  if (ds.rtdup) { const [id, d] = ds.rtdup.split("|"), b = S.rotina.find(x => x.id === id), z = hm2min(b.fim), len = z - hm2min(b.ini), a2 = Math.min(1440 - len, z); S.rotina.push({ id: uid(), data: d, ini: m2hm(a2), fim: m2hm(a2 + len), titulo: b.titulo, cat: b.cat, rep: "", exc: [], st: {}, notas: b.notas || "" }); $("#dlg").close(); touch("rotina", { label: "Bloco duplicado" }); undoToast(`Duplicado às ${m2hm(a2)}`); return true; }
  if (ds.rtdel) { const [id, d] = ds.rtdel.split("|"), b = S.rotina.find(x => x.id === id); if (b.rep) b.exc = [...(b.exc || []), d]; else S.rotina = S.rotina.filter(x => x.id !== id); $("#dlg").close(); touch("rotina", { label: "Bloco excluído" }); undoToast("Bloco excluído"); return true; }
  if (ds.rtdelall) { S.rotina = S.rotina.filter(x => x.id !== ds.rtdelall); $("#dlg").close(); touch("rotina", { label: "Série excluída" }); undoToast("Série excluída"); return true; }
  if (ds.rtdone) { const b = (S.rotina || []).find(x => x.id === ds.rtdone); if (b) { b.st = { ...(b.st || {}) }; if (b.feitos?.[TODAY]) { b.feitos = { ...b.feitos }; delete b.feitos[TODAY]; } if (t.checked) b.st[TODAY] = "feito"; else delete b.st[TODAY]; touch("rotina", { label: "Rotina" }); } return true; }
  if (ds.rtfree) { const [d, a, z] = ds.rtfree.split("|"); rtForm(null, d, +a, Math.min(+z, +a + 60)); return true; }
  if (ds.act === "rtnovo") { const m = RT.d === TODAY ? Math.ceil(nowMin() / 30) * 30 : 9 * 60; rtForm(null, RT.d, Math.min(m, 1410)); return true; }
  if (ds.act === "rtqadd") { rtQAdd(); return true; }
  if (ds.act === "rtmod") { const id = RT.mod = $("#rt_mod").value, mod = [...RT_MOD0, ...(S.rotinaModelos || [])].find(m => m.id === id); if (mod) rtAplicar(mod, rtView() === "dia" ? [RT.d] : rtWeek(RT.d)); return true; }
  if (ds.act === "rtsavemod") { const w = rtWeek(RT.d), semana = w.flatMap(d => rtOcc(d).map(b => [parse(d).getDay(), b.ini, b.fim, b.titulo, b.cat])); if (!semana.length) { toast("A semana está vazia."); return true; } const nome = `Semana de ${fmtD(w[0])}`; (S.rotinaModelos ||= []).push({ id: uid(), nome, semana }); touch("rotinaModelos", { label: "Modelo salvo" }); undoToast(`Modelo “${nome}” salvo com ${semana.length} blocos`); return true; }
  if (ds.act === "rtcopyw") { let n = 0, p = 0; for (const d of rtWeek(RT.d)) { const [a, b] = rtCopiar(d, addDays(d, 7)); n += a; p += b; } touch("rotina", { label: "Semana copiada" }); undoToast(`${plural(n, "bloco copiado", "blocos copiados")} para a próxima semana${p ? ` · ${p} pulado(s) por conflito` : ""}`); return true; }
  if (ds.act === "rtcopy") { const d = $("#dlg"); d.innerHTML = `<form method="dialog" id="rtcpf"><h3>Copiar ${fmtDL(RT.d)}</h3><div class="form"><label>Para o dia<input type="date" id="rt_cpd" value="${addDays(RT.d, 1)}"></label></div><p class="muted small">Copia os blocos deste dia como blocos avulsos. Horários que já têm algo são pulados.</p><div class="dlgfoot"><div></div><div class="row"><button type="button" class="btn" id="rtcpx">Cancelar</button><button class="btn primary">Copiar</button></div></div></form>`; d.showModal(); $("#rtcpx").onclick = () => d.close();
    $("#rtcpf").onsubmit = e => { e.preventDefault(); const para = $("#rt_cpd").value; if (!para) return; const [n, p] = rtCopiar(RT.d, para); d.close(); touch("rotina", { label: "Dia copiado" }); undoToast(`${plural(n, "bloco copiado", "blocos copiados")} para ${fmtD(para)}${p ? ` · ${p} pulado(s)` : ""}`); }; return true; }
  if (ds.act === "rtclear") { if (!ds.c) { t.dataset.c = 1; t.innerHTML = `${ic("trash")}Confirmar: limpar`; return true; } const d = RT.d; for (const b of S.rotina) if (b.rep && rtOcc(d).some(x => x.id === b.id)) b.exc = [...(b.exc || []), d]; S.rotina = S.rotina.filter(b => b.rep || b.data !== d); touch("rotina", { label: "Dia limpo" }); undoToast("Dia limpo (as repetições continuam nos outros dias)"); return true; }
  return false;
}
function rtInput(t) { if (t.id === "rt_q") { RT.q = t.value; const q = t.value.trim() ? rtParse(t.value) : null, p = $("#rt_qp"), b = $('[data-act="rtqadd"]'); if (p) { p.className = "rtqp" + (q ? (q.ok ? " ok" : " bad") : ""); p.innerHTML = q ? rtQpHTML(q) : ""; } if (b) b.disabled = !q?.ok; return true; } return false; }
function rtChange(t) { if (t.id === "rt_mod") { RT.mod = t.value; return true; } if (t.dataset.rtcfg) { const k = t.dataset.rtcfg; S.cfg[k] = t.value; RT.scrolled = ""; touch("cfg", { label: "Ajuste da rotina", noUndo: true }); return true; } return false; }
/* arrastar: no vazio cria; num bloco move; na alça estica. Encaixa sempre em meias horas */
const rtSlotAt = (x, y) => document.elementFromPoint(x, y)?.closest?.(".rtslot")?.dataset.rts.split("|") || null;
function rtPaintDrag() { for (const el of $$(".rtslot.pick")) el.classList.remove("pick"); const D = RT.drag; if (!D) return; const [lo, hi] = [Math.min(D.a, D.b), Math.max(D.a, D.b)]; for (const el of $$(`.rtcol[data-rtday="${D.d}"] .rtslot`)) { const m = +el.dataset.rts.split("|")[1]; if (m >= lo && m <= hi) el.classList.add("pick"); } }
function rtGhost() { $(".rtghost")?.remove(); const M = RT.mv; if (!M || !M.moved) return; const col = $(`.rtcol[data-rtday="${M.to}"]`); if (!col) return; const H = rtSH(); col.insertAdjacentHTML("beforeend", `<div class="rtghost" style="top:${M.a / 30 * H}px;height:${(M.z - M.a) / 30 * H - 2}px;--c:${M.cor}"><b>${m2hm(M.a)}–${m2hm(M.z)}</b></div>`); }
document.addEventListener("pointerdown", e => {
  if (PAGE !== "rotina" || e.button > 0) return;
  const rs = e.target.closest?.("[data-rtrs]"), bl = e.target.closest?.(".rtb");
  if ((rs || bl) && e.pointerType !== "touch") { const [id, d] = (rs || bl).dataset[rs ? "rtrs" : "rtb"].split("|"), b = S.rotina.find(x => x.id === id); if (!b) return;
    RT.mv = { id, from: d, to: d, a: hm2min(b.ini), z: hm2min(b.fim), a0: hm2min(b.ini), z0: hm2min(b.fim), y0: e.clientY, x0: e.clientX, rs: !!rs, moved: false, cor: rtCor(b.cat) }; e.preventDefault(); return; }
  const s = e.target.closest?.(".rtslot"); if (!s) return; const [d, m] = s.dataset.rts.split("|"); RT.drag = { d, a: +m, b: +m, touch: e.pointerType === "touch", x0: e.clientX, y0: e.clientY }; if (!RT.drag.touch) { e.preventDefault(); rtPaintDrag(); }
});
document.addEventListener("pointermove", e => {
  const M = RT.mv; if (M) { const H = rtSH(), dy = Math.round((e.clientY - M.y0) / H) * 30; if (!M.moved && Math.abs(e.clientY - M.y0) < 5 && Math.abs(e.clientX - M.x0) < 5) return; M.moved = true;
    if (M.rs) { M.z = Math.max(M.a + 30, Math.min(1440, M.z0 + dy)); } else { const len = M.z0 - M.a0; M.a = Math.max(0, Math.min(1440 - len, M.a0 + dy)); M.z = M.a + len; const hit = rtSlotAt(e.clientX, e.clientY); if (hit) M.to = hit[0]; }
    rtGhost(); return; }
  const D = RT.drag; if (!D || D.touch) return; const hit = rtSlotAt(e.clientX, e.clientY); if (hit && hit[0] === D.d && +hit[1] !== D.b) { D.b = +hit[1]; rtPaintDrag(); }
});
document.addEventListener("pointerup", e => {
  const M = RT.mv; if (M) { RT.mv = null; $(".rtghost")?.remove(); if (M.moved) { RT.just = Date.now(); if (M.rs) { const b = S.rotina.find(x => x.id === M.id); if (b.rep && M.from) { rtMover(M.id, M.from, M.from, M.a0, M.z); } else { b.fim = m2hm(M.z); touch("rotina", { label: "Bloco esticado" }); undoToast(`${b.titulo}: até ${b.fim}`); } } else if (M.a !== M.a0 || M.to !== M.from) rtMover(M.id, M.from, M.to, M.a, M.z); } return; }
  const D = RT.drag; if (!D) return; RT.drag = null; rtPaintDrag();
  if (D.touch) { if (Math.abs(e.clientY - D.y0) > 8 || Math.abs(e.clientX - D.x0) > 8) return; const s = e.target.closest?.(".rtslot"); if (!s || s.dataset.rts !== `${D.d}|${D.a}`) return; }
  const lo = Math.min(D.a, D.b), hi = Math.max(D.a, D.b) + 30; rtForm(null, D.d, lo, hi);
});
document.addEventListener("pointercancel", () => { if (RT.drag) { RT.drag = null; rtPaintDrag(); } if (RT.mv) { RT.mv = null; $(".rtghost")?.remove(); } });
document.addEventListener("keydown", e => {
  if (PAGE !== "rotina") return; if (e.target.id === "rt_q" && e.key === "Enter") { e.preventDefault(); rtQAdd(); return; }
  if (e.target.matches?.("input,textarea,select") || $("#dlg")?.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key; if (e.target.matches?.(".rtb") && k === "Enter") { e.preventDefault(); const [id, d] = e.target.dataset.rtb.split("|"); rtCard(id, d); return; }
  if (k === "ArrowLeft" || k === "ArrowRight") { e.preventDefault(); rtShift(k === "ArrowLeft" ? -1 : 1); } else if (k === "t" || k === "T") rtShift(0); else if (k === "n" || k === "N") { e.preventDefault(); $('[data-act="rtnovo"]') ? $('[data-act="rtnovo"]').click() : rtForm(null, RT.d, 9 * 60); }
  else if ("dDsSmM".includes(k) && k.length === 1) setHash("rotina", { d: "dia", s: "semana", m: "mes" }[k.toLowerCase()]);
});
/* fora do seletor de data, ele fecha */
document.addEventListener("click", e => { if (PAGE === "rotina" && RT.pick && !e.target.closest?.(".rtper")) { RT.pick = false; render(); } });
/* a linha do “agora” anda sozinha */
setInterval(() => { if (PAGE !== "rotina") return; const el = $(".rtcol.today .rtnow"); if (!el) return; const m = nowMin(); el.style.top = `${m / 30 * rtSH()}px`; const s = el.querySelector("span"); if (s) s.textContent = m2hm(m); }, 30e3);
