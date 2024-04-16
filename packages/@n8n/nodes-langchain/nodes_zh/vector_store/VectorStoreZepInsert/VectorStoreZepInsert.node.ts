import {
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';
import { ZepVectorStore } from '@langchain/community/vectorstores/zep';
import type { Embeddings } from '@langchain/core/embeddings';
import type { Document } from '@langchain/core/documents';
import type { N8nJsonLoader } from '../../../utils/N8nJsonLoader';
import { processDocuments } from '../shared/processDocuments';

// This node is deprecated. Use VectorStoreZep instead.
export class VectorStoreZepInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zep Vector Store: Insert',
		name: 'vectorStoreZepInsert',
		hidden: true,
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:zep.png',
		group: ['transform'],
		version: 1,
		description: '将数据插入到 Zep Vector Store 索引',
		defaults: {
			name: 'Zep: Insert',
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
			{
				displayName: '集合名称',
				name: 'collectionName',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: '在文档加载器子节点中指定要加载的文档',
				name: 'notice',
				type: 'notice',
				default: '',
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
						description: '是否允许使用Unicode代理块中的字符',
					},
					{
						displayName: '是否自动嵌入',
						name: 'isAutoEmbedded',
						type: 'boolean',
						default: true,
						description: '在添加文档时是否自动嵌入',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing data for Zep Insert Vector Store');
		const items = this.getInputData(0);
		const collectionName = this.getNodeParameter('collectionName', 0) as string;
		const options =
			(this.getNodeParameter('options', 0, {}) as {
				isAutoEmbedded?: boolean;
				embeddingDimensions?: number;
			}) || {};

		const credentials = (await this.getCredentials('zepApi')) as {
			apiKey?: string;
			apiUrl: string;
		};

		const documentInput = (await this.getInputConnectionData(NodeConnectionType.AiDocument, 0)) as
			| N8nJsonLoader
			| Array<Document<Record<string, unknown>>>;

		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;

		const { processedDocuments, serializedDocuments } = await processDocuments(
			documentInput,
			items,
		);

		const zepConfig = {
			apiUrl: credentials.apiUrl,
			apiKey: credentials.apiKey,
			collectionName,
			embeddingDimensions: options.embeddingDimensions ?? 1536,
			isAutoEmbedded: options.isAutoEmbedded ?? true,
		};

		await ZepVectorStore.fromDocuments(processedDocuments, embeddings, zepConfig);

		return await this.prepareOutputData(serializedDocuments);
	}
}
