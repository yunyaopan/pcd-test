"use client";
import { useEffect, useMemo, useState } from "react";
import { listTemplates, uploadTemplate } from "@/lib/api/templates";
import { listProjects, previewDocument } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PreviewState {
  templateId: string | null;
  projectId: string | null;
  content: string | null;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ templateId: null, projectId: null, content: null });
  const [showDropdownFor, setShowDropdownFor] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listTemplates(), listProjects()]).then(([t, p]) => {
      setTemplates(t);
      setProjects(p);
    });
  }, []);

  async function onUploadFormSubmit(formData: FormData) {
    setIsLoading(true);
    try {
      const name = String(formData.get("name") || "");
      const file = (formData.get("file") as File) || undefined;
      const templateText = String(formData.get("template_text") || "");
      await uploadTemplate({ name, file, template_text: templateText || undefined });
      const t = await listTemplates();
      setTemplates(t);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSelectProject(templateId: string, projectId: string) {
    const { preview: pv } = await previewDocument({ templateId, projectId });
    setPreview({ templateId, projectId, content: pv.content });
    setShowDropdownFor(null); // Hide dropdown after selection
  }

  function handleNewDocClick(templateId: string) {
    setShowDropdownFor(templateId);
    setPreview({ templateId: null, projectId: null, content: null }); // Clear previous preview
  }

  const projectOptions = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Template</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onUploadFormSubmit} className="grid gap-3 md:grid-cols-3">
            <Input name="name" placeholder="Template name" required />
            <Input name="file" type="file" accept=".doc,.docx,.txt" />
            <Input name="template_text" placeholder="Or paste template text like: Hello {{customer.Name}}" />
            <div className="md:col-span-3">
              <Button type="submit" disabled={isLoading}>{isLoading ? "Uploading…" : "Save Template"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map(t => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t.name}</span>
                <div className="flex items-center gap-2">
                  {showDropdownFor === t.id ? (
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      onChange={e => onSelectProject(t.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select project
                      </option>
                      {projectOptions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Button 
                      variant="secondary" 
                      onClick={() => handleNewDocClick(t.id)}
                    >
                      New doc
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview.templateId === t.id && preview.content && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Document Preview:</h4>
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded border">{preview.content}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


