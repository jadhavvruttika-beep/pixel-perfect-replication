-- ROLES
create type public.app_role as enum ('customer','staff','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  address text,
  city text,
  state text,
  pincode text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff_or_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('staff','admin'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.is_staff_or_admin(auth.uid()));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_staff_or_admin(auth.uid()));
create policy "self customer role" on public.user_roles for insert to authenticated with check (user_id = auth.uid() and role = 'customer');
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- CATALOG
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  icon text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "categories public read" on public.categories for select to anon, authenticated using (true);
create policy "categories admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  brand text,
  sku text not null unique,
  price numeric(10,2) not null check (price >= 0),
  discount_price numeric(10,2) check (discount_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  minimum_stock integer not null default 10 check (minimum_stock >= 0),
  unit text not null default '1 kg',
  image_url text,
  rating numeric(2,1) not null default 4.3,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create index products_name_idx on public.products(name);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products public read" on public.products for select to anon, authenticated using (true);
create policy "products admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "products staff update" on public.products for update to authenticated using (public.is_staff_or_admin(auth.uid())) with check (public.is_staff_or_admin(auth.uid()));

-- CART / WISHLIST / ADDRESSES
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "own cart" on public.cart_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.wishlist to authenticated;
grant all on public.wishlist to service_role;
alter table public.wishlist enable row level security;
create policy "own wishlist" on public.wishlist for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.addresses to authenticated;
grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff read addresses" on public.addresses for select to authenticated using (public.is_staff_or_admin(auth.uid()));

-- ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('FC' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  user_id uuid not null references auth.users(id) on delete cascade,
  address_id uuid references public.addresses(id) on delete set null,
  shipping_address jsonb,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_charge numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  coupon_code text,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending',
  order_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.is_staff_or_admin(auth.uid()));
create policy "own orders insert" on public.orders for insert to authenticated with check (user_id = auth.uid());
create policy "orders update" on public.orders for update to authenticated using (user_id = auth.uid() or public.is_staff_or_admin(auth.uid())) with check (user_id = auth.uid() or public.is_staff_or_admin(auth.uid()));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null,
  total numeric(10,2) not null,
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "order items read" on public.order_items for select to authenticated using (
  public.is_staff_or_admin(auth.uid()) or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "order items insert" on public.order_items for insert to authenticated with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null default 'percent',
  discount_value numeric(10,2) not null,
  minimum_order numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  expiry_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
grant select on public.coupons to anon;
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "coupons read" on public.coupons for select to anon, authenticated using (true);
create policy "coupons admin write" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null,
  quantity integer not null,
  previous_stock integer not null,
  new_stock integer not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
grant select, insert on public.inventory_transactions to authenticated;
grant all on public.inventory_transactions to service_role;
alter table public.inventory_transactions enable row level security;
create policy "inv staff read" on public.inventory_transactions for select to authenticated using (public.is_staff_or_admin(auth.uid()));
create policy "inv staff insert" on public.inventory_transactions for insert to authenticated with check (public.is_staff_or_admin(auth.uid()));

-- PLACE ORDER RPC (transactional, decrements stock)
create or replace function public.place_order(
  _address_id uuid,
  _payment_method text,
  _coupon_code text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _order_id uuid;
  _subtotal numeric(10,2) := 0;
  _discount numeric(10,2) := 0;
  _delivery numeric(10,2) := 0;
  _addr record;
  _c record;
  _item record;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  select * into _addr from public.addresses where id = _address_id and user_id = _uid;
  if _addr is null then raise exception 'Invalid delivery address'; end if;

  if not exists (select 1 from public.cart_items where user_id = _uid) then
    raise exception 'Cart is empty';
  end if;

  for _item in
    select c.quantity, p.id, p.name, p.stock_quantity, coalesce(p.discount_price, p.price) as unit_price
    from public.cart_items c join public.products p on p.id = c.product_id
    where c.user_id = _uid
  loop
    if _item.stock_quantity < _item.quantity then
      raise exception 'Insufficient stock for %', _item.name;
    end if;
    _subtotal := _subtotal + (_item.unit_price * _item.quantity);
  end loop;

  if _coupon_code is not null and length(trim(_coupon_code)) > 0 then
    select * into _c from public.coupons
      where upper(code) = upper(trim(_coupon_code)) and status = 'active'
        and (expiry_date is null or expiry_date >= current_date);
    if _c is null then raise exception 'Invalid or expired coupon'; end if;
    if _subtotal < _c.minimum_order then
      raise exception 'Coupon requires a minimum order of %', _c.minimum_order;
    end if;
    if _c.discount_type = 'percent' then
      _discount := round(_subtotal * _c.discount_value / 100, 2);
      if _c.max_discount is not null and _discount > _c.max_discount then _discount := _c.max_discount; end if;
    else
      _discount := _c.discount_value;
    end if;
  end if;

  if (_subtotal - _discount) < 500 then _delivery := 40; end if;

  insert into public.orders (user_id, address_id, shipping_address, subtotal, discount, delivery_charge, total_amount, coupon_code, payment_method, payment_status, order_status)
  values (_uid, _address_id,
    jsonb_build_object('full_name',_addr.full_name,'phone',_addr.phone,'address_line',_addr.address_line,'city',_addr.city,'state',_addr.state,'pincode',_addr.pincode),
    _subtotal, _discount, _delivery, _subtotal - _discount + _delivery, nullif(trim(coalesce(_coupon_code,'')),''),
    _payment_method, case when _payment_method = 'cod' then 'pending' else 'paid' end, 'pending')
  returning id into _order_id;

  insert into public.order_items (order_id, product_id, product_name, quantity, price, total)
  select _order_id, p.id, p.name, c.quantity, coalesce(p.discount_price, p.price), coalesce(p.discount_price, p.price) * c.quantity
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = _uid;

  insert into public.inventory_transactions (product_id, type, quantity, previous_stock, new_stock, note, created_by)
  select p.id, 'sale', c.quantity, p.stock_quantity, p.stock_quantity - c.quantity, 'Order placed', _uid
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = _uid;

  update public.products p set stock_quantity = p.stock_quantity - c.quantity, updated_at = now()
  from public.cart_items c where c.product_id = p.id and c.user_id = _uid;

  delete from public.cart_items where user_id = _uid;

  return _order_id;
end;
$$;
grant execute on function public.place_order(uuid, text, text) to authenticated;

-- SEED CATEGORIES
insert into public.categories (name, slug, description, icon) values
 ('Fruits','fruits','Fresh seasonal fruits','🍎'),
 ('Vegetables','vegetables','Farm fresh vegetables','🥕'),
 ('Dairy & Eggs','dairy-eggs','Milk, curd, paneer and eggs','🥛'),
 ('Bakery','bakery','Bread, buns and cakes','🍞'),
 ('Rice & Grains','rice-grains','Rice, poha and grains','🍚'),
 ('Pulses & Lentils','pulses-lentils','Dals and pulses','🫘'),
 ('Atta & Flour','atta-flour','Wheat flour and besan','🌾'),
 ('Spices','spices','Everyday Indian masalas','🌶️'),
 ('Cooking Oil','cooking-oil','Refined and mustard oils','🫒'),
 ('Snacks','snacks','Chips, namkeen and biscuits','🍪'),
 ('Beverages','beverages','Juices and soft drinks','🥤'),
 ('Tea & Coffee','tea-coffee','Tea leaves and coffee','☕'),
 ('Packaged Foods','packaged-foods','Noodles, pasta and sauces','🥫'),
 ('Personal Care','personal-care','Soaps, shampoo and care','🧴'),
 ('Household Essentials','household-essentials','Cleaning and home care','🧹');

-- SEED PRODUCTS
insert into public.products (category_id, name, description, brand, sku, price, discount_price, stock_quantity, minimum_stock, unit, rating)
select c.id, v.name, v.description, v.brand, v.sku, v.price, v.discount_price, v.stock, v.min_stock, v.unit, v.rating
from (values
 ('fruits','Fresh Apples','Crisp Shimla apples, hand picked.','Farm Fresh','FC-APL-001',220,179,80,15,'1 kg',4.5),
 ('fruits','Bananas','Naturally ripened robusta bananas.','Farm Fresh','FC-BAN-002',60,49,120,20,'1 dozen',4.3),
 ('fruits','Pomegranate','Juicy Bhagwa pomegranates.','Farm Fresh','FC-POM-003',180,null,35,10,'1 kg',4.4),
 ('vegetables','Tomatoes','Fresh red hybrid tomatoes.','Daily Harvest','FC-TOM-004',40,32,140,25,'1 kg',4.2),
 ('vegetables','Potatoes','Everyday cooking potatoes.','Daily Harvest','FC-POT-005',35,null,200,30,'1 kg',4.1),
 ('vegetables','Onions','Nashik red onions.','Daily Harvest','FC-ONI-006',45,38,8,20,'1 kg',4.0),
 ('vegetables','Green Capsicum','Fresh crunchy capsicum.','Daily Harvest','FC-CAP-007',70,null,45,10,'500 g',4.2),
 ('dairy-eggs','Toned Milk','Pasteurised toned milk pouch.','Amul','FC-MLK-008',28,null,160,40,'500 ml',4.6),
 ('dairy-eggs','Fresh Curd','Thick and creamy dahi.','Amul','FC-CRD-009',45,39,70,20,'400 g',4.5),
 ('dairy-eggs','Paneer','Soft malai paneer block.','Amul','FC-PNR-010',95,85,0,10,'200 g',4.7),
 ('dairy-eggs','Farm Eggs','Protein rich white eggs.','Eggoz','FC-EGG-011',84,75,60,15,'6 pcs',4.4),
 ('bakery','Whole Wheat Bread','Soft 100% atta bread loaf.','Britannia','FC-BRD-012',50,45,55,15,'400 g',4.3),
 ('bakery','Pav Buns','Fresh ladi pav.','Modern','FC-PAV-013',40,null,30,10,'6 pcs',4.1),
 ('rice-grains','Basmati Rice','Aged long grain basmati.','India Gate','FC-RIC-014',620,549,40,10,'5 kg',4.7),
 ('rice-grains','Sona Masoori Rice','Everyday cooking rice.','Daawat','FC-RIC-015',420,null,25,10,'5 kg',4.2),
 ('rice-grains','Poha','Thick beaten rice flakes.','Fortune','FC-POH-016',65,55,60,15,'1 kg',4.1),
 ('pulses-lentils','Toor Dal','Premium unpolished toor dal.','Tata Sampann','FC-TDL-017',180,165,50,15,'1 kg',4.5),
 ('pulses-lentils','Moong Dal','Split yellow moong dal.','Tata Sampann','FC-MDL-018',150,null,6,15,'1 kg',4.3),
 ('pulses-lentils','Chana Dal','Protein rich chana dal.','Tata Sampann','FC-CDL-019',110,99,44,12,'1 kg',4.2),
 ('atta-flour','Whole Wheat Flour','Chakki fresh atta.','Aashirvaad','FC-ATA-020',260,239,65,20,'5 kg',4.6),
 ('atta-flour','Besan','Fine gram flour.','Rajdhani','FC-BSN-021',85,null,40,12,'500 g',4.2),
 ('spices','Turmeric Powder','Pure haldi powder.','Everest','FC-TRM-022',65,58,90,20,'200 g',4.4),
 ('spices','Red Chilli Powder','Spicy lal mirch powder.','Everest','FC-RCP-023',95,null,70,20,'200 g',4.3),
 ('spices','Garam Masala','Aromatic blended masala.','MDH','FC-GRM-024',85,75,4,10,'100 g',4.5),
 ('cooking-oil','Sunflower Oil','Refined sunflower oil.','Fortune','FC-OIL-025',1150,1089,30,10,'5 L',4.4),
 ('cooking-oil','Mustard Oil','Kachi ghani mustard oil.','Dhara','FC-OIL-026',185,null,38,10,'1 L',4.2),
 ('snacks','Marie Gold Biscuits','Light tea-time biscuits.','Britannia','FC-BIS-027',45,39,120,25,'250 g',4.3),
 ('snacks','Classic Salted Chips','Crunchy potato chips.','Lays','FC-CHP-028',30,null,95,25,'52 g',4.1),
 ('snacks','Aloo Bhujia','Spicy namkeen mixture.','Haldiram','FC-BHJ-029',55,49,0,15,'200 g',4.4),
 ('beverages','Soft Drink','Chilled cola bottle.','Coca-Cola','FC-SFT-030',65,59,80,20,'1.25 L',4.0),
 ('beverages','Orange Juice','No added sugar juice.','Real','FC-JUS-031',120,105,45,15,'1 L',4.3),
 ('tea-coffee','Premium Tea Leaves','Strong assam tea.','Tata Tea','FC-TEA-032',270,249,50,15,'500 g',4.6),
 ('tea-coffee','Instant Coffee','Rich roasted coffee.','Nescafe','FC-COF-033',330,299,9,10,'100 g',4.5),
 ('packaged-foods','Instant Noodles','Masala noodles pack.','Maggi','FC-NDL-034',72,65,110,25,'4 x 70 g',4.4),
 ('packaged-foods','Tomato Ketchup','Thick tangy ketchup.','Kissan','FC-KET-035',120,109,40,12,'950 g',4.3),
 ('personal-care','Bathing Soap','Moisturising soap bar.','Dove','FC-SOP-036',180,159,60,15,'4 x 100 g',4.5),
 ('personal-care','Anti-Dandruff Shampoo','Gentle daily shampoo.','Head & Shoulders','FC-SHM-037',360,325,28,10,'650 ml',4.4),
 ('household-essentials','Detergent Powder','Tough stain removal.','Surf Excel','FC-DET-038',420,389,35,12,'4 kg',4.5),
 ('household-essentials','Dishwash Gel','Lemon dishwash liquid.','Vim','FC-DSH-039',215,199,42,12,'1.8 L',4.3),
 ('household-essentials','Floor Cleaner','Disinfectant floor cleaner.','Lizol','FC-FLR-040',195,null,3,10,'975 ml',4.2)
) as v(cat, name, description, brand, sku, price, discount_price, stock, min_stock, unit, rating)
join public.categories c on c.slug = v.cat;

insert into public.coupons (code, discount_type, discount_value, minimum_order, max_discount, expiry_date) values
 ('FRESH10','percent',10,300,150,'2030-12-31'),
 ('SAVE50','fixed',50,500,null,'2030-12-31'),
 ('BIG20','percent',20,1500,400,'2030-12-31');
