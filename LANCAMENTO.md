# Intensivão Elite: landing de vendas

Site estático (HTML, CSS e JS sem dependências) gerado por `scripts/build.mjs` a partir de `config/catalogo_oferta.json`. Publicado pela Vercel, que roda o build e serve `dist/`.

## Comandos

```bash
npm run build      # gera dist/ e valida o catálogo
npm run preview    # build + prévia em http://localhost:4321
npm run pdfs       # regenera os PDFs gratuitos (precisa do Google Chrome)
```

## Estrutura

| Caminho | O que é |
|---|---|
| `config/catalogo_oferta.json` | Produtos, preços em centavos, links de checkout, vendedor, suporte, upsells |
| `scripts/build.mjs` | Gera todas as rotas e bloqueia o build se a configuração de venda estiver incompleta |
| `public/` | Arquivos públicos: CSS, JS, capas WebP, amostras e o PDF do diagnóstico grátis |
| `materiais-fonte/` | HTML e CSS de origem do Diagnóstico Express |
| `privado/` | **Fora do git.** Kit de Ação do Aluno (PDF e fonte). Enviar só pela Kiwify |

Rotas: `/`, `/exatas`, `/humanas`, `/redacao`, `/gratis`, `/obrigado`, `/termos`, `/privacidade`, `/oferta-extra-1`, `/oferta-extra-2` (desativadas) e 404.

## Estado atual

- Vendas **ativas** desde 24/10/2026 (`commerce.enabled: true`), com checkouts da Cakto. Compra de teste por Pix feita e reembolsada.
- Upsells ativos em `/oferta-extra-1` e `/oferta-extra-2`, configurados como página pós-compra nos 9 produtos principais.
- O único PDF público é `downloads/diagnostico-express-enem.pdf`. O build falha se outro PDF entrar em `dist/`.

## Como abrir as vendas (Kiwify)

1. Na Kiwify, crie 9 produtos e anexe os PDFs pela entrega da própria plataforma:
   - 8 módulos a **R$ 9,97**, cada um com o seu PDF e com o Kit de Ação do Aluno (`privado/kit-acao-do-aluno.pdf`);
   - 1 combo a **R$ 59,90**, com os 8 PDFs e o Kit de Ação.
2. Configure a garantia de 7 dias e o e-mail de suporte nos produtos.
3. Se quiser, configure `https://SEU-DOMINIO/obrigado` como página de obrigado. Ela não confirma pagamento por conta própria.
4. Preencha em `config/catalogo_oferta.json`:
   - `checkout_url` de cada um dos 8 produtos e do combo (links `https://pay.kiwify.com.br/...`);
   - `seller.name` (e `seller.document`, se for exibir);
   - `support.email` e/ou `support.whatsapp`;
   - `site_url`, se o domínio mudar.
5. Mude `commerce.enabled` para `true` e rode `npm run build`. O build recusa a configuração se faltar algum link HTTPS, o vendedor ou o suporte.
6. Teste cada botão: o destino deve mostrar o produto certo e o preço certo. Faça uma compra de teste, peça o reembolso e confira se a entrega traz só os arquivos comprados e o brinde.

## Medição

`assets/js/app.js` envia para `window.dataLayer` os eventos `view_offer`, `select_module`, `select_combo`, `download_diagnostic` e `begin_checkout`. O `begin_checkout` só dispara ao clicar num link real de checkout. Não há `purchase` no site: a confirmação de compra deve vir da Kiwify (pixel ou webhook configurado na plataforma). As UTMs da visita são repassadas ao link de checkout.

## Upsells (Treino Extra R$ 19,90 e Oficina Extra R$ 29,90)

Produtos, áreas de membros e checkouts prontos na Cakto (`materials_ready: true`). As páginas usam o botão de compra em um clique da Cakto (`cakto-upsell-accept`), com o `offer-id` tirado do `checkout_url`.

Fluxo: compra → `/oferta-extra-1` (Treino) → `/oferta-extra-2` (Oficina) → área de membros. O e-mail de acesso da compra principal sai na hora do pagamento, sem esperar o upsell.

Para ligar, depois de `commerce.enabled: true`:
1. `enabled: true` nos dois upsells, build e deploy.
2. Na Cakto, em cada um dos 9 produtos principais: Upsell e Downsell → marcar "Esse produto tem uma página de obrigado personalizada ou upsell" → URL `https://intensivao-elite-ten.vercel.app/oferta-extra-1` → Salvar. Manter "Enviar imediatamente após o pagamento".

Não aponte a Cakto para `/oferta-extra-1` antes do deploy: com o upsell desligado a página mostra "oferta não disponível".

## Estado da Cakto (24/10/2026)

- 11 produtos ativos: 8 módulos, o combo e os 2 extras. Links em `config/catalogo_oferta.json`; IDs em `config/produtos_cakto.json`.
- A Cakto soma R$ 0,99 de taxa de serviço paga pelo comprador; o site mostra o aviso quando as vendas são ligadas.
- As 11 áreas de membros estão montadas: seção "Seu material", módulo com capa, aula com o PDF em "Materiais extras" e título no topo.
- Imagens em `privado/cakto/`, PDFs em `privado/colecao/PDFs/` e `privado/extras/`.

## Pendências que impedem a venda

- [x] 9 links de checkout da Cakto (8 módulos e o combo)
- [x] Entrega configurada na Cakto: PDFs de cada produto e Kit de Ação em todos
- [x] Nome do responsável pela venda (Intensivão Elite; CPF/CNPJ ainda não exibido)
- [x] Canal de suporte (`eliteeduc@gmail.com`)
- [x] Compra de teste (Pix num módulo de R$ 9,97, conferir o e-mail e a área de membros, pedir reembolso)
- [ ] Domínio final (hoje é `https://intensivao-elite-ten.vercel.app`, projeto `intensivao-elite` na Vercel; para um domínio próprio, adicione-o no painel e atualize `site_url`)
- [ ] Revisão humana do Diagnóstico Express e do Kit de Ação antes de publicar
- [x] Upsells: PDFs produzidos e conferidos, produtos criados na Cakto
