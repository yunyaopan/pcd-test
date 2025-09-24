"use client";
import { useEffect, useState, useCallback } from "react";
import { ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Users, BarChart3, FileCheck, X } from "lucide-react";
import Link from "next/link";

interface ProjectDetailProps {
  projectId: string;
}

interface PreviewState {
  templateId: string | null;
  projectId: string | null;
  content: string | null;
  templateName: string | null;
  projectName: string | null;
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ 
    templateId: null, 
    projectId: null, 
    content: null, 
    templateName: null, 
    projectName: null 
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGeneratingTCB, setIsGeneratingTCB] = useState(false);

  const loadProject = useCallback(async () => {
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
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [projectId, loadProject]);

  async function handleCreateTCBPaper() {
    if (!project) return;
    
    setIsGeneratingTCB(true);
    try {
      // First, find the TCB template
      const templatesResponse = await fetch('/api/templates');
      if (!templatesResponse.ok) throw new Error('Failed to load templates');
      const { templates } = await templatesResponse.json();
      
      const tcbTemplate = templates.find((t: any) => t.name.toLowerCase() === 'tcb');
      if (!tcbTemplate) {
        alert('TCB template not found. Please create a template named "TCB" first.');
        return;
      }

      // Generate preview using TCB template
      const response = await fetch('/api/documents/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          templateId: tcbTemplate.id, 
          projectId: project.id 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate TCB paper');
      
      const { preview: pv } = await response.json();
      setPreview({
        templateId: tcbTemplate.id,
        projectId: project.id,
        content: pv.content,
        templateName: pv.templateName,
        projectName: pv.projectName
      });
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to generate TCB paper:', error);
      alert('Failed to generate TCB paper. Please try again.');
    } finally {
      setIsGeneratingTCB(false);
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
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateTCBPaper}
            disabled={isGeneratingTCB}
            className="bg-green-600 hover:bg-green-700"
          >
            {isGeneratingTCB ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                Create TCB Paper
              </>
            )}
          </Button>
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

      {/* Evaluation Criteria */}
      {project.evaluation_approaches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Evaluation Criteria - {project.evaluation_approaches.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-medium">Criteria</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Percentage</th>
                    <th className="border border-gray-300 p-3 text-left font-medium">Scoring Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium text-green-700">Price</td>
                    <td className="border border-gray-300 p-3 text-center font-bold text-green-600">
                      {project.evaluation_approaches.price_percentage}%
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="text-gray-500">Price-based evaluation</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium text-red-700">Safety</td>
                    <td className="border border-gray-300 p-3 text-center font-bold text-red-600">
                      {project.evaluation_approaches.safety_percentage}%
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="text-gray-500">Safety compliance evaluation</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3 font-medium text-blue-700">Technical</td>
                    <td className="border border-gray-300 p-3 text-center font-bold text-blue-600">
                      {project.evaluation_approaches.technical_percentage}%
                    </td>
                    <td className="border border-gray-300 p-3">
                      {project.evaluation_approaches.technical_criteria ? (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {Object.entries(project.evaluation_approaches.technical_criteria).map(([points, description]) => (
                            <li key={points} className="flex items-start">
                              <span className="font-medium text-blue-600 mr-2">{points}:</span>
                              <span className="text-gray-700">{description}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">Technical proposal evaluation</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3 font-bold">Total</td>
                    <td className="border border-gray-300 p-3 text-center font-bold">
                      {project.evaluation_approaches.price_percentage + 
                       project.evaluation_approaches.safety_percentage + 
                       project.evaluation_approaches.technical_percentage}%
                    </td>
                    <td className="border border-gray-300 p-3">
                      <span className="text-gray-500">Complete evaluation criteria</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* TCB Paper Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-xl font-semibold">TCB Paper Preview</h2>
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
