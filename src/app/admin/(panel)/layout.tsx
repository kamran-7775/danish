import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { dbInfo } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import { logout } from "../actions";
import Sidebar from "@/components/admin/Sidebar";

export const dynamic = "force-dynamic";

/** Everything under /admin (except /admin/login) requires a signed-in admin. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const db = dbInfo();
  const storage = storageMode();

  return (
    <div className="panel">
      <aside className="side">
        <a href="/admin" className="side__brand">
          DN<span>♣</span> <small>Admin</small>
        </a>
        <Sidebar />
        <div className="side__foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="side__link">
            <span aria-hidden="true">↗</span>View site
          </a>
          <form action={logout}>
            <button type="submit" className="side__link side__logout">
              <span aria-hidden="true">↩</span>Sign out
            </button>
          </form>
          <p className="side__env">
            DB: <b>{db.kind === "local" ? "Local SQLite" : "Turso"}</b>
            <br />
            Uploads: <b>{storage === "blob" ? "Vercel Blob" : "Local disk"}</b>
          </p>
        </div>
      </aside>
      <main className="panel__main">{children}</main>
    </div>
  );
}
