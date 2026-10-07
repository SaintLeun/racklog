-- Leads del sitio web en la base de la intranet (proyecto Supabase cierre-mes-intranet)
--
-- Ejecutar una vez en Supabase > SQL Editor. Crea:
--   public.leads_web               tabla con cada contacto/cotizacion del sitio
--   privado.config_api             hash del token que usa la API del sitio (no expuesto por la API REST)
--   public.registrar_lead_web()    unica puerta de entrada: valida el token e inserta
--
-- Despues de este archivo ejecutar docs/supabase_leads_clientes.sql (vinculo con clientes).
-- Si se vuelve a ejecutar ESTE archivo, volver a ejecutar tambien ese (redefine registrar_lead_web).
--
-- La API del sitio solo conoce la clave publicable (anon) y el token: si se filtraran,
-- lo unico que permiten es insertar leads. La clave service_role nunca sale de Supabase.

create table if not exists public.leads_web (
  id          bigint generated always as identity primary key,
  referencia  text not null unique,
  tipo        text not null check (tipo in ('contact', 'quote')),
  nombre      text not null,
  email       text not null,
  telefono    text,
  empresa     text,              -- razon social en las cotizaciones
  rut         text,              -- opcional
  asunto      text,
  mensaje     text,
  servicio    text,
  productos   jsonb,
  total       numeric,
  estado      text not null default 'nuevo',
  ip          text,
  user_agent  text,
  kommo_lead_id bigint,          -- vacio si Kommo no esta configurado o fallo
  kommo_estado text,             -- creado, no_configurado, sin_respuesta, sin_id o http_<codigo> (http_401 = token vencido)
  datos       jsonb not null,
  creado_en   timestamptz not null default now()
);

-- Por si la tabla ya se habia creado con la version anterior de este script
alter table public.leads_web add column if not exists kommo_lead_id bigint;
alter table public.leads_web add column if not exists rut text;
alter table public.leads_web add column if not exists kommo_estado text;

-- RLS activo y sin politicas para anon: nadie lee ni escribe la tabla directamente con la clave publicable
alter table public.leads_web enable row level security;
revoke all on public.leads_web from anon;

-- Lectura desde la intranet: solo usuarios con sesion iniciada (rol authenticated).
-- Supone que en la intranet solo inician sesion usuarios internos (sin registro publico);
-- si no, restringir por rol/email en el using.
drop policy if exists "intranet lee leads" on public.leads_web;
create policy "intranet lee leads" on public.leads_web for select to authenticated using (true);
-- Para cambiar el estado de un lead desde la intranet (pendiente de decidir):
-- create policy "intranet actualiza estado" on public.leads_web for update to authenticated using (true) with check (true);

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table if not exists privado.config_api (
  clave text primary key,
  valor text not null
);
revoke all on privado.config_api from public, anon, authenticated;

create or replace function public.registrar_lead_web(p_token text, p_lead jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  select valor into v_hash from privado.config_api where clave = 'lead_web_token_sha256';
  if v_hash is null
     or encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') <> v_hash then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  insert into public.leads_web (
    referencia, tipo, nombre, email, telefono, empresa, rut, asunto, mensaje,
    servicio, productos, total, ip, user_agent, kommo_lead_id, kommo_estado, datos
  ) values (
    p_lead->>'referencia',
    p_lead->>'tipo',
    p_lead->>'nombre',
    p_lead->>'email',
    nullif(p_lead->>'telefono', ''),
    nullif(p_lead->>'empresa', ''),
    nullif(p_lead->>'rut', ''),
    nullif(p_lead->>'asunto', ''),
    nullif(p_lead->>'mensaje', ''),
    nullif(p_lead->>'servicio', ''),
    p_lead->'productos',
    (p_lead->>'total')::numeric,
    p_lead->>'ip',
    left(p_lead->>'user_agent', 500),
    (p_lead->>'kommo_lead_id')::bigint,
    p_lead->>'kommo_estado',
    coalesce(p_lead->'datos', '{}'::jsonb)
  )
  on conflict (referencia) do nothing;

  return p_lead->>'referencia';
end;
$$;

revoke all on function public.registrar_lead_web(text, jsonb) from public, authenticated;
grant execute on function public.registrar_lead_web(text, jsonb) to anon;

-- Generar el token de la API (o rotarlo). Copiar el valor que devuelve a
-- api/config/supabase.php en el servidor; en la base solo queda su hash.
with t as (
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') as token
), guardado as (
  insert into privado.config_api (clave, valor)
  select 'lead_web_token_sha256', encode(sha256(convert_to(token, 'UTF8')), 'hex') from t
  on conflict (clave) do update set valor = excluded.valor
)
select token as copiar_a_supabase_php from t;
