# nginx-ip-whitelister

This is a server app that serves as a companion for an [Nginx](https://nginx.org/en/) install configured as a reverse proxy and compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).

It validates Nginx requests against a list of IP addresses. In order for an IP to be added to the whitelist a key must be presented in a query string. Once whitelisted, each IP will be valid for a configurable amount of time.

This app was designed to be particularly easy to integrate with [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) running in Docker.

<!-- TOC -->
- [1. Use cases](#1-use-cases)
- [2. Prerequisites](#2-prerequisites)
- [3. How the validator works](#3-how-the-validator-works)
- [4. Security considerations](#4-security-considerations)
- [5. Running as a standalone app](#5-running-as-a-standalone-app)
- [6. Running with Docker](#6-running-with-docker)
  - [6.1. Build a Docker image](#61-build-a-docker-image)
  - [6.2. Run a standalone Docker container](#62-run-a-standalone-docker-container)
  - [6.3. Run as a companion container to Nginx Proxy Manager](#63-run-as-a-companion-container-to-nginx-proxy-manager)
- [7. How to integrate with Nginx](#7-how-to-integrate-with-nginx)
  - [7.1. Nginx configuration](#71-nginx-configuration)
  - [7.2. Validation URLs](#72-validation-urls)
  - [7.3. Condition headers](#73-condition-headers)
  - [7.4. Validation logic](#74-validation-logic)
<!-- /TOC -->


## 1. Use cases

Say you're visiting a friend or family's home and using their WiFi. You have an Emby or Jellyfin install at your home and you'd like to use it to see a movie together. There are numerous methods of exposing Emby/Jellyfin over the Internet securely, best of which is some kind of encrypted tunnel (a VPN such as Tailscale/Wireguard/OpenVPN, a SSH tunnel etc.) While that allows one device to reach Emby/Jellyfin, it doesn't allow you to cast to a Chromecast or DLNA device in your friend's LAN, because only your device has access to the tunnel.

There are of course solutions for that too, but they are all complicated and go beyond what you'd be able to do on the fly at a friend's home (such as adding VPN support to their router – assuming it supports it, or adding your own access point with access to the tunnel etc.)

The __*nginx-ip-whitelister*__ assumes your Emby/Jellyfin are running behind a publicly-accessible Nginx reverse proxy and takes advantage of the `auth_request` directive to grant access to the public IP you're currently using, effectively allowing everthing in the LAN (**and also allowing whomever might be spoofing that IP or can otherwise get their hands on it**!)

## 2. Prerequisites

In order to use __*nginx-ip-whitelister*__ as intended you must have already accomplished the following:

* The host that runs Emby/Jellyfin has a public IP (your ISP allocates one for your home router, or you're using a VPS etc.)
* You have a [sub]domain A record pointing at that public IP (and you use DDNS to keep it in sync if it's dynamic etc.)
* You forward a port in your firewall to an Nginx install acting as reverse proxy in front of Emby/Jellyfin.
* You have configured SSL for your domain (**highly recommended**), so that all connections to Emby/Jellyfin are encrypted.
* Bottom line, if you connect to `https://your.domain[:PORT]/` you can see and use your Emby/Jellyfin.

> I recommend using [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) because it makes most of the things above a lot easier.

At this point you can deploy __*nginx-ip-whitelister*__ and add a simple configuration snippet to Nginx that will cause all HTTP requests to Emby/Jellyfin to run against its validator.

## 3. How the validator works

Nginx calls `http://[nginx-ip-whitelister-address]/verify` for each HTTP request coming through the reverse proxy, *before* they reach Emby/Jellyfin.

Each verification call is told the original Emby/Jellyfin URI and the visitor's remote IP address as HTTP headers.

The validator uses this information to respond 200 (let it through) or 403 (block it) as follows:

  * Looks up the IP in a simple in-memory key-value `Map` (IP->expiration). If the IP exists and hasn't expired it allows it.
  * Otherwise, it checks whether the request URI contains `?YOUR-KEY` as the query string. You can bookmark `https://your.domain[:PORT]/?YOUR-KEY` in your phone browser to achieve this. When such a request arrives, the validator adds the IP to the whitelist with a configurable expiration time and allows the request.
  * If neither of the above was true the request is rejected.

> **Remember** that the whitelist is stored in RAM and will be lost every time you stop or restart the app (or its container).

## 4. Security considerations

> Using the IP as the sole means of verifying requests is **not secure**. You run this at your own risk and I assume you understand the implications.

In case you're still foolish enough to use this:

* **Enable SSL** on the reverse proxy! If you don't do this you might as well give up the whole thing right now.
* Enable **Basic Authentication** on the reverse proxy as an additional layer of protection and use a **long username and password**.
* Use a **long key** for validation.
* **Don't share the bookmark** with the key with friends and family. There's no safe way to prevent it from making its way into the world, hopping from friend to friend.

**If you suspect trouble:**

  * **Stop __*nginx-ip-whitelister*__.** This will cut all access instantly, because Nginx will refuse requests if it cannot reach the validating backend.
  * **Change the key** and restart the app/container.

## 5. Running as a standalone app

Copy `.env.example` to `.env` and edit to your liking. Then:

```
$ npm install --omit-dev
$ node index.js
```

You may want to use a tool that will restart the app if it fails, but really you may want to consider using Docker.

## 6. Running with Docker

### 6.1. Build a Docker image

You can use the `Dockerfile` and `.dockerignore` included in the package and run the following command from the project root:

```
$ docker build --tag zuavra/nginx-ip-whitelister .
```

Yes, there's a dot at the end of the command.

This will build the image and publish it to your machine's local image repository, where it's now ready for being used by Docker containers:

### 6.2. Run a standalone Docker container

You can run a Docker container that listens on the host's network interface. Use this if your Nginx or Nginx Proxy Manager are able to communicate directly with the host network.

See the `docker-compose-standalone.yaml` file for an example.

You can of course also rely on `.env` if you place this in the same dir, omit the `environment:` section, and define the port as `- "${PORT}:${PORT}/tcp"`.

### 6.3. Run as a companion container to Nginx Proxy Manager

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

## 7. How to integrate with Nginx

### 7.1. Nginx configuration

In order to tell Nginx to use __*nginx-ip-whitelister*__ you need to use the `auth_request` directive to validate requests against the correct verification URL, and pass to it the original URI and the remote IP address.

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

### 7.2. Validation URLs

Use `/verify` to call the conditional validator.

You can also use `/allow` to always pass the check, and `/reject` to always fail the check.

### 7.3. Condition headers

The following headers can optionally be passed to the validator from Nginx. The header names are case insensitive. Each header can be used multiple times.

> Please don't use commas inside header values unless you mean to split them into multiple values at the commas.

* `x-nipw-key`: Define additional authentication keys that will work alongside with the one defined in `.env`.
* `x-nipw-netmask-allow`: Define one or more IP network masks to allow. An IP that doesn't match any of these masks will be rejected.
* `x-nipw-netmask-deny`: Define one or more IP network masks to deny. An IP that matches any of these masks will be rejected. If any `-netmask-allow` header is defined all `-netmask-deny` headers will be ignored.
* `x-nipw-geoip-allow`: Define one or more two-letter ISO-3166-1 country codes to allow. A non-private IP that doesn't match any of these countries will be rejected.
* `x-nipw-geoip-deny`:  Define one or more two-letter ISO-3166-1 country codes to deny. A non-private IP that matches any of these countries will be rejected. If any `-geoip-allow` header is defined all `-geoip-deny` headers will be ignored.

> Please understand that GeoIP matching is far from perfect. This project uses the [geoip-country](https://github.com/sapics/geoip-country) NPM module, which uses (outdated!) data from MaxMind. Please see the module's page to see how to update the geo data if you own a MaxMind license.

### 7.4. Validation logic

The logic works in the following order:

* If the validation app cannot be reached by Nginx or returns any status code other than 2xx (including 500 if it malfunctions), request is rejected.
* If any allow netmasks are defined and the IP doesn't match any of them, request is rejected.
* If any deny netmasks are defined and the IP matches any of them, request is rejected.
* If any GeoIP allow countries are defined and the IP is not private and doesn't match any of them, request is rejected.
* If any GeoIP deny countries are defined and the IP is not private and matches any of them, request is rejected.
* If the IP is found in the whitelist and has not expired, request is approved.
* If the visitor's key doesn't match any of the keys provided in `.env` or via headers, request is rejected.
* The IP is added to the whitelist with an expiration timestamp, request is approved.
