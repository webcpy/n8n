import type { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["user"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "创建用户",
				"action": "创建用户"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取用户",
				"action": "获取用户"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "获取多个用户",
				"action": "获取多个用户"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新用户",
				"action": "更新用户"
			}
		],
		"default": "create"
	}
];

export const userFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                user:create                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "用户名",
		"name": "username",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的登录名"
	},
	{
		"displayName": "名称",
		"name": "name",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的显示名称"
	},
	{
		"displayName": "名",
		"name": "firstName",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的名字"
	},
	{
		"displayName": "姓",
		"name": "lastName",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的姓氏"
	},
	{
		"displayName": "邮箱",
		"name": "email",
		"type": "string",
		"placeholder": "name@email.com",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的电子邮箱地址"
	},
	{
		"displayName": "密码",
		"name": "password",
		"type": "string",
		"typeOptions": {
			"password": true
		},
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"description": "用户的密码（永远不会包含在内）"
	},
	{
		"displayName": "附加字段",
		"name": "additionalFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["create"]
			}
		},
		"options": [
			{
				"displayName": "网址",
				"name": "url",
				"type": "string",
				"default": "",
				"description": "用户的网址"
			},
			{
				"displayName": "描述",
				"name": "description",
				"type": "string",
				"default": "",
				"description": "用户的描述"
			},
			{
				"displayName": "昵称",
				"name": "nickname",
				"type": "string",
				"default": "",
				"description": "用户的昵称"
			},
			{
				"displayName": "标识",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "用户的字母数字标识符"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 user:update                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "用户 ID",
		"name": "userId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["update"]
			}
		},
		"description": "用户的唯一标识符"
	},
	{
		"displayName": "更新字段",
		"name": "updateFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["update"]
			}
		},
		"options": [
			{
				"displayName": "用户名",
				"name": "username",
				"type": "string",
				"default": "",
				"description": "用户的登录名"
			},
			{
				"displayName": "名称",
				"name": "name",
				"type": "string",
				"default": "",
				"description": "用户的显示名称"
			},
			{
				"displayName": "名",
				"name": "firstName",
				"type": "string",
				"default": "",
				"description": "用户的名字"
			},
			{
				"displayName": "姓",
				"name": "lastName",
				"type": "string",
				"default": "",
				"description": "用户的姓氏"
			},
			{
				"displayName": "邮箱",
				"name": "email",
				"type": "string",
				"placeholder": "name@email.com",
				"default": "",
				"description": "用户的电子邮箱地址"
			},
			{
				"displayName": "密码",
				"name": "password",
				"type": "string",
				"typeOptions": {
					"password": true
				},
				"default": "",
				"description": "用户的密码（永远不会包含在内）"
			},
			{
				"displayName": "网址",
				"name": "url",
				"type": "string",
				"default": "",
				"description": "用户的网址"
			},
			{
				"displayName": "描述",
				"name": "description",
				"type": "string",
				"default": "",
				"description": "用户的描述"
			},
			{
				"displayName": "昵称",
				"name": "nickname",
				"type": "string",
				"default": "",
				"description": "用户的昵称"
			},
			{
				"displayName": "标识",
				"name": "slug",
				"type": "string",
				"default": "",
				"description": "用户的字母数字标识符"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 user:get                                   */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "用户 ID",
		"name": "userId",
		"type": "string",
		"required": true,
		"default": "",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["get"]
			}
		},
		"description": "用户的唯一标识符"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["get"]
			}
		},
		"options": [
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
				"description": "请求所在的范围；确定响应中存在的字段"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 user:getAll                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "是否返回所有结果",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"resource": ["user"],
				"operation": ["getAll"]
			}
		},
		"default": false,
		"description": "是否返回所有结果，还是仅返回一定数量的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"resource": ["user"],
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
				"resource": ["user"],
				"operation": ["getAll"]
			}
		},
		"options": [
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
			},
			{
				"displayName": "排序方式",
				"name": "orderBy",
				"type": "options",
				"options": [
					{
						"name": "电子邮件",
						"value": "email"
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
						"name": "包括标识",
						"value": "include_slugs"
					},
					{
						"name": "名称",
						"value": "name"
					},
					{
						"name": "注册日期",
						"value": "registered_date"
					},
					{
						"name": "标识",
						"value": "slug"
					},
					{
						"name": "URL",
						"value": "url"
					}
				],
				"default": "id",
				"description": "按对象属性排序集合"
			},
			{
				"displayName": "排序顺序",
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
				"description": "按升序或降序排序"
			},
			{
				"displayName": "搜索",
				"name": "search",
				"type": "string",
				"default": "",
				"description": "限制结果匹配的字符串"
			},
			{
				"displayName": "用户类型",
				"name": "who",
				"type": "options",
				"options": [
					{
						"name": "作者",
						"value": "authors"
					}
				],
				"default": "authors",
				"description": "限制结果集为被认为是作者的用户"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 user:delete                                */
	/* -------------------------------------------------------------------------- */
	{
		displayName: '重新分配',
		name: 'reassign',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['user'],
				operation: ['delete'],
			},
		},
		description: "将已删除用户的帖子和链接重新分配给该用户 ID",
	},
];
