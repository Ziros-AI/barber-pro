-- Script SQL para Popular Supabase com Dados de Teste Completos
-- Execute no Supabase SQL Editor

-- ============================================
-- CLIENTES (10 clientes)
-- ============================================
INSERT INTO clientes (nome, email, telefone) VALUES
('João Silva', 'joao.silva@email.com', '11999999999'),
('Maria Santos', 'maria.santos@email.com', '11988888888'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '11977777777'),
('Ana Costa', 'ana.costa@email.com', '11966666666'),
('Carlos Ferreira', 'carlos.ferreira@email.com', '11955555555'),
('Lucas Mendes', 'lucas.mendes@email.com', '11944444444'),
('Roberto Alves', 'roberto.alves@email.com', '11933333333'),
('Fernando Souza', 'fernando.souza@email.com', '11922222222'),
('Eduardo Lima', 'eduardo.lima@email.com', '11911111111'),
('Gustavo Martins', 'gustavo.martins@email.com', '11900000000');

-- ============================================
-- PRODUTOS (12 produtos)
-- ============================================
INSERT INTO produtos (nome, marca, preco, estoque) VALUES
('Gel para Cabelo', 'Linha Premium', 49.90, 15),
('Pomada Clássica', 'Barbershop Gold', 39.90, 20),
('Tônico Capilar', 'Pro Hair', 59.90, 12),
('Shampoo Profissional', 'Linha Premium', 44.90, 18),
('Balm para Barba', 'Golden Beard', 34.90, 25),
('Cera Modeladora', 'Super Hold', 54.90, 10),
('Óleo para Barba', 'Premium Oil', 69.90, 8),
('Sabonete Barba', 'Natural Clean', 24.90, 30),
('Spray Fixador', 'Keep It', 29.90, 22),
('Condicionador', 'Deep Care', 39.90, 16),
('Tonalizante Cinza', 'Silver', 89.90, 5),
('Loção Pós Barba', 'Soothe', 44.90, 14);

-- ============================================
-- AGENDAMENTOS (15 agendamentos para os próximos dias)
-- ============================================
INSERT INTO agendamentos (cliente_nome, cliente_telefone, servico, data_hora, status) VALUES
('João Silva', '11999999999', 'Corte', NOW() + INTERVAL '1 hour', 'pendente'),
('Maria Santos', '11988888888', 'Barba', NOW() + INTERVAL '2 hours', 'confirmado'),
('Pedro Oliveira', '11977777777', 'Corte + Barba', NOW() + INTERVAL '3 hours', 'pendente'),
('Ana Costa', '11966666666', 'Design de Barba', NOW() + INTERVAL '4 hours', 'confirmado'),
('Carlos Ferreira', '11955555555', 'Corte', NOW() + INTERVAL '5 hours', 'pendente'),
('Lucas Mendes', '11944444444', 'Pigmentação', NOW() + INTERVAL '6 hours', 'pendente'),
('Roberto Alves', '11933333333', 'Corte + Barba', NOW() + INTERVAL '1 day 2 hours', 'pendente'),
('Fernando Souza', '11922222222', 'Barba', NOW() + INTERVAL '1 day 4 hours', 'confirmado'),
('Eduardo Lima', '11911111111', 'Corte', NOW() + INTERVAL '1 day 6 hours', 'pendente'),
('Gustavo Martins', '11900000000', 'Design de Barba', NOW() + INTERVAL '2 days 1 hour', 'pendente'),
('João Silva', '11999999999', 'Corte + Barba', NOW() + INTERVAL '2 days 3 hours', 'pendente'),
('Maria Santos', '11988888888', 'Pigmentação', NOW() + INTERVAL '2 days 5 hours', 'pendente'),
('Pedro Oliveira', '11977777777', 'Corte', NOW() + INTERVAL '3 days 2 hours', 'pendente'),
('Ana Costa', '11966666666', 'Barba', NOW() + INTERVAL '3 days 4 hours', 'pendente'),
('Carlos Ferreira', '11955555555', 'Design de Barba', NOW() + INTERVAL '4 days 1 hour', 'pendente');

-- ============================================
-- VENDAS (20 vendas do histórico)
-- ============================================
INSERT INTO vendas (data_hora, valor_servico, valor_total, produtos_vendidos) VALUES
(NOW() - INTERVAL '1 day', 50.00, 99.90, '[{"nome": "Gel para Cabelo", "quantidade": 1, "subtotal": 49.90}]'),
(NOW() - INTERVAL '1 day 2 hours', 40.00, 40.00, NULL),
(NOW() - INTERVAL '1 day 4 hours', 80.00, 119.90, '[{"nome": "Pomada Clássica", "quantidade": 1, "subtotal": 39.90}]'),
(NOW() - INTERVAL '1 day 6 hours', 60.00, 60.00, NULL),
(NOW() - INTERVAL '2 days', 50.00, 109.90, '[{"nome": "Tônico Capilar", "quantidade": 1, "subtotal": 59.90}]'),
(NOW() - INTERVAL '2 days 3 hours', 60.00, 99.90, '[{"nome": "Balm para Barba", "quantidade": 1, "subtotal": 34.90}]'),
(NOW() - INTERVAL '2 days 6 hours', 70.00, 124.80, '[{"nome": "Cera Modeladora", "quantidade": 1, "subtotal": 54.90}]'),
(NOW() - INTERVAL '3 days', 45.00, 45.00, NULL),
(NOW() - INTERVAL '3 days 4 hours', 80.00, 149.80, '[{"nome": "Óleo para Barba", "quantidade": 1, "subtotal": 69.90}]'),
(NOW() - INTERVAL '3 days 8 hours', 50.00, 94.80, '[{"nome": "Sabonete Barba", "quantidade": 2, "subtotal": 49.80}]'),
(NOW() - INTERVAL '4 days', 65.00, 94.90, '[{"nome": "Spray Fixador", "quantidade": 1, "subtotal": 29.90}]'),
(NOW() - INTERVAL '4 days 5 hours', 55.00, 55.00, NULL),
(NOW() - INTERVAL '5 days', 70.00, 109.80, '[{"nome": "Condicionador", "quantidade": 1, "subtotal": 39.90}]'),
(NOW() - INTERVAL '5 days 3 hours', 90.00, 179.80, '[{"nome": "Tonalizante Cinza", "quantidade": 1, "subtotal": 89.90}]'),
(NOW() - INTERVAL '5 days 7 hours', 50.00, 94.90, '[{"nome": "Loção Pós Barba", "quantidade": 1, "subtotal": 44.90}]'),
(NOW() - INTERVAL '6 days', 60.00, 60.00, NULL),
(NOW() - INTERVAL '6 days 4 hours', 80.00, 129.80, '[{"nome": "Gel para Cabelo", "quantidade": 1, "subtotal": 49.90}]'),
(NOW() - INTERVAL '7 days', 75.00, 124.80, '[{"nome": "Pomada Clássica", "quantidade": 2, "subtotal": 79.80}]'),
(NOW() - INTERVAL '7 days 5 hours', 50.00, 50.00, NULL),
(NOW() - INTERVAL '7 days 8 hours', 85.00, 139.80, '[{"nome": "Tônico Capilar", "quantidade": 1, "subtotal": 59.90}]');

-- ============================================
-- LEMBRETES (12 lembretes)
-- ============================================
INSERT INTO lembretes (cliente_nome, mensagem, data_envio, status) VALUES
('João Silva', 'Lembrete: Você tem corte marcado amanhã às 14h', NOW() + INTERVAL '1 day', 'pendente'),
('Maria Santos', 'Obrigado por sua visita! Queremos te ver em breve', NOW() - INTERVAL '1 day', 'enviado'),
('Pedro Oliveira', 'Novo produto em estoque: Shampoo Premium. Vem conferir!', NOW(), 'pendente'),
('Ana Costa', 'Você recebeu um desconto especial! Válido até amanhã', NOW(), 'pendente'),
('Carlos Ferreira', 'Saudades! Que tal vir fazer um novo corte?', NOW() - INTERVAL '2 days', 'enviado'),
('Lucas Mendes', 'Temos nova cor disponível! Venha experimentar', NOW() + INTERVAL '3 hours', 'pendente'),
('Roberto Alves', 'Seu serviço de barba está em promoção essa semana', NOW() - INTERVAL '3 days', 'enviado'),
('Fernando Souza', 'Lembrete: Agendamento confirmado para amanhã às 16h', NOW() + INTERVAL '18 hours', 'pendente'),
('Eduardo Lima', 'Novo catálogo de géis disponível na barbearia', NOW(), 'pendente'),
('Gustavo Martins', 'Oferta especial: Corte + Barba + Bebida por R$ 99', NOW() - INTERVAL '5 days', 'enviado'),
('João Silva', 'Você já marcou seu próximo agendamento?', NOW() + INTERVAL '2 days', 'pendente'),
('Maria Santos', 'Black Friday de Barbershop começa amanhã!', NOW() + INTERVAL '12 hours', 'pendente');

-- ============================================
-- CONFIGURAÇÕES DA BARBEARIA
-- ============================================
INSERT INTO configuracoes (nome_barbearia, mensagem_lembrete_template) VALUES
('Premium Barber Shop', 'Olá {nome}, lembrete do seu {servico} amanhã às {hora}. Te esperamos! ✂️ - Premium Barber Shop');

-- ============================================
-- Resumo dos Dados Inseridos
-- ============================================
-- ✓ 10 Clientes
-- ✓ 12 Produtos (com estoque variado)
-- ✓ 15 Agendamentos (próximos dias, mix de status)
-- ✓ 20 Vendas (histórico de 7 dias)
-- ✓ 12 Lembretes (mix de pendentes e enviados)
-- ✓ Configuração da barbearia

-- Total inserido: 69 registros
-- Dados prontos para testar Dashboard, Agenda, Clientes, Caixa, Produtos e Lembretes!
