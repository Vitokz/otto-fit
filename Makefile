generate_types:
	supabase migration up
	supabase gen types typescript --local > src/types/database.types.ts

deploy_functions:
	supabase functions deploy telegram-auth

init:
	supabase start