import { addAliases } from 'module-alias';

addAliases({
	'@root': __dirname,
	'@interfaces': `${__dirname}/interface`,
	'@config': `${__dirname}/config`,
	'@middlewares': `${__dirname}/middlewares`,
	'@services': `${__dirname}/services`,
});

import { koaBody } from 'koa-body';
import config from '@config/index';
import render from '@koa/ejs';
import { asValue, createContainer, Lifetime } from 'awilix'; //IOC
import { loadControllers, scopePerRequest } from 'awilix-koa';
import koa from 'koa';
import serve from 'koa-static';
import historyApiFallback from 'koa2-connect-history-api-fallback';
import { configure, getLogger } from 'log4js';
import errorHandler from '@middlewares/errorHandler';
import { createPrismaClient } from '@services/prisma.service';

// 创建服务实例
const app = new koa();

// 日志系统（Lambda 环境只能写入 /tmp）
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
configure({
	appenders: {
		cheese: {
			type: 'file',
			filename: isLambda ? '/tmp/server.log' : `${__dirname}/logs/server.log`
		},
	},
	categories: { default: { appenders: ['cheese'], level: 'error' } },
});

const { port, viewDir, memoryFlag, staticDir } = config;

// 配置静态文件目录（优先处理静态文件）
app.use(serve(staticDir));

// 创建IOC的容器
const container = createContainer();

// 每一次请求都是一个new model
app.use(scopePerRequest(container));

//注册 Prisma Client 到容器
try {
  container.register({
    prismaClient: asValue(createPrismaClient()),
  });
} catch (error) {
  console.error('Failed to register Prisma Client:', error);
  throw error;
}

// 装载所有的service(models), 并将services代码注入到controllers
container.loadModules([`${__dirname}/services/*{.ts,.js}`], {
	// we want `TodosService` to be registered as `todosService`.
	formatName: 'camelCase',
	resolverOptions: {
		// 1.每次new
		// 2,单例模式
		// 3.共享模式
		lifetime: Lifetime.SCOPED,
	},
});

app.use(koaBody());

// 配置log（在路由生效前）
const logger = getLogger('cheese');
// 错误处理
errorHandler.error(app, logger);

// 配置后端模版引擎
render(app, {
	root: viewDir,
	layout: false,
	viewExt: 'html',
	cache: memoryFlag,
	debug: true,
});

// 除去api以外的路由全部映射回index.html让前端路由来处理（放在最后）
app.use(historyApiFallback({ index: '/', whiteList: ['/api','/hm1'] }));

// 注册所有路由
app.use(loadControllers(`${__dirname}/routers/*{.ts,.js}`));

// 如果有需要此处可以根基环境变量，设置部署ECS、EC2服务器
if (process.env.NODE_ENV === 'development' || process.env.PLATFORM === 'ESC') {
	app.listen(port, () => {
		console.log(`Server is running on port ${port}`);
	});
}

export default app;
