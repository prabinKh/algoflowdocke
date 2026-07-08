# ==========================================
# Stage 1: Build the frontend & server (Node environment)
# ==========================================
FROM node:22-slim AS frontend-builder
WORKDIR /app

RUN npm config set fetch-retry-maxtimeout 300000 && \
    npm install -g pnpm

# Copy only package files first
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (no cache mount to avoid issues)
RUN pnpm config set fetch-timeout 300000 && \
    pnpm install --no-frozen-lockfile --ignore-scripts

# 🔥 CRITICAL FIX: Remove node_modules before COPY to avoid conflicts
RUN rm -rf node_modules

# Now copy the rest of the application
COPY . .

# Reinstall dependencies (this will use the local package.json)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Build the application
RUN pnpm run build:prod

# Prune dev dependencies
RUN pnpm prune --prod


# ==========================================
# Stage 2: Final runtime image (Python environment)
# ==========================================
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=frontend-builder /usr/local/bin/node /usr/local/bin/
RUN mkdir -p /app/dist /app/node_modules /app/backend

COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/package.json ./
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY backend ./backend

RUN pip install --no-cache-dir --break-system-packages \
    --retries 10 \
    --timeout 120 \
    -r backend/requirements.txt gunicorn

# Bake admin static assets into the image (nginx + Node serve from this path)
ENV DJANGO_SECRET_KEY=build-time-collectstatic-key
RUN cd backend && python3 manage.py collectstatic --noinput

COPY entrypoint.sh ./
RUN sed -i '1s/^\xEF\xBB\xBF//' entrypoint.sh && \
    sed -i 's/\r$//' entrypoint.sh && \
    chmod +x entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHONUNBUFFERED=1

EXPOSE 3000
EXPOSE 8001

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]