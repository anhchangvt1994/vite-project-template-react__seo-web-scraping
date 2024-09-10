[< Back](../README.md)

## Deployment guide

In this guide, you will learn how to deploy and public this project into the Internet. I recommend to use the VPS, and I'll start by using `VPS Ubuntu 22.04`

The minimum hardware:
- 2 CPU / vCPU
- 4GB RAM
- 20GB SSD

## Table of contents

1. [Install benefits](#install-benefits)
2. [Clone and install the project](#clone-install)
3. [Setup the project](#setup)
4. [Start the project](#start)

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
nvm install 20
npm i -g yarn pm2
```

<h2 id="clone-install">Clone and install the project</h2>

```bash
git clone https://github.com/<your-project-path>
cd <your-project-path>
yarn
yarn build
```

<h2 id="setup">Setup the project</h2>

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
SIZE=1024

# restart
sudo systemctl restart zramswap
```

- Create `swap space` by using SSD

This solution help to ignore the `out-off memory` issue

```bash
# use 2G OR 4G of SSD to create `swap space`
# the VPS will have 2G -> 4G Virtual RAM
# (same RAM but slower)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap saw 0 0' | sudo tee -a /etc/fstab
```

- Setup `server/src/index.uws.worker.ts`

This setup will reduce the workers (this workers used to allow handle more requests at the same time). By reducing this workers, will synonymous with the server handles less requests than, but help ignore the `out-off memory` issue.

```typescript
// server/src/index.uws.worker.ts
// enable only a worker (from line 95)

const worker1 = new Worker(__filename, {
  workerData: { order: 1, port: 4040 },
})
_createWorkerListener(worker1)
// const worker2 = new Worker(__filename, {
//   workerData: { order: 2, port: 4041 },
// })
// _createWorkerListener(worker2)
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

> This setup still used for the minium hardware VPS.
> If you have higher
> > \>= 4 CPU / vCPU
> > \>= 8GB RAM
>
> you can skip this setup

<h2 id="start">Start the project</h2>

```bash
# start project using pm2 with 2 cluster processes
yarn start:pm2:worker

# view pm2 processes
pm2 list

# watch pm2 processes
pm2 monit
```
