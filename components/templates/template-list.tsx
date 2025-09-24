"use client";
import { useEffect, useMemo, useState } from "react";
import { listTemplates, TemplateDto } from "@/lib/api/templates";
import { listProjects, previewDocument, ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Edit, Trash2 } from "lucide-react";
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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
    loadData();
  }, []);

  async function loadData() {
    try {
      const [t, p] = await Promise.all([listTemplates(), listProjects()]);
      setTemplates(t);
      setProjects(p);
    } catch (error) {
      console.error("Failed to load data:", error);
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

  async function handleDeleteTemplate(templateId: string) {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(templateId);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete template');
      }
      
      await loadData(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("Failed to delete template. Please try again.");
    } finally {
      setIsDeleting(null);
    }
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
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => handleNewDocClick(t.id)}
                      >
                        New doc
                      </Button>
                      <Link href={`/protected/templates/${t.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTemplate(t.id)}
                        disabled={isDeleting === t.id}
                      >
                        {isDeleting === t.id ? (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
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


