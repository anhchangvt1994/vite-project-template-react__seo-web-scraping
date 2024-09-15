[< Back](../README.md)

## Deployment guide

In this guide, you will learn how to deploy and public this project into the Internet. I recommend to use the VPS, and I'll start by using `VPS Ubuntu 22.04`

The minimum hardware
- 1 CPU / vCPU
- 2GB RAM
- 20GB SSD

The nice hardware
- \>= 4 CPU / vCPU
- \>= 6GB RAM
- \>= 50GB NVMe SSD / SSD

## Table of contents

1. [Install benefits](#install-benefits)
2. [Clone and install the project](#clone-install)
3. [Setup the system](#setup-system)
3. [Setup the project](#setup-project)
4. [Start the project](#start)
6. [Issues](#issue)
7. [Bonus](#bonus)

<h2 id="install-benefits">Install benefits</h2>

```bash
sudo apt update
```

##### Install benefit packages
```bash
sudo apt install -y curl
sudo apt install -y lsof
sudo apt install -y psmisc

sudo apt install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libnss3-dev libxss-dev
sudo apt install -y git
```

##### Install `nvm` and reboot
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

reboot
```

##### Install `nodejs` environment and `yarn`
```bash
# nodejs version >= 18.18.x
nvm install 20
npm i -g yarn pm2
```

<h2 id="clone-install">Clone and install the project</h2>

```bash
git clone https://github.com/<your-project-path>
cd <your-project-path>

# use it, if your VPS limit sizes of package installed
# more about issue
# https://github.com/alixaxel/chrome-aws-lambda/issues/200
export PUPPETEER_SKIP_DOWNLOAD=true
export USE_CHROME_AWS_LAMBDA=true

# install project's packages and build
yarn
yarn build
```

<h2 id="setup-system">Setup the system</h2>

##### Setup for the minimum hardware

- Install and config ZRAM packages

This package help to improve the performance of large tasks in project, such as crawl, optimize and caching.

```bash
# instsall
sudo apt-get install zram-tools

# enable and start
sudo systemctl enable zramswap
sudo systemctl start zramswap

# config
sudo vim /etc/default/zramswap

ALGO=zstd

# If you have 2GB RAM, just set it 512.
# More about calculate:
# 2GB RAM + 512MB ZRAM = 2.5GB RAM - (a few ms speed optimize ALGO)
# 4GB RAM + 1024 ZRAM = 5GB RAM - (a few ms speed optimize ALGO)
# 6GB RAM + 2048 ZRAM = 8GB RAM - (a few ms speed optimize ALGO)
# conclusion : ZRAM = share space of RAM x 2 - (a few ms speed optimize ALGO)
SIZE=1024

# restart
sudo systemctl restart zramswap

# check if ZRAM is on
zramctl
```

- Create `swap space` by using SSD

This solution help to ignore the `out-off memory` issue

```bash
# use minimum 8GB of SSD to create `swap space`
# the VPS will have minimum 8GB Virtual RAM
# same RAM but slower, help to ignore out-off memory issue
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap saw 0 0' | sudo tee -a /etc/fstab

# If you have nice hardware, you can use maximum useful of project.
# In that case, we need set set swap space from 8G to 12G -> 16G
# If you already create a swap space and need change it, do as below.
sudo swapoff -v /swapfile
sudo rm /swapfile
sudo nano /etc/fstab
sudo fallocate -l 12G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
<h2 id="setup-project">Setup the project</h2>

- Setup `server/src/index.uws.worker.ts`

This setup will reduce the workers (this workers used to allow handle more requests at the same time). By reducing this workers, will synonymous with the server handles less requests than, but help ignore the `out-off memory` issue.

```typescript
// server/src/index.uws.worker.ts
// enable 2 workers (from line 95)
// This setup just used for the minium hardware VPS
// - If you have 2 CPU / vCPU, 4GB RAM -> enable 3 workers
// - If you have 3 CPU / vCPU, 6GB RAM -> enable 4 workers
// - If you have 4 CPU / vCPU, 6GB RAM or more -> enable 5 workers

const worker1 = new Worker(__filename, {
  workerData: { order: 1, port: 4040 },
})
_createWorkerListener(worker1)
const worker2 = new Worker(__filename, {
  workerData: { order: 2, port: 4041 },
})
_createWorkerListener(worker2)
// const worker3 = new Worker(__filename, {
//   workerData: { order: 3, port: 4042 },
// })
// _createWorkerListener(worker3)
// const worker4 = new Worker(__filename, {
//   workerData: { order: 4, port: 4043 },
// })
// _createWorkerListener(worker4)
// const worker5 = new Worker(__filename, {
//   workerData: { order: 5, port: 4044 },
// })
```

- Setup `server.config.ts` (If you have nice hardware, please skip it)

```typescript
const ServerConfig = defineServerConfig({
  crawl: {
    enable: true,
    ...,

    // Setup time and renewTime of `cache` option as below
    cache: {
      enable: true,
      time: 'infinite', // never remove
      renewTime: 3600, // renew after 1 hour
      ...
    },
  },
  ...,
})

export default ServerConfig
```

- Setup `ISRGenerator.next.ts` (If you have nice hardware, please skip it)

```typescript
// change litmiRequestToCrawl from 3 to 2 (line 20)
const limitRequestToCrawl = 2
```

<h2 id="start">Start the project</h2>

```bash
# start project using pm2 with 2 cluster processes
yarn start:pm2:worker

# view pm2 processes
pm2 list

# watch pm2 processes
pm2 monit

# follow the process
# install htop if haven't already
sudo apt install htop

# use htop like this to follow process of project
htop -p $(pgrep -d',' -f web-scraping)
```

<h2 id="issues">Issues</h2>

`Puppeteer can not be launched`

IF you reboot or your system auto start cause any reasons. Maybe you must to go to  project, and do some steps to ensure the project work normally.

```bash
cd <your-project-path>

# setup 2 this global environment variables again
export PUPPETEER_SKIP_DOWNLOAD=true
export USE_CHROME_AWS_LAMBDA=true

# remove node_modules and install again
rm -rf node_modules
yarn

# check z-ram, swap-space
swapon --show

# restart the nginx
sudo systemctl restart nginx

# start the project
yarn start:pm2:worker
```

---

`Can not restart nginx cause port 80 is busy`

After your system restarted, maybe the `nginx` will be crashed. In that case, you have to restart the `nginx`, but maybe you can not restart the `nginx` cause port 80 is busy. To resolve the issue, follow the below solution.

```bash
# check what service which using port 80
sudo lsof -i :80

# stop that service
sudo systemctl stop <service-name>

# force to destroy port 80 if can not find the service which using it
sudo fuser -k 80/tcp

# restart the nginx
sudo systemctl restart nginx
```

<h2 id="bonus">Bonus</h2>

## Table of contents
1. [Setup http / 3](./deployment__bonus--setup-http-3.md)
