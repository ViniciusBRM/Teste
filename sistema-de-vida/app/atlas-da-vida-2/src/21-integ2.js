
/* ================================================================ integrações nos dois sentidos */
const IX = { busy: "", prog: "", err: "", health: null, ics: null };
/* ---------------------------------------------------------------- ZIP: leitura de uma entrada (com Deflate e ZIP64) */
async function zipEntries(file) {
  const tailLen = Math.min(file.size, 70000), tail = new Uint8Array(await file.slice(file.size - tailLen).arrayBuffer());
  let eo = -1; for (let i = tail.length - 22; i >= 0; i--) if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 5 && tail[i + 3] === 6) { eo = i; break; }
  if (eo < 0) throw new Error("zip");
  const dv = new DataView(tail.buffer, tail.byteOffset); let cdSize = dv.getUint32(eo + 12, true), cdOff = dv.getUint32(eo + 16, true);
  if (cdOff === 0xFFFFFFFF || cdSize === 0xFFFFFFFF) { const li = eo - 20; if (li >= 0 && dv.getUint32(li, true) === 0x07064b50) { const zo = Number(dv.getBigUint64(li + 8, true)), z = new DataView(await file.slice(zo, zo + 56).arrayBuffer()); cdSize = Number(z.getBigUint64(40, true)); cdOff = Number(z.getBigUint64(48, true)); } }
  const cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer()), out = [], dec = new TextDecoder();
  for (let p = 0; p + 46 <= cd.byteLength && cd.getUint32(p, true) === 0x02014b50;) {
    const method = cd.getUint16(p + 10, true), nl = cd.getUint16(p + 28, true), el = cd.getUint16(p + 30, true), cl = cd.getUint16(p + 32, true);
    let comp = cd.getUint32(p + 20, true), size = cd.getUint32(p + 24, true), off = cd.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, p + 46, nl));
    for (let q = p + 46 + nl; q + 4 <= p + 46 + nl + el;) { const id = cd.getUint16(q, true), len = cd.getUint16(q + 2, true); if (id === 1) { let r = q + 4; if (size === 0xFFFFFFFF) { size = Number(cd.getBigUint64(r, true)); r += 8; } if (comp === 0xFFFFFFFF) { comp = Number(cd.getBigUint64(r, true)); r += 8; } if (off === 0xFFFFFFFF) off = Number(cd.getBigUint64(r, true)); } q += 4 + len; }
    out.push({ name, method, comp, size, off }); p += 46 + nl + el + cl;
  }
  return out;
}
async function zipStream(file, ent) {
  const h = new DataView(await file.slice(ent.off, ent.off + 30).arrayBuffer()), start = ent.off + 30 + h.getUint16(26, true) + h.getUint16(28, true), blob = file.slice(start, start + ent.comp);
  if (ent.method === 0) return blob.stream();
  if (ent.method === 8 && "DecompressionStream" in window) return blob.stream().pipeThrough(new DecompressionStream("deflate-raw"));
  throw new Error("zipmethod");
}
/* ---------------------------------------------------------------- Apple Health (export.zip ou export.xml), lido em fluxo */
const AH_WORK = { Running: "Corrida", Walking: "Caminhada", Hiking: "Caminhada", Cycling: "Bicicleta", Swimming: "Natação", TraditionalStrengthTraining: "Musculação", FunctionalStrengthTraining: "Musculação", HighIntensityIntervalTraining: "Musculação", CrossTraining: "Musculação", Yoga: "Yoga / alongamento", Pilates: "Yoga / alongamento", Flexibility: "Yoga / alongamento", Soccer: "Esporte coletivo", Basketball: "Esporte coletivo", Volleyball: "Esporte coletivo", Tennis: "Esporte coletivo", Padel: "Esporte coletivo" };
const ahDate = s => { const m = String(s || "").match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) ([+-]\d{2})(\d{2})$/); return m ? Date.parse(`${m[1]}T${m[2]}${m[3]}:${m[4]}`) : NaN; };
async function healthRead(file) {
  let stream;
  if (/\.zip$/i.test(file.name)) { const es = await zipEntries(file), ent = es.find(e => /(^|\/)export\.xml$/i.test(e.name)); if (!ent) throw new Error("noexport"); stream = await zipStream(file, ent); }
  else stream = file.stream();
  const rd = stream.pipeThrough(new TextDecoderStream()).getReader(), RX = /<(Record|Workout)\s([^>]*)>/g, A = s => k => { const i = s.indexOf(k + '="'); if (i < 0) return ""; const j = s.indexOf('"', i + k.length + 2); return s.slice(i + k.length + 2, j); };
  const steps = {}, sleep = {}, weight = {}, work = {}, min = addDays(TODAY, -730); let buf = "", n = 0, bytes = 0;
  for (;;) {
    const { value, done } = await rd.read(); if (done) break; buf += value; bytes += value.length; RX.lastIndex = 0; let m, last = 0;
    while ((m = RX.exec(buf))) { last = RX.lastIndex; n++; const g = A(m[2]);
      if (m[1] === "Workout") { const d = g("startDate").slice(0, 10); if (d < min) continue; const t = g("workoutActivityType").replace("HKWorkoutActivityType", ""), dur = parseFloat(g("duration")) || 0, u = g("durationUnit"), mn = u === "h" ? dur * 60 : u === "s" ? dur / 60 : dur; const w = work[d] ||= { min: 0, tipo: "" }; w.min += mn; if (!w.tipo || mn > (w.best || 0)) { w.tipo = AH_WORK[t] || "Outro"; w.best = mn; } continue; }
      const ty = g("type");
      if (ty === "HKQuantityTypeIdentifierStepCount") { const d = g("startDate").slice(0, 10); if (d < min) continue; const src = g("sourceName"); (steps[d] ||= {})[src] = (steps[d][src] || 0) + (parseFloat(g("value")) || 0); }
      else if (ty === "HKCategoryTypeIdentifierSleepAnalysis") { const v = g("value"); if (!/Asleep/.test(v)) continue; const e = g("endDate"), d = e.slice(0, 10); if (d < min) continue; const ms = ahDate(e) - ahDate(g("startDate")); if (!(ms > 0)) continue; const src = g("sourceName"); (sleep[d] ||= {})[src] = (sleep[d][src] || 0) + ms / 36e5; }
      else if (ty === "HKQuantityTypeIdentifierBodyMass") { const d = g("startDate").slice(0, 10); if (d < min) continue; let v = parseFloat(g("value")); if (g("unit") === "lb") v *= .45359237; if (v) weight[d] = Math.round(v * 10) / 10; }
    }
    const lt = buf.lastIndexOf("<"); buf = buf.slice(Math.max(last, lt >= 0 ? lt : buf.length));
    if (n % 20000 < 50) { IX.prog = `${num(n, 0)} registros lidos · ${num(bytes / 1048576, 0)} MB`; const el = $("#ix_prog"); if (el) el.textContent = IX.prog; }
  }
  const days = {};
  for (const [d, by] of Object.entries(steps)) (days[d] ||= {}).passos = Math.round(Math.max(...Object.values(by)));
  for (const [d, by] of Object.entries(sleep)) { const h = Math.max(...Object.values(by)); if (h >= 1 && h <= 16) (days[d] ||= {}).sono = Math.round(h * 4) / 4; }
  for (const [d, v] of Object.entries(weight)) (days[d] ||= {}).peso = v;
  for (const [d, w] of Object.entries(work)) if (w.min >= 10) Object.assign(days[d] ||= {}, { treino: findIn(TREINOS, w.tipo) || "Outro", min: Math.round(w.min) });
  return { fonte: "Apple Health", days, n };
}
/* ---------------------------------------------------------------- Google Fit (Takeout: Daily activity metrics.csv) */
function fitParse(rows) {
  const h = rows[0].map(x => norm(x)), iD = h.findIndex(x => x === "date" || x === "data"), iS = h.findIndex(x => x.includes("step count")), iW = h.findIndex(x => x.includes("average weight")), iSl = h.findIndex(x => x.includes("sleep") && x.includes("ms"));
  const acts = h.map((x, i) => [x, i]).filter(([x]) => /duration \(ms\)$/.test(x) && !/sleep|inactive|still|in vehicle/.test(x)).map(([x, i]) => [i, /running/.test(x) ? "Corrida" : /biking|cycling/.test(x) ? "Bicicleta" : /swim/.test(x) ? "Natação" : /strength|weight/.test(x) ? "Musculação" : /yoga|pilates/.test(x) ? "Yoga / alongamento" : /walking \(fitness\)|hiking/.test(x) ? "Caminhada" : null]).filter(x => x[1]);
  const days = {};
  for (const r of rows.slice(1)) { const d = parseDateAny(r[iD]); if (!d) continue; const o = {};
    if (iS >= 0 && parseNum(r[iS])) o.passos = Math.round(parseNum(r[iS])); if (iW >= 0 && parseNum(r[iW])) o.peso = Math.round(parseNum(r[iW]) * 10) / 10; if (iSl >= 0 && parseNum(r[iSl])) { const hh = parseNum(r[iSl]) / 36e5; if (hh >= 1 && hh <= 16) o.sono = Math.round(hh * 4) / 4; }
    let best = null; for (const [i, t] of acts) { const mn = (parseNum(r[i]) || 0) / 6e4; if (mn >= 15 && (!best || mn > best[1])) best = [t, mn]; } if (best) { o.treino = findIn(TREINOS, best[0]) || "Outro"; o.min = Math.round(best[1]); }
    if (Object.keys(o).length) days[d] = o; }
  return { fonte: "Google Fit", days, n: rows.length - 1 };
}
const isFit = rows => rows.length > 1 && rows[0].some(x => norm(x) === "date") && rows[0].some(x => norm(x).includes("step count"));
/* ---------------------------------------------------------------- Samsung Health (app › Configurações › Baixar dados pessoais)
   A exportação é uma pasta de .csv, um por tipo de dado (com.samsung.shealth.sleep.<data>.csv…). A 1ª linha de cada arquivo é
   um cabeçalho do tipo; os nomes de coluna podem vir prefixados (com.samsung.health.weight.start_time). Horários vêm em UTC
   com uma coluna time_offset (“UTC+0200”); o dia é o local. */
const SH_WORK = { 1001: "Caminhada", 1002: "Corrida", 11007: "Bicicleta", 14001: "Natação", 14002: "Natação", 13001: "Caminhada", 10004: "Musculação", 10007: "Musculação", 15005: "Yoga / alongamento", 15006: "Yoga / alongamento", 9002: "Yoga / alongamento" };
function shRows(text) {
  let t = String(text).replace(/^﻿/, ""); const l1 = t.split(/\r?\n/, 1)[0];
  if (/^com\.samsung\./i.test(l1) && l1.split(",").length <= 4) t = t.slice(l1.length).replace(/^\r?\n/, "");
  const rows = csvParse(t); if (rows.length < 2) return [];
  const h = rows[0].map(x => String(x || "").trim().split(".").pop().toLowerCase());
  return rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
function shTime(v, off) {
  if (v == null || v === "") return null; let ms;
  if (/^\d{11,}$/.test(String(v).trim())) ms = +v; else { const m = String(v).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)/); if (!m) return null; ms = Date.parse(`${m[1]}T${m[2].length === 5 ? m[2] + ":00" : m[2]}Z`); }
  const o = String(off || "").match(/UTC([+-])(\d{2}):?(\d{2})/); if (o) ms += (o[1] === "-" ? -1 : 1) * (+o[2] * 60 + +o[3]) * 6e4;
  return ms;   // relógio local expresso como se fosse UTC
}
const shDay = ms => new Date(ms).toISOString().slice(0, 10);
async function samsungRead(files) {
  const texts = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name)) { for (const e of (await zipEntries(f)).filter(e => /\.csv$/i.test(e.name))) texts.push([e.name, await new Response(await zipStream(f, e)).text()]); }
    else if (/\.csv$/i.test(f.name)) texts.push([f.name, await f.text()]);
  }
  const base = n => n.split("/").pop().toLowerCase(), min = addDays(TODAY, -730), steps = {}, stepsTrend = {}, sleep = {}, weight = {}, work = {}, used = new Set(); let n = 0;
  for (const [name, tx] of texts) {
    const b = base(name);
    if (/step_daily_trend/.test(b)) { used.add("passos"); for (const r of shRows(tx)) { const ms = shTime(r.day_time); if (ms == null) continue; const d = shDay(ms); if (d < min) continue; n++; const src = String(r.source_type ?? ""), v = +r.count || 0; if (src === "-2") stepsTrend[d] = v; else (steps[d] ||= {})["trend" + src] = Math.max(steps[d]?.["trend" + src] || 0, v); } }
    else if (/pedometer_day_summary/.test(b)) { used.add("passos"); for (const r of shRows(tx)) { const ms = shTime(r.day_time ?? r.create_time); if (ms == null) continue; const d = shDay(ms); if (d < min) continue; n++; const v = +r.step_count || 0; (steps[d] ||= {}).sum = Math.max(steps[d]?.sum || 0, v); } }
    else if (/shealth\.sleep\.|health\.sleep\./.test(b) && !/sleep_stage|sleep_combined|sleep_snoring|sleep_goal|sleep_data/.test(b)) { used.add("sono"); for (const r of shRows(tx)) { const a = shTime(r.start_time, r.time_offset), e = shTime(r.end_time, r.time_offset); if (a == null || e == null || e <= a) continue; const d = shDay(e); if (d < min) continue; n++; (sleep[d] ||= []).push([a, e]); } }
    else if (/health\.weight\./.test(b)) { used.add("peso"); for (const r of shRows(tx)) { const ms = shTime(r.start_time ?? r.create_time, r.time_offset), v = parseFloat(r.weight); if (ms == null || !(v > 20 && v < 400)) continue; const d = shDay(ms); if (d < min) continue; n++; weight[d] = Math.round(v * 10) / 10; } }
    else if (/shealth\.exercise\.|health\.exercise\./.test(b) && !/exercise\.(weather|recovery|routine|custom|periodization)/.test(b)) { used.add("treinos"); for (const r of shRows(tx)) { const ms = shTime(r.start_time, r.time_offset), mn = (+r.duration || 0) / 6e4; if (ms == null || !mn) continue; const d = shDay(ms); if (d < min) continue; n++; const tipo = SH_WORK[+r.exercise_type] || "Outro", w = work[d] ||= { min: 0, tipo: "", best: 0 }; w.min += mn; if (mn > w.best) { w.best = mn; w.tipo = tipo; } } }
  }
  if (!used.size) throw new Error("noshealth");
  const days = {};
  for (const d of new Set([...Object.keys(steps), ...Object.keys(stepsTrend)])) { const v = stepsTrend[d] ?? Math.max(0, ...Object.values(steps[d] || {})); if (v > 0) (days[d] ||= {}).passos = Math.round(v); }
  /* sono: junta períodos sobrepostos (relógio e celular registram a mesma noite) antes de somar */
  for (const [d, iv] of Object.entries(sleep)) { iv.sort((x, y) => x[0] - y[0]); let tot = 0, [a, e] = iv[0]; for (const [x, y] of iv.slice(1)) { if (x <= e) e = Math.max(e, y); else { tot += e - a; [a, e] = [x, y]; } } tot += e - a; const h = tot / 36e5; if (h >= 1 && h <= 16) (days[d] ||= {}).sono = Math.round(h * 4) / 4; }
  for (const [d, v] of Object.entries(weight)) (days[d] ||= {}).peso = v;
  for (const [d, w] of Object.entries(work)) if (w.min >= 10) Object.assign(days[d] ||= {}, { treino: findIn(TREINOS, w.tipo) || "Outro", min: Math.round(w.min) });
  return { fonte: "Samsung Health", days, n };
}
function healthPreview(H) {
  IX.health = H; const ds = Object.keys(H.days).sort(), cnt = k => ds.filter(d => H.days[d][k] != null).length, clash = ds.filter(d => S.saude[d] && Object.keys(H.days[d]).some(k => isNum(S.saude[d][k]) || (k === "treino" && S.saude[d].treino))).length;
  $("#dlg").innerHTML = `<form method="dialog" class="wide"><h3>${ic("pulse")}${esc(H.fonte)}: prévia</h3><p class="muted">${num(H.n, 0)} registros lidos · ${ds.length ? `${plural(ds.length, "dia", "dias")} de ${fmtDY(ds[0])} a ${fmtDY(ds.at(-1))}` : "nenhum dia com dados úteis"}.</p>
    <div class="kms3">${kmini("var(--a-fis)", "Passos", cnt("passos"), "dias")}${kmini("var(--a-men)", "Sono", cnt("sono"), "noites")}${kmini("var(--a-car)", "Treinos", cnt("treino"), `${cnt("peso")} dias com peso`)}</div>
    ${clash ? `<label class="chk"><input type="radio" name="hmode" value="fill" checked> Preencher só o que está vazio (${plural(clash, "dia já tem", "dias já têm")} algum valor)</label><label class="chk"><input type="radio" name="hmode" value="over"> Substituir pelos dados do ${esc(H.fonte)}</label>` : ""}
    <p class="note">${ic("info")}<span>Passos e sono usam a fonte com maior total em cada dia, para não somar iPhone e relógio duas vezes. Só entram os últimos 2 anos.</span></p>
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="hno">Cancelar</button><button type="button" class="btn primary" id="hok"${ds.length ? "" : " disabled"}>Importar ${plural(ds.length, "dia", "dias")}</button></div></div></form>`;
  const d = $("#dlg"); if (!d.open) d.showModal(); $("#hno").onclick = () => d.close();
  $("#hok").onclick = () => { const over = d.querySelector('input[name="hmode"]:checked')?.value === "over"; let n = 0;
    for (const [dt, o] of Object.entries(H.days)) { const cur = { ...(S.saude[dt] || {}) }; let ch = false; for (const [k, v] of Object.entries(o)) { if (k === "min" && !over && cur.treino) continue; if (over || cur[k] == null || cur[k] === "") { cur[k] = v; ch = true; } } if (ch) { S.saude[dt] = cur; n++; } }
    d.close(); touch("saude", { label: `${H.fonte}: ${n} dias` }); undoToast(`${plural(n, "dia atualizado", "dias atualizados")} com ${H.fonte}`); };
}
/* ---------------------------------------------------------------- agenda .ics: importar e exportar */
function icsDate(v, params = "") {
  if (!v) return null; const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/); if (!m) return null;
  if (!m[4]) return { data: `${m[1]}-${m[2]}-${m[3]}`, hora: "" };
  if (m[7]) { const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])); return { data: iso(d), hora: `${pad(d.getHours())}:${pad(d.getMinutes())}` }; }
  return { data: `${m[1]}-${m[2]}-${m[3]}`, hora: `${m[4]}:${m[5]}` };
}
const icsUn = s => String(s || "").replace(/\\n/gi, "\n").replace(/\\([,;\\])/g, "$1").trim();
/* recorrências como no RFC 5545, nos casos que as agendas usam (Google, Apple, Outlook): DAILY/WEEKLY/MONTHLY/YEARLY com
   INTERVAL, COUNT, UNTIL, BYDAY (inclusive “2ª terça” = 2TU e “última sexta” = -1FR) e BYMONTHDAY; semana começa na segunda */
const ICS_DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function icsOccurrences(s, rr, lim) {
  const out = [], iv = Math.max(1, +rr.INTERVAL || 1), cnt = +rr.COUNT || Infinity, d0 = parse(s); let k = 0;
  const byd = rr.BYDAY ? rr.BYDAY.split(",").map(x => { const m = x.trim().match(/^([+-]?\d+)?([A-Z]{2})$/); return m ? { n: m[1] ? +m[1] : 0, wd: ICS_DOW.indexOf(m[2]) } : null; }).filter(x => x && x.wd >= 0) : null;
  const bmd = rr.BYMONTHDAY ? rr.BYMONTHDAY.split(",").map(Number).filter(Boolean) : null;
  const emit = d => { if (d >= s && d <= lim && k < cnt) { k++; out.push(d); } };
  if (rr.FREQ === "DAILY") { for (let d = s, g = 0; d <= lim && k < cnt && g < 4000; d = addDays(d, iv), g++) if (!byd?.length || byd.some(b => b.wd === parse(d).getDay())) emit(d); }
  else if (rr.FREQ === "WEEKLY") {
    const offs = [...new Set((byd?.length ? byd.map(b => b.wd) : [d0.getDay()]).map(w => (w + 6) % 7))].sort((a, b) => a - b);
    for (let w0 = weekStart(s), g = 0; w0 <= lim && k < cnt && g < 800; w0 = addDays(w0, 7 * iv), g++) for (const o of offs) emit(addDays(w0, o));
  } else if (rr.FREQ === "MONTHLY") {
    for (let m = 0, g = 0; k < cnt && g < 600; m += iv, g++) {
      const f = new Date(d0.getFullYear(), d0.getMonth() + m, 1), ym = iso(f).slice(0, 7), nd = dim(ym); if (ym + "-01" > lim) break;
      let days = [];
      if (byd?.length) for (const b of byd) { const all = []; for (let x = 1; x <= nd; x++) if (new Date(f.getFullYear(), f.getMonth(), x).getDay() === b.wd) all.push(x); if (!b.n) days.push(...all); else { const x = b.n > 0 ? all[b.n - 1] : all[all.length + b.n]; if (x) days.push(x); } }
      else if (bmd?.length) days = bmd.map(x => x > 0 ? x : nd + 1 + x).filter(x => x >= 1 && x <= nd);
      else if (d0.getDate() <= nd) days = [d0.getDate()];   // dia 31 num mês de 30 dias: o mês fica sem ocorrência
      for (const x of [...new Set(days)].sort((a, b) => a - b)) emit(`${ym}-${pad(x)}`);
    }
  } else if (rr.FREQ === "YEARLY") {
    for (let y = d0.getFullYear(), g = 0; k < cnt && g < 300; y += iv, g++) { const d = `${y}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`; if (d > lim) break; if (iso(parse(d)) === d) emit(d); }
  }
  return out;
}
function icsParse(text) {
  const lines = String(text).replace(/\r?\n[ \t]/g, "").split(/\r?\n/), out = []; let ev = null;
  for (const ln of lines) {
    if (ln === "BEGIN:VEVENT") { ev = { EX: [] }; continue; } if (ln === "END:VEVENT") { if (ev) out.push(ev); ev = null; continue; } if (!ev) continue;
    const i = ln.indexOf(":"); if (i < 0) continue; const [k0, ...ps] = ln.slice(0, i).split(";"), k = k0.toUpperCase(), v = ln.slice(i + 1);
    if (k === "EXDATE") { for (const x of v.split(",")) { const d = icsDate(x.trim()); if (d) ev.EX.push(d.data); } continue; }   // pode vir em várias linhas
    ev[k] = { v, p: ps.join(";") };
  }
  const from = addDays(TODAY, -30), until = addDays(TODAY, 365), horizon = addDays(TODAY, 120), evs = new Map(), moved = new Set();
  const baseOf = (e, s) => { const en = icsDate(e.DTEND?.v, e.DTEND?.p); return { titulo: icsUn(e.SUMMARY?.v) || "(sem título)", local: icsUn(e.LOCATION?.v), hora: s.hora, fim: en?.hora || "" }; };
  /* uma ocorrência remarcada ou cancelada (RECURRENCE-ID) substitui a original da série */
  for (const e of out) { const rid = e["RECURRENCE-ID"]; if (!rid || !e.UID) continue; const r = icsDate(rid.v, rid.p), s = icsDate(e.DTSTART?.v, e.DTSTART?.p); if (!r) continue; const key = `${e.UID.v}#${r.data}`; moved.add(key);
    if (e.STATUS?.v !== "CANCELLED" && s && s.data >= from && s.data <= until) evs.set(key, { ...baseOf(e, s), data: s.data, uid: key }); }
  for (const e of out) {
    if (e["RECURRENCE-ID"] || e.STATUS?.v === "CANCELLED") continue; const s = icsDate(e.DTSTART?.v, e.DTSTART?.p); if (!s) continue;
    const u = e.UID?.v || `${s.data}-${e.SUMMARY?.v}`, base = baseOf(e, s), rr = Object.fromEntries((e.RRULE?.v || "").split(";").filter(Boolean).map(x => x.split("=")));
    if (!rr.FREQ) { if (s.data >= from && s.data <= until) evs.set(u, { ...base, data: s.data, uid: u }); continue; }
    const un = rr.UNTIL ? icsDate(rr.UNTIL)?.data : null, lim = un && un < horizon ? un : horizon, ex = new Set(e.EX);
    for (const d of icsOccurrences(s.data, rr, lim)) { const key = `${u}#${d}`; if (d >= TODAY && !ex.has(d) && !moved.has(key)) evs.set(key, { ...base, data: d, uid: key }); }
  }
  return [...evs.values()];
}
async function icsReadFile(file) {
  if (/\.zip$/i.test(file.name)) { const es = (await zipEntries(file)).filter(e => /\.ics$/i.test(e.name)); let t = ""; for (const e of es) t += await new Response(await zipStream(file, e)).text() + "\n"; return t; }   // Response decodifica UTF-8; precisa de bytes, não de texto
  return await file.text();
}
function icsPreview(evs, name) {
  const ex = new Map((S.eventos || []).map(e => [e.uid, e])), nw = evs.filter(e => !ex.has(e.uid)).length;
  $("#dlg").innerHTML = `<form method="dialog" class="wide"><h3>${ic("cal")}Agenda: ${esc(name)}</h3><p class="muted">${plural(evs.length, "compromisso", "compromissos")} entre ${fmtDY(addDays(TODAY, -30))} e ${fmtDY(addDays(TODAY, 365))} (repetições nos próximos 4 meses): ${nw} novos e ${evs.length - nw} atualizados.</p>
    <div class="hscroll" style="max-height:260px"><table class="dt"><thead><tr><th>Data</th><th>Hora</th><th>Compromisso</th><th>Local</th></tr></thead><tbody>${evs.slice().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).slice(0, 14).map(e => `<tr><td>${fmtDY(e.data)}</td><td>${esc(e.hora || "dia todo")}</td><td>${esc(e.titulo)}</td><td>${esc(e.local)}</td></tr>`).join("")}</tbody></table></div>
    <p class="note">${ic("info")}<span>Os compromissos entram em Hoje, na agenda dos relatórios e viram a métrica “Compromissos na agenda” nos cruzamentos. Importar de novo o mesmo arquivo atualiza, sem duplicar.</span></p>
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="ino">Cancelar</button><button type="button" class="btn primary" id="iok"${evs.length ? "" : " disabled"}>Importar ${evs.length}</button></div></div></form>`;
  const d = $("#dlg"); if (!d.open) d.showModal(); $("#ino").onclick = () => d.close();
  $("#iok").onclick = () => { const m = new Map((S.eventos || []).map(e => [e.uid, e])); for (const e of evs) m.set(e.uid, { id: m.get(e.uid)?.id || uid(), ...e, fonte: "ics" }); S.eventos = [...m.values()].filter(e => e.data >= addDays(TODAY, -400)); d.close(); touch("eventos", { label: "Agenda importada" }); undoToast(`${plural(evs.length, "compromisso importado", "compromissos importados")}`); };
}
function icsEsc(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); }
function exportICS() {
  const R = calcAt(mkey(TODAY)), until = addDays(TODAY, 366), ev = [], st = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  R.tar.filter(t => t.open && t.prazo && t.prazo >= TODAY && t.prazo <= until).forEach(t => ev.push([`tarefa-${t.id}`, `Tarefa: ${t.tarefa}`, t.prazo, [t.projeto && "Projeto: " + t.projeto, t.meta && "Meta: " + t.meta, "Prioridade: " + t.prio].filter(Boolean).join(" · ")]));
  R.pes.filter(p => p.prox).forEach(p => ev.push([`aniv-${slug(p.nome)}`, `Aniversário de ${p.nome}`, p.prox, p.notas || p.relacao, "YEARLY"]));
  R.docs.filter(d => d.validade && d.validade >= TODAY && d.validade <= until).forEach(d => ev.push([`doc-${d.id}`, `Vence: ${d.doc}`, d.validade, d.acao || ""]));
  R.metas.filter(m => m.ativa && m.rt !== "Concluída" && m.prazo && m.prazo >= TODAY && m.prazo <= until).forEach(m => ev.push([`meta-${m.id}`, `Prazo da meta: ${m.meta}`, m.prazo, `${m.area} · progresso ${pct(m.prog)}`]));
  for (const mid of MIDS) for (const p of mget(mid).plano?.passos || []) if (!p.feito && p.prazo && p.prazo >= TODAY) ev.push([`plano-${p.id}`, p.texto, p.prazo, `Plano do ${MENTOR_DEF[mid].nome}`]);
  if (!ev.length) { toast("Nada com data para exportar."); return; }
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Atlas da Vida 2//PT-BR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Atlas da Vida", ...ev.flatMap(([id, s, d, ds, rr]) => ["BEGIN:VEVENT", `UID:atlas-${id}@atlas`, `DTSTAMP:${st}`, `DTSTART;VALUE=DATE:${d.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addDays(d, 1).replace(/-/g, "")}`, ...(rr ? [`RRULE:FREQ=${rr}`] : []), `SUMMARY:${icsEsc(s)}`, `DESCRIPTION:${icsEsc(ds)}`, "END:VEVENT"]), "END:VCALENDAR"];
  saveFile(`atlas-agenda-${TODAY}.zip`, zipFiles([{ name: "atlas-agenda.ics", data: icsJoin(ics) }]));
}
/* ---------------------------------------------------------------- Notion: tarefas nos dois sentidos */
/* markdown do Notion: estes caracteres vão escapados com barra invertida (especificação “enhanced markdown” deles) */
const ntEsc = s => String(s || "").replace(/([\\*~`$\[\]<>{}|^])/g, "\\$1"), ntUnesc = s => String(s || "").replace(/\\([\\*~`$\[\]<>{}|^])/g, "$1");
const taskLine = t => `- [ ] ${ntEsc(t.tarefa)}${t.prazo ? ` (até ${fmtDY(t.prazo)})` : ""} \`atlas:${t.id}\``;
const notionIdOf = (r, url) => r?.payload?.pages?.[0]?.id || (String(url).match(/([0-9a-f]{32})(?:\?|$)/i) || [])[1] || (String(url).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0] || "";
async function notionTasksSync() {
  if (!MCP) { toast("O Notion não está disponível nesta visualização."); return; }
  IX.busy = "notion"; IX.err = ""; render(); const st = S.integ?.notion?.tarefas;
  try {
    if (!st?.id) {
      const open = calcAt(mkey(TODAY)).tar.filter(t => t.open), pai = S.integ?.notion?.pai, input = { pages: [{ properties: { title: "Tarefas do Atlas" }, content: `Marque as caixas aqui e toque em Sincronizar no Atlas. Tarefas novas escritas nesta página (- [ ] …) também entram no Atlas.\n\n${open.map(taskLine).join("\n")}` }] };
      if (pai?.id) input.parent = { page_id: pai.id, type: "page_id" }; else input.creation_mode = "draft";
      const r = await MCP.callTool("Notion", "notion-create-pages", input), url = notionUrl(r.payload ?? r.content), id = notionIdOf(r, url);
      if (!id && !url) throw { code: "tool_error", message: "o Notion não devolveu a página criada" };
      S.integ.notion.tarefas = { id: id || url, url, at: Date.now(), n: open.length }; touch("integ", { noUndo: true }); toast(`Página “Tarefas do Atlas” criada no Notion com ${plural(open.length, "tarefa", "tarefas")}`); return;
    }
    const r = await MCP.callTool("Notion", "notion-fetch", { id: st.url || st.id }), text = notionText(r.payload?.text);
    const lines = text.split("\n").map(l => l.match(/^\s*- \[( |x|X)\]\s+(.*?)\s*$/)).filter(Boolean).map(m => ({ done: !!m[1].trim(), raw: m[2], id: (m[2].match(/`atlas:([a-z0-9]+)`/i) || [])[1], text: ntUnesc(m[2].replace(/`atlas:[a-z0-9]+`/i, "").replace(/\s*\(até [^)]*\)\s*$/, "").trim()) }));
    let fromDone = 0, fromNew = 0; const upd = [], created = new Set();
    for (const l of lines) {
      if (l.id) { const t = S.tarefas.find(x => x.id === l.id); if (!t) continue;
        if (l.done && t.status !== "Concluída") { t.status = "Concluída"; t.concluida = TODAY; fromDone++; }
        else if (!l.done && t.status === "Concluída") upd.push({ old_str: `- [ ] ${l.raw}`, new_str: `- [x] ${l.raw}` }); }
      else if (!l.done && l.text.length >= 3) { const c = CMD.tarefa.p(l.text, { date: TODAY, area: "" }); if (c.ok) { c.apply(); const t = S.tarefas.at(-1); t.origem = "notion"; created.add(t.id); fromNew++; upd.push({ old_str: `- [ ] ${l.raw}`, new_str: `- [ ] ${l.raw} \`atlas:${t.id}\`` }); } }
    }
    const onPage = new Set(lines.map(l => l.id).filter(Boolean)), add = calcAt(mkey(TODAY)).tar.filter(t => t.open && !onPage.has(t.id) && !created.has(t.id));
    let fail = 0;
    if (upd.length) { try { await MCP.callTool("Notion", "notion-update-page", { page_id: st.id, command: "update_content", content_updates: upd.slice(0, 100), allow_async: false }); } catch { for (const u of upd.slice(0, 25)) { try { await MCP.callTool("Notion", "notion-update-page", { page_id: st.id, command: "update_content", content_updates: [u], allow_async: false }); } catch { fail++; } } } }
    if (add.length) await MCP.callTool("Notion", "notion-update-page", { page_id: st.id, command: "insert_content", content: add.map(taskLine).join("\n"), position: { type: "end" }, allow_async: false });
    S.integ.notion.tarefas = { ...st, at: Date.now() }; touch("tarefas", "integ", { label: "Tarefas sincronizadas com o Notion" });
    toast(`Do Notion: ${fromDone} concluídas e ${fromNew} novas. Para o Notion: ${upd.length - fail} atualizadas e ${add.length} adicionadas.${fail ? ` ${fail} linhas não bateram com a página.` : ""}`);
  } catch (e) { IX.err = notionErr(e); toast(IX.err); }
  finally { IX.busy = ""; render(); }
}
/* ---------------------------------------------------------------- extrato: regras que aprendem com as suas correções */
const BANK_NOISE = /\b(compra|compras|pagamento|pagto|pag|debito|credito|cartao|carta|visa|mastercard|master|elo|amex|pix|ted|doc|transf|transferencia|enviado|enviada|recebido|recebida|pos|contactless|nfc|apple|google|pay|ref|parcela|parc|acquisto|pagamento|addebito|bonifico|carta|presso)\b/g;
function merchantKey(desc) {
  const n = norm(desc), s = n.replace(/\d+[\/.-]\d+(?:[\/.-]\d+)?/g, " ").replace(/[*#]\S*/g, " ").replace(BANK_NOISE, " ").replace(/\b\d+\b/g, " ").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  const ws = s.split(" ").filter(w => w.length >= 3); if (!ws.length) return "";
  const two = ws.slice(0, 2).join(" "); return ws.length > 1 && n.includes(two) ? two : ws[0];
}
function learnRule(desc, tipo, cat, quiet) {
  const key = merchantKey(desc); if (!key || key.length < 3) return null;
  const ex = (S.regras || []).find(r => norm(r.termo) === key && (r.tipo || "Despesa") === tipo);
  if (ex) { if (ex.cat === cat) return null; ex.cat = cat; ex.auto = true; ex.at = Date.now(); } else S.regras.push({ id: uid(), termo: key, tipo, cat, auto: true, at: Date.now() });
  if (!quiet) { touch("regras", { label: `Regra: “${key}” → ${cat}` }); toast(`Aprendido: “${key}” agora vai para ${cat}`); }
  return key;
}
function offerRule(desc, tipo, cat) { const key = merchantKey(desc); if (!key || (S.regras || []).some(r => norm(r.termo) === key && r.cat === cat)) return; toast(`Sempre classificar “${key}” como ${cat}?`, { l: "Sim, criar regra", f: () => learnRule(desc, tipo, cat) }); }
/* ---------------------------------------------------------------- painel em Integrações */
function pIntegTwoWay(R) {
  const on = !!MCP && NT.status !== "off", ts = S.integ?.notion?.tarefas, auto = (S.regras || []).filter(r => r.auto), ev = (S.eventos || []).filter(e => e.data >= TODAY).length;
  return panel(`${ic("refresh")}Nos dois sentidos`, `<div class="ixrow"><div>${ic("globe")}<b>Notion · tarefas</b><small>${ts?.id ? `Página <a class="lnk" href="${esc(ts.url || "#")}" target="_blank" rel="noopener">Tarefas do Atlas</a> · última sincronização ${relDay(iso(new Date(ts.at)))}` : "Cria uma página com as tarefas abertas; o que você marcar lá volta concluído, e o que escrever lá entra no Atlas."}</small></div><button type="button" class="btn sm${ts?.id ? "" : " primary"}" data-act="ixnotion"${on && !IX.busy ? "" : " disabled"}>${IX.busy === "notion" ? "Sincronizando…" : ts?.id ? "Sincronizar agora" : "Criar no Notion"}</button></div>
    <div class="ixrow"><div>${ic("cal")}<b>Agenda</b><small>${ev ? `${plural(ev, "compromisso futuro", "compromissos futuros")} importados. ` : ""}Importe o .ics (ou o .zip exportado pelo Google Agenda); exporte prazos, aniversários e documentos em .ics.</small></div><div class="row wrap"><label class="btn sm filebtn">${ic("upload")}Importar .ics<input type="file" id="ix_ics" accept=".ics,.zip,text/calendar,application/zip" hidden></label><button type="button" class="btn sm" data-act="ixicsout">${ic("download")}Exportar .ics</button></div></div>
    <div class="ixrow"><div>${ic("pulse")}<b>Saúde do celular e do relógio</b><small>Apple Health: Saúde › seu perfil › Exportar todos os dados (export.zip). Google Fit: Takeout › Fit › “Daily activity metrics.csv”. Samsung Health: no app, Configurações › Baixar dados pessoais; envie a pasta exportada compactada em .zip (ou os .csv). Passos, sono, peso e treinos.</small></div><div class="row wrap"><label class="btn sm filebtn">${ic("upload")}Apple Health<input type="file" id="ix_ah" accept=".zip,.xml,application/zip,text/xml" hidden></label><label class="btn sm filebtn">${ic("upload")}Google Fit<input type="file" id="ix_fit" accept=".csv,text/csv" hidden></label><label class="btn sm filebtn">${ic("upload")}Samsung Health<input type="file" id="ix_sh" accept=".zip,.csv,application/zip,text/csv" multiple hidden></label></div></div>
    ${IX.busy === "health" ? `<p class="note">${ic("clock")}<span id="ix_prog">${esc(IX.prog || "Lendo o arquivo…")}</span></p>` : ""}
    <div class="ixrow"><div>${ic("coins")}<b>Extrato do banco que aprende</b><small>Ao importar, corrija a categoria de uma linha e todas as do mesmo estabelecimento seguem; a correção vira regra para os próximos extratos. ${auto.length ? `${plural(auto.length, "regra aprendida", "regras aprendidas")}: ${auto.slice(-4).map(r => `“${esc(r.termo)}” → ${esc(r.cat)}`).join(", ")}.` : ""}</small></div><label class="btn sm filebtn">${ic("upload")}Importar extrato<input type="file" id="imp_bank2" accept=".csv,text/csv,text/plain" hidden></label></div>
    ${IX.err ? `<p class="note st-warn">${esc(IX.err)}</p>` : ""}`, { cls: "span2" });
}
function integ2Click(t) {
  const a = t.dataset.act;
  if (a === "ixnotion") { notionTasksSync(); return true; }
  if (a === "ixicsout") { exportICS(); return true; }
  return false;
}
function integ2Change(t) {
  const f = t.files?.[0];
  if (t.id === "ix_ah" && f) { IX.busy = "health"; IX.prog = "Abrindo o arquivo…"; render(); healthRead(f).then(healthPreview).catch(e => toast(e?.message === "noexport" ? "Não achei o export.xml dentro do .zip." : e?.message === "zip" ? "Esse arquivo não parece um .zip válido." : e?.message === "zipmethod" ? "Este navegador não consegue descompactar esse .zip; descompacte e envie o export.xml." : "Não consegui ler o arquivo do Apple Health.")).finally(() => { IX.busy = ""; render(); }); t.value = ""; return true; }
  if (t.id === "ix_sh" && f) { const fs = [...t.files]; IX.busy = "health"; IX.prog = "Lendo a exportação do Samsung Health…"; render(); samsungRead(fs).then(healthPreview).catch(e => toast(e?.message === "noshealth" ? "Não achei passos, sono, peso nem exercícios nesses arquivos. Envie a pasta exportada pelo Samsung Health (compactada em .zip) ou os .csv dela." : e?.message === "zip" ? "Esse arquivo não parece um .zip válido." : "Não consegui ler a exportação do Samsung Health.")).finally(() => { IX.busy = ""; render(); }); t.value = ""; return true; }
  if (t.id === "ix_fit" && f) { f.text().then(tx => { const rows = csvParse(tx); if (!isFit(rows)) { toast("Esse CSV não parece o “Daily activity metrics” do Google Fit."); return; } healthPreview(fitParse(rows)); }).catch(() => toast("Não consegui ler o arquivo.")); t.value = ""; return true; }
  if (t.id === "ix_ics" && f) { icsReadFile(f).then(tx => icsPreview(icsParse(tx), f.name)).catch(() => toast("Não consegui ler a agenda.")); t.value = ""; return true; }
  if (t.id === "imp_bank2") { readFile(t).then(x => openImport("lanc", csvParse(x.text), x.name)).catch(() => toast("Não consegui ler o arquivo.")); t.value = ""; return true; }
  return false;
}
