"use client";
import { useEffect, useState, useCallback } from "react";
import { ProjectDto } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Users, BarChart3, FileCheck, X, Upload } from "lucide-react";
import Link from "next/link";
import { ExcelUploadModal } from "./excel-upload-modal";

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
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);

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
      
      interface Template {
        id: string;
        name: string;
        template_text?: string;
        storage_path?: string;
      }
      
      const tcbTemplate = templates.find((t: Template) => t.name.toLowerCase() === 'tcb');
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
      <div className="space-y-4">
        {/* Back button */}
        <div>
          <Link href="/protected/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to Projects</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>

        {/* Project info */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold truncate">{project.name}</h1>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              Created: {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons - mobile optimized */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExcelUploadModal(true)}
            className="flex-1 sm:flex-none"
          >
            <Upload className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Upload Gebiz Excel</span>
            <span className="sm:hidden">Upload Excel</span>
          </Button>
          <Button
            onClick={handleCreateTCBPaper}
            disabled={isGeneratingTCB}
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
          >
            {isGeneratingTCB ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Generating</span>
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create TCB Paper</span>
                <span className="sm:hidden">Create TCB</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Evaluation Criteria - First Card */}
      {project.evaluation_approaches && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <BarChart3 className="w-5 h-5 mr-2" />
              <span className="truncate">Evaluation Criteria - {project.evaluation_approaches.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile-optimized cards for evaluation criteria */}
            <div className="block sm:hidden space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Price</h4>
                  <span className="text-lg font-bold text-gray-900">{project.evaluation_approaches.price_percentage}%</span>
                </div>
                <p className="text-sm text-gray-600">Price-based evaluation</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Safety</h4>
                  <span className="text-lg font-bold text-gray-900">{project.evaluation_approaches.safety_percentage}%</span>
                </div>
                <p className="text-sm text-gray-600">Safety compliance evaluation</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">Technical</h4>
                  <span className="text-lg font-bold text-gray-900">{project.evaluation_approaches.technical_percentage}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  {project.evaluation_approaches.technical_criteria ? (
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(project.evaluation_approaches.technical_criteria).map(([points, description]) => (
                        <li key={points}>
                          <span className="font-medium text-gray-900">{points}:</span> {description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>Technical proposal evaluation</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg border-l-4 border-gray-400">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-gray-900">Total</h4>
                  <span className="text-lg font-bold text-gray-900">
                    {project.evaluation_approaches.price_percentage + 
                     project.evaluation_approaches.safety_percentage + 
                     project.evaluation_approaches.technical_percentage}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Complete evaluation criteria</p>
              </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Criteria</th>
                    <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Percentage</th>
                    <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Scoring Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 sm:p-3 font-medium text-gray-900">Price</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-900">
                      {project.evaluation_approaches.price_percentage}%
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3">
                      <span className="text-gray-500">Price-based evaluation</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 sm:p-3 font-medium text-gray-900">Safety</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-900">
                      {project.evaluation_approaches.safety_percentage}%
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3">
                      <span className="text-gray-500">Safety compliance evaluation</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 sm:p-3 font-medium text-gray-900">Technical</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-900">
                      {project.evaluation_approaches.technical_percentage}%
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3">
                      {project.evaluation_approaches.technical_criteria ? (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {Object.entries(project.evaluation_approaches.technical_criteria).map(([points, description]) => (
                            <li key={points} className="flex items-start">
                              <span className="font-medium text-gray-900 mr-2">{points}:</span>
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
                    <td className="border border-gray-300 p-2 sm:p-3 font-bold text-gray-900">Total</td>
                    <td className="border border-gray-300 p-2 sm:p-3 text-center font-bold text-gray-900">
                      {project.evaluation_approaches.price_percentage + 
                       project.evaluation_approaches.safety_percentage + 
                       project.evaluation_approaches.technical_percentage}%
                    </td>
                    <td className="border border-gray-300 p-2 sm:p-3">
                      <span className="text-gray-500">Complete evaluation criteria</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Information and Tender Submissions - Combined Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Gebiz submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Information Section */}
          <div>
            <div className="grid grid-cols-1 gap-4">
              {/* Mobile-optimized info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document No.</label>
                  <p className="text-sm font-medium mt-1 break-words">{project.document_no || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reference No.</label>
                  <p className="text-sm font-medium mt-1 break-words">{project.reference_no || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Publication Date</label>
                  <p className="text-sm font-medium mt-1">{project.publication_date || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Closing Date</label>
                  <p className="text-sm font-medium mt-1">{project.closing_date || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Suppliers Count</label>
                  <p className="text-sm font-medium mt-1">{project.suppliers_count || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg sm:col-span-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</label>
                  <p className="text-sm font-medium mt-1 break-words line-clamp-3">{project.description || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tender Submissions Section */}
          <div>
            <h4 className="text-lg font-medium mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Tender Submissions {project.tender_submissions && project.tender_submissions.length > 0 && `(${project.tender_submissions.length})`}
            </h4>
            
            {project.tender_submissions && project.tender_submissions.length > 0 ? (
              <>
                {/* Mobile-optimized card view */}
                <div className="block sm:hidden space-y-3">
                  {project.tender_submissions.map((submission, index) => (
                    <div key={submission.id} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
                            #{index + 1}
                          </span>
                          <h5 className="font-medium text-gray-900 truncate">{submission.supplier_name}</h5>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.percentage_adjustment || 'N/A'}
                            <span className="text-gray-500 ml-1">{submission.percentage_sign || ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Schedule No:</span>
                          <p className="font-medium break-words">{submission.schedule_of_rates_no}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Response No:</span>
                          <p className="font-medium break-words">{submission.response_no}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Entry Date:</span>
                          <p className="font-medium">{submission.entry_date || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">S/N</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Supplier Name</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Schedule No.</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Response No.</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Adjustment</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Sign</th>
                        <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium">Entry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.tender_submissions.map((submission, index) => (
                        <tr key={submission.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 p-2 sm:p-3 text-center">{index + 1}</td>
                          <td className="border border-gray-300 p-2 sm:p-3">{submission.supplier_name}</td>
                          <td className="border border-gray-300 p-2 sm:p-3">{submission.schedule_of_rates_no}</td>
                          <td className="border border-gray-300 p-2 sm:p-3">{submission.response_no}</td>
                          <td className="border border-gray-300 p-2 sm:p-3 text-center">{submission.percentage_adjustment || 'N/A'}</td>
                          <td className="border border-gray-300 p-2 sm:p-3 text-center">{submission.percentage_sign || 'N/A'}</td>
                          <td className="border border-gray-300 p-2 sm:p-3">{submission.entry_date || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No tender submissions found for this project.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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

      {/* Excel Upload Modal */}
      {showExcelUploadModal && (
        <ExcelUploadModal
          onClose={() => setShowExcelUploadModal(false)}
          onProjectCreated={() => {
            setShowExcelUploadModal(false);
            loadProject(); // Refresh the project data
          }}
          projectId={projectId}
        />
      )}
    </div>
  );
}
