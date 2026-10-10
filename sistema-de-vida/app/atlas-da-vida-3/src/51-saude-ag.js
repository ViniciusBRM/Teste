/* ================================================================ Saúde: o que o Nutri e o Personal têm em comum
   Os dois agentes leem os dados da Saúde a cada mensagem e só PROPÕEM mudanças (refeições, metas, objetivo, plano alimentar,
   fichas, treinos, corridas, plano de corrida). Nada muda sem você aprovar: um clique, “ok”, “aprova 1 e 3” ou “não”.
   O foco e o compromisso (baixo, médio, alto) mudam o tom e a exigência; os limites de saúde não mudam: quem os impõe é a
   validação de cada proposta (52-nutri.js e 53-treino.js), não só o texto do prompt. */
const SD_COMP = {
  baixo: ["Baixo", "mudanças pequenas e sustentáveis, poucas metas por vez, acompanhar só o essencial"],
  medio: ["Médio", "estrutura semanal com metas claras, registro na maior parte dos dias e revisão a cada duas semanas"],
  alto: ["Alto", "rigor e acompanhamento próximo, revisão semanal, sempre dentro dos limites de saúde"] };
/* cada agente registra aqui: tipos de proposta {tipo: [rótulo, ícone]}, valida(tipo, dados) → {erro} ou {dados},
   aplica(tipo, dados) → [referência, chaves do estado], resumo(proposta) → html do cartão */
const SD_AG = {};
const SD_ACTS = {};
const sdLS = (k, v) => { try { if (v === undefined) return localStorage.getItem("atlas_sd_" + k); localStorage.setItem("atlas_sd_" + k, v); } catch { return null; } };
const sdChatOn = mid => { const v = sdLS("chat_" + mid); return v != null ? v !== "0" : innerWidth > 1180; };
function sdValida(mid, tipo, d) {
  const A = SD_AG[mid]; if (!A?.pt[tipo]) return { erro: `tipo de proposta desconhecido: ${tipo}` };
  try { return A.valida(tipo, d || {}); } catch (e) { return { erro: String(e?.message || e) }; }
}
/* cria a proposta no chat (inválida fica registrada como descartada, com o motivo) e responde ao agente */
function sdProposta(mid, live, tipo, raw) {
  const v = sdValida(mid, tipo, raw), n = live.acoes.filter(x => x.sd).length + 1;
  live.acoes.push({ id: uid(), sd: true, mid, tipo, raw: raw || {}, status: v.erro ? "descartada" : "pendente", erro: v.erro || "", n });
  return v.erro ? { erro: v.erro, dica: "a proposta não passou na validação; corrija e proponha de novo, ou explique à pessoa" } : { ok: true, status: "aguardando aprovação da pessoa", proposta: n };
}
function sdDecide(mid, p, ok, quiet) {
  if (!p || p.status !== "pendente") return false; const ag = p.mid || mid;
  if (!ok) { p.status = "descartada"; if (!quiet) touch("mentores", { label: "Proposta descartada" }); return true; }
  const v = sdValida(ag, p.tipo, p.raw); if (v.erro) { p.status = "descartada"; p.erro = v.erro; if (!quiet) { touch("mentores", { noUndo: true }); toast("Não deu para aplicar: " + v.erro); } return false; }
  const [ref, keys] = SD_AG[ag].aplica(p.tipo, v.dados) || []; if (!ref) { p.status = "descartada"; p.erro = "não deu para aplicar"; if (!quiet) touch("mentores", { noUndo: true }); return false; }
  p.status = "aceita"; p.ref = ref; if (!quiet) { touch(...keys, "mentores", { label: `${SD_AG[ag].pt[p.tipo][0]}: ${ref}` }); undoToast(`${SD_AG[ag].pt[p.tipo][0]}: ${ref}`); } return keys;
}
function sdDecideMany(mid, ps, ok) {
  const keys = new Set(["mentores"]), refs = []; let n = 0;
  for (const p of ps) { const k = sdDecide(mid, p, ok, true); if (k) { n++; if (Array.isArray(k)) k.forEach(x => keys.add(x)); if (p.ref) refs.push(p.ref); } }
  touch(...keys, { label: ok ? `Aprovadas ${n} propostas do ${MENTOR_DEF[mid].nome}` : "Propostas descartadas" }); return { n, refs, falhas: ps.filter(p => p.erro).map(p => p.erro) };
}
const sdPendentes = mid => { const out = []; (mget(mid).conversa || []).forEach((m, mi) => (m.acoes || []).forEach(p => { if (p.sd && p.status === "pendente") out.push({ p, mi }); })); return out; };
/* “ok”, “aprova”, “vai” · “aprova 1 e 3” · “descarta” / “não”: decide sem chamar a IA, só sobre as propostas pendentes da resposta
   mais recente que tiver alguma. As de respostas anteriores ficam esperando “Aprovar todas” ou o botão de cada uma */
function sdIntercept(mid, text) {
  const t = String(text || "").trim(), pend = sdPendentes(mid); if (!pend.length) return false;
  const sim = CK_SIM.test(t), nao = CK_NAO.test(t), rest = t.replace(CK_SIM, "").replace(CK_NAO, "").trim(); if (!sim && !nao) return false;
  const toks = rest.split(/[\s,.;:!]+/).filter(Boolean), okTok = /^(\d+|e|tudo|todas?|todos|as|os|s[oó]|apenas|pode|isso|ent[aã]o|por|favor|obrigad[oa]|valeu|essas?|esses?)$/i; if (toks.some(x => !okTok.test(x))) return false;
  const nums = toks.filter(x => /^\d+$/.test(x)).map(Number), lastMi = Math.max(...pend.map(x => x.mi)), alvo = pend.filter(x => x.mi === lastMi && (!nums.length || nums.includes(x.p.n))), resto = pend.length - alvo.length; if (!alvo.length) return false;
  const r = sdDecideMany(mid, alvo.map(x => x.p), sim), m = mstate(mid);
  m.conversa.push({ role: "user", content: t, at: Date.now(), mode: "chat" }, { role: "assistant", content: (sim ? `Aprovado${r.n !== 1 ? "s" : ""}: ${r.refs.join(", ") || "nada a aplicar"}.${r.falhas.length ? ` Não apliquei: ${r.falhas.join("; ")}.` : ""}` : `Descartei ${plural(alvo.length, "proposta", "propostas")}.`) + (resto ? ` ${resto === 1 ? "Uma proposta anterior continua" : `${resto} propostas anteriores continuam`} esperando.` : ""), at: Date.now(), local: true });
  MST.input[mid] = ""; touch("mentores", { noUndo: true }); scrollChat(); return true;
}
/* sem ferramentas, as propostas vêm no bloco atlas: {"acoes":[{"tipo":"…","dados":{…}}]} */
function sdParseBlock(mid, b, live) { for (const a of b.acoes || []) if (a && SD_AG[mid]?.pt[a.tipo]) sdProposta(mid, live, a.tipo, a.dados); }
function sdPropHTML(mid, mi, p) {
  const A = SD_AG[p.mid || mid], [lab, ico] = A?.pt[p.tipo] || ["Proposta", "plus"];
  let body = ""; try { body = A.resumo(p); } catch (e) { body = `<p class="muted small">${esc(String(e.message || e))}</p>`; }
  return `<div class="prop sdprop ${p.status}"><div class="prop-t">${ic(ico)}<div><span class="prop-k">${p.n ? `#${p.n} · ` : ""}${esc(lab)}</span>${body}${p.erro ? `<p class="st-crit small">${esc(p.erro)}</p>` : ""}</div></div>
    <div class="prop-a">${p.status === "pendente" ? (mi >= 0 ? `<button type="button" class="btn sm primary" data-prop="${mid}|${mi}|${p.id}|ok">${ic("check")}Aprovar</button><button type="button" class="btn sm ghost" data-prop="${mid}|${mi}|${p.id}|no">Descartar</button>` : `<span class="muted">aguarde a resposta terminar</span>`) : p.status === "aceita" ? `<span class="pill good">Aprovada${p.ref ? ` · ${esc(p.ref)}` : ""}</span>` : `<span class="pill none">Descartada</span>`}</div></div>`;
}

/* ---------------------------------------------------------------- painel de conversa (o mesmo para os dois agentes) */
function sdChat(mid, o = {}) {
  const def = MENTOR_DEF[mid], m = mget(mid), L = MST.live?.mid === mid ? MST.live : null, ai = !!SAMPLE && !AI_OFF, blk = blockedMentor(mid), on = ai && !MST.live && !blk, pend = sdPendentes(mid);
  SD_ACTS[mid] = o.acts || [];
  let lastDay = "";
  const msgs = (m.conversa || []).map((x, i) => { const d = iso(new Date(x.at)), sep = d !== lastDay ? `<div class="daysep"><span>${relDay(d) === "hoje" ? "Hoje" : fmtDL(d)}</span></div>` : ""; lastDay = d;
    return sep + (x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content).replace(/\n/g, "<br>")}</div></div>` : `<div class="msg ai">${mavatar(mid, "sm")}<div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}${(x.acoes || []).map(p => propHTML(mid, i, p)).join("")}</div></div>`); }).join("");
  const live = L ? `${L.user ? `<div class="msg me"><div class="bub">${esc(L.user.content).replace(/\n/g, "<br>")}</div></div>` : ""}<div class="msg ai" id="livebubble">${mavatar(mid, "sm")}<div class="bub"><div class="lb-text mdx">${L.text ? md(liveText(L.text)) : `<div class="thinking">${ic("spark")}Lendo os seus dados…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div><div class="lb-acoes">${L.acoes.map(p => propHTML(mid, -1, p)).join("")}</div></div></div>` : "";
  const intro = !m.conversa?.length && !L ? `<div class="mintro jintro">${mavatar(mid, "lg")}<h3>${esc(def.nome)}</h3><p>${esc(def.arq[0].toUpperCase() + def.arq.slice(1))}.</p><p class="muted">${esc(o.intro || "")}</p></div>` : "";
  const mems = [...(m.mem || [])].sort((a, b) => (b.fixo - a.fixo) || b.at - a.at);
  return `<section class="pn jment sdchat" data-mid="${mid}" id="jment" style="--c:${mcol(mid)}">
    <header class="jmh">${mavatar(mid)}<div><h2>${esc(def.nome)}</h2><small>${esc(o.sub || "propõe; você aprova")}</small></div><button type="button" class="iconbtn" data-act="sdchat" data-mid="${mid}" aria-label="Fechar o painel de ${esc(def.nome)}">${ic("x")}</button></header>
    ${blk ? `<div class="banner warn">${ic("lock")}<span>${esc(def.gate)} está fora da IA em Privacidade. Libere o setor para conversar com ${esc(def.nome)}.</span></div>` : aiBanner()}
    ${pend.length ? `<div class="ckpend">${ic("flag")}<span>${plural(pend.length, "proposta aguardando", "propostas aguardando")} você</span><button type="button" class="btn sm primary" data-act="sdapall" data-mid="${mid}">${ic("check")}Aprovar todas</button><button type="button" class="btn sm ghost" data-act="sdnoall" data-mid="${mid}">Descartar</button></div>` : ""}
    <div class="mchat" id="mchat" aria-live="polite">${intro}${msgs}${live}</div>
    <div class="mquick">${(o.quick || []).map(q => `<button type="button" class="qchip" data-mq="${esc(q)}"${on ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>
    <div class="minput"><textarea id="m_in" rows="2" placeholder="${ai ? `Escreva para o ${esc(def.nome)}… (Enter envia; “ok” aprova as propostas)` : "A IA não está disponível nesta visualização"}"${ai && !blk ? "" : " disabled"} aria-label="Mensagem para o ${esc(def.nome)}">${esc(MST.input[mid] || "")}</textarea>${MST.live ? `<button type="button" class="btn" data-act="mstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn primary" data-act="msend"${on ? "" : " disabled"}>${ic("send")}Enviar</button>`}</div>
    <div class="row wrap jmacts">${SD_ACTS[mid].map(([l, i], k) => `<button type="button" class="btn sm" data-act="sdask" data-mid="${mid}" data-k="${k}"${on ? "" : " disabled"}>${ic(i)}${esc(l)}</button>`).join("")}${m.conversa?.length ? `<button type="button" class="btn sm ghost" data-act="mclear">${ic("trash")}Limpar conversa</button>` : ""}</div>
    <details class="jmem"><summary>${ic("memory")}O que o ${esc(def.nome)} guarda <small>${mems.length}</small></summary>
      <div class="mems">${mems.slice(0, 12).map(x => `<div class="mem${x.fixo ? " fixo" : ""}"><span class="mtag t-${slug(x.tipo)}">${esc(x.tipo)}</span><p>${esc(x.texto)}</p><div class="mmeta"><span>${fmtD(iso(new Date(x.at)))}${x.origem && x.origem !== "mentor" ? " · " + esc(x.origem) : ""}</span><button type="button" class="vb" data-mpin="${mid}|${x.id}" aria-label="${x.fixo ? "Desafixar" : "Fixar"}">${ic("pin")}</button><button type="button" class="vb" data-mdel="${mid}|${x.id}" aria-label="Esquecer">${ic("trash")}</button></div></div>`).join("") || `<div class="empty">Nada guardado ainda.</div>`}</div></details>
    ${o.priv ? `<p class="muted small jpriv">${ic("shield")}${esc(o.priv)}</p>` : ""}</section>`;
}
/* a página com o painel ao lado (ou embaixo, no celular) e o botão que abre e fecha o painel */
function sdAgBtn(mid, ico) {
  const on = sdChatOn(mid), n = sdPendentes(mid).length;
  return `<button type="button" class="btn sm ckpmo${on ? " on" : ""}" data-act="sdchat" data-mid="${mid}" aria-pressed="${on}">${ic(ico)}${esc(MENTOR_DEF[mid].nome)}${n ? `<em class="nb acc">${n}</em>` : ""}</button>`;
}
function sdWrap(mid, main, o) {
  const on = sdChatOn(mid); document.body.classList.toggle("sdside-on", on);
  return `<div class="sdwrap${on ? "" : " nochat"}"><div class="sdmain">${main}</div>${on ? `<aside class="sdside" aria-label="${esc(MENTOR_DEF[mid].nome)}">${sdChat(mid, o)}</aside>` : ""}</div>`;
}
function sdClick(t) {
  const ds = t.dataset, a = ds.act, mid = ds.mid;
  if (a === "sdchat" && mid) { sdLS("chat_" + mid, sdChatOn(mid) ? "0" : "1"); render(); if (sdChatOn(mid)) setTimeout(() => $("#m_in")?.focus(), 60); return true; }
  if ((a === "sdapall" || a === "sdnoall") && mid) { const r = sdDecideMany(mid, sdPendentes(mid).map(x => x.p), a === "sdapall"); if (a === "sdapall") toast(`${plural(r.n, "proposta aprovada", "propostas aprovadas")}${r.falhas.length ? ` · ${r.falhas.length} não aplicada(s)` : ""}`); return true; }
  if (a === "sdask" && mid) { const x = SD_ACTS[mid]?.[+ds.k]; if (x) askMentor(mid, x[2], "check"); return true; }
  return false;
}
/* valores e datas que chegam do agente */
const sdNum = (v, lo, hi) => { const n = typeof v === "string" ? +v.replace(",", ".") : +v; return v === "" || v == null || !isFinite(n) ? null : n < lo || n > hi ? NaN : n; };
const sdData = (v, def = TODAY) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) ? String(v) : v ? null : def;
