import type { IApi, IData } from "@interfaces/IApi";

export default class ApiService implements IApi {
	getInfo(): Promise<{ status: number; data: IData }> {
		return new Promise((resolve) => resolve({
			status: 200,
			data: {
				name: 'xfz-ui-bff',
				version: '1.0.0',
			},
		}));
	}
}
