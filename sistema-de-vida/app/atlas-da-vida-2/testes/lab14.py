"""Rotina: dia/semana/mês sincronizados, meias horas, criar tocando e arrastando, repetições, exceções, feito, agenda junto, Idiomas e Hoje."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
T = datetime.date.today(); TS = T.isoformat(); U = "data/users/u_test/"
D = lambda n: (T + datetime.timedelta(days=n)).isoformat()
MON = (T - datetime.timedelta(days=T.weekday())).isoformat()
SAT = (T - datetime.timedelta(days=T.weekday()) + datetime.timedelta(days=5)).isoformat()
SEED = {U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}, U + "s_eventos": {"at": 1, "v": [{"id": "e1", "data": TS, "hora": "09:00", "fim": "10:00", "titulo": "Reunião X"}, {"id": "e2", "data": TS, "titulo": "Feriado local"}]},
        U + "s_tarefas": {"at": 1, "v": [{"id": "t1", "tarefa": "Entregar relatório", "prazo": TS, "status": "A fazer"}]}}
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED)}, hash_="rotina")
        try:
            await pg.wait_for_timeout(400)
            chk(await pg.evaluate("[PAGE, rtView(), RT.d]") == ["rotina", "dia", TS], "abre no dia de hoje")
            chk(await pg.evaluate("document.querySelectorAll('.rtslot').length") == 36 and await pg.evaluate("document.querySelectorAll('.rtslot.half').length") == 18, "36 meias horas de 06:00 a 24:00, metade marcada como :30")
            chk(await pg.evaluate("[...document.querySelectorAll('.rttimes span')].slice(0,3).map(s => s.textContent)") == ["06:00", ":30", "07:00"], "rótulos: hora cheia e :30")
            chk("Reunião X" in await pg.inner_text(".rtmain") and "Feriado local" in await pg.inner_text(".rtallrow") and "Entregar relatório" in await pg.inner_text(".rtallrow"), "agenda com hora no grid; dia todo e tarefa com prazo na faixa de cima")
            # tocar numa meia hora: bloco de 30 min
            await pg.click(f"[data-rts='{TS}|840']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[document.querySelector('#rt_a').value, document.querySelector('#rt_z').value]") == ["14:00", "14:30"], "clicar às 14:00 propõe 14:00–14:30")
            await pg.fill("#rt_t", "Revisar desenho"); await pg.click("#rtf .btn.primary"); await pg.wait_for_timeout(250)
            bl = await pg.evaluate("S.rotina.at(-1)")
            chk([bl["titulo"], bl["data"], bl["ini"], bl["fim"], bl["rep"]] == ["Revisar desenho", TS, "14:00", "14:30", ""], f"bloco gravado: {bl['ini']}–{bl['fim']}")
            top = await pg.evaluate(f"parseFloat(document.querySelector('[data-rtb^=\"{bl['id']}\"]').style.top)")
            chk(top == (840 - 360) / 30 * 22, f"posição: (14:00 − 06:00) em meias horas × 22 px = {top}")
            # arrastar de 16:00 a 17:30
            await pg.locator(f"[data-rts='{TS}|1050']").scroll_into_view_if_needed(); await pg.wait_for_timeout(100)
            a = await pg.locator(f"[data-rts='{TS}|960']").bounding_box(); z = await pg.locator(f"[data-rts='{TS}|1050']").bounding_box()
            await pg.mouse.move(a["x"] + 20, a["y"] + 5); await pg.mouse.down(); await pg.mouse.move(z["x"] + 20, z["y"] + 10, steps=8)
            chk(await pg.evaluate("document.querySelectorAll('.rtslot.pick').length") == 4, "arrastar marca as 4 meias horas")
            await pg.mouse.up(); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[document.querySelector('#rt_a').value, document.querySelector('#rt_z').value]") == ["16:00", "18:00"], "arrastar de 16:00 até a meia hora das 17:30 propõe 16:00–18:00")
            await pg.select_option("#rt_z", "15:30"); await pg.wait_for_timeout(100)
            chk("depois do começo" in await pg.inner_text("#rt_msg"), "fim antes do começo é recusado")
            await pg.select_option("#rt_z", "17:00"); await pg.fill("#rt_t", "Inglês"); await pg.select_option("#rt_c", "Estudo"); await pg.select_option("#rt_r", "uteis"); await pg.click("#rtf .btn.primary"); await pg.wait_for_timeout(250)
            rid = await pg.evaluate("S.rotina.at(-1).id")
            occ = await pg.evaluate(f"[rtOcc('{MON}').length, rtOcc('{SAT}').length, rtOcc('{D(7)}').some(b => b.titulo === 'Inglês')]")
            chk(occ[1] == 0 or (SAT < TS), f"dias úteis: não aparece no sábado {occ}")
            chk(occ[2], "repete na semana seguinte")
            # sobreposição: dois blocos no mesmo horário ficam lado a lado
            await pg.evaluate(f"S.rotina.push({{id:'ov', data:'{TS}', ini:'16:00', fim:'16:30', titulo:'Ligação', cat:'Pessoas', rep:'', exc:[], feitos:{{}}}}); touch('rotina')"); await pg.wait_for_timeout(200)
            w = await pg.evaluate(f"[...document.querySelectorAll('.rtcol .rtb')].filter(e => /^(ov|{rid})\\|/.test(e.dataset.rtb)).map(e => e.style.width)")
            chk(len(w) == 2 and all("50%" in x for x in w), f"sobrepostos dividem a coluna: {w}")
            # editar ocorrência: feito e excluir só este dia
            await pg.click(f"[data-rtb='{rid}|{TS}']"); await pg.wait_for_timeout(200)
            await pg.check("#rt_done"); await pg.click("#rtf .btn.primary"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.rotina.find(x => x.id === '{rid}').feitos['{TS}']") == 1 and await pg.evaluate(f"document.querySelector('[data-rtb=\"{rid}|{TS}\"]').classList.contains('done')"), "feito marcado só neste dia")
            await pg.click(f"[data-rtb='{rid}|{TS}']"); await pg.wait_for_timeout(200); await pg.click("#rt_del"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"[rtOcc('{TS}').some(b => b.id === '{rid}'), rtOcc('{D(7)}').some(b => b.id === '{rid}')]") == [False, True], "excluir só este dia mantém a série")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"rtOcc('{TS}').some(b => b.id === '{rid}')"), "desfazer devolve o dia")
            # navegação sincronizada
            await pg.click("[data-rtnav='1']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("RT.d") == D(1) and await pg.evaluate(f"!!document.querySelector('[data-rts^=\"{D(1)}|\"]')"), "› vai para o dia seguinte e as horas mudam junto")
            await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("RT.d") == TS, "← volta um dia")
            await pg.click("[data-rtv='semana']"); await pg.wait_for_timeout(250)
            cols = await pg.evaluate("[...document.querySelectorAll('.rtcol')].map(c => c.dataset.rtday)")
            chk(await pg.evaluate("rtView()") == "semana" and cols == [(T - datetime.timedelta(days=T.weekday()) + datetime.timedelta(days=i)).isoformat() for i in range(7)], "semana: sete dias lado a lado, de segunda a domingo")
            chk("Semana" in await pg.inner_text(".rtper h2"), "o título diz qual semana")
            await pg.click("[data-rtnav='1']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("RT.d") == D(7), "› na semana avança 7 dias")
            await pg.click("[data-rtnav='0']"); await pg.wait_for_timeout(150)
            await pg.click(f".rthead [data-rtgo='dia|{D(2) if T.weekday() < 5 else D(-1)}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("rtView()") == "dia" and await pg.evaluate("RT.d") in (D(2), D(-1)), "clicar num dia da semana abre as horas daquele dia")
            await pg.keyboard.press("m"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("rtView()") == "mes" and await pg.evaluate("document.querySelectorAll('.rtmc').length") >= 35, "M abre o mês em grade")
            await pg.click("[data-rtnav='1']"); await pg.wait_for_timeout(150)
            nx = await pg.evaluate("RT.d")
            chk(nx[:7] == (T.replace(day=28) + datetime.timedelta(days=5)).isoformat()[:7], f"› no mês vai para o mês seguinte ({nx})")
            await pg.click("[data-rtnav='0']"); await pg.wait_for_timeout(150)
            await pg.click(f".rtmc[data-rtgo='dia|{TS}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("[rtView(), RT.d]") == ["dia", TS], "clicar num dia do mês abre o dia")
            wk = f"semana|{MON}"
            await pg.click(f".rtmini .rtwk[data-rtgo='{wk}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("rtView()") == "semana" and await pg.evaluate("RT.d") == wk.split("|")[1], "o número da semana no calendário pequeno abre a semana")
            await pg.click(f".rtmini [data-rtgo='dia|{TS}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("[rtView(), RT.d]") == ["dia", TS] and await pg.evaluate("document.querySelector('.rtmini .rtmd.sel')?.dataset.rtgo") == f"dia|{TS}", "calendário pequeno e grade ficam sincronizados")
            chk(await pg.evaluate("!!document.querySelector('.rtcol.today .rtnow') || new Date().getHours() < 6"), "linha do agora no dia de hoje")
            # integrações
            busy = await pg.evaluate(f"(() => {{ idi(); idi().janela = {{ ini: '16:00', fim: '18:00' }}; return idiPlano().find(p => p.d === '{TS}').busy; }})()")
            chk(busy == 30, f"Idiomas desconta os blocos da Rotina que não são estudo (Ligação 16:00–16:30): {busy} min")
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(400)
            chk("Revisar desenho" in await pg.inner_text(".p-hoje"), "Hoje mostra a rotina do dia")
            await pg.click(f"[data-rtdone='{bl['id']}']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.rotina.find(x => x.id === '{bl['id']}').feitos[TODAY]") == 1, "marcar no Hoje conta como feito na Rotina")
            await pg.wait_for_timeout(900)
            chk(len(await pg.evaluate(f"window.__store['{U}s_rotina'].v")) >= 3, "a rotina vai para o banco")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        for v in ("dia", "semana", "mes"):
            b, pg, errs = await open_page(p, w=390, hash_=f"rotina.{v}")
            try:
                ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px, {v}: sem rolagem lateral da página {ov}")
                if v == "dia":
                    await pg.click(f"[data-rts='{TS}|1260']"); await pg.wait_for_timeout(200)
                    chk(await pg.evaluate("document.querySelector('#rt_a')?.value") == "21:00", "no celular, tocar numa meia hora livre abre o bloco das 21:00")
            finally:
                for e in errs: print("  ", e)
                if errs: bad += 1
                await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
