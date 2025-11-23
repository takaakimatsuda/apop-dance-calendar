# APOP Dance Calendar 📅

全国のAPOPダンスイベント情報を一元管理・検索できるWebアプリケーション

🔗 **Live Demo**: [https://apop-dance.netlify.app](https://apop-dance.netlify.app)

## 📌 概要

APOP Dance Calendarは、APOPダンスイベント情報を効率的に管理・閲覧できるシングルページアプリケーションです。Googleスプレッドシートをデータソースとし、リアルタイムで最新情報を提供します。

## ✨ 主な機能

### 表示モード
- **リスト表示**: カード形式でイベントを一覧表示
- **カレンダー表示**: 月間カレンダーでイベントを視覚的に確認
- **月切り替え機能**: 前後1年分のイベントを月単位で閲覧可能

### フィルター機能
- **地域フィルター**: 北海道から九州まで地域別に絞り込み
- **都道府県フィルター**: 都道府県単位での検索
- **コンテンツ種別フィルター**: イベントのメインコンテンツで分類
- **オーガナイザーフィルター**: 主催者（ASHITAKA等）での絞り込み
- **キーワード検索**: イベント名、会場名での自由検索
- **過去イベント表示**: デフォルトでは非表示、チェックで表示切り替え

### その他の特徴
- **レスポンシブデザイン**: PC、タブレット、スマートフォンに完全対応
- **ダークテーマ**: 目に優しいダークモードUI
- **URL検証機能**: 無効なURLへの遷移を防止
- **リアルタイム更新**: Googleスプレッドシートの変更が即座に反映

### 自動配信機能

#### 週次イベントまとめ

**X（Twitter）自動投稿**
- **配信時刻**: 毎週金曜18:00 JST
- **配信内容**: 今後2週間のイベント情報をスレッド形式で投稿
- **投稿形式**: イベント件数に応じて可変数の投稿（各280文字以内、自動短縮対応）
- **認証方式**: OAuth 1.0a
- **使用API**: X API v2（Free Plan対応）

**メール自動送信**
- **配信時刻**: 毎週金曜9:00 JST
- **配信内容**: 今後1ヶ月のイベント情報
- **送信方式**: Gmail SMTP経由
- 📧 **[セットアップガイド](./EMAIL_SETUP.md)**

#### 毎日イベント投稿

**X（Twitter）自動投稿**
- **配信時刻**: 毎日12:00 JST
- **配信内容**: 今後2週間以内のイベントを1日1件ずつ個別紹介
- **投稿形式**: イベント詳細を含む単一投稿（280文字以内、自動短縮対応）
- **投稿管理**: GitHub Gistで投稿済みイベントを追跡、重複回避
- **再投稿**: すべてのイベントを投稿済みの場合、日程が近いものを再投稿

**特徴**
- **公平な配信**: 日付が近い順に未投稿イベントを自動選択
- **重複回避**: Gistで投稿履歴を永続管理
- **完全自動**: GitHub Actionsによる毎日自動実行

#### 自動配信の特徴
- **完全無料**: GitHub Actions + X API Free Plan / Gmail経由
- **自動実行**: GitHub Actionsによるスケジュール実行
- **手動実行**: GitHub Actionsから手動トリガーも可能

## 🏗️ 技術構成

### フロントエンド
- **HTML/CSS/JavaScript**: 単一ファイル構成（index.html）
- **フレームワーク不使用**: 純粋なVanilla JSで実装
- **レスポンシブ対応**: CSS Grid/Flexboxを活用

### バックエンド
- **Google Apps Script**: スプレッドシートデータをJSON APIとして配信
- **CORS対応**: 通常のJSON形式とJSONP形式の両方をサポート

### データソース
- **Googleスプレッドシート**: イベント情報の管理
- **自動日付処理**: 月/日のみの入力で年を自動判定

### ホスティング
- **Netlify**: メインホスティング（自動デプロイ設定済み）
- **GitHub Pages**: バックアップホスティング

### 自動化システム
- **GitHub Actions**: 週次イベント配信の自動実行
- **Node.js**: メール送信・X投稿スクリプト実行環境
- **twitter-api-v2**: X API v2クライアントライブラリ
- **nodemailer**: メール送信ライブラリ

## 📊 データ構造

### イベントデータ
```javascript
{
  id: "unique-id",            // イベント識別子（投稿管理に使用）
  date: "9/13(土)",           // 日時
  eventDate: "2025-09-13",    // ISO形式の日付
  name: "イベント名",
  prefecture: "東京",
  venue: "会場名",
  mainContent: "メインコンテンツ",
  subContent: "サブコンテンツ",
  status: "エントリー中",
  twitter: "https://...",      // イベントURL
  organizer: "ASHITAKA",       // 主催者
  region: "関東"              // 地域（自動判定）
}
```

## 🚀 セットアップ（自動配信）

### 週次イベントまとめのセットアップ

#### 1. X Developer Portalでアプリを作成
1. [X Developer Portal](https://developer.twitter.com/) にアクセス
2. アプリを作成（既存アプリがある場合はそれを使用）
3. **User authentication settings** を設定
   - App permissions: **Read and Write**
   - Type of App: **Web App**
   - Callback URI: 任意のURL（例：https://example.com）

#### 2. 認証情報を取得
1. **Keys and tokens** タブを開く
2. **Consumer Keys** をコピー
   - API Key → `X_CLIENT_ID`
   - API Key Secret → `X_CLIENT_SECRET`
3. **Access Token and Secret** を生成
   - Access Token → `X_ACCESS_TOKEN`
   - Access Token Secret → `X_ACCESS_TOKEN_SECRET`

#### 3. GitHub Secretsに登録
1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリックして、以下の4つを登録：
   - `X_CLIENT_ID`
   - `X_CLIENT_SECRET`
   - `X_ACCESS_TOKEN`
   - `X_ACCESS_TOKEN_SECRET`

#### 4. 動作確認
1. GitHubリポジトリの **Actions** タブを開く
2. **週次イベントX投稿** ワークフローを選択
3. **Run workflow** ボタンで手動実行
4. 実行ログを確認して成功を確認
5. Xアカウントに投稿されていることを確認

#### 5. 自動実行
設定完了後、毎週金曜18:00 JSTに自動でX投稿が実行されます。

### ローカルでのテスト実行

```bash
# 依存パッケージをインストール
npm install

# .envファイルを作成（.env.exampleを参考）
cp .env.example .env
# .envファイルに認証情報を記入

# X投稿テスト実行
npm run post:weekly
```

### 毎日イベント投稿のセットアップ

毎日投稿機能を利用するには、上記のX API認証情報に加えて、GitHub Gistによる投稿履歴管理が必要です。

#### 1. GitHub Personal Access Tokenの取得

1. GitHub設定ページ（[Personal Access Tokens](https://github.com/settings/tokens)）にアクセス
2. **Generate new token (classic)** をクリック
3. 以下のように設定：
   - **Note**: `APOP Dance Calendar - Gist Access`
   - **Expiration**: `No expiration` または任意の期限
   - **Select scopes**: `gist` にチェック
4. **Generate token** をクリック
5. 表示されたトークンをコピー（後で使用するので保存しておく）

#### 2. GitHub Gistの作成

1. [GitHub Gist](https://gist.github.com/) にアクセス
2. 以下のように設定：
   - **Gist description**: `APOP Dance Calendar - Posted Events`
   - **Filename**: `posted_events.json`
   - **Content**: `[]`（空の配列）
3. **Create public gist** または **Create secret gist** をクリック
4. 作成されたGistのURLから **Gist ID** を取得
   - URL例: `https://gist.github.com/username/1234567890abcdef1234567890abcdef`
   - Gist ID: `1234567890abcdef1234567890abcdef`（URLの最後の部分）

#### 3. GitHub Secretsに追加登録

週次投稿用の4つに加えて、以下の2つを追加登録：

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリックして登録：
   - `GITHUB_TOKEN`: 手順1で取得したPersonal Access Token
   - `GIST_ID`: 手順2で取得したGist ID

#### 4. 動作確認

1. GitHubリポジトリの **Actions** タブを開く
2. **毎日イベント投稿** ワークフローを選択
3. **Run workflow** ボタンで手動実行
4. 実行ログを確認して成功を確認
5. Xアカウントに投稿されていることを確認
6. Gistが更新されていることを確認（投稿済みイベントIDが記録される）

#### 5. 自動実行

設定完了後、毎日12:00 JSTに自動でX投稿が実行されます。

## 🔄 GitHub Actions ワークフロー一覧

| ワークフロー | 実行時刻（JST） | cron (UTC) | 説明 |
|------------|---------------|------------|------|
| Weekly Events Summary | 毎週金曜 9:00 | `0 0 * * 5` | 週次イベントまとめメール送信 |
| 週次イベントX投稿 | 毎週金曜 18:00 | `0 9 * * 5` | 今後2週間のイベントをスレッド投稿 |
| 毎日イベント投稿 | 毎日 12:00 | `0 3 * * *` | 個別イベントを1日1件紹介 |

**Note**: GitHub ActionsはUTC時刻で実行されるため、JST（UTC+9）に変換して記載しています。

## 💻 開発・テスト用コマンド

| コマンド | 説明 |
|---------|------|
| `npm run test:weekly` | 週次イベントX投稿のテスト（投稿内容プレビューのみ、実際には投稿しない） |
| `npm run test:daily` | 毎日イベント投稿のテスト（投稿内容プレビューのみ、実際には投稿しない） |
| `npm run post:weekly` | 週次イベントをXに投稿（本番実行） |
| `npm run post:daily` | 毎日イベントをXに投稿（本番実行） |

**DRY RUNモード**: `test:*` コマンドは `DRY_RUN=true` 環境変数で実行され、投稿内容の確認のみを行います。実際のX投稿やGist更新は行われません。

## ⚠️ 注意事項

- イベント情報は随時更新されます
- 最新情報は各イベント主催者のSNSをご確認ください
- 本サイトは個人運営の非営利情報共有サイトです
- X API Free Planでは月間1,500ツイートまで投稿可能（週1回の投稿で十分）
