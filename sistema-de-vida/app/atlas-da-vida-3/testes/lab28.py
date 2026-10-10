"""Jornada → Espiritismo → Centros de força: os sete centros de André Luiz com o chakra correspondente; as virtudes da Bússola
cobrem os 17 valores uma vez só; a seção fica agrupada no Espiritismo (sem item novo na barra); o mapa seleciona o centro;
os sinais (sono, qualidade do sono, estresse, humor, contatos, sessões, virtudes do exame) conferem com um cálculo em Python;
autoavaliação semanal (marca, troca, desmarca e desfaz); harmonização guiada que vira sessão do Espiritismo (e aparece em
Práticas, no ritmo do pilar e no histórico); encerrar cedo não registra; reflexão marcada com o centro; prática adotada e
feita hoje pelo próprio centro; o resumo vai para os mentores sem números de saúde; celular."""
import asyncio, datetime as dt
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
def add(s, n): return (dt.date.fromisoformat(s) + dt.timedelta(days=n)).isoformat()
def wstart(s): d = dt.date.fromisoformat(s); return (d - dt.timedelta(days=d.weekday())).isoformat()
def near(a, b, eps=1e-9): return a is not None and b is not None and abs(a - b) <= eps

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="jornada.centros")
        try:
            await pg.wait_for_timeout(900)
            st = await pg.evaluate("""({ cf: CF.map(c => [c.id, c.nome, c.chakra.split(' ')[0], c.val, c.prat]), bm: BM_V.map(v => v.id), cat: J_PIL.esp.cat.map(c => c.t), tec: J_TEC.esp,
              sub: SUBS.jornada.find(s => s[0] === 'centros'), bar: [...document.querySelectorAll('.subtabs a')].map(a => [a.textContent.trim(), a.classList.contains('on') || a.getAttribute('aria-current') === 'page']),
              nav: [...document.querySelectorAll('.jbmnav a')].map(a => [a.textContent.trim(), a.classList.contains('on')]), nodes: document.querySelectorAll('g.cfn').length, hoje: TODAY })""")
            hoje = st["hoje"]
            chk([c[0] for c in st["cf"]] == ["cor", "cer", "lar", "car", "esp", "gas", "gen"] and [c[1] for c in st["cf"]] == ["Coronário", "Cerebral", "Laríngeo", "Cardíaco", "Esplênico", "Gástrico", "Genésico"]
                and [c[2] for c in st["cf"]] == ["Sahasrara", "Ajna", "Vishuddha", "Anahata", "Svadhisthana", "Manipura", "Muladhara"], "os sete centros de André Luiz, de cima para baixo, com o chakra correspondente")
            vals = [v for c in st["cf"] for v in c[3]]
            chk(sorted(vals) == sorted(st["bm"]) and len(vals) == len(set(vals)) == 17, f"as virtudes dos centros cobrem os 17 valores da Bússola, cada um uma vez ({len(vals)})")
            prats = {t for c in st["cf"] for t in c[4]}
            novos = ["Harmonização dos centros de força", "Água fluidificada", "Vigilância da palavra", "Entre a Terra e o Céu (André Luiz, psicografia de Chico Xavier, 1954)", "Evolução em Dois Mundos (André Luiz, psicografia de Chico Xavier e Waldo Vieira, 1958)"]
            chk(prats <= set(st["cat"]) and st["cat"][11:] == novos and st["cat"][0] == "Culto do Evangelho no lar" and st["cat"][10].startswith("Nosso Lar") and "Harmonização dos centros de força" in st["tec"], "as práticas de cada centro existem no catálogo do Espiritismo; cinco itens novos no fim do catálogo e a técnica nova nas sessões")
            chk(st["sub"] == ["centros", "Centros de força", "espiritismo"] and "Centros de força" not in [x[0] for x in st["bar"]] and ["Espiritismo", True] in st["bar"] and st["nav"] == [["O pilar", False], ["Centros de força", True]] and st["nodes"] == 7,
                f"a seção fica dentro do Espiritismo: sem item novo na barra da Jornada, com a navegação O pilar | Centros de força e o mapa com 7 centros ({st['nav']})")

            # mapa e detalhe
            await pg.click('g.cfn[data-cf="lar"]'); await pg.wait_for_timeout(250)
            det = await pg.evaluate("[CFV.sel, document.querySelector('.cfdet h2').textContent, document.querySelector('g.cfn[data-cf=\"lar\"]').getAttribute('aria-pressed')]")
            chk(det == ["lar", "Centro laríngeo", "true"], f"tocar no mapa seleciona o centro e mostra o detalhe ({det})")
            await pg.keyboard.press("Tab")
            await pg.evaluate("document.querySelector('g.cfn[data-cf=\"car\"]').focus()"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("CFV.sel") == "car", "pelo teclado também (Enter no centro em foco)")

            # sinais conferidos em Python
            D = await pg.evaluate("""({ saude: Object.entries(S.saude).filter(([d]) => d >= addDays(TODAY, -13) && d <= TODAY).map(([d, e]) => [d, e.sono ?? null, e.qual ?? null, e.estresse ?? null, e.humor ?? null, !!e.treino]),
              contatos: S.contatos.filter(c => c.data >= addDays(TODAY, -13) && c.data <= TODAY).length, ex: Object.entries(S.bmExames || {}).filter(([d]) => d >= addDays(TODAY, -27) && d <= TODAY).map(([d, e]) => e.n || {}),
              sess: S.jornada.sess.filter(x => x.data >= addDays(TODAY, -13) && x.data <= TODAY).map(x => [x.tec, +x.min || 0]),
              js: { sono: cfSaude('sono'), qual: cfSaude('qual'), est: cfSaude('estresse'), hum: cfSaude('humor'), car: cfValores(['compaixao', 'caridade', 'fraternidade', 'tolerancia']), cor: cfSess(['Prece', 'Culto do Evangelho', CF_TEC]) },
              sin: Object.fromEntries(CF.map(c => [c.id, cfSinais(c.id).map(s => [s.l, s.v])])) })""")
            def media(i):
                v = [r[i] for r in D["saude"] if isinstance(r[i], (int, float))]
                return (sum(v) / len(v), len(v)) if v else None
            js = D["js"]; dif = []
            for k, i in [("sono", 1), ("qual", 2), ("est", 3), ("hum", 4)]:
                m = media(i)
                if not (m and js[k] and near(js[k]["m"], m[0]) and js[k]["n"] == m[1]): dif.append((k, js[k], m))
            por = {}
            for n in D["ex"]:
                for vid, v in n.items():
                    if isinstance(v, (int, float)): por.setdefault(vid, []).append(v)
            ids = ["compaixao", "caridade", "fraternidade", "tolerancia"]; vs = [sum(por[i]) / len(por[i]) / 2 for i in ids if i in por]
            vm = sum(vs) / len(vs) if vs else None
            if not ((vm is None and js["car"]["m"] is None) or near(js["car"]["m"], vm)): dif.append(("virtudes", js["car"]["m"], vm))
            cs = [s for s in D["sess"] if s[0] in ("Prece", "Culto do Evangelho", "Harmonização dos centros de força")]
            if not (js["cor"]["n"] == len(cs) and near(js["cor"]["min"], sum(s[1] for s in cs))): dif.append(("sessões", js["cor"], len(cs)))
            chk(not dif, f"sinais conferidos em Python: sono, qualidade do sono, estresse e humor (14 dias), virtudes do coração (28 noites) e sessões de prece ({dif[:2]})")
            sin = D["sin"]
            chk(dict(sin["car"]).get("Contatos com pessoas") == str(D["contatos"]) and dict(sin["esp"]).get("Dias com treino") == f"{sum(1 for r in D['saude'] if r[5])} de 14" and dict(sin["gen"]).get("O que o Atlas mede aqui") == "nada" and all(any(l == "Virtudes no exame da noite" for l, _ in v) for v in sin.values()),
                "contatos e dias com treino batem; o genésico diz que o Atlas não mede nada ali; todo centro mostra as suas virtudes no exame")

            # autoavaliação semanal
            w = wstart(hoje)
            await pg.click('[data-cfav="gas|4"]'); await pg.wait_for_timeout(200)
            a1 = await pg.evaluate(f"S.jornada.cf.av['{w}']?.gas")
            await pg.click('[data-cfav="gas|2"]'); await pg.wait_for_timeout(200)
            a2 = await pg.evaluate(f"S.jornada.cf.av['{w}']?.gas")
            await pg.click('[data-cfav="gas|2"]'); await pg.wait_for_timeout(200)
            a3 = await pg.evaluate(f"S.jornada.cf.av['{w}']?.gas ?? null")
            await pg.evaluate("undo()"); await pg.wait_for_timeout(200)
            a4 = await pg.evaluate(f"S.jornada.cf.av['{w}']?.gas")
            fill = await pg.evaluate("document.querySelector('g.cfn[data-cf=\"gas\"] .cfd').style.fill")
            chk([a1, a2, a3, a4] == [4, 2, None, 2] and "color-mix" in fill, f"autoavaliação: marca, troca, desmarca tocando de novo e o desfazer volta; o mapa pinta o centro ({[a1, a2, a3, a4]})")

            # harmonização guiada (o tempo é adiantado pelo teste)
            s0 = await pg.evaluate("S.jornada.sess.length")
            await pg.select_option("#cfh_dur", "30"); await pg.click('[data-act="cfhini"]'); await pg.wait_for_timeout(300)
            passos = []
            for _ in range(9):
                passos.append(await pg.evaluate("[CFH.i, CFV.sel, document.querySelector('.cfhtop b')?.textContent || '']"))
                await pg.evaluate("CFH.t0 -= 46000"); await pg.wait_for_timeout(450)
            fim = await pg.evaluate("[CFH.fim, !!document.querySelector('.cfharm.fim')]")
            chk([x[0] for x in passos] == list(range(9)) and [x[2] for x in passos][1:8] == ["Centro coronário", "Centro cerebral", "Centro laríngeo", "Centro cardíaco", "Centro esplênico", "Centro gástrico", "Centro genésico"] and [x[1] for x in passos][1:8] == ["cor", "cer", "lar", "car", "esp", "gas", "gen"] and fim == [True, True],
                f"a harmonização passa pela abertura, pelos sete centros de cima para baixo (o mapa acompanha) e pelo encerramento ({[x[2] for x in passos]})")
            await pg.select_option("#cfh_antes", "2"); await pg.select_option("#cfh_depois", "4"); await pg.fill("#cfh_nota", "Orei pela minha avó (teste)")
            await pg.click('[data-act="cfhsave"]'); await pg.wait_for_timeout(300)
            S1 = await pg.evaluate("(() => { const x = S.jornada.sess.at(-1); return { n: S.jornada.sess.length, x, ativ: jActDays('esp').has(TODAY), hist: document.querySelectorAll('.cfhist > div').length, on: CFH.on }; })()")
            x = S1["x"]
            chk(S1["n"] == s0 + 1 and x["pid"] == "esp" and x["tec"] == "Harmonização dos centros de força" and x["data"] == hoje and x["min"] >= 5 and x["antes"] == 2 and x["depois"] == 4 and x["notas"] == "Orei pela minha avó (teste)" and S1["ativ"] and S1["hist"] >= 1 and not S1["on"],
                f"no fim, a sessão entra no Espiritismo com minutos, antes → depois e a nota; conta no ritmo do pilar e no histórico ({x['min']} min)")
            await pg.evaluate("location.hash = 'jornada.praticas'"); await pg.wait_for_timeout(400)
            chk("Harmonização dos centros de força" in await pg.inner_text("body"), "a sessão aparece em Práticas")
            await pg.evaluate("location.hash = 'jornada.centros'"); await pg.wait_for_timeout(400)
            s2 = await pg.evaluate("S.jornada.sess.length")
            await pg.click('[data-act="cfhini"]'); await pg.wait_for_timeout(300); await pg.click('[data-act="cfhstop"]'); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("[S.jornada.sess.length, CFH.on, !!document.querySelector('.cfharm')]") == [s2, False, False], "encerrar antes de 1 minuto não registra nada")
            await pg.click('[data-act="cfhini"]'); await pg.wait_for_timeout(200)
            await pg.evaluate("location.hash = 'jornada.inicio'"); await pg.wait_for_timeout(700)
            chk(await pg.evaluate("[CFH.on, CFH.h]") == [False, None], "sair da página encerra a harmonização em andamento (o relógio para)")
            await pg.evaluate("location.hash = 'jornada.centros'"); await pg.wait_for_timeout(400)

            # reflexão e prática pelo centro
            await pg.click('g.cfn[data-cf="lar"]'); await pg.wait_for_timeout(200)
            await pg.fill("#cf_refl", "Falei com aspereza na reunião; amanhã peço desculpas. (teste)"); await pg.click('[data-act="cfrsave"]'); await pg.wait_for_timeout(250)
            r = await pg.evaluate("(() => { const r = jP('esp').refl.at(-1); return [r.cf, r.texto, r.data, r.priv]; })()")
            await pg.click('.cfpr [data-act="jadopt"]'); await pg.wait_for_timeout(250)
            pr = await pg.evaluate("(() => { const x = jP('esp').prat.find(p => p.titulo === 'Vigilância da palavra'); return x && [x.status, x.fonte]; })()")
            await pg.click('.cfpr [data-act="jmark"]'); await pg.wait_for_timeout(250)
            sl = await pg.evaluate("Object.fromEntries(cfSinais('lar').map(s => [s.l, s.v]))")
            chk(r == ["lar", "Falei com aspereza na reunião; amanhã peço desculpas. (teste)", hoje, False] and pr == ["ativa", "base"] and sl.get("Vigilância da palavra") == "1×",
                f"reflexão marcada com o centro vai para o Espiritismo; a prática do centro é adotada e feita hoje ali mesmo ({sl})")
            await pg.evaluate("location.hash = 'jornada.espiritismo'"); await pg.wait_for_timeout(450)
            pil = await pg.evaluate("[document.querySelectorAll('.cfmini .cfm').length, [...document.querySelectorAll('.jrf .jtag')].some(t => /centro laríngeo/.test(t.textContent)), !!document.querySelector('.jbmnav a.on')]")
            await pg.click('a.cfm[data-cf="gen"]'); await pg.wait_for_timeout(450)
            chk(pil == [7, True, True] and await pg.evaluate("[SUB, CFV.sel]") == ["centros", "gen"], f"na página do pilar: o resumo dos sete centros, a etiqueta do centro na reflexão e o atalho que abre o centro tocado ({pil})")

            # mentores
            P = await pg.evaluate("[jPrompt('esp', false), jPrompt('med', false)]")
            fx = await pg.evaluate("cfFacts().join(' ')")
            chk("Centros de força (autoavaliação semanal" in P[0] and "Harmonizações guiadas nas últimas 4 semanas: 1" in P[0] and "Centros de força (autoavaliação semanal" in P[1] and not any(k in fx for k in ("Sono", "sono", "kcal", "Humor", "Passos", "contatos")),
                "O Benfeitor (e os outros mentores, no resumo do pilar) recebem a autoavaliação e as harmonizações, sem números de saúde")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()

        # celular
        b, pg, errs = await open_page(p, w=390, h=844, hash_="jornada.centros")
        try:
            await pg.wait_for_timeout(900)
            o1 = await overflow(pg)
            await pg.click('[data-act="cfhini"]'); await pg.wait_for_timeout(400)
            vis_ = await pg.evaluate("(() => { const r = document.querySelector('.cfharm').getBoundingClientRect(); return r.width <= innerWidth && r.left >= 0; })()")
            await pg.click('[data-act="cfhstop"]'); await pg.wait_for_timeout(200)
            await pg.evaluate("location.hash = 'jornada.espiritismo'"); await pg.wait_for_timeout(500)
            o2 = await overflow(pg)
            chk(o1[0] <= o1[1] and o2[0] <= o2[1] and vis_, f"celular: centros e pilar sem rolagem lateral; a harmonização cabe na tela ({o1}, {o2})")
            chk(not errs, f"sem erros no celular ({errs[:2]})")
        finally:
            await b.close()
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
