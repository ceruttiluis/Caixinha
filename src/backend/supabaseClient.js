require('dotenv').config(); 
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cbymtecijykciwtmpglp.supabase.co';

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNieW10ZWNpanlrY2l3dG1wZ2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMDQ4MTMsImV4cCI6MjA2ODY4MDgxM30.nLtn39vpwUcUmdPQnfqeNGWPku_C5EdpR1magZC9RQ4';

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNieW10ZWNpanlrY2l3dG1wZ2xwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEwNDgxMywiZXhwIjoyMDY4NjgwODEzfQ.AhR6C4DFbBqZbLbSQfjOAnEpAj3KmAicCPSF3y88HyY'; // ⚠️ substitua por sua service_role_key

const supabase = createClient(supabaseUrl, anonKey);

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

module.exports = { supabase, supabaseAdmin };