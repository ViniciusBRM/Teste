"""Jornada existencial: quatro pilares, mentores, confluências, círculo e a Bússola moral dentro da aba (com o Navegante)."""
import asyncio, json, traceback
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, hash_="jornada")
        try:
            await pg.wait_for_timeout(700)
            nav = await pg.evaluate("[...document.querySelectorAll('#nav .nv span')].map(e => e.textContent)")
            chk("Jornada existencial" in nav and "Bússola moral" not in nav, "menu: Jornada existencial entra, Bússola moral sai do Laboratório (mora dentro da jornada)")
            tabs = await pg.evaluate("[...document.querySelectorAll('.subtabs a')].map(e => e.textContent)")
            chk(tabs == ["Início", "Espiritismo", "Meditação", "Taoísmo", "Budismo", "Confluências", "Bússola moral"], f"abas da jornada: {tabs}")
            chk(await pg.locator(".jmandala .jm-p").count() == 20 and await pg.locator(".jmc").count() == 5, "início: mandala com 20 pétalas (5 estações × 4 pilares) e os 5 mentores")
            # mandala reflete a autoavaliação
            await pg.evaluate("S.jornada.p.tao.est.raiz = { v: 3, at: Date.now() }; render()")
            fo = await pg.evaluate("(() => { const g = [...document.querySelectorAll('.jm-p')].find(x => /Taoísmo: Retornar à raiz/.test(x.getAttribute('aria-label'))); return g.querySelector('path').style.fillOpacity; })()")
            chk(fo == "0.92", f"pétala de “Retornar à raiz” cheia quando a estação está florescendo (opacidade {fo})")
            # links antigos
            await pg.evaluate("location.hash='bussola.exame'"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[PAGE, SUB]") == ["jornada", "exame"] and await pg.locator(".subtabs a.on").inner_text() == "Bússola moral", "link antigo #bussola.exame abre o Exame dentro da Jornada, com a aba Bússola moral acesa")
            await pg.evaluate("location.hash='mentor.bud'"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[PAGE, SUB]") == ["jornada", "budismo"], "#mentor.bud leva à página do Budismo, onde mora o Kalyāṇamitta")
            # estações
            await pg.evaluate("location.hash='jornada.meditacao'"); await pg.wait_for_timeout(300)
            await pg.click("[data-act=jest][data-p=med][data-s=dia][data-v='2']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.jornada.p.med.est.dia.v") == 2 and await pg.locator(".jst.v2").count() >= 1, "estação marcada como “brotando” fica guardada com data")
            # reflexão com ponte e uma privada
            n0 = await pg.evaluate("S.jornada.p.med.refl.length")
            await pg.fill("[data-jr=med]", "Sentei vinte minutos e a ansiedade passou como nuvem. MARCA-PUBLICA")
            await pg.click("[data-act=jrtipo][data-p=med][data-v=insight]"); await pg.click("[data-act=jrtam][data-p=med][data-o=bud]"); await pg.click("[data-act=jrsave][data-p=med]"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("S.jornada.p.med.refl.at(-1)")
            chk(await pg.evaluate("S.jornada.p.med.refl.length") == n0 + 1 and r["tipo"] == "insight" and r["tambem"] == ["bud"] and not r["priv"], "reflexão guardada como insight, com ponte para o Budismo")
            await pg.fill("[data-jr=med]", "Algo muito pessoal MARCA-PRIVADA"); await pg.check("[data-act=jrpriv][data-p=med]"); await pg.click("[data-act=jrsave][data-p=med]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.jornada.p.med.refl.at(-1).priv") is True, "reflexão marcada como só minha")
            pr = await pg.evaluate("jPrompt('med', false)")
            chk("MARCA-PUBLICA" in pr and "MARCA-PRIVADA" not in pr and "só da pessoa" in pr, "o mentor lê a reflexão comum e não lê a privada (só sabe que existe)")
            pb = await pg.evaluate("jPrompt('bud', false)")
            chk("MARCA-PUBLICA" in pb and "MARCA-PRIVADA" not in pb, "a ponte leva a reflexão ao mentor do Budismo; a privada continua fora")
            br = await pg.evaluate("jBridges()")
            chk(br.get("bud|med", 0) >= 1, f"pontes: Meditação–Budismo conta a reflexão nova ({br.get('bud|med')})")
            # práticas: adotar da tradição, marcar hoje, lua
            d0 = await pg.evaluate("jActDays('med').size")
            await pg.click("details.jcat summary"); await pg.wait_for_timeout(100)
            await pg.click("[data-act=jadopt][data-p=med][data-k='2']"); await pg.wait_for_timeout(200)
            x = await pg.evaluate("S.jornada.p.med.prat.find(z => z.titulo === 'Meditação caminhando')")
            chk(x and x["status"] == "ativa" and x["fonte"] == "base", "prática da tradição adotada (Meditação caminhando)")
            await pg.click(f"[data-act=jmark][data-p=med][data-id='{x['id']}']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.jornada.p.med.prat.find(z => z.id === '{x['id']}').marcas.includes(TODAY)") and await pg.evaluate("jActDays('med').has(TODAY)"), "“Fiz hoje” marca a prática e o dia entra no ritmo do pilar")
            mo = await pg.evaluate("jMoonInfo('med')")
            chk(abs(mo["f"] - min(1, mo["n"] / 16)) < 1e-9 and mo["n"] >= d0, f"lua do pilar: fração = dias/16 ({mo['n']} dias → {mo['nome']})")
            # cotidiano
            await pg.fill("[data-jc=med]", "Respirei antes de responder ao chefe."); await pg.select_option("[data-jca=med]", "Carreira"); await pg.click("[data-act=jcsave][data-p=med]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.jornada.p.med.cot.at(-1).area") == "Carreira", "nota do cotidiano com área da vida")
            # mentor do pilar com ferramentas
            await pg.fill("#m_in", "Como aprofundar a prática?"); await pg.click(".jment [data-act=msend]"); await pg.wait_for_timeout(2500)
            call = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').at(-1)")
            prompt = call["input"][0]["content"] if isinstance(call["input"], list) else call["input"]
            chk("Guia da Atenção" in prompt and "PILAR: Meditação" in prompt and "recomendar" in call["tools"] and "consultar" not in call["tools"], f"Guia da Atenção recebe o pilar e as ferramentas da jornada ({call['tools']})")
            conv = await pg.evaluate("mget('med').conversa")
            chk(len(conv) >= 2 and conv[-1]["role"] == "assistant", "a conversa fica guardada no mentor do pilar")
            aud = await pg.evaluate("S.auditoria[0]?.recurso")
            chk(aud == "Guia da Atenção", f"a conversa aparece no registro de Privacidade ({aud})")
            # ferramenta recomendar
            rr = await pg.evaluate("(() => { const live = { uso: [], acoes: [], ctx: null }; const T = mentorTools('med', live); return T.find(t => t.name === 'recomendar').execute({ tipo: 'leitura', titulo: 'Livro de teste do mentor', descricao: 'Ler um capítulo por semana', porque: 'teste' }); })()")
            s = await pg.evaluate("S.jornada.p.med.prat.find(z => z.titulo === 'Livro de teste do mentor')")
            chk(rr["ok"] and s and s["status"] == "sugerida" and s["fonte"] == "mentor", "recomendar põe a sugestão do mentor na lista, para a pessoa adotar")
            await pg.evaluate("render()"); await pg.click(f"[data-act=jadopt][data-p=med][data-id='{s['id']}']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.jornada.p.med.prat.find(z => z.id === '{s['id']}').status") == "ativa", "sugestão do mentor adotada")
            # bloco atlas (sem ferramentas) também recomenda
            await pg.evaluate("""(() => { MST.live = { mid: 'tao', text: '', uso: [], acoes: [], user: { role: 'user', content: 'x', at: Date.now() } }; finishMentor('Siga a água.\\n```atlas\\n{"praticas":[{"tipo":"exercício","titulo":"Observar um rio","descricao":"Dez minutos"}]}\\n```', false); })()""")
            chk(await pg.evaluate("S.jornada.p.tao.prat.some(z => z.titulo === 'Observar um rio' && z.status === 'sugerida')"), "sem ferramentas, o bloco atlas também traz práticas recomendadas")
            # revisitar e captura rápida
            await pg.evaluate("location.hash='jornada.inicio'"); await pg.wait_for_timeout(300)
            await pg.fill("[data-jq]", "Reflexão rápida de teste"); await pg.click("[data-act=jqp][data-p=esp]"); await pg.click("[data-act=jqp][data-p=tao]"); await pg.click("[data-act=jqsave]"); await pg.wait_for_timeout(200)
            q = await pg.evaluate("S.jornada.p.esp.refl.at(-1)")
            chk(q["texto"] == "Reflexão rápida de teste" and q["tambem"] == ["tao"], "reflexão rápida do Início vai para o primeiro pilar escolhido, com ponte para os outros")
            if await pg.locator("[data-act=jrevsave]").count():
                orig = await pg.get_attribute("[data-act=jrevsave]", "data-id"); pid = await pg.get_attribute("[data-act=jrevsave]", "data-p")
                await pg.fill("#jrev", "Hoje vejo diferente."); await pg.click("[data-act=jrevsave]"); await pg.wait_for_timeout(200)
                chk(await pg.evaluate(f"S.jornada.p.{pid}.refl.at(-1).de") == orig, "revisitar: a nova reflexão fica ligada à antiga")
            else: chk(False, "cartão Para revisitar não apareceu com os dados de exemplo")
            # confluências e círculo
            await pg.evaluate("location.hash='jornada.confluencias'"); await pg.wait_for_timeout(300)
            v0 = await pg.evaluate("S.jornada.conf.vivos.length")
            await pg.click(".jconv [data-act=jviv][data-id=soltar]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.jornada.conf.vivos.includes('soltar')") and await pg.evaluate("S.jornada.conf.vivos.length") == v0 + 1, "tema “Soltar” marcado como vivo")
            await pg.fill("[data-jcircq]", "Como lidar com a ansiedade do futuro?")
            await pg.click("[data-act=jcq][data-m=bm]"); await pg.click("[data-act=jcgo]"); await pg.wait_for_timeout(2500)
            c = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').at(-1)")
            cp = c["input"] if isinstance(c["input"], str) else c["input"][0]["content"]
            chk("TAREFA: CÍRCULO DOS MENTORES" in cp and "## Kalyāṇamitta" in cp and "## O Navegante" in cp and "ansiedade do futuro" in cp and "MARCA-PRIVADA" not in cp, "círculo: os quatro mentores e o Navegante, com a pergunta e sem as reflexões privadas")
            ci = await pg.evaluate("S.jornada.conf.circulos.at(-1)")
            chk(ci["pergunta"] == "Como lidar com a ansiedade do futuro?" and "bm" in ci["quem"] and await pg.evaluate("mget('tao').mem.some(m => m.tipo === 'círculo')"), "círculo guardado no histórico e na memória de cada mentor")
            # bússola dentro da jornada + Navegante
            await pg.evaluate("location.hash='jornada.bussola'"); await pg.wait_for_timeout(300)
            chk(await pg.locator(".bmcomp").count() == 1 and await pg.locator(".jbmnav a").count() == 5, "Bússola moral completa dentro da jornada, com A bússola, Exame, Decidir, Caminhos e o Navegante")
            await pg.click("[data-act=bmnav]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[PAGE, SUB]") == ["jornada", "navegante"] and "Quero aprofundar o valor" in await pg.input_value("#m_in"), "“Conversar com o Navegante” leva o valor escolhido para a conversa")
            await pg.evaluate("S.bmExames[TODAY] = { n: { paciencia: 2 }, bem: 'TEXTO-DO-EXAME', at: Date.now() }")
            p1 = await pg.evaluate("jPrompt('bm', false)")
            chk("TEXTO-DO-EXAME" not in p1 and "NÃO foram enviados" in p1 and "Paciência" in p1, "sem permissão, o Navegante lê as notas e não lê os textos do exame")
            await pg.click("[data-act=bmnavle]"); await pg.wait_for_timeout(200)
            p2 = await pg.evaluate("jPrompt('bm', false)")
            chk(await pg.evaluate("S.bussola.navLe") is True and "TEXTO-DO-EXAME" in p2, "com a permissão ligada, os textos do exame vão junto")
            await pg.click(".jment [data-act=msend]"); await pg.wait_for_timeout(2500)
            chk(len(await pg.evaluate("mget('bm').conversa")) >= 2, "o Navegante responde e guarda a conversa")
            # mentores e hoje
            await pg.evaluate("location.hash='mentores'"); await pg.wait_for_timeout(300)
            chk(await pg.locator(".mgrid .mcard").count() == 12 and await pg.locator(".jmgrid .jmc").count() == 5, "Mentores: as 12 áreas na grade e os 5 da jornada numa seção própria")
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(300)
            t = await pg.locator("#main").inner_text()
            chk("Jornada de hoje" in t and await pg.locator(".jhmk [data-act=jmark]").count() >= 1, "Hoje mostra o ensinamento do dia e as práticas da jornada para marcar")
            # privacidade: setor fora da IA bloqueia os mentores da jornada
            await pg.evaluate("S.priv.semIA = ['Propósito & espiritualidade']; render()")
            chk(await pg.evaluate("blockedMentor('esp') && blockedMentor('bm') && !blockedMentor('fin')"), "com Propósito & espiritualidade fora da IA, os mentores da jornada ficam bloqueados")
            await pg.evaluate("S.priv.semIA = []")
            # gravação
            await pg.wait_for_timeout(2600)
            st = await pg.evaluate("Object.keys(window.__store).filter(k => /s_jornada/.test(k))")
            chk(len(st) >= 1, f"jornada gravada no banco ({st})")
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        for w, th in ((390, "dark"), (390, "light"), (1024, "dark")):
            b, pg, errs = await open_page(p, w=w, theme=th)
            fails = []
            for h in ("jornada.inicio", "jornada.espiritismo", "jornada.meditacao", "jornada.taoismo", "jornada.budismo", "jornada.confluencias", "jornada.bussola", "jornada.exame", "jornada.decidir", "jornada.caminhos", "jornada.navegante"):
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(300)
                ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth, !!document.querySelector('.emptyb')]")
                if ov[0] > ov[1] or ov[2]: fails.append((h, ov))
            chk(not fails and not errs, f"{w}px {th}: as 11 páginas da jornada sem rolagem lateral nem erro {fails[:2]} {errs[:1]}")
            await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
