"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Navbar from "@/components/navbar/Navbar"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Users,
  Zap,
  BarChart3,
  Settings,
  Download,
  Upload,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Footer } from "react-day-picker"

// Mock data for workflows
const workflows = [
  {
    id: 1,
    name: "Data Processing Pipeline",
    description: "Automated data extraction, transformation, and loading",
    status: "active",
    lastRun: "2 hours ago",
    nextRun: "In 6 hours",
    runs: 245,
    successRate: 98,
    trigger: "Schedule",
    category: "Data",
    team: ["AI", "Data"],
    createdBy: "Alex Chen",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Customer Onboarding",
    description: "Automated welcome emails and account setup",
    status: "active",
    lastRun: "1 hour ago",
    nextRun: "In 30 minutes",
    runs: 189,
    successRate: 99,
    trigger: "Event",
    category: "Marketing",
    team: ["Marketing", "Support"],
    createdBy: "Maria Garcia",
    createdAt: "2024-02-10",
  },
  {
    id: 3,
    name: "Backup System",
    description: "Daily database backups and integrity checks",
    status: "paused",
    lastRun: "3 days ago",
    nextRun: "Manual",
    runs: 120,
    successRate: 100,
    trigger: "Schedule",
    category: "Infrastructure",
    team: ["DevOps"],
    createdBy: "James Wilson",
    createdAt: "2024-01-20",
  },
  {
    id: 4,
    name: "Report Generation",
    description: "Weekly performance reports and analytics",
    status: "error",
    lastRun: "Failed 5 hours ago",
    nextRun: "Manual",
    runs: 52,
    successRate: 92,
    trigger: "Schedule",
    category: "Analytics",
    team: ["Analytics", "Management"],
    createdBy: "Sarah Johnson",
    createdAt: "2024-02-05",
  },
  {
    id: 5,
    name: "Content Publishing",
    description: "Automated social media and blog posting",
    status: "active",
    lastRun: "30 minutes ago",
    nextRun: "In 2 hours",
    runs: 310,
    successRate: 97,
    trigger: "Event",
    category: "Content",
    team: ["Marketing", "Content"],
    createdBy: "David Lee",
    createdAt: "2024-01-25",
  },
]

const recentExecutions = [
  { id: 1, workflow: "Data Processing", status: "success", duration: "4m 32s", started: "2 hours ago" },
  { id: 2, workflow: "Customer Onboarding", status: "success", duration: "1m 15s", started: "1 hour ago" },
  { id: 3, workflow: "Report Generation", status: "failed", duration: "2m 45s", started: "5 hours ago" },
  { id: 4, workflow: "Content Publishing", status: "success", duration: "45s", started: "30 minutes ago" },
  { id: 5, workflow: "Data Processing", status: "success", duration: "4m 10s", started: "6 hours ago" },
]

const categories = ["All", "Data", "Marketing", "Infrastructure", "Analytics", "Content"]

export default function WorkflowsPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    category: "Data",
    trigger: "Schedule",
  })

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch = workflow.name.toLowerCase().includes(search.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === "All" || workflow.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500"
      case "paused": return "bg-yellow-500"
      case "error": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />
      case "paused": return <Clock className="h-4 w-4" />
      case "error": return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <Navbar />
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automated workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Plus className="mr-2 h-4 w-4" />
                Create New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Set up a new automated workflow with triggers and actions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    className="text-secondary"
                    placeholder="Workflow name"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    className="text-secondary"
                    placeholder="Describe what this workflow does"
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={newWorkflow.category} 
                      onValueChange={(value) => setNewWorkflow({...newWorkflow, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Trigger</label>
                    <Select 
                      value={newWorkflow.trigger} 
                      onValueChange={(value) => setNewWorkflow({...newWorkflow, trigger: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Schedule">Schedule</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Handle workflow creation
                  console.log(newWorkflow)
                  setShowCreateDialog(false)
                  setNewWorkflow({ name: "", description: "", category: "Data", trigger: "Schedule" })
                }}>
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">97.2%</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">1,245</p>
                <p className="text-xs text-green-500">+12% from last month</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <RefreshCw className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search workflows..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Workflows Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {workflow.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", getStatusColor(workflow.status))} />
                      <span className="text-xs capitalize">{workflow.status}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">{workflow.category}</Badge>
                    <Badge variant="secondary">{workflow.trigger}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">{workflow.successRate}%</span>
                    </div>
                    <Progress value={workflow.successRate} className="h-2" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-medium">{workflow.lastRun}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Next Run</p>
                        <p className="font-medium">{workflow.nextRun}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>{workflow.createdBy.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {workflow.createdBy}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon">
                      {workflow.status === "active" ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Monitor the latest workflow executions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExecutions.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell className="font-medium">{exec.workflow}</TableCell>
                      <TableCell>
                        <Badge
                          variant={exec.status === "success" ? "default" : "destructive"}
                          className="gap-1"
                        >
                          {exec.status === "success" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {exec.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{exec.duration}</TableCell>
                      <TableCell>{exec.started}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 5 most recent executions
              </p>
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Templates Coming Soon</AlertTitle>
            <AlertDescription>
              Workflow templates will be available in the next update. You can still create custom workflows.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>
                Configure global workflow settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Auto-retry</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically retry failed workflows
                  </p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Execution Logs</p>
                  <p className="text-sm text-muted-foreground">
                    Keep logs for 30 days
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Send notifications for failed workflows
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    <Footer/>
    </div>
  )
}