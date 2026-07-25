# Base image ships Chromium + all OS-level dependencies Playwright needs.
# The tag's version MUST match the "playwright" version pinned in package.json
# exactly (Playwright requires the npm package and browser build to match) —
# currently 1.62.0.
FROM mcr.microsoft.com/playwright:v1.62.0-jammy

WORKDIR /app

# The base image already has a matching Chromium install at Playwright's
# default cache location, so skip re-downloading it during npm ci.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
