
/* ================================================================ modo exemplo: liga e desliga dados fictícios em todas as abas
   Os dados reais ficam guardados na memória e no banco, intactos. Enquanto o exemplo está ligado nada é gravado,
   o Notion fica desligado e o espaço a dois não escreve. Desligar devolve exatamente o estado anterior, com o seu histórico de desfazer.
   A troca é atômica: espera a gravação e a releitura do banco em andamento (as duas leem S depois de esperar a rede), não
   aceita um segundo toque enquanto troca nem logo depois (duplo toque não desliga e liga de novo), não troca antes de os
   dados abrirem nem com a IA respondendo (a resposta cairia no conjunto errado). O estado de tela que guarda cópia de dados
   (rascunhos, buscas, textos da IA, avisos) é guardado ao ligar e devolvido ao desligar: nada do exemplo sobra. */
let EX_MODE = false, EX_REAL = null, EX_BUSY = false, EX_T = 0;
const EX_TXT = "Dormi 7 e meia, humor 4, corri 30 min, gastei 12,50 no almoço e 32,40 no mercado, meditei 15 min. Preciso ligar para o comune até sexta";
/* estado de tela com cópia de dados: [objeto, valores enquanto o exemplo está ligado] */
const EX_TELA = () => [[DIA, { draft: null, focus: null, day: null, ai: null }], [SEM, { res: null, sim: null }], [CH, { sel: null, ai: {} }], [BM, { sel: null, dia: null, draft: null, ai: "" }],
  [FIL, { tri: null, dil: "", dsrc: null, txt: "" }], [J, { dr: {}, cot: {}, rev: "" }], [J.circ, { q: "", txt: "" }], [PJ, { edit: null, open: null, f: {} }], [CK, { ger: null, relOpen: null }],
  [TRV, { draft: null }], [SEC, { nudge: null }], [EXP, { sel: null }]];
const exTelaGuarda = () => EX_TELA().map(([o, d]) => [o, Object.fromEntries(Object.keys(d).map(k => [k, o[k]]))]);
const exTelaZera = () => { for (const [o, d] of EX_TELA()) for (const k in d) o[k] = structuredClone(d[k]); DG.sel.clear(); };
/* “uso” é só contagem de abas: não segura a troca; fica pendente e vai junto quando o exemplo desligar */
const exPendente = () => [...dirty].some(k => k !== "uso");
const exOcupado = () => AI_VIVO > 0 || !!GCAL.busy;
function exBtnPaint() { for (const b of $$(".exbtn")) { b.classList.toggle("busy", EX_BUSY); b.setAttribute("aria-busy", String(EX_BUSY)); const s = b.querySelector("span:not(.ico)"); if (s) s.textContent = EX_BUSY ? "Ligando…" : "Exemplo"; } }
async function exOn() {
  if (EX_MODE || EX_BUSY) return;
  if (!LOADED) { toast("Espere os seus dados terminarem de abrir."); return; }
  if (exOcupado()) { toast("Espere a IA terminar (ou toque em Parar) antes de ligar o modo exemplo."); return; }
  EX_BUSY = true; EX_T = Date.now(); exBtnPaint();
  try {
    /* o modo exemplo não grava nada: o que falta salvar vai antes, senão fechar a aba agora perderia */
    if (STORE && exPendente()) { clearTimeout(saveTimer); for (let i = 0; i < 2 && exPendente(); i++) { try { await (FLUSHING || flush()); } catch (e) { console.warn("salvar", e); } }
      if (exPendente()) { toast("Não consegui salvar as últimas mudanças, então o modo exemplo não foi ligado. Tente de novo em instantes."); return; } }
    while (FLUSHING || PULLING) await (FLUSHING || PULLING).catch(() => {});
    if (EX_MODE || exOcupado()) return;
    clearTimeout(saveTimer);
    EX_REAL = { S, IS_EXAMPLE, undo: UNDO.splice(0), redo: REDO.splice(0), PD, MCP, NOTION_OK, ref: REF, pend: [...dirty], tela: exTelaGuarda() };
    dirty.clear(); exTelaZera();
    EX_MODE = true; S = exampleData(); IS_EXAMPLE = false; MCP = null; NOTION_OK = false; REF = mkey(TODAY);
    PD = pdNew(); PD.text = EX_TXT; pdParse();
  } finally { EX_BUSY = false; EX_T = Date.now(); exBtnPaint(); }
  if (!EX_MODE) return;
  applyLists(); VER++; snapAll(); render(); toast("Modo exemplo ligado: dados fictícios, nada é salvo.");
}
function exOff() {
  if (!EX_MODE || EX_BUSY) return;
  if (exOcupado()) { toast("Espere a IA terminar (ou toque em Parar) antes de desligar o modo exemplo."); return; }
  const R0 = EX_REAL; EX_MODE = false; EX_REAL = null; EX_T = Date.now();
  S = R0.S; IS_EXAMPLE = R0.IS_EXAMPLE; UNDO.splice(0, UNDO.length, ...R0.undo); REDO.splice(0, REDO.length, ...R0.redo); PD = R0.PD; MCP = R0.MCP; NOTION_OK = R0.NOTION_OK; REF = R0.ref;
  exTelaZera(); for (const [o, v] of R0.tela) Object.assign(o, v);
  dirty.clear(); for (const k of R0.pend) dirty.add(k);
  applyLists(); VER++; snapAll(); render(); toast("Modo exemplo desligado: de volta aos seus dados.");
  if (dirty.size) flushSoon(); if (PULL.size) pullRemote();   /* o que chegou de outro aparelho durante o exemplo entra agora, nos seus dados */
}
/* toque duplo (ou dois toques seguidos) não desliga e liga de novo: a próxima troca só depois de 0,7 s */
const exToggle = () => { if (EX_BUSY || Date.now() - EX_T < 700) return; EX_MODE ? exOff() : exOn(); };
const exBanner = () => EX_MODE ? `<div class="banner exb">${ic("eye")}<span><b>Modo exemplo.</b> Todas as abas estão preenchidas com dados fictícios para mostrar como funcionam. Pode clicar e editar à vontade: nada é salvo, e os seus dados continuam guardados.</span><button type="button" class="btn sm primary" data-act="exoff">Desligar o exemplo</button></div>` : "";
