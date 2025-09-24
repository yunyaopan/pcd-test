import { Suspense } from "react";
import { ProjectList } from "@/components/projects/project-list";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense fallback={<div>Loading…</div>}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
