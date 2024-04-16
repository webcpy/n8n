import type { INodeProperties } from 'n8n-workflow';
import { SYSTEM_MESSAGE, HUMAN_MESSAGE } from './prompt';

export const conversationalAgentProperties: INodeProperties[] = [
	{
		displayName: '文本',
		name: 'text',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				agent: ['conversationalAgent'],
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
				agent: ['conversationalAgent'],
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
				agent: ['conversationalAgent'],
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
				agent: ['conversationalAgent'],
			},
		},
		default: {},
		placeholder: '添加选项',
		options: [
			{
				displayName: '人类消息',
				name: 'humanMessage',
				type: 'string',
				default: HUMAN_MESSAGE,
				description: '提供代理使用的工具列表的消息',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '系统消息',
				name: 'systemMessage',
				type: 'string',
				default: SYSTEM_MESSAGE,
				description: '在对话开始之前发送给代理的消息',
				typeOptions: {
					rows: 6,
				},
			},
			{
				displayName: '最大迭代次数',
				name: 'maxIterations',
				type: 'number',
				default: 10,
				description: '代理在停止之前运行的最大迭代次数',
			},
			{
				displayName: '返回中间步骤',
				name: 'returnIntermediateSteps',
				type: 'boolean',
				default: false,
				description: '输出是否应包括代理执行的中间步骤',
			},
		],
	},
];
