-- Finaliza a venda em uma unica transacao:
-- 1. valida estoque e agendamento
-- 2. cria a venda
-- 3. conclui o agendamento
-- 4. baixa o estoque dos produtos

drop function if exists public.finalizar_venda_completa(uuid, uuid, numeric, numeric, text, jsonb);

create or replace function public.finalizar_venda_completa(
  p_agendamento_id uuid,
  p_cliente_id uuid,
  p_valor_servico numeric,
  p_valor_total numeric,
  p_forma_pagamento text,
  p_produtos jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_item record;
  v_venda_id uuid;
  v_produto_nome text;
  v_estoque_atual integer;
  v_tem_venda_itens boolean;
begin
  if p_valor_servico <= 0 and p_valor_total <= 0 then
    raise exception 'Valor da venda deve ser maior que 0';
  end if;

  if p_valor_total < p_valor_servico then
    raise exception 'Valor total deve ser maior ou igual ao valor do servico';
  end if;

  if p_produtos is null then
    p_produtos := '[]'::jsonb;
  end if;

  perform 1
  from public.agendamentos
  where id = p_agendamento_id;

  if not found then
    raise exception 'Agendamento nao encontrado';
  end if;

  v_tem_venda_itens := to_regclass('public.venda_itens') is not null;

  for v_item in
    select
      item.produto_id::uuid as produto_id,
      item.nome,
      item.quantidade,
      item.preco_unitario,
      item.subtotal
    from jsonb_to_recordset(p_produtos) as item(
      produto_id text,
      nome text,
      quantidade integer,
      preco_unitario numeric,
      subtotal numeric
    )
  loop
    if v_item.quantidade is null or v_item.quantidade <= 0 then
      raise exception 'Quantidade invalida para o produto %', coalesce(v_item.nome, v_item.produto_id::text);
    end if;

    select nome, estoque
    into v_produto_nome, v_estoque_atual
    from public.produtos
    where id = v_item.produto_id
    for update;

    if not found then
      raise exception 'Produto nao encontrado: %', coalesce(v_item.nome, v_item.produto_id::text);
    end if;

    if v_estoque_atual < v_item.quantidade then
      raise exception 'Estoque insuficiente para %', v_produto_nome;
    end if;
  end loop;

  insert into public.vendas (
    data_hora,
    valor_servico,
    valor_total,
    forma_pagamento,
    produtos_vendidos,
    cliente_id
  )
  values (
    now(),
    p_valor_servico,
    p_valor_total,
    p_forma_pagamento,
    p_produtos,
    p_cliente_id
  )
  returning id into v_venda_id;

  update public.agendamentos
  set
    status = 'concluido'
  where id = p_agendamento_id;

  if v_tem_venda_itens then
    insert into public.venda_itens (
      venda_id,
      produto_id,
      quantidade,
      preco_unitario,
      subtotal
    )
    select
      v_venda_id,
      item.produto_id::uuid,
      item.quantidade,
      item.preco_unitario,
      item.subtotal
    from jsonb_to_recordset(p_produtos) as item(
      produto_id text,
      quantidade integer,
      preco_unitario numeric,
      subtotal numeric
    );
  end if;

  for v_item in
    select
      item.produto_id::uuid as produto_id,
      item.quantidade
    from jsonb_to_recordset(p_produtos) as item(
      produto_id text,
      quantidade integer
    )
  loop
    update public.produtos
    set
      estoque = estoque - v_item.quantidade
    where id = v_item.produto_id;
  end loop;

  return v_venda_id;
end;
$$;

grant execute on function public.finalizar_venda_completa(uuid, uuid, numeric, numeric, text, jsonb) to authenticated;
