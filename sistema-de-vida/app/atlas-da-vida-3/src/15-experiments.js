
/* ================================================================ experimentos pessoais (n-de-1): teste uma mudança e meça o efeito */
const EXP = { sel: null };
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const variance = a => { const m = avg(a); return a.length > 1 ? a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1) : 0; };
/* cronograma: blocos alternados, com a ordem de cada par sorteada (AB ou BA), ou antes × depois */
function expSchedule(x) {
  const out = {}, n = +x.dias || 28, b = Math.max(1, +x.bloco || 7);
  if (x.desenho === "antes") { for (let i = 0; i < n; i++) { out[addDays(x.inicio, -n + i)] = "A"; out[addDays(x.inicio, i)] = "B"; } return out; }
  const rnd = mulberry32(x.seed || hashStr(x.id)), nb = Math.ceil(n / b), order = [];
  for (let p = 0; p < Math.ceil(nb / 2); p++) order.push(...(rnd() < .5 ? ["A", "B"] : ["B", "A"]));
  for (let i = 0; i < n; i++) out[addDays(x.inicio, i)] = order[Math.floor(i / b)];
  return out;
}
const expDayN = x => clamp(diff(TODAY, x.inicio) + 1, 0, +x.dias || 28);
function expStats(A, B, seed) {
  const mA = avg(A), mB = avg(B), d = mB - mA, rnd = mulberry32(seed || 7), R = 2000, ds = new Float64Array(R);
  for (let r = 0; r < R; r++) { let sa = 0, sb = 0; for (let i = 0; i < A.length; i++) sa += A[(rnd() * A.length) | 0]; for (let i = 0; i < B.length; i++) sb += B[(rnd() * B.length) | 0]; ds[r] = sb / B.length - sa / A.length; }
  ds.sort(); const lo = ds[Math.floor(R * .025)], hi = ds[Math.min(R - 1, Math.floor(R * .975))];
  const all = [...A, ...B], nA = A.length, P = 2000; let ext = 0;
  for (let r = 0; r < P; r++) { for (let i = all.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [all[i], all[j]] = [all[j], all[i]]; } let sa = 0; for (let i = 0; i < nA; i++) sa += all[i]; const ma = sa / nA, mb = (sum(all) - sa) / (all.length - nA); if (Math.abs(mb - ma) >= Math.abs(d) - 1e-12) ext++; }
  const sd = Math.sqrt(((A.length - 1) * variance(A) + (B.length - 1) * variance(B)) / Math.max(1, A.length + B.length - 2));
  return { mA, mB, d, lo, hi, p: (ext + 1) / (P + 1), dz: sd ? d / sd : 0, sd, nA: A.length, nB: B.length };
}
/* análise: só entram os dias em que o combinado foi seguido (B com a mudança feita, A sem ela) */
function expAnalyze(x) {
  return memo("exp:" + x.id, () => {
    const D = DAILY(), sch = expSchedule(x), lag = +x.defasagem || 0, col = D.C[x.metrica], rows = [];
    for (const [d, c] of Object.entries(sch)) {
      const ad = x.adesao?.[d], i = D.idx[addDays(d, lag)], y = col && i != null ? col[i] : null, past = d <= TODAY && addDays(d, lag) <= TODAY;
      const inc = past && isNum(y) && (c === "B" ? ad === 1 : x.desenho === "antes" ? true : ad !== 1);
      rows.push({ d, c, ad, y: isNum(y) ? +y : null, inc, past });
    }
    rows.sort((a, b) => a.d.localeCompare(b.d));
    const A = rows.filter(r => r.inc && r.c === "A").map(r => r.y), B = rows.filter(r => r.inc && r.c === "B").map(r => r.y);
    const bDays = rows.filter(r => r.c === "B" && r.past), adher = bDays.length ? bDays.filter(r => r.ad === 1).length / bDays.length : null, unmarked = rows.filter(r => r.past && r.c === "B" && r.ad == null).length;
    const st = A.length >= 2 && B.length >= 2 ? expStats(A, B, hashStr(x.id)) : null;
    const want = x.direcao === "diminuir" ? -1 : 1;
    let v = "dados", vt = "Faltam dados";
    if (st && st.nA >= 5 && st.nB >= 5) { if (st.lo > 0 || st.hi < 0) { const ok = Math.sign(st.d) === want; v = ok ? "funcionou" : "contrario"; vt = ok ? "Funcionou" : "Efeito contrário"; } else { v = "inconclusivo"; vt = "Inconclusivo"; } }
    const target = st ? Math.max(Math.abs(st.dz), .5) : .5, need = Math.ceil(2 * 2.8 ** 2 / target ** 2);
    return { rows, A, B, st, adher, unmarked, v, vt, need, sch };
  });
}
const expMetricL = k => metric(k)?.l || k;
const expFmt = (k, v) => v == null ? "–" : mfmt(k, v);
function expSentence(x, an) {
  const s = an.st, m = expMetricL(x.metrica);
  if (!s) return `Ainda não há dias suficientes nas duas condições para comparar ${m.toLowerCase()}.`;
  const p = s.p < .01 ? "menos de 1%" : pct(s.p, 0);
  return `Nos dias COM a mudança (${s.nB}), ${m.toLowerCase()} ficou em média ${expFmt(x.metrica, s.mB)}; nos dias SEM (${s.nA}), ${expFmt(x.metrica, s.mA)}. Diferença de ${sgn(s.d, v => num(v, 2))} (intervalo de 95%: ${num(s.lo, 2)} a ${num(s.hi, 2)}; tamanho de efeito d = ${num(s.dz, 2)}). Uma diferença desse tamanho apareceria só por acaso em ${p} das vezes.`;
}
function expVerdictNote(x, an) {
  if (an.v === "dados") { const fA = Math.max(0, 5 - (an.st?.nA || an.A.length)), fB = Math.max(0, 5 - (an.st?.nB || an.B.length)); return `Faltam ${[fB && plural(fB, "dia COM", "dias COM"), fA && plural(fA, "dia SEM", "dias SEM")].filter(Boolean).join(" e ") || "alguns dias"} com o combinado seguido.${an.unmarked ? ` ${plural(an.unmarked, "dia COM está", "dias COM estão")} sem marcação de “fiz/não fiz”.` : ""}`; }
  if (an.v === "inconclusivo") return `O intervalo inclui zero: com a variação que seus dias têm, não dá para separar efeito de acaso. Para detectar um efeito desse tamanho seriam uns ${an.need} dias em cada condição.`;
  if (an.v === "funcionou") return `O intervalo inteiro fica do lado ${x.direcao === "diminuir" ? "negativo" : "positivo"}: é provável que a mudança tenha efeito real em você, no seu contexto.`;
  return "O intervalo inteiro fica do lado oposto ao esperado: nos seus dias, a mudança andou junto com o contrário do que você queria.";
}
/* gráfico: faixas COM sombreadas, pontos por dia, médias de cada condição */
function expChart(x, an, w = 640) {
  const rows = an.rows, n = rows.length; if (!n) return emptyChart();
  const H = 210, L = 42, Rr = 12, T = 12, B = 26, iw = w - L - Rr, ih = H - T - B, m = metric(x.metrica) || {}, ys = rows.map(r => r.y).filter(isNum);
  const sc = m.lo != null ? { lo: m.lo, hi: m.hi, ticks: linTicks(m.lo, m.hi, 4) } : niceScale(Math.min(...ys, 0), Math.max(...ys, 1), 4);
  const X = i => L + (i + .5) * iw / n, Y = v => T + ih - (v - sc.lo) / ((sc.hi - sc.lo) || 1) * ih, bw = iw / n;
  let g = ""; for (const t of sc.ticks) g += `<line x1="${L}" x2="${w - Rr}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="gl"/><text x="${L - 7}" y="${(Y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(mfmt(x.metrica, t))}</text>`;
  rows.forEach((r, i) => { if (r.c === "B") g += `<rect x="${(L + i * bw).toFixed(1)}" y="${T}" width="${(bw + .5).toFixed(1)}" height="${ih}" class="expb"/>`; });
  const ti = rows.findIndex(r => r.d === TODAY); if (ti >= 0) g += `<line x1="${X(ti).toFixed(1)}" x2="${X(ti).toFixed(1)}" y1="${T}" y2="${T + ih}" class="hiln"/>`;
  if (an.st) for (const [k, v, cls] of [["A", an.st.mA, "expma"], ["B", an.st.mB, "expmb"]]) g += `<line x1="${L}" x2="${w - Rr}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" class="${cls}"/><text x="${w - Rr - 4}" y="${(Y(v) - 5).toFixed(1)}" class="ax ${cls}t" text-anchor="end">média ${k === "B" ? "COM" : "SEM"} ${esc(mfmt(x.metrica, v))}</text>`;
  rows.forEach((r, i) => { if (!isNum(r.y)) return; g += `<circle cx="${X(i).toFixed(1)}" cy="${Y(r.y).toFixed(1)}" r="${r.inc ? 3.6 : 2.6}" class="${r.inc ? (r.c === "B" ? "expdb" : "expda") : "expdx"}" ${tip(`${fmtDL(r.d)} · dia ${r.c === "B" ? "COM" : "SEM"}${r.ad === 1 ? " · fez" : r.ad === 0 ? " · não fez" : ""}\n${expMetricL(x.metrica)}: ${mfmt(x.metrica, r.y)}${r.inc ? "" : "\nfora da conta (combinado não seguido ou sem marcação)"}`)}/>`; });
  const step = Math.ceil(n / 8); rows.forEach((r, i) => { if (i % step === 0) g += `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="ax" text-anchor="middle">${fmtD(r.d)}</text>`; });
  return `<div class="legend"><span><i style="background:var(--accent)"></i>dia COM a mudança</span><span><i style="background:var(--muted)"></i>dia SEM</span><span><i class="hollow"></i>fora da conta</span></div>` + svgWrap(w, H, g, `${expMetricL(x.metrica)} por dia do experimento`);
}
function expCI(x, an, w = 640) {
  const s = an.st; if (!s) return "";
  const H = 64, L = 14, Rr = 14, lo = Math.min(s.lo, 0), hi = Math.max(s.hi, 0), pd = (hi - lo || 1) * .15, a = lo - pd, b = hi + pd, X = v => L + (v - a) / (b - a) * (w - L - Rr);
  const col = an.v === "funcionou" ? "var(--good)" : an.v === "contrario" ? "var(--crit)" : "var(--muted)";
  return svgWrap(w, H, `<line x1="${X(0)}" x2="${X(0)}" y1="8" y2="${H - 18}" class="tgt"/><text x="${X(0)}" y="${H - 4}" class="ax" text-anchor="middle">0</text>
    <line x1="${X(s.lo).toFixed(1)}" x2="${X(s.hi).toFixed(1)}" y1="26" y2="26" stroke="${col}" stroke-width="6" stroke-linecap="round" opacity=".45"/><circle cx="${X(s.d).toFixed(1)}" cy="26" r="6.5" fill="${col}"/>
    <text x="${X(s.lo).toFixed(1)}" y="${H - 4}" class="ax" text-anchor="middle">${num(s.lo, 2)}</text><text x="${X(s.hi).toFixed(1)}" y="${H - 4}" class="ax" text-anchor="middle">${num(s.hi, 2)}</text><text x="${X(s.d).toFixed(1)}" y="12" class="ax hi" text-anchor="middle">${sgn(s.d, v => num(v, 2))}</text>`, "Diferença COM − SEM e intervalo de 95%");
}
function expStrip(x, an) {
  return `<div class="expstrip" style="--n:${an.rows.length}">${an.rows.map(r => `<span class="es ${r.c}${r.d === TODAY ? " now" : ""}${r.d > TODAY ? " fut" : ""}" ${tip(`${fmtDL(r.d)} · ${r.c === "B" ? "COM" : "SEM"}${r.ad === 1 ? " · fez" : r.ad === 0 ? " · não fez" : r.past ? " · sem marcação" : ""}`)}>${r.ad === 1 ? "✓" : r.ad === 0 && r.c === "B" ? "×" : ""}</span>`).join("")}</div>`;
}
const vpill = an => pill({ funcionou: "good", contrario: "crit", inconclusivo: "warn", dados: "none" }[an.v], an.vt);
function expToday(x, an, compact) {
  const c = an.sch[TODAY]; if (!c || x.desenho === "antes" && c === "A") return "";
  const ad = x.adesao?.[TODAY];
  return `<div class="exptoday ${c}"><div><span class="flbl">Hoje · ${c === "B" ? "dia COM" : "dia SEM"}</span><b>${c === "B" ? esc(x.intervencao) : `Hoje não: ${esc(x.intervencao.charAt(0).toLowerCase() + x.intervencao.slice(1))}`}</b></div><div class="row">${c === "B" ? `<button type="button" class="btn sm${ad === 1 ? " primary" : ""}" data-expad="${x.id}|1">${ic("check")}Fiz</button><button type="button" class="btn sm${ad === 0 ? " primary" : ""}" data-expad="${x.id}|0">Não fiz</button>` : `<button type="button" class="btn sm${ad === 0 ? " primary" : ""}" data-expad="${x.id}|0">${ic("check")}Segui (não fiz)</button><button type="button" class="btn sm${ad === 1 ? " primary" : ""}" data-expad="${x.id}|1">Acabei fazendo</button>`}</div></div>`;
}
function expCard(x) {
  const an = expAnalyze(x), dn = expDayN(x), m = expMetricL(x.metrica), done = x.status !== "ativo";
  return `<article class="expc pn${EXP.sel === x.id ? " sel" : ""}" style="--c:${acol(metricArea(x.metrica)) || "var(--accent)"}"><header><div><span class="crumb">${x.status === "ativo" ? (TODAY < x.inicio ? `começa ${relDay(x.inicio)}` : `dia ${dn} de ${x.dias}`) : x.status === "concluido" ? `concluído ${x.fim ? fmtDY(x.fim) : ""}` : "cancelado"} · ${esc(m)}</span><h3>${esc(x.titulo)}</h3></div>${vpill(an)}</header>
    ${x.hipotese ? `<p class="exph">${esc(x.hipotese)}</p>` : ""}${done ? "" : expToday(x, an)}${expStrip(x, an)}
    <p class="muted small">${an.st ? `COM ${expFmt(x.metrica, an.st.mB)} × SEM ${expFmt(x.metrica, an.st.mA)} · ${sgn(an.st.d, v => num(v, 2))}` : "sem comparação ainda"}${an.adher != null ? ` · adesão ${pct(an.adher)}` : ""}</p>
    ${x.conclusao && done ? `<div class="note">${ic("flask")}<span>${esc(x.conclusao)}</span></div>` : ""}
    <div class="row wrap"><button type="button" class="btn sm" data-expsel="${x.id}">${ic("scatter")}${EXP.sel === x.id ? "Fechar análise" : "Ver análise"}</button>${done ? `<button type="button" class="btn sm ghost" data-expreopen="${x.id}">Reabrir</button>` : `<button type="button" class="btn sm ghost" data-expedit="${x.id}">${ic("edit")}Editar</button>`}</div></article>`;
}
function expDetail(x) {
  const an = expAnalyze(x), w = Math.min(760, Math.max(300, (REPW || 900) - 60));
  return panel(`${ic("flask")}${esc(x.titulo)} <small>${esc(expMetricL(x.metrica))}${+x.defasagem ? " no dia seguinte" : ""} · ${x.desenho === "antes" ? "antes × depois" : `blocos de ${x.bloco} dias sorteados`}</small>`, `
    <div class="kms3">${kmini("var(--accent)", "Dias COM na conta", an.st?.nB ?? an.B.length, an.adher != null ? `adesão ${pct(an.adher)}` : "")}${kmini("var(--muted)", "Dias SEM na conta", an.st?.nA ?? an.A.length, x.desenho === "antes" ? `${x.dias} dias antes do início` : "")}${kmini(an.v === "funcionou" ? "var(--good)" : an.v === "contrario" ? "var(--crit)" : "var(--warn)", "Resultado", an.vt, an.st ? `d = ${num(an.st.dz, 2)}` : "")}</div>
    ${expChart(x, an, w)}<div class="flbl">Diferença COM − SEM e incerteza</div>${expCI(x, an, w) || emptyChart("Sem comparação ainda.")}
    <p class="expsent">${esc(expSentence(x, an))}</p><p class="note">${ic("info")}<span>${esc(expVerdictNote(x, an))}</span></p>
    ${x.status === "ativo" ? `<div class="flbl">Marcar dias anteriores</div><div class="expmark">${an.rows.filter(r => r.past && r.d >= addDays(TODAY, -14) && (x.desenho !== "antes" || r.c === "B")).slice(-14).map(r => `<div class="emr"><span>${fmtD(r.d)} · ${r.c === "B" ? "COM" : "SEM"}</span><button type="button" class="seg" data-expad="${x.id}|1|${r.d}" aria-pressed="${r.ad === 1}">fez</button><button type="button" class="seg" data-expad="${x.id}|0|${r.d}" aria-pressed="${r.ad === 0}">não fez</button></div>`).join("")}</div>
      <div class="row wrap"><label class="chk"><input type="checkbox" id="exp_dia" checked> Registrar o resultado no diário e na memória do mentor</label><button type="button" class="btn primary" data-expend="${x.id}">${ic("check")}Encerrar e guardar o aprendizado</button><button type="button" class="btn ghost" data-expcancel="${x.id}">Cancelar experimento</button></div>` : ""}`, { cls: "span2 expdet" });
}
/* a mudança testável por trás de uma pista (o fator k acompanha a métrica alvo); null quando o fator não é algo que você faz */
function expIdeaFor(k, target) {
  const D = DAILY(), p66 = () => { const v = (D.C[k] || []).filter(isNum).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length * .66)] : null; };
  if (k.startsWith("h:")) { const h = S.habitos.find(z => "h:" + z.id === k); return h ? { titulo: `${h.nome} × ${expMetricL(target).toLowerCase()}`, intervencao: h.nome, metrica: target } : null; }
  if (k === "sono") { const v = p66(); return v ? { titulo: "Dormir mais", intervencao: `Dormir pelo menos ${num(Math.round(v * 2) / 2)} h`, metrica: target, defasagem: 1 } : null; }
  if (k === "passos") { const v = p66(); return v ? { titulo: "Andar mais", intervencao: `Andar pelo menos ${num(Math.round(v / 500) * 500, 0)} passos`, metrica: target } : null; }
  if (k === "treino" || k === "min") return { titulo: "Treinar", intervencao: "Treinar (qualquer treino)", metrica: target };
  if (k === "estudo") return { titulo: "Estudar todo dia", intervencao: "Estudar pelo menos 30 min", metrica: target };
  if (k === "idi") return { titulo: "Idioma todo dia", intervencao: "15 minutos de idioma", metrica: target };
  if (k === "lazer") return { titulo: "Lazer no dia", intervencao: "Reservar 1 h de lazer", metrica: target };
  if (k === "contatos" || k.startsWith("p:")) return { titulo: k.startsWith("p:") ? `Ver ${k.slice(2)}` : "Falar com alguém", intervencao: k.startsWith("p:") ? `Encontrar ou falar com ${k.slice(2)}` : "Falar com alguém querido (ligação ou encontro)", metrica: target };
  if (k === "diario") return { titulo: "Escrever no diário", intervencao: "Escrever no diário antes de dormir", metrica: target, defasagem: 1 };
  if (k === "jmin" || k === "jdia") return { titulo: "Praticar todo dia", intervencao: "10 minutos de prática da jornada (meditação, leitura ou oração)", metrica: target };
  if (k === "ro:pct") return { titulo: "Cumprir o plano do dia", intervencao: "Planejar só 3 blocos importantes na Rotina e marcar cada um", metrica: target };
  if (k === "psir") return { titulo: "Registro entre sessões", intervencao: "Fazer um registro na Psicologia (pergunta do dia ou pensamento)", metrica: target, defasagem: 1 };
  return null;
}
function expIdeas() {
  return memo("expideas", () => {
    const out = [], seen = new Set();
    for (const target of ["bem", "energia"]) for (const i of influencers(target, { days: 180, min: 20 }).slice(0, 12)) {
      /* só pistas cujo intervalo de 95% não passa pelo zero: experimento testa uma suspeita, não ruído */
      if (Math.abs(i.r) < .15 || !czConsist(i) || seen.has(i.k)) continue; const it = expIdeaFor(i.k, target);
      if (!it) continue; seen.add(i.k);
      out.push({ ...it, r: i.r, n: i.n, direcao: i.r >= 0 ? "aumentar" : "diminuir", hipotese: `Nos seus dados, ${i.l.toLowerCase()} anda junto com ${expMetricL(target).toLowerCase()} (r = ${num(i.r, 2)}, ${i.n} dias). Correlação não prova causa: o experimento testa.` });
      if (out.length >= 4) break;
    }
    return out;
  });
}
function pExp(R) {
  const L = S.experimentos || [], act = L.filter(x => x.status === "ativo"), done = L.filter(x => x.status === "concluido"), sel = L.find(x => x.id === EXP.sel), ideas = expIdeas();
  const funcionou = done.filter(x => expAnalyze(x).v === "funcionou").length;
  return `<p class="lead">Correlação mostra o que anda junto; experimento mostra o que muda quando você muda. Escolha uma mudança, o Atlas sorteia dias COM e SEM ela, você marca se seguiu, e no fim ele compara a métrica com intervalo de confiança.</p>
    ${kpiRow([kmini("var(--accent)", "Em andamento", act.length, act.length ? act.map(x => x.titulo).join(", ") : "nenhum agora"), kmini("var(--good)", "Lições confirmadas", funcionou, `de ${plural(done.length, "experimento concluído", "experimentos concluídos")}`), kmini("var(--a-men)", "Dias marcados", sum(L.map(x => Object.keys(x.adesao || {}).length)), "fiz / não fiz")])}
    <div class="row wrap expbar"><button type="button" class="btn primary" data-act="expnew">${ic("plus")}Novo experimento</button></div>
    <div class="g2c">${sel ? expDetail(sel) : ""}
      ${act.map(expCard).join("") || panel(`${ic("flask")}Nenhum experimento em andamento`, `<p class="muted">Comece por uma das ideias tiradas dos seus cruzamentos, ou crie o seu.</p>`)}
      ${panel(`${ic("bolt")}Ideias a partir dos seus dados`, ideas.length ? ideas.map((it, i) => `<div class="expidea"><div><b>${esc(it.intervencao)}</b><small>${esc(expMetricL(it.metrica))} · r = ${num(it.r, 2)} em ${it.n} dias</small></div><button type="button" class="btn sm" data-expidea="${i}">${ic("flask")}Testar</button></div>`).join("") : `<div class="empty">Registre algumas semanas de check-in e hábitos para o Atlas sugerir testes.</div>`)}
      ${panel(`${ic("book")}Lições aprendidas <small>${done.length}</small>`, done.length ? done.map(x => { const an = expAnalyze(x); return `<div class="lesson"><div class="row">${vpill(an)}<b>${esc(x.titulo)}</b></div><p>${esc(x.conclusao || expSentence(x, an))}</p><button type="button" class="lnk" data-expsel="${x.id}">ver análise</button></div>`; }).join("") : `<div class="empty">Quando você encerrar um experimento, o resultado fica aqui e na memória do mentor da área.</div>`, { cls: done.length > 2 ? "span2" : "" })}
      ${L.filter(x => x.status === "cancelado").length ? panel(`${ic("x")}Cancelados`, L.filter(x => x.status === "cancelado").map(x => `<div class="li"><span>${esc(x.titulo)}</span><button type="button" class="lnk" data-expreopen="${x.id}">reabrir</button></div>`).join("")) : ""}</div>`;
}
function openExpForm(id, preset = {}) {
  const x = id ? S.experimentos.find(z => z.id === id) : { titulo: "", hipotese: "", intervencao: "", metrica: "bem", direcao: "aumentar", desenho: "alternado", bloco: 3, dias: 28, inicio: addDays(TODAY, 1), defasagem: 0, ...preset };
  const ms = metricList(), gs = [...new Set(ms.map(m => m.grp))];
  $("#dlg").innerHTML = `<form method="dialog" id="expf" class="wide"><h3>${id ? "Editar" : "Novo"} experimento</h3>
    <div class="form f2"><label class="full">Nome curto<input id="ex_titulo" value="${esc(x.titulo)}" placeholder="Ex.: Celular fora do quarto"></label>
      <label class="full">O que fazer nos dias COM<input id="ex_int" value="${esc(x.intervencao)}" placeholder="Ex.: Deixar o celular na sala a partir das 22h"></label>
      <label class="full">Hipótese<input id="ex_hip" value="${esc(x.hipotese)}" placeholder="Se eu …, então meu humor do dia seguinte sobe"></label>
      <label>O que medir<select id="ex_met">${gs.map(g => `<optgroup label="${esc(g)}">${ms.filter(m => m.grp === g).map(m => `<option value="${esc(m.k)}"${m.k === x.metrica ? " selected" : ""}>${esc(m.l)}</option>`).join("")}</optgroup>`).join("")}</select></label>
      <label>Espero que<select id="ex_dir"><option value="aumentar"${x.direcao === "aumentar" ? " selected" : ""}>aumente</option><option value="diminuir"${x.direcao === "diminuir" ? " selected" : ""}>diminua</option></select></label>
      <label>Efeito aparece<select id="ex_lag"><option value="0"${+x.defasagem ? "" : " selected"}>no mesmo dia</option><option value="1"${+x.defasagem ? " selected" : ""}>no dia seguinte</option></select></label>
      <label>Desenho<select id="ex_des"><option value="alternado"${x.desenho !== "antes" ? " selected" : ""}>Blocos COM e SEM sorteados (mais forte)</option><option value="antes"${x.desenho === "antes" ? " selected" : ""}>Antes × depois (mais simples)</option></select></label>
      <label>Tamanho do bloco<select id="ex_bloco">${[2, 3, 4, 7].map(b => `<option value="${b}"${+x.bloco === b ? " selected" : ""}>${b} dias</option>`).join("")}</select></label>
      <label>Duração<select id="ex_dias">${[14, 21, 28, 42, 56].map(n => `<option value="${n}"${+x.dias === n ? " selected" : ""}>${n} dias</option>`).join("")}</select></label>
      <label>Começa em<input id="ex_ini" type="date" value="${x.inicio}"></label></div>
    <p class="note">${ic("info")}<span>Nos blocos alternados, o Atlas sorteia a ordem de cada par (COM-SEM ou SEM-COM) para que tendências da semana não se misturem com o efeito. Em “antes × depois”, os ${x.dias} dias anteriores ao início viram a comparação; é mais fácil, mas uma mudança de fase da vida pode se passar por efeito.</span></p>
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="exno">Cancelar</button><button type="button" class="btn primary" id="exok">${id ? "Salvar" : "Começar experimento"}</button></div></div></form>`;
  const d = $("#dlg"); d.showModal(); $("#exno").onclick = () => d.close();
  $("#exok").onclick = () => { const g = k => $("#" + k)?.value || "", t = g("ex_titulo").trim(), it = g("ex_int").trim(); if (!t || !it) { toast("Dê um nome e diga o que fazer nos dias COM."); return; }
    const rec = { ...(id ? x : { id: uid(), status: "ativo", adesao: {}, criado: Date.now(), seed: (Math.random() * 2 ** 31) | 0 }), titulo: t, intervencao: it, hipotese: g("ex_hip").trim(), metrica: g("ex_met"), direcao: g("ex_dir"), defasagem: +g("ex_lag"), desenho: g("ex_des"), bloco: +g("ex_bloco"), dias: +g("ex_dias"), inicio: g("ex_ini") || TODAY };
    if (id) S.experimentos = S.experimentos.map(z => z.id === id ? rec : z); else S.experimentos.push(rec);
    d.close(); EXP.sel = rec.id; touch("experimentos", { label: id ? "Experimento editado" : "Experimento criado" }); if (!id) undoToast("Experimento criado: marque “fiz / não fiz” nos dias COM"); };
}
function expEnd(id) {
  const x = S.experimentos.find(z => z.id === id); if (!x) return; const an = expAnalyze(x), reg = $("#exp_dia")?.checked !== false;
  x.status = "concluido"; x.fim = TODAY; x.conclusao = `${an.vt}: ${expSentence(x, an)}`; const keys = ["experimentos"];
  if (reg) { const a = metricArea(x.metrica), mid = a && AREA_INFO[a] ? AREA_INFO[a].id : "conselho"; addMemory(mid, { tipo: "progresso", texto: `Experimento “${x.titulo}” (${fmtDY(x.inicio)}): ${an.vt.toLowerCase()}. ${an.st ? `COM ${expFmt(x.metrica, an.st.mB)} × SEM ${expFmt(x.metrica, an.st.mA)}, ${sgn(an.st.d, v => num(v, 2))}.` : ""}`, origem: "experimento" }); keys.push("mentores");
    S.diario.push({ id: uid(), data: TODAY, hora: nowHM(), titulo: `Resultado do experimento: ${x.titulo}`, texto: `**${an.vt}.** ${expSentence(x, an)}\n\n${expVerdictNote(x, an)}\n#experimento`, humor: null, energia: null, fixado: false, aplicados: [], criado: Date.now(), editado: Date.now(), origem: "experimento" }); keys.push("diario"); }
  touch(...keys, { label: "Experimento encerrado" }); undoToast(`Experimento encerrado: ${an.vt.toLowerCase()}`);
}
function expClick(t) {
  const ds = t.dataset;
  if (ds.act === "expnew") { openExpForm(); return true; }
  if (ds.expidea != null) { const it = expIdeas()[+ds.expidea]; if (it) openExpForm(null, { titulo: it.titulo, intervencao: it.intervencao, metrica: it.metrica, direcao: it.direcao, hipotese: it.hipotese, defasagem: it.defasagem || 0 }); return true; }
  if (ds.expsel) { EXP.sel = EXP.sel === ds.expsel ? null : ds.expsel; if (PAGE !== "exp") setHash("exp"); else render(); return true; }
  if (ds.expedit) { openExpForm(ds.expedit); return true; }
  if (ds.expad) { const [id, v, d] = ds.expad.split("|"), x = S.experimentos.find(z => z.id === id); if (!x) return true; const day = d || TODAY; x.adesao = { ...(x.adesao || {}) }; if (x.adesao[day] === +v) delete x.adesao[day]; else x.adesao[day] = +v; touch("experimentos", { label: "Adesão marcada" }); return true; }
  if (ds.expend) { expEnd(ds.expend); return true; }
  if (ds.expcancel) { if (!t.dataset.c) { t.dataset.c = 1; t.textContent = "Confirmar cancelamento"; return true; } const x = S.experimentos.find(z => z.id === ds.expcancel); if (x) { x.status = "cancelado"; touch("experimentos", { label: "Experimento cancelado" }); undoToast("Experimento cancelado"); } return true; }
  if (ds.expreopen) { const x = S.experimentos.find(z => z.id === ds.expreopen); if (x) { x.status = "ativo"; delete x.fim; touch("experimentos", { label: "Experimento reaberto" }); } return true; }
  return false;
}
