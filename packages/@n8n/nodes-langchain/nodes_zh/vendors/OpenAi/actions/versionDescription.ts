/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

import * as assistant from './assistant';
import * as audio from './audio';
import * as file from './file';
import * as image from './image';
import * as text from './text';

const prettifyOperation = (resource: string, operation: string) => {
	if (operation === 'deleteAssistant') {
		return 'Delete Assistant';
	}

	if (operation === 'deleteFile') {
		return 'Delete File';
	}

	if (operation === 'classify') {
		return 'Classify Text';
	}

	if (operation === 'message' && resource === 'text') {
		return 'Message Model';
	}

	const capitalize = (str: string) => {
		const chars = str.split('');
		chars[0] = chars[0].toUpperCase();
		return chars.join('');
	};

	if (['transcribe', 'translate'].includes(operation)) {
		resource = 'recording';
	}

	if (operation === 'list') {
		resource = resource + 's';
	}

	return `${capitalize(operation)} ${capitalize(resource)}`;
};

const configureNodeInputs = (resource: string, operation: string, hideTools: string) => {
	if (resource === 'assistant' && operation === 'message') {
		return [
			{ type: NodeConnectionType.Main },
			{ type: NodeConnectionType.AiTool, displayName: 'Tools' },
		];
	}
	if (resource === 'text' && operation === 'message') {
		if (hideTools === 'hide') {
			return [NodeConnectionType.Main];
		}
		return [
			{ type: NodeConnectionType.Main },
			{ type: NodeConnectionType.AiTool, displayName: 'Tools' },
		];
	}

	return [NodeConnectionType.Main];
};

// eslint-disable-next-line n8n-nodes-base/node-class-description-missing-subtitle
export const versionDescription: INodeTypeDescription = {
	displayName: 'OpenAI',
	name: 'openAi',
	icon: 'file:openAi.svg',
	group: ['transform'],
	version: [1, 1.1, 1.2, 1.3],
	subtitle: `={{(${prettifyOperation})($parameter.resource, $parameter.operation)}}`,
	description: '向助手或 GPT 发消息，分析图像，生成音频等',
	defaults: {
		name: 'OpenAI',
	},
	codex: {
		alias: ['LangChain', 'ChatGPT', 'DallE'],
		categories: ['AI'],
		subcategories: {
			AI: ['Agents', 'Miscellaneous'],
		},
		resources: {
			primaryDocumentation: [
				{
					url: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/',
				},
			],
		},
	},
	inputs: `={{(${configureNodeInputs})($parameter.resource, $parameter.operation, $parameter.hideTools)}}`,
	outputs: ['main'],
	credentials: [
		{
			name: 'openAiApi',
			required: true,
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
			options: [
				{
					name: '助手',
					value: 'assistant',
				},
				{
					name: '文本',
					value: 'text',
				},
				{
					name: '图片',
					value: 'image',
				},
				{
					name: '音频',
					value: 'audio',
				},
				{
					name: '文件',
					value: 'file',
				},
			],
			default: 'text',
		},
		...assistant.description,
		...audio.description,
		...file.description,
		...image.description,
		...text.description,
	],
};
