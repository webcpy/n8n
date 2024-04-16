import type { INodeProperties } from 'n8n-workflow';

export const postOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["post"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "创建一个帖子",
				"action": "创建一个帖子"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取一个帖子",
				"action": "获取一个帖子"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个帖子",
				"action": "获取多个帖子"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新一个帖子",
				"action": "更新一个帖子"
			}
		],
		"default": "create"
	}

];

export const postFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                post:create                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["post"],
				"operation": ["create"]
			}
		},
		"description": "帖子的标题"
	},
	{
		"displayName": "附加字段",
		"name": "additionalFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["post"],
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
				"description": "对象的作者的ID。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "内容",
				"name": "content",
				"type": "string",
				"default": "",
				"description": "帖子的内容"
			},
			{
				"displayName": "Slug",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "对象类型的唯一标识符的字母数字标识符"
			},
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "保护内容和摘录访问权限的密码"
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
						"name": "私有",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "draft",
				"description": "帖子的命名状态"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开放",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "帖子上是否开放评论"
			},
			{
				"displayName": "Ping 状态",
				"name": "pingStatus",
				"type": "options",
				"options": [
					{
						"name": "开放",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "是否应发送消息以通知帖子"
			},
			{
				"displayName": "格式",
				"name": "format",
				"type": "options",
				"options": [
					{
						"name": "旁白",
						"value": "aside"
					},
					{
						"name": "音频",
						"value": "audio"
					},
					{
						"name": "聊天",
						"value": "chat"
					},
					{
						"name": "画廊",
						"value": "gallery"
					},
					{
						"name": "图像",
						"value": "image"
					},
					{
						"name": "链接",
						"value": "link"
					},
					{
						"name": "引用",
						"value": "quote"
					},
					{
						"name": "标准",
						"value": "standard"
					},
					{
						"name": "状态",
						"value": "status"
					},
					{
						"name": "视频",
						"value": "video"
					}
				],
				"default": "standard",
				"description": "帖子的格式"
			},
			{
				"displayName": "置顶",
				"name": "sticky",
				"type": "boolean",
				"default": false,
				"description": "对象是否应视为置顶"
			},
			{
				"displayName": "类别名称或ID",
				"name": "categories",
				"type": "multiOptions",
				"typeOptions": {
					"loadOptionsMethod": "getCategories"
				},
				"default": [],
				"description": "分配给类别分类法中对象的术语。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "标签名称或ID",
				"name": "tags",
				"type": "multiOptions",
				"typeOptions": {
					"loadOptionsMethod": "getTags"
				},
				"default": [],
				"description": "分配给 post_tag 分类法中对象的术语。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "模板",
				"name": "postTemplate",
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
								"displayName": "Elementor 模板",
								"name": "elementor",
								"type": "boolean",
								"default": true,
								"description": "网站是否使用 Elementor 页面构建器"
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
										"name": "Elementor 画布",
										"value": "elementor_canvas"
									},
									{
										"name": "Elementor 页眉页脚",
										"value": "elementor_header_footer"
									},
									{
										"name": "Elementor 主题",
										"value": "elementor_theme"
									}
								],
								"default": "",
								"description": "要使用的 Elementor 模板",
								"displayOptions": {
									"show": {
										"elementor": [true]
									}
								}
							}
						]
					}
				]
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 post:update                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "帖子ID",
		"name": "postId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["post"],
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
				"resource": ["post"],
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
				"description": "对象的作者的ID。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "标题",
				"name": "title",
				"type": "string",
				"default": "",
				"description": "帖子的标题"
			},
			{
				"displayName": "内容",
				"name": "content",
				"type": "string",
				"default": "",
				"description": "帖子的内容"
			},
			{
				"displayName": "Slug",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "对象类型的唯一标识符的字母数字标识符"
			},
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "保护内容和摘录访问权限的密码"
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
						"name": "私有",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "draft",
				"description": "帖子的命名状态"
			},
			{
				"displayName": "评论状态",
				"name": "commentStatus",
				"type": "options",
				"options": [
					{
						"name": "开放",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "帖子上是否开放评论"
			},
			{
				"displayName": "Ping 状态",
				"name": "pingStatus",
				"type": "options",
				"options": [
					{
						"name": "开放",
						"value": "open"
					},
					{
						"name": "关闭",
						"value": "closed"
					}
				],
				"default": "open",
				"description": "帖子上是否开放评论"
			},
			{
				"displayName": "格式",
				"name": "format",
				"type": "options",
				"options": [
					{
						"name": "旁白",
						"value": "aside"
					},
					{
						"name": "音频",
						"value": "audio"
					},
					{
						"name": "聊天",
						"value": "chat"
					},
					{
						"name": "画廊",
						"value": "gallery"
					},
					{
						"name": "图像",
						"value": "image"
					},
					{
						"name": "链接",
						"value": "link"
					},
					{
						"name": "引用",
						"value": "quote"
					},
					{
						"name": "标准",
						"value": "standard"
					},
					{
						"name": "状态",
						"value": "status"
					},
					{
						"name": "视频",
						"value": "video"
					}
				],
				"default": "standard",
				"description": "帖子的格式"
			},
			{
				"displayName": "置顶",
				"name": "sticky",
				"type": "boolean",
				"default": false,
				"description": "对象是否应视为置顶"
			},
			{
				"displayName": "类别名称或ID",
				"name": "categories",
				"type": "multiOptions",
				"typeOptions": {
					"loadOptionsMethod": "getCategories"
				},
				"default": [],
				"description": "分配给类别分类法中对象的术语。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "标签名称或ID",
				"name": "tags",
				"type": "multiOptions",
				"typeOptions": {
					"loadOptionsMethod": "getTags"
				},
				"default": [],
				"description": "分配给 post_tag 分类法中对象的术语。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "模板",
				"name": "postTemplate",
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
								"displayName": "Elementor 模板",
								"name": "elementor",
								"type": "boolean",
								"default": true,
								"description": "网站是否使用 Elementor 页面构建器"
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
										"name": "Elementor 画布",
										"value": "elementor_canvas"
									},
									{
										"name": "Elementor 页眉页脚",
										"value": "elementor_header_footer"
									},
									{
										"name": "Elementor 主题",
										"value": "elementor_theme"
									}
								],
								"default": "",
								"description": "要使用的 Elementor 模板",
								"displayOptions": {
									"show": {
										"elementor": [true]
									}
								}
							}
						]
					}
				]
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                  post:get                                  */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "帖子ID",
		"name": "postId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["post"],
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
				"resource": ["post"],
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
				"description": "如果帖子受密码保护，则为帖子的密码"
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
	/*                                   post:getAll                              */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["post"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制数"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["post"],
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
				"resource": ["post"],
				"operation": ["getAll"]
			}
		},
		"options": [
			{
				"displayName": "后置",
				"name": "after",
				"type": "dateTime",
				"default": "",
				"description": "限制响应为发布于给定ISO8601兼容日期之后的帖子"
			},
			{
				"displayName": "作者名称或ID",
				"name": "author",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getAuthors"
				},
				"description": "限制结果集为分配给特定作者的帖子。 从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "前置",
				"name": "before",
				"type": "dateTime",
				"default": "",
				"description": "限制响应为发布于给定ISO8601兼容日期之前的帖子"
			},
			{
				"displayName": "分类名称或ID",
				"name": "categories",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getCategories"
				},
				"description": "限制结果集为在分类法中指定术语分配的所有项目。 从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
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
				"description": "发出请求的范围；确定响应中存在的字段"
			},
			{
				"displayName": "排除分类",
				"name": "excludedCategories",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getCategories"
				},
				"description": "限制结果集为除了在分类法中指定术语分配的项目之外的所有项目。 从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "排除标签",
				"name": "excludedTags",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getTags"
				},
				"description": "限制结果集为除了在标签法中指定术语分配的项目之外的所有项目。 从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "排序",
				"name": "order",
				"type": "options",
				"options": [
					{
						"name": "ASC",
						"value": "asc"
					},
					{
						"name": "DESC",
						"value": "desc"
					}
				],
				"default": "desc",
				"description": "按对象属性升序或降序排序集合"
			},
			{
				"displayName": "排序依据",
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
						"name": "包括斜杠",
						"value": "include_slugs"
					},
					{
						"name": "修改",
						"value": "modified"
					},
					{
						"name": "父项",
						"value": "parent"
					},
					{
						"name": "相关性",
						"value": "relevance"
					},
					{
						"name": "斜杠",
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
				"displayName": "搜索",
				"name": "search",
				"type": "string",
				"default": "",
				"description": "将结果限制为与字符串匹配的结果"
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
						"name": "将来",
						"value": "future"
					},
					{
						"name": "待定",
						"value": "pending"
					},
					{
						"name": "私有",
						"value": "private"
					},
					{
						"name": "发布",
						"value": "publish"
					}
				],
				"default": "publish",
				"description": "帖子的状态"
			},
			{
				"displayName": "置顶",
				"name": "sticky",
				"type": "boolean",
				"default": false,
				"description": "是否限制结果集为置顶项目"
			},
			{
				"displayName": "标签名称或ID",
				"name": "tags",
				"type": "multiOptions",
				"default": [],
				"typeOptions": {
					"loadOptionsMethod": "getTags"
				},
				"description": "限制结果集为在标签法中指定术语分配的所有项目。 从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 post:delete                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "帖子ID",
		"name": "postId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["post"],
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
				"resource": ["post"],
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
