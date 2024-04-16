import type { INodeProperties } from 'n8n-workflow';
import {
	getCursorPaginator,
	parseAndSetBodyJson,
	prepareWorkflowCreateBody,
	prepareWorkflowUpdateBody,
} from './GenericFunctions';
import { workflowIdLocator } from './WorkflowLocator';

export const workflowOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"default": "getAll",
		"displayOptions": {
			"show": {
				"resource": [
					"workflow"
				]
			}
		},
		"options": [
			{
				"name": "激活",
				"value": "activate",
				"action": "激活一个工作流"
			},
			{
				"name": "创建",
				"value": "create",
				"action": "创建一个工作流",
				"routing": {
					"request": {
						"method": "POST",
						"url": "/workflows"
					}
				}
			},
			{
				"name": "停用",
				"value": "deactivate",
				"action": "停用一个工作流"
			},
			{
				"name": "删除",
				"value": "delete",
				"action": "删除一个工作流"
			},
			{
				"name": "获取",
				"value": "get",
				"action": "获取一个工作流"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"action": "获取多个工作流",
				"routing": {
					"request": {
						"method": "GET",
						"url": "/workflows"
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
				"name": "更新",
				"value": "update",
				"action": "更新一个工作流"
			}
		]
	}

];

const activateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['activate'],
			},
		},
		// The routing for resourceLocator-enabled properties currently needs to
		// happen in the property block where the property itself is defined, or
		// extractValue won't work when used with $parameter in routing.request.url.
		routing: {
			request: {
				method: 'POST',
				url: '=/workflows/{{ $value }}/activate',
			},
		},
	},
];

const createOperation: INodeProperties[] = [
	{
		displayName: 'Workflow Object',
		name: 'workflowObject',
		type: 'json',
		default: '{ "name": "My workflow", "nodes": [], "connections": {}, "settings": {} }',
		placeholder:
			'{\n  "name": "My workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {}\n}',
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['create'],
			},
		},
		routing: {
			send: {
				preSend: [parseAndSetBodyJson('workflowObject'), prepareWorkflowCreateBody],
			},
		},
		description:
			"A valid JSON object with required fields: 'name', 'nodes', 'connections' and 'settings'. More information can be found in the <a href=\"https://docs.n8n.io/api/api-reference/#tag/Workflow/paths/~1workflows/post\">documentation</a>.",
	},
];

const deactivateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['deactivate'],
			},
		},
		routing: {
			request: {
				method: 'POST',
				url: '=/workflows/{{ $value }}/deactivate',
			},
		},
	},
];

const deleteOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['delete'],
			},
		},
		routing: {
			request: {
				method: 'DELETE',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
];

const getAllOperation: INodeProperties[] = [
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"default": true,
		"displayOptions": {
			"show": {
				"resource": [
					"workflow"
				],
				"operation": [
					"getAll"
				]
			}
		},
		"description": "是否返回所有结果，还是仅返回至给定限制"
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
					"workflow"
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
		"displayName": "筛选器",
		"name": "filters",
		"type": "collection",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": [
					"workflow"
				],
				"operation": [
					"getAll"
				]
			}
		},
		"options": [
			{
				"displayName": "仅返回活动工作流",
				"name": "activeWorkflows",
				"type": "boolean",
				"default": true,
				"routing": {
					"request": {
						"qs": {
							"active": "={{ $value }}"
						}
					}
				}
			},
			{
				"displayName": "标签",
				"name": "tags",
				"type": "string",
				"default": "",
				"routing": {
					"send": {
						"type": "query",
						"property": "tags",
						"value": "={{ $value !== '' ? $value : undefined }}"
					}
				},
				"description": "仅包含具有这些标签的工作流",
				"hint": "标签的逗号分隔列表（空值将被忽略）"
			}
		]
	}
];

const getOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['get'],
			},
		},
		routing: {
			request: {
				method: 'GET',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
];

const updateOperation: INodeProperties[] = [
	{
		...workflowIdLocator,
		required: true,
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['update'],
			},
		},
		routing: {
			request: {
				method: 'PUT',
				url: '=/workflows/{{ $value }}',
			},
		},
	},
	{
		displayName: 'Workflow Object',
		name: 'workflowObject',
		type: 'json',
		default: '',
		placeholder:
			'{\n  "name": "My workflow",\n  "nodes": [],\n  "connections": {},\n  "settings": {}\n}',
		required: true,
		typeOptions: {
			alwaysOpenEditWindow: true,
		},
		displayOptions: {
			show: {
				resource: ['workflow'],
				operation: ['update'],
			},
		},
		routing: {
			send: {
				preSend: [parseAndSetBodyJson('workflowObject'), prepareWorkflowUpdateBody],
			},
		},
		description:
			"A valid JSON object with required fields: 'name', 'nodes', 'connections' and 'settings'. More information can be found in the <a href=\"https://docs.n8n.io/api/api-reference/#tag/Workflow/paths/~1workflows~1%7Bid%7D/put\">documentation</a>.",
	},
];

export const workflowFields: INodeProperties[] = [
	...activateOperation,
	...createOperation,
	...deactivateOperation,
	...deleteOperation,
	...getAllOperation,
	...getOperation,
	...updateOperation,
];
