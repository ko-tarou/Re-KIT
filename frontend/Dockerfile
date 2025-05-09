FROM oven/bun:1.2

WORKDIR /app

COPY package.json bun.lock ./

RUN rm -rf node_modules
RUN bun install

COPY . .

CMD ["bun", "run", "dev"]
