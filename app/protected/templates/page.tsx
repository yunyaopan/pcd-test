import { Suspense } from "react";
import { TemplateList } from "@/components/templates/template-list";

export default function TemplatesPage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense fallback={<div>Loading…</div>}>
        <TemplateList />
      </Suspense>
    </div>
  );
}


