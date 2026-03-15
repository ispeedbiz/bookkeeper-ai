/**
 * BookkeeperAI Database Setup Script
 *
 * This script sets up the database schema on Supabase by executing SQL
 * via the Supabase Management API.
 *
 * Usage: node supabase/setup.mjs <SUPABASE_ACCESS_TOKEN>
 *
 * Get your access token from:
 * https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PROJECT_REF = 'ewkfsvmlylhsndyvfaip';
const ACCESS_TOKEN = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Please provide a Supabase access token.');
  console.error('   Get one from: https://supabase.com/dashboard/account/tokens');
  console.error('   Usage: node supabase/setup.mjs <token>');
  process.exit(1);
}

const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

async function runSQL(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL execution failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function seedAdmin() {
  // Create admin user via Supabase Auth Admin API
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3a2Zzdm1seWxoc25keXZmYWlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUxNzc0OCwiZXhwIjoyMDg5MDkzNzQ4fQ.29yIHUskr8RfMvLKhM9PfAS4yO5StJatfiqNb5g85yo';

  const res = await fetch(
    `https://ewkfsvmlylhsndyvfaip.supabase.co/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'catchjagdish@gmail.com',
        password: 'dilseI@1007',
        email_confirm: true,
        user_metadata: {
          full_name: 'Jagdish Lade',
          company_name: 'BookkeeperAI',
          role: 'admin',
        },
      }),
    }
  );

  const data = await res.json();
  if (res.ok) {
    console.log('✅ Admin user created:', data.id);

    // Update profile role to admin
    await runSQL(`UPDATE profiles SET role = 'admin', full_name = 'Jagdish Lade', company_name = 'BookkeeperAI' WHERE email = 'catchjagdish@gmail.com';`);
    console.log('✅ Admin role set');
  } else if (data.msg?.includes('already been registered') || data.message?.includes('already been registered')) {
    console.log('ℹ️  Admin user already exists');
    await runSQL(`UPDATE profiles SET role = 'admin', full_name = 'Jagdish Lade', company_name = 'BookkeeperAI' WHERE email = 'catchjagdish@gmail.com';`);
    console.log('✅ Admin role updated');
  } else {
    console.error('❌ Failed to create admin:', data);
  }
}

async function main() {
  console.log('🚀 Setting up BookkeeperAI database...\n');

  try {
    console.log('📋 Running schema SQL...');
    const result = await runSQL(sql);
    console.log('✅ Schema created successfully!\n');

    console.log('👤 Seeding admin user...');
    await seedAdmin();

    console.log('\n✅ Database setup complete!');
    console.log('   Admin login: catchjagdish@gmail.com / dilseI@1007');
    console.log('   Admin path: /admin/login');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
