import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { randomUUID } from 'crypto';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { Readable } from 'stream';
import { extname } from 'path';

@Injectable()
export class FilesService {
  private _s3: S3Client | null = null;

  constructor(private config: ConfigService) {}

  private get s3(): S3Client {
    if (!this._s3) {
      this._s3 = new S3Client({
        region: this.config.getOrThrow<string>('DO_SPACES_REGION'),
        endpoint: this.config.getOrThrow<string>('DO_SPACES_ENDPOINT'),
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('DO_SPACES_KEY'),
          secretAccessKey: this.config.getOrThrow<string>('DO_SPACES_SECRET'),
        },
        requestChecksumCalculation: 'WHEN_REQUIRED',
        forcePathStyle: true,
      });
    }
    return this._s3;
  }

  private async normalizeFileBody(file: Express.Multer.File): Promise<Buffer | Readable> {
    const maybeBuffer = file.buffer as unknown;

    if (Buffer.isBuffer(maybeBuffer)) {
      return maybeBuffer;
    }

    if (typeof maybeBuffer === 'string') {
      return Buffer.from(maybeBuffer);
    }

    if (maybeBuffer instanceof ArrayBuffer) {
      return Buffer.from(maybeBuffer);
    }

    if (ArrayBuffer.isView(maybeBuffer)) {
      return Buffer.from((maybeBuffer as ArrayBufferView).buffer as ArrayBuffer);
    }

    if (maybeBuffer && typeof maybeBuffer === 'object') {
      const anyBuffer = maybeBuffer as any;

      if (typeof anyBuffer.arrayBuffer === 'function') {
        return Buffer.from(await anyBuffer.arrayBuffer());
      }

      if ('data' in anyBuffer) {
        return Buffer.from(anyBuffer.data as any);
      }

      if ('buffer' in anyBuffer) {
        return Buffer.from(anyBuffer.buffer as any);
      }

      if (typeof anyBuffer[Symbol.asyncIterator] === 'function' ||
          typeof anyBuffer[Symbol.iterator] === 'function') {
        return Readable.from(anyBuffer as any);
      }
    }

    if (file.stream && typeof (file.stream as any).pipe === 'function') {
      return file.stream as Readable;
    }

    try {
      return Buffer.from(maybeBuffer as any);
    } catch (_) {
      throw new Error(
        'Unsupported file body format. Expected Buffer, ArrayBuffer, typed array, Readable stream, or Blob.',
      );
    }
  }

  async uploadMenuImage(file: Express.Multer.File): Promise<string> {
    const bucket = this.config.getOrThrow<string>('DO_SPACES_BUCKET');
    const ext = extname(file.originalname).toLowerCase();
    const key = `menu/${randomUUID()}${ext}`;
    const tempPath = typeof file.path === 'string' && file.path ? file.path : null;

    const body = tempPath ? createReadStream(tempPath) : await this.normalizeFileBody(file);

    try {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: file.mimetype,
          ACL: 'public-read',
        },
      });

      await upload.done();
      return key;
    } finally {
      if (tempPath) {
        await unlink(tempPath).catch(() => null);
      }
    }
  }

  async deleteImage(key: string): Promise<void> {
    const bucket = this.config.getOrThrow<string>('DO_SPACES_BUCKET');
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  getImageUrl(key: string): string {
    const bucket = this.config.get<string>('DO_SPACES_BUCKET')?.trim();
    const cdnUrl = (this.config.get<string>('MEDIA_CDN_URL') ?? '').replace(/\/$/, '');
   
    return `${cdnUrl}/${bucket}/${key}`;
   
  }
}
