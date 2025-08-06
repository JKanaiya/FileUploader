import { createClient } from "@supabase/supabase-js";
// Create Supabase client
const supabase = createClient(process.env.PROJECT_URL, process.env.API_KEY);

export default supabase;
