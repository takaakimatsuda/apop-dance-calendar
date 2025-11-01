// ===========================
// APOP Dance Calendar - 週次イベントまとめ投稿
// 毎週金曜18時に今後1ヶ月のイベントをまとめて投稿
// ===========================

import fetch from 'node-fetch';
import twitter from 'twitter-text';
import nodemailer from 'nodemailer';

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

        // メール送信（全ツイートを結合）
        if (tweets.length > 0) {
            await sendEmail(tweets);
        }

    } catch (error) {
        console.error('❌ エラー発生:', error);
        process.exit(1);
    }
}

/**
 * ツイート文を生成（280文字制限に対応、複数ツイート対応）
 */
function generateTweets(events, eventsByRegion) {
    const today = new Date();
    const monthStr = `${today.getMonth() + 1}月${today.getDate()}日`;

    // イベントがない場合
    if (events.length === 0) {
        return [`【今後1ヶ月のイベント】\n\n現在、登録イベントはありません。\n\n詳細👇\nhttps://apop-dance.netlify.app`];
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
    const tweetData = []; // {startIndex, endIndex, includeHeader, includeUrl, shortenNames}
    let currentEventIndex = 0;

    while (currentEventIndex < events.length) {
        const isFirstTweet = tweetData.length === 0;
        const isLastEvent = currentEventIndex === events.length - 1;
        const includeHeader = isFirstTweet;

        // 残りイベントが全て最後のツイートに入るかチェック
        const remainingEvents = events.length - currentEventIndex;
        let includeUrl = false;
        let eventCount = 0;
        let shortenNames = false;

        // 残りイベント全てをURLと一緒に入れられるか試す
        const testWithUrl = buildTweet(events, currentEventIndex, events.length, includeHeader, true, false);
        const testWithUrlLength = twitter.parseTweet(testWithUrl).weightedLength;
        if (testWithUrlLength <= CHAR_LIMIT) {
            // 全て入る場合
            includeUrl = true;
            eventCount = remainingEvents;
        } else {
            // 短縮版で試す
            const testWithUrlShortened = buildTweet(events, currentEventIndex, events.length, includeHeader, true, true);
            const testWithUrlShortenedLength = twitter.parseTweet(testWithUrlShortened).weightedLength;
            if (testWithUrlShortenedLength <= CHAR_LIMIT) {
                includeUrl = true;
                eventCount = remainingEvents;
                shortenNames = true;
            } else {
                // 全ては入らないので、URLなしで詰められるだけ詰める
                for (let i = currentEventIndex; i < events.length; i++) {
                    const testTweet = buildTweet(events, currentEventIndex, i + 1, includeHeader, false, false);

                    if (twitter.parseTweet(testTweet).weightedLength <= CHAR_LIMIT) {
                        eventCount = i - currentEventIndex + 1;
                    } else {
                        // イベント名を短縮して再トライ
                        const testTweetShortened = buildTweet(events, currentEventIndex, i + 1, includeHeader, false, true);
                        if (twitter.parseTweet(testTweetShortened).weightedLength <= CHAR_LIMIT) {
                            eventCount = i - currentEventIndex + 1;
                            shortenNames = true;
                        } else {
                            break;
                        }
                    }
                }

                if (eventCount === 0) {
                    // 1つも入らない場合、強制的に1イベントを短縮して追加
                    eventCount = 1;
                    shortenNames = true;
                }
            }
        }

        tweetData.push({
            startIndex: currentEventIndex,
            endIndex: currentEventIndex + eventCount,
            includeHeader: includeHeader,
            includeUrl: includeUrl,
            shortenNames: shortenNames
        });

        currentEventIndex += eventCount;
    }

    // 最後のツイートにURLが含まれているか確認
    if (tweetData.length > 0 && !tweetData[tweetData.length - 1].includeUrl) {
        // 最後のツイートを修正してURLを含める
        const lastTweet = tweetData[tweetData.length - 1];

        // URLを含めた場合の文字数をチェック
        const testWithUrl = buildTweet(events, lastTweet.startIndex, lastTweet.endIndex, lastTweet.includeHeader, true, lastTweet.shortenNames);
        const testWithUrlLength = twitter.parseTweet(testWithUrl).weightedLength;

        if (testWithUrlLength <= CHAR_LIMIT) {
            // URLを含めても収まる
            lastTweet.includeUrl = true;
        } else {
            // URLを含めると超える場合、イベントを減らして調整
            // 最後のツイートから一部イベントを減らす
            let adjustedEndIndex = lastTweet.endIndex - 1;
            while (adjustedEndIndex > lastTweet.startIndex) {
                const adjusted = buildTweet(events, lastTweet.startIndex, adjustedEndIndex, lastTweet.includeHeader, false, lastTweet.shortenNames);
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
                includeUrl: true,
                shortenNames: false
            });
        }
    }

    // ツイートテキストを生成
    const tweets = tweetData.map(data => {
        return buildTweet(events, data.startIndex, data.endIndex, data.includeHeader, data.includeUrl, data.shortenNames);
    });

    return tweets;
}

/**
 * 指定範囲のイベントからツイートテキストを構築
 */
function buildTweet(events, startIndex, endIndex, includeHeader, includeUrl, shortenNames = false) {
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

        // イベント名（必要に応じて短縮）
        let eventName = event.name;
        if (shortenNames && eventName.length > 10) {
            eventName = eventName.substring(0, 9) + '…';
        }

        eventText += `📍 ${month}/${day}(${dayOfWeek}) ${pref} ${eventName}\n`;
    }

    return (includeHeader ? header : '') + eventText + (includeUrl ? url : '');
}

/**
 * メール送信関数（Gmail SMTP経由）
 */
async function sendEmail(tweets) {
    // 環境変数チェック
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const recipientEmail = process.env.RECIPIENT_EMAIL;

    if (!gmailUser || !gmailAppPassword || !recipientEmail) {
        console.log('\n⚠️  メール送信をスキップ: 環境変数が設定されていません');
        console.log('   必要な環境変数: GMAIL_USER, GMAIL_APP_PASSWORD, RECIPIENT_EMAIL');
        return;
    }

    console.log('\n=== メール送信 ===');
    console.log(`送信元: ${gmailUser}`);
    console.log(`送信先: ${recipientEmail}`);
    console.log(`投稿数: ${tweets.length}`);

    try {
        // Gmail SMTPトランスポーターを作成
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailAppPassword
            }
        });

        // メール送信日時
        const today = new Date();
        const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

        // 全ツイートを結合（改行で区切る）
        const emailContent = tweets.join('\n\n---\n\n');

        // メール内容
        const mailOptions = {
            from: gmailUser,
            to: recipientEmail,
            subject: `【APOP Dance Calendar】今後1ヶ月のイベント（${dateStr}更新）`,
            text: emailContent
        };

        // メール送信
        const info = await transporter.sendMail(mailOptions);
        console.log('✓ メール送信成功:', info.messageId);

    } catch (error) {
        console.error('❌ メール送信エラー:', error.message);
        // メール送信失敗してもスクリプトは続行
    }
}

// 実行
main();
