import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';

export type ArtworkStoreObject = {
  buffer: Buffer;
  mimeType?: AllowedArtworkMimeType | null;
};

export interface ArtworkStore {
  putObject(
    key: string,
    buffer: Buffer,
    mimeType: AllowedArtworkMimeType
  ): Promise<void>;
  getObject(key: string): Promise<ArtworkStoreObject | null>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
}
