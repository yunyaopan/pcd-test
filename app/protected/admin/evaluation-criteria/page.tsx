"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EvaluationCriteriaForm } from "@/components/admin/evaluation-criteria-form";

interface EvaluationCriteria {
  id: string;
  name: string;
  description: string | null;
  detailed_scoring_methodology: string | null;
  created_at: string;
  updated_at: string;
}

export default function EvaluationCriteriaPage() {
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<EvaluationCriteria | null>(null);

  useEffect(() => {
    loadEvaluationCriteria();
  }, []);

  async function loadEvaluationCriteria() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/evaluation-criteria');
      if (!response.ok) throw new Error('Failed to load evaluation criteria');
      const { evaluationCriteria } = await response.json();
      setCriteria(evaluationCriteria);
    } catch (error) {
      console.error('Failed to load evaluation criteria:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this evaluation criteria?')) return;

    try {
      const response = await fetch(`/api/admin/evaluation-criteria/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete evaluation criteria');
      }

      loadEvaluationCriteria();
    } catch (error) {
      console.error('Failed to delete evaluation criteria:', error);
      alert(`Failed to delete evaluation criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleEdit(criteria: EvaluationCriteria) {
    setEditingCriteria(criteria);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingCriteria(null);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingCriteria(null);
    loadEvaluationCriteria();
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
            <h2 className="text-xl font-semibold text-gray-900">Evaluation Criteria</h2>
            <p className="text-gray-600">Manage evaluation criteria and their scoring methodologies</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Evaluation Criteria
        </Button>
      </div>

      {/* Evaluation Criteria List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {criteria.map((criterion) => (
          <Card key={criterion.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{criterion.name}</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(criterion)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(criterion.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                {criterion.description || 'No description provided'}
              </p>
              {criterion.detailed_scoring_methodology && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Scoring Methodology:</p>
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {criterion.detailed_scoring_methodology}
                  </p>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-400">
                Created: {new Date(criterion.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {criteria.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No evaluation criteria found. Create your first evaluation criteria.</p>
        </div>
      )}

      {/* Evaluation Criteria Form Modal */}
      {showForm && (
        <EvaluationCriteriaForm
          criteria={editingCriteria}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
