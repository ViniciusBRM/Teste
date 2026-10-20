/* ================================================================ Histórico de alterações (o motor está no 01-core: HX, hxDiff, hxAplica, hxDesfazer)
   Janela com o que foi criado, mudado ou apagado neste aparelho, do mais recente ao mais antigo, com Desfazer em cada passo
   (e Refazer no que foi desfeito). Abre pelo botão de relógio no topo (ao lado de desfazer e refazer) e pela busca (Ctrl K).
   Desfazer um passo antigo não apaga o que veio depois: volta só o que aquele passo mudou. Ctrl Z e a seta de desfazer, com a
   memória da página vazia (depois de recarregar), desfazem o último passo guardado aqui. */
const HXN = { secretario: "Lembretes e Secretário", rotinaAtiv: "Atividades da Rotina", rotinaModelos: "Modelos da Rotina", cfg: "Ajustes", ck: "Cockpit", ckTar: "Cockpit · tarefas", ckRisk: "Cockpit · riscos", ckIss: "Cockpit · problemas", ckLog: "Cockpit · diário de bordo", ckDec: "Cockpit · decisões", ckMeet: "Cockpit · reuniões", ckBim: "Cockpit · BIM", ckEl: "Cockpit · elaborati", ckLic: "Cockpit · lições", ckRel: "Cockpit · relatórios",
  nutri: "Alimentação", nutriLog: "Refeições", treino: "Treinos (fichas)", treinoLog: "Treinos (registros)", corridas: "Corridas", jornada: "Jornada", jardim: "Jardim", conselho: "Conselho", filosofia: "Filosofia", psique: "Psicologia", inspira: "Inspiração", guia: "Guia", marks: "Hábitos marcados", roda: "Roda da Vida", orc: "Orçamento", patr: "Patrimônio", alvo: "Alvos das áreas", revisao: "Revisão do mês", prio: "Prioridades",
  listas: "Listas", mentores: "Mentores", integ: "Integrações", experimentos: "Experimentos", radar: "Radar", fechamentos: "Fechamento da semana", capitulos: "Capítulos", resumos: "Resumos", bussola: "Bússola", bmExames: "Exames da Bússola", bmDecisoes: "Decisões da Bússola", projetos: "Projetos", carreira: "Carreira", lazerHub: "Lazer", idiomas: "Idiomas", fut: "Futuro financeiro", hojeCtx: "Hoje", priv: "Privacidade", areasCfg: "Áreas", saldoConta: "Saldo da conta", importacoes: "Importações", auditoria: "Registro da IA", uso: "Uso" };
const hxNomeChave = k => DSETS[k] || HXN[k] || k;
const HXV = { q: "", n: 60 };
function hxOnde(pg) { const [p, s] = String(pg || "").split("."); if (!p) return ""; const t = pageTitle(p), st = SUBS[p]?.find(x => x[0] === s)?.[1]; return st ? `${t} › ${st}` : t; }
/* o que mudou, em palavras: “+ Consulta”, “− Academia”, “Inglês: ini, fim” */
function hxDetalhes(e, max = 4) {
  const out = [], nome = (k, x) => hxTitulo(x) || hxNomeChave(k);
  for (const [k, ops] of Object.entries(e.k || {})) for (const op of ops) {
    if (out.length >= max) break;
    if (op[0] === "+") out.push(`+ ${nome(k, op[2])}`); else if (op[0] === "-") out.push(`− ${nome(k, op[2])}`);
    else if (op[0] === "~") { const it = (Array.isArray(S[k]) ? S[k] : []).find(x => String(x?.id) === String(op[2])); const fs = Object.keys(op[3]).filter(f => !HX_INT.has(f)); out.push(`${hxTitulo(it) || hxNomeChave(k)}${fs.length ? `: ${fs.slice(0, 4).join(", ")}` : ""}`); }
    else if (!op[2] && op[4] && isObj(op[5])) out.push(`+ ${hxTitulo(op[5]) || `${hxNomeChave(k)} ${op[1].at(-1) ?? ""}`}`);
    else if (op[2] && !op[4] && isObj(op[3])) out.push(`− ${hxTitulo(op[3]) || `${hxNomeChave(k)} ${op[1].at(-1) ?? ""}`}`);
    else out.push(`${hxNomeChave(k)}${op[1].length ? ` · ${op[1].slice(-2).join(" › ")}` : ""}`);
  }
  return out;
}
const hxVisiveis = () => { hxCarrega(); for (const e of HX.L) if (e.raw) hxProc(e); return HX.L.filter(e => !e.of && (e.grande || !e.k || Object.keys(e.k).length)); };
function hxLista() {
  const q = fold(HXV.q.trim()), L = hxVisiveis().slice().reverse().filter(e => !q || fold(`${e.l} ${hxRotulo(e)} ${hxOnde(e.pg)} ${hxDetalhes(e, 12).join(" ")} ${Object.keys(e.k || {}).map(hxNomeChave).join(" ")}`).includes(q));
  if (!L.length) return `<div class="empty">${HXV.q ? "Nada com esse texto no histórico." : "Nada ainda: o que você criar, mudar ou apagar aparece aqui, com Desfazer."}</div>`;
  let dia = "";
  return L.slice(0, HXV.n).map(e => { const d = iso(new Date(e.t)), cab = d !== dia ? `<div class="hxd">${d === TODAY ? "Hoje" : d === addDays(TODAY, -1) ? "Ontem" : fmtDL(d)}</div>` : ""; dia = d;
    const s = e.s || {}, chaves = Object.keys(e.k || {}).map(hxNomeChave).join(", "), det = hxDetalhes(e), hm = new Date(e.t);
    const res = [s.a ? `${s.a} criado${s.a > 1 ? "s" : ""}` : "", s.r ? `${s.r} apagado${s.r > 1 ? "s" : ""}` : "", s.m ? `${s.m} ${s.m > 1 ? "mudanças" : "mudança"}` : ""].filter(Boolean).join(" · ");
    return `${cab}<div class="hxr${e.u ? " u" : ""}"><time datetime="${new Date(e.t).toISOString()}">${pad(hm.getHours())}:${pad(hm.getMinutes())}</time>
      <div class="hxb"><b>${esc(hxRotulo(e))}</b><small>${esc([hxOnde(e.pg), chaves, res].filter(Boolean).join(" · "))}</small>${det.length ? `<small class="hxdet">${det.map(esc).join(" · ")}</small>` : ""}</div>
      <div class="hxa">${e.grande ? `<span class="muted small">grande demais para desfazer daqui</span>` : e.u ? `<span class="pill none">desfeito</span><button type="button" class="btn sm" data-hxu="${esc(e.h)}|1">${ic("redo")}Refazer</button>` : `<button type="button" class="btn sm" data-hxu="${esc(e.h)}|-1">${ic("undo")}Desfazer</button>`}${e.pg ? `<button type="button" class="iconbtn" data-hxgo="${esc(e.pg)}" aria-label="Ir para ${esc(hxOnde(e.pg))}" title="Ir para ${esc(hxOnde(e.pg))}">${ic("arrow")}</button>` : ""}</div></div>`; }).join("")
    + (L.length > HXV.n ? `<button type="button" class="btn sm ghost hxmais" data-act="hxmais">Mostrar mais (${L.length - HXV.n})</button>` : "");
}
function hxHTML() {
  const n = hxVisiveis().length;
  return `<div class="rtch"><div><h3>${ic("hist")}Histórico de alterações</h3><p class="muted small">O que você criou, mudou ou apagou neste aparelho (${plural(n, "passo", "passos")}, os 150 mais recentes), também depois de recarregar a página. Desfazer volta só aquele passo: o que veio depois fica.</p></div><button type="button" class="iconbtn" data-hxx="1" aria-label="Fechar">${ic("x")}</button></div>
    <input type="search" id="hx_q" class="hxq" placeholder="Buscar: lembrete, rotina, um nome…" value="${esc(HXV.q)}" aria-label="Buscar no histórico" autocomplete="off">
    <div class="hxl" id="hx_l">${hxLista()}</div>
    <div class="dlgfoot"><div>${n ? `<button type="button" class="btn sm ghost danger" data-act="hxlimpa">${ic("trash")}Limpar o histórico</button>` : ""}</div><div class="row"><button type="button" class="btn" data-hxx="1">Fechar</button></div></div>`;
}
function hxDlg() { const dlg = $("#dlg"); HXV.n = 60; dlg.innerHTML = `<form method="dialog" class="hxdlg wide" id="hxf">${hxHTML()}</form>`; if (!dlg.open) dlg.showModal(); setTimeout(() => $("#hx_q")?.focus(), 30); }
/* chamado depois de desfazer: redesenha a lista sem perder a busca nem a rolagem */
function hxPaint() { const l = $("#hx_l"); if (!l || !$("#dlg").open) return; const sc = l.scrollTop; l.innerHTML = hxLista(); l.scrollTop = sc; }
/* Ctrl Z sem passos na memória da página: desfaz o último passo guardado no histórico, e Refazer volta a fotografia */
function hxVolta() {
  const e = hxVisiveis().slice().reverse().find(x => !x.u && x.k && Object.keys(x.k).length); if (!e) { toast("Nada para desfazer"); return; }
  if (EX_MODE) { toast("Desligue o modo exemplo para mexer no histórico dos seus dados."); return; }
  const keys = Object.keys(e.k).filter(k => KEYS.includes(k)), back = {}; let conf = 0;
  for (const k of keys) { back[k] = SNAP[k]; const root = { v: hxClone(S[k] ?? null) }, r = hxAplica(root, e.k[k], -1); S[k] = root.v ?? EMPTY()[k]; conf += r.conf; }
  touch(...keys, { noUndo: true }); REDO.push({ b: back, l: e.l || hxRotulo(e), h: e.h }); hxMarca(e.h, true);
  toast(`Desfeito: ${e.l || hxRotulo(e)}${conf ? ` · ${plural(conf, "parte mudou", "partes mudaram")} depois e ficou como está` : ""}`, { l: "Refazer", f: redo });
  if (keys.includes("secretario") || keys.includes("integ")) lemGcSync();
  hxPaint();
}
const hxPodeVoltar = () => hxVisiveis().some(x => !x.u && x.k && Object.keys(x.k).length);
function hxClick(t) {
  const ds = t.dataset;
  if (ds.act === "hxopen") { hxDlg(); return true; }
  if (ds.hxu) { const [h, d] = ds.hxu.split("|"); hxDesfazer(h, +d); hxPaint(); return true; }
  if (ds.hxx) { $("#dlg").close(); return true; }
  if (ds.hxgo) { $("#dlg").close(); setHash(...ds.hxgo.split(".")); return true; }
  if (ds.act === "hxmais") { HXV.n += 60; hxPaint(); return true; }
  if (ds.act === "hxlimpa") { if (!t.dataset.c) { t.dataset.c = "1"; t.innerHTML = `${ic("trash")}Confirmar: limpar o histórico (os dados ficam)`; return true; }
    HX.L = []; HX.ok = true; try { localStorage.removeItem(HXK); } catch {} $("#dlg").close(); toast("Histórico limpo. Seus dados continuam iguais."); render(); return true; }
  return false;
}
function hxInput(t) { if (t.id !== "hx_q") return false; HXV.q = t.value; HXV.n = 60; const l = $("#hx_l"); if (l) l.innerHTML = hxLista(); return true; }
