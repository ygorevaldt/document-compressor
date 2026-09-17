'use client';

import * as React from 'react';
import { Loader2, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';

export interface CompressionProgressProps {
  fileName: string;
  fileSize: number;
  progress?: number;
  stage?: string;
}

export const CompressionProgress: React.FC<CompressionProgressProps> = ({
  fileName,
  fileSize,
  progress = 0,
  stage = 'Comprimindo documento...',
}) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs sm:max-w-md">
              {fileName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(fileSize)}</p>
          </div>
        </div>

        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Loader2 className="w-3 h-3 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Processando</span>
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{stage}</span>
          <span className="font-mono font-medium">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};
