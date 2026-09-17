'use client';

import * as React from 'react';
import { FileDropzone } from '@/components/file-dropzone';
import { CompressionProgress } from '@/components/compression-progress';
import { MetricsDashboard } from '@/components/metrics-dashboard';
import { ProfileSelector } from '@/components/profile-selector';
import { BatchQueue, BatchQueueItem } from '@/components/batch-queue';
import { BatchSummary } from '@/components/batch-summary';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { CompressionResult, CompressionProfileName } from '@/core/types/document';
import { BatchCompressionResult } from '@/modules/compression/services/batch-compression-service';
import { Sparkles, AlertCircle, FileStack, Files, FileText, ArrowRight } from 'lucide-react';

type Mode = 'single' | 'batch';
type ProcessState = 'idle' | 'compressing' | 'completed' | 'error';

export default function HomePage() {
  const [mode, setMode] = React.useState<Mode>('single');
  const [state, setState] = React.useState<ProcessState>('idle');
  const [selectedProfile, setSelectedProfile] = React.useState<CompressionProfileName>('recommended');

  // Single file state
  const [activeFile, setActiveFile] = React.useState<File | null>(null);
  const [singleProgress, setSingleProgress] = React.useState(0);
  const [singleStage, setSingleStage] = React.useState('Preparando documento...');
  const [singleResult, setSingleResult] = React.useState<CompressionResult | null>(null);

  // Batch files state
  const [batchFiles, setBatchFiles] = React.useState<File[]>([]);
  const [batchQueueItems, setBatchQueueItems] = React.useState<BatchQueueItem[]>([]);
  const [batchResult, setBatchResult] = React.useState<BatchCompressionResult | null>(null);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Single file selection handler
  const handleSingleFileSelect = async (file: File) => {
    setActiveFile(file);
    setState('compressing');
    setSingleProgress(10);
    setSingleStage('Enviando e analisando documento...');
    setErrorMessage(null);

    const progressInterval = setInterval(() => {
      setSingleProgress((prev) => {
        if (prev < 35) {
          setSingleStage('Analisando objetos de fluxo e mídias incorporadas...');
          return prev + 6;
        } else if (prev < 75) {
          setSingleStage('Otimizando imagens, fontes e fluxos...');
          return prev + 4;
        } else if (prev < 92) {
          setSingleStage('Aplicando verificação anti-inflação...');
          return prev + 2;
        }
        return prev;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profile', selectedProfile);

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setSingleProgress(100);
      setSingleStage('Finalizando...');

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'A compressão falhou. Por favor, tente novamente.');
      }

      setSingleResult(json.data);
      setState('completed');
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro durante a compressão.';
      setErrorMessage(msg);
      setState('error');
    }
  };

  // Multiple files selection handler
  const handleMultipleFilesSelect = (files: File[]) => {
    if (files.length === 1 && mode === 'single') {
      handleSingleFileSelect(files[0]);
      return;
    }

    setMode('batch');
    const newFiles = [...batchFiles, ...files].slice(0, 10);
    setBatchFiles(newFiles);
    setBatchQueueItems(
      newFiles.map((f) => ({
        fileName: f.name,
        fileSize: f.size,
        status: 'pending',
      }))
    );
  };

  const handleRemoveBatchItem = (index: number) => {
    const updatedFiles = batchFiles.filter((_, i) => i !== index);
    setBatchFiles(updatedFiles);
    setBatchQueueItems(
      updatedFiles.map((f) => ({
        fileName: f.name,
        fileSize: f.size,
        status: 'pending',
      }))
    );
  };

  const handleStartBatchCompression = async () => {
    if (batchFiles.length === 0) return;

    setState('compressing');
    setErrorMessage(null);

    // Set all to processing
    setBatchQueueItems((prev) =>
      prev.map((item) => ({ ...item, status: 'processing' }))
    );

    try {
      const formData = new FormData();
      batchFiles.forEach((file) => formData.append('files', file));
      formData.append('profile', selectedProfile);

      const response = await fetch('/api/batch/compress', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || 'A compressão em lote falhou.');
      }

      setBatchResult(json.data);
      setState('completed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ocorreu um erro durante a compressão em lote.';
      setErrorMessage(msg);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setActiveFile(null);
    setSingleProgress(0);
    setSingleResult(null);
    setBatchFiles([]);
    setBatchQueueItems([]);
    setBatchResult(null);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-8 md:p-12 max-w-4xl mx-auto">
      {/* Top Navbar with Theme Toggle */}
      <div className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs tracking-tight shadow-xs">
            DC
          </div>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 tracking-tight">
            Compressor de Documentos
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Top Header */}
      <header className="text-center py-6 sm:py-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Otimização Sem Perdas & 100% de Fidelidade</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          Compressor de Documentos
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Comprima documentos PDF e Word mantendo total fidelidade de layout, tipografia e formatação.
        </p>

        {state === 'idle' && (
          <div className="pt-2 flex justify-center">
            <Tabs
              value={mode}
              onValueChange={(val) => {
                setMode(val as Mode);
                handleReset();
              }}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="single" className="gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Documento Único</span>
                </TabsTrigger>
                <TabsTrigger value="batch" className="gap-1.5">
                  <Files className="w-4 h-4" />
                  <span>Em Lote (Até 10 Arquivos)</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </header>

      {/* Main Action Area */}
      <section className="flex-1 flex flex-col items-center justify-center w-full my-4">
        {state === 'idle' && (
          <div className="w-full space-y-6">
            <ProfileSelector
              value={selectedProfile}
              onChange={setSelectedProfile}
            />

            {mode === 'single' ? (
              <FileDropzone onFileSelect={handleSingleFileSelect} />
            ) : (
              <div className="space-y-4">
                <FileDropzone
                  multiple
                  onFileSelect={(f) => handleMultipleFilesSelect([f])}
                  onFilesSelect={handleMultipleFilesSelect}
                />

                {batchFiles.length > 0 && (
                  <>
                    <BatchQueue
                      items={batchQueueItems}
                      onRemoveItem={handleRemoveBatchItem}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="lg"
                        onClick={handleStartBatchCompression}
                        className="gap-2"
                      >
                        <span>Iniciar Compressão em Lote ({batchFiles.length})</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {state === 'compressing' && (
          <div className="w-full">
            {mode === 'single' && activeFile ? (
              <CompressionProgress
                fileName={activeFile.name}
                fileSize={activeFile.size}
                progress={singleProgress}
                stage={singleStage}
              />
            ) : (
              <BatchQueue items={batchQueueItems} disabled />
            )}
          </div>
        )}

        {state === 'completed' && (
          <div className="w-full">
            {mode === 'single' && singleResult ? (
              <MetricsDashboard result={singleResult} onReset={handleReset} />
            ) : batchResult ? (
              <BatchSummary
                batchId={batchResult.batchId}
                totalFiles={batchResult.totalFiles}
                totalOriginalBytes={batchResult.totalOriginalBytes}
                totalCompressedBytes={batchResult.totalCompressedBytes}
                totalBytesSaved={batchResult.totalBytesSaved}
                overallReductionPercentage={batchResult.overallReductionPercentage}
                zipDownloadUrl={batchResult.zipDownloadUrl}
                items={batchResult.items}
                onReset={handleReset}
              />
            ) : null}
          </div>
        )}

        {state === 'error' && (
          <div className="w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Erro na Compressão</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button onClick={handleReset} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <FileStack className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Processamento com deduplicação inteligente por SHA-256</span>
        </div>
        <div className="flex items-center gap-1.5 text-center sm:text-right">
          <span>Criado por</span>
          <a
            href="https://github.com/ygorevaldt"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline underline-offset-2"
          >
            Ygor Evaldt
          </a>
        </div>
      </footer>
    </main>
  );
}
