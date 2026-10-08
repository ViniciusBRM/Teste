# Atlas da Vida 3 · código-fonte

O app é um arquivo só, `../atlas-da-vida-3.html`, montado a partir dos módulos em `src/`. O Atlas da Vida original
(`../atlas-da-vida.html`) e o Atlas da Vida 2 (`../atlas-da-vida-2.html`) continuam separados e não são tocados por este build.

- `python3 build.py` monta o HTML e, se o Node estiver instalado, confere a sintaxe do JavaScript.
- `src/00-head.html` tem o esqueleto e os estilos; os módulos `01` a `48` entram na ordem definida no `build.py` (`24-jornada.js` é a Jornada existencial, com a Bússola moral dentro; `25-carreira.js` é o hub de Carreira; `26-lazer.js` é o Lazer, com oito divisões e seus mentores; `27-painel.js` é o Painel do dia; `28-capas.js` as capas, missões, manuais e o Mapa do Atlas; `29-hoje2.js` o Hoje; `30-casa.js` a Casa; `31-futuro.js` Futuro financeiro e Itália & Brasil; `32-idiomas.js` Idiomas; `33-carreira2.js` Caderno técnico e Rede profissional; `34-exemplo.js` o modo exemplo; `35-painel2.js` as demais abas no Painel do dia; `36-gcal.js` o Google Calendar; `37-rotina.js` a Rotina em blocos de 30 minutos; `38-jardim.js` o jardim interior da Saúde espiritual; `39-roteiro.js` o roteiro de áudio do Painel do dia; `40-secretario.js` o Secretário da Vida, a janela flutuante que junta as abas; `41-conselho.js` a Administração Pessoal, o Conselho de Administração da vida; `42-filosofia.js` a Filosofia (estoicismo) dentro da Jornada; `43-psique.js` a aba Psicologia e o Terapeuta; `44-cockpit-config.js` a configuração versionada do agente PMO; `45-cockpit.js` o motor do Cockpit de Trabalho (calendário de dias úteis, caminho crítico, prioridade, carga, delegação, alertas, propostas e ferramentas do agente); `46-cockpit-ui.js` as telas de tarefas, equipe e contexto; `47-cockpit-reg.js` riscos, problemas, diário de bordo, decisões, lições e reuniões; `48-cockpit-rel.js` Gantt, tracker BIM, elaborati, briefing, relatórios, métricas, blocos de foco e o exemplo).

## Administração Pessoal (o Conselho)

Os mentores das áreas se reúnem como diretores da vida da pessoa; o Intermediador conduz; a pessoa é o CEO e decide.

**Como usar**
1. Abra **Administração Pessoal** no menu, escolha o tipo (ordinária, trimestral, anual, extraordinária) e, se quiser, um foco. Toque em **Iniciar sessão**.
2. O Atlas monta um briefing de até ~300 palavras por área, sem IA, a partir dos registros, da memória e do plano de cada mentor.
3. O Intermediador decide cada turno em JSON. Quando ele fala com você, a sessão pausa: responda no campo de baixo (Enter envia). Pelo mesmo campo você **intervém** a qualquer momento.
4. **Pausar**, **Pular fase** e **Encerrar e gerar ata** ficam no topo. Uma sessão interrompida (pausa, falha ou página fechada) continua de onde parou.
5. A ata traz insights, decisões, 1 a 5 ações (área, prazo, critério), notas 0–10 com justificativa ao lado do placar dos dados, pontos de atenção e uma pergunta de reflexão. As ações aparecem no topo das abas das áreas para marcar como feitas e entram na memória do mentor responsável.
6. **Modo observador** (marque ao iniciar): os diretores discutem o tema entre si e a reunião segue sem esperar por você. O Intermediador não pode chamá-lo; quem é citado pelo nome responde direto (até `maxReplicas` réplicas seguidas). Entre na discussão pelo campo de baixo quando quiser; a reunião continua depois. No fim, a ata traz propostas de definição e ações propostas, que só valem quando você as aprova (painel "Aguardando sua aprovação"); ao aprovar, a ação entra na aba da área e na memória do mentor.
7. Um alerta grave do Radar ou uma queda forte do placar de uma área mostra a sugestão de sessão extraordinária do mentor daquela área. Ela só começa quando você toca em Iniciar.

**Parâmetros (`conselhoConfig` em `src/41-conselho.js`; os marcados com * também se ajustam na própria aba)**

| Parâmetro | Padrão | O que faz |
|---|---|---|
| `fases` | 10 fases | a máquina de estados, de `REVISAO_ATA` a `ATA` |
| `diretores` | 11 áreas + Bússola | quem fala nos relatórios |
| `convidados` | 4 pilares da Jornada + 7 do Lazer | chamados quando o tema toca neles |
| `maxTurnos` * | 40 | turnos por sessão; perto do fim o código leva às deliberações |
| `maxFalasPorFase` * | 3 | falas de cada mentor por fase |
| `palavrasPorFala` * | 150 | tamanho pedido a cada fala (cortada em 1,4×) |
| `resumoACada` * | 5 | turnos entre atualizações do resumo corrente |
| `palavrasBriefing` * | 300 | tamanho máximo de cada briefing |
| `relatoriosEmSequencia` * | sim | relatórios em ordem, sem uma chamada do Intermediador antes de cada diretor |
| `esperaMs` | 2000, 4000 | esperas das novas tentativas, só para falha passageira (`upstream_error`) |
| `tierIntermediador`, `tierMentor`, `tierResumo`, `tierAta` | default, default, quick, complex | nível do modelo de cada chamada |
| `cadencia` * | semanal | quando a próxima ordinária fica disponível |
| `minAcoes`, `maxAcoes` | 1, 5 | ações exigidas na ata |
| `maxReplicas` | 2 | modo observador: réplicas diretas seguidas entre diretores, sem o Intermediador no meio |

## Cockpit de Trabalho (o PMO)

Gestão do trabalho de engenharia com um agente PMO que lê tudo e só **propõe**: nada é gravado sem aprovação.

**Configuração do agente:** `src/44-cockpit-config.js` (`CK_AGENTE`) é o system prompt fixo e versionado (identidade, comportamento, quando agir e quando perguntar, ferramentas, memória, linhas vermelhas, normas). O **contexto da pessoa** (nome, funções, equipe) não está no código: é preenchido em Cockpit → Contexto e fica no banco privado. A aba Contexto mostra o prompt montado.

**Como usar**
1. Cockpit → **Contexto**: perfil, equipe (nível, foco, horas por semana para tarefas), projetos e marcos; jornada, padroeiro e folgas (dias úteis).
2. **Alt+Shift+N** em qualquer aba: `t:` tarefa, `r:` risco, `p:` problema, `d:` decisão, sem prefixo = diário de bordo; marcadores `@pessoa #tag 8h !alta sex|12/11 [projeto]`.
3. **Hoje** (briefing, alertas, prioridades, blocos de foco), **Semana** (prazos, capacidade, weekly review), **Mês**, **Kanban** (arrastar), **Lista** (e matriz de Eisenhower), **Gantt** (CPM em dias úteis, folgas, cascata), **Riscos**, **Problemas**, **Equipe** (carga, delegação, PDI, 1:1), **Diário de bordo**, **Decisões**, **Tracker BIM**, **Entregas** (elaborati), **Reuniões**, **Relatórios** (italiano), **Lições**, **Métricas**.
4. **PMO** no painel lateral: cada mensagem leva o estado inteiro com códigos (T12, R3, P2…). As ferramentas de escrita (`criar_tarefa`, `atualizar_tarefa`, `registrar_risco`, `registrar_problema`, `propor_solucao`, `registrar_evento`, `registrar_decisao`) criam cartões; aprove com o botão ou escrevendo `ok`, `aprova 1 e 3`, `não`. As de leitura (`listar_tarefas`, `sugerir_delegacao`, `calcular_caminho_critico`, `gerar_briefing`, `gerar_relatorio`) respondem na hora.

## Filosofia e Psicologia

- **Filosofia** (Jornada → Filosofia): o estoicismo tecido no que já existe. As quatro virtudes cardeais são lidas nos exames da noite (os 17 valores da Bússola agrupados em sabedoria, justiça, coragem e temperança); a triagem do controle parte de decisões da Bússola, registros e padrões da Psicologia, tarefas atrasadas, alertas e dúvidas dos pilares; as lentes mostram o mesmo dilema pelo estoicismo, pelos quatro pilares e pela psicoterapia; o Mestre do Pórtico é o mentor, com memória.
- **Psicologia**: sessões (temas, insights, padrões, combinado, humor antes e depois), processos com linha do tempo, entre sessões (pergunta do dia, registro de pensamento, livre), padrões com contagem e o exercício estoico e o valor da Bússola que conversam com cada um, e a pauta da próxima sessão (com sugestões do Atlas).
- **O Terapeuta**: agente com memória que muda de forma (profundo, escuta, direto, acolhimento, socrático). Em Automático, ele lê os sinais do que você escreve; uma forma tocada fica fixa. Não substitui a terapia e tem protocolo de segurança.
- **Fios**: um registro de pensamento vira triagem estoica; uma triagem pode ir para a pauta da terapia; os padrões aparecem na Filosofia; sessões e processos se ligam a pilares e valores; os mentores da Jornada e o Conselho leem um resumo (nada marcado como só seu, e nada se a Saúde mental estiver fora da IA).

## Testes (Playwright + Chromium)

Rode de dentro de `testes/`, depois do build. Cada script imprime `PASS`/`FAIL` por verificação e o total no fim.

| Script | O que cobre |
|---|---|
| `lab1.py` | privacidade (cofre, sem-IA, registro de leitura), captura sem atrito, experimentos A/B |
| `lab2.py` | radar (contra cálculo independente), fechamento semanal, capítulos e livro em PDF, busca por significado |
| `lab3.py` | espaço a dois (duas pessoas), agenda .ics (recorrências contra a `python-dateutil`), Apple Health, Google Fit, Notion, extrato que aprende |
| `lab4.py` | bússola moral: valores, foco, exame da noite (índice conferido à parte), decisões com revisita, caminhos, Hoje |
| `lab22.py` | Cockpit (1/2): as 19 visões, dias úteis italianos (Páscoa, Pasquetta, padroeiro), CPM com folgas, cascata e o caminho que define o fim, alertas, Eisenhower, entrada rápida, Kanban com arrastar, ciclo recusado, delegação, PDI, 1:1 que vira tarefa; o PMO: prompt da configuração + contexto + estado, nada muda antes da aprovação, “aprova 1 e 3”, botão, “não”, privacidade, celular |
| `lab23.py` | Cockpit (2/2): diário de bordo com extração local e pela IA, riscos (mapa, sugestões, mitigação), problemas com soluções convertidas em tarefas, lições, decisões, Gantt com tabela, clash, revisão de elaborati, relatório mensal em italiano (exportação e PMO), blocos de foco, PMO sem ferramentas, persistência no banco |
| `lab21.py` | Filosofia e Psicologia como um sistema: virtudes conferidas à parte nos exames, triagem do controle a partir de decisões, registros e padrões (e para a pauta da terapia, com desfazer), lentes das tradições, Mestre do Pórtico e Terapeuta com memória e ferramentas que cruzam as abas, as cinco formas de conversa detectadas ou fixadas, sessões, processos, padrões, privacidade, Conselho, celular |
| `lab20.py` | mandala e jardim: pétalas no lugar depois de abrir e fechar a mandala ampliada e trocar as camadas (também simulando o Safari), nenhum elemento SVG com atributo transform animado por CSS, jardim numa paleta só, esboço da composição inteira desde o começo, o qi (pérola no rio, ondas e balanços) num ciclo de 24 s, nada disso com menos movimento |
| `lab19.py` | Conselho em modo observador: a reunião segue sem esperar o CEO (o Intermediador não pode chamá-lo), réplicas diretas de quem é citado pelo nome, o CEO entra quando quiser, ata com propostas e ações propostas que só valem depois de aprovadas; ícones dos cartões dos mentores centralizados |
| `lab18.py` | Administração Pessoal: sessão simulada com dados de exemplo pelas 10 fases, Intermediador só em JSON (nova tentativa e fallback), diretores com o próprio prompt e memória, briefings de até 300 palavras, pausa para o CEO, intervenção, limites de falas, resumo corrente, falha da IA sem perder o estado, pular fase, encerrar, ata validada que vira memória e aparece nas abas, área sem dados, setor privado, retomada depois de recarregar, celular |
| `lab17.py` | Secretário da Vida: janela flutuante (abrir, arrastar, redimensionar, guardar posição), Agora consolidado de várias abas, ações com confirmação em contas, modos e perfis editáveis, lembretes por texto e voz (sem hora ele pergunta), aviso na hora, conflitos rotina × agenda e dia sobrecarregado para a pessoa decidir, conversa com ferramentas (ver aba, consultar mentor só para informação, propor, levantar conflito), privacidade, sem IA, celular |
| `lab16.py` | roteiro de áudio do Painel do dia: 13 blocos com frases-modelo pessoais, o roteiro falado preenche todas as abas (inclui tarefas concluídas, casa, contas sem gasto em dobro, blocos da rotina e exame da Bússola), um bloco por vez, copiar e baixar |
| `lab15.py` | saúde espiritual: jardim (árvores, rio, folha que não guarda texto, pedras, tábuas, templo, caminhos, noite), camadas e explorador da mandala, respiração, camadas, agulha e sorteio da bússola |
| `lab14.py` | rotina: dia, semana e mês sincronizados, meias horas, criar tocando e arrastando, repetições e exceções, sobreposição, agenda junto, Idiomas e Hoje |
| `lab13.py` | painel com todas as abas, feed do dia pelo banco, mandala e bússola grandes, Google Calendar (leitura em páginas, blocos de estudo, erros) |
| `lab12.py` | modo exemplo: liga e desliga sem tocar nos dados reais, nada gravado, desfazer preservado |
| `lab11.py` | redesenho: banco congelado, capas e manuais, Hoje com e sem internet, Casa (vencimentos, compras, limpeza), TFR/IRPEF/reserva conferidos à parte, câmbio, plano de idiomas com a Agenda, caderno e rede |
| `lab10.py` | painel do dia: números falados e formatos aceitos, validação ao vivo, obrigatórios, texto que preenche os campos, voz simulada (Web Speech API) e o caminho sem ela, revisão com substituições e repetidos, gravação nas abas e desfazer |
| `lab9.py` | aprofundamento: portfólio como evidência, CV, matriz de decisão e sensibilidade, mercado (mediana, percentil, TFR) e dossiê; programas guiados, sessões de prática como métrica nos Cruzamentos, conceitos e histórico das estações |
| `lab8.py` | lazer: oito divisões, gostos e o que evitar no mentor, livros em Aprendizado, viagem que vira projeto, café (proporção, perda e DTR conferidos à parte), voos, estudos, nível da conversa e as ferramentas dos mentores |
| `lab7.py` | hub de carreira: aderência às trilhas conferida à parte, avaliação, objetivos que viram metas, ações que viram tarefas e projetos em Finanças, geotecnia progressiva, biblioteca; se existir `../ft/docs2`, o perfil gravado |
| `lab6.py` | jornada existencial: estações, reflexões (e as privadas fora da IA), práticas, lua do pilar, mentores com `recomendar`, círculo, a Bússola dentro da aba e o Navegante |
| `lab5.py` | finanças: projetos e aquisições (parcela pela fórmula Price, alertas, aportes, mentor) e, se existir `../ft/docs`, os dados importados |
| `flows.py`, `edge.py`, `sjflows.py` | fluxos herdados do Atlas original |
| `smoke.py 390 dark`, `holes.py 1024` | todas as páginas numa largura/tema; buracos entre cartões |

Dependências: `playwright`, `python-dateutil`, `pdftotext`/`pdfinfo` (poppler). O livro em PDF carrega o jsPDF do
cdnjs; para testar sem internet, coloque `jspdf.umd.min.js` (2.5.1) em `testes/`. `CHROMIUM_PATH` aponta outro Chromium.
