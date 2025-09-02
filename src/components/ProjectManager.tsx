import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useProjectManager, Project, VideoProject, ProjectSettings } from '@/lib/tauri-api-enhanced';
import { Plus, Folder, Video, Settings, Users, Download, Upload, Trash2 } from 'lucide-react';

export const ProjectManager: React.FC = () => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { 
    projects, 
    currentProject, 
    loading, 
    refreshProjects, 
    createProject, 
    loadProject 
  } = useProjectManager();
  
  const { toast } = useToast();

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a project name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createProject(newProjectName, newProjectDescription || undefined);
      
      toast({
        title: "Success",
        description: `Project "${newProjectName}" created successfully`,
      });

      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create project: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      await loadProject(projectId);
      toast({
        title: "Success",
        description: "Project loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load project: ${error}`,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Project Manager</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="My Video Project"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Description (Optional)</Label>
                <Textarea
                  id="projectDescription"
                  placeholder="A brief description of your project..."
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateProject} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">All Projects</TabsTrigger>
          {currentProject && (
            <TabsTrigger value="current">
              Current: {currentProject.name}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects">
          {loading && (
            <div className="text-center py-8">
              <p>Loading projects...</p>
            </div>
          )}

          {projects.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-12">
                <Folder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first project to start organizing your video content.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    {currentProject?.id === project.id && (
                      <Badge variant="secondary">Active</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Video className="w-4 h-4 mr-1" />
                      <span>{project.metadata.total_videos} videos</span>
                    </div>
                    <div className="flex items-center">
                      <span>{project.metadata.total_nuggets} nuggets</span>
                    </div>
                    <div>
                      <span>{formatDuration(project.metadata.total_duration_seconds)}</span>
                    </div>
                    <div>
                      <span>{formatFileSize(project.metadata.storage_used_mb * 1024 * 1024)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mb-4">
                    Last activity: {new Date(project.metadata.last_activity).toLocaleDateString()}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleLoadProject(project.id)}
                      size="sm"
                      className="flex-1"
                    >
                      {currentProject?.id === project.id ? 'Reload' : 'Load'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedProject(project);
                        setShowSettingsDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {project.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {currentProject && (
          <TabsContent value="current">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{currentProject.name}</CardTitle>
                      {currentProject.description && (
                        <p className="text-gray-600 mt-1">{currentProject.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currentProject.metadata.total_videos}
                      </div>
                      <div className="text-sm text-gray-600">Videos</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentProject.metadata.total_nuggets}
                      </div>
                      <div className="text-sm text-gray-600">Nuggets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatDuration(currentProject.metadata.total_duration_seconds)}
                      </div>
                      <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatFileSize(currentProject.metadata.storage_used_mb * 1024 * 1024)}
                      </div>
                      <div className="text-sm text-gray-600">Storage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentProject.videos.length === 0 ? (
                    <div className="text-center py-8">
                      <Video className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No videos in this project yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Use the Video Processor to add videos to this project
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentProject.videos.map((video) => (
                        <Card key={video.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{video.video_info.title}</h4>
                              <Badge 
                                variant={
                                  video.status === 'Completed' ? 'default' : 
                                  video.status === 'Processing' ? 'secondary' : 
                                  video.status === 'Failed' ? 'destructive' : 'outline'
                                }
                              >
                                {video.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span>{formatDuration(video.video_info.duration)}</span>
                              <span>{video.nuggets.length} nuggets</span>
                              {video.analysis && (
                                <span>AI analyzed</span>
                              )}
                            </div>

                            {video.custom_tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {video.custom_tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {video.notes && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {video.notes}
                              </p>
                            )}

                            <div className="text-xs text-gray-500 mt-2">
                              Added: {new Date(video.created_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {currentProject.collaborators.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Collaborators
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentProject.collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{collaborator.name}</div>
                            <div className="text-sm text-gray-600">{collaborator.email}</div>
                          </div>
                          <Badge variant="outline">{collaborator.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Project Settings: {selectedProject?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Project settings will be available in a future update.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowSettingsDialog(false)}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};