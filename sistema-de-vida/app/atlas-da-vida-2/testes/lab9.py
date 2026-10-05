"""Aprofundamento: Carreira (portfólio, decisões, mercado) e Jornada (programas, sessões, conceitos, métricas nos Cruzamentos)."""
import asyncio, json, traceback, statistics
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
SEED = {"data/users/u_test/s_carreira": {"at": 1, "v": {"perfil": {"mercado": "it", "cargo": "Coordenador", "empresa": "Empresa X", "mapa": ["AutoCAD Civil 3D"], "remun": {"bruto": 2800, "mens": 14, "buoni": 196}}, "geo": {"modo": "oculta"}}}}
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED)}, hash_="carreira.portfolio")
        try:
            await pg.wait_for_timeout(700)
            # portfólio
            await pg.fill("[data-crf='pt.t']", "Variante SS20"); await pg.fill("[data-crf='pt.numeros']", "4 km; 300 interferências")
            for c in ("Navisworks", "Coordenação e clash detection", "Drenagem"): await pg.click(f"[data-act=crptc][data-n='{c}']"); await pg.wait_for_timeout(80)
            await pg.fill("[data-crf='pt.a']", "Federei o modelo"); await pg.fill("[data-crf='pt.r']", "Entregue no prazo"); await pg.click("[data-act=crptsave]"); await pg.wait_for_timeout(200)
            pt = await pg.evaluate("S.carreira.port.at(-1)")
            chk(pt["t"] == "Variante SS20" and pt["comps"] == ["Navisworks", "Coordenação e clash detection", "Drenagem"] and pt["r"] == "Entregue no prazo", "projeto guardado com competências, números e STAR")
            chk(await pg.evaluate("crSrc('Navisworks')") == "projeto" and await pg.evaluate("crEvid('Drenagem').length") == 1, "competência usada num projeto vira evidência e conta na base do perfil")
            await pg.click(f"[data-act=crptedit][data-id='{pt['id']}']"); await pg.wait_for_timeout(150); await pg.fill("[data-crf='pt.papel']", "Coordenador BIM"); await pg.click("[data-act=crptsave]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.port.length") == 1 and await pg.evaluate("S.carreira.port[0].papel") == "Coordenador BIM", "editar atualiza o mesmo projeto")
            cv = await pg.evaluate("crCVmd()")
            chk("## Projetos" in cv and "Variante SS20" in cv and "Federei o modelo" in cv and "4 km" in cv, "CV em texto sai do perfil e dos projetos")
            await pg.click("[data-act=crcv]"); await pg.wait_for_timeout(300)
            dl = await pg.evaluate("window.__saved.some(s => s.filename.startsWith('cv-portfolio-') && atob(s.b64).length > 50)")
            chk(bool(dl), "o CV é oferecido para baixar")
            # decisões
            await pg.evaluate("location.hash='carreira.decisoes'"); await pg.wait_for_timeout(250)
            for t in ("Ficar e negociar o livello", "BIM Manager em outra empresa"): await pg.click(f"[data-act=crcen0][data-t='{t}']"); await pg.wait_for_timeout(120)
            D = await pg.evaluate("S.carreira.dec")
            notas = {0: [3, 3, 4, 5, 4, 5], 1: [4, 4, 5, 3, 3, 2]}
            for i, x in enumerate(D["cen"]):
                for j, c in enumerate(D["crit"]): await pg.select_option(f"[data-crds='{x['id']}|{c['id']}']", str(notas[i][j]))
            await pg.fill(f"[data-crdw='{D['crit'][0]['id']}']", "5"); await pg.dispatch_event(f"[data-crdw='{D['crit'][0]['id']}']", "change"); await pg.wait_for_timeout(150)
            D = await pg.evaluate("S.carreira.dec"); R = await pg.evaluate("crDecCalc().rows.map(r => [r.x.t, r.score])")
            w = [c["w"] for c in D["crit"]]
            exp = {x["t"]: sum(wi * notas[i][j] for j, wi in enumerate(w)) / sum(w) for i, x in enumerate(D["cen"])}
            chk(all(abs(s - exp[t]) < 1e-9 for t, s in R) and R[0][1] >= R[1][1], f"nota ponderada = Σ peso × nota ÷ Σ peso, conferida à parte ({[(t[:12], round(s, 3)) for t, s in R]})")
            sens = await pg.evaluate("crDecCalc().sens.map(s => [s.c.n, s.need, s.ok])")
            gap = R[0][1] - R[1][1]; Wt = sum(w)
            chk(all(abs(nd - gap * Wt / D["crit"][[c["n"] for c in D["crit"]].index(n)]["w"]) < 1e-9 for n, nd, _ in sens), "o que teria que mudar: Δ = diferença × Σ pesos ÷ peso do critério")
            # mercado
            await pg.evaluate("location.hash='carreira.mercado'"); await pg.wait_for_timeout(250)
            for v in (36000, 42000, 48000, 40000):
                await pg.fill("[data-crf='bm.ral']", str(v)); await pg.fill("[data-crf='bm.cargo']", "BIM"); await pg.click("[data-act=crbadd]"); await pg.wait_for_timeout(100)
            M = await pg.evaluate("crMerc()")
            vals = [36000, 42000, 48000, 40000]; ral = 2800 * 14
            chk(M["ral"] == ral and M["med"] == statistics.median(vals) and abs(M["pctl"] - sum(1 for v in vals if v <= ral) / 4) < 1e-9 and abs(M["tfr"] - ral / 13.5) < 1e-9, f"RAL {ral}, mediana {statistics.median(vals):.0f}, percentil e TFR (RAL ÷ 13,5) conferidos à parte")
            await pg.fill("[data-crf='m.resp']", "Coordeno o setor"); await pg.click("[data-act=crmadd][data-k=resp]"); await pg.wait_for_timeout(100)
            await pg.fill("[data-crmp=ral]", "43000"); await pg.dispatch_event("[data-crmp=ral]", "change"); await pg.wait_for_timeout(150)
            M = await pg.evaluate("crMerc()"); doss = await pg.evaluate("crDossMd()")
            chk(abs(M["aum"] - (43000 - ral) / ral) < 1e-9 and "Coordeno o setor" in doss and "Mediana" in doss, "dossiê com responsabilidades, pedido (+% sobre a RAL) e referências")
            await pg.click("[data-act=crnegai]"); await pg.wait_for_timeout(2500)
            call = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').at(-1)")
            cp = "\n".join(t["content"] for t in call["input"]) if isinstance(call["input"], list) else call["input"]
            chk(await pg.evaluate("[PAGE, SUB]") == ["mentor", "car"] and "ensaiar a conversa de negociação" in cp and "Referências de mercado registradas" in cp and "Portfólio de projetos" in cp, "ensaio de negociação com o Mentor da Carreira, que lê portfólio, mercado e pedido")
            # jornada: programas
            await pg.evaluate("location.hash='jornada.praticas'"); await pg.wait_for_timeout(250)
            chk(await pg.locator(".jprog").count() == 4 and await pg.evaluate("J_PROG.map(p => p.itens.length)") == [8, 81, 26, 28], "quatro programas: MBCT 8 semanas, Tao Te Ching 81, Dhammapada 26, Evangelho 28")
            await pg.click("[data-act=jpgo][data-id=dhp]"); await pg.wait_for_timeout(150)
            await pg.click(".jprog.on [data-act=jpdone][data-id=dhp].btn"); await pg.wait_for_timeout(150)
            info = await pg.evaluate("jProgInfo(J_PROG.find(p => p.id === 'dhp'))")
            chk(info["feitos"] == 1 and info["prox"] == 2 and info["esp"] == 1 and info["atraso"] == 0 and await pg.evaluate("jActDays('bud').has(TODAY)"), "programa começado hoje: passo 1 feito, próximo é o 2, em dia, e conta no ritmo do pilar")
            await pg.evaluate("jData().prog.dhp.inicio = addDays(TODAY, -4); VER++; render()")
            info = await pg.evaluate("jProgInfo(J_PROG.find(p => p.id === 'dhp'))")
            chk(info["esp"] == 5 and info["atraso"] == 4, "quatro dias depois sem marcar: esperado 5, atraso 4")
            # sessões
            n0 = await pg.evaluate("jData().sess.length")
            for m, a, d in ((20, 2, 4), (10, 3, 3)):
                await pg.fill("[data-jsf=min]", str(m)); await pg.fill("[data-jsf=antes]", str(a)); await pg.fill("[data-jsf=depois]", str(d)); await pg.fill("[data-jsf=qual]", "4"); await pg.click("[data-act=jsess]"); await pg.wait_for_timeout(150)
            st = await pg.evaluate("jSessStats(28)")
            chk(await pg.evaluate("jData().sess.length") == n0 + 2 and st["min"] == 30 and abs(st["delta"] - ((4 - 2) + (3 - 3)) / 2) < 1e-9, "duas sessões: 30 minutos e antes → depois +1 em média")
            ms = await pg.evaluate("metricList().filter(m => m.grp === 'Jornada').map(m => m.k)")
            jm = await pg.evaluate("(() => { const D = DAILY(); return D.C.jmin[D.idx[TODAY]]; })()")
            chk("jmin" in ms and "jdia" in ms and jm == 30, f"minutos de prática viram métrica diária nos Cruzamentos ({ms}, hoje {jm})")
            await pg.click("[data-act=jcruz]"); await pg.wait_for_timeout(300)
            cz = await pg.evaluate("[PAGE, CZ.x, CZ.y, !!metric(CZ.y)]")
            chk(cz[0] == "cruz" and cz[1] == "jmin" and cz[3] and cz[2] != "jmin", f"“cruzar com o humor” abre os Cruzamentos com minutos de prática × uma métrica que existe ({cz[2]})")
            chk(await pg.evaluate("metricArea('jmin')") == "Propósito & espiritualidade", "a métrica respeita a privacidade do setor Propósito & espiritualidade")
            # conceitos e estações
            await pg.evaluate("location.hash='jornada.budismo'"); await pg.wait_for_timeout(250)
            await pg.click("[data-act=jconc][data-p=bud][data-n='Anicca'][data-v='2']"); await pg.click("[data-act=jconc][data-p=bud][data-n='Kamma'][data-v='3']"); await pg.wait_for_timeout(150)
            pc = await pg.evaluate("jConcPct('bud')"); n = await pg.evaluate("J_CONC.bud.length")
            chk(abs(pc - (2 + 3) / (3 * n)) < 1e-9, f"domínio dos conceitos = soma ÷ (3 × {n})")
            await pg.click("[data-act=jconcq][data-p=bud][data-n='Anattā']"); await pg.wait_for_timeout(150)
            chk("Anattā" in await pg.input_value("#m_in") and "pergunta por vez" in await pg.input_value("#m_in"), "testar com o mentor prepara o quiz no chat do Kalyāṇamitta")
            await pg.click("[data-act=jest][data-p=bud][data-s=sila][data-v='2']"); await pg.wait_for_timeout(150)
            h = await pg.evaluate("jP('bud').estHist.at(-1)")
            chk(h["sid"] == "sila" and h["para"] == 2 and await pg.locator(".jhist").count() == 1, "mudança de estação fica no histórico")
            pr = await pg.evaluate("jPrompt('bud', false)")
            chk("Dhammapada em 26 capítulos" in pr and "Conceitos (autoavaliação)" in pr and "Anicca: consigo explicar" in pr, "o mentor do pilar lê o programa, as sessões e os conceitos")
            await pg.wait_for_timeout(2600)
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        for w, th in ((390, "dark"), (390, "light"), (1024, "dark")):
            b, pg, errs = await open_page(p, w=w, theme=th)
            fails = []
            for h in ("carreira.portfolio", "carreira.decisoes", "carreira.mercado", "jornada.praticas", "jornada.meditacao", "jornada.espiritismo", "jornada.inicio"):
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(300)
                ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth, !!document.querySelector('.emptyb')]")
                if ov[0] > ov[1] or ov[2]: fails.append((h, ov))
            chk(not fails and not errs, f"{w}px {th}: páginas novas sem rolagem lateral nem erro {fails[:2]} {errs[:1]}")
            await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
