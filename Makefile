# portfolio-v2 — よく使うコマンド
#
# このリポジトリは pnpm 管理。npm を打つと pnpm-lock.yaml が無視され、
# package-lock.json が復活して node_modules が平らに戻ってしまう。
# ここを経由しておけば取り違えない。

.DEFAULT_GOAL := help

.PHONY: help install dev build start \
        lint typecheck check \
        icons water-normals signature \
        clean

help:
	@echo "portfolio-v2 — make targets"
	@echo ""
	@echo "  開発 -----------------------"
	@echo "  make install         # 依存を入れる (pnpm install)"
	@echo "  make dev             # 開発サーバー (localhost:3000)"
	@echo "  make build           # 本番ビルド"
	@echo "  make start           # ビルド済みを起動"
	@echo ""
	@echo "  検証 -----------------------"
	@echo "  make typecheck       # tsc --noEmit"
	@echo "  make lint            # eslint"
	@echo "  make check           # typecheck + lint + build"
	@echo ""
	@echo "  素材の焼き直し -------------"
	@echo "  make icons           # ホーム画面のアイコン 3 枚"
	@echo "  make water-normals   # ヒーローの水面の法線マップ"
	@echo "  make signature       # ヒーローの署名 (TEXT=\"...\" で文言を変える)"
	@echo ""
	@echo "  make clean           # .next を消す"

# ── 開発 ──────────────────────────────────────────────────
install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

# ── 検証 ──────────────────────────────────────────────────
typecheck:
	pnpm typecheck

lint:
	pnpm lint

check: typecheck lint build

# ── 素材の焼き直し ────────────────────────────────────────
# 生成物はいずれもコミット済み。素材や係数を変えたときだけ叩く。
icons:
	node scripts/generate-app-icons.mjs

water-normals:
	node scripts/generate-water-normals.mjs

TEXT ?= You Only Live Once

signature:
	node scripts/generate-hero-signature.mjs "$(TEXT)"

# ── 後始末 ────────────────────────────────────────────────
clean:
	rm -rf .next
