"""Lazer: oito divisões, gostos, listas, café (proporção, perda e DTR conferidos à parte), voos, estudos e os mentores com nível."""
import asyncio, json, traceback
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
SUBS = ["inicio", "leitura", "filmes", "jogos", "viagens", "cafe", "aviacao", "estudos", "existencial"]
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps({"data/users/u_test/s_lazerHub": {"at": 1, "v": {"perfil": {"filmes": {"gosto": ["Faroeste"], "evito": ["Terror", "Suspense"]}}}}})}, hash_="lazer")
        try:
            await pg.wait_for_timeout(700)
            nav = await pg.evaluate("[...document.querySelectorAll('#nav .nv span')].map(e => e.textContent)")
            tabs = await pg.evaluate("[...document.querySelectorAll('.subtabs a')].map(e => e.getAttribute('href'))")
            chk("Lazer" in nav and tabs == [f"#lazer.{s}" for s in SUBS], "menu com Lazer e as 9 abas (início e 8 divisões)")
            chk(await pg.locator(".lzcard").count() == 8 and await pg.locator(".jmgrid .jmc").count() == 8, "início: 8 divisões e os 7 mentores mais o atalho dos mentores da Jornada")
            for s in SUBS[1:8]:
                await pg.evaluate(f"location.hash='lazer.{s}'"); await pg.wait_for_timeout(250)
                mid = await pg.get_attribute(".jment", "data-mid")
                if mid != await pg.evaluate(f"lzDiv('{s}').mid") or await pg.locator(".lzhero").count() != 1 or await pg.locator(".jment .qchip").count() != 3: chk(False, f"página {s} incompleta ({mid})"); break
            else: chk(True, "cada divisão tem o seu mentor, o cabeçalho com nível e três perguntas rápidas")
            # gosto e evito vão para o mentor
            await pg.evaluate("location.hash='lazer.filmes'"); await pg.wait_for_timeout(250)
            await pg.fill("#lzg_filmes", "Ficção científica de qualidade"); await pg.click("[data-act=lzpadd][data-d=filmes][data-k=gosto]"); await pg.wait_for_timeout(150)
            pr = await pg.evaluate("lzPrompt('lzfil', false)")
            chk("Ficção científica de qualidade" in pr and "Evita: Terror, Suspense" in pr and "O Curador" in pr, "o Curador recebe os gostos e o que a pessoa evita")
            await pg.click("[data-act=lzniv][data-d=filmes][data-v='3']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("lzData().nivel.filmes") == 3 and 'nível "avançado"' in await pg.evaluate("lzPrompt('lzfil', false)"), "nível da conversa escolhido e enviado ao mentor")
            await pg.click(".lzadd summary"); await pg.fill("[data-lzf='filmes.t']", "Blade Runner"); await pg.fill("[data-lzf='filmes.ano']", "1982"); await pg.click("[data-act=lzadd][data-d=filmes]"); await pg.wait_for_timeout(150)
            fid = await pg.evaluate("lzData().filmes.at(-1).id")
            await pg.click(f"[data-act=lznota][data-id='{fid}'][data-v='5']"); await pg.click(f"[data-act=lzst][data-id='{fid}'][data-v=visto]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("lzData().filmes.at(-1)") | {} and await pg.evaluate("[lzData().filmes.at(-1).nota, lzData().filmes.at(-1).status]") == [5, "visto"], "filme acrescentado, com nota 5 e marcado como visto")
            # leitura em S.aprend
            await pg.evaluate("location.hash='lazer.leitura'"); await pg.wait_for_timeout(250)
            l0 = await pg.evaluate("calcAt(mkey(TODAY)).livros")
            await pg.click(".lzadd summary"); await pg.fill("[data-lzf='leitura.t']", "O Físico"); await pg.fill("[data-lzf='leitura.autor']", "Noah Gordon"); await pg.click("[data-act=lzadd][data-d=leitura]"); await pg.wait_for_timeout(150)
            bk = await pg.evaluate("S.aprend.find(a => a.titulo === 'O Físico')")
            await pg.click(f"[data-act=lzst][data-id='{bk['id']}'][data-v='Concluído']"); await pg.wait_for_timeout(150)
            chk(bk["tipo"] == "Livro" and await pg.evaluate("S.aprend.find(a => a.titulo === 'O Físico').fim") == await pg.evaluate("TODAY") and await pg.evaluate("VER++, calcAt(mkey(TODAY)).livros") == l0 + 1, "livro guardado em Aprendizado; marcar como lido conta nos livros do ano")
            # viagens e custo
            await pg.evaluate("location.hash='lazer.viagens'"); await pg.wait_for_timeout(250)
            await pg.click(".lzadd summary"); await pg.fill("[data-lzf='viagens.t']", "Langhe"); await pg.fill("[data-lzf='viagens.ini']", await pg.evaluate("addDays(TODAY, 20)")); await pg.fill("[data-lzf='viagens.orc']", "300"); await pg.click("[data-act=lzadd][data-d=viagens]"); await pg.wait_for_timeout(150)
            vid = await pg.evaluate("lzData().viagens.at(-1).id")
            await pg.click(f"[data-act=lzproj][data-id='{vid}']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"(() => {{ const v = lzData().viagens.find(x => x.id === '{vid}'); const pj = S.projetos.find(z => z.id === v.proj); return pj && pj.valor === 300 && pj.cat === 'Viagem' && pj.prazo === v.ini; }})()"), "viagem com orçamento vira projeto em Finanças, com prazo na data de ida")
            # café: contas conferidas à parte
            await pg.evaluate("location.hash='lazer.cafe'"); await pg.wait_for_timeout(250)
            await pg.fill("[data-lzf='c.cafe']", "Etiópia"); await pg.fill("[data-lzf='c.dose']", "18"); await pg.fill("[data-lzf='c.agua']", "40"); await pg.fill("[data-lzf='c.tempo']", "29")
            live = await pg.locator(".pn:has([data-act=lzcafe][data-t=extracao]) .row .muted.small").inner_text()
            await pg.click("[data-act=lzcafe][data-t=extracao]"); await pg.wait_for_timeout(150)
            e = await pg.evaluate("lzData().cafe.log.at(-1)"); r = await pg.evaluate("lzCafeCalc(lzData().cafe.log.at(-1)).ratio")
            chk(abs(r - 40 / 18) < 1e-9 and "1:2,2" in live and e["metodo"] == "Espresso", f"extração: proporção = bebida ÷ dose (1:{40/18:.2f}), mostrada enquanto digita")
            await pg.fill("[data-lzf='c.tcafe']", "Brasil"); await pg.fill("[data-lzf='c.verde']", "250"); await pg.fill("[data-lzf='c.torrado']", "212"); await pg.fill("[data-lzf='c.total']", "10:30"); await pg.fill("[data-lzf='c.fc']", "8:45")
            await pg.click("[data-act=lzcafe][data-t=torra]"); await pg.wait_for_timeout(150)
            c = await pg.evaluate("lzCafeCalc(lzData().cafe.log.at(-1))")
            chk(abs(c["perda"] - (250 - 212) / 250) < 1e-9 and abs(c["dtr"] - (630 - 525) / 630) < 1e-9 and c["dev"] == 105, f"torra: perda {(250-212)/250:.1%} e DTR {(630-525)/630:.1%} = recálculo independente")
            chk("1:2,2" in await pg.locator(".dt").inner_text(), "diário do café mostra as medidas calculadas")
            await pg.fill("[data-lzf='t.cafe.h']", "0.5"); await pg.fill("[data-lzf='t.cafe.o']", "cupping"); await pg.click("[data-act=lztempo][data-d=cafe]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.lazer.at(-1).lz") == "cafe" and await pg.evaluate("lzMin('cafe')") == 0.5, "tempo registrado entra no Lazer do Atlas, marcado com a divisão")
            # mentor com ferramentas
            await pg.fill("#m_in", "Meu espresso está amargo"); await pg.click(".jment [data-act=msend]"); await pg.wait_for_timeout(2500)
            call = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').at(-1)")
            prompt = call["input"][0]["content"] if isinstance(call["input"], list) else call["input"]
            chk("Mestre de Torra" in prompt and "1:2,2" in prompt and "recomendar" in call["tools"] and "ajustar_nivel" in call["tools"], f"Mestre de Torra lê os registros e tem as ferramentas do Lazer ({call['tools']})")
            chk(len(await pg.evaluate("mget('lzcaf').conversa")) >= 2, "conversa guardada no mentor do café")
            rr = await pg.evaluate("(() => { const live = { uso: [], acoes: [], ctx: null }; const T = mentorTools('lzcaf', live); const a = T.find(t => t.name === 'recomendar').execute({ titulo: 'Quênia lavado', detalhe: 'V60 1:16', porque: 'acidez de frutas vermelhas' }); const b = T.find(t => t.name === 'ajustar_nivel').execute({ nivel: 3, motivo: 'domina proporção e moagem' }); return [a, b]; })()")
            chk(rr[0]["ok"] and await pg.evaluate("lzData().sug.cafe.some(x => x.titulo === 'Quênia lavado')") and await pg.evaluate("lzData().nivel.cafe") == 3 and await pg.evaluate("mget('lzcaf').mem.some(m => m.tipo === 'progresso')"), "recomendar cria sugestão; ajustar_nivel sobe o nível e guarda o motivo na memória")
            await pg.evaluate("render()"); sid = await pg.evaluate("lzData().sug.cafe.find(x => x.titulo === 'Quênia lavado').id")
            await pg.click(f"[data-act=lzsugok][data-id='{sid}']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("lzData().cafe.provar.some(x => x.t === 'Quênia lavado')") and not await pg.evaluate("(lzData().sug.cafe || []).length"), "sugestão de café vai para a lista Para provar")
            await pg.evaluate("""(() => { MST.live = { mid: 'lzjog', text: '', uso: [], acoes: [], user: { role: 'user', content: 'x', at: Date.now() } }; finishMentor('Boa!\\n```atlas\\n{"sugestoes":[{"titulo":"Factorio","detalhe":"PC","porque":"logística"}],"nivel":{"nivel":2,"motivo":"já conhece redstone"}}\\n```', false); })()""")
            chk(await pg.evaluate("lzData().sug.jogos.some(x => x.titulo === 'Factorio') && lzData().nivel.jogos === 2"), "sem ferramentas, o bloco atlas também sugere e ajusta o nível")
            # aviação e estudos
            await pg.evaluate("location.hash='lazer.aviacao'"); await pg.wait_for_timeout(250)
            await pg.fill("[data-lzf='v.aeronave']", "A320"); await pg.fill("[data-lzf='v.de']", "limf"); await pg.fill("[data-lzf='v.para']", "lirf"); await pg.fill("[data-lzf='v.dur']", "75"); await pg.click("[data-act=lzvoo]"); await pg.wait_for_timeout(150)
            v = await pg.evaluate("lzData().voos.at(-1)")
            chk(v["de"] == "LIMF" and v["para"] == "LIRF" and v["dur"] == 75 and "LIMF → LIRF" in await pg.locator(".dt").inner_text(), "voo no diário de bordo, com ICAO em maiúsculas")
            await pg.evaluate("location.hash='lazer.estudos'"); await pg.wait_for_timeout(250)
            await pg.click(".lzadd summary"); await pg.fill("[data-lzf='estudos.t']", "Relatividade geral"); await pg.click("[data-act=lzadd][data-d=estudos]"); await pg.wait_for_timeout(150)
            tid = await pg.evaluate("lzData().temas.at(-1).id")
            await pg.click(f"[data-act=lzest1][data-id='{tid}']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.estudo.at(-1).item") == "Relatividade geral" and await pg.evaluate("lzData().temas.at(-1).status") == "estudando", "1 h de estudo entra nas sessões de estudo do Atlas e o tema passa a estudando")
            await pg.fill("#lzpq", "O que há dentro de um buraco negro?"); await pg.click("[data-act=lzpadd2]"); await pg.wait_for_timeout(150)
            await pg.click("[data-act=lzpask]"); await pg.wait_for_timeout(150)
            chk(await pg.input_value("#m_in") == "O que há dentro de um buraco negro?" and "Separe com clareza o que é ciência estabelecida" in await pg.evaluate("lzPrompt('lzest', false)"), "pergunta guardada e levada ao Professor, que separa ciência estabelecida de hipótese")
            # existencial reaproveita a Jornada
            await pg.evaluate("location.hash='lazer.existencial'"); await pg.wait_for_timeout(250)
            await pg.click("[data-act=lzex][data-v=tao]"); await pg.wait_for_timeout(150)
            chk(await pg.get_attribute(".jment", "data-mid") == "tao" and await pg.locator(".lzex").count() == 4, "Existencial: escolher o pilar abre o mentor da Jornada (Sábio do Vale)")
            await pg.evaluate("location.hash='mentor.lzavi'"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("[PAGE, SUB]") == ["lazer", "aviacao"], "#mentor.lzavi leva à divisão Aviação")
            await pg.evaluate("location.hash='mentores'"); await pg.wait_for_timeout(250)
            chk(await pg.locator(".mgrid .mcard").count() == 12 and await pg.locator(".jmgrid").first.locator(".jmc").count() == 7, "Mentores: 12 de área na grade e os 7 do lazer numa seção própria")
            await pg.evaluate("S.priv.semIA = ['Lazer & criatividade']")
            chk(await pg.evaluate("blockedMentor('lzcaf') && !blockedMentor('lzest')"), "Lazer fora da IA bloqueia os mentores de lazer; o Professor depende de Aprendizado")
            await pg.evaluate("S.priv.semIA = []")
            await pg.wait_for_timeout(2600)
            chk(len(await pg.evaluate("Object.keys(window.__store).filter(k => /s_lazerHub|s_aprend|s_estudo/.test(k))")) == 3, "lazer, livros e estudo gravados no banco")
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        for w, th in ((390, "dark"), (390, "light"), (1024, "dark")):
            b, pg, errs = await open_page(p, w=w, theme=th)
            fails = []
            for s in SUBS:
                await pg.evaluate(f"location.hash='lazer.{s}'"); await pg.wait_for_timeout(300)
                ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth, !!document.querySelector('.emptyb')]")
                if ov[0] > ov[1] or ov[2]: fails.append((s, ov))
            chk(not fails and not errs, f"{w}px {th}: as 9 páginas do Lazer sem rolagem lateral nem erro {fails[:2]} {errs[:1]}")
            await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
