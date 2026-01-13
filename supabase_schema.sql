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
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

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
  for all using (auth.uid() = user_id);

-- FINANCE TABLE
create table finance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null, -- 'income' or 'expense'
  category text,
  value numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  recurring boolean default false,
  notes text,
  payment_method text,
  classification text,
  linked_event_id text,
  is_forecast boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table finance enable row level security;

create policy "Users can CRUD own finance" on finance
  for all using (auth.uid() = user_id);

-- MEDICATIONS TABLE
create table medications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  person text,
  dosage text,
  frequency text,
  stock integer default 0,
  min_stock integer default 0,
  last_taken timestamp with time zone,
  is_active boolean default true,
  alarm_config jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table medications enable row level security;

create policy "Users can CRUD own medications" on medications
  for all using (auth.uid() = user_id);

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
  for all using (auth.uid() = user_id);

-- Function to handle new user profile creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, house_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'Minha Casa');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
