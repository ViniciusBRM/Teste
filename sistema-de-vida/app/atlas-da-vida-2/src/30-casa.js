/* ================================================================ Casa & docs: a casa como espaço físico e como conta
   Limpeza (rotinas do leve ao pesado), compras da semana, calendário de contas e documentos anuais.
   Assinaturas foram para Finanças › Orçamento: são consumo, não a casa. */
const NIVEIS = ["Leve", "Média", "Pesada", "Sazonal"];
const NIV_TXT = { Leve: "diária ou a cada 2–3 dias", "Média": "semanal", Pesada: "mensal", Sazonal: "2 a 4 vezes por ano" };
const PER_M = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12, "Única": 0 };
const addMonths = (d, n) => { const x = parse(d), day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); x.setDate(Math.min(day, last)); return iso(x); };
/* vencimentos de uma conta entre duas datas, a partir do próximo vencimento cadastrado (para trás e para frente) */
function contaOcorr(c, de, ate) {
  const p = PER_M[c.periodo] ?? 1, out = []; if (!c.venc) return out;
  if (!p) return c.venc >= de && c.venc <= ate ? [c.venc] : [];
  /* cada vencimento sai do cadastrado (k × período), para o dia 31 não virar 30 para sempre */
  let k = 0; while (addMonths(c.venc, k * p) > de && k > -240) k--;
  for (let i = 0; i < 480; i++, k++) { const d = addMonths(c.venc, k * p); if (d > ate) break; if (d >= de) out.push(d); }
  return out;
}
const contaPaga = (c, d) => !!(c.pagos || {})[d];
function casaCalc() {
  const de = addDays(TODAY, -45), ate = addDays(TODAY, 60), venc = [];
  for (const c of S.contasCasa) for (const d of contaOcorr(c, de, ate)) venc.push({ c, d, pago: contaPaga(c, d), dias: diff(d, TODAY) });
  venc.sort((a, b) => a.d.localeCompare(b.d));
  const rot = S.rotinas.map(r => { const prox = r.ultima && +r.freq ? addDays(r.ultima, +r.freq) : TODAY, dias = diff(prox, TODAY); return { ...r, nivel: r.nivel || "Média", prox, dias, st: dias < 0 ? "crit" : dias === 0 ? "warn" : "good" }; });
  const docs = S.docs.map(d => { const dias = d.validade ? diff(d.validade, TODAY) : null; return { ...d, dias, st: dias == null ? "none" : dias < 0 ? "crit" : dias <= S.cfg.alertaDocs ? "warn" : "good" }; });
  const mensal = sum(S.contasCasa.map(c => PER_M[c.periodo] ? (+c.valor || 0) / PER_M[c.periodo] : 0));
  return { venc, rot, docs, mensal, atrasadas: venc.filter(v => !v.pago && v.dias < 0), prox14: venc.filter(v => !v.pago && v.dias >= 0 && v.dias <= 14), hojeRot: rot.filter(r => r.dias <= 0) };
}
function pCasa2(R) {
  const f = { painel: casaPainel, limpeza: casaLimpeza, compras: casaCompras, contas: casaContas, docs: casaDocs }[SUB] || casaPainel;
  return f(R);
}
function casaPainel() {
  const C = casaCalc(), falta = S.compras.filter(x => !x.feito).length;
  return `${kpiRow([kmini("var(--crit)", "Contas atrasadas", C.atrasadas.length, C.atrasadas.length ? eur(sum(C.atrasadas.map(v => +v.c.valor || 0)), 2) : "nenhuma", C.atrasadas.length ? "crit" : "good"), kmini("var(--warn)", "Vencem em 14 dias", C.prox14.length, eur(sum(C.prox14.map(v => +v.c.valor || 0)), 2)), kmini("var(--a-fam)", "Limpeza para hoje", C.hojeRot.length, `${sum(C.hojeRot.map(r => +r.min || 0))} min no total`), kmini("var(--a-fin)", "Custo fixo da casa", eur(C.mensal), "por mês, média das contas")])}
    <div class="g2c">
      ${panel(`${ic("cal")}Próximos vencimentos`, casaVencList([...C.atrasadas, ...C.prox14]), { act: `<a class="lnk" href="#casa.contas">calendário</a>` })}
      ${panel(`${ic("house")}Limpeza de hoje`, C.hojeRot.length ? `<div class="list">${C.hojeRot.sort((a, b) => a.dias - b.dias).map(casaRotLi).join("")}</div>` : `<div class="empty">Nada vencido. A próxima: ${(() => { const r = [...C.rot].sort((a, b) => a.dias - b.dias)[0]; return r ? `${esc(r.rotina)} em ${fmtD(r.prox)}` : "cadastre rotinas em Limpeza"; })()}.</div>`, { act: `<a class="lnk" href="#casa.limpeza">todas</a>` })}
      ${panel(`${ic("checksq")}Lista de compras <small>${falta} a comprar</small>`, S.compras.length ? `<div class="cpchips">${S.compras.filter(x => !x.feito).slice(0, 18).map(x => `<span class="chip">${esc(x.item)}${x.qtd ? ` · ${esc(x.qtd)}` : ""}</span>`).join("")}</div>` : `<div class="empty">Lista vazia.</div>`, { act: `<a class="lnk" href="#casa.compras">abrir</a>` })}
      ${panel(`${ic("file")}Documentos que pedem ação`, (() => { const ds = C.docs.filter(d => d.st === "crit" || d.st === "warn").sort((a, b) => a.dias - b.dias); return ds.length ? `<div class="list">${ds.map(d => `<div class="li"><button type="button" class="t lnkb" data-edit="docs" data-id="${d.id}">${esc(d.doc)}<div class="m">${esc(d.tipo || "")}${d.onde ? ` · guardado em ${esc(d.onde)}` : ""}</div></button>${pill(d.st, d.dias < 0 ? `venceu há ${-d.dias} d` : `em ${d.dias} d`)}</div>`).join("")}</div>` : `<div class="empty">Nenhum documento vencendo nos próximos ${S.cfg.alertaDocs} dias.</div>`; })(), { act: `<a class="lnk" href="#casa.docs">todos</a>` })}
    </div>`;
}
const casaVencList = vs => vs.length ? `<div class="list">${vs.map(v => `<div class="li cvl${v.pago ? " pago" : ""}"><div class="t"><b>${esc(v.c.conta)}</b><div class="m">${fmtD(v.d)} · ${esc(v.c.cat || "")}${v.c.debito === "Sim" ? " · débito automático" : ""}</div></div><div class="row"><span class="num">${eur(+v.c.valor || 0, 2)}</span>${v.pago ? pill("good", "paga") : `${pill(v.dias < 0 ? "crit" : v.dias <= 3 ? "warn" : "none", v.dias < 0 ? `atrasada ${-v.dias} d` : v.dias === 0 ? "hoje" : `em ${v.dias} d`)}<button type="button" class="btn sm" data-act="cpagar" data-id="${v.c.id}" data-d="${v.d}">${ic("check")}Paguei</button>`}</div></div>`).join("")}</div>` : `<div class="empty">Nada vencendo.</div>`;
const casaRotLi = r => `<div class="li"><div class="t"><b>${esc(r.rotina)}</b><div class="m">${esc(r.nivel)} · ${esc(r.comodo || "Casa toda")} · ${r.min ? r.min + " min · " : ""}a cada ${r.freq} d</div></div><div class="row">${pill(r.st, r.dias < 0 ? `atrasada ${-r.dias} d` : r.dias === 0 ? "hoje" : fmtD(r.prox))}<button type="button" class="btn sm" data-done="${r.id}">${ic("check")}Feito</button><button type="button" class="vb" data-edit="rotinas" data-id="${r.id}" aria-label="Editar">${ic("edit")}</button></div></div>`;
const LIMPEZA_MODELO = [["Lavar a louça e limpar a pia", "Leve", "Cozinha", 1, 15], ["Arrumar a cama e arejar o quarto", "Leve", "Quarto", 1, 5], ["Tirar o lixo e separar a reciclagem", "Leve", "Casa toda", 2, 5], ["Aspirar o chão", "Média", "Casa toda", 7, 30], ["Limpar o banheiro (vaso, box, pia)", "Média", "Banheiro", 7, 30], ["Trocar roupa de cama e toalhas", "Média", "Quarto", 7, 15], ["Limpar a geladeira e jogar fora o vencido", "Pesada", "Cozinha", 30, 30], ["Limpar o forno e o micro-ondas", "Pesada", "Cozinha", 30, 30], ["Tirar o calcário (chuveiro, torneiras, chaleira)", "Pesada", "Banheiro", 30, 25], ["Limpar o filtro da máquina de lavar", "Pesada", "Eletrodomésticos", 30, 15], ["Lavar janelas e persianas", "Sazonal", "Casa toda", 90, 90], ["Trocar roupas de estação e arejar armários", "Sazonal", "Quarto", 180, 120], ["Descongelar o freezer", "Sazonal", "Cozinha", 180, 60]];
function casaLimpeza() {
  const C = casaCalc();
  return `<div class="g2c">${NIVEIS.map(n => { const rs = C.rot.filter(r => r.nivel === n).sort((a, b) => a.dias - b.dias); return panel(`${n} <small>${NIV_TXT[n]} · ${sum(rs.map(r => +r.min || 0))} min no ciclo</small>`, rs.length ? `<div class="list">${rs.map(casaRotLi).join("")}</div>` : `<div class="empty">Nenhuma rotina ${n.toLowerCase()}.</div>`); }).join("")}</div>
    <div class="row wrap" style="margin-top:12px">${addBtn("rotinas", "Nova rotina")}${S.rotinas.length < 4 ? `<button type="button" class="btn sm" data-act="climpmod">${ic("list")}Usar um modelo de 13 rotinas</button>` : ""}</div>
    <p class="note">${ic("info")}<span>“Feito” marca hoje e calcula a próxima data. Rotinas leves somam pouco por dia; as pesadas, reserve meia hora num sábado por mês.</span></p>`;
}
function casaCompras() {
  const secs = [...new Set(S.compras.map(x => x.cat || "Outros"))], falta = S.compras.filter(x => !x.feito);
  return `<div class="g2c"><div class="stack">${panel(`${ic("plus")}Adicionar`, `<div class="row"><input type="text" id="cp_in" placeholder="Ex.: 2 kg de batata, leite, detergente" aria-label="Novo item"><button type="button" class="btn sm primary" data-act="cpadd">Adicionar</button></div><p class="muted small">Separe vários itens por vírgula. A seção (hortifrúti, limpeza…) é sugerida pelo nome; dá para mudar clicando no item.</p>`)}
    ${panel(`${ic("repeat")}Semana`, `<p>${falta.length} a comprar · ${S.compras.length - falta.length} no carrinho · ${S.compras.filter(x => x.fixo === "Sim").length} fixos.</p><div class="row wrap"><button type="button" class="btn sm" data-act="cpnova">${ic("refresh")}Nova semana</button><button type="button" class="btn sm ghost" data-act="cpcopy">${ic("copy")}Copiar lista</button></div><p class="muted small">“Nova semana” tira os itens comprados e devolve os fixos à lista.</p>`)}</div>
    ${panel(`${ic("checksq")}Lista <small>por seção do mercado</small>`, S.compras.length ? secs.map(s => `<div class="flbl">${esc(s)}</div>${S.compras.filter(x => (x.cat || "Outros") === s).map(x => `<div class="li"><label class="ckl"><input type="checkbox" data-cpck="${x.id}"${x.feito ? " checked" : ""}><span class="${x.feito ? "done" : ""}">${esc(x.item)}${x.qtd ? ` <small class="muted">${esc(x.qtd)}</small>` : ""}${x.fixo === "Sim" ? ` <small class="muted">· fixo</small>` : ""}</span></label><button type="button" class="vb" data-edit="compras" data-id="${x.id}" aria-label="Editar">${ic("edit")}</button></div>`).join("")}`).join("") : `<div class="empty">Lista vazia. Adicione acima.</div>`)}</div>`;
}
const CP_SEC = [[/batata|cebola|tomate|alface|fruta|banana|maç|laranja|limão|cenoura|abobrinha|verdura|legume|alho|pimentão|salada/i, "Hortifrúti"], [/leite|queijo|iogurte|manteiga|mozzarella|parmig|ricotta|panna/i, "Laticínios"], [/carne|frango|peixe|salmão|atum|porco|presunto|prosciutto|salame|ovo/i, "Carnes & peixes"], [/pão|pane|grissini|focaccia|biscoito/i, "Padaria"], [/congelad|sorvete|gelato/i, "Congelados"], [/detergente|sabão|desinfet|amaciante|esponja|saco de lixo|água sanitária|candeggina/i, "Limpeza"], [/sabonete|shampoo|pasta de dente|papel higiênico|desodorante|escova/i, "Higiene"]];
function cpAdd(v) {
  const its = String(v || "").split(/[,;\n]/).map(s => s.trim()).filter(Boolean); if (!its.length) return;
  for (const raw of its) { const m = raw.match(/^(\d+(?:[.,]\d+)?\s*(?:kg|g|l|ml|un|pct|x)?)\s+(?:de\s+)?(.+)$/i), item = m ? m[2] : raw, qtd = m ? m[1] : "";
    S.compras.push({ id: uid(), item: item.charAt(0).toUpperCase() + item.slice(1), qtd, cat: (CP_SEC.find(([rx]) => rx.test(item)) || [0, "Mercearia"])[1], fixo: "Não", feito: false }); }
  touch("compras", { label: "Lista de compras" });
}
function casaContas() {
  const C = casaCalc(), mes0 = TODAY.slice(0, 7), meses = [0, 1, 2].map(i => addMonths(mes0 + "-01", i).slice(0, 7));
  return `${kpiRow([kmini("var(--a-fin)", "Custo fixo mensal", eur(C.mensal), "média de todas as contas"), kmini("var(--crit)", "Atrasadas", C.atrasadas.length, eur(sum(C.atrasadas.map(v => +v.c.valor || 0)), 2), C.atrasadas.length ? "crit" : "good"), kmini("var(--warn)", "Próximos 14 dias", C.prox14.length, eur(sum(C.prox14.map(v => +v.c.valor || 0)), 2))])}
    <div class="g2c">${meses.map(mk => { const vs = C.venc.filter(v => v.d.startsWith(mk)); return panel(`${ic("cal")}${mlabel(mk)} <small>${eur(sum(vs.map(v => +v.c.valor || 0)), 2)}</small>`, casaVencList(vs)); }).join("")}
    ${panel(`${ic("list")}Contas cadastradas`, table("contasCasa", S.contasCasa, [["Conta", c => `<b>${esc(c.conta)}</b><div class="muted small">${esc(c.cat || "")}</div>`], ["Período", c => esc(c.periodo)], ["Valor", c => eur(+c.valor || 0, 2), "num"], ["Próximo", c => fmtD(contaOcorr(c, TODAY, addDays(TODAY, 400)).find(d => !contaPaga(c, d)) || c.venc), "num"]]), { act: addBtn("contasCasa", "Nova conta") })}</div>
    <p class="note">${ic("info")}<span>“Paguei” marca a conta e lança a despesa em Finanças na categoria Contas da casa (ou Moradia para aluguel e condomínio). Desfazer volta as duas coisas.</span></p>`;
}
function casaDocs() {
  const C = casaCalc(), tipos = [...new Set(C.docs.map(d => d.tipo || "Outro"))];
  return `<div class="g2c">${tipos.map(t => panel(`${ic("file")}${esc(t)}`, `<div class="list">${C.docs.filter(d => (d.tipo || "Outro") === t).sort((a, b) => (a.dias ?? 1e9) - (b.dias ?? 1e9)).map(d => `<div class="li"><button type="button" class="t lnkb" data-edit="docs" data-id="${d.id}">${esc(d.doc)}${d.ano ? ` <small class="muted">${d.ano}</small>` : ""}<div class="m">${d.onde ? `guardado em ${esc(d.onde)}` : "onde está guardado?"}${d.acao ? ` · ${esc(d.acao)}` : ""}${isNum(d.valor) && d.valor !== "" ? ` · ${eur(+d.valor, 2)}` : ""}</div></button>${d.validade ? pill(d.st, d.dias < 0 ? `venceu ${fmtDY(d.validade)}` : fmtDY(d.validade)) : ""}</div>`).join("")}</div>`)).join("") || `<div class="empty">Nenhum documento.</div>`}</div>
    <div class="row wrap" style="margin-top:12px">${addBtn("docs", "Novo documento")}</div>
    <p class="note">${ic("info")}<span>Guarde aqui o que você precisa achar uma vez por ano: contrato de aluguel e registro, recibos da TARI, contas anuais de condomínio, apólice do seguro, garantias. “Onde está guardado” evita a caça ao papel.</span></p>`;
}
function casaClick(t) {
  const a = t.dataset.act;
  if (a === "cpagar") { const c = S.contasCasa.find(x => x.id === t.dataset.id), d = t.dataset.d; if (!c) return true; c.pagos = { ...(c.pagos || {}), [d]: TODAY };
    const cat = /aluguel|condom/i.test(c.cat || "") ? "Moradia" : "Contas da casa", keys = ["contasCasa"];
    if (+c.valor > 0 && cat in CAT_DESP) { S.lanc.push({ id: uid(), data: TODAY, tipo: "Despesa", cat, desc: c.conta, valor: +c.valor, conta: c.debito === "Sim" ? "Conta corrente" : "PIX / transferência", origem: "casa" }); keys.push("lanc"); }
    touch(...keys, { label: "Conta paga" }); undoToast(`${c.conta} paga${keys.includes("lanc") ? " e lançada em Finanças" : ""}`); return true; }
  if (a === "climpmod") { for (const [rotina, nivel, comodo, freq, min] of LIMPEZA_MODELO) S.rotinas.push({ id: uid(), rotina, nivel, comodo, freq, min, ultima: addDays(TODAY, -Math.floor(freq / 2)) }); touch("rotinas", { label: "Modelo de limpeza" }); undoToast("13 rotinas criadas"); return true; }
  if (a === "cpadd") { const i = $("#cp_in"); cpAdd(i?.value); return true; }
  if (t.dataset.cpck) { const x = S.compras.find(z => z.id === t.dataset.cpck); if (x) { x.feito = t.checked; touch("compras", { label: "Compra", noUndo: true }); } return true; }
  if (a === "cpnova") { const n = S.compras.filter(x => x.feito && x.fixo !== "Sim").length; S.compras = S.compras.filter(x => !x.feito || x.fixo === "Sim").map(x => ({ ...x, feito: false })); touch("compras", { label: "Nova semana de compras" }); undoToast(`Nova semana: ${n} comprados saíram, fixos voltaram`); return true; }
  if (a === "cpcopy") { const txt = S.compras.filter(x => !x.feito).map(x => `- ${x.item}${x.qtd ? " (" + x.qtd + ")" : ""}`).join("\n"); try { navigator.clipboard.writeText(txt).then(() => toast("Lista copiada"), () => toast("Não consegui copiar nesta visualização")); } catch { toast("Não consegui copiar nesta visualização"); } return true; }
  return false;
}
