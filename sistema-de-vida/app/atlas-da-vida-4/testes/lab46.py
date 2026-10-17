"""Atlas 4 · IA de acompanhamento da atividade. Dados de exemplo (fictícios).
Ativada na Inspiração, assume o perfil da atividade e fica num botão lateral em todas as abas. Confere: perfil e esforço no pedido
(Baixo/Médio/Alto/Máximo → modelTier), ferramentas (ler_dados, ver_aba, anotar_progresso), contexto guardado, tela compartilhada (o
texto da aba e os campos preenchidos vão junto; desligada, não vão), avaliar outra aba (abre a aba e manda o que está nela), imagem
anexada só onde a visualização aceita imagens, conversa guardada por atividade, desativar e reativar, janela ao lado da do
Secretário no computador e uma de cada vez no celular, e o modo exemplo."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

SAMP = "window.__calls.filter(c => c.kind === 'sample')"
ULT = f"(c => c && [c.tier, c.tools, c.imgs, c.input.map(t => t.content).join('\\n')])({SAMP}.at(-1))"

async def envia(pg, txt):
    await pg.fill("#co_in", txt); await pg.click("[data-act=cosend]"); await pg.wait_for_timeout(1500)
    return await pg.evaluate(ULT)

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=950, hash_="inspira", cfg={"sampleImages": True})
        try:
            await pg.wait_for_timeout(700)
            chk(await pg.evaluate("document.querySelector('#cofab').hidden"), "sem atividade ativa, nenhum botão lateral")
            await pg.click("[data-insa='cafe']"); await pg.wait_for_timeout(200)
            await pg.click("[data-act=coon]"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("[S.inspira.ativo, CO.open, !document.querySelector('#co').hidden, document.querySelector('#co .sect b')?.textContent]")
            chk(r == ["cafe", True, True, "Café de especialidade"], f"“Ativar acompanhamento” abre a janela com a atividade ({r})")
            chk("Acompanhamento ativo" in await pg.inner_text(".insdet"), "o botão da Inspiração mostra que está ativo")
            # pedido: perfil do mentor do café, esforço médio, ferramentas
            c = await envia(pg, "Minha V60 está amarga, o que mudo?")
            chk(c[0] == "default" and "lzcaf" not in c[3] and await pg.evaluate("MENTOR_DEF.lzcaf.nome") in c[3] and "NÍVEL DE ESFORÇO: Médio" in c[3], "o pedido usa o perfil do mentor do Café e o esforço Médio")
            chk(set(["ler_dados", "ver_aba", "anotar_progresso"]) <= set(c[1]), f"ferramentas: ler_dados, ver_aba e anotar_progresso ({c[1]})")
            chk("[O QUE ESTÁ NA TELA AGORA]" not in c[3], "tela desligada: a aba não vai junto")
            chk(await pg.evaluate("coSt('cafe').conversa.length") == 2, "a conversa fica guardada na atividade")
            # esforço
            for k, tier in (("baixo", "quick"), ("alto", "complex"), ("max", "complex")):
                await pg.select_option("#co_esf", k); await pg.wait_for_timeout(100)
                c = await envia(pg, f"teste de esforço {k}")
                chk(c[0] == tier and f"NÍVEL DE ESFORÇO: {await pg.evaluate(f'CO_ESF.{k}.nome')}" in c[3], f"esforço {k} → modelTier {tier}")
            await pg.select_option("#co_esf", "medio")
            # contexto guardado
            await pg.evaluate("document.querySelector('#co .coxtra').open = true")
            await pg.fill("#co_ctx", "Uso V60 02, moedor Comandante, café etíope lavado (fictício)."); await pg.locator("#co_ctx").dispatch_event("change"); await pg.wait_for_timeout(150)
            c = await envia(pg, "E agora?")
            chk("café etíope lavado" in c[3] and "O QUE A PESSOA COMPARTILHOU" in c[3], "o contexto compartilhado vai em todos os pedidos")
            # tela compartilhada
            await pg.evaluate("location.hash = 'saude.checkin'"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("!document.querySelector('#cofab').hidden || CO.open"), "o acompanhamento continua disponível em outra aba")
            await pg.evaluate("CO.open || coToggle(true)"); await pg.wait_for_timeout(150)
            await pg.fill("#ck_sono, input[data-sk=sono], #main input[type=number]", "7.5") if await pg.locator("#main input[type=number]").count() else None
            await pg.check("#co_tela"); await pg.wait_for_timeout(100)
            c = await envia(pg, "O que acha do meu dia?")
            chk("[O QUE ESTÁ NA TELA AGORA]" in c[3] and "ABA: Saúde" in c[3] and "Check-in" in c[3], "tela ligada: o texto da aba aberta vai junto")
            chk("CAMPOS PREENCHIDOS" in c[3], "e o que está escrito nos campos")
            chk(await pg.evaluate("coSt('cafe').conversa.at(-2).tela") is True and "com a tela" in await pg.inner_text("#cochat"), "a mensagem fica marcada “com a tela”")
            await pg.uncheck("#co_tela")
            # avaliar outra aba
            await pg.evaluate("document.querySelector('#co .coxtra').open = true")
            await pg.select_option("#co_aba", "fin"); await pg.click("[data-act=coaval]"); await pg.wait_for_timeout(2000)
            c = await pg.evaluate(ULT)
            chk(await pg.evaluate("PAGE") == "fin" and "Avalie o que estou fazendo na aba Finanças" in c[3] and "ABA: Finanças" in c[3], "avaliar uma aba: abre Finanças e manda o que está nela")
            # imagem: anexada vai junto da próxima mensagem
            await pg.evaluate("document.querySelector('#co .coxtra').open = true")
            await pg.set_input_files("#co_file", files=[{"name": "print.png", "mimeType": "image/png", "buffer": bytes.fromhex("89504e470d0a1a0a0000000d4948445200000001000000010806000000")}])
            await pg.wait_for_timeout(200)
            chk("imagem pronta" in await pg.inner_text("#co"), "imagem anexada fica pronta")
            c = await envia(pg, "Veja este print")
            chk(c[2] == 1 and "[IMAGEM ANEXADA" in c[3] and await pg.evaluate("CO.img") is None, "a imagem vai junto da próxima mensagem, uma vez")
            # anotar progresso
            await pg.evaluate("""(() => { const live = { a: coAtv(), uso: [], ctx: null }; return coTools(live).find(t => t.name === 'anotar_progresso').execute({ nota: 'Moagem 2 cliques mais grossa resolveu o amargor (teste)' }); })()""")
            await pg.evaluate("coPaint(); document.querySelector('#co .coxtra').open = true")
            chk("Moagem 2 cliques" in await pg.inner_text("#co"), "anotar_progresso guarda a nota e ela aparece em Progresso")
            c = await envia(pg, "Resumo do progresso?")
            chk("NOTAS DE PROGRESSO" in c[3] and "Moagem 2 cliques" in c[3], "as notas vão nos próximos pedidos")
            # ao lado do Secretário
            await pg.evaluate("secToggle(true)"); await pg.wait_for_timeout(150); await pg.evaluate("coPlace()")
            r = await pg.evaluate("(() => { const a = document.querySelector('#co').getBoundingClientRect(), b = document.querySelector('#sec').getBoundingClientRect(); return [a.right <= b.left + 1, a.left >= 0]; })()")
            chk(r == [True, True], f"no computador, a janela fica ao lado da do Secretário ({r})")
            # desativar e reativar
            await pg.click("[data-act=cooff]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[S.inspira.ativo, document.querySelector('#cofab').hidden, document.querySelector('#co').hidden]") == ["", True, True], "desativar some com o botão e a janela")
            await pg.evaluate("location.hash = 'inspira'"); await pg.wait_for_timeout(250)
            await pg.click("[data-insa='cafe']"); await pg.click("[data-act=coon]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("coSt('cafe').conversa.length") >= 12 and "Minha V60" in await pg.inner_text("#cochat"), "reativar traz a conversa de antes")
            # outra atividade, outro perfil e outra conversa
            await pg.click("[data-insa='engenharia']"); await pg.click("[data-act=coon]"); await pg.wait_for_timeout(300)
            c = await envia(pg, "Como estudo geotecnia?")
            chk("engenheiro geotécnico sênior" in c[3] and await pg.evaluate("coSt('engenharia').conversa.length") == 2, "outra atividade: outro perfil e outra conversa")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # sem imagens na visualização; celular: uma janela de cada vez
        b, pg, errs = await open_page(p, w=390, h=844, hash_="inspira")
        try:
            await pg.wait_for_timeout(600)
            await pg.evaluate("secToggle(true)"); await pg.wait_for_timeout(100)
            await pg.click("[data-insa='ingles']"); await pg.click("[data-act=coon]"); await pg.wait_for_timeout(400)
            await pg.evaluate("document.querySelector('#co .coxtra').open = true")
            t = await pg.inner_text("#co")
            chk("Imagens não estão disponíveis" in t and await pg.locator("#co_file").count() == 0, "sem imagens na visualização: avisa e esconde anexar/capturar")
            chk(await pg.evaluate("[SEC.open, CO.open]") == [False, True], "celular: abrir o acompanhamento fecha o Secretário")
            r = await pg.evaluate("(() => { const w = document.querySelector('#co').getBoundingClientRect(); return [Math.round(w.left), Math.round(w.right), innerWidth]; })()")
            chk(r[0] >= 0 and r[1] <= r[2], f"celular: a janela cabe na tela ({r})")
            await pg.click("[data-act=coclose]"); await pg.wait_for_timeout(150)
            r = await pg.evaluate("(() => { const f = document.querySelector('#cofab').getBoundingClientRect(), s = document.querySelector('#secfab').getBoundingClientRect(); return [!document.querySelector('#cofab').hidden, f.bottom <= s.top + 1]; })()")
            chk(r == [True, True], f"celular: o botão do acompanhamento fica acima do Secretário ({r})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
            # modo exemplo: o acompanhamento da pessoa some e volta
            await pg.evaluate("exOn()"); await pg.wait_for_timeout(500)
            a = await pg.evaluate("[EX_MODE, coAtivo(), document.querySelector('#cofab').hidden]")
            await pg.evaluate("exOff()"); await pg.wait_for_timeout(400)
            b2 = await pg.evaluate("[EX_MODE, coAtivo(), document.querySelector('#cofab').hidden]")
            chk(a == [True, "", True] and b2 == [False, "ingles", False], f"modo exemplo esconde o acompanhamento; desligar traz de volta ({a}, {b2})")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
