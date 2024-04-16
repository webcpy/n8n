import type { INodeProperties } from 'n8n-workflow';

import { blocks } from './Blocks';

export const pageOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"@version": [1],
				"resource": ["page"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "创建页面",
				"action": "创建页面"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取页面",
				"action": "获取页面"
			},
			{
				"name": "搜索",
				"value": "search",
				"description": "页面文本搜索",
				"action": "搜索页面"
			}
		],
		"default": "create"
	},
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["page"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"options": [
			{
				"name": "归档",
				"value": "archive",
				"description": "归档页面",
				"action": "归档页面"
			},
			{
				"name": "创建",
				"value": "create",
				"description": "创建页面",
				"action": "创建页面"
			},
			{
				"name": "搜索",
				"value": "search",
				"description": "页面文本搜索",
				"action": "搜索页面"
			}
		],
		"default": "create"
	}
];

export const pageFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                page:archive                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "页面",
		"name": "pageId",
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
				"placeholder": "https://www.notion.so/My-Page-b4eeb113e118403aa450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "非有效的 Notion 页面 URL"
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
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \\t]*",
							"errorMessage": "非有效的 Notion 页面 ID"
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
				"resource": ["page"],
				"operation": ["archive"]
			}
		},
		"description": "要归档的 Notion 页面"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["archive"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	/* -------------------------------------------------------------------------- */
	/*                                page:create                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "父页面",
		"name": "pageId",
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
				"placeholder": "https://www.notion.so/My-Page-b4eeb113e118403aa450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "非有效的 Notion 页面 URL"
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
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \\t]*",
							"errorMessage": "非有效的 Notion 页面 ID"
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
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"description": "要为其创建子页面的 Notion 数据库页面"
	},
	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"default": "",
		"required": true,
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"description": "页面标题。显示在页面顶部，可以通过快速查找找到。"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	...blocks('page', 'create'),
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"default": {},
		"placeholder": "添加选项",
		"options": [
			{
				"displayName": "图标类型",
				"name": "iconType",
				"type": "options",
				"options": [
					{
						"name": "表情符号",
						"value": "emoji",
						"description": "使用表情符号作为图标"
					},
					{
						"name": "文件",
						"value": "file",
						"description": "使用文件作为图标"
					}
				],
				"default": "emoji",
				"description": "页面的图标类型，可以是 URL 或表情符号"
			},
			{
				"displayName": "图标",
				"name": "icon",
				"type": "string",
				"default": "",
				"description": "作为图标使用的表情符号或文件 URL"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                page:get                                    */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "页面链接或ID",
		"name": "pageId",
		"type": "string",
		"default": "",
		"required": true,
		"displayOptions": {
			"show": {
				"@version": [1],
				"resource": ["page"],
				"operation": ["get"]
			}
		},
		"description": "从 Notion 的 '复制链接' 功能中获取的页面 URL（或仅包含在 URL 中的 ID）"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"@version": [1],
				"resource": ["page"],
				"operation": ["get"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	/* -------------------------------------------------------------------------- */
	/*                                page:search                                  */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "搜索文本",
		"name": "text",
		"type": "string",
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["page"],
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
				"resource": ["page"],
				"operation": ["search"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["search"],
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
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["page"],
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
				"resource": ["page"],
				"operation": ["search"]
			}
		},
		"default": {},
		"placeholder": "添加字段",
		"options": [
			{
				"displayName": "过滤器",
				"name": "filter",
				"placeholder": "添加过滤器",
				"type": "fixedCollection",
				"typeOptions": {
					"multipleValues": false
				},
				"default": {},
				"options": [
					{
						"displayName": "过滤器",
						"name": "filters",
						"values": [
							{
								"displayName": "属性",
								"name": "property",
								"type": "options",
								"options": [
									{
										"name": "对象",
										"value": "object"
									}
								],
								"default": "object",
								"description": "要按属性筛选的名称"
							},
							{
								"displayName": "值",
								"name": "value",
								"type": "options",
								"options": [
									{
										"name": "数据库",
										"value": "database"
									},
									{
										"name": "页面",
										"value": "page"
									}
								],
								"default": "",
								"description": "要按属性值筛选的值"
							}
						]
					}
				]
			},
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
										"name": "最后编辑时间",
										"value": "last_edited_time"
									}
								],
								"default": "last_edited_time",
								"description": "要根据其排序的时间戳的名称"
							}
						]
					}
				]
			}
		]
	}
];
