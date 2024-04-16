import type { INodeProperties } from 'n8n-workflow';
import { parseAndSetBodyJson } from './GenericFunctions';

export const credentialOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"default": "create",
		"displayOptions": {
			"show": {
				"resource": [
					"credential"
				]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"action": "创建凭据",
				"routing": {
					"request": {
						"method": "POST",
						"url": "/credentials"
					}
				}
			},
			{
				"name": "删除",
				"value": "delete",
				"action": "删除凭据",
				"routing": {
					"request": {
						"method": "DELETE",
						"url": "=/credentials/{{ $parameter.credentialId }}"
					}
				}
			},
			{
				"name": "获取架构",
				"value": "getSchema",
				"action": "获取凭据类型的凭据数据架构",
				"routing": {
					"request": {
						"method": "GET",
						"url": "=/credentials/schema/{{ $parameter.credentialTypeName }}"
					}
				}
			}
		]
	}
];

const createOperation: INodeProperties[] = [
	{
		"displayName": "名称",
		"name": "name",
		"type": "string",
		"default": "",
		"placeholder": "例如 n8n 账户",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": [
					"credential"
				],
				"operation": [
					"create"
				]
			}
		},
		"routing": {
			"request": {
				"body": {
					"name": "={{ $value }}"
				}
			}
		},
		"description": "新凭据的名称"
	},
	{
		"displayName": "凭据类型",
		"name": "credentialTypeName",
		"type": "string",
		"placeholder": "例如 n8nApi",
		"default": "",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": [
					"credential"
				],
				"operation": [
					"create"
				]
			}
		},
		"routing": {
			"request": {
				"body": {
					"type": "={{ $value }}"
				}
			}
		},
		"description": "可用类型取决于安装在 n8n 实例上的节点。一些内置类型包括例如 'githubApi'、'notionApi' 和 'slackApi'。"
	},
	{
		"displayName": "数据",
		"name": "data",
		"type": "json",
		"default": "",
		"placeholder": "// 例如 n8nApi\n{\n  \"apiKey\": \"my-n8n-api-key\",\n  \"baseUrl\": \"https://<name>.app.n8n.cloud/api/v1\"\n}",
		"required": true,
		"typeOptions": {
			"alwaysOpenEditWindow": true
		},
		"displayOptions": {
			"show": {
				"resource": [
					"credential"
				],
				"operation": [
					"create"
				]
			}
		},
		"routing": {
			"send": {
				"preSend": [
					parseAndSetBodyJson('data', 'data')]
			}
		},
		"description": "一个有效的 JSON 对象，包含此凭据类型所需的属性。要查看预期格式，您可以使用 '获取架构' 操作。"
	}

];

const deleteOperation: INodeProperties[] = [
	{
		displayName: '认证 ID',
		name: 'credentialId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['credential'],
				operation: ['delete'],
			},
		},
	},
];

const getSchemaOperation: INodeProperties[] = [
	{
		"displayName": "凭据类型",
		"name": "credentialTypeName",
		"default": "",
		"placeholder": "例如 n8nApi",
		"required": true,
		"type": "string",
		"displayOptions": {
			"show": {
				"resource": [
					"credential"
				],
				"operation": [
					"getSchema"
				]
			}
		},
		"description": "可用类型取决于安装在 n8n 实例上的节点。一些内置类型包括例如 'githubApi'、'notionApi' 和 'slackApi'。"
	}

];

export const credentialFields: INodeProperties[] = [
	...createOperation,
	...deleteOperation,
	...getSchemaOperation,
];
