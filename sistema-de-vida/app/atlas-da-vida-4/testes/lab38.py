"""Atlas 4 · modo exemplo: desligar devolve só os seus dados, sem sobra do exemplo, e o exemplo nunca é gravado.
Os "seus dados" aqui são um conjunto fictício próprio (30 lançamentos "item rN"), diferente do exemplo.
Casos: dois toques com gravação pendente; toque no meio de uma gravação em andamento; duplo toque no Desligar e no botão;
IA respondendo; dados ainda abrindo; atualização de outro aparelho durante o exemplo; rascunhos, textos da IA e aviso do
Secretário; contagem de uso pendente não segura a troca; varredura das telas depois de desligar."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
L = lambda i, v=10: {"id": "r" + str(i), "data": "2026-10-0" + str(1 + i % 8), "tipo": "Despesa", "cat": "Mercado", "desc": "item r" + str(i), "valor": v, "conta": "C"}
D = lambda i: {"id": "d" + str(i), "data": "2026-10-0" + str(i), "hora": "21:00", "titulo": "Dia real " + str(i), "texto": "Texto do meu diário real número " + str(i), "humor": 4, "aplicados": []}
SEED = {U + "s_lanc": {"v": [L(i) for i in range(1, 31)], "at": 1, "r": "R0"}, U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"},
        U + "s_diario": {"v": [D(1), D(2)], "at": 1, "r": "D0"}, U + "s__rev": {"lanc": "R0", "cfg": "C0", "diario": "D0"}}
REAL = "({ n: S.lanc.length, r1: S.lanc.some(l => l.desc === 'item r1'), ex: EX_MODE })"
DBLANC = f"(window.__store['{U}s_lanc']?.v || [])"
TOAST = "document.querySelector('#toast')?.innerText || ''"
SLOW = """(() => { const c = STORE.col, d0 = c.doc.bind(c); c.doc = id => { const r = d0(id), g = r.get.bind(r); r.get = async () => { await new Promise(ok => setTimeout(ok, 500)); return g(); }; return r; }; })()"""

async def abre(p, hash_="fin.lanc", w=1280):
    b, pg, errs = await open_page(p, w=w, h=900, hash_=hash_, cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    await pg.wait_for_timeout(700)
    return b, pg, errs

async def corridas(p):
    b, pg, errs = await abre(p)
    try:
        chk(await pg.evaluate(REAL) == {"n": 30, "r1": True, "ex": False}, "abre com os 30 lançamentos fictícios “seus”")
        # A) dois toques seguidos com uma gravação pendente
        await pg.evaluate("S.lanc[0].desc = 'item r1'; S.cfg.nome = 'Teste 2'; touch('cfg', { noRender: true }); exToggle(); exToggle();")
        await pg.wait_for_timeout(1300)
        r = await pg.evaluate("({ ex: EX_MODE, real: EX_REAL?.S?.lanc?.length, tela: S.lanc.length })")
        chk(r["ex"] and r["real"] == 30 and r["tela"] != 30, f"dois toques com gravação pendente: liga uma vez só e os seus dados ficam guardados intactos ({r})")
        await pg.evaluate("exToggle()"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate(REAL) == {"n": 30, "r1": True, "ex": False}, "desligar devolve os 30 lançamentos")
        # B) toque no meio de uma gravação em andamento (a gravação lê S depois de esperar a rede)
        await pg.evaluate(SLOW)
        await pg.evaluate("S.lanc.push({ id: 'r31', data: '2026-10-09', tipo: 'Despesa', cat: 'Mercado', desc: 'item r31', valor: 5, conta: 'C' }); touch('lanc', { noRender: true })")
        await pg.wait_for_timeout(1300)
        await pg.evaluate("touch('lanc', { noRender: true }); S.lanc.push({ id: 'r32', data: '2026-10-09', tipo: 'Despesa', cat: 'Mercado', desc: 'item r32', valor: 5, conta: 'C' }); touch('lanc', { noRender: true })")
        await pg.wait_for_timeout(760)
        st = await pg.evaluate("({ fl: !!FLUSHING, dirty: [...dirty] })")
        await pg.evaluate("exToggle()"); await pg.wait_for_timeout(60)
        bt = await pg.evaluate("(() => { const b = document.querySelector('.exbtn'); return { busy: b.classList.contains('busy'), txt: b.innerText.trim(), ex: EX_MODE }; })()")
        chk(st["fl"] and bt["busy"] and bt["txt"] == "Ligando…" and not bt["ex"], f"no meio de uma gravação, o botão mostra “Ligando…” e espera ({st}, {bt})")
        await pg.wait_for_timeout(2500)
        db = await pg.evaluate(f"({{ n: {DBLANC}.length, ex: {DBLANC}.filter(l => !/^item r\\d+$/.test(l.desc)).length, modo: EX_MODE }})")
        chk(db == {"n": 32, "ex": 0, "modo": True}, f"a gravação termina com os seus 32 lançamentos e nenhum do exemplo no banco; só depois o exemplo liga ({db})")
        await pg.wait_for_timeout(1100); await pg.evaluate("exToggle()"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("S.lanc.length") == 32, "desligar devolve os 32")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def toques(p):
    b, pg, errs = await abre(p)
    try:
        await pg.click(".exbtn"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("EX_MODE"), "o botão liga o exemplo")
        await pg.dblclick("[data-act=exoff]"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate(REAL) == {"n": 30, "r1": True, "ex": False}, "duplo toque em “Desligar o exemplo” desliga e fica desligado")
        await pg.wait_for_timeout(1100)
        await pg.dblclick(".exbtn"); await pg.wait_for_timeout(400)
        chk(await pg.evaluate("EX_MODE"), "duplo toque no botão do topo liga uma vez só (não liga e desliga)")
        await pg.wait_for_timeout(1100); await pg.click(".exbtn"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate(REAL) == {"n": 30, "r1": True, "ex": False}, "um toque depois de 1 s desliga (a trava é de 0,7 s)")
        # IA respondendo e dados abrindo
        await pg.wait_for_timeout(1100)
        await pg.evaluate("AI_VIVO = 1; exToggle()"); await pg.wait_for_timeout(200)
        chk(not await pg.evaluate("EX_MODE") and "Espere a IA terminar" in await pg.evaluate(TOAST), "com a IA respondendo, não troca e explica por quê")
        await pg.evaluate("AI_VIVO = 0; LOADED = false; exToggle()"); await pg.wait_for_timeout(200)
        chk(not await pg.evaluate("EX_MODE") and "terminarem de abrir" in await pg.evaluate(TOAST), "com os dados ainda abrindo, também não")
        await pg.evaluate("LOADED = true")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def remoto(p):
    b, pg, errs = await abre(p, hash_="diario")
    try:
        await pg.evaluate("exToggle()"); await pg.wait_for_timeout(300)
        await pg.evaluate("""(async () => { const v = [...EX_REAL.S.diario, { id: 'remoto1', data: TODAY, hora: '22:00', titulo: 'Do outro aparelho', texto: 'Escrito no celular durante o exemplo', humor: 3, aplicados: [] }];
          await STORE.col.doc('s_diario').set({ v, at: Date.now(), r: 'RX1' }); await STORE.col.doc('s__rev').update({ diario: 'RX1' }); })()""")
        await pg.wait_for_timeout(900)
        r = await pg.evaluate("({ ex: S.diario.some(e => e.id === 'remoto1'), fila: PULL.has('diario') })")
        chk(not r["ex"] and r["fila"], f"o que outro aparelho grava durante o exemplo não entra no exemplo: fica na fila ({r})")
        await pg.wait_for_timeout(700); await pg.evaluate("exToggle()"); await pg.wait_for_timeout(900)
        r = await pg.evaluate("({ real: S.diario.some(e => e.id === 'remoto1'), n: S.diario.length, rev: REV.diario })")
        chk(r == {"real": True, "n": 3, "rev": "RX1"}, f"ao desligar, entra nos seus dados ({r})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def tela(p):
    b, pg, errs = await abre(p, hash_="diario")
    try:
        await pg.evaluate("""DIA.draft = { data: TODAY, titulo: '', texto: 'rascunho real', humor: null }; storeDraft(); TRV.draft = { nome: 'treino real', itens: [] }; trDraftSave();
          DIA.ai = { text: 'leitura real' }; SEC.nudge = null;""")
        await pg.wait_for_timeout(600)
        await pg.evaluate("exToggle()"); await pg.wait_for_timeout(300)
        r = await pg.evaluate("({ d: DIA.draft, t: TRV.draft, ai: DIA.ai })")
        chk(r == {"d": None, "t": None, "ai": None}, f"ao ligar, o exemplo abre sem os seus rascunhos e textos da IA ({r})")
        await pg.evaluate("""DIA.draft = { data: TODAY, titulo: '', texto: 'rascunho do exemplo', humor: null }; storeDraft(); TRV.draft = { nome: 'Superior A (exemplo)', itens: [] }; trDraftSave();
          DIA.ai = { text: 'leitura do exemplo' }; SEC.nudge = { txt: '14 coisas pedem atenção', at: Date.now() }; CH.ai = { '2026-01-01': { titulo: 'Capítulo do exemplo' } };""")
        await pg.wait_for_timeout(600)
        disco = await pg.evaluate("[JSON.parse(localStorage.getItem('atlas_draft')).texto, JSON.parse(localStorage.getItem('atlas_sd_trdraft')).nome]")
        chk(disco == ["rascunho real", "treino real"], f"rascunhos do exemplo não são gravados no aparelho ({disco})")
        await pg.wait_for_timeout(500); await pg.evaluate("exToggle()"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("({ d: DIA.draft?.texto, t: TRV.draft?.nome, ai: DIA.ai?.text, n: SEC.nudge, ch: Object.keys(CH.ai).length })")
        chk(r == {"d": "rascunho real", "t": "treino real", "ai": "leitura real", "n": None, "ch": 0}, f"ao desligar, voltam os seus rascunhos e textos; os do exemplo e o aviso “14 coisas” somem ({r})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def uso(p):
    b, pg, errs = await abre(p)
    try:
        r = await pg.evaluate("(() => { usoConta('r', 'fin'); const d0 = [...dirty]; exToggle(); return { d0, ex: EX_MODE, pend: EX_REAL?.pend }; })()")
        chk(r["d0"] == ["uso"] and r["ex"] and r["pend"] == ["uso"], f"só a contagem de uso pendente: o exemplo liga na hora, sem esperar gravação ({r})")
        await pg.wait_for_timeout(1100); await pg.evaluate("exToggle()"); await pg.wait_for_timeout(1600)
        g = await pg.evaluate(f"window.__store['{U}s_uso']?.v?.r?.fin || 0")
        chk(g >= 1, f"e a contagem é gravada depois de desligar ({g})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def varre(p):
    b, pg, errs = await abre(p, hash_="visao", w=1440)
    try:
        toks = await pg.evaluate("""(() => { const real = JSON.stringify(S), out = new Set(), walk = v => { if (typeof v === 'string') { const s = v.trim(); if (s.length >= 14 && !/^\\d|^#|^http|^data:/.test(s) && !real.includes(s)) out.add(s.slice(0, 50)); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
          const E = exampleData(); for (const k of ['lanc', 'diario', 'tarefas', 'metas', 'pessoas', 'habitos', 'rotina', 'eventos', 'aprend', 'lazer', 'projetos', 'treinoLog', 'nutriLog', 'ckTar', 'contatos', 'capitulos']) walk(E[k]); return [...out]; })()""")
        pages = ["visao", "hoje", "fin.lanc", "diario", "saude.treinos", "saude.alimentacao", "metas.tarefas", "pessoas.lista", "rotina.semana", "trabalho.lista", "cresc.aprend", "capitulos", "jornada.jardim", "painel"]
        SCAN = "toks => { const m = document.querySelector('#main').cloneNode(true); m.querySelectorAll('.banner').forEach(x => x.remove()); const T = m.innerText + (document.querySelector('#sec, .secw')?.innerText || ''); return toks.filter(t => T.includes(t)).slice(0, 4); }"
        antes = {}
        for h in pages:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(150); antes[h] = await pg.evaluate(SCAN, toks)
        for h in pages:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(150)
            await pg.evaluate("exToggle()"); await pg.wait_for_timeout(250); await pg.wait_for_timeout(900); await pg.evaluate("exToggle()"); await pg.wait_for_timeout(250); await pg.wait_for_timeout(900)
        sobra = {}
        for h in pages:
            await pg.evaluate(f"location.hash = '{h}'"); await pg.wait_for_timeout(150)
            x = await pg.evaluate(SCAN, toks)
            if x != antes[h]: sobra[h] = x
        chk(len(toks) > 200 and not sobra and not await pg.evaluate("EX_MODE"), f"ligar e desligar em {len(pages)} telas não deixa nenhum dos {len(toks)} textos do exemplo ({sobra})")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("corridas e gravação", corridas), ("toques, IA e abertura", toques), ("outro aparelho", remoto), ("rascunhos e textos", tela), ("contagem de uso", uso), ("telas", varre)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
