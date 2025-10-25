// ===========================
// APOP Dance Calendar - 週次イベントまとめ投稿
// 毎週金曜18時に今後1ヶ月のイベントをまとめて投稿
// ===========================

import fetch from 'node-fetch';
import twitter from 'twitter-text';

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
            const tweetLength = twitter.parseTweet(tweet).weightedLength;
            console.log(`\n文字数: ${tweetLength}/280文字 (JavaScript: ${tweet.length}文字)`);
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
        return [`【今後1ヶ月のイベント】\n\n現在、登録イベントはありません。\n\n詳細👇\nhttps://apop-dance.netlify.app`];
    }

    // 通常の場合
    const tweet = generateSummaryTweet(events, eventsByRegion, monthStr);
    return [tweet];
}

/**
 * サマリーツイートを生成（280文字制限対応・Twitter文字数カウント使用）
 */
function generateSummaryTweet(events, eventsByRegion, monthStr) {
    // 固定パーツ
    const header = '【今後1ヶ月のイベント】\n\n';
    const url = '\n詳細👇\nhttps://apop-dance.netlify.app';
    const CHAR_LIMIT = 280; // Xの文字数制限（無料アカウント）

    // イベントを詰め込む
    let eventText = '';

    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const date = new Date(event.eventDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 都道府県名を短縮（都府県を削除）
        const pref = event.prefecture.replace('都', '').replace('府', '').replace('県', '');

        // イベント名（そのまま使用、長すぎる場合のみ短縮）
        let eventName = event.name;

        // 1行のフォーマット: 「📍 MM/DD 都道府県 イベント名\n」
        const line = `📍 ${month}/${day} ${pref} ${eventName}\n`;

        // Twitter文字数カウントで次の行を追加できるか確認
        const testTweet = header + eventText + line + url;
        const tweetLength = twitter.parseTweet(testTweet).weightedLength;

        if (tweetLength <= CHAR_LIMIT) {
            eventText += line;
        } else {
            // イベント名を短縮して再トライ
            if (eventName.length > 10) {
                eventName = eventName.substring(0, 9) + '…';
                const shorterLine = `📍 ${month}/${day} ${pref} ${eventName}\n`;
                const shorterTestTweet = header + eventText + shorterLine + url;
                const shorterTweetLength = twitter.parseTweet(shorterTestTweet).weightedLength;

                if (shorterTweetLength <= CHAR_LIMIT) {
                    eventText += shorterLine;
                    continue;
                }
            }

            // それでも入らない場合は終了
            break;
        }
    }

    // 最終的なツイート
    const tweet = header + eventText + url;

    return tweet;
}

// 実行
main();
