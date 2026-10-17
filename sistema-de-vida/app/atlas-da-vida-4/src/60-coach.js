
/* ================================================================ IA de acompanhamento da atividade
   Ativada na aba Inspiração, assume o perfil da atividade escolhida e passa a viver num botão lateral, em todas as abas (como o
   Secretário). Motor: o Claude da página (a mesma IA dos mentores), no nível de esforço escolhido: Baixo (rápido), Médio, Alto e
   Máximo (o modelo mais capaz, lendo os dados antes de responder). Dá para: conversar e compartilhar informações (o contexto fica
   guardado por atividade); pedir que avalie o que você faz numa aba (o Atlas abre a aba e manda o que está nela); e compartilhar a
   tela: o texto da aba aberta vai junto de cada mensagem, e uma imagem (captura da tela, quando o navegador deixa, ou um print anexado)
   vai junto da próxima, quando esta visualização aceita imagens. Ferramentas da IA: ler_dados (todo o Atlas), ver_aba e
   anotar_progresso. Dados: S.inspira.ativo, .esforco, .tela e .ativs[id] = { conversa, notas, contexto, n, ultima }. */
const CO_ESF = {
  baixo: { nome: "Baixo", tier: "quick", txt: "respostas curtas e diretas (até 80 palavras), uma sugestão por vez" },
  medio: { nome: "Médio", tier: "default", txt: "respostas objetivas (até 200 palavras), com uma sugestão concreta e o próximo passo" },
  alto: { nome: "Alto", tier: "complex", txt: "pense com calma e estruture: o que está bom, o que corrigir e por quê, e o próximo passo (até 350 palavras)" },
  max: { nome: "Máximo", tier: "complex", txt: "análise profunda: antes de responder, leia com ler_dados o que for relevante; compare alternativas, aponte riscos e proponha um plano em passos, sem enrolação" },
};
const CO_PAPEL = { ingles: "um professor de inglês experiente, paciente e exigente, que corrige com explicações curtas e propõe prática real", italiano: "uma professora de italiano de Turim, que ensina a língua do dia a dia e a do trabalho e corrige com gentileza",
  engenharia: "um engenheiro geotécnico sênior e especialista em BIM, que orienta a carreira e o estudo técnico com rigor e exemplos de obra", filosofia: "um professor de filosofia que domina o estoicismo e provoca com boas perguntas",
  treino: "um treinador de força experiente, prudente com lesões e preciso com a progressão de carga", meditacao: "um instrutor de meditação sereno e prático", espiritismo: "um estudioso espírita sereno, fiel às obras de Allan Kardec, que une fé e razão",
  tao: "um praticante de longa data do Taoísmo e do Budismo, que fala com simplicidade", escrita: "um editor exigente e generoso, que ajuda a pensar escrevendo", ceu: "um astrônomo amador que ensina a observar o céu de cidade",
  esboco: "um arquiteto e desenhista de croquis urbanos", construir: "um engenheiro mecânico que adora montar e explicar mecanismos", programar: "um engenheiro de software especializado em automação para engenharia civil (Python, Dynamo, IFC)",
  cozinha: "um chef que ensina técnica antes de receita", escuta: "um crítico musical que ensina a ouvir", caminhada: "um caminhante filósofo, atento ao corpo e às ideias", ensinar: "um professor que usa a técnica Feynman", bem: "um coordenador de voluntariado prático e caloroso" };
const CO = { open: false, live: null, img: null, lim: null, aval: "" };
const coData = () => insData();
const coAtivo = () => { const id = coData().ativo; return id && insAtv(id) ? id : ""; };
const coAtv = () => insAtv(coAtivo());
const coSt = id => { const s = (coData().ativs[id] ||= { n: 0 }); s.conversa ||= []; s.notas ||= []; s.contexto ??= ""; return s; };
const coPersona = a => { const m = a.mentor && MENTOR_DEF[a.mentor]; return m ? `${m.nome}, ${m.arq}. ${m.voz || ""}` : CO_PAPEL[a.id] || `um mentor experiente em ${a.nome}, prático e encorajador`; };
/* o que está na aba aberta, em texto: títulos, números e o que está escrito nos campos */
function coTela() {
  const m = $("#main"); if (!m) return "";
  const campos = [...m.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select")].filter(e => e.value && String(e.value).trim()).slice(0, 60)
    .map(e => `${(e.labels?.[0]?.innerText || e.getAttribute("aria-label") || e.placeholder || e.id || "campo").trim().slice(0, 50)}: ${String(e.value).trim().slice(0, 300)}`);
  const txt = (m.innerText || "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
  return `ABA: ${pageTitle()}${SUB ? " › " + SUB : ""} (#${PAGE}${SUB ? "." + SUB : ""})\n${trunc(txt, 6000)}${campos.length ? `\nCAMPOS PREENCHIDOS:\n${campos.join("\n")}` : ""}`;
}
function coPrompt(a, s) {
  const ef = CO_ESF[coData().esforco] || CO_ESF.medio;
  return `Você é ${coPersona(a)}
Você acompanha a pessoa no desenvolvimento da atividade “${a.nome}”${a.por ? ` (${a.por})` : ""}. Seu papel: acompanhar de perto, dar sugestões e feedback honesto, propor correções, melhorias e caminhos melhores, e dar todo o suporte para que ela desenvolva a atividade da melhor forma. Seja específico: cite o que ela fez, diga o que mudar e por quê.
NÍVEL DE ESFORÇO: ${ef.nome} — ${ef.txt}.
${s.contexto ? `O QUE A PESSOA COMPARTILHOU (contexto guardado):\n${trunc(s.contexto, 3000)}\n` : ""}${s.notas.length ? `NOTAS DE PROGRESSO (mais recentes primeiro):\n${s.notas.slice(-12).reverse().map(n => `- ${n.data}: ${n.txt}`).join("\n")}\n` : ""}${s.n ? `COMEÇOS REGISTRADOS NA INSPIRAÇÃO: ${s.n}, o último em ${s.ultima}.\n` : ""}${a.desafios?.length ? `DESAFIOS SUGERIDOS PARA A ATIVIDADE: ${a.desafios.join(" | ")}\n` : ""}HOJE: ${fmtDL(TODAY)}, ${new Date().toTimeString().slice(0, 5)}.
FERRAMENTAS: ler_dados lê qualquer parte do Atlas no detalhe (rotina, estudo, diário, saúde…); ver_aba resume uma aba; anotar_progresso guarda uma nota curta no histórico desta atividade (use quando houver um avanço, uma decisão ou um combinado). Não narre as consultas.
Responda em português do Brasil, em markdown simples. Não invente dados nem citações; quando não souber, diga.`;
}
function coTools(live) {
  const note = (t, d) => { live.uso.push({ t, d }); coPaintLive(); };
  return [
    { name: "anotar_progresso", description: "Guarda uma nota curta (até 200 caracteres) no histórico desta atividade: um avanço, uma decisão ou um combinado. Aparece nas próximas conversas.", inputSchema: { type: "object", properties: { nota: { type: "string" } }, required: ["nota"] },
      execute: inp => { const t = String(inp?.nota || "").trim().slice(0, 200); if (!t) return { erro: "nota vazia" }; coSt(live.a.id).notas.push({ data: TODAY, txt: t }); live.notou = true; note("Nota", t); return { ok: true }; } },
    { name: "ver_aba", description: "Lê o estado atual de uma aba do Atlas em texto. Abas: agora, tarefas, rotina, lembretes, saude, financas, carreira, aprendizado, relacoes, lazer, proposito, casa, jornada.", inputSchema: { type: "object", properties: { aba: { type: "string" } }, required: ["aba"] },
      execute: inp => { note("ver_aba", String(inp?.aba)); return secAbaFacts(String(inp?.aba), live.ctx); } },
  ];
}
async function coEnviar(texto, extra = "") {
  const a = coAtv(); if (!a) return; texto = String(texto || "").trim(); if (!texto) return;
  if (CO.live) { toast("Espere a resposta terminar ou toque em Parar."); return; }
  if (!SAMPLE || AI_OFF) { toast(`A IA não está disponível nesta visualização${AI_OFF ? ` (${AI_OFF})` : ""}.`); return; }
  const s = coSt(a.id), D = coData(), tela = extra || (D.tela ? coTela() : ""), img = CO.img && CO.lim?.images ? CO.img : null;
  const user = { role: "user", content: texto, at: Date.now(), ...(tela ? { tela: true } : {}), ...(img ? { img: true } : {}) };
  const live = CO.live = { a, user, text: "", uso: [], ctl: new AbortController() }; CO.img = null; coPaint();
  const hist = s.conversa.slice(-12).map(x => ({ role: x.role, content: x.content }));
  const ultimo = `${texto}${tela ? `\n\n[O QUE ESTÁ NA TELA AGORA]\n${tela}` : ""}${img ? "\n\n[IMAGEM ANEXADA: a tela da pessoa, capturada ou em print. Leia o que estiver nela e use na resposta.]" : ""}`;
  try {
    const r = await aiCall(`Acompanhamento: ${a.nome}`, ctx => { live.ctx = ctx; return [{ role: "user", content: coPrompt(a, s) }, { role: "assistant", content: "Entendido. Estou acompanhando." }, ...hist, { role: "user", content: ultimo }]; },
      { dados: true, signal: live.ctl.signal, modelTier: (CO_ESF[D.esforco] || CO_ESF.medio).tier, cache: false, ...(TOOLS_MAX ? { tools: coTools(live) } : {}), ...(img ? { images: [img] } : {}), onText: ({ text: t }) => { live.text = t; coPaintLive(); } });
    coFim(r.text, r.truncated);
  } catch (e) { if (e?.text) coFim(e.text, true); else { CO.live = null; coPaint(); } if (e?.code !== "cancelled") aiError(e); }
}
function coFim(text, cut) {
  const L = CO.live; if (!L) return; const s = coSt(L.a.id);
  s.conversa.push(L.user, { role: "assistant", content: (String(text || "").trim() || "(sem texto)") + (cut ? "\n\n_(resposta interrompida)_" : ""), at: Date.now(), uso: L.uso });
  if (s.conversa.length > 60) s.conversa = s.conversa.slice(-60);
  CO.live = null; touch("inspira", { noUndo: true, noRender: true }); coPaint();
}
/* avaliar uma aba: abre a aba, espera desenhar e manda o que está nela */
function coAvaliar(hash) {
  const [p, s] = String(hash || "").split("."); if (!p) return;
  if (p !== PAGE || (s || "") !== (SUB || "")) setHash(p, s);
  setTimeout(() => coEnviar(`Avalie o que estou fazendo na aba ${pageTitle(p)}${s ? " › " + s : ""}, pensando na atividade. O que está bom, o que corrigir e qual o próximo passo?`, coTela()), 450);
}
async function coCapturar() {
  try { const st = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }), v = document.createElement("video"); v.srcObject = st; v.muted = true; await v.play(); await new Promise(r => setTimeout(r, 350));
    const c = document.createElement("canvas"), k = Math.min(1, 1600 / (v.videoWidth || 1600)); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); st.getTracks().forEach(t => t.stop());
    CO.img = await new Promise(r => c.toBlob(r, "image/jpeg", .85)); toast("Tela capturada: vai junto com a próxima mensagem."); }
  catch { toast("Este navegador ou esta visualização não deixa capturar a tela. Tire um print e use “Anexar imagem”."); }
  coPaint();
}
/* ---------------------------------------------------------------- janela e botão lateral */
const CO_PEDIDOS = ["Estou começando agora: o que faço primeiro?", "Avalie o que fiz até aqui", "Monte um plano de 4 semanas", "Quero um desafio para hoje"];
function coHTML() {
  const a = coAtv(); if (!a) return ""; const s = coSt(a.id), D = coData(), L = CO.live, ai = !!SAMPLE && !AI_OFF, img = !!CO.lim?.images;
  const msgs = s.conversa.slice(-30).map(x => x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content)}${x.tela || x.img ? `<small class="cotag">${x.tela ? "com a tela" : ""}${x.tela && x.img ? " e " : ""}${x.img ? "com imagem" : ""}</small>` : ""}</div></div>` : `<div class="msg ai"><div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}</div></div>`).join("");
  const live = L ? `<div class="msg me"><div class="bub">${esc(L.user.content)}</div></div><div class="msg ai" id="colive"><div class="bub"><div class="lb-text mdx">${L.text ? md(L.text) : `<div class="thinking">${ic("spark")}Pensando…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div></div></div>` : "";
  const abas = NAV.flatMap(g => g[1]).map(([k, l]) => [k, l]);
  return `<header class="sech co-h" data-codrag="1" style="--c:${a.cor}"><span class="secav co-av">${ic(a.ico)}</span><div class="sect"><b>${esc(a.nome)}</b><small>Acompanhamento · Claude, esforço ${esc((CO_ESF[D.esforco] || CO_ESF.medio).nome)}${ai ? "" : " · IA indisponível aqui"}</small></div>
      <a class="iconbtn" href="#inspira" aria-label="Trocar de atividade" title="Trocar de atividade">${ic("refresh")}</a><button type="button" class="iconbtn" data-act="cooff" aria-label="Desativar o acompanhamento" title="Desativar">${ic("stop")}</button><button type="button" class="iconbtn" data-act="coclose" aria-label="Fechar a janela">${ic("x")}</button></header>
    <div class="cobar"><label>Esforço<select id="co_esf" aria-label="Nível de esforço">${Object.entries(CO_ESF).map(([k, e]) => `<option value="${k}"${D.esforco === k ? " selected" : ""}>${e.nome}</option>`).join("")}</select></label>
      <label class="chk"><input type="checkbox" id="co_tela"${D.tela ? " checked" : ""}><span>Compartilhar a tela</span></label></div>
    <details class="coxtra"${CO.xtra ? " open" : ""}><summary>${ic("plus")}Compartilhar e avaliar</summary>
      <label class="small">O que você quer que eu saiba (fica guardado nesta atividade)<textarea id="co_ctx" rows="3" placeholder="Objetivo, nível, material que está usando, o que já tentou…">${esc(s.contexto)}</textarea></label>
      <div class="row wrap"><select id="co_aba" aria-label="Aba para avaliar">${abas.map(([k, l]) => `<option value="${k}"${k === PAGE ? " selected" : ""}>${esc(l)}</option>`).join("")}</select><button type="button" class="btn sm" data-act="coaval">${ic("eye")}Avaliar esta aba</button></div>
      ${img ? `<div class="row wrap"><button type="button" class="btn sm ghost" data-act="cocap">${ic("expand")}Capturar a tela</button><label class="btn sm ghost">${ic("upload")}Anexar imagem<input type="file" id="co_file" accept="image/*" hidden></label>${CO.img ? `<span class="pill good">imagem pronta</span><button type="button" class="lnk" data-act="coimgx">tirar</button>` : ""}</div>` : `<small class="muted">Imagens não estão disponíveis nesta visualização; com “Compartilhar a tela”, vai o texto da aba.</small>`}
      ${s.notas.length ? `<div class="secsec">Progresso<small>${s.notas.length}</small></div><ul class="conotas">${s.notas.slice(-6).reverse().map(n => `<li><small>${fmtDY(n.data)}</small> ${esc(n.txt)}</li>`).join("")}</ul>` : ""}</details>
    <div class="secbody" id="cobody"><div class="secchat" id="cochat">${msgs || `<div class="secempty">${ic(a.ico)}Estou com você em <b>${esc(a.nome)}</b>. Conte o que está fazendo, peça um plano ou um desafio, ou ligue “Compartilhar a tela” para eu ver a aba aberta.</div>`}${live}</div>
      ${!s.conversa.length && !L ? `<div class="secquick">${CO_PEDIDOS.map(q => `<button type="button" class="qchip" data-coq="${esc(q)}"${ai ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>` : ""}</div>
    <footer class="secf"><textarea id="co_in" rows="1" placeholder="Fale com o acompanhamento${D.tela ? " (a tela vai junto)" : ""}" aria-label="Mensagem para o acompanhamento">${esc(CO.input || "")}</textarea>${L ? `<button type="button" class="btn sm" data-act="costop">${ic("stop")}Parar</button>` : `<button type="button" class="btn sm primary" data-act="cosend" aria-label="Enviar"${ai ? "" : " disabled"}>${ic("send")}</button>`}</footer><i class="secgrip" aria-hidden="true"></i>`;
}
function coFab() {
  const f = $("#cofab"); if (!f) return; const a = LOADED ? coAtv() : null;
  f.hidden = !a || CO.open; document.body.classList.toggle("co-on", !!a);
  if (a) { f.style.setProperty("--c", a.cor); f.innerHTML = `${ic(a.ico)}<span>${esc(trunc(a.nome, 22))}</span>`; f.setAttribute("aria-label", `Abrir o acompanhamento de ${a.nome}`); }
}
function coPaint() {
  const w = $("#co"); if (!w) return; coFab(); const a = coAtv(); w.hidden = !CO.open || !a; if (w.hidden) return;
  const ae = document.activeElement, keep = ae?.id === "co_in", ctxF = ae?.id === "co_ctx", pos = ae?.selectionStart; CO.xtra = !!$("#co .coxtra")?.open || CO.xtra;
  w.innerHTML = coHTML();
  if (keep) { const t = $("#co_in"); t?.focus({ preventScroll: true }); t?.setSelectionRange(t.value.length, t.value.length); }
  if (ctxF) { const t = $("#co_ctx"); t?.focus({ preventScroll: true }); if (pos != null) t?.setSelectionRange(pos, pos); }
  const b = $("#cobody"); if (b) b.scrollTop = b.scrollHeight;
}
function coPaintLive() { const el = $("#colive"), L = CO.live; if (!el || !L) { coPaint(); return; } $(".lb-text", el).innerHTML = L.text ? md(L.text) : `<div class="thinking">${ic("spark")}Pensando…</div>`; $(".lb-uso", el).innerHTML = usoHTML(L.uso); const b = $("#cobody"); if (b) b.scrollTop = b.scrollHeight; }
/* no computador, a janela fica ao lado da do Secretário quando as duas estão abertas; no celular, uma de cada vez */
function coPlace() {
  const w = $("#co"); if (!w) return; if (innerWidth <= 640) { w.style.cssText = ""; return; }
  const W = Math.min(390, innerWidth - 16), H = Math.min(600, innerHeight - 16), dx = SEC.open && $("#sec") && !$("#sec").hidden ? ($("#sec").getBoundingClientRect().width || 390) + 16 : 0;
  Object.assign(w.style, { width: W + "px", height: H + "px", top: Math.max(8, innerHeight - H - 20) + "px", left: Math.max(8, innerWidth - W - 20 - dx) + "px" });
}
/* a posição só é calculada ao abrir e quando a tela muda de tamanho: redesenhar não desfaz o tamanho que a pessoa ajustou */
const coLimites = () => { if (!CO.lim && SAMPLE?.limits) SAMPLE.limits().then(l => { CO.lim = l || {}; coPaint(); }, () => { CO.lim = {}; }); };
function coToggle(on = !CO.open) { CO.open = on && !!coAtv(); if (CO.open && innerWidth <= 640 && SEC.open) secToggle(false); coPaint(); if (CO.open) { coPlace(); coLimites(); setTimeout(() => $("#co_in")?.focus({ preventScroll: true }), 30); } }
function coAtivar(id) { const D = coData(); D.ativo = id; coSt(id); touch("inspira", { label: "Acompanhamento ativado", noRender: true }); if (innerWidth <= 640 && SEC.open) secToggle(false); CO.open = true; render(); coPaint(); coPlace(); coLimites(); }
function coClick(t) {
  const ds = t.dataset, a = ds.act;
  if (a === "coon") { coAtivar(ds.a); return true; }
  if (t.id === "cofab" || t.closest?.("#cofab")) { coToggle(true); return true; }
  if (a === "coclose") { coToggle(false); return true; }
  if (a === "cooff") { const n = coAtv()?.nome; coData().ativo = ""; CO.open = false; touch("inspira", { label: "Acompanhamento desativado" }); coPaint(); undoToast(`Acompanhamento de ${n} desativado. A conversa fica guardada.`); return true; }
  if (a === "cosend") { const v = $("#co_in")?.value || ""; CO.input = ""; coEnviar(v); return true; }
  if (a === "costop") { CO.live?.ctl.abort(); return true; }
  if (ds.coq) { coEnviar(ds.coq); return true; }
  if (a === "coaval") { coAvaliar($("#co_aba")?.value); return true; }
  if (a === "cocap") { coCapturar(); return true; }
  if (a === "coimgx") { CO.img = null; coPaint(); return true; }
  return false;
}
function coChange(t) {
  if (t.id === "co_esf") { coData().esforco = t.value; touch("inspira", { noUndo: true, noRender: true }); coPaint(); return true; }
  if (t.id === "co_tela") { coData().tela = t.checked; touch("inspira", { noUndo: true, noRender: true }); coPaint(); return true; }
  if (t.id === "co_ctx") { const a = coAtv(); if (a) { coSt(a.id).contexto = t.value.slice(0, 4000); touch("inspira", { label: "Contexto do acompanhamento", noRender: true }); toast("Guardado: o acompanhamento vai levar isso em conta."); } return true; }
  if (t.id === "co_file") { const f = t.files?.[0]; if (f) { CO.img = f; toast("Imagem pronta: vai junto com a próxima mensagem."); coPaint(); } return true; }
  return false;
}
function coInput(t) { if (t.id !== "co_in") return false; CO.input = t.value; return true; }
function coKey(e) { if (e.target?.id === "co_in" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const v = e.target.value; CO.input = ""; e.target.value = ""; coEnviar(v); return true; } return false; }
function coInit() {
  document.body.insertAdjacentHTML("beforeend", `<button type="button" id="cofab" class="cofab" hidden></button><div id="co" class="secw cow" role="dialog" aria-label="Acompanhamento da atividade" hidden></div>`);
  addEventListener("resize", () => { if (CO.open) coPlace(); });
  document.addEventListener("keydown", e => { if (!e.isComposing) coKey(e); });
  coFab();
}
