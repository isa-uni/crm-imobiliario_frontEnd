# 🎯 Guia de Desenvolvimento - Próximos Passos

## 🚀 Como Expandir o Projeto

### 1. Adicionar Busca de Leads (Fácil - 1 hora)

**O que fazer:**
- Adicionar campo de input no topo da lista
- Filtrar leads por nome, telefone ou email

**Código sugerido:**
```typescript
const [searchTerm, setSearchTerm] = useState('');

const filteredLeads = leads.filter(lead => 
  lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
  lead.telefone.includes(searchTerm) ||
  lead.email.toLowerCase().includes(searchTerm.toLowerCase())
);
```

---

### 2. Adicionar Ordenação (Fácil - 1-2 horas)

**O que fazer:**
- Botões para ordenar por: data, valor, nome
- Ordem crescente/decrescente

**Código sugerido:**
```typescript
const [sortBy, setSortBy] = useState<'data' | 'valor' | 'nome'>('data');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

const sortedLeads = [...filteredLeads].sort((a, b) => {
  if (sortBy === 'data') {
    return sortOrder === 'asc' 
      ? a.dataAtualizacao.getTime() - b.dataAtualizacao.getTime()
      : b.dataAtualizacao.getTime() - a.dataAtualizacao.getTime();
  }
  if (sortBy === 'valor') {
    return sortOrder === 'asc' 
      ? a.valorInteresse - b.valorInteresse
      : b.valorInteresse - a.valorInteresse;
  }
  // nome...
});
```

---

### 3. Gráficos com Recharts (Médio - 3-4 horas)

**Instalar:**
```bash
npm install recharts
```

**O que fazer:**
- Gráfico de barras: leads por status
- Gráfico de linha: evolução no tempo
- Gráfico de pizza: origem dos leads

**Exemplo:**
```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = pipelineStages.map(stage => ({
  name: stage.nome,
  quantidade: leads.filter(l => l.status === stage.id).length
}));

<BarChart width={600} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="quantidade" fill="#3b82f6" />
</BarChart>
```

---

### 4. Sistema de Tarefas/Follow-ups (Médio - 4-6 horas)

**Nova tabela de dados:**
```typescript
interface Task {
  id: number;
  leadId: string;
  descricao: string;
  dataVencimento: Date;
  concluida: boolean;
}
```

**Funcionalidades:**
- Adicionar tarefa para cada lead
- Listar tarefas pendentes no dashboard
- Marcar como concluída
- Notificações de vencimento

---

### 5. Migrar para Supabase (Médio-Avançado - 8-12 horas)

**Por que?**
- Dados sincronizados entre dispositivos
- Multi-usuário
- Backup automático
- Mais profissional

**Passos:**

1. **Criar conta no Supabase** (gratuito)
   - https://supabase.com

2. **Criar tabela:**
```sql
CREATE TABLE leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  origem TEXT NOT NULL,
  status TEXT NOT NULL,
  valor_interesse NUMERIC NOT NULL,
  tipo_imovel TEXT NOT NULL,
  observacao TEXT,
  data_criacao TIMESTAMP DEFAULT NOW(),
  data_atualizacao TIMESTAMP DEFAULT NOW()
);
```

3. **Instalar cliente:**
```bash
npm install @supabase/supabase-js
```

4. **Configurar:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

5. **Substituir funções:**
```typescript
// Antes (localStorage)
export const getLeads = () => {
  return JSON.parse(localStorage.getItem('leads') || '[]');
};

// Depois (Supabase)
export const getLeads = async () => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('data_atualizacao', { ascending: false });
  
  return data || [];
};
```

---

### 6. Autenticação de Usuários (Médio - 6-8 horas)

**Com Supabase (mais fácil):**

```typescript
// Registro
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@email.com',
  password: 'senha123'
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@email.com',
  password: 'senha123'
});

// Verificar usuário logado
const { data: { user } } = await supabase.auth.getUser();
```

**Adicionar:**
- Página de login/registro
- Proteção de rotas
- Filtrar leads por usuário

---

### 7. Exportar Relatórios (Médio - 4-6 horas)

**Excel com xlsx:**
```bash
npm install xlsx
```

```typescript
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(leads);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  XLSX.writeFile(workbook, 'leads.xlsx');
};
```

**PDF com jsPDF:**
```bash
npm install jspdf jspdf-autotable
```

---

### 8. Aplicativo Mobile (Avançado - 4-6 semanas)

**Opção 1: React Native**
- Reutiliza conhecimento de React
- Um código para iOS e Android
- Pode compartilhar lógica com web

**Opção 2: PWA (Progressive Web App)**
- Mais rápido de implementar
- Funciona offline
- Instalável no celular
- Apenas adicionar manifest.json

**PWA é melhor para começar:**
```json
// public/manifest.json
{
  "name": "CRM Imobiliário",
  "short_name": "CRM",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

---

## 🎓 Conceitos para Aprender

### Iniciante
- [ ] React Hooks (useState, useEffect, useContext)
- [ ] TypeScript básico
- [ ] Tailwind CSS
- [ ] Componentes React
- [ ] Props e State

### Intermediário
- [ ] API REST (fetch, axios)
- [ ] Gerenciamento de estado (Context API, Zustand)
- [ ] React Hook Form
- [ ] Validação de formulários (Zod, Yup)
- [ ] Autenticação JWT

### Avançado
- [ ] Server Components (Next.js 14)
- [ ] Otimização de performance
- [ ] SEO
- [ ] Testing (Jest, React Testing Library)
- [ ] CI/CD
- [ ] Docker

---

## 🛠️ Ferramentas Úteis

### Design
- **Figma** - Prototipar antes de codar
- **Coolors.co** - Paletas de cores
- **Heroicons** - Mais ícones

### Desenvolvimento
- **VS Code** - Editor recomendado
- **React Developer Tools** - Debug no Chrome
- **Postman** - Testar APIs
- **GitHub Desktop** - Git visual

### Deploy
- **Vercel** - Deploy grátis de Next.js (recomendado)
- **Netlify** - Alternativa
- **Railway** - Para backend

---

## 📊 Recursos de Dados

### APIs Públicas Úteis:
- **ViaCEP** - Buscar endereço por CEP
  ```typescript
  fetch(`https://viacep.com.br/ws/${cep}/json/`)
  ```

- **IBGE** - Estados e cidades
  ```typescript
  fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
  ```

---

## 🎯 Roadmap Recomendado

**Semana 1-2: Fundamentos**
- ✅ Projeto básico funcionando (já feito!)
- [ ] Adicionar busca e filtros
- [ ] Melhorar responsividade mobile

**Semana 3-4: Banco de Dados**
- [ ] Migrar para Supabase
- [ ] Adicionar autenticação
- [ ] Implementar tarefas/follow-ups

**Semana 5-6: Visualização**
- [ ] Adicionar gráficos
- [ ] Dashboard avançado
- [ ] Relatórios exportáveis

**Semana 7-8: Refinamentos**
- [ ] Notificações
- [ ] PWA para mobile
- [ ] Deploy em produção

**Semana 9+: Extras**
- [ ] Integração WhatsApp
- [ ] Sistema de metas
- [ ] Multi-usuário (equipe)

---

## 💡 Dicas de Desenvolvimento

1. **Commits frequentes**
   ```bash
   git commit -m "feat: adiciona busca de leads"
   ```

2. **Teste no mobile desde cedo**
   - Use Chrome DevTools (F12 → Toggle device toolbar)

3. **Leia a documentação**
   - Não decore, entenda os conceitos

4. **Faça uma funcionalidade de cada vez**
   - Não tente fazer tudo junto

5. **Peça feedback de corretores reais**
   - Eles vão te dar insights valiosos

---

Boa sorte no desenvolvimento! 🚀
