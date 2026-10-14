import asyncio, json, datetime, traceback
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, hash_="bussola")
        try:
            await pg.wait_for_timeout(400)
            chk(await pg.locator(".bmc-v").count() == 17, "bússola desenha os 17 valores")
            chk(await pg.evaluate("BM_V.length === 17 && BM_V.every(v => BM_TRAD.every(([k]) => v.t[k]) && v.acao && v.pratica && v.perg && v.falta && v.excesso && v.liga.every(id => bmV(id)))"), "cada valor tem as 5 tradições, ação, prática, pergunta, sombras e ligações válidas")
            chk(await pg.evaluate("new Set(BM_CICLO).size === 17 && BM_CICLO.every(id => bmV(id) && BM_CICLO_TXT[id])"), "o ciclo passa pelos 17 valores uma vez")
            names = ["Justiça","Respeito","Educação","Gentileza","Sabedoria","Paciência","Tolerância","Equilíbrio","Desprendimento","Consciência","Espiritualidade","Fraternidade","Igualdade","Compaixão"]
            chk(await pg.evaluate("(ns) => ns.every(n => BM_V.some(v => v.nome === n))", names), "os 14 valores do usuário estão todos lá")
            # escolher um valor na bússola (svg) e pelo teclado
            await pg.click("g.bmc-v[data-bmv='tolerancia'] circle"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("BM.sel") == "tolerancia" and "Tolerância" in await pg.locator(".bmdet h2").inner_text(), "tocar no valor da bússola abre o detalhe")
            await pg.focus("g.bmc-v[data-bmv='caridade']"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("BM.sel") == "caridade", "Enter no valor da bússola também funciona")
            # foco: máximo 3
            f0 = await pg.evaluate("bmFoco().slice()")
            await pg.click(".bmdet [data-act=bmfoco]"); await pg.wait_for_timeout(250)
            f1 = await pg.evaluate("bmFoco().slice()")
            chk(len(f1) == 3 and "caridade" in f1 and f0[0] not in f1, f"foco fica em 3: entra caridade, sai o mais antigo ({f0} → {f1})")
            # hábito
            nh = await pg.evaluate("S.habitos.length")
            await pg.click(".bmdet [data-act=bmhab]"); await pg.wait_for_timeout(250)
            h = await pg.evaluate("S.habitos.at(-1)")
            chk(await pg.evaluate("S.habitos.length") == nh + 1 and h["nome"] == "Um gesto de serviço anônimo" and "Prop" in h["area"], "virar hábito cria o hábito na área Propósito")
            await pg.click(".bmdet [data-act=bmhab]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.habitos.length") == nh + 1, "não duplica o hábito")
            # índice: conferência independente
            ex = await pg.evaluate("bmEx()"); T = await pg.evaluate("TODAY"); t = datetime.date.fromisoformat(T)
            fr = (t - datetime.timedelta(days=27)).isoformat()
            vals = [v for d, e in ex.items() if fr <= d <= T for v in (e.get("n") or {}).values() if v is not None]
            days = len([d for d in ex if fr <= d <= T])
            sc = await pg.evaluate("bmScores(28)")
            chk(abs(sc["idx"] - sum(vals) / len(vals) / 2) < 1e-12 and sc["dias"] == days, f"índice de 4 semanas = média das notas / 2 ({sum(vals) / len(vals) / 2:.3f}) e {days} noites")
            # exame
            await pg.evaluate("location.hash='bussola.exame'"); await pg.wait_for_timeout(300)
            foco = await pg.evaluate("bmFoco().slice()")
            await pg.click(f".bmnota [data-act=bmnota][data-id='{foco[0]}'][data-v='2']"); await pg.wait_for_timeout(200)
            await pg.click(f".bmnota [data-act=bmnota][data-id='{foco[1]}'][data-v='1']"); await pg.wait_for_timeout(200)
            await pg.fill("[data-bmf=vigia]", "Notei um julgamento automático no trem; nomeei e desejei bem."); await pg.dispatch_event("[data-bmf=vigia]", "change")
            await pg.fill("[data-bmf=servico]", "Ajudei um senhor com as malas."); await pg.dispatch_event("[data-bmf=servico]", "change")
            e = await pg.evaluate("bmEx()[TODAY]")
            chk(e["n"][foco[0]] == 2 and e["n"][foco[1]] == 1 and e["vigia"].startswith("Notei") and e["servico"], "exame de hoje grava notas e textos")
            await pg.click(f".bmnota [data-act=bmnota][data-id='{foco[0]}'][data-v='2']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"bmEx()[TODAY].n['{foco[0]}']") is None, "tocar de novo na mesma nota desfaz")
            await pg.click("[data-act=bmdiario]"); await pg.wait_for_timeout(300)
            de = await pg.evaluate("S.diario.find(x => x.origem === 'bussola' && x.data === TODAY)")
            chk(de and de["semIA"] is True and "#bussola" in de["texto"] and "## Vigilância" in de["texto"], "guardar no diário cria entrada marcada como fora da IA")
            await pg.click("[data-act=bmdiario]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("S.diario.filter(x => x.origem === 'bussola' && x.data === TODAY).length") == 1, "guardar de novo atualiza, não duplica")
            await pg.click("[data-act=bmdia][data-k='-1']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("BM.dia") == (t - datetime.timedelta(days=1)).isoformat(), "navegar para a noite anterior")
            await pg.evaluate("BM.dia = null")
            # decidir
            await pg.evaluate("location.hash='bussola.decidir'"); await pg.wait_for_timeout(300)
            await pg.fill("[data-bmd=t]", "Aceitar convite para o iftar do vizinho"); await pg.fill("[data-bmd=sit]", "O vizinho muçulmano convidou para jantar no Ramadã.")
            await pg.fill("[data-bmdq=troca]", "Se fosse um vizinho espírita, eu iria sem pensar.")
            await pg.click("[data-act=bmdval][data-id='tolerancia']"); await pg.wait_for_timeout(200)
            chk((await pg.evaluate("BM.draft.sit")).startswith("O vizinho"), "texto digitado sobrevive ao toque nos valores")
            n0 = await pg.evaluate("window.__calls.length")
            await pg.click("[data-act=bmdai]"); await pg.wait_for_timeout(2500)
            pr = await pg.evaluate("(n0) => { const c = window.__calls.slice(n0).find(c => c.kind === 'sample'); return c ? String(c.input) : ''; }", n0)
            chk("TAREFA: BUSSOLA MORAL" in pr and "iftar" in pr and "Tolerância" in pr and "CVV 188" in pr, "IA recebe o dilema, os valores e a instrução de cuidado")
            ex_in_prompt = await pg.evaluate("(pr) => Object.values(bmEx()).some(e => e.vigia && pr.includes(e.vigia))", pr)
            chk(not ex_in_prompt, "o exame da noite não vai para a IA")
            chk(len(await pg.evaluate("BM.ai")) > 20 and await pg.evaluate("S.auditoria[0].recurso") == "Bússola moral", "resposta aparece e a leitura entra no registro de Privacidade")
            await pg.fill("[data-bmd=dec]", "Ir ao jantar e levar um doce."); await pg.click("[data-act=bmdsave]"); await pg.wait_for_timeout(300)
            d = await pg.evaluate("bmDec().at(-1)")
            chk(d["t"].startswith("Aceitar") and d["vals"] == ["tolerancia"] and d["q"]["troca"] and d["ia"] and d["dec"].startswith("Ir"), "decisão guardada com respostas, valores e o olhar da IA")
            await pg.evaluate("(() => { const x = bmDec().at(-1); x.data = addDays(TODAY, -8); BM.open = x.id; render(); })()"); await pg.wait_for_timeout(300)
            await pg.fill(f"[data-bmrev='{d['id']}']", "Fui; foi uma noite bonita e aprendi sobre o jejum."); await pg.click(f"[data-act=bmrnota][data-id='{d['id']}'][data-v='5']"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("bmDec().at(-1).rev.nota") == 5, "revisitar depois de uma semana grava o que a decisão plantou")
            # caminhos
            await pg.evaluate("location.hash='bussola.caminhos'"); await pg.wait_for_timeout(300)
            tx = await pg.locator("#main").inner_text()
            chk(await pg.locator(".bmcam").count() == 5 and "188" in tx and "Kang" in tx, "cinco caminhos, com o aviso de cuidado e as fontes")
            # hoje
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(300)
            dv = await pg.evaluate("bmDayValue().nome")
            ht = await pg.locator("#main").inner_text()
            chk("Bússola de hoje" in ht and dv in ht and "Exame de hoje feito" in ht, f"Hoje mostra o valor do dia ({dv}) e o exame feito")
            # persistência
            await pg.evaluate("flushSoon(0)"); await pg.wait_for_timeout(600)
            st = await pg.evaluate("Object.keys(window.__store).filter(k => /s_(bussola|bmExames|bmDecisoes)/.test(k))")
            chk(len(st) == 3, f"três chaves gravadas no banco ({st})")
            chk(not errs, f"sem erros no console ({errs[:2]})")
        except Exception as e:
            bad += 1; print("FAIL exceção", e); traceback.print_exc(limit=2)
        await b.close()
        b, pg, errs = await open_page(p, w=390, h=844, hash_="bussola")
        await pg.wait_for_timeout(400)
        ov = await pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        chk(ov[0] <= ov[1], f"celular: sem rolagem lateral ({ov})")
        await b.close()
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
