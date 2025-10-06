// YouTube の Shorts を非表示にする content script
(function() {
    'use strict';

    const HIDDEN_CLASS = 'no-shorts-hidden';
    let isEnabled = true; // デフォルトは有効

    // 設定を読み込む
    chrome.storage.sync.get(['shortsEnabled'], (result) => {
        isEnabled = result.shortsEnabled !== undefined ? result.shortsEnabled : true;
        if (isEnabled) {
            hideShortsOnce();
        }
    });

    // メッセージリスナー（ポップアップからの指示を受け取る）
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'enableShorts') {
            isEnabled = true;
            hideShortsOnce();
        } else if (message.action === 'disableShorts') {
            isEnabled = false;
            showAllShorts();
        }
    });

    // Shortsを再表示する関数
    function showAllShorts() {
        document.querySelectorAll('.' + HIDDEN_CLASS).forEach(el => {
            el.style.display = '';
            el.classList.remove(HIDDEN_CLASS);
        });
    }

    // 単一実行で Shorts を検出して非表示にする関数（厳密マッチ）
    function hideShortsOnce() {
        if (!isEnabled) return; // 無効の場合は何もしない

        try {
            // /shorts/* ページにいる場合はトップページにリダイレクト
            try {
                const p = location.pathname || '';
                if (/^\/shorts\/.+/.test(p) || /^\/shorts(\/?$)/.test(p)) {
                    // 少し待ってからリダイレクト（History API により SPA 的遷移があっても確実に反映）
                    setTimeout(() => { location.replace('https://www.youtube.com/'); }, 150);
                    return; // それ以上の処理は不要
                }
            } catch (redirErr) { }

            // チャンネルヘッダー要素（存在する場合）をキャッシュしておく
            const channelHeader = document.querySelector('ytd-channel-header-renderer');

            // channelHeader を含む要素は誤って非表示にしない
            // まず、個々の /shorts/ リンクを直接見つけ、その近いアイテムだけを隠す
            const anchors = Array.from(document.querySelectorAll('a[href^="/shorts/"]'));
            anchors.forEach(a => {
                try {
                    // URL のパスが正確に /shorts/<id> 形式か確認
                    const href = a.getAttribute('href');
                    if (!href) return;
                    // 簡易チェック: "/shorts/" の直後に何かがあること
                    if (!/^\/shorts\/[^/?#]+/.test(href)) return;

                    // 対象アイテム（サムネイル周りのコンテナ）を探して非表示にする
                    const item = a.closest('ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-rich-grid-media, ytd-rich-item-renderer');
                    // チャンネルヘッダーを含む要素はスキップ
                    if (item && channelHeader && (item.contains(channelHeader) || channelHeader.contains(item))) return;
                    if (item && !item.classList.contains(HIDDEN_CLASS)) {
                        item.classList.add(HIDDEN_CLASS);
                        item.style.display = 'none';
                    }
                } catch (inner) { }
            });

            // 次に、Shorts 専用のセクション（棚）を探す: 明確にショート専用と分かるものだけを丸ごと隠す
            document.querySelectorAll('ytd-rich-shelf-renderer, ytd-rich-section-renderer').forEach(section => {
                try {
                    // セクションタイトルに 'Shorts' が含まれるか、ヘッダに /shorts/ へのリンクがある場合のみ
                    const titleNode = section.querySelector('#title, #header, h2, h3');
                    const titleText = titleNode ? titleNode.textContent || '' : '';
                    const headerShortsLink = section.querySelector('a[href^="/shorts/"]');
                    if (/shorts/i.test(titleText) || headerShortsLink) {
                        // チャンネルヘッダーを含むセクションは隠さない
                        if (channelHeader && (section.contains(channelHeader) || channelHeader.contains(section))) return;
                        if (!section.classList.contains(HIDDEN_CLASS)) {
                            section.classList.add(HIDDEN_CLASS);
                            section.style.display = 'none';
                        }
                    }
                } catch (inner) { }
            });
        } catch (e) {
            // 安全のためエラーは無視
        }
    }

    // SPA のナビゲーション（history API）に対応するため、履歴操作をフック
    function onUrlChange() {
        setTimeout(() => {
            if (isEnabled) {
                hideShortsOnce();
            }
        }, 200);
    }

    const _pushState = history.pushState;
    history.pushState = function() {
        _pushState.apply(this, arguments);
        onUrlChange();
    };
    const _replaceState = history.replaceState;
    history.replaceState = function() {
        _replaceState.apply(this, arguments);
        onUrlChange();
    };
    window.addEventListener('popstate', onUrlChange);

    // DOM 変化を監視して動的に挿入される Shorts を非表示にする
    const observer = new MutationObserver(() => {
        if (isEnabled) {
            hideShortsOnce();
        }
    });
    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    // 初回実行
    if (isEnabled) {
        hideShortsOnce();
    }

})();