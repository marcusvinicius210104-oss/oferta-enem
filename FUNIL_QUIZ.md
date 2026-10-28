# Funil com quiz de qualificação

Duas campanhas rodando juntas, para comparar qual traz compra mais barata.

```
Campanha A (direta)   anúncio ──► /  (página de vendas) ──► checkout ──► upsells
Campanha B (quiz)     anúncio ──► /quiz ──► resultado ──► checkout ──► upsells
                                              └──► página de vendas focada (/?rec=…)
```

| | Campanha A | Campanha B |
|---|---|---|
| Destino do anúncio | `/?utm_source=meta&utm_campaign=direto` | `/quiz?utm_source=meta&utm_campaign=quiz` |
| Para quem funciona | Quem já sabe que quer revisar | Quem está em dúvida sobre por onde começar |
| O que medir | Custo por compra, taxa de clique no checkout | O mesmo, mais a conclusão do quiz e o perfil de quem compra |

As UTMs já são repassadas ao checkout da Cakto, então o relatório de vendas da Cakto separa as duas campanhas. O quiz acrescenta `utm_content=quiz-<recomendação>`.

## Como o quiz funciona

- Rota `/quiz`, no mesmo site e domínio. Fica fora do Google (`noindex`), porque só recebe tráfego de anúncio.
- Uma pergunta por tela, com barra de progresso e botão de voltar. São 7 perguntas, cerca de 1 minuto.
- Funciona sem servidor: as respostas ficam no navegador, e o resultado é calculado na hora.
- **Sem captura de contato na primeira versão.** Pedir e-mail ou WhatsApp exige um serviço para guardar os dados e um aviso de LGPD. Isso pode entrar numa segunda versão.
- O texto não promete nota nem aprovação. O resultado é "recomendação com base nas suas respostas".

## As 7 perguntas

| # | Pergunta | Opções | Para que serve |
|---|---|---|---|
| 1 | Qual ENEM você vai fazer? | ENEM 2026 (8 e 15/11) · Ainda não sei / ano que vem | Qualificação: prazo |
| 2 | Em que ponto você está? | Já estudei quase tudo e preciso revisar · Estudei partes e tenho lacunas · Estou começando agora | Qualificação: o material é revisão, não curso do zero |
| 3 | Qual área mais preocupa você? (até 2) | Matemática, Física e Química · História, Geografia, Filosofia e Sociologia · Biologia e leitura · Redação · Todas um pouco | Escolhe o módulo de área |
| 4 | O que mais atrapalha você hoje? | Não sei o que revisar primeiro · Esqueço o que estudei · Confundo fórmulas · Me perco em matéria grande · Travo na redação | Escolhe o módulo de ferramenta |
| 5 | Quanto tempo por dia você tem até a prova? | Menos de 2h · Cerca de 2h · Cerca de 4h · 6h ou mais | Personaliza o texto do resultado (rotinas do plano) |
| 6 | Como você prefere revisar? | Explicação com questões comentadas · Cartões de pergunta e resposta · Mapas e resumos visuais · Lista de fórmulas | Desempate entre módulos |
| 7 | O que faz mais sentido agora? | Focar no meu ponto mais fraco · Revisar tudo de forma organizada | Decide entre módulo e combo |

## Como sai a recomendação

Cada resposta soma pontos para os produtos:

- **Área (P3):** Exatas → `exatas` +3; Humanas → `humanas` +3; Biologia e leitura → `biologia-natureza` +3; Redação → `redacao` +3; Todas → `combo` +3.
- **Dificuldade (P4):** não sei o que revisar → `plano` +2; esqueço → `flashcards` +2; fórmulas → `formulas` +2; matéria grande → `mapas` +2; redação → `redacao` +2.
- **Formato (P6):** questões → módulo de área mais pontuado +1; cartões → `flashcards` +1; mapas → `mapas` +1; fórmulas → `formulas` +1.
- **Combo:** +3 se marcou "revisar tudo" (P7), +2 se marcou 2 áreas ou "todas", +1 com 4h ou mais por dia.

Resultado:

- **Combo vence** (pontos do combo ≥ do melhor módulo): o principal é o combo por R$ 59,90, com a economia de R$ 19,86. A alternativa é o módulo mais pontuado por R$ 9,97.
- **Módulo vence:** o principal é o módulo por R$ 9,97. Como próximo passo, aparece o combo ("leve os oito e economize R$ 19,86").
- **Sempre:** o botão "ver a página completa", que leva a `/?rec=<sku>`.

## Nível do lead (para os anúncios)

| Nível | Regra | O que o resultado mostra |
|---|---|---|
| Quente | ENEM 2026 e "preciso revisar" ou "tenho lacunas" | Oferta direta, com botão de checkout |
| Morno | ENEM 2026 e "começando agora" | Oferta primeiro, depois o aviso honesto de que é revisão de fundamentos (sem PDF grátis desde 27/10) |
| Frio | Não é o ENEM 2026 | Aviso de que o material é para a reta final, depois a oferta (sem PDF grátis desde 27/10) |

O nível vai no evento `quiz_complete`. Com o Pixel instalado, dá para otimizar a campanha B para quem termina o quiz como "quente".

## Eventos de medição (`dataLayer`)

| Evento | Quando | Dados |
|---|---|---|
| `quiz_start` | Primeira resposta | — |
| `quiz_step` | Cada resposta | `step`, `answer` |
| `quiz_complete` | Tela de resultado | `lead_tier`, `recommendation` |
| `select_combo` / `select_module` / `begin_checkout` | Clique no resultado | Os mesmos do site, com `origem: quiz` |

## O que falta para rodar as campanhas

- [x] **Pixel do Meta** `1476266471090724` instalado no site (ID em `tracking` no catálogo). Eventos: PageView, ViewContent, QuizStart, QuizComplete, Lead (quiz quente), DownloadDiagnostico, CliqueCheckout.
- [x] Pixel `1476266471090724` nos 11 produtos da Cakto (Configurar Pixel). Padrão da Cakto mantido: "Purchase" também ao gerar Pix ou boleto.
- [x] `/quiz` construído e publicado.
- [x] Textos dos anúncios das duas campanhas em `ANUNCIOS.md` (criativos ainda a produzir).
