import { route, GET } from 'awilix-koa';
import type { Context } from 'koa';

//配置路由为 /
@route('/')
@route('/index.html')
export default class IndexController {
	@GET()
	async getList(ctx: Context): Promise<void> {
		const data = await ctx.render('index', {
			data: 'hello world',
		});
		ctx.body = data;
	}
}
