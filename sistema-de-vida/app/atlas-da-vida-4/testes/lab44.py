"""Atlas 4 · Guia do Atlas no Secretário e plano de preenchimento. Dados de exemplo e plano fictícios.
O guia é a quarta aba da janela do Secretário: o que preencher em cada área, o mínimo, o jeito rápido e a frequência; acompanha a aba
em que você está; abre por pedido em texto (“como preencho os gastos?”), pela IA (ferramenta abrir_guia, depois da resposta) e pela
busca do Atlas. Com um plano pessoal, mostra o próximo preenchimento, o plano por frequência e, em cada área, o que é dela; os gatilhos
do plano viram lembretes semanais com a nota do que fazer, que avisam com a nota e saem sem levar os lembretes da pessoa."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

PLANO = {"base": "Rotina de teste", "resumo": {"dia": 9, "semana": 40, "mes": 50}, "itens": [
  {"id": "t_manha", "aba": "hoje", "titulo": "Hoje TESTE: as 4 perguntas", "quando": "Todo dia no café", "freq": "diária", "min": 1, "como": "Toque nas 4 respostas.", "gatilho": {"titulo": "Café e planejar o dia", "dias": [], "min": 0}},
  {"id": "t_treino", "aba": "saude.treinos", "titulo": "Treino TESTE: marcar as séries", "quando": "Na academia", "freq": "a cada treino", "min": 0, "como": "Treinar e marcar.", "gatilho": {"titulo": "Academia", "dias": [], "min": 5}},
  {"id": "t_sem", "aba": "semana", "titulo": "Fechamento TESTE", "quando": "Segunda à noite", "freq": "semanal", "min": 15, "como": "Os passos de cima para baixo."},
  {"id": "t_mes", "aba": "roda", "titulo": "Roda TESTE", "quando": "Última sexta", "freq": "mensal", "min": 10, "como": "Notas de 0 a 10."}]}
SECT = "document.querySelector('#secbody')?.textContent || ''"
ABERTA = "document.querySelector('#secbody .gusec[open] summary b')?.textContent || ''"

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=900, hash_="hoje")
        try:
            await pg.wait_for_timeout(600)
            await pg.evaluate("secToggle(true)"); await pg.wait_for_timeout(150)
            tabs = await pg.evaluate("[...document.querySelectorAll('#sec .sectabs button')].map(b => b.textContent.replace(/\\d+/g, '').trim())")
            chk(tabs == ["Agora", "Conversa", "Lembretes", "Guia"], f"o Secretário tem a aba Guia ({tabs})")
            await pg.click("#sec [data-t=guia]"); await pg.wait_for_timeout(200)
            n = await pg.evaluate("document.querySelectorAll('#secbody .gusec').length")
            chk(n == await pg.evaluate("GUIA_ORD.length") and await pg.evaluate(ABERTA) == "Hoje", f"guia com todas as {n} áreas, abrindo na aba atual (Hoje)")
            t = await pg.evaluate(SECT)
            chk("O que preencher" in t and "O mínimo que já vale" in t and "Jeito rápido" in t and "Ainda sem plano pessoal" in t, "cada seção: o que preencher, o mínimo, o jeito rápido; sem plano, avisa")
            gk = await pg.evaluate("Object.keys(GUIA)")
            chk(all(k in gk for k in ["hoje", "painel", "rotina", "inspira", "fin", "saude", "trabalho", "jornada", "psi", "carreira", "idiomas", "casa", "roda", "semana", "integ", "ajustes"]), "o guia cobre as abas do menu, a Inspiração inclusive")
            nav = await pg.evaluate("NAV.flatMap(g => g[1]).map(x => x[0]).filter(k => !GUIA[k])")
            chk(nav == [], f"toda aba do menu tem seção no guia (faltam: {nav})")
            # acompanha a aba
            await pg.evaluate("location.hash = 'saude.checkin'"); await pg.wait_for_timeout(300)
            a1 = await pg.evaluate(ABERTA)
            await pg.evaluate("location.hash = 'fin.lanc'"); await pg.wait_for_timeout(300)
            a2 = await pg.evaluate(ABERTA)
            chk(a1 == "Saúde" and a2 == "Finanças", f"o guia acompanha a aba ({a1} → {a2})")
            # busca
            await pg.fill("#gu_q", "extrato"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("[...document.querySelectorAll('#secbody .gusec summary b')].map(b => b.textContent)")
            chk(r and r[0] == "Finanças" and await pg.evaluate("document.activeElement?.id") == "gu_q", f"a busca filtra e o campo continua com o foco ({r})")
            await pg.fill("#gu_q", ""); await pg.wait_for_timeout(150)
            # pedido em texto, sem IA
            await pg.evaluate("location.hash = 'hoje'"); await pg.wait_for_timeout(200)
            await pg.evaluate("secAsk('como preencho os gastos?')"); await pg.wait_for_timeout(250)
            r = await pg.evaluate(f"[SEC.tab, {ABERTA}, secData().conversa.at(-1)?.content]")
            chk(r[0] == "guia" and r[1] == "Finanças" and "Finanças" in r[2] and not await pg.evaluate("guData().segue"), f"“como preencho os gastos?” abre o guia em Finanças e para de acompanhar a aba ({r[:2]})")
            await pg.evaluate("secAsk('abre o tutorial da rotina')"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate(ABERTA) == "Rotina", "“abre o tutorial da rotina” abre em Rotina")
            await pg.evaluate("secAsk('o que preencher na inspiração?')"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate(ABERTA) == "Inspiração", "a Inspiração também tem seção")
            # IA: abrir_guia devolve a seção e abre o guia depois da resposta
            r = await pg.evaluate("""(() => { const live = SEC.live = { text: '', uso: [], acoes: [], conflitos: [], user: { role: 'user', content: 'teste', at: 1 }, ctl: new AbortController() };
              const t = secTools(live).find(x => x.name === 'abrir_guia'); const out = t.execute({ aba: 'carreira' }); SEC.tab = 'conversa'; secFinish('Abri a carreira.'); return [out.secao, out.preencher.length > 2, SEC.tab, GU.sec]; })()""")
            chk(r == ["Carreira", True, "guia", "carreira"], f"ferramenta abrir_guia: devolve a seção e abre o guia ao terminar a resposta ({r})")
            # pela busca do Atlas (Ctrl K)
            await pg.evaluate("secToggle(false)"); await pg.keyboard.press("Control+k"); await pg.wait_for_timeout(200)
            await pg.keyboard.type("guia"); await pg.wait_for_timeout(250)
            chk("Guia do Atlas" in await pg.evaluate("document.querySelector('#pal, .pal, [role=dialog]')?.innerText || document.body.innerText"), "a busca do Atlas tem “Guia do Atlas”")
            await pg.keyboard.press("Escape")
            # plano pessoal (fictício)
            await pg.evaluate(f"(() => {{ S.guia = {{ segue: true, plano: {json.dumps(PLANO, ensure_ascii=False)} }}; touch('guia', {{ noUndo: true }}); guAbrir('saude'); }})()"); await pg.wait_for_timeout(250)
            t = await pg.evaluate(SECT)
            chk("PRÓXIMO PREENCHIMENTO" in t and "~9 min por dia" in t and "Todo dia" in t and "Toda semana" in t and "Todo mês" in t, "com plano: próximo preenchimento, tempo e o plano por frequência")
            chk("No seu plano" in t and "Na academia" in t, "a seção de Saúde mostra o item do plano que é dela")
            nx = await pg.evaluate("(x => x && [x.i.id, x.dia === TODAY])(guProximo())")
            chk(nx is not None and nx[0] in ("t_manha", "t_treino"), f"o próximo preenchimento vem da rotina ({nx})")
            # lembretes do plano
            await pg.evaluate("lsSalvar('Almoço e caminhada', [], 5)")   # um lembrete da pessoa, que tem de ficar
            await pg.evaluate("render(); secPaint()"); await pg.wait_for_timeout(100)
            await pg.click("#secbody [data-act=guleb]"); await pg.wait_for_timeout(250)
            r = await pg.evaluate("secData().semanais.map(r => [r.titulo, r.min, r.nota || '', r.plano || ''])")
            chk(["Café e planejar o dia", 0, "Hoje TESTE: as 4 perguntas, 1 min", "t_manha"] in r and len(r) == 3, f"“Criar os lembretes do plano”: um por gatilho novo, com a nota ({r})")
            chk(["Academia", 15, "Treino TESTE: marcar as séries", ""] in r and await pg.evaluate("secData().semanais.find(r => r.titulo === 'Academia').planoNota") == "t_treino", "a academia já tinha lembrete (do exemplo): a nota do plano entra nele, sem lembrete duplicado")
            chk("Lembretes do plano criados" in await pg.evaluate(SECT), "o guia mostra que os lembretes foram criados")
            # o aviso leva a nota
            ini = await pg.evaluate("(rtOcc(TODAY).find(b => b.titulo === 'Café e planejar o dia') || {}).ini")
            if ini:
                await pg.evaluate(f"localStorage.removeItem('atlas_lsem'); __clock.set(TODAY + 'T{ini}:00'); SEC.nudge = null; secTick()"); await pg.wait_for_timeout(150)
                nu = await pg.evaluate("SEC.nudge?.txt || ''")
                chk("Hoje TESTE: as 4 perguntas" in nu, f"o aviso do lembrete traz a nota do plano ({nu})")
            await pg.evaluate("guAbrir('saude')"); await pg.wait_for_timeout(100)
            await pg.click("#secbody [data-act=gulebx]"); await pg.wait_for_timeout(250)
            r = await pg.evaluate("secData().semanais.map(r => r.titulo)")
            ac = await pg.evaluate("(r => r && [r.nota || '', !!r.planoNota])(secData().semanais.find(r => r.titulo === 'Academia'))")
            chk(sorted(r) == ["Academia", "Almoço e caminhada"] and ac == ["", False], f"tirar os lembretes do plano: sai o criado pelo plano, os da pessoa ficam e a academia perde só a nota ({r}, {ac})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.dia")
        try:
            await pg.wait_for_timeout(600)
            await pg.evaluate("guAbrir(guAtual())"); await pg.wait_for_timeout(250)
            r = await pg.evaluate("(() => { const w = document.querySelector('#sec').getBoundingClientRect(); return [Math.round(w.left), Math.round(w.right), innerWidth, document.querySelector('#secbody .gusec[open] summary b')?.textContent]; })()")
            chk(r[0] >= 0 and r[1] <= r[2] and r[3] == "Rotina", f"celular: o guia abre na folha de baixo, na seção da aba ({r})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
