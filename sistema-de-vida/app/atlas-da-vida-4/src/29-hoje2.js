/* ================================================================ Hoje: resumo do momento
   Clima (MET Norway, gravado no Atlas por ferramentas/feed_hoje.py) com o que vestir e o que dá para fazer, 2–3 notícias positivas (Positive News e Good News Network),
   uma frase escolhida pelo horário e pelo que o dia está pedindo, e ideias para sair da rotina filtradas por clima, energia, tempo e dinheiro.
   Sem internet nesta visualização, clima, notícias e câmbio vêm do doc feed/hoje; sem ele, as notícias viram links. As respostas ficam em S.hojeCtx[dia]. */
const HJ = { wx: null, wxSt: "", news: null, newsSt: "", skip: new Set(), fr: 0 };
const hctx = () => (S.hojeCtx[TODAY] ||= {});
const periodo = () => { const h = new Date().getHours(); return h < 12 ? "manha" : h < 18 ? "tarde" : "noite"; };
/* a página pode não ter acesso à internet: cada busca desiste em 7 s */
async function fetchT(u, ms = 7000) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { return await fetch(u, { signal: c.signal }); } finally { clearTimeout(t); } }
/* feed do dia (doc compartilhado feed/hoje): ferramentas/feed_hoje.py grava a previsão hora a hora da MET Norway para a cidade
   escolhida, as notícias boas e o câmbio do BCE. A atualização agendada foi desligada (custo zero): o doc só muda quando o script
   roda. A página não alcança a internet: lê o doc, escuta as mudanças (entram sem recarregar) e escolhe nas horas gravadas a hora
   de agora, no fuso da cidade. */
let FEED = null, FEED_ST = "", FEED_P = null;
const FEED_OFF = "a atualização automática está desligada";
function hjFeed() {
  if (FEED_P) return FEED_P;
  if (!DBH) { if (LOADED) { FEED_ST = "ok"; FEED_P = Promise.resolve(); } return Promise.resolve(); }
  FEED_ST = "load";
  return FEED_P = new Promise(res => {
    const pega = d => { let v = null; try { v = d?.exists ? JSON.parse(JSON.stringify(d.data())) : null; } catch {} v = v && v.dia ? v : null;
      const mudou = (v?.at || 0) !== (FEED?.at || 0) || (v?.erroAt || 0) !== (FEED?.erroAt || 0) || FEED_ST !== "ok"; FEED = v; FEED_ST = "ok"; res(); if (mudou && PAGE === "hoje") render(); };
    const uma = () => DBH.doc("feed/hoje").get().then(pega, () => { FEED_ST = "ok"; res(); });
    try { DBH.doc("feed/hoje").onSnapshot(pega, () => uma()); } catch { uma(); }
    setTimeout(() => { if (FEED_ST === "load") { FEED_ST = "ok"; res(); if (PAGE === "hoje") render(); } }, 9000);
  });
}
const feedFresco = () => FEED && diff(TODAY, FEED.dia) <= 1;
const PER_TXT = { manha: "manhã", tarde: "tarde", noite: "noite" };
const cidade = () => S.cfg.cidade?.nome ? S.cfg.cidade : { nome: "Turim", lat: 45.0705, lon: 7.6868 };
const WMO = c => c === 0 ? ["Céu limpo", "sun"] : c <= 2 ? ["Poucas nuvens", "sun"] : c === 3 ? ["Nublado", "wave"] : c <= 48 ? ["Neblina", "wave"] : c <= 57 ? ["Garoa", "wave"] : c <= 67 ? ["Chuva", "wave"] : c <= 77 ? ["Neve", "star"] : c <= 82 ? ["Pancadas de chuva", "wave"] : c <= 86 ? ["Neve", "star"] : ["Temporal", "bolt"];
const normNome = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
/* dia e hora de um instante no fuso da cidade (o aparelho pode estar em outro fuso) */
const FUSO_FMT = {};
function diaHoraEm(ms, tz) {
  try { const f = FUSO_FMT[tz] ||= new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }), p = {};
    for (const x of f.formatToParts(ms)) p[x.type] = x.value; return [`${p.year}-${p.month}-${p.day}`, +p.hour % 24]; }
  catch { const d = new Date(ms); return [`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, d.getHours()]; }
}
/* o feed vale para a cidade escolhida: pelas coordenadas, ou pelo nome quando a cidade foi digitada fora da lista */
function feedDaCidade() {
  const C = FEED?.clima, cid = cidade(); if (!C?.horas?.length) return null;
  return (cid.lat != null && C.lat != null ? Math.abs(C.lat - cid.lat) < .2 && Math.abs(C.lon - cid.lon) < .2 : normNome(C.cidade) === normNome(cid.nome)) ? C : null;
}
/* agora = a hora gravada que contém este instante; mínima e máxima = horas de hoje; chuva = horas com chuva daqui até as 22 h */
function feedClima(now = Date.now()) {
  const C = feedDaCidade(); if (!C) return null;
  const tz = C.fuso || "Europe/Rome", H = C.horas.map(x => ({ ...x, ms: Date.parse(x.h) })).filter(x => isFinite(x.ms) && isNum(x.t)).sort((a, b) => a.ms - b.ms);
  if (!H.length) return null;
  const cur = H.find(x => x.ms <= now && now < x.ms + 3600e3) || H.reduce((b, x) => Math.abs(x.ms + 1800e3 - now) < Math.abs(b.ms + 1800e3 - now) ? x : b);
  if (Math.abs(cur.ms + 1800e3 - now) > 2 * 3600e3) return null;   /* as horas gravadas não cobrem agora */
  const hoje = diaHoraEm(now, tz)[0], dia0 = H.filter(x => diaHoraEm(x.ms, tz)[0] === hoje), dia = dia0.length ? dia0 : [cur];
  const vem = dia.filter(x => x.ms + 3600e3 > now), claro = vem.filter(x => { const h = diaHoraEm(x.ms, tz)[1]; return h >= 7 && h <= 22; }), base = claro.length ? claro : vem.length ? vem : [cur];
  const chov = base.filter(x => (+x.mm || 0) >= .1 || (x.code || 0) >= 51), mm = Math.round(base.reduce((a, x) => a + (+x.mm || 0), 0) * 10) / 10, codeD = Math.max(...base.map(x => x.code || 0));
  /* “chuva” do feed não é probabilidade: é a escala de 0 a 100 que as regras de roupa e de atividade usam (0 seco, 40 pouca, 70 bastante) */
  return { fonte: "feed", t: cur.t, sens: cur.sens ?? cur.t, max: Math.max(...dia.map(x => x.t)), min: Math.min(...dia.map(x => x.t)), chuva: !chov.length ? 0 : mm >= 2 || chov.length >= 3 ? 70 : 40, hChuva: chov.length, hrsChuva: chov.map(x => diaHoraEm(x.ms, tz)[1]), mm,
    uv: Math.max(0, ...dia.map(x => +x.uv || 0)), vento: cur.vento || 0, txt: WMO(cur.code ?? 3)[0], txtD: codeD >= 51 && codeD !== cur.code ? WMO(codeD)[0].toLowerCase() : "", ico: WMO(cur.code ?? 3)[1], code: Math.max(cur.code ?? 0, codeD),
    h: cur.h, tz, prox: H.filter(x => x.ms > cur.ms).slice(0, 6).map(x => ({ ...x, hora: diaHoraEm(x.ms, tz)[1] })) };
}
/* busca direta (Open-Meteo): só serve quando o Atlas é aberto fora do claude.ai, onde a página tem internet, e o feed não cobre agora */
async function hjWeather(force) {
  if (HJ.wxSt === "load" || (!force && (HJ.wx?.dia === TODAY || HJ.wxSt === "err"))) return;
  const C = cidade(); if (!extOk("clima") || C.lat == null) { HJ.wxSt = "err"; return; }
  try { const v = JSON.parse(localStorage.getItem("atlas_wx") || "null"); if (!force && v?.dia === TODAY && v.at > Date.now() - 3 * 3600e3 && v.lat === C.lat) { HJ.wx = v; return; } } catch {}
  HJ.wxSt = "load";
  try { const r = await fetchT(`https://api.open-meteo.com/v1/forecast?latitude=${C.lat}&longitude=${C.lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max&timezone=auto&forecast_days=1`);
    if (!r.ok) throw 0; const j = await r.json(); if (!j?.current || !j?.daily) throw 0;
    HJ.wx = { dia: TODAY, at: Date.now(), lat: C.lat, t: j.current.temperature_2m, sens: j.current.apparent_temperature, code: j.current.weather_code, vento: j.current.wind_speed_10m, max: j.daily.temperature_2m_max[0], min: j.daily.temperature_2m_min[0], chuva: j.daily.precipitation_probability_max[0], codeD: j.daily.weather_code[0], uv: j.daily.uv_index_max[0] };
    HJ.wxSt = "ok"; try { localStorage.setItem("atlas_wx", JSON.stringify(HJ.wx)); } catch {}
  } catch { HJ.wxSt = "err"; }
  if (PAGE === "hoje") render();
}
/* a hora vira e o “agora” muda junto: o Hoje redesenha na virada da hora da previsão, sem atrapalhar quem está digitando */
setInterval(() => { if (PAGE !== "hoje" || document.hidden || !FEED) return; if ((feedClima()?.h || "") === HJ.wxK) return; const a = document.activeElement; if (a?.matches?.("input,textarea,select,[contenteditable]") || $("dialog[open]")) return; render(); }, 60e3);
async function hjNews() {
  if (HJ.newsSt) return; HJ.newsSt = "load";
  if (!extOk("noticias")) { HJ.news = null; HJ.newsSt = "err"; HJ.newsSrc = ""; return; }
  try { const v = JSON.parse(localStorage.getItem("atlas_news") || "null"); if (v?.dia === TODAY && v.items?.length) { HJ.news = v.items; HJ.newsSt = "ok"; return; } } catch {}
  const feeds = [["Positive News", "https://www.positive.news/feed/"], ["Good News Network", "https://www.goodnewsnetwork.org/feed/"]], out = [];
  await Promise.all(feeds.map(async ([src, u]) => { try { const r = await fetchT("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(u)); if (!r.ok) return; const j = await r.json(); for (const it of (j.items || []).slice(0, 4)) out.push({ src, t: String(it.title || "").replace(/&#8217;/g, "’").replace(/&#8216;/g, "‘").replace(/&amp;/g, "&").replace(/&#8211;/g, "–"), link: it.link, data: String(it.pubDate || "").slice(0, 10), d: String(it.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) }); } catch {} }));
  const items = out.filter(x => x.t && /^https?:/.test(x.link || "")).sort((a, b) => b.data.localeCompare(a.data));
  /* alterna as fontes para não vir tudo de uma */
  const pick = []; for (const src of ["Positive News", "Good News Network", "Positive News"]) { const x = items.find(i => i.src === src && !pick.includes(i)); if (x) pick.push(x); }
  HJ.news = pick.length ? pick : null; HJ.newsSt = pick.length ? "ok" : "err"; HJ.newsSrc = pick.length ? "net" : "";
  if (pick.length) try { localStorage.setItem("atlas_news", JSON.stringify({ dia: TODAY, items: pick })); } catch {}
  if (PAGE === "hoje") render();
}
/* o tempo: do feed gravado no Atlas; fora do claude.ai, da internet. Não há mais tempo marcado à mão. */
function hjClima() {
  const f = feedClima(); if (f) return f;
  const w = HJ.wx?.dia === TODAY && HJ.wx.lat === cidade().lat ? HJ.wx : null;
  if (w) { const [txt] = WMO(w.codeD ?? w.code); return { fonte: "net", t: w.t, sens: w.sens, max: w.max, min: w.min, chuva: w.chuva, uv: w.uv, vento: w.vento, txt, ico: WMO(w.code)[1], code: w.codeD ?? w.code }; }
  return null;
}
/* chuva em palavras: o feed diz em quantas horas chove até a noite; a busca direta dá a probabilidade */
const listaH = hs => { const t = hs.map(h => `${h} h`); return t.length > 1 ? `${t.slice(0, -1).join(", ")} e ${t.at(-1)}` : t[0] || ""; };
const quandoChove = W => W.hChuva <= 4 ? `às ${listaH(W.hrsChuva)}` : `em ${W.hChuva} horas até a noite`;
const chuvaTxt = W => W.fonte === "feed" ? (W.hChuva ? `chuva ${quandoChove(W)} (${num(W.mm, 1)} mm)` : "sem chuva até a noite") : `chuva ${W.chuva}%`;
function hjRoupa(W) {
  const s = W.sens ?? W.t, out = [];
  out.push(s < 3 ? "Casaco pesado, cachecol e luvas; camada térmica por baixo." : s < 10 ? "Casaco de inverno ou jaqueta forrada com suéter." : s < 16 ? "Jaqueta leve ou suéter; sapato fechado." : s < 22 ? "Manga longa leve, ou camiseta com um casaco na mochila." : s < 28 ? "Roupa leve; um casaco fino só se for voltar tarde." : "Roupa leve e clara, água sempre à mão.");
  if (W.max - W.min >= 10) out.push(`Diferença de ${num(W.max - W.min, 0)}° entre manhã e tarde: vá em camadas.`);
  if (W.fonte === "feed") { if (W.hChuva) out.push(`Chuva ${quandoChove(W)} (${num(W.mm, 1)} mm): ${W.chuva >= 70 ? "guarda-chuva e sapato que aguente água" : "guarda-chuva pequeno na mochila"}.`); }
  else if (W.chuva >= 50) out.push(`Chuva provável (${W.chuva}%): guarda-chuva e sapato que aguente água.`); else if (W.chuva >= 30) out.push(`Chance de chuva de ${W.chuva}%: guarda-chuva pequeno na mochila.`);
  if (W.uv >= 6) out.push(`UV ${num(W.uv, 0)}: protetor solar se ficar ao ar livre entre 11 h e 16 h.`);
  if (W.vento >= 30) out.push(`Vento forte (${num(W.vento, 0)} km/h).`);
  return out;
}
function hjAtiv(W) {
  const bom = W.chuva < 30 && W.t >= 10 && W.t <= 28 && W.code < 51, quente = W.max >= 30;
  return bom ? `Dia bom para ficar fora: caminhar, pedalar ou almoçar ao ar livre${quente ? ", evitando o sol entre 12 h e 16 h" : ""}.` : W.chuva >= 50 ? "Melhor planejar algo em lugar fechado; se for sair, aproveite as janelas sem chuva." : quente ? "Calor forte: atividades cedo de manhã ou depois das 18 h." : W.t < 5 ? "Frio: ao ar livre, só caminhadas curtas e bem agasalhado." : "Tempo instável: tenha um plano B em lugar fechado.";
}
/* frases: verificadas na fonte, escolhidas pelo período e pelo que o dia pede */
const FRASES = [
  ["Ao amanhecer, quando te custa levantar, tem presente este pensamento: levanto-me para a obra do homem.", "Marco Aurélio, Meditações V.1", ["manha"], ["cansaco", "rotina"]],
  ["Não é que tenhamos pouco tempo, mas desperdiçamos muito.", "Sêneca, Sobre a brevidade da vida", ["manha", "tarde"], ["foco", "rotina"]],
  ["Enquanto adiamos, a vida passa.", "Sêneca, Cartas a Lucílio, 1", ["manha", "tarde"], ["foco"]],
  ["Não são as coisas que perturbam as pessoas, mas as opiniões que elas têm sobre as coisas.", "Epicteto, Manual, 5", ["tarde", "noite"], ["estresse"]],
  ["Primeiro diga a si mesmo quem você quer ser; depois faça o que tem de fazer.", "Epicteto, Discursos III.23", ["manha"], ["foco", "recomeco"]],
  ["Cercare e saper riconoscere chi e cosa, in mezzo all'inferno, non è inferno, e farlo durare, e dargli spazio.", "Italo Calvino, As cidades invisíveis", ["tarde", "noite"], ["estresse", "solidao"]],
  ["Non si ricordano i giorni, si ricordano gli attimi.", "Cesare Pavese, Il mestiere di vivere", ["noite", "tarde"], ["rotina"]],
  ["Para ser grande, sê inteiro: nada teu exagera ou exclui.", "Ricardo Reis (Fernando Pessoa)", ["manha", "tarde"], ["foco", "coragem"]],
  ["O correr da vida embrulha tudo; a vida é assim: esquenta e esfria, aperta e daí afrouxa, sossega e depois desinquieta. O que ela quer da gente é coragem.", "Guimarães Rosa, Grande Sertão: Veredas", ["manha", "tarde", "noite"], ["coragem", "estresse", "recomeco"]],
  ["How we spend our days is, of course, how we spend our lives.", "Annie Dillard, The Writing Life", ["manha", "tarde"], ["rotina", "foco"]],
  ["Tell me, what is it you plan to do with your one wild and precious life?", "Mary Oliver, The Summer Day", ["tarde", "noite"], ["rotina", "recomeco"]],
  ["Meu ofício e minha arte é viver.", "Montaigne, Ensaios II.6", ["noite", "manha"], ["rotina"]],
  ["Tenha paciência com tudo o que não está resolvido no seu coração.", "Rilke, Cartas a um jovem poeta", ["noite"], ["solidao", "estresse", "coragem"]],
  ["Não é pobre quem tem pouco, mas quem deseja mais.", "Sêneca, Cartas a Lucílio, 2", ["manha", "tarde", "noite"], ["dinheiro"]],
  ["Logo terás esquecido tudo; logo todos te terão esquecido.", "Marco Aurélio, Meditações VII.21", ["noite"], ["estresse"]],
];
function hjTema(c) {
  const s = S.saude[TODAY] || {}, sono = s.sono ?? S.saude[addDays(TODAY, -1)]?.sono, atras = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo < TODAY).length + ckMinhas(t => ckOpen(t) && t.prazo && t.prazo < TODAY).length;
  if (+c.humor && +c.humor <= 2) return ["coragem", "o humor está baixo"];
  if (c.energia === "baixa" || (isNum(sono) && sono < 6)) return ["cansaco", isNum(sono) && sono < 6 ? `você dormiu ${num(sono)} h` : "a energia está baixa"];
  if ((s.estresse ?? 0) >= 4) return ["estresse", "o estresse está alto"];
  if (c.grana === "zero") return ["dinheiro", "o dinheiro está curto"];
  if (atras >= 3) return ["foco", `há ${atras} tarefas atrasadas`];
  return ["rotina", ""];
}
function hjFrase(c) {
  const per = periodo(), [tema, porque] = hjTema(c), pool = FRASES.filter(f => f[2].includes(per) && f[3].includes(tema)), all = pool.length ? pool : FRASES.filter(f => f[2].includes(per));
  const seed = [...TODAY].reduce((a, ch) => a + ch.charCodeAt(0), 0), f = all[(seed + HJ.fr) % all.length];
  const tasks = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo <= TODAY).length + ckMinhasAte(TODAY).length;
  const concreto = { cansaco: `Com ${porque}, o dia rende menos: escolha a uma coisa que importa${tasks ? ` entre as ${tasks} que vencem` : ""} e permita-se fazer o resto pela metade.`, estresse: "Antes de responder ao próximo pedido urgente, pergunte o que acontece se ele esperar uma hora.", coragem: "Não precisa ser um bom dia; precisa ter um momento bom. Uma ligação, uma caminhada, uma coisa feita.", dinheiro: "Dias de orçamento curto pedem lazer que não custa: o que você já tem em casa ou na cidade de graça.", foco: `${porque[0]?.toUpperCase() + porque.slice(1)}. Escolha duas, faça antes do almoço e renegocie o prazo das outras.`, rotina: per === "noite" ? "O que valeu a pena hoje? Uma linha no diário guarda isso." : per === "tarde" ? "A tarde é boa para o trabalho que exige menos decisão; deixe as escolhas para amanhã cedo." : "Comece pelo que você vai se orgulhar de ter feito às 18 h." }[tema];
  return { f, concreto, porque };
}
/* ideias para sair da rotina: c custo (0 grátis, 1 até € 10, 2 até € 30), min, out 1 fora / .5 tanto faz / 0 dentro, e energia 1–3 */
const IDEIAS = [
  ["Caminhar no Parco del Valentino até o Borgo Medievale", "Ida e volta pelo rio, sem pressa.", 0, 60, 1, 1, 0, "natureza"],
  ["Subir ao Monte dei Cappuccini no fim da tarde", "A cidade e os Alpes do mirante; vale levar alguém.", 0, 60, 1, 2, 0, "natureza"],
  ["Pedalar pela margem do Pó com bicicleta compartilhada", "Murazzi até o Parco Michelotti e volta.", 1, 60, 1, 2, 0, "movimento"],
  ["Cremalheira Sassi–Superga e a vista da Basílica", "Programa de meio dia; leve um lanche.", 1, 180, 1, 2, 0, "passeio"],
  ["Museo Nazionale del Cinema, na Mole Antonelliana", "Bom para dia de chuva; reserve o elevador panorâmico.", 2, 150, 0, 1, 0, "cultura"],
  ["Mercado de Porta Palazzo: ingredientes para uma receita nova", "De manhã, de segunda a sábado.", 1, 60, .5, 1, 0, "comida", d => d !== 0],
  ["Cozinhar um prato brasileiro e chamar alguém", "Pão de queijo, moqueca ou feijoada pequena: comida que conta de onde você vem.", 1, 120, 0, 2, 1, "comida"],
  ["Videochamada com a família no Brasil", "Brasília está 5 h atrás no horário de verão europeu e 4 h no inverno.", 0, 30, 0, 1, 1, "pessoas"],
  ["Ler 30 minutos num café diferente do bairro", "Um café que você nunca entrou.", 1, 60, .5, 1, 0, "calma"],
  ["Biblioteca civica: pegar um livro em italiano", "Empréstimo gratuito com o cartão da biblioteca.", 0, 60, .5, 1, 0, "calma"],
  ["Alongamento ou yoga com vídeo, 20 minutos", "Na sala, sem equipamento.", 0, 20, 0, 1, 0, "movimento"],
  ["Caminhada de 20 minutos sem celular depois do jantar", "Só andar e olhar.", 0, 20, 1, 1, 0, "calma"],
  ["Voltar do trabalho por outro caminho e descer uma parada antes", "Pequena mudança, rua nova.", 0, 15, 1, 1, 0, "movimento"],
  ["Aperitivo com um colega que você quase não vê", "Também conta para a Rede profissional.", 2, 90, .5, 2, 1, "pessoas"],
  ["Planejar uma escapada curta: Langhe, Sacra di San Michele ou Lago Maggiore", "15 minutos de pesquisa e uma data no calendário.", 0, 15, 0, 1, 0, "passeio"],
  ["Testar um método novo de café (V60, moka, prensa)", "Anote a receita em Lazer › Café.", 0, 20, 0, 1, 0, "calma"],
  ["Exposição pequena: GAM ou Fondazione Sandretto Re Rebaudengo", "Uma ou duas salas, sem querer ver tudo.", 2, 120, 0, 1, 0, "cultura"],
  ["Jogo de tabuleiro ou videogame com alguém", "Em casa, sem tela de trabalho.", 0, 60, 0, 1, 1, "pessoas"],
  ["Trilha fácil no Val di Susa", "Dia inteiro; confira o trem e a previsão na montanha.", 2, 420, 1, 3, 0, "natureza", d => d === 0 || d === 6],
  ["Ouvir um álbum inteiro sem fazer outra coisa", "Fones, luz baixa, 45 minutos.", 0, 45, 0, 1, 0, "calma"],
  ["Aula experimental de algo novo: escalada indoor ou dança", "Muitas academias têm a primeira aula gratuita ou barata.", 2, 90, 0, 3, 0, "movimento"],
  ["Três linhas no diário sobre algo que mudou neste mês", "Dez minutos.", 0, 10, 0, 1, 0, "calma"],
];
const CUSTO_TXT = ["grátis", "até € 10", "até € 30"];
/* tempo livre em minutos; as opções são em horas cheias e o campo “outro” aceita qualquer valor em horas (1, 1,5, 3…) */
const TEMPO_OPT = [[120, "2 h"], [240, "4 h"], [360, "6 h"]];
const GRANA_OPT = [["zero", "nada", 0], ["pouco", "até € 10", 1], ["ok", "até € 30", 2], ["folga", "mais", 2]];
function hjIdeias(c, W) {
  const per = periodo(), dow = parse(TODAY).getDay(), tempo = +c.tempo || 60, gmax = (GRANA_OPT.find(g => g[0] === c.grana) || [0, 0, 1])[2], en = { baixa: 1, media: 2, alta: 3 }[c.energia] || 2, chuva = !!W && (W.chuva >= 50 || W.code >= 61), extremo = !!W && (W.sens < 3 || W.max >= 33);
  const out = [], motivos = [];
  if (chuva) motivos.push("com chuva, saíram as de ar livre"); if (extremo) motivos.push("com temperatura extrema, saíram as longas ao ar livre"); if (gmax === 0) motivos.push("sem dinheiro para lazer, só as gratuitas"); if (en === 1) motivos.push("com energia baixa, só as leves"); if (tempo < 60) motivos.push(`com ${tempo} min, só as curtas`);
  for (const [t, d, cst, min, outd, e, soc, tipo, ok] of IDEIAS) {
    if (HJ.skip.has(t) || min > tempo || cst > gmax || e > en || (ok && !ok(dow))) continue;
    if (outd === 1 && (chuva || (extremo && min > 30))) continue;
    if (per === "noite" && outd === 1 && min > 30) continue;
    let sc = 1; const why = [];
    if (W && !chuva && outd && W.t >= 12 && W.t <= 27) { sc += 2; why.push(`${num(W.t, 0)}° e sem chuva`); }
    if (+c.humor && +c.humor <= 2 && (soc || tipo === "natureza")) { sc += 2; why.push(soc ? "estar com alguém ajuda num dia pesado" : "verde e movimento aliviam o humor"); }
    if (en === 3 && e >= 2) { sc += 1; why.push("energia sobrando"); }
    if (en === 1 && e === 1) { sc += 1; why.push("pede pouca energia"); }
    if (cst === 0) { sc += .5; if (gmax <= 1) why.push("não custa nada"); }
    if (min >= tempo * .4) sc += .5;
    out.push({ t, d, cst, min, outd, tipo, sc: sc + ((t.length * 7 + [...TODAY].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % 10) / 20, why });
  }
  const pick = []; for (const x of out.sort((a, b) => b.sc - a.sc)) { if (pick.length >= 4) break; if (pick.some(p => p.tipo === x.tipo)) continue; pick.push(x); }
  for (const x of out) { if (pick.length >= 3) break; if (!pick.includes(x)) pick.push(x); }
  return { pick, motivos, total: out.length };
}
function hjAsk(c) {
  const mood = [[1, "péssimo"], [2, "mal"], [3, "ok"], [4, "bem"], [5, "ótimo"]], chips = (k, opts) => `<div class="hjch" role="group">${opts.map(([v, l]) => `<button type="button" class="seg" data-hjc="${k}|${v}" aria-pressed="${String(c[k] ?? "") === String(v)}">${l}</button>`).join("")}</div>`;
  const falta = ["humor", "energia", "tempo", "grana"].filter(k => c[k] == null || c[k] === "");
  return `<section class="pn hjask${falta.length ? " pend" : ""}" aria-label="Como você está agora">
    <div class="hjaskh"><b>${ic("mood")}Como você está agora?</b><span class="muted small">${falta.length ? `${falta.length} de 4 sem resposta: o resumo fica genérico nelas` : "Resumo ajustado às suas respostas"} · ${PER_TXT[periodo()]}, ${new Date().toTimeString().slice(0, 5)}</span></div>
    <div class="hjq"><span>Humor</span>${chips("humor", mood)}</div><div class="hjq"><span>Energia</span>${chips("energia", [["baixa", "baixa"], ["media", "média"], ["alta", "alta"]])}</div>
    <div class="hjq"><span>Tempo livre hoje</span>${chips("tempo", TEMPO_OPT)}<label class="hjtemp hjtl">outro<input type="text" inputmode="decimal" data-hjtempo="1" value="${c.tempo && !TEMPO_OPT.some(([v]) => v === +c.tempo) ? String(+c.tempo / 60).replace(".", ",") : ""}" placeholder="h" aria-label="Outro tempo livre, em horas">h</label></div><div class="hjq"><span>Dinheiro para lazer</span>${chips("grana", GRANA_OPT.map(g => [g[0], g[1]]))}</div>
  </section>`;
}
/* primeiros passos: para quem começa do zero (ou acabou de trazer o backup), quatro coisas que fazem o resto do Atlas funcionar.
   Cada uma se marca sozinha quando o dado aparece; some quando as quatro estão feitas ou quando você dispensa. */
function hjPassos() {
  if (!LOADED || IS_EXAMPLE || EX_MODE || S.cfg.passosOk) return "";
  const P = [["bk", "Trazer seus dados do Atlas 3", "lá, Integrações → Exportar → Backup completo; aqui, Integrações → Importar → Restaurar backup", "#integ", S.lanc.length + S.diario.length > 20],
    ["dia", "Registrar o dia no Painel do dia", "sono, humor e uma frase; o resto é opcional", "#painel", Object.keys(S.saude).length > 0],
    ["gasto", "Lançar um gasto", "em Finanças › Lançamentos ou falando no Painel do dia", "#fin.lanc", S.lanc.length > 0],
    ["hab", "Criar um hábito", "em Hábitos, com a meta da semana", "#hab.marcar", S.habitos.length > 0]];
  const feitos = P.filter(p => p[4]).length; if (feitos === P.length) return "";
  return `<section class="pn hjpassos"><header><h2>${ic("flag")}Primeiros passos <small>${feitos} de ${P.length}</small></h2><button type="button" class="lnk" data-act="passosok">Dispensar</button></header>
    <ol class="hjpl">${P.map(([k, t, d, h, ok]) => `<li class="${ok ? "ok" : ""}"><span class="pdrn" aria-label="${ok ? "feito" : "a fazer"}">${ok ? ic("check") : "·"}</span><div><a href="${h}"${ok ? ' tabindex="-1"' : ""}><b>${t}</b></a><small class="muted">${d}</small></div></li>`).join("")}</ol></section>`;
}
function pHoje2(R) {
  hjFeed(); const c = hctx(); if (FEED_ST === "ok" && !feedClima()) hjWeather(); hjNews(); const W = hjClima(); HJ.wxK = W?.h || "";
  const news = HJ.news?.length ? HJ.news : feedFresco() && FEED.news?.length ? FEED.news : null, newsFeed = !HJ.news?.length && !!news;
  const s = S.saude[TODAY] || {}, F = hjFrase(c), I = hjIdeias(c, W);
  const tasks = R.tar.filter(t => t.open && t.prazo && t.prazo <= TODAY).sort((a, b) => a.prazo.localeCompare(b.prazo)), doneToday = R.tar.filter(t => t.status === "Concluída" && t.concluida === TODAY);
  /* as minhas do Cockpit entram junto, marcadas como Trabalho; concluir aqui é o mesmo clique do Cockpit */
  const trab = ckMinhasAte(TODAY), trabFeitas = ckMinhas(t => t.status === "concluída" && t.concluida === TODAY), nVence = tasks.length + trab.length;
  const CC = typeof casaCalc === "function" ? casaCalc() : null, contas = CC ? [...CC.atrasadas, ...CC.prox14.filter(v => v.dias <= 3)] : [];
  const exps = (S.experimentos || []).filter(x => x.status === "ativo" && expSchedule(x)[TODAY] && !(x.desenho === "antes" && expSchedule(x)[TODAY] === "A")), al = radarAlerts().slice(0, 2);
  const fwk = fsTarget(), fpend = parse(TODAY).getDay() <= 1 && S.fechamentos?.[fwk]?.status !== "fechado";
  const reg = [["humor", "humor"], ["sono", "sono"], ["treino", "treino"]].filter(([k]) => s[k] != null && s[k] !== ""), habs = S.habitos.filter(h => S.marks[`${h.id}|${TODAY}`]).length;
  const resumo = [W ? `${num(W.t, 0)}° agora, ${num(W.min, 0)}–${num(W.max, 0)}° no dia, ${W.fonte === "feed" ? chuvaTxt(W) : W.chuva >= 30 ? `${W.chuva}% de chuva` : "sem chuva prevista"}` : "", nVence ? plural(nVence, "tarefa vence até hoje", "tarefas vencem até hoje") : "nenhuma tarefa vencendo", contas.length ? plural(contas.length, "conta da casa para pagar", "contas da casa para pagar") : ""].filter(Boolean).join(" · ");
  return `${hjPassos()}<p class="hjlead">${esc(resumo)}.</p>
    ${hjAsk(c)}
    <div class="g2c hj2">
      ${panel(`${ic(W?.ico || "sun")}Tempo em ${esc(cidade().nome)} <small>${W ? (W.fonte === "feed" ? `MET Norway · atualizada ${FEED.dia === TODAY ? "hoje" : fmtDY(FEED.dia)} às ${esc(FEED.hora || "")}` : "Open-Meteo, agora") : FEED_ST !== "ok" || HJ.wxSt === "load" ? "buscando…" : "aguardando a atualização"}</small>`, W ? `<div class="hjwx"><b>${num(W.t, 0)}°</b><div><span>${esc(W.txt)}${W.txtD ? `; ${esc(W.txtD)} mais tarde` : ""}</span><small>sensação ${num(W.sens, 0)}° · mín ${num(W.min, 0)}° máx ${num(W.max, 0)}° · ${esc(chuvaTxt(W))}${W.uv >= 1 ? ` · UV ${num(W.uv, 0)}` : ""}</small></div></div>${W.prox?.length ? `<div class="hjhrs" aria-label="Próximas horas">${W.prox.map(x => `<span><small>${x.hora}h</small>${ic((x.code ?? 3) <= 2 && (x.hora >= 20 || x.hora < 6) ? "moon" : WMO(x.code ?? 3)[1])}<b>${num(x.t, 0)}°</b>${(+x.mm || 0) >= .1 ? `<small class="hjmm">${num(x.mm, 1)} mm</small>` : ""}</span>`).join("")}</div>` : ""}<div class="flbl">O que vestir</div><ul class="hjl">${hjRoupa(W).map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="flbl">O que o tempo permite</div><p>${esc(hjAtiv(W))}</p>` : `<div class="empty">${esc(hjSemClima())}</div>`, { act: `<button type="button" class="lnk" data-act="hjcid">${ic("globe")}trocar cidade</button>` })}
      ${panel(`${ic("spark")}Para esta ${PER_TXT[periodo()]}`, `<blockquote class="hjq1"><p>${esc(F.f[0])}</p><cite>${esc(F.f[1])}</cite></blockquote><p class="hjconc">${esc(F.concreto)}</p><button type="button" class="lnk" data-act="hjfr">outra frase</button>`)}
      ${panel(`${ic("compass")}Ideias para sair da rotina <small>${I.pick.length} de ${IDEIAS.length}, filtradas pelo seu momento</small>`, `${I.motivos.length ? `<p class="muted small">${esc(I.motivos.join("; "))}.${I.total < 3 ? " Sobraram poucas: é uma limitação real do dia, não falta de opção na cidade." : ""}</p>` : ""}<div class="hjid">${I.pick.map(x => `<article class="hjidc"><b>${esc(x.t)}</b><p>${esc(x.d)}</p><div class="hjidm">${chip(CUSTO_TXT[x.cst])}${chip(x.min >= 60 ? `${num(x.min / 60, x.min % 60 ? 1 : 0)} h` : `${x.min} min`)}${chip(x.outd === 1 ? "ao ar livre" : x.outd ? "dentro ou fora" : "dentro")}</div>${x.why.length ? `<small>Por que hoje: ${esc(x.why.join(", "))}</small>` : ""}<div class="row"><button type="button" class="btn sm" data-hjvou="${esc(x.t)}">${ic("check")}Vou fazer</button><button type="button" class="lnk" data-hjskip="${esc(x.t)}">outra</button></div></article>`).join("") || `<div class="empty">Nenhuma ideia cabe nas respostas de agora. Com mais tempo livre ou orçamento, aparecem opções.</div>`}</div>`, { cls: "span2" })}
      ${panel(`${ic("globe")}Notícias boas <small>jornalismo de soluções, em inglês</small>`, news ? `<div class="hjnews">${news.map(n => `<a class="hjn" href="${esc(n.link)}" target="_blank" rel="noopener"><b>${esc(n.t)}</b>${n.d ? `<span>${esc(n.d)}…</span>` : ""}<small>${esc(n.src)}${n.data ? " · " + fmtDY(n.data) : ""}</small></a>`).join("")}</div>${newsFeed ? `<p class="muted small">Do resumo de ${fmtDY(FEED.dia)} gravado no Atlas.</p>` : ""}` : HJ.newsSt === "load" ? `<div class="empty">Buscando…</div>` : `<div class="empty">Não consegui buscar as notícias nesta visualização. Abra direto: <a class="lnk" href="https://www.positive.news" target="_blank" rel="noopener">Positive News</a> · <a class="lnk" href="https://www.goodnewsnetwork.org" target="_blank" rel="noopener">Good News Network</a> · <a class="lnk" href="https://www.corriere.it/buone-notizie/" target="_blank" rel="noopener">Corriere · Buone Notizie</a></div>`)}
      ${panel(`${ic("mic")}Registro do dia`, `<div class="hjreg">${reg.length || habs ? `${reg.map(([k, l]) => chip(`${l} ${k === "sono" ? num(s[k]) + " h" : k === "treino" ? s[k] : s[k] + "/5"}`, "good")).join("")}${habs ? chip(`${habs}/${S.habitos.length} hábitos`, "good") : ""}` : `<span class="muted">Nada registrado hoje ainda.</span>`}</div><a class="btn sm primary" href="#painel">${ic("mic")}Registrar no Painel do dia</a>`)}
      ${(() => { const bs = rtOcc(TODAY).sort((x, y) => x.a - y.a); return panel(`${ic("cal")}Rotina de hoje <small>${bs.length ? `${bs.filter(b => b.done).length} de ${bs.length} feitos` : "nada planejado"}</small>`, bs.length ? `<div class="list">${bs.map(b => `<div class="li"><label class="ckl"><input type="checkbox" data-rtdone="${b.id}"${b.done ? " checked" : ""}><span class="${b.done ? "done" : ""}"><b style="color:${rtCor(b.cat)}">${b.ini}–${b.fim}</b> ${esc(b.titulo)}</span></label></div>`).join("")}</div>` : `<div class="empty">Planeje o dia em blocos de 30 minutos na aba Rotina.</div>`, { act: `<a class="lnk" href="#rotina.dia">abrir a rotina</a>` }); })()}
      ${fpend ? `<div class="pn fscta span2"><div>${ic("week")}<b>Hora de fechar a semana de ${wkLabel(fwk)}</b><small>Uns 15 minutos.</small></div><a class="btn primary" href="#semana">Fechar a semana</a></div>` : ""}
      ${panel(`${ic("checksq")}Para hoje <small>${nVence ? nVence + " pendente(s)" : "em dia"}</small>`, `${tasks.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}"><span>${esc(t.tarefa)}<small class="st-${t.st}">${t.prazo < TODAY ? `atrasada ${relDay(t.prazo)}` : "vence hoje"}</small></span></label></div>`).join("")}${trab.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-ckdone="${t.id}"><span>${esc(t.titulo)}<small class="st-${t.prazo < TODAY ? "crit" : "warn"}">Trabalho · ${esc(t.cod)} · ${t.prazo < TODAY ? `atrasada ${relDay(t.prazo)}` : "vence hoje"}</small></span></label></div>`).join("")}${doneToday.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}" checked><span class="done">${esc(t.tarefa)}</span></label></div>`).join("")}${trabFeitas.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-ckdone="${t.id}" checked><span class="done">${esc(t.titulo)}<small class="muted">Trabalho · ${esc(t.cod)}</small></span></label></div>`).join("")}${contas.map(v => `<div class="li"><span>${ic("house")}${esc(v.c.conta)} · ${eur(+v.c.valor || 0, 2)}</span>${pill(v.dias < 0 ? "crit" : "warn", v.dias < 0 ? "atrasada" : v.dias === 0 ? "hoje" : `em ${v.dias} d`)}</div>`).join("")}${!tasks.length && !doneToday.length && !contas.length ? `<div class="empty">Nada vencendo hoje.</div>` : ""}${quickBox("hj_tar", "Nova tarefa: Ligar para o banco até sexta !alta", "qtar", "Prazo, prioridade (!alta) e #área são opcionais.")}`)}
      ${panel(`${ic("flag")}Prioridades da semana`, `<div class="prio">${[0, 1, 2].map(i => `<label><span>${i + 1}</span><input id="prio${i}" type="text" data-prio="${i}" value="${esc(S.prio[i] || "")}" placeholder="O que mais importa"></label>`).join("")}</div>`)}
      ${panel(`${ic("cal")}Próximos 7 dias`, agenda(R, 7), { act: S.integ?.gcal?.on ? `<button type="button" class="lnk" data-act="gcsync">${ic("refresh")}Google</button>` : `<a class="lnk" href="#integ">conectar Google Calendar</a>` })}
      ${bmHoje()}${jHoje()}
      ${exps.length ? panel(`${ic("flask")}Experimento de hoje`, exps.map(x => `<div class="hjexp"><b>${esc(x.titulo)}</b>${expToday(x, expAnalyze(x))}</div>`).join("")) : ""}
      ${al.length ? panel(`${ic("radar")}No radar`, al.map(a => alertCard(a, true)).join(""), { act: `<a class="lnk" href="#radar">ver tudo</a>` }) : ""}
    </div>`;
}
function hjClick(t) {
  const ds = t.dataset;
  if (ds.hjc) { const [k, v] = ds.hjc.split("|"), c = hctx(); c[k] = String(c[k]) === v ? "" : (k === "humor" || k === "tempo" ? +v : v); HJ.skip.clear(); touch("hojeCtx", { label: "Como você está", noUndo: true }); return true; }
  if (ds.act === "hjfr") { HJ.fr++; render(); return true; }
  if (ds.hjskip) { HJ.skip.add(ds.hjskip); render(); return true; }
  if (ds.hjvou) { const r = CMD.tarefa.p(`${ds.hjvou} até hoje`, { date: TODAY, area: "Lazer & criatividade" }); if (r.ok) { r.apply(); touch("tarefas", { label: "Ideia do dia" }); undoToast("Virou tarefa de hoje"); } return true; }
  if (ds.act === "hjcid") { hjCidade(); return true; }
  return false;
}
/* por que não há clima agora, em palavras (sem pedir para marcar à mão) */
function hjSemClima() {
  const C = FEED?.clima, nome = cidade().nome;
  if (FEED_ST !== "ok" || HJ.wxSt === "load") return "Buscando a previsão…";
  if (!FEED && !extOk("clima")) return "O clima está desligado em Privacidade › Serviços externos.";
  if (FEED?.erroCidade && normNome(FEED.erroCidade) === normNome(nome)) return `A última atualização não encontrou “${nome}”. Toque em “trocar cidade” e escolha uma da lista (ou escreva o nome como aparece no mapa).`;
  if (C?.horas?.length && !feedDaCidade()) return `A previsão gravada é de ${C.cidade}. ${nome} só aparece quando houver uma previsão gravada para ela: ${FEED_OFF}.`;
  if (FEED) return `A última previsão gravada (${fmtDY(FEED.dia)}, ${FEED.hora}) já não cobre esta hora e ${FEED_OFF}. Se uma nova for gravada, ela aparece aqui sem recarregar.`;
  return `Nenhuma previsão gravada no Atlas e ${FEED_OFF}. Se uma for gravada, ela aparece aqui sem recarregar.`;
}
/* cidades com coordenadas prontas (a página não tem internet para procurar); outra cidade vai pelo nome e o script localiza */
const CIDADES = [["Turim", 45.0705, 7.6868, "Torino|Turin"], ["Milão", 45.4642, 9.19, "Milano|Milan"], ["Roma", 41.9028, 12.4964, "Rome"], ["Florença", 43.7696, 11.2558, "Firenze|Florence"], ["Bolonha", 44.4949, 11.3426, "Bologna"],
  ["Gênova", 44.4056, 8.9463, "Genova|Genoa"], ["Veneza", 45.4408, 12.3155, "Venezia|Venice"], ["Nápoles", 40.8518, 14.2681, "Napoli|Naples"], ["Verona", 45.4384, 10.9916, ""], ["Pádua", 45.4064, 11.8768, "Padova|Padua"],
  ["Bérgamo", 45.6983, 9.6773, "Bergamo"], ["Bréscia", 45.5416, 10.2118, "Brescia"], ["Trieste", 45.6495, 13.7768, ""], ["Bari", 41.1171, 16.8719, ""], ["Palermo", 38.1157, 13.3615, ""], ["Catânia", 37.5079, 15.083, "Catania"],
  ["Cagliari", 39.2238, 9.1217, ""], ["Aosta", 45.7372, 7.3201, ""], ["Asti", 44.9008, 8.2064, ""], ["Cuneo", 44.3845, 7.5427, ""], ["Novara", 45.4469, 8.6219, ""], ["Alessandria", 44.9133, 8.6155, ""], ["Ivrea", 45.4668, 7.8764, ""], ["Pinerolo", 44.8862, 7.3311, ""],
  ["São Paulo", -23.5505, -46.6333, "Sao Paulo"], ["Rio de Janeiro", -22.9068, -43.1729, "Rio"], ["Belo Horizonte", -19.9208, -43.9378, "BH"], ["Brasília", -15.7939, -47.8828, "Brasilia"], ["Curitiba", -25.4284, -49.2733, ""],
  ["Porto Alegre", -30.0346, -51.2177, ""], ["Florianópolis", -27.5954, -48.548, "Florianopolis|Floripa"], ["Salvador", -12.9777, -38.5016, ""], ["Recife", -8.0476, -34.877, ""], ["Fortaleza", -3.7319, -38.5267, ""],
  ["Goiânia", -16.6869, -49.2648, "Goiania"], ["Campinas", -22.9056, -47.0608, ""], ["Vitória", -20.3155, -40.3128, "Vitoria"], ["Manaus", -3.119, -60.0217, ""], ["Belém", -1.4558, -48.5044, "Belem"],
  ["Lisboa", 38.7223, -9.1393, "Lisbon"], ["Porto", 41.1579, -8.6291, "Oporto"], ["Madri", 40.4168, -3.7038, "Madrid"], ["Barcelona", 41.3874, 2.1686, ""], ["Paris", 48.8566, 2.3522, ""], ["Londres", 51.5072, -0.1276, "London"],
  ["Zurique", 47.3769, 8.5417, "Zurich|Zürich"], ["Genebra", 46.2044, 6.1432, "Geneva|Genève"], ["Nice", 43.7102, 7.262, "Nizza"], ["Lyon", 45.764, 4.8357, "Lione"], ["Munique", 48.1351, 11.582, "Munich|München"], ["Berlim", 52.52, 13.405, "Berlin"]];
const acharCidade = q => { const n = normNome(q); return CIDADES.find(([nome, , , alt]) => [nome, ...alt.split("|")].some(x => x && normNome(x) === n)); };
function hjCidade() {
  const d = $("#dlg"); d.innerHTML = `<form method="dialog" id="hjcf"><h3>Cidade do clima</h3><div class="form"><label>Cidade<input type="text" id="hjci" list="hjcl" autocomplete="off" value="${esc(cidade().nome)}"></label><datalist id="hjcl">${CIDADES.map(c => `<option value="${esc(c[0])}">`).join("")}</datalist></div><p class="muted small" id="hjcm">${FEED_OFF.replace(/^./, c => c.toUpperCase())}: a cidade nova passa a valer quando houver uma previsão gravada para ela.</p><div class="dlgfoot"><div></div><div class="row"><button type="button" class="btn" id="hjcx">Cancelar</button><button class="btn primary">Salvar</button></div></div></form>`;
  d.showModal(); $("#hjcx").onclick = () => d.close();
  $("#hjcf").onsubmit = e => { e.preventDefault(); const q = $("#hjci").value.trim().slice(0, 80); if (!q) return; const x = acharCidade(q);
    S.cfg.cidade = x ? { nome: x[0], lat: x[1], lon: x[2] } : { nome: q }; d.close(); HJ.wx = null; HJ.wxSt = ""; try { localStorage.removeItem("atlas_wx"); } catch {}
    touch("cfg", { label: "Cidade do clima" }); if (!feedDaCidade()) toast(x ? `${x[0]}: vale quando houver uma previsão gravada para essa cidade (${FEED_OFF}).` : `“${q}” não está na lista: vale quando houver uma previsão gravada com esse nome (${FEED_OFF}).`); };
}
function hjChange(t) {
  if (t.dataset.hjtempo) { const h = parseNum(t.value); hctx().tempo = h > 0 ? Math.round(Math.min(24, h) * 60) : ""; HJ.skip.clear(); touch("hojeCtx", { label: "Tempo livre", noUndo: true }); return true; }
  return false; }
