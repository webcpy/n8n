import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as deleteAssistant from './deleteAssistant.operation';
import * as message from './message.operation';
import * as list from './list.operation';
import * as update from './update.operation';

export { create, deleteAssistant, message, list, update };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',

		type: 'options',
		noDataExpression: true,
		// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
		options: [
			{
				name: '创建助手',
				value: 'create',
				action: '创建一个助手',
				description: '创建一个新的助手',
			},
			{
				name: '删除助手',
				value: 'deleteAssistant',
				action: '删除一个助手',
				description: '从账户中删除一个助手',
			},
			{
				name: '列出助手',
				value: 'list',
				action: '列出助手',
				description: '列出组织中的助手',
			},
			{
				name: '给助手发送消息',
				value: 'message',
				action: '给助手发送消息',
				description: '向一个助手发送消息',
			},
			{
				name: '更新助手',
				value: 'update',
				action: '更新一个助手',
				description: '更新现有的助手',
			},
		],
		default: 'message',
		displayOptions: {
			show: {
				resource: ['assistant'],
			},
		},
	},

	...create.description,
	...deleteAssistant.description,
	...message.description,
	...list.description,
	...update.description,
];
