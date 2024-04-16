import type { INodeProperties } from 'n8n-workflow';

export const commitFields: INodeProperties[] = [
	{
		"displayName": "消息",
		"name": "message",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["commit"]
			}
		},
		"default": "",
		"description": "要使用的提交消息"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"operation": ["commit"]
			}
		},
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "要添加的路径",
				"name": "pathsToAdd",
				"type": "string",
				"default": "",
				"placeholder": "/data/file1.json",
				"description": "要提交的文件或文件夹的路径的逗号分隔列表（绝对路径或相对于存储库路径）。如果未设置，则将提交所有“添加”的文件和文件夹。"
			}
		]
	}
]
