/* ================================================================ Cockpit de Trabalho: telas de tarefas, equipe e contexto
   O chat do PMO fica num painel lateral (em telas estreitas, acima das visões); as visões ficam no centro. Tudo o que a pessoa faz aqui
   grava direto (é a ação dela); tudo o que o PMO quer mudar vira proposta no chat. */
const CK_CORES = ["var(--a-car)", "var(--a-apr)", "var(--a-fam)", "var(--a-men)", "var(--a-amo)", "var(--a-laz)", "var(--a-pro)", "var(--a-cas)"];
const ckCor = id => ckP(id)?.cor || "var(--muted)";
const ckIni = id => { const m = ckM(id); if (!m) return "?"; if (m.eu) return "Eu"; return m.nome.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase(); };
const ckAv = id => `<span class="ckav" title="${esc(ckMN(id))}">${esc(ckIni(id))}</span>`;
const ckPrazo = (t, lbl = true) => { if (!t.prazo) return `<span class="muted">sem prazo</span>`; const late = ckOpen(t) && t.prazo < TODAY, today = t.prazo === TODAY; return `<span class="${late ? "st-crit" : today ? "st-warn" : ""}">${lbl ? ic("clock") : ""}${late ? `venceu ${fmtD(t.prazo)}` : relDay(t.prazo) === "hoje" ? "hoje" : relDay(t.prazo) === "amanhã" ? "amanhã" : fmtD(t.prazo)}</span>`; };
const ckQpill = t => { const p = ckPrio(t), [l, st] = CK_Q[p.q] || ["", "none"]; return p.q ? `<span class="pill ${st} ckq">${esc(l)}</span>` : ""; };
function ckCard(t, o = {}) {
  const C = ckC(t.id), p = ckPrio(t);
  return `<article class="ckcard${t.status === "bloqueada" ? " blk" : ""}${!ckOpen(t) ? " done" : ""}" style="--pc:${ckCor(t.projeto)}" data-cktask="${t.id}" tabindex="0" role="button"${o.drag ? ' draggable="true"' : ""} aria-label="${esc(`${t.cod} ${t.titulo}`)}">
    <header><span class="ckcod">${esc(t.cod)}</span>${C?.crit ? `<span class="pill warn" title="Caminho crítico: folga ${C.folga}">${ic("flag")}crítica</span>` : ""}${C?.atraso ? `<span class="pill crit">${ic("clock")}atraso previsto</span>` : ""}${o.q !== false ? ckQpill(t) : ""}</header>
    <b>${esc(t.titulo)}</b>
    <div class="ckmeta">${ckAv(t.resp)}<span class="ckpj">${esc(trunc(ckPN(t.projeto), 22))}</span>${ckPrazo(t)}${t.esforco ? `<span>${num(+t.esforco, 0)} h</span>` : ""}${t.feito && ckOpen(t) ? `<span>${t.feito}%</span>` : ""}</div>
    ${(t.tags || []).length ? `<div class="cktags">${t.tags.map(x => `<span class="chip xs">${esc(x)}</span>`).join("")}</div>` : ""}
    ${o.why && p.r.length ? `<small class="ckwhy">${esc(p.r.slice(0, 3).join(" · "))}</small>` : ""}
    ${o.acts !== false && ckOpen(t) ? `<div class="ckacts"><button type="button" class="vb" data-ckdone="${t.id}" title="Concluir" aria-label="Concluir ${esc(t.cod)}">${ic("check")}</button>${o.mv ? `${CK_STATUS.indexOf(t.status) > 0 ? `<button type="button" class="vb" data-ckmv="${t.id}|-1" aria-label="Voltar status">${ic("back")}</button>` : ""}<button type="button" class="vb" data-ckmv="${t.id}|1" aria-label="Avançar status">${ic("arrow")}</button>` : ""}</div>` : ""}</article>`;
}
function ckFiltra(list) { const f = CK.f, q = norm(f.q); return list.filter(t => ckDrillHas("tar", t.id) && (!f.proj || t.projeto === f.proj) && (!f.resp || t.resp === f.resp) && (!f.tag || (t.tags || []).includes(f.tag)) && (!f.st || t.status === f.st) && (!q || norm(`${t.cod} ${t.titulo} ${t.notas}`).includes(q))); }
function ckFiltros(o = {}) {
  const f = CK.f, tags = [...new Set([...CK_AGENTE.tags, ...ckT().flatMap(t => t.tags || [])])];
  return `<div class="ckfil">${o.q !== false ? `<input type="search" id="ck_q" placeholder="Buscar tarefa ou código" value="${esc(f.q)}" aria-label="Buscar tarefa">` : ""}
    <select data-ckf="proj" aria-label="Projeto"><option value="">Todos os projetos</option>${ckD().projetos.map(p => `<option value="${p.id}"${f.proj === p.id ? " selected" : ""}>${esc(p.nome)}</option>`).join("")}</select>
    <select data-ckf="resp" aria-label="Responsável"><option value="">Toda a equipe</option>${ckEquipe().map(m => `<option value="${m.id}"${f.resp === m.id ? " selected" : ""}>${esc(ckMN(m.id))}</option>`).join("")}</select>
    <select data-ckf="tag" aria-label="Tag"><option value="">Todas as tags</option>${tags.map(t => `<option${f.tag === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>
    ${o.st ? `<select data-ckf="st" aria-label="Status"><option value="">Todos os status</option>${CK_STATUS.map(s => `<option${f.st === s ? " selected" : ""}>${s}</option>`).join("")}</select>` : ""}
    ${Object.values(f).some(Boolean) ? `<button type="button" class="lnk" data-act="ckfclear">Limpar filtros</button>` : ""}${o.extra || ""}</div>`;
}
const ckVazio = () => !ckT().length && ckD().projetos.length === 0 && ckD().membros.length <= 1;
function ckOnboard() {
  return panel(`${ic("gauge")}Comece aqui`, `<p>O Cockpit organiza tarefas, prazos, riscos, problemas e a equipe, com um PMO que lê tudo e propõe; você aprova.</p>
    <ol class="ckstep"><li><a href="#trabalho.contexto">Contexto</a>: seu perfil, a equipe (nível, foco, horas por semana) e os projetos com os marcos.</li><li>Registre as tarefas com <b>Alt+Shift+N</b> (ex.: <code>t: verificar drenaggio km 2 @Ana #Idraulica 8h sex [Variante]</code>) ou pelo botão <b>Nova tarefa</b>.</li><li>Peça ao PMO as 3 prioridades do dia, o caminho crítico e quem deve fazer o quê.</li></ol>
    <div class="row wrap"><a class="btn sm primary" href="#trabalho.contexto">${ic("users")}Preencher o contexto</a><button type="button" class="btn sm" data-act="cknova">${ic("plus")}Nova tarefa</button>${EX_MODE ? "" : `<button type="button" class="btn sm ghost" data-act="extog">${ic("eye")}Ver com o Exemplo</button>`}</div>`);
}

/* ---------------------------------------------------------------- moldura: barra, visões e o painel do PMO */
function pTrabalho() {
  ckD(); if (CK.drill && CK.drill.view !== SUB) { CK.drill = null; CK.drillSet = null; }
  if (CK.dash?.reuniao && SUB !== "dashboard") CK.dash.reuniao = false;
  if (SUB === "dashboard" && LOADED && CK.snapV !== VER) { CK.snapV = VER; setTimeout(() => { try { ckSnapTake(); } catch (e) { console.warn("ckSnap", e); } }, 0); }
  document.body.classList.toggle("ckdmeet-on", !!CK.dash?.reuniao);
  if (CK.f.proj && !ckP(CK.f.proj)) CK.f.proj = ""; if (CK.f.resp && !ckM(CK.f.resp)) CK.f.resp = ""; if (CK.gproj && !ckP(CK.gproj)) CK.gproj = "";
  const V = { dashboard: ckDashV, hoje: ckHoje, semana: ckSemana, mes: ckMesV, kanban: ckKanban, lista: ckLista, gantt: ckGanttV, riscos: ckRiscosV, problemas: ckProblemasV, equipe: ckEquipeV, pessoa: ckPessoaV, log: ckLogV, decisoes: ckDecisoesV, bim: ckBimV, entregas: ckEntregasV, reunioes: ckReunioesV, relatorios: ckRelatoriosV, licoes: ckLicoesV, contexto: ckContextoV };
  const al = ckAlertas(), cr = al.filter(a => a.st === "crit").length, pend = ckPendentes().length;
  const bar = `<div class="ckbar"><button type="button" class="ckqbtn" data-act="ckquick">${ic("bolt")}<span>Registrar tarefa, risco, problema, decisão ou evento…</span><kbd>Alt Shift N</kbd></button>
    <button type="button" class="btn sm" data-act="cknova">${ic("plus")}Nova tarefa</button>
    ${cr ? `<a class="pill crit" href="#trabalho.hoje">${ic("flag")}${plural(cr, "alerta crítico", "alertas críticos")}</a>` : ""}
    <button type="button" class="btn sm ckpmo${CK.chat ? " on" : ""}" data-act="ckchat" aria-pressed="${CK.chat}">${ic("gauge")}PMO${pend ? `<em class="nb acc">${pend}</em>` : ""}</button></div>`;
  document.body.classList.toggle("ckside-on", CK.chat);
  return `${bar}<div class="ckwrap${CK.chat ? "" : " nochat"}"><div class="ckmain">${(V[SUB] || ckHoje)()}</div>${CK.chat ? `<aside class="ckside" aria-label="PMO">${ckChat()}</aside>` : ""}</div>`;
}
function ckChat() {
  const mid = "ck", def = MENTOR_DEF.ck, m = mget(mid), L = MST.live?.mid === mid ? MST.live : null, ai = !!SAMPLE && !AI_OFF, blk = blockedMentor(mid), on = ai && !MST.live && !blk, pend = ckPendentes();
  let lastDay = "";
  const msgs = (m.conversa || []).map((x, i) => { const d = iso(new Date(x.at)), sep = d !== lastDay ? `<div class="daysep"><span>${relDay(d) === "hoje" ? "Hoje" : fmtDL(d)}</span></div>` : ""; lastDay = d;
    return sep + (x.role === "user" ? `<div class="msg me"><div class="bub">${esc(x.content).replace(/\n/g, "<br>")}</div></div>` : `<div class="msg ai">${mavatar(mid, "sm")}<div class="bub"><div class="mdx">${md(x.content)}</div>${x.uso?.length ? `<div class="usos">${usoHTML(x.uso)}</div>` : ""}${(x.acoes || []).map(p => propHTML(mid, i, p)).join("")}</div></div>`); }).join("");
  const live = L ? `${L.user ? `<div class="msg me"><div class="bub">${esc(L.user.content).replace(/\n/g, "<br>")}</div></div>` : ""}<div class="msg ai" id="livebubble">${mavatar(mid, "sm")}<div class="bub"><div class="lb-text mdx">${L.text ? md(liveText(L.text)) : `<div class="thinking">${ic("spark")}Lendo o estado…</div>`}</div><div class="lb-uso usos">${usoHTML(L.uso)}</div><div class="lb-acoes">${L.acoes.map(p => propHTML(mid, -1, p)).join("")}</div></div></div>` : "";
  const intro = !m.conversa?.length && !L ? `<div class="mintro jintro">${mavatar(mid, "lg")}<h3>${esc(def.nome)}</h3><p>${esc(def.arq[0].toUpperCase() + def.arq.slice(1))}.</p><p class="muted">Lê tarefas, caminho crítico, riscos, problemas, diário de bordo, decisões, equipe e BIM a cada mensagem. Conversa em português e escreve os entregáveis em italiano. Tudo o que ele quiser mudar vira proposta: você aprova com um clique ou escrevendo “ok”.</p></div>` : "";
  return `<section class="pn jment ckchat" data-mid="ck" id="jment" style="--c:${mcol(mid)}">
    <header class="jmh">${mavatar(mid)}<div><h2>${esc(def.nome)}</h2><small>propõe; você aprova</small></div><button type="button" class="iconbtn" data-act="ckchat" aria-label="Fechar o painel do PMO">${ic("x")}</button></header>
    ${blk ? `<div class="banner warn">${ic("lock")}<span>Carreira está fora da IA em Privacidade. Libere o setor para conversar com o PMO.</span></div>` : aiBanner()}
    ${pend.length ? `<div class="ckpend">${ic("flag")}<span>${plural(pend.length, "proposta aguardando", "propostas aguardando")} você</span><button type="button" class="btn sm primary" data-act="ckapall">${ic("check")}Aprovar todas</button><button type="button" class="btn sm ghost" data-act="cknoall">Descartar</button></div>` : ""}
    <div class="mchat" id="mchat" aria-live="polite">${intro}${msgs}${live}</div>
    <div class="mquick">${CK_QUICK.map(q => `<button type="button" class="qchip" data-mq="${esc(q)}"${on ? "" : " disabled"}>${esc(q)}</button>`).join("")}</div>
    <div class="minput"><textarea id="m_in" rows="2" placeholder="${ai ? "Escreva para o PMO… (Enter envia; “ok” aprova as propostas)" : "A IA não está disponível nesta visualização"}"${ai && !blk ? "" : " disabled"} aria-label="Mensagem para o PMO">${esc(MST.input[mid] || "")}</textarea>${MST.live ? `<button type="button" class="btn" data-act="mstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn primary" data-act="msend"${on ? "" : " disabled"}>${ic("send")}Enviar</button>`}</div>
    <div class="row wrap jmacts"><button type="button" class="btn sm" data-act="ckask" data-v="briefing"${on ? "" : " disabled"}>${ic("sun")}Briefing</button><button type="button" class="btn sm" data-act="ckask" data-v="riscos"${on ? "" : " disabled"}>${ic("flag")}Varredura de riscos</button>${m.conversa?.length ? `<button type="button" class="btn sm ghost" data-act="mclear">${ic("trash")}Limpar conversa</button>` : ""}</div>
    <p class="muted small jpriv">${ic("shield")}A cada mensagem o PMO recebe o estado do Cockpit (com o seu contexto e a equipe) e as horas de reunião da agenda. Cada conversa aparece em Privacidade.</p></section>`;
}
const CK_ASK = {
  briefing: "Faça o briefing de hoje: 1) as 3 prioridades do dia, com o motivo de cada uma citando os códigos; 2) bloqueios; 3) prazos e marcos nos próximos 5 dias úteis; 4) quem da equipe precisa de apoio e por quê; 5) um bloco de foco sugerido. Se algo pedir mudança de dados, proponha.",
  riscos: "Faça uma varredura de riscos: cruze tarefas, caminho crítico, carga da equipe e o diário de bordo; liste os riscos que ainda não estão no Risk Register, com probabilidade, impacto, gatilho e mitigação, e proponha registrá-los. Aponte também riscos registrados que mudaram de nível.",
  weekly: "Faça a weekly review: o que foi concluído nesta semana, o que atrasou e por quê (com códigos e datas), e o plano da próxima semana por pessoa. Proponha as alterações de prazo ou de responsável que fizerem falta.",
  capacidade: "Minha agenda e as minhas tarefas estão acima da capacidade? Diga o que delegar (para quem, com o trade-off de tempo × aprendizado) e o que adiar, e proponha as alterações.",
  delegar: "Revise as tarefas abertas e recomende delegações conforme nível, carga e o objetivo de aprendizado de cada pessoa da equipe. Proponha as alterações de responsável." };
function ckAsk(txt) { CK.chat = true; CK_LS("chat", "1"); render(); askMentor("ck", txt); }

/* ---------------------------------------------------------------- Hoje */
function ckHoje() {
  if (ckVazio()) return ckOnboard();
  /* os números dos cartões vêm da camada de agregação (49-cockpit-agg.js), a mesma do Dashboard */
  const T = ckT(), K = ckKpisHoje(ckDados(), ckCtx()), eu = K.eu, meu = ckSorted(K.meu), al = ckAlertas(), venc = K.venc;
  const ate5 = K.ate5, prox = K.prox, blq = K.blq, cg = ckCarga(eu), cgs = ckEquipe().map(m => [m, ckCarga(m.id)]);
  const B = ckBriefData();
  return `${kpiRow([kmini("var(--a-car)", "Minhas tarefas abertas", String(meu.length), meu.filter(t => ckPrio(t).q === 1).length ? `${meu.filter(t => ckPrio(t).q === 1).length} para fazer já` : "nenhuma urgente e importante"),
      kmini("var(--crit)", "Vencidas", String(venc.length), venc.length ? venc.slice(0, 3).map(t => t.cod).join(", ") : "nenhuma", venc.length ? "crit" : "good"),
      kmini("var(--warn)", "Prazos em 5 dias úteis", String(prox.length), `até ${fmtD(ate5)}`),
      kmini("var(--a-apr)", `Minha carga · ${cg.n} d.u.`, pct(cg.load), `${num(cg.dem, 0)} h para ${num(cg.cap, 0)} h${cg.ag ? ` · ${num(cg.ag, 0)} h de agenda` : ""}`, cg.st === "crit" ? "crit" : cg.st === "warn" ? "warn" : "good"),
      kmini("var(--muted)", "Bloqueios", String(blq.length), blq.length ? blq.map(t => t.cod).join(", ") : "nenhum")])}
    <div class="g2c">
      ${panel(`${ic("sun")}Briefing de ${fmtDL(TODAY)}`, ckBriefHTML(B), { act: `<button type="button" class="btn sm ghost" data-act="ckask" data-v="briefing">${ic("spark")}Com o PMO</button>` })}
      ${panel(`${ic("flag")}Alertas <small>${al.length}</small>`, al.length ? `<ul class="ckal">${al.slice(0, 9).map(a => `<li class="${a.st}"><span class="pill ${a.st === "info" ? "none" : a.st}">${a.st === "crit" ? "crítico" : a.st === "warn" ? "atenção" : "info"}</span><span>${esc(a.txt)}</span>${a.go ? `<a class="lnk" href="#${a.go}">ver</a>` : ""}</li>`).join("")}</ul>${cg.st === "crit" ? `<button type="button" class="btn sm" data-act="ckask" data-v="capacidade">${ic("users")}O que delegar ou adiar?</button>` : ""}` : `<p class="muted">Nada fora do lugar agora.</p>`)}
      ${panel(`${ic("target")}Minhas prioridades`, meu.length ? `<div class="cklist">${meu.slice(0, 7).map(t => ckCard(t, { why: true })).join("")}</div>${meu.length > 7 ? `<a class="lnk" href="#trabalho.lista">mais ${meu.length - 7}</a>` : ""}` : `<p class="muted">Nada aberto com você.</p>`)}
      ${panel(`${ic("clock")}Blocos de foco sugeridos`, ckTimeboxHTML())}
      ${panel(`${ic("users")}Equipe agora`, `<div class="ckteam">${cgs.map(([m, c]) => `<button type="button" class="cktm" data-ckpessoa="${m.id}">${ckAv(m.id)}<span><b>${esc(ckMN(m.id))}</b><small>${esc(T.filter(t => t.resp === m.id && t.status === "em andamento").map(t => t.cod).join(", ") || "nada em andamento")}</small></span>${ckLoadBar(c)}</button>`).join("")}</div>`, { act: `<a class="lnk" href="#trabalho.equipe">Equipe</a>` })}
    </div>`;
}
function ckLoadBar(c) { const st = c.st === "idle" ? "none" : c.st; return `<span class="ckload" data-tip="${esc(`${pct(c.load)} da capacidade nos próximos ${c.n} dias úteis (${num(c.dem, 0)} h de ${num(c.cap, 0)} h)`)}"><i class="st-bg-${st}" style="width:${Math.min(100, Math.round(c.load * 100))}%"></i></span><em class="ckloadt st-${st === "none" ? "none" : st}">${pct(c.load)} · ${CK_CST[c.st]}</em>`; }

/* ---------------------------------------------------------------- Semana */
function ckSemana() {
  const off = CK.wk || 0, ws = addDays(weekStart(TODAY), off * 7), dias = Array.from({ length: 5 }, (_, i) => addDays(ws, i)), T = ckFiltra(ckT()), atr = off === 0 ? T.filter(t => ckOpen(t) && t.prazo && t.prazo < ws) : [];
  const col = (d, ts, lbl, cls = "") => `<div class="ckday${cls}${d === TODAY ? " now" : ""}${d && ckFer(d) ? " fer" : ""}"><header><b>${lbl}</b><small>${d ? (ckFer(d) ? esc(ckFer(d)) : `${num(sum(ts.filter(ckOpen).map(t => +t.esforco || 0)), 0)} h`) : `${ts.length}`}</small></header>${ckD().marcos.filter(m => m.data === d).map(m => `<div class="ckmk">${ic("flag")}${esc(m.nome)}</div>`).join("")}${ts.map(t => ckCard(t, { q: false })).join("") || `<p class="muted small">—</p>`}</div>`;
  const R = ckWeeklyData(ws);
  return `<div class="ckwnav"><button type="button" class="btn sm ghost" data-ckwk="-1" aria-label="Semana anterior">‹</button><b>Semana de ${fmtD(ws)} a ${fmtD(addDays(ws, 4))}</b><button type="button" class="btn sm ghost" data-ckwk="1" aria-label="Próxima semana">›</button>${off ? `<button type="button" class="btn sm ghost" data-ckwk="0">Esta semana</button>` : ""}</div>${ckFiltros()}
    <div class="ckweek${atr.length ? " late" : ""}">${atr.length ? col("", atr, "Vencidas", " lt") : ""}${dias.map(d => col(d, T.filter(t => t.prazo === d), `${DOWS[parse(d).getDay()]} ${fmtD(d)}`)).join("")}</div>
    <div class="g2c">${panel(`${ic("users")}Capacidade da semana`, `<div class="ckteam">${ckEquipe().map(m => { const c = ckCarga(m.id, 5); return `<div class="cktm">${ckAv(m.id)}<span><b>${esc(ckMN(m.id))}</b><small>${num(c.dem, 0)} h de ${num(c.cap, 0)} h</small></span>${ckLoadBar(c)}</div>`; }).join("")}</div>`)}
      ${panel(`${ic("week")}Weekly review`, ckWeeklyHTML(R), { act: `<button type="button" class="btn sm ghost" data-act="ckask" data-v="weekly">${ic("spark")}Com o PMO</button>` })}</div>`;
}

/* ---------------------------------------------------------------- Mês */
function ckMesV() {
  const mk = CK.mes || mkey(TODAY), d1 = mk + "-01", st = weekStart(d1), n = Math.ceil((diff(addDays(d1, dim(mk) - 1), st) + 1) / 7) * 7, T = ckFiltra(ckT());
  const cells = Array.from({ length: n }, (_, i) => addDays(st, i)).map(d => { const ts = T.filter(t => t.prazo === d), mks = ckD().marcos.filter(m => m.data === d && (!CK.f.proj || m.projeto === CK.f.proj));
    return `<div class="ckmd${d.slice(0, 7) !== mk ? " out" : ""}${d === TODAY ? " now" : ""}${!ckUtil(d) ? " off" : ""}"><span class="ckmdn">${+d.slice(8)}${ckFer(d) ? ` <small>${esc(ckFer(d))}</small>` : ""}</span>${mks.map(m => `<span class="ckmk">${ic("flag")}${esc(trunc(m.nome, 22))}</span>`).join("")}${ts.slice(0, 4).map(t => `<button type="button" class="ckmt${!ckOpen(t) ? " done" : t.prazo < TODAY ? " late" : ""}" data-cktask="${t.id}" style="--pc:${ckCor(t.projeto)}">${esc(t.cod)} ${esc(trunc(t.titulo, 26))}</button>`).join("")}${ts.length > 4 ? `<small class="muted">+${ts.length - 4}</small>` : ""}</div>`; }).join("");
  const nm = T.filter(t => t.prazo?.startsWith(mk)), h = sum(nm.filter(ckOpen).map(t => +t.esforco || 0)), du = Array.from({ length: dim(mk) }, (_, i) => `${mk}-${pad(i + 1)}`).filter(ckUtil).length;
  return `<div class="ckwnav"><button type="button" class="btn sm ghost" data-ckmes="-1" aria-label="Mês anterior">‹</button><b>${mlabel(mk)}</b><button type="button" class="btn sm ghost" data-ckmes="1" aria-label="Próximo mês">›</button>${mk !== mkey(TODAY) ? `<button type="button" class="btn sm ghost" data-ckmes="0">Este mês</button>` : ""}<span class="muted small">${plural(nm.length, "tarefa", "tarefas")} com prazo · ${num(h, 0)} h abertas · ${du} dias úteis</span></div>${ckFiltros()}
    <div class="ckcal">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => `<div class="ckcalh">${d}</div>`).join("")}${cells}</div>`;
}

/* ---------------------------------------------------------------- Kanban */
function ckKanban() {
  const T = ckFiltra(ckT());
  const cap = CK.kanAll ? Infinity : 40;
  return `${ckDrillChip("kanban")}${ckFiltros()}<div class="ckkan">${CK_STATUS.map(s => { const ts = ckSorted(T.filter(t => t.status === s && (s !== "concluída" || ckDrillOn("tar") || t.concluida >= addDays(TODAY, -14)))); return `<section class="ckcol" data-ckcol="${s}" aria-label="${s}"><header><b>${s[0].toUpperCase() + s.slice(1)}</b><small>${ts.length}${s !== "concluída" ? ` · ${num(sum(ts.map(t => ckRem(t))), 0)} h` : " · 14 dias"}</small></header><div class="ckcolb">${ts.slice(0, cap).map(t => ckCard(t, { drag: true, mv: true })).join("") || `<p class="muted small">Arraste uma tarefa para cá.</p>`}${ts.length > cap ? `<button type="button" class="btn sm ghost ckkanmais" data-act="ckkanall">mais ${ts.length - cap}</button>` : ""}</div></section>`; }).join("")}</div>`;
}

/* ---------------------------------------------------------------- Lista e matriz de Eisenhower */
function ckLista() {
  const T = ckFiltra(ckT().filter(t => CK.done || ckOpen(t) || ckDrillOn("tar"))), C = ckCPM().R;
  const ord = { score: (a, b) => (ckPrio(a).q || 9) - (ckPrio(b).q || 9) || ckPrio(b).s - ckPrio(a).s, prazo: (a, b) => (a.prazo || "9").localeCompare(b.prazo || "9"), projeto: (a, b) => ckPN(a.projeto).localeCompare(ckPN(b.projeto)), resp: (a, b) => ckMN(a.resp).localeCompare(ckMN(b.resp)), cod: (a, b) => (+a.cod.slice(1)) - (+b.cod.slice(1)) }[CK.sort] || (() => 0);
  const rows = [...T].sort(ord);
  const tools = `<div class="segs" role="group" aria-label="Ordenar"><span class="flbl" style="margin:0 6px">Ordem</span>${[["score", "Prioridade"], ["prazo", "Prazo"], ["projeto", "Projeto"], ["resp", "Pessoa"], ["cod", "Código"]].map(([k, l]) => `<button type="button" class="seg" data-cksort="${k}" aria-pressed="${CK.sort === k}">${l}</button>`).join("")}</div><button type="button" class="btn sm${CK.eis ? " primary" : ""}" data-act="ckeis" aria-pressed="${CK.eis}">${ic("grid")}Matriz de Eisenhower</button><label class="chk"><input type="checkbox" data-ckdonefil${CK.done ? " checked" : ""}> concluídas</label>`;
  if (CK.eis) { const Q = [1, 2, 3, 4].map(q => rows.filter(t => ckOpen(t) && ckPrio(t).q === q));
    return `${ckFiltros({ st: true, extra: tools })}<div class="ckeis">${[1, 2, 3, 4].map(q => `<section class="ckq${q}"><header><b>${CK_Q[q][0]}</b><small>${["urgente e importante", "importante, não urgente", "urgente, pouco importante", "nem urgente nem importante"][q - 1]} · ${Q[q - 1].length}</small></header>${Q[q - 1].map(t => ckCard(t, { q: false, why: true })).join("") || `<p class="muted small">—</p>`}${q === 3 && Q[2].length ? `<button type="button" class="btn sm" data-act="ckask" data-v="delegar">${ic("users")}Delegar com o PMO</button>` : ""}</section>`).join("")}</div>`; }
  const nMax = CK.listaN || 200, shown = rows.slice(0, nMax), mais = rows.length > nMax ? `<div class="more">Mostrando ${nMax} de ${rows.length} · <button type="button" class="lnk" data-act="cklistamais">mostrar mais ${Math.min(200, rows.length - nMax)}</button></div>` : "";
  return `${ckDrillChip("lista")}${ckFiltros({ st: true, extra: tools })}${rows.length ? `<div class="hscroll"><table class="dt cktab"><thead><tr><th></th><th>Cód.</th><th>Tarefa</th><th>Projeto</th><th>Resp.</th><th>Prazo</th><th class="num">Esforço</th><th>Status</th><th>Prioridade</th><th class="num">Folga</th></tr></thead><tbody>${shown.map(t => { const c = C[t.id], p = ckPrio(t);
      return `<tr class="click" data-cktask="${t.id}" tabindex="0"><td><input type="checkbox" data-ckdone="${t.id}"${!ckOpen(t) ? " checked" : ""} aria-label="Concluir ${esc(t.cod)}"></td><td class="mono">${esc(t.cod)}</td><td><span class="ckdot" style="--pc:${ckCor(t.projeto)}"></span>${esc(t.titulo)}${(t.tags || []).map(x => ` <span class="chip xs">${esc(x)}</span>`).join("")}</td><td>${esc(trunc(ckPN(t.projeto), 22))}</td><td>${esc(ckMN(t.resp))}</td><td>${ckPrazo(t, false)}</td><td class="num">${t.esforco ? num(+t.esforco, 0) + " h" : "–"}</td><td>${esc(t.status)}</td><td>${ckOpen(t) ? `${ckQpill(t)} <small class="muted">${p.s}</small>` : ""}</td><td class="num${c?.crit ? " st-warn" : ""}${c?.atraso ? " st-crit" : ""}">${c ? c.folga : "–"}</td></tr>`; }).join("")}</tbody></table></div>${mais}` : `<div class="empty">Nenhuma tarefa com esses filtros.</div>`}`;
}

/* ---------------------------------------------------------------- Equipe e a página de cada pessoa */
function ckEquipeV() {
  const T = ckT(), CKD = CK.deleg ? ckTarRef(CK.deleg) : null, cand = ckSorted(T.filter(t => ckOpen(t) && (t.resp === "eu" || !t.resp || ckM(t.resp)?.eu)));
  const del = CKD ? ckDeleg({ tags: CKD.tags, esforco: CKD.esforco, prazo: CKD.prazo, prio: CKD.prio, folga: ckC(CKD.id)?.folga }) : [];
  return `<div class="ckpeople">${ckEquipe().map(m => { const c = ckCarga(m.id), p = ckPdi(m.id), em = T.filter(t => t.resp === m.id && t.status === "em andamento"), nx = ckSorted(T.filter(t => t.resp === m.id && ckOpen(t) && t.status !== "em andamento")).slice(0, 3), u = ckA("ckMeet").filter(x => x.tipo === "1a1" && x.membro === m.id).map(x => x.data).sort().at(-1), pdi = ckPdiPct(p);
      return `<article class="pn ckperson"><header>${ckAv(m.id)}<div><h3>${esc(m.eu ? `${ckD().perfil.nome || "Eu"} (você)` : m.nome)}</h3><small>${esc([m.papel, m.nivel].filter(Boolean).join(" · "))}</small></div><button type="button" class="btn sm ghost" data-ckpessoa="${m.id}">Abrir</button></header>
        ${ckLoadBar(c)}${m.foco ? `<p class="small"><b>Foco:</b> ${esc(m.foco)}</p>` : ""}
        <div class="flbl">Em andamento</div>${em.map(t => ckCard(t, { q: false })).join("") || `<p class="muted small">Nada em andamento.</p>`}
        ${nx.length ? `<div class="flbl">Próximas</div><ul class="ckmini">${nx.map(t => `<li><button type="button" class="lnk" data-cktask="${t.id}">${esc(t.cod)}</button> ${esc(trunc(t.titulo, 46))} · ${ckPrazo(t, false)}</li>`).join("")}</ul>` : ""}
        <footer>${pdi != null ? `<span class="small">PDI ${pct(pdi)} do alvo</span>` : m.eu ? "" : `<span class="small muted">sem PDI</span>`}${!m.eu ? `<span class="small ${u && diff(TODAY, u) <= ckLim("ciclo1a1") ? "muted" : "st-warn"}">1:1 ${u ? relDay(u) : "nunca"}</span>` : ""}</footer></article>`; }).join("")}</div>
    ${panel(`${ic("users")}Sugestão de delegação`, `<p class="muted small">Escolha uma tarefa sua ou sem responsável: o motor pesa nível, carga, prazo e o objetivo de aprendizado do PDI, e mostra o trade-off.</p>
      <select id="ck_deleg" aria-label="Tarefa para delegar"><option value="">Escolha uma tarefa…</option>${cand.map(t => `<option value="${t.id}"${CK.deleg === t.id ? " selected" : ""}>${esc(`${t.cod} ${trunc(t.titulo, 60)} (${t.esforco || "?"} h, ${t.prazo ? fmtD(t.prazo) : "sem prazo"})`)}</option>`).join("")}</select>
      ${CKD ? `<div class="hscroll"><table class="dt"><thead><tr><th>Pessoa</th><th class="num">Pontos</th><th>Por quê</th><th>Trade-off</th><th></th></tr></thead><tbody>${del.map((x, i) => `<tr><td><b>${esc(x.nome)}</b>${i === 0 ? ` <span class="pill good">sugerida</span>` : ""}</td><td class="num">${x.s}</td><td class="small">${esc(x.r.join("; "))}</td><td class="small">${esc(x.tradeoff || "—")}${x.revisor ? `<br>revisor: ${esc(ckMN(x.revisor))}` : ""}</td><td><button type="button" class="btn sm" data-ckatrib="${CKD.id}|${x.id}|${x.revisor}">Atribuir</button></td></tr>`).join("")}</tbody></table></div>` : ""}`)}`;
}
function ckPessoaV() {
  const m = ckM(CK.pessoa) || ckEquipe().find(x => !x.eu) || ckEquipe()[0]; if (!m) return ckEquipeV();
  const T = ckT(), c = ckCarga(m.id), p = ckPdi(m.id), tr = CK_TRILHAS[p.trilha], meets = ckA("ckMeet").filter(x => x.membro === m.id).sort((a, b) => b.data.localeCompare(a.data)), fb = meets.flatMap(x => (x.feedback || []).map(f => ({ ...f, data: x.data }))), open = ckSorted(T.filter(t => t.resp === m.id && ckOpen(t)));
  const done30 = T.filter(t => t.resp === m.id && !ckOpen(t) && t.concluida >= addDays(TODAY, -30)), noPrazo = done30.filter(t => t.prazo && t.concluida <= t.prazo).length;
  const pauta = ckPauta1a1(m.id);
  return `<div class="ckwnav"><a class="btn sm ghost" href="#trabalho.equipe">${ic("back")}Equipe</a><b>${esc(m.eu ? "Você" : m.nome)}</b><span class="muted small">${esc([m.papel, m.nivel, m.horas ? m.horas + " h/semana" : ""].filter(Boolean).join(" · "))}</span><select id="ck_pes" aria-label="Pessoa">${ckEquipe().map(x => `<option value="${x.id}"${x.id === m.id ? " selected" : ""}>${esc(ckMN(x.id))}</option>`).join("")}</select></div>
    ${kpiRow([kmini("var(--a-car)", `Carga · ${c.n} dias úteis`, pct(c.load), CK_CST[c.st], c.st === "crit" ? "crit" : c.st === "warn" ? "warn" : ""), kmini("var(--a-apr)", "Abertas", String(open.length), `${num(sum(open.map(ckRem)), 0)} h restantes`), kmini("var(--good)", "Concluídas · 30 dias", String(done30.length), done30.length ? `${pct(noPrazo / done30.length)} no prazo` : "–"), kmini("var(--a-men)", "PDI", p.comps.length ? pct(ckPdiPct(p)) : "–", tr ? tr.nome : "sem trilha")])}
    <div class="g2c">
      ${panel(`${ic("list")}Tarefas`, open.map(t => ckCard(t, { why: true })).join("") || `<p class="muted">Nada aberto.</p>`)}
      ${m.eu ? "" : panel(`${ic("sprout")}Plano de desenvolvimento (PDI)`, `<div class="row wrap"><label class="lbl">Trilha<select data-ckpdi="trilha" data-m="${m.id}"><option value="">nenhuma</option>${Object.entries(CK_TRILHAS).map(([k, x]) => `<option value="${k}"${p.trilha === k ? " selected" : ""}>${esc(x.nome)}</option>`).join("")}</select></label>${p.trilha && !p.comps.length ? `<button type="button" class="btn sm" data-ckpditr="${m.id}">${ic("plus")}Carregar as competências da trilha</button>` : ""}</div>
        ${p.comps.length ? `<div class="ckcomps">${p.comps.map(x => `<div class="ckcmp"><div><b>${esc(x.nome)}</b>${x.desc ? `<small class="muted">${esc(x.desc)}</small>` : ""}</div><div class="row wrap"><label class="lbl">Nível<select data-ckcomp="${m.id}|${x.id}|nivel">${CK_NIVEL_COMP.map((l, i) => `<option value="${i}"${+x.nivel === i ? " selected" : ""}>${i} · ${l}</option>`).join("")}</select></label><label class="lbl">Alvo<select data-ckcomp="${m.id}|${x.id}|alvo">${CK_NIVEL_COMP.map((l, i) => `<option value="${i}"${+(x.alvo ?? 3) === i ? " selected" : ""}>${i}</option>`).join("")}</select></label><span class="ckbarmini" aria-hidden="true"><i style="width:${Math.round(clamp((+x.nivel || 0) / 4) * 100)}%"></i><b style="left:${Math.round(clamp((+(x.alvo ?? 3)) / 4) * 100)}%"></b></span><button type="button" class="vb" data-ckcompdel="${m.id}|${x.id}" aria-label="Remover ${esc(x.nome)}">${ic("trash")}</button></div></div>`).join("")}</div>` : ""}
        <div class="row wrap ckadd"><input type="text" id="ck_compn" placeholder="Nova competência" aria-label="Nova competência"><button type="button" class="btn sm" data-ckcompadd="${m.id}">${ic("plus")}Competência</button></div>
        <div class="flbl">Metas</div>${p.metas.map(x => `<label class="ckl${x.feito ? " done" : ""}"><input type="checkbox" data-ckmeta="${m.id}|${x.id}"${x.feito ? " checked" : ""}><span>${esc(x.txt)}${x.prazo ? ` <small class="muted">até ${fmtD(x.prazo)}</small>` : ""}</span></label>`).join("") || `<p class="muted small">Sem metas.</p>`}
        <div class="row wrap ckadd"><input type="text" id="ck_metan" placeholder="Meta (ex.: dimensionar sozinha a rede de drenagem de um lote)" aria-label="Nova meta"><input type="date" id="ck_metap" aria-label="Prazo da meta"><button type="button" class="btn sm" data-ckmetaadd="${m.id}">${ic("plus")}Meta</button></div>`)}
      ${m.eu ? "" : panel(`${ic("users")}1:1`, `${CK.meet?.membro === m.id ? ckMeetForm() : `<div class="flbl">Pauta sugerida</div><ul class="ckmini">${pauta.map(x => `<li>${esc(x)}</li>`).join("") || `<li class="muted">nada pendente</li>`}</ul><div class="row wrap"><button type="button" class="btn sm primary" data-ck1a1="${m.id}">${ic("plus")}Registrar 1:1</button><button type="button" class="btn sm ghost" data-ckprep="${m.id}">${ic("spark")}Preparar com o PMO</button></div>`}
        ${meets.length ? `<div class="flbl">Histórico</div>${meets.slice(0, 8).map(x => `<details class="ckmeet"><summary><b>${fmtD(x.data)}</b> ${esc(x.tipo === "1a1" ? "1:1" : x.titulo || "reunião")}${(x.acoes || []).length ? ` · ${plural(x.acoes.length, "compromisso", "compromissos")}` : ""}</summary>${x.pauta ? `<p class="small"><b>Pauta:</b> ${esc(x.pauta)}</p>` : ""}${x.notas ? `<p class="small">${esc(x.notas)}</p>` : ""}${(x.acoes || []).map(a => `<p class="small">${ic("arrow")}${esc(a.txt)} (${esc(ckMN(a.resp))}${a.prazo ? `, ${fmtD(a.prazo)}` : ""})${a.tarefa ? ` <button type="button" class="lnk" data-cktask="${a.tarefa}">${esc(ckT().find(t => t.id === a.tarefa)?.cod || "tarefa")}</button>` : ""}</p>`).join("")}</details>`).join("")}` : ""}`)}
      ${m.eu ? "" : panel(`${ic("memory")}Histórico de feedback`, fb.length ? `<ul class="ckfb">${fb.map(f => `<li class="${slug(f.tipo)}"><span class="pill ${f.tipo === "reconhecimento" ? "good" : f.tipo === "ajuste" ? "warn" : "none"}">${esc(f.tipo)}</span><span>${esc(f.txt)}</span><small class="muted">${fmtD(f.data)}</small></li>`).join("")}</ul>` : `<p class="muted">O feedback registrado nos 1:1 aparece aqui, em ordem.</p>`)}
    </div>`;
}
function ckPauta1a1(mid) {
  const T = ckT(), out = [], c = ckCarga(mid), p = ckPdi(mid), u = ckA("ckMeet").filter(x => x.tipo === "1a1" && x.membro === mid).sort((a, b) => b.data.localeCompare(a.data))[0];
  T.filter(t => t.resp === mid && ckOpen(t) && t.prazo && t.prazo < TODAY).forEach(t => out.push(`${t.cod} vencida (${fmtD(t.prazo)}): o que travou?`));
  T.filter(t => t.resp === mid && t.status === "bloqueada").forEach(t => out.push(`${t.cod} bloqueada: de quem depende?`));
  if (c.st === "crit") out.push(`Carga em ${pct(c.load)}: o que tirar ou adiar`); if (c.st === "idle") out.push(`Carga em ${pct(c.load)}: que tarefa nova serve ao PDI`);
  p.metas.filter(x => !x.feito && x.prazo && x.prazo <= addDays(TODAY, 21)).forEach(x => out.push(`Meta do PDI até ${fmtD(x.prazo)}: ${trunc(x.txt, 60)}`));
  p.comps.filter(x => +x.nivel < +(x.alvo ?? 3)).slice(0, 2).forEach(x => out.push(`Competência “${x.nome}”: nível ${x.nivel} de ${x.alvo ?? 3}`));
  (u?.acoes || []).filter(a => !a.tarefa || ckOpen(T.find(t => t.id === a.tarefa) || {})).forEach(a => out.push(`Compromisso do último 1:1: ${trunc(a.txt, 60)}`));
  T.filter(t => t.resp === mid && !ckOpen(t) && t.concluida >= (u?.data || addDays(TODAY, -14))).slice(0, 3).forEach(t => out.push(`Reconhecer: ${t.cod} concluída em ${fmtD(t.concluida)}`));
  return out.slice(0, 9);
}

/* ---------------------------------------------------------------- Contexto: perfil, equipe, projetos, marcos e o agente */
function ckContextoV() {
  const c = ckD(), p = c.perfil, f = (k, l, ph = "") => `<label>${l}<input type="text" data-ckperf="${k}" value="${esc(p[k] || "")}" placeholder="${esc(ph)}"></label>`;
  return `<div class="g2c">
    ${panel(`${ic("user")}Seu perfil`, `<p class="muted small">Vai para o prompt do PMO (seção 2) e fica só no seu banco privado, nunca no código do app.</p><div class="form f2">${f("nome", "Nome")}${f("profissao", "Profissão", "Engenheiro civil")}${f("cidade", "Cidade")}${f("area", "Área", "projetos de infraestrutura viária")}</div><div class="form f1">${f("funcoes", "Funções", "BIM Specialist, BIM Coordinator, Coordenador do setor")}<label>Notas para o PMO<textarea data-ckperf="extra" rows="2">${esc(p.extra || "")}</textarea></label></div>`)}
    ${panel(`${ic("sliders")}Calendário e ritmo`, `<div class="form f2"><label>Jornada de trabalho<input type="text" data-ckcfg="jornada" value="${esc(c.cfg.jornada || "08:30-17:30")}" placeholder="08:30-17:30"></label><label>Padroeiro local (MM-DD)<input type="text" data-ckcfg="patrono" value="${esc(c.cfg.patrono ?? "06-24")}" placeholder="06-24 (Torino)"></label><label>Ciclo de 1:1 (dias)<input type="number" data-ckcfg="ciclo1a1" value="${esc(c.cfg.ciclo1a1 || 14)}"></label><label>Férias e folgas (AAAA-MM-DD, vírgula)<input type="text" data-ckcfg="ferias" value="${esc((c.cfg.ferias || []).join(", "))}"></label></div><p class="muted small">Dias úteis: segunda a sexta, sem os feriados nacionais italianos, a Pasquetta, o padroeiro e as suas folgas. É a base do caminho crítico, das folgas e da carga.</p>`)}
  </div>
  ${panel(`${ic("gauge")}Limites dos alertas e do Dashboard`, `<div class="form f3">${Object.entries(CK_LIMITES_TXT).map(([k, l]) => `<label>${esc(l)}<input type="number" step="any" data-cklim="${k}" value="${esc(c.cfg.lim?.[k] ?? "")}" placeholder="${CK_LIMITES[k]}"></label>`).join("")}</div><p class="muted small">Vazio = o valor padrão da configuração (src/44-cockpit-config.js), que aparece em cinza. Valem para o Hoje, os alertas, a delegação e o Dashboard.</p>`)}
  ${panel(`${ic("users")}Equipe`, `${ckMembrosTab()}<div class="row wrap"><button type="button" class="btn sm" data-ckmemb="">${ic("plus")}Pessoa</button></div>`)}
  <div class="g2c">${panel(`${ic("brief")}Projetos`, `${c.projetos.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Projeto</th><th>Cliente</th><th>Fase</th><th class="num">Abertas</th><th></th></tr></thead><tbody>${c.projetos.map(p => `<tr class="click" data-ckproj="${p.id}" tabindex="0"><td><span class="ckdot" style="--pc:${p.cor}"></span>${esc(p.nome)}${p.ativo === false ? ` <span class="pill none">encerrado</span>` : ""}</td><td>${esc(p.cliente || "")}</td><td>${esc(p.fase || "")}</td><td class="num">${ckT().filter(t => t.projeto === p.id && ckOpen(t)).length}</td><td>${ic("edit")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum projeto.</p>`}<button type="button" class="btn sm" data-ckproj="">${ic("plus")}Projeto</button>`)}
    ${panel(`${ic("flag")}Marcos: consegne, revisioni, approvazioni`, `${c.marcos.length ? `<div class="hscroll"><table class="dt"><thead><tr><th>Data</th><th>Marco</th><th>Tipo</th><th>Projeto</th><th></th></tr></thead><tbody>${[...c.marcos].sort((a, b) => a.data.localeCompare(b.data)).map(m => `<tr class="click${m.feito ? " muted" : ""}" data-ckmarco="${m.id}" tabindex="0"><td>${fmtDY(m.data)}</td><td>${esc(m.nome)}${m.feito ? " ✓" : ""}</td><td>${esc(m.tipo || "")}</td><td>${esc(ckPN(m.projeto))}</td><td>${ic("edit")}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted">Nenhum marco.</p>`}<button type="button" class="btn sm" data-ckmarco="">${ic("plus")}Marco</button>`)}</div>
  ${panel(`${ic("gauge")}O agente: configuração versionada (v${CK_AGENTE.versao})`, `<p class="muted small">O comportamento do PMO vem de um arquivo de configuração do app (seção 5 do pedido); o contexto acima entra na seção 2. Abaixo, exatamente o texto fixo que ele recebe antes do estado do Cockpit.</p><details><summary>Ver o prompt fixo</summary><pre class="ckpre">${esc(ckEspec() + "\n\n" + ckContexto())}</pre></details><details><summary>Ferramentas (${CK_AGENTE.ferramentas.length})</summary><p class="small">${CK_AGENTE.ferramentas.map(x => `<code>${x}</code>`).join(" ")}</p><p class="muted small">Leitura: listar_tarefas, sugerir_delegacao, calcular_caminho_critico, gerar_briefing, gerar_relatorio. As demais só criam propostas.</p></details>`)}`;
}
function ckMembrosTab() {
  return `<div class="hscroll"><table class="dt"><thead><tr><th>Pessoa</th><th>Perfil</th><th>Nível</th><th>Foco de desenvolvimento</th><th class="num">h/semana</th><th>Domina</th><th></th></tr></thead><tbody>${ckD().membros.map(m => `<tr class="click${m.ativo === false ? " muted" : ""}" data-ckmemb="${m.id}" tabindex="0"><td>${ckAv(m.id)} ${esc(m.eu ? `${ckD().perfil.nome || "Eu"} (você)` : m.nome)}</td><td>${esc(m.papel || "")}</td><td>${esc(m.nivel || "")}</td><td>${esc(m.foco || "")}</td><td class="num">${m.horas || "–"}</td><td>${(m.tags || []).map(t => `<span class="chip xs">${esc(t)}</span>`).join(" ")}</td><td>${ic("edit")}</td></tr>`).join("")}</tbody></table></div>`;
}

/* ---------------------------------------------------------------- formulários (dialog genérico) */
function ckDlg({ titulo, campos, rec = {}, salvar, excluir, extra = "", wide, depois }) {
  const dlg = $("#dlg"), o = { ...rec };
  const opt = (x, v) => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val)}"${String(val) === String(v ?? "") ? " selected" : ""}>${esc(lab)}</option>`; };
  const fld = ([k, l, ty, op, full]) => { const v = o[k] ?? "", opts = typeof op === "function" ? op(o) : op;
    if (ty === "sel") return `<label class="${full ? "full" : ""}">${esc(l)}<select name="${k}">${opts.map(x => opt(x, v)).join("")}</select></label>`;
    if (ty === "area") return `<label class="full">${esc(l)}<textarea name="${k}" rows="${op || 3}">${esc(v)}</textarea></label>`;
    if (ty === "multi") return `<fieldset class="full ckms"><legend>${esc(l)}</legend><div class="ckmsl">${opts.length ? opts.map(x => { const [val, lab] = Array.isArray(x) ? x : [x, x]; return `<label class="chk"><input type="checkbox" name="${k}" value="${esc(val)}"${(v || []).includes(val) ? " checked" : ""}> ${esc(lab)}</label>`; }).join("") : `<span class="muted small">nada para escolher</span>`}</div></fieldset>`;
    if (ty === "chk") return `<label class="chk${full ? " full" : ""}"><input type="checkbox" name="${k}"${v ? " checked" : ""}> ${esc(l)}</label>`;
    if (ty === "html") return op;
    return `<label class="${full ? "full" : ""}">${esc(l)}<input name="${k}" type="${ty === "num" ? "number" : ty || "text"}"${ty === "num" ? ' step="any"' : ""} value="${esc(v)}"></label>`; };
  dlg.innerHTML = `<form method="dialog" id="fm" class="ckfm${wide ? " wide" : ""}"><h3>${titulo}</h3><div class="form f3">${campos.map(fld).join("")}</div>${extra}<div class="dlgfoot"><div>${excluir ? `<button type="button" class="btn danger" id="del">Excluir</button>` : ""}</div><div class="row"><button type="button" class="btn" id="cancel">Cancelar</button><button class="btn primary" value="ok">Salvar</button></div></div></form>`;
  const fm = $("#fm", dlg); $("#cancel", dlg).onclick = () => dlg.close();
  const del = $("#del", dlg); if (del) del.onclick = () => { if (del.dataset.c) { dlg.close(); excluir(); } else { del.dataset.c = 1; del.textContent = "Confirmar exclusão"; } };
  fm.onsubmit = e => { e.preventDefault(); const fd = new FormData(fm), r = {};
    for (const [k, , ty] of campos) { if (ty === "html") continue; if (ty === "multi") r[k] = fd.getAll(k); else if (ty === "chk") r[k] = fd.get(k) === "on"; else if (ty === "num") { const x = fd.get(k); r[k] = x === "" || x == null ? "" : +x; } else r[k] = String(fd.get(k) ?? "").trim(); }
    const msg = salvar(r); if (msg) { toast(msg); return; } dlg.close(); };
  dlg.showModal(); setTimeout(() => $("input,select,textarea", dlg)?.focus(), 30); depois?.(dlg); return dlg;
}
const ckMembOpts = (vazio = "sem responsável") => [["", vazio], ...ckEquipe().map(m => [m.id, ckMN(m.id)])];
const ckProjOpts = () => [["", "sem projeto"], ...ckD().projetos.filter(p => p.ativo !== false).map(p => [p.id, p.nome])];
/* dependência nova não pode fechar um ciclo */
function ckCiclo(id, deps) { const by = new Map(ckT().map(t => [t.id, t])), seen = new Set(), st = [...deps]; while (st.length) { const x = st.pop(); if (x === id) return true; if (seen.has(x)) continue; seen.add(x); st.push(...(by.get(x)?.deps || [])); } return false; }
function ckTarForm(id, preset = {}) {
  const t = id ? ckT().find(x => x.id === id) : null, o = t ? { ...t, tagsx: "" } : { status: "a fazer", prio: "média", impacto: "médio", resp: ckEquipe().find(m => m.eu)?.id || "", tags: [], deps: [], projeto: CK.f.proj || "", feito: 0, ...preset };
  const tagsAll = [...new Set([...CK_AGENTE.tags, ...ckT().flatMap(x => x.tags || [])])], C = t ? ckC(t.id) : null, pr = t && ckOpen(t) ? ckPrio(t) : null;
  const depOpts = ckT().filter(x => x.id !== id && (ckOpen(x) || (o.deps || []).includes(x.id))).sort((a, b) => (a.projeto === o.projeto ? 0 : 1) - (b.projeto === o.projeto ? 0 : 1) || (+a.cod.slice(1)) - (+b.cod.slice(1))).map(x => [x.id, `${x.cod} ${trunc(x.titulo, 44)}${x.projeto !== o.projeto ? ` · ${trunc(ckPN(x.projeto), 16)}` : ""}`]);
  const info = t ? `<div class="ckinfo">${C ? `${ic("arrow")}CPM: início ${fmtD(C.es)}, término ${fmtD(C.ef)}, folga ${plural(C.folga, "dia útil", "dias úteis")}${C.crit ? " · <b>crítica</b>" : ""}${C.atraso ? " · <b class='st-crit'>atraso previsto</b>" : ""}` : `Concluída em ${fmtD(t.concluida)}`}${pr ? `<br>${ic("target")}${CK_Q[pr.q][0]} (score ${pr.s})${pr.r.length ? ": " + esc(pr.r.join(", ")) : ""}` : ""}${t.origem?.rot ? `<br><small class="muted">criada por ${esc(t.origem.rot)} em ${fmtD(t.criada)}</small>` : ""}</div>${(t.hist || []).length ? `<details class="ckhist"><summary>Histórico (${t.hist.length})</summary>${t.hist.slice(-8).reverse().map(h => `<p class="small">${fmtD(iso(new Date(h.at)))} · ${esc(h.por)}: ${Object.keys(h.depois || {}).map(k => `${k} ${esc(String(h.antes?.[k] ?? "–"))} → ${esc(String(h.depois[k]))}`).join("; ")}${h.motivo ? ` (${esc(h.motivo)})` : ""}</p>`).join("")}</details>` : ""}` : "";
  ckDlg({ titulo: t ? `${t.cod} · Tarefa` : "Nova tarefa", wide: true, rec: o,
    campos: [["titulo", "Tarefa", "text", null, 1], ["projeto", "Projeto", "sel", ckProjOpts()], ["resp", "Responsável", "sel", ckMembOpts()], ["revisor", "Revisor", "sel", ckMembOpts("nenhum")], ["prazo", "Prazo", "date"], ["inicio", "Início (opcional)", "date"], ["esforco", "Esforço (h)", "num"], ["feito", "Progresso (%)", "num"], ["status", "Status", "sel", CK_STATUS], ["prio", "Prioridade", "sel", CK_PRIO], ["impacto", "Impacto", "sel", CK_IMP],
      ["marco", "Marco ligado", "sel", [["", "nenhum"], ...ckD().marcos.filter(m => !m.feito || m.id === o.marco).map(m => [m.id, `${fmtD(m.data)} ${m.nome}`])]], ["tags", "Tags", "multi", tagsAll], ["tagsx", "Outras tags (separadas por vírgula)", "text", null, 1], ["deps", "Depende de", "multi", depOpts], ["notas", "Notas", "area", 3], ["sug", "", "html", `<div class="full"><button type="button" class="btn sm" id="ck_sugresp">${ic("users")}Sugerir responsável</button><div id="ck_sugout"></div></div>`]],
    extra: info,
    salvar: r => { if (!r.titulo) return "Escreva a tarefa."; if (t && ckCiclo(t.id, r.deps)) return "Essa dependência fecha um ciclo."; const tags = [...new Set([...r.tags, ...r.tagsx.split(",").map(s => s.trim()).filter(Boolean)])]; delete r.tagsx; delete r.sug;
      const rec = { ...r, tags, esforco: r.esforco === "" ? "" : Math.max(0, r.esforco), feito: clamp(+r.feito || 0, 0, 100) };
      if (t) { const antes = {}, dep = {}; for (const k of ["resp", "prazo", "status", "esforco", "prio"]) if (String(t[k] ?? "") !== String(rec[k] ?? "")) { antes[k] = t[k]; dep[k] = rec[k]; } Object.assign(t, rec); if (t.status === "concluída" && !t.concluida) { t.concluida = TODAY; t.feito = 100; } if (t.status !== "concluída") t.concluida = ""; if (Object.keys(dep).length) (t.hist ||= []).push({ at: Date.now(), por: "você", antes, depois: dep }); touch("ckTar", { label: `Tarefa ${t.cod} editada` }); }
      else { const n = ckNovaTarefa({ ...rec, problema: o.problema, risco: o.risco }, o.origem || { k: "manual", rot: "você" }); if (n.status === "concluída") { n.concluida = TODAY; n.feito = 100; } touch("ckTar", "ck", { label: `Tarefa ${n.cod} criada` }); undoToast(`Tarefa ${n.cod} criada`); } },
    excluir: t ? () => { S.ckTar = ckT().filter(x => x.id !== t.id); ckT().forEach(x => { if ((x.deps || []).includes(t.id)) x.deps = x.deps.filter(d => d !== t.id); }); touch("ckTar", { label: `Tarefa ${t.cod} excluída` }); undoToast(`Tarefa ${t.cod} excluída`); } : null,
    depois: dlg => { const b = $("#ck_sugresp", dlg); if (b) b.onclick = () => { const fm = $("#fm", dlg), fd = new FormData(fm), tags = [...fd.getAll("tags"), ...String(fd.get("tagsx") || "").split(",").map(s => s.trim()).filter(Boolean)]; const r = ckDeleg({ tags, esforco: +fd.get("esforco") || 8, prazo: fd.get("prazo"), prio: fd.get("prio"), folga: C?.folga }).slice(0, 3);
      $("#ck_sugout", dlg).innerHTML = `<ol class="cksug">${r.map(x => `<li><b>${esc(x.nome)}</b> <small class="muted">${x.s} pts</small> <button type="button" class="btn sm ghost" data-ckuse="${x.id}|${x.revisor}">Usar</button><br><small>${esc(x.r.join("; "))}${x.tradeoff ? ` · ${esc(x.tradeoff)}` : ""}</small></li>`).join("")}</ol>`;
      $$("[data-ckuse]", dlg).forEach(u => u.onclick = () => { const [a, rv] = u.dataset.ckuse.split("|"); fm.resp.value = a; if (rv && !fm.revisor.value) fm.revisor.value = rv; toast(`Responsável: ${ckMN(a)}${rv ? ` · revisor ${ckMN(rv)}` : ""}`); }); }; } });
}
function ckMembForm(id) {
  const m = id ? ckM(id) : null;
  ckDlg({ titulo: m ? `Pessoa · ${m.eu ? "você" : m.nome}` : "Nova pessoa da equipe", rec: m ? { ...m } : { nivel: "Júnior", horas: 32, ativo: true, tags: [] },
    campos: [["nome", m?.eu ? "Como aparece (você)" : "Nome", "text"], ["papel", "Perfil / função", "text"], ["nivel", "Nível", "sel", CK_AGENTE.niveis.map(([n, f]) => [n, `${n} (${f}× o tempo)`])], ["horas", "Horas por semana para tarefas", "num"], ["foco", "Foco de desenvolvimento", "text", null, 1], ["tags", "Domina (tarefas que faz bem sozinha)", "multi", CK_AGENTE.tags], ["ativo", "Ativa na equipe", "chk"]],
    salvar: r => { if (!r.nome) return "Escreva o nome."; if (m) Object.assign(m, r); else ckD().membros.push({ id: uid(), ...r }); touch("ck", { label: m ? "Pessoa editada" : "Pessoa adicionada" }); },
    excluir: m && !m.eu ? () => { if (ckT().some(t => t.resp === m.id && ckOpen(t))) { m.ativo = false; touch("ck", { label: "Pessoa desativada" }); toast("Tem tarefas abertas: a pessoa foi desativada, não apagada."); return; } ckD().membros = ckD().membros.filter(x => x.id !== m.id); touch("ck", { label: "Pessoa removida" }); } : null });
}
function ckProjForm(id) {
  const p = id ? ckP(id) : null;
  ckDlg({ titulo: p ? "Projeto" : "Novo projeto", rec: p ? { ...p } : { fase: "PFTE", ativo: true },
    campos: [["nome", "Nome", "text", null, 1], ["cliente", "Cliente / stazione appaltante", "text"], ["fase", "Fase", "sel", ["PFTE", "Progetto esecutivo", "Gara", "Esecuzione / DL", "Studio", "Altro"]], ["ativo", "Ativo", "chk"]],
    salvar: r => { if (!r.nome) return "Dê um nome ao projeto."; if (p) Object.assign(p, r); else { const used = ckD().projetos.map(x => x.cor); ckD().projetos.push({ id: uid(), ...r, cor: CK_CORES.find(c => !used.includes(c)) || CK_CORES[ckD().projetos.length % CK_CORES.length] }); } touch("ck", { label: p ? "Projeto editado" : "Projeto criado" }); },
    excluir: p ? () => { if (ckT().some(t => t.projeto === p.id)) { p.ativo = false; touch("ck", { label: "Projeto encerrado" }); toast("O projeto tem tarefas: foi encerrado, não apagado."); return; } ckD().projetos = ckD().projetos.filter(x => x.id !== p.id); touch("ck", { label: "Projeto removido" }); } : null });
}
function ckMarcoForm(id) {
  const m = id ? ckD().marcos.find(x => x.id === id) : null;
  ckDlg({ titulo: m ? "Marco" : "Novo marco", rec: m ? { ...m } : { tipo: "consegna", data: addDays(TODAY, 14), projeto: CK.f.proj || "" },
    campos: [["nome", "Marco", "text", null, 1], ["tipo", "Tipo", "sel", ["consegna", "revisione", "approvazione", "riunione", "altro"]], ["data", "Data", "date"], ["projeto", "Projeto", "sel", ckProjOpts()], ["feito", "Cumprido", "chk"]],
    salvar: r => { if (!r.nome || !r.data) return "Nome e data."; if (m) Object.assign(m, r); else ckD().marcos.push({ id: uid(), ...r }); touch("ck", { label: m ? "Marco editado" : "Marco criado" }); },
    excluir: m ? () => { ckD().marcos = ckD().marcos.filter(x => x.id !== m.id); ckT().forEach(t => { if (t.marco === m.id) t.marco = ""; }); touch("ck", "ckTar", { label: "Marco removido" }); } : null });
}

/* ---------------------------------------------------------------- entrada rápida global (Alt+Shift+N) */
function ckQuickOpen(pre = "") {
  let d = $("#ckq"); if (!d) { d = document.createElement("dialog"); d.id = "ckq"; d.setAttribute("aria-label", "Registrar no Cockpit"); document.body.appendChild(d); }
  CK.quick = { txt: pre, tipo: null };
  d.innerHTML = `<form method="dialog" class="ckqf"><h3>${ic("bolt")}Registrar no Cockpit</h3><textarea id="ckq_in" rows="3" placeholder="t: revisar relazione idraulica @Ana #Idraulica 6h sex [Variante]&#10;r: o cliente pode mudar o traçado no km 3&#10;Sem prefixo, vira um evento do diário de bordo." aria-label="O que registrar">${esc(pre)}</textarea><div id="ckq_prev" class="ckqprev"></div>
    <p class="muted small">Prefixos: <code>t:</code> tarefa · <code>r:</code> risco · <code>p:</code> problema · <code>d:</code> decisão · <code>e:</code> diário. Marcadores: <code>@pessoa</code> <code>#tag</code> <code>!alta</code> <code>8h</code> <code>sex</code> ou <code>12/11</code> <code>[projeto]</code>. Enter registra; Shift+Enter quebra a linha.</p>
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" data-ckq="x">Cancelar</button><button type="button" class="btn primary" data-ckq="ok">${ic("check")}Registrar</button></div></div></form>`;
  if (!d.open) d.showModal(); const ta = $("#ckq_in", d); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); ckQuickPrev();
  ta.oninput = () => { CK.quick.txt = ta.value; ckQuickPrev(); };
  ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); ckQuickSave(); } };
  d.onclick = e => { const b = e.target.closest("[data-ckq]"); if (!b) return; if (b.dataset.ckq === "ok") ckQuickSave(); else if (b.dataset.ckq === "x") d.close(); else { CK.quick.tipo = b.dataset.ckq; ckQuickPrev(); } };
}
const CK_QT = { t: "Tarefa", r: "Risco", p: "Problema", d: "Decisão", e: "Diário de bordo" };
function ckQuickPrev() {
  const el = $("#ckq_prev"); if (!el) return; const o = ckParseQuick(CK.quick.txt), tp = CK.quick.tipo || o.tipo;
  el.innerHTML = `<div class="segs" role="group" aria-label="Tipo">${Object.entries(CK_QT).map(([k, l]) => `<button type="button" class="seg" data-ckq="${k}" aria-pressed="${tp === k}">${l}</button>`).join("")}</div>
    <div class="ckpf">${o.texto ? `<span><b>${tp === "e" ? `diário (${ckLogTipo(o.texto)})` : CK_QT[tp].toLowerCase()}</b> ${esc(trunc(o.texto, 90))}</span>` : `<span class="muted">Escreva acima.</span>`}${o.resp ? `<span><b>resp.</b> ${esc(ckMN(o.resp))}</span>` : ""}${o.prazo ? `<span><b>prazo</b> ${fmtDL(o.prazo)}</span>` : ""}${o.esforco ? `<span><b>esforço</b> ${o.esforco} h</span>` : ""}${o.prio ? `<span><b>prio</b> ${o.prio}</span>` : ""}${o.tags.length ? `<span><b>tags</b> ${esc(o.tags.join(", "))}</span>` : ""}${o.projeto ? `<span><b>projeto</b> ${esc(ckPN(o.projeto))}</span>` : ""}</div>`;
}
function ckQuickSave() {
  const o = ckParseQuick(CK.quick?.txt), tp = CK.quick?.tipo || o.tipo; if (!o.texto) { toast("Escreva o que registrar."); return; }
  let cod = "", keys = [];
  if (tp === "t") { const t = ckNovaTarefa({ titulo: o.texto, projeto: o.projeto, resp: o.resp || ckEquipe().find(m => m.eu)?.id || "", prazo: o.prazo, esforco: o.esforco, prio: o.prio || "média", tags: o.tags }, { k: "rapido", rot: "entrada rápida" }); cod = t.cod; keys = ["ckTar"]; }
  if (tp === "r") { const r = { id: uid(), cod: ckCod("R"), desc: o.texto, projeto: o.projeto, prob: 3, imp: 3, gatilho: "", dono: o.resp || ckEquipe().find(m => m.eu)?.id || "", mitig: "", status: "aberto", criado: TODAY, tarefas: [], origem: { k: "rapido" } }; ckA("ckRisk").push(r); cod = r.cod; keys = ["ckRisk"]; }
  if (tp === "p") { const p = { id: uid(), cod: ckCod("P"), titulo: o.texto, desc: "", projeto: o.projeto, sev: o.prio || "média", status: "aberto", resp: o.resp, prazo: o.prazo, criado: TODAY, solucoes: [], escolhida: "", tarefas: [] }; ckA("ckIss").push(p); cod = p.cod; keys = ["ckIss"]; }
  if (tp === "d") { const x = { id: uid(), cod: ckCod("D"), data: TODAY, titulo: trunc(o.texto, 90), decisao: o.texto, justificativa: "", alternativas: "", norma: "", projeto: o.projeto, quem: o.resp || "eu", status: "vigente" }; ckA("ckDec").push(x); cod = x.cod; keys = ["ckDec"]; }
  if (tp === "e") { const e = { id: uid(), cod: ckCod("E"), data: o.prazo && o.prazo <= TODAY ? o.prazo : TODAY, at: Date.now(), tipo: ckLogTipo(o.texto), texto: o.texto, projeto: o.projeto }; ckA("ckLog").push(e); cod = e.cod; keys = ["ckLog"]; }
  $("#ckq")?.close(); touch(...keys, "ck", { label: `${CK_QT[tp]} ${cod}` }); toast(`${CK_QT[tp]} ${cod} registrado(a)`, { l: "Ver", f: () => { if (tp === "t") ckTarForm(ckTarRef(cod)?.id); else setHash("trabalho", { r: "riscos", p: "problemas", d: "decisoes", e: "log" }[tp]); } });
}
document.addEventListener("keydown", e => { if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyN") { e.preventDefault(); ckQuickOpen(); } });

/* ---------------------------------------------------------------- arrastar no Kanban */
document.addEventListener("dragstart", e => { const c = e.target.closest?.(".ckcard[draggable]"); if (!c) return; CK.drag = c.dataset.cktask; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", CK.drag); } catch {} c.classList.add("dragging"); });
document.addEventListener("dragend", e => { e.target.closest?.(".ckcard")?.classList.remove("dragging"); $$(".ckcol.over").forEach(x => x.classList.remove("over")); });
document.addEventListener("dragover", e => { const col = e.target.closest?.(".ckcol"); if (!col || !CK.drag) return; e.preventDefault(); $$(".ckcol.over").forEach(x => x !== col && x.classList.remove("over")); col.classList.add("over"); });
document.addEventListener("drop", e => { const col = e.target.closest?.(".ckcol"); if (!col || !CK.drag) return; e.preventDefault(); ckSetStatus(CK.drag, col.dataset.ckcol); CK.drag = null; });
function ckSetStatus(id, st) {
  const t = ckT().find(x => x.id === id); if (!t || !ckMarca(t, st)) return; touch("ckTar", { label: `${t.cod}: ${st}` });
}

/* ---------------------------------------------------------------- ações */
function ckClick(t) {
  if (ckDashClick(t)) return true;
  const ds = t.dataset, a = ds.act;
  if (ds.cktask && !t.closest(".ckacts") && !ds.ckdone) { ckTarForm(ds.cktask); return true; }
  if (ds.ckdone) { const x = ckT().find(z => z.id === ds.ckdone); if (x) ckSetStatus(x.id, ckOpen(x) ? "concluída" : "a fazer"); return true; }
  if (ds.ckmv) { const [id, d] = ds.ckmv.split("|"), x = ckT().find(z => z.id === id); if (x) ckSetStatus(id, CK_STATUS[clamp(CK_STATUS.indexOf(x.status) + +d, 0, CK_STATUS.length - 1)]); return true; }
  if (ds.ckpessoa != null && ds.ckpessoa !== "") { CK.pessoa = ds.ckpessoa; if (SUB !== "pessoa") setHash("trabalho", "pessoa"); else render(); return true; }
  if (ds.ckmemb != null) { ckMembForm(ds.ckmemb); return true; }
  if (ds.ckproj != null) { ckProjForm(ds.ckproj); return true; }
  if (ds.ckmarco != null) { ckMarcoForm(ds.ckmarco); return true; }
  if (ds.cksort) { CK.sort = ds.cksort; render(); return true; }
  if (ds.ckwk != null) { CK.wk = ds.ckwk === "0" ? 0 : (CK.wk || 0) + +ds.ckwk; render(); return true; }
  if (ds.ckmes != null) { CK.mes = ds.ckmes === "0" ? null : addMonth(CK.mes || mkey(TODAY), +ds.ckmes); render(); return true; }
  if (ds.ckatrib) { const [tid, mid, rv] = ds.ckatrib.split("|"), x = ckT().find(z => z.id === tid); if (x) { const antes = { resp: x.resp }; x.resp = mid; if (rv && !x.revisor) x.revisor = rv; (x.hist ||= []).push({ at: Date.now(), por: "você", antes, depois: { resp: mid }, motivo: "delegação sugerida" }); CK.deleg = ""; touch("ckTar", { label: `${x.cod} delegada a ${ckMN(mid)}` }); undoToast(`${x.cod} → ${ckMN(mid)}`); } return true; }
  if (ds.ckpditr) { const p = ckPdi(ds.ckpditr), tr = CK_TRILHAS[p.trilha]; if (tr) { p.comps = tr.comps.map(([n, d]) => ({ id: uid(), nome: n, desc: d, tags: tr.tags, nivel: 0, alvo: 3, hist: [{ data: TODAY, nivel: 0 }] })); touch("ck", { label: "Trilha carregada" }); } return true; }
  if (ds.ckcompadd) { const v = $("#ck_compn")?.value.trim(); if (!v) return true; ckPdi(ds.ckcompadd).comps.push({ id: uid(), nome: v.slice(0, 80), desc: "", tags: [], nivel: 0, alvo: 3, hist: [{ data: TODAY, nivel: 0 }] }); touch("ck", { label: "Competência" }); return true; }
  if (ds.ckcompdel) { const [m, id] = ds.ckcompdel.split("|"), p = ckPdi(m); p.comps = p.comps.filter(x => x.id !== id); touch("ck", { label: "Competência removida" }); return true; }
  if (ds.ckmetaadd) { const v = $("#ck_metan")?.value.trim(); if (!v) return true; ckPdi(ds.ckmetaadd).metas.push({ id: uid(), txt: v.slice(0, 200), prazo: $("#ck_metap")?.value || "", feito: false }); touch("ck", { label: "Meta do PDI" }); return true; }
  if (ds.ckmeta) { const [m, id] = ds.ckmeta.split("|"), x = ckPdi(m).metas.find(z => z.id === id); if (x) { x.feito = !x.feito; x.em = x.feito ? TODAY : ""; touch("ck", { label: "Meta do PDI" }); } return true; }
  if (ds.ck1a1) { CK.meet = { tipo: "1a1", membro: ds.ck1a1, data: TODAY, pauta: ckPauta1a1(ds.ck1a1).join("\n"), notas: "", feedback: [], acoes: [] }; render(); return true; }
  if (ds.ckprep) { const m = ckM(ds.ckprep); ckAsk(`Prepare o meu próximo 1:1 com ${m?.nome}: o que celebrar, o que cobrar e como, o feedback (reconhecimento e ajuste) com exemplos concretos dos dados, o próximo passo do PDI dela e as perguntas que eu devo fazer. Considere a carga e as tarefas atuais.`); return true; }
  if (!a?.startsWith("ck")) return ckClick2(t);
  if (a === "ckchat") { CK.chat = !CK.chat; CK_LS("chat", CK.chat ? "1" : "0"); render(); if (CK.chat) setTimeout(() => $("#m_in")?.focus({ preventScroll: true }), 40); return true; }
  if (a === "ckquick") { ckQuickOpen(); return true; }
  if (a === "cknova") { ckTarForm(null); return true; }
  if (a === "ckfclear") { CK.f = { proj: "", resp: "", tag: "", q: "", st: "" }; render(); return true; }
  if (a === "ckeis") { CK.eis = !CK.eis; render(); return true; }
  if (a === "cklistamais") { CK.listaN = (CK.listaN || 200) + 200; render(); return true; }
  if (a === "ckkanall") { CK.kanAll = true; render(); return true; }
  if (a === "ckask") { if (CK_ASK[ds.v]) ckAsk(CK_ASK[ds.v]); return true; }
  if (a === "ckapall" || a === "cknoall") { const ps = ckPendentes().map(x => x.p), r = ckDecideMany(ps, a === "ckapall"); toast(a === "ckapall" ? `Aprovadas: ${r.refs.join(", ") || "nenhuma"}${r.falhas.length ? ` · ${r.falhas.length} não aplicadas` : ""}` : "Propostas descartadas"); return true; }
  return ckClick2(t);
}
function ckInput(t) {
  if (t.id === "ck_q") { CK.f.q = t.value; reRender(); return true; }
  if (t.dataset.ckperf) { ckD().perfil[t.dataset.ckperf] = t.value; touch("ck", { noUndo: true, noRender: true }); return true; }
  return ckInput2(t);
}
function ckChange(t) {
  if (ckDashChange(t)) return true;
  const ds = t.dataset;
  if (ds.ckf) { CK.f[ds.ckf] = t.value; render(); return true; }
  if (t.id === "ck_deleg") { CK.deleg = t.value; render(); return true; }
  if (t.id === "ck_pes") { CK.pessoa = t.value; render(); return true; }
  if (ds.ckdonefil != null) { CK.done = t.checked; render(); return true; }
  if (ds.ckperf) { ckD().perfil[ds.ckperf] = t.value; touch("ck", { label: "Perfil" }); return true; }
  if (ds.cklim) { const c = ckD().cfg, v = t.value.trim(); c.lim = { ...(c.lim || {}) }; if (v === "" || !isNum(+v)) delete c.lim[ds.cklim]; else c.lim[ds.cklim] = +v; touch("ck", { label: "Limite do Cockpit" }); return true; }
  if (ds.ckcfg) { const c = ckD().cfg; c[ds.ckcfg] = ds.ckcfg === "ferias" ? t.value.split(/[,\s]+/).filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)) : ds.ckcfg === "ciclo1a1" ? (+t.value || 14) : t.value.trim(); touch("ck", { label: "Calendário do Cockpit" }); return true; }
  if (ds.ckpdi === "trilha") { ckPdi(ds.m).trilha = t.value; touch("ck", { label: "Trilha do PDI" }); return true; }
  if (ds.ckcomp) { const [m, id, k] = ds.ckcomp.split("|"), x = ckPdi(m).comps.find(z => z.id === id); if (x) { x[k] = +t.value; if (k === "nivel") (x.hist ||= []).push({ data: TODAY, nivel: +t.value }); touch("ck", { label: "PDI" }); } return true; }
  return ckChange2(t);
}
