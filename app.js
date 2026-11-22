/* Campi+ — protótipo frontend em HTML, CSS e JavaScript puro.
   Os dados iniciais e textos reproduzem o conteúdo visível no SVG de referência.
   A persistência local usa localStorage; não há backend ou autenticação conectados. */

const CATALOG = [
  {
    id: "library",
    kind: "place",
    name: "Biblioteca",
    icon: "▦",
    description: "Espaço destinado ao estudo e consulta de materiais acadêmicos.",
    details: [
      ["⌖", "Endereço: Bloco A — Térreo"],
      ["◷", "Horário de funcionamento: 07h às 22h"],
      ["♙", "Capacidade: 200 pessoas"]
    ]
  },
  {
    id: "computers-library",
    kind: "equipment",
    name: "Computadores da Biblioteca",
    icon: "▣",
    description: "Equipamentos disponíveis para consulta e pesquisa.",
    details: [["⌖", "Local: Biblioteca — Bloco A"]]
  },
  {
    id: "book-loan",
    kind: "service",
    name: "Serviço de empréstimo de livros",
    icon: "▤",
    description: "Disponibilização de livros e materiais para a comunidade acadêmica.",
    details: [["⌖", "Local de referência: Biblioteca — Bloco A"]]
  }
];

const INITIAL_OCCURRENCES = [
  {
    id: "air-conditioning",
    title: "Ar-condicionado com defeito",
    location: "Biblioteca — Bloco A",
    status: "Em análise",
    confirmations: 2,
    registered: "10/09/2026",
    category: "Climatização",
    type: "Equipamento com defeito",
    description: "O ar-condicionado da sala de estudos não está funcionando corretamente, mesmo após a limpeza dos filtros.",
    history: [
      { date: "10/09/2026 — 14:32", text: "Ocorrência registrada no sistema." },
      { date: "11/09/2026 — 09:15", text: "Status alterado para Em análise." }
    ],
    confirmedByUser: false
  },
  {
    id: "extinguisher",
    title: "Extintor despressurizado",
    location: "Bloco B, Corredor",
    status: "Recebida",
    confirmations: 5,
    registered: "10/09/2026",
    category: "Segurança",
    type: "Equipamento com problema",
    description: "Extintor despressurizado.",
    history: [],
    confirmedByUser: false
  },
  {
    id: "structural",
    title: "Problema estrutural",
    location: "Biblioteca",
    status: "Encaminhada",
    confirmations: 1,
    registered: "10/09/2026",
    category: "Estrutura física",
    type: "Problema estrutural",
    description: "Problema estrutural sinalizado na Biblioteca.",
    history: [],
    confirmedByUser: false
  }
];

const RELATED_LIBRARY_ISSUES = [
  { title: "Ar-condicionado com defeito", status: "Em análise", occurrenceId: "air-conditioning" },
  { title: "Luz queimada", status: "Recebida", occurrenceId: "air-conditioning" },
  { title: "Problema no projetor", status: "Resolvida", occurrenceId: "air-conditioning" }
];

const STATUS_STEPS = ["Recebida", "Em análise", "Encaminhada", "Em manutenção", "Resolvida"];
const KIND_LABELS = { place: "Local", equipment: "Equipamento", service: "Serviço" };
const KIND_ROUTES = { place: "locations", equipment: "equipment", service: "services" };
const STORAGE_KEY = "campi-plus-occurrences-v1";
const ACCOUNT_KEY = "campi-plus-account-v1";
const SESSION_KEY = "campi-plus-session-v1";
let occurrences = loadOccurrences();
let currentUser = loadSession();

function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    return saved && saved.email ? saved : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  currentUser = user;
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
  updateProfileMenu();
}

function getSavedAccount() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null");
  } catch {
    return null;
  }
}

function loadOccurrences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Não foi possível ler os dados locais do Campi+.", error);
  }
  return INITIAL_OCCURRENCES.map(item => ({ ...item, history: [...item.history] }));
}

function saveOccurrences() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(occurrences));
  } catch (error) {
    console.warn("Não foi possível salvar os dados locais do Campi+.", error);
    showToast("Não foi possível salvar neste navegador. Os dados podem ser perdidos ao atualizar a página.");
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}
function formatDateTime(date = new Date()) {
  return `${formatDate(date)} — ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date)}`;
}
function slugStatus(status) {
  return ({ "Recebida": "received", "Em análise": "analysis", "Encaminhada": "forwarded", "Em manutenção": "maintenance", "Resolvida": "resolved" })[status] || "neutral";
}
function statusIndex(status) {
  const index = STATUS_STEPS.indexOf(status);
  return index < 0 ? 0 : index;
}
function getOccurrence(id) { return occurrences.find(item => item.id === id); }
function getCatalogItem(id) { return CATALOG.find(item => item.id === id); }
function parseRoute() {
  const raw = window.location.hash.slice(1) || "/home";
  const [path, queryString = ""] = raw.split("?");
  return { path: path || "/home", params: new URLSearchParams(queryString) };
}
function navigate(path) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}
function setActiveNav(route) {
  let key = route.split("/")[1] || "home";
  if (key === "place" || key === "catalog" || key === "search" || key === "report" || key === "tracking" || key === "occurrence") {
    const { params } = parseRoute();
    if (key === "place") key = "locations";
    else if (key === "catalog") key = KIND_ROUTES[getCatalogItem(route.split("/")[3])?.kind] || "equipment";
    else if (key === "report" || key === "occurrence" || key === "tracking") key = "occurrences";
    else if (key === "search") key = params.get("tipo") && KIND_ROUTES[params.get("tipo")] ? KIND_ROUTES[params.get("tipo")] : "locations";
  }
  document.querySelectorAll("[data-nav]").forEach(link => {
    const isActive = link.dataset.nav === key;
    link.classList.toggle("active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function statusPill(status) {
  return `<span class="status-pill ${slugStatus(status)}">${escapeHTML(status)}</span>`;
}
function searchForm(value = "", className = "") {
  return `
    <form class="hero-search ${className}" data-form="search" role="search">
      <label class="search-field">
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input name="q" type="search" value="${escapeHTML(value)}" placeholder="Pesquise por local, equipamento ou serviço..." aria-label="Pesquisar locais, equipamentos ou serviços">
      </label>
      <button class="primary-button" type="submit">Pesquisar</button>
    </form>`;
}
function renderOccurrenceRow(item) {
  return `
    <a class="occurrence-row" href="#/occurrence/${encodeURIComponent(item.id)}">
      <span class="status-dot ${slugStatus(item.status)}" aria-hidden="true"></span>
      <span class="row-title">${escapeHTML(item.title)}</span>
      <span class="row-location">— ${escapeHTML(item.location)}</span>
      ${statusPill(item.status)}
      <span class="row-count">${Number(item.confirmations) || 0} ${Number(item.confirmations) === 1 ? "confirmação" : "confirmações"}</span>
    </a>`;
}
function renderHome() {
  const recent = occurrences.slice(0, 3);
  return `
    <section class="hero">
      <h1>Bem-vindo ao Campi+</h1>
      <p>Aqui você pode consultar informações, sinalizar problemas e<br class="desktop-break"> acompanhar o andamento das ocorrências da infraestrutura do campus.</p>
      ${searchForm()}
    </section>
    <section class="content-pad">
      <div class="shortcut-grid">
        <a class="shortcut-card" href="#/locations"><span class="shortcut-icon" aria-hidden="true">⌕</span><span><strong>Consultar</strong><span>locais, equipamentos<br>e serviços</span></span></a>
        <a class="shortcut-card" href="#/report"><span class="shortcut-icon" aria-hidden="true">!</span><span><strong>Sinalizar</strong><span>um problema</span></span></a>
        <a class="shortcut-card" href="#/occurrences"><span class="shortcut-icon" aria-hidden="true">✓</span><span><strong>Confirmar</strong><span>uma ocorrência</span></span></a>
        <a class="shortcut-card" href="#/occurrences"><span class="shortcut-icon" aria-hidden="true">▣</span><span><strong>Acompanhar</strong><span>suas solicitações</span></span></a>
      </div>
      <div class="section-heading"><h2>Ocorrências recentes</h2><a class="text-link" href="#/occurrences">Ver todas →</a></div>
      <div class="occurrence-list">${recent.length ? recent.map(renderOccurrenceRow).join("") : emptyOccurrences()}</div>
    </section>`;
}
function emptyOccurrences() {
  return `<div class="empty-state"><span class="empty-icon" aria-hidden="true">✓</span><h3>Nenhuma ocorrência cadastrada</h3><p>Quando houver registros, eles aparecerão nesta área.</p><a class="primary-button" href="#/report">Sinalizar um problema</a></div>`;
}
function renderTabs(active, query) {
  const tabs = [
    ["all", "Todos"], ["place", "Locais"], ["equipment", "Equipamentos"], ["service", "Serviços"]
  ];
  return `<div class="tabs" role="group" aria-label="Filtrar resultados">${tabs.map(([kind, label]) => {
    const url = `#/search?q=${encodeURIComponent(query)}&tipo=${kind}`;
    return `<a class="tab ${active === kind ? "active" : ""}" href="${url}" ${active === kind ? 'aria-current="page"' : ""}>${label}</a>`;
  }).join("")}</div>`;
}
function renderResultCard(item) {
  const route = item.kind === "place" ? `#/place/${item.id}` : `#/catalog/${item.kind}/${item.id}`;
  return `<a class="result-card" href="${route}"><span class="result-icon" aria-hidden="true">${item.icon}</span><span class="result-copy"><strong>${escapeHTML(item.name)}</strong><span class="result-kind">${KIND_LABELS[item.kind]}</span><p>${escapeHTML(item.description)}</p></span><span class="result-arrow" aria-hidden="true">›</span></a>`;
}
function renderSearch(query, active = "all") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const matches = CATALOG.filter(item => {
    const matchesKind = active === "all" || item.kind === active;
    const text = `${item.name} ${item.description} ${KIND_LABELS[item.kind]}`.toLocaleLowerCase("pt-BR");
    return matchesKind && (!normalized || text.includes(normalized));
  });
  return `
    <section class="page-content">
      ${searchForm(query, "inline-search")}
      <h1 class="page-title">Resultados para “${escapeHTML(query || "todos os itens")}”</h1>
      ${renderTabs(active, query)}
      <div class="result-list">${matches.length ? matches.map(renderResultCard).join("") : `<div class="empty-state"><span class="empty-icon" aria-hidden="true">⌕</span><h3>Nenhum resultado encontrado</h3><p>Tente outro termo ou selecione uma categoria diferente.</p><a class="text-link" href="#/search?q=">Limpar pesquisa</a></div>`}</div>
      <p class="dev-note">Este catálogo contém os itens presentes no protótipo. Novos locais, equipamentos e serviços podem ser cadastrados na próxima etapa do projeto.</p>
    </section>`;
}
function renderCatalogPage(kind) {
  const sectionName = { place: "Locais", equipment: "Equipamentos", service: "Serviços" }[kind];
  const rows = CATALOG.filter(item => item.kind === kind);
  const description = {
    place: "Consulte os espaços e ambientes do campus.",
    equipment: "Consulte os equipamentos disponíveis no campus.",
    service: "Encontre os serviços oferecidos à comunidade acadêmica."
  }[kind];
  return `
    <section class="page-content">
      <div class="page-title-row"><div><h1>${sectionName}</h1><p class="page-subtitle">${description}</p></div><a class="secondary-button" href="#/search?tipo=${kind}&q=">⌕ Pesquisar</a></div>
      <div class="result-list">${rows.length ? rows.map(renderResultCard).join("") : `<div class="empty-state"><span class="empty-icon" aria-hidden="true">＋</span><h3>Esta área está pronta para receber conteúdo</h3><p>O menu e a página de ${sectionName.toLocaleLowerCase("pt-BR")} já estão disponíveis. Os registros e funcionalidades específicos podem ser definidos na próxima etapa.</p></div>`}</div>
      <p class="dev-note"><strong>Estrutura inicial:</strong> esta página foi criada como atalho navegável porque a tela completa desta seção não aparece no arquivo de referência do Figma.</p>
    </section>`;
}
function renderLocations() { return renderCatalogPage("place"); }
function renderEquipment() { return renderCatalogPage("equipment"); }
function renderServices() { return renderCatalogPage("service"); }
function renderOccurrencesPage() {
  const sorted = [...occurrences].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    <section class="page-content">
      <div class="page-title-row"><div><h1>Ocorrências</h1><p class="page-subtitle">Consulte, confirme e acompanhe os problemas sinalizados no campus.</p></div><a class="primary-button" href="#/report">＋ Sinalizar problema</a></div>
      <div class="occurrence-list">${sorted.length ? sorted.map(renderOccurrenceRow).join("") : emptyOccurrences()}</div>
      <p class="dev-note">A listagem é um protótipo local. A integração com uma base de dados compartilhada e com contas de usuários ainda precisa ser implementada.</p>
    </section>`;
}
function renderPlaceDetail(item) {
  const related = item.id === "library" ? RELATED_LIBRARY_ISSUES : [];
  const info = (item.details || []).map(([icon, text]) => `<div class="info-item"><span class="info-mark" aria-hidden="true">${icon}</span><span>${escapeHTML(text)}</span></div>`).join("");
  return `
    <section class="page-content">
      <a class="back-link" href="#/${KIND_ROUTES[item.kind]}">← Voltar</a>
      <div class="page-title-row">
        <div class="entity-heading"><span class="entity-icon" aria-hidden="true">${item.icon}</span><div><h1>${escapeHTML(item.name)}</h1><p class="kind">${KIND_LABELS[item.kind]}</p><p>${escapeHTML(item.description)}</p></div></div>
        <a class="primary-button detail-action" href="#/report?item=${item.id}">Sinalizar problema</a>
      </div>
      <div class="detail-grid">
        <section class="panel"><h2>Informações</h2><div class="info-list">${info || `<div class="info-item">Informações adicionais ainda não cadastradas.</div>`}</div></section>
        <section class="panel"><h2>Ocorrências relacionadas</h2>${related.length ? `<div class="related-list">${related.map(issue => `<div class="related-item"><span>• ${escapeHTML(issue.title)}</span>${statusPill(issue.status)}</div>`).join("")}</div>` : `<p class="page-subtitle">Ainda não há ocorrências relacionadas cadastradas para este item.</p>`}</section>
      </div>
    </section>`;
}
function renderCatalogDetail(item) {
  const details = (item.details || []).map(([icon, text]) => `<div class="info-item"><span class="info-mark" aria-hidden="true">${icon}</span><span>${escapeHTML(text)}</span></div>`).join("");
  return `
    <section class="page-content">
      <a class="back-link" href="#/${KIND_ROUTES[item.kind]}">← Voltar</a>
      <div class="page-title-row">
        <div class="entity-heading"><span class="entity-icon" aria-hidden="true">${item.icon}</span><div><h1>${escapeHTML(item.name)}</h1><p class="kind">${KIND_LABELS[item.kind]}</p><p>${escapeHTML(item.description)}</p></div></div>
        <a class="primary-button detail-action" href="#/report?item=${item.id}">Sinalizar problema</a>
      </div>
      <div class="detail-grid">
        <section class="panel"><h2>Informações</h2><div class="info-list">${details || `<div class="info-item">Informações adicionais ainda não cadastradas.</div>`}</div></section>
        <section class="panel"><h2>Ocorrências relacionadas</h2><p class="page-subtitle">As ocorrências vinculadas a este item serão exibidas aqui quando houver registros.</p></section>
      </div>
      <p class="dev-note">Esta página de detalhe foi criada como uma extensão da navegação prevista no Figma. Os campos específicos de ${KIND_LABELS[item.kind].toLocaleLowerCase("pt-BR")} podem ser ampliados conforme as regras do projeto.</p>
    </section>`;
}
function renderReportForm(params) {
  const selected = params.get("item") || "";
  const options = CATALOG.map(item => `<option value="${item.id}" ${selected === item.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("");
  return `
    <section class="page-content form-wrap">
      <a class="back-link" href="#/home">← Voltar</a>
      <h1 class="page-title">Sinalizar um problema</h1>
      <p class="page-subtitle">Preencha os dados abaixo para registrar uma ocorrência.</p>
      <form id="report-form" data-form="report" class="panel" style="margin-top:24px">
        <div class="form-grid">
          <div class="form-field full"><label for="report-item">Local, equipamento ou serviço *</label><select id="report-item" name="item" required><option value="" disabled ${selected ? "" : "selected"}>Selecione...</option>${options}</select></div>
          <div class="form-field"><label for="report-category">Categoria *</label><select id="report-category" name="category" required><option value="" disabled selected>Selecione...</option><option>Climatização</option><option>Elétrica</option><option>Hidráulica</option><option>Limpeza</option><option>Segurança</option><option>Estrutura física</option><option>Equipamentos</option><option>Outro</option></select></div>
          <div class="form-field"><label for="report-type">Tipo de ocorrência *</label><select id="report-type" name="type" required><option value="" disabled selected>Selecione...</option><option>Equipamento com defeito</option><option>Problema estrutural</option><option>Falta de material</option><option>Problema de limpeza</option><option>Risco à segurança</option><option>Outro</option></select></div>
          <div class="form-field full"><label for="report-description">Descrição (opcional)</label><textarea id="report-description" name="description" placeholder="Descreva o problema em detalhes..."></textarea></div>
        </div>
        <div class="form-actions"><a class="quiet-button" href="#/home">Cancelar</a><button class="primary-button" type="submit">Enviar</button></div>
        <p class="form-hint">Os campos marcados com * são obrigatórios.</p>
      </form>
    </section>`;
}
function renderOccurrenceDetail(item) {
  const confirmations = Number(item.confirmations) || 0;
  const description = item.description || "Nenhuma descrição adicional foi informada.";
  return `
    <section class="page-content">
      <a class="back-link" href="#/occurrences">← Voltar</a>
      <div class="occurrence-detail-grid">
        <div>
          <div class="issue-title"><span class="status-dot ${slugStatus(item.status)}" aria-hidden="true" style="width:19px;height:19px;border:2px solid currentColor;background:transparent"></span><h1>${escapeHTML(item.title)}</h1>${statusPill(item.status)}</div>
          <p class="issue-location">${escapeHTML(item.location)}</p>
          <p class="issue-meta">${confirmations} ${confirmations === 1 ? "confirmação" : "confirmações"}<br>Registrada em ${escapeHTML(item.registered || "—")}</p>
          <div class="description-block"><h2>Descrição</h2><p>${escapeHTML(description)}</p></div>
          <button class="primary-button" type="button" data-action="confirm" data-id="${escapeHTML(item.id)}">✓ ${item.confirmedByUser ? "Ocorrência confirmada" : "Confirmar ocorrência"}</button>
          <a class="secondary-button" style="margin-left:8px" href="#/tracking/${encodeURIComponent(item.id)}">Acompanhar</a>
        </div>
        <aside class="panel"><h2>Informações da ocorrência</h2><dl class="detail-info"><div><dt>Categoria</dt><dd>${escapeHTML(item.category || "Não informada")}</dd></div><div><dt>Tipo</dt><dd>${escapeHTML(item.type || "Não informado")}</dd></div><div><dt>Status</dt><dd>${statusPill(item.status)}</dd></div></dl></aside>
      </div>
    </section>`;
}
function renderTracking(item) {
  const current = statusIndex(item.status);
  const history = item.history || [];
  return `
    <section class="page-content">
      <a class="back-link" href="#/occurrence/${encodeURIComponent(item.id)}">← Voltar à ocorrência</a>
      <h1 class="page-title">Acompanhamento da ocorrência</h1>
      <p class="page-subtitle">${escapeHTML(item.title)} · ${escapeHTML(item.location)}</p>
      <div class="progress-track" aria-label="Etapas do andamento">${STATUS_STEPS.map((step, index) => `<div class="progress-step ${index < current ? "done" : ""} ${index === current ? "current" : ""}"><span class="progress-circle">${index < current ? "✓" : index + 1}</span><span class="progress-label">${step}</span></div>`).join("")}</div>
      <section class="panel"><h2>Histórico de atualizações</h2>
        ${history.length ? `<div class="history-list">${history.map(entry => `<div class="history-item"><span class="history-bullet" aria-hidden="true"></span><div><strong>${escapeHTML(entry.date)}</strong><p>${escapeHTML(entry.text)}</p></div></div>`).join("")}</div>` : `<p class="page-subtitle">Ainda não há atualizações adicionais. A ocorrência está com status: ${escapeHTML(item.status)}.</p>`}
        <p class="page-subtitle" style="margin-top:22px">Acompanhe o andamento da sua solicitação por aqui.</p>
      </section>
    </section>`;
}
function renderAccountForm(mode) {
  const isRegister = mode === "register";
  return `
    <section class="account-page">
      <div class="account-card">
        <a class="back-link" href="#/home">← Voltar ao início</a>
        <div class="account-brand">Campi<span>+</span></div>
        <h1>${isRegister ? "Crie sua conta" : "Que bom ter você de volta"}</h1>
        <p class="account-intro">${isRegister ? "Cadastre-se para acompanhar suas solicitações e participar da comunidade do campus." : "Entre para acessar seu perfil e acompanhar suas solicitações."}</p>
        <form data-form="${isRegister ? "register" : "login"}" class="account-form">
          ${isRegister ? `<div class="form-field"><label for="account-name">Nome completo</label><input id="account-name" name="name" type="text" autocomplete="name" placeholder="Como podemos chamar você?" required minlength="2"></div>` : ""}
          <div class="form-field"><label for="account-email">E-mail</label><input id="account-email" name="email" type="email" autocomplete="email" placeholder="voce@exemplo.com" required></div>
          <div class="form-field"><label for="account-password">Senha</label><input id="account-password" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" placeholder="${isRegister ? "Pelo menos 6 caracteres" : "Sua senha"}" required ${isRegister ? "minlength=\"6\"" : ""}></div>
          ${isRegister ? `<div class="form-field"><label for="account-confirm">Confirme a senha</label><input id="account-confirm" name="confirm" type="password" autocomplete="new-password" placeholder="Digite a senha novamente" required minlength="6"></div>` : ""}
          <button class="primary-button account-submit" type="submit">${isRegister ? "Criar conta" : "Entrar"}</button>
        </form>
        <p class="account-switch">${isRegister ? `Já tem uma conta? <a href="#/login">Entrar</a>` : `Ainda não tem cadastro? <a href="#/register">Criar uma conta</a>`}</p>
        <p class="account-disclaimer">Demonstração de interface: os dados ficam salvos somente neste navegador. Não use uma senha real.</p>
      </div>
    </section>`;
}

function renderProfile() {
  if (!currentUser) return `<section class="page-content"><div class="empty-state"><span class="empty-icon">♙</span><h3>Entre para acessar seu perfil</h3><p>Faça login ou crie uma conta de demonstração para continuar.</p><a class="primary-button" href="#/login">Entrar</a></div></section>`;
  return `
    <section class="page-content profile-page">
      <a class="back-link" href="#/home">← Voltar ao início</a>
      <div class="page-title-row"><div><h1>Meu perfil</h1><p class="page-subtitle">Seus dados de acesso no Campi+.</p></div></div>
      <section class="panel profile-card">
        <div class="profile-avatar">${escapeHTML((currentUser.name || currentUser.email).trim().charAt(0).toLocaleUpperCase("pt-BR"))}</div>
        <div><h2>${escapeHTML(currentUser.name || "Usuário Campi+")}</h2><p>${escapeHTML(currentUser.email)}</p></div>
      </section>
      <div class="profile-links"><a class="result-card" href="#/occurrences"><span class="result-icon">✓</span><span class="result-copy"><strong>Minhas ocorrências</strong><span>Consulte os registros disponíveis neste protótipo.</span></span><span class="result-arrow">›</span></a></div>
      <button class="secondary-button" type="button" data-action="logout">Sair da conta</button>
      <p class="account-disclaimer">Esta conta é apenas uma simulação visual. A senha não é validada por um servidor e não deve ser reutilizada em outros serviços.</p>
    </section>`;
}

function updateProfileMenu() {
  const button = document.querySelector(".profile-button");
  const popover = document.querySelector(".profile-popover");
  if (!button || !popover) return;
  button.querySelector("span").textContent = currentUser
    ? (currentUser.name || currentUser.email).trim().charAt(0).toLocaleUpperCase("pt-BR")
    : "U";
  button.setAttribute("aria-label", currentUser ? "Abrir menu da conta" : "Entrar ou criar conta");
  popover.innerHTML = currentUser
    ? `<strong>${escapeHTML(currentUser.name || "Minha conta")}</strong><p>${escapeHTML(currentUser.email)}</p><a href="#/profile">Ver meu perfil</a><a href="#/occurrences">Minhas ocorrências</a><button type="button" data-action="logout">Sair</button>`
    : `<strong>Área do usuário</strong><p>Entre para acessar seu perfil ou crie uma conta de demonstração.</p><a href="#/login">Entrar</a><a href="#/register">Criar conta</a>`;
}

function renderNotFound() {
  return `<section class="page-content"><div class="empty-state"><span class="empty-icon">?</span><h3>Página não encontrada</h3><p>O endereço acessado não corresponde a uma página disponível no Campi+.</p><a class="primary-button" href="#/home">Voltar ao início</a></div></section>`;
}

function render() {
  const { path, params } = parseRoute();
  let html;
  if (path === "/" || path === "/home") html = renderHome();
  else if (path === "/search") html = renderSearch(params.get("q") || "", params.get("tipo") || "all");
  else if (path === "/locations") html = renderLocations();
  else if (path === "/equipment") html = renderEquipment();
  else if (path === "/services") html = renderServices();
  else if (path === "/occurrences") html = renderOccurrencesPage();
  else if (path === "/report") html = renderReportForm(params);
  else if (path.startsWith("/place/")) {
    const item = getCatalogItem(decodeURIComponent(path.split("/")[2] || ""));
    html = item ? renderPlaceDetail(item) : renderNotFound();
  } else if (path.startsWith("/catalog/")) {
    const item = getCatalogItem(decodeURIComponent(path.split("/")[3] || ""));
    html = item ? renderCatalogDetail(item) : renderNotFound();
  } else if (path.startsWith("/occurrence/")) {
    const item = getOccurrence(decodeURIComponent(path.split("/")[2] || ""));
    html = item ? renderOccurrenceDetail(item) : renderNotFound();
  } else if (path.startsWith("/tracking/")) {
    const item = getOccurrence(decodeURIComponent(path.split("/")[2] || ""));
    html = item ? renderTracking(item) : renderNotFound();
  } else if (path === "/login") html = renderAccountForm("login");
  else if (path === "/register") html = renderAccountForm("register");
  else if (path === "/profile") html = renderProfile();
  else html = renderNotFound();

  document.getElementById("main-content").innerHTML = html;
  updateProfileMenu();
  setActiveNav(path);
  document.title = `${pageTitle(path)} | Campi+`;
  window.scrollTo(0, 0);
}
function pageTitle(path) {
  if (path === "/home" || path === "/") return "Início";
  if (path === "/locations") return "Locais";
  if (path === "/equipment") return "Equipamentos";
  if (path === "/services") return "Serviços";
  if (path.startsWith("/occurrence/") || path === "/occurrences") return "Ocorrências";
  if (path === "/report") return "Sinalizar um problema";
  if (path.startsWith("/tracking/")) return "Acompanhamento";
  if (path.startsWith("/place/") || path.startsWith("/catalog/")) return "Detalhes";
  if (path === "/login") return "Entrar";
  if (path === "/register") return "Criar conta";
  if (path === "/profile") return "Meu perfil";
  return "Página não encontrada";
}
function showToast(message) {
  const region = document.querySelector(".toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

// Navegação e formulários delegados para continuar funcionando após cada renderização.
window.addEventListener("hashchange", render);
document.addEventListener("submit", event => {
  const form = event.target;
  if (form.matches('[data-form="search"]')) {
    event.preventDefault();
    const query = new FormData(form).get("q") || "";
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }
  if (form.matches('[data-form="register"]')) {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim().toLocaleLowerCase("pt-BR");
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");
    if (password.length < 6) return showToast("Escolha uma senha com pelo menos 6 caracteres.");
    if (password !== confirm) return showToast("As senhas não são iguais.");
    const account = getSavedAccount();
    if (account && account.email === email) return showToast("Já existe uma conta de demonstração com este e-mail. Entre nela.");
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name, email, password }));
    saveSession({ name, email });
    showToast("Conta criada neste navegador.");
    navigate("/profile");
  }
  if (form.matches('[data-form="login"]')) {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLocaleLowerCase("pt-BR");
    const password = String(data.get("password") || "");
    const account = getSavedAccount();
    if (!account || account.email !== email || account.password !== password) {
      return showToast("Não encontramos uma conta com esses dados neste navegador. Confira ou crie uma conta.");
    }
    saveSession({ name: account.name, email: account.email });
    showToast("Você entrou no Campi+.");
    navigate("/profile");
  }
  if (form.matches('[data-form="report"]')) {
    event.preventDefault();
    const formData = new FormData(form);
    const item = getCatalogItem(formData.get("item"));
    if (!item) {
      showToast("Selecione um local, equipamento ou serviço.");
      return;
    }
    const now = new Date();
    const description = String(formData.get("description") || "").trim();
    const occurrence = {
      id: `occ-${Date.now()}`,
      title: description ? description.split(/[.!?\n]/)[0].slice(0, 70) || `Problema em ${item.name}` : `Problema em ${item.name}`,
      location: item.kind === "place" ? item.name : (item.details?.[0]?.[1]?.replace(/^(Local: |Local de referência: )/, "") || item.name),
      status: "Recebida",
      confirmations: 0,
      registered: formatDate(now),
      category: String(formData.get("category")),
      type: String(formData.get("type")),
      description: description || "Nenhuma descrição adicional foi informada.",
      history: [{ date: formatDateTime(now), text: "Ocorrência registrada no sistema." }],
      confirmedByUser: false,
      createdAt: now.toISOString()
    };
    occurrences.unshift(occurrence);
    saveOccurrences();
    showToast("Ocorrência registrada com sucesso neste protótipo.");
    navigate(`/occurrence/${encodeURIComponent(occurrence.id)}`);
  }
});

document.addEventListener("click", event => {
  const logoutButton = event.target.closest('[data-action="logout"]');
  if (logoutButton) {
    saveSession(null);
    const popover = document.querySelector(".profile-popover");
    if (popover) popover.hidden = true;
    const button = document.querySelector(".profile-button");
    if (button) button.setAttribute("aria-expanded", "false");
    showToast("Você saiu da sua conta.");
    navigate("/home");
    return;
  }
  const confirmButton = event.target.closest('[data-action="confirm"]');
  if (confirmButton) {
    const item = getOccurrence(confirmButton.dataset.id);
    if (!item) return;
    if (item.confirmedByUser) {
      showToast("Você já confirmou esta ocorrência.");
      return;
    }
    item.confirmations = (Number(item.confirmations) || 0) + 1;
    item.confirmedByUser = true;
    saveOccurrences();
    render();
    showToast("Sua confirmação foi registrada.");
  }
});

const profileButton = document.querySelector(".profile-button");
const profilePopover = document.querySelector(".profile-popover");
profileButton.addEventListener("click", () => {
  const isOpen = !profilePopover.hidden;
  profilePopover.hidden = isOpen;
  profileButton.setAttribute("aria-expanded", String(!isOpen));
});
document.addEventListener("click", event => {
  if (!event.target.closest(".profile-button") && !event.target.closest(".profile-popover")) {
    profilePopover.hidden = true;
    profileButton.setAttribute("aria-expanded", "false");
  }
});

render();
