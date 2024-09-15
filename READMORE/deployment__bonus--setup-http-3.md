[< Back](./deployment.md)

HTTP / 3 is the latest version of the Hypertext Transfer Protocol, designed to improve web performance and security.

Here are its key benefits
- Faster Loading Times: Utilizes QUIC (Quick UDP Internet Connections) for reduced latency.
- Improved Security: Built-in encryption for better data protection.
- Connection Resilience: Maintains connections even when switching networks (e.g., from Wi-Fi to mobile).
- Multiplexing: Allows multiple streams of data without blocking, enhancing performance.
- Better Handling of Packet Loss: More efficient recovery from lost packets, improving overall user experience.

## Table of contents

1. [Config domain DNS](#config-domain-dns)
2. [Install and config nginx](#install-nginx)
3. [Install Certbot](#install-certbot)
4. [Setup HTTP / 3](#setup-http-3)
5. [Notes and Error Handling](#note-and-error-handling)

<h2 id="config-domain-dns">Config domain DNS</h2>

1. Go to DNS dashboard of your domain management
2. Add / Edit the field type A with below values

- Name/Host: @ or empty
- Type: A
- Value/Points to: \<your-vps-public-ip>
- TTL: 3600 or default value

<h2 id="install-nginx">Install and config nginx</h2>

```bash
# install nginx
sudo apt update
sudo apt install nginx
```

```bash
# create configuration file for domain
sudo vim /etc/nginx/sites-available/example.com
```

```
# configuration file content
server {
  listen 80;
  server_name example.com;

  location / {
    # connect port 80 to 8080
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

```bash
# start the configuration
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/
```

```bash
# check and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

<h2 id="install-certbot">Install Certbot</h2>

Certbot is a free, open-source tool developed by the Electronic Frontier Foundation (EFF) for automating the process of obtaining and renewing SSL/TLS certificates from Let's Encrypt.

- Reasons to Use Certbot for Configuring HTTP/2 and HTTP/3:
- Security: HTTP/2 and HTTP/3 require secure connections (HTTPS), which Certbot helps set up.
- Automation: It automates the issuance and renewal of certificates, reducing manual errors.
- New Features: These protocols offer performance improvements (e.g., header compression, multiplexing) that require HTTPS.
- Community Support: Widely used with extensive documentation and community support available.

Using Certbot ensures your website is secure and can leverage the benefits of HTTP/2 and HTTP/3.

```bash
# install certbot
sudo apt install certbot python3-certbot-nginx

# get SSL certificate
sudo certbot --nginx -d example.com
```

<h2 id="setup-http-3">Setup HTTP / 3</h2>

```bash
sudo vim /etc/nginx/sites-available/example.com
```

```
server {
  server_name example.com;
  location / {
    proxy_pass http://localhost:8080; proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
    proxy_read_timeout 300;
    send_timeout 300;
  }

  listen 443 quic reuseport;
  listen [::]:443 ssl;
  listen [::]:443 quic reuseport;
  listen 443 ssl;

  #Enable http/2
  http2 on;

  # Enable http/3
  http3 on;
  quic_retry on;

  # Add http/3 headers.
  add_header Alt-Svc 'h3=": $server_port"; ma=86400'; add_header x-quic 'h3';

  # managed by Certbot
  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;

  # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf;

  # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  # managed by Certbot
  # Enable QUIC and HTTP/3
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Enable QUIC and HTTP/3.
  ssl_protocols TLSv1.3 TLSv1.2;
  ssl_prefer_server_ciphers on;
  ssl_stapling on;
  ssl_early_data on;

  #EnabLes 0-RTT.
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
}

server {
  if ($host = example.com) {
    return 301 https://$host$request_uri;
  } # managed by Certbot
  listen 80;
  server_name example.com;
  return 404; # managed by Certbot
}
```

```bash
# check and restart nginx
sudo nginx -t
sudo systemctl restart nginx
```

<h2 id="note-and-error-handling">Notes and Error Handling</h2>

`Error: File or directory not found`

Check and create the sites-enabled directory if it does not exist

```bash
sudo mkdir /etc/nginx/sites-enabled
```

Create a link from sites-available to sites-enabled

```bash
sudo ln -s /etc/nginx/sites-available/anhchangvt1994.site /etc/nginx/sites-enabled/
```
---

`Spelling error in the configuration`

Ensure to use `ssl_prefer_server_ciphers` instead of `ssl_prefer_server_cliphers`.

---

`SSL value duplication error`

Remove or comment out duplicate lines in your configuration file if they already exist in `/etc/letsencrypt/options-ssl-nginx.conf`.
