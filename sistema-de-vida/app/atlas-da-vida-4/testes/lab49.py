"""Lembretes com data e hora (Secretário, Rotina, cartão, lista suspensa) que aparecem na grade, no mês, no minicalendário e no Hoje,
avisam na hora certa e vão ao Google Agenda; e o desfazer em qualquer aba: Desfazer em todo aviso de criação, aviso por cima das
janelas, histórico que sobrevive a recarregar, desfazer um passo antigo sem apagar o que veio depois, Ctrl+Z depois de recarregar."""
import asyncio, json
import harness
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
U = "data/users/u_test/"
SEED = {U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"}}
# o banco simulado sobrevive ao recarregar a página: antes de recarregar, o teste guarda o banco na sessão do navegador
harness.MOCK = "(() => { try { const s = sessionStorage.getItem('__persist'); if (s && window.__MOCKCFG) window.__MOCKCFG.seedStore = s; } catch {} })();" + harness.MOCK
TOAST = "(() => { const t = [...document.querySelectorAll('.toast')].find(x => !x.hidden); return t ? t.innerText.replace(/\\n/g, ' | ') : ''; })()"
FRASES = [
    ("Ligar para o banco amanhã às 10", ["Ligar para o banco", "2026-10-10", "10:00", ""]),
    ("Consulta 25/10 às 15h", ["Consulta", "2026-10-25", "15:00", ""]),
    ("Pagar o aluguel às 3 da tarde", ["Pagar o aluguel", "2026-10-09", "15:00", ""]),
    ("Jantar com a Ana às 8 da noite", ["Jantar com a Ana", "2026-10-09", "20:00", ""]),
    ("Dentista dia 22 às 14h30", ["Dentista", "2026-10-22", "14:30", ""]),
    ("Reunião segunda às 9", ["Reunião", "2026-10-12", "09:00", ""]),
    ("Ligar pra mãe daqui a 2 horas", ["Ligar pra mãe", "2026-10-09", "12:00", ""]),
    ("Revisar o relatório 28 de outubro às 11h", ["Revisar o relatório", "2026-10-28", "11:00", ""]),
    ("Tomar o remédio todo dia às 8", ["Tomar o remédio", "2026-10-10", "08:00", "diario"]),
    ("Reunião de equipe toda segunda às 9h30", ["Reunião de equipe", "2026-10-12", "09:30", "semanal"]),
    ("Pagar o condomínio todo dia 5", ["Pagar o condomínio", "2026-11-05", "09:00", "mensal"]),
    ("Regar as plantas hoje à noite", ["Regar as plantas", "2026-10-09", "20:00", ""]),
    ("Café da manhã com o João sexta às 7", ["Café da manhã com o João", "2026-10-16", "07:00", ""]),
    ("Estudar 2 horas amanhã", ["Estudar 2 horas", "2026-10-10", "09:00", ""]),
]

async def tick(pg, quando):
    """o aviso de lembrete começa com “Lembrete”; os outros avisos do Secretário (o que é novo no dia) não contam aqui"""
    await pg.evaluate(f"__clock.set('{quando}:00')"); await pg.evaluate("SEC.nudge = null; secTick()"); await pg.wait_for_timeout(120)
    t = await pg.evaluate("SEC.nudge?.txt || ''")
    return t if t.startswith("Lembrete") or " lembretes:" in t else ""

async def desktop(p):
    b, pg, errs = await open_page(p, w=1440, h=950, hash_="rotina", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(500)
        TS = await pg.evaluate("TODAY"); chk(TS == "2026-10-09", "o relógio do teste está na sexta, 09/10/2026, 10:00")
        # 1) a frase vira data e hora certas
        erradas = []
        for f, esp in FRASES:
            r = await pg.evaluate("t => { const P = lemParse(t); return [P.texto, P.data, P.hora, P.rep]; }", f)
            if r != esp: erradas.append((f, r))
        chk(not erradas, f"{len(FRASES)} frases viram o dia e a hora certos (3 da tarde = 15:00, 25/10, daqui a 2 horas, todo dia 5…) {erradas}")
        r = await pg.evaluate("(P => [P.achou.data, P.achou.hora])(lemParse('Ver as 3 tarefas'))")
        chk(r == [False, False], "“as 3 tarefas” não vira horário")
        r = await pg.evaluate("secParseLembrete('me lembre de ligar para o banco')")
        chk(r["quando"] == "", "sem data nem hora na frase, o Secretário continua perguntando para quando")

        # 2) Secretário: o formulário mostra Data e Hora preenchidas pela frase, e o que está nos campos vale
        await pg.evaluate("SEC.open = true; SEC.tab = 'lembretes'; secPaint()"); await pg.wait_for_timeout(200)
        await pg.fill("#lf_sec_t", "Consulta 25/10 às 15h"); await pg.wait_for_timeout(120)
        r = await pg.evaluate("[lf_sec_d.value, lf_sec_h.value, document.querySelector('[data-lemf=sec] .lemf-pv').innerText]")
        chk(r[:2] == ["2026-10-25", "15:00"] and "Consulta" in r[2] and "25 de outubro às 15:00" in r[2], f"escrever “Consulta 25/10 às 15h” preenche Data e Hora e mostra a prévia ({r})")
        await pg.fill("#lf_sec_h", "16:30"); await pg.dispatch_event("#lf_sec_h", "change"); await pg.wait_for_timeout(60)
        await pg.fill("#lf_sec_t", "Consulta 25/10 às 15h com a Dra. Paula"); await pg.wait_for_timeout(100)
        chk(await pg.evaluate("lf_sec_h.value") == "16:30", "hora mudada à mão não volta para a da frase")
        await pg.click("[data-lemsave=sec]"); await pg.wait_for_timeout(300)
        L = await pg.evaluate("secData().lembretes.map(l => [l.texto, l.quando, l.rep || '', l.origem])")
        chk(L == [["Consulta com a Dra. Paula", "2026-10-25T16:30", "", "você"]], f"salvo com o texto limpo e a data e hora dos campos ({L})")
        t = await pg.evaluate(TOAST)
        chk("Lembrete criado" in t and "Desfazer" in t, f"o aviso de criado tem Desfazer ({t})")
        chk("Consulta com a Dra. Paula" in await pg.inner_text("#secbody") and await pg.locator("#secbody [data-lemver='2026-10-25']").count() == 1, "o lembrete aparece na lista do Secretário, com “Ver na Rotina”")
        await pg.click("#secbody [data-lemver='2026-10-25']"); await pg.wait_for_timeout(450)
        chk(await pg.evaluate("[PAGE, SUB, RT.d]") == ["rotina", "dia", "2026-10-25"], "“Ver na Rotina” abre o dia do lembrete")
        H = await pg.evaluate("rtSH()")
        mk = await pg.evaluate("[...document.querySelectorAll('.rtlemp')].map(e => [e.innerText.replace(/\\n/g, ' '), parseFloat(e.closest('.rtlem').style.top)])")
        chk(mk == [["16:30 Consulta com a Dra. Paula", 16.5 * 2 * H]], f"na grade do dia, o lembrete fica exatamente às 16:30 ({mk})")
        chk("1" in await pg.evaluate("document.querySelector('.rtsd[data-rtgo=\"dia|2026-10-25\"] .rtsm').innerText"), "na faixa da semana, o dia mostra o sino com 1 lembrete")
        await pg.evaluate("location.hash = 'rotina.mes'"); await pg.wait_for_timeout(350)
        chk("16:30 Consulta com a Dra. Paula" in await pg.evaluate("document.querySelector('.rtmc[data-rtgo=\"dia|2026-10-25\"]').innerText"), "no Mês, o lembrete aparece no dia 25")
        await pg.evaluate("RT.pick = true; render()"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("!!document.querySelector('.rtmini [data-rtgo=\"dia|2026-10-25\"] i')"), "no minicalendário, o dia 25 ganha o ponto")
        await pg.evaluate("RT.pick = false; SEC.open = false; secPaint(); location.hash = 'hoje'"); await pg.wait_for_timeout(500)
        await pg.evaluate("secData().lembretes.push({ id: 'lh', texto: 'Pagar o IPTU', quando: '2026-10-11T09:00', rep: '', feito: false, avisado: false }); touch('secretario', { label: 'teste' })"); await pg.wait_for_timeout(250)
        ag = await pg.evaluate("[...document.querySelectorAll('.agi[data-rtlem]')].map(e => e.innerText.replace(/\\n/g, ' '))")
        chk(any("09:00 · Pagar o IPTU" in a for a in ag), f"o Hoje lista o lembrete nos próximos 7 dias ({ag})")
        await pg.click(".agi[data-rtlem^='lh|']"); await pg.wait_for_timeout(200)
        chk("Pagar o IPTU" in await pg.inner_text("#dlg") and await pg.evaluate("$('#dlg').open"), "tocar nele abre o cartão do lembrete")
        await pg.evaluate("$('#dlg').close()")

        # 3) Rotina › Lembretes: o novo lembrete abre em “Numa data e hora”; com repetição, aparece em cada dia
        await pg.evaluate("RT.d = TODAY; location.hash = 'rotina.semana'"); await pg.wait_for_timeout(450)
        chk(await pg.evaluate("[...document.querySelectorAll('[data-lemtipo]')].map(b => [b.dataset.lemtipo, b.getAttribute('aria-pressed')])") == [["data", "true"], ["ativ", "false"]], "no painel da Rotina, “Numa data e hora” é o padrão")
        await pg.evaluate("document.querySelector('.lsnew').open = true")
        await pg.fill("#lf_rt_t", "Tomar o remédio todo dia às 8"); await pg.wait_for_timeout(80)
        chk(await pg.evaluate("[lf_rt_d.value, lf_rt_h.value, lf_rt_r.value]") == ["2026-10-10", "08:00", "diario"], "“todo dia às 8” marca Repetir = Todo dia e começa amanhã (8h de hoje já passou)")
        await pg.click("[data-lemsave=rt]"); await pg.wait_for_timeout(300)
        rid = await pg.evaluate("secData().lembretes.find(l => l.rep === 'diario').id")
        mk = await pg.evaluate(f"[...document.querySelectorAll('.rtlemp[data-rtlem^=\"{rid}|\"]')].map(e => [e.dataset.rtlem, e.innerText.replace(/\\n/g, ' ')])")
        chk(mk == [[f"{rid}|2026-10-10", "08:00 Tomar o remédio"], [f"{rid}|2026-10-11", "08:00 Tomar o remédio"]], f"na Semana, o remédio aparece sábado e domingo às 08:00 ({mk})")
        chk(await pg.evaluate("document.querySelector('.lsnew').open") and await pg.evaluate("lf_rt_t.value") == "", "o formulário fica aberto e limpo para o próximo")
        await pg.evaluate("document.querySelector('#rtscroll').scrollTop = 7 * 2 * rtSH()"); await pg.wait_for_timeout(100)
        await pg.click(f"[data-rtlem='{rid}|2026-10-11']"); await pg.wait_for_timeout(200)
        crd = await pg.inner_text("#dlg")
        chk("Tomar o remédio" in crd and "todo dia" in crd and "Tirar só deste dia" in crd and "Apagar todos" in crd, "o cartão do lembrete diário tem Feito, Editar, Google, Tirar só deste dia e Apagar todos")
        await pg.click("#dlg [data-lemok]"); await pg.wait_for_timeout(250)
        r = await pg.evaluate(f"secData().lembretes.find(l => l.id === '{rid}').feitos")
        tdl = await pg.evaluate("(() => { const t = document.querySelector('#dlg > .toast.dlgt'); return t && !t.hidden ? t.innerText : ''; })()")
        chk(r == {"2026-10-11": 1}, f"Feito marca só aquele dia ({r})")
        chk("Desfazer" in tdl, f"com o cartão aberto, o aviso aparece dentro dele, por cima do fundo escuro ({tdl!r})")
        await pg.click("#dlg > .toast.dlgt .tbtn"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"Object.keys(secData().lembretes.find(l => l.id === '{rid}').feitos || {{}}).length") == 0, "Desfazer pelo aviso dentro do cartão funciona")
        await pg.click("#dlg [data-lemdel$='|so']"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"secData().lembretes.find(l => l.id === '{rid}').exc") == ["2026-10-11"] and await pg.locator(f"[data-rtlem='{rid}|2026-10-11']").count() == 0, "“Tirar só deste dia” tira o domingo e mantém a série")
        await pg.evaluate("document.querySelector('#rtscroll').scrollTop = 7 * 2 * rtSH()"); await pg.wait_for_timeout(100)
        await pg.click(f"[data-rtlem='{rid}|2026-10-10']"); await pg.wait_for_timeout(200)
        await pg.click("#dlg [data-lemdel]:not([data-lemdel$='|so'])"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"secData().lembretes.some(l => l.id === '{rid}')") is False and "Desfazer" in await pg.evaluate(TOAST), "Apagar todos tira a série, com Desfazer")
        await pg.click(".toast:not([hidden]) .tbtn"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"secData().lembretes.some(l => l.id === '{rid}')"), "e Desfazer traz de volta")

        # 4) lista suspensa da grade: “Lembrete aqui” abre o formulário com o dia e a hora da meia hora
        await pg.evaluate("location.hash = 'rotina.dia'; RT.d = TODAY; render()"); await pg.wait_for_timeout(400)
        s = pg.locator(f"[data-rts='{TS}|900']"); await s.scroll_into_view_if_needed(); await s.click(); await pg.wait_for_timeout(200)
        await pg.click("#rta [data-rta=lem]"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[lf_dlg_d.value, lf_dlg_h.value]") == [TS, "15:00"], "“Lembrete aqui” na lista suspensa abre o lembrete já com o dia e a hora da meia hora tocada")
        await pg.fill("#lf_dlg_t", "Ligar para o contador"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("[$('#dlg').open, secData().lembretes.at(-1).texto, secData().lembretes.at(-1).quando]") == [False, "Ligar para o contador", f"{TS}T15:00"], "Enter salva e fecha")
        chk(await pg.locator(f".rtlemp[data-rtlem$='|{TS}']").count() == 1, "e ele aparece na grade às 15:00")
        await pg.click(".rtqlem"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("$('#dlg').open && !!document.querySelector('#lf_dlg_t')"), "o botão Lembrete (na linha de criação rápida) abre o mesmo formulário")
        await pg.evaluate("$('#dlg').close()")

        # 5) avisos: na hora (ou N min antes), uma vez; o diário avisa a cada dia
        await pg.evaluate("secData().lembretes.push({ id: 'la', texto: 'Buscar o terno', quando: TODAY + 'T14:00', rep: '', min: 15, feito: false, avisado: false }); touch('secretario', { noUndo: true })")
        chk(await tick(pg, f"{TS}T13:44") == "" and not await pg.evaluate("secData().lembretes.find(l => l.id === 'la').avisado"), "13:44: ainda não (aviso 15 min antes das 14:00)")
        n1 = await tick(pg, f"{TS}T13:46")
        chk("Buscar o terno" in n1 and await pg.evaluate("[SEC.open, SEC.tab, secData().lembretes.find(l => l.id === 'la').avisado]") == [True, "lembretes", True], f"13:46: avisa e abre o Secretário nos lembretes ({n1})")
        chk(await tick(pg, f"{TS}T13:50") == "", "não repete o mesmo aviso")
        n2 = await tick(pg, "2026-10-10T08:00")
        chk("Tomar o remédio" in n2, f"sábado 08:00: o diário avisa ({n2})")
        chk(await tick(pg, "2026-10-10T08:05") == "", "uma vez por dia")
        await pg.evaluate("__clock.set('2026-10-09T10:00:00')")
        await pg.evaluate("SEC.open = true; SEC.tab = 'agora'; secPaint()"); await pg.wait_for_timeout(150)
        chk("Ligar para o contador" in await pg.inner_text("#secbody"), "o Agora do Secretário mostra os lembretes de hoje")
        await pg.evaluate("__clock.set('2026-10-12T09:00:00')")
        r = await pg.evaluate("lemAtrasados().map(x => x.l.texto + ' ' + x.d).sort()")
        chk(r == sorted(["Buscar o terno 2026-10-09", "Ligar para o contador 2026-10-09", "Pagar o IPTU 2026-10-11", "Tomar o remédio 2026-10-12"]), f"segunda 09:00: atrasados são os avulsos vencidos e só a vez de hoje do remédio diário ({r})")
        await pg.evaluate("__clock.set('2026-10-09T10:00:00')")
        await pg.evaluate("SEC.open = false; secPaint()")

        # 6) proposta da IA com repetição
        pr = await pg.evaluate("secMkProp({ tipo: 'lembrete', titulo: 'Reunião de time', quando: '2026-10-12T09:30', repetir: 'semanal', avisar_min: 10 })")
        chk([pr.get("rep"), pr.get("min")] == ["semanal", 10] and "toda segunda" in pr.get("rotulo", ""), f"a IA do Secretário pode propor lembrete que repete, com antecedência ({pr.get('rotulo')})")

        # 7) Google Agenda: evento com a repetição e o aviso; apagar tira de lá; desfazer a criação também
        n0 = await pg.evaluate("window.__calls.filter(c => c.kind === 'mcp' && c.tool === 'create_event').length")
        await pg.evaluate("SEC.open = true; SEC.tab = 'lembretes'; secPaint()"); await pg.wait_for_timeout(150)
        await pg.fill("#lf_sec_t", "Inglês toda terça às 19h"); await pg.wait_for_timeout(80)
        await pg.select_option("#lf_sec_m", "15"); await pg.check("[data-lemf=sec] .lf-g"); await pg.click("[data-lemsave=sec]"); await pg.wait_for_timeout(600)
        cr = await pg.evaluate("window.__calls.filter(c => c.kind === 'mcp' && c.tool === 'create_event').at(-1)?.input")
        gid = await pg.evaluate("secData().lembretes.find(l => l.texto === 'Inglês').id")
        chk(await pg.evaluate("window.__calls.filter(c => c.kind === 'mcp' && c.tool === 'create_event').length") == n0 + 1 and cr["summary"] == "🔔 Inglês" and cr["startTime"] == "2026-10-13T19:00:00" and cr["recurrenceData"] == ["RRULE:FREQ=WEEKLY"] and cr["overrideReminders"] == [{"method": "popup", "minutes": 15}] and f"atlas-lemb:l:{gid}" in cr["description"], f"marcado “Também no Google Agenda”: evento semanal às 19:00 com aviso de 15 min ({cr})")
        chk(await pg.evaluate(f"[!!secData().lembretes.find(l => l.id === '{gid}').gcal?.on, !!S.integ.lemGc['{gid}']]") == [True, True], "o lembrete guarda que está no Google")
        nd = await pg.evaluate("window.__calls.filter(c => c.tool === 'delete_event').length")
        await pg.click(f"#secbody [data-lemdel='{gid}']"); await pg.wait_for_timeout(500)
        chk(await pg.evaluate("window.__calls.filter(c => c.tool === 'delete_event').length") == nd + 1 and await pg.evaluate("window.__gcEv.filter(e => e.description.includes('l:" + gid + "')).length") == 0, "apagar o lembrete tira o evento do Google")
        await pg.fill("#lf_sec_t", "Dentista 30/10 às 9h"); await pg.check("[data-lemf=sec] .lf-g"); await pg.click("[data-lemsave=sec]"); await pg.wait_for_timeout(600)
        did = await pg.evaluate("secData().lembretes.find(l => l.texto === 'Dentista').id")
        chk(await pg.evaluate(f"window.__gcEv.filter(e => e.description.includes('l:{did}')).length") == 1, "lembrete avulso também vai ao Google")
        h = await pg.evaluate(f"HX.L.filter(e => !e.of && /Dentista/.test(e.l)).at(-1).h")
        await pg.evaluate(f"hxDesfazer('{h}')"); await pg.wait_for_timeout(600)
        chk(await pg.evaluate(f"[secData().lembretes.some(l => l.id === '{did}'), window.__gcEv.filter(e => e.description.includes('l:{did}')).length, !!S.integ.lemGc['{did}']]") == [False, 0, False], "desfazer a criação tira o evento do Google também (não fica evento órfão)")
        await pg.evaluate("SEC.open = false; secPaint()")

        # 8) desfazer em qualquer aba: aviso com Desfazer em criar e editar, histórico, desfazer um passo antigo
        await pg.evaluate("location.hash = 'fin.lanc'"); await pg.wait_for_timeout(400)
        await pg.evaluate("openForm('lanc')"); await pg.wait_for_timeout(150)
        await pg.fill("#dlg [name=desc]", "Mercado TESTE"); await pg.fill("#dlg [name=valor]", "42"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(250)
        chk("Desfazer" in await pg.evaluate(TOAST), "criar um lançamento: aviso com Desfazer")
        await pg.evaluate("openForm('tarefas')"); await pg.wait_for_timeout(150)
        await pg.fill("#dlg [name=tarefa]", "Ligar para o seguro TESTE"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(250)
        lid = await pg.evaluate("S.lanc[0].id")
        await pg.evaluate(f"openForm('lanc', '{lid}')"); await pg.wait_for_timeout(150)
        await pg.fill("#dlg [name=valor]", "55"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(250)
        t = await pg.evaluate(TOAST)
        chk("editado" in t and "Desfazer" in t, f"salvar uma edição também avisa, com Desfazer ({t})")
        await pg.wait_for_timeout(450)
        await pg.click("[data-act=hxopen]"); await pg.wait_for_timeout(250)
        rows = await pg.evaluate("[...document.querySelectorAll('.hxr b')].map(b => b.textContent)")
        chk(len(rows) >= 3 and "Lançamento editado(a)" in rows[0] and any("Tarefa" in r for r in rows), f"o histórico lista os passos, o mais novo em cima ({rows[:4]})")
        ht = await pg.evaluate("HX.L.find(e => /Tarefa criado/.test(e.l) && !e.of).h")
        await pg.click(f"[data-hxu='{ht}|-1']"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("[S.tarefas.length, S.lanc.map(l => l.desc + ' ' + l.valor)]") == [0, ["Mercado TESTE 55"]], "desfazer só a tarefa (um passo antigo) mantém o lançamento editado depois")
        chk("desfeito" in await pg.evaluate(f"document.querySelector('[data-hxu=\"{ht}|1\"]').closest('.hxr').innerText") and "Refazer" in await pg.evaluate(TOAST), "a linha fica marcada como desfeita, com Refazer")
        await pg.click(f"[data-hxu='{ht}|1']"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.tarefas.map(t => t.tarefa)") == ["Ligar para o seguro TESTE"], "Refazer volta a tarefa")
        await pg.fill("#hx_q", "mercado"); await pg.wait_for_timeout(150)
        chk(all("Mercado" in r or "Lançamento" in r for r in await pg.evaluate("[...document.querySelectorAll('.hxr')].map(r => r.innerText)")), "a busca do histórico filtra os passos")
        await pg.evaluate("$('#dlg').close()")
        # conflito: o passo antigo não apaga o que mudou depois
        await pg.evaluate(f"(() => {{ const l = S.lanc.find(x => x.id === '{lid}'); l.desc = 'Mercado A'; touch('lanc', {{ label: 'desc A' }}); l.desc = 'Mercado B'; touch('lanc', {{ label: 'desc B' }}); }})()")
        hA = await pg.evaluate("HX.L.filter(e => e.l === 'desc A').at(-1).h")
        await pg.evaluate(f"hxDesfazer('{hA}')"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate(f"S.lanc.find(x => x.id === '{lid}').desc") == "Mercado B" and "mudou depois" in await pg.evaluate(TOAST), "desfazer um passo cujo campo mudou de novo depois mantém o valor mais novo e avisa")
        # o Desfazer de um aviso desfaz aquele passo, mesmo com outro passo depois
        await pg.evaluate("S.compras.push({ id: 'cx1', item: 'Pão TESTE' }); touch('compras', { label: 'Compra X' }); window.__actX = hxAct(HX.ult); S.compras.push({ id: 'cy1', item: 'Leite TESTE' }); touch('compras', { label: 'Compra Y' })")
        await pg.evaluate("window.__actX.f()"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("S.compras.map(c => c.item)") == ["Leite TESTE"], "o Desfazer de um aviso antigo tira só aquele item, não o que veio depois")
        # criação sem aviso do módulo: o Atlas avisa sozinho, com Desfazer
        await pg.evaluate("document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); S.compras.push({ id: 'cz1', item: 'Café TESTE' }); touch('compras', { label: 'Compra' })"); await pg.wait_for_timeout(200)
        t = await pg.evaluate(TOAST)
        chk("Compra" in t and "Desfazer" in t, f"o que a pessoa cria sem aviso próprio do módulo ganha aviso com Desfazer ({t})")
        await pg.evaluate("S.compras.push({ id: 'cw1', item: 'Sal TESTE' }); TST.at = 0; HX.gesto = 0; touch('compras', { label: 'Sincronizado' })"); await pg.wait_for_timeout(200)
        chk("Sincronizado" not in await pg.evaluate(TOAST), "gravação em segundo plano (sem toque da pessoa) não abre aviso")
        # apagar o que antes não tinha como apagar
        await pg.evaluate("S.experimentos.push({ id: 'ex1', titulo: 'Experimento TESTE', hipotese: 'Caminhar melhora o humor', intervencao: 'Caminhar 20 min', status: 'ativo', metrica: 'bem', direcao: 'aumentar', desenho: 'alternado', bloco: 3, dias: 28, inicio: TODAY, defasagem: 0, adesao: {} }); touch('experimentos', { noUndo: true }); location.hash = 'exp'"); await pg.wait_for_timeout(450)
        await pg.click("[data-expdel='ex1']"); await pg.click("[data-expdel='ex1']"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate("S.experimentos.length") == 0 and "Desfazer" in await pg.evaluate(TOAST), "experimento agora pode ser apagado (com confirmação e Desfazer)")
        await pg.evaluate("S.rotinaModelos = [{ id: 'mm1', nome: 'Semana TESTE', semana: [[1, '09:00', '10:00', 'X', 'Outro']] }]; touch('rotinaModelos', { noUndo: true }); RT.mod = 'mm1'; location.hash = 'rotina.dia'"); await pg.wait_for_timeout(450)
        await pg.select_option("#rt_mod", "mm1"); await pg.click("[data-act=rtmoddel]"); await pg.click("[data-act=rtmoddel]"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate("S.rotinaModelos.length") == 0 and "Desfazer" in await pg.evaluate(TOAST), "modelo salvo da Rotina agora pode ser apagado (com Desfazer)")

        # 9) recarregar: o histórico continua, a seta de desfazer e o Ctrl+Z desfazem o último passo guardado
        await pg.evaluate("flush()"); await pg.wait_for_timeout(1500)
        await pg.evaluate("sessionStorage.setItem('__persist', JSON.stringify(window.__store))")
        n_hist = await pg.evaluate("hxVisiveis().length")
        await pg.reload(); await pg.wait_for_timeout(1500)
        r = await pg.evaluate("[UNDO.length, hxVisiveis().length, !document.querySelector('[data-act=undo]').disabled, document.querySelector('[data-act=undo]').title]")
        chk(r[0] == 0 and r[1] == n_hist and r[2] and "Modelo apagado" in r[3], f"depois de recarregar: memória vazia, histórico inteiro guardado e a seta de desfazer ativa, dizendo o que desfaz ({r[:3]}, {r[3]!r})")
        await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.rotinaModelos.map(m => m.nome)") == ["Semana TESTE"] and "Refazer" in await pg.evaluate(TOAST), "Ctrl+Z depois de recarregar desfaz o último passo guardado (o modelo apagado volta)")
        await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.experimentos.map(x => x.titulo)") == ["Experimento TESTE"], "Ctrl+Z de novo desfaz o passo anterior")
        await pg.keyboard.press("Control+Shift+z"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.experimentos.length") == 0, "Ctrl+Shift+Z refaz")
        # campo que era vazio: desfazer volta a vazio e refazer recoloca (sem contar como conflito)
        r = await pg.evaluate("""(() => { S.tarefas.push({ id: 'n1', tarefa: 'Nula TESTE', notas: null }); touch('tarefas', { label: 'cria' });
          S.tarefas.find(t => t.id === 'n1').notas = 'x'; touch('tarefas', { label: 'nota x' }); const h = HX.ult;
          S.lanc.push({ id: 'l9', desc: 'outro' }); touch('lanc', { label: 'outro passo' });
          const out = []; hxDesfazer(h); out.push(S.tarefas.find(t => t.id === 'n1').notas); hxDesfazer(h, 1); out.push(S.tarefas.find(t => t.id === 'n1').notas);
          S.saldoConta = 100; touch('saldoConta', { label: 'saldo' }); const h2 = HX.ult; S.lanc.push({ id: 'l10', desc: 'x' }); touch('lanc', { label: 'mais um' });
          hxDesfazer(h2); out.push(S.saldoConta); hxDesfazer(h2, 1); out.push(S.saldoConta); return out; })()""")
        chk(r == [None, "x", None, 100], f"campo que era vazio: desfazer e refazer um passo antigo funcionam ({r})")
        # duas abas abertas: ao guardar, o histórico de uma não apaga o da outra
        await pg.evaluate("(() => { const g = JSON.parse(localStorage.getItem('atlas4_hx') || '[]'); g.push({ h: 'hOUTRA', t: Date.now() - 5000, l: 'Passo da outra aba', pg: 'hoje', k: {}, s: { a: 0, r: 0, m: 0, it: [] } }); localStorage.setItem('atlas4_hx', JSON.stringify(g)); S.lanc.push({ id: 'l11', desc: 'y' }); touch('lanc', { label: 'mais um 2' }); })()")
        await pg.wait_for_timeout(600)
        chk(await pg.evaluate("JSON.parse(localStorage.getItem('atlas4_hx')).some(e => e.h === 'hOUTRA') && JSON.parse(localStorage.getItem('atlas4_hx')).some(e => e.l === 'mais um 2')"), "com duas abas abertas, o histórico guardado junta os passos das duas")
        # modo exemplo: Ctrl+Z com a memória vazia não mexe no histórico dos dados reais
        await pg.evaluate("exOn()"); await pg.wait_for_timeout(700)
        await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(250)
        await pg.evaluate("exOff()"); await pg.wait_for_timeout(700)
        chk(await pg.evaluate("S.lanc.some(l => l.id === 'l11')"), "no modo exemplo, Ctrl+Z sem nada na memória não desfaz passos dos seus dados")
        chk(not [e for e in errs if "favicon" not in e], f"sem erros no console ({errs[:3]})")
    finally:
        await pg.screenshot(path="lab49_fim.png"); await b.close()

async def celular(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(500)
        await pg.evaluate("sessionStorage.removeItem('__persist')")
        await pg.evaluate("SEC.open = true; SEC.tab = 'lembretes'; secPaint()"); await pg.wait_for_timeout(250)
        r = await pg.evaluate("(() => { const f = document.querySelector('[data-lemf=sec]'), s = document.querySelector('#sec'); return [f.scrollWidth <= f.clientWidth + 1, s.getBoundingClientRect().width <= innerWidth + 1, document.documentElement.scrollWidth <= innerWidth]; })()")
        chk(r == [True, True, True], f"celular: o formulário de lembrete cabe no Secretário, sem rolar para o lado ({r})")
        await pg.fill("#lf_sec_t", "Remédio 12/10 às 8"); await pg.click("[data-lemsave=sec]"); await pg.wait_for_timeout(250)
        await pg.evaluate("SEC.open = false; secPaint(); RT.d = '2026-10-12'; location.hash = 'rotina.dia'"); await pg.wait_for_timeout(450)
        box = await pg.evaluate("(() => { const e = document.querySelector('.rtlemp'), r = e.getBoundingClientRect(), c = e.closest('.rtcol').getBoundingClientRect(); return [Math.round(r.left) >= Math.round(c.left), Math.round(r.right) <= Math.round(c.right) + 1, Math.round(r.height)]; })()")
        chk(box[:2] == [True, True] and box[2] >= 20, f"celular: a etiqueta do lembrete fica dentro da coluna do dia e dá para tocar ({box})")
        await pg.click("[data-act=hxopen]"); await pg.wait_for_timeout(250)
        r = await pg.evaluate("(() => { const d = document.querySelector('#dlg'); return [d.open, d.getBoundingClientRect().width <= innerWidth, document.querySelectorAll('.hxr').length]; })()")
        chk(r[0] and r[1] and r[2] >= 1, f"celular: o histórico abre no botão do topo e cabe na tela ({r})")
        chk(not [e for e in errs if "favicon" not in e], f"celular: sem erros no console ({errs[:3]})")
    finally:
        await pg.screenshot(path="lab49_celular.png"); await b.close()

async def main():
    async with async_playwright() as p:
        await desktop(p)
        await celular(p)
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
