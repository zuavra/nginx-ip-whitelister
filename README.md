# nginx-ip-whitelister

This is a Node.js server app that acts as a companion for an [Nginx](https://nginx.org/en/) install configured as reverse proxy and compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html).

It validates proxy requests against a list of IP addresses. In order for an IP to be added to the list a key must be presented in the query string. Once whitelisted, each IP will be valid for a configurable amount of time.

This app was designed to be particularly easy to integrate with [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) running in Docker.

<!-- TOC -->
- [1. Security warning](#1-security-warning)
  - [1.1. Don't use this](#11-dont-use-this)
  - [1.2. There are better ways to secure your server](#12-there-are-better-ways-to-secure-your-server)
  - [1.3. How do I mitigate the security risk?](#13-how-do-i-mitigate-the-security-risk)
  - [1.4. What to do if you suspect trouble](#14-what-to-do-if-you-suspect-trouble)
- [2. Prerequisites](#2-prerequisites)
- [3. How do I use it?](#3-how-do-i-use-it)
- [4. How does it work under the hood?](#4-how-does-it-work-under-the-hood)
- [5. How to run the whitelister](#5-how-to-run-the-whitelister)
  - [5.1. Running as a standalone app](#51-running-as-a-standalone-app)
  - [5.2. Running with Docker](#52-running-with-docker)
    - [5.2.1. Run a standalone Docker container](#521-run-a-standalone-docker-container)
    - [5.2.2. Run a Docker container alongside a Nginx Proxy Manager container](#522-run-a-docker-container-alongside-a-nginx-proxy-manager-container)
    - [5.2.3. Pull the pre-built Docker image](#523-pull-the-pre-built-docker-image)
    - [5.2.4. Build a Docker image yourself](#524-build-a-docker-image-yourself)
- [6. How to integrate with Nginx](#6-how-to-integrate-with-nginx)
  - [6.1. Nginx proxy host configuration](#61-nginx-proxy-host-configuration)
    - [6.1.1. Simple configuration example](#611-simple-configuration-example)
    - [6.1.2. Advanced configuration example](#612-advanced-configuration-example)
  - [6.2. Validator URLs](#62-validator-urls)
    - [6.2.1. Validation endpoints](#621-validation-endpoints)
    - [6.2.2. Management endpoints](#622-management-endpoints)
    - [6.2.3. Security](#623-security)
- [7. Configuring the validator](#7-configuring-the-validator)
  - [7.1. Environment variables](#71-environment-variables)
  - [7.2. Timeout headers](#72-timeout-headers)
  - [7.3. Condition headers](#73-condition-headers)
- [8. Validation logic](#8-validation-logic)
- [9. Credits](#9-credits)
<!-- /TOC -->

## 1. Security warning

### 1.1. Don't use this

⚠️ **Never use this** while on public WiFi at a cafe, hotel, airport, festival, mall etc., on a cellular connection (cell tower), or at work.

By granting access to your public IP in such a place you grant access to an entire building or even an entire area full of people.

In such situations you MUST use a secure tunnel (VPN/SSH) or an IAM provider that uses cookies over TLS.

### 1.2. There are better ways to secure your server

__*nginx-ip-whitelister*__ was designed to be a security improvement over leaving your Emby/Jellyfin completely open to the whole Internet. That's not a very high bar.

**There are better methods**. If you've arrived to this page because you want to secure your server please read through the following comparisons first:

1. Ask your friends to use a VPN like OpenVPN/WireGuard/Tailscale or an SSH tunnel on their PC, laptop, phone or tablet. VPN/SSH lets you access Emby/Jellyfin in your browser or from the Emby/Jellyfin apps.
   * Pros: they can use Jellyfin from the browser or 3rd party Emby/Jellyfin apps; excellent security; each friend uses their own acces key; they can safely use it anywhere, even at public venues or at a hotel.
   * Cons: can't cast to media devices (TV, Chromecast etc.)
2. Ask friends to login to IAM provider like Authelia/Authentik or [vouch-proxy](https://github.com/vouch/vouch-proxy) in their browser.
   * Pros: also excellent security; can be used in public venues; easier to use than a VPN.
   * Cons: can't cast to media devices; can't use 3rd party Emby/Jellyfin apps (you can *only* access it in a browser).
3. Set up a VPN/SSH tunnel client on your relative/friend's *router* and let the router handle the VPN stuff.
   * Pros: good security; lets people use any browser or 3rd party app; all devices on their LAN can connect so you can cast to media devices.
   * Cons: not portable, and the router needs to be a prosumer model to support VPN/SSH.
4. Set up a VPN/SSH tunnel client on someone's phone and have them activate WiFi hotspot on the phone when they want to grant access to others. (If they don't want to share access then just see bullet 1, no need for hotspot.)
   * Pros: good security; can be used in public venues or at hotels; any device that connects to the hotspot can access Emby/Jellyfin from browsers or 3rd party apps, which means people can cast to media devices too.
   * Cons: more complicated for everybody involved; all devices need to connect to the hotspot to access Emby/Jellyfin; it will consume from the phone's cellular data plan; probably eats up the battery too.
5. Use SSH to browse the files on your server remotely. Use a mobile player that can stream from SSH or a file explorer like Solid Explorer that has the ability to relay SSH files to any player app. Use an app like BubbleUPnP as the player app if you want to also cast to a LAN renderer.
   * Pros: good security; can be used in public venues or at hotels; can cast to media devices.
   * Cons: restricted to mobile phones and a specific combination of apps.
6. nginx-ip-whitelister:
   * Pros: you can use it from browser or 3rd party apps; it lets you cast to media devices.
   * Cons: not as secure as the other options; MUST NOT be used from public venues, hotels etc.

In conclusion, it's true that __*nginx-ip-whitelister*__ solves some problems, like allowing you to use Emby/Jellyfin apps or letting you cast to media devices; but granting access to whatever public IP you may be using at the time can and **will** backfire if you don't know what you're doing.

### 1.3. How do I mitigate the security risk?

In case you're still foolish enough to use this:

* __*nginx-ip-whitelister*__ won't work on its own. You must use it alongside Nginx acting as a reverse proxy.
* **Enable HTTPS** on the reverse proxy! If you don't do this you might as well give up the whole thing right now.
* Use a **long key** for validation. For example:
  ```
  dd status=none if=/dev/urandom bs=1024 count=1|sha256sum
  ```
* Consider enabling **Basic Authentication** on the reverse proxy as an additional layer of protection and using a **long username and password**.
* Understand that there's **no way** to prevent the access link from making its way into the world, hopping from friend to friend.

### 1.4. What to do if you suspect trouble

* **Stop __*nginx-ip-whitelister*__** (kill the app or the docker container). Nginx will refuse requests if it cannot reach the validating backend.
* You can **use `/?LOGOUT` as a key** (case-insensitive) and it will de-list your current IP (but only your current IP).
* **Change the keys** before you start the app/container back up again.
* **Check the logs** to see what went wrong.

## 2. Prerequisites

In order to use __*nginx-ip-whitelister*__ you must have already accomplished the things below:

* The host that runs Emby/Jellyfin has a public IP (your ISP allocates one for you, or you're using a VPS etc.)
* You have a \[sub]domain A record pointing at that public IP (and you use DDNS to keep it in sync if it's dynamic etc.)
* You forward a port in your firewall to an Nginx install acting as reverse proxy in front of Emby/Jellyfin.
* Nginx was compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html). Run `nginx -V` and check the output to see if the module is present.
* You have configured TLS for your domain, so that all connections to Emby/Jellyfin are encrypted. This is crucial; again, if you don't do this then the whole setup is worthless.
* Bottom line, if you connect to `https://your.domain[:PORT]/` you can see and use your Emby/Jellyfin.

> It is beyond the scope of this documentation to explain how to achieve all this. For what it's worth I recommend using [Nginx Proxy Manager](https://github.com/NginxProxyManager/nginx-proxy-manager/) because it makes some of the things above a lot easier.

## 3. How do I use it?

After completing the requirements and activating the whitelister in the proxy config, your Emby/Jellyfin install should show 403 errors to any visitor when accessed through the reverse proxy.

To make it work you need to use a link like this:

`https://your.domain[:PORT]/?ACCESS-KEY[:TOTP]`

This will record your current IP and allow it normal access for a period of time. If you're using someone's WiFi all the devices using it will have access too, meaning you can cast to local media devices, TVs etc.

If you want to stop allowing your IP before the timeout runs out use "LOGOUT" as a key:

`https://your.domain[:PORT]/?LOGOUT`

You can use the proxy host configuration to pass additional configuration options to the validator as HTTP headers. It's a good idea to configure different keys for different people, at the very least. Please read the configuration section to find out more.

## 4. How does it work under the hood?

The link goes to the Nginx reverse proxy, where it runs against the Nginx proxy configuration for `your.domain`.

You add the auth_request directive to the proxy configuration to cause requests to be validated against a 3rd party URL.

That 3rd party URL belongs to the __*nginx-ip-whitelister*__ – which needs to be running at an address that the Nginx host can access.

Whenever __*nginx-ip-whitelister*__ sees a valid access key in a request URL it adds the visitor's IP address to a whitelist. Once that happens, all requests from the IP (which usually means everybody and everything in their LAN) will be allowed through.

You can optionally configure more conditions for the visitors such as IP netmasks, GeoIP, TOTP codes etc. 

## 5. How to run the whitelister 

### 5.1. Running as a standalone app

Copy `.env.example` to `.env` and edit to your liking. Then:

```
$ npm install --omit-dev
$ node index.js
```

You may want to use a tool like `supervisor` or `nodemon` that will restart the whitelister if it fails.

It's also a good idea to redirect output to a log file that you can examine later if something goes wrong.

### 5.2. Running with Docker

#### 5.2.1. Run a standalone Docker container

You can run this app as a Docker container that listens on the host's network interface. Use this if your Nginx or Nginx Proxy Manager are able to communicate directly with the host network.

Download the `docker-compose-standalone.yaml` file then run `docker-compose up -d` from the same directory.

#### 5.2.2. Run a Docker container alongside a Nginx Proxy Manager container

If you intend to run both Nginx Proxy Manager and **_nginx-ip-whitelister_** as Docker containers you need to define a Docker network between them so the proxy will be able to reach the validator.

The file `docker-compose-proxy-manager.yaml` contains an example configuration that will deploy both NPM and this app in separate containers, but allow them to communicate through a Docker network.

You will need to create the Docker network:  
`docker network create nginx-network`

Then run `docker-compose up -d` from the same directory where you've downloaded the `.yaml` file.

#### 5.2.3. Pull the pre-built Docker image

You can find pre-built Docker images for this project on the GitHub Container Repository:  
https://github.com/users/zuavra/packages/container/package/nginx-ip-whitelister

The example `.yaml` files provided with the source code already refer to the pre-built image, for your convenience.

However, you can also pull the ready-made image manually, to use in Docker configurations you've written yourself, or as a layer for other Docker images, or simply when you wish to update to the latest version of the app.

To do that, run:  
`docker pull ghcr.io/zuavra/nginx-ip-whitelister:latest`

> After pulling the latest image please remember that you also have to stop, remove, and then remake any Docker containers based on it.

#### 5.2.4. Build a Docker image yourself

If you'd like to build a local Docker image yourself, for example if you've modified the source code, you can use the `Dockerfile` and `.dockerignore` included in the package and run the following command from the project root:

```
$ docker build --tag zuavra/nginx-ip-whitelister .
```

Yes, there's a dot at the end of the command.

This will build the image and publish it to your machine's local image repository, where it's now ready for being used by Docker containers.

> Please remember to change your `.yaml` files or `docker run` commands to use the name of the local image (`zuavra/nginx-ip-whitelister:latest`) rather than the GHCR pre-built image (`ghcr.io/zuavra/nginx-ip-whitelister:latest`). You will also have to stop,remove and remake containers in order to use the new image.

## 6. How to integrate with Nginx

### 6.1. Nginx proxy host configuration

In order to tell Nginx to use __*nginx-ip-whitelister*__ you need to use the `auth_request` directive to validate requests against the correct verification URL, and pass to it the original URI and the remote IP address.

> In order to be able to use `auth_request`, Nginx needs to include the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html). Check the output of `nginx -V` for the module name.

The `auth_request` directive is pretty flexible and can be used in `http`, `server` or `location` contexts.

If you're using Nginx Proxy Manager, edit the proxy host that you're using for Emby/Jellyfin and add this example configuration in the "Advanced" tab.

#### 6.1.1. Simple configuration example

This is a very basic example that only blocks requests without the correct key.

```
auth_request /__auth;
location = /__auth {
	internal;
	proxy_pass_request_body off;
	proxy_set_header Content-Length "";
	proxy_set_header X-Original-URI $request_uri;
	proxy_set_header X-Forwarded-For $remote_addr;
	proxy_pass http://nginx-iw:3000/verify;
        proxy_set_header x-nipw-key "AVeryLongStringToBeUsedAsSecretKey";
}
```

If you're running the app standalone or in a non-networked container please replace `nginx-iw` with the appropriate hostname or IP address.

#### 6.1.2. Advanced configuration example

This is a more advanced example that shows you how to use some access headers to set up custom access conditions. These aren't all the possible headers, see the next section for a full list.

```
auth_request /__auth;
location = /__auth {
	# common proxy settings
	internal;
	proxy_pass_request_body off;
	proxy_set_header Content-Length "";
	proxy_set_header X-Original-URI $request_uri;
	proxy_set_header X-Forwarded-For $remote_addr;

	# the next line has a parameter that makes this proxy instance use
	# a separate IP whitelist called "jellyfin" instead of the default whitelist
	proxy_pass http://nginx-iw:3000/verify?jellyfin; 

	# specific access settings; see the next section for all possible headers
        proxy_set_header x-nipw-key-isolation "disabled";
        proxy_set_header x-nipw-fixed-timeout "3h";
        proxy_set_header x-nipw-sliding-timeout "30m";
        proxy_set_header x-nipw-geoip-allow "DE";
        proxy_set_header x-nipw-key "AVeryLongStringToBeUsedAsSecretKey";
}

```

### 6.2. Validator URLs

#### 6.2.1. Validation endpoints

Use `/verify` from the proxy host config to call the conditional validator. This validator endpoint is subject to the conditions that you have specified using `x-nipw-*` headers.

You can add an alphanumeric parameter to it (e.g. `/verify?ServiceName123`) to make it use a specific named whitelist. If the parameter is not provided it will use the default whitelist. This allows you to use different whitelists for different services. Having separated whitelists allows you to quickly reset the access whitelist for only one service from the admin interface without affecting the other services.

> The parameter that gives the whitelist name is case-sensitive! `Jellyfin` and `jellyfin` will go to different whitelists.

You can also use `/approve` to always unconditionally pass the check, and `/reject` to always unconditionally fail the check (for integration tests).

#### 6.2.2. Management endpoints

Use `/admin/whitelist` directly to see the current whitelist state. It provides links to `/admin/delete` that allow you to kick out individual addresses or wipe out a whitelist completely. Your own current IP is indicated in red if present.

![Admin overview](https://github.com/zuavra/nginx-ip-whitelister/blob/master/admin_overview.png?raw=true)

#### 6.2.3. Security

None of these endpoints are secured by default so do not expose them on the Internet without adding some form of protection (reverse proxy with basic authentication, IAM provider, VPN, SSH etc.)

If you wrap them behind reverse proxy you *can* use the validator to whitelist access to its own management endpoints but be warned it will suffer from all the shortcomings characteristic to IP whitelisting.

Ideally, validation endpoints should only be exposed on the internal Docker network between the Nginx Proxy Manager container and the validator container; and management endpoints only on the LAN, or properly tunneled.

## 7. Configuring the validator

### 7.1. Environment variables

The following variables can be added to the app environment. You can defined them in an `.env` file placed near `index.js` if you're running a standalone app, or provide them in the compose configuration, or as docker command line parameters etc.

* `PORT`: defines the port that the validator listens on. *Defaults to `3000`.*
* `HOST`: defines the interface that the validator listens on. *Defaults to `0.0.0.0`.*
* `DEBUG`: if set to `yes` it will log every request to the standard output. By default it will only log the startup messages.

### 7.2. Timeout headers

The following headers can optionally be passed to the validator from Nginx to adjust the timeout policy for the whitelist.

The header names are case insensitive. You can only use these headers once each – additional uses will be ignored.

The timeouts are **always** enforced, whether you use these headers or not. Using the headers merely allows you to adjust the intervals.

* `x-nipw-fixed-timeout`: A strictly positive integer, followed by the suffix `d`, `h`, `m` or `s` to indicate an amount of days, hours, minutes or seconds, respectively. The fixed timeout is compared against the moment when an IP was first added to the whitelist and it does not change. In other words, if you set a fixed timeout of `6h`, the IP will be de-listed 6 hours later, period. If you don't provide this header *the fixed timeout defaults to 2 hours*.
* `x-nipw-sliding-timeout`: Same format as the fixed timeout. The sliding timeout is compared against the most recent access from that IP, and if successful the last access is reset to now. In other words, if you set a sliding timeout of '30m', the IP will not be de-listed unless there's no access for 30 straight minutes. If you don't provide this header *the sliding timeout defaults to 5 minutes*.

> Both timeout policies are enforced in parallel – each IP has a fixed time window from when it started *as well as* a condition to not be inactive for too long.

### 7.3. Condition headers

The following headers can optionally be passed to the validator from Nginx to impose additional condition upon the requests.

The header names are case insensitive. Most of these headers can be used multiple times (exceptions are noted below).

> Please don't use commas or semicolons inside header values, they can sometimes cause header libraries to split the value into separate ones.

* `x-nipw-key`: Define an authentication key.
* `x-nipw-key-isolation`: Value can be *"enabled" (default)* or "disabled" (case-insensitive). This header is only processed once (duplicates are ignored). When key isolation is enabled it prevents keys from being used by multiple IPs at the same time; once an IP has been whitelisted the key it used can't be used again until the IP exits the whitelist.
* `x-nipw-netmask-allow`: Define an IP network mask to allow. An IP that doesn't match any of the allow masks will be rejected.
* `x-nipw-netmask-deny`: Define an IP network masks to deny. An IP that matches any of the deny masks will be rejected. These headers will be ignored if any `-netmask-allow` header is defined.
* `x-nipw-geoip-allow`: Specify a two-letter ISO-3166-1 country code to allow. An IP that doesn't match any allow countries will be rejected. Private IPs always pass this check.
* `x-nipw-geoip-deny`: Define a two-letter ISO-3166-1 country code to deny. An IP that matches any of the deny countries will be rejected. Private IPs always pass this check. These headers will be ignored if any `-geoip-allow` header is defined.
* `x-nipw-totp`: Define a TOTP secret. If any `-totp` header is defined, the visitor will have to append a valid TOTP code matching one of the secrets to the URL key, separated by a colon: `/?ACCESS-KEY:TOTP-CODE`. If none of the secrets have been matched the request will be rejected.

> Please understand that GeoIP matching is far from perfect. This project uses a "lite" GeoIP database which is not super-accurate, but even the larger databases can make mistakes. Accept the fact that occasionally you will end up blocking (or allowing) an IP that shouldn't be.

## 8. Validation logic

The logic works in the following order:

* If the validation app cannot be reached by Nginx or returns any status code other than 2xx (including 500 if it malfunctions), request is rejected.
* If any allow netmasks are defined and the IP doesn't match any of them, request is rejected.
* If any deny netmasks are defined and the IP matches any of them, request is rejected.
* If any GeoIP allow countries are defined and the IP is not private and doesn't match any of them, request is rejected.
* If any GeoIP deny countries are defined and the IP is not private and matches any of them, request is rejected.
* If the IP is found in the whitelist and has not expired (subject to both sliding and fixed timeout), request is approved.
* If the visitor's URL key doesn't match any of the defined keys, request is rejected.
* If key isolation is in effect and the visitor's key was already used by another IP in the whitelist, request is rejected.
* If any TOTP secrets are defined and the visitor's URL TOTP code doesn't match any of them, request is rejected.
* The IP is added to the whitelist, request is approved.

> **Remember** that the whitelist is stored in RAM and will be lost every time you stop or restart the app (or its container).

## 9. Credits

This project uses [IP Geolocation by DB-IP](https://db-ip.com). Please note that the `dbip-country-lite.mmdb` file is licensed under [Creative Commons Attribution 4.0 International](http://creativecommons.org/licenses/by/4.0/).
