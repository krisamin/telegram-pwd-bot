FROM oven/bun:1.3.14-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src ./src

ENV NODE_ENV=production
USER bun

CMD ["bun", "run", "src/index.ts"]
