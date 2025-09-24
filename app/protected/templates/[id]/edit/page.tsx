import { Suspense } from "react";
import { TemplateEditor } from "@/components/templates/template-editor";

export default function EditTemplatePage() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Template</h1>
      </div>
      <Suspense fallback={<div>Loading editor...</div>}>
        <TemplateEditor />
      </Suspense>
    </div>
  );
}
