# Atlas da Vida 3 · código-fonte

O app é um arquivo só, `../atlas-da-vida-3.html`, montado a partir dos módulos em `src/`. O Atlas da Vida original
(`../atlas-da-vida.html`) e o Atlas da Vida 2 (`../atlas-da-vida-2.html`) continuam separados e não são tocados por este build.

- `python3 build.py` monta o HTML e, se o Node estiver instalado, confere a sintaxe do JavaScript.
- `src/00-head.html` tem o esqueleto e os estilos; os módulos `01` a `54` entram na ordem definida no `build.py` (`24-jornada.js` é a Jornada existencial, com a Bússola moral dentro; `25-carreira.js` é o hub de Carreira; `26-lazer.js` é o Lazer, com oito divisões e seus mentores; `27-painel.js` é o Painel do dia; `28-capas.js` as capas, missões, manuais e o Mapa do Atlas; `29-hoje2.js` o Hoje; `30-casa.js` a Casa; `31-futuro.js` Futuro financeiro e Itália & Brasil; `32-idiomas.js` Idiomas; `33-carreira2.js` Caderno técnico e Rede profissional; `34-exemplo.js` o modo exemplo; `35-painel2.js` as demais abas no Painel do dia; `36-gcal.js` o Google Calendar; `37-rotina.js` a Rotina em blocos de 30 minutos; `38-jardim.js` o jardim interior da Saúde espiritual; `39-roteiro.js` o roteiro de áudio do Painel do dia; `40-secretario.js` o Secretário da Vida, a janela flutuante que junta as abas; `41-conselho.js` a Administração Pessoal, o Conselho de Administração da vida; `42-filosofia.js` a Filosofia (estoicismo) dentro da Jornada; `43-psique.js` a aba Psicologia e o Terapeuta; `44-cockpit-config.js` a configuração versionada do agente PMO; `45-cockpit.js` o motor do Cockpit de Trabalho (calendário de dias úteis, caminho crítico, prioridade, carga, delegação, alertas, propostas e ferramentas do agente); `46-cockpit-ui.js` as telas de tarefas, equipe e contexto; `47-cockpit-reg.js` riscos, problemas, diário de bordo, decisões, lições e reuniões; `48-cockpit-rel.js` Gantt, tracker BIM, elaborati, briefing, relatórios, blocos de foco e o exemplo; `49-cockpit-agg.js` a camada de agregação pura do Dashboard (e dos KPIs do Hoje, do mapa de riscos e dos relatórios); `50-cockpit-dash.js` o Dashboard; `51-saude-ag.js` o que o Nutri e o Personal têm em comum (propostas, aprovação, painel); `52-nutri.js` a Alimentação e o Nutri; `53-treino.js` os Treinos, o Personal e o exemplo dos dois; `54-centros.js` os centros de força, dentro do Espiritismo na Jornada).

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
3. **Hoje** (briefing, alertas, prioridades, blocos de foco), **Semana** (prazos, capacidade, weekly review), **Mês**, **Kanban** (arrastar), **Lista** (e matriz de Eisenhower), **Gantt** (CPM em dias úteis, folgas, cascata), **Riscos**, **Problemas**, **Equipe** (carga, delegação, PDI, 1:1), **Diário de bordo**, **Decisões**, **Tracker BIM**, **Entregas** (elaborati), **Reuniões**, **Relatórios** (italiano: mensal e do período), **Lições**.
4. **PMO** no painel lateral: cada mensagem leva o estado inteiro com códigos (T12, R3, P2…). As ferramentas de escrita (`criar_tarefa`, `atualizar_tarefa`, `registrar_risco`, `registrar_problema`, `propor_solucao`, `registrar_evento`, `registrar_decisao`) criam cartões; aprove com o botão ou escrevendo `ok`, `aprova 1 e 3`, `não`. As de leitura (`listar_tarefas`, `sugerir_delegacao`, `calcular_caminho_critico`, `gerar_briefing`, `gerar_relatorio`) respondem na hora.

**Dashboard** (primeira sub-aba; o Cockpit continua abrindo no Hoje). Analítico: tendências e comparações no período, não o que fazer agora.
- **Filtros**: período (semana, mês, trimestre, ano ou personalizado, em dias úteis italianos) e pessoa, projeto e tag. Ficam na sessão e seguem no drill-down. Com o período em andamento, a comparação ▲▼ é com o mesmo trecho do período anterior (mesmo número de dias úteis).
- **Widgets** (21, em 7 seções): KPIs do período; burnup; status por semana; throughput, lead time e cycle time; esforço por projeto e tag; previsão dos marcos (a mesma conta do alerta); carga × capacidade (a mesma do card “Minha carga”) e a realizada; comparativo por pessoa; horas por pessoa e dia útil; desenvolvimento e 1:1 (radar do PDI, trilha, evolução, dias desde o último 1:1, compromissos); matriz de riscos e top 5 (sem plano em destaque); problemas abertos × resolvidos com a idade; clash por par de disciplinas; modelos, LOIN e BEP; funil de elaborati e consegne IFC; decisões; diário de bordo (sinal de escopo); lições; Minha agenda; insights do PMO.
- **Drill-down**: todo número clicável abre a aba certa só com os itens que o compõem (os mesmos ids do cálculo); um aviso no topo da aba mostra a origem e limpa o filtro.
- **Minha agenda**: estimada pelo esforço das suas tarefas por tag (sem registro de horas), pelas reuniões da agenda, pelos 1:1 e pelas revisões; alerta quando a execução técnica passa do limite e a coordenação fica abaixo do mínimo.
- **Insights do PMO**: 3 a 5 tendências com a fonte e uma ação aprovável com uma palavra (as ações viram propostas no chat; “ok” aprova). **Gerar relatório do período** abre o Rapporto di periodo em italiano já preenchido, com os mesmos números.
- **Personalizar** oculta e reordena os widgets (fica no banco); **Modo reunião** mostra uma seção por vez em tela cheia (← → e Esc).
- **Camada de agregação** (`src/49-cockpit-agg.js`): funções puras que recebem dados, filtros, período e contexto e devolvem os números e os ids. O **registro diário** (`ckSnap`) guarda uma vez por dia o que as datas não reconstituem (a menor folga, a carga, os abertos), para os períodos passados; nunca no modo Exemplo.
- **Limites** (`CK_LIMITES` em `src/44-cockpit-config.js`): janela e faixas da carga, score de risco alto, dias até um problema virar alerta, ciclo de 1:1 e os da Minha agenda. A aba Contexto sobrescreve cada um.
- **Fora do Cockpit**: as tarefas em que o responsável é você aparecem no Hoje (em Para hoje, marcadas como Trabalho · T12), no Secretário (com Concluí e um aviso de sobrecarga que compara as horas restantes com a sua capacidade diária no Cockpit, sem misturar com o tempo livre da Rotina), na Rotina, no Painel do dia e no Fechamento da semana. Concluir fora é o mesmo que concluir no Cockpit; o prazo continua sendo mudado no Cockpit, por causa das dependências. Ajustes → Cockpit de Trabalho desliga.
- **“ok” no chat** aprova as propostas da mensagem mais recente que tem pendências (a mesma regra da Saúde); as anteriores continuam esperando e o PMO diz quantas.

## Cruzamentos (Laboratório)

Pistas sobre o que anda junto entre **áreas diferentes** da vida, com o quanto dá para confiar em cada uma, para virar experimento. Fica no Laboratório, logo antes de Experimentos (descobrir → testar).
- **Prontidão:** precisa de duas áreas registradas nos mesmos dias, em pelo menos 20 dias. Sem isso, a aba mostra o que falta registrar (o check-in da Saúde já basta) em vez de números; só com gastos, aponta Finanças → Relatório.
- **Perguntas:** “o que acompanha” o humor bom, mais energia, menos estresse, dormir mais, sono melhor, cumprir os hábitos, cumprir o plano da Rotina, entregar mais trabalho, gastar mais (ou qualquer métrica), no mesmo dia ou no dia seguinte. Cada pista diz as médias nos dois grupos, a força e os dias; **Ver no gráfico** abre o cruzamento e **Testar como experimento** cria o teste já preenchido.
- **Confiança:** dias seguidos se parecem, então o Atlas usa os dias efetivos (autocorrelação de 1ª ordem, Bartlett), o intervalo de 95% de Fisher e o p; como testa dezenas de fatores de uma vez, só vira pista o que passa por Benjamini–Hochberg a 10%. O resto fica em “podem ser acaso”. A Visão geral, as ideias de Experimentos e os mentores usam o mesmo critério.
- **Correções:** uma métrica nunca é cruzada com uma parte dela (gasto do grupo × gasto do dia, humor × humor do dia, tag × diário, “com fulano” × diário e contatos); dias depois do último registro de uma área (+14 dias) não contam como zero nos cruzamentos (os alertas continuam vendo zero).
- **Fontes:** Saúde, Hábitos, Finanças, Diário, Relações, Estudo, Idiomas e Lazer, Metas, Rotina (cumprimento do plano), Cockpit de Trabalho (tarefas e horas suas concluídas), Psicologia (sessões e registros, fora o que é só seu) e Jornada.

## Saúde: Alimentação (Nutri) e Treinos (Personal)

Duas sub-abas novas na Saúde, cada uma com um agente que lê os dados a cada mensagem e só **propõe**: nada muda sem a sua aprovação (um clique, “ok” para as propostas pendentes mais recentes, “aprova 1 e 3”, “não”, ou **Aprovar todas**). A validação de cada proposta é que impõe os limites de saúde, não só o prompt: o que passa do limite é recusado e o agente recebe o motivo.

**Alimentação (Nutri)**
- **Dia**: anel de calorias, barras de proteína, carboidrato e gordura, água; registro por texto (“almoço: 150 g arroz, 100 g feijão, 2 ovos”, em gramas, kg, ml ou unidades da porção, português e italiano), pela base (56 alimentos da TACO, USDA e CREA, por 100 g) ou à mão; gramas editáveis; repetir o dia anterior.
- **Semana**, **Peso e metas** (pesagem e cintura, média de 7 dias, tendência por regressão de 28 dias, gasto pela fórmula × gasto pelos dados, projeção), **Plano e perfil** e **Alimentos** (Meus alimentos).
- **Contas**: TMB de Mifflin-St Jeor × fator de atividade; calorias com o ajuste do objetivo (perder, manter, ganhar) e do compromisso (baixo, médio, alto), limitadas ao ritmo seguro (perda até 0,5/0,75/1% do peso por semana; ganho até 0,25/0,35/0,5%) e nunca abaixo do piso (TMB, mínimo 1.200 kcal mulheres e 1.500 homens); IMC < 18,5 nunca recebe déficit. Proteína em g/kg (+0,2 nos focos esportivo e shape), gordura 25–30% (mínimo 0,6 g/kg), carboidrato o resto.
- **Nutri**: focos saúde, esportivo, shape, energia e qualidade de vida; compromisso baixo, médio ou alto. Ferramentas: consultar alimentação, tendência do peso, buscar alimento, consultar treinos, e as propostas `registrar_refeicao`, `ajustar_metas` (recusa abaixo do piso, acima de 25% do gasto, ritmo inseguro, proteína fora de 0,8–2,5 g/kg), `definir_objetivo` e `salvar_plano_alimentar`.

**Treinos (Personal)**
- **Fichas** com a biblioteca de 42 exercícios (grupo, secundários, degrau de carga) e a **próxima carga** de cada exercício pela progressão dupla (todas as séries no topo da faixa → sobe um degrau; duas sessões abaixo da faixa → −10%); modelos prontos por nível.
- **Registrar**: o treino em andamento fica no aparelho; séries com repetições e carga, a última vez ao lado, relógio de descanso; ao salvar, o treino preenche o check-in do dia (a não ser que ele já tenha sido preenchido à mão) e mostra os recordes.
- **Corrida**: distância, tempo e ritmo; carga aguda:crônica (7 dias ÷ média semanal de 28), previsão de prova por Riegel, plano de corrida (do Personal ou o **plano básico** do app) com a semana atual e o que foi feito.
- **Progresso** (1RM estimado de Epley, recordes, séries por grupo na semana contra a faixa do compromisso, treinos por semana) e **Perfil** (nível, objetivo, compromisso, dias, minutos, local, limitações).
- **Personal**: ferramentas consultar treinos, progresso do exercício, volume semanal, listar exercícios, e as propostas `criar_ficha` (até 12 exercícios, 12 séries por grupo e 30 por sessão, 24 para iniciantes; carga no máximo 10% ou um degrau acima da maior registrada), `registrar_treino`, `registrar_corrida` (ritmo plausível) e `planejar_corrida` (até 10% ou 2 km a mais por semana sobre a maior das 3 anteriores, no máximo 3 semanas seguidas de aumento, até 2 sessões fortes por semana, 1 para iniciantes, e pelo menos um dia sem corrida).
- Os dois conversam por recado e cada um lê o resumo do outro. Ficam fora da IA se a **Saúde física** estiver bloqueada em Privacidade. Os Cruzamentos ganham km de corrida, calorias e proteína (dia sem registro de comida fica vazio, não zero).

## Jornada → Espiritismo → Centros de força

Os chakras lidos à luz da Doutrina Espírita, dentro do pilar Espiritismo (navegação **O pilar | Centros de força**; não é um quinto pilar nem um item novo na barra da Jornada).
- **Os sete centros** do perispírito descritos por André Luiz (Entre a Terra e o Céu, cap. XX, Conflitos da alma): coronário, cerebral, laríngeo, cardíaco, esplênico, gástrico e genésico, cada um com o chakra correspondente (Sahasrara, Ajna, Vishuddha, Anahata, Svadhisthana na lista de Leadbeater, Manipura, Muladhara), a função, a fonte, uma pergunta e a prece.
- **Virtudes da Bússola** que trabalham cada centro (leitura do Atlas, não doutrina): os 17 valores, cada um em um centro só, com a prática de cada um no exame da noite.
- **O que os seus dados mostram** (14 dias): dias com o Espiritismo e sessões de prece; qualidade do sono, estresse e estudo; respiração e vigilância da palavra; humor, contatos e caridade; sono, treino e passos; alimentação na meta e álcool; no genésico, o Atlas não mede nada.
- **Autoavaliação semanal** de 1 (em desarmonia) a 5 (em harmonia), com as últimas 12 semanas; **harmonização guiada** (abertura, os sete centros de cima para baixo e encerramento, 30 s a 2 min por centro, leitura em voz alta opcional) que vira sessão de prática do Espiritismo (Práticas, ritmo do pilar, jardim e Cruzamentos).
- Reflexões marcadas com o centro vão para o pilar; as práticas de cada centro são adotadas e marcadas ali mesmo; O Benfeitor recebe a autoavaliação e as harmonizações (sem números de saúde). A **base doutrinária e os limites** ficam no fim da página: Kardec não usa a palavra chakra; perispírito e fluidos (O Livro dos Espíritos, q. 93 a 95 e 135; A Gênese, cap. XIV); nada substitui tratamento médico.

## Filosofia e Psicologia

- **Filosofia** (Jornada → Filosofia): o estoicismo tecido no que já existe. As quatro virtudes cardeais são lidas nos exames da noite (os 17 valores da Bússola agrupados em sabedoria, justiça, coragem e temperança); a triagem do controle parte de decisões da Bússola, registros e padrões da Psicologia, tarefas atrasadas, alertas e dúvidas dos pilares; as lentes mostram o mesmo dilema pelo estoicismo, pelos quatro pilares e pela psicoterapia; o Mestre do Pórtico é o mentor, com memória.
- **Psicologia**: sessões (temas, insights, padrões, combinado, humor antes e depois), processos com linha do tempo, entre sessões (pergunta do dia, registro de pensamento, livre), padrões com contagem e o exercício estoico e o valor da Bússola que conversam com cada um, e a pauta da próxima sessão (com sugestões do Atlas).
- **O Terapeuta**: agente com memória que muda de forma (profundo, escuta, direto, acolhimento, socrático). Em Automático, ele lê os sinais do que você escreve; uma forma tocada fica fixa. Não substitui a terapia e tem protocolo de segurança.
- **Fios**: um registro de pensamento vira triagem estoica; uma triagem pode ir para a pauta da terapia; os padrões aparecem na Filosofia; sessões e processos se ligam a pilares e valores; os mentores da Jornada e o Conselho leem um resumo (nada marcado como só seu, e nada se a Saúde mental estiver fora da IA).

## Virada do dia

Com o Atlas aberto depois da meia-noite, a data muda sozinha (a cada minuto e ao voltar para a aba): os registros passam
para o dia novo, e o que estava no dia velho acompanha (mês do relatório, Rotina, Captura e um Painel do dia vazio). Um
rascunho do Painel fica no dia em que foi escrito, com aviso; se um campo estiver em edição, a virada espera ele perder o foco.

## Testes (Playwright + Chromium)

Rode de dentro de `testes/`, depois do build. Cada script imprime `PASS`/`FAIL` por verificação e o total no fim.
O relógio do navegador fica fixo em 09/10/2026, 10:00 (sexta), para os testes não dependerem do dia em que rodam:
`ATLAS_NOW=2026-10-10T10:00:00` muda o instante, e `cfg={"now": None}` num teste usa o relógio real.

| Script | O que cobre |
|---|---|
| `lab1.py` | privacidade (cofre, sem-IA, registro de leitura), captura sem atrito, experimentos A/B |
| `lab2.py` | radar (contra cálculo independente), fechamento semanal, capítulos e livro em PDF, busca por significado |
| `lab3.py` | espaço a dois (duas pessoas), agenda .ics (recorrências contra a `python-dateutil`), Apple Health, Google Fit, Notion, extrato que aprende |
| `lab4.py` | bússola moral: valores, foco, exame da noite (índice conferido à parte), decisões com revisita, caminhos, Hoje |
| `lab22.py` | Cockpit (1/2): as 19 visões, dias úteis italianos (Páscoa, Pasquetta, padroeiro), CPM com folgas, cascata e o caminho que define o fim, alertas, Eisenhower, entrada rápida, Kanban com arrastar, ciclo recusado, delegação, PDI, 1:1 que vira tarefa; o PMO: prompt da configuração + contexto + estado, nada muda antes da aprovação, “aprova 1 e 3”, botão, “não”, privacidade, celular |
| `lab26.py` | Cruzamentos: menu no Laboratório, famílias parte-todo, r, dias efetivos, intervalo de 95% e p conferidos com Python, Benjamini–Hochberg igual ao Python, zeros só enquanto há registro, só gastos mostra o que falta, métricas de Rotina, Cockpit, Psicologia e Idiomas conferidas com as abas, sessão privada fora, perguntas, pistas, Ver no gráfico, Testar como experimento, aviso parte-todo, matriz, Visão geral, ideias de experimento, celular |
| `lab27.py` | Saúde: metas da alimentação (Mifflin-St Jeor, piso, ritmo, macros), tendência do peso e gasto pelos dados conferidos com Python; registro por texto, água e peso; progressão dupla, Epley, volume, carga aguda:crônica e Riegel conferidos; regras do plano de corrida reescritas em Python; treino série a série com o check-in; corrida; ficha à mão e por modelo; plano básico; Nutri e Personal com propostas válidas e recusadas, aprovação por clique e por “ok”, desfazer, sem ferramentas e bloqueados pela Privacidade; métricas novas nos Cruzamentos; celular |
| `lab28.py` | Centros de força: os sete centros com o chakra correspondente, os 17 valores da Bússola uma vez cada, seção agrupada no Espiritismo, mapa por toque e teclado, sinais conferidos em Python, autoavaliação (marca, troca, desmarca, desfaz), harmonização guiada que vira sessão (e aparece em Práticas), encerrar cedo não registra, sair da página para o relógio, reflexão e prática pelo centro, resumo no pilar, fatos dos mentores sem números de saúde, celular |
| `lab29.py` | Correções da auditoria: virada do dia com o app aberto (e a espera do campo em edição), sábado fixo (Cockpit e sobrecarga), minhas tarefas do Cockpit no Hoje, Secretário, Rotina, Painel e Fechamento, e o interruptor; “ok” do Cockpit só no lote mais recente; Google Agenda com hora local; modo exemplo que não liga sem salvar, cofre, radar e jardim; Contexto no celular; diagonal dos Cruzamentos; fontes espíritas; uma frase no Painel paga uma ocorrência da conta |
| `lab24.py` | Dashboard (1/2): a camada de agregação confere com um cálculo independente em Python (período, dias úteis italianos, comparação com o mesmo trecho, KPIs atual e anterior, burnup, status semanal, throughput e lead time, esforço, matriz de riscos, problemas por semana, conhecimento, Minha agenda, carga realizada, heatmap); calendário indexado = dia a dia; filtros consistentes; KPIs do Hoje vindos da camada; drill-down com os ids exatos; registro diário uma vez por dia, nunca no Exemplo |
| `lab25.py` | Dashboard (2/2): sub-aba e rotas, 21 widgets, drill-down de todos os KPIs e de dois números por widget até a aba certa, Limpar, filtros e período na sessão, período personalizado, insights que viram propostas e “ok”, relatório do período em italiano com os mesmos números, modo reunião, estados vazios, layout persistente no banco, Exemplo sem gravar, celular sem rolagem horizontal, 1000 tarefas |
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
