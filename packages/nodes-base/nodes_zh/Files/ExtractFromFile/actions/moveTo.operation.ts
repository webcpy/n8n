import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { BINARY_ENCODING, NodeOperationError, deepCopy, jsonParse } from 'n8n-workflow';

import get from 'lodash/get';
import set from 'lodash/set';
import unset from 'lodash/unset';

import iconv from 'iconv-lite';

import { icsCalendarToObject } from 'ts-ics';
import { updateDisplayOptions } from '@utils/utilities';
import { encodeDecodeOptions } from '@utils/descriptions';

export const properties: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"operation": [
					"csv",
					"html",
					"fromIcs",
					"fromJson",
					"ods",
					"pdf",
					"rtf",
					"text",
					"xml",
					"xls",
					"xlsx",
					"binaryToPropery"
				]
			}
		},
		"displayName": "输入二进制字段",
		"name": "binaryPropertyName",
		"type": "string",
		"default": "data",
		"required": true,
		"placeholder": "例如 data",
		"hint": "包含要处理的文件数据的输入字段的名称"
	},
	{
		"displayOptions": {
			"show": {
				"operation": [
					"csv",
					"html",
					"fromIcs",
					"fromJson",
					"ods",
					"pdf",
					"rtf",
					"text",
					"xml",
					"xls",
					"xlsx",
					"binaryToPropery"
				]
			}
		},
		"displayName": "目标输出字段",
		"name": "destinationKey",
		"type": "string",
		"default": "data",
		"required": true,
		"placeholder": "例如 data",
		"description": "将包含提取的数据的输出字段的名称"
	},
	{
		"displayOptions": {
			"show": {
				"operation": [
					"csv",
					"html",
					"fromIcs",
					"fromJson",
					"ods",
					"pdf",
					"rtf",
					"text",
					"xml",
					"xls",
					"xlsx",
					"binaryToPropery"
				]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayOptions": {
					"show": {
						"encoding": [
							"utf8",
							"cesu8",
							"ucs2"
						]
					}
				},
				"displayName": "文件编码",
				"name": "encoding",
				"type": "options",
				"options": encodeDecodeOptions,
				"default": "utf8",
				"description": "指定文件的编码，默认为 UTF-8"
			},
			{
				"displayOptions": {
					"show": {
						"encoding": [
							"utf8",
							"cesu8",
							"ucs2"
						]
					}
				},
				"displayName": "去除 BOM",
				"name": "stripBOM",
				"type": "boolean",
				"default": true,
				"description": "是否去除文件中的 BOM（字节顺序标记），这可能有助于在 BOM 的存在导致问题或不一致性的环境中"
			},
			{
				"displayName": "保留源",
				"name": "keepSource",
				"type": "options",
				"default": "json",
				"options": [
					{
						"name": "JSON",
						"value": "json",
						"description": "包含输入项的 JSON 数据"
					},
					{
						"name": "二进制",
						"value": "binary",
						"description": "包含输入项的二进制数据"
					},
					{
						"name": "两者",
						"value": "both",
						"description": "同时包含输入项的 JSON 和二进制数据"
					}
				]
			}
		]
	}

];

const displayOptions = {
	show: {
		operation: ['binaryToPropery', 'fromJson', 'text', 'fromIcs', 'xml'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
	operation: string,
) {
	const returnData: INodeExecutionData[] = [];

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			const item = items[itemIndex];
			const options = this.getNodeParameter('options', itemIndex);
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex);

			const newItem: INodeExecutionData = {
				json: {},
				pairedItem: { item: itemIndex },
			};

			const value = get(item.binary, binaryPropertyName);

			if (!value) continue;

			const encoding = (options.encoding as string) || 'utf8';
			const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

			if (options.keepSource && options.keepSource !== 'binary') {
				newItem.json = deepCopy(item.json);
			}

			let convertedValue: string | IDataObject;
			if (operation !== 'binaryToPropery') {
				convertedValue = iconv.decode(buffer, encoding, {
					stripBOM: options.stripBOM as boolean,
				});
			} else {
				convertedValue = Buffer.from(buffer).toString(BINARY_ENCODING);
			}

			if (operation === 'fromJson') {
				if (convertedValue === '') {
					convertedValue = {};
				} else {
					convertedValue = jsonParse(convertedValue);
				}
			}

			if (operation === 'fromIcs') {
				convertedValue = icsCalendarToObject(convertedValue as string);
			}

			const destinationKey = this.getNodeParameter('destinationKey', itemIndex, '') as string;
			set(newItem.json, destinationKey, convertedValue);

			if (options.keepSource === 'binary' || options.keepSource === 'both') {
				newItem.binary = item.binary;
			} else {
				// this binary data would not be included, but there also might be other binary data
				// which should be included, copy it over and unset current binary data
				newItem.binary = deepCopy(item.binary);
				unset(newItem.binary, binaryPropertyName);
			}

			returnData.push(newItem);
		} catch (error) {
			let errorDescription;
			if (error.message.includes('Unexpected token')) {
				error.message = "The file selected in 'Input Binary Field' is not in JSON format";
				errorDescription =
					"Try to change the operation or select a JSON file in 'Input Binary Field'";
			}
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
					pairedItem: {
						item: itemIndex,
					},
				});
				continue;
			}
			throw new NodeOperationError(this.getNode(), error, {
				itemIndex,
				description: errorDescription,
			});
		}
	}

	return returnData;
}
