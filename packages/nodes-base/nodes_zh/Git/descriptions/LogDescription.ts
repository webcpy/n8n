import type { INodeProperties } from 'n8n-workflow';

export const logFields: INodeProperties[] = [
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"operation": ["log"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅限于给定的限制"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"operation": ["log"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 100,
		"description": "要返回的最大结果数"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"operation": ["log"]
			}
		},
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "文件",
				"name": "file",
				"type": "string",
				"default": "README.md",
				"description": "要获取历史记录的文件或文件夹的路径（绝对路径或相对于存储库路径）"
			}
		]
	}

];
