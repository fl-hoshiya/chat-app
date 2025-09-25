# 🚀 SSE Chat App - セットアップガイド

## 📋 概要

PostgreSQL + Docker Composeを使用したSSEチャットアプリケーションです。

## 🔧 必要な環境

- Docker & Docker Compose
- Node.js 16+ (ローカル開発時)

## ⚡ クイックスタート

### 1. Docker Composeで起動

```bash
# リポジトリをクローン
git clone <repository-url>
cd chat-app

# PostgreSQL + アプリケーションを起動
npm run docker:up

# ログを確認
npm run docker:logs

# ブラウザでアクセス
open http://localhost:8000
```

### 2. 停止・クリーンアップ

```bash
# サービス停止
npm run docker:down

# データも含めて完全削除
npm run docker:clean
```

## 📁 プロジェクト構成

```
chat-app/
├── server.js              # メインサーバー（PostgreSQL対応）
├── database.js            # PostgreSQL接続クラス
├── docker-compose.yml     # Docker Compose設定
├── Dockerfile             # アプリケーションコンテナ
├── init.sql              # PostgreSQL初期化スクリプト
├── public/               # 静的ファイル（HTML, CSS, JS）
├── tests/                # テストファイル
└── package.json          # 依存関係とスクリプト
```

## 🐳 Docker コマンド

| コマンド | 説明 |
|----------|------|
| `npm run docker:up` | サービス起動 |
| `npm run docker:down` | サービス停止 |
| `npm run docker:logs` | ログ表示 |
| `npm run docker:build` | コンテナ再ビルド |
| `npm run docker:restart` | アプリ再起動 |
| `npm run docker:clean` | 完全クリーンアップ |

## 🗄️ データベース

### 接続情報
- **Host**: localhost
- **Port**: 5432
- **Database**: sse_chat_db
- **User**: chat_user
- **Password**: chat_password

### 直接接続
```bash
# PostgreSQLコンテナに接続
docker exec -it sse-chat-postgres psql -U chat_user -d sse_chat_db

# テーブル確認
\dt

# メッセージ確認
SELECT * FROM messages ORDER BY timestamp DESC LIMIT 10;
```

## 🧪 テスト

```bash
# 基本テスト
npm test

# PostgreSQLテスト（Docker起動後）
npm run test:postgresql
```

## 🚀 デプロイ

### Railway
1. GitHubリポジトリをRailwayに接続
2. PostgreSQLサービスを追加
3. 自動デプロイ

### その他のプラットフォーム
- Heroku
- Render
- Vercel

## 🔧 トラブルシューティング

### ポート競合
```bash
# ポート使用状況確認
lsof -i :8000
lsof -i :5432

# 既存プロセス終了
docker-compose down
```

### データベース接続エラー
```bash
# PostgreSQLコンテナ状態確認
docker-compose ps

# ヘルスチェック確認
docker-compose logs postgres
```

### コンテナ再ビルド
```bash
# キャッシュクリアして再ビルド
npm run docker:clean
npm run docker:build
npm run docker:up
```

## 📝 開発

### ローカル開発（Docker使用）
```bash
# 開発モードで起動（ファイル変更を監視）
npm run docker:up

# ログを監視
npm run docker:logs
```

### ローカル開発（Docker未使用）
```bash
# PostgreSQLを別途起動してから
npm install
npm start
```

## ✅ 動作確認

### ヘルスチェック
```bash
curl http://localhost:8000/health
```

### メッセージ送信テスト
```bash
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d '{"username":"テストユーザー","message":"Hello World!"}'
```

## 🎯 主な機能

- ✅ リアルタイムメッセージング（SSE）
- ✅ PostgreSQL永続化ストレージ
- ✅ XSS攻撃防止
- ✅ 入力値検証
- ✅ 日本語完全対応
- ✅ レスポンシブデザイン
- ✅ Docker Compose対応
- ✅ Railway デプロイ対応