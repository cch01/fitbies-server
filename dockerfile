FROM node:14.4

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

EXPOSE 3000 3001

CMD ["sh", "-c", "npx migrate-mongo up && yarn start"]


