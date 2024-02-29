[< Back](../README.md)

## How to config server ?

You can config some behavior for server to match with your necessary, to do it, just open the <b>server/server.config.ts</b> file and config into it.

```typescript
import { defineServerConfig } from './utils/ServerConfigHandler'

const ServerConfig = defineServerConfig({
  locale: {
    enable: true, // enable use /:locale dispatcher param (default false)
    defaultLang: 'en', // default language for website
    defaultCountry: 'us', // default country for website (set it empty if you just use language)
    // hideDefaultLocale: false // hide the default locale or show it such as other locales (default false)
  },
})

export default ServerConfig
```
