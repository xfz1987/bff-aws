### pm2 配置

```js
// ecosystem.config.js
// pm2 init
```

```json
// 不用这种了
{
  "name": "xfzapp", //项目名字
  //max_memory_restart: "300M",//设置node单个进程可占用最大的内存，如果内存使用率超过300M，pm2自动重启该进程
  "script": "app.ts", //node主入口文件
  "out_file": "logs/pm2/out.log",
  "error_file": "logs/pm2/error.log",
  "instances": "1", //让node程序占满你的cpu，发挥cpu最大的功效
  "exec_mode": "cluster", //以主进程的方式启动
  "watch": true //热启动
}
```

### prisma

```bash
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // native 是你本地环境，rhel-openssl-3.0.x 是 AWS Lambda (Node 20/22) 环境
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
因为在部署时，需要生成 prisma client，所以需要在 postinstall 中执行 prisma generate
```

sam validate --region us-west-2
