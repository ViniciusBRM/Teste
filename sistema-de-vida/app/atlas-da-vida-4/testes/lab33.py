"""Atlas 4 · dados fictícios só com o botão Exemplo. A aba A Dois mostrava uma prévia com a “Chiara (exemplo)” quando o espaço
estava vazio, e uma demonstração quando o banco não respondia, com o Exemplo desligado. Aqui: A Dois vazia, depois de entrar,
sem banco, com conteúdo real da outra pessoa, com o Exemplo ligado e desligado; e uma varredura das 151 telas com o banco
vazio, procurando qualquer texto que só exista nos dados de exemplo."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

# textos que só existem nos dados de exemplo: folhas de exampleData() e DUO_DEMO() que não aparecem em nenhum outro lugar do
# código (tirando o corpo das funções de exemplo). Assim opções, catálogos e perguntas fixas do app não contam.
EX_TEXTOS = r"""() => {
  const leaves = (o, out) => { if (typeof o === 'string') out.add(o.trim()); else if (o && typeof o === 'object') for (const v of Object.values(o)) leaves(v, out); return out; };
  const fns = ['exampleData', 'exampleLab', 'exampleDiary', 'exampleMentors', 'exampleJornada', 'exampleCarreira', 'exampleLazer', 'exampleAprofunda',
    'exampleRedesenho', 'exampleJardim', 'csExemplo', 'filExemplo', 'psiExemplo', 'ckExemplo', 'ckExemploHist', 'sdExemplo', 'cfExemplo', 'DUO_DEMO'];
  let rest = [...document.scripts].map(s => s.textContent).join('\n');
  for (const n of fns) { const f = window[n]; if (typeof f === 'function') rest = rest.split(f.toString()).join(''); }
  const ex = leaves(exampleData(), new Set()); leaves(DUO_DEMO(), ex);
  return { fns: fns.filter(n => typeof window[n] === 'function').length,
    textos: [...ex].filter(s => s.length >= 12 && /[a-zà-ú]{3,}\s+[a-zà-ú]{3,}/i.test(s) && !rest.includes(s) && !rest.includes(JSON.stringify(s).slice(1, -1))) };
}"""
DEMO = r"""() => { const d = DUO_DEMO(), t = []; for (const k of ['diario', 'gastos']) for (const ms of Object.values(d[k])) for (const m of Object.values(ms)) for (const it of m.itens) t.push(it.texto || it.desc);
  for (const ms of Object.values(d.metas)) for (const m of Object.values(ms)) t.push(m.titulo); return t; }"""
PAGE = "(() => { const m = document.querySelector('#main'); return m ? m.innerText : ''; })()"

async def demo_na_tela(pg):
    textos = await pg.evaluate(DEMO); T = await pg.evaluate(PAGE)
    return [s for s in textos if s in T] + (["Chiara (exemplo)"] if "Chiara (exemplo)" in T else []) + (["prévia"] if await pg.evaluate("!!document.querySelector('.duoprev')") else [])

async def vazio(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="dupla", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(900)
        for sub in ["dupla", "dupla.orcamento", "dupla.metas"]:
            await pg.evaluate(f"location.hash = '{sub}'"); await pg.wait_for_timeout(300)
            chk(await demo_na_tela(pg) == [], f"{sub}: espaço vazio, Exemplo desligado → nenhum dado fictício")
        await pg.evaluate("location.hash = 'dupla'"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("!!document.querySelector('[data-act=duojoin]')"), "antes de entrar: o convite continua (botão Entrar no espaço a dois)")
        await pg.click("[data-act=duojoin]"); await pg.wait_for_timeout(600)
        chk(await pg.evaluate("!!window.__store['dupla/u_test']"), "entrar grava o seu perfil no espaço a dois")
        for sub in ["dupla", "dupla.orcamento", "dupla.metas"]:
            await pg.evaluate(f"location.hash = '{sub}'"); await pg.wait_for_timeout(300)
            T = await pg.evaluate(PAGE)
            chk(await demo_na_tela(pg) == [] and ("Ainda não há nada aqui" in T or "Nenhum gasto em comum" in T or "Nenhuma meta em comum" in T),
                f"{sub}: depois de entrar, estado vazio de verdade, sem exemplo")
        # Exemplo ligado: aí sim os dados fictícios, marcados e sem gravar
        antes = await pg.evaluate("JSON.stringify(Object.keys(window.__store).filter(k => k.startsWith('dupla/')).sort())")
        await pg.evaluate("location.hash = 'dupla'"); await pg.wait_for_timeout(200)
        await pg.click("[data-act=extog]"); await pg.wait_for_timeout(600)
        T = await pg.evaluate(PAGE); vis = await demo_na_tela(pg)
        chk("Chiara (exemplo)" in T and "Modo Exemplo" in T and len(vis) >= 3, f"Exemplo ligado: a A Dois mostra o exemplo marcado ({len(vis)} textos)")
        chk(await pg.evaluate("document.querySelector('[data-act=duopost]')?.disabled === true"), "Exemplo ligado: Compartilhar desligado")
        await pg.evaluate("location.hash = 'dupla.metas'"); await pg.wait_for_timeout(300)
        chk("Viagem para a Sicília" in await pg.evaluate(PAGE), "Exemplo ligado: metas do exemplo")
        depois = await pg.evaluate("JSON.stringify(Object.keys(window.__store).filter(k => k.startsWith('dupla/')).sort())")
        chk(antes == depois, "Exemplo ligado: nada gravado no espaço a dois")
        await pg.click("[data-act=extog]"); await pg.wait_for_timeout(600)
        await pg.evaluate("location.hash = 'dupla'"); await pg.wait_for_timeout(300)
        chk(await demo_na_tela(pg) == [], "Exemplo desligado de novo: o exemplo some")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def sem_banco(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="dupla", cfg={"realBoot": True, "off": ["db"]})
    try:
        await pg.wait_for_timeout(900)
        T = await pg.evaluate(PAGE)
        chk(await demo_na_tela(pg) == [] and "precisa do Atlas aberto no Claude" in T, "sem banco: explica o motivo e não mostra exemplo (antes: demonstração com a Chiara)")
        await pg.click("[data-act=extog]"); await pg.wait_for_timeout(600)
        chk(len(await demo_na_tela(pg)) >= 3, "sem banco e com o Exemplo ligado: o exemplo aparece")
    finally:
        await b.close()

async def com_conteudo(p):
    mk = "2026-10"; d1 = "2026-10-08"
    seed = {"dupla/u_partner": {"consenteMentor": False, "entrou": d1, "at": 1},
            f"dupla/u_partner/diario/{mk}": {"mes": mk, "itens": [{"id": "pd1", "data": d1, "texto": "Texto real da outra pessoa, só para o teste.", "humor": 4, "at": 1}]}}
    for cfg, rot in (({"realBoot": True, "seedStore": json.dumps(seed)}, "sem entrar"), ({"realBoot": True, "seedStore": json.dumps(seed), "canWrite": False}, "só leitura")):
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="dupla", cfg=cfg)
        try:
            await pg.wait_for_timeout(900)
            T = await pg.evaluate(PAGE)
            chk("Texto real da outra pessoa" in T and await demo_na_tela(pg) == [], f"{rot}: o que a outra pessoa escreveu aparece, sem exemplo misturado")
        finally:
            await b.close()

async def varredura(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="visao", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(900)
        chk(await pg.evaluate("!EX_MODE && !IS_EXAMPLE && S.lanc.length === 0"), "banco vazio, Exemplo desligado")
        ex = await pg.evaluate(EX_TEXTOS); exs = ex["textos"]
        chk(ex["fns"] == 18, f"as 18 funções de exemplo foram achadas ({ex['fns']})")
        rotas = await pg.evaluate("""(() => { const r = []; for (const [k] of NAV.flatMap(g => g[1])) { const s = SUBS[k]; if (s) s.forEach(x => r.push(k + '.' + x[0])); else r.push(k); }
          for (const m of Object.keys(MENTOR_DEF)) r.push('mentor.' + m); return [...new Set(r)]; })()""")
        achados = {}
        for h in rotas:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(120); await pg.evaluate("render()")
            T = await pg.evaluate(PAGE)
            f = [s for s in exs if s in T]
            if f: achados[h] = f[:4]
        chk(len(rotas) >= 150 and len(exs) > 400, f"varredura: {len(rotas)} telas, {len(exs)} textos que só existem no exemplo")
        chk(not achados, f"nenhuma tela mostra texto do exemplo com o Exemplo desligado ({achados})")
        chk(not errs, f"sem erros na varredura ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("vazio", vazio), ("sem banco", sem_banco), ("com conteúdo", com_conteudo), ("varredura", varredura)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:300])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
