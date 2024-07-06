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
import { getConnectionHintNoticeField, metadataFilterField } from '../../../utils/sharedFields';

// Dependencies needed underneath the hood for the loaders. We add them
// here only to track where what dependency is sued
// import 'd3-dsv'; // for csv
import 'mammoth'; // for docx
import 'epub2'; // for epub
import 'pdf-parse'; // for pdf

export class DocumentBinaryInputLoader implements INodeType {
	description: INodeTypeDescription = {
		// This node is deprecated and will be removed in the future.
		// The functionality was merged with the `DocumentJSONInputLoader` to `DocumentDefaultDataLoader`
		hidden: true,
		displayName: 'Binary Input Loader',
		name: 'documentBinaryInputLoader',
		icon: 'file:binary.svg',
		group: ['transform'],
		version: 1,
		description: '在工作流程中使用前一步骤中的二进制数据。',
		defaults: {
			name: 'Binary Input Loader',
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
			getConnectionHintNoticeField([NodeConnectionType.AiVectorStore]),
			{
				displayName: '加载器类型',
				name: 'loader',
				type: 'options',
				default: 'jsonLoader',
				required: true,
				options: [
					{
						name: 'CSV Loader',
						value: 'csvLoader',
						description: '加载 CSV 文件',
					},
					{
						name: 'Docx Loader',
						value: 'docxLoader',
						description: '加载 Docx 文档',
					},
					{
						name: 'EPub Loader',
						value: 'epubLoader',
						description: '加载 EPub 文件',
					},
					{
						name: 'JSON Loader',
						value: 'jsonLoader',
						description: '加载 JSON 文件',
					},
					{
						name: 'PDF Loader',
						value: 'pdfLoader',
						description: '加载 PDF 文档',
					},
					{
						name: 'Text Loader',
						value: 'textLoader',
						description: '加载纯文本文件',
					},
				],
			},
			{
				displayName: '二进制数据键',
				name: 'binaryDataKey',
				type: 'string',
				default: 'data',
				required: true,
				description: '从中读取文件缓冲区的二进制属性名称',
			},

			// PDF Only Fields
			{
				displayName: '分割页面',
				name: 'splitPages',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						loader: ['pdfLoader'],
					},
				},
			},

			// CSV Only Fields
			{
				displayName: '列',
				name: 'column',
				type: 'string',
				default: '',
				description: '要从CSV中提取的列',
				displayOptions: {
					show: {
						loader: ['csvLoader'],
					},
				},
			},
			{
				displayOptions: {
					show: {
						loader: ['csvLoader'],
					},
				},
				default: ',',
				description: 'CSV使用的分隔符',
				name: 'separator',
				type: 'string',
				displayName: '分隔符',
			},

			// JSON Only Fields
			{
				displayName: '指针',
				name: 'pointers',
				type: 'string',
				default: '',
				description: '从JSON中提取的指针，例如"/text"或"/text, /meta/title"',
				displayOptions: {
					show: {
						loader: ['jsonLoader'],
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
						...metadataFilterField,
						displayName: '元数据',
						description: '要添加到每个文档中的元数据。可以在检索过程中用于过滤',
						placeholder: '添加属性',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions): Promise<SupplyData> {
		this.logger.verbose('Supply Data for Binary Input Loader');
		const textSplitter = (await this.getInputConnectionData(
			NodeConnectionType.AiTextSplitter,
			0,
		)) as TextSplitter | undefined;

		const binaryDataKey = this.getNodeParameter('binaryDataKey', 0) as string;
		const processor = new N8nBinaryLoader(this, undefined, binaryDataKey, textSplitter);

		return {
			response: logWrapper(processor, this),
		};
	}
}
