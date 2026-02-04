-- ✅ HABILITAR RLS E CRIAR POLÍTICAS DE ACESSO

-- 1️⃣ HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- 2️⃣ CRIAR POLÍTICAS PARA LEITURA (Usuários autenticados podem ler)
CREATE POLICY "Usuários autenticados podem ler clientes"
  ON clientes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler agendamentos"
  ON agendamentos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler produtos"
  ON produtos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler vendas"
  ON vendas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler lembretes"
  ON lembretes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ler configuracoes"
  ON configuracoes FOR SELECT
  USING (auth.role() = 'authenticated');

-- 3️⃣ CRIAR POLÍTICAS PARA ESCRITA (Usuários autenticados podem inserir/atualizar/deletar)
CREATE POLICY "Usuários autenticados podem inserir clientes"
  ON clientes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON clientes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar clientes"
  ON clientes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Agendamentos
CREATE POLICY "Usuários autenticados podem inserir agendamentos"
  ON agendamentos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar agendamentos"
  ON agendamentos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar agendamentos"
  ON agendamentos FOR DELETE
  USING (auth.role() = 'authenticated');

-- Produtos
CREATE POLICY "Usuários autenticados podem inserir produtos"
  ON produtos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar produtos"
  ON produtos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar produtos"
  ON produtos FOR DELETE
  USING (auth.role() = 'authenticated');

-- Vendas
CREATE POLICY "Usuários autenticados podem inserir vendas"
  ON vendas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar vendas"
  ON vendas FOR DELETE
  USING (auth.role() = 'authenticated');

-- Lembretes
CREATE POLICY "Usuários autenticados podem inserir lembretes"
  ON lembretes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar lembretes"
  ON lembretes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar lembretes"
  ON lembretes FOR DELETE
  USING (auth.role() = 'authenticated');

-- Configurações
CREATE POLICY "Usuários autenticados podem ler e modificar configuracoes"
  ON configuracoes FOR ALL
  USING (auth.role() = 'authenticated');

-- ✅ PRONTO! Agora execute os testes:
SELECT 'RLS ativado com sucesso!' as status;
