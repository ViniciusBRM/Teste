"""Detector de buracos: espaço vazio grande entre caixas, aba por aba (geometria, não depende da janela)."""
import asyncio, json, sys
from harness import *

FUROS = r"""
((step, minH, minW) => {
  const root = document.querySelector('#main'); if (!root) return { err: 'sem #main' };
  const sy = scrollY, sx = scrollX, rects = [];
  const box = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return 0;
    const bg = cs.backgroundColor, a = (bg.match(/rgba?\(([^)]+)\)/) || [, '0,0,0,0'])[1].split(',').map(Number);
    const hasBg = (a.length === 4 ? a[3] > 0.02 : a.length === 3) || cs.backgroundImage !== 'none';
    const bd = ['Top','Right','Bottom','Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && !/rgba\(.*,\s*0\)/.test(cs['border' + s + 'Color']));
    const sh = cs.boxShadow && cs.boxShadow !== 'none';
    if (hasBg || bd || sh) return 2;
    if (/^(IMG|SVG|svg|CANVAS|VIDEO|INPUT|TEXTAREA|SELECT|BUTTON|TABLE|IFRAME|HR)$/.test(el.tagName)) return 2;
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return 1;
    return 0; };
  const walk = el => { for (const c of el.children) { const r = c.getBoundingClientRect(); if (r.width < 1 || r.height < 1) { if (getComputedStyle(c).display === 'contents') walk(c); continue; }
      const k = box(c); if (k) { rects.push([r.left + sx, r.top + sy, r.right + sx, r.bottom + sy, k === 2 ? c : null]); if (k === 2) continue; } walk(c); } };
  walk(root);
  const big = rects.filter(r => r[4]);
  if (!big.length) return { holes: [] };
  const x0 = Math.min(...big.map(r => r[0])), x1 = Math.max(...big.map(r => r[2])), y0 = Math.max(sy + (window.__vtop || 0), Math.min(...big.map(r => r[1]))), y1 = Math.min(sy + innerHeight, Math.max(...big.map(r => r[3])));
  if (y1 - y0 < minH) return { holes: [], ocos: [], lados: [] };
  const W = Math.ceil((x1 - x0) / step), H = Math.ceil((y1 - y0) / step), cov = new Uint8Array(W * H);
  for (const [l, t, r, b] of rects) { const i0 = Math.max(0, Math.floor((l - x0) / step)), i1 = Math.min(W - 1, Math.floor((r - x0 - 1) / step)), j0 = Math.max(0, Math.floor((t - y0) / step)), j1 = Math.min(H - 1, Math.floor((b - y0 - 1) / step));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) cov[j * W + i] = 1; }
  /* maior retângulo vazio por componente: aproximação pela altura de cada coluna de células vazias */
  const seen = new Uint8Array(W * H), holes = [];
  for (let s = 0; s < W * H; s++) { if (cov[s] || seen[s]) continue; const q = [s]; seen[s] = 1; let n = 0, mi = W, ma = 0, mj = H, mb = 0; const cells = [];
    while (q.length) { const c = q.pop(); n++; cells.push(c); const i = c % W, j = (c - i) / W; mi = Math.min(mi, i); ma = Math.max(ma, i); mj = Math.min(mj, j); mb = Math.max(mb, j);
      for (const [di, dj] of [[1,0],[-1,0],[0,1],[0,-1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= W || b >= H) continue; const k = b * W + a; if (!cov[k] && !seen[k]) { seen[k] = 1; q.push(k); } } }
    /* retângulo maximal dentro do componente (histograma) */
    const inC = new Set(cells); let best = [0, 0, 0, 0, 0]; const h = new Array(ma - mi + 1).fill(0);
    for (let j = mj; j <= mb; j++) { for (let i = mi; i <= ma; i++) h[i - mi] = inC.has(j * W + i) ? h[i - mi] + 1 : 0;
      const st = []; for (let k = 0; k <= h.length; k++) { const v = k < h.length ? h[k] : 0; let start = k; while (st.length && st.at(-1)[1] >= v) { const [p, hv] = st.pop(); const area = hv * (k - p); if (area > best[0]) best = [area, p + mi, j - hv + 1, k - p, hv]; start = p; } st.push([start, v]); } }
    const [, bi, bj, bw, bh] = best, w = bw * step, hh = bh * step;
    if (hh >= minH && w >= minW) { const hx = x0 + bi * step, hy = y0 + bj * step;
      /* contêiner: o elemento mais fundo que contém o buraco inteiro */
      let cont = root, go = true; while (go) { go = false; for (const c of cont.children) { const r = c.getBoundingClientRect(); if (r.left + sx <= hx + 2 * step && r.top + sy <= hy + 2 * step && r.right + sx >= hx + w - 2 * step && r.bottom + sy >= hy + hh - 2 * step) { cont = c; go = true; break; } } }
      const cs = getComputedStyle(cont), sel = cont.tagName.toLowerCase() + (cont.id ? '#' + cont.id : '') + (cont.className && typeof cont.className === 'string' ? '.' + cont.className.trim().split(/\s+/).join('.') : '');
      holes.push({ x: Math.round(hx), y: Math.round(hy), w, h: hh, c: sel, d: cs.display, cols: cs.gridTemplateColumns || '', kids: cont.children.length }); }
  }
  /* vazio dentro de caixa esticada: altura da caixa menos a faixa ocupada pelos filhos */
  const ocos = [];
  for (const [l, t, r, bt, el] of big) { if (!el || !(el.classList.contains('grown') || el.dataset.cfp || el.querySelector(':scope > [data-cfp]'))) continue;
    const cs = getComputedStyle(el); if (/auto|scroll/.test(cs.overflowY)) continue;
    const ks = [...el.children].filter(k => { const q = k.getBoundingClientRect(); return q.height > 0 && getComputedStyle(k).position !== 'absolute'; }).map(k => k.getBoundingClientRect());
    if (!ks.length) continue; const top = Math.min(...ks.map(q => q.top)) + sy, bot = Math.max(...ks.map(q => q.bottom)) + sy;
    const oco = (bt - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth) - bot) + (top - t - parseFloat(cs.paddingTop) - parseFloat(cs.borderTopWidth));
    if (oco >= 160 && r - l >= 180) ocos.push({ x: Math.round(l), y: Math.round(t), w: Math.round(r - l), oco: Math.round(oco), c: (el.querySelector('h2,h3')?.textContent || el.className).slice(0, 30) }); }
  /* vazio à direita de um cartão que foi alargado para a largura toda e cujo conteúdo não acompanha */
  const lados = [];
  for (const el of root.querySelectorAll('[data-pkfull="w"]')) { const cr = el.getBoundingClientRect(); if (cr.bottom < 0 || cr.top > innerHeight) continue;
    const dir = pkDireita(el), sobra = cr.width - parseFloat(getComputedStyle(el).paddingRight) - dir;
    if (sobra >= 200 && cr.height >= 120) lados.push({ x: Math.round(cr.left), y: Math.round(cr.top + sy), w: Math.round(sobra), h: Math.round(cr.height), c: (el.querySelector('h2,h3')?.textContent || '').slice(0, 30) }); }
  return { holes: holes.sort((a, b) => b.w * b.h - a.w * a.h), ocos, lados, area: [Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0)] };
})
"""

def views():
    import re
    src = (ROOT / "05-ui.js").read_text()
    nav = re.findall(r'\["(\w+)", "[^"]+", "\w+"\]', src.split("const SUBS")[0].split("const NAV")[1])
    subs = {}
    blk = src.split("const SUBS = {")[1].split("};")[0]
    for m in re.finditer(r'^\s*(\w+): \[(.*)\],?\s*$', blk, re.M):
        subs[m.group(1)] = [x[0] for x in re.findall(r'\["(\w+)", "[^"]+"(, "\w+")?\]', m.group(2)) if not x[1]]
    out = []
    for p in nav:
        if p in subs: out += [f"{p}.{s}" for s in subs[p]]
        else: out.append(p)
    return out

async def main():
    W = int(sys.argv[1]) if len(sys.argv) > 1 else 1440
    H = int(sys.argv[2]) if len(sys.argv) > 2 else 900
    ex = (sys.argv[3] if len(sys.argv) > 3 else "ex") == "ex"
    semlado = "--semlado" in sys.argv; sys.argv = [x for x in sys.argv if x != "--semlado"]
    only = sys.argv[4].split(",") if len(sys.argv) > 4 else None
    vs = only or views()
    res = {}
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=W, h=H)
        if semlado: await pg.evaluate("PK_LADO = false")
        if ex: await pg.evaluate("exOn()"); await pg.wait_for_timeout(600)
        else:   # vazio de verdade: o app abre com o exemplo quando o banco está vazio; “Começar do zero” limpa
            await pg.evaluate("document.querySelector('#startEmpty')?.click()"); await pg.wait_for_timeout(600)
            print("vazio:", await pg.evaluate("[IS_EXAMPLE, S.lanc.length, S.diario.length]"), flush=True)
        for v in vs:
            await pg.evaluate(f"location.hash = {json.dumps(v)}"); await pg.wait_for_timeout(450)
            # topo fixo (barra de referência) não é conteúdo: mede abaixo dele
            await pg.evaluate("window.__vtop = Math.max(0, ...[...document.querySelectorAll('.refbar')].map(e => getComputedStyle(e).position === 'sticky' ? e.getBoundingClientRect().bottom : 0))")
            full = await pg.evaluate("document.documentElement.scrollHeight"); y = 0; pior = []; ocos = []; lados = []
            while True:
                await pg.evaluate(f"scrollTo(0, {y})"); await pg.wait_for_timeout(60)
                r = await pg.evaluate(FUROS + "(8, 120, 180)")
                for h in r.get("holes", []): h["s"] = y; pior.append(h)
                for o in r.get("ocos", []):
                    if not any(o["x"] == q["x"] and o["y"] == q["y"] for q in ocos): ocos.append(o)
                for o in r.get("lados", []):
                    if not any(o["x"] == q["x"] and o["y"] == q["y"] for q in lados): lados.append(o)
                if y + H >= full: break
                y = min(full - H, y + H // 2)
            pior.sort(key=lambda h: -h["w"] * h["h"])
            res[v] = {"holes": pior, "ocos": ocos, "lados": lados}
            if lados: print("LADO", v, json.dumps(lados[:4]), flush=True)
            if pior: print(v, json.dumps(pior[:3]), flush=True)
            if ocos: print("OCO", v, json.dumps(ocos[:4]), flush=True)
            await pg.evaluate("scrollTo(0, 0)")
        for e in errs[:5]: print("  ", e)
        await b.close()
    n = sum(1 for r in res.values() if r.get("holes")); no = sum(1 for r in res.values() if r.get("ocos")); nl = sum(1 for r in res.values() if r.get("lados"))
    # área vazia total (milhões de px²): o maior buraco de cada tela + o vazio de cada caixa esticada + o vazio lateral de cada cartão alargado
    tot = sum((max((h["w"] * h["h"] for h in r["holes"]), default=0) + sum(o["oco"] * o["w"] for o in r["ocos"]) + sum(o["w"] * o["h"] for o in r["lados"])) for r in res.values()) / 1e6
    print(f"vazio lateral em cartão alargado: {nl} telas · área vazia total {tot:.2f} milhões de px²")
    print(f"\n{W}x{H} {'exemplo' if ex else 'vazio'}: {len(vs)} vistas, {n} com buraco, {no} com caixa esticada (vazio interno >= 160 px)")

if __name__ == "__main__":
    asyncio.run(main())
