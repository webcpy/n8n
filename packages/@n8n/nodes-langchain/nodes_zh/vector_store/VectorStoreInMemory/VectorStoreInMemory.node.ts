import type { INodeProperties } from 'n8n-workflow';
import { createVectorStoreNode } from '../shared/createVectorStoreNode';
import { MemoryVectorStoreManager } from '../shared/MemoryVectorStoreManager';

const insertFields: INodeProperties[] = [
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
];

export const VectorStoreInMemory = createVectorStoreNode({
	meta: {
		displayName: 'In-Memory Vector Store',
		name: 'vectorStoreInMemory',
		description: '在内存中的向量存储中处理您的数据',
		icon: 'fa:database',
		docsUrl:
			'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoreinmemory/',
	},
	sharedFields: [
		{
			displayName: '内存键',
			name: 'memoryKey',
			type: 'string',
			default: 'vector_store_key',
			description: '用于在工作流数据中存储向量内存的键。键将使用工作流ID前缀以避免冲突。',
		},
	],
	insertFields,
	loadFields: [],
	retrieveFields: [],
	async getVectorStoreClient(context, _filter, embeddings, itemIndex) {
		const workflowId = context.getWorkflow().id;
		const memoryKey = context.getNodeParameter('memoryKey', itemIndex) as string;
		const vectorStoreSingleton = MemoryVectorStoreManager.getInstance(embeddings);

		return await vectorStoreSingleton.getVectorStore(`${workflowId}__${memoryKey}`);
	},
	async populateVectorStore(context, embeddings, documents, itemIndex) {
		const memoryKey = context.getNodeParameter('memoryKey', itemIndex) as string;
		const clearStore = context.getNodeParameter('clearStore', itemIndex) as boolean;
		const workflowId = context.getWorkflow().id;
		const vectorStoreInstance = MemoryVectorStoreManager.getInstance(embeddings);

		void vectorStoreInstance.addDocuments(`${workflowId}__${memoryKey}`, documents, clearStore);
	},
});
