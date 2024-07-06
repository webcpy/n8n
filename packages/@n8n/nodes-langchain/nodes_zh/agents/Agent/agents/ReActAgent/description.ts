import type { INodeProperties } from 'n8n-workflow';
import { HUMAN_MESSAGE_TEMPLATE, PREFIX, SUFFIX, SUFFIX_CHAT } from './prompt';

export const reActAgentAgentProperties: INodeProperties[] = [
	{
		displayName: '文本',
		name: 'text',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				agent: ['reActAgent'],
				'@version': [1],
			},
		},
		default: '={{ $json.input }}',
	},
	{
		displayName: '文本',
		name: 'text',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				agent: ['reActAgent'],
				'@version': [1.1],
			},
		},
		default: '={{ $json.chat_input }}',
	},
	{
		displayName: '文本',
		name: 'text',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				agent: ['reActAgent'],
				'@version': [1.2],
			},
		},
		default: '={{ $json.chatInput }}',
	},
	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				agent: ['reActAgent'],
			},
		},
		default: {},
		placeholder: '添加选项',
		options: [
			{
				displayName: '人类消息模板',
				name: 'humanMessageTemplate',
				type: 'string',
				default: HUMAN_MESSAGE_TEMPLATE,
				description: '直接用作人类消息模板的字符串',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '前缀消息',
				name: 'prefix',
				type: 'string',
				default: PREFIX,
				description: '工具列表之前要放置的字符串',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '用于聊天模型的后缀消息',
				name: 'suffixChat',
				type: 'string',
				default: SUFFIX_CHAT,
				description: '如果使用聊天模型，要在将使用的工具列表之后放置的字符串',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '用于常规模型的后缀消息',
				name: 'suffix',
				type: 'string',
				default: SUFFIX,
				description: '如果使用常规模型，要在将使用的工具列表之后放置的字符串',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '返回中间步骤',
				name: 'returnIntermediateSteps',
				type: 'boolean',
				default: false,
				description: '输出是否应包含代理执行的中间步骤',
			},
		],
	},
];
