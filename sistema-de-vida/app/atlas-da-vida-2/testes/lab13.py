"""Painel do dia com todas as abas, notícias pelo feed do banco, Mandala e Bússola que crescem, Google Calendar (leitura e criação de blocos de estudo)."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
T = datetime.date.today(); TS = T.isoformat(); U = "data/users/u_test/"
D = lambda n: (T + datetime.timedelta(days=n)).isoformat()
SEED = {U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}},
        U + "s_pessoas": {"at": 1, "v": [{"id": "p1", "nome": "Mãe", "relacao": "Família", "freq": 7}]},
        U + "s_tarefas": {"at": 1, "v": [{"id": "t1", "tarefa": "Pagar o condomínio", "prazo": D(-1), "status": "A fazer", "prio": "Alta"}]},
        U + "s_aprend": {"at": 1, "v": [{"id": "a1", "titulo": "Il nome della rosa", "tipo": "Livro", "status": "Em andamento", "total": 500, "atual": 100}]},
        U + "s_rotinas": {"at": 1, "v": [{"id": "r1", "rotina": "Limpar o banheiro", "nivel": "Média", "freq": 7, "ultima": D(-9), "min": 30}]},
        U + "s_contasCasa": {"at": 1, "v": [{"id": "k1", "conta": "Internet", "cat": "Internet / telefone", "valor": 27.9, "periodo": "Mensal", "venc": TS, "debito": "Sim"}]},
        "feed/hoje": {"dia": TS, "hora": "06:45", "news": [{"src": "Positive News", "t": "Notícia do feed gravado", "link": "https://example.org/f", "data": TS, "d": "resumo"}], "clima": {"t": 15, "sens": 14, "max": 21, "min": 9, "chuva": 60, "uv": 3, "vento": 10, "code": 61, "codeD": 61}, "cot": {"rate": 0.17, "data": TS}}}
async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED), "fakeSR": True}, hash_="painel")
        try:
            await pg.wait_for_timeout(400)
            secs = await pg.evaluate("[...document.querySelectorAll('.pdmc > span:not(.ico)')].map(x => x.textContent)")
            chk(secs == ["Saúde", "Finanças", "Hábitos", "Tarefas", "Pessoas", "Estudo & idiomas", "Jornada & lazer", "Casa", "Diário"], f"o painel mostra todas as abas do dia: {secs}")
            await pg.fill("#pd_txt", "Humor 4, dormi 7 horas. Recebi 300 do freela e guardei 100 na reserva. Pesei 72,5. Liguei para a Mãe 20 min. Estudei 1 hora de inglês. Li 30 páginas do Il nome della rosa. Preciso ligar para o banco até sexta")
            await pg.wait_for_timeout(600)
            st = await pg.evaluate("({ g: PD.gastos.map(g => [g.tipo, g.v]), L: { tar: PD.L.tar.map(r => r.t), cont: PD.L.cont.map(r => [r.pessoa, r.tipo, r.min]), est: PD.L.est.map(r => [r.item, r.min]), ler: PD.L.ler.map(r => [r.item, r.pag]) }, peso: PD.v.peso })")
            chk(st["g"] == [["Receita", "300"], ["Aporte", "100"]], f"receita e aporte do texto: {st['g']}")
            chk(st["L"]["cont"] == [["Mãe", "Ligação", "20"]] and st["L"]["est"] == [["Inglês", "60"]] and st["L"]["ler"] == [["Il nome della rosa", "30"]] and any("banco" in t for t in st["L"]["tar"]) and st["peso"] == "72,5", f"contato, estudo, leitura, tarefa e peso vão para as seções: {st}")
            await pg.click("[data-pdck='tdone|t1']"); await pg.click("[data-pdck='rot|r1']"); await pg.click(f"[data-pdck='conta|k1|{TS}']"); await pg.wait_for_timeout(200)
            await pg.click("[data-act=pdrev]"); await pg.wait_for_timeout(300)
            ids = await pg.evaluate("[...document.querySelectorAll('[data-pdrow]')].filter(x => x.checked).map(x => x.dataset.pdrow.split('.').slice(0,2).join('.'))")
            for k in ["s.peso", "t.done", "t.n", "c.", "e.", "r.", "k.r", "k.c"]:
                chk(any(i.startswith(k) for i in ids), f"revisão inclui {k}")
            await pg.click("[data-act=pdsave]"); await pg.wait_for_timeout(400)
            R = await pg.evaluate(f"""({{ peso: S.saude[TODAY].peso, rec: S.lanc.filter(l => l.tipo === 'Receita').map(l => l.valor), apo: S.lanc.filter(l => l.tipo === 'Aporte').map(l => l.valor), conta: S.lanc.filter(l => l.desc === 'Internet').length,
              t1: S.tarefas.find(t => t.id === 't1').status, nova: S.tarefas.some(t => /banco/.test(t.tarefa)), cont: S.contatos.map(c => [c.pessoa, c.tipo, c.min]), est: S.estudo.map(x => [x.item, x.horas, x.lang]), ler: S.aprend[0].atual, rot: S.rotinas[0].ultima, pago: S.contasCasa[0].pagos['{TS}'] }})""")
            chk(R["peso"] == 72.5 and R["rec"] == [300] and R["apo"] == [100] and R["conta"] == 1, f"Saúde e Finanças gravadas (peso, receita, aporte, conta paga lançada): {R}")
            chk(R["t1"] == "Concluída" and R["nova"] and R["cont"] == [["Mãe", "Ligação", 20]] and R["est"] == [["Inglês", 1, "en"]] and R["ler"] == 130 and R["rot"] == TS and R["pago"] == TS, "tarefas, pessoas, estudo, leitura e casa gravados no mesmo salvar")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[S.tarefas.find(t => t.id === 't1').status, S.contatos.length, S.aprend[0].atual, S.rotinas[0].ultima !== TODAY]") == ["A fazer", 0, 100, True], "um desfazer volta tudo")
            # Hoje: notícias e clima pelo feed gravado no banco (sem internet)
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED), "noNet": True}, hash_="hoje")
        try:
            await pg.wait_for_timeout(1200)
            txt = await pg.inner_text(".p-hoje")
            chk("Notícia do feed gravado" in txt and "Do resumo de" in txt, "sem internet, as notícias vêm do feed gravado no banco")
            chk("15°" in await pg.inner_text(".hjwx") and "guarda-chuva" in await pg.inner_text(".hjl") and "Open-Meteo, às 06:45" in txt, "clima do feed com recomendação")
            await pg.evaluate("location.hash='fin.vida'"); await pg.wait_for_timeout(1500)
            chk(await pg.evaluate("fut().cot?.rate") == 0.17, "câmbio do feed quando a busca falha")
            # mandala e bússola ocupam a linha toda em tela larga
            for h, sel in (("jornada.inicio", ".jmandala svg"), ("jornada.bussola", ".bmcomp svg")):
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(500)
                w = await pg.evaluate(f"document.querySelector('{sel}').getBoundingClientRect().width")
                chk(w > 600, f"{h}: desenho com {w:.0f} px de largura a 1440 px")
            errs[:] = [e for e in errs if "ERR_FAILED" not in e]
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED), "tz": "Europe/Rome"}, hash_="integ")
        try:
            await pg.wait_for_timeout(500)
            await pg.click("[data-act=gcsync]"); await pg.wait_for_timeout(500)
            ev = await pg.evaluate("S.eventos.filter(e => e.origem === 'gcal').map(e => [e.titulo, e.data, e.hora, e.fim, e.ate || ''])")
            exp1 = ["Reunião de projeto", D(1)]
            chk(len(ev) == 3 and [ev[0][0], ev[0][1]] == exp1 and ev[1][0] == "Viagem" and ev[1][4] == D(7) and ev[2][0] == "Dentista", f"lê duas páginas do Google Calendar, ignora cancelados, viagem de vários dias: {ev}")
            chk(await pg.evaluate("S.integ.gcal.on") and "Conectado" in await pg.inner_text(".page"), "fica marcado como conectado")
            await pg.evaluate("location.hash='idiomas'"); await pg.wait_for_timeout(300)
            P = await pg.evaluate("idiPlano()[1]")
            chk(P["busy"] == 30, f"a reunião do Google entra no plano de Idiomas (−30 min na janela): {P['busy']}")
            n0 = await pg.evaluate("window.__calls.filter(c => c.tool === 'create_event').length")
            await pg.click("[data-act=gcestudo]"); await pg.wait_for_timeout(800)
            cr = await pg.evaluate("window.__calls.filter(c => c.tool === 'create_event').map(c => c.input)")
            chk(len(cr) > n0 and all(c["summary"].startswith("Estudo · ") for c in cr), f"cria os blocos de estudo da semana ({len(cr)})")
            amanha = [c for c in cr if c["startTime"][:10] == D(1) or "T" in c["startTime"]]
            first = await pg.evaluate(f"S.eventos.find(e => e.data === '{D(1)}' && /^Estudo/.test(e.titulo))")
            chk(first and first["hora"] == "20:00", f"no dia da reunião 19–20 h, o bloco começa às 20:00: {first and first['hora']}")
            await pg.click("[data-act=gcestudo]"); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("window.__calls.filter(c => c.tool === 'create_event').length") == len(cr), "não duplica os blocos")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED), "gcalError": "not_granted"}, hash_="integ")
        try:
            await pg.wait_for_timeout(500); await pg.click("[data-act=gcsync]"); await pg.wait_for_timeout(400)
            chk("não liberou o Google Calendar" in await pg.inner_text(".page"), "permissão negada vira mensagem clara")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
