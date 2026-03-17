-- Relacionamentos sugeridos para o schema atual
-- Mantem compatibilidade com dados ja existentes usando colunas nullable

-- Modelo ideal: itens da venda em tabela relacional
create table if not exists public.venda_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null references public.vendas(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete restrict,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric not null check (preco_unitario >= 0),
  subtotal numeric not null check (subtotal >= 0),
  created_at timestamp with time zone not null default now()
);

alter table public.agendamentos
add column if not exists cliente_id uuid;

alter table public.agendamentos
drop constraint if exists agendamentos_cliente_id_fkey;

alter table public.agendamentos
add constraint agendamentos_cliente_id_fkey
foreign key (cliente_id)
references public.clientes(id)
on delete set null;

alter table public.lembretes
add column if not exists cliente_id uuid,
add column if not exists agendamento_id uuid;

alter table public.lembretes
drop constraint if exists lembretes_cliente_id_fkey;

alter table public.lembretes
add constraint lembretes_cliente_id_fkey
foreign key (cliente_id)
references public.clientes(id)
on delete set null;

alter table public.lembretes
drop constraint if exists lembretes_agendamento_id_fkey;

alter table public.lembretes
add constraint lembretes_agendamento_id_fkey
foreign key (agendamento_id)
references public.agendamentos(id)
on delete cascade;

alter table public.vendas
drop constraint if exists vendas_cliente_id_fkey;

alter table public.vendas
add constraint vendas_cliente_id_fkey
foreign key (cliente_id)
references public.clientes(id)
on delete set null;
