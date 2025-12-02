/**
 * イベント選択ロジック
 * すべてのイベントを公平に紹介するため、日付が近い順で未投稿イベントを選択
 */

/**
 * 今後の期間内のイベントをフィルタリング
 * @param {Array} allEvents - すべてのイベント
 * @param {number} daysAhead - 何日先まで対象にするか
 * @returns {Array} フィルタリングされたイベント
 */
export function filterEventsByDateRange(allEvents, daysAhead) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  return allEvents.filter(event => {
    if (!event.eventDate) return false;

    const eventDate = new Date(event.eventDate);
    return eventDate >= today && eventDate < endDate;
  });
}

/**
 * 未投稿のイベントをフィルタリング
 * @param {Array} events - イベントリスト
 * @param {Array} postedEvents - 投稿済みイベントリスト
 * @returns {Array} 未投稿のイベント
 */
export function filterUnpostedEvents(events, postedEvents) {
  // eventId + eventDate と eventName + eventDate の両方でチェック
  // （スプレッドシートの行変更でeventIdが変わっても重複を検知できるようにする）
  const postedByIdKeys = postedEvents.map(p => `${p.eventId}_${p.eventDate}`);
  const postedByNameKeys = postedEvents.map(p => `${p.eventName}_${p.eventDate}`);

  return events.filter(event => {
    const idKey = `${event.id}_${event.eventDate}`;
    const nameKey = `${event.name}_${event.eventDate}`;

    // どちらかのキーでマッチしたら投稿済みとみなす
    return !postedByIdKeys.includes(idKey) && !postedByNameKeys.includes(nameKey);
  });
}

/**
 * 日付順にソート（近い順）
 * @param {Array} events - イベントリスト
 * @returns {Array} ソート済みイベント
 */
export function sortByDate(events) {
  return events.sort((a, b) => {
    const dateA = new Date(a.eventDate);
    const dateB = new Date(b.eventDate);
    return dateA - dateB;
  });
}

/**
 * 次に投稿するイベントを選択
 * @param {Array} allEvents - すべてのイベント
 * @param {Array} postedEvents - 投稿済みイベント（Gistから取得）
 * @returns {Object|null} 選択されたイベント、なければnull
 */
export function selectNextEvent(allEvents, postedEvents) {
  // 優先グループ: 今後1週間
  let candidates = filterEventsByDateRange(allEvents, 7);
  candidates = filterUnpostedEvents(candidates, postedEvents);
  candidates = sortByDate(candidates);

  if (candidates.length > 0) {
    console.log(`✅ 優先グループから選択: ${candidates.length}件の候補`);
    return candidates[0];
  }

  // 通常グループ: 1-2週間先
  candidates = filterEventsByDateRange(allEvents, 14);
  candidates = filterUnpostedEvents(candidates, postedEvents);
  candidates = sortByDate(candidates);

  if (candidates.length > 0) {
    console.log(`⚠️ 通常グループから選択: ${candidates.length}件の候補`);
    return candidates[0];
  }

  // すべて投稿済みの場合、1週間以内のイベントを繰り返し投稿
  console.log('🔍 すべて投稿済み。繰り返し投稿を確認中...');

  const repeatCandidates = filterEventsByDateRange(allEvents, 14);
  if (repeatCandidates.length > 0) {
    console.log(`🔄 2週間以内のイベント（${repeatCandidates.length}件）を再投稿します`);
    const sorted = sortByDate(repeatCandidates);
    return sorted[0];
  }

  console.log('❌ 投稿可能なイベントがありません');
  return null;
}
