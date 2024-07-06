import type { INodeProperties } from 'n8n-workflow';

export const cloneFields: INodeProperties[] = [
	{
		"displayName": "源存储库",
		"name": "sourceRepository",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["clone"]
			}
		},
		"default": "",
		"placeholder": "https://github.com/n8n-io/n8n",
		"description": "要克隆的存储库的 URL 或路径",
		"required": true
	}

];
