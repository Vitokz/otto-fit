PROJECT_ID = zjzsxyovbkkxikgnostg

generate_types:
	supabase gen types typescript --project-id $(PROJECT_ID) > src/types/database.types.ts

deploy_functions:
	supabase functions deploy telegram-auth

init:
	supabase start