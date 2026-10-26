FROM node:24-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53 AS build
WORKDIR /app
RUN apk add --no-cache unzip
COPY package.json package-lock.json ./
RUN npm ci
COPY astro.config.mjs tsconfig.json font-inputs.json ./
COPY scripts/acquire-fonts.mjs scripts/audit.mjs scripts/csp.mjs ./scripts/
COPY infra ./infra
COPY src ./src
COPY public ./public
RUN npm run fonts && npm run build && node scripts/csp.mjs
FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/artifacts/release/security-headers.conf /etc/nginx/security-headers.conf
COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
