"""Atlas 4 · aba Inspiração. Dados de exemplo (fictícios).
No menu logo depois da Rotina. Atividades da base (gostos do Lazer e atividades da rotina) e sugeridas, com grupos e busca; o topo liga
o próximo bloco da rotina à atividade dele. Cada atividade: texto, aquecimento de 5 minutos com relógio, primeiro passo (com “outro
desafio” e “Comecei”, que se desfaz), frases com fonte, vídeos e músicas por busca (abrem em aba nova), recursos e atalho no Atlas.
Minhas atividades: criar, montar a inspiração com a IA e apagar. Conferências do catálogo: toda frase tem fonte, todo link é http(s)."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=950, hash_="inspira")
        try:
            await pg.wait_for_timeout(700)
            nav = await pg.evaluate("NAV[0][1].map(x => x[0])")
            chk(nav.index("inspira") == nav.index("rotina") + 1 and "inspira" in await pg.evaluate("MENU_PAD"), f"Inspiração no menu, logo depois da Rotina ({nav[:6]})")
            n = await pg.locator(".inscard").count(); base = await pg.evaluate("INSP.filter(a => a.g !== 'sugeridas').length"); sug = await pg.evaluate("INSP.filter(a => a.g === 'sugeridas').length")
            chk(n == base + sug and base >= 14 and sug >= 8, f"{n} atividades: {base} da base e {sug} sugeridas")
            # catálogo: toda frase com fonte, links http(s), aquecimento de 3 passos e ao menos 2 desafios
            r = await pg.evaluate("""INSP.map(a => [a.id, a.frases.every(f => f[0] && f[1] && f[1].length > 8), a.recursos.every(r => /^https?:\\/\\//.test(r[1])), a.aquec.length === 3, a.desafios.length >= 2, !!a.texto])
              .filter(x => !x.slice(1).every(Boolean))""")
            chk(r == [], f"catálogo completo: frases com fonte, links válidos, 3 passos de aquecimento, 2+ desafios, texto ({r})")
            # base: os gostos do Lazer e a rotina
            ids = await pg.evaluate("INSP.map(a => a.id)")
            chk(all(i in ids for i in ["leitura", "cinema", "jogos", "viagens", "cafe", "aviacao", "ciencia", "engenharia", "filosofia", "meditacao", "espiritismo", "tao", "ingles", "italiano", "treino"]), "a base cobre os temas do Lazer e as atividades da rotina")
            # grupos e busca
            await pg.click("[data-insg='sugeridas']"); await pg.wait_for_timeout(200)
            chk(await pg.locator(".inscard").count() == sug, "grupo Sugeridas")
            await pg.click("[data-insg='']"); await pg.fill("#ins_q", "cafe"); await pg.wait_for_timeout(200)
            nm = await pg.evaluate("[...document.querySelectorAll('.inscard b')].map(b => b.textContent)")
            chk(nm and nm[0] == "Café de especialidade" and len(nm) <= 3 and await pg.evaluate("document.activeElement?.id") == "ins_q", f"busca sem acento acha “Café” (nome e motivo) e mantém o foco ({nm})")
            await pg.fill("#ins_q", ""); await pg.wait_for_timeout(150)
            # o topo liga o próximo bloco da rotina a uma atividade
            await pg.evaluate("""(() => { const ini = Math.min(1380, Math.ceil(nowMin() / 30) * 30 + 60), h = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
              S.rotina.push({ id: 'rx1', data: TODAY, ini: h(ini), fim: h(ini + 60), titulo: 'English Study', cat: 'Estudo', rep: '', exc: [], st: {}, notas: '' }); INS.sel = ''; touch('rotina', { noUndo: true }); })()""")
            await pg.wait_for_timeout(200)
            t = await pg.inner_text(".insnow") if await pg.locator(".insnow").count() else ""
            chk("English Study" in t and "Inglês" in t, f"o topo liga o próximo bloco da rotina à atividade ({t.strip()[:80]!r})")
            # detalhe
            await pg.click("[data-insa='aviacao']"); await pg.wait_for_timeout(250)
            d = await pg.inner_text(".insdet")
            chk("Aviação e simulação de voo" in d and "Aquecimento de 5 minutos" in d.title() or "AQUECIMENTO DE 5 MINUTOS" in d, "detalhe com o aquecimento")
            chk("Saint-Exupéry, Terra dos Homens (1939)" in d and "Primeiro passo de hoje".upper() in d.upper(), "frase com autor e obra, e o primeiro passo")
            links = await pg.evaluate("[...document.querySelectorAll('.insdet .insmid a')].map(a => [a.href, a.target, a.rel])")
            chk(links and all(h.startswith("https://") and tg == "_blank" and "noopener" in rl for h, tg, rl in links) and any("youtube.com/results" in h for h, _, _ in links), f"vídeos, músicas e recursos abrem em aba nova; vídeos e músicas por busca ({len(links)} links)")
            chk(await pg.evaluate("document.querySelector('.insdet a[href=\"#lazer.aviacao\"]') !== null"), "atalho para a aba da atividade no Atlas")
            # aquecimento com relógio
            await pg.click("[data-act=insgo]"); await pg.wait_for_timeout(200)
            s0 = await pg.evaluate("[document.querySelector('#insclk')?.textContent, document.querySelectorAll('.insaq li.on').length]")
            await pg.evaluate("__clock.shift(110e3); insTick()"); await pg.wait_for_timeout(100)
            s1 = await pg.evaluate("[...document.querySelectorAll('.insaq li')].map(li => li.className)")
            await pg.evaluate("__clock.shift(200e3); insTick()"); await pg.wait_for_timeout(100)
            s2 = await pg.evaluate("[document.querySelector('#insclk')?.textContent, [...document.querySelectorAll('.insaq li')].map(li => li.className)]")
            chk(s0[0] and "restantes" in s0[0] and s1 == ["ok", "on", ""] and s2[0] == "pronto: hora de começar" and s2[1] == ["ok", "ok", "ok"], f"aquecimento: 5 min, um passo a cada 100 s ({s0}, {s1}, {s2})")
            # desafio: outro e comecei
            d0 = await pg.inner_text(".insdes"); await pg.click("[data-act=insoutro]"); await pg.wait_for_timeout(150); d1 = await pg.inner_text(".insdes")
            chk(d0 != d1, "“outro desafio” troca o primeiro passo")
            await pg.click("[data-act=insfeito]"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("(s => [s.n, s.ultima === TODAY, s.desafios.at(-1).txt])(S.inspira.ativs.aviacao)")
            chk(r[0] == 1 and r[1] and r[2] == d1, f"“Comecei” conta o começo e guarda o desafio ({r})")
            chk("1 começo" in await pg.inner_text("[data-insa='aviacao']"), "o cartão mostra os começos")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(200)
            chk(not (await pg.evaluate("S.inspira.ativs.aviacao?.n")), "e se desfaz")
            # minhas atividades
            await pg.fill("#ins_nn", "Violão TESTE"); await pg.fill("#ins_np", "tocar no domingo"); await pg.click("[data-act=insadd]"); await pg.wait_for_timeout(250)
            mid = await pg.evaluate("S.inspira.minhas[0]?.id")
            chk(mid and await pg.evaluate("INS.sel") == mid and "Violão TESTE" in await pg.inner_text(".insdet"), "atividade própria criada e aberta")
            await pg.click("[data-act=insgera]"); await pg.wait_for_timeout(600)
            r = await pg.evaluate("(m => [m.texto, m.aquec.length, m.desafios.length])(S.inspira.minhas[0])")
            chk(r == ["Texto de inspiração gerado no teste.", 3, 2] and "desafio A teste" in await pg.inner_text(".insdet"), f"“Montar a inspiração com a IA” preenche texto, aquecimento e desafios ({r})")
            await pg.click(f"[data-insdel='{mid}']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.inspira.minhas.length") == 0, "apagar a atividade própria")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=390, h=844, hash_="inspira")
        try:
            await pg.wait_for_timeout(600)
            await pg.click("[data-insa='cafe']"); await pg.wait_for_timeout(300)
            r = await pg.evaluate("(() => { const d = document.querySelector('.insdet').getBoundingClientRect(); return [Math.round(d.left), Math.round(d.right), innerWidth]; })()")
            chk(r[0] >= 0 and r[1] <= r[2], f"celular: o detalhe cabe na tela ({r})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
