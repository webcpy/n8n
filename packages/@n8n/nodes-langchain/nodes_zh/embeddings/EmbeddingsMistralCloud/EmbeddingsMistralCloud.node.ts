/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import type { MistralAIEmbeddingsParams } from '@langchain/mistralai';
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class EmbeddingsMistralCloud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings Mistral Cloud',
		name: 'embeddingsMistralCloud',
		icon: 'file:mistral.svg',
		credentials: [
			{
				name: 'mistralCloudApi',
				required: true,
			},
		],
		group: ['transform'],
		version: 1,
		description: 'Use Embeddings Mistral Cloud',
		defaults: {
			name: 'Embeddings Mistral Cloud',
		},

		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsmistralcloud/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiEmbedding],
		outputNames: ['Embeddings'],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: 'https://api.mistral.ai/v1',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiVectorStore]),
			{
				displayName: '模型',
				name: 'model',
				type: 'options',
				description:
					'用于计算嵌入的模型。 <a href="https://docs.mistral.ai/platform/endpoints/">了解更多</a>。',
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
											pass: "={{ $responseItem.id.includes('embed') }}",
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
				default: 'mistral-embed',
			},
			{
				displayName: '选项',
				name: 'options',
				placeholder: '添加选项',
				description: '要添加的附加选项',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: '批处理大小',
						name: 'batchSize',
						default: 512,
						typeOptions: { maxValue: 2048 },
						description: '每个请求发送的最大文档数',
						type: 'number',
					},
					{
						displayName: '去除换行符',
						name: 'stripNewLines',
						default: true,
						description: '是否从输入文本中去除换行符',
						type: 'boolean',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('mistralCloudApi');
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter(
			'options',
			itemIndex,
			{},
		) as Partial<MistralAIEmbeddingsParams>;

		const embeddings = new MistralAIEmbeddings({
			apiKey: credentials.apiKey as string,
			modelName,
			...options,
		});

		return {
			response: logWrapper(embeddings, this),
		};
	}
}
