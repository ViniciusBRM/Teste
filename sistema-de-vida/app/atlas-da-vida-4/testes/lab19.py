"""Conselho em modo observador: os diretores discutem entre si sem esperar o CEO (o Intermediador não pode chamá-lo),
réplicas diretas de quem foi citado pelo nome, o CEO entra quando quiser e a reunião segue, a ata traz propostas de
definição e ações propostas que só valem depois de aprovadas. E os ícones dos cartões dos mentores centralizados."""
import asyncio, json
from harness import *
from lab18 import settle, ST
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
ICO = r"""() => [...document.querySelectorAll('.jmc .mav, .mcard .mav, .lzci, .jhi')].filter(b => b.offsetParent).map(b => { const s = b.querySelector('svg'), r = b.getBoundingClientRect(), q = s.getBoundingClientRect(); return Math.round(Math.abs((q.top + q.height / 2) - (r.top + r.height / 2)) + Math.abs((q.left + q.width / 2) - (r.left + r.width / 2))); })"""

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=900, hash_="admin")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(400)
            chk(await pg.locator("#cs_obs").count() == 1, "a sessão oferece o modo observador")
            await pg.check("#cs_obs"); await pg.fill("#cs_foco", "Sono, trabalho e dinheiro")
            chk(await pg.evaluate("CS.obs") is True, "marcar liga o modo observador")
            await pg.evaluate("window.__csPlan = { REVISAO_ATA: ['fin'], ABERTURA: ['pro'], RELATORIOS: ['fis'], CRUZAMENTO: ['fin', 'men'], DEBATE: ['CEO', 'fin', 'car'], CONTEMPLACAO: ['bm'], CONFLITOS: ['fin'], PREVISOES: ['fis'], DELIBERACOES: ['car'] }")
            await pg.evaluate("window.__csSlow = 0")
            await pg.click("[data-csa=iniciar]"); await pg.wait_for_timeout(100)
            s = await pg.evaluate("S.conselho.sessao")
            chk(s["obs"] and "Modo observador" in s["msgs"][0]["texto"], "a sessão abre em modo observador e avisa como funciona")
            chk(await pg.evaluate("!!document.querySelector('.cssess .pill.good')") and "Entrar" in await pg.inner_text(".csin"), "a interface mostra o modo e o botão Entrar na discussão")
            # entrar na discussão no meio de uma fala, sem parar a reunião
            await pg.evaluate("window.__csSlow = 400")
            for _ in range(200):
                if await pg.evaluate("CS.busy && !!CS.live"): break
                await pg.wait_for_timeout(10)
            await pg.fill("#cs_in", "Entro aqui: o que mais me pesa é trabalhar à noite."); await pg.click("[data-csa=enviar]")
            await pg.wait_for_timeout(50); await pg.evaluate("window.__csSlow = 0")
            chk(await pg.evaluate("CS.busy") and await pg.evaluate("S.conselho.sessao.msgs.some(m => m.quem === 'ceo' && m.interv)"), "o CEO entra na discussão e a reunião continua sem pausar")
            pausas = 0; st = None
            for _ in range(600):
                st = await pg.evaluate(ST)
                if not st: break
                if st["ceo"]: pausas += 1; break
                if not st["busy"] and (st["err"] or st["p"]): break
                await pg.wait_for_timeout(50)
            chk(st is None and pausas == 0, f"a reunião vai até a ata sem nunca esperar o CEO ({st})")
            calls = await pg.evaluate("window.__calls.filter(c => c.kind === 'json' && /Você é o Intermediador/.test(c.input) && !/TAREFA: ATA/.test(c.input)).map(c => c.input)")
            chk(calls and all("MODO OBSERVADOR" in c and "NÃO use \"CEO\" como próximo" in c and "| CEO |" not in c for c in calls), "o Intermediador recebe a regra: o CEO só assiste e não pode ser chamado")
            chk(any("modo observador: o CEO só assiste" in c for c in calls), "se ele tentar chamar o CEO, a resposta é recusada e ele escolhe um diretor")
            chk(any("entrar na discussão" in c.lower() or "trabalhar à noite" in c for c in calls), "a fala do CEO chega ao Intermediador")
            ata = await pg.evaluate("S.conselho.atas.at(-1)")
            ment = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample' && /REUNIÃO DO CONSELHO/.test(String(c.input))).map(c => String(c.input))")
            chk(ment and all("MODO OBSERVADOR: o CEO assiste" in m for m in ment if "FORMATO DO RELATÓRIO" not in m), "os diretores sabem que devem debater entre si e propor, não decidir")
            rep = [m for m in ment if "se dirigiu a você" in m]
            chk(rep and rep[0].startswith("Você é o Mentor do Corpo") and "Mentor do Dinheiro se dirigiu a você" in rep[0], "quem é citado pelo nome responde direto, sem o Intermediador no meio")
            chk(ata["observador"] and len(ata["propostas"]) == 2 and all(x["status"] == "proposta" for x in ata["propostas"]), "a ata traz propostas de definição, aguardando aprovação")
            chk(all(a["status"] == "proposta" for a in ata["acoes"]), "as ações também ficam como propostas")
            chk(await pg.evaluate(f"csAbertas().some(x => x.ata === '{ata['id']}')") is False, "propostas não aparecem como ações em aberto")
            n_pend = await pg.evaluate("csPendentes().length")
            chk(n_pend == len(ata["propostas"]) + len(ata["acoes"]) and await pg.evaluate("document.querySelectorAll('.cspend .csac').length") == n_pend, f"o painel 'Aguardando sua aprovação' lista tudo ({n_pend})")
            mem0 = await pg.evaluate("mget('fin').mem.length")
            fin = next(a for a in ata["acoes"] if a["area"] == "Finanças")
            await pg.click(f".cspend [data-csst='{ata['id']}|{fin['id']}|aberta']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"S.conselho.atas.at(-1).acoes.find(x => x.id === '{fin['id']}').status") == "aberta" and await pg.evaluate("mget('fin').mem.length") == mem0 + 1, "aprovar uma ação a abre e grava na memória do mentor da área")
            outra = next(a for a in ata["acoes"] if a["area"] != "Finanças")
            await pg.click(f".cspend [data-csst='{ata['id']}|{outra['id']}|recusada']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate(f"S.conselho.atas.at(-1).acoes.find(x => x.id === '{outra['id']}').status") == "recusada" and await pg.evaluate(f"!csAbertas().some(x => x.id === '{outra['id']}')"), "recusar tira a ação do caminho")
            await pg.click(f".cspend [data-cspr='{ata['id']}|0|aprovada']"); await pg.wait_for_timeout(150)
            a2 = await pg.evaluate("S.conselho.atas.at(-1)")
            chk(a2["propostas"][0]["status"] == "aprovada" and any("aprovada por você" in d for d in a2["decisoes"]), "aprovar uma proposta a transforma em decisão do CEO")
            await pg.evaluate("undo()"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.conselho.atas.at(-1).propostas[0].status") == "proposta", "aprovar tem desfazer")
            await pg.evaluate("location.hash = 'fin.rel'"); await pg.wait_for_timeout(300)
            chk("Cozinhar no domingo" in await pg.evaluate("[...document.querySelectorAll('.csstrip .csac b')].map(b => b.textContent).join('|')"), "a ação aprovada aparece na aba da área")
            # ícones dos mentores no centro
            for h in ["jornada.inicio", "lazer.inicio", "mentores"]:
                await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(350)
                d = await pg.evaluate(ICO)
                chk(d and max(d) <= 1, f"{h}: ícones dos mentores centralizados ({len(d)} ícones, desvio máximo {max(d) if d else '-'} px)")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        b, pg, e2 = await open_page(p, w=390, h=820, hash_="admin")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(300)
            await pg.check("#cs_obs"); await pg.evaluate("window.__csPlan = { REVISAO_ATA: ['fin'], ABERTURA: ['pro'], RELATORIOS: ['fis'], CRUZAMENTO: ['fin'], DEBATE: ['car'], CONTEMPLACAO: ['bm'], CONFLITOS: ['fin'], PREVISOES: ['fis'], DELIBERACOES: ['car'] }")
            await pg.click("[data-csa=iniciar]"); await pg.wait_for_timeout(600)
            chk(await pg.evaluate("document.documentElement.scrollWidth") == 390, "390 px: modo observador sem rolagem lateral")
            for _ in range(400):
                if await pg.evaluate("S.conselho.sessao === null"): break
                await pg.wait_for_timeout(50)
            chk(await pg.evaluate("document.documentElement.scrollWidth") == 390 and await pg.evaluate("document.querySelectorAll('.cspend .csac').length") > 0, "390 px: propostas para aprovar sem rolagem lateral")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
