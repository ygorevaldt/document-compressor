import { describe, it, expect } from 'vitest';
import {
  getProfileConfig,
  COMPRESSION_PROFILES,
  isValidProfileName,
} from '@/modules/compression/profiles/compression-profiles';

describe('Compression Profiles Unit Tests', () => {
  it('should define all three standard profiles with correct parameters', () => {
    expect(COMPRESSION_PROFILES).toHaveProperty('recommended');
    expect(COMPRESSION_PROFILES).toHaveProperty('maximum');
    expect(COMPRESSION_PROFILES).toHaveProperty('high_fidelity');

    // Recommended
    expect(COMPRESSION_PROFILES.recommended.imageDpi).toBe(150);
    expect(COMPRESSION_PROFILES.recommended.jpegQuality).toBe(80);
    expect(COMPRESSION_PROFILES.recommended.pngPalette).toBe(true);
    expect(COMPRESSION_PROFILES.recommended.stripMetadata).toBe(true);

    // Maximum
    expect(COMPRESSION_PROFILES.maximum.imageDpi).toBe(72);
    expect(COMPRESSION_PROFILES.maximum.jpegQuality).toBe(65);
    expect(COMPRESSION_PROFILES.maximum.pngPalette).toBe(true);
    expect(COMPRESSION_PROFILES.maximum.stripMetadata).toBe(true);

    // High Fidelity
    expect(COMPRESSION_PROFILES.high_fidelity.imageDpi).toBe(300);
    expect(COMPRESSION_PROFILES.high_fidelity.jpegQuality).toBe(90);
    expect(COMPRESSION_PROFILES.high_fidelity.pngPalette).toBe(false);
    expect(COMPRESSION_PROFILES.high_fidelity.stripMetadata).toBe(false);
  });

  it('should resolve profile config by name and default to recommended', () => {
    expect(getProfileConfig('maximum').name).toBe('maximum');
    expect(getProfileConfig('high_fidelity').name).toBe('high_fidelity');
    expect(getProfileConfig('recommended').name).toBe('recommended');
    expect(getProfileConfig('unknown_profile').name).toBe('recommended');
  });

  it('should validate profile names', () => {
    expect(isValidProfileName('recommended')).toBe(true);
    expect(isValidProfileName('maximum')).toBe(true);
    expect(isValidProfileName('high_fidelity')).toBe(true);
    expect(isValidProfileName('ultra')).toBe(false);
    expect(isValidProfileName('')).toBe(false);
  });
});
