import type { INodeProperties } from 'n8n-workflow';

import { blocks } from './Blocks';

//RLC with fixed regex for blockId
const blockIdRLC: INodeProperties = {
	"displayName": "块",
	"name": "blockId",
	"type": "resourceLocator",
	"default": {
		"mode": "url",
		"value": ""
	},
	"required": true,
	"modes": [
		{
			"displayName": "链接",
			"name": "url",
			"type": "string",
			"placeholder": "例如 https://www.notion.so/Block-Test-88888ccc303e4f44847f27d24bd7ad8e?pvs=4#c44444444444bbbbb4d32fdfdd84e",
			"validation": [
				{
					"type": "regex",
					"properties": {
						"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
						"errorMessage": "不是有效的 Notion 块 URL"
					}
				}
			]
		},
		{
			"displayName": "ID",
			"name": "id",
			"type": "string",
			"placeholder": "例如 ab1545b247fb49fa92d6f4b49f4d8116",
			"validation": [
				{
					"type": "regex",
					"properties": {
						"regex": "[a-f0-9]{2,}",
						"errorMessage": "不是有效的 Notion 块 ID"
					}
				}
			]
		}
	],
	"description": "从中获取所有子项的 Notion 块，使用“按URL”模式时，请确保使用块本身的URL，您可以在 Notion 的块参数中找到它，在“复制块链接”下"
}

export const blockOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["block"]
			}
		},
		"options": [
			{
				"name": "追加到后面",
				"value": "append",
				"description": "追加一个块",
				"action": "追加一个块"
			},
			{
				"name": "获取子块",
				"value": "getAll",
				"description": "获取多个子块",
				"action": "获取多个子块"
			}
		],
		"default": "append"
	}
]


export const blockFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                block:append                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "块",
		"name": "blockId",
		"type": "resourceLocator",
		"default": { "mode": "url", "value": "" },
		"required": true,
		"modes": [
			{
				"displayName": "链接",
				"name": "url",
				"type": "string",
				"placeholder": "https://www.notion.so/My-Page-b4eeb113e118403ba450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "不是有效的 Notion 块 URL"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})"
				}
			},
			{
				"displayName": "ID",
				"name": "id",
				"type": "string",
				"placeholder": "ab1545b247fb49fa92d6f4b49f4d8116",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \t]*",
							"errorMessage": "不是有效的 Notion 块 ID"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})"
				},
				"url": "={{$value.replace(/-/g, \"\")}}"
			}
		],
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["append"]
			},
			"hide": {
				"@version": [{ "_cnd": { "gte": 2.2 } }]
			}
		},
		"description": "要将块追加到的 Notion 块"
	},

	{
		...blockIdRLC,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['append'],
				'@version': [{ _cnd: { gte: 2.2 } }],
			},
		},
	},

	...blocks('block', 'append'),
	/* -------------------------------------------------------------------------- */
	/*                                block:getAll                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "块",
		"name": "blockId",
		"type": "resourceLocator",
		"default": { "mode": "url", "value": "" },
		"required": true,
		"modes": [
			{
				"displayName": "链接",
				"name": "url",
				"type": "string",
				"placeholder": "https://www.notion.so/My-Page-b4eeb113e118403ba450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "不是有效的 Notion 块 URL"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})"
				}
			},
			{
				"displayName": "ID",
				"name": "id",
				"type": "string",
				"placeholder": "ab1545b247fb49fa92d6f4b49f4d8116",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \t]*",
							"errorMessage": "不是有效的 Notion 块 ID"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})"
				},
				"url": "={{$value.replace(/-/g, \"\")}}"
			}
		],
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["getAll"]
			},
			"hide": {
				"@version": [{ "_cnd": { "gte": 2.2 } }]
			}
		},
		"description": "要从中获取所有子项的 Notion 块"
	},
	{
		...blockIdRLC,
		displayOptions: {
			show: {
				resource: ['block'],
				operation: ['getAll'],
				'@version': [{ _cnd: { gte: 2.2 } }],
			},
		},
	},
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制数量的结果"
	},


	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["getAll"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 50,
		"description": "要返回的结果的最大数量"
	},
	{
		"displayName": "还提取嵌套块",
		"name": "fetchNestedBlocks",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["getAll"]
			}
		},
		"default": false
	},
	{
		"displayName": "简化输出",
		"name": "simplifyOutput",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["block"],
				"operation": ["getAll"]
			},
			"hide": {
				"@version": [1, 2]
			}
		},
		"default": true
	}

];
