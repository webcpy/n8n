/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { ChatOpenAI, type ClientOptions } from '@langchain/openai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmChatOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI Chat Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatOpenAi',
		icon: 'file:openAi.svg',
		group: ['transform'],
		version: 1,
		description: 'AI 链的高级用法',
		defaults: {
			name: 'OpenAI Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatopenai/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'openAiApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL:
				'={{ $parameter.options?.baseURL?.split("/").slice(0,-1).join("/") || "https://api.openai.com" }}',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName:
					'如果使用 JSON 响应格式，请确保在链或代理中的提示中包含单词 "json"。另外，请确保选择 2023 年 11 月后发布的最新模型。',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						'/options.responseFormat': ['json_object'],
					},
				},
			},
			{
				displayName: '模型',
				name: 'model',
				type: 'options',
				description:
					'生成完成的模型。<a href="https://beta.openai.com/docs/models/overview">了解更多</a>。',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: "={{ $parameter.options?.baseURL?.split('/').slice(-1).pop() || 'v1' }}/models",
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'data',
										},
									},
									{
										type: 'filter',
										properties: {
											pass: "={{ $responseItem.id.startsWith('gpt-') && !$responseItem.id.includes('instruct') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.id}}',
											value: '={{$responseItem.id}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				default: 'gpt-3.5-turbo',
			},

			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '添加额外的选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '基本 URL',
						name: 'baseURL',
						default: 'https://api.openai.com/v1',
						description: '覆盖 API 的默认基本 URL',
						type: 'string',
					},
					{
						displayName: '频率惩罚',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: {
							maxValue: 2,
							minValue: -2,
							numberPrecision: 1,
						},
						description:
							'正值根据文本中已有标记的频率惩罚新的标记，从而减少模型原样重复相同行的可能性',
						type: 'number',
					},
					{
						displayName: '最大标记数量',
						name: 'maxTokens',
						default: -1,
						description:
							'生成完成中的最大标记数量。大多数模型的上下文长度为 2048 个标记（除了最新的支持 32,768 的模型）。',
						type: 'number',
						typeOptions: {
							maxValue: 32768,
						},
					},
					{
						displayName: '响应格式',
						name: 'responseFormat',
						default: 'text',
						type: 'options',
						options: [
							{
								name: '文本',
								value: 'text',
								description: '常规文本响应',
							},
							{
								name: 'JSON',
								value: 'json_object',
								description: '启用 JSON 模式，应保证模型生成的消息是有效的 JSON',
							},
						],
					},
					{
						displayName: '存在惩罚',
						name: 'presencePenalty',
						default: 0,
						typeOptions: {
							maxValue: 2,
							minValue: -2,
							numberPrecision: 1,
						},
						description:
							'正值根据文本中是否出现新的标记对新标记进行惩罚，从而增加模型谈论新主题的可能性',
						type: 'number',
					},
					{
						displayName: '采样温度',
						name: 'temperature',
						default: 0.7,
						typeOptions: {
							maxValue: 1,
							minValue: 0,
							numberPrecision: 1,
						},
						description:
							'控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
						type: 'number',
					},
					{
						displayName: '超时',
						name: 'timeout',
						default: 60000,
						description: '请求允许花费的最大时间（毫秒）',
						type: 'number',
					},
					{
						displayName: '最大重试次数',
						name: 'maxRetries',
						default: 2,
						description: '尝试的最大重试次数',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: {
							maxValue: 1,
							minValue: 0,
							numberPrecision: 1,
						},
						description:
							'通过核心采样控制多样性：0.5 表示考虑一半的所有可能性加权选项。我们通常建议修改这个或温度但不是两者都修改。',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('openAiApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			baseURL?: string;
			frequencyPenalty?: number;
			maxTokens?: number;
			maxRetries: number;
			timeout: number;
			presencePenalty?: number;
			temperature?: number;
			topP?: number;
			responseFormat?: 'text' | 'json_object';
		};

		const configuration: ClientOptions = {};
		if (options.baseURL) {
			configuration.baseURL = options.baseURL;
		}

		const model = new ChatOpenAI({
			openAIApiKey: credentials.apiKey as string,
			modelName,
			...options,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
			configuration,
			modelKwargs: options.responseFormat
				? {
						response_format: { type: options.responseFormat },
					}
				: undefined,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
