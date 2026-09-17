'use client';

import * as React from 'react';
import { CompressionProfileName } from '@/core/types/document';
import { PROFILE_METADATA } from '@/modules/compression/profiles/compression-profiles';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Zap, Shield, Sparkles } from 'lucide-react';

export interface ProfileSelectorProps {
  value: CompressionProfileName;
  onChange: (profile: CompressionProfileName) => void;
  disabled?: boolean;
  className?: string;
}

const PROFILE_ICONS: Record<CompressionProfileName, React.ReactNode> = {
  recommended: <Zap className="w-4 h-4 text-blue-500" />,
  maximum: <Sparkles className="w-4 h-4 text-amber-500" />,
  high_fidelity: <Shield className="w-4 h-4 text-emerald-500" />,
};

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const profiles: CompressionProfileName[] = ['recommended', 'maximum', 'high_fidelity'];

  return (
    <div className={cn('w-full space-y-2', className)}>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Perfil de Compressão
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {profiles.map((profileKey) => {
          const meta = PROFILE_METADATA[profileKey];
          const isSelected = value === profileKey;

          return (
            <button
              key={profileKey}
              type="button"
              disabled={disabled}
              onClick={() => onChange(profileKey)}
              className={cn(
                'flex flex-col text-left p-4 rounded-xl border transition-all duration-150',
                isSelected
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900 dark:text-gray-100">
                  {PROFILE_ICONS[profileKey]}
                  <span>{meta.label}</span>
                </div>
                <Badge
                  variant={isSelected ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {meta.badge}
                </Badge>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                {meta.description}
              </p>

              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-auto">
                {meta.targetReduction}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
