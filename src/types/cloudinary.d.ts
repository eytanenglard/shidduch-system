interface CloudinaryResult {
    secure_url: string;
    public_id: string;
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
        ) => any;
        destroy: (publicId: string) => Promise<any>;
      };
    };
  }