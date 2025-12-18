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
