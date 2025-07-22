# AWS デプロイ手順

## 前提条件

1. AWS CLIがインストールされている
2. AWS認証情報が設定されている
3. Dockerがインストールされている

## 1. 環境変数の設定

```bash
export AWS_ACCOUNT_ID="your-aws-account-id"
export AWS_REGION="ap-northeast-1"
export ECR_REPOSITORY="rekit-backend"
export IMAGE_TAG="latest"
```

## 2. ECRリポジトリの作成

```bash
aws ecr create-repository \
    --repository-name $ECR_REPOSITORY \
    --region $AWS_REGION
```

## 3. イメージのビルドとプッシュ

```bash
# ビルドのみ
./build.sh

# ビルドしてECRにプッシュ
./build.sh --push
```

## 4. AWSでのデプロイ方法

### 方法1: ECS Fargate

1. ECSクラスターを作成
2. タスク定義を作成（`aws-deploy.yml`を参考）
3. サービスを作成

### 方法2: EC2

```bash
# EC2インスタンスでDockerを実行
docker run -d \
  --name rekit-backend \
  -p 8000:8000 \
  -v /data:/root/data \
  -e DB_PATH=/root/data/calendar.db \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG
```

### 方法3: App Runner

1. AWS App Runnerコンソールで新しいサービスを作成
2. ECRイメージを選択
3. ポート8000を設定

## 5. データベースの永続化

- EBSボリュームを使用
- RDS SQLite（推奨）
- S3 + DynamoDB（スケーラブルな選択肢）

## 6. セキュリティ設定

- セキュリティグループでポート8000を制限
- IAMロールの適切な設定
- VPC内での実行を推奨

## 7. 監視とログ

- CloudWatch Logsの設定
- CloudWatch Metricsの設定
- アラームの設定

## トラブルシューティング

### よくある問題

1. **CGOエラー**: Alpine LinuxでSQLiteを使用する場合、CGO_ENABLED=1が必要
2. **権限エラー**: ECRへのプッシュ権限を確認
3. **ポートエラー**: セキュリティグループでポート8000を開放

### ログの確認

```bash
# ECSの場合
aws logs describe-log-groups --log-group-name-prefix /ecs/rekit

# EC2の場合
docker logs rekit-backend
``` 