// popup.js - ポップアップUIのロジック
document.addEventListener('DOMContentLoaded', () => {
    // 要素を取得（存在しなければ安全に終了）
    const hideBtn = document.getElementById('hideBtn');
    const showBtn = document.getElementById('showBtn');
    const status = document.getElementById('status');
    if (!hideBtn || !showBtn || !status) {
        // 開発時に popup.html を直接開くなどした場合に備え、安全に終了
        return;
    }

    // storage の抽象化：chrome.storage が無ければ localStorage を使う
    const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) ? chrome.storage.sync : {
        get(keys, cb) {
            const result = {};
            keys.forEach(k => { result[k] = (localStorage.getItem(k) !== null) ? JSON.parse(localStorage.getItem(k)) : undefined; });
            cb(result);
        },
        set(obj, cb) {
            Object.keys(obj).forEach(k => localStorage.setItem(k, JSON.stringify(obj[k])));
            if (cb) cb();
        }
    };

    // 現在の設定を読み込んでUIを更新
    function loadSettings() {
        try {
            storage.get(['shortsEnabled'], (result) => {
                const isEnabled = result && result.shortsEnabled !== undefined ? result.shortsEnabled : true;
                updateUI(isEnabled);
            });
        } catch (e) {
            updateUI(true);
        }
    }

    // UIを更新
    function updateUI(isEnabled) {
        if (isEnabled) {
            hideBtn.classList.add('active');
            showBtn.classList.remove('active', 'show');
            status.innerHTML = `
                <div class="status-icon">✅</div>
                <div class="status-text">Shortsを非表示中</div>
                <div class="status-desc">時間を有効活用できています</div>
            `;
        } else {
            showBtn.classList.add('active', 'show');
            hideBtn.classList.remove('active');
            status.innerHTML = `
                <div class="status-icon">👁️</div>
                <div class="status-text">Shortsを表示中</div>
                <div class="status-desc">通常モードで動作しています</div>
            `;
        }
    }

    // タブへメッセージを送るユーティリティ（chrome.tabs が無い場合は無視）
    function broadcastMessage(payload) {
        if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) return;
        try {
            chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
                tabs.forEach(tab => {
                    try { chrome.tabs.sendMessage(tab.id, payload); } catch (e) { }
                });
            });
        } catch (e) { }
    }

    // 非表示ボタンクリック
    hideBtn.addEventListener('click', () => {
        storage.set({ shortsEnabled: true }, () => {
            updateUI(true);
            broadcastMessage({ action: 'enableShorts' });
        });
    });

    // 表示ボタンクリック
    showBtn.addEventListener('click', () => {
        storage.set({ shortsEnabled: false }, () => {
            updateUI(false);
            broadcastMessage({ action: 'disableShorts' });
        });
    });

    // 初期化
    loadSettings();
});