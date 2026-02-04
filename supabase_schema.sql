-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  birth_date date,
  phone text,
  house_name text,
  profile_image text,
  theme text default 'light',
  address_street text,
  address_number text,
  address_city text,
  address_state text,
  address_zip text,
  alarm_settings jsonb default '{"soundType": "standard", "vibrationEnabled": true, "vibrationIntensity": "medium", "notificationsEnabled": true}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can upsert own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- TASKS TABLE
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  responsible text,
  due_date timestamp with time zone,
  recurrence text,
  status text default 'pending',
  priority text default 'medium',
  points integer default 0,
  alarm_config jsonb default '{"enabled": false, "sound": true, "vibration": true, "triggered": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table tasks enable row level security;

create policy "Users can CRUD own tasks" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CREDIT CARDS TABLE (must be created before FINANCE)
create table credit_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  owner text not null,
  card_type text,
  last_four_digits text,
  color text default '#6366f1',
  is_active boolean default true,
  closing_day integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table credit_cards enable row level security;

create policy "Users can CRUD own credit cards" on credit_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FINANCE TABLE
create table finance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  category text,
  value numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  recurring boolean default false,
  notes text,
  payment_method text,
  classification text,
  linked_event_id text,
  credit_card_id uuid references credit_cards on delete set null,
  is_forecast boolean default false,
  is_installment boolean default false,
  installment_count integer,
  installment_number integer,
  original_transaction_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table finance enable row level security;

create policy "Users can CRUD own finance" on finance
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MEDICATIONS TABLE
create table medications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  person text,
  dosage text,
  frequency text,
  stock_quantity integer default 0,
  min_stock integer default 0,
  last_taken timestamp with time zone,
  is_active boolean default true,
  first_dose_time text,
  first_dose_date date,
  alarm_config jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table medications enable row level security;

create policy "Users can CRUD own medications" on medications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SHOPPING ITEMS TABLE
create table shopping_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text,
  list_name text,
  quantity numeric default 1,
  unit text,
  is_purchased boolean default false,
  auto_refill boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table shopping_items enable row level security;

create policy "Users can CRUD own shopping items" on shopping_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- INVESTMENTS TABLE
create table investments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  name text not null,
  symbol text,
  quantity numeric,
  purchase_price numeric,
  current_price numeric,
  total_invested numeric,
  current_value numeric,
  purchase_date date,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table investments enable row level security;

create policy "Users can CRUD own investments" on investments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FINANCIAL GOALS TABLE
create table financial_goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  target_date date,
  category text,
  priority text default 'medium',
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table financial_goals enable row level security;

create policy "Users can CRUD own financial goals" on financial_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MEDICATION DOSES TABLE (Histórico de doses tomadas)
create table medication_doses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  medication_id uuid references medications on delete cascade not null,
  taken_at timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table medication_doses enable row level security;

create policy "Users can CRUD own medication doses" on medication_doses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
