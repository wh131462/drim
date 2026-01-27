---
name: smart-commit
description: 智能分组提交代码。按功能/模块划分未提交的代码，分批次有条理地 commit。当用户提到"提交"、"commit"、"分组提交"时使用。
---

# 智能分组提交

按功能或模块划分当前未提交的代码，分批次创建有条理的 commit 记录。

## 核心约束

1. **禁止 AI 共同作者信息** - commit message 中不得包含任何 `Co-Authored-By` 或类似的 AI 生成标识
2. **使用 git config 作者** - 保持当前 git 配置的 user.name 和 user.email 作为提交作者
3. **代码安全优先** - 遇到 husky 预处理失败时，必须确保代码不丢失
4. **原子化提交** - 每个 commit 应该是一个独立的功能单元
5. **遵守 commitlint** - 本项目使用 `@commitlint/config-conventional`，commit message 必须符合规范

## 执行流程

### 第一步：收集信息

```bash
# 查看当前 git 用户配置
git config user.name
git config user.email

# 查看所有未提交的变更（不使用 -uall 避免大仓库内存问题）
git status

# 查看未暂存的变更
git diff --stat

# 查看已暂存的变更
git diff --cached --stat

# 查看最近的 commit 风格
git log --oneline -10
```

### 第二步：分析变更并分组

根据以下维度对变更进行分组：

1. **按目录/模块分组**（本项目 monorepo 结构）
    - `src/` - 前端 uni-app 项目（scope: `client`）
        - `src/pages/` - 页面组件
        - `src/components/` - 公共组件
        - `src/api/` - API 接口层
        - `src/stores/` - Pinia 状态管理
        - `src/composables/` - 组合式函数
        - `src/styles/` - 样式文件
        - `src/static/` - 静态资源
        - `src/utils/` - 工具函数
        - `src/types/` - 类型定义
        - `src/constants/` - 常量定义
    - `server/` - 后端 NestJS 项目（scope: `server`）
        - `server/src/modules/` - 业务模块（user, dream, analysis, task, points, vip, explore, polish, version, achievement, settings, scheduler, ad, export, privilege）
        - `server/src/common/` - 通用功能（guards, filters, interceptors, decorators, pipes）
        - `server/src/shared/` - 共享服务（ai, cache, logger, wechat）
        - `server/prisma/` - 数据库 schema 和迁移
    - `design/` - 设计资源
    - `scripts/` - 脚本工具
    - `docs/` - 项目文档
    - `.claude/` - Claude 配置
    - 根目录配置文件（package.json, tsconfig.json, vite.config.ts, eslint 配置等）

2. **按功能类型分组**
    - `feat` - 新功能
    - `fix` - bug 修复
    - `refactor` - 代码重构
    - `style` - 样式/格式调整
    - `docs` - 文档更新
    - `chore` - 构建/工具/配置变更
    - `test` - 测试相关
    - `perf` - 性能优化

3. **按业务功能分组**
    - 识别相关联的文件（如页面 + API + Store + 类型定义）
    - 将同一功能的前后端变更可根据情况合并或拆分
    - 同一模块的 controller + service + dto 变更归为一组

### 第三步：与用户确认分组方案

向用户展示分组方案并确认：

```
建议将变更分为以下 N 个 commit:

1. feat(server): 添加 XXX 模块
   - server/src/modules/xxx/xxx.controller.ts
   - server/src/modules/xxx/xxx.service.ts

2. feat(client): XXX 页面
   - src/pages/xxx/index.vue
   - src/api/modules/xxx.ts

3. chore: 更新项目配置
   - package.json
   - vite.config.ts

请确认或调整分组方案。
```

### 第四步：逐个提交

对每个分组执行：

```bash
# 1. 先重置暂存区（如果需要）
git reset HEAD

# 2. 添加该分组的文件
git add <file1> <file2> ...

# 3. 提交（不带 Co-Authored-By）
git commit -m "<type>(<scope>): <description>"
```

## Commit Message 规范

### 格式（遵循 conventional commits + 本项目风格）

```
<type>(<scope>): <简短中文描述>
```

或不带 scope（跨模块或通用变更）：

```
<type>: <简短中文描述>
```

### Scope 约定

| Scope    | 适用范围                     |
| -------- | ---------------------------- |
| client   | 前端 `src/` 目录下的变更     |
| server   | 后端 `server/` 目录下的变更  |
| 无 scope | 根目录配置、跨前后端、文档等 |

### Type 类型

| Type     | 说明                   |
| -------- | ---------------------- |
| feat     | 新功能                 |
| fix      | Bug 修复               |
| refactor | 代码重构（不改变功能） |
| style    | 样式/格式调整          |
| docs     | 文档变更               |
| test     | 测试相关               |
| chore    | 构建/工具变更          |
| perf     | 性能优化               |

### 示例（参考本项目历史）

```
feat(server): 核心业务模块
feat(server): 扩展业务模块
feat(client): 页面和组件
feat(client): api 层和状态管理
style: 样式系统和静态资源
docs: 完善项目文档
chore: 项目配置和 monorepo 设置
```

## 错误处理：Husky 预处理失败

本项目的 git hooks 流程：

- **pre-commit**: 运行 `lint-staged`（对暂存文件执行 prettier + eslint）
- **commit-msg**: 运行 `commitlint`（校验 commit message 格式）

### 1. 保存当前状态

```bash
# 查看当前暂存的文件
git diff --cached --name-only

# 创建临时 stash 备份（包含暂存和未暂存）
git stash push -m "backup-before-fix-$(date +%Y%m%d-%H%M%S)"
```

### 2. 分析失败原因

**lint-staged 失败**（pre-commit hook）：

lint-staged 会对暂存文件执行以下操作：

- `*.{js,ts,jsx,tsx,vue,mjs,cjs}` → `prettier --write` + `eslint --fix`
- `*.{html,css,scss,less,json,md,yaml,yml}` → `prettier --write`

```bash
# 手动检查 eslint 问题（前端）
pnpm eslint --no-error-on-unmatched-pattern <暂存的文件>

# 手动检查 eslint 问题（后端）
cd server && pnpm lint
```

**commitlint 失败**（commit-msg hook）：

commit message 必须符合 conventional commits 格式。常见错误：

- 缺少 type 前缀
- type 不在允许列表中
- 格式不正确（如多了空格、缺少冒号后的空格）

### 3. 修复问题

```bash
# 自动格式化
npx prettier --write <文件列表>

# 自动修复 eslint
npx eslint --fix <文件列表>
```

### 4. 恢复并重新提交

```bash
# 恢复 stash
git stash pop

# 重新添加文件（包含修复后的变更）
git add <files>

# 重新提交（确保 message 格式正确）
git commit -m "<type>(<scope>): <description>"
```

### 5. 如果修复失败

```bash
# 确保 stash 中有备份
git stash list

# 可以随时恢复
git stash apply stash@{0}
```

## 安全措施

1. **提交前备份**
    - 每次提交前确认变更内容
    - 复杂操作前创建 stash 备份

2. **分步执行**
    - 不要一次性添加所有文件
    - 每个 commit 后验证状态

3. **回滚方案**

    ```bash
    # 撤销最后一次 commit（保留变更）
    git reset --soft HEAD~1

    # 撤销 add（保留变更）
    git reset HEAD <file>
    ```

## 禁止事项

- **禁止** 在 commit message 中添加 `Co-Authored-By: Claude` 或任何 AI 相关信息
- **禁止** 修改 git config 的 user 信息
- **禁止** 使用 `--amend` 修改已推送的 commit
- **禁止** 使用 `--force` 强制推送
- **禁止** 跳过 hooks（`--no-verify`）除非用户明确要求
- **禁止** 在没有备份的情况下执行可能丢失代码的操作

## 输出格式

每次提交后输出：

```
✓ Commit 1/N: <commit message>
  - <file1>
  - <file2>
  SHA: <short-sha>

✓ Commit 2/N: <commit message>
  ...

提交完成！共创建 N 个 commit。
```
