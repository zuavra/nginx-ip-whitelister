# nginx-ip-whitelister

This is a companion app that serves as a backend for an [Nginx](https://nginx.org/en/) install configured as a reverse proxy and compiled with the [`ngx_http_auth_request_module`](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html). It validates Nginx requests by maintaining an in-memory whitelist of IP addresses. In order for an IP to be added to the whitelist a key must be presented in a query string. Once whitelisted, each IP will be valid for a configurable amount of time.

This app was designed to be particularly easy to integrate with [Nginx Proxy Manager](/NginxProxyManager/nginx-proxy-manager/) running in Docker.

## Use cases

Say you're visiting a friend or family's home and using their WiFi. You have an Emby or Jellyfin install at your home and you'd like to use it to see a movie together. There are numerous methods of exposing Emby/Jellyfin over the Internet securely, best of which is some kind of encrypted tunnel (a VPN such as Tailscale/Wireguard/OpenVPN, a SSH tunnel etc.) While that allows one device to reach Emby/Jellyfin, it doesn't allow you to cast to a Chromecast or DLNA device in your friend's LAN, because only your device has access to the tunnel.

There are of course solutions for that too, but they are all complicated and go beyond what you'd be able to do on the fly at a friend's home (such as adding VPN support to their router – assuming it supports it, or adding your own access point with access to the tunnel etc.)

The `nginx-ip-whitelister` assumes your Emby/Jellyfin are running behind a publicly-accessible Nginx reverse proxy and takes advantage of the `auth_request` directive to grant access to the public IP you're currently using, effectively allowing everthing in the LAN (**and also allowing whomever might be spoofing that IP or can otherwise get their hands on it**).

## Prerequisites

In order to use nginx-ip-whitelister you must have already accomplished the following:

* The host that runs Emby/Jellyfin has a public IP (your ISP allocates one for your home router, or you're using a VPS etc.)
* You have a [sub]domain A record pointing at that public IP (and you use DDNS to keep it in sync if it's dynamic etc.)
* You forward a port to an Nginx install acting as reverse proxy and forwarding to Emby/Jellyfin.
* You have configured SSL in Nginx for your domain (**highly recommended**).
* Bottom line, if you connect to `https://your.domain[:PORT]/` you can see your Emby/Jellyfin.

I recommend using Nginx Proxy Manager because it makes most of the above a lot easier.

At this point you can deploy nginx-ip-whitelister and add a simple configuration snippet to Nginx that will cause all HTTP requests to Emby/Jellyfin to run against the validator.

## How the validator works:

Nginx calls `http://validator.address/verify` for each HTTP request coming through the reverse proxy, *before* it reaches Emby/Jellyfin, and passes the original Emby/Jellyfin URI and the visitor's remote IP address.

The validator uses this information to respond 200 (let it through) or 403 (block it) as follows:
  * Looks up the IP in the in-memory store (a simple JavaScript `Map`), checks that the entry exists and hasn't expired, and if so it allows it.
  * Checks whether the request URI contains `?YOUR-KEY` as the query string. You can bookmark `https://your.domain[:PORT]/?YOUR-KEY` in your phone browser to achieve this. When such a request arrives, the validator adds the IP to the whitelist with a configurable expiration time and allows the request.
  * If neither of the above was true it rejects the requst.

**Remember** that the whitelist is stored in RAM and will be lost every time you stop or restart the app (or its container)..

## Security considerations

Using the IP as the sole means of verifying requests is **not secure**. You run this at your own risk and I assume you understand the implications.

In case you're still foolish enough to use this:

* Enable SSL on the reverse proxy.
* Enable Basic Authentication on the reverse proxy as an additional layer of protection, and use a long username and password.
* Use a long key for the validator.
* Don't share the bookmark with the key with friends and family. There's no safe way to secure against that bookmark making its way into the world hopping from friend to friend.

**If you suspect trouble:**
  * Stop the validator app. This will cut all access instantly, because Nginx will refuse requests if it cannot reach the validator backend.
  * Change the key and restart the app/container.

## Run it as a standalone app

Copy `.env.example` to `.env` and edit to your liking. Then:

```
$ npm install --omit-dev
$ node index.js
```

## Build a Docker image

```
docker build --tag zuavra/nginx-ip-whitelister .
```

## Run a standalone Docker container

You can run a Docker container that listens on the host's network interface. Use this if your Nginx or Nginx Proxy Manager are able to communicate directly with the host network.

`docker-compose.yaml`:

```
version: '3.5'
services:
  nginx-iw:
    image: zuavra/nginx-ip-whitelister:latest
    container_name: nginx-iw
    user: 1000:1000
    environment:
      - PORT=3000
      - HOST=0.0.0.0
      - VALIDITY_MS=10800000
      - KEY=CHANGE-ME
      - DEBUG=yes
    ports:
        - "3000:3000/tcp"
    restart: 'always'
```

You can of course also rely on `.env` if you place this in the same dir, omit the `environment:` section and define the port as `- "${PORT}:${PORT}/tcp"`.

## Run as a companion container to Nginx Proxy Manager

If you're already running Nginx Proxy Manager as a Docker container you will first need to define a network common to both containers:

```
docker network create nginx-network
```

Then you need to tell each container to use the network by adding this to each of their `docker-compose.yaml`:

```
    networks:
      - nginx-network
```

And the network definition at the end:

```
networks:
  nginx-network:
    external:
      name: nginx-network
```

It also helps if you name the nginx-ip-whitelister hostname, so its can be easily referenced by at runtime, and mark the other container as a dependency:

```
    hostname: nginx-iw
    depends_on:
      - nginx-pm
```

You can define each `docker-container.yaml` separately or you can add the definition for the nginx-ip-whitelister to the one for Nginx Proxy Manager (or Nginx).

Here's an example that combines the two in a single file. This will still create two distinct containers but it will run them together.

```
version: '3.8'
services:
  nginx-pm:
    image: 'jc21/nginx-proxy-manager:latest'
    container_name: nginx-pm
    hostname: nginx-pm
    ports:
      - '81:81' # Admin Web Port
      - '80:80' # Public HTTP Port
      - '443:443' # Public HTTPS Port
      # Add any other Stream port you want to expose
      # - '21:21' # FTP
    environment:
      UID: "1000"
      GID: "1000"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - nginx-network
    restart: always

  nging-iw:
    image: zuavra/nginx-ip-whitelister:latest
    container_name: nginx-iw
    depends_on:
      - nginx-pm
    hostname: nginx-iw
    user: 1000:1000
    environment:
      - PORT=3000
      - HOST=0.0.0.0
      - VALIDITY_MS=10800000
      - KEY=CHANGE-ME
      - DEBUG=yes
    ports:
        - "3000:3000/tcp"
    networks:
      - nginx-network
    restart: 'always'

networks:
  nginx-network:
    external:
      name: nginx-network
```

## How to integrate with Nginx

In order to tell Nginx to use nginx-ip-whitelister to validate requests you need to use the `auth_request` directive to validate requests against the correct verification URL, and pass the original URI and remote IP address. This can be done in the http, server or location contexts. Please see the example below.

If you're using Nginx Proxy Manager edit the proxy host and add the example configuration in the "Advanced" tab.

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
