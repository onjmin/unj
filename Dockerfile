# ベースイメージ（Volta対応）
FROM node:22.13.1-bullseye

# Volta環境変数（Voltaはすでに node イメージに含まれている）
ENV VOLTA_HOME=/root/.volta
ENV PATH=$VOLTA_HOME/bin:$PATH

# Voltaを使って Node & pnpm のバージョンを固定（package.json にも必要）
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.5 --activate

# tsx をグローバル or プロジェクト依存に追加
RUN pnpm install

# 残りのファイルをコピー
COPY . .

# アプリケーションポート（必要に応じて変更）
EXPOSE 4545

# アプリのエントリポイント
CMD ["pnpm", "start"]
