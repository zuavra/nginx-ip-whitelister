FROM node:26 AS build
WORKDIR /opt/niw
COPY . .
RUN npm ci --omit=dev

FROM gcr.io/distroless/nodejs26-debian13
COPY --from=build /opt/niw /opt/niw
WORKDIR /opt/niw
CMD ["index.js"]
