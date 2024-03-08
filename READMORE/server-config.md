[< Back](../README.md)

## How to config server ?

You can config some behavior for server to match with your necessary, to do it, just open the <b>server/server.config.ts</b> file and config into it.

```typescript
import { defineServerConfig } from './utils/ServerConfigHandler'

const ServerConfig = defineServerConfig({
  /* optional - default enable : false */
  locale: {
    /* required */
    enable: true, // enable use /:locale dispatcher param
    /* optional */
    defaultLang: 'en', // default language for website
    /* optional */
    defaultCountry: 'us', // default country for website (set it empty if you just use language)
    /* optional */
    routes: {
      '/login': {
        /* required */
        enable: false // disable use /:locale dispatcher param
      }
    }
  },

  /* optional - default enable : true */
  crawl: {
    /* required */
    enable: true, // enable to crawl
    /* optional */
    optimize: true, // enable to optimize HTML content
    /* optional */
    compress: true, // enable to compress HTML content
    /* optional */
    cache: {
      /* required */
      enable: true, // enable to cache after crawl success
      /* optional */
      time: 4 * 3600, // cache will be cleared after 4 hours
      /* optional */
      renewTime: 3 * 60, // cache need to be renewed if current time - update time > 3 minutes
    },
    /* optional */
    routes: {
      '/list': {
        /* required */
        enable: true, // enable to cache after crawl success
        /* optional */
        time: 4 * 3600, // cache will be cleared after 4 hours
      },
      ...
    },
  },

  /* optional */
  isRemoteCrawler: false, // setup this project is a remote crawler (if true, crawler, and crawlerSecretKey will be ignored)
  /* optional */
  crawler: 'http://localhost:8084', // setup remote crawler
  /* optional */
  crawlerSecretKey: '***' // setup remote crawler secret key to access
})

export default ServerConfig
```
