alter table if exists public.configuracoes
  drop column if exists valor_corte,
  drop column if exists valor_barba,
  drop column if exists valor_corte_barba;
