# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build:prod

# ── Serve with Nginx ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built app
COPY --from=builder /app/dist/research-frontend/browser /usr/share/nginx/html

# Nginx config for Angular SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
