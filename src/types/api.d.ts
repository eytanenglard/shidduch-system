declare global {
    type RouteHandlerContext<T = Record<string, string>> = {
      params: T;
    };
  }
  
  export {};