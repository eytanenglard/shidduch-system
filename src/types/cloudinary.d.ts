// src/types/cloudinary.d.ts - גרסה מתוקנת עם כל האפשרויות

interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  bytes?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  width?: number;
  height?: number;
}

interface CloudinaryDestroyResult {
  result: 'ok' | 'not found';
  error?: {
    message: string;
    http_code: number;
  };
}

interface CloudinaryUploadStream extends NodeJS.WritableStream {
  end(buffer: Buffer): void;
  write(buffer: Buffer): boolean;
}

interface CloudinaryUploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  public_id?: string;
  overwrite?: boolean;
  timeout?: number;
  transformation?: Record<string, unknown>;
  eager?: Array<Record<string, unknown>>;
  format?: string;
  quality?: string | number;
  fetch_format?: string;
  flags?: string;
  use_filename?: boolean;
  unique_filename?: boolean;
  invalidate?: boolean;
  discard_original_filename?: boolean;
  notification_url?: string;
  eager_notification_url?: string;
  proxy?: string;
  return_delete_token?: boolean;
  allowed_formats?: string[];
  async?: boolean;
  backup?: boolean;
  eval?: string;
  headers?: string;
  metadata?: boolean | object;
  moderation?: string;
  ocr?: string;
  raw_convert?: string;
  categorization?: string;
  detection?: string;
  similarity_search?: boolean;
  background_removal?: string;
  upload_preset?: string;
  tags?: string | string[];
  context?: object;
  face_coordinates?: string;
  custom_coordinates?: string;
  auto_tagging?: number;
  responsive_breakpoints?: object;
}

interface CloudinaryConfig {
  cloud_name: string;
  api_key: string;
  api_secret: string;
  secure?: boolean;
  timeout?: number;
}

declare module 'cloudinary' {
  export const v2: {
    config: (config: CloudinaryConfig) => void;
    uploader: {
      upload_stream: (
        options: CloudinaryUploadOptions,
        callback: (error: Error | null, result: CloudinaryResult | null) => void
      ) => CloudinaryUploadStream;
      upload: (
        file: string | Buffer,
        options?: CloudinaryUploadOptions
      ) => Promise<CloudinaryResult>;
      destroy: (
        publicId: string,
        options?: {
          resource_type?: 'image' | 'video' | 'raw';
          type?: string;
          invalidate?: boolean;
        }
      ) => Promise<CloudinaryDestroyResult>;
      explicit: (
        publicId: string,
        options?: CloudinaryUploadOptions
      ) => Promise<CloudinaryResult>;
      rename: (
        fromPublicId: string,
        toPublicId: string,
        options?: CloudinaryUploadOptions
      ) => Promise<CloudinaryResult>;
    };
    api: {
      ping: () => Promise<{ status: string }>;
      usage: () => Promise<{
        plan: string;
        usage: number;
        limit: number;
        used_percent: number;
      }>;
      resource: (
        publicId: string,
        options?: {
          resource_type?: string;
          type?: string;
        }
      ) => Promise<CloudinaryResult>;
      resources: (
        options?: {
          type?: string;
          resource_type?: string;
          prefix?: string;
          max_results?: number;
          next_cursor?: string;
        }
      ) => Promise<{
        resources: CloudinaryResult[];
        next_cursor?: string;
      }>;
      delete_resources: (
        publicIds: string | string[],
        options?: {
          resource_type?: string;
          type?: string;
        }
      ) => Promise<{
        deleted: { [key: string]: string };
        deleted_counts?: {
          [key: string]: number;
        };
        partial?: boolean;
      }>;
    };
    utils: {
      cloudinary_url: (
        publicId: string,
        options?: {
          transformation?: Record<string, unknown>;
          resource_type?: string;
          type?: string;
          format?: string;
          version?: string | number;
          sign_url?: boolean;
          secure?: boolean;
          ssl_detected?: boolean;
          secure_distribution?: string;
          private_cdn?: boolean;
          cdn_subdomain?: boolean;
          secure_cdn_subdomain?: boolean;
          cname?: string;
          shorten?: boolean;
          auth_token?: Record<string, unknown>;
        }
      ) => string;
      archive_url: (options?: Record<string, unknown>) => string;
      zip_download_url: (options?: Record<string, unknown>) => string;
    };
  };
}