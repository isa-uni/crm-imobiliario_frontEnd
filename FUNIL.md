# Funil de processos — Como funciona

Documentação da lógica do funil exibido no Dashboard do CRM.

## Onde fica

- Componente: `components/FunilDashboard.tsx`
- Uso no Dashboard: `app/dashboard/page.tsx` → `<Funil leads={leads} />`
- Os leads vêm de `leadService.getAll()` (todos os leads cadastrados, sem filtro de data).

## De onde vêm os números

O CRM guarda o **status atual** de cada lead (`types/index.ts`):

```ts
export type LeadStatus =
  | 'lead'            // Leads
  | 'oportunidade'    // Ops
  | 'visita-agendada' // Agend.
  | 'visita-realizada'// Visitas
  | 'pasta'           // Pastas
  | 'aprovado'        // Aprov.
  | 'contrato'        // Vendas
  | 'descarte';       // Descartado (não entra no funil)
```

O funil **conta quantos leads existem hoje em cada status**. Não existe histórico acumulado de passagem pelas etapas — a contagem reflete o estado atual da base.

## As 7 etapas do funil,

| Índice | status            | Rótulo | Cor        | Largura da barra |
|-------:|-------------------|--------|-----------|-----------------|
| 0      | `lead`            | Leads  | azul      | 100%            |
| 1      | `oportunidade`    | Ops    | índigo    | 88%             |
| 2      | `visita-agendada` | Agend. | teal      | 76%             |
| 3      | `visita-realizada`| Visitas| verde     | 64%             |
| 4      | `pasta`           | Pastas | laranja   | 52%             |
| 5      | `aprovado`        | Aprov. | ciano     | 40%             |
| 6      | `contrato`        | Vendas | roxo      | 28%             |

Cada etapa é um trapézio criado com:

```ts
clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)"
```

Ou seja: topo com o mesmo tamanho (100%) e a base menor (95% → 5%), dando a forma afunilada.

- Largura diminui **12% por etapa**: `100 - indice * 12`.
- Barra com altura fixa `24px`, texto em branco e negrito mostrando a **quantidade** de leads naquele status.

## As conversões

O selo ao lado de cada barra mostra:

- Primeira etapa → texto `Topo`.
- Demais etapas → `Conv: X%`, calculado com a fórmula:

```
conv = Math.round((quantidade / quantidade_da_etapa_anterior) * 100)
```

### Exemplo

| Etapa      | Quantidade | Cálculo            | Selo       |
|------------|-----------:|--------------------|------------|
| Leads      |         100 | — (primeiro)       | Topo       |
| Ops        |          60 | 60 / 100 × 100     | Conv: 60%  |
| Agend.     |          45 | 45 / 60 × 100 = 75 | Conv: 75%  |
| Visitas    |          30 | 30 / 45 × 100 = 67 | Conv: 67%  |
| Vendas     |           5 | 5 / 40 × 100 = 13  | Conv: 13%  |

O `Math.round` usa o arredondamento tradicional do JS: `.5` arredonda para cima (ex.: `64.7` → `65`, `64.4` → `64`).

### Proteção contra divisão por zero

Se a etapa anterior tiver **0 leads**, a conversão não pode ser calculada. Nesse caso `conversao` recebe `null` e o selo mostra `Conv: --%` (o JS retornaria `Infinity` numa divisão por zero).

```
anterior > 0 ? Math.round((quantidade / anterior) * 100) : null
```

### Observação importante sobre o significado

Como o CRM não registra histórico de movimentação (ex.: quem era `lead` ontem e virou `oportunidade` hoje), o percentual **não é a taxa de conversão de processos ao longo do tempo** — é a proporção entre o número de leads que estão em cada status **neste momento**.

Exemplo: `Conv: 60%` entre Leads e Ops significa "de todos os leads atuais, 60% já estão em Ops (não necessariamente que 60% dos leads convertidos para Ops)".

Esse é o comportamento acordado com o usuário, que escolheu usar os **dados reais do CRM** (status atual) em vez de histórico acumulado como no arquivo original `FUNIL DIARIO - FINAL-MARCOS.html`.

## Status fora do funil

O status `descarte` **não aparece** no funil. Ele não participa de nenhuma etapa nem das conversões.

## Como validar a implementação

```bash
npm run lint
npx tsc --noEmit
```

Os erros existentes de `tsc` estão apenas em `lib/data.ts` (propriedade `historico` ausente nos mocks) — pré-existentes e fora do escopo do funil.