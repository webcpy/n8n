import type { INodeProperties } from 'n8n-workflow';

import * as generate from './generate.operation';
import * as transcribe from './transcribe.operation';
import * as translate from './translate.operation';

export { generate, transcribe, translate };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: '生成音频',
				value: 'generate',
				action: '生成音频',
				description: '从文本提示创建音频',
			},
			{
				name: '转录录音',
				value: 'transcribe',
				action: '转录录音',
				description: '将音频转录为文本',
			},
			{
				name: '翻译录音',
				value: 'translate',
				action: '翻译录音',
				description: '将音频翻译成英文文本',
			},
		],
		default: 'generate',
		displayOptions: {
			show: {
				resource: ['audio'],
			},
		},
	},
	{
		displayName: 'OpenAI API限制音频文件大小为25 MB',
		name: 'fileSizeLimitNotice',
		type: 'notice',
		default: ' ',
		displayOptions: {
			show: {
				resource: ['audio'],
				operation: ['translate', 'transcribe'],
			},
		},
	},

	...generate.description,
	...transcribe.description,
	...translate.description,
];
