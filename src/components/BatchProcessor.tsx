import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBatchProcessor, BatchJob, BatchConfig, BatchStatus } from '@/lib/tauri-api-enhanced';
import { Play, Pause, Square, Trash2, Plus, RefreshCw } from 'lucide-react';

export const BatchProcessor: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [jobName, setJobName] = useState('');
  const [outputDirectory, setOutputDirectory] = useState('./output');
  const [concurrentJobs, setConcurrentJobs] = useState(3);
  const [config, setConfig] = useState<Partial<BatchConfig>>({
    enable_ai_analysis: true,
    enable_transcript: true,
    enable_social_formats: true,
    export_formats: ['json', 'csv'],
    retry_failed: true,
    max_retries: 2,
  });

  const { jobs, loading, refreshJobs, createJob, startJob, cancelJob } = useBatchProcessor();
  const { toast } = useToast();

  useEffect(() => {
    refreshJobs();
  }, []);

  const handleCreateBatchJob = async () => {
    if (!jobName.trim() || !urls.trim()) {
      toast({
        title: "Error",
        description: "Please provide job name and URLs",
        variant: "destructive",
      });
      return;
    }

    const urlList = urls.split('\n').filter(url => url.trim());
    if (urlList.length === 0) {
      toast({
        title: "Error",
        description: "Please provide at least one valid URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const batchConfig: BatchConfig = {
        video_config: {
          nugget_duration: 30,
          overlap_duration: 5,
          extract_transcript: config.enable_transcript,
        },
        output_directory: outputDirectory,
        export_formats: config.export_formats || ['json'],
        enable_ai_analysis: config.enable_ai_analysis || false,
        enable_transcript: config.enable_transcript || false,
        enable_social_formats: config.enable_social_formats || false,
        concurrent_jobs: concurrentJobs,
        retry_failed: config.retry_failed || false,
        max_retries: config.max_retries || 0,
      };

      await createJob(jobName, urlList, batchConfig);
      
      toast({
        title: "Success",
        description: `Batch job "${jobName}" created successfully`,
      });

      // Reset form
      setJobName('');
      setUrls('');
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create batch job: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await startJob(jobId);
      toast({
        title: "Success",
        description: "Batch job started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to start job: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
      toast({
        title: "Success",
        description: "Batch job cancelled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to cancel job: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.Pending: return 'bg-gray-500';
      case BatchStatus.Running: return 'bg-blue-500';
      case BatchStatus.Completed: return 'bg-green-500';
      case BatchStatus.Failed: return 'bg-red-500';
      case BatchStatus.Cancelled: return 'bg-yellow-500';
      case BatchStatus.Paused: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Batch Job</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Batch Job</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobName">Job Name</Label>
                <Input
                  id="jobName"
                  placeholder="My Video Processing Job"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urls">Video URLs (one per line)</Label>
                <Textarea
                  id="urls"
                  placeholder={`https://www.youtube.com/watch?v=example1\nhttps://www.youtube.com/watch?v=example2\nhttps://www.youtube.com/watch?v=example3`}
                  rows={6}
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputDir">Output Directory</Label>
                <Input
                  id="outputDir"
                  value={outputDirectory}
                  onChange={(e) => setOutputDirectory(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="concurrent">Concurrent Jobs: {concurrentJobs}</Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={concurrentJobs}
                  onChange={(e) => setConcurrentJobs(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_transcript}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, enable_transcript: checked })
                    }
                  />
                  <Label>Enable Transcription</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_ai_analysis}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, enable_ai_analysis: checked })
                    }
                  />
                  <Label>AI Analysis</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_social_formats}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, enable_social_formats: checked })
                    }
                  />
                  <Label>Social Media Formats</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.retry_failed}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, retry_failed: checked })
                    }
                  />
                  <Label>Retry Failed</Label>
                </div>
              </div>

              <Button onClick={handleCreateBatchJob} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Batch Job
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Batch Jobs</h3>
              <Button onClick={refreshJobs} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            {loading && (
              <div className="text-center py-4">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                <p className="text-sm text-gray-600 mt-2">Loading jobs...</p>
              </div>
            )}

            {jobs.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-600">No batch jobs found</p>
                </CardContent>
              </Card>
            )}

            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">{job.name}</h4>
                      <p className="text-sm text-gray-600">
                        {job.urls.length} videos • Created {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                  </div>

                  {job.status === BatchStatus.Running && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.progress.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={job.progress.percentage} />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>
                          {job.progress.processed_videos} / {job.progress.total_videos} processed
                        </span>
                        {job.progress.eta_minutes && (
                          <span>ETA: {Math.ceil(job.progress.eta_minutes)}min</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span>Processed: {job.progress.processed_videos}</span>
                      {job.progress.failed_videos > 0 && (
                        <span className="text-red-600 ml-4">
                          Failed: {job.progress.failed_videos}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      {job.status === BatchStatus.Pending && (
                        <Button 
                          onClick={() => handleStartJob(job.id)}
                          size="sm"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === BatchStatus.Running && (
                        <Button 
                          onClick={() => handleCancelJob(job.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.results.length > 0 && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Results</h5>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {job.results.slice(0, 5).map((result, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="truncate flex-1">
                              {result.video_info?.title || result.url}
                            </span>
                            <span className={`ml-2 ${
                              result.status === 'Success' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                        ))}
                        {job.results.length > 5 && (
                          <p className="text-xs text-gray-600">
                            +{job.results.length - 5} more results
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};