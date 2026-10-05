"""Redesenho: banco congelado (erro da Carreira), Hoje (clima, notícias, frase, ideias, sem internet), Casa (contas, compras, limpeza),
Futuro financeiro (TFR, IRPEF, reserva conferidos à parte), Itália & Brasil (câmbio), Idiomas (plano com a Agenda), Caderno técnico, Rede, capas e Mapa."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
T = datetime.date.today()
TS = T.isoformat()
U = "data/users/u_test/"
def months_ago(n, day=10):
    y, m = T.year, T.month - n
    while m <= 0: m += 12; y -= 1
    return f"{y}-{m:02d}-{day:02d}"
SEED = {U + "s_carreira": {"at": 1, "v": {"perfil": {"mercado": "it", "cargo": "Coordenador", "empresa": "Empresa X", "mapa": ["AutoCAD Civil 3D"], "remun": {"bruto": 2800, "mens": 14, "buoni": 196}}, "geo": {"modo": "oculta"}}},
        U + "s_lanc": {"at": 1, "v": [{"id": f"l{i}", "data": months_ago(i), "tipo": "Despesa", "cat": "Moradia", "desc": "aluguel", "valor": 800, "conta": "x"} for i in (1, 2, 3)] + [{"id": f"m{i}", "data": months_ago(i, 12), "tipo": "Despesa", "cat": "Restaurantes & cafés", "desc": "x", "valor": 200, "conta": "x"} for i in (1, 2, 3)]},
        U + "s_pessoas": {"at": 1, "v": [{"id": "p1", "nome": "Ana Rossi", "relacao": "Trabalho", "freq": 30, "empresa": "Studio A"}, {"id": "p2", "nome": "Bia", "relacao": "Amizade", "freq": 30}]},
        U + "s_contatos": {"at": 1, "v": [{"id": "c1", "data": (T - datetime.timedelta(days=45)).isoformat(), "pessoa": "Ana Rossi", "tipo": "Ligação", "qual": 4}]},
        U + "s_eventos": {"at": 1, "v": [{"id": "e1", "data": (T + datetime.timedelta(days=1)).isoformat(), "hora": "19:00", "fim": "20:00", "titulo": "Reunião"}]},
        U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}}

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED)}, hash_="carreira.panorama")
        try:
            await pg.wait_for_timeout(500)
            chk(await pg.evaluate("!document.querySelector('.emptyb') || !document.querySelector('.emptyb').textContent.includes('problema')"), "Carreira abre com o documento do banco congelado (o erro 'object is not extensible' sumiu)")
            chk(await pg.evaluate("Object.isFrozen(S.carreira)") is False, "os dados carregados do banco são cópias editáveis")
            # capa e manual
            for h in ["hoje", "carreira.caderno", "casa.contas", "fin.futuro", "idiomas", "mapa", "saude.rel", "dados"]:
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(200)
                st = await pg.evaluate("[!!document.querySelector('.tabhead svg'), document.querySelector('.tabhead p')?.textContent || '', document.querySelectorAll('.thman li').length]")
                chk(st[0] and len(st[1]) > 40 and st[2] >= 2, f"{h}: capa, missão e manual ({st[2]} passos)")
            await pg.evaluate("location.hash='mapa'"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelector('.tabhead p').textContent.includes('estrutura do Atlas')"), "missão do Mapa")
            miss = await pg.evaluate("NAV.flatMap(g => g[1]).map(x => x[0]).filter(k => !TAB_INFO[k])")
            chk(miss == [], f"toda aba do menu tem missão e manual (faltam: {miss})")
            chk(await pg.evaluate("document.querySelectorAll('.mapai').length") == await pg.evaluate("MAPA_GRUPOS.flatMap(g => g[1]).length"), "Mapa lista todas as abas com missão e descrição da capa")
            chk(await pg.evaluate("document.querySelectorAll('.mapsug li').length") == 4, "Mapa propõe 4 abas novas em ordem (Tempo & energia virou a Rotina)")
            # Futuro financeiro: conferência independente
            await pg.evaluate("location.hash='fin.futuro'"); await pg.wait_for_timeout(300)
            X = await pg.evaluate("(() => { const x = futCalc(); return { ral: x.tfr.ral, q: x.tfr.quotaLiq, reval: x.tfr.reval, marg: x.tfr.marg, base: x.base, alvo: x.alvo, s1: x.tfr.serie[0].a }; })()")
            ral = 2800 * 14; q = ral / 13.5 - .005 * ral
            chk(abs(X["ral"] - ral) < 1e-6 and abs(X["q"] - q) < 1e-6, f"TFR anual = RAL/13,5 − 0,5% = {q:.2f} ({X['q']:.2f})")
            chk(abs(X["reval"] - (0.015 + .75 * .02)) < 1e-9 and abs(X["s1"] - q) < 1e-6, "revalorização 1,5% + 75% da inflação; primeiro ano = quota")
            chk(X["marg"] == .35, "IRPEF marginal de 35% para RAL de € 39.200")
            chk(abs(X["base"] - 800) < 1e-6 and abs(X["alvo"] - 4800) < 1e-6, f"reserva usa só despesas essenciais (Moradia 800/mês × 6 = 4800): {X['base']}, {X['alvo']}")
            await pg.fill("[data-fut=reservaSaldo]", "1200"); await pg.dispatch_event("[data-fut=reservaSaldo]", "change"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("futCalc().cobre") == 1.5, "1.200 de reserva cobre 1,5 mês")
            # Itália & Brasil
            await pg.evaluate("location.hash='fin.vida'"); await pg.wait_for_timeout(600)
            chk(abs(await pg.evaluate("fut().cot.rate") - 0.17062) < 1e-9, "cotação BRL→EUR do dia buscada e guardada")
            await pg.evaluate("S.vidaItens.push({id:'v1', t:'Família', pais:'Brasil', valor:1000, periodo:'Mensal'}, {id:'v2', t:'IPTU', pais:'Brasil', valor:1200, periodo:'Anual'}, {id:'v3', t:'GTT', pais:'Itália', valor:38, periodo:'Mensal'}); touch('vidaItens')"); await pg.wait_for_timeout(300)
            txt = await pg.inner_text(".p-fin .krow")
            chk("R$ 1.100,00" in txt and "€ 187,68" in txt, f"Brasil 1.000 + 1.200/12 = R$ 1.100 → × 0,17062 = € 187,68 ({txt[:120]!r})")
            # Casa
            await pg.evaluate("location.hash='casa.contas'"); await pg.wait_for_timeout(200)
            occ = await pg.evaluate("contaOcorr({ venc: '2026-03-31', periodo: 'Bimestral' }, '2026-01-01', '2026-12-31')")
            chk(occ == ["2026-01-31", "2026-03-31", "2026-05-31", "2026-07-31", "2026-09-30", "2026-11-30"], f"vencimentos bimestrais com fim de mês corrigido: {occ}")
            await pg.evaluate(f"S.contasCasa.push({{id:'k1', conta:'Luz', cat:'Luz', valor:62, periodo:'Bimestral', venc:'{TS}', debito:'Sim'}}); touch('contasCasa')"); await pg.wait_for_timeout(200)
            n0 = await pg.evaluate("S.lanc.length")
            await pg.click(f"[data-act=cpagar][data-id=k1]"); await pg.wait_for_timeout(250)
            l = await pg.evaluate("S.lanc.at(-1)")
            chk(await pg.evaluate("S.lanc.length") == n0 + 1 and l["cat"] == "Contas da casa" and l["valor"] == 62 and await pg.evaluate(f"S.contasCasa[0].pagos['{TS}']") == TS, "Paguei marca a conta e lança em Finanças")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("S.lanc.length") == n0 and not await pg.evaluate(f"(S.contasCasa[0].pagos||{{}})['{TS}']"), "desfazer volta a conta e o lançamento")
            await pg.evaluate("location.hash='casa.compras'"); await pg.wait_for_timeout(200)
            await pg.fill("#cp_in", "2 kg de batata, detergente, leite"); await pg.keyboard.press("Enter") if False else await pg.click("[data-act=cpadd]"); await pg.wait_for_timeout(200)
            C = await pg.evaluate("S.compras.map(x => [x.item, x.qtd, x.cat])")
            chk(C == [["Batata", "2 kg", "Hortifrúti"], ["Detergente", "", "Limpeza"], ["Leite", "", "Laticínios"]], f"itens separados, quantidade e seção do mercado: {C}")
            await pg.evaluate("S.compras[2].fixo = 'Sim'; touch('compras')"); await pg.wait_for_timeout(150)
            for i in range(3): await pg.click(f"[data-cpck='{await pg.evaluate(f'S.compras[{i}].id')}']"); await pg.wait_for_timeout(80)
            await pg.click("[data-act=cpnova]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.compras.map(x => [x.item, x.feito])") == [["Leite", False]], "nova semana: comprados saem, fixos voltam desmarcados")
            await pg.evaluate("location.hash='casa.limpeza'"); await pg.wait_for_timeout(200); await pg.click("[data-act=climpmod]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.rotinas.length") == 13 and await pg.evaluate("new Set(S.rotinas.map(r => r.nivel)).size") == 4, "modelo de limpeza: 13 rotinas nos 4 níveis")
            chk(await pg.evaluate("SUBS.casa.map(x => x[0]).join()") == "painel,limpeza,compras,contas,docs,diario" and "Assinaturas" not in await pg.inner_text(".page"), "Casa sem assinaturas; elas estão em Finanças › Orçamento")
            await pg.evaluate("location.hash='fin.orc'"); await pg.wait_for_timeout(200)
            chk("Assinaturas" in await pg.inner_text(".page"), "assinaturas em Orçamento")
            # Idiomas
            await pg.evaluate("location.hash='idiomas'"); await pg.wait_for_timeout(300)
            P = await pg.evaluate("idiPlano()[1]")
            chk(P["busy"] == 30 and P["livre"] == min(P["disp"], 90 - 30), f"amanhã a reunião 19:00–20:00 tira 30 min da janela 19:30–21:00: livre {P['livre']} min")
            chk(P["en"] + P["it"] == P["livre"] and P["en"] == round(P["livre"] * .7 / 5) * 5, "70% para o inglês, arredondado a 5 min")
            await pg.fill("#idm", "40"); await pg.click("[data-act=idsess]"); await pg.wait_for_timeout(200)
            e = await pg.evaluate("S.estudo.at(-1)")
            chk(e["item"] == "Inglês" and abs(e["horas"] - .67) < .01 and e["lang"] == "en", "sessão de idioma vai para Crescimento")
            pr = await pg.evaluate("idiProj('en')")
            exp = await pg.evaluate("NIV_H[idi().en.alvo] - NIV_H[idi().en.nivel]") - e["horas"]
            chk(abs(pr["falta"] - exp) < 1e-6, f"faltam (horas do nível meta − nível atual − feitas) = {exp:.2f} h: {pr['falta']}")
            # Caderno e Rede
            await pg.evaluate("location.hash='carreira.caderno'"); await pg.wait_for_timeout(200); await pg.click("[data-act=cadmod]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.cadTec.length") == 9, "caderno começa com 9 notas de referência")
            await pg.fill("#cad_q", "manning"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("document.querySelectorAll('.cadn').length") == 1, "busca no caderno")
            await pg.evaluate("location.hash='carreira.rede'"); await pg.wait_for_timeout(200)
            r = await pg.evaluate("redeRows().map(x => [x.p.nome, x.st, x.dias])")
            chk(r == [["Ana Rossi", "crit", 45]], f"Rede: só pessoas de trabalho; 45 dias sem falar com cadência de 30 = esfriando: {r}")
            await pg.click("[data-rcont='Ana Rossi']"); await pg.wait_for_timeout(200)
            chk(await pg.input_value("#f_pessoa") == "Ana Rossi", "registrar contato já vem com a pessoa")
            await pg.keyboard.press("Escape")
            # Hoje
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(600)
            chk("18°" in await pg.inner_text(".hjwx") and "camadas" in await pg.inner_text(".hjl"), "clima da internet com recomendação de roupa (13° de amplitude → camadas)")
            chk(await pg.evaluate("document.querySelectorAll('.hjn').length") >= 2, "notícias positivas com link")
            chk(await pg.evaluate("document.querySelector('.hjask').classList.contains('pend')"), "sem respostas, o Hoje pede o contexto")
            for c in ("grana|zero", "energia|baixa", "tempo|60", "humor|2"): await pg.click(f"[data-hjc='{c}']"); await pg.wait_for_timeout(120)
            I = await pg.evaluate("hjIdeias(hctx(), hjClima()).pick.map(x => ({ t: x.t, c: x.cst, m: x.min }))")
            chk(I and all(x["c"] == 0 and x["m"] <= 60 for x in I), f"sem dinheiro e com 1 h: só ideias grátis e curtas ({[x['t'] for x in I]})")
            chk(await pg.evaluate("!document.querySelector('.hjask').classList.contains('pend')") and await pg.evaluate("hjTema(hctx())[0]") == "coragem", "humor baixo escolhe frase de coragem")
            n = await pg.evaluate("S.tarefas.length"); await pg.click("[data-hjvou]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.tarefas.length") == n + 1 and await pg.evaluate("S.tarefas.at(-1).prazo") == TS, "Vou fazer vira tarefa de hoje")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # sem internet: clima vira pergunta, notícias viram links
        b, pg, errs = await open_page(p, w=390, cfg={"noNet": True}, hash_="hoje")
        try:
            await pg.wait_for_timeout(800)
            chk(await pg.evaluate("!!document.querySelector('[data-hjc^=\"clima|\"]')") and "Positive News" in await pg.inner_text(".p-hoje"), "sem internet: pergunta o tempo e oferece os links das notícias")
            await pg.click("[data-hjc='clima|chuva']"); await pg.wait_for_timeout(200)
            I = await pg.evaluate("hjIdeias(hctx(), hjClima()).pick.map(x => x.outd)")
            chk(all(o != 1 for o in I) and "guarda-chuva" in await pg.inner_text(".hjl"), "chuva marcada à mão: guarda-chuva e nenhuma ideia só ao ar livre")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            errs = [e for e in errs if "ERR_FAILED" not in e]
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
