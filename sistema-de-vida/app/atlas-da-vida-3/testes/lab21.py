"""Filosofia (estoicismo) na Jornada e a aba Psicologia, como um sistema: triagem do controle a partir das decisões, padrões e
registros; virtudes lidas nos exames; lentes das tradições sobre um dilema; Mestre do Pórtico e Terapeuta com memória,
ferramentas que cruzam as abas, formas de conversa detectadas ou fixadas; sessões, processos, padrões, pauta; privacidade."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
async def idle(pg, ms=8000):
    for _ in range(ms // 50):
        if await pg.evaluate("!MST.live && !FIL.busy"): return
        await pg.wait_for_timeout(50)
async def send(pg, txt):
    await pg.fill("#m_in", txt); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(100); await idle(pg)

async def main():
    global bad
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.filosofia")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(400)
            subs = await pg.evaluate("[...document.querySelectorAll('.subtabs a, .subtabs button, nav.sub a')].map(a => a.textContent.trim())")
            chk(await pg.evaluate("SUBS.jornada.some(s => s[0] === 'filosofia')") and await pg.evaluate("SUB") == "filosofia", "a Jornada ganha a seção Filosofia, sem virar um quinto pilar")
            chk(await pg.evaluate("document.querySelectorAll('.filp').length") == 6 and await pg.evaluate("[...document.querySelectorAll('.filp cite')].every(c => /Epicteto|Sêneca|Marco Aurélio/.test(c.textContent))"), "seis princípios práticos, cada um com a fonte (Epicteto, Sêneca, Marco Aurélio)")
            # virtudes conferidas à parte a partir dos exames brutos
            calc = await pg.evaluate("""(() => { const ex = S.bmExames, from = addDays(TODAY, -27), by = {};
              for (const [d, e] of Object.entries(ex)) { if (d < from || d > TODAY) continue; for (const [id, v] of Object.entries(e.n || {})) if (typeof v === 'number') (by[id] ||= []).push(v); }
              return FIL_VIRT.map(V => { const xs = V.v.filter(id => by[id]).map(id => by[id].reduce((a, b) => a + b, 0) / by[id].length / 2); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; }); })()""")
            got = await pg.evaluate("filVirtudes().map(v => v.nota)")
            chk(all((a is None and b is None) or (a is not None and b is not None and abs(a - b) < 1e-9) for a, b in zip(calc, got)), f"as quatro virtudes conferem com o cálculo à parte nos exames ({[round(x, 3) if x is not None else None for x in got]})")
            chk("um só valor de coragem" in await pg.inner_text(".pn:has(.filvirt)"), "e dizem o que os exames não medem (coragem só com Paciência)")
            # triagem a partir de uma decisão da Bússola
            fontes = await pg.evaluate("filFontes().map(f => f.k)")
            chk({"dec", "psi", "pad"} <= set(fontes), f"a triagem parte do que já foi registrado: decisões, registros e padrões da psicologia ({sorted(set(fontes))})")
            i = fontes.index("dec"); n0 = await pg.evaluate("filD().triagens.length"); p0 = await pg.evaluate("psiD().pauta.length")
            await pg.click(f".filtripn [data-act=filtri][data-i='{i}']"); await pg.wait_for_timeout(150)
            chk((await pg.evaluate("FIL.tri.sit")) and await pg.evaluate("FIL.tri.origem.k") == "dec", "escolher a decisão já traz a situação e a origem")
            await pg.click("[data-act=filtrisave]"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("filD().triagens.length") == n0, "sem dizer o que depende ou não depende, não guarda")
            await pg.fill("[data-filt=meu]", "Conversar com franqueza e decidir até sexta"); await pg.fill("[data-filt=nao]", "Como a outra pessoa vai reagir")
            await pg.click("[data-filv=justica]"); await pg.check("[data-filt=terapia]"); await pg.click("[data-act=filtrisave]"); await pg.wait_for_timeout(200)
            t = await pg.evaluate("filD().triagens.at(-1)")
            chk(await pg.evaluate("filD().triagens.length") == n0 + 1 and t["virtude"] == "justica" and t["origem"]["k"] == "dec", "a triagem guarda o que depende, o que não depende, a virtude e a origem")
            chk(await pg.evaluate("psiD().pauta.length") == p0 + 1 and await pg.evaluate("psiD().pauta.at(-1).origem.k") == "tri", "marcada para a terapia, ela entra na pauta da próxima sessão")
            await pg.evaluate("undo()"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("filD().triagens.length") == n0 and await pg.evaluate("psiD().pauta.length") == p0, "desfazer tira a triagem e o tema da pauta juntos")
            chk("Volte ao presente" in await pg.inner_text(".filpads"), "os padrões da psicologia aparecem com o exercício estoico que conversa com eles")
            # lentes
            await pg.click(f"[data-act=fildil][data-i='{fontes.index('pad')}']"); await pg.wait_for_timeout(100)
            nl = await pg.evaluate("filD().lentes.length"); await pg.click("[data-act=fillentes]"); await idle(pg)
            call = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample' && /TAREFA: LENTES/.test(String(c.input))).at(-1)?.input")
            chk(call and all(n in call for n in ["Mestre do Pórtico", "O Terapeuta", "O Benfeitor", "Sábio do Vale"]) and "AS QUATRO VIRTUDES" in call and "TRIAGENS DO CONTROLE" in call, "as lentes juntam o estoicismo, os pilares e a psicoterapia, com os dados da pessoa")
            chk(await pg.evaluate("filD().lentes.length") == nl + 1 and "onde se encontram" in (await pg.inner_text(".fillpn")).lower(), "a leitura entrelaçada fica guardada e aparece")
            # Mestre do Pórtico
            nt = await pg.evaluate("filD().triagens.length"); npa = await pg.evaluate("psiD().pauta.length")
            await send(pg, "O que nesta semana depende de mim?")
            sp = await pg.evaluate("window.__stoPrompt || ''")
            chk(sp.startswith("Você é Mestre do Pórtico") and "seção Filosofia" in sp and "AS QUATRO VIRTUDES" in sp and "MEMÓRIA:" in sp, "o Mestre do Pórtico tem prompt, memória e os dados da filosofia e da Bússola")
            chk(await pg.evaluate("filD().triagens.length") == nt + 1 and await pg.evaluate("filD().triagens.at(-1).origem.k") == "mentor", "ele registra uma triagem combinada na conversa")
            chk(await pg.evaluate("psiD().pauta.length") >= npa + 2, "e pode levar temas à pauta da terapia")
            await pg.evaluate("location.hash = 'jornada.inicio'"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[...document.querySelectorAll('.jmc')].some(a => a.textContent.includes('Mestre do Pórtico') && a.getAttribute('href') === '#jornada.filosofia')"), "o Mestre do Pórtico entra entre os mentores da Jornada")
            await pg.evaluate("location.hash = 'mentor.sto'"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("PAGE + '.' + SUB") == "jornada.filosofia", "o link do mentor leva à Filosofia")
            chk("Filosofia (estoicismo)" in await pg.evaluate("mentorPrompt('esp', false)") and "TRABALHO PSICOLÓGICO" in await pg.evaluate("mentorPrompt('esp', false)"), "os mentores dos pilares passam a ver as triagens estoicas e o resumo psicológico")
            # Psicologia
            await pg.evaluate("location.hash = 'psi'"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[...document.querySelectorAll('#nav a')].some(a => a.textContent.includes('Psicologia'))") and await pg.evaluate("SUBS.psi.length") == 6, "a aba Psicologia entra no menu com seis seções")
            chk(await pg.evaluate("!!document.querySelector('.tabhead')") and "Pauta da próxima sessão" in await pg.inner_text("#main"), "segue o padrão das abas: capa, manual e painéis")
            sug = await pg.evaluate("psiSugestoes()")
            chk(any("Ruminação" in s for s in sug), f"a pauta sugere os padrões em alta ({sug[:2]})")
            # sessão
            await pg.evaluate("location.hash = 'psi.sessoes'"); await pg.wait_for_timeout(250)
            ns = await pg.evaluate("psiD().sessoes.length"); aberta = await pg.evaluate("psiD().pauta.filter(x => !x.feito).length")
            await pg.click("[data-act=psinovasess]"); await pg.wait_for_timeout(100)
            await pg.fill("[data-pss=temasTxt]", "trabalho, cobrança"); await pg.fill("[data-pss=insights]", "Percebi que a cobrança é antiga")
            await pg.click("[data-psspad=pd1]"); await pg.click("[data-psspil=bud]"); await pg.click("[data-act=psisesssave]"); await pg.wait_for_timeout(200)
            s = await pg.evaluate("psiD().sessoes.at(-1)")
            chk(await pg.evaluate("psiD().sessoes.length") == ns + 1 and s["temas"] == ["trabalho", "cobrança"] and s["padroes"] == ["pd1"] and s["pilares"] == ["bud"] and s["processo"] == "pp1", "registrar a sessão liga temas, padrão, pilar e processo")
            chk(aberta > 0 and await pg.evaluate("psiD().pauta.filter(x => !x.feito).length") == 0, "a pauta é marcada como levada na sessão")
            # registro de pensamento → triagem estoica
            await pg.evaluate("location.hash = 'psi.entre'"); await pg.wait_for_timeout(250)
            await pg.click("[data-act=psinovarefl][data-v=pensamento]"); await pg.wait_for_timeout(100)
            await pg.fill("[data-psr=situacao]", "A chefe mudou o prazo"); await pg.fill("[data-psr=pensamento]", "Nunca vou dar conta"); await pg.fill("[data-psr=depende]", "Organizar a semana e pedir ajuda")
            await pg.click("[data-act=psitriagem]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("PAGE + '.' + SUB") == "jornada.filosofia" and await pg.evaluate("FIL.tri.origem.k") == "psi" and await pg.evaluate("FIL.tri.meu") == "Organizar a semana e pedir ajuda", "um registro de pensamento vira triagem estoica, já com o que depende de você")
            chk(await pg.evaluate("psiD().reflexoes.at(-1).estoico"), "e o registro fica marcado como levado à filosofia")
            # padrão e processo
            await pg.evaluate("location.hash = 'psi.padroes'"); await pg.wait_for_timeout(200)
            await pg.click("[data-act=psinovopad]"); await pg.fill("[data-psd=nome]", "Catastrofização"); await pg.click("[data-act=psipadsave]"); await pg.wait_for_timeout(200)
            chk("Premeditação dos males ao contrário" in await pg.inner_text("#main"), "um padrão novo já mostra o exercício estoico que conversa com ele")
            await pg.evaluate("location.hash = 'psi.processos'"); await pg.wait_for_timeout(200)
            await pg.fill("[data-psimarco=pp1]", "Consegui entregar sem revisar dez vezes"); await pg.click("[data-act=psimarco][data-id=pp1]"); await pg.wait_for_timeout(200)
            tl = await pg.inner_text(".psitl")
            chk("Consegui entregar" in tl and "Percebi que a cobrança é antiga" in tl, "o processo mostra a linha do tempo: marcos, sessões e registros ligados")
            # Terapeuta: formas
            await pg.evaluate("location.hash = 'psi.terapeuta'"); await pg.wait_for_timeout(300)
            for txt, modo in [("Só preciso desabafar sobre hoje", "escuta"), ("Me dá algo prático para lidar com isso", "direto"), ("Estou muito mal, chorei a tarde toda", "acolhimento"), ("Me faça perguntas sobre isso", "socratico"), ("Por que eu sempre me cobro tanto, desde pequeno?", "profundo")]:
                await send(pg, txt)
                pr = await pg.evaluate("window.__psiPrompt || ''")
                chk(await pg.evaluate("psiD().modo.atual") == modo and f"FORMA AGORA: {PSI_N[modo]}" in pr, f"“{txt[:28]}…” → forma {PSI_N[modo]}")
            await pg.click("[data-act=psimodo][data-v=socratico]"); await pg.wait_for_timeout(100)
            await send(pg, "Só preciso desabafar")
            chk(await pg.evaluate("psiD().modo.atual") == "socratico" and "FORMA AGORA: Socrático" in await pg.evaluate("window.__psiPrompt"), "a forma fixada pela pessoa vale mais que a detecção")
            await pg.click("[data-act=psimodo][data-v=auto]"); await pg.wait_for_timeout(100)
            await send(pg, "Tudo bem, muda para direto por favor")
            chk(await pg.evaluate("psiD().modo.atual") == "direto", "o Terapeuta também muda de forma por conta própria (ajustar_modo)")
            pr = await pg.evaluate("window.__psiPrompt")
            chk(all(k in pr for k in ["PROCESSOS EM CURSO", "PADRÕES NOMEADOS", "ENTRE SESSÕES", "AS QUATRO VIRTUDES", "JORNADA:", "112", "CVV 188", "não substitui"]), "o Terapeuta lê processos, padrões, registros, a filosofia e a jornada, com o protocolo de segurança")
            chk(await pg.evaluate("psiD().padroes.filter(p => p.nome === 'Ruminação').length") == 1, "anotar um padrão que já existe não duplica")
            chk(await pg.evaluate("psiD().cfg.perguntas.some(q => /teste/.test(q.q))"), "a pergunta que o Terapeuta deixa aparece em Entre sessões")
            chk(await pg.evaluate("mget('psi').conversa.length") >= 14 and await pg.evaluate("mget('psi').mem.length") > 0, "ele tem conversa e memória próprias")
            # privacidade
            await pg.evaluate("psiD().reflexoes.push({ id: 'priv1', data: TODAY, at: Date.now(), tipo: 'livre', texto: 'SEGREDO-NAO-ENVIAR', privado: true, padroes: [] })")
            chk("SEGREDO-NAO-ENVIAR" not in await pg.evaluate("psiFacts().join(' ')"), "o que é marcado como só seu não vai para a IA")
            await pg.evaluate("S.priv.semIA = ['Saúde mental']; render()"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("blockedMentor('psi')") and await pg.evaluate("psiFactsBrief().length") == 0 and "TRABALHO PSICOLÓGICO" not in await pg.evaluate("mentorPrompt('sto', false)"), "com a Saúde mental fora da IA, o Terapeuta não conversa e nada da psicologia vai para os outros mentores")
            await pg.evaluate("S.priv.semIA = []")
            # conselho
            chk(await pg.evaluate("conselhoConfig.convidados.includes('sto') && conselhoConfig.convidados.includes('psi')") and "PROCESSOS EM CURSO" in await pg.evaluate("csBrief('psi').txt"), "o Mestre do Pórtico e o Terapeuta podem ser convidados ao Conselho, com briefing próprio")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # persistência no banco
        b, pg, e2 = await open_page(p, w=1440, h=900, hash_="psi.padroes", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(800)
            await pg.click("[data-act=psinovopad]"); await pg.fill("[data-psd=nome]", "Autocrítica"); await pg.click("[data-act=psipadsave]"); await pg.wait_for_timeout(1800)
            st = await pg.evaluate("JSON.stringify(Object.keys(window.__store))")
            chk("s_psique" in st, "a psicologia é salva no mesmo armazenamento das outras abas")
            chk(not e2, f"sem erros ({e2[:2]})")
        finally:
            await b.close()
        b, pg, e3 = await open_page(p, w=390, h=820, hash_="psi")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(300)
            ws = []
            for h in ["psi", "psi.sessoes", "psi.entre", "psi.padroes", "psi.processos", "psi.terapeuta", "jornada.filosofia"]:
                await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(250); ws.append(await pg.evaluate("document.documentElement.scrollWidth"))
            chk(all(w == 390 for w in ws), f"390 px: Psicologia e Filosofia sem rolagem lateral ({ws})")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
PSI_N = {"escuta": "Escuta", "direto": "Direto", "acolhimento": "Acolhimento", "socratico": "Socrático", "profundo": "Profundo"}
if __name__ == "__main__": asyncio.run(main())
