import type { INodeProperties } from 'n8n-workflow';

export const addFields: INodeProperties[] = [
	{
		"displayName": "添加路径",
		"name": "pathsToAdd",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["add"]
			}
		},
		"default": "",
		"placeholder": "README.md",
		"description": "要添加的文件或文件夹的路径（绝对或相对于仓库路径），用逗号分隔的列表",
		"required": true
	}

];
