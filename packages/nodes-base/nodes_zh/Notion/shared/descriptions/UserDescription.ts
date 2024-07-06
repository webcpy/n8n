import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["user"]
			}
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"description": "获取用户",
				"action": "获取用户"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个用户",
				"action": "获取多个用户"
			}
		],
		"default": "get"
	}
];

export const userFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                user:get                                    */
	/* -------------------------------------------------------------------------- */
	{
		displayName: '用户 ID',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['get'],
			},
		},
	},
	/* -------------------------------------------------------------------------- */
	/*                                user:getAll                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["getAll"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 50,
		"description": "要返回的结果的最大数量"
	}
];
