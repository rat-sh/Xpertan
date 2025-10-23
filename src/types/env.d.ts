// src/types/env.d.ts
declare module 'react-native-config' {
  export interface Config {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
  }
  const Config: Config;
  export default Config;
}