# syntax=docker/dockerfile:1

FROM alpine
ENV NODE_ENV=production

WORKDIR /opt/nginx-iw

COPY . .

RUN apk add --update nodejs npm
RUN npm install --omit=dev

CMD ["node", "index.js"]
