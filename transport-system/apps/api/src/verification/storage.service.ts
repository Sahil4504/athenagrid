import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Document storage for verification files.
 *  - Production / MinIO: set STORAGE_DRIVER=s3. Clients upload directly to S3 via a
 *    short-lived signed PUT URL, so files never transit the API.
 *  - Local dev (default): STORAGE_DRIVER unset → a no-op "local" driver returns a
 *    placeholder URL so the verification *workflow* runs end-to-end with no S3/MinIO.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: 's3' | 'local';
  private readonly bucket: string;
  private s3?: S3Client;

  constructor(config: ConfigService) {
    this.driver = config.get('STORAGE_DRIVER') === 's3' ? 's3' : 'local';
    this.bucket = config.get<string>('S3_BUCKET', 'athena-verification');
    if (this.driver === 's3') {
      this.s3 = new S3Client({
        region: config.get('S3_REGION', 'us-east-1'),
        endpoint: config.get('S3_ENDPOINT'),
        forcePathStyle: config.get('S3_FORCE_PATH_STYLE') === 'true',
        credentials: {
          accessKeyId: config.get('S3_ACCESS_KEY', 'minioadmin'),
          secretAccessKey: config.get('S3_SECRET_KEY', 'minioadmin'),
        },
      });
    } else {
      this.logger.log('StorageService: local driver (no S3) — verification uploads are stubbed');
    }
  }

  async presignUpload(key: string, contentType: string): Promise<string> {
    if (this.driver === 'local' || !this.s3) return `local://upload/${key}`;
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
  }

  async presignDownload(key: string): Promise<string> {
    if (this.driver === 'local' || !this.s3) return `local://file/${key}`;
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: 300,
    });
  }
}
