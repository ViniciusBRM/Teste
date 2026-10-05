/* ================================================================ Finanças › Futuro financeiro e Itália & Brasil
   Regras usadas (Itália, conferir a cada ano):
   - TFR: quota anual = retribuição anual ÷ 13,5, menos 0,5% de contribuição adicional INPS; revalorizado em 31/12 a 1,5% + 75% da inflação (FOI),
     com imposto substitutivo de 17% sobre a revalorização. Empresas com 50+ empregados repassam o TFR não destinado a fundo ao Tesouro do INPS.
   - Fundo de pensão: contribuições dedutíveis até € 5.164,57/ano; rendimentos tributados no fundo (20% em geral);
     na saída, 15% menos 0,3 ponto por ano de adesão além do 15º, até o mínimo de 9%.
   - IRPEF: 23% até € 28 mil, 35% até € 50 mil, 43% acima. Contribuição INPS do empregado ≈ 9,19%. */
const fut = () => { const f = (S.fut ||= {}); f.check ||= {}; return f; };
const IRPEF = [[28000, .23], [50000, .35], [Infinity, .43]];
const irpefMarg = imp => IRPEF.find(([lim]) => imp <= lim)[1];
function finMeses(n = 6) {
  const fim = TODAY.slice(0, 7), ms = Array.from({ length: n }, (_, i) => addMonths(fim + "-01", -(i + 1)).slice(0, 7));
  const tot = mk => sum(S.lanc.filter(l => l.tipo === "Despesa" && l.data.startsWith(mk)).map(l => +l.valor || 0)), ess = mk => sum(S.lanc.filter(l => l.tipo === "Despesa" && l.data.startsWith(mk) && CAT_DESP[l.cat] === "Essencial").map(l => +l.valor || 0));
  const comDados = ms.filter(mk => tot(mk) > 0);
  return { meses: comDados.length, total: comDados.length ? avg(comDados.map(tot)) : null, essencial: comDados.length ? avg(comDados.map(ess)) : null, aporteRes: avg(ms.slice(0, 3).map(mk => sum(S.lanc.filter(l => l.tipo === "Aporte" && l.cat === "Reserva de emergência" && l.data.startsWith(mk)).map(l => +l.valor || 0)))) };
}
function futCalc() {
  const F = fut(), M = finMeses(), pk = Object.keys(S.patr).sort().at(-1), saldoPatr = pk ? +S.patr[pk].reserva || null : null;
  const reserva = isNum(F.reservaSaldo) && F.reservaSaldo !== "" ? +F.reservaSaldo : saldoPatr, metaM = +F.reservaMeses || S.cfg.metaReserva || 6, base = F.reservaBase === "total" ? M.total : M.essencial;
  const alvo = base ? base * metaM : null, falta = alvo != null && reserva != null ? Math.max(0, alvo - reserva) : null, cobre = base && reserva != null ? reserva / base : null;
  const prazo = F.reservaPrazo || addMonths(TODAY, 12), mesesAte = Math.max(1, Math.round(diff(prazo, TODAY) / 30.44)), porMes = falta != null ? falta / mesesAte : null;
  const ritmo = M.aporteRes, eta = falta && ritmo > 0 ? addMonths(TODAY, Math.ceil(falta / ritmo)) : null;
  /* TFR */
  const rem = typeof crRemun === "function" ? crRemun() : {}, ral = +F.ral || rem.ral || null, infl = isNum(F.infl) && F.infl !== "" ? +F.infl / 100 : .02, cresc = isNum(F.cresc) && F.cresc !== "" ? +F.cresc / 100 : .02, anos = +F.anosProj || 10;
  let tfr = null;
  if (ral) {
    const quota = r => r / 13.5 - .005 * r, reval = 0.015 + 0.75 * infl;
    let saldoA = +F.tfrSaldo || 0, saldoF = +F.fundoSaldo || 0, r = ral; const serie = [], ctT = (+F.contribTrab || 0) / 100, ctE = (+F.contribEmp || 0) / 100, rf = isNum(F.fundoRend) && F.fundoRend !== "" ? +F.fundoRend / 100 : .03;
    for (let y = 1; y <= anos; y++) { const q = quota(r); saldoA = saldoA + saldoA * reval * (1 - .17) + q; saldoF = saldoF * (1 + rf * (1 - .2)) + q + r * (ctT + ctE); serie.push({ y, a: saldoA, f: saldoF }); r *= 1 + cresc; }
    const imp = ral * (1 - .0919), marg = irpefMarg(imp), dedMax = 5164.57, contribAno = ral * (ctT + ctE) + quota(ral) * 0; /* o TFR não é dedutível: só as contribuições */
    tfr = { ral, quotaBruta: ral / 13.5, quotaLiq: quota(ral), reval, serie, marg, imp, economiaPor1000: 1000 * marg, contribAno, deducao: Math.min(contribAno, dedMax), economia: Math.min(contribAno, dedMax) * marg, aliqSaida: Math.max(.09, .15 - .003 * Math.max(0, anos - 15)) };
  }
  return { F, M, reserva, saldoPatr, metaM, base, alvo, falta, cobre, prazo, porMes, ritmo, eta, tfr };
}
const fIn = (k, l, ph = "", t = "number", extra = "") => `<label>${l}<input type="${t}" data-fut="${k}" value="${esc(fut()[k] ?? "")}" placeholder="${esc(ph)}"${t === "number" ? ' step="any"' : ""}${extra}></label>`;
function pFuturo() {
  const X = futCalc(), F = X.F, T = X.tfr;
  const resSt = X.cobre == null ? "none" : X.cobre >= X.metaM ? "good" : X.cobre >= 3 ? "warn" : "crit";
  return `${kpiRow([kmini("var(--a-fin)", "Reserva cobre", X.cobre == null ? "–" : `${num(X.cobre, 1)} meses`, `meta ${X.metaM} meses`, resSt), kmini("var(--warn)", "Falta para a meta", X.falta == null ? "–" : eur(X.falta), X.porMes ? `${eur(X.porMes)}/mês até ${fmtDY(X.prazo)}` : ""), kmini("var(--a-car)", "TFR por ano", T ? eur(T.quotaLiq) : "–", T ? `RAL ${eur(T.ral)} ÷ 13,5 − 0,5%` : "informe o salário na Carreira"), kmini("var(--a-apr)", "IRPEF marginal", T ? pct(T.marg) : "–", T ? "cada € 1.000 no fundo de pensão economiza " + eur(T.economiaPor1000) : "")])}
  <div class="g2c">
    ${panel(`${ic("shield")}1 · Reserva de emergência <small>o colchão para perder o emprego, uma doença ou uma viagem urgente ao Brasil</small>`, `
      <div class="form f3">${fIn("reservaSaldo", "Saldo hoje (€)", X.saldoPatr != null ? `do patrimônio: ${X.saldoPatr}` : "")}${fIn("reservaMeses", "Meta em meses", String(S.cfg.metaReserva || 6))}${fIn("reservaPrazo", "Chegar até", "", "date")}<label>Base de cálculo<select data-fut="reservaBase"><option value="ess"${F.reservaBase !== "total" ? " selected" : ""}>Só despesas essenciais</option><option value="total"${F.reservaBase === "total" ? " selected" : ""}>Todas as despesas</option></select></label></div>
      ${X.base ? `<div class="futbar"><i style="width:${clamp((X.reserva || 0) / X.alvo) * 100}%"></i></div><p><b>${eur(X.reserva || 0)}</b> de <b>${eur(X.alvo)}</b> (${X.metaM} × ${eur(X.base)} de despesa ${F.reservaBase === "total" ? "total" : "essencial"} por mês, média de ${X.M.meses} meses).</p>
        <p>${X.falta ? `Para chegar até ${fmtDY(X.prazo)}: <b>${eur(X.porMes)} por mês</b>. ${X.ritmo > 0 ? `No ritmo dos últimos 3 meses (${eur(X.ritmo)}/mês em aportes na reserva), você chega em <b>${mlabel(X.eta.slice(0, 7))}</b>.` : "Nos últimos 3 meses não houve aporte com a categoria Reserva de emergência."}` : "Meta atingida. O que passar disso pode ir para investimentos de longo prazo."}</p>` : `<div class="empty">Faltam lançamentos de despesa dos últimos meses para calcular a meta.</div>`}
      <details class="futd"><summary>Onde guardar a reserva</summary><ul><li>Conta separada da conta do dia a dia, com liquidez imediata ou em poucos dias (conto deposito svincolabile ou conta remunerada).</li><li>Na Itália os juros pagam 26% de imposto retido, e há imposto de selo: 0,20% ao ano em conto deposito; na conta corrente, € 34,20 se o saldo médio passar de € 5.000.</li><li>Uma parte em reais no Brasil só se houver gastos previstos lá; senão você assume o risco do câmbio.</li></ul></details>`, { cls: "span2" })}
    ${panel(`${ic("brief")}2 · TFR <small>Trattamento di Fine Rapporto</small>`, T ? `
      <div class="form f3">${fIn("tfrSaldo", "Saldo TFR hoje (€)", "veja na busta paga")}${fIn("infl", "Inflação ao ano (%)", "2")}${fIn("cresc", "Aumento de salário ao ano (%)", "2")}${fIn("anosProj", "Projetar por (anos)", "10")}<label>Destino do TFR<select data-fut="tfrDestino"><option value="azienda"${F.tfrDestino !== "fondo" ? " selected" : ""}>Fica na empresa (ou INPS)</option><option value="fondo"${F.tfrDestino === "fondo" ? " selected" : ""}>Fundo de pensão</option></select></label></div>
      <p class="muted small">Parte do salário que o empregador guarda e paga quando o contrato termina.</p><p>Por ano entram <b>${eur(T.quotaBruta)}</b> brutos (RAL ÷ 13,5), menos ${eur(.005 * T.ral)} de contribuição adicional = <b>${eur(T.quotaLiq)}</b>. Na empresa, o saldo rende <b>${pct(T.reval)}</b> ao ano (1,5% + 75% da inflação), com 17% de imposto sobre esse rendimento.</p>
      ${vis("tfrproj", `Saldo projetado em ${T.serie.length} anos`, lineChart(T.serie.map(s => "ano " + s.y), [{ name: "Na empresa", color: "var(--a-car)", data: T.serie.map(s => Math.round(s.a)) }, { name: "Em fundo de pensão", color: "var(--a-fin)", data: T.serie.map(s => Math.round(s.f)) }], { h: 200, fmt: v => eurK(v) }), { sub: `fundo com ${isNum(F.fundoRend) && F.fundoRend !== "" ? F.fundoRend : 3}% ao ano antes de 20% de imposto e com as contribuições abaixo; antes do imposto de saída`, nofocus: true })}
      <p class="muted small">Pode pedir adiantamento de até 70% depois de 8 anos na mesma empresa, para compra da primeira casa ou despesas médicas importantes. Confira o saldo na busta paga de dezembro.</p>` : `<div class="empty">Informe o bruto mensal e as mensalidades em <a class="lnk" href="#carreira.avaliacao">Carreira › Avaliação</a> ou a RAL aqui.</div><div class="form f2">${fIn("ral", "RAL (€)")}</div>`)}
    ${panel(`${ic("sprout")}3 · Previdência <small>INPS, fundo complementar e os anos no Brasil</small>`, `
      <div class="form f3">${fIn("idade", "Sua idade")}${fIn("anosInps", "Anos de contribuição INPS")}${fIn("anosInss", "Anos de contribuição INSS (Brasil)")}${fIn("fundoNome", "Fundo de pensão", "ex.: Fondoprofessioni", "text")}${fIn("fundoSaldo", "Saldo no fundo (€)")}${fIn("fundoRend", "Rendimento esperado (%)", "3")}${fIn("contribTrab", "Sua contribuição (% da RAL)", "0")}${fIn("contribEmp", "Contribuição do empregador (% da RAL)", "0")}</div>
      ${(() => { const id = +F.idade, ai = +F.anosInps || 0, ab = +F.anosInss || 0; return id ? `<p>Pensão de velhice na Itália hoje: <b>67 anos</b> com ao menos <b>20 anos</b> de contribuição. Faltam <b>${Math.max(0, 67 - id)} anos</b> de idade${ai + ab ? `; você soma ${ai} anos de INPS${ab ? ` e ${ab} de INSS` : ""}` : ""}. O acordo de previdência Brasil–Itália permite somar os períodos dos dois países para atingir o mínimo; cada país paga a parte proporcional ao que foi contribuído nele.</p>` : `<p class="muted">Informe sua idade e os anos de contribuição.</p>`; })()}
      ${T ? `<p>Se você contribuir para o fundo, a dedução vale até <b>€ 5.164,57</b> por ano. Com a sua faixa de IRPEF (${pct(T.marg)}), as contribuições informadas (${eur(T.contribAno)}/ano) devolvem cerca de <b>${eur(T.economia)}</b> de imposto por ano. Na saída, o imposto é de 15%, caindo 0,3 ponto por ano depois do 15º, até 9%.</p>` : ""}
      <details class="futd"><summary>Próximos passos práticos</summary><ul><li>Baixe o estratto conto contributivo no portal MyINPS e confira se todos os meses aparecem.</li><li>Pergunte ao RH qual fundo o seu CCNL prevê e se há contribuição do empregador só para quem adere.</li><li>No Brasil, guarde o CNIS (extrato do INSS) atualizado: é ele que entra na soma do acordo.</li></ul></details>`)}
  </div>
  <p class="note">${ic("info")}<span>Simulações simples, com as regras escritas acima. Antes de mudar o destino do TFR ou aderir a um fundo, confirme os números com o RH, um CAF ou um consultor: a escolha de mandar o TFR para o fundo não pode ser desfeita.</span></p>`;
}

/* ---------------------------------------------------------------- Itália & Brasil */
const VIDA_CHECK = [
  ["it_perm", "Itália", "Permesso / carta di soggiorno", "Pedir a renovação 60 dias antes do vencimento; guarde o recibo do correio (ricevuta)."],
  ["it_cid", "Itália", "Carta d'identità", "Renovar no comune; agende com antecedência."],
  ["it_ts", "Itália", "Tessera sanitaria e médico de base", "Validade ligada ao permesso; atualizar no ASL ao renovar."],
  ["it_730", "Itália", "Declaração de renda (730)", "Prazo do 730 pré-preenchido: 30 de setembro. Inclua as despesas dedutíveis (médicas, fundo de pensão)."],
  ["it_rw", "Itália", "Quadro RW / IVAFE da conta no Brasil", "Residente fiscal na Itália declara contas e investimentos no exterior; conta corrente paga € 34,20 se o saldo médio passar de € 5.000. Confirme com um CAF."],
  ["br_cpf", "Brasil", "CPF regular", "Consultar a situação no site da Receita Federal uma vez por ano."],
  ["br_saida", "Brasil", "Saída definitiva do país (Receita Federal)", "Se você não é mais residente fiscal no Brasil, a comunicação e a declaração de saída evitam dupla tributação. Confirme com um contador."],
  ["br_tit", "Brasil", "Título de eleitor no exterior", "Transferir para o consulado ou justificar a ausência após cada eleição."],
  ["br_pass", "Brasil", "Passaporte", "Renovar no consulado; validade mínima de 6 meses para várias viagens."],
  ["br_banco", "Brasil", "Conta e cartões no Brasil", "Atualizar o endereço no exterior e o tipo de conta com o banco; conferir tarifas."],
];
async function vidaCot(force) {
  const F = fut(); if (!force && F.cot && F.cot.dia === TODAY) return;
  try { const r = await fetch("https://api.frankfurter.dev/v1/latest?from=BRL&to=EUR"); if (!r.ok) throw 0; const j = await r.json(); const rate = +j?.rates?.EUR; if (!(rate > 0)) throw 0;
    F.cot = { rate, data: j.date, dia: TODAY, src: "BCE (frankfurter.dev)" }; touch("fut", { noUndo: true, label: "Cotação" }); }
  catch { F.cotErr = TODAY; if (PAGE === "fin" && SUB === "vida") render(); }
}
const brl = v => "R$ " + (+v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function pVida() {
  const F = fut(), rate = +F.cotManual || F.cot?.rate || null; if ((!F.cot || F.cot.dia !== TODAY) && F.cotErr !== TODAY && !vidaCot.on) { vidaCot.on = 1; setTimeout(() => vidaCot().finally(() => { vidaCot.on = 0; }), 0); }
  const mensal = x => PER_M[x.periodo] ? (+x.valor || 0) / PER_M[x.periodo] : 0, br = S.vidaItens.filter(x => x.pais === "Brasil"), it = S.vidaItens.filter(x => x.pais !== "Brasil");
  const tBR = sum(br.map(mensal)), tIT = sum(it.map(mensal)), tBRe = rate ? tBR * rate : null, casa = typeof casaCalc === "function" ? casaCalc().mensal : 0;
  const lista = (xs, cur) => xs.length ? table("vidaItens", xs, [["Conta / gasto", x => `<b>${esc(x.t)}</b><div class="muted small">${esc(x.cat || "")}${x.venc ? " · vence " + fmtD(x.venc) : ""}</div>`], ["Período", x => esc(x.periodo)], ["Valor", x => cur(+x.valor || 0), "num"], ["Por mês", x => cur(mensal(x)), "num"], ...(cur === brl ? [["Em €", x => rate ? eur(mensal(x) * rate, 2) : "–", "num"]] : [])]) : `<div class="empty">Nada cadastrado.</div>`;
  const ck = F.check;
  return `${kpiRow([kmini("var(--a-fin)", "Brasil por mês", brl(tBR), tBRe != null ? `= ${eur(tBRe, 2)}` : "sem cotação"), kmini("var(--a-car)", "Itália por mês (fora a casa)", eur(tIT, 2), casa ? `+ ${eur(casa)} das contas da casa` : ""), kmini("var(--accent)", "Total do mês em euro", tBRe != null ? eur(tBRe + tIT + casa, 2) : "–", tBRe != null && tBRe + tIT + casa ? `Brasil = ${pct(tBRe / (tBRe + tIT + casa))} do total` : ""), kmini("var(--warn)", "Cotação BRL → EUR", rate ? `€ ${rate.toLocaleString("pt-BR", { maximumFractionDigits: 5 })}` : "–", F.cotManual ? "informada à mão" : F.cot ? `${F.cot.src}, ${fmtDY(F.cot.data)}` : F.cotErr ? "sem acesso à internet aqui" : "buscando…")])}
  <div class="g2c">
    ${panel(`🇧🇷 Brasil <small>em reais</small>`, lista(br, brl), { act: addBtn("vidaItens", "Novo") })}
    ${panel(`🇮🇹 Itália <small>em euro; as contas da casa ficam em Casa & docs</small>`, lista(it, v => eur(v, 2)), { act: addBtn("vidaItens", "Novo") })}
    ${panel(`${ic("refresh")}Conversão do mês`, `<table class="dt"><tbody><tr><td>Brasil</td><td class="num">${brl(tBR)}</td><td class="num">${tBRe != null ? eur(tBRe, 2) : "–"}</td></tr><tr><td>Itália</td><td class="num"></td><td class="num">${eur(tIT, 2)}</td></tr>${casa ? `<tr><td>Casa (Turim)</td><td class="num"></td><td class="num">${eur(casa, 2)}</td></tr>` : ""}<tr><td><b>Total</b></td><td></td><td class="num"><b>${tBRe != null ? eur(tBRe + tIT + casa, 2) : "–"}</b></td></tr></tbody></table>
      <div class="form f2">${fIn("cotManual", "Cotação à mão (€ por R$ 1)", rate ? String(rate) : "0,17")}<label>&nbsp;<button type="button" class="btn sm" data-act="vidacot">${ic("refresh")}Buscar cotação de hoje</button></label></div><p class="muted small">Cotação de referência do Banco Central Europeu. Na remessa real o banco ou a fintech cobra spread e tarifa: compare o valor que chega, não só a taxa.</p>`)}
    ${panel(`${ic("checksq")}Documentos e prazos dos dois países`, VIDA_CHECK.map(([id, p, t, d]) => { const x = ck[id] || {}; const dias = x.venc ? diff(x.venc, TODAY) : null; return `<div class="vck"><label class="ckl"><input type="checkbox" data-vck="${id}"${x.ok ? " checked" : ""}><span><b>${p === "Brasil" ? "🇧🇷" : "🇮🇹"} ${esc(t)}</b><small>${esc(d)}</small></span></label><label class="vcv">Vence<input type="date" data-vckd="${id}" value="${x.venc || ""}" aria-label="Vencimento de ${esc(t)}"></label>${dias != null ? pill(dias < 0 ? "crit" : dias <= 60 ? "warn" : "good", dias < 0 ? "vencido" : `${dias} d`) : ""}</div>`; }).join(""))}
  </div>
  <p class="note">${ic("info")}<span>As regras fiscais e consulares mudam: os textos acima são lembretes para conferir, não orientação profissional.</span></p>`;
}
function futChange(t) {
  if (t.dataset.fut) { const F = fut(), k = t.dataset.fut, v = t.value; F[k] = t.type === "number" ? (v === "" ? "" : +v) : v; touch("fut", { label: "Futuro financeiro" }); return true; }
  if (t.dataset.vckd) { const F = fut(); F.check[t.dataset.vckd] = { ...(F.check[t.dataset.vckd] || {}), venc: t.value }; touch("fut", { label: "Prazo" }); return true; }
  return false;
}
function futClick(t) {
  if (t.dataset.vck) { const F = fut(); F.check[t.dataset.vck] = { ...(F.check[t.dataset.vck] || {}), ok: t.checked ? TODAY : "" }; touch("fut", { label: "Checklist" }); return true; }
  if (t.dataset.act === "vidacot") { const F = fut(); F.cotManual = ""; vidaCot(true); toast("Buscando a cotação…"); return true; }
  return false;
}
