/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { GooglePaLM } from '@langchain/community/llms/googlepalm';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class LmGooglePalm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google PaLM Language Model',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmGooglePalm',
		icon: 'file:google.svg',
		group: ['transform'],
		version: 1,
		description: '语言模型 Google PaLM',
		defaults: {
			name: 'Google PaLM Language Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmgooglepalm/',
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
				name: 'googlePalmApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials.host }}',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: '模型',
				name: 'modelName',
				type: 'options',
				description:
					'生成完成的模型。<a href="https://developers.generativeai.google/api/rest/generativelanguage/models/list">了解更多</a>。',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/v1beta3/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'models',
										},
									},
									{
										type: 'filter',
										properties: {
											pass: "={{ $responseItem.name.startsWith('models/text') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.name}}',
											value: '={{$responseItem.name}}',
											description: '={{$responseItem.description}}',
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
				default: 'models/text-bison-001',
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
						name: 'maxOutputTokens',
						default: 1024,
						description: '生成完成中的最大标记数量',
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
						displayName: 'Top K',
						name: 'topK',
						default: 40,
						typeOptions: {
							maxValue: 1,
							minValue: -1,
							numberPrecision: 1,
						},
						description: '用于删除“long tail”低概率的响应。默认为 -1，表示禁用。',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 0.9,
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
		const credentials = await this.getCredentials('googlePalmApi');

		const modelName = this.getNodeParameter('modelName', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as object;

		const model = new GooglePaLM({
			apiKey: credentials.apiKey as string,
			modelName,
			...options,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}
