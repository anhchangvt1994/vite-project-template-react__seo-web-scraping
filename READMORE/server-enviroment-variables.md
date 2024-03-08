[< Back](../README.md)

## Server environment variable

> <br />You can and should setup these variables in .\<environment\> files such as
> - `server/.env` - For all environments
> - `server/.env.staging` - For only staging environment
> - `server/.env.uat` - For only uat environments
> - `server/.env.production` - For only production environments
> <br />

**Most used**

- **CRAWLER** `(default: empty)`
The remote crawler url, if this value non-empty, it will be used to replace the `ServerConfig.crawler` value.
- **CRAWLER_SECRET_KEY** `(default: empty)`
The way to protect the remote crawler. Just setup a secret key for the client project (project use remote crawler) and the same for the remote crawler project.
- **IS_REMOTE_CRAWLER** `(default: false)`
If `true` this project will be a remote crawler project.

**Commonly used**

- **NOT_FOUND_PAGE_ID** `( default: "404-page" )`
Normally, CRS + SPA websites will always return a status code of 200, even for the 404 page. To help the system identify a 404 page, you need to place an ID in the 404 page. The system will scan the content of the website and determine if it is a 404 page or not. By default, the system will use the ID "404-page" to identify it.
- **MAX_WORKERS** `( default: 7 )`
The maximum number of workers allowed to be created in a process, usually 4 is a suitable number of workers for paid services, and 7 workers are usually used for local environments. More workers will help the application process more processes in parallel, thereby improving performance. However, if the hardware or service cannot meet that number, it is best to consider choosing 2 or 4 workers to ensure that the process is not adversely affected by too many workers compared to the hardware's capability, causing process congestion.
- **POWER_LEVEL** `( default: 3 )`
The utility level that the service can use, including 3 levels, the lower the level, the more limited utilities such as optimize, waiting for full content, etc. This is to ensure output results for free services used for testing with limited hardware.
- **BANDWIDTH_LEVEL** `( default: 2 )`
The service's bandwidth level used to run the product, with 2 levels. Level 1 corresponds to low bandwidth and requires time adjustment so that Web Scraping does not run out of time and cause missing content. Level 2 is good bandwidth level that can meet smooth running of the product.
