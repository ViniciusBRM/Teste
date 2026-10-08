"""Cockpit de Trabalho (1/2): a aba e as 19 visões desenham sem erro; calendário de dias úteis italiano (Páscoa, Pasquetta,
padroeiro); caminho crítico, folgas, atraso em cascata e Eisenhower; entrada rápida (Alt+Shift+N) com @pessoa #tag 8h data
[projeto]; Kanban com arrastar; formulário com dependência circular recusada; delegação e PDI; e o PMO: o prompt fixo vem da
configuração versionada + o contexto da pessoa + o estado com códigos, as ferramentas de escrita só criam propostas, nada muda
antes da aprovação, “aprova 1 e 3” aprova só essas, o botão aprova a #2 e “não” descarta o resto."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
SUBS = ["hoje", "semana", "mes", "kanban", "lista", "gantt", "riscos", "problemas", "equipe", "pessoa", "log", "decisoes", "bim", "entregas", "reunioes", "relatorios", "licoes", "metricas", "contexto"]

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho.hoje")
        try:
            await pg.wait_for_timeout(900)
            chk(await pg.evaluate("[...document.querySelectorAll('#nav .nv')].some(a => a.getAttribute('href') === '#trabalho' && /Cockpit de Trabalho/.test(a.textContent))"), "a aba Cockpit de Trabalho está no menu")
            falhas = []
            for s in SUBS:
                await pg.evaluate(f"location.hash='trabalho.{s}'"); await pg.wait_for_timeout(120)
                if await pg.evaluate("!!document.querySelector('.emptyb')"): falhas.append(s)
            chk(not falhas and not errs, f"as {len(SUBS)} visões desenham sem erro ({falhas} {errs[:2]})")
            # calendário
            cal = await pg.evaluate("""[ckEaster(2026), ckUtil('2026-04-06'), ckUtil('2026-06-24'), ckUtil('2026-06-23'), ckAddU('2026-12-24', 1), ckDiffU('2026-12-24', '2026-12-29'), ckUtil('2027-03-29'), ckDiffU('2026-10-09', '2026-10-09'), ckDiffU('2026-10-12', '2026-10-09')]""")
            chk(cal == ["2026-04-05", False, False, True, "2026-12-28", 2, False, 0, -1], f"dias úteis italianos: Páscoa 5/4/2026, Pasquetta, San Giovanni (padroeiro), Natal e Santo Stefano fora ({cal})")
            # CPM
            cpm = await pg.evaluate("""(() => { const C = ckCPM(), R = id => C.R[ckTarRef(id).id]; return { t3: R('T3').atraso, t4: R('T4').atraso, t2crit: R('T2').crit, t2f: R('T2').folga, t3es: R('T3').es > R('T2').ef, cas: C.cascata.map(c => [ckT().find(t => t.id === c.id).cod, ckT().find(t => t.id === c.origem).cod]), cam: C.caminho.p1.map(id => ckT().find(t => t.id === id).cod), ciclo: C.ciclo.length }; })()""")
            chk(cpm["t3"] and cpm["t4"] and cpm["t2crit"] and cpm["t2f"] < 0 and cpm["t3es"] and not cpm["ciclo"], f"CPM: T3 começa depois de T2, T3 e T4 terminam depois do prazo e T2 fica crítica com folga negativa ({cpm})")
            chk(["T3", "T2"] in cpm["cas"] or ["T4", "T2"] in cpm["cas"], f"atraso em cascata atribuído à origem ({cpm['cas']})")
            chk(cpm["cam"][-1] == "T4" and cpm["cam"][0] == "T2", f"o caminho que define o fim da Variante vai de T2 a T4 ({cpm['cam']})")
            al = await pg.evaluate("ckAlertas().map(a => a.k)")
            chk(all(k in al for k in ["vencidas", "cascata", "risco", "clash", "elaborati"]), f"alertas proativos: vencidas, cascata, risco sem mitigação, clash em alta, elaborato atrasado ({al})")
            q = await pg.evaluate("ckSorted(ckT().filter(ckOpen)).map(t => ckPrio(t).q)")
            chk(q == sorted(q), f"a ordem sugerida segue o quadrante de Eisenhower ({q})")
            sug = await pg.evaluate("ckRiscosSug().map(r => r.desc)")
            chk(any("escopo" in s for s in sug) and any("júnior" in s for s in sug), f"o motor detecta riscos no diário (variante) e nas tarefas (júnior sem revisor) ({sug[:4]})")
            # entrada rápida
            await pg.keyboard.press("Alt+Shift+N"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("!!document.querySelector('#ckq')?.open"), "Alt+Shift+N abre a entrada rápida em qualquer aba")
            await pg.fill("#ckq_in", "t: Verificare il drenaggio al km 2 @Giulia #Idraulica 6h !alta sex [Variante]"); await pg.wait_for_timeout(80)
            prev = await pg.inner_text("#ckq_prev")
            chk("Giulia" in prev and "Idraulica" in prev and "6 h" in prev and "Variante" in prev, f"a prévia mostra pessoa, tag, esforço e projeto ({prev[:160]})")
            await pg.press("#ckq_in", "Enter"); await pg.wait_for_timeout(200)
            t = await pg.evaluate("(() => { const t = ckT().at(-1); return { cod: t.cod, tit: t.titulo, resp: t.resp, tags: t.tags, esf: t.esforco, prio: t.prio, proj: t.projeto, dow: parse(t.prazo).getDay(), fut: t.prazo > TODAY }; })()")
            chk(t["cod"] == "T18" and t["tit"] == "Verificare il drenaggio al km 2" and t["resp"] == "m2" and t["tags"] == ["Idraulica"] and t["esf"] == 6 and t["prio"] == "alta" and t["proj"] == "p1" and t["dow"] == 5 and t["fut"], f"a tarefa nasce com código, pessoa, tag, esforço, prioridade, projeto e a próxima sexta ({t})")
            await pg.keyboard.press("Alt+Shift+N"); await pg.fill("#ckq_in", "Il RUP chiede una variante del tracciato al km 3"); await pg.press("#ckq_in", "Enter"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("ckA('ckLog').at(-1).tipo === 'escopo' && ckA('ckLog').at(-1).cod === 'E6'"), "sem prefixo vira evento do diário de bordo, classificado como escopo")
            # kanban: arrastar
            await pg.evaluate("location.hash='trabalho.kanban'"); await pg.wait_for_timeout(200)
            await pg.drag_and_drop('.ckcard[data-cktask="t7"]', '.ckcol[data-ckcol="em andamento"]'); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("ckTarRef('T7').status") == "em andamento", "arrastar o cartão no Kanban muda o status")
            await pg.click('.ckcard[data-cktask="t7"] [data-ckmv="t7|1"]'); await pg.wait_for_timeout(120)
            chk(await pg.evaluate("ckTarRef('T7').status") == "bloqueada" and await pg.evaluate("ckTarRef('T7').hist.length") == 2, "o botão avança o status e o histórico guarda cada mudança")
            # formulário: ciclo recusado, esforço recalcula o CPM
            await pg.evaluate("location.hash='trabalho.lista'"); await pg.wait_for_timeout(150)
            await pg.click('tr[data-cktask="t2"] td:nth-child(3)'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("$('#dlg').open && /T2/.test($('#dlg h3').textContent) && /CPM/.test($('#dlg .ckinfo').textContent)"), "clicar na linha abre a tarefa com o CPM e o motivo da prioridade")
            await pg.check('#dlg input[name=deps][value="t4"]'); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("$('#dlg').open && !ckTarRef('T2').deps.includes('t4')"), "uma dependência que fecha ciclo é recusada")
            await pg.uncheck('#dlg input[name=deps][value="t4"]'); await pg.fill("#dlg input[name=esforco]", "6"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("ckTarRef('T2').esforco === 6 && ckC('t2').ef === ckToday() && !ckC('t3').atraso"), "menos esforço em T2 recalcula o caminho: T2 acaba hoje e T3 deixa de atrasar")
            await pg.evaluate("undo()"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("ckTarRef('T2').esforco === 14"), "Ctrl+Z desfaz a edição da tarefa")
            # delegação
            await pg.evaluate("location.hash='trabalho.equipe'"); await pg.wait_for_timeout(150)
            await pg.select_option("#ck_deleg", "t13"); await pg.wait_for_timeout(150)
            rows = await pg.evaluate("[...document.querySelectorAll('[data-ckatrib]')].map(b => b.dataset.ckatrib.split('|')[1])")
            chk(len(rows) == 4 and rows[0] != "eu", f"a delegação ordena as 4 pessoas e não sugere você em primeiro ({rows})")
            await pg.click(f'[data-ckatrib^="t13|{rows[0]}"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"ckTarRef('T13').resp === '{rows[0]}' && ckTarRef('T13').hist.at(-1).motivo === 'delegação sugerida'"), "Atribuir delega a tarefa e registra o motivo")
            await pg.evaluate("undo()")
            # PDI
            await pg.evaluate("CK.pessoa = 'm2'; location.hash='trabalho.pessoa'"); await pg.wait_for_timeout(150)
            await pg.select_option('[data-ckcomp="m2|c21|nivel"]', "2"); await pg.wait_for_timeout(120)
            chk(await pg.evaluate("ckPdi('m2').comps.find(c => c.id === 'c21').nivel === 2 && ckPdi('m2').comps.find(c => c.id === 'c21').hist.at(-1).nivel === 2"), "subir o nível de uma competência guarda o histórico (para a evolução)")
            pauta = await pg.evaluate("ckPauta1a1('m2')")
            chk(any("T3" in x or "T4" in x or "Competência" in x for x in pauta), f"a pauta do 1:1 nasce dos dados da pessoa ({pauta[:3]})")
            await pg.click('[data-ck1a1="m2"]'); await pg.wait_for_timeout(120)
            await pg.click('[data-act="ckmaadd"]'); await pg.fill('[data-ckma="0|txt"]', "Rever o método racional com o Luca"); await pg.fill('[data-ckma="0|prazo"]', "2030-01-10"); await pg.dispatch_event('[data-ckma="0|prazo"]', "change")
            await pg.click('[data-act="ckmfadd"]'); await pg.fill('[data-ckmf="0|txt"]', "Boa organização da planilha"); await pg.click('[data-act="ckmeetsave"]'); await pg.wait_for_timeout(200)
            m = await pg.evaluate("(() => { const x = ckA('ckMeet').at(-1); return { tipo: x.tipo, cod: x.cod, fb: x.feedback.length, tar: x.acoes[0]?.tarefa ? ckT().find(t => t.id === x.acoes[0].tarefa)?.resp : null }; })()")
            chk(m == {"tipo": "1a1", "cod": "M4", "fb": 1, "tar": "m2"}, f"o 1:1 guarda feedback e o compromisso vira tarefa da pessoa ({m})")
            # o PMO
            base = await pg.evaluate("({ t13: ckTarRef('T13').resp, r: ckA('ckRisk').length, n: ckT().length, p2: ckFind('ckIss', 'P2').solucoes.length })")
            await pg.evaluate("location.hash='trabalho.hoje'"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("!!document.querySelector('.ckside .ckchat #m_in')"), "o chat do PMO fica no painel lateral")
            await pg.fill("#m_in", "Quais são as minhas 3 prioridades hoje?"); await pg.press("#m_in", "Enter"); await pg.wait_for_timeout(1500)
            P = await pg.evaluate("window.__ckPrompt || ''")
            chk(all(x in P for x in ["PMO sênior em infraestrutura viária", "LINHAS VERMELHAS", "QUANDO PERGUNTAR", "CONTEXTO DO USUÁRIO", "Nome: Andrea Bianchi", "Giulia | Engenheira júnior | nível Sem experiência", "D.Lgs. 36/2023", "UNI 11337", "NTC 2018", "D.M. 19/04/2006", "ALERTAS", "T3 “Predimensionamento", "CRÍTICA", "Próximos passos"]), "o prompt junta a configuração versionada (seção 5), o contexto (seção 2) e o estado com códigos e alertas")
            nomes = await pg.evaluate("ckEquipe().filter(m => !m.eu).map(m => m.nome)")
            ctx = P.split("CONTEXTO DO USUÁRIO")[1].split("Referências normativas")[0]
            chk(all(f"- {n} |" in ctx for n in nomes) and ctx.count("\n- ") == len(nomes), f"a equipe do prompt vem só dos dados da aba (aqui, os nomes fictícios do exemplo: {nomes})")
            tools = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').at(-1).tools")
            chk(tools[:3] == ["listar_tarefas", "criar_tarefa", "atualizar_tarefa"] and "registrar_risco" in tools and len(tools) <= 10, f"as ferramentas do PMO na ordem da configuração, cortadas no limite da visualização ({tools})")
            badr = await pg.evaluate("window.__calls.find(c => c.name === 'criar_bad').r")
            chk(badr.get("ok") is False and "não existe" in badr.get("erro", ""), f"uma proposta com pessoa inexistente volta como erro para o PMO corrigir ({badr})")
            aft = await pg.evaluate("({ t13: ckTarRef('T13').resp, r: ckA('ckRisk').length, n: ckT().length, p2: ckFind('ckIss', 'P2').solucoes.length, pend: ckPendentes().length, cards: document.querySelectorAll('.ckchat .ckprop.pendente').length })")
            chk(aft["t13"] == base["t13"] and aft["r"] == base["r"] and aft["n"] == base["n"] and aft["p2"] == base["p2"] and aft["pend"] == 4 and aft["cards"] == 4, f"nada muda antes da aprovação: 4 cartões pendentes ({aft})")
            chk(await pg.evaluate("/4 propostas aguardando/.test(document.querySelector('.ckpend')?.textContent || '') && !!document.querySelector('#nav a[href=\"#trabalho\"] .nb')"), "a barra de pendências e o número no menu avisam")
            await pg.fill("#m_in", "aprova 1 e 3"); await pg.press("#m_in", "Enter"); await pg.wait_for_timeout(250)
            a1 = await pg.evaluate("(() => { const t = ckT().find(x => /Checklist verifiche/.test(x.titulo)); return { t: t ? [t.cod, t.resp, t.deps.map(d => ckT().find(z => z.id === d).cod), t.prio, t.origem?.rot] : null, r: ckA('ckRisk').at(-1).desc, t13: ckTarRef('T13').resp, pend: ckPendentes().map(x => x.p.n), calls: window.__calls.filter(c => c.kind === 'sample').length, msg: mget('ck').conversa.at(-1).content }; })()")
            chk(a1["t"] and a1["t"][1] == "m1" and a1["t"][2] == ["T3"] and a1["t"][3] == "alta" and a1["t"][4] == "PMO" and "teste" in a1["r"] and a1["t13"] == base["t13"] and a1["pend"] == [2, 4], f"“aprova 1 e 3” aplica só a tarefa e o risco; T13 continua igual ({a1})")
            chk("Aprovados" in a1["msg"] and a1["t"][0] in a1["msg"], f"a aprovação é local (sem chamar a IA) e responde com os códigos criados ({a1['msg']})")
            await pg.click('.ckchat .ckprop.pendente [data-prop$="|ok"]'); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("ckTarRef('T13').resp === 'm3' && ckTarRef('T13').hist.at(-1).por === 'PMO' && ckTarRef('T13').hist.at(-1).motivo === 'delegar (teste)'"), "o botão Aprovar aplica a delegação #2, com o histórico dizendo que veio do PMO")
            await pg.fill("#m_in", "não"); await pg.press("#m_in", "Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("ckPendentes().length === 0 && ckFind('ckIss', 'P2').solucoes.length === 0 && mget('ck').conversa.flatMap(m => m.acoes || []).filter(p => p.ck && p.status === 'descartada').length === 1"), "“não” descarta o que restava (as soluções para P2 não entram)")
            chk(await pg.evaluate("!document.querySelector('.mgrid [href=\"#mentor.ck\"]')") , "o PMO não aparece como mentor de área na página Mentores")
            await pg.evaluate("S.priv.semIA = [...(S.priv.semIA || []), 'Carreira']; render()"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("blockedMentor('ck') && document.querySelector('#m_in').disabled && /Carreira está fora da IA/.test(document.querySelector('.ckchat').textContent)"), "com Carreira fora da IA em Privacidade, o PMO não conversa")
            await pg.evaluate("S.priv.semIA = S.priv.semIA.filter(x => x !== 'Carreira'); render()")
            await pg.click('[data-act="ckchat"]'); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("!document.querySelector('.ckside') && document.querySelector('.ckwrap').classList.contains('nochat')"), "o painel do PMO fecha e as visões ocupam a largura toda")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # celular: o PMO vira gaveta; vazio mostra o começo
        b, pg, errs = await open_page(p, w=390, h=844, hash_="trabalho.hoje", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            chk(await pg.evaluate("/Comece aqui/.test(document.querySelector('.ckmain').textContent)"), "Cockpit vazio mostra como começar")
            sw = await pg.evaluate("document.documentElement.scrollWidth")
            chk(sw <= 392, f"sem rolagem horizontal no celular ({sw})")
            chk(await pg.evaluate("!document.querySelector('.ckside')"), "no celular o PMO começa fechado")
            await pg.click('.ckbar [data-act="ckchat"]'); await pg.wait_for_timeout(150)
            pos = await pg.evaluate("(a => a.getBoundingClientRect().top < document.querySelector('.ckmain').getBoundingClientRect().top)(document.querySelector('.ckside'))")
            chk(pos, "no celular o PMO abre acima das visões, na largura toda")
            chk(not errs, f"sem erros ({errs[:2]})")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
