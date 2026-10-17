# The audit opens a real browser for every run, so the image carries Chromium
# and its system libraries. Only Chromium is installed — Firefox and WebKit
# would triple the image for browsers nothing here uses.
#
# Built and run as:
#   docker build -t zaudit .
#   docker run -p 3000:3000 zaudit

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# The browser version has to match the playwright-core in package.json, or
# playwright-core will look for a build that is not there.
RUN npx --yes playwright@1.62.1 install --with-deps chromium \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./

# Chromium writes its shared memory to /dev/shm, which is small in most
# containers; the browser is already launched with --disable-dev-shm-usage.
EXPOSE 3000
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
