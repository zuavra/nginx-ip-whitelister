FROM node:26 AS build
WORKDIR /opt/niw
COPY LICENSE index.js dbip-country-lite-2026-07.mmdb package.json package-lock.json ./
COPY lib ./lib
COPY middleware ./middleware
COPY resources ./resources
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs26-debian13
COPY --from=build /opt/niw /opt/niw
WORKDIR /opt/niw
CMD ["index.js"]
