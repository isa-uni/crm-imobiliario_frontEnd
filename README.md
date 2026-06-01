# CRM Imobiliário 🏠

Sistema web de gerenciamento de leads e vendas para corretores de imóveis, desenvolvido com Next.js, React e Tailwind CSS.

## 🚀 Funcionalidades

- ✅ Dashboard com métricas de vendas em tempo real
- ✅ Cadastro e gerenciamento de leads
- ✅ Funil de vendas com 6 etapas (Lead → Oportunidade → Visita → Proposta → Fechado/Perdido)
- ✅ Filtros por status do lead
- ✅ Cards visuais para cada lead com informações completas
- ✅ Edição e exclusão de leads
- ✅ Alteração de status com arrastar e soltar
- ✅ Armazenamento local (LocalStorage)
- ✅ Interface responsiva (funciona em desktop e mobile)
- ✅ Métricas de conversão e valor total de vendas

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🔧 Instalação

1. **Instale as dependências:**

```bash
npm install
```

2. **Execute o projeto em modo desenvolvimento:**

```bash
npm run dev
```

3. **Acesse no navegador:**

```
http://localhost:3000
```

## 📦 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa linter
```

## 🏗️ Estrutura do Projeto

```
crm-imobiliario/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout raiz
│   └── globals.css       # Estilos globais
├── components/
│   ├── LeadCard.tsx      # Card de lead individual
│   ├── LeadModal.tsx     # Modal para adicionar/editar leads
│   └── MetricCard.tsx    # Card de métrica do dashboard
├── lib/
│   └── data.ts           # Funções de gerenciamento de dados
├── types/
│   └── index.ts          # Tipos TypeScript
└── package.json
```

## 🎨 Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## 💾 Armazenamento de Dados

Os dados são armazenados localmente no navegador usando `localStorage`. Isso significa:

- ✅ Funciona offline
- ✅ Dados persistem entre sessões
- ❌ Dados são específicos por navegador/dispositivo
- ❌ Não há sincronização entre dispositivos

### Para produção, considere migrar para:

1. **Supabase** (recomendado)
   - Backend as a Service
   - PostgreSQL gerenciado
   - Autenticação integrada
   - API REST automática

2. **Firebase**
   - Realtime Database
   - Autenticação
   - Hospedagem

3. **Backend próprio**
   - Node.js + Express + PostgreSQL
   - Python + FastAPI + PostgreSQL

## 🔄 Próximos Passos Sugeridos

### Curto Prazo (1-2 semanas)
- [ ] Adicionar busca de leads por nome/telefone
- [ ] Implementar ordenação (data, valor, nome)
- [ ] Adicionar filtro por data
- [ ] Exportar relatórios em PDF/Excel

### Médio Prazo (1 mês)
- [ ] Migrar para Supabase (banco real)
- [ ] Implementar autenticação de usuários
- [ ] Adicionar sistema de tarefas/follow-ups
- [ ] Dashboard com gráficos (recharts)
- [ ] Histórico de atividades por lead

### Longo Prazo (2-3 meses)
- [ ] Aplicativo mobile (React Native)
- [ ] Integração com WhatsApp
- [ ] Notificações push
- [ ] Relatórios avançados
- [ ] Sistema de metas e comissões
- [ ] Multi-usuário (time de vendas)

## 📱 Como Funciona

### 1. Dashboard
Exibe métricas principais:
- Total de leads em cada etapa
- Taxa de conversão geral
- Valor total das vendas fechadas
- Funil de vendas visual

### 2. Adicionar Lead
Clique em "Novo Lead" e preencha:
- Nome, telefone, email
- Origem (Facebook, Instagram, etc)
- Valor de interesse
- Tipo de imóvel
- Observações

### 3. Gerenciar Leads
- **Ver detalhes**: Cada card mostra informações completas
- **Editar**: Clique no ícone de lápis
- **Excluir**: Clique no ícone de lixeira
- **Alterar status**: Use o dropdown no card

### 4. Filtros
Clique nos botões de status para filtrar:
- Todos
- Leads
- Oportunidades
- Visitas Agendadas
- Propostas
- Fechados
- Perdidos

## 🎓 Aprendendo com o Código

### Conceitos Importantes Aplicados:

1. **React Hooks**
   - `useState` para gerenciar estado
   - `useEffect` para efeitos colaterais
   
2. **TypeScript**
   - Interfaces e tipos definidos
   - Type safety em todo código
   
3. **Component Composition**
   - Componentes reutilizáveis
   - Props tipadas
   
4. **Client-Side Rendering**
   - `'use client'` para componentes interativos
   
5. **Tailwind CSS**
   - Classes utility-first
   - Design responsivo
   - Hover states e transições

## 🐛 Solução de Problemas

### Erro "Cannot find module"
```bash
npm install
```

### Porta 3000 já em uso
```bash
# Mude a porta
PORT=3001 npm run dev
```

### Dados não aparecem
- Verifique o console do navegador (F12)
- Limpe o localStorage: `localStorage.clear()`
- Recarregue a página

## 📚 Recursos de Aprendizado

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 Licença

Projeto livre para uso educacional e comercial.

## 👨‍💻 Contribuindo

Sugestões e melhorias são bem-vindas! Este é um projeto para aprendizado prático.

---

**Desenvolvido como projeto educacional de CRM para o mercado imobiliário** 🏡
