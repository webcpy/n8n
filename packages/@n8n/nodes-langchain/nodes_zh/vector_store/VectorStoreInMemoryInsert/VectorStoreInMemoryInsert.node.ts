/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type INodeExecutionData,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import type { Document } from 'langchain/document';
import type { Embeddings } from '@langchain/core/embeddings';
import type { N8nJsonLoader } from '../../../utils/N8nJsonLoader';
import { processDocuments } from '../shared/processDocuments';
import { MemoryVectorStoreManager } from '../shared/MemoryVectorStoreManager';

// This node is deprecated. Use VectorStoreInMemory instead.
export class VectorStoreInMemoryInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'In Memory Vector Store Insert',
		name: 'vectorStoreInMemoryInsert',
		icon: 'fa:database',
		group: ['transform'],
		version: 1,
		hidden: true,
		description: '将数据插入到内存中的向量存储',
		defaults: {
			name: 'In Memory Vector Store Insert',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Vector Stores'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreinmemory/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			NodeConnectionType.Main,
			{
				displayName: '文档',
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
			{
				displayName:
					'嵌入的数据存储在服务器内存中，因此当服务器重新启动时它们将丢失。此外，如果数据量太大，可能会由于内存不足导致服务器崩溃。',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '清除存储',
				name: 'clearStore',
				type: 'boolean',
				default: false,
				description: '在插入新数据之前是否清除存储',
			},
			{
				displayName: '内存键',
				name: 'memoryKey',
				type: 'string',
				default: 'vector_store_key',
				description: '用于在工作流数据中存储向量内存的键。键将使用工作流ID前缀以避免冲突。',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData(0);
		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;

		const memoryKey = this.getNodeParameter('memoryKey', 0) as string;
		const clearStore = this.getNodeParameter('clearStore', 0) as boolean;
		const documentInput = (await this.getInputConnectionData(NodeConnectionType.AiDocument, 0)) as
			| N8nJsonLoader
			| Array<Document<Record<string, unknown>>>;

		const { processedDocuments, serializedDocuments } = await processDocuments(
			documentInput,
			items,
		);

		const workflowId = this.getWorkflow().id;

		const vectorStoreInstance = MemoryVectorStoreManager.getInstance(embeddings);
		await vectorStoreInstance.addDocuments(
			`${workflowId}__${memoryKey}`,
			processedDocuments,
			clearStore,
		);

		return await this.prepareOutputData(serializedDocuments);
	}
}
