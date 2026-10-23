# Regras para quem mexer neste projeto

- Preços, links e flags vivem só em `config/catalogo_oferta.json`, em centavos inteiros. Não espalhe valores pelo código.
- Nunca coloque PDFs pagos, o Kit de Ação ou o ZIP da coleção em `public/`, `dist/` ou no git. `privado/` é ignorado pelo git e o build falha se aparecer PDF não autorizado.
- Não invente links de checkout, vendedor, CNPJ, depoimentos, contadores ou prazos de entrega. Campos vazios ficam `null`.
- Não prometa nota, aprovação ou "o que vai cair". Pode dizer: organizado pelas áreas do ENEM, competências da redação, formato de questão, plano de 14 dias.
- `purchase` nunca é disparado pelo site; só a plataforma (Kiwify) confirma compra.
- Upsells só aparecem com `enabled`, `materials_ready` e `checkout_url` HTTPS, e com vendas ativas.
- Depois de editar: `npm run build` e conferir as rotas com `npm run preview`.
