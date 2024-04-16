import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeProperties,
} from 'n8n-workflow';

import { generatePairedItemData, updateDisplayOptions } from '@utils/utilities';
import type { JsonToSpreadsheetBinaryOptions, JsonToSpreadsheetBinaryFormat } from '@utils/binary';

import { convertJsonToSpreadsheetBinary } from '@utils/binary';

export const operations = ['csv', 'html', 'rtf', 'ods', 'xls', 'xlsx'];

export const properties: INodeProperties[] = [
	{
		"displayName": "将输出文件放入字段",
		"name": "binaryPropertyName",
		"type": "string",
		"default": "data",
		"required": true,
		"placeholder": "例如 data",
		"hint": "要放入文件的输出二进制字段的名称",
		"displayOptions": {
			"show": {
				"operation": ["csv", "html", "rtf", "ods", "xls", "xlsx"]
			}
		}
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "压缩",
				"name": "compression",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"/operation": ["xlsx", "ods"]
					}
				},
				"default": false,
				"description": "是否减小输出文件大小"
			},
			{
				"displayName": "文件名",
				"name": "fileName",
				"type": "string",
				"default": "",
				"description": "输出文件的名称"
			},
			{
				"displayName": "头部行",
				"name": "headerRow",
				"type": "boolean",
				"default": true,
				"description": "文件的第一行是否包含标题名称"
			},
			{
				"displayName": "表格名称",
				"name": "sheetName",
				"type": "string",
				"displayOptions": {
					"show": {
						"/operation": ["ods", "xls", "xlsx"]
					}
				},
				"default": "Sheet",
				"description": "电子表格中要创建的表格名称",
				"placeholder": "例如 mySheet"
			}
		]
	}
];

const displayOptions = {
	show: {
		operation: operations,
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	operation: string,
) {
	let returnData: INodeExecutionData[] = [];

	const pairedItem = generatePairedItemData(items.length);
	try {
		const options = this.getNodeParameter('options', 0, {}) as JsonToSpreadsheetBinaryOptions;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0, 'data');

		const binaryData = await convertJsonToSpreadsheetBinary.call(
			this,
			items,
			operation as JsonToSpreadsheetBinaryFormat,
			options,
			'File',
		);

		const newItem: INodeExecutionData = {
			json: {},
			binary: {
				[binaryPropertyName]: binaryData,
			},
			pairedItem,
		};

		returnData = [newItem];
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({
				json: {
					error: error.message,
				},
				pairedItem,
			});
		} else {
			throw new NodeOperationError(this.getNode(), error);
		}
	}

	return returnData;
}
