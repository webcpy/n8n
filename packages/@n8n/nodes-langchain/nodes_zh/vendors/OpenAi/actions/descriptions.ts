import type { INodeProperties } from 'n8n-workflow';

export const modelRLC: INodeProperties = {
	"displayName": "模型",
	"name": "modelId",
	"type": "resourceLocator",
	"default": { "mode": "list", "value": "" },
	"required": true,
	"modes": [
		{
			displayName: '从列表中选择',
			name: 'list',
			"type": "list",
			typeOptions: {
				"searchListMethod": "modelSearch",
				"searchable": true
			}
		},
		{
			"displayName": "ID",
			"name": "id",
			"type": "string",
			"placeholder": "例如：gpt-4"
		}
	]
};

export const assistantRLC: INodeProperties = {
	"displayName": "助手",
	"name": "assistantId",
	"type": "resourceLocator",
	"description": "用于回复消息的助手。您可以在<a href='https://platform.openai.com/playground?mode=assistant' target='_blank'>playground</a>中添加、修改或删除助手。",
	"default": { "mode": "list", "value": "" },
	"required": true,
	"modes": [
		{
			"displayName": "从列表中选择",
			"name": "list",
			"type": "list",
			"typeOptions": {
				"searchListMethod": "assistantSearch",
				"searchable": true
			}
		},
		{
			"displayName": "ID",
			"name": "id",
			"type": "string",
			"placeholder": "例如：asst_abc123"
		}
	]
}

