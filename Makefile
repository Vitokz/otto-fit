generate_types:
	supabase migration up
	supabase gen types typescript --local > src/types/database.types.ts

link-stage:
	supabase link --project-ref dsoiseqhlivifbbgxnoa

link-prod:
	supabase link --project-ref zjzsxyovbkkxikgnostg

deploy_functions:
	supabase functions deploy telegram-auth

init:
	supabase start