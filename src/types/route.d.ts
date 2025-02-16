declare module 'next' {
    interface RouteSegmentConfig {
      dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static'
      revalidate?: false | 0 | number
      fetchCache?: 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store'
      runtime?: 'nodejs' | 'edge'
      preferredRegion?: 'auto' | 'global' | 'home' | string | string[]
    }
  }