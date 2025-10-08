"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Plus, Trash2, Edit, X } from "lucide-react";

interface ProjectType {
  id: string;
  name: string;
  price_percentage: number;
  quality_percentage: number;
}

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  detailed_scoring_methodology: string | null;
}

interface ProjectTypeCriteriaConfig {
  id: string;
  project_type_id: string;
  evaluation_criteria_id: string;
  is_applicable: boolean;
  minimum_weight: number | null;
  default_weight: number | null;
}

interface ProjectTypeFormData {
  name: string;
  price_percentage: number;
  quality_percentage: number;
}

interface CriteriaFormData {
  name: string;
  description: string;
  detailed_scoring_methodology: string;
}

export function EnhancedCriteriaProjectTypeMatrix() {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [configurations, setConfigurations] = useState<ProjectTypeCriteriaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [showProjectTypeForm, setShowProjectTypeForm] = useState(false);
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [projectTypeFormPosition, setProjectTypeFormPosition] = useState<{ x: number; y: number } | null>(null);
  const [criteriaFormPosition, setCriteriaFormPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingProjectType, setEditingProjectType] = useState<ProjectType | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria | null>(null);
  const [projectTypeFormData, setProjectTypeFormData] = useState<ProjectTypeFormData>({
    name: "",
    price_percentage: 70,
    quality_percentage: 30
  });
  const [criteriaFormData, setCriteriaFormData] = useState<CriteriaFormData>({
    name: "",
    description: "",
    detailed_scoring_methodology: ""
  });

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-container') && !target.closest('.form-container')) {
        setActiveColumnMenu(null);
        setActiveRowMenu(null);
        setShowProjectTypeForm(false);
        setShowCriteriaForm(false);
        setProjectTypeFormPosition(null);
        setCriteriaFormPosition(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // Load project types
      const projectTypesResponse = await fetch('/api/admin/project-types');
      if (!projectTypesResponse.ok) throw new Error('Failed to load project types');
      const { projectTypes } = await projectTypesResponse.json();
      setProjectTypes(projectTypes);

      // Load evaluation criteria
      const criteriaResponse = await fetch('/api/admin/evaluation-criteria');
      if (!criteriaResponse.ok) throw new Error('Failed to load evaluation criteria');
      const { evaluationCriteria } = await criteriaResponse.json();
      setCriteria(evaluationCriteria);

      // Load existing configurations
      const configResponse = await fetch('/api/admin/project-type-criteria-matrix');
      if (!configResponse.ok) throw new Error('Failed to load configurations');
      const { configurations } = await configResponse.json();
      setConfigurations(configurations);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getConfiguration(projectTypeId: string, criteriaId: string): ProjectTypeCriteriaConfig | null {
    return configurations.find(config => 
      config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
    ) || null;
  }

  function updateConfiguration(projectTypeId: string, criteriaId: string, field: keyof Omit<ProjectTypeCriteriaConfig, 'id'>, value: boolean | number | null) {
    setConfigurations(prev => {
      const existing = prev.find(config => 
        config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
      );
      
      if (existing) {
        return prev.map(config => 
          config.project_type_id === projectTypeId && config.evaluation_criteria_id === criteriaId
            ? { ...config, [field]: value }
            : config
        );
      } else {
        // Create new configuration
        return [...prev, {
          id: '', // Will be set by backend
          project_type_id: projectTypeId,
          evaluation_criteria_id: criteriaId,
          is_applicable: field === 'is_applicable' ? value as boolean : true,
          minimum_weight: field === 'minimum_weight' ? value as number : null,
          default_weight: field === 'default_weight' ? value as number : null,
        }];
      }
    });
  }

  async function saveConfigurations() {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/project-type-criteria-matrix', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configurations: configurations.map(config => ({
            project_type_id: config.project_type_id,
            evaluation_criteria_id: config.evaluation_criteria_id,
            is_applicable: config.is_applicable,
            minimum_weight: config.minimum_weight,
            default_weight: config.default_weight,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configurations');
      }

      alert('Configurations saved successfully');
    } catch (error) {
      console.error('Failed to save configurations:', error);
      alert(`Failed to save configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddProjectType(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setProjectTypeFormPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setEditingProjectType(null);
    setProjectTypeFormData({
      name: "",
      price_percentage: 70,
      quality_percentage: 30
    });
    setShowProjectTypeForm(true);
    setActiveColumnMenu(null);
  }

  function handleEditProjectType(projectType: ProjectType, event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setProjectTypeFormPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setEditingProjectType(projectType);
    setProjectTypeFormData({
      name: projectType.name,
      price_percentage: projectType.price_percentage,
      quality_percentage: projectType.quality_percentage
    });
    setShowProjectTypeForm(true);
    setActiveColumnMenu(null);
  }

  function handleDeleteProjectType(projectTypeId: string) {
    if (!confirm('Are you sure you want to delete this project type? This will also remove all related configurations.')) return;
    
    // Remove from project types
    setProjectTypes(prev => prev.filter(pt => pt.id !== projectTypeId));
    
    // Remove related configurations
    setConfigurations(prev => prev.filter(config => config.project_type_id !== projectTypeId));
    
    setActiveColumnMenu(null);
  }

  function handleAddCriteria(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCriteriaFormPosition({
      x: rect.right - 300, // Position to the left of the button
      y: rect.bottom + 5
    });
    setEditingCriteria(null);
    setCriteriaFormData({
      name: "",
      description: "",
      detailed_scoring_methodology: ""
    });
    setShowCriteriaForm(true);
    setActiveRowMenu(null);
  }

  function handleEditCriteria(criterion: EvaluationCriteria, event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCriteriaFormPosition({
      x: rect.right - 300, // Position to the left of the button
      y: rect.bottom + 5
    });
    setEditingCriteria(criterion);
    setCriteriaFormData({
      name: criterion.name,
      description: criterion.description || "",
      detailed_scoring_methodology: criterion.detailed_scoring_methodology || ""
    });
    setShowCriteriaForm(true);
    setActiveRowMenu(null);
  }

  function handleDeleteCriteria(criteriaId: string) {
    if (!confirm('Are you sure you want to delete this evaluation criteria? This will also remove all related configurations.')) return;
    
    // Remove from criteria
    setCriteria(prev => prev.filter(c => c.id !== criteriaId));
    
    // Remove related configurations
    setConfigurations(prev => prev.filter(config => config.evaluation_criteria_id !== criteriaId));
    
    setActiveRowMenu(null);
  }

  async function handleProjectTypeSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!projectTypeFormData.name.trim()) {
      alert("Project type name is required");
      return;
    }

    if (projectTypeFormData.price_percentage + projectTypeFormData.quality_percentage !== 100) {
      alert("Price and quality percentages must sum to 100");
      return;
    }

    try {
      const url = editingProjectType 
        ? `/api/admin/project-types/${editingProjectType.id}`
        : '/api/admin/project-types';
      
      const method = editingProjectType ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectTypeFormData.name.trim(),
          price_percentage: projectTypeFormData.price_percentage,
          quality_percentage: projectTypeFormData.quality_percentage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save project type');
      }

      const { projectType } = await response.json();
      
      if (editingProjectType) {
        setProjectTypes(prev => prev.map(pt => pt.id === editingProjectType.id ? projectType : pt));
      } else {
        setProjectTypes(prev => [...prev, projectType]);
      }

      setShowProjectTypeForm(false);
      setProjectTypeFormPosition(null);
    } catch (error) {
      console.error('Failed to save project type:', error);
      alert(`Failed to save project type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleCriteriaSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!criteriaFormData.name.trim()) {
      alert("Criteria name is required");
      return;
    }

    if (!criteriaFormData.detailed_scoring_methodology.trim()) {
      alert("Detailed scoring methodology is required");
      return;
    }

    try {
      const url = editingCriteria 
        ? `/api/admin/evaluation-criteria/${editingCriteria.id}`
        : '/api/admin/evaluation-criteria';
      
      const method = editingCriteria ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: criteriaFormData.name.trim(),
          description: criteriaFormData.description.trim() || null,
          detailed_scoring_methodology: criteriaFormData.detailed_scoring_methodology.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save evaluation criteria');
      }

      const { evaluationCriteria } = await response.json();
      
      if (editingCriteria) {
        setCriteria(prev => prev.map(c => c.id === editingCriteria.id ? evaluationCriteria : c));
      } else {
        setCriteria(prev => [...prev, evaluationCriteria]);
      }

      setShowCriteriaForm(false);
      setCriteriaFormPosition(null);
    } catch (error) {
      console.error('Failed to save evaluation criteria:', error);
      alert(`Failed to save evaluation criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Criteria-Project Type Matrix</h2>
          <p className="text-gray-600">Configure which criteria apply to each project type and set weights</p>
        </div>
        <Button onClick={saveConfigurations} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Matrix'}
        </Button>
      </div>

      {/* Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900 min-w-[200px] sticky left-0 bg-gray-50 z-10 border-r">
                    <div className="flex items-center justify-between">
                      <span>Criteria</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleAddCriteria(e)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </th>
                  {projectTypes.map((projectType) => (
                    <th 
                      key={projectType.id} 
                      className={`text-center p-4 font-medium text-gray-900 min-w-[150px] relative cursor-pointer transition-colors ${
                        hoveredColumn === projectType.id ? 'bg-gray-100' : ''
                      }`}
                      onMouseEnter={() => setHoveredColumn(projectType.id)}
                      onMouseLeave={() => setHoveredColumn(null)}
                      onClick={() => setActiveColumnMenu(activeColumnMenu === projectType.id ? null : projectType.id)}
                    >
                      <div className="text-sm">{projectType.name}</div>
                      <div className="text-xs text-gray-500">
                        {projectType.price_percentage}% Price / {projectType.quality_percentage}% Quality
                      </div>
                      
                      {/* Column Menu */}
                      {activeColumnMenu === projectType.id && (
                        <div className="menu-container absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[200px]">
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditProjectType(projectType, e)}
                              className="w-full justify-start"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Project Type
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProjectType(projectType.id)}
                              className="w-full justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Project Type
                            </Button>
                          </div>
                        </div>
                      )}
                    </th>
                  ))}
                  
                  {/* Add New Project Type Column */}
                  <th className="text-center p-4 font-medium text-gray-900 min-w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleAddProjectType(e)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {criteria.map((criterion) => (
                  <tr key={criterion.id} className="border-b hover:bg-gray-50">
                    <td 
                      className={`p-4 sticky left-0 bg-white z-10 border-r relative cursor-pointer transition-colors ${
                        hoveredRow === criterion.id ? 'bg-gray-100' : ''
                      }`}
                      onMouseEnter={() => setHoveredRow(criterion.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      onClick={() => setActiveRowMenu(activeRowMenu === criterion.id ? null : criterion.id)}
                    >
                      <div className="font-medium text-gray-900">{criterion.name}</div>
                      {criterion.description && (
                        <div className="text-xs text-gray-500 mt-1">{criterion.description}</div>
                      )}
                      
                      {/* Row Menu */}
                      {activeRowMenu === criterion.id && (
                        <div className="menu-container absolute top-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[150px]">
                          <div className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleEditCriteria(criterion, e)}
                              className="w-full justify-start"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Criteria
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCriteria(criterion.id)}
                              className="w-full justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Criteria
                            </Button>
                          </div>
                        </div>
                      )}
                    </td>
                    {projectTypes.map((projectType) => {
                      const config = getConfiguration(projectType.id, criterion.id);
                      const isApplicable = config?.is_applicable || false;
                      
                      return (
                        <td key={`${projectType.id}-${criterion.id}`} className="p-4 text-center">
                          <div className="space-y-2">
                            {/* Applicable Checkbox */}
                            <div className="flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isApplicable}
                                onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'is_applicable', e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Weight Inputs */}
                            {isApplicable && (
                              <div className="space-y-1">
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={config?.minimum_weight || ''}
                                    onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'minimum_weight', parseFloat(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Min %"
                                    title="Minimum Weight"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={config?.default_weight || ''}
                                    onChange={(e) => updateConfiguration(projectType.id, criterion.id, 'default_weight', parseFloat(e.target.value) || null)}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Default %"
                                    title="Default Weight"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-sm text-gray-600">
        <p><strong>Legend:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>Min %:</strong> Minimum weight percentage for this criteria</li>
          <li><strong>Default %:</strong> Default weight percentage for this criteria</li>
          <li>Check the box to make a criteria applicable to a project type</li>
          <li>Click on column headers to edit/delete project types</li>
          <li>Click on criteria rows to edit/delete criteria</li>
          <li>Hover over headers/rows for subtle background color changes</li>
        </ul>
      </div>

      {/* Project Type Form */}
      {showProjectTypeForm && projectTypeFormPosition && (
        <div 
          className="form-container fixed bg-white border border-gray-200 rounded-md shadow-lg z-30 w-80"
          style={{
            left: `${projectTypeFormPosition.x}px`,
            top: `${projectTypeFormPosition.y}px`
          }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {editingProjectType ? 'Edit Project Type' : 'Add Project Type'}
            </h3>
            <Button variant="outline" size="sm" onClick={() => {
              setShowProjectTypeForm(false);
              setProjectTypeFormPosition(null);
            }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleProjectTypeSubmit} className="p-4 space-y-4">
            {/* Project Type Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Type Name *
              </label>
              <input
                type="text"
                value={projectTypeFormData.name}
                onChange={(e) => setProjectTypeFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Construction, IT Services"
                required
              />
            </div>

            {/* Price-Quality Ratio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price-Quality Ratio *
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Price</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={projectTypeFormData.price_percentage}
                      onChange={(e) => setProjectTypeFormData(prev => ({ 
                        ...prev, 
                        price_percentage: parseInt(e.target.value) || 0,
                        quality_percentage: 100 - (parseInt(e.target.value) || 0)
                      }))}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Quality</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={projectTypeFormData.quality_percentage}
                      onChange={(e) => setProjectTypeFormData(prev => ({ 
                        ...prev, 
                        quality_percentage: parseInt(e.target.value) || 0,
                        price_percentage: 100 - (parseInt(e.target.value) || 0)
                      }))}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-1 text-center text-xs text-gray-500">
                Total: {projectTypeFormData.price_percentage + projectTypeFormData.quality_percentage}%
              </div>
              
              {projectTypeFormData.price_percentage + projectTypeFormData.quality_percentage !== 100 && (
                <div className="mt-1 text-xs text-red-600">
                  ⚠️ Must sum to 100%
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setShowProjectTypeForm(false);
                setProjectTypeFormPosition(null);
              }}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={projectTypeFormData.price_percentage + projectTypeFormData.quality_percentage !== 100}
              >
                {editingProjectType ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Criteria Form */}
      {showCriteriaForm && criteriaFormPosition && (
        <div 
          className="form-container fixed bg-white border border-gray-200 rounded-md shadow-lg z-30 w-80"
          style={{
            left: `${criteriaFormPosition.x}px`,
            top: `${criteriaFormPosition.y}px`
          }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">
              {editingCriteria ? 'Edit Evaluation Criteria' : 'Add Evaluation Criteria'}
            </h3>
            <Button variant="outline" size="sm" onClick={() => {
              setShowCriteriaForm(false);
              setCriteriaFormPosition(null);
            }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleCriteriaSubmit} className="p-4 space-y-4">
            {/* Criteria Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Criteria Name *
              </label>
              <input
                type="text"
                value={criteriaFormData.name}
                onChange={(e) => setCriteriaFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Technical Capability, Safety Record"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={criteriaFormData.description}
                onChange={(e) => setCriteriaFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what this criteria evaluates..."
                rows={2}
              />
            </div>

            {/* Detailed Scoring Methodology */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Scoring Methodology *
              </label>
              <textarea
                value={criteriaFormData.detailed_scoring_methodology}
                onChange={(e) => setCriteriaFormData(prev => ({ ...prev, detailed_scoring_methodology: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the detailed scoring methodology, conditions, and point system..."
                rows={3}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => {
                setShowCriteriaForm(false);
                setCriteriaFormPosition(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {editingCriteria ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
