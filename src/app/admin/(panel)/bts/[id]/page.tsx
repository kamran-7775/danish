import Link from "next/link";
import { notFound } from "next/navigation";
import { getBts, listBts } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import { deleteBtsAction } from "../../../actions";
import BtsForm from "@/components/admin/BtsForm";
import { ConfirmForm } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function EditBtsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const { id } = await params;
  const { error } = await searchParams;
  const [item, all] = await Promise.all([getBts(id), listBts()]);
  if (!item) notFound();
  const cats = Array.from(new Set(["Shoot", "Lighting", "Set", "Edit", ...all.map((b) => b.category)]));

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <Link href="/admin/bts">← Behind the scenes</Link>
          </p>
          <h1 className="page-title">Edit item</h1>
        </div>
        <ConfirmForm action={deleteBtsAction} id={item.id} message="Delete this item?" className="adm-btn adm-btn--danger">
          Delete
        </ConfirmForm>
      </header>
      <Flash error={error} />
      <BtsForm item={item} storage={storageMode()} categories={cats} />
    </>
  );
}
