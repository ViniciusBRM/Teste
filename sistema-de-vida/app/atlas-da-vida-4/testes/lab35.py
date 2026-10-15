"""Atlas 4 · modelo de rotina com as cores da planilha e compromissos que repetem todo ano. Dados fictícios.
Modelo: fica nos modelos sem ser aplicado; ao aplicar, cada bloco leva a cor de fundo e a da letra; a grade, o mês e o cartão
usam essa cor; copiar, duplicar e salvar a semana como modelo mantêm a cor. Compromisso anual: aparece no mesmo dia todo ano
(29/02 cai em 28/02), na Rotina (dia, mês) e na Visão geral; o aniversário que já vem da ficha da pessoa não se repete."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
MOD = {"id": "m_teste", "nome": "Semana de teste", "semana": [
    [1, "00:00", "07:00", "Sonno", "Descanso", "#FFC7CE", "#9C0006"], [1, "07:00", "07:30", "Colazione", "Descanso", "#FFEDA3", "#9C6500"], [1, "09:00", "12:00", "Lavoro", "Trabalho", "#BFBFBF", "#454545"],
    [2, "07:00", "07:30", "Colazione", "Descanso", "#FFEDA3", "#9C6500"], [2, "20:00", "21:00", "Studio", "Estudo", "#FFFFFF", "#B49200"],
    [0, "10:00", "12:00", "Passeggiata", "Lazer", "#389BB2", "#FFFFFF"]]}
SEED = {U + "s_rotinaModelos": {"v": [MOD], "at": 1, "r": "M0"},
        U + "s_pessoas": {"v": [{"id": "p1", "nome": "Ana Teste", "relacao": "Amizade", "freq": "", "aniv": "1900-10-12", "notas": ""}], "at": 1, "r": "P0"},
        U + "s_eventos": {"v": [{"id": "e1", "data": "2024-10-12", "titulo": "Aniversário de Ana Teste", "rep": "anual", "pessoa": "p1", "hora": "", "fim": "", "local": ""},
                                {"id": "e2", "data": "2024-10-20", "titulo": "Aniversário de Beto Teste", "rep": "anual", "hora": "", "fim": "", "local": ""},
                                {"id": "e3", "data": "2024-02-29", "titulo": "Aniversário bissexto", "rep": "anual", "hora": "", "fim": "", "local": ""},
                                {"id": "e4", "data": "2026-10-13", "titulo": "Dentista", "hora": "15:00", "fim": "16:00", "local": ""}], "at": 1, "r": "E0"},
        U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"}}
WEEK = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]   # seg … dom

async def modelo(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.semana", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(900)
        chk(await pg.evaluate("(S.rotina || []).length") == 0, "o modelo não é aplicado sozinho")
        opt = await pg.evaluate("[...document.querySelectorAll('#rt_mod option')].map(o => o.textContent)")
        chk("Semana de teste · semana, 6 blocos" in opt, f"o modelo aparece na lista, com o tamanho ({opt})")
        await pg.select_option("#rt_mod", "m_teste"); await pg.click("[data-act=rtmod]"); await pg.wait_for_timeout(500)
        bl = await pg.evaluate("S.rotina.map(b => [b.data, b.ini, b.fim, b.titulo, b.cor, b.tx]).sort()")
        chk(bl == [["2026-10-05", "00:00", "07:00", "Sonno", "#FFC7CE", "#9C0006"], ["2026-10-05", "07:00", "07:30", "Colazione", "#FFEDA3", "#9C6500"], ["2026-10-05", "09:00", "12:00", "Lavoro", "#BFBFBF", "#454545"],
                   ["2026-10-06", "07:00", "07:30", "Colazione", "#FFEDA3", "#9C6500"], ["2026-10-06", "20:00", "21:00", "Studio", "#FFFFFF", "#B49200"], ["2026-10-11", "10:00", "12:00", "Passeggiata", "#389BB2", "#FFFFFF"]],
            f"aplicado na semana: cada bloco no dia da semana certo, com fundo e letra da planilha ({len(bl)})")
        st = await pg.evaluate("""[...document.querySelectorAll('.rtb.cor')].map(e => [e.querySelector('b').textContent, getComputedStyle(e).backgroundColor, getComputedStyle(e).color])""")
        chk(len(st) == 6 and ["Lavoro", "rgb(191, 191, 191)", "rgb(69, 69, 69)"] in st and ["Passeggiata", "rgb(56, 155, 178)", "rgb(255, 255, 255)"] in st and ["Studio", "rgb(255, 255, 255)", "rgb(180, 146, 0)"] in st,
            f"na grade, o bloco é pintado como na planilha ({st[:3]})")
        await pg.evaluate("location.hash = 'rotina.mes'"); await pg.wait_for_timeout(300)
        mc = await pg.evaluate("[...document.querySelectorAll('.rtmc i')].filter(i => i.textContent.includes('Lavoro')).map(i => i.style.getPropertyValue('--c'))")
        chk(mc == ["#BFBFBF"], f"no mês, a marca usa a mesma cor ({mc})")
        # copiar a semana, duplicar e salvar como modelo mantêm a cor
        await pg.evaluate("location.hash = 'rotina.semana'"); await pg.wait_for_timeout(300)
        await pg.click("[data-act=rtcopyw]"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.rotina.filter(b => b.data === '2026-10-12' && b.titulo === 'Lavoro').map(b => b.cor + b.tx)") == ["#BFBFBF#454545"], "copiar para a próxima semana mantém a cor")
        bid = await pg.evaluate("S.rotina.find(b => b.data === '2026-10-06' && b.titulo === 'Studio').id")
        await pg.evaluate(f"rtCard('{bid}', '2026-10-06')"); await pg.click(f"[data-rtdup='{bid}|2026-10-06']"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.rotina.filter(b => b.titulo === 'Studio' && b.data === '2026-10-06').map(b => b.cor)") == ["#FFFFFF", "#FFFFFF"], "duplicar mantém a cor")
        await pg.click("[data-act=rtsavemod]"); await pg.wait_for_timeout(300)
        m2 = await pg.evaluate("S.rotinaModelos.at(-1).semana.find(x => x[3] === 'Passeggiata')")
        chk(m2 == [0, "10:00", "12:00", "Passeggiata", "Lazer", "#389BB2", "#FFFFFF"], f"salvar a semana como modelo leva a cor junto ({m2})")
        chk(await pg.evaluate("S.rotinaModelos[0].id") == "m_teste", "o modelo importado continua lá")
        # bloco sem cor própria segue com a cor da categoria
        await pg.evaluate("S.rotina.push({ id: 'semcor', data: '2026-10-07', ini: '10:00', fim: '11:00', titulo: 'Sem cor', cat: 'Estudo', rep: '', exc: [], st: {}, notas: '' }); VER++; render()"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("(() => { const e = document.querySelector('[data-rtb^=\"semcor|\"]'); return [e.classList.contains('cor'), e.style.getPropertyValue('--c')]; })()") == [False, "var(--a-apr)"], "bloco sem cor própria continua com a cor da categoria")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def anual(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(900)
        r = await pg.evaluate("""[['2024-10-12','2026-10-12','2023-10-12','2026-10-13'].map(d => evNoDia(S.eventos[0], d)), ['2025-02-28','2028-02-29','2028-02-28','2025-03-01'].map(d => evNoDia(S.eventos[2], d)), ['2026-10-13','2027-10-13'].map(d => evNoDia(S.eventos[3], d))]""")
        chk(r == [[True, True, False, False], [True, True, False, False], [True, False]], f"todo ano no mesmo dia, desde a data; 29/02 cai em 28/02 nos anos comuns; o comum segue só no dia ({r})")
        await pg.evaluate("rtGo('dia', '2026-10-12')"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("[...document.querySelectorAll('.rtad.anual')].map(e => e.textContent)")
        chk(t == ["Aniversário de Ana Teste"], f"na Rotina, o aniversário aparece no dia, em “dia todo” ({t})")
        await pg.evaluate("rtGo('dia', '2027-10-20')"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[...document.querySelectorAll('.rtad.anual')].map(e => e.textContent)") == ["Aniversário de Beto Teste"], "e no ano seguinte também")
        await pg.click(".rtad.anual"); await pg.wait_for_timeout(200)
        chk("repete todo ano" in await pg.evaluate("document.querySelector('#dlg').innerText") and "(todos os anos)" in await pg.evaluate("document.querySelector('#dlg').innerText"), "o cartão diz que repete todo ano")
        await pg.click("[data-rtiedit^='eventos|']"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("document.querySelector('#f_rep').value") == "anual", "o formulário mostra Repetir = anual")
        await pg.fill("#f_local", "Casa"); await pg.click("#fm button.primary"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("[S.eventos.find(e => e.id === 'e2').rep, S.eventos.find(e => e.id === 'e2').local]") == ["anual", "Casa"], "editar mantém a repetição")
        await pg.evaluate("location.hash = 'rotina.mes'; rtGo('mes', '2026-10-01')"); await pg.wait_for_timeout(300)
        mtxt = await pg.evaluate("document.querySelector('.rtmonth').innerText")
        chk("Aniversário de Ana Teste" in mtxt and "Aniversário de Beto Teste" in mtxt, "no mês aparecem os dois aniversários")
        await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(500)
        ag = await pg.evaluate("document.querySelector('#main').innerText")
        chk(ag.count("Aniversário de Ana Teste") == 1 and ag.count("Aniversário de Beto Teste") == 1, f"Visão geral: cada aniversário uma vez só (Ana vem da ficha; Beto, do compromisso anual) ({ag.count('Aniversário de Ana Teste')}, {ag.count('Aniversário de Beto Teste')})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("modelo com cores", modelo), ("compromisso anual", anual)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
