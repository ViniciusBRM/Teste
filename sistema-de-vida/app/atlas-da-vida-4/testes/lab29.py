"""Correções da auditoria: virada do dia com o app aberto (data, mês de referência, Rotina, Captura e Painel acompanham;
rascunho do Painel fica no dia em que foi escrito; espera o campo em edição); relógio fixo dos testes e o fim de semana
(Cockpit conta do próximo dia útil; sobrecarga com o tempo livre do sábado); minhas tarefas do Cockpit no Hoje, no Secretário
(com a sobrecarga do trabalho pela capacidade do Cockpit), na Rotina, no Painel do dia e no Fechamento, e o interruptor em
Ajustes; o “ok” do Cockpit só aprova o lote mais recente; Google Agenda com hora local; erros que não somem calados (modo
exemplo sem salvar, cofre, radar, jardim); Contexto do Cockpit no celular; diagonal dos Cruzamentos sem botões mudos;
fontes espíritas; uma frase no Painel paga uma ocorrência da conta."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

async def virada(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hab.marcar", cfg={"now": "2026-10-07T23:59:30"})
    try:
        await pg.wait_for_timeout(600)
        s0 = await pg.evaluate("[TODAY, REF, RT.d, CAP.data, PD.date, VER]")
        chk(s0[:5] == ["2026-10-07", "2026-09", "2026-10-07", "2026-10-07", "2026-10-07"], f"abre às 23:59 de 07/10: data, mês do relatório (regra da 1ª semana), Rotina, Captura e Painel no dia ({s0[:5]})")
        h = await pg.evaluate("S.habitos[0].id")
        await pg.click(f'[data-mark="{h}|2026-10-07"]'); await pg.wait_for_timeout(150)
        await pg.evaluate("PD.text = 'rascunho da noite'; pdStore()")
        # passa da meia-noite com um campo em edição: não redesenha embaixo da pessoa
        await pg.evaluate("(() => { const i = document.createElement('input'); i.id = 'tmpin'; document.querySelector('#main').append(i); i.focus(); })()")
        await pg.evaluate("__clock.shift(60e3); window.dispatchEvent(new Event('focus'))"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("TODAY") == "2026-10-07", "com um campo em edição, a virada espera")
        await pg.evaluate("document.querySelector('#tmpin').blur()"); await pg.wait_for_timeout(500)
        s1 = await pg.evaluate("[TODAY, REF, RT.d, CAP.data, PD.date, VER, document.querySelector('#toast')?.textContent || '']")
        chk(s1[:4] == ["2026-10-08", "2026-10", "2026-10-08", "2026-10-08"], f"ao sair do campo: o dia vira, o mês do relatório sai da regra da 1ª semana, Rotina e Captura acompanham ({s1[:4]})")
        chk(s1[4] == "2026-10-07" and "rascunho do Painel do dia continua em 07/10" in s1[6], f"o rascunho do Painel fica no dia em que foi escrito, com aviso ({s1[4]}, {s1[6]!r})")
        chk(s1[5] > s0[5] and "Novo dia" in s1[6], "os cálculos são refeitos (VER sobe) e a pessoa é avisada")
        await pg.click(f'[data-mark="{h}|2026-10-08"]'); await pg.wait_for_timeout(150)
        m = await pg.evaluate(f"[!!S.marks['{h}|2026-10-07'], !!S.marks['{h}|2026-10-08']]")
        chk(m == [True, True], f"o hábito marcado depois da meia-noite vai para 08/10 e o de 07/10 fica ({m})")
        # Painel vazio acompanha o dia
        await pg.evaluate("PD = pdNew(); pdStore(); __clock.shift(864e5); document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(400)
        s2 = await pg.evaluate("[TODAY, PD.date, document.querySelector('#toast')?.textContent || '']")
        chk(s2[0] == "2026-10-09" and s2[1] == "2026-10-09" and "rascunho" not in s2[2], f"ao voltar para a aba no dia seguinte, o Painel vazio já abre no dia novo ({s2[:2]})")
        chk(not errs, f"sem erros na virada ({errs[:2]})")
    finally:
        await b.close()

async def fim_de_semana(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho.hoje", cfg={"now": "2026-10-10T10:00:00"})
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("[TODAY, parse(TODAY).getDay(), ckUtil(TODAY), ckToday(), String(ckFacts()).includes('não é dia útil; o próximo é')]")
        chk(r == ["2026-10-10", 6, False, "2026-10-12", True], f"sábado fixo: o Cockpit conta a partir do próximo dia útil e diz isso ao PMO ({r})")
        await pg.evaluate("for (let k = 0; k < 6; k++) S.tarefas.push({ id: 'sw' + k, tarefa: 'Tarefa ' + k, prio: 'Baixa', prazo: TODAY, status: 'A fazer' }); touch('tarefas')"); await pg.wait_for_timeout(150)
        r = await pg.evaluate("""(() => { const sab = rtDia(TODAY).livre || 0, qua = rtDia('2026-10-07').livre || 0, n = S.tarefas.filter(t => t.status !== 'Concluída' && t.status !== 'Cancelada' && t.prazo && t.prazo <= TODAY).length;
            return [sab, qua, n, secConflitos().some(c => c.chave.startsWith('sobrecarga:'))]; })()""")
        chk(r[0] > r[1] and r[3] == (r[2] >= 4 and r[2] * 45 > r[0]), f"sábado: mais tempo livre que na quarta, e a sobrecarga segue a regra com ele ({r[0]} × {r[1]} min; {r[2]} tarefas; decisão {r[3]})")
        chk(not errs, f"sem erros no sábado ({errs[:2]})")
    finally:
        await b.close()

async def cockpit_fora(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje")
    try:
        await pg.wait_for_timeout(600)
        ids = await pg.evaluate("""(() => { const eu = ckEu(), mk = (titulo, resp, prazo, esforco) => ckNovaTarefa({ titulo, resp, prazo, esforco });
            const A = mk('Revisar relazione geotecnica', eu, TODAY, 5), B = mk('Inviare computo metrico', eu, addDays(TODAY, -2), 4), C = mk('Tarefa do colega', 'm1', TODAY, 3), D = mk('Minha de amanhã', eu, addDays(TODAY, 1), 2);
            touch('ckTar'); return { A: A.id, B: B.id, C: C.id, D: D.id, Ac: A.cod, Bc: B.cod, Dc: D.cod }; })()""")
        await pg.wait_for_timeout(250)
        wk0 = await pg.evaluate("weekNums(weekStart(TODAY)).tarefas")
        hj = await pg.evaluate("[...document.querySelectorAll('#main [data-ckdone]')].map(i => [i.dataset.ckdone, i.checked, i.closest('label').textContent])")
        chk([x[0] for x in hj] == [ids["B"], ids["A"]] and all("Trabalho · " in x[2] for x in hj) and "atrasada" in hj[0][2] and "vence hoje" in hj[1][2], f"Hoje: as minhas do Cockpit que vencem até hoje entram em Para hoje, marcadas como Trabalho; a do colega e a de amanhã não ({[x[2][:60] for x in hj]})")
        pess = await pg.evaluate("calcAt(mkey(TODAY)).tar.filter(t => t.open && t.prazo && t.prazo <= TODAY).length")
        lead = await pg.evaluate("document.querySelector('.hjlead').textContent")
        chk(f"{pess + 2} tarefas vencem até hoje" in lead, f"o resumo do dia soma as pessoais e as do trabalho ({pess} + 2): {lead!r}")
        await pg.click(f'#main [data-ckdone="{ids["A"]}"]'); await pg.wait_for_timeout(250)
        a = await pg.evaluate(f"(() => {{ const t = S.ckTar.find(x => x.id === '{ids['A']}'); return [t.status, t.concluida, t.feito, t.hist.at(-1).depois.status, !!document.querySelector('#main [data-ckdone=\"{ids['A']}\"]:checked')]; }})()")
        chk(a == ["concluída", "2026-10-09", 100, "concluída", True], f"concluir no Hoje é o mesmo clique do Cockpit: status, data, 100% e histórico ({a})")
        await pg.click(f'#main [data-ckdone="{ids["A"]}"]'); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"S.ckTar.find(x => x.id === '{ids['A']}').status") == "a fazer", "desmarcar no Hoje reabre a tarefa")
        # Secretário
        si = await pg.evaluate("secItems().filter(i => i.area === 'Trabalho').map(i => [i.id, i.st, i.acts.map(a => a[1])[0], i.go])")
        chk(si == [["ck:" + ids["B"], "crit", "ckdone|" + ids["B"], "trabalho.hoje"], ["ck:" + ids["A"], "warn", "ckdone|" + ids["A"], "trabalho.hoje"]], f"Secretário: a atrasada como crítica e a de hoje como atenção, com Concluí ({si})")
        cf = await pg.evaluate("""(() => { const eu = (S.ck.membros || []).find(m => m.eu), ts = ckMinhasAte(TODAY).map(x => S.ckTar.find(t => t.id === x.id)), dem = sum(ts.map(ckRem)), cap = ckHpdOf(eu, S.ck.cfg || {});
            const c = secConflitos().find(x => x.chave.startsWith('sobrecarga-trab:')); return [ts.length, dem, cap, c ? c.txt : null, secConflitos().some(x => x.chave.startsWith('sobrecarga:'))]; })()""")
        chk(cf[0] == 2 and cf[1] == 9 and ((cf[3] is not None) == (cf[1] > cf[2])) and (cf[3] is None or "2 tarefas do Cockpit vencem" in cf[3]), f"sobrecarga do trabalho pelas horas restantes contra a capacidade do Cockpit ({cf[:4]})")
        await pg.evaluate(f"secDo('ckdone|{ids['A']}')"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate(f"S.ckTar.find(x => x.id === '{ids['A']}').status") == "concluída", "Concluí no Secretário conclui no Cockpit")
        # Rotina
        rt = await pg.evaluate("[rtAgenda(TODAY).tar.map(t => t.tarefa), rtAgenda(addDays(TODAY, 1)).tar.map(t => t.tarefa)]")
        chk(not any("colega" in t for t in rt[0]) and f"{ids['Dc']} · Minha de amanhã" in rt[1], f"Rotina: a minha de amanhã aparece no dia dela; a do colega não ({rt[1][-2:]})")
        # Painel do dia
        pdl = await pg.evaluate("PD = pdNew(); pdTarefasDia(TODAY).map(t => [t.ck ? 1 : 0, t.tarefa])")
        flags = [x[0] for x in pdl]
        chk(flags == sorted(flags) and flags.count(1) == 1 and pdl[-1][1].startswith(ids["Bc"]), f"Painel do dia: as pessoais primeiro e depois a minha do Cockpit em aberto ({pdl[-2:]})")
        rows = await pg.evaluate(f"PD.chk.tdone['{ids['B']}'] = 1; pdRows().filter(r => r.id === 't.done.{ids['B']}').map(r => [r.txt, r.dest])")
        chk(rows == [[f"Tarefa concluída: {ids['Bc']} · Inviare computo metrico", "ckTar"]] and await pg.evaluate("PD_DEST.ckTar[1]") == "trabalho.hoje", f"marcar no Painel vira a linha da aba do Cockpit ({rows})")
        # o Painel exige humor e sono para salvar: vêm do texto, como no uso real
        await pg.evaluate("PD.text = 'Dormi 7 horas, humor 4.'; pdParse(); pdSave()"); await pg.wait_for_timeout(400)
        bb = await pg.evaluate(f"(() => {{ const t = S.ckTar.find(x => x.id === '{ids['B']}'); return [t.status, t.concluida]; }})()")
        chk(bb == ["concluída", "2026-10-09"], f"salvar o Painel conclui a tarefa no Cockpit com a data do Painel ({bb})")
        wk1 = await pg.evaluate("weekNums(weekStart(TODAY)).tarefas")
        chk(wk1 == wk0 + 2, f"Fechamento da semana: as duas concluídas do trabalho entram na conta ({wk0} → {wk1})")
        # interruptor
        await pg.evaluate("ckNovaTarefa({ titulo: 'Mais uma para hoje', resp: ckEu(), prazo: TODAY, esforco: 1 }); touch('ckTar'); location.hash = 'hoje'"); await pg.wait_for_timeout(300)
        on = await pg.evaluate("document.querySelectorAll('#main [data-ckdone]:not(:checked)').length")
        await pg.evaluate("location.hash = 'ajustes'"); await pg.wait_for_timeout(300)
        box = await pg.evaluate("document.querySelector('#cfg_ckVida')?.checked")
        await pg.click("#cfg_ckVida"); await pg.wait_for_timeout(200)
        await pg.evaluate("location.hash = 'hoje'"); await pg.wait_for_timeout(300)
        off = await pg.evaluate("[S.cfg.ckVida, document.querySelectorAll('#main [data-ckdone]').length, secItems().filter(i => i.area === 'Trabalho').length, rtAgenda(TODAY).tar.filter(t => t.ck).length, pdTarefasDia(TODAY).filter(t => t.ck).length]")
        chk(on == 1 and box is True and off == [False, 0, 0, 0, 0], f"Ajustes → Cockpit de Trabalho: ligado por padrão; desligado, some de Hoje, Secretário, Rotina e Painel ({on}, {box}, {off})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def ok_cockpit(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho.hoje")
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("""(() => { const m = mstate('ck'), pend = (t, n) => ({ id: uid(), ck: true, tipo: 'criar_tarefa', raw: { titulo: t }, status: 'pendente', n });
            m.conversa.push({ role: 'assistant', content: 'Uma proposta.', at: Date.now(), acoes: [pend('Proposta antiga X', 1)] }, { role: 'user', content: 'e mais?', at: Date.now() },
              { role: 'assistant', content: 'Duas novas.', at: Date.now(), acoes: [pend('Proposta nova Y1', 1), pend('Proposta nova Y2', 2)] });
            const has = t => ckT().some(x => x.titulo === t), r = ckIntercept('ok');
            return [r, has('Proposta nova Y1'), has('Proposta nova Y2'), has('Proposta antiga X'), m.conversa.at(-1).content, ckPendentes().length]; })()""")
        chk(r[:4] == [True, True, True, False] and r[5] == 1, f"“ok” aprova só as propostas da mensagem mais recente ({r[:4]}, pendentes {r[5]})")
        chk("Uma proposta anterior continua esperando" in r[4], f"e avisa a que ficou esperando ({r[4]!r})")
        r2 = await pg.evaluate("[ckIntercept('ok'), ckT().some(x => x.titulo === 'Proposta antiga X'), ckPendentes().length]")
        chk(r2 == [True, True, 0], f"um segundo “ok” aprova a que ficou ({r2})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def agenda(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="idiomas", cfg={"tz": "Europe/Rome"})
    try:
        await pg.wait_for_timeout(600)
        await pg.evaluate("gcSync()"); await pg.wait_for_timeout(600)
        le = await pg.evaluate("[window.__calls.find(c => c.tool === 'list_events')?.input, addDays(TODAY, -1), addDays(TODAY, 30)]")
        i, de, ate = le
        chk(i and i["startTime"] == de + "T00:00:00" and i["endTime"] == ate + "T23:59:59" and i["timeZone"] == "Europe/Rome", f"lista eventos com hora local, sem “Z”, e o fuso à parte ({i and [i['startTime'], i['endTime'], i['timeZone']]})")
        await pg.evaluate("gcCriarEstudo()"); await pg.wait_for_timeout(800)
        ce = await pg.evaluate("window.__calls.filter(c => c.tool === 'create_event').map(c => c.input)")
        evs = await pg.evaluate("Object.fromEntries((S.eventos || []).filter(e => /^Estudo · /.test(e.titulo)).map(e => [e.data, [e.hora, e.fim]]))")
        okf = len(ce) > 0 and all("Z" not in c["startTime"] and "Z" not in c["endTime"] and c["timeZone"] == "Europe/Rome" for c in ce)
        okh = all(evs.get(c["startTime"][:10]) == [c["startTime"][11:16], c["endTime"][11:16]] for c in ce)
        chk(okf and okh, f"cria os blocos de estudo com a mesma hora local que o Atlas guarda ({len(ce)} blocos; {[c['startTime'] for c in ce[:2]]})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def erros(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje", cfg={"realBoot": True, "denyWrite": "data/users/u_test/s_tarefas"})
    try:
        await pg.wait_for_timeout(700)
        await pg.evaluate("S.tarefas.push({ id: 'zz1', tarefa: 'Não salva', prio: 'Média', prazo: TODAY, status: 'A fazer' }); touch('tarefas')"); await pg.wait_for_timeout(200)
        await pg.evaluate("exOn()"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("[EX_MODE, dirty.has('tarefas'), S.tarefas.some(t => t.id === 'zz1'), document.querySelector('#toast')?.textContent || '']")
        chk(r[0] is False and r[1] and r[2] and "Não consegui salvar" in r[3], f"o modo exemplo não liga com mudanças sem salvar: elas ficam na tela e na fila ({r})")
    finally:
        await b.close()
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="diario")
    warns = []
    pg.on("console", lambda m: m.type == "warning" and warns.append(m.text))
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("""(async () => { S.diario.push({ id: 'cx1', data: TODAY, titulo: '', texto: '', cifra: { iv: 'AAAAAAAAAAAAAAAA', ct: 'AAAA' } });
            const esp = S.diario.filter(e => e.cifra && !COFRE.plain.has(e.id)).length, n = await cofreDecryptAll(); return [esp, n, document.querySelector('#toast')?.textContent || '']; })()""")
        chk(r[1] == r[0] and r[1] >= 1 and (f"{r[1]} entrada protegida não abriu" in r[2] or f"{r[1]} entradas protegidas não abriram" in r[2]), f"o cofre diz quantas entradas não abriram com a senha ({r})")
        await pg.evaluate("window.__rs = radarSync; radarSync = () => { throw new Error('radar de teste'); }; location.hash = 'radar'"); await pg.wait_for_timeout(400)
        await pg.evaluate("radarSync = window.__rs; window.__ja = jdAsks; jdAsks = () => { throw new Error('jardim de teste'); }; secItems(); jdAsks = window.__ja"); await pg.wait_for_timeout(200)
        chk(any("radar" in w for w in warns) and any("jardim" in w for w in warns) and not errs, f"erros no radar e no jardim vão para o console sem quebrar a tela ({warns[:2]}, {errs[:1]})")
    finally:
        await b.close()

async def telas(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="trabalho.contexto")
    try:
        await pg.wait_for_timeout(800)
        o = await overflow(pg)
        chk(o[0] <= o[1], f"celular: Contexto do Cockpit sem rolagem lateral ({o})")
    finally:
        await b.close()
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="cruz")
    try:
        await pg.wait_for_timeout(800)
        r = await pg.evaluate("""[[...document.querySelectorAll('#main button, #main [role="button"]')].filter(b => b.offsetParent && !(b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent.trim() || b.getAttribute('aria-labelledby'))).length,
            [...document.querySelectorAll('.cc.diag')].every(e => e.tagName === 'SPAN'), document.querySelectorAll('.cc.diag').length, document.querySelectorAll('button.cc[data-cx]').length]""")
        chk(r[0] == 0 and r[1] and r[2] > 0 and r[3] > 0, f"Cruzamentos: a diagonal são células, não botões sem nome; os cruzamentos continuam clicáveis ({r})")
        t = await pg.evaluate("[cfBase(), JSON.stringify(J_PIL.esp.cat), CF.map(c => c.fonte).join('|')]")
        chk("Conflitos da alma" in t[0] and "1ª parte, cap. II" in t[0] and "cap. 2, A epífise" in t[0] and "ministro Clarêncio" in t[1] and t[2].count("cap. XX (Conflitos da alma)") == 7, "fontes espíritas com capítulo e título conferidos")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def conta(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="painel")
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("""(() => { S.contasCasa.push({ id: 'cxt', conta: 'Mensalidade do clube', cat: 'Clube', valor: 30, venc: addDays(TODAY, 2), periodo: 'Mensal' }); touch('contasCasa');
            const occ = pdCasaDia(TODAY).contas.filter(x => x.c.id === 'cxt').map(x => x.v);
            PD = pdNew(); PD.text = 'Paguei a mensalidade do clube.'; pdParse();
            return [occ, pdRows().filter(r => r.txt.startsWith('Conta paga: Mensalidade do clube')).length, Object.keys(PD.chk.conta).filter(k => k.startsWith('cxt|'))]; })()""")
        chk(len(r[0]) == 2 and r[1] == 1 and r[2] == ["cxt|" + r[0][0]], f"com duas ocorrências em aberto, “paguei” paga uma só, a mais antiga ({r})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        await virada(p)
        await fim_de_semana(p)
        await cockpit_fora(p)
        await ok_cockpit(p)
        await agenda(p)
        await erros(p)
        await telas(p)
        await conta(p)
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
