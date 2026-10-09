"""Cruzamentos: o menu leva a aba para o Laboratório, ao lado de Experimentos; uma métrica nunca é cruzada com uma parte dela
(famílias); a força de cada correlação (dias efetivos pela autocorrelação, intervalo de 95% de Fisher, p) e a correção por
muitas comparações (Benjamini–Hochberg) conferem com um cálculo independente em Python; dias depois do último registro de uma
área não contam como zero nos cruzamentos (os alertas continuam vendo zero); só com gastos a aba explica o que falta em vez de
mostrar números; as métricas novas (Rotina, Cockpit, Psicologia, Idiomas) batem com as abas de origem e respeitam o que é só
seu; perguntas, pistas, “Ver no gráfico” e “Testar como experimento”; par parte-todo no explorador; matriz; Visão geral;
ideias de experimento; celular."""
import asyncio, json, math
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

def pearson(x, y):
    n = len(x)
    if n < 3: return None
    mx = sum(x) / n; my = sum(y) / n
    a = sum((x[i] - mx) * (y[i] - my) for i in range(n)); b = sum((v - mx) ** 2 for v in x); c = sum((v - my) ** 2 for v in y)
    return a / math.sqrt(b * c) if b and c else None
def lag1(a):
    if len(a) < 4: return 0
    r = pearson(a[:-1], a[1:]); return 0 if r is None else r
def stats(xs, ys):
    n = len(xs); r = pearson(xs, ys)
    if r is None or n < 4: return {"r": r, "neff": n, "lo": None, "hi": None, "p": None}
    ph = min(.9, max(0, lag1(xs) * lag1(ys))); neff = min(n, n * (1 - ph) / (1 + ph))
    if neff < 5: return {"r": r, "neff": neff, "lo": None, "hi": None, "p": None}
    z = math.atanh(max(-.9999, min(.9999, r))); se = 1 / math.sqrt(neff - 3)
    Phi = lambda v: .5 * (1 + math.erf(v / math.sqrt(2)))
    return {"r": r, "neff": neff, "lo": math.tanh(z - 1.96 * se), "hi": math.tanh(z + 1.96 * se), "p": 2 * (1 - Phi(abs(z) / se))}
def near(a, b, eps=1e-6): return (a is None and b is None) or (a is not None and b is not None and abs(a - b) < eps)
def bh(ps, q=.1):
    order = sorted(range(len(ps)), key=lambda i: ps[i]); M = len(ps); lim = -1
    for rank, i in enumerate(order):
        if ps[i] <= (rank + 1) / M * q: lim = rank
    out = [False] * M
    for rank, i in enumerate(order): out[i] = rank <= lim
    return out

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="cruz")
        try:
            await pg.wait_for_timeout(1100)
            nav = await pg.evaluate("[NAV[0][1].some(x => x[0] === 'cruz'), NAV.find(g => g[0] === 'Laboratório')[1].map(x => x[0])]")
            chk(not nav[0] and nav[1].index("cruz") == nav[1].index("exp") - 1, f"no menu, Cruzamentos fica no Laboratório, logo antes de Experimentos ({nav[1]})")
            rel = await pg.evaluate("""[['gasto','g:Essencial'],['gasto','c:Mercado'],['bem','humor'],['bem','dhumor'],['diario','t:trabalho'],['palavras','t:x'],['p:Chiara','diario'],['p:Chiara','contatos'],['jmin','jdia'],['ckh','ckc'],['estudo','idi'],['sono','bem'],['treino','energia'],['gasto','estresse'],['ro:pct','energia'],['contatos','diario'],['psis','bem']].map(([a, b]) => czRel(a, b))""")
            chk(rel == [True] * 11 + [False] * 6, f"famílias: parte e todo (gasto do grupo × gasto do dia, humor × humor do dia, tag × diário, “com fulano” × diário e × contatos, idioma × estudo) não se cruzam; áreas diferentes sim ({rel})")
            chk(await pg.evaluate("[CZ.x, CZ.y]") == ["sono", "bem"], "a aba abre num par de áreas diferentes (sono × humor), não mais humor × humor")
            # estatística conferida em Python
            prs = [["sono", "bem", 0], ["treino", "energia", 0], ["hab", "estresse", 0], ["gasto", "bem", 1], ["ckh", "estresse", 0]]
            js = await pg.evaluate("ps => ps.map(([a, b, l]) => { const c = crossData(a, b, { days: 180, lag: l }); return c && { x: c.pts.map(p => p.x), y: c.pts.map(p => p.y), r: c.r, neff: c.neff, lo: c.lo, hi: c.hi, p: c.p, n: c.n }; })", prs)
            dif = []
            for (a, b_, l), c in zip(prs, js):
                py = stats(c["x"], c["y"])
                if not all(near(c[k], py[k], 1e-6 if k != "p" else 1e-6) for k in ("r", "neff", "lo", "hi", "p")): dif.append((a, b_, {k: (c[k], py[k]) for k in ("r", "neff", "lo", "hi", "p")}))
            chk(not dif and all(c["n"] >= 20 for c in js), f"r, dias efetivos, intervalo de 95% e p batem com o Python em {len(prs)} pares ({dif[:1]})")
            bhj = await pg.evaluate("(() => { const L = influencers('bem', { days: 180, min: 20 }); return L.map(i => [i.k, i.p, i.sig, i.lo, i.hi]); })()")
            flags = bh([x[1] for x in bhj])
            chk([x[2] for x in bhj] == flags and sum(flags) >= 3, f"Benjamini–Hochberg a 10%: as mesmas {sum(flags)} pistas de {len(bhj)} que o Python")
            chk(all((x[3] > 0 or x[4] < 0) for x in bhj if x[2]), "toda pista aprovada tem intervalo de 95% fora do zero")
            exc = await pg.evaluate("""[influencers('bem', { days: 180, min: 20 }).filter(i => ['humor', 'dhumor'].includes(i.k)).length, influencers('gasto', { days: 180, min: 20 }).filter(i => /^(g|c):/.test(i.k)).length, influencers('diario', { days: 180, min: 20 }).filter(i => /^(t|p):/.test(i.k) || ['palavras', 'mencoes'].includes(i.k)).length, influencers('bem', { days: 180, min: 20 }).length]""")
            chk(exc[:3] == [0, 0, 0] and exc[3] > 20, f"“o que acompanha” nunca lista a própria família ({exc})")
            # métricas novas conferidas com as abas de origem
            nv = await pg.evaluate("""(() => { const D = DAILY(), eu = (S.ck.membros.find(m => m.eu) || {}).id || 'eu', T = S.ckTar.filter(t => t.concluida && t.resp === eu);
              const dias = [...new Set(T.map(t => t.concluida))].filter(d => D.idx[d] != null), okCk = dias.every(d => Math.abs(D.C.ckh[D.idx[d]] - T.filter(t => t.concluida === d).reduce((s, t) => s + (+t.esforco || 0), 0)) < 1e-9 && D.C.ckc[D.idx[d]] === T.filter(t => t.concluida === d).length);
              const rd = D.dates.filter((d, i) => D.C['ro:pct'][i] != null), okRo = rd.every(d => { const X = rtDia(d); return Math.abs(D.C['ro:pct'][D.idx[d]] - X.feito / X.plan) < 1e-9; });
              const ps = S.psique.sessoes.filter(x => !x.privado).map(x => x.data), okPs = ps.every(d => D.C.psis[D.idx[d]] === 1);
              const id = S.estudo.filter(e => e.lang), okId = [...new Set(id.map(e => e.data))].every(d => Math.abs(D.C.idi[D.idx[d]] - id.filter(e => e.data === d).reduce((s, e) => s + (+e.horas || 0), 0)) < 1e-9);
              return { ck: [dias.length, okCk], ro: [rd.length, okRo], ps: [ps.length, okPs], idi: [id.length, okId], areas: ['ckh', 'psis', 'idi', 'ro:pct'].map(metricArea) }; })()""")
            chk(nv["ck"][0] > 10 and nv["ck"][1] and nv["ro"][0] >= 10 and nv["ro"][1] and nv["ps"][0] >= 1 and nv["ps"][1] and nv["idi"][0] >= 3 and nv["idi"][1], f"Cockpit (tarefas e horas suas concluídas), Rotina (= cumprimento da aba Rotina), Psicologia e Idiomas viram métricas diárias ({nv})")
            chk(nv["areas"][:3] == ["Carreira", "Saúde mental", "Aprendizado"], f"as métricas novas respeitam a privacidade dos setores ({nv['areas']})")
            # perguntas e pistas
            q = await pg.evaluate("""(() => { const L = influencers(CZ.target, { days: CZ.days, lag: CZ.qlag, min: 20 }); return { alvo: CZ.target, sig: L.filter(i => i.sig).length, res: L.filter(i => !i.sig).length, cards: document.querySelectorAll('.czps .czp').length, acaso: document.querySelector('.czacaso summary')?.textContent || '', chips: [...document.querySelectorAll('[data-cztq]')].map(x => x.dataset.cztq), sub: document.querySelector('[data-vid="cz-q"] .vs')?.textContent || '' }; })()""")
            chk(q["alvo"] == "bem" and q["cards"] == min(8, q["sig"]) and str(q["res"]) in q["acaso"] and f"{q['sig']} passaram" in q["sub"], f"as pistas são só as que passam no teste; o resto fica em “podem ser acaso” ({q['cards']} cartões, {q['res']} à parte)")
            chk({"bem", "energia", "estresse", "sono", "ro:pct", "ckh", "gasto"} <= set(q["chips"]), f"perguntas disponíveis ({q['chips']})")
            await pg.click('[data-cztq="estresse"]'); await pg.wait_for_timeout(250)
            st = await pg.evaluate("[CZ.target, document.querySelector('[data-vid=\"cz-q\"] .vs')?.textContent, [...document.querySelectorAll('.czps .czp')].map(x => x.className)]")
            chk(st[0] == "estresse" and "estresse" in st[1].lower() and all(c in ("czp good", "czp crit", "czp") for c in st[2]), f"a pergunta muda o alvo e a cor diz o que é melhor (menos estresse) ({st[0]}, {len(st[2])} pistas)")
            await pg.click('[data-czqlag="1"]'); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("[CZ.qlag, /dia seguinte/.test(document.querySelector('[data-vid=\"cz-q\"] .vs').textContent)]") == [1, True], "“no dia seguinte” cruza o fator de hoje com o alvo de amanhã")
            await pg.click('[data-czqlag="0"]'); await pg.click('[data-cztq="bem"]'); await pg.wait_for_timeout(250)
            k0 = await pg.evaluate("document.querySelector('.czps [data-czver]').dataset.czver")
            await pg.click('.czps [data-czver]'); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("[CZ.x, CZ.y, document.querySelector('[data-vid=\"cz-sc\"] h2').textContent]") == [k0, "bem", f"{await pg.evaluate(f'metric({json.dumps(k0)}).l')} × Humor do dia"], f"“Ver no gráfico” abre o cruzamento da pista ({k0} × humor)")
            # testar como experimento
            n0 = await pg.evaluate("(S.experimentos || []).length")
            await pg.click('.czps [data-cztest]'); await pg.wait_for_timeout(300)
            fm = await pg.evaluate("[!!document.querySelector('#dlg[open] #expf'), $('#ex_int')?.value, $('#ex_met')?.value, $('#ex_hip')?.value, $('#ex_titulo')?.value]")
            chk(fm[0] and fm[1] and fm[2] == "bem" and "r = " in fm[3] and "95%" in fm[3], f"“Testar como experimento” abre o experimento preenchido ({fm[4]!r}: {fm[1]!r})")
            await pg.click("#exok"); await pg.wait_for_timeout(300)
            ex = await pg.evaluate("(x => [S.experimentos.length, x.status, x.metrica, !!x.intervencao])(S.experimentos.at(-1))")
            chk(ex == [n0 + 1, "ativo", "bem", True], f"e vira um experimento ativo ({ex})")
            # par parte-todo no explorador
            await pg.select_option("#czx", "gasto"); await pg.wait_for_timeout(200); await pg.select_option("#czy", "g:Essencial"); await pg.wait_for_timeout(300)
            pt = await pg.evaluate("[document.querySelector('[data-vid=\"cz-rd\"]').innerText, !!document.querySelector('[data-vid=\"cz-rd\"] .czbig')]")
            chk("Uma é parte da outra" in pt[0] and not pt[1], "escolher gasto do dia × gasto essencial mostra o aviso, sem número de correlação")
            # matriz
            mx = await pg.evaluate("[document.querySelectorAll('.cc[data-cx]').length, document.querySelectorAll('.cc.weak').length, document.querySelectorAll('.cc.rel[data-cx]').length]")
            chk(mx[0] > 50 and mx[1] > 10 and mx[2] == 0, f"matriz: células clicáveis, as fracas apagadas, nenhum par parte-todo clicável ({mx})")
            # ideias de experimento e Visão geral
            idk = await pg.evaluate("(() => expIdeas().map(it => { const i = influencers(it.metrica, { days: 180, min: 20 }).find(z => (expIdeaFor(z.k, it.metrica) || {}).intervencao === it.intervencao); return i ? czConsist(i) : null; }))()")
            chk(len(idk) >= 1 and all(idk), f"as ideias da aba Experimentos vêm de pistas consistentes ({idk})")
            await pg.evaluate("location.hash = 'visao'"); await pg.wait_for_timeout(500)
            ov = await pg.evaluate("[document.querySelectorAll('[data-vid=\"ov-inf\"] .dvr').length, document.querySelector('[data-vid=\"ov-inf\"] .vs')?.textContent || '', [...document.querySelectorAll('[data-vid=\"ov-inf\"] .dvr small')].filter(x => /acaso/.test(x.textContent)).length]")
            chk(ov[0] >= 3 and "teste de acaso" in ov[1] and ov[2] == 0, f"a Visão geral mostra só o que passa no teste ({ov[0]} itens)")
            ms = await pg.evaluate("(() => { const t0 = performance.now(); location.hash = 'cruz'; route(); VER++; render(); return Math.round(performance.now() - t0); })()")
            chk(ms < 2500, f"a aba desenha em {ms} ms com o Exemplo (81 métricas)")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # só gastos (o caso real que motivou a mudança), e o zero depois do último registro
        b, pg, e2 = await open_page(p, w=1300, h=900, hash_="visao", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            await pg.evaluate("""(() => { const cats = Object.keys(CAT_DESP); let s = 5; const R = () => (s = s * 16807 % 2147483647) / 2147483647;
              for (let i = 30; i < 150; i++) { const d = addDays(TODAY, -i); for (let k = 0; k < 1 + Math.floor(R() * 3); k++) S.lanc.push({ id: uid(), data: d, tipo: 'Despesa', cat: cats[Math.floor(R() * cats.length)], desc: 'teste', valor: Math.round(5 + R() * 80), conta: '' }); }
              touch('lanc'); location.hash = 'cruz'; })()""")
            await pg.wait_for_timeout(700)
            so = await pg.evaluate("[!!document.querySelector('.czpron'), !!document.querySelector('[data-vid=\"cz-sc\"]'), !!document.querySelector('.czpron a[href=\"#fin.rel\"]'), document.querySelectorAll('.czai').length, document.querySelectorAll('.czai.on').length, /\\d,\\d\\d/.test(document.querySelector('.czpron').innerText)]")
            chk(so == [True, False, True, 12, 1, False], f"só com gastos: a aba diz o que falta e aponta Finanças → Relatório, sem nenhuma correlação ({so})")
            zz = await pg.evaluate("(() => { const D = DAILY(), c = czCol('gasto'), e = D.E.gasto; return [D.dates[e], addDays(TODAY, -30 + 14), c.slice(e + 1).every(v => v === null), D.C.gasto.slice(e + 1).every(v => v === 0), c[e]]; })()")
            chk(zz[0] == zz[1] and zz[2] and zz[3] and zz[4] == 0, f"depois do último lançamento + 14 dias, os cruzamentos não contam zero (os alertas ainda contam) ({zz[0]})")
            await pg.evaluate("""(() => { for (let i = 0; i < 60; i++) { const d = addDays(TODAY, -i); S.saude[d] = { humor: 2 + (i % 3), energia: 3, sono: 6 + (i % 4) / 2 }; } S.psique = { ...(S.psique || {}), sessoes: [{ id: 'x1', data: addDays(TODAY, -40), privado: true }, { id: 'x2', data: addDays(TODAY, -33) }], reflexoes: [] }; touch('saude', 'psique'); })()""")
            await pg.wait_for_timeout(600)
            pr = await pg.evaluate("(() => { const P = czProntidao(180), c = crossData('gasto', 'bem', { days: 180 }), D = DAILY(), n = D.dates.filter((d, i) => czCol('gasto')[i] != null && D.C.bem[i] != null).length; return [P.pronto, c.n, n, !!document.querySelector('[data-vid=\"cz-sc\"]'), D.C.psis[D.idx[addDays(TODAY, -40)]], D.C.psis[D.idx[addDays(TODAY, -33)]]]; })()")
            chk(pr[0] and pr[1] == pr[2] and pr[1] >= 20 and pr[3], f"com o check-in junto, a aba destrava; gasto × humor usa só os dias observados das duas ({pr[1]} dias)")
            chk(pr[4] in (None, 0) and pr[5] == 1, f"a sessão marcada como só sua não entra nos cruzamentos ({pr[4:]})")
            chk(not e2, f"sem erros ({e2[:2]})")
        finally:
            await b.close()
        b, pg, e3 = await open_page(p, w=390, h=844, hash_="cruz")
        try:
            await pg.wait_for_timeout(1100)
            mob = await pg.evaluate("[document.scrollingElement.scrollWidth, innerWidth, document.querySelectorAll('.czp').length]")
            chk(mob[0] <= mob[1] + 1 and mob[2] >= 1, f"no celular, sem rolagem horizontal ({mob})")
            chk(not e3, f"sem erros ({e3[:2]})")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
