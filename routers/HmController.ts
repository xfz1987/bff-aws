import { route, GET } from 'awilix-koa';
import type { Context } from 'koa';

@route('/hm1')
@route('/hm1.html')
export default class IndexController {
  @GET()
  async getList(ctx: Context): Promise<void> {
    const data = await ctx.render('hm1');
    ctx.body = data;
  }
}
