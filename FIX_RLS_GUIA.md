# 🔓 SOLUÇÃO: Habilitar Acesso aos Dados

O app não está trazendo dados porque o **RLS (Row Level Security)** está bloqueando o acesso.

## ✅ SOLUÇÃO EM 3 PASSOS

### 1️⃣ Execute o SQL no Supabase
```bash
# Acesse: https://app.supabase.com
# Seu projeto → SQL Editor
# Cole o conteúdo de: FIX_RLS.sql
# Clique: Run
```

### 2️⃣ Verifique o status
```bash
# Execute este comando no SQL Editor:
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Resultado esperado:
```
agendamentos
clientes
configuracoes
lembretes
produtos
vendas
```

### 3️⃣ Teste no app
```bash
# Abra o app e faça login com:
Email: seu@email.com (criado em Supabase)
Senha: sua_senha_forte

# Agora você deve ver todos os dados!
```

---

## 🎯 O que mudou?

**ANTES** (bloqueado):
- RLS ativado, mas SEM políticas
- Apenas superadmin podia acessar
- App: tela branca / sem dados

**DEPOIS** (desbloqueado):
- RLS ativado COM políticas
- Usuários autenticados podem ler/escrever
- App: mostra todos os dados ✅

---

## 🔑 Autenticação

Você PRECISA estar logado pra acessar dados.

### Criar usuário manualmente:
1. Supabase → Authentication → Users
2. New User
3. Email + Password
4. Save

### Ou criar via app:
1. Abra o app
2. Tela de Sign Up
3. Email + Password
4. Create Account

---

## ✨ Pronto!

Depois de executar `FIX_RLS.sql`, seu app terá:

✅ Dados visíveis
✅ CRUD funcionando
✅ Segurança com RLS
✅ Tudo pronto pra usar

