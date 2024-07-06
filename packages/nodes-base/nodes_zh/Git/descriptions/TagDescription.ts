import type { INodeProperties } from 'n8n-workflow';

export const tagFields: INodeProperties[] = [
	{
		"displayName": "名称",
		"name": "name",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["tag"]
			}
		},
		"default": "",
		"description": "要创建的标签的名称",
		"required": true
	}
];
