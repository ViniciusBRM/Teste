"""Atlas 4 · Rotina › Capturar o dia. Na aba Rotina, o Capturar do topo abre o relato do dia; a IA separa cada atividade e cada uma
vai para a faixa de horário dela, como bloco. O que já estava planejado no mesmo horário recebe o status em vez de repetir.
Aqui: separação sem IA (frases com horário), IA (pedido, resposta, revisão, faixas de meia hora, dúvidas), marcar na grade,
gravação no banco, desfazer, voz do navegador (falsa) com separação automática ao parar, voz indisponível (ditado do teclado),
outro dia, Capturar geral → Rotina, sem IA, erro da IA, celular."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
HOJE = "2026-10-09"   # harness: sexta, 10:00
SEED = {U + "s_rotina": {"v": [{"id": "rb1", "data": HOJE, "ini": "08:00", "fim": "12:00", "titulo": "Trabalho no projeto", "cat": "Trabalho", "rep": "", "exc": [], "st": {}, "notas": ""}], "at": 1, "r": "R0"},
        U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"}}
RELATO = "Acordei às 6h30. Das 7 às 7h30 café da manhã. Trabalhei das 8 ao meio-dia, almocei até as 13h30, reunião com o cliente das 14 às 15h30. Academia das 18 às 19h e jantar às 20h."
ITENS = "RTC.items.map(x => [x.ini, x.fim, x.titulo, x.cat, x.st, !!x.match, x.on])"
BLOCOS = f"(S.rotina || []).filter(b => b.data === '{HOJE}' || b.id === 'rb1').map(b => [b.ini, b.fim, b.titulo, b.cat, (b.st || {{}})['{HOJE}'] || '']).sort()"

async def sem_ia_unidade(p):
    b, pg, errs = await open_page(p, hash_="rotina", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(700)
        r = await pg.evaluate("t => rtcLocal(t).map(x => [x.ini, x.fim, x.titulo, x.cat])", RELATO)
        chk(r == [["06:30", "07:00", "Acordei", "Descanso"], ["07:00", "07:30", "Café da manhã", "Descanso"], ["08:00", "12:00", "Trabalhei", "Trabalho"], ["12:00", "13:30", "Almocei", "Descanso"],
                  ["14:00", "15:30", "Reunião com o cliente", "Trabalho"], ["18:00", "19:00", "Academia", "Saúde & treino"], ["20:00", "20:30", "Jantar", "Descanso"]], f"sem IA: 7 atividades, cada uma no seu horário ({r})")
        r = await pg.evaluate("t => rtcLocal(t).map(x => [x.ini, x.fim, x.titulo])", "hoje eu acordei 6:30 tomei banho e às 7:15 tomei café depois das 8 às 12 trabalhei no projeto e às 14:00 reunião com a equipe até as 16h depois academia das 18h30 às 19h30")
        chk(r == [["06:30", "07:15", "Acordei tomei banho"], ["07:15", "08:00", "Tomei café"], ["08:00", "12:00", "Trabalhei no projeto"], ["14:00", "16:00", "Reunião com a equipe"], ["18:30", "19:30", "Academia"]],
            f"sem IA: ditado corrido, sem pontuação, com “até as 16h” como fim ({r})")
        r = await pg.evaluate("t => rtcLocal(t).map(x => [x.ini, x.titulo])", "2h de estudo e 30 min de corrida")
        chk(r == [], f"duração não vira horário (“2h de estudo”) ({r})")
        # faixas de meia hora: arredonda para a mais próxima, sem sobrepor a anterior, com nota do horário falado
        r = await pg.evaluate(f"rtcPrep([{{titulo: 'Café', ini: '07:10', fim: '07:20', cat: 'Descanso'}}, {{titulo: 'Banho', ini: '07:20', fim: '07:40', cat: 'Descanso'}}, {{titulo: 'Jantar', ini: '20:00', fim: '20:45', cat: 'Descanso'}}], '{HOJE}').map(x => [x.ini, x.fim, x.nota])")
        chk(r == [["07:00", "07:30", "no relato: 07:10–07:20"], ["07:30", "08:00", "no relato: 07:20–07:40"], ["20:00", "21:00", "no relato: 20:00–20:45"]], f"cada atividade numa faixa de meia hora, sem sobrepor ({r})")
        r = await pg.evaluate(f"rtcPrep([{{titulo: 'Trabalho', ini: '08:00', fim: '18:00', cat: 'Trabalho'}}, {{titulo: 'Almoço', ini: '12:00', fim: '13:00', cat: 'Descanso'}}, {{titulo: 'Academia', ini: '18:10', fim: '19:00', cat: 'Saúde & treino'}}], '{HOJE}').map(x => [x.ini, x.fim])")
        chk(r == [["08:00", "18:00"], ["12:00", "13:00"], ["18:00", "19:00"]], f"uma atividade dentro de outra (almoço no meio do trabalho) fica no horário dela ({r})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def ajustes(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True, "seedStore": json.dumps(SEED), "fakeSR": True})
    try:
        await pg.wait_for_timeout(900)
        await pg.click("[data-act=rtcap]"); await pg.fill("#rtc_txt", "Trabalhei das 8 às 12 no projeto"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("[RTC.items.length, !!RTC.items[0].match]") == [1, True], "o trabalho das 8 às 12 casa com o bloco planejado")
        await pg.select_option("[data-rtcf='0|ini']", "13:00"); await pg.wait_for_timeout(100); await pg.select_option("[data-rtcf='0|fim']", "14:00"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[RTC.items[0].ini, RTC.items[0].fim, !!RTC.items[0].match, document.querySelector('#rtc_n').textContent]") == ["13:00", "14:00", False, "1 bloco novo"], "mudar o horário na revisão refaz o vínculo: agora é um bloco novo")
        await pg.fill("#rtc_txt", "Amanhã vou acordar às 6h, academia das 7 às 8 e inglês às 20h"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("[RTC.d, document.querySelector('#rtc_d').value, RTC.items.map(x => x.st)]") == ["2026-10-10", "2026-10-10", ["", "", ""]], "“amanhã” no relato muda o dia, e tudo vem como planejado")
        await pg.click("[data-act=rtcmic]"); await pg.wait_for_timeout(100)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[document.querySelector('#dlg').open, RTC.sr === null]") == [False, True], "fechar a janela (Esc) desliga o microfone")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def fluxo_ia(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(900)
        chk(await pg.evaluate("!!document.querySelector('[data-act=rtcap]')"), "a Rotina tem o botão Capturar o dia")
        await pg.click("[data-act=cap]"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("!!document.querySelector('#dlg[open] #rtcf') && !document.querySelector('#capf')"), "na aba Rotina, o Capturar do topo abre o Capturar do dia")
        await pg.fill("#rtc_txt", RELATO); await pg.wait_for_timeout(500)
        n_local = await pg.evaluate("RTC.items.length")
        chk(n_local == 7 and await pg.evaluate("document.querySelectorAll('#rtc_prev .rtci').length") == 7, f"enquanto digita (ou dita), já aparece o que o Atlas entendeu ({n_local})")
        await pg.click("[data-act=rtcai]"); await pg.wait_for_timeout(700)
        P = await pg.evaluate("window.__rtcPrompt || ''")
        chk("TAREFA: ROTINA DO DIA" in P and RELATO in P and "08:00–12:00 Trabalho no projeto" in P and f"Dia do relato, salvo indicação no texto: {HOJE}" in P,
            "a IA recebe o relato, o dia e os blocos que já estão na rotina")
        it = await pg.evaluate(ITENS)
        chk([x[:3] for x in it] == [["07:00", "07:30", "Café da manhã"], ["08:00", "12:00", "Trabalho no projeto"], ["12:00", "13:30", "Almoço"], ["14:00", "15:30", "Reunião com o cliente"], ["18:00", "19:00", "Academia"], ["20:00", "21:00", "Jantar"]],
            f"a IA separa 6 atividades, cada uma na faixa de meia hora ({[x[:3] for x in it]})")
        chk([x[5] for x in it] == [False, True, False, False, False, False], "o trabalho das 8 às 12 é o bloco que já estava planejado")
        chk([x[4] for x in it] == ["feito", "feito", "feito", "feito", "feito", ""], f"o que já aconteceu vem como feito; o jantar, como planejado ({[x[4] for x in it]})")
        T = await pg.evaluate("document.querySelector('#rtc_prev').innerText")
        chk("já estava na rotina: Trabalho no projeto (08:00–12:00)" in T and "Que horas terminou o jantar?" in T and "no relato: 20:00–20:45" in T and "horário deduzido" in T,
            "a revisão mostra o bloco que já existia, a dúvida da IA, o horário falado e o deduzido")
        chk(await pg.evaluate("document.querySelector('#rtc_n').textContent") == "5 blocos novos · 1 bloco marcado", "contagem antes de marcar")
        # ajustes na revisão: mudar o início da academia, a categoria do almoço e tirar o jantar
        await pg.select_option("[data-rtcf='4|ini']", "18:30"); await pg.select_option("[data-rtcf='2|cat']", "Pessoas")
        await pg.uncheck("[data-rtcon='5']"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[RTC.items[4].ini, RTC.items[4].fim, RTC.items[2].cat, RTC.items[5].on]") == ["18:30", "19:00", "Pessoas", False], "dá para ajustar horário, categoria e desmarcar antes")
        await pg.click("[data-act=rtcsave]"); await pg.wait_for_timeout(900)
        bl = await pg.evaluate(BLOCOS)
        chk(bl == [["07:00", "07:30", "Café da manhã", "Descanso", "feito"], ["08:00", "12:00", "Trabalho no projeto", "Trabalho", "feito"], ["12:00", "13:30", "Almoço", "Pessoas", "feito"],
                   ["14:00", "15:30", "Reunião com o cliente", "Trabalho", "feito"], ["18:30", "19:00", "Academia", "Saúde & treino", "feito"]], f"marcado na rotina: 4 blocos novos e o planejado como feito, sem repetir ({bl})")
        g = await pg.evaluate(f"[...document.querySelectorAll('.rtcol[data-rtday=\"{HOJE}\"] .rtb')].map(e => [e.dataset.rtb.split('|')[0] === 'rb1' ? 'rb1' : 'novo', parseFloat(e.style.top), e.querySelector('b').textContent])")
        H = await pg.evaluate("rtSH()")
        tops = sorted((round(t / H * 30), name) for _, t, name in g)
        chk(tops == [(420, "✓ Café da manhã"), (480, "✓ Trabalho no projeto"), (720, "✓ Almoço"), (840, "✓ Reunião com o cliente"), (1110, "✓ Academia")], f"na grade, cada bloco na sua faixa de horário ({tops})")
        chk(await pg.evaluate("location.hash") == "#rotina.dia" and not await pg.evaluate("document.querySelector('#dlg').open"), "fecha e mostra o dia na Rotina")
        await pg.wait_for_timeout(1200)
        st = await pg.evaluate(f"window.__store['{U}s_rotina'].v.length")
        chk(st == 5, f"gravado no banco ({st} blocos)")
        nota = await pg.evaluate("S.rotina.find(b => b.titulo === 'Almoço').notas")
        chk(nota == "Capturar", f"o bloco guarda de onde veio ({nota!r})")
        await pg.click("#toastAct"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate(BLOCOS) == [["08:00", "12:00", "Trabalho no projeto", "Trabalho", ""]], "Desfazer volta a rotina como estava")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def voz(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True, "fakeSR": True})
    try:
        await pg.wait_for_timeout(800)
        await pg.click("[data-act=rtcap]"); await pg.wait_for_timeout(200)
        await pg.click("[data-act=rtcmic]"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[!!window.__sr?.started, window.__sr.continuous, window.__sr.lang, document.querySelector('[data-act=rtcmic]').getAttribute('aria-pressed')]") == [True, True, "pt-BR", "true"], "Gravar liga a voz do navegador, contínua, em português")
        say = lambda t, fin: pg.evaluate("([t, fin]) => window.__sr.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: fin })] })", [t, fin])
        await say("das 9 às 10 inglês", False); await pg.wait_for_timeout(100)
        chk("das 9 às 10 inglês" in await pg.evaluate("document.querySelector('#rtc_vmsg').textContent"), "mostra o que está ouvindo")
        await say("das 9 às 10 inglês", True); await say("depois academia das 18 às 19", True); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("document.querySelector('#rtc_txt').value") == "Das 9 às 10 inglês. Depois academia das 18 às 19", "o que foi dito entra no campo")
        await pg.evaluate("window.__rtcReply = { atividades: [{ titulo: 'Inglês', ini: '09:00', fim: '10:00', cat: 'Estudo', status: 'feito' }, { titulo: 'Academia', ini: '18:00', fim: '19:00', cat: 'Saúde & treino', status: 'plano' }] }")
        await pg.click("[data-act=rtcmic]"); await pg.wait_for_timeout(700)
        chk(await pg.evaluate("[RTC.src, RTC.items.map(x => x.titulo + ' ' + x.ini + ' ' + (x.st || 'plano')).join(', ')]") == ["ia", "Inglês 09:00 feito, Academia 18:00 plano"], "ao parar, a IA já separa sozinha")
        await pg.click("[data-act=rtcsave]"); await pg.wait_for_timeout(500)
        chk(await pg.evaluate(f"S.rotina.filter(b => b.data === '{HOJE}').map(b => b.titulo + ' ' + b.ini + '–' + b.fim).sort()") == ["Academia 18:00–19:00", "Inglês 09:00–10:00"], "e marca na rotina")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def sem_voz(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.dia", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(800)
        await pg.evaluate("delete window.SpeechRecognition; delete window.webkitSpeechRecognition")
        await pg.click("[data-act=cap]"); await pg.wait_for_timeout(200)
        await pg.click("[data-act=rtcmic]"); await pg.wait_for_timeout(200)
        m = await pg.evaluate("document.querySelector('#rtc_vmsg').textContent")
        chk("microfone do teclado" in m or "ditado" in m.lower() or "Win + H" in m, f"sem voz no navegador: explica como ditar pelo teclado ({m})")
        chk(await pg.evaluate("document.activeElement?.id") == "rtc_txt", "e deixa o cursor no campo, pronto para o ditado do teclado")
        await pg.fill("#rtc_txt", RELATO); await pg.wait_for_timeout(400)
        sw = await pg.evaluate("[document.querySelector('#rtcf').scrollWidth, document.querySelector('#rtcf').clientWidth, document.documentElement.scrollWidth, innerWidth]")
        chk(sw[0] <= sw[1] + 1 and sw[2] <= sw[3] + 1, f"no celular (390 px), a revisão cabe sem rolar para o lado ({sw})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def outro_dia_e_geral(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(800)
        await pg.click("[data-act=cap]"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("!!document.querySelector('#capf') && !document.querySelector('#rtcf')"), "fora da Rotina, o Capturar do topo continua o geral")
        await pg.fill("#cap_txt", "ontem: das 9 às 11 relatório da obra, às 15h dentista"); await pg.wait_for_timeout(400)
        await pg.click("[data-act=caprot]"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[!!document.querySelector('#rtcf'), document.querySelector('#rtc_txt').value, RTC.d]")
        chk(r[0] and r[1].startswith("ontem: das 9") and r[2] == "2026-10-08", f"Capturar geral → Marcar na Rotina leva o texto e o dia (ontem) ({r[1:]})")
        it = await pg.evaluate(ITENS)
        chk([x[:3] + [x[4]] for x in it] == [["09:00", "11:00", "Relatório da obra", "feito"], ["15:00", "15:30", "Dentista", "feito"]], f"dia passado: tudo como feito ({it})")
        await pg.fill("#rtc_d", "2026-10-12"); await pg.dispatch_event("#rtc_d", "change"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[RTC.d, RTC.items.map(x => x.st)]") == ["2026-10-12", ["", ""]], "trocar para um dia futuro: vira planejado")
        await pg.click("[data-act=rtcsave]"); await pg.wait_for_timeout(500)
        chk(await pg.evaluate("[location.hash, RT.d, S.rotina.filter(b => b.data === '2026-10-12').length]") == ["#rotina.dia", "2026-10-12", 2], "marca no dia escolhido e abre a Rotina nele")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def sem_ia_e_erro(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True, "off": ["sample"]})
    try:
        await pg.wait_for_timeout(900)
        await pg.click("[data-act=rtcap]"); await pg.wait_for_timeout(200)
        await pg.fill("#rtc_txt", "das 9 às 10 inglês e relatório"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("[document.querySelector('[data-act=rtcai]').disabled, RTC.items.length]") == [True, 1], "sem IA: o botão da IA fica desligado e o Atlas separa sozinho o que tem horário")
        await pg.click("[data-act=rtcsave]"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("S.rotina.length") == 1, "e marca na rotina")
    finally:
        await b.close()
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(900)
        await pg.evaluate("window.__rtcFail = 'rate_limited'")
        await pg.click("[data-act=rtcap]"); await pg.fill("#rtc_txt", RELATO); await pg.wait_for_timeout(400)
        await pg.click("[data-act=rtcai]"); await pg.wait_for_timeout(500)
        chk(await pg.evaluate("[RTC.busy, RTC.items.length, !!document.querySelector('[data-act=rtcai]')]") == [False, 7, True], "erro da IA: a separação do Atlas continua e o botão volta")
        await pg.evaluate("window.__rtcFail = null; window.__rtcReply = null")
        await pg.click("[data-act=rtcai]"); await pg.wait_for_timeout(500)
        await pg.fill("#rtc_txt", RELATO + " Li 20 páginas às 22h."); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("[RTC.src, RTC.items.length, document.querySelector('#rtc_prev').innerText.includes('O texto mudou depois da IA')]") == ["ia", 6, True], "mudar o texto depois da IA avisa, sem desfazer a separação dela")
        chk(not [e for e in errs if "rate_limited" not in e], f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("sem IA", sem_ia_unidade), ("ajustes na revisão", ajustes), ("IA", fluxo_ia), ("voz", voz), ("sem voz / celular", sem_voz), ("outro dia e Capturar geral", outro_dia_e_geral), ("sem IA e erro", sem_ia_e_erro)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
