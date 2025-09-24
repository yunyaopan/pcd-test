"use client";
import { useEffect, useState } from "react";
import { listProjects, ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
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
        <div className="space-y-2">
          {projects.map(project => (
            <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-medium">{project.name}</h3>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'submit evaluation criteria' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {project.status || 'submit evaluation criteria'}
                </span>
              </div>
            </div>
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
