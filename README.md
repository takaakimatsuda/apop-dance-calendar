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

### 週次イベントまとめ（自動配信）

#### X（Twitter）自動投稿
- **配信時刻**: 毎週金曜18:00 JST
- **配信内容**: 今後1ヶ月のイベント情報をスレッド形式で投稿
- **投稿形式**: イベント件数に応じて可変数の投稿（各280文字以内）
- **認証方式**: OAuth 1.0a
- **使用API**: X API v2（Free Plan対応）

#### メール自動送信
- **配信時刻**: 毎週金曜9:00 JST
- **配信内容**: 今後1ヶ月のイベント情報
- **送信方式**: Gmail SMTP経由
- 📧 **[セットアップガイド](./EMAIL_SETUP.md)**

#### 特徴
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

### X自動投稿のセットアップ

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

## ⚠️ 注意事項

- イベント情報は随時更新されます
- 最新情報は各イベント主催者のSNSをご確認ください
- 本サイトは個人運営の非営利情報共有サイトです
- X API Free Planでは月間1,500ツイートまで投稿可能（週1回の投稿で十分）
