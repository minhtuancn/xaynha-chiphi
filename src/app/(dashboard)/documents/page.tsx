import { getDocuments } from "@/actions/documents";
import { getProjects } from "@/actions/projects";
import { serialize } from "@/lib/serialize";
import DocumentsClient from "./documents-client";

export default async function DocumentsPage() {
  const [documents, projects] = await Promise.all([
    getDocuments(),
    getProjects(),
  ]);

  return (
    <DocumentsClient
      documents={serialize(documents)}
      projects={serialize(projects).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))}
    />
  );
}
