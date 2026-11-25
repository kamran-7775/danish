import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, listCategories } from "@/lib/db";
import { storageMode } from "@/lib/storage";
import { deleteProjectAction } from "../../../actions";
import ProjectForm from "@/components/admin/ProjectForm";
import { ConfirmForm } from "@/components/admin/Buttons";
import Flash, { type Search } from "@/components/admin/Flash";

export default async function EditProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const { id } = await params;
  const { error } = await searchParams;
  const [project, categories] = await Promise.all([getProject(id), listCategories()]);
  if (!project) notFound();

  return (
    <>
      <header className="page-head">
        <div>
          <p className="page-kicker">
            <Link href="/admin/projects">← Projects</Link>
          </p>
          <h1 className="page-title">{project.title}</h1>
        </div>
        <ConfirmForm action={deleteProjectAction} id={project.id} message={`Delete “${project.title}”? This can't be undone.`} className="adm-btn adm-btn--danger">
          Delete project
        </ConfirmForm>
      </header>
      <Flash error={error} />
      <ProjectForm project={project} categories={categories} storage={storageMode()} />
    </>
  );
}
