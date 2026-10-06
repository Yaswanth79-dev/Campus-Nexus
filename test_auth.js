const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const url = env['NEXT_PUBLIC_SUPABASE_URL'];
const key = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function test() {
  const email = `testuser${Math.floor(Math.random()*100000)}@gmail.com`;
  const password = 'SecurePassword123!';
  
  console.log(`Testing Email Registration with malicious metadata for ${email}...`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'hod',
        department: 'ECE',
        full_name: 'Test Malicious User'
      }
    }
  });

  if (error) {
    console.error('Signup error:', error.message);
    return;
  }

  console.log('Signup successful. Waiting 2 seconds for trigger to complete...');
  await new Promise(r => setTimeout(r, 2000));

  console.log('Fetching profile...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError.message);
  } else {
    console.log('Profile:', profile);
  }

  console.log('Fetching student record...');
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (studentError) {
    console.error('Student fetch error:', studentError.message);
  } else {
    console.log('Student:', student);
  }
}

test();
