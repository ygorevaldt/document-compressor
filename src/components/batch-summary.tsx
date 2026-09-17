'use client';

import * as React from 'react';
import { Download, ArrowDown, CheckCircle2, AlertCircle, RefreshCw, Archive, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/utils';
import { BatchItemResult } from '@/modules/compression/services/batch-compression-service';

export interface BatchSummaryProps {
  batchId: string;
  totalFiles: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  totalBytesSaved: number;
  overallReductionPercentage: number;
  zipDownloadUrl?: string;
  items: BatchItemResult[];
  onReset: () => void;
}

export const BatchSummary: React.FC<BatchSummaryProps> = ({
  totalFiles,
  totalOriginalBytes,
  totalCompressedBytes,
  totalBytesSaved,
  overallReductionPercentage,
  zipDownloadUrl,
  items,
  onReset,
}) => {
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Compressão em Lote Concluída
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {completedCount} de {totalFiles} arquivos comprimidos com sucesso
              {failedCount > 0 && ` (${failedCount} com falha)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{failedCount} Falharam</span>
            </Badge>
          )}
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{completedCount} Concluídos</span>
          </Badge>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lote Original</span>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {formatBytes(totalOriginalBytes)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lote Comprimido</span>
          <p className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {formatBytes(totalCompressedBytes)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800/80">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Economizado</span>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBytes(totalBytesSaved)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
            <ArrowDown className="w-3 h-3" /> Redução Geral
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
            {overallReductionPercentage}%
          </p>
        </div>
      </div>

      {/* Per-File Summary List */}
      <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800 max-h-60 overflow-y-auto">
        {items.map((item, idx) => (
          <div key={`${item.fileName}-${idx}`} className="p-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                  {item.fileName}
                </span>
                {item.status === 'completed' && item.originalSize && item.compressedSize ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(item.originalSize)} → {formatBytes(item.compressedSize)} (-{item.reductionPercentage}%)
                  </span>
                ) : (
                  <span className="text-xs text-red-500">{item.error || 'Falha'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {item.status === 'completed' && item.downloadUrl ? (
                <a href={item.downloadUrl} download>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Download className="w-3 h-3" />
                    Baixar
                  </Button>
                </a>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Erro
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        {zipDownloadUrl && (
          <a href={zipDownloadUrl} download className="w-full sm:w-auto flex-1">
            <Button size="lg" className="w-full gap-2 text-base shadow-sm">
              <Archive className="w-4 h-4" />
              Baixar Todos em Arquivo ZIP
            </Button>
          </a>
        )}

        <Button variant="outline" size="lg" onClick={onReset} className="w-full sm:w-auto gap-2">
          <RefreshCw className="w-4 h-4" />
          Comprimir Outro Lote
        </Button>
      </div>
    </div>
  );
};
