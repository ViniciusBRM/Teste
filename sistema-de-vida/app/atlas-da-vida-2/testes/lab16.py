"""Roteiro de áudio do Painel do dia: 13 blocos com frases-modelo montadas com os dados da pessoa; falar o roteiro inteiro preenche
todas as abas (saúde, dinheiro, casa, hábitos, tarefas, rotina, pessoas, estudo e idiomas, leitura, jornada, exame da Bússola, lazer,
diário); status ao vivo, um bloco por vez, copiar e baixar; sem duplicar a conta paga; celular."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="painel")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(400)
            await pg.evaluate("PD = pdNew(); render()"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelectorAll('.pdrl li').length") == 13, "13 blocos na lista")
            ex = await pg.evaluate("pdRotBlocks().map(b => b.ex)")
            chk(any("Fiz limpeza pesada do banheiro" in e for e in ex) and any("Concluí enviar tradução juramentada" in e for e in ex) and any("Master BIM" in e for e in ex), "as frases-modelo usam a casa, as tarefas e os livros da pessoa")
            # gravar: o botão liga o microfone do campo “Conte o dia”
            await pg.click("[data-act=pdrrec]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("VOZ.on") in ("texto", None), "Gravar as respostas aciona o microfone do campo do dia (ou o aviso de ditado)")
            await pg.evaluate("stopVoice(); render()")
            # status ao vivo enquanto se escreve
            await pg.fill("#pd_txt", "Dormi 7 e meia, humor 4."); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("document.querySelector('.pdrl li:nth-child(2)').classList.contains('ok')"), "o bloco Sono e corpo acende ao vivo")
            # o roteiro inteiro, falado
            n0 = await pg.evaluate("({ lanc: S.lanc.length, tar: S.tarefas.filter(t => t.status === 'Concluída').length })")
            await pg.evaluate("PD = pdNew(); PD.text = pdRotBlocks().map(b => b.ex).join(' '); pdParse(); render()"); await pg.wait_for_timeout(300)
            st = await pg.evaluate("pdRotBlocks().filter(b => !b.st[0]).map(b => b.id)")
            chk(st == [], f"falando os 13 exemplos, os 13 blocos ficam capturados {st}")
            rows = await pg.evaluate("pdRows().map(r => r.txt)")
            need = ["Sono: 7,5 h", "Treino: Corrida · 30 min", "Receita de € 2.800,00", "Aporte de € 200,00", "Tarefa concluída: Enviar tradução juramentada", "Casa: Limpeza pesada do banheiro feita", "Conta paga: Condomínio", "Exame da noite: Paciência pratiquei", "Contato: Pai · Ligação · 20 min", "Inglês: 30 min", "Italiano: 15 min", "Prática: Meditação · 15 min", "Lazer: Cinema", "Peso: 72,5 kg"]
            miss = [n for n in need if not any(n in r for r in rows)]
            chk(not miss, f"cada resposta vira a linha da aba certa (faltou: {miss})")
            rt = await pg.evaluate("Object.values(PD.rt).map(x => x.st).sort()")
            chk(rt == ["feito", "pulado", "pulado"], f"“fiz… , pulei…” separa feito e pulado ({rt})")
            chk(not any("condom" in (r or "").lower() and r.startswith("Despesa") for r in rows), "a conta paga não vira gasto em dobro")
            await pg.evaluate("pdSave()"); await pg.wait_for_timeout(400)
            D = await pg.evaluate("""(() => { const d = TODAY; return { sono: S.saude[d]?.sono, bm: bmEx()[d]?.n, rot: S.rotina.filter(b => b.st?.[d]).length, tar: S.tarefas.filter(t => t.status === 'Concluída').length, lanc: S.lanc.length, conta: (S.contasCasa || []).some(c => Object.values(c.pagos || {}).includes(d)), ent: S.diario.some(e => e.data === d && e.origem === 'painel'), est: S.estudo.filter(x => x.data === d).length }; })()""")
            chk(D["sono"] == 7.5 and D["bm"] == {"paciencia": 2, "humildade": 1, "igualdade": 0} and D["rot"] >= 3 and D["tar"] == n0["tar"] + 1 and D["conta"] and D["ent"] and D["est"] >= 2, f"salvar grava em todas as abas {D}")
            chk(D["lanc"] == n0["lanc"] + 5, f"lançamentos: 2 gastos, 1 receita, 1 aporte e a conta = 5 novos ({D['lanc'] - n0['lanc']})")
            # um bloco por vez, copiar e baixar
            await pg.evaluate("render()"); await pg.click("[data-act=pdrtele]"); await pg.wait_for_timeout(150); await pg.click("[data-act=pdrnext]"); await pg.wait_for_timeout(150)
            chk("2 de 13" in await pg.inner_text(".pdtele") and "Sono e corpo" in await pg.inner_text(".pdtele"), "um bloco por vez avança")
            tx = await pg.evaluate("pdRotText()")
            chk(tx.count("\n   Exemplo:") == 13 and "ROTEIRO DE ÁUDIO" in tx, "o texto do roteiro tem os 13 blocos para copiar ou baixar")
            # marcação manual do exame
            await pg.evaluate("PD = pdNew(); PDR.tele = false; render()"); await pg.wait_for_timeout(150)
            await pg.click("[data-pdbm='paciencia|1']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("PD.bm.paciencia?.v") == 1 and await pg.evaluate("pdRows().some(r => r.id === 'b.exame')"), "o exame também pode ser marcado na tela")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=390, hash_="painel")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(400)
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px: sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
