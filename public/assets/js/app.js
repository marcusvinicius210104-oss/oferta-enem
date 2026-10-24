// Interações da landing e eventos de medição (sem dados pessoais).
// Eventos: view_offer, select_module, select_combo, download_diagnostic, begin_checkout e os do quiz.
// purchase NÃO é disparado aqui: só pode vir de confirmação confiável da plataforma (Cakto).

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

// Eventos do dataLayer repassados ao Pixel do Meta (quando instalado no <head>).
// InitiateCheckout e Purchase ficam com o pixel da Cakto, para não contar em dobro.
const PARA_META = {
  view_offer: (e) => ["track", "ViewContent", { content_name: e.page_path }],
  quiz_start: () => ["trackCustom", "QuizStart"],
  quiz_complete: (e) => ["trackCustom", "QuizComplete", { lead_tier: e.lead_tier, content_name: e.recommendation }],
  download_diagnostic: () => ["trackCustom", "DownloadDiagnostico"],
  begin_checkout: (e) => ["trackCustom", "CliqueCheckout", { content_ids: [e.item_id], value: e.value, currency: e.currency, origem: e.origem || "site" }],
};

function paraMeta(e) {
  if (typeof window.fbq !== "function" || !PARA_META[e.event]) return;
  window.fbq(...PARA_META[e.event](e));
  // Lead só para quem termina o quiz com perfil quente (ENEM 2026 e já estudou).
  if (e.event === "quiz_complete" && e.lead_tier === "quente") window.fbq("track", "Lead", { content_name: e.recommendation });
}

window.dataLayer = window.dataLayer || [];
const pushOriginal = window.dataLayer.push.bind(window.dataLayer);
window.dataLayer.push = (...itens) => {
  for (const e of itens) if (e && e.event) paraMeta(e);
  return pushOriginal(...itens);
};

function track(event, params = {}) {
  window.dataLayer.push({ event, ...params });
}

function currentUtms() {
  const q = new URLSearchParams(location.search);
  const utms = {};
  for (const k of UTM_KEYS) if (q.get(k)) utms[k] = q.get(k);
  return utms;
}

// Repassa UTMs da visita para o link real de checkout, quando houver.
function withUtms(href) {
  const utms = currentUtms();
  if (!Object.keys(utms).length) return href;
  const url = new URL(href);
  for (const [k, v] of Object.entries(utms)) if (!url.searchParams.has(k)) url.searchParams.set(k, v);
  return url.toString();
}

// Contagem regressiva até as datas reais da prova (definidas no catálogo).
// Nível: calmo (> 30 dias), atencao (8 a 30 dias), urgente (7 dias ou menos e nos dias de prova).
const DIA = 86_400_000;
const dois = (n) => String(n).padStart(2, "0");
const diaMes = (d) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "2-digit", timeZone: "America/Sao_Paulo" });

function iniciarContagem(barra) {
  const dias = JSON.parse(barra.dataset.dias).map((s) => new Date(s));
  const rotulo = barra.querySelector("[data-contagem-rotulo]");
  const relogio = barra.querySelector("[data-contagem-relogio]");
  const sufixo = barra.querySelector("[data-contagem-sufixo]");

  function atualizar() {
    const agora = Date.now();
    const i = dias.findIndex((d) => agora < d.getTime() + DIA);
    if (i === -1) { barra.hidden = true; return false; }
    const alvo = dias[i].getTime();
    const ordem = i === 0 ? "1º" : "2º";

    if (agora >= alvo) {
      barra.dataset.nivel = "urgente";
      rotulo.textContent = `Hoje é o ${ordem} dia do ENEM. Boa prova!`;
      relogio.textContent = "";
      sufixo.textContent = "";
      return true;
    }
    const falta = alvo - agora;
    const d = Math.floor(falta / DIA);
    const h = Math.floor((falta % DIA) / 3_600_000);
    const m = Math.floor((falta % 3_600_000) / 60_000);
    const s = Math.floor((falta % 60_000) / 1000);
    barra.dataset.nivel = d < 7 ? "urgente" : d < 30 ? "atencao" : "calmo";
    rotulo.textContent = d < 7 ? "Reta final! Faltam" : "Faltam";
    relogio.textContent = `${d}d ${dois(h)}h ${dois(m)}m ${dois(s)}s`;
    sufixo.textContent = `para o ${ordem} dia do ENEM (${diaMes(dias[i])})`;
    return true;
  }

  if (atualizar()) setInterval(atualizar, 1000);
}

for (const barra of document.querySelectorAll("[data-contagem]")) iniciarContagem(barra);

const page = document.body.dataset.page;
if (page === "offer") track("view_offer", { page_path: location.pathname });

// Vindo do quiz (/?rec=sku): destaca o produto recomendado.
const rec = new URLSearchParams(location.search).get("rec");
const alvoRec = rec && (rec === "combo-revisao" ? document.getElementById("combo") : document.getElementById(`modulo-${rec}`));
if (alvoRec) {
  alvoRec.classList.add("is-recomendado");
  addEventListener("load", () => alvoRec.scrollIntoView({ block: "start" }));
}

// Flashcard da demonstração
for (const card of document.querySelectorAll("[data-flash]")) {
  const btn = card.querySelector("button");
  const answer = card.querySelector(".flash__r");
  btn.addEventListener("click", () => {
    const open = answer.hidden;
    answer.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.textContent = open ? "Esconder resposta" : "Revelar resposta";
  });
}

// Etapas de "Como funciona": acendem em sequência ao aparecer e respondem ao clique.
for (const lista of document.querySelectorAll("[data-passos]")) {
  const passos = [...lista.children];
  const marcar = (ativo) =>
    passos.forEach((p, i) => {
      p.classList.toggle("is-feito", i < ativo);
      p.classList.toggle("is-ativo", i === ativo);
      p.querySelector("button").setAttribute("aria-current", i === ativo ? "step" : "false");
    });
  let timer;
  const parar = () => clearInterval(timer);
  lista.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-passo]");
    if (!btn) return;
    parar();
    marcar(Number(btn.dataset.passo));
  });
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzido || !("IntersectionObserver" in window)) {
    marcar(passos.length - 1);
    continue;
  }
  marcar(0);
  const obs = new IntersectionObserver(
    ([entrada]) => {
      if (!entrada.isIntersecting) return;
      obs.disconnect();
      let i = 0;
      timer = setInterval(() => (++i < passos.length ? marcar(i) : parar()), 1200);
    },
    { threshold: 0.35 }
  );
  obs.observe(lista);
}

document.addEventListener("click", (e) => {
  const el = e.target.closest("a, summary");
  if (!el) return;

  const checkout = el.closest("[data-checkout]");
  if (checkout) {
    checkout.href = withUtms(checkout.href);
    const sku = checkout.dataset.checkout;
    const value = Number(checkout.dataset.value) / 100;
    track(checkout.dataset.kind === "combo" ? "select_combo" : "select_module", { item_id: sku });
    track("begin_checkout", { item_id: sku, value, currency: "BRL", ...(checkout.dataset.origem && { origem: checkout.dataset.origem }) });
    return;
  }
  if (el.matches("[data-select='combo']")) track("select_combo", { item_id: "combo-revisao" });
  if (el.matches("[data-select-module]")) track("select_module", { item_id: el.dataset.selectModule });
  if (el.matches("[data-download]")) track("download_diagnostic", { item_id: "diagnostico-express" });
});

for (const d of document.querySelectorAll("details[data-detalhe]")) {
  d.addEventListener("toggle", () => {
    if (d.open) track("select_module", { item_id: d.dataset.detalhe, action: "details" });
  });
}
