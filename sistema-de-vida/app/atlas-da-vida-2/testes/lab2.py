import asyncio, json, base64, io, zipfile, subprocess, pathlib, datetime, traceback, urllib.parse
from harness import *
ok = 0; bad = 0
OUT = pathlib.Path(__file__).parent / "out"; OUT.mkdir(exist_ok=True)
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
async def section(name, fn, *a):
    global bad
    try: await fn(*a)
    except Exception as e:
        bad += 1; print("FAIL", name, "levantou", type(e).__name__, str(e)[:400]); traceback.print_exc(limit=2)

def d_add(iso, k): return (datetime.date.fromisoformat(iso) + datetime.timedelta(days=k)).isoformat()

# ---------------------------------------------------------------- radar
async def radar(pg):
    T = await pg.evaluate("TODAY")
    cat_var, cat_fix = await pg.evaluate("(() => { const ks = Object.keys(CAT_DESP); return [ks.find(k => /mercado/i.test(k)) || ks[0], ks.find(k => /moradia|aluguel|casa/i.test(k)) || ks[1]]; })()")
    mk = T[:7]
    prev = []
    y, m = int(T[:4]), int(T[5:7])
    for k in (1, 2, 3):
        mm = m - k; yy = y
        while mm <= 0: mm += 12; yy -= 1
        prev.append(f"{yy}-{mm:02d}")
    # contas fixas: aluguel dia 5 nos 3 meses anteriores; variável: 10 por dia nos 90 dias anteriores a hoje
    lanc = [{"id": f"f{i}", "data": f"{p}-05", "tipo": "Despesa", "cat": cat_fix, "desc": "Aluguel", "valor": 900} for i, p in enumerate(prev)]
    lanc += [{"id": f"v{k}", "data": d_add(T, -k), "tipo": "Despesa", "cat": cat_var, "desc": "Compra do dia", "valor": 10} for k in range(1, 91)]
    await pg.evaluate("""([lanc, cv, cf]) => { S = EMPTY(); IS_EXAMPLE = false; S.lanc = lanc; S.orc = { [cv]: 200, [cf]: 1000 }; VER++; }""", [lanc, cat_var, cat_fix])
    fx = await pg.evaluate("fixedItems()")
    chk(len(fx) == 1 and fx[0]["desc"] == "Aluguel" and fx[0]["valor"] == 900 and fx[0]["dia"] == 5, f"contas fixas: só o aluguel, € 900 no dia 5 ({fx})")
    bud = {b["cat"]: b for b in await pg.evaluate("radarBudget()")}
    spent = sum(10 for k in range(1, 91) if d_add(T, -k)[:7] == mk)
    dim = (datetime.date(y + (m == 12), m % 12 + 1, 1) - datetime.timedelta(days=1)).day
    rem = dim - int(T[8:])
    lim = 200 + max(200 * .03, 2)
    kx = next(k for k in range(1, rem + 1) if spent + 10 * k > lim)
    b = bud[cat_var]
    chk(abs(b["spent"] - spent) < 1e-9 and b["p"] == 1 and b["date"] == d_add(T, kx) and b["lo"] == b["hi"] == b["date"], f"simulação com gasto diário constante: estoura em {d_add(T, kx)} (calculado: gasto {spent} + 10/dia > {lim}) · app: {b.get('date')} p={b['p']}")
    chk(abs(b["med"] - (spent + 10 * rem)) < 1e-9, f"total projetado do mês = gasto + 10 × {rem} dias = {spent + 10 * rem} (app {b['med']})")
    f = bud[cat_fix]
    chk(f["fixo"] == 900 and f["p"] == 0, f"aluguel ainda não pago entra uma vez: 900 de 1000 não alerta (p={f['p']}, fixo={f['fixo']})")
    await pg.evaluate("([cv, cf]) => { S.orc = { [cv]: 400, [cf]: 850 }; VER++; }", [cat_var, cat_fix])
    bud = {b["cat"]: b for b in await pg.evaluate("radarBudget()")}
    chk(bud[cat_var]["p"] == 0, f"teto acima do projetado ({spent + 10 * rem} < 400): chance 0")
    chk(bud[cat_fix]["p"] == 1, "conta fixa maior que o teto: chance 1")
    al = await pg.evaluate("radarAlerts().filter(a => a.tipo === 'orcamento').map(a => a.titulo)")
    chk(any("contas fixas" in t for t in al) and not any(cat_var in t for t in al), f"alerta só da categoria que vai estourar, com o motivo certo ({al})")
    # pagar o aluguel deste mês: a pendência some e o gasto real entra
    await pg.evaluate("([cf]) => { S.lanc.push({ id: 'fpago', data: TODAY.slice(0, 8) + '01', tipo: 'Despesa', cat: cf, desc: 'Aluguel', valor: 900 }); VER++; }", [cat_fix])
    bf = [b for b in await pg.evaluate("radarBudget()") if b["cat"] == cat_fix][0]
    chk(bf["fixo"] == 0 and bf["spent"] == 900 and bf["over"], f"aluguel pago: sem pendência, gasto 900 > teto 850 vira fato ({bf['fixo']}, {bf['spent']})")

    # humor: série sintética com padrão conhecido
    N = 120; start = d_add(T, -(N - 1))
    sono = [5.0 if t % 10 in (0, 1, 2) else 8.0 for t in range(N)]
    bem = [2 if t % 10 in (3, 4) else 4 for t in range(N)]
    for t in (N - 3, N - 2, N - 1): sono[t] = 5.0
    saude = {d_add(start, t): {"sono": sono[t], "humor": bem[t]} for t in range(N)}
    await pg.evaluate("(sd) => { S = EMPTY(); IS_EXAMPLE = false; S.saude = sd; VER++; }", saude)
    meta = 7.5
    def win(c, i, w, need):
        v = [c[j] for j in range(i - w + 1, i + 1) if j >= 0 and c[j] is not None]
        return v if len(v) >= need else None
    def f_sono(i):
        v = win(sono, i, 3, 2); return None if v is None else (sum(v) / len(v) < meta - 1)
    def outc(i):
        k = 0; hit = False
        for j in range(i + 1, min(i + 4, N)):
            if bem[j] is not None: k += 1; hit = hit or bem[j] <= 2
        return hit if k >= 2 else None
    bn = bh = n = hits = 0
    for i in range(0, N - 3):
        o = outc(i)
        if o is None: continue
        bn += 1; bh += int(o)
        if f_sono(i) is True: n += 1; hits += int(o)
    mood = await pg.evaluate("(() => { const m = radarMood(); return { base: m.base, bn: m.bn, s: m.sig.find(s => s.id === 'sono') }; })()")
    s = mood["s"]
    chk(mood["bn"] == bn and abs(mood["base"] - bh / bn) < 1e-12, f"risco normal: {bh}/{bn} = {bh / bn:.3f} (app {mood['base']:.3f})")
    chk(s["n"] == n and s["hits"] == hits and abs(s["p"] - hits / n) < 1e-12, f"sinal sono curto: {hits}/{n} dias depois foram ruins (app {s['hits']}/{s['n']})")
    chk(abs(s["lift"] - (hits / n) / (bh / bn)) < 1e-12 and s["ok"] and s["ativo"], f"sinal confiável (risco {s['lift']:.2f}× o normal) e ativo agora")
    al = await pg.evaluate("radarAlerts().filter(a => a.tipo === 'humor')")
    chk(len(al) == 1 and f"({n} vezes)" in al[0]["texto"], f"alerta de humor cita a evidência ({al[0]['texto'][:160] if al else '-'})")
    # sem sinal ativo, sem alerta
    await pg.evaluate("(() => { const ks = Object.keys(S.saude).sort().slice(-3); ks.forEach(k => S.saude[k].sono = 8); VER++; })()")
    chk(await pg.evaluate("radarAlerts().filter(a => a.tipo === 'humor').length") == 0, "sono normal nos últimos dias: alerta some")
    # conferência posterior: humor
    c1 = d_add(T, -10); c2 = d_add(T, -20)
    for k in (1, 2, 3): saude[d_add(c1, k)] = {"sono": 7, "humor": 2 if k == 2 else 4}; saude[d_add(c2, k)] = {"sono": 7, "humor": 4}
    await pg.evaluate("""([sd, c1, c2]) => { S.saude = sd; S.radar = { log: [
        { key: 'humor:sono:' + c1, tipo: 'humor', titulo: 'Risco', criado: c1, verif: addDays(c1, 3), status: 'aberto' },
        { key: 'humor:sono:' + c2, tipo: 'humor', titulo: 'Risco', criado: c2, verif: addDays(c2, 3), status: 'aberto' },
        { key: 'humor:sono:' + TODAY, tipo: 'humor', titulo: 'Risco', criado: TODAY, verif: addDays(TODAY, 3), status: 'aberto' } ] }; VER++; radarSync(); }""", [saude, c1, c2])
    lg = await pg.evaluate("S.radar.log.map(x => [x.criado, x.status])")
    st = {c: s_ for c, s_ in lg}
    chk(st.get(c1) == "confirmado" and st.get(c2) == "nao" and st.get(T) == "aberto", f"conferência: aconteceu / não aconteceu / ainda aberto ({lg})")
    acc = await pg.evaluate("radarAccuracy()")
    chk(acc["n"] == 2 and acc["ok"] == 1, f"acerto do radar 1 de 2 ({acc['ok']}/{acc['n']})")


async def radar_ui(p):
    b, pg, errs = await open_page(p, w=1440, hash_="radar")
    await pg.wait_for_timeout(400)
    n_al = await pg.evaluate("radarAlerts().length")
    chk(await pg.locator(".ralert").count() >= n_al > 0, f"página do radar mostra os {n_al} alertas")
    fb = pg.locator("[data-radfb]").first
    if await fb.count():
        v = await fb.get_attribute("data-radfb"); await fb.click(); await pg.wait_for_timeout(300)
        key, val = v.split("|")
        chk(await pg.evaluate(f"S.radar.log.find(x => x.key === {json.dumps(key)})?.fb") == val, "avaliar alerta como útil fica registrado")
    else: chk(False, "botões de avaliação do alerta existem")
    await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(300)
    chk(await pg.locator(".hjradar .ralert, .ralert").count() >= 1, "Hoje mostra os alertas do radar")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- fechamento semanal
async def weekly(p):
    b, pg, errs = await open_page(p, w=1440, hash_="semana")
    await pg.wait_for_timeout(400)
    T = await pg.evaluate("TODAY"); wk = await pg.evaluate("fsWk()")
    chk(wk == await pg.evaluate("weekStart(TODAY)") if await pg.evaluate("parse(TODAY).getDay()") == 0 else True, f"no domingo o fechamento é da semana corrente ({wk})")
    # numa segunda ou terça, o exemplo já traz a semana anterior fechada e a semana-alvo acabou de começar, sem dados:
    # reabre a anterior, que é o caso de uso real (fechar na segunda a semana que terminou)
    if not await pg.evaluate("S.lanc.some(l => l.tipo === 'Despesa' && l.data >= fsWk() && l.data <= TODAY)"):
        wk = await pg.evaluate("(() => { const prev = addDays(weekStart(TODAY), -7); delete S.fechamentos[prev]; FS.wk = null; render(); return fsWk(); })()"); await pg.wait_for_timeout(200)
    # números da semana com conta fixa excluída
    nums = await pg.evaluate("""(wk) => { const ds = [0,1,2,3,4,5,6].map(i => addDays(wk, i)).filter(d => d <= TODAY);
        const fixed = S.lanc.filter(l => l.tipo === 'Despesa' && l.data >= wk && l.data <= addDays(wk, 6) && isFixed(l)).map(l => l.valor);
        const all = S.lanc.filter(l => l.tipo === 'Despesa' && l.data >= wk && l.data <= addDays(wk, 6)).map(l => +l.valor);
        const bem = ds.map(d => S.saude[d]?.humor ?? null);
        return { N: weekNums(wk), fixed, all, ds }; }""", wk)
    N = nums["N"]
    chk(abs(N["gasto"] - (sum(nums["all"]) - sum(nums["fixed"]))) < 1e-6 and 0 < N["gasto"] < sum(nums["all"]), f"gastos variáveis da semana excluem só as contas fixas: {sum(nums['all']):.2f} − {sum(nums['fixed']):.2f} = {N['gasto']:.2f}")
    await pg.evaluate("S.prio = ['Entregar o relatório', 'Correr 3 vezes', 'Ligar para a avó']; S.priv.semIA = ['Saúde mental']; VER++; render()")
    await pg.click(".fssteps [data-fsstep='1']"); await pg.wait_for_timeout(250)
    star = pg.locator("[data-fsstar]").first
    sid = await star.get_attribute("data-fsstar") if await star.count() else None
    if sid: await star.click(); await pg.wait_for_timeout(250)
    chk(sid and sid in (await pg.evaluate("fsDraft().destaques")), "estrela no diário da semana")
    await pg.click(".fssteps [data-fsstep='2']"); await pg.wait_for_timeout(250)
    await pg.click("label:has([data-fsfeita='0'])"); await pg.wait_for_timeout(250)
    d = await pg.evaluate("fsDraft()")
    chk(d["prioAnt"][:3] == ["Entregar o relatório", "Correr 3 vezes", "Ligar para a avó"] and d["prioFeitas"][0] is True, "prioridades da semana marcadas como cumpridas")
    await pg.click(".fssteps [data-fsstep='3']"); await pg.wait_for_timeout(250)
    for fid, v in (("fs_vitoria", "Entreguei o relatório no prazo"), ("fs_naofunc", "Dormi tarde três vezes"), ("fs_aprendi", "Planejar o dia na véspera ajuda")):
        await pg.fill("#" + fid, v); await pg.dispatch_event("#" + fid, "change")
    await pg.evaluate("(() => { const r = document.querySelector('#fs_nota'); r.value = 8; r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); })()")
    d = await pg.evaluate("fsDraft()")
    chk(d["vitoria"].startswith("Entreguei") and d["aprendi"].startswith("Planejar") and d["nota"] == 8 and d["status"] == "rascunho", "reflexão e nota salvas como rascunho")
    await pg.click(".fssteps [data-fsstep='4']"); await pg.wait_for_timeout(250)
    await pg.fill("#fs_p0", "Preparar a entrevista"); await pg.dispatch_event("#fs_p0", "change")
    await pg.fill("#fs_p1", "Dormir antes da meia-noite"); await pg.dispatch_event("#fs_p1", "change")
    sg = pg.locator("[data-fssug]").first
    sgt = (await pg.evaluate("fsSuggest()[0]?.t")) if await sg.count() else None
    if sgt: await sg.click(); await pg.wait_for_timeout(250)
    d = await pg.evaluate("fsDraft()")
    chk(d["proximas"][:2] == ["Preparar a entrevista", "Dormir antes da meia-noite"] and (not sgt or d["proximas"][2] == sgt), f"próximas prioridades: duas digitadas e uma sugerida ({d['proximas']})")
    await pg.click(".fssteps [data-fsstep='5']"); await pg.wait_for_timeout(250)
    n0 = await pg.evaluate("window.__calls.length")
    await pg.click("[data-act=fsai]"); await pg.wait_for_timeout(1800)
    d = await pg.evaluate("fsDraft()")
    chk("Para celebrar" in d["carta"], "carta escrita pela IA salva no rascunho")
    prompt = await pg.evaluate("(n0) => { const c = window.__calls.slice(n0).find(c => c.kind === 'sample'); return c ? (Array.isArray(c.input) ? c.input.map(t => t.content).join('\\n') : c.input) : ''; }", n0)
    chk("CARTA DA SEMANA" in prompt and "humor médio" not in prompt and "(humor " not in prompt, "Saúde mental sem IA: a carta não recebe humor")
    chk("Entreguei o relatório no prazo" in prompt and "Preparar a entrevista" in prompt, "a carta recebe a reflexão e as prioridades")
    au = await pg.evaluate("S.auditoria[0]")
    chk(au["recurso"] == "Fechamento semanal" and au["status"] == "ok", "carta entra no registro de leitura da IA")
    nd = await pg.evaluate("S.diario.length")
    await pg.click("[data-act=fsclose]"); await pg.wait_for_timeout(400)
    f = await pg.evaluate(f"S.fechamentos[{json.dumps(wk)}]")
    chk(f["status"] == "fechado" and f["nums"] and "Para celebrar" in f["carta"], "semana fechada com números guardados")
    chk(await pg.evaluate("S.prio") == d["proximas"], "prioridades da semana nova = as escolhidas no fechamento")
    e = await pg.evaluate("S.diario.at(-1)")
    chk(await pg.evaluate("S.diario.length") == nd + 1 and "#semana" in e["texto"] and "- [ ] Preparar a entrevista" in e["texto"] and e["origem"] == "fechamento", "carta vai para o diário com #semana e as prioridades como lista")
    # numa segunda, depois de fechar a semana anterior a página passa para a semana nova: volta à que foi fechada
    await pg.evaluate(f"FS.wk = {json.dumps(wk)}; render()"); await pg.wait_for_timeout(200)
    chk("semana fechada" in (await pg.locator(".fspanel").inner_text()).lower(), "página mostra a semana fechada")
    # carta sem IA
    await pg.click("[data-act=fsreopen]"); await pg.wait_for_timeout(300)
    await pg.click("[data-act=fslocal]"); await pg.wait_for_timeout(300)
    loc = await pg.evaluate("fsDraft().carta")
    chk(loc.startswith("**Semana de") and "Nota 8/10" in loc and "1. Preparar a entrevista" in loc, "carta montada sem IA com números, nota e prioridades")
    # lembrete: link do Google Agenda e .ics em .zip
    href = await pg.locator("a[href*='calendar.google.com']").get_attribute("href")
    q = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
    hm = await pg.evaluate("nowHM()"); dow = datetime.date.fromisoformat(T).isoweekday() % 7
    k = (0 - dow + 7) % 7
    if k == 0 and hm > "19:00": k = 7
    dd = d_add(T, k).replace("-", "")
    chk(q["dates"][0] == f"{dd}T190000/{dd}T193000" and q["recur"][0] == "RRULE:FREQ=WEEKLY;BYDAY=SU", f"link do Google Agenda: domingo 19:00–19:30, semanal ({q['dates'][0]}, {q['recur'][0]})")
    await pg.select_option("#fs_dia", "3"); await pg.wait_for_timeout(200)
    await pg.fill("#fs_hora", "08:15"); await pg.dispatch_event("#fs_hora", "change"); await pg.wait_for_timeout(200)
    await pg.click("[data-act=fsics]"); await pg.wait_for_timeout(300)
    sv = await pg.evaluate("window.__saved.at(-1)")
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(sv["b64"])))
    chk(sv["filename"] == "atlas-lembrete-semanal.zip" and z.testzip() is None and z.namelist() == ["atlas-lembrete-semanal.ics"], "lembrete baixa um .zip válido com o .ics")
    ics = z.read("atlas-lembrete-semanal.ics").decode()
    k = (3 - dow + 7) % 7 or 7
    chk("RRULE:FREQ=WEEKLY;BYDAY=WE" in ics and f"DTSTART:{d_add(T, k).replace('-', '')}T081500" in ics and "\r\n" in ics and ics.startswith("BEGIN:VCALENDAR") and ics.rstrip().endswith("END:VCALENDAR"), f"ics: quarta 08:15 semanal, linhas CRLF")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- capítulos
async def chapters(p):
    b, pg, errs = await open_page(p, w=1440, hash_="capitulos")
    await pg.wait_for_timeout(400)
    seg = await pg.evaluate("""(() => { const r = mulberry32(11), nz = s => (r() - .5) * s;
        const mk = (bem, sono, n) => Array.from({ length: n }, () => ({ f: { bem: bem + nz(.3), sono: sono + nz(.4) } }));
        const W3 = [...mk(4, 8, 10), ...mk(2.2, 6, 10), ...mk(3.6, 7.6, 10)];
        const W1 = mk(3.5, 7.2, 30), Wsp = [...mk(3.5, 7.2, 12), ...mk(1.5, 5, 2), ...mk(3.5, 7.2, 12)];
        return [chapSegments(W3), chapSegments(W1), chapSegments(Wsp)]; })()""")
    chk(seg[0] == [[0, 10], [10, 20], [20, 30]], f"três fases sintéticas: fronteiras nas semanas 10 e 20 ({seg[0]})")
    chk(seg[1] == [[0, 30]], f"série sem mudança: um capítulo só ({seg[1]})")
    chk(all(b_ - a >= 4 for a, b_ in seg[2]), f"pico de 2 semanas não vira capítulo (mínimo de 4): {seg[2]}")
    ex = await pg.evaluate("(() => { const W = chapWeeks(); return { st: addDays(TODAY, -240), w0: W[0].wk, b: chapSegments(W).map(s => s[0]).slice(1) }; })()")
    off = (datetime.date.fromisoformat(ex["st"]) - datetime.date.fromisoformat(ex["w0"])).days
    def bw(k):
        i = (k + off) // 7
        return i if 7 - ((k + off) % 7) >= 4 else i + 1
    plan = [bw(k) for k in (105, 147, 175, 217)]
    chk(len(ex["b"]) == 4 and all(abs(x - y) <= 1 for x, y in zip(ex["b"], plan)), f"exemplo: as 4 mudanças de fase plantadas são achadas (planejadas {plan}, achadas {ex['b']})")
    L = await pg.evaluate("chapList().map(c => ({ id: c.id, conf: c.conf, ini: c.inicio, fim: c.fim, t: c.titulo }))")
    chk(len(L) >= 2 and all(L[i]["fim"] < L[i + 1]["ini"] for i in range(len(L) - 1)), f"capítulos do exemplo em sequência, sem sobreposição ({len(L)})")
    k = next((i for i, c in enumerate(L) if not c["conf"]), None)
    if k is None:
        await pg.evaluate("S.capitulos = []; VER++; render()"); await pg.wait_for_timeout(200)
        L = await pg.evaluate("chapList().map(c => ({ id: c.id, conf: c.conf, ini: c.inicio, fim: c.fim, t: c.titulo }))"); k = 0
    P0 = L[k]
    await pg.locator(f"g.chseg[data-chsel='{P0['id']}']").click(); await pg.wait_for_timeout(300)
    chk(await pg.evaluate("CH.sel") == P0["id"] and await pg.locator(".chdet").count() == 1, f"tocar na linha do tempo abre o capítulo ({P0['t']})")
    await pg.fill("#ch_t", "Mudança de emprego"); await pg.fill("#ch_n", "Saí da agência e comecei de novo")
    await pg.click(f"[data-chconf='{P0['id']}']"); await pg.wait_for_timeout(300)
    c = await pg.evaluate("S.capitulos.at(-1)")
    chk(c["titulo"] == "Mudança de emprego" and c["nota"].startswith("Saí da") and c["inicio"] == P0["ini"] and c["fim"] == P0["fim"], "confirmar guarda nome, frase e limites")
    L2 = await pg.evaluate("chapList().map(c => ({ id: c.id, conf: c.conf, ini: c.inicio, fim: c.fim }))")
    chk(L2[k]["conf"] and len(L2) == len(L) and all(L2[i]["fim"] < L2[i + 1]["ini"] for i in range(len(L2) - 1)), "confirmado substitui a proposta sem sobrepor as outras")
    n0 = await pg.evaluate("window.__calls.length")
    await pg.click("[data-act=chai]"); await pg.wait_for_timeout(800)
    ts = await pg.evaluate("chapList().filter(c => !c.conf).map(c => c.titulo)")
    chk(ts and all(t.startswith("Fase teste") for t in ts), f"IA dá nome só às propostas ({ts})")
    pr = await pg.evaluate("(n0) => { const c = window.__calls.slice(n0).find(c => c.kind === 'json'); return c ? String(c.input) : ''; }", n0)
    chk("TAREFA: CAPITULOS" in pr and "Mudança de emprego" not in pr, "capítulo já confirmado não vai para a IA")
    # livro em PDF
    await pg.evaluate("location.hash='capitulos.livro'"); await pg.wait_for_timeout(300)
    await pg.click("[data-act=bookpdf]"); await pg.wait_for_timeout(2500)
    sv = await pg.evaluate("window.__saved.at(-1)")
    ano = await pg.evaluate("bookYears().at(-1)")
    chk(sv and sv["filename"] == f"atlas-livro-{ano}.pdf", f"PDF gerado e oferecido para baixar ({sv and sv['filename']})")
    pdf = OUT / "livro.pdf"; pdf.write_bytes(base64.b64decode(sv["b64"]))
    info = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True).stdout
    pages = int([l for l in info.splitlines() if l.startswith("Pages:")][0].split()[1])
    txt = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True).stdout
    chk(pages >= 4 and "A5" in info or "419.53 x 595.28" in info, f"PDF A5 com {pages} páginas")
    chk(all(w in txt for w in ["O ano em números", "Capítulos", "Humor médio", "Sono médio", "Mudança de emprego", "O que aprendi"]), "PDF tem as seções e o capítulo confirmado")
    chk("ç" in txt and "ã" in txt and "é" in txt, "acentos legíveis no texto do PDF (ç, ã, é)")
    chk("€" in txt, "símbolo do euro legível no PDF")
    toc = await pg.evaluate("bookData(bookYears().at(-1)).nums.map(x => x[0])")
    chk(all(t in txt for t in toc), f"todos os {len(toc)} indicadores do ano estão no PDF")
    subprocess.run(["pdftoppm", "-png", "-r", "60", "-f", "1", "-l", "3", str(pdf), str(OUT / "livro")], check=False)
    await pg.click("label:has(#bk_fin)"); await pg.click("label:has(#bk_trechos)"); await pg.wait_for_timeout(100)
    await pg.click("[data-act=bookpdf]"); await pg.wait_for_timeout(2500)
    sv2 = await pg.evaluate("window.__saved.at(-1)")
    (OUT / "livro2.pdf").write_bytes(base64.b64decode(sv2["b64"]))
    txt2 = subprocess.run(["pdftotext", str(OUT / "livro2.pdf"), "-"], capture_output=True, text=True).stdout
    caps = [l for l in txt.splitlines() if "por semana" in l]
    chk("por semana" not in txt2 and len(txt2) < len(txt), f"sem dinheiro e sem trechos: PDF menor e sem gasto por semana ({len(txt2)} < {len(txt)})")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- busca por significado
async def semantic(p):
    b, pg, errs = await open_page(p, w=1440, hash_="diario.perguntar")
    await pg.wait_for_timeout(400)
    st = await pg.evaluate("['cansado', 'cansada', 'entrevista', 'entrevistas', 'sozinho', 'sozinha'].map(stemPT)")
    chk(st[0] == st[1] and st[2] == st[3] and st[4] == st[5], f"radicais: cansado=cansada, entrevista=entrevistas, sozinho=sozinha ({st})")
    ents = [
        ("s1", "Domingo vazio", "Passei o dia em casa, a casa vazia, uma solidão estranha.", 2),
        ("s2", "Praia com amigos", "Rimos muito na praia com a turma, dia leve e feliz.", 5),
        ("s3", "Reunião de orçamento", "Reunião longa sobre o orçamento do projeto e prazos.", 3),
        ("s4", "Semana pesada", "Exausto depois da semana, dormi mal e sem energia.", 2),
        ("s5", "Preparação", "Treinei respostas para as entrevistas da semana que vem.", 3),
    ]
    await pg.evaluate("""(es) => { S = EMPTY(); IS_EXAMPLE = false; S.diario = es.map(([id, t, x, h], i) => ({ id, data: addDays(TODAY, -i - 1), hora: '20:00', titulo: t, texto: x, humor: h, energia: null, fixado: false, aplicados: [], criado: 0 })); VER++; render(); }""", ents)
    top = lambda q: pg.evaluate("(q) => semScore(q).map(x => x.id)", q)
    r1 = await top("Quando me senti sozinho?")
    chk(r1[:1] == ["s1"] and "s2" not in r1, f"“sozinho” acha a solidão sem palavra igual e não acha o dia feliz ({r1})")
    r2 = await top("Dias em que o cansaço pesou")
    chk(r2[:1] == ["s4"], f"“cansaço” acha “exausto, dormi mal” ({r2})")
    r3 = await top("entrevista")
    chk(r3[:1] == ["s5"], f"“entrevista” acha “entrevistas” ({r3})")
    r4 = await top("quando eu ri com amigos")
    chk(r4[:1] == ["s2"] and "s1" not in r4[:1], f"pergunta positiva acha o dia feliz ({r4})")
    # interface + IA, com uma entrada sem IA
    await pg.evaluate("S.diario.find(e => e.id === 's4').semIA = true; VER++; render()")
    await pg.fill("#sem_q", "Quando me senti sozinho ou cansado?"); await pg.press("#sem_q", "Enter"); await pg.wait_for_timeout(800)
    res = await pg.evaluate("SEM.res")
    chk(res["src"] == "ia" and "inventado" not in [x["id"] for x in res["items"]] and res["resposta"], f"IA reordena, id inventado descartado ({[x['id'] for x in res['items']]})")
    pr = await pg.evaluate("(() => { const c = [...window.__calls].reverse().find(c => c.kind === 'json'); return String(c.input); })()")
    chk("id s4" not in pr and "Exausto" not in pr and "id s1" in pr, "entrada sem IA fica fora do pedido; as outras vão")
    chk(await pg.locator(".semit").count() == len(res["items"]) and "Das outras vezes" in await pg.locator("#main").inner_text(), "resposta e lista aparecem na página")
    # parecidas
    await pg.evaluate("location.hash='diario'"); await pg.wait_for_timeout(300)
    await pg.click("#e_s1 [data-dsim]"); await pg.wait_for_timeout(400)
    sim = await pg.evaluate("SEM.sim")
    chk(await pg.evaluate("PAGE + '.' + SUB") == "diario.perguntar" and sim["id"] == "s1" and "s1" not in [x["id"] for x in sim["items"]], f"“Quando me senti assim?” abre parecidas sem a própria ({[x['id'] for x in sim['items']]})")
    chk(sim["items"] and sim["items"][0]["id"] == "s4", f"a mais parecida com o domingo vazio é a semana pesada (humor 2, tristeza/cansaço) ({sim['items'][:2]})")
    # resumos mensais
    more = [(f"m{i}", f"Dia {i}", f"Registro {i} do mês passado, conversa com amigos.", 3) for i in range(4)]
    await pg.evaluate("""(es) => { const mk = addMonth(mkey(TODAY), -1); es.forEach(([id, t, x, h], i) => S.diario.push({ id, data: mk + '-1' + i, hora: '20:00', titulo: t, texto: x, humor: h, energia: null, fixado: false, aplicados: [], criado: 0 })); VER++; render(); }""", more)
    await pg.evaluate("location.hash='diario.perguntar'"); await pg.wait_for_timeout(300)
    await pg.click("[data-act=semsum]"); await pg.wait_for_timeout(1200)
    rs = await pg.evaluate("S.resumos")
    mk_prev = await pg.evaluate("addMonth(mkey(TODAY), -1)")
    n_ok = await pg.evaluate("(mk) => S.diario.filter(e => mkey(e.data) === mk && aiAllowed(e)).length", mk_prev)
    chk(mk_prev in rs and rs[mk_prev]["n"] == n_ok, f"resumo do mês guardado com as {n_ok} entradas liberadas para a IA ({ {k: v['n'] for k, v in rs.items()} })")
    chk((await pg.evaluate("S.auditoria[0].recurso")).startswith("Resumo de"), "resumo entra no registro de leitura da IA")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440)
        await section("radar", radar, pg)
        chk(not errs, f"radar sem erros no console ({errs[:2]})")
        await b.close()
        await section("radar_ui", radar_ui, p)
        await section("semana", weekly, p)
        await section("capitulos", chapters, p)
        await section("busca", semantic, p)
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
