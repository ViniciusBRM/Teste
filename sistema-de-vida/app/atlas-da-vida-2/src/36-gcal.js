/* ================================================================ Google Calendar ao vivo, pelo conector da conta Claude
   Lê os próximos 30 dias (e o dia anterior) para a Agenda do Atlas (S.eventos, origem "gcal") e, só quando você pede, cria eventos:
   os blocos de estudo do plano de Idiomas. A primeira chamada pede a sua permissão no próprio Claude. */
const GCAL = { st: "", msg: "", busy: false };
const GC_SRV = "Google Calendar";
const gcInteg = () => { S.integ ||= {}; return (S.integ.gcal ||= {}); };
const gcErr = e => ({ not_granted: "Você não liberou o Google Calendar para esta página.", needs_reauth: "O Google Calendar precisa ser reconectado nas configurações do Claude.", server_not_connected: "O Google Calendar não está conectado na sua conta Claude.", not_in_manifest: "Esta versão da página não tem acesso ao Google Calendar.", blocked_by_policy: "A sua organização bloqueou este conector.", cancelled: "Cancelado." }[e?.code] || `Não consegui falar com o Google Calendar (${e?.code || "erro"}).`);
const tzLocal = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Rome"; } catch { return "Europe/Rome"; } };
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
function gcMap(ev) {
  const s = ev.start || {}, e = ev.end || {};
  if (s.dateTime) { const a = new Date(s.dateTime), b = e.dateTime ? new Date(e.dateTime) : null; return { data: iso(a), hora: hhmm(a), fim: b ? hhmm(b) : "" }; }
  const d0 = String(s.date || "").slice(0, 10), d1 = String(e.date || "").slice(0, 10); return { data: d0, hora: "", fim: "", ate: d1 && d1 > addDays(d0, 1) ? addDays(d1, -1) : "" };
}
async function gcSync(o = {}) {
  if (!MCP) { GCAL.st = "off"; GCAL.msg = EX_MODE ? "Desligado no modo exemplo." : "O conector não está disponível nesta visualização."; if (!o.silent) toast(GCAL.msg); render(); return; }
  if (GCAL.busy) return; GCAL.busy = true; GCAL.st = "load"; if (!o.silent) render();
  const de = addDays(TODAY, -1), ate = addDays(TODAY, 30), evs = [];
  try {
    let tok = ""; for (let p = 0; p < 4; p++) {
      const r = await MCP.callTool(GC_SRV, "list_events", { startTime: new Date(de + "T00:00:00").toISOString(), endTime: new Date(ate + "T23:59:59").toISOString(), orderBy: "startTime", pageSize: 250, timeZone: tzLocal(), ...(tok ? { pageToken: tok } : {}) }, { cache: false });
      const pl = r?.payload || {}; for (const ev of pl.events || []) if (ev.status !== "cancelled" && ev.id) evs.push(ev); tok = pl.nextPageToken || ""; if (!tok) break; }
    const keep = (S.eventos || []).filter(e => e.origem !== "gcal" || e.data < de || e.data > ate), novos = evs.map(ev => { const m = gcMap(ev); return { id: "gc_" + ev.id, uid: "gcal:" + ev.id, ...m, titulo: String(ev.summary || "(sem título)").slice(0, 200), local: String(ev.location || "").slice(0, 200), link: ev.htmlLink || "", origem: "gcal" }; }).filter(e => e.data);
    S.eventos = [...keep, ...novos]; const G = gcInteg(); G.on = true; G.last = Date.now(); G.n = novos.length;
    GCAL.st = "ok"; GCAL.msg = ""; touch("eventos", "integ", { label: "Google Calendar", noUndo: true }); if (!o.silent) toast(`${plural(novos.length, "compromisso", "compromissos")} do Google Calendar nos próximos 30 dias`);
  } catch (e) { GCAL.st = "err"; GCAL.msg = gcErr(e); if (!o.silent) toast(GCAL.msg); render(); }
  finally { GCAL.busy = false; }
}
/* sincroniza sozinho uma vez por abertura, se já foi conectado antes */
function gcAuto() { const G = S.integ?.gcal; if (G?.on && MCP && !EX_MODE && (!G.last || Date.now() - G.last > 30 * 60e3)) gcSync({ silent: true }); }
async function gcCriarEstudo() {
  if (!MCP) { toast(EX_MODE ? "Desligue o modo exemplo para criar eventos." : "O conector não está disponível nesta visualização."); return; }
  const I = idi(), P = idiPlano().filter(p => p.en + p.it > 0), ini = hm2m(I.janela.ini) ?? 1170; if (!P.length) { toast("Nenhum bloco de estudo no plano desta semana."); return; }
  const ja = new Set((S.eventos || []).filter(e => /^Estudo · /.test(e.titulo)).map(e => e.data)), novos = P.filter(p => !ja.has(p.d));
  if (!novos.length) { toast("Os blocos desta semana já estão na agenda."); return; }
  GCAL.busy = true; toast(`Criando ${plural(novos.length, "bloco", "blocos")} no Google Calendar…`); let n = 0;
  try {
    for (const p of novos) {
      /* começa no primeiro horário livre da janela, depois dos compromissos que caem nela */
      let st = ini; for (const e of p.ev.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""))) { const a = hm2m(e.hora), b = hm2m(e.fim) ?? (a != null ? a + 60 : null); if (a != null && a <= st && b > st) st = b; }
      const min = p.en + p.it, a = new Date(`${p.d}T${pad(Math.floor(st / 60))}:${pad(st % 60)}:00`), b = new Date(a.getTime() + min * 60e3);
      const titulo = `Estudo · ${p.en ? `inglês ${p.en} min` : ""}${p.en && p.it ? " + " : ""}${p.it ? `italiano ${p.it} min` : ""}`;
      await MCP.callTool(GC_SRV, "create_event", { summary: titulo, startTime: a.toISOString(), endTime: b.toISOString(), description: "Criado pelo Atlas da Vida a partir do plano de Idiomas.", availability: "AVAILABILITY_BUSY", useDefaultReminders: true });
      S.eventos.push({ id: uid(), uid: "atlas:" + p.d, data: p.d, hora: hhmm(a), fim: hhmm(b), titulo, local: "", origem: "gcal" }); n++;
    }
    toast(`${plural(n, "bloco criado", "blocos criados")} no Google Calendar`);
  } catch (e) { toast(gcErr(e) + (n ? ` (${n} criados antes do erro)` : "")); }
  finally { GCAL.busy = false; if (n) touch("eventos", { label: "Estudo na agenda" }); }
}
function gcPanel() {
  const G = S.integ?.gcal || {}, on = !!MCP, n = (S.eventos || []).filter(e => e.origem === "gcal" && e.data >= TODAY).length;
  const st = GCAL.st === "load" ? ["none", "Sincronizando…"] : GCAL.st === "err" ? ["crit", "Erro"] : G.on ? ["good", "Conectado"] : on ? ["none", "Não conectado"] : ["none", "Indisponível nesta visualização"];
  return panel(`${ic("cal")}Google Calendar <span class="pill ${st[0]}">${st[1]}</span>`, `<p>Traz os seus compromissos dos próximos 30 dias para a Agenda do Atlas, usada pelo Hoje, pelo plano de Idiomas e pela semana. Só lê; eventos só são criados quando você pede (os blocos de estudo de Idiomas).</p>
    ${GCAL.msg ? `<p class="note st-warn">${ic("info")}<span>${esc(GCAL.msg)}</span></p>` : ""}${G.last ? `<p class="muted small">Última sincronização: ${new Date(G.last).toLocaleString("pt-BR")} · ${plural(n, "compromisso futuro", "compromissos futuros")} vindos do Google.</p>` : ""}
    <div class="row wrap"><button type="button" class="btn sm primary" data-act="gcsync"${on && !GCAL.busy ? "" : " disabled"}>${ic("refresh")}${G.on ? "Sincronizar agora" : "Conectar e sincronizar"}</button>${G.on ? `<button type="button" class="btn sm ghost" data-act="gcoff">Desconectar</button>` : ""}</div>
    ${on ? "" : `<p class="muted small">Abra o Atlas no Claude com o Google Calendar conectado em Configurações › Conectores.</p>`}`);
}
function gcClick(t) {
  const a = t.dataset.act;
  if (a === "gcsync") { gcSync(); return true; }
  if (a === "gcoff") { const G = gcInteg(); G.on = false; S.eventos = (S.eventos || []).filter(e => e.origem !== "gcal" || e.data < TODAY); touch("integ", "eventos", { label: "Google Calendar desconectado" }); return true; }
  if (a === "gcestudo") { gcCriarEstudo(); return true; }
  return false;
}
