import { join } from 'node:path';
import _ from 'lodash';

let config = {
	viewDir: join(__dirname, '..', 'views'),
	staticDir: join(__dirname, '..', 'assets'),
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
	memoryFlag: false,
	// API Gateway stage 前缀
	apiPrefix: process.env.AWS_LAMBDA_FUNCTION_NAME ? '/dev' : '',
};

if (process.env.NODE_ENV === 'development') {
	const localConfig = {
		port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
	};
	config = _.assignIn(config, localConfig);
}

if (process.env.NODE_ENV === 'production') {
	const proConfig = {
		port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8082,
		memoryFlag: 'memory',
	};
	config = _.assignIn(config, proConfig);
}

export default config;
