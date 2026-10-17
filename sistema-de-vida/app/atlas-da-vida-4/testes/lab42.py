"""Atlas 4 · Rotina: preencher rápido com os modelos de nível (Básica, Intermediária, Avançada). Dados fictícios.
Um botão “Preencher” na barra da Rotina abre a lista: os modelos com nível primeiro (Básica → Intermediária → Avançada), com as horas
da semana por categoria; depois os outros modelos. “Substituir” limpa o período antes; sem substituir, só os horários livres são
ocupados. Confere semana, dia e mês, o passo único de desfazer, o seletor do painel e o celular."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

T = lambda d, a, z, t, c: [d, a, z, t, c]
MODS = [
  {"id": "mx_av", "nome": "🔴 Avançada TESTE", "nivel": "avancada", "desc": "Tudo, com estudo.", "semana": [T(1, "09:00", "12:00", "Trabalho X", "Trabalho"), T(1, "19:00", "21:00", "Estudo X", "Estudo"), T(3, "19:00", "20:00", "Estudo Y", "Estudo")]},
  {"id": "mx_ba", "nome": "🟢 Básica TESTE", "nivel": "basica", "desc": "Sem estudo.", "semana": [T(1, "09:00", "12:00", "Trabalho X", "Trabalho"), T(1, "19:00", "20:00", "Passeio X", "Lazer"), T(3, "19:00", "20:00", "Família X", "Lazer")]},
  {"id": "mx_out", "nome": "Semana qualquer TESTE", "semana": [T(5, "10:00", "11:00", "Outro X", "Outro")]},
  {"id": "mx_in", "nome": "🟡 Intermediária TESTE", "nivel": "intermediaria", "desc": "Metade do estudo.", "semana": [T(1, "09:00", "12:00", "Trabalho X", "Trabalho"), T(1, "19:00", "20:00", "Estudo X", "Estudo"), T(3, "19:00", "20:00", "Família X", "Lazer")]}]
SNAP = "JSON.stringify({ r: S.rotina, t: S.tarefas })"
DLG = "document.querySelector('#dlg[open] #rtpref')?.innerText || ''"
TOAST = "document.querySelector('#toast')?.innerText || ''"
OCC = "ds => ds.map(d => rtOcc(d).map(b => b.titulo + ' ' + b.ini).sort())"

async def abre(pg):
    await pg.click("[data-act=rtpre]"); await pg.wait_for_timeout(200)

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="rotina.semana")
        try:
            await pg.wait_for_timeout(700)
            await pg.evaluate(f"S.rotinaModelos = {json.dumps(MODS, ensure_ascii=False)}; touch('rotinaModelos', {{ noUndo: true }})")
            # um bloco avulso e uma tarefa com horário na segunda desta semana
            seg = await pg.evaluate("rtWeek(RT.d)[0]")
            await pg.evaluate("""d => { S.rotina.push({ id: 'avx', data: d, ini: '19:00', fim: '19:30', titulo: 'Avulso TESTE', cat: 'Outro', rep: '', exc: [], st: {}, notas: '' });
              S.tarefas.push({ id: 'thx', tarefa: 'Ligar para o banco às 15h', projeto: '', area: 'Finanças', prio: 'Média', prazo: d, status: 'A fazer', notas: '' }); touch('rotina', 'tarefas', { noUndo: true }); }""", seg)
            semana = await pg.evaluate("rtWeek(RT.d)")
            btn = await pg.evaluate("[...document.querySelectorAll('[data-act=rtpre]')].map(b => [b.textContent.trim(), !!b.closest('.rtbtns')])")
            chk(btn == [["Preencher", True]], f"botão “Preencher” na barra da Rotina ({btn})")
            antes = await pg.evaluate(SNAP); occ0 = await pg.evaluate(OCC, semana)
            await abre(pg)
            nomes = await pg.evaluate("[...document.querySelectorAll('#rtpref .rtpro b')].map(b => b.textContent)")
            chk(nomes[:4] == ["🟢 Básica TESTE", "🟡 Intermediária TESTE", "🔴 Avançada TESTE", "Semana qualquer TESTE"] and len(nomes) > 4, f"ordem: Básica, Intermediária, Avançada, depois os outros ({nomes[:5]})")
            t = await pg.evaluate(DLG)
            chk("Trabalho 3 h · Lazer 2 h · sem estudo" in t and "Trabalho 3 h · Estudo 3 h" in t and "Sem estudo." in t, "cada modelo mostra as horas por categoria e a descrição")
            chk(await pg.evaluate("document.querySelector('#rtpref input[name=rtpre]:checked').value") == "mx_ba" and await pg.evaluate("document.querySelector('#rt_pres')?.checked"), "abre com a Básica escolhida e “Substituir” marcado (a semana já tem blocos)")
            chk(await pg.evaluate(SNAP) == antes, "com o diálogo aberto, nada mudou")
            await pg.click("#rtprx"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(SNAP) == antes, "Cancelar não muda nada")
            # substituir a semana pela Intermediária
            await abre(pg); await pg.check("#rtpref input[value=mx_in]"); await pg.click("#rtpref [data-rtpreok]"); await pg.wait_for_timeout(300)
            occ = await pg.evaluate(OCC, semana)
            seg_occ, qua_occ = occ[0], occ[2]
            chk(seg_occ == ["Estudo X 19:00", "Trabalho X 09:00"] and qua_occ == ["Família X 19:00"] and all(o == [] for i, o in enumerate(occ) if i not in (0, 2)), f"semana substituída: só os blocos da Intermediária ({occ})")
            r = await pg.evaluate("[S.rotina.some(b => b.id === 'avx'), S.tarefas.some(t => t.id === 'thx'), S.rotina.filter(b => b.rep && b.exc?.length).length > 0 || !S.rotina.some(b => b.rep)]")
            chk(r == [False, True, True], f"o avulso sai, a tarefa com horário fica, repetições saem só desta semana ({r})")
            toast = await pg.evaluate(TOAST)
            chk("🟡 Intermediária TESTE: 3 blocos" in toast and "no lugar de" in toast, f"aviso com o que entrou e quantos saíram ({toast[:80]})")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate(SNAP) == antes and await pg.evaluate(OCC, semana) == occ0, "Ctrl+Z volta tudo num passo só")
            # sem substituir: o que conflita fica, o resto entra
            await abre(pg); await pg.check("#rtpref input[value=mx_av]"); await pg.uncheck("#rt_pres"); await pg.click("#rtpref [data-rtpreok]"); await pg.wait_for_timeout(300)
            occ = await pg.evaluate(OCC, semana); toast = await pg.evaluate(TOAST)
            chk("Avulso TESTE 19:00" in occ[0] and "Estudo X 19:00" not in occ[0] and "pulado" in toast, f"sem substituir, o horário ocupado fica e o bloco do modelo é pulado ({occ[0][:6]}, {toast[:70]})")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate(SNAP) == antes, "e também se desfaz num passo")
            # o seletor do painel também lista os de nível primeiro
            sel = await pg.evaluate("[...document.querySelectorAll('#rt_mod option')].map(o => o.textContent.split(' · ')[0])")
            chk(sel[:3] == ["🟢 Básica TESTE", "🟡 Intermediária TESTE", "🔴 Avançada TESTE"], f"o seletor de modelos do painel começa pelos níveis ({sel[:4]})")
            # vista do dia: só o dia
            await pg.evaluate("location.hash = 'rotina.dia'; RT.d = rtWeek(RT.d)[0]; render()"); await pg.wait_for_timeout(300)
            await abre(pg); await pg.check("#rtpref input[value=mx_ba]"); await pg.click("#rtpref [data-rtpreok]"); await pg.wait_for_timeout(300)
            occ = await pg.evaluate(OCC, semana)
            chk(occ[0] == ["Passeio X 19:00", "Trabalho X 09:00"] and occ[2] == occ0[2], f"vista do dia: só a segunda muda ({occ[0]})")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
            # vista do mês: todas as segundas e quartas do mês
            await pg.evaluate("location.hash = 'rotina.mes'"); await pg.wait_for_timeout(300)
            await abre(pg); await pg.check("#rtpref input[value=mx_ba]"); await pg.click("#rtpref [data-rtpreok]"); await pg.wait_for_timeout(400)
            r = await pg.evaluate("rtDias().map(d => [parse(d).getDay(), rtOcc(d).map(b => b.titulo).sort().join(','), rtAgenda(d).timed.some(e => e.a < 1200 && e.z > 1140)])")
            toast = await pg.evaluate(TOAST)
            segs = [x for x in r if x[0] == 1]; falta = [x for x in segs if "Passeio X" not in x[1]]
            seg_ok = all("Trabalho X" in x[1] for x in segs) and all(x[2] for x in falta)          # só falta o passeio onde a agenda ocupa as 19 h
            qua_ok = all(x[1] == "Família X" or x[2] for x in r if x[0] == 3); resto = all(x[1] == "" for x in r if x[0] not in (1, 3))
            pul = sum(1 for x in r if x[0] in (1, 3) and x[2])
            chk(seg_ok and qua_ok and resto and len(r) >= 28 and (f"{pul} pulado" in toast if pul else "pulado" not in toast), f"vista do mês: segundas e quartas do mês com a Básica, o resto vazio; compromisso da agenda fica e o bloco que bate com ele é pulado ({len(r)} dias, {pul} pulados, {toast[:60]!r})")
            await pg.keyboard.press("Control+z"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate(SNAP) == antes, "o mês também se desfaz num passo")
            # vazio: sem a caixa de substituir
            await pg.evaluate("location.hash = 'rotina.dia'; RT.d = addDays(TODAY, 400); render()"); await pg.wait_for_timeout(300)
            vazio = await pg.evaluate("rtOcc(RT.d).length")
            if vazio == 0:
                await abre(pg)
                chk(await pg.locator("#rt_pres").count() == 0 and "O período está vazio" in await pg.evaluate(DLG), "dia vazio: avisa que o modelo entra inteiro, sem a caixa de substituir")
                await pg.click("#rtprx")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # celular
        b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.semana")
        try:
            await pg.wait_for_timeout(700)
            await pg.evaluate(f"S.rotinaModelos = {json.dumps(MODS, ensure_ascii=False)}; touch('rotinaModelos', {{ noUndo: true }})")
            r = await pg.evaluate("(() => { const e = document.querySelector('[data-act=rtpre]').getBoundingClientRect(); return [e.left >= 0, e.right <= innerWidth, e.width > 30]; })()")
            chk(r == [True, True, True], f"390 px: o botão cabe na tela ({r})")
            await abre(pg)
            r = await pg.evaluate("(() => { const d = document.querySelector('#dlg').getBoundingClientRect(); return [Math.round(d.left), Math.round(d.right), innerWidth]; })()")
            chk(r[0] >= 0 and r[1] <= r[2], f"390 px: o diálogo cabe na tela ({r})")
            await pg.click("#rtprx")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
