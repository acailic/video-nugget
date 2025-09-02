import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  TauriAPI, 
  VideoNugget, 
  VideoInfo, 
  ProcessingConfig, 
  ContentAnalysis,
  SpeechAnalysis,
  useVideoProcessor,
  useProjectManager
} from '@/lib/tauri-api-enhanced';
import { Play, Download, Share, MessageSquare, Brain, Video, FileText, Waveform, Sparkles } from 'lucide-react';

export const EnhancedVideoProcessor: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [nuggets, setNuggets] = useState<VideoNugget[]>([]);
  const [transcript, setTranscript] = useState<SpeechAnalysis | null>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState<ProcessingConfig>({
    nugget_duration: 30,
    overlap_duration: 5,
    enable_transcript: true,
    enable_ai_analysis: true,
    enable_social_formats: true,
  });

  const [activeTab, setActiveTab] = useState('process');
  const [selectedProject, setSelectedProject] = useState<string>('');

  const { processing, result, error, processVideo } = useVideoProcessor();
  const { projects, addVideoToProject } = useProjectManager();
  const { toast } = useToast();

  useEffect(() => {
    if (result) {
      setNuggets(result.nuggets);
    }
  }, [result]);

  const handleGetVideoInfo = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const info = await TauriAPI.getVideoInfo(url);
      setVideoInfo(info);
      setActiveTab('configure');
      toast({
        title: "Success",
        description: "Video information loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to get video info: ${error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessVideo = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await processVideo(url, config);
      setActiveTab('results');
      
      // Extract transcript if enabled
      if (config.enable_transcript) {
        try {
          const transcriptResult = await TauriAPI.extractTranscript(url);
          setTranscript(transcriptResult);
          
          // Perform AI analysis if enabled
          if (config.enable_ai_analysis && videoInfo) {
            const fullTranscript = transcriptResult.segments
              .map(s => s.text)
              .join(' ');
            
            const analysisResult = await TauriAPI.analyzeContent(
              fullTranscript, 
              videoInfo.title
            );
            setAnalysis(analysisResult);
          }
        } catch (transcriptError) {
          console.warn('Transcript extraction failed:', transcriptError);
        }
      }

      toast({
        title: "Success",
        description: `Video processed successfully! Generated ${result.nuggets.length} nuggets`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process video: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleSaveToProject = async () => {
    if (!selectedProject || !videoInfo || nuggets.length === 0) {
      toast({
        title: "Error",
        description: "Please select a project and process a video first",
        variant: "destructive",
      });
      return;
    }

    try {
      await addVideoToProject(selectedProject, videoInfo, nuggets, analysis || undefined);
      toast({
        title: "Success",
        description: "Video added to project successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add video to project: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    if (nuggets.length === 0) {
      toast({
        title: "Error",
        description: "No nuggets to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const filename = `nuggets-${Date.now()}.${format === 'markdown' ? 'md' : format}`;
      const result = await TauriAPI.exportNuggets(nuggets, format, filename);
      toast({
        title: "Success",
        description: result,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to export: ${error}`,
        variant: "destructive",
      });
    }
  };

  const handleGenerateSubtitles = async (format: 'srt' | 'vtt' | 'ass') => {
    if (!transcript) {
      toast({
        title: "Error",
        description: "No transcript available for subtitle generation",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtitles = await TauriAPI.generateSubtitles(transcript.segments, format);
      
      // Create and download the subtitle file
      const blob = new Blob([subtitles], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitles.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Subtitles generated in ${format.toUpperCase()} format`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate subtitles: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2" />
            Enhanced Video Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleGetVideoInfo} disabled={loading}>
              {loading ? 'Loading...' : 'Analyze URL'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="configure" disabled={!videoInfo}>Configure</TabsTrigger>
          <TabsTrigger value="results" disabled={nuggets.length === 0}>Results</TabsTrigger>
          <TabsTrigger value="analysis" disabled={!analysis && !transcript}>Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          {videoInfo && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  {videoInfo.thumbnail && (
                    <img
                      src={videoInfo.thumbnail}
                      alt="Video thumbnail"
                      className="w-32 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{videoInfo.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Duration: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toFixed(0).padStart(2, '0')}</div>
                      <div>URL: {new URL(videoInfo.url).hostname}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configure">
          <Card>
            <CardHeader>
              <CardTitle>Processing Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nugget Duration: {config.nugget_duration}s</Label>
                <Slider
                  value={[config.nugget_duration || 30]}
                  onValueChange={(values) => setConfig({ ...config, nugget_duration: values[0] })}
                  min={5}
                  max={300}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Overlap Duration: {config.overlap_duration}s</Label>
                <Slider
                  value={[config.overlap_duration || 5]}
                  onValueChange={(values) => setConfig({ ...config, overlap_duration: values[0] })}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_transcript}
                    onCheckedChange={(checked) => setConfig({ ...config, enable_transcript: checked })}
                  />
                  <Label className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Transcription
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_ai_analysis}
                    onCheckedChange={(checked) => setConfig({ ...config, enable_ai_analysis: checked })}
                  />
                  <Label className="flex items-center">
                    <Brain className="w-4 h-4 mr-1" />
                    AI Analysis
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.enable_social_formats}
                    onCheckedChange={(checked) => setConfig({ ...config, enable_social_formats: checked })}
                  />
                  <Label className="flex items-center">
                    <Share className="w-4 h-4 mr-1" />
                    Social Formats
                  </Label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                {projects.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Label>Save to Project:</Label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleProcessVideo} disabled={processing} className="ml-auto">
                  <Play className="w-4 h-4 mr-2" />
                  {processing ? 'Processing...' : 'Process Video'}
                </Button>
              </div>

              {processing && (
                <div className="space-y-2">
                  <Progress value={50} className="w-full" />
                  <p className="text-sm text-center text-gray-600">
                    Processing video... This may take a few minutes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Generated Nuggets ({nuggets.length})</CardTitle>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleExport('json')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                    <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                    <Button onClick={() => handleExport('markdown')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      MD
                    </Button>
                    {selectedProject && (
                      <Button onClick={handleSaveToProject} size="sm">
                        Save to Project
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {nuggets.map((nugget, index) => (
                    <Card key={nugget.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{nugget.title}</h4>
                          <div className="text-sm text-gray-600">
                            {nugget.start_time.toFixed(1)}s - {nugget.end_time.toFixed(1)}s
                          </div>
                        </div>
                        
                        {nugget.transcript && (
                          <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                            {nugget.transcript}
                          </p>
                        )}

                        {nugget.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {nugget.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-6">
            {transcript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Waveform className="w-5 h-5 mr-2" />
                    Speech Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {transcript.segments.length}
                      </div>
                      <div className="text-sm text-gray-600">Segments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.floor(transcript.total_speech_time / 60)}m
                      </div>
                      <div className="text-sm text-gray-600">Speech Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {transcript.word_count}
                      </div>
                      <div className="text-sm text-gray-600">Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(transcript.average_confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Confidence</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button onClick={() => handleGenerateSubtitles('srt')} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      SRT
                    </Button>
                    <Button onClick={() => handleGenerateSubtitles('vtt')} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      VTT
                    </Button>
                    <Button onClick={() => handleGenerateSubtitles('ass')} variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      ASS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Content Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Summary</h4>
                    <p className="text-gray-700">{analysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className={`text-2xl font-bold ${getSentimentColor(analysis.sentiment_score)}`}>
                        {analysis.sentiment_score > 0 ? '+' : ''}{(analysis.sentiment_score * 100).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {(analysis.engagement_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-indigo-600">
                        {analysis.difficulty_level}
                      </div>
                      <div className="text-sm text-gray-600">Difficulty</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.key_topics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Content Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.content_categories.map((category) => (
                        <Badge key={category} className="bg-blue-100 text-blue-800">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Suggested Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggested_tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {analysis.highlight_moments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        Highlight Moments
                      </h4>
                      <div className="space-y-2">
                        {analysis.highlight_moments.slice(0, 5).map((moment, index) => (
                          <div key={index} className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <div className="flex justify-between items-start mb-1">
                              <Badge variant="outline" className="text-xs">
                                {moment.moment_type}
                              </Badge>
                              <span className="text-xs text-gray-600">
                                {moment.start_time.toFixed(1)}s - {moment.end_time.toFixed(1)}s
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{moment.reason}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              Confidence: {(moment.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};