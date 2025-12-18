import type { IApi } from '@interfaces/IApi';
import { GET, route } from 'awilix-koa';
import type { Context } from 'koa';

@route('/api')
export default class ApiController {
	public apiService: IApi;
	// 注入 ApiService
	constructor({ apiService }: { apiService: IApi }) {
		this.apiService = apiService;
	}

	@route('/list')
	@GET()
	async test(ctx: Context) {
		const data = await this.apiService.getInfo();
		ctx.body = { data };
	}
}
