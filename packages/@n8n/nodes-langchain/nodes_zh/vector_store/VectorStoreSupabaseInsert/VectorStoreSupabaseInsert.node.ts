import {
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';
import type { Embeddings } from '@langchain/core/embeddings';
import type { Document } from '@langchain/core/documents';
import { createClient } from '@supabase/supabase-js';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';

import type { N8nJsonLoader } from '../../../utils/N8nJsonLoader';
import { processDocuments } from '../shared/processDocuments';
import { supabaseTableNameRLC } from '../shared/descriptions';
import { supabaseTableNameSearch } from '../shared/methods/listSearch';

// This node is deprecated. Use VectorStoreSupabase instead.
export class VectorStoreSupabaseInsert implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supabase: Insert',
		// Vector Store nodes got merged into a single node
		hidden: true,
		name: 'vectorStoreSupabaseInsert',
		icon: 'file:supabase.svg',
		group: ['transform'],
		version: 1,
		description: `将数据插入到 Supabase Vector Store 索引 [https://supabase.com/docs/guides/ai/langchain]`,
		defaults: {
			name: 'Supabase: Insert',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Vector Stores'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.vectorstoresupabase/',
					},
				],
			},
		},
		credentials: [
			{
				name: 'supabaseApi',
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
				displayName:
					"请参考<a href='https://supabase.com/docs/guides/ai/langchain' target='_blank'>Supabase文档</a>以获取有关如何将您的数据库设置为Vector Store的更多信息。",
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
			supabaseTableNameRLC,
			{
				displayName: '查询名称',
				name: 'queryName',
				type: 'string',
				default: 'match_documents',
				required: true,
				description: '用于匹配文档的查询名称',
			},
			{
				displayName: '在文档加载器子节点中指定要加载的文档',
				name: 'notice',
				type: 'notice',
				default: '',
			},
		],
	};

	methods = { listSearch: { supabaseTableNameSearch } };

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		this.logger.verbose('Executing data for Supabase Insert Vector Store');

		const items = this.getInputData(0);
		const tableName = this.getNodeParameter('tableName', 0, '', { extractValue: true }) as string;
		const queryName = this.getNodeParameter('queryName', 0) as string;
		const credentials = await this.getCredentials('supabaseApi');

		const documentInput = (await this.getInputConnectionData(NodeConnectionType.AiDocument, 0)) as
			| N8nJsonLoader
			| Array<Document<Record<string, unknown>>>;

		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;
		const client = createClient(credentials.host as string, credentials.serviceRole as string);

		const { processedDocuments, serializedDocuments } = await processDocuments(
			documentInput,
			items,
		);

		await SupabaseVectorStore.fromDocuments(processedDocuments, embeddings, {
			client,
			tableName,
			queryName,
		});

		return await this.prepareOutputData(serializedDocuments);
	}
}
