/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

console.log('test');

export class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      try {
        PrismaService.instance = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        });
        // 在 Lambda 中验证连接
        if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
          PrismaService.instance.$connect().catch((error) => {
            console.error('Failed to connect to database:', error);
          });
        }
      } catch (error) {
        console.error('Failed to create Prisma Client:', error);
        throw error;
      }
    }
    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

// Export singleton instance for Awilix
export const createPrismaClient = (): PrismaClient => {
  if (!prismaClient) {
    prismaClient = PrismaService.getInstance();
  }
  return prismaClient;
};

// Graceful shutdown（Lambda 容器会被重用，不需要在 beforeExit 时断开）
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  process.on('beforeExit', async () => {
    await PrismaService.disconnect();
  });
}
