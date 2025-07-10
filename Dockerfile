FROM node:22.13.1-bullseye

# 作業ディレクトリを作成
WORKDIR /app

# Volta環境変数（なくてもよいが互換のため残しても可）
ENV VOLTA_HOME=/root/.volta
ENV PATH=$VOLTA_HOME/bin:$PATH

# Corepackまわりを使わず、pnpmを直接インストール
RUN npm install -g pnpm@9.15.5

# package.json と lockfile をコピー
COPY package.json pnpm-lock.yaml ./

# 依存関係のインストール
RUN pnpm install

# アプリケーションコードをコピー
COPY . .

# ポート番号（必要に応じて変更）
EXPOSE 3000

# アプリケーション起動
CMD ["pnpm", "start"]
