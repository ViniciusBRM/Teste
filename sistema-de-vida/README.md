# Sistema de Gestão da Vida (Excel)

Planilha única para acompanhar todas as áreas da vida, com um Dashboard que se atualiza sozinho a partir das abas temáticas.

| Arquivo | Para quê |
|---|---|
| `Sistema_de_Vida_2026.xlsx` | Modelo vazio, pronto para usar. |
| `Sistema_de_Vida_2026_EXEMPLO.xlsx` | O mesmo sistema preenchido com dados fictícios de jan–set/2026, para ver tudo funcionando. |
| `gerar_planilha.py` | Gera os dois arquivos do zero (`python3 gerar_planilha.py --ano 2027` para outro ano). |

## Abas

**Dashboard** (16 indicadores, placar das 11 áreas da vida com percepção × dados, Roda da Vida, foco e reflexão,
listas de "atenção agora" e 11 gráficos) · **Roda da Vida** (nota mensal por área + revisão mensal) · **Metas**
(visão, metas com progresso × ritmo esperado e horizonte curto/médio/longo) · **Tarefas** (projetos, banco de ideias,
tarefas com alerta e matriz de Eisenhower) · **Finanças** (lançamentos) · **Orçamento** (planejado × realizado,
patrimônio, 50/30/20) · **Saúde** (registro diário, consultas) · **Hábitos** (grade anual, sequências) · **Carreira**
(competências, candidaturas, conquistas) · **Relações** (frequência de contato, aniversários) · **Aprendizado** ·
**Lazer** (registro + lista de sonhos) · **Casa** (documentos, rotinas, assinaturas) · **Guia** · **Config** ·
**Cálculos** (motor transparente do Dashboard).

O mês exibido no Dashboard é escolhido na célula "Mês de referência" (padrão: mês atual).

## Detalhes técnicos

- Só fórmulas compatíveis com Excel 2010+ e LibreOffice (sem `XLOOKUP`, `FILTER`, `MINIFS`, macros ou `TEXT` com
  formato dependente de idioma).
- Se o LibreOffice estiver instalado, o gerador recalcula uma cópia e grava os resultados como cache no arquivo,
  para que pré-visualizações (celular, navegador) mostrem os números. O Excel recalcula tudo ao abrir.
- Verificação feita na geração: 15.408 fórmulas por arquivo, 0 erros.
