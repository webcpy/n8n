import type { Readable } from 'stream';
import type {
	IDataObject,
	IExecuteFunctions,
	IN8nHttpFullResponse,
	IN8nHttpResponse,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { jsonParse, BINARY_ENCODING, NodeOperationError } from 'n8n-workflow';
import set from 'lodash/set';
import jwt from 'jsonwebtoken';
import { formatPrivateKey, generatePairedItemData } from '../../utils/utilities';

export class RespondToWebhook implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Respond to Webhook',
		icon: 'file:webhook.svg',
		name: 'respondToWebhook',
		group: ['transform'],
		version: [1, 1.1],
		description: '返回 Webhook 的数据',
		defaults: {
			name: 'Respond to Webhook',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'jwtAuth',
				required: true,
				displayOptions: {
					show: {
						respondWith: ['jwt'],
					},
				},
			},
		],
		properties: [
			{
				"displayName": "确保“Webhook”节点的“Respond”参数设置为“使用Respond to Webhook Node”<a href='https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.respondtowebhook/' target='_blank'>更多详情</a>",
				"name": "generalNotice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "Respond With",
				"name": "respondWith",
				"type": "options",
				"options": [
					{
						"name": "所有传入项目",
						"value": "allIncomingItems",
						"description": "使用所有输入的 JSON 项目进行响应"
					},
					{
						"name": "二进制文件",
						"value": "binary",
						"description": "使用传入文件的二进制数据进行响应"
					},
					{
						"name": "第一个传入项目",
						"value": "firstIncomingItem",
						"description": "使用第一个输入的 JSON 项目进行响应"
					},
					{
						"name": "JSON",
						"value": "json",
						"description": "使用自定义 JSON 主体进行响应"
					},
					{
						"name": "JWT 令牌",
						"value": "jwt",
						"description": "使用 JWT 令牌进行响应"
					},
					{
						"name": "无数据",
						"value": "noData",
						"description": "使用空主体进行响应"
					},
					{
						"name": "重定向",
						"value": "redirect",
						"description": "使用重定向到给定 URL 进行响应"
					},
					{
						"name": "文本",
						"value": "text",
						"description": "使用简单的文本消息主体进行响应"
					}
				],
				"default": "firstIncomingItem",
				"description": "应返回的数据"
			},
			{
				"displayName": "凭据",
				"name": "credentials",
				"type": "credentials",
				"default": "",
				"displayOptions": {
					"show": {
						"respondWith": ["jwt"]
					}
				}
			},
			{
				"displayName": "当使用表达式时，请注意此节点仅对输入数据中的第一个项目运行",
				"name": "webhookNotice",
				"type": "notice",
				"displayOptions": {
					"show": {
						"respondWith": ["json", "text", "jwt"]
					}
				},
				"default": ""
			},


			{
				"displayOptions": {
					"show": {
						"respondWith": ["redirect"]
					}
				},
				"default": "",
				"description": "要重定向到的 URL",
				"displayName": "重定向 URL",
				"name": "redirectURL",
				"placeholder": "例如 http://www.n8n.io",
				"required": true,
				"type": "string",
				"validateType": "url"
			},
			{
				"displayOptions": {
					"show": {
						"respondWith": ["json"]
					}
				},
				"default": "{\n  \"myField\": \"value\"\n}",
				"description": "HTTP 响应的 JSON 数据",
				"displayName": "响应主体",
				"name": "responseBody",
				"type": "json",
				"typeOptions": {
					"rows": 4
				}
			},
			{
				"displayOptions": {
					"show": {
						"respondWith": ["jwt"]
					}
				},
				"default": "{\n  \"myField\": \"value\"\n}",
				"description": "要包含在 JWT 令牌中的有效载荷",
				"displayName": "有效载荷",
				"name": "payload",
				"type": "json",
				"typeOptions": {
					"rows": 4
				},
				"validateType": "object"
			},
			{
				"displayOptions": {
					"show": {
						"respondWith": ["text"]
					}
				},
				"default": "",
				"description": "HTTP 响应的文本数据",
				"displayName": "响应主体",
				"name": "responseBody",
				"placeholder": "例如 完成工作流",
				"type": "string",
				"typeOptions": {
					"rows": 2
				}
			},



			{
				"displayOptions": {
					"show": {
						"respondWith": ["binary"]
					}
				},
				"default": "automatically",
				"description": "响应数据源",
				"displayName": "响应数据源",
				"name": "responseDataSource",
				"options": [
					{
						"description": "如果输入数据将包含单个二进制数据，请使用此选项",
						"name": "自动从输入中选择",
						"value": "automatically"
					},
					{
						"description": "输入二进制数据的节点输入字段的名称",
						"name": "手动指定",
						"value": "set"
					}
				],
				"type": "options",
			},
			{
				"displayOptions": {
					"show": {
						"respondWith": ["binary"],
						"responseDataSource": ["set"]
					}
				},
				"default": "data",
				"description": "包含二进制数据的节点输入字段的名称",
				"displayName": "输入字段名称",
				"name": "inputFieldName",
				"required": true,
				"type": "string"
			},


			{
				"displayOptions": {
					"show": {
						"/respondWith": ["allIncomingItems", "firstIncomingItem"]
					}
				},
				"default": {},
				"description": "选项",
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"options": [
					{
						"default": 200,
						"description": "要返回的 HTTP 响应代码。默认为 200。",
						"displayName": "响应代码",
						"name": "responseCode",
						"type": "number",
						"typeOptions": {
							"minValue": 100,
							"maxValue": 599
						}
					},
					{
						"default": {},
						"description": "为 Webhook 响应添加头部",
						"displayName": "响应头",
						"name": "responseHeaders",
						"placeholder": "添加响应头",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": true
						},
						"options": [
							{
								"displayName": "条目",
								"name": "entries",
								"values": [
									{
										"default": "",
										"description": "头部的名称",
										"displayName": "名称",
										"name": "name",
										"type": "string"
									},
									{
										"default": "",
										"description": "头部的值",
										"displayName": "值",
										"name": "value",
										"type": "string"
									}
								]
							}
						]
					},
					{
						"default": "",
						"description": "要将所有项目放入的响应字段的名称",
						"displayName": "将响应放入字段",
						"name": "responseKey",
						"placeholder": "例如 data",
						"type": "string"
					}
				],
				"placeholder": "添加选项"
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const nodeVersion = this.getNode().typeVersion;

		try {
			if (nodeVersion >= 1.1) {
				const connectedNodes = this.getParentNodes(this.getNode().name);
				if (!connectedNodes.some((node) => node.type === 'n8n-nodes-base.webhook')) {
					throw new NodeOperationError(
						this.getNode(),
						new Error('No Webhook node found in the workflow'),
						{
							description:
								'Insert a Webhook node to your workflow and set the “Respond” parameter to “Using Respond to Webhook Node” ',
						},
					);
				}
			}

			const respondWith = this.getNodeParameter('respondWith', 0) as string;
			const options = this.getNodeParameter('options', 0, {});

			const headers = {} as IDataObject;
			if (options.responseHeaders) {
				for (const header of (options.responseHeaders as IDataObject).entries as IDataObject[]) {
					if (typeof header.name !== 'string') {
						header.name = header.name?.toString();
					}
					headers[header.name?.toLowerCase() as string] = header.value?.toString();
				}
			}

			let statusCode = (options.responseCode as number) || 200;
			let responseBody: IN8nHttpResponse | Readable;
			if (respondWith === 'json') {
				const responseBodyParameter = this.getNodeParameter('responseBody', 0) as string;
				if (responseBodyParameter) {
					if (typeof responseBodyParameter === 'object') {
						responseBody = responseBodyParameter;
					} else {
						try {
							responseBody = jsonParse(responseBodyParameter);
						} catch (error) {
							throw new NodeOperationError(this.getNode(), error as Error, {
								message: "Invalid JSON in 'Response Body' field",
								description:
									"Check that the syntax of the JSON in the 'Response Body' parameter is valid",
							});
						}
					}
				}
			} else if (respondWith === 'jwt') {
				try {
					const { keyType, secret, algorithm, privateKey } = (await this.getCredentials(
						'jwtAuth',
					)) as {
						keyType: 'passphrase' | 'pemKey';
						privateKey: string;
						secret: string;
						algorithm: jwt.Algorithm;
					};

					let secretOrPrivateKey;

					if (keyType === 'passphrase') {
						secretOrPrivateKey = secret;
					} else {
						secretOrPrivateKey = formatPrivateKey(privateKey);
					}
					const payload = this.getNodeParameter('payload', 0, {}) as IDataObject;
					const token = jwt.sign(payload, secretOrPrivateKey, { algorithm });
					responseBody = { token };
				} catch (error) {
					throw new NodeOperationError(this.getNode(), error as Error, {
						message: 'Error signing JWT token',
					});
				}
			} else if (respondWith === 'allIncomingItems') {
				const respondItems = items.map((item) => item.json);
				responseBody = options.responseKey
					? set({}, options.responseKey as string, respondItems)
					: respondItems;
			} else if (respondWith === 'firstIncomingItem') {
				responseBody = options.responseKey
					? set({}, options.responseKey as string, items[0].json)
					: items[0].json;
			} else if (respondWith === 'text') {
				responseBody = this.getNodeParameter('responseBody', 0) as string;
			} else if (respondWith === 'binary') {
				const item = items[0];

				if (item.binary === undefined) {
					throw new NodeOperationError(this.getNode(), 'No binary data exists on the first item!');
				}

				let responseBinaryPropertyName: string;

				const responseDataSource = this.getNodeParameter('responseDataSource', 0) as string;

				if (responseDataSource === 'set') {
					responseBinaryPropertyName = this.getNodeParameter('inputFieldName', 0) as string;
				} else {
					const binaryKeys = Object.keys(item.binary);
					if (binaryKeys.length === 0) {
						throw new NodeOperationError(
							this.getNode(),
							'No binary data exists on the first item!',
						);
					}
					responseBinaryPropertyName = binaryKeys[0];
				}

				const binaryData = this.helpers.assertBinaryData(0, responseBinaryPropertyName);
				if (binaryData.id) {
					responseBody = { binaryData };
				} else {
					responseBody = Buffer.from(binaryData.data, BINARY_ENCODING);
					headers['content-length'] = (responseBody as Buffer).length;
				}

				if (!headers['content-type']) {
					headers['content-type'] = binaryData.mimeType;
				}
			} else if (respondWith === 'redirect') {
				headers.location = this.getNodeParameter('redirectURL', 0) as string;
				statusCode = (options.responseCode as number) ?? 307;
			} else if (respondWith !== 'noData') {
				throw new NodeOperationError(
					this.getNode(),
					`The Response Data option "${respondWith}" is not supported!`,
				);
			}

			const response: IN8nHttpFullResponse = {
				body: responseBody,
				headers,
				statusCode,
			};

			this.sendResponse(response);
		} catch (error) {
			if (this.continueOnFail()) {
				const itemData = generatePairedItemData(items.length);
				const returnData = this.helpers.constructExecutionMetaData(
					[{ json: { error: error.message } }],
					{ itemData },
				);
				return [returnData];
			}

			throw error;
		}

		return [items];
	}
}
