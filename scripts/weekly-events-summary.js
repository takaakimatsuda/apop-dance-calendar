// ===========================
// APOP Dance Calendar - 週次イベントまとめ投稿
// 毎週金曜18時に今後1ヶ月のイベントをまとめて投稿
// ===========================

import fetch from 'node-fetch';

const API_URL = 'https://script.google.com/macros/s/AKfycbzfgpo0Yp6rgYVvaxdoDGh9BcD2LPV5g616VkN1kbBbhlYcOdn3TiPMFFhPG5UsIea8/exec';

async function main() {
    try {
        console.log('=== 週次イベントまとめ投稿 ===');
        console.log('実行日時:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

        // 1. イベントデータを取得
        console.log('\nAPIからデータ取得中...');
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!data.success) {
            throw new Error('APIからのデータ取得に失敗しました');
        }

        console.log(`✓ 全イベント数: ${data.events.length}件`);

        // 2. 今日から1ヶ月後までの日付範囲を計算
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const oneMonthLater = new Date(today);
        oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

        console.log('対象期間:', today.toLocaleDateString('ja-JP'), '〜', oneMonthLater.toLocaleDateString('ja-JP'));

        // 3. 期間内のイベントをフィルタ
        const upcomingEvents = data.events.filter(event => {
            if (!event.eventDate) return false;

            const eventDate = new Date(event.eventDate);
            return eventDate >= today && eventDate <= oneMonthLater;
        });

        // 日付順にソート
        upcomingEvents.sort((a, b) => {
            return new Date(a.eventDate) - new Date(b.eventDate);
        });

        console.log(`✓ 該当イベント: ${upcomingEvents.length}件\n`);

        // 4. 地域別に集計
        const eventsByRegion = {};
        upcomingEvents.forEach(event => {
            const region = event.region || 'その他';
            if (!eventsByRegion[region]) {
                eventsByRegion[region] = [];
            }
            eventsByRegion[region].push(event);
        });

        // 5. ツイート文を生成
        const tweets = generateTweets(upcomingEvents, eventsByRegion);

        // 6. 投稿内容を表示
        console.log('=== 投稿内容 ===\n');
        tweets.forEach((tweet, index) => {
            if (tweets.length > 1) {
                console.log(`【${index + 1}/${tweets.length}】`);
            }
            console.log(tweet);
            console.log(`\n文字数: ${tweet.length}/280文字`);
            console.log('---\n');
        });

        // 7. イベント詳細をログ出力（デバッグ用）
        if (upcomingEvents.length > 0) {
            console.log('=== イベント詳細 ===');
            upcomingEvents.forEach(event => {
                const date = new Date(event.eventDate);
                console.log(`${date.toLocaleDateString('ja-JP')} | ${event.prefecture.padEnd(6)} | ${event.name}`);
            });
        }

        console.log('\n✓ 処理完了');

        // TODO: X APIで実際に投稿する処理
        // await postToTwitter(tweets);

        // TODO: GitHub Issueに投稿する処理
        // await createGitHubIssue(tweets.join('\n\n---\n\n'));

    } catch (error) {
        console.error('❌ エラー発生:', error);
        process.exit(1);
    }
}

/**
 * ツイート文を生成（280文字制限に対応）
 */
function generateTweets(events, eventsByRegion) {
    const today = new Date();
    const monthStr = `${today.getMonth() + 1}月${today.getDate()}日`;

    // イベントがない場合
    if (events.length === 0) {
        return [`【今後1ヶ月のイベント】\n${monthStr}現在、今後1ヶ月の登録イベントはありません。\n\n最新情報はこちら👇\nhttps://apop-dance.netlify.app`];
    }

    const tweets = [];

    // メインツイート：サマリー
    const summaryTweet = generateSummaryTweet(events, eventsByRegion, monthStr);
    tweets.push(summaryTweet);

    // イベントが多い場合は、詳細を追加ツイートで投稿
    if (events.length > 8) {
        const detailTweets = generateDetailTweets(events);
        tweets.push(...detailTweets);
    }

    return tweets;
}

/**
 * サマリーツイートを生成（URLを保護しながら280文字制限）
 */
function generateSummaryTweet(events, eventsByRegion, monthStr) {
    const header = `【今後1ヶ月のイベント】\n\n`;
    const footer = `\n詳細👇\nhttps://apop-dance.netlify.app`;
    const limit = 280;

    let eventList = '';
    let includedCount = 0;

    // イベントを1件ずつ追加していく
    for (const event of events) {
        const date = new Date(event.eventDate);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const eventLine = `📍 ${dateStr} ${event.prefecture} ${event.name}\n`;

        // 追加してもlimit内に収まるかチェック
        const testText = header + eventList + eventLine + footer;

        if (testText.length <= limit) {
            eventList += eventLine;
            includedCount++;
        } else {
            // 入らない場合は「…」を追加して終了
            eventList += '…\n';
            break;
        }
    }

    return header + eventList + footer;
}

/**
 * 詳細ツイート（リプライ用）を生成
 */
function generateDetailTweets(events) {
    const detailTweets = [];
    const eventsPerTweet = 8;

    for (let i = 0; i < events.length; i += eventsPerTweet) {
        const chunk = events.slice(i, i + eventsPerTweet);
        let text = '【イベント詳細】\n\n';

        chunk.forEach(event => {
            const date = new Date(event.eventDate);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            text += `📍 ${dateStr} ${event.prefecture} ${event.name}\n`;
        });

        if (i + eventsPerTweet < events.length) {
            text += '\n続く...';
        }

        detailTweets.push(text);
    }

    return detailTweets;
}

// 実行
main();
