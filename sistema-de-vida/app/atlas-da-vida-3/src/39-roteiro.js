/* ================================================================ roteiro de áudio do Painel do dia
   Um guia de fala, em 13 blocos, que cobre tudo o que o dia alimenta: cada bloco diz o que falar, dá uma frase-modelo que o
   leitor do texto entende (montada com os seus hábitos, tarefas, contas, blocos da rotina, livros e valores em foco) e mostra,
   ao vivo, se aquele bloco já foi capturado. A gravação é o próprio campo “Conte o dia” (microfone ou ditado do sistema).
   O leitor do texto ganhou o que antes só se marcava à mão: tarefas concluídas, limpezas e contas da casa, blocos da Rotina
   (feito, parcial, pulado) e as notas do exame da noite da Bússola (pratiquei, tentei, esqueci). Tudo passa pela revisão. */
const PDR = { open: (() => { try { return localStorage.getItem("atlas_pdrot") !== "0"; } catch { return true; } })(), tele: false, i: 0 };
const PDX_STOP = new Set("a o as os de da do das dos e em no na nos nas para pra por com um uma uns umas que ate sem sobre ao aos meu minha seu sua dia".split(" "));
const pdKw = s => fold(String(s || "")).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length >= 3 && !PDX_STOP.has(w));
/* o trecho fala daquele item: as palavras do nome aparecem (pelo radical), pelo menos duas quando o nome tem mais de uma */
function pdHit(F, title) { const ws = pdKw(title); if (!ws.length) return false; const n = ws.filter(w => new RegExp(`\\b${w.slice(0, Math.max(3, w.length - 2))}`).test(F)).length; return n >= Math.min(2, ws.length); }
const PDX_TASK = /\b(conclui|terminei|finalizei|entreguei|resolvi|fiz|enviei|mandei|marquei|agendei|liguei|paguei|comprei|consegui|fechei|cumpri)\b/;
const PDX_CASA = /\b(limpei|lavei|arrumei|passei|aspirei|tirei|troquei|fiz|organizei|varri|esfreguei|guardei|reguei|dobrei|recolhi)\b/;
const PDX_CONTA = /\b(paguei|quitei|transferi)\b/;
const PDX_BM = [[/^(nao pratiquei|esqueci(?: de)?|falhei(?: em| na| no)?)$/, 0], [/^tentei$/, 1], [/^(pratiquei|vivi|exercitei)$/, 2]];
const pdR3 = () => { PD.bm ||= {}; PD.rt ||= {}; PD.chkT ||= {}; pdL(); return PD; };
function pdReset3() {
  pdR3();
  for (const k of Object.keys(PD.chkT)) { const [g, ...r] = k.split("|"); delete PD.chk[g]?.[r.join("|")]; }
  PD.chkT = {};
  for (const id of Object.keys(PD.bm)) if (PD.bm[id].src === "texto") delete PD.bm[id];
  for (const id of Object.keys(PD.rt)) if (PD.rt[id].src === "texto") delete PD.rt[id];
}
function pdParse3(txt) {
  pdR3(); const d = PD.date, cl = capSplit(txt), CD = pdCasaDia(d), mark = (g, key) => { if (PD.chk[g][key] && !PD.chkT[`${g}|${key}`]) return; PD.chk[g][key] = 1; PD.chkT[`${g}|${key}`] = 1; };
  for (const { F } of cl) {
    if (PDX_TASK.test(F)) for (const t of pdTarefasDia(d)) if (pdHit(F, t.tarefa)) mark("tdone", t.id);
    if (PDX_CASA.test(F)) for (const r of CD.rot) if (pdHit(F, r.rotina)) mark("rot", r.id);
    /* uma frase paga uma ocorrência de cada conta: a mais antiga em aberto (a lista vem em ordem de vencimento) */
    const pagas = new Set();
    if (PDX_CONTA.test(F)) for (const { c, v } of CD.contas) if (!pagas.has(c.id) && (pdHit(F, c.conta) || pdKw(c.cat).some(w => new RegExp(`\\b${w}`).test(F) && w.length >= 4))) {
      pagas.add(c.id); mark("conta", `${c.id}|${v}`);
      /* a conta paga já lança a despesa: o gasto do mesmo trecho não entra em dobro */
      PD.gastos = PD.gastos.filter(g => !(g.src === "texto" && (pdHit(fold(g.d || ""), c.conta) || (Math.abs((pdMoney(g.v) || 0) - (+c.valor || 0)) < .01 && F.includes(fold(String(g.d || "")).slice(0, 6))))));
    }
  }
  /* blocos da rotina: cada verbo vale até o próximo (“fiz o café, pulei o deslocamento”) */
  { const F = fold(txt), rx = /\b(pulei|faltei|nao fiz|perdi|deixei de|fiz pela metade|fiz metade|fiz em parte|fiz|cumpri|completei|segui)\b/g, hits = []; let m;
    while ((m = rx.exec(F))) hits.push([m.index, m[0], m.index + m[0].length]);
    hits.forEach(([, verb, end], i) => { const stop = Math.min(hits[i + 1]?.[0] ?? F.length, (F.slice(end).search(/[.;!?\n]/) + 1 || F.length + 1) - 1 + end), seg = F.slice(end, stop), st = /pulei|faltei|nao fiz|perdi|deixei/.test(verb) ? "pulado" : /metade|em parte/.test(verb + seg.slice(0, 30)) ? "parcial" : "feito";
      for (const b of rtOcc(d)) if (pdHit(seg, b.titulo) && PD.rt[b.id]?.src !== "mao") PD.rt[b.id] = { st, src: "texto" }; }); }
  /* exame da noite: “pratiquei paciência e gentileza, tentei humildade, esqueci a temperança” */
  const F = fold(txt), names = BM_V.map(v => [v.id, fold(v.nome)]), rx = /\b(nao pratiquei|esqueci(?: de)?|falhei(?: em| na| no)?|tentei|pratiquei|vivi|exercitei)\b/g; let m; const hits = [];
  while ((m = rx.exec(F))) hits.push([m.index, m[0], m.index + m[0].length]);
  hits.forEach(([, verb, end], i) => { const stop = Math.min(hits[i + 1]?.[0] ?? F.length, (F.slice(end).search(/[.;!?\n]/) + 1 || F.length + 1) - 1 + end), seg = F.slice(end, stop), v = PDX_BM.find(([r]) => r.test(verb))?.[1];
    if (v == null) return; for (const [id, nm] of names) if (new RegExp(`\\b${nm}\\b`).test(seg) && PD.bm[id]?.src !== "mao") PD.bm[id] = { v, src: "texto" }; });
}
function pdRows3(rows, d) {
  pdR3(); const e = bmEx()[d] || {}, set = Object.entries(PD.bm).filter(([id]) => bmV(id));
  if (set.length) { const diff = set.filter(([id, x]) => e.n?.[id] !== x.v), lbl = ["esqueci", "tentei", "pratiquei"];
    if (diff.length) rows.push({ id: "b.exame", txt: `Exame da noite: ${diff.map(([id, x]) => `${bmV(id).nome} ${lbl[x.v]}`).join(", ")}`, kind: diff.some(([id]) => e.n?.[id] != null) ? "subst" : "novo", old: diff.filter(([id]) => e.n?.[id] != null).map(([id]) => `${bmV(id).nome} ${lbl[e.n[id]]}`).join(", "), dest: "bmExames", on: true,
      apply: () => { const cur = bmEx()[d] || { n: {} }; S.bmExames = { ...bmEx(), [d]: { ...cur, n: { ...(cur.n || {}), ...Object.fromEntries(diff.map(([id, x]) => [id, x.v])) }, at: Date.now() } }; return ["bmExames"]; } }); }
  const occ = rtOcc(d);
  for (const [id, x] of Object.entries(PD.rt)) { const b = occ.find(z => z.id === id); if (!b || b.st === x.st) continue;
    rows.push({ id: `q.${id}`, txt: `Rotina: ${b.titulo} ${b.ini}–${b.fim} · ${ST_TXT[x.st] || x.st}`, kind: b.st ? "subst" : "novo", old: b.st ? ST_TXT[b.st] || b.st : "", dest: "rotina", on: true, apply: () => { const z = S.rotina.find(q => q.id === id); if (z) { if (z.feitos) delete z.feitos[d]; z.st = { ...(z.st || {}), [d]: x.st }; } return ["rotina"]; } }); }
}
/* bloco manual: exame da noite e blocos da rotina de hoje */
function pdMore3HTML() {
  pdR3(); const d = PD.date, e = bmEx()[d] || {}, foco = [...new Set([...(bmFoco().length ? bmFoco() : ["consciencia", "paciencia", "compaixao"]), ...Object.keys(PD.bm)])].filter(id => bmV(id)), occ = rtOcc(d), lbl = ["esqueci", "tentei", "pratiquei"];
  const tag = src => src === "texto" ? `<em class="pdsrc s-texto">do texto</em>` : "";
  return `<div class="pdblk" id="sec_bm"><div class="pdfl"><span class="pdlab">${ic("compass")}Exame da noite e rotina</span><small class="pdhint">${e.n && Object.keys(e.n).length ? "o exame deste dia já tem notas" : "valores em foco"}</small></div>
    ${foco.map(id => { const x = PD.bm[id], cur = x ? x.v : e.n?.[id]; return `<div class="pdbm"><span>${esc(bmV(id).nome)}${tag(x?.src)}</span><div class="segs">${lbl.map((l, v) => `<button type="button" class="seg" data-pdbm="${id}|${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div></div>`; }).join("")}
    ${occ.length ? `<div class="flbl">Blocos da rotina de ${relDay(d) === "hoje" ? "hoje" : fmtD(d)}</div>${occ.map(b => { const x = PD.rt[b.id], cur = x ? x.st : b.st; return `<div class="pdbm"><span>${esc(b.titulo)} <small class="muted">${b.ini}–${b.fim}</small>${tag(x?.src)}</span><div class="segs">${[["feito", "feito"], ["parcial", "parcial"], ["pulado", "pulei"]].map(([k, l]) => `<button type="button" class="seg" data-pdrt="${b.id}|${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div></div>`; }).join("")}` : ""}</div>`;
}

/* ---------------------------------------------------------------- o roteiro */
const pdList = (a, n = 3, sep = ", ") => a.slice(0, n).join(sep);
function pdRotBlocks() {
  pdR3(); const d = PD.date, V = PD.v, L = pdL(), tds = pdTarefasDia(d), CD = pdCasaDia(d), occ = rtOcc(d), foco = (bmFoco().length ? bmFoco() : ["consciencia", "paciencia", "compaixao"]).map(id => bmV(id)?.nome.toLowerCase()).filter(Boolean);
  const hab = S.habitos.map(h => h.nome.toLowerCase().replace(/\s*\d.*$/, "").trim()).filter(Boolean), livro = lerItens()[0], pessoa = S.pessoas[0]?.nome?.split(" ")[0], pessoa2 = S.pessoas[1]?.nome?.split(" ")[0], nOn = o => Object.keys(o || {}).length, has = k => V[k] !== "" && V[k] != null;
  const habOn = S.habitos.filter(pdHabOn).length;
  return [
    { id: "dia", t: "Abertura", q: "Diga de que dia você está falando.", ex: "Hoje.", hint: "Se for o dia anterior, comece com “Ontem”.", dest: "todas as abas", st: [true, relDay(d) === "hoje" ? "hoje" : fmtD(d)] },
    { id: "corpo", t: "Sono e corpo", q: "Quantas horas dormiu e como estão humor, energia e estresse, de 1 a 5. Se mediu, peso e passos.", ex: "Dormi 7 e meia, humor 4, energia 3, estresse 2, pesei 72,5, 8 mil passos.", dest: "Saúde",
      st: (() => { const n = ["sono", "humor", "energia", "estresse"].filter(has).length; return [n >= 2, `${n} de 4${has("peso") ? " · peso" : ""}${has("passos") ? " · passos" : ""}`]; })() },
    { id: "treino", t: "Movimento", q: "Que treino fez e por quantos minutos.", ex: "Corri 30 minutos.", hint: "Outros jeitos: “academia 50 minutos”, “caminhei 40 minutos”. Se não treinou, pule.", dest: "Saúde", st: [has("treino"), has("treino") ? `${V.treino}${V.min ? " " + V.min + " min" : ""}` : "nada ainda"] },
    { id: "din", t: "Dinheiro", q: "Cada gasto com valor e onde; o que recebeu; o que guardou.", ex: "Gastei 12,50 no almoço e 32,40 no mercado. Recebi 2800 de salário. Guardei 200 na reserva.", dest: "Finanças", st: [PD.gastos.some(g => g.v), plural(PD.gastos.filter(g => g.v).length, "lançamento", "lançamentos")] },
    { id: "casa", t: "Casa", q: "O que limpou ou arrumou e que conta pagou.", ex: [CD.rot[0] ? `Fiz ${CD.rot[0].rotina.toLowerCase()}.` : "Limpei a cozinha.", CD.contas[0] ? `Paguei a conta de ${CD.contas[0].c.conta.toLowerCase()}.` : ""].filter(Boolean).join(" "), dest: "Casa & docs",
      hint: CD.rot.length + CD.contas.length ? `Pendentes: ${pdList([...CD.rot.map(r => r.rotina), ...CD.contas.map(x => x.c.conta)], 4)}` : "nada vencendo", st: [nOn(PD.chk.rot) + nOn(PD.chk.conta) > 0 || !(CD.rot.length + CD.contas.length), `${nOn(PD.chk.rot) + nOn(PD.chk.conta)} de ${CD.rot.length + CD.contas.length}`] },
    { id: "hab", t: "Hábitos", q: "Diga cada hábito que cumpriu, pelo nome.", ex: hab.length ? `${pdList(hab, 4)}: feito.` : "Meditei, li, bebi água.", dest: "Hábitos", hint: hab.length ? `Seus hábitos: ${pdList(S.habitos.map(h => h.nome), 8)}` : "", st: [habOn > 0, `${habOn} de ${S.habitos.length}`] },
    { id: "tar", t: "Tarefas", q: "O que concluiu e o que surgiu para fazer, com prazo.", ex: `${tds[0] ? `Concluí ${tds[0].tarefa.toLowerCase()}. ` : ""}Preciso ligar para o banco até sexta.`, dest: "Metas & tarefas", hint: tds.length ? `Vencendo: ${pdList(tds.map(t => t.tarefa), 4)}` : "",
      st: [nOn(PD.chk.tdone) + L.tar.length > 0, `${nOn(PD.chk.tdone)} concluída(s) · ${L.tar.length} nova(s)`] },
    { id: "rot", t: "Rotina", q: "Quais blocos do dia você fez, fez pela metade ou pulou.", ex: occ.length ? `Fiz ${occ[0].titulo.toLowerCase()}${occ.find(b => norm(b.titulo) !== norm(occ[0].titulo)) ? `, pulei ${occ.find(b => norm(b.titulo) !== norm(occ[0].titulo)).titulo.toLowerCase()}` : ""}.` : "Fiz o bloco de estudo, pulei a academia.", dest: "Rotina", hint: occ.length ? `Blocos de hoje: ${pdList(occ.map(b => b.titulo), 5)}` : "sem blocos neste dia",
      st: [nOn(PD.rt) > 0 || !occ.length, `${nOn(PD.rt)} de ${occ.length}`] },
    { id: "pes", t: "Pessoas", q: "Com quem conversou, como e por quanto tempo.", ex: `Almocei com ${pessoa || "a Ana"}. Liguei para ${pessoa2 || "o Pedro"} 20 minutos.`, dest: "Relações", st: [L.cont.length > 0, plural(L.cont.length, "contato", "contatos")] },
    { id: "est", t: "Estudo, idiomas e leitura", q: "Quanto estudou de cada idioma ou curso e quantas páginas leu.", ex: `Estudei inglês 30 minutos. Estudei italiano 15 minutos. Li 20 páginas de ${livro || "o livro"}.`, dest: "Idiomas · Crescimento", st: [L.est.length + L.ler.length > 0, `${L.est.length} estudo(s) · ${L.ler.length} leitura(s)`] },
    { id: "jor", t: "Jornada e Bússola", q: "A prática do dia, com minutos, e o exame da noite: o que praticou, tentou ou esqueceu.", ex: `Meditei 15 minutos. Pratiquei ${foco[0] || "paciência"}, tentei ${foco[1] || "humildade"}, esqueci ${foco[2] || "gentileza"}.`, dest: "Jornada existencial",
      st: [has("pmin") || nOn(PD.bm) > 0, `${has("pmin") ? `${V.pmin} min de prática` : "sem prática"} · ${nOn(PD.bm)} valor(es)`] },
    { id: "lz", t: "Lazer", q: "O que fez por prazer e por quanto tempo.", ex: "Fui ao cinema 2 horas.", dest: "Lazer", st: [has("lzat"), has("lzat") ? `${V.lzat}${V.lzh ? " " + V.lzh + " h" : ""}` : "nada ainda"] },
    { id: "diario", t: "Fechamento", q: "Em poucas frases: o que marcou o dia, onde agi bem, onde falhei, pelo que sou grato e o que levo para amanhã.", ex: "O que marcou hoje foi a conversa com a equipe. Agi bem quando escutei antes de responder. Falhei quando me irritei no trânsito. Sou grato pelo almoço em família. Amanhã quero dormir mais cedo.", dest: "Diário", st: [PD.text.trim().split(/\s+/).length >= 40 && PD.diario, `${PD.text.trim() ? PD.text.trim().split(/\s+/).length : 0} palavras`] }];
}
function pdRotList() {
  const B = pdRotBlocks(), ok = B.filter(b => b.st[0]).length;
  if (PDR.tele) { const i = Math.min(PDR.i, B.length - 1), b = B[i];
    return `<div class="pdtele"><div class="pdtl-top"><span>${i + 1} de ${B.length} · ${esc(b.t)}</span><span class="pdrs ${b.st[0] ? "ok" : ""}">${ic(b.st[0] ? "check" : "clock")}${esc(b.st[1])}</span></div><p class="pdtl-q">${esc(b.q)}</p><p class="pdtl-ex">“${esc(b.ex)}”</p>${b.hint ? `<p class="small muted">${esc(b.hint)}</p>` : ""}
      <div class="row wrap"><button type="button" class="btn sm" data-act="pdrprev"${i ? "" : " disabled"}>${ic("back")}Anterior</button><button type="button" class="btn sm primary" data-act="pdrnext"${i < B.length - 1 ? "" : " disabled"}>Próximo${ic("arrow")}</button><span class="muted small">${ok} de ${B.length} blocos capturados</span></div></div>`; }
  return `<div class="pdrprog"><i style="width:${Math.round(100 * ok / B.length)}%"></i></div><ol class="pdrl">${B.map((b, i) => `<li class="${b.st[0] ? "ok" : ""}"><span class="pdrn">${b.st[0] ? ic("check") : i + 1}</span><div><b>${esc(b.t)}</b> <small class="muted">→ ${esc(b.dest)}</small><p>${esc(b.q)}</p><p class="pdrex">“${esc(b.ex)}”</p>${b.hint ? `<small class="muted">${esc(b.hint)}</small>` : ""}</div><small class="pdrs">${esc(b.st[1])}</small></li>`).join("")}</ol>`;
}
function pdRoteiroHTML() {
  const B = pdRotBlocks(), ok = B.filter(b => b.st[0]).length;
  return `<details class="pn pdrot" id="pd_rot"${PDR.open ? " open" : ""}><summary data-act="pdropen">${ic("mic")}<b>Roteiro de áudio do dia</b><span class="muted small">13 blocos · cerca de 3 minutos · <span id="pd_rotn">${ok} de ${B.length}</span> capturados</span></summary>
    <p class="small muted">Leia o bloco e responda em voz alta, no tom de uma conversa. Tudo vai para o campo “Conte o dia”, que preenche as abas; nada é salvo antes da revisão. Pule o que não se aplica.</p>
    <div class="row wrap pdract"><button type="button" class="btn sm primary" data-act="pdrrec">${ic("mic")}${VOZ.on === "texto" ? "Parar a gravação" : "Gravar as respostas"}</button><button type="button" class="btn sm" data-act="pdrtele" aria-pressed="${PDR.tele}">${ic("eye")}${PDR.tele ? "Ver a lista" : "Um bloco por vez"}</button><button type="button" class="btn sm ghost" data-act="pdrcopy">${ic("copy")}Copiar o roteiro</button><button type="button" class="btn sm ghost" data-act="pdrtxt">${ic("download")}Baixar (.txt)</button></div>
    <div id="pd_rotl">${pdRotList()}</div></details>`;
}
function pdRotText() {
  const B = pdRotBlocks();
  return `ROTEIRO DE ÁUDIO · PAINEL DO DIA · ${fmtDL(PD.date)}\nResponda em voz alta, na ordem. Pule o que não se aplica.\n\n` + B.map((b, i) => `${i + 1}. ${b.t.toUpperCase()} (vai para: ${b.dest})\n   ${b.q}\n   Exemplo: “${b.ex}”${b.hint ? `\n   ${b.hint}` : ""}`).join("\n\n") + `\n\nDepois: cole ou dite as respostas no campo “Conte o dia” do Painel, revise e salve.\n`;
}
function pdRotPaint() { const el = $("#pd_rotl"); if (!el) return; const h = pdRotList(); if (el.innerHTML !== h) el.innerHTML = h; const n = $("#pd_rotn"); if (n) { const B = pdRotBlocks(); n.textContent = `${B.filter(b => b.st[0]).length} de ${B.length}`; } }
function pd3Click(t) {
  const ds = t.dataset, a = ds.act;
  if (a === "pdropen") { setTimeout(() => { PDR.open = $("#pd_rot")?.open ?? PDR.open; try { localStorage.setItem("atlas_pdrot", PDR.open ? "1" : "0"); } catch {} }, 0); return false; }
  if (a === "pdrtele") { PDR.tele = !PDR.tele; render(); return true; }
  if (a === "pdrnext" || a === "pdrprev") { PDR.i = Math.max(0, Math.min(12, PDR.i + (a === "pdrnext" ? 1 : -1))); pdRotPaint(); return true; }
  if (a === "pdrrec") { $('[data-pdmic="texto"]')?.click(); setTimeout(() => render(), 50); return true; }
  if (a === "pdrcopy") { const tx = pdRotText(); (navigator.clipboard?.writeText(tx) || Promise.reject()).then(() => toast("Roteiro copiado"), () => { saveFile("roteiro-do-dia.txt", tx); }); return true; }
  if (a === "pdrtxt") { saveFile(`roteiro-do-dia-${PD.date}.txt`, pdRotText()); return true; }
  if (ds.pdbm) { const [id, v] = ds.pdbm.split("|"); pdR3(); if (PD.bm[id]?.v === +v) delete PD.bm[id]; else PD.bm[id] = { v: +v, src: "mao" }; pdStore(); render(); return true; }
  if (ds.pdrt) { const [id, st] = ds.pdrt.split("|"); pdR3(); if (PD.rt[id]?.st === st) delete PD.rt[id]; else PD.rt[id] = { st, src: "mao" }; pdStore(); render(); return true; }
  return false;
}
