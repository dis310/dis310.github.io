# NexaLineOS

一个纯前端 H5 WebOS 原型，包含：
- 开机动画
- 用户登录
- 桌面图标
- 右下角导入 URL
- WinBox 窗口打开网页
- `localStorage` 持久化应用配置和登录状态

## 默认账号
- 用户名: `dis310`
- 密码: `123456`

## 启动方式
必须通过本地 HTTP 服务打开，不能直接双击 `index.html`。

例如：
```bash
python -m http.server 8080
```

然后访问：
```text
http://localhost:8080
```

## 说明
- 导入的是网页 URL，桌面会保存配置，下次打开会自动恢复图标和登录状态。
- 某些网站禁止被 iframe 嵌入，如果网页无法显示，这是目标站点的安全限制，不是本项目本身的问题。
