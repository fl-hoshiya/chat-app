# SSE チャットアプリケーション

## プロジェクト概要

このプロジェクトは、Node.js + Express + Server-Sent Events（SSE）を使用したシンプルなリアルタイムチャットアプリケーションです。学習目的で作成されており、複数のユーザーが同時にメッセージを送受信できる基本的なチャット機能を提供します。

WebSocketではなくSSE（Server-Sent Events）を使用することで、シンプルな実装でリアルタイム通信を実現しています。メッセージはメモリ内に保存され、アプリケーション再起動時にはクリアされます。

## 主な機能

- ✅ リアルタイムメッセージ送受信
- ✅ 複数ユーザーの同時接続サポート
- ✅ ユーザー名設定機能
- ✅ XSS攻撃対策（HTMLエスケープ処理）
- ✅ レスポンシブデザイン
- ✅ シンプルでクリーンなUI

## 使用技術スタック

### バックエンド
- **Node.js** (v14.0.0以上) - サーバーサイドJavaScript実行環境
- **Express.js** (v4.18.2) - 軽量なWebアプリケーションフレームワーク
- **UUID** (v9.0.0) - ユニークIDの生成

### フロントエンド
- **HTML5** - セマンティックなマークアップ
- **CSS3** - レスポンシブデザインとモダンスタイリング
- **Vanilla JavaScript** - フレームワークを使わないピュアなJavaScript

### リアルタイム通信
- **Server-Sent Events (SSE)** - サーバーからクライアントへの一方向リアルタイム通信
- **EventSource API** - ブラウザ標準のSSEクライアント

### 開発・テスト
- **Jest** (v29.7.0) - JavaScriptテストフレームワーク
- **Supertest** (v6.3.3) - HTTPアサーションライブラリ
- **JSDOM** (v23.0.1) - DOM操作のテスト環境

## 環境構築手順

### 1. Node.jsのインストール

#### Windows
1. [Node.js公式サイト](https://nodejs.org/)から最新のLTS版をダウンロード
2. インストーラーを実行してセットアップを完了
3. コマンドプロンプトまたはPowerShellで確認：
```bash
node --version
npm --version
```

#### macOS
```bash
# Homebrewを使用する場合
brew install node

# または公式サイトからインストーラーをダウンロード
```

#### Linux (Ubuntu/Debian)
```bash
# NodeSourceリポジトリを使用
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# または
sudo apt update
sudo apt install nodejs npm
```

### 2. プロジェクトのセットアップ

```bash
# プロジェクトディレクトリに移動
cd chat-app

# 依存関係のインストール
npm install

# 開発環境での起動
npm run dev

# または本番環境での起動
npm start
```

### 3. 動作確認

1. ブラウザで `http://localhost:8000` にアクセス
2. ユーザー名を入力
3. メッセージを送信してチャット機能を確認
4. 複数のブラウザタブまたはウィンドウで同時接続をテスト

## 依存関係の詳細

### 本番依存関係 (dependencies)
```json
{
  "express": "^4.18.2",  // Webサーバーフレームワーク
  "uuid": "^9.0.0"       // ユニークID生成ライブラリ
}
```

### 開発依存関係 (devDependencies)
```json
{
  "jest": "^29.7.0",           // テストフレームワーク
  "supertest": "^6.3.3",      // HTTPテスト用ライブラリ
  "@jest/globals": "^29.7.0",  // Jestグローバル関数
  "jsdom": "^23.0.1",          // DOM環境シミュレーション
  "eventsource": "^2.0.2"     // SSEクライアント（テスト用）
}
```

## 開発環境の起動方法

### 基本的な起動
```bash
# 開発モードで起動（nodemonなし）
npm run dev

# 本番モードで起動
npm start
```

### テストの実行
```bash
# 全テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch

# カバレッジレポート付きでテスト実行
npm run test:coverage
```

### ポート設定
デフォルトでは8000番ポートで起動しますが、環境変数で変更可能です：

```bash
# Windowsの場合
set PORT=3000 && npm start

# macOS/Linuxの場合
PORT=3000 npm start
```

## プロジェクト構造

```
chat-app/
├── server.js              # メインサーバーファイル
├── package.json           # プロジェクト設定と依存関係
├── package-lock.json      # 依存関係のロックファイル
├── .gitignore            # Git除外設定
├── README.md             # このファイル
├── public/               # 静的ファイル
│   ├── index.html        # メインHTMLファイル
│   ├── style.css         # スタイルシート
│   └── script.js         # クライアントサイドJavaScript
├── tests/                # テストファイル
│   ├── server.test.js    # サーバーサイドテスト
│   ├── client.test.js    # クライアントサイドテスト
│   ├── integration.test.js # 統合テスト
│   └── README.md         # テスト説明
└── coverage/             # テストカバレッジレポート
    └── ...
```

## 要件の実装状況

このアプリケーションは以下の要件を満たしています：

### ✅ 要件1: メッセージ送信機能
- ユーザー名とメッセージの送信
- 空メッセージの送信防止
- 送信後の入力欄クリア
- XSS攻撃防止のためのHTMLエスケープ処理

### ✅ 要件2: リアルタイムメッセージ受信機能
- SSEを使用したリアルタイム配信
- メッセージ一覧の自動更新
- 複数ユーザーへの同時配信

### ✅ 要件3: ユーザーインターフェース
- 直感的なチャットインターフェース
- レスポンシブデザイン対応
- シンプルでクリーンなデザイン
- ユーザー名設定機能

### ✅ 要件4: システム運用
- ポート8000での起動
- 複数ユーザーの同時接続サポート
- 適切なエラーハンドリング
- メモリ内メッセージ保存

### ✅ 要件5: セキュリティ
- XSS攻撃対策
- HTMLタグのエスケープ処理

### ✅ 要件6: 技術仕様
- Node.js + Express使用
- HTML + CSS + Vanilla JavaScript
- Server-Sent Events実装
- メモリ内データ保存
## 
トラブルシューティング

### よくある問題と解決方法

#### 1. ポートが既に使用されている
```
Error: listen EADDRINUSE :::8000
```
**解決方法:**
```bash
# 別のポートを使用
PORT=3000 npm start

# または使用中のプロセスを確認・終了
# Windows
netstat -ano | findstr :8000
taskkill /PID <プロセスID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

#### 2. Node.jsのバージョンが古い
```
Error: Node.js version not supported
```
**解決方法:**
- Node.js v14.0.0以上をインストール
- `node --version`でバージョンを確認

#### 3. 依存関係のインストールエラー
```
npm ERR! peer dep missing
```
**解決方法:**
```bash
# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 4. SSE接続が確立されない
- ブラウザの開発者ツールでネットワークタブを確認
- `/events`エンドポイントへの接続状況をチェック
- ファイアウォールやプロキシ設定を確認

## 技術詳細とアーキテクチャ

### Server-Sent Events (SSE) の動作原理

SSE は HTML5 で標準化されたリアルタイム通信技術で、サーバーからクライアントへの一方向通信を提供します。

#### SSE の特徴
- **シンプルな実装**: WebSocket より簡単に実装可能
- **自動再接続**: 接続が切れた場合の自動復旧機能
- **テキストベース**: HTTP プロトコル上で動作
- **ブラウザサポート**: 主要ブラウザで標準サポート

#### 通信フロー
```
1. クライアント → サーバー: GET /events (SSE接続要求)
2. サーバー → クライアント: text/event-stream レスポンス
3. クライアント → サーバー: POST /messages (メッセージ送信)
4. サーバー → 全クライアント: SSE イベント (メッセージ配信)
```

#### SSE イベントフォーマット
```
data: {"type":"message","id":"123","username":"user1","message":"Hello","timestamp":"2024-01-01T00:00:00.000Z"}

```

### システムアーキテクチャ

#### 全体構成図
```
┌─────────────────────────────────────────────────────────────┐
│                        ブラウザ                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   HTML      │  │    CSS      │  │    JavaScript       │  │
│  │             │  │             │  │                     │  │
│  │ • UI構造    │  │ • スタイル   │  │ • EventSource       │  │
│  │ • フォーム   │  │ • レスポンシブ│  │ • fetch API         │  │
│  │ • メッセージ │  │ • アニメーション│ │ • DOM操作           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express サーバー                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 静的ファイル │  │ SSE Manager │  │   API Routes        │  │
│  │             │  │             │  │                     │  │
│  │ • HTML配信  │  │ • 接続管理   │  │ • POST /messages    │  │
│  │ • CSS配信   │  │ • ブロードキャスト│ │ • GET /events       │  │
│  │ • JS配信    │  │ • クリーンアップ │ │ • エラーハンドリング │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      メモリストレージ                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │   メッセージ配列     │  │      SSE接続リスト          │   │
│  │                     │  │                             │   │
│  │ [{                  │  │ [Response, Response, ...]   │   │
│  │   id: "uuid",       │  │                             │   │
│  │   username: "user", │  │ • 接続中のクライアント       │   │
│  │   message: "text",  │  │ • レスポンスオブジェクト     │   │
│  │   timestamp: Date   │  │ • 自動クリーンアップ         │   │
│  │ }]                  │  │                             │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### コンポーネント詳細

**1. フロントエンド層**
- **HTML**: セマンティックなマークアップでアクセシビリティを確保
- **CSS**: Flexbox レイアウトとメディアクエリでレスポンシブ対応
- **JavaScript**: ES6+ 機能を使用したモダンな実装

**2. サーバー層**
- **Express.js**: 軽量で高性能なWebフレームワーク
- **SSE Manager**: 接続管理とメッセージ配信の中核機能
- **API Routes**: RESTful な API 設計

**3. データ層**
- **メモリストレージ**: 高速アクセスが可能な一時的データ保存
- **接続管理**: アクティブな SSE 接続の効率的な管理

### デザインガイドライン

#### カラーパレット
```css
/* プライマリカラー */
--primary-color: #007bff;      /* メインブルー */
--primary-hover: #0056b3;     /* ホバー時の濃いブルー */

/* セカンダリカラー */
--background-color: #f8f9fa;  /* 背景グレー */
--card-background: #ffffff;   /* カード背景白 */
--border-color: #dee2e6;      /* ボーダーグレー */

/* テキストカラー */
--text-primary: #212529;      /* メインテキスト */
--text-secondary: #6c757d;    /* セカンダリテキスト */
--text-muted: #868e96;        /* 薄いテキスト */

/* ステータスカラー */
--success-color: #28a745;     /* 成功 */
--warning-color: #ffc107;     /* 警告 */
--danger-color: #dc3545;      /* エラー */
```

#### タイポグラフィ
```css
/* フォントファミリー */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
             sans-serif;

/* フォントサイズ */
--font-size-sm: 0.875rem;     /* 14px */
--font-size-base: 1rem;       /* 16px */
--font-size-lg: 1.125rem;     /* 18px */
--font-size-xl: 1.25rem;      /* 20px */
```

#### レイアウト原則
- **モバイルファースト**: 小画面から大画面への段階的拡張
- **カード型デザイン**: 情報のグループ化と視覚的階層
- **最小限のシャドウ**: 奥行き感を演出する控えめな影
- **適切な余白**: コンテンツの可読性を高める空白の活用

### 実装上の注意点

#### セキュリティ対策

**1. XSS (Cross-Site Scripting) 対策**
```javascript
// サーバーサイド
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// クライアントサイド
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**2. 入力値検証**
```javascript
// メッセージ検証
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'メッセージが必要です' };
  }
  if (message.trim().length === 0) {
    return { valid: false, error: '空のメッセージは送信できません' };
  }
  if (message.length > 500) {
    return { valid: false, error: 'メッセージは500文字以内で入力してください' };
  }
  return { valid: true };
}
```

**3. レート制限**
```javascript
// 簡易的なレート制限実装例
const rateLimiter = new Map();

function checkRateLimit(clientId) {
  const now = Date.now();
  const clientData = rateLimiter.get(clientId) || { count: 0, resetTime: now + 60000 };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + 60000;
  }
  
  if (clientData.count >= 30) { // 1分間に30メッセージまで
    return false;
  }
  
  clientData.count++;
  rateLimiter.set(clientId, clientData);
  return true;
}
```

#### パフォーマンス最適化

**1. メモリ管理**
```javascript
// メッセージ履歴の上限設定
const MAX_MESSAGES = 100;

function addMessage(message) {
  messages.push(message);
  if (messages.length > MAX_MESSAGES) {
    messages.shift(); // 古いメッセージを削除
  }
}
```

**2. 接続管理**
```javascript
// 切断されたクライアントのクリーンアップ
function cleanupConnections() {
  clients = clients.filter(client => !client.destroyed);
}

// 定期的なクリーンアップ
setInterval(cleanupConnections, 30000); // 30秒ごと
```

**3. エラーハンドリング**
```javascript
// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
```

### 拡張可能性

#### 将来の機能拡張案
- **ユーザー認証**: JWT トークンベースの認証システム
- **ルーム機能**: 複数のチャットルームの作成と管理
- **ファイル共有**: 画像やドキュメントの送信機能
- **データベース連携**: MongoDB や PostgreSQL との統合
- **プッシュ通知**: Service Worker を使用した通知機能

#### スケーラビリティ対応
- **Redis**: セッション管理とメッセージキューイング
- **WebSocket**: より高度なリアルタイム機能
- **マイクロサービス**: 機能別のサービス分割
- **CDN**: 静的ファイルの配信最適化

## パフォーマンス情報

### システム要件
- **メモリ**: 最小128MB、推奨256MB以上
- **CPU**: 1コア以上
- **Node.js**: v14.0.0以上
- **ブラウザ**: Chrome 6+, Firefox 6+, Safari 5+, Edge 12+

### 制限事項
- **同時接続数**: 理論上無制限（実際はサーバーリソースに依存）
- **メッセージ履歴**: メモリ内保存のため再起動時にクリア
- **メッセージ長**: 最大500文字
- **ユーザー名**: 最大50文字

### 最適化のヒント
- 本番環境では適切なプロセスマネージャー（PM2など）を使用
- リバースプロキシ（Nginx）でSSL終端と負荷分散を実装
- メッセージ履歴の上限設定でメモリ使用量を制御

## 使用方法

### 基本的な使い方

1. **アプリケーションの起動**
   ```bash
   cd chat-app
   npm start
   ```

2. **ブラウザでアクセス**
   - ブラウザで `http://localhost:8000` を開く
   - 複数のタブやウィンドウで同じURLを開いて複数ユーザーをシミュレート

3. **チャット機能の使用**
   - **ユーザー名の設定**: 画面上部の「ユーザー名」欄に任意の名前を入力
   - **メッセージ送信**: 下部のメッセージ入力欄にテキストを入力し、「送信」ボタンをクリックまたはEnterキーを押す
   - **リアルタイム受信**: 他のユーザーからのメッセージが自動的に表示される
   - **メッセージ履歴**: 過去のメッセージが時系列で表示される

### 操作のヒント

- **キーボードショートカット**: メッセージ入力欄でEnterキーを押すと送信
- **空メッセージ**: 空のメッセージは送信できません
- **文字制限**: メッセージは最大500文字、ユーザー名は最大50文字
- **自動スクロール**: 新しいメッセージが届くと自動的に最下部にスクロール

## デプロイメント

### 本番環境への展開手順

#### 1. 環境変数の設定

本番環境では以下の環境変数を設定してください：

```bash
# 必須
PORT=8000                    # サーバーポート
NODE_ENV=production         # 実行環境

# オプション
HOST=0.0.0.0               # バインドアドレス
```

#### 2. プロセス管理

本番環境では PM2 などのプロセスマネージャーの使用を推奨します：

```bash
# PM2のインストール
npm install -g pm2

# アプリケーションの起動
pm2 start server.js --name "sse-chat-app"

# 自動起動の設定
pm2 startup
pm2 save
```

### 無料ホスティングサービスでのデプロイ

#### Render でのデプロイ

1. **リポジトリの準備**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Render での設定**
   - [Render](https://render.com) にアクセスしてアカウント作成
   - 「New Web Service」を選択
   - GitHubリポジトリを接続
   - 以下の設定を入力：
     - **Name**: `sse-chat-app`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment Variables**:
       - `NODE_ENV`: `production`

3. **デプロイの実行**
   - 「Create Web Service」をクリック
   - 自動的にビルドとデプロイが開始
   - 完了後、提供されるURLでアクセス可能

#### Railway でのデプロイ

1. **Railway CLI のインストール**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **プロジェクトの初期化**
   ```bash
   railway init
   railway link
   ```

3. **環境変数の設定**
   ```bash
   railway variables set NODE_ENV=production
   ```

4. **デプロイの実行**
   ```bash
   railway up
   ```

#### Heroku でのデプロイ

1. **Heroku CLI のインストール**
   - [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) をダウンロードしてインストール

2. **Heroku アプリの作成**
   ```bash
   heroku login
   heroku create your-chat-app-name
   ```

3. **環境変数の設定**
   ```bash
   heroku config:set NODE_ENV=production
   ```

4. **デプロイの実行**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

5. **アプリの起動**
   ```bash
   heroku open
   ```

### Docker でのデプロイ

#### Dockerfile の作成

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 8000

USER node

CMD ["npm", "start"]
```

#### Docker Compose の設定

```yaml
version: '3.8'
services:
  chat-app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

#### ビルドと実行

```bash
# イメージのビルド
docker build -t sse-chat-app .

# コンテナの実行
docker run -p 8000:8000 -e NODE_ENV=production sse-chat-app

# または Docker Compose を使用
docker-compose up -d
```

## リリース手順とバージョン管理

### セマンティックバージョニング

このプロジェクトは [Semantic Versioning](https://semver.org/) に従います：

- **MAJOR**: 互換性のない API 変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### リリースプロセス

1. **開発とテスト**
   ```bash
   # 機能開発
   git checkout -b feature/new-feature
   
   # テストの実行
   npm test
   npm run test:coverage
   ```

2. **バージョンアップ**
   ```bash
   # パッチバージョンアップ
   npm version patch
   
   # マイナーバージョンアップ
   npm version minor
   
   # メジャーバージョンアップ
   npm version major
   ```

3. **リリース**
   ```bash
   # タグの作成とプッシュ
   git push origin main --tags
   
   # GitHub Releases でリリースノートを作成
   ```

### ブランチ戦略

- **main**: 本番環境用の安定版
- **develop**: 開発用ブランチ
- **feature/***: 機能開発用ブランチ
- **hotfix/***: 緊急修正用ブランチ

### 継続的インテグレーション

GitHub Actions を使用した CI/CD パイプラインの例：

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - run: npm ci
    - run: npm test
    - run: npm run test:coverage
```

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 貢献

プルリクエストや課題報告を歓迎します。大きな変更を行う前に、まずissueを作成して変更内容について議論してください。

## 作者

学習プロジェクトとして作成されました。

## 更新履歴

### v1.0.0 (2024-12-XX)
- 初回リリース
- 基本的なチャット機能の実装
- SSEを使用したリアルタイム通信
- レスポンシブデザイン対応
- テストスイートの追加