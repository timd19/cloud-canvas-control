
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileCode } from "lucide-react";
import { toast } from "sonner";

import { TemplateForm } from "@/components/template-foundry/template-form";
import { TemplateList } from "@/components/template-foundry/template-list";
import { TemplateDetails } from "@/components/template-foundry/template-details";
import { GithubIntegration } from "@/components/template-foundry/github-integration";
import { Template, codeExamples } from "@/types/template";
import { mockTemplates } from "@/data/mock-data";

const TemplateFoundry = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [filter, setFilter] = useState("all");
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  const loadTemplates = useCallback(() => {
    // Convert mock templates to proper Template format
    const relevantTemplates: Template[] = mockTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      provider: template.provider,
      codeSnippet: template.code,
      tenantIds: [template.tenantId],
      categories: template.categories,
      version: "1.0.0",
      createdAt: template.uploadedAt,
      updatedAt: template.updatedAt,
      deploymentCount: template.deploymentCount,
      isPublished: true,
      author: user?.name || "Admin",
      commitId: Math.random().toString(16).substring(2, 8)
    }));
    
    // Add some draft templates
    const draftTemplates: Template[] = [
      {
        id: "draft-1",
        name: "Network Security Template",
        description: "Basic network security configuration",
        type: "terraform",
        provider: "azure",
        codeSnippet: codeExamples.terraform,
        tenantIds: [user?.tenantId || "tenant-1"],
        categories: ["Security", "Networking"],
        version: "0.1.0",
        createdAt: "2023-04-10T09:00:00Z",
        updatedAt: "2023-04-10T09:00:00Z",
        deploymentCount: 0,
        isPublished: false,
        author: user?.name || "Admin",
        commitId: "draft-" + Math.random().toString(16).substring(2, 8)
      },
    ];
    
    setTemplates([...relevantTemplates, ...draftTemplates]);
  }, [user?.name, user?.tenantId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = (templateData: Partial<Template>) => {
    if (!templateData.name || !templateData.description || !templateData.codeSnippet) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: templateData.name || "",
      description: templateData.description || "",
      type: templateData.type || "terraform",
      provider: templateData.provider || "azure",
      codeSnippet: templateData.codeSnippet || "",
      tenantIds: templateData.tenantIds || [user?.tenantId || "tenant-1"],
      categories: templateData.categories || [],
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deploymentCount: 0,
      isPublished: false,
      author: user?.name || "Admin",
      commitId: Math.random().toString(16).substring(2, 10),
    };
    
    setTemplates([...templates, newTemplate]);
    setIsCreating(false);
    toast.success("Template created successfully");
  };

  const handleUpdateTemplate = (updatedTemplate: Template) => {
    const updatedTemplates = templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    );
    
    setTemplates(updatedTemplates);
    setActiveTemplate(updatedTemplate);
    toast.success("Template updated successfully");
  };

  const handlePublishTemplate = (template: Template) => {
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, isPublished: true } : t
    );
    setTemplates(updatedTemplates);
    setActiveTemplate(prev => prev && { ...prev, isPublished: true });
    toast.success("Template published successfully");
  };

  const handleUnpublishTemplate = (template: Template) => {
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, isPublished: false } : t
    );
    setTemplates(updatedTemplates);
    setActiveTemplate(prev => prev && { ...prev, isPublished: false });
    toast.success("Template unpublished successfully");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    setActiveTemplate(null);
    toast.success("Template deleted successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Foundry</h1>
          <p className="text-muted-foreground">
            Create and manage cloud infrastructure templates
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
                <DialogDescription>
                  Create a new cloud infrastructure template
                </DialogDescription>
              </DialogHeader>
              
              <TemplateForm 
                onSubmit={handleCreateTemplate} 
                onCancel={() => setIsCreating(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="github">GitHub Integration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <TemplateList
                templates={templates}
                activeTemplate={activeTemplate}
                setActiveTemplate={setActiveTemplate}
                filter={filter}
                setFilter={setFilter}
              />
            </div>
            
            <div className="md:col-span-2">
              {activeTemplate ? (
                <TemplateDetails
                  template={activeTemplate}
                  onUpdate={handleUpdateTemplate}
                  onDelete={handleDeleteTemplate}
                  onPublish={handlePublishTemplate}
                  onUnpublish={handleUnpublishTemplate}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16">
                  <FileCode className="h-12 w-12 text-muted-foreground" />
                  <h2 className="mt-4 text-xl font-semibold">No Template Selected</h2>
                  <p className="text-center text-muted-foreground mt-2 max-w-md">
                    Select a template from the library to view and edit, or create a new template to get started.
                  </p>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="github" className="mt-4">
          <GithubIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateFoundry;
