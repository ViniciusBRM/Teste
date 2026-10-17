"""Atlas 4 · Lembretes das atividades semanais. Dados fictícios.
Regra por atividade da Rotina (nome do bloco, dias, minutos antes), criada no painel Lembretes ou no cartão do bloco. O Secretário avisa
na hora certa, uma vez por ocorrência, não avisa o que já foi marcado nem regra pausada, e não avisa no modo exemplo. No Google Agenda a
regra vira evento semanal com o mesmo aviso; a sincronização não traz esses eventos de volta; mudar a regra pede “Atualizar”; tirar apaga
pelos ids guardados ou, sem id na resposta, pela marca da regra."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

T = datetime.date.fromisoformat(TODAY_ISO); U = "data/users/u_test/"          # NOW: sexta-feira 09/10/2026, 10:00
seg = (T - datetime.timedelta(days=T.weekday())).isoformat()
ROT = [{"id": "ra1", "data": seg, "ini": "18:30", "fim": "19:30", "titulo": "Academia TESTE", "cat": "Saúde & treino", "rep": "semanal", "exc": [], "st": {}, "notas": ""},
       {"id": "ra2", "data": (T - datetime.timedelta(days=T.weekday() - 2)).isoformat(), "ini": "18:30", "fim": "19:30", "titulo": "Academia TESTE", "cat": "Saúde & treino", "rep": "semanal", "exc": [], "st": {}, "notas": ""},
       {"id": "ra3", "data": (T - datetime.timedelta(days=T.weekday() - 4)).isoformat(), "ini": "18:30", "fim": "19:30", "titulo": "Academia TESTE", "cat": "Saúde & treino", "rep": "semanal", "exc": [], "st": {}, "notas": ""},
       {"id": "ri1", "data": TODAY_ISO, "ini": "20:00", "fim": "21:00", "titulo": "Inglês TESTE", "cat": "Estudo", "rep": "", "exc": [], "st": {}, "notas": ""}]
SEED = {U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}, U + "s_rotina": {"at": 1, "v": ROT}, U + "s_integ": {"at": 1, "v": {"gcal": {"on": True, "last": 1}}}}
CALLS = "(t => window.__calls.filter(c => c.kind === 'mcp' && c.tool === t))"
SEMR = "secData().semanais.map(r => [r.titulo, r.dias, r.min, r.on !== false, !!r.gcal?.on, (r.gcal?.ids || []).length])"

async def tick(pg, quando):
    await pg.evaluate(f"__clock.set('{TODAY_ISO}T{quando}:00')"); await pg.evaluate("secTick()"); await pg.wait_for_timeout(150)
    return await pg.evaluate("[SEC.nudge?.txt || '', SEC.open, SEC.tab]")

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.semana", cfg={"seedStore": json.dumps(SEED), "realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            await pg.evaluate("SEC.nudge = null; SEC.open = false")
            # painel: novo lembrete para a academia, seg/qua/sex, 15 min antes
            chk(await pg.locator(".lsnew").count() == 1, "a Rotina tem o painel Lembretes com “Novo lembrete”")
            await pg.evaluate("document.querySelector('.lsnew').open = true")
            await pg.fill("#ls_t", "academia teste")
            for d in (1, 3, 5): await pg.click(f"[data-lsdia='{d}']")
            await pg.select_option("#ls_m", "15"); await pg.click("[data-act=lsadd]"); await pg.wait_for_timeout(250)
            r = await pg.evaluate(SEMR)
            chk(r == [["academia teste", [1, 3, 5], 15, True, False, 0]], f"regra criada pelo nome, com os dias e os minutos ({r})")
            txt = await pg.inner_text(".lsit")
            chk("seg, qua, sex" in txt and "15 min antes" in txt and "hoje 18:30" in txt, f"o painel mostra dias, aviso e as próximas ocorrências ({txt[:120]!r})")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("secData().semanais.length") == 0, "Ctrl+Z desfaz o lembrete criado")
            await pg.keyboard.press("Control+Shift+z"); await pg.wait_for_timeout(250)
            # cartão do bloco: Inglês de hoje, 10 min antes, só às sextas
            await pg.click(f"[data-rtb='ri1|{TODAY_ISO}']", force=True); await pg.wait_for_timeout(250)
            chk(await pg.input_value("[data-lsmin]") == "", "o cartão do Inglês abre sem lembrete")
            await pg.select_option("[data-lsmin]", "10"); await pg.wait_for_timeout(200)
            await pg.check("[data-lsso]"); await pg.wait_for_timeout(200)
            r = await pg.evaluate(SEMR)
            chk(["Inglês TESTE", [5], 10, True, False, 0] in r, f"no cartão: 10 min antes, só às sextas ({r})")
            bx = await pg.inner_text(".lsbox")
            chk("só às sextas" in bx and "Vale para toda “Inglês TESTE”: sex." in bx, f"o cartão mostra o lembrete sem fechar ({bx[-90:]!r})")
            await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
            # aviso na hora certa
            n0 = await tick(pg, "18:14")
            chk(n0[0] == "", f"18:14: ainda não (faltam 16 min) ({n0})")
            n1 = await tick(pg, "18:16")
            chk(n1[0] == "Em 14 min: Academia TESTE (18:30–19:30)" and n1[1] and n1[2] == "lembretes", f"18:16: o Secretário avisa e abre nos lembretes ({n1})")
            sx = await pg.evaluate("document.querySelector('#sec').textContent")   # textContent: o título da seção é em caixa alta no CSS
            chk("Toda semana" in sx and "Inglês TESTE" in sx and "próxima: hoje 18:30" in sx, "a aba Lembretes do Secretário lista os semanais")
            await pg.evaluate("SEC.nudge = null")
            n2 = await tick(pg, "18:20")
            chk(n2[0] == "", "não repete o mesmo aviso")
            # marcado como feito: não avisa
            await pg.evaluate("(() => { const b = S.rotina.find(x => x.id === 'ri1'); b.st = { [TODAY]: 'feito' }; touch('rotina', { noUndo: true }); })()")
            n3 = await tick(pg, "19:52")
            chk(n3[0] == "", "bloco já marcado como feito: sem aviso")
            await pg.evaluate("(() => { const b = S.rotina.find(x => x.id === 'ri1'); b.st = {}; touch('rotina', { noUndo: true }); })()")
            n4 = await tick(pg, "19:53")
            chk(n4[0] == "Em 7 min: Inglês TESTE (20:00–21:00)", f"desmarcado, avisa o Inglês ({n4})")
            # pausado: não avisa
            await pg.evaluate("location.hash = 'rotina.semana'"); await pg.wait_for_timeout(200)
            rid = await pg.evaluate("secData().semanais.find(r => r.titulo === 'academia teste').id")
            await pg.click(f"[data-lson='{rid}']"); await pg.wait_for_timeout(150)
            await pg.evaluate("localStorage.removeItem('atlas_lsem'); SEC.nudge = null")
            n5 = await tick(pg, "18:20")
            chk(n5[0] == "", "regra pausada: sem aviso")
            await pg.click(f"[data-lson='{rid}']"); await pg.wait_for_timeout(150)
            # Google Agenda: três eventos semanais (seg, qua, sex 18:30), aviso de 15 min
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(500)
            cr = await pg.evaluate(f"{CALLS}('create_event').map(c => [c.input.summary, c.input.startTime.slice(11, 16), c.input.recurrenceData?.[0], c.input.overrideReminders?.[0]?.minutes, c.input.useDefaultReminders, c.input.availability])")
            dias = await pg.evaluate(f"{CALLS}('create_event').map(c => parse(c.input.startTime.slice(0, 10)).getDay())")
            chk(len(cr) == 3 and all(x == ["🔔 academia teste", "18:30", "RRULE:FREQ=WEEKLY", 15, False, "AVAILABILITY_FREE"] for x in cr) and sorted(dias) == [1, 3, 5], f"Google: 3 eventos semanais, seg/qua/sex 18:30, aviso de 15 min, sem bloquear a agenda ({cr[:1]}, {dias})")
            r = await pg.evaluate(SEMR)
            chk(["academia teste", [1, 3, 5], 15, True, True, 3] in r and "no Google Agenda" in await pg.inner_text(".lsit"), "a regra guarda os 3 ids e o painel mostra “no Google Agenda”")
            # sincronizar a agenda não traz os eventos de lembrete como compromissos
            await pg.evaluate("gcSync({ silent: true })"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("S.eventos.filter(e => /🔔/.test(e.titulo)).length") == 0 and await pg.evaluate("S.eventos.some(e => e.titulo === 'Reunião de projeto')"), "a sincronização ignora os eventos de lembrete e traz os outros")
            # mudar os minutos pede atualizar; atualizar apaga os 3 e cria 3
            await pg.evaluate(f"(() => {{ const r = secData().semanais.find(x => x.id === '{rid}'); r.min = 30; touch('secretario', {{ noUndo: true }}); }})()"); await pg.wait_for_timeout(200)
            t = await pg.inner_text(".lsit")
            chk("Google desatualizado" in t and await pg.locator(f"[data-lsgc='{rid}']").inner_text() == "Atualizar no Google", "mudou o aviso: o painel pede “Atualizar no Google”")
            await pg.evaluate("window.__calls.length = 0")
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(500)
            dl, cr = await pg.evaluate(f"{CALLS}('delete_event').length"), await pg.evaluate(f"{CALLS}('create_event').map(c => c.input.overrideReminders[0].minutes)")
            chk(dl == 3 and cr == [30, 30, 30] and await pg.evaluate("window.__gcEv.length") == 3, f"atualizar: apaga 3 e cria 3 com 30 min ({dl}, {cr})")
            # tirar do Google
            await pg.evaluate("window.__calls.length = 0")
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate(f"{CALLS}('delete_event').length") == 3 and await pg.evaluate("window.__gcEv.length") == 0 and not await pg.evaluate(f"secData().semanais.find(x => x.id === '{rid}').gcal"), "“Tirar do Google” apaga os 3 eventos e a regra continua no Atlas")
            # apagar a regra que está no Google apaga lá também
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(400)
            await pg.evaluate("window.__calls.length = 0")
            await pg.click(f"[data-lsdel='{rid}']"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate(f"!secData().semanais.some(x => x.id === '{rid}')") and await pg.evaluate("window.__gcEv.length") == 0 and await pg.evaluate(f"{CALLS}('delete_event').length") == 3, "apagar a regra tira os eventos do Google junto")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # resposta do Google sem id: tirar procura pela marca da regra
        b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.semana", cfg={"seedStore": json.dumps(SEED), "realBoot": True, "gcalNoId": True})
        try:
            await pg.wait_for_timeout(900)
            await pg.evaluate("lsSalvar('Academia TESTE', [1, 3, 5], 15); render()"); await pg.wait_for_timeout(200)
            rid = await pg.evaluate("secData().semanais[0].id")
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("secData().semanais[0].gcal?.on") and await pg.evaluate("secData().semanais[0].gcal.ids.length") == 0, "sem id na resposta: a regra fica marcada como no Google, sem ids")
            await pg.evaluate("window.__calls.length = 0")
            await pg.click(f"[data-lsgc='{rid}']"); await pg.wait_for_timeout(500)
            li = await pg.evaluate(f"{CALLS}('list_events').map(c => c.input.fullText)")
            chk(li == [f"atlas-lemb:{rid}"] and await pg.evaluate(f"{CALLS}('delete_event').length") == 3 and await pg.evaluate("window.__gcEv.length") == 0, f"tirar: procura pela marca e apaga as 3 séries ({li})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # modo exemplo: o exemplo tem um lembrete, mas não avisa
        b, pg, errs = await open_page(p, w=1440, hash_="rotina.semana")
        try:
            await pg.wait_for_timeout(700)
            await pg.evaluate("exOn()"); await pg.wait_for_timeout(500)
            n = await tick(pg, "18:20")
            chk(await pg.evaluate("EX_MODE") and await pg.evaluate("secData().semanais.length") >= 1 and "Academia" not in (n[0] or ""), f"modo exemplo: o lembrete aparece mas não avisa ({n[0]!r})")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
