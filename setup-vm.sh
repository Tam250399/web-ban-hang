#!/usr/bin/env bash
# Chạy script này TRÊN VM Ubuntu Server (sau khi đã cài xong hệ điều hành trên Proxmox),
# với quyền sudo. Mục đích: cài Docker + Docker Compose, clone code, chuẩn bị chạy dự án.
#
# Cách dùng:
#   chmod +x setup-vm.sh
#   ./setup-vm.sh

set -euo pipefail

REPO_URL="https://github.com/Tam250399/web-ban-hang.git"
APP_DIR="$HOME/web-ban-hang"

echo ">>> Cập nhật hệ thống..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo ">>> Cài các gói cần thiết..."
sudo apt-get install -y ca-certificates curl gnupg git ufw

echo ">>> Cài Docker Engine + Docker Compose plugin..."
if ! command -v docker &>/dev/null; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  sudo usermod -aG docker "$USER"
  echo "Đã thêm user vào nhóm docker — cần đăng xuất/đăng nhập lại (hoặc chạy 'newgrp docker') để không phải gõ sudo mỗi lần."
fi

echo ">>> Mở firewall cho SSH và web (đổi cổng nếu bạn dùng cổng khác)..."
sudo ufw allow OpenSSH
sudo ufw allow 8080/tcp   # web
sudo ufw --force enable

echo ">>> Clone / cập nhật mã nguồn dự án..."
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo "!!! Đã tạo file .env từ .env.example — MỞ FILE NÀY VÀ ĐIỀN MẬT KHẨU THẬT"
  echo "    trước khi chạy 'docker compose up -d':"
  echo "    nano $APP_DIR/.env"
  echo
else
  echo "File .env đã tồn tại, giữ nguyên."
fi

echo ">>> Xong phần cài đặt hạ tầng."
echo "Bước tiếp theo:"
echo "  1. nano $APP_DIR/.env        # điền mật khẩu Postgres/MinIO/JWT/Admin"
echo "  2. cd $APP_DIR && docker compose up -d --build"
echo "  3. docker compose ps         # kiểm tra các container đã chạy"
echo "  4. Truy cập http://<IP-VM>:8080"
