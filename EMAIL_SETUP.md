# メール送信機能 セットアップガイド

週次イベントまとめを自動的にメール送信する機能のセットアップ手順です。

## 概要

- **完全無料**（Gmailアカウントのみ必要）
- **自動送信**: 毎週金曜18時に自動送信
- **所要時間**: 約5分

## セットアップ手順

### 1. Gmail App Passwordの取得（2分）

1. [Google アカウント](https://myaccount.google.com/)にアクセス
2. 左メニューの「セキュリティ」をクリック
3. 「Googleへのログイン」セクションの「2段階認証プロセス」をクリック
   - **注**: 2段階認証が有効になっていない場合は、先に有効化してください
4. ページ下部の「アプリパスワード」をクリック
5. アプリ名に「APOP Dance Calendar」と入力
6. **16桁のパスワードが表示されます** → これをコピー（スペースは不要）
   - 例: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### 2. GitHub Secretsの設定（3分）

1. GitHubリポジトリページを開く
2. 「Settings」タブをクリック
3. 左メニューの「Secrets and variables」→「Actions」をクリック
4. 「New repository secret」ボタンをクリック
5. 以下の3つのSecretを追加:

#### Secret 1: `GMAIL_USER`
- **Name**: `GMAIL_USER`
- **Secret**: 送信元のGmailアドレス（例: `your-email@gmail.com`）
- 「Add secret」をクリック

#### Secret 2: `GMAIL_APP_PASSWORD`
- **Name**: `GMAIL_APP_PASSWORD`
- **Secret**: 手順1で取得した16桁のApp Password
- 「Add secret」をクリック

#### Secret 3: `RECIPIENT_EMAIL`
- **Name**: `RECIPIENT_EMAIL`
- **Secret**: 送信先のメールアドレス（自分のメールアドレス）
- 「Add secret」をクリック

### 3. テスト実行（1分）

1. GitHubリポジトリの「Actions」タブをクリック
2. 左メニューの「Weekly Events Summary」をクリック
3. 「Run workflow」ボタンをクリック
4. 「Run workflow」を再度クリック
5. 実行完了後、メールボックスを確認

## メール形式

### 件名
```
【APOP Dance Calendar】今後1ヶ月のイベント（10月25日更新）
```

### 本文
```
【今後1ヶ月のイベント】

📍 11/2 東京 HOOK THE RAW 2025
📍 11/3 東京 踊ってない夜を知らない
📍 11/3 大阪 シロクマ・パレス
📍 11/8 神奈川 鶴見大作戦
📍 11/15 東京 THE ViCTOR
📍 11/16 東京 ACE SPECアニバ
📍 11/22 福岡 B-POWER

詳細👇
https://apop-dance.netlify.app
```

## 自動送信スケジュール

- **毎週金曜 18:00 JST** に自動送信されます
- GitHub Actionsで自動実行されます

## トラブルシューティング

### メールが届かない場合

1. **Secretsの確認**
   - GitHubの「Settings」→「Secrets and variables」→「Actions」で3つのSecretが正しく設定されているか確認
   - App Passwordにスペースが含まれていないか確認

2. **Gmail設定の確認**
   - 2段階認証が有効になっているか確認
   - App Passwordが正しく生成されているか確認

3. **迷惑メールフォルダの確認**
   - 初回送信時は迷惑メールフォルダに入ることがあります

4. **GitHub Actionsのログ確認**
   - 「Actions」タブでワークフローの実行ログを確認
   - エラーメッセージがあれば内容を確認

### よくあるエラー

#### `Invalid login: 535-5.7.8 Username and Password not accepted`
- App Passwordが間違っています
- Secretsの`GMAIL_APP_PASSWORD`を確認してください

#### `メール送信をスキップ: 環境変数が設定されていません`
- GitHub Secretsが設定されていません
- 手順2を再度実行してください

## セキュリティについて

- **App Passwordは安全**: 通常のパスワードより安全で、いつでも無効化できます
- **GitHub Secretsは暗号化**: GitHub Secretsは暗号化されて保存され、ログにも表示されません
- **メール送信のみ**: このApp Passwordはメール送信にのみ使用されます

## 送信先を変更したい場合

1. GitHubの「Settings」→「Secrets and variables」→「Actions」
2. `RECIPIENT_EMAIL`の右側にある「Update」をクリック
3. 新しいメールアドレスを入力
4. 「Update secret」をクリック

## メール送信を停止したい場合

1. GitHubの「Settings」→「Secrets and variables」→「Actions」
2. 3つのSecret（`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `RECIPIENT_EMAIL`）を削除
3. または、`.github/workflows/weekly-events-summary.yml`ファイルを編集して環境変数をコメントアウト

## 参考リンク

- [Google アプリパスワードについて](https://support.google.com/accounts/answer/185833)
- [GitHub Secrets のドキュメント](https://docs.github.com/ja/actions/security-guides/encrypted-secrets)
