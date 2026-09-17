import { CompressionProfileConfig, CompressionProfileName } from '@/core/types/document';

export const COMPRESSION_PROFILES: Record<CompressionProfileName, CompressionProfileConfig> = {
  recommended: {
    name: 'recommended',
    imageDpi: 150,
    jpegQuality: 80,
    pngPalette: true,
    xmlDeflateLevel: 9,
    stripMetadata: true,
  },
  maximum: {
    name: 'maximum',
    imageDpi: 72,
    jpegQuality: 65,
    pngPalette: true,
    xmlDeflateLevel: 9,
    stripMetadata: true,
  },
  high_fidelity: {
    name: 'high_fidelity',
    imageDpi: 300,
    jpegQuality: 90,
    pngPalette: false,
    xmlDeflateLevel: 9,
    stripMetadata: false,
  },
};

export interface ProfileMetadata {
  readonly id: CompressionProfileName;
  readonly label: string;
  readonly description: string;
  readonly badge: string;
  readonly targetReduction: string;
}

export const PROFILE_METADATA: Record<CompressionProfileName, ProfileMetadata> = {
  recommended: {
    id: 'recommended',
    label: 'Recomendado',
    description: 'Otimização balanceada (150 DPI) com preservação total de textos, fontes e estrutura.',
    badge: 'Mais Popular',
    targetReduction: '30% a 50% de redução',
  },
  maximum: {
    id: 'maximum',
    label: 'Máximo',
    description: 'Compressão agressiva (72 DPI) ideal para limites rigorosos de e-mails e portais.',
    badge: 'Menor Tamanho',
    targetReduction: '50% a 70% de redução',
  },
  high_fidelity: {
    id: 'high_fidelity',
    label: 'Alta Fidelidade',
    description: 'Preservação arquivística (300 DPI) com máxima nitidez visual para impressão e acervos.',
    badge: 'Melhor Qualidade',
    targetReduction: '15% a 30% de redução',
  },
};

export function isValidProfileName(name: string): name is CompressionProfileName {
  return name === 'recommended' || name === 'maximum' || name === 'high_fidelity';
}

export function getProfileConfig(name: string): CompressionProfileConfig {
  if (isValidProfileName(name)) {
    return COMPRESSION_PROFILES[name];
  }
  return COMPRESSION_PROFILES.recommended;
}
