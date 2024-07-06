import {
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';
import type { Embeddings } from '@langchain/core/embeddings';
import type { Document } from '@langchain/core/documents';

import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import type { N8nJsonLoader } from '../../../utils/N8nJsonLoader';
import { processDocuments } from '../shared/processDocuments';
import { pineconeIndexRLC } from '../shared/descriptions';
import { pineconeIndexSearch } from '../shared/methods/listSearch';

// This node is deprecated. Use VectorStorePinecone instead.
export class VectorStorePineconeInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pinecone: Insert',
		hidden: true,
		name: 'vectorStorePineconeInsert',
		icon: 'file:pinecone.svg',
		group: ['transform'],
		version: 1,
		description: '将数据插入到 Pinecone Vector Store 索引',
		defaults: {
			name: 'Pinecone: Insert',
			// eslint-disable-next-line n8n-nodes-base/node-class-description-non-core-color-present
			color: '#1321A7',
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
			NodeConnectionType.Main,
			{
				displayName: 'Document',
				maxConnections: 1,
				type: NodeConnectionType.AiDocument,
				required: true,
			},
			{
				displayName: 'Embedding',
				maxConnections: 1,
				type: NodeConnectionType.AiEmbedding,
				required: true,
			},
		],
		outputs: [NodeConnectionType.Main],
		properties: [
			pineconeIndexRLC,
			{
				displayName: 'Pinecone命名空间',
				name: 'pineconeNamespace',
				type: 'string',
				default: '',
			},
			{
				displayName: '在文档加载器子节点中指定要加载的文档',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '清除命名空间',
				name: 'clearNamespace',
				type: 'boolean',
				default: false,
				description: '在插入新数据之前是否清除命名空间',
			},
		],
	};

	methods = {
		listSearch: {
			pineconeIndexSearch,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData(0);
		this.logger.verbose('Executing data for Pinecone Insert Vector Store');

		const namespace = this.getNodeParameter('pineconeNamespace', 0) as string;
		const index = this.getNodeParameter('pineconeIndex', 0, '', { extractValue: true }) as string;
		const clearNamespace = this.getNodeParameter('clearNamespace', 0) as boolean;

		const credentials = await this.getCredentials('pineconeApi');

		const documentInput = (await this.getInputConnectionData(NodeConnectionType.AiDocument, 0)) as
			| N8nJsonLoader
			| Array<Document<Record<string, unknown>>>;

		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;

		const client = new Pinecone({
			apiKey: credentials.apiKey as string,
		});

		const pineconeIndex = client.Index(index);

		if (namespace && clearNamespace) {
			await pineconeIndex.namespace(namespace).deleteAll();
		}

		const { processedDocuments, serializedDocuments } = await processDocuments(
			documentInput,
			items,
		);

		await PineconeStore.fromDocuments(processedDocuments, embeddings, {
			namespace: namespace || undefined,
			pineconeIndex,
		});

		return await this.prepareOutputData(serializedDocuments);
	}
}
