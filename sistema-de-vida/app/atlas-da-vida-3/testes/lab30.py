"""Hoje, Painel do dia e Rotina: tempo livre em horas (2, 4, 6 h ou outro valor escrito); recomeçar o Painel do dia do zero, com
desfazer; na Rotina, tarefas e compromissos com horário no texto (como os que a IA cria) entram na faixa certa da grade, e não
no “dia todo”; o leitor de horário separa faixa, início, duração e prazo; todo item abre um cartão para apagar, concluir,
editar ou virar bloco; o Secretário propõe bloco (não tarefa) para atividade com horário e aceita “9h”, “9:00” e fim ausente."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

async def hoje_painel(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje")
    try:
        await pg.wait_for_timeout(700)
        ch = await pg.evaluate("[...document.querySelectorAll('[data-hjc^=\"tempo|\"]')].map(b => b.textContent)")
        chk(ch == ["2 h", "4 h", "6 h"] and await pg.locator("[data-hjtempo]").count() == 1, f"tempo livre em horas: 2 h, 4 h, 6 h e um campo para outro valor ({ch})")
        await pg.click("[data-hjc='tempo|240']"); await pg.wait_for_timeout(200)
        r1 = await pg.evaluate("[hctx().tempo, document.querySelector('[data-hjc=\"tempo|240\"]').getAttribute('aria-pressed'), document.querySelector('[data-hjtempo]').value]")
        await pg.fill("[data-hjtempo]", "1,5"); await pg.press("[data-hjtempo]", "Tab"); await pg.wait_for_timeout(250)
        r2 = await pg.evaluate("[hctx().tempo, [...document.querySelectorAll('[data-hjc^=\"tempo|\"][aria-pressed=\"true\"]')].length, document.querySelector('[data-hjtempo]').value]")
        await pg.fill("[data-hjtempo]", "3"); await pg.press("[data-hjtempo]", "Tab"); await pg.wait_for_timeout(250)
        r3 = await pg.evaluate("[hctx().tempo, hjIdeias(hctx(), hjClima()).pick.every(x => x.min <= 180)]")
        chk(r1 == [240, "true", ""] and r2 == [90, 0, "1,5"] and r3 == [180, True], f"o chip e o valor escrito viram minutos e filtram as ideias ({r1}, {r2}, {r3})")
        # Painel do dia: recomeçar do zero
        await pg.evaluate("location.hash = 'painel'"); await pg.wait_for_timeout(500)
        await pg.evaluate("PD = pdNew(); pdStore(); render()"); await pg.wait_for_timeout(200)
        d0 = await pg.evaluate("document.querySelector('[data-act=pdreset]')?.disabled")
        await pg.fill("#pd_txt", "Dormi 7 horas, humor 4, gastei 12 no almoço."); await pg.wait_for_timeout(600)
        d1 = await pg.evaluate("[document.querySelector('[data-act=pdreset]').disabled, PD.text.length > 10]")
        await pg.click("[data-act=pdreset]"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[PD.text, pdEmpty(), document.querySelector('#pd_txt').value, document.querySelector('#toast').textContent]")
        chk(d0 is True and d1 == [False, True] and r[0] == "" and r[1] and r[2] == "" and "recomeçar" in r[3], f"Recomeçar do zero: só com conteúdo; limpa o texto e o que ele preencheu ({d0}, {d1}, {r[3]!r})")
        await pg.click("#toastAct"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("PD.text.startsWith('Dormi 7 horas') && document.querySelector('#pd_txt').value.startsWith('Dormi')"), "Desfazer devolve o rascunho inteiro")
        await pg.click("[data-act=pdclear]"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("pdEmpty()"), "o Limpar do rodapé faz o mesmo, num toque")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def rotina(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.dia")
    try:
        await pg.wait_for_timeout(700)
        # leitor de horário
        casos = {"09:00–10:30 Estudo de italiano": [540, 630], "Reunião 9h às 10h30": [540, 630], "Academia das 18h às 19h30": [1080, 1170], "Ligar para o banco às 9h": [540, 570],
                 "Estudar 2h de inglês": None, "1h30 de corrida": None, "as 3 tarefas do dia": None, "fazer 2 a 3 vezes": None, "Entrega 2026-10-13": None, "Enviar relatório até às 18h": None, "Almoço ao meio-dia": [720, 750]}
        got = await pg.evaluate(f"Object.fromEntries(Object.keys({json.dumps(casos, ensure_ascii=False)}).map(t => [t, (h => h ? [h.a, h.z] : null)(rtHoraTxt(t))]))")
        chk(got == casos, f"horário no texto: faixa, início (30 min), e nada para duração, quantidade, data ou prazo ({[k for k in casos if got.get(k) != casos[k]]})")
        ids = await pg.evaluate("""(() => { const mk = (tarefa, notas) => { const t = { id: uid(), tarefa, prazo: TODAY, status: 'A fazer', prio: 'Média', area: '', notas, origem: 'Secretário' }; S.tarefas.push(t); return t.id; };
            const a = mk('Estudo de italiano', '09:00–10:30, antes do trabalho'), b2 = mk('Reunião com o síndico 14h às 15h', ''), c = mk('Ligar para o banco', 'sem hora marcada');
            const e1 = { id: uid(), data: TODAY, hora: '9h', fim: '', titulo: 'Dentista', local: '' }, e2 = { id: uid(), data: TODAY, hora: '', fim: '', titulo: 'Aniversário da Ana', local: '' };
            S.eventos.push(e1, e2); touch('tarefas', 'eventos'); return { a, b: b2, c, e1: e1.id, e2: e2.id }; })()""")
        await pg.evaluate("RT.d = TODAY; render()"); await pg.wait_for_timeout(300)
        g = await pg.evaluate("""(() => { const H = rtSH(), it = id => document.querySelector(`.rtcol [data-rtitem$="|${id}|${TODAY}"]`);
            const pos = id => { const e = it(id); return e ? Math.round(parseFloat(e.style.top) / H * 30) : null; };
            const all = [...document.querySelectorAll('.rtall [data-rtitem]')].map(e => e.dataset.rtitem.split('|')[1]); return { pos: Object.fromEntries(Object.entries(__ids).map(([k, v]) => [k, pos(v)])), all }; })()""".replace("__ids", json.dumps(ids)))
        chk(g["pos"]["a"] == 540 and g["pos"]["b"] == 840 and g["pos"]["e1"] == 540 and g["pos"]["c"] is None, f"na grade, na faixa certa: horário nas notas (09:00), no título (14:00) e compromisso com “9h” (09:00) ({g['pos']})")
        chk(ids["c"] in g["all"] and ids["e2"] in g["all"] and ids["a"] not in g["all"], f"no “dia todo” só o que não tem horário ({len(g['all'])} itens)")
        tt = await pg.evaluate(f"document.querySelector('.rtcol [data-rtitem$=\"|{ids['a']}|' + TODAY + '\"] b').textContent")
        chk(tt == "Estudo de italiano", f"o título aparece sem repetir o horário ({tt!r})")
        # cartão: virar bloco, com desfazer
        await pg.click(f".rtcol [data-rtitem$='|{ids['a']}|2026-10-09']"); await pg.wait_for_timeout(250)
        btn = await pg.evaluate("document.querySelector('#dlg [data-rtibloco]')?.textContent")
        await pg.click("#dlg [data-rtibloco]"); await pg.wait_for_timeout(300)
        bl = await pg.evaluate(f"[S.rotina.filter(b => b.titulo === 'Estudo de italiano' && b.data === TODAY).map(b => [b.ini, b.fim, b.notas]), S.tarefas.some(t => t.id === '{ids['a']}')]")
        chk("09:00–10:30" in (btn or "") and bl[0] == [["09:00", "10:30", "09:00–10:30, antes do trabalho"]] and bl[1] is False, f"Transformar em bloco: vira bloco 09:00–10:30 e a tarefa sai ({btn!r}, {bl})")
        await pg.click("#toastAct"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate(f"[!S.rotina.some(b => b.titulo === 'Estudo de italiano'), S.tarefas.some(t => t.id === '{ids['a']}')]") == [True, True], "Desfazer volta a tarefa e tira o bloco")
        # apagar: tarefa do dia todo, compromisso com hora
        await pg.click(f".rtall [data-rtitem='t|{ids['c']}|2026-10-09']"); await pg.wait_for_timeout(250)
        await pg.click("#dlg [data-rtidel]"); await pg.wait_for_timeout(250)
        c1 = await pg.evaluate(f"S.tarefas.some(t => t.id === '{ids['c']}')")
        await pg.click("#toastAct"); await pg.wait_for_timeout(250)
        c2 = await pg.evaluate(f"S.tarefas.some(t => t.id === '{ids['c']}')")
        await pg.click(f".rtcol [data-rtitem='e|{ids['e1']}|2026-10-09']"); await pg.wait_for_timeout(250)
        await pg.click("#dlg [data-rtidel]"); await pg.wait_for_timeout(250)
        c3 = await pg.evaluate(f"(S.eventos || []).some(e => e.id === '{ids['e1']}')")
        chk([c1, c2, c3] == [False, True, False], f"Apagar no cartão: tarefa e compromisso saem, e o Desfazer devolve ({[c1, c2, c3]})")
        # concluir
        await pg.click(f".rtcol [data-rtitem$='|{ids['b']}|2026-10-09']"); await pg.wait_for_timeout(250)
        await pg.click("#dlg [data-rtidone]"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"S.tarefas.find(t => t.id === '{ids['b']}').status") == "Concluída" and await pg.evaluate(f"!document.querySelector('[data-rtitem$=\"|{ids['b']}|' + TODAY + '\"]')"), "Concluir no cartão tira a tarefa da grade")
        # teclado: Enter abre o cartão
        await pg.focus(f".rtcol [data-rtitem$='|{ids['a']}|2026-10-09']"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate("document.querySelector('#dlg').open && !!document.querySelector('#dlg .rtitem')"), "Enter num item da grade abre o cartão")
        await pg.evaluate("document.querySelector('#dlg').close()")
        # o Secretário: atividade com horário vira bloco
        s = await pg.evaluate("""[secMkProp({ tipo: 'tarefa', titulo: 'Estudo de italiano', prazo: TODAY, motivo: '09:00–10:30, antes do trabalho' }),
            secMkProp({ tipo: 'bloco', titulo: 'Academia', data: TODAY, inicio: '18h', fim: '19h30' }), secMkProp({ tipo: 'bloco', titulo: 'Leitura', inicio: '9:00' }),
            secMkProp({ tipo: 'tarefa', titulo: 'Enviar relatório até às 18h', prazo: TODAY }), secMkProp({ tipo: 'tarefa', titulo: 'Preparar a pauta', prazo: TODAY, motivo: 'a reunião é às 15h' }),
            secMkProp({ tipo: 'bloco', titulo: 'Inglês 20h às 21h', data: TODAY })].map(p => [p.tipo, p.ini || '', p.fim || '', p.titulo || '', p.erro || '', p.motivo || ''])""")
        chk(s[0][:4] == ["bloco", "09:00", "10:30", "Estudo de italiano"] and "Tinha horário" in s[0][5], f"tarefa com faixa de horário vira proposta de bloco ({s[0][:4]})")
        chk(s[1][:3] == ["bloco", "18:00", "19:30"] and s[2][:3] == ["bloco", "09:00", "10:00"] and "Sem horário de fim" in s[2][5] and s[5][:4] == ["bloco", "20:00", "21:00", "Inglês"], f"bloco aceita “18h”, “19h30”, “9:00”, sem fim (1 h) e horário só no título ({s[1][:3]}, {s[2][:3]}, {s[5][:4]})")
        chk(s[3][0] == "tarefa" and s[4][0] == "tarefa", "prazo (“até às 18h”) e hora solta na descrição continuam tarefa")
        pr = await pg.evaluate("secPrompt()")
        chk("um \"bloco\" por atividade" in pr and "nunca é \"tarefa\"" in pr, "o prompt do Secretário manda propor bloco para atividade com horário")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()
    b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.dia")
    try:
        await pg.wait_for_timeout(600)
        await pg.evaluate("S.tarefas.push({ id: 'tm1', tarefa: 'Treino 18:30-19:30', prazo: TODAY, status: 'A fazer', prio: 'Média' }, { id: 'tm2', tarefa: 'Comprar pão', prazo: TODAY, status: 'A fazer', prio: 'Baixa' }); touch('tarefas'); RT.d = TODAY; render()"); await pg.wait_for_timeout(300)
        o = await overflow(pg)
        await pg.click(".rtall [data-rtitem='t|tm2|2026-10-09']"); await pg.wait_for_timeout(250)
        vis = await pg.evaluate("(() => { const r = document.querySelector('#dlg form').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()")
        chk(o[0] <= o[1] and vis and await pg.evaluate("!!document.querySelector('.rtcol [data-rtitem=\"t|tm1|' + TODAY + '\"]')"), f"celular: item com horário na grade, cartão cabe na tela, sem rolagem lateral ({o})")
        chk(not errs, f"sem erros no celular ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        await hoje_painel(p)
        await rotina(p)
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
