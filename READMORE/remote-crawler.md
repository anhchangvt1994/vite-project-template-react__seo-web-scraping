[< Back](../README.md)

## What is remote crawler ?

The crawler (web-scraping) is one of the main service of this project. It provides ability to SSR instead of CSR default. Allow the CSR project can be SEO.

The remote crawler (remote web-scraping) is crawler service separated from the main project. It provides a flexible ability to improve crawler's performance if you have a free host (power limit) or have a pricing host with low of bandwidth. You can deploy the [remote crawler](https://github.com/anhchangvt1994/web-scraping-seo-service) in another host with better bandwidth or use [ngrok](https://ngrok.com/) alternative in your machine for simplest way. After that you can setup crawler and crawler secret key (optional) for that remote crawler. And finish! You have a remote crawler with powerful of performance.

### Setup remote crawler step-by-step
1. Clone this [remote crawler repository](https://github.com/anhchangvt1994/web-scraping-seo-service).
2. Open `server.config.ts` and setup `crawlerSecretKey` if needed. You can setup it by using environment adding feature provided from hosting or cloud and then add environment key `CRAWLER_SECRET_KEY`.

**If you have a good bandwidth server**
1. Deploy `remote crawler project` into that server.
2. Run build and run start.
3. Copy `remote crawler url` and setup it into value of `process.env.CRAWLER` of main project.

```environment
// .env.production
CRAWLER=<remote-crawler-url>
CRAWLER_SECRET_KEY=<remote-crawler-url> // optional
```

**If you use [ngrok](https://ngrok.com/)**
1. Run build and run start
2. Run ngrok script right way in docs of `ngrok`.
> Notice that `ngrok` will generate a random domain name at each start time, if you need a static domain name, you can research this [solution](https://dashboard.ngrok.com/cloud-edge/domains) in `ngrok` docs, don't forget register an account.
3. Copy `remote crawler url` of ngrok and paste it into value of `process.env.CRAWLER` of main project.

**TIP**

In case, we need to control the resources to deliver to the Search Engine and the performances of crawler, we can use `remote crawler` combines with `ngrok` or any [tunneling](https://github.com/anderspitman/awesome-tunneling?tab=readme-ov-file) that you know. It will help you :
- Easy to optimize the crawler performance in your device.
- Easy to control the resources be delivered to Search Engine in your device.

**TIP step-by-step**

1. Config the remote crawler for your project

```typescript
// server.config.ts

const ServerConfig = defineServerConfig({
  ...,
  crawler: 'http(s)://<remote-crawler-url>', //
  crawlerSecretKey: '***', //
})
```
