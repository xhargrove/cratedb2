import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import { assertValidArtworkKey } from '@/server/storage/artwork-keys';
import type { ArtworkStore } from '@/server/storage/types';

type S3ArtworkStoreConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  accessKeyId: string;
  secretAccessKey: string;
};

async function streamToBuffer(stream: unknown): Promise<Buffer> {
  if (!stream || typeof stream !== 'object') {
    throw new Error('Missing object body stream');
  }

  const asyncIterable = stream as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of asyncIterable) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof S3ServiceException) {
    return (
      error.name === 'NoSuchKey' ||
      error.name === 'NotFound' ||
      error.$metadata?.httpStatusCode === 404
    );
  }
  return false;
}

export function createS3ArtworkStore(config: S3ArtworkStoreConfig): ArtworkStore {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: config.forcePathStyle ?? false,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async putObject(key, buffer, mimeType) {
      const safeKey = assertValidArtworkKey(key);
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: safeKey,
          Body: buffer,
          ContentType: mimeType,
        })
      );
    },
    async getObject(key) {
      const safeKey = assertValidArtworkKey(key);
      try {
        const out = await client.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: safeKey,
          })
        );
        if (!out.Body) {
          return null;
        }
        const buffer = await streamToBuffer(out.Body);
        return {
          buffer,
          mimeType: (out.ContentType as AllowedArtworkMimeType | undefined) ?? null,
        };
      } catch (error) {
        if (isNotFoundError(error)) return null;
        throw error;
      }
    },
    async deleteObject(key) {
      const safeKey = assertValidArtworkKey(key);
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: config.bucket,
            Key: safeKey,
          })
        );
      } catch (error) {
        if (isNotFoundError(error)) return;
        throw error;
      }
    },
    async objectExists(key) {
      const safeKey = assertValidArtworkKey(key);
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: config.bucket,
            Key: safeKey,
          })
        );
        return true;
      } catch (error) {
        if (isNotFoundError(error)) return false;
        throw error;
      }
    },
  };
}

