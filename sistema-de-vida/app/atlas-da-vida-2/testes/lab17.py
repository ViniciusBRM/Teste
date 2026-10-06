"""Secretário da Vida: janela flutuante movível e redimensionável; Agora consolidado; modos e perfis de imposição; ações só com
confirmação; lembretes por texto e voz que avisam na hora; conflitos levados à pessoa; conversa com ferramentas (ver abas, consultar
mentor, propor, levantar conflito); sem IA continua útil; privacidade respeitada; celular."""
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
        b, pg, errs = await open_page(p, w=1440, h=900, hash_="hoje", cfg={"fakeSR": True})
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(500)
            chk(await pg.evaluate("!!document.querySelector('#secfab') && !document.querySelector('#secfab').hidden && document.querySelector('#sec').hidden"), "o botão flutuante aparece e a janela começa fechada")
            chk(await pg.evaluate("+(document.querySelector('#secfab i')?.textContent || 0)") > 0, "o botão mostra quantas coisas críticas há")
            await pg.click("#secfab"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("!document.querySelector('#sec').hidden && document.querySelector('#secfab').hidden"), "tocar abre a janela flutuante")
            r0 = await pg.evaluate("(r => [r.right, r.bottom])(document.querySelector('#sec').getBoundingClientRect())")
            chk(r0[0] <= 1440 and r0[1] <= 900 and r0[0] > 1300, f"ela abre no canto, sem cobrir o menu ({r0})")
            # mover e redimensionar
            hb = await pg.locator(".sech .sect").bounding_box()
            await pg.mouse.move(hb["x"] + 20, hb["y"] + 8); await pg.mouse.down(); await pg.mouse.move(hb["x"] - 500, hb["y"] - 200, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
            pos = await pg.evaluate("secLS('pos')")
            chk(pos and pos["x"] < 700, f"arrastar pelo cabeçalho move a janela e guarda a posição ({pos})")
            await pg.evaluate("const w = document.querySelector('#sec'); w.style.width = '460px'; w.style.height = '640px'"); await pg.wait_for_timeout(300)
            pos = await pg.evaluate("secLS('pos')")
            chk(pos["w"] == 460 and pos["h"] == 640, f"redimensionar guarda o tamanho ({pos})")
            await pg.evaluate("secToggle(false); secToggle(true)"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("parseInt(document.querySelector('#sec').style.width)") == 460, "reabrir mantém posição e tamanho")
            # sobrevive à navegação
            await pg.evaluate("location.hash = 'fin.lanc'"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("!document.querySelector('#sec').hidden"), "a janela continua aberta ao trocar de aba")
            # Agora
            its = await pg.evaluate("secItems().map(i => [i.id.split(':')[0], i.st])")
            kinds = {k for k, _ in its}
            chk({"tar", "conta"} <= kinds and any(s == "crit" for _, s in its), f"o Agora junta tarefas, contas e alertas de várias abas ({sorted(kinds)})")
            tid = await pg.evaluate("secItems().find(i => i.id.startsWith('tar:') && i.st === 'crit').id.slice(4)")
            await pg.click(f"[data-secdo='tdone|{tid}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate(f"S.tarefas.find(t => t.id === '{tid}').status") == "Concluída", "Concluí fecha a tarefa (é a própria pessoa tocando)")
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate(f"S.tarefas.find(t => t.id === '{tid}').status") != "Concluída", "e dá para desfazer")
            cid = await pg.evaluate("secItems().find(i => i.id.startsWith('conta:')).acts[0][1]"); n0 = await pg.evaluate("S.lanc.length")
            await pg.click(f"[data-secdo='{cid}']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.lanc.length") == n0 and "Confirmar" in await pg.inner_text(f"[data-secdo='{cid}']"), "pagar uma conta pede confirmação antes")
            await pg.click(f"[data-secdo='{cid}']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("S.lanc.length") == n0 + 1, "confirmado, a conta é paga e lançada")
            # modos e perfis
            await pg.click("[data-act=secmodo][data-m=relaxo]"); await pg.wait_for_timeout(200)
            sts = await pg.evaluate("[...document.querySelectorAll('#secbody .secit')].map(e => e.className)")
            chk(sts and all("st-crit" in c for c in sts), "Relaxo mostra só o crítico")
            await pg.click("[data-act=secmodo][data-m=enfoque]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("!!document.querySelector('.secfoco')") and await pg.evaluate("document.querySelectorAll('#secbody .secit').length") <= 3, "Enfoque mostra o foco agora e no máximo 3 itens")
            await pg.click("[data-act=secmodo][data-m=reflexao]"); await pg.wait_for_timeout(200)
            chk("A semana" in await pg.text_content("#secbody") and await pg.evaluate("document.querySelectorAll('.secpad.q li').length") == 3, "Reflexão mostra a semana e três perguntas")
            await pg.click("[data-act=seccfg]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("[...document.querySelectorAll('.seccfgm')].filter(d => d.open).map(d => d.dataset.m)") == ["reflexao"], "a configuração abre no perfil do modo ativo")
            await pg.click(".seccfgm[data-m=enfoque] summary"); await pg.wait_for_timeout(100)
            await pg.fill("[data-secpf='enfoque|tom']", "seco e militar"); await pg.dispatch_event("[data-secpf='enfoque|tom']", "change"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("secPerfil('enfoque').tom") == "seco e militar", "o perfil de cada modo é editável")
            chk(await pg.evaluate("document.querySelector('.seccfgm[data-m=enfoque]').open"), "o perfil editado continua aberto depois de salvar")
            await pg.evaluate("secData().modo = 'enfoque'")
            chk("seco e militar" in await pg.evaluate("secPrompt()"), "o tom escolhido vai para as instruções do Secretário")
            await pg.click("[data-act=seccfg]"); await pg.wait_for_timeout(100)
            # lembretes e comandos locais
            await pg.fill("#sec_in", "modo ação"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("secData().modo") == "acao", "“modo ação” troca o modo por texto")
            await pg.fill("#sec_in", "me lembre de pagar o seguro do carro amanhã às 10"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            l = await pg.evaluate("secData().lembretes.at(-1)"); tm = await pg.evaluate("addDays(TODAY, 1)")
            chk(l["texto"] == "Pagar o seguro do carro" and l["quando"] == f"{tm}T10:00", f"lembrete entendido: texto e hora ({l['texto']}, {l['quando']})")
            await pg.fill("#sec_in", "lembrete beber água em 30 minutos"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("(l => l.texto === 'Beber água' && Math.abs(new Date(l.quando) - Date.now() - 30*60e3) < 90e3)(secData().lembretes.at(-1))"), "“em 30 minutos” também funciona")
            n1 = await pg.evaluate("secData().lembretes.length")
            await pg.fill("#sec_in", "me lembre de ligar para o banco"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("secData().lembretes.length") == n1 and "Para quando" in await pg.evaluate("secData().conversa.at(-1).content"), "sem hora, ele pergunta para quando em vez de chutar")
            await pg.evaluate("secData().lembretes.push({ id: 'lx', texto: 'Tomar o remédio', quando: (d => `${iso(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`)(new Date(Date.now() - 60e3)), feito: false, avisado: false }); secToggle(false); secTick()"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[SEC.open, SEC.tab, secData().lembretes.find(x => x.id === 'lx').avisado]") == [True, "lembretes", True] and "Tomar o remédio" in await pg.text_content("#secbody"), "na hora, o lembrete abre a janela e avisa")
            await pg.click("[data-secdo='lemok|lx']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("secData().lembretes.find(x => x.id === 'lx').feito"), "marcar como feito")
            # conflitos
            await pg.evaluate("S.rotina.push({ id: 'cb1', data: TODAY, ini: '23:00', fim: '23:30', titulo: 'Leitura', cat: 'Lazer', rep: '', exc: [], st: {} }); S.eventos.push({ id: 'ce1', data: TODAY, hora: '23:00', fim: '23:30', titulo: 'Chamada com Tóquio' }); touch('rotina', 'eventos')"); await pg.wait_for_timeout(200)
            await pg.evaluate("SEC.tab = 'agora'; secPaint()"); await pg.wait_for_timeout(100)
            cf = await pg.evaluate("secConflitos().map(c => c.txt)")
            chk(any("Leitura" in c and "Tóquio" in c for c in cf) and "Para você decidir" in await pg.text_content("#secbody"), f"o conflito entre a rotina e a agenda vai para a pessoa decidir")
            i = [k for k, c in enumerate(cf) if "Tóquio" in c][0]
            await pg.click(f"[data-seccf='{i}|1']"); await pg.wait_for_timeout(200)
            chk(not any("Tóquio" in c for c in await pg.evaluate("secConflitos().map(c => c.txt)")) and await pg.evaluate("secData().decisoes.at(-1).escolha") == "Manter os dois", "a decisão fica registrada e o conflito sai da lista")
            await pg.evaluate("for (let k = 0; k < 6; k++) S.tarefas.push({ id: 'sx' + k, tarefa: 'Tarefa ' + k, prio: k < 2 ? 'Alta' : 'Baixa', prazo: TODAY, status: 'A fazer' }); touch('tarefas')"); await pg.wait_for_timeout(150)
            j = await pg.evaluate("secConflitos().findIndex(c => c.chave.startsWith('sobrecarga'))")
            chk(j >= 0, "dia sobrecarregado vira uma decisão")
            await pg.evaluate("secPaint()"); await pg.click(f"[data-seccf='{j}|0']"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[S.tarefas.find(t => t.id === 'sx0').prazo === TODAY, S.tarefas.find(t => t.id === 'sx4').prazo === addDays(TODAY, 1)]") == [True, True], "escolher adiar move só as de prioridade baixa e média")
            # conversa com o Claude (simulado)
            await pg.evaluate("SEC.tab = 'conversa'; secPaint()"); await pg.fill("#sec_in", "O que eu faço agora?"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(2500)
            calls = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').map(c => c.tools)")
            chk(["ver_aba", "consultar_mentor", "propor", "levantar_conflito"] == calls[-2][:4] if len(calls) >= 2 else False, f"a conversa usa as ferramentas do Secretário ({calls[-2:] if calls else calls})")
            chk(await pg.evaluate("window.__calls.some(c => c.kind === 'tool' && c.name === 'consultar_mentor' && c.r && c.r.length > 10)"), "consultar o mentor faz uma chamada à parte e traz o texto dele")
            last = await pg.evaluate("secData().conversa.at(-1)")
            chk(len(last["acoes"]) == 1 and last["acoes"][0]["status"] == "pendente" and len(last["conflitos"]) == 1, "a proposta e o conflito aguardam a pessoa")
            nl = await pg.evaluate("secData().lembretes.length")
            mi = await pg.evaluate("secData().conversa.length - 1"); pid = last["acoes"][0]["id"]
            await pg.click(f"[data-secp='{mi}|{pid}|ok']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("secData().lembretes.length") == nl + 1 and await pg.evaluate(f"secData().conversa[{mi}].acoes[0].status") == "aceita", "confirmar cria o lembrete proposto")
            ncall = await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').length"); cid2 = last["conflitos"][0]["id"]
            await pg.click(f"[data-secc='{mi}|{cid2}|1']"); await pg.wait_for_timeout(2500)
            chk(await pg.evaluate(f"secData().conversa[{mi}].conflitos[0].escolha") == "Estudo" and await pg.evaluate("window.__calls.filter(c => c.kind === 'sample').length") > ncall, "escolher no conflito registra a decisão e o Secretário segue a partir dela")
            chk(any(x["recurso"].startswith("Secretário") for x in await pg.evaluate("(S.auditoria || []).slice(-10)")) if await pg.evaluate("Array.isArray(S.auditoria)") else True, "cada leitura da IA entra no registro de Privacidade")
            # voz
            await pg.click("[data-act=secmic]"); await pg.wait_for_timeout(100)
            await pg.evaluate("window.__say('me lembre de regar as plantas hoje às 23:50')"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("secData().lembretes.some(l => l.texto === 'Regar as plantas' && l.quando.endsWith('23:50'))"), "por voz: o ditado vira comando")
            # privacidade
            await pg.evaluate("S.priv.semIA = ['Finanças']; touch('priv')"); await pg.wait_for_timeout(150)
            chk("setor privado" in await pg.evaluate("secAbaFacts('financas')") and "fin" not in await pg.evaluate("secTools({uso:[],acoes:[],conflitos:[],ctl:new AbortController()})[1].inputSchema.properties.mentor.enum") and "Finanças:" not in await pg.evaluate("secPrompt().split('VISÃO GERAL')[0]"), "setores fora da IA não vão para o Secretário nem para o mentor deles")
            await pg.evaluate("S.priv.semIA = []; touch('priv')")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # sem IA
        b, pg, errs = await open_page(p, w=1280, hash_="hoje", cfg={"off": ["sample"]})
        try:
            await pg.wait_for_timeout(500); await pg.evaluate("secToggle(true); SEC.tab = 'conversa'; secPaint()"); await pg.wait_for_timeout(150)
            await pg.fill("#sec_in", "o que vence hoje?"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("secData().conversa.at(-1).local"), "sem IA, o resumo vem do próprio Atlas")
            await pg.fill("#sec_in", "reorganize minha semana"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
            chk("A IA não está disponível" in await pg.evaluate("secData().conversa.at(-1).content"), "e explica o que dá para fazer sem a IA")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # celular
        b, pg, errs = await open_page(p, w=390, h=800, hash_="hoje")
        try:
            await pg.wait_for_timeout(400); await pg.evaluate("exOn()"); await pg.wait_for_timeout(300); await pg.click("#secfab"); await pg.wait_for_timeout(300)
            r = await pg.evaluate("(r => [Math.round(r.left), Math.round(r.right), Math.round(r.bottom), document.documentElement.clientWidth])(document.querySelector('#sec').getBoundingClientRect())")
            chk(r[0] == 0 and r[1] == r[3] and r[2] == 800, f"390 px: vira uma folha de baixo, na largura toda ({r})")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px: sem rolagem lateral {ov}")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
