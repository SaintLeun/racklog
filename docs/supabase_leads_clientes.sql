-- Vincula cada lead del sitio con la tabla clientes de la intranet (proyecto cierre-mes-intranet)
--
-- Ejecutar una vez en Supabase > SQL Editor, DESPUES de docs/supabase_leads_web.sql.
-- No regenera el token de la API. Se puede volver a ejecutar sin efectos secundarios.
--
-- Regla: el lead se vincula solo si su email coincide (sin mayusculas ni espacios) con
-- exactamente UN cliente. Sin coincidencia, cliente_id queda vacio. Con varias (raro),
-- tambien queda vacio y el lead entra con estado 'revisar_cliente' para elegirlo a mano:
-- un vinculo vacio se detecta y completa; uno equivocado no.
-- El sitio nunca crea clientes; eso se hace desde la intranet.

alter table public.leads_web
  add column if not exists cliente_id int references public.clientes(id) on delete set null;

create index if not exists leads_web_cliente_id_idx on public.leads_web (cliente_id);

-- Busqueda por email normalizado (tambien sirve a la intranet)
create index if not exists clientes_email_normalizado_idx
  on public.clientes (lower(btrim(email))) where email is not null;

-- Cuantos clientes tienen ese email (0, 1 o 2 = "mas de uno")
create or replace function privado.coincidencias_cliente(p_email text)
returns int
language sql
stable
set search_path = ''
as $$
  select count(*)::int from (
    select 1 from public.clientes
    where lower(btrim(email)) = lower(btrim(p_email))
    limit 2
  ) c;
$$;

-- Devuelve el id del cliente si el email coincide con uno solo; si no, null
create or replace function privado.cliente_unico_por_email(p_email text)
returns int
language sql
stable
set search_path = ''
as $$
  select case when privado.coincidencias_cliente(p_email) = 1 then
    (select id from public.clientes where lower(btrim(email)) = lower(btrim(p_email)))
  end;
$$;
revoke all on function privado.coincidencias_cliente(text) from public, anon, authenticated;
revoke all on function privado.cliente_unico_por_email(text) from public, anon, authenticated;

create or replace function public.registrar_lead_web(p_token text, p_lead jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_coincidencias int;
begin
  select valor into v_hash from privado.config_api where clave = 'lead_web_token_sha256';
  if v_hash is null
     or encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') <> v_hash then
    raise exception 'no autorizado' using errcode = '42501';
  end if;

  v_coincidencias := privado.coincidencias_cliente(p_lead->>'email');

  insert into public.leads_web (
    referencia, tipo, nombre, email, telefono, empresa, asunto, mensaje,
    servicio, productos, total, ip, user_agent, kommo_lead_id, cliente_id, estado, datos
  ) values (
    p_lead->>'referencia',
    p_lead->>'tipo',
    p_lead->>'nombre',
    p_lead->>'email',
    nullif(p_lead->>'telefono', ''),
    nullif(p_lead->>'empresa', ''),
    nullif(p_lead->>'asunto', ''),
    nullif(p_lead->>'mensaje', ''),
    nullif(p_lead->>'servicio', ''),
    p_lead->'productos',
    (p_lead->>'total')::numeric,
    p_lead->>'ip',
    left(p_lead->>'user_agent', 500),
    (p_lead->>'kommo_lead_id')::bigint,
    privado.cliente_unico_por_email(p_lead->>'email'),
    case when v_coincidencias > 1 then 'revisar_cliente' else 'nuevo' end,
    coalesce(p_lead->'datos', '{}'::jsonb)
  )
  on conflict (referencia) do nothing;

  return p_lead->>'referencia';
end;
$$;

revoke all on function public.registrar_lead_web(text, jsonb) from public, authenticated;
grant execute on function public.registrar_lead_web(text, jsonb) to anon;

-- Vincular los leads que ya existen (o marcarlos si el email es de varios clientes)
update public.leads_web l
set cliente_id = privado.cliente_unico_por_email(l.email)
where l.cliente_id is null
  and privado.cliente_unico_por_email(l.email) is not null;

update public.leads_web l
set estado = 'revisar_cliente'
where l.cliente_id is null
  and l.estado = 'nuevo'
  and privado.coincidencias_cliente(l.email) > 1;
