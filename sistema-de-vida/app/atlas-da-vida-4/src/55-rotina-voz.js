
/* ================================================================ Rotina › Capturar o dia
   Na aba Rotina, o Capturar recebe o relato do dia inteiro: ditado pelo microfone do teclado, pelo reconhecimento de voz do
   navegador (quando a página tem microfone) ou digitado. A IA separa cada atividade com início e fim; sem IA, o Atlas separa as
   frases que têm horário. Você confere, e cada atividade vira um bloco na sua faixa de meia hora. O que já estava planejado no
   mesmo horário recebe o status (feito, parcial, pulado) em vez de virar um bloco repetido. */
const RTC = { text: "", d: null, items: [], busy: false, ctl: null, src: "", duvidas: [], sr: null, interim: "", msg: "", warn: false, velho: false };
const RTC_ST = [["feito", "Feito"], ["parcial", "Parcial"], ["pulado", "Pulado"], ["", "Planejado"]];
/* refeições, banho e pausas são “Descanso” antes das regras gerais da Rotina (que leem “café” como lazer) */
const RTC_KW0 = [[/\b(cafe|desjejum|almoc|almoce|jant|lanch|refeica|banho|cochil|soneca|descans|acordei|acordar|levantei)/, "Descanso"], [/\b(coordenac|reuni|obra|cliente|projeto|relatorio|trabalh|escritorio|e-?mails?)/, "Trabalho"]];
const rtcCat = t => { const f = fold(String(t || "")); return ([...RTC_KW0, ...RT_KW].find(([rx]) => rx.test(f)) || [0, "Outro"])[1]; };
/* meia hora mais próxima (meio-termo para cima): 7:15 → 7:30, 7:10 → 7:00 */
const rtcHalf = m => Math.min(1440, Math.max(0, Math.round(m / 30) * 30));
const rtcHM = s => { const m = String(s || "").match(/^(\d{1,2}):(\d{2})$/); return m && +m[1] <= 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : null; };

/* ---------------------------------------------------------------- sem IA: frases com horário */
function rtcLocal(text) {
  /* pedaços: frases, vírgulas, “depois”, “então” e o “e” que separa duas atividades com horário (“academia das 18 às 19 e jantar às 20”) */
  const SPL = /[.;!?\n]+|,|\s+e\s+depois\s+(?:disso\s+)?|\s+depois\s+(?:disso\s+)?(?=\D)|\s+(?:então|entao|aí)\s+|\s+e\s+(?!\d)(?=[^,.;]*?(?:(?:^|\s)(?:das?|às|as|até|ate)\s+\d|\d{1,2}:\d{2}|(?:^|\s)\d{1,2}h))/i;
  const norm1 = x => x.replace(/(?:\b(?:ao|à|a)\s+)?meio[ -]dia/gi, "às 12h").replace(/(?:\b(?:à|a)\s+)?meia[ -]noite/gi, "às 24h");
  const tira = x => x.replace(/^(?:(?:e|e depois|depois|aí|então|daí|hoje|ontem|anteontem|amanhã|eu)[\s:,]+)+/i, "").replace(/\s+(?:e|de|da|do|que|às|as|até)$/i, "").replace(/^[\s,–-]+|[\s,–-]+$/g, "").trim();
  const out = []; let buf = [];
  for (const raw of String(text || "").split(SPL)) {
    const p = norm1(String(raw || "").trim()); if (!p) continue;
    /* “21h série”: hora no começo do pedaço (5 h ou mais, sem “de” depois, que seria duração) */
    let h = rtHoraTxt(p); const h0 = !h && p.match(/^(\d{1,2})h(\d{2})?(?![\p{L}\d])(?!\s+(?:de|da|do|por)\b)/iu);
    if (h0 && +h0[1] >= 5 && +h0[1] <= 23) h = { a: +h0[1] * 60 + (+h0[2] || 0), z: +h0[1] * 60 + (+h0[2] || 0) + 30, txt: h0[0], so: true };
    const ateRx = /\bate\s+(?:as\s+|a\s+)?(\d{1,2})(?:[:h](\d{2}))?\s*h?\b/, ate = fold(p).match(ateRx);
    if (!h && !ate) { buf.push(tira(p)); continue; }
    let a = h ? h.a : null, z = h && !h.so ? h.z : null, aprox = false;
    /* “às 14h reunião até as 16h”: o “até” é o fim */
    if (h && h.so && ate) { const z1 = Math.min(1440, +ate[1] * 60 + (+ate[2] || 0)); if (z1 > a) z = z1; }
    else if (!h && ate) { z = Math.min(1440, +ate[1] * 60 + (+ate[2] || 0)); a = out.length ? out.at(-1).z ?? null : null; aprox = true; if (a == null || z <= a) { buf = []; continue; } }
    const semAte = x => x.replace(/\bat[eé]\s+(?:as|às|a)?\s*\d{1,2}(?:[:h]\d{2})?\s*h?(?![\p{L}\d])/iu, " ").replace(/\s{2,}/g, " ");
    let titulo = tira(semAte(h ? rtSemHora(p, h) : p));
    if (!titulo || /^\d/.test(titulo)) titulo = buf.filter(Boolean).join(", ");
    buf = [];
    if (!titulo) continue;
    out.push({ titulo: trunc(titulo.charAt(0).toUpperCase() + titulo.slice(1), 60), a, z, aprox: aprox || z == null });
  }
  /* só o início: vai até a próxima atividade (no máximo 4 h), senão 30 min */
  out.forEach((x, i) => { if (x.z == null) { const nx = out.slice(i + 1).find(y => y.a > x.a); x.z = nx && nx.a - x.a <= 240 ? nx.a : x.a + 30; } });
  return out.filter(x => x.z > x.a).map(x => ({ titulo: x.titulo, ini: m2hm(x.a), fim: m2hm(Math.min(1440, x.z)), cat: rtcCat(x.titulo), status: null, aprox: x.aprox }));
}

/* ---------------------------------------------------------------- revisão: faixas de meia hora e o que já estava na rotina */
function rtcPrep(list, d) {
  const now = nowMin(), occ = rtOcc(d), A = rtAgenda(d), usados = new Set();
  const its = list.map(x => ({ ...x, a0: rtcHM(x.ini), z0: rtcHM(x.fim) })).filter(x => x.a0 != null && x.z0 != null && x.z0 > x.a0).sort((p, q) => p.a0 - q.a0);
  let fim = -1, fim0 = -1;
  for (const x of its) {
    /* arredondar não pode encavalar duas atividades que no relato vinham uma depois da outra; uma dentro da outra (almoço no meio do trabalho) fica */
    let a = rtcHalf(x.a0), z = rtcHalf(x.z0); if (a < fim && x.a0 >= fim0 && fim < 1440) a = fim; if (z < a + 30) z = Math.min(1440, a + 30); if (z <= a) { a = z - 30; }
    x.a = a; x.z = z; if (z > fim) { fim = z; fim0 = x.z0; } x.ini = m2hm(a); x.fim = m2hm(z);
    x.cat = RT_CATS.some(c => c[0] === x.cat) ? x.cat : rtcCat(x.titulo);
    const st = ["feito", "parcial", "pulado", ""].includes(x.status) ? x.status : x.status === "plano" ? "" : null;
    x.st = st ?? (d < TODAY || (d === TODAY && x.z0 <= now) ? "feito" : "");
    /* mesmo horário e mesma atividade (palavra em comum ou mesma categoria): marca o bloco que já existe */
    const pal = new Set(fold(x.titulo).split(/\W+/).filter(w => w.length >= 4));
    const m = occ.filter(b => !usados.has(b.id) && b.a < z && a < b.z).map(b => ({ b, ov: (Math.min(b.z, z) - Math.max(b.a, a)) / Math.min(b.z - b.a, z - a), sim: fold(b.titulo).split(/\W+/).some(w => pal.has(w)) || b.cat === x.cat }))
      .filter(o => o.ov >= .5 && o.sim).sort((p, q) => q.ov - p.ov)[0];
    x.match = m ? m.b.id : null; x.matchT = m ? `${m.b.titulo} (${m.b.ini}–${m.b.fim})` : ""; if (m) usados.add(m.b.id);
    x.bate = A.timed.filter(e => e.a != null && e.a < z && a < e.z).map(e => e.titulo).slice(0, 2);
    x.nota = x.a0 !== a || x.z0 !== z ? `no relato: ${m2hm(x.a0)}–${m2hm(Math.min(1440, x.z0))}` : "";
    x.on = x.onUser ?? !(x.st === "pulado" && !x.match);
  }
  return its;
}
const rtcConta = () => { const on = RTC.items.filter(x => x.on), n = on.filter(x => !x.match).length, m = on.length - n; return on.length ? [n ? plural(n, "bloco novo", "blocos novos") : "", m ? plural(m, "bloco marcado", "blocos marcados") : ""].filter(Boolean).join(" · ") : RTC.text.trim() ? "Nenhuma atividade com horário ainda" : "Conte o dia para começar"; };
function rtcRows() {
  if (!RTC.text.trim() && !RTC.items.length) return `<div class="capex"><span class="flbl">Do jeito que você falaria</span><p>“Acordei às 6h30. Das 7 às 7h30 café da manhã. Trabalhei das 8 ao meio-dia, almocei até 13h30, reunião com o cliente das 14 às 15h30. Academia das 18 às 19h e jantar às 20h.”</p></div>`;
  if (!RTC.items.length) return `<div class="empty">${RTC.src === "ia" ? "A IA não achou atividades com horário." : SAMPLE && !AI_OFF ? "Ainda não achei horários no texto. Toque em “Separar com IA”: ela entende “depois do almoço”, “em seguida” e a ordem do dia." : "Ainda não achei horários. Diga as horas de cada atividade: “das 9 às 12”, “às 14h”, “até as 13h30”."}</div>`;
  const opt = (sel, fim) => RT_TIMES.filter(m => fim ? m > 0 : m < 1440).map(m => `<option${m2hm(m) === sel ? " selected" : ""}>${m2hm(m)}</option>`).join("");
  return `<div class="rtcis">${RTC.items.map((x, i) => `<div class="rtci${x.on ? " on" : ""}" style="--c:${rtCor(x.cat)}">
    <label class="rtcck"><input type="checkbox" data-rtcon="${i}"${x.on ? " checked" : ""} aria-label="Marcar ${esc(x.titulo)} na rotina"></label>
    <div class="rtcm"><div class="rtch2"><select data-rtcf="${i}|ini" aria-label="Começa">${opt(x.ini)}</select><span>–</span><select data-rtcf="${i}|fim" aria-label="Termina">${opt(x.fim, true)}</select>
      <input type="text" data-rtcf="${i}|titulo" value="${esc(x.titulo)}" aria-label="Atividade" autocomplete="off"></div>
      <div class="rtch2"><select data-rtcf="${i}|cat" aria-label="Categoria">${RT_CATS.map(([c]) => `<option${x.cat === c ? " selected" : ""}>${c}</option>`).join("")}</select>
      <select data-rtcf="${i}|st" aria-label="Como foi">${RTC_ST.map(([k, l]) => `<option value="${k}"${x.st === k ? " selected" : ""}>${l}</option>`).join("")}</select>
      <small class="muted">${x.match ? `${ic("check")}já estava na rotina: ${esc(x.matchT)}` : "bloco novo"}${x.aprox ? " · horário deduzido, confira" : ""}${x.nota ? ` · ${esc(x.nota)}` : ""}${x.bate.length ? ` · bate com ${esc(x.bate.join(", "))} da agenda` : ""}</small></div></div></div>`).join("")}</div>`;
}
function rtcPaint() {
  const p = $("#rtc_prev"); if (p) p.innerHTML = (RTC.velho ? `<div class="note">${ic("info")}<span>O texto mudou depois da IA. Toque em “Separar com IA” de novo para refazer a lista.</span></div>` : "") + rtcRows() + (RTC.duvidas.length ? `<div class="note st-warn">${ic("info")}<span>${RTC.duvidas.map(esc).join(" · ")}</span></div>` : "");
  const n = $("#rtc_n"); if (n) n.textContent = rtcConta();
  const s = $('[data-act="rtcsave"]'); if (s) s.disabled = !RTC.items.some(x => x.on);
  const ia = $('[data-act="rtcai"]'); if (ia) ia.disabled = !RTC.text.trim() || !SAMPLE || !!AI_OFF;
  const v = $("#rtc_vmsg"); if (v) { v.textContent = RTC.msg + (RTC.interim ? ` “${RTC.interim}”` : ""); v.className = "small " + (RTC.warn ? "st-warn" : "muted"); }
  const m = $('[data-act="rtcmic"]'); if (m) { m.classList.toggle("on", !!RTC.sr); m.setAttribute("aria-pressed", String(!!RTC.sr)); m.innerHTML = `${ic(RTC.sr ? "stop" : "mic")}${RTC.sr ? "Parar" : "Gravar"}`; }
}
/* refaz faixas, blocos já existentes e status padrão, mantendo o que a pessoa escolheu na revisão */
const rtcRedo = () => { RTC.items = rtcPrep(RTC.items.map(x => ({ titulo: x.titulo, ini: m2hm(x.a0), fim: m2hm(x.z0), cat: x.cat, status: x.stUser ?? x.status ?? null, stUser: x.stUser, onUser: x.onUser, aprox: x.aprox })), RTC.d); rtcPaint(); };
/* dia dito no relato (“ontem”, “amanhã”…); sem isso, fica o dia escolhido */
const rtcDia = t => { const f = fold(String(t || "")); return /\banteontem\b/.test(f) ? addDays(TODAY, -2) : /\bontem\b/.test(f) ? addDays(TODAY, -1) : /\bdepois de amanha\b/.test(f) ? addDays(TODAY, 2) : /\bamanha\b/.test(f) ? addDays(TODAY, 1) : null; };
/* enquanto o texto muda, o Atlas mostra o que entendeu sozinho; depois da IA, o texto mudado só avisa (a separação dela fica) */
function rtcLocalRefresh() { if (!RTC.dUser) { const dd = rtcDia(RTC.text); if (dd && dd !== RTC.d) { RTC.d = dd; const el = $("#rtc_d"); if (el) el.value = dd; } }
  if (RTC.src === "ia") { RTC.velho = true; rtcPaint(); return; } RTC.items = rtcPrep(rtcLocal(RTC.text), RTC.d); RTC.src = "local"; RTC.duvidas = []; rtcPaint(); }
const rtcDeb = debounce(rtcLocalRefresh, 250);

function rtcOpen(text, d) {
  if (text != null) { RTC.text = String(text); }
  RTC.d = d || (PAGE === "rotina" ? RT.d : TODAY); RTC.src = ""; RTC.velho = false; RTC.duvidas = []; RTC.dUser = false;
  const dd = rtcDia(RTC.text); if (dd && !d) RTC.d = dd;
  RTC.items = RTC.text.trim() ? rtcPrep(rtcLocal(RTC.text), RTC.d) : [];
  const ai = !!SAMPLE && !AI_OFF, dlg = $("#dlg");
  dlg.innerHTML = `<form method="dialog" id="rtcf" class="wide cap rtcap"><div class="caph"><h3>${ic("mic")}Capturar o dia na Rotina</h3><button type="button" class="iconbtn" data-act="rtcx" aria-label="Fechar">${ic("x")}</button></div>
    <p class="muted small">Conte o dia inteiro, do jeito que falaria. ${ai ? "A IA separa cada atividade e põe na faixa de horário dela;" : "Cada frase com horário vira uma atividade;"} você confere antes de marcar. O que já estava planejado no mesmo horário recebe “feito”, sem repetir o bloco.</p>
    <div class="caprow"><label class="capd">Dia<input type="date" id="rtc_d" value="${RTC.d}"></label><button type="button" class="btn sm rtcmic" data-act="rtcmic" aria-pressed="false">${ic("mic")}Gravar</button><span id="rtc_vmsg" class="small muted" aria-live="polite"></span></div>
    <textarea id="rtc_txt" class="captxt" rows="5" placeholder="Ex.: acordei às 6h30, das 7 às 7h30 café da manhã, trabalhei das 8 ao meio-dia, academia das 18 às 19h…" aria-label="O dia, contado">${esc(RTC.text)}</textarea>
    <p class="muted small rtcdica">${ic("mic")}No celular, você também pode tocar no microfone do teclado e ditar direto no campo.</p>
    <div id="rtc_prev" class="capprev"></div>
    <div class="capfoot"><span class="muted small" id="rtc_n"></span><div class="row wrap">${RTC.busy ? `<button type="button" class="btn sm" data-act="rtcstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn sm" data-act="rtcai"${ai && RTC.text.trim() ? "" : " disabled"} title="${ai ? "A IA lê o relato, separa as atividades e acha os horários, inclusive “depois do almoço” e “em seguida”." : "A IA não está disponível nesta visualização"}">${ic("spark")}Separar com IA</button>`}<button type="button" class="btn sm primary" data-act="rtcsave" disabled>${ic("check")}Marcar na rotina</button></div></div>
    <p class="muted small rtcger"><button type="button" class="btn sm ghost" data-act="rtcgeral">${ic("bolt")}Capturar geral</button> para gastos, sono, treino, tarefas e o diário.</p></form>`;
  if (!dlg.open) dlg.showModal();
  dlg.addEventListener("close", rtcStopVoz, { once: true });
  $("#rtcf").onsubmit = e => e.preventDefault();
  rtcPaint();
  setTimeout(() => { const t = $("#rtc_txt"); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 40);
}
function rtcClose() { rtcStopVoz(); RTC.ctl?.abort(); if ($("#dlg").open && $("#rtcf")) $("#dlg").close(); }

/* ---------------------------------------------------------------- voz do navegador (quando a página tem microfone) */
function rtcStopVoz() { const r = RTC.sr; RTC.sr = null; RTC.interim = ""; if (r) try { r.stop(); } catch {} }
function rtcMic() {
  if (RTC.sr) { rtcStopVoz(); RTC.msg = ""; rtcPaint(); if (RTC.text.trim() && SAMPLE && !AI_OFF && !RTC.busy) rtcAI(); return; }   /* parou de falar: com IA, já separa */
  if (VOZ.sr) stopVoice();
  const why = pdVoiceOk(); let r = null;
  if (!why) try { r = new (pdSR())(); } catch { r = null; }
  if (!r) { Object.assign(RTC, { warn: true, msg: `${PD_WHY[why || "nosr"] || ""} ${PD_DICT[pdPlat()]}`.trim() }); rtcPaint(); setTimeout(() => $("#rtc_txt")?.focus(), 30); return; }
  r.lang = pdLang(); r.interimResults = true; r.continuous = true; r.maxAlternatives = 1;
  Object.assign(RTC, { sr: r, interim: "", warn: false, msg: "Ouvindo… conte o dia na ordem, com os horários. Toque em Parar ao terminar." });
  r.onresult = e => { let fin = "", tmp = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const x = e.results[i]; if (x.isFinal) fin += x[0].transcript; else tmp += x[0].transcript; }
    if (fin.trim()) { const t = RTC.text.trim(), f = fin.trim(); RTC.text = (t ? t + (/[.!?]$/.test(t) ? " " : ". ") : "") + f.charAt(0).toUpperCase() + f.slice(1); const el = $("#rtc_txt"); if (el) el.value = RTC.text; rtcDeb(); }
    RTC.interim = tmp; rtcPaint(); };
  r.onerror = e => { const c = e.error; if (c === "aborted") return; if (c === "not-allowed" || c === "service-not-allowed") VOZ.blocked = "perm"; else if (c === "network") VOZ.blocked = "rede"; else if (c === "audio-capture") VOZ.blocked = "mic";
    Object.assign(RTC, { warn: true, msg: c === "no-speech" ? "Não ouvi nada. Toque em Gravar e fale de novo." : `${PD_WHY[VOZ.blocked] || `A voz parou (${c}).`} ${PD_DICT[pdPlat()]}` }); rtcPaint(); };
  r.onend = () => { if (RTC.sr !== r) return; RTC.sr = null; RTC.interim = ""; if (!RTC.warn) RTC.msg = ""; rtcPaint();
    /* terminou de falar: com IA, já separa */
    if (RTC.text.trim() && SAMPLE && !AI_OFF && !RTC.busy) rtcAI(); };
  try { r.start(); } catch { RTC.sr = null; Object.assign(RTC, { warn: true, msg: `${PD_WHY.perm} ${PD_DICT[pdPlat()]}` }); }
  rtcPaint();
}

/* ---------------------------------------------------------------- IA */
async function rtcAI() {
  if (!SAMPLE || RTC.busy || !RTC.text.trim()) return;
  RTC.busy = true; RTC.ctl = new AbortController(); rtcRepaintFoot();
  const d = RTC.d, ja = rtOcc(d).sort((p, q) => p.a - q.a), [w0, w1] = rtWake();
  const build = ctx => { aiNote("ferr", "relato do dia para a Rotina", ctx);
    return `TAREFA: ROTINA DO DIA
Você transforma o relato de um dia (muitas vezes ditado por voz, com erros de transcrição) em blocos de uma agenda de meia em meia hora.
Hoje é ${TODAY} (${DOWL[parse(TODAY).getDay()]}), agora são ${nowHM()}. Dia do relato, salvo indicação no texto: ${d} (${DOWL[parse(d).getDay()]}).
Responda só com JSON neste formato: {"data":"AAAA-MM-DD","atividades":[{"titulo":"Café da manhã","ini":"07:00","fim":"07:30","cat":"Descanso","status":"feito","aprox":false}],"duvidas":["pergunta curta"]}
Regras:
- Uma atividade por coisa que a pessoa fez ou vai fazer, na ordem do dia. Não junte duas atividades num bloco e não invente nenhuma.
- "titulo": curto (2 a 5 palavras), sem o horário, com a primeira letra maiúscula, nas palavras da pessoa.
- "ini" e "fim" em HH:MM, 24 h. "das 9 ao meio-dia" = 09:00 a 12:00. Só o início ("às 14h"): termina quando começa a próxima atividade, ou 30 min depois se não houver. Duração dita ("1 hora de inglês") vale. Horário não dito mas dedutível pela sequência ("logo depois", "em seguida", "depois do almoço"): deduza e marque "aprox": true. Sem como deduzir: deixe a atividade de fora e escreva a dúvida.
- "10 da noite" = 22:00; "8 e meia" = 08:30 ou 20:30 conforme o contexto; "meia-noite" = 24:00 como fim.
- "cat": exatamente uma destas: ${RT_CATS.map(c => c[0]).join(", ")}.
- Atividades cadastradas da pessoa (quando o relato falar de uma delas, use o nome exatamente assim e a mesma categoria): ${rtaTodas().slice(0, 80).map(a => `${a.nome} (${a.cat})`).join("; ") || "nenhuma"}.
- "status": "feito" para o que já aconteceu, "parcial" para o que fez só em parte, "pulado" para o que diz que não fez, "plano" para o que ainda vai fazer.
- Blocos que já estão na rotina desse dia (quando for a mesma atividade, use o mesmo título): ${ja.length ? ja.map(b => `${b.ini}–${b.fim} ${b.titulo}`).join("; ") : "nenhum"}.
- A pessoa costuma acordar às ${m2hm(w0)} e dormir às ${m2hm(w1)}.
Relato:
"""${RTC.text.slice(0, 8000)}"""`; };
  try {
    const r = await aiCall("Rotina", build, { json: true, signal: RTC.ctl.signal, modelTier: "quick" });
    if (/^\d{4}-\d{2}-\d{2}$/.test(r?.data || "") && r.data !== RTC.d) { RTC.d = r.data; const el = $("#rtc_d"); if (el) el.value = r.data; }
    const list = (Array.isArray(r?.atividades) ? r.atividades : []).filter(x => x && typeof x === "object").map(x => ({ titulo: trunc(String(x.titulo || "").trim(), 60), ini: String(x.ini || "").trim(), fim: String(x.fim || "").trim(), cat: String(x.cat || ""), status: x.status == null ? null : String(x.status), aprox: !!x.aprox })).filter(x => x.titulo);
    RTC.items = rtcPrep(list, RTC.d); RTC.src = "ia"; RTC.velho = false;
    RTC.duvidas = (Array.isArray(r?.duvidas) ? r.duvidas : []).map(String).filter(Boolean).slice(0, 4);
  } catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { RTC.busy = false; rtcRepaintFoot(); rtcPaint(); }
}
function rtcRepaintFoot() {
  const f = $("#rtcf .capfoot .row"); if (!f) return; const ai = !!SAMPLE && !AI_OFF;
  const b = f.querySelector('[data-act="rtcai"],[data-act="rtcstop"]'); if (!b) return;
  b.outerHTML = RTC.busy ? `<button type="button" class="btn sm" data-act="rtcstop">${ic("stop")}Separando… parar</button>` : `<button type="button" class="btn sm" data-act="rtcai"${ai && RTC.text.trim() ? "" : " disabled"}>${ic("spark")}Separar com IA</button>`;
}

/* ---------------------------------------------------------------- marcar na rotina */
function rtcSave() {
  const d = RTC.d || TODAY, on = RTC.items.filter(x => x.on && x.z > x.a); if (!on.length) { toast("Nada selecionado para marcar."); return; }
  let novos = 0, marcados = 0;
  for (const x of on) {
    const b = x.match && (S.rotina || []).find(y => y.id === x.match);
    if (b) { b.st = { ...(b.st || {}) }; if (b.feitos?.[d]) { b.feitos = { ...b.feitos }; delete b.feitos[d]; } if (x.st) b.st[d] = x.st; else delete b.st[d]; marcados++; continue; }
    (S.rotina ||= []).push({ id: uid(), data: d, ini: x.ini, fim: x.fim, titulo: x.titulo, cat: x.cat, rep: "", exc: [], st: x.st ? { [d]: x.st } : {}, notas: x.nota ? `${x.nota} (Capturar)` : "Capturar", ...rtCorAtiv(x.titulo) });
    novos++;
  }
  rtcStopVoz(); Object.assign(RTC, { text: "", items: [], duvidas: [], src: "", msg: "", warn: false, velho: false });
  if ($("#dlg").open) $("#dlg").close();
  RT.d = d; RT.scrolled = "";
  if (PAGE !== "rotina" || rtView() !== "dia") setHash("rotina", "dia");
  touch("rotina", { label: "Rotina pelo Capturar" });
  undoToast([novos ? plural(novos, "bloco novo", "blocos novos") : "", marcados ? plural(marcados, "bloco marcado", "blocos marcados") : ""].filter(Boolean).join(" e ") + ` em ${relDay(d) === "hoje" ? "hoje" : fmtD(d)}`);
}

/* ---------------------------------------------------------------- eventos */
function rtcClick(t) {
  const a = t.dataset.act;
  if (a === "rtcap") { rtcOpen(); return true; }
  if (a === "rtcx") { rtcClose(); return true; }
  if (a === "rtcmic") { rtcMic(); return true; }
  if (a === "rtcai") { rtcStopVoz(); rtcAI(); return true; }
  if (a === "rtcstop") { RTC.ctl?.abort(); return true; }
  if (a === "rtcsave") { rtcSave(); return true; }
  if (a === "rtcgeral") { const tx = RTC.text, d = RTC.d; rtcStopVoz(); CAP.data = d || TODAY; openCapture(tx || null); return true; }
  if (a === "caprot") { rtcOpen(CAP.text, CAP.data || TODAY); return true; }
  if (t.dataset.rtcon != null) { const x = RTC.items[+t.dataset.rtcon]; if (x) { x.on = x.onUser = t.checked; t.closest(".rtci")?.classList.toggle("on", x.on); rtcPaint(); } return true; }
  return false;
}
function rtcInput(t) {
  if (t.id === "rtc_txt") { RTC.text = t.value; const ia = $('[data-act="rtcai"]'); if (ia) ia.disabled = !t.value.trim() || !SAMPLE || !!AI_OFF; rtcDeb(); return true; }
  if (t.dataset.rtcf && t.tagName === "INPUT") { const [i, k] = t.dataset.rtcf.split("|"), x = RTC.items[+i]; if (x && k === "titulo") x.titulo = t.value.trim() || x.titulo; return true; }
  return false;
}
function rtcChange(t) {
  /* outro dia: refaz faixas, blocos já existentes e o status padrão (o que veio da IA ou foi escolhido aqui fica) */
  if (t.id === "rtc_d") { RTC.d = t.value || TODAY; RTC.dUser = true; rtcRedo(); return true; }
  if (t.dataset.rtcf) { const [i, k] = t.dataset.rtcf.split("|"), x = RTC.items[+i]; if (!x) return true;
    if (k === "ini" || k === "fim") { x[k] = t.value; const a = hm2min(x.ini), z = hm2min(x.fim); if (z <= a) { x.fim = m2hm(Math.min(1440, a + 30)); } x.a0 = hm2min(x.ini); x.z0 = hm2min(x.fim); rtcRedo(); }
    else if (k === "cat") { x.cat = t.value; t.closest(".rtci")?.style.setProperty("--c", rtCor(x.cat)); }
    else if (k === "st") { x.st = t.value; x.stUser = t.value || "plano"; }
    else if (k === "titulo") x.titulo = t.value.trim() || x.titulo;
    return true; }
  return false;
}
