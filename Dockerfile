# syntax=docker/dockerfile:1

FROM alpine
ENV NODE_ENV=production
RUN apk add --update nodejs npm
WORKDIR /opt/nginx-iw
COPY . .
RUN npm install --omit=dev
CMD ["node", "index.js"]
