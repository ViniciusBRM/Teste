"""Atlas 4 · Rotina: limpar o dia, a semana ou o mês, com confirmação. Dados de exemplo (fictícios).
Um botão na barra da Rotina, nas três vistas. Antes de mexer em qualquer coisa, um diálogo mostra o que sai (blocos avulsos,
a ocorrência dos blocos que se repetem, tarefas com horário se ficarem marcadas) e o que fica (agenda, aniversários, tarefas sem
horário, Cockpit). Cancelar e Esc não mudam nada; Limpar tira tudo do período num passo só de desfazer."""
import asyncio
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

SNAP = "JSON.stringify({ r: S.rotina, t: S.tarefas, e: S.eventos, k: S.ckTar, p: S.pessoas })"
DLG = "document.querySelector('#dlg[open] #rtclf')?.innerText || ''"
TOAST = "document.querySelector('#toast')?.innerText || ''"

async def prepara(pg, d):
    """dois blocos avulsos (um já marcado como feito), uma tarefa com horário e uma sem horário no dia d"""
    await pg.evaluate("""d => { S.rotina.push({ id: 'av1', data: d, ini: '05:00', fim: '05:30', titulo: 'Avulso TESTE 1', cat: 'Outro', rep: '', exc: [], st: {}, notas: '' },
        { id: 'av2', data: d, ini: '23:00', fim: '23:30', titulo: 'Avulso TESTE 2', cat: 'Outro', rep: '', exc: [], st: { [d]: 'feito' }, notas: '' });
      S.tarefas.push({ id: 'th1', tarefa: 'Ligar para o banco às 15h', projeto: '', area: 'Finanças', prio: 'Média', prazo: d, status: 'A fazer', notas: '' },
        { id: 'ts1', tarefa: 'Comprar presente', projeto: '', area: 'Família', prio: 'Média', prazo: d, status: 'A fazer', notas: '' });
      touch('rotina', 'tarefas', { noUndo: true }); }""", d)

async def dia(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia")
    try:
        await pg.wait_for_timeout(700)
        d = await pg.evaluate("TODAY")
        await prepara(pg, d)
        btn = await pg.evaluate("[...document.querySelectorAll('[data-act=rtclear]')].map(b => [b.textContent.trim(), !!b.closest('.rtbtns')])")
        chk(btn == [["Limpar o dia", True]], f"um botão só, na barra de cima: “Limpar o dia” ({btn})")
        antes = await pg.evaluate(SNAP)
        n0 = await pg.evaluate("rtOcc(TODAY).length"); rep0 = await pg.evaluate("rtOcc(TODAY).filter(b => b.rep).length")
        viz = await pg.evaluate("[rtOcc(addDays(TODAY, -1)).length, rtOcc(addDays(TODAY, 1)).length]")
        series = await pg.evaluate("S.rotina.filter(b => b.rep).length")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(200)
        t = await pg.evaluate(DLG)
        chk(f"{n0} blocos da rotina" in t and "1 tarefa com horário" in t and await pg.evaluate("document.querySelector('#rt_clt').checked"), f"o diálogo mostra os {n0} blocos do dia e a tarefa com horário, marcada")
        chk("Ficam:" in t and "1 tarefa sem horário" in t and "já marcado" in t, "e avisa o que fica (a tarefa sem horário) e que a marcação de feito sai junto")
        chk(await pg.evaluate("document.activeElement?.id") == "rtclx", "o foco abre em Cancelar: Enter não apaga sem querer")
        chk(await pg.evaluate(SNAP) == antes, "com o diálogo aberto, nada mudou ainda")
        await pg.click("#rtclx"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate(SNAP) == antes and not await pg.evaluate("document.querySelector('#dlg').open"), "Cancelar fecha sem mexer em nada")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(150); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate(SNAP) == antes and not await pg.evaluate("document.querySelector('#dlg').open"), "Esc também fecha sem mexer em nada")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(150)
        await pg.click("#rtclf [data-rtclok]"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("""({ occ: rtOcc(TODAY).length, viz: [rtOcc(addDays(TODAY, -1)).length, rtOcc(addDays(TODAY, 1)).length], av: S.rotina.filter(b => b.id.startsWith('av')).length,
          series: S.rotina.filter(b => b.rep).length, exc: S.rotina.filter(b => b.rep && (b.exc || []).includes(TODAY)).length, th: S.tarefas.some(t => t.id === 'th1'), ts: S.tarefas.some(t => t.id === 'ts1'),
          grade: document.querySelectorAll('.rtcol .rtb').length })""")
        chk(r["occ"] == 0 and r["grade"] == 0, f"o dia fica vazio, na conta e na grade ({r['occ']}, {r['grade']})")
        chk(r["av"] == 0, "os blocos avulsos do dia são apagados")
        chk(r["exc"] == rep0 and r["series"] == series, f"os que se repetem saem só deste dia ({r['exc']} de {rep0}): as {series} séries continuam")
        chk(r["viz"] == viz, f"ontem e amanhã ficam como estavam ({r['viz']})")
        chk(not r["th"] and r["ts"], "a tarefa com horário sai; a sem horário fica")
        toast = await pg.evaluate(TOAST)
        chk("Dia limpo" in toast and f"{n0} blocos" in toast and "1 tarefa" in toast, f"aviso com o que saiu ({toast[:80]})")
        await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate(SNAP) == antes, "Ctrl+Z desfaz tudo num passo só: blocos, repetições e tarefa")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(150); await pg.click("#rtclf [data-rtclok]"); await pg.wait_for_timeout(250)
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(200)
        chk(not await pg.evaluate("document.querySelector('#dlg').open") and "Nada para limpar neste dia" in await pg.evaluate(TOAST), "dia já vazio: avisa e não abre o diálogo")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def semana(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.semana")
    try:
        await pg.wait_for_timeout(700)
        w = await pg.evaluate("rtWeek(TODAY)")
        await prepara(pg, w[3])
        chk(await pg.evaluate("document.querySelector('.rtbtns [data-act=rtclear]').textContent.trim()") == "Limpar a semana", "na semana o botão diz “Limpar a semana”")
        n0 = await pg.evaluate("rtWeek(TODAY).reduce((s, d) => s + rtOcc(d).length, 0)")
        viz = await pg.evaluate("(w => [rtOcc(addDays(w[0], -1)).length, rtOcc(addDays(w[6], 1)).length])(rtWeek(TODAY))")
        ev = await pg.evaluate("JSON.stringify(S.eventos)")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(200)
        t = await pg.evaluate(DLG)
        chk(f"{n0} blocos da rotina" in t and "Limpar a semana?" in t, f"o diálogo conta os blocos dos 7 dias ({n0})")
        await pg.uncheck("#rt_clt"); await pg.click("#rtclf [data-rtclok]"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("({ dias: rtWeek(TODAY).map(d => rtOcc(d).length), viz: (w => [rtOcc(addDays(w[0], -1)).length, rtOcc(addDays(w[6], 1)).length])(rtWeek(TODAY)), th: S.tarefas.some(t => t.id === 'th1'), ev: JSON.stringify(S.eventos) })")
        chk(r["dias"] == [0] * 7, f"os 7 dias ficam vazios ({r['dias']})")
        chk(r["viz"] == viz, f"o domingo antes e a segunda depois ficam como estavam ({r['viz']})")
        chk(r["th"], "com a caixa das tarefas desmarcada, a tarefa com horário fica")
        chk(r["ev"] == ev, "a agenda não muda")
        chk("Semana limpa" in await pg.evaluate(TOAST), "aviso “Semana limpa”")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def mes(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.mes")
    try:
        await pg.wait_for_timeout(700)
        await prepara(pg, await pg.evaluate("TODAY.slice(0, 8) + '28'"))
        chk(await pg.evaluate("document.querySelector('.rtbtns [data-act=rtclear]').textContent.trim()") == "Limpar o mês", "no mês o botão diz “Limpar o mês”")
        DIAS = "Array.from({ length: 31 }, (_, i) => addDays(TODAY.slice(0, 8) + '01', i)).filter(x => x.slice(0, 7) === TODAY.slice(0, 7))"
        n0 = await pg.evaluate(f"{DIAS}.reduce((s, d) => s + rtOcc(d).length, 0)")
        viz = await pg.evaluate("[rtOcc(addDays(TODAY.slice(0, 8) + '01', -1)).length, rtOcc(addMonths(TODAY.slice(0, 8) + '01', 1)).length]")
        outros = await pg.evaluate("JSON.stringify({ e: S.eventos, k: S.ckTar, p: S.pessoas })")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(200)
        t = await pg.evaluate(DLG)
        chk(f"{n0} blocos da rotina" in t and "série continua" in t, f"o diálogo conta os blocos do mês ({n0}) e explica as repetições")
        chk("aniversário" in t and "tarefa" in t and "Cockpit" in t, f"e lista o que fica: agenda, aniversários, tarefas sem horário, Cockpit ({t.split('Ficam:')[1][:120] if 'Ficam:' in t else '—'})")
        await pg.click("#rtclf [data-rtclok]"); await pg.wait_for_timeout(400)
        r = await pg.evaluate(f"({{ cheios: {DIAS}.filter(d => rtOcc(d).length).length, viz: [rtOcc(addDays(TODAY.slice(0, 8) + '01', -1)).length, rtOcc(addMonths(TODAY.slice(0, 8) + '01', 1)).length], outros: JSON.stringify({{ e: S.eventos, k: S.ckTar, p: S.pessoas }}), cel: [...document.querySelectorAll('.rtmc:not(.out) i:not(.e)')].length }})")
        chk(r["cheios"] == 0 and r["cel"] == 0, f"todos os dias do mês ficam vazios, na conta e no calendário ({r['cheios']}, {r['cel']})")
        chk(r["viz"] == viz, f"o último dia do mês anterior e o 1º do seguinte ficam como estavam ({r['viz']})")
        chk(r["outros"] == outros, "agenda, aniversários e Cockpit não mudam")
        chk("Mês limpo" in await pg.evaluate(TOAST), "aviso “Mês limpo”")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def celular(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.semana")
    try:
        await pg.wait_for_timeout(700)
        r = await pg.evaluate("(() => { const b = document.querySelector('.rtbtns [data-act=rtclear]').getBoundingClientRect(); return { l: b.left, r: b.right, h: b.height, sw: document.documentElement.scrollWidth }; })()")
        chk(r["l"] >= 0 and r["r"] <= 390 and r["h"] >= 32 and r["sw"] <= 390, f"no celular o botão cabe na tela, com altura de toque, sem rolagem lateral ({r})")
        await pg.click("[data-act=rtclear]"); await pg.wait_for_timeout(200)
        d = await pg.evaluate("(() => { const x = document.querySelector('#dlg').getBoundingClientRect(), k = document.querySelector('#rtclf [data-rtclok]').getBoundingClientRect(); return { l: x.left, r: x.right, kb: k.bottom, vh: innerHeight }; })()")
        chk(d["l"] >= 0 and d["r"] <= 390 and d["kb"] <= d["vh"], f"o diálogo e o botão Limpar cabem na tela ({d})")
        await pg.click("#rtclf [data-rtclok]"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("rtWeek(TODAY).every(d => !rtOcc(d).length)"), "e a semana fica limpa")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("dia", dia), ("semana", semana), ("mês", mes), ("celular", celular)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
