import type { INodeProperties } from 'n8n-workflow';

export const pushFields: INodeProperties[] = [
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"operation": ["push"]
			}
		},
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "目标存储库",
				"name": "targetRepository",
				"type": "string",
				"default": "",
				"placeholder": "https://github.com/n8n-io/n8n",
				"description": "要推送到的存储库的URL或路径"
			}
		]
	}

];
