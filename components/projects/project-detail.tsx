"use client";
import { useEffect, useState } from "react";
import { ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, Users, Hash } from "lucide-react";
import Link from "next/link";

interface ProjectDetailProps {
  projectId: string;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function loadProject() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to load project');
      }
      const { project } = await response.json();
      setProject(project);
    } catch (error) {
      console.error('Failed to load project:', error);
      setError('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
        <Link href="/protected/projects">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/protected/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'submit evaluation criteria' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {project.status || 'submit evaluation criteria'}
              </span>
              <span className="text-sm text-gray-500">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Document No.</label>
                <p className="text-sm">{project.document_no || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Reference No.</label>
                <p className="text-sm">{project.reference_no || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm">{project.description || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Publication Date</label>
                <p className="text-sm">{project.publication_date || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Closing Date</label>
                <p className="text-sm">{project.closing_date || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Suppliers Count</label>
                <p className="text-sm">{project.suppliers_count || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tender Submissions */}
      {project.tender_submissions && project.tender_submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Tender Submissions ({project.tender_submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-medium">S/N</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Supplier Name</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Schedule No.</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Response No.</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Adjustment</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Sign</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Entry Date</th>
                  </tr>
                </thead>
                <tbody>
                  {project.tender_submissions.map((submission, index) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3 text-center">{index + 1}</td>
                      <td className="border border-gray-300 p-3">{submission.supplier_name}</td>
                      <td className="border border-gray-300 p-3">{submission.schedule_of_rates_no}</td>
                      <td className="border border-gray-300 p-3">{submission.response_no}</td>
                      <td className="border border-gray-300 p-3 text-center">{submission.percentage_adjustment || 'N/A'}</td>
                      <td className="border border-gray-300 p-3 text-center">{submission.percentage_sign || 'N/A'}</td>
                      <td className="border border-gray-300 p-3">{submission.entry_date || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(!project.tender_submissions || project.tender_submissions.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No tender submissions found for this project.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
