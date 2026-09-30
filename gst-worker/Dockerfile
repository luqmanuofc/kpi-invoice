# Local-only deployment of gst-worker (see "Deployment update: Docker" in
# README.md). Base image ships Node + Chromium's system libraries.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /app
COPY package.json ./
# No lockfile, so ^1.63.0 may resolve to a newer Playwright than the base
# image; installing chromium afterwards keeps the browser build matched.
RUN npm install --omit=dev \
 && npx playwright install chromium \
 && chown -R pwuser:pwuser /app
COPY --chown=pwuser:pwuser *.mjs ./
# lookup.mjs imports ../scripts/gstin-lookup/stateNames.mjs, which lives
# outside this directory. Build with:
#   docker build --build-context gstin-lookup=../scripts/gstin-lookup -t gst-worker .
COPY --from=gstin-lookup stateNames.mjs /scripts/gstin-lookup/

USER pwuser
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.mjs"]
