import type { INodeProperties } from 'n8n-workflow';

export const addConfigFields: INodeProperties[] = [
	{
		"displayName": "Key",
		"name": "key",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["addConfig"]
			}
		},
		"default": "",
		"placeholder": "user.email",
		"description": "要设置的键的名称",
		"required": true
	},
	{
		"displayName": "Value",
		"name": "value",
		"type": "string",
		"displayOptions": {
			"show": {
				"operation": ["addConfig"]
			}
		},
		"default": "",
		"placeholder": "name@example.com",
		"description": "要设置的键的值",
		"required": true
	},
	{
		"displayName": "Options",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"operation": ["addConfig"]
			}
		},
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "Mode",
				"name": "mode",
				"type": "options",
				"options": [
					{
						"name": "Append",
						"value": "append"
					},
					{
						"name": "Set",
						"value": "set"
					}
				],
				"default": "set",
				"description": "追加设置而不是将其设置在本地配置中"
			}
		]
	}

];
