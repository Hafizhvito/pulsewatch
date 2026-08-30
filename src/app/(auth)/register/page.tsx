import { AuthForm } from "@/components/auth-form";
export default function Register() {
  return (
    <div className="auth-box">
      <div className="eyebrow">REGISTRATION</div>
      <h1>Create an account</h1>
      <p>Register to configure and manage your monitors.</p>
      <AuthForm register />
    </div>
  );
}
