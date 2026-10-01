# Cartellino de Ponto

Ponto eletrônico pessoal com painel executivo no estilo Power BI. Registra as quatro marcações do dia
(ingresso, ingresso almoço, uscita almoço, uscita), eventos especiais com comprovantes em foto e calcula
horas trabalhadas, horas extras, banco de horas, faltas, abonos, férias restantes e trasferte.

É um único arquivo HTML, sem dependências de build nem servidor. Abra `index.html` no navegador e use.

## Páginas

| Página | O que faz |
|---|---|
| **Resumo** | 8 KPIs (horas trabalhadas, saldo do período, banco de horas, extras, faltas, abonos, férias restantes, trasferte) com comparação ao período anterior; gráficos de horas por dia contra a jornada, cumprimento de jornada, tendência de horários, distribuição de eventos, banco de horas acumulado e média por dia da semana. Filtro de período: últimos 30 dias, este mês, mês anterior, últimos 3 meses, ano ou intervalo livre. Cada gráfico tem **modo foco** e **ver como tabela**. |
| **Diário** | Botão **Bater ponto** (preenche a próxima marcação com a hora atual), edição manual das 4 marcações, foto por marcação, tipo do dia, campos de trasferta e abono, comprovantes, notas, linha do tempo do dia, alertas (almoço curto, jornada acima de 10h, atraso, marcação incompleta) e a semana. |
| **Mensal** | Calendário com código e cor do tipo de cada dia, horas, saldo, feriados e dias sem registro; totais do mês. |
| **Registros** | Tabela com busca, filtro por datas e tipos, "só saldo negativo", "só com fotos", ordenação por coluna, paginação e exportação CSV do que está filtrado. |
| **Relatórios** | Espelho de ponto mensal (pronto para assinatura), resumo anual com barras de dados, exportação de espelho em HTML, CSV do mês, CSV completo, backup e restauração em JSON (com fotos). |
| **Ajustes** | Perfil, jornada por dia da semana, ingresso previsto, almoço mínimo, tolerância diária, direito de férias, banco de horas inicial, calendário de feriados (Itália, Brasil ou nenhum) e feriados locais. |

## Tipos de dia

| Código | Tipo | Efeito no cálculo |
|---|---|---|
| P | Presencial | Horas reais contra a jornada |
| SW | Smart working | Igual ao presencial |
| T | Trasferta | Sem marcações conta a jornada prevista; com marcações valem as horas reais |
| F | Férias | Dia abonado; desconta do saldo anual de férias |
| FO | Folga | Dia abonado, sem efeito no banco de horas |
| BH | Compensação | Debita a jornada do dia do banco de horas |
| A | Atestado médico | Abono do dia inteiro ou de horas (parcial) |
| L | Licença / permesso | Abono do dia inteiro ou de horas (parcial) |
| FE | Feriado | Jornada prevista zero; horas trabalhadas viram extra |
| X | Falta | Desconta a jornada prevista e conta como falta |

Diferenças até a tolerância diária (padrão 10 min) não geram saldo. Dias úteis passados sem registro
aparecem como pendências, sem virar falta automaticamente.

## Onde os dados ficam

- **Aberto como arquivo (`index.html`)**: registros e fotos ficam no IndexedDB do navegador. Use
  *Relatórios → Backup (JSON)* com frequência; limpar os dados do navegador apaga tudo.
- **Publicado como Artifact no claude.ai**: cada pessoa que abre o painel tem um espaço privado no banco
  de dados do artefato (`data/users/<id>/`), sincronizado entre dispositivos. Fotos são comprimidas
  (cerca de 100–200 KB) e guardadas no mesmo espaço privado.
- Sem nenhum registro, o painel mostra **dados de exemplo** gerados na hora (nunca gravados). A primeira
  batida ou edição sai do exemplo.

## Desenvolvimento

```
src/cartellino.html   fonte (formato de página de Artifact, sem <html>/<head>/<body>)
index.html            versão independente, gerada a partir da fonte
scripts/build.mjs     gera index.html
tests/core.test.mjs   testes do núcleo de cálculo (feriados, jornada, resumo, férias, CSV, exemplo)
```

```bash
npm run build   # regenera index.html depois de editar src/cartellino.html
npm test        # roda os testes do núcleo
```

O núcleo de cálculo (`<script id="core">`) não toca no DOM e é testado isoladamente em Node.
