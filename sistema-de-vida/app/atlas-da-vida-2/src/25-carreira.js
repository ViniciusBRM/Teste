/* ================================================================ carreira: hub de BIM, infraestrutura e geotecnia
   Uma chave, carreira: { perfil, fortes, gaps, obj, acoes, trilhas, lib, geo, snaps, analise }. As competências usam a mesma
   lista do Atlas (S.comp: nome, atual, alvo, 1 a 5), acrescida de grupo e evidência, para a página Crescimento › Carreira
   e o Mentor da Carreira enxergarem o mesmo. A aderência às trilhas é uma conta aberta, mostrada na tela. */
const CR = { grp: "todos", lib: { top: "todos", st: "todos", q: "" }, f: {}, open: {} };
const CR_LV = ["não avaliado", "conheço", "uso com apoio", "autônomo", "avançado", "referência"];
const CR_GRP = [
  ["infra", "Infraestrutura viária", "var(--a-car)"], ["est", "Estruturas e edificações", "var(--a-apr)"], ["gest", "Gestão BIM", "var(--a-pro)"],
  ["plan", "Planejamento e custos (4D/5D)", "var(--a-fam)"], ["dados", "Dados, GIS e automação", "var(--a-men)"], ["geo", "Geotecnia", "#c58b55"]];
const CR_COMP = [
  ["AutoCAD Civil 3D", "infra", "software", /civil ?3d/i], ["InfraWorks", "infra", "software"], ["Geometria viária", "infra", "disciplina", /^geometria/i], ["Terraplenagem", "infra", "disciplina"],
  ["Drenagem", "infra", "disciplina"], ["Sinalização", "infra", "disciplina"], ["Pavimentação", "infra", "disciplina"], ["Ferrovias", "infra", "disciplina"],
  ["Revit", "est", "software", /revit/i], ["Robot Structural Analysis", "est", "software", /robot/i], ["Eberick", "est", "software"], ["Projeto arquitetônico", "est", "disciplina"],
  ["Projeto estrutural", "est", "disciplina"], ["Projeto elétrico", "est", "disciplina"], ["Projeto hidrossanitário", "est", "disciplina"],
  ["BEP (BIM Execution Plan)", "gest", "processo", /\bbep\b|execution plan/i], ["ISO 19650", "gest", "norma"], ["UNI 11337", "gest", "norma"], ["IFC e openBIM", "gest", "processo", /\bifc\b|openbim/i],
  ["CDE (ambiente comum de dados)", "gest", "processo", /\bcde\b/i], ["Coordenação e clash detection", "gest", "processo", /clash|coordena/i], ["Navisworks", "gest", "software"],
  ["EAP (estrutura analítica do projeto)", "gest", "processo", /\beap\b|\bwbs\b/i], ["Liderança e comunicação", "gest", "pessoal", /lideran|gest[aã]o de (projetos|equipe)/i], ["Didática e produção de conteúdo", "gest", "pessoal"],
  ["Microsoft Project", "plan", "software", /ms project|microsoft project/i], ["Cronograma 4D", "plan", "processo", /\b4d\b/i], ["Orçamento 5D", "plan", "processo", /\b5d\b|or[cç]amento/i], ["Primavera P6 ou Synchro", "plan", "software", /primavera|synchro/i],
  ["Power BI", "dados", "software"], ["QGIS", "dados", "software", /qgis|\bgis\b/i], ["Dynamo", "dados", "software", /dynamo/i], ["Python", "dados", "linguagem", /python/i],
  ["Mecânica dos solos", "geo", "disciplina"], ["Investigação geotécnica (SPT, CPT)", "geo", "disciplina", /sondage|investiga/i], ["Fundações", "geo", "disciplina"],
  ["Taludes e contenções", "geo", "disciplina", /talude|conten/i], ["Modelagem geotécnica 3D", "geo", "processo", /leapfrog|modelagem geot/i], ["Eurocódigo 7 e NTC 2018", "geo", "norma", /eurocod|ntc/i],
].map(([n, g, tipo, al]) => ({ n, g, tipo, al }));
/* trilhas: req = [competência, nível pedido, peso] */
const CR_TRI = [
  { id: "infra", t: "Coordenação BIM de infraestrutura", papel: "BIM Coordinator ou Specialist em rodovias e ferrovias, em projetistas, construtoras e concessionárias",
    req: [["AutoCAD Civil 3D", 4, 3], ["InfraWorks", 3, 1], ["Geometria viária", 3, 2], ["Terraplenagem", 3, 2], ["Drenagem", 3, 1], ["Navisworks", 3, 2], ["Coordenação e clash detection", 3, 2], ["IFC e openBIM", 3, 2], ["ISO 19650", 3, 1], ["BEP (BIM Execution Plan)", 3, 1]],
    it: "Desde 2025, obras públicas novas acima de 2 milhões de euros exigem BIM (D.Lgs. 36/2023, art. 43 e Anexo I.9), e a Missão 3 do PNRR é dedicada à infraestrutura de mobilidade, sobretudo ferrovias.",
    br: "O Decreto 10.306/2020 escalona a adoção do BIM nas obras federais.",
    certs: ["Autodesk Certified Professional: Civil 3D for Infrastructure Design", "buildingSMART Professional Certification – Foundation", "BIM Coordinator certificado pela UNI 11337-7 (UNI/PdR 78:2020)"],
    passo: "Montar um modelo federado de um trecho viário (Civil 3D e InfraWorks levados ao Navisworks) com relatório de interferências, para o portfólio.", lib: ["acp_c3d", "ifc43", "dm2001", "au"] },
  { id: "manager", t: "Gestão da informação e BIM Manager", papel: "BIM Manager ou Information Manager (ISO 19650), dono do BEP, do CDE e dos fluxos de aprovação",
    req: [["BEP (BIM Execution Plan)", 4, 3], ["ISO 19650", 4, 3], ["UNI 11337", 3, 2], ["CDE (ambiente comum de dados)", 3, 2], ["EAP (estrutura analítica do projeto)", 3, 1], ["Coordenação e clash detection", 3, 2], ["Liderança e comunicação", 4, 2], ["IFC e openBIM", 3, 1], ["Navisworks", 3, 1]],
    it: "A UNI 11337-7 define as figuras de BIM Specialist, Coordinator, Manager e CDE Manager, e a UNI/PdR 78:2020 permite certificá-las; editais públicos costumam valorizar essas figuras na avaliação técnica.",
    br: "Órgãos e construtoras que seguem o Decreto 10.306/2020 precisam de quem escreva o plano de execução e organize o ambiente de dados.",
    certs: ["BIM Manager certificado pela UNI 11337-7 (UNI/PdR 78:2020), por organismo acreditado na Accredia", "Curso de ISO 19650 com certificado (BSI, BRE ou equivalente)", "buildingSMART Professional Certification – Foundation"],
    passo: "Escrever um BEP completo, de pré e pós-contrato (ISO 19650-2), para um projeto real ou fictício, e revisá-lo com alguém da área.", lib: ["iso19650", "ukbim", "uni11337", "pdr78"] },
  { id: "plan", t: "Planejamento 4D/5D e controle de obras", papel: "Planejador BIM 4D/5D, Project Controls ou orçamentista BIM em construtoras",
    req: [["EAP (estrutura analítica do projeto)", 4, 2], ["Microsoft Project", 4, 2], ["Cronograma 4D", 4, 3], ["Orçamento 5D", 3, 3], ["Navisworks", 3, 2], ["Power BI", 3, 1], ["Primavera P6 ou Synchro", 2, 1]],
    it: "O orçamento de obras públicas usa os preçários regionais (prezzari regionali), e softwares como PriMus (ACCA) e STR Vision são comuns; ligar o modelo à composição de custos é um diferencial.",
    br: "SINAPI e SICRO são as referências de custo das obras públicas.",
    certs: ["CAPM ou PMP (PMI)", "Treinamento em Primavera P6 ou Synchro 4D"],
    passo: "Ligar um cronograma do MS Project a um modelo no Navisworks (Timeliner) e gravar a simulação 4D de uma obra.", lib: ["navis", "pmi", "synchro", "prezzari"] },
  { id: "geo", t: "BIM aplicado à geotecnia", papel: "Especialista em modelagem geotécnica e obras de terra em projetos de infraestrutura",
    req: [["AutoCAD Civil 3D", 4, 2], ["Terraplenagem", 4, 2], ["Drenagem", 3, 1], ["Mecânica dos solos", 3, 3], ["Investigação geotécnica (SPT, CPT)", 3, 2], ["Modelagem geotécnica 3D", 3, 3], ["QGIS", 3, 1], ["IFC e openBIM", 2, 1], ["Taludes e contenções", 2, 1]],
    it: "As NTC 2018 (cap. 6) e o Eurocódigo 7 regem o projeto geotécnico; ferrovias e rodovias dependem de modelos de terreno e de sondagens bem integrados.",
    br: "Obras viárias brasileiras usam sondagem SPT (NBR 6484) em larga escala; levar esses dados para o modelo ainda é pouco comum.",
    certs: ["Cursos de Leapfrog Works (Seequent) e de PLAXIS (Bentley)", "Especialização em geotecnia, se quiser assinar projetos geotécnicos"],
    passo: "Importar sondagens no Autodesk Geotechnical Module (complemento do Civil 3D) e gerar as superfícies das camadas de um trecho.", lib: ["geomodule", "pinto", "leapfrog", "ifc43"] },
  { id: "dados", t: "Automação e dados BIM", papel: "BIM Developer, Computational Designer ou analista de dados de projeto",
    req: [["Dynamo", 4, 3], ["Python", 3, 3], ["Power BI", 3, 2], ["Revit", 3, 1], ["IFC e openBIM", 3, 1], ["AutoCAD Civil 3D", 3, 1]],
    it: "Escritórios que entram no BIM por obrigação de edital precisam padronizar e automatizar: quantitativos, verificação de modelos, relatórios.",
    br: "Automação em Dynamo e Python é procurada em escritórios que já modelam e querem ganhar escala.",
    certs: ["Microsoft PL-300 (Power BI Data Analyst)"],
    passo: "Automatizar uma tarefa repetitiva real (numeração de folhas, quantitativos para Excel) com Dynamo e Python, e medir o tempo economizado.", lib: ["dynamo", "abs", "pl300", "ifcopenshell"] },
  { id: "gis", t: "GIS-BIM e gêmeos digitais de infraestrutura", papel: "Especialista GIS-BIM em infraestrutura, território e cidades",
    req: [["QGIS", 4, 3], ["InfraWorks", 3, 2], ["AutoCAD Civil 3D", 3, 2], ["Power BI", 3, 1], ["Python", 2, 1], ["IFC e openBIM", 2, 1]],
    it: "A ISPRA publica cartografia geológica e o inventário de deslizamentos (IFFI), base para estudos de traçado e de risco.",
    br: "Prefeituras e concessionárias usam GIS para gestão de ativos; integrar com o modelo BIM é o passo seguinte.",
    certs: ["Cursos de QGIS de formadores certificados (lista no site do QGIS)"],
    passo: "Montar no QGIS o contexto de um trecho (relevo, hidrografia, uso do solo) e levá-lo ao InfraWorks ou ao Civil 3D.", lib: ["qgis", "ispra", "speckle"] },
  { id: "consult", t: "Consultoria BIM independente (libero professionista)", papel: "Serviços de BEP, coordenação e modelagem para escritórios e construtoras",
    req: [["BEP (BIM Execution Plan)", 4, 2], ["Coordenação e clash detection", 3, 2], ["Revit", 4, 2], ["AutoCAD Civil 3D", 3, 1], ["Liderança e comunicação", 4, 2], ["ISO 19650", 3, 1], ["UNI 11337", 3, 1]],
    it: "Para quem é empregado, atuar em paralelo exige respeitar o dever de fidelidade (art. 2105 do Código Civil, que proíbe concorrer com o empregador) e as cláusulas do contrato. Pede Partita IVA (o regime forfettario é o mais usado no início) e contribuição previdenciária (Inarcassa, se inscrito no Albo; senão, Gestione Separata do INPS). Assinar projetos como engenheiro exige inscrição no Albo, que para diplomas de fora da UE passa pelo reconhecimento no Ministério da Justiça; coordenação BIM, em geral, não exige assinatura. Confirme com a Ordine e com um commercialista.",
    br: "Como PJ, os pacotes de serviço (BEP, coordenação mensal, modelagem) se vendem bem para escritórios pequenos que precisam cumprir exigências BIM.",
    certs: ["Certificação UNI 11337-7 (dá credencial objetiva a quem contrata)"],
    passo: "Definir dois pacotes de serviço com escopo e preço (por exemplo, BEP mais coordenação mensal) e oferecê-los a cinco escritórios.", lib: ["riconoscimento", "cni", "inarcassa", "accredia"] },
  { id: "ensino", t: "Cursos e treinamentos", papel: "Instrutor BIM e criador de cursos em português e italiano",
    req: [["AutoCAD Civil 3D", 4, 2], ["Revit", 4, 1], ["Dynamo", 3, 1], ["Didática e produção de conteúdo", 4, 3], ["Liderança e comunicação", 3, 1]],
    it: "Escolas e ordens profissionais oferecem formação contínua obrigatória para engenheiros inscritos, o que mantém demanda por cursos técnicos.",
    br: "Conteúdo de BIM para infraestrutura em português é menos comum que o de edificações; vale testar a demanda antes de investir.",
    certs: ["Autodesk Certified Instructor (ACI)"],
    passo: "Gravar uma aula curta (10 minutos) sobre um fluxo do Civil 3D e publicar para medir o interesse.", lib: ["au", "acp_c3d"] },
];
const CR_TOP = [["gest", "Gestão e normas BIM"], ["infra", "Infraestrutura"], ["est", "Estruturas e edificações"], ["plan", "4D/5D"], ["dados", "Dados e automação"], ["gis", "GIS"], ["geo", "Geotecnia"], ["merc", "Mercado e profissão"]];
const CR_LIB = [
  { id: "iso19650", top: "gest", tipo: "norma", t: "Série ISO 19650", d: "Gestão da informação com BIM: conceitos (parte 1), fase de entrega (2), operação (3), troca de informação (4) e segurança (5).", comp: ["ISO 19650", "BEP (BIM Execution Plan)", "CDE (ambiente comum de dados)"] },
  { id: "ukbim", top: "gest", tipo: "site", free: true, t: "UK BIM Framework", url: "https://www.ukbimframework.org", d: "Guias gratuitos e práticos para aplicar a ISO 19650, com modelos de documentos.", comp: ["ISO 19650", "BEP (BIM Execution Plan)", "CDE (ambiente comum de dados)"] },
  { id: "uni11337", top: "gest", tipo: "norma", t: "UNI 11337 (partes 1 a 7)", url: "https://www.uni.com", d: "A norma italiana de gestão digital da construção; a parte 7 define as figuras BIM.", comp: ["UNI 11337"] },
  { id: "pdr78", top: "gest", tipo: "norma", t: "UNI/PdR 78:2020", url: "https://www.uni.com", d: "Requisitos para certificar BIM Specialist, Coordinator, Manager e CDE Manager conforme a UNI 11337-7.", comp: ["UNI 11337"] },
  { id: "dlgs36", top: "gest", tipo: "norma", t: "D.Lgs. 36/2023 – Codice dei contratti pubblici (Anexo I.9)", url: "https://www.normattiva.it", d: "As regras do BIM nas obras públicas italianas, obrigatório nas obras novas acima de 2 milhões de euros desde 2025.", comp: ["UNI 11337", "BEP (BIM Execution Plan)"] },
  { id: "bsi", top: "gest", tipo: "certificação", t: "buildingSMART Professional Certification – Foundation", url: "https://www.buildingsmart.org", d: "Certificação de base em openBIM (IFC, BCF e conceitos), reconhecida internacionalmente.", comp: ["IFC e openBIM"] },
  { id: "handbook", top: "gest", tipo: "livro", t: "BIM Handbook (Sacks, Eastman, Lee e Teicholz, 3ª ed., 2018)", d: "A referência de fundo sobre BIM para todos os agentes do projeto e da obra.", comp: ["IFC e openBIM", "Coordenação e clash detection"] },
  { id: "dec10306", top: "gest", tipo: "norma", t: "Decreto 10.306/2020 (Estratégia BIM BR)", url: "https://www.planalto.gov.br", d: "O cronograma de adoção do BIM nas obras federais brasileiras.", comp: [] },
  { id: "au", top: "infra", tipo: "curso", free: true, t: "Autodesk University – aulas gravadas", url: "https://www.autodesk.com/autodesk-university", d: "Centenas de aulas sobre Civil 3D, InfraWorks, Navisworks, Revit e fluxos de infraestrutura.", comp: ["AutoCAD Civil 3D", "InfraWorks", "Navisworks", "Revit", "Didática e produção de conteúdo"] },
  { id: "acp_c3d", top: "infra", tipo: "certificação", t: "Autodesk Certified Professional: Civil 3D for Infrastructure Design", url: "https://www.autodesk.com/certification", d: "A certificação oficial de Civil 3D para projeto de infraestrutura.", comp: ["AutoCAD Civil 3D", "Geometria viária", "Terraplenagem", "Drenagem"] },
  { id: "c3dhelp", top: "infra", tipo: "site", free: true, t: "Ajuda e tutoriais oficiais do Civil 3D e do InfraWorks", url: "https://help.autodesk.com", d: "Documentação com tutoriais passo a passo de alinhamentos, corredores, superfícies e redes de drenagem.", comp: ["AutoCAD Civil 3D", "InfraWorks", "Pavimentação", "Sinalização"] },
  { id: "ifc43", top: "infra", tipo: "norma", t: "IFC 4.3 (ISO 16739-1:2024)", url: "https://www.buildingsmart.org", d: "O IFC passou a cobrir alinhamento, rodovias, ferrovias, pontes, portos e geotecnia.", comp: ["IFC e openBIM", "Ferrovias", "Modelagem geotécnica 3D"] },
  { id: "dm2001", top: "infra", tipo: "norma", t: "DM 5/11/2001 – Norme funzionali e geometriche per la costruzione delle strade", d: "A referência italiana de projeto geométrico de estradas.", comp: ["Geometria viária"] },
  { id: "dnit", top: "infra", tipo: "norma", t: "DNIT – Manual de Projeto Geométrico de Rodovias Rurais (IPR-706, 1999)", d: "A referência brasileira de geometria de rodovias.", comp: ["Geometria viária"] },
  { id: "ntc", top: "est", tipo: "norma", t: "NTC 2018 (DM 17/01/2018) e Circolare n. 7/2019", d: "As normas técnicas italianas de construção, obrigatórias para projetar estruturas e fundações na Itália.", comp: ["Projeto estrutural", "Eurocódigo 7 e NTC 2018", "Fundações"] },
  { id: "acp_revit", top: "est", tipo: "certificação", t: "Autodesk Certified Professional: Revit for Structural Design", url: "https://www.autodesk.com/certification", d: "A certificação oficial de Revit voltada a estruturas.", comp: ["Revit", "Projeto estrutural"] },
  { id: "eurocod", top: "est", tipo: "norma", t: "Eurocódigos (EN 1990 a EN 1999)", d: "As normas europeias de projeto estrutural e geotécnico.", comp: ["Projeto estrutural", "Robot Structural Analysis"] },
  { id: "navis", top: "plan", tipo: "site", free: true, t: "Navisworks: Timeliner e Quantification (tutoriais oficiais)", url: "https://help.autodesk.com", d: "Como ligar cronograma e quantitativos ao modelo federado.", comp: ["Navisworks", "Cronograma 4D", "Orçamento 5D", "Coordenação e clash detection"] },
  { id: "pmi", top: "plan", tipo: "certificação", t: "Guia PMBOK e certificações CAPM ou PMP (PMI)", url: "https://www.pmi.org", d: "A base de gerenciamento de projetos: EAP, cronograma, custos e riscos.", comp: ["EAP (estrutura analítica do projeto)", "Microsoft Project", "Liderança e comunicação"] },
  { id: "synchro", top: "plan", tipo: "ferramenta", t: "Bentley Synchro 4D", url: "https://www.bentley.com", d: "Planejamento 4D de obras, usado em grandes projetos de infraestrutura.", comp: ["Primavera P6 ou Synchro", "Cronograma 4D"] },
  { id: "prezzari", top: "plan", tipo: "site", t: "Prezzari regionali (preçários das regiões italianas)", d: "A base de preços unitários das obras públicas na Itália; cada região publica o seu.", comp: ["Orçamento 5D"] },
  { id: "sinapi", top: "plan", tipo: "site", free: true, t: "SINAPI (Caixa) e SICRO (DNIT)", url: "https://www.caixa.gov.br", d: "As referências de custo das obras públicas no Brasil.", comp: ["Orçamento 5D"] },
  { id: "dynamo", top: "dados", tipo: "curso", free: true, t: "Dynamo Primer", url: "https://primer.dynamobim.org", d: "O guia oficial e gratuito de Dynamo, do básico ao Python dentro do Dynamo.", comp: ["Dynamo", "Revit"] },
  { id: "abs", top: "dados", tipo: "livro", free: true, t: "Automate the Boring Stuff with Python (Al Sweigart)", url: "https://automatetheboringstuff.com", d: "Python prático para automatizar planilhas, arquivos e relatórios; gratuito online.", comp: ["Python"] },
  { id: "pl300", top: "dados", tipo: "certificação", t: "Microsoft PL-300: Power BI Data Analyst", url: "https://learn.microsoft.com", d: "Trilha gratuita no Microsoft Learn e certificação oficial de Power BI.", comp: ["Power BI"] },
  { id: "ifcopenshell", top: "dados", tipo: "ferramenta", free: true, t: "IfcOpenShell", url: "https://ifcopenshell.org", d: "Biblioteca de código aberto para ler, verificar e editar IFC com Python.", comp: ["Python", "IFC e openBIM"] },
  { id: "speckle", top: "dados", tipo: "ferramenta", free: true, t: "Speckle", url: "https://speckle.systems", d: "Troca de dados aberta entre Revit, Civil 3D, Power BI, Python e outros.", comp: ["Python", "Power BI", "IFC e openBIM"] },
  { id: "qgis", top: "gis", tipo: "curso", free: true, t: "QGIS – Manual de treinamento oficial", url: "https://docs.qgis.org", d: "Curso completo e gratuito de QGIS, de mapas a análise espacial.", comp: ["QGIS"] },
  { id: "ispra", top: "gis", tipo: "site", free: true, t: "ISPRA – cartografia geológica e IFFI (inventário de deslizamentos)", url: "https://www.isprambiente.gov.it", d: "Dados oficiais italianos de geologia e de deslizamentos para estudos de traçado e de risco.", comp: ["QGIS", "Taludes e contenções"] },
  { id: "pinto", top: "geo", tipo: "livro", t: "Curso Básico de Mecânica dos Solos (Carlos de Sousa Pinto)", d: "A porta de entrada clássica em português: índices físicos, tensões, adensamento e resistência.", comp: ["Mecânica dos solos"] },
  { id: "das", top: "geo", tipo: "livro", t: "Fundamentos de Engenharia Geotécnica (Braja M. Das)", d: "Mecânica dos solos com fundações e contenções, cheio de exemplos resolvidos.", comp: ["Mecânica dos solos", "Fundações", "Taludes e contenções"] },
  { id: "craig", top: "geo", tipo: "livro", t: "Craig's Soil Mechanics (J. A. Knappett e R. F. Craig)", d: "Referência em inglês, alinhada ao Eurocódigo 7.", comp: ["Mecânica dos solos", "Eurocódigo 7 e NTC 2018"] },
  { id: "ec7", top: "geo", tipo: "norma", t: "Eurocódigo 7 – EN 1997 (projeto geotécnico)", d: "A norma europeia de projeto geotécnico, junto com o capítulo 6 das NTC 2018 na Itália.", comp: ["Eurocódigo 7 e NTC 2018", "Fundações", "Taludes e contenções"] },
  { id: "en22476", top: "geo", tipo: "norma", t: "EN ISO 22476 (ensaios de campo: CPT, SPT e outros)", d: "Como são feitos e reportados os ensaios de campo na Europa.", comp: ["Investigação geotécnica (SPT, CPT)"] },
  { id: "nbr6484", top: "geo", tipo: "norma", t: "NBR 6484 (sondagem SPT)", d: "A norma brasileira de sondagem de simples reconhecimento com SPT.", comp: ["Investigação geotécnica (SPT, CPT)"] },
  { id: "geomodule", top: "geo", tipo: "ferramenta", t: "Autodesk Geotechnical Module para Civil 3D", url: "https://www.autodesk.com", d: "Complemento do Civil 3D que importa sondagens e gera superfícies e sólidos das camadas.", comp: ["Modelagem geotécnica 3D", "AutoCAD Civil 3D", "Investigação geotécnica (SPT, CPT)"] },
  { id: "leapfrog", top: "geo", tipo: "ferramenta", t: "Leapfrog Works (Seequent)", url: "https://www.seequent.com", d: "Modelagem geológica e geotécnica 3D a partir de sondagens, com integração ao Civil 3D.", comp: ["Modelagem geotécnica 3D"] },
  { id: "plaxis", top: "geo", tipo: "ferramenta", t: "PLAXIS 2D/3D (Bentley)", url: "https://www.bentley.com", d: "Análise por elementos finitos de solos, escavações, taludes e fundações.", comp: ["Taludes e contenções", "Fundações"] },
  { id: "openground", top: "geo", tipo: "ferramenta", t: "OpenGround (Bentley)", url: "https://www.bentley.com", d: "Gestão de dados geotécnicos em nuvem, ponte entre o laboratório, o campo e o modelo.", comp: ["Investigação geotécnica (SPT, CPT)", "Modelagem geotécnica 3D"] },
  { id: "ags", top: "geo", tipo: "site", free: true, t: "Formato AGS de dados geotécnicos", url: "https://www.ags.org.uk", d: "O padrão aberto mais usado para trocar dados de sondagens e ensaios.", comp: ["Investigação geotécnica (SPT, CPT)", "Modelagem geotécnica 3D"] },
  { id: "cni", top: "merc", tipo: "site", t: "Consiglio Nazionale degli Ingegneri e Ordini provinciais", url: "https://www.cni.it", d: "Inscrição no Albo, formação contínua e regras da profissão na Itália.", comp: [] },
  { id: "riconoscimento", top: "merc", tipo: "site", t: "Reconhecimento de títulos profissionais estrangeiros – Ministero della Giustizia", url: "https://www.giustizia.it", d: "O caminho para exercer como engenheiro na Itália com diploma de fora da UE.", comp: [] },
  { id: "inarcassa", top: "merc", tipo: "site", t: "Inarcassa", url: "https://www.inarcassa.it", d: "A previdência de engenheiros e arquitetos inscritos no Albo que trabalham como autônomos.", comp: [] },
  { id: "accredia", top: "merc", tipo: "site", t: "Accredia – organismos acreditados", url: "https://www.accredia.it", d: "Onde conferir quem pode certificar as figuras BIM da UNI 11337-7.", comp: ["UNI 11337"] },
];
const CR_GEO_MOD = [
  { id: "fund", t: "Fundamentos de mecânica dos solos", d: "Índices físicos, classificação, tensões, adensamento e resistência ao cisalhamento.", lib: ["pinto", "das", "craig"], comp: "Mecânica dos solos" },
  { id: "inv", t: "Investigação geotécnica", d: "Sondagens SPT, CPT e CPTu, ensaios de laboratório e perfis estratigráficos.", lib: ["en22476", "nbr6484", "ags"], comp: "Investigação geotécnica (SPT, CPT)" },
  { id: "terra", t: "Obras de terra e taludes", d: "Estabilidade de taludes, aterros sobre solos moles, terraplenagem e drenagem.", lib: ["das", "plaxis", "ispra"], comp: "Taludes e contenções" },
  { id: "fundac", t: "Fundações e contenções", d: "Fundações rasas e profundas, muros e cortinas, segundo o Eurocódigo 7 e as NTC 2018.", lib: ["ec7", "ntc", "das"], comp: "Fundações" },
  { id: "bimgeo", t: "BIM geotécnico", d: "Dados de sondagem (AGS), Geotechnical Module, Leapfrog Works e IFC 4.3, ligados ao Civil 3D e ao Navisworks.", lib: ["geomodule", "leapfrog", "openground", "ifc43"], comp: "Modelagem geotécnica 3D" },
];
const CR_PONTES = [
  ["Terraplenagem", "As superfícies do Civil 3D ganham as camadas do subsolo, e o corte e aterro passa a ser calculado por material."],
  ["Drenagem", "Percolação, rebaixamento do lençol e drenagem de taludes."],
  ["Pavimentação", "Subleito, CBR e módulo de resiliência: o pavimento começa no solo."],
  ["Geometria viária", "Cortes, aterros e a inclinação dos taludes são decisões geotécnicas."],
  ["QGIS", "Mapas geológicos e de risco para estudar traçados."],
  ["Robot Structural Analysis", "Interação solo-estrutura e fundações."],
  ["Navisworks", "Interferências entre fundações, redes e sondagens no modelo federado."],
];
const CR_SEN = ["", "Estágio ou júnior", "Pleno", "Sênior", "Especialista", "Coordenação", "Gerência ou BIM Manager", "Empresa própria"];
const CR_AREAS = ["Rodovias", "Ferrovias", "Edificações", "Estruturas", "Gestão BIM", "Planejamento 4D/5D", "Dados e GIS", "Geotecnia"];
const CR_ATIPO = ["competência", "curso", "certificação", "projeto prático", "portfólio", "networking", "mercado"];
const CR_MERC = [["", "não definido"], ["it", "Itália"], ["br", "Brasil"], ["ambos", "Itália e Brasil"]];

/* ---------------------------------------------------------------- dados */
function crData() {
  const c = (S.carreira ||= {});
  c.perfil ||= {}; const p = c.perfil; p.formacao ||= []; p.exp ||= []; p.cert ||= []; p.areas ||= []; p.idiomas ||= []; p.mapa ||= []; p.caminhos ||= []; p.cargoComp ||= []; p.remun ||= {};
  c.fortes ||= []; c.gaps ||= []; c.obj ||= []; c.acoes ||= []; c.trilhas ||= []; c.lib ||= {}; c.lib.st ||= {}; c.lib.meus ||= []; c.geo ||= {}; c.geo.modo ||= "oculta"; c.geo.objetivos ||= []; c.geo.mod ||= {}; c.snaps ||= []; c.analise ||= [];
  return c;
}
const crGeoOn = () => crData().geo.modo !== "oculta";
const crCat = () => CR_COMP.filter(c => c.g !== "geo" || crGeoOn());
function crFind(name) {
  const k = norm(name), d = CR_COMP.find(c => c.n === name); let x = S.comp.find(c => norm(c.nome) === k);
  if (!x && d?.al) x = S.comp.find(c => d.al.test(c.nome) && !CR_COMP.some(o => norm(o.n) === norm(c.nome)));
  return x || null;
}
const crLv = name => { const x = crFind(name); return isNum(+x?.atual) && +x?.atual > 0 ? +x.atual : 0; };
const crAlvo = name => { const x = crFind(name); return isNum(+x?.alvo) && +x?.alvo > 0 ? +x.alvo : 0; };
/* o que conta como coberto antes da avaliação: o que está no mapa e o que o cargo atual evidencia */
const crSrc = name => { const P = crData().perfil; return P.mapa.some(m => norm(m) === norm(name)) ? "mapa" : P.cargoComp.some(m => norm(m) === norm(name)) ? "cargo" : crEvid(name).length ? "projeto" : ""; };
const crInMap = name => !!crSrc(name);
const crSrcPill = name => { const s = crSrc(name), e = crEvid(name).length; return (s === "mapa" ? crPill("no seu mapa", "var(--a-car)") : s === "cargo" ? crPill("pelo cargo atual", "var(--a-pro)") : "") + (e ? " " + crPill(`em ${plural(e, "projeto", "projetos")}`, "var(--good)") : ""); };
function crSet(name, field, v) {
  let x = S.comp.find(c => norm(c.nome) === norm(name));
  if (!x) { x = { id: uid(), nome: name, atual: "", alvo: "", grupo: CR_COMP.find(c => c.n === name)?.g || "" }; S.comp.push(x); }
  x[field] = v || ""; if (field === "atual" && v && !(+x.alvo >= v)) x.alvo = Math.min(5, Math.max(+x.alvo || 0, v));
}
/* aderência: Σ peso·min(nível, pedido)/pedido ÷ Σ peso; "base no mapa": a mesma conta valendo 1 para o que está no seu mapa */
function crFit(tr) {
  let W = 0, a = 0, m = 0, nAv = 0; const gaps = [];
  for (const [n, r, w] of tr.req) { const lv = crLv(n); W += w; a += w * Math.min(lv, r) / r; m += w * (crInMap(n) || lv > 0 ? 1 : 0); if (lv) nAv++; if (lv < r) gaps.push({ n, lv, r, w, falta: (r - lv) * w, fora: !lv && !crInMap(n) }); }
  gaps.sort((x, y) => y.fora - x.fora || y.falta - x.falta || y.w - x.w);
  return { fit: a / W, mapa: m / W, nAv, n: tr.req.length, gaps };
}
const crRank = () => CR_TRI.map(t => ({ t, ...crFit(t) })).sort((a, b) => (b.fit - a.fit) || (b.mapa - a.mapa));
function crGroupAvg(g) { const cs = crCat().filter(c => c.g === g), lv = cs.map(c => crLv(c.n)).filter(Boolean), al = cs.map(c => crAlvo(c.n)).filter(Boolean); return { n: cs.length, av: lv.length, atual: lv.length ? avg(lv) : null, alvo: al.length ? avg(al) : null }; }
function crGapsAll() {
  const sel = crData().trilhas, m = {};
  for (const id of sel) { const t = CR_TRI.find(x => x.id === id); if (!t) continue; for (const g of crFit(t).gaps) { const o = m[g.n] ||= { n: g.n, lv: g.lv, r: 0, w: 0, tr: [] }; o.r = Math.max(o.r, g.r); o.w += g.w; o.tr.push(t.t); } }
  return Object.values(m).sort((a, b) => (b.r - b.lv) * b.w - (a.r - a.lv) * a.w);
}
const crLibAll = () => [...CR_LIB, ...crData().lib.meus];
const crLibBy = id => crLibAll().find(x => x.id === id);
const crLibFor = comp => CR_LIB.filter(x => (x.comp || []).includes(comp));
const crActsOf = oid => crData().acoes.filter(a => a.obj === oid);
const crObjProg = o => { const as = crActsOf(o.id); return as.length ? as.filter(a => a.st === "feito").length / as.length : null; };

/* ---------------------------------------------------------------- gráficos */
function crRadar() {
  const gs = CR_GRP.filter(g => g[0] !== "geo" || crGeoOn()), W = 440, H = 320, cx = 220, cy = 160, r = 108, n = gs.length, SH = { infra: "Infraestrutura", est: "Estruturas", gest: "Gestão BIM", plan: "4D/5D", dados: "Dados e GIS", geo: "Geotecnia" };
  const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r * v / 5, cy + Math.sin(a) * r * v / 5]; };
  let g = "";
  for (const v of [1, 2, 3, 4, 5]) g += `<polygon points="${gs.map((_, i) => pt(i, v).map(z => z.toFixed(1)).join(",")).join(" ")}" class="rgrid"/>`;
  gs.forEach(([id, l], i) => { const [x, y] = pt(i, 5), [lx, ly] = pt(i, 6.15); g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rgrid"/><text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" class="ax rl" text-anchor="${lx < cx - 8 ? "end" : lx > cx + 8 ? "start" : "middle"}">${esc(SH[id])}</text>`; });
  const av = gs.map(([id]) => crGroupAvg(id));
  const poly = (k, col, dash, op) => av.some(a => a[k] != null) ? `<polygon points="${av.map((a, i) => pt(i, a[k] ?? 0).map(z => z.toFixed(1)).join(",")).join(" ")}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="2"${dash ? ' stroke-dasharray="4 3"' : ""}/>` : "";
  g += poly("alvo", "var(--muted)", true, 0) + poly("atual", "var(--a-car)", false, .16);
  return legend([{ name: "Nível atual (média do grupo)", color: "var(--a-car)" }, { name: "Alvo", color: "var(--muted)", dash: true }]) + svgWrap(W, H, g, "Competências por grupo, de 0 a 5: nível atual e alvo");
}
function crTimeline() {
  const os = crData().obj.filter(o => o.prazo), ms = crData().acoes.filter(a => a.marco && a.prazo);
  if (!os.length && !ms.length) return emptyChart("Dê um prazo aos objetivos e marque ações como marcos para ver a linha do tempo.");
  const all = [...os.map(o => o.prazo), ...ms.map(a => a.prazo), TODAY].sort(), d0 = addDays(all[0] < TODAY ? all[0] : TODAY, -20), d1 = addDays(all.at(-1), 40), span = Math.max(1, diff(d1, d0));
  const W = 760, x = d => 20 + (W - 40) * diff(d, d0) / span; let g = `<line x1="20" y1="70" x2="${W - 20}" y2="70" class="crtl-ax"/>`;
  for (let y = +d0.slice(0, 4); y <= +d1.slice(0, 4) + 1; y++) { const d = `${y}-01-01`; if (d > d0 && d < d1) g += `<line x1="${x(d).toFixed(1)}" y1="62" x2="${x(d).toFixed(1)}" y2="78" class="crtl-ax"/><text x="${x(d).toFixed(1)}" y="94" text-anchor="middle" class="ax">${y}</text>`; }
  g += `<line x1="${x(TODAY).toFixed(1)}" y1="18" x2="${x(TODAY).toFixed(1)}" y2="82" class="crtl-hoje"/><text x="${x(TODAY).toFixed(1)}" y="14" text-anchor="middle" class="ax">hoje</text>`;
  os.sort((a, b) => a.prazo.localeCompare(b.prazo)).forEach((o, i) => { const X = x(o.prazo), up = i % 2 === 0, p = crObjProg(o); g += `<g class="click" data-act="crgoobj" data-id="${o.id}" role="button" tabindex="0" aria-label="${esc(o.t)}"><circle cx="${X.toFixed(1)}" cy="70" r="8" class="crtl-o${o.st === "alcançado" ? " ok" : ""}"/><text x="${X.toFixed(1)}" y="${up ? 44 : 116}" text-anchor="middle" class="crtl-l">${esc(trunc(o.t, 26))}</text><text x="${X.toFixed(1)}" y="${up ? 30 : 130}" text-anchor="middle" class="ax">${fmtD(o.prazo)}${p != null ? ` · ${pct(p)}` : ""}</text></g>`; });
  ms.forEach(a => { const X = x(a.prazo); g += `<rect x="${(X - 5).toFixed(1)}" y="65" width="10" height="10" transform="rotate(45 ${X.toFixed(1)} 70)" class="crtl-m${a.st === "feito" ? " ok" : ""}"><title>${esc(a.t)} · ${fmtD(a.prazo)}</title></rect>`; });
  return `<div class="hscroll">${svgWrap(W, 140, g, "Linha do tempo dos objetivos (círculos) e marcos (losangos)")}</div>`;
}
const crLvDots = (name, field = "atual") => { const v = field === "atual" ? crLv(name) : crAlvo(name); return `<div class="crdots" role="group" aria-label="${field === "atual" ? "Nível atual" : "Alvo"} em ${esc(name)}">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="crd${n <= v ? " on" : ""}${field === "alvo" ? " alvo" : ""}" data-act="crlv" data-n="${esc(name)}" data-f="${field}" data-v="${n}" aria-pressed="${n === v}" title="${n} · ${CR_LV[n]}"></button>`).join("")}</div>`; };
const crPill = (t, c) => `<span class="crtag" style="--c:${c || "var(--a-car)"}">${esc(t)}</span>`;
const crGrpCol = g => CR_GRP.find(x => x[0] === g)?.[2] || "var(--muted)";

/* ---------------------------------------------------------------- páginas */
function pCarreiraHub(R) {
  crExtra();
  const f = { panorama: crPanorama, avaliacao: crAvaliacao, portfolio: crPortfolio, objetivos: crObjetivos, decisoes: crDecisoes, geotecnia: crGeotecnia, plano: crPlano, mercado: crMercado, biblioteca: crBiblioteca }[SUB] || crPanorama;
  return f(R);
}
function crFlow() {
  const C = crData(), cat = crCat(), av = cat.filter(c => crLv(c.n)).length, oa = C.obj.filter(o => o.st !== "alcançado" && o.st !== "arquivado").length, ab = C.acoes.filter(a => a.st !== "feito").length, mk = C.acoes.filter(a => a.marco && a.st !== "feito").length, lu = Object.values(C.lib.st).filter(s => s === "estudando").length;
  const st = (k, ic0, t, v, s) => `<a class="crflow-i" href="#carreira.${k}">${ic(ic0)}<span><small>${t}</small><b>${v}</b><em>${s}</em></span></a>`;
  return `<div class="crflow">${st("avaliacao", "user", "Onde estou", `${av} de ${cat.length}`, "competências avaliadas")}<span class="crarrow">${ic("arrow")}</span>${st("objetivos", "target", "Aonde quero chegar", oa, `${plural(oa, "objetivo ativo", "objetivos ativos")}${C.trilhas.length ? ` · ${plural(C.trilhas.length, "trilha", "trilhas")}` : ""}`)}<span class="crarrow">${ic("arrow")}</span>${st("plano", "flag", "Como chegar", ab, `${plural(ab, "ação aberta", "ações abertas")} · ${plural(mk, "marco", "marcos")}`)}<span class="crarrow">${ic("arrow")}</span>${st("biblioteca", "book", "Com o quê", lu, "recursos em estudo")}</div>`;
}
function crTrilhaCard(x, i) {
  const C = crData(), t = x.t, on = C.trilhas.includes(t.id), m = C.perfil.mercado, nada = !x.nAv, cur = C.perfil.cargoTri === t.id;
  return `<article class="crtri${on ? " on" : ""}${cur ? " cur" : ""}"><header><span class="crrank">${cur ? ic("flag") : i + 1}</span><div><h3>${esc(t.t)}</h3>${cur ? crPill("o seu cargo hoje", "var(--a-pro)") + " " : ""}<small class="muted">${esc(t.papel)}</small></div>
      <div class="crfit"><b>${nada ? "–" : pct(x.fit)}</b><small>${nada ? "avalie para calcular" : "aderência pelo nível"}</small></div></header>
    <div class="crbars"><div><span>Base no seu perfil</span><div class="crbar"><i style="width:${(x.mapa * 100).toFixed(0)}%"></i></div><b>${pct(x.mapa)}</b></div><div><span>Aderência pelo nível</span><div class="crbar fit"><i style="width:${(x.fit * 100).toFixed(0)}%"></i></div><b>${nada ? "–" : pct(x.fit)}</b></div></div>
    ${x.gaps.length ? `<div class="flbl">O que mais falta</div><div class="row wrap">${x.gaps.slice(0, 4).map(g => `<span class="crgap${g.fora ? " fora" : ""}">${esc(g.n)} <small>${g.fora ? "fora do perfil" : `${g.lv || "?"}→${g.r}`}</small></span>`).join("")}</div>` : `<p class="st-good small">Você já cobre os níveis pedidos.</p>`}
    <p class="crpasso">${ic("arrow")}<span><b>Primeiro passo:</b> ${esc(t.passo)}</span></p>
    ${(m === "it" || m === "ambos" || !m) && t.it ? `<p class="muted small">${crPill("Itália", "var(--a-fin)")} ${esc(t.it)}</p>` : ""}${(m === "br" || m === "ambos") && t.br ? `<p class="muted small">${crPill("Brasil", "var(--a-laz)")} ${esc(t.br)}</p>` : ""}
    <details class="crdet"><summary>Certificações e recursos</summary><ul>${t.certs.map(c => `<li>${esc(c)}</li>`).join("")}</ul><div class="row wrap">${t.lib.map(id => { const l = crLibBy(id); return l ? `<button type="button" class="lnk" data-act="crlibgo" data-id="${id}">${esc(trunc(l.t, 48))}</button>` : ""; }).join("")}</div></details>
    <div class="row wrap"><button type="button" class="btn sm${on ? "" : " primary"}" data-act="crtri" data-id="${t.id}">${ic(on ? "check" : "plus")}${on ? "Trilha escolhida (tirar)" : "Escolher esta trilha"}</button><button type="button" class="btn sm" data-act="crpasso" data-id="${t.id}">${ic("flag")}Primeiro passo no plano</button></div></article>`;
}
function crPanorama() {
  const C = crData(), rk = crRank(), cur = rk.find(x => x.t.id === C.perfil.cargoTri), pot = rk.filter(x => x !== cur), next = C.acoes.filter(a => a.st !== "feito" && a.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 5), sn = C.snaps;
  const geo = C.geo.modo;
  return `<p class="lead">O seu norte profissional: onde você está, aonde quer chegar, como e com quais recursos. Avalie, escolha as trilhas que fazem sentido, transforme os gaps em ações e volte aqui para ver o caminho andar.</p>
    ${crFlow()}
    <div class="g2c crhome">
      ${vis("crradar", "Mapa de competências", crRadar(), { sub: "média de cada grupo, de 0 a 5 (1 conheço · 3 autônomo · 5 referência); a linha tracejada é o alvo", nofocus: true, act: `<a class="lnk" href="#carreira.avaliacao">avaliar</a>` })}
      ${panel(`${ic("info")}Leitura do percurso${C.analise.length ? ` <small>${esc(C.analiseInfo || "")}</small>` : ""}`, C.analise.length ? `<ol class="crana">${C.analise.map(a => `<li><b>${esc(a.t)}</b><p>${esc(a.d)}</p></li>`).join("")}</ol>` : `<p class="muted">Quando você avaliar as competências e escolher trilhas, o Mentor da Carreira pode escrever uma leitura do seu percurso.</p>`
        + `<div class="row wrap"><button type="button" class="btn sm" data-act="crask">${ic("spark")}Pedir uma leitura ao Mentor da Carreira</button></div>`)}
      ${panel(`${ic("sprout")}Potenciais de crescimento <small>${cur ? `${pot.length} trilhas a partir do seu cargo` : "8 trilhas"}, ordenadas pela aderência</small>`, `<p class="muted small">Aderência = Σ peso × mín(seu nível, nível pedido) ÷ nível pedido, dividido pela soma dos pesos. “Base no seu perfil” conta como coberto o que está no seu mapa, o que o seu cargo atual evidencia ou o que já foi avaliado. ${rk.some(x => x.nAv) ? "" : "Enquanto nada for avaliado, a ordem segue a base no perfil."}</p>${cur ? `<div class="flbl">Ponto de partida</div><div class="crtris crcur">${crTrilhaCard(cur, 0)}</div><div class="flbl">Para onde crescer</div>` : ""}<div class="crtris">${pot.map(crTrilhaCard).join("")}</div>`, { cls: "span2" })}
      ${geo === "oculta" ? `<section class="pn crgeoinv"><header><h2>${ic("layers")}Geotecnia</h2></header><p>A seção fica guardada até você querer. Quando ativar, ela mostra as pontes com o que você já sabe (terraplenagem, drenagem, pavimentação, QGIS), um roteiro de cinco módulos e os recursos ligados ao plano.</p><div class="row wrap"><button type="button" class="btn sm primary" data-act="crgeo" data-v="explorando">${ic("eye")}Começar a explorar</button></div></section>`
        : panel(`${ic("layers")}Geotecnia <small>${geo === "ativa" ? "ativa" : "explorando"}</small>`, `<p class="muted">${esc(C.geo.interesse || "Registre o que atrai você na geotecnia.")}</p><div class="crgeomini">${CR_GEO_MOD.map(m => `<span class="crgm ${C.geo.mod[m.id] || ""}" title="${esc(m.t)}">${esc(m.t.split(" ")[0])}</span>`).join("")}</div><a class="btn sm" href="#carreira.geotecnia">${ic("arrow")}Abrir</a>`)}
      ${panel(`${ic("flag")}Próximos passos`, next.length ? `<div class="list">${next.map(a => `<div class="li"><span class="t">${a.marco ? `${ic("star")} ` : ""}${esc(a.t)}<div class="m">${esc(a.tipo)}${a.comp ? ` · ${esc(a.comp)}` : ""}</div></span>${pill(a.prazo < TODAY ? "crit" : diff(a.prazo, TODAY) <= 14 ? "warn" : "none", relDay(a.prazo))}</div>`).join("")}</div>` : `<div class="empty">Sem ações com prazo. Comece pelo primeiro passo de uma trilha.</div>`, { act: `<a class="lnk" href="#carreira.plano">plano</a>` })}
      ${mentorMini("car")}
      ${sn.length >= 2 ? vis("crevo", "Evolução das avaliações", lineChart(sn.map(s => fmtD(s.data)), CR_GRP.filter(g => g[0] !== "geo" || crGeoOn()).map(([id, l, c]) => ({ name: l.split(" (")[0], color: c, data: sn.map(s => { const v = Object.entries(s.niveis).filter(([n]) => CR_COMP.find(x => x.n === n)?.g === id).map(([, v]) => v).filter(Boolean); return v.length ? avg(v) : null; }), fill: false })), { h: 220, w: 620, min: 0, max: 5, fmt: v => num(v, 1) }), { cls: "span2", sub: "média por grupo em cada avaliação registrada" }) : ""}
    </div>`;
}
function crAvaliacao() {
  const C = crData(), P = C.perfil, F = CR.f, g0 = CR.grp, cat = crCat(), extra = S.comp.filter(c => !CR_COMP.some(d => norm(d.n) === norm(c.nome)) && !CR_COMP.some(d => d.al?.test(c.nome) && !S.comp.some(z => norm(z.nome) === norm(d.n))));
  const gs = CR_GRP.filter(g => g[0] !== "geo" || crGeoOn()), sug = crGapsAll().slice(0, 6);
  const row = c => `<div class="crcomp"><div class="crcn"><b>${esc(c.n)}</b>${crSrcPill(c.n)}<small class="muted">${c.tipo}</small></div><div class="crlvs"><span class="crlbl">atual</span>${crLvDots(c.n)}<span class="crlv">${CR_LV[crLv(c.n)]}</span></div><div class="crlvs"><span class="crlbl">alvo</span>${crLvDots(c.n, "alvo")}</div><input type="text" class="crev" data-crev="${esc(c.n)}" value="${esc(crFind(c.n)?.evid || "")}" placeholder="evidência: onde usei" aria-label="Evidência de ${esc(c.n)}"></div>`;
  const list = (k, cols, fields) => `<div class="crlist">${P[k].map(x => `<div class="cri"><div>${cols(x)}</div><button type="button" class="vb" data-act="crdel" data-k="${k}" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("") || `<div class="empty">Nada ainda.</div>`}</div>
    <div class="row wrap cradd">${fields.map(([f, ph, w]) => f === "tipo" ? `<select data-crf="${k}.${f}" aria-label="Tipo">${["Graduação", "Pós-graduação", "Mestrado", "Curso livre"].map(o => `<option${F[k + "." + f] === o ? " selected" : ""}>${o}</option>`).join("")}</select>` : `<input type="${/data|inicio|fim|validade/.test(f) ? "month" : "text"}" data-crf="${k}.${f}" placeholder="${ph}" value="${esc(F[k + "." + f] || "")}" style="flex:${w || 1}" aria-label="${ph}">`).join("")}<button type="button" class="btn sm" data-act="cradd" data-k="${k}">${ic("plus")}Acrescentar</button></div>`;
  return `<p class="lead">Um retrato honesto de hoje. Os níveis vão de 1 (conheço) a 5 (referência, ensino os outros); o que você não marcar fica como não avaliado e não entra nas contas. Registre uma avaliação de tempos em tempos para ver a evolução.</p>
    <div class="g2c">
      ${panel(`${ic("user")}Perfil`, `<div class="form f2"><label>Mercado em que você atua<select data-crp="mercado">${CR_MERC.map(([v, l]) => `<option value="${v}"${P.mercado === v ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Senioridade hoje<select data-crp="sen">${CR_SEN.map(s => `<option${P.sen === s ? " selected" : ""}>${s}</option>`).join("")}</select></label></div>
        <div class="flbl">Áreas de atuação</div><div class="row wrap">${CR_AREAS.map(a => `<button type="button" class="jchip${P.areas.includes(a) ? " on" : ""}" style="--c:var(--a-car)" data-act="crarea" data-v="${esc(a)}">${esc(a)}</button>`).join("")}</div>
        <div class="flbl">Idiomas</div>${list("idiomas", x => `<b>${esc(x.nome)}</b> <span class="muted">${esc(x.nivel || "")}</span>`, [["nome", "idioma"], ["nivel", "nível (A2, B2, C1…)"]])}
        ${P.caminhos.length ? `<div class="flbl">Direções possíveis que aparecem no mapa</div><div class="row wrap">${P.caminhos.map(c => crPill(c, "var(--a-pro)")).join("")}</div>` : ""}`)}
      ${crRemunPanel()}
      ${panel(`${ic("book")}Formação`, list("formacao", x => `<b>${esc(x.curso)}</b> <span class="muted">${esc([x.tipo, x.inst, x.fim].filter(Boolean).join(" · "))}</span>`, [["curso", "curso", 2], ["tipo"], ["inst", "instituição"], ["fim", "conclusão"]]))}
      ${panel(`${ic("brief")}Experiência`, list("exp", x => `<b>${esc(x.cargo)}</b> <span class="muted">${esc([x.org, [x.inicio, x.fim || "atual"].filter(Boolean).join(" a ")].filter(Boolean).join(" · "))}</span>${x.desc ? `<p class="small">${esc(x.desc)}</p>` : ""}`, [["cargo", "cargo ou projeto", 2], ["org", "empresa ou cliente"], ["inicio", "início"], ["fim", "fim"], ["desc", "o que fez e com quais ferramentas", 3]]))}
      ${panel(`${ic("star")}Certificações`, list("cert", x => `<b>${esc(x.nome)}</b> <span class="muted">${esc([x.emissor, x.data, x.validade && "válida até " + x.validade].filter(Boolean).join(" · "))}</span>`, [["nome", "certificação", 2], ["emissor", "emissor"], ["data", "obtida em"], ["validade", "validade"]]))}
      ${panel(`${ic("target")}Competências <small>${cat.filter(c => crLv(c.n)).length} de ${cat.length} avaliadas</small>`, `<div class="segs crgsegs"><button type="button" class="seg" data-act="crgrp" data-v="todos" aria-pressed="${g0 === "todos"}">Todas</button>${gs.map(([id, l]) => `<button type="button" class="seg" data-act="crgrp" data-v="${id}" aria-pressed="${g0 === id}">${esc(l.split(" (")[0])}</button>`).join("")}</div>
        ${gs.filter(([id]) => g0 === "todos" || g0 === id).map(([id, l, c]) => { const a = crGroupAvg(id); return `<div class="crgh" style="--c:${c}"><b>${esc(l)}</b><small class="muted">${a.atual == null ? "sem avaliação" : `média ${num(a.atual, 1)}${a.alvo != null ? ` · alvo ${num(a.alvo, 1)}` : ""}`}</small></div>${cat.filter(x => x.g === id).map(row).join("")}`; }).join("")}
        ${extra.length && g0 === "todos" ? `<div class="crgh"><b>Outras que você registrou</b></div>${extra.map(x => `<div class="crcomp"><div class="crcn"><b>${esc(x.nome)}</b></div><div class="crlvs"><span class="crlbl">atual</span><span class="crlv">${x.atual || "–"}</span><span class="crlbl">alvo</span><span class="crlv">${x.alvo || "–"}</span></div></div>`).join("")}` : ""}
        <div class="row wrap cradd"><input type="text" id="crnewc" placeholder="Outra competência (ex.: Solibri, italiano técnico)" aria-label="Nova competência"><button type="button" class="btn sm" data-act="crnewc">${ic("plus")}Acrescentar</button><button type="button" class="btn sm primary" data-act="crsnap">${ic("check")}Registrar a avaliação de hoje</button></div>
        <p class="muted small">${C.snaps.length ? `Última avaliação registrada em ${fmtDY(C.snaps.at(-1).data)}; ${plural(C.snaps.length, "registro", "registros")} no total.` : "Nenhuma avaliação registrada ainda: registre para acompanhar a evolução."}</p>`, { cls: "span2" })}
      ${panel(`${ic("check")}Pontos fortes`, `<div class="crlist">${C.fortes.map(x => `<div class="cri"><div>${esc(x.t)}</div><button type="button" class="vb" data-act="crdelq" data-k="fortes" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("") || `<div class="empty">O que você faz melhor que a média? Onde pedem a sua ajuda?</div>`}</div><div class="row wrap cradd"><input type="text" id="crq_fortes" placeholder="Um ponto forte, com um exemplo"><button type="button" class="btn sm" data-act="craddq" data-k="fortes">${ic("plus")}Acrescentar</button></div>`)}
      ${panel(`${ic("target")}Gaps identificados`, `<div class="crlist">${C.gaps.map(x => `<div class="cri"><div>${esc(x.t)}</div><div class="row"><button type="button" class="lnk" data-act="crgapact" data-t="${esc(x.t)}">virar ação</button><button type="button" class="vb" data-act="crdelq" data-k="gaps" data-id="${x.id}" aria-label="Apagar">${ic("trash")}</button></div></div>`).join("") || `<div class="empty">O que trava o próximo passo? Ferramenta, norma, idioma, experiência, rede de contatos.</div>`}</div><div class="row wrap cradd"><input type="text" id="crq_gaps" placeholder="Um gap, do jeito que você o sente"><button type="button" class="btn sm" data-act="craddq" data-k="gaps">${ic("plus")}Acrescentar</button></div>
        ${sug.length ? `<div class="flbl">Gaps calculados pelas trilhas escolhidas</div>${sug.map(g => `<div class="cri"><div><b>${esc(g.n)}</b> <span class="muted small">${g.lv ? `nível ${g.lv}` : "não avaliado"} → ${g.r} · ${esc(g.tr.join(", "))}</span></div><button type="button" class="lnk" data-act="crgapcomp" data-n="${esc(g.n)}" data-r="${g.r}">virar ação</button></div>`).join("")}` : `<p class="muted small">Escolha trilhas no Panorama ou em Objetivos para ver os gaps calculados.</p>`}`)}
    </div>`;
}
const CR_CONTR = ["", "Tempo indeterminato", "Tempo determinato", "Apprendistato", "Libero professionista (Partita IVA)", "Outro"];
function crRemun() { const r = crData().perfil.remun, b = +r.bruto || 0, m = +r.mens || 0, bp = +r.buoni || 0; return { b, m, bp, ral: b && m ? b * m : null, bpAno: bp ? bp * 12 : null, tot: b && m ? b * m + bp * 12 : null }; }
function crRemunPanel() {
  const P = crData().perfil, r = P.remun, x = crRemun(), inp = (k, l, t = "text", ph = "") => `<label>${l}<input type="${t}" data-crr="${k}" value="${esc(r[k] ?? "")}" placeholder="${ph}"${t === "number" ? ' min="0" step="1"' : ""}></label>`;
  return panel(`${ic("brief")}Cargo, contrato e remuneração`, `<div class="form f2"><label>Cargo atual<input type="text" data-crp="cargo" value="${esc(P.cargo || "")}"></label><label>Empresa<input type="text" data-crp="empresa" value="${esc(P.empresa || "")}"></label><label>Cidade<input type="text" data-crp="cidade" value="${esc(P.cidade || "")}"></label>
      <label>Contrato<select data-crr="contrato">${CR_CONTR.map(c => `<option${r.contrato === c ? " selected" : ""}>${c}</option>`).join("")}</select></label>${inp("ccnl", "CCNL", "text", "ex.: Studi professionali")}${inp("livello", "Livello", "text", "ex.: 3S")}
      ${inp("bruto", "Bruto mensal (lordo, €)", "number")}${inp("mens", "Mensalidades por ano", "number", "13 ou 14")}${inp("buoni", "Buoni pasto por mês (€)", "number")}</div>
    ${x.ral ? `<div class="crremun"><div><small>RAL (bruto anual)</small><b>${eur(x.ral)}</b><em>${eur(x.b)} × ${x.m}</em></div>${x.bpAno ? `<div><small>Buoni pasto no ano</small><b>${eur(x.bpAno)}</b><em>${eur(x.bp)} × 12, aproximado</em></div>` : ""}<div><small>Pacote anual</small><b>${eur(x.tot)}</b><em>RAL + buoni pasto</em></div></div>` : `<p class="muted small">Com o bruto mensal e o número de mensalidades, o hub calcula a RAL e o pacote anual.</p>`}
    <p class="muted small">Serve para comparar propostas, negociar e decidir sobre trilhas paralelas. Fica só no seu banco privado; o Mentor da Carreira lê estes dados nas conversas.</p>`);
}
function crObjetivos() {
  const C = crData(), P = C.perfil, F = CR.f, rk = crRank();
  const ocard = o => { const as = crActsOf(o.id), p = crObjProg(o), t = CR_TRI.find(x => x.id === o.tri);
    return `<article class="crobj${o.st === "alcançado" ? " ok" : ""}" id="cro_${o.id}"><header><span class="crtag" style="--c:var(--a-pro)">${esc(o.tipo)}</span>${t ? crPill(t.t, "var(--a-car)") : ""}<small class="muted">${o.prazo ? `até ${fmtDY(o.prazo)} · ${relDay(o.prazo)}` : "sem prazo"}</small></header><h3>${esc(o.t)}</h3>${o.porque ? `<p class="muted">${esc(o.porque)}</p>` : ""}${o.metrica ? `<p class="small">${ic("check")}<b>Como vou saber que cheguei:</b> ${esc(o.metrica)}</p>` : ""}
      <div class="crbar fit"><i style="width:${((p || 0) * 100).toFixed(0)}%"></i></div><small class="muted">${as.length ? `${as.filter(a => a.st === "feito").length} de ${as.length} ações feitas` : "nenhuma ação ligada ainda"}</small>
      <div class="row wrap"><select data-crobjst="${o.id}" aria-label="Status">${["ativo", "alcançado", "pausado", "arquivado"].map(s => `<option${(o.st || "ativo") === s ? " selected" : ""}>${s}</option>`).join("")}</select><button type="button" class="btn sm" data-act="cracnew" data-obj="${o.id}">${ic("plus")}Ação</button><button type="button" class="btn sm" data-act="crmeta" data-id="${o.id}"${o.meta ? " disabled" : ""}>${ic("target")}${o.meta ? "Já é meta" : "Virar meta no Atlas"}</button><button type="button" class="lnk" data-act="crobjdel" data-id="${o.id}">apagar</button></div></article>`; };
  const objs = C.obj.slice().sort((a, b) => (a.st === "alcançado") - (b.st === "alcançado") || (a.prazo || "9").localeCompare(b.prazo || "9"));
  return `<p class="lead">Metas claras com prazo e um jeito de saber que você chegou. Escolha até três trilhas para orientar os gaps e o plano; os objetivos podem virar metas do Atlas, acompanhadas junto com o resto da vida.</p>
    <div class="g2c">
      ${panel(`${ic("compass")}O seu norte`, `<label class="crvis">Daqui a cinco anos, eu quero…<textarea rows="3" data-crp="visao" placeholder="Ex.: coordenar a informação BIM de grandes obras ferroviárias, com certificação e uma frente própria de cursos">${esc(P.visao || "")}</textarea></label>
        <div class="form f2"><label>Senioridade alvo<select data-crp="senAlvo">${CR_SEN.map(s => `<option${P.senAlvo === s ? " selected" : ""}>${s}</option>`).join("")}</select></label><label>Até<input type="month" data-crp="senAno" value="${esc(P.senAno || "")}"></label></div>
        <p class="muted small">Hoje: ${esc(P.sen || "não definido")} · mercado: ${esc(CR_MERC.find(m => m[0] === (P.mercado || ""))[1])}</p>`)}
      ${panel(`${ic("sprout")}Trilhas escolhidas <small>${C.trilhas.length} de 3</small>`, `<div class="crtsel">${rk.map(x => { const on = C.trilhas.includes(x.t.id); return `<button type="button" class="crts${on ? " on" : ""}" data-act="crtri" data-id="${x.t.id}" aria-pressed="${on}"><b>${esc(x.t.t)}</b><small>${x.nAv ? `aderência ${pct(x.fit)}` : `mapa ${pct(x.mapa)}`}</small></button>`; }).join("")}</div>${P.caminhos.length ? `<p class="muted small">Direções possíveis no seu mapa: ${P.caminhos.map(esc).join(", ")}.</p>` : ""}`)}
      ${vis("crtl", "Linha do tempo", crTimeline(), { cls: "span2", sub: "objetivos (círculos, com o progresso das ações) e marcos do plano (losangos)", nofocus: true })}
      ${panel(`${ic("plus")}Novo objetivo`, `<div class="form f1"><label>Objetivo<input type="text" data-crf="obj.t" value="${esc(F["obj.t"] || "")}" placeholder="Ex.: ser BIM Coordinator certificado (UNI 11337-7)"></label></div>
        <div class="form f2"><label>Tipo<select data-crf="obj.tipo">${["especialização", "senioridade", "área emergente", "certificação", "mercado", "empreendimento"].map(o => `<option${F["obj.tipo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label><label>Prazo<input type="date" data-crf="obj.prazo" value="${esc(F["obj.prazo"] || "")}"></label>
        <label>Trilha<select data-crf="obj.tri"><option value="">nenhuma</option>${CR_TRI.map(t => `<option value="${t.id}"${F["obj.tri"] === t.id ? " selected" : ""}>${esc(t.t)}</option>`).join("")}</select></label><label>Como vou saber que cheguei<input type="text" data-crf="obj.metrica" value="${esc(F["obj.metrica"] || "")}" placeholder="Ex.: certificado emitido; cargo com esse título"></label></div>
        <div class="form f1"><label>Por que importa<textarea rows="2" data-crf="obj.porque">${esc(F["obj.porque"] || "")}</textarea></label></div><div class="row"><button type="button" class="btn primary" data-act="crobjsave">${ic("check")}Guardar objetivo</button></div>`)}
      ${panel(`${ic("target")}Objetivos <small>${C.obj.length}</small>`, objs.length ? `<div class="crobjs">${objs.map(ocard).join("")}</div>` : `<div class="empty">Comece por um objetivo de 6 a 12 meses e outro de 3 a 5 anos.</div>`)}
    </div>`;
}
function crGeotecnia() {
  const C = crData(), G = C.geo, md = G.modo, F = CR.f;
  const modes = `<div class="segs crgeomodes">${[["oculta", "Guardada"], ["explorando", "Explorando"], ["ativa", "Ativa"]].map(([v, l]) => `<button type="button" class="seg" data-act="crgeo" data-v="${v}" aria-pressed="${md === v}">${l}</button>`).join("")}</div>`;
  if (md === "oculta") return `<p class="lead">A geotecnia está guardada. Quando quiser, comece a explorar: a seção cresce com você, primeiro com o interesse e as pontes com o que você já sabe, depois com o roteiro completo, as competências e o plano.</p>${modes}`;
  const pontes = CR_PONTES.map(([n, d]) => `<div class="crponte"><b>${esc(n)}</b>${crLv(n) ? `<small class="muted">nível ${crLv(n)}</small>` : crSrcPill(n)}<p>${esc(d)}</p></div>`).join("");
  const modCard = (m, i) => { const st = G.mod[m.id] || ""; return `<div class="crmod ${st}"><span class="crmn">${i + 1}</span><div><b>${esc(m.t)}</b><p>${esc(m.d)}</p><div class="row wrap">${m.lib.map(id => { const l = crLibBy(id); return l ? `<button type="button" class="lnk" data-act="crlibgo" data-id="${id}">${esc(trunc(l.t, 44))}</button>` : ""; }).join(" · ")}</div>
    <div class="row wrap"><div class="segs">${[["", "não iniciado"], ["estudando", "estudando"], ["feito", "concluído"]].map(([v, l]) => `<button type="button" class="seg" data-act="crgmod" data-id="${m.id}" data-v="${v}" aria-pressed="${st === v}">${l}</button>`).join("")}</div><button type="button" class="btn sm" data-act="crgmodact" data-id="${m.id}">${ic("flag")}Pôr no plano</button></div></div></div>`; };
  return `<p class="lead">${md === "ativa" ? "Geotecnia ativa: as competências do grupo entram na avaliação e nas trilhas, e o roteiro abaixo guia o estudo." : "Explorando: registre o que atrai você e veja o quanto do caminho já está andado. Quando estiver pronto, ative o roteiro completo."}</p>${modes}
    <div class="g2c">
      ${panel(`${ic("eye")}Interesse`, `<label>O que atrai você na geotecnia?<textarea rows="3" data-crgeo="interesse" placeholder="Ex.: entender o subsolo das obras viárias que já modelo; taludes; fundações de pontes">${esc(G.interesse || "")}</textarea></label>
        <div class="flbl">Objetivos específicos</div><div class="crlist">${G.objetivos.map(o => `<div class="cri"><div>${esc(o.t)}</div><button type="button" class="vb" data-act="crgobjdel" data-id="${o.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("") || `<div class="empty">Ex.: “modelar as camadas de um trecho com sondagens reais até junho”.</div>`}</div>
        <div class="row wrap cradd"><input type="text" id="crgobj" placeholder="Um objetivo em geotecnia"><button type="button" class="btn sm" data-act="crgobjadd">${ic("plus")}Acrescentar</button></div>`)}
      ${panel(`${ic("link")}Pontes com o que você já sabe`, `<div class="crpontes">${pontes}</div>`)}
      ${panel(`${ic("list")}Roteiro em cinco módulos <small>${Object.values(G.mod).filter(v => v === "feito").length} de 5 concluídos</small>`, md === "ativa" ? `<div class="crmods">${CR_GEO_MOD.map(modCard).join("")}</div>` : `<div class="crmods">${modCard(CR_GEO_MOD[0], 0)}</div><p class="muted">Os outros quatro módulos (investigação, obras de terra e taludes, fundações e contenções, BIM geotécnico) aparecem quando você ativar a seção.</p><div class="row"><button type="button" class="btn primary" data-act="crgeo" data-v="ativa">${ic("check")}Ativar o roteiro completo</button></div>`, { cls: "span2" })}
      ${md === "ativa" ? panel(`${ic("sprout")}Trilha BIM aplicado à geotecnia`, crTrilhaCard(crRank().map((x, i) => ({ ...x, i })).find(x => x.t.id === "geo"), crRank().findIndex(x => x.t.id === "geo")), { cls: "span2" }) : ""}
    </div>`;
}
function crPlano() {
  const C = crData(), F = CR.f, gaps = crGapsAll().slice(0, 8), open = C.acoes.filter(a => a.st !== "feito"), feitos = C.acoes.filter(a => a.st === "feito" && a.feito >= addDays(TODAY, -90));
  const acard = a => { const l = a.lib ? crLibBy(a.lib) : null, late = a.st !== "feito" && a.prazo && a.prazo < TODAY;
    return `<div class="cract ${a.st}${late ? " late" : ""}"><button type="button" class="cracst" data-act="cracst" data-id="${a.id}" aria-label="Mudar status: ${a.st}" title="${a.st}">${ic(a.st === "feito" ? "check" : a.st === "andamento" ? "clock" : "plus")}</button><div><b>${a.marco ? `${ic("star")} ` : ""}${esc(a.t)}</b><div class="m">${esc(a.tipo)}${a.comp ? ` · ${esc(a.comp)}` : ""}${a.prazo ? ` · ${late ? `<span class="st-crit">${relDay(a.prazo)}</span>` : relDay(a.prazo)}` : ""}${a.custo ? ` · ${eur(+a.custo)}` : ""}</div>${l ? `<button type="button" class="lnk small" data-act="crlibgo" data-id="${l.id}">${ic("book")}${esc(trunc(l.t, 60))}</button>` : ""}${a.marco && a.crit ? `<p class="small muted">Marco cumprido quando: ${esc(a.crit)}</p>` : ""}</div>
      <div class="cracts"><button type="button" class="lnk" data-act="cracmarco" data-id="${a.id}">${a.marco ? "tirar marco" : "marco"}</button>${a.tarefa ? `<span class="muted small">tarefa criada</span>` : `<button type="button" class="lnk" data-act="cractar" data-id="${a.id}">virar tarefa</button>`}${a.custo && !a.proj ? `<button type="button" class="lnk" data-act="cracproj" data-id="${a.id}">planejar o custo</button>` : ""}<button type="button" class="lnk" data-act="cracdel" data-id="${a.id}">apagar</button></div></div>`; };
  const grupos = [...C.obj.filter(o => o.st !== "arquivado").map(o => [o, crActsOf(o.id)]), [null, C.acoes.filter(a => !a.obj || !C.obj.some(o => o.id === a.obj))]].filter(([o, as]) => as.length || o);
  return `<p class="lead">Da avaliação aos objetivos e dos objetivos à execução: cada ação liga uma competência, um recurso e um prazo. Marque as que são marcos; elas aparecem na linha do tempo dos objetivos.</p>
    ${kpiRow([kmini("var(--a-car)", "Ações abertas", open.length, `${open.filter(a => a.prazo && a.prazo < TODAY).length} atrasadas`, open.some(a => a.prazo && a.prazo < TODAY) ? "crit" : ""), kmini("var(--good)", "Feitas em 90 dias", feitos.length, "o ritmo do plano"), kmini("var(--a-pro)", "Marcos pela frente", open.filter(a => a.marco).length, open.filter(a => a.marco && a.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo))[0] ? `próximo ${relDay(open.filter(a => a.marco && a.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo))[0].prazo)}` : "nenhum com prazo"), kmini("var(--a-fin)", "Custo planejado", eur(sum(open.map(a => +a.custo || 0))), "cursos e certificações em aberto")])}
    <div class="g2c">
      ${panel(`${ic("target")}Do gap à ação`, gaps.length ? `<p class="muted small">Os maiores gaps das trilhas escolhidas, pesados pela importância em cada trilha. Um toque cria a ação com um recurso sugerido.</p><div class="crlist">${gaps.map(g => { const l = crLibFor(g.n)[0]; return `<div class="cri"><div><b>${esc(g.n)}</b> <span class="muted small">${g.lv ? `nível ${g.lv}` : "não avaliado"} → ${g.r}</span>${l ? `<div class="small muted">${ic("book")}${esc(trunc(l.t, 56))}</div>` : ""}</div><button type="button" class="btn sm" data-act="crgapcomp" data-n="${esc(g.n)}" data-r="${g.r}">${ic("plus")}Ação</button></div>`; }).join("")}</div>` : `<div class="empty">Escolha trilhas em Objetivos (ou no Panorama) e avalie as competências: os gaps aparecem aqui.</div>`)}
      ${panel(`${ic("plus")}Nova ação`, `<div class="form f1"><label>Ação<input type="text" data-crf="ac.t" value="${esc(F["ac.t"] || "")}" placeholder="Ex.: fazer o curso de ISO 19650 e escrever um BEP de exemplo"></label></div>
        <div class="form f2"><label>Tipo<select data-crf="ac.tipo">${CR_ATIPO.map(o => `<option${F["ac.tipo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label><label>Prazo<input type="date" data-crf="ac.prazo" value="${esc(F["ac.prazo"] || "")}"></label>
        <label>Objetivo<select data-crf="ac.obj"><option value="">nenhum</option>${C.obj.filter(o => o.st !== "arquivado").map(o => `<option value="${o.id}"${F["ac.obj"] === o.id ? " selected" : ""}>${esc(trunc(o.t, 50))}</option>`).join("")}</select></label><label>Competência<select data-crf="ac.comp"><option value="">nenhuma</option>${crCat().map(c => `<option${F["ac.comp"] === c.n ? " selected" : ""}>${esc(c.n)}</option>`).join("")}</select></label>
        <label>Recurso<select data-crf="ac.lib"><option value="">nenhum</option>${crLibAll().map(l => `<option value="${l.id}"${F["ac.lib"] === l.id ? " selected" : ""}>${esc(trunc(l.t, 60))}</option>`).join("")}</select></label><label>Custo (€)<input type="number" min="0" step="10" data-crf="ac.custo" value="${esc(F["ac.custo"] || "")}"></label></div>
        <label class="ckl"><input type="checkbox" data-crf="ac.marco"${F["ac.marco"] ? " checked" : ""}><span>É um marco (um resultado que dá para verificar)</span></label>${F["ac.marco"] ? `<div class="form f1"><label>Cumprido quando<input type="text" data-crf="ac.crit" value="${esc(F["ac.crit"] || "")}" placeholder="Ex.: certificado emitido; modelo publicado no portfólio"></label></div>` : ""}
        <div class="row"><button type="button" class="btn primary" data-act="cracsave">${ic("check")}Guardar ação</button></div>`, { cls: "cracform" })}
      ${grupos.map(([o, as]) => panel(`${ic(o ? "target" : "list")}${o ? esc(o.t) : "Ações sem objetivo"} <small>${as.filter(a => a.st === "feito").length}/${as.length}</small>`, as.length ? `<div class="cracts-l">${as.slice().sort((a, b) => (a.st === "feito") - (b.st === "feito") || (a.prazo || "9").localeCompare(b.prazo || "9")).map(acard).join("")}</div>` : `<div class="empty">Sem ações ainda.</div>`, { cls: "span2", act: o ? `<button type="button" class="lnk" data-act="cracnew" data-obj="${o.id}">nova ação</button>` : "" })).join("")}
    </div>`;
}
function crBiblioteca() {
  const C = crData(), L = CR.lib, q = norm(L.q), st = C.lib.st, F = CR.f;
  const tops = CR_TOP.filter(t => t[0] !== "geo" || crGeoOn() || L.top === "geo");
  const items = crLibAll().filter(x => (L.top === "todos" ? (x.top !== "geo" || crGeoOn()) : x.top === L.top) && (L.st === "todos" || (st[x.id] || "") === (L.st === "sem" ? "" : L.st)) && (!q || norm(x.t + " " + x.d + " " + (x.comp || []).join(" ")).includes(q)));
  const card = x => { const s = st[x.id] || ""; return `<article class="crlib${s ? " " + s : ""}" id="crl_${x.id}"><header>${crPill(x.tipo, "var(--a-apr)")}${x.free ? crPill("gratuito", "var(--good)") : ""}${x.meu ? crPill("seu", "var(--a-pro)") : ""}<small class="muted">${esc(CR_TOP.find(t => t[0] === x.top)?.[1] || "")}</small></header>
      <h3>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.t)} ${ic("link")}</a>` : esc(x.t)}</h3>${x.d ? `<p>${esc(x.d)}</p>` : ""}${(x.comp || []).length ? `<div class="row wrap">${x.comp.slice(0, 4).map(c => `<span class="crgap">${esc(c)}</span>`).join("")}</div>` : ""}
      <div class="row wrap"><div class="segs">${[["quero", "quero"], ["estudando", "estudando"], ["feito", "concluído"]].map(([v, l]) => `<button type="button" class="seg" data-act="crlibst" data-id="${x.id}" data-v="${v}" aria-pressed="${s === v}">${l}</button>`).join("")}</div><button type="button" class="btn sm" data-act="crlibact" data-id="${x.id}">${ic("flag")}Usar no plano</button>${x.meu ? `<button type="button" class="lnk" data-act="crlibdel" data-id="${x.id}">apagar</button>` : ""}</div></article>`; };
  return `<p class="lead">Normas, cursos, livros, ferramentas e sites que sustentam as trilhas. Os links abrem numa aba nova; marque o que quer estudar, o que está estudando e o que concluiu, e leve qualquer item para o plano.</p>
    <div class="crlibbar"><div class="row wrap">${[["todos", "Todos"], ...tops].map(([v, l]) => `<button type="button" class="jchip${L.top === v ? " on" : ""}" style="--c:var(--a-apr)" data-act="crlibtop" data-v="${v}">${esc(l)}</button>`).join("")}</div>
      <div class="row wrap"><div class="segs">${[["todos", "todos"], ["sem", "sem marca"], ["quero", "quero"], ["estudando", "estudando"], ["feito", "concluídos"]].map(([v, l]) => `<button type="button" class="seg" data-act="crlibstf" data-v="${v}" aria-pressed="${L.st === v}">${l}</button>`).join("")}</div><input type="search" id="crlq" data-crlq="1" value="${esc(L.q)}" placeholder="Buscar por título ou competência" aria-label="Buscar na biblioteca"></div></div>
    <div class="crlibs">${items.map(card).join("") || `<div class="empty">Nada com esses filtros.</div>`}</div>
    ${panel(`${ic("plus")}Acrescentar um recurso seu`, `<div class="form f2"><label>Título<input type="text" data-crf="lib.t" value="${esc(F["lib.t"] || "")}"></label><label>Link<input type="url" data-crf="lib.url" value="${esc(F["lib.url"] || "")}" placeholder="https://"></label><label>Tipo<select data-crf="lib.tipo">${["curso", "livro", "norma", "site", "ferramenta", "certificação", "vídeo"].map(o => `<option${F["lib.tipo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label><label>Tópico<select data-crf="lib.top">${CR_TOP.map(([v, l]) => `<option value="${v}"${F["lib.top"] === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label></div><div class="form f1"><label>Nota<input type="text" data-crf="lib.d" value="${esc(F["lib.d"] || "")}" placeholder="Por que vale a pena"></label></div><div class="row"><button type="button" class="btn primary" data-act="crlibadd">${ic("check")}Guardar</button></div>`)}`;
}

/* ---------------------------------------------------------------- para o Mentor da Carreira */
function crFacts() {
  const C = crData(), P = C.perfil, L = [];
  const rm = crRemun(), R0 = P.remun;
  if (P.cargo || R0.contrato) L.push(`Cargo atual: ${[P.cargo, P.empresa, P.cidade].filter(Boolean).join(", ") || "não informado"}; contrato ${R0.contrato || "não informado"}${R0.ccnl ? `, CCNL ${R0.ccnl}` : ""}${R0.livello ? `, livello ${R0.livello}` : ""}${rm.b ? `; bruto ${eur(rm.b)}/mês${rm.m ? ` × ${rm.m} (RAL ${eur(rm.ral)})` : ""}` : ""}${rm.bp ? `; buoni pasto ${eur(rm.bp)}/mês` : ""}.${P.cargoTri ? ` A trilha "${CR_TRI.find(t => t.id === P.cargoTri)?.t}" é o cargo atual, não um potencial.` : ""}`);
  L.push(`Hub de carreira: mercado ${CR_MERC.find(m => m[0] === (P.mercado || ""))[1]}; senioridade hoje ${P.sen || "não definida"}, alvo ${P.senAlvo || "não definido"}${P.senAno ? ` até ${P.senAno}` : ""}. Visão de 5 anos: ${P.visao || "não escrita"}.`);
  if (P.formacao.length) L.push("Formação: " + P.formacao.map(f => [f.curso, f.tipo, f.inst, f.fim].filter(Boolean).join(", ")).join("; "));
  if (P.exp.length) L.push("Experiência: " + P.exp.map(x => `${x.cargo}${x.org ? " em " + x.org : ""}${x.desc ? ` (${trunc(x.desc, 120)})` : ""}`).join("; "));
  if (P.cert.length) L.push("Certificações: " + P.cert.map(x => x.nome).join("; "));
  if (P.mapa.length) L.push("No mapa de carreira da pessoa: " + P.mapa.join(", ") + (P.caminhos.length ? `; direções possíveis no mapa: ${P.caminhos.join(", ")}` : "") + ".");
  if (P.cargoComp.length) L.push("Competências evidenciadas pelo cargo atual (ainda sem nível): " + P.cargoComp.join(", ") + ".");
  const av = crCat().filter(c => crLv(c.n)); L.push(av.length ? "Competências avaliadas (atual/alvo, 1–5): " + av.map(c => `${c.n} ${crLv(c.n)}/${crAlvo(c.n) || "–"}`).join(", ") : "Nenhuma competência avaliada ainda.");
  L.push("Trilhas (aderência pelo nível · base no mapa): " + crRank().map(x => `${x.t.t}${C.trilhas.includes(x.t.id) ? " [escolhida]" : ""} ${x.nAv ? pct(x.fit) : "–"} · ${pct(x.mapa)}`).join("; "));
  if (C.fortes.length) L.push("Pontos fortes que a pessoa escreveu: " + C.fortes.map(x => x.t).join("; "));
  if (C.gaps.length) L.push("Gaps que a pessoa escreveu: " + C.gaps.map(x => x.t).join("; "));
  if (C.obj.length) L.push("Objetivos: " + C.obj.map(o => `${o.t} (${o.tipo}, ${o.st || "ativo"}${o.prazo ? `, até ${o.prazo}` : ""}${crObjProg(o) != null ? `, ${pct(crObjProg(o))} das ações` : ""})`).join("; "));
  const ab = C.acoes.filter(a => a.st !== "feito"); if (ab.length) L.push("Ações abertas: " + ab.slice(0, 12).map(a => `${a.t}${a.prazo ? ` (${a.prazo})` : ""}${a.marco ? " [marco]" : ""}`).join("; "));
  const X = crExtra();
  if (X.port.length) L.push("Portfólio de projetos:\n" + X.port.slice(0, 10).map(p => `- ${p.t}${p.cliente ? ` (${p.cliente})` : ""}, ${p.tipo}, ${p.fase}${p.papel ? `, papel: ${p.papel}` : ""}${p.numeros ? `; números: ${p.numeros}` : ""}${(p.comps || []).length ? `; competências: ${p.comps.join(", ")}` : ""}${p.r ? `; resultado: ${trunc(p.r, 200)}` : ""}`).join("\n"));
  const DR = crDecCalc(); if (DR.rows.some(r => r.score != null)) L.push("Matriz de decisão (média ponderada, 1 a 5): " + DR.rows.map(r => `${r.x.t} ${r.score == null ? "–" : num(r.score, 2)}`).join("; ") + `; critérios e pesos: ${X.dec.crit.map(c => `${c.n} ${c.w}`).join(", ")}.`);
  const MK = crMerc(); if (MK.n) L.push(`Referências de mercado registradas pela pessoa: ${MK.n}, mediana ${eur(MK.med)} (de ${eur(MK.min)} a ${eur(MK.max)})${MK.pctl != null ? `; ${pct(MK.pctl)} delas em ou abaixo da RAL dela` : ""}.`);
  if (X.merc.pedido.ral || X.merc.pedido.livello) L.push(`Pedido de negociação: ${X.merc.pedido.livello ? `livello ${X.merc.pedido.livello}` : ""} ${MK.pedido ? `RAL ${eur(MK.pedido)}${MK.aum != null ? ` (${pct(MK.aum, 1)})` : ""}` : ""}.`);
  L.push(`Geotecnia: ${C.geo.modo}${C.geo.interesse ? `; interesse: ${trunc(C.geo.interesse, 200)}` : ""}${C.geo.objetivos.length ? `; objetivos: ${C.geo.objetivos.map(o => o.t).join("; ")}` : ""}.`);
  return L;
}

/* ---------------------------------------------------------------- eventos */
function crNewAction(o) { const a = { id: uid(), t: o.t, tipo: o.tipo || "competência", obj: o.obj || "", comp: o.comp || "", lib: o.lib || "", prazo: o.prazo || "", custo: o.custo || "", marco: !!o.marco, crit: o.crit || "", st: "aberta", criado: Date.now() }; crData().acoes.push(a); return a; }
function crClick(t) {
  const ds = t.dataset, a = ds.act, C = () => crData(); if (!a || !a.startsWith("cr")) return false;
  if (a === "crlv") { const v = +ds.v, cur = ds.f === "atual" ? crLv(ds.n) : crAlvo(ds.n); crSet(ds.n, ds.f, cur === v ? 0 : v); touch("comp", { label: `Nível de ${ds.n}` }); return true; }
  if (a === "crgrp") { CR.grp = ds.v; render(); return true; }
  if (a === "crarea") { const ar = C().perfil.areas, i = ar.indexOf(ds.v); i >= 0 ? ar.splice(i, 1) : ar.push(ds.v); touch("carreira", { label: "Áreas de atuação" }); return true; }
  if (a === "cradd") { const k = ds.k, F = CR.f, keys = Object.keys(F).filter(z => z.startsWith(k + ".")), rec = { id: uid() }; keys.forEach(z => rec[z.slice(k.length + 1)] = String(F[z] || "").trim());
    const main = { formacao: "curso", exp: "cargo", cert: "nome", idiomas: "nome" }[k]; if (k === "formacao") rec.tipo ||= "Graduação"; if (!rec[main]) { toast("Preencha o primeiro campo."); return true; }
    C().perfil[k].push(rec); keys.forEach(z => delete CR.f[z]); touch("carreira", { label: "Perfil" }); return true; }
  if (a === "crdel") { const P = C().perfil; P[ds.k] = P[ds.k].filter(x => x.id !== ds.id); touch("carreira", { label: "Item apagado" }); undoToast("Apagado"); return true; }
  if (a === "craddq") { const el = $("#crq_" + ds.k), v = (el?.value || "").trim(); if (!v) return true; C()[ds.k].push({ id: uid(), t: v, data: TODAY }); touch("carreira", { label: ds.k === "fortes" ? "Ponto forte" : "Gap" }); return true; }
  if (a === "crdelq") { C()[ds.k] = C()[ds.k].filter(x => x.id !== ds.id); touch("carreira", { label: "Apagado" }); undoToast("Apagado"); return true; }
  if (a === "crnewc") { const v = ($("#crnewc")?.value || "").trim(); if (!v) return true; if (S.comp.some(c => norm(c.nome) === norm(v))) { toast("Essa competência já existe."); return true; } S.comp.push({ id: uid(), nome: v, atual: "", alvo: "", grupo: "" }); touch("comp", { label: "Competência" }); return true; }
  if (a === "crsnap") { const niveis = Object.fromEntries(crCat().map(c => [c.n, crLv(c.n)]).filter(([, v]) => v)); if (!Object.keys(niveis).length) { toast("Avalie ao menos uma competência antes de registrar."); return true; }
    const sn = C().snaps, last = sn.at(-1); if (last?.data === TODAY) last.niveis = niveis; else sn.push({ data: TODAY, niveis }); touch("carreira", { label: "Avaliação registrada" }); toast("Avaliação de hoje registrada"); return true; }
  if (a === "crtri") { const tr = C().trilhas, i = tr.indexOf(ds.id); if (i >= 0) tr.splice(i, 1); else { if (tr.length >= 3) { toast(`${CR_TRI.find(x => x.id === tr[0]).t} saiu: o limite é 3 trilhas`); tr.shift(); } tr.push(ds.id); } touch("carreira", { label: "Trilhas" }); return true; }
  if (a === "crpasso") { const tr = CR_TRI.find(x => x.id === ds.id); if (C().acoes.some(z => z.t === tr.passo)) { toast("Esse passo já está no plano."); return true; } crNewAction({ t: tr.passo, tipo: "projeto prático", prazo: addDays(TODAY, 30), marco: true, crit: "Resultado publicado no portfólio", lib: tr.lib[0] }); touch("carreira", { label: "Primeiro passo no plano" }); toast("Primeiro passo no plano, com prazo de 30 dias"); return true; }
  if (a === "crlibgo") { const x = crLibBy(ds.id); if (!x) return true; CR.lib = { top: x.top, st: "todos", q: "" }; setHash("carreira", "biblioteca"); setTimeout(() => $("#crl_" + ds.id)?.scrollIntoView({ block: "center" }), 60); return true; }
  if (a === "crgeo") { C().geo.modo = ds.v; touch("carreira", { label: `Geotecnia: ${ds.v}` }); if (ds.v !== "oculta" && SUB !== "geotecnia") setHash("carreira", "geotecnia"); return true; }
  if (a === "crgmod") { C().geo.mod[ds.id] = ds.v; touch("carreira", { label: "Módulo de geotecnia" }); return true; }
  if (a === "crgmodact") { const m = CR_GEO_MOD.find(x => x.id === ds.id); crNewAction({ t: `Estudar: ${m.t}`, tipo: "competência", comp: m.comp, lib: m.lib[0], prazo: addDays(TODAY, 45) }); touch("carreira", { label: "Módulo no plano" }); toast("Módulo no plano"); return true; }
  if (a === "crgobjadd") { const v = ($("#crgobj")?.value || "").trim(); if (!v) return true; C().geo.objetivos.push({ id: uid(), t: v }); touch("carreira", { label: "Objetivo em geotecnia" }); return true; }
  if (a === "crgobjdel") { const G = C().geo; G.objetivos = G.objetivos.filter(x => x.id !== ds.id); touch("carreira", { label: "Apagado" }); return true; }
  if (a === "crobjsave") { const F = CR.f, tt = String(F["obj.t"] || "").trim(); if (!tt) { toast("Escreva o objetivo."); return true; }
    C().obj.push({ id: uid(), t: tt, tipo: F["obj.tipo"] || "especialização", prazo: F["obj.prazo"] || "", tri: F["obj.tri"] || "", metrica: String(F["obj.metrica"] || "").trim(), porque: String(F["obj.porque"] || "").trim(), st: "ativo", criado: Date.now() });
    if (F["obj.tri"] && !C().trilhas.includes(F["obj.tri"]) && C().trilhas.length < 3) C().trilhas.push(F["obj.tri"]);
    Object.keys(F).filter(z => z.startsWith("obj.")).forEach(z => delete CR.f[z]); touch("carreira", { label: "Objetivo" }); return true; }
  if (a === "crobjdel") { const c = C(); c.obj = c.obj.filter(o => o.id !== ds.id); c.acoes.forEach(x => { if (x.obj === ds.id) x.obj = ""; }); touch("carreira", { label: "Objetivo apagado" }); undoToast("Objetivo apagado (as ações ficam sem objetivo)"); return true; }
  if (a === "crgoobj") { setHash("carreira", "objetivos"); setTimeout(() => $("#cro_" + ds.id)?.scrollIntoView({ block: "center" }), 60); return true; }
  if (a === "crmeta") { const o = C().obj.find(x => x.id === ds.id); if (!o || o.meta) return true; const id = uid(); S.metas.push({ id, meta: o.t, area: "Carreira", status: "Ativa", inicio: TODAY, prazo: o.prazo, un: "", ini: "", atual: "", alvo: "", manual: 0, proximo: o.metrica || "", origem: "Hub de carreira" }); o.meta = id; touch("metas", "carreira", { label: "Objetivo virou meta" }); undoToast("Meta criada em Metas & tarefas"); return true; }
  if (a === "cracnew") { CR.f["ac.obj"] = ds.obj || ""; if (SUB !== "plano") setHash("carreira", "plano"); else render(); setTimeout(() => { const el = $('[data-crf="ac.t"]'); el?.scrollIntoView({ block: "center" }); el?.focus(); }, 60); return true; }
  if (a === "cracsave") { const F = CR.f, tt = String(F["ac.t"] || "").trim(); if (!tt) { toast("Escreva a ação."); return true; }
    crNewAction({ t: tt, tipo: F["ac.tipo"] || "competência", obj: F["ac.obj"] || "", comp: F["ac.comp"] || "", lib: F["ac.lib"] || "", prazo: F["ac.prazo"] || "", custo: +F["ac.custo"] > 0 ? +F["ac.custo"] : "", marco: !!F["ac.marco"], crit: String(F["ac.crit"] || "").trim() });
    Object.keys(F).filter(z => z.startsWith("ac.")).forEach(z => delete CR.f[z]); touch("carreira", { label: "Ação" }); return true; }
  if (a === "cracst") { const x = C().acoes.find(z => z.id === ds.id); if (!x) return true; x.st = { aberta: "andamento", andamento: "feito", feito: "aberta" }[x.st] || "andamento"; x.feito = x.st === "feito" ? TODAY : ""; touch("carreira", { label: `Ação: ${x.st}` }); return true; }
  if (a === "cracmarco") { const x = C().acoes.find(z => z.id === ds.id); if (x) { x.marco = !x.marco; touch("carreira", { label: "Marco" }); } return true; }
  if (a === "cracdel") { const c = C(); c.acoes = c.acoes.filter(z => z.id !== ds.id); touch("carreira", { label: "Ação apagada" }); undoToast("Ação apagada"); return true; }
  if (a === "cractar") { const x = C().acoes.find(z => z.id === ds.id); if (!x || x.tarefa) return true; const id = uid(), o = C().obj.find(z => z.id === x.obj); S.tarefas.push({ id, tarefa: x.t, projeto: "", area: "Carreira", prio: x.marco ? "Alta" : "Média", prazo: x.prazo, status: "A fazer", concluida: "", meta: o?.meta ? S.metas.find(m => m.id === o.meta)?.meta || "" : "", origem: "Hub de carreira" }); x.tarefa = id; touch("tarefas", "carreira", { label: "Ação virou tarefa" }); undoToast("Tarefa criada em Metas & tarefas"); return true; }
  if (a === "cracproj") { const x = C().acoes.find(z => z.id === ds.id); if (!x || x.proj) return true; const id = uid(); S.projetos = [...(S.projetos || []), { id, criado: Date.now(), nome: x.t, tipo: "projeto", cat: "Educação", prio: x.marco ? "importante" : "desejo", valor: +x.custo, prazo: x.prazo || addDays(TODAY, 90), status: "planejando", forma: "poupar", entrada: "", taxa: "", parcelas: "", etapas: [], notas: "Criado no hub de carreira", aportes: [], mentor: [] }]; x.proj = id; touch("projetos", "carreira", { label: "Custo planejado" }); undoToast("Projeto criado em Finanças › Projetos & aquisições"); return true; }
  if (a === "crgapcomp") { const n = ds.n, r = +ds.r, l = crLibFor(n)[0]; if (C().acoes.some(z => z.comp === n && z.st !== "feito")) { toast("Já há uma ação aberta para essa competência."); return true; } crNewAction({ t: `Elevar ${n} de ${crLv(n) || "?"} para ${r}${l ? `: ${trunc(l.t, 60)}` : ""}`, tipo: l?.tipo === "certificação" ? "certificação" : l?.tipo === "curso" ? "curso" : "competência", comp: n, lib: l?.id || "", prazo: addDays(TODAY, 60) }); touch("carreira", { label: "Gap virou ação" }); toast("Ação criada no plano"); return true; }
  if (a === "crgapact") { crNewAction({ t: ds.t, tipo: "competência", prazo: addDays(TODAY, 60) }); touch("carreira", { label: "Gap virou ação" }); toast("Ação criada no plano"); return true; }
  if (a === "crlibtop") { CR.lib.top = ds.v; render(); return true; }
  if (a === "crlibstf") { CR.lib.st = ds.v; render(); return true; }
  if (a === "crlibst") { const s = C().lib.st; s[ds.id] === ds.v ? delete s[ds.id] : s[ds.id] = ds.v; touch("carreira", { label: "Biblioteca" }); return true; }
  if (a === "crlibact") { const x = crLibBy(ds.id); if (!x) return true; if (C().acoes.some(z => z.lib === x.id && z.st !== "feito")) { toast("Esse recurso já está numa ação aberta."); return true; } crNewAction({ t: `${x.tipo === "certificação" ? "Obter" : x.tipo === "livro" ? "Ler" : x.tipo === "norma" ? "Estudar" : "Fazer"}: ${x.t}`, tipo: x.tipo === "certificação" ? "certificação" : x.tipo === "curso" ? "curso" : "competência", lib: x.id, comp: (x.comp || [])[0] || "", prazo: addDays(TODAY, 60) }); if (!C().lib.st[x.id]) C().lib.st[x.id] = "quero"; touch("carreira", { label: "Recurso no plano" }); toast("Ação criada no plano"); return true; }
  if (a === "crlibadd") { const F = CR.f, tt = String(F["lib.t"] || "").trim(); if (!tt) { toast("Dê um título ao recurso."); return true; } const url = String(F["lib.url"] || "").trim();
    C().lib.meus.push({ id: "m" + uid(), meu: true, t: tt, url: /^https?:\/\//.test(url) ? url : "", tipo: F["lib.tipo"] || "curso", top: F["lib.top"] || "gest", d: String(F["lib.d"] || "").trim(), comp: [] }); Object.keys(F).filter(z => z.startsWith("lib.")).forEach(z => delete CR.f[z]); touch("carreira", { label: "Recurso" }); return true; }
  if (a === "crlibdel") { const L = C().lib; L.meus = L.meus.filter(x => x.id !== ds.id); delete L.st[ds.id]; touch("carreira", { label: "Recurso apagado" }); undoToast("Recurso apagado"); return true; }
  if (a === "crask") { MST.input.car = "Leia o meu hub de carreira (perfil, mapa, competências avaliadas, trilhas e objetivos) e me dê, em ordem: 1) os 3 potenciais de crescimento mais fortes, com o porquê; 2) os 3 pontos mais fracos do meu plano; 3) o que teria que ser verdade para a trilha que lidera dar errado; 4) uma ação para os próximos 30 dias."; setHash("mentor", "car"); return true; }
  return false;
}
function crInput(t) {
  const ds = t.dataset;
  if (ds.crf) { CR.f[ds.crf] = t.type === "checkbox" ? t.checked : t.value; if (t.type === "checkbox") render(); return true; }
  if (ds.crlq) { CR.lib.q = t.value; reRender(); return true; }
  return false;
}
function crChange(t) {
  const ds = t.dataset, C = crData();
  if (ds.crf) { CR.f[ds.crf] = t.type === "checkbox" ? t.checked : t.value; return true; }
  if (ds.crr) { const v = t.value.trim(); C.perfil.remun[ds.crr] = t.type === "number" ? (v === "" ? "" : +v) : v; touch("carreira", { label: "Contrato e remuneração" }); return true; }
  if (ds.crp) { C.perfil[ds.crp] = t.value.trim(); touch("carreira", { label: "Perfil", noRender: t.tagName === "TEXTAREA" }); return true; }
  if (ds.crev) { const n = ds.crev; let x = S.comp.find(c => norm(c.nome) === norm(n)); if (!x) { if (!t.value.trim()) return true; crSet(n, "atual", 0); x = S.comp.find(c => norm(c.nome) === norm(n)); } x.evid = t.value.trim(); touch("comp", { label: "Evidência", noRender: true }); return true; }
  if (ds.crgeo) { C.geo[ds.crgeo] = t.value.trim(); touch("carreira", { label: "Geotecnia", noRender: true }); return true; }
  if (ds.crobjst) { const o = C.obj.find(z => z.id === ds.crobjst); if (o) { o.st = t.value; touch("carreira", { label: "Status do objetivo" }); } return true; }
  return false;
}

/* ---------------------------------------------------------------- portfólio, decisões e mercado
   portfólio: carreira.port (projetos com competências usadas, números e STAR) — cada projeto é evidência das competências;
   decisões: carreira.dec { crit: [[nome, peso]], cen: [{ id, t, notas, s: { crit: 1..5 } }] } — média ponderada aberta;
   mercado: carreira.merc { bench: [{ fonte, cargo, cidade, ral, data, tipo }], resp, conq, pedido } — mediana e percentil. */
const CR_PTIPO = ["Rodovia", "Ferrovia", "Infraestrutura urbana", "Edificação", "Outro"];
const CR_PFASE = ["PFTE (viabilidade técnico-econômica)", "Projeto executivo", "Obra", "Operação e manutenção", "Outro"];
const CR_CRIT0 = [["Remuneração", 4], ["Aprendizado e crescimento", 4], ["Alinhamento com o meu norte", 5], ["Estabilidade", 3], ["Qualidade de vida e tempo", 4], ["Risco baixo", 2]];
const CR_CEN0 = ["Ficar e negociar o livello", "BIM Manager em outra empresa", "Especializar em 4D/5D", "Consultoria em paralelo (Partita IVA)", "Cursos e treinamentos em paralelo"];
const CR_BTIPO = ["Proposta real", "Anúncio de vaga", "Pesquisa salarial", "Colega da área", "Outro"];
function crExtra() { const c = crData(); c.port ||= []; c.dec ||= {}; c.dec.crit ||= CR_CRIT0.map(([n, w]) => ({ id: uid(), n, w })); c.dec.cen ||= []; c.merc ||= {}; c.merc.bench ||= []; c.merc.resp ||= []; c.merc.conq ||= []; c.merc.pedido ||= {}; return c; }
const crEvid = name => (crData().port || []).filter(p => (p.comps || []).includes(name));
function crDecCalc() {
  const D = crExtra().dec, cs = D.crit.filter(c => +c.w > 0), W = sum(cs.map(c => +c.w));
  const rows = D.cen.map(x => { const rated = cs.filter(c => +x.s?.[c.id] > 0), Wr = sum(rated.map(c => +c.w)); return { x, score: Wr ? sum(rated.map(c => c.w * x.s[c.id])) / Wr : null, comp: W ? Wr / W : 0 }; }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  let sens = [];
  if (rows.length >= 2 && rows[0].score != null && rows[1].score != null) { const gap = rows[0].score - rows[1].score, b = rows[1].x;
    sens = cs.map(c => { const cur = +b.s?.[c.id] || 0, need = gap * W / c.w; return { c, cur, need, ok: cur > 0 && cur + need <= 5 + 1e-9 }; }).sort((p, q) => p.need - q.need); }
  return { rows, sens, W, cs };
}
function crMerc() {
  const M = crExtra().merc, v = M.bench.map(b => +b.ral).filter(x => x > 0).sort((a, b) => a - b), ral = crRemun().ral;
  const med = v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : null;
  return { n: v.length, med, min: v[0] ?? null, max: v.at(-1) ?? null, ral, pctl: ral && v.length ? v.filter(x => x <= ral).length / v.length : null, gap: ral && med ? med - ral : null, tfr: ral ? ral / 13.5 : null, pedido: +M.pedido.ral || null, aum: ral && +M.pedido.ral ? (+M.pedido.ral - ral) / ral : null };
}
function crPortfolio() {
  const C = crExtra(), F = CR.f, P = C.port.slice().sort((a, b) => (b.inicio || "").localeCompare(a.inicio || "")), sel = F["pt.comps"] || [];
  const ev = crCat().map(c => [c.n, crEvid(c.n).length]).filter(([, n]) => n).sort((a, b) => b[1] - a[1]);
  const card = p => `<article class="crport"><header><b>${esc(p.t)}</b><span class="crtag" style="--c:var(--a-car)">${esc(p.tipo || "")}</span>${p.fase ? `<span class="crtag" style="--c:var(--a-pro)">${esc(p.fase.split(" (")[0])}</span>` : ""}<small class="muted">${esc([p.cliente, [p.inicio, p.fim || "atual"].filter(Boolean).join(" a ")].filter(Boolean).join(" · "))}</small></header>
      ${p.papel ? `<p><b>Papel:</b> ${esc(p.papel)}</p>` : ""}${p.numeros ? `<p class="crnum">${ic("table")}${esc(p.numeros)}</p>` : ""}
      <div class="row wrap">${(p.comps || []).map(c => `<span class="crgap">${esc(c)}</span>`).join("")}</div>
      ${p.s || p.ta || p.a || p.r ? `<details class="crdet"><summary>STAR</summary><dl class="crstar">${[["Situação", p.s], ["Tarefa", p.ta], ["Ação", p.a], ["Resultado", p.r]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></details>` : `<p class="muted small">Sem STAR ainda: ele vira resposta pronta de entrevista e item de CV.</p>`}
      <div class="row wrap"><button type="button" class="lnk" data-act="crptedit" data-id="${p.id}">editar</button><button type="button" class="lnk" data-act="crptdel" data-id="${p.id}">apagar</button></div></article>`;
  const fld = (k, l, ph = "", tp = "text") => `<label>${l}<input type="${tp}" data-crf="pt.${k}" value="${esc(F["pt." + k] || "")}" placeholder="${esc(ph)}"></label>`, ta = (k, l, ph) => `<label>${l}<textarea rows="2" data-crf="pt.${k}" placeholder="${esc(ph)}">${esc(F["pt." + k] || "")}</textarea></label>`;
  return `<p class="lead">Os projetos que você fez são a prova do que sabe: cada um liga competências, números e uma história no formato STAR (situação, tarefa, ação, resultado). Eles contam como evidência na avaliação, viram respostas de entrevista e saem prontos num CV.</p>
    ${kpiRow([kmini("var(--a-car)", "Projetos", C.port.length, `${C.port.filter(p => p.s && p.a && p.r).length} com STAR completo`), kmini("var(--a-pro)", "Competências com evidência", `${ev.length} de ${crCat().length}`, "usadas em pelo menos um projeto"), kmini("var(--good)", "Com números", C.port.filter(p => p.numeros).length, "resultados quantificados")])}
    <div class="g2c">
      ${panel(`${ic(F["pt.id"] ? "edit" : "plus")}${F["pt.id"] ? "Editar projeto" : "Novo projeto"}`, `<div class="form f2">${fld("t", "Projeto", "ex.: variante SS20, lotto 2")}${fld("cliente", "Cliente ou contratante")}<label>Tipo<select data-crf="pt.tipo">${CR_PTIPO.map(o => `<option${F["pt.tipo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label><label>Fase<select data-crf="pt.fase">${CR_PFASE.map(o => `<option${F["pt.fase"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label>${fld("papel", "O seu papel", "ex.: coordenador BIM de infraestrutura")}${fld("inicio", "Início", "", "month")}${fld("fim", "Fim (vazio = em curso)", "", "month")}${fld("numeros", "Números", "km, valor da obra, disciplinas, interferências resolvidas")}</div>
        <div class="flbl">Competências usadas</div><div class="row wrap crptc">${crCat().map(c => `<button type="button" class="jchip${sel.includes(c.n) ? " on" : ""}" style="--c:${crGrpCol(c.g)}" data-act="crptc" data-n="${esc(c.n)}">${esc(c.n)}</button>`).join("")}</div>
        <div class="form f1">${ta("s", "Situação", "o contexto e o desafio")}${ta("ta", "Tarefa", "o que cabia a você")}${ta("a", "Ação", "o que você fez, com quais ferramentas e decisões")}${ta("r", "Resultado", "o que mudou, de preferência em números")}</div>
        <div class="row wrap"><button type="button" class="btn primary" data-act="crptsave">${ic("check")}${F["pt.id"] ? "Salvar" : "Guardar projeto"}</button>${F["pt.id"] ? `<button type="button" class="btn" data-act="crptcancel">Cancelar</button>` : ""}</div>`, { cls: "span2" })}
      ${panel(`${ic("brief")}Projetos <small>${C.port.length}</small>`, P.length ? `<div class="crports">${P.map(card).join("")}</div>` : `<div class="empty">Comece pelo projeto mais recente da Nemesis ou pelo que mais orgulha você.</div>`, { cls: "span2" })}
      ${panel(`${ic("target")}Evidência por competência`, ev.length ? hbars(ev.slice(0, 14).map(([n, k]) => ({ l: n, v: k, color: crGrpCol(CR_COMP.find(c => c.n === n)?.g), txt: plural(k, "projeto", "projetos") })), {}) : `<div class="empty">Marque as competências usadas em cada projeto.</div>`)}
      ${panel(`${ic("download")}CV e entrevistas`, `<p class="muted">O CV sai do perfil, das competências avaliadas e dos projetos. A versão local é um texto pronto para editar; o Mentor da Carreira escreve versões em italiano ou inglês e treina as respostas STAR com você.</p>
        <div class="row wrap"><button type="button" class="btn sm" data-act="crcv">${ic("download")}Baixar CV e portfólio (.md)</button><button type="button" class="btn sm" data-act="crcvai" data-l="italiano">${ic("spark")}CV em italiano com o mentor</button><button type="button" class="btn sm" data-act="crcvai" data-l="inglês">${ic("spark")}CV em inglês com o mentor</button></div>
        <div class="flbl">Treinar entrevista</div><div class="row wrap"><select id="crent" aria-label="Cargo da entrevista">${CR_TRI.map(t => `<option value="${t.id}">${esc(t.t)}</option>`).join("")}</select><button type="button" class="btn sm primary" data-act="crentrev">${ic("spark")}Começar</button></div>`)}
    </div>`;
}
function crDecisoes() {
  const C = crExtra(), D = C.dec, R = crDecCalc(), F = CR.f;
  const grid = D.cen.length ? `<div class="hscroll"><table class="dt crdec"><thead><tr><th>Critério</th><th class="num">Peso</th>${D.cen.map(x => `<th>${esc(trunc(x.t, 28))}<button type="button" class="vb" data-act="crcendel" data-id="${x.id}" aria-label="Apagar cenário">${ic("trash")}</button></th>`).join("")}</tr></thead>
      <tbody>${D.crit.map(c => `<tr><th>${esc(c.n)}<button type="button" class="vb" data-act="crcritdel" data-id="${c.id}" aria-label="Apagar critério">${ic("x")}</button></th><td class="num"><input type="number" min="0" max="5" step="1" class="crw" data-crdw="${c.id}" value="${c.w}" aria-label="Peso de ${esc(c.n)}"></td>${D.cen.map(x => `<td><select class="crs" data-crds="${x.id}|${c.id}" aria-label="${esc(x.t)} em ${esc(c.n)}"><option value="">–</option>${[1, 2, 3, 4, 5].map(n => `<option${+x.s?.[c.id] === n ? " selected" : ""}>${n}</option>`).join("")}</select></td>`).join("")}</tr>`).join("")}
      <tr class="crdtot"><th>Nota ponderada</th><td></td>${D.cen.map(x => { const r = R.rows.find(z => z.x === x); return `<td><b>${r.score == null ? "–" : num(r.score, 2)}</b>${r.comp < 1 ? `<small class="muted"> · ${pct(r.comp)} avaliado</small>` : ""}</td>`; }).join("")}</tr></tbody></table></div>` : `<div class="empty">Acrescente pelo menos dois cenários para comparar.</div>`;
  const top = R.rows[0], sec = R.rows[1];
  return `<p class="lead">Para as decisões grandes: compare cenários com os critérios que importam para você, cada um com o seu peso. A conta é aberta (Σ peso × nota ÷ Σ peso) e, abaixo, o que teria que mudar para o segundo lugar passar o primeiro.</p>
    <div class="g2c">
      ${panel(`${ic("plus")}Cenários`, `<div class="row wrap cradd"><input type="text" data-crf="dc.t" value="${esc(F["dc.t"] || "")}" placeholder="Um caminho possível"><button type="button" class="btn sm" data-act="crcenadd">${ic("plus")}Acrescentar</button></div>
        <div class="flbl">Modelos</div><div class="row wrap">${CR_CEN0.filter(t => !D.cen.some(x => x.t === t)).map(t => `<button type="button" class="jchip" style="--c:var(--a-car)" data-act="crcen0" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>
        <div class="row wrap cradd"><input type="text" data-crf="dc.c" value="${esc(F["dc.c"] || "")}" placeholder="Outro critério (ex.: perto da família)"><button type="button" class="btn sm" data-act="crcritadd">${ic("plus")}Critério</button></div>`)}
      ${panel(`${ic("sprout")}Resultado`, R.rows.length ? `${hbars(R.rows.filter(r => r.score != null).map((r, i) => ({ l: r.x.t, v: r.score, color: i === 0 ? "var(--a-car)" : "var(--muted)", txt: num(r.score, 2) })), { max: 5 })}
        ${top?.score != null && sec?.score != null ? `<div class="flbl">O que teria que ser verdade para “${esc(trunc(sec.x.t, 40))}” passar “${esc(trunc(top.x.t, 40))}”</div><p class="muted small">Diferença: ${num(top.score - sec.score, 2)} ponto. Subir a nota do segundo em um critério de peso w muda a média em Δ × w ÷ ${R.W}.</p><ul class="crsens">${R.sens.slice(0, 5).map(s => `<li>${s.ok ? "" : `<span class="muted">`}<b>${esc(s.c.n)}</b> (peso ${s.c.w}): de ${s.cur || "–"} para ${num(Math.min(99, s.cur + s.need), 1)}${s.ok ? "" : " — não basta, passa de 5</span>"}</li>`).join("")}</ul>` : ""}` : `<div class="empty">O ranking aparece quando houver notas.</div>`)}
      ${panel(`${ic("table")}Matriz`, grid + `<p class="muted small">Notas de 1 (péssimo) a 5 (ótimo); peso 0 tira o critério da conta. “Risco baixo”: 5 é o mais seguro.</p><div class="row"><button type="button" class="btn sm" data-act="crdecai">${ic("spark")}Discutir a decisão com o Mentor da Carreira</button></div>`, { cls: "span2" })}
    </div>`;
}
function crMercado() {
  const C = crExtra(), M = C.merc, x = crMerc(), F = CR.f, P = C.perfil;
  const bs = M.bench.slice().sort((a, b) => (+b.ral || 0) - (+a.ral || 0));
  const dots = x.n ? (() => { const all = [...M.bench.map(b => +b.ral).filter(v => v > 0), x.ral || 0, x.pedido || 0].filter(Boolean), lo = Math.min(...all) * .95, hi = Math.max(...all) * 1.05, W = 1000, X = v => 20 + (W - 40) * (v - lo) / (hi - lo || 1);
      let g = `<line x1="20" y1="40" x2="${W - 20}" y2="40" class="crtl-ax"/>`; M.bench.filter(b => +b.ral > 0).forEach(b => { g += `<circle cx="${X(+b.ral).toFixed(1)}" cy="40" r="6" class="crbd"><title>${esc(b.cargo || "")} · ${esc(b.fonte || "")} · ${eur(+b.ral)}</title></circle>`; });
      if (x.med) g += `<line x1="${X(x.med).toFixed(1)}" y1="22" x2="${X(x.med).toFixed(1)}" y2="58" class="crtl-hoje"/><text x="${X(x.med).toFixed(1)}" y="16" text-anchor="middle" class="ax">mediana ${eur(x.med)}</text>`;
      if (x.ral) g += `<rect x="${(X(x.ral) - 6).toFixed(1)}" y="34" width="12" height="12" transform="rotate(45 ${X(x.ral).toFixed(1)} 40)" class="crbme"/><text x="${X(x.ral).toFixed(1)}" y="74" text-anchor="middle" class="crtl-l">você ${eur(x.ral)}</text>`;
      if (x.pedido) g += `<rect x="${(X(x.pedido) - 5).toFixed(1)}" y="35" width="10" height="10" class="crbped"/><text x="${X(x.pedido).toFixed(1)}" y="92" text-anchor="middle" class="ax">pedido ${eur(x.pedido)}</text>`;
      return `<div class="hscroll">${svgWrap(W, 100, g, "Referências de mercado, a sua RAL e o pedido")}</div>`; })() : emptyChart("Acrescente referências reais: propostas, anúncios com faixa salarial, pesquisas, colegas.");
  const list = (k, ph) => `<div class="crlist">${M[k].map(i => `<div class="cri"><div>${esc(i.t)}${i.proj ? ` <span class="muted small">· ${esc(C.port.find(p => p.id === i.proj)?.t || "")}</span>` : ""}</div><button type="button" class="vb" data-act="crmdel" data-k="${k}" data-id="${i.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("") || `<div class="empty">${ph}</div>`}</div>
    <div class="row wrap cradd"><input type="text" data-crf="m.${k}" value="${esc(F["m." + k] || "")}" placeholder="${ph}">${C.port.length ? `<select data-crf="m.${k}p" aria-label="Projeto"><option value="">projeto (opcional)</option>${C.port.map(p => `<option value="${p.id}"${F["m." + k + "p"] === p.id ? " selected" : ""}>${esc(trunc(p.t, 40))}</option>`).join("")}</select>` : ""}<button type="button" class="btn sm" data-act="crmadd" data-k="${k}">${ic("plus")}Acrescentar</button></div>`;
  return `<p class="lead">Onde a sua remuneração está em relação ao mercado, com referências que você mesmo registra (nada inventado), e um dossiê para negociar: o que você faz, o que conquistou e o que vai pedir.</p>
    ${kpiRow([kmini("var(--a-fin)", "Sua RAL", x.ral ? eur(x.ral) : "–", x.ral ? `${eur(crRemun().b)} × ${crRemun().m}` : "preencha em Avaliação atual"), kmini("var(--a-car)", "Mediana das referências", x.med ? eur(x.med) : "–", `${plural(x.n, "referência", "referências")}`), kmini(x.pctl != null && x.pctl < .5 ? "var(--warn)" : "var(--good)", "Sua posição", x.pctl == null ? "–" : `${pct(x.pctl)}`, x.pctl == null ? "precisa da RAL e de referências" : "das referências ficam em ou abaixo da sua RAL"), kmini("var(--a-pro)", "TFR por ano", x.tfr ? `≈ ${eur(x.tfr)}` : "–", "RAL ÷ 13,5 (art. 2120 do Código Civil)")])}
    <div class="g2c">
      ${vis("crbench", "Referências de mercado", dots, { cls: "span2", sub: "cada ponto é uma referência; o losango é a sua RAL; a linha tracejada é a mediana", nofocus: true })}
      ${panel(`${ic("plus")}Nova referência`, `<div class="form f2"><label>RAL (€)<input type="number" min="0" step="500" data-crf="bm.ral" value="${esc(F["bm.ral"] || "")}"></label><label>Cargo<input type="text" data-crf="bm.cargo" value="${esc(F["bm.cargo"] || "")}" placeholder="ex.: BIM Manager infraestrutura"></label><label>Cidade<input type="text" data-crf="bm.cidade" value="${esc(F["bm.cidade"] || P.cidade || "")}"></label><label>Tipo<select data-crf="bm.tipo">${CR_BTIPO.map(o => `<option${F["bm.tipo"] === o ? " selected" : ""}>${o}</option>`).join("")}</select></label></div><div class="form f1"><label>Fonte<input type="text" data-crf="bm.fonte" value="${esc(F["bm.fonte"] || "")}" placeholder="onde viu: anúncio, empresa, pesquisa, pessoa"></label></div><div class="row"><button type="button" class="btn sm primary" data-act="crbadd">${ic("check")}Guardar referência</button></div>`)}
      ${panel(`${ic("table")}Referências <small>${x.n}</small>`, bs.length ? `<div class="crlist">${bs.map(b => `<div class="cri"><div><b>${eur(+b.ral)}</b> ${esc(b.cargo || "")} <span class="muted small">${esc([b.cidade, b.tipo, b.fonte, b.data && fmtDY(b.data)].filter(Boolean).join(" · "))}</span></div><button type="button" class="vb" data-act="crbdel" data-id="${b.id}" aria-label="Apagar">${ic("trash")}</button></div>`).join("")}</div>` : `<div class="empty">Nenhuma referência ainda.</div>`)}
      ${panel(`${ic("brief")}Dossiê de negociação`, `<div class="flbl">Responsabilidades que exerço</div>${list("resp", "ex.: coordeno a equipe de modelagem do setor Stradale")}
        <div class="flbl">Conquistas do último ano</div>${list("conq", "ex.: entreguei o executivo do lote 2 sem retrabalho")}
        <div class="flbl">O pedido</div><div class="form f2"><label>Livello pedido<input type="text" data-crmp="livello" value="${esc(M.pedido.livello || "")}" placeholder="ex.: 2"></label><label>RAL pedida (€)<input type="number" min="0" step="500" data-crmp="ral" value="${esc(M.pedido.ral || "")}"></label></div>
        <p class="muted small">${x.aum != null ? `Pedido = ${x.aum >= 0 ? "+" : ""}${pct(x.aum, 1)} sobre a RAL atual${x.med ? `; ${x.pedido > x.med ? "acima" : x.pedido < x.med ? "abaixo" : "igual à"} da mediana das suas referências` : ""}.` : "Informe a RAL pedida para ver o aumento."}</p>
        <div class="row wrap"><button type="button" class="btn sm" data-act="crdoss">${ic("download")}Baixar o dossiê (.md)</button><button type="button" class="btn sm primary" data-act="crnegai">${ic("spark")}Ensaiar a conversa com o mentor</button></div>`, { cls: "span2" })}
    </div>`;
}
/* textos exportados */
function crCVmd() {
  const C = crExtra(), P = C.perfil, av = crCat().filter(c => crLv(c.n)).sort((a, b) => crLv(b.n) - crLv(a.n));
  return [`# ${S.cfg.nome || "Currículo"}`, [P.cargo, P.empresa, P.cidade].filter(Boolean).join(" · "), "", "## Formação", ...P.formacao.map(f => `- ${[f.curso, f.tipo, f.inst, f.fim].filter(Boolean).join(", ")}`), "", "## Experiência", ...P.exp.map(x => `- **${x.cargo}**${x.org ? `, ${x.org}` : ""}${x.inicio ? ` (${x.inicio} a ${x.fim || "atual"})` : ""}${x.desc ? `: ${x.desc}` : ""}`),
    "", "## Projetos", ...C.port.flatMap(p => [`### ${p.t}${p.cliente ? ` · ${p.cliente}` : ""}`, [p.tipo, p.fase, p.papel, [p.inicio, p.fim || (p.inicio ? "atual" : "")].filter(Boolean).join(" a ")].filter(Boolean).join(" · "), p.numeros ? `- Números: ${p.numeros}` : "", p.a ? `- ${p.a}` : "", p.r ? `- Resultado: ${p.r}` : "", (p.comps || []).length ? `- Competências: ${p.comps.join(", ")}` : "", ""]).filter((l, i, a) => l !== "" || a[i - 1] !== ""),
    "## Competências", ...av.map(c => `- ${c.n}: ${CR_LV[crLv(c.n)]}`), "", "## Certificações", ...P.cert.map(x => `- ${x.nome}${x.emissor ? `, ${x.emissor}` : ""}${x.data ? ` (${x.data})` : ""}`), "", "## Idiomas", ...P.idiomas.map(x => `- ${x.nome}${x.nivel ? ` ${x.nivel}` : ""}`)].join("\n");
}
function crDossMd() {
  const C = crExtra(), M = C.merc, x = crMerc(), P = C.perfil, r = P.remun;
  return [`# Dossiê de negociação · ${fmtDY(TODAY)}`, "", `**Hoje:** ${[P.cargo, P.empresa].filter(Boolean).join(", ")}; ${r.contrato || ""}${r.ccnl ? `, CCNL ${r.ccnl}` : ""}${r.livello ? `, livello ${r.livello}` : ""}; RAL ${x.ral ? eur(x.ral) : "–"}.`, `**Pedido:** ${M.pedido.livello ? `livello ${M.pedido.livello}` : ""}${M.pedido.livello && x.pedido ? "; " : ""}${x.pedido ? `RAL ${eur(x.pedido)} (${x.aum >= 0 ? "+" : ""}${pct(x.aum, 1)})` : ""}`, "",
    "## Responsabilidades que exerço", ...M.resp.map(i => `- ${i.t}${i.proj ? ` (${C.port.find(p => p.id === i.proj)?.t || ""})` : ""}`), "", "## Conquistas do último ano", ...M.conq.map(i => `- ${i.t}${i.proj ? ` (${C.port.find(p => p.id === i.proj)?.t || ""})` : ""}`), "",
    "## Projetos que sustentam o pedido", ...C.port.filter(p => p.r || p.numeros).map(p => `- **${p.t}**: ${[p.numeros, p.r].filter(Boolean).join("; ")}`), "",
    "## Referências de mercado", x.n ? `Mediana ${eur(x.med)} em ${plural(x.n, "referência", "referências")} (de ${eur(x.min)} a ${eur(x.max)}); ${pct(x.pctl)} delas ficam em ou abaixo da RAL atual.` : "Nenhuma registrada.", ...M.bench.map(b => `- ${eur(+b.ral)} · ${[b.cargo, b.cidade, b.tipo, b.fonte].filter(Boolean).join(" · ")}`)].join("\n");
}
function crAskCar(text) { MST.input.car = ""; setHash("mentor", "car"); setTimeout(() => askMentor("car", text), 80); }
function crClick2(t) {
  const ds = t.dataset, a = ds.act; if (!a || !a.startsWith("cr")) return false;
  const C = crExtra(), F = CR.f;
  if (a === "crptc") { const s = (F["pt.comps"] ||= []), i = s.indexOf(ds.n); i >= 0 ? s.splice(i, 1) : s.push(ds.n); render(); return true; }
  if (a === "crptsave") { const g = k => String(F["pt." + k] ?? "").trim(); if (!g("t")) { toast("Dê um nome ao projeto."); return true; }
    const rec = { id: F["pt.id"] || uid(), t: g("t"), cliente: g("cliente"), tipo: F["pt.tipo"] || CR_PTIPO[0], fase: F["pt.fase"] || CR_PFASE[0], papel: g("papel"), inicio: g("inicio"), fim: g("fim"), numeros: g("numeros"), comps: [...(F["pt.comps"] || [])], s: g("s"), ta: g("ta"), a: g("a"), r: g("r") };
    const i = C.port.findIndex(p => p.id === rec.id); i >= 0 ? C.port[i] = rec : C.port.push(rec);
    Object.keys(F).filter(k => k.startsWith("pt.")).forEach(k => delete F[k]); touch("carreira", { label: i >= 0 ? "Projeto editado" : "Projeto no portfólio" }); return true; }
  if (a === "crptedit") { const p = C.port.find(z => z.id === ds.id); if (!p) return true; Object.keys(F).filter(k => k.startsWith("pt.")).forEach(k => delete F[k]); for (const k of ["t", "cliente", "tipo", "fase", "papel", "inicio", "fim", "numeros", "s", "ta", "a", "r"]) F["pt." + k] = p[k] || ""; F["pt.comps"] = [...(p.comps || [])]; F["pt.id"] = p.id; render(); window.scrollTo({ top: 0 }); return true; }
  if (a === "crptcancel") { Object.keys(F).filter(k => k.startsWith("pt.")).forEach(k => delete F[k]); render(); return true; }
  if (a === "crptdel") { C.port = C.port.filter(p => p.id !== ds.id); touch("carreira", { label: "Projeto apagado" }); undoToast("Projeto apagado"); return true; }
  if (a === "crcv") { saveFile(`cv-portfolio-${TODAY}.md`, crCVmd()); return true; }
  if (a === "crcvai") { crAskCar(`Escreva o meu CV em ${ds.l}, no formato europeu, a partir do meu perfil, das competências avaliadas e dos projetos do portfólio (use os números e os resultados STAR). Uma página, verbos de ação, sem inventar nada que não esteja nos dados; marque com [?] o que faltar.`); return true; }
  if (a === "crentrev") { const tr = CR_TRI.find(z => z.id === ($("#crent")?.value || "manager")); crAskCar(`Vamos treinar uma entrevista para ${tr.t} (${tr.papel}). Faça uma pergunta por vez, como o recrutador faria, e espere a minha resposta. Depois de cada resposta, avalie de 1 a 5 em: estrutura STAR, números, relevância para o cargo; diga o que melhorar e faça a próxima pergunta. Use os meus projetos do portfólio para escolher as perguntas.`); return true; }
  if (a === "crcenadd" || a === "crcen0") { const tt = a === "crcen0" ? ds.t : String(F["dc.t"] || "").trim(); if (!tt) return true; C.dec.cen.push({ id: uid(), t: tt, s: {} }); delete F["dc.t"]; touch("carreira", { label: "Cenário" }); return true; }
  if (a === "crcendel") { C.dec.cen = C.dec.cen.filter(x => x.id !== ds.id); touch("carreira", { label: "Cenário apagado" }); undoToast("Cenário apagado"); return true; }
  if (a === "crcritadd") { const n = String(F["dc.c"] || "").trim(); if (!n) return true; C.dec.crit.push({ id: uid(), n, w: 3 }); delete F["dc.c"]; touch("carreira", { label: "Critério" }); return true; }
  if (a === "crcritdel") { C.dec.crit = C.dec.crit.filter(c => c.id !== ds.id); touch("carreira", { label: "Critério apagado" }); undoToast("Critério apagado"); return true; }
  if (a === "crdecai") { const R = crDecCalc(); crAskCar(`Estou decidindo entre caminhos de carreira. Matriz (critério, peso; notas de 1 a 5 por cenário): ${C.dec.crit.map(c => `${c.n} (peso ${c.w}): ${C.dec.cen.map(x => `${x.t} ${x.s?.[c.id] || "–"}`).join(", ")}`).join(" | ")}. Ranking: ${R.rows.map(r => `${r.x.t} ${r.score == null ? "–" : num(r.score, 2)}`).join("; ")}. Questione as minhas notas e os pesos, aponte o que estou subestimando, e diga o que teria que ser verdade para a primeira opção dar errado.`); return true; }
  if (a === "crbadd") { const ral = +F["bm.ral"]; if (!(ral > 0)) { toast("Informe a RAL da referência."); return true; } C.merc.bench.push({ id: uid(), ral, cargo: String(F["bm.cargo"] || "").trim(), cidade: String(F["bm.cidade"] || "").trim(), tipo: F["bm.tipo"] || CR_BTIPO[0], fonte: String(F["bm.fonte"] || "").trim(), data: TODAY }); ["ral", "cargo", "fonte"].forEach(k => delete F["bm." + k]); touch("carreira", { label: "Referência de mercado" }); return true; }
  if (a === "crbdel") { C.merc.bench = C.merc.bench.filter(b => b.id !== ds.id); touch("carreira", { label: "Referência apagada" }); undoToast("Referência apagada"); return true; }
  if (a === "crmadd") { const k = ds.k, v = String(F["m." + k] || "").trim(); if (!v) return true; C.merc[k].push({ id: uid(), t: v, proj: F["m." + k + "p"] || "" }); delete F["m." + k]; delete F["m." + k + "p"]; touch("carreira", { label: "Dossiê" }); return true; }
  if (a === "crmdel") { C.merc[ds.k] = C.merc[ds.k].filter(i => i.id !== ds.id); touch("carreira", { label: "Apagado" }); return true; }
  if (a === "crdoss") { saveFile(`dossie-negociacao-${TODAY}.md`, crDossMd()); return true; }
  if (a === "crnegai") { crAskCar(`Vamos ensaiar a conversa de negociação com a minha empresa. Faça o papel do diretor ou do RH, com objeções realistas (orçamento, momento, enquadramento no CCNL), uma por vez, e espere a minha resposta. Depois de cada resposta, diga o que funcionou e o que eu poderia dizer melhor. Use o meu dossiê: ${crDossMd().slice(0, 3500)}`); return true; }
  return false;
}
function crChange2(t) {
  const ds = t.dataset, C = crExtra();
  if (ds.crdw) { const c = C.dec.crit.find(z => z.id === ds.crdw); if (c) { c.w = clamp(Math.round(+t.value || 0), 0, 5); touch("carreira", { label: "Peso" }); } return true; }
  if (ds.crds) { const [xid, cid] = ds.crds.split("|"), x = C.dec.cen.find(z => z.id === xid); if (x) { x.s ||= {}; if (t.value) x.s[cid] = +t.value; else delete x.s[cid]; touch("carreira", { label: "Nota do cenário" }); } return true; }
  if (ds.crmp) { C.merc.pedido[ds.crmp] = ds.crmp === "ral" ? (+t.value || "") : t.value.trim(); touch("carreira", { label: "Pedido" }); return true; }
  return false;
}
