"use client";
import { useEffect, useState } from "react";
import { listProjects, ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ExcelUploadModal } from "./excel-upload-modal";

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleProjectCreated() {
    setShowUploadModal(false);
    loadProjects(); // Refresh the list
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {isLoading ? (
        <div>Loading projects...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle className="text-lg">{project.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Document No.:</span> {project.document_no || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Publication Date:</span> {project.publication_date || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Closing Date:</span> {project.closing_date || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Description:</span> {project.description || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Suppliers:</span> {project.suppliers_count || 'N/A'}
                  </div>
                  {project.tender_submissions && project.tender_submissions.length > 0 && (
                    <div>
                      <span className="font-medium">Tender Submissions:</span> {project.tender_submissions.length}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No projects found. Create your first project by uploading an Excel file.
        </div>
      )}

      {/* Excel Upload Modal */}
      {showUploadModal && (
        <ExcelUploadModal
          onClose={() => setShowUploadModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
