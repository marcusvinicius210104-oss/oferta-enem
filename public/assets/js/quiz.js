// Quiz de qualificação (/quiz). Regras em FUNIL_QUIZ.md; perguntas e pontos em config/quiz.json.
// Nada sai do navegador além dos eventos do dataLayer. Não há captura de contato.

const D = JSON.parse(document.getElementById("quiz-dados").textContent);
const raiz = document.querySelector("[data-quiz]");
const Q = D.questions;
const COMBO = D.combo.sku;

const respostas = {}; // id da pergunta -> [ids das opções]
let passo = 0;
let comecou = false;

// O app.js repassa estes eventos ao Pixel do Meta.
function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const opcao = (q, id) => q.options.find((o) => o.id === id);
const capa = (slug, alt) =>
  `<img src="/assets/img/capas/${slug}-360.webp" srcset="/assets/img/capas/${slug}-360.webp 360w, /assets/img/capas/${slug}-720.webp 720w" sizes="160px" width="360" height="509" alt="${esc(alt)}">`;

function mostrar(html) {
  raiz.innerHTML = html;
  const foco = raiz.querySelector("h1, h2");
  if (foco) {
    foco.tabIndex = -1;
    foco.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function pergunta() {
  const q = Q[passo];
  const marcadas = respostas[q.id] || [];
  const pct = Math.round((passo / Q.length) * 100);
  mostrar(`
    <div class="quiz__tela">
      <div class="quiz__barra" role="progressbar" aria-valuemin="0" aria-valuemax="${Q.length}" aria-valuenow="${passo}" aria-label="Progresso do quiz"><span style="width:${pct}%"></span></div>
      <p class="quiz__conta">Pergunta ${passo + 1} de ${Q.length}</p>
      <h1>${esc(q.title)}</h1>
      ${q.hint ? `<p class="quiz__dica">${esc(q.hint)}</p>` : ""}
      <div class="quiz__opcoes" role="group" aria-label="${esc(q.title)}">
        ${q.options
          .map((o) => `<button type="button" class="quiz__op${marcadas.includes(o.id) ? " is-marcada" : ""}" data-op="${o.id}" aria-pressed="${marcadas.includes(o.id)}">${esc(o.label)}</button>`)
          .join("")}
      </div>
      <div class="quiz__nav">
        ${passo > 0 ? `<button type="button" class="quiz__voltar" data-voltar>← Voltar</button>` : "<span></span>"}
        ${q.multi ? `<button type="button" class="btn btn--teal" data-seguir ${marcadas.length ? "" : "disabled"}>Continuar</button>` : ""}
      </div>
    </div>`);
}

function responder(id) {
  const q = Q[passo];
  if (!comecou) {
    comecou = true;
    track("quiz_start");
  }
  if (q.multi) {
    let atual = respostas[q.id] || [];
    const o = opcao(q, id);
    if (atual.includes(id)) atual = atual.filter((x) => x !== id);
    else if (o.exclusive) atual = [id];
    else {
      atual = atual.filter((x) => !opcao(q, x).exclusive);
      if (atual.length >= q.multi) atual.shift();
      atual.push(id);
    }
    respostas[q.id] = atual;
    pergunta();
    return;
  }
  respostas[q.id] = [id];
  avancar();
}

function avancar() {
  const q = Q[passo];
  track("quiz_step", { step: passo + 1, question: q.id, answer: (respostas[q.id] || []).join(",") });
  passo += 1;
  if (passo < Q.length) pergunta();
  else resultado();
}

// ---------- Pontuação ----------
function calcular() {
  const pontos = Object.fromEntries([...Object.keys(D.products), COMBO].map((s) => [s, 0]));
  const somar = (score = {}) => {
    for (const [sku, n] of Object.entries(score)) pontos[sku] += n;
  };
  let tier = "quente";
  const areas = [];
  let bonusArea = 0;
  let nota = null;

  for (const q of Q) {
    const marcadas = respostas[q.id] || [];
    for (const id of marcadas) {
      const o = opcao(q, id);
      somar(o.score);
      if (o.area) areas.push(o.area);
      if (o.area_bonus) bonusArea += o.area_bonus;
      if (o.note) nota = o.note;
      if (o.tier === "frio") tier = "frio";
      else if (o.tier === "morno" && tier !== "frio") tier = "morno";
    }
    if (q.two_picks_score && marcadas.length >= 2) somar(q.two_picks_score);
  }
  if (bonusArea && areas.length) pontos[areas[0]] += bonusArea;

  // Melhor módulo; empate fica com a área citada primeiro, depois com a ordem do catálogo.
  const ordem = [...areas, ...Object.keys(D.products)];
  const melhor = Object.keys(D.products).reduce((a, b) =>
    pontos[b] > pontos[a] || (pontos[b] === pontos[a] && ordem.indexOf(b) < ordem.indexOf(a)) ? b : a
  );
  const principal = pontos[COMBO] >= pontos[melhor] ? COMBO : melhor;
  return { principal, melhor, tier, nota };
}

// ---------- Resultado ----------
function botaoCompra(item, rotulo, cls, rec) {
  if (!item.checkout) return "";
  const url = new URL(item.checkout);
  const conteudo = new URLSearchParams(location.search).get("utm_content");
  url.searchParams.set("utm_content", conteudo ? `${conteudo}|quiz-${rec}` : `quiz-${rec}`);
  const kind = item.sku === COMBO ? "combo" : "module";
  return `<a class="${cls}" href="${esc(url)}" data-checkout="${esc(item.sku)}" data-kind="${kind}" data-value="${item.price_cents}" data-origem="quiz" rel="noopener">${rotulo}</a>`;
}

function paginaCompleta(sku) {
  const q = new URLSearchParams(location.search);
  q.set("rec", sku);
  return `/?${q}#${sku === COMBO ? "combo" : `modulo-${sku}`}`;
}

// Modo combo (/quiz?oferta=combo): o resultado vira um diagnóstico das respostas e leva à seção do combo na página de vendas.
const MODO_COMBO = new URLSearchParams(location.search).get("oferta") === "combo";
const AREA_SKUS = { exatas: ["exatas", "formulas"], humanas: ["humanas"], biologia: ["biologia-natureza"], redacao: ["redacao"], todas: ["exatas", "humanas", "biologia-natureza", "redacao"] };
const TRAVA_SKU = { ordem: "plano", esqueco: "flashcards", formulas: "formulas", materia: "mapas", redacao: "redacao" };
const nomes = (skus) => [...new Set(skus)].map((s) => D.products[s]?.name).filter(Boolean).join(" + ");

function resultadoCombo(tier) {
  const c = D.combo;
  const resp = (id) => respostas[id] || [];
  const rotulo = (id, op) => opcao(Q.find((q) => q.id === id), op)?.label || "";
  const linhas = [];
  for (const a of resp("area")) linhas.push([rotulo("area", a), nomes(AREA_SKUS[a] || [])]);
  for (const t of resp("trava")) linhas.push([rotulo("trava", t), nomes([TRAVA_SKU[t]])]);
  const tempo = resp("tempo")[0];
  if (tempo) linhas.push([`${rotulo("tempo", tempo)} por dia até a prova`, `Plano de 14 dias com rotina de ${tempo === "6h" ? "6h" : tempo === "4h" ? "4h" : "2h"}`]);
  const aviso = D.tiers[tier];
  const capas = Object.values(D.products).map((p) => capa(p.cover, "")).join("");

  mostrar(`
    <div class="quiz__tela quiz__tela--resultado">
      <div class="quiz__barra" aria-hidden="true"><span style="width:100%"></span></div>
      <p class="etiqueta etiqueta--escura">Seu diagnóstico</p>
      <h1>O que pesa na sua revisão agora</h1>
      <p class="quiz__sub">Com base nas suas respostas. Não é previsão de nota: mostra o que revisar e em qual material está.</p>
      ${tier === "frio" && aviso ? `<div class="quiz__aviso"><p>${esc(aviso)}</p></div>` : ""}
      <ul class="diag">
        ${linhas.map(([o, m]) => `<li><span class="diag__o">${esc(o)}</span><span class="diag__m">→ ${esc(m)}</span></li>`).join("")}
      </ul>
      <div class="vantagem vantagem--clara">
        <div class="vantagem__capas" role="img" aria-label="As capas dos ${c.count} módulos do combo">${capas}</div>
        <p class="vantagem__selo">Tudo isso está no combo</p>
        <p class="vantagem__t">Os ${c.count} módulos por <strong>${c.price}</strong></p>
        <p class="vantagem__d">Cada ponto do seu diagnóstico tem o módulo certo dentro do combo. Sai a <strong>${c.per_module} por módulo</strong>, em vez de ${c.separate} separados: economia de <strong>${c.saving}</strong>.</p>
        <a class="btn btn--ouro btn--grande btn--bloco btn--pulso" href="${esc(paginaCompleta(COMBO))}" data-select="combo">Ver meu combo de revisão</a>
      </div>
      ${tier === "morno" && aviso ? `<div class="quiz__aviso"><p>${esc(aviso)}</p></div>` : ""}
      <div class="quiz__fim">
        <button type="button" class="quiz__voltar" data-refazer>Refazer o quiz</button>
      </div>
    </div>`);
}

function resultado() {
  const { principal, melhor, tier, nota } = calcular();
  if (MODO_COMBO) {
    track("quiz_complete", { lead_tier: tier, recommendation: COMBO, modo: "combo" });
    return resultadoCombo(tier);
  }
  track("quiz_complete", { lead_tier: tier, recommendation: principal });

  const c = D.combo;
  const m = D.products[melhor];
  const ehCombo = principal === COMBO;
  const aviso = D.tiers[tier];
  // Quente: a compra é a única ação principal. Morno: aviso honesto depois da oferta. Frio: aviso antes da oferta.
  const avisoHtml = aviso ? `<div class="quiz__aviso"><p>${esc(aviso)}</p></div>` : "";
  const taxa =D.fee ? `<p class="breve">${esc(D.fee)}</p>` : "";

  const cartaoPrincipal = ehCombo
    ? `<article class="quiz__rec">
        <div class="quiz__rec-capas">${capa("plano", "")}${capa("exatas", "")}</div>
        <div>
          <p class="quiz__selo">Recomendado para você</p>
          <h3>Combo Revisão Completa</h3>
          <p>Os ${c.count} módulos em uma compra: ${c.pages} páginas de revisão, com o Kit de Ação do Aluno de brinde.</p>
          <p class="quiz__preco"><s>${c.separate}</s> ${c.price} <small>economize ${c.saving}</small></p>
          ${botaoCompra(c, `Quero o combo por ${c.price}`, "btn btn--ouro btn--grande", principal)}
          ${taxa}
        </div>
      </article>`
    : `<article class="quiz__rec">
        <div class="quiz__rec-capas">${capa(m.cover, `Capa do volume ${m.volume}, ${m.name}`)}</div>
        <div>
          <p class="quiz__selo">Recomendado para você</p>
          <h3>${esc(m.name)}</h3>
          <p>${esc(m.summary)}</p>
          <ul class="fatos">${m.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <p class="quiz__preco">${m.price}</p>
          ${botaoCompra(m, `Quero este módulo por ${m.price}`, "btn btn--teal btn--grande", principal)}
          ${taxa}
        </div>
      </article>`;

  const alternativa = ehCombo
    ? `<div class="quiz__alt"><p><strong>Prefere começar por um só?</strong> Pelas suas respostas, o módulo mais útil é <em>${esc(m.name)}</em>, por ${m.price}.</p>${botaoCompra(m, `Começar por ${esc(m.name)}`, "btn btn--linha-escura", principal)}</div>`
    : `<div class="vantagem vantagem--clara"><div class="vantagem__capas" role="img" aria-label="As capas dos ${c.count} módulos do combo">${Object.values(D.products).map((p) => capa(p.cover, "")).join("")}</div><p class="vantagem__selo">Mais vantagem</p><p class="vantagem__t">${esc(m.name)} + os outros ${c.count - 1} módulos por <strong>${c.price}</strong></p><p class="vantagem__d">Sai a <strong>${c.per_module} por módulo</strong>, em vez de ${m.price}. Você economiza <strong>${c.saving}</strong> e revisa todas as áreas e a redação.</p>${botaoCompra(c, `Quero os ${c.count} por ${c.price}`, "btn btn--ouro btn--grande", principal)}</div>`;

  mostrar(`
    <div class="quiz__tela quiz__tela--resultado">
      <div class="quiz__barra" aria-hidden="true"><span style="width:100%"></span></div>
      <p class="etiqueta etiqueta--escura">Seu resultado</p>
      <h1>Por onde começar a sua revisão</h1>
      <p class="quiz__sub">Recomendação com base nas suas respostas. ${nota ? esc(nota) : ""}</p>
      ${tier === "frio" ? avisoHtml : ""}
      ${cartaoPrincipal}
      ${tier === "morno" ? avisoHtml : ""}
      ${alternativa}
      <div class="quiz__fim">
        <a href="${esc(paginaCompleta(principal))}">Ver a página completa</a>
        <button type="button" class="quiz__voltar" data-refazer>Refazer o quiz</button>
      </div>
    </div>`);
}

raiz.addEventListener("click", (e) => {
  const alvo = e.target.closest("button");
  if (!alvo) return;
  if (alvo.matches("[data-quiz-iniciar]")) pergunta();
  else if (alvo.matches("[data-op]")) responder(alvo.dataset.op);
  else if (alvo.matches("[data-seguir]")) avancar();
  else if (alvo.matches("[data-voltar]")) {
    passo -= 1;
    pergunta();
  } else if (alvo.matches("[data-refazer]")) {
    for (const k of Object.keys(respostas)) delete respostas[k];
    passo = 0;
    pergunta();
  }
});
