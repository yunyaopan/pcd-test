"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadTemplate } from "@/lib/api/templates";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Save,
  ArrowLeft,
} from "lucide-react";

export function TemplateEditor() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;
  const isEditing = !!templateId;
  
  const [templateName, setTemplateName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [templateContent, setTemplateContent] = useState<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your template... Use {{parameter.name}} for dynamic content",
        showOnlyWhenEditable: true,
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  const loadTemplateData = useCallback(async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to load template');
      
      const { template } = await response.json();
      setTemplateName(template.name);
      
      if (template.template_text) {
        setTemplateContent(template.template_text);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template data');
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  // Load existing template data when editing
  useEffect(() => {
    if (isEditing && templateId) {
      loadTemplateData();
    }
  }, [isEditing, templateId, loadTemplateData]);

  // Set content when editor is ready and we have template data
  useEffect(() => {
    if (editor && templateContent) {
      editor.commands.setContent(templateContent);
    }
  }, [editor, templateContent]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }

    if (!editor?.getText().trim()) {
      alert("Please add some content to your template");
      return;
    }

    setIsSaving(true);
    try {
      const htmlContent = editor?.getHTML() || "";
      
      if (isEditing) {
        // Update existing template
        const response = await fetch(`/api/templates/${templateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: templateName,
            template_text: htmlContent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update template');
        }
      } else {
        // Create new template
        await uploadTemplate({
          name: templateName,
          template_text: htmlContent,
        });
      }
      
      router.push("/protected/templates");
    } catch (error) {
      console.error("Failed to save template:", error);
      alert("Failed to save template. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 ${
        isActive ? "bg-gray-200" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/protected/templates")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
              <Input
                placeholder="Template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving || isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : isLoading ? "Loading..." : isEditing ? "Update Template" : "Save Template"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
            <ToolbarButton
              onClick={() => editor?.chain().focus().undo().run()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().redo().run()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive("bold")}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive("italic")}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive("bulletList")}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive("orderedList")}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive("blockquote")}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
          </div>

          {/* Editor */}
          <div className="border border-gray-200 rounded-b-md">
            <EditorContent editor={editor} />
          </div>

          {/* Help text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800 mb-2">
              <strong>Available Parameters:</strong>
            </p>
            <div className="text-xs text-blue-700 space-y-1">
              <div><strong>Customer:</strong> <code className="bg-blue-100 px-1 rounded">{"{{customer.Name}}"}</code></div>
              <div><strong>Project:</strong> <code className="bg-blue-100 px-1 rounded">{"{{project.document_no}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{project.reference_no}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{project.publication_date}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{project.closing_date}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{project.description}}"}</code>, <code className="bg-blue-100 px-1 rounded">{"{{project.suppliers_count}}"}</code></div>
              <div><strong>Tender Submissions Table:</strong> <code className="bg-blue-100 px-1 rounded">{"{{tender_submissions_table}}"}</code> - Displays all tender submissions in a formatted table</div>
              <div><strong>Evaluation Criteria Table:</strong> <code className="bg-blue-100 px-1 rounded">{"{{evaluation_criteria_table}}"}</code> - Displays project evaluation criteria with percentages and scoring details</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
