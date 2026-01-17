-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (Extends Supabase Auth)
-- 儲存使用者的角色資訊 (boss, housekeeper)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('boss', 'housekeeper')) default 'housekeeper',
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. Rooms Table
-- 房源資訊，包含 iCal 連結
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  room_number text not null, -- 房號 (例如: 101, 201)
  room_type text, -- 房型 (例如: 雙人房, 四人房)
  status text check (status in ('clean', 'dirty', 'maintenance', 'occupied')) default 'clean',
  ical_booking_url text, -- Booking.com iCal 連結
  ical_agoda_url text, -- Agoda iCal 連結
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Rooms
alter table public.rooms enable row level security;
-- 老闆可以完整控制，房務員與客人只能讀取某些欄位 (暫時全開讀取)
create policy "Rooms are viewable by everyone." on rooms for select using (true);
create policy "Only boss can insert/update rooms." on rooms for all using (
  exists ( select 1 from profiles where id = auth.uid() and role = 'boss' )
);


-- 3. Bookings Table
-- 訂單資訊
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) not null,
  guest_name text not null,
  check_in_date date not null,
  check_out_date date not null,
  platform text check (platform in ('official', 'booking', 'agoda', 'walk-in', 'other')) default 'official',
  status text check (status in ('confirmed', 'cancelled', 'checked_in', 'checked_out')) default 'confirmed',
  original_uid text, -- 原始 iCal UID (用於同步比對避免重複)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Bookings
alter table public.bookings enable row level security;
create policy "Bookings are viewable by authenticated users." on bookings for select using (auth.role() = 'authenticated');
-- 老闆可操作所有
create policy "Boss can manage bookings." on bookings for all using (
  exists ( select 1 from profiles where id = auth.uid() and role = 'boss' )
);


-- 4. Tasks Table
-- 清掃任務
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id), -- 關聯的訂單 (如果是退房清掃)
  room_id uuid references public.rooms(id) not null,
  status text check (status in ('pending', 'accepted', 'completed', 'verified')) default 'pending',
  housekeeper_id uuid references public.profiles(id), -- 接單的房務員
  image_url text, -- 完成後的照片連結
  scheduled_date date not null, -- 預計清掃日期 (通常是退房日)
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Tasks
alter table public.tasks enable row level security;
create policy "Tasks viewable by authenticated users." on tasks for select using (auth.role() = 'authenticated');

-- 房務員可以 'update' 任務 (接單: 设置 housekeeper_id; 完成: 设置 status, photo_url)
-- 這邊簡化權限，允許登入用戶更新任務
create policy "Authenticated users can update tasks." on tasks for update using (auth.role() = 'authenticated');

-- 老闆可以新增刪除
create policy "Boss can manage tasks." on tasks for all using (
  exists ( select 1 from profiles where id = auth.uid() and role = 'boss' )
);


-- Function to handle new user signup
-- 當新使用者註冊時，自動在 profiles 表中建立一筆資料
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'housekeeper'); 
  -- 預設為房務員，老闆權限需手動在 DB 修改
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Setup Storage Bucket for Tasks
insert into storage.buckets (id, name, public) values ('tasks', 'tasks', true);

-- Storage Policies
create policy "Public Access to Tasks Images"
  on storage.objects for select
  using ( bucket_id = 'tasks' );

create policy "Authenticated users can upload task images"
  on storage.objects for insert
  with check ( bucket_id = 'tasks' and auth.role() = 'authenticated' );
