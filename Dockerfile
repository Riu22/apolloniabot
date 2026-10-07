FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:22-slim AS production

ARG TARGETARCH
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg wget && \
    if [ "$TARGETARCH" = "arm64" ]; then \
        wget -q -O /usr/local/bin/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64"; \
    else \
        wget -q -O /usr/local/bin/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"; \
    fi && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

USER node

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]