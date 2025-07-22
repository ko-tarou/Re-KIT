#!/bin/bash

# エラー時に停止
set -e

echo "🚀 Re-KIT Backend Build Script for AWS"

# 環境変数の設定
export AWS_REGION=${AWS_REGION:-"ap-northeast-1"}
export ECR_REPOSITORY=${ECR_REPOSITORY:-"rekit-backend"}
export IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "📦 Building Docker image..."
echo "Region: $AWS_REGION"
echo "Repository: $ECR_REPOSITORY"
echo "Tag: $IMAGE_TAG"

# バックエンドディレクトリに移動
cd backend

# Dockerイメージのビルド
docker build -f Dockerfile.simple -t $ECR_REPOSITORY:$IMAGE_TAG .

echo "✅ Docker image built successfully!"

# AWS ECRにプッシュする場合のオプション
if [ "$1" = "--push" ]; then
    echo "📤 Pushing to AWS ECR..."
    
    # ECRログイン
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    
    # タグ付け
    docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
    
    # プッシュ
    docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
    
    echo "✅ Image pushed to ECR successfully!"
fi

echo "🎉 Build completed!" 