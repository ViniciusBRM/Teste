# Atlas da Vida 2 · código-fonte

O app é um arquivo só, `../atlas-da-vida-2.html`, montado a partir dos módulos em `src/`. O Atlas da Vida original
(`../atlas-da-vida.html`) continua separado e não é tocado por este build.

- `python3 build.py` monta o HTML e, se o Node estiver instalado, confere a sintaxe do JavaScript.
- `src/00-head.html` tem o esqueleto e os estilos; os módulos `01` a `33` entram na ordem definida no `build.py` (`24-jornada.js` é a Jornada existencial, com a Bússola moral dentro; `25-carreira.js` é o hub de Carreira; `26-lazer.js` é o Lazer, com oito divisões e seus mentores; `27-painel.js` é o Painel do dia; `28-capas.js` as capas, missões, manuais e o Mapa do Atlas; `29-hoje2.js` o Hoje; `30-casa.js` a Casa; `31-futuro.js` Futuro financeiro e Itália & Brasil; `32-idiomas.js` Idiomas; `33-carreira2.js` Caderno técnico e Rede profissional).

## Testes (Playwright + Chromium)

Rode de dentro de `testes/`, depois do build. Cada script imprime `PASS`/`FAIL` por verificação e o total no fim.

| Script | O que cobre |
|---|---|
| `lab1.py` | privacidade (cofre, sem-IA, registro de leitura), captura sem atrito, experimentos A/B |
| `lab2.py` | radar (contra cálculo independente), fechamento semanal, capítulos e livro em PDF, busca por significado |
| `lab3.py` | espaço a dois (duas pessoas), agenda .ics (recorrências contra a `python-dateutil`), Apple Health, Google Fit, Notion, extrato que aprende |
| `lab4.py` | bússola moral: valores, foco, exame da noite (índice conferido à parte), decisões com revisita, caminhos, Hoje |
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
