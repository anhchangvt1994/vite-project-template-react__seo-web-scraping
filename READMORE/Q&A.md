[< Back](../README.md)

## Q&A

#### [Maximum serverless function size of 50MB](#max-size-limit)

First, this project still not works well on serverless environment at now. But if you need to resolve the `Maximum serverless function size of 50MB` problem, just do step-by-step at below.

1. set `PUPPETEER_SKIP_DOWNLOAD=true` (set it by using `export PUPPETEER_SKIP_DOWNLOAD=true` or environment variable management of your cloud).
2. set `USE_CHROME_AWS_LAMBDA=true` (set it by using `export USE_CHROME_AWS_LAMBDA=true` or environment variable management of your cloud).
3. remove `node_modules` and run install again.
