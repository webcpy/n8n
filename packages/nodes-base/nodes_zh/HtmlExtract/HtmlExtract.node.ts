import cheerio from 'cheerio';
import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import get from 'lodash/get';

type Cheerio = ReturnType<typeof cheerio>;

interface IValueData {
	attribute?: string;
	cssSelector: string;
	returnValue: string;
	key: string;
	returnArray: boolean;
}

// The extraction functions
const extractFunctions: {
	[key: string]: ($: Cheerio, valueData: IValueData) => string | undefined;
} = {
	attribute: ($: Cheerio, valueData: IValueData): string | undefined =>
		$.attr(valueData.attribute!),
	html: ($: Cheerio, _valueData: IValueData): string | undefined => $.html() || undefined,
	text: ($: Cheerio, _valueData: IValueData): string | undefined => $.text(),
	value: ($: Cheerio, _valueData: IValueData): string | undefined => $.val(),
};

/**
 * Simple helper function which applies options
 */
function getValue($: Cheerio, valueData: IValueData, options: IDataObject) {
	const value = extractFunctions[valueData.returnValue]($, valueData);
	if (options.trimValues === false || value === undefined) {
		return value;
	}

	return value.trim();
}

export class HtmlExtract implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'HTML Extract',
		name: 'htmlExtract',
		icon: 'fa:cut',
		group: ['transform'],
		version: 1,
		hidden: true,
		subtitle: '={{$parameter["sourceData"] + ": " + $parameter["dataPropertyName"]}}',
		description: '从 HTML 提取数据',
		defaults: {
			name: 'HTML Extract',
			color: '#333377',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "源数据",
				"name": "sourceData",
				"type": "options",
				"options": [
					{
						"name": "二进制",
						"value": "binary"
					},
					{
						"name": "JSON",
						"value": "json"
					}
				],
				"default": "json",
				"description": "从二进制或JSON数据中读取HTML"
			},
			{
				"displayName": "输入二进制字段",
				"name": "dataPropertyName",
				"type": "string",
				"displayOptions": {
					"show": {
						"sourceData": [
							"binary"
						]
					}
				},
				"default": "data",
				"required": true,
				"hint": "包含要提取的文件的输入二进制字段的名称"
			},
			{
				"displayName": "JSON属性",
				"name": "dataPropertyName",
				"type": "string",
				"displayOptions": {
					"show": {
						"sourceData": [
							"json"
						]
					}
				},
				"default": "data",
				"required": true,
				"description": "JSON中包含要提取数据的HTML的属性名称。该属性可以包含一个字符串或一个字符串数组。"
			},
			{
				"displayName": "提取值",
				"name": "extractionValues",
				"placeholder": "添加值",
				"type": "fixedCollection",
				"typeOptions": {
					"multipleValues": true
				},
				"default": {},
				"options": [
					{
						"name": "values",
						"displayName": "值",
						"values": [
							{
								"displayName": "键",
								"name": "key",
								"type": "string",
								"default": "",
								"description": "要保存提取值的键"
							},
							{
								"displayName": "CSS选择器",
								"name": "cssSelector",
								"type": "string",
								"default": "",
								"placeholder": ".price",
								"description": "要使用的CSS选择器"
							},
							{
								"displayName": "返回值",
								"name": "returnValue",
								"type": "options",
								"options": [
									{
										"name": "属性",
										"value": "attribute",
										"description": "从元素中获取类似“class”的属性值"
									},
									{
										"name": "HTML",
										"value": "html",
										"description": "获取元素包含的HTML内容"
									},
									{
										"name": "文本",
										"value": "text",
										"description": "仅获取元素的文本内容"
									},
									{
										"name": "值",
										"value": "value",
										"description": "获取输入框、选择框或文本区域的值"
									}
								],
								"default": "text",
								"description": "应返回何种类型的数据"
							},
							{
								"displayName": "属性",
								"name": "attribute",
								"type": "string",
								"displayOptions": {
									"show": {
										"returnValue": [
											"attribute"
										]
									}
								},
								"default": "",
								"placeholder": "class",
								"description": "要返回值的属性的名称"
							},
							{
								"displayName": "返回数组",
								"name": "returnArray",
								"type": "boolean",
								"default": false,
								"description": "是否将值作为数组返回，因此如果找到多个值，它们也会单独返回。如果未设置，所有值将作为单个字符串返回。"
							}
						]
					}
				]
			},

			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "修剪值",
						"name": "trimValues",
						"type": "boolean",
						"default": true,
						"description": "是否自动删除值的开头和结尾的所有空格和换行符"
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const returnData: INodeExecutionData[] = [];

		let item: INodeExecutionData;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const dataPropertyName = this.getNodeParameter('dataPropertyName', itemIndex);
				const extractionValues = this.getNodeParameter(
					'extractionValues',
					itemIndex,
				) as IDataObject;
				const options = this.getNodeParameter('options', itemIndex, {});
				const sourceData = this.getNodeParameter('sourceData', itemIndex) as string;

				item = items[itemIndex];

				let htmlArray: string[] | string = [];
				if (sourceData === 'json') {
					const data = get(item.json, dataPropertyName, undefined);
					if (data === undefined) {
						throw new NodeOperationError(
							this.getNode(),
							`No property named "${dataPropertyName}" exists!`,
							{ itemIndex },
						);
					}
					htmlArray = data as string;
				} else {
					this.helpers.assertBinaryData(itemIndex, dataPropertyName);
					const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(
						itemIndex,
						dataPropertyName,
					);
					htmlArray = binaryDataBuffer.toString('utf-8');
				}

				// Convert it always to array that it works with a string or an array of strings
				if (!Array.isArray(htmlArray)) {
					htmlArray = [htmlArray];
				}

				for (const html of htmlArray as string[]) {
					const $ = cheerio.load(html);

					const newItem: INodeExecutionData = {
						json: {},
						pairedItem: {
							item: itemIndex,
						},
					};

					// Iterate over all the defined values which should be extracted
					let htmlElement;
					for (const valueData of extractionValues.values as IValueData[]) {
						htmlElement = $(valueData.cssSelector);

						if (valueData.returnArray) {
							// An array should be returned so iterate over one
							// value at a time
							newItem.json[valueData.key] = [];
							htmlElement.each((_, el) => {
								(newItem.json[valueData.key] as Array<string | undefined>).push(
									getValue($(el), valueData, options),
								);
							});
						} else {
							// One single value should be returned
							newItem.json[valueData.key] = getValue(htmlElement, valueData, options);
						}
					}
					returnData.push(newItem);
				}
			} catch (error) {
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
				throw error;
			}
		}

		return [returnData];
	}
}
