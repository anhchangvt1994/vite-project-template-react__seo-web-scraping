[< Back](../README.md)

## How to setup link SEO tags ?

I already created an util for this necessary, you just type **setSeoTag** for all setup or **setLink[X]** for each meta seo tag

```javascript
// NOTE - Setup for all
setSeoTag({
  title: 'Home page',
  canonical: window.location.href,
  alternate: window.location.href,
})

// NOTE - Setup for each
setLinkCanonicalTag(window.location.href)
setLinkAlternateTag(window.location.href)
```
