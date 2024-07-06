import type { INodeProperties } from 'n8n-workflow';

export const sessionIdOption: INodeProperties = {
	displayName: '会话ID',
	name: 'sessionIdType',
	type: 'options',
	options: [
		{
			name: '自动从上一个节点获取',
			value: 'fromInput',
			description: '查找名为sessionId的输入字段',
		},
		{
			name: '在下方定义',
			value: 'customKey',
			description: '使用表达式引用前面节点中的数据或输入静态文本',
		},
	],
	default: 'fromInput',
};

export const sessionKeyProperty: INodeProperties = {
	displayName: 'Key',
	name: 'sessionKey',
	type: 'string',
	default: '',
	description: '在内存中存储会话ID所使用的键',
	displayOptions: {
		show: {
			sessionIdType: ['customKey'],
		},
	},
};
