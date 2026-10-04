import asyncio, json, pathlib, traceback
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
DOCS = pathlib.Path(__file__).parent.parent / "ft" / "docs"
seed = {f"data/users/u_test/{f.stem}": json.loads(f.read_text()) for f in DOCS.glob("*.json")} if DOCS.exists() else {}
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed)}, hash_="fin.rel")
        try:
            await pg.wait_for_timeout(600)
            if seed:
                chk(not await pg.evaluate("IS_EXAMPLE") and await pg.evaluate("S.lanc.length") == 782, "Atlas abre com os 782 lançamentos importados, fora do modo exemplo")
                chk(await pg.locator("[data-vid='fin-saldo']").count() == 1 and await pg.locator("[data-vid='fin-semana']").count() == 1, "relatório ganhou saldo dia a dia e ritmo da semana")
                await pg.evaluate("location.hash='fin.orc'"); await pg.wait_for_timeout(300)
                t = await pg.locator("#main").inner_text()
                chk("Origem dos dados" in t and "4.033,83" in t, "Orçamento & patrimônio mostra a origem dos dados e o que ficou de fora")
                chk(await pg.evaluate("mstate('fin').mem.length") == 6, "memória do Mentor do Dinheiro com o diagnóstico do Quadro")
            await pg.evaluate("location.hash='fin.projetos'"); await pg.wait_for_timeout(300)
            cap = await pg.evaluate("pjCap()")
            chk(cap["meses"] >= 1 and abs(cap["sobra"] - (cap["rec"] - cap["desp"])) < 1e-9, f"capacidade: sobra média = receitas − despesas ({cap['sobra']:.2f} em {cap['meses']} meses)")
            await pg.click("[data-act=pjnew]"); await pg.wait_for_timeout(250)
            await pg.fill("#pj_nome", "Carro usado"); await pg.fill("#pj_valor", "9000"); await pg.select_option("#pj_prio", "desejo")
            await pg.fill("#pj_prazo", await pg.evaluate("addDays(TODAY, 365)")); await pg.select_option("#pj_forma", "misto")
            await pg.fill("#pj_entrada", "3000"); await pg.fill("#pj_taxa", "7.9"); await pg.fill("#pj_parcelas", "48")
            await pg.fill("#pj_etapas", "Juntar a entrada; 3000; 2027-06-01\nEscolher o carro; ; 2027-08-01")
            await pg.click("[data-act=pjsave]"); await pg.wait_for_timeout(300)
            pr = await pg.evaluate("S.projetos.at(-1)")
            chk(pr["nome"] == "Carro usado" and len(pr["etapas"]) == 2 and pr["etapas"][0]["valor"] == 3000, "projeto salvo com etapas")
            x = await pg.evaluate(f"pjPlan().por['{pr['id']}']")
            i = 0.079 / 12; pmt = 6000 * i / (1 - (1 + i) ** -48)
            chk(abs(x["parcela"] - pmt) < 1e-6 and abs(x["juros"] - (pmt * 48 - 6000)) < 1e-6, f"parcela pela fórmula Price: {pmt:.2f} €, juros {pmt * 48 - 6000:.2f} €")
            chk(any("Financiar um desejo" in a for a in x["alertas"]), "alerta: desejo financiado")
            await pg.fill(f"#pjap_{pr['id']}", "250"); await pg.click(f"[data-act=pjaporte][data-id='{pr['id']}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate(f"pjPlan().por['{pr['id']}'].guardado") == 250, "aporte entra no juntado")
            n0 = await pg.evaluate("window.__calls.length")
            await pg.click(f"[data-act=pjai][data-id='{pr['id']}']"); await pg.wait_for_timeout(2500)
            prm = await pg.evaluate("(n0) => { const c = window.__calls.slice(n0).find(c => c.kind === 'sample'); return c ? String(c.input) : ''; }", n0)
            chk("TAREFA: MENTOR PROJETO" in prm and "Carro usado" in prm and "Parcelas atuais" in prm, "mentor recebe o projeto e os números do plano")
            chk(len(await pg.evaluate(f"S.projetos.find(z => z.id === '{pr['id']}').mentor")) == 1, "orientação do mentor fica guardada no projeto")
            facts = await pg.evaluate("mentorFacts ? '' : ''") if False else await pg.evaluate("pjFacts().join('\\n')")
            chk("Carro usado" in facts and "Plano sustentável" in facts, "Mentor do Dinheiro vê os projetos nas conversas")
            chk(await pg.locator(".pjc").count() >= 1 and await pg.locator("[data-vid='pjtl'] svg.chart").count() == 1, "cartão do projeto e linha do tempo aparecem")
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        for w in (1024, 390):
            b, pg, errs = await open_page(p, w=w, cfg={"seedStore": json.dumps(seed)})
            for h in ("fin.rel", "fin.orc", "fin.projetos", "fin.lanc", "visao", "hoje"):
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(350)
                ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
                if ov[0] > ov[1] or errs: chk(False, f"{w} {h} overflow {ov} {errs[:1]}"); break
            else: chk(True, f"{w}px: finanças, visão e hoje sem rolagem lateral nem erro com os dados reais")
            await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
