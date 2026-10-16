"""Atlas 4 · IAs com acesso aos dados no detalhe. Dados de exemplo (fictícios).
O Mentor do Dinheiro recebe todos os lançamentos, linha por linha, além dos totais; todo mentor recebe os registros da própria
área e a ferramenta ler_dados (no fim da lista; se a visualização limita o número de ferramentas, ocupa a última vaga); o
Secretário, as falas do Conselho e as IAs de tarefa única recebem o catálogo e a ferramenta. ler_dados: catálogo, linhas,
paginação, período, busca, campo, soma por mês e por campo, conjuntos em JSON. Privacidade: setor sem IA, entrada #privado e
campos de setor privado nos check-ins ficam de fora. Tamanho: nenhum pedido passa de 256 KB."""
import asyncio, json, re
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

LAST = "window.__calls.filter(c => c.kind === 'sample').at(-1)"
INP = f"(() => {{ const c = {LAST}; return Array.isArray(c.input) ? c.input.map(t => t.content).join('\\n') : c.input; }})()"

async def mentor_dinheiro(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="mentor.fin")
    try:
        await pg.wait_for_timeout(800)
        n = await pg.evaluate("S.lanc.length")
        await pg.evaluate("window.__ldArgs = [{ conjunto: 'lanc', agrupar: 'mes', somar: 'valor', campo: 'tipo', valor: 'Despesa' }]")
        await pg.evaluate("askMentor('fin', 'TESTE LER DADOS: quanto gastei por mês?')"); await pg.wait_for_timeout(900)
        c = await pg.evaluate(f"(() => {{ const c = {LAST}; return {{ tools: c.tools, first: c.input[0].content }}; }})()")
        P = c["first"]
        sec = P.split("### Lançamentos:")[1].split("\n\n")[0] if "### Lançamentos:" in P else ""
        linhas = [l for l in sec.split("\n")[2:] if l.strip()]
        chk("DADOS COMPLETOS DA SUA ÁREA" in P and len(linhas) == n, f"o Mentor do Dinheiro recebe todos os lançamentos, um por linha ({len(linhas)} de {n})")
        chk(sec.split("\n")[1].startswith("data|tipo|cat|desc|valor"), f"com data, tipo, categoria, descrição e valor ({sec.split(chr(10))[1][:60]})")
        mais_recente = await pg.evaluate("[...S.lanc].sort((a, b) => b.data.localeCompare(a.data))[0].data")
        chk(linhas[0].startswith(mais_recente), "do mais recente para o mais antigo")
        chk(all(f"### {x}" in P for x in ["Orçamento por categoria", "Assinaturas"]) and "Taxa de poupança" in P, "também o orçamento e as assinaturas, e os resumos de antes continuam")
        chk(c["tools"][-1] == "ler_dados" and c["tools"][0] == "salvar_memoria", f"ler_dados entra no fim, sem tirar as ferramentas do mentor ({c['tools']})")
        out = await pg.evaluate("window.__ldOut[0]")
        esperado = await pg.evaluate("(() => { const g = {}; for (const l of S.lanc) if (l.tipo === 'Despesa') g[l.data.slice(0, 7)] = (g[l.data.slice(0, 7)] || 0) + l.valor; return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0])).map(([k, v]) => k + '|' + Math.round(v * 100) / 100); })()")
        got = [l.rsplit("|", 1)[0] for l in out.split("\n")[2:]]
        chk(got == esperado, f"ler_dados soma as despesas por mês igual à conta direta ({got[:2]} × {esperado[:2]})")
        uso = await pg.evaluate("mget('fin').conversa.at(-1).uso.map(u => u.t)")
        chk("ler_dados" in uso, "a conversa mostra que o mentor leu os dados")
        log = await pg.evaluate("S.auditoria[0]")
        chk("Finanças" in log["areas"] and any("ler_dados" in f for f in log["ferr"]), "o registro de leitura da IA (Privacidade) anota a área e a consulta")
        chk(await pg.evaluate(f"new TextEncoder().encode({INP}).length") < 262144, "o pedido fica abaixo de 256 KB")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def todos(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="mentores")
    try:
        await pg.wait_for_timeout(800)
        r = await pg.evaluate("""(() => { TOOLS_MAX = 8; const out = {};
          for (const mid of MIDS) { if (blockedMentor(mid)) continue; const live = { uso: [], acoes: [], ctx: aiCtx('x') };
            const tools = mentorTools(mid, live).map(t => t.name), base = mentorPrompt(mid, false), extra = iadPromptMentor(mid, false, 150000);
            out[mid] = { last: tools.at(-1), has: tools.includes('ler_dados'), n: tools.length, bytes: new TextEncoder().encode(base + extra).length, completos: extra.includes('DADOS COMPLETOS'), mine: iadMine(mid).length }; }
          return out; })()""")
        chk(all(v["has"] and v["last"] == "ler_dados" for v in r.values()), f"todos os {len(r)} mentores têm ler_dados, na última vaga quando o limite é 8 ({[k for k, v in r.items() if v['last'] != 'ler_dados']})")
        chk(all(v["n"] <= 8 for v in r.values()), "nenhum passa do limite de ferramentas")
        com = [k for k, v in r.items() if v["completos"]]; sem = [k for k, v in r.items() if v["mine"] and not v["completos"]]
        chk(len(com) >= 20 and "fin" in com and "fis" in com and "men" in com and "nutri" in com and "personal" in com and "ck" in com, f"os mentores das áreas recebem os dados completos delas ({len(com)}: {com[:8]}…; sem dados ainda: {sem})")
        mx = max(v["bytes"] for v in r.values())
        chk(mx < 250000, f"o maior pedido de mentor fica abaixo de 256 KB ({mx} bytes)")
        # Secretário
        r2 = await pg.evaluate("(() => { const live = { uso: [], acoes: [], conflitos: [], ctx: aiCtx('s') }; return [secTools(live).map(t => t.name), secPrompt().includes('Dados do Atlas que você pode ler:') && secPrompt().includes('lanc (Lançamentos')]; })()")
        chk(r2[0][-1] == "ler_dados" and r2[0][:2] == ["ver_aba", "consultar_mentor"] and r2[1], f"o Secretário tem ler_dados (no fim) e o catálogo ({r2[0]})")
        # limite apertado: a ordem de cada agente é a prioridade; ler_dados fica com a última vaga
        r3 = await pg.evaluate("""(() => { const mk = () => ({ uso: [], acoes: [], conflitos: [], ctx: aiCtx('x') }); TOOLS_MAX = 3; const a = mentorTools('fin', mk()).map(t => t.name), ck = mentorTools('ck', mk()).map(t => t.name);
          TOOLS_MAX = 10; const nu = mentorTools('nutri', mk()).map(t => t.name), ck10 = mentorTools('ck', mk()).map(t => t.name); TOOLS_MAX = 8; return { a, ck, nu, ck10 }; })()""")
        chk(r3["a"] == ["salvar_memoria", "atualizar_plano", "ler_dados"] and r3["ck"] == ["listar_tarefas", "criar_tarefa", "ler_dados"], f"com limite 3, ficam as duas primeiras do agente e ler_dados ({r3['a']}, {r3['ck']})")
        chk(len(r3["nu"]) == 10 and "consultar_treinos" not in r3["nu"] and "recado" in r3["nu"] and r3["ck10"][:4] == ["listar_tarefas", "criar_tarefa", "atualizar_tarefa", "registrar_risco"] and r3["ck10"][-1] == "ler_dados",
            f"com limite 10, o Nutri cede consultar_treinos (ler_dados lê os treinos) e o PMO mantém a ordem da configuração ({r3['nu'][-3:]}, {r3['ck10']})")
        r4 = await pg.evaluate("""(() => { const s = [...S.treinoLog].sort((a, b) => b.data.localeCompare(a.data))[0], j = JSON.stringify(s.itens).replace(/\\|/g, '/'); return { len: j.length, ok: iadPromptMentor('personal', false, 150000).includes(j) }; })()""")
        chk(r4["ok"] and r4["len"] > 400, f"dados aninhados vão inteiros: os exercícios e séries do último treino ({r4['len']} caracteres) chegam completos ao Personal")
        r5 = await pg.evaluate("(() => { const f = iadPromptMentor('fin', true, 150000), t = iadPromptMentor('fin', false, 150000); return [f.includes('não vêm neste pedido') && !f.includes('pode ler todos') && !f.includes('ler_dados'), t.includes('pode ler todos') && t.includes('Não narre a consulta'), iadNota().includes('Não narre a consulta')]; })()")
        chk(r5 == [True, True, True], f"sem ferramentas, o pedido não promete leitura que não existe; com ferramentas, a IA não narra a consulta (a resposta final não leva “vou consultar os dados”) ({r5})")
        # IAs de tarefa única: dados: true
        await pg.evaluate("aiCall('Teste', () => 'TAREFA: TESTE', { dados: true }).catch(() => {})"); await pg.wait_for_timeout(200)
        c = await pg.evaluate(f"(() => {{ const c = {LAST}; return [c.tools, c.input.includes('DADOS DO ATLAS'), c.cache]; }})()")
        chk(c == [["ler_dados"], True, False], f"com dados: true, a IA recebe o catálogo e a ferramenta ({c})")
        await pg.evaluate("TOOLS_MAX = 0; aiCall('Teste', () => 'TAREFA: TESTE 2', { dados: true }).catch(() => {})"); await pg.wait_for_timeout(200)
        c = await pg.evaluate(f"(() => {{ const c = {LAST}; return [c.tools, c.input.includes('DADOS DO ATLAS')]; }})()")
        chk(c == [[], False], f"sem ferramentas na visualização, o pedido segue como antes ({c})")
        src = await pg.evaluate("[...document.scripts].map(s => s.textContent).join('')")
        for nome in ["csMentorPrompt(mid, pergunta), { dados: true", "aiCall(`Mentor · ${trunc(p.nome, 40)}`, build, { dados: true", 'aiCall("Fechamento semanal", build, { dados: true', 'aiCall("Leitura do diário", build, { dados: true',
                     'aiCall("Bússola moral", build, { dados: true', 'aiCall("Círculo dos mentores", build, { dados: true', 'aiCall("Lentes sobre um dilema", build, { dados: true']:
            chk(nome in src, f"ligado: {nome.split('(')[0] if 'csMentor' in nome else nome.split(',')[0]}")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def consultas(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="visao")
    try:
        await pg.wait_for_timeout(800)
        q = lambda a: pg.evaluate("a => { try { return iadQuery(a, aiCtx('t')); } catch (e) { return 'ERRO: ' + e.message; } }", a)
        cat = await q({})
        chk(cat.startswith("Catálogo") and "lanc (Lançamentos" in cat and "auditoria" not in cat and "priv " not in cat and "mentores (" not in cat, "catálogo com os conjuntos, sem os registros internos (auditoria, cofre, conversas)")
        r = await q({"conjunto": "lanc"}); n = await pg.evaluate("S.lanc.length")
        chk(f"Lançamentos: {n} registros" in r and f"mostrando {min(n, 300)}" in r and len(r.splitlines()) == min(n, 300) + 2, f"linhas: todas até 300 por vez, com o total ({r.splitlines()[0][:90]})")
        r1 = await q({"conjunto": "lanc", "limite": 100})
        chk("mostrando 100" in r1 and f"faltam {n - 100}: use pular=100" in r1, "com limite, diz quantas faltam e como continuar")
        r2 = await q({"conjunto": "lanc", "pular": 100, "limite": 5})
        chk("a partir do 101º" in r2 and len(r2.splitlines()) == 7, "paginação com pular e limite")
        mk = await pg.evaluate("mkey(TODAY)")
        r3 = await q({"conjunto": "lanc", "de": mk + "-01", "ate": mk + "-31"})
        nm = await pg.evaluate(f"S.lanc.filter(l => l.data.startsWith('{mk}')).length")
        chk(f"{nm} registros" in r3.splitlines()[0], f"filtro por período ({nm} no mês)")
        r4 = await q({"conjunto": "lanc", "agrupar": "cat", "somar": "valor", "campo": "tipo", "valor": "Despesa"})
        top = r4.splitlines()[2].split("|")
        esperado = await pg.evaluate("(() => { const g = {}; for (const l of S.lanc) if (l.tipo === 'Despesa') g[l.cat] = (g[l.cat] || 0) + l.valor; const [k, v] = Object.entries(g).sort((a, b) => b[1] - a[1])[0]; return [k, String(Math.round(v * 100) / 100)]; })()")
        chk(top[:2] == esperado, f"soma por categoria, maior primeiro ({top[:2]} × {esperado})")
        desc = await pg.evaluate("S.lanc.find(l => l.desc && l.desc.length > 4).desc")
        r5 = await q({"conjunto": "lanc", "busca": desc[:6]})
        chk(desc[:6].lower() in r5.lower() and "registros" in r5, f"busca por texto (“{desc[:6]}”)")
        r6 = await q({"conjunto": "orc"})
        chk(r6.startswith("{") and len(r6) > 10, "conjunto que é objeto (orçamento) vem em JSON")
        r7 = await q({"conjunto": "saude:fis", "limite": 3})
        chk("sono" in r7.splitlines()[1] and "humor" not in r7.splitlines()[1], f"check-ins só do corpo: sem humor ({r7.splitlines()[1]})")
        r8 = await q({"conjunto": "Lançamentos", "limite": 1})
        chk("Lançamentos:" in r8, "aceita o nome do conjunto além da chave")
        r9 = await q({"conjunto": "nada"})
        chk(r9.startswith("ERRO: Conjunto desconhecido"), "conjunto inexistente: erro claro")
        big = await q({"conjunto": "diario", "limite": 2000})
        chk(len(big.encode()) <= 31000, f"cada resposta cabe nos 32 KB da ferramenta ({len(big.encode())} bytes)")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def privacidade(p):
    b, pg, errs = await open_page(p, w=1440, h=1000, hash_="visao")
    try:
        await pg.wait_for_timeout(800)
        await pg.evaluate("S.diario.push({ id: 'priv1', data: TODAY, titulo: '', texto: 'Segredo TESTE-PRIVADO #privado', humor: 3, aplicados: [] }); S.priv.semIA = ['Finanças']; VER++")
        q = lambda a: pg.evaluate("a => { try { return iadQuery(a, aiCtx('t')); } catch (e) { return 'ERRO: ' + e.message; } }", a)
        chk((await q({"conjunto": "lanc"})).startswith("ERRO: A pessoa deixou esse setor fora da IA"), "setor sem IA (Finanças): ler_dados recusa")
        cat = await q({})
        chk("lanc (" not in cat and "orc (" not in cat and "assin (" not in cat, "e o catálogo nem cita os conjuntos desse setor")
        chk("TESTE-PRIVADO" not in await q({"conjunto": "diario", "limite": 2000}), "entrada #privado do diário não sai")
        r = await pg.evaluate("iadPromptMentor('men', false, 150000)")
        chk("TESTE-PRIVADO" not in r and "DADOS COMPLETOS" in r, "nem nos dados completos do Mentor da Mente")
        await pg.evaluate("S.priv.semIA = ['Saúde mental']; VER++")
        r2 = await q({"conjunto": "saude", "limite": 3})
        chk("humor" not in r2.splitlines()[1] and "sono" in r2.splitlines()[1], "Saúde mental sem IA: os check-ins saem sem humor, energia e estresse")
        chk(not errs, f"sem erros ({errs[:2]})")
    finally:
        await b.close()

async def main():
    async with async_playwright() as p:
        for n, f in (("Mentor do Dinheiro", mentor_dinheiro), ("todos os mentores e as outras IAs", todos), ("ler_dados", consultas), ("privacidade", privacidade)):
            print(f"== {n}")
            try: await f(p)
            except Exception as e: chk(False, f"{n}: exceção {e!r}"[:400])
    print(f"{ok} ok, {bad} falhas")
asyncio.run(main())
