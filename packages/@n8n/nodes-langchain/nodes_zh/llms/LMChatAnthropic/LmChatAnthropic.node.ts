/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type INodeProperties,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { ChatAnthropic } from '@langchain/anthropic';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

const modelField: INodeProperties = {
	displayName: 'Model',
	name: 'model',
	type: 'options',
	// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
	options: [
		{
			name: 'Claude 3 Opus(20240229)',
			value: 'claude-3-opus-20240229',
		},
		{
			name: 'Claude 3 Sonnet(20240229)',
			value: 'claude-3-sonnet-20240229',
		},
		{
			name: 'Claude 3 Haiku(20240307)',
			value: 'claude-3-haiku-20240307',
		},
		{
			name: 'LEGACY: Claude 2',
			value: 'claude-2',
		},
		{
			name: 'LEGACY: Claude 2.1',
			value: 'claude-2.1',
		},
		{
			name: 'LEGACY: Claude Instant 1.2',
			value: 'claude-instant-1.2',
		},
		{
			name: 'LEGACY: Claude Instant 1',
			value: 'claude-instant-1',
		},
	],
	description: `生成完成的模型。<a href="https://docs.anthropic.com/claude/docs/models-overview">了解更多</a>。`,
	default: 'claude-2',
};

export class LmChatAnthropic implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Anthropic Chat Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatAnthropic',
		icon: 'file:anthropic.svg',
		group: ['transform'],
		version: [1, 1.1],
		description: '语言模型 Anthropic',
		defaults: {
			name: 'Anthropic Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/',
					},
				],
			},
			alias: ['claude', 'sonnet', 'opus'],
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'anthropicApi',
				required: true,
			},
		],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiChain]),
			{
				...modelField,
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			{
				...modelField,
				default: 'claude-3-sonnet-20240229',
				displayOptions: {
					hide: {
						'@version': [1],
					},
				},
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的额外选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '最大标记数',
						name: 'maxTokensToSample',
						default: 4096,
						description: '在完成中生成的最大标记数',
						type: 'number',
					},
					{
						displayName: '采样温度',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'控制随机性：降低会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
						type: 'number',
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: -1,
						typeOptions: { maxValue: 1, minValue: -1, numberPrecision: 1 },
						description: '用于删除“长尾”低概率响应。默认为-1，表示禁用。',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'通过核采样控制多样性：0.5表示考虑所有可能性的一半。我们通常建议更改此项或温度但不同时更改两者。',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('anthropicApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			maxTokensToSample?: number;
			temperature: number;
			topK: number;
			topP: number;
		};

		const model = new ChatAnthropic({
			anthropicApiKey: credentials.apiKey as string,
			modelName,
			maxTokens: options.maxTokensToSample,
			temperature: options.temperature,
			topK: options.topK,
			topP: options.topP,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
