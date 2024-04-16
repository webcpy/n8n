import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as spreadsheet from './actions/spreadsheet.operation';
import * as toBinary from './actions/toBinary.operation';
import * as toText from './actions/toText.operation';
import * as toJson from './actions/toJson.operation';
import * as iCall from './actions/iCall.operation';

export class ConvertToFile implements INodeType {
	// eslint-disable-next-line n8n-nodes-base/node-class-description-missing-subtitle
	description: INodeTypeDescription = {
		displayName: 'Convert to File',
		name: 'convertToFile',
		icon: 'file:convertToFile.svg',
		group: ['input'],
		version: [1, 1.1],
		description: '将 JSON 数据转换成二进制数据',
		defaults: {
			name: 'Convert to File',
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
						"name": "转换为 CSV",
						"value": "csv",
						"action": "转换为 CSV",
						"description": "将输入数据转换为 CSV 文件"
					},
					{
						"name": "转换为 HTML",
						"value": "html",
						"action": "转换为 HTML",
						"description": "将输入数据转换为 HTML 文件中的表格"
					},
					{
						"name": "转换为 ICS",
						"value": "iCal",
						"action": "转换为 ICS",
						"description": "将每个输入项转换为 ICS 事件文件"
					},
					{
						"name": "转换为 JSON",
						"value": "toJson",
						"action": "转换为 JSON",
						"description": "将输入数据转换为单个或多个 JSON 文件"
					},
					{
						"name": "转换为 ODS",
						"value": "ods",
						"action": "转换为 ODS",
						"description": "将输入数据转换为 ODS 文件"
					},
					{
						"name": "转换为 RTF",
						"value": "rtf",
						"action": "转换为 RTF",
						"description": "将输入数据转换为 RTF 文件中的表格"
					},
					{
						"name": "转换为文本文件",
						"value": "toText",
						"action": "转换为文本文件",
						"description": "将输入数据字符串转换为文件"
					},
					{
						"name": "转换为 XLS",
						"value": "xls",
						"action": "转换为 XLS",
						"description": "将输入数据转换为 Excel 文件"
					},
					{
						"name": "转换为 XLSX",
						"value": "xlsx",
						"action": "转换为 XLSX",
						"description": "将输入数据转换为 Excel 文件"
					},
					{
						"name": "将 Base64 字符串移至文件",
						"value": "toBinary",
						"action": "将 Base64 字符串移至文件",
						"description": "将 Base64 编码的字符串转换为其原始文件格式"
					}
				],
				"default": "csv"
			},
			...spreadsheet.description,
			...toBinary.description,
			...toText.description,
			...toJson.description,
			...iCall.description,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const operation = this.getNodeParameter('operation', 0);
		let returnData: INodeExecutionData[] = [];

		if (spreadsheet.operations.includes(operation)) {
			returnData = await spreadsheet.execute.call(this, items, operation);
		}

		if (operation === 'toJson') {
			returnData = await toJson.execute.call(this, items);
		}

		if (operation === 'toBinary') {
			returnData = await toBinary.execute.call(this, items);
		}

		if (operation === 'toText') {
			returnData = await toText.execute.call(this, items);
		}

		if (operation === 'iCal') {
			returnData = await iCall.execute.call(this, items);
		}

		return [returnData];
	}
}
