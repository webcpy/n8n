import type { INodeProperties } from 'n8n-workflow';

export const pageOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
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
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个页面",
				"action": "获取多个页面"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新页面",
				"action": "更新页面"
			}
		],
		"default": "create"
	}

];

export const pageFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                page:create                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"description": "页面的标题"
	},
	{
		"displayName": "其他字段",
		"name": "additionalFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["create"]
			}
		},
		"options": [
			{
				"displayName": "作者名称或ID",
				"name": "authorId",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getAuthors"
				},
				"default": "",
				"description": "对象的作者的ID。从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "父级ID",
				"name": "parent",
				"type": "number",
				"default": "",
				"description": "帖子的父级的ID"
			},
			{
				"displayName": "内容",
				"name": "content",
				"type": "string",
				"default": "",
				"description": "页面的内容"
			},
			{
				"displayName": "Slug",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "对象类型唯一的字母数字标识符"
			},
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "用于保护内容和摘录访问的密码"
			},
			{
				"displayName": "状态",
				"name": "status",
				"type": "options",
				"options": [
					{
						"name": "草稿",
						"value": "draft"
					},
					{
						"name": "未来",
						"value": "future"
					},
					{
						"name": "待定",
						"value": "pending"
					},
					{
						"name": "私密",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "draft",
				"description": "页面的命名状态"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "评论是否在页面上开启"
			},
			{
				"displayName": "Ping状态",
				"name": "pingStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "是否应发送消息以公布页面"
			},
			{
				"displayName": "模板",
				"name": "pageTemplate",
				"type": "fixedCollection",
				"default": {},
				"typeOptions": {
					"multipleValues": false
				},
				"options": [
					{
						"displayName": "值",
						"name": "values",
						"values": [
							{
								"displayName": "Elementor模板",
								"name": "elementor",
								"type": "boolean",
								"default": true,
								"description": "网站是否使用elementor页面构建器"
							},
							{
								"displayName": "模板",
								"name": "template",
								"type": "string",
								"default": "",
								"description": "要使用的主题文件",
								"displayOptions": {
									"show": {
										"elementor": [false]
									}
								}
							},
							{
								"displayName": "模板",
								"name": "template",
								"type": "options",
								"options": [
									{
										"name": "标准",
										"value": ""
									},
									{
										"name": "Elementor画布",
										"value": "elementor_canvas"
									},
									{
										"name": "Elementor页眉页脚",
										"value": "elementor_header_footer"
									},
									{
										"name": "Elementor主题",
										"value": "elementor_theme"
									}
								],
								"default": "",
								"description": "要使用的Elementor模板",
								"displayOptions": {
									"show": {
										"elementor": [true]
									}
								}
							}
						]
					}
				]
			},
			{
				"displayName": "菜单顺序",
				"name": "menuOrder",
				"type": "number",
				"default": 0,
				"description": "页面相对于其他页面的顺序"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "评论是否在页面上开启"
			},
			{
				"displayName": "特色媒体ID",
				"name": "featuredMediaId",
				"type": "number",
				"default": "",
				"description": "页面的特色媒体的ID"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 page:update                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "页面ID",
		"name": "pageId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["update"]
			}
		},
		"description": "对象的唯一标识符"
	},
	{
		"displayName": "更新字段",
		"name": "updateFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["update"]
			}
		},
		"options": [
			{
				"displayName": "作者名称或ID",
				"name": "authorId",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getAuthors"
				},
				"default": "",
				"description": "对象的作者的ID。从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "父级ID",
				"name": "parent",
				"type": "number",
				"default": "",
				"description": "帖子的父级的ID"
			},
			{
				"displayName": "标题",
				"name": "title",
				"type": "string",
				"default": "",
				"description": "页面的标题"
			},
			{
				"displayName": "内容",
				"name": "content",
				"type": "string",
				"default": "",
				"description": "页面的内容"
			},
			{
				"displayName": "Slug",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "对象类型唯一的字母数字标识符"
			},
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "用于保护内容和摘录访问的密码"
			},
			{
				"displayName": "状态",
				"name": "status",
				"type": "options",
				"options": [
					{
						"name": "草稿",
						"value": "draft"
					},
					{
						"name": "未来",
						"value": "future"
					},
					{
						"name": "待定",
						"value": "pending"
					},
					{
						"name": "私密",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "draft",
				"description": "页面的命名状态"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "评论是否在页面上开启"
			},
			{
				"displayName": "Ping状态",
				"name": "pingStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "评论是否在页面上开启"
			},
			{
				"displayName": "模板",
				"name": "pageTemplate",
				"type": "fixedCollection",
				"default": {},
				"typeOptions": {
					"multipleValues": false
				},
				"options": [
					{
						"displayName": "值",
						"name": "values",
						"values": [
							{
								"displayName": "Elementor模板",
								"name": "elementor",
								"type": "boolean",
								"default": true,
								"description": "网站是否使用elementor页面构建器"
							},
							{
								"displayName": "模板",
								"name": "template",
								"type": "string",
								"default": "",
								"description": "要使用的主题文件",
								"displayOptions": {
									"show": {
										"elementor": [false]
									}
								}
							},
							{
								"displayName": "模板",
								"name": "template",
								"type": "options",
								"options": [
									{
										"name": "标准",
										"value": ""
									},
									{
										"name": "Elementor画布",
										"value": "elementor_canvas"
									},
									{
										"name": "Elementor页眉页脚",
										"value": "elementor_header_footer"
									},
									{
										"name": "Elementor主题",
										"value": "elementor_theme"
									}
								],
								"default": "",
								"description": "要使用的Elementor模板",
								"displayOptions": {
									"show": {
										"elementor": [true]
									}
								}
							}
						]
					}
				]
			},
			{
				"displayName": "菜单顺序",
				"name": "menuOrder",
				"type": "number",
				"default": 0,
				"description": "页面相对于其他页面的顺序"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开启",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "评论是否在页面上开启"
			},
			{
				"displayName": "特色媒体ID",
				"name": "featuredMediaId",
				"type": "number",
				"default": "",
				"description": "页面的特色媒体的ID"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                  page:get                                  */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "页面ID",
		"name": "pageId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["get"]
			}
		},
		"description": "对象的唯一标识符"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["get"]
			}
		},
		"options": [
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "如果页面受密码保护，则为页面的密码"
			},
			{
				"displayName": "上下文",
				"name": "context",
				"type": "options",
				"options": [
					{
						"name": "查看",
						"value": "view"
					},
					{
						"name": "嵌入",
						"value": "embed"
					},
					{
						"name": "编辑",
						"value": "edit"
					}
				],
				"default": "view",
				"description": "请求所在的范围；确定响应中存在的字段"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                   page:getAll                              */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果，还是只返回给定限制数量的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["getAll"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 10
		},
		"default": 5,
		"description": "要返回的结果的最大数量"
	},


	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["getAll"]
			}
		},
		"options": [
			{
				"displayName": "之后",
				"name": "after",
				"type": "dateTime",
				"default": "",
				"description": "限制响应为在给定的ISO8601兼容日期之后发布的页面"
			},
			{
				"displayName": "作者名称或ID",
				"name": "author",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getAuthors"
				},
				"description": "将结果集限制为分配给特定作者的页面。 从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "之前",
				"name": "before",
				"type": "dateTime",
				"default": "",
				"description": "限制响应为在给定的ISO8601兼容日期之前发布的页面"
			},
			{
				"displayName": "上下文",
				"name": "context",
				"type": "options",
				"options": [
					{
						"name": "视图",
						"value": "view"
					},
					{
						"name": "嵌入",
						"value": "embed"
					},
					{
						"name": "编辑",
						"value": "edit"
					}
				],
				"default": "view",
				"description": "发出请求的范围; 确定响应中存在的字段"
			},
			{
				"displayName": "菜单顺序",
				"name": "menuOrder",
				"type": "number",
				"default": 0,
				"description": "将结果集限制为具有特定菜单顺序值的项目"
			},
			{
				"displayName": "顺序",
				"name": "order",
				"type": "options",
				"options": [
					{
						"name": "升序",
						"value": "asc"
					},
					{
						"name": "降序",
						"value": "desc"
					}
				],
				"default": "desc",
				"description": "按升序或降序排序属性"
			},
			{
				"displayName": "按排序方式",
				"name": "orderBy",
				"type": "options",
				"options": [
					{
						"name": "作者",
						"value": "author"
					},
					{
						"name": "日期",
						"value": "date"
					},
					{
						"name": "ID",
						"value": "id"
					},
					{
						"name": "包括",
						"value": "include"
					},
					{
						"name": "包括缩略图",
						"value": "include_slugs"
					},
					{
						"name": "修改",
						"value": "modified"
					},
					{
						"name": "父级",
						"value": "parent"
					},
					{
						"name": "相关性",
						"value": "relevance"
					},
					{
						"name": "短标题",
						"value": "slug"
					},
					{
						"name": "标题",
						"value": "title"
					}
				],
				"default": "id",
				"description": "按对象属性排序集合"
			},
			{
				"displayName": "页面",
				"name": "page",
				"type": "number",
				"default": 1,
				"description": "集合的当前页面"
			},
			{
				"displayName": "父页面ID",
				"name": "parent",
				"type": "number",
				"default": "",
				"description": "将结果集限制为具有特定父页面ID的项目"
			},
			{
				"displayName": "搜索",
				"name": "search",
				"type": "string",
				"default": "",
				"description": "将结果限制为与字符串匹配的页面"
			},
			{
				"displayName": "状态",
				"name": "status",
				"type": "options",
				"options": [
					{
						"name": "草稿",
						"value": "draft"
					},
					{
						"name": "未来",
						"value": "future"
					},
					{
						"name": "挂起",
						"value": "pending"
					},
					{
						"name": "私人",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "publish",
				"description": "页面的状态"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 page:delete                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "Page ID",
		"name": "pageId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["delete"]
			}
		},
		"description": "对象的唯一标识符"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["page"],
				"operation": ["delete"]
			}
		},
		"options": [
			{
				"displayName": "强制",
				"name": "force",
				"type": "boolean",
				"default": false,
				"description": "是否绕过回收站并强制删除"
			}
		]
	}

];
