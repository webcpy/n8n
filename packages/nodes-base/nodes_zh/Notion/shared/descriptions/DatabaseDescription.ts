import type { INodeProperties } from 'n8n-workflow';

export const databaseOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["database"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"description": "获取数据库",
				"action": "获取数据库"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个数据库",
				"action": "获取多个数据库"
			},
			{
				"name": "搜索",
				"value": "search",
				"description": "使用文本搜索搜索数据库",
				"action": "搜索数据库"
			}
		],
		"default": "get"
	},
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"@version": [1],
				"resource": ["database"]
			}
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"description": "获取数据库",
				"action": "获取数据库"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个数据库",
				"action": "获取多个数据库"
			}
		],
		"default": "get"
	}
];

export const databaseFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                database:get                                */
	/* -------------------------------------------------------------------------- */

	{
		"displayName": "数据库",
		"name": "databaseId",
		"type": "resourceLocator",
		"default": {
			"mode": "list",
			"value": ""
		},
		"required": true,
		"modes": [
			{
				"displayName": "数据库",
				"name": "list",
				"type": "list",
				"placeholder": "选择数据库...",
				"typeOptions": {
					"searchListMethod": "getDatabases",
					"searchable": true
				}
			},
			{
				"displayName": "链接",
				"name": "url",
				"type": "string",
				"placeholder": "https://www.notion.so/0fe2f7de558b471eab07e9d871cdf4a9?v=f2d424ba0c404733a3f500c78c881610",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "无效的 Notion 数据库 URL。提示：使用数据库本身的 URL，而不是包含它的页面。"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})"
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
							"errorMessage": "无效的 Notion 数据库 ID"
						}
					}
				],
				"extractValue": {
					"type": "regex",
					"regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})"
				},
				url: '=https://www.notion.so/{{$value.replace(/-/g, "")}}',

			}
		],
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["get"]
			}
		},
		"description": "要获取的 Notion 数据库"
	},

	/* -------------------------------------------------------------------------- */
	/*                                database:getAll                             */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["database"],
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
				"resource": ["database"],
				"operation": ["getAll"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 50,
		"description": "要返回的最大结果数量"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["getAll", "get"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},

	/* -------------------------------------------------------------------------- */
	/*                                database:search                             */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "搜索文本",
		"name": "text",
		"type": "string",
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["search"]
			}
		},
		"description": "要搜索的文本"
	},
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["search"]
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
				"resource": ["database"],
				"operation": ["search"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 50,
		"description": "要返回的最大结果数量"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["search"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"resource": ["database"],
				"operation": ["search"]
			}
		},
		"default": {},
		"placeholder": "添加字段",
		"options": [
			{
				"displayName": "排序",
				"name": "sort",
				"placeholder": "添加排序",
				"type": "fixedCollection",
				"typeOptions": {
					"multipleValues": false
				},
				"default": {},
				"options": [
					{
						"displayName": "排序",
						"name": "sortValue",
						"values": [
							{
								"displayName": "方向",
								"name": "direction",
								"type": "options",
								"options": [
									{
										"name": "升序",
										"value": "ascending"
									},
									{
										"name": "降序",
										"value": "descending"
									}
								],
								"default": "descending",
								"description": "排序的方向"
							},
							{
								"displayName": "时间戳",
								"name": "timestamp",
								"type": "options",
								"options": [
									{
										"name": "上次编辑时间",
										"value": "last_edited_time"
									}
								],
								"default": "last_edited_time",
								"description": "要根据其进行排序的时间戳的名称"
							}
						]
					}
				]
			}
		]
	}

];
