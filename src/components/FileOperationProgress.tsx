import React, { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Pause, Play, X, FileIcon, FolderIcon } from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/tauri';

interface FileOpProgress {
  current_file: string;
  files_completed: number;
  total_files: number;
  bytes_copied: number;
  total_bytes: number;
  current_file_progress: number;
  overall_progress: number;
  operation_type: string;
  status: string;
  error_message?: string;
}

interface FileOperationProgressProps {
  operationId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function FileOperationProgress({ 
  operationId, 
  onComplete, 
  onCancel 
}: FileOperationProgressProps) {
  const [progress, setProgress] = useState<FileOpProgress>({
    current_file: '',
    files_completed: 0,
    total_files: 0,
    bytes_copied: 0,
    total_bytes: 0,
    current_file_progress: 0,
    overall_progress: 0,
    operation_type: 'copy',
    status: 'running',
  });
  
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unlisten = listen('file_operation_progress', (event: any) => {
      const progressData = event.payload as FileOpProgress;
      setProgress(progressData);
      
      if (progressData.status === 'completed') {
        setTimeout(() => onComplete(), 1000);
      }
    });

    const unlistenComplete = listen('file_operation_complete', (event: any) => {
      onComplete();
    });

    return () => {
      unlisten.then(fn => fn());
      unlistenComplete.then(fn => fn());
    };
  }, [onComplete]);

  const handlePause = async () => {
    try {
      await invoke('pause_file_operation', { operationId });
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause operation:', error);
    }
  };

  const handleResume = async () => {
    try {
      await invoke('resume_file_operation', { operationId });
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume operation:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileName = (path: string): string => {
    return path.split(/[/\\]/).pop() || path;
  };

  const isDirectory = (path: string): boolean => {
    // Simple heuristic - if no extension, likely a directory
    const fileName = getFileName(path);
    return !fileName.includes('.');
  };

  const remainingFiles = progress.total_files - progress.files_completed;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {progress.operation_type === 'move' ? 'Moving' : 'Copying'} Files
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={progress.status === 'error' ? 'destructive' : 'default'}>
              {progress.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress.overall_progress)}%</span>
          </div>
          <Progress value={progress.overall_progress} className="h-2" />
        </div>

        {/* Current File Progress */}
        {progress.current_file && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current File</span>
              <span>{Math.round(progress.current_file_progress)}%</span>
            </div>
            <Progress value={progress.current_file_progress} className="h-1" />
          </div>
        )}

        {/* Current File Info */}
        {progress.current_file && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            {isDirectory(progress.current_file) ? (
              <FolderIcon className="h-4 w-4 text-blue-500" />
            ) : (
              <FileIcon className="h-4 w-4 text-gray-500" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {getFileName(progress.current_file)}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {progress.current_file}
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Files Completed</p>
            <p className="font-medium">
              {progress.files_completed} / {progress.total_files}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-medium">{remainingFiles} files</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data Copied</p>
            <p className="font-medium">{formatBytes(progress.bytes_copied)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Size</p>
            <p className="font-medium">{formatBytes(progress.total_bytes)}</p>
          </div>
        </div>

        {/* Error Message */}
        {progress.error_message && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{progress.error_message}</p>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {progress.status === 'running' && !isPaused && (
            <Button variant="outline" size="sm" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {isPaused && (
            <Button variant="outline" size="sm" onClick={handleResume}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}