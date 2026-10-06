import asyncio, json, sys, base64, pathlib, os
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent
HTML = (ROOT.parent.parent / "atlas-da-vida-2.html").read_text()   # testes/ -> atlas-da-vida-2/ -> app/
CHROME = os.environ.get("CHROMIUM_PATH") or next((str(x) for x in sorted(pathlib.Path("/opt/pw-browsers").glob("chromium-*/chrome-linux/chrome"))), None)
JSPDF = ROOT / "jspdf.umd.min.js"   # opcional: cópia local do jsPDF 2.5.1 para testar o PDF sem internet
SKEL = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui;background:#fafafa}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'

MOCK = r"""
(() => {
  const cfg = window.__MOCKCFG || {};
  window.__saved = []; window.__calls = []; window.__dbw = 0;
  const store = cfg.seedStore ? JSON.parse(cfg.seedStore) : {};
  window.__store = store;
  const listeners = new Set();
  const deepFreeze = o => { if (o && typeof o === "object") { Object.values(o).forEach(deepFreeze); Object.freeze(o); } return o; };
  const snap = (id, d) => ({ id, exists: d !== undefined, data: () => d === undefined ? undefined : deepFreeze(JSON.parse(JSON.stringify(d))), metadata: { fromCache: false, hasPendingWrites: false } });
  const notify = () => { for (const l of [...listeners]) setTimeout(l, 0); };
  const parity = (p, even) => { const n = p.split("/").length; if ((n % 2 === 0) !== even) throw new TypeError("parity " + p + " " + n); };
  const query = (path, filters = [], lim = 1000) => ({ path,
    where(f, op, v) { return query(path, [...filters, [f, op, v]], lim); }, orderBy() { return this; }, limit(n) { return query(path, filters, n); },
    _docs() { const pre = path + "/", depth = path.split("/").length + 1; return Object.keys(store).filter(k => k.startsWith(pre) && k.split("/").length === depth).sort().map(k => snap(k.slice(pre.length), store[k])).filter(d => filters.every(([f, op, v]) => { const x = d.data()[f]; return op === ">=" ? x >= v : op === "==" ? x === v : op === "<=" ? x <= v : op === ">" ? x > v : op === "<" ? x < v : true; })).slice(0, lim); },
    async get() { const docs = this._docs(); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [] }; },
    onSnapshot(next, err) { const run = () => { const docs = this._docs(); next({ docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false } }); }; listeners.add(run); setTimeout(run, 0); return () => listeners.delete(run); },
    doc(id) { parity(path, false); return docRef(path + "/" + (id || Math.random().toString(36).slice(2, 10))); },
    async add(d) { const r = this.doc(); await r.set(d); return r; } });
  const docRef = k => { parity(k, true); return { id: k.split("/").pop(), path: k,
    async set(d) { const s = JSON.stringify(d); if (s.length > 262144) throw { code: "invalid_argument", message: "too big " + s.length }; if (cfg.denyWrite && k.startsWith(cfg.denyWrite)) throw { code: "invalid_argument", message: "denied" }; window.__dbw++; store[k] = JSON.parse(s); notify(); },
    async update(d) { if (!(k in store)) throw { code: "invalid_argument", message: "missing" }; store[k] = { ...store[k], ...JSON.parse(JSON.stringify(d)) }; window.__dbw++; notify(); },
    async delete() { delete store[k]; notify(); }, async get() { return snap(k.split("/").pop(), store[k]); },
    onSnapshot(next) { const run = () => next(snap(k.split("/").pop(), store[k])); listeners.add(run); setTimeout(run, 0); return () => listeners.delete(run); },
    collection(c) { return query(k + "/" + c); } }; };
  const db = { collection: p => { parity(p, false); return query(p); }, doc: p => docRef(p) };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const promptOf = input => Array.isArray(input) ? input.map(t => t.content).join("\n") : String(input);
  async function sample(input, opts = {}) {
    window.__calls.push({ kind: "sample", input, tools: (opts.tools || []).map(t => t.name), tier: opts.modelTier, cache: opts.cache });
    if (Array.isArray(input)) { if (input[0].role !== "user" || input.at(-1).role !== "user") throw { code: "invalid_request", message: "turns must start/end with user" }; }
    if (cfg.sampleError) throw { code: cfg.sampleError, message: "mock" };
    const T = Object.fromEntries((opts.tools || []).map(t => [t.name, t]));
    const ctx = { signal: (new AbortController()).signal };
    let text = "";
    const emit = async chunk => { for (const part of chunk.match(/.{1,40}/gs)) { text += part; opts.onText && opts.onText({ text, delta: part }); await sleep(6); } };
    const P = promptOf(input);
    if (/TAREFA: CARTA DA SEMANA/.test(P)) { await emit("Esta semana mostrou **humor estável** e sono um pouco melhor.\n\n**Para celebrar:** a entrega no prazo.\n\n**Para observar:** as noites tardias.\n\n**Próxima semana:**\n1. Preparar a entrevista: separar 1 hora na segunda."); return { text, truncated: false }; }
    if (/TAREFA: RESUMO MENSAL/.test(P)) { await emit("Mês de entrevistas e estudo; humor oscilou com o sono, e os encontros com amigos ajudaram."); return { text, truncated: false }; }
    if (T.ver_aba && /Você é o Secretário da Vida/.test(P)) {
      const r1 = await T.ver_aba.execute({ aba: "agora" }, ctx); window.__calls.push({ kind: "tool", name: "ver_aba", n: String(r1).length });
      const r2 = await T.consultar_mentor.execute({ mentor: "fin", pergunta: "Como está o orçamento do mês?" }, ctx); window.__calls.push({ kind: "tool", name: "consultar_mentor", r: r2 });
      await emit("Olhei o **Agora** e falei com o Mentor do Dinheiro: o orçamento de restaurantes estourou.\n\n");
      await T.propor.execute({ tipo: "lembrete", titulo: "Revisar o orçamento", quando: "2026-12-01T18:00", motivo: "restaurantes acima do teto" }, ctx);
      await T.levantar_conflito.execute({ titulo: "Treino ou estudo às 18h?", contexto: "Os dois blocos disputam o mesmo horário.", opcoes: ["Treino", "Estudo"] }, ctx);
      await emit("Proponho um lembrete e preciso que você decida o horário das 18h.");
      return { text, truncated: false };
    }
    if (T.consultar) { try { const r = await T.consultar.execute({ metrica: "sono", meses: 6 }, ctx); window.__calls.push({ kind: "tool", name: "consultar", r }); } catch (e) { window.__calls.push({ kind: "toolerr", name: "consultar", m: String(e.message || e) }); } }
    if (T.cruzar) { try { const r = await T.cruzar.execute({ x: "sono", y: "bem" }, ctx); window.__calls.push({ kind: "tool", name: "cruzar", r }); } catch (e) { window.__calls.push({ kind: "toolerr", name: "cruzar", m: String(e.message || e) }); } }
    if (T.buscar_diario) { const r = await T.buscar_diario.execute({ tema: "financas" }, ctx); window.__calls.push({ kind: "tool", name: "buscar_diario", n: r.length }); }
    await emit("Olhei seus números do mês. **Restaurantes** passou do teto e o sono médio ficou em 7 h.\n\n");
    if (T.salvar_memoria) await T.salvar_memoria.execute({ tipo: "compromisso", texto: "Testar teto semanal de € 25 em restaurantes (teste automatizado)" }, ctx);
    if (T.atualizar_plano) await T.atualizar_plano.execute({ foco: "Fechar o mês dentro do orçamento", passos: [{ texto: "Teto semanal de € 25", prazo: "2026-10-20" }, { texto: "Revisar assinaturas" }] }, ctx);
    if (T.propor) await T.propor.execute({ tipo: "tarefa", titulo: "Cancelar assinatura de leitura", prazo: "2026-10-09", prioridade: "Média", detalhes: "Uso baixo" }, ctx);
    if (T.recado) await T.recado.execute({ para: "laz", texto: "Lazer com teto de € 25/semana em restaurantes" }, ctx);
    await emit("- Defina um teto semanal\n- Cancele o que não usa\n\nGuardei o compromisso na memória.");
    if (!opts.tools) await emit('\n```atlas\n{"memorias":[{"tipo":"ideia","texto":"Fallback: ideia salva"}],"propostas":[{"tipo":"habito","titulo":"Cozinhar domingo","vezes_por_semana":1}]}\n```');
    return { text, truncated: false, modelTierApplied: opts.modelTier || "default" };
  }
  sample.limits = async () => cfg.noTools ? { maxPromptBytes: 262144 } : { maxPromptBytes: 262144, tools: { maxCount: 10 } };
  sample.json = async (input, opts = {}) => {
    window.__calls.push({ kind: "json", input, tier: opts.modelTier });
    if (cfg.sampleError) throw { code: cfg.sampleError, message: "mock" };
    const P = promptOf(input); await sleep(10);
    if (/TAREFA: CAPTURA/.test(P)) return { data: (P.match(/Dia do relato, salvo indicação no texto: (\d{4}-\d{2}-\d{2})/) || [])[1], entrada: "Almocei com @Marco e falamos da entrevista. Corri 30 minutos no parque.", comandos: ["/gasto 22 Restaurantes & cafés: almoço com Marco", "/treino Corrida 30", "/contato @Marco Encontro", "/comando_inexistente 3"], duvidas: ["Quanto tempo durou o almoço?"] };
    if (/TAREFA: BUSCA NO DIARIO/.test(P)) { const ids = [...P.matchAll(/- id (\S+) ·/g)].map(m => m[1]); return { resposta: "Das outras vezes, você se sentiu assim em semanas de prazo apertado e pouco sono.", entradas: [...ids.slice(0, 3).map(id => ({ id, motivo: "mesma sensação de solidão" })), { id: "inventado", motivo: "não existe" }] }; }
    if (/TAREFA: CAPITULOS/.test(P)) { const ids = [...P.matchAll(/- id (p:\S+?):/g)].map(m => m[1]); return { capitulos: ids.map((id, i) => ({ id, titulo: "Fase teste " + (i + 1), frase: "Frase gerada no teste." })) }; }
    return {};
  };
  const mcp = {
    async listTools(s) { return { servers: [{ server: "Notion", authStatus: "connected", tools: [{ name: "notion-search", description: "" }, { name: "notion-fetch", description: "" }, { name: "notion-create-pages", description: "" }, { name: "notion-update-page", description: "" }] }] }; },
    async callTool(server, tool, input) { window.__calls.push({ kind: "mcp", server, tool, input });
      if (server === "Google Calendar") {
        if (cfg.gcalError) throw { code: cfg.gcalError, message: "mock" };
        const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
        if (tool === "list_events") return { content: [], payload: input.pageToken ? { events: [{ id: "g3", summary: "Dentista", status: "confirmed", start: { dateTime: day(3) + "T10:00:00+02:00" }, end: { dateTime: day(3) + "T11:00:00+02:00" } }] } : { events: [{ id: "g1", summary: "Reunião de projeto", location: "Torino", status: "confirmed", htmlLink: "https://calendar.google.com/x", start: { dateTime: day(1) + "T19:00:00+02:00" }, end: { dateTime: day(1) + "T20:00:00+02:00" } }, { id: "g2", summary: "Viagem", status: "confirmed", start: { date: day(5) + "T00:00:00Z" }, end: { date: day(8) + "T00:00:00Z" } }, { id: "gx", summary: "cancelado", status: "cancelled", start: { date: day(2) } }], nextPageToken: "p2" } };
        if (tool === "create_event") return { content: [], payload: { id: "new" + Math.random().toString(36).slice(2, 6) } };
      }
      if (cfg.mcpError) throw { code: cfg.mcpError, message: "mock" };
      if (tool === "notion-search") return { content: [], payload: { results: [{ id: "pg1", title: "Plano de estudos 2026", url: "https://app.notion.com/p/pg1?pvs=204", type: "page", highlight: "Revisar capítulo 3 de italiano", timestamp: "2026-09-20T10:00:00Z", path: "Estudos" }, { id: "pg2", title: "Ideias de viagem", url: "https://app.notion.com/p/pg2", type: "page", highlight: "Sicília", path: "" }], type: "workspace_search" } };
      if (tool === "notion-fetch") { if (window.__ntPage) return { content: [], payload: { title: "Tarefas do Atlas", url: "https://app.notion.com/p/new1abc", text: "Here is the result\n<page url=\"x\">\n<content>\n" + window.__ntPage + "\n</content>\n</page>" } };
        return { content: [], payload: { metadata: { type: "page" }, title: "Plano de estudos 2026", url: "https://app.notion.com/p/pg1?pvs=204", text: "Here is the result of \"fetch\" for the Page with URL x as of 2026-10-01:\n<page url=\"x\">\n<properties>\n{\"title\":\"Plano\"}\n</properties>\n<content>\n# <mention-page url=\"y\">Plano</mention-page> {color=\"green_bg\"}\nTexto livre do plano.\n\t- [ ] Revisar capítulo 3 até 15/10 !alta\n- [x] Fazer exercícios\n- [ ] Assistir aula 4\n</content>\n</page>" } }; }
      if (tool === "notion-create-pages") { window.__ntPage = input.pages[0].content; return { content: [], payload: { pages: [{ id: "new1", url: "https://app.notion.com/p/new1abc" }] } }; }
      if (tool === "notion-update-page") { if (input.command === "update_content") for (const u of input.content_updates) { if (!window.__ntPage.includes(u.old_str)) throw { code: "tool_error", message: "old_str not found" }; window.__ntPage = window.__ntPage.replace(u.old_str, u.new_str); } else if (input.command === "insert_content") window.__ntPage += "\n" + input.content; return { content: [], payload: { ok: true } }; }
      throw { code: "tool_error", message: "unknown" }; },
    async describeTool() { throw { code: "bad_request" }; }, watchTool() { return () => {}; }, async invalidate() {}, async server() { return {}; } };
  const downloads = { async save({ filename, data }) { let b64 = null; if (data instanceof Blob) { const buf = await data.arrayBuffer(); let s = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); b64 = btoa(s); } else b64 = btoa(unescape(encodeURIComponent(String(data)))); window.__saved.push({ filename, b64 }); return { status: "saved" }; } };
  const uidv = cfg.uid || "u_test";
  const user = { id: async () => uidv, isOwner: async () => true, canEdit: async () => true, can: async () => cfg.canWrite === undefined ? true : cfg.canWrite, me: async () => ({ id: uidv, name: "Teste", avatarUrl: "", color: "#888", email: null, isOwner: true, canEdit: true }),
    profiles: async ids => Object.fromEntries([].concat(ids).map(id => [id, { id, name: id === uidv ? "Teste" : id === "u_partner" ? "Chiara" : "", avatarUrl: "", color: "#888", email: null, isMe: id === uidv, guest: false }])) };
  /* voz: navegador sem Web Speech API (Firefox), reconhecimento simulado, ou página sem permissão de microfone */
  if (cfg.noSR) { try { delete window.webkitSpeechRecognition; delete window.SpeechRecognition; } catch {} window.webkitSpeechRecognition = undefined; window.SpeechRecognition = undefined; }
  if (cfg.fakeSR) { window.__srs = []; class FakeSR { constructor() { window.__srs.push(this); this.lang = ""; this.continuous = false; this.interimResults = false; } start() { this.started = true; window.__sr = this; } stop() { this.onend && this.onend(); } abort() { this.aborted = true; this.onend && this.onend(); } }
    window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = undefined;
    window.__say = (t, fin = true) => { const r = window.__sr; r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: fin })] }); if (fin && !r.continuous) r.onend(); };
    window.__srErr = c => { const r = window.__sr; r.onerror({ error: c }); r.onend(); }; }
  if (cfg.policyNoMic) Object.defineProperty(document, "permissionsPolicy", { value: { allowsFeature: f => f !== "microphone" }, configurable: true });
  const caps = { db, user, sample, mcp, downloads };
  if (!cfg.none) window.claude = { use: async n => (cfg.off || []).includes(n) ? null : caps[n] || null };
})();
"""

async def open_page(p, w=1440, h=900, theme="dark", cfg=None, hash_=""):
    b = await p.chromium.launch(**({"executable_path": CHROME} if CHROME else {}))
    ctx = await b.new_context(viewport={"width": w, "height": h}, color_scheme=theme, ignore_https_errors=True, **({"timezone_id": cfg["tz"]} if cfg and cfg.get("tz") else {}))
    pg = await ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append("CONSOLE " + m.text))
    await pg.add_init_script("window.__MOCKCFG=" + json.dumps(cfg or {}) + ";" + MOCK)
    html = SKEL + HTML + "</body></html>"
    await pg.route("https://atlas.test/", lambda r: r.fulfill(body=html, content_type="text/html"))
    await pg.route("https://cdnjs.cloudflare.com/**", lambda r: r.fulfill(path=str(JSPDF), content_type="application/javascript") if JSPDF.exists() else r.continue_())
    await pg.route("https://fonts.googleapis.com/**", lambda r: r.fulfill(body="", content_type="text/css"))
    if (cfg or {}).get("cjkFont"):  # fonte de pincel dos selos servida localmente (só nas capturas)
        await pg.route("https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng**", lambda r: r.fulfill(body="@font-face{font-family:'Ma Shan Zheng';src:url(https://fonts.test/msz.woff2) format('woff2')}", content_type="text/css"))
        await pg.route("https://fonts.test/msz.woff2", lambda r: r.fulfill(path=str(ROOT / "msz.woff2"), content_type="font/woff2", headers={"access-control-allow-origin": "*"}))
    # internet simulada: clima, câmbio, notícias e geocodificação (cfg.noNet = sem acesso)
    NET = {"api.open-meteo.com": {"current": {"temperature_2m": 18.4, "apparent_temperature": 17.6, "precipitation": 0, "weather_code": 1, "wind_speed_10m": 8}, "daily": {"temperature_2m_max": [24.1], "temperature_2m_min": [11.2], "precipitation_probability_max": [10], "weather_code": [2], "uv_index_max": [5.2]}},
           "api.frankfurter.dev": {"amount": 1.0, "base": "BRL", "date": "2026-10-02", "rates": {"EUR": 0.17062}},
           "api.rss2json.com": {"status": "ok", "items": [{"title": "Teste: cidade planta mil árvores", "link": "https://example.org/a", "pubDate": "2026-10-05 07:00:00", "description": "<p>Resumo do teste.</p>"}, {"title": "Teste: rio volta a ter peixes", "link": "https://example.org/b", "pubDate": "2026-10-04 07:00:00", "description": ""}]},
           "geocoding-api.open-meteo.com": {"results": [{"name": "Milão", "latitude": 45.46, "longitude": 9.19}]}}
    no_net = (cfg or {}).get("noNet")
    for host, body in NET.items():
        await pg.route(f"https://{host}/**", (lambda b: (lambda r: r.abort() if no_net else r.fulfill(body=json.dumps(b), content_type="application/json", headers={"access-control-allow-origin": "*"})))(body))
    await pg.goto("https://atlas.test/" + (("#" + hash_) if hash_ else ""), wait_until="load")
    await pg.wait_for_timeout(900)
    return b, pg, errs

async def overflow(pg):
    return await pg.evaluate("[document.documentElement.scrollWidth, innerWidth]")

PAGES = ["jornada.jardim","rotina.dia","rotina.semana","rotina.mes","mapa","idiomas","fin.futuro","fin.vida","casa.limpeza","casa.compras","casa.contas","casa.docs","carreira.caderno","carreira.rede","painel","carreira.portfolio","carreira.decisoes","carreira.mercado","jornada.praticas","lazer.inicio","lazer.leitura","lazer.filmes","lazer.jogos","lazer.viagens","lazer.cafe","lazer.aviacao","lazer.estudos","lazer.existencial","carreira.panorama","carreira.avaliacao","carreira.objetivos","carreira.geotecnia","carreira.plano","carreira.biblioteca","jornada.inicio","jornada.espiritismo","jornada.meditacao","jornada.taoismo","jornada.budismo","jornada.confluencias","jornada.bussola","jornada.exame","jornada.decidir","jornada.caminhos","jornada.navegante","semana","radar","exp","capitulos","capitulos.livro","dupla","dupla.orcamento","dupla.metas","privacidade","diario.perguntar",'visao', 'hoje', 'diario', 'diario.cal', 'diario.analise', 'mentores', 'mentor.fin', 'mentor.conselho', 'cruz', 'fin.rel', 'fin.lanc', 'fin.orc', 'saude.rel', 'saude.checkin', 'hab.rel', 'hab.marcar', 'metas.rel', 'metas.lista', 'metas.tarefas', 'pessoas.rel', 'pessoas.lista', 'pessoas.contatos', 'cresc.rel', 'cresc.aprend', 'cresc.lazer', 'casa', 'roda', 'dados', 'dados.saude', 'dados.diario', 'integ', 'ajustes', 'fin.diario', 'saude.diario', 'hab.diario', 'metas.diario', 'pessoas.diario', 'cresc.diario', 'casa.diario', 'roda.diario', 'roda.roda', 'casa.painel']
