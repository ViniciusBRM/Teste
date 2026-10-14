"""Atlas 4 · gravação: dois aparelhos não se apagam (junta em 3 vias, inclusive o que foi apagado de um lado); aviso ao vivo
quando outro aparelho grava; partes grandes por geração, sem misturar versões; gravar na hora ao esconder a aba; diário de
escrita que reaplica o que não chegou ao banco; conta que não responde ao abrir não vira modo local silencioso; trava curta
entre aparelhos. E o merge3 isolado: listas por id, objetos por campo, sem base nada se apaga."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
L = lambda i, d="2026-10-08", v=10: {"id": i, "data": d, "tipo": "Despesa", "cat": "Mercado", "desc": "item " + i, "valor": v, "conta": "C"}
SEED = {U + "s_lanc": {"v": [L("l1"), L("l2")], "at": 1, "r": "R0"}, U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"}}
DB = "(await window.claude.use('db'))"

async def base(p):
    b, pg, errs = await open_page(p, w=1280, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(600)
        r = await pg.evaluate("""(() => {
          const t = [];
          t.push(JSON.stringify(merge3([{id:1,a:1},{id:2,a:1}], [{id:1,a:1},{id:2,a:1},{id:3,a:1}], [{id:1,a:2},{id:2,a:1},{id:4,a:1}])));
          t.push(JSON.stringify(merge3([{id:1},{id:2}], [{id:2}], [{id:1},{id:2},{id:5}])));
          t.push(JSON.stringify(merge3([{id:1,a:1}], [{id:1,a:3}], [])));
          t.push(JSON.stringify(merge3({x:1,y:1,z:1}, {x:2,y:1,z:1}, {x:1,y:3})));
          t.push(JSON.stringify(merge3(undefined, [{id:1}], [{id:2}])));
          t.push(JSON.stringify(merge3({d1:{sono:7}}, {d1:{sono:7,humor:4}}, {d1:{sono:8}})));
          return t; })()""")
        chk(r[0] == '[{"id":1,"a":2},{"id":2,"a":1},{"id":3,"a":1},{"id":4,"a":1}]', f"merge3: item novo dos dois lados entra e a edição do outro lado vale ({r[0]})")
        chk(r[1] == '[{"id":2},{"id":5}]', f"merge3: o que este aparelho apagou sai, o que o outro criou entra ({r[1]})")
        chk(r[2] == '[{"id":1,"a":3}]', f"merge3: editado aqui e apagado lá fica ({r[2]})")
        chk(r[3] == '{"x":2,"y":3}', f"merge3: objetos campo a campo; campo apagado lá e intacto aqui sai ({r[3]})")
        chk(r[4] == '[{"id":1},{"id":2}]' and r[5] == '{"d1":{"sono":8,"humor":4}}', f"merge3: sem base é a união; dia da saúde junta campo a campo ({r[4]}, {r[5]})")
        st = await pg.evaluate("[STORE.kind, REV.lanc, REV.cfg, !!WATCH, document.querySelector('#savest').textContent]")
        chk(st[:4] == ["db", "R0", "C0", True], f"ao abrir: revisões lidas e aviso ao vivo ligado ({st})")
        # 1) outro aparelho grava sem avisar ao vivo; este aparelho grava depois: junta, não apaga
        await pg.evaluate(f"""(async () => {{ window.__store['{U}s_lanc'] = {{ v: [{json.dumps(L('l1'))}, {json.dumps(L('l2'))}, {json.dumps(L('lB'))}], at: 2, r: 'B1' }}; }})()""")
        await pg.evaluate("S.lanc.push({ id: 'lA', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'item lA', valor: 5, conta: 'C' }); S.lanc = S.lanc.filter(l => l.id !== 'l2'); touch('lanc')")
        await pg.wait_for_timeout(1600)
        r = await pg.evaluate(f"[window.__store['{U}s_lanc'].v.map(l => l.id).sort(), S.lanc.map(l => l.id).sort(), REV.lanc !== 'B1', document.querySelector('#toast').textContent]")
        chk(r[0] == ["l1", "lA", "lB"] and r[1] == ["l1", "lA", "lB"] and r[2], f"dois aparelhos: o lançamento do outro fica, o apagado aqui sai, o novo daqui entra ({r[:3]})")
        chk("Juntei" in r[3], f"avisa que juntou ({r[3]!r})")
        # 2) aviso ao vivo: outro aparelho grava e atualiza s__rev; sem edição pendente aqui, a tela atualiza sozinha
        await pg.evaluate(f"""(async () => {{ const db = {DB}; await db.doc('{U}s_lanc').set({{ v: [...window.__store['{U}s_lanc'].v, {json.dumps(L('lC'))}], at: 3, r: 'B2' }}); await db.doc('{U}s__rev').update({{ lanc: 'B2' }}); }})()""")
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate("[S.lanc.map(l => l.id).sort(), REV.lanc, document.querySelector('#toast').textContent, document.querySelector('#main').innerText.includes('item lC')]")
        chk(r[0] == ["l1", "lA", "lB", "lC"] and r[1] == "B2" and "outro aparelho" in r[2] and r[3], f"aviso ao vivo: o que o outro aparelho gravou aparece sem recarregar ({r})")
        # 3) a própria gravação não dispara releitura (eco ignorado) e a trava foi usada
        w0 = await pg.evaluate("window.__dbw")
        await pg.evaluate("S.cfg.nome = 'Outro nome'; touch('cfg')"); await pg.wait_for_timeout(1500)
        r = await pg.evaluate(f"[window.__dbw - {w0}, window.__store['{U}s_cfg'].v.nome, window.__store['{U}s__rev'].cfg === REV.cfg, !!window.__leases['{U}s__lock']]")
        chk(r[0] == 2 and r[1] == "Outro nome" and r[2] and r[3], f"gravação normal: 1 documento + 1 revisão, com a trava ({r})")
        # 4) trava de outro aparelho: espera ela vencer antes de gravar
        await pg.evaluate(f"window.__leases['{U}s__lock'] = {{ holder: 'outro', exp: Date.now() + 1500 }}; S.cfg.nome = 'Com trava'; touch('cfg')")
        await pg.wait_for_timeout(1000); n1 = await pg.evaluate(f"window.__store['{U}s_cfg'].v.nome")
        await pg.wait_for_timeout(1800); n2 = await pg.evaluate(f"window.__store['{U}s_cfg'].v.nome")
        chk(n1 == "Outro nome" and n2 == "Com trava", f"com a trava de outro aparelho, espera e grava depois ({n1}, {n2})")
        # 5) desfazer não desfaz o que veio de outro aparelho
        await pg.evaluate("S.cfg.nome = 'Antes'; touch('cfg', { label: 'nome' })"); await pg.wait_for_timeout(1200)
        await pg.evaluate(f"""(async () => {{ const db = {DB}; await db.doc('{U}s_cfg').set({{ v: {{ ...window.__store['{U}s_cfg'].v, nome: 'Do celular' }}, at: 9, r: 'B9' }}); await db.doc('{U}s__rev').update({{ cfg: 'B9' }}); }})()""")
        await pg.wait_for_timeout(900)
        r = await pg.evaluate("[S.cfg.nome, UNDO.some(e => 'cfg' in e.b)]")
        chk(r == ["Do celular", False], f"a versão de outro aparelho entra e o desfazer daquela chave é descartado ({r})")
        # 6) gravar na hora ao esconder a aba
        w0 = await pg.evaluate("window.__dbw")
        await pg.evaluate("S.lanc.push({ id: 'lH', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'escondida', valor: 3, conta: 'C' }); touch('lanc'); Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange'))")
        await pg.wait_for_timeout(150)
        r = await pg.evaluate(f"[window.__dbw - {w0}, window.__store['{U}s_lanc'].v.some(l => l.id === 'lH')]")
        chk(r[0] >= 1 and r[1], f"esconder a aba grava na hora, sem esperar 0,7 s ({r})")
        await pg.evaluate("Object.defineProperty(document, 'hidden', { value: false, configurable: true })")
        chk(not errs, f"sem erros ({errs[:3]})")
    finally:
        await b.close()

async def geracoes(p):
    b, pg, errs = await open_page(p, w=1280, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(600)
        big = "(n, tag) => Array.from({ length: n }, (_, i) => ({ id: tag + i, data: '2026-09-01', tipo: 'Despesa', cat: 'Mercado', desc: 'x'.repeat(150) + i, valor: i, conta: 'C' }))"
        await pg.evaluate(f"S.lanc = ({big})(1500, 'a'); touch('lanc')"); await pg.wait_for_timeout(1800)
        r1 = await pg.evaluate(f"(() => {{ const h = window.__store['{U}s_lanc']; return [h.parts, h.g, Object.keys(window.__store).filter(k => k.startsWith('{U}s_lanc.')).sort()]; }})()")
        chk(r1[0] >= 2 and r1[1] == 1 and all(".g1." in k for k in r1[2]) and len(r1[2]) == r1[0], f"valor grande: partes da geração 1 e cabeçalho apontando para ela ({r1[:2]}, {len(r1[2])} partes)")
        await pg.evaluate(f"S.lanc.push(...({big})(400, 'b')); touch('lanc')"); await pg.wait_for_timeout(1800)
        r2 = await pg.evaluate(f"(() => {{ const h = window.__store['{U}s_lanc']; return [h.parts, h.g, Object.keys(window.__store).filter(k => k.startsWith('{U}s_lanc.')).sort()]; }})()")
        chk(r2[1] == 2 and all(".g2." in k for k in r2[2]) and len(r2[2]) == r2[0], f"nova gravação: geração 2 completa e a 1 apagada depois ({r2[:2]}, {r2[2][:2]})")
        # gravação interrompida: partes de uma geração 3 incompleta, cabeçalho ainda na 2 -> a leitura não mistura
        store = await pg.evaluate(f"(() => {{ const s = JSON.parse(JSON.stringify(window.__store)); s['{U}s_lanc.g3.0'] = {{ v: [{{ id: 'meio', data: '2026-09-01', tipo: 'Despesa', cat: 'Mercado', desc: 'gravação interrompida', valor: 1, conta: 'C' }}] }}; return JSON.stringify(s); }})()")
        n_ok = await pg.evaluate("S.lanc.length")
        await b.close()
        b, pg, errs2 = await open_page(p, w=1280, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": store})
        await pg.wait_for_timeout(700)
        r3 = await pg.evaluate("[S.lanc.length, S.lanc.some(l => l.id === 'meio'), PARTS.lanc.g]")
        chk(r3 == [n_ok, False, 2], f"gravação interrompida no meio: a leitura usa a geração completa, sem misturar ({r3}, esperado {n_ok})")
        await pg.evaluate("S.lanc = S.lanc.slice(0, 3); touch('lanc')"); await pg.wait_for_timeout(1500)
        r4 = await pg.evaluate(f"[Array.isArray(window.__store['{U}s_lanc'].v), Object.keys(window.__store).filter(k => k.startsWith('{U}s_lanc.g2.')).length]")
        chk(r4 == [True, 0], f"voltou a caber num documento: as partes da geração 2 saem ({r4})")
        chk(not errs and not errs2, f"sem erros ({(errs + errs2)[:3]})")
    finally:
        await b.close()

async def nova_ctx(b, cfg):
    ctx = await b.new_context(viewport={"width": 1280, "height": 900})
    html = SKEL + HTML + "</body></html>"
    await ctx.route("https://atlas.test/", lambda r: r.fulfill(body=html, content_type="text/html"))
    await ctx.route("https://cdnjs.cloudflare.com/**", lambda r: r.abort())
    await ctx.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
    await ctx.route("https://api.**", lambda r: r.abort()); await ctx.route("https://geocoding-api.**", lambda r: r.abort())
    return ctx

async def abre(ctx, cfg, hash_="fin.lanc"):
    pg = await ctx.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    await pg.add_init_script("window.__MOCKCFG=" + json.dumps(cfg) + ";" + MOCK)
    await pg.goto("https://atlas.test/#" + hash_, wait_until="load"); await pg.wait_for_timeout(900)
    return pg, errs

async def diario_escrita(p):
    b = await p.chromium.launch(**({"executable_path": CHROME} if globals().get("CHROME") else {"executable_path": "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"}))
    try:
        ctx = await nova_ctx(b, None)
        cfg = {"realBoot": True, "seedStore": json.dumps(SEED)}
        pg, e1 = await abre(ctx, cfg)
        await pg.evaluate("flushSoon = () => {}; flush = async () => {}; S.lanc.push({ id: 'lW', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'antes de fechar', valor: 7, conta: 'C' }); touch('lanc')")
        wal = await pg.evaluate("(() => { const e = JSON.parse(localStorage.getItem('atlas4_wal_lanc') || 'null'); return e && [e.b, e.v.map(l => l.id)]; })()")
        chk(wal == ["R0", ["l1", "l2", "lW"]], f"a edição vai na hora para o diário de escrita deste aparelho, com a revisão de base ({wal})")
        await pg.close()   # a aba fecha antes de gravar (a página nova lê o banco original)
        pg2, e2 = await abre(ctx, cfg)
        await pg2.wait_for_timeout(1500)
        r = await pg2.evaluate(f"[S.lanc.map(l => l.id).sort(), (window.__store['{U}s_lanc'].v || []).map(l => l.id).sort(), localStorage.getItem('atlas4_wal_lanc'), document.querySelector('#toast').textContent]")
        chk(r[0] == ["l1", "l2", "lW"] and r[1] == ["l1", "l2", "lW"] and r[2] is None and "Recuperei" in r[3], f"a próxima abertura reaplica, grava e limpa o diário ({r})")
        await pg2.close()
        # diário de escrita + outro aparelho gravou no meio: entra a união
        pg3, e3 = await abre(ctx, cfg)
        await pg3.evaluate("flushSoon = () => {}; flush = async () => {}; S.lanc.push({ id: 'lX', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'x', valor: 1, conta: 'C' }); touch('lanc')")
        await pg3.close()
        seed2 = dict(SEED); seed2[U + "s_lanc"] = {"v": [L("l1"), L("l2"), L("lZ")], "at": 5, "r": "Z1"}
        pg4, e4 = await abre(ctx, {"realBoot": True, "seedStore": json.dumps(seed2)})
        await pg4.wait_for_timeout(1500)
        r = await pg4.evaluate(f"[S.lanc.map(l => l.id).sort(), window.__store['{U}s_lanc'].v.map(l => l.id).sort()]")
        chk(r[0] == ["l1", "l2", "lX", "lZ"] and r[1] == r[0], f"pendente aqui e outro aparelho gravou depois: entram os dois ({r})")
        chk(not (e1 + e2 + e3 + e4), f"sem erros ({(e1 + e2 + e3 + e4)[:3]})")
        await ctx.close()
    finally:
        await b.close()

async def conta_fora(p):
    # a conta não responde nas 4 tentativas: não vira modo local; o que se registra espera e depois se junta
    b, pg, errs = await open_page(p, w=1280, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": json.dumps(SEED), "dbFailGets": 4})
    try:
        await pg.wait_for_timeout(7600)
        r = await pg.evaluate("[STORE.kind, DB_FAIL, document.querySelector('#savest').textContent, !!document.querySelector('[data-act=dbretry]'), document.querySelector('#main').innerText.includes('Sua conta não respondeu'), S.lanc.length]")
        chk(r[:5] == ["db", "unavailable", "Sem conexão com a conta · guardando neste aparelho", True, True], f"conta fora: aviso claro e botão para tentar de novo, sem cair para o navegador ({r})")
        w0 = await pg.evaluate("window.__dbw")
        await pg.evaluate("S.lanc.push({ id: 'lF', data: TODAY, tipo: 'Despesa', cat: 'Mercado', desc: 'na queda', valor: 2, conta: 'C' }); touch('lanc')")
        await pg.wait_for_timeout(1200)
        r = await pg.evaluate(f"[window.__dbw - {w0}, !!localStorage.getItem('atlas4_wal_lanc'), localStorage.getItem('atlas_lanc')]")
        chk(r == [0, True, None], f"na queda: nada vai ao banco nem ao modo local; a edição fica no diário de escrita ({r})")
        await pg.click("[data-act=dbretry]"); await pg.wait_for_timeout(1800)
        r = await pg.evaluate(f"[DB_FAIL, S.lanc.map(l => l.id).sort(), window.__store['{U}s_lanc'].v.map(l => l.id).sort(), S.cfg.nome, !!document.querySelector('[data-act=dbretry]')]")
        chk(r == [None, ["l1", "l2", "lF"], ["l1", "l2", "lF"], "Teste", False], f"a conta volta: o que estava no banco aparece e o registrado na queda se junta ({r})")
        chk(not errs, f"sem erros ({errs[:3]})")
    finally:
        await b.close()
    # falha só nas 2 primeiras leituras: abre normal, sem aviso
    b, pg, errs = await open_page(p, w=1280, h=900, hash_="fin.lanc", cfg={"realBoot": True, "seedStore": json.dumps(SEED), "dbFailGets": 2})
    try:
        await pg.wait_for_timeout(3800)
        r = await pg.evaluate("[DB_FAIL, S.lanc.length, !!document.querySelector('[data-act=dbretry]')]")
        chk(r == [None, 2, False], f"falha passageira: tenta de novo e abre com os dados ({r})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        await base(p)
        await geracoes(p)
        await diario_escrita(p)
        await conta_fora(p)
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
