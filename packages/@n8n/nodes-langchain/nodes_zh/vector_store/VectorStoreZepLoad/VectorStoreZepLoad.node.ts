import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import type { IZepConfig } from '@langchain/community/vectorstores/zep';
import { ZepVectorStore } from '@langchain/community/vectorstores/zep';
import type { Embeddings } from '@langchain/core/embeddings';
import { metadataFilterField } from '../../../utils/sharedFields';
import { getMetadataFiltersValues } from '../../../utils/helpers';
import { logWrapper } from '../../../utils/logWrapper';

// This node is deprecated. Use VectorStoreZep instead.
export class VectorStoreZepLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zep Vector Store: Load',
		name: 'vectorStoreZepLoad',
		hidden: true,
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:zep.png',
		group: ['transform'],
		version: 1,
		description: '从 Zep Vector Store 索引加载数据',
		defaults: {
			name: 'Zep: Load',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Vector Stores'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorezep/',
					},
				],
			},
		},
		credentials: [
			{
				name: 'zepApi',
				required: true,
			},
		],
		inputs: [
			{
				displayName: 'Embedding',
				maxConnections: 1,
				type: NodeConnectionType.AiEmbedding,
				required: true,
			},
		],
		outputs: [NodeConnectionType.AiVectorStore],
		outputNames: ['Vector Store'],
		properties: [
			{
				displayName: '集合名称',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [
					{
						displayName: '嵌入维度',
						name: 'embeddingDimensions',
						type: 'number',
						default: 1536,
						description: '是否允许使用Unicode替代块中的字符',
					},
					metadataFilterField,
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supplying data for Zep Load Vector Store');

		const collectionName = this.getNodeParameter('collectionName', itemIndex) as string;

		const options =
			(this.getNodeParameter('options', itemIndex) as {
				embeddingDimensions?: number;
			}) || {};

		const credentials = (await this.getCredentials('zepApi')) as {
			apiKey?: string;
			apiUrl: string;
		};
		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;

		const zepConfig: IZepConfig = {
			apiUrl: credentials.apiUrl,
			apiKey: credentials.apiKey,
			collectionName,
			embeddingDimensions: options.embeddingDimensions ?? 1536,
			metadata: getMetadataFiltersValues(this, itemIndex),
		};

		const vectorStore = new ZepVectorStore(embeddings, zepConfig);

		return {
			response: logWrapper(vectorStore, this),
		};
	}
}
