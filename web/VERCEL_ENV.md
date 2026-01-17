# Vercel Environment Variables

Copy these values to Vercel > Settings > Environment Variables.

## Core
NEXT_PUBLIC_SUPABASE_URL= (Get from Supabase Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY= (Get from Supabase Settings > API)
SUPABASE_SERVICE_ROLE_KEY= (Get from Supabase Settings > API - Required for specific server-side ops)

## LINE Integration (LINE Messaging API)
# Get these from LINE Developers Console (https://developers.line.biz/)
LINE_CHANNEL_ACCESS_TOKEN= (Channel > Messaging API > Channel access token (long-lived))
LINE_USER_ID= (Channel > Basic settings > Your User ID)

## App Config
# CRON_SECRET= (Optional: if you implement cron protection)
