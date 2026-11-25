import Link from "next/link";
import { listBts } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import BtsForm from "@/components/admin/BtsForm";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function NewBtsPage({ searchParams }: { searchParams: Search }) {
  const { error } = await searchParams;
  const cats = Array.from(new Set(["Shoot", "Lighting", "Set", "Edit", ...(await listBts()).map((b) => b.category)]));
  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <Link href="/admin/bts">← Behind the scenes</Link>
          </p>
          <h1 className="page-title">Add photo / video</h1>
        </div>
      </header>
      <Flash error={error} />
      <BtsForm storage={storageMode()} categories={cats} />
    </>
  );
}
