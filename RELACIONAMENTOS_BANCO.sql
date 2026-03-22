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

-- Relacionamento de servicos com agendamentos e vendas
alter table public.agendamentos
add column if not exists servico_id uuid;

alter table public.agendamentos
drop constraint if exists agendamentos_servico_id_fkey;

alter table public.agendamentos
add constraint agendamentos_servico_id_fkey
foreign key (servico_id)
references public.servicos(id)
on delete set null;

alter table public.vendas
add column if not exists servico_id uuid;

alter table public.vendas
drop constraint if exists vendas_servico_id_fkey;

alter table public.vendas
add constraint vendas_servico_id_fkey
foreign key (servico_id)
references public.servicos(id)
on delete set null;

-- Remove colunas antigas de texto, se existirem
alter table public.agendamentos
drop column if exists servico;

alter table public.vendas
drop column if exists servico;

alter table public.vendas
drop column if exists servico_nome;

-- Mantemos valor_servico em vendas para preservar o valor historico cobrado.
create or replace function public.finalizar_venda_completa(
  p_agendamento_id uuid,
  p_cliente_id uuid,
  p_servico_id uuid,
  p_valor_servico numeric,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_produtos jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venda_id uuid;
  v_item jsonb;
begin
  insert into public.vendas (
    cliente_id,
    servico_id,
    data_hora,
    valor_servico,
    valor_total,
    forma_pagamento,
    produtos_vendidos
  )
  values (
    p_cliente_id,
    p_servico_id,
    now(),
    coalesce(p_valor_servico, 0),
    coalesce(p_valor_total, 0),
    p_forma_pagamento,
    p_produtos
  )
  returning id into v_venda_id;

  if p_produtos is not null then
    for v_item in select * from jsonb_array_elements(p_produtos)
    loop
      insert into public.venda_itens (
        venda_id,
        produto_id,
        quantidade,
        preco_unitario,
        subtotal
      )
      values (
        v_venda_id,
        (v_item->>'produto_id')::uuid,
        coalesce((v_item->>'quantidade')::integer, 0),
        coalesce((v_item->>'preco_unitario')::numeric, 0),
        coalesce((v_item->>'subtotal')::numeric, 0)
      );

      update public.produtos
      set estoque = estoque - coalesce((v_item->>'quantidade')::integer, 0)
      where id = (v_item->>'produto_id')::uuid;
    end loop;
  end if;

  update public.agendamentos
  set status = 'concluido'
  where id = p_agendamento_id;

  return v_venda_id;
end;
$$;
