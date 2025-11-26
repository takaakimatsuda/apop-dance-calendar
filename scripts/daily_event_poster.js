// ===========================
// APOP Dance Calendar - 毎日のイベント個別紹介投稿
// 個別のイベントを1日1件ずつ紹介
// ===========================

import 'dotenv/config';
import fetch from 'node-fetch';
import twitter from 'twitter-text';
import { XAPIClient } from './x_api_client.js';
import { selectNextEvent } from './event_selector.js';
import { fetchPostedEvents, updatePostedEvents } from './gist_manager.js';

const API_URL = 'https://script.google.com/macros/s/AKfycbzfgpo0Yp6rgYVvaxdoDGh9BcD2LPV5g616VkN1kbBbhlYcOdn3TiPMFFhPG5UsIea8/exec';

/**
 * イベントデータをGoogle Apps Scriptから取得
 * @returns {Promise<Array>} イベントリスト
 */
async function fetchEvents() {
  console.log('📡 イベントデータを取得中...');

  const response = await fetch(API_URL);
  const data = await response.json();

  if (!data.success) {
    throw new Error('APIからのデータ取得に失敗しました');
  }

  console.log(`✅ ${data.events.length}件のイベントを取得`);
  return data.events;
}

/**
 * イベント種別を判定
 * @param {Object} event - イベント情報
 * @returns {string} イベント種別（バトル/DJイベント/ショウケース）
 */
function getEventType(event) {
  const combined = `${event.mainContent || ''} ${event.subContent || ''}`;

  if (/バトル|battle|solo|ソロ|crew|2on|3on|4on|5on/i.test(combined)) {
    return 'バトル';
  } else if (/dj|アニクラ|パーティー|クラブ/i.test(combined)) {
    return 'DJ';
  } else if (/ショウケース|ショーケース|showcase/i.test(combined)) {
    return 'ショウケース';
  }

  return '';
}

/**
 * テキストを指定文字数に短縮
 * @param {string} text - 元のテキスト
 * @param {number} maxLength - 最大文字数
 * @returns {string} 短縮されたテキスト
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 1) + '…';
}

/**
 * 投稿テキストを生成（280文字以内に自動調整）
 * @param {Object} event - イベント情報
 * @returns {string} 投稿テキスト
 */
function createTweetText(event) {
  const eventType = getEventType(event);
  const dateText = event.date || '';
  const eventUrl = event.twitter || 'URL未登録';

  // 可変部分の初期値
  let eventName = event.name || '';
  let mainContent = event.mainContent;
  let subContent = event.subContent;

  // コンテンツ行を条件付きで構築
  const contentLines = [];
  if (mainContent) {
    contentLines.push(`メインコンテンツ: ${mainContent}`);
  }
  if (subContent) {
    contentLines.push(`サブコンテンツ: ${subContent}`);
  }
  const contentSection = contentLines.length > 0 ? '\n' + contentLines.join('\n') + '\n' : '';

  // 投稿テキストを組み立てて文字数をチェック
  let text = `🎪 ${eventType}イベント紹介

📅 ${dateText}
📍 ${event.prefecture}・${event.venue}
🎵 ${eventName}${contentSection}
詳細はこちら👇
${eventUrl}`.trim();

  let tweetLength = twitter.parseTweet(text).weightedLength;

  // 280文字以内ならそのまま返す
  if (tweetLength <= 280) {
    return text;
  }

  // 文字数オーバーの場合、優先度に応じて短縮
  console.log(`⚠️ 文字数調整が必要: ${tweetLength} → 280`);

  // 優先度1: サブコンテンツを短縮
  if (subContent && subContent.length > 20) {
    subContent = truncateText(subContent, 20);

    const contentLines1 = [];
    if (mainContent) {
      contentLines1.push(`メインコンテンツ: ${mainContent}`);
    }
    if (subContent) {
      contentLines1.push(`サブコンテンツ: ${subContent}`);
    }
    const contentSection1 = contentLines1.length > 0 ? '\n' + contentLines1.join('\n') + '\n' : '';

    text = `🎪 ${eventType}イベント紹介

📅 ${dateText}
📍 ${event.prefecture}・${event.venue}
🎵 ${eventName}${contentSection1}
詳細はこちら👇
${eventUrl}`.trim();

    tweetLength = twitter.parseTweet(text).weightedLength;
    if (tweetLength <= 280) {
      console.log(`✅ サブコンテンツ短縮で調整完了: ${tweetLength}/280`);
      return text;
    }
  }

  // 優先度2: メインコンテンツを短縮
  if (mainContent && mainContent.length > 30) {
    mainContent = truncateText(mainContent, 30);

    const contentLines2 = [];
    if (mainContent) {
      contentLines2.push(`メインコンテンツ: ${mainContent}`);
    }
    if (subContent) {
      contentLines2.push(`サブコンテンツ: ${subContent}`);
    }
    const contentSection2 = contentLines2.length > 0 ? '\n' + contentLines2.join('\n') + '\n' : '';

    text = `🎪 ${eventType}イベント紹介

📅 ${dateText}
📍 ${event.prefecture}・${event.venue}
🎵 ${eventName}${contentSection2}
詳細はこちら👇
${eventUrl}`.trim();

    tweetLength = twitter.parseTweet(text).weightedLength;
    if (tweetLength <= 280) {
      console.log(`✅ メインコンテンツ短縮で調整完了: ${tweetLength}/280`);
      return text;
    }
  }

  // 優先度3: イベント名を短縮（最後の手段）
  if (eventName.length > 20) {
    eventName = truncateText(eventName, 20);

    const contentLines3 = [];
    if (mainContent) {
      contentLines3.push(`メインコンテンツ: ${mainContent}`);
    }
    if (subContent) {
      contentLines3.push(`サブコンテンツ: ${subContent}`);
    }
    const contentSection3 = contentLines3.length > 0 ? '\n' + contentLines3.join('\n') + '\n' : '';

    text = `🎪 ${eventType}イベント紹介

📅 ${dateText}
📍 ${event.prefecture}・${event.venue}
🎵 ${eventName}${contentSection3}
詳細はこちら👇
${eventUrl}`.trim();

    tweetLength = twitter.parseTweet(text).weightedLength;
    console.log(`✅ イベント名短縮で調整完了: ${tweetLength}/280`);
  }

  return text;
}

/**
 * メイン処理
 */
async function main() {
  try {
    const isDryRun = process.env.DRY_RUN === 'true';

    console.log('=== 個別イベント投稿開始 ===\n');
    console.log('実行日時:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

    if (isDryRun) {
      console.log('🔍 DRY RUNモード: 投稿内容のプレビューのみ（実際には投稿しません）\n');
    }

    // 環境変数チェック
    const requiredEnvVars = [
      'X_CLIENT_ID',
      'X_CLIENT_SECRET',
      'X_ACCESS_TOKEN',
      'X_ACCESS_TOKEN_SECRET',
      'GIST_ID',
      'GIST_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      throw new Error(`環境変数が設定されていません: ${missingVars.join(', ')}`);
    }

    // 1. イベントデータ取得
    const allEvents = await fetchEvents();

    // 2. 投稿済みデータ取得
    console.log('\n📥 投稿済みデータを取得中...');
    const postedEvents = await fetchPostedEvents(
      process.env.GIST_ID,
      process.env.GIST_TOKEN
    );

    // 3. 次に投稿するイベントを選択
    console.log('\n🎯 投稿するイベントを選択中...');
    const selectedEvent = selectNextEvent(allEvents, postedEvents);

    if (!selectedEvent) {
      console.log('\n⚠️ 投稿するイベントがありません');
      console.log('✓ 処理完了（投稿なし）');
      return;
    }

    console.log(`\n選択されたイベント:`);
    console.log(`  - ID: ${selectedEvent.id}`);
    console.log(`  - イベント名: ${selectedEvent.name}`);
    console.log(`  - 日付: ${selectedEvent.date} (${selectedEvent.eventDate})`);
    console.log(`  - 都道府県: ${selectedEvent.prefecture}`);

    // 4. 投稿テキスト生成（自動短縮機能付き）
    console.log('\n📝 投稿テキストを生成中...');
    const tweetText = createTweetText(selectedEvent);

    console.log('\n投稿内容:');
    console.log('---');
    console.log(tweetText);
    console.log('---');

    // 文字数チェック（念のため）
    const parsedTweet = twitter.parseTweet(tweetText);
    console.log(`文字数: ${parsedTweet.weightedLength}/280 (JavaScript: ${tweetText.length}文字)`);

    if (parsedTweet.weightedLength > 280) {
      console.error(`❌ 文字数オーバー（自動短縮後も超過）: ${parsedTweet.weightedLength}文字`);
      console.error('このイベントはスキップします');
      return;
    }

    // 5. DRY RUNモードの場合はここで終了
    if (isDryRun) {
      console.log('\n✅ DRY RUNモード: プレビュー完了（実際には投稿していません）');
      console.log('\n=== 処理完了 ===');
      return;
    }

    // 6. X APIクライアント初期化
    console.log('\n🐦 X APIに投稿中...');
    const xClient = new XAPIClient();

    // 7. ツイート投稿
    const tweetId = await xClient.postTweet(tweetText);
    console.log(`✅ 投稿成功! Tweet ID: ${tweetId}`);

    // 8. Gist更新
    console.log('\n💾 投稿済みデータを更新中...');
    const postedEventData = {
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      eventDate: selectedEvent.eventDate,
      postedAt: new Date().toISOString(),
      tweetId: tweetId
    };

    const updateSuccess = await updatePostedEvents(
      process.env.GIST_ID,
      process.env.GIST_TOKEN,
      postedEventData
    );

    if (!updateSuccess) {
      console.warn('⚠️ Gist更新に失敗しましたが、投稿は成功しています');
    }

    console.log('\n=== 処理完了 ===');

  } catch (error) {
    console.error('\n❌ エラー発生:', error.message);
    if (error.stack) {
      console.error('スタックトレース:', error.stack);
    }
    process.exit(1);
  }
}

// スクリプト実行
main();
