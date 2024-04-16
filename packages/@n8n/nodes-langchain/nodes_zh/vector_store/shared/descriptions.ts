import type { INodeProperties } from 'n8n-workflow';

export const pineconeIndexRLC: INodeProperties = {
	displayName: 'Pinecone索引',
	name: 'pineconeIndex',
	type: 'resourceLocator',
	default: {
		mode: 'list',
		value: '',
	},
	required: true,
	modes: [
		{
			displayName: '从列表中选择',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'pineconeIndexSearch',
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
		},
	],
};

export const supabaseTableNameRLC: INodeProperties = {
	displayName: '表名',
	name: 'tableName',
	type: 'resourceLocator',
	default: {
		mode: 'list',
		value: '',
	},
	required: true,
	modes: [
		{
			displayName: '从列表中选择',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'supabaseTableNameSearch',
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
		},
	],
};

export const qdrantCollectionRLC: INodeProperties = {
	displayName: 'Qdrant集合',
	name: 'qdrantCollection',
	type: 'resourceLocator',
	default: {
		mode: 'list',
		value: '',
	},
	required: true,
	modes: [
		{
			displayName: '从列表中选择',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'qdrantCollectionsSearch',
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
		},
	],
};
