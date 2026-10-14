/* ================================================================ finanças: projetos futuros e aquisições, saldo diário e origem dos dados
   Plano sustentável: primeiro a reserva de emergência, depois os projetos por prioridade e prazo, usando só uma parte da sobra
   média; parcelas somadas não passam de um teto da renda; desejos não são financiados. Números, não opiniões: cada projeto
   mostra quanto falta, quanto precisa por mês, quanto cabe e quando fica pronto se não couber. */
const PJ = { edit: null, open: null, busy: null, ctl: null, f: {} };
const PJ_PRIO = [["essencial", "Essencial", "var(--crit)"], ["importante", "Importante", "var(--warn)"], ["desejo", "Desejo", "var(--a-apr)"]];
const PJ_CAT = ["Casa", "Mobilidade", "Educação", "Viagem", "Família", "Saúde", "Tecnologia", "Trabalho", "Outro"];
const PJ_FORMA = [["poupar", "Juntar e pagar à vista"], ["financiar", "Financiar"], ["misto", "Entrada + financiamento"]];
const PJ_ST = [["planejando", "Planejando"], ["poupando", "Juntando"], ["andamento", "Em andamento"], ["pausado", "Pausado"], ["concluido", "Concluído"]];
const pjs = () => (S.projetos ||= []);
const pjCfg = () => ({ usoSobra: S.cfg.usoSobra ?? .7, maxParcela: S.cfg.maxParcela ?? .3, metaReserva: S.cfg.metaReserva ?? 6 });
const pjMonths = (a, b) => { const x = parse(a), y = parse(b); return (y.getFullYear() - x.getFullYear()) * 12 + y.getMonth() - x.getMonth(); };
function pjPMT(pv, taxaAno, n) { if (!(pv > 0) || !(n > 0)) return 0; const i = (+taxaAno || 0) / 100 / 12; return i ? pv * i / (1 - Math.pow(1 + i, -n)) : pv / n; }
/* capacidade: médias dos últimos 6 meses completos com lançamentos */
function pjCap() {
  return memo("pjcap", () => {
    const ms = []; for (let k = 1; k <= 12 && ms.length < 6; k++) { const mk = addMonth(mkey(TODAY), -k), F = calcAt(mk).fin; if (F.rec || F.desp) ms.push({ mk, rec: F.rec, desp: F.desp, apo: F.apo || 0 }); }
    const rec = ms.length ? avg(ms.map(m => m.rec)) : 0, desp = ms.length ? avg(ms.map(m => m.desp)) : 0, sobra = rec - desp;
    const R = calcAt(mkey(TODAY)), pk = Object.keys(S.patr || {}).sort(), last = pk.length ? S.patr[pk.at(-1)] : {};
    const reserva = +last.reserva || 0, dividas = avg(ms.map(m => sum(S.lanc.filter(l => l.tipo === "Despesa" && l.cat === "Dívidas & financiamentos" && mkey(l.data || "") === m.mk).map(l => +l.valor || 0)))) || 0;
    const C = pjCfg(), alvoRes = C.metaReserva * desp, gapRes = Math.max(0, alvoRes - reserva);
    return { meses: ms.length, rec, desp, sobra, reserva, alvoRes, gapRes, resMeses: desp ? reserva / desp : null, dividas, livre: Math.max(0, sobra) * C.usoSobra, R };
  });
}
/* alocação: reserva primeiro (completar em 12 meses), depois projetos por prioridade e prazo */
function pjPlan() {
  return memo("pjplan", () => {
    const C = pjCfg(), cap = pjCap(); let livre = cap.livre;
    const res = cap.gapRes > 0 ? Math.min(livre, cap.gapRes / 12) : 0; livre -= res;
    const rank = p => PJ_PRIO.findIndex(x => x[0] === p.prio), ativos = pjs().filter(p => p.status !== "concluido" && p.status !== "pausado").sort((a, b) => rank(a) - rank(b) || (a.prazo || "9999").localeCompare(b.prazo || "9999"));
    let parcelas = 0; const out = {};
    for (const p of ativos) {
      const guardado = sum((p.aportes || []).map(a => +a.valor || 0)), valor = +p.valor || 0, fin = p.forma === "poupar" ? 0 : Math.max(0, valor - (+p.entrada || 0)), aJuntar = p.forma === "financiar" ? Math.min(valor, +p.entrada || 0) : p.forma === "misto" ? Math.min(valor, +p.entrada || 0) : valor;
      const falta = Math.max(0, aJuntar - guardado), meses = p.prazo ? Math.max(1, pjMonths(TODAY, p.prazo)) : 12, precisa = falta / meses, aloc = Math.min(precisa, livre); livre -= aloc;
      const parcela = fin ? pjPMT(fin, p.taxa, +p.parcelas || 0) : 0, juros = parcela ? parcela * (+p.parcelas || 0) - fin : 0; parcelas += parcela;
      const mesesReais = falta <= 0 ? 0 : aloc > 0 ? Math.ceil(falta / aloc) : null, pronto = mesesReais == null ? null : addDays(iso(new Date(parse(TODAY).getFullYear(), parse(TODAY).getMonth() + mesesReais, Math.min(28, parse(TODAY).getDate()))), 0);
      const alertas = [];
      if (fin && p.prio === "desejo") alertas.push(`Financiar um desejo custa ${eur(juros)} em juros; juntar antes sai mais barato.`);
      if (cap.gapRes > 0 && p.prio !== "essencial") alertas.push(`A reserva de emergência ainda não está completa (${cap.resMeses == null ? "–" : num(cap.resMeses, 1)} de ${C.metaReserva} meses de despesas).`);
      if (fin && !(+p.parcelas > 0)) alertas.push("Defina o número de parcelas para calcular o financiamento.");
      out[p.id] = { guardado, valor, fin, aJuntar, falta, meses, precisa, aloc, parcela, juros, mesesReais, pronto, alertas };
    }
    const tetoParc = cap.rec * C.maxParcela, comprom = cap.dividas + parcelas;
    for (const p of ativos) { const x = out[p.id]; const parcOk = !x.parcela || comprom <= tetoParc;
      x.st = !parcOk ? "crit" : x.falta <= 0 ? "good" : x.aloc >= x.precisa - .005 ? (x.alertas.length ? "warn" : "good") : x.aloc >= x.precisa * .6 ? "warn" : "crit";
      if (!parcOk) x.alertas.unshift(`As parcelas somadas (${eur(comprom)}/mês) passariam de ${pct(C.maxParcela)} da renda média (${eur(tetoParc)}).`); }
    return { cap, res, livreFinal: livre, parcelas, comprom, tetoParc, por: out, ativos };
  });
}
const pjStTxt = { good: "cabe no plano", warn: "apertado", crit: "não cabe assim" };
function pjCard(p, P) {
  const x = P.por[p.id], pr = PJ_PRIO.find(z => z[0] === p.prio) || PJ_PRIO[1], st = PJ_ST.find(z => z[0] === p.status)?.[1] || "Planejando", open = PJ.open === p.id;
  const prog = x ? (x.aJuntar ? Math.min(1, x.guardado / x.aJuntar) : 1) : (p.status === "concluido" ? 1 : 0), et = p.etapas || [];
  return `<article class="pjc pn${open ? " open" : ""}" style="--c:${pr[2]}"><header><div><span class="crumb">${esc(p.tipo === "aquisicao" ? "Aquisição" : "Projeto")} · ${esc(p.cat || "Outro")} · ${esc(st)}</span><h3>${esc(p.nome)}</h3></div>${x ? pill(x.st, pjStTxt[x.st]) : pill("none", st)}</header>
    <div class="dwrow">${ring(prog, pr[2], 64, 7)}<div class="pjnums">
      <div><span class="flbl">Valor</span><b>${eur(+p.valor || 0)}</b></div>
      <div><span class="flbl">Prazo</span><b>${p.prazo ? fmtDY(p.prazo) : "sem data"}</b></div>
      ${x ? `<div><span class="flbl">Juntado</span><b>${eur(x.guardado)}</b><small>de ${eur(x.aJuntar)}</small></div>
      <div><span class="flbl">Precisa por mês</span><b>${eur(x.precisa)}</b><small>cabem ${eur(x.aloc)}</small></div>
      ${x.fin ? `<div><span class="flbl">Parcela</span><b>${eur(x.parcela, 2)}</b><small>${+p.parcelas || "?"}× · juros ${eur(x.juros)}</small></div>` : ""}
      <div><span class="flbl">Fica pronto</span><b>${x.falta <= 0 ? "juntado" : x.pronto ? fmtD(x.pronto) + "/" + x.pronto.slice(2, 4) : "sem capacidade"}</b>${x.pronto && p.prazo && x.pronto > p.prazo ? `<small class="st-crit">${plural(pjMonths(p.prazo, x.pronto), "mês", "meses")} depois do prazo</small>` : ""}</div>` : ""}
    </div></div>
    ${x?.alertas.length ? `<ul class="pjal">${x.alertas.map(a => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}
    ${et.length ? `<div class="flbl">Etapas</div><div class="pjet">${et.map(e => `<label class="ckl"><input type="checkbox" data-pjetapa="${p.id}|${e.id}"${e.feito ? " checked" : ""}><span>${esc(e.nome)} <em class="muted">${e.valor ? eur(+e.valor) : ""}${e.data ? " · " + fmtDY(e.data) : ""}</em></span></label>`).join("")}</div>` : ""}
    <div class="row wrap"><button type="button" class="btn sm" data-act="pjopen" data-id="${p.id}">${ic(open ? "check" : "spark")}${open ? "Fechar" : "Aportes e mentoria"}</button><button type="button" class="btn sm ghost" data-act="pjedit" data-id="${p.id}">${ic("edit")}Editar</button></div>
    ${open ? pjOpen(p, x) : ""}</article>`;
}
function pjOpen(p, x) {
  const ap = [...(p.aportes || [])].sort((a, b) => b.data.localeCompare(a.data)), mt = [...(p.mentor || [])].sort((a, b) => b.at - a.at), ai = SAMPLE && !AI_OFF;
  return `<div class="pjopen"><div class="flbl">Aportes no projeto</div><div class="row wrap"><input type="number" step="0.01" min="0" id="pjap_${p.id}" placeholder="Valor" aria-label="Valor do aporte"><input type="date" id="pjapd_${p.id}" value="${TODAY}" aria-label="Data do aporte"><button type="button" class="btn sm primary" data-act="pjaporte" data-id="${p.id}">${ic("plus")}Registrar aporte</button></div>
    ${ap.length ? `<div class="list">${ap.slice(0, 8).map(a => `<div class="li"><span class="t">${fmtDY(a.data)}</span><b>${eur(+a.valor, 2)}</b><button type="button" class="vb" data-act="pjapdel" data-id="${p.id}" data-ap="${a.id}" aria-label="Apagar aporte">${ic("trash")}</button></div>`).join("")}</div>` : `<p class="muted small">Nenhum aporte ainda.</p>`}
    <div class="flbl">Mentoria · Mentor do Dinheiro</div>
    <div class="row wrap">${PJ.busy === p.id ? `<button type="button" class="btn sm" data-act="pjstop">${ic("stop")}Parar</button>` : `<button type="button" class="btn sm" data-act="pjai" data-id="${p.id}"${ai ? "" : " disabled"}>${ic("spark")}Pedir orientação ao mentor</button>`}<a class="lnk" href="#mentor.fin">conversar com o mentor</a></div>
    <div class="form f1"><label>Sua anotação ou orientação recebida<textarea rows="2" id="pjnota_${p.id}" placeholder="O que o mentor (ou você) definiu para este projeto"></textarea></label></div><div class="row"><button type="button" class="btn sm" data-act="pjnota" data-id="${p.id}">${ic("check")}Guardar anotação</button></div>
    ${mt.length ? `<div class="pjmt">${mt.slice(0, 6).map(m => `<div class="pjmi"><small class="muted">${fmtDY(iso(new Date(m.at)))} · ${m.origem === "ia" ? "Mentor do Dinheiro" : "você"}</small><div class="mdx">${md(m.texto)}</div></div>`).join("")}</div>` : ""}</div>`;
}
function pjForm() {
  const p = PJ.edit === "novo" ? {} : pjs().find(z => z.id === PJ.edit) || {}, f = PJ.f;
  const v = (k, d = "") => esc(f[k] ?? p[k] ?? d), et = f.etapas ?? (p.etapas || []).map(e => `${e.nome}; ${e.valor || ""}; ${e.data || ""}`).join("\n");
  const sel = (k, opts, d) => `<select id="pj_${k}" data-pjf="${k}">${opts.map(([val, l]) => `<option value="${val}"${(f[k] ?? p[k] ?? d) === val ? " selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  return panel(`${ic("plus")}${PJ.edit === "novo" ? "Novo projeto ou aquisição" : "Editar " + esc(p.nome || "")}`, `<div class="form f3">
    <label class="full">Nome<input id="pj_nome" data-pjf="nome" value="${v("nome")}" placeholder="Ex.: carro usado, mestrado, entrada do apartamento"></label>
    <label>Tipo${sel("tipo", [["aquisicao", "Aquisição"], ["projeto", "Projeto"]], "aquisicao")}</label><label>Categoria${sel("cat", PJ_CAT.map(c => [c, c]), "Outro")}</label><label>Prioridade${sel("prio", PJ_PRIO.map(z => [z[0], z[1]]), "importante")}</label>
    <label>Valor total (€)<input id="pj_valor" data-pjf="valor" type="number" step="0.01" min="0" value="${v("valor")}"></label><label>Prazo desejado<input id="pj_prazo" data-pjf="prazo" type="date" value="${v("prazo")}"></label><label>Situação${sel("status", PJ_ST, "planejando")}</label>
    <label>Como pagar${sel("forma", PJ_FORMA, "poupar")}</label><label>Entrada (€)<input id="pj_entrada" data-pjf="entrada" type="number" step="0.01" min="0" value="${v("entrada")}" placeholder="se financiar"></label><label>Juros (% ao ano)<input id="pj_taxa" data-pjf="taxa" type="number" step="0.01" min="0" value="${v("taxa")}" placeholder="ex.: 7,9"></label>
    <label>Parcelas<input id="pj_parcelas" data-pjf="parcelas" type="number" step="1" min="0" value="${v("parcelas")}" placeholder="ex.: 48"></label>
    <label class="full">Etapas (uma por linha: nome; valor; data)<textarea id="pj_etapas" data-pjf="etapas" rows="3" placeholder="Pesquisar e escolher; ; 2026-12-01&#10;Dar a entrada; 3000; 2027-03-01">${esc(et)}</textarea></label>
    <label class="full">Notas<input id="pj_notas" data-pjf="notas" value="${v("notas")}"></label></div>
    <div class="row wrap"><button type="button" class="btn primary" data-act="pjsave">${ic("check")}Salvar</button><button type="button" class="btn" data-act="pjcancel">Cancelar</button>${PJ.edit !== "novo" ? `<button type="button" class="btn ghost" data-act="pjdel" data-id="${p.id}">${ic("trash")}Apagar</button>` : ""}</div>`, { cls: "span2 pjform" });
}
function pjTimeline(P) {
  const ps = pjs().filter(p => p.prazo || P.por[p.id]?.pronto); if (!ps.length) return emptyChart("Projetos com prazo aparecem aqui numa linha do tempo.");
  const n = 36, W = 900, L = 170, Rr = 14, rowH = 30, H = 30 + ps.length * rowH, X = m => L + m * (W - L - Rr) / n, m0 = mkey(TODAY);
  let g = ""; for (let m = 0; m <= n; m += 3) { const mk = addMonth(m0, m); g += `<line x1="${X(m).toFixed(1)}" x2="${X(m).toFixed(1)}" y1="18" y2="${H - 4}" class="gl"/><text x="${X(m).toFixed(1)}" y="12" class="ax" text-anchor="middle">${mabbr(mk)}/${mk.slice(2, 4)}</text>`; }
  ps.forEach((p, i) => { const x = P.por[p.id], y = 26 + i * rowH, pr = PJ_PRIO.find(z => z[0] === p.prio) || PJ_PRIO[1], fim = p.prazo ? Math.min(n, Math.max(0, pjMonths(TODAY, p.prazo))) : null, pronto = x?.pronto ? Math.min(n, Math.max(0, pjMonths(TODAY, x.pronto))) : null, end = Math.max(fim ?? 0, pronto ?? 0);
    g += `<text x="${L - 8}" y="${y + 14}" text-anchor="end" class="ax pjtl">${esc(trunc(p.nome, 24))}</text><rect x="${X(0)}" y="${y + 4}" width="${Math.max(3, X(end) - X(0)).toFixed(1)}" height="14" rx="4" fill="${pr[2]}" fill-opacity=".22"/>`;
    if (pronto != null) g += `<rect x="${X(0)}" y="${y + 4}" width="${Math.max(3, X(pronto) - X(0)).toFixed(1)}" height="14" rx="4" fill="${pr[2]}" fill-opacity=".7"><title>${esc(p.nome)}: pronto em ${x?.pronto || "?"}</title></rect>`;
    if (fim != null) g += `<line x1="${X(fim).toFixed(1)}" x2="${X(fim).toFixed(1)}" y1="${y}" y2="${y + 22}" stroke="var(--ink)" stroke-width="2"><title>Prazo desejado: ${p.prazo}</title></line>`;
    for (const e of p.etapas || []) if (e.data) { const m = pjMonths(TODAY, e.data); if (m >= 0 && m <= n) g += `<circle cx="${X(m).toFixed(1)}" cy="${y + 11}" r="4" fill="${e.feito ? "var(--good)" : "var(--surface)"}" stroke="var(--ink-2)"><title>${esc(e.nome)}${e.data ? " · " + e.data : ""}</title></circle>`; } });
  return `<div class="hscroll">${svgWrap(W, H, g, "Linha do tempo dos projetos: barra escura até quando o plano fica pronto, traço no prazo desejado, bolinhas nas etapas")}</div><div class="legend"><span><i style="background:var(--accent);opacity:.7"></i>pronto pelo plano</span><span><i style="background:var(--ink)"></i>prazo desejado</span><span><i style="background:var(--surface);border:1px solid var(--ink-2)"></i>etapa</span></div>`;
}
function pFinProjetos(R) {
  const P = pjPlan(), c = P.cap, C = pjCfg(), ps = pjs(), ativos = P.ativos, outros = ps.filter(p => !ativos.includes(p));
  return `<p class="lead">Projetos e aquisições dentro de um plano que preserva a saúde financeira: primeiro a reserva de emergência, depois cada projeto pela prioridade e pelo prazo, usando só parte da sobra média. Cada cartão mostra quanto falta, quanto precisa por mês, quanto cabe e quando fica pronto se não couber.</p>
    ${kpiRow([kmini("var(--a-fin)", "Sobra média", eur(c.sobra), `receitas ${eur(c.rec)} − despesas ${eur(c.desp)} · ${plural(c.meses, "mês", "meses")}`, c.sobra < 0 ? "crit" : ""), kmini("var(--good)", "Reserva de emergência", c.resMeses == null ? "–" : `${num(c.resMeses, 1)} meses`, `meta ${C.metaReserva} meses (${eur(c.alvoRes)})`, c.gapRes > 0 ? "warn" : "good"), kmini("var(--accent)", "Livre para projetos", eur(c.livre), `${pct(C.usoSobra)} da sobra · reserva leva ${eur(P.res)}/mês`), kmini("var(--warn)", "Parcelas / renda", c.rec ? pct(P.comprom / c.rec) : "–", `teto ${pct(C.maxParcela)} · ${eur(P.comprom)}/mês`, c.rec && P.comprom > P.tetoParc ? "crit" : "")])}
    <div class="g2c pjg">
      ${finTermometro("span2")}
      ${PJ.edit ? pjForm() : ""}
      ${panel(`${ic("target")}Projetos e aquisições <small>${ps.length}</small>`, `${ps.length ? "" : `<div class="empty">Nenhum projeto ainda. Cadastre o que você quer realizar ou comprar; o plano diz se cabe, quanto juntar por mês e quando fica pronto.</div>`}<div class="row"><button type="button" class="btn primary" data-act="pjnew">${ic("plus")}Novo projeto ou aquisição</button></div>`, { cls: "span2" })}
      ${ativos.map(p => pjCard(p, P)).join("")}
      ${vis("pjtl", "Linha do tempo", pjTimeline(P), { cls: "span2", sub: "próximos 36 meses · barra escura = quando o plano fica pronto · traço = prazo desejado" })}
      ${panel(`${ic("shield")}Regras do plano sustentável`, `<ol class="pjrules"><li><b>Reserva primeiro.</b> Até cobrir ${C.metaReserva} meses de despesas (${eur(c.alvoRes)}), uma parte da sobra vai para ela, para completar em 12 meses.</li><li><b>Só parte da sobra.</b> Projetos usam até ${pct(C.usoSobra)} da sobra média; o resto é folga para imprevistos.</li><li><b>Parcelas com teto.</b> Somadas às dívidas atuais, não passam de ${pct(C.maxParcela)} da renda média.</li><li><b>Não financiar desejos.</b> Juros em algo que perde valor custam mais que esperar.</li><li><b>Prioridade e prazo.</b> Essencial antes de importante, importante antes de desejo; dentro de cada nível, o prazo mais próximo primeiro.</li></ol>
        <div class="form f3"><label>Parte da sobra para projetos<input type="number" step="5" min="0" max="100" data-cfgpct="usoSobra" value="${Math.round(C.usoSobra * 100)}"></label><label>Teto das parcelas (% da renda)<input type="number" step="1" min="0" max="100" data-cfgpct="maxParcela" value="${Math.round(C.maxParcela * 100)}"></label><label>Reserva (meses de despesas)<input type="number" step="1" min="0" max="24" data-cfgn="metaReserva" value="${C.metaReserva}"></label></div>`)}
      ${panel(`${ic("info")}O que o mentor vê`, `<p class="muted">O Mentor do Dinheiro recebe estes projetos, as regras acima e a sua capacidade mensal em toda conversa. Em cada projeto, “Pedir orientação ao mentor” traz uma recomendação específica, que fica guardada no cartão junto com as suas anotações.</p><p class="muted small">${ic("shield")}Cada pedido aparece no registro de Privacidade.</p>`)}
      ${outros.length ? panel(`${ic("check")}Concluídos e pausados <small>${outros.length}</small>`, `<div class="list">${outros.map(p => `<button type="button" class="li click" data-act="pjedit" data-id="${p.id}"><span class="t">${esc(p.nome)}<span class="m">${esc(PJ_ST.find(z => z[0] === p.status)?.[1] || "")} · ${eur(+p.valor || 0)}</span></span></button>`).join("")}</div>`, { cls: "span2" }) : ""}
    </div>`;
}
/* o que o Mentor do Dinheiro fica sabendo dos projetos */
function pjFacts() {
  const P = pjPlan(), c = P.cap, C = pjCfg(); if (!pjs().length) return ["Projetos futuros: nenhum cadastrado."];
  return [`Plano sustentável: sobra média ${eur(c.sobra)}/mês; ${pct(C.usoSobra)} dela vai para projetos (${eur(c.livre)}); reserva ${c.resMeses == null ? "?" : num(c.resMeses, 1)} de ${C.metaReserva} meses${P.res ? `, recebendo ${eur(P.res)}/mês` : ""}; parcelas ${eur(P.comprom)}/mês para teto de ${eur(P.tetoParc)}.`,
    "Projetos e aquisições:\n" + pjs().map(p => { const x = P.por[p.id]; return `- ${p.nome} (${p.prio}, ${p.status || "planejando"}): ${eur(+p.valor || 0)}${p.prazo ? ` até ${p.prazo}` : ""}${x ? `; juntado ${eur(x.guardado)}, precisa ${eur(x.precisa)}/mês, cabem ${eur(x.aloc)}${x.fin ? `, parcela ${eur(x.parcela, 2)} (${p.parcelas}x, juros ${eur(x.juros)})` : ""}, ${pjStTxt[x.st]}` : ""}`; }).join("\n")];
}
async function pjAI(id) {
  const p = pjs().find(z => z.id === id); if (!p || !SAMPLE || PJ.busy) return; PJ.busy = id; PJ.ctl = new AbortController(); render();
  const build = ctx => { const P = pjPlan(), x = P.por[p.id] || {}, c = P.cap; ["rec", "desp", "gasto"].forEach(k => aiNote("met", k, ctx));
    return `TAREFA: MENTOR PROJETO
Você é o Mentor do Dinheiro do app pessoal "Atlas da Vida". Dê orientação concreta sobre UM projeto, em português do Brasil, segunda pessoa, até 220 palavras, em markdown: 1) se cabe hoje e por quê (use os números); 2) o melhor caminho (juntar, financiar ou misto) e o que muda no prazo; 3) três passos práticos com valores; 4) um risco a vigiar. Seja direto e prudente, sem inventar dados.
Projeto: ${p.nome} (${p.tipo === "aquisicao" ? "aquisição" : "projeto"}, ${p.cat}, prioridade ${p.prio}). Valor ${eur(+p.valor || 0)}. Prazo desejado: ${p.prazo || "não definido"}. Forma: ${p.forma}${p.forma !== "poupar" ? `, entrada ${eur(+p.entrada || 0)}, juros ${p.taxa || "?"}% a.a., ${p.parcelas || "?"} parcelas, parcela calculada ${eur(x.parcela || 0, 2)}, juros totais ${eur(x.juros || 0)}` : ""}.
Já juntado: ${eur(x.guardado || 0)}. Precisa por mês: ${eur(x.precisa || 0)}. Cabe no plano: ${eur(x.aloc || 0)}/mês. Fica pronto: ${x.pronto || "sem capacidade"}. Situação: ${pjStTxt[x.st] || "–"}. Alertas: ${(x.alertas || []).join(" ") || "nenhum"}.
Etapas: ${(p.etapas || []).map(e => `${e.nome}${e.valor ? " " + eur(+e.valor) : ""}${e.data ? " em " + e.data : ""}${e.feito ? " (feita)" : ""}`).join("; ") || "nenhuma"}.
Finanças (médias de ${c.meses} meses): receitas ${eur(c.rec)}, despesas ${eur(c.desp)}, sobra ${eur(c.sobra)}. Reserva ${c.resMeses == null ? "?" : num(c.resMeses, 1)} meses (meta ${pjCfg().metaReserva}). Parcelas atuais e previstas ${eur(P.comprom)}/mês, teto ${eur(P.tetoParc)}.
Outros projetos: ${pjs().filter(z => z.id !== p.id).map(z => `${z.nome} (${z.prio}, ${eur(+z.valor || 0)})`).join("; ") || "nenhum"}.
Anotações anteriores: ${(p.mentor || []).slice(-3).map(m => trunc(m.texto, 200)).join(" | ") || "nenhuma"}`; };
  try { const r = await aiCall(`Mentor · ${trunc(p.nome, 40)}`, build, { signal: PJ.ctl.signal, modelTier: "default", cache: false }); p.mentor = [...(p.mentor || []), { at: Date.now(), texto: r.text.trim(), origem: "ia" }]; touch("projetos", { label: "Orientação do mentor", noRender: true }); }
  catch (e) { if (e?.code !== "cancelled") aiError(e); }
  finally { PJ.busy = null; render(); }
}
function pjParseEtapas(t, old = []) {
  return String(t || "").split("\n").map(l => l.trim()).filter(Boolean).map(l => { const [nome, valor, data] = l.split(";").map(s => (s || "").trim()); const o = old.find(e => norm(e.nome) === norm(nome)); return { id: o?.id || uid(), nome, valor: parseNum(valor) || "", data: parseDateAny(data) || "", feito: !!o?.feito }; }).filter(e => e.nome);
}
function pjClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.pjetapa) { const [pid, eid] = ds.pjetapa.split("|"), p = pjs().find(z => z.id === pid), e = p?.etapas?.find(z => z.id === eid); if (e) { e.feito = t.checked; touch("projetos", { label: "Etapa do projeto" }); } return true; }
  if (a === "pjnew") { PJ.edit = "novo"; PJ.f = {}; render(); window.scrollTo({ top: 0 }); return true; }
  if (a === "pjedit") { PJ.edit = ds.id; PJ.f = {}; render(); window.scrollTo({ top: 0 }); return true; }
  if (a === "pjcancel") { PJ.edit = null; PJ.f = {}; render(); return true; }
  if (a === "pjsave") { const old = PJ.edit === "novo" ? null : pjs().find(z => z.id === PJ.edit), g = id => $("#pj_" + id)?.value ?? "";
    const nome = g("nome").trim(), valor = parseNum(g("valor")); if (!nome || !(valor > 0)) { toast("Dê um nome e um valor ao projeto."); return true; }
    const rec = { ...(old || { id: uid(), criado: Date.now(), aportes: [], mentor: [] }), nome, valor, tipo: g("tipo"), cat: g("cat"), prio: g("prio"), prazo: g("prazo"), status: g("status"), forma: g("forma"), entrada: parseNum(g("entrada")) || "", taxa: parseNum(g("taxa")) || "", parcelas: parseInt(g("parcelas")) || "", etapas: pjParseEtapas(g("etapas"), old?.etapas), notas: g("notas").trim() };
    S.projetos = old ? pjs().map(z => z.id === old.id ? rec : z) : [...pjs(), rec]; PJ.edit = null; PJ.f = {}; PJ.open = rec.id; touch("projetos", { label: old ? "Projeto editado" : "Projeto criado" }); return true; }
  if (a === "pjdel") { S.projetos = pjs().filter(z => z.id !== ds.id); PJ.edit = null; touch("projetos", { label: "Projeto apagado" }); undoToast("Projeto apagado"); return true; }
  if (a === "pjopen") { PJ.open = PJ.open === ds.id ? null : ds.id; render(); return true; }
  if (a === "pjaporte") { const p = pjs().find(z => z.id === ds.id), v = parseNum($("#pjap_" + ds.id)?.value), d = $("#pjapd_" + ds.id)?.value || TODAY; if (!p || !(v > 0)) { toast("Informe o valor do aporte."); return true; } p.aportes = [...(p.aportes || []), { id: uid(), data: d, valor: Math.round(v * 100) / 100 }]; if (p.status === "planejando") p.status = "poupando"; touch("projetos", { label: "Aporte no projeto" }); toast(`Aporte de ${eur(v, 2)} registrado`); return true; }
  if (a === "pjapdel") { const p = pjs().find(z => z.id === ds.id); if (p) { p.aportes = (p.aportes || []).filter(x => x.id !== ds.ap); touch("projetos", { label: "Aporte apagado" }); } return true; }
  if (a === "pjnota") { const p = pjs().find(z => z.id === ds.id), tx = ($("#pjnota_" + ds.id)?.value || "").trim(); if (!p || !tx) { toast("Escreva a anotação."); return true; } p.mentor = [...(p.mentor || []), { at: Date.now(), texto: tx, origem: "eu" }]; touch("projetos", { label: "Anotação do projeto" }); return true; }
  if (a === "pjai") { pjAI(ds.id); return true; }
  if (a === "pjstop") { PJ.ctl?.abort(); return true; }
  return false;
}
function pjChange(t) {
  if (t.dataset.cfgpct) { const v = clamp((parseNum(t.value) || 0) / 100, 0, 1); S.cfg[t.dataset.cfgpct] = v; touch("cfg", { label: "Regras do plano" }); return true; }
  if (t.dataset.cfgn) { S.cfg[t.dataset.cfgn] = clamp(parseNum(t.value) || 0, 0, 24); touch("cfg", { label: "Regras do plano" }); return true; }
  return false;
}
function pjInput(t) { if (t.dataset.pjf) { PJ.f[t.dataset.pjf] = t.value; return true; } return false; }

/* ---------------------------------------------------------------- saldo dia a dia e ritmo da semana (no relatório de finanças) */
function finExtras(R) {
  const sc = S.saldoConta, out = [];
  if (sc?.serie?.length) { const s = sc.serie.filter(([d]) => d >= addDays(TODAY, -400)), low = 100;
    out.push(vis("fin-saldo", `Saldo da conta, dia a dia · ${esc(sc.conta || "")}`, lineChart(s.map(([d]) => fmtD(d)), [{ name: "Saldo", color: "var(--accent)", data: s.map(([, v]) => v) }], { h: 230, w: 900, fmt: v => eur(v), target: low }),
      { cls: "s12", sub: `${s.length} dias com movimento · ${fmtDY(s[0][0])} a ${fmtDY(s.at(-1)[0])} · linha de referência em ${eur(low)} · fonte: ${esc(sc.fonte || "")}` })); }
  const from = addDays(TODAY, -365), wd = [1, 2, 3, 4, 5, 6, 0], t = wd.map(() => ({ tot: 0, n: 0 }));
  for (const l of S.lanc) if (l.tipo === "Despesa" && l.data >= from && l.data <= TODAY) { const o = t[wd.indexOf(parse(l.data).getDay())]; o.tot += +l.valor || 0; o.n++; }
  if (t.some(o => o.n)) out.push(vis("fin-semana", "Ritmo da semana", hbars(wd.map((d, i) => ({ l: DOWL[d], v: t[i].tot, color: "var(--a-fin)", sub: `${t[i].n} compras · média ${eur(t[i].n ? t[i].tot / t[i].n : 0, 2)}`, txt: eur(t[i].tot) })), { fmt: v => eur(v) }), { cls: "s6", sub: "despesas dos últimos 12 meses por dia da semana" }));
  return out.join("");
}
/* origem dos dados importados (em Orçamento & patrimônio) */
function finFontes() {
  const im = S.importacoes || []; if (!im.length) return "";
  return panel(`${ic("download")}Origem dos dados <small>${im.length}</small>`, im.map(x => `<div class="pjsrc"><b>${esc(x.fonte)}</b> <span class="muted">importado em ${fmtDY(x.data)}</span><ul>${(x.itens || []).map(i => `<li>${esc(i)}</li>`).join("")}</ul>${(x.pendentes || []).length ? `<div class="flbl">Ficou de fora (sem data na fonte)</div><ul>${x.pendentes.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : ""}</div>`).join(""));
}

/* ---------------------------------------------------------------- termômetro da saúde financeira
   Mesma fórmula do Quadro Finanziario BBVA, com os dados do Atlas: meses completos com movimento; poupança (30%),
   peso dos custos fixos (20%), colchão de liquidez em meses de despesa (30%) e constância, meses fora do vermelho (20%). */
const FIX_CATS = ["Moradia", "Contas da casa", "Assinaturas", "Dívidas & financiamentos"];
function finSaude() {
  return memo("finsaude", () => {
    const by = {}; for (const l of S.lanc) { if (!l.data || mkey(l.data) >= mkey(TODAY)) continue; const m = by[mkey(l.data)] ||= { e: 0, u: 0, f: 0 }, v = +l.valor || 0;
      if (l.tipo === "Receita") m.e += v; else if (l.tipo === "Despesa") { m.u += v; if (FIX_CATS.includes(l.cat)) m.f += v; } }
    const ms = Object.values(by).filter(m => m.e > 0 || m.u > 0), n = ms.length; if (!n) return null;
    const em = avg(ms.map(m => m.e)), um = avg(ms.map(m => m.u)), fm = avg(ms.map(m => m.f)); if (!em || !um) return null;
    const pk = Object.keys(S.patr || {}).sort(), lp = pk.length ? S.patr[pk.at(-1)] : {}, sc = S.saldoConta?.serie;
    const saldo = sc?.length ? sc.at(-1)[1] + (+lp.reserva || 0) : (+lp.contas || 0) + (+lp.reserva || 0);
    const tasso = (em - um) / em * 100, peso = fm / um * 100, rosso = ms.filter(m => m.e - m.u < 0).length, buf = saldo / um, cl = x => Math.max(0, Math.min(100, x));
    const sr = cl(tasso / 20 * 100), sf = cl((50 - peso) / 20 * 100 + 50), sb = cl(buf / 3 * 100), sk = cl((1 - rosso / n) * 100);
    return { score: Math.round(sr * .3 + sf * .2 + sb * .3 + sk * .2), n, comp: [
      { n: "Taxa de poupança", v: Math.round(sr), d: `${num(tasso, 1)}% da renda`, peso: "30%" },
      { n: "Peso dos custos fixos", v: Math.round(sf), d: `${num(peso, 0)}% das despesas`, peso: "20%" },
      { n: "Colchão de liquidez", v: Math.round(sb), d: `${num(buf, 2)} meses de despesas`, peso: "30%" },
      { n: "Constância mensal", v: Math.round(sk), d: `${rosso} de ${n} meses no vermelho`, peso: "20%" }] };
  });
}
function finTermometro(cls = "s6") {
  const h = finSaude(); if (!h) return vis("fin-saude", "Termômetro da saúde financeira", emptyChart("Registre receitas e despesas de pelo menos um mês completo."), { cls });
  const sc = h.score, R = 52, cx = 78, cy = 62, a0 = Math.PI, col = sc >= 80 ? "var(--good)" : sc >= 60 ? "#8bb62a" : sc >= 35 ? "var(--warn)" : "var(--crit)", lab = sc >= 80 ? "sólida" : sc >= 60 ? "boa" : sc >= 35 ? "frágil" : "crítica";
  const arc = (f, t, c) => { const p = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)], [x1, y1] = p(f), [x2, y2] = p(t); return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`; };
  let g = [[0, .35, "var(--crit)"], [.35, .6, "var(--warn)"], [.6, .8, "#8bb62a"], [.8, 1, "var(--good)"]].map(z => arc(a0 + z[0] * Math.PI + .012, a0 + z[1] * Math.PI - .012, z[2])).join("");
  const na = a0 + sc / 100 * Math.PI; g += `<line x1="${cx}" y1="${cy}" x2="${(cx + (R - 13) * Math.cos(na)).toFixed(1)}" y2="${(cy + (R - 13) * Math.sin(na)).toFixed(1)}" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="var(--ink)"/>`;
  const body = `<div class="fhg"><div class="fhgauge">${svgWrap(156, 78, g, `Saúde financeira ${sc} de 100`)}<div class="fhsc" style="color:${col}">${sc}<small>/100</small></div><div class="muted small">situação <b style="color:${col}">${lab}</b></div></div>
    <div class="fhcomp">${h.comp.map(c => `<div class="fhrow"><div class="fhl"><span>${esc(c.n)} <small class="muted">peso ${c.peso}</small></span><span class="muted small">${esc(c.d)}</span></div><div class="fht"><i style="width:${c.v}%;background:${c.v >= 70 ? "var(--good)" : c.v >= 40 ? "var(--warn)" : "var(--crit)"}"></i></div><b>${c.v}</b></div>`).join("")}</div></div>`;
  return vis("fin-saude", "Termômetro da saúde financeira", body, { cls, sub: `${plural(h.n, "mês completo", "meses completos")} · mesma fórmula do Quadro BBVA · custos fixos: ${FIX_CATS.join(", ").toLowerCase()}` });
}
