"""Dashboard do Cockpit (1/2): a camada de agregação (49-cockpit-agg.js) confere com um cálculo independente em Python sobre os
mesmos dados (o Exemplo, com 12 semanas de histórico): período e dias úteis italianos, comparação com o mesmo trecho do período
anterior, KPIs (concluídas, % no prazo, atrasos, riscos altos, problemas, resolução, elaborati, clash), burnup, status semanal,
throughput e lead time, esforço por projeto, matriz de riscos, problemas por semana, conhecimento (decisões, escopo, lições),
Minha agenda, carga realizada e o heatmap; o calendário indexado bate com o dia a dia; os filtros são consistentes entre si e
com os ids do drill-down; os KPIs do Hoje são os mesmos da camada; e o registro diário (snapshot) é gravado uma vez por dia,
só fora do Exemplo."""
import asyncio, json, datetime as dt, random
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

# ---------------------------------------------------------------- calendário independente (Python)
D_ = lambda s: dt.date.fromisoformat(s)
S_ = lambda d: d.isoformat()
def easter(y):
    a = y % 19; b = y // 100; c = y % 100; d = b // 4; e = b % 4; f = (b + 8) // 25; g = (b - f + 1) // 3; h = (19 * a + b - d - g + 15) % 30
    i = c // 4; k = c % 4; l = (32 + 2 * e + 2 * i - h - k) % 7; m = (a + 11 * h + 22 * l) // 451; mo = (h + l - 7 * m + 114) // 31; da = (h + l - 7 * m + 114) % 31 + 1
    return dt.date(y, mo, da)
FEST = ["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-25", "12-26"]
_fer = {}
def feriados(y, patrono="06-24"):
    if y not in _fer: _fer[y] = {f"{y}-{md}" for md in FEST} | {S_(easter(y) + dt.timedelta(days=1))} | ({f"{y}-{patrono}"} if patrono else set())
    return _fer[y]
def util(s): d = D_(s); return d.weekday() < 5 and s not in feriados(d.year)
def days(a, b):
    d, e = D_(a), D_(b)
    while d <= e: yield S_(d); d += dt.timedelta(days=1)
def du(a, b): return 0 if not a or not b or b < a else sum(1 for x in days(a, b) if util(x))
def wdiff(a, b):
    if a == b: return 0
    return du(S_(D_(a) + dt.timedelta(days=1)), b) if b > a else -du(b, S_(D_(a) - dt.timedelta(days=1)))
def nxt(s):
    while not util(s): s = S_(D_(s) + dt.timedelta(days=1))
    return s
def addu(s, n):
    x = nxt(s); k = n
    while k > 0:
        x = S_(D_(x) + dt.timedelta(days=1))
        if util(x): k -= 1
    return x
def wstart(s): d = D_(s); return S_(d - dt.timedelta(days=d.weekday()))
def addd(s, n): return S_(D_(s) + dt.timedelta(days=n))
inr = lambda d, a, b: bool(d) and a <= d <= b
avg = lambda xs: (sum(xs) / len(xs)) if xs else None
def close(a, b, eps=1e-6): return (a is None and b is None) or (a is not None and b is not None and abs(a - b) < eps)

def risco_aberto(r, d):
    if not r.get("criado") or r["criado"] > d: return False
    fechou = (r.get("revisto") or r["criado"]) if r.get("status") in ("fechado", "mitigado") else None
    return not fechou or fechou > d
def prob_aberto(p, d): return bool(p.get("criado")) and p["criado"] <= d and (not p.get("resolvido") or p["resolvido"] > d)
def clash_em(b, d):
    s = [x for x in b.get("snaps", []) if x["data"] <= d]
    return s[-1] if s else None
def ft(F):
    return lambda t: (not F.get("pes") or t.get("resp") == F["pes"]) and (not F.get("proj") or t.get("projeto") == F["proj"]) and (not F.get("tag") or F["tag"] in (t.get("tags") or []))
def kpi_py(D, F, ini, fim, hoje, lim):
    T = [t for t in D["tar"] if ft(F)(t)]
    concl = [t for t in T if inr(t.get("concluida"), ini, fim)]; plan = [t for t in T if inr(t.get("prazo"), ini, fim)]
    cp = [t for t in concl if t.get("prazo")]; np_ = [t for t in cp if t["concluida"] <= t["prazo"]]
    atr = [t for t in plan if t["prazo"] < hoje and (not t.get("concluida") or t["concluida"] > t["prazo"])]
    fr = lambda r: (not F.get("pes") or r.get("dono") == F["pes"]) and (not F.get("proj") or r.get("projeto") == F["proj"])
    fi = lambda p: (not F.get("pes") or p.get("resp") == F["pes"]) and (not F.get("proj") or p.get("projeto") == F["proj"])
    rk = [r for r in D["risk"] if fr(r) and risco_aberto(r, fim) and (r["prob"] * r["imp"]) >= lim["riscoAlto"]]
    pb = [p for p in D["iss"] if fi(p) and prob_aberto(p, fim)]
    res = [p for p in D["iss"] if fi(p) and inr(p.get("resolvido"), ini, fim) and p.get("criado")]
    fe = lambda e: (not F.get("pes") or e.get("resp") == F["pes"]) and (not F.get("proj") or e.get("projeto") == F["proj"])
    elP = [e for e in D["el"] if fe(e) and inr(e.get("prevista"), ini, fim)]; elE = [e for e in elP if e.get("emissao") and e["emissao"] <= fim]
    fb = lambda b: (not F.get("proj") or b.get("projeto") == F["proj"]) and (not F.get("pes") or b.get("tipo") != "modelo" or b.get("resp") == F["pes"])
    cl = sum((clash_em(b, fim) or {}).get("abertos", 0) or 0 for b in D["bim"] if b["tipo"] == "clash" and fb(b))
    return {"concl": len(concl), "plan": len(plan), "pctPrazo": (len(np_) / len(cp)) if cp else None, "atrasos": len(atr), "riscosAltos": len(rk), "probAbertos": len(pb),
            "tRes": avg([max(0, wdiff(p["criado"], p["resolvido"])) for p in res]), "elPrev": len(elP), "elEnt": len(elE), "clash": cl,
            "_ids": {"concl": sorted(t["id"] for t in concl), "atr": sorted(t["id"] for t in atr)}}

EXTRACT = """(() => { const D = ckDados(), X = ckCtx(), F0 = { pes: '', proj: '', tag: '' }, P = ckPeriodo('mes', TODAY, X.cal), A = ckAgg(D, F0, P, X);
  const mk = TODAY.slice(0, 7), pm = addMonth(mk, -1), Pp = ckPeriodo('custom', TODAY, X.cal, pm + '-01', addDays(mk + '-01', -1)), Ap = ckAgg(D, F0, Pp, X);
  const Fs = [{ pes: 'm2', proj: '', tag: '' }, { pes: '', proj: 'p1', tag: '' }, { pes: '', proj: '', tag: 'Idraulica' }, { pes: 'm1', proj: 'p2', tag: '' }];
  return JSON.stringify({ today: TODAY, lim: X.lim, D: { tar: D.tar, risk: D.risk, iss: D.iss, el: D.el, bim: D.bim, dec: D.dec, log: D.log, lic: D.lic, meet: D.meet, membros: D.membros, marcos: D.marcos },
    P, A: { kpis: A.kpis, burnup: { total: A.burnup.total, feitas: A.burnup.feitas, ids: A.burnup.ids }, status: A.status.map(s => ({ w: s.w, c: s.concluidas })), fluxo: A.fluxo.map(x => ({ w: x.w, thr: x.thr, lead: x.lead })), esforco: A.esforco, riscos: { matriz: A.riscos.matriz, abertos: A.riscos.abertos }, problemas: { abertos: A.problemas.abertos, sem: A.problemas.sem.map(s => [s.w, s.abertos, s.resolvidos, s.estoque]) }, conh: { dec: A.conh.dec, escopo: A.conh.escopo, escopoPrev: A.conh.escopoPrev, lic: A.conh.lic }, equipe: A.equipe.map(x => ({ id: x.id, concl: x.concl, pct: x.pct, sem: x.sem })) },
    Pp, Ap: { agenda: Ap.agenda, kpis: Ap.kpis, equipe: Ap.equipe.map(x => ({ id: x.id, real: x.carga.real })), heat: { cols: Ap.heat.cols, rows: Ap.heat.rows.map(r => ({ id: r.id, h: r.cells.map(c => c.h) })) } },
    filt: Fs.map(F => ({ F, k: ckKpiJanela(D, F, P.ini, P.fim, X) })), hpd: Object.fromEntries(D.membros.map(m => [m.id, ckHpdOf(m, D.cfg)])) }); })()"""

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho.hoje")
        try:
            await pg.wait_for_timeout(1000)
            J = json.loads(await pg.evaluate(EXTRACT)); D = J["D"]; hoje = J["today"]; lim = J["lim"]; P = J["P"]; A = J["A"]
            chk(len([t for t in D["tar"] if t.get("concluida")]) >= 60 and len(D["meet"]) >= 15 and len(D["log"]) >= 20, f"o Exemplo tem histórico de 12 semanas ({len(D['tar'])} tarefas, {len(D['meet'])} reuniões, {len(D['log'])} eventos)")
            # período
            ini = hoje[:8] + "01"; y, m = int(hoje[:4]), int(hoje[5:7]); fim = S_(dt.date(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(days=1))
            pini = S_((D_(ini) - dt.timedelta(days=1)).replace(day=1)); n_el = du(ini, hoje); pfim = addu(pini, n_el - 1)
            chk(P["ini"] == ini and P["fim"] == fim and P["du"] == du(ini, fim), f"período do mês e dias úteis italianos ({P['ini']}..{P['fim']}, {P['du']} d.u.; Python {du(ini, fim)})")
            chk(P["prev"]["ini"] == pini and P["prev"]["fim"] == pfim and P["prev"]["parcial"] and P["prev"]["du"] == n_el, f"mês em andamento compara com o mesmo trecho do anterior: {n_el} d.u., {pini}..{pfim} ({P['prev']})")
            chk(P["semanas"][-1] == wstart(hoje) and len(P["semanas"]) >= 8, f"as semanas das tendências terminam na semana de hoje, sem semana futura ({P['semanas'][-1]}, {len(P['semanas'])})")
            # KPIs, atual e anterior
            for lado, a, z in (("cur", ini, fim), ("prev", pini, pfim)):
                py = kpi_py(D, {}, a, z, hoje, lim); js = A["kpis"][lado]
                keys = ["concl", "plan", "atrasos", "riscosAltos", "probAbertos", "elPrev", "elEnt", "clash"]
                dif = {k: (js[k], py[k]) for k in keys if js[k] != py[k]}
                chk(not dif and close(js["pctPrazo"], py["pctPrazo"]) and close(js["tRes"], py["tRes"]) and sorted(js["conclIds"]) == py["_ids"]["concl"] and sorted(js["atrIds"]) == py["_ids"]["atr"],
                    f"KPIs {lado} batem com o Python ({ {k: js[k] for k in keys} } · % {js['pctPrazo']} · resolução {js['tRes']} {dif})")
            # burnup, status semanal, fluxo
            T = D["tar"]; esc = [t for t in T if inr(t.get("prazo"), ini, fim)]
            chk(A["burnup"]["total"] == len(esc) and A["burnup"]["feitas"] == len([t for t in esc if t.get("concluida") and t["concluida"] <= fim]), f"burnup: escopo e concluídas ({A['burnup']['total']}, {A['burnup']['feitas']})")
            st_ok = all(s["c"] == len([t for t in T if inr(t.get("concluida"), s["w"], addd(s["w"], 6))]) for s in A["status"])
            fx_ok = all(x["thr"] == len([t for t in T if inr(t.get("concluida"), x["w"], addd(x["w"], 6))]) and close(x["lead"], avg([max(0, wdiff(t["criada"], t["concluida"])) for t in T if inr(t.get("concluida"), x["w"], addd(x["w"], 6)) and t.get("criada")])) for x in A["fluxo"])
            chk(st_ok and fx_ok, f"concluídas por semana, throughput e lead time em dias úteis batem ({[x['thr'] for x in A['fluxo']]})")
            # esforço por projeto (concluído no período)
            fe = {}
            for t in T:
                if inr(t.get("concluida"), ini, fim): fe[t.get("projeto") or ""] = fe.get(t.get("projeto") or "", 0) + (t.get("esforco") or 0)
            chk(all(close(A["esforco"]["proj"].get(k, {}).get("feito", 0), v) for k, v in fe.items()), f"esforço concluído por projeto ({fe})")
            # riscos e problemas
            M = {}
            for r in D["risk"]:
                if risco_aberto(r, fim): M.setdefault(f"{r['prob']}|{r['imp']}", []).append(r["id"])
            chk({k: sorted(v) for k, v in A["riscos"]["matriz"].items()} == {k: sorted(v) for k, v in M.items()}, f"matriz de riscos abertos no fim do período ({ {k: len(v) for k, v in M.items()} })")
            sem_ok = all(ab == len([q for q in D["iss"] if inr(q.get("criado"), w, addd(w, 6))]) and rs == len([q for q in D["iss"] if inr(q.get("resolvido"), w, addd(w, 6))]) and es == len([q for q in D["iss"] if prob_aberto(q, addd(w, 6))]) for w, ab, rs, es in A["problemas"]["sem"])
            chk(sem_ok and A["problemas"]["abertos"] == len([q for q in D["iss"] if prob_aberto(q, fim)]), f"problemas abertos × resolvidos por semana e o estoque ({A['problemas']['sem'][-3:]})")
            # conhecimento
            ESC = ("escopo", "demanda", "cliente")
            c_py = {"dec": len([d for d in D["dec"] if inr(d.get("data"), ini, fim)]), "escopo": len([e for e in D["log"] if inr(e["data"], ini, fim) and e["tipo"] in ESC]), "escopoPrev": len([e for e in D["log"] if inr(e["data"], pini, pfim) and e["tipo"] in ESC]), "lic": len([l for l in D["lic"] if inr(l.get("data"), ini, fim)])}
            chk(A["conh"] == c_py, f"decisões, escopo/demanda/cliente (atual e anterior) e lições ({A['conh']} = {c_py})")
            # equipe: % no prazo por pessoa e a queda planejada da Giulia
            eq_ok = True
            for x in A["equipe"]:
                cs = [t for t in T if t.get("resp") == x["id"] and inr(t.get("concluida"), ini, fim) and t.get("prazo")]
                if not close(x["pct"], (len([t for t in cs if t["concluida"] <= t["prazo"]]) / len(cs)) if cs else None): eq_ok = False
            g = next(x for x in A["equipe"] if x["id"] == "m2")["sem"]; gp = [s["pct"] for s in g if s["pct"] is not None]
            chk(eq_ok, "% no prazo por pessoa bate")
            chk(len(gp) >= 5 and min(gp[:3]) >= 0.99 and max(gp[-3:]) <= 0.5, f"no Exemplo, o % no prazo da Giulia cai nas últimas semanas ({[round(v, 2) for v in gp]})")
            # mês anterior completo: Minha agenda, carga realizada e heatmap
            Pp = J["Pp"]; Ap = J["Ap"]; a0, a1 = Pp["ini"], Pp["fim"]; G = Ap["agenda"]
            CAT = [("coordenacao", ["Coordenação", "Cliente"]), ("admin", ["Admin"]), ("tecnica", ["BIM", "Idraulica", "Tracciato"])]
            def cat(tags):
                for k, ts in CAT:
                    if any(x in (tags or []) for x in ts): return k
                return "tecnica"
            h = {"tecnica": 0, "coordenacao": 0, "equipe": 0, "admin": 0}
            for t in T:
                if t.get("resp") == "eu" and inr(t.get("concluida"), a0, a1): h[cat(t.get("tags"))] += t.get("esforco") or 0
                if t.get("revisor") == "eu" and inr(t.get("concluida"), a0, a1): h["equipe"] += (t.get("esforco") or 0) * lim["revisaoFrac"]
            for x in D["meet"]:
                if inr(x["data"], a0, a1): h["equipe" if x["tipo"] == "1a1" else "coordenacao"] += lim["horas1a1"] if x["tipo"] == "1a1" else lim["horasReuniao"]
            h["coordenacao"] += G["agendaH"]; tot = sum(h.values())
            alerta = tot > 0 and h["tecnica"] / tot > lim["agendaTecnicaMax"] and h["coordenacao"] / tot < lim["agendaCoordMin"]
            chk(all(close(G["h"][k], v) for k, v in h.items()) and G["alerta"] == alerta, f"Minha agenda do mês anterior por categoria e o alerta ({ {k: round(v, 2) for k, v in G['h'].items()} } alerta={G['alerta']}; Python { {k: round(v, 2) for k, v in h.items()} } {alerta})")
            re_ok = True
            for x in Ap["equipe"]:
                r = x["real"]; hh = sum(t.get("esforco") or 0 for t in T if t.get("resp") == x["id"] and inr(t.get("concluida"), a0, a1))
                if not r or r["n"] != du(a0, a1) or not close(r["h"], hh): re_ok = False
            chk(re_ok, "carga realizada no mês anterior: horas concluídas e dias úteis por pessoa")
            ht_ok = all(close(sum(r["h"]), sum(t.get("esforco") or 0 for t in T if t.get("resp") == r["id"] and t.get("concluida") and t["concluida"] in Ap["heat"]["cols"])) for r in Ap["heat"]["rows"])
            chk(ht_ok and Ap["heat"]["cols"] == [d for d in days(a0, a1) if util(d)], f"heatmap: uma coluna por dia útil e as horas concluídas no dia ({len(Ap['heat']['cols'])} colunas)")
            # filtros
            f_ok = all(kpi_py(D, f["F"], ini, fim, hoje, lim)["concl"] == f["k"]["concl"] and kpi_py(D, f["F"], ini, fim, hoje, lim)["atrasos"] == f["k"]["atrasos"] and kpi_py(D, f["F"], ini, fim, hoje, lim)["probAbertos"] == f["k"]["probAbertos"] for f in J["filt"])
            chk(f_ok, f"filtros por pessoa, projeto, tag e combinados batem ({[(f['F'], f['k']['concl']) for f in J['filt']]})")
            soma = await pg.evaluate("""(() => { const D = ckDados(), X = ckCtx(), P = ckPeriodo('mes', TODAY, X.cal), k = F => ckKpiJanela(D, F, P.ini, P.fim, X);
              const tot = k({ pes: '', proj: '', tag: '' }), por = D.membros.map(m => k({ pes: m.id, proj: '', tag: '' })), proj = [...D.projetos.map(p => p.id)].map(id => k({ pes: '', proj: id, tag: '' }));
              const semProj = D.tar.filter(t => !t.projeto && ckIn(t.concluida, P.ini, P.fim)).length, semResp = D.tar.filter(t => !D.membros.some(m => m.id === t.resp) && ckIn(t.concluida, P.ini, P.fim)).length;
              return [tot.concl, por.reduce((s, x) => s + x.concl, 0) + semResp, proj.reduce((s, x) => s + x.concl, 0) + semProj, tot.atrasos, por.reduce((s, x) => s + x.atrasos, 0)]; })()""")
            chk(soma[0] == soma[1] == soma[2] and soma[3] >= soma[4], f"a soma por pessoa e por projeto dá o total ({soma})")
            # calendário indexado × dia a dia × Python
            random.seed(7); pares = [(S_(dt.date(2024, 1, 1) + dt.timedelta(days=random.randint(0, 1500))), S_(dt.date(2024, 1, 1) + dt.timedelta(days=random.randint(0, 1500))), random.randint(-30, 60)) for _ in range(300)]
            cmp = await pg.evaluate("""ps => { const I = ckCalOf(ckD().cfg), L = ckCalLoop(ckD().cfg); let bad = []; for (const [a, b, n] of ps) { const x = [I.diff(a, b), I.next(a), I.prev(a), I.add(a, n), I.util(a)], y = [L.diff(a, b), L.next(a), L.prev(a), L.add(a, n), L.util(a)]; if (JSON.stringify(x) !== JSON.stringify(y)) bad.push([a, b, n, x, y]); } return { bad: bad.slice(0, 3), nao: (() => { const o = []; let d = '2024-01-01'; while (d <= '2028-12-31') { if (!I.util(d)) o.push(d); d = addDays(d, 1); } return o; })(), dif: ps.map(([a, b]) => I.diff(a, b)) }; }""", pares)
            py_nao = [d for d in days("2024-01-01", "2028-12-31") if not util(d)]
            chk(not cmp["bad"], f"calendário indexado = dia a dia em 300 pares (diff, next, prev, add, util) ({cmp['bad']})")
            chk(cmp["nao"] == py_nao and cmp["dif"] == [wdiff(a, b) for a, b, _ in pares], f"dias não úteis 2024–2028 e diferenças em dias úteis batem com o Python ({len(py_nao)} dias)")
            # KPIs do Hoje = camada de agregação = Python
            hk = await pg.evaluate("""(() => { const K = ckKpisHoje(ckDados(), ckCtx()), km = [...document.querySelectorAll('.km')].map(x => [x.querySelector('.kml')?.textContent, x.querySelector('.kmv')?.textContent]); return { meu: K.meu.length, venc: K.venc.length, prox: K.prox.length, ate5: K.ate5, km }; })()""")
            ate5 = addu(nxt(hoje), 4)
            venc_py = len([t for t in T if t["status"] != "concluída" and t.get("prazo") and t["prazo"] < hoje]); prox_py = len([t for t in T if t["status"] != "concluída" and t.get("prazo") and hoje <= t["prazo"] <= ate5])
            kmd = {k: v for k, v in hk["km"]}
            chk(hk["ate5"] == ate5 and hk["venc"] == venc_py and hk["prox"] == prox_py and kmd.get("Vencidas") == str(venc_py) and kmd.get("Prazos em 5 dias úteis") == str(prox_py), f"os cartões do Hoje vêm da camada e batem com o Python (vencidas {hk['venc']}, 5 d.u. {hk['prox']} até {ate5})")
            # o drill-down carrega exatamente os ids do número (amostra dos KPIs)
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(700)
            ids = await pg.evaluate("""(() => { const c = ckDashAgg().kpis.cur, out = {}; for (const el of document.querySelectorAll('[data-vid="ckw-kpis"] [data-ckdrill]')) out[el.querySelector('.kml').textContent] = CK_DR[el.dataset.ckdrill].ids.length;
              return { out, esp: { 'Concluídas / planejadas': c.concl, '% no prazo': c.nComPrazo, 'Atrasos': c.atrasos, [`Riscos altos (≥ ${ckLim('riscoAlto')})`]: c.riscosAltos, 'Problemas abertos': c.probAbertos, 'Elaborati entregues / previstos': c.elPrev, 'Clash abertos': c.clashIds.length } }; })()""")
            chk(all(ids["out"].get(k) == v for k, v in ids["esp"].items()), f"cada KPI do Dashboard leva exatamente os ids que o compõem ({ids['out']})")
            # snapshot: calculado certo e nunca gravado no Exemplo
            sn = await pg.evaluate("(() => { const n0 = ckA('ckSnap').length, r = ckSnapTake(), s = ckSnapCalc(ckDados(), ckCtx()); return { r, n0, n1: ckA('ckSnap').length, s }; })()")
            s = sn["s"]; op = [t for t in T if t["status"] != "concluída"]
            chk(not sn["r"] and sn["n0"] == sn["n1"], f"no Exemplo o registro diário não é gravado ({sn['n0']} → {sn['n1']})")
            chk(s["d"] == hoje and s["ab"] == len(op) and s["venc"] == venc_py and s["rAb"] == len([r for r in D["risk"] if risco_aberto(r, hoje)]) and s["pAb"] == len([q for q in D["iss"] if prob_aberto(q, hoje)]) and sum(v["ab"] for v in s["pes"].values()) == len([t for t in op if t.get("resp") in s["pes"]]),
                f"o registro do dia conta abertas, vencidas, riscos e problemas abertos e por pessoa ({ {k: s[k] for k in ('ab', 'venc', 'rAb', 'pAb', 'minF')} })")
            past = await pg.evaluate("(() => { const D = ckDados(), X = ckCtx(), P = ckPeriodo('custom', TODAY, X.cal, addDays(TODAY, -40), addDays(TODAY, -20)), k = ckKpiJanela(D, { pes: '', proj: '', tag: '' }, P.ini, P.fim, X), s = ckSnapEm(D, P.fim); return [k.minF, k.fonteF, s?.minF, s?.d]; })()")
            chk(past[1] == "snap" and past[0] == past[2], f"num período passado, a menor folga vem do registro diário daquele dia ({past})")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # fora do Exemplo: um registro por dia, atualizado quando o estado muda
        b, pg, e2 = await open_page(p, w=1300, h=900, hash_="trabalho.hoje", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            r0 = await pg.evaluate("[ckSnapTake(), ckA('ckSnap').length]")
            await pg.evaluate("ckD().membros.push({ id: 'mx', nome: 'Pessoa X', nivel: 'Júnior', horas: 36, ativo: true }); ckA('ckTar').push({ id: 'tx', cod: 'T1', titulo: 'Tarefa X', projeto: '', resp: 'mx', prazo: addDays(TODAY, 3), esforco: 4, status: 'a fazer', feito: 0, deps: [], tags: [], criada: TODAY, hist: [] }); touch('ck', 'ckTar')")
            r1 = await pg.evaluate("[ckSnapTake(), ckSnapTake(), ckA('ckSnap').length, ckA('ckSnap')[0]?.d === TODAY, ckA('ckSnap')[0]?.ab]")
            await pg.evaluate("ckA('ckTar')[0].status = 'em andamento'; touch('ckTar')")
            r2 = await pg.evaluate("[ckSnapTake(), ckA('ckSnap').length, ckA('ckSnap')[0].st['em andamento']]")
            await pg.wait_for_timeout(1500)
            keys = await pg.evaluate("Object.keys(window.__store).filter(k => /s_ckSnap/.test(k)).length")
            chk(r0 == [False, 0], f"sem dados no Cockpit, nenhum registro ({r0})")
            chk(r1 == [True, False, 1, True, 1] and r2 == [True, 1, 1] and keys >= 1, f"um registro por dia: grava, não repete sem mudança e atualiza o do dia quando muda; vai para o banco ({r1} {r2} docs {keys})")
            chk(not e2, f"sem erros ({e2[:2]})")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
