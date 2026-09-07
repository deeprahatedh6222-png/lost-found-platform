const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const run = async () => {
  console.log('Clearing existing data...');

  await supabase.from('claims').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const password = await bcrypt.hash('password123', 12);

  const { data: alice, error: aliceErr } = await supabase
    .from('users')
    .insert({ name: 'Alice Reporter', email: 'alice@example.com', password })
    .select('id')
    .single();
  if (aliceErr) throw aliceErr;

  const { data: bob, error: bobErr } = await supabase
    .from('users')
    .insert({ name: 'Bob Finder', email: 'bob@example.com', password })
    .select('id')
    .single();
  if (bobErr) throw bobErr;

  const { data: items, error: itemsErr } = await supabase
    .from('items')
    .insert([
      {
        user_id: alice.id,
        item_type: 'lost',
        title: 'Black wireless earbuds case',
        description: 'Small matte black charging case. Last seen near the college library reading area.',
        category: 'Electronics',
        location: 'College Library',
        event_date: new Date().toISOString().slice(0, 10),
        status: 'open',
        image_url: ''
      },
      {
        user_id: bob.id,
        item_type: 'found',
        title: 'Student ID card',
        description: 'Found near the main canteen. The personal details are intentionally not posted publicly.',
        category: 'Documents',
        location: 'Main Canteen',
        event_date: new Date().toISOString().slice(0, 10),
        status: 'open',
        image_url: ''
      },
      {
        user_id: alice.id,
        item_type: 'lost',
        title: 'Blue water bottle',
        description: 'Metal bottle with a small sticker near the cap.',
        category: 'Other',
        location: 'Sports Ground',
        event_date: new Date().toISOString().slice(0, 10),
        status: 'resolved',
        image_url: ''
      }
    ])
    .select('id');

  if (itemsErr) throw itemsErr;

  console.log(`Seed complete: ${items.length} items created.`);
  console.log('Demo users: alice@example.com / password123 and bob@example.com / password123');
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
