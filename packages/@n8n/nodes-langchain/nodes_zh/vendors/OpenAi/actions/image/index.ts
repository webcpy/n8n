import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';
import * as analyze from './analyze.operation';

export { generate, analyze };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: '分析图像',
				value: 'analyze',
				action: '分析图像',
				description: '接收图像并回答有关它们的问题',
			},
			{
				name: '生成图像',
				value: 'generate',
				action: '生成图像',
				description: '根据文本提示创建图像',
			},
		],
		default: 'generate',
		displayOptions: {
			show: {
				resource: ['image'],
			},
		},
	},

	...generate.description,
	...analyze.description,
];
