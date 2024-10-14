FROM node:20 AS build
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

COPY . .
RUN yarn build

# final stage
FROM nginx:stable-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /build/public
COPY nginx-boot.sh /nginx-boot.sh

CMD ["/nginx-boot.sh"]
