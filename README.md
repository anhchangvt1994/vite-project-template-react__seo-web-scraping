## First and foremost

React Web Scraping for SEO project (React WSC-SEO) is a project created with the aim of researching and applying the advantages of web scraping to support SEO for React projects. It is not intended for commercial purposes and is not allowed to be used for commercialization. React WSC-SEO is considered a choice for SEO automation purposes, in addition to providing SSR capabilities for CSR-only frameworks such as ReactJS (there is a version for Vue, see [here](https://github.com/anhchangvt1994/vite-project-template-vue__seo-web-scraping)) and does not require comparison or replacement for current Frontend meta frameworks such as Next, Nuxt, Rmix, SvelteKit, etc.

## First start

In this repository I will discuss about

- What is React Web Scraping for SEO ?
- More information
- Deploy guide information for testing

This project is an advance of Vite Project React Template + React Router. You can see more information about it in [here](https://github.com/anhchangvt1994/vite-project--template-react-ts__react-router)
For more information about this project.

## Table of contents

1. [Install](#install)
2. [Introduction](#introduction)

<h2>Install</h2>

##### Expect Node 18.x or higher

Clone source with SSH url:

```bash
git clone git@github.com:anhchangvt1994/vite-project-template-react__seo-web-scraping.git
```

Install:

```bash
cd vite-project-template-react__seo-web-scraping
```

If use npm

```bash
npm install
```

If use yarn 1.x

```bash
yarn install
```

<h2>Introduction</h2>

### Table of benefit information that you must know

- [What is React Web Scraping for SEO ?](#what)
- [More information](#more)
- [Deploy guide information](#deploy)

<h3 id="what">What is React Web Scraping for SEO ?</h3>
Web Scraping for SEO project (React WSC-SEO) is a product designed for ReactJS developers who have SEO needs but do not want to use Frontend meta frameworks for personal reasons. For those developers, React WSC-SEO would be a suitable choice. React WSC-SEO helps frontend developers focus only on processing business code and not worry about anything else beyond the limits of a ReactJS framework. It eliminates the need to worry about

- How to SEO with just ReactJS usage ?
- How to optimize SEO ? (block script, block resource, large image, need some attributes to make tag valid ...)
- When run the business code ? (on server side or client side ?)

**What is optimize SEO automation ?** You can see the below example (the top frame I use website with WSC-SEO and the bottom is a website without WSC-SEO), all of the scores of website is increase when use WSC-SEO for optimize SEO automation.
![alt text](/src/assets/static/images/readme/tiki-lighthouse.jpg 'Title')

<h3 id="why">More information</h3>
As introduced above, React WSC-SEO provides ReactJS developers with an additional option for easy access and SEO optimization if needed. To provide developers with more information about the product and make a more informed decision about its use, React WSC-SEO will provide the following specific advantages and disadvantages:

**Advantages:**

- Provides SSR capabilities for CSR-only ReactJS frameworks (without ReactJS SSR create feature)
- Provides automation in optimizing for the entire Lighthouse score
- Helps developers focus entirely on business code without worrying about server code

**Disadvantages:**

- Cannot deliver complete results on free serverless platforms (such as Vercel), because free serverless platforms often have lower bandwidth, serverless timeout, and storage capacity than paid versions. Therefore, Web Scraping features (a key feature of this product) cannot run at their best capacity when deployed on production.
- **If you use yarn, when use "yarn add ..." you need to add -W flag into the command to make it works (because I used mono-repo in this project)**

```bash
yarn add -W --save lodash
```

<h3 id="deploy">Deploy guide information for testing</h3>

In reality, you can use the default Chrome Lighthouse extension of the Chromium browser to test the Google page speed of your product, but there are cases where your browser has extensions that directly affect the website loading process, causing Lighthouse to provide inaccurate results. In those cases, you can use the following solutions:

- Open an incognito window to disable extensions (usually extensions will not run in incognito windows)
- Manually turn off extensions through the browser's extension management
- Deploy the product to a hosting, VPS or free Node.js serverless that you know and use Google test page speed to measure. (As mentioned above, free services often have a minimum limit on capacity, so they may not provide expected results compared to testing in local or paid environments).

For solution 3 (deploying the product), I will guide you on how to deploy the product to Vercel.

Inside the project, there is already a definition file for the deployment process for Vercel. I will explain the meaning of the environment variables in the definition file as follows:

- **MAX_WORKERS** : the maximum number of workers allowed to be created in a process, usually 4 is a suitable number of workers for paid services, and 7 workers are usually used for local environments. More workers will help the application process more processes in parallel, thereby improving performance. However, if the hardware or service cannot meet that number, it is best to consider choosing 2 or 4 workers to ensure that the process is not adversely affected by too many workers compared to the hardware's capability, causing process congestion.
- **DURATION_TIMEOUT** : the total time allowed for a request to be maintained and processed. After this time, all processing will be released to avoid memory leaks. For Vercel's free version, this timeout will be 10s, after 10s, the serverless function will be closed and all processes will be released
- **POWER_LEVEL** : the utility level that the service can use, including 3 levels, the lower the level, the more limited utilities such as optimize, waiting for full content, etc. This is to ensure output results for free services used for testing with limited hardware.
- **DISABLE_COMPRESS_HTML** : don't need compress html after get finish
- **DISABLE_DEEP_OPTIMIZE** : don't need deep optimize for SEO (you will do that in your business code that don't need the WSC-SEO support)
- **SERVER_LESS** : declaring that the program is running on a serverless and needs to process processes according to the characteristics of a serverless function.
- **BANDWIDTH_LEVEL** : the service's bandwidth level used to run the product, with 2 levels. Level 1 corresponds to low bandwidth and requires time adjustment so that Web Scraping does not run out of time and cause missing content. Level 2 is good bandwidth level that can meet smooth running of the product.
- **NOT_FOUND_PAGE_ID** : Normally, CRS + SPA websites will always return a status code of 200, even for the 404 page. To help the system identify a 404 page, you need to place an ID in the 404 page. The system will scan the content of the website and determine if it is a 404 page or not. By default, the system will use the ID "404-page" to identify it.

Some environment variables are used for definition during the declaration process before deployment, such as:

- **BASE_URL** (optional but necessary when using on Vercel): Because Vercel provides dynamic domains during request processing, we need to define which domain is the main domain of the project for Vercel to understand.
  when you deploy vercel, vercel will ask you name for your project. After that, vercel will use that name and create an domain like this format: https://project-name.vercel.app. All you need to do is set BASE_URL env value like this domain.
- **ENV** If you want to test the project, please define ENV as "staging". Conversely, ENV will automatically understand that the environment is "production".

![alt text](/src/assets/static/images/readme/deploy-vercel.jpg 'Title')
