# nginx-ip-whitelister

This is a server app that serves as a companion for an [Nginx](https://nginx.org/en/) install configured as a reverse proxy and compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).

It validates Nginx requests against a list of IP addresses. In order for an IP to be added to the whitelist a key must be presented in a query string. Once whitelisted, each IP will be valid for a configurable amount of time.

This app was designed to be particularly easy to integrate with [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) running in Docker.

<!-- TOC -->
- [1. Obligatory security warning](#1-obligatory-security-warning)
  - [1.1. What to do if you suspect trouble](#11-what-to-do-if-you-suspect-trouble)
- [2. Prerequisites](#2-prerequisites)
- [3. How does it work?](#3-how-does-it-work)
- [4. How to run the whitelister](#4-how-to-run-the-whitelister)
  - [4.1. Running as a standalone app](#41-running-as-a-standalone-app)
  - [4.2. Running with Docker](#42-running-with-docker)
    - [4.2.1. Build a Docker image](#421-build-a-docker-image)
    - [4.2.2. Run a standalone Docker container](#422-run-a-standalone-docker-container)
    - [4.2.3. Run as a companion container to Nginx Proxy Manager](#423-run-as-a-companion-container-to-nginx-proxy-manager)
- [5. Configuring the validator](#5-configuring-the-validator)
  - [5.1. Environment variables](#51-environment-variables)
- [6. How to integrate with Nginx](#6-how-to-integrate-with-nginx)
  - [6.1. Nginx proxy host configuration](#61-nginx-proxy-host-configuration)
  - [6.2. Validation URLs](#62-validation-urls)
  - [6.3. Condition headers](#63-condition-headers)
  - [6.4. Validation logic](#64-validation-logic)
<!-- /TOC -->

## 1. Obligatory security warning

__*nginx-ip-whitelister*__ was designed to be a security improvement over leaving your Emby/Jellyfin completely open to the whole Internet.

**It is not better than using a full-fledged VPN**. If you already have OpenVPN, WireGuard, Tailscale or a SSH tunnel working and you're considering trading them for this, think twice!

While having Emby/Jellyfin exposed directly as HTTP links is more convenient, it's also less secure. You will be literally trading security for convenience.

In case you're still foolish enough to use this:

* __*nginx-ip-whitelister*__ won't work on its own. You must use Nginx as a reverse proxy.
* **Enable HTTPS** on the reverse proxy! If you don't do this you might as well give up the whole thing right now.
* Use a **long key** for validation. For example:
  ```
  dd status=none if=/dev/urandom bs=1024 count=1|sha256sum
  ```
* Consider enabling **Basic Authentication** on the reverse proxy as an additional layer of protection and using a **long username and password**.
* Understand that there's no 100% foolproof way to prevent the access link from making its way into the world, hopping from friend to friend.

### 1.1. What to do if you suspect trouble

* **Stop __*nginx-ip-whitelister*__.** This will cut all access instantly, because Nginx will refuse requests if it cannot reach the validating backend.
* **Change the keys** before you restart the app/container.
* **Check the logs** to see what went wrong.

## 2. Prerequisites

In order to use __*nginx-ip-whitelister*__ you must have already accomplished the things below:

* The host that runs Emby/Jellyfin has a public IP (your ISP allocates one for your home router, or you're using a VPS etc.)
* You have a \[sub]domain A record pointing at that public IP (and you use DDNS to keep it in sync if it's dynamic etc.)
* You forward a port in your firewall to an Nginx install acting as reverse proxy in front of Emby/Jellyfin.
* **Nginx was compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).**
* You have configured SSL for your domain (**highly recommended**), so that all connections to Emby/Jellyfin are encrypted.
* Bottom line, if you connect to `https://your.domain[:PORT]/` you can see and use your Emby/Jellyfin.

> It is beyond the scope of this documentation to explain how to achieve all this. For what it's worth I recommend using [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) because it makes some of the things above a lot easier.

## 3. How does it work?

By default your Emby/Jellyfin install will show 403 errors to any visitor. 

To make it work your friend and relatives need to use a link like this:

`https://your.domain[:PORT]/?ACCESS-KEY[:TOTP]`

The link goes to the Nginx reverse proxy, where it runs against the Nginx proxy configuration for `your.domain`.

You add a configuration snippet to that host that will cause all requests to be validated against a 3rd party URL.

That 3rd party URL belongs to the __*nginx-ip-whitelister*__ – which needs to be running at an address that the Nginx host can access, naturally.

Whenever __*nginx-ip-whitelister*__ sees a valid access key in a request URL it adds the visitor's IP address to a whitelist. Once that happens, all the following requests from the IP (which usually means everybody and everything in their LAN) will be allowed through.

You can optionally configure more conditions for the visitors on top of using a key, such as netmasks, GeoIP, TOTP codes etc. 

## 4. How to run the whitelister 

### 4.1. Running as a standalone app

Copy `.env.example` to `.env` and edit to your liking. Then:

```
$ npm install --omit-dev
$ node index.js
```

You may want to use a tool like `supervisor` or `nodemon` that will restart the whitelister if it fails.

### 4.2. Running with Docker

#### 4.2.1. Build a Docker image

You can use the `Dockerfile` and `.dockerignore` included in the package and run the following command from the project root:

```
$ docker build --tag zuavra/nginx-ip-whitelister .
```

Yes, there's a dot at the end of the command.

This will build the image and publish it to your machine's local image repository, where it's now ready for being used by Docker containers:

#### 4.2.2. Run a standalone Docker container

You can run a Docker container that listens on the host's network interface. Use this if your Nginx or Nginx Proxy Manager are able to communicate directly with the host network.

See the `docker-compose-standalone.yaml` file for an example.

You can of course also rely on `.env` if you place this in the same dir, omit the `environment:` section, and define the port as `- "${PORT}:${PORT}/tcp"`.

#### 4.2.3. Run as a companion container to Nginx Proxy Manager

If you intend to run both Nginx Proxy Manager and **_nginx-ip-whitelister_** as Docker containers you need to define a Docker network between them so the proxy will be able to reach the validator.

* Create the Docker network:
  ```
  # docker network create nginx-network
  ```
* Tell each container to use the network by adding it to their `docker-compose.yaml` service definition:
  ```
  networks:
    - nginx-network
  ```
* Give the validator its own hostname, so it's easier to refer to it from the proxy config:
  ```
  hostname: nginx-iw
  ```
* Add the network definition *outside* the service definition:
  ```
  networks:
    nginx-network:
      external:
        name: nginx-network
  ```
* It's also a very good idea to make the __*nginx-ip-whitelister*__ container depend on the Nginx / Nginx Proxy Manager container:
  ```
  depends_on:
    - name-of-nginx-container
  ```

See the `docker-compose-proxy-manager.yaml` file for an example that combines both service definitions into a single file.

## 5. Configuring the validator

### 5.1. Environment variables

The following variables need to be available in the app environment to work. You can defined them in an `.env` file placed near `index.js` if you're running a standalone app, or provide them in the compose configuration, or as docker command line parameters etc.

* `PORT`: defines the port that the validator listens on. *Defaults to `3000`.*
* `HOST`: defines the interface that the validator listens on. *Defaults to `0.0.0.0`.*
* `FIXED_TIMEOUT`: a number followed by `d`, `h`, `m` or `s` to indicate
an amount of days, hours, minutes or seconds, respectively, after which an IP is removed from the whitelist. *Defaults to 2 hours (`2h`).* This interval is calculated from the moment the IP was first added to the list. The interval does *not* extend if you use the key again – hence the "fixed" name.
* `KEY`: you can specify an access key which will always be checked. Leave blank to disable this and to only check keys passed from Nginx configuration.
* `DEBUG`: if set to `yes` it will log every request to the standard output. By default it will only log the initial "Listening..." message.

## 6. How to integrate with Nginx

### 6.1. Nginx proxy host configuration

In order to tell Nginx to use __*nginx-ip-whitelister*__ you need to use the `auth_request` directive to validate requests against the correct verification URL, and pass to it the original URI and the remote IP address.

> In order to be able to use `auth_request`, Nginx needs to include the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).

The `auth_request` directive can be used in the `http`, `server` or `location` contexts. Please see the example below.

If you're using Nginx Proxy Manager, edit the proxy host that you're using for Emby/Jellyfin and add this example configuration in the "Advanced" tab.

```
auth_request /__auth;
location = /__auth {
	internal;
	proxy_pass http://nginx-iw:3000/verify;
	proxy_pass_request_body off;
	proxy_set_header Content-Length "";
	proxy_set_header X-Original-URI $request_uri;
	proxy_set_header X-Forwarded-For $remote_addr;
}
```

If you're running the app standalone or in a non-networked container please replace `nginx-iw` with the appropriate hostname or IP address.

### 6.2. Validation URLs

Use `/verify` to call the conditional validator.

You can also use `/allow` to always pass the check, and `/reject` to always fail the check.

### 6.3. Condition headers

The following headers can optionally be passed to the validator from Nginx. The header names are case insensitive. Each header can be used multiple times.

> Please don't use commas or semicolons inside header values, they sometimes cause header libraries to split the value into separate ones.

* `x-nipw-key`: Define additional authentication keys that will only apply to this proxy host.
* `x-nipw-netmask-allow`: Define one or more IP network masks to allow. An IP that doesn't match any of these masks will be rejected.
* `x-nipw-netmask-deny`: Define one or more IP network masks to deny. An IP that matches any of these masks will be rejected. These headers will be ignored if any `-netmask-allow` headers are defined.
* `x-nipw-geoip-allow`: Define one or more two-letter ISO-3166-1 country codes to allow. An IP that doesn't match any of these countries will be rejected. Private IPs always pass this check.
* `x-nipw-geoip-deny`: Define one or more two-letter ISO-3166-1 country codes to deny. An IP that matches any of these countries will be rejected. Private IPs always pass this check. These headers will be ignored if any `-geoip-allow` header is defined.
* `x-nipw-totp`: Define one or more TOTP secrets. If any `-totp` header is defined, the visitor will have to append a valid TOTP code matching one of the secrets to the URL key, separated by a colon: `/?ACCESS-KEY:TOTP-CODE`. If none of the secrets have been matched the request will be rejected.

> Please understand that GeoIP matching is far from perfect. This project uses the [geoip-country](https://github.com/sapics/geoip-country) NPM module, which uses (outdated!) data from MaxMind. Please read that module's page to see how you can update the geo data if you own a MaxMind license.

### 6.4. Validation logic

The logic works in the following order:

* If the validation app cannot be reached by Nginx or returns any status code other than 2xx (including 500 if it malfunctions), request is rejected.
* If any allow netmasks are defined and the IP doesn't match any of them, request is rejected.
* If any deny netmasks are defined and the IP matches any of them, request is rejected.
* If any GeoIP allow countries are defined and the IP is not private and doesn't match any of them, request is rejected.
* If any GeoIP deny countries are defined and the IP is not private and matches any of them, request is rejected.
* If the IP is found in the whitelist and has not expired, request is approved.
* If the visitor's URL key doesn't match any of the keys provided in `.env` or via headers, request is rejected.
* If any TOTP secrets are defined and the visitor's URL TOTP code doesn't match any of them, request is rejected.
* The IP is added to the whitelist with an expiration timestamp, request is approved.

> **Remember** that the whitelist is stored in RAM and will be lost every time you stop or restart the app (or its container).
