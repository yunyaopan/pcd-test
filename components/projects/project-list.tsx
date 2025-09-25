"use client";
import { useEffect, useState } from "react";
import { listProjects, ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { EvaluationApproachModal } from "./evaluation-approach-modal";
import Link from "next/link";

export function ProjectList() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

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
    setShowEvaluationModal(false);
    loadProjects(); // Refresh the list
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Button onClick={() => setShowEvaluationModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading projects...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(project => (
            <Link key={project.id} href={`/protected/projects/${project.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {projects.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No projects found. Create your first project by selecting an evaluation approach.
        </div>
      )}

      {/* Evaluation Approach Modal */}
      {showEvaluationModal && (
        <EvaluationApproachModal
          onClose={() => setShowEvaluationModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}
