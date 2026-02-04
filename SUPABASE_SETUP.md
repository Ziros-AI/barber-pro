# 🚀 Setup do Supabase para Barber Pro

## 📋 Passo a Passo

### 1. Criar Conta no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub (recomendado)

### 2. Criar Novo Projeto

1. Clique em "New Project"
2. Escolha:
   - **Name**: `barber-pro` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha o mais próximo (ex: São Paulo - South America)
3. Clique em "Create new project"
4. Aguarde ~2 minutos para o projeto ser criado

### 3. Obter as Credenciais

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (a chave mais longa)

### 4. Configurar o App

Edite o arquivo `.env` (ou crie se não existir):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 5. Criar as Tabelas no Banco de Dados

No painel do Supabase, vá em **SQL Editor** e execute este script:

```sql
-- Tabela de Clientes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Agendamentos
CREATE TABLE agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora TIMESTAMPTZ NOT NULL,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  servico TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado')),
  confirmado_whatsapp BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE produtos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  marca TEXT,
  preco DECIMAL(10,2) NOT NULL,
  estoque INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vendas
CREATE TABLE vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_hora TIMESTAMPTZ NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  valor_servico DECIMAL(10,2) NOT NULL,
  produtos_vendidos JSONB DEFAULT '[]'::jsonb,
  cliente_id UUID REFERENCES clientes(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Lembretes
CREATE TABLE lembretes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  data_envio TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_barbearia TEXT NOT NULL,
  horas_lembrete INTEGER DEFAULT 24,
  mensagem_lembrete_template TEXT NOT NULL,
  lembretes_ativos BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_agendamentos_data ON agendamentos(data_hora);
CREATE INDEX idx_vendas_data ON vendas(data_hora);
CREATE INDEX idx_lembretes_status ON lembretes(status);

-- Habilitar Row Level Security (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (permitir tudo para usuários autenticados)
CREATE POLICY "Permitir tudo para autenticados" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir tudo para autenticados" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir tudo para autenticados" ON produtos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir tudo para autenticados" ON vendas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir tudo para autenticados" ON lembretes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir tudo para autenticados" ON configuracoes FOR ALL USING (auth.role() = 'authenticated');
```

### 6. Criar Usuário de Teste

No painel do Supabase:

1. Vá em **Authentication** > **Users**
2. Clique em **Add user**
3. Escolha **Create new user**
4. Preencha:
   - **Email**: seu@email.com
   - **Password**: sua_senha_forte
5. Clique em **Create user**

### 7. Inserir Dados de Exemplo (Opcional)

Execute no SQL Editor:

```sql
-- Inserir configuração padrão
INSERT INTO configuracoes (nome_barbearia, mensagem_lembrete_template)
VALUES ('Barbearia Pro', 'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! ✂️ - {barbearia}');

-- Inserir produtos exemplo
INSERT INTO produtos (nome, marca, preco, estoque) VALUES
('Pomada Modeladora', 'Marca X', 35.90, 15),
('Shampoo', 'Marca Y', 28.50, 20),
('Óleo para Barba', 'Marca Z', 45.00, 10);

-- Inserir clientes exemplo
INSERT INTO clientes (nome, email, telefone) VALUES
('João Silva', 'joao@email.com', '(11) 98765-4321'),
('Pedro Santos', 'pedro@email.com', '(11) 97654-3210');
```

### 8. Testar Autenticação

No seu app, você pode fazer login com:

```typescript
import { supabase } from './src/api/supabaseClient';

// Login
await supabase.auth.signInWithPassword({
  email: 'seu@email.com',
  password: 'sua_senha_forte'
});

// Ou criar novo usuário
await supabase.auth.signUp({
  email: 'novo@email.com',
  password: 'senha_forte'
});
```

### 9. Executar o App

```bash
npm start
```

## 🔒 Segurança

### Row Level Security (RLS)

O RLS está habilitado em todas as tabelas. Apenas usuários autenticados podem acessar os dados.

### Políticas Personalizadas (Opcional)

Se quiser mais controle, você pode criar políticas específicas:

```sql
-- Exemplo: Permitir apenas leitura para não-autenticados
CREATE POLICY "Permitir leitura pública" ON produtos 
FOR SELECT USING (true);

-- Exemplo: Permitir apenas o próprio usuário ver seus dados
CREATE POLICY "Usuários veem apenas seus dados" ON clientes 
FOR ALL USING (auth.uid() = user_id);
```

## 📊 Monitoramento

- **Database**: Veja queries em tempo real
- **Auth**: Monitore logins e usuários
- **Storage**: (Futuro) Para upload de fotos
- **Edge Functions**: (Futuro) Para lembretes automáticos

## 🆘 Problemas Comuns

### "Invalid API key"
- Verifique se copiou a chave correta (anon/public)
- Confirme que o `.env` está correto

### "Row Level Security policy violation"
- Certifique-se que o usuário está autenticado
- Verifique as políticas RLS no SQL Editor

### "Connection refused"
- Verifique a URL do projeto
- Confirme que o projeto está ativo (não pausado)

## 🚀 Próximos Passos

- [ ] Implementar tela de Login
- [ ] Adicionar upload de fotos de clientes
- [ ] Criar Edge Function para lembretes automáticos
- [ ] Configurar push notifications
- [ ] Implementar modo offline com cache

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [API Reference](https://supabase.com/docs/reference/javascript)
- [Supabase + React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
