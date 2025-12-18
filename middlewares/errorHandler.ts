/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import type Koa from 'koa';
import type { Context } from 'koa';
import type { Logger } from 'log4js';

export default class errorHandler {
	static error(app: Koa, logger: Logger) {
		// 500
		app.use(async (ctx: Context, next: () => Promise<unknown>) => {
			try {
				await next();
			} catch (error) {
				logger.error(error);
				ctx.status = 500;
				await ctx.render('500', {
					errorMessage: error.stack,
				});
			}
		});

		//404
		app.use(async (ctx: Context, next: () => Promise<unknown>) => {
			await next();
			if (404 !== ctx.status) return;
			ctx.status = 404;
			await ctx.render('404');
		});
	}
}
