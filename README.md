# PWA Push Test

![Next.js 16.1](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React 19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase)
![Web Push](https://img.shields.io/badge/Web_Push-VAPID-FF6F00)
![Vercel Deploy](https://img.shields.io/badge/Vercel-Deploy-000?logo=vercel)

iOS PWA の Web Push 通知動作を検証するためのテストアプリケーション。ボタンを押すだけでPush通知の送受信をテストできるシンプルな構成。

---

## 目次

- [技術スタック](#技術スタック)
- [システム構成](#システム構成)
- [機能一覧](#機能一覧)
- [ディレクトリ構成](#ディレクトリ構成)
- [セットアップ](#セットアップ)
- [環境変数](#環境変数)
- [開発コマンド](#開発コマンド)
- [iPhoneでのテスト](#iphoneでのテスト)
- [デプロイ](#デプロイ)

---

## 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.1 |
| UIライブラリ | React | 19.2 |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 4.x |
| Push通知 | Web Push (VAPID) | 3.6 |
| データベース | Supabase (PostgreSQL) | - |
| 認証 | Basic認証 (Proxy) | - |
| フォント | Geist Sans | - |

---

## システム構成

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│  Vercel Edge │────▶│  Next.js App    │
│  / iOS PWA   │     │  (Proxy)     │     │  Router         │
└─────────────┘     └──────────────┘     └─────────────────┘
       │                    │
       │              Basic Auth
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Service Worker (sw.js)                         │
│  └─▶ Push Event → showNotification             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  API Routes                                     │
│  ├─ POST /api/push/subscribe → Supabase 保存    │
│  └─ POST /api/push/send     → web-push 送信     │
└─────────────────────────────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────┐            ┌──────────────────┐
│  Supabase    │            │  Push Service    │
│  (購読管理)   │            │  (FCM / APNs)    │
└──────────────┘            └──────────────────┘
```

- **Service Worker**: Push イベント受信 → 通知表示
- **VAPID認証**: サーバーからの Push 送信を認証
- **Supabase**: Push購読データの永続化（Vercelサーバーレス対応）
- **Basic認証**: `proxy.ts` でサイト全体を保護

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| Push通知購読 | ブラウザ Push API で購読 → Supabase に保存 |
| テスト通知送信 | ボタン1つで全購読者にPush通知を送信 |
| Service Worker | Push受信 → 通知表示、通知クリック → アプリフォーカス |
| PWAマニフェスト | ホーム画面追加対応（iOS standalone モード） |
| 環境情報表示 | iOS判定、Standalone判定、SW/Push対応状況をリアルタイム表示 |
| デバッグログ | 全イベントをタイムスタンプ付きでログ表示 |
| iOS警告バナー | Safari（非PWA）からのアクセス時にホーム画面追加を案内 |
| Basic認証 | proxy.ts によるサイト全体の保護 |

---

## ディレクトリ構成

```text
src/
├── app/
│   ├── layout.tsx                     # ルートレイアウト（PWAメタデータ）
│   ├── page.tsx                       # Push通知テストUI
│   ├── globals.css                    # Tailwind v4 テーマ
│   ├── manifest.ts                    # Web App Manifest
│   └── api/
│       └── push/
│           ├── subscribe/route.ts     # 購読保存 API
│           └── send/route.ts          # 通知送信 API
├── lib/
│   ├── supabase.ts                    # Supabase クライアント
│   └── subscriptions.ts              # 購読データ CRUD
├── types/
│   └── web-push.d.ts                  # web-push 型定義
└── proxy.ts                           # Basic認証

public/
├── sw.js                              # Service Worker
├── icon-192.png                       # PWA アイコン 192x192
└── icon-512.png                       # PWA アイコン 512x512

supabase/
└── migrations/
    └── 20260302000001_create_push_subscriptions.sql

md/
└── LOCAL_SETUP.md                     # ローカル環境セットアップ手順
```

---

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# VAPID 鍵を生成
npx web-push generate-vapid-keys --json

# 環境変数を設定
# .env.local を作成して各値を設定（下記「環境変数」参照）

# Supabase でテーブルを作成
# supabase/migrations/20260302000001_create_push_subscriptions.sql を実行

# HTTPS 開発サーバーを起動（Push通知にはHTTPS必須）
npx next dev --experimental-https
```

ブラウザで https://localhost:3000 を開いてください。

---

## 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | VAPID 公開鍵（クライアント側で使用） |
| `VAPID_PRIVATE_KEY` | Yes | VAPID 秘密鍵（サーバー側で使用） |
| `SUPABASE_URL` | Yes | Supabase プロジェクト URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase Service Role Key |
| `BASIC_AUTH_USER` | Yes | Basic認証 ユーザー名 |
| `BASIC_AUTH_PASSWORD` | Yes | Basic認証 パスワード |

---

## 開発コマンド

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動（HTTP） |
| `npx next dev --experimental-https` | HTTPS 開発サーバー起動（Push通知テスト用） |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint によるコード検査 |

---

## iPhoneでのテスト

### 前提条件

- iOS 16.4 以上
- Mac と iPhone が同じ Wi-Fi に接続

### CA証明書のインストール

HTTPS 開発サーバーの自己署名証明書をiPhoneに信頼させる必要がある。

1. `~/Library/Application Support/mkcert/rootCA.pem` をAirDrop等でiPhoneに送信
2. **設定** → **一般** → **VPNとデバイス管理** → プロファイルをインストール
3. **設定** → **一般** → **情報** → **証明書信頼設定** → mkcert を **オン**

### PWAとしてテスト

1. Safari で `https://<MacのIP>:3000` にアクセス
2. **共有ボタン** → **ホーム画面に追加**
3. ホーム画面からアプリを起動
4. 「Subscribe to Push」→ 通知許可 → 「Send Test Notification」

> **注意**: iOS では Safari ブラウザ上からは Push 通知が動作しない。必ずホーム画面に追加した PWA から操作すること。

---

## デプロイ

### Vercel（推奨）

1. [Vercel](https://vercel.com) にリポジトリを接続
2. 環境変数をすべて設定（上記「環境変数」参照）
3. デプロイ（自動ビルド）

Vercel は HTTPS を自動提供するため、証明書の設定は不要。

### その他

```bash
npm run build
npm run start
```

---

Built with Next.js 16 + React 19 + Tailwind CSS 4
