"""Painel do dia: números falados e formatos, validação ao vivo, obrigatórios, texto que preenche os campos, voz simulada e o caminho sem ela,
revisão com substituições e repetidos, gravação nas mesmas estruturas das abas, banco de dados e desfazer."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

T = TODAY_ISO
Y = (datetime.date.fromisoformat(TODAY_ISO) - datetime.timedelta(days=1)).isoformat()
def seed():
    u = "data/users/u_test/"
    return {u + "s_saude": {"at": 1, "v": {T: {"humor": 3, "sono": 6}}},
            u + "s_habitos": {"at": 1, "v": [{"id": "h1", "nome": "Meditar", "area": "Saúde mental", "meta": 7}, {"id": "h2", "nome": "Ler", "area": "Aprendizado", "meta": 5}]},
            u + "s_lanc": {"at": 1, "v": [{"id": "l1", "data": T, "tipo": "Despesa", "cat": "Restaurantes & cafés", "desc": "almoço", "valor": 18, "conta": "Cartão de débito"}]},
            u + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}}

async def field_state(pg, k):
    return await pg.evaluate(f"(() => {{ const b = document.querySelector('[data-pdbox=\"{k}\"]'); const m = document.getElementById('pdm_{k}'); return [b ? [...b.classList].filter(c => ['ok','err','warn','req'].includes(c)).join(' ') : null, m ? m.textContent : null]; }})()")

async def main():
    global bad
    async with async_playwright() as p:
        # ---------------------------------------------------------------- 1. conversores (dados de exemplo)
        b, pg, errs = await open_page(p, w=1440, hash_="painel")
        try:
            W = await pg.evaluate("""() => ({
              a: pdWords('sete e meia', true), b: pdWords('oito mil e quinhentos passos'), c: pdWords('comprei um café por três euros'), d: pdWords('dezoito e cinquenta euros', true),
              e: pdWords('humor de quatro'), f: pdWords('dormi sete e meia'), g: pdWords('vinte e cinco minutos'), h: pdWords('sete vírgula cinco', true) })""")
            chk(W == {"a": "7,5", "b": "8500 passos", "c": "comprei um café por 3 euros", "d": "18,5 euros", "e": "humor de 4", "f": "dormi 7,5h", "g": "25 minutos", "h": "7,5"}, f"números por extenso viram dígitos só onde é número: {W}")
            H = await pg.evaluate("['7','7,5','7h30','7:30','7 e meia','sete e meia','90 min','7 horas e 15'].map(pdHours)")
            chk(H == [7, 7.5, 7.5, 7.5, 7.5, 7.5, 1.5, 7.25], f"horas em oito formatos: {H}")
            I = await pg.evaluate("['8000','8.000','8 000','8k','8 mil','oito mil','8,5','abc'].map(x => { const v = pdInt(x); return Number.isNaN(v) ? 'NaN' : v; })")
            chk(I == [8000, 8000, 8000, 8000, 8000, 8000, "NaN", "NaN"], f"passos: aceita separador de milhar e 'mil', recusa decimal e letras: {I}")
            M = await pg.evaluate("['12','12,50','12.50','1.250,00','€ 12','18 euros','doze','12,505','abc'].map(x => { const v = pdMoney(x); return Number.isNaN(v) ? 'NaN' : v; })")
            chk(M == [12, 12.5, 12.5, 1250, 12, 18, 12, "NaN", "NaN"], f"valores: vírgula, ponto, milhar e moeda; recusa 3 casas e letras: {M}")
            Sc = await pg.evaluate("[pdScale('quatro','humor'), pdScale('estou bem','humor'), pdScale('muito mal','humor'), pdScale('alta','energia'), pdScale('nota 2','estresse'), pdScale('sei lá','humor')]")
            chk(Sc == [4, 4, 1, 4, 2, None], f"escalas de 1 a 5 por número, extenso ou palavra: {Sc}")
            CP = await pg.evaluate("['gastei 18 euros no almoço e 32,40 no mercado', 'fui ao cinema 2 horas', 'andei 8 mil e 500 passos', 'recebi 300 do freela e 50 de reembolso'].map(t => capParse(pdWords(t)).map(x => x.line))")
            chk(CP == [["/gasto 18 almoço", "/gasto 32,4 mercado"], ["/lazer 2 Cinema"], ["/passos 8500"], ["/receita 300 freela", "/receita 50 reembolso"]], f"valores em sequência viram registros separados; 'fui ao' sai do nome do lazer: {CP}")
            NZ = await pg.evaluate("['Dormi 7 e meia, humor 4', 'dormi 6,5 e acordei cedo', 'dormi 7h30', 'dormi umas 8 horas'].map(t => capParse(pdNorm(pdWords(t))).filter(x => x.line.startsWith('/sono')).map(x => x.line)[0] || null)")
            chk(NZ == ["/sono 7,5", "/sono 6,5", "/sono 7,5", "/sono 8"], f"sono sem a palavra 'horas' também é lido: {NZ}")
            # menu e atalhos
            chk(await pg.evaluate("!!document.querySelector('#nav a[href=\"#painel\"]')") and await pg.evaluate("NAV[0][1].findIndex(x => x[0] === 'painel')") == 2, "o Painel do dia está no menu principal, logo depois de Hoje")
            chk(await pg.evaluate("palItems('painel').some(x => x.l === 'Painel do dia' && x.g === 'Ações')"), "a busca (Ctrl K) abre o Painel do dia")
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("!!document.querySelector('a.btn[href=\"#painel\"]')"), "Hoje tem atalho para o Painel do dia")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()

        # ---------------------------------------------------------------- 2. texto, validação, voz e gravação (dados da pessoa)
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(seed()), "fakeSR": True}, hash_="painel")
        try:
            await pg.wait_for_timeout(400)
            chk(await pg.evaluate("IS_EXAMPLE") is False, "abre com os dados gravados da pessoa")
            v = await pg.evaluate("[PD.v.humor, PD.v.sono, PD.src.humor, PD.src.sono]")
            chk(v == ["3", "6", "base", "base"], f"campos vêm pré-preenchidos com o que as abas já têm para o dia: {v}")
            chk(await pg.evaluate("document.querySelector('[data-pdbox=\"sono\"] .pdsrc')?.textContent") == "já salvo", "o campo mostra que o valor já estava salvo")
            chk(await pg.evaluate("document.querySelector('.pdvst').textContent.includes('voz pronta')"), "voz disponível aparece como pronta")
            # texto do dia preenche os campos
            await pg.fill("#pd_txt", "Ontem dormi sete e meia, humor 4, corri 30 min e gastei 18 euros no almoço. Meditei 15 min. Preciso ligar para o banco até sexta")
            await pg.wait_for_timeout(450)
            st = await pg.evaluate("({ date: PD.date, v: PD.v, g: PD.gastos.map(g => [g.v, g.d, g.src]), h: PD.habs, x: PD.extras, tar: PD.L.tar.map(r => r.t) })")
            chk(st["date"] == Y, f"'ontem' no texto muda o dia para {Y}: {st['date']}")
            chk(st["v"]["sono"] == "7,5" and st["v"]["humor"] == "4" and st["v"]["treino"] == "Corrida" and st["v"]["min"] == "30", f"sono, humor e treino saem do texto: {st['v']}")
            chk(st["g"] == [["18", "no almoço", "texto"]] or (st["g"] and st["g"][0][0] == "18" and "almoço" in st["g"][0][1]), f"o gasto sai do texto: {st['g']}")
            chk(st["v"]["ppid"] == "med" and st["v"]["pmin"] == "15", "a prática da jornada sai do texto (meditei 15 min)")
            chk(st["h"].get("h1") is True, "o hábito Meditar é marcado pelo texto")
            chk(any("banco" in t for t in st["tar"]), f"a tarefa do texto vai para a seção Tarefas do painel: {st['tar']}")
            chk(await pg.evaluate("document.querySelector('[data-pdbox=\"sono\"] .pdsrc')?.textContent") == "do texto", "o campo diz que veio do texto")
            # o que se digita no campo prevalece sobre o texto
            await pg.click("[data-pdday='%s']" % T); await pg.wait_for_timeout(200)
            await pg.fill("#pd_sono", "7h30"); await pg.wait_for_timeout(150)
            await pg.fill("#pd_txt", "dormi 5 horas, humor 4, corri 30 min"); await pg.wait_for_timeout(450)
            v = await pg.evaluate("[PD.date, PD.v.sono, PD.src.sono, PD.gastos.length, PD.extras.length]")
            chk(v == [T, "7h30", "mao", 0, 0], f"o dia escolhido à mão e o sono digitado não mudam com o texto; o que saiu do texto some junto: {v}")
            chk((await field_state(pg, "sono")) == ["ok", "= 7,5 h"], f"7h30 é aceito e convertido na hora: {await field_state(pg, 'sono')}")
            # validação em tempo real
            await pg.fill("#pd_sono", "abc"); await pg.wait_for_timeout(120)
            fs = await field_state(pg, "sono")
            chk(fs[0] == "err" and "Formato inválido" in fs[1] and await pg.evaluate("document.querySelector('#pd_sono').getAttribute('aria-invalid')") == "", f"formato inválido acusa na hora, com aria-invalid: {fs}")
            chk(await pg.evaluate("document.querySelector('[data-act=pdrev]').disabled") and "erro" in await pg.inner_text("#pd_foot"), "com erro, o botão de salvar fica bloqueado e o rodapé diz por quê")
            chk(await pg.evaluate("document.activeElement.id") == "pd_sono", "o cursor não sai do campo enquanto valida")
            await pg.fill("#pd_sono", "20"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "sono"))[1] == "Entre 0 e 16 horas", "sono acima de 16 h é recusado")
            await pg.fill("#pd_sono", "3"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "sono"))[0] == "warn", "sono de 3 h passa, com aviso")
            await pg.fill("#pd_passos", "8,5"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "passos"))[0] == "err", "passos com decimal é recusado")
            await pg.fill("#pd_passos", "8 mil"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "passos")) == ["ok", "= 8.000"], f"'8 mil' passos vira 8.000: {await field_state(pg, 'passos')}")
            await pg.fill("#pd_lzat", "Cinema"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "lzh"))[0] == "err" and (await pg.inner_text("#pdm_lzh")) == "Quantas horas?", "lazer sem horas acusa o que falta")
            await pg.fill("#pd_lzh", "2"); await pg.wait_for_timeout(120)
            chk((await field_state(pg, "lzh"))[0] == "ok", "com as horas, o lazer fica válido")
            await pg.click("[data-act=pdgadd]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("document.activeElement.id") == "pd_gv0", "novo gasto já abre com o cursor no valor")
            await pg.fill("#pd_gd0", "mercado"); await pg.wait_for_timeout(120)
            chk(await pg.inner_text("#pdm_g0") == "Falta o valor", "gasto sem valor acusa")
            await pg.fill("#pd_gv0", "12,505"); await pg.wait_for_timeout(120)
            chk("Valor inválido" in await pg.inner_text("#pdm_g0"), "valor com três casas decimais é recusado")
            await pg.fill("#pd_gv0", "1.250,00"); await pg.wait_for_timeout(120)
            chk("valor alto" in await pg.inner_text("#pdm_g0"), "valor alto passa com aviso para conferir")
            await pg.click("[data-pdgdel='0']"); await pg.wait_for_timeout(150)
            await pg.fill("#pd_date", "2099-01-01"); await pg.dispatch_event("#pd_date", "change"); await pg.wait_for_timeout(200)
            chk((await field_state(pg, "date"))[1] if False else "futuro" in (await pg.inner_text("#pdm_date")), "dia no futuro é recusado")
            await pg.click("[data-pdday='%s']" % T); await pg.wait_for_timeout(200)
            # obrigatórios
            await pg.click("[data-pdsc='humor|4']"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("PD.v.humor") == "" and (await field_state(pg, "humor"))[0] == "req" and "Falta: Humor" in await pg.inner_text("#pd_foot"), "tirar o humor (obrigatório) marca o campo e trava o salvar")
            await pg.evaluate("document.querySelector('.pdcfg').open = true"); await pg.click("[data-pdreq='humor']"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("S.cfg.pdReq") == ["sono"] and "Falta" not in await pg.inner_text("#pd_foot"), "obrigatórios se ajustam e ficam gravados nos ajustes")
            await pg.evaluate("document.querySelector('.pdcfg').open = true"); await pg.click("[data-pdreq='humor']"); await pg.wait_for_timeout(250)

            # ---------------------------------------------------------------- voz simulada (Web Speech API)
            await pg.click("[data-pdmic='sono']"); await pg.wait_for_timeout(80)
            sr = await pg.evaluate("[window.__sr.lang, window.__sr.interimResults, window.__sr.continuous, document.querySelector('[data-pdmic=sono]').getAttribute('aria-pressed')]")
            chk(sr == ["pt-BR", True, False, "true"], f"o microfone do campo abre o reconhecimento em pt-BR, com parcial e sem modo contínuo: {sr}")
            await pg.evaluate("window.__say('sete e', false)"); await pg.wait_for_timeout(60)
            chk("sete e" in await pg.inner_text("#pd_vbar"), "o que está sendo ouvido aparece enquanto se fala")
            await pg.evaluate("window.__say('sete e meia')"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("[PD.v.sono, PD.src.sono, VOZ.on]") == ["7,5", "voz", None], "“sete e meia” vira 7,5 h no sono, e o microfone desliga sozinho")
            chk(await pg.evaluate("document.querySelector('[data-pdbox=\"sono\"] .pdsrc')?.textContent") == "por voz", "o campo diz que veio por voz")
            await pg.click("[data-pdmic='humor']"); await pg.evaluate("window.__say('estou bem')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("PD.v.humor") == "4", "“estou bem” no humor vira 4")
            await pg.click("[data-pdmic='passos']"); await pg.evaluate("window.__say('oito mil e quinhentos')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("PD.v.passos") == "8500", "“oito mil e quinhentos” vira 8500 passos")
            await pg.click("[data-pdmic='gasto']"); await pg.evaluate("window.__say('doze e cinquenta euros no mercado')"); await pg.wait_for_timeout(250)
            g = await pg.evaluate("PD.gastos.map(g => [g.v, g.d, g.src])")
            chk(g == [["12,5", "mercado", "voz"]], f"ditar gasto cria a linha com valor e descrição: {g}")
            await pg.click("[data-pdmic='treino']"); await pg.evaluate("window.__say('nadei quarenta minutos')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("[PD.v.treino, PD.v.min]") == ["Natação", "40"], "“nadei quarenta minutos” preenche tipo e minutos do treino")
            await pg.click("[data-pdmic='prat']"); await pg.evaluate("window.__say('mettā vinte minutos')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("[PD.v.ppid, PD.v.pmin]") == ["bud", "20"], "a prática por voz acha o pilar e os minutos")
            await pg.click("[data-pdmic='humor']"); await pg.evaluate("window.__say('sei lá')"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("PD.v.humor") == "4" and "não achei" in await pg.inner_text("#pd_vbar"), "fala sem número não apaga o campo e avisa")
            await pg.click("[data-pdmic='texto']"); await pg.wait_for_timeout(60)
            chk(await pg.evaluate("window.__sr.continuous") is True, "falar o dia usa ditado contínuo")
            await pg.evaluate("window.__say('fui ao cinema duas horas')"); await pg.wait_for_timeout(350)
            chk("cinema" in (await pg.input_value("#pd_txt")) and await pg.evaluate("VOZ.on") == "texto", "o ditado entra no texto do dia e o microfone continua ligado")
            await pg.click("[data-pdmic='texto']"); await pg.wait_for_timeout(100)
            chk(await pg.evaluate("[VOZ.on, window.__sr.aborted]") == [None, True], "tocar de novo para o ditado")
            await pg.click("[data-pdmic='energia']"); await pg.evaluate("window.__srErr('no-speech')"); await pg.wait_for_timeout(100)
            chk("Não ouvi nada" in await pg.inner_text("#pd_vbar") and await pg.evaluate("VOZ.blocked") == "", "silêncio avisa sem bloquear a voz")
            n0 = await pg.evaluate("window.__srs.length")
            await pg.click("[data-pdmic='energia']"); await pg.evaluate("window.__srErr('not-allowed')"); await pg.wait_for_timeout(150)
            vb = await pg.inner_text("#pd_vbar")
            chk("negado" in vb and "Win + H" in vb or "Fn" in vb or "teclado" in vb or "ditado do seu sistema" in vb, f"microfone negado: explica e ensina o ditado do sistema: {vb}")
            await pg.click("[data-pdmic='sono']"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("window.__srs.length") == n0 + 1 and await pg.evaluate("document.activeElement.id") == "pd_sono", "depois de negado não insiste no microfone: põe o cursor no campo para o ditado do sistema")
            await pg.evaluate("VOZ.blocked = ''; VOZ.msg = ''")

            # ---------------------------------------------------------------- revisão
            await pg.click("[data-pdhab='h2']"); await pg.wait_for_timeout(100); await pg.click("[data-pdhab='h1']"); await pg.wait_for_timeout(100)
            await pg.click("[data-act=pdgadd]"); await pg.wait_for_timeout(150); await pg.fill("#pd_gv1", "18"); await pg.fill("#pd_gd1", "almoço"); await pg.wait_for_timeout(150)
            chk(await pg.evaluate("(() => { const b = document.querySelector('[data-act=pdrev]'); pdPaint(); return b === document.querySelector('[data-act=pdrev]'); })()"), "redesenhar a validação não troca o botão de salvar (o clique não se perde)")
            await pg.click("[data-act=pdrev]"); await pg.wait_for_timeout(300)
            rows = await pg.evaluate("[...document.querySelectorAll('.pdr')].map(r => [r.querySelector('input').dataset.pdrow, r.querySelector('.pdk').textContent, r.querySelector('input').checked, r.querySelector('small')?.textContent || ''])")
            R = {r[0]: r for r in rows}
            chk(R.get("s.humor", [0, 0])[1] == "Substitui" and R["s.humor"][3] == "antes: 3/5", f"humor aparece como substituição, com o valor anterior: {R.get('s.humor')}")
            chk(R.get("s.sono", [0, 0])[1] == "Substitui" and R["s.sono"][3] == "antes: 6 h", f"sono idem: {R.get('s.sono')}")
            dup = [r for r in rows if r[0].startswith("g.") and r[1] == "Repetido?"]
            chk(len(dup) == 1 and dup[0][2] is False and "18,00" in dup[0][3], f"o almoço de 18 que já existe vem como repetido e desmarcado: {dup}")
            chk(R.get("h.h2", [0, 0, 0])[2] is True and R.get("h.h1", [0, 0, 0])[2] is True and R.get("j.sess", [0, 0, 0])[2] is True and R.get("d.ent", [0, 0, 0])[2] is True, "hábitos, prática e diário entram marcados")
            chk(R.get("s.passos", [0, 0])[1] == "Novo" and R.get("s.treino", [0, 0])[1] == "Novo", "passos e treino entram como novos")
            # outra aba muda o dia durante a revisão: a revisão compara com o valor atual
            await pg.evaluate("S.saude[TODAY] = { ...S.saude[TODAY], sono: 5 }; touch('saude', { noUndo: true })"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("document.querySelector('[data-pdrow=\"s.sono\"]').closest('.pdr').querySelector('small').textContent") == "antes: 5 h", "se o dia muda em outra aba durante a revisão, o 'antes' acompanha")
            lz = [r for r in rows if r[0] == "l.lz"]
            chk(bool(lz), f"o lazer do texto (cinema 2 h) entra na revisão: {[r[0] for r in rows]}")
            if lz: await pg.click("[data-pdrow='l.lz']"); await pg.wait_for_timeout(100)
            nlanc, nlz, ndia, nses = await pg.evaluate("[S.lanc.length, S.lazer.length, S.diario.length, jData().sess.length]")
            await pg.click("[data-act=pdsave]"); await pg.wait_for_timeout(400)
            s = await pg.evaluate("S.saude[TODAY]")
            chk(s.get("humor") == 4 and s.get("sono") == 7.5 and s.get("passos") == 8500 and s.get("treino") == "Natação" and s.get("min") == 40, f"Saúde recebe humor, sono, passos e treino: {s}")
            chk(await pg.evaluate("S.lanc.length") == nlanc + 1 and await pg.evaluate("S.lanc.at(-1).valor") == 12.5 and await pg.evaluate("S.lanc.at(-1).cat") == "Mercado", "só o gasto novo entra em Finanças, com categoria automática; o repetido fica de fora")
            chk(await pg.evaluate("[S.marks['h1|'+TODAY], S.marks['h2|'+TODAY]]") == [1, 1], "os hábitos ficam marcados no dia")
            js = await pg.evaluate("jData().sess.at(-1)")
            chk(await pg.evaluate("jData().sess.length") == nses + 1 and js["pid"] == "bud" and js["min"] == 20 and js["data"] == T, f"a prática vira sessão da Jornada: {js}")
            chk(await pg.evaluate("S.lazer.length") == nlz, "a linha desmarcada (lazer) não foi salva")
            e = await pg.evaluate("S.diario.at(-1)")
            chk(await pg.evaluate("S.diario.length") == ndia + 1 and e["origem"] == "painel" and "cinema" in e["texto"] and "/sono 7,5" in e["texto"] and "/sono 7,5" in e["aplicados"] and e["humor"] == 4, "o texto vai para o Diário com os registros marcados como aplicados")
            chk("registros salvos" in await pg.inner_text(".pddone") and await pg.evaluate("!!document.querySelector('.pddone a[href=\"#saude.checkin\"]')"), "aviso de salvo com atalho para as abas que receberam dados")
            chk(await pg.evaluate("[PD.v.sono, PD.src.sono, PD.text, localStorage.getItem('atlas_painel')]") == ["7,5", "base", "", None], "depois de salvar, o painel mostra o dia gravado e o rascunho é apagado")
            await pg.wait_for_timeout(1200)
            dbs = await pg.evaluate("window.__store['data/users/u_test/s_saude'].v[TODAY]")
            chk(dbs.get("sono") == 7.5 and dbs.get("humor") == 4, f"gravado no banco de dados da conta: {dbs}")
            # as abas mostram o mesmo dado
            await pg.evaluate("location.hash='hoje'"); await pg.wait_for_timeout(300)
            reg = await pg.inner_text(".hjreg"); chk("sono 7,5 h" in reg and "humor 4/5" in reg, f"o Registro do dia em Hoje mostra o que o painel salvou: {reg}")
            await pg.evaluate("location.hash='painel'"); await pg.wait_for_timeout(250)
            # desfazer volta tudo de uma vez
            await pg.click("[data-act=undo]"); await pg.wait_for_timeout(300)
            u = await pg.evaluate("[S.saude[TODAY].humor, S.saude[TODAY].sono, S.marks['h1|'+TODAY] || 0, S.lanc.length, S.diario.length, jData().sess.length]")
            chk(u == [3, 5, 0, nlanc, ndia, nses], f"um desfazer volta todos os registros do painel: {u}")
            # apagar um valor: aparece como 'Apaga'
            await pg.fill("#pd_sono", ""); await pg.wait_for_timeout(120)
            await pg.evaluate("document.querySelector('.pdcfg').open = true"); await pg.click("[data-pdreq='sono']"); await pg.wait_for_timeout(250)
            await pg.click("[data-act=pdrev]"); await pg.wait_for_timeout(250)
            ap = await pg.evaluate("[...document.querySelectorAll('.pdr')].map(r => [r.querySelector('input').dataset.pdrow, r.querySelector('.pdk').textContent])")
            chk(["s.sono", "Apaga"] in ap, f"apagar um campo que tinha valor vira linha 'Apaga': {ap}")
            await pg.click("[data-act=pdsave]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("'sono' in S.saude[TODAY]") is False and await pg.evaluate("S.saude[TODAY].humor") == 3, "salvar apaga só o sono")
            # salvar direto, sem revisão
            await pg.evaluate("document.querySelector('.pdcfg').open = true"); await pg.click("#pd_rev"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("S.cfg.pdRev") is False and "Salvar" in await pg.inner_text("[data-act=pdsave]"), "revisão desligada: o botão salva direto")
            await pg.click("[data-act=pdgadd]"); await pg.wait_for_timeout(150); await pg.fill("#pd_gv0", "18"); await pg.fill("#pd_gd0", "almoço")
            await pg.click("[data-act=pdgadd]"); await pg.wait_for_timeout(150); await pg.fill("#pd_gv1", "4,20"); await pg.fill("#pd_gd1", "café"); await pg.wait_for_timeout(150)
            n0 = await pg.evaluate("S.lanc.length")
            await pg.click("[data-act=pdsave]"); await pg.wait_for_timeout(300)
            chk(await pg.evaluate("S.lanc.length") == n0 + 1 and await pg.evaluate("S.lanc.at(-1).valor") == 4.2, "sem revisão, salva o novo e pula o repetido")
            # rascunho sobrevive a recarregar
            await pg.fill("#pd_txt", "dormi 8 horas"); await pg.wait_for_timeout(700)
            await pg.reload(); await pg.wait_for_timeout(1200)
            chk(await pg.input_value("#pd_txt") == "dormi 8 horas" and await pg.evaluate("PD.v.sono") == "8", "o rascunho volta depois de recarregar a página")
            # Ctrl+Enter no texto (o banco simulado volta ao início ao recarregar: a revisão está ligada de novo)
            if not await pg.evaluate("pdRev()"): await pg.evaluate("document.querySelector('.pdcfg').open = true"); await pg.click("#pd_rev"); await pg.wait_for_timeout(250)
            await pg.focus("#pd_txt"); await pg.keyboard.press("Control+Enter"); await pg.wait_for_timeout(250)
            chk(await pg.evaluate("PD.step") == "rev", "Ctrl+Enter no texto vai para a revisão")
            await pg.click("[data-act=pdback]"); await pg.wait_for_timeout(200)
            chk(await pg.evaluate("PD.step") == "form" and await pg.input_value("#pd_txt") == "dormi 8 horas", "voltar da revisão mantém tudo")
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()

        # ---------------------------------------------------------------- 3. sem Web Speech API (Firefox) e janela sem microfone
        for cfg, why, frag in (({"noSR": True}, "nosr", "Firefox"), ({"fakeSR": True, "policyNoMic": True}, "iframe", "não liberou o microfone")):
            b, pg, errs = await open_page(p, w=390, cfg=cfg, hash_="painel")
            try:
                chk(await pg.evaluate("pdVoiceOk()") == why and "ditado do sistema" in await pg.inner_text(".pdvst"), f"{why}: o painel avisa de saída que a voz vai pelo ditado do sistema")
                await pg.click("[data-pdmic='passos']"); await pg.wait_for_timeout(150)
                vb = await pg.inner_text("#pd_vbar")
                chk(frag in vb and await pg.evaluate("document.activeElement.id") == "pd_passos", f"{why}: tocar no microfone explica e põe o cursor no campo: {vb}")
                if why == "iframe": chk(await pg.evaluate("(window.__srs || []).length") == 0, "iframe: nem tenta abrir o reconhecimento")
                await pg.keyboard.type("8000"); await pg.wait_for_timeout(150)
                chk(await pg.evaluate("PD.v.passos") == "8000" and (await field_state(pg, "passos"))[0] == "ok", f"{why}: o texto ditado pelo sistema entra no campo e é validado como o digitado")
                await pg.click("[data-pdmic='texto']"); await pg.wait_for_timeout(150)
                chk(await pg.evaluate("document.activeElement.id") == "pd_txt", f"{why}: 'Falar' leva ao texto do dia")
                ov = await overflow(pg)
                chk(ov[0] <= ov[1], f"{why}: 390 px sem rolagem lateral {ov}")
            finally:
                for e in errs: print("  ", e)
                if errs: bad += 1
                await b.close()

        # ---------------------------------------------------------------- 4. layout da revisão no celular
        b, pg, errs = await open_page(p, w=390, cfg={"fakeSR": True}, hash_="painel")
        try:
            await pg.fill("#pd_txt", "dormi 7 horas, humor 4, gastei 18 euros no almoço e 32,40 no mercado, meditei 10 min, fui ao cinema 2 horas, preciso ligar para o banco até sexta")
            await pg.wait_for_timeout(500)
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"formulário cheio a 390 px sem rolagem lateral {ov}")
            await pg.click("[data-act=pdrev]"); await pg.wait_for_timeout(300)
            ov = await overflow(pg); chk(ov[0] <= ov[1] and await pg.evaluate("document.querySelectorAll('.pdr').length") >= 6, f"revisão a 390 px sem rolagem lateral {ov}")
            await pg.screenshot(path="out/lab10_rev_390.png", full_page=True)
        finally:
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
