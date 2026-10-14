"""Modo exemplo: liga dados fictícios em todas as abas sem tocar nos dados reais; nada é gravado; desligar devolve tudo, inclusive o desfazer."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
U = "data/users/u_test/"
SEED = {U + "s_cfg": {"at": 1, "v": {"nome": "Real"}}, U + "s_lanc": {"at": 1, "v": [{"id": "r1", "data": "2026-10-01", "tipo": "Despesa", "cat": "Mercado", "desc": "compra real", "valor": 10, "conta": "x"}]}}
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1280, cfg={"seedStore": json.dumps(SEED)}, hash_="fin.lanc")
        try:
            await pg.wait_for_timeout(400)
            chk(await pg.evaluate("[IS_EXAMPLE, S.lanc.length, S.cfg.nome]") == [False, 1, "Real"], "começa com os dados reais")
            await pg.evaluate("S.lanc.push({id:'r2', data:'2026-10-02', tipo:'Despesa', cat:'Mercado', desc:'outra real', valor:5, conta:'x'}); touch('lanc', {label:'real'})"); await pg.wait_for_timeout(1200)
            w0 = await pg.evaluate("window.__dbw"); und = await pg.evaluate("UNDO.length")
            await pg.click("[data-act=extog]"); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("[EX_MODE, S.lanc.length > 50, !!document.querySelector('.banner.exb'), document.querySelector('[data-act=extog]').getAttribute('aria-pressed')]") == [True, True, True, "true"], "ligado: dados fictícios, aviso no topo e o botão marcado")
            chk("Modo exemplo" in await pg.inner_text("#savest"), "o status diz que nada é salvo")
            chk(await pg.evaluate("MCP === null && !NOTION_OK"), "Notion desligado no exemplo")
            for h in ["hoje", "painel", "carreira.rede", "casa.compras", "fin.vida", "idiomas", "jornada.meditacao", "lazer.cafe"]:
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(900 if h == "hoje" else 200)
                em = await pg.evaluate("[...document.querySelectorAll('.page .empty, .page .emptyb')].length")
                chk(em == 0, f"{h} preenchida no exemplo")
            chk(await pg.evaluate("PD.text.startsWith('Dormi 7 e meia') && PD.gastos.length === 2"), "Painel do dia mostra um texto de exemplo já lido em campos")
            await pg.evaluate("location.hash='casa.compras'"); await pg.wait_for_timeout(200)
            await pg.fill("#cp_in", "item do exemplo"); await pg.click("[data-act=cpadd]"); await pg.wait_for_timeout(1500)
            chk(await pg.evaluate("window.__dbw") == w0, "editar no exemplo não grava nada no banco")
            await pg.click("[data-act=extog]"); await pg.wait_for_timeout(500)
            st = await pg.evaluate("[EX_MODE, S.lanc.length, S.cfg.nome, S.compras.length, UNDO.length, !!document.querySelector('.banner.exb')]")
            chk(st == [False, 2, "Real", 0, und, False], f"desligado: volta aos dados reais e ao histórico de desfazer {st}")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(1200)
            chk(await pg.evaluate("S.lanc.length") == 1 and await pg.evaluate("window.__dbw") > w0, "o desfazer real continua funcionando e grava")
            chk(len(await pg.evaluate(f"window.__store['{U}s_lanc'].v")) == 1 and not await pg.evaluate(f"'{U}s_compras' in window.__store"), "o banco nunca recebeu dados do exemplo")
            await pg.evaluate("openPalette()"); await pg.fill("#palq", "exemplo"); await pg.wait_for_timeout(200)
            chk("Ligar o modo exemplo" in await pg.inner_text("#pal"), "a busca (Ctrl K) liga o exemplo")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
