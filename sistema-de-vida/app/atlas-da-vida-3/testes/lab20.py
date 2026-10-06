"""Mandala e jardim: as pétalas ficam no lugar depois de abrir e fechar a mandala ampliada e trocar as camadas, inclusive
simulando o Safari (CSS que anula o transform); nenhum elemento SVG com o atributo transform é animado por CSS; o jardim usa
uma paleta só, mostra a composição inteira em esboço desde o começo e o qi (pérola no rio, ondas e balanços) liga os pilares
num mesmo ciclo, em SMIL, sem nada disso quando o sistema pede menos movimento."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
PET = r"""() => [...document.querySelectorAll('.jmandala')].filter(m => m.offsetParent).map(m => { const s = m.querySelector('svg').getBoundingClientRect(), cx = s.left + s.width / 2, cy = s.top + s.height / 2;
  const ps = [...m.querySelectorAll('.jm-p path')], d = ps.map(p => { const r = p.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) / s.width; });
  const ang = new Set(ps.map(p => { const r = p.getBoundingClientRect(); return Math.round(Math.atan2(r.top + r.height / 2 - cy, r.left + r.width / 2 - cx) * 180 / Math.PI / 5); }));
  return { n: d.length, min: Math.min(...d), max: Math.max(...d), ang: ang.size, ins: ps.every(p => { const r = p.getBoundingClientRect(); return r.left >= s.left - 1 && r.right <= s.right + 1 && r.top >= s.top - 1 && r.bottom <= s.bottom + 1; }) }; })"""
CONFLICT = r"""() => { const out = [];
  for (const a of document.getAnimations()) { const t = a.effect?.target; if (!(t instanceof SVGElement) || !t.hasAttribute('transform')) continue;
    if (a.effect.getKeyframes().some(k => k.transform !== undefined)) out.push((t.getAttribute('class') || t.tagName) + ':' + a.animationName); }
  return out; }"""
PAL = r"""() => { const svg = document.querySelector('.jdscene svg'), c = new Set();
  for (const el of svg.querySelectorAll('path,circle,ellipse,rect,line,polygon,text')) { if (el.closest('defs')) continue; const cs = getComputedStyle(el);
    for (const p of ['fill', 'stroke']) { const v = cs[p]; if (!v || v === 'none' || v.startsWith('url') || /rgba\(.*,\s*0\)$/.test(v)) continue; const m = v.match(/\d+/g); if (m) c.add('#' + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, '0')).join('')); } }
  return [...c]; }"""
OKPAL = {"#1d1915", "#f1e6cf", "#efe5cf", "#b0352a", "#d9c497", "#a3814f", "#5d7180", "#b8566a", "#857e72", "#a8a193", "#3b3631", "#fbf5e6", "#d8c39c", "#6b5236",
         "#e9dfca", "#cdb48a", "#7a5b33", "#a8402e", "#d8c7a2", "#f0a040", "#f2c46d", "#0c1322", "#c8743a", "#fff3a0", "#000000"}
POS = r"""(t) => { const svg = document.querySelector('.jdscene svg'); svg.pauseAnimations(); svg.setCurrentTime(t);
  const c = svg.querySelector('.jd-qi circle'), r = c.getBoundingClientRect(), s = svg.getBoundingClientRect(), k = 1000 / s.width;
  return [Math.round((r.left + r.width / 2 - s.left) * k), Math.round((r.top + r.height / 2 - s.top) * k)]; }"""

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1024, h=1300, hash_="jornada.inicio")
        try:
            await pg.wait_for_timeout(500); await pg.evaluate("exOn()"); await pg.wait_for_timeout(1200)
            await pg.evaluate("location.hash='jornada.bussola'"); await pg.wait_for_timeout(200); await pg.evaluate("location.hash='jornada.inicio'"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("document.querySelectorAll('.jmandala.anim animateTransform').length") == 20, "a mandala cresce com SMIL (uma animação por pétala), não com CSS transform")
            chk(await pg.evaluate("[...document.querySelectorAll('.jm-p')].every(g => !g.hasAttribute('transform') && g.parentElement.getAttribute('transform')?.startsWith('translate(260 260)'))"), "a posição de cada pétala fica no grupo de fora; a pétala animada não tem transform próprio")
            res = []
            await pg.wait_for_timeout(1300); r0 = await pg.evaluate(PET); res += r0
            for i in range(3):
                await pg.click("[data-vfocus=jmandala]"); await pg.wait_for_timeout(1500); res += await pg.evaluate(PET)
                await pg.click("#focusdlg [data-act=closefocus]"); await pg.wait_for_timeout(1500); res += await pg.evaluate(PET)
            for l in ["ritmo", "hist", "est"]:
                await pg.click(f"[data-act=jmlay][data-v={l}]"); await pg.wait_for_timeout(1500); res += await pg.evaluate(PET)
            chk(len(res) >= 13 and all(x["n"] == 20 and abs(x["min"] - .2135) < .004 and abs(x["max"] - .2135) < .004 and x["ins"] and x["ang"] >= 18 for x in res), f"pétalas no lugar depois de 3 aberturas e fechamentos e das 3 camadas ({len(res)} medições, distância {res[0]['min']:.3f}–{res[0]['max']:.3f})")
            await pg.add_style_tag(content=".jmandala .jm-p{transform:none!important;animation:jmgrow .7s both!important}")
            await pg.click("[data-act=jmlay][data-v=ritmo]"); await pg.wait_for_timeout(900); rs = await pg.evaluate(PET)
            chk(rs and all(abs(x["min"] - .2135) < .004 and x["ins"] for x in rs), "simulando o Safari (CSS anulando o transform das pétalas), elas continuam no lugar")
            for h in ["jornada.inicio", "jornada.jardim", "jornada.bussola"]:
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(150)
                cf = await pg.evaluate(CONFLICT); chk(not cf, f"{h}: nenhum elemento SVG com atributo transform animado por CSS ({cf[:3]})")
            # jardim crescido (exemplo)
            await pg.evaluate("location.hash='jornada.jardim'; JD.h = 11; render()"); await pg.wait_for_timeout(500)
            pal = set(await pg.evaluate(PAL))
            chk(pal <= OKPAL, f"jardim numa paleta só: tinta, papel, ocre, índigo, carmim e o vermelho do selo ({sorted(pal - OKPAL)})")
            chk(await pg.evaluate("![...document.querySelectorAll('.jdscene [fill],.jdscene [stroke]')].some(e => Object.values(J_PIL).some(P => [e.getAttribute('fill'), e.getAttribute('stroke'), e.getAttribute('style') || ''].join(' ').includes(P.cor)))"), "nenhuma cor de pilar dentro do desenho (as cores ficam nos selos e nos textos)")
            T = await pg.evaluate("J_ORDER.map(p => jdTree(p).s)")
            chk(await pg.evaluate("document.querySelectorAll('.jdscene .jd-sketch').length") == sum(1 for s in T if s < 5), f"cada árvore que ainda não está em flor tem o esboço da forma inteira ({T})")
            chk(await pg.evaluate("!document.querySelector('.jd-gate rect') && !!document.querySelector('.jd-gate path')"), "o portão da lua é pintado a pincel, como o resto")
            chk(await pg.evaluate("!!document.querySelector('.jd-qi animateMotion mpath') && ['href', 'xlink:href'].some(a => document.querySelector('.jd-qi mpath').getAttribute(a) === '#jdriver')"), "a pérola do qi segue o próprio rio (#jdriver)")
            chk(await pg.evaluate("document.querySelectorAll('.jd-qiwave circle').length") == 6, "seis lugares respondem com a mesma onda: nascente, meditação, templo, taoísmo, lago e figueira")
            chk(await pg.evaluate("document.querySelectorAll('.jdscene animateTransform[type=rotate]').length") >= 4, "árvores e bambu se inclinam quando o qi passa")
            durs = await pg.evaluate("[...new Set([...document.querySelectorAll('.jd-qi *, .jd-qiwave *, .jdscene animateTransform')].map(a => a.getAttribute('dur')).filter(Boolean))]")
            chk(durs == ["24s"], f"tudo no mesmo ciclo de 24 s ({durs})")
            p1 = await pg.evaluate(POS, 24 * .155); p2 = await pg.evaluate(POS, 24 * .31); p3 = await pg.evaluate(POS, 24 * .618)
            chk(abs(p1[0] - 730) < 30 and abs(p1[1] - 270) < 30, f"aos 3,7 s a pérola passa pela Meditação ({p1})")
            chk(abs(p2[0] - 500) < 30 and abs(p2[1] - 500) < 30, f"aos 7,4 s passa pelo templo, no centro ({p2})")
            chk(abs(p3[0] - 500) < 40 and p3[1] > 900, f"aos 14,8 s chega ao mar, junto ao Budismo ({p3})")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # jardim do começo: tudo em esboço
        b, pg, e2 = await open_page(p, w=1100, h=1200, hash_="jornada.jardim", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(1200)
            chk(await pg.evaluate("J_ORDER.every(p => jdTree(p).s === 0)") and await pg.evaluate("document.querySelectorAll('.jdscene .jd-sketch').length") == 4, "jardim vazio: as quatro árvores aparecem inteiras em esboço")
            chk(await pg.evaluate("[...document.querySelectorAll('.jd-sketch')].every(g => g.querySelectorAll('path').length > 10)"), "os esboços têm o desenho completo, não só um ponto")
            chk(await pg.evaluate("!document.querySelector('.jd-fogg [stroke-dasharray], .jd-ghost [stroke-dasharray]')"), "sem tracejado técnico nem nuvens de desenho animado: névoa e esboço a pincel")
            chk(not e2, f"sem erros ({e2[:2]})")
        finally:
            await b.close()
        # menos movimento
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        ctx = await b.new_context(viewport={"width": 1100, "height": 1200}, reduced_motion="reduce")
        pg = await ctx.new_page(); await pg.add_init_script("window.__MOCKCFG={};" + MOCK)
        html = SKEL + HTML + "</body></html>"
        await pg.route("https://atlas.test/", lambda r: r.fulfill(body=html, content_type="text/html"))
        await pg.goto("https://atlas.test/#jornada.inicio"); await pg.wait_for_timeout(1000)
        try:
            chk(await pg.evaluate("document.querySelectorAll('.jmandala animateTransform').length") == 0, "menos movimento: a mandala não cresce")
            await pg.evaluate("location.hash='jornada.jardim'"); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("!document.querySelector('.jd-qi, .jd-qiwave') && document.querySelectorAll('.jdscene animateTransform').length === 0"), "menos movimento: sem o qi animado no jardim")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
