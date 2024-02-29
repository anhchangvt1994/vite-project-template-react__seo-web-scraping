[< Back](../README.md)

## How to setup redirect ?

I already prepared a configuration file to support for redirect case, this configuration file placed in **./server/src/app/redirect.config.ts**

In this configuration file we have 2 types of setup :

1. Static configuration

Use it when you just need to redirect from original path to new path and this path just is a string and no need to detect by using regex.

```typescript
export interface IRedirectInfoItem {
  path: string
  targetPath: string
  statusCode: number
}

// NOTE - Declare redirects
export const REDIRECT_INFO: IRedirectInfoItem[] = [
  {
    path: '/test',
    targetPath: '/',
    statusCode: 302,
  },
]
```

2. Dynamic configuration

Use it when you need handle more logics before redirect.

```typescript
export const REDIRECT_INJECTION = (
  redirectResult,
  req,
  res
): IRedirectResult => {
  const enableLocale =
  ServerConfig.locale.enable &&
  Boolean(
    !ServerConfig.locale.routes ||
    !ServerConfig.locale.routes[redirectResult.originPath] ||
    ServerConfig.locale.routes[redirectResult.originPath].enable
  )

  // NOTE - Handle redirect for locale validation
  if (enableLocale) {
    const localeCodeValidationResult = ValidateLocaleCode(redirectResult, res)

    if (localeCodeValidationResult.status !== 200) {
    redirectResult.status =
    redirectResult.status === 301
      ? redirectResult.status
      : localeCodeValidationResult.status
    redirectResult.path = localeCodeValidationResult.path
    }
  }

  return redirectResult
} // REDIRECT_INJECTION
```
