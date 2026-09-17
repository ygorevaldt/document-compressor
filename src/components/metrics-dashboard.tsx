'use client';

import * as React from 'react';
import { Download, ArrowDown, CheckCircle2, Zap, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { CompressionResult } from '@/core/types/document';

export interface MetricsDashboardProps {
  result: CompressionResult;
  onReset: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ result, onReset }) => {
  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-xs sm:max-w-md">
              {result.fileName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Processado em {result.executionDurationMs}ms</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {result.wasCached && (
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Servido do Cache</span>
            </Badge>
          )}
          {result.wasInflatedPrevented && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              <span>Anti-Inflação Ativo</span>
            </Badge>
          )}
          <Badge variant="outline" className="uppercase text-xs font-mono">
            {result.format}
          </Badge>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tamanho Original</span>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {formatBytes(result.originalSize)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tamanho Comprimido</span>
          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatBytes(result.compressedSize)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Espaço Economizado</span>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBytes(result.bytesSaved)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
            <ArrowDown className="w-3 h-3" /> Redução
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {result.reductionPercentage}%
          </p>
        </div>
      </div>

      {/* Download Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <a href={result.downloadUrl} download className="w-full sm:w-auto flex-1">
          <Button size="lg" className="w-full gap-2 text-base shadow-sm">
            <Download className="w-4 h-4" />
            Baixar Arquivo Comprimido
          </Button>
        </a>

        <Button variant="outline" size="lg" onClick={onReset} className="w-full sm:w-auto gap-2">
          <RefreshCw className="w-4 h-4" />
          Comprimir Outro Arquivo
        </Button>
      </div>
    </div>
  );
};
