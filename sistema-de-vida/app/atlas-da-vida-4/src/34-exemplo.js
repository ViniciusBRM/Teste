/* ================================================================ modo exemplo: liga e desliga dados fictícios em todas as abas
   Os dados reais ficam guardados na memória e no banco, intactos. Enquanto o exemplo está ligado nada é gravado,
   o Notion fica desligado e o espaço a dois não escreve. Desligar devolve exatamente o estado anterior, com o seu histórico de desfazer. */
let EX_MODE = false, EX_REAL = null;
const EX_TXT = "Dormi 7 e meia, humor 4, corri 30 min, gastei 12,50 no almoço e 32,40 no mercado, meditei 15 min. Preciso ligar para o comune até sexta";
async function exOn() {
  if (EX_MODE) return;
  /* o modo exemplo não grava nada: se as últimas mudanças não foram salvas, entrar agora arriscaria perdê-las ao fechar a aba */
  if (STORE && dirty.size) { clearTimeout(saveTimer); for (let i = 0; i < 2 && dirty.size; i++) { try { await (FLUSHING || flush()); } catch (e) { console.warn("salvar", e); } }
    if (dirty.size) { toast("Não consegui salvar as últimas mudanças, então o modo exemplo não foi ligado. Tente de novo em instantes."); return; } }
  EX_REAL = { S, IS_EXAMPLE, undo: UNDO.splice(0), redo: REDO.splice(0), PD, MCP, NOTION_OK, ref: REF };
  EX_MODE = true; S = exampleData(); IS_EXAMPLE = false; MCP = null; NOTION_OK = false; REF = mkey(TODAY);
  PD = pdNew(); PD.text = EX_TXT; pdParse();
  applyLists(); VER++; snapAll(); render(); toast("Modo exemplo ligado: dados fictícios, nada é salvo.");
}
function exOff() {
  if (!EX_MODE) return; const R0 = EX_REAL; EX_MODE = false; EX_REAL = null;
  S = R0.S; IS_EXAMPLE = R0.IS_EXAMPLE; UNDO.splice(0, UNDO.length, ...R0.undo); REDO.splice(0, REDO.length, ...R0.redo); PD = R0.PD; MCP = R0.MCP; NOTION_OK = R0.NOTION_OK; REF = R0.ref;
  dirty.clear(); applyLists(); VER++; snapAll(); render(); toast("Modo exemplo desligado: de volta aos seus dados.");
}
const exToggle = () => EX_MODE ? exOff() : exOn();
const exBanner = () => EX_MODE ? `<div class="banner exb">${ic("eye")}<span><b>Modo exemplo.</b> Todas as abas estão preenchidas com dados fictícios para mostrar como funcionam. Pode clicar e editar à vontade: nada é salvo, e os seus dados continuam guardados.</span><button type="button" class="btn sm primary" data-act="extog">Desligar o exemplo</button></div>` : "";
