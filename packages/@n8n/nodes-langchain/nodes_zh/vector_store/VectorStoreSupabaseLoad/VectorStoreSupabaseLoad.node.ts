import {
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
	NodeConnectionType,
} from 'n8n-workflow';
import type { Embeddings } from '@langchain/core/embeddings';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseLibArgs } from '@langchain/community/vectorstores/supabase';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { logWrapper } from '../../../utils/logWrapper';
import { metadataFilterField } from '../../../utils/sharedFields';
import { getMetadataFiltersValues } from '../../../utils/helpers';
import { supabaseTableNameRLC } from '../shared/descriptions';
import { supabaseTableNameSearch } from '../shared/methods/listSearch';

// This node is deprecated. Use VectorStoreSupabase instead.
export class VectorStoreSupabaseLoad implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supabase: Load',
		name: 'vectorStoreSupabaseLoad',
		icon: 'file:supabase.svg',
		// Vector Store nodes got merged into a single node
		hidden: true,
		group: ['transform'],
		version: 1,
		description: '从 Supabase Vector Store 索引加载数据',
		defaults: {
			name: 'Supabase: Load',
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
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [metadataFilterField],
			},
		],
	};

	methods = { listSearch: { supabaseTableNameSearch } };

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		this.logger.verbose('Supply Supabase Load Vector Store');

		const tableName = this.getNodeParameter('tableName', itemIndex, '', {
			extractValue: true,
		}) as string;
		const queryName = this.getNodeParameter('queryName', itemIndex) as string;

		const credentials = await this.getCredentials('supabaseApi');
		const embeddings = (await this.getInputConnectionData(
			NodeConnectionType.AiEmbedding,
			0,
		)) as Embeddings;

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const client = createClient(credentials.host as string, credentials.serviceRole as string);
		const config: SupabaseLibArgs = {
			client,
			tableName,
			queryName,
			filter: getMetadataFiltersValues(this, itemIndex),
		};

		const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, config);

		return {
			response: logWrapper(vectorStore, this),
		};
	}
}
