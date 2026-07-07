import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordCard } from "@/components/auth/forgot-password-card"

export const metadata: Metadata = {
  title: "Reset your password · Vantage",
  description: "Request a password reset link for your Vantage account.",
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <Link href="/" className="mb-10">
        <span className="font-serif text-lg font-medium tracking-tight">Vantage</span>
      </Link>
      <ForgotPasswordCard />
    </main>
  )
}
