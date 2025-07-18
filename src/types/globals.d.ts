// Global type declarations

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
      SUPABASE_SERVICE_ROLE_KEY: string
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
      STRIPE_SECRET_KEY: string
      STRIPE_WEBHOOK_SECRET: string
      NETS_MERCHANT_ID: string
      NETS_SECRET_KEY: string
      AIXPLAIN_API_KEY: string
      AIXPLAIN_TEAM_ID: string
    }
  }
}

export {}
