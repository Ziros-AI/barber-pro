create table if not exists public.mensagem_templates (
  id text primary key,
  user_id uuid not null,
  tipo text not null check (tipo in ('confirmacao', 'lembrete', 'reagendamento', 'nao_comparecimento', 'pos_atendimento')),
  nome text not null,
  mensagem text not null,
  ativo boolean not null default true,
  padrao boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_mensagem_templates_user_id on public.mensagem_templates (user_id);
create unique index if not exists ux_mensagem_templates_padrao_por_tipo on public.mensagem_templates (user_id, tipo) where padrao = true and ativo = true;

alter table public.mensagem_templates enable row level security;
alter table public.mensagem_templates force row level security;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_mensagem_templates_user'
  ) then
    alter table public.mensagem_templates
      add constraint fk_mensagem_templates_user
      foreign key (user_id)
      references auth.users (id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mensagem_templates'
      and policyname = 'mensagem_templates_select_own'
  ) then
    create policy mensagem_templates_select_own
      on public.mensagem_templates
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mensagem_templates'
      and policyname = 'mensagem_templates_insert_own'
  ) then
    create policy mensagem_templates_insert_own
      on public.mensagem_templates
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mensagem_templates'
      and policyname = 'mensagem_templates_update_own'
  ) then
    create policy mensagem_templates_update_own
      on public.mensagem_templates
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mensagem_templates'
      and policyname = 'mensagem_templates_delete_own'
  ) then
    create policy mensagem_templates_delete_own
      on public.mensagem_templates
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
declare
  has_json_column boolean;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'configuracoes'
      and column_name = 'mensagens_templates'
  ) into has_json_column;

  if has_json_column then
    execute $json_migration$
      insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
      select
        coalesce(template_item ->> 'id', md5(c.user_id::text || coalesce(template_item ->> 'tipo', '') || clock_timestamp()::text)),
        c.user_id,
        template_item ->> 'tipo',
        coalesce(nullif(template_item ->> 'nome', ''), initcap(replace(template_item ->> 'tipo', '_', ' '))),
        coalesce(nullif(template_item ->> 'mensagem', ''), c.mensagem_lembrete_template),
        coalesce((template_item ->> 'ativo')::boolean, true),
        coalesce((template_item ->> 'padrao')::boolean, false)
      from public.configuracoes c
      cross join lateral jsonb_array_elements(coalesce(c.mensagens_templates, '[]'::jsonb)) as template_item
      where c.user_id is not null
      on conflict (id) do nothing
    $json_migration$;
  end if;
end $$;

insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
select
  concat(c.user_id::text, '-confirmacao-padrao'),
  c.user_id,
  'confirmacao',
  'Confirmacao padrao',
  format('Fala {nome}! Confirmado seu {servico} as {hora}. Te esperamos na %s!', coalesce(nullif(c.nome_barbearia, ''), 'Barbearia')),
  true,
  true
from public.configuracoes c
where c.user_id is not null
  and not exists (
    select 1
    from public.mensagem_templates mt
    where mt.user_id = c.user_id
      and mt.tipo = 'confirmacao'
  )
on conflict (id) do nothing;

insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
select
  concat(c.user_id::text, '-lembrete-padrao'),
  c.user_id,
  'lembrete',
  'Lembrete padrao',
  coalesce(nullif(c.mensagem_lembrete_template, ''), 'Ola {nome}, lembrete do seu {servico} amanha as {hora}. Te esperamos! - {barbearia}'),
  true,
  true
from public.configuracoes c
where c.user_id is not null
  and not exists (
    select 1
    from public.mensagem_templates mt
    where mt.user_id = c.user_id
      and mt.tipo = 'lembrete'
  )
on conflict (id) do nothing;

insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
select
  concat(c.user_id::text, '-reagendamento-padrao'),
  c.user_id,
  'reagendamento',
  'Reagendamento padrao',
  format('Ola {nome}, precisamos reagendar seu {servico}. Fale com a %s para escolher um novo horario.', coalesce(nullif(c.nome_barbearia, ''), 'Barbearia')),
  true,
  true
from public.configuracoes c
where c.user_id is not null
  and not exists (
    select 1
    from public.mensagem_templates mt
    where mt.user_id = c.user_id
      and mt.tipo = 'reagendamento'
  )
on conflict (id) do nothing;

insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
select
  concat(c.user_id::text, '-nao-comparecimento-padrao'),
  c.user_id,
  'nao_comparecimento',
  'Nao comparecimento padrao',
  format('Ola {nome}, sentimos sua ausencia no horario das {hora}. Se quiser, podemos remarcar seu {servico} na %s.', coalesce(nullif(c.nome_barbearia, ''), 'Barbearia')),
  true,
  true
from public.configuracoes c
where c.user_id is not null
  and not exists (
    select 1
    from public.mensagem_templates mt
    where mt.user_id = c.user_id
      and mt.tipo = 'nao_comparecimento'
  )
on conflict (id) do nothing;

insert into public.mensagem_templates (id, user_id, tipo, nome, mensagem, ativo, padrao)
select
  concat(c.user_id::text, '-pos-atendimento-padrao'),
  c.user_id,
  'pos_atendimento',
  'Pos-atendimento padrao',
  format('Valeu pela visita, {nome}! Obrigado por escolher a %s. Quando quiser agendar outro {servico}, estamos por aqui.', coalesce(nullif(c.nome_barbearia, ''), 'Barbearia')),
  true,
  true
from public.configuracoes c
where c.user_id is not null
  and not exists (
    select 1
    from public.mensagem_templates mt
    where mt.user_id = c.user_id
      and mt.tipo = 'pos_atendimento'
  )
on conflict (id) do nothing;
