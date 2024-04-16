/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import { NodeConnectionType } from 'n8n-workflow';
import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

import { OpenAI, type ClientOptions } from '@langchain/openai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

type LmOpenAiOptions = {
	baseURL?: string;
	frequencyPenalty?: number;
	maxTokens?: number;
	presencePenalty?: number;
	temperature?: number;
	timeout?: number;
	maxRetries?: number;
	topP?: number;
};

export class LmOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OpenAI Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmOpenAi',
		icon: 'file:openAi.svg',
		group: ['transform'],
		version: 1,
		description: 'AI 链的高级用法',
		defaults: {
			name: 'OpenAI Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmopenai/',
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
				displayName: '模型',
				name: 'model',
				type: 'resourceLocator',
				default: { mode: 'list', value: 'gpt-3.5-turbo-instruct' },
				required: true,
				description:
					'生成完成的模型。要下载模型，请访问<a href="https://beta.openai.com/docs/models/overview">OpenAI 模型概览</a>。',
				modes: [
					{
						displayName: '从列表中选择',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'openAiModelSearch',
						},
					},
					{
						displayName: '使用 ID',
						name: 'id',
						type: 'string',
					},
				],
				routing: {
					send: {
						type: 'body',
						property: 'model',
						value: '={{$parameter.model.value}}',
					},
				},
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
						displayName: '基础 URL',
						name: 'baseURL',
						default: 'https://api.openai.com/v1',
						description: '覆盖 API 的默认基础 URL',
						type: 'string',
					},
					{
						displayName: '频率惩罚',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							'正值根据文本中新标记的现有频率对其进行惩罚，从而减少模型完全重复相同行的可能性',
						type: 'number',
					},
					{
						displayName: '最大标记数量',
						name: 'maxTokens',
						default: -1,
						description:
							'生成完成中的最大标记数。大多数模型的上下文长度为 2048 个标记（除了最新的支持 32,768 个标记的模型）。',
						type: 'number',
						typeOptions: {
							maxValue: 32768,
						},
					},
					{
						displayName: '存在惩罚',
						name: 'presencePenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description:
							'正值根据迄今为止文本中是否出现的新标记对其进行惩罚，从而增加模型谈论新主题的可能性',
						type: 'number',
					},
					{
						displayName: '采样温度',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
						type: 'number',
					},
					{
						displayName: '超时时间',
						name: 'timeout',
						default: 60000,
						description: '请求允许的最长时间，以毫秒为单位',
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
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'通过核心采样控制多样性：0.5 表示考虑一半的所有可能性加权选项。我们通常建议修改这个或温度但不是两者都修改。',
						type: 'number',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			async openAiModelSearch(this: ILoadOptionsFunctions) {
				const results = [];

				const options = this.getNodeParameter('options', {}) as LmOpenAiOptions;

				let uri = 'https://api.openai.com/v1/models';

				if (options.baseURL) {
					uri = `${options.baseURL}/models`;
				}

				const { data } = (await this.helpers.requestWithAuthentication.call(this, 'openAiApi', {
					method: 'GET',
					uri,
					json: true,
				})) as { data: Array<{ owned_by: string; id: string }> };

				for (const model of data) {
					if (!model.owned_by?.startsWith('system')) continue;
					results.push({
						name: model.id,
						value: model.id,
					});
				}

				return { results };
			},
		},
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('openAiApi');

		const modelName = this.getNodeParameter('model', itemIndex, '', {
			extractValue: true,
		}) as string;

		const options = this.getNodeParameter('options', itemIndex, {}) as {
			baseURL?: string;
			frequencyPenalty?: number;
			maxTokens?: number;
			presencePenalty?: number;
			temperature?: number;
			timeout?: number;
			maxRetries?: number;
			topP?: number;
		};

		const configuration: ClientOptions = {};
		if (options.baseURL) {
			configuration.baseURL = options.baseURL;
		}

		const model = new OpenAI({
			openAIApiKey: credentials.apiKey as string,
			modelName,
			...options,
			configuration,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
