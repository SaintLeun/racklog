-- Link al diseño del cliente como columna visible en leads_web (04-11-2026)
--
-- Revisar antes con quien mantiene la intranet. Este script NO reemplaza registrar_lead_web (la base real
-- puede tener su propia version): agrega una columna y un trigger que la llena desde datos->>'linkDiseno',
-- que la API ya envia hoy dentro de `datos`. Se puede volver a ejecutar sin efectos secundarios.
--
-- El link abre el diseño en 3D, tal como lo dejo el cliente:
--   https://racklog.cl/planifica-tu-bodega/disena?d=...&recorrido=1   (Planifica tu bodega: con boton de video)
--   https://racklog.cl/planificador?d=...                            (planificador 3D)
-- Leads de contacto y cotizaciones sin diseño: queda vacio.

alter table public.leads_web add column if not exists link_diseno text;

create or replace function privado.leads_web_link_diseno()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Solo links de racklog.cl (la API ya los valida; esto es una segunda barrera)
  if new.link_diseno is null and (new.datos->>'linkDiseno') ~ '^https://(www\.)?racklog\.cl/' then
    new.link_diseno := new.datos->>'linkDiseno';
  end if;
  return new;
end;
$$;

drop trigger if exists leads_web_link_diseno on public.leads_web;
create trigger leads_web_link_diseno
  before insert on public.leads_web
  for each row execute function privado.leads_web_link_diseno();

-- Leads que ya llegaron con link
update public.leads_web
set link_diseno = datos->>'linkDiseno'
where link_diseno is null
  and (datos->>'linkDiseno') ~ '^https://(www\.)?racklog\.cl/';
