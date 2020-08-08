FROM node:12-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app/
WORKDIR /usr/src/app/
RUN npm install

ENV HOST 0.0.0.0
EXPOSE 3000

CMD npm run start
