"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (register) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error ?? "Unable to register.");
        }
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error)
        throw new Error(
          register
            ? "Account created. Please sign in to continue."
            : "Email or password is incorrect, or too many attempts. Please try again.",
        );
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign in.");
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="auth-form">
      {register && (
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={80}
            placeholder="Alex Morgan"
            required
          />
        </label>
      )}
      <label>
        Email address
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          maxLength={254}
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={register ? "new-password" : "current-password"}
          minLength={register ? 10 : 1}
          maxLength={72}
          placeholder={
            register ? "At least 10 characters" : "Enter your password"
          }
          required
        />
      </label>
      {register && (
        <label>
          Confirm password
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm your password"
            required
          />
        </label>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? (
          <LoaderCircle size={17} className="spin" />
        ) : (
          <ArrowRight size={17} />
        )}{" "}
        {pending
          ? "Please wait…"
          : register
            ? "Create account"
            : "Sign in to your workspace"}
      </button>
      <p className="auth-switch">
        {register ? "Already have an account?" : "New to PulseWatch?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
