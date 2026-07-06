import type { Metadata } from "next"
import Link from "next/link"
import { LoginCard } from "@/components/auth/login-card"

export const metadata: Metadata = {
  title: "Sign in — Vantage",
  description: "Sign in to your Vantage account.",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <Link href="/" className="mb-10">
        <span className="font-serif text-lg font-medium tracking-tight">Vantage</span>
      </Link>
      <LoginCard />
    </main>
  )
}
