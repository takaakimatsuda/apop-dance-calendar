// ===========================
// X API v2クライアント（OAuth 1.0a）
// スレッド投稿、リトライ処理対応
// ===========================

import { TwitterApi } from 'twitter-api-v2';

/**
 * X API v2クライアントクラス
 */
export class XAPIClient {
    constructor() {
        // 環境変数から認証情報を取得
        this.appKey = process.env.X_CLIENT_ID;
        this.appSecret = process.env.X_CLIENT_SECRET;
        this.accessToken = process.env.X_ACCESS_TOKEN;
        this.accessSecret = process.env.X_ACCESS_TOKEN_SECRET;

        // 認証情報のバリデーション
        if (!this.appKey || !this.appSecret || !this.accessToken || !this.accessSecret) {
            throw new Error('X API認証情報が不足しています。以下の環境変数を設定してください:\n' +
                '  - X_CLIENT_ID\n' +
                '  - X_CLIENT_SECRET\n' +
                '  - X_ACCESS_TOKEN\n' +
                '  - X_ACCESS_TOKEN_SECRET');
        }

        // TwitterApiクライアントの初期化（OAuth 1.0a）
        this.client = new TwitterApi({
            appKey: this.appKey,
            appSecret: this.appSecret,
            accessToken: this.accessToken,
            accessSecret: this.accessSecret,
        });

        // Read and Write権限のクライアントを取得
        this.rwClient = this.client.readWrite;
    }

    /**
     * 単一ツイートを投稿
     * @param {string} text - 投稿テキスト
     * @param {string|null} replyToId - 返信先のツイートID（オプション）
     * @param {number} retryCount - リトライ回数
     * @returns {Promise<string>} - 投稿されたツイートのID
     */
    async postTweet(text, replyToId = null, retryCount = 0) {
        const MAX_RETRIES = 3;

        try {
            const params = { text };
            if (replyToId) {
                params.reply = { in_reply_to_tweet_id: replyToId };
            }

            const tweet = await this.rwClient.v2.tweet(params);
            return tweet.data.id;

        } catch (error) {
            console.error(`ツイート投稿エラー (試行 ${retryCount + 1}/${MAX_RETRIES + 1}):`, error.message);

            // デバッグ情報を表示
            if (error.data) {
                console.error('エラー詳細:', JSON.stringify(error.data, null, 2));
            }
            if (error.errors) {
                console.error('エラーリスト:', JSON.stringify(error.errors, null, 2));
            }

            // エラーコードに応じた処理
            if (error.code === 429) {
                // レート制限エラー
                if (retryCount < MAX_RETRIES) {
                    const waitTime = Math.pow(2, retryCount) * 5000; // 指数バックオフ（5秒, 10秒, 20秒）
                    console.log(`レート制限に達しました。${waitTime / 1000}秒待機してリトライします...`);
                    await this.sleep(waitTime);
                    return this.postTweet(text, replyToId, retryCount + 1);
                }
            } else if (error.code >= 500 && error.code < 600) {
                // サーバーエラー
                if (retryCount < MAX_RETRIES) {
                    const waitTime = Math.pow(2, retryCount) * 2000; // 指数バックオフ（2秒, 4秒, 8秒）
                    console.log(`サーバーエラー。${waitTime / 1000}秒待機してリトライします...`);
                    await this.sleep(waitTime);
                    return this.postTweet(text, replyToId, retryCount + 1);
                }
            }

            // リトライ上限に達した、またはリトライ不可能なエラー
            throw error;
        }
    }

    /**
     * スレッド形式で複数のツイートを投稿
     * @param {string[]} tweets - ツイートテキストの配列
     * @returns {Promise<Object>} - 投稿結果のサマリー
     */
    async postThread(tweets) {
        if (!tweets || tweets.length === 0) {
            throw new Error('投稿するツイートが指定されていません');
        }

        console.log(`\n=== スレッド投稿開始（${tweets.length}件） ===`);
        const results = {
            success: 0,
            failed: 0,
            firstTweetUrl: null,
            tweetIds: []
        };

        let previousTweetId = null;

        for (let i = 0; i < tweets.length; i++) {
            const tweetText = tweets[i];
            console.log(`\n投稿 ${i + 1}/${tweets.length}:`);
            console.log(`文字数: ${tweetText.length}`);
            console.log(`内容:\n${tweetText.substring(0, 100)}${tweetText.length > 100 ? '...' : ''}`);

            try {
                // レート制限対策：各投稿の間に2秒待機（最初の投稿以外）
                if (i > 0) {
                    console.log('2秒待機...');
                    await this.sleep(2000);
                }

                const tweetId = await this.postTweet(tweetText, previousTweetId);
                console.log(`✓ 投稿成功 (ID: ${tweetId})`);

                results.success++;
                results.tweetIds.push(tweetId);
                previousTweetId = tweetId;

                // 最初のツイートのURLを保存
                if (i === 0 && this.accessToken) {
                    // アクセストークンから認証ユーザーIDを取得するのは難しいので、
                    // ツイートIDだけを記録
                    results.firstTweetUrl = `https://twitter.com/i/web/status/${tweetId}`;
                }

            } catch (error) {
                console.error(`❌ 投稿失敗:`, error.message);
                results.failed++;
                // スレッドの途中で失敗した場合は中断
                break;
            }
        }

        console.log('\n=== 投稿結果サマリー ===');
        console.log(`成功: ${results.success}件`);
        console.log(`失敗: ${results.failed}件`);
        if (results.firstTweetUrl) {
            console.log(`最初の投稿URL: ${results.firstTweetUrl}`);
        }

        return results;
    }

    /**
     * 指定ミリ秒待機
     * @param {number} ms - 待機時間（ミリ秒）
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
