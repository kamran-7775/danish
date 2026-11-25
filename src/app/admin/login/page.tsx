import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="login">
      <div className="login__card">
        <p className="login__logo">
          DN<span>♣</span>
        </p>
        <h1 className="login__title">Portfolio admin</h1>
        <p className="adm-hint">Manage your projects, videos, behind-the-scenes and showreel.</p>
        <LoginForm />
      </div>
    </main>
  );
}
