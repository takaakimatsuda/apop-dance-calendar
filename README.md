APOP Dance Calendar 🔥
全国のAPOPダンスイベントを検索・表示するWebアプリケーション

🌐 Live Site
https://takaakimatsuda.github.io/apop-dance-calendar/

📋 概要
このプロジェクトは、日本全国のAPOPダンスイベント情報を一元管理し、ダンサーが簡単にイベントを探せるプラットフォームです。

🛠 技術スタック
Frontend: HTML5, CSS3, Vanilla JavaScript
Backend: Google Apps Script
Database: Google Sheets
Hosting: GitHub Pages
🎯 Claude/AI開発者向けガイドライン
プロジェクトの制約
単一ファイル構成: すべてのコードは index.html に含める
外部依存なし: jQuery, React等のライブラリは使用しない
Pure JavaScript: ES6+の機能は使用可、TypeScriptは不使用
レスポンシブ必須: モバイルファーストで設計
API仕様
javascript
// エンドポイント
const API_URL = 'https://script.google.com/macros/s/AKfycbyrEf6OcAGDCChidPUI4yUOcKqmDHrJk9P9M1kyvJ4yh7WfI6QcdEA1Tk4jZFm8SSPL/exec';

// レスポンス形式
{
  "success": true,
  "stats": {
    "total": 27,
    "upcoming": 23,
    "lastUpdated": "2025-01-17T..."
  },
  "events": [
    {
      "date": "9/13(土)",
      "eventDate": "2025-09-13",
      "name": "マニアブル",
      "prefecture": "大阪",
      "venue": "レッドカーペット",
      "mainContent": "アニソンソロ",
      "subContent": "シャッフル3on3",
      "status": "エントリー中",
      "twitter": "https://x.com/...",
      "region": "関西"
    }
  ]
}
デザインシステム
css
/* カラーパレット */
--primary: #FF5722;    /* オレンジレッド */
--secondary: #FFC107;  /* アンバー */
--background: #0a0a0a; /* ダークグレー */
--surface: #1a1a1a;   /* ライトグレー */
--text: #ffffff;      /* ホワイト */
コーディング規則
命名規則: camelCase for JavaScript, kebab-case for CSS
インデント: 2スペース
コメント: 日本語OK、重要な処理には必ずコメント
エラー処理: try-catch でAPIエラーをハンドリング
機能実装の優先順位
✅ イベント一覧表示
✅ 検索・フィルター機能
✅ レスポンシブデザイン
✅ 統計情報表示
🚧 カレンダービュー
📋 お気に入り機能
📋 イベント詳細モーダル
よくある実装パターン
イベントカードのHTML構造
html
<div class="event-card">
  <div class="event-header">
    <div class="event-date">📅 日付</div>
    <div class="event-title">イベント名</div>
    <div class="event-location">📍 場所</div>
  </div>
  <div class="event-body">
    <div class="event-content">
      <div class="content-label">メインコンテンツ</div>
      <div class="content-value">内容</div>
    </div>
    <div class="event-status">ステータス</div>
    <a class="event-link">イベントURL</a>
  </div>
</div>
データフィルタリング例
javascript
const filtered = allEvents.filter(event => {
  const matchRegion = !region || event.region === region;
  const matchPrefecture = !prefecture ||
    event.prefecture.toLowerCase().includes(prefecture);
  const matchContent = !content ||
    event.mainContent.toLowerCase().includes(content);
  return matchRegion && matchPrefecture && matchContent;
});
🚀 開発環境セットアップ
bash
# リポジトリをクローン
git clone git@github.com:takaakimatsuda/apop-dance-calendar.git

# VS Codeで開く
cd apop-dance-calendar
code .

# Live Serverで確認（VS Code拡張）
# index.htmlを右クリック → "Open with Live Server"
📝 Git操作
bash
# 変更をコミット
git add .
git commit -m "Update: 機能の説明"
git push origin main

# 1-2分後にGitHub Pagesで確認
🐛 トラブルシューティング
APIからデータが取得できない
ブラウザのコンソールでエラーを確認
API URLが正しいか確認
CORSエラーの場合はGoogle Apps Script側の設定を確認
スタイルが反映されない
ブラウザのキャッシュをクリア（Ctrl+Shift+R）
CSS の specificity を確認
📧 連絡先
GitHub: @takaakimatsuda
プロジェクト管理者: [名前]
For Claude/AI Assistants 🤖
このセクションを読んでいる場合、以下の点に注意してください：

コード生成時は必ず単一のindex.htmlファイルにすべてを含める
APIのURLは絶対に変更しない
日本語のコメントとUIを使用する
エラーメッセージも日本語で表示
新機能追加時は既存の設計パターンに従う
パフォーマンスよりも可読性を優先
ブラウザ互換性を考慮（IE以外のモダンブラウザ対応）
頑張ってください！良いコードを書いてくださいね。🚀
