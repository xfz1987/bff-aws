
export type IData = {
    name: string;
    version: string;
}

export interface IApi {
  getInfo(): Promise<{ status: number; data: IData }>;
}