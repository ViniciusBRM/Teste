
/* ================================================================ ícones (traço 1.7, 24×24) */
const ICONS = {
  film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7.5 5v14M16.5 5v14M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21"/>',
  gamepad: '<path d="M6.5 8h11a4 4 0 0 1 3.9 4.9l-.8 3.3a2.4 2.4 0 0 1-4.1 1.1L14.4 15H9.6l-2.1 2.3a2.4 2.4 0 0 1-4.1-1.1l-.8-3.3A4 4 0 0 1 6.5 8z"/><path d="M8.5 10.5v3M7 12h3"/><circle cx="15.5" cy="11" r=".9"/><circle cx="17.3" cy="13" r=".9"/>',
  plane: '<path d="M10.6 3.6a1.4 1.4 0 0 1 2.8 0V9l7.6 4.6v2.1l-7.6-2.4v4.6l2.4 1.9v1.6L12 20.4l-3.8 1V19.8l2.4-1.9v-4.6L3 15.7v-2.1L10.6 9z"/>',
  coffee: '<path d="M4 9h13v4.5A5.5 5.5 0 0 1 11.5 19h-2A5.5 5.5 0 0 1 4 13.5V9z"/><path d="M17 10.5h1.3a2.7 2.7 0 0 1 0 5.4H16.6"/><path d="M8 3.5c-.7.9-.7 1.9 0 2.8M12 3.5c-.7.9-.7 1.9 0 2.8"/>',
  atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(-60 12 12)"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".55"/>',
  lotus: '<path d="M12 20c-1.9-1.6-3.2-4-3.2-6.9 0-2.6 1.2-5 3.2-7 2 2 3.2 4.4 3.2 7 0 2.9-1.3 5.3-3.2 6.9z"/><path d="M12 20c-3.5 0-6.6-1.4-8.5-4.4 1.6-.6 3.3-.7 4.9-.3M12 20c3.5 0 6.6-1.4 8.5-4.4-1.6-.6-3.3-.7-4.9-.3"/>',
  flame: '<path d="M12 3c2.6 3 4.2 5.4 4.2 8a4.2 4.2 0 0 1-8.4 0c0-1.5.6-2.8 1.6-3.9.2 1.2.8 2 1.6 2.4C11 7.4 11.3 5.1 12 3z"/><path d="M8 21h8M10 17.5h4"/>',
  breath: '<circle cx="12" cy="5" r="2"/><path d="M12 8.5v4.5M7.5 11.5c1.3 1 2.8 1.5 4.5 1.5s3.2-.5 4.5-1.5M4.5 19.5c2-2.3 4.5-3.5 7.5-3.5s5.5 1.2 7.5 3.5"/>',
  yinyang: '<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r=".8"/><circle cx="12" cy="16.5" r=".8"/>',
  dharma: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M12 3.5v6.3M12 14.2v6.3M3.5 12h6.3M14.2 12h6.3M6 6l4.4 4.4M13.6 13.6L18 18M18 6l-4.4 4.4M10.4 13.6L6 18"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  scatter: '<path d="M4 20V4M4 20h16"/><circle cx="9" cy="14" r="1.6"/><circle cx="13" cy="10" r="1.6"/><circle cx="17" cy="7" r="1.6"/><circle cx="15.5" cy="15" r="1.6"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4 3-7 8-7 0 4-3 7-8 7z"/><path d="M12 14c0-3-2.5-5.5-7-5.5 0 3 2.5 5.5 7 5.5z"/>',
  house: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/>',
  plug: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7z"/><path d="M12 17v5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  rows: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  send: '<path d="M4 12l16-8-6 16-3-7-7-1z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  pin: '<path d="M9 4h6l-1 6 3 3H7l3-3-1-6z"/><path d="M12 13v7"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  family: '<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="13" r="2"/><path d="M3 20a4 4 0 0 1 8 0M13 20a4 4 0 0 1 8 0M9.5 20a2.5 2.5 0 0 1 5 0"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-1-.8-1.5-.8-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19c3-4 6-7 10-9"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  checksq: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  memory: '<path d="M6 4h12v16l-6-4-6 4z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4 4 0 0 0 7 0"/><path d="M9 9.5v.5M15 9.5v.5"/>',
  council: '<circle cx="12" cy="6" r="2.5"/><circle cx="5" cy="15" r="2.5"/><circle cx="19" cy="15" r="2.5"/><path d="M12 8.5v3M7 14l3-2M17 14l-3-2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  flask: '<path d="M9 3h6M10 3v6L4.6 18.4A2 2 0 0 0 6.3 21.5h11.4a2 2 0 0 0 1.7-3.1L14 9V3"/><path d="M7.4 14.5h9.2"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6.4-6.4"/><circle cx="12" cy="12" r="1.3"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8"/>',
  shield: '<path d="M12 3l8 3v6c0 4.6-3.4 8-8 9-4.6-1-8-4.4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  noai: '<path d="M3 3l18 18"/><path d="M12 3l1.8 5.2L19 10l-3.3 1.1M10.2 8.2L5 10l5.2 1.8L12 17l1.2-3.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  chapters: '<path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v13.5a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13.5a2 2 0 0 1 2-2h6z"/>',
  duo: '<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5l2 2 4-4"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  wave: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
};
const ic = (k, col, cls = "") => `<span class="ico ${cls}"${col ? ` style="--c:${col}"` : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.grid}</svg></span>`;
const MARK = `<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--a-men)"/></linearGradient></defs><circle cx="16" cy="16" r="13" fill="none" stroke="url(#mk)" stroke-width="2.2"/><ellipse cx="16" cy="16" rx="5.5" ry="13" fill="none" stroke="url(#mk)" stroke-width="1.6"/><path d="M3.5 12h25M3.5 20h25" stroke="url(#mk)" stroke-width="1.4"/><circle cx="21.5" cy="9.5" r="2.4" fill="var(--a-fis)"/></svg>`;

/* ================================================================ navegação */
const NAV = [
  [null, [["visao", "Visão geral", "grid"], ["hoje", "Hoje", "sun"], ["painel", "Painel do dia", "mic"], ["rotina", "Rotina", "cal"], ["diario", "Diário", "pen"], ["jornada", "Jornada existencial", "lotus"], ["mentores", "Mentores", "spark"], ["cruz", "Cruzamentos", "scatter"]]],
  ["Áreas", [["fin", "Finanças", "coins"], ["saude", "Saúde", "pulse"], ["hab", "Hábitos", "repeat"], ["metas", "Metas & tarefas", "target"], ["pessoas", "Relações", "users"], ["cresc", "Crescimento", "sprout"], ["carreira", "Carreira", "brief"], ["idiomas", "Idiomas", "globe"], ["lazer", "Lazer", "palette"], ["casa", "Casa & docs", "house"], ["roda", "Roda da Vida", "wheel"]]],
  ["Laboratório", [["semana", "Fechamento da semana", "week"], ["radar", "Radar", "radar"], ["exp", "Experimentos", "flask"], ["capitulos", "Capítulos", "chapters"], ["dupla", "A dois", "duo"]]],
  ["Sistema", [["mapa", "Mapa do Atlas", "compass"], ["dados", "Dados", "table"], ["integ", "Integrações", "plug"], ["privacidade", "Privacidade", "shield"], ["ajustes", "Ajustes", "sliders"]]],
];
const SUBS = {
  fin: [["rel", "Relatório"], ["lanc", "Lançamentos"], ["orc", "Orçamento & patrimônio"], ["futuro", "Futuro financeiro"], ["vida", "Itália & Brasil"], ["projetos", "Projetos & aquisições"], ["diario", "Diário"]],
  saude: [["rel", "Relatório"], ["checkin", "Check-in"], ["diario", "Diário"]],
  hab: [["rel", "Relatório"], ["marcar", "Marcar hábitos"], ["diario", "Diário"]],
  metas: [["rel", "Relatório"], ["lista", "Metas"], ["tarefas", "Tarefas"], ["diario", "Diário"]],
  pessoas: [["rel", "Relatório"], ["lista", "Pessoas"], ["contatos", "Contatos"], ["diario", "Diário"]],
  cresc: [["rel", "Relatório"], ["aprend", "Aprendizado"], ["lazer", "Lazer & sonhos"], ["diario", "Diário"]],
  casa: [["painel", "Painel"], ["limpeza", "Limpeza"], ["compras", "Compras"], ["contas", "Contas"], ["docs", "Documentos"], ["diario", "Diário"]],
  roda: [["roda", "Roda & revisão"], ["diario", "Diário"]],
  diario: [["feed", "Entradas"], ["perguntar", "Perguntar"], ["cal", "Calendário"], ["analise", "Análise"]],
  capitulos: [["linha", "Linha do tempo"], ["livro", "Livro do ano"]],
  lazer: [["inicio", "Início"], ["leitura", "Leitura"], ["filmes", "Filmes e séries"], ["jogos", "Jogos"], ["viagens", "Viagens"], ["cafe", "Café"], ["aviacao", "Aviação"], ["estudos", "Estudos"], ["existencial", "Existencial"]],
  carreira: [["panorama", "Panorama"], ["avaliacao", "Avaliação atual"], ["portfolio", "Portfólio"], ["objetivos", "Objetivos"], ["decisoes", "Decisões"], ["geotecnia", "Geotecnia"], ["plano", "Plano de ação"], ["mercado", "Mercado"], ["caderno", "Caderno técnico"], ["rede", "Rede profissional"], ["biblioteca", "Biblioteca"]],
  /* o terceiro elemento marca uma seção interna: não vira aba, e acende a aba-mãe */
  jornada: [["inicio", "Início"], ["jardim", "Saúde espiritual"], ["espiritismo", "Espiritismo"], ["meditacao", "Meditação"], ["taoismo", "Taoísmo"], ["budismo", "Budismo"], ["confluencias", "Confluências"], ["praticas", "Práticas"], ["bussola", "Bússola moral"], ["exame", "Exame da noite", "bussola"], ["decidir", "Decidir", "bussola"], ["caminhos", "Caminhos", "bussola"], ["navegante", "O Navegante", "bussola"]],
  rotina: [["dia", "Dia"], ["semana", "Semana"], ["mes", "Mês"]],
  dupla: [["diario", "Diário a dois"], ["orcamento", "Orçamento comum"], ["metas", "Metas a dois"]],
};
const REPORT_TABS = [["visao", "Visão geral"], ["fin.rel", "Finanças"], ["saude.rel", "Saúde"], ["hab.rel", "Hábitos"], ["pessoas.rel", "Relações"], ["cresc.rel", "Crescimento"], ["metas.rel", "Metas"], ["cruz", "Cruzamentos"]];
const PAGE_AREAS = { fin: ["Finanças"], saude: ["Saúde física", "Saúde mental"], hab: ["Saúde física", "Saúde mental"], metas: ["Carreira", "Casa & organização"], pessoas: ["Família", "Amor & parceria", "Amizades & social"], cresc: ["Carreira", "Aprendizado", "Lazer & criatividade"], casa: ["Casa & organização"] };
let PAGE = "visao", SUB = null, NAVOPEN = false;
const pageTitle = (p = PAGE) => p === "mentor" ? "Mentor" : NAV.flatMap(g => g[1]).find(x => x[0] === p)?.[1] || "Atlas";
const isReport = () => PAGE === "visao" || PAGE === "cruz" || (SUBS[PAGE] && (SUB || SUBS[PAGE][0][0]) === "rel");
function setHash(p, s) { const h = s ? `${p}.${s}` : p; if (location.hash.slice(1) !== h) location.hash = h; else route(); }
function route() {
  let [p, s] = (location.hash.slice(1) || "visao").split(".");
  /* a Bússola moral e os mentores da jornada moram na Jornada existencial; links antigos continuam valendo */
  if (p === "cresc" && s === "carreira") { p = "carreira"; s = "panorama"; }
  if (p === "bussola") { p = "jornada"; s = !s || s === "mapa" ? "bussola" : s; }
  if (p === "mentor" && MENTOR_DEF[s]?.jor) { p = "jornada"; s = jSubOfMid(s); }
  if (p === "mentor" && MENTOR_DEF[s]?.lz) { p = "lazer"; s = MENTOR_DEF[s].lz; }
  if (`${p}${s ? "." + s : ""}` !== location.hash.slice(1) && location.hash) try { history.replaceState(null, "", `#${p}${s ? "." + s : ""}`); } catch {}
  const ok = p === "mentor" || NAV.some(g => g[1].some(x => x[0] === p));
  PAGE = ok ? p : "visao"; SUB = ok ? s || null : null;
  if (SUBS[PAGE] && !SUBS[PAGE].some(x => x[0] === SUB)) SUB = SUBS[PAGE][0][0];
  if (PAGE === "mentor" && !(SUB in MENTOR_DEF)) SUB = "conselho";
  NAVOPEN = false; DRAWER = null; if (PAGE !== "painel" && VOZ.sr) stopVoice(); if (PAGE !== "hoje") HJ.skip.clear();
  /* o registro do radar é atualizado antes de desenhar, para os alertas novos já virem com “útil / alarme falso” */
  if (LOADED && (PAGE === "radar" || PAGE === "hoje")) try { radarSync(); } catch {}
  render(); $("#main")?.focus({ preventScroll: true }); window.scrollTo({ top: 0 });
}
function navHTML(R) {
  const pend = Object.values(S.mentores || {}).reduce((n, m) => n + (m.conversa || []).reduce((k, msg) => k + (msg.acoes || []).filter(a => a.status === "pendente").length, 0), 0);
  const badge = { metas: R.tarAtras + R.metasAtras, casa: R.casaAlertas, mentores: pend, pessoas: R.relAtras, radar: LOADED ? radarAlerts().filter(a => a.st === "crit" && (a.tipo === "orcamento" || a.tipo === "humor")).length : 0, semana: LOADED && parse(TODAY).getDay() <= 2 && S.fechamentos?.[fsTarget()]?.status !== "fechado" ? 1 : 0 };
  return `<div class="brand"><span class="mark">${MARK}</span><div><b>Atlas da Vida <i class="v2">2</i></b><small>${esc(S.cfg.nome || "seu sistema pessoal")}</small></div><button type="button" class="iconbtn navx" data-act="menu" aria-label="Fechar menu">${ic("x")}</button></div>
  <button type="button" class="navsearch" data-act="pal">${ic("search")}<span>Buscar ou executar…</span><kbd>Ctrl K</kbd></button>
  ${NAV.map(([g, items]) => (g ? `<div class="navg">${g}</div>` : "") + items.map(([k, l, i]) => { const on = PAGE === k || (k === "mentores" && PAGE === "mentor");
    return `<a href="#${k}" class="nv${on ? " on" : ""}"${on ? ' aria-current="page"' : ""}>${ic(i)}<span>${l}</span>${badge[k] ? `<em class="nb${k === "mentores" ? " acc" : ""}">${badge[k]}</em>` : ""}</a>`; }).join("")).join("")}
  <div class="navfoot"><span id="savest" class="savest"></span><span class="kbdh">Ctrl Z desfaz · Ctrl K busca</span></div>`;
}
function topbar(R, title, sub) {
  const crumb = PAGE === "mentor" ? `<a href="#mentores">Mentores</a> / ${esc(MENTOR_DEF[SUB]?.nome || "")}` : SUBS[PAGE] ? `${esc(pageTitle())} / ${esc(SUBS[PAGE].find(x => x[0] === SUB)?.[1] || "")}` : "Atlas da Vida";
  return `<header class="top"><button type="button" class="iconbtn menu" data-act="menu" aria-label="Abrir menu">${ic("menu")}</button>
    <div class="ttl"><div class="crumb">${crumb}</div><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ""}</div>
    <div class="tools"><button type="button" class="exbtn${EX_MODE ? " on" : ""}" data-act="extog" aria-pressed="${EX_MODE}" title="Liga e desliga dados fictícios em todas as abas; nada é salvo enquanto estiver ligado">${ic("eye")}<span>Exemplo</span><i class="exsw" aria-hidden="true"></i></button><button type="button" class="capbtn" data-act="cap" title="Capturar: escreva ou dite o que aconteceu" aria-label="Capturar">${ic("bolt")}<span>Capturar</span></button><button type="button" class="srch" data-act="pal" aria-label="Buscar">${ic("search")}<span>Buscar</span></button>
      <div class="monthpick" aria-label="Mês de referência"><button type="button" data-act="mprev" aria-label="Mês anterior">‹</button><span>${mlabel(REF)}</span><button type="button" data-act="mnext" aria-label="Próximo mês">›</button>${REF !== mkey(TODAY) ? `<button type="button" class="mnow" data-act="mnow">Hoje</button>` : ""}</div>
      <button type="button" class="iconbtn" data-act="undo" title="Desfazer (Ctrl+Z)" aria-label="Desfazer"${UNDO.length ? "" : " disabled"}>${ic("undo")}</button><button type="button" class="iconbtn" data-act="redo" title="Refazer (Ctrl+Shift+Z)" aria-label="Refazer"${REDO.length ? "" : " disabled"}>${ic("redo")}</button></div></header>`;
}
const subtabs = () => { if (!SUBS[PAGE] || PAGE === "rotina") return ""; const cur = SUBS[PAGE].find(x => x[0] === SUB), on = k => SUB === k || cur?.[2] === k;
  return `<nav class="subtabs" aria-label="Seções">${SUBS[PAGE].filter(x => !x[2] && !(PAGE === "carreira" && x[0] === "geotecnia" && !crGeoOn() && SUB !== "geotecnia")).map(([k, l]) => `<a href="#${PAGE}.${k}" class="st${on(k) ? " on" : ""}"${on(k) ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>`; };
const reportTabs = () => `<nav class="rtabs" aria-label="Páginas do relatório">${REPORT_TABS.map(([k, l]) => { const [p, s] = k.split("."); const on = PAGE === p && (!s || SUB === s); return `<a href="#${k}" class="rt${on ? " on" : ""}"${on ? ' aria-current="page"' : ""}>${l}</a>`; }).join("")}</nav>`;

/* ================================================================ filtros cruzados (estilo Power BI) */
const XFP = {};
const xf = () => (XFP[PAGE + "." + (SUB || "")] ||= {});
const XF_NAMES = { area: "Área", cat: "Categoria", grp: "Grupo", pessoa: "Pessoa", tag: "Tema", dow: "Dia da semana", hab: "Hábito", rel: "Relação", tipo: "Tipo", proj: "Projeto", item: "Item", etapa: "Etapa" };
function xfBar() {
  const f = xf(), ks = Object.keys(f).filter(k => f[k] != null);
  return ks.length ? `<div class="xfbar"><span class="xfl">Filtros do relatório</span>${ks.map(k => `<button type="button" class="xfc" data-xfclear="${k}">${XF_NAMES[k] || k}: <b>${esc(k === "dow" ? DOWL[f[k]] : k === "hab" ? (S.habitos.find(h => h.id === f[k])?.nome || f[k]) : f[k])}</b>${ic("x")}</button>`).join("")}<button type="button" class="lnk" data-xfclear="*">Limpar tudo</button></div>` : "";
}
function slicers(o = {}) {
  return `<div class="slicers"><div class="seg-g" role="group" aria-label="Janela"><span class="flbl">Janela</span>${[3, 6, 12, 24].map(n => `<button type="button" class="seg" data-per="${n}" aria-pressed="${PER === n}">${n}m</button>`).join("")}</div>
    <div class="seg-g"><span class="flbl">Comparar</span><select id="cmpSel" aria-label="Base de comparação">${Object.entries(CMP_TXT).map(([k, l]) => `<option value="${k}"${CMP === k ? " selected" : ""}>${l}</option>`).join("")}</select></div>
    ${o.area !== false ? `<div class="seg-g"><span class="flbl">Área</span><select id="areaSel" aria-label="Filtrar por área"><option value="">Todas</option>${AREAS.map(a => `<option value="${esc(a)}"${xf().area === a ? " selected" : ""}>${esc(ashort(a))}</option>`).join("")}</select></div>` : ""}${o.extra || ""}</div>`;
}

/* ================================================================ visual (cartão de relatório) com foco, tabela e CSV */
let VIS = {}; const TABLEV = new Set();
function vis(id, title, body, o = {}) {
  VIS[id] = { title, body, o };
  const tv = TABLEV.has(id) && o.table;
  return `<section class="vis ${o.cls || ""}" data-vid="${id}"${o.style ? ` style="${o.style}"` : ""}><header><div class="vt"><h2>${o.ico ? ic(o.ico, o.col) : ""}${title}</h2>${o.sub ? `<span class="vs">${o.sub}</span>` : ""}</div><div class="va">${o.act || ""}${o.table ? `<button type="button" class="vb${tv ? " on" : ""}" data-vtab="${id}" title="${tv ? "Mostrar gráfico" : "Mostrar como tabela"}" aria-label="${tv ? "Mostrar gráfico" : "Mostrar como tabela"}" aria-pressed="${!!tv}">${ic("rows")}</button><button type="button" class="vb" data-vcsv="${id}" title="Exportar dados (CSV)" aria-label="Exportar dados em CSV">${ic("download")}</button>` : ""}${o.nofocus ? "" : `<button type="button" class="vb" data-vfocus="${id}" title="Modo foco" aria-label="Abrir em modo foco">${ic("expand")}</button>`}${o.info ? `<span class="vb" tabindex="0" ${tip(o.info)} aria-label="${esc(o.info)}">${ic("info")}</span>` : ""}</div></header><div class="vbody">${tv ? tableFrom(o.table()) : body}</div></section>`;
}
function tableFrom({ cols, rows }) {
  if (!rows.length) return emptyChart();
  return `<div class="hscroll"><table class="dt"><thead><tr>${cols.map(c => `<th class="${c.num ? "num" : ""}">${esc(c.l)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${cols[i].num ? "num" : ""}">${esc(cols[i].f ? cols[i].f(v) : v ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function exportVis(id) { const v = VIS[id]; if (!v?.o.table) return; const { cols, rows } = v.o.table(); saveFile(`${slug(v.title) || "dados"}.csv`, "﻿" + csvBuild(cols.map(c => c.l), rows.map(r => r.map(x => typeof x === "number" ? Math.round(x * 100) / 100 : x ?? "")))); }
function openFocus(id) {
  const v = VIS[id]; if (!v) return; const d = $("#focusdlg");
  d.innerHTML = `<div class="fdh"><h3>${v.title}</h3><div class="va">${v.o.table ? `<button type="button" class="vb" data-vcsv="${id}" aria-label="Exportar CSV">${ic("download")}</button>` : ""}<button type="button" class="vb" data-act="closefocus" aria-label="Fechar">${ic("x")}</button></div></div><div class="fdb">${TABLEV.has(id) && v.o.table ? tableFrom(v.o.table()) : v.body}${v.o.table && !TABLEV.has(id) ? `<details class="fdt"><summary>Dados do visual</summary>${tableFrom(v.o.table())}</details>` : ""}</div>`;
  if (!d.open) d.showModal();
}
function kcard({ ico, color, l, v, sub, dl, sp, go, tgt, hero }) {
  return `<div class="kc${go ? " click" : ""}${hero ? " hero" : ""}" style="--c:${color}"${go ? ` data-go="${go}" role="link" tabindex="0"` : ""}><div class="kh">${ic(ico)}<span class="kl">${l}</span></div><div class="kv">${v}</div><div class="kf">${dl || ""}${tgt ? `<span class="kt">${tgt}</span>` : ""}${sub ? `<span class="ks">${sub}</span>` : ""}</div>${sp ? `<div class="ksp">${sp}</div>` : ""}</div>`;
}
function delta(cur, prev, { up = true, fmt = v => num(v), unit = "", txt = true } = {}) {
  if (!isNum(cur) || !isNum(prev)) return `<span class="dl none">sem base</span>`;
  const d = cur - prev; if (Math.abs(d) < 1e-9) return `<span class="dl none">= ${txt ? CMP_TXT[CMP].replace("vs ", "") : ""}</span>`;
  const good = up ? d > 0 : d < 0;
  return `<span class="dl ${good ? "good" : "crit"}" title="${esc(CMP_TXT[CMP])}">${d > 0 ? "▲" : "▼"} ${esc(fmt(Math.abs(d)))}${unit}${txt ? ` <em>${esc(CMP_TXT[CMP])}</em>` : ""}</span>`;
}
const chip = (txt, cls = "") => `<span class="chip ${cls}">${esc(txt)}</span>`;
const areaDot = a => `<i class="adot" style="background:${acol(a)}"></i>`;
const areaTag = a => a ? `<span class="atag" style="--c:${acol(a)}">${esc(ashort(a))}</span>` : "";

/* ================================================================ formulários */
const SCH = {
  lanc: { t: "Lançamento", f: [["data", "Data", "date"], ["tipo", "Tipo", ["Receita", "Despesa", "Aporte"]], ["cat", "Categoria", o => o.tipo === "Receita" ? CAT_REC : o.tipo === "Aporte" ? CAT_APO : Object.keys(CAT_DESP)], ["desc", "Descrição", "text"], ["valor", "Valor", "num"], ["conta", "Conta / forma", () => CONTAS]], def: () => ({ data: TODAY, tipo: "Despesa" }) },
  metas: { t: "Meta", f: [["meta", "Meta (específica e mensurável)", "text", 1], ["area", "Área da vida", () => AREAS], ["status", "Status", ["Ativa", "Pausada", "Concluída", "Abandonada"]], ["inicio", "Início", "date"], ["prazo", "Prazo", "date"], ["un", "Unidade", "text"], ["ini", "Valor inicial", "num"], ["atual", "Valor atual", "num"], ["alvo", "Valor alvo", "num"], ["manual", "Progresso manual (0–1, para marcos)", "num"], ["proximo", "Próximo passo concreto", "text", 1]], def: () => ({ status: "Ativa", inicio: TODAY }) },
  tarefas: { t: "Tarefa", f: [["tarefa", "Tarefa", "text", 1], ["projeto", "Projeto", "text"], ["area", "Área", () => AREAS], ["prio", "Prioridade", ["Alta", "Média", "Baixa"]], ["prazo", "Prazo", "date"], ["status", "Status", ["A fazer", "Em andamento", "Aguardando", "Concluída", "Cancelada"]], ["concluida", "Concluída em", "date"], ["meta", "Meta vinculada", () => ["", ...S.metas.map(m => m.meta)]], ["notas", "Notas", "text", 1]], def: () => ({ status: "A fazer", prio: "Média" }) },
  pessoas: { t: "Pessoa", f: [["nome", "Nome", "text"], ["relacao", "Relação", () => RELACAO], ["empresa", "Empresa (se for do trabalho)", "text"], ["cargo", "Cargo / área", "text"], ["freq", "Falar a cada (dias)", "num"], ["aniv", "Aniversário", "date"], ["notas", "Notas · interesses, presentes", "text", 1]], def: () => ({ relacao: "Amizade", freq: 30 }) },
  contatos: { t: "Contato", f: [["data", "Data", "date"], ["pessoa", "Pessoa", () => S.pessoas.map(p => p.nome)], ["tipo", "Tipo", ["Encontro", "Ligação", "Videochamada", "Mensagem", "Evento / grupo"]], ["qual", "Qualidade (1–5)", "num"], ["min", "Duração (min)", "num"]], def: () => ({ data: TODAY, qual: 4, tipo: "Encontro" }) },
  aprend: { t: "Item de aprendizado", f: [["titulo", "Título", "text", 1], ["tipo", "Tipo", () => APR_TIPOS], ["area", "Área", () => AREAS], ["status", "Status", ["Quero fazer", "Em andamento", "Pausado", "Concluído", "Abandonado"]], ["total", "Total (pág./aulas)", "num"], ["atual", "Onde estou", "num"], ["fim", "Concluído em", "date"], ["nota", "Nota (1–5)", "num"]], def: () => ({ status: "Em andamento", tipo: "Livro", area: "Aprendizado" }) },
  estudo: { t: "Sessão de estudo", f: [["data", "Data", "date"], ["item", "Item / assunto", () => S.aprend.map(a => a.titulo)], ["horas", "Horas", "num"]], def: () => ({ data: TODAY, horas: 1 }) },
  lazer: { t: "Atividade de lazer", f: [["data", "Data", "date"], ["atividade", "Atividade", "text"], ["cat", "Categoria", () => LAZER_CAT], ["horas", "Duração (h)", "num"], ["custo", "Custo", "num"], ["sat", "Satisfação (1–5)", "num"]], def: () => ({ data: TODAY, sat: 4 }) },
  sonhos: { t: "Sonho / experiência", f: [["sonho", "Sonho", "text", 1], ["status", "Status", ["Sonho", "Planejando", "Agendado", "Realizado"]], ["custo", "Custo estimado", "num"]], def: () => ({ status: "Sonho" }) },
  docs: { t: "Documento", f: [["doc", "Documento", "text"], ["tipo", "Tipo", ["Contrato", "Conta anual", "Imposto", "Seguro", "Identidade", "Garantia", "Outro"]], ["ano", "Ano de referência", "num"], ["validade", "Validade / renovação", "date"], ["valor", "Valor (se houver)", "num"], ["onde", "Onde está guardado", "text"], ["acao", "Próxima ação", "text", 1]], def: () => ({ tipo: "Contrato", ano: +TODAY.slice(0, 4) }) },
  rotinas: { t: "Rotina da casa", f: [["rotina", "Rotina", "text"], ["nivel", "Nível", ["Leve", "Média", "Pesada", "Sazonal"]], ["comodo", "Cômodo", ["Casa toda", "Cozinha", "Banheiro", "Quarto", "Sala", "Área externa", "Eletrodomésticos"]], ["freq", "A cada (dias)", "num"], ["min", "Duração (min)", "num"], ["ultima", "Última vez", "date"]], def: () => ({ ultima: TODAY, freq: 7, nivel: "Média", comodo: "Casa toda", min: 20 }) },
  contasCasa: { t: "Conta da casa", f: [["conta", "Conta", "text"], ["cat", "Categoria", ["Aluguel / financiamento", "Condomínio", "Luz", "Gás", "Água", "Internet / telefone", "TARI (lixo)", "Seguro da casa", "Manutenção", "Outra"]], ["valor", "Valor previsto", "num"], ["periodo", "Periodicidade", ["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"]], ["venc", "Próximo vencimento", "date"], ["debito", "Débito automático", ["Não", "Sim"]]], def: () => ({ periodo: "Mensal", venc: TODAY, debito: "Não", cat: "Outra" }) },
  compras: { t: "Item de compra", f: [["item", "Item", "text"], ["cat", "Seção", ["Hortifrúti", "Mercearia", "Laticínios", "Carnes & peixes", "Padaria", "Congelados", "Limpeza", "Higiene", "Outros"]], ["qtd", "Quantidade", "text"], ["fixo", "Toda semana", ["Não", "Sim"]]], def: () => ({ cat: "Mercearia", fixo: "Não" }) },
  cadTec: { t: "Nota técnica", f: [["titulo", "Título", "text", 1], ["area", "Área", ["Estradas & geometria", "Drenagem", "Pavimentação", "Geotecnia", "Estruturas & obras de arte", "BIM & processos", "Normas & contratos", "Software", "Obra & segurança"]], ["tipo", "Tipo", ["Conceito", "Fórmula", "Procedimento", "Checklist", "Lição aprendida", "Referência normativa"]], ["ref", "Fonte / norma", "text"], ["texto", "Conteúdo", "textarea", 1], ["tags", "Etiquetas (vírgula)", "text"], ["revisar", "Revisar em", "date"]], def: () => ({ area: "Estradas & geometria", tipo: "Conceito" }) },
  oport: { t: "Oportunidade", f: [["titulo", "Oportunidade", "text", 1], ["empresa", "Empresa / entidade", "text"], ["tipo", "Tipo", ["Vaga", "Projeto", "Indicação", "Evento", "Parceria", "Curso / bolsa"]], ["estagio", "Estágio", ["Ideia", "Contato feito", "Conversa", "Proposta", "Ganha", "Perdida"]], ["contato", "Pessoa de contato", () => S.pessoas.map(p => p.nome)], ["prazo", "Próximo passo até", "date"], ["passo", "Próximo passo", "text", 1]], def: () => ({ tipo: "Vaga", estagio: "Ideia" }) },
  vidaItens: { t: "Conta ou gasto (Itália / Brasil)", f: [["t", "Descrição", "text", 1], ["pais", "País", ["Brasil", "Itália"]], ["cat", "Categoria", ["Moradia", "Família", "Financiamento / dívida", "Impostos & taxas", "Conta bancária", "Seguro / saúde", "Educação", "Remessa", "Outro"]], ["valor", "Valor (moeda do país)", "num"], ["periodo", "Periodicidade", ["Mensal", "Bimestral", "Trimestral", "Anual", "Única"]], ["venc", "Próximo vencimento", "date"]], def: () => ({ pais: "Brasil", periodo: "Mensal", cat: "Família" }) },
  assin: { t: "Assinatura", f: [["servico", "Serviço", "text"], ["valor", "Valor", "num"], ["periodo", "Periodicidade", ["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"]], ["uso", "Uso real", ["Alto", "Médio", "Baixo"]]], def: () => ({ periodo: "Mensal", uso: "Médio" }) },
  comp: { t: "Competência", f: [["nome", "Competência", "text"], ["atual", "Nível atual (1–5)", "num"], ["alvo", "Nível alvo (1–5)", "num"]], def: () => ({ atual: 2, alvo: 4 }) },
  cand: { t: "Candidatura", f: [["empresa", "Empresa", "text"], ["cargo", "Cargo", "text"], ["data", "Data", "date"], ["etapa", "Etapa", ["Interesse", "Aplicado", "Entrevista", "Teste / case", "Proposta", "Aceito", "Recusado", "Desisti"]], ["acao", "Próxima ação", "text"], ["dataAcao", "Data da ação", "date"]], def: () => ({ data: TODAY, etapa: "Aplicado" }) },
  habitos: { t: "Hábito", f: [["nome", "Hábito", "text"], ["area", "Área da vida", () => AREAS], ["meta", "Meta (dias por semana)", "num"]], def: () => ({ meta: 5 }) },
  eventos: { t: "Compromisso", f: [["data", "Data", "date"], ["hora", "Início (hh:mm)", "text"], ["fim", "Fim (hh:mm)", "text"], ["titulo", "Compromisso", "text", 1], ["local", "Local", "text"]], def: () => ({ data: TODAY }) },
  regras: { t: "Regra de categorização", f: [["termo", "Se a descrição contém", "text"], ["tipo", "Tipo", ["Despesa", "Receita", "Aporte"]], ["cat", "Categoria", o => o.tipo === "Receita" ? CAT_REC : o.tipo === "Aporte" ? CAT_APO : Object.keys(CAT_DESP)]], def: () => ({ tipo: "Despesa" }) },
};
const optsOf = (ty, o) => typeof ty === "function" ? ty(o) : Array.isArray(ty) ? ty : null;
function fieldHTML([k, lb, ty, full], o, pre = "f_") {
  const v = o[k] ?? "", opts = optsOf(ty, o);
  const inp = opts ? `<select id="${pre}${k}" name="${k}">${["", ...opts.filter(x => x !== "")].map(x => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("")}${v && !opts.includes(v) ? `<option selected>${esc(v)}</option>` : ""}</select>`
    : ty === "textarea" ? `<textarea id="${pre}${k}" name="${k}" rows="6">${esc(v)}</textarea>`
    : `<input id="${pre}${k}" name="${k}" type="${ty === "num" ? "number" : ty}"${ty === "num" ? ' step="any"' : ""} value="${esc(v)}">`;
  return `<label class="${full ? "full" : ""}">${esc(lb)}${inp}</label>`;
}
function openForm(key, id, preset) {
  const sc = SCH[key], cur = id ? S[key].find(x => x.id === id) : { ...sc.def(), ...(preset || {}) };
  if (!cur) return;
  const dlg = $("#dlg"), o = { ...cur };
  dlg.innerHTML = `<form method="dialog" id="fm"><h3>${id ? "Editar" : "Adicionar"} · ${esc(sc.t)}</h3><div class="form">${sc.f.map(f => fieldHTML(f, o)).join("")}</div>
    <div class="dlgfoot"><div>${id ? `<button type="button" class="btn danger" id="del">Excluir</button>` : ""}${id && ["pessoas", "metas", "tarefas", "aprend"].includes(key) ? `<button type="button" class="btn ghost" id="openEnt">Ver ficha</button>` : ""}</div><div class="row"><button type="button" class="btn" id="cancel">Cancelar</button><button class="btn primary" value="ok">Salvar</button></div></div></form>`;
  const fm = $("#fm", dlg);
  const tipo = $("#f_tipo", dlg); if (tipo && (key === "lanc" || key === "regras")) tipo.addEventListener("change", () => { o.tipo = tipo.value; $("#f_cat", dlg).innerHTML = ["", ...sc.f.find(f => f[0] === "cat")[2](o)].map(x => `<option>${esc(x)}</option>`).join(""); });
  $("#cancel", dlg).onclick = () => dlg.close();
  const oe = $("#openEnt", dlg); if (oe) oe.onclick = () => { dlg.close(); openEnt({ pessoas: "p", metas: "meta", tarefas: "tar", aprend: "apr" }[key], key === "pessoas" ? cur.nome : id); };
  const del = $("#del", dlg); if (del) del.onclick = () => { if (del.dataset.c) { S[key] = S[key].filter(x => x.id !== id); dlg.close(); touch(key, { label: `${sc.t} excluído(a)` }); undoToast(`${sc.t} excluído(a)`); } else { del.dataset.c = 1; del.textContent = "Confirmar exclusão"; } };
  fm.onsubmit = e => { e.preventDefault(); const fd = new FormData(fm); const rec = { ...(cur || {}), id: id || uid(), upd: Date.now() };
    sc.f.forEach(([k, , ty]) => { const v = fd.get(k); rec[k] = ty === "num" ? (v === "" || v == null ? "" : +v) : (v ?? ""); });
    if (key === "tarefas" && rec.status === "Concluída" && !rec.concluida) rec.concluida = TODAY;
    if (key === "pessoas" && id && cur.nome && rec.nome !== cur.nome) renamePerson(cur.nome, rec.nome);
    if (key === "metas" && id && cur.meta && rec.meta !== cur.meta) S.tarefas.forEach(t => { if (t.meta === cur.meta) t.meta = rec.meta; });
    if (key === "lanc" && id && rec.cat && rec.cat !== cur.cat && rec.desc) setTimeout(() => offerRule(rec.desc, rec.tipo || "Despesa", rec.cat), 400);
    if (id) S[key] = S[key].map(x => x.id === id ? rec : x); else S[key].push(rec);
    dlg.close(); touch(key, "tarefas", "contatos", "diario", { label: `${sc.t} ${id ? "editado(a)" : "criado(a)"}` }); if (!id) undoToast(`${sc.t} adicionado(a)`); };
  dlg.showModal(); setTimeout(() => $("input,select", dlg)?.focus(), 30);
}
/* renomear uma pessoa atualiza contatos e menções no diário */
function renamePerson(old, nu) {
  S.contatos.forEach(c => { if (c.pessoa === old) c.pessoa = nu; });
  const tok = /\s|[()]/.test(nu) ? `@[${nu}]` : `@${nu}`;
  S.diario.forEach(e => { e.texto = e.texto.split(`@[${old}]`).join(tok); if (!/\s/.test(old)) e.texto = e.texto.replace(new RegExp(`(^|[\\s(,;])@${old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_])`, "gu"), `$1${tok}`); });
}
function table(key, rows, cols, { limit = 0, empty = "Nada cadastrado ainda." } = {}) {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  const shown = limit ? rows.slice(0, limit) : rows;
  return `<div class="hscroll"><table class="dt"><thead><tr>${cols.map(c => `<th class="${c[2] || ""}">${c[0]}</th>`).join("")}</tr></thead><tbody>${shown.map(r => `<tr class="click" data-edit="${key}" data-id="${r.id}" tabindex="0">${cols.map(c => `<td class="${c[2] || ""}">${c[1](r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${limit && rows.length > limit ? `<div class="more">Mostrando ${limit} de ${rows.length} · <a href="#dados.${key}">ver todos em Dados</a></div>` : ""}`;
}
const addBtn = (key, lbl) => `<button type="button" class="btn sm" data-add="${key}">${ic("plus")}${lbl}</button>`;
const panel = (title, body, o = {}) => `<section class="pn ${o.cls || ""}"${o.style ? ` style="${o.style}"` : ""}>${title ? `<header><h2>${title}</h2>${o.act || ""}</header>` : ""}${body}</section>`;
function kpiRow(items) { return `<div class="krow">${items.join("")}</div>`; }
function kmini(color, l, v, s, st = "") { return `<div class="km" style="--c:${color}"><div class="kml">${l}</div><div class="kmv">${v}</div><div class="kms ${st ? "st-" + st : ""}">${s || ""}</div></div>`; }

/* ================================================================ texto do mentor (markdown enxuto) */
function mdInline(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\*)/g, "$1<i>$2</i>").replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
function md(src) {
  const lines = String(src || "").replace(/\r/g, "").split("\n"); let h = "", list = null;
  const close = () => { if (list) { h += `</${list}>`; list = null; } };
  for (const ln of lines) {
    let m;
    if ((m = ln.match(/^\s*#{1,4}\s+(.*)/))) { close(); h += `<h4>${mdInline(m[1])}</h4>`; }
    else if ((m = ln.match(/^\s*[-*•]\s+\[( |x|X)\]\s+(.*)/))) { if (list !== "ul") { close(); h += "<ul>"; list = "ul"; } h += `<li class="ckli${m[1].trim() ? " done" : ""}">${mdInline(m[2])}</li>`; }
    else if ((m = ln.match(/^\s*[-*•]\s+(.*)/))) { if (list !== "ul") { close(); h += "<ul>"; list = "ul"; } h += `<li>${mdInline(m[1])}</li>`; }
    else if ((m = ln.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); h += "<ol>"; list = "ol"; } h += `<li>${mdInline(m[1])}</li>`; }
    else if ((m = ln.match(/^\s*>\s?(.*)/))) { close(); h += `<blockquote>${mdInline(m[1])}</blockquote>`; }
    else if (!ln.trim()) close();
    else { close(); h += `<p>${mdInline(ln)}</p>`; }
  }
  close(); return h;
}

/* ================================================================ arquivos e área de transferência */
let DL = null;
async function saveFile(filename, data) {
  if (!DL) { toast("Baixar arquivos não está disponível nesta visualização."); return false; }
  try { const r = await DL.save({ filename, data }); if (r?.status !== "delivered") toast("Arquivo salvo: " + filename); return true; }
  catch (e) { const c = e?.code; toast(c === "declined" ? "Download cancelado." : c === "rate_limited" ? "Já existe um download esperando sua confirmação." : c === "rejected_extension" || c === "extension_not_enabled" ? "Este formato não está liberado aqui." : c === "too_large" ? "Arquivo grande demais para este destino." : "Não foi possível baixar agora."); return false; }
}
async function copyText(t, el) {
  try { await navigator.clipboard.writeText(t); toast("Copiado"); }
  catch { if (el) { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Texto selecionado: use Ctrl+C para copiar"); } else toast("Não foi possível copiar aqui."); }
}
function readFile(input) { return new Promise((res, rej) => { const f = input.files?.[0]; if (!f) return rej(new Error("Nenhum arquivo")); const r = new FileReader(); r.onload = () => res({ name: f.name, text: String(r.result) }); r.onerror = () => rej(r.error); r.readAsText(f); }); }

/* ================================================================ paleta de comandos (Ctrl K) */
let PALSEL = 0, PALITEMS = [];
function fuzzy(text, q) {
  const t = norm(text), qq = norm(q); if (!qq) return 1; const i = t.indexOf(qq);
  if (i >= 0) return 100 - i - (t.length - qq.length) * .05;
  let j = 0, sc = 0; for (const ch of t) { if (ch === qq[j]) { j++; sc++; } if (j === qq.length) break; } return j === qq.length ? 20 + sc - t.length * .05 : -1;
}
function palItems(q) {
  const out = [], R = calcAt(REF), add = (g, l, s, ico, run, kw = "") => { const sc = fuzzy(l + " " + kw, q); if (sc >= 0) out.push({ g, l, s, ico, run, sc }); };
  if (q.trim().startsWith("/")) { const r = previewCommand(q.trim()); out.push({ g: "Executar", l: r.ok ? r.txt : r.err || "Comando incompleto", s: r.ok ? "Enter registra agora" : "Ex.: /gasto 12,50 Café · /tarefa Ligar para o banco até 15/10 · /humor 4", ico: "bolt", run: r.ok ? () => runQuickCommand(q.trim()) : null, sc: 999 }); return out; }
  add("Ações", "Capturar", "Escreva ou dite: gastos, sono, treino, contatos, tarefas", "bolt", () => openCapture(), "capturar ditar voz rapido registrar");
  add("Ações", EX_MODE ? "Desligar o modo exemplo" : "Ligar o modo exemplo", "Dados fictícios em todas as abas, sem tocar nos seus", "eye", () => exToggle(), "exemplo demonstracao demo ficticio tutorial");
  add("Ações", "Painel do dia", "Humor, sono, treino, gastos e hábitos em um minuto, por texto ou voz", "mic", () => setHash("painel"), "painel dia rapido voz falar ditar registrar check-in");
  add("Ações", "Nova entrada no diário", "Escrever agora", "pen", () => { setHash("diario", "feed"); setTimeout(() => openComposer(), 60); }, "diario escrever");
  add("Ações", "Projetos e aquisições", "Planejar compras e projetos com prazo, financiamento e mentor", "target", () => setHash("fin", "projetos"), "projeto aquisicao compra financiamento carro casa");
  add("Ações", "Secretário da Vida", "Abre a janela do secretário: agora, lembretes e conversa", "brief", () => secToggle(true), "secretario assistente lembrete agenda resumo");
  add("Ações", "Exame da noite", "Bússola moral: valores do dia, vigilância e serviço", "compass", () => setHash("jornada", "exame"), "bussola moral exame consciencia valores");
  add("Ações", "Decidir com a bússola", "Oito perguntas das cinco tradições para um dilema", "compass", () => setHash("jornada", "decidir"), "dilema decisao etica moral");
  add("Ações", "Escrever uma reflexão da jornada", "Espiritismo, meditação, Taoísmo ou Budismo", "lotus", () => setHash("jornada", "inicio"), "jornada reflexao insight espiritual");
  add("Ações", "Círculo dos mentores", "Os quatro mentores da jornada conversam sobre a sua pergunta", "council", () => setHash("jornada", "confluencias"), "circulo mentores confluencias tradicoes");
  add("Ações", "Plano de carreira", "Avaliação, objetivos, plano de ação e biblioteca de BIM", "brief", () => setHash("carreira", "panorama"), "carreira bim plano objetivos competencias");
  add("Ações", "Registrar extração ou torra de café", "Lazer › Café", "coffee", () => setHash("lazer", "cafe"), "cafe espresso v60 torra extracao");
  add("Ações", "Registrar um voo no simulador", "Lazer › Aviação", "plane", () => setHash("lazer", "aviacao"), "voo simulador xplane msfs aviacao");
  add("Ações", "Avaliar competências BIM", "Níveis de 1 a 5, com evidência", "brief", () => setHash("carreira", "avaliacao"), "competencias avaliacao revit civil 3d");
  add("Ações", "Fechar a semana", "Números, reflexão, carta e prioridades", "week", () => setHash("semana"), "revisao semanal fechamento");
  add("Ações", "Novo experimento", "Teste uma mudança e meça o efeito", "flask", () => { setHash("exp"); setTimeout(() => openExpForm(), 60); }, "experimento ab teste");
  add("Ações", "Perguntar ao diário", "Busca por significado", "search", () => setHash("diario", "perguntar"), "busca significado semantica");
  add("Ações", "Livro do ano em PDF", "Capítulos, números e trechos", "chapters", () => setHash("capitulos", "livro"), "livro pdf ano");
  if (S.priv?.cofre) add("Ações", COFRE.key ? "Trancar o cofre agora" : "Destrancar o cofre", "Entradas protegidas por senha", "lock", () => COFRE.key ? cofreLock() : setHash("privacidade"), "cofre senha privacidade");
  add("Ações", "Check-in de hoje", "Humor, sono, treino", "pulse", () => setHash("saude", "checkin"), "humor sono");
  add("Ações", "Novo lançamento", "Receita, despesa ou aporte", "coins", () => openForm("lanc"), "gasto despesa receita");
  add("Ações", "Nova tarefa", "", "checksq", () => openForm("tarefas"));
  add("Ações", "Nova meta", "", "target", () => openForm("metas"));
  add("Ações", "Nova pessoa", "", "users", () => openForm("pessoas"));
  add("Ações", "Registrar contato", "", "users", () => openForm("contatos"));
  add("Ações", "Conversar com o Conselho", "Visão de todas as áreas", "council", () => setHash("mentor", "conselho"), "mentor");
  add("Ações", "Exportar backup completo", "JSON", "download", () => exportBackup(), "backup");
  add("Ações", "Desfazer", "Ctrl Z", "undo", () => undo());
  add("Ações", "Alternar tema claro/escuro", "", "sun", () => cycleTheme(), "tema dark light");
  for (const [, items] of NAV) for (const [k, l, i] of items) add("Páginas", l, "", i, () => setHash(k));
  for (const [p, subs] of Object.entries(SUBS)) for (const [s, l] of subs) if (s !== "rel" && s !== "feed") add("Páginas", `${pageTitle(p)} › ${l}`, "", "arrow", () => setHash(p, s));
  for (const id of Object.keys(MENTOR_DEF)) add("Mentores", MENTOR_DEF[id].nome, MENTOR_DEF[id].area ? ashort(MENTOR_DEF[id].area) : MENTOR_DEF[id].jor ? "Jornada existencial" : "Todas as áreas", "spark", () => setHash("mentor", id), "mentor " + (MENTOR_DEF[id].area || ""));
  if (q.trim().length >= 1) {
    for (const p of S.pessoas) add("Pessoas", p.nome, p.relacao, "users", () => openEnt("p", p.nome));
    for (const m of S.metas) add("Metas", m.meta, m.area, "target", () => openEnt("meta", m.id));
    for (const t of R.tar.filter(t => t.open)) add("Tarefas", t.tarefa, t.prazo ? `${t.al} · ${fmtD(t.prazo)}` : t.al, "checksq", () => openEnt("tar", t.id));
    for (const a of S.aprend) add("Aprendizado", a.titulo, a.tipo, "book", () => openEnt("apr", a.id));
    if (q.trim().length >= 2) for (const e of [...S.diario].reverse().slice(0, 400)) { const sc = fuzzy(e.titulo + " " + e.texto, q); if (sc > 50) out.push({ g: "Diário", l: e.titulo || trunc(e.texto, 60), s: fmtDL(e.data), ico: "pen", run: () => { DIA.focus = e.id; setHash("diario", "feed"); }, sc: sc - 30 }); }
    for (const t of Object.keys(diaryStats().tags)) add("Temas", "#" + t, "", "hash", () => openEnt("tag", t));
  }
  const order = ["Executar", "Ações", "Páginas", "Mentores", "Pessoas", "Metas", "Tarefas", "Aprendizado", "Temas", "Diário"];
  return out.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g) || b.sc - a.sc).filter((x, i, arr) => arr.filter(y => y.g === x.g).indexOf(x) < (q ? 8 : 6));
}
function openPalette(q = "") {
  const d = $("#pal");
  d.innerHTML = `<div class="palbox"><div class="palin">${ic("search")}<input id="palq" type="text" placeholder="Buscar páginas, pessoas, metas, diário… ou /gasto 12 café" autocomplete="off" spellcheck="false" aria-label="Buscar ou executar" value="${esc(q)}"><kbd>Esc</kbd></div><div id="palres" class="palres" role="listbox"></div><div class="palfoot"><span>↑ ↓ navegar</span><span>Enter abrir</span><span>/ registra dados como no diário</span></div></div>`;
  if (!d.open) d.showModal(); PALSEL = 0; palUpdate(); const i = $("#palq"); i.focus(); i.setSelectionRange(i.value.length, i.value.length);
}
function palUpdate() {
  const q = $("#palq")?.value || ""; PALITEMS = palItems(q); PALSEL = Math.min(PALSEL, Math.max(0, PALITEMS.length - 1));
  let g = null; $("#palres").innerHTML = PALITEMS.map((it, i) => { const head = it.g !== g ? `<div class="palg">${esc((g = it.g))}</div>` : ""; return head + `<button type="button" class="pali${i === PALSEL ? " on" : ""}" data-pal="${i}" role="option" aria-selected="${i === PALSEL}"${it.run ? "" : " disabled"}>${ic(it.ico)}<span>${esc(it.l)}</span>${it.s ? `<small>${esc(it.s)}</small>` : ""}</button>`; }).join("") || `<div class="empty">Nada encontrado. Tente outra palavra ou comece com / para registrar.</div>`;
  $(".pali.on")?.scrollIntoView({ block: "nearest" });
}
function palRun(i) { const it = PALITEMS[i]; if (!it?.run) return; $("#pal").close(); it.run(); }
function cycleTheme() {
  const r = document.documentElement, cur = r.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), nx = cur === "dark" ? "light" : "dark";
  r.dataset.theme = nx; try { localStorage.setItem("atlas_theme", nx); } catch {} toast(nx === "dark" ? "Tema escuro" : "Tema claro"); render();
}
