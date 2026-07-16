# 安全说明

- SQLite 数据仅存本机；不要将其部署到 Vercel 或公开网络。
- `SERPER_API_KEY` 只在 Node 服务端读取；应用不会显示或记录密钥。
- 旧数据备份含潜在隐私信息，应以本地受保护方式保存。
- 应用不自动外联、不猜联系人、不绕过登录或 CAPTCHA。
- URL Evidence 仅接受 HTTP/HTTPS；手工录入不会触发任意 URL 抓取。
- 所有迁移、来源和 API 错误都返回安全摘要，不返回 SQLite 原始错误或请求完整内容。
