/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import type { ChatMistralAIInput } from '@langchain/mistralai';
import { ChatMistralAI } from '@langchain/mistralai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmChatMistralCloud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Mistral Cloud Chat Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatMistralCloud',
		icon: 'file:mistral.svg',
		group: ['transform'],
		version: 1,
		description: 'AI 链的高级用法',
		defaults: {
			name: 'Mistral Cloud Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatmistralcloud/',
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
				name: 'mistralCloudApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: 'https://api.mistral.ai/v1',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: '模型',
				name: 'model',
				type: 'options',
				description:
					'生成完成的模型。<a href="https://docs.mistral.ai/platform/endpoints/">了解更多</a>。',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/models',
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
											pass: "={{ !$responseItem.id.includes('embed') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{ $responseItem.id }}',
											value: '={{ $responseItem.id }}',
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
				default: 'mistral-small',
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
					{
						displayName: '启用安全模式',
						name: 'safeMode',
						default: false,
						type: 'boolean',
						description: '在所有对话之前是否注入安全提示',
					},
					{
						displayName: '随机种子',
						name: 'randomSeed',
						default: undefined,
						type: 'number',
						description: '用于随机采样的种子。如果设置，不同的调用将生成确定性结果。',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('mistralCloudApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {
			maxRetries: 2,
			topP: 1,
			temperature: 0.7,
			maxTokens: -1,
			safeMode: false,
			randomSeed: undefined,
		}) as Partial<ChatMistralAIInput>;

		const model = new ChatMistralAI({
			apiKey: credentials.apiKey as string,
			modelName,
			...options,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
