"use client";
import { useEffect, useMemo, useState } from "react";
import { listTemplates, uploadTemplate, TemplateDto } from "@/lib/api/templates";
import { listProjects, previewDocument, ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import Link from "next/link";

interface PreviewState {
  templateId: string | null;
  projectId: string | null;
  content: string | null;
  templateName: string | null;
  projectName: string | null;
}

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ 
    templateId: null, 
    projectId: null, 
    content: null, 
    templateName: null, 
    projectName: null 
  });
  const [showDropdownFor, setShowDropdownFor] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    setPreview({ 
      templateId, 
      projectId, 
      content: pv.content,
      templateName: pv.templateName,
      projectName: pv.projectName
    });
    setShowDropdownFor(null); // Hide dropdown after selection
    setShowPreviewModal(true); // Show preview modal
  }

  function handleNewDocClick(templateId: string) {
    setShowDropdownFor(templateId);
    setPreview({ 
      templateId: null, 
      projectId: null, 
      content: null, 
      templateName: null, 
      projectName: null 
    }); // Clear previous preview
  }

  const projectOptions = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Templates</h1>
        <Link href="/protected/templates/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Template
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Template (Legacy)</CardTitle>
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
              {/* Removed inline preview - now shows in modal */}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">Document Preview</h2>
                <p className="text-sm text-gray-600">
                  Template: {preview.templateName} | Project: {preview.projectName}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div 
                className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.content || '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


