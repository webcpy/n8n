import type { INodeProperties } from 'n8n-workflow';

export const pipelineOperations: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pipeline'],
			},
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"description": "获取一个流水线",
				"action": "获取一个流水线"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个流水线",
				"action": "获取多个流水线"
			},
			{
				"name": "触发",
				"value": "trigger",
				"description": "触发一个流水线",
				"action": "触发一个流水线"
			}
		],
		default: 'get',
	},
];

export const pipelineFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                               pipeline:shared                              */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "提供者",
		"name": "vcs",
		"type": "options",
		"options": [
			{
				"name": "Bitbucket",
				"value": "bitbucket"
			},
			{
				"name": "GitHub",
				"value": "github"
			}
		],
		"displayOptions": {
			"show": {
				"operation": ["get", "getAll", "trigger"],
				"resource": ["pipeline"]
			}
		},
		"default": "",
		"description": "源代码控制系统"
	},
	{
		"displayName": "项目标识符",
		"name": "projectSlug",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["get", "getAll", "trigger"],
				"resource": ["pipeline"]
			}
		},
		"default": "",
		"placeholder": "n8n-io/n8n",
		"description": "项目标识符，格式为组织名/仓库名"
	},

	/* -------------------------------------------------------------------------- */
	/*                                 pipeline:get                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "流水线编号",
		"name": "pipelineNumber",
		"type": "number",
		"typeOptions": {
			"minValue": 1
		},
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["pipeline"]
			}
		},
		"default": 1,
		"description": "流水线的编号"
	},

	/* -------------------------------------------------------------------------- */
	/*                                 pipeline:getAll                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["pipeline"]
			}
		},
		"default": false,
		"description": "是否返回全部结果，或者只返回到给定限制的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["pipeline"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 500
		},
		"default": 100,
		"description": "返回结果的最大数量"
	},
	{
		"displayName": "过滤器",
		"name": "filters",
		"type": "collection",
		"placeholder": "添加过滤器",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["pipeline"],
				"operation": ["getAll"]
			}
		},
		"options": [
			{
				"displayName": "分支",
				"name": "branch",
				"type": "string",
				"default": "",
				"description": "版本控制系统中的分支名称"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 pipeline:trigger                           */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "附加字段",
		"name": "additionalFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["pipeline"],
				"operation": ["trigger"]
			}
		},
		"options": [
			{
				"displayName": "分支",
				"name": "branch",
				"type": "string",
				"default": "",
				"description": "流水线运行所在的分支。该分支上的HEAD提交被用于流水线。请注意，分支和标签是互斥的。"
			},
			{
				"displayName": "标签",
				"name": "tag",
				"type": "string",
				"default": "",
				"description": "流水线使用的标签。该标签所指向的提交被用于流水线。请注意，分支和标签是互斥的。"
			}
		]
	}
];
