/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf';
import { logWrapper } from '../../../utils/logWrapper';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class EmbeddingsHuggingFaceInference implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Embeddings Hugging Face Inference',
		name: 'embeddingsHuggingFaceInference',
		icon: 'file:huggingface.svg',
		group: ['transform'],
		version: 1,
		description: 'Use HuggingFace Inference Embeddings',
		defaults: {
			name: 'Embeddings HuggingFace Inference',
		},
		credentials: [
			{
				name: 'huggingFaceApi',
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
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.embeddingshuggingfaceinference/',
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
				displayName: '注意事项',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '模型名称',
				name: 'modelName',
				type: 'string',
				default: 'sentence-transformers/distilbert-base-nli-mean-tokens',
				description: '从 HuggingFace 库中使用的模型名称',
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
						displayName: '自定义推理端点',
						name: 'endpointUrl',
						default: '',
						description: '自定义端点 URL',
						type: 'string',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supply data for embeddings HF Inference');
		const model = this.getNodeParameter(
			'modelName',
			itemIndex,
			'sentence-transformers/distilbert-base-nli-mean-tokens',
		) as string;
		const credentials = await this.getCredentials('huggingFaceApi');
		const options = this.getNodeParameter('options', itemIndex, {}) as object;

		const embeddings = new HuggingFaceInferenceEmbeddings({
			apiKey: credentials.apiKey as string,
			model,
			...options,
		});

		return {
			response: logWrapper(embeddings, this),
		};
	}
}
