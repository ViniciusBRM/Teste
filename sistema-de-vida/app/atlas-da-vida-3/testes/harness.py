import asyncio, json, os, sys, base64, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent
HTML = (ROOT.parent.parent / "atlas-da-vida-3.html").read_text()   # testes/ -> atlas-da-vida-3/ -> app/
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
    if (window.__csFail > 0 && /Conselho|CONSELHO/.test(P)) { window.__csFail--; throw { code: window.__csFailCode || "upstream_error", message: "mock" }; }
    if (/TAREFA: RESUMO DO CONSELHO/.test(P)) { await emit("Resumo de teste: sono e gastos ligados; amizades em queda; o CEO quer proteger o sono."); return { text, truncated: false }; }
    if (/REUNIÃO DO CONSELHO DE ADMINISTRAÇÃO DA VIDA/.test(P)) { const nm = (P.match(/^Você é (?:o |a )?([^,]+),/) || [])[1] || "?"; window.__csSpk = (window.__csSpk || 0) + 1; if (window.__csSlow) await sleep(window.__csSlow);
      if (/MODO OBSERVADOR/.test(P) && !/se dirigiu a você/.test(P) && nm === "Mentor do Dinheiro" && !/FORMATO DO RELATÓRIO/.test(P)) { await emit("Os gastos com restaurantes sobem nas semanas de pouco sono. Mentor do Corpo, seus dados de sono confirmam isso?"); return { text, truncated: false }; }
      if (/se dirigiu a você/.test(P)) { await emit(`Réplica de teste de ${nm}: sim, nas semanas com menos de 7 h de sono.`); return { text, truncated: false }; }
      await emit(/FORMATO DO RELATÓRIO/.test(P) ? `**Estado:** relatório de teste de ${nm}. **Tendência:** → **Vitória:** uma. **Atenção:** outra.` : `Fala de teste de ${nm}: os dados do briefing mostram o que importa.`); return { text, truncated: false }; }
    if (/TAREFA: LENTES SOBRE UM DILEMA/.test(P)) { const vs = [...P.matchAll(/^- ([^(\n]+) \(/gm)].map(m => m[1].trim()).slice(0, 6); await emit(vs.map(v => `## ${v}\nLeitura de teste de ${v}.\n`).join("") + "## Onde se encontram\nNo cuidado com o que depende de você.\n## Onde divergem\nNo papel do esforço.\n## Uma ação para hoje\nEscrever a triagem.\n## Pergunta para levar\nO que você pode soltar?"); return { text, truncated: false }; }
    if (T.ajustar_modo && /na aba Psicologia/.test(P)) { window.__psiPrompt = P;
      if (/muda para direto/.test(P)) await T.ajustar_modo.execute({ modo: "direto", motivo: "pedido de teste" }, ctx);
      await T.anotar_padrao.execute({ nome: "Ruminação", tipo: "pensamento", descricao: "repassar conversas", evidencia: "apareceu em duas sessões" }, ctx);
      await T.levar_para_sessao.execute({ tema: "A cobrança depois das entregas (teste)" }, ctx);
      await T.sugerir_reflexao.execute({ pergunta: "De quem é a voz que cobra? (teste)" }, ctx);
      if (T.triagem_estoica && /triagem/i.test(P.split("PLANO ENTRE SESSÕES").pop())) await T.triagem_estoica.execute({ situacao: "Cliente respondeu seco (teste)", depende: "minha resposta", nao_depende: "o humor dele", acao: "responder com calma", virtude: "temperanca", levar_terapia: false }, ctx);
      await emit(`Resposta de teste do Terapeuta na forma ${(P.match(/FORMA AGORA: ([^ (]+)/) || [])[1]}.`); return { text, truncated: false }; }
    if (T.triagem_estoica && /Mestre do Pórtico/.test(P)) { window.__stoPrompt = P;
      await T.triagem_estoica.execute({ situacao: "Atraso da outra equipe (teste)", depende: "avisar o cliente", nao_depende: "o ritmo deles", acao: "mandar o cronograma", virtude: "coragem", levar_terapia: true }, ctx);
      await T.levar_para_terapia.execute({ tema: "Medo de decepcionar (teste)" }, ctx);
      await emit("O que depende de você é a sua resposta; o resto, solte. (teste)"); return { text, truncated: false }; }
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
    if (/Você é o (Nutri|Personal),/.test(P) && !opts.tools) { const nu = /Você é o Nutri/.test(P); await emit(nu ? "Sem ferramentas nesta visualização (teste): proponho o lanche no bloco." : "Sem ferramentas (teste): proponho a corrida no bloco.");
      await emit("\n```atlas\n" + JSON.stringify(nu ? { memorias: [{ tipo: "preferência", texto: "Fallback do Nutri: gosta de iogurte (teste)" }], acoes: [{ tipo: "registrar_refeicao", dados: { refeicao: "lanche", itens: [{ nome: "banana", gramas: 120 }] } }, { tipo: "ajustar_metas", dados: { kcal: 900, motivo: "abaixo do piso (teste)" } }] } : { acoes: [{ tipo: "registrar_corrida", dados: { km: 4, tempo: "24:00", tipo: "leve" } }] }) + "\n```"); return { text, truncated: false }; }
    if (T.registrar_refeicao && /Você é o Nutri,/.test(P)) { window.__nuPrompt = P; const hoje = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
      const r1 = await T.consultar_alimentacao.execute({ dias: 7 }, ctx); window.__calls.push({ kind: "tool", name: "consultar_alimentacao", r: r1 });
      const r2 = await T.tendencia_peso.execute({ dias: 30 }, ctx); window.__calls.push({ kind: "tool", name: "tendencia_peso", r: r2 });
      const r3 = await T.buscar_alimento.execute({ nome: "pizza" }, ctx); window.__calls.push({ kind: "tool", name: "buscar_alimento", r: r3 });
      const bad = await T.ajustar_metas.execute({ kcal: 1100, motivo: "abaixo do piso (teste)" }, ctx); window.__calls.push({ kind: "tool", name: "metas_bad", r: bad });
      const ok1 = await T.registrar_refeicao.execute({ data: hoje, refeicao: "jantar", itens: [{ nome: "Pizza margherita", gramas: 300 }, { nome: "Tiramisù da cantina", gramas: 120, kcal: 360, proteina_g: 6, carboidrato_g: 38, gordura_g: 20 }] }, ctx); window.__calls.push({ kind: "tool", name: "refeicao_ok", r: ok1 });
      const ok2 = await T.ajustar_metas.execute({ kcal: 2200, proteina_g: 160, carboidrato_g: 255, gordura_g: 62, motivo: "o peso desceu devagar com 2.300 kcal (teste)" }, ctx); window.__calls.push({ kind: "tool", name: "metas_ok", r: ok2 });
      if (T.consultar_treinos) { const r4 = await T.consultar_treinos.execute({ dias: 7 }, ctx); window.__calls.push({ kind: "tool", name: "nu_treinos", r: r4 }); }
      await emit("Na média de 7 dias você ficou perto da meta (teste). Deixei o jantar e um ajuste de metas como propostas.");
      return { text, truncated: false }; }
    if (T.criar_ficha && /Você é o Personal,/.test(P)) { window.__trPrompt = P; const hoje = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
      const r1 = await T.progresso_exercicio.execute({ exercicio: "supino" }, ctx); window.__calls.push({ kind: "tool", name: "progresso_exercicio", r: r1 });
      const r2 = await T.volume_semanal.execute({ semanas: 2 }, ctx); window.__calls.push({ kind: "tool", name: "volume_semanal", r: r2 });
      const r3 = await T.listar_exercicios.execute({ grupo: "gluteos" }, ctx); window.__calls.push({ kind: "tool", name: "listar_exercicios", r: r3 });
      const r5 = await T.consultar_treinos.execute({ dias: 14 }, ctx); window.__calls.push({ kind: "tool", name: "consultar_treinos", r: r5 });
      const b1 = await T.criar_ficha.execute({ nome: "Ficha pesada (teste)", exercicios: [{ exercicio: "supino", series: 4, reps: "6-8", carga_kg: 200 }] }, ctx); window.__calls.push({ kind: "tool", name: "ficha_bad", r: b1 });
      const b2 = await T.planejar_corrida.execute({ objetivo: "Maratona já (teste)", semanas: [{ sessoes: [{ dia: "dom", tipo: "longo", km: 30 }] }] }, ctx); window.__calls.push({ kind: "tool", name: "plano_bad", r: b2 });
      const o1 = await T.criar_ficha.execute({ nome: "Glúteos e core (teste)", exercicios: [{ exercicio: "hipthrust", series: 4, reps: "8-12", carga_kg: 60, descanso_s: 120 }, { exercicio: "bulgaro", series: 3, reps: "8-12", carga_kg: 12 }, { exercicio: "prancha", series: 3, reps: "30-45" }] }, ctx); window.__calls.push({ kind: "tool", name: "ficha_ok", r: o1 });
      const o2 = await T.registrar_corrida.execute({ data: hoje, km: 6.2, tempo: "36:10", tipo: "leve", fc_media: 146, rpe: 4 }, ctx); window.__calls.push({ kind: "tool", name: "corrida_ok", r: o2 });
      await emit("Revisei os treinos (teste): o supino está pronto para subir. Propus uma ficha de glúteos e registrei a corrida de hoje.");
      return { text, truncated: false }; }
    if (T.criar_tarefa && /Cockpit de Trabalho/.test(P)) { window.__ckPrompt = P; const dday = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
      const r1 = await T.listar_tarefas.execute({ responsavel: "eu" }, ctx); window.__calls.push({ kind: "tool", name: "listar_tarefas", n: r1.length });
      if (T.sugerir_delegacao) { const r2 = await T.sugerir_delegacao.execute({ tarefa: "T13" }, ctx); window.__calls.push({ kind: "tool", name: "sugerir_delegacao", r: r2 }); }
      const bad = await T.criar_tarefa.execute({ titulo: "Tarefa inválida", responsavel: "Fulano Inexistente", prazo: "2030-01-01", esforco_h: 2 }, ctx); window.__calls.push({ kind: "tool", name: "criar_bad", r: bad });
      await T.criar_tarefa.execute({ titulo: "Checklist verifiche idrauliche (teste)", projeto: "Variante SP 23", responsavel: "Luca", prazo: dday(9), esforco_h: 3, prioridade: "alta", impacto: "alto", tags: ["Idraulica"], depende_de: ["T3"] }, ctx);
      await T.atualizar_tarefa.execute({ tarefa: "T13", responsavel: "Elena", motivo: "delegar (teste)" }, ctx);
      await T.registrar_risco.execute({ descricao: "Variante non formalizzata (teste)", probabilidade: 4, impacto: 4, gatilho: "ordine scritto assente", mitigacao: "chiedere ordine di servizio", dono: "eu" }, ctx);
      await T.propor_solucao.execute({ problema: "P2", solucoes: [{ titulo: "Rinnovare la licenza (teste)", pros: "rapido", contras: "costo", esforco_h: 1 }, { titulo: "Licenza flottante (teste)", pros: "condivisa", contras: "attese", esforco_h: 2 }] }, ctx);
      await emit("**Alertas:** T10 vencida e atraso em cascata a partir de T2.\n\n1. Nova tarefa para Luca\n2. Delegar T13 a Elena\n3. Registrar o risco da variante\n4. Soluções para P2\n\n**Próximos passos:** aprove as propostas (teste).");
      return { text, truncated: false }; }
    if (/TAREFA: (BRIEFING DO DIA|WEEKLY REVIEW|RAPPORTO MENSILE|RAPPORTO DI PERIODO|VERBALE DI RIUNIONE|E-MAIL AO CLIENTE|AGGIORNAMENTO|RICHIESTA)/.test(P)) { window.__ckGerPrompt = P; await emit(/RAPPORTO/.test(P) ? "# Rapporto " + (/DI PERIODO/.test(P) ? "di periodo" : "mensile") + " (test)\n\n| Progetto | Stato |\n|---|---|\n| Variante | in corso |\n\nProssimi passi: test." : /VERBALE/.test(P) ? "# Verbale di riunione (test)\n\nPartecipanti: test." : "Testo di prova in italiano (test)."); return { text, truncated: false }; }
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
    if (/TAREFA: INSIGHTS DO DASHBOARD/.test(P)) { window.__ckInsPrompt = P; return { insights: [
      { titulo: "No prazo da Giulia em queda (test)", texto: "O % no prazo caiu nas últimas 3 semanas (test).", fontes: ["Comparativo por pessoa"], acao: { tipo: "registrar_risco", dados: { descricao: "Sobrecarga da Giulia no PFTE (test)", probabilidade: 3, impacto: 4, gatilho: "novo atraso", dono: "Andrea", mitigacao: "passar uma tarefa para o Luca" } } },
      { titulo: "Escopo subindo (test)", texto: "Mais eventos de escopo que no período anterior (test).", fontes: ["Diário de bordo"], acao: { tipo: "registrar_evento", dados: { texto: "Tendência de aumento de escopo (test)", tipo: "escopo" } } },
      { titulo: "Ação inválida (test)", texto: "A ação desta não passa na validação (test).", fontes: [], acao: { tipo: "criar_tarefa", dados: { titulo: "" } } },
      { titulo: "Sem ação (test)", texto: "Só a leitura (test).", fontes: ["KPIs"], acao: null }] }; }
    if (/Conselho|CONSELHO|Intermediador/.test(P)) {
      if (window.__csFail > 0) { window.__csFail--; throw { code: window.__csFailCode || "upstream_error", message: "mock" }; }
      if (window.__csBad > 0) { window.__csBad--; if (window.__csBadThrow) throw { code: "invalid_json", message: "mock", text: "não é json" }; return { fase: "XYZ" }; }
      if (/TAREFA: ATA DO CONSELHO/.test(P)) { const prev = (P.match(/EM ABERTO \(id: ação\): (\S+?):/) || [])[1]; const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
        return { insights: ["Sono e humor andam juntos.", "Restaurantes sobem com o cansaço.", "Amizades sem iniciativa."], decisoes: ["Proteger o sono antes das entregas."], acoes: [{ area: "Finanças", acao: "Cozinhar no domingo", prazo: d(7), criterio: "2 semanas sem jantar fora por cansaço" }, { area: "Saúde física", acao: "Dormir até 23h30", prazo: d(14), criterio: "sono médio de 7 h" }, { area: "Amizades & social", acao: "Convidar um amigo", prazo: d(10), criterio: "1 encontro marcado" }, { area: "Inventada", acao: "Ação de área desconhecida", prazo: "ontem", criterio: "" }],
          notas: { "Saúde física": { nota: 7, justificativa: "sono médio 7 h" }, "Finanças": { nota: 12, justificativa: "fora da escala" }, "Área falsa": { nota: 5, justificativa: "x" }, geral: 6.5 }, pontos_atencao: ["Amizades"], pergunta_reflexao: "O que você está adiando?", transcricao_resumida: "Sessão simulada.", ...(/MODO OBSERVADOR/.test(P) ? { propostas: [{ texto: "Proteger o sono nas semanas de entrega", area: "Saúde física", tradeoff: "menos horas de trabalho à noite" }, { texto: "Teto de restaurantes ligado ao sono", area: "Finanças", tradeoff: "cozinhar no domingo" }] } : {}), revisao_acoes: prev ? [{ id: prev, status: "feita" }, { id: "naoexiste", status: "feita" }] : [] }; }
      if (/Você é o Intermediador/.test(P)) {
        const ORD = ["REVISAO_ATA", "ABERTURA", "RELATORIOS", "CRUZAMENTO", "DEBATE", "CONTEMPLACAO", "CONFLITOS", "PREVISOES", "DELIBERACOES", "ATA"];
        const PL = window.__csPlan || { REVISAO_ATA: ["fin", "CEO"], ABERTURA: ["CEO"], RELATORIOS: ["fis"], CRUZAMENTO: ["fis", "men"], DEBATE: ["fin", "CEO", "fin"], CONTEMPLACAO: ["CEO"], CONFLITOS: ["CEO"], PREVISOES: ["fin"], DELIBERACOES: ["CEO"] };
        const F = (P.match(/FASE ATUAL: (\w+)/) || [])[1]; window.__csm ||= {}; const c = window.__csm[F] || 0; window.__csIntN = (window.__csIntN || 0) + 1;
        if (c < (PL[F] || []).length) { window.__csm[F] = c + 1; return { fase: F, proximo: PL[F][c], pergunta: `Pergunta de teste (${F} ${c + 1}) para ${PL[F][c]}`, motivo: "roteiro do teste" }; }
        const nx = ORD[ORD.indexOf(F) + 1]; if (nx === "ATA" || !nx) return { fase: F, proximo: "FIM", pergunta: "Encerramos.", motivo: "fim" };
        window.__csm[nx] = (window.__csm[nx] || 0) + 1; return { fase: nx, proximo: (PL[nx] || ["CEO"])[0], pergunta: `Abrindo ${nx}`, motivo: "próxima fase" }; }
    }
    if (/TAREFA: EXTRAIR DO DIÁRIO DE BORDO/.test(P)) { window.__ckXtrPrompt = P; const d = new Date(); d.setDate(d.getDate() + 4); return { tipo: "escopo", tarefas: [{ titulo: "Rivedere il drenaggio al km 3 (IA)", responsavel: "Giulia", prazo: d.toISOString().slice(0, 10), esforco_h: 6, tags: ["Idraulica"], prioridade: "alta" }, { titulo: "Pessoa inventada (IA)", responsavel: "Ninguém", prazo: "ontem" }], riscos: [{ descricao: "Variante non formalizzata (IA)", probabilidade: 4, impacto: 4, gatilho: "nessun ordine scritto", mitigacao: "richiedere l'ordine di servizio" }], decisoes: [{ titulo: "Usare il DTM regionale (IA)", decisao: "Usare il DTM regionale", justificativa: "dati più recenti" }], problemas: [] }; }
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
  if (!cfg.realBoot) window.__atlasDemo = true;
  const caps = { db, user, sample, mcp, downloads };
  if (!cfg.none) window.claude = { use: async n => (cfg.off || []).includes(n) ? null : caps[n] || null };
})();
"""

# Relógio fixo: os testes não dependem do dia em que rodam. Só Date é deslocado (os timers seguem reais).
# ATLAS_NOW muda o padrão; cfg {"now": "2026-10-10T10:00:00"} fixa outro instante; cfg {"now": None} usa o relógio real.
NOW = os.environ.get("ATLAS_NOW", "2026-10-09T10:00:00")  # sexta-feira, dia útil no meio do mês (os dados de exemplo saem desta data)
TODAY_ISO = NOW[:10]
CLOCK = r"""
(() => {
  const cfg = window.__MOCKCFG || {}, at = cfg.now === undefined ? "%s" : cfg.now;
  if (at === null) return;
  const RD = Date; let off = RD.parse(at) - RD.now();
  function FD(...a) { if (!new.target) return new RD(RD.now() + off).toString(); return a.length ? new RD(...a) : new RD(RD.now() + off); }
  FD.prototype = RD.prototype; Object.setPrototypeOf(FD, RD);
  FD.now = () => RD.now() + off; FD.parse = RD.parse; FD.UTC = RD.UTC;
  window.Date = FD;
  window.__clock = { shift: ms => { off += ms; }, set: s => { off = RD.parse(s) - RD.now(); } };
})();
""" % NOW
MOCK = CLOCK + MOCK

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

PAGES = ["admin","psi","psi.sessoes","psi.processos","psi.entre","psi.padroes","psi.terapeuta","jornada.filosofia","jornada.jardim","rotina.dia","rotina.semana","rotina.mes","mapa","idiomas","fin.futuro","fin.vida","casa.limpeza","casa.compras","casa.contas","casa.docs","carreira.caderno","carreira.rede","painel","carreira.portfolio","carreira.decisoes","carreira.mercado","jornada.praticas","lazer.inicio","lazer.leitura","lazer.filmes","lazer.jogos","lazer.viagens","lazer.cafe","lazer.aviacao","lazer.estudos","lazer.existencial","carreira.panorama","carreira.avaliacao","carreira.objetivos","carreira.geotecnia","carreira.plano","carreira.biblioteca","jornada.inicio","jornada.espiritismo","jornada.meditacao","jornada.taoismo","jornada.budismo","jornada.confluencias","jornada.bussola","jornada.exame","jornada.decidir","jornada.caminhos","jornada.navegante","semana","radar","exp","capitulos","capitulos.livro","dupla","dupla.orcamento","dupla.metas","privacidade","diario.perguntar",'visao', 'hoje', 'diario', 'diario.cal', 'diario.analise', 'mentores', 'mentor.fin', 'mentor.conselho', 'cruz', 'fin.rel', 'fin.lanc', 'fin.orc', 'saude.rel', 'saude.checkin', 'hab.rel', 'hab.marcar', 'metas.rel', 'metas.lista', 'metas.tarefas', 'pessoas.rel', 'pessoas.lista', 'pessoas.contatos', 'cresc.rel', 'cresc.aprend', 'cresc.lazer', 'casa', 'roda', 'dados', 'dados.saude', 'dados.diario', 'integ', 'ajustes', 'fin.diario', 'saude.diario', 'hab.diario', 'metas.diario', 'pessoas.diario', 'cresc.diario', 'casa.diario', 'roda.diario', 'roda.roda', 'casa.painel']
