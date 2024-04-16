import type { Readable } from 'stream';

import type {
	IBinaryKeyData,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IRequestOptionsSimplified,
	PaginationOptions,
	JsonObject,
	IRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

import {
	BINARY_ENCODING,
	NodeApiError,
	NodeOperationError,
	jsonParse,
	removeCircularRefs,
	sleep,
} from 'n8n-workflow';

import set from 'lodash/set';
import type { BodyParameter, IAuthDataSanitizeKeys } from '../GenericFunctions';
import {
	binaryContentTypes,
	getOAuth2AdditionalParameters,
	prepareRequestBody,
	reduceAsync,
	replaceNullValues,
	sanitizeUiMessage,
} from '../GenericFunctions';
import { keysToLowercase } from '@utils/utilities';

function toText<T>(data: T) {
	if (typeof data === 'object' && data !== null) {
		return JSON.stringify(data);
	}
	return data;
}
export class HttpRequestV3 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			subtitle: '={{$parameter["method"] + ": " + $parameter["url"]}}',
			version: [3, 4, 4.1, 4.2],
			defaults: {
				name: 'HTTP Request',
				color: '#0004F5',
			},
			inputs: ['main'],
			outputs: ['main'],
			credentials: [],
			properties: [
				{
					displayName: '',
					name: 'curl 导入',
					type: 'curlImport',
					default: '',
				},
				{
					"displayName": "方法",
					"name": "method",
					"type": "options",
					"options": [
						{
							"name": "DELETE",
							"value": "DELETE"
						},
						{
							"name": "GET",
							"value": "GET"
						},
						{
							"name": "HEAD",
							"value": "HEAD"
						},
						{
							"name": "OPTIONS",
							"value": "OPTIONS"
						},
						{
							"name": "PATCH",
							"value": "PATCH"
						},
						{
							"name": "POST",
							"value": "POST"
						},
						{
							"name": "PUT",
							"value": "PUT"
						}
					],
					"default": "GET",
					"description": "要使用的请求方法"
				},

				{
					"displayName": "URL",
					"name": "url",
					"type": "string",
					"default": "",
					"placeholder": "http://example.com/index.html",
					"description": "要发送请求的URL",
					"required": true
				},
				{
					"displayName": "身份验证",
					"name": "authentication",
					"noDataExpression": true,
					"type": "options",
					"options": [
						{
							"name": "无",
							"value": "none"
						},
						{
							"name": "预定义凭据类型",
							"value": "predefinedCredentialType",
							"description": "我们已经为许多服务实现了身份验证，这样您就不必手动设置它"
						},
						{
							"name": "通用凭据类型",
							"value": "genericCredentialType",
							"description": "完全可定制。可以选择基本身份验证、头部身份验证、OAuth2等"
						}
					],
					"default": "none"
				},
				{
					"displayName": "凭据类型",
					"name": "nodeCredentialType",
					"type": "credentialsSelect",
					"noDataExpression": true,
					"required": true,
					"default": "",
					"credentialTypes": [
						"extends:oAuth2Api",
						"extends:oAuth1Api",
						"has:authenticate"
					],
					"displayOptions": {
						"show": {
							"authentication": [
								"predefinedCredentialType"
							]
						}
					}
				},
				{
					"displayName": "请确保您已经为凭据中的服务账号指定了范围",
					"name": "googleApiWarning",
					"type": "notice",
					"default": "",
					"displayOptions": {
						"show": {
							"nodeCredentialType": [
								"googleApi"
							]
						}
					}
				},
				{
					"displayName": "通用认证类型",
					"name": "genericAuthType",
					"type": "credentialsSelect",
					"required": true,
					"default": "",
					"credentialTypes": [
						"has:genericAuth"
					],
					"displayOptions": {
						"show": {
							"authentication": [
								"genericCredentialType"
							]
						}
					}
				},
				{
					"displayName": "发送查询参数",
					"name": "sendQuery",
					"type": "boolean",
					"default": false,
					"noDataExpression": true,
					"description": "请求是否具有查询参数"
				},
				{
					"displayName": "指定查询参数",
					"name": "specifyQuery",
					"type": "options",
					"displayOptions": {
						"show": {
							"sendQuery": [
								true
							]
						}
					},
					"options": [
						{
							"name": "使用以下字段",
							"value": "keypair"
						},
						{
							"name": "使用JSON",
							"value": "json"
						}
					],
					"default": "keypair"
				},

				{
					"displayName": "查询参数",
					"name": "queryParameters",
					"type": "fixedCollection",
					"displayOptions": {
						"show": {
							"sendQuery": [
								true
							],
							"specifyQuery": [
								"keypair"
							]
						}
					},
					"typeOptions": {
						"multipleValues": true
					},
					"placeholder": "添加参数",
					"default": {
						"parameters": [
							{
								"name": "",
								"value": ""
							}
						]
					},
					"options": [
						{
							"name": "parameters",
							"displayName": "参数",
							"values": [
								{
									"displayName": "名称",
									"name": "name",
									"type": "string",
									"default": ""
								},
								{
									"displayName": "值",
									"name": "value",
									"type": "string",
									"default": ""
								}
							]
						}
					]
				},
				{
					"displayName": "JSON",
					"name": "jsonQuery",
					"type": "json",
					"displayOptions": {
						"show": {
							"sendQuery": [
								true
							],
							"specifyQuery": [
								"json"
							]
						}
					},
					"default": ""
				},
				{
					"displayName": "发送头部",
					"name": "sendHeaders",
					"type": "boolean",
					"default": false,
					"noDataExpression": true,
					"description": "请求是否具有头部"
				},
				{
					"displayName": "指定头部",
					"name": "specifyHeaders",
					"type": "options",
					"displayOptions": {
						"show": {
							"sendHeaders": [
								true
							]
						}
					},
					"options": [
						{
							"name": "使用以下字段",
							"value": "keypair"
						},
						{
							"name": "使用JSON",
							"value": "json"
						}
					],
					"default": "keypair"
				},
				{
					"displayName": "头部参数",
					"name": "headerParameters",
					"type": "fixedCollection",
					"displayOptions": {
						"show": {
							"sendHeaders": [
								true
							],
							"specifyHeaders": [
								"keypair"
							]
						}
					},
					"typeOptions": {
						"multipleValues": true
					},
					"placeholder": "添加参数",
					"default": {
						"parameters": [
							{
								"name": "",
								"value": ""
							}
						]
					},
					"options": [
						{
							"name": "parameters",
							"displayName": "参数",
							"values": [
								{
									"displayName": "名称",
									"name": "name",
									"type": "string",
									"default": ""
								},
								{
									"displayName": "值",
									"name": "value",
									"type": "string",
									"default": ""
								}
							]
						}
					]
				},

				{
					"displayName": "JSON",
					"name": "jsonHeaders",
					"type": "json",
					"displayOptions": {
						"show": {
							"sendHeaders": [
								true
							],
							"specifyHeaders": [
								"json"
							]
						}
					},
					"default": ""
				},
				{
					"displayName": "发送主体",
					"name": "sendBody",
					"type": "boolean",
					"default": false,
					"noDataExpression": true,
					"description": "请求是否具有主体"
				},
				{
					"displayName": "主体内容类型",
					"name": "contentType",
					"type": "options",
					"displayOptions": {
						"show": {
							"sendBody": [
								true
							]
						}
					},
					"options": [
						{
							"name": "表单 URL 编码",
							"value": "form-urlencoded"
						},
						{
							"name": "表单数据",
							"value": "multipart-form-data"
						},
						{
							"name": "JSON",
							"value": "json"
						},
						{
							"name": "n8n 二进制文件",
							"value": "binaryData"
						},
						{
							"name": "raw",
							"value": "raw"
						}
					],
					"default": "json",
					"description": "用于发送主体参数的 Content-Type"
				},
				{
					"displayName": "指定主体",
					"name": "specifyBody",
					"type": "options",
					"displayOptions": {
						"show": {
							"sendBody": [
								true
							],
							"contentType": [
								"json"
							]
						}
					},
					"options": [
						{
							"name": "使用以下字段",
							"value": "keypair"
						},
						{
							"name": "使用 JSON",
							"value": "json"
						}
					],
					"default": "keypair",
					"description": "可以使用显式字段（<code>keypair</code>）或使用 JavaScript 对象（<code>json</code>）指定主体"
				},
				{
					"displayName": "主体参数",
					"name": "bodyParameters",
					"type": "fixedCollection",
					"displayOptions": {
						"show": {
							"sendBody": [
								true
							],
							"contentType": [
								"json"
							],
							"specifyBody": [
								"keypair"
							]
						}
					},
					"typeOptions": {
						"multipleValues": true
					},
					"placeholder": "添加参数",
					"default": {
						"parameters": [
							{
								"name": "",
								"value": ""
							}
						]
					},
					"options": [
						{
							"name": "parameters",
							"displayName": "参数",
							"values": [
								{
									"displayName": "名称",
									"name": "name",
									"type": "string",
									"default": "",
									"description": "要设置的字段的 ID。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定 ID。"
								},
								{
									"displayName": "值",
									"name": "value",
									"type": "string",
									"default": "",
									"description": "要设置的字段的值"
								}
							]
						}
					]
				},
				{
					"displayName": "JSON",
					"name": "jsonBody",
					"type": "json",
					"displayOptions": {
						"show": {
							"sendBody": [
								true
							],
							"contentType": [
								"json"
							],
							"specifyBody": [
								"json"
							]
						}
					},
					"default": ""
				},

				{
					"displayName": "BodyParameters",
					"name": "bodyParameters",
					"type": "fixedCollection",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["multipart-form-data"]
						}
					},
					"typeOptions": {
						"multipleValues": true
					},
					"placeholder": "添加参数",
					"default": {
						"parameters": [
							{
								"name": "",
								"value": ""
							}
						]
					},
					"options": [
						{
							"name": "parameters",
							"displayName": "参数",
							"values": [
								{
									"displayName": "参数类型",
									"name": "parameterType",
									"type": "options",
									"options": [
										{
											"name": "n8n 二进制文件",
											"value": "formBinaryData"
										},
										{
											"name": "表单数据",
											"value": "formData"
										}
									],
									"default": "formData"
								},
								{
									"displayName": "名称",
									"name": "name",
									"type": "string",
									"default": "",
									"description": "要设置的字段的 ID。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定 ID。"
								},
								{
									"displayName": "值",
									"name": "value",
									"type": "string",
									"displayOptions": {
										"show": {
											"parameterType": ["formData"]
										}
									},
									"default": "",
									"description": "要设置的字段的值"
								},
								{
									"displayName": "输入数据字段名称",
									"name": "inputDataFieldName",
									"type": "string",
									"displayOptions": {
										"show": {
											"parameterType": ["formBinaryData"]
										}
									},
									"default": "",
									"description": "包含要处理的二进制文件数据的传入字段的名称"
								}
							]
						}
					]
				},
				{
					"displayName": "SpecifyBody",
					"name": "specifyBody",
					"type": "options",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["form-urlencoded"]
						}
					},
					"options": [
						{
							"name": "使用以下字段",
							"value": "keypair"
						},
						{
							"name": "使用单个字段",
							"value": "string"
						}
					],
					"default": "keypair"
				},

				{
					"displayName": "BodyParameters",
					"name": "bodyParameters",
					"type": "fixedCollection",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["form-urlencoded"],
							"specifyBody": ["keypair"]
						}
					},
					"typeOptions": {
						"multipleValues": true
					},
					"placeholder": "添加参数",
					"default": {
						"parameters": [
							{
								"name": "",
								"value": ""
							}
						]
					},
					"options": [
						{
							"name": "parameters",
							"displayName": "参数",
							"values": [
								{
									"displayName": "名称",
									"name": "name",
									"type": "string",
									"default": "",
									"description": "要设置的字段的 ID。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定 ID。"
								},
								{
									"displayName": "值",
									"name": "value",
									"type": "string",
									"default": "",
									"description": "要设置的字段的值"
								}
							]
						}
					]
				},
				{
					"displayName": "Body",
					"name": "body",
					"type": "string",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"specifyBody": ["string"]
						}
					},
					"default": "",
					"placeholder": "field1=value1&field2=value2"
				},

				{
					"displayName": "输入数据字段名称",
					"name": "inputDataFieldName",
					"type": "string",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["binaryData"]
						}
					},
					"default": "",
					"description": "包含要处理的二进制文件数据的传入字段的名称"
				},
				{
					"displayName": "内容类型",
					"name": "rawContentType",
					"type": "string",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["raw"]
						}
					},
					"default": "",
					"placeholder": "text/html"
				},
				{
					"displayName": "Body",
					"name": "body",
					"type": "string",
					"displayOptions": {
						"show": {
							"sendBody": [true],
							"contentType": ["raw"]
						}
					},
					"default": "",
					"placeholder": ""
				},

				{
					displayName: '可选项',
					name: 'options',
					type: 'collection',
					placeholder: '添加 可选项',
					default: {},
					options: [
						{
							"displayName": "批处理",
							"name": "batching",
							"placeholder": "添加批处理",
							"type": "fixedCollection",
							"typeOptions": {
								"multipleValues": false
							},
							"default": {
								"batch": {}
							},
							"options": [
								{
									"displayName": "批处理",
									"name": "batch",
									"values": [
										{
											"displayName": "每批项目数",
											"name": "batchSize",
											"type": "number",
											"typeOptions": {
												"minValue": -1
											},
											"default": 50,
											"description": "输入将被分批处理以限制请求速率。-1 为禁用。0 将视为 1。"
										},
										{
											"displayName": "批间隔时间（毫秒）",
											"name": "batchInterval",
											"type": "number",
											"typeOptions": {
												"minValue": 0
											},
											"default": 1000,
											"description": "每批请求之间的时间间隔（毫秒）。0 为禁用。"
										}
									]
								}
							]
						},
						{
							"displayName": "忽略 SSL 问题",
							"name": "allowUnauthorizedCerts",
							"type": "boolean",
							"noDataExpression": true,
							"default": false,
							"description": "是否即使无法验证 SSL 证书也要下载响应"
						},
						{
							"displayName": "查询参数中的数组格式",
							"name": "queryParameterArrays",
							"type": "options",
							"displayOptions": {
								"show": {
									"/sendQuery": [true]
								}
							},
							"options": [
								{
									"name": "无括号",
									"value": "repeat",
									"description": "例如 foo=bar&foo=qux"
								},
								{
									"name": "仅括号",
									"value": "brackets",
									"description": "例如 foo[]=bar&foo[]=qux"
								},
								{
									"name": "带索引的括号",
									"value": "indices",
									"description": "例如 foo[0]=bar&foo[1]=qux"
								}
							],
							"default": "brackets"
						},
						{
							"displayName": "重定向",
							"name": "redirect",
							"placeholder": "添加重定向",
							"type": "fixedCollection",
							"typeOptions": {
								"multipleValues": false
							},
							"default": {
								"redirect": {}
							},
							"options": [
								{
									"displayName": "重定向",
									"name": "redirect",
									"values": [
										{
											"displayName": "跟随重定向",
											"name": "followRedirects",
											"type": "boolean",
											"default": false,
											"noDataExpression": true,
											"description": "是否要跟随所有重定向"
										},
										{
											"displayName": "最大重定向数",
											"name": "maxRedirects",
											"type": "number",
											"displayOptions": {
												"show": {
													"followRedirects": [true]
												}
											},
											"default": 21,
											"description": "要跟随的最大重定向数"
										}
									]
								}
							],
							"displayOptions": {
								"show": {
									"@version": [1, 2, 3]
								}
							}
						},

						{
							"displayName": "重定向",
							"name": "redirect",
							"placeholder": "添加重定向",
							"type": "fixedCollection",
							"typeOptions": {
								"multipleValues": false
							},
							"default": {
								"redirect": {}
							},
							"options": [
								{
									"displayName": "重定向",
									"name": "redirect",
									"values": [
										{
											"displayName": "跟随重定向",
											"name": "followRedirects",
											"type": "boolean",
											"default": true,
											"noDataExpression": true,
											"description": "是否跟随所有重定向"
										},
										{
											"displayName": "最大重定向次数",
											"name": "maxRedirects",
											"type": "number",
											"displayOptions": {
												"show": {
													"followRedirects": [true]
												}
											},
											"default": 21,
											"description": "要跟随的最大重定向次数"
										}
									]
								}
							],
							"displayOptions": {
								"hide": {
									"@version": [1, 2, 3]
								}
							}
						},
						{
							"displayName": "响应",
							"name": "response",
							"placeholder": "添加响应",
							"type": "fixedCollection",
							"typeOptions": {
								"multipleValues": false
							},
							"default": {
								"response": {}
							},
							"options": [
								{
									"displayName": "响应",
									"name": "response",
									"values": [
										{
											"displayName": "包括响应头和状态",
											"name": "fullResponse",
											"type": "boolean",
											"default": false,
											"description": "是否返回完整的响应（头部和响应状态码）数据而不仅仅是主体"
										},
										{
											"displayName": "永不报错",
											"name": "neverError",
											"type": "boolean",
											"default": false,
											"description": "即使状态码不是2xx也会成功"
										},
										{
											"displayName": "响应格式",
											"name": "responseFormat",
											"type": "options",
											"noDataExpression": true,
											"options": [
												{
													"name": "自动检测",
													"value": "autodetect"
												},
												{
													"name": "文件",
													"value": "file"
												},
												{
													"name": "JSON",
													"value": "json"
												},
												{
													"name": "文本",
													"value": "text"
												}
											],
											"default": "autodetect",
											"description": "从URL返回数据的格式"
										},
										{
											"displayName": "将输出放在字段中",
											"name": "outputPropertyName",
											"type": "string",
											"default": "data",
											"required": true,
											"displayOptions": {
												"show": {
													"responseFormat": ["file", "text"]
												}
											},
											"description": "要写入读取文件数据的二进制属性的名称"
										}
									]
								}
							]
						},

						{
							displayName: '分页',
							name: 'pagination',
							placeholder: '添加 分页',
							type: 'fixedCollection',
							typeOptions: {
								multipleValues: false,
							},
							default: {
								pagination: {},
							},
							options: [
								{
									"displayName": "分页",
									"name": "pagination",
									"values": [
										{
											"displayName": "分页模式",
											"name": "paginationMode",
											"type": "options",
											"typeOptions": {
												"noDataExpression": true
											},
											"options": [
												{
													"name": "关闭",
													"value": "off"
												},
												{
													"name": "每个请求中更新一个参数",
													"value": "updateAParameterInEachRequest"
												},
												{
													"name": "响应包含下一个URL",
													"value": "responseContainsNextURL"
												}
											],
											"default": "updateAParameterInEachRequest",
											"description": "是否应使用分页"
										},
										{
											"displayName": "使用$response变量访问上一个响应的数据。 <a href=\"https://docs.n8n.io/code/builtin/http-node-variables/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.httpRequest\" target=\"_blank\">更多信息</a>",
											"name": "webhookNotice",
											"displayOptions": {
												"hide": {
													"paginationMode": ["off"]
												}
											},
											"type": "notice",
											"default": ""
										},
										{
											"displayName": "下一个URL",
											"name": "nextURL",
											"type": "string",
											"displayOptions": {
												"show": {
													"paginationMode": ["responseContainsNextURL"]
												}
											},
											"default": "",
											"description": "应该计算为下一页的URL。 <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination\" target=\"_blank\">更多信息</a>。"
										},
										{
											"displayName": "参数",
											"name": "parameters",
											"type": "fixedCollection",
											"displayOptions": {
												"show": {
													"paginationMode": ["updateAParameterInEachRequest"]
												}
											},
											"typeOptions": {
												"multipleValues": true,
												"noExpression": true
											},
											"placeholder": "添加参数",
											"default": {
												"parameters": [
													{
														"type": "qs",
														"name": "",
														"value": ""
													}
												]
											},
											"options": [
												{
													"name": "parameters",
													"displayName": "参数",
													"values": [
														{
															"displayName": "类型",
															"name": "type",
															"type": "options",
															"options": [
																{
																	"name": "Body",
																	"value": "body"
																},
																{
																	"name": "Headers",
																	"value": "headers"
																},
																{
																	"name": "查询",
																	"value": "qs"
																}
															],
															"default": "qs",
															"description": "应该设置参数的位置"
														},
														{
															"displayName": "名称",
															"name": "name",
															"type": "string",
															"default": "",
															"placeholder": "例如 page"
														},
														{
															"displayName": "值",
															"name": "value",
															"type": "string",
															"default": "",
															"hint": "使用表达式模式和$response访问响应数据"
														}
													]
												}
											]
										},
										{
											"displayName": "分页完成时",
											"name": "paginationCompleteWhen",
											"type": "options",
											"typeOptions": {
												"noDataExpression": true
											},
											"displayOptions": {
												"hide": {
													"paginationMode": ["off"]
												}
											},
											"options": [
												{
													"name": "响应为空",
													"value": "responseIsEmpty"
												},
												{
													"name": "接收特定状态码",
													"value": "receiveSpecificStatusCodes"
												},
												{
													"name": "其他",
													"value": "other"
												}
											],
											"default": "responseIsEmpty",
											"description": "何时不再进行进一步的请求？"
										},
										{
											"displayName": "完成时的状态码",
											"name": "statusCodesWhenComplete",
											"type": "string",
											"typeOptions": {
												"noDataExpression": true
											},
											"displayOptions": {
												"show": {
													"paginationCompleteWhen": ["receiveSpecificStatusCodes"]
												}
											},
											"default": "",
											"description": "接受逗号分隔的值"
										},
										{
											"displayName": "完成表达式",
											"name": "completeExpression",
											"type": "string",
											"displayOptions": {
												"show": {
													"paginationCompleteWhen": ["other"]
												}
											},
											"default": "",
											"description": "应该在分页完成时评估为true。 <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/#pagination\" target=\"_blank\">更多信息</a>。"
										},
										{
											"displayName": "限制获取的页面",
											"name": "limitPagesFetched",
											"type": "boolean",
											"typeOptions": {
												"noDataExpression": true
											},
											"displayOptions": {
												"hide": {
													"paginationMode": ["off"]
												}
											},
											"default": false,
											"noDataExpression": true,
											"description": "请求的数量是否应受限制"
										},
										{
											"displayName": "最大页面",
											"name": "maxRequests",
											"type": "number",
											"typeOptions": {
												"noDataExpression": true
											},
											"displayOptions": {
												"show": {
													"limitPagesFetched": [true]
												}
											},
											"default": 100,
											"description": "要发出的请求的最大数量"
										},
										{
											"displayName": "请求之间的间隔时间（毫秒）",
											"name": "requestInterval",
											"type": "number",
											"displayOptions": {
												"hide": {
													"paginationMode": ["off"]
												}
											},
											"default": 0,
											"description": "请求之间等待的时间（以毫秒为单位）",
											"hint": "设置为0时不会添加延迟",
											"typeOptions": {
												"minValue": 0
											}
										}
									]
								}
							],
						},

						{
							"displayName": "代理",
							"name": "proxy",
							"type": "string",
							"default": "",
							"placeholder": "例如 http://myproxy:3128",
							"description": "要使用的HTTP代理"
						},
						{
							"displayName": "超时",
							"name": "timeout",
							"type": "number",
							"typeOptions": {
								"minValue": 1
							},
							"default": 10000,
							"description": "在放弃请求之前等待服务器发送响应头（并启动响应主体）的时间（以毫秒为单位）"
						}
					],
				},
				{
					"displayName": "您可以在浏览器的开发者控制台中查看此节点发出的原始请求",
					"name": "infoMessage",
					"type": "notice",
					"default": ""
				}
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const nodeVersion = this.getNode().typeVersion;

		const fullResponseProperties = ['body', 'headers', 'statusCode', 'statusMessage'];

		let authentication;

		try {
			authentication = this.getNodeParameter('authentication', 0) as
				| 'predefinedCredentialType'
				| 'genericCredentialType'
				| 'none';
		} catch { }

		let httpBasicAuth;
		let httpDigestAuth;
		let httpHeaderAuth;
		let httpQueryAuth;
		let httpCustomAuth;
		let oAuth1Api;
		let oAuth2Api;
		let nodeCredentialType: string | undefined;
		let genericCredentialType: string | undefined;

		let requestOptions: IRequestOptions = {
			uri: '',
		};

		let returnItems: INodeExecutionData[] = [];
		const requestPromises = [];

		let fullResponse = false;

		let autoDetectResponseFormat = false;

		// Can not be defined on a per item level
		const pagination = this.getNodeParameter('options.pagination.pagination', 0, null, {
			rawExpressions: true,
		}) as {
			paginationMode: 'off' | 'updateAParameterInEachRequest' | 'responseContainsNextURL';
			nextURL?: string;
			parameters: {
				parameters: Array<{
					type: 'body' | 'headers' | 'qs';
					name: string;
					value: string;
				}>;
			};
			paginationCompleteWhen: 'responseIsEmpty' | 'receiveSpecificStatusCodes' | 'other';
			statusCodesWhenComplete: string;
			completeExpression: string;
			limitPagesFetched: boolean;
			maxRequests: number;
			requestInterval: number;
		};

		const sanitazedRequests: IDataObject[] = [];
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			if (authentication === 'genericCredentialType') {
				genericCredentialType = this.getNodeParameter('genericAuthType', 0) as string;

				if (genericCredentialType === 'httpBasicAuth') {
					httpBasicAuth = await this.getCredentials('httpBasicAuth', itemIndex);
				} else if (genericCredentialType === 'httpDigestAuth') {
					httpDigestAuth = await this.getCredentials('httpDigestAuth', itemIndex);
				} else if (genericCredentialType === 'httpHeaderAuth') {
					httpHeaderAuth = await this.getCredentials('httpHeaderAuth', itemIndex);
				} else if (genericCredentialType === 'httpQueryAuth') {
					httpQueryAuth = await this.getCredentials('httpQueryAuth', itemIndex);
				} else if (genericCredentialType === 'httpCustomAuth') {
					httpCustomAuth = await this.getCredentials('httpCustomAuth', itemIndex);
				} else if (genericCredentialType === 'oAuth1Api') {
					oAuth1Api = await this.getCredentials('oAuth1Api', itemIndex);
				} else if (genericCredentialType === 'oAuth2Api') {
					oAuth2Api = await this.getCredentials('oAuth2Api', itemIndex);
				}
			} else if (authentication === 'predefinedCredentialType') {
				nodeCredentialType = this.getNodeParameter('nodeCredentialType', itemIndex) as string;
			}

			const requestMethod = this.getNodeParameter('method', itemIndex) as IHttpRequestMethods;

			const sendQuery = this.getNodeParameter('sendQuery', itemIndex, false) as boolean;
			const queryParameters = this.getNodeParameter(
				'queryParameters.parameters',
				itemIndex,
				[],
			) as [{ name: string; value: string }];
			const specifyQuery = this.getNodeParameter('specifyQuery', itemIndex, 'keypair') as string;
			const jsonQueryParameter = this.getNodeParameter('jsonQuery', itemIndex, '') as string;

			const sendBody = this.getNodeParameter('sendBody', itemIndex, false) as boolean;
			const bodyContentType = this.getNodeParameter('contentType', itemIndex, '') as string;
			const specifyBody = this.getNodeParameter('specifyBody', itemIndex, '') as string;
			const bodyParameters = this.getNodeParameter(
				'bodyParameters.parameters',
				itemIndex,
				[],
			) as BodyParameter[];
			const jsonBodyParameter = this.getNodeParameter('jsonBody', itemIndex, '') as string;
			const body = this.getNodeParameter('body', itemIndex, '') as string;

			const sendHeaders = this.getNodeParameter('sendHeaders', itemIndex, false) as boolean;

			const headerParameters = this.getNodeParameter(
				'headerParameters.parameters',
				itemIndex,
				[],
			) as [{ name: string; value: string }];

			const specifyHeaders = this.getNodeParameter(
				'specifyHeaders',
				itemIndex,
				'keypair',
			) as string;

			const jsonHeadersParameter = this.getNodeParameter('jsonHeaders', itemIndex, '') as string;

			const {
				redirect,
				batching,
				proxy,
				timeout,
				allowUnauthorizedCerts,
				queryParameterArrays,
				response,
			} = this.getNodeParameter('options', itemIndex, {}) as {
				batching: { batch: { batchSize: number; batchInterval: number } };
				proxy: string;
				timeout: number;
				allowUnauthorizedCerts: boolean;
				queryParameterArrays: 'indices' | 'brackets' | 'repeat';
				response: {
					response: { neverError: boolean; responseFormat: string; fullResponse: boolean };
				};
				redirect: { redirect: { maxRedirects: number; followRedirects: boolean } };
			};

			const url = this.getNodeParameter('url', itemIndex) as string;

			const responseFormat = response?.response?.responseFormat || 'autodetect';

			fullResponse = response?.response?.fullResponse || false;

			autoDetectResponseFormat = responseFormat === 'autodetect';

			// defaults batch size to 1 of it's set to 0
			const batchSize = batching?.batch?.batchSize > 0 ? batching?.batch?.batchSize : 1;
			const batchInterval = batching?.batch.batchInterval;

			if (itemIndex > 0 && batchSize >= 0 && batchInterval > 0) {
				if (itemIndex % batchSize === 0) {
					await sleep(batchInterval);
				}
			}

			requestOptions = {
				headers: {},
				method: requestMethod,
				uri: url,
				gzip: true,
				rejectUnauthorized: !allowUnauthorizedCerts || false,
				followRedirect: false,
				resolveWithFullResponse: true,
			};

			if (requestOptions.method !== 'GET' && nodeVersion >= 4.1) {
				requestOptions = { ...requestOptions, followAllRedirects: false };
			}

			const defaultRedirect = nodeVersion >= 4 && redirect === undefined;

			if (redirect?.redirect?.followRedirects || defaultRedirect) {
				requestOptions.followRedirect = true;
				requestOptions.followAllRedirects = true;
			}

			if (redirect?.redirect?.maxRedirects || defaultRedirect) {
				requestOptions.maxRedirects = redirect?.redirect?.maxRedirects;
			}

			if (response?.response?.neverError) {
				requestOptions.simple = false;
			}

			if (proxy) {
				requestOptions.proxy = proxy;
			}

			if (timeout) {
				requestOptions.timeout = timeout;
			} else {
				// set default timeout to 5 minutes
				requestOptions.timeout = 300_000;
			}
			if (sendQuery && queryParameterArrays) {
				Object.assign(requestOptions, {
					qsStringifyOptions: { arrayFormat: queryParameterArrays },
				});
			}

			const parametersToKeyValue = async (
				accumulator: { [key: string]: any },
				cur: { name: string; value: string; parameterType?: string; inputDataFieldName?: string },
			) => {
				if (cur.parameterType === 'formBinaryData') {
					if (!cur.inputDataFieldName) return accumulator;
					const binaryData = this.helpers.assertBinaryData(itemIndex, cur.inputDataFieldName);
					let uploadData: Buffer | Readable;
					const itemBinaryData = items[itemIndex].binary![cur.inputDataFieldName];
					if (itemBinaryData.id) {
						uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
					} else {
						uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
					}

					accumulator[cur.name] = {
						value: uploadData,
						options: {
							filename: binaryData.fileName,
							contentType: binaryData.mimeType,
						},
					};
					return accumulator;
				}
				accumulator[cur.name] = cur.value;
				return accumulator;
			};

			// Get parameters defined in the UI
			if (sendBody && bodyParameters) {
				if (specifyBody === 'keypair' || bodyContentType === 'multipart-form-data') {
					requestOptions.body = await prepareRequestBody(
						bodyParameters,
						bodyContentType,
						nodeVersion,
						parametersToKeyValue,
					);
				} else if (specifyBody === 'json') {
					// body is specified using JSON
					if (typeof jsonBodyParameter !== 'object' && jsonBodyParameter !== null) {
						try {
							JSON.parse(jsonBodyParameter);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'JSON parameter need to be an valid JSON',
								{
									itemIndex,
								},
							);
						}

						requestOptions.body = jsonParse(jsonBodyParameter);
					} else {
						requestOptions.body = jsonBodyParameter;
					}
				} else if (specifyBody === 'string') {
					//form urlencoded
					requestOptions.body = Object.fromEntries(new URLSearchParams(body));
				}
			}

			// Change the way data get send in case a different content-type than JSON got selected
			if (sendBody && ['PATCH', 'POST', 'PUT', 'GET'].includes(requestMethod)) {
				if (bodyContentType === 'multipart-form-data') {
					requestOptions.formData = requestOptions.body as IDataObject;
					delete requestOptions.body;
				} else if (bodyContentType === 'form-urlencoded') {
					requestOptions.form = requestOptions.body as IDataObject;
					delete requestOptions.body;
				} else if (bodyContentType === 'binaryData') {
					const inputDataFieldName = this.getNodeParameter(
						'inputDataFieldName',
						itemIndex,
					) as string;

					let uploadData: Buffer | Readable;
					let contentLength: number;

					const itemBinaryData = this.helpers.assertBinaryData(itemIndex, inputDataFieldName);

					if (itemBinaryData.id) {
						uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
						const metadata = await this.helpers.getBinaryMetadata(itemBinaryData.id);
						contentLength = metadata.fileSize;
					} else {
						uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
						contentLength = uploadData.length;
					}
					requestOptions.body = uploadData;
					requestOptions.headers = {
						...requestOptions.headers,
						'content-length': contentLength,
						'content-type': itemBinaryData.mimeType ?? 'application/octet-stream',
					};
				} else if (bodyContentType === 'raw') {
					requestOptions.body = body;
				}
			}

			// Get parameters defined in the UI
			if (sendQuery && queryParameters) {
				if (specifyQuery === 'keypair') {
					requestOptions.qs = await reduceAsync(queryParameters, parametersToKeyValue);
				} else if (specifyQuery === 'json') {
					// query is specified using JSON
					try {
						JSON.parse(jsonQueryParameter);
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							'JSON parameter need to be an valid JSON',
							{
								itemIndex,
							},
						);
					}

					requestOptions.qs = jsonParse(jsonQueryParameter);
				}
			}

			// Get parameters defined in the UI
			if (sendHeaders && headerParameters) {
				let additionalHeaders: IDataObject = {};
				if (specifyHeaders === 'keypair') {
					additionalHeaders = await reduceAsync(headerParameters, parametersToKeyValue);
				} else if (specifyHeaders === 'json') {
					// body is specified using JSON
					try {
						JSON.parse(jsonHeadersParameter);
					} catch {
						throw new NodeOperationError(
							this.getNode(),
							'JSON parameter need to be an valid JSON',
							{
								itemIndex,
							},
						);
					}

					additionalHeaders = jsonParse(jsonHeadersParameter);
				}
				requestOptions.headers = {
					...requestOptions.headers,
					...keysToLowercase(additionalHeaders),
				};
			}

			if (autoDetectResponseFormat || responseFormat === 'file') {
				requestOptions.encoding = null;
				requestOptions.json = false;
				requestOptions.useStream = true;
			} else if (bodyContentType === 'raw') {
				requestOptions.json = false;
				requestOptions.useStream = true;
			} else {
				requestOptions.json = true;
			}

			// Add Content Type if any are set
			if (bodyContentType === 'raw') {
				if (requestOptions.headers === undefined) {
					requestOptions.headers = {};
				}
				const rawContentType = this.getNodeParameter('rawContentType', itemIndex) as string;
				requestOptions.headers['content-type'] = rawContentType;
			}

			const authDataKeys: IAuthDataSanitizeKeys = {};

			// Add credentials if any are set
			if (httpBasicAuth !== undefined) {
				requestOptions.auth = {
					user: httpBasicAuth.user as string,
					pass: httpBasicAuth.password as string,
				};
				authDataKeys.auth = ['pass'];
			}
			if (httpHeaderAuth !== undefined) {
				requestOptions.headers![httpHeaderAuth.name as string] = httpHeaderAuth.value;
				authDataKeys.headers = [httpHeaderAuth.name as string];
			}
			if (httpQueryAuth !== undefined) {
				if (!requestOptions.qs) {
					requestOptions.qs = {};
				}
				requestOptions.qs[httpQueryAuth.name as string] = httpQueryAuth.value;
				authDataKeys.qs = [httpQueryAuth.name as string];
			}
			if (httpDigestAuth !== undefined) {
				requestOptions.auth = {
					user: httpDigestAuth.user as string,
					pass: httpDigestAuth.password as string,
					sendImmediately: false,
				};
				authDataKeys.auth = ['pass'];
			}
			if (httpCustomAuth !== undefined) {
				const customAuth = jsonParse<IRequestOptionsSimplified>(
					(httpCustomAuth.json as string) || '{}',
					{ errorMessage: 'Invalid Custom Auth JSON' },
				);
				if (customAuth.headers) {
					requestOptions.headers = { ...requestOptions.headers, ...customAuth.headers };
					authDataKeys.headers = Object.keys(customAuth.headers);
				}
				if (customAuth.body) {
					requestOptions.body = { ...(requestOptions.body as IDataObject), ...customAuth.body };
					authDataKeys.body = Object.keys(customAuth.body);
				}
				if (customAuth.qs) {
					requestOptions.qs = { ...requestOptions.qs, ...customAuth.qs };
					authDataKeys.qs = Object.keys(customAuth.qs);
				}
			}

			if (requestOptions.headers!.accept === undefined) {
				if (responseFormat === 'json') {
					requestOptions.headers!.accept = 'application/json,text/*;q=0.99';
				} else if (responseFormat === 'text') {
					requestOptions.headers!.accept =
						'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, */*;q=0.1';
				} else {
					requestOptions.headers!.accept =
						'application/json,text/html,application/xhtml+xml,application/xml,text/*;q=0.9, image/*;q=0.8, */*;q=0.7';
				}
			}

			try {
				const sanitazedRequestOptions = sanitizeUiMessage(requestOptions, authDataKeys);
				this.sendMessageToUI(sanitazedRequestOptions);
				sanitazedRequests.push(sanitazedRequestOptions);
			} catch (e) { }

			if (pagination && pagination.paginationMode !== 'off') {
				let continueExpression = '={{false}}';
				if (pagination.paginationCompleteWhen === 'receiveSpecificStatusCodes') {
					// Split out comma separated list of status codes into array
					const statusCodesWhenCompleted = pagination.statusCodesWhenComplete
						.split(',')
						.map((item) => parseInt(item.trim()));

					continueExpression = `={{ !${JSON.stringify(
						statusCodesWhenCompleted,
					)}.includes($response.statusCode) }}`;
				} else if (pagination.paginationCompleteWhen === 'responseIsEmpty') {
					continueExpression =
						'={{ Array.isArray($response.body) ? $response.body.length : !!$response.body }}';
				} else {
					// Other
					if (!pagination.completeExpression.length || pagination.completeExpression[0] !== '=') {
						throw new NodeOperationError(this.getNode(), 'Invalid or empty Complete Expression');
					}
					continueExpression = `={{ !(${pagination.completeExpression.trim().slice(3, -2)}) }}`;
				}

				const paginationData: PaginationOptions = {
					continue: continueExpression,
					request: {},
					requestInterval: pagination.requestInterval,
				};

				if (pagination.paginationMode === 'updateAParameterInEachRequest') {
					// Iterate over all parameters and add them to the request
					paginationData.request = {};
					const { parameters } = pagination.parameters;
					if (parameters.length === 1 && parameters[0].name === '' && parameters[0].value === '') {
						throw new NodeOperationError(
							this.getNode(),
							"At least one entry with 'Name' and 'Value' filled must be included in 'Parameters' to use 'Update a Parameter in Each Request' mode ",
						);
					}
					pagination.parameters.parameters.forEach((parameter, index) => {
						if (!paginationData.request[parameter.type]) {
							paginationData.request[parameter.type] = {};
						}
						const parameterName = parameter.name;
						if (parameterName === '') {
							throw new NodeOperationError(
								this.getNode(),
								`Parameter name must be set for parameter [${index + 1}] in pagination settings`,
							);
						}
						const parameterValue = parameter.value;
						if (parameterValue === '') {
							throw new NodeOperationError(
								this.getNode(),
								`Some value must be provided for parameter [${index + 1
								}] in pagination settings, omitting it will result in an infinite loop`,
							);
						}
						paginationData.request[parameter.type]![parameterName] = parameterValue;
					});
				} else if (pagination.paginationMode === 'responseContainsNextURL') {
					paginationData.request.url = pagination.nextURL;
				}

				if (pagination.limitPagesFetched) {
					paginationData.maxRequests = pagination.maxRequests;
				}

				if (responseFormat === 'file') {
					paginationData.binaryResult = true;
				}

				const requestPromise = this.helpers.requestWithAuthenticationPaginated
					.call(
						this,
						requestOptions,
						itemIndex,
						paginationData,
						nodeCredentialType ?? genericCredentialType,
					)
					.catch((error) => {
						if (error instanceof NodeOperationError && error.type === 'invalid_url') {
							const urlParameterName =
								pagination.paginationMode === 'responseContainsNextURL' ? 'Next URL' : 'URL';
							throw new NodeOperationError(this.getNode(), error.message, {
								description: `Make sure the "${urlParameterName}" parameter evaluates to a valid URL.`,
							});
						}

						throw error;
					});
				requestPromises.push(requestPromise);
			} else if (authentication === 'genericCredentialType' || authentication === 'none') {
				if (oAuth1Api) {
					const requestOAuth1 = this.helpers.requestOAuth1.call(this, 'oAuth1Api', requestOptions);
					requestOAuth1.catch(() => { });
					requestPromises.push(requestOAuth1);
				} else if (oAuth2Api) {
					const requestOAuth2 = this.helpers.requestOAuth2.call(this, 'oAuth2Api', requestOptions, {
						tokenType: 'Bearer',
					});
					requestOAuth2.catch(() => { });
					requestPromises.push(requestOAuth2);
				} else {
					// bearerAuth, queryAuth, headerAuth, digestAuth, none
					const request = this.helpers.request(requestOptions);
					request.catch(() => { });
					requestPromises.push(request);
				}
			} else if (authentication === 'predefinedCredentialType' && nodeCredentialType) {
				const additionalOAuth2Options = getOAuth2AdditionalParameters(nodeCredentialType);

				// service-specific cred: OAuth1, OAuth2, plain

				const requestWithAuthentication = this.helpers.requestWithAuthentication.call(
					this,
					nodeCredentialType,
					requestOptions,
					additionalOAuth2Options && { oauth2: additionalOAuth2Options },
					itemIndex,
				);
				requestWithAuthentication.catch(() => { });
				requestPromises.push(requestWithAuthentication);
			}
		}
		const promisesResponses = await Promise.allSettled(requestPromises);

		let responseData: any;
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			responseData = promisesResponses.shift();
			if (responseData!.status !== 'fulfilled') {
				if (responseData.reason.statusCode === 429) {
					responseData.reason.message =
						"Try spacing your requests out using the batching settings under 'Options'";
				}
				if (!this.continueOnFail()) {
					if (autoDetectResponseFormat && responseData.reason.error instanceof Buffer) {
						responseData.reason.error = Buffer.from(responseData.reason.error as Buffer).toString();
					}
					const error = new NodeApiError(this.getNode(), responseData as JsonObject, { itemIndex });
					set(error, 'context.request', sanitazedRequests[itemIndex]);
					throw error;
				} else {
					removeCircularRefs(responseData.reason as JsonObject);
					// Return the actual reason as error
					returnItems.push({
						json: {
							error: responseData.reason,
						},
						pairedItem: {
							item: itemIndex,
						},
					});
					continue;
				}
			}

			let responses: any[];
			if (Array.isArray(responseData.value)) {
				responses = responseData.value;
			} else {
				responses = [responseData.value];
			}

			let responseFormat = this.getNodeParameter(
				'options.response.response.responseFormat',
				0,
				'autodetect',
			) as string;

			fullResponse = this.getNodeParameter(
				'options.response.response.fullResponse',
				0,
				false,
			) as boolean;

			// eslint-disable-next-line prefer-const
			for (let [index, response] of Object.entries(responses)) {
				if (response?.request?.constructor.name === 'ClientRequest') delete response.request;

				if (this.getMode() === 'manual' && index === '0') {
					// For manual executions save the first response in the context
					// so that we can use it in the frontend and so make it easier for
					// the users to create the required pagination expressions
					const nodeContext = this.getContext('node');
					if (pagination && pagination.paginationMode !== 'off') {
						nodeContext.response = responseData.value[0];
					} else {
						nodeContext.response = responseData.value;
					}
				}

				const responseContentType = response.headers['content-type'] ?? '';
				if (autoDetectResponseFormat) {
					if (responseContentType.includes('application/json')) {
						responseFormat = 'json';
						if (!response.__bodyResolved) {
							const neverError = this.getNodeParameter(
								'options.response.response.neverError',
								0,
								false,
							) as boolean;

							const data = await this.helpers
								.binaryToBuffer(response.body as Buffer | Readable)
								.then((body) => body.toString());
							response.body = jsonParse(data, {
								...(neverError
									? { fallbackValue: {} }
									: { errorMessage: 'Invalid JSON in response body' }),
							});
						}
					} else if (binaryContentTypes.some((e) => responseContentType.includes(e))) {
						responseFormat = 'file';
					} else {
						responseFormat = 'text';
						if (!response.__bodyResolved) {
							const data = await this.helpers
								.binaryToBuffer(response.body as Buffer | Readable)
								.then((body) => body.toString());
							response.body = !data ? undefined : data;
						}
					}
				}

				if (autoDetectResponseFormat && !fullResponse) {
					delete response.headers;
					delete response.statusCode;
					delete response.statusMessage;
				}
				if (!fullResponse) {
					response = response.body;
				}

				if (responseFormat === 'file') {
					const outputPropertyName = this.getNodeParameter(
						'options.response.response.outputPropertyName',
						0,
						'data',
					) as string;

					const newItem: INodeExecutionData = {
						json: {},
						binary: {},
						pairedItem: {
							item: itemIndex,
						},
					};

					if (items[itemIndex].binary !== undefined) {
						// Create a shallow copy of the binary data so that the old
						// data references which do not get changed still stay behind
						// but the incoming data does not get changed.
						Object.assign(newItem.binary as IBinaryKeyData, items[itemIndex].binary);
					}

					let binaryData: Buffer | Readable;
					if (fullResponse) {
						const returnItem: IDataObject = {};
						for (const property of fullResponseProperties) {
							if (property === 'body') {
								continue;
							}
							returnItem[property] = response[property];
						}

						newItem.json = returnItem;
						binaryData = response?.body;
					} else {
						newItem.json = items[itemIndex].json;
						binaryData = response;
					}
					const preparedBinaryData = await this.helpers.prepareBinaryData(
						binaryData,
						undefined,
						responseContentType || undefined,
					);

					if (
						!preparedBinaryData.fileName &&
						preparedBinaryData.fileExtension &&
						typeof requestOptions.uri === 'string' &&
						requestOptions.uri.endsWith(preparedBinaryData.fileExtension)
					) {
						preparedBinaryData.fileName = requestOptions.uri.split('/').pop();
					}

					newItem.binary![outputPropertyName] = preparedBinaryData;

					returnItems.push(newItem);
				} else if (responseFormat === 'text') {
					const outputPropertyName = this.getNodeParameter(
						'options.response.response.outputPropertyName',
						0,
						'data',
					) as string;
					if (fullResponse) {
						const returnItem: IDataObject = {};
						for (const property of fullResponseProperties) {
							if (property === 'body') {
								returnItem[outputPropertyName] = toText(response[property]);
								continue;
							}

							returnItem[property] = response[property];
						}
						returnItems.push({
							json: returnItem,
							pairedItem: {
								item: itemIndex,
							},
						});
					} else {
						returnItems.push({
							json: {
								[outputPropertyName]: toText(response),
							},
							pairedItem: {
								item: itemIndex,
							},
						});
					}
				} else {
					// responseFormat: 'json'
					if (fullResponse) {
						const returnItem: IDataObject = {};
						for (const property of fullResponseProperties) {
							returnItem[property] = response[property];
						}

						if (responseFormat === 'json' && typeof returnItem.body === 'string') {
							try {
								returnItem.body = JSON.parse(returnItem.body);
							} catch (error) {
								throw new NodeOperationError(
									this.getNode(),
									'Response body is not valid JSON. Change "Response Format" to "Text"',
									{ itemIndex },
								);
							}
						}

						returnItems.push({
							json: returnItem,
							pairedItem: {
								item: itemIndex,
							},
						});
					} else {
						if (responseFormat === 'json' && typeof response === 'string') {
							try {
								if (typeof response !== 'object') {
									response = JSON.parse(response);
								}
							} catch (error) {
								throw new NodeOperationError(
									this.getNode(),
									'Response body is not valid JSON. Change "Response Format" to "Text"',
									{ itemIndex },
								);
							}
						}

						if (Array.isArray(response)) {
							// eslint-disable-next-line @typescript-eslint/no-loop-func
							response.forEach((item) =>
								returnItems.push({
									json: item,
									pairedItem: {
										item: itemIndex,
									},
								}),
							);
						} else {
							returnItems.push({
								json: response,
								pairedItem: {
									item: itemIndex,
								},
							});
						}
					}
				}
			}
		}

		returnItems = returnItems.map(replaceNullValues);

		return [returnItems];
	}
}
