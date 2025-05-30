import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockCloudAccounts, mockDeployments } from "@/data/mock-data";
import { CloudProvider, DeploymentStatus } from "@/types/cloud";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { CloudAccount } from "@/types/auth";
import { Activity, Database, Plus, Save, Play, BookOpen, Video, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProviderStats {
  name: CloudProvider;
  value: number;
}

interface StatusStats {
  name: DeploymentStatus;
  value: number;
}

interface CloudProviderDistribution {
  name: CloudProvider;
  deployments: number;
}

interface Widget {
  id: string;
  type: string;
  title: string;
  size: "small" | "medium" | "large";
  position: { x: number; y: number };
}

interface EnablementItem {
  id: string;
  title: string;
  description: string;
  type: "video" | "guide";
  duration?: string;
  completed: boolean;
}

const mockEnablementItems: EnablementItem[] = [
  {
    id: "1",
    title: "Platform Overview",
    description: "Learn the basics of our cloud management platform",
    type: "video",
    duration: "5 min",
    completed: false
  },
  {
    id: "2",
    title: "Connecting Your First Cloud Account",
    description: "Step-by-step guide to connect Azure, AWS, or GCP",
    type: "guide",
    completed: false
  },
  {
    id: "3",
    title: "Deploying Your First Template",
    description: "Walk through the template deployment process",
    type: "video",
    duration: "8 min",
    completed: false
  },
  {
    id: "4",
    title: "Managing Environments",
    description: "Best practices for environment management",
    type: "guide",
    completed: false
  }
];

const availableWidgets = [
  { id: "deployments-chart", title: "Deployments Chart", size: "large" as const },
  { id: "cloud-providers", title: "Cloud Providers", size: "medium" as const },
  { id: "recent-activity", title: "Recent Activity", size: "medium" as const },
  { id: "system-health", title: "System Health", size: "small" as const }
];

const Dashboard = () => {
  const { currentTenant } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [deployments, setDeployments] = useState(mockDeployments);
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [providerDistribution, setProviderDistribution] = useState<CloudProviderDistribution[]>([]);
  const [enablementItems, setEnablementItems] = useState<EnablementItem[]>(mockEnablementItems);
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: "deployments-chart", type: "chart", title: "Deployments Chart", size: "large", position: { x: 0, y: 0 } },
    { id: "cloud-providers", type: "chart", title: "Cloud Providers", size: "medium", position: { x: 1, y: 0 } }
  ]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Colors for the charts
  const providerColors = {
    azure: "#0078D4",
    aws: "#FF9900",
    gcp: "#4285F4"
  };
  
  const statusColors = {
    running: "#10B981",
    pending: "#F59E0B",
    failed: "#EF4444",
    stopped: "#6B7280",
    deploying: "#6366F1"
  };
  
  useEffect(() => {
    if (currentTenant) {
      // Filter accounts and deployments by tenant
      const tenantAccounts = mockCloudAccounts.filter(
        account => account.tenantId === currentTenant.id
      );
      setAccounts(tenantAccounts);
      
      const tenantDeployments = mockDeployments.filter(
        deployment => deployment.tenantId === currentTenant.id
      );
      setDeployments(tenantDeployments);
      
      // Calculate provider stats
      const providers = tenantAccounts.reduce<Record<CloudProvider, number>>((acc, account) => {
        acc[account.provider] = (acc[account.provider] || 0) + 1;
        return acc;
      }, {} as Record<CloudProvider, number>);
      
      setProviderStats(
        Object.entries(providers).map(([name, value]) => ({
          name: name as CloudProvider,
          value
        }))
      );
      
      // Calculate status stats
      const statuses = tenantDeployments.reduce<Record<DeploymentStatus, number>>((acc, deployment) => {
        acc[deployment.status] = (acc[deployment.status] || 0) + 1;
        return acc;
      }, {} as Record<DeploymentStatus, number>);
      
      setStatusStats(
        Object.entries(statuses).map(([name, value]) => ({
          name: name as DeploymentStatus,
          value
        }))
      );
      
      // Calculate provider distribution for deployments
      const distribution = tenantDeployments.reduce<Record<CloudProvider, number>>((acc, deployment) => {
        acc[deployment.provider] = (acc[deployment.provider] || 0) + 1;
        return acc;
      }, {} as Record<CloudProvider, number>);
      
      setProviderDistribution(
        Object.entries(distribution).map(([name, deployments]) => ({
          name: name as CloudProvider,
          deployments
        }))
      );
    }
  }, [currentTenant]);
  
  const markEnablementComplete = (id: string) => {
    setEnablementItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: true } : item
      )
    );
  };
  
  const addWidget = (widgetType: string) => {
    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: availableWidgets.find(w => w.id === widgetType)?.title || "New Widget",
      size: availableWidgets.find(w => w.id === widgetType)?.size || "medium",
      position: { x: widgets.length % 3, y: Math.floor(widgets.length / 3) }
    };
    setWidgets([...widgets, newWidget]);
  };
  
  const saveDashboard = () => {
    setIsEditMode(false);
    // In a real app, this would save the dashboard configuration to the backend
    console.log("Dashboard saved:", widgets);
  };
  
  const showEnablement = enablementItems.some(item => !item.completed);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex space-x-2">
          {isEditMode && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Widget</DialogTitle>
                    <DialogDescription>
                      Choose a widget to add to your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    {availableWidgets.map((widget) => (
                      <Card key={widget.id} className="cursor-pointer hover:bg-accent" onClick={() => addWidget(widget.id)}>
                        <CardHeader>
                          <CardTitle className="text-sm">{widget.title}</CardTitle>
                          <CardDescription>Size: {widget.size}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={saveDashboard}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          )}
          {!isEditMode && (
            <Button variant="outline" onClick={() => setIsEditMode(true)}>
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>
      
      {/* Getting Started Section */}
      {showEnablement && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Welcome! Complete these guides to get the most out of our platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {enablementItems.map((item) => (
                <Card key={item.id} className={item.completed ? "opacity-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {item.type === "video" ? (
                          <Video className="h-5 w-5 text-blue-500" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {item.duration && (
                          <p className="text-xs text-muted-foreground mt-1">{item.duration}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => markEnablementComplete(item.id)}
                          disabled={item.completed}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          {item.completed ? "Completed" : item.type === "video" ? "Watch" : "Read"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deployments.length}</div>
            <p className="text-xs text-muted-foreground">
              across all environments
            </p>
          </CardContent>
        </Card>
        
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Clouds</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              cloud accounts connected
            </p>
          </CardContent>
        </Card>
        
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <div className="status-dot status-healthy" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deployments.filter(d => d.status === "running").length}
            </div>
            <p className="text-xs text-muted-foreground">
              deployments running normally
            </p>
          </CardContent>
        </Card>
        
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <div className="status-dot status-error" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deployments.filter(d => d.status === "failed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              deployments with errors
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className={`md:col-span-4 ${isEditMode ? "border-dashed border-2" : ""}`}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
            <CardDescription>
              Current status of all deployments
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={providerDistribution}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deployments" name="Deployments">
                    {providerDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={providerColors[entry.name]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`md:col-span-3 ${isEditMode ? "border-dashed border-2" : ""}`}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader>
            <CardTitle>Cloud Providers</CardTitle>
            <CardDescription>
              Distribution of connected cloud services
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[entry.name]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader>
            <CardTitle>Connected Cloud Accounts</CardTitle>
            <CardDescription>
              Status of your cloud provider integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {accounts.length > 0 ? accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`h-2.5 w-2.5 rounded-full bg-cloud-${account.provider}`} />
                    <div>
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.provider.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="status-indicator mr-4">
                      <div className={`status-dot status-${account.status}`} />
                      <span className="text-xs capitalize">{account.status}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">
                  No cloud accounts connected yet.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/settings')}>
              Manage Cloud Accounts
            </Button>
          </CardFooter>
        </Card>
        
        <Card className={isEditMode ? "border-dashed border-2" : ""}>
          {isEditMode && (
            <div className="absolute top-2 right-2">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Deployments</CardTitle>
              <CardDescription>
                Most recent deployment activities
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/deployments')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deployments.length > 0 ? deployments.slice(0, 5).map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`h-2.5 w-2.5 rounded-full bg-cloud-${deployment.provider}`} />
                    <div>
                      <p className="text-sm font-medium">{deployment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deployment.environment} · {new Date(deployment.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="status-indicator mr-4">
                      <div className={`status-dot status-${deployment.status === "running" ? "healthy" : deployment.status === "pending" || deployment.status === "deploying" ? "warning" : "error"}`} />
                      <span className="text-xs capitalize">{deployment.status}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/deployments/${deployment.id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">
                  No deployments found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
