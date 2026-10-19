"""Atlas 4 · Rotina: lista suspensa de atividades em cada meia hora da grade. Dados fictícios.
Padrão: as atividades do modelo com “Standard” no nome, cada uma com a cor fixa do modelo (a que mais aparece em minutos);
outros modelos ficam de fora. Outras: cadastradas na própria lista ou em “Atividades e cores”, com seletor de cor, num
grupo separado. Escolher preenche a faixa com a cor da atividade; encostado no mesmo bloco, ele cresce; horário ocupado
fica como está. Também: busca, teclado, Esc, clique fora, “Mais opções…”, trocar a atividade de um bloco, recolorir e
renomear as Outras (os blocos acompanham), a fonte da lista, texto rápido, semana, banco e o celular (painel de baixo)."""
import asyncio, json
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
TODAY = NOW[:10]
STD = {"id": "m_std_t", "nome": "🔴 Avançada · Rotina Semanal Standard TESTE", "nivel": "avancada", "semana": [
    [1, "09:00", "13:00", "Escritório", "Trabalho", "#C0C8D0", "#2F3A45"], [2, "09:00", "13:00", "Escritório", "Trabalho", "#C0C8D0", "#2F3A45"],
    [1, "07:00", "07:30", "Café da manhã", "Descanso", "#FFE8A0", "#6B4E00"], [5, "20:00", "21:00", "Curso de francês", "Estudo", "#B9D3F0", "#3A2A7A"],
    [6, "18:00", "19:00", "Natação", "Saúde & treino", "#A8E0A0", "#14501A"], [0, "23:00", "24:00", "Respiração", "Espiritual", "#9EF0CF", "#2C4A1E"],
    [3, "10:00", "12:00", "Leitura", "Lazer", "#F5B47A", "#4A4A4A"], [4, "10:00", "10:30", "Leitura", "Lazer", "#AAAAAA", "#000000"]]}
BAS = {"id": "m_bas_t", "nome": "🟢 Básica TESTE", "nivel": "basica", "semana": [[1, "09:00", "12:00", "Escritório", "Trabalho", "#C0C8D0", "#2F3A45"], [1, "20:00", "21:00", "Só na Básica", "Lazer", "#123456", "#FFFFFF"]]}
SEED = {U + "s_rotinaModelos": {"v": [BAS, STD], "at": 1, "r": "M0"},
        U + "s_rotina": {"v": [{"id": "b_lav", "data": TODAY, "ini": "09:00", "fim": "10:00", "titulo": "Escritório", "cat": "Trabalho", "rep": "", "exc": [], "st": {}, "notas": "", "cor": "#C0C8D0", "tx": "#2F3A45"}], "at": 1, "r": "R0"},
        U + "s_cfg": {"v": {"nome": "Teste"}, "at": 1, "r": "C0"}}
DIA = lambda t: f"rtOcc('{t}').map(b => [b.titulo, b.ini, b.fim, b.cor || '']).sort((p, q) => p[1].localeCompare(q[1]))"

async def abre(pg, d, m):
    s = pg.locator(f"[data-rts='{d}|{m}']"); await s.scroll_into_view_if_needed(); await s.click(); await pg.wait_for_timeout(180)

async def opcao(pg, nome):
    await pg.click(f"#rta .rtao:has-text('{nome}')"); await pg.wait_for_timeout(250)

async def desktop(p):
    b, pg, errs = await open_page(p, w=1440, h=950, hash_="rotina", cfg={"realBoot": True, "seedStore": json.dumps(SEED)})
    try:
        await pg.wait_for_timeout(700)
        chk(await pg.evaluate("KEYS.includes('rotinaAtiv') && EMPTY().rotinaAtiv.outras.length === 0"), "dado novo registrado (rotinaAtiv) e vazio para quem começa")
        nomes = await pg.evaluate("rtaPadrao().map(a => a.nome)")
        chk(nomes == ["Café da manhã", "Curso de francês", "Escritório", "Leitura", "Natação", "Respiração"], f"padrão = só as atividades do modelo Standard, uma vez cada ({nomes})")
        chk(await pg.evaluate("rtaNomeGrupo()") == "Standard Semanal", "o grupo se chama Standard Semanal")
        chk(await pg.evaluate("rtaPadrao().find(a => a.nome === 'Leitura').cor") == "#F5B47A", "atividade com duas cores no modelo fica com a que tem mais minutos")
        # abrir numa meia hora livre
        await abre(pg, TODAY, 840)
        st = await pg.evaluate("""(() => { const r = document.querySelector('#rta'), q = r.querySelector('#rta_q'), s = document.querySelector('[data-rts="' + TODAY + '|840"]').getBoundingClientRect(), x = r.getBoundingClientRect();
          return { open: !r.hidden, foco: document.activeElement.id, cab: r.querySelector('.rtah').innerText, grupos: [...r.querySelectorAll('.rtag')].map(g => g.firstChild.textContent.trim()),
            n: r.querySelectorAll('.rtao').length, combo: [q.getAttribute('role'), q.getAttribute('aria-controls'), q.getAttribute('aria-activedescendant')], lb: r.querySelector('#rta_l').getAttribute('role'),
            perto: Math.abs(x.left - s.left) < 12 && (x.top >= s.bottom - 1 || x.bottom <= s.top + 1), pick: document.querySelectorAll('.rtslot.pick').length,
            sw: getComputedStyle([...r.querySelectorAll('.rtao')].find(o => o.innerText.includes('Escritório')).querySelector('.rtasw')).backgroundColor, vazio: r.querySelector('[aria-labelledby=rta_go]').innerText }; })()""")
        chk(st["open"] and st["foco"] == "rta_q" and "14:00–14:30" in st["cab"], f"tocar às 14:00 abre a lista ali, com a busca em foco e a faixa 14:00–14:30 ({st['cab']!r})")
        chk(st["grupos"] == ["Standard Semanal", "Outras"] and st["n"] == 6 and "Nenhuma ainda" in st["vazio"], f"dois grupos separados: Standard (6) e Outras (vazio) {st['grupos']}")
        chk(st["sw"] == "rgb(192, 200, 208)", f"cada atividade mostra a sua cor ({st['sw']})")
        chk(st["perto"] and st["pick"] == 1, "a lista fica colada na célula e a meia hora escolhida fica marcada")
        chk(st["combo"] == ["combobox", "rta_l", "rta_o0"] and st["lb"] == "listbox", f"acessível: combobox + listbox + opção ativa {st['combo']}")
        await opcao(pg, "Natação")
        bl = await pg.evaluate(f"S.rotina.filter(b => b.titulo === 'Natação').map(b => [b.data, b.ini, b.fim, b.cat, b.cor, b.tx])")
        chk(bl == [[TODAY, "14:00", "14:30", "Saúde & treino", "#A8E0A0", "#14501A"]], f"escolher preenche a meia hora com a atividade, a categoria e a cor fixa ({bl})")
        bg = await pg.evaluate("(e => e && [getComputedStyle(e).backgroundColor, getComputedStyle(e).color])([...document.querySelectorAll('.rtb.cor')].find(e => e.innerText.includes('Natação')))")
        chk(bg == ["rgb(168, 224, 160)", "rgb(20, 80, 26)"], f"a célula na grade assume a cor (fundo e letra) {bg}")
        chk(await pg.evaluate("[!!RTA.ap, document.querySelector('#rta').hidden, document.querySelectorAll('.rtslot.pick').length]") == [False, True, 0], "depois de escolher, a lista fecha e a marca some")
        # meia hora vizinha com a mesma atividade: o bloco cresce
        await abre(pg, TODAY, 870); await pg.fill("#rta_q", "nat"); await pg.wait_for_timeout(80)
        r = await pg.evaluate("[...document.querySelectorAll('#rta .rtao')].map(o => o.querySelector('span:not(.ico)').textContent)")
        chk(r == ["Natação", "Criar “nat” em Outras"], f"a busca filtra a lista (e oferece criar o nome digitado) {r}")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"S.rotina.filter(b => b.titulo === 'Natação').map(b => [b.ini, b.fim])") == [["14:00", "15:00"]], "Enter escolhe; encostado no mesmo bloco, ele cresce (14:00–15:00, um bloco só)")
        # arrastar por cima de um horário ocupado
        s1 = pg.locator(f"[data-rts='{TODAY}|480']"); await s1.scroll_into_view_if_needed(); b1 = await s1.bounding_box(); b2 = await pg.locator(f"[data-rts='{TODAY}|630']").bounding_box()
        await pg.mouse.move(b1["x"] + 40, b1["y"] + b1["height"] / 2); await pg.mouse.down(); await pg.mouse.move(b2["x"] + 40, b2["y"] + b2["height"] / 2, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        chk("08:00–11:00" in await pg.inner_text("#rta .rtah"), "arrastar de 08:00 a 11:00 abre a lista para a faixa toda")
        await opcao(pg, "Café da manhã")
        d1 = await pg.evaluate(DIA(TODAY))
        chk([x[:3] for x in d1 if x[1] < "11:00"] == [["Café da manhã", "08:00", "09:00"], ["Escritório", "09:00", "10:00"], ["Café da manhã", "10:00", "11:00"]], f"o horário ocupado fica como está; o resto da faixa é preenchido ({[x[:3] for x in d1 if x[1] < '11:00']})")
        chk("livres" in await pg.inner_text(".toast"), "o aviso diz que parte da faixa já tinha bloco")
        await pg.click(".toast [data-act=undo], [data-act=undo]"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"S.rotina.filter(b => b.titulo === 'Café da manhã').length") == 0, "desfazer tira o que foi preenchido")
        await pg.mouse.move(b1["x"] + 40, b1["y"] + b1["height"] / 2); await pg.mouse.down(); await pg.mouse.move(b2["x"] + 40, b2["y"] + b2["height"] / 2, steps=8); await pg.mouse.up(); await pg.wait_for_timeout(200)
        await opcao(pg, "Escritório")
        chk(await pg.evaluate(f"rtOcc('{TODAY}').filter(b => b.titulo === 'Escritório').map(b => [b.id, b.ini, b.fim])") == [["b_lav", "08:00", "11:00"]], "mesma atividade dos dois lados de um bloco igual: vira um bloco só (08:00–11:00)")
        # teclado, Esc e clique fora
        n0 = await pg.evaluate("S.rotina.length")
        await abre(pg, TODAY, 960); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("ArrowDown"); await pg.wait_for_timeout(60)
        chk(await pg.evaluate("[document.querySelector('#rta_q').getAttribute('aria-activedescendant'), document.querySelector('#rta_o2').classList.contains('on'), document.querySelector('#rta_o2').getAttribute('aria-selected')]") == ["rta_o2", True, "true"], "setas mudam a opção ativa")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(120)
        chk(await pg.evaluate("[!!RTA.ap, S.rotina.length]") == [False, n0], "Esc fecha sem mudar nada")
        await abre(pg, TODAY, 960); await pg.click(".rtins h2, .rtins .pn"); await pg.wait_for_timeout(120)
        chk(not await pg.evaluate("!!RTA.ap"), "clicar fora fecha a lista")
        # criar uma atividade de Outras com cor escolhida
        await abre(pg, TODAY, 960); await pg.fill("#rta_q", "Oficina de cerâmica"); await pg.wait_for_timeout(80)
        chk("Criar “Oficina de cerâmica” em Outras" in await pg.inner_text("#rta_l"), "nome que não existe: a lista oferece criar em Outras")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[document.querySelector('#rta_nn')?.value, document.querySelector('#rta_nc')?.type]") == ["Oficina de cerâmica", "color"], "Enter abre o cadastro com o nome e um seletor de cor")
        await pg.evaluate("(i => { i.value = '#123abc'; i.dispatchEvent(new Event('input', { bubbles: true })); })(document.querySelector('#rta_nc'))"); await pg.select_option("#rta_nk", "Lazer")
        chk(await pg.evaluate("getComputedStyle(document.querySelector('#rta_pv')).backgroundColor") == "rgb(18, 58, 188)", "a prévia mostra a cor escolhida")
        await pg.click("#rta_f .btn.primary"); await pg.wait_for_timeout(300)
        chk(await pg.evaluate("S.rotinaAtiv.outras.map(a => [a.nome, a.cor, a.cat])") == [["Oficina de cerâmica", "#123abc", "Lazer"]], "a atividade nova entra em Outras com a cor e a categoria")
        chk(await pg.evaluate(f"S.rotina.filter(b => b.titulo === 'Oficina de cerâmica').map(b => [b.ini, b.fim, b.cor, b.tx, b.cat])") == [["16:00", "16:30", "#123abc", "#ffffff", "Lazer"]], "e já preenche a célula com essa cor (letra clara no fundo escuro)")
        await pg.wait_for_timeout(1000)
        chk((await pg.evaluate(f"window.__store['{U}s_rotinaAtiv']?.v?.outras?.map(a => a.nome)")) == ["Oficina de cerâmica"], "as Outras vão para o banco")
        await abre(pg, TODAY, 1020)
        r = await pg.evaluate("(r => [[...r.querySelectorAll('.rtag')].map(g => g.firstChild.textContent.trim()), [...r.querySelectorAll('[aria-labelledby=rta_go] .rtao span')].map(s => s.textContent), getComputedStyle(r.querySelector('[aria-labelledby=rta_go] .rtasw')).backgroundColor])(document.querySelector('#rta'))")
        chk(r == [["Standard Semanal", "Outras"], ["Oficina de cerâmica"], "rgb(18, 58, 188)"], f"na próxima vez ela aparece no grupo Outras, depois das padrão, com a cor {r}")
        # nome repetido não entra
        await pg.click("#rta [data-rta=nova]"); await pg.wait_for_timeout(120); await pg.fill("#rta_nn", "escritorio"); await pg.click("#rta_f .btn.primary"); await pg.wait_for_timeout(120)
        chk("já está na lista" in await pg.inner_text("#rta_msg") and await pg.evaluate("S.rotinaAtiv.outras.length") == 1, "nome igual a uma atividade existente não entra (sem diferença de maiúsculas e acentos)")
        await pg.click("#rta [data-rta=volta]"); await pg.wait_for_timeout(100)
        chk(await pg.evaluate("!!document.querySelector('#rta_q') && !document.querySelector('#rta_f')"), "Voltar retorna à lista")
        # Mais opções…
        await pg.click("#rta [data-rta=form]"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[document.querySelector('#rt_a').value, document.querySelector('#rt_z').value, !!document.querySelector('#rt_tl option')]") == ["17:00", "17:30", True], "“Mais opções…” abre o formulário na mesma faixa, com as atividades sugeridas no nome")
        await pg.fill("#rt_t", "curso de frances"); await pg.wait_for_timeout(80)
        chk("Atividade do padrão" in await pg.inner_text("#rt_ah") and await pg.evaluate("document.querySelector('#rt_c').value") == "Estudo", "digitar o nome de uma atividade mostra a cor e acerta a categoria")
        await pg.click("#rtf .btn.primary"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate(f"S.rotina.filter(b => b.data === '{TODAY}' && b.ini === '17:00').map(b => [b.titulo, b.cor])") == [["Curso de francês", "#B9D3F0"]], "salvar pelo formulário também aplica a cor (e o nome certo)")
        # trocar a atividade de um bloco
        pid = await pg.evaluate("S.rotina.find(b => b.titulo === 'Natação').id")
        blk = pg.locator(f"[data-rtb='{pid}|{TODAY}']"); await blk.scroll_into_view_if_needed(); await blk.click(); await pg.wait_for_timeout(200)
        await pg.click(f"#dlg [data-rttroca='{pid}|{TODAY}']"); await pg.wait_for_timeout(200)
        chk(await pg.evaluate("[!$('#dlg').open, RTA.ap?.modo, document.querySelector('#rta .rtah b')?.textContent]") == [True, "trocar", "Trocar atividade"], "“Trocar atividade” no cartão abre a mesma lista para o bloco")
        await opcao(pg, "Respiração")
        chk(await pg.evaluate(f"(b => [b.titulo, b.cat, b.cor, b.ini, b.fim])(S.rotina.find(x => x.id === '{pid}'))") == ["Respiração", "Espiritual", "#9EF0CF", "14:00", "15:00"], "o bloco troca de atividade, categoria e cor, no mesmo horário")
        # Atividades e cores
        await pg.click("[data-act=rtativ]"); await pg.wait_for_timeout(200)
        d = await pg.evaluate("[document.querySelectorAll('#dlg .rtadc').length, [...document.querySelectorAll('#dlg [data-rtadn]')].map(i => i.value)]")
        chk(d == [6, ["Oficina de cerâmica"]], f"“Atividades e cores”: as 6 padrão e as Outras editáveis {d}")
        oid = await pg.evaluate("S.rotinaAtiv.outras[0].id")
        await pg.evaluate(f"(i => {{ i.value = '#aa0000'; i.dispatchEvent(new Event('change', {{ bubbles: true }})); }})(document.querySelector('[data-rtadc=\"{oid}\"]'))"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[S.rotinaAtiv.outras[0].cor, S.rotina.find(b => b.titulo === 'Oficina de cerâmica').cor]") == ["#aa0000", "#aa0000"], "mudar a cor de uma Outra recolore os blocos dela")
        await pg.fill(f"[data-rtadn='{oid}']", "Cerâmica"); await pg.press(f"[data-rtadn='{oid}']", "Tab"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[S.rotinaAtiv.outras[0].nome, S.rotina.some(b => b.titulo === 'Cerâmica'), S.rotina.some(b => b.titulo === 'Oficina de cerâmica')]") == ["Cerâmica", True, False], "renomear leva o nome novo para os blocos")
        await pg.fill("#rtad_nn", "Yoga em casa"); await pg.evaluate("(i => { i.value = '#00aa88'; })(document.querySelector('#rtad_nc'))"); await pg.click("#dlg [data-rtada]"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("S.rotinaAtiv.outras.map(a => [a.nome, a.cor, a.cat])") == [["Cerâmica", "#aa0000", "Lazer"], ["Yoga em casa", "#00aa88", "Saúde & treino"]], "adicionar pelo diálogo: nome, cor e categoria sugerida pelo nome")
        await pg.click(f"#dlg [data-rtadd='{oid}']"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[S.rotinaAtiv.outras.map(a => a.nome), S.rotina.some(b => b.titulo === 'Cerâmica')]") == [["Yoga em casa"], True], "excluir tira da lista e deixa os blocos")
        await pg.select_option("#rtad_f", "m_bas_t"); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("[rtaPadrao().map(a => a.nome), rtaNomeGrupo()]") == [["Escritório", "Só na Básica"], "Padrão · 🟢 Básica TESTE"], "dá para escolher de qual modelo vem a lista padrão")
        await pg.select_option("#rtad_f", ""); await pg.wait_for_timeout(150)
        chk(await pg.evaluate("rtaNomeGrupo()") == "Standard Semanal", "e voltar ao automático (o Standard)")
        await pg.click("#dlg [data-rtadx]"); await pg.wait_for_timeout(100)
        # texto rápido usa o nome, a categoria e a cor da atividade
        await pg.fill("#rt_q", "escritório amanhã 14h-15h"); await pg.wait_for_timeout(100)
        chk(await pg.evaluate("!!document.querySelector('#rt_qp .rtasw')"), "a prévia do texto rápido mostra a cor da atividade")
        await pg.press("#rt_q", "Enter"); await pg.wait_for_timeout(250)
        chk(await pg.evaluate("(b => [b.titulo, b.cat, b.cor, b.data === addDays(TODAY, 1)])(S.rotina.at(-1))") == ["Escritório", "Trabalho", "#C0C8D0", True], "“escritório amanhã 14h-15h” cria o bloco com o nome, a categoria e a cor do padrão")
        # semana: outra coluna
        await pg.evaluate("location.hash = 'rotina.semana'"); await pg.wait_for_timeout(400)
        amanha = await pg.evaluate("addDays(TODAY, 1)")
        if await pg.evaluate(f"!!document.querySelector('[data-rts=\"{amanha}|1200\"]')"):
            await abre(pg, amanha, 1200)
            chk(await pg.evaluate(f"fmtDL('{amanha}')") in await pg.inner_text("#rta .rtah"), "na semana, a lista diz o dia da coluna tocada")
            await opcao(pg, "Yoga em casa")
            chk(await pg.evaluate(f"rtOcc('{amanha}').filter(b => b.titulo === 'Yoga em casa').map(b => [b.ini, b.fim, b.cor])") == [["20:00", "20:30", "#00aa88"]], "e preenche aquele dia com a cor da Outra")
        else:
            chk(True, "(amanhã está na outra semana: teste da coluna pulado)")
        chk(await pg.evaluate("document.querySelectorAll('.rtslot.pick').length") == 0, "nenhuma marca sobra na grade")
        await pg.wait_for_timeout(900)
        chk(any(x.get("titulo") == "Yoga em casa" for x in await pg.evaluate(f"window.__store['{U}s_rotina'].v")), "os blocos vão para o banco")
    finally:
        for e in errs: print("  ", e)
        if errs:
            global bad
            bad += 1
        await b.close()

async def celular(p):
    b, pg, errs = await open_page(p, w=390, h=844, hash_="rotina.dia")
    try:
        await pg.wait_for_timeout(500)
        chk(await pg.evaluate("[rtaNomeGrupo(), rtaOutras().map(a => a.nome)]") == ["Standard Semanal", ["Aula de cerâmica"]], "exemplo: modelo Standard fictício e uma atividade em Outras")
        s = pg.locator(f"[data-rts='{TODAY}|1290']"); await s.scroll_into_view_if_needed(); bb = await s.bounding_box()
        await pg.evaluate("""([x, y]) => { const el = document.elementFromPoint(x, y); for (const t of ['pointerdown', 'pointerup']) el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 })); }""", [bb["x"] + 60, bb["y"] + bb["height"] / 2])
        await pg.wait_for_timeout(300)
        r = await pg.evaluate("(r => { const x = r.getBoundingClientRect(); return [r.classList.contains('sheet'), Math.round(x.left), Math.round(x.width), Math.round(innerHeight - x.bottom), document.activeElement === r, Math.min(...[...r.querySelectorAll('.rtao')].map(o => o.getBoundingClientRect().height))]; })(document.querySelector('#rta'))")
        chk(r[:5] == [True, 0, 390, 0, True], f"390 px: tocar abre um painel de baixo na largura toda, sem abrir o teclado {r[:5]}")
        chk(r[5] >= 44, f"opções com altura de toque (≥ 44 px: {r[5]})")
        ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        await opcao(pg, "Leitura")
        chk(await pg.evaluate(f"S.rotina.filter(b => b.data === '{TODAY}' && b.ini === '21:30').map(b => [b.titulo, b.fim, b.cor])") == [["Leitura", "22:00", "#F8CBAD"]], "escolher preenche 21:30–22:00 com a cor do modelo")
    finally:
        for e in errs: print("  ", e)
        if errs:
            global bad
            bad += 1
        await b.close()

async def main():
    async with async_playwright() as p:
        await desktop(p)
        await celular(p)
    print(f"\n{ok} ok, {bad} falhas")
asyncio.run(main())
