[< Back](../README.md)

## How to setup meta SEO tags ?

I already created an util for this necessary, you just type **setSeoTag** for all setup or **setMeta[X]** for each meta seo tag

```typescript
// NOTE - Setup for all
setSeoTag({
  title: 'Home page',
  keywords: 'Home page, react 3, wsc-seo',
  description: 'Home page React 3.x and WSC-SEO',
  robots: 'index, follow',
})

// NOTE - Setup for each
setMetaViewportTag('width=device-width, initial-scale=1')
setMetaKeywordsTag('Home page')
setMetaRobotsTag('index, follow')
setMetaDescriptionTag('Home page React 3.x and WSC-SEO')
```
