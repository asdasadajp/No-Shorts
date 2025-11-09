# Save Your Time from Shorts

YouTube の Shorts を非表示にする Chrome 拡張（manifest v3）

## 概要

- 名前: Save Your Time from Shorts
- バージョン: 1.2
- 説明: YouTube の Shorts を非表示にします

## インストール（開発用）

1. このリポジトリをクローンまたはダウンロードします。
2. Chrome または Chromium ベースのブラウザで `chrome://extensions/` を開きます。
3. 右上の「デベロッパーモード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、このフォルダを選択します。

## 使い方

拡張を有効にすると、YouTube のページで Shorts が非表示になります。

## 開発

- メインファイル:
  - `manifest.json` - 拡張の設定
  - `content.js` - YouTube ページ上で Shorts を非表示にするスクリプト
  - `popup.html`, `popup.js` - 拡張のポップアップ UI

## ホスト権限

- `https://www.youtube.com/*`
- `https://youtube.com/*`

## パーミッション

- `storage` - 設定の保存
- `tabs` - タブ操作（必要に応じて）



