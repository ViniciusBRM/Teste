import asyncio, json, base64, io, zipfile, pathlib, datetime, traceback, re
from dateutil.rrule import rrulestr
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
        bad += 1; print("FAIL", name, "levantou", type(e).__name__, str(e)[:500]); traceback.print_exc(limit=3)
D = datetime.date
def dd(iso): return D.fromisoformat(iso)
def add(iso, k): return (dd(iso) + datetime.timedelta(days=k)).isoformat()
async def toast_text(pg):
    return await pg.evaluate("(() => { const t = document.querySelector('#toast'); return t && !t.hidden ? t.innerText : ''; })()")

# ---------------------------------------------------------------- espaço a dois
async def dupla(p):
    b0, pg0, _ = await open_page(p, w=1440)
    T = await pg0.evaluate("TODAY"); await b0.close()
    mk = T[:7]; d1 = mk + "-01"
    seed = {
        "dupla/u_partner": {"consenteMentor": False, "entrou": d1, "at": 1},
        f"dupla/u_partner/diario/{mk}": {"mes": mk, "itens": [{"id": "pd1", "data": d1, "texto": "Gostei do jantar de ontem, foi leve.", "humor": 5, "at": 1}]},
        f"dupla/u_partner/gastos/{mk}": {"mes": mk, "itens": [{"id": "pg1", "data": d1, "desc": "Luz", "valor": 60, "cat": "Contas", "parte": 0.5, "at": 1}]},
        "dupla/u_partner/metas/g1": {"titulo": "Viagem para a Sicília", "tipo": "valor", "alvo": 1000, "un": "€", "prazo": "", "criado": 1},
    }
    b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed)}, hash_="dupla")
    await pg.wait_for_timeout(500)
    chk(await pg.evaluate("DUO.ready && !!DUO.members.u_partner && !duoJoined()"), "espaço conectado: a outra pessoa já está, você ainda não")
    chk(await pg.locator("[data-act=duojoin]").count() == 1 and await pg.locator("#duo_txt").count() == 0, "antes de entrar: só leitura, com o botão de entrar")
    await pg.click("[data-act=duojoin]"); await pg.wait_for_timeout(400)
    me = await pg.evaluate("window.__store['dupla/u_test']")
    chk(me and me["consenteMentor"] is False, "entrar cria o seu perfil no espaço, sem consentimento para o mentor")
    await pg.fill("#duo_txt", "Fizemos a escala da louça. Sem briga."); await pg.click("[data-duoh='4']")
    await pg.click("[data-act=duopost]"); await pg.wait_for_timeout(400)
    di = await pg.evaluate(f"window.__store['dupla/u_test/diario/{mk}']")
    chk(di and di["itens"][0]["texto"].startswith("Fizemos") and di["itens"][0]["humor"] == 4, "entrada a dois gravada no seu documento do mês")
    feed = await pg.locator(".duoent").all_inner_texts()
    chk(len(feed) == 2 and any("Chiara" in f for f in feed) and any("Você" in f for f in feed), "diário a dois mostra as duas pessoas")
    chk(await pg.locator(".duoent:not(.mine) [data-duodel]").count() == 0, "não há botão de apagar na entrada da outra pessoa")
    # orçamento
    await pg.evaluate("location.hash='dupla.orcamento'"); await pg.wait_for_timeout(300)
    await pg.fill("#dg_desc", "Mercado da semana"); await pg.fill("#dg_valor", "80"); await pg.select_option("#dg_parte", "0.5")
    await pg.click("[data-act=duogasto]"); await pg.wait_for_timeout(400)
    await pg.fill("#dg_desc", "Presente da mãe dela"); await pg.fill("#dg_valor", "25"); await pg.select_option("#dg_parte", "0")
    await pg.click("[data-act=duogasto]"); await pg.wait_for_timeout(400)
    bal = await pg.evaluate(f"duoBalance('{mk}')")
    exp = 80 * .5 + 25 * 1 - 60 * .5
    chk(abs(bal["bal"] - exp) < 1e-9 and abs(bal["tot"] - 165) < 1e-9, f"acerto: 80 meio a meio + 25 pela outra pessoa − 60 dela meio a meio = {exp} (app {bal['bal']})")
    txt = await pg.locator("#main").inner_text()
    e35 = await pg.evaluate("eur(35, 2)")
    chk(f"Chiara deve {e35} para Você" in txt, f"frase do acerto: “Chiara deve {e35} para Você”")
    # metas
    await pg.evaluate("location.hash='dupla.metas'"); await pg.wait_for_timeout(300)
    key = "u_partner:g1"; sl = await pg.evaluate(f"slug('{key}')")
    await pg.fill(f"#ap_{sl}", "200"); await pg.click(f"[data-duoap='{key}']"); await pg.wait_for_timeout(400)
    ap = await pg.evaluate(f"window.__store['dupla/u_test/aportes/{mk}']")
    chk(ap and ap["itens"][0]["meta"] == key and ap["itens"][0]["valor"] == 200, "contribuição na meta dela fica no seu documento")
    t2 = await pg.locator("#main").inner_text()
    chk("20%" in t2 and "200 de 1.000" in t2, "meta mostra 20% (200 de 1.000)")
    await pg.fill("#dm_t", "Um jantar sem celular por semana"); await pg.select_option("#dm_tipo", "marco")
    await pg.click("[data-act=duometa]"); await pg.wait_for_timeout(400)
    mine = await pg.evaluate("Object.entries(window.__store).filter(([k]) => k.startsWith('dupla/u_test/metas/')).map(([, v]) => v.titulo)")
    chk(mine == ["Um jantar sem celular por semana"], "meta nova criada no seu espaço")
    # consentimento e mentor
    await pg.evaluate("location.hash='dupla'"); await pg.wait_for_timeout(300)
    facts0 = await pg.evaluate("duoFacts().join('\\n')")
    chk("nenhuma das pessoas autorizou" in facts0 and "louça" not in facts0, "sem consentimento: o mentor não lê nada do espaço")
    await pg.click("label:has(#duo_cons)"); await pg.wait_for_timeout(400)
    chk(await pg.evaluate("window.__store['dupla/u_test'].consenteMentor") is True, "consentimento gravado no seu perfil")
    facts1 = await pg.evaluate("duoFacts().join('\\n')")
    chk("louça" in facts1 and "jantar de ontem" not in facts1, "mentor lê só quem autorizou (você), não a outra pessoa")
    await pg.evaluate("(async () => { const db = await window.claude.use('db'); await db.doc('dupla/u_partner').update({ consenteMentor: true }); })()"); await pg.wait_for_timeout(400)
    facts2 = await pg.evaluate("duoFacts().join('\\n')")
    chk("jantar de ontem" in facts2, "quando ela autoriza, o texto dela passa a ser lido")
    n0 = await pg.evaluate("window.__calls.length")
    await pg.evaluate("askMentor('amo', 'Como estamos como casal?')"); await pg.wait_for_timeout(2500)
    pr = await pg.evaluate("(n0) => { const c = window.__calls.slice(n0).find(c => c.kind === 'sample'); return c ? JSON.stringify(c.input) : ''; }", n0)
    chk("Espaço a dois" in pr and "louça" in pr, "Mentor do Amor recebe o espaço a dois")
    au = await pg.evaluate("S.auditoria[0]")
    chk(any("espaço a dois" in f for f in au["ferr"]), f"leitura do espaço aparece no registro de privacidade ({au['ferr']})")
    # compartilhar uma entrada do diário pessoal
    await pg.evaluate("location.hash='diario'"); await pg.wait_for_timeout(400)
    btn = pg.locator("[data-dduo]").first; eid = await btn.get_attribute("data-dduo"); await btn.click(); await pg.wait_for_timeout(500)
    e = await pg.evaluate(f"S.diario.find(e => e.id === '{eid}')")
    doc = await pg.evaluate(f"window.__store['dupla/u_test/diario/{e['data'][:7]}']")
    sh = [x for x in doc["itens"] if x.get("origem") == "diario"]
    chk(sh and not re.search(r"^\s*/", sh[0]["texto"], re.M), "entrada do diário compartilhada, sem as linhas de comando")
    # apagar a própria entrada
    await pg.evaluate("location.hash='dupla'"); await pg.wait_for_timeout(300)
    n_before = len((await pg.evaluate(f"window.__store['dupla/u_test/diario/{mk}']"))["itens"])
    await pg.locator(".duoent.mine [data-duodel]").first.click(); await pg.wait_for_timeout(400)
    chk(len((await pg.evaluate(f"window.__store['dupla/u_test/diario/{mk}']"))["itens"]) == n_before - 1, "apagar a própria entrada")
    store = await pg.evaluate("JSON.stringify(window.__store)")
    mine = [k for k in json.loads(store) if k not in seed]
    chk(mine and all(k.startswith("data/users/u_test/") or k == "dupla/u_test" or k.startswith("dupla/u_test/") for k in mine), f"a página só escreveu no seu espaço privado e no seu ramo do espaço a dois ({len(mine)} documentos)")
    chk(all(json.loads(store)[k] == v for k, v in seed.items() if k != "dupla/u_partner"), "documentos da outra pessoa intactos")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()
    # a outra pessoa abre com o mesmo banco: vê o acerto espelhado
    st = {k: v for k, v in json.loads(store).items() if k.startswith("dupla/")}
    b2, pg2, errs2 = await open_page(p, w=1440, cfg={"seedStore": json.dumps(st), "uid": "u_partner"}, hash_="dupla.orcamento")
    await pg2.wait_for_timeout(600)
    bal2 = await pg2.evaluate(f"duoBalance('{mk}')")
    chk(abs(bal2["bal"] + exp) < 1e-9, f"na tela da outra pessoa o saldo é o mesmo, com sinal trocado ({bal2['bal']})")
    t3 = await pg2.locator("#main").inner_text()
    chk(f"Você deve {e35} para" in t3, "e a frase diz que ela deve")
    chk(await pg2.evaluate("duoJoined()") and await pg2.locator("[data-act=duojoin]").count() == 0, "ela já está no espaço (o perfil dela estava no banco)")
    chk(not errs2, f"sem erros no console da outra pessoa ({errs2[:2]})")
    await b2.close()
    # a plataforma diz que é só leitura: o app avisa antes, sem botão de entrar nem formulários
    b4, pg4, errs4 = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed), "canWrite": False}, hash_="dupla")
    await pg4.wait_for_timeout(500)
    t4 = await pg4.locator(".duohead").inner_text()
    chk("só de leitura" in t4 and "Editor(a) por convite de e-mail" in t4 and await pg4.locator("[data-act=duojoin], #duo_txt").count() == 0, "acesso só de leitura: aviso com o que pedir, sem botão de entrar")
    chk(await pg4.locator(".duoent").count() == 1, "quem só lê ainda vê o que está no espaço")
    await b4.close()
    # sem permissão de escrita (Leitor)
    b3, pg3, errs3 = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed), "denyWrite": "dupla/u_test"}, hash_="dupla")
    await pg3.wait_for_timeout(500)
    await pg3.click("[data-act=duojoin]"); await pg3.wait_for_timeout(300)
    tt = await toast_text(pg3)
    chk("Colaborador" in tt and not await pg3.evaluate("duoJoined()"), f"sem permissão: aviso para pedir acesso de Colaborador(a) (“{tt}”)")
    await b3.close()

# ---------------------------------------------------------------- agenda .ics
def nth_weekday(y, m, wd, n):
    import calendar
    days = [d for d in range(1, calendar.monthrange(y, m)[1] + 1) if D(y, m, d).weekday() == wd]
    return D(y, m, days[n - 1] if n > 0 else days[n])
async def ics(p):
    b, pg, errs = await open_page(p, w=1440, hash_="integ")
    T = await pg.evaluate("TODAY"); t = dd(T)
    hz = t + datetime.timedelta(days=120)
    def dts(d, h="090000"): return d.strftime("%Y%m%d") + "T" + h
    wed = t - datetime.timedelta(days=31); wed -= datetime.timedelta(days=(wed.weekday() - 2) % 7)
    tue = t - datetime.timedelta(days=7); tue -= datetime.timedelta(days=(tue.weekday() - 1) % 7)
    m3 = (t.replace(day=1) - datetime.timedelta(days=80)).replace(day=1)
    lastm = (t.replace(day=1) - datetime.timedelta(days=1))
    serie0 = t - datetime.timedelta(days=14)
    until_tuth = t + datetime.timedelta(days=40)
    rules = {
        "w2@t": (wed, "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"),
        "tue2@t": (nth_weekday(m3.year, m3.month, 1, 2), "FREQ=MONTHLY;BYDAY=2TU"),
        "lastfri@t": (nth_weekday(lastm.year, lastm.month, 4, -1), "FREQ=MONTHLY;BYDAY=-1FR"),
        "d31@t": (D(2026, 8, 31), "FREQ=MONTHLY"),
        "d3@t": (t - datetime.timedelta(days=10), "FREQ=DAILY;INTERVAL=3;COUNT=20"),
        "tuth@t": (tue, f"FREQ=WEEKLY;BYDAY=TU,TH;UNTIL={dts(until_tuth, '235959')}"),
        "aniv@t": (D(1990, 11, 20), "FREQ=YEARLY"),
        "uteis@t": (t - datetime.timedelta(days=3), "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR"),
        "fimmes@t": (D(2026, 9, 30), "FREQ=MONTHLY;BYMONTHDAY=-1"),
        "serie@t": (serie0, "FREQ=WEEKLY"),
    }
    ex_d = serie0 + datetime.timedelta(days=21); mv_from = serie0 + datetime.timedelta(days=28); mv_to = mv_from + datetime.timedelta(days=1); cx = serie0 + datetime.timedelta(days=35)
    V = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Google Inc//Google Calendar 70.9054//EN"]
    for u, (d0, r) in rules.items():
        V += ["BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(d0)}", f"DTEND;TZID=Europe/Rome:{dts(d0, '100000')}", f"RRULE:{r}", f"UID:{u}", f"SUMMARY:Série {u}"]
        if u == "serie@t": V += [f"EXDATE;TZID=Europe/Rome:{dts(ex_d)}"]
        V += ["END:VEVENT"]
    V += ["BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(mv_to, '150000')}", f"DTEND;TZID=Europe/Rome:{dts(mv_to, '160000')}", f"RECURRENCE-ID;TZID=Europe/Rome:{dts(mv_from)}", "UID:serie@t", "SUMMARY:Remarcada", "END:VEVENT"]
    V += ["BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(cx)}", f"RECURRENCE-ID;TZID=Europe/Rome:{dts(cx)}", "UID:serie@t", "STATUS:CANCELLED", "SUMMARY:Série serie@t", "END:VEVENT"]
    V += ["BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(t, '180000')}", f"DTEND;TZID=Europe/Rome:{dts(t, '190000')}", "UID:dent@t", "SUMMARY:Dentista", "LOCATION:Via Roma 10\\, Milano", "END:VEVENT"]
    V += ["BEGIN:VEVENT", f"DTSTART;VALUE=DATE:{(t + datetime.timedelta(days=6)).strftime('%Y%m%d')}", f"DTEND;VALUE=DATE:{(t + datetime.timedelta(days=7)).strftime('%Y%m%d')}", "UID:allday@t", "SUMMARY:Reunião com a equipe\\, revisão do", "  projeto anual", "END:VEVENT"]
    V += ["BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(t + datetime.timedelta(days=2))}", "UID:cancel@t", "STATUS:CANCELLED", "SUMMARY:Cancelado", "END:VEVENT"]
    V += ["END:VCALENDAR"]
    text = "\r\n".join(V) + "\r\n"
    evs = await pg.evaluate("(t) => icsParse(t)", text)
    by = {}
    for e in evs: by.setdefault(e["uid"].split("#")[0], []).append(e)
    for u, (d0, r) in rules.items():
        rr = rrulestr(r.replace(f"UNTIL={dts(until_tuth, '235959')}", f"UNTIL={dts(until_tuth, '235959')}"), dtstart=datetime.datetime.combine(d0, datetime.time(9)))
        want = [x.date().isoformat() for x in rr.between(datetime.datetime.combine(t, datetime.time(0)), datetime.datetime.combine(hz, datetime.time(23, 59)), inc=True)]
        if u == "serie@t": want = [x for x in want if x not in (ex_d.isoformat(), mv_from.isoformat(), cx.isoformat())]
        got = sorted(e["data"] for e in by.get(u, []) if e["titulo"] != "Remarcada")
        chk(got == want, f"recorrência {r} igual à referência dateutil ({len(got)} ocorrências{'' if got == want else f'; app {got[:6]} × ref {want[:6]}'})")
    mv = [e for e in by.get("serie@t", []) if e["titulo"] == "Remarcada"]
    chk(len(mv) == 1 and mv[0]["data"] == mv_to.isoformat() and mv[0]["hora"] == "15:00", "ocorrência remarcada aparece só na data nova, 15:00")
    s1 = by.get("dent@t", [{}])[0]
    chk(s1.get("hora") == "18:00" and s1.get("fim") == "19:00" and s1.get("local") == "Via Roma 10, Milano", "evento simples: horário e local com vírgula escapada")
    a1 = by.get("allday@t", [{}])[0]
    chk(a1.get("titulo") == "Reunião com a equipe, revisão do projeto anual" and a1.get("hora") == "", f"linha dobrada e dia inteiro ({a1.get('titulo')})")
    chk("cancel@t" not in by, "evento cancelado fica fora")
    # importar pelo painel: .zip com dois .ics (como o Google exporta)
    other = "\r\n".join(["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", f"DTSTART;TZID=Europe/Rome:{dts(t + datetime.timedelta(days=3), '200000')}", "UID:cine@t", "SUMMARY:Cinema", "END:VEVENT", "END:VCALENDAR"]) + "\r\n"
    zb = io.BytesIO()
    with zipfile.ZipFile(zb, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("Agenda/pessoal@gmail.com.ics", text); z.writestr("Agenda/Feriados.ics", other)
    zp = OUT / "agenda-teste.zip"; zp.write_bytes(zb.getvalue())
    n0 = await pg.evaluate("(S.eventos || []).length")
    await pg.set_input_files("#ix_ics", str(zp)); await pg.wait_for_timeout(800)
    chk(await pg.locator("#dlg[open] #iok").count() == 1, "prévia da agenda abre")
    await pg.click("#iok"); await pg.wait_for_timeout(300)
    n1 = await pg.evaluate("S.eventos.length")
    chk(n1 == n0 + len(evs) + 1, f"importa todos os compromissos dos dois arquivos ({n0} + {len(evs)} + 1 = {n1})")
    await pg.set_input_files("#ix_ics", str(zp)); await pg.wait_for_timeout(800); await pg.click("#iok"); await pg.wait_for_timeout(300)
    chk(await pg.evaluate("S.eventos.length") == n1, "importar de novo não duplica")
    await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(400)
    chk("Dentista" in await pg.locator("#main").inner_text(), "compromisso de hoje aparece em Hoje")
    # exportar
    await pg.evaluate("location.hash='integ'"); await pg.wait_for_timeout(300)
    await pg.click("[data-act=ixicsout]"); await pg.wait_for_timeout(400)
    sv = await pg.evaluate("window.__saved.at(-1)")
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(sv["b64"])))
    raw = z.read("atlas-agenda.ics")
    phys = raw.split(b"\r\n")
    chk(z.testzip() is None and raw.endswith(b"\r\n") and b"\n" not in raw.replace(b"\r\n", b""), "exportação: .zip válido, linhas em CRLF")
    chk(max(len(l) for l in phys) <= 75, f"nenhuma linha passa de 75 bytes (maior: {max(len(l) for l in phys)})")
    un = raw.decode().replace("\r\n ", "").split("\r\n")
    nv = un.count("BEGIN:VEVENT")
    chk(nv > 5 and all(l.startswith(("DTSTART;VALUE=DATE:", "DTEND;VALUE=DATE:", "UID:atlas-", "DTSTAMP:", "SUMMARY:", "DESCRIPTION:", "RRULE:", "BEGIN:", "END:", "VERSION:", "PRODID:", "CALSCALE:", "X-WR-CALNAME:")) for l in un if l), f"{nv} eventos bem formados")
    chk("RRULE:FREQ=YEARLY" in un and any(l.startswith("SUMMARY:Aniversário de") for l in un), "aniversários saem como eventos anuais")
    blocks = raw.decode().replace("\r\n ", "").split("BEGIN:VEVENT")[1:]
    exp_ids = set()
    for blk in blocks:
        u = re.search(r"UID:(\S+)", blk).group(1); d0 = re.search(r"DTSTART;VALUE=DATE:(\d{8})", blk).group(1); d0 = f"{d0[:4]}-{d0[4:6]}-{d0[6:]}"
        if "RRULE:FREQ=YEARLY" in blk:
            nxt = dd(d0)
            while nxt < t: nxt = nxt.replace(year=nxt.year + 1)
            if nxt <= t + datetime.timedelta(days=120): exp_ids.add(u)
        elif d0 <= (t + datetime.timedelta(days=365)).isoformat(): exp_ids.add(u)
    back = set(x.split("#")[0] for x in await pg.evaluate("(t) => icsParse(t).map(e => e.uid)", raw.decode()))
    chk(back == exp_ids, f"o arquivo exportado é lido de volta: {len(back)} de {len(exp_ids)} esperados na janela ({len(blocks)} no arquivo)")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- saúde: Apple Health e Google Fit
async def health(p):
    b, pg, errs = await open_page(p, w=1440, hash_="integ")
    T = await pg.evaluate("TODAY"); t = dd(T)
    d0, d1, d2, d3 = [(t - datetime.timedelta(days=k)).isoformat() for k in (3, 2, 1, 4)]
    old = (t - datetime.timedelta(days=800)).isoformat()
    tz = " +0200"
    def rec(ty, src, s, e, v, unit="count"): return f' <Record type="{ty}" sourceName="{src}" sourceVersion="17.0" device="&lt;&lt;HKDevice: 0x1&gt;, name:{src}&gt;" unit="{unit}" creationDate="{e}{tz}" startDate="{s}{tz}" endDate="{e}{tz}" value="{v}"/>'
    S_ = "HKQuantityTypeIdentifierStepCount"; SL = "HKCategoryTypeIdentifierSleepAnalysis"
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE HealthData [', '<!ELEMENT HealthData (ExportDate,Me,(Record|Workout)*)>', ']>', '<HealthData locale="pt_BR">', f' <ExportDate value="{T} 10:00:00{tz}"/>', ' <Me HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexNotSet"/>',
        rec(S_, "iPhone", f"{d1} 08:00:00", f"{d1} 08:10:00", 3000), rec(S_, "iPhone", f"{d1} 12:00:00", f"{d1} 12:10:00", 2000), rec(S_, "Apple Watch", f"{d1} 09:00:00", f"{d1} 09:30:00", 6000),
        rec(SL, "Apple Watch", f"{d0} 23:30:00", f"{d1} 03:00:00", "HKCategoryValueSleepAnalysisAsleepCore", ""), rec(SL, "Apple Watch", f"{d1} 03:00:00", f"{d1} 04:15:00", "HKCategoryValueSleepAnalysisAsleepDeep", ""),
        rec(SL, "Apple Watch", f"{d1} 04:15:00", f"{d1} 06:45:00", "HKCategoryValueSleepAnalysisAsleepREM", ""), rec(SL, "Apple Watch", f"{d1} 06:45:00", f"{d1} 07:00:00", "HKCategoryValueSleepAnalysisAwake", ""),
        rec(SL, "iPhone", f"{d0} 23:00:00", f"{d1} 07:00:00", "HKCategoryValueSleepAnalysisInBed", ""),
        rec("HKQuantityTypeIdentifierBodyMass", "Balança", f"{d1} 07:30:00", f"{d1} 07:30:00", "176.37", "lb"),
        rec(S_, "Apple Watch", f"{d2} 09:00:00", f"{d2} 10:00:00", 4000), rec(S_, "Apple Watch", f"{d2} 17:00:00", f"{d2} 18:00:00", 3500), rec(S_, "iPhone", f"{d2} 09:00:00", f"{d2} 18:00:00", 7000),
        rec(SL, "Apple Watch", f"{d1} 23:00:00", f"{d2} 06:00:00", "HKCategoryValueSleepAnalysisAsleepUnspecified", ""),
        f' <Workout workoutActivityType="HKWorkoutActivityTypeRunning" duration="32.2" durationUnit="min" sourceName="Apple Watch" sourceVersion="10.0" creationDate="{d2} 18:33:00{tz}" startDate="{d2} 18:00:00{tz}" endDate="{d2} 18:32:12{tz}">',
        '  <WorkoutStatistics type="HKQuantityTypeIdentifierDistanceWalkingRunning" sum="5.1" unit="km"/>', ' </Workout>',
        f' <Workout workoutActivityType="HKWorkoutActivityTypeWalking" duration="5" durationUnit="min" sourceName="Apple Watch" startDate="{d1} 19:00:00{tz}" endDate="{d1} 19:05:00{tz}"/>',
        rec(S_, "iPhone", f"{old} 09:00:00", f"{old} 10:00:00", 9999), '</HealthData>']
    # muitos registros extras para o leitor em fluxo atravessar vários pedaços
    filler = [rec("HKQuantityTypeIdentifierHeartRate", "Apple Watch", f"{d3} 10:{i % 60:02d}:00", f"{d3} 10:{i % 60:02d}:00", 70 + i % 20, "count/min") for i in range(30000)]
    xml = xml[:7] + filler + xml[7:]
    zb = io.BytesIO()
    with zipfile.ZipFile(zb, "w", zipfile.ZIP_DEFLATED) as z:
        with z.open("apple_health_export/export.xml", "w", force_zip64=True) as f: f.write("\n".join(xml).encode())
        z.writestr("apple_health_export/export_cda.xml", "<ClinicalDocument/>")
    zp = OUT / "export.zip"; zp.write_bytes(zb.getvalue())
    await pg.evaluate("([a, b]) => { S.saude[a] = { sono: 6.5, humor: 4 }; delete S.saude[b]; VER++; }", [d1, d2])
    await pg.set_input_files("#ix_ah", str(zp)); await pg.wait_for_timeout(4000)
    chk(await pg.locator("#dlg[open] #hok").count() == 1, f"Apple Health (.zip com ZIP64, {len(zb.getvalue()) // 1024} KB) lido; prévia aberta")
    H = await pg.evaluate("IX.health")
    chk(H["days"].get(d1, {}).get("passos") == 6000 and H["days"].get(d2, {}).get("passos") == 7500, f"passos: fonte com maior total no dia (6000; 7500) ({H['days'].get(d1, {}).get('passos')}; {H['days'].get(d2, {}).get('passos')})")
    chk(H["days"].get(d1, {}).get("sono") == 7.25 and H["days"].get(d2, {}).get("sono") == 7.0, f"sono: só fases dormindo, sem 'na cama' e 'acordado' (7,25 h; 7 h) ({H['days'].get(d1, {}).get('sono')})")
    chk(H["days"].get(d1, {}).get("peso") == 80.0, "peso em libras convertido: 176,37 lb = 80,0 kg")
    chk(H["days"].get(d2, {}).get("treino") == "Corrida" and H["days"].get(d2, {}).get("min") == 32 and "treino" not in H["days"].get(d1, {}), "treino de 32 min vira Corrida; caminhada de 5 min fica fora")
    chk(old not in H["days"], "registros com mais de 2 anos ficam fora")
    await pg.click("#hok"); await pg.wait_for_timeout(300)
    s1 = await pg.evaluate(f"S.saude['{d1}']"); s2 = await pg.evaluate(f"S.saude['{d2}']")
    chk(s1["sono"] == 6.5 and s1["passos"] == 6000 and s1["humor"] == 4 and s2["sono"] == 7.0 and s2["treino"] == "Corrida", "modo padrão preenche só o vazio (sono digitado 6,5 h mantido)")
    await pg.set_input_files("#ix_ah", str(zp)); await pg.wait_for_timeout(4000)
    await pg.check("input[name=hmode][value=over]"); await pg.click("#hok"); await pg.wait_for_timeout(300)
    chk(await pg.evaluate(f"S.saude['{d1}'].sono") == 7.25, "modo substituir troca pelo valor do relógio")
    # export.xml solto
    xp = OUT / "export.xml"; xp.write_text("\n".join(xml))
    await pg.set_input_files("#ix_ah", str(xp)); await pg.wait_for_timeout(4000)
    chk((await pg.evaluate(f"IX.health.days['{d1}']?.passos")) == 6000, "export.xml sem compactar também funciona")
    await pg.keyboard.press("Escape")
    # Google Fit
    head = "Date,Move Minutes count,Calories (kcal),Distance (m),Heart Points,Heart Minutes,Average heart rate (bpm),Max heart rate (bpm),Min heart rate (bpm),Average speed (m/s),Max speed (m/s),Min speed (m/s),Step count,Average weight (kg),Max weight (kg),Min weight (kg),Running duration (ms),Walking duration (ms),Inactive duration (ms)"
    row = f"{d3},45,2100.5,6000.2,30,25,80,150,55,1.2,3.4,0.5,8421,79.6,79.8,79.4,1920000,600000,40000000"
    fp = OUT / "Daily activity metrics.csv"; fp.write_text(head + "\n" + row + "\n")
    await pg.evaluate(f"delete S.saude['{d3}']; VER++")
    await pg.set_input_files("#ix_fit", str(fp)); await pg.wait_for_timeout(800)
    H2 = await pg.evaluate("IX.health")
    chk(H2["fonte"] == "Google Fit" and H2["days"].get(d3) == {"passos": 8421, "peso": 79.6, "treino": "Corrida", "min": 32}, f"Google Fit: passos, peso e corrida de 32 min ({H2['days'].get(d3)})")
    await pg.click("#hok"); await pg.wait_for_timeout(300)
    chk(await pg.evaluate(f"S.saude['{d3}'].passos") == 8421, "Google Fit importado")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- Notion: tarefas nos dois sentidos
async def notion(p):
    b, pg, errs = await open_page(p, w=1440, hash_="integ")
    await pg.wait_for_timeout(300)
    await pg.evaluate("S.tarefas.push({ id: 'tesc', tarefa: 'Revisar *capítulo* [2] <final>', status: 'A fazer', prio: 'Média', prazo: addDays(TODAY, 5), area: 'Aprendizado' }); VER++")
    opn = await pg.evaluate("calcAt(mkey(TODAY)).tar.filter(t => t.open).map(t => t.id)")
    await pg.click("[data-act=ixnotion]"); await pg.wait_for_timeout(600)
    page = await pg.evaluate("window.__ntPage")
    c = await pg.evaluate("window.__calls.filter(c => c.kind === 'mcp' && c.tool === 'notion-create-pages').at(-1).input")
    chk(c.get("creation_mode") == "draft" and "parent" not in c and c["pages"][0]["properties"]["title"] == "Tarefas do Atlas", "página criada como rascunho privado (sem página-mãe)")
    ids = re.findall(r"`atlas:([a-z0-9]+)`", page)
    chk(sorted(ids) == sorted(opn) and len(ids) > 2, f"página com as {len(opn)} tarefas abertas, cada uma com o seu código")
    chk(await pg.evaluate("S.integ.notion.tarefas.id") == "new1", "Atlas guarda o id da página")
    chk("- [ ] Revisar \\*capítulo\\* \\[2\\] \\<final\\>" in page, "caracteres especiais escapados como o Notion pede (\\* \\[ \\<)")
    # edições no Notion
    lines = page.split("\n")
    i0 = next(i for i, l in enumerate(lines) if f"atlas:{ids[0]}" in l); lines[i0] = lines[i0].replace("- [ ]", "- [x]", 1)
    lines.append("- [ ] Comprar presente da Chiara")
    lines.append("- [ ] Ler 2\\* livros \\[urgente\\]")
    await pg.evaluate("(t) => { window.__ntPage = t; }", "\n".join(lines))
    # edições no Atlas
    await pg.evaluate(f"(() => {{ const t = S.tarefas.find(x => x.id === '{ids[1]}'); t.status = 'Concluída'; t.concluida = TODAY; S.tarefas.push({{ id: 'tnova', tarefa: 'Renovar o seguro do carro', status: 'A fazer', prio: 'Média', prazo: addDays(TODAY, 9), area: 'Finanças' }}); VER++; render(); }})()")
    await pg.click("[data-act=ixnotion]"); await pg.wait_for_timeout(800)
    t0 = await pg.evaluate(f"S.tarefas.find(x => x.id === '{ids[0]}')")
    chk(t0["status"] == "Concluída", "marcada no Notion → concluída no Atlas")
    nova = await pg.evaluate("S.tarefas.find(t => t.tarefa === 'Comprar presente da Chiara')")
    chk(nova and nova.get("origem") == "notion", "escrita no Notion → tarefa nova no Atlas")
    chk(await pg.evaluate("S.tarefas.some(t => t.tarefa === 'Ler 2* livros [urgente]')"), "texto escapado no Notion volta limpo para o Atlas")
    pg2 = await pg.evaluate("window.__ntPage")
    ln = [l for l in pg2.split("\n") if f"atlas:{ids[1]}" in l]
    chk(len(ln) == 1 and ln[0].startswith("- [x]"), "concluída no Atlas → marcada no Notion")
    chk(nova and f"Comprar presente da Chiara `atlas:{nova['id']}`" in pg2, "a linha nova no Notion ganha o código do Atlas (não duplica na próxima vez)")
    chk("Renovar o seguro do carro" in pg2, "tarefa nova do Atlas entra no fim da página")
    ups = await pg.evaluate("window.__calls.filter(c => c.kind === 'mcp' && c.tool === 'notion-update-page').map(c => c.input)")
    chk(all(u["page_id"] == "new1" and u["allow_async"] is False for u in ups) and any(u["command"] == "update_content" and 1 <= len(u["content_updates"]) <= 100 for u in ups) and any(u["command"] == "insert_content" and u["position"] == {"type": "end"} for u in ups), "chamadas ao Notion no formato da ferramenta (update_content / insert_content no fim)")
    n_t = await pg.evaluate("S.tarefas.length")
    await pg.click("[data-act=ixnotion]"); await pg.wait_for_timeout(800)
    chk(await pg.evaluate("S.tarefas.length") == n_t and (await pg.evaluate("window.__ntPage")).count("Comprar presente da Chiara") == 1, "terceira sincronização sem mudanças não duplica nada")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- extrato que aprende
async def bank(p):
    b, pg, errs = await open_page(p, w=1440, hash_="integ")
    await pg.wait_for_timeout(300)
    csv1 = "Data;Descrição;Valor\n01/10/2026;COMPRA CARTAO TABACCHERIA ROSSI 1234 MILANO;-45,30\n02/10/2026;PAGAMENTO POS TABACCHERIA ROSSI 5678;-12,10\n03/10/2026;COMPRA CARTAO ESSELUNGA 99;-30,00\n"
    f1 = OUT / "extrato1.csv"; f1.write_text(csv1)
    await pg.set_input_files("#imp_bank2", str(f1)); await pg.wait_for_timeout(600)
    keys = await pg.locator("#dlg select[data-impcat]").evaluate_all("els => els.map(e => e.dataset.impcat)")
    chk(keys[:2] == ["Despesa|tabaccheria rossi"] * 2 and keys[2] == "Despesa|esselunga", f"mesmo estabelecimento, mesma chave, apesar do ruído do banco ({keys})")
    cats = await pg.locator("#dlg select[data-impcat]").evaluate_all("els => els.map(e => e.value)")
    chk(cats[2] == "Mercado", "regra existente (esselunga → Mercado) aplicada")
    await pg.locator("#dlg select[data-impcat]").first.select_option("Cuidados pessoais"); await pg.wait_for_timeout(300)
    cats = await pg.locator("#dlg select[data-impcat]").evaluate_all("els => els.map(e => e.value)")
    chk(cats[:2] == ["Cuidados pessoais"] * 2, "corrigir uma linha corrige as outras do mesmo lugar")
    await pg.click("#impok"); await pg.wait_for_timeout(400)
    rg = await pg.evaluate("S.regras.filter(r => r.auto).map(r => [r.termo, r.cat])")
    chk(["tabaccheria rossi", "Cuidados pessoais"] in rg, f"correção vira regra ({rg})")
    csv2 = "Data;Descrição;Valor\n05/10/2026;PAGAMENTO POS TABACCHERIA ROSSI 4321;-8,00\n"
    f2 = OUT / "extrato2.csv"; f2.write_text(csv2)
    await pg.set_input_files("#imp_bank2", str(f2)); await pg.wait_for_timeout(600)
    c2 = await pg.locator("#dlg select[data-impcat]").evaluate_all("els => els.map(e => e.value)")
    chk(c2 == ["Cuidados pessoais"], "próximo extrato já vem com a categoria aprendida")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

# ---------------------------------------------------------------- Samsung Health (exportação de dados pessoais)
async def samsung(p):
    b, pg, errs = await open_page(p, w=1440, hash_="integ")
    T = await pg.evaluate("TODAY"); t = dd(T)
    d1, d2 = (t - datetime.timedelta(days=2)).isoformat(), (t - datetime.timedelta(days=1)).isoformat()
    def ep(d): return str(int(datetime.datetime.fromisoformat(d).replace(tzinfo=datetime.timezone.utc).timestamp() * 1000))
    pre = "com.samsung.health.step_daily_trend"
    files = {
      "Samsung Health/com.samsung.shealth.step_daily_trend.20261004.csv": f"com.samsung.shealth.step_daily_trend,6313004,4\n{pre}.day_time,{pre}.count,{pre}.source_type,{pre}.distance\n{ep(d1)},8000,-2,6000\n{ep(d1)},5000,0,4000\n{ep(d1)},7600,1,5000\n{ep(d2)},4200,-2,3000\n",
      "Samsung Health/com.samsung.shealth.sleep.20261004.csv": "com.samsung.shealth.sleep,6313004,3\nstart_time,end_time,time_offset,com.samsung.health.sleep.deviceuuid\n" +
         f"{d1[:8]}{int(d1[8:])-1:02d} 21:30:00.000,{d1} 04:30:00.000,UTC+0200,relogio\n{d1[:8]}{int(d1[8:])-1:02d} 22:00:00.000,{d1} 05:15:00.000,UTC+0200,celular\n",
      "Samsung Health/com.samsung.health.weight.20261004.csv": f"com.samsung.health.weight,6313004,3\ncom.samsung.health.weight.start_time,com.samsung.health.weight.weight,com.samsung.health.weight.time_offset\n{d2} 05:10:00.000,79.4,UTC+0200\n",
      "Samsung Health/com.samsung.shealth.exercise.20261004.csv": f"com.samsung.shealth.exercise,6313004,5\ncom.samsung.health.exercise.start_time,com.samsung.health.exercise.exercise_type,com.samsung.health.exercise.duration,com.samsung.health.exercise.time_offset\n{d2} 16:00:00.000,1002,2460000,UTC+0200\n{d2} 07:00:00.000,1001,300000,UTC+0200\n",
      "Samsung Health/com.samsung.shealth.sleep_stage.20261004.csv": "com.samsung.shealth.sleep_stage,6313004,1\nstart_time,end_time,stage\nx,y,40001\n",
    }
    zb = io.BytesIO()
    with zipfile.ZipFile(zb, "w", zipfile.ZIP_DEFLATED) as z:
        for n, c in files.items(): z.writestr(n, c)
    zp = OUT / "samsung.zip"; zp.write_bytes(zb.getvalue())
    await pg.evaluate("([a, b]) => { delete S.saude[a]; delete S.saude[b]; VER++; }", [d1, d2])
    await pg.set_input_files("#ix_sh", str(zp)); await pg.wait_for_timeout(1200)
    chk(await pg.locator("#dlg[open] #hok").count() == 1, "Samsung Health (.zip da pasta exportada): prévia aberta")
    H = await pg.evaluate("IX.health")
    chk(H["fonte"] == "Samsung Health" and H["days"].get(d1, {}).get("passos") == 8000 and H["days"].get(d2, {}).get("passos") == 4200, f"passos: total combinado do dia (fonte -2), sem somar celular e relógio ({H['days'].get(d1, {}).get('passos')})")
    chk(H["days"].get(d1, {}).get("sono") == 7.75, f"sono: noite do relógio e do celular juntada, não somada (23:30–06:45 local = 7,75 h) ({H['days'].get(d1, {}).get('sono')})")
    chk(H["days"].get(d2, {}).get("peso") == 79.4, "peso com colunas prefixadas")
    chk(H["days"].get(d2, {}).get("treino") == "Corrida" and H["days"].get(d2, {}).get("min") == 46, f"exercícios do dia: corrida de 41 min + caminhada de 5 = 46 min, tipo da maior ({H['days'].get(d2)})")
    await pg.click("#hok"); await pg.wait_for_timeout(300)
    chk(await pg.evaluate(f"S.saude['{d1}'].passos") == 8000 and await pg.evaluate(f"S.saude['{d2}'].treino") == "Corrida", "Samsung Health importado")
    csvs = []
    for n, c in list(files.items())[:2]:
        fp = OUT / n.split("/")[-1]; fp.write_text(c); csvs.append(str(fp))
    await pg.set_input_files("#ix_sh", csvs); await pg.wait_for_timeout(800)
    chk((await pg.evaluate(f"IX.health.days['{d1}']?.sono")) == 7.75, "também aceita os .csv soltos (vários de uma vez)")
    await pg.keyboard.press("Escape")
    bad = OUT / "outro.csv"; bad.write_text("a,b\n1,2\n")
    await pg.set_input_files("#ix_sh", str(bad)); await pg.wait_for_timeout(500)
    chk("Não achei passos" in await toast_text(pg), "arquivo que não é do Samsung Health: aviso claro")
    chk(not errs, f"sem erros no console ({errs[:2]})")
    await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("dupla", dupla), ("agenda", ics), ("saude", health), ("samsung", samsung), ("notion", notion), ("extrato", bank)):
            await section(n, f, p)
    print(f"\n{ok}/{ok + bad} passaram")
asyncio.run(main())
