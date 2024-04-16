/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import type { TextSplitter } from 'langchain/text_splitter';
import { logWrapper } from '../../../utils/logWrapper';
import { N8nBinaryLoader } from '../../../utils/N8nBinaryLoader';
import { metadataFilterField } from '../../../utils/sharedFields';

// Dependencies needed underneath the hood for the loaders. We add them
// here only to track where what dependency is sued
// import 'd3-dsv'; // for csv
import 'mammoth'; // for docx
import 'epub2'; // for epub
import 'pdf-parse'; // for pdf
import { N8nJsonLoader } from '../../../utils/N8nJsonLoader';

export class DocumentDefaultDataLoader implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Default Data Loader',
		name: 'documentDefaultDataLoader',
		icon: 'file:binary.svg',
		group: ['transform'],
		version: 1,
		description: '在工作流程中加载前一步骤的数据。',
		defaults: {
			name: 'Default Data Loader',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Document Loaders'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.documentdefaultdataloader/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [
			{
				displayName: 'Text Splitter',
				maxConnections: 1,
				type: NodeConnectionType.AiTextSplitter,
				required: true,
			},
		],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiDocument],
		outputNames: ['Document'],
		properties: [
			{
				displayName:
					'这将从工作流程中的先前步骤加载数据。<a href="/templates/1962" target="_blank">示例</a>',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '数据类型',
				name: 'dataType',
				type: 'options',
				default: 'json',
				required: true,
				noDataExpression: true,
				options: [
					{
						name: 'JSON',
						value: 'json',
						description: '处理工作流程中先前步骤的JSON数据',
					},
					{
						name: 'Binary',
						value: 'binary',
						description: '处理工作流程中先前步骤的二进制数据',
					},
				],
			},
			{
				displayName: '模式',
				name: 'jsonMode',
				type: 'options',
				default: 'allInputData',
				required: true,
				displayOptions: {
					show: {
						dataType: ['json'],
					},
				},
				options: [
					{
						name: '加载所有输入数据',
						value: 'allInputData',
						description: '使用流入父代理或链的所有JSON数据',
					},
					{
						name: '加载特定数据',
						value: 'expressionData',
						description: '加载数据子集，和/或来自工作流程中任何先前步骤的数据',
					},
				],
			},
			{
				displayName: '数据格式',
				name: 'loader',
				type: 'options',
				default: 'auto',
				required: true,
				displayOptions: {
					show: {
						dataType: ['binary'],
					},
				},
				options: [
					{
						name: '通过Mime类型自动检测',
						value: 'auto',
						description: '使用Mime类型来检测格式',
					},
					{
						name: 'CSV',
						value: 'csvLoader',
						description: '加载CSV文件',
					},
					{
						name: 'Docx',
						value: 'docxLoader',
						description: '加载Docx文档',
					},
					{
						name: 'EPub',
						value: 'epubLoader',
						description: '加载EPub文件',
					},
					{
						name: 'JSON',
						value: 'jsonLoader',
						description: '加载JSON文件',
					},
					{
						name: 'PDF',
						value: 'pdfLoader',
						description: '加载PDF文档',
					},
					{
						name: '文本',
						value: 'textLoader',
						description: '加载纯文本文件',
					},
				],
			},

			{
				displayName: '数据',
				name: 'jsonData',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '',
				required: true,
				description: '从输入窗格中拖放字段，或使用表达式',
				displayOptions: {
					show: {
						dataType: ['json'],
						jsonMode: ['expressionData'],
					},
				},
			},
			{
				displayName: '输入数据字段名',
				name: 'binaryDataKey',
				type: 'string',
				default: 'data',
				required: true,
				description: '代理或链输入中包含要处理的二进制文件的字段的名称',
				displayOptions: {
					show: {
						dataType: ['binary'],
					},
				},
			},
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				options: [
					{
						displayName: 'JSON指针',
						name: 'pointers',
						type: 'string',
						default: '',
						description: '从JSON中提取的指针，例如"/text"或"/text, /meta/title"',
						displayOptions: {
							show: {
								'/loader': ['jsonLoader', 'auto'],
							},
						},
					},
					{
						displayName: 'CSV分隔符',
						name: 'separator',
						type: 'string',
						description: 'CSV使用的分隔符',
						default: ',',
						displayOptions: {
							show: {
								'/loader': ['csvLoader', 'auto'],
							},
						},
					},
					{
						displayName: 'CSV列',
						name: 'column',
						type: 'string',
						default: '',
						description: '从CSV中提取的列',
						displayOptions: {
							show: {
								'/loader': ['csvLoader', 'auto'],
							},
						},
					},
					{
						displayName: '在PDF中拆分页面',
						description: '是否将PDF页面拆分为单独的文档',
						name: 'splitPages',
						type: 'boolean',
						default: true,
						displayOptions: {
							show: {
								'/loader': ['pdfLoader', 'auto'],
							},
						},
					},
					{
						...metadataFilterField,
						displayName: '元数据',
						description: '要添加到每个文档中的元数据。可以在检索过程中用于过滤',
						placeholder: '添加属性',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const dataType = this.getNodeParameter('dataType', itemIndex, 'json') as 'json' | 'binary';
		const textSplitter = (await this.getInputConnectionData(
			NodeConnectionType.AiTextSplitter,
			0,
		)) as TextSplitter | undefined;
		const binaryDataKey = this.getNodeParameter('binaryDataKey', itemIndex, '') as string;

		const processor =
			dataType === 'binary'
				? new N8nBinaryLoader(this, 'options.', binaryDataKey, textSplitter)
				: new N8nJsonLoader(this, 'options.', textSplitter);

		return {
			response: logWrapper(processor, this),
		};
	}
}
