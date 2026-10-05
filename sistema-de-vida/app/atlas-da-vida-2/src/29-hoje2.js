/* ================================================================ Hoje: resumo do momento
   Clima (Open-Meteo) com o que vestir e o que dá para fazer, 2–3 notícias positivas (Positive News e Good News Network via rss2json),
   uma frase escolhida pelo horário e pelo que o dia está pedindo, e ideias para sair da rotina filtradas por clima, energia, tempo e dinheiro.
   Sem internet nesta visualização, o clima vira pergunta e as notícias viram links. As respostas ficam em S.hojeCtx[dia]. */
const HJ = { wx: null, wxSt: "", news: null, newsSt: "", skip: new Set(), fr: 0 };
const hctx = () => (S.hojeCtx[TODAY] ||= {});
const periodo = () => { const h = new Date().getHours(); return h < 12 ? "manha" : h < 18 ? "tarde" : "noite"; };
/* a página pode não ter acesso à internet: cada busca desiste em 7 s */
async function fetchT(u, ms = 7000) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { return await fetch(u, { signal: c.signal }); } finally { clearTimeout(t); } }
/* feed do dia: notícias e clima gravados no banco do Atlas por uma rotina externa (doc compartilhado feed/hoje); vale quando a página não alcança a internet */
let FEED = null, FEED_ST = "";
async function hjFeed() {
  if (FEED_ST || (!DBH && !LOADED)) return; FEED_ST = "load";
  try { const d = DBH ? await DBH.doc("feed/hoje").get() : null, v = d?.exists ? JSON.parse(JSON.stringify(d.data())) : null; FEED = v && v.dia ? v : null; } catch { FEED = null; }
  FEED_ST = "ok"; if (PAGE === "hoje" && FEED) render();
}
const feedFresco = () => FEED && diff(TODAY, FEED.dia) <= 1;
const PER_TXT = { manha: "manhã", tarde: "tarde", noite: "noite" };
const cidade = () => S.cfg.cidade?.lat ? S.cfg.cidade : { nome: "Turim", lat: 45.0705, lon: 7.6868 };
const WMO = c => c === 0 ? ["Céu limpo", "sun"] : c <= 2 ? ["Poucas nuvens", "sun"] : c === 3 ? ["Nublado", "wave"] : c <= 48 ? ["Neblina", "wave"] : c <= 57 ? ["Garoa", "wave"] : c <= 67 ? ["Chuva", "wave"] : c <= 77 ? ["Neve", "star"] : c <= 82 ? ["Pancadas de chuva", "wave"] : c <= 86 ? ["Neve", "star"] : ["Temporal", "bolt"];
async function hjWeather(force) {
  if (HJ.wxSt === "load" || (!force && (HJ.wx?.dia === TODAY || HJ.wxSt === "err"))) return;
  try { const v = JSON.parse(localStorage.getItem("atlas_wx") || "null"); if (!force && v?.dia === TODAY && v.at > Date.now() - 3 * 3600e3 && v.lat === cidade().lat) { HJ.wx = v; return; } } catch {}
  HJ.wxSt = "load"; const C = cidade();
  try { const r = await fetchT(`https://api.open-meteo.com/v1/forecast?latitude=${C.lat}&longitude=${C.lon}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max&timezone=auto&forecast_days=1`);
    if (!r.ok) throw 0; const j = await r.json(); if (!j?.current || !j?.daily) throw 0;
    HJ.wx = { dia: TODAY, at: Date.now(), lat: C.lat, t: j.current.temperature_2m, sens: j.current.apparent_temperature, code: j.current.weather_code, vento: j.current.wind_speed_10m, max: j.daily.temperature_2m_max[0], min: j.daily.temperature_2m_min[0], chuva: j.daily.precipitation_probability_max[0], codeD: j.daily.weather_code[0], uv: j.daily.uv_index_max[0] };
    HJ.wxSt = "ok"; try { localStorage.setItem("atlas_wx", JSON.stringify(HJ.wx)); } catch {}
  } catch { HJ.wxSt = "err"; }
  if (PAGE === "hoje") render();
}
async function hjNews() {
  if (HJ.newsSt) return; HJ.newsSt = "load";
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
/* o tempo: da internet, ou o que a pessoa marcou */
function hjClima() {
  const c = hctx(), w = HJ.wx?.dia === TODAY ? HJ.wx : feedFresco() && FEED.clima && (FEED.clima.lat == null || Math.abs(FEED.clima.lat - cidade().lat) < .2) ? { ...FEED.clima, feed: true } : null;
  if (w) { const [txt] = WMO(w.codeD ?? w.code); return { fonte: w.feed ? "feed" : "net", t: w.t, sens: w.sens, max: w.max, min: w.min, chuva: w.chuva, uv: w.uv, vento: w.vento, txt, ico: WMO(w.code)[1], code: w.codeD ?? w.code }; }
  if (c.clima) { const base = { sol: [22, 10, "Sol"], nublado: [17, 30, "Nublado"], chuva: [13, 80, "Chuva"], frio: [3, 20, "Frio"], calor: [32, 10, "Calor"] }[c.clima] || [18, 20, "–"], t = isNum(c.temp) && c.temp !== "" ? +c.temp : base[0];
    return { fonte: "mao", t, sens: t, max: t + 3, min: t - 4, chuva: base[1], uv: c.clima === "sol" || c.clima === "calor" ? 6 : 2, vento: 0, txt: base[2], ico: c.clima === "chuva" ? "wave" : "sun", code: c.clima === "chuva" ? 63 : 1 }; }
  return null;
}
function hjRoupa(W) {
  const s = W.sens ?? W.t, out = [];
  out.push(s < 3 ? "Casaco pesado, cachecol e luvas; camada térmica por baixo." : s < 10 ? "Casaco de inverno ou jaqueta forrada com suéter." : s < 16 ? "Jaqueta leve ou suéter; sapato fechado." : s < 22 ? "Manga longa leve, ou camiseta com um casaco na mochila." : s < 28 ? "Roupa leve; um casaco fino só se for voltar tarde." : "Roupa leve e clara, água sempre à mão.");
  if (W.max - W.min >= 10) out.push(`Diferença de ${num(W.max - W.min, 0)}° entre manhã e tarde: vá em camadas.`);
  if (W.chuva >= 50) out.push(`Chuva provável (${W.chuva}%): guarda-chuva e sapato que aguente água.`); else if (W.chuva >= 30) out.push(`Chance de chuva de ${W.chuva}%: guarda-chuva pequeno na mochila.`);
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
  const s = S.saude[TODAY] || {}, sono = s.sono ?? S.saude[addDays(TODAY, -1)]?.sono, atras = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo < TODAY).length;
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
  const tasks = S.tarefas.filter(t => t.status !== "Concluída" && t.status !== "Cancelada" && t.prazo && t.prazo <= TODAY).length;
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
const TEMPO_OPT = [[15, "15 min"], [60, "1 hora"], [180, "meio dia"], [480, "dia livre"]];
const GRANA_OPT = [["zero", "nada", 0], ["pouco", "até € 10", 1], ["ok", "até € 30", 2], ["folga", "mais", 2]];
function hjIdeias(c, W) {
  const per = periodo(), dow = parse(TODAY).getDay(), tempo = +c.tempo || 60, gmax = (GRANA_OPT.find(g => g[0] === c.grana) || [0, 0, 1])[2], en = { baixa: 1, media: 2, alta: 3 }[c.energia] || 2, chuva = W ? W.chuva >= 50 || W.code >= 61 : c.clima === "chuva", extremo = W ? W.sens < 3 || W.max >= 33 : c.clima === "frio" || c.clima === "calor";
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
    <div class="hjq"><span>Tempo livre hoje</span>${chips("tempo", TEMPO_OPT)}</div><div class="hjq"><span>Dinheiro para lazer</span>${chips("grana", GRANA_OPT.map(g => [g[0], g[1]]))}</div>
    ${HJ.wxSt === "err" || (!HJ.wx && c.clima) ? `<div class="hjq"><span>Tempo lá fora</span>${chips("clima", [["sol", "sol"], ["nublado", "nublado"], ["chuva", "chuva"], ["frio", "frio"], ["calor", "calor"]])}<label class="hjtemp">°C<input type="number" data-hjtemp="1" value="${esc(c.temp ?? "")}" aria-label="Temperatura"></label></div>` : ""}
  </section>`;
}
function pHoje2(R) {
  hjFeed(); const c = hctx(); hjWeather(); hjNews(); const W = hjClima();
  const news = HJ.news?.length ? HJ.news : feedFresco() && FEED.news?.length ? FEED.news : null, newsFeed = !HJ.news?.length && !!news;
  const s = S.saude[TODAY] || {}, F = hjFrase(c), I = hjIdeias(c, W);
  const tasks = R.tar.filter(t => t.open && t.prazo && t.prazo <= TODAY).sort((a, b) => a.prazo.localeCompare(b.prazo)), doneToday = R.tar.filter(t => t.status === "Concluída" && t.concluida === TODAY);
  const CC = typeof casaCalc === "function" ? casaCalc() : null, contas = CC ? [...CC.atrasadas, ...CC.prox14.filter(v => v.dias <= 3)] : [];
  const exps = (S.experimentos || []).filter(x => x.status === "ativo" && expSchedule(x)[TODAY] && !(x.desenho === "antes" && expSchedule(x)[TODAY] === "A")), al = radarAlerts().slice(0, 2);
  const fwk = fsTarget(), fpend = parse(TODAY).getDay() <= 1 && S.fechamentos?.[fwk]?.status !== "fechado";
  const reg = [["humor", "humor"], ["sono", "sono"], ["treino", "treino"]].filter(([k]) => s[k] != null && s[k] !== ""), habs = S.habitos.filter(h => S.marks[`${h.id}|${TODAY}`]).length;
  const resumo = [W ? `${num(W.t, 0)}° agora, ${num(W.min, 0)}–${num(W.max, 0)}° no dia${W.chuva >= 30 ? `, ${W.chuva}% de chuva` : ", sem chuva prevista"}` : "", tasks.length ? plural(tasks.length, "tarefa vence até hoje", "tarefas vencem até hoje") : "nenhuma tarefa vencendo", contas.length ? plural(contas.length, "conta da casa para pagar", "contas da casa para pagar") : ""].filter(Boolean).join(" · ");
  return `<p class="hjlead">${esc(resumo)}.</p>
    ${hjAsk(c)}
    <div class="g2c hj2">
      ${panel(`${ic(W?.ico || "sun")}Tempo em ${esc(cidade().nome)} <small>${W ? (W.fonte === "net" ? "Open-Meteo, agora" : W.fonte === "feed" ? `Open-Meteo, às ${FEED.hora || "manhã"}` : "marcado por você") : HJ.wxSt === "load" ? "buscando…" : "sem dados"}</small>`, W ? `<div class="hjwx"><b>${num(W.t, 0)}°</b><div><span>${esc(W.txt)}</span><small>sensação ${num(W.sens, 0)}° · mín ${num(W.min, 0)}° máx ${num(W.max, 0)}° · chuva ${W.chuva}%${W.fonte === "net" ? ` · UV ${num(W.uv, 0)}` : ""}</small></div></div><div class="flbl">O que vestir</div><ul class="hjl">${hjRoupa(W).map(x => `<li>${esc(x)}</li>`).join("")}</ul><div class="flbl">O que o tempo permite</div><p>${esc(hjAtiv(W))}</p>` : `<div class="empty">${HJ.wxSt === "err" ? "Não consegui buscar o clima nesta visualização. Marque o tempo lá fora em “Como você está agora?”." : "Buscando a previsão…"}</div>`, { act: `<button type="button" class="lnk" data-act="hjcid">${ic("globe")}trocar cidade</button>` })}
      ${panel(`${ic("spark")}Para esta ${PER_TXT[periodo()]}`, `<blockquote class="hjq1"><p>${esc(F.f[0])}</p><cite>${esc(F.f[1])}</cite></blockquote><p class="hjconc">${esc(F.concreto)}</p><button type="button" class="lnk" data-act="hjfr">outra frase</button>`)}
      ${panel(`${ic("compass")}Ideias para sair da rotina <small>${I.pick.length} de ${IDEIAS.length}, filtradas pelo seu momento</small>`, `${I.motivos.length ? `<p class="muted small">${esc(I.motivos.join("; "))}.${I.total < 3 ? " Sobraram poucas: é uma limitação real do dia, não falta de opção na cidade." : ""}</p>` : ""}<div class="hjid">${I.pick.map(x => `<article class="hjidc"><b>${esc(x.t)}</b><p>${esc(x.d)}</p><div class="hjidm">${chip(CUSTO_TXT[x.cst])}${chip(x.min >= 60 ? `${num(x.min / 60, x.min % 60 ? 1 : 0)} h` : `${x.min} min`)}${chip(x.outd === 1 ? "ao ar livre" : x.outd ? "dentro ou fora" : "dentro")}</div>${x.why.length ? `<small>Por que hoje: ${esc(x.why.join(", "))}</small>` : ""}<div class="row"><button type="button" class="btn sm" data-hjvou="${esc(x.t)}">${ic("check")}Vou fazer</button><button type="button" class="lnk" data-hjskip="${esc(x.t)}">outra</button></div></article>`).join("") || `<div class="empty">Nenhuma ideia cabe nas respostas de agora. Com mais tempo livre ou orçamento, aparecem opções.</div>`}</div>`, { cls: "span2" })}
      ${panel(`${ic("globe")}Notícias boas <small>jornalismo de soluções, em inglês</small>`, news ? `<div class="hjnews">${news.map(n => `<a class="hjn" href="${esc(n.link)}" target="_blank" rel="noopener"><b>${esc(n.t)}</b>${n.d ? `<span>${esc(n.d)}…</span>` : ""}<small>${esc(n.src)}${n.data ? " · " + fmtDY(n.data) : ""}</small></a>`).join("")}</div>${newsFeed ? `<p class="muted small">Do resumo de ${fmtDY(FEED.dia)} gravado no Atlas.</p>` : ""}` : HJ.newsSt === "load" ? `<div class="empty">Buscando…</div>` : `<div class="empty">Não consegui buscar as notícias nesta visualização. Abra direto: <a class="lnk" href="https://www.positive.news" target="_blank" rel="noopener">Positive News</a> · <a class="lnk" href="https://www.goodnewsnetwork.org" target="_blank" rel="noopener">Good News Network</a> · <a class="lnk" href="https://www.corriere.it/buone-notizie/" target="_blank" rel="noopener">Corriere · Buone Notizie</a></div>`)}
      ${panel(`${ic("mic")}Registro do dia`, `<div class="hjreg">${reg.length || habs ? `${reg.map(([k, l]) => chip(`${l} ${k === "sono" ? num(s[k]) + " h" : k === "treino" ? s[k] : s[k] + "/5"}`, "good")).join("")}${habs ? chip(`${habs}/${S.habitos.length} hábitos`, "good") : ""}` : `<span class="muted">Nada registrado hoje ainda.</span>`}</div><a class="btn sm primary" href="#painel">${ic("mic")}Registrar no Painel do dia</a>`)}
      ${fpend ? `<div class="pn fscta span2"><div>${ic("week")}<b>Hora de fechar a semana de ${wkLabel(fwk)}</b><small>Uns 15 minutos.</small></div><a class="btn primary" href="#semana">Fechar a semana</a></div>` : ""}
      ${panel(`${ic("checksq")}Para hoje <small>${tasks.length ? tasks.length + " pendente(s)" : "em dia"}</small>`, `${tasks.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}"><span>${esc(t.tarefa)}<small class="st-${t.st}">${t.prazo < TODAY ? `atrasada ${relDay(t.prazo)}` : "vence hoje"}</small></span></label></div>`).join("")}${doneToday.map(t => `<div class="li"><label class="ckl"><input type="checkbox" data-tdone="${t.id}" checked><span class="done">${esc(t.tarefa)}</span></label></div>`).join("")}${contas.map(v => `<div class="li"><span>${ic("house")}${esc(v.c.conta)} · ${eur(+v.c.valor || 0, 2)}</span>${pill(v.dias < 0 ? "crit" : "warn", v.dias < 0 ? "atrasada" : v.dias === 0 ? "hoje" : `em ${v.dias} d`)}</div>`).join("")}${!tasks.length && !doneToday.length && !contas.length ? `<div class="empty">Nada vencendo hoje.</div>` : ""}${quickBox("hj_tar", "Nova tarefa: Ligar para o banco até sexta !alta", "qtar", "Prazo, prioridade (!alta) e #área são opcionais.")}`)}
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
function hjCidade() {
  const d = $("#dlg"); d.innerHTML = `<form method="dialog" id="hjcf"><h3>Cidade do clima</h3><div class="form"><label>Cidade<input type="text" id="hjci" value="${esc(cidade().nome)}"></label></div><p class="muted small" id="hjcm"></p><div class="dlgfoot"><div></div><div class="row"><button type="button" class="btn" id="hjcx">Cancelar</button><button class="btn primary">Buscar</button></div></div></form>`;
  d.showModal(); $("#hjcx").onclick = () => d.close();
  $("#hjcf").onsubmit = async e => { e.preventDefault(); const q = $("#hjci").value.trim(); if (!q) return; $("#hjcm").textContent = "Buscando…";
    try { const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=pt`), j = await r.json(), x = j?.results?.[0]; if (!x) { $("#hjcm").textContent = "Cidade não encontrada."; return; }
      S.cfg.cidade = { nome: x.name, lat: x.latitude, lon: x.longitude }; d.close(); HJ.wx = null; HJ.wxSt = ""; try { localStorage.removeItem("atlas_wx"); } catch {} touch("cfg", { label: "Cidade do clima" }); }
    catch { $("#hjcm").textContent = "Sem acesso à internet nesta visualização."; } };
}
function hjChange(t) { if (t.dataset.hjtemp) { hctx().temp = t.value === "" ? "" : +t.value; touch("hojeCtx", { noUndo: true }); return true; } return false; }
