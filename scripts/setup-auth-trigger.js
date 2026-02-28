const { Client } = require("pg")

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
})

async function setupTrigger() {
  try {
    await client.connect()

    const createFunctionQuery = `
      create or replace function public.handle_new_user()
      returns trigger
      language plpgsql
      security definer set search_path = public
      as $$
      begin
        insert into public.profiles (id, email, username, created_at)
        values (
          new.id,
          new.email,
          new.raw_user_meta_data ->> 'username',
          now()
        );
        return new;
      end;
      $$;
    `

    const createTriggerQuery = `
      drop trigger if exists on_auth_user_created on auth.users;
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute procedure public.handle_new_user();
    `

    await client.query(createFunctionQuery)
    console.log("Function handle_new_user created/updated successfully.")

    await client.query(createTriggerQuery)
    console.log("Trigger on_auth_user_created created/updated successfully.")
  } catch (error) {
    console.error("Error setting up trigger:", error)
  } finally {
    await client.end()
  }
}

setupTrigger()
