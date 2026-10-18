"""Atlas 4 · sem buracos entre as caixas. Dados de exemplo (fictícios).
Confere: Rotina na Semana com um cabeçalho de datas só (dia, horas planejadas e cumprido) e a faixa de dias só na vista Dia; nas
telas de duas colunas a mais curta cresce até a altura útil da janela e acompanha a rolagem; grades de cartões escolhem coluna ou
largura toda; relatórios alargam o cartão vizinho e redesenham o gráfico na largura nova (sem esticar); nenhum buraco >= 120x180 px
visível em nenhuma posição de rolagem nas telas que tinham; celular sem mudança e sem rolagem lateral."""
import asyncio, json
from harness import *
from furos import FUROS
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

async def buracos(pg, v, H):
    await pg.evaluate(f"location.hash = {json.dumps(v)}"); await pg.wait_for_timeout(500)
    await pg.evaluate("window.__vtop = 0")
    full = await pg.evaluate("document.documentElement.scrollHeight"); y = 0; out = []
    while True:
        await pg.evaluate(f"scrollTo(0, {y})"); await pg.wait_for_timeout(60)
        r = await pg.evaluate(FUROS + "(8, 120, 180)")
        out += [(y, h["w"], h["h"]) for h in r.get("holes", [])]
        if y + H >= full: break
        y = min(full - H, y + H // 2)
    await pg.evaluate("scrollTo(0, 0)")
    return out

VISTAS = ["rotina.dia", "rotina.semana", "rotina.mes", "trabalho.mes", "trabalho.bim", "trabalho.relatorios", "lazer.existencial", "metas.diario",
          "casa.compras", "casa.docs", "integ", "ajustes", "fin.projetos", "saude.rel", "hab.rel", "pessoas.rel", "jornada.filosofia",
          "carreira.biblioteca", "jornada.jardim", "jornada.bussola", "capitulos.livro"]

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=900, hash_="rotina.semana")
        try:
            await pg.evaluate("exOn()"); await pg.wait_for_timeout(600)
            await pg.evaluate("location.hash = 'rotina.semana'"); await pg.wait_for_timeout(500)
            r = await pg.evaluate("[document.querySelectorAll('.rtstrip').length, document.querySelectorAll('.rthead .rtdh').length, document.querySelectorAll('.rthead .rtdh em').length, document.querySelectorAll('.rthead .rtdh .rtsb').length]")
            chk(r[0] == 0 and r[1] == 7 and r[2] == 7 and r[3] >= 5, f"Semana: um cabeçalho só, com dia, horas planejadas e barra de cumprido ({r})")
            await pg.evaluate("location.hash = 'rotina.dia'"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("document.querySelectorAll('.rtstrip .rtsd').length") == 7, "Dia: a faixa com os 7 dias continua (navegação entre os dias)")
            await pg.evaluate("location.hash = 'rotina.semana'"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("(() => { const c = document.querySelector('.rtcal'), a = document.querySelector('.rtins'); return [c.classList.contains('cfstick'), Math.round(c.getBoundingClientRect().height), innerHeight - 28, Math.round(a.getBoundingClientRect().height)]; })()")
            chk(r[0] and abs(r[1] - r[2]) <= 2 and r[3] > r[1], f"Rotina: a grade ocupa a altura útil da janela e acompanha a rolagem ao lado dos painéis ({r})")
            await pg.evaluate("scrollTo(0, 900)"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("Math.round(document.querySelector('.rtcal').getBoundingClientRect().top)")
            chk(r == 12, f"no meio da rolagem, a grade fica presa no alto da janela ({r})")
            await pg.evaluate("scrollTo(0, document.documentElement.scrollHeight)"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("(() => { const c = document.querySelector('.rtcal').getBoundingClientRect(), a = document.querySelector('.rtins').getBoundingClientRect(); return [Math.round(c.bottom), Math.round(a.bottom)]; })()")
            chk(abs(r[0] - r[1]) <= 2, f"no fim da página, a grade termina junto com os painéis ({r})")
            await pg.evaluate("scrollTo(0, 0)")
            # a janela muda de altura: a grade acompanha
            await pg.set_viewport_size({"width": 1440, "height": 1000}); await pg.wait_for_timeout(600)
            h2 = await pg.evaluate("Math.round(document.querySelector('.rtcal').getBoundingClientRect().height)")
            chk(abs(h2 - 972) <= 2, f"janela mais alta: a grade cresce junto ({h2})")
            await pg.set_viewport_size({"width": 1440, "height": 900}); await pg.wait_for_timeout(600)
            # coluna principal mais curta que a lateral: cresce até a lateral (Cockpit · Mês)
            await pg.evaluate("location.hash = 'trabalho.mes'"); await pg.wait_for_timeout(500)
            r = await pg.evaluate("(() => { const a = document.querySelector('.ckmain').getBoundingClientRect(), b = document.querySelector('.ckside').getBoundingClientRect(); return [Math.round(a.height), Math.round(b.height)]; })()")
            chk(abs(r[0] - r[1]) <= 2, f"Cockpit Mês: o calendário cresce até a altura do painel do PMO ({r})")
            # relatório: o cartão alargado tem o gráfico redesenhado na largura nova
            await pg.evaluate("location.hash = 'saude.rel'"); await pg.wait_for_timeout(800)
            r = await pg.evaluate("""(() => { const k = document.querySelector('[data-vid="sa-steps"]'), s = k.querySelector('svg.chart'), vb = +s.getAttribute('viewBox').split(' ')[2]; return [k.dataset.vgfix || '', Math.round(s.getBoundingClientRect().width), vb]; })()""")
            chk(r[0] == "12" and abs(r[1] - r[2]) / r[2] < 0.04, f"Saúde: “Passos por semana” fica com 12 colunas e o gráfico é redesenhado nessa largura, sem esticar ({r})")
            # nenhum buraco nas telas que tinham
            for v in VISTAS:
                h = await buracos(pg, v, 900)
                chk(not h, f"{v}: nenhum vazio >= 120x180 px entre caixas em nenhuma rolagem {h[:2]}")
            # cartão sozinho numa grade de duas colunas ocupa a largura toda
            await pg.evaluate("location.hash = 'casa.docs'"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("(() => { const g = document.querySelector('.p-casa .g2c'), k = g.firstElementChild; return [g.children.length, Math.round(k.getBoundingClientRect().width), Math.round(g.getBoundingClientRect().width)]; })()")
            chk(r[0] == 1 and r[1] == r[2], f"Documentos: o único cartão ocupa a largura toda ({r})")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # celular: nada fica preso nem aumenta, e não há rolagem lateral
        b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.semana")
        try:
            await pg.evaluate("exOn()"); await pg.wait_for_timeout(600)
            for v in ("rotina.semana", "trabalho.mes", "lazer.existencial", "saude.rel", "metas.diario"):
                await pg.evaluate(f"location.hash = {json.dumps(v)}"); await pg.wait_for_timeout(450)
                r = await pg.evaluate("[document.querySelectorAll('.cfstick,[data-cfp]').length, document.documentElement.scrollWidth, innerWidth]")
                chk(r[0] == 0 and r[1] <= r[2], f"390 px, {v}: colunas empilhadas sem ajuste e sem rolagem lateral ({r})")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
