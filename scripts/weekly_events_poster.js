// ===========================
// APOP Dance Calendar - 週次イベントX投稿
// 毎週金曜18時に今後1ヶ月のイベントをX（Twitter）にスレッド投稿
// ===========================

import 'dotenv/config';
import fetch from 'node-fetch';
import twitter from 'twitter-text';
import { XAPIClient } from './x_api_client.js';

const API_URL = 'https://script.google.com/macros/s/AKfycbzfgpo0Yp6rgYVvaxdoDGh9BcD2LPV5g616VkN1kbBbhlYcOdn3TiPMFFhPG5UsIea8/exec';

async function main() {
    try {
        console.log('=== 週次イベントX投稿 ===');
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

        // 4. イベントが0件の場合は投稿しない
        if (upcomingEvents.length === 0) {
            console.log('⚠️  投稿するイベントがありません');
            console.log('✓ 処理完了（投稿なし）');
            return;
        }

        // 5. ツイート文を生成
        const tweets = generateTweets(upcomingEvents);

        // 6. 投稿内容を表示
        console.log('=== 投稿内容プレビュー ===\n');
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
        console.log('=== イベント詳細 ===');
        upcomingEvents.forEach(event => {
            const date = new Date(event.eventDate);
            console.log(`${date.toLocaleDateString('ja-JP')} | ${event.prefecture.padEnd(6)} | ${event.name}`);
        });

        // 8. X APIで投稿
        const xClient = new XAPIClient();
        const result = await xClient.postThread(tweets);

        // 9. 結果判定
        if (result.failed > 0) {
            throw new Error(`投稿に失敗しました（成功: ${result.success}, 失敗: ${result.failed}）`);
        }

        console.log('\n✓ すべての投稿が正常に完了しました');

    } catch (error) {
        console.error('\n❌ エラー発生:', error.message);
        if (error.stack) {
            console.error('スタックトレース:', error.stack);
        }
        process.exit(1);
    }
}

/**
 * ツイート文を生成（280文字制限に対応、複数ツイート対応）
 */
function generateTweets(events) {
    // イベントがない場合（この関数は呼ばれないが念のため）
    if (events.length === 0) {
        return [];
    }

    // 全イベントを複数ツイートに分割
    return generateMultipleTweets(events);
}

/**
 * 複数ツイートを生成（全イベントを含むまで分割）
 */
function generateMultipleTweets(events) {
    const CHAR_LIMIT = 280;

    // まず1投稿で全て入るか試す
    const singleTweet = buildTweet(events, 0, events.length, true, true);
    const singleTweetLength = twitter.parseTweet(singleTweet).weightedLength;
    if (singleTweetLength <= CHAR_LIMIT) {
        return [singleTweet];
    }

    // 複数投稿に分割
    const tweetData = []; // {startIndex, endIndex, includeHeader, includeUrl}
    let currentEventIndex = 0;

    while (currentEventIndex < events.length) {
        const isFirstTweet = tweetData.length === 0;
        const includeHeader = isFirstTweet;

        // 残りイベントが全て最後のツイートに入るかチェック
        const remainingEvents = events.length - currentEventIndex;
        let includeUrl = false;
        let eventCount = 0;

        // 残りイベント全てをURLと一緒に入れられるか試す
        const testWithUrl = buildTweet(events, currentEventIndex, events.length, includeHeader, true);
        const testWithUrlLength = twitter.parseTweet(testWithUrl).weightedLength;
        if (testWithUrlLength <= CHAR_LIMIT) {
            // 全て入る場合
            includeUrl = true;
            eventCount = remainingEvents;
        } else {
            // 全ては入らないので、URLなしで詰められるだけ詰める
            for (let i = currentEventIndex; i < events.length; i++) {
                const testTweet = buildTweet(events, currentEventIndex, i + 1, includeHeader, false);

                if (twitter.parseTweet(testTweet).weightedLength <= CHAR_LIMIT) {
                    eventCount = i - currentEventIndex + 1;
                } else {
                    break;
                }
            }

            if (eventCount === 0) {
                // 1つも入らない場合、強制的に1イベントを追加
                eventCount = 1;
            }
        }

        tweetData.push({
            startIndex: currentEventIndex,
            endIndex: currentEventIndex + eventCount,
            includeHeader: includeHeader,
            includeUrl: includeUrl
        });

        currentEventIndex += eventCount;
    }

    // 最後のツイートにURLが含まれているか確認
    if (tweetData.length > 0 && !tweetData[tweetData.length - 1].includeUrl) {
        // 最後のツイートを修正してURLを含める
        const lastTweet = tweetData[tweetData.length - 1];

        // URLを含めた場合の文字数をチェック
        const testWithUrl = buildTweet(events, lastTweet.startIndex, lastTweet.endIndex, lastTweet.includeHeader, true);
        const testWithUrlLength = twitter.parseTweet(testWithUrl).weightedLength;

        if (testWithUrlLength <= CHAR_LIMIT) {
            // URLを含めても収まる
            lastTweet.includeUrl = true;
        } else {
            // URLを含めると超える場合、イベントを減らして調整
            // 最後のツイートから一部イベントを減らす
            let adjustedEndIndex = lastTweet.endIndex - 1;
            while (adjustedEndIndex > lastTweet.startIndex) {
                const adjusted = buildTweet(events, lastTweet.startIndex, adjustedEndIndex, lastTweet.includeHeader, false);
                if (twitter.parseTweet(adjusted).weightedLength <= CHAR_LIMIT) {
                    break;
                }
                adjustedEndIndex--;
            }

            lastTweet.endIndex = adjustedEndIndex;

            // 残りイベント+URLの新しいツイートを追加
            tweetData.push({
                startIndex: adjustedEndIndex,
                endIndex: events.length,
                includeHeader: false,
                includeUrl: true
            });
        }
    }

    // ツイートテキストを生成
    const tweets = tweetData.map(data => {
        return buildTweet(events, data.startIndex, data.endIndex, data.includeHeader, data.includeUrl);
    });

    return tweets;
}

/**
 * 指定範囲のイベントからツイートテキストを構築
 */
function buildTweet(events, startIndex, endIndex, includeHeader, includeUrl) {
    const header = '【今後1ヶ月のイベント】\n\n';
    const url = '\n詳細👇\nhttps://apop-dance.netlify.app';

    let eventText = '';

    for (let i = startIndex; i < endIndex && i < events.length; i++) {
        const event = events[i];
        const date = new Date(event.eventDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();

        // 曜日を取得
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

        // 都道府県名を短縮
        const pref = event.prefecture.replace('都', '').replace('府', '').replace('県', '');

        // イベント名を完全に表示
        const eventName = event.name;

        eventText += `📍 ${month}/${day}(${dayOfWeek}) ${pref} ${eventName}\n`;
    }

    return (includeHeader ? header : '') + eventText + (includeUrl ? url : '');
}

// 実行
main();
