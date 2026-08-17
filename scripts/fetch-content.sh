#!/bin/bash
set -e

echo "📦 拉取私有笔记..."

PRIVATE_REPO="https://${GH_TOKEN}@github.com/yunyiss/blog-note.git"

# 清理旧内容
rm -rf src/content/posts
mkdir -p src/content/posts

# 克隆
git clone --depth 1 "$PRIVATE_REPO" .temp-private

# 移动 Live2D 模型
mv .temp-private/live2d/* public/pio/models/live2d/ 2>/dev/null || true
rm -rf .temp-private/live2d

# 把仓库根目录下的所有文件移到 posts/
mv .temp-private/* src/content/posts/ 2>/dev/null || true

rm -rf .temp-private

echo "✅ 笔记已同步"