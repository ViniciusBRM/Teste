/* ================================================================ Saúde → Alimentação, com o Nutri
   Registro do que você come (por texto ou pela base de alimentos), calorias e macros do dia contra as metas, água, peso com a
   tendência e a projeção, o gasto real estimado pelos seus dados, e as metas calculadas pelo perfil e pelo objetivo.
   Dados: S.nutri (perfil, meta, metas manuais, preferências, água, Meus alimentos, planos) e S.nutriLog (um registro por
   alimento). O peso é o mesmo do check-in (S.saude[dia].peso).
   Contas (as mesmas no app, no prompt e nos testes):
   - TMB: Mifflin-St Jeor. Gasto = TMB × fator de atividade.
   - Calorias: gasto × (1 + ajuste do objetivo e do compromisso), limitadas ao ritmo máximo seguro do compromisso e nunca
     abaixo do piso (TMB, e no mínimo 1.200 kcal para mulheres e 1.500 para homens). IMC < 18,5 nunca recebe déficit.
   - Proteína: g/kg (objetivo × compromisso, +0,2 nos focos esportivo e shape, máx. 2,2) do peso de referência (o peso; com
     IMC > 30, o peso do IMC 25 + 25% da diferença). Gordura: 25–30% das calorias, mínimo 0,6 g/kg. Carboidrato: o resto.
   - Tendência do peso: regressão linear dos últimos 28 dias (4+ pesagens em 10+ dias). Gasto pelos dados: calorias médias
     registradas − tendência × 7.700 kcal/kg (14+ dias registrados). */
/* valores por 100 g (ou 100 ml): TACO 4ª ed., USDA FoodData Central e CREA; confira o rótulo dos industrializados */
const NU_BASE = [
  ["arroz", "Arroz branco cozido", 128, 2.5, 28.1, 0.2, 100, "4 colheres de sopa", "arroz|arroz branco|riso|riso bianco|rice"],
  ["arrozi", "Arroz integral cozido", 124, 2.6, 25.8, 1.0, 100, "4 colheres de sopa", "arroz integral|riso integrale"],
  ["feijao", "Feijão carioca cozido", 76, 4.8, 13.6, 0.5, 80, "1 concha", "feijao|feijao carioca|fagioli|beans"],
  ["feijaop", "Feijão preto cozido", 77, 4.5, 14.0, 0.5, 80, "1 concha", "feijao preto|fagioli neri"],
  ["lentilha", "Lentilha cozida", 93, 6.3, 16.3, 0.5, 100, "1 concha", "lentilha|lentilhas|lenticchie"],
  ["grao", "Grão-de-bico cozido", 164, 8.9, 27.4, 2.6, 100, "1 concha", "grao de bico|grao-de-bico|ceci|chickpeas"],
  ["massa", "Macarrão cozido", 158, 5.8, 30.9, 0.9, 200, "1 prato", "macarrao|massa|pasta|espaguete|spaghetti|penne|fusilli|rigatoni"],
  ["pao", "Pão francês", 300, 8.0, 58.6, 3.1, 50, "1 unidade", "pao|pao frances|pane|panino"],
  ["paoi", "Pão de forma integral", 253, 9.4, 49.9, 3.7, 25, "1 fatia", "pao integral|pao de forma|pane integrale|pan bauletto"],
  ["aveia", "Aveia em flocos", 394, 13.9, 66.6, 8.5, 30, "3 colheres de sopa", "aveia|avena|fiocchi d'avena|oats"],
  ["batata", "Batata cozida", 52, 1.2, 11.9, 0.0, 150, "1 média", "batata|batatas|patata|patate"],
  ["batatad", "Batata-doce cozida", 77, 0.6, 18.4, 0.1, 150, "1 média", "batata doce|batata-doce|patata dolce|patate dolci"],
  ["cuscuz", "Cuscuz de milho cozido", 113, 2.2, 25.3, 0.7, 100, "1 pedaço", "cuscuz"],
  ["quinoa", "Quinoa cozida", 120, 4.4, 21.3, 1.9, 100, "4 colheres de sopa", "quinoa"],
  ["frango", "Peito de frango grelhado", 159, 32.0, 0.0, 2.5, 120, "1 filé", "frango|peito de frango|pollo|petto di pollo|chicken"],
  ["patinho", "Carne bovina (patinho) grelhada", 219, 35.9, 0.0, 7.3, 120, "1 bife", "carne|bife|patinho|manzo|bistecca|beef"],
  ["ovo", "Ovo cozido", 146, 13.3, 0.6, 9.5, 50, "1 unidade", "ovo|ovos|uovo|uova|egg|eggs"],
  ["salmao", "Salmão grelhado", 206, 22.1, 0.0, 12.4, 120, "1 posta", "salmao|salmone|salmon"],
  ["atum", "Atum em lata ao natural", 116, 25.5, 0.0, 0.8, 80, "1 lata drenada", "atum|tonno|tuna"],
  ["sardinha", "Sardinha em óleo (drenada)", 208, 24.6, 0.0, 11.5, 85, "1 lata drenada", "sardinha|sardinhas|sardine"],
  ["tofu", "Tofu firme", 144, 17.3, 2.8, 8.7, 100, "1 fatia grossa", "tofu"],
  ["bresaola", "Bresaola", 151, 32.0, 0.4, 2.6, 50, "5 fatias", "bresaola"],
  ["mozzarella", "Muçarela fresca (fior di latte)", 253, 18.7, 0.7, 19.5, 125, "1 bola", "mussarela|mucarela|muçarela|mozzarella|fior di latte"],
  ["parmesao", "Parmesão", 392, 35.8, 3.2, 25.8, 10, "1 colher de sopa ralado", "parmesao|parmigiano|grana|parmesan"],
  ["ricota", "Ricota", 146, 8.8, 3.5, 10.9, 100, "4 colheres de sopa", "ricota|ricotta"],
  ["minas", "Queijo minas frescal", 264, 17.4, 3.2, 20.2, 30, "1 fatia", "queijo minas|minas frescal|queijo branco"],
  ["iogurte", "Iogurte natural integral", 51, 4.1, 1.9, 3.0, 170, "1 pote", "iogurte|iogurte natural|yogurt|yogurt bianco"],
  ["grego", "Iogurte grego natural 0%", 59, 10.2, 3.6, 0.4, 170, "1 pote", "iogurte grego|yogurt greco|greek yogurt"],
  ["leite", "Leite integral", 61, 3.2, 4.8, 3.3, 200, "1 copo", "leite|leite integral|latte|latte intero|milk"],
  ["leited", "Leite desnatado", 34, 3.4, 5.0, 0.1, 200, "1 copo", "leite desnatado|latte scremato|skim milk"],
  ["whey", "Whey protein (média; confira o rótulo)", 400, 78.0, 8.0, 6.0, 30, "1 scoop", "whey|whey protein|proteina em po|proteine in polvere"],
  ["banana", "Banana", 98, 1.3, 26.0, 0.1, 90, "1 unidade", "banana|bananas|banane"],
  ["maca", "Maçã", 56, 0.3, 15.2, 0.0, 130, "1 unidade", "maca|macas|mela|mele|apple"],
  ["laranja", "Laranja", 37, 1.0, 8.9, 0.1, 150, "1 unidade", "laranja|laranjas|arancia|arance|orange"],
  ["morango", "Morango", 30, 0.9, 6.8, 0.3, 100, "10 unidades", "morango|morangos|fragola|fragole|strawberries"],
  ["abacate", "Abacate", 96, 1.2, 6.0, 8.4, 100, "meia xícara", "abacate|avocado"],
  ["tomate", "Tomate", 15, 1.1, 3.1, 0.2, 100, "1 médio", "tomate|tomates|pomodoro|pomodori"],
  ["alface", "Alface", 11, 1.3, 1.7, 0.2, 50, "1 prato de folhas", "alface|salada verde|lattuga|insalata"],
  ["brocolis", "Brócolis cozido", 25, 2.1, 4.4, 0.5, 100, "1 xícara", "brocolis|broccoli"],
  ["cenoura", "Cenoura crua", 34, 1.3, 7.7, 0.2, 50, "meia unidade", "cenoura|carota|carote"],
  ["azeite", "Azeite de oliva", 884, 0.0, 0.0, 100.0, 13, "1 colher de sopa", "azeite|olio|olio d'oliva|olio extravergine|olive oil"],
  ["manteiga", "Manteiga", 717, 0.9, 0.1, 81.1, 10, "1 colher de chá cheia", "manteiga|burro|butter"],
  ["amendoim", "Pasta de amendoim", 588, 25.1, 19.6, 50.4, 15, "1 colher de sopa", "pasta de amendoim|burro di arachidi|peanut butter"],
  ["amendoas", "Amêndoas", 579, 21.2, 21.6, 49.9, 30, "1 punhado", "amendoa|amendoas|mandorle|almonds"],
  ["castanha", "Castanha-do-pará", 643, 14.5, 15.1, 63.5, 10, "2 unidades", "castanha do para|castanha-do-para|castanhas|noci del brasile"],
  ["nozes", "Nozes", 654, 15.2, 13.7, 65.2, 30, "1 punhado", "nozes|noci|walnuts"],
  ["chocolate", "Chocolate amargo 70%", 598, 7.8, 45.9, 42.6, 20, "2 quadradinhos grandes", "chocolate|chocolate amargo|cioccolato|cioccolato fondente"],
  ["mel", "Mel", 304, 0.3, 82.4, 0.0, 20, "1 colher de sopa", "mel|miele|honey"],
  ["acucar", "Açúcar", 387, 0.3, 99.5, 0.0, 5, "1 colher de chá", "acucar|zucchero|sugar"],
  ["pizza", "Pizza margherita", 266, 11.4, 33.0, 9.7, 300, "1 pizza individual", "pizza|pizza margherita"],
  ["croissant", "Croissant / cornetto", 406, 8.2, 45.8, 21.0, 50, "1 unidade", "croissant|cornetto|brioche"],
  ["cerveja", "Cerveja", 43, 0.5, 3.6, 0.0, 330, "1 garrafa ou lata (330 ml)", "cerveja|birra|beer"],
  ["vinho", "Vinho tinto", 85, 0.1, 2.6, 0.0, 150, "1 taça", "vinho|vino|wine"],
  ["refri", "Refrigerante (cola)", 42, 0.0, 10.6, 0.0, 350, "1 lata", "refrigerante|coca|cola|soda"],
  ["suco", "Suco de laranja natural", 45, 0.7, 10.4, 0.2, 200, "1 copo", "suco|suco de laranja|spremuta|succo d'arancia"],
  ["cafe", "Café espresso (sem açúcar)", 9, 0.1, 1.7, 0.2, 30, "1 xícara", "cafe|cafezinho|espresso|caffe|coffee"]];
const NU_REF = [["cafe", "Café da manhã", /^(cafe( da manha)?|colazione|breakfast)$/], ["almoco", "Almoço", /^(almoco|pranzo|lunch)$/], ["lanche", "Lanche", /^(lanche|lanche da tarde|merenda|spuntino|snack)$/], ["jantar", "Jantar", /^(jantar|janta|cena|dinner)$/], ["ceia", "Ceia", /^(ceia|ceia da noite)$/]];
const NU_ATIV = { sedentario: ["Sedentário", 1.2, "pouco ou nenhum exercício"], leve: ["Leve", 1.375, "exercício 1 a 3 vezes por semana"], moderado: ["Moderado", 1.55, "3 a 5 vezes por semana"], intenso: ["Intenso", 1.725, "6 a 7 vezes por semana"], muito: ["Muito intenso", 1.9, "treino duas vezes por dia ou trabalho físico"] };
const NU_OBJ = { perder: "Perder gordura", manter: "Manter o peso", ganhar: "Ganhar massa muscular" };
const NU_AJ = { perder: { baixo: -.10, medio: -.15, alto: -.20 }, manter: { baixo: 0, medio: 0, alto: 0 }, ganhar: { baixo: .05, medio: .10, alto: .15 } };
const NU_PROT = { perder: { baixo: 1.6, medio: 1.8, alto: 2.0 }, manter: { baixo: 1.2, medio: 1.4, alto: 1.6 }, ganhar: { baixo: 1.6, medio: 1.8, alto: 2.0 } };
/* ritmo máximo (fração do peso por semana) que cada compromisso aceita */
const NU_RITMO = { perder: { baixo: .005, medio: .0075, alto: .01 }, ganhar: { baixo: .0025, medio: .0035, alto: .005 } };
const NU_FOCO = {
  saude: ["Saúde", "saúde metabólica e longevidade: mais vegetais, frutas, fibras e leguminosas, proteína adequada, gordura de qualidade, menos ultraprocessados e álcool; os números servem ao hábito, não o contrário"],
  esportivo: ["Esportivo", "desempenho e recuperação: carboidrato periodizado em torno dos treinos (mais nos dias de treino forte), proteína distribuída nas refeições (0,3 a 0,4 g/kg por refeição), hidratação e refeição antes e depois do treino"],
  shape: ["Shape", "composição corporal: proteína alta, déficit ou superávit moderado, medidas (cintura) além do peso, constância e paciência; estética sem atalhos e sem comprometer a saúde"],
  energia: ["Energia", "energia estável ao longo do dia: refeições regulares, carboidrato de digestão mais lenta, proteína em todas as refeições, cafeína até o começo da tarde e atenção ao sono"],
  qualidade: ["Qualidade de vida", "comer bem sem sofrer: flexibilidade (80/20), refeições sociais e prazer sem culpa, poucos hábitos de cada vez e nada que não dê para manter"] };
const NU_COMPTX = { baixo: "uma ou duas metas por vez (por exemplo: proteína no café da manhã, uma fruta por dia), registro opcional e ajuste de calorias de até 10%", medio: "metas de calorias e proteína, registro na maior parte dos dias e revisão a cada duas semanas; ajuste de até 15%", alto: "macros diários, refeições planejadas, pesagem frequente com média semanal e revisão semanal; ajuste de até 20%, nunca abaixo do piso nem acima do ritmo seguro" };
const NU_DIETA = { onivora: "Onívora", vegetariana: "Vegetariana", vegana: "Vegana", semlactose: "Sem lactose", semgluten: "Sem glúten" };
const NU = { v: "dia", dia: null, q: "", man: null, busca: "" };
const r1 = v => Math.round((+v || 0) * 10) / 10;
function nuD() {
  const d = (S.nutri ||= {}); d.perfil ||= { sexo: "", nasc: "", altura: "", atividade: "leve" }; d.meta ||= { objetivo: "manter", pesoAlvo: "", prazo: "", modo: "medio", foco: "saude" };
  d.manual ||= {}; d.prefs ||= { dieta: "onivora", evitar: "" }; d.agua ||= {}; d.favs ||= []; d.planos ||= []; d.medidas ||= []; S.nutriLog ||= []; return d;
}
/* alimentos: a base e os seus (Meus alimentos), com os nomes normalizados para casar com o texto */
function nuFoods() {
  return memo("nufoods", () => [...NU_BASE.map(([id, nome, kcal, p, c, f, porcao, pnome, al]) => ({ id, nome, kcal, p, c, f, porcao, pnome, al: al.split("|").map(norm) })),
    ...(S.nutri?.favs || []).map(x => ({ id: "fav:" + x.id, nome: x.nome, kcal: +x.kcal || 0, p: +x.p || 0, c: +x.c || 0, f: +x.f || 0, porcao: +x.porcao || 100, pnome: x.pnome || `${+x.porcao || 100} g`, al: [norm(x.nome)], fav: true }))]);
}
const nuFood = id => nuFoods().find(f => f.id === id);
const nuTxt = s => ` ${norm(s).replace(/[^a-z0-9' -]+/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim()} `;
function nuMatch(txt) {
  const t = nuTxt(txt); let best = null;
  for (const f of nuFoods()) for (const a of f.al) { const al = a.replace(/-/g, " "); if ((t.includes(` ${al} `) || t.includes(` ${al}s `)) && (!best || al.length > best.n || (al.length === best.n && f.fav))) best = { f, n: al.length }; }
  return best?.f || null;
}
/* registro por texto: “almoço: 150 g arroz, 100 g feijão, 1 ovo” (quantidade em g/ml/kg, ou unidades da porção) */
const NU_NUM = { meia: .5, meio: .5, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6 };
const NU_UNID = /\b(unidades?|un|fatias?|colheres?|colher de (sopa|cha|sobremesa)|scoops?|copos?|latas?|tacas?|xicaras?|conchas?|potes?|bolas?|files?|bifes?|postas?|pedacos?|porcoes?|porcao|pratos?|punhados?|garrafas?)\b/g;
function nuParsePart(part) {
  let t = norm(part).replace(/[^a-z0-9.,' -]+/g, " ").replace(/\s+/g, " ").trim(), qtd = null, mult = null;
  let m = t.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|grs|gramas?|ml|l)\b/);
  if (m) { const v = +m[1].replace(",", "."); qtd = m[2] === "kg" || m[2] === "l" ? v * 1000 : v; t = `${t.slice(0, m.index)} ${t.slice(m.index + m[0].length)}`.trim(); }
  else { m = t.match(/^(\d+(?:[.,]\d+)?|meia|meio|uma?|dois|duas|tres|quatro|cinco|seis)\b\s*(x\b)?/); if (m) { mult = NU_NUM[m[1]] ?? +m[1].replace(",", "."); t = t.slice(m[0].length).trim(); } }
  t = t.replace(NU_UNID, " ").replace(/\s+/g, " ").trim();
  const f = nuMatch(t); if (!f) return { txt: String(part).trim(), f: null };
  return { txt: String(part).trim(), f, qtd: Math.max(1, Math.round(qtd ?? (mult ?? 1) * f.porcao)) };
}
function nuParse(text) {
  let t = String(text || "").trim(), ref = null; const i = t.indexOf(":");
  if (i > 0 && i < 24) { const r = NU_REF.find(x => x[2].test(norm(t.slice(0, i)))); if (r) { ref = r[0]; t = t.slice(i + 1); } }
  const parts = t.split(/\s*(?:,|;|\+|\n|\be\b|\bcom\b|\bcon\b|\band\b)\s*/i).map(s => s.trim()).filter(Boolean), it = parts.map(nuParsePart);
  return { ref, itens: it.filter(x => x.f), desconhecidos: it.filter(x => !x.f).map(x => x.txt) };
}
const nuRefAuto = () => { const h = new Date().getHours(); return h < 10 ? "cafe" : h < 15 ? "almoco" : h < 18 ? "lanche" : h < 22 ? "jantar" : "ceia"; };
const nuRefNome = k => NU_REF.find(x => x[0] === k)?.[1] || k;
function nuItem(d, ref, f, qtd, fonte = "voce") { return { id: uid(), data: d, ref, nome: f.nome, qtd: Math.round(qtd), kcal: Math.round(f.kcal * qtd / 100), p: r1(f.p * qtd / 100), c: r1(f.c * qtd / 100), f: r1(f.f * qtd / 100), base: f.id, fonte, at: Date.now() }; }

/* ---------------------------------------------------------------- contas */
function nuPesos(dias = 120, hoje = TODAY) {
  const a = addDays(hoje, -dias + 1);
  return Object.entries(S.saude || {}).filter(([d, e]) => d >= a && d <= hoje && e && e.peso !== "" && e.peso != null && isFinite(+e.peso) && +e.peso > 0).map(([d, e]) => ({ d, kg: +e.peso })).sort((x, y) => x.d.localeCompare(y.d));
}
function nuTendencia(hoje = TODAY, dias = 28) {
  const P = nuPesos(dias, hoje); if (P.length < 4 || diff(P.at(-1).d, P[0].d) < 10) return null;
  const xs = P.map(p => diff(p.d, P[0].d)), ys = P.map(p => p.kg), mx = avg(xs), my = avg(ys); let sxy = 0, sxx = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; }); const b = sxx ? sxy / sxx : 0;
  return { kgSem: b * 7, n: P.length, dias: diff(P.at(-1).d, P[0].d), atual: my + b * (xs.at(-1) - mx) };
}
/* peso de agora: a média da última semana com pesagem */
function nuPesoAtual(hoje = TODAY) { const P = nuPesos(30, hoje); if (!P.length) return null; const u = P.at(-1).d, w = P.filter(p => p.d > addDays(u, -7)); return Math.round(avg(w.map(p => p.kg)) * 10) / 10; }
function nuCalc(pf, mt, peso, man = {}, hoje = TODAY) {
  const falta = [], nasc = +String(pf?.nasc || "").slice(0, 4), alt = +pf?.altura;
  if (!["M", "F"].includes(pf?.sexo)) falta.push("sexo"); if (!(nasc > 1900 && nasc <= +hoje.slice(0, 4) - 14)) falta.push("ano de nascimento"); if (!(alt >= 120 && alt <= 230)) falta.push("altura"); if (!(peso >= 30 && peso <= 300)) falta.push("peso");
  if (falta.length) return { ok: false, falta };
  const idade = +hoje.slice(0, 4) - nasc, altm = alt / 100, imc = peso / altm ** 2, bmr = 10 * peso + 6.25 * alt - 5 * idade + (pf.sexo === "M" ? 5 : -161);
  const fator = NU_ATIV[pf.atividade]?.[1] || 1.375, tdee = bmr * fator, avisos = [];
  let obj = NU_OBJ[mt?.objetivo] ? mt.objetivo : "manter"; const modo = SD_COMP[mt?.modo] ? mt.modo : "medio", foco = NU_FOCO[mt?.foco] ? mt.foco : "saude";
  if (obj === "perder" && imc < 18.5) { obj = "manter"; avisos.push("IMC abaixo de 18,5: perder peso não é recomendado. As metas foram calculadas para manter o peso; vale conversar com um profissional."); }
  if (obj === "ganhar" && imc >= 30) avisos.push("Com IMC de 30 ou mais, superávit para ganhar massa tende a trazer gordura junto: vale priorizar recomposição (calorias de manutenção e treino de força).");
  let kcal = tdee * (1 + NU_AJ[obj][modo]); const lim = NU_RITMO[obj]?.[modo], dmax = lim ? lim * peso * 7700 / 7 : 0;
  if (obj === "perder" && tdee - kcal > dmax) kcal = tdee - dmax; if (obj === "ganhar" && kcal - tdee > dmax) kcal = tdee + dmax;
  const piso = Math.round(Math.max(pf.sexo === "M" ? 1500 : 1200, bmr)); let pisoAplicado = false; if (kcal < piso) { kcal = piso; pisoAplicado = true; }
  kcal = Math.round(kcal / 10) * 10;
  const p25 = 25 * altm * altm, ref = imc > 30 ? p25 + .25 * (peso - p25) : peso, pkg = Math.min(2.2, NU_PROT[obj][modo] + (foco === "esportivo" || foco === "shape" ? .2 : 0)), share = foco === "esportivo" || foco === "shape" ? .25 : .30;
  const macros = k => { const prot = Math.round(pkg * ref); let gord = Math.round(Math.max(.6 * ref, k * share / 9)), carb = (k - prot * 4 - gord * 9) / 4; if (carb < 130) { gord = Math.round(Math.max(.6 * ref, (k - prot * 4 - 520) / 9)); carb = (k - prot * 4 - gord * 9) / 4; } return { prot, gord, carb: Math.max(0, Math.round(carb)) }; };
  const calc = { kcal, ...macros(kcal) }, mm = Object.fromEntries(["kcal", "prot", "carb", "gord"].filter(k => isNum(+man?.[k]) && man[k] !== "" && man[k] != null).map(k => [k, +man[k]]));
  const fin = { ...calc }; if (Object.keys(mm).length) { fin.kcal = mm.kcal ?? calc.kcal; const b = macros(fin.kcal); fin.prot = mm.prot ?? b.prot; fin.gord = mm.gord ?? b.gord; fin.carb = mm.carb ?? Math.max(0, Math.round((fin.kcal - fin.prot * 4 - fin.gord * 9) / 4)); if (fin.kcal < piso) avisos.push(`As calorias definidas à mão (${fin.kcal} kcal) estão abaixo do piso de segurança (${piso} kcal).`); }
  if (fin.carb < 130) avisos.push(`Carboidrato abaixo de 130 g por dia (${fin.carb} g): pouco para o cérebro e para treinar; aumente as calorias ou reduza a proteína.`);
  const ritmo = (fin.kcal - tdee) * 7 / 7700;
  if (obj !== "manter" && isNum(+mt?.pesoAlvo) && +mt.pesoAlvo > 0 && mt.prazo && mt.prazo > hoje) { const sem = diff(mt.prazo, hoje) / 7, nec = (+mt.pesoAlvo - peso) / sem, mx = NU_RITMO[obj].alto * peso; if (Math.abs(nec) > mx) avisos.push(`O prazo pede ${num(Math.abs(nec), 2)} kg por semana, acima do ritmo seguro (${num(mx, 2)} kg). Estique o prazo.`); }
  if (+mt?.pesoAlvo > 0 && +mt.pesoAlvo / altm ** 2 < 18.5) avisos.push("O peso-alvo dá IMC abaixo de 18,5. Reveja o alvo com um profissional.");
  return { ok: true, idade, imc, bmr, fator, tdee, obj, modo, foco, aj: NU_AJ[obj][modo], piso, pisoAplicado, ref, pkg, share, calc, manual: Object.keys(mm).length > 0, ...fin, ritmo, fibra: Math.max(25, Math.round(14 * fin.kcal / 1000)), agua: Math.round(35 * peso / 100) * 100, avisos };
}
const nuMetas = () => { const d = nuD(); return memo("numetas", () => nuCalc(d.perfil, d.meta, nuPesoAtual(), d.manual)); };
function nuPorDia() { return memo("nubydate", () => { const M = new Map(); for (const x of S.nutriLog || []) { const a = M.get(x.data) || []; a.push(x); M.set(x.data, a); } return M; }); }
const nuItens = d => nuPorDia().get(d) || [];
const nuSoma = xs => ({ kcal: Math.round(sum(xs.map(x => +x.kcal || 0))), p: r1(sum(xs.map(x => +x.p || 0))), c: r1(sum(xs.map(x => +x.c || 0))), f: r1(sum(xs.map(x => +x.f || 0))), n: xs.length });
function nuTotais(a, b) { const out = []; for (let d = a; d <= b; d = addDays(d, 1)) out.push({ d, ...nuSoma(nuItens(d)), agua: +(S.nutri?.agua?.[d]) || 0 }); return out; }
/* aderência dos últimos 7 dias encerrados com registro */
function nuAderencia(M, hoje = TODAY) {
  const T = nuTotais(addDays(hoje, -7), addDays(hoje, -1)).filter(x => x.n > 0);
  return { dias: T.length, kcalOk: M?.ok ? T.filter(x => Math.abs(x.kcal - M.kcal) <= M.kcal * .1).length : null, protOk: M?.ok ? T.filter(x => x.p >= M.prot * .9).length : null, kcal: T.length ? avg(T.map(x => x.kcal)) : null, prot: T.length ? avg(T.map(x => x.p)) : null };
}
/* gasto real estimado: calorias registradas − variação de peso (7.700 kcal por kg) */
function nuGastoReal(hoje = TODAY) {
  const T = nuTotais(addDays(hoje, -28), addDays(hoje, -1)).filter(x => x.n > 0), tr = nuTendencia(hoje, 28);
  if (T.length < 14 || !tr) return null; const kc = avg(T.map(x => x.kcal));
  return { tdee: kc - tr.kgSem * 7700 / 7, dias: T.length, kcal: kc, kgSem: tr.kgSem };
}
function nuProjecao(M, hoje = TODAY) {
  const tr = nuTendencia(hoje), alvo = +nuD().meta.pesoAlvo, atual = nuPesoAtual(hoje); if (!tr || !(alvo > 0) || !atual || Math.abs(tr.kgSem) < .02) return null;
  const falta = alvo - atual; if (Math.sign(falta) !== Math.sign(tr.kgSem)) return { longe: true, kgSem: tr.kgSem };
  const sem = falta / tr.kgSem; return { data: addDays(hoje, Math.round(sem * 7)), sem, kgSem: tr.kgSem };
}

/* ---------------------------------------------------------------- telas */
const nuBar = (v, alvo, cor, fmt = x => num(x, 0), un = "g") => { const p = alvo ? v / alvo : 0; return `<div class="nubar"><div class="nubt"><i style="width:${Math.min(100, p * 100).toFixed(1)}%;background:${cor}"></i>${p > 1 ? `<i class="over" style="width:${Math.min(100, (p - 1) * 100).toFixed(1)}%"></i>` : ""}</div><span><b>${fmt(v)}</b> de ${alvo ? fmt(alvo) : "–"} ${un}</span></div>`; };
function nuSetup(M) {
  if (M.ok) return "";
  return `<div class="banner">${ic("info")}<span>Para calcular as suas metas faltam: <b>${M.falta.join(", ")}</b>. ${M.falta.includes("peso") ? "O peso vem do check-in ou de Peso e metas." : ""}</span><button type="button" class="btn sm primary" data-nuv="plano">Completar o perfil</button></div>`;
}
function nuDiaV(M) {
  const d = NU.dia || TODAY, xs = nuItens(d), T = nuSoma(xs), agua = +(nuD().agua[d]) || 0;
  const nav = `<div class="ckwnav"><button type="button" class="btn sm ghost" data-nudia="${addDays(d, -1)}" aria-label="Dia anterior">‹</button><b>${d === TODAY ? "Hoje" : esc(fmtDL(d))}</b><button type="button" class="btn sm ghost" data-nudia="${addDays(d, 1)}" aria-label="Próximo dia"${d >= TODAY ? " disabled" : ""}>›</button>${d !== TODAY ? `<button type="button" class="btn sm ghost" data-nudia="${TODAY}">Hoje</button>` : ""}</div>`;
  const kc = M.ok ? M.kcal : null, rest = kc ? kc - T.kcal : null;
  const topo = `<div class="nuday"><div class="nuring">${ring(kc ? T.kcal / kc : 0, T.kcal > (kc || 0) * 1.1 ? "var(--warn)" : "var(--good)", 132, 12)}<div><b>${num(T.kcal, 0)}</b><small>${kc ? `de ${num(kc, 0)} kcal` : "kcal"}</small></div></div>
    <div class="numac"><span class="flbl">Proteína</span>${nuBar(T.p, M.ok ? M.prot : 0, "var(--a-car)")}<span class="flbl">Carboidrato</span>${nuBar(T.c, M.ok ? M.carb : 0, "var(--a-apr)")}<span class="flbl">Gordura</span>${nuBar(T.f, M.ok ? M.gord : 0, "var(--a-fam)")}
      <div class="nuagua"><span>${ic("leaf")}Água <b>${num(agua / 1000, 2)} L</b>${M.ok ? ` de ${num(M.agua / 1000, 1)} L` : ""}</span><button type="button" class="btn sm ghost" data-nuagua="-250" aria-label="Menos 250 ml">−</button><button type="button" class="btn sm" data-nuagua="250">+250 ml</button><button type="button" class="btn sm" data-nuagua="500">+500 ml</button></div></div>
    <p class="muted small nurest">${kc ? rest >= 0 ? `Faltam <b>${num(rest, 0)} kcal</b> para a meta do dia.` : `<b>${num(-rest, 0)} kcal</b> acima da meta do dia.` : "Complete o perfil para ver a meta."}</p></div>`;
  const pv = NU.q.trim() ? nuParse(NU.q) : null;
  const entrada = panel(`${ic("bolt")}Registrar`, `<div class="nuq"><input type="text" id="nu_q" value="${esc(NU.q)}" placeholder="Ex.: almoço: 150 g arroz, 100 g feijão, 120 g frango grelhado" aria-label="O que você comeu" autocomplete="off"><button type="button" class="btn primary" data-act="nuadd">${ic("plus")}Adicionar</button></div>
    <p class="muted small" id="nu_hint">${pv ? nuHint(pv) : `Escreva a refeição (café, almoço, lanche, jantar, ceia), dois pontos e os alimentos com a quantidade em gramas ou em unidades (“1 ovo”, “2 fatias de pão integral”). Sem refeição, vale a da hora (${nuRefNome(nuRefAuto()).toLowerCase()}).`}</p>
    <div class="form f4 nuform"><label>Alimento<input type="text" list="nu_dl" id="nu_fn" placeholder="buscar na base" autocomplete="off"></label><label>Gramas<input type="number" id="nu_fg" min="1" step="1" placeholder="porção"></label><label>Refeição<select id="nu_fr">${NU_REF.map(([k, l]) => `<option value="${k}"${k === nuRefAuto() ? " selected" : ""}>${l}</option>`).join("")}</select></label><button type="button" class="btn" data-act="nuaddf">${ic("plus")}Pôr no dia</button></div>
    <datalist id="nu_dl">${nuFoods().map(f => `<option value="${esc(f.nome)}">${esc(f.pnome)} = ${f.porcao} g</option>`).join("")}</datalist>
    <div class="row wrap"><button type="button" class="btn sm ghost" data-act="numanual">${ic("pen")}Outro alimento (valores à mão)</button><button type="button" class="btn sm ghost" data-nucopy="${addDays(d, -1)}">${ic("repeat")}Repetir as refeições de ${d === TODAY ? "ontem" : fmtD(addDays(d, -1))}</button></div>`);
  const ref = NU_REF.map(([k, l]) => { const its = xs.filter(x => x.ref === k); if (!its.length) return ""; const s = nuSoma(its);
    return `<div class="numeal"><header><b>${l}</b><span>${num(s.kcal, 0)} kcal · P ${num(s.p, 0)} · C ${num(s.c, 0)} · G ${num(s.f, 0)}</span></header>${its.map(x => `<div class="nuit"><span>${esc(x.nome)}${x.fonte === "nutri" ? ` <small class="pill none">Nutri</small>` : ""}</span><label class="nug"><input type="number" min="1" value="${x.qtd}" data-nuqtd="${x.id}" aria-label="Gramas de ${esc(x.nome)}"> g</label><em>${num(x.kcal, 0)} kcal</em><small class="muted">P ${num(x.p, 1)} · C ${num(x.c, 1)} · G ${num(x.f, 1)}</small><button type="button" class="vb" data-nudel="${x.id}" aria-label="Apagar ${esc(x.nome)}">${ic("x")}</button></div>`).join("")}</div>`; }).join("");
  return `${nav}${topo}<div class="g2c">${entrada}${panel(`${ic("list")}Refeições <small>${plural(xs.length, "item", "itens")}</small>`, ref || `<div class="empty">Nada registrado ${d === TODAY ? "hoje" : "neste dia"}.</div>`)}</div>`;
}
function nuHint(pv) {
  return `${pv.ref ? `<b>${nuRefNome(pv.ref)}</b>: ` : ""}${pv.itens.map(x => `${esc(x.f.nome)} ${x.qtd} g (${Math.round(x.f.kcal * x.qtd / 100)} kcal)`).join(" · ") || "nenhum alimento reconhecido"}${pv.desconhecidos.length ? ` <span class="st-warn">· não reconheci: ${pv.desconhecidos.map(esc).join(", ")}</span>` : ""}`;
}
function nuSemanaV(M) {
  const T = nuTotais(addDays(TODAY, -13), TODAY), A = nuAderencia(M), L = T.map(x => fmtD(x.d));
  const ch = colChart(L, [{ name: "Calorias", color: "var(--a-apr)", data: T.map(x => x.n ? x.kcal : null) }], { w: vw(12), h: 230, line: M.ok ? [{ name: "Meta", color: "var(--ink-2)", data: T.map(() => M.kcal) }] : [], fmt: v => num(v, 0) });
  const chp = colChart(L, [{ name: "Proteína (g)", color: "var(--a-car)", data: T.map(x => x.n ? x.p : null) }], { w: vw(12), h: 190, line: M.ok ? [{ name: "Meta", color: "var(--ink-2)", data: T.map(() => M.prot) }] : [], fmt: v => num(v, 0) });
  const tab = () => ({ cols: [{ l: "Dia" }, { l: "kcal", num: true }, { l: "Proteína (g)", num: true }, { l: "Carboidrato (g)", num: true }, { l: "Gordura (g)", num: true }, { l: "Água (L)", num: true }, { l: "Itens", num: true }], rows: T.map(x => [fmtDY(x.d), x.n ? x.kcal : null, x.n ? x.p : null, x.n ? x.c : null, x.n ? x.f : null, x.agua ? r1(x.agua / 1000) : null, x.n]) });
  return `${kpiRow([kmini("var(--a-apr)", "Média de calorias (7 dias)", A.kcal == null ? "–" : `${num(A.kcal, 0)} kcal`, M.ok ? `meta ${num(M.kcal, 0)} · ${A.dias} dias registrados` : `${A.dias} dias registrados`), kmini("var(--a-car)", "Média de proteína", A.prot == null ? "–" : `${num(A.prot, 0)} g`, M.ok ? `meta ${M.prot} g` : ""), kmini("var(--good)", "Dias na meta de calorias (±10%)", A.kcalOk == null ? "–" : `${A.kcalOk} de ${A.dias}`, "últimos 7 dias encerrados"), kmini("var(--a-fam)", "Dias com proteína suficiente", A.protOk == null ? "–" : `${A.protOk} de ${A.dias}`, "90% da meta ou mais")])}
    <div class="vg">${vis("nu-kcal", "Calorias por dia", ch, { cls: "s12", sub: "14 dias · dia sem registro fica vazio, não zero", table: tab })}${vis("nu-prot", "Proteína por dia", chp, { cls: "s12" })}</div>`;
}
function nuPesoV(M) {
  const P = nuPesos(120), tr = nuTendencia(), pj = nuProjecao(M), GR = nuGastoReal(), atual = nuPesoAtual(), meta = nuD().meta, alvo = +meta.pesoAlvo > 0 ? +meta.pesoAlvo : null, hoje = (S.saude[TODAY] || {}).peso;
  const dias = []; for (let k = 89; k >= 0; k--) dias.push(addDays(TODAY, -k)); const mp = new Map(P.map(p => [p.d, p.kg])), serie = dias.map(d => mp.get(d) ?? null);
  const mm = dias.map((d, i) => { const v = []; for (let j = Math.max(0, i - 6); j <= i; j++) if (serie[j] != null) v.push(serie[j]); return v.length ? Math.round(avg(v) * 100) / 100 : null; });
  const ch = P.length ? lineChart(dias.map(fmtD), [{ name: "Pesagem", color: "var(--muted)", data: serie, fill: false, dots: true }, { name: "Média de 7 dias", color: "var(--a-car)", data: mm, fill: false, dots: false }, ...(alvo ? [{ name: "Meta", color: "var(--good)", data: dias.map(() => alvo), dash: true, fill: false, dots: false }] : [])], { w: vw(12), h: 260, zero: false, fmt: v => num(v, 1), maxLabels: 10 }) : emptyChart("Registre o peso para ver a curva.");
  const lim = M.ok && M.obj !== "manter" ? NU_RITMO[M.obj][M.modo] * (atual || 0) : null, rit = tr ? tr.kgSem : null;
  const st = rit == null || lim == null ? "" : M.obj === "perder" ? (rit < -lim * 1.2 ? "crit" : rit <= -.05 ? "good" : "warn") : (rit > lim * 1.3 ? "warn" : rit >= .03 ? "good" : "warn");
  return `${kpiRow([kmini("var(--a-car)", "Peso (média da última semana)", atual == null ? "–" : `${num(atual, 1)} kg`, M.ok ? `IMC ${num(M.imc, 1)}` : ""), kmini("var(--a-apr)", "Tendência (28 dias)", rit == null ? "–" : `${rit > 0 ? "+" : ""}${num(rit, 2)}`, rit == null ? "precisa de 4 pesagens em 10 dias" : `kg por semana${lim ? ` · seguro: até ${num(lim, 2)}` : ""}`, st), kmini("var(--good)", "Meta", alvo ? `${num(alvo, 1)} kg` : "–", meta.prazo ? `até ${fmtDY(meta.prazo)}` : "sem prazo"), kmini("var(--a-fam)", "Projeção", pj?.data ? fmtDY(pj.data) : pj?.longe ? "afastando" : "–", pj?.data ? `no ritmo atual (${plural(Math.round(pj.sem), "semana", "semanas")})` : pj?.longe ? "o peso vai no sentido contrário da meta" : "precisa de tendência e meta")])}
    <div class="g2c">${panel(`${ic("pulse")}Pesar`, `<div class="row wrap"><label class="lbl">Peso de hoje (kg)<input type="number" id="nu_peso" step="0.1" min="30" max="300" value="${esc(hoje ?? "")}"></label><button type="button" class="btn primary" data-act="nupeso">${ic("check")}Registrar</button></div><p class="muted small">Pese-se de manhã, em jejum, depois do banheiro. Variações de 0,5 a 1 kg de um dia para o outro são água; olhe a média de 7 dias. O peso vai para o check-in do dia.</p>
      <div class="flbl">Cintura (cm)</div><div class="row wrap"><input type="number" id="nu_cint" step="0.5" min="40" max="200" aria-label="Cintura em cm" placeholder="na altura do umbigo"><button type="button" class="btn sm" data-act="nucint">Registrar</button>${nuD().medidas.length ? `<span class="muted small">${nuD().medidas.slice(-4).map(x => `${fmtD(x.data)}: ${num(x.cintura, 1)} cm`).join(" · ")}</span>` : ""}</div>`)}
    ${panel(`${ic("flame")}Gasto de energia`, `<div class="krow">${kmini("var(--a-apr)", "Pela fórmula", M.ok ? `${num(M.tdee, 0)} kcal` : "–", M.ok ? `TMB ${num(M.bmr, 0)} × ${num(M.fator, 3)} (${esc(NU_ATIV[nuD().perfil.atividade]?.[0] || "")})` : "complete o perfil")}${kmini("var(--a-car)", "Pelos seus dados", GR ? `${num(GR.tdee, 0)} kcal` : "–", GR ? `${num(GR.kcal, 0)} kcal/dia registradas em ${GR.dias} dias e ${GR.kgSem > 0 ? "+" : ""}${num(GR.kgSem, 2)} kg/sem` : "precisa de 14 dias registrados e a tendência do peso")}</div><p class="muted small">Se os dois divergirem muito por semanas, ou o registro está incompleto, ou o fator de atividade não é o seu. O Nutri pode propor o ajuste.</p>`)}</div>
    <div class="vg">${vis("nu-peso", "Peso, 90 dias", ch, { cls: "s12", sub: "pontos = pesagens · linha = média de 7 dias" })}</div>`;
}
function nuPlanoV(M) {
  const d = nuD(), pf = d.perfil, mt = d.meta, sel = (id, obj, cur) => `<select id="${id}">${Object.entries(obj).map(([k, v]) => `<option value="${k}"${cur === k ? " selected" : ""}>${esc(Array.isArray(v) ? v[0] : v)}</option>`).join("")}</select>`;
  const perfil = panel(`${ic("users")}Perfil`, `<div class="form f2"><label>Sexo (para a fórmula)<select id="nup_sexo"><option value=""></option><option value="F"${pf.sexo === "F" ? " selected" : ""}>Feminino</option><option value="M"${pf.sexo === "M" ? " selected" : ""}>Masculino</option></select></label><label>Ano de nascimento<input type="number" id="nup_nasc" min="1920" max="2015" value="${esc(pf.nasc)}"></label><label>Altura (cm)<input type="number" id="nup_altura" min="120" max="230" value="${esc(pf.altura)}"></label><label>Atividade<select id="nup_atividade">${Object.entries(NU_ATIV).map(([k, [l, f, t]]) => `<option value="${k}"${pf.atividade === k ? " selected" : ""}>${l} (${t})</option>`).join("")}</select></label></div>
    <div class="form f2"><label>Alimentação<select id="nup_dieta">${Object.entries(NU_DIETA).map(([k, l]) => `<option value="${k}"${d.prefs.dieta === k ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Evitar ou alergias<input type="text" id="nup_evitar" value="${esc(d.prefs.evitar)}" placeholder="ex.: camarão, lactose"></label></div>`);
  const meta = panel(`${ic("target")}Objetivo e o Nutri`, `<div class="form f3"><label>Objetivo${sel("num_objetivo", NU_OBJ, mt.objetivo)}</label><label>Peso-alvo (kg)<input type="number" id="num_pesoAlvo" step="0.5" value="${esc(mt.pesoAlvo)}"></label><label>Prazo<input type="date" id="num_prazo" value="${esc(mt.prazo)}"></label></div>
    <div class="flbl">Compromisso</div><div class="segs" role="group" aria-label="Compromisso">${Object.entries(SD_COMP).map(([k, [l]]) => `<button type="button" class="seg" data-numodo="${k}" aria-pressed="${mt.modo === k}">${l}</button>`).join("")}</div><p class="muted small">${esc(NU_COMPTX[mt.modo] || "")}</p>
    <div class="flbl">Foco do Nutri</div><div class="chips">${Object.entries(NU_FOCO).map(([k, [l]]) => `<button type="button" class="chip${mt.foco === k ? " on" : ""}" data-nufoco="${k}" aria-pressed="${mt.foco === k}">${l}</button>`).join("")}</div><p class="muted small">${esc(NU_FOCO[mt.foco]?.[1] || "")}</p>
    <p class="note">${ic("shield")}<span>Em qualquer foco e compromisso: nunca abaixo do piso de calorias, perda até 1% do peso por semana e ganho até 0,5%, sem dietas extremas. O Nutri é uma IA: não substitui nutricionista ou médico, principalmente com doença, remédios, gestação ou relação difícil com a comida.</span></p>`);
  const linha = (l, v, s = "") => `<tr><td>${l}</td><td class="num"><b>${v}</b></td><td class="muted small">${s}</td></tr>`;
  const res = M.ok ? `<table class="dt nucalc"><tbody>${linha("Metabolismo basal (Mifflin-St Jeor)", `${num(M.bmr, 0)} kcal`, `${M.idade} anos · ${pf.altura} cm · ${num(nuPesoAtual(), 1)} kg`)}${linha("Gasto do dia", `${num(M.tdee, 0)} kcal`, `× ${num(M.fator, 3)} (${esc(NU_ATIV[pf.atividade]?.[0] || "")})`)}${linha("Ajuste do objetivo", `${M.aj > 0 ? "+" : ""}${pct(M.aj)}`, `${esc(NU_OBJ[M.obj])} · compromisso ${esc(SD_COMP[M.modo][0].toLowerCase())}${M.pisoAplicado ? " · limitado pelo piso" : ""}`)}
    ${linha("Calorias", `${num(M.calc.kcal, 0)} kcal`, `piso de segurança ${num(M.piso, 0)} kcal · ritmo esperado ${M.ritmo > 0 ? "+" : ""}${num(M.ritmo, 2)} kg/sem`)}${linha("Proteína", `${M.calc.prot} g`, `${num(M.pkg, 1)} g/kg × ${num(M.ref, 1)} kg`)}${linha("Gordura", `${M.calc.gord} g`, `${pct(M.share)} das calorias, mínimo 0,6 g/kg`)}${linha("Carboidrato", `${M.calc.carb} g`, "o restante")}${linha("Fibras", `${M.fibra} g`, "14 g a cada 1.000 kcal")}${linha("Água", `${num(M.agua / 1000, 1)} L`, "35 ml por kg, mais nos dias de treino e calor")}</tbody></table>${M.manual ? `<p class="note">${ic("pen")}<span>Valendo as metas definidas à mão: ${M.kcal} kcal · P ${M.prot} g · C ${M.carb} g · G ${M.gord} g.</span></p>` : ""}` : `<p class="muted">Preencha em Perfil: <b>${M.falta.join(", ")}</b>${M.falta.includes("peso") ? " (o peso vem do check-in ou de Peso e metas)" : ""}.</p>`;
  const av = M.ok && M.avisos.length ? M.avisos.map(a => `<p class="ckalertbox">${ic("flag")}${esc(a)}</p>`).join("") : "";
  const man = panel(`${ic("sliders")}Metas à mão <small>opcional</small>`, `<div class="form f4">${[["kcal", "kcal"], ["prot", "Proteína (g)"], ["carb", "Carboidrato (g)"], ["gord", "Gordura (g)"]].map(([k, l]) => `<label>${l}<input type="number" id="numan_${k}" value="${esc(d.manual[k] ?? "")}" placeholder="${M.ok ? M.calc[k] : ""}"></label>`).join("")}</div><div class="row wrap"><button type="button" class="btn sm" data-act="numan">${ic("check")}Usar estes valores</button>${M.manual ? `<button type="button" class="btn sm ghost" data-act="numanx">Voltar ao calculado</button>` : ""}</div><p class="muted small">Vazio = o valor calculado. O que ficar abaixo do piso de segurança aparece como aviso.</p>`);
  const pls = d.planos.length ? panel(`${ic("list")}Planos alimentares do Nutri <small>${d.planos.length}</small>`, d.planos.map(x => `<details class="nuplan"><summary><b>${esc(x.titulo)}</b> <small class="muted">${fmtD(iso(new Date(x.at)))}</small></summary><div class="mdx">${md(x.texto)}</div><button type="button" class="btn sm ghost" data-nuplandel="${x.id}">${ic("trash")}Apagar</button></details>`).join("")) : "";
  return `<div class="g2c">${perfil}${meta}</div>${panel(`${ic("table")}Metas calculadas`, `${res}${av}`)}<div class="g2c">${man}${pls}</div>`;
}
function nuAlimentosV() {
  const q = norm(NU.busca), fs = nuFoods().filter(f => !q || f.al.some(a => a.includes(q)) || norm(f.nome).includes(q)), base = fs.filter(f => !f.fav), meus = nuD().favs;
  return `<div class="g2c">${panel(`${ic("plus")}Meus alimentos`, `<div class="form f3"><label class="full">Nome<input type="text" id="nuf_nome" placeholder="ex.: Pão da padaria da esquina"></label><label>kcal por 100 g<input type="number" id="nuf_kcal" min="0"></label><label>Proteína (g/100 g)<input type="number" id="nuf_p" min="0" step="0.1"></label><label>Carboidrato (g/100 g)<input type="number" id="nuf_c" min="0" step="0.1"></label><label>Gordura (g/100 g)<input type="number" id="nuf_f" min="0" step="0.1"></label><label>Porção (g)<input type="number" id="nuf_porcao" min="1" value="100"></label><label>Nome da porção<input type="text" id="nuf_pnome" placeholder="ex.: 1 fatia"></label></div><button type="button" class="btn sm primary" data-act="nufavadd">${ic("plus")}Salvar alimento</button>
      ${meus.length ? `<ul class="nufavs">${meus.map(x => `<li><b>${esc(x.nome)}</b><small class="muted">${num(+x.kcal, 0)} kcal · P ${num(+x.p, 1)} · C ${num(+x.c, 1)} · G ${num(+x.f, 1)} por 100 g · porção ${esc(x.pnome || x.porcao + " g")}</small><button type="button" class="vb" data-nufavdel="${x.id}" aria-label="Apagar ${esc(x.nome)}">${ic("trash")}</button></li>`).join("")}</ul>` : `<p class="muted small">Os seus alimentos entram na busca e no registro por texto, pelo nome.</p>`}`)}
    ${panel(`${ic("book")}Base de alimentos <small>${NU_BASE.length} · por 100 g</small>`, `<input type="search" id="nu_busca" value="${esc(NU.busca)}" placeholder="Buscar (português ou italiano)" aria-label="Buscar alimento"><div class="hscroll"><table class="dt"><thead><tr><th>Alimento</th><th class="num">kcal</th><th class="num">P</th><th class="num">C</th><th class="num">G</th><th>Porção</th></tr></thead><tbody>${base.map(f => `<tr><td>${esc(f.nome)}</td><td class="num">${f.kcal}</td><td class="num">${num(f.p, 1)}</td><td class="num">${num(f.c, 1)}</td><td class="num">${num(f.f, 1)}</td><td class="muted small">${esc(f.pnome)} · ${f.porcao} g</td></tr>`).join("")}</tbody></table></div><p class="muted small">Fontes: TACO (4ª ed.), USDA FoodData Central e CREA. Industrializados variam: confira o rótulo e, se usar muito, salve em Meus alimentos.</p>`)}</div>`;
}
const NU_QUICK = ["Como estou em relação à meta?", "Monte um cardápio de um dia com as minhas metas", "O que comer antes e depois do treino?", "Comi fora hoje: me ajude a registrar", "Revise as minhas metas para as próximas semanas"];
const NU_ACTS = [["Acompanhamento da semana", "refresh", "Faça o acompanhamento da minha semana de alimentação: 1) calorias e proteína contra as metas, dia a dia, e a aderência; 2) o peso (tendência e projeção) e se o ritmo está seguro; 3) o que está funcionando e o que travou, com números; 4) até 3 ajustes para a próxima semana, adequados ao meu compromisso e ao meu foco. Se fizer sentido mudar metas ou objetivo, proponha."], ["Cardápio de amanhã", "list", "Monte um cardápio para amanhã que bata as minhas metas (calorias, proteína, carboidrato e gordura), com quantidades em gramas, respeitando a minha alimentação e o que eu evito, e considerando o treino de amanhã se houver. Proponha salvá-lo como plano alimentar."]];
function pAlimentacao() {
  nuD(); const M = nuMetas(), v = NU.v;
  const segs = `<div class="segs" role="group" aria-label="Seção">${[["dia", "Dia"], ["semana", "Semana"], ["peso", "Peso e metas"], ["plano", "Plano e perfil"], ["alimentos", "Alimentos"]].map(([k, l]) => `<button type="button" class="seg" data-nuv="${k}" aria-pressed="${v === k}">${l}</button>`).join("")}</div>`;
  const body = { dia: nuDiaV, semana: nuSemanaV, peso: nuPesoV, plano: nuPlanoV, alimentos: nuAlimentosV }[v] || nuDiaV;
  const main = `<div class="sdbar">${segs}${sdAgBtn("nutri", "apple")}</div>${v === "plano" ? "" : nuSetup(M)}${body(M)}`;
  return sdWrap("nutri", main, { quick: NU_QUICK, acts: NU_ACTS, intro: "Lê o que você registrou, o peso, as metas e os treinos a cada mensagem. Registra refeições descritas em texto, monta cardápios e ajusta metas: tudo vira proposta, que você aprova com um clique ou escrevendo “ok”. É uma IA: não substitui nutricionista ou médico.", priv: "A cada mensagem o Nutri recebe o seu perfil, as metas, os registros de 14 dias, o peso e o resumo dos treinos. Fica fora da IA se a Saúde física estiver bloqueada em Privacidade." });
}

/* ---------------------------------------------------------------- ações */
function nuAddItens(d, ref, its, fonte) { const L = (S.nutriLog ||= []); for (const x of its) L.push(nuItem(d, ref, x.f, x.qtd, fonte)); }
function nuClick(t) {
  const ds = t.dataset, a = ds.act;
  if (ds.nuv) { NU.v = ds.nuv; render(); return true; }
  if (ds.nudia) { NU.dia = ds.nudia > TODAY ? TODAY : ds.nudia; render(); return true; }
  if (ds.nuagua) { const d = NU.dia || TODAY, A = nuD().agua; A[d] = Math.max(0, (+A[d] || 0) + +ds.nuagua); if (!A[d]) delete A[d]; touch("nutri", { label: "Água" }); return true; }
  if (ds.nudel) { const i = (S.nutriLog || []).findIndex(x => x.id === ds.nudel); if (i >= 0) { const x = S.nutriLog.splice(i, 1)[0]; touch("nutriLog", { label: `Apagado: ${x.nome}` }); undoToast(`Apagado: ${x.nome}`); } return true; }
  if (ds.nucopy) { const de = ds.nucopy, para = NU.dia || TODAY, xs = nuItens(de); if (!xs.length) { toast(`Nada registrado em ${fmtD(de)}.`); return true; } for (const x of xs) S.nutriLog.push({ ...x, id: uid(), data: para, fonte: "voce", at: Date.now() }); touch("nutriLog", { label: "Refeições repetidas" }); undoToast(`${plural(xs.length, "item repetido", "itens repetidos")}`); return true; }
  if (ds.numodo) { nuD().meta.modo = ds.numodo; touch("nutri", { label: "Compromisso da alimentação" }); return true; }
  if (ds.nufoco) { nuD().meta.foco = ds.nufoco; touch("nutri", { label: "Foco do Nutri" }); return true; }
  if (ds.nufavdel) { const d = nuD(); d.favs = d.favs.filter(x => x.id !== ds.nufavdel); touch("nutri", { label: "Alimento apagado" }); return true; }
  if (ds.nuplandel) { const d = nuD(); d.planos = d.planos.filter(x => x.id !== ds.nuplandel); touch("nutri", { label: "Plano apagado" }); return true; }
  if (a === "nuadd") { const pv = nuParse($("#nu_q")?.value || NU.q), d = NU.dia || TODAY; if (!pv.itens.length) { toast(pv.desconhecidos.length ? `Não reconheci: ${pv.desconhecidos.join(", ")}. Use “Outro alimento” ou peça ao Nutri.` : "Escreva o que você comeu."); return true; }
    nuAddItens(d, pv.ref || nuRefAuto(), pv.itens, "voce"); NU.q = pv.desconhecidos.join(", "); touch("nutriLog", { label: "Refeição registrada" });
    undoToast(`${plural(pv.itens.length, "alimento registrado", "alimentos registrados")}${pv.desconhecidos.length ? ` · não reconheci: ${pv.desconhecidos.join(", ")}` : ""}`); return true; }
  if (a === "nuaddf") { const f = nuFoods().find(x => norm(x.nome) === norm($("#nu_fn")?.value)) || nuMatch($("#nu_fn")?.value || ""); if (!f) { toast("Escolha um alimento da lista."); return true; } const g = +$("#nu_fg")?.value || f.porcao; nuAddItens(NU.dia || TODAY, $("#nu_fr")?.value || nuRefAuto(), [{ f, qtd: g }], "voce"); touch("nutriLog", { label: `${f.nome} registrado` }); return true; }
  if (a === "numanual") { nuManualDlg(); return true; }
  if (a === "nupeso") { const v = +String($("#nu_peso")?.value || "").replace(",", "."); if (!(v >= 30 && v <= 300)) { toast("Peso entre 30 e 300 kg."); return true; } S.saude[TODAY] = { ...(S.saude[TODAY] || {}), peso: v }; touch("saude", { label: "Peso registrado" }); undoToast(`Peso: ${num(v, 1)} kg`); return true; }
  if (a === "nucint") { const v = +$("#nu_cint")?.value; if (!(v >= 40 && v <= 200)) { toast("Cintura entre 40 e 200 cm."); return true; } const L = nuD().medidas.filter(x => x.data !== TODAY); L.push({ data: TODAY, cintura: v }); nuD().medidas = L.sort((x, y) => x.data.localeCompare(y.data)); touch("nutri", { label: "Cintura registrada" }); return true; }
  if (a === "numan") { const m = {}; for (const k of ["kcal", "prot", "carb", "gord"]) { const v = $("#numan_" + k)?.value; if (v !== "" && v != null && isFinite(+v) && +v >= 0) m[k] = +v; } if (m.kcal != null && m.kcal < 800) { toast("Calorias abaixo de 800 não são aceitas."); return true; } nuD().manual = m; touch("nutri", { label: "Metas à mão" }); return true; }
  if (a === "numanx") { nuD().manual = {}; touch("nutri", { label: "Metas calculadas" }); return true; }
  if (a === "nufavadd") { const g = k => $("#nuf_" + k)?.value, nome = String(g("nome") || "").trim(); if (!nome || !isFinite(+g("kcal")) || g("kcal") === "") { toast("Dê um nome e as calorias por 100 g."); return true; }
    const x = { id: uid(), nome: nome.slice(0, 80), kcal: +g("kcal"), p: +g("p") || 0, c: +g("c") || 0, f: +g("f") || 0, porcao: +g("porcao") || 100, pnome: String(g("pnome") || "").trim() };
    if (4 * x.p + 4 * x.c + 9 * x.f > x.kcal * 1.15 + 10) { toast("Os macros dão mais calorias que o total: confira os valores."); return true; } nuD().favs.push(x); touch("nutri", { label: "Alimento salvo" }); return true; }
  return false;
}
function nuManualDlg() {
  $("#dlg").innerHTML = `<form method="dialog" id="numf"><h3>Outro alimento</h3><div class="form f2"><label class="full">Nome<input type="text" id="nux_nome" required></label><label>Gramas<input type="number" id="nux_qtd" min="1" value="100"></label><label>Refeição<select id="nux_ref">${NU_REF.map(([k, l]) => `<option value="${k}"${k === nuRefAuto() ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>kcal (na quantidade)<input type="number" id="nux_kcal" min="0"></label><label>Proteína (g)<input type="number" id="nux_p" min="0" step="0.1"></label><label>Carboidrato (g)<input type="number" id="nux_c" min="0" step="0.1"></label><label>Gordura (g)<input type="number" id="nux_f" min="0" step="0.1"></label></div>
    <label class="chk"><input type="checkbox" id="nux_fav"> Salvar em Meus alimentos (por 100 g)</label><div class="dlgfoot"><span></span><div class="row"><button type="button" class="btn" id="numno">Cancelar</button><button type="button" class="btn primary" id="numok">Registrar</button></div></div></form>`;
  const d = $("#dlg"); d.showModal(); $("#numno").onclick = () => d.close();
  $("#numok").onclick = () => { const g = k => $("#nux_" + k)?.value, nome = String(g("nome") || "").trim(), qtd = +g("qtd"), kcal = +g("kcal"); if (!nome || !(qtd > 0) || g("kcal") === "" || !(kcal >= 0)) { toast("Nome, gramas e calorias."); return; }
    const p = +g("p") || 0, c = +g("c") || 0, f = +g("f") || 0; if (4 * p + 4 * c + 9 * f > kcal * 1.15 + 10) { toast("Os macros dão mais calorias que o total: confira."); return; }
    (S.nutriLog ||= []).push({ id: uid(), data: NU.dia || TODAY, ref: g("ref"), nome: nome.slice(0, 80), qtd: Math.round(qtd), kcal: Math.round(kcal), p: r1(p), c: r1(c), f: r1(f), base: "", fonte: "voce", at: Date.now() });
    const keys = ["nutriLog"]; if ($("#nux_fav")?.checked) { nuD().favs.push({ id: uid(), nome, kcal: Math.round(kcal / qtd * 100), p: r1(p / qtd * 100), c: r1(c / qtd * 100), f: r1(f / qtd * 100), porcao: Math.round(qtd), pnome: `${Math.round(qtd)} g` }); keys.push("nutri"); }
    d.close(); touch(...keys, { label: `${nome} registrado` }); };
}
function nuInput(t) {
  if (t.id === "nu_q") { NU.q = t.value; const h = $("#nu_hint"); if (h) h.innerHTML = t.value.trim() ? nuHint(nuParse(t.value)) : ""; return true; }
  if (t.id === "nu_busca") { NU.busca = t.value; render(); return true; }
  return false;
}
function nuChange(t) {
  const d = nuD();
  if (t.dataset.nuqtd) { const x = (S.nutriLog || []).find(z => z.id === t.dataset.nuqtd), q = +t.value; if (x && q > 0) { const k = q / x.qtd; x.kcal = Math.round(x.kcal * k); x.p = r1(x.p * k); x.c = r1(x.c * k); x.f = r1(x.f * k); x.qtd = Math.round(q); touch("nutriLog", { label: `${x.nome}: ${x.qtd} g` }); } return true; }
  const pk = t.id?.match(/^nup_(sexo|nasc|altura|atividade)$/); if (pk) { d.perfil[pk[1]] = t.value; touch("nutri", { label: "Perfil da alimentação" }); return true; }
  const pr = t.id?.match(/^nup_(dieta|evitar)$/); if (pr) { d.prefs[pr[1]] = t.value; touch("nutri", { label: "Preferências" }); return true; }
  const mk = t.id?.match(/^num_(objetivo|pesoAlvo|prazo)$/); if (mk) { d.meta[mk[1]] = t.value; if (mk[1] === "objetivo") { d.meta.inicio = TODAY; d.meta.pesoInicio = nuPesoAtual(); } touch("nutri", { label: "Objetivo da alimentação" }); return true; }
  return false;
}
document.addEventListener("keydown", e => { if (e.target?.id === "nu_q" && e.key === "Enter" && !e.isComposing) { e.preventDefault(); $('[data-act="nuadd"]')?.click(); } });

/* ---------------------------------------------------------------- o Nutri: dados, prompt, ferramentas, propostas */
function nuFacts() {
  const d = nuD(), M = nuMetas(), pf = d.perfil, mt = d.meta, P = nuPesos(30), tr = nuTendencia(), GR = nuGastoReal(), A = nuAderencia(M), pj = nuProjecao(M), L = [];
  L.push(`PERFIL: ${pf.sexo === "M" ? "homem" : pf.sexo === "F" ? "mulher" : "sexo não informado"}${M.ok ? `, ${M.idade} anos, ${pf.altura} cm, ${num(nuPesoAtual(), 1)} kg, IMC ${num(M.imc, 1)}` : ""}; atividade ${NU_ATIV[pf.atividade]?.[0] || "?"} (${NU_ATIV[pf.atividade]?.[2] || ""}). Alimentação ${NU_DIETA[d.prefs.dieta] || "onívora"}${d.prefs.evitar ? `; evita: ${d.prefs.evitar}` : ""}.`);
  L.push(`OBJETIVO: ${NU_OBJ[mt.objetivo] || "manter"}${+mt.pesoAlvo > 0 ? `, peso-alvo ${mt.pesoAlvo} kg` : ""}${mt.prazo ? ` até ${mt.prazo}` : ""}${mt.inicio ? ` (desde ${mt.inicio}${mt.pesoInicio ? `, com ${mt.pesoInicio} kg` : ""})` : ""}.`);
  L.push(M.ok ? `METAS (conta do app): TMB ${Math.round(M.bmr)} kcal (Mifflin-St Jeor); gasto ${Math.round(M.tdee)} kcal (fator ${M.fator}); ajuste ${pct(M.aj)}; calorias ${M.kcal} kcal; piso de segurança ${M.piso} kcal${M.pisoAplicado ? " (aplicado)" : ""}; proteína ${M.prot} g (${M.pkg} g/kg × ${num(M.ref, 1)} kg); carboidrato ${M.carb} g; gordura ${M.gord} g; fibras ${M.fibra} g; água ${M.agua} ml; ritmo esperado ${num(M.ritmo, 2)} kg/sem${M.manual ? "; METAS DEFINIDAS À MÃO pela pessoa" : ""}.${M.avisos.length ? ` Avisos: ${M.avisos.join(" ")}` : ""}` : `METAS: ainda não calculadas; falta no perfil: ${M.falta.join(", ")}.`);
  L.push(`PESO (30 dias): ${P.map(p => `${p.d.slice(5)} ${p.kg}`).join(", ") || "sem pesagens"}. Tendência 28 dias: ${tr ? `${num(tr.kgSem, 2)} kg/semana (${tr.n} pesagens)` : "insuficiente"}${pj?.data ? `; no ritmo atual chega ao alvo em ${pj.data}` : pj?.longe ? "; o peso vai no sentido contrário da meta" : ""}.${d.medidas.length ? ` Cintura: ${d.medidas.slice(-4).map(x => `${x.data.slice(5)} ${x.cintura} cm`).join(", ")}.` : ""}`);
  if (GR) L.push(`GASTO PELOS DADOS: ${Math.round(GR.tdee)} kcal/dia (registrou ${Math.round(GR.kcal)} kcal/dia em ${GR.dias} dias, peso ${num(GR.kgSem, 2)} kg/sem); fórmula: ${M.ok ? Math.round(M.tdee) : "?"} kcal.`);
  const T = nuTotais(addDays(TODAY, -13), TODAY);
  L.push(`ALIMENTAÇÃO (14 dias; kcal · proteína · carboidrato · gordura · água):\n${T.map(x => `- ${x.d}: ${x.n ? `${x.kcal} · ${x.p} · ${x.c} · ${x.f}${x.agua ? ` · ${x.agua} ml` : ""} (${x.n} itens)` : "sem registro"}`).join("\n")}`);
  L.push(`ADERÊNCIA (7 dias encerrados): ${A.dias} dias registrados; calorias dentro de ±10% em ${A.kcalOk ?? "?"}; proteína ≥ 90% em ${A.protOk ?? "?"}.`);
  const H = nuItens(TODAY); L.push(`HOJE: ${H.length ? NU_REF.map(([k, l]) => { const xs = H.filter(x => x.ref === k); return xs.length ? `${l}: ${xs.map(x => `${x.nome} ${x.qtd} g (${x.kcal} kcal)`).join(", ")}` : ""; }).filter(Boolean).join(" | ") : "nada registrado ainda"}.`);
  if (typeof trResumoCurto === "function") L.push(`TREINOS (do Personal): ${trResumoCurto()}`);
  if (d.planos.length) L.push(`PLANOS ALIMENTARES SALVOS: ${d.planos.slice(0, 5).map(x => `"${x.titulo}"`).join(", ")}.`);
  return L;
}
function nuPrompt(fallback) {
  const d = nuD(), mt = d.meta, M = nuMetas(), m = mget("nutri"), foco = NU_FOCO[mt.foco] || NU_FOCO.saude, modo = SD_COMP[mt.modo] ? mt.modo : "medio";
  const mem = [...m.mem.filter(x => x.fixo), ...m.mem.filter(x => !x.fixo).slice(-20)].map(x => `- [${x.tipo} · ${fmtD(iso(new Date(x.at)))}]${x.fixo ? " (fixa)" : ""} ${x.texto}`);
  const fb = fallback ? `\n\nFORMATO: responda normalmente. Para propor registros ou mudanças (a pessoa aprova), termine com um bloco exatamente assim (omita se não houver nada):\n\`\`\`atlas\n{"memorias":[{"tipo":"preferência","texto":"..."}],"acoes":[{"tipo":"registrar_refeicao","dados":{"data":"AAAA-MM-DD","refeicao":"almoco","itens":[{"nome":"...","gramas":150,"kcal":200,"proteina_g":10,"carboidrato_g":20,"gordura_g":5}]}}]}\n\`\`\`\nTipos de ação: registrar_refeicao, ajustar_metas {kcal, proteina_g, carboidrato_g, gordura_g, motivo}, definir_objetivo {objetivo, peso_alvo, prazo, compromisso, foco, motivo}, salvar_plano_alimentar {titulo, texto}.` : "";
  return `Você é o Nutri, nutricionista virtual (IA) dentro do app pessoal "Atlas da Vida": nutrição esportiva e clínica baseada em evidências. Você NÃO substitui um nutricionista ou médico.
CONFIGURAÇÃO ESCOLHIDA PELA PESSOA:
- Foco: ${foco[0]}: ${foco[1]}.
- Compromisso: ${SD_COMP[modo][0]}: ${NU_COMPTX[modo]}.
- Objetivo: ${NU_OBJ[mt.objetivo] || "manter"}.
LINHAS VERMELHAS (valem em qualquer foco e compromisso; a validação do app recusa o que passar delas):
- Nunca abaixo do piso de calorias (${M.ok ? M.piso + " kcal para esta pessoa" : "TMB, mín. 1.200 kcal mulheres e 1.500 homens"}); perda até ${pct(NU_RITMO.perder[modo], 2)} do peso por semana neste compromisso (nunca acima de 1%); ganho até ${pct(NU_RITMO.ganhar[modo], 2)}.
- IMC abaixo de 18,5: nada de déficit.
- Sem dietas extremas, jejuns prolongados, "detox", cortar grupos inteiros sem motivo médico, nem promessas rápidas. Suplementos só com evidência (creatina, whey, vitamina D se houver deficiência), sempre sugerindo confirmar com um profissional.
- Doença, remédios, gestação, alergias graves: recomende acompanhamento profissional antes de mudanças grandes.
- Sinais de relação difícil com a comida (culpa, compensação, vômito, laxantes, exercício para "pagar", muitos dias muito abaixo do piso): acolha sem julgamento, não reforce a restrição e sugira apoio profissional.
- Não faça diagnóstico.
COMO TRABALHAR:
- Baseie-se nos dados abaixo e cite números e datas. Não invente; se faltar dado, diga o que registrar no app.
- Seja breve (até ~180 palavras, salvo cardápios), com no máximo 3 ações, na exigência do compromisso. Português do Brasil.
- Refeição descrita em texto: use buscar_alimento para o que estiver na base e estime o resto com bom senso (diga que é estimativa); proponha com registrar_refeicao.
- Metas e objetivo: proponha com ajustar_metas ou definir_objetivo, explicando o porquê com os números (tendência do peso, gasto pelos dados, aderência).
- Foco esportivo: use os treinos para periodizar o carboidrato. Use recado para o Personal quando algo afetar o treino.
- Guarde na memória preferências, rotina e o que funcionou (frases curtas).

DADOS (hoje é ${fmtDL(TODAY)}, ${TODAY}):
${nuFacts().join("\n")}

MEMÓRIA:
${mem.join("\n") || "(vazia)"}${fb}`.slice(0, 120000);
}
function nuTools(live, T) {
  const note = (t, d) => { live.uso.push({ t, d }); aiNote("ferr", `${t}: ${trunc(d, 60)}`, live.ctx); paintLive(); };
  const prop = (tipo, inp, d) => { const r = sdProposta("nutri", live, tipo, inp); note(tipo, r.erro ? `recusada: ${trunc(r.erro, 70)}` : d); return r; };
  const out = [
    { name: "consultar_alimentacao", description: "Totais por dia (kcal, proteína, carboidrato, gordura, água, itens) dos últimos N dias (1–60), ou os itens de um dia específico (data AAAA-MM-DD).",
      inputSchema: { type: "object", properties: { dias: { type: "number" }, data: { type: "string" } } },
      execute: inp => { if (sdData(inp.data, null)) { const xs = nuItens(inp.data); note("consultar_alimentacao", `${inp.data} · ${plural(xs.length, "item", "itens")}`); return { data: inp.data, itens: xs.map(x => ({ refeicao: nuRefNome(x.ref), nome: x.nome, gramas: x.qtd, kcal: x.kcal, proteina_g: x.p, carboidrato_g: x.c, gordura_g: x.f })), total: nuSoma(xs) }; }
        const n = clamp(Math.round(+inp.dias || 14), 1, 60), T2 = nuTotais(addDays(TODAY, -n + 1), TODAY); note("consultar_alimentacao", `${n} dias`); return T2.map(x => ({ data: x.d, kcal: x.n ? x.kcal : null, proteina_g: x.n ? x.p : null, carboidrato_g: x.n ? x.c : null, gordura_g: x.n ? x.f : null, agua_ml: x.agua || null, itens: x.n })); } },
    { name: "tendencia_peso", description: "Pesagens dos últimos N dias (7–180), tendência de 28 dias em kg/semana, peso atual (média da última semana), meta e projeção, e o gasto real estimado pelos dados.",
      inputSchema: { type: "object", properties: { dias: { type: "number" } } },
      execute: inp => { const n = clamp(Math.round(+inp.dias || 60), 7, 180), tr = nuTendencia(), pj = nuProjecao(nuMetas()), GR = nuGastoReal(); note("tendencia_peso", `${n} dias`); return { pesagens: nuPesos(n).map(p => ({ data: p.d, kg: p.kg })), atual_kg: nuPesoAtual(), tendencia_kg_semana: tr ? Math.round(tr.kgSem * 100) / 100 : null, meta_kg: +nuD().meta.pesoAlvo || null, prazo: nuD().meta.prazo || null, projecao: pj?.data || (pj?.longe ? "afastando da meta" : null), gasto_real_kcal: GR ? Math.round(GR.tdee) : null }; } },
    { name: "buscar_alimento", description: "Busca na base de alimentos do app (português ou italiano) e em Meus alimentos. Devolve até 6 com kcal e macros por 100 g e a porção padrão. Use antes de estimar.",
      inputSchema: { type: "object", properties: { nome: { type: "string" } }, required: ["nome"] },
      execute: inp => { const q = norm(inp.nome), f0 = nuMatch(inp.nome), fs = [...(f0 ? [f0] : []), ...nuFoods().filter(f => f !== f0 && (f.al.some(a => a.includes(q) || q.includes(a)) || norm(f.nome).includes(q)))].slice(0, 6); note("buscar_alimento", `“${trunc(inp.nome, 30)}” · ${fs.length}`); return fs.map(f => ({ nome: f.nome, kcal_100g: f.kcal, proteina_100g: f.p, carboidrato_100g: f.c, gordura_100g: f.f, porcao_g: f.porcao, porcao: f.pnome, meu: !!f.fav })); } },
    { name: "registrar_refeicao", description: "Propõe registrar uma refeição. Itens da base: nome e gramas bastam. Fora da base: informe kcal e macros estimados (a quantidade inteira, não por 100 g). A pessoa aprova antes de entrar no registro.",
      inputSchema: { type: "object", properties: { data: { type: "string", description: "AAAA-MM-DD; hoje se omitido" }, refeicao: { type: "string", enum: NU_REF.map(x => x[0]) }, itens: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, gramas: { type: "number" }, kcal: { type: "number" }, proteina_g: { type: "number" }, carboidrato_g: { type: "number" }, gordura_g: { type: "number" } }, required: ["nome", "gramas"] } } }, required: ["refeicao", "itens"] },
      execute: inp => prop("registrar_refeicao", inp, `${nuRefNome(inp.refeicao)} · ${plural((inp.itens || []).length, "item", "itens")}`) },
    { name: "ajustar_metas", description: "Propõe metas diárias definidas à mão (substituem o cálculo): kcal, proteina_g, carboidrato_g, gordura_g, com o motivo. Validação: não abaixo do piso, nem acima de 25% do gasto, proteína de 0,8 a 2,5 g/kg, gordura de no mínimo 0,5 g/kg, ritmo seguro.",
      inputSchema: { type: "object", properties: { kcal: { type: "number" }, proteina_g: { type: "number" }, carboidrato_g: { type: "number" }, gordura_g: { type: "number" }, motivo: { type: "string" } }, required: ["motivo"] },
      execute: inp => prop("ajustar_metas", inp, `${inp.kcal ? inp.kcal + " kcal" : "macros"}: ${trunc(inp.motivo || "", 50)}`) },
    { name: "definir_objetivo", description: "Propõe mudar o objetivo (perder, manter, ganhar), o peso-alvo, o prazo, o compromisso (baixo, medio, alto) e o foco (saude, esportivo, shape, energia, qualidade). A validação recusa alvo com IMC abaixo de 18,5 e prazo que exija ritmo acima do seguro.",
      inputSchema: { type: "object", properties: { objetivo: { type: "string", enum: Object.keys(NU_OBJ) }, peso_alvo: { type: "number" }, prazo: { type: "string", description: "AAAA-MM-DD" }, compromisso: { type: "string", enum: Object.keys(SD_COMP) }, foco: { type: "string", enum: Object.keys(NU_FOCO) }, motivo: { type: "string" } }, required: ["objetivo", "motivo"] },
      execute: inp => prop("definir_objetivo", inp, `${NU_OBJ[inp.objetivo] || inp.objetivo}${inp.peso_alvo ? " · " + inp.peso_alvo + " kg" : ""}`) },
    { name: "salvar_plano_alimentar", description: "Propõe salvar um plano alimentar ou cardápio (texto em Markdown, com refeições, quantidades em gramas e o total de kcal e proteína) em Plano e perfil.",
      inputSchema: { type: "object", properties: { titulo: { type: "string" }, texto: { type: "string" } }, required: ["titulo", "texto"] },
      execute: inp => prop("salvar_plano_alimentar", inp, trunc(inp.titulo || "", 60)) },
    { name: "consultar_treinos", description: "Resumo dos treinos (academia e corrida) dos últimos N dias (1–60), do Personal: datas, duração, tipo, km.",
      inputSchema: { type: "object", properties: { dias: { type: "number" } } },
      execute: inp => { const n = clamp(Math.round(+inp.dias || 14), 1, 60); note("consultar_treinos", `${n} dias`); return typeof trDias === "function" ? trDias(n) : []; } },
    ...T.filter(x => x.name === "salvar_memoria" || x.name === "recado")];
  return out;
}
/* validação: é aqui que os limites de saúde valem de fato */
function nuValida(tipo, d) {
  if (tipo === "registrar_refeicao") {
    const data = sdData(d.data); if (!data || data > addDays(TODAY, 1)) return { erro: "data inválida (AAAA-MM-DD, até amanhã)" };
    const ref = NU_REF.find(x => x[0] === d.refeicao || x[2].test(norm(d.refeicao || "")))?.[0]; if (!ref) return { erro: "refeição inválida (cafe, almoco, lanche, jantar ou ceia)" };
    const its = Array.isArray(d.itens) ? d.itens : []; if (!its.length || its.length > 15) return { erro: "de 1 a 15 itens" };
    const out = its.map((x, i) => { const nome = String(x?.nome || "").trim().slice(0, 80); if (!nome) throw new Error(`item ${i + 1} sem nome`);
      const qtd = sdNum(x.gramas, 1, 3000); if (qtd == null || Number.isNaN(qtd)) throw new Error(`${nome}: gramas entre 1 e 3.000`);
      const f = nuMatch(nome); let kcal = sdNum(x.kcal, 0, 5000), p = sdNum(x.proteina_g, 0, 400), c = sdNum(x.carboidrato_g, 0, 800), g = sdNum(x.gordura_g, 0, 400);
      if ([kcal, p, c, g].some(v => Number.isNaN(v))) throw new Error(`${nome}: valores fora do plausível`);
      if (kcal == null) { if (!f) throw new Error(`${nome}: não está na base; informe kcal e macros estimados`); return { nome: f.nome, qtd: Math.round(qtd), kcal: Math.round(f.kcal * qtd / 100), p: r1(f.p * qtd / 100), c: r1(f.c * qtd / 100), f: r1(f.f * qtd / 100), base: f.id, est: false }; }
      p ??= 0; c ??= 0; g ??= 0; if (4 * p + 4 * c + 9 * g > kcal * 1.15 + 10) throw new Error(`${nome}: os macros dão mais calorias que o total`); if (kcal / qtd > 9.5) throw new Error(`${nome}: mais de 9 kcal por grama não existe`);
      return { nome, qtd: Math.round(qtd), kcal: Math.round(kcal), p: r1(p), c: r1(c), f: r1(g), base: "", est: true }; });
    return { dados: { data, ref, itens: out } };
  }
  const M = nuMetas();
  if (tipo === "ajustar_metas") {
    if (!M.ok) return { erro: `complete o perfil antes (falta: ${M.falta.join(", ")})` };
    const k = sdNum(d.kcal, 800, 6000), p = sdNum(d.proteina_g, 0, 400), c = sdNum(d.carboidrato_g, 0, 900), g = sdNum(d.gordura_g, 0, 400), peso = nuPesoAtual();
    if ([k, p, c, g].some(v => Number.isNaN(v))) return { erro: "valores fora do plausível" }; if ([k, p, c, g].every(v => v == null)) return { erro: "informe ao menos um valor" };
    if (k != null && k < M.piso) return { erro: `${k} kcal está abaixo do piso de segurança (${M.piso} kcal)` };
    if (k != null && k > M.tdee * 1.25) return { erro: `${k} kcal passa de 25% acima do gasto estimado (${Math.round(M.tdee)} kcal)` };
    if (k != null && M.obj === "perder" && (k - M.tdee) * 7 / 7700 < -.01 * peso) return { erro: `${k} kcal daria perda acima de 1% do peso por semana` };
    if (k != null && M.obj === "ganhar" && (k - M.tdee) * 7 / 7700 > .005 * peso) return { erro: `${k} kcal daria ganho acima de 0,5% do peso por semana` };
    if (p != null && (p < .8 * M.ref || p > 2.5 * M.ref)) return { erro: `proteína de ${p} g fora de 0,8 a 2,5 g/kg (${Math.round(.8 * M.ref)} a ${Math.round(2.5 * M.ref)} g)` };
    if (g != null && g < .5 * M.ref) return { erro: `gordura de ${g} g abaixo de 0,5 g/kg (${Math.round(.5 * M.ref)} g)` };
    if (k != null && p != null && c != null && g != null && Math.abs(4 * p + 4 * c + 9 * g - k) > k * .1) return { erro: `os macros somam ${Math.round(4 * p + 4 * c + 9 * g)} kcal, longe das ${k} kcal` };
    return { dados: { kcal: k, prot: p, carb: c, gord: g, motivo: String(d.motivo || "").slice(0, 300) } };
  }
  if (tipo === "definir_objetivo") {
    const obj = NU_OBJ[d.objetivo] ? d.objetivo : null; if (!obj) return { erro: "objetivo: perder, manter ou ganhar" };
    const modo = d.compromisso == null || d.compromisso === "" ? null : SD_COMP[d.compromisso] ? d.compromisso : NaN, foco = d.foco == null || d.foco === "" ? null : NU_FOCO[d.foco] ? d.foco : NaN;
    if (Number.isNaN(modo)) return { erro: "compromisso: baixo, medio ou alto" }; if (Number.isNaN(foco)) return { erro: "foco: saude, esportivo, shape, energia ou qualidade" };
    const alvo = sdNum(d.peso_alvo, 30, 300), prazo = d.prazo ? sdData(d.prazo, null) : null, peso = nuPesoAtual(), alt = +nuD().perfil.altura;
    if (Number.isNaN(alvo)) return { erro: "peso-alvo entre 30 e 300 kg" }; if (d.prazo && (!prazo || prazo <= TODAY)) return { erro: "prazo deve ser uma data futura" };
    if (alvo != null && alt > 0 && alvo / (alt / 100) ** 2 < 18.5) return { erro: `${alvo} kg dá IMC ${num(alvo / (alt / 100) ** 2, 1)}, abaixo de 18,5` };
    if (obj === "perder" && M.ok && M.imc < 18.5) return { erro: `IMC atual ${num(M.imc, 1)}: perder peso não é recomendado` };
    if (alvo != null && peso && obj === "perder" && alvo >= peso) return { erro: "para perder, o alvo precisa ser menor que o peso atual" };
    if (alvo != null && peso && obj === "ganhar" && alvo <= peso) return { erro: "para ganhar, o alvo precisa ser maior que o peso atual" };
    if (alvo != null && prazo && peso && obj !== "manter") { const nec = Math.abs(alvo - peso) / (diff(prazo, TODAY) / 7), mx = NU_RITMO[obj].alto * peso; if (nec > mx) return { erro: `o prazo pede ${num(nec, 2)} kg/semana, acima do seguro (${num(mx, 2)} kg/semana)` }; }
    return { dados: { objetivo: obj, pesoAlvo: alvo ?? "", prazo: prazo || "", modo, foco, motivo: String(d.motivo || "").slice(0, 300) } };
  }
  if (tipo === "salvar_plano_alimentar") {
    const titulo = String(d.titulo || "").trim().slice(0, 120), texto = String(d.texto || "").trim(); if (!titulo || !texto) return { erro: "título e texto" }; if (texto.length > 6000) return { erro: "texto longo demais (máx. 6.000 caracteres)" };
    return { dados: { titulo, texto } };
  }
  return { erro: "tipo desconhecido" };
}
function nuAplica(tipo, v) {
  const d = nuD();
  if (tipo === "registrar_refeicao") { for (const x of v.itens) (S.nutriLog ||= []).push({ id: uid(), data: v.data, ref: v.ref, nome: x.nome, qtd: x.qtd, kcal: x.kcal, p: x.p, c: x.c, f: x.f, base: x.base, est: x.est, fonte: "nutri", at: Date.now() }); return [`${nuRefNome(v.ref)} de ${fmtD(v.data)} (${sum(v.itens.map(x => x.kcal))} kcal)`, ["nutriLog"]]; }
  if (tipo === "ajustar_metas") { d.manual = Object.fromEntries(["kcal", "prot", "carb", "gord"].filter(k => v[k] != null).map(k => [k, v[k]])); return [`metas: ${[v.kcal && v.kcal + " kcal", v.prot != null && "P " + v.prot + " g", v.carb != null && "C " + v.carb + " g", v.gord != null && "G " + v.gord + " g"].filter(Boolean).join(" · ")}`, ["nutri"]]; }
  if (tipo === "definir_objetivo") { d.meta = { ...d.meta, objetivo: v.objetivo, pesoAlvo: v.pesoAlvo, prazo: v.prazo, ...(v.modo ? { modo: v.modo } : {}), ...(v.foco ? { foco: v.foco } : {}), inicio: TODAY, pesoInicio: nuPesoAtual() }; d.manual = {}; return [`${NU_OBJ[v.objetivo]}${v.pesoAlvo ? ` · ${v.pesoAlvo} kg` : ""}${v.prazo ? ` até ${fmtD(v.prazo)}` : ""}`, ["nutri"]]; }
  if (tipo === "salvar_plano_alimentar") { d.planos.unshift({ id: uid(), at: Date.now(), titulo: v.titulo, texto: v.texto }); d.planos = d.planos.slice(0, 12); return [v.titulo, ["nutri"]]; }
  return [null, []];
}
function nuResumo(p) {
  const d = p.raw || {}, T = (l, v) => v != null && v !== "" ? `<span><b>${l}</b> ${esc(v)}</span>` : "", v = nuValida(p.tipo, d).dados;
  if (p.tipo === "registrar_refeicao") { const its = v?.itens || []; return `<b class="ckpt">${esc(nuRefNome(v?.ref || d.refeicao))}${v?.data && v.data !== TODAY ? ` de ${fmtD(v.data)}` : ""}</b><ul class="nupl">${its.map(x => `<li>${esc(x.nome)} · ${x.qtd} g · <b>${x.kcal} kcal</b> <small class="muted">P ${x.p} · C ${x.c} · G ${x.f}${x.est ? " · estimado" : ""}</small></li>`).join("") || (d.itens || []).map(x => `<li>${esc(x.nome || "?")} · ${esc(x.gramas ?? "?")} g</li>`).join("")}</ul>${its.length ? `<div class="ckpf">${T("total", `${sum(its.map(x => x.kcal))} kcal · P ${r1(sum(its.map(x => x.p)))} g · C ${r1(sum(its.map(x => x.c)))} g · G ${r1(sum(its.map(x => x.f)))} g`)}</div>` : ""}`; }
  if (p.tipo === "ajustar_metas") { const M = nuMetas(); return `<div class="ckdiff">${[["kcal", "kcal", "kcal"], ["proteina_g", "prot", "proteína (g)"], ["carboidrato_g", "carb", "carboidrato (g)"], ["gordura_g", "gord", "gordura (g)"]].filter(([k]) => d[k] != null && d[k] !== "").map(([k, mk, l]) => `<span>${l}: <s>${M.ok ? M[mk] : "–"}</s> → <b>${esc(d[k])}</b></span>`).join("")}</div>${d.motivo ? `<p>${esc(d.motivo)}</p>` : ""}`; }
  if (p.tipo === "definir_objetivo") { const mt = nuD().meta; return `<div class="ckdiff"><span>objetivo: <s>${esc(NU_OBJ[mt.objetivo] || "–")}</s> → <b>${esc(NU_OBJ[d.objetivo] || d.objetivo || "")}</b></span>${d.peso_alvo ? `<span>alvo: <s>${esc(mt.pesoAlvo || "–")}</s> → <b>${esc(d.peso_alvo)} kg</b></span>` : ""}${d.prazo ? `<span>prazo: <b>${esc(fmtDY(d.prazo))}</b></span>` : ""}${d.compromisso ? `<span>compromisso: <b>${esc(SD_COMP[d.compromisso]?.[0] || d.compromisso)}</b></span>` : ""}${d.foco ? `<span>foco: <b>${esc(NU_FOCO[d.foco]?.[0] || d.foco)}</b></span>` : ""}</div>${d.motivo ? `<p>${esc(d.motivo)}</p>` : ""}`; }
  if (p.tipo === "salvar_plano_alimentar") return `<b class="ckpt">${esc(d.titulo || "")}</b><div class="mdx nuprev">${md(trunc(String(d.texto || ""), 600))}</div>`;
  return "";
}
SD_AG.nutri = { pt: { registrar_refeicao: ["Registrar refeição", "plus"], ajustar_metas: ["Ajustar metas", "target"], definir_objetivo: ["Definir objetivo", "flag"], salvar_plano_alimentar: ["Plano alimentar", "list"] }, valida: nuValida, aplica: nuAplica, resumo: nuResumo };
Object.assign(MENTOR_DEF, { nutri: { page: "saude", sub: "alimentacao", gate: "Saúde física", cor: "#5f9e57", ico: "apple", nome: "Nutri", papel: "nutricionista virtual (IA) de nutrição esportiva e clínica; não substitui nutricionista ou médico", arq: "um nutricionista virtual de nutrição esportiva e clínica, baseado em evidências, que mede antes de mudar e põe a saúde acima de qualquer meta",
  voz: "Claro e prático, com números do registro; adapta a exigência ao compromisso e nunca passa dos limites de saúde.",
  facts: () => nuFacts(), prompt: nuPrompt, tools: (live, T) => nuTools(live, T), intercept: t => sdIntercept("nutri", t), parseBlock: (b, live) => sdParseBlock("nutri", b, live) } });
if (!MIDS.includes("nutri")) MIDS.push("nutri");
Object.assign(USO_TXT, { consultar_alimentacao: ["table", "Consultou a alimentação"], tendencia_peso: ["pulse", "Olhou o peso"], buscar_alimento: ["search", "Buscou na base"], registrar_refeicao: ["plus", "Propôs refeição"], ajustar_metas: ["target", "Propôs metas"], definir_objetivo: ["flag", "Propôs objetivo"], salvar_plano_alimentar: ["list", "Propôs plano alimentar"], consultar_treinos: ["pulse", "Consultou os treinos"] });
