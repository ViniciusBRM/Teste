
/* ================================================================ lembretes das atividades semanais
   Uma regra por atividade da Rotina, pelo nome do bloco: “Academia · seg, qua, sex · 15 min antes”. Vale para toda ocorrência
   com esse nome (de modelo, avulsa ou repetida), em todas as semanas. Com o Atlas aberto, o Secretário avisa (aviso, som se ligado,
   notificação do navegador se permitida). Para tocar no celular com o Atlas fechado, a regra vira evento semanal no Google Agenda,
   com o mesmo aviso, marcado com GC_LEMB + id (a sincronização da Agenda ignora esses eventos).
   Dados: S.secretario.semanais = [{ id, titulo, dias: [0..6] (vazio = todo dia em que aparece), min, on, gcal: { ids, min, slots, at } }],
   S.secretario.lsSom, S.secretario.lsNotif. Avisos já dados ficam neste aparelho (localStorage), para cada aparelho avisar uma vez. */
const LS_MIN = [0, 5, 10, 15, 30, 60];
const lsData = () => (secData().semanais ||= []);
const lsMinTxt = m => +m ? `${m} min antes` : "na hora";
const lsSoTxt = d => ["só aos domingos", "só às segundas", "só às terças", "só às quartas", "só às quintas", "só às sextas", "só aos sábados"][d];
const lsOrdDow = ds => ds.slice().sort((a, b) => (a + 6) % 7 - (b + 6) % 7);
const lsDiasTxt = r => !r.dias?.length ? "todo dia em que aparece" : lsOrdDow(r.dias).map(d => DOWS[d].toLowerCase()).join(", ");
const lsRegra = (titulo, dow) => lsData().find(r => normNome(r.titulo) === normNome(titulo) && (!r.dias?.length || r.dias.includes(dow)));
const lsRegraDe = titulo => lsData().find(r => normNome(r.titulo) === normNome(titulo));
/* avisos devidos agora: blocos de hoje (e de amanhã, quando o aviso cai antes da meia-noite) com regra ativa, ainda sem marcação */
function lsDevidos(now = new Date()) {
  if (!lsData().some(r => r.on !== false)) return [];
  const m = now.getHours() * 60 + now.getMinutes(), out = [];
  for (const [d, off] of [[TODAY, 0], [addDays(TODAY, 1), 1440]]) for (const b of rtOcc(d)) {
    const r = lsRegra(b.titulo, parse(d).getDay()); if (!r || r.on === false) continue;
    const a = hm2min(b.ini) + off;
    if (m >= a - (+r.min || 0) && m <= a + 5 && !b.st) out.push({ k: `${d}|${b.id}|${b.ini}|${r.id}`, b, d, r, falta: a - m });
  }
  return out.sort((x, y) => x.falta - y.falta);
}
const lsVistos = () => { try { return JSON.parse(localStorage.getItem("atlas_lsem") || "{}") || {}; } catch { return {}; } };
/* chamado pelo relógio do Secretário (a cada 30 s): devolve true quando avisou */
function lsTick() {
  if (!LOADED || EX_MODE) return false;
  const vis = lsVistos(), novos = lsDevidos().filter(x => !vis[x.k]); if (!novos.length) return false;
  for (const x of novos) vis[x.k] = Date.now();
  for (const k in vis) if (Date.now() - vis[k] > 3 * 86400e3) delete vis[k];
  try { localStorage.setItem("atlas_lsem", JSON.stringify(vis)); } catch {}
  const um = x => `${x.falta > 0 ? `Em ${x.falta} min` : "Agora"}: ${x.b.titulo} (${x.b.ini}–${x.b.fim})`;
  const txt = novos.length === 1 ? um(novos[0]) : `${novos.length} atividades: ${novos.map(x => `${x.b.titulo} ${x.b.ini}`).join(", ")}`;
  SEC.nudge = { txt, crit: true, at: Date.now() }; SEC.tab = "lembretes"; SEC.open = true; secLS("open", true); toast(txt); secPaint();
  lsNotifica(txt); if (secData().lsSom) lsSom();
  return true;
}
function lsNotifica(txt) { try { if (secData().lsNotif && "Notification" in window && Notification.permission === "granted") new Notification("Atlas da Vida", { body: txt, tag: "atlas-lsem" }); } catch {} }
function lsSom() { try { const C = new (window.AudioContext || window.webkitAudioContext)(), o = C.createOscillator(), g = C.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.0001, C.currentTime); g.gain.exponentialRampToValueAtTime(.2, C.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, C.currentTime + .6); o.connect(g).connect(C.destination); o.start(); o.stop(C.currentTime + .65); setTimeout(() => C.close(), 900); } catch {} }
async function lsPedirNotif() {
  if (!("Notification" in window)) { toast("Este navegador não mostra notificações; os avisos continuam dentro do Atlas."); return; }
  let p = Notification.permission; try { if (p === "default") p = await Notification.requestPermission(); } catch { p = "denied"; }
  secData().lsNotif = p === "granted"; touch("secretario", { noUndo: true, label: "Notificações" });
  toast(p === "granted" ? "Notificações ligadas neste aparelho." : "Esta visualização não deixa mostrar notificações. Os avisos continuam dentro do Atlas; para o celular, use o Google Agenda.");
}
/* atividades que dá para lembrar: nomes da rotina dos próximos 14 dias e dos modelos */
function lsAtividades() {
  const n = new Map(); for (let i = 0; i < 14; i++) for (const b of rtOcc(addDays(TODAY, i))) if (!n.has(normNome(b.titulo))) n.set(normNome(b.titulo), b.titulo);
  for (const m of S.rotinaModelos || []) for (const x of m.semana || []) if (!n.has(normNome(x[3]))) n.set(normNome(x[3]), x[3]);
  return [...n.values()].sort((a, b) => a.localeCompare(b, "pt"));
}
/* próximas ocorrências da regra (para mostrar quando vai tocar) */
function lsProximas(r, k = 3) {
  const out = []; for (let i = 0; i < 14 && out.length < k; i++) { const d = addDays(TODAY, i), dow = parse(d).getDay(); if (r.dias?.length && !r.dias.includes(dow)) continue;
    for (const b of rtOcc(d).sort((x, y) => x.a - y.a)) if (normNome(b.titulo) === normNome(r.titulo) && (d > TODAY || hm2min(b.ini) > nowMin())) out.push(`${i === 0 ? "hoje" : i === 1 ? "amanhã" : DOWS[dow].toLowerCase()} ${b.ini}`); }
  return out.slice(0, k);
}
/* criar, mudar e tirar (um passo de desfazer cada) */
function lsSalvar(titulo, dias, min) {
  const t = String(titulo || "").trim().slice(0, 120); if (!t) return null;
  let r = lsData().find(x => normNome(x.titulo) === normNome(t) && JSON.stringify(lsOrdDow(x.dias || [])) === JSON.stringify(lsOrdDow(dias || [])));
  if (r) { r.min = +min || 0; r.on = true; } else { r = { id: uid(), titulo: t, dias: lsOrdDow(dias || []), min: +min || 0, on: true }; lsData().push(r); }
  touch("secretario", { label: "Lembrete semanal" }); return r;
}
/* no cartão do bloco: muda a regra que cobre este dia; “sem lembrete” tira só este dia da regra (ou a regra, se era só ele ou todos) */
function lsDoCartao(titulo, dow, min, so) {
  const r = lsRegra(titulo, dow);
  if (min === "") { if (!r) return; if (r.dias?.length > 1) r.dias = r.dias.filter(d => d !== dow); else secData().semanais = lsData().filter(x => x !== r); touch("secretario", { label: "Lembrete removido" }); undoToast(`Sem lembrete para ${titulo}${r.dias?.length ? ` (${lsSoTxt(dow).replace("só ", "")})` : ""}`); return; }
  if (r) { r.min = +min; if (so != null) r.dias = so ? [dow] : []; touch("secretario", { label: "Lembrete semanal" }); }
  else lsSalvar(titulo, so ? [dow] : [], min);
  const R = lsRegra(titulo, dow); toast(`Lembrete: ${titulo}, ${lsMinTxt(R.min)}, ${lsDiasTxt(R)}, toda semana`);
}
function lsCartaoHTML(b, day) {
  const dow = parse(day).getDay(), r = lsRegra(b.titulo, dow), k = esc(`${b.titulo}|${dow}`);
  return `<div class="flbl">${ic("clock")}Lembrete toda semana</div><div class="lsrow"><select data-lsmin="${k}" aria-label="Lembrete de ${esc(b.titulo)}"><option value="">Sem lembrete</option>${LS_MIN.map(m => `<option value="${m}"${r && +r.min === m ? " selected" : ""}>${lsMinTxt(m)}</option>`).join("")}</select>
    <label class="chk"><input type="checkbox" data-lsso="${k}"${r?.dias?.length === 1 && r.dias[0] === dow ? " checked" : ""}${r ? "" : " disabled"}><span>${lsSoTxt(dow)}</span></label></div>
    <small class="muted">${r ? `Vale para toda “${esc(b.titulo)}”: ${esc(lsDiasTxt(r))}.${r.gcal?.on ? " Também no Google Agenda." : ""}` : `Escolha quando avisar: vale para toda “${esc(b.titulo)}”, em todas as semanas.`}</small>`;
}
/* ---------------------------------------------------------------- Google Agenda: evento semanal com o aviso, por horário da atividade */
const lsSlots = r => { const s = new Map(); for (const d of rtWeek(TODAY)) { const dow = parse(d).getDay(); if (r.dias?.length && !r.dias.includes(dow)) continue; for (const b of rtOcc(d)) if (normNome(b.titulo) === normNome(r.titulo)) s.set(`${dow}|${b.ini}`, [dow, b.ini, b.fim]); } return [...s.values()].sort((x, y) => (x[0] + 6) % 7 - (y[0] + 6) % 7 || x[1].localeCompare(y[1])); };
const lsSlotsTxt = sl => sl.map(([d, a]) => `${DOWS[d].toLowerCase()} ${a}`).join(", ");
const lsGcDesatual = r => r.gcal?.on && (+r.gcal.min !== +r.min || r.gcal.slots !== lsSlotsTxt(lsSlots(r)));
const lsIdDe = res => { const p = res?.payload ?? res; return [p?.id, p?.event?.id, p?.eventId, p?.result?.id, p?.data?.id, p?.event?.eventId].find(x => typeof x === "string" && x) || ""; };
async function lsGcalPor(r) {
  if (!MCP) { toast(EX_MODE ? "Desligue o modo exemplo para usar o Google Agenda." : "O Google Agenda não está disponível nesta visualização."); return; }
  const sl = lsSlots(r); if (!sl.length) { toast(`“${r.titulo}” não aparece na rotina desta semana: não há horário para levar ao Google.`); return; }
  if (GCAL.busy) return; GCAL.busy = true; LS.busy = r.id; render(); let n = 0; const ids = [];
  try {
    if (r.gcal?.on) await lsGcalTira0(r);
    for (const [dow, ini, fim] of sl) {
      let d = TODAY; while (parse(d).getDay() !== dow) d = addDays(d, 1);
      const fimD = fim === "24:00" ? `${addDays(d, 1)}T00:00:00` : `${d}T${fim}:00`;
      const res = await MCP.callTool(GC_SRV, "create_event", { summary: `🔔 ${r.titulo}`, startTime: `${d}T${ini}:00`, endTime: fimD, timeZone: tzLocal(), recurrenceData: ["RRULE:FREQ=WEEKLY"],
        overrideReminders: [{ method: "popup", minutes: +r.min || 0 }], useDefaultReminders: false, availability: "AVAILABILITY_FREE",
        description: `Lembrete semanal do Atlas da Vida (${lsMinTxt(r.min)}). Para mudar ou tirar, use o Atlas: Rotina › Lembretes. ${GC_LEMB}${r.id}` });
      const id = lsIdDe(res); if (id) ids.push(id); n++;
    }
    r.gcal = { on: true, ids, min: +r.min || 0, slots: lsSlotsTxt(sl), at: Date.now() }; touch("secretario", { label: "Lembrete no Google Agenda" });
    toast(`${r.titulo}: ${plural(n, "evento semanal", "eventos semanais")} no Google Agenda, com aviso ${lsMinTxt(r.min)}.`);
  } catch (e) { toast(gcErr(e) + (n ? ` (${n} criado(s) antes do erro: use “Atualizar no Google” para refazer)` : "")); if (n) { r.gcal = { on: true, ids, min: +r.min || 0, slots: "", at: Date.now() }; touch("secretario", { noUndo: true }); } }
  finally { GCAL.busy = false; LS.busy = ""; render(); }
}
/* tira os eventos da regra: pelos ids guardados; sem ids, procura a marca da regra na agenda das próximas 2 semanas */
async function lsGcalTira0(r) {
  let ids = [...(r.gcal?.ids || [])];
  if (!ids.length) {
    const res = await MCP.callTool(GC_SRV, "list_events", { startTime: `${TODAY}T00:00:00`, endTime: `${addDays(TODAY, 15)}T23:59:59`, fullText: GC_LEMB + r.id, pageSize: 100, timeZone: tzLocal() }, { cache: false });
    const pl = res?.payload ?? {}, lista = Array.isArray(pl) ? pl : pl.events ?? pl.items ?? pl.result?.events ?? pl.data?.events ?? [];
    for (const ev of lista) if (String(ev?.description || "").includes(GC_LEMB + r.id)) ids.push(ev.recurringEventId || ev.id);
  }
  for (const id of [...new Set(ids.filter(Boolean))]) await MCP.callTool(GC_SRV, "delete_event", { eventId: id, notificationLevel: "NONE" });
  r.gcal = null;
}
async function lsGcalTira(r, apagar) {
  if (!MCP) { toast("O Google Agenda não está disponível nesta visualização: o evento continua lá até você apagar no Google."); return false; }
  if (GCAL.busy) return false; GCAL.busy = true; LS.busy = r.id; render();
  try { await lsGcalTira0(r); if (apagar) secData().semanais = lsData().filter(x => x !== r); touch("secretario", { label: apagar ? "Lembrete apagado" : "Lembrete fora do Google" }); toast(apagar ? `Lembrete de ${r.titulo} apagado, também no Google Agenda.` : `${r.titulo} saiu do Google Agenda.`); return true; }
  catch (e) { toast(gcErr(e)); return false; }
  finally { GCAL.busy = false; LS.busy = ""; render(); }
}
/* ---------------------------------------------------------------- painel na Rotina e lista no Secretário */
const LS = { dias: [], busy: "" };
function lsPanel() {
  const L = lsData(), A = lsAtividades(), D = secData();
  const item = r => { const px = lsProximas(r), des = lsGcDesatual(r);
    return `<div class="lsit${r.on === false ? " off" : ""}"><div><b>${ic("clock")}${esc(r.titulo)}</b><small>${esc(lsDiasTxt(r))} · ${lsMinTxt(r.min)}${px.length ? ` · próximas: ${esc(px.join(", "))}` : " · não aparece nos próximos 14 dias"}${r.gcal?.on ? ` · ${des ? "<span class=\"st-warn\">Google desatualizado</span>" : "no Google Agenda"}` : ""}</small></div>
      <div class="row wrap">${LS.busy === r.id ? `<span class="muted small">Google Agenda…</span>` : `<button type="button" class="btn sm ghost" data-lsgc="${r.id}">${r.gcal?.on ? (des ? "Atualizar no Google" : "Tirar do Google") : "Pôr no Google Agenda"}</button>`}<button type="button" class="btn sm ghost" data-lson="${r.id}">${r.on === false ? "Retomar" : "Pausar"}</button><button type="button" class="btn sm ghost" data-lsdel="${r.id}" aria-label="Apagar o lembrete de ${esc(r.titulo)}">${ic("trash")}</button></div></div>`; };
  return panel(`${ic("clock")}Lembretes <small>${L.length ? plural(L.filter(r => r.on !== false).length, "ativo", "ativos") : "nenhum"}</small>`, `${L.map(item).join("") || `<p class="muted small">Escolha uma atividade da rotina para ser avisado antes dela, toda semana.</p>`}
    <details class="lsnew"${L.length ? "" : " open"}><summary>${ic("plus")}Novo lembrete</summary><div class="form f1">
      <label>Atividade<input type="text" id="ls_t" list="ls_tl" autocomplete="off" placeholder="${esc(A[0] || "Academia")}"><datalist id="ls_tl">${A.map(t => `<option value="${esc(t)}">`).join("")}</datalist></label>
      <div class="lsdias" role="group" aria-label="Dias">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="seg" data-lsdia="${d}" aria-pressed="${LS.dias.includes(d)}">${DOWS[d].toLowerCase()}</button>`).join("")}<small class="muted">nenhum marcado = todo dia em que aparece</small></div>
      <label>Avisar<select id="ls_m">${LS_MIN.map(m => `<option value="${m}"${m === 10 ? " selected" : ""}>${lsMinTxt(m)}</option>`).join("")}</select></label>
      <button type="button" class="btn sm primary" data-act="lsadd">${ic("plus")}Criar lembrete</button></div></details>
    <div class="lscfg"><label class="chk"><input type="checkbox" data-lscfg="lsSom"${D.lsSom ? " checked" : ""}><span>Tocar um som no aviso</span></label>${"Notification" in window ? `<button type="button" class="lnk" data-act="lsnotif">${D.lsNotif && Notification.permission === "granted" ? "Notificações do navegador ligadas" : "Ligar notificações do navegador"}</button>` : ""}</div>
    <p class="muted small">O Atlas avisa pelo Secretário enquanto estiver aberto. Para tocar no celular com ele fechado, ponha o lembrete no Google Agenda: vira um evento semanal, com o mesmo aviso, nos horários desta semana.</p>`);
}
function lsSecHTML() {
  const L = lsData(); if (!L.length) return `<div class="secsec">${ic("clock")}Toda semana</div><small class="muted">Nenhum lembrete semanal. Crie na <a href="#rotina.semana">Rotina › Lembretes</a> ou no cartão de qualquer bloco.</small>`;
  return `<div class="secsec">${ic("clock")}Toda semana<small>${L.length}</small></div>${L.map(r => { const px = lsProximas(r, 1); return `<div class="secit${r.on === false ? " done" : ""}"><i class="secdot"></i><div class="secb"><b>${esc(r.titulo)}</b><small>${esc(lsDiasTxt(r))} · ${lsMinTxt(r.min)}${px.length ? ` · próxima: ${esc(px[0])}` : ""}${r.gcal?.on ? " · Google" : ""}${r.on === false ? " · pausado" : ""}</small></div></div>`; }).join("")}<a class="lnk small" href="#rotina.semana">gerenciar na Rotina</a>`;
}
function lsClick(t) {
  const ds = t.dataset;
  if (ds.lsdia != null) { const d = +ds.lsdia; LS.dias = LS.dias.includes(d) ? LS.dias.filter(x => x !== d) : [...LS.dias, d]; t.setAttribute("aria-pressed", String(LS.dias.includes(d))); return true; }
  if (ds.act === "lsadd") { const tt = $("#ls_t")?.value.trim(); if (!tt) { toast("Escolha a atividade."); $("#ls_t")?.focus(); return true; }
    const r = lsSalvar(tt, LS.dias, $("#ls_m").value); LS.dias = []; const px = lsProximas(r, 1);
    undoToast(`Lembrete: ${r.titulo}, ${lsMinTxt(r.min)}, ${lsDiasTxt(r)}${px.length ? ` · próximo ${px[0]}` : " · não aparece nos próximos 14 dias"}`); return true; }
  if (ds.lson) { const r = lsData().find(x => x.id === ds.lson); if (r) { r.on = r.on === false; touch("secretario", { label: r.on ? "Lembrete retomado" : "Lembrete pausado" }); } return true; }
  if (ds.lsdel) { const r = lsData().find(x => x.id === ds.lsdel); if (!r) return true;
    if (r.gcal?.on) { lsGcalTira(r, true); return true; }
    secData().semanais = lsData().filter(x => x !== r); touch("secretario", { label: "Lembrete apagado" }); undoToast(`Lembrete de ${r.titulo} apagado`); return true; }
  if (ds.lsgc) { const r = lsData().find(x => x.id === ds.lsgc); if (!r) return true; if (r.gcal?.on && !lsGcDesatual(r)) lsGcalTira(r, false); else lsGcalPor(r); return true; }
  if (ds.act === "lsnotif") { lsPedirNotif(); return true; }
  return false;
}
function lsChange(t) {
  const ds = t.dataset;
  if (ds.lsmin != null) { const [ti, dw] = ds.lsmin.split("|"), so = $("[data-lsso]", t.closest("form") || document)?.checked; lsDoCartao(ti, +dw, t.value, t.value === "" ? null : so); lsCartaoRepinta(t, ti, +dw); return true; }
  if (ds.lsso != null) { const [ti, dw] = ds.lsso.split("|"), r = lsRegra(ti, +dw); if (r) { r.dias = t.checked ? [+dw] : []; touch("secretario", { label: "Lembrete semanal" }); toast(`Lembrete de ${ti}: ${lsDiasTxt(r)}`); lsCartaoRepinta(t, ti, +dw); } return true; }
  if (ds.lscfg) { secData()[ds.lscfg] = t.checked; touch("secretario", { noUndo: true, label: "Lembretes" }); return true; }
  return false;
}
/* o cartão do bloco fica aberto: só a parte do lembrete é redesenhada */
function lsCartaoRepinta(t, titulo, dow) { const box = t.closest(".lsbox"); if (!box) return; const b = { titulo }, d = rtWeek(TODAY).find(x => parse(x).getDay() === dow) || TODAY; box.innerHTML = lsCartaoHTML(b, d); }
