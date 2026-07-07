import type { Metadata } from "next"
import Link from "next/link"
import { ResetPasswordCard } from "@/components/auth/reset-password-card"

export const metadata: Metadata = {
  title: "Set a new password · Vantage",
  description: "Set a new password for your Vantage account.",
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-16">
      <Link href="/" className="mb-10">
        <span className="font-serif text-lg font-medium tracking-tight">Vantage</span>
      </Link>
      <ResetPasswordCard />
    </main>
  )
}
