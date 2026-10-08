FROM node:22-slim AS builder

WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-slim AS production

ARG TARGETARCH
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl ca-certificates && \
    if [ "$TARGETARCH" = "arm64" ]; then \
        curl -fSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64" -o /usr/local/bin/yt-dlp; \
    else \
        curl -fSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o /usr/local/bin/yt-dlp; \
    fi && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/dist ./dist

RUN npm prune --production

USER node

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]