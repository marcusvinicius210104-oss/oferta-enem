// Interações da landing e eventos de medição (sem serviço pago e sem dados pessoais).
// Eventos: view_offer, select_module, select_combo, download_diagnostic, begin_checkout.
// purchase NÃO é disparado aqui: só pode vir de confirmação confiável da plataforma.

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
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

const page = document.body.dataset.page;
if (page === "offer") track("view_offer", { page_path: location.pathname });

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

document.addEventListener("click", (e) => {
  const el = e.target.closest("a, summary");
  if (!el) return;

  const checkout = el.closest("[data-checkout]");
  if (checkout) {
    checkout.href = withUtms(checkout.href);
    const sku = checkout.dataset.checkout;
    const value = Number(checkout.dataset.value) / 100;
    track(checkout.dataset.kind === "combo" ? "select_combo" : "select_module", { item_id: sku });
    track("begin_checkout", { item_id: sku, value, currency: "BRL" });
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
