FROM --platform=$BUILDPLATFORM node:lts-alpine as base
WORKDIR /app
COPY package.json /
EXPOSE 3000

FROM base as production
ENV NODE_ENV=production
RUN npm i -g husky
COPY . /app
RUN npm install --production
CMD npm run start

FROM base as dev
ENV NODE_ENV=development
COPY . /app
RUN npm install
CMD npm run start
