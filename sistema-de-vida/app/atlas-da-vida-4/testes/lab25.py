"""Dashboard do Cockpit (2/2): a sub-aba é a primeira da barra e o Cockpit continua abrindo no Hoje (#trabalho.metricas vai
para o Dashboard); os 21 widgets desenham; o drill-down leva à aba certa com exatamente os itens do número (KPIs e um número
de cada widget, em todas as abas de destino); filtros e período valem para todos os widgets e ficam na sessão; o layout
(ordem e ocultos) persiste no banco; o modo reunião mostra uma seção por vez (← → Esc); o Exemplo funciona sem gravar nada;
os insights do PMO viram propostas que “ok” aprova; o relatório do período abre preenchido em italiano com os mesmos números;
estados vazios apontam para a aba de cadastro; sem rolagem horizontal no celular; e 1000 tarefas desenham rápido."""
import asyncio, json, re
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

PREF = {"riscos": "R", "problemas": "P", "log": "E", "decisoes": "D", "entregas": "EL", "bim": "B", "reunioes": "M", "licoes": "L"}
KEYS = {"tar": "ckTar", "risk": "ckRisk", "iss": "ckIss", "log": "ckLog", "dec": "ckDec", "el": "ckEl", "bim": "ckBim", "meet": "ckMeet", "lic": "ckLic"}
SEE = """(view) => { const m = document.querySelector('.ckmain').cloneNode(true); m.querySelector('.ckdrill')?.remove();
  if (view === 'lista') return [...m.querySelectorAll('tr[data-cktask]')].map(x => x.dataset.cktask);
  if (view === 'gantt') return [...m.querySelectorAll('g[data-cktask]')].map(x => x.dataset.cktask);
  const pre = { riscos: 'R', problemas: 'P', log: 'E', decisoes: 'D', entregas: 'EL', bim: 'B', reunioes: 'M', licoes: 'L' }[view];
  document.body.appendChild(m); const txt = m.innerText; m.remove(); return [...new Set(txt.match(new RegExp('\\\\b' + pre + '\\\\d+\\\\b', 'g')) || [])]; }"""

async def drill_check(pg, sel, i):
    """clica no i-ésimo elemento de drill que casa com sel e confere o destino; devolve (ok, detalhe)"""
    info = await pg.evaluate("""([sel, i]) => { const el = [...document.querySelectorAll(sel)][i]; if (!el) return null; const d = CK_DR[el.dataset.ckdrill]; const K = { tar: 'ckTar', risk: 'ckRisk', iss: 'ckIss', log: 'ckLog', dec: 'ckDec', el: 'ckEl', bim: 'ckBim', meet: 'ckMeet', lic: 'ckLic' };
      const its = K[d.kind] ? ckA(K[d.kind]).filter(x => d.ids.includes(x.id)) : []; el.scrollIntoView(); return { view: d.view, kind: d.kind, label: d.label, ids: d.ids, codes: its.map(x => x.cod), pessoa: d.extra.pessoa || null }; }""", [sel, i])
    if not info: return False, f"sem elemento {sel}[{i}]"
    await pg.evaluate("([sel, i]) => [...document.querySelectorAll(sel)][i].dispatchEvent(new MouseEvent('click', { bubbles: true }))", [sel, i]); await pg.wait_for_timeout(260)
    sub = await pg.evaluate("SUB")
    if info["view"] == "pessoa":
        okp = sub == "pessoa" and await pg.evaluate("CK.pessoa") == info["pessoa"]
        return okp, f"{info['label']} → {sub}"
    seen = await pg.evaluate(SEE, info["view"])
    exp = sorted(info["ids"]) if info["view"] in ("lista", "gantt") else sorted(info["codes"])
    chip = await pg.evaluate("!!document.querySelector('.ckmain .ckdrill')")
    return sub == info["view"] and sorted(seen) == exp and chip, f"{info['label']} → {sub}: {len(seen)} de {len(exp)}{'' if sorted(seen) == exp else f' (viu {sorted(seen)[:6]} esperava {exp[:6]})'}"

async def main():
    async with async_playwright() as p:
        b, pg, errs = await open_page(p, w=1440, h=1000, hash_="trabalho")
        try:
            await pg.wait_for_timeout(1000)
            r = await pg.evaluate("[SUB, [...document.querySelectorAll('.subtabs a')].map(a => a.getAttribute('href'))[0], SUBS.trabalho.some(s => s[0] === 'metricas')]")
            chk(r == ["hoje", "#trabalho.dashboard", False], f"o Cockpit abre no Hoje e o Dashboard é a primeira sub-aba; Métricas saiu ({r})")
            await pg.evaluate("location.hash = 'trabalho.metricas'"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("[PAGE, SUB, !!document.querySelector('[data-vid=\"ckw-kpis\"]')]") == ["trabalho", "dashboard", True], "o link antigo de Métricas vai para o Dashboard")
            w = await pg.evaluate("""({ n: document.querySelectorAll('.ckw').length, err: [...document.querySelectorAll('.ckw')].filter(x => /Não deu para calcular/.test(x.textContent)).length, secs: [...document.querySelectorAll('.ckdsec')].map(x => x.textContent), tabs: [...document.querySelectorAll('.ckw')].filter(x => x.querySelector('[data-vt], .va button')).length })""")
            chk(w["n"] == 21 and w["err"] == 0 and len(w["secs"]) == 7, f"21 widgets em 7 seções, nenhum com erro ({w})")
            # tabela e CSV: cada widget com gráfico tem a versão em tabela (mesma fonte)
            tb = await pg.evaluate("(() => { const ids = ['kpis','burnup','status','fluxo','esforco','marcos','carga','comp','heat','matriz','problemas','clash','funil','diario','agenda']; return ids.filter(id => !(VIS['ckw-' + id]?.o.table && VIS['ckw-' + id].o.table().rows.length >= 0)); })()")
            chk(tb == [], f"os widgets de números têm tabela e CSV ({tb})")
            # drill-down: todos os KPIs
            kp = await pg.evaluate("document.querySelectorAll('[data-vid=\"ckw-kpis\"] [data-ckdrill]').length")
            res = []
            for i in range(kp):
                await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
                res.append(await drill_check(pg, '[data-vid="ckw-kpis"] [data-ckdrill]', i))
            chk(kp >= 8 and all(x[0] for x in res), f"cada KPI abre a aba certa com exatamente os itens do número ({[x[1] for x in res]})")
            # um número de cada widget (e todas as abas de destino)
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
            wids = await pg.evaluate("[...document.querySelectorAll('.ckw')].map(x => x.dataset.vid).filter(v => v !== 'ckw-kpis')")
            res2 = []; views = set()
            for v in wids:
                await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
                n = await pg.evaluate(f"document.querySelectorAll('[data-vid=\"{v}\"] [data-ckdrill]').length")
                for i in sorted({0, n - 1}) if n else []:
                    await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
                    okd, det = await drill_check(pg, f'[data-vid="{v}"] [data-ckdrill]', i); res2.append((okd, f"{v}: {det}")); views.add(await pg.evaluate("SUB"))
            falhas = [d for o, d in res2 if not o]
            chk(not falhas and len(res2) >= 30, f"drill-down de {len(res2)} números de todos os widgets bate ({falhas[:4]})")
            chk({"lista", "gantt", "riscos", "problemas", "log", "entregas", "bim", "reunioes", "pessoa"} <= views, f"destinos cobertos: {sorted(views)}")
            # o chip limpa e devolve a lista inteira
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
            await pg.evaluate("document.querySelector('[data-vid=\"ckw-kpis\"] [data-ckdrill]').click()"); await pg.wait_for_timeout(300)
            n1 = await pg.evaluate("document.querySelectorAll('tr[data-cktask]').length")
            await pg.click('[data-act="ckdrillx"]'); await pg.wait_for_timeout(250)
            n2 = await pg.evaluate("[document.querySelectorAll('tr[data-cktask]').length, !!document.querySelector('.ckdrill'), ckT().filter(ckOpen).length]")
            chk(n2[0] == n2[2] and not n2[1] and n1 != n2[0], f"Limpar tira o filtro do Dashboard e volta à lista normal ({n1} → {n2})")
            # filtros: todos os widgets mudam juntos e ficam na sessão
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
            await pg.select_option("#ckd_pes", "m2"); await pg.wait_for_timeout(300)
            f1 = await pg.evaluate("""(() => { const A = ckDashAgg(), k = ckKpiJanela(ckDados(), { pes: 'm2', proj: '', tag: '' }, A.P.ini, A.P.fim, ckCtx()); return { kp: A.kpis.cur.concl, k: k.concl, eq: A.equipe.map(x => x.id), heat: A.heat.rows.map(r => r.id), pes: A.pessoas.map(x => x.id), burn: A.burnup.ids.every(id => ckT().find(t => t.id === id).resp === 'm2'), dom: document.querySelector('[data-vid="ckw-kpis"] .kmv').textContent }; })()""")
            chk(f1["kp"] == f1["k"] and f1["eq"] == ["m2"] and f1["heat"] == ["m2"] and f1["pes"] == ["m2"] and f1["burn"] and f1["dom"].startswith(str(f1["k"])), f"o filtro de pessoa vale para KPIs, equipe, heatmap, cartões e burnup ({f1})")
            await pg.select_option("#ckd_proj", "p1"); await pg.click('[data-ckdper="trimestre"]'); await pg.wait_for_timeout(300)
            await pg.reload(); await pg.wait_for_timeout(1200)
            ses = await pg.evaluate("[SUB, CK.dash?.per, CK.dash?.pes, CK.dash?.proj, document.querySelector('.ckdl')?.textContent]")
            chk(ses[:4] == ["dashboard", "trimestre", "m2", "p1"] and "trimestre" in (ses[4] or ""), f"filtros e período ficam na sessão ({ses})")
            # período: navegação e personalizado
            await pg.click('[data-ckdnav="-1"]'); await pg.wait_for_timeout(200); l1 = await pg.evaluate("document.querySelector('.ckdl').textContent")
            await pg.click('[data-ckdper="custom"]'); await pg.wait_for_timeout(200)
            await pg.fill("#ckd_ini", "2026-09-01"); await pg.dispatch_event("#ckd_ini", "change"); await pg.fill("#ckd_fim", "2026-09-30"); await pg.dispatch_event("#ckd_fim", "change"); await pg.wait_for_timeout(250)
            pc = await pg.evaluate("(() => { const P = ckDashP(); return [P.ini, P.fim, P.du, P.prev.ini, P.prev.fim, P.prev.du]; })()")
            chk(l1 != ses[4] and pc[:3] == ["2026-09-01", "2026-09-30", 22] and pc[5] == 22 and pc[4] < "2026-09-01", f"‹ › muda o período e o personalizado compara com os mesmos dias úteis imediatamente antes ({l1}; {pc})")
            await pg.click('[data-act="ckdfx"]'); await pg.click('[data-ckdper="mes"]'); await pg.click('[data-ckdnav="0"]') if await pg.evaluate("!!document.querySelector('[data-ckdnav=\"0\"]')") else None; await pg.wait_for_timeout(250)
            # insights do PMO → propostas → “ok”
            n0 = await pg.evaluate("[ckA('ckRisk').length, ckA('ckLog').length]")
            await pg.click('[data-act="ckdashins"]'); await pg.wait_for_timeout(900)
            ins = await pg.evaluate("""(() => { const I = ckD().dashIns, m = mget('ck').conversa.at(-1); return { n: I?.itens.length, li: document.querySelectorAll('.ckins > li').length, props: document.querySelectorAll('.ckins .prop, .ckins [data-prop]').length, acoes: m.acoes.map(a => [a.tipo, a.status, a.insN]), p: window.__ckInsPrompt || '' }; })()""")
            chk(ins["n"] == 4 and ins["li"] == 4 and ins["acoes"] == [["registrar_risco", "pendente", 1], ["registrar_evento", "pendente", 2], ["criar_tarefa", "descartada", 3]], f"4 insights; as ações válidas viram propostas e a inválida é descartada ({ins['acoes']})")
            pr = ins["p"]
            chk("DADOS DO PERÍODO" in pr and "ALERTAS DE HOJE (não repetir)" in pr and "pct_no_prazo_por_pessoa_semanal" in pr and "Giulia" in pr, "o prompt leva os números do período, as séries por pessoa e os alertas do Hoje para não repetir")
            await pg.fill("#m_in", "ok"); await pg.press("#m_in", "Enter"); await pg.wait_for_timeout(400)
            n1 = await pg.evaluate("[ckA('ckRisk').length, ckA('ckLog').length, ckA('ckRisk').at(-1).desc, mget('ck').conversa.find(x => x.insId)?.acoes.map(a => a.status)]")
            chk(n1[0] == n0[0] + 1 and n1[1] == n0[1] + 1 and "Sobrecarga" in n1[2], f"“ok” no chat aprova as ações dos insights ({n0} → {n1})")
            # relatório do período, preenchido e com os mesmos números
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
            await pg.select_option("#ckd_pes", "m2"); await pg.wait_for_timeout(250)
            kc = await pg.evaluate("ckDashAgg().kpis.cur.concl")
            await pg.click('[data-act="ckdashrel"]'); await pg.wait_for_timeout(400)
            rp = await pg.evaluate("[SUB, CK.rel, document.querySelector('#ck_rpdraft')?.value || '', document.querySelector('.chip')?.textContent || '']")
            chk(rp[0] == "relatorios" and rp[1] == "periodo" and "# Rapporto di periodo — dal 01/10/2026 al 31/10/2026" in rp[2] and f"Attività completate nel periodo: **{kc}**" in rp[2] and "risorsa: Giulia" in rp[2] and "Giulia" in rp[3], f"“Gerar relatório do período” abre o rascunho em italiano com o período, o filtro e os números do Dashboard ({kc}; {rp[2][:160]!r})")
            await pg.click('[data-ckger="periodo"]'); await pg.wait_for_timeout(900)
            rel = await pg.evaluate("(x => x && [x.tipo, x.lingua, /Rapporto di periodo \\(test\\)/.test(x.txt), x.periodo])(ckA('ckRel')[0])")
            gp = await pg.evaluate("window.__ckGerPrompt || ''")
            chk(rel and rel[:3] == ["periodo", "it", True] and "RAPPORTO DI PERIODO" in gp and '"pessoa":"Giulia"' in gp, f"o PMO redige o relatório do período e ele fica no histórico ({rel})")
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300); await pg.click('[data-act="ckdfx"]'); await pg.wait_for_timeout(200)
            # modo reunião
            await pg.click('[data-act="ckdmeet"]'); await pg.wait_for_timeout(300)
            m1 = await pg.evaluate("[document.body.classList.contains('ckdmeet-on'), getComputedStyle(document.querySelector('#nav')).display, document.querySelector('.ckmeeth b')?.textContent, document.querySelectorAll('.ckw').length, !!document.querySelector('.ckdf')]")
            await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(200); m2 = await pg.evaluate("document.querySelector('.ckmeeth b')?.textContent")
            for _ in range(8): await pg.keyboard.press("ArrowRight")
            await pg.wait_for_timeout(200); m3 = await pg.evaluate("document.querySelector('.ckmeeth b')?.textContent")
            await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200); m4 = await pg.evaluate("[document.body.classList.contains('ckdmeet-on'), document.querySelectorAll('.ckw').length]")
            chk(m1 == [True, "none", "Andamento", 6, False] and m2 == "Equipe" and m3 == "Insights do PMO" and m4 == [False, 21], f"modo reunião: tela limpa, uma seção por vez, → avança até a última, Esc sai ({m1} {m2} {m3} {m4})")
            chk(not errs, f"sem erros no console ({errs[:3]})")
        finally:
            await b.close()
        # layout persistente (banco) e o Exemplo sem gravar nada
        b, pg, e2 = await open_page(p, w=1440, h=1000, hash_="trabalho.dashboard", cfg={"realBoot": True})
        try:
            await pg.wait_for_timeout(900)
            vz = await pg.evaluate("[!!document.querySelector('.ckmain .ckstep'), document.querySelectorAll('.ckw').length]")
            await pg.evaluate("ckD().membros.push({ id: 'mx', nome: 'Pessoa X', nivel: 'Júnior', horas: 36, ativo: true }); ckD().projetos.push({ id: 'px', nome: 'Projeto X', ativo: true, cor: CK_CORES[0] }); ckA('ckTar').push({ id: 'tx', cod: 'T1', titulo: 'Tarefa X', projeto: 'px', resp: 'mx', prazo: addDays(TODAY, 3), esforco: 4, status: 'a fazer', feito: 0, deps: [], tags: [], criada: TODAY, hist: [] }); touch('ck', 'ckTar')")
            await pg.wait_for_timeout(300)
            em = await pg.evaluate("""[...document.querySelectorAll('.ckw .empty a')].map(a => a.getAttribute('href'))""")
            subs = await pg.evaluate("SUBS.trabalho.map(s => '#trabalho.' + s[0])")
            chk(vz == [True, 0] and len(em) >= 6 and all(h in subs for h in em) and {"#trabalho.riscos", "#trabalho.problemas", "#trabalho.bim", "#trabalho.decisoes", "#trabalho.log"} <= set(em), f"sem dados, o Dashboard mostra o começo; com pouco, cada widget vazio aponta a aba de cadastro ({sorted(set(em))})")
            await pg.click('[data-act="ckdedit"]'); await pg.wait_for_timeout(200)
            await pg.click('[data-ckwhide="heat"]'); await pg.wait_for_timeout(200)
            await pg.click('[data-ckwmv="agenda|-1"]'); await pg.wait_for_timeout(200)
            await pg.click('[data-act="ckdedit"]'); await pg.wait_for_timeout(1600)
            lay = await pg.evaluate("[ckD().cfg.dash, [...document.querySelectorAll('.ckw')].map(x => x.dataset.vid.slice(4))]")
            store = await pg.evaluate("JSON.stringify(window.__store)")
            chk("heat" not in lay[1] and lay[1].index("agenda") < lay[1].index("licoes") and lay[0]["ocultos"] == ["heat"], f"ocultar e reordenar ({lay[0]['ocultos']}, agenda antes de lições)")
        finally:
            await b.close()
        b, pg, e3 = await open_page(p, w=1440, h=1000, hash_="trabalho.dashboard", cfg={"realBoot": True, "seedStore": store})
        try:
            await pg.wait_for_timeout(1100)
            ws = await pg.evaluate("[...document.querySelectorAll('.ckw')].map(x => x.dataset.vid.slice(4))")
            chk("heat" not in ws and ws.index("agenda") < ws.index("licoes") and len(ws) == 20, f"o layout volta igual na sessão seguinte (vem do banco) ({len(ws)} widgets)")
            before = await pg.evaluate("JSON.stringify(window.__store)")
            await pg.click('[data-act="extog"]'); await pg.wait_for_timeout(900)
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(500)
            ex = await pg.evaluate("[EX_MODE, document.querySelectorAll('.ckw').length, ckT().length > 50]")
            await pg.select_option("#ckd_pes", "m1"); await pg.click('[data-act="ckdedit"]'); await pg.click('[data-ckwhide="agenda"]'); await pg.wait_for_timeout(200)
            await pg.evaluate("document.querySelector('[data-vid=\"ckw-kpis\"] [data-ckdrill]').click()"); await pg.wait_for_timeout(300)
            await pg.evaluate("location.hash = 'trabalho.dashboard'"); await pg.wait_for_timeout(300)
            await pg.click('[data-act="ckdashins"]'); await pg.wait_for_timeout(900)
            await pg.wait_for_timeout(1500)
            after = await pg.evaluate("JSON.stringify(window.__store)")
            chk(ex[0] and ex[2] and before == after, f"no Exemplo o Dashboard funciona (filtro, layout, drill, insights) e nada vai para o banco ({ex}, banco igual: {before == after})")
            chk(not e2 and not e3, f"sem erros ({(e2 + e3)[:2]})")
        finally:
            await b.close()
        # celular: sem rolagem horizontal
        b, pg, e4 = await open_page(p, w=390, h=844, hash_="trabalho.dashboard")
        try:
            await pg.wait_for_timeout(1100)
            mob = await pg.evaluate("[document.scrollingElement.scrollWidth, innerWidth, document.querySelectorAll('.ckw').length, [...document.querySelectorAll('.ckw')].filter(x => x.getBoundingClientRect().right > innerWidth + 1).map(x => x.dataset.vid)]")
            chk(mob[0] <= mob[1] + 1 and mob[2] == 21 and not mob[3], f"no celular (390 px) não há rolagem horizontal da página ({mob})")
            chk(not e4, f"sem erros ({e4[:2]})")
        finally:
            await b.close()
        # 1000 tarefas
        b, pg, e5 = await open_page(p, w=1440, h=1000, hash_="trabalho.dashboard")
        try:
            await pg.wait_for_timeout(1000)
            pf = await pg.evaluate("""(() => {
              let seed = 3; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
              const ms = ckEquipe().map(m => m.id), ps = ckD().projetos.map(p => p.id), T = ckT(), TG = ['BIM', 'Idraulica', 'Tracciato', 'Coordenação', 'Admin', 'Cliente'];
              for (let i = 0; i < 1000; i++) { const done = R() < .55, cri = addDays(TODAY, -Math.floor(R() * 180)), prazo = addDays(cri, 3 + Math.floor(R() * 40)), conc = done ? addDays(cri, 2 + Math.floor(R() * 45)) : '';
                T.push({ id: 'x' + i, cod: 'T' + (500 + i), titulo: 'Tarefa sintética ' + i, projeto: ps[i % ps.length], resp: ms[Math.floor(R() * ms.length)], prazo, esforco: 2 + Math.floor(R() * 20), feito: 0, status: done ? 'concluída' : ['a fazer', 'em andamento', 'bloqueada', 'em revisão'][Math.floor(R() * 4)], prio: 'média', impacto: 'médio', deps: [], tags: [TG[i % 6]], marco: '', criada: cri, concluida: conc && conc < TODAY ? conc : (done ? addDays(TODAY, -1) : ''), hist: done ? [{ at: Date.now() - 864e5 * 30, antes: { status: 'a fazer' }, depois: { status: 'em andamento' } }] : [] }); }
              const t = f => { const a = performance.now(); f(); return Math.round(performance.now() - a); };
              VER++; const cold = t(() => render()), warm = t(() => render());
              const dr = document.querySelector('[data-vid="ckw-kpis"] [data-ckdrill]'), n = CK_DR[dr.dataset.ckdrill].ids.length; let lst = 0; lst = t(() => { dr.click(); route(); });
              return { cold, warm, lista: lst, n, rows: document.querySelectorAll('tr[data-cktask]').length, tasks: ckT().length }; })()""")
            chk(pf["cold"] < 1500 and pf["warm"] < 400 and pf["rows"] == pf["n"], f"com {pf['tasks']} tarefas: Dashboard em {pf['cold']} ms (frio) e {pf['warm']} ms (com cache); o drill de {pf['n']} concluídas abre a Lista em {pf['lista']} ms com todas as linhas")
            chk(not e5, f"sem erros ({e5[:2]})")
        finally:
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")
if __name__ == "__main__": asyncio.run(main())
