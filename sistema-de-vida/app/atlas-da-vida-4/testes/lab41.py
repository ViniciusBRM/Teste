"""Atlas 4 · Índice de Vida: navegar do passado ao presente. Dados de exemplo (fictícios).
Tocar num mês do gráfico leva a análise para aquele mês; o gráfico continua mostrando até o mês atual (dá para voltar tocando
nele), uma faixa “Voltar para <mês>” aparece nos relatórios e o “Hoje” do topo continua visível no celular. Confere também um mês
mais antigo que a janela, os outros gráficos clicáveis (Finanças, Relações, Crescimento) e os dias 1 a 7 (mês que acabou de fechar)."""
import asyncio
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

KEYS = "[...document.querySelectorAll('#main .vis[data-vid=\"ov-idx\"] [data-ref], #main [data-ref]')].map(e => e.dataset.ref)"
IDX = "[...document.querySelectorAll('#main [data-ref]')].map(e => e.dataset.ref)"
VISIVEL = """sel => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.right > innerWidth + .5 || r.left < -.5 || r.bottom > innerHeight || r.top < 0) return false;
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === e || e.contains(t)); }"""

async def main():
    global bad
    async with async_playwright() as p:
        for w in (1440, 390):
            b, pg, errs = await open_page(p, w=w, h=900, hash_="visao")
            try:
                await pg.wait_for_timeout(500)
                hoje = await pg.evaluate("mkey(TODAY)")
                k0 = await pg.evaluate(IDX)
                chk(k0 and k0[-1] == hoje and await pg.locator(".refbar").count() == 0, f"{w}px: no mês atual o gráfico termina em {hoje} e não há faixa ({k0[-3:]})")
                alvo = k0[-6]
                await pg.click(f"#main [data-ref='{alvo}']", force=True); await pg.wait_for_timeout(300)
                k1 = await pg.evaluate(IDX)
                bar = await pg.inner_text(".refbar") if await pg.locator(".refbar").count() else ""
                chk(await pg.evaluate("REF") == alvo and k1[-1] == hoje and alvo in k1, f"{w}px: tocar em {alvo} analisa {alvo} e o gráfico continua até {hoje} ({k1[0]}…{k1[-1]})")
                hi = await pg.evaluate("document.querySelector('#main .vis [data-ref]') && [...document.querySelectorAll('#main svg .hi, #main svg [class*=hi]')].length")
                chk("Analisando" in bar and "Voltar para" in bar, f"{w}px: faixa “Analisando … Voltar para …” ({bar[:90]!r})")
                await pg.locator(".vis[data-vid='ov-mat']").scroll_into_view_if_needed(); await pg.wait_for_timeout(150)
                chk(await pg.evaluate(VISIVEL, ".refbar [data-act=mnow]"), f"{w}px: rolando até os gráficos, “Voltar para …” continua na tela (faixa fixa no alto)")
                await pg.evaluate("window.scrollTo(0, 0); document.querySelector('#main').scrollTop = 0"); await pg.wait_for_timeout(100)
                chk(await pg.evaluate(VISIVEL, ".top .mnow"), f"{w}px: o “Hoje” do topo está visível e tocável")
                # volta pelo próprio gráfico (passado → presente)
                await pg.click(f"#main [data-ref='{hoje}']", force=True); await pg.wait_for_timeout(300)
                chk(await pg.evaluate("REF") == hoje and await pg.locator(".refbar").count() == 0 and await pg.locator(".top .mnow").count() == 0, f"{w}px: tocar no mês atual no gráfico volta ao presente e a faixa some")
                # pela faixa
                await pg.click(f"#main [data-ref='{k0[-3]}']", force=True); await pg.wait_for_timeout(250)
                await pg.locator(".refbar [data-act=mnow]").scroll_into_view_if_needed(); await pg.click(".refbar [data-act=mnow]"); await pg.wait_for_timeout(250)
                chk(await pg.evaluate("REF") == hoje, f"{w}px: “Voltar para …” na faixa volta ao mês atual")
                # pelo topo
                await pg.click(f"#main [data-ref='{k0[-2]}']", force=True); await pg.wait_for_timeout(250)
                await pg.click(".top .mnow"); await pg.wait_for_timeout(250)
                chk(await pg.evaluate("REF") == hoje, f"{w}px: “Hoje” do topo volta ao mês atual")
                if w == 1440:
                    # mês mais antigo que a janela: ele fica no começo e os seguintes à direita; dá para avançar tocando
                    for _ in range(20): await pg.click("[data-act=mprev]"); await pg.wait_for_timeout(40)
                    await pg.wait_for_timeout(250)
                    ref, k2 = await pg.evaluate("REF"), await pg.evaluate(IDX)
                    chk(k2[0] == ref and len(k2) == await pg.evaluate("PER") and k2[-1] < hoje, f"mês antigo ({ref}): janela começa nele e vai até {k2[-1]}")
                    await pg.click(f"#main [data-ref='{k2[-1]}']", force=True); await pg.wait_for_timeout(250)
                    k3 = await pg.evaluate(IDX)
                    chk(await pg.evaluate("REF") == k2[-1] and k3[-1] > k2[-1], f"tocando no último mês a janela anda para frente ({k3[0]}…{k3[-1]})")
                    await pg.click(".refbar [data-act=mnow]"); await pg.wait_for_timeout(250)
                    # outros gráficos clicáveis: a janela vai até o mês atual quando se analisa um mês passado
                    for h in ("fin.rel", "pessoas.rel", "cresc.rel"):
                        await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(400)
                        ks = await pg.evaluate(IDX)
                        if not ks: chk(False, f"{h}: gráfico clicável encontrado"); continue
                        await pg.click(f"#main [data-ref='{ks[-4]}']", force=True); await pg.wait_for_timeout(300)
                        ks2 = await pg.evaluate(IDX)
                        chk(await pg.evaluate("REF") == ks[-4] and ks2[-1] == hoje and await pg.locator(".refbar").count() == 1, f"{h}: analisa {ks[-4]} e o gráfico segue até {hoje}, com a faixa")
                        await pg.click(".refbar [data-act=mnow]"); await pg.wait_for_timeout(250)
                    # os cartões continuam medindo o mês analisado
                    await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(300)
                    await pg.click(f"#main [data-ref='{k0[-4]}']", force=True); await pg.wait_for_timeout(300)
                    r = await pg.evaluate("[calc().mk, calc().indice, calcAt(REF).indice]")
                    chk(r[0] == k0[-4] and r[1] == r[2], f"os números da página são do mês analisado ({r})")
                ov = await overflow(pg); chk(ov[0] <= ov[1], f"{w}px sem rolagem lateral {ov}")
            finally:
                for e in errs: print("  ", e)
                if errs: bad += 1
                await b.close()
        # dias 1 a 7: abre no mês que fechou, com a faixa explicando e o caminho para o mês atual
        b, pg, errs = await open_page(p, w=1440, hash_="visao", cfg={"now": "2026-10-03T09:00:00"})
        try:
            await pg.wait_for_timeout(500)
            bar = await pg.inner_text(".refbar") if await pg.locator(".refbar").count() else ""
            ks = await pg.evaluate(IDX)
            chk(await pg.evaluate("REF") == "2026-09" and "acabou de fechar" in bar and ks[-1] == "2026-10", f"dia 3: analisa setembro, explica e o gráfico já mostra outubro ({bar[:80]!r}, {ks[-1]})")
            await pg.click(".refbar [data-act=mnow]"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("REF") == "2026-10" and await pg.locator(".refbar").count() == 0, "dia 3: um toque leva a outubro")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
