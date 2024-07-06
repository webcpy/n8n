import type { IDisplayOptions, INodeProperties } from 'n8n-workflow';

const colors = [
	{
		"name": "默认",
		"value": "default"
	},
	{
		"name": "灰色",
		"value": "gray"
	},
	{
		"name": "棕色",
		"value": "brown"
	},
	{
		"name": "橙色",
		"value": "orange"
	},
	{
		"name": "黄色",
		"value": "yellow"
	},
	{
		"name": "绿色",
		"value": "green"
	},
	{
		"name": "蓝色",
		"value": "blue"
	},
	{
		"name": "紫色",
		"value": "purple"
	},
	{
		"name": "粉红色",
		"value": "pink"
	},
	{
		"name": "红色",
		"value": "red"
	},
	{
		"name": "灰色背景",
		"value": "gray_background"
	},
	{
		"name": "棕色背景",
		"value": "brown_background"
	},
	{
		"name": "橙色背景",
		"value": "orange_background"
	},
	{
		"name": "黄色背景",
		"value": "yellow_background"
	},
	{
		"name": "绿色背景",
		"value": "green_background"
	},
	{
		"name": "蓝色背景",
		"value": "blue_background"
	},
	{
		"name": "紫色背景",
		"value": "purple_background"
	},
	{
		"name": "粉红色背景",
		"value": "pink_background"
	},
	{
		"name": "红色背景",
		"value": "red_background"
	}
]


const annotation: INodeProperties[] = [
	{
		"displayName": "注释",
		"name": "annotationUi",
		"type": "collection",
		"placeholder": "添加注释",
		"default": {},
		options: [
			{
				"displayName": "加粗",
				"name": "bold",
				"type": "boolean",
				"default": false,
				"description": "文本是否加粗"
			},
			{
				"displayName": "斜体",
				"name": "italic",
				"type": "boolean",
				"default": false,
				"description": "文本是否斜体"
			},
			{
				"displayName": "删除线",
				"name": "strikethrough",
				"type": "boolean",
				"default": false,
				"description": "文本是否带删除线"
			},
			{
				"displayName": "下划线",
				"name": "underline",
				"type": "boolean",
				"default": false,
				"description": "文本是否带下划线"
			},
			{
				"displayName": "代码",
				"name": "code",
				"type": "boolean",
				"default": false,
				"description": "文本是否为代码样式"
			},
			{
				displayName: '颜色',
				name: 'color',
				type: 'options',
				options: colors,
				default: '',
				description: '文字颜色',
			},
		],
		description: '适用于此富文本的所有注释。',
	},
];

const typeMention: INodeProperties[] = [
	{
		"displayName": "类型",
		"name": "mentionType",
		"type": "options",
		"displayOptions": {
			"show": {
				"textType": ["mention"]
			}
		},
		"options": [
			{
				"name": "数据库",
				"value": "database"
			},
			{
				"name": "日期",
				"value": "date"
			},
			{
				"name": "页面",
				"value": "page"
			},
			{
				"name": "用户",
				"value": "user"
			}
		],
		"default": "",
		"description": "用户、页面、数据库或日期的内联提及。在应用程序中，这些是通过输入 @ 后跟用户、页面、数据库或日期的名称创建的。"
	},
	{
		"displayName": "用户名或ID",
		"name": "user",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getUsers"
		},
		"displayOptions": {
			"show": {
				"mentionType": ["user"]
			}
		},
		"default": "",
		"description": "被提及的用户的ID。从列表中选择，或使用表达式指定一个ID。"
	},
	{
		"displayName": "页面ID",
		"name": "page",
		"type": "string",
		"displayOptions": {
			"show": {
				"mentionType": ["page"]
			}
		},
		"default": "",
		"description": "被提及页面的ID"
	},
	{
		"displayName": "数据库",
		"name": "database",
		"type": "resourceLocator",
		"default": {
			"mode": "list",
			"value": ""
		},
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
							"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \t]*",
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
				"mentionType": ["database"]
			}
		},
		"description": "被提及的 Notion 数据库"
	},

	{
		"displayName": "范围",
		"name": "range",
		"displayOptions": {
			"show": {
				"mentionType": ["date"]
			}
		},
		"type": "boolean",
		"default": false,
		"description": "是否要定义日期范围"
	},
	{
		"displayName": "日期",
		"name": "date",
		"displayOptions": {
			"show": {
				"mentionType": ["date"],
				"range": [false]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601格式的日期，可选时间"
	},
	{
		"displayName": "开始日期",
		"name": "dateStart",
		"displayOptions": {
			"show": {
				"mentionType": ["date"],
				"range": [true]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601格式的日期，可选时间"
	},
	{
		"displayName": "结束日期",
		"name": "dateEnd",
		"displayOptions": {
			"show": {
				"range": [true],
				"mentionType": ["date"]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601格式的日期，可选时间。表示日期范围的结束日期。"
	}
];

const typeEquation: INodeProperties[] = [
	{
		"displayName": "表达式",
		"name": "expression",
		"type": "string",
		"displayOptions": {
			"show": {
				"textType": ["equation"]
			}
		},
		"default": ""
	}

];

const typeText: INodeProperties[] = [
	{
		"displayName": "文本",
		"name": "text",
		"displayOptions": {
			"show": {
				"textType": ["text"]
			}
		},
		"type": "string",
		"default": "",
		"description": "文本内容。此字段包含文本的实际内容，可能是您最常使用的字段之一。"
	},
	{
		"displayName": "是否为链接",
		"name": "isLink",
		"displayOptions": {
			"show": {
				"textType": ["text"]
			}
		},
		"type": "boolean",
		"default": false
	},
	{
		"displayName": "文本链接",
		"name": "textLink",
		"displayOptions": {
			"show": {
				"textType": ["text"],
				"isLink": [true]
			}
		},
		"type": "string",
		"default": "",
		"description": "此链接指向的URL"
	}

];

export const text = (displayOptions: IDisplayOptions): INodeProperties[] =>
	[
		{
			"displayName": "文本",
			"name": "text",
			"placeholder": "添加文本",
			"type": "fixedCollection",
			"default": {},
			"typeOptions": {
				"multipleValues": true
			},
			displayOptions,
			options: [
				{
					name: 'text',
					displayName: '文本',
					values: [
						{
							displayName: '类型',
							name: 'textType',
							type: 'options',
							options: [
								{
									name: '公式',
									value: 'equation',
								},
								{
									name: 'Mention',
									value: 'mention',
								},
								{
									name: 'Text',
									value: 'text',
								},
							],
							default: 'text',
						},
						...typeText,
						...typeMention,
						...typeEquation,

						...annotation,
					],
				},
			],
			description: '块中的丰富文本',
		},
	] as INodeProperties[];

const todo = (type: string): INodeProperties[] =>
	[
		{
			displayName: '已检查',
			name: 'checked',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: {
					type: [type],
				},
			},
			description: '是否检查待办事项',
		},
	] as INodeProperties[];

const title = (type: string): INodeProperties[] =>
	[
		{
			displayName: '标题',
			name: 'title',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					type: [type],
				},
			},
			description: '页面标题的纯文本',
		},
	] as INodeProperties[];

const richText = (displayOptions: IDisplayOptions): INodeProperties[] => [
	{
		displayName: '富文本',
		name: 'richText',
		type: 'boolean',
		displayOptions,
		default: false,
	},
];

const textContent = (displayOptions: IDisplayOptions): INodeProperties[] => [
	{
		displayName: '文本',
		name: 'textContent',
		type: 'string',
		displayOptions,
		default: '',
	},
];

const imageBlock = (type: string): INodeProperties[] => [
	{
		displayName: 'Image URL',
		name: 'url',
		type: 'string',
		displayOptions: {
			show: {
				type: [type],
			},
		},
		default: '',
		description: 'Image file reference',
	},
];

const block = (blockType: string): INodeProperties[] => {
	const data: INodeProperties[] = [];
	switch (blockType) {
		case 'to_do':
			data.push(...todo(blockType));
			data.push(
				...richText({
					show: {
						type: [blockType],
					},
				}),
			);
			data.push(
				...textContent({
					show: {
						type: [blockType],
						richText: [false],
					},
				}),
			);
			data.push(
				...text({
					show: {
						type: [blockType],
						richText: [true],
					},
				}),
			);
			break;
		case 'child_page':
			data.push(...title(blockType));
			break;
		case 'image':
			data.push(...imageBlock(blockType));
			break;
		default:
			data.push(
				...richText({
					show: {
						type: [blockType],
					},
				}),
			);
			data.push(
				...textContent({
					show: {
						type: [blockType],
						richText: [false],
					},
				}),
			);
			data.push(
				...text({
					show: {
						type: [blockType],
						richText: [true],
					},
				}),
			);
			break;
	}
	return data;
};

export const blocks = (resource: string, operation: string): INodeProperties[] => [
	{
		displayName: '块',
		name: 'blockUi',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: [resource],
				operation: [operation],
			},
		},
		placeholder: '新增 Block',
		options: [
			{
				name: 'blockValues',
				displayName: 'Block',
				values: [
					{
						"displayName": "类型名称或 ID",
						"name": "type",
						"type": "options",
						"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定 ID",
						"typeOptions": {
							"loadOptionsMethod": "getBlockTypes"
						},
						"default": "paragraph"
					},
					...block('paragraph'),
					...block('heading_1'),
					...block('heading_2'),
					...block('heading_3'),
					...block('toggle'),
					...block('to_do'),
					...block('child_page'),
					...block('bulleted_list_item'),
					...block('numbered_list_item'),
					...block('image'),
				],
			},
		],
	},
];
