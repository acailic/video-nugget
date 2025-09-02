import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { TauriAPI, VideoNugget, VideoInfo, ProcessingConfig } from '@/lib/tauri-api';

export const VideoProcessor: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [nuggets, setNuggets] = useState<VideoNugget[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState<ProcessingConfig>({
    nugget_duration: 30,
    overlap_duration: 5,
    extract_transcript: true,
  });

  const { toast } = useToast();

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

    setProcessing(true);
    try {
      const result = await TauriAPI.processVideo(url, config);
      if (result.success) {
        setNuggets(result.nuggets);
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to process video: ${error}`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveNuggets = async () => {
    if (nuggets.length === 0) {
      toast({
        title: "Error",
        description: "No nuggets to save",
        variant: "destructive",
      });
      return;
    }

    try {
      // For now, we'll use a default filename
      const filename = `nuggets-${Date.now()}.json`;
      const result = await TauriAPI.saveNuggets(nuggets, filename);
      toast({
        title: "Success",
        description: result,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save nuggets: ${error}`,
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
      const filename = `export-${Date.now()}.${format === 'markdown' ? 'md' : format}`;
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

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Processing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleGetVideoInfo} disabled={loading}>
              {loading ? 'Loading...' : 'Get Video Info'}
            </Button>
          </div>

          {videoInfo && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold">{videoInfo.title}</h3>
                <p className="text-sm text-gray-600">
                  Duration: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toFixed(0).padStart(2, '0')}
                </p>
                {videoInfo.thumbnail && (
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="mt-2 w-32 h-24 object-cover rounded"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processing Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nugget Duration: {config.nugget_duration}s</Label>
            <Slider
              value={[config.nugget_duration || 30]}
              onValueChange={(values) => setConfig({ ...config, nugget_duration: values[0] })}
              min={10}
              max={120}
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

          <div className="flex items-center space-x-2">
            <Switch
              checked={config.extract_transcript}
              onCheckedChange={(checked) => setConfig({ ...config, extract_transcript: checked })}
            />
            <Label>Extract Transcript</Label>
          </div>

          <Button onClick={handleProcessVideo} disabled={processing} className="w-full">
            {processing ? 'Processing...' : 'Process Video'}
          </Button>
        </CardContent>
      </Card>

      {nuggets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Nuggets ({nuggets.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSaveNuggets} variant="outline">
                Save Nuggets
              </Button>
              <Button onClick={() => handleExport('json')} variant="outline">
                Export JSON
              </Button>
              <Button onClick={() => handleExport('csv')} variant="outline">
                Export CSV
              </Button>
              <Button onClick={() => handleExport('markdown')} variant="outline">
                Export Markdown
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {nuggets.map((nugget, index) => (
                <Card key={nugget.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{nugget.title}</h4>
                      <p className="text-sm text-gray-600">
                        {nugget.start_time.toFixed(1)}s - {nugget.end_time.toFixed(1)}s
                      </p>
                      {nugget.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {nugget.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {nugget.transcript && (
                        <p className="text-sm mt-2 text-gray-700">
                          {nugget.transcript}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};