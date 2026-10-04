"""Hub de carreira: avaliação, trilhas (aderência conferida à parte), objetivos, geotecnia progressiva, plano e biblioteca."""
import asyncio, json, pathlib, traceback
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
DOC = pathlib.Path(__file__).parent.parent / "ft" / "docs2" / "s_carreira.json"
if DOC.exists(): seedv = json.loads(DOC.read_text())
else: seedv = {"at": 1, "v": {"perfil": {"mercado": "it", "mapa": ["AutoCAD Civil 3D", "Terraplenagem", "Drenagem", "QGIS", "Power BI", "Dynamo"], "formacao": [{"id": "f1", "curso": "Engenharia Civil", "tipo": "Graduação"}], "caminhos": ["Cursos e treinamentos"]}, "geo": {"modo": "oculta"}, "analise": [{"t": "Leitura de teste", "d": "texto"}]}}
seed = {"data/users/u_test/s_carreira": seedv}
def fit_py(req, lv):
    W = sum(w for _, _, w in req); return sum(w * min(lv.get(n, 0), r) / r for n, r, w in req) / W
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed)}, hash_="carreira")
        try:
            await pg.wait_for_timeout(700)
            chk(not await pg.evaluate("IS_EXAMPLE") and len(await pg.evaluate("S.carreira.perfil.mapa")) == len(seedv["v"]["perfil"]["mapa"]), "hub abre com o perfil gravado (mapa de carreira), fora do modo exemplo")
            nav = await pg.evaluate("[...document.querySelectorAll('#nav .nv span')].map(e => e.textContent)")
            tabs = await pg.evaluate("[...document.querySelectorAll('.subtabs a')].map(e => e.textContent)")
            chk("Carreira" in nav and tabs == ["Panorama", "Avaliação atual", "Objetivos", "Plano de ação", "Biblioteca"], f"menu com Carreira; Geotecnia escondida enquanto guardada ({tabs})")
            chk(await pg.locator(".crtri").count() == 8 and await pg.locator(".crgeoinv").count() == 1 and await pg.locator(".crana li").count() == len(seedv["v"]["analise"]), "panorama: 8 trilhas, convite da geotecnia e a leitura do percurso")
            # base no mapa conferida à parte
            tri = await pg.evaluate("CR_TRI.map(t => ({ id: t.id, req: t.req }))")
            mapa = set(seedv["v"]["perfil"]["mapa"])
            rk = await pg.evaluate("crRank().map(x => [x.t.id, x.mapa, x.fit])")
            exp = {t["id"]: sum(w for n, r, w in t["req"] if n in mapa) / sum(w for _, _, w in t["req"]) for t in tri}
            chk(all(abs(m - exp[i]) < 1e-9 and f == 0 for i, m, f in rk) and [i for i, _, _ in rk] == sorted(exp, key=lambda k: -exp[k]), f"base no mapa = recálculo independente, e a ordem segue a base enquanto nada é avaliado ({[(i, round(m * 100)) for i, m, _ in rk[:3]]})")
            # avaliação
            await pg.evaluate("location.hash='carreira.avaliacao'"); await pg.wait_for_timeout(300)
            await pg.click("[data-act=crlv][data-n='AutoCAD Civil 3D'][data-f=atual][data-v='3']"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=crlv][data-n='Navisworks'][data-f=atual][data-v='2']"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=crlv][data-n='ISO 19650'][data-f=atual][data-v='1']"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=crlv][data-n='AutoCAD Civil 3D'][data-f=alvo][data-v='5']"); await pg.wait_for_timeout(150)
            c3 = await pg.evaluate("S.comp.find(c => c.nome === 'AutoCAD Civil 3D')")
            chk(c3 and c3["atual"] == 3 and c3["alvo"] == 5 and c3["grupo"] == "infra", "nível e alvo gravados na lista de competências do Atlas, com o grupo")
            nv = await pg.evaluate("S.comp.find(c => c.nome === 'Navisworks')")
            chk(nv["alvo"] == 2, "o alvo acompanha o nível quando ainda não foi definido")
            lv = {"AutoCAD Civil 3D": 3, "Navisworks": 2, "ISO 19650": 1}
            got = await pg.evaluate("Object.fromEntries(CR_TRI.map(t => [t.id, crFit(t).fit]))")
            chk(all(abs(got[t["id"]] - fit_py(t["req"], lv)) < 1e-9 for t in tri), f"aderência pelo nível = Σ peso·mín(nível, pedido)/pedido ÷ Σ peso (infra {got['infra']:.3f})")
            await pg.fill("[data-crev='AutoCAD Civil 3D']", "Variante rodoviária de 4 km"); await pg.press("[data-crev='AutoCAD Civil 3D']", "Tab"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.comp.find(c => c.nome === 'AutoCAD Civil 3D').evid") == "Variante rodoviária de 4 km", "evidência guardada")
            await pg.click("[data-act=crsnap]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.snaps.at(-1).niveis['AutoCAD Civil 3D']") == 3, "avaliação de hoje registrada")
            await pg.fill("[data-crf='exp.cargo']", "BIM Specialist"); await pg.fill("[data-crf='exp.org']", "Empresa X"); await pg.click("[data-act=cradd][data-k=exp]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.perfil.exp.at(-1).cargo") == "BIM Specialist", "experiência acrescentada")
            await pg.fill("#crq_gaps", "Nunca escrevi um BEP completo"); await pg.click("[data-act=craddq][data-k=gaps]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.gaps.at(-1).t") == "Nunca escrevi um BEP completo", "gap qualitativo registrado")
            # trilhas e gaps calculados
            for t in ("infra", "manager", "plan", "dados"):
                await pg.evaluate(f"crClick({{ dataset: {{ act: 'crtri', id: '{t}' }} }})")
            chk(await pg.evaluate("S.carreira.trilhas") == ["manager", "plan", "dados"], "no máximo 3 trilhas: a mais antiga sai")
            await pg.evaluate("location.hash='carreira.plano'"); await pg.wait_for_timeout(300)
            g0 = await pg.evaluate("crGapsAll()[0]")
            await pg.click(f"[data-act=crgapcomp][data-n='{g0['n']}']"); await pg.wait_for_timeout(150)
            a = await pg.evaluate("S.carreira.acoes.at(-1)")
            chk(a["comp"] == g0["n"] and a["lib"] and a["prazo"], f"o maior gap ({g0['n']}) vira ação com recurso sugerido e prazo")
            # objetivo, meta, tarefa e custo
            await pg.evaluate("location.hash='carreira.objetivos'"); await pg.wait_for_timeout(300)
            await pg.fill("[data-crf='obj.t']", "BIM Coordinator certificado"); await pg.select_option("[data-crf='obj.tipo']", "certificação"); await pg.fill("[data-crf='obj.prazo']", await pg.evaluate("addDays(TODAY, 200)")); await pg.select_option("[data-crf='obj.tri']", "infra")
            await pg.click("[data-act=crobjsave]"); await pg.wait_for_timeout(200)
            o = await pg.evaluate("S.carreira.obj.at(-1)")
            chk(o["t"] == "BIM Coordinator certificado" and o["tri"] == "infra" and await pg.locator("[data-vid=crtl] .crtl-o").count() >= 1, "objetivo com prazo e trilha, na linha do tempo")
            await pg.click(f"[data-act=crmeta][data-id='{o['id']}']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"S.metas.some(m => m.id === S.carreira.obj.find(x => x.id === '{o['id']}').meta && m.area === 'Carreira')"), "objetivo vira meta do Atlas na área Carreira")
            await pg.evaluate("location.hash='carreira.plano'"); await pg.wait_for_timeout(300)
            await pg.fill("[data-crf='ac.t']", "Prova de certificação"); await pg.select_option("[data-crf='ac.obj']", o["id"]); await pg.fill("[data-crf='ac.custo']", "600"); await pg.fill("[data-crf='ac.prazo']", await pg.evaluate("addDays(TODAY, 150)"))
            await pg.check("[data-crf='ac.marco']"); await pg.wait_for_timeout(150); await pg.fill("[data-crf='ac.crit']", "Certificado emitido"); await pg.click("[data-act=cracsave]"); await pg.wait_for_timeout(150)
            ac = await pg.evaluate("S.carreira.acoes.at(-1)")
            chk(ac["obj"] == o["id"] and ac["marco"] and ac["custo"] == 600 and ac["crit"] == "Certificado emitido", "ação ligada ao objetivo, como marco, com custo e critério")
            await pg.click(f"[data-act=cractar][data-id='{ac['id']}']"); await pg.wait_for_timeout(150)
            await pg.click(f"[data-act=cracproj][data-id='{ac['id']}']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"S.tarefas.some(t => t.id === S.carreira.acoes.find(x => x.id === '{ac['id']}').tarefa && t.area === 'Carreira')") and await pg.evaluate(f"S.projetos.find(z => z.id === S.carreira.acoes.find(x => x.id === '{ac['id']}').proj)?.valor") == 600, "a ação vira tarefa e o custo vira projeto em Finanças")
            for _ in range(2): await pg.click(f"[data-act=cracst][data-id='{ac['id']}']"); await pg.wait_for_timeout(120)
            chk(await pg.evaluate(f"S.carreira.acoes.find(x => x.id === '{ac['id']}').st") == "feito" and await pg.evaluate(f"crObjProg(S.carreira.obj.find(x => x.id === '{o['id']}'))") == 1, "status aberta → andamento → feito, e o progresso do objetivo chega a 100%")
            # geotecnia progressiva
            await pg.evaluate("location.hash='carreira.geotecnia'"); await pg.wait_for_timeout(250)
            chk(await pg.locator(".crmod").count() == 0 and await pg.locator("[data-act=crgeo][data-v=explorando]").count() == 1, "geotecnia guardada: só o convite")
            await pg.click("[data-act=crgeo][data-v=explorando]"); await pg.wait_for_timeout(250)
            chk(await pg.locator(".crmod").count() == 1 and "Geotecnia" in await pg.evaluate("[...document.querySelectorAll('.subtabs a')].map(e => e.textContent).join(',')"), "explorando: aba aparece e mostra o primeiro módulo")
            await pg.fill("[data-crgeo=interesse]", "Subsolo das ferrovias"); await pg.press("[data-crgeo=interesse]", "Tab"); await pg.wait_for_timeout(120)
            await pg.click("[data-act=crgeo][data-v=ativa]"); await pg.wait_for_timeout(250)
            chk(await pg.locator(".crmod").count() == 5 and await pg.evaluate("S.carreira.geo.interesse") == "Subsolo das ferrovias" and await pg.evaluate("crCat().some(c => c.g === 'geo')"), "ativa: cinco módulos, interesse guardado e as competências de geotecnia entram na avaliação")
            await pg.click("[data-act=crgmod][data-id=fund][data-v=feito]"); await pg.wait_for_timeout(120)
            chk(await pg.evaluate("S.carreira.geo.mod.fund") == "feito", "módulo marcado como concluído")
            # biblioteca
            await pg.evaluate("location.hash='carreira.biblioteca'"); await pg.wait_for_timeout(250)
            n_all = await pg.locator(".crlib").count()
            await pg.click("[data-act=crlibtop][data-v=geo]"); await pg.wait_for_timeout(150)
            n_geo = await pg.locator(".crlib").count()
            chk(n_geo == await pg.evaluate("CR_LIB.filter(x => x.top === 'geo').length") and n_geo < n_all, f"filtro por tópico (geotecnia: {n_geo} de {n_all})")
            links = await pg.evaluate("[...document.querySelectorAll('.crlib h3 a')].map(a => [a.target, a.rel, a.href.startsWith('https://')])")
            chk(links and all(t == "_blank" and "noopener" in r and h for t, r, h in links), "links abrem em aba nova, com https e noopener")
            await pg.click("[data-act=crlibst][data-id=pinto][data-v=estudando]"); await pg.click("[data-act=crlibact][data-id=leapfrog]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.lib.st.pinto") == "estudando" and await pg.evaluate("S.carreira.acoes.some(a => a.lib === 'leapfrog')"), "marcar como estudando e levar um recurso ao plano")
            await pg.click("[data-act=crlibtop][data-v=todos]"); await pg.wait_for_timeout(100)
            await pg.fill("[data-crf='lib.t']", "Meu curso de Synchro"); await pg.fill("[data-crf='lib.url']", "javascript:alert(1)"); await pg.click("[data-act=crlibadd]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.carreira.lib.meus.at(-1).t") == "Meu curso de Synchro" and await pg.evaluate("S.carreira.lib.meus.at(-1).url") == "", "recurso próprio acrescentado; link que não é http(s) é descartado")
            # mentor e crescimento
            f = await pg.evaluate("mentorPrompt('car', false)")
            chk("Hub de carreira" in f and "No mapa de carreira" in f and "AutoCAD Civil 3D 3/5" in f and "Geotecnia: ativa" in f, "Mentor da Carreira lê o hub (mapa, níveis, trilhas, objetivos, geotecnia)")
            await pg.evaluate("location.hash='cresc.carreira'"); await pg.wait_for_timeout(250)
            chk(await pg.locator("a[href='#carreira']").count() >= 1, "Crescimento › Carreira aponta para o hub")
            await pg.evaluate("location.hash='carreira.panorama'"); await pg.wait_for_timeout(250)
            chk(await pg.locator("[data-vid=crradar] polygon").count() >= 6, "radar desenhado com os grupos")
            await pg.wait_for_timeout(2600)
            chk(len(await pg.evaluate("Object.keys(window.__store).filter(k => /s_carreira|s_comp/.test(k))")) == 2, "carreira e competências gravadas no banco")
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        for w, th, sd in ((390, "dark", True), (390, "light", False), (1024, "dark", False)):
            b, pg, errs = await open_page(p, w=w, theme=th, cfg={"seedStore": json.dumps(seed)} if sd else None)
            fails = []
            for h in ("carreira.panorama", "carreira.avaliacao", "carreira.objetivos", "carreira.geotecnia", "carreira.plano", "carreira.biblioteca"):
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(300)
                ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth, !!document.querySelector('.emptyb')]")
                if ov[0] > ov[1] or ov[2]: fails.append((h, ov))
            chk(not fails and not errs, f"{w}px {th} {'dados reais' if sd else 'exemplo'}: as 6 páginas sem rolagem lateral nem erro {fails[:2]} {errs[:1]}")
            await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
