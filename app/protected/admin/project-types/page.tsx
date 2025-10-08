"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { ProjectTypeForm } from "@/components/admin/project-type-form";
import { CriteriaProjectTypeMatrix } from "@/components/admin/criteria-project-type-matrix";

interface ProjectType {
  id: string;
  name: string;
  price_percentage: number;
  quality_percentage: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectTypesPage() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProjectType, setEditingProjectType] = useState<ProjectType | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  useEffect(() => {
    loadProjectTypes();
  }, []);

  async function loadProjectTypes() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/project-types');
      if (!response.ok) throw new Error('Failed to load project types');
      const { projectTypes } = await response.json();
      setProjectTypes(projectTypes);
    } catch (error) {
      console.error('Failed to load project types:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project type?')) return;

    try {
      const response = await fetch(`/api/admin/project-types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project type');
      }

      loadProjectTypes();
    } catch (error) {
      console.error('Failed to delete project type:', error);
      alert(`Failed to delete project type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleEdit(projectType: ProjectType) {
    setEditingProjectType(projectType);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingProjectType(null);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingProjectType(null);
    loadProjectTypes();
  }

  function handleMatrixSuccess() {
    setShowMatrix(false);
    loadProjectTypes();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/protected/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Types</h2>
            <p className="text-gray-600">Manage project types and their price-quality ratios</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project Type
          </Button>
          <Button variant="outline" onClick={() => setShowMatrix(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure Criteria Matrix
          </Button>
        </div>
      </div>

      {/* Project Types List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectTypes.map((projectType) => (
          <Card key={projectType.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{projectType.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(projectType)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(projectType.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">Price</div>
                  <div className="text-xl font-bold text-green-600">
                    {projectType.price_percentage}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">Quality</div>
                  <div className="text-xl font-bold text-blue-600">
                    {projectType.quality_percentage}%
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-gray-500">
                Total: {projectType.price_percentage + projectType.quality_percentage}%
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Created: {new Date(projectType.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projectTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No project types found. Create your first project type.</p>
        </div>
      )}

      {/* Project Type Form Modal */}
      {showForm && (
        <ProjectTypeForm
          projectType={editingProjectType}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Criteria Matrix Modal */}
      {showMatrix && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CriteriaProjectTypeMatrix onSuccess={handleMatrixSuccess} />
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setShowMatrix(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
