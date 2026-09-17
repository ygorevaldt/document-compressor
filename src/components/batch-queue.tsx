'use client';

import * as React from 'react';
import { FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';

export interface BatchQueueItem {
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  reductionPercentage?: number;
}

export interface BatchQueueProps {
  items: BatchQueueItem[];
  onRemoveItem?: (index: number) => void;
  disabled?: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  items,
  onRemoveItem,
  disabled = false,
}) => {
  const totalSize = items.reduce((acc, i) => acc + i.fileSize, 0);

  return (
    <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Fila de Arquivos ({items.length} documentos)
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tamanho total: {formatBytes(totalSize)}</p>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto pr-1">
        {items.map((item, idx) => (
          <div
            key={`${item.fileName}-${idx}`}
            className="py-3 flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-xs sm:text-sm">
                  {item.fileName}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{formatBytes(item.fileSize)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {item.status === 'pending' && (
                <Badge variant="secondary" className="text-[11px]">
                  Pendente
                </Badge>
              )}

              {item.status === 'processing' && (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  <span>Processando</span>
                </Badge>
              )}

              {item.status === 'completed' && (
                <Badge variant="success" className="gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>
                    {item.reductionPercentage !== undefined
                      ? `-${item.reductionPercentage}%`
                      : 'Concluído'}
                  </span>
                </Badge>
              )}

              {item.status === 'failed' && (
                <Badge variant="destructive" className="gap-1 text-[11px]" title={item.error}>
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span>Falhou</span>
                </Badge>
              )}

              {!disabled && onRemoveItem && item.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                  onClick={() => onRemoveItem(idx)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
