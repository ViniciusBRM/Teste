"""Atlas 4 · Jardim interior fluido. Dados de exemplo (fictícios).
Os filtros de tinta (turbulência, deslocamento, desfoque) viram imagens prontas depois de desenhar, no mesmo lugar e na mesma
ordem; a sombra do leque deixa de ser um filtro CSS no SVG inteiro. Confere: quadros por segundo com tudo animado (dia e noite
com névoa), o desenho igual ao de antes (comparação de pixels com as animações paradas, no desktop e no celular), as mesmas
animações rodando (rio, névoa, pétalas, qi), toque, teclado e realce, redesenho rápido, troca de tamanho e o caminho de reserva
quando o navegador não consegue gerar as imagens."""
import asyncio, base64
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

FPS = """ms => new Promise(ok => { const t = []; const t0 = performance.now(); const f = n => { t.push(n); if (n - t0 < ms) requestAnimationFrame(f); else { const d = t.slice(1).map((x, i) => x - t[i]).sort((a, b) => a - b);
  ok({ fps: Math.round((t.length - 1) / ((t.at(-1) - t[0]) / 1000) * 10) / 10, p95: Math.round(d[Math.floor(d.length * .95)]) }); } }; requestAnimationFrame(f); })"""
ASSADO = "document.querySelector('svg.jdsvg.jd-assado')"
VIVOS = """(() => { const svg = document.querySelector('svg.jdsvg'); return [...svg.querySelectorAll('[filter]')].filter(e => !e.closest('defs, clipPath, filter')).filter(e => { let x = e; while (x && x !== svg) { if (x.style?.opacity === '0') return false; x = x.parentElement; } return true; }).length; })()"""
ANIMS = """(() => { const svg = document.querySelector('svg.jdsvg'), c = {}; for (const e of svg.querySelectorAll('*')) { let x = e, oculto = false; while (x && x !== svg) { if (x.style?.opacity === '0') { oculto = true; break; } x = x.parentElement; } if (oculto) continue;
  const a = getComputedStyle(e).animationName; if (a && a !== 'none') c[a] = (c[a] || 0) + 1; } c.smil = svg.querySelectorAll('animate, animateMotion, animateTransform').length; return c; })()"""
PARA = "(() => { const st = document.createElement('style'); st.id = 'xxs'; st.textContent = '.jdsvg *{animation:none!important}'; document.head.append(st); })()"
DIFF = """async ([a, b]) => { const ld = s => new Promise(ok => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; }); const [A, B] = await Promise.all([ld(a), ld(b)]);
  const px = I => { const c = document.createElement('canvas'); c.width = I.width; c.height = I.height; const x = c.getContext('2d'); x.drawImage(I, 0, 0); return x.getImageData(0, 0, I.width, I.height).data; };
  const p = px(A), q = px(B); let s = 0, n24 = 0, n = 0; for (let i = 0; i < p.length; i += 4) { const d = (Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2])) / 3; s += d; if (d > 24) n24++; n++; }
  return { media: Math.round(s / n * 100) / 100, acima24: Math.round(n24 / n * 10000) / 100 }; }"""

async def foto(pg):
    el = await pg.query_selector("svg.jdsvg"); return base64.b64encode(await el.screenshot()).decode()

async def compara(pg):
    """o mesmo desenho sem assar e assado, com as animações paradas"""
    await pg.evaluate(PARA)
    await pg.evaluate("window.__bk = jdBakeSoon; jdBakeSoon = () => {}; render()"); await pg.wait_for_timeout(500)
    await pg.evaluate("(() => { const s = document.querySelector('svg.jdsvg'); s.pauseAnimations(); s.setCurrentTime(0); })()"); await pg.wait_for_timeout(150)
    a = await foto(pg)
    await pg.evaluate("(async () => { const s = document.querySelector('svg.jdsvg'); s.dataset.bk = 1; await jdBake(s); s.pauseAnimations(); s.setCurrentTime(0); })()"); await pg.wait_for_timeout(1200)
    b = await foto(pg)
    await pg.evaluate("jdBakeSoon = window.__bk; document.querySelector('#xxs')?.remove()")
    return await pg.evaluate(DIFF, [a, b])

async def dia(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.jardim")
    try:
        await pg.wait_for_function(ASSADO, timeout=15000)
        r = await pg.evaluate("({ n: document.querySelectorAll('svg.jdsvg image.jd-bk').length, sombra: getComputedStyle(document.querySelector('svg.jdsvg')).filter, esc: JDB.esc })")
        vivos = await pg.evaluate(VIVOS)
        chk(r["n"] >= 20 and vivos <= 2, f"depois de desenhar, os filtros viram imagens ({r['n']}); só {vivos} filtro pequeno fica vivo (a chama do incenso)")
        chk(r["sombra"] == "none", f"a sombra do leque não é mais um filtro CSS no SVG inteiro ({r['sombra']})")
        await pg.wait_for_timeout(500)
        f = await pg.evaluate(FPS, 4000)
        chk(f["fps"] >= 50 and f["p95"] <= 34, f"com tudo animado, {f['fps']} quadros por segundo (p95 {f['p95']} ms; antes ~35)")
        an = await pg.evaluate(ANIMS)
        await pg.evaluate("jdBakeSoon = () => {}; render()"); await pg.wait_for_timeout(500)
        an0 = await pg.evaluate(ANIMS)
        await pg.evaluate("(() => { const s = document.querySelector('svg.jdsvg'); s.dataset.bk = 1; return jdBake(s); })()"); await pg.wait_for_timeout(800)
        an1 = await pg.evaluate(ANIMS)
        chk(an0 == an1 and an0.get("jdflow", 0) >= 1 and an0.get("smil", 0) >= 1, f"as mesmas animações rodam antes e depois de assar ({an1})")
        await pg.evaluate("location.hash = 'jornada.inicio'"); await pg.wait_for_timeout(200); await pg.evaluate("jdBakeSoon = window.jdBakeSoon || jdBakeSoon; location.hash = 'jornada.jardim'")
        d = await compara(pg)
        chk(d["media"] < 3 and d["acima24"] < 1, f"o desenho fica igual: diferença média {d['media']}/255, {d['acima24']}% dos pixels acima de 24 (só a suavização das bordas)")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def noite(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.jardim")
    try:
        await pg.wait_for_timeout(800)
        await pg.evaluate("jdData().cam = {}; jdSky = () => 'noite'; render()")
        await pg.wait_for_function(ASSADO, timeout=15000); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("({ fog: document.querySelectorAll('svg.jdsvg image.jd-fog').length, fly: document.querySelectorAll('svg.jdsvg .jd-fly').length, qi: [...document.querySelectorAll('svg.jdsvg image.jd-bk')].filter(i => i.querySelector('animateMotion')).length })")
        chk(r["fog"] >= 4 and r["fly"] >= 1 and r["qi"] >= 1, f"à noite, com os caminhos fechados: névoa, vagalumes e a pérola do qi continuam ({r})")
        t1 = await pg.evaluate("getComputedStyle(document.querySelector('svg.jdsvg image.jd-fog')).transform"); await pg.wait_for_timeout(1200)
        t2 = await pg.evaluate("getComputedStyle(document.querySelector('svg.jdsvg image.jd-fog')).transform")
        chk(t1 != t2, "a névoa continua se movendo")
        f = await pg.evaluate(FPS, 4000)
        chk(f["fps"] >= 50, f"à noite, com névoa nos 4 caminhos: {f['fps']} quadros por segundo")
        d = await compara(pg)
        chk(d["media"] < 3 and d["acima24"] < 1, f"o desenho noturno fica igual ({d})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def toque(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.jardim")
    try:
        await pg.wait_for_function(ASSADO, timeout=15000)
        el = await pg.query_selector("svg.jdsvg [data-k='templo']")
        await el.hover(); await pg.wait_for_timeout(200)
        chk("drop-shadow" in await pg.evaluate("getComputedStyle(document.querySelector('svg.jdsvg [data-k=templo]')).filter"), "passar o mouse ainda realça o lugar")
        t0 = await pg.evaluate("performance.now()")
        await el.click(); await pg.wait_for_function(ASSADO, timeout=15000)
        dt = await pg.evaluate(f"performance.now() - {t0}")
        chk(await pg.evaluate("JD.sel") == "templo" and await pg.evaluate("document.querySelector('svg.jdsvg [data-k=templo]').classList.contains('on')"), "tocar no templo seleciona o lugar")
        chk(dt < 2500, f"o jardim redesenhado volta assado logo (imagens guardadas): {round(dt)} ms")
        await pg.focus("svg.jdsvg [data-k='rio']"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300); await pg.wait_for_function(ASSADO, timeout=15000)
        chk(await pg.evaluate("JD.sel") == "rio", "pelo teclado também (foco e Enter)")
        # a resolução das imagens ficou longe da tela (ex.: girar o celular, outro monitor): o jardim é refeito
        e0 = await pg.evaluate("JDB.esc")
        await pg.evaluate("JDB.esc = JDB.esc / 2; window.__svg0 = document.querySelector('svg.jdsvg'); dispatchEvent(new Event('resize'))"); await pg.wait_for_timeout(900)
        await pg.wait_for_function(ASSADO, timeout=15000)
        r = await pg.evaluate("({ esc: JDB.esc, novo: document.querySelector('svg.jdsvg') !== window.__svg0 })")
        chk(r["novo"] and r["esc"] == e0, f"a tela mudou muito de tamanho: o jardim é refeito na resolução certa ({e0 / 2} → {r['esc']})")
        await pg.evaluate("window.__svg1 = document.querySelector('svg.jdsvg'); dispatchEvent(new Event('resize'))"); await pg.wait_for_timeout(900)
        chk(await pg.evaluate("document.querySelector('svg.jdsvg') === window.__svg1"), "e uma mudança pequena não refaz nada")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def celular(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="jornada.jardim")
    try:
        await pg.wait_for_function(ASSADO, timeout=15000); await pg.wait_for_timeout(400)
        f = await pg.evaluate(FPS, 4000)
        chk(f["fps"] >= 50, f"no celular: {f['fps']} quadros por segundo")
        d = await compara(pg)
        chk(d["media"] < 3 and d["acima24"] < 1, f"o desenho no celular fica igual ({d})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def reserva(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.inicio")
    try:
        await pg.wait_for_timeout(500)
        await pg.evaluate("HTMLCanvasElement.prototype.toBlob = undefined; location.hash = 'jornada.jardim'"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("({ svg: !!document.querySelector('svg.jdsvg'), assado: !!document.querySelector('svg.jdsvg.jd-assado'), filtros: document.querySelectorAll('svg.jdsvg [filter]').length })")
        chk(r["svg"] and not r["assado"] and r["filtros"] > 20, f"sem como gerar imagens, o jardim aparece como antes, com os filtros ({r})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("dia", dia), ("noite com névoa", noite), ("toque, teclado e tamanho", toque), ("celular", celular), ("reserva", reserva)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
