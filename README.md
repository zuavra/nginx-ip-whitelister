# nginx-ip-whitelister (aka NIW) 

This app (called **NIW** in the rest of this page) is a forward authenticator written in Node.js that can be used with a reverse proxy (Nginx, Caddy are officially supported) to whitelist a client IP temporarily when a key is presented in the URL.

NIW can run as a standalone Node app or as a hardened (distroless Node) container image. The app is entirely hand-coded (no AI), it's designed to be as simple as possible, uses the least amount of NPM modules with zero extra dependencies, and runs entirely in memory.

> ℹ️ Note: it has "Nginx" in the name because it started out as an Nginx companion app but nowadays more proxies are supported and you can find configuration examples below. If you make it work with other reverse proxies you are welcome to open an enhancement suggestion and describe your configuration.

<!-- TOC depthfrom:2 -->

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
    - [5.2.1. Run a standalone Docker container on the host network](#521-run-a-standalone-docker-container-on-the-host-network)
    - [5.2.2. Network the NIW container with the proxy container](#522-network-the-niw-container-with-the-proxy-container)
    - [5.2.3. Pull and backup the pre-built Docker image](#523-pull-and-backup-the-pre-built-docker-image)
    - [5.2.4. Build a Docker image yourself](#524-build-a-docker-image-yourself)
- [6. How to configure the reverse proxy](#6-how-to-configure-the-reverse-proxy)
  - [6.1. Nginx / Nginx Proxy Manager](#61-nginx--nginx-proxy-manager)
    - [6.1.1. Basic Nginx config](#611-basic-nginx-config)
    - [6.1.2. Advanced Nginx config](#612-advanced-nginx-config)
  - [6.2. Caddy](#62-caddy)
    - [6.2.1. Basic Caddy config](#621-basic-caddy-config)
    - [6.2.2. Advanced Caddy config](#622-advanced-caddy-config)
- [7. Validator documentation](#7-validator-documentation)
  - [7.1. Validator URLs](#71-validator-urls)
    - [7.1.1. Validation endpoints](#711-validation-endpoints)
    - [7.1.2. Test endpoints](#712-test-endpoints)
    - [7.1.3. Management endpoints](#713-management-endpoints)
    - [7.1.4. Endpoint security](#714-endpoint-security)
  - [7.2. Validator configuration](#72-validator-configuration)
    - [7.2.1. Environment variables](#721-environment-variables)
    - [7.2.2. HTTP headers](#722-http-headers)
    - [7.2.3. Timeout headers](#723-timeout-headers)
    - [7.2.4. Condition headers](#724-condition-headers)
  - [7.3. Validation logic](#73-validation-logic)
- [8. Credits](#8-credits)

<!-- /TOC -->

## 1. Security warning

### 1.1. Don't use this

⚠️ **Never use this** while on public WiFi at a coffee shop, hotel, airport, festival, mall, at work, or on a mobile connection (cell tower).

By granting access to your public IP in such a place you grant access to an entire building or even an entire area full of people.

For such situations you MUST use stronger authentication methods, please see below.

### 1.2. There are better ways to secure your server

NIW was designed to be a security improvement over leaving apps like Jellyfin or Emby completely open to the whole Internet. That's not a very high bar.

**There are better methods**. If you've arrived to this page because you want to secure your server please read through the following comparisons first:

1. Ask your friends to use a VPN like OpenVPN/WireGuard/Tailscale or an SSH tunnel on their PC, laptop, phone or tablet to access your server.
   * Pros: they can use the browser as well as Emby/Jellyfin client apps; excellent security; each friend uses their own access key, and they can be revoked if compromised; they can safely use it anywhere, even at public venues or at a hotel.
   * Cons: cannot cast to media devices (TV, Chromecast etc.)
2. Ask your friends to use mTLS. [Generate your own custom CA](https://jamielinux.com/docs/openssl-certificate-authority/), issue client certificates, and ask friends to load them into their browsers.
   * Pros: lets them use their browser; excellent security that authenticates both the server and the client browser and is resistant against hijacking with workplace-imposed certificates.
   * Cons: doesn't work with mobile apps or TVs.
3. Ask friends to login to IAM provider like Authelia, Authentik or [vouch-proxy](https://github.com/vouch/vouch-proxy) in their browser.
   * Pros: also excellent security; can be used in public venues; easier to use than a VPN.
   * Cons: can't cast to media devices; can't use 3rd party Emby/Jellyfin apps (you can *only* access it in a browser).
4. Set up a VPN/SSH tunnel client on your relative/friend's *router* and let the router handle the VPN stuff.
   * Pros: good security; lets people use any browser or 3rd party app; all devices on their LAN can connect so you can cast to media devices.
   * Cons: requires a prosumer router model and user savvy.
5. Set up a VPN/SSH tunnel client on someone's phone and have them activate WiFi hotspot. Alternatively use a mini-router like the GL.iNet Mango.
   * Pros: good security; can be used in public venues or at hotels; any device that connects to the hotspot can access Emby/Jellyfin from browsers or 3rd party apps, which means people can cast to media devices too. This approach can also solve other issues like poor WiFi security at hotel or AirBnb.
   * Cons: more complicated for everybody involved and requires a savvy user; all devices (including TVs) need to connect to the access point; if used with a phone it will consume from the phone's cellular data plan and probably eats up the battery too.
6. Use SSH (SFTP) or Samba inside a VPN to browse the files on your server remotely. Use a mobile player that can stream from SSH or a file explorer like Solid Explorer that has the ability to relay SSH files to any player app. Use an app like BubbleUPnP as the player app if you want to also cast to a LAN renderer over local WiFi.
   * Pros: decent security (depends on how well the local WiFi is secured); can cast to media devices.
   * Cons: restricted to mobile phones and a very specific combination of apps.
7. NIW:
   * Pros: you can use it from browser or 3rd party apps; it lets you cast to media devices.
   * Cons: not as secure as the other options; MUST NOT be used from public venues, hotels etc.

In conclusion, while it's true that NIW solves some problems, like allowing you to use Emby/Jellyfin client apps or letting you cast to media devices; but granting access to whatever public IP you may be using at the time can and **will** backfire if you don't know what you're doing.

### 1.3. How do I mitigate the security risk?

In case you're still foolish enough to use this:

* NIW won't work on its own. You need a reverse proxy.
* You must have HTTPS enabled on the reverse proxy. If you don't do this you might as well give up the whole thing right now.
* Use long, strong keys for validation. For example:
  ```
  # dd status=none if=/dev/urandom bs=1024 count=1 | sha256sum

  # pwgen -sBnc 64 1
  ```
* Secure the `/admin` endpoints of NIW or make sure they are not trivial to access. Consider enabling **Basic Authentication** on the reverse proxy as an additional layer of protection for them.
* Understand that there's **no way** to prevent the access link from making its way into the world, hopping from friend to friend.

### 1.4. What to do if you suspect trouble

* **Stop NIW** (kill the app or the docker container). The reverse proxy will refuse requests if it cannot reach the validation backend.
* You can **use `/?LOGOUT` as a key** (case-insensitive) and it will de-list your current IP (but only your current IP!).
* **Change the keys** before you start the app/container back up again.
* **Check the logs** to see what went wrong.

## 2. Prerequisites

In order to use NIW you must have already accomplished the things below:

1. You have a public IP (your ISP allocates one for you).
2. You have a \[sub]domain `A`/`AAAA` DNS record pointing at that public IP (and you use DDNS to keep it in sync if it's dynamic).
3. You use a reverse proxy in front of your service(s).
4. You forward a port on your router (for IPv4) or have a traffic rule (for IPv6) to connect a public port to the host running the reverse proxy.
5. Specific proxies may have additional requirements; for example Nginx needs to have `auth_request` support.
6. The reverse proxy has enabled TLS and HSTS for the domain, so that connections to that domain are encrypted. This is crucial; if you don't do this then the whole setup is worthless.
7. You have automatic TLS certificate renewal set up. Some proxies will do this for you, or you can use EFF's Certbot.
8. Bottom line, if you connect to `https://your.domain[:PORT]/` you can see and use your service.

Alternatively, if you don't have a public IP:

1. Rent a VPS. Lowest CPU and RAM is ok; bandwidth is more important.
2. Point your DNS at the VPS public IP (and run DDNS on the VPS if the IP is dynamic).
3. Run a VPN or SSH tunnel into the VPS from home.
4. Forward port 443 TCP from the VPS public IP into the tunnel.
5. Bind the reverse proxy at home to port 443 on the local end of the tunnel.

Points 5-8 above remain the same.

Please note that you _can_ use something like Pangolin or a CloudFlare Tunnel instead of a VPS, but they need extra resources and/or come with caveats, restrictions and privacy & security implications. You want a NAT traversal method; these are primarily CDN tools that happen to also work for NAT traversal.

> ℹ️ It is beyond the scope of this documentation to explain how to achieve all this. If you can't do it please take it as a hint you should not publicly expose the server.

## 3. How do I use it?

After completing the requirements and activating the whitelister in the proxy config, your service should show 403 errors to any visitor when accessed through the reverse proxy.

To make it work you need to use a link like this:

`https://your.domain[:PORT]/?[ACCESS-KEY][:TOTP]`

This will whitelist your current IP and allow it normal access for a period of time. If you're using a WiFi access point all the devices using it will have access too, meaning you can cast to local media devices, TVs etc.

If you want to stop allowing your IP before the timeout runs out use "LOGOUT" as a key:

`https://your.domain[:PORT]/?LOGOUT`

You can use the proxy host configuration to pass additional configuration options to the validator as HTTP headers. It's a good idea to configure different keys for different people, at the very least. Please read the configuration section to find out more.

## 4. How does it work under the hood?

The link goes to the reverse proxy, where it runs against the proxy configuration for `your.domain`.

You add a forward authentication config to that configuration to cause all requests for `your.domain` to be validated against a separate backend.

That backend is handled by the NIW app – which needs to be running at an address that the reverse proxy host can access.

Whenever NIW sees a valid access key in a request URL it adds the visitor's IP address to a whitelist. Once that happens, all requests from the IP (which usually means everybody and everything in their LAN) will be allowed through.

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

#### 5.2.1. Run a standalone Docker container on the host network

Run the following command to download the image and run an ad-hoc container immediately. No extra volume mappings are needed, app runs entirely in memory.

```
docker run \
  --name proxy-niw \
  --hostname niw \
  --init \
  --user 1000:1000 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --read-only \
  -e TZ=Europe/Paris \
  -e PORT=3000 \
  -e HOST=0.0.0.0 \
  -e LOG_LEVEL=info \
  --restart always \
  ghcr.io/zuavra/nginx-ip-whitelister:latest
```

Alternatively please see the `docker-compose.yaml` file to run the container via Docker compose. Download the compose file then run `docker-compose up -d` from the same directory.

In both these cases the container will open a port on the host's network interface. Use this if your reverse proxy is able to reach that port directly.

#### 5.2.2. Network the NIW container with the proxy container

If you intend to run both the reverse proxy and NIW as Docker containers you need to allow them to access each other over the network, so the proxy will be able to reach the validator.

There are many ways to achieve this with Docker and it's beyond the scope of this documentation to explain all of them so these are just some suggestions:

* You can run both containers separately, expose them one one of the host's network interfaces, and use that interface's IP to allow them to find each other.
* You can add both NIW and the proxy to a common bridge network. You can reach the NIW host from the proxy config using its declared hostname (`niw` in the examples above).
* The bridge network can be a standalone network created separately with `docker network create` and referenced as an `external` network by both containers.
* The bridge network can also be an explicit ad-hoc bridge network created and torn down by compose as needed, if both containers are declared in the same compose file.
* If you simply declare both containers in the same compose file without specifying a network, they will use the implicit default Docker network. It will work, but please note that the implicit default is considered obsolete and has [some quirks and limitations](https://docs.docker.com/engine/network/drivers/bridge/#use-the-default-bridge-network) compared to explicitly declared networks.
* You can do a "sidecar" NIW container by declaring both containers in the same compose file and using `network_mode: service:proxy` for NIW (use the actual service name of your proxy container). This will put NIW on the same network stack as the proxy, and you can bind NIW to 127.0.0.1 and it will only be privately accessible to the proxy container alone. Please watch out for port conflicts in case the proxy also uses `127.0.0.01:3000` for anything.

> ⚠️ All these methods make you unable to directly access NIW from your LAN. You will have to proxy it through the reverse proxy if you want to be able to access its `/admin` pages. But this is a good idea anyway because you can transparently add TLS and basic auth this way.

#### 5.2.3. Pull and backup the pre-built Docker image

You can find pre-built Docker images for this project on the GitHub Container Repository:  
https://github.com/users/zuavra/packages/container/package/nginx-ip-whitelister

The `latest` tag always points at the newest released version. There are also semantic tags pointing at specific full versions (eg. `1.2.3`), at the latest version with a specific minor version (eg. `1.2` -> `1.2.7`), and at the latest version with a specific major version (eg. `1` -> `1.2.7`).

The example compose file provided with the source code refers to the `latest` pre-built image, for your convenience.

However, you can also pull any ready-made image manually, to use in Docker configurations you've written yourself, or as a layer for other Docker images, or simply when you wish to update to the latest version of the app.

To do that, run:  
`docker pull ghcr.io/zuavra/nginx-ip-whitelister:latest`

> ℹ️ After pulling the latest image please remember that you also have to stop, remove, and then rebuild or re-provision any Docker containers based on it.

#### 5.2.4. Build a Docker image yourself

If you'd like to build a local Docker image yourself, for example if you've modified the source code, you can use the `Dockerfile` and `.dockerignore` included in the package and run the following command from the project root:

```
$ docker build --tag zuavra/nginx-ip-whitelister .
```

Yes, there's a dot at the end of the command.

This will build the image and publish it to your machine's local image repository, where it's now ready for being used by Docker containers.

> ℹ️ Please remember to change your `.yaml` files or `docker run` commands to use the name of the local image (`zuavra/nginx-ip-whitelister:latest`) rather than the GHCR pre-built image (`ghcr.io/zuavra/nginx-ip-whitelister:latest`). You will also have to stop,remove and remake containers in order to use the new image.

## 6. How to configure the reverse proxy 

### 6.1. Nginx / Nginx Proxy Manager

In order to use NIW with Nginx you need to use the `auth_request` and `proxy_pass` directives.

Nginx needs to have been built with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html). Check the output of `nginx -V` for the built-in module names.

The `auth_request` directive is pretty flexible and can be used in `http`, `server` or `location` contexts.

> ℹ️ If you're using Nginx Proxy Manager, edit the proxy host and add the configuration in the "Advanced" tab.

#### 6.1.1. Basic Nginx config

This is a very basic example that only blocks requests without the correct key.

```
auth_request /__auth;
location = /__auth {
  internal;
  proxy_pass_request_body off;
  proxy_set_header Content-Length "";
  proxy_set_header X-Original-URI $request_uri;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_pass http://niw:3000/verify;
  proxy_set_header x-nipw-key "AVeryLongStringToBeUsedAsSecretKey";
}
```

> ℹ️ Please replace `niw:3000` with the appropriate hostname/IP and port.

#### 6.1.2. Advanced Nginx config

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

  # Note the "jellyfin" parameter, it makes NIW use a separate
  # IP whitelist called "jellyfin" instead of the default whitelist
  proxy_pass http://niw:3000/verify?jellyfin; 

  # specific access settings; see the next section for all possible headers
  proxy_set_header x-nipw-key-isolation "disabled";
  proxy_set_header x-nipw-fixed-timeout "3h";
  proxy_set_header x-nipw-sliding-timeout "30m";
  proxy_set_header x-nipw-geoip-allow "DE";
  proxy_set_header x-nipw-key "AVeryLongStringToBeUsedAsSecretKey";
  proxy_set_header x-nipw-key "AnotherLongStringToBeUsedAsSecretKey";
}

```

### 6.2. Caddy

To use NIW with Caddy you have to use the [`forward_auth`](https://caddyserver.com/docs/caddyfile/directives/forward_auth) directive. Support for this directive is typically included out of the box with most Caddy installs.

#### 6.2.1. Basic Caddy config

This is a very basic example that only blocks requests without the correct key.

```
forward_auth http://niw:3000 {
  uri /verify

  method GET # so that body is not consumed
  header_up X-Forwarded-For {http.request.remote.host}
  header_up Content-Length ""
  header_up X-Original-URI {http.request.uri}

  header_up +x-nipw-key AVeryLongStringToBeUsedAsSecretKey
}
```

#### 6.2.2. Advanced Caddy config

This is a more advanced example that shows you how to use some access headers to set up custom access conditions. These aren't all the possible headers, see the next section for a full list.

```
forward_auth http://niw:3000 {
  # note the extra "?jellyfin" that makes NIW use a separate
  # whitelist called "jellyfin" instead of the default one
  uri /verify?jellyfin

  method GET # so that body is not consumed
  header_up X-Forwarded-For {http.request.remote.host}
  header_up Content-Length ""
  header_up X-Original-URI {http.request.uri}

  header_up x-nipw-key-isolation "disabled"
  header_up x-nipw-fixed-timeout "3h"
  header_up x-nipw-sliding-timeout "3h"
  header_up x-nipw-geoip-allow "DE"
  header_up +x-nipw-key AVeryLongStringToBeUsedAsSecretKey
  header_up +x-nipw-key AnotherLongStringToBeUsedAsSecretKey
}
```

## 7. Validator documentation

### 7.1. Validator URLs

#### 7.1.1. Validation endpoints

Use `/verify` (typically from the reverse proxy config) to call the conditional validator. This validator endpoint is subject to the conditions that you specify using `x-nipw-*` headers in the config.

You can add an alphanumeric parameter to it (e.g. `/verify?ServiceName123`) to make it use a specific named whitelist. If the parameter is not provided it will use the default whitelist. This allows you to use different whitelists for different services.

Having separated whitelists per service:

* is crucial for separating the allowed IPs when using the same NIW instance for multiple proxy hosts;
* allows you to enforce key isolation separately for each service and reuse the same IP with different services even when key isolation is on;
* makes it possible to reset the access whitelist for only one service from the `/admin` interface without affecting other services.

> ⚠️ The whitelist name is case-sensitive! `Jellyfin` and `jellyfin` will go to different whitelists.

> 🚨 You are strongly advised to specify different whitelists for different proxy hosts if you reuse the same NIW instance. If you don't, an IP that is added to the whitelist using a key specified in the config for one host will be able to access any other host that uses the same NIW instance + whitelist combination, even if that IP did not provide any of the keys required by those other hosts.

#### 7.1.2. Test endpoints

You can use `/approve` to always unconditionally pass the check, and `/reject` to always unconditionally fail the check (for integration tests).

#### 7.1.3. Management endpoints

Use `/admin/whitelist` directly to see the current whitelist state. It provides links to `/admin/delete` that allow you to kick out individual addresses or wipe out a whitelist completely. Your own current IP is indicated in red if present.

![Admin overview](https://github.com/zuavra/nginx-ip-whitelister/blob/master/admin_overview.png?raw=true)

#### 7.1.4. Endpoint security

> 🚨 None of these endpoints are secured by default so do not expose them on the Internet without adding some form of protection (reverse proxy with basic authentication, IAM provider, VPN, SSH etc.)

Ideally, validation endpoints should only be exposed on an internal Docker network between the reverse proxy container and the validator container; and management endpoints only properly proxied or tunneled.

If you wrap management endpoints behind the reverse proxy you *can* use the validator to whitelist access to its own management endpoints but it will suffer from all the shortcomings of IP whitelisting.

### 7.2. Validator configuration

#### 7.2.1. Environment variables

The following variables can be added to the app environment. You can defined them in an `.env` file placed near `index.js` if you're running a standalone app, or provide them in the compose file, or as parameters to `docker run` etc.

* `PORT`: defines the port that the validator listens on. *Defaults to `3000`.*
* `HOST`: defines the interface that the validator listens on. *Defaults to blank, which in most environments will attempt to bind to all IPv4 and IPv6 network interfaces.*
* `LOG_LEVEL`: sets the verbosity of the messages logged to standard and error output. Valid values: `debug|info|notice|warn|error|crit`.  *Defaults to `info`.*

#### 7.2.2. HTTP headers

You can specify `x-nipw-` headers in the reverse proxy config to determine NIW's behavior and what validation checks it performs.

> ℹ️ Headers are specific to each proxy host. A key or a setting specified in the config for `a.example.com` will not be valid for host `b.example.com`.  

> 🚨 The Node header handling (`headers`, `headersDistinct`) converts header names to lowercase and does NOT perform underscore-to-dash conversions. This mitigates the risk of HTTP header injections somewhat, but please check the reverse proxy's documentation to figure out if the client can still pass headers to the forward auth app. It's outside NIW's scope to deal with such issues in the proxy.

#### 7.2.3. Timeout headers

The following headers can optionally be passed to the validator from the reverse proxy config to adjust the timeout policy for the whitelist.

The header names are case insensitive. You can only use these headers once each – additional uses will be ignored.

The timeouts are **always** enforced, whether you use these headers or not. Using the headers merely allows you to adjust the intervals.

* `x-nipw-fixed-timeout`: A strictly positive integer, followed by the suffix `d`, `h`, `m` or `s` to indicate an amount of days, hours, minutes or seconds, respectively. The fixed timeout is compared against the moment when an IP was first added to the whitelist and it does not change. In other words, if you set a fixed timeout of `6h`, the IP will be de-listed 6 hours later, period. If you don't provide this header *the fixed timeout defaults to 2 hours*.
* `x-nipw-sliding-timeout`: Same format as the fixed timeout. The sliding timeout is compared against the most recent access from that IP, and if successful the last access is reset to now. In other words, if you set a sliding timeout of `30m`, the IP will not be de-listed unless there's no access for 30 straight minutes. If you don't provide this header *the sliding timeout defaults to 5 minutes*.

> ℹ️ Both timeout policies are enforced in parallel – each IP has a fixed time window from when it started *as well as* a condition to not be inactive for too long.

#### 7.2.4. Condition headers

The following headers can optionally be passed to the validator from the reverse proxy config to impose additional condition upon the requests.

The header names are case insensitive. Most of these headers can be used multiple times (exceptions are noted below).

> ⚠️ Avoid using use commas or semicolons inside header values, they can sometimes cause header values to split into separate ones. NIW uses a Node function (`headersDistinct`) that does not perform splits but the reverse proxy might.

> ⚠️ Please note that different reverse proxies may have different syntax for specifying multiple values for the same header name. For example in Nginx `proxy_set_header` will set multiple values if used multiple times, but in Caddy you need to use add a plus sign (`+`) in front of the header name with `header_up` otherwise it will overwrite the other values and only send one.

* `x-nipw-ip-exclude`: Format: single IP or an IP range in CIDR notation.
  - Multiple such headers can be provided.
  - Both IPv4 and IPv6 are supported.
  - An IP that matches any of these ranges will skip all other checks (key, geo, TOTP).
* `x-nipw-key`: Format: any string. Define an authentication key.
  - Multiple such headers can be provided.
  - If zero such headers have been provided, all key-related functionality **is turned off**.
* `x-nipw-key-isolation`: Either *"enabled" (default)* or "disabled" (case-insensitive).
  - This header is only processed once (duplicates are ignored).
  - When key isolation is enabled it prevents keys from being used by multiple IPs at the same time within the same whitelist; once an IP has been added to a whitelist the key it used can't be used again until the IP exits that particular whitelist.
* `x-nipw-geoip-allow`: Specify a [two-letter ISO-3166-2 country code](https://en.wikipedia.org/wiki/ISO_3166-2) to **allow**.
  - Multiple such headers can be provided.
  - An IP that doesn't match any allow countries will be rejected.
  - [Private IPs](https://en.wikipedia.org/wiki/Private_network) always pass this check.
* `x-nipw-geoip-deny`: Specify a [two-letter ISO-3166-2 country code](https://en.wikipedia.org/wiki/ISO_3166-2) to **deny**.
  - Multiple such headers can be provided.
  - An IP that matches any of the deny countries will be rejected.
  - These headers will be ignored if any `-geoip-allow` header is defined.
  - [Private IPs](https://en.wikipedia.org/wiki/Private_network) always pass this check.
* `x-nipw-totp`: Define a TOTP secret.
  - Multiple such headers can be provided.
  - If any `-totp` header is defined, the visitor will have to append a valid TOTP code matching one of the secrets to the URL key, separated by a colon. Examples: `/?accesskey:123456` (both key and TOTP are provided) or `/?:123456` (TOTP is provided but key isn't).
  - If none of the secrets have been matched the request will be rejected.

ℹ️ Please understand that GeoIP matching is far from perfect. This project uses a "lite" GeoIP database which is not super-accurate, but even the larger databases can make mistakes. Accept the fact that occasionally you will end up blocking (or allowing) an IP that shouldn't be.

### 7.3. Validation logic

The logic works in the following order:

* If NIW cannot be reached by the reverse proxy or returns any status code other than 200 (including 500 if it malfunctions), request is rejected.
* _If any legacy config headers `x-nipw-netmask-allow` or `x-nipw-netmask-deny` have been defined, regardless of their content, request is rejected. (In version 1.7.0 these headers were deprecated in favor of more powerful IP filters implemented in the reverse proxy or firewall. To be safe, this rejection will prevent access through NIW instances that haven't updated their config.)_
* If any exclusion IP range is defined and the IP matches any of them, request is approved.
* If any GeoIP-allow countries are defined and the IP is not private and doesn't match any of them, request is rejected.
* If any GeoIP-deny countries are defined and the IP is not private and matches any of them, request is rejected.
* If any TOTP secrets are defined and the visitor's URL TOTP code doesn't match any of them, request is rejected.
* If any keys have been defined:
  * If visitor key is "LOGOUT" their IP is removed from the whitelist, request is rejected.
  * If the IP is found in the whitelist and has not expired (subject to both sliding and fixed timeout), request is approved.
  * If the visitor's URL key doesn't match any of the defined keys, request is rejected.
  * If key isolation is in effect and the visitor's key was already used by another IP in the whitelist, request is rejected.
  * The IP is added to the whitelist, request is approved.
* If no keys have been defined, request is approved.

> ℹ️ The whitelist is stored in RAM and will be lost every time you stop or restart the app (or its container).

> ⚠️ Remember that whitelists with the same name (or the default whitelist if you don't specify one) are shared across multiple proxy hosts if they call the same NIW instance. It's best to use a different whitelist name for each proxy host to avoid unintended behavior.

## 8. Credits

This project uses [IP Geolocation by DB-IP](https://db-ip.com). Please note that the `dbip-country-lite.mmdb` file is licensed under [Creative Commons Attribution 4.0 International](http://creativecommons.org/licenses/by/4.0/).
