@AGENTS.md

# Blanka Project Rules

## Testing
All new features require at least one test in `__tests__/`.
Do not modify existing tests to make them pass — fix the implementation instead.

## Database
Never use raw SQL queries in components. Always use the Supabase client (`createClient()`).
Never commit `.env.local` or any file containing API keys.

## Code Quality
All functions that interact with Supabase must handle errors and show them to the user.
