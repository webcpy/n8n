/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type SupplyData,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import type { Embeddings } from '@langchain/core/embeddings';
import { MemoryVectorStoreManager } from '../shared/MemoryVectorStoreManager';
import { logWrapper } from '../../../utils/logWrapper';

// This node is deprecated. Use VectorStoreInMemory instead.
export class VectorStoreInMemoryLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'In Memory Vector Store Load',
		name: 'vectorStoreInMemoryLoad',
		icon: 'fa:database',
		group: ['transform'],
		version: 1,
		hidden: true,
		description: '从内存中的向量存储加载嵌入数据		',
		defaults: {
			name: 'In Memory Vector Store Load',
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
				displayName: '内存键',
				name: 'memoryKey',
				type: 'string',
				default: 'vector_store_key',
				description: '用于在工作流数据中存储向量内存的键。键将使用工作流ID前缀以避免冲突。',
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			itemIndex,
		)) as Embeddings;

		const workflowId = this.getWorkflow().id;
		const memoryKey = this.getNodeParameter('memoryKey', 0) as string;

		const vectorStoreSingleton = MemoryVectorStoreManager.getInstance(embeddings);
		const vectorStoreInstance = await vectorStoreSingleton.getVectorStore(
			`${workflowId}__${memoryKey}`,
		);

		return {
			response: logWrapper(vectorStoreInstance, this),
		};
	}
}
