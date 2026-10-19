declare module "google-news-url-decoder" {
  export class GoogleDecoder {
    constructor(proxy?: any);
    decode(sourceUrl: string): Promise<{
      status: boolean;
      decoded_url?: string;
      message?: string;
    }>;
    decodeBatch(sourceUrls: string[]): Promise<
      Array<{
        status: boolean;
        source_url: string;
        decoded_url?: string;
        message?: string;
      }>
    >;
  }
}
