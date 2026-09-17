'use client';

import * as React from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  className?: string;
}

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  onFilesSelect,
  disabled = false,
  multiple = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const validateAndHandleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;

    setValidationError(null);

    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lowerName = file.name.toLowerCase();
      const isAccepted = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

      if (!isAccepted) {
        setValidationError(`"${file.name}" possui formato não suportado. Apenas arquivos .pdf, .docx e .doc são permitidos.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(`"${file.name}" excede o limite máximo de 500MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        return;
      }

      validFiles.push(file);
    }

    if (multiple && onFilesSelect) {
      onFilesSelect(validFiles);
    } else if (validFiles.length > 0) {
      onFileSelect(validFiles[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    validateAndHandleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndHandleFiles(e.target.files);
    // Reset file input so selecting identical file triggers change
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ease-in-out',
          isDragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.008]'
            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white/60 dark:bg-gray-900/60',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {isDragOver ? 'Solte o documento aqui' : 'Arraste e solte seu documento aqui ou clique para selecionar'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
          Suporta <span className="font-medium text-gray-700 dark:text-gray-300">PDF, DOCX e DOC</span> de até 500MB
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> 100% de preservação de texto e formatação garantida
          </span>
        </div>
      </div>

      {validationError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg border border-red-200 dark:border-red-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
};
