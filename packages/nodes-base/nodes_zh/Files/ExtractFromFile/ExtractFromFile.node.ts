import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as spreadsheet from './actions/spreadsheet.operation';
import * as moveTo from './actions/moveTo.operation';
import * as pdf from './actions/pdf.operation';

export class ExtractFromFile implements INodeType {
	// eslint-disable-next-line n8n-nodes-base/node-class-description-missing-subtitle
	description: INodeTypeDescription = {
		displayName: 'Extract from File',
		name: 'extractFromFile',
		icon: 'file:extractFromFile.svg',
		group: ['input'],
		version: 1,
		description: '将二进制数据转换为 JSON',
		defaults: {
			name: 'Extract from File',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "从 CSV 提取",
						"value": "csv",
						"action": "从 CSV 提取",
						"description": "将 CSV 文件转换为输出项"
					},
					{
						"name": "从 HTML 提取",
						"value": "html",
						"action": "从 HTML 提取",
						"description": "将 HTML 文件中的表格转换为输出项"
					},
					{
						"name": "从 ICS 提取",
						"value": "fromIcs",
						"action": "从 ICS 提取",
						"description": "将 ICS 文件转换为输出项"
					},
					{
						"name": "从 JSON 提取",
						"value": "fromJson",
						"action": "从 JSON 提取",
						"description": "将 JSON 文件转换为输出项"
					},
					{
						"name": "从 ODS 提取",
						"value": "ods",
						"action": "从 ODS 提取",
						"description": "将 ODS 文件转换为输出项"
					},
					{
						"name": "从 PDF 提取",
						"value": "pdf",
						"action": "从 PDF 提取",
						"description": "从 PDF 文件中提取内容和元数据"
					},
					{
						"name": "从 RTF 提取",
						"value": "rtf",
						"action": "从 RTF 提取",
						"description": "将 RTF 文件中的表格转换为输出项"
					},
					{
						"name": "从文本文件提取",
						"value": "text",
						"action": "从文本文件提取",
						"description": "提取文本文件的内容"
					},
					{
						"name": "从 XML 提取",
						"value": "xml",
						"action": "从 XML 提取",
						"description": "提取 XML 文件的内容"
					},
					{
						"name": "从 XLS 提取",
						"value": "xls",
						"action": "从 XLS 提取",
						"description": "将 Excel 文件转换为输出项"
					},
					{
						"name": "从 XLSX 提取",
						"value": "xlsx",
						"action": "从 XLSX 提取",
						"description": "将 Excel 文件转换为输出项"
					},
					{
						"name": "将文件移至 Base64 字符串",
						"value": "binaryToPropery",
						"action": "将文件移至 Base64 字符串",
						"description": "将文件转换为 base64 编码的字符串"
					}
				],
				"default": "csv"
			},

			...spreadsheet.description,
			...moveTo.description,
			...pdf.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnData: INodeExecutionData[] = [];

		if (spreadsheet.operations.includes(operation)) {
			returnData = await spreadsheet.execute.call(this, items, 'operation');
		}

		if (['binaryToPropery', 'fromJson', 'text', 'fromIcs', 'xml'].includes(operation)) {
			returnData = await moveTo.execute.call(this, items, operation);
		}

		if (operation === 'pdf') {
			returnData = await pdf.execute.call(this, items);
		}

		return [returnData];
	}
}
