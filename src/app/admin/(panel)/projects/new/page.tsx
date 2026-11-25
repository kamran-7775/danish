import Link from "next/link";
import { listCategories } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import ProjectForm from "@/components/admin/ProjectForm";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function NewProjectPage({ searchParams }: { searchParams: Search }) {
  const { error, category } = await searchParams;
  const categories = await listCategories();
  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <Link href="/admin/projects">← Projects</Link>
          </p>
          <h1 className="page-title">New project</h1>
        </div>
      </header>
      <Flash error={error} />
      {categories.length === 0 ? (
        <p className="flash flash--error">
          Add a category (timeline track) first: <Link href="/admin/categories">Categories</Link>
        </p>
      ) : (
        <ProjectForm categories={categories} storage={storageMode()} defaultCategory={category} />
      )}
    </>
  );
}
