# 🔪 Barber Pro Mobile - App de Gestão de Barbearia

Aplicação completa em React Native + Expo para gerenciar sua barbearia com elegância. Desenvolvido com TypeScript, Supabase e TanStack Query.

---

## ⚡ Quick Start (5 minutos)

### 1. Instale dependências
```bash
npm install
```

### 2. Configure Supabase
```bash
# Edite o arquivo .env
EXPO_PUBLIC_SUPABASE_URL=seu_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave
```

### 3. Execute SQL no Supabase
```bash
# SQL Editor → Cole FIX_RLS.sql → Run
```

### 4. Crie usuário de teste
```bash
# Supabase → Authentication → New User
Email: seu@email.com
Password: Senha123
```

### 5. Rode o app
```bash
npm start
# Escaneie QR Code com Expo Go
```

### 6. (Opcional) Página pública de agendamento

No repositório há uma **Edge Function** `public-booking` e o site estático `../booking-web/` para o cliente agendar sem login.

1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli), faça login e linke o projeto.
2. Defina o secret **`BOOKING_OWNER_USER_ID`** com o UUID do usuário de autenticação da barbearia (o mesmo que aparece em `auth.users.id` ao logar no app). Opcional: **`BOOKING_TIMEZONE`** (padrão `America/Sao_Paulo`).
3. Faça o deploy da função:
   ```bash
   cd ..   # raiz BarberPro (pasta que contém supabase/)
   supabase secrets set BOOKING_OWNER_USER_ID=<uuid-do-usuario-auth>
   supabase functions deploy public-booking --project-ref <seu-project-ref>
   ```
4. Na pasta `booking-web/`, copie `.env.example` para `.env`, preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, depois `npm install && npm run dev` (ou `npm run build` e publique a pasta `dist` em qualquer hospedagem estática).

A função usa a **service role** só no servidor; o front chama a função com a anon key. Os serviços exibidos são os da tabela `servicos` com `user_id` igual ao `BOOKING_OWNER_USER_ID`. Serviços criados antes desta versão podem ter `user_id` nulo; nesse caso atualize no SQL Editor: `update public.servicos set user_id = '<uuid>' where user_id is null;` (use o mesmo UUID do secret).

---

## ✨ Funcionalidades Principais

✅ **Dashboard** - KPIs em tempo real
- Total de vendas hoje
- Faturamento do mês
- Ticket médio
- Próximos agendamentos
- Produtos com estoque baixo

✅ **Agenda** - Gestão de agendamentos
- Seletor de 7 dias
- Horários disponíveis (08:00-19:00)
- Confirmação via WhatsApp
- Criação de lembretes automáticos
- Status: pendente, confirmado, concluído

✅ **Clientes** - Gestão e radar de retorno
- Listagem completa de clientes
- Busca por nome/telefone
- **Radar de retorno**: identifica quem precisa voltar
- Envio de convite via WhatsApp
- Histórico de agendamentos

✅ **Caixa** - Controle financeiro
- Histórico de vendas
- Detalhes de produtos vendidos
- Total faturado
- Produtos por venda

✅ **Produtos** - Catálogo
- Marca e preço
- Controle de estoque (verde/amarelo/vermelho)
- Adicionar novos produtos

✅ **Lembretes** - Notificações automáticas
- Lembretes via WhatsApp
- Status: pendente/enviado
- Agendados automaticamente

---

## 🛠️ Tech Stack

| Layer | Tecnologia |
|-------|-----------|
| Mobile | React Native + Expo SDK 52 |
| Language | TypeScript |
| State | TanStack Query v5 |
| Backend | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Navigation | React Navigation |
| Styling | React Native StyleSheet |
| Icons | lucide-react-native |
| Dates | date-fns v3 |

---

## 📊 Regras de Negócios

### 🎯 Agenda
- Horários: 08:00 - 19:00
- Status: pendente → confirmado → concluído
- WhatsApp automático para confirmação
- Criação automática de lembrete ao confirmar

### 👥 Clientes
- **Radar de retorno**: cliente precisa voltar se passou (frequencia_dias - 3)
- Frequência padrão: 30 dias
- Aviso em amarelo quando próximo do vencimento
- Envio de convite via WhatsApp

### 💰 Caixa
- Registro automático de venda
- Produtos vendidos em JSON
- Valor total = valor_servico + produtos
- Histórico de 7+ dias

### 📦 Produtos
- Estoque visual (verde > 5, amarelo 2-5, vermelho < 2)
- Marca obrigatória
- Preço em decimal

### 🔔 Lembretes
- Criados automaticamente ao confirmar agendamento
- Agendados para 1 dia antes
- Status: pendente/enviado

---

## 📱 Estrutura

```
src/
├── api/
│   └── supabaseClient.ts           # Cliente Supabase
├── contexts/
│   └── AuthContext.tsx             # Auth + Sessão
├── hooks/
│   ├── useAgendamento.ts           # CRUD agendamentos
│   ├── useCliente.ts               # CRUD clientes
│   ├── useProduto.ts               # CRUD produtos
│   └── useVenda.ts                 # Create/Delete vendas
├── navigation/
│   └── AppNavigator.tsx            # Tabs + Stack
├── screens/
│   ├── Login.tsx                   # Autenticação
│   ├── Dashboard.tsx               # KPIs
│   ├── Agenda.tsx                  # Agendamentos
│   ├── Clientes.tsx                # Radar de retorno
│   ├── Caixa.tsx                   # Financeiro
│   ├── Produtos.tsx                # Catálogo
│   └── Lembretes.tsx               # Automáticas
├── components/
│   └── modals/
│       ├── NovoAgendamentoModal.tsx
│       ├── NovoClienteModal.tsx
│       └── NovoProdutoModal.tsx
├── styles/
│   └── colors.ts                   # Paleta centralizada
└── types/
    └── database.ts                 # TypeScript types
```

---

## 🔐 Dados de Teste Inclusos

Execute `SEED_DATA.sql` no Supabase:
- **10 Clientes** com frequência definida
- **12 Produtos** de marcas variadas
- **15 Agendamentos** próximos dias
- **20 Vendas** histórico 7 dias
- **12 Lembretes** mix pendente/enviado
- **1 Config** barbearia

**Total: 69 registros**

---

## 📋 Guias

| Arquivo | Propósito |
|---------|-----------|
| `FIX_RLS.sql` | Habilitar acesso aos dados |
| `SEED_DATA.sql` | Popular 69 registros teste |
| `.env` | Credenciais Supabase |

---

## 🎨 Design System

### Cores
- **Background**: #09090b (quase preto)
- **Cards**: #18181b
- **Primary**: #D4AF37 (ouro)
- **Secondary**: #FF8C42 (laranja)
- **Success**: #22c55e (verde)
- **Zinc**: escala completa

### Components
- Botões com feedback
- Cards com border 16px
- Modals slide-up
- Loading states
- Error handling

---

## 🚀 Deploy

### iOS
```bash
expo build:ios --type app-store
```

### Android
```bash
expo build:android --type app-bundle
```

### EAS (Recomendado)
```bash
eas build --platform ios
eas build --platform android
```

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "table does not exist" | Execute FIX_RLS.sql |
| ".env not found" | Crie arquivo .env |
| "Auth failed" | Crie usuário em Authentication |
| "Blank screen" | Ctrl+C + npm start |
| "Module not found" | rm -rf node_modules && npm install |

---

## 📞 Suporte

- 📖 Documentação: Veja arquivos .sql
- 🐛 Bugs: Verifique console do Expo
- 💬 Perguntas: Supabase Docs

---

## 📜 Licença

MIT

---

**Status**: ✅ Production Ready
**Última atualização**: 03/02/2026
**Versão**: 1.0.0
│   │   └── Lembretes.tsx          # Tela de lembretes
│   ├── global.css                 # Estilos globais Tailwind
│   └── global.d.ts                # Definições TypeScript
├── App.tsx                        # Componente raiz
├── app.json                       # Configuração Expo
├── babel.config.js                # Configuração Babel
├── metro.config.js                # Configuração Metro
├── tailwind.config.js             # Configuração Tailwind
├── tsconfig.json                  # Configuração TypeScript
└── package.json                   # Dependências
```

## 🔑 Variáveis de Ambiente

```env
EXPO_PUBLIC_BASE44_APP_ID=         # ID do app no Base44
EXPO_PUBLIC_BASE44_APP_BASE_URL=   # URL base do backend
```

## 📦 Build para Produção

```bash
# Build para Android (APK)
eas build --platform android

# Build para iOS (IPA)
eas build --platform ios
```

## 🤝 Integração com Base44

O app utiliza o Base44 como backend. As entidades principais são:

- **Agendamento** - Agendamentos de clientes
- **Cliente** - Cadastro de clientes
- **Venda** - Registro de vendas
- **Produto** - Catálogo de produtos
- **Lembrete** - Lembretes automáticos

## 📝 Licença

Este projeto foi desenvolvido para uso interno.

---

Desenvolvido com ❤️ para barbearias modernas ✂️
