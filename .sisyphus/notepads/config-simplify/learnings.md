
## 2026-04-08: 配置接口简化 - 移除 port/host

### 发现
- `src/config.ts` 已完成修改：`ColonynoteConfig` 接口不再包含 `port` 和 `host` 字段
- `DEFAULT_PORT = 5787` 和 `DEFAULT_HOST = '0.0.0.0'` 已作为导出常量定义
- 其他文件仍在引用 `config.port` 和 `config.host`，需要后续更新：
  - `src/dev.ts:16` - 使用 `config.port`
  - `src/server/index.ts:87,88,121,122` - 使用 `config.port` 和 `config.host`

### 决策
- 将 port/host 从配置接口移至常量，使服务器配置更清晰
- 用户通过 CLI 参数控制端口，而非配置文件
