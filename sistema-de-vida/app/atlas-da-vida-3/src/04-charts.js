
/* ================================================================ gráficos SVG (tokens do tema; nada de cor literal) */
let GID = 0;
const tip = t => `data-tip="${esc(t)}"`;
function niceMax(v) { if (v <= 0) return 1; const e = Math.pow(10, Math.floor(Math.log10(v))); return [1, 2, 2.5, 5, 10].map(m => m * e).find(m => m >= v); }
function niceScale(min, max, n = 4, minStep = 0) {
  if (!isFinite(min)) min = 0; if (!isFinite(max)) max = 1; if (max - min < 1e-9) { max = min + (Math.abs(min) || 1); }
  const raw = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
  const step = Math.max(minStep, (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag);
  const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step, ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { lo, hi, ticks };
}
const linTicks = (lo, hi, n = 4) => Array.from({ length: n + 1 }, (_, i) => lo + (hi - lo) * i / n);
function smoothPath(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
const linePath = pts => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const svgWrap = (W, H, g, label = "", cls = "chart") => `<svg class="${cls}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${g}</svg>`;
const legend = items => `<div class="legend">${items.map(s => `<span><i style="background:${s.color}"${s.dash ? ' class="dash"' : ""}></i>${esc(s.name)}</span>`).join("")}</div>`;
const emptyChart = (t = "Sem dados no período.") => `<div class="empty">${esc(t)}</div>`;

function spark(vals, color, { min = null, max = null, w = 120, h = 34 } = {}) {
  const pts = vals.map((v, i) => [i, v]).filter(p => isNum(p[1]));
  if (pts.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"></svg>`;
  const lo = min ?? Math.min(...pts.map(p => p[1])), hi = max ?? Math.max(...pts.map(p => p[1])), rg = hi - lo || 1;
  const X = i => 2 + i * (w - 4) / Math.max(1, vals.length - 1), Y = v => h - 3 - (v - lo) / rg * (h - 8);
  const P = pts.map(p => [X(p[0]), Y(p[1])]), d = smoothPath(P), id = "sg" + (++GID), last = P.at(-1);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".32"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${last[0].toFixed(1)},${h} L${P[0][0].toFixed(1)},${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* linhas/áreas com eixo duplo, meta, projeção e colunas de hover (tooltip com todas as séries) */
function lineChart(labels, series, o = {}) {
  const W = o.w || 640, H = o.h || 240, L = o.left ?? 46, Rr = o.right ? 50 : 16, B = 26, T = 14, iw = W - L - Rr, ih = H - B - T;
  const n = labels.length + (o.proj || 0);
  if (!labels.length || !series.some(s => s.data.some(isNum))) return emptyChart(o.empty);
  const left = series.filter(s => !s.right), vals = left.flatMap(s => [...s.data, ...(s.proj || [])]).filter(isNum);
  if (o.target != null) vals.push(o.target);
  let lo, hi, ticks;
  if (o.min != null && o.max != null) { lo = o.min; hi = o.max; ticks = linTicks(lo, hi, 4); }
  else { const sc = niceScale(o.min ?? (o.zero === false ? Math.min(...vals) : Math.min(0, ...vals)), o.max ?? Math.max(...vals), 4); lo = sc.lo; hi = sc.hi; ticks = sc.ticks; }
  const X = i => L + (n <= 1 ? iw / 2 : i * iw / (n - 1)), Y = v => T + ih - (v - lo) / ((hi - lo) || 1) * ih;
  const rlo = o.right?.min || 0, rhi = o.right?.max || 1, YR = v => T + ih - (v - rlo) / ((rhi - rlo) || 1) * ih;
  const fmt = o.fmt || (v => num(v, 0));
  let g = "<defs>" + series.map((s, k) => `<linearGradient id="lg${GID + k + 1}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity="${s.fillOp ?? .28}"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`).join("") + "</defs>";
  const g0 = GID; GID += series.length;
  for (const t of ticks) { const y = Y(t); g += `<line x1="${L}" x2="${W - Rr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="gl"/><text x="${L - 8}" y="${(y + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(fmt(t))}</text>`; }
  if (o.right) linTicks(rlo, rhi, 4).forEach(t => g += `<text x="${W - Rr + 8}" y="${(YR(t) + 3.5).toFixed(1)}" class="ax">${esc(o.right.fmt(t))}</text>`);
  if (o.proj) { const x0 = X(labels.length - 1); g += `<rect x="${x0}" y="${T}" width="${W - Rr - x0}" height="${ih}" class="projbg"/><line x1="${x0}" x2="${x0}" y1="${T}" y2="${T + ih}" class="projln"/>`; }
  if (o.target != null) { const y = Y(o.target); g += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" class="tgt"/><text x="${L + 6}" y="${y - 5}" class="ax tgtx">${esc(o.targetLabel || "meta")}</text>`; }
  if (o.band) { const [a, b] = o.band; g += `<rect x="${L}" y="${Y(b)}" width="${iw}" height="${Math.max(0, Y(a) - Y(b))}" class="band"/>`; }
  const all = [...labels, ...(o.projLabels || [])], step = Math.ceil(all.length / (o.maxLabels || 12));
  all.forEach((lb, i) => { if (i % step && !(i === all.length - 1 && i % step >= step * .6)) return; g += `<text x="${X(i).toFixed(1)}" y="${H - 7}" class="ax${i >= labels.length ? " pj" : ""}${i === o.hi ? " hi" : ""}" text-anchor="middle">${esc(lb)}</text>`; });
  if (o.hi != null && o.hi >= 0) g += `<line x1="${X(o.hi)}" x2="${X(o.hi)}" y1="${T}" y2="${T + ih}" class="hiln"/>`;
  series.forEach((s, k) => {
    const Yf = s.right ? YR : Y, P = s.data.map((v, i) => isNum(v) ? [X(i), Yf(+v)] : null).filter(Boolean);
    if (!P.length) return;
    const segs = []; let cur = []; s.data.forEach((v, i) => { if (isNum(v)) cur.push([X(i), Yf(+v)]); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
    for (const sg of segs) {
      const d = o.smooth === false || s.step ? linePath(sg) : smoothPath(sg);
      if (s.fill !== false && sg.length > 1) g += `<path d="${d} L${sg.at(-1)[0].toFixed(1)},${T + ih} L${sg[0][0].toFixed(1)},${T + ih}Z" fill="url(#lg${g0 + k + 1})"${s.faded ? ' opacity=".35"' : ""}/>`;
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.2}" stroke-linecap="round" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 5"' : ""}${s.faded ? ' opacity=".22"' : s.op != null ? ` opacity="${s.op}"` : ""}/>`;
    }
    if ((s.dots ?? n <= 26) && !s.faded) g += s.data.map((v, i) => isNum(v) ? `<circle cx="${X(i).toFixed(1)}" cy="${Yf(+v).toFixed(1)}" r="${i === o.hi ? 4.2 : 3}" fill="${s.color}" class="dot"/>` : "").join("");
    if (s.proj?.length) { const pp = [P.at(-1), ...s.proj.map((v, i) => [X(labels.length + i), Yf(v)])]; g += `<path d="${smoothPath(pp)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-dasharray="5 5"/>` + s.proj.map((v, i) => `<circle cx="${X(labels.length + i)}" cy="${Yf(v)}" r="3.6" class="pdot" stroke="${s.color}"/>`).join(""); }
  });
  const cw = iw / Math.max(1, n - 1);
  labels.forEach((lb, i) => {
    const lines = [lb, ...series.filter(s => isNum(s.data[i])).map(s => `${s.name}: ${s.right ? o.right.fmt(+s.data[i]) : (s.fmt || fmt)(+s.data[i])}`)];
    const key = o.keys?.[i];
    g += `<rect class="hov${key != null && o.click ? " click" : ""}" x="${(X(i) - cw / 2).toFixed(1)}" y="${T}" width="${cw.toFixed(1)}" height="${ih}" ${tip(lines.join("\n"))}${key != null && o.click ? ` data-${o.click}="${esc(key)}"` : ""}/>`;
  });
  const leg = o.legend === false ? "" : legend([...series.filter(s => !s.noLegend), ...(o.proj ? [{ name: "Tendência projetada", color: "var(--muted)", dash: true }] : [])]);
  return leg + svgWrap(W, H, g, o.label || series.map(s => s.name).join(", "));
}

/* colunas agrupadas ou empilhadas, com linha sobreposta (combo) e filtro cruzado */
function colChart(labels, series, o = {}) {
  const W = o.w || 640, H = o.h || 240, L = o.left ?? 50, Rr = 14, B = 26, T = 14, iw = W - L - Rr, ih = H - B - T, n = labels.length;
  if (!n || !series.some(s => s.data.some(v => +v))) return emptyChart(o.empty);
  const tot = labels.map((_, i) => o.stacked ? sum(series.map(s => Math.max(0, +s.data[i] || 0))) : Math.max(0, ...series.map(s => +s.data[i] || 0)));
  const lv = (o.line || []).flatMap(s => s.data).filter(isNum);
  const ints = series.every(s => s.data.every(v => v == null || Number.isInteger(+v))), sc = niceScale(0, Math.max(...tot, ...lv, o.target || 0, 1e-9), 4, ints ? 1 : 0), Y = v => T + ih - v / sc.hi * ih, fmt = o.fmt || (v => num(v, 0));
  const gw = iw / n, bw = o.stacked ? Math.min(36, gw * .62) : Math.min(18, gw * .74 / series.length);
  let g = "";
  for (const t of sc.ticks) { const y = Y(t); g += `<line x1="${L}" x2="${W - Rr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="gl"/><text x="${L - 8}" y="${(y + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(fmt(t))}</text>`; }
  const step = Math.ceil(n / (o.maxLabels || 14));
  labels.forEach((lb, i) => {
    const key = o.keys?.[i], dim_ = (o.sel != null && key !== o.sel) || (o.hi != null && o.hi >= 0 && o.hi !== i && o.dimOthers);
    const x0 = L + i * gw + (gw - (o.stacked ? bw : bw * series.length)) / 2; let acc = 0;
    series.forEach((s, j) => {
      const v = Math.max(0, +s.data[i] || 0); if (!v) return;
      const h = ih * v / sc.hi, x = o.stacked ? x0 : x0 + j * bw, y = o.stacked ? Y(acc + v) : Y(v);
      g += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, (o.stacked ? bw : bw - 2)).toFixed(1)}" height="${Math.max(.5, h).toFixed(1)}" rx="${o.stacked ? 1.5 : 3}" fill="${s.color}"${dim_ ? ' opacity=".35"' : ""}/>`;
      acc += v;
    });
    if (i % step === 0 || (i === n - 1 && i % step >= step * .6)) g += `<text x="${(L + i * gw + gw / 2).toFixed(1)}" y="${H - 7}" class="ax${i === o.hi || (o.sel != null && key === o.sel) ? " hi" : ""}" text-anchor="middle">${esc(lb)}</text>`;
  });
  for (const s of o.line || []) { const P = s.data.map((v, i) => isNum(v) ? [L + i * gw + gw / 2, Y(+v)] : null).filter(Boolean); if (P.length > 1) g += `<path d="${smoothPath(P)}" fill="none" stroke="${s.color}" stroke-width="2.2"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`; g += P.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${s.color}" class="dot"/>`).join(""); }
  if (o.target != null) { const y = Y(o.target); g += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" class="tgt"/><text x="${L + 6}" y="${y - 5}" class="ax tgtx">${esc(o.targetLabel || "meta")}</text>`; }
  labels.forEach((lb, i) => {
    const key = o.keys?.[i], lines = [lb, ...series.filter(s => +s.data[i]).map(s => `${s.name}: ${fmt(+s.data[i])}`), ...(o.line || []).filter(s => isNum(s.data[i])).map(s => `${s.name}: ${(s.fmt || fmt)(+s.data[i])}`)];
    if (o.stacked && series.length > 1) lines.splice(1, 0, `Total: ${fmt(tot[i])}`);
    g += `<rect class="hov${key != null && o.click ? " click" : ""}" x="${(L + i * gw).toFixed(1)}" y="${T}" width="${gw.toFixed(1)}" height="${ih}" ${tip(lines.join("\n"))}${key != null && o.click ? ` data-${o.click}="${esc(key)}"` : ""}/>`;
  });
  const leg = o.legend === false ? "" : legend([...series, ...(o.line || [])].filter(s => !s.noLegend));
  return leg + svgWrap(W, H, g, o.label || "");
}

/* barras horizontais em HTML (rótulos longos quebram bem em telas estreitas) */
function hbars(rows, o = {}) {
  if (!rows.length) return emptyChart(o.empty);
  const mx = o.max ?? Math.max(...rows.map(r => Math.abs(r.v)), 1e-9), fmt = o.fmt || (v => num(v));
  return `<div class="hb">${rows.map(r => { const key = r.key ?? r.l, sel = o.sel != null && o.sel !== key;
    return `<div class="hbr${o.xf ? " click" : ""}${sel ? " dim" : ""}"${o.xf ? ` data-xf="${o.xf}|${esc(key)}" role="button" tabindex="0"` : ""} ${tip(r.tip || `${r.l}: ${r.txt ?? fmt(r.v)}`)}><span class="hbl">${esc(r.l)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><div class="hbt"><i style="width:${(clamp(Math.abs(r.v) / mx) * 100).toFixed(1)}%;background:${r.color || o.color || "var(--accent)"}"></i>${r.mark != null ? `<b style="left:${(clamp(r.mark / mx) * 100).toFixed(1)}%"></b>` : ""}</div><em class="${r.st ? "st-" + r.st : ""}">${r.txt ?? esc(fmt(r.v))}</em></div>`; }).join("")}</div>`;
}
/* real × orçamento com marcador do ritmo do mês */
function bullet(rows, o = {}) {
  if (!rows.length) return emptyChart(o.empty || "Defina orçamentos em Finanças › Orçamento.");
  return `<div class="bul">${rows.map(r => { const mx = Math.max(r.real, r.plan || 0) * 1.08 || 1, key = r.key ?? r.l, sel = o.sel != null && o.sel !== key;
    return `<div class="bur${o.xf ? " click" : ""}${sel ? " dim" : ""}"${o.xf ? ` data-xf="${o.xf}|${esc(key)}" role="button" tabindex="0"` : ""} ${tip(`${r.l}\nReal: ${eur(r.real)}${r.plan ? `\nOrçamento: ${eur(r.plan)}\nUso: ${pct(r.real / r.plan)}` : ""}`)}><span class="hbl">${esc(r.l)}</span><div class="but"><i class="${r.st || "none"}" style="width:${(clamp(r.real / mx) * 100).toFixed(1)}%"></i>${r.plan ? `<b style="left:${(clamp(r.plan / mx) * 100).toFixed(1)}%"></b>` : ""}${r.pace != null && r.plan ? `<u style="left:${(clamp(r.plan * r.pace / mx) * 100).toFixed(1)}%"></u>` : ""}</div><em class="st-${r.st || "none"}">${r.plan ? pct(r.real / r.plan) : eur(r.real)}</em></div>`; }).join("")}</div>`;
}
function waterfall(steps, o = {}) {
  const W = o.w || 640, H = o.h || 250, L = 54, Rr = 10, B = 42, T = 18, iw = W - L - Rr, ih = H - B - T, n = steps.length;
  if (!n) return emptyChart();
  let run = 0; const bars = steps.map(s => { if (s.total) { run = s.v; return { ...s, y0: 0, y1: s.v }; } const b = { ...s, y0: run, y1: run + s.v }; run += s.v; return b; });
  const vs = bars.flatMap(b => [b.y0, b.y1]), sc = niceScale(Math.min(0, ...vs), Math.max(...vs, 1), 4);
  const Y = v => T + ih - (v - sc.lo) / (sc.hi - sc.lo) * ih, gw = iw / n, bw = Math.min(48, gw * .64), fmt = o.fmt || eurK;
  let g = "";
  for (const t of sc.ticks) g += `<line x1="${L}" x2="${W - Rr}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="gl${t === 0 ? " zero" : ""}"/><text x="${L - 8}" y="${(Y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(fmt(t))}</text>`;
  bars.forEach((b, i) => {
    const x = L + i * gw + (gw - bw) / 2, top = Y(Math.max(b.y0, b.y1)), h = Math.max(1, Math.abs(Y(b.y0) - Y(b.y1)));
    const col = b.color || (b.total ? "var(--accent)" : b.v >= 0 ? "var(--good)" : "var(--crit)");
    g += `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${col}" ${tip(`${b.l}: ${b.total ? "" : b.v >= 0 ? "+" : "−"}${eur(Math.abs(b.v))}`)}/>`;
    g += `<text x="${(x + bw / 2).toFixed(1)}" y="${(top - 5).toFixed(1)}" class="ax val" text-anchor="middle">${esc((b.total ? "" : b.v >= 0 ? "+" : "−") + fmt(Math.abs(b.v)))}</text>`;
    if (i < n - 1) { const yE = Y(b.y1); g += `<line x1="${(x + bw).toFixed(1)}" x2="${(x + gw).toFixed(1)}" y1="${yE.toFixed(1)}" y2="${yE.toFixed(1)}" class="conn"/>`; }
    const words_ = b.l.split(" "), half = Math.ceil(words_.length / 2), l1 = words_.length > 1 && b.l.length > 11 ? words_.slice(0, half).join(" ") : b.l, l2 = l1 === b.l ? "" : words_.slice(half).join(" ");
    g += `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 24}" class="ax" text-anchor="middle">${esc(l1)}</text>${l2 ? `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 11}" class="ax" text-anchor="middle">${esc(l2)}</text>` : ""}`;
  });
  return svgWrap(W, H, g, o.label || "Cascata");
}
function waterfallH(steps, o = {}) {
  if (!steps.length) return emptyChart();
  let run = 0; const bars = steps.map(s => { if (s.total) { run = s.v; return { ...s, a: 0, b: s.v }; } const b = { ...s, a: run, b: run + s.v }; run += s.v; return b; });
  const vs = bars.flatMap(b => [b.a, b.b]), lo = Math.min(0, ...vs), hi = Math.max(...vs, 1e-9), X = v => (v - lo) / ((hi - lo) || 1) * 100, fmt = o.fmt || eur;
  return `<div class="wfh">${bars.map(b => { const x0 = X(Math.min(b.a, b.b)), w = Math.max(.6, Math.abs(X(b.b) - X(b.a))), col = b.color || (b.total ? "var(--accent)" : b.v >= 0 ? "var(--good)" : "var(--crit)"), sg = b.total ? "" : b.v >= 0 ? "+" : "−";
    return `<div class="wfr${b.total ? " tot" : ""}" ${tip(`${b.l}: ${sg}${fmt(Math.abs(b.v))}`)}><span class="hbl">${esc(b.l)}</span><div class="wft">${lo < 0 ? `<s style="left:${X(0).toFixed(2)}%"></s>` : ""}<i style="left:${x0.toFixed(2)}%;width:${w.toFixed(2)}%;background:${col}"></i></div><em class="${b.total ? "" : b.v >= 0 ? "st-good" : "st-crit"}">${sg}${esc(fmt(Math.abs(b.v)))}</em></div>`; }).join("")}</div>`;
}
function treemap(items, o = {}) {
  const W = o.w || 560, H = o.h || 300, tot = sum(items.map(i => i.v));
  if (!tot) return emptyChart(o.empty);
  const data = items.filter(i => i.v > 0).sort((a, b) => b.v - a.v).map(i => ({ ...i, a: i.v / tot * W * H })), out = [];
  const worst = (row, s) => { const ra = sum(row.map(r => r.a)), mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a)); return Math.max(s * s * mx / (ra * ra), ra * ra / (s * s * mn)); };
  let rest = data, x = 0, y = 0, w = W, h = H;
  while (rest.length) {
    const short = Math.min(w, h); let row = [rest[0]], best = worst(row, short), i = 1;
    while (i < rest.length) { const nr = [...row, rest[i]], wv = worst(nr, short); if (wv <= best) { row = nr; best = wv; i++; } else break; }
    const ra = sum(row.map(r => r.a));
    if (w >= h) { const cw = ra / h; let cy = y; for (const r of row) { const rh = r.a / cw; out.push({ ...r, x, y: cy, w: cw, h: rh }); cy += rh; } x += cw; w -= cw; }
    else { const rh = ra / w; let cx = x; for (const r of row) { const rw = r.a / rh; out.push({ ...r, x: cx, y, w: rw, h: rh }); cx += rw; } y += rh; h -= rh; }
    rest = rest.slice(row.length);
  }
  const g = out.map(r => { const key = r.key ?? r.l, sel = o.sel != null && o.sel !== key, fits = r.w > 64 && r.h > 34, maxc = Math.floor((r.w - 12) / 6.6);
    return `<g class="tm${o.xf ? " click" : ""}"${o.xf ? ` data-xf="${o.xf}|${esc(key)}"` : ""} ${tip(`${r.l}\n${eur(r.v)} · ${pct(r.v / tot)}${r.sub ? "\n" + r.sub : ""}`)}><rect x="${(r.x + 1).toFixed(1)}" y="${(r.y + 1).toFixed(1)}" width="${Math.max(0, r.w - 2).toFixed(1)}" height="${Math.max(0, r.h - 2).toFixed(1)}" rx="5" fill="${r.color}" opacity="${sel ? .25 : r.op ?? .85}"/>${fits ? `<text x="${(r.x + 8).toFixed(1)}" y="${(r.y + 18).toFixed(1)}" class="tml">${esc(r.l.length > maxc ? r.l.slice(0, Math.max(3, maxc - 1)) + "…" : r.l)}</text>${r.h > 48 ? `<text x="${(r.x + 8).toFixed(1)}" y="${(r.y + 34).toFixed(1)}" class="tmv">${esc(eur(r.v))} · ${pct(r.v / tot)}</text>` : ""}` : ""}</g>`; }).join("");
  return svgWrap(W, H, g, o.label || "Mapa de árvore", "chart tmap");
}
function funnel(stages, o = {}) {
  const mx = Math.max(...stages.map(s => s.v), 1);
  return `<div class="fun">${stages.map((s, i) => `<div class="fur" ${tip(`${s.l}: ${s.v}${i ? ` · ${stages[i - 1].v ? pct(s.v / stages[i - 1].v) : "–"} da etapa anterior` : ""}`)}><span class="hbl">${esc(s.l)}</span><div class="fut"><i style="width:${Math.max(4, s.v / mx * 100).toFixed(1)}%;background:${s.color || "var(--accent)"}"></i></div><em>${s.v}${i && stages[i - 1].v ? `<small>${pct(s.v / stages[i - 1].v)}</small>` : ""}</em></div>`).join("")}</div>`;
}
/* linha do tempo das metas: barra início→prazo, preenchimento = progresso, losango = onde deveria estar */
function gantt(rows, o = {}) {
  if (!rows.length) return emptyChart("Sem metas com início e prazo.");
  const W = o.w || 760, lw = o.lw || 200, rowH = 26, T = 26, H = T + rows.length * rowH + 8;
  let a = rows.reduce((m, r) => r.ini < m ? r.ini : m, rows[0].ini), b = rows.reduce((m, r) => r.fim > m ? r.fim : m, rows[0].fim);
  if (o.from && a < o.from) a = o.from; if (o.to && b > o.to) b = o.to; if (TODAY < a) a = TODAY; if (TODAY > b) b = TODAY;
  const span = Math.max(1, diff(b, a)), X = d => lw + clamp(diff(d, a) / span) * (W - lw - 10);
  let g = "";
  for (let mk = mkey(a); mk <= mkey(b); mk = addMonth(mk, 1)) { const x = X(mk + "-01"); if (x < lw) continue; g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T - 6}" y2="${H}" class="gl"/>`; if (diff(b, a) < 900 || mk.endsWith("-01")) g += `<text x="${(x + 3).toFixed(1)}" y="${T - 10}" class="ax">${esc(mk.endsWith("-01") ? mk.slice(0, 4) : mabbr(mk))}</text>`; }
  rows.forEach((r, i) => {
    const y = T + i * rowH, x0 = X(r.ini < a ? a : r.ini), x1 = X(r.fim > b ? b : r.fim), w = Math.max(3, x1 - x0);
    g += `<g class="gr click" data-edit="metas" data-id="${esc(r.id)}" ${tip(`${r.l}\n${fmtDY(r.ini)} → ${fmtDY(r.fim)}\nProgresso ${pct(r.prog)} · esperado ${pct(r.esp)}\n${r.rt}`)}><text x="0" y="${y + 16}" class="gtl">${esc(trunc(r.l, Math.floor(lw / 6.6)))}</text>
      <rect x="${x0.toFixed(1)}" y="${y + 6}" width="${w.toFixed(1)}" height="14" rx="7" fill="${r.color}" opacity=".22"/><rect x="${x0.toFixed(1)}" y="${y + 6}" width="${(w * clamp(r.prog)).toFixed(1)}" height="14" rx="7" fill="${r.color}"/>
      ${r.esp != null && r.esp < 1 ? `<path d="M${(x0 + w * r.esp).toFixed(1)},${y + 3} l4,10 -4,10 -4,-10z" class="gexp gx-${r.st}"/>` : ""}</g>`;
  });
  const xt = X(TODAY); g += `<line x1="${xt}" x2="${xt}" y1="${T - 6}" y2="${H}" class="today"/><text x="${xt + 4}" y="${H - 4}" class="ax today-t">hoje</text>`;
  return `<div class="hscroll">${svgWrap(W, H, g, "Linha do tempo das metas", "chart gantt")}</div>`;
}
/* calendário anual estilo contribuições: 7 linhas × semanas */
function calYear(map, o = {}) {
  const end = o.end || TODAY, weeks = o.weeks || 53, cs = 11, gap = 2.5, L = 26, T = 18;
  const start = addDays(weekStart(end), -7 * (weeks - 1)), W = L + weeks * (cs + gap) + 4, H = T + 7 * (cs + gap) + 4;
  const vals = Object.values(map).filter(isNum), lo = o.min ?? Math.min(...vals, 0), hi = o.max ?? Math.max(...vals, 1);
  const color = v => { if (!isNum(v)) return "var(--cell)"; const t = clamp((v - lo) / ((hi - lo) || 1));
    if (o.mode === "div") return t < .5 ? `color-mix(in srgb, var(--crit) ${Math.round((1 - t * 2) * 85)}%, var(--cell-mid))` : `color-mix(in srgb, var(--good) ${Math.round((t - .5) * 2 * 85)}%, var(--cell-mid))`;
    return `color-mix(in srgb, ${o.color || "var(--accent)"} ${Math.round(12 + t * 88)}%, var(--cell))`; };
  let g = ""; [0, 2, 4].forEach(r => g += `<text x="0" y="${T + r * (cs + gap) + cs - 2}" class="ax sm">${DOWS[(r + 1) % 7]}</text>`);
  for (let w = 0; w < weeks; w++) for (let r = 0; r < 7; r++) {
    const d = addDays(start, w * 7 + r); if (d > end) continue;
    const x = L + w * (cs + gap), y = T + r * (cs + gap), v = map[d];
    if (r === 0 && +d.slice(8) <= 7) g += `<text x="${x}" y="${T - 6}" class="ax sm">${mabbr(mkey(d))}</text>`;
    g += `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="2.5" style="fill:${color(v)}"${o.click ? ` class="click" data-${o.click}="${d}"` : ""} ${tip(`${fmtDL(d)}\n${isNum(v) ? (o.fmt || num)(v) : "sem registro"}`)}/>`;
  }
  return `<div class="hscroll">${svgWrap(W, H, g, o.label || "Calendário anual", "chart calyear")}</div>`;
}
/* calendário do mês com valor em cada dia */
function calMonth(mk, map, o = {}) {
  const first = parse(mk + "-01").getDay(), off = (first + 6) % 7, n = dim(mk), vals = Object.entries(map).filter(([d]) => mkey(d) === mk).map(([, v]) => v).filter(isNum);
  const hi = o.max ?? Math.max(...vals, 1), fmt = o.fmt || (v => num(v, 0));
  let h = `<div class="calm">${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(d => `<div class="cmh">${d}</div>`).join("")}${"<div></div>".repeat(off)}`;
  for (let d = 1; d <= n; d++) { const ds = `${mk}-${pad(d)}`, v = map[ds], t = isNum(v) && hi ? clamp(v / hi) : 0, fut = ds > TODAY;
    h += `<div class="cmd${fut ? " fut" : ""}${ds === TODAY ? " now" : ""}${o.click ? " click" : ""}"${o.click ? ` data-${o.click}="${ds}"` : ""} style="--t:${Math.round(t * 100)}%" ${tip(`${fmtDL(ds)}\n${isNum(v) && v ? fmt(v) : o.zero || "sem registro"}`)}><span>${d}</span>${isNum(v) && v ? `<b>${esc(fmt(v))}</b>` : ""}</div>`; }
  return h + "</div>";
}
/* matriz áreas × meses */
function heat(rows, cols, val, o = {}) {
  const c = v => v == null ? "var(--cell)" : v >= 5 ? `color-mix(in srgb, var(--good) ${Math.round((v - 5) * 17)}%, var(--cell-mid))` : `color-mix(in srgb, var(--crit) ${Math.round((5 - v) * 17)}%, var(--cell-mid))`;
  return `<div class="hscroll"><div class="heat" style="grid-template-columns:minmax(110px,170px) repeat(${cols.length},minmax(34px,1fr));min-width:${110 + cols.length * 37}px"><div></div>${cols.map(x => `<div class="hh">${esc(x)}</div>`).join("")}
  ${rows.map((r, i) => `<button type="button" class="hr${o.sel === r.key ? " sel" : ""}" ${o.xf ? `data-xf="${o.xf}|${esc(r.key)}"` : ""} aria-pressed="${o.sel === r.key}"><i style="background:${r.color || "var(--muted)"}"></i>${esc(r.l)}</button>${cols.map((cl, j) => { const v = val(i, j); return `<div class="hc${o.sel != null && o.sel !== r.key ? " dim" : ""}" style="background:${c(v)}" ${tip(`${r.l} · ${cl}: ${v == null ? "sem dados" : num(v)}`)}>${v == null ? "" : num(v, 1)}</div>`; }).join("")}`).join("")}</div></div>`;
}
function scatter(pts, o = {}) {
  const W = o.w || 520, H = o.h || 300, L = 46, B = 34, T = 12, Rr = 14, iw = W - L - Rr, ih = H - B - T;
  if (pts.length < 2) return emptyChart(o.empty || "Poucos pontos para cruzar.");
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const sx = o.xr ? { lo: o.xr[0], hi: o.xr[1], ticks: linTicks(o.xr[0], o.xr[1], 4) } : niceScale(Math.min(...xs), Math.max(...xs), 4);
  const sy = o.yr ? { lo: o.yr[0], hi: o.yr[1], ticks: linTicks(o.yr[0], o.yr[1], 4) } : niceScale(Math.min(...ys), Math.max(...ys), 4);
  const X = v => L + (v - sx.lo) / ((sx.hi - sx.lo) || 1) * iw, Y = v => T + ih - (v - sy.lo) / ((sy.hi - sy.lo) || 1) * ih;
  const fx = o.fmtX || (v => num(v, Math.abs(sx.hi - sx.lo) < 5 ? 1 : 0)), fy = o.fmtY || (v => num(v, Math.abs(sy.hi - sy.lo) < 5 ? 1 : 0));
  let g = "";
  for (const t of sy.ticks) g += `<line x1="${L}" x2="${W - Rr}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="gl"/><text x="${L - 7}" y="${(Y(t) + 3.5).toFixed(1)}" class="ax" text-anchor="end">${esc(fy(t))}</text>`;
  for (const t of sx.ticks) g += `<text x="${X(t).toFixed(1)}" y="${H - 18}" class="ax" text-anchor="middle">${esc(fx(t))}</text>`;
  g += `<text x="${L + iw / 2}" y="${H - 3}" class="ax lbl" text-anchor="middle">${esc(o.xl || "")}</text><text x="${-(T + ih / 2)}" y="11" class="ax lbl" text-anchor="middle" transform="rotate(-90)">${esc(o.yl || "")}</text>`;
  if (o.diag) g += `<line x1="${X(sx.lo)}" y1="${Y(sy.lo)}" x2="${X(sx.hi)}" y2="${Y(sy.hi)}" class="tgt"/>`;
  if (o.quad) g += `<line x1="${X(o.quad[0])}" x2="${X(o.quad[0])}" y1="${T}" y2="${T + ih}" class="tgt"/><line x1="${L}" x2="${W - Rr}" y1="${Y(o.quad[1])}" y2="${Y(o.quad[1])}" class="tgt"/>`;
  let seed = 3; const J = () => (seed = (seed * 9301 + 49297) % 233280) / 233280 - .5;
  const jx = o.jitter?.[0] || 0, jy = o.jitter?.[1] || 0, boxes = [];
  const free = b => b.x2 <= W && !boxes.some(q => b.x1 < q.x2 && b.x2 > q.x1 && b.y1 < q.y2 && b.y2 > q.y1);
  const P = pts.map(p => ({ p, cx: X(p.x + J() * jx), cy: Y(p.y + J() * jy) }));
  P.forEach(({ p, cx, cy }) => boxes.push({ x1: cx - (p.r || 4), x2: cx + (p.r || 4), y1: cy - (p.r || 4), y2: cy + (p.r || 4) }));
  g += P.map(({ p, cx, cy }) => { let lbl = ""; if (p.label) { const t = trunc(p.label, 24), w = t.length * 5.9, rr = p.r || o.r || 3.6;
      for (const [dx, dy, an] of [[rr + 4, 4, "start"], [-rr - 4, 4, "end"], [-w / 2, -rr - 5, "start"], [-w / 2, rr + 12, "start"]]) { const x1 = an === "end" ? cx + dx - w : cx + dx, b = { x1, x2: x1 + w, y1: cy + dy - 10, y2: cy + dy + 2 }; if (b.x1 >= 0 && free(b)) { boxes.push(b); lbl = `<text x="${(cx + dx).toFixed(1)}" y="${(cy + dy).toFixed(1)}" class="ax plbl" text-anchor="${an}">${esc(t)}</text>`; break; } } }
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${p.r || o.r || 3.6}" fill="${p.color || o.color || "var(--accent)"}" opacity="${p.op ?? o.op ?? .55}" class="sp${p.edit ? " click" : ""}"${p.edit ? ` data-edit="${p.edit[0]}" data-id="${esc(p.edit[1])}"` : ""} ${tip(p.tip || `${p.d ? fmtD(p.d) + " · " : ""}${o.xl}: ${fx(p.x)} · ${o.yl}: ${fy(p.y)}`)}/>${lbl}`; }).join("");
  if (o.fit) { const f = regress(pts); if (f) { const xa = sx.lo, xb = sx.hi; g += `<line x1="${X(xa)}" y1="${Y(clamp(f.a + f.b * xa, sy.lo, sy.hi))}" x2="${X(xb)}" y2="${Y(clamp(f.a + f.b * xb, sy.lo, sy.hi))}" class="fit"/>`; } }
  return svgWrap(W, H, g, `${o.xl} × ${o.yl}`);
}
function donut(parts, center, sub, o = {}) {
  const tot = sum(parts.map(p => p.v)), R = 64, r = 44, cx = 80, cy = 80; let a = -Math.PI / 2, g = "";
  if (!tot) g = `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="var(--cell)" stroke-width="${R - r}"/>`;
  for (const p of parts) { if (!p.v) continue; const f = p.v / tot, a2 = a + f * Math.PI * 2 - (parts.filter(q => q.v).length > 1 ? .025 : 0), big = f > .5 ? 1 : 0, P = (rad, ang) => `${(cx + Math.cos(ang) * rad).toFixed(2)},${(cy + Math.sin(ang) * rad).toFixed(2)}`;
    const key = p.key ?? p.l, sel = o.sel != null && o.sel !== key;
    g += `<path d="M${P(R, a)} A${R},${R} 0 ${big} 1 ${P(R, a2)} L${P(r, a2)} A${r},${r} 0 ${big} 0 ${P(r, a)}Z" fill="${p.color}" opacity="${sel ? .25 : 1}"${o.xf ? ` class="click" data-xf="${o.xf}|${esc(key)}"` : ""} ${tip(`${p.l}: ${(o.fmt || eur)(p.v)} (${pct(f)})`)}/>`; a += f * Math.PI * 2; }
  g += `<text x="${cx}" y="${cy + 3}" text-anchor="middle" class="dc">${esc(center)}</text><text x="${cx}" y="${cy + 20}" text-anchor="middle" class="ax">${esc(sub)}</text>`;
  return `<div class="donutwrap"><svg viewBox="0 0 160 160" class="donut" role="img" aria-label="${esc(sub)}">${g}</svg><div class="dleg">${parts.map(p => `<div${o.xf ? ` class="click" data-xf="${o.xf}|${esc(p.key ?? p.l)}"` : ""}><i style="background:${p.color}"></i><span>${esc(p.l)}</span><b>${tot ? pct(p.v / tot) : "–"}</b></div>`).join("")}</div></div>`;
}
function radar(areas) {
  const W = 380, H = 330, cx = 190, cy = 165, r = 112, n = areas.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r * v / 10, cy + Math.sin(a) * r * v / 10]; };
  let g = "";
  for (const v of [2, 4, 6, 8, 10]) g += `<polygon points="${areas.map((_, i) => pt(i, v).map(z => z.toFixed(1)).join(",")).join(" ")}" class="rgrid"/>`;
  areas.forEach((a, i) => { const [x, y] = pt(i, 10), [lx, ly] = pt(i, 11.9); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rgrid"/><text x="${lx.toFixed(1)}" y="${(ly + 3.5).toFixed(1)}" class="ax rl" text-anchor="${lx < cx - 8 ? "end" : lx > cx + 8 ? "start" : "middle"}">${esc(ashort(a.a))}</text>`; });
  const poly = (key, col, dash, op) => { if (!areas.some(a => a[key] != null)) return ""; const pts = areas.map((a, i) => pt(i, a[key] ?? 0).map(z => z.toFixed(1)).join(",")).join(" ");
    return `<polygon points="${pts}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="2" ${dash ? 'stroke-dasharray="4 3"' : ""}/>` + (dash ? "" : areas.map((a, i) => a[key] == null ? "" : `<circle cx="${pt(i, a[key])[0].toFixed(1)}" cy="${pt(i, a[key])[1].toFixed(1)}" r="3.2" fill="${col}" ${tip(`${a.a}: ${num(a[key])}`)}/>`).join("")); };
  g += poly("alvo", "var(--muted)", true, 0) + poly("perc", "var(--accent)", false, .12) + poly("dados", "var(--a-fis)", false, .1);
  return legend([{ name: "Percepção", color: "var(--accent)" }, { name: "Dados", color: "var(--a-fis)" }, { name: "Alvo", color: "var(--muted)", dash: true }]) + svgWrap(W, H, g, "Roda da Vida");
}
function sankey(F) {
  const W = 560, H = 300, colW = 12, gap = 6, groups = [["Essencial", GCOL["Essencial"]], ["Estilo de vida", GCOL["Estilo de vida"]], ["Crescimento", GCOL["Crescimento"]], ["Poupança", GCOL["Poupança"]]];
  const cats = Object.entries(F.cat).sort((a, b) => b[1] - a[1]), gv = { "Poupança": Math.max(0, F.res) };
  cats.forEach(([c, v]) => { const g = CAT_DESP[c] || "Estilo de vida"; gv[g] = (gv[g] || 0) + v; });
  const total = Math.max(F.rec, sum(Object.values(gv))); if (!total) return emptyChart("Sem receitas ou despesas no mês.");
  const sc = (H - 20 - gap * 12) / total, src = { x: 76, y: 10, h: total * sc };
  let g = `<rect x="${src.x}" y="${src.y}" width="${colW}" height="${src.h.toFixed(1)}" rx="3" fill="var(--g-pou)"/><text x="${src.x - 8}" y="${(src.y + src.h / 2).toFixed(1)}" text-anchor="end" class="sk1">Receita</text><text x="${src.x - 8}" y="${(src.y + src.h / 2 + 15).toFixed(1)}" text-anchor="end" class="ax">${esc(eur(F.rec))}</text>`;
  const gpos = {}; let sy = src.y, gy = 10;
  groups.forEach(([gname, col]) => { const v = gv[gname] || 0; if (!v) return; const h = v * sc; gpos[gname] = { y: gy, h, col, off: 0 };
    g += `<path d="M${src.x + colW},${sy.toFixed(1)} C${src.x + 90},${sy.toFixed(1)} 140,${gy.toFixed(1)} 220,${gy.toFixed(1)} L220,${(gy + h).toFixed(1)} C140,${(gy + h).toFixed(1)} ${src.x + 90},${(sy + h).toFixed(1)} ${src.x + colW},${(sy + h).toFixed(1)}Z" fill="${col}" opacity=".3" class="band2" ${tip(`Receita → ${gname}: ${eur(v)} (${F.rec ? pct(v / F.rec) : "–"} da receita)`)}/>`;
    g += `<rect x="220" y="${gy.toFixed(1)}" width="${colW}" height="${h.toFixed(1)}" rx="3" fill="${col}"/><text x="${220 + colW + 6}" y="${(gy + Math.min(h / 2 + 4, h + 10)).toFixed(1)}" class="sk1">${gname}</text>`;
    sy += h; gy += h + gap * 3; });
  let cy = 10; const cats2 = [...cats.slice(0, 9), ...(cats.length > 9 ? [["Outras", sum(cats.slice(9).map(c => c[1]))]] : [])], tx = 392;
  cats2.forEach(([c, v]) => { const grp = c === "Outras" ? "Estilo de vida" : CAT_DESP[c] || "Estilo de vida", gp = gpos[grp]; if (!gp) return; const h = v * sc, yA = gp.y + gp.off; gp.off += h;
    g += `<path d="M${220 + colW},${yA.toFixed(1)} C310,${yA.toFixed(1)} 330,${cy.toFixed(1)} ${tx},${cy.toFixed(1)} L${tx},${(cy + h).toFixed(1)} C330,${(cy + h).toFixed(1)} 310,${(yA + h).toFixed(1)} ${220 + colW},${(yA + h).toFixed(1)}Z" fill="${gp.col}" opacity=".2" class="band2 click" data-xf="cat|${esc(c)}" ${tip(`${grp} → ${c}: ${eur(v)}`)}/>`;
    g += `<rect x="${tx}" y="${cy.toFixed(1)}" width="8" height="${Math.max(2, h).toFixed(1)}" rx="2" fill="${gp.col}"/><text x="${tx + 14}" y="${(cy + Math.max(h, 13) / 2 + 4).toFixed(1)}" class="sk2">${esc(trunc(c, 20))} <tspan class="skv">${num(v, 0)}</tspan></text>`;
    cy += Math.max(h, 13) + gap; });
  return svgWrap(W, Math.max(H, cy + 6), g, "Fluxo da receita");
}
function hist(vals, o = {}) {
  const v = vals.filter(isNum); if (v.length < 3) return emptyChart();
  const lo = o.min ?? Math.min(...v), hi = o.max ?? Math.max(...v), nb = o.bins || 10, w = (hi - lo) / nb || 1, bins = Array(nb).fill(0);
  for (const x of v) bins[Math.min(nb - 1, Math.floor((x - lo) / w))]++;
  return colChart(bins.map((_, i) => (o.fmt || (z => num(z, 1)))(lo + i * w)), [{ name: o.name || "Dias", color: o.color || "var(--accent)", data: bins }], { h: o.h || 200, w: o.w, legend: false, fmt: z => num(z, 0), maxLabels: o.maxLabels || 6 });
}
function dumbbell(rows, o = {}) {
  const mx = o.max || Math.max(...rows.map(r => Math.max(r.a, r.b)), 1);
  return `<div class="dbl">${rows.map(r => `<div class="dbr${r.edit ? " click" : ""}"${r.edit ? ` data-edit="${r.edit[0]}" data-id="${esc(r.edit[1])}"` : ""} ${tip(`${r.l}: ${r.a} → ${r.b}`)}><span class="hbl">${esc(r.l)}</span><div class="dbt">${Array.from({ length: mx }, (_, i) => `<s style="left:${((i + 1) / mx * 100).toFixed(1)}%"></s>`).join("")}<u style="left:${(r.a / mx * 100).toFixed(1)}%;width:${(Math.max(0, r.b - r.a) / mx * 100).toFixed(1)}%"></u><i style="left:${(r.a / mx * 100).toFixed(1)}%"></i><b style="left:${(r.b / mx * 100).toFixed(1)}%"></b></div><em>${r.a}/${r.b}</em></div>`).join("")}</div>`;
}
/* barras divergentes a partir do zero (impacto: com × sem) */
function diverge(rows, o = {}) {
  if (!rows.length) return emptyChart(o.empty || "Poucos dados para comparar.");
  const mx = o.max || Math.max(...rows.map(r => Math.abs(r.v)), 1e-9), fmt = o.fmt || (v => sgn(v));
  return `<div class="dv">${rows.map(r => `<div class="dvr${r.go ? " click" : ""}"${r.go ? ` ${r.go}` : ""} ${tip(r.tip || `${r.l}: ${fmt(r.v)}`)}><span class="hbl">${esc(r.l)}${r.sub ? `<small>${esc(r.sub)}</small>` : ""}</span><div class="dvt"><div class="dvn">${r.v < 0 ? `<i style="width:${(Math.abs(r.v) / mx * 100).toFixed(1)}%"></i>` : ""}</div><div class="dvp">${r.v > 0 ? `<i style="width:${(r.v / mx * 100).toFixed(1)}%"></i>` : ""}</div></div><em class="${r.v > 0 ? "st-good" : r.v < 0 ? "st-crit" : ""}">${esc(fmt(r.v))}</em></div>`).join("")}</div>`;
}
function corrHeat(keys, o = {}) {
  const n = keys.length, M = keys.map(a => keys.map(b => a === b ? 1 : crossData(a, b, { days: o.days || 180 })));
  const c = r => r == null ? "var(--cell)" : r >= 0 ? `color-mix(in srgb, var(--accent) ${Math.round(Math.min(1, r) * 90)}%, var(--cell-mid))` : `color-mix(in srgb, var(--crit) ${Math.round(Math.min(1, -r) * 90)}%, var(--cell-mid))`;
  const lab = k => metric(k)?.l || k;
  return `<div class="hscroll"><div class="corr" style="grid-template-columns:minmax(118px,170px) repeat(${n},minmax(30px,1fr));min-width:${118 + n * 33}px"><div></div>${keys.map(k => `<div class="ch" title="${esc(lab(k))}">${esc(trunc(lab(k), 11))}</div>`).join("")}
    ${keys.map((a, i) => `<div class="crl">${esc(lab(a))}</div>${keys.map((b, j) => { const x = M[i][j], r = i === j ? 1 : x && x.n >= 15 ? x.r : null;
      return `<button type="button" class="cc${i === j ? " diag" : ""}" style="background:${i === j ? "var(--cell)" : c(r)}"${i !== j ? ` data-cx="${a}|${b}"` : ""} ${tip(i === j ? lab(a) : `${lab(a)} × ${lab(b)}\nr = ${r == null ? "dados insuficientes" : num(r, 2)}${x?.n ? ` · ${x.n} dias` : ""}`)}>${i === j ? "" : r == null ? "" : num(r, 1)}</button>`; }).join("")}`).join("")}</div></div>`;
}
function ring(p, color, size = 64, stroke = 7) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = clamp(p ?? 0);
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--cell)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
/* faixa de 28 dias (humor ou hábitos) */
function strip(days, key, mode) {
  const col = v => { if (v == null) return "var(--cell)"; if (mode === "div") { const t = (v - 1) / 4; return t < .5 ? `color-mix(in srgb, var(--crit) ${Math.round((1 - t * 2) * 85)}%, var(--cell-mid))` : `color-mix(in srgb, var(--good) ${Math.round((t - .5) * 170)}%, var(--cell-mid))`; }
    return `color-mix(in srgb, var(--accent) ${Math.round(v * 100)}%, var(--cell))`; };
  return `<div class="strip">${days.map(d => `<div style="background:${col(d[key])}" ${tip(`${fmtDL(d.d)}: ${d[key] == null ? "sem registro" : mode === "div" ? d[key] + "/5" : pct(d[key])}`)}></div>`).join("")}</div><div class="strip-l"><span>${fmtD(days[0].d)}</span><span>${fmtD(days.at(-1).d)}</span></div>`;
}
