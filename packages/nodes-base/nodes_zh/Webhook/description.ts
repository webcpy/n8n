import type { INodeProperties, INodeTypeDescription, IWebhookDescription } from 'n8n-workflow';
import { getResponseCode, getResponseData } from './utils';

export const defaultWebhookDescription: IWebhookDescription = {
	name: 'default',
	httpMethod: '={{$parameter["httpMethod"] || "GET"}}',
	isFullPath: true,
	responseCode: `={{(${getResponseCode})($parameter)}}`,
	responseMode: '={{$parameter["responseMode"]}}',
	responseData: `={{(${getResponseData})($parameter)}}`,
	responseBinaryPropertyName: '={{$parameter["responseBinaryPropertyName"]}}',
	responseContentType: '={{$parameter["options"]["responseContentType"]}}',
	responsePropertyName: '={{$parameter["options"]["responsePropertyName"]}}',
	responseHeaders: '={{$parameter["options"]["responseHeaders"]}}',
	path: '={{$parameter["path"]}}',
};

export const credentialsProperty = (
	propertyName = 'authentication',
): INodeTypeDescription['credentials'] => [
		{
			name: 'httpBasicAuth',
			required: true,
			displayOptions: {
				show: {
					[propertyName]: ['basicAuth'],
				},
			},
		},
		{
			name: 'httpHeaderAuth',
			required: true,
			displayOptions: {
				show: {
					[propertyName]: ['headerAuth'],
				},
			},
		},
		{
			name: 'jwtAuth',
			required: true,
			displayOptions: {
				show: {
					[propertyName]: ['jwtAuth'],
				},
			},
		},
	];

export const authenticationProperty = (propertyName = 'authentication'): INodeProperties => ({
	displayName: '身份验证',
	name: propertyName,
	type: 'options',
	options: [
		{
			name: 'Basic Auth',
			value: 'basicAuth',
		},
		{
			name: 'Header Auth',
			value: 'headerAuth',
		},
		{
			name: 'JWT Auth',
			value: 'jwtAuth',
		},
		{
			name: 'None',
			value: 'none',
		},
	],
	default: 'none',
	description: '认证方式',
});

export const httpMethodsProperty: INodeProperties = {
	displayName: 'HTTP 方法',
	name: 'httpMethod',
	type: 'options',
	options: [
		{
			name: 'DELETE',
			value: 'DELETE',
		},
		{
			name: 'GET',
			value: 'GET',
		},
		{
			name: 'HEAD',
			value: 'HEAD',
		},
		{
			name: 'PATCH',
			value: 'PATCH',
		},
		{
			name: 'POST',
			value: 'POST',
		},
		{
			name: 'PUT',
			value: 'PUT',
		},
	],
	default: 'GET',
	description: '监听的 HTTP 方法',
};

export const responseCodeProperty: INodeProperties = {
	"displayName": "响应代码",
	"name": "responseCode",
	"type": "number",
	"displayOptions": {
		"hide": {
			"responseMode": ["responseNode"]
		}
	},
	"typeOptions": {
		"minValue": 100,
		"maxValue": 599
	},
	"default": 200,
	"description": "要返回的HTTP响应代码"
}

export const responseModeProperty: INodeProperties = {
	"displayName": "响应",
	"name": "responseMode",
	"type": "options",
	"options": [
		{
			"name": "立即",
			"value": "onReceived",
			"description": "一旦此节点执行完毕"
		},
		{
			"name": "当最后一个节点完成时",
			"value": "lastNode",
			"description": "返回最后一个执行的节点的数据"
		},
		{
			"name": "使用'响应Webhook'节点",
			"value": "responseNode",
			"description": "在该节点中定义响应"
		}
	],
	"default": "onReceived",
	"description": "何时以及如何响应Webhook"
}

export const responseDataProperty: INodeProperties = {
	"displayName": "响应数据",
	"name": "responseData",
	"type": "options",
	"displayOptions": {
		"show": {
			"responseMode": ["lastNode"]
		}
	},
	"options": [
		{
			"name": "全部条目",
			"value": "allEntries",
			"description": "返回最后一个节点的所有条目。始终返回一个数组。"
		},
		{
			"name": "第一个条目JSON",
			"value": "firstEntryJson",
			"description": "返回最后一个节点的第一个条目的JSON数据。始终返回一个JSON对象。"
		},
		{
			"name": "第一个条目二进制",
			"value": "firstEntryBinary",
			"description": "返回最后一个节点的第一个条目的二进制数据。始终返回一个二进制文件。"
		},
		{
			"name": "无响应主体",
			"value": "noData",
			"description": "返回无主体"
		}
	],
	"default": "firstEntryJson",
	"description": "应返回哪些数据。如果应返回所有项目作为数组或仅返回第一个项目作为对象。"
}
export const responseBinaryPropertyNameProperty: INodeProperties = {
	"displayName": "属性名称",
	"name": "responseBinaryPropertyName",
	"type": "string",
	"required": true,
	"default": "data",
	"displayOptions": {
		"show": {
			"responseData": ["firstEntryBinary"]
		}
	},
	"description": "要返回的二进制属性的名称"
}


export const optionsProperty: INodeProperties = {
	"displayName": "选项",
	"name": "options",
	"type": "collection",
	"placeholder": "添加选项",
	"default": {},
	"options": [
		{
			"displayName": "二进制文件",
			"name": "binaryData",
			"type": "boolean",
			"displayOptions": {
				"show": {
					"/httpMethod": ["PATCH", "PUT", "POST"],
					"@version": [1]
				}
			},
			"default": false,
			"description": "Webhook 是否接收二进制数据"
		},
		{
			"displayName": "将输出文件放入字段",
			"name": "binaryPropertyName",
			"type": "string",
			"default": "data",
			"displayOptions": {
				"show": {
					"binaryData": [true],
					"@version": [1]
				}
			},
			"hint": "要将文件放入的输出二进制字段的名称",
			"description": "如果数据通过“Form-Data Multipart”接收，则该字段将是前缀，并且将附加一个以0开头的数字"
		},
		{
			"displayName": "二进制属性",
			"name": "binaryPropertyName",
			"type": "string",
			"default": "data",
			"displayOptions": {
				"hide": {
					"@version": [1]
				}
			},
			"description": "要将接收到的文件数据写入的二进制属性的名称，仅在接收到二进制数据时相关"
		},
		{
			"displayName": "忽略机器人",
			"name": "ignoreBots",
			"type": "boolean",
			"default": false,
			"description": "是否忽略来自机器人（例如链接预览器和网络爬虫）的请求"
		},
		{
			"displayName": "IP地址白名单",
			"name": "ipWhitelist",
			"type": "string",
			"placeholder": "例如 127.0.0.1",
			"default": "",
			"description": "允许的IP地址的逗号分隔列表。留空以允许所有IP。"
		},
		{
			"displayName": "无响应主体",
			"name": "noResponseBody",
			"type": "boolean",
			"default": false,
			"description": "是否在响应中发送任何主体",
			"displayOptions": {
				"hide": {
					"rawBody": [true]
				},
				"show": {
					"/responseMode": ["onReceived"]
				}
			}
		},
		{
			"displayName": "原始主体",
			"name": "rawBody",
			"type": "boolean",
			"displayOptions": {
				"show": {
					"@version": [1]
				},
				"hide": {
					"binaryData": [true],
					"noResponseBody": [true]
				}
			},
			"default": false,
			"description": "原始主体（二进制）"
		},
		{
			"displayName": "原始主体",
			"name": "rawBody",
			"type": "boolean",
			"displayOptions": {
				"hide": {
					"noResponseBody": [true],
					"@version": [1]
				}
			},
			"default": false,
			"description": "是否返回原始主体"
		},
		{
			"displayName": "响应数据",
			"name": "responseData",
			"type": "string",
			"displayOptions": {
				"show": {
					"/responseMode": ["onReceived"]
				},
				"hide": {
					"noResponseBody": [true]
				}
			},
			"default": "",
			"placeholder": "成功",
			"description": "要发送的自定义响应数据"
		},
		{
			"displayName": "响应内容类型",
			"name": "responseContentType",
			"type": "string",
			"displayOptions": {
				"show": {
					"/responseData": ["firstEntryJson"],
					"/responseMode": ["lastNode"]
				}
			},
			"default": "",
			"placeholder": "application/xml",
			"description": "如果要返回的是其他内容类型而不是“application/json”，则设置自定义内容类型"
		},
		{
			"displayName": "响应标头",
			"name": "responseHeaders",
			"placeholder": "添加响应标头",
			"description": "向Webhook响应添加标头",
			"type": "fixedCollection",
			"typeOptions": {
				"multipleValues": true
			},
			"default": {},
			"options": [
				{
					"name": "entries",
					"displayName": "条目",
					"values": [
						{
							"displayName": "名称",
							"name": "name",
							"type": "string",
							"default": "",
							"description": "标头的名称"
						},
						{
							"displayName": "值",
							"name": "value",
							"type": "string",
							"default": "",
							"description": "标头的值"
						}
					]
				}
			]
		},
		{
			"displayName": "属性名称",
			"name": "responsePropertyName",
			"type": "string",
			"displayOptions": {
				"show": {
					"/responseData": ["firstEntryJson"],
					"/responseMode": ["lastNode"]
				}
			},
			"default": "data",
			"description": "要返回数据的属性的名称，而不是整个JSON"
		}
	]
}

export const responseCodeSelector: INodeProperties = {
	"displayName": "响应状态",
	"name": "responseCode",
	"type": "options",
	"options": [
		{
			"name": "200",
			"value": 200,
			"description": "OK - 请求成功"
		},
		{
			"name": "201",
			"value": 201,
			"description": "已创建 - 请求已被成功创建"
		},
		{
			"name": "204",
			"value": 204,
			"description": "无内容 - 请求已处理，但没有返回内容"
		},
		{
			"name": "301",
			"value": 301,
			"description": "永久移动 - 请求的资源已永久移动"
		},
		{
			"name": "302",
			"value": 302,
			"description": "已找到 - 请求的资源已暂时移动"
		},
		{
			"name": "304",
			"value": 304,
			"description": "未修改 - 资源未被修改"
		},
		{
			"name": "400",
			"value": 400,
			"description": "错误请求 - 请求无法被理解"
		},
		{
			"name": "401",
			"value": 401,
			"description": "未授权 - 请求要求用户身份验证"
		},
		{
			"name": "403",
			"value": 403,
			"description": "禁止 - 服务器理解请求，但拒绝执行"
		},
		{
			"name": "404",
			"value": 404,
			"description": "未找到 - 服务器未找到匹配项"
		},
		{
			"name": "自定义 Status",
			"value": "customCode",
			"description": "输入任意 HTTP Status"
		}
	],
	"default": 200,
	"description": "要返回的 HTTP 响应 Status"
}

export const responseCodeOption: INodeProperties = {
	displayName: '响应状态',
	name: 'responseCode',
	placeholder: 'Add Response Code',
	type: 'fixedCollection',
	default: {
		values: {
			responseCode: 200,
		},
	},
	options: [
		{
			name: 'values',
			displayName: 'Values',
			values: [
				responseCodeSelector,
				{
					displayName: 'Code',
					name: 'customCode',
					type: 'number',
					default: 200,
					placeholder: 'e.g. 400',
					typeOptions: {
						minValue: 100,
					},
					displayOptions: {
						show: {
							responseCode: ['customCode'],
						},
					},
				},
			],
		},
	],
	displayOptions: {
		show: {
			'@version': [{ _cnd: { gte: 2 } }],
		},
		hide: {
			'/responseMode': ['responseNode'],
		},
	},
};
