import type { INodeProperties } from 'n8n-workflow';

export const videoCategoryOperations: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"resource": ["videoCategory"]
			}
		},
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"options": [
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "检索多个视频类别",
				"action": "获取多个视频类别"
			}
		],
		"default": "getAll"
	}
];

export const videoCategoryFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 videoCategory:getAll                       */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["videoCategory"]
			}
		},
		"displayName": "地区 CODE",
		"name": "regionCode",
		"type": "options",
		"description": "从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID",
		"required": true,
		"typeOptions": {
			"loadOptionsMethod": "getCountriesCodes"
		},
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["videoCategory"]
			}
		},
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制数目的结果"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["videoCategory"],
				"returnAll": [false]
			}
		},
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"default": 25,
		"description": "要返回的最大结果数",
		"typeOptions": {
			"minValue": 1,
			"maxValue": 50
		}
	}

];
