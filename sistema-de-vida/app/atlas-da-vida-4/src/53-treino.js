/* ================================================================ Saúde → Treinos, com o Personal
   Fichas de academia montadas com a biblioteca de exercícios, registro de cada sessão série a série, progressão dupla, recordes,
   volume semanal por grupo muscular, corridas com ritmo e carga aguda:crônica, plano de corrida, e o Personal, que propõe fichas,
   registros e planos (você aprova).
   Dados: S.treino (perfil, fichas, plano de corrida), S.treinoLog (sessões de academia) e S.corridas. Cada sessão e cada corrida
   também preenchem o treino do check-in do dia (S.saude), a não ser que você já o tenha preenchido à mão.
   Contas (as mesmas no app, no prompt e nos testes):
   - Progressão dupla: todas as séries no topo da faixa de repetições com a mesma carga → sobe um degrau (2,5 kg em barras e
     máquinas, 2 kg em halteres, 5 kg em agachamento, terra, leg press e hack a partir de 60 kg); duas sessões seguidas com
     alguma série abaixo da faixa com a mesma carga → reduz 10%. Senão, mantém a carga e busca uma repetição a mais.
   - 1RM estimado (Epley): carga × (1 + repetições/30), só com até 12 repetições.
   - Volume: séries por grupo muscular (o grupo principal conta 1; os secundários, 0,5).
   - Corrida: ritmo = tempo / km. Carga aguda:crônica = km dos últimos 7 dias ÷ média semanal dos últimos 28 dias (até 1,3:
     faixa segura; acima de 1,5: risco alto). Plano: cada semana com até 10% (ou 2 km, o que for maior) acima da maior das 3
     anteriores (a 1ª, sobre a média das 4 semanas antes do plano, mínimo 8 km), no máximo 3 semanas seguidas de aumento, até
     2 sessões fortes por semana (1 para iniciantes) e pelo menos um dia sem corrida.
   - Previsão de prova (Riegel): T2 = T1 × (D2/D1)^1,06. */
/* biblioteca: [id, nome, grupo, secundários, equipamento, degrau de carga (kg), composto, apelidos] */
const TR_EX = [
  ["supino", "Supino reto com barra", "peito", "triceps ombros", "barra", 2.5, 1, "supino|supino reto|supino com barra|bench press|panca piana"],
  ["supinoh", "Supino reto com halteres", "peito", "triceps ombros", "halteres", 2, 1, "supino com halteres|supino reto com halteres|dumbbell press|panca con manubri"],
  ["supinoi", "Supino inclinado com halteres", "peito", "ombros triceps", "halteres", 2, 1, "supino inclinado|incline press|panca inclinata"],
  ["crucifixo", "Crucifixo / voador", "peito", "", "máquina", 2.5, 0, "crucifixo|voador|peck deck|fly|crossover|croci"],
  ["flexao", "Flexão de braço", "peito", "triceps ombros", "peso do corpo", 0, 1, "flexao|flexao de braco|flexoes|push up|pushup|piegamenti"],
  ["paralelas", "Paralelas (mergulho)", "triceps", "peito ombros", "peso do corpo", 0, 1, "paralelas|mergulho|dips|dip"],
  ["barra", "Barra fixa", "costas", "biceps", "peso do corpo", 0, 1, "barra fixa|pull up|pullup|chin up|trazioni"],
  ["puxada", "Puxada frontal (pulley)", "costas", "biceps", "máquina", 2.5, 1, "puxada|puxada frontal|pulldown|pulley frente|lat machine|lat pulldown"],
  ["remada", "Remada curvada com barra", "costas", "biceps", "barra", 2.5, 1, "remada curvada|remada com barra|barbell row|rematore"],
  ["remadah", "Remada unilateral com halter", "costas", "biceps", "halteres", 2, 1, "remada unilateral|serrote|dumbbell row|rematore con manubrio"],
  ["remadab", "Remada baixa (cabo)", "costas", "biceps", "cabo", 2.5, 1, "remada baixa|remada sentada|remada no cabo|seated row|pulley basso"],
  ["terra", "Levantamento terra", "posteriores", "gluteos costas", "barra", 5, 1, "terra|levantamento terra|deadlift|stacco"],
  ["desenv", "Desenvolvimento com halteres", "ombros", "triceps", "halteres", 2, 1, "desenvolvimento|desenvolvimento com halteres|shoulder press|lento avanti"],
  ["desenvb", "Desenvolvimento militar com barra", "ombros", "triceps", "barra", 2.5, 1, "desenvolvimento militar|desenvolvimento com barra|overhead press|military press|lento con bilanciere"],
  ["elevlat", "Elevação lateral", "ombros", "", "halteres", 1, 0, "elevacao lateral|lateral raise|alzate laterali"],
  ["facepull", "Face pull", "ombros", "costas", "cabo", 2.5, 0, "face pull|facepull"],
  ["crucinv", "Crucifixo invertido", "ombros", "costas", "halteres", 1, 0, "crucifixo invertido|voador invertido|reverse fly|crocifisso inverso"],
  ["encolh", "Encolhimento (trapézio)", "costas", "", "halteres", 2, 0, "encolhimento|trapezio|shrug|scrollate"],
  ["rosca", "Rosca direta com barra", "biceps", "", "barra", 2, 0, "rosca direta|rosca com barra|barbell curl|curl con bilanciere"],
  ["roscah", "Rosca alternada com halteres", "biceps", "", "halteres", 1, 0, "rosca alternada|rosca com halteres|dumbbell curl|curl con manubri"],
  ["roscam", "Rosca martelo", "biceps", "", "halteres", 1, 0, "rosca martelo|hammer curl|curl a martello"],
  ["tricp", "Tríceps na polia", "triceps", "", "cabo", 2.5, 0, "triceps polia|triceps na polia|triceps pulley|triceps corda|pushdown|push down|tricipiti ai cavi"],
  ["tricf", "Tríceps francês / testa", "triceps", "", "halteres", 2, 0, "triceps frances|triceps testa|skull crusher|french press"],
  ["agach", "Agachamento livre com barra", "quadriceps", "gluteos", "barra", 5, 1, "agachamento|agachamento livre|squat|back squat|squat con bilanciere"],
  ["goblet", "Agachamento goblet", "quadriceps", "gluteos", "halteres", 2, 1, "agachamento goblet|goblet|goblet squat"],
  ["hack", "Agachamento no hack ou smith", "quadriceps", "gluteos", "máquina", 5, 1, "hack|agachamento hack|agachamento no hack|smith|hack squat"],
  ["legpress", "Leg press 45°", "quadriceps", "gluteos", "máquina", 5, 1, "leg press|leg 45|pressa"],
  ["extensora", "Cadeira extensora", "quadriceps", "", "máquina", 2.5, 0, "extensora|cadeira extensora|leg extension"],
  ["afundo", "Afundo / passada", "quadriceps", "gluteos", "halteres", 2, 1, "afundo|passada|lunge|lunges|affondi"],
  ["bulgaro", "Agachamento búlgaro", "quadriceps", "gluteos", "halteres", 2, 1, "bulgaro|agachamento bulgaro|bulgarian split squat|split squat"],
  ["flexora", "Mesa ou cadeira flexora", "posteriores", "", "máquina", 2.5, 0, "flexora|mesa flexora|cadeira flexora|leg curl"],
  ["stiff", "Stiff / terra romeno", "posteriores", "gluteos", "barra", 2.5, 1, "stiff|terra romeno|romanian deadlift|rdl|stacco rumeno"],
  ["hipthrust", "Elevação pélvica (hip thrust)", "gluteos", "posteriores", "barra", 5, 1, "elevacao pelvica|hip thrust|glute bridge|ponte de gluteo"],
  ["abdutora", "Cadeira abdutora", "gluteos", "", "máquina", 2.5, 0, "abdutora|cadeira abdutora|abductor"],
  ["kbswing", "Kettlebell swing", "gluteos", "posteriores", "kettlebell", 4, 1, "kettlebell swing|swing|kettlebell"],
  ["pantp", "Panturrilha em pé", "panturrilhas", "", "máquina", 2.5, 0, "panturrilha|panturrilha em pe|calf raise|polpacci"],
  ["pants", "Panturrilha sentado", "panturrilhas", "", "máquina", 2.5, 0, "panturrilha sentado|seated calf"],
  ["prancha", "Prancha", "abdomen", "", "peso do corpo", 0, 0, "prancha|plank|plancia"],
  ["abdominal", "Abdominal (crunch)", "abdomen", "", "peso do corpo", 0, 0, "abdominal|abdominais|crunch|crunch addominali"],
  ["abdpolia", "Abdominal na polia", "abdomen", "", "cabo", 2.5, 0, "abdominal na polia|cable crunch"],
  ["elevpernas", "Elevação de pernas", "abdomen", "", "peso do corpo", 0, 0, "elevacao de pernas|leg raise|elevazioni gambe"],
  ["pallof", "Pallof press", "abdomen", "", "cabo", 2.5, 0, "pallof|pallof press"]];
const TR_GR = { peito: "Peito", costas: "Costas", ombros: "Ombros", biceps: "Bíceps", triceps: "Tríceps", quadriceps: "Quadríceps", posteriores: "Posteriores", gluteos: "Glúteos", panturrilhas: "Panturrilhas", abdomen: "Abdômen e core" };
const TR_OBJ = {
  hipertrofia: ["Ganhar massa muscular", "6 a 12 repetições (algumas séries de 12 a 20) com 1 a 3 de reserva, volume semanal por grupo na faixa do compromisso, progressão de carga e proteína em dia"],
  forca: ["Força", "3 a 6 repetições nos básicos (agachamento, supino, terra, desenvolvimento) com descansos de 2 a 4 min, e acessórios de 6 a 12"],
  emagrecimento: ["Perder gordura", "musculação para manter a massa magra (8 a 12 repetições) mais aeróbico; o déficit vem da alimentação, com o Nutri"],
  condicionamento: ["Condicionamento", "circuitos e séries de 12 a 15 com descanso curto, intervalados e aeróbico"],
  corrida: ["Corrida", "o plano de corrida em primeiro lugar e força 2 vezes por semana (6 a 10 repetições), com pernas, glúteos e core"],
  saude: ["Saúde e longevidade", "o mínimo da OMS: 150 a 300 min de atividade moderada por semana e força 2 vezes por semana; constância antes de intensidade"] };
const TR_COMPTX = {
  baixo: "2 a 3 sessões por semana de 30 a 45 min (corpo inteiro), 6 a 10 séries por grupo por semana, esforço moderado (3 a 4 repetições de reserva)",
  medio: "3 a 4 sessões por semana de 45 a 60 min (corpo inteiro ou superior/inferior), 10 a 15 séries por grupo por semana, 2 a 3 repetições de reserva",
  alto: "4 a 6 sessões por semana de 60 a 90 min (divisões como empurrar/puxar/pernas), 12 a 20 séries por grupo por semana, 1 a 2 repetições de reserva e semana de alívio a cada 4 a 8 semanas" };
const TR_FAIXA = { baixo: [6, 10], medio: [10, 15], alto: [12, 20] };
const TR_NIVEL = { iniciante: ["Iniciante", "menos de 1 ano de treino constante"], intermediario: ["Intermediário", "1 a 3 anos"], avancado: ["Avançado", "mais de 3 anos"] };
const TR_LOCAL = { academia: "Academia", casa: "Casa", livre: "Ao ar livre" };
/* tipos de corrida: [rótulo, forte?, orientação] */
const TR_CTIPO = { leve: ["Leve", 0, "conversando, sem ofegar"], longo: ["Longo", 0, "ritmo leve, 30 a 60 s/km mais lento que o de prova"], regenerativo: ["Regenerativo", 0, "bem leve, 20 a 30 min"], intercalado: ["Corrida e caminhada", 0, "alternar 1 a 2 min correndo e 1 a 2 min caminhando"], tempo: ["Tempo run", 1, "aquecer, 15 a 25 min em ritmo forte e controlado, desaquecer"], intervalado: ["Intervalado", 1, "aquecer, 5 a 8 tiros de 400 a 800 m com 2 min de trote, desaquecer"], fartlek: ["Fartlek", 1, "acelerações de 1 min a cada 4 min, no feeling"], prova: ["Prova", 1, "aquecer 10 min antes; boa prova!"] };
const TR_DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const TR_DIAN = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };
const TR_RPE = ["", "1 · muito leve", "2 · leve", "3 · leve", "4 · moderado", "5 · moderado", "6 · um pouco difícil", "7 · difícil", "8 · muito difícil", "9 · quase o máximo", "10 · máximo"];
const TR_ZONA = { abaixo: ["abaixo do habitual", ""], segura: ["faixa segura", "good"], atencao: ["subiu rápido: atenção", "warn"], alto: ["risco alto: reduza", "crit"] };
const TR_DIST = [[5, "5 km"], [10, "10 km"], [21.0975, "21 km"], [42.195, "42 km"]];
/* plano básico gerado pelo app: [rótulo, km da semana de pico, distância da prova] */
const TR_PLOBJ = { base: ["Base aeróbica", 20, 0], "5": ["5 km", 18, 5], "10": ["10 km", 28, 10], "21": ["Meia maratona", 38, 21.1] };
/* modelos de ficha: [nome, nível, [[exercício, séries, repetições]]] */
const TR_MODELOS = [
  ["Corpo inteiro A", "iniciante", [["agach", 3, "8-12"], ["supinoh", 3, "8-12"], ["puxada", 3, "8-12"], ["stiff", 3, "8-12"], ["elevlat", 2, "12-15"], ["prancha", 3, "30-45"]]],
  ["Corpo inteiro B", "iniciante", [["legpress", 3, "10-12"], ["desenv", 3, "8-12"], ["remadab", 3, "8-12"], ["hipthrust", 3, "8-12"], ["tricp", 2, "10-15"], ["roscah", 2, "10-15"]]],
  ["Superior", "intermediario", [["supino", 4, "6-10"], ["remada", 4, "6-10"], ["desenv", 3, "8-12"], ["puxada", 3, "8-12"], ["elevlat", 3, "12-15"], ["tricp", 3, "10-12"], ["rosca", 3, "10-12"]]],
  ["Inferior", "intermediario", [["agach", 4, "6-10"], ["stiff", 3, "8-10"], ["legpress", 3, "10-12"], ["flexora", 3, "10-12"], ["pantp", 3, "10-15"], ["elevpernas", 3, "10-15"]]],
  ["Empurrar", "avancado", [["supino", 4, "6-8"], ["supinoi", 3, "8-12"], ["desenvb", 3, "6-10"], ["elevlat", 4, "12-15"], ["paralelas", 3, "8-12"], ["tricf", 3, "10-12"]]],
  ["Puxar", "avancado", [["terra", 3, "4-6"], ["barra", 4, "6-10"], ["remadah", 3, "8-12"], ["facepull", 3, "12-15"], ["rosca", 3, "8-12"], ["roscam", 3, "10-12"]]],
  ["Pernas", "avancado", [["agach", 4, "6-8"], ["stiff", 3, "8-10"], ["bulgaro", 3, "8-12"], ["extensora", 3, "12-15"], ["flexora", 3, "10-12"], ["pants", 4, "12-15"]]]];
const TRV = { v: "fichas", ex: null };
function trD() {
  const d = (S.treino ||= {}); d.perfil ||= { nivel: "iniciante", objetivo: "saude", modo: "medio", dias: 3, minutos: 60, local: "academia", limitacoes: "" };
  d.fichas ||= []; if (d.planoCorrida === undefined) d.planoCorrida = null; S.treinoLog ||= []; S.corridas ||= []; return d;
}
let TR_LIB = null;
const trLib = () => TR_LIB ||= TR_EX.map(([id, nome, g, sec, eq, passo, comp, al]) => ({ id, nome, g, sec: sec ? sec.split(" ") : [], eq, passo, comp: !!comp, tempo: id === "prancha", al: [...new Set([norm(nome), ...al.split("|").map(norm)])] }));
const trEx = id => id ? trLib().find(e => e.id === id) || null : null;
const trLimpa = s => norm(s).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
/* exercício pelo id ou pelo nome (o apelido mais longo que aparece inteiro no texto) */
function trExMatch(txt) {
  const s = String(txt || "").trim(); if (!s) return null; const byId = trEx(s); if (byId) return byId;
  const t = ` ${trLimpa(s)} `; let best = null;
  for (const e of trLib()) for (const a0 of e.al) { const a = trLimpa(a0); if (a && t.includes(` ${a} `) && (!best || a.length > best.n)) best = { e, n: a.length }; }
  return best?.e || null;
}
const trKey = x => x.ex ? x.ex : "n:" + norm(x.nome);
/* “8-12”, “8–12”, “10” → [mín, máx] */
function trRange(r) { const m = String(r ?? "").replace(/\s+/g, "").match(/^(\d{1,3})(?:[-–a](\d{1,3}))?$/); if (!m) return null; const lo = +m[1], hi = m[2] ? +m[2] : lo; return lo >= 1 && hi >= lo ? [lo, hi] : null; }
const trPasso = (e, kg) => !e ? (kg > 0 ? 2.5 : 0) : e.passo === 5 && kg < 60 ? 2.5 : e.passo;
const trArred = (kg, p) => p > 0 ? Math.round(kg / p) * p : Math.round(kg * 10) / 10;
const trE1 = (kg, reps) => !(kg > 0) || !(reps > 0) || reps > 12 ? null : reps === 1 ? kg : kg * (1 + reps / 30);
function trMelhor(series) { let b = null; for (const z of series || []) { const e = trE1(+z.kg, +z.reps); if (e != null && (!b || e > b.e1)) b = { kg: +z.kg, reps: +z.reps, e1: e }; } return b; }
const trLogSorted = () => memo("trlogs", () => [...(S.treinoLog || [])].sort((a, b) => b.data.localeCompare(a.data) || (b.at || 0) - (a.at || 0)));
/* sessões com o exercício, da mais recente para a mais antiga (só séries feitas) */
function trHist(key, ate = TODAY) {
  const out = []; for (const s of trLogSorted()) { if (s.data > ate) continue; const it = (s.itens || []).find(x => trKey(x) === key); if (it) { const ss = (it.series || []).filter(z => +z.reps > 0); if (ss.length) out.push({ data: s.data, series: ss }); } } return out;
}
const trMaxCarga = key => { let m = null; for (const s of S.treinoLog || []) for (const it of s.itens || []) if (trKey(it) === key) for (const z of it.series || []) if (+z.reps > 0 && +z.kg > 0 && (m == null || +z.kg > m)) m = +z.kg; return m; };
const trFichaEx = key => { for (const f of trD().fichas) for (const x of f.exs) if (trKey(x) === key) return x; return null; };
/* a próxima carga de um exercício da ficha, pela progressão dupla */
function trProx(fx, ate = TODAY) {
  const e = trEx(fx.ex), H = trHist(trKey(fx), ate), rg = trRange(fx.reps), nS = +fx.series || 3, fk = fx.carga !== "" && fx.carga != null && isFinite(+fx.carga) ? +fx.carga : null, un = e?.tempo ? "s" : "repetições";
  if (!H.length) return fk != null ? { kg: fk, acao: "inicial", motivo: `carga inicial da ficha (${num(fk, 1)} kg): ajuste para sobrarem 2 a 3 repetições` } : { kg: null, acao: "novo", motivo: "primeira vez: escolha uma carga que deixe 2 a 3 repetições de reserva" };
  const top = s => Math.max(0, ...s.series.map(z => +z.kg || 0)), trab = s => s.series.filter(z => (+z.kg || 0) === top(s)), kg = top(H[0]), passo = trPasso(e, kg);
  if (!rg) return { kg, acao: "manter", motivo: "sem faixa de repetições na ficha" };
  const u = trab(H[0]);
  if (u.length >= nS && u.every(z => +z.reps >= rg[1])) return passo > 0 && kg > 0 ? { kg: kg + passo, acao: "subir", motivo: `${nS} séries no topo da faixa (${rg[1]} ${un}) com ${num(kg, 1)} kg: suba para ${num(kg + passo, 1)} kg` } : { kg, acao: "subir", motivo: `bateu ${rg[1]} ${un} em todas as séries: aumente a dificuldade (mais ${un}, variação mais difícil ou carga extra)` };
  const abaixo = s => trab(s).some(z => +z.reps < rg[0]);
  if (H.length >= 2 && kg > 0 && top(H[1]) === kg && abaixo(H[0]) && abaixo(H[1])) { const r = Math.max(0, Math.min(kg - passo, trArred(kg * .9, passo))); return { kg: r, acao: "reduzir", motivo: `duas sessões seguidas abaixo de ${rg[0]} ${un} com ${num(kg, 1)} kg: reduza para ${num(r, 1)} kg e reconstrua` }; }
  return { kg, acao: "manter", motivo: kg > 0 ? `mantenha ${num(kg, 1)} kg e busque uma repetição a mais (meta: ${nS} × ${rg[1]})` : `busque uma repetição a mais (meta: ${nS} × ${rg[1]} ${un})` };
}
/* recordes (1RM estimado) por exercício: o primeiro dia em que cada marca foi atingida */
function trRecordes() {
  return memo("trprs", () => { const B = new Map(); for (const s of [...trLogSorted()].reverse()) for (const it of s.itens || []) { const m = trMelhor(it.series); if (!m) continue; const k = trKey(it), b = B.get(k); if (!b || m.e1 > b.e1 + 1e-9) B.set(k, { k, nome: it.nome, data: s.data, ...m }); }
    return [...B.values()].sort((a, b) => b.data.localeCompare(a.data) || b.e1 - a.e1); });
}
function trNovosRecordes(itens) { const R = new Map(trRecordes().map(r => [r.k, r])), out = []; for (const it of itens) { const m = trMelhor(it.series), r = R.get(trKey(it)); if (m && r && m.e1 > r.e1 + 1e-9) out.push({ nome: it.nome, e1: m.e1 }); } return out; }
function trExsLogados() { const M = new Map(); for (const s of S.treinoLog || []) for (const it of s.itens || []) { const k = trKey(it), x = M.get(k) || { k, nome: it.nome, n: 0 }; x.n++; M.set(k, x); } return [...M.values()].sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome)); }
/* séries por grupo entre as datas a e b: o grupo principal conta 1 e os secundários 0,5 */
function trVolume(a, b) {
  const V = Object.fromEntries(Object.keys(TR_GR).map(g => [g, 0]));
  for (const s of S.treinoLog || []) if (s.data >= a && s.data <= b) for (const it of s.itens || []) { const e = trEx(it.ex), g = e ? e.g : it.g, n = (it.series || []).filter(z => +z.reps > 0).length; if (V[g] != null) V[g] += n; for (const x of e?.sec || []) if (V[x] != null) V[x] += n / 2; }
  return V;
}
function trVolFicha(exs) { const g = {}; let tot = 0; for (const x of exs) { const e = trEx(x.ex), n = +x.series || 0, pg = e ? e.g : x.g; tot += n; if (pg) g[pg] = (g[pg] || 0) + n; for (const s of e?.sec || []) g[s] = (g[s] || 0) + n / 2; } return { g, tot }; }

/* ---------------------------------------------------------------- corrida */
const trPace = (min, km) => km > 0 && min > 0 ? min / km : null;
const trFmtMin = m => { if (!(m > 0)) return "–"; const s = Math.round(m * 60), h = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`; };
const trFmtPace = p => p == null || !isFinite(p) ? "–" : `${trFmtMin(p)}/km`;
/* “25:30” = 25,5 min · “1:05:00” = 65 min · “45” = 45 min */
function trParseTempo(v) {
  if (v == null || v === "") return null; if (typeof v === "number") return v > 0 ? v : NaN;
  const s = String(v).trim().replace(",", "."); if (/^\d+(\.\d+)?$/.test(s)) return +s;
  const p = s.split(":"); if (p.length < 2 || p.length > 3 || p.some(x => !/^\d+(\.\d+)?$/.test(x))) return NaN; const n = p.map(Number); if (n.slice(1).some(x => x >= 60)) return NaN;
  return p.length === 2 ? n[0] + n[1] / 60 : n[0] * 60 + n[1] + n[2] / 60;
}
const trKm = (a, b) => sum((S.corridas || []).filter(c => c.data >= a && c.data <= b).map(c => +c.km || 0));
function trAcwr(hoje = TODAY) {
  const ag = trKm(addDays(hoje, -6), hoje), cr = trKm(addDays(hoje, -27), hoje) / 4; if (!(cr > 0)) return null;
  const prim = (S.corridas || []).map(c => c.data).filter(Boolean).sort()[0], r = ag / cr;
  return { r, ag, cr, pouca: !prim || diff(hoje, prim) < 21, zona: r < .8 ? "abaixo" : r <= 1.3 ? "segura" : r <= 1.5 ? "atencao" : "alto" };
}
function trSemanas(n, hoje = TODAY) {
  const w0 = weekStart(hoje), out = []; for (let k = n - 1; k >= 0; k--) { const a = addDays(w0, -7 * k), b = addDays(a, 6); out.push({ a, b, km: trKm(a, b), ses: (S.treinoLog || []).filter(s => s.data >= a && s.data <= b).length, cor: (S.corridas || []).filter(c => c.data >= a && c.data <= b).length }); } return out;
}
/* previsão de prova (Riegel): da melhor prova dos últimos 90 dias ou, sem prova, do melhor treino de 3 km ou mais em 60 dias */
function trRiegel(hoje = TODAY) {
  const C = (S.corridas || []).filter(c => c.data >= addDays(hoje, -89) && c.data <= hoje && +c.km >= 3 && +c.min > 0), pv = C.filter(c => c.tipo === "prova"), base = pv.length ? pv : C.filter(c => c.data >= addDays(hoje, -59));
  if (!base.length) return null; const pred = (c, d) => +c.min * (d / +c.km) ** 1.06, ref = base.reduce((a, c) => pred(c, 10) < pred(a, 10) ? c : a);
  return { ref, deProva: pv.length > 0, alvo: TR_DIST.map(([d, l]) => ({ d, l, min: pred(ref, d) })) };
}
function trPlanoSemana(pl, hoje = TODAY) {
  if (!pl?.semanas?.length) return null; const i = Math.floor(diff(hoje, pl.inicio) / 7); if (i < 0 || i >= pl.semanas.length) return null;
  const a = addDays(pl.inicio, 7 * i), b = addDays(a, 6), sem = pl.semanas[i]; return { i, a, b, sem, total: sum(sem.sessoes.map(x => +x.km)), feito: trKm(a, b) };
}
const trPlanoKm = (pl, a) => { const i = diff(a, pl.inicio) / 7; return Number.isInteger(i) && i >= 0 && i < pl.semanas.length ? r1(sum(pl.semanas[i].sessoes.map(x => +x.km))) : null; };
const trDiaKey = v => { const n = norm(v).replace(/[^a-z]/g, "").slice(0, 3); return TR_DIAS.includes(n) ? n : null; };
const trTipoKey = v => TR_CTIPO[v] ? v : v ? Object.keys(TR_CTIPO).find(k => norm(TR_CTIPO[k][0]) === norm(v)) || null : null;
/* as regras do plano valem para o Personal e para o plano básico gerado aqui */
function trValidaPlano(d, P = trD().perfil) {
  const objetivo = String(d.objetivo || "").trim().slice(0, 60); if (!objetivo) return { erro: "dê um objetivo ao plano (ex.: 10 km, base aeróbica)" };
  const SW = Array.isArray(d.semanas) ? d.semanas : []; if (!SW.length || SW.length > 24) return { erro: "de 1 a 24 semanas" };
  const i0 = d.inicio ? sdData(d.inicio, null) : null; if (d.inicio && !i0) return { erro: "início como AAAA-MM-DD" };
  const inicio = weekStart(i0 || addDays(weekStart(TODAY), 7)); if (inicio < weekStart(TODAY)) return { erro: "o plano não pode começar numa semana que já passou" };
  const prova = d.prova ? sdData(d.prova, null) : ""; if (d.prova && (!prova || prova < inicio || prova > addDays(inicio, 7 * SW.length - 1))) return { erro: "a data da prova precisa cair dentro do plano" };
  const nv = TR_NIVEL[P.nivel] ? P.nivel : "iniciante", maxSes = { iniciante: 4, intermediario: 5, avancado: 6 }[nv], maxForte = nv === "iniciante" ? 1 : 2, semanas = [];
  for (let w = 0; w < SW.length; w++) {
    const ss = Array.isArray(SW[w]?.sessoes) ? SW[w].sessoes : []; if (!ss.length) return { erro: `semana ${w + 1} sem sessões` };
    if (ss.length > maxSes) return { erro: `semana ${w + 1}: ${ss.length} corridas; o máximo para o nível ${TR_NIVEL[nv][0].toLowerCase()} é ${maxSes}` };
    const vistos = new Set(), out = [];
    for (const s of ss) { const dia = trDiaKey(s?.dia); if (!dia) return { erro: `semana ${w + 1}: dia inválido (${s?.dia ?? "vazio"}); use seg, ter, qua, qui, sex, sab ou dom` }; if (vistos.has(dia)) return { erro: `semana ${w + 1}: duas corridas na ${TR_DIAN[dia].toLowerCase()}` }; vistos.add(dia);
      const tp = trTipoKey(s.tipo); if (!tp) return { erro: `semana ${w + 1}: tipo inválido (${s.tipo}); use ${Object.keys(TR_CTIPO).join(", ")}` };
      const km = sdNum(s.km, .5, 45); if (km == null || Number.isNaN(km)) return { erro: `semana ${w + 1}: cada sessão de 0,5 a 45 km` };
      out.push({ dia, tipo: tp, km: Math.round(km * 10) / 10, obs: String(s.obs || "").trim().slice(0, 140) }); }
    out.sort((a, b) => TR_DIAS.indexOf(a.dia) - TR_DIAS.indexOf(b.dia));
    const fortes = out.filter(s => TR_CTIPO[s.tipo][1]).length; if (fortes > maxForte) return { erro: `semana ${w + 1}: ${fortes} sessões fortes (intervalado, ritmo, fartlek ou prova); o máximo é ${maxForte}` };
    semanas.push({ sessoes: out });
  }
  const tot = semanas.map(s => sum(s.sessoes.map(x => x.km))), base = trKm(addDays(inicio, -28), addDays(inicio, -1)) / 4, lim0 = Math.max(base * 1.1, base + 2, 8);
  if (tot[0] > lim0 + .05) return { erro: `a semana 1 tem ${num(tot[0], 1)} km; com a média recente de ${num(base, 1)} km por semana, o máximo seguro é ${num(lim0, 1)} km` };
  let seguidas = 0;
  for (let w = 1; w < tot.length; w++) {
    const ref = Math.max(...tot.slice(Math.max(0, w - 3), w)), lim = Math.max(ref * 1.1, ref + 2);
    if (tot[w] > lim + .05) return { erro: `a semana ${w + 1} tem ${num(tot[w], 1)} km: mais de 10% (ou 2 km) acima de ${num(ref, 1)} km, a maior das 3 semanas anteriores (máximo ${num(lim, 1)} km)` };
    seguidas = tot[w] > tot[w - 1] + .05 ? seguidas + 1 : 0; if (seguidas > 3) return { erro: `mais de 3 semanas seguidas de aumento (até a semana ${w + 1}); ponha uma semana de alívio, com menos km, a cada 3 ou 4` };
  }
  return { dados: { objetivo, prova: prova || "", inicio, semanas, motivo: String(d.motivo || "").trim().slice(0, 300) } };
}
/* plano básico: começa na próxima segunda, sobe até 10% (ou 2 km) por semana até o pico do objetivo, alivia 20% a cada 4ª semana,
   uma sessão de qualidade por semana a partir da 3ª e, com prova, a última semana é de polimento */
function trGerarPlano(o, P = trD().perfil) {
  const key = TR_PLOBJ[o.obj] ? o.obj : "base", [rot, pico0, dist] = TR_PLOBJ[key], N = clamp(Math.round(+o.semanas || 8), 4, 16), ini = P.nivel === "iniciante", dias = +o.dias === 4 && !ini ? 4 : 3;
  const inicio = addDays(weekStart(TODAY), 7), base = trKm(addDays(inicio, -28), addDays(inicio, -1)) / 4, f5 = v => Math.floor(v * 2) / 2, pico = Math.max(pico0, f5(Math.max(8, base)));
  const nT = dist ? N - 1 : N, tot = [f5(Math.max(8, base))];
  for (let w = 1; w < nT; w++) { const ref = Math.max(...tot.slice(Math.max(0, w - 3), w)); tot.push(w % 4 === 3 ? f5(ref * .8) : f5(Math.min(pico, ref + Math.max(ref * .1, 2)))); }
  if (dist && Math.max(...tot) < dist * 1.3) return { erro: `em ${N} semanas, partindo de ${num(base, 1)} km por semana, o volume não chega a um nível seguro para ${rot.toLowerCase()} (precisa de ${num(dist * 1.3, 0)} km numa semana). Escolha mais semanas ou um objetivo menor.` };
  const dsem = dias === 4 ? [["seg", "leve", .22], ["qua", "q", .23], ["sex", "leve", .2], ["dom", "longo", .35]] : [["ter", "leve", .3], ["qui", "q", .3], ["dom", "longo", .4]];
  const qIni = ini ? (base < 5 ? 4 : 3) : 2;   // a sessão de qualidade entra depois das semanas de adaptação
  const semanas = tot.map((t, w) => { const alivio = w % 4 === 3, iv = ini && base < 5 && w < 3, ss = dsem.map(([dia, tp, f]) => { const tipo = tp === "q" ? (w >= qIni && !alivio ? (ini ? "fartlek" : w % 2 ? "tempo" : "intervalado") : iv ? "intercalado" : "leve") : iv ? "intercalado" : tp; return { dia, tipo, km: Math.max(1, f5(t * f)), obs: TR_CTIPO[tipo][2] }; });
    const resto = r1(t - sum(ss.slice(0, -1).map(x => x.km))); ss[ss.length - 1].km = Math.max(1, resto); return { sessoes: ss }; });
  /* polimento: corridas curtas e soltas, sem passar do volume da semana anterior, e a prova no domingo */
  if (dist) { const ant = tot.at(-1), lv = f5(clamp((ant * .9 - dist) / (dias - 1), 1.5, 5)), ult = []; let t = dist;
    for (const [dia] of dsem.slice(0, -1)) if (t + lv <= ant + .01) { ult.push({ dia, tipo: "leve", km: lv, obs: "curta e solta: a semana é de polimento" }); t += lv; }
    semanas.push({ sessoes: [...ult, { dia: "dom", tipo: "prova", km: dist, obs: TR_CTIPO.prova[2] }] }); }
  const v = trValidaPlano({ objetivo: `${rot} em ${N} semanas`, inicio, prova: dist ? addDays(inicio, 7 * N - 1) : "", semanas, motivo: `Plano básico do app: partindo de ${num(base, 1)} km por semana (média das últimas 4), até ${num(Math.max(...tot), 0)} km, com alívio a cada 4 semanas.` }, P);
  if (v.erro) return v;
  const longo = Math.max(...semanas.flatMap(s => s.sessoes.filter(x => x.tipo === "longo").map(x => x.km)), 0), alvoL = { "5": 5, "10": 8, "21": 16 }[key];
  return { dados: v.dados, aviso: alvoL && longo < alvoL ? `O longão mais comprido fica em ${num(longo, 1)} km; para ${rot.toLowerCase()} o ideal é chegar a ${alvoL} km. Se der, escolha mais semanas.` : "" };
}

/* ---------------------------------------------------------------- check-in: a sessão e a corrida preenchem o treino do dia */
function trSyncDia(d) {
  const G = (S.treinoLog || []).filter(s => s.data === d), C = (S.corridas || []).filter(c => c.data === d), e = { ...(S.saude[d] || {}) };
  if (e.treino && e.trAuto !== `${e.treino}|${e.min ?? ""}`) return false;   // preenchido à mão no check-in: fica como está
  if (!G.length && !C.length) { if (!e.trAuto) return false; delete e.treino; delete e.min; delete e.trAuto; if (Object.keys(e).length) S.saude[d] = e; else delete S.saude[d]; return true; }
  const mG = sum(G.map(s => +s.dur || 0)), mC = sum(C.map(c => +c.min || 0)), tipo = (G.length && (mG >= mC || !C.length) ? findIn(TREINOS, "Musculação") : findIn(TREINOS, "Corrida")) || "Outro", min = Math.round(mG + mC);
  S.saude[d] = { ...e, treino: tipo, min, trAuto: `${tipo}|${min}` }; return true;
}

/* ---------------------------------------------------------------- telas */
function trKpis() {
  const P = trD().perfil, W = trSemanas(1)[0], V = trVolume(addDays(TODAY, -6), TODAY), tot = sum(Object.values(V).map(v => v)), ult = trLogSorted()[0], pl = trD().planoCorrida, ps = pl ? trPlanoSemana(pl) : null, F = TR_FAIXA[P.modo] || TR_FAIXA.medio;
  return kpiRow([kmini("var(--a-car)", "Treinos na semana", `${W.ses + W.cor} de ${P.dias}`, `${plural(W.ses, "academia", "academia")} · ${plural(W.cor, "corrida", "corridas")}`, W.ses + W.cor >= P.dias ? "good" : ""),
    kmini("var(--a-apr)", "Séries em 7 dias", num(tot, 0), `por grupo: referência ${F[0]} a ${F[1]} por semana`),
    kmini("var(--good)", "Km na semana", `${num(W.km, 1)} km`, ps ? `plano: ${num(ps.total, 1)} km (semana ${ps.i + 1} de ${pl.semanas.length})` : "sem plano de corrida"),
    kmini("var(--a-fam)", "Última sessão", ult ? relDay(ult.data) : "–", ult ? esc(ult.nome || "Treino livre") : "nenhuma registrada")]);
}
function trFichasV() {
  const d = trD(), draft = trDraft();
  const cards = d.fichas.map(f => { const vf = trVolFicha(f.exs);
    return `<article class="trficha"><header><h3>${esc(f.nome)}</h3><small class="muted">${plural(f.exs.length, "exercício", "exercícios")} · ${vf.tot} séries${f.origem && f.origem !== "você" ? ` · ${esc(f.origem)}` : ""}</small></header>
      <div class="hscroll"><table class="dt trft"><thead><tr><th>Exercício</th><th class="num">Séries</th><th>Reps</th><th class="num">Próxima carga</th><th class="num">Descanso</th></tr></thead><tbody>${f.exs.map(x => { const pr = trProx(x), e = trEx(x.ex);
        return `<tr><td>${esc(x.nome)}${x.obs ? `<small class="muted">${esc(x.obs)}</small>` : ""}</td><td class="num">${x.series}</td><td>${esc(x.reps)}${e?.tempo ? " s" : ""}</td><td class="num">${pr.kg > 0 ? `${num(pr.kg, pr.kg % 1 ? 1 : 0)} kg` : pr.kg === 0 ? `<span class="muted">corpo</span>` : "–"}${pr.acao === "subir" ? ` <span class="st-good" ${tip(pr.motivo)}>▲</span>` : pr.acao === "reduzir" ? ` <span class="st-warn" ${tip(pr.motivo)}>▼</span>` : ""}</td><td class="num">${x.desc ? `${x.desc} s` : ""}</td></tr>`; }).join("")}</tbody></table></div>
      ${f.obs ? `<p class="muted small">${esc(f.obs)}</p>` : ""}
      <footer class="row wrap"><button type="button" class="btn sm primary" data-trtreinar="${f.id}">${ic("bolt")}Treinar</button><button type="button" class="btn sm ghost" data-trfedit="${f.id}">${ic("pen")}Editar</button><button type="button" class="btn sm ghost" data-trfdup="${f.id}">${ic("copy")}Duplicar</button><button type="button" class="btn sm ghost" data-trfdel="${f.id}" aria-label="Apagar a ficha ${esc(f.nome)}">${ic("trash")}</button></footer></article>`; }).join("");
  const mod = panel(`${ic("layers")}Modelos prontos`, `<p class="muted small">Pontos de partida por nível. Na primeira semana, ajuste as cargas para sobrarem 2 a 3 repetições.</p><div class="trmods">${Object.entries(TR_NIVEL).map(([nk, [nl]]) => `<div><b>${nl}</b>${TR_MODELOS.filter(m => m[1] === nk).map(m => `<button type="button" class="btn sm" data-trmodelo="${esc(m[0])}">${ic("plus")}${esc(m[0])}</button>`).join("")}</div>`).join("")}</div>`);
  return `${trKpis()}<div class="row wrap trtop"><button type="button" class="btn primary" data-act="trnova">${ic("plus")}Nova ficha</button>${draft ? `<button type="button" class="btn" data-trv="registrar">${ic("bolt")}Continuar o treino em andamento</button>` : ""}</div>
    ${d.fichas.length ? `<div class="trfichas">${cards}</div>` : `<div class="empty">Nenhuma ficha ainda. Crie uma, use um modelo ou peça ao Personal.</div>`}${mod}`;
}
const trNomeLivre = nome => { const fs = trD().fichas; let n = nome, k = 2; while (fs.some(f => norm(f.nome) === norm(n))) n = `${nome} (${k++})`; return n; };
function trSalvaFicha(v, origem) { const d = trD(), f = { id: v.subst || uid(), nome: v.nome, obs: v.obs, exs: v.exs, at: Date.now(), origem }; const i = d.fichas.findIndex(x => x.id === v.subst); if (i >= 0) d.fichas[i] = f; else d.fichas.push(f); return f; }
function trFichaDlg(id) {
  const f = trD().fichas.find(x => x.id === id), exs = f ? f.exs : [{}, {}, {}];
  const row = x => `<div class="trfrow"><input type="text" list="tr_dl" class="trf_ex" value="${esc(x.nome || "")}" placeholder="Exercício" aria-label="Exercício"><input type="number" class="trf_s" min="1" max="10" value="${esc(x.series ?? 3)}" aria-label="Séries"><input type="text" class="trf_r" value="${esc(x.reps ?? "8-12")}" aria-label="Repetições (faixa)"><input type="number" class="trf_c" min="0" step="0.5" value="${esc(x.carga ?? "")}" placeholder="kg" aria-label="Carga em kg"><input type="number" class="trf_d" min="10" max="600" step="15" value="${esc(x.desc ?? "")}" placeholder="s" aria-label="Descanso em segundos"><input type="text" class="trf_o" value="${esc(x.obs || "")}" placeholder="obs." aria-label="Observação"><button type="button" class="vb trf_x" aria-label="Tirar o exercício">${ic("x")}</button></div>`;
  $("#dlg").innerHTML = `<form method="dialog" class="trfdlg"><h3>${f ? "Editar ficha" : "Nova ficha"}</h3><label class="lbl">Nome<input type="text" id="trf_nome" value="${esc(f?.nome || "")}" placeholder="ex.: Treino A · Superior"></label>
    <div class="trfhead" aria-hidden="true"><span>Exercício</span><span>Séries</span><span>Reps</span><span>kg</span><span>Desc. (s)</span><span>Obs.</span><span></span></div><div id="trf_rows">${exs.map(row).join("")}</div>
    <button type="button" class="btn sm" id="trf_add">${ic("plus")}Exercício</button>
    <label class="lbl">Observações<textarea id="trf_obs" rows="2">${esc(f?.obs || "")}</textarea></label>
    <datalist id="tr_dl">${trLib().map(e => `<option value="${esc(e.nome)}">${esc(TR_GR[e.g])} · ${esc(e.eq)}</option>`).join("")}</datalist>
    <p class="muted small" id="trf_msg">Repetições como faixa (8-12) ou número; na prancha, segundos. Nomes fora da biblioteca valem, mas não entram no volume por grupo.</p>
    <div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="trfno">Cancelar</button><button type="button" class="btn primary" id="trfok">Salvar ficha</button></div></div></form>`;
  const dl = $("#dlg"); dl.showModal();
  $("#trfno").onclick = () => dl.close();
  $("#trf_add").onclick = () => { $("#trf_rows").insertAdjacentHTML("beforeend", row({})); $("#trf_rows .trfrow:last-child .trf_ex")?.focus(); };
  $("#trf_rows").onclick = e => { const b = e.target.closest(".trf_x"); if (b) b.closest(".trfrow").remove(); };
  $("#trfok").onclick = () => {
    const rows = [...document.querySelectorAll("#trf_rows .trfrow")].map(r => ({ exercicio: r.querySelector(".trf_ex").value.trim(), series: r.querySelector(".trf_s").value, reps: r.querySelector(".trf_r").value, carga: r.querySelector(".trf_c").value, descanso: r.querySelector(".trf_d").value, obs: r.querySelector(".trf_o").value })).filter(x => x.exercicio);
    const v = trValidaFicha({ nome: $("#trf_nome").value, exercicios: rows, obs: $("#trf_obs").value, substituir: f?.id }, false, { novo: !f });
    if (v.erro) { $("#trf_msg").innerHTML = `<span class="st-crit">${esc(v.erro)}</span>`; return; }
    if (!f) v.dados.nome = trNomeLivre(v.dados.nome);
    dl.close(); trSalvaFicha(v.dados, f?.origem || "você"); touch("treino", { label: f ? `Ficha ${v.dados.nome} editada` : `Ficha ${v.dados.nome} criada` }); if (v.dados.avisos.length) toast(v.dados.avisos.join(" "));
  };
}
/* treino em andamento: fica neste aparelho até salvar ou descartar */
const trDraft = () => { if (TRV.draft === undefined) { try { TRV.draft = JSON.parse(sdLS("trdraft") || "null"); } catch { TRV.draft = null; } } return TRV.draft; };
const trDraftSave = () => sdLS("trdraft", TRV.draft ? JSON.stringify(TRV.draft) : "");
function trNovoDraft(fid) {
  const f = trD().fichas.find(x => x.id === fid);
  TRV.draft = { data: TODAY, ficha: f?.id || "", nome: f?.nome || "Treino livre", dur: "", rpe: "", obs: "", ini: Date.now(),
    itens: (f?.exs || []).map(x => { const pr = trProx(x); return { ex: x.ex, nome: x.nome, g: x.g || "", reps: x.reps, desc: x.desc, sug: pr, series: Array.from({ length: +x.series || 3 }, () => ({ reps: "", kg: pr.kg ?? "" })) }; }) };
  trDraftSave();
}
function trRegV() {
  const D = trDraft(), d = trD();
  if (!D) return `${panel(`${ic("bolt")}Começar um treino`, `<div class="trstart">${d.fichas.map(f => `<button type="button" class="btn" data-trtreinar="${f.id}">${ic("dumbbell")}<span>${esc(f.nome)}<small class="muted">${plural(f.exs.length, "exercício", "exercícios")}</small></span></button>`).join("")}<button type="button" class="btn ghost" data-trtreinar="">${ic("plus")}Treino livre</button></div><p class="muted small">O treino em andamento fica guardado neste aparelho enquanto você preenche; registre só as séries de trabalho (sem o aquecimento). No fim, toque em Salvar treino.</p>`)}${trHistV()}`;
  const its = D.itens.map((it, i) => { const H = trHist(trKey(it)), ult = H[0], tempo = trEx(it.ex)?.tempo, sug = it.sug;
    return `<div class="trex"><header><b>${esc(it.nome)}</b><small class="muted">${it.reps ? `${it.series.length} × ${esc(it.reps)}${tempo ? " s" : ""}` : ""}${it.desc ? ` · descanso ${it.desc} s` : ""}</small><button type="button" class="vb" data-trdelx="${i}" aria-label="Tirar ${esc(it.nome)} do treino">${ic("x")}</button></header>
      ${sug?.motivo ? `<p class="small ${sug.acao === "subir" ? "st-good" : sug.acao === "reduzir" ? "st-warn" : "muted"}">${sug.acao === "subir" ? "▲ " : sug.acao === "reduzir" ? "▼ " : ""}${esc(sug.motivo)}</p>` : ""}
      ${ult ? `<p class="muted small">Última vez (${fmtD(ult.data)}): ${ult.series.map(z => `${z.reps}×${num(+z.kg, +z.kg % 1 ? 1 : 0)}`).join(" · ")}</p>` : ""}
      <div class="trsets">${it.series.map((z, j) => `<div class="trset"><span>${j + 1}</span><label><input type="number" inputmode="numeric" min="0" max="${tempo ? 600 : 100}" value="${esc(z.reps)}" data-trs="${i}|${j}|reps" placeholder="${esc(trRange(it.reps)?.[1] ?? "")}" aria-label="${tempo ? "Segundos" : "Repetições"} da série ${j + 1} de ${esc(it.nome)}">${tempo ? "s" : "reps"}</label><label><input type="number" inputmode="decimal" min="0" max="500" step="0.5" value="${esc(z.kg)}" data-trs="${i}|${j}|kg" aria-label="Carga da série ${j + 1} de ${esc(it.nome)}">kg</label>${it.desc ? `<button type="button" class="vb" data-trtimer="${it.desc}" aria-label="Contar o descanso de ${it.desc} segundos">${ic("clock")}</button>` : ""}</div>`).join("")}</div>
      <div class="row"><button type="button" class="btn sm ghost" data-tradds="${i}">${ic("plus")}Série</button>${it.series.length > 1 ? `<button type="button" class="btn sm ghost" data-trrems="${i}">− Série</button>` : ""}</div></div>`; }).join("");
  const head = `<div class="form f4 trhead"><label>Dia<input type="date" value="${esc(D.data)}" max="${TODAY}" data-trh="data"></label><label>Duração (min)<input type="number" min="5" max="300" value="${esc(D.dur)}" placeholder="${clamp(Math.round((Date.now() - D.ini) / 6e4), 5, 300)}" data-trh="dur"></label><label>Esforço (RPE)<select data-trh="rpe"><option value=""></option>${TR_RPE.slice(1).map((l, k) => `<option value="${k + 1}"${+D.rpe === k + 1 ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Observação<input type="text" value="${esc(D.obs)}" data-trh="obs" placeholder="como foi"></label></div>`;
  const add = `<div class="row wrap tradd"><input type="text" list="tr_dl2" id="tr_addex" placeholder="Adicionar exercício" aria-label="Adicionar exercício" autocomplete="off"><button type="button" class="btn sm" data-act="traddex">${ic("plus")}Adicionar</button><datalist id="tr_dl2">${trLib().map(e => `<option value="${esc(e.nome)}"></option>`).join("")}</datalist></div>`;
  return panel(`${ic("bolt")}${esc(D.nome)} <small>${D.data === TODAY ? "hoje" : esc(fmtDL(D.data))}</small>`, `${head}${its || `<div class="empty">Adicione os exercícios.</div>`}${add}<div class="row wrap trfoot"><button type="button" class="btn primary" data-act="trsalvar">${ic("check")}Salvar treino</button><button type="button" class="btn ghost" data-act="trdescarta">Descartar</button></div>`) + trHistV();
}
function trHistV() {
  const L = trLogSorted().slice(0, 12);
  return panel(`${ic("list")}Últimos treinos <small>${(S.treinoLog || []).length}</small>`, L.length ? `<div class="trhist">${L.map(s => { const n = sum(s.itens.map(it => it.series.filter(z => +z.reps > 0).length)), vol = sum(s.itens.flatMap(it => it.series.map(z => (+z.reps || 0) * (+z.kg || 0))));
    return `<details class="trh"><summary><b>${fmtD(s.data)}</b> ${esc(s.nome || "Treino livre")} <small class="muted">${s.dur ? `${s.dur} min · ` : ""}${n} séries${vol ? ` · ${num(vol, 0)} kg no total` : ""}${s.rpe ? ` · RPE ${s.rpe}` : ""}${s.fonte === "personal" ? " · Personal" : ""}</small></summary><ul>${s.itens.map(it => `<li><b>${esc(it.nome)}</b> ${it.series.filter(z => +z.reps > 0).map(z => `${z.reps}×${num(+z.kg, +z.kg % 1 ? 1 : 0)}`).join(" · ")}</li>`).join("")}</ul>${s.obs ? `<p class="muted small">${esc(s.obs)}</p>` : ""}<button type="button" class="btn sm ghost" data-trsdel="${s.id}">${ic("trash")}Apagar</button></details>`; }).join("")}</div>` : `<div class="empty">Nenhum treino registrado.</div>`);
}
function trCorridaV() {
  const d = trD(), C = [...(S.corridas || [])].sort((a, b) => b.data.localeCompare(a.data) || (b.at || 0) - (a.at || 0)), A = trAcwr(), W = trSemanas(12), w0 = W.at(-1), pl = d.planoCorrida, ps = pl ? trPlanoSemana(pl) : null, R = trRiegel();
  const c30 = C.filter(c => c.data >= addDays(TODAY, -29)), km30 = sum(c30.map(c => +c.km)), pm = km30 ? sum(c30.map(c => +c.min)) / km30 : null, r10 = R?.alvo.find(x => x.d === 10);
  const k = kpiRow([kmini("var(--a-car)", "Km nesta semana", `${num(w0.km, 1)} km`, ps ? `plano: ${num(ps.total, 1)} km (semana ${ps.i + 1} de ${pl.semanas.length})` : plural(w0.cor, "corrida", "corridas")),
    kmini("var(--a-apr)", "Ritmo médio (30 dias)", pm ? trFmtPace(pm) : "–", c30.length ? `${num(km30, 1)} km em ${plural(c30.length, "corrida", "corridas")}` : "sem corridas"),
    kmini("var(--good)", "Carga aguda:crônica", A ? num(A.r, 2) : "–", A ? `${TR_ZONA[A.zona][0]}${A.pouca ? " · pouca história" : ""}` : "precisa de corridas nos últimos 28 dias", A ? TR_ZONA[A.zona][1] : ""),
    kmini("var(--a-fam)", "Previsão para 10 km", r10 ? trFmtMin(r10.min) : "–", R ? `Riegel, a partir de ${R.deProva ? "prova" : "treino"} de ${num(+R.ref.km, 1)} km em ${fmtD(R.ref.data)}` : "precisa de uma corrida de 3 km ou mais")]);
  const form = panel(`${ic("run")}Registrar corrida`, `<div class="form f3"><label>Dia<input type="date" id="trc_data" value="${TODAY}" max="${TODAY}"></label><label>Distância (km)<input type="number" id="trc_km" min="0.1" max="100" step="0.01" inputmode="decimal"></label><label>Tempo<input type="text" id="trc_tempo" placeholder="mm:ss ou h:mm:ss" inputmode="numeric" autocomplete="off"></label><label>Tipo<select id="trc_tipo">${Object.entries(TR_CTIPO).map(([k2, [l]]) => `<option value="${k2}">${l}</option>`).join("")}</select></label><label>FC média<input type="number" id="trc_fc" min="40" max="220" placeholder="opcional"></label><label>Esforço (RPE)<select id="trc_rpe"><option value=""></option>${TR_RPE.slice(1).map((l, i) => `<option value="${i + 1}">${l}</option>`).join("")}</select></label><label class="full">Observação<input type="text" id="trc_obs" placeholder="percurso, como se sentiu"></label></div><div class="row wrap"><button type="button" class="btn primary" data-act="trcsalvar">${ic("check")}Registrar</button><span class="muted small" id="trc_hint" aria-live="polite"></span></div>`);
  const chk = colChart(W.map(w => fmtD(w.a)), [{ name: "Km", color: "var(--a-car)", data: W.map(w => r1(w.km)) }], { w: vw(12), h: 220, line: pl ? [{ name: "Plano", color: "var(--ink-2)", data: W.map(w => trPlanoKm(pl, w.a)) }] : [], fmt: v => num(v, 0), empty: "Registre corridas para ver o volume." });
  const cp = C.filter(c => c.data >= addDays(TODAY, -89)).reverse();
  const chp = cp.length >= 2 ? lineChart(cp.map(c => fmtD(c.data)), [{ name: "Ritmo (min/km)", color: "var(--a-apr)", data: cp.map(c => Math.round(trPace(+c.min, +c.km) * 100) / 100), fill: false, dots: true }], { w: vw(12), h: 220, zero: false, fmt: v => trFmtMin(v) }) : emptyChart("Registre duas corridas para ver o ritmo.");
  const lista = panel(`${ic("list")}Corridas <small>${C.length}</small>`, C.length ? `<div class="hscroll"><table class="dt trct"><thead><tr><th>Dia</th><th>Tipo</th><th class="num">km</th><th class="num">Tempo</th><th class="num">Ritmo</th><th class="num">FC</th><th class="num">RPE</th><th></th></tr></thead><tbody>${C.slice(0, 30).map(c => `<tr><td>${fmtD(c.data)}</td><td>${esc(TR_CTIPO[c.tipo]?.[0] || c.tipo)}${c.obs ? `<small class="muted">${esc(trunc(c.obs, 40))}</small>` : ""}</td><td class="num">${num(+c.km, 2)}</td><td class="num">${trFmtMin(+c.min)}</td><td class="num">${trFmtPace(trPace(+c.min, +c.km))}</td><td class="num">${c.fc || ""}</td><td class="num">${c.rpe || ""}</td><td><button type="button" class="vb" data-trcdel="${c.id}" aria-label="Apagar a corrida de ${fmtD(c.data)}">${ic("trash")}</button></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty">Nenhuma corrida registrada.</div>`);
  const prev = R ? panel(`${ic("flag")}Previsões de prova`, `<div class="trprev">${R.alvo.map(x => `<div><b>${x.l}</b><span>${trFmtMin(x.min)}</span><small class="muted">${trFmtPace(x.min / x.d)}</small></div>`).join("")}</div><p class="muted small">Riegel (T2 = T1 × (D2/D1)^1,06) a partir de ${R.deProva ? "uma prova" : "um treino, o que tende a subestimar"}: ${num(+R.ref.km, 1)} km em ${trFmtMin(+R.ref.min)} (${fmtD(R.ref.data)}). Erra mais quanto mais longe da distância de origem.</p>`) : "";
  return `${k}<div class="g2c">${form}${trPlanoV(pl, ps)}</div><div class="vg">${vis("tr-km", "Km por semana", chk, { cls: "s6", sub: `12 semanas · aumento seguro: até 10% (ou 2 km) por semana${pl ? " · linha = plano" : ""}` })}${vis("tr-pace", "Ritmo por corrida", chp, { cls: "s6", sub: "90 dias · menor = mais rápido" })}</div><div class="g2c">${lista}${prev}</div>`;
}
function trPlanoV(pl, ps) {
  if (!pl) return panel(`${ic("cal")}Plano de corrida`, `<p class="muted small">Gere um plano básico seguro (até 10% a mais por semana, alívio a cada 4 semanas, uma sessão de qualidade por semana) ou peça ao Personal um plano sob medida.</p><div class="form f3"><label>Objetivo<select id="trg_obj">${Object.entries(TR_PLOBJ).map(([k, [l]]) => `<option value="${k}">${l}</option>`).join("")}</select></label><label>Semanas<input type="number" id="trg_sem" min="4" max="16" value="8"></label><label>Corridas por semana<select id="trg_dias"><option value="3">3</option><option value="4">4</option></select></label></div><button type="button" class="btn primary" data-act="trgerar">${ic("cal")}Gerar plano</button>`);
  const rows = pl.semanas.map((s, i) => { const a = addDays(pl.inicio, 7 * i), tot = sum(s.sessoes.map(x => +x.km)), feito = a <= TODAY ? trKm(a, addDays(a, 6)) : null;
    return `<tr class="${ps?.i === i ? "cur" : ""}"><td class="num">${i + 1}</td><td>${fmtD(a)}</td><td>${s.sessoes.map(x => `<span class="trsess${TR_CTIPO[x.tipo]?.[1] ? " forte" : ""}">${TR_DIAN[x.dia].slice(0, 3)} · ${esc(TR_CTIPO[x.tipo]?.[0] || x.tipo)} ${num(+x.km, 1)}</span>`).join("")}</td><td class="num">${num(tot, 1)}</td><td class="num">${feito == null ? "" : num(feito, 1)}</td></tr>`; }).join("");
  const sem = ps ? `<div class="trweek">${ps.sem.sessoes.map(x => { const dt = addDays(ps.a, TR_DIAS.indexOf(x.dia)), fe = (S.corridas || []).filter(c => c.data === dt), ok = fe.length > 0;
    return `<div class="trwd${ok ? " ok" : dt < TODAY ? " miss" : dt === TODAY ? " hoje" : ""}"><b>${TR_DIAN[x.dia]}</b><span>${esc(TR_CTIPO[x.tipo]?.[0] || x.tipo)} · ${num(+x.km, 1)} km</span>${x.obs ? `<small>${esc(x.obs)}</small>` : ""}<em>${ok ? `${ic("check")}${num(sum(fe.map(c => +c.km)), 1)} km` : dt < TODAY ? "não registrada" : relDay(dt)}</em></div>`; }).join("")}</div>` : `<p class="muted small">${TODAY < pl.inicio ? `O plano começa ${relDay(pl.inicio)} (${esc(fmtDL(pl.inicio))}).` : "O plano terminou."}</p>`;
  return panel(`${ic("cal")}${esc(pl.objetivo)}${pl.prova ? ` <small>prova ${fmtDY(pl.prova)}</small>` : ""}`, `${ps ? `<div class="flbl">Semana ${ps.i + 1} de ${pl.semanas.length} · ${num(ps.feito, 1)} de ${num(ps.total, 1)} km</div>` : ""}${sem}<details class="trpltab"><summary>As ${pl.semanas.length} semanas</summary><div class="hscroll"><table class="dt"><thead><tr><th class="num">Sem.</th><th>Início</th><th>Sessões (km)</th><th class="num">km</th><th class="num">Feito</th></tr></thead><tbody>${rows}</tbody></table></div></details>${pl.motivo ? `<p class="muted small">${esc(pl.motivo)}</p>` : ""}<button type="button" class="btn sm ghost" data-act="trpldel">${ic("trash")}Apagar o plano</button>`, { cls: "trplan" });
}
function trProgV() {
  const ks = trExsLogados(); if (!ks.length) return `<div class="empty">Registre treinos para ver a evolução das cargas.</div><div class="g2c">${trVolV()}</div>${trFreqV()}`;
  const sel = ks.find(x => x.k === TRV.ex) || ks[0], H = trHist(sel.k).reverse(), pts = H.map(h => ({ d: h.data, b: trMelhor(h.series) })).filter(x => x.b);
  const ch = pts.length ? lineChart(pts.map(p => fmtD(p.d)), [{ name: "1RM estimado (kg)", color: "var(--a-car)", data: pts.map(p => r1(p.b.e1)), fill: false, dots: true }, { name: "Carga da melhor série (kg)", color: "var(--muted)", data: pts.map(p => p.b.kg), fill: false, dots: true }], { w: vw(12), h: 240, zero: false, fmt: v => num(v, 1) }) : emptyChart("Sem séries com carga e até 12 repetições.");
  const fx = trFichaEx(sel.k), pr = fx ? trProx(fx) : null, rec = trRecordes().find(r => r.k === sel.k), recs = trRecordes();
  return `<div class="row wrap"><label class="lbl">Exercício<select id="tr_exsel">${ks.map(x => `<option value="${esc(x.k)}"${x.k === sel.k ? " selected" : ""}>${esc(x.nome)} (${x.n})</option>`).join("")}</select></label></div>
    ${kpiRow([kmini("var(--a-car)", "Recorde (1RM estimado)", rec ? `${num(rec.e1, 1)} kg` : "–", rec ? `${rec.reps} × ${num(rec.kg, 1)} kg em ${fmtD(rec.data)}` : "sem séries com carga"), kmini("var(--a-apr)", "Sessões com o exercício", String(sel.n), H.length ? `desde ${fmtD(H[0].data)}` : ""), kmini("var(--good)", "Próxima carga", pr?.kg != null ? `${num(pr.kg, 1)} kg` : "–", pr ? esc(pr.motivo) : "o exercício não está em nenhuma ficha", pr?.acao === "subir" ? "good" : pr?.acao === "reduzir" ? "warn" : "")])}
    <div class="vg">${vis("tr-e1", `${esc(sel.nome)}: evolução`, ch, { cls: "s12", sub: "1RM estimado pela fórmula de Epley: carga × (1 + repetições/30), com até 12 repetições" })}</div>
    <div class="g2c">${panel(`${ic("star")}Recordes <small>1RM estimado</small>`, recs.length ? `<table class="dt"><tbody>${recs.slice(0, 15).map(r => `<tr><td>${esc(r.nome)}${r.data >= addDays(TODAY, -13) ? ` <span class="pill good">novo</span>` : ""}</td><td class="num"><b>${num(r.e1, 1)} kg</b></td><td class="muted small">${r.reps} × ${num(r.kg, 1)} · ${fmtD(r.data)}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">Sem recordes ainda.</div>`)}${trVolV()}</div>${trFreqV()}`;
}
function trVolV() {
  const P = trD().perfil, F = TR_FAIXA[P.modo] || TR_FAIXA.medio, V = trVolume(addDays(TODAY, -6), TODAY), mx = Math.max(22, ...Object.values(V));
  return panel(`${ic("layers")}Séries por grupo <small>últimos 7 dias</small>`, `${hbars(Object.entries(TR_GR).map(([g, l]) => ({ l, key: g, v: V[g], mark: F[0], txt: num(V[g], V[g] % 1 ? 1 : 0), st: !V[g] ? "" : V[g] < F[0] || V[g] > 20 ? "warn" : "good", color: V[g] < F[0] ? "var(--muted)" : "var(--a-car)" })), { max: mx })}<p class="muted small">Referência do compromisso ${esc((SD_COMP[P.modo]?.[0] || "").toLowerCase())}: ${F[0]} a ${F[1]} séries por grupo por semana (o traço marca ${F[0]}). O grupo secundário conta meia série; acima de 20 a recuperação costuma piorar.</p>`);
}
function trFreqV() {
  const W = trSemanas(12), P = trD().perfil;
  return `<div class="vg">${vis("tr-freq", "Treinos por semana", colChart(W.map(w => fmtD(w.a)), [{ name: "Academia", color: "var(--a-car)", data: W.map(w => w.ses) }, { name: "Corrida", color: "var(--a-apr)", data: W.map(w => w.cor) }], { w: vw(12), h: 220, stacked: true, line: [{ name: "Meta", color: "var(--ink-2)", data: W.map(() => +P.dias || 3) }], empty: "Sem treinos nas últimas 12 semanas." }), { cls: "s12", sub: "12 semanas, de segunda a domingo" })}</div>`;
}
function trPerfilV() {
  const d = trD(), P = d.perfil, F = TR_FAIXA[P.modo] || TR_FAIXA.medio, W = trSemanas(1)[0], w0 = weekStart(TODAY);
  const minSem = sum(Object.entries(S.saude || {}).filter(([dt, e]) => dt >= w0 && dt <= TODAY && e?.treino).map(([, e]) => +e.min || 0));
  const perfil = panel(`${ic("user")}Perfil`, `<div class="form f2"><label>Nível<select id="trp_nivel">${Object.entries(TR_NIVEL).map(([k, [l, t]]) => `<option value="${k}"${P.nivel === k ? " selected" : ""}>${l} (${t})</option>`).join("")}</select></label><label>Onde treina<select id="trp_local">${Object.entries(TR_LOCAL).map(([k, l]) => `<option value="${k}"${P.local === k ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Dias por semana<input type="number" id="trp_dias" min="1" max="7" value="${esc(P.dias)}"></label><label>Minutos por sessão<input type="number" id="trp_minutos" min="15" max="180" step="5" value="${esc(P.minutos)}"></label><label class="full">Limitações, lesões, dores<input type="text" id="trp_limitacoes" value="${esc(P.limitacoes)}" placeholder="ex.: joelho direito sensível no agachamento profundo"></label></div>`);
  const cfg = panel(`${ic("target")}Objetivo e o Personal`, `<div class="flbl">Objetivo</div><div class="chips">${Object.entries(TR_OBJ).map(([k, [l]]) => `<button type="button" class="chip${P.objetivo === k ? " on" : ""}" data-trobj="${k}" aria-pressed="${P.objetivo === k}">${l}</button>`).join("")}</div><p class="muted small">${esc(TR_OBJ[P.objetivo]?.[1] || "")}</p>
    <div class="flbl">Compromisso</div><div class="segs" role="group" aria-label="Compromisso">${Object.entries(SD_COMP).map(([k, [l]]) => `<button type="button" class="seg" data-trmodo="${k}" aria-pressed="${P.modo === k}">${l}</button>`).join("")}</div><p class="muted small">${esc(TR_COMPTX[P.modo] || "")}</p>
    <p class="note">${ic("shield")}<span>Em qualquer objetivo e compromisso: a carga sobe no máximo 10% (ou um degrau) de cada vez, a corrida até 10% por semana, e há pelo menos um dia de descanso. Dor no peito, tontura, falta de ar fora do normal ou dor nas articulações: pare e procure um profissional. O Personal é uma IA: não substitui um profissional de educação física nem a liberação médica.</span></p>`);
  const sem = panel(`${ic("flag")}Esta semana`, kpiRow([kmini("var(--a-car)", "Sessões", `${W.ses + W.cor} de ${P.dias}`, "academia e corrida", W.ses + W.cor >= P.dias ? "good" : ""), kmini("var(--a-apr)", "Minutos de treino", `${num(minSem, 0)} min`, "OMS: 150 a 300 min de atividade moderada por semana", minSem >= 150 ? "good" : ""), kmini("var(--good)", "Séries por grupo", `${F[0]} a ${F[1]}`, "referência do compromisso, por semana")]));
  return `<div class="g2c">${perfil}${cfg}</div>${sem}`;
}
const TR_QUICK = ["Monte uma ficha para o meu objetivo", "Como foi a minha semana de treino?", "Posso subir as cargas?", "Corri hoje: me ajude a registrar", "Monte um plano de corrida"];
const TR_ACTS = [["Revisão da semana", "refresh", "Faça a revisão da minha semana de treino: 1) sessões feitas contra a meta de dias, com datas; 2) séries por grupo muscular contra a faixa do meu compromisso; 3) cargas: o que progrediu e o que travou (use progresso_exercicio nos principais); 4) corrida: km, ritmo e carga aguda:crônica; 5) até 3 ajustes para a próxima semana. Se fizer sentido mudar uma ficha ou o plano de corrida, proponha."],
  ["Montar as fichas", "dumbbell", "Monte as fichas da minha semana para o meu objetivo, nível, compromisso, dias e local de treino, respeitando as limitações. Use a biblioteca (listar_exercicios) e proponha cada ficha com criar_ficha, com séries, faixa de repetições, carga sugerida pelo histórico e descanso."],
  ["Plano de corrida", "cal", "Monte um plano de corrida a partir do meu volume atual (consulte as corridas), com o objetivo que fizer sentido para o meu perfil (pergunte se não souber), e proponha com planejar_corrida."]];
function pTreinos() {
  trD(); const v = TRV.v, draft = trDraft();
  const segs = `<div class="segs" role="group" aria-label="Seção">${[["fichas", "Fichas"], ["registrar", "Registrar"], ["corrida", "Corrida"], ["progresso", "Progresso"], ["perfil", "Perfil"]].map(([k, l]) => `<button type="button" class="seg" data-trv="${k}" aria-pressed="${v === k}">${l}${k === "registrar" && draft ? ` <em class="nb acc" aria-label="treino em andamento">1</em>` : ""}</button>`).join("")}</div>`;
  const body = { fichas: trFichasV, registrar: trRegV, corrida: trCorridaV, progresso: trProgV, perfil: trPerfilV }[v] || trFichasV;
  return sdWrap("personal", `<div class="sdbar">${segs}${sdAgBtn("personal", "dumbbell")}</div>${body()}`, { quick: TR_QUICK, acts: TR_ACTS, intro: "Lê as fichas, os treinos, as corridas e o seu perfil a cada mensagem. Monta fichas com a biblioteca de exercícios, sugere cargas pela progressão dupla, registra treinos e corridas contados em texto e planeja a corrida semana a semana: tudo vira proposta, que você aprova com um clique ou escrevendo “ok”. É uma IA: não substitui um profissional de educação física.", priv: "A cada mensagem o Personal recebe o perfil, as fichas, os treinos de 21 dias, as corridas de 28 dias, o plano de corrida, o sono da semana e o resumo da alimentação. Fica fora da IA se a Saúde física estiver bloqueada em Privacidade." });
}

/* ---------------------------------------------------------------- ações */
let TR_TIMER = null;
function trTimerStop() { if (TR_TIMER) { clearInterval(TR_TIMER.h); TR_TIMER = null; } $("#trtimer")?.remove(); }
function trTimer(seg) {
  trTimerStop(); const fim = Date.now() + seg * 1000, el = document.createElement("div"); el.id = "trtimer"; el.className = "trtimer"; el.setAttribute("role", "timer");
  el.innerHTML = `${ic("clock")}<b></b><span>descanso</span><button type="button" class="vb" data-act="trtimerx" aria-label="Fechar o cronômetro">${ic("x")}</button>`; document.body.appendChild(el);
  const b = el.querySelector("b"), sp = el.querySelector("span"), me = { fim };
  const tick = () => { const r = Math.max(0, Math.ceil((me.fim - Date.now()) / 1000)); b.textContent = `${Math.floor(r / 60)}:${pad(r % 60)}`; if (!r) { clearInterval(me.h); sp.textContent = "próxima série"; el.classList.add("fim"); try { navigator.vibrate?.([180, 90, 180]); } catch {} setTimeout(() => { if (TR_TIMER === me) trTimerStop(); }, 8000); } };
  TR_TIMER = me; me.h = setInterval(tick, 250); tick();
}
function trClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.trv) { TRV.v = ds.trv; render(); return true; }
  if (ds.trtreinar != null) { if (trDraft()) toast("Há um treino em andamento: salve ou descarte antes de começar outro."); else trNovoDraft(ds.trtreinar); TRV.v = "registrar"; render(); return true; }
  if (ds.trfedit) { trFichaDlg(ds.trfedit); return true; }
  if (ds.trfdup) { const f = trD().fichas.find(x => x.id === ds.trfdup); if (f) { trD().fichas.push({ ...JSON.parse(JSON.stringify(f)), id: uid(), nome: trNomeLivre(`${f.nome} (cópia)`), at: Date.now(), origem: "você" }); touch("treino", { label: "Ficha duplicada" }); } return true; }
  if (ds.trfdel) { const d = trD(), f = d.fichas.find(x => x.id === ds.trfdel); if (f) { d.fichas = d.fichas.filter(x => x !== f); touch("treino", { label: `Ficha ${f.nome} apagada` }); undoToast(`Ficha apagada: ${f.nome}`); } return true; }
  if (ds.trmodelo) { const m = TR_MODELOS.find(x => x[0] === ds.trmodelo); if (!m) return true; const v = trValidaFicha({ nome: m[0], exercicios: m[2].map(([ex, s, r]) => ({ exercicio: ex, series: s, reps: r })) }, false, { novo: true }); if (v.erro) { toast(v.erro); return true; }
    v.dados.nome = trNomeLivre(v.dados.nome); trSalvaFicha(v.dados, "modelo"); touch("treino", { label: `Ficha ${v.dados.nome} (modelo)` }); undoToast(`Ficha criada: ${v.dados.nome}`); return true; }
  if (ds.tradds != null) { const it = trDraft()?.itens[+ds.tradds]; if (it) { it.series.push({ reps: "", kg: it.series.at(-1)?.kg ?? "" }); trDraftSave(); render(); } return true; }
  if (ds.trrems != null) { const it = trDraft()?.itens[+ds.trrems]; if (it && it.series.length > 1) { it.series.pop(); trDraftSave(); render(); } return true; }
  if (ds.trdelx != null) { const D = trDraft(); if (D) { D.itens.splice(+ds.trdelx, 1); trDraftSave(); render(); } return true; }
  if (ds.trtimer) { trTimer(+ds.trtimer); return true; }
  if (ds.trsdel) { const i = (S.treinoLog || []).findIndex(x => x.id === ds.trsdel); if (i >= 0) { const s = S.treinoLog.splice(i, 1)[0]; trSyncDia(s.data); touch("treinoLog", "saude", { label: `Treino de ${fmtD(s.data)} apagado` }); undoToast(`Treino de ${fmtD(s.data)} apagado`); } return true; }
  if (ds.trcdel) { const i = (S.corridas || []).findIndex(x => x.id === ds.trcdel); if (i >= 0) { const c = S.corridas.splice(i, 1)[0]; trSyncDia(c.data); touch("corridas", "saude", { label: `Corrida de ${fmtD(c.data)} apagada` }); undoToast(`Corrida de ${fmtD(c.data)} apagada`); } return true; }
  if (ds.trobj) { trD().perfil.objetivo = ds.trobj; touch("treino", { label: "Objetivo do treino" }); return true; }
  if (ds.trmodo) { trD().perfil.modo = ds.trmodo; touch("treino", { label: "Compromisso do treino" }); return true; }
  if (a === "trnova") { trFichaDlg(null); return true; }
  if (a === "traddex") { const D = trDraft(), v = String($("#tr_addex")?.value || "").trim(); if (!D || !v) return true; const e = trExMatch(v);
    D.itens.push({ ex: e?.id || "", nome: e ? e.nome : v.slice(0, 60), g: e?.g || "", reps: "", desc: e ? (e.comp ? 120 : 75) : 90, sug: null, series: [0, 1, 2].map(() => ({ reps: "", kg: "" })) }); trDraftSave(); render(); setTimeout(() => $("#tr_addex")?.focus(), 30); return true; }
  if (a === "trsalvar") { const D = trDraft(); if (!D) return true;
    const ex = D.itens.map(it => ({ exercicio: it.ex || it.nome, grupo: it.g, series: it.series.filter(z => z.reps !== "" && +z.reps > 0).map(z => ({ reps: +z.reps, kg: z.kg === "" ? 0 : +z.kg })) })).filter(x => x.series.length);
    if (!ex.length) { toast("Preencha as repetições de pelo menos uma série."); return true; }
    const el = Math.round((Date.now() - D.ini) / 6e4), dur = D.dur !== "" ? D.dur : el >= 5 && el <= 300 ? el : "";
    const v = trValida("registrar_treino", { data: D.data, ficha: D.ficha || (D.nome !== "Treino livre" ? D.nome : ""), duracao_min: dur, rpe: D.rpe, exercicios: ex, obs: D.obs }); if (v.erro) { toast(v.erro); return true; }
    const prs = trNovosRecordes(v.dados.itens); trAplica("registrar_treino", v.dados, "voce"); TRV.draft = null; trDraftSave(); trTimerStop(); TRV.v = "fichas";
    touch("treinoLog", "saude", { label: `Treino ${v.dados.nome} registrado` }); undoToast(`Treino registrado${prs.length ? ` · recorde: ${prs.map(p => `${p.nome} ${num(p.e1, 1)} kg`).join(", ")}` : ""}`); return true; }
  if (a === "trdescarta") { TRV.draft = null; trDraftSave(); trTimerStop(); render(); toast("Treino descartado."); return true; }
  if (a === "trtimerx") { trTimerStop(); return true; }
  if (a === "trcsalvar") { const g = id => $("#" + id)?.value, v = trValida("registrar_corrida", { data: g("trc_data"), km: g("trc_km"), tempo: g("trc_tempo"), tipo: g("trc_tipo"), fc_media: g("trc_fc"), rpe: g("trc_rpe"), obs: g("trc_obs") }); if (v.erro) { toast(v.erro); return true; }
    trAplica("registrar_corrida", v.dados, "voce"); touch("corridas", "saude", { label: `Corrida de ${num(v.dados.km, 1)} km` }); undoToast(`Corrida: ${num(v.dados.km, 2)} km · ${trFmtPace(v.dados.min / v.dados.km)}`); return true; }
  if (a === "trgerar") { const r = trGerarPlano({ obj: $("#trg_obj")?.value, semanas: $("#trg_sem")?.value, dias: $("#trg_dias")?.value }); if (r.erro) { toast(r.erro); return true; }
    trD().planoCorrida = { ...r.dados, at: Date.now(), origem: "app" }; touch("treino", { label: "Plano de corrida gerado" }); if (r.aviso) toast(r.aviso); return true; }
  if (a === "trpldel") { trD().planoCorrida = null; touch("treino", { label: "Plano de corrida apagado" }); undoToast("Plano de corrida apagado"); return true; }
  return false;
}
function trInput(t) {
  const ds = t.dataset;
  if (ds.trs) { const [i, j, k] = ds.trs.split("|"), z = trDraft()?.itens[+i]?.series[+j]; if (z) { z[k] = t.value; trDraftSave(); } return true; }
  if (ds.trh) { const D = trDraft(); if (D) { D[ds.trh] = t.value; trDraftSave(); } return true; }
  if (t.id === "trc_km" || t.id === "trc_tempo") { const km = +String($("#trc_km")?.value || "").replace(",", "."), m = trParseTempo($("#trc_tempo")?.value), h = $("#trc_hint"); if (h) h.textContent = km > 0 && m > 0 ? `ritmo ${trFmtPace(m / km)}` : ""; return true; }
  return false;
}
function trChange(t) {
  if (t.dataset.trs || t.dataset.trh) return true;
  const m = t.id?.match(/^trp_(nivel|local|dias|minutos|limitacoes)$/);
  if (m) { const P = trD().perfil; P[m[1]] = m[1] === "dias" ? clamp(Math.round(+t.value || 3), 1, 7) : m[1] === "minutos" ? clamp(Math.round(+t.value || 60), 15, 180) : String(t.value).slice(0, 300); touch("treino", { label: "Perfil do treino" }); return true; }
  if (t.id === "tr_exsel") { TRV.ex = t.value; render(); return true; }
  return false;
}
document.addEventListener("keydown", e => { if (e.key !== "Enter" || e.isComposing) return; if (e.target?.id === "tr_addex") { e.preventDefault(); $('[data-act="traddex"]')?.click(); } else if (/^trc_(km|tempo|fc|obs)$/.test(e.target?.id || "")) { e.preventDefault(); $('[data-act="trcsalvar"]')?.click(); } });

/* ---------------------------------------------------------------- o Personal: dados, prompt, ferramentas, propostas */
function trDias(n) {
  const a = addDays(TODAY, -n + 1);
  return [...(S.treinoLog || []).filter(s => s.data >= a).map(s => ({ data: s.data, tipo: "academia", nome: s.nome || "Treino livre", minutos: +s.dur || null, rpe: +s.rpe || null, series: sum((s.itens || []).map(it => (it.series || []).filter(z => +z.reps > 0).length)) })),
    ...(S.corridas || []).filter(c => c.data >= a).map(c => ({ data: c.data, tipo: "corrida", nome: TR_CTIPO[c.tipo]?.[0] || c.tipo, minutos: Math.round(+c.min), km: +c.km, rpe: +c.rpe || null }))].sort((x, y) => x.data.localeCompare(y.data));
}
/* para o Nutri: o que interessa da semana de treino */
function trResumoCurto() {
  const D = trDias(14), G = D.filter(x => x.tipo === "academia"), C = D.filter(x => x.tipo === "corrida"), P = trD().perfil, pl = trD().planoCorrida, am = addDays(TODAY, 1), ps = pl ? trPlanoSemana(pl, am) : null, dm = TR_DIAS[(parse(am).getDay() + 6) % 7], sa = ps?.sem.sessoes.find(x => x.dia === dm), H = D.filter(x => x.data === TODAY);
  return `objetivo ${TR_OBJ[P.objetivo]?.[0] || "?"}, compromisso ${(SD_COMP[P.modo]?.[0] || "?").toLowerCase()}, ${P.dias} dias por semana. Últimos 14 dias: ${plural(G.length, "sessão de academia", "sessões de academia")}${G.length ? ` (média ${Math.round(avg(G.map(x => x.minutos || 0)))} min)` : ""} e ${plural(C.length, "corrida", "corridas")}${C.length ? ` (${num(sum(C.map(x => x.km)), 1)} km)` : ""}. Hoje: ${H.map(x => `${x.nome}${x.km ? ` ${num(x.km, 1)} km` : ""}${x.minutos ? ` ${x.minutos} min` : ""}`).join(", ") || "nada registrado"}.${sa ? ` Amanhã no plano de corrida: ${TR_CTIPO[sa.tipo][0].toLowerCase()} de ${sa.km} km.` : ""}`;
}
function trFacts() {
  const d = trD(), P = d.perfil, L = [], W = trSemanas(8), V = trVolume(addDays(TODAY, -6), TODAY), A = trAcwr(), R = trRiegel(), F = TR_FAIXA[P.modo] || TR_FAIXA.medio;
  L.push(`PERFIL: nível ${TR_NIVEL[P.nivel]?.[0] || "?"}; objetivo ${TR_OBJ[P.objetivo]?.[0] || "?"}; compromisso ${SD_COMP[P.modo]?.[0] || "?"}; ${P.dias} dias por semana, ${P.minutos} min por sessão; local: ${TR_LOCAL[P.local] || "?"}${P.limitacoes ? `; LIMITAÇÕES E LESÕES: ${P.limitacoes}` : ""}.`);
  L.push(`FICHAS (${d.fichas.length}):\n${d.fichas.map(f => `- ${f.nome}: ${f.exs.map(x => `${x.nome} ${x.series}×${x.reps}${x.carga !== "" && x.carga != null ? ` ${x.carga} kg` : ""}`).join("; ")}`).join("\n") || "- nenhuma"}`);
  const G = trLogSorted().filter(s => s.data >= addDays(TODAY, -20));
  L.push(`ACADEMIA (21 dias; séries como reps×kg):\n${G.map(s => `- ${s.data} ${s.nome || "Treino livre"} (${s.dur || "?"} min, RPE ${s.rpe || "?"}): ${(s.itens || []).map(it => `${it.nome} ${(it.series || []).filter(z => +z.reps > 0).map(z => `${z.reps}×${+z.kg || 0}`).join(" ")}`).join("; ")}`).join("\n") || "- nenhuma sessão"}`);
  const C = (S.corridas || []).filter(c => c.data >= addDays(TODAY, -27)).sort((a, b) => a.data.localeCompare(b.data));
  L.push(`CORRIDAS (28 dias):\n${C.map(c => `- ${c.data} ${TR_CTIPO[c.tipo]?.[0] || c.tipo}: ${num(+c.km, 1)} km em ${trFmtMin(+c.min)} (${trFmtPace(trPace(+c.min, +c.km))})${c.fc ? `, FC ${c.fc}` : ""}${c.rpe ? `, RPE ${c.rpe}` : ""}`).join("\n") || "- nenhuma"}`);
  L.push(`SEMANAS (início · sessões de academia · corridas · km): ${W.map(w => `${w.a} · ${w.ses} · ${w.cor} · ${num(w.km, 1)}`).join(" | ")}.`);
  L.push(`SÉRIES POR GRUPO (7 dias; referência do compromisso ${F[0]}–${F[1]} por semana): ${Object.entries(V).filter(([, v]) => v).map(([g, v]) => `${TR_GR[g]} ${num(v, v % 1 ? 1 : 0)}`).join(", ") || "nenhuma série"}.`);
  L.push(`CARGA AGUDA:CRÔNICA (corrida): ${A ? `${num(A.r, 2)} (${num(A.ag, 1)} km em 7 dias; média de ${num(A.cr, 1)} km por semana em 28 dias): ${TR_ZONA[A.zona][0]}${A.pouca ? " (pouca história)" : ""}` : "sem corridas nos últimos 28 dias"}.`);
  if (R) L.push(`PREVISÃO DE PROVA (Riegel, a partir de ${R.deProva ? "prova" : "treino; tende a subestimar"} de ${num(+R.ref.km, 1)} km em ${trFmtMin(+R.ref.min)} em ${R.ref.data}): ${R.alvo.map(x => `${x.l} ${trFmtMin(x.min)}`).join(", ")}.`);
  const pl = d.planoCorrida; if (pl) { const w = trPlanoSemana(pl); L.push(`PLANO DE CORRIDA: ${pl.objetivo}${pl.prova ? ` (prova em ${pl.prova})` : ""}, ${pl.semanas.length} semanas desde ${pl.inicio}; ${w ? `semana ${w.i + 1}: ${w.sem.sessoes.map(s => `${s.dia} ${TR_CTIPO[s.tipo]?.[0] || s.tipo} ${s.km} km`).join(", ")} (feito ${num(w.feito, 1)} de ${num(w.total, 1)} km)` : "fora do período"}.`); }
  const prs = trRecordes().slice(0, 8); if (prs.length) L.push(`RECORDES (1RM estimado, Epley): ${prs.map(r => `${r.nome} ${num(r.e1, 1)} kg (${r.reps}×${r.kg} em ${r.data})`).join("; ")}.`);
  const sono = Object.entries(S.saude || {}).filter(([dt, e]) => dt >= addDays(TODAY, -6) && isNum(e?.sono)).map(([, e]) => +e.sono); if (sono.length) L.push(`SONO (7 dias): média de ${num(avg(sono), 1)} h em ${plural(sono.length, "noite registrada", "noites registradas")}.`);
  if (typeof nuMetas === "function") { const M = nuMetas(), tr = nuTendencia(), pa = nuPesoAtual(); L.push(`ALIMENTAÇÃO (do Nutri): objetivo ${NU_OBJ[S.nutri?.meta?.objetivo] || "não definido"}${M.ok ? `; meta de ${M.kcal} kcal e ${M.prot} g de proteína` : ""}; peso ${pa != null ? `${num(pa, 1)} kg` : "sem pesagem recente"}${tr ? `, tendência de ${num(tr.kgSem, 2)} kg por semana` : ""}.`); }
  return L;
}
function trPrompt(fallback) {
  const d = trD(), P = d.perfil, m = mget("personal"), obj = TR_OBJ[P.objetivo] || TR_OBJ.saude, modo = SD_COMP[P.modo] ? P.modo : "medio", ini = P.nivel === "iniciante", maxSes = { iniciante: 4, intermediario: 5, avancado: 6 }[P.nivel] || 4;
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-20)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const fb = fallback ? `\n\nFORMATO: responda normalmente. Para propor registros ou mudanças (a pessoa aprova), termine com um bloco exatamente assim (omita se não houver nada):\n\`\`\`atlas\n{"memorias":[{"tipo":"preferência","texto":"..."}],"acoes":[{"tipo":"registrar_corrida","dados":{"data":"AAAA-MM-DD","km":5,"tempo":"28:30","tipo":"leve"}}]}\n\`\`\`\nTipos de ação: criar_ficha {nome, substituir, obs, exercicios:[{exercicio, series, reps:"8-12", carga_kg, descanso_s, obs}]}, registrar_treino {data, ficha, duracao_min, rpe, obs, exercicios:[{exercicio, series:[{reps, kg}]}]}, registrar_corrida {data, km, tempo, tipo, fc_media, rpe, obs}, planejar_corrida {objetivo, prova, inicio, motivo, semanas:[{sessoes:[{dia, tipo, km, obs}]}]}. Exercícios da biblioteca (use o id): ${trLib().map(e => e.id).join(", ")}.` : "";
  return `Você é o Personal, personal trainer virtual (IA) dentro do app pessoal "Atlas da Vida": treinamento de força e corrida baseado em evidências. Você NÃO substitui um profissional de educação física nem a avaliação médica.
CONFIGURAÇÃO ESCOLHIDA PELA PESSOA:
- Objetivo: ${obj[0]}: ${obj[1]}.
- Compromisso: ${SD_COMP[modo][0]}: ${TR_COMPTX[modo]}.
- Nível: ${TR_NIVEL[P.nivel]?.[0] || "Iniciante"}; ${P.dias} dias por semana; ${P.minutos} min por sessão; local: ${TR_LOCAL[P.local] || "academia"}.${P.limitacoes ? `\n- Limitações e lesões informadas: ${P.limitacoes}. Adapte os exercícios e não prescreva o que possa agravar.` : ""}
LINHAS VERMELHAS (valem em qualquer objetivo e compromisso; a validação do app recusa o que passar delas):
- Ficha: até 12 exercícios, até 12 séries por grupo muscular numa sessão (secundário conta meia) e até ${ini ? 24 : 30} séries por sessão. Carga nova no máximo 10% (ou um degrau) acima da maior já registrada no exercício.
- Corrida: cada semana com até 10% (ou 2 km) a mais que a maior das 3 anteriores (a 1ª sobre a média das últimas 4 semanas, mínimo 8 km); no máximo 3 semanas seguidas de aumento; até ${ini ? 1 : 2} sessão${ini ? "" : "(ões)"} forte${ini ? "" : "s"} por semana (intervalado, ritmo, fartlek, prova); até ${maxSes} corridas por semana. Carga aguda:crônica acima de 1,5 pede redução.
- Pelo menos 1 dia de descanso completo por semana; semana de alívio a cada 4 a 8 semanas de treino pesado.
- Dor aguda, dor nas articulações, dor no peito, tontura, falta de ar fora do normal: parar e procurar um profissional. Não faça diagnóstico de lesão.
- Doença cardíaca, pressão alta sem controle, gestação, cirurgia recente ou lesão: liberação médica antes de começar ou intensificar.
- Nada de treinar até a falha em todas as séries dos compostos, nem de usar exercício para "compensar" comida.
COMO TRABALHAR:
- Baseie-se nos dados abaixo e cite números e datas. Não invente; se faltar dado, diga o que registrar no app.
- Seja breve (até ~180 palavras, salvo fichas e planos), com no máximo 3 ações, na exigência do compromisso. Português do Brasil.
- Fichas: use listar_exercicios para os ids da biblioteca e proponha com criar_ficha (séries, faixa de repetições como "8-12", carga sugerida e descanso). Para mudar uma ficha existente, use substituir com o nome dela.
- Cargas: use progresso_exercicio antes de mudar; o app aplica a progressão dupla (sobe um degrau quando todas as séries chegam ao topo da faixa).
- Treino ou corrida contados em texto: proponha com registrar_treino ou registrar_corrida.
- Plano de corrida: proponha com planejar_corrida, semana a semana, dentro das regras acima.
- Alimentação é com o Nutri: use recado para ele quando o treino mudar as necessidades (mais volume, prova chegando, objetivo novo).
- Guarde na memória preferências, lesões, horários e o que funcionou (frases curtas).

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
${trFacts().join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}${fb}`.slice(0, 120000);
}
function trTools(live, T) {
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  const prop = (tipo, inp, d) => { const r = sdProposta("personal", live, tipo, inp); note(tipo, r.erro ? `recusada: ${trunc(r.erro, 70)}` : d); return r; };
  return [
    { name: "consultar_treinos", description: "Sessões de academia (com as séries feitas) e corridas dos últimos N dias (1–90), e o resumo por semana.",
      inputSchema: { type: "object", properties: { dias: { type: "number" } } },
      execute: inp => { const n = clamp(Math.round(+inp.dias || 14), 1, 90), a = addDays(TODAY, -n + 1); note("consultar_treinos", `${n} dias`);
        return { academia: trLogSorted().filter(s => s.data >= a).map(s => ({ data: s.data, ficha: s.nome || "Treino livre", minutos: +s.dur || null, rpe: +s.rpe || null, exercicios: (s.itens || []).map(it => ({ nome: it.nome, series: (it.series || []).filter(z => +z.reps > 0).map(z => `${z.reps}×${+z.kg || 0} kg`).join(", ") })) })),
          corridas: (S.corridas || []).filter(c => c.data >= a).sort((x, y) => y.data.localeCompare(x.data)).map(c => ({ data: c.data, tipo: c.tipo, km: +c.km, tempo: trFmtMin(+c.min), ritmo: trFmtPace(trPace(+c.min, +c.km)), fc_media: +c.fc || null, rpe: +c.rpe || null })),
          semanas: trSemanas(clamp(Math.ceil(n / 7), 1, 13)).map(w => ({ semana: w.a, academia: w.ses, corridas: w.cor, km: r1(w.km) })) }; } },
    { name: "progresso_exercicio", description: "Histórico de um exercício (id da biblioteca ou nome): séries por sessão, melhor série, 1RM estimado (Epley), recorde e a próxima carga pela progressão dupla.",
      inputSchema: { type: "object", properties: { exercicio: { type: "string" } }, required: ["exercicio"] },
      execute: inp => { const e = trExMatch(inp.exercicio), key = e ? e.id : "n:" + norm(inp.exercicio), H = trHist(key), nome = e?.nome || String(inp.exercicio || ""); note("progresso_exercicio", `${trunc(nome, 40)} · ${plural(H.length, "sessão", "sessões")}`);
        if (!H.length) return { exercicio: nome, historico: [], aviso: "sem registros deste exercício" };
        const fx = trFichaEx(key), rec = trRecordes().find(r => r.k === key);
        return { exercicio: nome, historico: H.slice(0, 12).map(h => { const b = trMelhor(h.series); return { data: h.data, series: h.series.map(z => `${z.reps}×${+z.kg || 0} kg`).join(", "), melhor: b ? `${b.reps}×${b.kg} kg` : null, e1rm_kg: b ? r1(b.e1) : null }; }), recorde: rec ? { e1rm_kg: r1(rec.e1), data: rec.data, serie: `${rec.reps}×${rec.kg} kg` } : null, maior_carga_kg: trMaxCarga(key), proxima: fx ? trProx(fx) : null }; } },
    { name: "volume_semanal", description: "Por semana (segunda a domingo), nas últimas N semanas (1–8): séries por grupo muscular (secundário conta 0,5), sessões de academia, corridas e km; mais a carga aguda:crônica de hoje e a faixa de referência do compromisso.",
      inputSchema: { type: "object", properties: { semanas: { type: "number" } } },
      execute: inp => { const n = clamp(Math.round(+inp.semanas || 4), 1, 8), A = trAcwr(), P = trD().perfil; note("volume_semanal", `${n} semanas`);
        return { faixa_series_por_grupo: TR_FAIXA[P.modo] || TR_FAIXA.medio, semanas: trSemanas(n).map(w => ({ semana: w.a, series_por_grupo: Object.fromEntries(Object.entries(trVolume(w.a, w.b)).filter(([, v]) => v).map(([g, v]) => [g, r1(v)])), academia: w.ses, corridas: w.cor, km: r1(w.km) })), carga_aguda_cronica: A ? { razao: Math.round(A.r * 100) / 100, km_7_dias: r1(A.ag), media_semanal_28_dias: r1(A.cr), zona: TR_ZONA[A.zona][0], pouca_historia: A.pouca } : null }; } },
    { name: "listar_exercicios", description: "Biblioteca de exercícios do app: id, nome, grupo, secundários, equipamento e se é composto. Filtre por grupo (peito, costas, ombros, biceps, triceps, quadriceps, posteriores, gluteos, panturrilhas, abdomen) e/ou por busca. Use os ids em criar_ficha.",
      inputSchema: { type: "object", properties: { grupo: { type: "string" }, busca: { type: "string" } } },
      execute: inp => { const g = TR_GR[inp.grupo] ? inp.grupo : null, q = trLimpa(inp.busca || ""), L = trLib().filter(e => (!g || e.g === g || e.sec.includes(g)) && (!q || e.al.some(x => trLimpa(x).includes(q)))); note("listar_exercicios", `${g ? TR_GR[g] : "todos"}${q ? ` · “${trunc(inp.busca, 20)}”` : ""} · ${L.length}`);
        return L.map(e => ({ id: e.id, nome: e.nome, grupo: e.g, secundarios: e.sec, equipamento: e.eq, composto: e.comp, ...(e.tempo ? { medida: "segundos" } : {}) })); } },
    { name: "criar_ficha", description: "Propõe criar uma ficha de academia (ou substituir uma existente, pelo nome em substituir). Cada exercício: id da biblioteca (ou nome), séries (1–10), reps como faixa \"8-12\" (prancha em segundos), carga_kg sugerida (opcional), descanso_s e obs. Validação: até 12 exercícios, até 12 séries por grupo e até 30 séries por sessão (24 para iniciantes), carga no máximo 10% (ou um degrau) acima da maior já registrada no exercício.",
      inputSchema: { type: "object", properties: { nome: { type: "string" }, substituir: { type: "string", description: "nome da ficha existente a substituir" }, obs: { type: "string" }, exercicios: { type: "array", items: { type: "object", properties: { exercicio: { type: "string" }, series: { type: "number" }, reps: { type: "string" }, carga_kg: { type: "number" }, descanso_s: { type: "number" }, obs: { type: "string" }, grupo: { type: "string", description: "só para exercício fora da biblioteca" } }, required: ["exercicio", "series", "reps"] } } }, required: ["nome", "exercicios"] },
      execute: inp => prop("criar_ficha", inp, `${trunc(inp.nome || "", 40)} · ${plural((inp.exercicios || []).length, "exercício", "exercícios")}`) },
    { name: "registrar_treino", description: "Propõe registrar uma sessão de academia já feita: data, ficha (nome, opcional), duracao_min, rpe (1–10), obs e os exercícios com as séries feitas (reps e kg).",
      inputSchema: { type: "object", properties: { data: { type: "string", description: "AAAA-MM-DD; hoje se omitido" }, ficha: { type: "string" }, duracao_min: { type: "number" }, rpe: { type: "number" }, obs: { type: "string" }, exercicios: { type: "array", items: { type: "object", properties: { exercicio: { type: "string" }, series: { type: "array", items: { type: "object", properties: { reps: { type: "number" }, kg: { type: "number" } }, required: ["reps"] } } }, required: ["exercicio", "series"] } } }, required: ["exercicios"] },
      execute: inp => prop("registrar_treino", inp, `${trunc(inp.ficha || "treino", 40)} · ${plural((inp.exercicios || []).length, "exercício", "exercícios")}`) },
    { name: "registrar_corrida", description: "Propõe registrar uma corrida feita: data, km, tempo (\"mm:ss\" ou \"h:mm:ss\") ou minutos, tipo (leve, longo, regenerativo, intercalado, tempo, intervalado, fartlek, prova), fc_media, rpe e obs.",
      inputSchema: { type: "object", properties: { data: { type: "string", description: "AAAA-MM-DD; hoje se omitido" }, km: { type: "number" }, tempo: { type: "string" }, minutos: { type: "number" }, tipo: { type: "string", enum: Object.keys(TR_CTIPO) }, fc_media: { type: "number" }, rpe: { type: "number" }, obs: { type: "string" } }, required: ["km"] },
      execute: inp => prop("registrar_corrida", inp, `${inp.km} km${inp.tempo ? ` em ${inp.tempo}` : ""}`) },
    { name: "planejar_corrida", description: "Propõe um plano de corrida semana a semana (substitui o atual): objetivo, prova (AAAA-MM-DD, opcional), inicio (segunda-feira; padrão: a próxima), motivo e semanas com as sessões (dia seg…dom, tipo, km, obs). Validação: até 10% (ou 2 km) a mais por semana sobre a maior das 3 anteriores (a 1ª sobre a média das últimas 4 semanas, mínimo 8 km), no máximo 3 semanas seguidas de aumento, até 2 sessões fortes por semana (1 para iniciantes) e até 4 corridas por semana para iniciantes (5 intermediários, 6 avançados).",
      inputSchema: { type: "object", properties: { objetivo: { type: "string" }, prova: { type: "string" }, inicio: { type: "string" }, motivo: { type: "string" }, semanas: { type: "array", items: { type: "object", properties: { sessoes: { type: "array", items: { type: "object", properties: { dia: { type: "string", enum: TR_DIAS }, tipo: { type: "string", enum: Object.keys(TR_CTIPO) }, km: { type: "number" }, obs: { type: "string" } }, required: ["dia", "tipo", "km"] } } }, required: ["sessoes"] } } }, required: ["objetivo", "semanas"] },
      execute: inp => prop("planejar_corrida", inp, `${trunc(inp.objetivo || "", 40)} · ${plural((inp.semanas || []).length, "semana", "semanas")}`) },
    ...T.filter(x => x.name === "salvar_memoria" || x.name === "recado")];
}
/* validação: é aqui que os limites de segurança valem de fato */
function trNormEx(x, i, agente) {
  const raw = String(x?.exercicio ?? x?.nome ?? "").trim(); if (!raw) throw new Error(`exercício ${i + 1} sem nome`);
  const e = trExMatch(raw), nome = e ? e.nome : raw.slice(0, 60), key = e ? e.id : "n:" + norm(nome), lim = e?.tempo ? 300 : 30;
  const series = sdNum(x.series, 1, 10); if (series == null || Number.isNaN(series)) throw new Error(`${nome}: de 1 a 10 séries`);
  const rg = trRange(x.reps ?? x.repeticoes); if (!rg || rg[1] > lim) throw new Error(`${nome}: repetições como faixa (“8-12”) ou número, até ${lim}${e?.tempo ? " segundos" : ""}`);
  const carga = sdNum(x.carga_kg ?? x.carga, 0, 500); if (Number.isNaN(carga)) throw new Error(`${nome}: carga de 0 a 500 kg`);
  if (agente && carga) { const mx = trMaxCarga(key); if (mx != null && carga > Math.max(mx * 1.1, mx + trPasso(e, mx)) + 1e-9) throw new Error(`${nome}: ${num(carga, 1)} kg passa de 10% (ou um degrau) acima da maior carga já registrada (${num(mx, 1)} kg)`); }
  const desc = sdNum(x.descanso_s ?? x.descanso, 10, 600); if (Number.isNaN(desc)) throw new Error(`${nome}: descanso de 10 a 600 segundos`);
  return { id: uid(), ex: e?.id || "", nome, g: e ? e.g : TR_GR[x.grupo] ? x.grupo : "", series: Math.round(series), reps: rg[0] === rg[1] ? String(rg[0]) : `${rg[0]}-${rg[1]}`, carga: carga ?? "", desc: Math.round(desc ?? (e ? (e.comp ? 120 : 75) : 90)), obs: String(x.obs || "").trim().slice(0, 140) };
}
function trValidaFicha(d, agente, o = {}) {
  const nome = String(d.nome || "").trim().slice(0, 60); if (!nome) return { erro: "dê um nome à ficha" };
  const xs = Array.isArray(d.exercicios) ? d.exercicios : []; if (!xs.length || xs.length > 12) return { erro: "de 1 a 12 exercícios" };
  let exs; try { exs = xs.map((x, i) => trNormEx(x, i, agente)); } catch (e) { return { erro: e.message }; }
  const P = trD().perfil, vf = trVolFicha(exs), lim = P.nivel === "iniciante" ? 24 : 30, gx = Object.entries(vf.g).filter(([, n]) => n > 12), avisos = [];
  if (gx.length) { const m = `${gx.map(([g, n]) => `${TR_GR[g]} com ${num(n, n % 1 ? 1 : 0)} séries`).join(", ")} numa sessão: acima de 12 por grupo`; if (agente) return { erro: m }; avisos.push(m + "."); }
  if (vf.tot > lim) { const m = `${vf.tot} séries numa sessão: acima de ${lim}${P.nivel === "iniciante" ? " para iniciantes" : ""}`; if (agente) return { erro: m }; avisos.push(m + "."); }
  const fs = trD().fichas, sub = d.substituir ? fs.find(f => f.id === d.substituir || norm(f.nome) === norm(d.substituir)) : null;
  if (d.substituir && !sub) return { erro: `não existe a ficha “${d.substituir}” para substituir` };
  const mesmo = o.novo ? null : sub || fs.find(f => norm(f.nome) === norm(nome));
  return { dados: { nome, obs: String(d.obs || "").trim().slice(0, 300), exs, subst: mesmo?.id || null, avisos } };
}
function trValida(tipo, d) {
  if (tipo === "criar_ficha") return trValidaFicha(d, true);
  if (tipo === "planejar_corrida") return trValidaPlano(d);
  if (tipo === "registrar_treino") {
    const data = sdData(d.data); if (!data || data > TODAY || data < addDays(TODAY, -365)) return { erro: "data de até um ano atrás até hoje (AAAA-MM-DD)" };
    const dur = sdNum(d.duracao_min ?? d.minutos, 5, 300), rpe = sdNum(d.rpe, 1, 10); if (Number.isNaN(dur)) return { erro: "duração de 5 a 300 minutos" }; if (Number.isNaN(rpe)) return { erro: "esforço (RPE) de 1 a 10" };
    const xs = Array.isArray(d.exercicios) ? d.exercicios : []; if (!xs.length || xs.length > 15) return { erro: "de 1 a 15 exercícios" };
    let itens; try { itens = xs.map((x, i) => { const raw = String(x?.exercicio ?? x?.nome ?? "").trim(); if (!raw) throw new Error(`exercício ${i + 1} sem nome`);
      const e = trExMatch(raw), nome = e ? e.nome : raw.slice(0, 60), key = e ? e.id : "n:" + norm(nome), lim = e?.tempo ? 600 : 100, ss = Array.isArray(x.series) ? x.series : []; if (!ss.length || ss.length > 12) throw new Error(`${nome}: de 1 a 12 séries`);
      const mx = trMaxCarga(key), series = ss.map((z, j) => { const reps = sdNum(z?.reps, 0, lim), kg = sdNum(z?.kg ?? 0, 0, 500);
        if (reps == null || Number.isNaN(reps)) throw new Error(`${nome}, série ${j + 1}: ${e?.tempo ? "segundos" : "repetições"} de 0 a ${lim}`); if (Number.isNaN(kg)) throw new Error(`${nome}, série ${j + 1}: carga de 0 a 500 kg`);
        if (kg && mx >= 10 && kg > mx * 1.5) throw new Error(`${nome}: ${num(kg, 1)} kg é mais de 50% acima da maior carga registrada (${num(mx, 1)} kg); confira se não é engano`);
        return { reps: Math.round(reps), kg: kg == null ? 0 : Math.round(kg * 100) / 100 }; });
      return { ex: e?.id || "", nome, g: e ? e.g : TR_GR[x.grupo] ? x.grupo : "", series }; }); } catch (e) { return { erro: e.message }; }
    const f = d.ficha ? trD().fichas.find(z => z.id === d.ficha || norm(z.nome) === norm(d.ficha)) : null;
    return { dados: { data, ficha: f?.id || "", nome: f?.nome || String(d.ficha || "").trim().slice(0, 60) || "Treino livre", dur: dur ?? "", rpe: rpe ?? "", obs: String(d.obs || "").trim().slice(0, 300), itens } };
  }
  if (tipo === "registrar_corrida") {
    const data = sdData(d.data); if (!data || data > TODAY || data < addDays(TODAY, -365)) return { erro: "data de até um ano atrás até hoje (AAAA-MM-DD)" };
    const km = sdNum(d.km, .1, 100); if (km == null || Number.isNaN(km)) return { erro: "distância de 0,1 a 100 km" };
    const min = d.tempo != null && d.tempo !== "" ? trParseTempo(d.tempo) : sdNum(d.minutos, 1, 900); if (!(min >= 1 && min <= 900)) return { erro: "tempo como mm:ss, h:mm:ss ou minutos (até 15 h)" };
    const p = min / km; if (p < 2.5 || p > 20) return { erro: `ritmo de ${trFmtPace(p)} fora do plausível (de 2:30 a 20:00 por km); confira a distância e o tempo` };
    const tp = d.tipo ? trTipoKey(d.tipo) : "leve"; if (!tp) return { erro: `tipo: ${Object.keys(TR_CTIPO).join(", ")}` };
    const fc = sdNum(d.fc_media ?? d.fc, 40, 220), rpe = sdNum(d.rpe, 1, 10); if (Number.isNaN(fc)) return { erro: "FC média de 40 a 220" }; if (Number.isNaN(rpe)) return { erro: "esforço (RPE) de 1 a 10" };
    return { dados: { data, km: Math.round(km * 100) / 100, min: Math.round(min * 100) / 100, tipo: tp, fc: fc ?? "", rpe: rpe ?? "", obs: String(d.obs || "").trim().slice(0, 300) } };
  }
  return { erro: "tipo desconhecido" };
}
function trAplica(tipo, v, fonte = "personal") {
  const d = trD();
  if (tipo === "criar_ficha") { const f = trSalvaFicha(v, "Personal"); return [`${f.nome} (${plural(f.exs.length, "exercício", "exercícios")})`, ["treino"]]; }
  if (tipo === "registrar_treino") { (S.treinoLog ||= []).push({ id: uid(), data: v.data, ficha: v.ficha, nome: v.nome, dur: v.dur, rpe: v.rpe, obs: v.obs, itens: v.itens, fonte, at: Date.now() }); trSyncDia(v.data); return [`${v.nome} de ${fmtD(v.data)}`, ["treinoLog", "saude"]]; }
  if (tipo === "registrar_corrida") { (S.corridas ||= []).push({ id: uid(), ...v, fonte, at: Date.now() }); trSyncDia(v.data); return [`${num(v.km, 1)} km em ${fmtD(v.data)}`, ["corridas", "saude"]]; }
  if (tipo === "planejar_corrida") { d.planoCorrida = { ...v, at: Date.now(), origem: "Personal" }; return [`${v.objetivo} · ${plural(v.semanas.length, "semana", "semanas")}`, ["treino"]]; }
  return [null, []];
}
function trResumo(p) {
  const d = p.raw || {}, v = trValida(p.tipo, d).dados;
  if (p.tipo === "criar_ficha") { const exs = v?.exs || [], sub = v?.subst ? trD().fichas.find(f => f.id === v.subst) : null;
    return `<b class="ckpt">${esc(v?.nome || d.nome || "")}</b>${sub ? ` <small class="muted">substitui a ficha atual</small>` : ""}<ul class="nupl">${exs.map(x => `<li>${esc(x.nome)} · ${x.series} × ${esc(x.reps)}${trEx(x.ex)?.tempo ? " s" : ""}${x.carga !== "" ? ` · ${num(+x.carga, 1)} kg` : ""} · ${x.desc} s${x.obs ? ` <small class="muted">${esc(x.obs)}</small>` : ""}</li>`).join("") || (d.exercicios || []).map(x => `<li>${esc(x?.exercicio || "?")}</li>`).join("")}</ul>${exs.length ? `<div class="ckpf"><span><b>séries</b> ${trVolFicha(exs).tot}</span></div>` : ""}${v?.obs ? `<p>${esc(v.obs)}</p>` : ""}`; }
  if (p.tipo === "registrar_treino") { const its = v?.itens || [];
    return `<b class="ckpt">${esc(v?.nome || d.ficha || "Treino")}${v?.data && v.data !== TODAY ? ` · ${fmtD(v.data)}` : ""}</b><ul class="nupl">${its.map(it => `<li>${esc(it.nome)}: ${it.series.map(z => `${z.reps}×${num(z.kg, z.kg % 1 ? 1 : 0)}`).join(" · ")}</li>`).join("") || (d.exercicios || []).map(x => `<li>${esc(x?.exercicio || "?")}</li>`).join("")}</ul>${v && (v.dur || v.rpe) ? `<div class="ckpf">${v.dur ? `<span><b>duração</b> ${v.dur} min</span>` : ""}${v.rpe ? `<span><b>RPE</b> ${v.rpe}</span>` : ""}</div>` : ""}`; }
  if (p.tipo === "registrar_corrida") return v ? `<b class="ckpt">${num(v.km, 2)} km · ${esc(TR_CTIPO[v.tipo][0])}${v.data !== TODAY ? ` · ${fmtD(v.data)}` : ""}</b><div class="ckpf"><span><b>tempo</b> ${trFmtMin(v.min)}</span><span><b>ritmo</b> ${trFmtPace(v.min / v.km)}</span>${v.fc ? `<span><b>FC</b> ${v.fc}</span>` : ""}${v.rpe ? `<span><b>RPE</b> ${v.rpe}</span>` : ""}</div>` : `<b class="ckpt">${esc(d.km ?? "?")} km</b>`;
  if (p.tipo === "planejar_corrida") { const SW = v?.semanas || [], tot = SW.map(s => sum(s.sessoes.map(x => x.km)));
    return `<b class="ckpt">${esc(v?.objetivo || d.objetivo || "")}</b>${v ? ` <small class="muted">${plural(SW.length, "semana", "semanas")} a partir de ${fmtD(v.inicio)}${v.prova ? ` · prova ${fmtD(v.prova)}` : ""}</small><div class="trplmini">${spark(tot, "var(--a-car)", { min: 0, w: 160, h: 30 })}<span>${tot.map(t => num(t, 0)).join(" · ")} km</span></div>` : ""}${v?.motivo ? `<p>${esc(v.motivo)}</p>` : ""}${trD().planoCorrida && p.status === "pendente" ? `<small class="muted">substitui o plano atual</small>` : ""}`; }
  return "";
}
SD_AG.personal = { pt: { criar_ficha: ["Ficha de treino", "dumbbell"], registrar_treino: ["Registrar treino", "check"], registrar_corrida: ["Registrar corrida", "run"], planejar_corrida: ["Plano de corrida", "cal"] }, valida: trValida, aplica: (tipo, v) => trAplica(tipo, v), resumo: trResumo };
Object.assign(MENTOR_DEF, { personal: { page: "saude", sub: "treinos", gate: "Saúde física", cor: "#c2683a", ico: "dumbbell", nome: "Personal", papel: "personal trainer virtual (IA) de musculação e corrida; não substitui um profissional de educação física", arq: "um personal trainer virtual de força e corrida, baseado em evidências, que progride com método e protege as articulações antes do ego",
  voz: "Direto e motivador, com números dos treinos; ajusta a exigência ao compromisso e nunca passa dos limites de segurança.",
  facts: () => trFacts(), prompt: trPrompt, tools: (live, T) => trTools(live, T), intercept: t => sdIntercept("personal", t), parseBlock: (b, live) => sdParseBlock("personal", b, live) } });
if (!MIDS.includes("personal")) MIDS.push("personal");
Object.assign(USO_TXT, { progresso_exercicio: ["pulse", "Olhou o progresso"], volume_semanal: ["layers", "Olhou o volume"], listar_exercicios: ["book", "Consultou a biblioteca"], criar_ficha: ["dumbbell", "Propôs ficha"], registrar_treino: ["check", "Propôs treino"], registrar_corrida: ["run", "Propôs corrida"], planejar_corrida: ["cal", "Propôs plano de corrida"] });

/* ---------------------------------------------------------------- exemplo (fictício): perder gordura mantendo a massa, academia
   superior/inferior e corrida rumo aos 10 km. Usa o próprio gerador de números para não mexer no resto do exemplo, e só troca o
   tipo de treino de dias que já tinham treino no check-in (os minutos e os dias de treino do exemplo continuam iguais) */
function sdExemplo(D) {
  const keep = S; S = D; VER++;
  try {
    const rnd = mulberry32(4242), at = (d, h = 12) => parse(d).getTime() + h * 36e5, r01 = v => Math.round(v * 10) / 10;
    /* Nutri: perfil, objetivo, alimentação de 21 dias, água, cintura, um plano salvo e pesagens diárias nos últimos 30 dias */
    D.nutri = { perfil: { sexo: "M", nasc: "1991", altura: "178", atividade: "moderado" }, meta: { objetivo: "perder", pesoAlvo: 78, prazo: addDays(TODAY, 90), modo: "medio", foco: "esportivo", inicio: addDays(TODAY, -60), pesoInicio: null },
      manual: {}, prefs: { dieta: "onivora", evitar: "camarão" }, agua: {}, favs: [{ id: "nf1", nome: "Pão da padaria do bairro", kcal: 270, p: 9, c: 52, f: 3, porcao: 60, pnome: "1 fatia grossa" }], planos: [], medidas: [] };
    const seg = Object.entries(D.saude).filter(([, e]) => isNum(e.peso)).map(([d, e]) => [d, +e.peso]).sort((a, b) => a[0].localeCompare(b[0]));
    D.nutri.meta.pesoInicio = seg.filter(([d]) => d <= addDays(TODAY, -60)).at(-1)?.[1] ?? null;
    for (let k = 30; k >= 1; k--) { const d = addDays(TODAY, -k), e = D.saude[d]; if (!e || isNum(e.peso)) continue; const a = seg.filter(([x]) => x <= d).at(-1), b = seg.find(([x]) => x > d); if (!a) continue;
      const base = b ? a[1] + (b[1] - a[1]) * diff(d, a[0]) / diff(b[0], a[0]) : a[1]; e.peso = r01(base + (rnd() - .5) * .6); }
    const MEALS = { cafe: [[["ovo", 100], ["paoi", 50], ["banana", 90], ["cafe", 30]], [["aveia", 40], ["leite", 200], ["whey", 30], ["banana", 90]], [["grego", 170], ["aveia", 30], ["morango", 100], ["mel", 15]]],
      almoco: [[["arroz", 150], ["feijao", 100], ["frango", 150], ["alface", 50], ["tomate", 80], ["azeite", 8]], [["massa", 180], ["patinho", 130], ["brocolis", 100], ["parmesao", 10], ["azeite", 8]], [["arrozi", 150], ["lentilha", 100], ["salmao", 130], ["cenoura", 60], ["azeite", 8]]],
      lanche: [[["grego", 170], ["morango", 100], ["amendoas", 20]], [["maca", 130], ["amendoim", 15], ["whey", 30]], [["paoi", 50], ["ricota", 60], ["banana", 90]]],
      jantar: [[["salmao", 140], ["batatad", 200], ["brocolis", 120], ["azeite", 6]], [["arroz", 120], ["feijaop", 80], ["ovo", 100], ["alface", 50], ["tomate", 80]], [["frango", 140], ["quinoa", 150], ["tomate", 100], ["azeite", 8]], [["pizza", 300], ["cerveja", 330]]] };
    const FD = Object.fromEntries(NU_BASE.map(([id, nome, kcal, p, c, f]) => [id, { id, nome, kcal, p, c, f }]));
    for (let k = 20; k >= 0; k--) { const d = addDays(TODAY, -k), wd = parse(d).getDay(); if (k > 0 && rnd() < .14) continue;
      const fim = wd === 0 || wd === 6, alvo = 2300 * (.9 + rnd() * .2) * (fim ? 1.08 : 1), pl = Object.entries(MEALS).map(([ref, ops]) => [ref, ref === "jantar" && !(fim && rnd() < .5) ? ops[Math.floor(rnd() * 3)] : ops[Math.floor(rnd() * ops.length)]]);
      const tot = sum(pl.flatMap(([, its]) => its.map(([id, g]) => FD[id].kcal * g / 100))), f = clamp(alvo / tot, .8, 1.5);
      for (const [ref, its] of k === 0 ? pl.slice(0, 2) : pl) for (const [id, g] of its) { const q = ["cafe", "azeite", "cerveja", "pizza"].includes(id) ? g : Math.round(g * f / 5) * 5, x = FD[id];
        D.nutriLog.push({ id: uid(), data: d, ref, nome: x.nome, qtd: q, kcal: Math.round(x.kcal * q / 100), p: r1(x.p * q / 100), c: r1(x.c * q / 100), f: r1(x.f * q / 100), base: id, fonte: "voce", at: at(d, { cafe: 8, almoco: 13, lanche: 16, jantar: 20 }[ref]) }); }
      D.nutri.agua[d] = (6 + Math.floor(rnd() * 7)) * 250; }
    D.nutri.medidas = [56, 42, 28, 14, 0].map((k, i) => ({ data: addDays(TODAY, -k - 1), cintura: [92, 91.5, 90.5, 90, 89.5][i] }));
    D.nutri.planos = [{ id: "np1", at: Date.now() - 5 * 864e5, titulo: "Dia de treino com 2.300 kcal", texto: "**Café (07h30)**: 3 ovos mexidos, 1 fatia de pão integral, 1 banana · ~520 kcal, 25 g de proteína\n\n**Almoço (13h)**: 150 g de arroz, 100 g de feijão, 150 g de frango grelhado, salada à vontade com 1 colher de azeite · ~650 kcal, 58 g\n\n**Pré-treino (17h)**: iogurte grego com 30 g de aveia e mel · ~330 kcal, 20 g\n\n**Jantar (20h30)**: 140 g de salmão, 200 g de batata-doce, brócolis · ~620 kcal, 35 g\n\n**Total**: ~2.300 kcal e ~160 g de proteína. Nos dias sem treino, tire o mel e metade da batata-doce." }];
    /* Personal: perfil, as fichas Superior e Inferior com as cargas atuais, 12 semanas de academia e corrida */
    D.treino = { perfil: { nivel: "intermediario", objetivo: "emagrecimento", modo: "medio", dias: 4, minutos: 60, local: "academia", limitacoes: "ombro direito incomoda no desenvolvimento com barra" }, fichas: [], planoCorrida: null };
    const FICHAS = { Superior: [["supino", 4, "6-10", 60], ["remada", 4, "6-10", 55], ["desenv", 3, "8-12", 18], ["puxada", 3, "8-12", 50], ["elevlat", 3, "12-15", 8], ["tricp", 3, "10-12", 25], ["rosca", 3, "10-12", 24]],
      Inferior: [["agach", 4, "6-10", 70], ["stiff", 3, "8-10", 60], ["legpress", 3, "10-12", 140], ["flexora", 3, "10-12", 35], ["pantp", 3, "10-15", 50], ["elevpernas", 3, "10-15", 0]] };
    const st = {}, fid = {};
    for (const [nome, exs] of Object.entries(FICHAS)) { fid[nome] = "tf" + nome[0]; D.treino.fichas.push({ id: fid[nome], nome, obs: nome === "Superior" ? "Aquecer o ombro com elástico antes do supino." : "", at: Date.now() - 90 * 864e5, origem: "você", exs: exs.map(([ex, s, r, kg]) => { const e = trEx(ex), rg = trRange(r); st[ex] = { kg, reps: Array(s).fill(rg[0]), rg, s, e }; return { id: uid(), ex, nome: e.nome, g: e.g, series: s, reps: r, carga: kg, desc: e.comp ? 120 : 75, obs: "" }; }) }); }
    const sessao = nome => FICHAS[nome].map(([ex]) => { const x = st[ex], parado = ex === "desenv" && x.kg >= 20;
      const reps = x.reps.map(v => parado ? Math.max(x.rg[0] - 2, v - (rnd() < .5 ? 1 : 0)) : Math.min(x.rg[1], v + (rnd() < .65 ? 1 : 0)));
      const out = { ex, nome: x.e.nome, g: x.e.g, series: reps.map(r => ({ reps: r, kg: x.kg })) };
      if (reps.every(r => r >= x.rg[1]) && x.e.passo) { x.kg += trPasso(x.e, x.kg); x.reps = Array(x.s).fill(x.rg[0]); } else x.reps = reps; return out; });
    let semana = "", nG = 0, nC = 0, alt = 0, pace = 6.35, k5 = 0;
    for (const d of Object.keys(D.saude).filter(d => d >= addDays(TODAY, -84) && d < TODAY).sort()) {
      const e = D.saude[d]; if (!e.treino) continue; const w = weekStart(d); if (w !== semana) { semana = w; nG = 0; nC = 0; }
      const min = +e.min || 45, quer = e.treino === "Musculação" ? "g" : e.treino === "Corrida" ? "c" : null;
      let tipo = quer === "g" && nG < 3 ? "g" : quer === "c" && nC < 2 ? "c" : !quer && nG < 2 && rnd() < .7 ? "g" : !quer && nC < 2 && rnd() < .75 ? "c" : null; if (!tipo) continue;
      if (tipo === "g") { nG++; const nome = alt++ % 2 ? "Inferior" : "Superior"; D.treinoLog.push({ id: uid(), data: d, ficha: fid[nome], nome, dur: min, rpe: 7 + (rnd() < .4 ? 1 : 0), obs: "", itens: sessao(nome), fonte: "voce", at: at(d, 18) }); e.treino = "Musculação"; }
      else { nC++; pace = Math.max(5.75, pace - .006); const prova = !k5 && d >= addDays(TODAY, -24) && min <= 45, tp = prova ? "prova" : min >= 60 ? "longo" : rnd() < .25 ? "tempo" : "leve", p = prova ? 5.3 : tp === "longo" ? pace + .3 : tp === "tempo" ? pace - .45 : pace + (rnd() - .5) * .2;
        const km = prova ? 5 : Math.round(min / p * 100) / 100; if (prova) k5++; D.corridas.push({ id: uid(), data: d, km, min: prova ? 26.5 : min, tipo: tp, fc: tp === "leve" || tp === "longo" ? 142 + Math.round(rnd() * 8) : 165 + Math.round(rnd() * 8), rpe: tp === "leve" ? 4 : tp === "longo" ? 6 : 8, obs: prova ? "Corrida do bairro: 5 km. Sub-27!" : "", fonte: "voce", at: at(d, 7) }); e.treino = "Corrida"; }
      e.trAuto = `${e.treino}|${e.min ?? ""}`;
    }
    for (const f of D.treino.fichas) for (const x of f.exs) x.carga = st[x.ex].kg;
    /* plano de 10 km, começado há duas semanas (mesmas regras do plano básico) */
    const g = trGerarPlano({ obj: "10", semanas: 10, dias: 3 }, D.treino.perfil); if (g.dados) { const ini = addDays(weekStart(TODAY), -14); D.treino.planoCorrida = { ...g.dados, inicio: ini, prova: addDays(ini, 69), at: Date.now() - 15 * 864e5, origem: "app" }; }
    /* conversas de exemplo: uma proposta já aprovada e outra esperando você */
    const nuM = { mem: [{ id: uid(), at: Date.now() - 20 * 864e5, tipo: "preferência", texto: "Prefere jantar cedo e não gosta de camarão.", fixo: true, origem: "mentor" }, { id: uid(), at: Date.now() - 6 * 864e5, tipo: "compromisso", texto: "Proteína no café da manhã todos os dias (ovos ou iogurte grego).", fixo: false, origem: "mentor" }], plano: null, visto: Date.now() - 864e5,
      conversa: [{ role: "user", content: "Lanchei agora: um iogurte grego com morango e um punhado de amêndoas.", at: Date.now() - 2 * 36e5, mode: "chat" },
        { role: "assistant", content: "Boa escolha para a tarde: dá cerca de 250 kcal e 22 g de proteína. Deixei o registro como proposta; é só aprovar.", at: Date.now() - 2 * 36e5 + 6e4, uso: [{ t: "buscar_alimento", d: "“iogurte grego” · 1" }, { t: "registrar_refeicao", d: "Lanche · 3 itens" }],
          acoes: [{ id: uid(), sd: true, mid: "nutri", tipo: "registrar_refeicao", raw: { data: TODAY, refeicao: "lanche", itens: [{ nome: "Iogurte grego natural 0%", gramas: 170 }, { nome: "Morango", gramas: 100 }, { nome: "Amêndoas", gramas: 20 }] }, status: "pendente", erro: "", n: 1 }] }] };
    const ptM = { mem: [{ id: uid(), at: Date.now() - 30 * 864e5, tipo: "alerta", texto: "Ombro direito incomoda no desenvolvimento com barra: usar halteres, pegada neutra.", fixo: true, origem: "mentor" }], plano: null, visto: Date.now() - 3 * 864e5,
      conversa: [{ role: "user", content: "Vou viajar na semana que vem e o hotel só tem halteres até 20 kg. Monta uma ficha?", at: Date.now() - 3 * 864e5, mode: "chat" },
        { role: "assistant", content: "Montei um corpo inteiro com halteres e peso do corpo, 3 vezes na semana, para manter o estímulo sem forçar o ombro. Como as cargas são menores, a faixa de repetições sobe para 10 a 15.", at: Date.now() - 3 * 864e5 + 6e4, uso: [{ t: "listar_exercicios", d: "todos · 42" }, { t: "criar_ficha", d: "Viagem · 6 exercícios" }],
          acoes: [{ id: uid(), sd: true, mid: "personal", tipo: "criar_ficha", raw: { nome: "Viagem (hotel)", obs: "Halteres até 20 kg.", exercicios: [{ exercicio: "goblet", series: 3, reps: "10-15", carga_kg: 20 }, { exercicio: "supinoh", series: 3, reps: "10-15", carga_kg: 18 }, { exercicio: "remadah", series: 3, reps: "10-15", carga_kg: 20 }, { exercicio: "afundo", series: 3, reps: "10-12", carga_kg: 12 }, { exercicio: "elevlat", series: 3, reps: "12-15", carga_kg: 8 }, { exercicio: "prancha", series: 3, reps: "30-45" }] }, status: "pendente", erro: "", n: 1 }] }] };
    D.mentores = { ...(D.mentores || {}), nutri: nuM, personal: ptM };
  } finally { S = keep; VER++; }
}
