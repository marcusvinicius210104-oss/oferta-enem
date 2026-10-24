# Campanhas no Meta Ads: estrutura e passo a passo

Orçamento: **R$ 100 por dia**. Janela: de hoje (24/10) até a prova (8 e 15/11), cerca de 15 dias.
Textos dos anúncios: `ANUNCIOS.md`. Artes: os criativos aprovados (A2, A3, B1, B2, B3; A1 e A4 quando ficarem prontos).

## Visão geral

| | Campanha A: direta | Campanha B: quiz |
|---|---|---|
| Nome | `IE-direto` | `IE-quiz` |
| Objetivo | Vendas | Leads |
| Evento de otimização | Purchase (pixel da Cakto) | Lead (quiz concluído por lead quente) |
| Orçamento | **R$ 60/dia** (no nível da campanha) | **R$ 40/dia** (no nível da campanha) |
| Conjuntos | 1 conjunto, público aberto | 1 conjunto, público aberto |
| Anúncios | A2 Exatas, A3 Redação (+ A1 e A4 depois) | B1 Celular, B2 Tempo, B3 Áreas |
| Destino | `/`, `/exatas`, `/redacao` | `/quiz` |

**Por que assim:** com R$ 100 por dia, dividir em muitos públicos espalha a verba e nenhum conjunto aprende. Um conjunto aberto por campanha deixa o Meta achar o público, e os criativos fazem a segmentação.

**Por que a A recebe mais:** ela otimiza direto para compra, que é o que paga a conta. A B serve para testar se o quiz traz compra mais barata.

## Antes de começar (5 minutos)

1. **Portfólio certo:** a conta de anúncios, a página do Facebook, o Instagram novo e o Pixel `1476266471090724` precisam estar no **mesmo portfólio empresarial**. Na tela do Gerenciador de Eventos aparecia "Flash Store"; confira se é o portfólio que vai pagar os anúncios.
2. **Instagram ligado:** Configurações do Negócio → Contas → Contas do Instagram → o perfil novo, com acesso dado à conta de anúncios.
3. **Pixel ligado à conta de anúncios:** Configurações do Negócio → Fontes de dados → Conjuntos de dados → o Pixel → Contas de anúncios conectadas → adicionar a sua.
4. **Forma de pagamento** cadastrada na conta de anúncios (você faz).
5. **Perfil do Instagram** com foto, bio ("Revisão para o ENEM 2026 em PDF • Faça o quiz") e link para o `/quiz`, e pelo menos 3 posts (pode usar os criativos). Perfil vazio derruba a confiança de quem clica no nome.

## Campanha A: `IE-direto`

**Nível da campanha**
1. Gerenciador de Anúncios → **+ Criar** → **Vendas** → **Campanha manual de vendas** (ou Advantage+, se for a única opção; as configurações abaixo valem para as duas).
2. Nome: `IE-direto`.
3. **Orçamento da campanha (Advantage):** ligado, **R$ 60,00 diário**. Estratégia: **maior volume** (sem limite de custo).

**Nível do conjunto**
1. Nome: `IE-direto | BR | aberto`.
2. **Local da conversão:** Site. **Conjunto de dados:** o Pixel `1476266471090724`. **Evento:** **Compra (Purchase)**.
3. **Atribuição:** 7 dias após o clique ou 1 dia após a visualização (padrão).
4. **Público:** Brasil. Público Advantage+ ligado, com sugestão de idade **18 a 34**. Sem interesses.
   - Não direcione para menores de 18: o Meta limita anúncios para adolescentes, e quem paga costuma ser maior de idade.
5. **Posicionamentos:** Advantage+ (automático).
6. Início: hoje. Sem data de término (você pausa no fim).

**Nível do anúncio** (repita para cada criativo)
1. Nome: `A2-exatas`, `A3-redacao` e depois `A1-combo` e `A4-prova`.
2. **Identidade:** página do Facebook + **o Instagram novo**.
3. **Formato:** imagem única. Envie a arte 4:5 e, em "personalizar por posicionamento", a 9:16 para Stories e Reels, quando tiver.
4. Texto principal, título, descrição e botão: copie de `ANUNCIOS.md`.
5. **URL do site:**
   - A2 → `https://intensivao-elite-ten.vercel.app/exatas`
   - A3 → `https://intensivao-elite-ten.vercel.app/redacao`
   - A1 e A4 → `https://intensivao-elite-ten.vercel.app/`
6. **Parâmetros de URL:**
   ```
   utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
   ```
7. **Aprimoramentos de criativo Advantage+:** desligue os que **alteram texto ou imagem** ("variações de texto", "sobreposições de texto", "gerar fundo", "expandir imagem", "música"). Eles podem criar frases que prometem resultado ou distorcer as capas. Ajustes de brilho e contraste podem ficar.
8. **Rastreamento:** confira se o conjunto de dados é o Pixel `1476266471090724`.

## Campanha B: `IE-quiz`

**Nível da campanha**
1. **+ Criar** → **Leads** → manual. Nome: `IE-quiz`.
2. Orçamento da campanha: **R$ 40,00 diário**, maior volume.

**Nível do conjunto**
1. Nome: `IE-quiz | BR | aberto`.
2. **Local da conversão:** Site. **Conjunto de dados:** o mesmo Pixel. **Evento:** **Lead**.
3. Público, idade e posicionamentos iguais aos da campanha A.

**Nível do anúncio**
1. Nomes: `B1-celular`, `B2-tempo`, `B3-areas`.
2. URL do site em todos: `https://intensivao-elite-ten.vercel.app/quiz`.
3. Mesmos parâmetros de URL e os mesmos aprimoramentos desligados.

## Antes de publicar

- Em **Visualização**, confira o texto, a arte e o link de cada anúncio.
- Clique no link de um anúncio pela prévia e confira se a URL chega com `utm_source=meta`.
- Abra o Gerenciador de Eventos → **Testar eventos** e faça o caminho do quiz uma vez.
- Publique. A revisão do Meta leva de minutos a 24 horas.

## Como acompanhar (rotina diária, 10 minutos)

**Dias 1 a 3: não mexa.** É a fase de aprendizado; mudar orçamento ou anúncio reinicia o aprendizado. A única exceção:
- Anúncio que gastou **R$ 25 ou mais** sem nenhum **CliqueCheckout** (site) nem **InitiateCheckout** (Cakto): pause esse anúncio.

**Colunas que valem a pena no Gerenciador** (Colunas → Personalizar): Valor usado, CPM, CTR (link), Custo por clique no link, Lead, CliqueCheckout, Finalizações de compra iniciadas, Compras, Custo por compra.

**Fonte da verdade das vendas: a Cakto**, não o Meta. O Meta conta "Purchase" já quando o Pix é gerado, então vai mostrar mais compras do que as pagas. Na Cakto, filtre as vendas por `utm_campaign` e `utm_content`.

**Dia 4: primeira decisão**
- Calcule o **custo por venda paga** de cada campanha: gasto no Meta ÷ vendas pagas na Cakto com aquela `utm_campaign`.
- **Ticket médio:** faturamento da Cakto ÷ número de pedidos (inclui combo e upsells).
- Campanha com custo por venda **abaixo do ticket médio**: está pagando a si mesma. Suba o orçamento em até **20% por dia**.
- Campanha com custo por venda **acima do ticket médio** por 2 dias seguidos: passe a verba dela para a outra (por exemplo, 70/30).
- Na campanha A, se houver menos de 3 compras em 3 dias, mude o evento do conjunto para **Finalizações de compra iniciadas (InitiateCheckout)**, que tem mais volume. Isso aprende mais rápido, mesmo otimizando para um passo antes da compra.

**Anúncios:** a cada 3 ou 4 dias, pause o pior de cada campanha (maior custo por CliqueCheckout) e coloque um novo (A1, A4, vídeo do quiz).

## Calendário até a prova

| Período | O que fazer |
|---|---|
| 24 a 27/10 | Aprendizado. Não mexer, exceto pela regra dos R$ 25. |
| 28/10 a 1/11 | Decidir a divisão da verba. Entrar com A1, A4 e os vídeos. |
| 2 a 7/11 | Reta final: trocar "Faltam 15 dias" pela contagem real nos textos ("Faltam 6 dias"). Dar mais peso ao **Plano de 14 dias** e ao combo. |
| 8/11 | Primeiro dia de prova. Pausar ou baixar a verba nesse dia. |
| 9 a 14/11 | Segundo dia (Natureza e Matemática): anúncio de Exatas, Biologia e Fórmulas com "Faltam X dias para o 2º dia". |
| 15/11 | Pausar tudo. |

## Fase 2 (depois do dia 4, se sobrar verba)

- **Remarketing (R$ 10 a 15 por dia, tirados da campanha que estiver pior):** público personalizado do Pixel, com quem visitou o site ou concluiu o quiz nos últimos 7 dias e não comprou. Anúncio direto para o combo, com a contagem de dias.
- **Público semelhante:** a partir de compradores, quando houver mais de 50 vendas.
