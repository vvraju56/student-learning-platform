const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  const email = "test@example.com"
  const password = "password123"
  const username = "testuser"

  console.log(`Creating test user: ${email} ...`)

  // Check if user exists first
  const { data: users, error: listError } = await supabase.auth.admin.listUsers()

  const existingUser = users?.users?.find((u) => u.email === email)

  if (existingUser) {
    console.log("User already exists. Updating password and confirming email...")
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: password,
      email_confirm: true,
      user_metadata: { username },
    })
    if (updateError) {
      console.error("Error updating user:", updateError.message)
    } else {
      console.log("User updated successfully!")
      console.log(`Email: ${email}`)
      console.log(`Password: ${password}`)
    }
    return
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm the user
    user_metadata: { username },
  })

  if (error) {
    console.error("Error creating user:", error.message)
  } else {
    console.log("Test user created successfully!")
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
  }
}

createTestUser()
