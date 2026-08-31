# 生产部署

生产后端由 GitHub Actions 自动构建和部署。服务器不手工维护 `.env`；敏感值统一保存在 GitHub `production` Environment Secrets 中。

部署过程如下：

1. 构建不包含任何 Secret 的 Docker 镜像并推送至 GHCR。
2. 部署任务读取 `production` Environment Secrets。
3. 在 GitHub Runner 上生成权限为 `600` 的临时 `.env.production`。
4. 将 Compose 文件和临时配置同步到服务器。
5. 拉取并启动精确 commit SHA 对应的镜像。
6. 部署结束后从服务器删除临时配置并退出 GHCR。

Secrets 不会作为 Docker build argument，也不会进入镜像层或构建缓存。

## GitHub Environment

在 GitHub 仓库进入 **Settings → Environments → New environment**，创建 `production`。建议启用 required reviewers，然后配置以下 Environment Secrets。

### 部署连接

| Secret        | 是否必填 | 说明           |
| ------------- | -------- | -------------- |
| `DEPLOY_HOST` | 是       | 服务器地址     |
| `DEPLOY_USER` | 是       | SSH 用户       |
| `DEPLOY_KEY`  | 是       | SSH 私钥       |
| `DEPLOY_PATH` | 是       | 服务器部署目录 |

### 数据库与服务

| Secret                | 是否必填 | 说明                                                 |
| --------------------- | -------- | ---------------------------------------------------- |
| `MYSQL_ROOT_PASSWORD` | 是       | MySQL 当前 root 密码；已有数据卷时必须与现有密码一致 |
| `BASE_URL`            | 是       | 完整 API 地址，例如 `https://api.example.com`        |
| `API_DOMAIN`          | 是       | 不带协议的域名，例如 `api.example.com`               |
| `JWT_SECRET`          | 是       | JWT 签名密钥                                         |
| `JWT_EXPIRES_IN`      | 否       | 默认 `7d`                                            |

### 管理后台

| Secret                | 是否必填 | 说明                        |
| --------------------- | -------- | --------------------------- |
| `ADMIN_EMAIL`         | 是       | 后台管理员邮箱              |
| `ADMIN_PASSWORD`      | 是       | 后台密码，至少 12 位        |
| `ADMIN_COOKIE_SECRET` | 是       | Cookie 签名密钥，至少 32 位 |

可通过以下命令生成 Cookie 密钥：

```bash
openssl rand -base64 48
```

### 微信小程序

| Secret                        | 是否必填 | 说明              |
| ----------------------------- | -------- | ----------------- |
| `WECHAT_APPID`                | 是       | 微信小程序 AppID  |
| `WECHAT_SECRET`               | 是       | 微信小程序 Secret |
| `WECHAT_REMINDER_TEMPLATE_ID` | 否       | 订阅消息模板 ID   |

### AI 服务

| Secret             | 是否必填 | 说明                                                |
| ------------------ | -------- | --------------------------------------------------- |
| `AI_API_KEY`       | 是       | AI 服务密钥                                         |
| `AI_API_URL`       | 是       | AI 服务地址                                         |
| `AI_MODEL`         | 是       | 模型名称                                            |
| `AI_API_FORMAT`    | 否       | `openai`、`dashscope` 或 `anthropic`，默认 `openai` |
| `AI_SYSTEM_PROMPT` | 否       | 单行系统提示词                                      |

### 内容安全

| Secret                       | 是否必填 | 说明         |
| ---------------------------- | -------- | ------------ |
| `CONTENT_SECURITY_SKIP`      | 否       | 默认 `false` |
| `CONTENT_SECURITY_FAIL_SAFE` | 否       | 默认 `true`  |

## 触发部署

以下路径的变更推送至 `master` 或 `main` 后会自动部署：

- `server/**`
- `.github/workflows/build-and-push.yml`
- `.github/scripts/render-production-env.mjs`

也可以从 GitHub Actions 页面手动触发 `Build, Push and Deploy`。

## 服务器前置条件

- Docker Engine 与 Docker Compose v2
- 已创建名为 `proxy` 的外部 Docker 网络
- Traefik 已连接 `proxy` 网络，并配置 `websecure` entrypoint 和 `letsencrypt` certificate resolver
- `DEPLOY_PATH` 对部署用户可写
- SSH 用户能够运行 Docker 命令

首次部署前创建外部网络：

```bash
docker network create proxy
```

## 日常运维

服务器上的 `server/scripts/deploy.sh` 仅保留只读运维操作，不再用于更新部署：

```bash
./scripts/deploy.sh status
./scripts/deploy.sh logs
./scripts/deploy.sh migrate
```

生产部署和配置更新统一从 GitHub Actions 发起。

## 注意事项

- 已存在 MySQL 数据卷时，不要随意修改 `MYSQL_ROOT_PASSWORD`。仅改变容器环境变量不会自动修改数据库中已经生效的密码。
- 修改 `JWT_SECRET` 会让现有用户 Token 失效。
- 修改 `ADMIN_COOKIE_SECRET` 会让现有后台会话失效。
- `API_DOMAIN` 只填写域名，不包含 `https://` 或路径。
- `AI_SYSTEM_PROMPT` 必须是单行值。
- GitHub 自动提供的 `GITHUB_TOKEN` 无需手工创建 Secret。
