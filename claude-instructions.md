# Claude用開発指示書 📋

## あなたの役割
あなたはAPOP Dance Calendarプロジェクトの開発者です。
このプロジェクトは全国のAPOPダンスイベント情報を表示するWebアプリケーションです。

## 重要な制約 ⚠️

### 絶対に守るべきルール
1. **すべてのコードは `index.html` の中に書く**（外部ファイル禁止）
2. **API URLは変更禁止**: `https://script.google.com/macros/s/AKfycbyrEf6OcAGDCChidPUI4yUOcKqmDHrJk9P9M1kyvJ4yh7WfI6QcdEA1Tk4jZFm8SSPL/exec`
3. **外部ライブラリ使用禁止**（jQuery, React, Vue等は使わない）
4. **日本語UI必須**（エラーメッセージも含む）

## コード生成時のテンプレート

### 基本構造
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APOP Dance Calendar</title>
    <style>
        /* すべてのCSSはここに */
    </style>
</head>
<body>
    <!-- HTMLコンテンツ -->

    <script>
        // すべてのJavaScriptはここに
        const API_URL = 'https://script.google.com/macros/s/AKfycbyrEf6OcAGDCChidPUI4yUOcKqmDHrJk9P9M1kyvJ4yh7WfI6QcdEA1Tk4jZFm8SSPL/exec';

        // 初期化処理
        window.addEventListener('DOMContentLoaded', async () => {
            // APIからデータ取得
            // UIレンダリング
        });
    </script>
</body>
</html>
```

## よく使うコードパターン

### API呼び出し
```javascript
async function loadEvents() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success) {
            allEvents = data.events;
            displayEvents(allEvents);
        }
    } catch (error) {
        console.error('エラー:', error);
        // ユーザーにエラーを表示
    }
}
```

### イベントフィルタリング
```javascript
function filterEvents(events, criteria) {
    return events.filter(event => {
        // 複数条件でフィルタリング
        return true; // 条件に合致
    });
}
```

### レスポンシブデザイン
```css
@media (max-width: 768px) {
    /* モバイル用スタイル */
}
```

## 新機能を追加する時

1. まず既存のコードパターンを確認
2. 同じ命名規則とスタイルを使用
3. コメントは日本語で記述
4. エラーハンドリングを忘れずに

## デバッグのヒント

- `console.log()`を活用してデータ構造を確認
- Chrome DevToolsでネットワークタブを確認
- レスポンシブデザインはDeviceモードで確認

## パフォーマンス最適化

- 不要なDOM操作を避ける
- イベントリスナーは適切にデリゲート
- アニメーションはCSSで実装（JSアニメーションは避ける）

## コミットメッセージの規則

```bash
git commit -m "Add: 新機能の追加"
git commit -m "Fix: バグ修正"
git commit -m "Update: 機能の更新"
git commit -m "Style: デザインの変更"
git commit -m "Refactor: コードの整理"
```

## 質問への回答方針

1. 具体的なコード例を提供
2. なぜそのアプローチを選んだか説明
3. 代替案も提示
4. 潜在的な問題点も指摘

頑張って良いコードを書いてください！🚀
