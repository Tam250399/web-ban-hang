# ── Giai đoạn build ──────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copy manifest trước để Docker cache được lớp cài đặt: chỉ đổi source thì
# không phải npm ci lại từ đầu.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Cấu hình lúc build (Vite nhúng thẳng vào bundle, không đọc được lúc chạy):
#   VITE_API_URL   — để trống nếu dùng nginx proxy cùng origin (khuyến nghị)
#   VITE_MEDIA_URL — /media nếu proxy MinIO qua nginx như nginx.conf.template
ARG VITE_API_URL=""
ARG VITE_MEDIA_URL="/media"
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MEDIA_URL=$VITE_MEDIA_URL

RUN npm run build

# ── Giai đoạn chạy ───────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Image nginx chính thức tự chạy envsubst trên mọi file trong templates/ lúc
# khởi động, nên BACKEND_URL / MINIO_URL đặt được ở thời điểm chạy container.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://host.docker.internal:5000
ENV MINIO_URL=http://minio:9000

EXPOSE 80
