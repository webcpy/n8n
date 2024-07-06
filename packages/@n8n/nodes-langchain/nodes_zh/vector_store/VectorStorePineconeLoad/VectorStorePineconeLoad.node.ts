import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';
import type { PineconeStoreParams } from '@langchain/pinecone';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';

import type { Embeddings } from '@langchain/core/embeddings';
import { logWrapper } from '../../../utils/logWrapper';
import { metadataFilterField } from '../../../utils/sharedFields';
import { getMetadataFiltersValues } from '../../../utils/helpers';
import { pineconeIndexRLC } from '../shared/descriptions';
import { pineconeIndexSearch } from '../shared/methods/listSearch';

// This node is deprecated. Use VectorStorePinecone instead.
export class VectorStorePineconeLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pinecone: Load',
		// Vector Store nodes got merged into a single node
		hidden: true,
		name: 'vectorStorePineconeLoad',
		icon: 'file:pinecone.svg',
		group: ['transform'],
		version: 1,
		description: '从 Pinecone Vector Store 索引加载数据',
		defaults: {
			name: 'Pinecone: Load',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Vector Stores'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstorepinecone/',
					},
				],
			},
		},
		credentials: [
			{
				name: 'pineconeApi',
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
			pineconeIndexRLC,
			{
				displayName: 'Pinecone命名空间',
				name: 'pineconeNamespace',
				type: 'string',
				default: '',
			},
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [metadataFilterField],
			},
		],
	};

	methods = {
		listSearch: {
			pineconeIndexSearch,
		},
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supplying data for Pinecone Load Vector Store');

		const namespace = this.getNodeParameter('pineconeNamespace', itemIndex) as string;
		const index = this.getNodeParameter('pineconeIndex', itemIndex, '', {
			extractValue: true,
		}) as string;

		const credentials = await this.getCredentials('pineconeApi');
		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			itemIndex,
		)) as Embeddings;

		const client = new Pinecone({
			apiKey: credentials.apiKey as string,
		});

		const pineconeIndex = client.Index(index);
		const config: PineconeStoreParams = {
			namespace: namespace || undefined,
			pineconeIndex,
			filter: getMetadataFiltersValues(this, itemIndex),
		};

		const vectorStore = await PineconeStore.fromExistingIndex(embeddings, config);

		return {
			response: logWrapper(vectorStore, this),
		};
	}
}
