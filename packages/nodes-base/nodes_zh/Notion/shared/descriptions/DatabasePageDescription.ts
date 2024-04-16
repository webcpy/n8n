import type { INodeProperties } from 'n8n-workflow';

import { getConditions, getSearchFilters } from '../GenericFunctions';

import { blocks, text } from './Blocks';

import { filters } from './Filters'

export const databasePageOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["databasePage"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "在数据库中创建页面",
				"action": "创建数据库页面"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取数据库中的页面",
				"action": "获取数据库页面"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取数据库中的多个页面",
				"action": "获取数据库页面"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新数据库中的页面",
				"action": "更新数据库页面"
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
				"@version": [1],
				"resource": ["databasePage"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "在数据库中创建页面",
				"action": "创建数据库页面"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取数据库中的多个页面",
				"action": "获取数据库页面"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新数据库中的页面",
				"action": "更新数据库页面"
			}
		],
		"default": "create"
	}

];

export const databasePageFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                databasePage:create                         */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "数据库",
		"name": "databaseId",
		"type": "resourceLocator",
		"default": { "mode": "list", "value": "" },
		"required": true,
		"modes": [
			{
				"displayN ame": "数据库",
				"name": "list",
				"type": "list",
				"placeholder": "选择一个数据库...",
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
							"errorMessage": "不是有效的 Notion 数据库链接"
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
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \\t]*",
							"errorMessage": "不是有效的 Notion 数据库 ID"
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
				"resource": ["databasePage"],
				"operation": ["create"]
			}
		},
		"description": "要操作的 Notion 数据库"
	},

	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["create"]
			},
			"hide": {
				"@version": [1]
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
				"resource": ["databasePage"],
				"operation": ["create"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},

	{
		displayName: '属性',
		name: 'propertiesUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['databasePage'],
				operation: ['create'],
			},
		},
		default: {},
		placeholder: '新增属性',
		options: [
			{
				name: 'propertyValues',
				displayName: 'Property',
				values: [
					{
						"displayName": "键名或ID",
						"name": "key",
						"type": "options",
						"description": "从列表中选择，或使用表达式指定一个ID。",
						"typeOptions": {
							"loadOptionsMethod": "getDatabaseProperties",
							"loadOptionsDependsOn": ["databaseId"]
						},
						"default": ""
					},
					{
						"displayName": "类型",
						"name": "type",
						"type": "hidden",
						"default": "={{$parameter[\"&key\"].split(\"|\")[1]}}"
					},
					{
						"displayName": "标题",
						"name": "title",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["title"]
							}
						},
						"default": ""
					},
					{
						"displayName": "富文本",
						"name": "richText",
						"type": "boolean",
						"displayOptions": {
							"show": {
								"type": ["rich_text"]
							}
						},
						"default": false
					},
					{
						"displayName": "文本",
						"name": "textContent",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["rich_text"],
								"richText": [false]
							}
						},
						"default": ""
					},
					...text({
						show: {
							type: ['rich_text'],
							richText: [true],
						},
					}),

					{
						"displayName": "电话号码",
						"name": "phoneValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["phone_number"]
							}
						},
						"default": "",
						"description": "电话号码。不强制要求结构。",
					},
					{
						"displayName": "选项名称或ID",
						"name": "multiSelectValue",
						"type": "multiOptions",
						"typeOptions": {
							"loadOptionsMethod": "getPropertySelectValues"
						},
						"displayOptions": {
							"show": {
								"type": ["multi_select"]
							}
						},
						"default": [],
						"description": "要设置的选项名称。多个选项可以用逗号分隔定义。从列表中选择，或使用表达式指定一个ID。",
					},
					{
						"displayName": "选项名称或ID",
						"name": "selectValue",
						"type": "options",
						"typeOptions": {
							"loadOptionsMethod": "getPropertySelectValues"
						},
						"displayOptions": {
							"show": {
								"type": ["select"]
							}
						},
						"default": "",
						"description": "要设置的选项名称。从列表中选择，或使用表达式指定一个ID。",
					},
					{
						"displayName": "状态名称或ID",
						"name": "statusValue",
						"type": "options",
						"typeOptions": {
							"loadOptionsMethod": "getPropertySelectValues"
						},
						"displayOptions": {
							"show": {
								"type": ["status"]
							}
						},
						"default": "",
						"description": "要设置的状态名称。从列表中选择，或使用表达式指定一个ID。",
					},
					{
						"displayName": "电子邮件",
						"name": "emailValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["email"]
							}
						},
						"default": "",
						"description": "电子邮件地址。",
					},
					{
						"displayName": "空则忽略",
						"name": "ignoreIfEmpty",
						"type": "boolean",
						"displayOptions": {
							"show": {
								"type": ["url"]
							}
						},
						"default": false,
						"description": "如果为空则忽略。",
					},
					{
						"displayName": "URL",
						"name": "urlValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["url"]
							}
						},
						"default": "",
						"description": "网址。",
					},
					{
						"displayName": "用户名称或ID",
						"name": "peopleValue",
						"type": "multiOptions",
						"typeOptions": {
							"loadOptionsMethod": "getUsers"
						},
						"displayOptions": {
							"show": {
								"type": ["people"]
							}
						},
						"default": [],
						"description": "用户列表。多个用户可以用逗号分隔定义。从列表中选择，或使用表达式指定一个ID。",
					},
					{
						"displayName": "关系ID",
						"name": "relationValue",
						"type": "string",
						"typeOptions": {
							"multipleValues": true
						},
						"displayOptions": {
							"show": {
								"type": ["relation"]
							}
						},
						"default": [],
						"description": "属于另一个数据库的数据库列表。多个数据库可以用逗号分隔定义。",
					},
					{
						"displayName": "已选中",
						"name": "checkboxValue",
						"displayOptions": {
							"show": {
								"type": ["checkbox"]
							}
						},
						"type": "boolean",
						"default": false,
						"description": "复选框是否已选中。true 代表已选中。false 代表未选中。",
					},
					{
						"displayName": "数字",
						"name": "numberValue",
						"displayOptions": {
							"show": {
								"type": ["number"]
							}
						},
						"type": "number",
						"default": 0,
						"description": "数字值。",
					},
					{
						"displayName": "范围",
						"name": "range",
						"displayOptions": {
							"show": {
								"type": ["date"]
							}
						},
						"type": "boolean",
						"default": false,
						"description": "是否定义日期范围。",
					},
					{
						"displayName": "包含时间",
						"name": "includeTime",
						"displayOptions": {
							"show": {
								"type": ["date"]
							}
						},
						"type": "boolean",
						"default": true,
						"description": "是否包含日期中的时间。",
					},
					{
						"displayName": "日期",
						"name": "date",
						"displayOptions": {
							"show": {
								"range": [false],
								"type": ["date"]
							}
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间部分。",
					},
					{
						"displayName": "日期开始",
						"name": "dateStart",
						"displayOptions": {
							"show": {
								"range": [true],
								"type": ["date"]
							}
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间部分。",
					},
					{
						"displayName": "日期结束",
						"name": "dateEnd",
						"displayOptions": {
							"show": {
								"range": [true],
								"type": ["date"]
							}
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间部分。表示日期范围的结束。",
					},
					{
						"displayName": "时区名称或ID",
						"name": "timezone",
						"type": "options",
						"displayOptions": {
							"show": {
								"type": ["date"]
							}
						},
						"typeOptions": {
							"loadOptionsMethod": "getTimezones"
						},
						"default": "default",
						"description": "要使用的时区。默认情况下使用 n8n 时区。从列表中选择，或使用表达式指定一个ID。",
					},
					{
						"displayName": "文件URLs",
						"name": "fileUrls",
						"placeholder": "添加文件",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": true,
							"sortable": true
						},
						"displayOptions": {
							"show": {
								"type": ["files"]
							},
							"hide": {
								"@version": [1]
							}
						},
						"default": {},
						"options": [
							{
								"name": "fileUrl",
								"displayName": "文件",
								"values": [
									{
										"displayName": "名称",
										"name": "name",
										"type": "string",
										"default": ""
									},
									{
										"displayName": "文件URL",
										"name": "url",
										"type": "string",
										"default": "",
										"description": "链接到外部托管文件"
									}
								]
							}
						]
					}
				],
			},
		],
	},
	...blocks('databasePage', 'create'),
	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				resource: ['databasePage'],
				operation: ['create'],
			},
		},
		default: {},
		placeholder: '添加选项',
		options: [
			{
				"displayName": "图标类型",
				"name": "iconType",
				"type": "options",
				"options": [
					{
						"name": "Emoji",
						"value": "emoji",
						"description": "使用 Emoji 作为图标",
					},
					{
						"name": "文件",
						"value": "file",
						"description": "使用文件作为图标",
					},
				],
				"default": "emoji",
				"description": "数据库页面的图标类型，可以是 URL 或 Emoji",
			},
			{
				"displayName": "图标",
				"name": "icon",
				"type": "string",
				"default": "",
				"description": "用作图标的 Emoji 或文件 URL",
			}
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                      databasePage:update                                   */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "数据库页面",
		"name": "pageId",
		"type": "resourceLocator",
		"default": { "mode": "url", "value": "" },
		"required": true,
		"modes": [
			{
				"displayName": "链接",
				"name": "url",
				"type": "string",
				"placeholder": "https://www.notion.so/My-Database-Page-b4eeb113e118403ba450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "不是有效的 Notion 数据库页面 URL",
						},
					},
				],
				"extractValue": {
					"type": "regex",
					"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})",
				},
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
							"errorMessage": "不是有效的 Notion 数据库页面 ID",
						},
					},
				],
				"extractValue": {
					"type": "regex",
					"regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})",
				},
				url: '=https://www.notion.so/{{$value.replace(/-/g, "")}}',
			},
		],
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["update"],
			},
		},
		"description": "要更新的 Notion 数据库页面",
	},

	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["update"],
			},
		},
		"default": true,
		"description": "是否返回响应的简化版本而非原始数据",
	},


	{
		displayName: '属性',
		name: 'propertiesUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['databasePage'],
				operation: ['update'],
			},
		},
		default: {},
		placeholder: '新增属性',
		options: [
			{
				name: 'propertyValues',
				displayName: '属性名称',
				values: [
					{
						"displayName": "键名称或ID",
						"name": "key",
						"type": "options",
						"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个ID",
						"typeOptions": {
							"loadOptionsMethod": "getDatabaseIdFromPage",
							"loadOptionsDependsOn": ["pageId"],
						},
						"default": "",
					},
					{
						"displayName": "类型",
						"name": "type",
						"type": "hidden",
						"default": "={{$parameter[\"&key\"].split(\"|\")[1]}}",
					},
					{
						"displayName": "标题",
						"name": "title",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["title"],
							},
						},
						"default": "",
					},
					{
						"displayName": "富文本",
						"name": "richText",
						"type": "boolean",
						"displayOptions": {
							"show": {
								"type": ["rich_text"],
							},
						},
						"default": false,
					},
					{
						"displayName": "文本",
						"name": "textContent",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["rich_text"],
								"richText": [false],
							},
						},
						"default": "",
					},
					...text({
						show: {
							type: ['rich_text'],
							richText: [true],
						},
					}),
					{
						"displayName": "电话号码",
						"name": "phoneValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["phone_number"],
							},
						},
						"default": "",
						"description": "电话号码。不强制要求任何结构。",
					},
					{
						"displayName": "选项名称或ID",
						"name": "multiSelectValue",
						"type": "multiOptions",
						"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个ID",
						"typeOptions": {
							"loadOptionsMethod": "getDatabaseOptionsFromPage",
						},
						"displayOptions": {
							"show": {
								"type": ["multi_select"],
							},
						},
						"default": [],
					},
					{
						"displayName": "选项名称或ID",
						"name": "selectValue",
						"type": "options",
						"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个ID",
						"typeOptions": {
							"loadOptionsMethod": "getDatabaseOptionsFromPage",
						},
						"displayOptions": {
							"show": {
								"type": ["select"],
							},
						},
						"default": "",
					},
					{
						"displayName": "状态名称或ID",
						"name": "statusValue",
						"type": "options",
						"typeOptions": {
							"loadOptionsMethod": "getDatabaseOptionsFromPage",
						},
						"displayOptions": {
							"show": {
								"type": ["status"],
							},
						},
						"default": "",
						"description": "您要设置的选项的名称。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个ID。",
					},
					{
						"displayName": "电子邮件",
						"name": "emailValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["email"],
							},
						},
						"default": "",
					},
					{
						"displayName": "如果为空则忽略",
						"name": "ignoreIfEmpty",
						"type": "boolean",
						"displayOptions": {
							"show": {
								"type": ["url"],
							},
						},
						"default": false,
					},
					{
						"displayName": "网址",
						"name": "urlValue",
						"type": "string",
						"displayOptions": {
							"show": {
								"type": ["url"],
							},
						},
						"default": "",
						"description": "网址",
					},
					{
						"displayName": "用户名或ID",
						"name": "peopleValue",
						"type": "multiOptions",
						"typeOptions": {
							"loadOptionsMethod": "getUsers",
						},
						"displayOptions": {
							"show": {
								"type": ["people"],
							},
						},
						"default": [],
						"description": "用户列表。可以用逗号分隔定义多个。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID。",
					},
					{
						"displayName": "关系ID",
						"name": "relationValue",
						"type": "string",
						"typeOptions": {
							"multipleValues": true,
						},
						"displayOptions": {
							"show": {
								"type": ["relation"],
							},
						},
						"default": [],
						"description": "属于另一个数据库的数据库列表。可以用逗号分隔定义多个。",
					},
					{
						"displayName": "选中",
						"name": "checkboxValue",
						"displayOptions": {
							"show": {
								"type": ["checkbox"],
							},
						},
						"type": "boolean",
						"default": false,
						"description": "复选框是否选中。 <code>true</code> 表示选中。 <code>false</code> 表示未选中。",
					},
					{
						"displayName": "数字",
						"name": "numberValue",
						"displayOptions": {
							"show": {
								"type": ["number"],
							},
						},
						"type": "number",
						"default": 0,
						"description": "数字值",
					},
					{
						"displayName": "范围",
						"name": "range",
						"displayOptions": {
							"show": {
								"type": ["date"],
							},
						},
						"type": "boolean",
						"default": false,
						"description": "是否要定义日期范围",
					},
					{
						"displayName": "包含时间",
						"name": "includeTime",
						"displayOptions": {
							"show": {
								"type": ["date"],
							},
						},
						"type": "boolean",
						"default": true,
						"description": "日期中是否包含时间",
					},
					{
						"displayName": "日期",
						"name": "date",
						"displayOptions": {
							"show": {
								"range": [false],
								"type": ["date"],
							},
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间",
					},
					{
						"displayName": "开始日期",
						"name": "dateStart",
						"displayOptions": {
							"show": {
								"range": [true],
								"type": ["date"],
							},
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间",
					},
					{
						"displayName": "结束日期",
						"name": "dateEnd",
						"displayOptions": {
							"show": {
								"range": [true],
								"type": ["date"],
							},
						},
						"type": "dateTime",
						"default": "",
						"description": "ISO 8601 格式日期，可选时间。表示日期范围的结束。",
					},
					{
						"displayName": "时区名称或ID",
						"name": "timezone",
						"type": "options",
						"displayOptions": {
							"show": {
								"type": ["date"],
							},
						},
						"typeOptions": {
							"loadOptionsMethod": "getTimezones",
						},
						"default": "default",
						"description": "要使用的时区。默认情况下使用 n8n 时区。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID。",
					},
					{
						"displayName": "文件网址",
						"name": "fileUrls",
						"placeholder": "添加文件",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": true,
							"sortable": true,
						},
						"displayOptions": {
							"show": {
								"type": ["files"],
							},
							"hide": {
								"@version": [1],
							},
						},
						"default": {},
						"options": [
							{
								"name": "fileUrl",
								"displayName": "文件",
								"values": [
									{
										"displayName": "名称",
										"name": "name",
										"type": "string",
										"default": "",
									},
									{
										"displayName": "文件网址",
										"name": "url",
										"type": "string",
										"default": "",
										"description": "指向外部托管文件的链接",
									},
								],
							},
						],
					}
				],
			},
		],
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["update"],
			},
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
						"name": "Emoji",
						"value": "emoji",
						"description": "使用 Emoji 作为图标",
					},
					{
						"name": "文件",
						"value": "file",
						"description": "使用文件作为图标",
					},
				],
				"default": "emoji",
				"description": "数据库页面的图标类型，可以是 URL 或 Emoji",
			},
			{
				"displayName": "图标",
				"name": "icon",
				"type": "string",
				"default": "",
				"description": "要用作图标的 Emoji 或文件 URL",
			},
		],
	},

	/* -------------------------------------------------------------------------- */
	/*                                databasePage:get                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "数据库页面",
		"name": "pageId",
		"type": "resourceLocator",
		"default": { "mode": "url", "value": "" },
		"required": true,
		"modes": [
			{
				"displayName": "链接",
				"name": "url",
				"type": "string",
				"placeholder": "https://www.notion.so/My-Database-Page-b4eeb113e118403ba450af65ac25f0b9",
				"validation": [
					{
						"type": "regex",
						"properties": {
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?(?:[a-zA-Z0-9-]{2,}-)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
							"errorMessage": "不是有效的 Notion 数据库页面 URL"
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
							"errorMessage": "不是有效的 Notion 数据库页面 ID"
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
				"resource": ["databasePage"],
				"operation": ["get"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"description": "要获取的 Notion 数据库页面"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["get"]
			},
			"hide": {
				"@version": [1]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	/* -------------------------------------------------------------------------- */
	/*                                databasePage:getAll                         */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "数据库",
		"name": "databaseId",
		"type": "resourceLocator",
		"default": { "mode": "list", "value": "" },
		"required": true,
		"modes": [
			{
				"displayName": "数据库",
				"name": "list",
				"type": "list",
				"placeholder": "选择一个数据库...",
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
							"errorMessage": "不是有效的 Notion 数据库 URL"
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
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \\t]*",
							"errorMessage": "不是有效的 Notion 数据库 ID"
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
				"resource": ["databasePage"],
				"operation": ["getAll"]
			}
		},
		"description": "要操作的 Notion 数据库"
	},
	{
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["getAll"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 100
		},
		"default": 50,
		"description": "要返回的最大结果数"
	},
	{
		"displayName": "简化",
		"name": "simple",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["databasePage"],
				"operation": ["getAll"]
			}
		},
		"default": true,
		"description": "是否返回响应的简化版本而不是原始数据"
	},
	...getSearchFilters('databasePage'),
	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		displayOptions: {
			show: {
				operation: ['getAll'],
				resource: ['databasePage'],
			},
		},
		default: {},
		placeholder: '添加字段',
		options: [
			{
				"displayOptions": {
					"show": {
						"/resource": ["databasePage"],
						"/operation": ["getAll"]
					},
					"hide": {
						"@version": [1]
					}
				},
				"description": "If a field in a database contains a file, whether to download it",
				"default": false,
				"type": "boolean",
				"name": "downloadFiles",
				"displayName": "下载文件"
			},
			{
				"displayOptions": {
					"show": {
						"@version": [1]
					}
				},
				"default": {},
				"type": "fixedCollection",
				"name": "filter",
				"displayName": "过滤器",
				"typeOptions": {
					"multipleValues": false
				},
				"placeholder": "添加过滤器",
				"options": [{
					"name": "singleCondition",
					"displayName": "单个条件",
					values: [...filters(getConditions())],

				},
				{
					"name": "multipleCondition",
					"displayName": "多个条件",
					values: [
						{
							displayName: '条件',
							name: 'condition',
							placeholder: '新增条件',
							type: 'fixedCollection',
							typeOptions: {
								multipleValues: true,
							},
							default: {},
							options: [
								{
									displayName: 'OR',
									name: 'or',
									values: [...filters(getConditions())],
								},
								{
									displayName: 'AND',
									name: 'and',
									values: [...filters(getConditions())],
								},
							],
						},
					],
				}
				]
			},
			{
				"default": {},
				"type": "fixedCollection",
				"name": "sort",
				"displayName": "排序",
				"typeOptions": {
					"multipleValues": true
				},
				"placeholder": "添加排序",
				"options": [{
					"name": "sortValue",
					"displayName": "排序",
					"values": [{
						"displayName": "Timestamp",
						"name": "timestamp",
						"type": "boolean",
						"default": false,
						"description": "是否使用记录的时间戳来排序响应"
					},
					{
						"displayName": "属性名称或 ID",
						"name": "key",
						"type": "options",
						"typeOptions": {
							"loadOptionsMethod": "getFilterProperties",
							"loadOptionsDependsOn": ["datatabaseId"]
						},
						"default": "",
						"description": "要按其过滤的属性名称。从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定 ID。"
					},
					{
						"displayName": "属性名称",
						"name": "key",
						"type": "options",
						"options": [{
							"name": "创建时间",
							"value": "created_time"
						},
						{
							"name": "最后编辑时间",
							"value": "last_edited_time"
						}
						],
						"default": "",
						"description": "要按其过滤的属性名称"
					},
					{
						"displayName": "类型",
						"name": "type",
						"type": "hidden",
						"default": "={{$parameter[\"&key\"].split(\"|\")[1]}}",
						"description": "要按其过滤的属性类型"
					},
					{
						"displayName": "方向",
						"name": "direction",
						"type": "options",
						"options": [{
							"name": "升序",
							"value": "ascending"
						},
						{
							"name": "降序",
							"value": "descending"
						}
						],
						"default": "",
						"description": "排序方向"
					}
					]
				}]
			}
		],
	},
] as INodeProperties[];
