[< Back](../README.md)

## What is LocaleInfo variable ?

<p><b>LocaleInfo</b> is a variable contains some information about the locale. You can use it for more cases need to check "Where user's request from ?", "What language in user's country or user's client use ?"</p>
<p>The <b>/:locale</b> dispatcher param is the practice case to use LocaleInfo and I already integrate that case in this project. Enable it in <b>server/server.config.ts</b> is all you need to do to use it feature.</p>

```typescript
export interface ILocaleInfo {
  lang: string // user's language (base on location)
  country: string // user's country (base on location)
  clientLang: string // browser's language (base on user's browser in use)
  clientCountry: string // browser's country (base on user's browser in use)
  defaultLang: string // default language of website (you define it in server.config.ts, it will be client language if empty)
  defaultCountry: string // default country of website (you define it in server.config.ts, it will be client country if empty)
  langSelected: string // language selected by user (it will be default language if empty)
  countrySelected: string // country selected by user
  hideDefaultLocale: boolean // If your default locale is /en-us and you need to hide it -> use it (default true)
  range: [number, number]
  region: string
  eu: string
  timezone: string
  city: string
  ll: [number, number]
  metro: number
  area: number
}
```

```typescript
if(LocaleInfo.lang === '...') {
  // do something if "language" condition is correct
}

if(LocaleInfo.country === '...') {
  // do something if "country" condition is correct
}
```

**TIP:**
Use `getLocale` method if you need get locale code **[lang]-[country]**

```typescript
const localeCode = getLocale(LocaleInfo.lang, LocaleInfo.country)

if(localeCode === '...') {
  // do something if "localeCode" condition is correct
}
```

**NOTE:**

Beside the `LocaleInfo` used such as a normal variable to get more information about locale, this project also provide for you a hook called `useLocale` which help you get and watch the information about `lang` (language) and `country` that you using.

```typescript
// NOTE - Now you can listen when the locale changed
const { localeState } = useLocaleInfo()
```
