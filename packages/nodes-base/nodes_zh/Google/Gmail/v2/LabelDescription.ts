import type { INodeProperties } from 'n8n-workflow';

export const labelOperations: INodeProperties[] = [
	{
		"default": "getAll",
		"description": "NoDataExpression",
		"displayName": "操作",
		"name": "operation",
		"displayOptions": {
			"show": {
				"resource": ["label"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"action": "创建标签"
			},
			{
				"name": "删除",
				"value": "delete",
				"action": "删除标签"
			},
			{
				"name": "获取",
				"value": "get",
				"action": "获取标签信息"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"action": "获取多个标签"
			}
		],
		"type": "options"
	}
];

export const labelFields: INodeProperties[] = [
	{
		"default": "",
		"description": "标签名称",
		"displayName": "名称",
		"name": "name",
		"placeholder": "invoices",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["label"],
				"operation": ["create"]
			}
		},
		"type": "string"
	},
	{
		"description": "标签的ID",
		"displayName": "标签ID",
		"name": "labelId",
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["label"],
				"operation": ["get", "delete"]
			}
		},
		"required": true,
		"type": "string"
	},
	{
		"default": {},
		"description": "Gmail Web界面中标签列表中标签的可见性",
		"displayName": "选项",
		"name": "options",
		"placeholder": "添加选项",
		"displayOptions": {
			"show": {
				"resource": ["label"],
				"operation": ["create"]
			}
		},
		"type": "collection",
		"options": [
			{
				"default": "labelShow",
				"description": "在Gmail Web界面中标签列表中的可见性",
				"displayName": "标签列表可见性",
				"name": "labelListVisibility",
				"options": [
					{
						"name": "隐藏",
						"value": "labelHide"
					},
					{
						"name": "显示",
						"value": "labelShow"
					},
					{
						"name": "如果未读则显示",
						"value": "labelShowIfUnread"
					}
				],
				"type": "options"
			},
			{
				"default": "show",
				"description": "在Gmail Web界面中消息列表中的可见性",
				"displayName": "消息列表可见性",
				"name": "messageListVisibility",
				"options": [
					{
						"name": "隐藏",
						"value": "hide"
					},
					{
						"name": "显示",
						"value": "show"
					}
				],
				"type": "options"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 label:getAll                               */
	/* -------------------------------------------------------------------------- */
	{
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制内的结果",
		"displayName": "返回所有",
		"name": "returnAll",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["label"]
			}
		},
		"type": "boolean"
	},
	{
		"default": 50,
		"description": "要返回的最大结果数",
		"displayName": "限制",
		"name": "limit",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["label"],
				"returnAll": [false]
			}
		},
		"type": "number",
		"typeOptions": {
			"minValue": 1,
			"maxValue": 500
		}
	}
];
