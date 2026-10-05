"""Saúde espiritual (jardim interior) e a Mandala e a Bússola vivas: árvores que crescem com a jornada, regar = reflexão, rio do exame,
folha que não guarda o texto, caminhos que se abrem, pedras lavradas pelo exame, tábuas das sessões, templo em ordem, noite com vagalumes,
camadas e explorador da mandala, respiração, camadas, agulha, sorteio e valores explorados da bússola, modo exemplo e celular."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
U = "data/users/u_test/"
async def sel(pg, k): await pg.evaluate(f"JD.sel = '{k}'; render()"); await pg.wait_for_timeout(120)
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=900, cfg={"seedStore": json.dumps({U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}})}, hash_="jornada.jardim")
        try:
            await pg.wait_for_timeout(500)
            chk(await pg.evaluate("[PAGE, SUB]") == ["jornada", "jardim"] and await pg.evaluate("!!document.querySelector('.jdsvg')"), "a subaba Saúde espiritual abre o jardim")
            chk(await pg.evaluate("J_ORDER.map(p => jdTree(p).s)") == [0, 0, 0, 0] and await pg.evaluate("document.querySelectorAll('.jd-tree').length") == 4, "começa com quatro sementes, uma por pilar")
            chk(await pg.evaluate("JD_CAM.filter(c => jdCamOpen(c.id)).length") == 1 and await pg.evaluate("document.querySelectorAll('.jd-fogg').length") == 4, "só a trilha do bosque está aberta; névoa sobre o resto")
            chk("O que o jardim pede hoje" in await pg.text_content(".jdaside"), "o portão explica e ordena o que fazer")
            # regar
            await pg.click(".jd-tree[data-k='arv:esp'] rect"); await pg.wait_for_timeout(150)
            chk("Oliveira" in await pg.inner_text(".jdaside") and "estações do caminho" in await pg.inner_text(".jdaside"), "tocar na árvore mostra de onde vem o crescimento")
            await pg.click("[data-act=jdrega]"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("jP('esp').refl.length") == 0, "regar sem escrever não guarda nada")
            await pg.fill("[data-jdt='rega:esp']", "Hoje perdoei sem esforço."); await pg.click("[data-act=jdrega]"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("jP('esp').refl.at(-1)")
            chk(r["texto"] == "Hoje perdoei sem esforço." and r["origem"] == "jardim" and r["data"] == await pg.evaluate("TODAY"), "regar guarda uma reflexão no pilar")
            chk(await pg.evaluate("!!document.querySelector('.jd-drops')") and await pg.evaluate("jdTree('esp').dias") == 1, "gotas caem e a árvore conta o dia")
            await pg.evaluate("jP('esp').est = { principios: { v: 3, at: Date.now() }, estudo: { v: 2, at: Date.now() } }; touch('jornada')"); await pg.wait_for_timeout(150)
            t = await pg.evaluate("jdTree('esp')")
            chk(t["g"] == 11 and t["s"] == 2 and t["nome"] == "muda", f"5 níveis de estação × 2 + 1 reflexão = 11 pontos: muda ({t['g']}, {t['nome']})")
            # caminho da margem
            chk(await pg.evaluate("!!document.querySelector('.jd-cam.jd-ready')"), "com uma reflexão, a descida à margem fica pronta (brilha)")
            await sel(pg, "rio"); chk("Descida à margem" in await pg.inner_text(".jdaside"), "o rio fechado diz qual caminho abrir")
            await pg.click("[data-act=jdcam][data-id=margem]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("jdData().cam.margem") == await pg.evaluate("TODAY") and "Soltar uma folha" in await pg.text_content(".jdaside"), "abrir o caminho leva ao rio")
            # folha
            await pg.fill("#jd_folha", "SEGREDO-QUE-NAO-FICA"); await pg.click("[data-act=jdfolha]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("!!document.querySelector('.jd-leaf')"), "a folha desce o rio")
            await pg.wait_for_timeout(1200)
            st = await pg.evaluate("JSON.stringify(window.__store) + JSON.stringify(S)")
            chk(await pg.evaluate("jdData().folhas.length") == 1 and "SEGREDO-QUE-NAO-FICA" not in st, "só a data da folha é guardada; o texto não fica em lugar nenhum")
            # exames: rio, vagalumes, chama, ponte
            await pg.evaluate("[0, 1, 3].forEach(k => S.bmExames[addDays(TODAY, -k)] = { n: { paciencia: 2 }, at: Date.now() }); touch('bmExames')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("jdRio()") == {"n": 3, "f": 3 / 14, "st": "fio d'água"}, "o rio corre com as noites de exame (3 de 14)")
            await pg.evaluate("JD.h = 22; render()"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("document.querySelectorAll('.jd-fly').length") == 3 and await pg.evaluate("!!document.querySelector('.jd-nightveil')") and await pg.evaluate("!!document.querySelector('.jd-moon')"), "à noite: lua de hoje e um vagalume por exame da semana")
            await pg.evaluate("JD.h = 10; render()"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("document.querySelectorAll('.jd-bfly').length") == 3 and not await pg.evaluate("!!document.querySelector('.jd-fly')"), "de dia viram borboletas")
            await sel(pg, "pedreira"); chk("Ponte da pedreira" in await pg.inner_text(".jdaside"), "pedreira fechada até 3 noites de exame")
            await pg.click("[data-act=jdcam][data-id=ponte]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("jdCamOpen('ponte')") and await pg.evaluate("!!document.querySelector('.jd-bridge')"), "a ponte aparece sobre o rio")
            # pedra
            await pg.click("[data-act=jdpedra]"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("jdData().pedras.length") == 0, "sem nome não há pedra")
            await pg.fill("[data-jdt=pnome]", "impaciência"); await pg.select_option("[data-jdt=pval]", "paciencia"); await pg.click("[data-act=jdpedra]"); await pg.wait_for_timeout(200)
            pd = await pg.evaluate("jdData().pedras[0]")
            chk(pd["nome"] == "Impaciência" and pd["val"] == "paciencia" and await pg.evaluate("JD.sel") == "ped:" + pd["id"], "extrair cria a pedra bruta com o antídoto")
            chk(await pg.evaluate("jdMarks(jdData().pedras[0]).length") == 1, "o exame de hoje (paciência praticada) já conta um golpe")
            await pg.fill(f"[data-jdt='marca:{pd['id']}']", "Respirei antes de responder."); await pg.click("[data-act=jdmarca]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("jdMarks(jdData().pedras[0]).length") == 1 and await pg.evaluate("jdData().pedras[0].marcas.length") == 1, "o golpe manual do mesmo dia não conta em dobro")
            await pg.evaluate("jdData().pedras[0].criada = addDays(TODAY, -5); touch('jardim')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("jdMarks(jdData().pedras[0]).map(m => m.ex)") == [True, True, False], "exames desde a extração viram golpes (2 do exame + 1 seu)")
            await sel(pg, "ped:" + pd["id"])
            await pg.click("[data-act=jdlavra]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("jdData().pedras[0].lav") == await pg.evaluate("TODAY") and await pg.evaluate("jdStock().pedras") == 1, "três golpes: a pedra é lavrada e vai para o estoque")
            # templo
            await pg.click("[data-act=jdcam][data-id=escada]") if await pg.evaluate("!!document.querySelector('[data-act=jdcam][data-id=escada]')") else await sel(pg, "cam:escada")
            await pg.wait_for_timeout(100)
            if not await pg.evaluate("jdCamOpen('escada')"): await pg.click("[data-act=jdcam][data-id=escada]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("jdCamOpen('escada')"), "uma pedra lavrada abre a escadaria do templo")
            await sel(pg, "templo")
            chk("2 pedras lavradas a mais" in await pg.inner_text(".jdparts"), "o alicerce diz exatamente o que falta")
            await pg.evaluate("['Pressa', 'Orgulho'].forEach(n => jdData().pedras.push({ id: uid(), nome: n, val: '', criada: TODAY, marcas: [], lav: TODAY })); touch('jardim')"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=jdbuild][data-id=alicerce]"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("jdData().templo.alicerce") == await pg.evaluate("TODAY") and await pg.evaluate("jdStock().pedras") == 0, "construir o alicerce gasta 3 pedras")
            chk(await pg.evaluate("document.querySelector('.jd-templo .jd-t-on') !== null"), "a parte construída aparece no desenho")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(200)
            chk(not await pg.evaluate("jdData().templo.alicerce"), "desfazer desmonta")
            await pg.click("[data-act=redo]"); await pg.wait_for_timeout(200)
            chk(bool(await pg.evaluate("jdData().templo.alicerce")), "refazer monta de novo")
            fl = await pg.evaluate("jdCan(JD_TEMPLO.find(t => t.id === 'col_tao')).falta.join('; ')")
            chk("antes: piso e altar" in fl and "ao menos em muda" in fl, f"a coluna do Taoísmo pede o piso e o Pinheiro em muda ({fl})")
            # oficina
            await sel(pg, "oficina")
            chk(await pg.evaluate("document.querySelector('[data-act=jdtalho]').disabled"), "sem sessões não há toras")
            await pg.evaluate("for (let i = 0; i < 3; i++) jData().sess.push({ id: uid(), at: Date.now(), data: addDays(TODAY, -i), pid: 'med', tec: 'Mettā', min: 10 }); touch('jornada')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("jdStock().toras") == 3 and await pg.evaluate("jdLotus()") == 3, "cada sessão é uma tora; três dias de meditação abrem três lótus")
            await pg.select_option("[data-jdt=tpid]", "tao"); await pg.fill("[data-jdt=talho]", "Estou aprendendo a esperar."); await pg.click("[data-act=jdtalho]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[jdStock().toras, jdStock().tabuas, jP('tao').refl.at(-1).tipo]") == [0, 1, "aprendizado"], "talhar gasta 3 toras, rende uma tábua e um aprendizado no Taoísmo")
            await pg.evaluate("JD.h = 12; render()"); await pg.wait_for_timeout(100)
            # piso e chama
            await pg.evaluate("['A', 'B'].forEach(n => jdData().pedras.push({ id: uid(), nome: n, val: '', criada: TODAY, marcas: [], lav: TODAY })); touch('jardim')"); await pg.wait_for_timeout(100)
            await sel(pg, "templo"); await pg.click("[data-act=jdbuild][data-id=piso]"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("!!document.querySelector('.jd-flame')") and "acesa" in await pg.inner_text(".jdaside"), "com o piso, a chama do altar acende (há exame hoje)")
            await pg.evaluate("delete S.bmExames[TODAY]; delete S.bmExames[addDays(TODAY, -1)]; touch('bmExames')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("!!document.querySelector('.jd-ember')"), "sem exame ontem nem hoje, a chama apaga")
            # mirante
            await sel(pg, "mirante"); chk("as quatro árvores" in await pg.inner_text(".jdaside"), "mirante pede as quatro árvores em broto")
            await pg.evaluate("['med', 'tao', 'bud'].forEach(p => { for (let i = 0; i < 3; i++) jP(p).cot.push({ id: uid(), data: TODAY, at: Date.now(), texto: 'x' }); }); touch('jornada')"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=jdcam][data-id=mirante]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("!!document.querySelector('.jdaside .jmandala.mini')"), "do mirante se vê a mandala")
            chk(await pg.evaluate("document.querySelectorAll('.jdjour li').length") >= 6, "o diário do jardim registra os marcos")
            await pg.wait_for_timeout(900)
            chk(len(await pg.evaluate(f"window.__store['{U}s_jardim'].v.pedras")) == 5, "o jardim vai para o banco")
            # mandala
            await pg.evaluate("location.hash = 'jornada.inicio'"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("document.querySelectorAll('.jm-p').length") == 20 and await pg.evaluate("document.querySelector('.jmandala').classList.contains('anim')"), "mandala: 20 pétalas que crescem ao entrar")
            await pg.click(".jm-p[data-k='esp|fe']"); await pg.wait_for_timeout(200)
            chk("Fé raciocinada" in await pg.inner_text(".jmx") and not await pg.evaluate("document.querySelector('.jmandala').classList.contains('anim')"), "tocar numa pétala abre a estação (sem repetir a animação)")
            await pg.click(".jmx [data-act=jest][data-v='2']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[jEstV('esp', 'fe'), jP('esp').estHist.at(-1).para]") == [2, 2], "dá para mudar o nível dali mesmo, com histórico")
            await pg.click("[data-act=jmlay][data-v=ritmo]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelector('.jmandala').classList.contains('lay-ritmo')") and "semana de" in await pg.evaluate("document.querySelector('.jm-p').dataset.tip"), "camada Ritmo: cada pétala é uma semana")
            await pg.evaluate("jP('med').estHist.push({ data: addDays(TODAY, -100), sid: 'chegar', de: 0, para: 1 }, { data: addDays(TODAY, -20), sid: 'chegar', de: 1, para: 3 }); jP('med').est.chegar = { v: 3, at: Date.now() }");
            chk(await pg.evaluate("[jEstAt('med', 'chegar', addDays(TODAY, -150)), jEstAt('med', 'chegar', addDays(TODAY, -60)), jEstAt('med', 'chegar', TODAY)]") == [0, 1, 3], "o nível de uma estação numa data passada vem do histórico")
            await pg.click("[data-act=jmlay][data-v=hist]"); await pg.wait_for_timeout(200)
            await pg.fill("#jm_back", "10"); await pg.dispatch_event("#jm_back", "input"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("J.mback") == 2 and "há 2 meses" in await pg.inner_text("#jm_backl"), "o controle de tempo volta 2 meses")
            await pg.click("[data-act=jmplay]"); await pg.wait_for_timeout(700)
            chk(await pg.evaluate("J.mback") < 12, "Ver florescer anima do passado para hoje")
            await pg.click("[data-act=jmlay][data-v=est]"); await pg.click(".jm-c"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=jmbreath]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelector('.jmandala').classList.contains('breath')") and await pg.evaluate("!!document.querySelector('.jm-in')"), "respirar: a mandala pulsa com inspire/expire")
            await pg.evaluate("J.breath = false; J.breathDone = true; render()"); await pg.wait_for_timeout(150)
            n0 = await pg.evaluate("jData().sess.length"); await pg.click("[data-act=jmsess]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"jData().sess.length - {n0}") == 1 and await pg.evaluate("jData().sess.at(-1).min") == 1, "o minuto de respiração vira sessão de meditação")
            # bússola
            await pg.evaluate("location.hash = 'jornada.bussola'"); await pg.wait_for_timeout(400)
            chk("0 de 17" in await pg.inner_text(".bmctl") and await pg.evaluate("document.querySelectorAll('.bmc-new').length") == 16 and await pg.evaluate("document.querySelector('g[data-bmv=consciencia]').classList.contains('novo')"), "bússola: os 17 valores começam como não explorados")
            await pg.click("g[data-bmv=paciencia] circle >> nth=0"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("bmVistos().paciencia") == await pg.evaluate("TODAY") and "1 de 17" in await pg.inner_text(".bmctl"), "explorar um valor fica registrado")
            ng = await pg.evaluate("(e => [e.style.transform, e.dataset.to])(document.querySelector('.bmc-ng'))")
            chk(abs(float(ng[0][7:-4]) - float(ng[1])) < .01, f"a agulha gira até o valor escolhido {ng}")
            await pg.click("[data-act=bmlay][data-v=tecido]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelectorAll('.bmc-web').length") > 15 and await pg.evaluate("document.querySelectorAll('.bmc-web.hot').length") >= 3, "camada Tecido: as ligações, com as do valor escolhido em destaque")
            await pg.click("[data-act=bmlay][data-v=equilibrio]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelectorAll('.bmc-wedge0').length") == 4, "camada Equilíbrio: um setor por rumo")
            s0 = await pg.evaluate("BM.sel"); await pg.click("[data-act=bmspin]"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("document.querySelector('.bmc-ng').classList.contains('spin')"), "sortear gira a agulha")
            await pg.wait_for_timeout(1900)
            s1 = await pg.evaluate("BM.sel")
            chk(s1 != s0 and await pg.evaluate(f"!!bmVistos()['{s1}']"), f"o sorteio escolhe outro valor e o marca como explorado ({s0} → {s1})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"bússola sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # modo exemplo e celular
        for w in (1440, 390):
            b, pg, errs = await open_page(p, w=w, hash_="jornada.jardim")
            try:
                await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(600)
                if w == 1440:
                    chk(await pg.evaluate("[JD_CAM.filter(c => jdCamOpen(c.id)).length, JD_TEMPLO.filter(t => jdData().templo[t.id]).length]") == [5, 4], "exemplo: caminhos abertos e metade do templo")
                    chk(await pg.evaluate("document.querySelectorAll('.jd-raw').length") == 2 and await pg.evaluate("document.querySelectorAll('.jdasks li').length") == 3, "exemplo: duas pedras brutas e três pedidos do jardim")
                    for k in ["arv:bud", "rio", "lago", "pedreira", "oficina", "templo", "praca", "mirante", "cam:ponte"]:
                        await sel(pg, k)
                    chk(not errs, "todas as partes abrem sem erro")
                else:
                    ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px: sem rolagem lateral da página {ov}")
                    chk(await pg.evaluate("(s => s.scrollWidth > s.clientWidth && s.scrollLeft > 0)(document.querySelector('.jdscene'))"), "390 px: o jardim rola de lado por dentro, centrado")
                    l0 = await pg.evaluate("document.querySelector('.jdscene').scrollLeft")
                    await pg.click(".jdplaces [data-k='arv:esp']"); await pg.wait_for_timeout(300)
                    chk(await pg.evaluate("document.querySelector('.jdscene').scrollLeft") < l0, "390 px: escolher a Oliveira leva a vista até ela")
                    await pg.click(".jdplaces [data-k=templo]"); await pg.wait_for_timeout(300)
                    chk("O templo" in await pg.inner_text(".jdaside"), "390 px: os lugares em botões abrem o painel")
            finally:
                for e in errs: print("  ", e)
                if errs: bad += 1
                await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
