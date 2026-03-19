-- Alteracoes aplicadas depois da primeira versao do banco

alter table public.agendamentos
add column if not exists confirmado_whatsapp boolean not null default false;

alter table public.lembretes
add column if not exists cliente_telefone text,
add column if not exists cliente_nome text;

alter table public.vendas
add column if not exists forma_pagamento text;

alter table public.vendas
drop constraint if exists vendas_forma_pagamento_check;

alter table public.vendas
add constraint vendas_forma_pagamento_check
check (forma_pagamento in ('Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito'));

alter table public.vendas
add column if not exists cliente_id uuid;

alter table public.vendas
drop constraint if exists vendas_cliente_id_fkey;

alter table public.vendas
add constraint vendas_cliente_id_fkey
foreign key (cliente_id)
references public.clientes(id)
on delete set null;
