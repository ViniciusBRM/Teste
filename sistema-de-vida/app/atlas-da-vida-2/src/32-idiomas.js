/* ================================================================ Idiomas: inglês como prioridade, italiano como segundo foco
   Horas guiadas acumuladas por nível do Quadro Europeu (QECR), pontos médios das faixas que a Cambridge publica:
   A1 ≈ 90–100, A2 ≈ 180–200, B1 ≈ 350–400, B2 ≈ 500–600, C1 ≈ 700–800, C2 ≈ 1000–1200. São médias de sala de aula: servem para ordem de grandeza.
   O plano usa a disponibilidade por dia, a janela de estudo e desconta os compromissos da Agenda que caem nela. As sessões vão para Crescimento (S.estudo). */
const NIV = ["A1", "A2", "B1", "B2", "C1", "C2"];
const NIV_H = { A1: 95, A2: 190, B1: 375, B2: 550, C1: 750, C2: 1100 };
const LANG = { en: { nome: "Inglês", flag: "🇬🇧", cor: "var(--a-car)", item: "Inglês" }, it: { nome: "Italiano", flag: "🇮🇹", cor: "var(--a-fin)", item: "Italiano" } };
const HABS = ["Ouvir", "Falar", "Ler", "Escrever", "Vocabulário", "Gramática"];
const idi = () => { const d = (S.idiomas ||= {}); d.en ||= { nivel: "B1", alvo: "C1", prazo: addMonths(TODAY, 18), desde: TODAY }; d.it ||= { nivel: "B2", alvo: "C1", prazo: addMonths(TODAY, 24), desde: TODAY }; d.disp ||= [30, 45, 30, 45, 30, 20, 60]; d.janela ||= { ini: "19:30", fim: "21:00" }; d.peso ??= 70; d.desloc ??= 20; d.marcos ||= {}; return d; };
const CAN_DO = {
  A1: "Frases simples sobre você e o dia a dia, se a outra pessoa falar devagar.",
  A2: "Situações de rotina: compras, trabalho simples, descrever o passado em poucas frases.",
  B1: "Viajar e trabalhar com apoio: entender o essencial de reuniões claras, escrever e-mails simples, contar experiências.",
  B2: "Reuniões técnicas e conversas espontâneas com nativos sem muito esforço; textos detalhados e defender um ponto de vista.",
  C1: "Usar a língua com flexibilidade no trabalho: apresentações, negociação, relatórios técnicos bem estruturados, sem procurar palavras.",
  C2: "Entender praticamente tudo e se expressar com precisão e nuance, como no seu idioma principal.",
};
/* percurso: foco, marcos verificáveis e recursos por nível; o inglês tem uma trilha técnica para BIM e infraestrutura */
const PERC = {
  en: {
    A2: { foco: { Ouvir: 3, Falar: 2, Ler: 2, Escrever: 1, "Vocabulário": 3, "Gramática": 2 }, marcos: ["Apresentar-se e falar do trabalho por 2 minutos sem ler", "Entender um episódio de 6 Minute English com a transcrição", "Escrever um e-mail curto de agendamento sem tradutor", "Conhecer as 1.000 palavras mais frequentes (teste de vocabulário)"], rec: [["BBC Learning English · 6 Minute English", "https://www.bbc.co.uk/learningenglish"], ["British Council · LearnEnglish", "https://learnenglish.britishcouncil.org"]] },
    B1: { foco: { Ouvir: 3, Falar: 3, Ler: 2, Escrever: 2, "Vocabulário": 2, "Gramática": 1 }, marcos: ["Entender um episódio de 6 Minute English sem transcrição", "Conversa de 15 minutos com um parceiro (Tandem ou colega) sobre um projeto", "Escrever um e-mail técnico pedindo informações (RFI) e receber correção", "Ler a introdução da ISO 19650-1 em inglês com dicionário"], rec: [["BBC · The English We Speak", "https://www.bbc.co.uk/learningenglish"], ["Cambridge · Write & Improve (correção de textos)", "https://writeandimprove.com"], ["UK BIM Framework · guias em inglês", "https://www.ukbimframework.org"]] },
    B2: { foco: { Ouvir: 3, Falar: 3, Ler: 2, Escrever: 2, "Vocabulário": 2, "Gramática": 1 }, marcos: ["Acompanhar uma reunião técnica em inglês e escrever a ata", "Apresentar um projeto do portfólio em 5 minutos (gravado)", "Ler um documento da buildingSMART sobre IFC 4.3 sem dicionário", "Fazer o EF SET e tirar B2 ou mais"], rec: [["buildingSMART International", "https://www.buildingsmart.org"], ["EF SET · teste gratuito", "https://www.efset.org"], ["All Ears English (podcast)", "https://www.allearsenglish.com"]] },
    C1: { foco: { Ouvir: 2, Falar: 3, Ler: 2, Escrever: 3, "Vocabulário": 2, "Gramática": 1 }, marcos: ["Conduzir uma reunião de coordenação BIM em inglês", "Escrever um BEP (BIM Execution Plan) curto em inglês e pedir revisão", "Entender um episódio de In Our Time (BBC Radio 4)", "Certificado C1 (Cambridge C1 Advanced ou IELTS 7)"], rec: [["BBC Radio 4 · In Our Time", "https://www.bbc.co.uk/programmes/b006qykl"], ["The Economist", "https://www.economist.com"]] },
    C2: { foco: { Ouvir: 2, Falar: 3, Ler: 2, Escrever: 3, "Vocabulário": 2, "Gramática": 0 }, marcos: ["Negociar escopo e prazos de um contrato em inglês", "Publicar um artigo técnico em inglês"], rec: [["The Economist", "https://www.economist.com"]] },
    A1: { foco: { Ouvir: 3, Falar: 2, Ler: 2, Escrever: 1, "Vocabulário": 3, "Gramática": 2 }, marcos: ["Cumprimentar e se apresentar", "Números, datas e horários"], rec: [["British Council · LearnEnglish", "https://learnenglish.britishcouncil.org"]] },
  },
  it: {
    B1: { foco: { Ouvir: 3, Falar: 3, Ler: 2, Escrever: 1, "Vocabulário": 2, "Gramática": 2 }, marcos: ["Entender um telejornal da RAI", "Telefonar para marcar uma consulta sem trocar de idioma"], rec: [["RaiPlay", "https://www.raiplay.it"], ["Treccani · gramática e dicionário", "https://www.treccani.it"]] },
    B2: { foco: { Ouvir: 2, Falar: 2, Ler: 2, Escrever: 3, "Vocabulário": 2, "Gramática": 2 }, marcos: ["Escrever uma relazione tecnica curta com a revisão de um colega", "Ouvir um episódio de Morning (Il Post) e resumir em 5 frases", "Usar o congiuntivo sem pensar nas frases do dia a dia", "Ler um artigo do D.Lgs. 36/2023 e explicar a um colega"], rec: [["Il Post · podcasts", "https://www.ilpost.it/podcasts"], ["Accademia della Crusca · dúvidas de língua", "https://accademiadellacrusca.it"]] },
    C1: { foco: { Ouvir: 2, Falar: 3, Ler: 2, Escrever: 3, "Vocabulário": 2, "Gramática": 1 }, marcos: ["Apresentar em italiano numa reunião com cliente público", "Escrever um capitolato ou relatório sem correções de registro", "Certificado CILS ou CELI C1"], rec: [["CILS · Università per Stranieri di Siena", "https://cils.unistrasi.it"], ["Treccani", "https://www.treccani.it"]] },
    C2: { foco: { Ouvir: 2, Falar: 3, Ler: 2, Escrever: 3, "Vocabulário": 2, "Gramática": 0 }, marcos: ["Escrever textos formais longos com estilo próprio"], rec: [["Treccani", "https://www.treccani.it"]] },
    A2: { foco: { Ouvir: 3, Falar: 2, Ler: 2, Escrever: 1, "Vocabulário": 3, "Gramática": 2 }, marcos: ["Resolver burocracia simples no comune"], rec: [["RaiPlay", "https://www.raiplay.it"]] },
    A1: { foco: { Ouvir: 3, Falar: 2, Ler: 2, Escrever: 1, "Vocabulário": 3, "Gramática": 2 }, marcos: ["Apresentar-se"], rec: [["RaiPlay", "https://www.raiplay.it"]] },
  },
};
const ATIV = { Ouvir: "ouvir um episódio e repetir em voz alta trechos curtos (shadowing)", Falar: "falar sozinho ou com um parceiro sobre o dia ou um projeto, gravando 3 minutos", Ler: "ler um texto do seu nível e marcar 10 palavras novas", Escrever: "escrever um e-mail ou parágrafo e corrigir com a ferramenta de correção", "Vocabulário": "revisar cartões (flashcards) de palavras novas", "Gramática": "um tópico de gramática com 10 frases suas" };
const hm2m = s => { const m = String(s || "").match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
function idiSess(lang, de) { return S.estudo.filter(x => (x.lang === lang || (!x.lang && norm(x.item || "") === norm(LANG[lang].item))) && (!de || x.data >= de)); }
/* plano dos próximos 7 dias: disponibilidade do dia, janela de estudo menos a Agenda, deslocamento só para ouvir */
function idiPlano() {
  const I = idi(), ini = hm2m(I.janela.ini) ?? 1170, fim = hm2m(I.janela.fim) ?? 1260, jan = Math.max(0, fim - ini), dias = [];
  for (let k = 0; k < 7; k++) {
    const d = addDays(TODAY, k), dow = parse(d).getDay(), disp = +I.disp[dow] || 0;
    const ev = [...(S.eventos || []).filter(e => e.data === d), ...rtOcc(d).filter(b => b.cat !== "Estudo").map(b => ({ hora: b.ini, fim: b.fim, titulo: b.titulo }))], busy = sum(ev.map(e => { const a = hm2m(e.hora), b = hm2m(e.fim) ?? (a != null ? a + 60 : null); return a == null ? 0 : Math.max(0, Math.min(b, fim) - Math.max(a, ini)); }));
    const livre = Math.max(0, Math.min(disp, jan - busy)), en = Math.round(livre * I.peso / 100 / 5) * 5, it = Math.max(0, livre - en), desl = dow >= 1 && dow <= 5 ? +I.desloc || 0 : 0;
    dias.push({ d, dow, disp, busy, ev, livre, en, it, desl });
  }
  return dias;
}
function idiProj(lang) {
  const I = idi(), L = I[lang], h0 = NIV_H[L.nivel] || 0, h1 = NIV_H[L.alvo] || 0, feitas = sum(idiSess(lang, L.desde).map(x => +x.horas || 0)), falta = Math.max(0, h1 - h0 - feitas);
  const P = idiPlano(), semMin = sum(P.map(p => lang === "en" ? p.en + p.desl : p.it)), semH = semMin / 60, sem = semH ? falta / semH : null, eta = sem != null ? addDays(TODAY, Math.ceil(sem * 7)) : null;
  const semanas = Math.max(1, diff(L.prazo || addMonths(TODAY, 12), TODAY) / 7), precisaMin = falta / semanas * 60;
  return { h0, h1, feitas, falta, semMin, eta, ok: eta && L.prazo ? eta <= L.prazo : null, precisaMin, total: h1 - h0 };
}
function pIdiomas() {
  const I = idi(), P = idiPlano(), pe = idiProj("en"), pi = idiProj("it");
  const w0 = weekStart(TODAY), wks = Array.from({ length: 8 }, (_, i) => addDays(w0, -7 * (7 - i)));
  const serie = l => wks.map(w => Math.round(sum(idiSess(l).filter(x => x.data >= w && x.data <= addDays(w, 6)).map(x => (+x.horas || 0) * 60))));
  const card = (l, X) => { const L = I[l], C = LANG[l], prog = X.total ? clamp(1 - X.falta / X.total) : 0;
    return panel(`${C.flag} ${C.nome} <small>${l === "en" ? "prioridade" : "segundo foco"}</small>`, `<div class="form f3"><label>Nível hoje<select data-idi="${l}.nivel">${NIV.map(n => `<option${L.nivel === n ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>Meta<select data-idi="${l}.alvo">${NIV.map(n => `<option${L.alvo === n ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>Até<input type="date" data-idi="${l}.prazo" value="${L.prazo || ""}"></label></div>
      <p class="muted small">${esc(CAN_DO[L.alvo])}</p>
      <div class="futbar"><i style="width:${prog * 100}%;background:${C.cor}"></i></div>
      <p>${num(X.feitas, 1)} h feitas desde ${fmtD(L.desde)} · faltam cerca de <b>${num(X.falta, 0)} h</b> (${L.nivel} → ${L.alvo}). No plano desta semana (${X.semMin} min) você chega por volta de <b>${X.eta ? mlabel(X.eta.slice(0, 7)) : "–"}</b>${X.ok === false ? `, depois da meta. Para chegar até ${fmtDY(L.prazo)}, precisaria de <b>${num(X.precisaMin, 0)} min por semana</b>.` : X.ok ? ", dentro do prazo." : "."}</p>`, { style: `--c:${C.cor}` }); };
  const perc = l => { const L = I[l], sel = I.view?.[l] || NIV[Math.min(5, NIV.indexOf(L.nivel) + 1)], Pc = PERC[l][sel] || PERC[l].B2, mk = (I.marcos[l] ||= {})[sel] ||= [];
    return panel(`${ic("flag")}Percurso ${LANG[l].nome}`, `<div class="seg-g" role="group" aria-label="Nível do percurso">${NIV.map(n => `<button type="button" class="seg" data-idiv="${l}|${n}" aria-pressed="${sel === n}">${n}</button>`).join("")}</div>
      <p class="muted small">${esc(CAN_DO[sel])}</p><div class="flbl">Marcos para fechar o ${sel}</div>${Pc.marcos.map((m, i) => `<label class="ckl"><input type="checkbox" data-idim="${l}|${sel}|${i}"${mk[i] ? " checked" : ""}><span>${esc(m)}</span></label>`).join("")}
      <div class="flbl">Peso das habilidades neste nível</div>${hbars(HABS.map(h => ({ l: h, v: Pc.foco[h] || 0, color: LANG[l].cor })), { fmt: v => "●".repeat(v), max: 3 })}
      <div class="flbl">Recursos</div><ul class="idrec">${Pc.rec.map(([t, u]) => `<li><a class="lnk" href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("")}</ul>`); };
  const focoHoje = (l, k) => { const L = I[l], Pc = PERC[l][L.nivel] || PERC[l].B2, hs = HABS.filter(h => Pc.foco[h]).sort((a, b) => Pc.foco[b] - Pc.foco[a]); return hs[k % hs.length]; };
  return `${kpiRow([kmini(LANG.en.cor, "Inglês · esta semana", `${P.reduce((s, p) => s + p.en + p.desl, 0)} min`, `${pe.ok === false ? "abaixo do necessário" : "no plano"}`, pe.ok === false ? "warn" : "good"), kmini(LANG.it.cor, "Italiano · esta semana", `${P.reduce((s, p) => s + p.it, 0)} min`, ""), kmini("var(--accent)", "Feito nas últimas 4 semanas", `${num(sum(idiSess("en", addDays(TODAY, -28)).concat(idiSess("it", addDays(TODAY, -28))).map(x => +x.horas || 0)), 1)} h`, "inglês + italiano"), kmini("var(--warn)", "Compromissos na janela", P.filter(p => p.busy).length, `dias com agenda entre ${I.janela.ini} e ${I.janela.fim}`)])}
  <div class="g2c">${card("en", pe)}${card("it", pi)}
    ${panel(`${ic("cal")}Plano dos próximos 7 dias <small>calculado com a sua disponibilidade e a Agenda</small>`, `<div class="hscroll"><table class="dt idpl"><thead><tr><th>Dia</th><th class="num">Livre</th><th>Inglês</th><th>Italiano</th></tr></thead><tbody>${P.map((p, k) => `<tr><td><b>${DOWL[p.dow].slice(0, 3)}</b> ${fmtD(p.d)}${p.busy ? `<div class="muted small">${p.ev.length} compromisso(s) na janela: −${p.busy} min</div>` : ""}</td><td class="num">${p.livre} min</td><td>${p.en ? `<b>${p.en} min</b> · ${esc(focoHoje("en", k))}: ${esc(ATIV[focoHoje("en", k)])}` : "–"}${p.desl ? `<div class="muted small">+ ${p.desl} min no deslocamento: ouvir podcast</div>` : ""}</td><td>${p.it ? `<b>${p.it} min</b> · ${esc(focoHoje("it", k + 2))}` : "–"}</td></tr>`).join("")}</tbody></table></div>
      <div class="row wrap"><button type="button" class="btn sm" data-act="gcestudo">${ic("cal")}Pôr os blocos da semana no Google Calendar</button></div><details class="futd"><summary>Disponibilidade e janela</summary><div class="form f4">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label>${DOWL[d].slice(0, 3)} (min)<input type="number" min="0" step="5" data-idid="${d}" value="${I.disp[d]}"></label>`).join("")}<label>Janela: início<input type="time" data-idi="janela.ini" value="${I.janela.ini}"></label><label>fim<input type="time" data-idi="janela.fim" value="${I.janela.fim}"></label><label>% para o inglês<input type="number" min="0" max="100" data-idi="peso" value="${I.peso}"></label><label>Deslocamento (min/dia útil)<input type="number" min="0" data-idi="desloc" value="${I.desloc}"></label></div></details>`, { cls: "span2" })}
    ${panel(`${ic("plus")}Registrar sessão`, `<div class="form f4"><label>Idioma<select id="idl"><option value="en">Inglês</option><option value="it">Italiano</option></select></label><label>Minutos<input type="number" id="idm" min="5" step="5" value="30"></label><label>Habilidade<select id="idh">${HABS.map(h => `<option>${h}</option>`).join("")}</select></label><label>Recurso<input type="text" id="idr" placeholder="6 Minute English, Il Post…"></label></div><div class="row"><button type="button" class="btn sm primary" data-act="idsess">${ic("check")}Registrar</button></div><p class="muted small">Vai para Crescimento como sessão de estudo, junto com o resto do que você estuda.</p>`)}
    ${vis("idsem", "Minutos por semana", colChart(wks.map(w => fmtD(w)), [{ name: "Inglês", color: LANG.en.cor, data: serie("en") }, { name: "Italiano", color: LANG.it.cor, data: serie("it") }], { h: 200, w: 520, stacked: true, fmt: v => num(v, 0) }), { sub: "últimas 8 semanas", nofocus: true })}
    ${perc("en")}${perc("it")}
  </div>
  <p class="note">${ic("info")}<span>Não sabe o nível? Faça o EF SET (inglês, gratuito, 50 min) e use o resultado. As horas por nível são médias: a previsão melhora conforme você registra as sessões.</span></p>`;
}
function idiChange(t) {
  if (t.dataset.idi) { const I = idi(), [a, b] = t.dataset.idi.split("."), v = t.type === "number" ? +t.value || 0 : t.value; if (b) { I[a] = { ...I[a], [b]: v }; if (b === "nivel") I[a].desde = TODAY; } else I[a] = v; touch("idiomas", { label: "Idiomas" }); return true; }
  if (t.dataset.idid != null) { const I = idi(); I.disp = [...I.disp]; I.disp[+t.dataset.idid] = +t.value || 0; touch("idiomas", { label: "Disponibilidade" }); return true; }
  return false;
}
function idiClick(t) {
  if (t.dataset.idiv) { const [l, n] = t.dataset.idiv.split("|"), I = idi(); I.view = { ...(I.view || {}), [l]: n }; render(); return true; }
  if (t.dataset.idim) { const [l, n, i] = t.dataset.idim.split("|"), I = idi(); const arr = [...((I.marcos[l] ||= {})[n] || [])]; arr[+i] = t.checked ? TODAY : 0; I.marcos[l][n] = arr; touch("idiomas", { label: "Marco de idioma" }); return true; }
  if (t.dataset.act === "idsess") { const l = $("#idl").value, m = +$("#idm").value; if (!(m > 0 && m <= 600)) { toast("Minutos entre 1 e 600."); return true; }
    S.estudo.push({ id: uid(), data: TODAY, item: LANG[l].item, horas: Math.round(m / 60 * 100) / 100, lang: l, hab: $("#idh").value, rec: $("#idr").value.trim(), origem: "idiomas" }); touch("estudo", { label: "Sessão de idioma" }); undoToast(`${m} min de ${LANG[l].nome.toLowerCase()} registrados`); return true; }
  return false;
}
