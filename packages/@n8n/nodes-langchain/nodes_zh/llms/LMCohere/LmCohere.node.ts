/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { Cohere } from '@langchain/cohere';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmCohere implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cohere Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmCohere',
		icon: 'file:cohere.svg',
		group: ['transform'],
		version: 1,
		description: 'Language Model Cohere',
		defaults: {
			name: 'Cohere Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmcohere/',
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
				name: 'cohereApi',
				required: true,
			},
		],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
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
						default: 250,
						description:
							'生成完成中的最大标记数量。大多数模型的上下文长度为 2048 个标记（除了最新的支持 32,768 的模型）。',
						type: 'number',
						typeOptions: {
							maxValue: 32768,
						},
					},
					{
						displayName: '模型',
						name: 'model',
						type: 'string',
						description: '要使用的模型的名称',
						default: '',
					},
					{
						displayName: '采样温度',
						name: 'temperature',
						default: 0,
						typeOptions: {
							maxValue: 1,
							minValue: 0,
							numberPrecision: 1,
						},
						description:
							'控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('cohereApi');

		const options = this.getNodeParameter('options', itemIndex, {}) as object;

		const model = new Cohere({
			apiKey: credentials.apiKey as string,
			...options,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
