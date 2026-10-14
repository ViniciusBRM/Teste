import asyncio
from harness import *
ok=0; bad=0
def chk(c, msg):
    global ok, bad
    if c: ok+=1
    else: bad+=1; print("FAIL", msg)
OVL = r"""() => { const out=[]; for (const g of document.querySelectorAll('#main .packed')) { const ks=[...g.children].filter(k=>k.offsetParent); const rs=ks.map(k=>k.getBoundingClientRect());
  for (let i=0;i<rs.length;i++) for (let j=i+1;j<rs.length;j++){ const a=rs[i], b=rs[j]; if (a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1) out.push([ks[i].className, ks[j].className]); } } return out; }"""
async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440)
        for w in (1440, 1000, 390):
            await pg.set_viewport_size({"width": w, "height": 900}); await pg.wait_for_timeout(300)
            for h in PAGES:
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(200)
                o = await pg.evaluate(OVL); chk(not o, f"overlap {w} {h} {o[:2]}")
        await pg.set_viewport_size({"width": 1440, "height": 900})
        # setor: elemento, filtro e escrita
        await pg.evaluate("location.hash='pessoas.diario'"); await pg.wait_for_timeout(300)
        n_all = await pg.locator(".sjmain .ent").count(); chk(n_all > 0, "pessoas feed tem entradas")
        await pg.locator(".sjel", has_text="Marco").first.click(); await pg.wait_for_timeout(200)
        txts = await pg.locator(".sjmain .ent .ent-body").all_inner_texts()
        chk(txts and all("Marco" in t for t in txts), f"filtro do elemento Marco {len(txts)}")
        chk("Marco" in await pg.locator(".sjh-t h2").inner_text(), "hero mostra o elemento")
        await pg.click("[data-sjnew]"); await pg.wait_for_timeout(200)
        v = await pg.input_value("#dz_texto"); chk(v.startswith("@Marco"), f"composer marcado: {v!r}")
        await pg.fill("#dz_texto", v + "Café rápido antes do trabalho, falamos da mudança dele. #cafe")
        await pg.click("[data-act=dzsave]"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.diario.some(e=>e.texto.includes('Café rápido antes'))"), "entrada salva")
        chk("Café rápido" in await pg.locator(".sjmain").inner_text(), "entrada aparece no diário do elemento")
        chk(await pg.evaluate("location.hash") == "#pessoas.diario", "continua no setor")
        # pergunta
        await pg.locator("[data-sjp]").nth(1).click(); await pg.wait_for_timeout(200)
        chk(await pg.input_value("#dz_titulo") != "", "pergunta vira título")
        await pg.click("[data-act=dzcancel]"); await pg.wait_for_timeout(150)
        # busca
        await pg.fill("#sj_q", "mudança dele"); await pg.wait_for_timeout(500)
        chk(await pg.locator(".sjmain .ent").count() == 1, "busca no setor")
        await pg.fill("#sj_q", ""); await pg.wait_for_timeout(400)
        # perguntar ao mentor
        await pg.click("[data-sjask]"); await pg.wait_for_timeout(300)
        h = await pg.evaluate("location.hash"); chk(h.startswith("#mentor."), f"mentor {h}")
        chk("Marco" in (await pg.input_value("#m_in")), "pergunta chega ao mentor")
        # ficha de pessoa -> escrever sobre
        await pg.evaluate("location.hash='visao'"); await pg.wait_for_timeout(200)
        await pg.evaluate("openEnt('p','Francesca')"); await pg.wait_for_timeout(200)
        await pg.click("#drawer [data-jw]"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("location.hash") == "#pessoas.diario", "ficha leva ao diário do setor")
        chk((await pg.input_value("#dz_texto")).startswith("@Francesca"), "ficha preenche o editor")
        await pg.click("[data-act=dzcancel]")
        # hábito
        await pg.evaluate("location.hash='hab.diario'"); await pg.wait_for_timeout(300)
        chk(await pg.locator(".sjmain .ent").count() >= 3, "diário de hábitos tem entradas de exemplo")
        await pg.evaluate("openEnt('hab','h2')"); await pg.wait_for_timeout(200)
        chk("Meditar" in await pg.locator("#drawer").inner_text(), "ficha do hábito")
        await pg.click("#drawer [data-mark]"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("!!S.marks['h2|'+TODAY]") != None, "marcar pela ficha")
        # todos os setores renderizam sem problema, com elementos e pergunta do dia
        for s in ["fin","saude","hab","metas","pessoas","cresc","casa","roda"]:
            await pg.evaluate(f"location.hash='{s}.diario'"); await pg.wait_for_timeout(200)
            chk(await pg.locator(".sjel").count() > 1, f"{s} elementos")
            chk(await pg.locator(".emptyb b", has_text="problema").count() == 0, f"{s} sem erro")
        # ligação [[Hábito:]] no autocompletar
        await pg.evaluate("location.hash='diario'"); await pg.wait_for_timeout(200)
        await pg.evaluate("openComposer()"); await pg.wait_for_timeout(150)
        await pg.focus("#dz_texto"); await pg.keyboard.type("[[Hábito: Med"); await pg.wait_for_timeout(200)
        chk("Meditar" in await pg.locator("#ac").inner_text(), "autocompletar hábito")
        chk(not errs, f"errs {errs}")
        await b.close()
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
