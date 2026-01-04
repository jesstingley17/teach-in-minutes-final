import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY),
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL),
      'import.meta.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY),
      // InsForge Backend API
      'import.meta.env.INSFORGE_API_URL': JSON.stringify(env.INSFORGE_API_URL || env.VITE_INSFORGE_API_URL),
      // Adobe PDF Services API
      'import.meta.env.ADOBE_CLIENT_ID': JSON.stringify(env.ADOBE_CLIENT_ID || env.VITE_ADOBE_CLIENT_ID),
      'import.meta.env.ADOBE_CLIENT_SECRET': JSON.stringify(env.ADOBE_CLIENT_SECRET || env.VITE_ADOBE_CLIENT_SECRET),
      'import.meta.env.ADOBE_ORGANIZATION_ID': JSON.stringify(env.ADOBE_ORGANIZATION_ID || env.VITE_ADOBE_ORGANIZATION_ID),
      'import.meta.env.ADOBE_ACCOUNT_ID': JSON.stringify(env.ADOBE_ACCOUNT_ID || env.VITE_ADOBE_ACCOUNT_ID),
      'import.meta.env.ADOBE_PRIVATE_KEY': JSON.stringify(env.ADOBE_PRIVATE_KEY || env.VITE_ADOBE_PRIVATE_KEY),
      // Gamma API
      'import.meta.env.GAMMA_API_KEY': JSON.stringify(env.GAMMA_API_KEY || env.VITE_GAMMA_API_KEY),
      // OpenAI API (for multi-provider support)
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY),
      // Anthropic/Claude API (for multi-provider support)
      'import.meta.env.ANTHROPIC_API_KEY': JSON.stringify(env.ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY),
    },
  }
})