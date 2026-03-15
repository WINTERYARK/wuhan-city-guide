# 前后端服务启停文档

本文档说明如何在本项目中启动、关闭、重启前后端服务。

## 1. 前置条件

- 已安装 Node.js（建议 v20+）
- 已执行依赖安装：

```bash
npm install
```

- 已配置环境变量（项目根目录 `.env.local`）：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_AMAP_JS_KEY`
  - `AMAP_WEB_KEY`
  - `KIMI_API_KEY`

## 2. 启动服务

### 2.1 一键同时启动（推荐）

```bash
npm run dev:all
```

默认会启动：
- 前端（Vite）：`http://localhost:3000`
- 后端（Express）：`http://localhost:3001`

---

### 2.2 分开启动

先启动后端：

```bash
npm run dev:server
```

再启动前端（新开一个终端）：

```bash
npm run dev
```

## 3. 关闭服务

### 3.1 前台运行时关闭

如果服务在当前终端前台运行，按：

```bash
Ctrl + C
```

---

### 3.2 后台运行时关闭

按端口关闭：

```bash
# 关闭前端（3000）
lsof -ti:3000 | xargs kill -9

# 关闭后端（3001）
lsof -ti:3001 | xargs kill -9
```

一次性关闭前后端：

```bash
lsof -ti:3000,3001 | xargs kill -9
```

## 4. 重启服务

推荐做法：先停后启。

```bash
# 1) 关闭旧进程
lsof -ti:3000,3001 | xargs kill -9

# 2) 重新启动
npm run dev:all
```

## 5. 健康检查

- 前端访问：
  - `http://localhost:3000`
- 后端健康检查：
  - `http://localhost:3001/api/health`

如果后端正常，`/api/health` 会返回类似：

```json
{ "status": "ok" }
```

## 6. 常见问题

### 6.1 `Port 3000 is in use` / `EADDRINUSE: 3001`

说明端口被占用。先执行：

```bash
lsof -ti:3000,3001 | xargs kill -9
```

然后重新启动服务。

### 6.2 前端白屏

优先检查：
1. `.env.local` 是否完整配置
2. 浏览器控制台是否有报错
3. 后端 `http://localhost:3001/api/health` 是否正常

### 6.3 AI 搜索或识别失败

优先检查：
1. `KIMI_API_KEY` 是否有效
2. 后端是否已启动在 `3001`
3. 终端是否有 `Kimi API error` 日志
