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

alter table public.configuracoes
add column if not exists agenda_intervalo_minutos integer not null default 60;

alter table public.configuracoes
add column if not exists agenda_semana jsonb not null default '[
  {"enabled": false, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "19:00", "lunchStart": "12:00", "lunchEnd": "13:00"},
  {"enabled": true, "startTime": "08:00", "endTime": "14:00", "lunchStart": null, "lunchEnd": null}
]'::jsonb;

alter table public.configuracoes
drop constraint if exists configuracoes_agenda_intervalo_minutos_check;

alter table public.configuracoes
add constraint configuracoes_agenda_intervalo_minutos_check
check (agenda_intervalo_minutos in (15, 30, 45, 60));

alter table public.produtos
add column if not exists estoque_minimo integer not null default 0;

alter table public.produtos
add column if not exists preco_custo numeric not null default 0;
