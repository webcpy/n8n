import { Builder, Parser } from 'xml2js';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, deepCopy } from 'n8n-workflow';

export class Xml implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XML',
		name: 'xml',
		icon: 'fa:file-code',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["mode"]==="jsonToxml" ? "JSON to XML" : "XML to JSON"}}',
		description: '将数据转换成 XML',
		defaults: {
			name: 'XML',
			color: '#333377',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "模式",
				"name": "mode",
				"type": "options",
				"options": [
					{
						"name": "JSON 到 XML",
						"value": "jsonToxml",
						"description": "将数据从 JSON 转换为 XML"
					},
					{
						"name": "XML 到 JSON",
						"value": "xmlToJson",
						"description": "将数据从 XML 转换为 JSON"
					}
				],
				"default": "xmlToJson",
				"description": "要将数据转换成何种格式"
			},
			{
				"displayName": "如果您的 XML 数据在二进制文件中，请使用“提取文件”节点先将其转换为文本",
				"name": "xmlNotice",
				"type": "notice",
				"default": "",
				"displayOptions": {
					"show": {
						"mode": ["xmlToJson"]
					}
				}
			},

			// ----------------------------------
			//         option:jsonToxml
			// ----------------------------------
			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"displayOptions": {
					"show": {
						"mode": ["jsonToxml"]
					}
				},
				"default": "data",
				"required": true,
				"description": "包含转换后的 XML 数据的属性名称"
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"displayOptions": {
					"show": {
						"mode": ["jsonToxml"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "允许代理字符",
						"name": "allowSurrogateChars",
						"type": "boolean",
						"default": false,
						"description": "是否允许使用 Unicode 代理块中的字符"
					},
					{
						"displayName": "属性键",
						"name": "attrkey",
						"type": "string",
						"default": "$",
						"description": "用于访问属性的前缀"
					},
					{
						"displayName": "Cdata",
						"name": "cdata",
						"type": "boolean",
						"default": false,
						"description": "是否将文本节点包装在 &lt;![CDATA[ ... ]]&gt; 中，而不是在必要时进行转义。如果不需要，则不会添加 &lt;![CDATA[ ... ]]&gt;"
					},
					{
						"displayName": "字符键",
						"name": "charkey",
						"type": "string",
						"default": "_",
						"description": "用于访问字符内容的前缀"
					},
					{
						"displayName": "无头",
						"name": "headless",
						"type": "boolean",
						"default": false,
						"description": "是否省略 XML 头部"
					},
					{
						"displayName": "根名称",
						"name": "rootName",
						"type": "string",
						"default": "root",
						"description": "要使用的根元素名称"
					}
				]
			},


			// ----------------------------------
			//         option:xmlToJson
			// ----------------------------------
			{
				"displayName": "属性名称",
				"name": "dataPropertyName",
				"type": "string",
				"displayOptions": {
					"show": {
						"mode": ["xmlToJson"]
					}
				},
				"default": "data",
				"required": true,
				"description": "包含要转换的 XML 数据的属性名称"
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"displayOptions": {
					"show": {
						"mode": ["xmlToJson"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "属性键",
						"name": "attrkey",
						"type": "string",
						"default": "$",
						"description": "用于访问属性的前缀"
					},
					{
						"displayName": "字符键",
						"name": "charkey",
						"type": "string",
						"default": "_",
						"description": "用于访问字符内容的前缀"
					},
					{
						"displayName": "显式数组",
						"name": "explicitArray",
						"type": "boolean",
						"default": false,
						"description": "如果为 true，则始终将子节点放入数组中；否则，仅在存在多个子节点时才创建数组"
					},
					{
						"displayName": "显式根",
						"name": "explicitRoot",
						"type": "boolean",
						"default": true,
						"description": "如果要获取结果对象中的根节点，则设置为 true"
					},
					{
						"displayName": "忽略属性",
						"name": "ignoreAttrs",
						"type": "boolean",
						"default": false,
						"description": "是否忽略所有 XML 属性并仅创建文本节点"
					},
					{
						"displayName": "合并属性",
						"name": "mergeAttrs",
						"type": "boolean",
						"default": true,
						"description": "是否将属性和子元素合并为父级属性，而不是以子属性对象的方式进行键控属性。如果 ignoreAttrs 为 true，则此选项将被忽略"
					},
					{
						"displayName": "规范化",
						"name": "normalize",
						"type": "boolean",
						"default": false,
						"description": "是否规范化文本节点内部的空格"
					},
					{
						"displayName": "规范化标签",
						"name": "normalizeTags",
						"type": "boolean",
						"default": false,
						"description": "是否将所有标签名称规范化为小写"
					},
					{
						"displayName": "修剪",
						"name": "trim",
						"type": "boolean",
						"default": false,
						"description": "是否修剪文本节点开头和结尾的空格"
					}
				]
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const mode = this.getNodeParameter('mode', 0) as string;
		const dataPropertyName = this.getNodeParameter('dataPropertyName', 0);
		const options = this.getNodeParameter('options', 0, {});

		let item: INodeExecutionData;
		const returnData: INodeExecutionData[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				if (mode === 'xmlToJson') {
					const parserOptions = Object.assign(
						{
							mergeAttrs: true,
							explicitArray: false,
						},
						options,
					);

					const parser = new Parser(parserOptions);

					if (item.json[dataPropertyName] === undefined) {
						throw new NodeOperationError(
							this.getNode(),
							`Item has no JSON property called "${dataPropertyName}"`,
							{ itemIndex },
						);
					}

					const json = await parser.parseStringPromise(item.json[dataPropertyName] as string);
					returnData.push({ json: deepCopy(json) });
				} else if (mode === 'jsonToxml') {
					const builder = new Builder(options);

					returnData.push({
						json: {
							[dataPropertyName]: builder.buildObject(items[itemIndex].json),
						},
						pairedItem: {
							item: itemIndex,
						},
					});
				} else {
					throw new NodeOperationError(this.getNode(), `The operation "${mode}" is not known!`, {
						itemIndex,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					items[itemIndex] = {
						json: {
							error: error.message,
						},
						pairedItem: {
							item: itemIndex,
						},
					};
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
