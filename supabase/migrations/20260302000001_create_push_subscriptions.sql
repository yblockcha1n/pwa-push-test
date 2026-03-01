create table push_subscriptions (
  endpoint text primary key,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz default now()
);
