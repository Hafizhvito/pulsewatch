import { AuthForm } from "@/components/auth-form";
export default function Login() {
  return (
    <div className="auth-box">
      <div className="eyebrow">WORKSPACE ACCESS</div>
      <h1>Sign in</h1>
      <p>Access your monitors and incident history.</p>
      <AuthForm />
    </div>
  );
}
