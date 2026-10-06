import asyncio, sys
from harness import *

async def main(w, theme):
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=w, theme=theme)
        for h in PAGES:
            n0 = len(errs)
            await pg.evaluate(f"location.hash='{h}'")
            await pg.wait_for_timeout(250)
            ov = await overflow(pg)
            prob = await pg.evaluate("document.querySelector('.emptyb b')?.textContent?.includes('problema') ? document.querySelector('.emptyb span').textContent : ''")
            print(f"{h:18} overflow={ov[0]>ov[1]} {ov} errs={errs[n0:]} {prob}")
        await b.close()
asyncio.run(main(int(sys.argv[1]) if len(sys.argv)>1 else 1440, sys.argv[2] if len(sys.argv)>2 else "dark"))
