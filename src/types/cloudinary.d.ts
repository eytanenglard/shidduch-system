interface CloudinaryResult {
  secure_url: string;
  public_id: string;
}

interface CloudinaryDestroyResult {
  result: 'ok' | 'not found';
  error?: {
    message: string;
    http_code: number;
  };
}

// Define the type for the writable stream returned by upload_stream
interface CloudinaryUploadStream extends NodeJS.WritableStream {
  // Add any specific methods or properties of the upload stream if needed
}

declare module 'cloudinary' {
  export const v2: {
    config: (config: {
      cloud_name: string;
      api_key: string;
      api_secret: string;
    }) => void;
    uploader: {
      upload_stream: (
        options: {
          folder?: string;
          resource_type?: string;
        },
        callback: (error: Error | null, result: CloudinaryResult | null) => void
      ) => CloudinaryUploadStream;
      destroy: (publicId: string) => Promise<CloudinaryDestroyResult>;
    };
  };
}