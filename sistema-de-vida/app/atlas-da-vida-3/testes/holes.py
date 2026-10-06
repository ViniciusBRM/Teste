import asyncio, sys
from harness import *
JS = r"""() => {
 const out=[]; const grids=[...document.querySelectorAll('#main *')].filter(e=>{const s=getComputedStyle(e);return (s.display==='grid'&&s.gridTemplateColumns.split(' ').length>1)});
 for(const g of grids){ const kids=[...g.children].filter(k=>k.offsetParent&&k.getBoundingClientRect().height>0); if(/calm|hgrid|form|sjhero|ck3|trow/.test(g.className)) continue; if(kids.length<2) continue;
  const gr=g.getBoundingClientRect(), rs=kids.map(k=>k.getBoundingClientRect());
  const gap=parseFloat(getComputedStyle(g).rowGap)||0;
  const bottom=Math.max(...rs.map(r=>r.bottom));
  rs.forEach((r,i)=>{ // space below item until next item overlapping horizontally, or grid content bottom
    let next=bottom+gap; for(let j=0;j<rs.length;j++){ if(j===i) continue; const o=rs[j]; if(o.top>=r.bottom-1 && o.left<r.right-2 && o.right>r.left+2) next=Math.min(next,o.top); }
    const hole=next-r.bottom-gap; if(hole>24 && getComputedStyle(kids[i]).position!=='sticky') out.push({grid:(g.className||g.tagName).toString().slice(0,30),item:(kids[i].className||kids[i].tagName).toString().slice(0,30)+':'+(kids[i].querySelector('h2,h3')?.textContent||'').slice(0,28),hole:Math.round(hole)}); });
 } return out; }"""
async def main(w):
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=w)
        for h in (sys.argv[2:] or PAGES):
            await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(300)
            r = await pg.evaluate(JS)
            if r: print(h, len(r), sum(x['hole'] for x in r)); [print('   ', x) for x in sorted(r,key=lambda x:-x['hole'])[:8]]
        await b.close()
asyncio.run(main(int(sys.argv[1])))
