import type { INodeProperties } from 'n8n-workflow';

import * as classify from './classify.operation';
import * as message from './message.operation';

export { classify, message };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: '向模型发送消息',
				value: 'message',
				action: '向模型发送消息',
				description: '使用GPT 3、4等创建完成',
			},
			{
				name: '对文本进行违规分类',
				value: 'classify',
				action: '对文本进行违规分类',
				description: '检查内容是否符合使用政策',
			},
		],
		default: 'message',
		displayOptions: {
			show: {
				resource: ['text'],
			},
		},
	},

	...classify.description,
	...message.description,
];
