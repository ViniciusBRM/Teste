"""Cockpit de Trabalho (2/2): diário de bordo com extração local e pela IA (o que não existe na equipe fica de fora); riscos
(mapa de calor, sugestões do motor registradas ou ignoradas, tarefa de mitigação); problemas com soluções escolhidas e
convertidas em tarefas ligadas; decisões e lições; Gantt com tabela; tracker BIM (nova verificação de clash); elaborati
(revisão A → B); relatórios: rascunho em italiano sem IA com tabelas, exportação .md e .html, texto do PMO guardado no
histórico; blocos de foco na Rotina; o PMO sem ferramentas lê o bloco atlas; e tudo persiste no banco entre sessões."""
import asyncio, json, base64
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho.log")
        try:
            await pg.wait_for_timeout(900)
            SQ = await pg.evaluate("({ ...ckD().seq })"); E6 = f"E{SQ['E'] + 1}"; L2 = f"L{SQ['L'] + 1}"
            # diário de bordo
            await pg.fill("#ck_logtxt", "Il RUP chiede una variante al km 3. Preciso revisar o drenaggio até sexta @Giulia #Idraulica. Decidimos usar il DTM regionale.")
            await pg.select_option("#ck_logproj", "p1"); await pg.click('[data-act="cklogadd"]'); await pg.wait_for_timeout(200)
            e = await pg.evaluate("(() => { const e = ckA('ckLog').at(-1); return { cod: e.cod, tipo: e.tipo, proj: e.projeto, xtr: (CK.xtr?.itens || []).map(i => i.k) }; })()")
            chk(e["cod"] == E6 and e["tipo"] == "escopo" and e["proj"] == "p1", f"o registro entra no diário com código, tipo automático e projeto ({e})")
            chk("t" in e["xtr"] and "d" in e["xtr"], f"o motor local já sugere a tarefa e a decisão do texto ({e['xtr']})")
            await pg.click("[data-ckxia]"); await pg.wait_for_timeout(500)
            it = await pg.evaluate("CK.xtr.itens.map(i => [i.k, i.titulo || i.desc, i.resp || ''])")
            chk(any(x[0] == "t" and "IA" in x[1] and x[2] == "m2" for x in it) and any(x[0] == "t" and "inventada" in x[1] and x[2] == "" for x in it) and any(x[0] == "r" for x in it), f"a IA extrai tarefa, risco e decisão; pessoa inexistente fica sem responsável ({it})")
            chk("EQUIPE: eu, Luca, Giulia, Elena" in await pg.evaluate("window.__ckXtrPrompt"), "a extração recebe os nomes da equipe para não inventar")
            await pg.click('[data-ckxsel="1"]'); await pg.wait_for_timeout(100)
            n0 = await pg.evaluate("({ t: ckT().length, r: ckA('ckRisk').length, d: ckA('ckDec').length })")
            await pg.click('[data-act="ckxcriar"]'); await pg.wait_for_timeout(200)
            n1 = await pg.evaluate("({ t: ckT().length, r: ckA('ckRisk').length, d: ckA('ckDec').length, lig: ckA('ckLog').find(x => x.cod === '" + E6 + "').ligados, orig: ckT().at(-1).origem?.rot })")
            chk(n1["t"] == n0["t"] + 1 and n1["r"] == n0["r"] + 1 and n1["d"] == n0["d"] + 1 and len(n1["lig"]) == 3 and n1["orig"] == "diário " + E6, f"cria só os selecionados e o registro guarda o que gerou ({n0} → {n1})")
            # riscos
            await pg.evaluate("location.hash='trabalho.riscos'"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.querySelectorAll('.ckhc').length === 25 && [...document.querySelectorAll('.ckhc')].reduce((s, c) => s + (+c.textContent || 0), 0) === ckA('ckRisk').filter(r => r.status !== 'fechado').length"), "o mapa de calor 5×5 soma os riscos abertos")
            nsug = await pg.evaluate("document.querySelectorAll('[data-cksugreg]').length")
            await pg.click('[data-cksugign="0"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("document.querySelectorAll('[data-cksugreg]').length") == nsug - 1 and await pg.evaluate("ckD().cfg.rsIgn.length") == 1, "ignorar uma sugestão a tira da lista (e fica lembrado)")
            d0 = await pg.evaluate("document.querySelector('[data-cksugreg=\"0\"]').closest('li').querySelector('b').textContent")
            await pg.click('[data-cksugreg="0"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("$('#dlg').open && $('#dlg input[name=desc]').value") == d0, "Registrar abre o risco preenchido com a sugestão")
            await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            r = await pg.evaluate("(() => { const r = ckA('ckRisk').at(-1); return [r.cod, r.desc, r.origem?.k, !!r.mitig]; })()")
            chk(r[1] == d0 and r[2] == "motor" and r[3], f"o risco entra no registro com a mitigação sugerida ({r})")
            await pg.click('[data-ckrtar="r2"]'); await pg.wait_for_timeout(150); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("ckA('ckRisk').find(r => r.id === 'r2').tarefas.length === 1 && /Mitigar R2/.test(ckT().at(-1).titulo) && ckT().at(-1).prio === 'alta'"), "a tarefa de mitigação fica ligada ao risco R2")
            # problemas
            await pg.evaluate("location.hash='trabalho.problemas'"); await pg.wait_for_timeout(150)
            await pg.click('[data-ckesc="i1|s2"]'); await pg.wait_for_timeout(120)
            chk(await pg.evaluate("ckFind('ckIss', 'P1').escolhida === 's2' && ckFind('ckIss', 'P1').status === 'solução escolhida'"), "escolher uma solução muda o status do problema")
            await pg.click('[data-ckconv="i1|s2"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("$('#dlg input[name=titulo]').value") == "Traslazione verticale sul DTM con verifica a campione", "Converter abre a tarefa preenchida com a solução")
            await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("ckFind('ckIss', 'P1').tarefas.length === 1 && ckT().find(t => t.id === ckFind('ckIss', 'P1').tarefas[0]).origem.rot === 'problema P1'"), "a tarefa nasce ligada ao problema")
            await pg.click('[data-ckissok="i1"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("ckFind('ckIss', 'P1').status === 'resolvido' && ckFind('ckIss', 'P1').resolvido === TODAY"), "Resolvido fecha o problema com data")
            chk(await pg.evaluate("/Registrar lição/.test($('#toast').textContent)"), "ao resolver, o aviso oferece registrar a lição"); await pg.click('#toastAct'); await pg.wait_for_timeout(150); await pg.fill("#dlg textarea[name=licao]", "Verificar a georreferência no início"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("ckA('ckLic').at(-1).cod === '" + L2 + "' && /P1/.test(ckA('ckLic').at(-1).titulo)"), "a lição nasce do problema resolvido")
            # decisões
            await pg.evaluate("location.hash='trabalho.decisoes'"); await pg.wait_for_timeout(150)
            await pg.fill("#ck_dq", "Direttiva"); await pg.wait_for_timeout(350)
            chk(await pg.evaluate("document.querySelectorAll('.ckdec').length") == 1, "a busca nas decisões acha pela norma")
            # Gantt
            await pg.evaluate("location.hash='trabalho.gantt'"); await pg.wait_for_timeout(200)
            g = await pg.evaluate("({ bars: document.querySelectorAll('.ckgantt .ckg-b').length, crit: document.querySelectorAll('.ckgantt .ckg-b.crit').length, open: ckT().filter(ckOpen).length, mk: document.querySelectorAll('.ckgantt .ckg-mk').length })")
            chk(g["bars"] == g["open"] and g["crit"] >= 2 and g["mk"] >= 3, f"o Gantt desenha uma barra por tarefa aberta, as atrasadas em destaque e os marcos ({g})")
            await pg.click('[data-vtab="ck-gantt"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("document.querySelectorAll('[data-vid=ck-gantt] tbody tr').length === ckT().filter(ckOpen).length"), "o Gantt tem a tabela equivalente (ES, EF, LS, LF, folga)")
            # BIM
            await pg.evaluate("CK.bimTipo = 'clash'; location.hash='trabalho.bim'"); await pg.wait_for_timeout(150)
            await pg.fill('[data-ckcla="b4"]', "15"); await pg.fill('[data-ckclr="b4"]', "20"); await pg.click('[data-ckclsnap="b4"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("(s => s.at(-1).data === TODAY && s.at(-1).abertos === 15)(ckFind('ckBim', 'B4').snaps)"), "uma nova verificação de clash entra na série")
            # elaborati
            await pg.evaluate("location.hash='trabalho.entregas'"); await pg.wait_for_timeout(150)
            await pg.click('[data-ckelrev="l1"]'); await pg.wait_for_timeout(120); await pg.fill("#dlg input[name=motivo]", "osservazioni del RUP"); await pg.click("#dlg button[value=ok]"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("(e => e.rev === 'B' && e.revisoes.at(-1).rev === 'A' && e.revisoes.at(-1).motivo === 'osservazioni del RUP' && e.stato === 'in redazione')(ckFind('ckEl', 'EL1'))"), "nova revisão: A → B, com o motivo guardado")
            await pg.select_option('[data-ckelst="l3"]', "emesso"); await pg.wait_for_timeout(120)
            chk(await pg.evaluate("ckFind('ckEl', 'EL3').emissao === TODAY"), "marcar como emesso grava a data de emissão")
            # relatórios
            await pg.evaluate("location.hash='trabalho.relatorios'"); await pg.wait_for_timeout(200)
            dr = await pg.evaluate("CK.relDraft")
            chk("# Rapporto mensile" in dr and "| Progetto | Fase |" in dr and "## 4. Rischi principali" in dr and "## 8. Prossimi passi" in dr, "o rascunho do relatório mensal em italiano sai dos dados, sem IA")
            await pg.click('[data-ckexp="html"]'); await pg.wait_for_timeout(200)
            sv = await pg.evaluate("window.__saved.at(-1)")
            html = base64.b64decode(sv["b64"]).decode() if sv.get("b64") else sv.get("data", "")
            chk(sv["filename"].endswith(".html") and "<table>" in html and "<h1>" in html and 'lang="it"' in html, f"exporta em HTML com as tabelas ({sv['filename']})")
            await pg.click('[data-ckger="mensal"]'); await pg.wait_for_timeout(900)
            rel = await pg.evaluate("(x => x && [x.tipo, x.lingua, x.ai, /Rapporto mensile \\(test\\)/.test(x.txt)])(ckA('ckRel')[0])")
            chk(rel == ["mensal", "it", True, True], f"o PMO redige o relatório e ele fica no histórico ({rel})")
            gp = await pg.evaluate("window.__ckGerPrompt || ''")
            chk("RAPPORTO MENSILE ALLA DIREZIONE" in gp and "non inventare" in gp and '"concluidas"' in gp, "o pedido manda os números calculados e proíbe inventar")
            # timeboxing (num dia útil futuro, para não depender da hora do teste)
            tb = await pg.evaluate("(d => ckTimebox(d))(ckAddU(TODAY, 1))")
            chk(len(tb["blocos"]) >= 2 and all(45 <= x["min"] <= 120 for x in tb["blocos"]) and not any("12:" in x["ini"] and x["ini"] >= "12:30" and x["ini"] < "13:30" for x in tb["blocos"]), f"blocos de foco de 45 a 120 min fora da pausa ({[(x['ini'], x['fim'], x['cod']) for x in tb['blocos']]})")
        finally:
            await b.close()
        # PMO sem ferramentas (fallback)
        b, pg, errs2 = await open_page(p, w=1440, h=1000, hash_="trabalho.hoje", cfg={"noTools": True})
        try:
            await pg.wait_for_timeout(900)
            await pg.evaluate("""MST.live = { mid: 'ck', text: '', uso: [], acoes: [], user: { role: 'user', content: 'teste', at: Date.now() } }; finishMentor('Proposta.\\n```atlas\\n{"acoes_ck":[{"tipo":"criar_tarefa","dados":{"titulo":"Tarefa do bloco","responsavel":"Luca","prazo":"2030-01-02","esforco_h":2}}],"propostas":[{"tipo":"habito","titulo":"não deve entrar"}]}\\n```')""")
            await pg.wait_for_timeout(150)
            fb = await pg.evaluate("mget('ck').conversa.at(-1).acoes.map(a => [a.ck || false, a.tipo, a.status])")
            chk(fb == [[True, "criar_tarefa", "pendente"]], f"sem ferramentas, o bloco atlas vira proposta do Cockpit (e só dele) ({fb})")
            await pg.fill("#m_in", "ok"); await pg.press("#m_in", "Enter"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("ckT().some(t => t.titulo === 'Tarefa do bloco' && t.resp === 'm1')"), "“ok” aprova a proposta do bloco")
            chk(not errs2, f"sem erros ({errs2[:2]})")
        finally:
            await b.close()
        # persistência entre sessões (banco)
        b, pg, e3 = await open_page(p, w=1300, h=900, hash_="trabalho.hoje", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            await pg.evaluate("ckD().perfil.nome = 'Pessoa Teste'; ckD().projetos.push({ id: 'px', nome: 'Projeto X', ativo: true, cor: CK_CORES[0] }); touch('ck')")
            await pg.keyboard.press("Alt+Shift+N"); await pg.fill("#ckq_in", "t: Primeira tarefa real [Projeto X] 4h"); await pg.press("#ckq_in", "Enter")
            await pg.keyboard.press("Alt+Shift+N"); await pg.fill("#ckq_in", "r: Risco real"); await pg.press("#ckq_in", "Enter")
            await pg.wait_for_timeout(1800)
            store = await pg.evaluate("JSON.stringify(window.__store)")
            st = json.loads(store)
            keys = sorted(k.split("/")[-1] for k in st if "/s_ck" in k)
            chk("s_ckTar" in keys and "s_ckRisk" in keys and "s_ck" in keys, f"as listas do Cockpit são documentos próprios no banco privado ({keys})")
        finally:
            await b.close()
        b, pg, e4 = await open_page(p, w=1300, h=900, hash_="trabalho.lista", cfg={"realBoot": True, "seedStore": store})
        try:
            await pg.wait_for_timeout(1000)
            r = await pg.evaluate("({ t: ckT().map(t => [t.cod, t.titulo, ckPN(t.projeto), t.esforco]), r: ckA('ckRisk').map(r => r.cod), nome: ckD().perfil.nome, ex: IS_EXAMPLE })")
            chk(r["t"] == [["T1", "Primeira tarefa real", "Projeto X", 4]] and r["r"] == ["R1"] and r["nome"] == "Pessoa Teste" and r["ex"] is False, f"os dados persistem entre sessões ({r})")
            chk(not e3 and not e4, f"sem erros ({(e3 + e4)[:2]})")
        finally:
            await b.close()
        chk(not errs, f"sem erros no console ({errs[:3]})")
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
