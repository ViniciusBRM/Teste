"""Atlas 4 · o que o diagnóstico pediu além da gravação: XSS no título do experimento e nos ajudantes; backup com formato
conferido; Diário com 50 por vez; teclado (grupos com setas, Enter), campos com nome, tabelas nos gráficos, contraste do tema
claro e alvos de toque; menu com 8 fixas e “Mais”; contador de uso; Painel (roteiro fechado, três estados, modo rápido,
lembrete diário); dias 1–7; KPIs sem registro; backup lembrado; serviços externos desligáveis; uso e avaliação da IA;
primeiros passos; nomes novos (Companheiro de terapia, Mentor do Equilíbrio); Google Agenda tolerante; modo local avisado."""
import asyncio, json, base64, re
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
L = lambda i, d="2026-10-08", v=10: {"id": i, "data": d, "tipo": "Despesa", "cat": "Mercado", "desc": "item " + i, "valor": v, "conta": "C"}
SEED = {U + "s_lanc": {"v": [L("l1"), L("l2")], "at": 1, "r": "R0"}, U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"},
        U + "s_habitos": {"v": [{"id": "h1", "nome": "Ler", "area": "Aprendizado", "meta": 5}], "at": 1, "r": "H0"}}

async def exemplo(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="exp")
    try:
        await pg.wait_for_timeout(600)
        # XSS: o título do experimento em andamento e os ajudantes
        await pg.evaluate("""(() => { const x = S.experimentos.find(e => !e.fim) || S.experimentos[0]; x.titulo = 'Teste <img src=x data-xss=1 onerror="window.__x=1">'; VER++; render(); })()""")
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("[document.querySelectorAll('#main img[data-xss]').length, document.querySelector('#main').innerText.includes('<img src=x'), !!window.__x]")
        chk(r == [0, True, False], f"título com HTML aparece como texto, sem virar elemento ({r})")
        r = await pg.evaluate("""(() => { const o = safeHtml('<b>ok</b><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a><span onclick="x()">s</span>'); const t = document.createElement('div'); t.innerHTML = o; return [o.includes('<b>ok</b>'), !!t.querySelector('img'), !!t.querySelector('a[href]'), !!t.querySelector('[onclick]'), t.textContent.includes('<img')]; })()""")
        chk(r == [True, False, False, False, True], f"safeHtml: mantém formatação, tira img, javascript: e on* ({r})")
        # nomes novos
        r = await pg.evaluate("[MENTOR_DEF.psi.nome, SUBS.psi.find(x => x[0] === 'terapeuta')[1], MENTOR_DEF.conselho.nome, /não substitui/.test(MENTOR_DEF.psi.papel)]")
        chk(r == ["Companheiro de terapia", "Companheiro", "Mentor do Equilíbrio", True], f"nomes novos sem confusão ({r})")
        # gráficos com tabela: todos os que usam os construtores comuns
        await pg.evaluate("location.hash = 'saude.rel'"); await pg.wait_for_timeout(500)
        nt = await pg.evaluate("[document.querySelectorAll('#main section.vis').length, document.querySelectorAll('#main [data-vtab]').length]")
        chk(nt[1] >= 7, f"Saúde › Relatório: gráficos com “ver como tabela” ({nt[1]} de {nt[0]}; antes 1)")
        await pg.evaluate("document.querySelectorAll('#main [data-vtab]')[3].click()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("document.querySelectorAll('#main section.vis table.dt tbody tr').length")
        chk(r > 0, f"a tabela gerada tem linhas ({r})")
        # teclado: heatmap do Diário com uma parada de Tab e setas
        await pg.evaluate("location.hash = 'diario.cal'"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(() => { const g = document.querySelector('#main [data-rvg]'); return g ? [g.querySelectorAll('[data-rvi]').length, g.querySelectorAll('[data-rvi][tabindex=\"0\"]').length, g.querySelector('[data-rvi][tabindex=\"0\"]').getAttribute('role'), !!g.querySelector('[data-rvi][tabindex=\"0\"]').getAttribute('aria-label')] : null; })()")
        chk(r and r[0] > 300 and r[1] == 1 and r[2] == "button" and r[3], f"heatmap: centenas de dias, uma parada de Tab, papel e nome ({r})")
        await pg.evaluate("document.querySelector('#main [data-rvg] [data-rvi][tabindex=\"0\"]').focus()")
        d0 = await pg.evaluate("document.activeElement.dataset.dday")
        await pg.keyboard.press("ArrowLeft"); await pg.wait_for_timeout(100)
        d1 = await pg.evaluate("[document.activeElement.dataset.dday, document.activeElement.getAttribute('tabindex')]")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("[DIA.day, document.activeElement?.dataset?.dday]")
        chk(d1[0] and d1[0] != d0 and d1[1] == "0" and r[0] == d1[0], f"seta anda entre os dias e Enter abre o dia ({d0} → {d1}, aberto {r})")
        # Visão geral: linhas clicáveis do relatório respondem ao Enter
        await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("(() => { const e = document.querySelector('#main .dvr.click[data-xf]'); return e ? [e.getAttribute('tabindex'), e.getAttribute('role')] : null; })()")
        x0 = await pg.evaluate("JSON.stringify(xf())")
        await pg.evaluate("document.querySelector('#main .dvr.click[data-xf]').focus()"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(300)
        x1 = await pg.evaluate("JSON.stringify(xf())")
        chk(r in (["0", "button"], ["-1", "button"]) and x1 != x0, f"filtro cruzado pelo teclado ({r}, {x0} → {x1})")
        # campos sem nome: nenhum nas telas que tinham
        n = 0
        for h in ["jornada.espiritismo", "carreira.avaliacao", "lazer.leitura", "integ", "ajustes", "jornada.centros"]:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(250)
            n += await pg.evaluate("[...document.querySelectorAll('#main input:not([type=hidden]),#main select,#main textarea')].filter(e => e.offsetParent && !(e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title)).length")
        chk(n == 0, f"campos com nome acessível nas telas que tinham 72 sem nome ({n} sem nome)")
        # Painel do dia: roteiro fechado, três estados, modo rápido, lembrete
        await pg.evaluate("location.hash = 'painel'"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("[!!document.querySelector('#pd_rot') && !document.querySelector('#pd_rot').open, Math.round(document.querySelector('#pd_txt').getBoundingClientRect().top + scrollY)]")
        chk(r[0] and r[1] < 700, f"roteiro fechado e o campo do dia no alto ({r})")
        await pg.evaluate("S.rotina = []; PD = pdNew(); VER++; render()"); await pg.wait_for_timeout(200)
        r = await pg.evaluate("(() => { const B = pdRotBlocks(), b = B.find(x => x.id === 'rot'); return [pdRotSt(b), b.st[1], pdRotConta(B).txt]; })()")
        chk(r[0] == "na" and r[1] == "nada a responder hoje" and "sem nada hoje" in r[2], f"roteiro: “nada a responder” não conta como capturado ({r})")
        await pg.click("[data-act=pdrapido]"); await pg.wait_for_timeout(250)
        r = await pg.evaluate("[!!document.querySelector('.pd.rapido'), !!document.querySelector('[data-pdbox=sono]')?.offsetParent, !!document.querySelector('[data-pdbox=humor]')?.offsetParent, !!document.querySelector('[data-pdbox=passos]')?.offsetParent, !!document.querySelector('#pd_rot')?.offsetParent]")
        chk(r == [True, True, True, False, False], f"modo rápido: humor e sono à mostra, o resto recolhido ({r})")
        await pg.click("[data-act=pdlembrete]"); await pg.wait_for_timeout(300)
        sv = await pg.evaluate("window.__saved.at(-1)")
        txt = base64.b64decode(sv["b64"]).decode("latin-1")
        chk(sv["filename"] == "atlas-lembrete-diario.zip" and "RRULE:FREQ=DAILY" in txt and "Registrar o dia" in txt, f"lembrete diário em .ics que se repete ({sv['filename']})")
        await pg.click("[data-act=pdrapido]")
        # menu: 8 fixas e “Mais”
        await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[[...document.querySelectorAll('#nav > a.nv')].length, document.querySelector('#nav [data-act=navmais]')?.textContent.trim(), document.querySelector('#navrest').hidden, document.querySelectorAll('#nav a.nv').length]")
        chk(r[0] == 9 and r[1].startswith("Mais 24 abas") and r[2] is True and r[3] == 33, f"menu: 9 fixas (com a Inspiração), 24 em “Mais”, todas no DOM ({r})")
        await pg.evaluate("location.hash = 'radar'"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[document.querySelector('#navrest').hidden, document.querySelector('#nav a[href=\"#radar\"]').getAttribute('aria-current')]")
        chk(r == [False, "page"], f"numa aba de “Mais”, o grupo abre e marca a aba ({r})")
        chk(not errs, f"sem erros no exemplo ({errs[:3]})")
    finally:
        await b.close()

async def real(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    reqs = []; pg.on("request", lambda r: reqs.append(r.url))
    try:
        await pg.wait_for_timeout(900)
        # uso das abas
        for h in ["visao", "fin.lanc", "visao", "radar"]:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(150)
        r = await pg.evaluate("[S.uso.r.visao, S.uso.r.radar, S.uso.desde, dirty.has('uso')]")
        chk(r[0] >= 2 and r[1] == 1 and r[2] == TODAY_ISO, f"conta as aberturas das abas sem gravar a cada clique ({r})")
        await pg.evaluate("location.hash = 'ajustes'"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[document.querySelector('[data-menufix=visao] ~ small')?.textContent, document.querySelector('[data-menufix=radar]').checked]")
        await pg.evaluate("const c = document.querySelector('[data-menufix=radar]'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true }))"); await pg.wait_for_timeout(300)
        r2 = await pg.evaluate("[S.cfg.menu.includes('radar'), [...document.querySelectorAll('#nav > a.nv')].length]")
        chk(r[0] and int(r[0]) >= 2 and r[1] is False and r2 == [True, 10], f"Ajustes › Menu: contagem ao lado e fixar uma aba ({r}, {r2})")
        # KPIs sem registro (sem treinos nem estudo)
        await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[...document.querySelectorAll('#main .km')].map(k => k.innerText.replace(/\\s+/g, ' ')).filter(t => /TREINOS|ESTUDO/i.test(t))")
        chk(r and all("sem registro" in t for t in r) and not any(" =" in t for t in r), f"zero nos dois períodos vira “sem registro” ({r})")
        # backup: lembrete no Fechamento, data guardada, aviso some
        await pg.evaluate("location.hash = 'semana'"); await pg.wait_for_timeout(300)
        has = await pg.evaluate("!!document.querySelector('#main .banner [data-act=xbackup]')")
        await pg.click("#main .banner [data-act=xbackup]"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[window.__saved.at(-1).filename, S.cfg.ultimoBackup, !!document.querySelector('#main .banner [data-act=xbackup]')]")
        await pg.evaluate("location.hash = 'integ'"); await pg.wait_for_timeout(300)
        t = await pg.evaluate("document.querySelector('#main').innerText.includes('Último backup')")
        chk(has and r[0].startswith("atlas-da-vida-backup-") and r[1] == TODAY_ISO and r[2] is False and t, f"backup: lembrete, data guardada e mostrada ({has}, {r}, {t})")
        bk = json.loads(base64.b64decode((await pg.evaluate("window.__saved.at(-1)"))["b64"]).decode())
        chk(bk["versao"] == 4 and "uso" in bk["dados"], f"o backup sai como versão 4 e leva o uso ({bk['versao']})")
        # backup com formato errado: o que não confere fica de fora
        await pg.evaluate("""importBackup(JSON.stringify({ app: 'Atlas da Vida', versao: 3, exportado: 7, dados: { lanc: { a: 1 }, diario: [{ id: 'd1', data: TODAY, texto: 'do backup', criado: 1, editado: 1 }] } }))""")
        await pg.wait_for_timeout(200)
        dl = await pg.evaluate("document.querySelector('#dlg').innerText")
        await pg.click("#bkok"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[Array.isArray(S.lanc), S.lanc.length, S.diario.map(e => e.texto)]")
        chk("Ficam de fora" in dl and "Lançamentos" in dl and r == [True, 2, ["do backup"]], f"restaurar: só entra o que tem o formato certo ({r})")
        # serviços externos: clima desligado não chama o Open-Meteo
        await pg.evaluate("location.hash = 'privacidade'"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("[...document.querySelectorAll('[data-cfgext]')].map(c => [c.dataset.cfgext, c.checked])")
        await pg.evaluate("const c = document.querySelector('[data-cfgext=clima]'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true }))"); await pg.wait_for_timeout(200)
        n0 = len([u for u in reqs if "open-meteo" in u])
        await pg.evaluate("location.hash = 'hoje'"); await pg.wait_for_timeout(700)
        n1 = len([u for u in reqs if "open-meteo" in u])
        chk(r == [["clima", True], ["noticias", True], ["cambio", True]] and n1 == n0 and await pg.evaluate("HJ.wxSt") == "err", f"Privacidade lista os 3 serviços e o clima desligado não sai ({r}, {n0}→{n1})")
        # uso e avaliação da IA
        await pg.evaluate("location.hash = 'mentor.fin'"); await pg.wait_for_timeout(300)
        await pg.evaluate("askMentor('fin', 'Como está o mês?')"); await pg.wait_for_timeout(2500)
        r = await pg.evaluate("[S.uso.ia[TODAY.slice(0, 7)]?.n, S.uso.a['Mentor do Dinheiro'], document.querySelectorAll('#main .aval').length]")
        chk(r[0] >= 1 and r[1] >= 1 and r[2] >= 1, f"a chamada à IA é contada e a resposta ganha “útil / genérica” ({r})")
        await pg.click("#main .aval [data-aval$='|1']"); await pg.wait_for_timeout(250)
        r1 = await pg.evaluate("[mget('fin').conversa.filter(x => x.role === 'assistant').at(-1).aval, S.uso.av.fin]")
        await pg.click("#main .aval [data-aval$='|1']"); await pg.wait_for_timeout(250)
        r2 = await pg.evaluate("[mget('fin').conversa.filter(x => x.role === 'assistant').at(-1).aval ?? null, S.uso.av.fin]")
        chk(r1 == [1, {"u": 1, "g": 0}] and r2 == [None, {"u": 0, "g": 0}], f"avaliar e desfazer a avaliação ({r1}, {r2})")
        await pg.evaluate("S.cfg.iaAviso = 1; touch('cfg'); askMentor('fin', 'De novo')"); await pg.wait_for_timeout(600)
        tt = await pg.evaluate("document.querySelector('#toast').textContent")
        await pg.wait_for_timeout(2200)
        await pg.evaluate("location.hash = 'privacidade'"); await pg.wait_for_timeout(300)
        pv = await pg.evaluate("document.querySelector('#main').innerText")
        chk("Aviso de uso" in tt and "Uso da IA" in pv and "Mentor do Dinheiro" in pv, f"aviso de uso e o painel em Privacidade ({tt!r})")
        chk(not errs, f"sem erros ({errs[:3]})")
    finally:
        await b.close()

async def vazio_e_datas(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="hoje", cfg={"realBoot": True})
    try:
        await pg.wait_for_timeout(800)
        r = await pg.evaluate("[!!document.querySelector('.hjpassos'), document.querySelector('.hjpassos h2')?.textContent, document.querySelector('#main .banner')?.innerText.includes('Atlas 3')]")
        chk(r[0] and "0 de 4" in r[1] and r[2], f"usuário novo: primeiros passos no Hoje e a faixa explica como trazer o Atlas 3 ({r})")
        await pg.click("[data-act=passosok]"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate("[!!document.querySelector('.hjpassos'), S.cfg.passosOk]") == [False, True], "dispensar os primeiros passos")
    finally:
        await b.close()
    b, pg, errs2 = await open_page(p, w=1440, h=1000, hash_="fin.rel", cfg={"now": "2026-10-03T10:00:00"})
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("[REF, document.querySelector('.mfecha')?.textContent, !!document.querySelector('[data-act=mnow]')]")
        chk(r == ["2026-09", "mês fechando", True], f"dias 1–7: a tela diz que mostra o mês que fechou ({r})")
    finally:
        await b.close()
    b, pg, errs3 = await open_page(p, w=1440, h=1000, hash_="visao", cfg={"realBoot": True, "none": True})
    try:
        await pg.wait_for_timeout(700)
        r = await pg.evaluate("[STORE.kind, (document.querySelector('#main .banner')?.innerText || '')]")
        chk(r[0] == "local", f"sem conta: modo local ({r[0]})")
        await pg.evaluate("S.lanc.push({ id: 'x', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'x', valor: 1, conta: 'C' }); touch('lanc')"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("document.querySelector('#main .banner')?.innerText || ''")
        chk("Sem conta nesta visualização" in r, f"modo local avisa que fica só no navegador ({r[:80]!r})")
        chk(not (errs + errs2 + errs3), f"sem erros ({(errs + errs2 + errs3)[:3]})")
    finally:
        await b.close()

async def diario_e_tema(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="diario.feed", cfg={"realBoot": True, "seedStore": json.dumps(SEED)}, theme="light")
    try:
        await pg.wait_for_timeout(700)
        r = await pg.evaluate("['--muted', '--good', '--warn', '--crit', '--accent', '--a-fam'].map(k => getComputedStyle(document.documentElement).getPropertyValue(k).trim())")
        chk(r == ["#636b79", "#117a4b", "#926007", "#ca2e2e", "#485ddf", "#b45f0d"], f"tema claro com os tons de contraste ≥ 4,5 ({r})")
        await pg.evaluate("for (let i = 0; i < 1900; i++) S.diario.push({ id: 'e' + i, data: addDays(TODAY, -i), texto: 'Entrada de teste número ' + i + ' com #tema e um texto mais longo para pesar.', humor: 1 + i % 5, criado: 1, editado: 1 }); touch('diario')")
        await pg.wait_for_timeout(600)
        ms = await pg.evaluate("(() => { VER++; const t = performance.now(); render(); return Math.round(performance.now() - t); })()")
        r = await pg.evaluate("[document.querySelectorAll('#main [id^=\"e_\"]').length, document.querySelector('[data-act=dmore]')?.textContent.trim(), document.querySelector('.dmore .muted')?.textContent]")
        chk(r[0] == 50 and "Mostrar mais 50" in r[1] and "50 de 1.900" in r[2] and ms < 600, f"Diário com 1.900 entradas: 50 por vez, em {ms} ms ({r})")
        await pg.click("[data-act=dmore]"); await pg.wait_for_timeout(300)
        n2 = await pg.evaluate("document.querySelectorAll('#main [id^=\"e_\"]').length")
        await pg.evaluate("DIA.mood = 3; render()"); await pg.wait_for_timeout(200)
        n3 = await pg.evaluate("document.querySelectorAll('#main [id^=\"e_\"]').length")
        chk(n2 == 100 and n3 == 50, f"“mostrar mais” soma 50 e o filtro novo volta a 50 ({n2}, {n3})")
        chk(not errs, f"sem erros ({errs[:3]})")
    finally:
        await b.close()
    # toque: alvos de 24 px num aparelho de toque
    b = await p.chromium.launch(**({"executable_path": CHROME} if globals().get("CHROME") else {"executable_path": "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"}))
    try:
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
        html = SKEL + HTML + "</body></html>"
        await ctx.route("https://**", lambda r: r.abort())   # registrada antes: as rotas mais novas têm prioridade
        await ctx.route("https://atlas.test/", lambda r: r.fulfill(body=html, content_type="text/html"))
        pg = await ctx.new_page(); await pg.add_init_script("window.__MOCKCFG={};" + MOCK)
        await pg.goto("https://atlas.test/#carreira.avaliacao", wait_until="load"); await pg.wait_for_timeout(1200)
        r = await pg.evaluate("(() => { const c = document.querySelector('#main .crd'); const q = c.getBoundingClientRect(); const all = [...document.querySelectorAll('#main button:not([disabled])')].filter(e => e.offsetParent); return [Math.round(q.width), Math.round(q.height), all.filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).length, all.length]; })()")
        chk(r[0] >= 24 and r[1] >= 24, f"toque: a escala de competências passa a 24 px ({r[:2]}; {r[2]} de {r[3]} botões ainda abaixo de 24 px na tela)")
    finally:
        await b.close()

async def agenda(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="integ", cfg={"realBoot": True, "seedStore": json.dumps(SEED), "gcalShape": "estranho"})
    try:
        await pg.wait_for_timeout(900)
        await pg.evaluate("S.eventos = [{ id: 'gc_x', uid: 'gcal:x', origem: 'gcal', data: TODAY, hora: '', titulo: 'Antigo' }]; touch('eventos')")
        await pg.evaluate("gcSync({ silent: true })"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("[S.eventos.map(e => e.titulo), GCAL.st, GCAL.msg]")
        chk(r[0] == ["Antigo"] and r[1] == "err" and "formato" in r[2], f"Google Agenda com formato desconhecido: para e não apaga ({r})")
    finally:
        await b.close()
    b, pg, errs2 = await open_page(p, w=1440, h=1000, hash_="integ", cfg={"realBoot": True, "seedStore": json.dumps(SEED), "gcalShape": "items"})
    try:
        await pg.wait_for_timeout(900)
        await pg.evaluate("gcSync({ silent: true })"); await pg.wait_for_timeout(500)
        r = await pg.evaluate("[S.eventos.map(e => e.titulo), GCAL.st]")
        chk(r == [["Formato items"], "ok"], f"Google Agenda com a lista em items também entra ({r})")
        chk(not (errs + errs2), f"sem erros ({(errs + errs2)[:3]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        await exemplo(p)
        await real(p)
        await vazio_e_datas(p)
        await diario_e_tema(p)
        await agenda(p)
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
