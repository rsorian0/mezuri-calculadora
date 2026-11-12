# Calculadora de preços — mezuri

Ferramenta interna para simular preço, custo e margem do mezuri e gerar a proposta em PDF para o cliente.

Mesma base da landing (mezuri-lp): React + Vite, sem bibliotecas de UI, todo o CSS em `src/index.css` com tokens em `:root`.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (base relativa: abre em qualquer pasta ou subcaminho)
npm run preview  # serve o build
```

## Estrutura

```
src/
├── App.jsx                  # estado dos parâmetros
├── components/
│   ├── Hero.jsx             # topo com logo
│   ├── Params.jsx           # parâmetros editáveis
│   ├── PlanView.jsx         # projeção individual por plano + comparativo
│   ├── Proposal.jsx         # dados do cliente e geração do PDF
│   ├── Breakdown.jsx        # KPI, linhas, barra de receita
│   ├── Fields.jsx           # campos de formulário
│   ├── Footer.jsx           # "Um produto Kunlatek"
│   └── icons/               # logos mezuri e Kunlatek (SVG inline)
└── lib/
    ├── calc.js              # valores padrão e fórmulas
    └── proposalPdf.js       # monta o PDF com jsPDF (carregado sob demanda)
```

## Premissas (estudo de 03/10/2026)

- Plano: R$ 179/mês, até 4 usuários e 50 GB
- Usuário extra: R$ 20/mês (decidido em 12/11/2026)
- GB extra: preço por GB definido direto nos parâmetros (padrão US$ 0,036 por GB/mês, convertido pelo câmbio); o custo do GB (US$ 0,60 ÷ 50 GB × câmbio) aparece como referência
- Custo fixo: domínio R$ 3 + servidor R$ 42 + e-mail R$ 112 = R$ 157/mês
- Taxa de pagamento por forma (tabela do link de pagamento do Mercado Pago): cartão 3,99% (30 dias), 4,48% (14 dias), 4,98% (na hora), Pix 0,99% e boleto R$ 3,99 fixo. A forma é escolhida na proposta e alimenta o cálculo do lucro
- Desconto do plano anual: 15% (editável)
- Impostos por venda: ISS 2%, PIS 0,65% e COFINS 3% (total 5,65%)
- Percentual da cooperativa sobre a venda: parâmetro próprio, padrão 0% até ser definido
- Publicação: GitHub Pages pelo workflow `.github/workflows/deploy.yml` (a cada push na `main`)

O PDF mostra ao cliente só preço e condições, nunca custos ou margem.

## Parâmetros salvos

"Salvar parâmetros" grava os valores no navegador (localStorage, chave `mezuri-calculadora-params`). Cada navegador/máquina tem o seu. Usuários e GB extras são da proposta e não são salvos. "Restaurar valores do estudo" apaga o salvo.

## Plano anual

Na seção "Gerar proposta para o cliente", escolha se o PDF mostra só o mensal, só o anual ou os dois lado a lado. Com o anual, aparece o campo "Desconto no plano anual" (padrão 15%), que reduz a mensalidade no contrato de 12 meses. A projeção de lucro no topo usa sempre o preço mensal.
