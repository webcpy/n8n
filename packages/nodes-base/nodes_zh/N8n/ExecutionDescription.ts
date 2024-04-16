import type { INodeProperties } from 'n8n-workflow';
import { getCursorPaginator } from './GenericFunctions';
import { workflowIdLocator } from './WorkflowLocator';

export const executionOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"default": "getAll",
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				]
			}
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"action": "获取一个执行",
				"routing": {
					"request": {
						"method": "GET",
						"url": "=/executions/{{ $parameter.executionId }}"
					}
				}
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"action": "获取多个执行",
				"routing": {
					"request": {
						"method": "GET",
						"url": "/executions"
					},
					"send": {
						"paginate": true
					},
					"operations": {
						"pagination": getCursorPaginator()
					}
				}
			},
			{
				"name": "删除",
				"value": "delete",
				"action": "删除一个执行",
				"routing": {
					"request": {
						"method": "DELETE",
						"url": "=/executions/{{ $parameter.executionId }}"
					}
				}
			}
		]
	}
];

const deleteOperation: INodeProperties[] = [
	{
		displayName: '执行 ID',
		name: 'executionId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['delete'],
			},
		},
		default: '',
	},
];

const getAllOperation: INodeProperties[] = [
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"default": false,
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				],
				"operation": [
					"getAll"
				]
			}
		},
		"description": "是否返回所有结果，还是仅返回至给定限制",
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"default": 100,
		"typeOptions": {
			"minValue": 1,
			"maxValue": 250
		},
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				],
				"operation": [
					"getAll"
				],
				"returnAll": [
					false
				]
			}
		},
		"routing": {
			"request": {
				"qs": {
					"limit": "={{ $value }}"
				}
			}
		},
		"description": "返回的最大结果数"
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['execution'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				// Use the common workflowIdLocator, but provide a custom routing
				...workflowIdLocator,
				routing: {
					send: {
						type: 'query',
						property: 'workflowId',
						value: '={{ $value || undefined }}',
					},
				},
				description: '工作流程，按以下方式过滤执行',
			},
			{
				"displayName": "状态",
				"name": "status",
				"type": "options",
				"options": [
					{
						"name": "错误",
						"value": "error"
					},
					{
						"name": "成功",
						"value": "success"
					},
					{
						"name": "等待",
						"value": "waiting"
					}
				],
				"default": "success",
				"routing": {
					"send": {
						"type": "query",
						"property": "status",
						"value": "={{ $value }}"
					}
				},
				"description": "用于筛选执行的状态"
			}
		],
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"default": {},
		"placeholder": "添加选项",
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				],
				"operation": [
					"getAll"
				]
			}
		},
		"options": [
			{
				"displayName": "包括执行详细信息",
				"name": "activeWorkflows",
				"type": "boolean",
				"default": false,
				"routing": {
					"send": {
						"type": "query",
						"property": "includeData",
						"value": "={{ $value }}"
					}
				},
				"description": "是否包括详细的执行数据"
			}
		]
	}
];

const getOperation: INodeProperties[] = [
	{
		"displayName": "执行 ID",
		"name": "executionId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				],
				"operation": [
					"get"
				]
			}
		}
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"default": {},
		"placeholder": "添加选项",
		"displayOptions": {
			"show": {
				"resource": [
					"execution"
				],
				"operation": [
					"get"
				]
			}
		},
		"options": [
			{
				"displayName": "包括执行详细信息",
				"name": "activeWorkflows",
				"type": "boolean",
				"default": false,
				"routing": {
					"send": {
						"type": "query",
						"property": "includeData",
						"value": "={{ $value }}"
					}
				},
				"description": "是否包括详细的执行数据"
			}
		]
	}
];

export const executionFields: INodeProperties[] = [
	...deleteOperation,
	...getAllOperation,
	...getOperation,
];
