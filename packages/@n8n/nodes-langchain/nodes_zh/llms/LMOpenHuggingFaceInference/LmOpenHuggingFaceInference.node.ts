/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { HuggingFaceInference } from '@langchain/community/llms/hf';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmOpenHuggingFaceInference implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Hugging Face Inference Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmOpenHuggingFaceInference',
		icon: 'file:huggingface.svg',
		group: ['transform'],
		version: 1,
		description: '语言模型 HuggingFaceInference',
		defaults: {
			name: 'Hugging Face Inference Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmopenhuggingfaceinference/',
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
				name: 'huggingFaceApi',
				required: true,
			},
		],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: '模型',
				name: 'model',
				type: 'string',
				default: 'gpt2',
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
						displayName: '自定义推断端点',
						name: 'endpointUrl',
						default: '',
						description: '自定义端点 URL',
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
						default: 128,
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
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
						type: 'number',
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description: '控制采样操作中要考虑的顶部标记以创建新文本',
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

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('huggingFaceApi');

		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as object;

		const model = new HuggingFaceInference({
			model: modelName,
			apiKey: credentials.apiKey as string,
			...options,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
