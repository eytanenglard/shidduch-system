declare module 'next' {
    export interface RequestContext {
      params: Record<string, string | string[]>;
    }
  }
  
  export {};