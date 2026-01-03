/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GEMINI_API_KEY: string
  readonly SUPABASE_URL: string
  readonly SUPABASE_ANON_KEY: string
  readonly ADOBE_CLIENT_ID?: string
  readonly ADOBE_CLIENT_SECRET?: string
  readonly ADOBE_ORGANIZATION_ID?: string
  readonly ADOBE_ACCOUNT_ID?: string
  readonly ADOBE_PRIVATE_KEY?: string
  readonly GAMMA_API_KEY?: string
  readonly OPENAI_API_KEY?: string
  readonly ANTHROPIC_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}