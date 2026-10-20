# Atlas da Vida 4 · código-fonte

O app é um arquivo só, `../atlas-da-vida-4.html`, montado a partir dos módulos em `src/`. O Atlas 4 nasceu do Atlas 3
(`../atlas-da-vida-3.html`, que continua separado) com as correções do diagnóstico crítico de outubro de 2026.
É outro artefato, com banco próprio: para trazer os dados, no Atlas 3 vá em Integrações → Exportar → Backup completo
e, no Atlas 4, em Integrações → Importar → Restaurar backup. O espaço A dois também recomeça (a outra pessoa entra de novo).

## O que mudou do Atlas 3 para o 4

**Gravação (nada se perde)**
- **Dois aparelhos ou duas abas:** cada gravação leva uma revisão (`r`). Antes de gravar, o app confere a revisão no banco; se outro
  aparelho gravou depois da última leitura, junta as duas versões em 3 vias (`merge3` em `src/01-core.js`: listas por `id`,
  objetos campo a campo; apagado de um lado e intacto do outro sai; editado de um lado e apagado do outro fica; conflito no
  mesmo valor: vale este aparelho). Uma trava curta (`acquire` em `s__lock`) evita duas gravações simultâneas da mesma chave.
- **Aviso ao vivo:** o documento `s__rev` guarda a revisão de cada chave; os outros aparelhos assinam e releem a chave que
  mudou (se não tiverem edição pendente nela; se tiverem, a gravação junta). O desfazer da memória daquela chave é descartado;
  o histórico de alterações continua e desfaz pela diferença, sem apagar o que veio do outro aparelho.
- **Conta que não responde ao abrir:** 4 tentativas (1, 2 e 4 s); se continuar fora, o app avisa, não grava no navegador como
  se fosse a conta, guarda o que for registrado e junta quando a conta responder (a cada 15 s, ao voltar para a aba ou no botão).
- **Fechar ou esconder a aba:** a gravação sai na hora (`visibilitychange`/`pagehide`). Além disso, toda edição vai na hora
  para um diário de escrita neste aparelho (`localStorage`, `atlas4_wal_<chave>`), com a revisão em que se baseou; se a aba
  morrer antes de gravar, a próxima abertura reaplica (inteira se ninguém gravou depois; unida, se alguém gravou).
- **Partes grandes por geração:** acima de 180 KB, as partes entram como `s_<chave>.g<N>.<i>`; o cabeçalho só troca de geração
  depois de todas gravadas, e a geração velha sai depois. Uma gravação interrompida nunca mistura versões.

**Segurança e desempenho**
- O título de experimento entrava no HTML sem escape (o único ponto achado em 2.198 campos testados); corrigido. Os
  ajudantes `kmini` e `panel` passam o texto por uma lista branca de tags (`safeHtml` em `src/05-ui.js`): o que não é
  formatação vira texto, atributos `on*` e endereços `javascript:` saem.
- Restaurar backup confere a forma de cada conjunto (lista, objeto, número) e deixa de fora, com aviso, o que vier diferente.
- Diário › Entradas desenha 50 por vez ("Mostrar mais"); com 1.900 entradas, cerca de 40 ms em vez de 2 s.

**Acessibilidade**
- Tudo que responde ao clique responde ao teclado (`a11yPass` em `src/11-main.js`, depois de cada render): tabindex, papel de
  botão e nome (do `data-tip`). Grupos grandes (os dias de um heatmap, barras de Gantt, linhas de relatório) são uma parada
  só do Tab, com setas, Home e End; a dica aparece também no foco. Campos sem nome ganham o do placeholder ou do rótulo.
- Tema claro com contraste de 4,5:1 nos textos secundários, nos status e nas cores de área usadas como texto.
- Toque (`pointer: coarse`): alvos de no mínimo 24 px nas escalas, chips, links soltos e calendário do Cockpit.
- Todo gráfico feito pelos construtores comuns ganha "ver como tabela" e CSV (`ctWrap` em `src/04-charts.js`): 78 de 109
  painéis no exemplo; os outros são textos e listas.

**Uso**
- Menu com 8 abas fixas e o resto em "Mais" (nos mesmos grupos); quais ficam fixas se escolhe em Ajustes › Menu, com o
  número de vezes que cada aba foi aberta.
- Painel do dia: o roteiro de áudio começa fechado (o campo "Conte o dia" fica no alto); o roteiro separa capturado, nada a
  responder hoje e falta; modo rápido (humor, sono e uma frase); lembrete diário em .ics.
- Hoje: primeiros passos para quem começa do zero. Faixa de Atlas vazio explica como trazer o Atlas 3.
- Nos dias 1 a 7, o seletor de mês avisa "mês fechando". KPI com zero nos dois períodos diz "sem registro".
- Backup: a data do último fica guardada e aparece em Integrações; o Fechamento da semana lembra depois de 30 dias.
- Privacidade: serviços externos (clima, notícias, câmbio) com o que cada um recebe e chave para desligar; uso da IA por
  mês, por recurso e por agente, com aviso opcional; avaliação "útil / genérica" das respostas de todos os agentes.
- Nomes: "O Terapeuta" virou **Companheiro de terapia** (a aba é "Companheiro"); o mentor `conselho` virou **Mentor do
  Equilíbrio**, para não se confundir com o Conselho da Administração Pessoal (a chave interna continua `conselho`).
- Google Agenda: a leitura aceita as variações comuns da resposta e, se não reconhecer o formato, para sem apagar nada.
- O build para se um nome global for declarado duas vezes entre os módulos.
- Dados fictícios só com o botão Exemplo. A aba A Dois mostrava a "Chiara (exemplo)" quando o espaço estava vazio e quando o
  banco não respondia; agora mostra o convite, o estado vazio de verdade ou o motivo. O `lab33` varre as 151 telas com o banco
  vazio atrás de qualquer texto que só exista nos dados de exemplo.

- `python3 build.py` monta o HTML e, se o Node estiver instalado, confere a sintaxe do JavaScript.
- `src/00-head.html` tem o esqueleto e os estilos; os módulos `01` a `63` entram na ordem definida no `build.py` (`24-jornada.js` é a Jornada existencial, com a Bússola moral dentro; `25-carreira.js` é o hub de Carreira; `26-lazer.js` é o Lazer, com oito divisões e seus mentores; `27-painel.js` é o Painel do dia; `28-capas.js` as capas, missões, manuais e o Mapa do Atlas; `29-hoje2.js` o Hoje; `30-casa.js` a Casa; `31-futuro.js` Futuro financeiro e Itália & Brasil; `32-idiomas.js` Idiomas; `33-carreira2.js` Caderno técnico e Rede profissional; `34-exemplo.js` o modo exemplo; `35-painel2.js` as demais abas no Painel do dia; `36-gcal.js` o Google Calendar; `37-rotina.js` a Rotina em blocos de 30 minutos; `38-jardim.js` o jardim interior da Saúde espiritual; `39-roteiro.js` o roteiro de áudio do Painel do dia; `40-secretario.js` o Secretário da Vida, a janela flutuante que junta as abas; `41-conselho.js` a Administração Pessoal, o Conselho de Administração da vida; `42-filosofia.js` a Filosofia (estoicismo) dentro da Jornada; `43-psique.js` a aba Psicologia e o Terapeuta; `44-cockpit-config.js` a configuração versionada do agente PMO; `45-cockpit.js` o motor do Cockpit de Trabalho (calendário de dias úteis, caminho crítico, prioridade, carga, delegação, alertas, propostas e ferramentas do agente); `46-cockpit-ui.js` as telas de tarefas, equipe e contexto; `47-cockpit-reg.js` riscos, problemas, diário de bordo, decisões, lições e reuniões; `48-cockpit-rel.js` Gantt, tracker BIM, elaborati, briefing, relatórios, blocos de foco e o exemplo; `49-cockpit-agg.js` a camada de agregação pura do Dashboard (e dos KPIs do Hoje, do mapa de riscos e dos relatórios); `50-cockpit-dash.js` o Dashboard; `51-saude-ag.js` o que o Nutri e o Personal têm em comum (propostas, aprovação, painel); `52-nutri.js` a Alimentação e o Nutri; `53-treino.js` os Treinos, o Personal e o exemplo dos dois; `54-centros.js` os centros de força, dentro do Espiritismo na Jornada; `55-rotina-voz.js` o Capturar do dia na Rotina; `56-ia-dados.js` o acesso das IAs aos dados no detalhe; `61-rotina-ativ.js` a lista suspensa de atividades da grade da Rotina; `62-lembretes.js` os lembretes com data e hora; `63-historico.js` a janela do histórico de alterações, cujo motor fica no `01-core.js`).

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
- **Mapa**: os sete centros no eixo do corpo, numerados de 1 a 7 na ordem do passe e da harmonização (do alto da cabeça à base do tronco); a cor e a nota ao lado do nome são a autoavaliação da semana.
- **Como trabalhar cada centro**: um caminho por centro e, para cada virtude dele, por que ela trabalha o centro, o que acontece quando falta e quando sobra, a prática e a pergunta da noite (da Bússola). **Trabalhar este centro nesta semana** leva até 3 das virtudes dele (as que ainda não entraram no exame e as mais fracas primeiro) para o foco da Bússola, que é o que o exame da noite pergunta; tirar do foco devolve o foco anterior. Sem centro escolhido, o Atlas sugere o que você avaliou mais baixo na semana.
- **Autoavaliação semanal** de 1 (em desarmonia) a 5 (em harmonia), com as últimas 12 semanas; **harmonização guiada** (abertura, os sete centros de cima para baixo e encerramento, 30 s a 2 min por centro, leitura em voz alta opcional) que vira sessão de prática do Espiritismo (Práticas, ritmo do pilar, jardim e Cruzamentos).
- Reflexões marcadas com o centro vão para o pilar; as práticas de cada centro são adotadas e marcadas ali mesmo; O Benfeitor recebe a autoavaliação e as harmonizações (sem números de saúde). A **base doutrinária e os limites** ficam no fim da página: Kardec não usa a palavra chakra; perispírito e fluidos (O Livro dos Espíritos, q. 93 a 95 e 135; A Gênese, cap. XIV); nada substitui tratamento médico.

## Filosofia e Psicologia

- **Filosofia** (Jornada → Filosofia): o estoicismo tecido no que já existe. As quatro virtudes cardeais são lidas nos exames da noite (os 17 valores da Bússola agrupados em sabedoria, justiça, coragem e temperança); a triagem do controle parte de decisões da Bússola, registros e padrões da Psicologia, tarefas atrasadas, alertas e dúvidas dos pilares; as lentes mostram o mesmo dilema pelo estoicismo, pelos quatro pilares e pela psicoterapia; o Mestre do Pórtico é o mentor, com memória.
- **Psicologia**: sessões (temas, insights, padrões, combinado, humor antes e depois), processos com linha do tempo, entre sessões (pergunta do dia, registro de pensamento, livre), padrões com contagem e o exercício estoico e o valor da Bússola que conversam com cada um, e a pauta da próxima sessão (com sugestões do Atlas).
- **Companheiro de terapia** (antes, O Terapeuta): agente com memória que muda de forma (profundo, escuta, direto, acolhimento, socrático). Em Automático, ele lê os sinais do que você escreve; uma forma tocada fica fixa. Não substitui a terapia e tem protocolo de segurança.
- **Fios**: um registro de pensamento vira triagem estoica; uma triagem pode ir para a pauta da terapia; os padrões aparecem na Filosofia; sessões e processos se ligam a pilares e valores; os mentores da Jornada e o Mentor do Equilíbrio leem um resumo (nada marcado como só seu, e nada se a Saúde mental estiver fora da IA).

## Modo exemplo (`src/34-exemplo.js`)

- Ligar guarda os seus dados na memória e mostra os fictícios; desligar devolve exatamente o estado anterior. A troca é atômica:
  espera a gravação e a releitura do banco que estiverem em andamento (as duas leem os dados depois de esperar a rede); não
  aceita um segundo toque enquanto troca nem nos 0,7 s seguintes (duplo toque não desliga e liga de novo); não troca antes de
  os dados abrirem nem com a IA respondendo (a resposta cairia no conjunto errado). Só a contagem de uso pendente não segura a
  troca: ela fica guardada e é gravada quando o exemplo desliga.
- O que outro aparelho grava durante o exemplo fica na fila e entra nos seus dados quando ele desliga.
- Rascunhos (diário, treino), resultados de busca, textos da IA e o aviso do Secretário são guardados ao ligar e devolvidos ao
  desligar; os do exemplo somem, e rascunhos não são gravados no aparelho enquanto o exemplo está ligado.

## Jardim interior: animação fluida (`src/38-jardim.js`)

- Os filtros de tinta (turbulência, deslocamento, desfoque) eram refeitos a cada quadro das animações que passam por cima deles
  (o rio, a névoa, as pétalas), e a sombra do leque era um filtro CSS sobre o SVG inteiro: ~35 quadros por segundo no teste.
- Depois de desenhar, cada elemento com filtro vira uma imagem pronta, no mesmo lugar e na mesma ordem (vizinhos estáticos viram
  uma imagem só, cortada no limite do desenho; camadas só de desfoque em meia resolução). O original fica invisível, para o
  toque, o realce e o foco. Quem continua animado (névoa, pérola do qi) leva a animação para a imagem; o filho que tem animação
  dentro de um grupo com filtro (a chama do incenso no templo) fica vivo, com o filtro só nele. A sombra do leque é um círculo
  desfocado dentro do desenho; os vagalumes ganham um halo em gradiente em vez de sombra CSS animada.
- Resultado no teste: 60 quadros por segundo de dia, à noite com névoa e no celular; o desenho difere em média ~2/255 por pixel
  (só a suavização das bordas). As imagens ficam guardadas: redesenhar depois é imediato. Se o navegador não conseguir gerar as
  imagens, o jardim aparece como antes, com os filtros.

## IA com acesso aos dados no detalhe (`src/56-ia-dados.js`)

- **Mentores (todos, inclusive Nutri, Personal, PMO, Companheiro, Jornada e Lazer):** além dos resumos de antes, o pedido leva
  os registros completos da área, linha por linha (mais recente primeiro, campos separados por `|`); os conjuntos pequenos
  primeiro e o maior (ex.: lançamentos) com o que sobra de um teto de 150 KB, abaixo do limite de 256 KB do pedido. Um ano de
  lançamentos (centenas de linhas de ~100 bytes) cabe com folga. Dados aninhados (ex.: exercícios e séries de um treino) vão
  inteiros em JSON, até 4.000 caracteres por célula.
- **Ferramenta `ler_dados`**: sem conjunto, o catálogo; com conjunto, filtra por período, texto e campo, pagina (`limite`,
  `pular`) e soma ou conta por mês, ano ou campo. Cada resposta cabe nos 32 KB da ferramenta. Conjuntos que são objetos
  (orçamento, patrimônio…) vêm em JSON. Entra no fim da lista de ferramentas de cada IA; se a visualização aceita menos
  ferramentas, ocupa a última vaga e sai a última do agente (a ordem de cada agente é a prioridade dele: o PMO segue a
  configuração; o Nutri deixa `consultar_treinos` por último, porque `ler_dados` lê treinos e corridas no detalhe).
- **Secretário, falas do Conselho e IAs de tarefa única** (Projetos, Fechamento semanal, Leitura do diário, Bússola, Círculo
  dos mentores, Lentes, relatórios do Cockpit): o catálogo no pedido e `ler_dados` (opção `dados: true` do `aiCall`; sem
  ferramentas na visualização, o pedido segue como antes). No Conselho, `ler_dados` é a única ferramenta do diretor: ele
  confere os dados, mas não altera nada durante a reunião.
- **Privacidade:** fica de fora o que a pessoa deixou fora da IA (setor sem IA, entrada trancada ou `#privado`, campos de setor
  privado nos check-ins) e os registros internos (cofre, registro de leitura, conversas, uso). Cada leitura entra no registro de
  Privacidade.

## Rotina, Hoje e Painel do dia

- **Cor própria do bloco:** um modelo pode trazer, por atividade, a cor de fundo e a da letra (`semana: [[dia, início, fim,
  título, categoria, "#fundo", "#letra"]]`, como num modelo importado de planilha). Ao aplicar, o bloco leva as duas cores e é
  pintado como na planilha (grade, mês, cartão); copiar, duplicar, mover e salvar a semana como modelo mantêm a cor. Sem cor
  própria, vale a da categoria. A categoria continua valendo para os números da semana.
- **Compromisso que repete todo ano** (`rep: "anual"` em `S.eventos`, campo Repetir no formulário): aparece no mesmo dia e mês
  todo ano a partir da data (29/02 cai em 28/02 nos anos comuns), na Rotina (dia todo, semana, mês) e na Visão geral.
- **Aniversários no calendário vêm da ficha da pessoa** (`aniv`): aparecem todo ano na Rotina (dia todo, mês), e tocar abre a
  ficha. Renomear, mudar a data ou apagar a pessoa já vale no calendário. Um compromisso anual ligado a uma pessoa
  (`pessoa: id`) que já tem a data na ficha não se repete. O ano é opcional: sem ele, guarda 1900 (1904 para 29/02), que
  nunca aparece na tela; o formulário pede dia, mês e ano (opcional), o cartão da pessoa mostra o dia e a ficha mostra a idade
  quando o ano é conhecido.
- **Rotina › Capturar o dia** (`src/55-rotina-voz.js`): na aba Rotina, o Capturar do topo (e o botão “Capturar o dia”) recebe o
  relato do dia inteiro, por voz ou texto. A voz vem do reconhecimento do navegador quando a página tem microfone; senão, do ditado
  do teclado do celular, direto no campo. A IA (`TAREFA: ROTINA DO DIA`) devolve cada atividade com início, fim, categoria e
  status; sem IA, o Atlas separa as frases que têm horário. Cada atividade vai para a faixa de meia hora mais próxima, sem
  sobrepor a anterior, com o horário falado nas notas quando muda. Um bloco já planejado no mesmo horário e da mesma atividade
  recebe o status (feito, parcial, pulado) em vez de ser repetido. Dia passado vem como feito; dia futuro, como planejado. O
  Capturar geral ganhou “Marcar na Rotina”, que leva o texto para cá.
- **Rotina:** tarefas e compromissos com horário escrito no título ou nas notas (“09:00–10:30”, “9h às 10h30”, “das 9 às 10”, “às 14h”, ou “9h” no campo de hora) entram na faixa certa da grade, e não no “dia todo”; “2h de estudo” é duração e “até às 18h” é prazo, não horário. Quando coincidem com um bloco, ficam na metade direita. Todo item abre um cartão: compromisso (editar, apagar), tarefa (virar bloco no horário escrito, concluir, editar, apagar) e tarefa do Cockpit (concluir, abrir no Cockpit). Apagar e virar bloco têm desfazer.
- **Rotina › Limpar:** na barra de cima, “Limpar o dia”, “Limpar a semana” ou “Limpar o mês”, conforme a vista. Antes de mexer,
  um diálogo mostra o que sai e o que fica, e abre com o foco em Cancelar (Esc também cancela). Saem os blocos avulsos do período e,
  dos blocos que se repetem, só a ocorrência no período (a série continua nos outros dias). As tarefas com horário na grade saem
  junto se a caixa ficar marcada (saem também da aba Tarefas). Ficam a agenda, os aniversários, as tarefas sem horário e as do
  Cockpit. Tudo volta num passo só com Desfazer (Ctrl+Z).
- **Secretário:** para montar o dia, propõe um bloco por atividade com horário; uma “tarefa” com faixa de horário vira proposta de bloco, e o bloco aceita “9h”, “9:00”, “19h30” e fim ausente (1 h, avisado no cartão).
- **Rotina › Preencher:** na barra de cima, abre a lista de modelos para preencher o dia, a semana ou o mês da vista. Os modelos
  com `nivel` (`basica`, `intermediaria`, `avancada`) vêm primeiro, nessa ordem, com a descrição (`desc`) e as horas da semana por
  categoria (“Trabalho 32,5 h · Estudo 4,5 h…”, ou “sem estudo”); depois os outros modelos salvos e os prontos. “Substituir” (marcado
  quando o período já tem blocos) limpa o período como o Limpar, sem tocar em tarefas, agenda e aniversários, e aplica o modelo; sem
  substituir, os horários ocupados ficam e os blocos do modelo que batem com eles são pulados (o aviso conta). Um passo só de desfazer.
  Os modelos de nível de cada pessoa ficam só no banco dela; o código não traz rotina de ninguém.
- **Rotina › lista suspensa de atividades** (`src/61-rotina-ativ.js`): tocar numa meia hora vazia da grade (ou arrastar por várias)
  abre ali uma lista com dois grupos. **Standard Semanal**: as atividades do modelo salvo com “Standard” no nome, uma vez cada, com a
  cor fixa do modelo (fundo e letra; havendo duas, vale a de mais minutos na semana) e a categoria dele. **Outras**: as cadastradas
  pela pessoa, com nome, categoria e cor escolhida num seletor (`S.rotinaAtiv.outras = [{ id, nome, cor, tx, cat }]`; a letra
  clara ou escura sai do contraste). Escolher preenche a faixa com um bloco da cor da atividade; encostado num bloco igual do mesmo
  dia, o bloco cresce em vez de virar outro, e horário já ocupado fica como está (o aviso diz quanto ficou livre). A busca filtra
  e oferece “Criar … em Outras”; setas, Enter e Esc funcionam; “Mais opções…” abre o formulário completo na mesma faixa. No celular
  vira um painel de baixo, sem abrir o teclado. O cartão do bloco ganhou “Trocar atividade”. Em Modelos e atalhos, “Atividades e
  cores” mostra a lista padrão, deixa escolher de qual modelo ela vem (`S.rotinaAtiv.fonte`; sem modelo Standard, usa os de nível
  e depois os outros) e edita as Outras: mudar cor, nome ou categoria atualiza os blocos que já as usam; excluir só tira da lista.
  O mesmo nome digitado no formulário, no texto rápido, no Capturar (a IA recebe a lista de nomes) ou vindo do Secretário recebe
  a cor da atividade. Nome repetido (sem diferença de maiúsculas e acentos) não entra.
- **Lembretes das atividades semanais** (`src/57-lembsem.js`): uma regra por atividade, pelo nome do bloco (“Academia · seg, qua,
  sex · 15 min antes”), criada no painel Lembretes da Rotina ou no cartão de qualquer bloco (“só às sextas” restringe ao dia).
  Vale para toda ocorrência com esse nome, de modelo, avulsa ou repetida. Com o Atlas aberto, o relógio do Secretário (30 s) avisa
  uma vez por ocorrência e por aparelho (o que já avisou fica no `localStorage`), abre o Secretário nos Lembretes e, se ligados,
  toca um som e mostra a notificação do navegador; bloco já marcado (feito, parcial, pulado), regra pausada e modo exemplo não
  avisam. Para tocar no celular com o Atlas fechado, “Pôr no Google Agenda” cria um evento semanal por horário da atividade na
  semana (`RRULE:FREQ=WEEKLY`, aviso `popup` com os mesmos minutos, disponível em vez de ocupado) com a marca `atlas-lemb:<id>` na
  descrição; a sincronização da Agenda ignora esses eventos. Mudar os minutos ou os horários mostra “Atualizar no Google” (apaga e
  recria); “Tirar do Google” e apagar a regra apagam os eventos pelos ids guardados ou, se a resposta do Google não trouxe id, pela
  marca (`list_events` com `fullText`). Dados: `S.secretario.semanais`. Na grade, o bloco com regra ativa ganha um sino.
- **Lembretes com data e hora** (`src/62-lembretes.js`): um só modelo para o Secretário, o painel Lembretes da Rotina (tipo
  “Numa data e hora”, o padrão; “Antes de uma atividade” é a regra semanal acima), o botão Lembrete da linha de criação rápida,
  “Lembrete aqui” na lista suspensa de cada meia hora e o cartão. O formulário tem Lembrar de, Data, Hora, Repetir (não repete,
  todo dia, dias úteis, toda semana, todo mês, todo ano) e Avisar (na hora até 1 dia antes). A frase preenche os campos enquanto
  se escreve (“dentista 25/10 às 15h”, “às 3 da tarde”, “daqui a 2 horas”, “28 de outubro”, “remédio todo dia às 8”, “toda segunda
  às 9h30”, “todo dia 5”); campo mexido à mão não muda mais, e o que está nos campos é o que vale. O leitor antigo do Secretário
  errava 5 de 12 frases comuns (“às 3 da tarde” virava 03:00 do dia seguinte, “25/10 às 15h” virava hoje); `lab49.py` confere 14.
  Cada lembrete aparece na hora exata na grade Dia e Semana (linha tracejada e etiqueta com sino, que abre o cartão: Feito,
  Editar, Google Agenda, Tirar só deste dia, Apagar), no Mês, no minicalendário, na faixa da semana (sino com o número), nos
  Próximos 7 dias do Hoje e no Agora do Secretário; não ocupa tempo nem entra em conflito com os blocos. Avisa uma vez por
  ocorrência (os que repetem, uma vez por dia). “Também no Google Agenda” cria um evento com a repetição (`RRULE`), o aviso e a
  marca `atlas-lemb:l:<id>`; o id fica também em `S.integ.lemGc`, e evento de lembrete que sumiu (apagado ou desfeito) sai do
  Google. Dados: `S.secretario.lembretes = [{ id, texto, quando, rep, min, feito, avisado, feitos, avisados, exc, gcal }]`.
- **Hoje:** tempo livre em 2 h, 4 h ou 6 h, ou outro valor escrito em horas (1, 1,5, 3…).
- **Painel do dia:** “Recomeçar do zero” no topo (e “Limpar” no rodapé) limpa o painel num toque, com desfazer; o que já foi salvo nas abas continua lá.

## Clima (`src/29-hoje2.js` + `ferramentas/feed_hoje.py`)

A página do Atlas, dentro do claude.ai, não tem internet: a previsão chega pelo banco do Atlas. A tarefa agendada que rodava o
script duas vezes por dia foi desligada em 18/10/2026 (custo zero): hoje o documento só muda quando `ferramentas/feed_hoje.py`
roda. O script grava com `update` no documento compartilhado `feed/hoje`: previsão hora a hora da MET Norway (yr.no) para cerca de 60 horas, com as horas já passadas de hoje
vindas do feed anterior (para a mínima e a máxima do dia), mais as notícias boas (Positive News, Good News Network) e o câmbio
BRL→EUR do BCE. A cidade vem de `s_cfg.v.cidade` (sem ela, Turim); sem coordenadas, é localizada pelo nome (geocodificação do
Open-Meteo, que também dá o fuso). Cidade não encontrada grava só `erroCidade` (o clima anterior fica); MET Norway fora do ar não
grava nada.

Na página: o doc é lido com `onSnapshot` (a atualização entra sem recarregar); o “agora” é a hora gravada que contém este
instante, no fuso da cidade (o aparelho pode estar em outro); mínima e máxima são das horas de hoje; chuva é dita com as horas
(“chuva às 15 h e 16 h (2,8 mm)”), até as 22 h; seis próximas horas aparecem numa faixa; o Hoje redesenha na virada da hora (não
enquanto você digita). Não há mais tempo marcado à mão: sem previsão válida, o painel explica por quê (buscando, previsão gravada de
outra cidade, cidade não encontrada, previsão que já não cobre a hora, clima desligado em Privacidade) e diz que a atualização
automática está desligada. Trocar a cidade não usa internet: lista pronta de cidades da Itália, do Brasil e da Europa (aceita o
nome em italiano ou inglês) e nome livre, que o script localiza. Aberto fora do claude.ai, com internet, a página ainda busca o Open-Meteo direto quando o feed não
cobre a hora.

## Sem vazios entre as caixas (`src/11-main.js`, `pack`)

Medido por `testes/furos.py` (o que aparece na tela em cada posição de rolagem, não só a geometria da página): vazio de 120×180 px
ou mais entre caixas, e caixa esticada com 160 px ou mais sem conteúdo dentro.
- **Duas colunas lado a lado** (Rotina, Cockpit, Saúde com agente, Jornada, Lazer, diários das áreas, Conselho, Diário, Dados,
  relatórios com a coluna “O que os dados dizem”, Jardim): a coluna mais curta cresce até a altura útil da janela, sem passar da
  outra; se ainda for mais curta, acompanha a rolagem. O que cresce: a grade de horas da Rotina, a conversa de um mentor, a caixa
  de texto do último cartão, ou o último cartão. Coluna que acompanha a rolagem e é mais alta que a janela para com a base visível.
- **Grades de cartões** (`.g2c`, `.g3c`, Caderno técnico): cada cartão vai para a coluna mais curta ou ocupa a largura toda, o que
  deixar menos vazio; testa as combinações e conta buraco em dobro, caixa esticada e o vazio à direita de um cartão alargado cujo
  conteúdo não acompanha a largura. Cartão com gráfico de largura fixa não é alargado.
- **Relatórios** (`.vg`, 12 colunas): vão que nenhum cartão consegue cobrir esticando para baixo é coberto alargando um vizinho
  cuja faixa de altura cabe nas colunas livres; o gráfico é redesenhado na largura nova (`vw(n, id)`), sem esticar.
- **Última linha incompleta** (Inspiração, Lazer, Filosofia, Biblioteca): os cartões dela dividem a linha toda.
- **Rotina · Semana**: um cabeçalho de datas só (dia, horas planejadas e barra de cumprido); a faixa de dias fica só na vista Dia.

## Guia do Atlas e plano de preenchimento (`src/58-guia.js`)

A quarta aba da janela do Secretário. Para cada área: para que serve (a missão da capa), o que preencher, o mínimo que já vale, o
jeito rápido e a frequência sugerida, com busca. “Acompanhar a aba” faz o guia mostrar a seção da aba em que você está enquanto
navega. Abre por pedido em texto ao Secretário, sem IA (“como preencho os gastos?”, “abre o tutorial da rotina”), pela IA (ferramenta
`abrir_guia`, que devolve a seção para a resposta e abre o guia quando a resposta termina, para não esconder a conversa) e pela
busca do Atlas (“Guia do Atlas”). O conteúdo é genérico e está no código.

O plano pessoal de preenchimento fica só no banco da pessoa (`S.guia.plano`: base, tempo por dia, semana e mês, e itens com aba,
quando, frequência, minutos, como fazer e, se houver, o gatilho: a atividade da rotina em que o preenchimento se encaixa). O guia
mostra o próximo preenchimento (pela rotina dos próximos dias), o plano por frequência e, na seção de cada área, os itens dela.
“Criar os lembretes do plano” transforma cada gatilho num lembrete semanal com o que fazer na nota; se a pessoa já tem um lembrete
da mesma atividade nos mesmos dias, a nota entra nele (dois lembretes da mesma atividade não tocam juntos), e tirar o plano devolve
a nota original sem apagar o lembrete dela.

## Inspiração (`src/59-inspira.js`)

Aba logo depois da Rotina, para começar uma atividade com a cabeça ligada. As atividades da base vêm dos gostos do Lazer e das
atividades de uma rotina comum (idiomas, estudo técnico, leitura, treino, meditação, estudo espírita…); as sugeridas são vizinhas
delas (escrever, observar o céu, esboço à mão, montar, programar para a engenharia, cozinhar, ouvir um álbum, caminhar, ensinar,
fazer o bem). Cada uma tem: por que vale, um texto curto, um aquecimento de 5 minutos em 3 passos com relógio, o primeiro passo do
dia (com “outro desafio” e “Comecei”, que conta os começos e se desfaz), perguntas, frases (só com autor e obra conferidos), vídeos e
músicas como busca no YouTube (o link não quebra quando um vídeo sai do ar), recursos e o atalho para a aba dela. O topo liga o
próximo bloco da Rotina à atividade dele (pelo título, com palavras genéricas). Atividades próprias ficam em `S.inspira.minhas`, e a
IA pode montar a ficha delas (texto, aquecimento, desafios e perguntas).

## IA de acompanhamento (`src/60-coach.js`)

Ativada na Inspiração, assume o perfil da atividade (o mentor do Lazer quando existe; senão, um perfil próprio, como “engenheiro
geotécnico sênior e especialista em BIM”) e passa a viver num botão lateral em todas as abas, acima do Secretário. Motor: o Claude da
página (a mesma IA dos mentores), no nível de esforço escolhido: Baixo (`quick`, respostas curtas), Médio (`default`), Alto
(`complex`, resposta estruturada) e Máximo (`complex`, lendo os dados antes de responder). Ferramentas: `ler_dados`, `ver_aba` e
`anotar_progresso` (notas que voltam nos próximos pedidos). O que a pessoa compartilha fica guardado por atividade e vai em todo
pedido. “Compartilhar a tela” manda junto de cada mensagem o texto da aba aberta e o que está escrito nos campos; “Avaliar esta aba”
abre a aba escolhida e manda o que está nela; onde a visualização aceita imagens, “Capturar a tela” (quando o navegador deixa) ou
“Anexar imagem” manda uma imagem junto da próxima mensagem. A conversa fica guardada por atividade (`S.inspira.ativs[id]`).
No computador, a janela fica ao lado da do Secretário; no celular, abrir uma fecha a outra. No modo exemplo, o acompanhamento some.

## Relatórios: do passado ao presente

Tocar num mês de um gráfico leva a análise para ele, e os gráficos clicáveis (Índice de vida e a matriz das áreas na Visão
geral, Finanças, Relações, Crescimento) continuam mostrando até o mês atual (`historyNav` em `src/03-calc.js`): dá para voltar
tocando no mês de agora. Um mês mais antigo que a janela fica no começo dela, com os seguintes à direita. Nos relatórios, com
outro mês selecionado, uma faixa fixa no alto diz qual é (nos dias 1 a 7, explica que é o mês que acabou de fechar) e traz
“Voltar para <mês atual>”; o “Hoje” do topo continua. Os cartões de números continuam medindo o mês analisado.

## Virada do dia

Com o Atlas aberto depois da meia-noite, a data muda sozinha (a cada minuto e ao voltar para a aba): os registros passam
para o dia novo, e o que estava no dia velho acompanha (mês do relatório, Rotina, Captura e um Painel do dia vazio). Um
rascunho do Painel fica no dia em que foi escrito, com aviso; se um campo estiver em edição, a virada espera ele perder o foco.

## Desfazer e histórico de alterações (`src/01-core.js` + `src/63-historico.js`)

Cada passo desfazível (o `touch` com rótulo) também vai para um histórico com o que mudou item a item: item criado ou apagado numa
lista com `id`, campos mudados de um item, ou o valor que mudou num caminho. O histórico fica neste aparelho (`localStorage`
`atlas4_hx`, até 150 passos e ~900 KB; passo grande demais fica listado sem o desfazer), sobrevive a recarregar a página e junta os
passos de duas abas abertas. Desfazer um passo antigo volta só o que aquele passo mudou e que continua como ele deixou: o que veio
depois fica, e o aviso conta as partes que mudaram de novo. O passo mais recente desfaz pela fotografia da memória, exato.

- **Aviso com Desfazer:** o aviso que vem logo depois de uma mudança ganha o botão Desfazer daquele passo (desfaz aquele, mesmo que
  outro tenha vindo depois). Se a pessoa criou ou apagou algo e o módulo não avisou, o Atlas avisa sozinho (só para o que a pessoa
  acabou de fazer, não para gravações em segundo plano). Salvar uma edição no formulário padrão também avisa. O aviso dura 8 s
  com botão, não some com o mouse em cima, não bloqueia o toque no que está embaixo (só o botão recebe o toque), usa a largura do
  texto no celular e, com uma janela aberta, aparece dentro dela, por cima do fundo escuro (antes ficava atrás, sem dar para tocar).
- **Janela Histórico de alterações:** botão de relógio no topo (ao lado de desfazer e refazer) e na busca (Ctrl K). Lista por dia,
  com a aba, o que mudou (+ criado, − apagado, campos), busca, Desfazer em cada passo, Refazer no que foi desfeito e “Ir para”.
- **Ctrl Z depois de recarregar:** com a memória vazia, a seta de desfazer (que mostra o que vai desfazer) e o Ctrl Z desfazem o
  último passo guardado, e Refazer volta. No modo exemplo, não mexem nos passos dos dados reais.
- **Apagar o que não tinha como apagar:** experimentos (antes só dava para cancelar) e modelos salvos da Rotina.

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
| `lab28.py` | Centros de força: mapa numerado de 1 a 7 no mesmo eixo, sem sobreposição e com a nota ao lado; como trabalhar cada centro pelas virtudes; centro da semana no foco da Bússola e no exame da noite (e o foco anterior de volta); os sete centros com o chakra correspondente, os 17 valores da Bússola uma vez cada, seção agrupada no Espiritismo, mapa por toque e teclado, sinais conferidos em Python, autoavaliação (marca, troca, desmarca, desfaz), harmonização guiada que vira sessão (e aparece em Práticas), encerrar cedo não registra, sair da página para o relógio, reflexão e prática pelo centro, resumo no pilar, fatos dos mentores sem números de saúde, celular |
| `lab29.py` | Correções da auditoria: virada do dia com o app aberto (e a espera do campo em edição), sábado fixo (Cockpit e sobrecarga), minhas tarefas do Cockpit no Hoje, Secretário, Rotina, Painel e Fechamento, e o interruptor; “ok” do Cockpit só no lote mais recente; Google Agenda com hora local; modo exemplo que não liga sem salvar, cofre, radar e jardim; Contexto no celular; diagonal dos Cruzamentos; fontes espíritas; uma frase no Painel paga uma ocorrência da conta |
| `lab30.py` | Rotina, Hoje e Painel: leitor de horário (faixa, início, e nada para duração, quantidade, data ou prazo), tarefas e compromissos com horário na faixa certa, cartão para virar bloco, concluir e apagar (com desfazer) e pelo teclado, Secretário propondo bloco para atividade com horário, tempo livre em horas com valor escrito, Recomeçar do zero do Painel com desfazer, celular |
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
| `lab31.py` | Atlas 4 · gravação: `merge3` (listas por id, objetos por campo, sem base nada se apaga), dois aparelhos que não se apagam, aviso ao vivo, trava entre aparelhos, desfazer descartado, gravar ao esconder, partes por geração (e gravação interrompida), diário de escrita reaplicado (inteiro e unido), conta que não responde ao abrir e volta |
| `lab32.py` | Atlas 4 · o resto do diagnóstico: XSS e `safeHtml`, backup com formato conferido, Diário 50 por vez, teclado (setas e Enter), campos com nome, tabelas dos gráficos, contraste do tema claro, toque de 24 px, menu com 8 fixas e contagem de uso, Painel (roteiro, três estados, modo rápido, lembrete), dias 1–7, KPIs sem registro, backup lembrado, serviços externos, uso e avaliação da IA, primeiros passos, nomes novos, Google Agenda tolerante, modo local avisado |
| `lab33.py` | Atlas 4 · dados fictícios só com o Exemplo: A Dois vazia (antes e depois de entrar), sem banco, com conteúdo real da outra pessoa e em só leitura, Exemplo ligado (marcado, sem gravar) e desligado de novo; varredura das 151 telas com o banco vazio contra os textos que só existem nos dados de exemplo |
| `lab34.py` | Atlas 4 · Rotina › Capturar o dia: separação sem IA (pontuado, corrido, “até as 16h”, duração não é hora), faixas de meia hora sem sobrepor, pedido e resposta da IA, bloco planejado marcado em vez de repetido, revisão (horário, categoria, desmarcar), grade, banco, desfazer, voz do navegador com separação ao parar, sem voz (ditado do teclado), celular, outro dia, Capturar geral → Rotina, sem IA e erro da IA |
| `lab35.py` | Atlas 4 · modelo com as cores da planilha (não se aplica sozinho, lista com o tamanho, aplicado no dia da semana certo, fundo e letra na grade e no mês, copiar, duplicar e salvar como modelo mantêm a cor, bloco sem cor segue a categoria) e compromisso anual (todo ano desde a data, 29/02, dia todo na Rotina, ano seguinte, cartão, formulário, edição mantém, mês, Visão geral sem repetir o aniversário da ficha) e aniversário na pessoa (cartão, ficha com idade ou “ano não informado”, formulário com ano opcional, 31/02 recusado, nome e ano novos, calendário que acompanha a ficha, tocar abre a ficha, tirar a data tira do calendário) |
| `lab36.py` | Atlas 4 · IA com os dados no detalhe: o Mentor do Dinheiro recebe todos os lançamentos (um por linha, do mais recente), orçamento e assinaturas, e `ler_dados` no fim da lista (com limite 3, as duas primeiras do agente e `ler_dados`; com limite 10, o Nutri cede `consultar_treinos` e o PMO mantém a ordem da configuração); dados aninhados inteiros (séries do último treino); a soma por mês da ferramenta bate com a conta direta; a conversa e o registro de Privacidade anotam a leitura; os 29 mentores têm `ler_dados` e os das áreas recebem seus dados, todos abaixo de 256 KB; Secretário, Conselho e IAs de tarefa única com catálogo e ferramenta (e sem ferramentas, como antes); catálogo, paginação, período, busca, soma por campo, JSON, check-ins por setor, 32 KB; privacidade (setor sem IA, `#privado`, campos de setor privado) |
| `lab37.py` | Atlas 4 · Rotina › Limpar: um botão na barra nas três vistas (dia, semana, mês); o diálogo conta os blocos, a tarefa com horário (marcada) e o que fica, abre com o foco em Cancelar, e nada muda antes de confirmar; Cancelar e Esc não mexem em nada; o dia, os 7 dias e o mês ficam vazios na conta e na tela, com os vizinhos intactos; avulsos apagados, repetições só no período (as séries continuam); tarefa com horário sai (ou fica, com a caixa desmarcada) e a sem horário fica; agenda, aniversários e Cockpit intactos; Ctrl+Z desfaz num passo só; período vazio só avisa; celular sem rolagem lateral |
| `lab38.py` | Atlas 4 · modo exemplo sem sobras: dois toques com gravação pendente (os seus dados ficam intactos); toque no meio de uma gravação em andamento (o botão mostra “Ligando…”, a gravação termina com os seus dados e nenhum do exemplo no banco); duplo toque em “Desligar” e no botão do topo; IA respondendo e dados abrindo não trocam; o que outro aparelho grava durante o exemplo entra nos seus dados ao desligar; rascunhos, textos da IA e o aviso “14 coisas” voltam aos seus; contagem de uso não segura a troca e é gravada depois; 14 telas sem nenhum texto do exemplo depois de desligar |
| `lab39.py` | Atlas 4 · jardim fluido: filtros viram imagens (só a chama do incenso fica viva), sombra do leque sem filtro CSS, 60 quadros por segundo de dia, à noite com névoa e no celular, as mesmas animações antes e depois, desenho igual (diferença média abaixo de 3/255, menos de 1% dos pixels acima de 24), realce ao passar o mouse, toque e teclado, redesenho rápido, refaz ao mudar muito de tamanho, e sem canvas aparece como antes |
| `lab40.py` | Atlas 4 · clima automático: hora de agora no fuso da cidade (aparelho em UTC), mínima e máxima só do dia de Roma, chuva com as horas e guarda-chuva, próximas 6 horas, atualização do banco sem recarregar, nenhuma busca na internet com o feed válido, trocar cidade sem internet (lista, nome em italiano, nome livre e fuso de Lisboa), cidade não encontrada, feed velho, banco sem feed, celular |
| `lab41.py` | Atlas 4 · Índice de vida do passado ao presente: tocar num mês mantém o gráfico até o mês atual, faixa “Voltar para…” fixa ao rolar, voltar pelo gráfico, pela faixa e pelo topo, mês mais antigo que a janela, Finanças, Relações e Crescimento, números do mês analisado, dias 1 a 7, celular |
| `lab42.py` | Atlas 4 · Rotina › Preencher: ordem Básica, Intermediária, Avançada e depois os outros, horas por categoria, substituir a semana (avulso sai, tarefa fica, repetição sai só da semana), sem substituir (conflitos pulados), dia, mês (agenda fica e o bloco que bate é pulado), um passo de desfazer, seletor do painel, celular |
| `lab43.py` | Atlas 4 · lembretes semanais: criar no painel e no cartão (“só às sextas”), desfazer, aviso na hora certa e uma vez, bloco marcado e regra pausada não avisam, Secretário lista os semanais, Google Agenda (3 eventos semanais com aviso, sincronização os ignora, atualizar, tirar, apagar a regra, resposta sem id), modo exemplo não avisa |
| `lab44.py` | Atlas 4 · Guia no Secretário: aba Guia, todas as áreas do menu, acompanhar a aba, busca, pedido em texto (“como preencho os gastos?”), ferramenta abrir_guia depois da resposta, busca do Atlas, plano fictício (próximo preenchimento, por frequência, itens na seção), lembretes do plano com nota (juntando ao lembrete que a pessoa já tinha), aviso com a nota, tirar sem levar os da pessoa, celular |
| `lab45.py` | Atlas 4 · Inspiração: lugar no menu, catálogo conferido (frases com fonte, links, aquecimento, desafios), grupos e busca, próximo bloco da rotina, detalhe com links em aba nova, relógio do aquecimento, outro desafio, Comecei e desfazer, atividade própria com ficha da IA, celular |
| `lab46.py` | Atlas 4 · IA de acompanhamento: ativar, perfil e esforço no pedido (quick/default/complex), ferramentas, contexto guardado, tela compartilhada (texto da aba e campos), avaliar outra aba, imagem anexada só onde há imagens, notas de progresso, ao lado do Secretário, desativar e reativar com a conversa, outra atividade com outro perfil, celular (uma janela de cada vez), modo exemplo |
| `flows.py`, `edge.py`, `sjflows.py` | fluxos herdados do Atlas original |
| `lab47.py` | Atlas 4 · sem vazios entre as caixas: Rotina na Semana com um cabeçalho de datas só (a faixa de dias só no Dia), grade da Rotina na altura útil da janela acompanhando a rolagem e terminando junto com os painéis, a janela mais alta faz a grade crescer, coluna principal curta cresce até a lateral (Cockpit · Mês), relatório alarga o cartão e redesenha o gráfico sem esticar, nenhum vazio de 120×180 px em 21 telas em nenhuma posição de rolagem, cartão sozinho na largura toda, celular sem ajustes e sem rolagem lateral |
| `lab49.py` | Atlas 4 · lembretes com data e hora (14 frases, formulário no Secretário e na Rotina, campo mexido à mão, grade, Mês, minicalendário, Hoje, cartão com Feito só do dia, Tirar só deste dia, Apagar com Desfazer, “Lembrete aqui”, aviso na hora e N min antes, diário uma vez por dia, atrasados, proposta da IA, Google Agenda com repetição e aviso, desfazer que tira o evento do Google) e desfazer em qualquer aba (Desfazer em criar e editar, aviso dentro da janela aberta, histórico com passo antigo, conflito, Desfazer de um aviso antigo, aviso automático, apagar experimento e modelo, recarregar e Ctrl Z, campo vazio, duas abas, modo exemplo, celular) |
| `lab48.py` | Atlas 4 · Rotina › lista suspensa de atividades: só as do modelo Standard, uma vez cada, a cor de mais minutos; abre na célula com a busca em foco, dois grupos (Standard e Outras), cor de cada uma, combobox e listbox; escolher preenche com nome, categoria, fundo e letra; vizinho igual cresce; arrastar por cima de bloco ocupado preenche só o livre (e o aviso diz), desfazer, juntar dos dois lados; setas, Esc, clicar fora; criar em Outras pela busca com seletor de cor e prévia, banco, aparece no grupo Outras; nome repetido recusado, Voltar; “Mais opções…” com sugestões e categoria; “Trocar atividade” no cartão; “Atividades e cores” (recolorir e renomear levam os blocos, adicionar com categoria sugerida, excluir deixa os blocos, escolher o modelo de origem); texto rápido; semana; celular com painel de baixo sem teclado e opções de 44 px |
| `furos.py 1440 900 ex` | varredura de todas as telas (largura, altura, `ex` ou `vazio`): vazio entre caixas e caixa esticada, em cada posição de rolagem |
| `smoke.py 390 dark`, `holes.py 1024` | todas as páginas numa largura/tema; buracos entre cartões |

Dependências: `playwright`, `python-dateutil`, `pdftotext`/`pdfinfo` (poppler). O livro em PDF carrega o jsPDF do
cdnjs; para testar sem internet, coloque `jspdf.umd.min.js` (2.5.1) em `testes/`. `CHROMIUM_PATH` aponta outro Chromium.
