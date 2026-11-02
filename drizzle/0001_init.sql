create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('owner', 'developer')),
  created_at timestamptz not null default now()
);

create table if not exists login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references admin_users(id) on delete set null,
  email text not null,
  role text not null,
  expires_at timestamptz not null,
  device_label text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  intro text not null default '',
  image_url text,
  sort_order integer not null default 0,
  field_schema jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  description text not null default '',
  price_minor integer,
  compare_price_minor integer,
  currency text not null default 'USD',
  category_id uuid references categories(id) on delete set null,
  condition text not null default '',
  quantity integer,
  sku text,
  attributes jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'sold', 'hidden')),
  publish_at timestamptz,
  featured boolean not null default false,
  show_in_studio boolean not null default true,
  sort_order integer not null default 0,
  internal_notes text not null default '',
  source_hash text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  width integer,
  height integer,
  blur_data text,
  focal_x numeric not null default 0.5,
  focal_y numeric not null default 0.5,
  alt text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  intro text not null default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists collection_products (
  collection_id uuid not null references collections(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists page_sections (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  type text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  consent_note text not null default '',
  photo_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  name text not null,
  contact text not null,
  message text not null,
  gift_note text not null default '',
  quantity integer,
  bulk boolean not null default false,
  status text not null default 'new' check (status in ('new', 'replied', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  product_id uuid,
  path text,
  day_hash text,
  term text,
  created_at timestamptz not null default now()
);

create table if not exists product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  snapshot jsonb not null,
  label text not null default '',
  changed_by text,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (bucket, window_start)
);

create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_status_idx on products (status) where deleted_at is null;
create index if not exists products_title_trgm on products using gin (title gin_trgm_ops);
create index if not exists product_images_order_idx on product_images (product_id, sort_order);
create index if not exists events_created_idx on events (created_at);
create index if not exists enquiries_status_idx on enquiries (status, created_at desc);
