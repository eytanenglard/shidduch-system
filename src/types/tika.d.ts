// src/types/tika.d.ts

declare module 'tika' {
  /**
   * Extracts text content from a file buffer or path.
   * @param filePath The path to the file or a Buffer containing the file data.
   * @param callback A function called with an error or the extracted text.
   */
  export function text(
    filePath: string | Buffer,
    callback: (err: any, text: string) => void
  ): void;
}