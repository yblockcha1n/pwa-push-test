# ローカル環境セットアップ手順

## 前提条件

- Node.js 18+
- Mac と iPhone が同じ Wi-Fi に接続されていること
- iPhone: iOS 16.4 以上

## 1. 依存パッケージのインストール

```bash
npm install
```

## 2. 環境変数の設定

### VAPID鍵の生成

```bash
npx web-push generate-vapid-keys --json
```

### Supabaseプロジェクトの準備

Supabase ダッシュボードで以下のSQLを実行してテーブルを作成する：

```sql
create table push_subscriptions (
  endpoint text primary key,
  keys_p256dh text not null,
  keys_auth text not null,
  created_at timestamptz default now()
);
```

### .env.local に設定

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
VAPID_PRIVATE_KEY=<privateKey>
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

Supabase の URL と Service Role Key は、Supabase ダッシュボードの **Settings** → **API** から取得できる。

## 3. HTTPS開発サーバーの起動

Push通知にはHTTPSが必須。Next.jsの実験的HTTPS機能を使用する：

```bash
npx next dev --experimental-https
```

初回実行時に mkcert がインストールされ、自己署名証明書が生成される。
Mac のパスワード入力を求められる場合がある。

起動後、以下のURLでアクセス可能：
- PC: https://localhost:3000
- iPhone: https://<MacのローカルIP>:3000（例: https://192.168.0.100:3000）

MacのローカルIPは `ifconfig | grep "inet "` で確認できる。

## 4. iPhoneにCA証明書をインストール

iPhoneからローカルサーバーにHTTPSアクセスするには、mkcertのルートCA証明書をインストールする必要がある。

### 4-1. 証明書ファイルの場所

```
~/Library/Application Support/mkcert/rootCA.pem
```

プロジェクトルートにもコピー済み：`rootCA.pem`

### 4-2. iPhoneに送る

AirDrop、メール、iMessage 等で `rootCA.pem` をiPhoneに送信する。

### 4-3. プロファイルのインストール

1. iPhone でファイルを開く → 「プロファイルがダウンロードされました」と表示される
2. **設定** → **一般** → **VPNとデバイス管理** → ダウンロードしたプロファイル（mkcert）をタップ → **インストール**

### 4-4. 証明書の信頼を有効にする（重要）

3. **設定** → **一般** → **情報** → 一番下の **証明書信頼設定** → mkcert の証明書を **オン** にする

> この手順を忘れるとHTTPS接続時に警告が出てアクセスできない。

## 5. PCブラウザでのテスト

1. https://localhost:3000 にアクセス
2. 「Subscribe to Push」ボタンをクリック → 通知許可を許可
3. 「Send Test Notification」ボタンをクリック → 通知が届く

## 6. iPhoneでのテスト

### 6-1. PWAとしてインストール

1. iPhone の Safari で `https://<MacのローカルIP>:3000` にアクセス
2. 画面下部の **共有ボタン**（□↑）をタップ
3. **ホーム画面に追加** をタップ
4. 名前を確認して **追加** をタップ

### 6-2. Push通知のテスト

1. ホーム画面から追加したアプリ（PWA Push Test）を開く
2. 「Subscribe to Push」ボタンをタップ → 通知許可ダイアログで **許可**
3. 「Send Test Notification」ボタンをタップ → 通知が届く

> **注意**: iOS では Safari ブラウザ上からは Push 通知が動作しない。必ずホーム画面に追加した PWA から操作すること。

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| iPhoneでHTTPS警告が出る | 手順4の証明書インストール・信頼設定を確認 |
| Subscribe時に Permission denied | ホーム画面に追加した PWA から開いているか確認 |
| Send後に通知が届かない | Supabase に購読データがあるか確認 |
| SW: No と表示される | HTTPS でアクセスしているか確認 |
| Debug Logに何も出ない | ページをリロードして確認 |
