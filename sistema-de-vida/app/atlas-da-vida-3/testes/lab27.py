"""Saúde → Alimentação (Nutri) e Treinos (Personal): as contas conferidas por uma implementação independente em Python (TMB de
Mifflin-St Jeor, gasto, calorias com piso e ritmo máximo, proteína, gordura e carboidrato; tendência do peso por regressão;
gasto pelos dados; progressão dupla; 1RM de Epley; volume por grupo; carga aguda:crônica; Riegel; as regras do plano de
corrida); registro por texto; água e peso; treino série a série com o check-in do dia; corrida; ficha à mão e por modelo;
plano básico; os dois agentes com ferramentas (propostas válidas e inválidas, aprovação por clique e por “ok”), sem
ferramentas (bloco atlas) e bloqueados pela Privacidade; métricas novas nos Cruzamentos; celular."""
import asyncio, json, math, datetime as dt
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)
def jr(x): return math.floor(x + .5)            # Math.round do JavaScript
def near(a, b, eps=1e-6): return a is not None and b is not None and abs(a - b) <= eps
def D(s): return dt.date.fromisoformat(s)
def add(s, n): return (D(s) + dt.timedelta(days=n)).isoformat()
def wstart(s): d = D(s); return (d - dt.timedelta(days=d.weekday())).isoformat()

ATIV = {"sedentario": 1.2, "leve": 1.375, "moderado": 1.55, "intenso": 1.725, "muito": 1.9}
AJ = {"perder": {"baixo": -.10, "medio": -.15, "alto": -.20}, "manter": {"baixo": 0, "medio": 0, "alto": 0}, "ganhar": {"baixo": .05, "medio": .10, "alto": .15}}
PROT = {"perder": {"baixo": 1.6, "medio": 1.8, "alto": 2.0}, "manter": {"baixo": 1.2, "medio": 1.4, "alto": 1.6}, "ganhar": {"baixo": 1.6, "medio": 1.8, "alto": 2.0}}
RITMO = {"perder": {"baixo": .005, "medio": .0075, "alto": .01}, "ganhar": {"baixo": .0025, "medio": .0035, "alto": .005}}
def calc(sexo, nasc, alt, ativ, peso, obj, modo, foco, ano):
    idade = ano - nasc; altm = alt / 100; imc = peso / altm ** 2
    bmr = 10 * peso + 6.25 * alt - 5 * idade + (5 if sexo == "M" else -161); tdee = bmr * ATIV[ativ]
    if obj == "perder" and imc < 18.5: obj = "manter"
    kcal = tdee * (1 + AJ[obj][modo]); lim = RITMO.get(obj, {}).get(modo); dmax = lim * peso * 7700 / 7 if lim else 0
    if obj == "perder" and tdee - kcal > dmax: kcal = tdee - dmax
    if obj == "ganhar" and kcal - tdee > dmax: kcal = tdee + dmax
    piso = jr(max(1500 if sexo == "M" else 1200, bmr)); aplic = kcal < piso
    if aplic: kcal = piso
    kcal = jr(kcal / 10) * 10
    p25 = 25 * altm * altm; ref = p25 + .25 * (peso - p25) if imc > 30 else peso
    esp = foco in ("esportivo", "shape"); pkg = min(2.2, PROT[obj][modo] + (.2 if esp else 0)); share = .25 if esp else .30
    prot = jr(pkg * ref); gord = jr(max(.6 * ref, kcal * share / 9)); carb = (kcal - prot * 4 - gord * 9) / 4
    if carb < 130: gord = jr(max(.6 * ref, (kcal - prot * 4 - 520) / 9)); carb = (kcal - prot * 4 - gord * 9) / 4
    return {"obj": obj, "bmr": bmr, "tdee": tdee, "piso": piso, "pisoAplicado": aplic, "kcal": kcal, "prot": prot, "gord": gord, "carb": max(0, jr(carb)), "imc": imc, "ref": ref}
def regress(pts):                                 # [(dia, kg)] → kg por semana
    x0 = D(pts[0][0]); xs = [(D(d) - x0).days for d, _ in pts]; ys = [kg for _, kg in pts]; mx = sum(xs) / len(xs); my = sum(ys) / len(ys)
    sxx = sum((x - mx) ** 2 for x in xs); return (sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx if sxx else 0) * 7
def km_entre(C, a, b): return sum(float(c["km"]) for c in C if a <= c["data"] <= b)
FORTE = {"tempo", "intervalado", "fartlek", "prova"}
def valida_plano(semanas, base, nivel):           # as regras do plano, escritas de novo aqui
    maxs = {"iniciante": 4, "intermediario": 5, "avancado": 6}[nivel]; maxf = 1 if nivel == "iniciante" else 2
    tot = []
    for w, s in enumerate(semanas):
        ss = s["sessoes"]
        if len(ss) > maxs: return f"sessões semana {w + 1}"
        if len({x["dia"] for x in ss}) != len(ss): return f"dia repetido semana {w + 1}"
        if sum(1 for x in ss if x["tipo"] in FORTE) > maxf: return f"fortes semana {w + 1}"
        if any(not (.5 <= x["km"] <= 45) for x in ss): return f"km semana {w + 1}"
        tot.append(sum(x["km"] for x in ss))
    if tot[0] > max(base * 1.1, base + 2, 8) + .05: return "semana 1"
    seg = 0
    for w in range(1, len(tot)):
        ref = max(tot[max(0, w - 3):w])
        if tot[w] > max(ref * 1.1, ref + 2) + .05: return f"aumento semana {w + 1}"
        seg = seg + 1 if tot[w] > tot[w - 1] + .05 else 0
        if seg > 3: return f"seguidas semana {w + 1}"
    return None

async def ask(pg, texto):
    await pg.fill("#m_in", texto); await pg.press("#m_in", "Enter")
    for _ in range(80):
        await pg.wait_for_timeout(100)
        if await pg.evaluate("!MST.live"): break

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="saude.alimentacao")
        try:
            await pg.wait_for_timeout(900)
            st = await pg.evaluate("""({ subs: SUBS.saude.map(x => x[0]), mids: [MIDS.includes('nutri'), MIDS.includes('personal')], defs: ['nutri', 'personal'].map(m => [MENTOR_DEF[m].page, MENTOR_DEF[m].sub, MENTOR_DEF[m].gate]),
              keys: ['nutri', 'nutriLog', 'treino', 'treinoLog', 'corridas'].every(k => KEYS.includes(k) && k in EMPTY()), icons: ['apple', 'dumbbell', 'run'].every(k => ICONS[k]),
              ex: { log: S.nutriLog.length, ses: S.treinoLog.length, cor: S.corridas.length, plano: !!S.treino.planoCorrida, fichas: S.treino.fichas.map(f => f.nome), pend: [sdPendentes('nutri').length, sdPendentes('personal').length] } })""")
            chk(st["subs"] == ["rel", "checkin", "alimentacao", "treinos", "diario"] and st["mids"] == [True, True] and st["defs"] == [["saude", "alimentacao", "Saúde física"], ["saude", "treinos", "Saúde física"]] and st["keys"] and st["icons"],
                f"Saúde ganha Alimentação e Treinos; Nutri e Personal registrados como agentes da página, com a Saúde física como portão ({st['subs']})")
            e = st["ex"]
            chk(e["log"] > 50 and e["ses"] >= 15 and e["cor"] >= 10 and e["plano"] and e["fichas"] == ["Superior", "Inferior"] and e["pend"] == [1, 1], f"exemplo fictício completo: refeições, sessões, corridas, plano de corrida, fichas e uma proposta esperando em cada agente ({e})")
            # roteamento: #mentor.nutri leva para a Alimentação
            await pg.evaluate("location.hash = 'mentor.personal'"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("[PAGE, SUB]") == ["saude", "treinos"], "#mentor.personal abre Saúde › Treinos")

            # ---------------- contas da alimentação
            M = await pg.evaluate("(() => { const d = nuD(), M = nuMetas(); return { pf: d.perfil, mt: d.meta, peso: nuPesoAtual(), M, hoje: TODAY }; })()")
            pf, mt, hoje = M["pf"], M["mt"], M["hoje"]
            py = calc(pf["sexo"], int(pf["nasc"]), float(pf["altura"]), pf["atividade"], M["peso"], mt["objetivo"], mt["modo"], mt["foco"], int(hoje[:4]))
            js = M["M"]
            chk(all(near(js[k], py[k], 1e-6) for k in ("bmr", "tdee", "imc", "ref")) and all(js[k] == py[k] for k in ("kcal", "prot", "gord", "carb", "piso", "pisoAplicado")),
                f"metas do exemplo batem com o Python: TMB {py['bmr']:.1f}, gasto {py['tdee']:.1f}, {py['kcal']} kcal, P {py['prot']} · C {py['carb']} · G {py['gord']} (piso {py['piso']})")
            casos = [["F", 1990, 160, "sedentario", 45, "perder", "alto", "saude"], ["F", 1990, 165, "sedentario", 60, "perder", "alto", "saude"], ["M", 1985, 175, "intenso", 70, "ganhar", "alto", "shape"], ["M", 1980, 170, "leve", 110, "perder", "medio", "qualidade"], ["F", 2000, 158, "moderado", 52, "manter", "baixo", "energia"]]
            jsC = await pg.evaluate("cs => cs.map(([s, n, a, at, p, o, m, f]) => nuCalc({ sexo: s, nasc: String(n), altura: String(a), atividade: at }, { objetivo: o, modo: m, foco: f }, p, {}, TODAY))", casos)
            dif = []
            for c, j in zip(casos, jsC):
                q = calc(c[0], c[1], c[2], c[3], c[4], c[5], c[6], c[7], int(hoje[:4]))
                if not (j["obj"] == q["obj"] and all(j[k] == q[k] for k in ("kcal", "prot", "gord", "carb", "piso", "pisoAplicado"))): dif.append((c, {k: (j.get(k), q[k]) for k in ("obj", "kcal", "prot", "gord", "carb", "piso")}))
            chk(not dif, f"5 perfis conferidos (IMC baixo vira manter, piso aplicado, superávit limitado, peso de referência com IMC > 30) ({dif[:1]})")
            chk(jsC[0]["obj"] == "manter" and any("18,5" in a for a in jsC[0]["avisos"]) and jsC[1]["pisoAplicado"] and jsC[1]["kcal"] >= jsC[1]["bmr"] - 5, "IMC abaixo de 18,5 nunca recebe déficit (com aviso) e as calorias nunca ficam abaixo da TMB")
            T = await pg.evaluate("(() => { const P = nuPesos(28, TODAY); return { P, tr: nuTendencia(), G: nuGastoReal(), tot: nuTotais(addDays(TODAY, -28), addDays(TODAY, -1)) }; })()")
            P = [(x["d"], x["kg"]) for x in T["P"]]; kgSem = regress(P)
            chk(T["tr"] and near(T["tr"]["kgSem"], kgSem, 1e-9) and T["tr"]["n"] == len(P), f"tendência do peso: regressão de {len(P)} pesagens em 28 dias = {kgSem:+.3f} kg/semana, igual ao Python")
            dias = [x for x in T["tot"] if x["n"] > 0]; gr = sum(x["kcal"] for x in dias) / len(dias) - kgSem * 7700 / 7
            chk(len(dias) >= 14 and T["G"] and near(T["G"]["tdee"], gr, 1e-6), f"gasto pelos dados: média registrada − tendência × 7.700/7 = {gr:.0f} kcal ({len(dias)} dias)")
            pv = await pg.evaluate("""['almoço: 150 g arroz, 100 g feijão, 2 ovos e 1 fatia de pão integral, xyz', 'meia banana', '1 kg de batata', '200 ml de leite', 'café: 2 cafezinhos', 'cena: pizza + 1 birra'].map(t => { const r = nuParse(t); return { ref: r.ref, it: r.itens.map(x => [x.f.id, x.qtd]), un: r.desconhecidos }; })""")
            chk(pv[0] == {"ref": "almoco", "it": [["arroz", 150], ["feijao", 100], ["ovo", 100], ["paoi", 25]], "un": ["xyz"]} and pv[1]["it"] == [["banana", 45]] and pv[2]["it"] == [["batata", 1000]] and pv[3]["it"] == [["leite", 200]] and pv[4] == {"ref": "cafe", "it": [["cafe", 60]], "un": []} and pv[5]["ref"] == "jantar" and pv[5]["it"] == [["pizza", 300], ["cerveja", 330]],
                f"registro por texto: refeição, gramas, quilos, ml, unidades da porção, “meia”, italiano e o que não reconheceu ({pv[0]}, {pv[5]})")

            # ---------------- registrar pela tela: texto, água, peso
            base = await pg.evaluate("Object.fromEntries(NU_BASE.map(x => [x[0], x.slice(2, 6)]))")
            n0 = await pg.evaluate("S.nutriLog.filter(x => x.data === TODAY).length")
            await pg.evaluate("location.hash = 'saude.alimentacao'"); await pg.wait_for_timeout(400)
            await pg.click('[data-nuv="dia"]'); await pg.wait_for_timeout(150)
            await pg.fill("#nu_q", "jantar: 150 g arroz, 100 g feijão e 2 ovos"); await pg.wait_for_timeout(100)
            hint = await pg.inner_text("#nu_hint")
            await pg.press("#nu_q", "Enter"); await pg.wait_for_timeout(250)
            novos = await pg.evaluate(f"S.nutriLog.filter(x => x.data === TODAY).slice({n0}).map(x => [x.base, x.ref, x.qtd, x.kcal, x.p, x.c, x.f])")
            r1 = lambda v: jr(v * 10) / 10
            esp = [[k, "jantar", g, jr(base[k][0] * g / 100), r1(base[k][1] * g / 100), r1(base[k][2] * g / 100), r1(base[k][3] * g / 100)] for k, g in [("arroz", 150), ("feijao", 100), ("ovo", 100)]]
            chk("Arroz branco cozido 150 g" in hint and novos == esp, f"“jantar: 150 g arroz, 100 g feijão e 2 ovos” entra com os valores da base ({novos})")
            a0 = await pg.evaluate("nuD().agua[TODAY] || 0")
            await pg.click('[data-nuagua="250"]'); await pg.click('[data-nuagua="500"]'); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("nuD().agua[TODAY]") == a0 + 750, "água: +250 e +500 ml somam no dia")
            await pg.click('[data-nuv="peso"]'); await pg.wait_for_timeout(150)
            await pg.fill("#nu_peso", "79.4"); await pg.click('[data-act="nupeso"]'); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.saude[TODAY].peso") == 79.4, "o peso registrado na Alimentação vai para o check-in do dia")
            for v in ["semana", "plano", "alimentos", "dia"]:
                await pg.click(f'[data-nuv="{v}"]'); await pg.wait_for_timeout(120)
            chk(not errs, f"as cinco telas da Alimentação abrem sem erro ({errs[:2]})")

            # ---------------- o Nutri com ferramentas
            await ask(pg, "Comi pizza no jantar. Revise as minhas metas?")
            R = await pg.evaluate("""(() => { const c = mget('nutri').conversa, m = c.at(-1), calls = window.__calls; const t = n => calls.filter(x => x.kind === 'tool' && x.name === n).at(-1)?.r;
              return { acoes: (m.acoes || []).map(p => [p.tipo, p.status, p.erro]), tools: calls.filter(x => x.kind === 'sample').at(-1).tools, cons: t('consultar_alimentacao'), tend: t('tendencia_peso'), busca: t('buscar_alimento'), bad: t('metas_bad'), ok1: t('refeicao_ok'), trein: t('nu_treinos'), prompt: window.__nuPrompt || '', piso: nuMetas().piso }; })()""")
            chk(len(R["tools"]) == 10 and {"salvar_memoria", "recado", "registrar_refeicao", "ajustar_metas", "definir_objetivo", "consultar_treinos"} <= set(R["tools"]), f"o Nutri leva 10 ferramentas, as dele mais memória e recado ({R['tools']})")
            chk([a[:2] for a in R["acoes"]] == [["ajustar_metas", "descartada"], ["registrar_refeicao", "pendente"], ["ajustar_metas", "pendente"]] and "piso" in R["acoes"][0][2] and "piso" in (R["bad"] or {}).get("erro", ""),
                f"1.100 kcal é recusado pela validação (abaixo do piso) e o agente recebe o motivo; refeição e metas válidas ficam esperando ({R['acoes']})")
            pw = await pg.evaluate("Object.entries(S.saude).filter(([d, e]) => d >= addDays(TODAY, -29) && d <= TODAY && isNum(e.peso) && +e.peso > 0).map(([d, e]) => [d, +e.peso]).sort()")
            u = pw[-1][0]; ult = [kg for d, kg in pw if d > add(u, -7)]; atual = jr(sum(ult) / len(ult) * 10) / 10
            chk(len(R["cons"]) == 7 and R["tend"]["atual_kg"] == atual and R["busca"][0]["nome"] == "Pizza margherita" and isinstance(R["trein"], list) and len(R["trein"]) > 0,
                "ferramentas de leitura: 7 dias de totais, o peso de hoje, a base de alimentos e os treinos do Personal")
            chk("LINHAS VERMELHAS" in R["prompt"] and f"{R['piso']} kcal para esta pessoa" in R["prompt"] and "Foco: Esportivo" in R["prompt"] and "TREINOS (do Personal)" in R["prompt"], "o prompt do Nutri traz o foco, o compromisso, o piso desta pessoa e o resumo dos treinos")
            await ask(pg, "ok")
            A = await pg.evaluate("""(() => { const it = S.nutriLog.filter(x => x.fonte === 'nutri' && x.data === TODAY); return { st: mget('nutri').conversa.at(-3).acoes.map(p => p.status), it: it.map(x => [x.nome, x.qtd, x.kcal, !!x.est]), man: nuD().manual, M: nuMetas().kcal, last: mget('nutri').conversa.at(-1).content, pend: sdPendentes('nutri').length }; })()""")
            chk(A["st"] == ["descartada", "aceita", "aceita"] and A["it"] == [["Pizza margherita", 300, jr(266 * 3), False], ["Tiramisù da cantina", 120, 360, True]] and A["man"] == {"kcal": 2200, "prot": 160, "carb": 255, "gord": 62} and A["M"] == 2200,
                f"“ok” aprova as pendentes sem chamar a IA: o jantar entra (base e estimativa) e as metas à mão passam a valer ({A['it']}, {A['man']})")
            chk(A["last"].startswith("Aprovados") and "Jantar" in A["last"] and A["pend"] == 1, f"a resposta local lista o que entrou; a proposta do exemplo continua esperando ({A['last'][:80]})")

            # ---------------- contas dos treinos
            U = await pg.evaluate("""(() => { const keep = S; S = EMPTY(); VER++;
              try { const r = {}, fx = { ex: 'supino', nome: 'Supino reto com barra', series: 3, reps: '8-12', carga: 60 }, log = (d, ss, ex = 'supino') => { S.treinoLog.push({ id: uid(), data: d, nome: 'A', itens: [{ ex, nome: trEx(ex).nome, series: ss.map(([reps, kg]) => ({ reps, kg })) }] }); VER++; };
                r.novo = trProx({ ...fx, carga: '' }).acao; r.ini = trProx(fx).kg;
                log(addDays(TODAY, -3), [[12, 60], [12, 60], [12, 60]]); r.sobe = [trProx(fx).acao, trProx(fx).kg];
                S.treinoLog = []; VER++; log(addDays(TODAY, -6), [[8, 60], [7, 60], [6, 60]]); log(addDays(TODAY, -3), [[8, 60], [7, 60], [7, 60]]); r.desce = [trProx(fx).acao, trProx(fx).kg];
                S.treinoLog = []; VER++; log(addDays(TODAY, -3), [[12, 60], [11, 60], [10, 60]]); r.mant = [trProx(fx).acao, trProx(fx).kg];
                const ag = { ex: 'agach', nome: 'Agachamento livre com barra', series: 2, reps: '5', carga: 50 };
                S.treinoLog = []; VER++; log(addDays(TODAY, -2), [[5, 50], [5, 50]], 'agach'); r.ag50 = trProx(ag).kg;
                S.treinoLog = []; VER++; log(addDays(TODAY, -2), [[5, 100], [5, 100]], 'agach'); r.ag100 = trProx(ag).kg;
                S.treinoLog = [{ id: 'v', data: TODAY, itens: [{ ex: 'supino', nome: 'x', series: [1, 2, 3, 4].map(() => ({ reps: 8, kg: 50 })) }, { ex: '', nome: 'Inventado', g: 'biceps', series: [{ reps: 10, kg: 10 }, { reps: 0, kg: 10 }] }] }]; VER++;
                r.vol = trVolume(TODAY, TODAY); r.e1 = [trE1(100, 5), trE1(100, 1), trE1(100, 13)];
                r.rg = ['8-12', '8–12', '10', '12-8', 'x'].map(trRange); r.tp = ['25:30', '1:05:00', '45', '1:75', ''].map(v => { const t = trParseTempo(v); return t == null ? null : Number.isNaN(t) ? 'NaN' : t; });
                r.match = ['Supino', 'agachamento livre', 'puxada frontal', 'rosca martelo', 'leg press 45', 'stacco rumeno', 'yoga'].map(x => trExMatch(x)?.id || null);
                return r; } finally { S = keep; VER++; } })()""")
            chk(U["novo"] == "novo" and U["ini"] == 60 and U["sobe"] == ["subir", 62.5] and U["desce"] == ["reduzir", 55] and U["mant"] == ["manter", 60] and U["ag50"] == 52.5 and U["ag100"] == 105,
                f"progressão dupla: topo da faixa em todas as séries sobe um degrau (2,5 kg; 5 kg no agachamento a partir de 60 kg), duas sessões abaixo da faixa reduzem 10%, o resto mantém ({U['sobe']}, {U['desce']}, {U['ag50']}, {U['ag100']})")
            chk(U["vol"]["peito"] == 4 and U["vol"]["triceps"] == 2 and U["vol"]["ombros"] == 2 and U["vol"]["biceps"] == 1 and near(U["e1"][0], 100 * (1 + 5 / 30)) and U["e1"][1] == 100 and U["e1"][2] is None,
                "volume: grupo principal conta 1 e secundário 0,5 (série com 0 repetição não conta); Epley só até 12 repetições")
            chk(U["rg"] == [[8, 12], [8, 12], [10, 10], None, None] and U["tp"] == [25.5, 65, 45, "NaN", None] and U["match"] == ["supino", "agach", "puxada", "roscam", "legpress", "stiff", None],
                f"faixas, tempos (mm:ss, h:mm:ss, minutos) e nomes de exercício em português, inglês e italiano ({U['match']})")
            C = await pg.evaluate("({ C: S.corridas.map(c => ({ data: c.data, km: c.km, min: c.min, tipo: c.tipo })), A: trAcwr(), R: trRiegel(), hoje: TODAY })")
            cor, hoje = C["C"], C["hoje"]; ag = km_entre(cor, add(hoje, -6), hoje); cr = km_entre(cor, add(hoje, -27), hoje) / 4
            chk(C["A"] and near(C["A"]["r"], ag / cr, 1e-9) and near(C["A"]["ag"], ag) and near(C["A"]["cr"], cr), f"carga aguda:crônica = {ag:.1f} km em 7 dias ÷ {cr:.2f} km/semana em 28 dias = {ag / cr:.2f}")
            c90 = [c for c in cor if add(hoje, -89) <= c["data"] <= hoje and c["km"] >= 3 and c["min"] > 0]; pvs = [c for c in c90 if c["tipo"] == "prova"]; bs = pvs or [c for c in c90 if c["data"] >= add(hoje, -59)]
            ref = min(bs, key=lambda c: c["min"] * (10 / c["km"]) ** 1.06); prev = [ref["min"] * (d / ref["km"]) ** 1.06 for d in (5, 10, 21.0975, 42.195)]
            chk(C["R"] and C["R"]["deProva"] == bool(pvs) and all(near(x["min"], y, 1e-9) for x, y in zip(C["R"]["alvo"], prev)), f"Riegel a partir da prova de {ref['km']} km em {ref['min']} min: 10 km em {prev[1]:.2f} min, igual ao Python")

            # ---------------- regras do plano de corrida
            V = await pg.evaluate("""(() => { const keep = S; S = EMPTY(); VER++;
              try { const ini = addDays(weekStart(TODAY), 7); for (let k = 1; k <= 28; k += 7) S.corridas.push({ id: uid(), data: addDays(ini, -k), km: 10, min: 60, tipo: 'leve' }); VER++;
                const P = n => ({ nivel: n }), sem = (...t) => t.map(km => ({ sessoes: [{ dia: 'ter', tipo: 'leve', km: km / 2 }, { dia: 'dom', tipo: 'longo', km: km / 2 }] })), v = (s, n = 'intermediario', o = {}) => trValidaPlano({ objetivo: 'teste', inicio: ini, semanas: s, ...o }, P(n));
                return { base: trKm(addDays(ini, -28), addDays(ini, -1)) / 4, ok: v(sem(12, 13, 14.5, 12, 15)).erro || 'ok', s1: v(sem(13)).erro, inc: v(sem(12, 14.5)).erro, seg: v(sem(11, 12, 13, 14, 15)).erro,
                  forte: v([{ sessoes: [{ dia: 'ter', tipo: 'intervalado', km: 4 }, { dia: 'qui', tipo: 'tempo', km: 4 }, { dia: 'dom', tipo: 'longo', km: 4 }] }], 'iniciante').erro,
                  cinco: v([{ sessoes: ['seg', 'ter', 'qua', 'qui', 'sex'].map(d => ({ dia: d, tipo: 'leve', km: 2 })) }], 'iniciante').erro, dup: v([{ sessoes: [{ dia: 'ter', tipo: 'leve', km: 3 }, { dia: 'terça', tipo: 'leve', km: 3 }] }]).erro,
                  passado: v(sem(10), 'intermediario', { inicio: addDays(TODAY, -30) }).erro, prova: v(sem(10), 'intermediario', { prova: addDays(TODAY, 400) }).erro,
                  gen: ['5', '10', '21', 'base'].map(o => [o, ...[3, 4].map(d => { const g = trGerarPlano({ obj: o, semanas: o === '21' ? 16 : 12, dias: d }, P('intermediario')); return g.erro ? { erro: g.erro } : g.dados; })]),
                  genIni: trGerarPlano({ obj: '5', semanas: 8, dias: 4 }, P('iniciante')).dados, gen21c: trGerarPlano({ obj: '21', semanas: 4, dias: 3 }, P('intermediario')) }; } finally { S = keep; VER++; } })()""")
            chk(near(V["base"], 10) and V["ok"] == "ok" and "semana 1" in (V["s1"] or "") and "máximo seguro é 12" in V["s1"], f"semana 1: até o maior de 10% ou 2 km sobre a média das 4 semanas antes do plano (10 km → 12 km) ({V['s1']})")
            chk("semana 2" in (V["inc"] or "") and "3 semanas seguidas" in (V["seg"] or "") and "sessões fortes" in (V["forte"] or "") and "máximo para o nível iniciante é 4" in (V["cinco"] or "") and "duas corridas" in (V["dup"] or "") and "já passou" in (V["passado"] or "") and "prova" in (V["prova"] or ""),
                "o plano recusa: aumento acima de 10%/2 km, 4 semanas seguidas de aumento, 2 sessões fortes para iniciante, 5 corridas para iniciante, dia repetido, início no passado e prova fora do plano")
            gerados = [(o, i, g) for o, *gs in V["gen"] for i, g in enumerate(gs)] + [("5-ini", 0, V["genIni"])]
            falhas = []
            for o, i, g in gerados:
                if "erro" in g: falhas.append((o, i, g["erro"])); continue
                r = valida_plano(g["semanas"], 10, "iniciante" if o == "5-ini" else "intermediario")
                if r: falhas.append((o, i, r))
            prova_ok = all(g["semanas"][-1]["sessoes"][-1]["tipo"] == "prova" and g["prova"] == add(g["inicio"], 7 * len(g["semanas"]) - 1) for o, i, g in gerados if o in ("5", "10", "21") and "erro" not in g)
            chk(not falhas and prova_ok and "erro" in V["gen21c"] and "mais semanas" in V["gen21c"]["erro"], f"o plano básico (5, 10, 21 km e base; 3 e 4 corridas; iniciante) passa nas regras reescritas em Python, termina na prova, e meia maratona em 4 semanas é recusada ({falhas[:2]})")
            ini5 = V["genIni"]; fortes_ini = [sum(1 for x in s["sessoes"] if x["tipo"] in FORTE) for s in ini5["semanas"]]
            chk(max(fortes_ini) <= 1 and all(fortes_ini[w] == 0 for w in range(3)) and all(len(s["sessoes"]) == 3 for s in ini5["semanas"]), f"iniciante: 3 corridas por semana mesmo pedindo 4, qualidade só depois das semanas de adaptação ({fortes_ini})")

            # ---------------- treino série a série, check-in e recordes
            await pg.evaluate("location.hash = 'saude.treinos'"); await pg.wait_for_timeout(400)
            await pg.click('[data-trv="fichas"]'); await pg.wait_for_timeout(150)
            fsup = await pg.evaluate("S.treino.fichas.find(f => f.nome === 'Superior').id")
            sug = await pg.evaluate(f"S.treino.fichas.find(f => f.id === '{fsup}').exs.map(x => trProx(x))")
            await pg.click(f'[data-trtreinar="{fsup}"]'); await pg.wait_for_timeout(250)
            dr = await pg.evaluate("(() => { const D = trDraft(); return { n: D.itens.length, kg: D.itens.map(it => it.series.map(z => z.kg)), sets: D.itens.map(it => it.series.length), ls: !!localStorage.getItem('atlas_sd_trdraft') }; })()")
            chk(dr["n"] == 7 and dr["kg"] == [[s["kg"]] * n for s, n in zip(sug, dr["sets"])] and dr["ls"], "Treinar abre o treino com as cargas sugeridas pela progressão e guarda o rascunho no aparelho")
            await pg.evaluate("""document.querySelectorAll('[data-trs$="|reps"]').forEach((el, k) => { el.value = String(10 - (k % 3)); el.dispatchEvent(new Event('input', { bubbles: true })); });
              const d = document.querySelector('[data-trh="dur"]'); d.value = '55'; d.dispatchEvent(new Event('input', { bubbles: true }));""")
            await pg.click('[data-trtimer]'); await pg.wait_for_timeout(300)
            tm = await pg.evaluate("[!!document.querySelector('#trtimer'), document.querySelector('#trtimer b')?.textContent]")
            await pg.click('[data-act="trtimerx"]'); await pg.wait_for_timeout(100)
            chk(tm[0] and ":" in (tm[1] or "") and not await pg.evaluate("!!document.querySelector('#trtimer')"), f"relógio de descanso abre ao lado da série e fecha ({tm[1]})")
            s0 = await pg.evaluate("[S.treinoLog.length, S.saude[TODAY]?.treino || null]")
            await pg.click('[data-act="trsalvar"]'); await pg.wait_for_timeout(300)
            G = await pg.evaluate("(() => { const s = S.treinoLog.at(-1); return { n: S.treinoLog.length, data: s.data, nome: s.nome, dur: s.dur, it: s.itens.length, reps: s.itens[0].series.map(z => z.reps), sd: S.saude[TODAY], draft: trDraft(), ls: localStorage.getItem('atlas_sd_trdraft') }; })()")
            chk(G["n"] == s0[0] + 1 and G["data"] == hoje and G["nome"] == "Superior" and G["dur"] == 55 and G["it"] == 7 and G["reps"] == [10, 9, 8, 10] and G["draft"] is None and not G["ls"], f"Salvar treino grava a sessão com as séries feitas e limpa o rascunho ({G['reps']})")
            chk(s0[1] is None and G["sd"].get("treino") == "Musculação" and G["sd"].get("min") == 55 and G["sd"].get("trAuto") == "Musculação|55", f"o treino preenche o check-in do dia ({G['sd']})")
            # check-in preenchido à mão não é sobrescrito
            man = await pg.evaluate("""(() => { const d = addDays(TODAY, -40); S.saude[d] = { ...(S.saude[d] || {}), treino: 'Yoga / alongamento', min: 30 }; delete S.saude[d].trAuto;
              trAplica('registrar_corrida', { data: d, km: 5, min: 30, tipo: 'leve', fc: '', rpe: '', obs: '' }, 'voce'); const r = [S.saude[d].treino, S.saude[d].min];
              const c = S.corridas.at(-1); S.corridas.pop(); trSyncDia(d); return [r, S.saude[d].treino]; })()""")
            chk(man == [["Yoga / alongamento", 30], "Yoga / alongamento"], "check-in preenchido à mão fica como está quando entra (ou sai) uma corrida no dia")

            # ---------------- corrida pela tela
            await pg.click('[data-trv="corrida"]'); await pg.wait_for_timeout(200)
            await pg.fill("#trc_km", "5"); await pg.fill("#trc_tempo", "27:30"); await pg.wait_for_timeout(80)
            hint = await pg.inner_text("#trc_hint")
            await pg.click('[data-act="trcsalvar"]'); await pg.wait_for_timeout(250)
            c = await pg.evaluate("(() => { const c = S.corridas.at(-1); return [c.data, c.km, c.min, c.tipo, S.saude[TODAY].treino, S.saude[TODAY].min]; })()")
            chk(hint == "ritmo 5:30/km" and c == [hoje, 5, 27.5, "leve", "Musculação", 83], f"corrida de 5 km em 27:30: ritmo 5:30/km, e o check-in soma 55 + 27,5 min com o tipo da maior ({c})")
            await pg.fill("#trc_km", "10"); await pg.fill("#trc_tempo", "20:00"); await pg.click('[data-act="trcsalvar"]'); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.corridas.at(-1).km") == 5, "10 km em 20 min (2:00/km) é recusado como implausível")
            await pg.evaluate("document.querySelector('[data-trcdel]').click()"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[S.saude[TODAY].treino, S.saude[TODAY].min]") == ["Musculação", 55], "apagar a corrida devolve o check-in só com a academia")

            # ---------------- ficha à mão, modelo e plano básico
            await pg.click('[data-trv="fichas"]'); await pg.wait_for_timeout(150)
            await pg.click('[data-act="trnova"]'); await pg.wait_for_timeout(200)
            await pg.fill("#trf_nome", "Teste A")
            await pg.evaluate("""(() => { const rs = document.querySelectorAll('#trf_rows .trfrow'); const put = (r, cl, v) => { r.querySelector(cl).value = v; };
              put(rs[0], '.trf_ex', 'Leg press 45°'); put(rs[0], '.trf_s', '3'); put(rs[0], '.trf_r', '10 - 12'); put(rs[0], '.trf_c', '120');
              put(rs[1], '.trf_ex', 'Sprint na bike'); put(rs[1], '.trf_s', '4'); put(rs[1], '.trf_r', 'abc'); put(rs[2], '.trf_ex', ''); })()""")
            await pg.click("#trfok"); await pg.wait_for_timeout(150)
            msg = await pg.inner_text("#trf_msg")
            await pg.evaluate("document.querySelectorAll('#trf_rows .trfrow')[1].querySelector('.trf_r').value = '6'"); await pg.click("#trfok"); await pg.wait_for_timeout(250)
            F = await pg.evaluate("(() => { const f = S.treino.fichas.find(x => x.nome === 'Teste A'); return f && f.exs.map(x => [x.ex, x.nome, x.series, x.reps, x.carga, x.desc, x.g]); })()")
            chk("Sprint na bike" in msg and F == [["legpress", "Leg press 45°", 3, "10-12", 120, 120, "quadriceps"], ["", "Sprint na bike", 4, "6", "", 90, ""]], f"ficha à mão: repetição inválida é apontada e a ficha só entra corrigida; nome livre vale ({F})")
            await pg.click('[data-trmodelo="Superior"]'); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("S.treino.fichas.filter(f => f.nome.startsWith('Superior')).map(f => f.nome)") == ["Superior", "Superior (2)"], "modelo pronto não apaga a ficha de mesmo nome: vira “Superior (2)”")
            await pg.click('[data-trv="corrida"]'); await pg.wait_for_timeout(150)
            await pg.click('[data-act="trpldel"]'); await pg.wait_for_timeout(150)
            await pg.select_option("#trg_obj", "10"); await pg.fill("#trg_sem", "8"); await pg.select_option("#trg_dias", "3"); await pg.click('[data-act="trgerar"]'); await pg.wait_for_timeout(250)
            pl = await pg.evaluate("(() => { const p = S.treino.planoCorrida, ini = p.inicio; return { p, base: trKm(addDays(ini, -28), addDays(ini, -1)) / 4, nivel: S.treino.perfil.nivel }; })()")
            chk(pl["p"]["inicio"] == add(wstart(hoje), 7) and len(pl["p"]["semanas"]) == 8 and valida_plano(pl["p"]["semanas"], pl["base"], pl["nivel"]) is None and pl["p"]["semanas"][-1]["sessoes"][-1] == {"dia": "dom", "tipo": "prova", "km": 10, "obs": "aquecer 10 min antes; boa prova!"},
                f"Gerar plano: 10 km em 8 semanas começando na próxima segunda, dentro das regras, com a prova no último domingo ({[round(sum(x['km'] for x in s['sessoes']), 1) for s in pl['p']['semanas']]})")
            for v in ["progresso", "registrar", "fichas", "perfil"]:
                await pg.click(f'[data-trv="{v}"]'); await pg.wait_for_timeout(120)
            await pg.select_option("#trp_nivel", "avancado"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("S.treino.perfil.nivel") == "avancado" and not errs, f"as cinco telas dos Treinos abrem sem erro e o perfil grava ({errs[:2]})")
            await pg.select_option("#trp_nivel", "intermediario"); await pg.wait_for_timeout(100)

            # ---------------- o Personal com ferramentas
            await ask(pg, "Posso subir o supino? Corri 6,2 km hoje.")
            Q = await pg.evaluate("""(() => { const m = mget('personal').conversa.at(-1), calls = window.__calls, t = n => calls.filter(x => x.kind === 'tool' && x.name === n).at(-1)?.r;
              return { acoes: (m.acoes || []).map(p => [p.tipo, p.status, p.erro, p.id]), mi: mget('personal').conversa.length - 1, tools: calls.filter(x => x.kind === 'sample').at(-1).tools, prog: t('progresso_exercicio'), vol: t('volume_semanal'), lis: t('listar_exercicios'), b1: t('ficha_bad'), b2: t('plano_bad'), prompt: window.__trPrompt || '' }; })()""")
            chk(len(Q["tools"]) == 10 and {"criar_ficha", "registrar_treino", "registrar_corrida", "planejar_corrida", "salvar_memoria", "recado"} <= set(Q["tools"]), f"o Personal leva 10 ferramentas ({Q['tools']})")
            chk([a[:2] for a in Q["acoes"]] == [["criar_ficha", "descartada"], ["planejar_corrida", "descartada"], ["criar_ficha", "pendente"], ["registrar_corrida", "pendente"]] and "10%" in Q["acoes"][0][2] and "semana 1" in Q["acoes"][1][2],
                f"carga de 200 kg no supino (mais de 10% acima do recorde) e 30 km na 1ª semana são recusados; ficha e corrida válidas esperam ({[a[:3] for a in Q['acoes'][:2]]})")
            chk(Q["prog"]["proxima"] and Q["prog"]["maior_carga_kg"] >= 60 and Q["vol"]["faixa_series_por_grupo"] == [10, 15] and len(Q["vol"]["semanas"]) == 2 and all(x["grupo"] == "gluteos" or "gluteos" in x["secundarios"] for x in Q["lis"]) and len(Q["lis"]) >= 4,
                "leitura: histórico do supino com a próxima carga, volume de 2 semanas com a faixa do compromisso e a biblioteca filtrada por glúteos")
            chk("ombro direito" in Q["prompt"] and "LINHAS VERMELHAS" in Q["prompt"] and "Compromisso: Médio" in Q["prompt"] and "ALIMENTAÇÃO (do Nutri)" in Q["prompt"] and "2200 kcal" in Q["prompt"], "o prompt do Personal traz as limitações, as regras, o compromisso e as metas do Nutri (já com as 2.200 kcal aprovadas)")
            pid = Q["acoes"][2][3]
            await pg.click(f'[data-prop="personal|{Q["mi"]}|{pid}|ok"]'); await pg.wait_for_timeout(250)
            ff = await pg.evaluate("(() => { const f = S.treino.fichas.find(x => x.nome === 'Glúteos e core (teste)'); return f && [f.origem, f.exs.map(x => [x.ex, x.series, x.reps, x.carga, x.desc])]; })()")
            chk(ff == ["Personal", [["hipthrust", 4, "8-12", 60, 120], ["bulgaro", 3, "8-12", 12, 120], ["prancha", 3, "30-45", "", 75]]], f"Aprovar pelo botão cria a ficha do Personal ({ff})")
            await ask(pg, "ok")
            K = await pg.evaluate("(() => { const c = S.corridas.at(-1); return [c.km, Math.round(c.min * 100) / 100, c.tipo, c.fonte, S.saude[TODAY].treino, S.saude[TODAY].min, sdPendentes('personal').length]; })()")
            chk(K == [6.2, 36.17, "leve", "personal", "Musculação", 91, 1], f"“ok” registra a corrida (36:10) e o check-in passa a 55 + 36 min; a ficha de viagem do exemplo continua esperando ({K})")
            await pg.evaluate("undo()"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[S.corridas.some(c => c.km === 6.2), S.saude[TODAY].min]") == [False, 55], "desfazer tira a corrida e devolve o check-in")
            await pg.evaluate("redo()"); await pg.wait_for_timeout(150)

            # ---------------- cruzamentos e mentores
            Z = await pg.evaluate("""(() => { const L = metricList(), g = k => L.find(m => m.k === k), Dd = DAILY(), i = Dd.idx[TODAY], s28 = Dd.dates.map((d, j) => d >= addDays(TODAY, -27) ? Dd.C.km[j] : 0).reduce((a, b) => a + (b || 0), 0);
              return { m: ['km', 'kcal', 'prot'].map(k => g(k) && [g(k).grp, metricArea(k)]), fam: [czRel('kcal', 'prot'), czRel('km', 'min'), czRel('km', 'kcal'), czRel('prot', 'energia')], kcal: Dd.C.kcal[i], km28: s28, nada: Dd.C.kcal[Dd.idx[addDays(TODAY, -400)]] ?? null,
                areas: CZ_AREAS.map(a => a[0]).includes('Alimentação'), hoje: S.nutriLog.filter(x => x.data === TODAY).reduce((a, x) => a + x.kcal, 0) }; })()""")
            km28 = km_entre(await pg.evaluate("S.corridas"), add(hoje, -27), hoje)
            chk(Z["m"] == [["Corpo", "Saúde física"], ["Alimentação", "Saúde física"], ["Alimentação", "Saúde física"]] and Z["fam"] == [True, True, False, False] and Z["areas"], "Cruzamentos: km, calorias e proteína entram como métricas da Saúde física; calorias × proteína e km × minutos são parte e todo")
            chk(Z["kcal"] == Z["hoje"] and near(Z["km28"], km28, 1e-6) and Z["nada"] is None, f"série diária: calorias do dia = soma do registro; km somados batem com as corridas; dia sem registro de comida fica vazio, não zero ({Z['kcal']} kcal)")
            await pg.evaluate("location.hash = 'mentores'"); await pg.wait_for_timeout(400)
            mc = await pg.evaluate("[...document.querySelectorAll('.jmc')].filter(a => /saude\\./.test(a.getAttribute('href'))).map(a => [a.getAttribute('href'), a.querySelector('.nb')?.textContent || ''])")
            chk(mc == [["#saude.alimentacao", "1"], ["#saude.treinos", "1"]], f"Mentores: Nutri e Personal com as propostas esperando ({mc})")

            # ---------------- privacidade
            await pg.evaluate("S.priv.semIA = ['Saúde física']; touch('priv'); location.hash = 'saude.alimentacao'"); await pg.wait_for_timeout(400)
            n = await pg.evaluate("window.__calls.filter(x => x.kind === 'sample').length")
            pr = await pg.evaluate("[!!document.querySelector('.sdchat .banner.warn'), document.querySelector('#m_in').disabled, (askMentor('nutri', 'oi'), 0)]")
            await pg.wait_for_timeout(300)
            chk(pr[0] and pr[1] and await pg.evaluate("window.__calls.filter(x => x.kind === 'sample').length") == n, "com a Saúde física fora da IA, o Nutri mostra o cadeado, o campo fica desligado e nada é enviado")
            await pg.evaluate("S.priv.semIA = []; touch('priv')")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()

        # ---------------- sem ferramentas: as propostas vêm no bloco atlas
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="saude.alimentacao", cfg={"noTools": True})
        try:
            await pg.wait_for_timeout(900)
            await ask(pg, "Lanchei uma banana")
            F = await pg.evaluate("(() => { const m = mget('nutri').conversa.at(-1); return { acoes: (m.acoes || []).map(p => [p.tipo, p.status, (p.erro || '').slice(0, 40)]), mem: mget('nutri').mem.some(x => /Fallback do Nutri/.test(x.texto)), txt: m.content }; })()")
            chk([a[:2] for a in F["acoes"]] == [["registrar_refeicao", "pendente"], ["ajustar_metas", "descartada"]] and "piso" in F["acoes"][1][2] and F["mem"] and "```" not in F["txt"],
                f"sem ferramentas, o bloco atlas vira propostas validadas do mesmo jeito (900 kcal recusado) e memória ({F['acoes']})")
            chk(not errs, f"sem erros sem ferramentas ({errs[:2]})")
        finally:
            await b.close()

        # ---------------- celular
        b, pg, errs = await open_page(p, w=390, h=844, hash_="saude.alimentacao")
        try:
            await pg.wait_for_timeout(900)
            res = []
            for h, segs in [("saude.alimentacao", ["dia", "semana", "peso", "plano", "alimentos"]), ("saude.treinos", ["fichas", "registrar", "corrida", "progresso", "perfil"])]:
                await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(350)
                for v in segs:
                    await pg.evaluate(f"document.querySelector('[data-{'nuv' if 'alim' in h else 'trv'}=\"{v}\"]').click()"); await pg.wait_for_timeout(150)
                    sw, iw = await overflow(pg); res.append((h, v, sw <= iw))
            chat = await pg.evaluate("sdChatOn('nutri')")
            await pg.evaluate("location.hash = 'saude.alimentacao'"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('[data-act=\"sdchat\"][data-mid=\"nutri\"]').click()"); await pg.wait_for_timeout(300)
            pos = await pg.evaluate("(() => { const a = document.querySelector('.sdside'), m = document.querySelector('.sdmain'); return a && m ? a.getBoundingClientRect().top < m.getBoundingClientRect().top : null; })()")
            sw, iw = await overflow(pg)
            chk(all(x[2] for x in res) and sw <= iw, f"celular: as dez telas sem rolagem lateral ({[x[:2] for x in res if not x[2]]})")
            chk(chat is False and pos is True, "celular: o painel do agente começa fechado e, aberto, aparece antes do conteúdo")
            chk(not errs, f"sem erros no celular ({errs[:2]})")
        finally:
            await b.close()
    print(f"{ok} ok, {bad} falhas")

asyncio.run(main())
