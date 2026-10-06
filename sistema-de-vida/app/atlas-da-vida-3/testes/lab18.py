"""Administração Pessoal: o Conselho. Sessão simulada com dados de exemplo pelas 10 fases; o Intermediador decide em JSON
validado (nova tentativa e fallback); diretores com o próprio prompt, a própria memória e o briefing; pausa para o CEO,
intervenção, pular fase, encerrar; resumo corrente; limites; ata validada que vira memória e aparece nas abas das áreas;
falha da IA sem perder o estado; sessão retomada depois de recarregar; área sem dados; setor privado; celular."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
FASES = ["REVISAO_ATA", "ABERTURA", "RELATORIOS", "CRUZAMENTO", "DEBATE", "CONTEMPLACAO", "CONFLITOS", "PREVISOES", "DELIBERACOES", "ATA"]
ST = "(s => s ? {f: s.fase, ceo: s.aguardaCEO, busy: CS.busy, err: s.erro, t: s.turno, p: s.pausada} : null)(S.conselho.sessao)"
async def settle(pg, ms=15000):
    """espera a sessão parar: CEO chamado, pausa, erro ou fim"""
    st = None
    for _ in range(ms // 50):
        st = await pg.evaluate(ST)
        if not st or not st["busy"]: break
        await pg.wait_for_timeout(50)
    await pg.wait_for_timeout(60)
    return await pg.evaluate(ST)
async def answer(pg, txt):
    await pg.fill("#cs_in", txt); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(80)
async def run_to(pg, fase, n=20):
    for i in range(n):
        st = await settle(pg)
        if not st or FASES.index(st["f"]) >= FASES.index(fase): return st
        if st["ceo"]: await answer(pg, f"Resposta {i}")
        elif not st["busy"]: return st
    return await pg.evaluate(ST)

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=900, hash_="admin")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(400)
            nav = await pg.evaluate("[...document.querySelectorAll('#nav a')].map(a => a.textContent.trim())")
            chk(any("Administração Pessoal" in x for x in nav) and any("Mentores" in x for x in nav), "a aba Administração Pessoal entra no menu sem tirar nenhuma")
            chk(await pg.evaluate("!!document.querySelector('.tabhead') && document.querySelector('#main h1, .topbar h1, h1')?.textContent.includes('Administração Pessoal')"), "segue o padrão das outras abas: título e capa com missão e manual")
            chk(await pg.evaluate("csAbertas().length") == 3 and await pg.evaluate("document.querySelectorAll('.csside .csac').length") == 3, "o painel lateral mostra as 3 ações em aberto da ata anterior (exemplo)")
            chk(await pg.evaluate("document.querySelectorAll('.csatas li').length") == 2 and await pg.evaluate("!!document.querySelector('.csside svg')"), "histórico de atas e gráfico da evolução das notas")
            al = await pg.evaluate("csAlerta()")
            chk(len(al) >= 1, f"um mentor sugere sessão extraordinária quando há alerta grave ({[a['mid'] for a in al]})")
            await pg.click(f"[data-csa=convocar][data-mid={al[0]['mid']}]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("CS.tipo") == "extraordinaria" and await pg.evaluate("CS.foco") == al[0]["titulo"], "Convocar prepara uma sessão extraordinária com o alerta como foco (não começa sozinha)")
            chk(await pg.evaluate("S.conselho.sessao") is None, "nada começa sem a pessoa tocar em Iniciar")
            await pg.select_option("#cs_tipo", "ordinaria"); await pg.fill("#cs_foco", "Sono e dinheiro"); await pg.wait_for_timeout(50)
            # mentorPrompt sem modo conselho continua igual
            chk(await pg.evaluate("(p => p.includes('Placar de dados da área') && p.includes('Use as ferramentas'))(mentorPrompt('fin', false))"), "o prompt normal do mentor não mudou (sem o modo conselho)")
            # roteiro do teste: no debate, o Mentor do Dinheiro é chamado 4 vezes (o limite é 3)
            await pg.evaluate("window.__csPlan = { REVISAO_ATA: ['fin', 'CEO'], ABERTURA: ['CEO'], RELATORIOS: ['fis'], CRUZAMENTO: ['fis', 'men'], DEBATE: ['fin', 'CEO', 'fin', 'fin', 'fin'], CONTEMPLACAO: ['CEO', 'pro', 'CEO', 'bm', 'CEO'], CONFLITOS: ['CEO', 'CEO', 'CEO', 'CEO'], PREVISOES: ['fin', 'CEO', 'fis', 'CEO', 'men', 'CEO'], DELIBERACOES: ['CEO', 'CEO', 'CEO'] }")
            n0 = await pg.evaluate("window.__calls.length")
            await pg.click("[data-csa=iniciar]")
            st = await settle(pg)
            s = await pg.evaluate("S.conselho.sessao")
            chk(s["tipo"] == "ordinaria" and s["foco"] == "Sono e dinheiro" and len(s["briefs"]) == 12, "Iniciar abre a sessão com tipo, foco e 12 briefings preparados antes")
            words = await pg.evaluate("Math.max(...Object.values(S.conselho.sessao.briefs).map(b => b.txt.split(/\\s+/).length))")
            chk(words <= 301, f"cada briefing tem no máximo ~300 palavras ({words})")
            fb = await pg.evaluate("S.conselho.sessao.briefs.fin.txt")
            chk(all(k in fb for k in ["ESTADO:", "ÚLTIMAS INTERAÇÕES", "AÇÕES PENDENTES"]) and "Preparar 3 jantares" in fb, "o briefing traz estado, tendência, interações e ações pendentes (inclusive as do Conselho)")
            chk(st["f"] == "REVISAO_ATA" and st["ceo"], f"abre pela revisão da ata anterior e pausa quando o Intermediador fala com o CEO ({st})")
            calls = await pg.evaluate(f"window.__calls.slice({n0})")
            ints = [c for c in calls if c["kind"] == "json"]
            chk(ints and "AÇÕES DO CONSELHO EM ABERTO" in ints[0]["input"] and "Preparar 3 jantares" in ints[0]["input"], "o Intermediador recebe a ata anterior e as ações em aberto")
            chk(all("RESPONDA SOMENTE com um objeto JSON" in c["input"] for c in ints), "o Intermediador responde só em JSON")
            ment = [c for c in calls if c["kind"] == "sample" and "REUNIÃO DO CONSELHO" in str(c["input"])]
            mp = str(ment[0]["input"]) if ment else ""
            chk(ment and mp.startswith("Você é o Mentor do Dinheiro") and "MEMÓRIA:" in mp and "PLANO ATUAL:" in mp, "o diretor usa o próprio prompt de sistema e a própria memória (sem cópia)")
            chk("BRIEFING DA SUA ÁREA" in mp and "PERGUNTA DO INTERMEDIADOR PARA VOCÊ" in mp and "OUTRAS ÁREAS (manchetes)" in mp and "RESUMO DA SESSÃO" in mp, "e recebe o próprio briefing, as manchetes das outras áreas, o resumo e a pergunta")
            chk("Use as ferramentas" not in mp and ment[0]["tools"] == [], "no Conselho o diretor só fala: sem ferramentas")
            chk(await pg.evaluate("document.querySelector('.csin').classList.contains('ceo') && document.querySelector('.csstatus.ceo') != null"), "a interface mostra que o Intermediador espera a sua resposta")
            chk(await pg.evaluate("document.querySelectorAll('.csfases li').length") == 10 and "Revisão" in (await pg.evaluate("document.querySelector('.csfases li.cur').textContent")), "barra com as 10 fases e a atual destacada")
            chk(await pg.evaluate("!!document.querySelector('.csm.int .csintav') && !!document.querySelector('.csm .mav')"), "chat com avatar e cor por mentor e o Intermediador destacado")
            await answer(pg, "Cumpri o sono, não cumpri o teto de restaurantes porque chego tarde.")
            st = await run_to(pg, "CRUZAMENTO")
            s = await pg.evaluate("S.conselho.sessao")
            rel = [m for m in s["msgs"] if m["fase"] == "RELATORIOS" and m["quem"] not in ("int", "sis", "ceo")]
            chk(len({m["quem"] for m in rel}) == 12, f"nos relatórios os 12 diretores falam ({len({m['quem'] for m in rel})})")
            chk(any("**Estado:**" in m["texto"] and "Tendência" in m["texto"] for m in rel), "relatório com estado, tendência, vitória e atenção")
            relInt = await pg.evaluate("window.__calls.filter(c => c.kind === 'json' && /FASE ATUAL: RELATORIOS/.test(c.input)).length")
            chk(relInt <= 2, f"relatórios em sequência: sem uma chamada do Intermediador antes de cada diretor ({relInt})")
            chk(s["resumo"].startswith("Resumo de teste") and s["resumoAte"] > 0, "o resumo corrente é atualizado a cada 5 turnos")
            chk(await pg.evaluate("window.__calls.filter(c => c.kind === 'json' && /FASE ATUAL: CRUZAMENTO/.test(c.input)).every(c => c.input.includes('RESUMO CORRENTE DA SESSÃO: Resumo de teste'))"), "e o Intermediador passa a receber o resumo em vez do histórico inteiro")
            # streaming: a fala aparece aos poucos
            live = False
            st = await pg.evaluate(ST)
            for _ in range(200):
                if await pg.evaluate("!!document.querySelector('.csm.live .cstx')?.textContent.trim()"): live = True; break
                st = await pg.evaluate(ST)
                if not st["busy"]:
                    if st["ceo"]: await answer(pg, "Sigo.")
                    else: break
                await pg.wait_for_timeout(5)
            chk(live, "as falas chegam por streaming")
            st = await run_to(pg, "CONTEMPLACAO")
            s = await pg.evaluate("S.conselho.sessao")
            chk(s["falas"].get("DEBATE|fin") == 3 and any("já falou 3 vezes" in m["texto"] for m in s["msgs"] if m["quem"] == "sis"), f"máximo de 3 falas por mentor por fase ({s['falas'].get('DEBATE|fin')})")
            # intervenção enquanto a IA trabalha
            await pg.evaluate("window.__csSlow = 500")
            await answer(pg, "Antes de seguir: estou cansado demais para cozinhar.")
            for _ in range(100):
                if await pg.evaluate("CS.busy && !!CS.live"): break
                await pg.wait_for_timeout(10)
            await pg.fill("#cs_in", "Intervenção: e se eu trabalhar menos à noite?"); await pg.click("[data-csa=enviar]")
            await pg.evaluate("window.__csSlow = 0")
            st = await settle(pg)
            iv = await pg.evaluate("S.conselho.sessao.msgs.filter(m => m.quem === 'ceo' && m.interv).map(m => m.texto)")
            seen = await pg.evaluate("window.__calls.filter(c => c.kind === 'json').some(c => c.input.includes('e se eu trabalhar menos à noite'))")
            chk(iv and seen, "o CEO pode intervir a qualquer momento e o Intermediador vê a intervenção")
            # JSON inválido: uma nova tentativa
            await pg.evaluate("window.__csBad = 1")
            j0 = await pg.evaluate("window.__calls.filter(c => c.kind === 'json').length")
            if st["ceo"]: await answer(pg, "Decido proteger as noites.")
            st = await settle(pg)
            j1 = await pg.evaluate("window.__calls.filter(c => c.kind === 'json').length")
            retried = await pg.evaluate("window.__calls.filter(c => c.kind === 'json').slice(-3).some(c => c.input.includes('sua resposta anterior foi inválida'))")
            chk(retried and await pg.evaluate("window.__csBad") == 0 and not st["err"], f"JSON inválido do Intermediador: tenta de novo uma vez e segue ({j1 - j0} chamadas)")
            # duas vezes inválido: segue para a próxima fase
            f0 = st["f"]; await pg.evaluate("window.__csBad = 2")
            if st["ceo"]: await answer(pg, "Ok.")
            st = await settle(pg)
            sis = await pg.evaluate("S.conselho.sessao.msgs.filter(m => m.quem === 'sis').map(m => m.texto)")
            chk(any("duas vezes" in x for x in sis) and await pg.evaluate("conselhoConfig.fases.indexOf(S.conselho.sessao.fase)") > await pg.evaluate(f"conselhoConfig.fases.indexOf('{f0}')"), f"inválido de novo: fallback para a próxima fase ({f0} → {st['f']})")
            # falha da API: nova tentativa com espera, sem perder estado
            await pg.evaluate("S.conselho.cfg.esperaMs = [40, 60]; window.__csFail = 2")
            m0 = await pg.evaluate("S.conselho.sessao.msgs.length")
            if st["ceo"]: await answer(pg, "Seguimos.")
            else: await pg.click("[data-csa=continuar]")
            st = await settle(pg)
            chk(not st["err"] and await pg.evaluate("window.__csFail") == 0 and await pg.evaluate("S.conselho.sessao.msgs.length") > m0, "falha passageira da IA: tenta de novo com espera e a sessão continua")
            await pg.evaluate("window.__csFail = 9")
            if st["ceo"]: await answer(pg, "Pode seguir.")
            else: await pg.click("[data-csa=continuar]")
            st = await settle(pg)
            m1 = await pg.evaluate("S.conselho.sessao.msgs.length")
            chk(st["err"] and st["p"] and "salvo" in st["err"] and await pg.evaluate("!!document.querySelector('.cssess .banner.warn')"), f"falha persistente: mensagem clara e sessão pausada ({st['err'][:60] if st['err'] else ''})")
            chk("Tentar de novo" in await pg.inner_text(".csctrl"), "com o botão Tentar de novo")
            await pg.evaluate("window.__csFail = 1; window.__csFailCode = 'rate_limited'"); n1 = await pg.evaluate("window.__calls.length")
            await pg.click("[data-csa=continuar]"); st = await settle(pg)
            chk(st["err"] and "Limite de uso" in st["err"] and await pg.evaluate("window.__csFail") == 0, "limite de uso: não insiste sozinho, pausa e avisa")
            await pg.evaluate("window.__csFail = 0; window.__csFailCode = ''")
            await pg.click("[data-csa=continuar]"); st = await settle(pg)
            chk(not st["err"] and await pg.evaluate("S.conselho.sessao.msgs.length") >= m1, "Tentar de novo retoma de onde parou, com tudo o que já foi dito")
            # pular fase
            fa = (await pg.evaluate(ST))["f"]
            await pg.click("[data-csa=pular]"); await pg.wait_for_timeout(150)
            fb2 = await pg.evaluate("S.conselho.sessao?.fase")
            chk(fb2 and await pg.evaluate(f"conselhoConfig.fases.indexOf('{fb2}') === conselhoConfig.fases.indexOf('{fa}') + 1"), f"Pular fase avança uma fase ({fa} → {fb2})")
            st = await settle(pg)
            # encerrar e gerar ata
            prev = await pg.evaluate("csAbertas()[0].id")
            ndc = await pg.evaluate("mget('fin').mem.length")
            await pg.click("[data-csa=encerrar]")
            for _ in range(200):
                if await pg.evaluate("S.conselho.sessao === null"): break
                await pg.wait_for_timeout(50)
            ata = await pg.evaluate("S.conselho.atas.at(-1)")
            chk(await pg.evaluate("S.conselho.sessao") is None and ata["foco"] == "Sono e dinheiro", "Encerrar e gerar ata fecha a sessão com a ata")
            keys = {"id", "data", "tipo", "foco", "insights", "decisoes", "acoes", "notas", "pontos_atencao", "pergunta_reflexao", "transcricao_resumida"}
            chk(keys <= set(ata) and all({"area", "acao", "prazo", "criterio", "status"} <= set(a) for a in ata["acoes"]), "a ata segue o formato pedido")
            chk(len(ata["insights"]) == 3 and ata["pergunta_reflexao"] and isinstance(ata["notas"].get("geral"), (int, float)), "3 insights, nota geral e pergunta final de reflexão")
            areas = [a["area"] for a in ata["acoes"]]; today = await pg.evaluate("TODAY")
            chk("Inventada" not in areas and "Geral" in areas and all(a["prazo"] >= today for a in ata["acoes"]), f"áreas e prazos validados ({areas})")
            chk(ata["notas"]["Finanças"]["nota"] == 10 and "Área falsa" not in ata["notas"] and "placar_dados" in ata, "notas presas a 0–10, áreas falsas fora, placar dos dados ao lado")
            chk(await pg.evaluate(f"S.conselho.atas.flatMap(a => a.acoes).find(x => x.id === '{prev}').status") == "feita", "a revisão de ações anteriores combinada na sessão atualiza o status")
            mm = await pg.evaluate("mget('fin').mem.slice(-2)")
            chk(await pg.evaluate("mget('fin').mem.length") > ndc and any(x["origem"] == "conselho" and "Cozinhar no domingo" in x["texto"] for x in mm), "cada ação vira compromisso na memória do mentor da área")
            chk(await pg.evaluate("!!document.querySelector('.csata .csq') && document.querySelectorAll('.csata .dt').length >= 2"), "a ata aparece com ações, notas e a pergunta de reflexão")
            # ações nas abas das áreas
            await pg.evaluate("location.hash = 'fin.rel'"); await pg.wait_for_timeout(400)
            strip = await pg.evaluate("[...document.querySelectorAll('.csstrip .csac b')].map(b => b.textContent)")
            chk("Cozinhar no domingo" in strip and "Dormir até 23h30" not in strip, f"as ações aparecem na aba da área responsável ({strip})")
            aid = await pg.evaluate("csAbertas().find(x => x.acao === 'Cozinhar no domingo')")
            await pg.click(f"[data-csst='{aid['ata']}|{aid['id']}|feita']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.conselho.atas.flatMap(a => a.acoes).find(x => x.id === '{aid['id']}').status") == "feita" and "Cozinhar no domingo" not in await pg.evaluate("[...document.querySelectorAll('.csstrip .csac b')].map(b => b.textContent)"), "e posso marcá-las como feitas ali")
            await pg.click("button[aria-label='Desfazer'], [data-act=undo]") if await pg.locator("[data-act=undo]").count() else await pg.evaluate("undo()")
            await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.conselho.atas.flatMap(a => a.acoes).find(x => x.id === '{aid['id']}').status") == "aberta", "marcar tem desfazer")
            await pg.evaluate("location.hash = 'saude.rel'"); await pg.wait_for_timeout(300)
            chk("Dormir até 23h30" in await pg.evaluate("[...document.querySelectorAll('.csstrip .csac b')].map(b => b.textContent).join('|')"), "Saúde mostra as ações de Saúde física")
            # sem dados
            r = await pg.evaluate("(() => { const keep = S; S = EMPTY(); VER++; try { return csBrief('fin'); } finally { S = keep; VER++; } })()")
            chk(r["sem"] and r["txt"].startswith("SEM DADOS SUFICIENTES"), "área sem registros: o briefing declara sem dados suficientes")
            errs_before = len(errs)
        finally:
            print("erros:", errs[:6]); await b.close()

        # privacidade, área sem dados no fluxo, persistência e retomada depois de recarregar (modo real, gravando no banco)
        b, pg, errs2 = await open_page(p, w=1440, h=900, hash_="admin")
        try:
            await pg.wait_for_timeout(600)
            await pg.evaluate("S.priv.semIA = ['Família']; S.conselho = csExemplo(); touch('priv', 'conselho'); render()"); await pg.wait_for_timeout(300)
            await pg.evaluate("window.__csPlan = { REVISAO_ATA: ['CEO'], ABERTURA: ['CEO'], RELATORIOS: ['fis'], CRUZAMENTO: ['CEO'], DEBATE: ['CEO'], CONTEMPLACAO: ['CEO'], CONFLITOS: ['CEO'], PREVISOES: ['CEO'], DELIBERACOES: ['CEO'] }")
            await pg.click("[data-csa=iniciar]"); await pg.wait_for_timeout(50)
            await pg.evaluate("S.conselho.sessao.briefs.ami = { txt: 'SEM DADOS SUFICIENTES nesta área.', sem: true, head: 'sem dados suficientes', trend: '?' }")
            st = await settle(pg)
            seats = await pg.evaluate("csSeats()")
            chk("fam" not in seats["dir"] and "fam" in seats["priv"], "setor privado: o diretor fica fora da sessão")
            ints = await pg.evaluate("window.__calls.filter(c => c.kind === 'json').map(c => c.input).join('\\n')")
            chk("FORA DA SESSÃO (setor privado, não chame): Mentor da Família" in ints and "- fam:" not in ints, "e o Intermediador não pode chamá-lo")
            await answer(pg, "Revisado."); st = await settle(pg); await answer(pg, "Foco no sono."); st = await run_to(pg, "CRUZAMENTO")
            msgs = await pg.evaluate("S.conselho.sessao.msgs")
            amim = [m for m in msgs if m["quem"] == "ami"]
            chk(amim and "Sem dados suficientes" in amim[0]["texto"] and amim[0].get("local") and st["f"] == "CRUZAMENTO", "área sem dados: o diretor declara sem dados suficientes e a sessão continua")
            chk(not await pg.evaluate("window.__calls.some(c => c.kind === 'sample' && /Você é o Mentor das Amizades/.test(String(c.input)) && /REUNIÃO DO CONSELHO/.test(String(c.input)))"), "sem gastar uma chamada de IA com isso")
            chk(not any("Família" in str(c) for c in await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').map(c => String(c.input).match(/OUTRAS ÁREAS \\(manchetes\\): ([^\\n]*)/)?.[1] || '')")), "nem as manchetes da área privada vão para os outros")
            await pg.wait_for_timeout(1800)
            store = await pg.evaluate("JSON.stringify(window.__store)")
            n_msgs = await pg.evaluate("S.conselho.sessao.msgs.length")
            chk('data/users/u_test/s_conselho' in store, "a sessão é salva no mesmo armazenamento das outras abas (data/users/<id>/s_conselho)")
        finally:
            await b.close()
        b, pg, errs3 = await open_page(p, w=1440, h=900, hash_="admin", cfg={"seedStore": store})
        try:
            await pg.wait_for_timeout(900)
            s = await pg.evaluate("S.conselho.sessao")
            chk(s and len(s["msgs"]) == n_msgs and s["fase"] == "CRUZAMENTO", f"recarregar a página mantém a sessão interrompida ({len(s['msgs']) if s else 0} falas)")
            chk("Responder" in await pg.inner_text(".csin") or "Continuar" in await pg.inner_text(".csctrl"), "e ela pode ser retomada")
            await pg.evaluate("window.__csPlan = { CRUZAMENTO: ['fis'], DEBATE: [], CONTEMPLACAO: [], CONFLITOS: [], PREVISOES: [], DELIBERACOES: ['CEO'] }")
            if s["aguardaCEO"]: await answer(pg, "Retomando.")
            else: await pg.click("[data-csa=continuar]")
            st = await run_to(pg, "ATA", 12)
            for _ in range(100):
                if await pg.evaluate("S.conselho.sessao === null"): break
                st = await pg.evaluate(ST)
                if st and st["ceo"]: await answer(pg, "Decido.")
                await pg.wait_for_timeout(60)
            chk(await pg.evaluate("S.conselho.sessao === null && S.conselho.atas.length === 3"), "a sessão retomada chega até a ata")
            aud = await pg.evaluate("[(S.auditoria || []).filter(a => /^Conselho · /.test(a.recurso || '')).length, window.__calls.filter(c => (c.kind === 'json' || c.kind === 'sample') && /Conselho|CONSELHO/.test(String(c.input))).length]")
            chk(aud[0] > 0 and aud[0] >= aud[1], f"cada chamada do Conselho entra no registro de Privacidade ({aud[0]} registros, {aud[1]} chamadas nesta página)")
            chk(await pg.evaluate("S.conselho.atas.at(-1).acoes.length") >= 1, "toda sessão termina com pelo menos uma ação concreta")
        finally:
            print("erros:", (errs2 + errs3)[:6]); await b.close()
        allerr = errs + errs2 + errs3
        chk(not allerr, f"sem erros no console ({allerr[:3]})")

        # banco vazio começa vazio: o exemplo só aparece pelo botão
        b, pg, e5 = await open_page(p, w=1440, h=900, hash_="fin.lanc", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            r = await pg.evaluate("[S.lanc.length, S.diario.length, S.conselho.atas.length, IS_EXAMPLE, !!document.querySelector('.banner')?.textContent.includes('Atlas vazio')]")
            chk(r == [0, 0, 0, False, True], f"banco vazio abre vazio, sem dados de exemplo, com o aviso ({r})")
            await pg.evaluate("exOn()"); await pg.wait_for_timeout(300); n = await pg.evaluate("S.lanc.length")
            await pg.evaluate("exOff()"); await pg.wait_for_timeout(300)
            chk(n > 10 and await pg.evaluate("S.lanc.length") == 0, "o exemplo só aparece com o botão Exemplo e some ao desligar")
        finally:
            await b.close()
        seed = {"data/users/u_test/s_lanc": {"v": [{"id": "x1", "data": "2026-10-01", "tipo": "Despesa", "cat": "Mercado", "desc": "real", "valor": 10, "conta": "C"}], "at": 1}}
        b, pg, e6 = await open_page(p, w=1440, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": json.dumps(seed)})
        try:
            await pg.wait_for_timeout(900)
            r = await pg.evaluate("[S.lanc.map(x => x.desc), S.diario.length, S.metas.length, S.mentores.fis ? 1 : 0, IS_EXAMPLE]")
            chk(r == [["real"], 0, 0, 0, False], f"com dados salvos (como as finanças), só eles aparecem, sem exemplo misturado ({r})")
        finally:
            await b.close()
        chk(not (e5 + e6), f"sem erros ao abrir vazio ({(e5 + e6)[:2]})")

        # celular
        b, pg, errs4 = await open_page(p, w=390, h=820, hash_="admin")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("document.documentElement.scrollWidth") == 390, "390 px: sem rolagem lateral na aba")
            await pg.click("[data-csa=iniciar]"); st = await settle(pg)
            chk(await pg.evaluate("document.documentElement.scrollWidth") == 390 and st["ceo"], "390 px: a sessão roda e pausa para o CEO sem rolagem lateral")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
