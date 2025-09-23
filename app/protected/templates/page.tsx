import { Suspense } from "react";
import { TemplateList } from "@/components/templates/template-list";

export default function TemplatesPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Templates</h1>
      <Suspense fallback={<div>Loading…</div>}>
        <TemplateList />
      </Suspense>
    </div>
  );
}


