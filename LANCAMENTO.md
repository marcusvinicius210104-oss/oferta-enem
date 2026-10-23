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

- Vendas **desligadas** (`commerce.enabled: false`). Os botões levam ao combo e ao diagnóstico grátis; não há checkout simulado.
- Upsells desativados: as rotas existem, mas só mostram "oferta não disponível", sem preço nem botão de pagamento.
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

Continuam desligados até que os PDFs sejam produzidos e a entrega e o checkout estejam configurados na Kiwify. Para ligar um upsell: `materials_ready: true`, `checkout_url` HTTPS e `enabled: true`, com vendas ativas.

## Estado da Cakto (23/10/2026)

- 9 produtos criados e ativos, com links de checkout em `config/catalogo_oferta.json` e IDs em `config/produtos_cakto.json`.
- A Cakto soma R$ 0,99 de taxa de serviço paga pelo comprador; o site mostra o aviso quando as vendas são ligadas.
- Áreas de membros prontas: Combo, Exatas, Humanas, Biologia e Natureza, Redação.
- Áreas de membros pendentes: 100 Fórmulas, 90 Flashcards, 28 Mapas, Plano de Revisão. Seguir o mesmo formato: seção "Seu material" com os módulos "Como usar seu material" (guia + Diagnóstico + Kit) e o volume (aula + PDF).
- Imagens prontas em `privado/cakto/` e PDFs em `privado/colecao/PDFs/`.

## Pendências que impedem a venda

- [ ] 9 links de checkout da Kiwify (8 módulos e o combo)
- [ ] Entrega configurada na Kiwify: PDFs de cada produto e Kit de Ação em todos
- [ ] Nome do responsável pela venda (e CPF/CNPJ, se for exibir)
- [ ] Canal de suporte (e-mail e/ou WhatsApp)
- [ ] Domínio final (hoje é `https://intensivao-elite-ten.vercel.app`, projeto `intensivao-elite` na Vercel; para um domínio próprio, adicione-o no painel e atualize `site_url`)
- [ ] Revisão humana do Diagnóstico Express e do Kit de Ação antes de publicar
- [ ] Upsells: produzir os dois PDFs (ver prompt 04)
