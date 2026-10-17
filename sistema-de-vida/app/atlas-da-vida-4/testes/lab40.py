"""Atlas 4 · Clima automático (Hoje). Dados fictícios.
A página não tem internet: a previsão hora a hora chega pelo doc feed/hoje, gravado por uma tarefa agendada. Confere: hora de agora
escolhida nas horas gravadas (no fuso da cidade, com o aparelho em outro fuso), mínima e máxima do dia, chuva até a noite, próximas
horas, atualização do doc entrando sem recarregar, feed de outra cidade, cidade não encontrada, feed velho, troca de cidade sem
internet (lista pronta e nome livre), nada de marcar o tempo à mão e nenhuma busca na internet quando o feed cobre a hora."""
import asyncio, json, datetime
from harness import *
ok = 0; bad = 0
def chk(c, msg):
    global ok, bad
    if c: ok += 1; print("PASS", msg)
    else: bad += 1; print("FAIL", msg)

U = "data/users/u_test/"
H0 = int(datetime.datetime.fromisoformat(NOW).replace(tzinfo=datetime.timezone.utc).timestamp() // 3600 * 3600)   # navegador em UTC, relógio em NOW
iso = lambda t: datetime.datetime.fromtimestamp(t, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
def horas(de, ate, f):
    return [{"h": iso(H0 + i * 3600), **f(i)} for i in range(de, ate)]
# NOW = 10:00 UTC = 12:00 em Roma. Horas das 00:00 de Roma (−12) até 20 h depois; agora 17°, mínima 6° às 05:00 de Roma, máxima 21°;
# chuva às 15 h e 16 h de Roma (+3 e +4); a hora −13 é 23:00 de ontem em Roma (fica fora do dia, mesmo sendo hoje em UTC)
def clima(i):
    t = {0: 17, -7: 6, 5: 21}.get(i, 12 if i < 0 else 15); t = 30 if i == -13 else t
    chove = i in (3, 4)
    return {"t": t, "sens": t - 1, "code": 63 if chove else (2 if i >= 0 else 1), "vento": 9, "uv": 5 if 0 <= i <= 4 else 0, "mm": 1.4 if chove else 0}
FEED = {"dia": TODAY_ISO, "at": 1000, "hora": "06:47", "fonte": "MET Norway (yr.no)",
        "clima": {"lat": 45.0705, "lon": 7.6868, "cidade": "Turim", "fuso": "Europe/Rome", "horas": horas(-13, 21, clima)}}
SEED = {U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}, "feed/hoje": FEED}

async def main():
    global bad
    async with async_playwright() as p:
        reqs = []
        b, pg, errs = await open_page(p, w=1440, cfg={"seedStore": json.dumps(SEED), "noNet": True}, hash_="hoje")
        pg.on("request", lambda r: reqs.append(r.url))
        try:
            await pg.wait_for_timeout(900)
            W = await pg.evaluate("(() => { const w = hjClima(); return w && { f: w.fonte, t: w.t, min: w.min, max: w.max, h: w.hChuva, mm: w.mm, chuva: w.chuva, uv: w.uv, prox: w.prox.map(x => x.hora) }; })()")
            chk(W and W["f"] == "feed" and W["t"] == 17 and W["min"] == 6 and W["max"] == 21, f"hora de agora (12 h em Roma) e mínima/máxima do dia de Roma, sem a hora de ontem: {W}")
            chk(W and W["h"] == 2 and W["mm"] == 2.8 and W["uv"] == 5 and W["prox"] == [13, 14, 15, 16, 17, 18], f"chuva em 2 horas até a noite (2,8 mm), UV e próximas horas no relógio de Roma: {W}")
            txt = await pg.inner_text(".p-hoje")
            chk("MET Norway · atualizada hoje às 06:47" in txt and "chuva às 15 h e 16 h (2,8 mm)" in txt and "Chuva às 15 h e 16 h (2,8 mm): guarda-chuva" in await pg.inner_text(".hjl") and "pancadas" not in txt.lower()[:0], "painel: fonte, horário da atualização, chuva com as horas e guarda-chuva mesmo com só 2 horas de chuva")
            chk(await pg.locator(".hjhrs > span").count() == 6 and "Tempo lá fora" not in txt and not await pg.evaluate("!!document.querySelector('[data-hjc^=\"clima|\"], [data-hjtemp]')"), "6 próximas horas e nenhum campo para marcar o tempo à mão")
            chk("chuva às 15 h e 16 h" in await pg.inner_text(".hjlead"), "o resumo do topo usa a mesma chuva")
            # uma hora depois o “agora” muda (13 h em Roma)
            r = await pg.evaluate("feedClima(Date.now() + 3600e3).t")
            chk(r == 15, f"uma hora depois, a temperatura de agora é a da hora seguinte ({r})")
            # a tarefa agendada grava uma nova previsão: entra sem recarregar
            await pg.evaluate("""(() => { const f = structuredClone(window.__store['feed/hoje']); f.at = 2000; f.hora = '13:47'; for (const x of f.clima.horas) x.t += 2;
              window.__store['feed/hoje'] = f; return DBH.doc('feed/hoje').update({ at: 2000 }); })()""")
            await pg.wait_for_timeout(500)
            txt = await pg.inner_text(".p-hoje")
            chk("atualizada hoje às 13:47" in txt and "19°" in await pg.inner_text(".hjwx"), "a atualização do banco aparece sem recarregar (13:47, 19°)")
            n_net = len([u for u in reqs if "open-meteo" in u or "met.no" in u])
            chk(n_net == 0, f"com o feed cobrindo a hora, a página não tenta buscar o clima na internet ({n_net} pedidos)")
            # trocar de cidade sem internet: nome da lista em italiano → Turim; cidade da lista → coordenadas; nome livre → só o nome
            async def cidade(nome):
                await pg.click("[data-act=hjcid]"); await pg.fill("#hjci", nome); await pg.click("#hjcf .btn.primary"); await pg.wait_for_timeout(300)
                return await pg.evaluate("S.cfg.cidade")
            c1 = await cidade("torino")
            chk(c1 == {"nome": "Turim", "lat": 45.0705, "lon": 7.6868} and await pg.evaluate("hjClima()?.fonte") == "feed", f"“torino” vira Turim com coordenadas e o clima continua ({c1})")
            c2 = await cidade("Belo Horizonte")
            txt = await pg.inner_text(".p-hoje")
            chk(c2["lat"] == -19.9208 and "A previsão de Belo Horizonte entra na próxima atualização automática" in txt and "A última gravada foi de Turim" in txt and "Tempo em Belo Horizonte" in txt, f"cidade nova: avisa que entra na próxima atualização, sem mostrar o tempo de Turim ({c2})")
            c3 = await cidade("Vila do Conde")
            chk(c3 == {"nome": "Vila do Conde"}, f"nome fora da lista fica só com o nome, para a tarefa localizar ({c3})")
            # a tarefa grava a cidade digitada (localizada pelo nome): vale pelo nome
            await pg.evaluate("""(() => { const f = structuredClone(window.__store['feed/hoje']); f.at = 3000; Object.assign(f.clima, { cidade: 'Vila do Conde', lat: 41.35, lon: -8.74, fuso: 'Europe/Lisbon' });
              window.__store['feed/hoje'] = f; return DBH.doc('feed/hoje').update({ at: 3000 }); })()""")
            await pg.wait_for_timeout(500)
            r = await pg.evaluate("[hjClima()?.fonte, hjClima()?.prox[0].hora]")
            chk(r == ["feed", 12], f"feed da cidade digitada vale pelo nome, com as horas no fuso de Lisboa ({r})")
            # cidade não encontrada pela tarefa
            await cidade("Xyzzy")
            await pg.evaluate("""(() => { const f = structuredClone(window.__store['feed/hoje']); f.erroCidade = 'Xyzzy'; f.erroAt = 4000; window.__store['feed/hoje'] = f; return DBH.doc('feed/hoje').update({ erroAt: 4000 }); })()""")
            await pg.wait_for_timeout(500)
            chk("não encontrou “Xyzzy”" in await pg.inner_text(".p-hoje"), "cidade que a tarefa não achou: o painel diz e indica a lista")
            await cidade("Turim")
            await pg.evaluate(f"(() => {{ window.__store['feed/hoje'] = {{ ...{json.dumps(FEED)}, at: 5000 }}; return DBH.doc('feed/hoje').update({{ at: 5000 }}); }})()"); await pg.wait_for_timeout(400)
            chk(await pg.evaluate("hjClima()?.t") == 17, "de volta a Turim, com o feed de Turim")
            # feed velho (2 dias): explica a atualização automática, sem pedir para marcar à mão
            await pg.evaluate("__clock.shift(2.5 * 86400e3)"); await pg.evaluate("diaVirou(); render()"); await pg.wait_for_timeout(300)
            txt = await pg.inner_text(".p-hoje")
            chk(await pg.evaluate("hjClima()") is None and "já não cobre esta hora" in txt and "6h e às 13h" in txt and "Marque o tempo" not in txt, "feed velho: explica quando a previsão se atualiza, sem pedir o tempo à mão")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"sem rolagem lateral {ov}")
        finally:
            errs = [e for e in errs if "ERR_FAILED" not in e]
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
        # celular, sem feed nenhum: explica, e nada de campo manual
        b, pg, errs = await open_page(p, w=390, cfg={"seedStore": json.dumps({U + "s_cfg": {"at": 1, "v": {"nome": "Teste"}}}), "noNet": True}, hash_="hoje")
        try:
            await pg.wait_for_timeout(900)
            txt = await pg.inner_text(".p-hoje")
            chk("gravada no Atlas automaticamente às 6h e às 13h" in txt and "Tempo lá fora" not in txt, "banco sem feed: explica a atualização automática")
            # o feed chega pela primeira vez com o Hoje aberto
            await pg.evaluate(f"(() => {{ window.__store['feed/hoje'] = {json.dumps(FEED)}; return DBH.doc('feed/hoje').update({{ at: 1000 }}); }})()")
            await pg.wait_for_timeout(500)
            chk("17°" in await pg.inner_text(".hjwx"), "a primeira previsão aparece sem recarregar")
            ov = await overflow(pg); chk(ov[0] <= ov[1], f"390 px sem rolagem lateral {ov}")
        finally:
            errs = [e for e in errs if "ERR_FAILED" not in e]
            for e in errs: print("  ", e)
            if errs: bad += 1
            await b.close()
    print(f"\n{ok} ok, {bad} falhas")

asyncio.run(main())
