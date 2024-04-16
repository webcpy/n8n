/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { GooglePaLMEmbeddings } from '@langchain/community/embeddings/googlepalm';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class EmbeddingsGooglePalm implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings Google PaLM',
		name: 'embeddingsGooglePalm',
		icon: 'file:google.svg',
		group: ['transform'],
		version: 1,
		description: 'Use Google PaLM Embeddings',
		defaults: {
			name: 'Embeddings Google PaLM',
		},
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials.host }}',
		},
		credentials: [
			{
				name: 'googlePalmApi',
				required: true,
			},
		],
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Embeddings'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingsgooglepalm/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiEmbedding],
		outputNames: ['Embeddings'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiVectorStore]),
			{
				displayOptions: {
					show: {
						'/modelName': ['models/embedding'],
					},
				},
				displayName: '注意事项',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayOptions: {
					show: {
						'/modelName': ['models/embedding'],
					},
				},
				displayName: '模型',
				name: 'modelName',
				type: 'options',
				description:
					'将生成嵌入的模型。 <a href="https://developers.generativeai.google/api/rest/generativelanguage/models/list">了解更多</a>。',
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
											pass: "={{ $responseItem.name.startsWith('models/embedding') }}",
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
				default: 'models/embedding-gecko-001',
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supply data for embeddings Google PaLM');
		const modelName = this.getNodeParameter(
			'modelName',
			itemIndex,
			'models/embedding-gecko-001',
		) as string;
		const credentials = await this.getCredentials('googlePalmApi');
		const embeddings = new GooglePaLMEmbeddings({
			apiKey: credentials.apiKey as string,
			modelName,
		});

		return {
			response: logWrapper(embeddings, this),
		};
	}
}
