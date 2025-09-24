"use client";
import { useEffect, useState } from "react";
import { listTemplates, TemplateDto } from "@/lib/api/templates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateDto[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const templates = await listTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
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
      
      await loadTemplates(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("Failed to delete template. Please try again.");
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Created: {new Date(t.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No templates found. Create your first template to get started.
        </div>
      )}
    </div>
  );
}