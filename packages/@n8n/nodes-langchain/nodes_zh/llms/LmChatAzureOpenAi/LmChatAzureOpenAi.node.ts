/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import type { ClientOptions } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmChatAzureOpenAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Azure OpenAI Chat Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatAzureOpenAi',
		icon: 'file:azure.svg',
		group: ['transform'],
		version: 1,
		description: '用于高级用法与 AI 链',
		defaults: {
			name: 'Azure OpenAI Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatazureopenai/',
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
				name: 'azureOpenAiApi',
				required: true,
			},
		],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: '模型（部署）名称',
				name: 'model',
				type: 'string',
				description: '要使用的模型（部署）的名称',
				default: '',
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
						displayName: '频率惩罚',
						name: 'frequencyPenalty',
						default: 0,
						typeOptions: { maxValue: 2, minValue: -2, numberPrecision: 1 },
						description: '正值根据到目前为止文本中现有词频惩罚新标记，减少模型重复相同行的可能性',
						type: 'number',
					},
					{
						displayName: '最大标记数',
						name: 'maxTokens',
						default: -1,
						description:
							'在完成中生成的最大标记数。大多数模型的上下文长度为2048标记（最新模型除外，支持32768个标记）。',
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
							'正值根据到目前为止文本中新标记是否出现惩罚新标记，增加模型谈论新话题的可能性',
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
						displayName: '超时',
						name: 'timeout',
						default: 60000,
						description: '请求允许花费的最大时间（以毫秒为单位）',
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
							'通过核采样控制多样性：0.5表示考虑所有可能性的一半。我们通常建议更改此项或温度但不同时更改两者。',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = (await this.getCredentials('azureOpenAiApi')) as {
			apiKey: string;
			resourceName: string;
			apiVersion: string;
		};

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as {
			frequencyPenalty?: number;
			maxTokens?: number;
			maxRetries: number;
			timeout: number;
			presencePenalty?: number;
			temperature?: number;
			topP?: number;
		};

		const configuration: ClientOptions = {};

		const model = new ChatOpenAI({
			azureOpenAIApiDeploymentName: modelName,
			azureOpenAIApiInstanceName: credentials.resourceName,
			azureOpenAIApiKey: credentials.apiKey,
			azureOpenAIApiVersion: credentials.apiVersion,
			...options,
			timeout: options.timeout ?? 60000,
			maxRetries: options.maxRetries ?? 2,
			configuration,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
