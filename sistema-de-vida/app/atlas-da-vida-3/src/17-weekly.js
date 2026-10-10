
/* ================================================================ fechamento semanal: o ritual que fecha a semana e abre a próxima */
const FS = { wk: null, step: 0, busy: false, ctl: null };
const FS_STEPS = [["nums", "Números"], ["diario", "Diário"], ["planos", "Planos"], ["reflexao", "Reflexão"], ["proxima", "Próxima semana"], ["carta", "Carta"]];
function fsTarget() {
  const cur = weekStart(TODAY), prev = addDays(cur, -7), dow = parse(TODAY).getDay();
  if (dow === 0) return cur;
  return dow <= 2 && S.fechamentos?.[prev]?.status !== "fechado" ? prev : cur;
}
const fsWk = () => FS.wk || fsTarget();
const wkLabel = wk => `${fmtD(wk)} a ${fmtD(addDays(wk, 6))}`;
function fsDraft(wk = fsWk()) {
  S.fechamentos ||= {};
  return S.fechamentos[wk] || { status: "novo", destaques: [], prioAnt: [...(S.prio || [])].slice(0, 3), prioFeitas: [false, false, false], vitoria: "", naofunc: "", aprendi: "", nota: null, proximas: ["", "", ""], carta: "" };
}
function fsSave(patch, label) { const wk = fsWk(), d = { ...fsDraft(wk), ...patch }; if (d.status === "novo") d.status = "rascunho"; S.fechamentos = { ...(S.fechamentos || {}), [wk]: d }; touch("fechamentos", { label: label || "Fechamento da semana", noRender: true }); }
function weekNums(wk) {
  return memo("wk:" + wk, () => {
    const ds = []; for (let i = 0; i < 7; i++) ds.push(addDays(wk, i)); const days = ds.filter(d => d <= TODAY), D = DAILY(), col = k => days.map(d => { const i = D.idx[d]; return i == null || !D.C[k] ? null : D.C[k][i]; });
    const mk = mkey(addDays(wk, 3)), orcSem = Math.max(0, sum(Object.values(S.orc)) - sum(fixedItems().map(f => f.valor))) * 7 / dim(mk);
    return { days: days.length, bem: avg(col("bem")), sono: avg(col("sono")), estresse: avg(col("estresse")), treinos: sum(col("treino")), hab: avg(col("hab")), gasto: sum(S.lanc.filter(l => l.tipo === "Despesa" && l.data >= wk && l.data <= ds[6] && !isFixed(l)).map(l => l.valor)), orcSem,
      tarefas: S.tarefas.filter(t => t.status === "Concluída" && t.concluida >= wk && t.concluida <= ds[6]).length + ckMinhas(t => t.status === "concluída" && t.concluida >= wk && t.concluida <= ds[6]).length, contatos: S.contatos.filter(c => c.data >= wk && c.data <= ds[6]).length, estudo: sum(S.estudo.filter(e => e.data >= wk && e.data <= ds[6]).map(e => e.horas)),
      entradas: S.diario.filter(e => e.data >= wk && e.data <= ds[6]).length, humorDia: ds.map(d => ({ d, humor: (() => { const i = D.idx[d]; return i == null ? null : D.C.bem[i]; })() })) };
  });
}
function fsSuggest() {
  const R = calcAt(mkey(TODAY)), out = [], add = (t, s) => { t = trunc(String(t || "").trim(), 90); if (t && !out.some(x => norm(x.t) === norm(t))) out.push({ t, s }); };
  for (const mid of MIDS) for (const p of mget(mid).plano?.passos || []) if (!p.feito && (!p.prazo || p.prazo <= addDays(TODAY, 10))) add(p.texto, MENTOR_DEF[mid].nome);
  R.tar.filter(t => t.open && (t.st === "crit" || (t.prio === "Alta" && t.prazo && t.prazo <= addDays(TODAY, 9)))).slice(0, 4).forEach(t => add(t.tarefa, t.st === "crit" ? "tarefa atrasada" : "tarefa de prioridade alta"));
  R.metas.filter(m => m.ativa && m.st === "crit").slice(0, 3).forEach(m => add(m.proximo || `Avançar: ${m.meta}`, "meta em risco"));
  radarAlerts().filter(a => a.st === "crit" && a.tipo !== "sequencia").slice(0, 2).forEach(a => add(a.acao?.[0] && a.tipo !== "meta" ? `${a.acao[0]} (${a.titulo.toLowerCase()})` : a.titulo, "radar"));
  (S.experimentos || []).filter(x => x.status === "ativo").forEach(x => add(`Seguir o experimento: ${x.titulo}`, "experimento"));
  return out.slice(0, 9);
}
function fsLocalLetter(wk, d) {
  const N = weekNums(wk), P = weekNums(addDays(wk, -7)), feitas = (d.prioFeitas || []).filter(Boolean).length, ant = (d.prioAnt || []).filter(Boolean).length;
  const dl = (a, b, f = v => num(v)) => isNum(a) && isNum(b) ? ` (${sgn(a - b, f)} vs semana anterior)` : "";
  const nx = (d.proximas || []).filter(Boolean);
  return [`**Semana de ${wkLabel(wk)}.**${isNum(d.nota) ? ` Nota ${d.nota}/10.` : ""}`,
    [isNum(N.bem) && `Humor médio ${num(N.bem)}${dl(N.bem, P.bem)}`, isNum(N.sono) && `sono ${num(N.sono)} h${dl(N.sono, P.sono)}`, `${plural(N.treinos, "treino", "treinos")}`, isNum(N.hab) && `hábitos em ${pct(N.hab)}`, `${eur(N.gasto)} em gastos variáveis${N.orcSem ? ` para um ritmo de ${eur(N.orcSem)} por semana` : ""}`].filter(Boolean).join(", ") + ".",
    d.vitoria && `**Para celebrar:** ${d.vitoria}`, d.naofunc && `**O que não funcionou:** ${d.naofunc}`, d.aprendi && `**Aprendizado:** ${d.aprendi}`,
    ant ? `Das ${ant} prioridades da semana, você cumpriu ${feitas}.` : "",
    nx.length ? `**Próxima semana:**\n${nx.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""].filter(Boolean).join("\n\n");
}
async function fsAILetter() {
  if (!SAMPLE || FS.busy) return; const wk = fsWk(), d = fsDraft(wk); FS.busy = true; FS.ctl = new AbortController(); render();
  const build = ctx => {
    const N = weekNums(wk), P = weekNums(addDays(wk, -7)), mo = aiAreaOk("Saúde mental"), fi = aiAreaOk("Saúde física"), fin = aiAreaOk("Finanças");
    const ents = aiEntries(S.diario.filter(e => e.data >= wk && e.data <= addDays(wk, 6)).sort((a, b) => a.data.localeCompare(b.data)), ctx), star = new Set(d.destaques || []);
    [mo && "bem", fi && "sono", fi && "treino", "hab", fin && "gasto"].filter(Boolean).forEach(k => aiNote("met", k, ctx));
    const nums = [mo && `humor médio ${num(N.bem)} (semana anterior ${num(P.bem)})`, mo && `estresse ${num(N.estresse)}`, fi && `sono ${num(N.sono)} h (antes ${num(P.sono)})`, fi && `${N.treinos} treinos (antes ${P.treinos})`, `hábitos ${pct(N.hab)} (antes ${pct(P.hab)})`, fin && `gastos variáveis ${eur(N.gasto)} (sem contas fixas) para um ritmo de ${eur(N.orcSem)} por semana`, `${N.tarefas} tarefas concluídas`, `${N.contatos} contatos com pessoas`, `${num(N.estudo)} h de estudo`].filter(Boolean).join("; ");
    return `TAREFA: CARTA DA SEMANA
Você escreve a carta de fechamento da semana de uma pessoa que usa o app pessoal "Atlas da Vida". Português do Brasil, segunda pessoa (você), calorosa e concreta, até 230 palavras, sem clichês de autoajuda e sem inventar nada.
Estrutura em markdown: um parágrafo sobre o que a semana mostrou (com 2 ou 3 números), "**Para celebrar:**", "**Para observar:**" (um padrão, com cuidado), e "**Próxima semana:**" com as prioridades abaixo, cada uma com um primeiro passo pequeno.
Semana de ${wkLabel(wk)}. Números: ${nums}.
Nota que a pessoa deu à semana: ${d.nota ?? "não deu"}/10.
Prioridades da semana: ${(d.prioAnt || []).filter(Boolean).map((p, i) => `${p} (${d.prioFeitas?.[i] ? "cumprida" : "não cumprida"})`).join("; ") || "nenhuma"}.
Vitória: ${d.vitoria || "–"}. O que não funcionou: ${d.naofunc || "–"}. Aprendizado: ${d.aprendi || "–"}.
Próxima semana: ${(d.proximas || []).filter(Boolean).join("; ") || "ainda não definidas (sugira com base nos dados)"}.
${labFacts().join("\n")}
Trechos do diário da semana${star.size ? " (os marcados com ★ a pessoa destacou)" : ""}:
${ents.map(e => `- ${fmtD(e.data)}${star.has(e.id) ? " ★" : ""}${mo ? ` (humor ${e.humor ?? "?"})` : ""}: ${snippet(e, 260)}`).join("\n") || "(nenhum)"}`; };
  try { const r = await aiCall("Fechamento semanal", build, { signal: FS.ctl.signal, modelTier: "default", cache: false, onText: ({ text }) => { const el = $("#fs_carta"); if (el) el.value = text; } }); fsSave({ carta: r.text.trim() }, "Carta da semana"); }
  catch (e) { if (e?.text) fsSave({ carta: e.text }); if (e?.code !== "cancelled") aiError(e); }
  finally { FS.busy = false; render(); }
}
function fsClose() {
  const wk = fsWk(), d = fsDraft(wk), carta = (d.carta || "").trim() || fsLocalLetter(wk, d), nx = (d.proximas || []).map(s => String(s || "").trim());
  const N = weekNums(wk);
  S.fechamentos = { ...S.fechamentos, [wk]: { ...d, carta, status: "fechado", at: Date.now(), nums: { bem: N.bem, sono: N.sono, treinos: N.treinos, hab: N.hab, gasto: N.gasto, tarefas: N.tarefas } } };
  const keys = ["fechamentos"]; if (nx.some(Boolean)) { S.prio = [nx[0] || "", nx[1] || "", nx[2] || ""]; keys.push("prio"); }
  S.diario.push({ id: uid(), data: addDays(wk, 6) <= TODAY ? addDays(wk, 6) : TODAY, hora: nowHM(), titulo: `Fechamento da semana ${wkLabel(wk)}`, texto: `${carta}${nx.some(Boolean) ? `\n\n## Próxima semana\n${nx.filter(Boolean).map(p => `- [ ] ${p}`).join("\n")}` : ""}\n#semana`, humor: null, energia: null, fixado: false, aplicados: [], criado: Date.now(), editado: Date.now(), origem: "fechamento" }); keys.push("diario");
  FS.step = 0; FS.wk = null; touch(...keys, { label: "Semana fechada" }); undoToast("Semana fechada: carta no diário e prioridades atualizadas");
}
function gcalLink() {
  const dia = +(S.cfg.fsDia ?? 0), hora = S.cfg.fsHora || "19:00", d0 = parse(TODAY); let k = (dia - d0.getDay() + 7) % 7; if (k === 0 && nowHM() > hora) k = 7;
  const d = addDays(TODAY, k).replace(/-/g, ""), [h, m] = hora.split(":").map(Number), e = new Date(2000, 0, 1, h, m + 30), t0 = `${pad(h)}${pad(m)}00`, t1 = `${pad(e.getHours())}${pad(e.getMinutes())}00`;
  const by = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][dia];
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Fechamento da semana no Atlas")}&details=${encodeURIComponent("Abra o Atlas da Vida 3 › Fechamento da semana: números, diário, reflexão, carta e prioridades. 15 minutos.")}&dates=${d}T${t0}/${d}T${t1}&recur=${encodeURIComponent("RRULE:FREQ=WEEKLY;BYDAY=" + by)}`;
}
function fsICSZip() {
  const dia = +(S.cfg.fsDia ?? 0), hora = S.cfg.fsHora || "19:00", d0 = parse(TODAY); let k = (dia - d0.getDay() + 7) % 7; if (k === 0) k = 7;
  const d = addDays(TODAY, k).replace(/-/g, ""), [h, m] = hora.split(":").map(Number), by = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][dia], st = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Atlas da Vida 3//PT-BR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:atlas-fechamento-semanal@atlas`, `DTSTAMP:${st}`, `DTSTART:${d}T${pad(h)}${pad(m)}00`, "DURATION:PT30M", `RRULE:FREQ=WEEKLY;BYDAY=${by}`, "SUMMARY:Fechamento da semana no Atlas", "DESCRIPTION:Números\\, diário\\, reflexão\\, carta e prioridades. 15 minutos.", "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Fechamento da semana", "TRIGGER:-PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
  saveFile("atlas-lembrete-semanal.zip", zipFiles([{ name: "atlas-lembrete-semanal.ics", data: icsJoin(ics) }]));
}
function pSemana(R) {
  const wk = fsWk(), d = fsDraft(wk), N = weekNums(wk), P = weekNums(addDays(wk, -7)), closed = d.status === "fechado", step = closed ? -1 : FS.step;
  const hist = Object.entries(S.fechamentos || {}).filter(([, f]) => f.status === "fechado").sort((a, b) => a[0].localeCompare(b[0]));
  const nav = `<div class="fsweek"><button type="button" class="iconbtn" data-fswk="-7" aria-label="Semana anterior">‹</button><div><span class="flbl">Semana</span><b>${wkLabel(wk)}</b>${wk === weekStart(TODAY) ? `<small>em andamento</small>` : ""}</div><button type="button" class="iconbtn" data-fswk="7" aria-label="Próxima semana"${addDays(wk, 7) > TODAY ? " disabled" : ""}>›</button>${closed ? pill("good", "fechada") : d.status === "rascunho" ? pill("warn", "rascunho salvo") : pill("none", "aberta")}</div>`;
  const stepper = `<nav class="fssteps" aria-label="Etapas">${FS_STEPS.map(([k, l], i) => `<button type="button" class="fsst${i === step ? " on" : ""}${i < step ? " done" : ""}" data-fsstep="${i}"${closed ? " disabled" : ""}><i>${i + 1}</i><span>${l}</span></button>`).join("")}</nav>`;
  const k = (c, l, v, a, b, f, up = true, unit = "") => kmini(c, l, v, isNum(a) && isNum(b) ? `${sgn(a - b, f)}${unit} vs semana anterior` : "sem base", isNum(a) && isNum(b) && Math.abs(a - b) > 1e-9 ? ((a > b) === up ? "good" : "crit") : "");
  const sections = [
    () => `<div class="krow">${[k("var(--a-men)", "Humor médio", num(N.bem), N.bem, P.bem, v => num(v)), k("var(--a-fis)", "Sono", isNum(N.sono) ? num(N.sono) + " h" : "–", N.sono, P.sono, v => num(v), true, " h"), k("var(--a-fis)", "Treinos", N.treinos, N.treinos, P.treinos, v => num(v, 0)), k("var(--a-men)", "Hábitos", pct(N.hab), N.hab, P.hab, v => pct(v)), k("var(--a-fin)", "Gastos variáveis", eur(N.gasto), N.gasto, P.gasto, v => eur(v), false), k("var(--accent)", "Tarefas feitas", N.tarefas, N.tarefas, P.tarefas, v => num(v, 0)), k("var(--a-ami)", "Contatos", N.contatos, N.contatos, P.contatos, v => num(v, 0)), k("var(--a-apr)", "Estudo", num(N.estudo) + " h", N.estudo, P.estudo, v => num(v))].join("")}</div>
      <div class="flbl">Humor dia a dia</div>${strip(N.humorDia, "humor", "div")}${N.orcSem ? `<div class="flbl">Gastos variáveis da semana × ritmo do orçamento (sem contas fixas)</div>${bullet([{ l: "Semana", real: N.gasto, plan: N.orcSem, st: N.gasto > N.orcSem ? "crit" : N.gasto > N.orcSem * .85 ? "warn" : "good" }])}` : ""}`,
    () => { const es = S.diario.filter(e => e.data >= wk && e.data <= addDays(wk, 6)).sort((a, b) => a.data.localeCompare(b.data)), star = new Set(d.destaques || []);
      return es.length ? `<p class="muted">Marque com ★ o que merece ficar na carta e na memória desta semana.</p><div class="fsents">${es.map(e => { const v = viewEntry(e); return `<div class="fsent${star.has(e.id) ? " on" : ""}"><button type="button" class="vb${star.has(e.id) ? " on" : ""}" data-fsstar="${e.id}" aria-pressed="${star.has(e.id)}" aria-label="Destacar">${ic("star")}</button>${v ? entryLine(v) : `<div class="bl locked"><span class="bld">${fmtD(e.data)}</span><span class="blt"><b>${ic("lock")}Entrada trancada</b></span></div>`}</div>`; }).join("")}</div>` : `<div class="emptyb">${ic("pen")}<b>Nenhuma entrada nesta semana.</b><span>Escreva agora o que ficou da semana; ela entra no fechamento.</span><button type="button" class="btn sm" data-act="dznew">Escrever</button></div>`; },
    () => { const st = mid => (mget(mid).plano?.passos || []).filter(p => p.prazo && p.prazo >= addDays(wk, -7) && p.prazo <= addDays(wk, 13));
      const exps = (S.experimentos || []).filter(x => x.status === "ativo"), rl = (S.radar?.log || []).filter(x => x.criado >= wk && x.criado <= addDays(wk, 6));
      return `<div class="flbl">Prioridades que você escolheu para esta semana</div>${(d.prioAnt || []).filter(Boolean).length ? `<div class="fsprio">${(d.prioAnt || []).map((p, i) => p ? `<label class="ckl"><input type="checkbox" data-fsfeita="${i}"${d.prioFeitas?.[i] ? " checked" : ""}><span>${esc(p)}</span></label>` : "").join("")}</div>` : `<div class="empty">Nenhuma prioridade registrada para esta semana.</div>`}
        <div class="flbl">Passos dos mentores com prazo perto desta semana</div>${MIDS.flatMap(mid => st(mid).map(p => `<div class="pstep${p.feito ? " done" : ""}"><label class="ckl"><input type="checkbox" data-pstep="${mid}|${p.id}"${p.feito ? " checked" : ""}><span>${esc(p.texto)} <em class="muted">· ${esc(MENTOR_DEF[mid].nome)} · ${fmtD(p.prazo)}</em></span></label></div>`)).join("") || `<div class="empty">Nenhum passo de plano com prazo nesta semana.</div>`}
        ${exps.length ? `<div class="flbl">Experimentos</div>${exps.map(x => { const an = expAnalyze(x), bd = an.rows.filter(r => r.c === "B" && r.d >= wk && r.d <= addDays(wk, 6) && r.past); return `<div class="li"><span class="t">${esc(x.titulo)}<span class="m">${bd.length ? `${bd.filter(r => r.ad === 1).length} de ${bd.length} dias COM seguidos nesta semana` : "sem dias COM nesta semana"}</span></span>${vpill(an)}</div>`; }).join("")}` : ""}
        ${rl.length ? `<div class="flbl">Alertas do radar emitidos na semana</div>${rl.map(x => `<div class="li"><span class="t">${esc(x.titulo)}</span>${pill(x.status === "confirmado" ? "crit" : x.status === "nao" ? "good" : "none", { confirmado: "aconteceu", nao: "não aconteceu", aberto: "aguardando", fato: "fato", "sem dados": "sem dados" }[x.status] || x.status)}</div>`).join("")}` : ""}`; },
    () => `<div class="form f1"><label>Vitória da semana<textarea id="fs_vitoria" rows="2" data-fsf="vitoria" placeholder="O que deu certo, mesmo que pequeno">${esc(d.vitoria)}</textarea></label><label>O que não funcionou<textarea id="fs_naofunc" rows="2" data-fsf="naofunc" placeholder="Sem culpa: o que travou e por quê">${esc(d.naofunc)}</textarea></label><label>O que aprendi<textarea id="fs_aprendi" rows="2" data-fsf="aprendi" placeholder="Uma frase que você quer lembrar">${esc(d.aprendi)}</textarea></label>
      <label>Nota da semana <output id="fs_notao">${d.nota ?? "–"}</output>/10<input id="fs_nota" type="range" min="1" max="10" step="1" value="${d.nota ?? 6}" data-fsf="nota"></label></div>`,
    () => { const sg = fsSuggest(); return `<div class="form f1">${[0, 1, 2].map(i => `<label>Prioridade ${i + 1}<input id="fs_p${i}" data-fsp="${i}" value="${esc(d.proximas?.[i] || "")}" placeholder="O que mais importa na próxima semana"></label>`).join("")}</div>
      ${sg.length ? `<div class="flbl">Sugestões a partir dos seus dados</div><div class="fssug">${sg.map((s, i) => `<button type="button" class="qchip" data-fssug="${i}">${esc(s.t)} <small>${esc(s.s)}</small></button>`).join("")}</div>` : ""}`; },
    () => `<p class="muted">A carta fecha a semana no diário (tag #semana) e as prioridades viram as da semana que começa.</p><textarea id="fs_carta" rows="12" data-fsf="carta" placeholder="Escreva a sua carta, peça para a IA escrever ou monte uma a partir dos números e da reflexão.">${esc(d.carta || "")}</textarea>
      <div class="row wrap">${FS.busy ? `<button type="button" class="btn" data-act="fsstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn" data-act="fsai"${SAMPLE && !AI_OFF ? "" : " disabled"}>${ic("spark")}Escrever com a IA</button>`}<button type="button" class="btn" data-act="fslocal">${ic("pen")}Montar sem IA</button><button type="button" class="btn primary" data-act="fsclose">${ic("check")}Concluir fechamento</button></div>`,
  ];
  const body = closed ? `<div class="fsdone"><div class="row wrap">${pill("good", "Semana fechada")}${isNum(d.nota) ? `<span class="chip">nota ${d.nota}/10</span>` : ""}<span class="chip">${(d.prioFeitas || []).filter(Boolean).length}/${(d.prioAnt || []).filter(Boolean).length || 0} prioridades cumpridas</span><button type="button" class="lnk" data-act="fsreopen">reabrir</button></div><div class="mdx">${md(d.carta)}</div></div>`
    : `${stepper}<div class="fsbody">${sections[step]()}</div><div class="fsnav"><button type="button" class="btn" data-fsstep="${step - 1}"${step ? "" : " disabled"}>‹ Anterior</button><span class="muted small">${FS_STEPS[step][1]} · ${step + 1} de ${FS_STEPS.length}</span>${step < FS_STEPS.length - 1 ? `<button type="button" class="btn primary" data-fsstep="${step + 1}">Próximo ›</button>` : "<span></span>"}</div>`;
  const notas = hist.slice(-12), done = notas.map(([, f]) => (f.prioAnt || []).filter(Boolean).length ? (f.prioFeitas || []).filter(Boolean).length / (f.prioAnt || []).filter(Boolean).length : null);
  return `<p class="lead">Quinze minutos para fechar a semana: o que os números mostram, o que o diário guardou, o que você cumpriu, o que aprendeu e o que importa na próxima. Termina numa carta no diário e nas três prioridades da semana nova.</p>
    <div class="g2c">${panel(`${ic("week")}Fechamento`, nav + body, { cls: "span2 fspanel" })}
      ${vis("fshist", "Semanas fechadas", notas.length ? colChart(notas.map(([wk]) => fmtD(wk)), [{ name: "Nota da semana", color: "var(--accent)", data: notas.map(([, f]) => f.nota ?? 0) }], { h: 180, legend: false, w: 520, line: [{ name: "Prioridades cumpridas (× 10)", color: "var(--good)", data: done.map(v => v == null ? null : v * 10), fmt: v => pct(v / 10) }], fmt: v => num(v, 0) }) : emptyChart("Feche a primeira semana para começar o histórico."), { sub: `${hist.length} semanas fechadas · ${pct(avg(done.filter(isNum)))} das prioridades cumpridas em média` })}
      ${panel(`${ic("clock")}Lembrete semanal`, `<p class="muted">O Atlas não manda notificações sozinho. Coloque o ritual na sua agenda:</p><div class="form f2"><label>Dia<select id="fs_dia" data-cfg="fsDia">${DOWL.map((n, i) => `<option value="${i}"${+(S.cfg.fsDia ?? 0) === i ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>Hora<input id="fs_hora" type="time" data-cfg="fsHora" value="${S.cfg.fsHora || "19:00"}"></label></div>
        <div class="row wrap"><a class="btn sm primary" href="${esc(gcalLink())}" target="_blank" rel="noopener">${ic("cal")}Criar no Google Agenda</a><button type="button" class="btn sm" data-act="fsics">${ic("download")}Arquivo de agenda (.ics em .zip)</button></div><p class="note">${ic("info")}<span>O link abre o Google Agenda com o evento semanal pronto. O arquivo .ics (dentro do .zip) serve para Apple Calendar e Outlook.</span></p>`)}
      ${panel(`${ic("book")}Cartas anteriores`, hist.length ? `<div class="list">${[...hist].reverse().slice(0, 8).map(([wk, f]) => `<details class="fsold"><summary><b>${wkLabel(wk)}</b> <span class="muted">${isNum(f.nota) ? `nota ${f.nota} · ` : ""}${(f.prioFeitas || []).filter(Boolean).length}/${(f.prioAnt || []).filter(Boolean).length} prioridades</span></summary><div class="mdx">${md(f.carta)}</div></details>`).join("")}</div>` : `<div class="empty">Nenhuma semana fechada ainda.</div>`, { cls: "span2" })}</div>`;
}
function weekClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.fswk) { FS.wk = addDays(fsWk(), +ds.fswk); if (FS.wk > TODAY) FS.wk = weekStart(TODAY); FS.step = 0; render(); return true; }
  if (ds.fsstep != null) { FS.step = clamp(+ds.fsstep, 0, FS_STEPS.length - 1); render(); return true; }
  if (ds.fsstar) { const d = fsDraft(), s = new Set(d.destaques || []); s.has(ds.fsstar) ? s.delete(ds.fsstar) : s.add(ds.fsstar); fsSave({ destaques: [...s] }, "Destaque da semana"); render(); return true; }
  if (ds.fsfeita != null) { const d = fsDraft(), f = [...(d.prioFeitas || [false, false, false])]; f[+ds.fsfeita] = t.checked; fsSave({ prioFeitas: f }, "Prioridade cumprida"); return true; }
  if (ds.fssug != null) { const s = fsSuggest()[+ds.fssug]; if (!s) return true; const d = fsDraft(), p = [...(d.proximas || ["", "", ""])]; const i = p.findIndex(x => !String(x || "").trim()); if (i < 0) { toast("As três prioridades já estão preenchidas. Apague uma para trocar."); return true; } p[i] = s.t; fsSave({ proximas: p }, "Prioridade sugerida"); render(); return true; }
  if (a === "fsai") { fsAILetter(); return true; }
  if (a === "fsstop") { FS.ctl?.abort(); return true; }
  if (a === "fslocal") { const wk = fsWk(); fsSave({ carta: fsLocalLetter(wk, fsDraft(wk)) }, "Carta montada"); render(); return true; }
  if (a === "fsclose") { fsClose(); return true; }
  if (a === "fsreopen") { const wk = fsWk(), d = fsDraft(wk); S.fechamentos = { ...S.fechamentos, [wk]: { ...d, status: "rascunho" } }; FS.step = 5; touch("fechamentos", { label: "Fechamento reaberto" }); return true; }
  if (a === "fsics") { fsICSZip(); return true; }
  return false;
}
function weekChange(t) {
  if (t.dataset.fsf) { const f = t.dataset.fsf, v = f === "nota" ? +t.value : t.value; fsSave({ [f]: v }, "Fechamento da semana"); if (f === "nota") { const o = $("#fs_notao"); if (o) o.textContent = v; } return true; }
  if (t.dataset.fsp != null) { const d = fsDraft(), p = [...(d.proximas || ["", "", ""])]; p[+t.dataset.fsp] = t.value.trim(); fsSave({ proximas: p }, "Prioridade da próxima semana"); return true; }
  return false;
}
function weekInput(t) { if (t.id === "fs_nota") { const o = $("#fs_notao"); if (o) o.textContent = t.value; return true; } return false; }
/* o que os mentores ficam sabendo do laboratório (respeitando a privacidade) */
function labFacts(area) {
  const L = [], exps = (S.experimentos || []).filter(x => (!area || metricArea(x.metrica) === area) && aiMetricOk(x.metrica));
  const done = exps.filter(x => x.status === "concluido"), act = exps.filter(x => x.status === "ativo");
  if (done.length) L.push("Experimentos concluídos pela pessoa (lições sobre ela mesma):\n" + done.slice(-6).map(x => `- ${x.titulo}: ${x.conclusao || expAnalyze(x).vt}`).join("\n"));
  if (act.length) L.push("Experimentos em andamento: " + act.map(x => `${x.titulo} (dia ${expDayN(x)} de ${x.dias}, medindo ${expMetricL(x.metrica)})`).join("; ") + ". Não proponha mudanças que atrapalhem o teste.");
  if (!area) { const fs = Object.entries(S.fechamentos || {}).filter(([, f]) => f.status === "fechado").sort((a, b) => a[0].localeCompare(b[0])).slice(-2); if (fs.length) L.push("Fechamentos semanais recentes:\n" + fs.map(([wk, f]) => `- Semana de ${fmtD(wk)}: nota ${f.nota ?? "–"}/10; cumpriu ${(f.prioFeitas || []).filter(Boolean).length} de ${(f.prioAnt || []).filter(Boolean).length} prioridades; aprendizado: ${f.aprendi || "–"}`).join("\n")); }
  const al = radarAlerts().filter(a => (!area || a.area === area) && aiAreaOk(a.area) && a.tipo !== "sequencia").slice(0, 4); if (al.length) L.push("Alertas do radar agora: " + al.map(a => `${a.titulo} (${a.texto})`).join(" "));
  return L;
}
