# telegram-pwd-bot

A tiny Telegram bot that prints the current chat's info when you send `/pwd`.

Telegram (unlike Discord) has no "copy chat ID" UI, which makes wiring up bots
and automations annoying. This bot fills that gap.

## What `/pwd` shows

```
chat_id:   -1001234567890
thread_id: 17585          (forum topics only)
user_id:   1102654295
username:  myroom          (if public)
title:     my room
type:      supergroup
```

## Stack

- [Bun](https://bun.sh) + TypeScript
- [grammY](https://grammy.dev) Telegram bot framework
- Long polling (no public endpoint / webhook needed)

## Local development

```bash
bun install
cp .env.example .env   # put your BotFather token in BOT_TOKEN
bun run dev            # watch mode
```

## Build & run with Docker

```bash
docker build -t telegram-pwd-bot .
docker run -e BOT_TOKEN=... telegram-pwd-bot
```

## Deploy

Container images are published to `ghcr.io/krisamin/telegram-pwd-bot` via GitHub
Actions on every push to `main`. Kubernetes manifests for the popstar homelab
live in [`deploy/`](./deploy).

> Long polling requires **exactly one** running instance — keep `replicas: 1`.
