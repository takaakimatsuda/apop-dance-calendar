/**
 * GitHub Gist管理
 * 投稿済みイベントデータの読み書き
 */

import { Octokit } from '@octokit/rest';

/**
 * Gistから投稿済みイベントデータを取得
 * @param {string} gistId - Gist ID
 * @param {string} githubToken - GitHub Personal Access Token
 * @returns {Promise<Array>} 投稿済みイベントリスト
 */
export async function fetchPostedEvents(gistId, githubToken) {
  try {
    console.log('📥 Gistからデータ取得中...');

    const octokit = new Octokit({ auth: githubToken });

    const { data: gist } = await octokit.gists.get({
      gist_id: gistId
    });

    const fileName = 'apop-posted-events.json';

    if (!gist.files || !gist.files[fileName]) {
      console.log('⚠️ Gistファイルが見つかりません。空配列を返します。');
      return [];
    }

    const content = gist.files[fileName].content;
    const data = JSON.parse(content);

    console.log(`✅ ${data.postedEvents.length}件の投稿済みデータを取得`);
    return data.postedEvents || [];

  } catch (error) {
    console.error('❌ Gist取得エラー:', error.message);
    // エラー時は空配列を返す（初回実行時など）
    return [];
  }
}

/**
 * Gistに投稿済みイベントデータを更新
 * @param {string} gistId - Gist ID
 * @param {string} githubToken - GitHub Personal Access Token
 * @param {Object} newPostedEvent - 新しく投稿したイベント情報
 * @returns {Promise<boolean>} 成功したかどうか
 */
export async function updatePostedEvents(gistId, githubToken, newPostedEvent) {
  try {
    console.log('📤 Gistを更新中...');

    const octokit = new Octokit({ auth: githubToken });

    // 現在のデータを取得
    const currentPostedEvents = await fetchPostedEvents(gistId, githubToken);

    // 新しいデータを追加
    currentPostedEvents.push(newPostedEvent);

    // Gist更新用のデータ構造
    const updatedData = {
      lastUpdated: new Date().toISOString(),
      postedEvents: currentPostedEvents,
      resetDate: new Date().toISOString().slice(0, 7) + '-01' // 月初
    };

    await octokit.gists.update({
      gist_id: gistId,
      files: {
        'apop-posted-events.json': {
          content: JSON.stringify(updatedData, null, 2)
        }
      }
    });

    console.log('✅ Gist更新成功');
    return true;

  } catch (error) {
    console.error('❌ Gist更新エラー:', error.message);
    return false;
  }
}

/**
 * 投稿済みデータをリセット（月初やテスト用）
 * @param {string} gistId - Gist ID
 * @param {string} githubToken - GitHub Personal Access Token
 * @returns {Promise<boolean>} 成功したかどうか
 */
export async function resetPostedEvents(gistId, githubToken) {
  try {
    console.log('🔄 投稿済みデータをリセット中...');

    const octokit = new Octokit({ auth: githubToken });

    const resetData = {
      lastUpdated: new Date().toISOString(),
      postedEvents: [],
      resetDate: new Date().toISOString().slice(0, 7) + '-01'
    };

    await octokit.gists.update({
      gist_id: gistId,
      files: {
        'apop-posted-events.json': {
          content: JSON.stringify(resetData, null, 2)
        }
      }
    });

    console.log('✅ リセット成功');
    return true;

  } catch (error) {
    console.error('❌ リセットエラー:', error.message);
    return false;
  }
}
