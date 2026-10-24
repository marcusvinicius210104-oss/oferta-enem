// Gera o site estático em dist/ a partir de config/catalogo_oferta.json.
// Uso: node scripts/build.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
// CATALOGO permite testar outro catálogo (ex.: simulação de vendas ativas) sem editar o oficial.
const cat = JSON.parse(readFileSync(process.env.CATALOGO || join(ROOT, "config/catalogo_oferta.json"), "utf8"));

// ---------- Dinheiro (sempre em centavos inteiros) ----------
const brl = (cents) => {
  if (!Number.isInteger(cents)) throw new Error(`Valor não inteiro em centavos: ${cents}`);
  const reais = Math.floor(cents / 100).toLocaleString("pt-BR");
  return `R$ ${reais},${String(cents % 100).padStart(2, "0")}`;
};
const products = cat.products;
const bySku = Object.fromEntries(products.map((p) => [p.sku, p]));
const combo = cat.combo;
const sumCents = combo.includes.reduce((t, sku) => t + bySku[sku].price_cents, 0);
const savingCents = sumCents - combo.price_cents;
const savingPct = ((savingCents / sumCents) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const totalPages = combo.includes.reduce((t, sku) => t + bySku[sku].pages, 0);

// ---------- Validação de lançamento ----------
const isHttps = (u) => typeof u === "string" && /^https:\/\/[^\s]+$/.test(u);
const erros = [];
if (products.length !== 8) erros.push("O catálogo deve ter 8 módulos.");
if (products.some((p) => p.price_cents !== 997)) erros.push("Todo módulo avulso deve custar 997 centavos.");
if (combo.price_cents !== 5990) erros.push("O combo deve custar 5990 centavos.");
if (sumCents !== 7976 || savingCents !== 1986) erros.push(`Soma/economia inesperadas: ${sumCents}/${savingCents}.`);
if (totalPages !== 223) erros.push(`Total de páginas inesperado: ${totalPages}.`);
const SELLING = cat.commerce.enabled === true;
if (SELLING) {
  for (const p of [...products, combo]) if (!isHttps(p.checkout_url)) erros.push(`checkout_url HTTPS ausente para ${p.sku}.`);
  if (!cat.seller.name) erros.push("seller.name é obrigatório para vender.");
  if (!cat.support.email && !cat.support.whatsapp) erros.push("Informe ao menos um canal de suporte.");
}
for (const u of cat.upsells) {
  if (u.enabled && !(u.materials_ready && isHttps(u.checkout_url) && SELLING))
    erros.push(`Upsell ${u.sku} habilitado sem material pronto, checkout HTTPS ou vendas ativas.`);
}
if (erros.length) {
  console.error("Build interrompido:\n- " + erros.join("\n- "));
  process.exit(1);
}
// Taxa cobrada do comprador pela plataforma: precisa ficar visível antes do clique de compra.
const feeCents = cat.commerce.buyer_fee_cents ?? 0;
const feeNote = (cls = "breve") =>
  SELLING && feeCents > 0 ? `<p class="${cls}">+ ${brl(feeCents)} de taxa de serviço da plataforma de pagamento, somada no checkout.</p>` : "";
const upsellLive = (u) => SELLING && u.enabled && u.materials_ready && isHttps(u.checkout_url);
const canBuy = (item) => SELLING && isHttps(item.checkout_url);
// Upsell em um clique da Cakto: o offer-id é o código antes do "_" no link de checkout.
const offerId = (u) => u.checkout_url.split("/").pop().split("_")[0];
const nextUrl = (u) => (u.next ? `${cat.site_url}/${u.next}` : "members_area");

// ---------- Utilidades de template ----------
// Versão pelo conteúdo: o cache longo de /assets nunca serve CSS/JS desatualizado.
const versao = (rel) => createHash("sha1").update(readFileSync(join(ROOT, "public", rel))).digest("hex").slice(0, 10);
const asset = (rel) => `/${rel}?v=${versao(rel)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const cover = (slug, alt, { eager = false, sizes = "(max-width: 640px) 45vw, 220px" } = {}) =>
  `<img src="/assets/img/capas/${slug}-360.webp" srcset="/assets/img/capas/${slug}-360.webp 360w, /assets/img/capas/${slug}-720.webp 720w" sizes="${sizes}" width="360" height="509" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const supportLine = () => {
  const c = [];
  if (cat.support.email) c.push(`e-mail <a href="mailto:${esc(cat.support.email)}">${esc(cat.support.email)}</a>`);
  if (cat.support.whatsapp) c.push(`WhatsApp ${esc(cat.support.whatsapp)}`);
  return c.length ? c.join(" ou ") : "o canal de suporte, que será publicado nesta página antes da abertura das vendas";
};
const sellerLine = () =>
  cat.seller.name
    ? `${esc(cat.seller.name)}${cat.seller.document ? `, ${esc(cat.seller.document)}` : ""}`
    : "Os dados do responsável pela venda serão publicados aqui antes da abertura das vendas.";

const ICON = {
  calc: '<path d="M5 3h14v18H5z"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12l4 4 10-10"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1M4 12h1M4 18h1"/>',
  file: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
  gift: '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
};
const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

// ---------- Blocos ----------
// Contagem regressiva real até a prova (horário de Brasília). O texto estático é o fallback sem JS.
const examDays = cat.exam.days.map((d) => `${d}T00:00:00-03:00`);
const dataCurta = (iso) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${m}`; };
const contagem = () => `
  <div class="contagem" data-contagem data-dias='${JSON.stringify(examDays)}' data-nivel="calmo">
    <div class="wrap contagem__in">
      <span class="contagem__ponto" aria-hidden="true"></span>
      <p class="contagem__txt" role="timer" aria-live="off">
        <span data-contagem-rotulo>${esc(cat.exam.name)}: ${cat.exam.days.map(dataCurta).join(" e ")}</span>
        <span class="contagem__relogio" data-contagem-relogio></span>
        <span data-contagem-sufixo></span>
      </p>
      <a class="contagem__cta" href="/#combo" data-select="combo">Comece a revisar hoje</a>
    </div>
  </div>`;

const header = () => `
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="topo">${contagem()}
  <div class="wrap topo__in">
    <a class="marca" href="/" aria-label="Intensivão Elite, página inicial">INTENSIVÃO <b>ELITE</b></a>
    <nav class="topo__nav" aria-label="Seções">
      <a href="/#modulos">Módulos</a>
      <a href="/#combo">Combo</a>
      <a href="/gratis">Diagnóstico grátis</a>
    </nav>
  </div>
</header>`;

const footer = () => `
<footer class="rodape">
  <div class="wrap rodape__in">
    <div>
      <p class="marca">INTENSIVÃO <b>ELITE</b></p>
      <p>Revisão guiada para o ENEM em PDF. Material independente, sem vínculo com o Inep ou o MEC.</p>
      <p class="rodape__mini">${sellerLine()}</p>
    </div>
    <nav aria-label="Links institucionais">
      <a href="/#faq">Perguntas frequentes</a>
      <a href="/gratis">Diagnóstico grátis</a>
      <a href="/termos">Termos de uso e reembolso</a>
      <a href="/privacidade">Privacidade</a>
    </nav>
  </div>
</footer>`;

function head({ title, description, path, noindex = false, preload }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${cat.site_url}${path}">
${noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${cat.site_url}${path}">
<meta property="og:image" content="${cat.site_url}/assets/img/capas/plano-720.webp">
<meta name="theme-color" content="#111F37">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap">
${preload ? `<link rel="preload" as="image" href="/assets/img/capas/${preload}-360.webp" imagesrcset="/assets/img/capas/${preload}-360.webp 360w, /assets/img/capas/${preload}-720.webp 720w" imagesizes="(max-width: 640px) 45vw, 220px">` : ""}
<link rel="stylesheet" href="${asset("assets/css/site.css")}">
<script type="module" src="${asset("assets/js/app.js")}"></script>
</head>`;
}

function page({ title, description, path, noindex, preload, pageType, body }) {
  return `${head({ title, description, path, noindex, preload })}
<body data-page="${pageType}">
${header()}
<main id="conteudo">
${body}
</main>
${footer()}
</body>
</html>
`;
}

// Botão de compra: só aponta para checkout com vendas ativas e URL HTTPS real.
function buyButton(item, { label, kind = "module", cls = "btn" } = {}) {
  if (canBuy(item)) {
    return `<a class="${cls}" href="${esc(item.checkout_url)}" data-checkout="${esc(item.sku)}" data-kind="${kind}" data-value="${item.price_cents}" rel="noopener">${label}</a>`;
  }
  return null;
}

function hero(v) {
  const center = v.focus ? bySku[v.focus].cover : "plano";
  const sides = ["exatas", "redacao", "humanas"].filter((s) => s !== center).slice(0, 2);
  return `
<section class="hero">
  <div class="wrap hero__in">
    <div class="hero__texto">
      <p class="etiqueta">${esc(v.eyebrow)}</p>
      <h1>${v.title}</h1>
      <p class="hero__sub">${esc(v.sub)}</p>
      <p class="hero__oferta">Módulos por <strong>${brl(997)}</strong>. Ou os oito por <strong>${brl(combo.price_cents)}</strong>.</p>
      <div class="acoes">
        <a class="btn btn--ouro" href="#combo" data-select="combo">Quero o combo de revisão</a>
        <a class="btn btn--linha" href="#modulos">Escolher meu módulo</a>
      </div>
      <ul class="selos" aria-label="Formato">
        <li>${icon("file")}Revisão em PDF</li>
        <li>${icon("check")}Pagamento único</li>
        <li>${icon("cal")}Plano de 14 dias</li>
      </ul>
      <p class="hero__gratis"><a href="/gratis">Faça o diagnóstico grátis e descubra por onde começar.</a></p>
    </div>
    <div class="hero__capas" aria-hidden="${v.focus ? "false" : "true"}">
      <div class="leque">
        <div class="leque__c leque__c--e">${cover(sides[0], "", {})}</div>
        <div class="leque__c leque__c--d">${cover(sides[1], "", {})}</div>
        <div class="leque__c leque__c--m">${cover(center, v.focus ? `Capa do volume ${bySku[v.focus].volume}, ${bySku[v.focus].name}` : "", { eager: true })}</div>
      </div>
    </div>
  </div>
</section>`;
}

const prova = () => `
<section class="secao secao--clara" aria-labelledby="t-prova">
  <div class="wrap">
    <p class="etiqueta etiqueta--escura">Estudo direcionado</p>
    <h2 id="t-prova">Direto ao que a prova cobra. Sem perder tempo com o resto.</h2>
    <p class="secao__lead">Em vez de reler o ensino médio inteiro, você revisa os fundamentos que sustentam as questões do ENEM, no formato em que elas aparecem, e sabe exatamente o que fazer em cada dia.</p>
    <div class="grade grade--4">
      <article class="card-simples">${icon("target")}<h3>Organizado como o ENEM</h3><p>As quatro áreas da prova e a redação, com a mesma lógica de leitura de texto, gráfico e situação-problema.</p></article>
      <article class="card-simples">${icon("list")}<h3>Questões no formato da prova</h3><p>Enunciados contextualizados, cinco alternativas e gabarito que explica o raciocínio, não só a letra.</p></article>
      <article class="card-simples">${icon("pen")}<h3>Redação pelas 5 competências</h3><p>Oficinas organizadas pelos critérios públicos de correção do Inep, do recorte do tema à intervenção.</p></article>
      <article class="card-simples">${icon("clock")}<h3>Cabe no seu tempo</h3><p>Plano de 14 dias com rotinas de 2h, 4h ou 6h. Você abre o PDF e já sabe o que estudar hoje.</p></article>
    </div>
    <p class="aviso">Os temas foram selecionados por sua utilidade para a revisão. O material não adivinha o que vai cair e não promete nota.</p>
  </div>
</section>`;

const necessidades = () => {
  const itens = [
    ["calc", "Travo nas contas", "Saber a fórmula e não saber quando usar.", "#modulo-exatas", "Exatas na Prática e 100 Fórmulas"],
    ["map", "Confundo os contextos", "Lembrar o fato, mas não a causa nem a consequência.", "#modulo-humanas", "Humanas com Contexto"],
    ["pen", "Travo para escrever", "Olhar para a folha e não saber por onde começar.", "#modulo-redacao", "Redação Destravada"],
    ["cal", "Preciso organizar a revisão", "Muita coisa para rever e pouco tempo.", "#modulo-plano", "Plano de Revisão e Diagnóstico"],
  ];
  return `
<section class="secao" aria-labelledby="t-nec">
  <div class="wrap">
    <h2 id="t-nec">Qual é a sua dificuldade agora?</h2>
    <p class="secao__lead">Comece pelo que mais trava você. Cada atalho leva ao módulo que trata do assunto.</p>
    <div class="grade grade--4">
      ${itens.map(([ic, t, d, href, m]) => `<a class="atalho" href="${href}">${icon(ic)}<span class="atalho__t">${t}</span><span class="atalho__d">${d}</span><span class="atalho__m">${m} →</span></a>`).join("")}
    </div>
  </div>
</section>`;
};

const demo = () => `
<section class="secao secao--clara" aria-labelledby="t-demo">
  <div class="wrap demo">
    <div>
      <p class="etiqueta etiqueta--escura">Teste agora</p>
      <h2 id="t-demo">Um exemplo do jeito que o material ensina</h2>
      <div class="flash" data-flash>
        <p class="flash__rotulo">Flashcard • Matemática</p>
        <p class="flash__q">Um preço sobe 20% e depois cai 20%. Volta ao valor inicial?</p>
        <button class="btn btn--teal" type="button" aria-expanded="false" aria-controls="flash-r">Revelar resposta</button>
        <p class="flash__r" id="flash-r" hidden><strong>Não.</strong> 1,20 × 0,80 = 0,96. O preço termina 4% abaixo do inicial.</p>
      </div>
      <p class="secao__lead">As bases das duas porcentagens são diferentes, por isso os fatores se multiplicam. É esse tipo de armadilha que a revisão desmonta: entender o raciocínio para reconhecer a situação em outra questão.</p>
    </div>
    <div class="amostras">
      <figure><a href="/assets/img/amostras/exatas-tema-01.webp" target="_blank" rel="noopener" aria-label="Ampliar: Amostra • Exatas na Prática, tema 01"><img src="/assets/img/amostras/exatas-tema-01.webp" width="760" height="1075" loading="lazy" decoding="async" alt="Amostra: página do tema 01 do volume Exatas na Prática, sobre porcentagem e variações sucessivas"></a><figcaption>Amostra • Exatas na Prática, tema 01 • toque para ampliar</figcaption></figure>
      <figure><a href="/assets/img/amostras/flashcards-01-04.webp" target="_blank" rel="noopener" aria-label="Ampliar: Amostra • 90 Flashcards, cartões 01 a 04"><img src="/assets/img/amostras/flashcards-01-04.webp" width="760" height="1075" loading="lazy" decoding="async" alt="Amostra: página com os cartões 01 a 04 do volume 90 Flashcards de Revisão"></a><figcaption>Amostra • 90 Flashcards, cartões 01 a 04 • toque para ampliar</figcaption></figure>
    </div>
  </div>
</section>`;

function moduleCard(p, focus) {
  const buy = buyButton(p, { label: `Comprar por ${brl(p.price_cents)}`, kind: "module", cls: "btn btn--teal btn--bloco" });
  return `
<article class="modulo${focus === p.sku ? " modulo--foco" : ""}" id="modulo-${p.sku}" data-sku="${p.sku}">
  <div class="modulo__capa">${cover(p.cover, `Capa do volume ${p.volume}, ${p.name}`)}</div>
  <div class="modulo__corpo">
    <p class="modulo__vol">Volume ${p.volume} • ${esc(p.scope)}</p>
    <h3>${esc(p.name)}</h3>
    <p class="modulo__resumo">${esc(p.summary)}</p>
    <ul class="fatos">${p.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
    <details data-detalhe="${p.sku}">
      <summary>O que tem dentro</summary>
      <ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
    </details>
    <div class="modulo__compra">
      <p class="preco">${brl(p.price_cents)}</p>
      ${buy ? buy + feeNote() : `<a class="btn btn--linha-escura btn--bloco" href="#combo" data-select-module="${p.sku}">Ver no combo</a><p class="breve">Compra avulsa disponível em breve.</p>`}
    </div>
  </div>
</article>`;
}

const modulos = (focus) => {
  const ordered = focus ? [bySku[focus], ...products.filter((p) => p.sku !== focus)] : products;
  return `
<section class="secao" id="modulos" aria-labelledby="t-mod">
  <div class="wrap">
    <h2 id="t-mod">Os oito módulos</h2>
    <p class="secao__lead">Cada módulo é um PDF independente por ${brl(997)}. Escolha só o que você precisa ou leve todos no combo.</p>
    <div class="modulos">${ordered.map((p) => moduleCard(p, focus)).join("")}</div>
  </div>
</section>`;
};

function comboSection() {
  const buy = buyButton(combo, { label: `Quero o combo por ${brl(combo.price_cents)}`, kind: "combo", cls: "btn btn--ouro btn--grande" });
  return `
<section class="secao secao--escura" id="combo" aria-labelledby="t-combo">
  <div class="wrap combo">
    <div class="combo__texto">
      <p class="etiqueta">Melhor custo</p>
      <h2 id="t-combo">Os oito módulos em uma compra</h2>
      <p class="combo__lead">Exatas, Humanas, Biologia e Natureza, Redação, fórmulas, flashcards, mapas e o plano de 14 dias: ${totalPages} páginas de revisão nos oito PDFs, com o Kit de Ação do Aluno de brinde.</p>
      <div class="leque leque--combo" aria-hidden="true">
        <div class="leque__c leque__c--e">${cover("exatas", "", {})}</div>
        <div class="leque__c leque__c--d">${cover("redacao", "", {})}</div>
        <div class="leque__c leque__c--m">${cover("plano", "", {})}</div>
      </div>
      <div class="combo__preco">
        <p class="combo__de">Separados: <s>${brl(sumCents)}</s></p>
        <p class="combo__por">${brl(combo.price_cents)}</p>
        <p class="combo__eco">Economize ${brl(savingCents)} (cerca de ${savingPct}%)</p>
        <p class="combo__nota">Pagamento único. O valor “separados” é a soma dos oito módulos avulsos.</p>
      </div>
      ${buy ? buy + feeNote("breve breve--claro") : `<a class="btn btn--ouro btn--grande" href="/gratis" data-select="combo">Comece pelo diagnóstico grátis</a><p class="breve breve--claro">As vendas abrem em breve.</p>`}
    </div>
    <ul class="combo__lista">
      ${combo.includes.map((sku) => `<li><span class="combo__vol">${bySku[sku].volume}</span><span>${esc(bySku[sku].name)}<small>${esc(bySku[sku].facts.join(" • "))}</small></span></li>`).join("")}
      <li class="combo__brinde"><span class="combo__vol">${icon("gift")}</span><span>${esc(cat.bonus.name)}<small>Brinde em qualquer compra</small></span></li>
    </ul>
  </div>
</section>`;
}

const brinde = () => `
<section class="secao secao--clara" aria-labelledby="t-brinde">
  <div class="wrap brinde">
    <div class="brinde__ico">${icon("gift")}</div>
    <div>
      <p class="etiqueta etiqueta--escura">Brinde em qualquer compra</p>
      <h2 id="t-brinde">${esc(cat.bonus.name)}</h2>
      <p>${esc(cat.bonus.summary)}</p>
      <p class="aviso">Acompanha a compra de qualquer módulo avulso ou do combo, sem custo adicional. É um apoio para organizar a rotina; o conteúdo de estudo está nos módulos.</p>
    </div>
  </div>
</section>`;

const gratisBox = () => `
<section class="secao" id="diagnostico" aria-labelledby="t-diag">
  <div class="wrap diag">
    <div>
      <p class="etiqueta etiqueta--escura">Grátis, sem cadastro</p>
      <h2 id="t-diag">Não sabe por onde começar? Faça o diagnóstico.</h2>
      <p>O <strong>Diagnóstico Express ENEM</strong> traz as 12 questões de fundamentos do volume 08 com gabarito comentado e indica onde revisar cada dificuldade. Leva de 25 a 35 minutos.</p>
      <p class="aviso">É uma amostra da coleção. Não prevê nota e não cobre a prova inteira.</p>
      <div class="acoes">
        <a class="btn btn--teal" href="${cat.free_sample.file}" download data-download="diagnostico">Baixar o diagnóstico grátis (PDF)</a>
        <a class="btn btn--linha-escura" href="/gratis">Saiba mais</a>
      </div>
    </div>
  </div>
</section>`;

const comoRecebe = () => `
<section class="secao secao--clara" aria-labelledby="t-como">
  <div class="wrap">
    <h2 id="t-como">Como funciona</h2>
    <ol class="passos" data-passos>
      ${[
        ["Escolha", `Um módulo avulso por ${brl(997)} ou o combo com os oito por ${brl(combo.price_cents)}.`],
        ["Pague", "Você conclui o pagamento único no checkout seguro da plataforma de pagamento."],
        ["Receba", esc(cat.delivery.summary)],
      ].map(([t, p], i) => `<li class="passo"><h3><button type="button" class="passo__btn" data-passo="${i}"><span class="passo__num">${i + 1}</span>${t}</button></h3><p>${p}</p></li>`).join("\n      ")}
    </ol>
    ${relatos()}
  </div>
</section>`;

// Relatos reais das turmas anteriores do método (ver social_proof._fonte no catálogo).
const relatos = () => {
  const sp = cat.social_proof;
  if (!sp?.testimonials?.length) return "";
  const estrelas = (n) => `<span class="relato__estrelas" role="img" aria-label="${n} de 5 estrelas">${"★".repeat(n)}</span>`;
  return `
    <div class="relatos">
      <p class="relatos__numero"><strong>+${sp.students_min}</strong> alunos já estudaram com o método Intensivão Elite</p>
      <p class="relatos__nota">Relatos de alunos das turmas anteriores do método, antes desta versão em PDF. Cada resultado depende da dedicação e do ponto de partida de cada aluno.</p>
      <div class="relatos__grade">
        ${sp.testimonials.map((t) => `<figure class="relato">
          <figcaption><strong>${esc(t.name)}</strong>${estrelas(t.stars)}<small>${esc(t.course)} • ${esc(t.school)}</small></figcaption>
          <blockquote>“${esc(t.text)}”</blockquote>
        </figure>`).join("")}
      </div>
    </div>`;
};

const FAQ = () => [
  ["O que eu recebo?", `PDFs, conforme o módulo ou o combo escolhido, e o ${cat.bonus.name} como brinde em qualquer compra.`],
  ["São aulas em vídeo?", "Não. É revisão escrita, com explicações, exemplos resolvidos e prática comentada."],
  ["O material é o que cai no ENEM?", "Ele é organizado pelas áreas da prova e pelas competências da redação, com questões no formato do exame. Os temas foram escolhidos pela utilidade na revisão; nenhum material sério consegue garantir o que vai cair."],
  ["Serve para começar do zero?", "É uma revisão de fundamentos, sem a cobertura completa do ensino médio. Ajuda mais quem já estudou e precisa organizar e fixar."],
  ["Posso usar no celular?", "Sim. É só ampliar a página conforme a necessidade. Os PDFs também podem ser impressos."],
  ["O que muda no combo?", `Ele reúne os oito módulos em uma compra: ${brl(combo.price_cents)} em vez de ${brl(sumCents)} somando os avulsos, uma economia de ${brl(savingCents)}.`],
  ["Tem correção de redação?", "Não. O módulo traz oficinas, modelos comentados, exercícios e checklist de autoavaliação, sem correção individual."],
  ["O diagnóstico prevê minha nota?", "Não. Ele indica por onde começar a revisão. Doze questões curtas não permitem estimar nota."],
  ["Como recebo?", cat.delivery.summary],
  ...(SELLING && feeCents > 0 ? [["Tem alguma taxa além do preço?", `Sim. A plataforma de pagamento soma uma taxa de serviço de ${brl(feeCents)} no checkout, que aparece no resumo do pedido antes de você pagar.`]] : []),
  ["Posso pedir reembolso?", `Sim. Você pode desistir da compra em até 7 dias, como prevê o Código de Defesa do Consumidor, mesmo que já tenha baixado o material. O pedido é feito por ${supportLine()}.`],
  ["O material é oficial?", "Não. É um material independente, sem vínculo com o Inep ou o MEC."],
];

const faq = () => `
<section class="secao" id="faq" aria-labelledby="t-faq">
  <div class="wrap faq">
    <h2 id="t-faq">Perguntas frequentes</h2>
    ${FAQ().map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${a.includes("<a ") ? a : esc(a)}</p></details>`).join("")}
  </div>
</section>`;

function landing(v) {
  return page({
    title: v.metaTitle,
    description: v.metaDesc,
    path: v.path,
    preload: v.focus ? bySku[v.focus].cover : "plano",
    pageType: "offer",
    body: [hero(v), prova(), necessidades(), demo(), modulos(v.focus), comboSection(), brinde(), gratisBox(), comoRecebe(), faq()].join("\n"),
  });
}

const simples = ({ title, description, path, noindex, pageType, html }) =>
  page({ title, description, path, noindex, pageType, body: `<section class="secao secao--texto"><div class="wrap texto">${html}</div></section>` });

// ---------- Rotas ----------
const LANDINGS = [
  {
    path: "/",
    eyebrow: "Revisão guiada para o ENEM",
    title: "Você estuda. Mas sabe <em>o que revisar agora?</em>",
    sub: "Escolha sua dificuldade e comece por um material direto ao ponto, com explicações, exemplos e prática comentada.",
    metaTitle: "Intensivão Elite | Revisão guiada para o ENEM em PDF",
    metaDesc: `Oito módulos de revisão para o ENEM em PDF: ${brl(997)} cada ou os oito por ${brl(combo.price_cents)}. Faça o diagnóstico grátis.`,
  },
  {
    path: "/exatas",
    focus: "exatas",
    eyebrow: "Revisão de Exatas para o ENEM",
    title: "Você sabe a fórmula. Mas <em>sabe quando usar?</em>",
    sub: "Matemática, Física e Química pelo raciocínio: 24 temas com exemplo resolvido e 48 questões comentadas.",
    metaTitle: "Exatas na Prática | Intensivão Elite",
    metaDesc: `Revisão de Matemática, Física e Química para o ENEM em PDF: 24 temas e 48 questões comentadas por ${brl(997)}.`,
  },
  {
    path: "/humanas",
    focus: "humanas",
    eyebrow: "Revisão de Humanas para o ENEM",
    title: "Pare de decorar <em>fatos soltos.</em>",
    sub: "História, Geografia, Filosofia e Sociologia ligadas a contexto, causa e consequência, com 32 questões comentadas.",
    metaTitle: "Humanas com Contexto | Intensivão Elite",
    metaDesc: `Revisão de História, Geografia, Filosofia e Sociologia para o ENEM em PDF: 16 temas e 32 questões comentadas por ${brl(997)}.`,
  },
  {
    path: "/redacao",
    focus: "redacao",
    eyebrow: "Redação para o ENEM",
    title: "Trava na hora <em>de começar?</em>",
    sub: "12 oficinas do recorte do tema à intervenção, dois modelos comentados, quatro propostas e exercícios de reescrita.",
    metaTitle: "Redação Destravada | Intensivão Elite",
    metaDesc: `Oficinas de redação para o ENEM em PDF, com modelos comentados e exercícios de reescrita, por ${brl(997)}.`,
  },
];

const pages = {};
for (const v of LANDINGS) pages[v.path === "/" ? "index.html" : `${v.path.slice(1)}/index.html`] = landing(v);

pages["gratis/index.html"] = page({
  title: "Diagnóstico Express ENEM grátis | Intensivão Elite",
  description: "12 questões de fundamentos com gabarito comentado para descobrir por onde começar a revisão. PDF grátis, sem cadastro.",
  path: "/gratis",
  preload: null,
  pageType: "free",
  body: `
<section class="hero hero--curto">
  <div class="wrap hero__in hero__in--uma">
    <div class="hero__texto">
      <p class="etiqueta">Amostra gratuita • sem cadastro</p>
      <h1>Diagnóstico Express <em>ENEM</em></h1>
      <p class="hero__sub">12 questões de fundamentos, gabarito comentado e um destino de revisão para cada dificuldade. Em 25 a 35 minutos você sabe por onde começar.</p>
      <div class="acoes">
        <a class="btn btn--ouro" href="${cat.free_sample.file}" download data-download="diagnostico">Baixar o PDF grátis</a>
        <a class="btn btn--linha" href="/#modulos">Ver os módulos</a>
      </div>
    </div>
  </div>
</section>
<section class="secao secao--clara">
  <div class="wrap">
    <div class="grade grade--3">
      <article class="card-simples">${icon("list")}<h3>O que tem</h3><p>5 questões de Exatas, 3 de Humanas, 2 de Biologia, 2 de Linguagens, uma tarefa curta de redação, folha de respostas e gabarito comentado. São ${cat.free_sample.pages} páginas.</p></article>
      <article class="card-simples">${icon("target")}<h3>De onde vem</h3><p>São as questões do diagnóstico de entrada do volume 08, <em>Plano de Revisão e Diagnóstico</em>, com comentários ampliados. Não são questões extras à coleção.</p></article>
      <article class="card-simples">${icon("check")}<h3>O que não faz</h3><p>Não prevê nota, não estima resultado na TRI e não cobre a prova inteira. Serve para escolher o que revisar primeiro.</p></article>
    </div>
  </div>
</section>`,
});

for (const u of cat.upsells) {
  pages[`${u.route}/index.html`] = page({
    title: `${u.name} | Intensivão Elite`,
    description: u.summary,
    path: `/${u.route}`,
    noindex: true,
    pageType: "upsell",
    body: upsellLive(u)
      ? `<section class="secao secao--texto"><div class="wrap texto">
  <p class="etiqueta etiqueta--escura">Oferta adicional opcional</p>
  <h1>${esc(u.name)}</h1>
  <p>${esc(u.summary)}</p>
  <p class="preco">${brl(u.price_cents)} <small>pagamento único, em compra separada</small></p>
  <p>Este produto é adicional e não repete o conteúdo da coleção. Recusar não altera o acesso à sua compra.</p>
  <cakto-upsell-buttons>
    <cakto-upsell-accept bg-color="#007C83" text-color="#ffffff" offer-id="${esc(offerId(u))}" offer-type="upsell" app-base-url="https://app.cakto.com.br" upsell-accept-url="${esc(nextUrl(u))}" upsell-reject-url="${esc(nextUrl(u))}">Sim, quero adicionar por ${brl(u.price_cents)}</cakto-upsell-accept>
    <cakto-upsell-reject upsell-reject-url="${esc(nextUrl(u))}">Não, obrigado</cakto-upsell-reject>
  </cakto-upsell-buttons>
  <script src="https://caktoscripts.nyc3.cdn.digitaloceanspaces.com/upsell.js"></script>
  ${feeCents > 0 ? `<p class="breve">Pode haver a taxa de serviço de ${brl(feeCents)} da plataforma de pagamento.</p>` : ""}
  <p class="breve">Chegou aqui sem ter acabado de comprar? <a href="${esc(u.checkout_url)}" data-checkout="${u.sku}" data-kind="upsell" data-value="${u.price_cents}" rel="noopener">Compre pelo checkout</a>.</p>
</div></section>`
      : `<section class="secao secao--texto"><div class="wrap texto">
  <h1>Esta oferta não está disponível</h1>
  <p>O conteúdo desta página ainda não foi liberado. Seu acesso a qualquer compra feita continua normalmente.</p>
  <div class="acoes"><a class="btn btn--teal" href="/">Voltar à página principal</a></div>
</div></section>`,
  });
}

// Quiz de qualificação (FUNIL_QUIZ.md): perguntas em config/quiz.json, produtos e preços do catálogo.
const quiz = JSON.parse(readFileSync(join(ROOT, "config/quiz.json"), "utf8"));
const quizItem = (p, extra = {}) => ({
  sku: p.sku,
  name: p.name,
  price: brl(p.price_cents),
  price_cents: p.price_cents,
  checkout: canBuy(p) ? p.checkout_url : null,
  ...extra,
});
const quizDados = {
  questions: quiz.questions,
  tiers: quiz.tiers,
  products: Object.fromEntries(products.map((p) => [p.sku, quizItem(p, { cover: p.cover, summary: p.summary, facts: p.facts, volume: p.volume })])),
  combo: quizItem(combo, { saving: brl(savingCents), separate: brl(sumCents), pages: totalPages, count: combo.includes.length }),
  fee: SELLING && feeCents > 0 ? `+ ${brl(feeCents)} de taxa de serviço da plataforma de pagamento, somada no checkout.` : null,
  diagnostic: cat.free_sample.file,
};
pages["quiz/index.html"] = page({
  title: "Quiz: por onde começar a revisão | Intensivão Elite",
  description: quiz.intro.sub,
  path: "/quiz",
  noindex: true,
  pageType: "quiz",
  body: `
<section class="secao quiz" aria-labelledby="t-quiz">
  <div class="wrap quiz__in" data-quiz>
    <div class="quiz__tela" data-quiz-intro>
      <p class="etiqueta etiqueta--escura">Quiz rápido</p>
      <h1 id="t-quiz">${esc(quiz.intro.title)}</h1>
      <p class="quiz__sub">${esc(quiz.intro.sub)}</p>
      <button type="button" class="btn btn--teal btn--grande" data-quiz-iniciar>${esc(quiz.intro.cta)}</button>
      <noscript><p>O quiz precisa de JavaScript. <a href="/#modulos">Veja todos os módulos</a>.</p></noscript>
    </div>
  </div>
</section>
<script type="application/json" id="quiz-dados">${JSON.stringify(quizDados).replace(/</g, "\\u003c")}</script>
<script type="module" src="${asset("assets/js/quiz.js")}"></script>`,
});

pages["obrigado/index.html"] = simples({
  title: "Próximos passos | Intensivão Elite",
  description: "Informações sobre o acesso aos materiais depois da compra.",
  path: "/obrigado",
  noindex: true,
  pageType: "thanks",
  html: `
  <h1>Próximos passos</h1>
  <p>Esta página não confirma pagamentos. A confirmação vem da plataforma de pagamento.</p>
  <h2>Se o seu pagamento foi aprovado</h2>
  <p>${esc(cat.delivery.summary)} Confira também as pastas de spam e promoções.</p>
  <h2>Se o pagamento ainda está em análise ou pendente</h2>
  <p>O acesso é liberado somente depois da confirmação. Acompanhe pelo e-mail da plataforma de pagamento.</p>
  <h2>Precisa de ajuda?</h2>
  <p>Fale conosco por ${supportLine()}.</p>
  <h2>Enquanto isso</h2>
  <p>Se ainda não fez, baixe o <a href="${cat.free_sample.file}" download data-download="diagnostico">Diagnóstico Express</a> para escolher por onde começar.</p>
  <div class="acoes"><a class="btn btn--teal" href="/">Voltar à página principal</a></div>`,
});

pages["termos/index.html"] = simples({
  title: "Termos de uso e reembolso | Intensivão Elite",
  description: "Condições de compra, entrega e reembolso dos materiais Intensivão Elite.",
  path: "/termos",
  pageType: "legal",
  html: `
  <h1>Termos de uso e reembolso</h1>
  <h2>Responsável</h2>
  <p>${sellerLine()}</p>
  <h2>O que é vendido</h2>
  <p>Materiais digitais de revisão para o ENEM em PDF: oito módulos avulsos de ${brl(997)} cada e o combo com os oito por ${brl(combo.price_cents)}, em pagamento único. O ${esc(cat.bonus.name)} acompanha qualquer compra, sem custo adicional. Não há aulas em vídeo, correção individual de redação nem assinatura.</p>
  <h2>Material independente</h2>
  <p>O conteúdo é independente e não tem vínculo com o Inep ou o MEC. Ele não garante nota, aprovação nem os temas da prova.</p>
  <h2>Pagamento e entrega</h2>
  <p>O pagamento é processado pela plataforma de pagamento, que segue os próprios termos. ${esc(cat.delivery.summary)}</p>
  <h2>Direito de arrependimento e reembolso</h2>
  <p>Você pode desistir da compra em até 7 dias contados da compra ou do recebimento do acesso, conforme o art. 49 do Código de Defesa do Consumidor. O reembolso vale mesmo que você já tenha baixado os arquivos. Peça por ${supportLine()}.</p>
  <h2>Uso do material</h2>
  <p>Os PDFs são para uso pessoal de estudo. Não é permitido revender, redistribuir ou publicar os arquivos.</p>
  <h2>Contato</h2>
  <p>${supportLine()[0].toUpperCase() + supportLine().slice(1)}.</p>`,
});

pages["privacidade/index.html"] = simples({
  title: "Privacidade | Intensivão Elite",
  description: "Como esta página trata dados de visitantes.",
  path: "/privacidade",
  pageType: "legal",
  html: `
  <h1>Privacidade</h1>
  <h2>Responsável</h2>
  <p>${sellerLine()}</p>
  <h2>O que esta página coleta</h2>
  <p>Esta página não tem formulário, não pede cadastro e não guarda dados pessoais. O diagnóstico grátis é baixado sem informar e-mail.</p>
  <h2>Serviços de terceiros</h2>
  <ul>
    <li><strong>Hospedagem:</strong> o provedor de hospedagem registra dados técnicos de acesso, como endereço IP e navegador, para operar e proteger o site.</li>
    <li><strong>Fontes:</strong> as fontes do texto são carregadas do Google Fonts, que recebe dados técnicos da requisição.</li>
    <li><strong>Pagamento:</strong> ao clicar em comprar, você vai para o checkout da plataforma de pagamento. Os dados informados lá são tratados por ela, conforme a política de privacidade dela, e por nós apenas para entregar o produto e prestar suporte.</li>
  </ul>
  <h2>Seus direitos</h2>
  <p>Você pode pedir informações, correção ou exclusão dos seus dados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), por ${supportLine()}.</p>`,
});

pages["404.html"] = simples({
  title: "Página não encontrada | Intensivão Elite",
  description: "Página não encontrada.",
  path: "/404",
  noindex: true,
  pageType: "404",
  html: `<h1>Página não encontrada</h1><p>O endereço pode ter mudado.</p><div class="acoes"><a class="btn btn--teal" href="/">Ir para a página principal</a></div>`,
});

// ---------- Saída ----------
rmSync(DIST, { recursive: true, force: true });
cpSync(join(ROOT, "public"), DIST, { recursive: true });
for (const [file, html] of Object.entries(pages)) {
  mkdirSync(dirname(join(DIST, file)), { recursive: true });
  writeFileSync(join(DIST, file), html);
}
// Proteção: nenhum PDF fora da amostra gratuita pode ir para dist/.
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pdfs = walk(DIST).filter((f) => f.toLowerCase().endsWith(".pdf"));
const proibidos = pdfs.filter((f) => !f.endsWith(cat.free_sample.file));
if (proibidos.length) {
  console.error("PDF não autorizado em dist/:", proibidos);
  process.exit(1);
}
if (!existsSync(join(DIST, cat.free_sample.file))) {
  console.error("Amostra gratuita ausente: rode scripts/gerar-pdfs.sh");
  process.exit(1);
}

console.log(`OK: ${Object.keys(pages).length} páginas em dist/ • vendas ${SELLING ? "ATIVAS" : "desligadas"} • combo ${brl(combo.price_cents)} (separados ${brl(sumCents)}, economia ${brl(savingCents)} ≈ ${savingPct}%)`);
