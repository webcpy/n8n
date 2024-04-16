import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import glob from 'fast-glob';
import { errorMapper } from '../helpers/utils';
import { updateDisplayOptions } from '@utils/utilities';

export const properties: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"operation": [
					"read"
				]
			}
		},
		"displayName": "文件选择器",
		"name": "fileSelector",
		"type": "string",
		"default": "",
		"required": true,
		"placeholder": "例如：/home/user/Pictures/**/*.png",
		"hint": "支持模式匹配，了解更多请点击<a href=\"https://github.com/micromatch/picomatch#basic-globbing\" target=\"_blank\">此处</a>",
		"description": "指定要读取多个文件的文件路径或路径模式"
	},
	{
		"displayOptions": {
			"show": {
				"operation": [
					"read"
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

				"displayName": "文件扩展名",
				"name": "fileExtension",
				"type": "string",
				"default": "",
				"placeholder": "例如 zip",
				"description": "输出二进制文件的扩展名"
			},
			{

				"displayName": "文件名",
				"name": "fileName",
				"type": "string",
				"default": "",
				"placeholder": "例如 data.zip",
				"description": "输出二进制文件的名称"
			},
			{

				"displayName": "MIME 类型",
				"name": "mimeType",
				"type": "string",
				"default": "",
				"placeholder": "例如 application/zip",
				"description": "输出二进制文件的 MIME 类型"
			},
			{

				"displayName": "将输出文件放入字段",
				"name": "dataPropertyName",
				"type": "string",
				"default": "data",
				"placeholder": "例如 data",
				"description": "默认情况下使用 'data'",
				"hint": "要将文件放入的输出二进制字段的名称"
			}
		]
	}

];

const displayOptions = {
	show: {
		operation: ['read'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, items: INodeExecutionData[]) {
	const returnData: INodeExecutionData[] = [];
	let fileSelector;

	for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
		try {
			fileSelector = this.getNodeParameter('fileSelector', itemIndex) as string;
			const options = this.getNodeParameter('options', itemIndex, {});

			let dataPropertyName = 'data';

			if (options.dataPropertyName) {
				dataPropertyName = options.dataPropertyName as string;
			}

			const files = await glob(fileSelector);

			const newItems: INodeExecutionData[] = [];
			for (const filePath of files) {
				const stream = await this.helpers.createReadStream(filePath);
				const binaryData = await this.helpers.prepareBinaryData(stream, filePath);

				if (options.fileName !== undefined) {
					binaryData.fileName = options.fileName as string;
				}

				if (options.fileExtension !== undefined) {
					binaryData.fileExtension = options.fileExtension as string;
				}

				if (options.mimeType !== undefined) {
					binaryData.mimeType = options.mimeType as string;
				}

				newItems.push({
					binary: {
						[dataPropertyName]: binaryData,
					},
					json: {
						mimeType: binaryData.mimeType,
						fileType: binaryData.fileType,
						fileName: binaryData.fileName,
						directory: binaryData.directory,
						fileExtension: binaryData.fileExtension,
						fileSize: binaryData.fileSize,
					},
					pairedItem: {
						item: itemIndex,
					},
				});
			}

			returnData.push(...newItems);
		} catch (error) {
			const nodeOperatioinError = errorMapper.call(this, error, itemIndex, {
				filePath: fileSelector,
				operation: 'read',
			});
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: nodeOperatioinError.message,
					},
					pairedItem: {
						item: itemIndex,
					},
				});
				continue;
			}
			throw nodeOperatioinError;
		}
	}

	return returnData;
}
