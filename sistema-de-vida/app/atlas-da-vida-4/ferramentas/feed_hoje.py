"""Monta o documento feed/hoje do Atlas da Vida: previsão hora a hora (MET Norway), notícias boas e câmbio BRL→EUR (BCE).
A página do Atlas não tem internet; quem roda este script grava a saída no banco do Atlas (a tarefa agendada que fazia isso duas vezes por dia foi desligada em 18/10/2026).
uso: python3 feed_hoje.py [cidade.json] [feed_anterior.json] > novo.json
  cidade.json: {"nome": "Turim", "lat": 45.07, "lon": 7.69} (lat/lon opcionais: sem eles, a cidade é localizada pelo nome),
    ou o documento s_cfg do Atlas inteiro (a cidade sai de v.cidade; sem cidade, Turim)
  feed_anterior.json: o feed/hoje atual (opcional): as horas já passadas de hoje vêm dele, para a mínima e a máxima do dia ficarem completas.
Só o clima é obrigatório: notícias e câmbio que falharem ficam de fora (e o que havia no feed anterior é mantido).
Saída: um objeto para gravar com "update" (mescla). Cidade não localizada: só {"erroCidade", "erroAt"} (o clima anterior fica).
Clima indisponível: sai com código 1 e não imprime nada (não grave nada)."""
import json, sys, time, datetime, zoneinfo, urllib.request, urllib.parse, re, html, subprocess
from xml.etree import ElementTree as ET

UA = "atlas-da-vida/1.0 github.com/viniciusbrm/teste"
def get(url, t=40):
    """curl primeiro (no contêiner o Python às vezes não fecha o TLS com alguns hosts), urllib se o curl falhar"""
    try:
        r = subprocess.run(["curl", "-sS", "--fail", "-L", "-m", str(t), "-A", UA, url], capture_output=True, timeout=t + 5)
        if r.returncode == 0 and r.stdout: return r.stdout
    except Exception: pass
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=t).read()
def ler(p):
    try: return json.load(open(p)) if p else None
    except Exception: return None

cid = ler(sys.argv[1] if len(sys.argv) > 1 else None) or {}
if isinstance(cid.get("v"), dict): cid = cid["v"].get("cidade") or {}      # documento s_cfg do Atlas
ant = ler(sys.argv[2] if len(sys.argv) > 2 else None) or {}
ant = ant.get("v", ant) if isinstance(ant.get("v"), dict) else ant      # aceita o documento cru ou só os campos
nome = (cid.get("nome") or "Turim").strip()
lat, lon, fuso = cid.get("lat"), cid.get("lon"), cid.get("fuso")

# cidade: coordenadas e fuso pelo nome (Open-Meteo geocoding); sem resposta, fuso pelas coordenadas; por fim, Roma
def geo(q):
    j = json.loads(get("https://geocoding-api.open-meteo.com/v1/search?" + urllib.parse.urlencode({"name": q, "count": 1, "language": "pt"}), 20))
    return (j.get("results") or [None])[0]
if lat is None or lon is None or not fuso:
    try:
        g = geo(nome)
        if g and (lat is None or lon is None or (abs(g["latitude"] - lat) < .3 and abs(g["longitude"] - lon) < .3)):
            lat = g["latitude"] if lat is None else lat; lon = g["longitude"] if lon is None else lon; fuso = fuso or g.get("timezone")
    except Exception: pass
if lat is None or lon is None:
    if nome.lower() in ("turim", "torino", "turin"): lat, lon = 45.0705, 7.6868
    else:
        print(json.dumps({"erroCidade": nome, "erroAt": int(time.time() * 1000)}, ensure_ascii=False)); sys.exit(0)
if not fuso:
    try: fuso = json.loads(get(f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m&timezone=auto", 20)).get("timezone")
    except Exception: pass
fuso = fuso or "Europe/Rome"
TZ = zoneinfo.ZoneInfo(fuso)

# previsão hora a hora (parte com next_1_hours: cerca de 60 horas)
try: j = json.loads(get(f"https://api.met.no/weatherapi/locationforecast/2.0/complete?lat={lat:.4f}&lon={lon:.4f}"))
except Exception as e: sys.exit(f"MET Norway indisponível: {e}")
WMO = {"clearsky": 0, "fair": 1, "partlycloudy": 2, "cloudy": 3, "fog": 45, "lightrain": 61, "rain": 63, "heavyrain": 65,
       "lightrainshowers": 80, "rainshowers": 81, "heavyrainshowers": 82, "lightsleet": 66, "sleet": 67, "heavysleet": 67,
       "lightsleetshowers": 66, "sleetshowers": 67, "heavysleetshowers": 67, "lightsnow": 71, "snow": 73, "heavysnow": 75,
       "lightsnowshowers": 85, "snowshowers": 85, "heavysnowshowers": 86}
def wmo(sym):
    if not sym: return None
    base = sym.split("_")[0]
    return 95 if "thunder" in base else WMO.get(base, 3)
horas = []
for t in j["properties"]["timeseries"]:
    n1 = t["data"].get("next_1_hours")
    if not n1: continue
    d = t["data"]["instant"]["details"]
    horas.append({"h": t["time"], "t": round(d["air_temperature"], 1), "sens": round(d.get("apparent_air_temperature", d["air_temperature"]), 1),
                  "code": wmo(n1["summary"].get("symbol_code")), "vento": round(d.get("wind_speed", 0) * 3.6),
                  "uv": d.get("ultraviolet_index_clear_sky"), "mm": n1.get("details", {}).get("precipitation_amount", 0)})
if not horas: sys.exit("a MET Norway não mandou horas")

# horas já passadas de hoje, do feed anterior da mesma cidade
agora = datetime.datetime.now(TZ); hoje = agora.strftime("%Y-%m-%d")
quando = lambda h: datetime.datetime.fromisoformat(h.replace("Z", "+00:00"))
ca = (ant.get("clima") or {})
if ca.get("horas") and ca.get("lat") is not None and abs(ca["lat"] - lat) < .2 and abs(ca["lon"] - lon) < .2:
    ini = quando(horas[0]["h"])
    velhas = [x for x in ca["horas"] if quando(x["h"]) < ini and quando(x["h"]).astimezone(TZ).strftime("%Y-%m-%d") == hoje]
    horas = velhas + horas

# números do dia (a página recalcula pela hora atual; estes servem a versões antigas da página)
dia = [x for x in horas if quando(x["h"]).astimezone(TZ).strftime("%Y-%m-%d") == hoje] or horas[:24]
claro = [x for x in dia if 7 <= quando(x["h"]).astimezone(TZ).hour <= 22] or dia
chuvosas = [x for x in claro if (x["mm"] or 0) >= .1 or (x["code"] or 0) >= 51]
cur = min(horas, key=lambda x: abs((quando(x["h"]) - agora).total_seconds()))
out = {"dia": hoje, "at": int(time.time() * 1000), "hora": agora.strftime("%H:%M"), "fonte": "MET Norway (yr.no)", "erroCidade": "",
       "clima": {"lat": round(lat, 4), "lon": round(lon, 4), "cidade": nome, "fuso": fuso, "t": cur["t"], "sens": cur["sens"], "code": cur["code"], "vento": cur["vento"],
                 "max": max(x["t"] for x in dia), "min": min(x["t"] for x in dia), "codeD": max((x["code"] or 0) for x in claro),
                 "chuva": round(100 * len(chuvosas) / len(claro)), "chuvaMm": round(sum(x["mm"] or 0 for x in dia), 1),
                 "uv": max((x["uv"] or 0) for x in dia), "horas": horas[:90]}}

# notícias boas: alterna as duas fontes, como a página faz
def rss(src, url):
    root = ET.fromstring(get(url, 25)); itens = []
    for it in root.iter("item"):
        t = html.unescape(it.findtext("title") or "").strip(); link = (it.findtext("link") or "").strip()
        d = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(it.findtext("description") or ""))).strip()[:180]
        try: data = datetime.datetime.strptime((it.findtext("pubDate") or "")[:25].strip(), "%a, %d %b %Y %H:%M:%S").strftime("%Y-%m-%d")
        except Exception: data = ""
        if t and link.startswith("http"): itens.append({"src": src, "t": t, "link": link, "data": data, "d": d})
        if len(itens) >= 4: break
    return itens
try:
    todas = []
    for src, url in (("Positive News", "https://www.positive.news/feed/"), ("Good News Network", "https://www.goodnewsnetwork.org/feed/")):
        try: todas += rss(src, url)
        except Exception: pass
    todas.sort(key=lambda x: x["data"], reverse=True); pick = []
    for src in ("Positive News", "Good News Network", "Positive News"):
        x = next((i for i in todas if i["src"] == src and i not in pick), None)
        if x: pick.append(x)
    if pick: out["news"] = pick
except Exception: pass
if "news" not in out and ant.get("news"): out["news"] = ant["news"]

# câmbio: quanto vale 1 real em euros, pela taxa de referência do BCE
try:
    x = get("https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml", 20).decode()
    brl = float(re.search(r"currency=['\"]BRL['\"] rate=['\"]([\d.]+)", x).group(1)); data = re.search(r"time=['\"](\d{4}-\d\d-\d\d)", x).group(1)
    out["cot"] = {"rate": round(1 / brl, 6), "data": data}
except Exception:
    if ant.get("cot"): out["cot"] = ant["cot"]

print(json.dumps(out, ensure_ascii=False))
