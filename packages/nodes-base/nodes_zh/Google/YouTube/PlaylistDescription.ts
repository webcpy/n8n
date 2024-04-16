import type { INodeProperties } from 'n8n-workflow';

export const playlistOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["playlist"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"description": "创建播放列表",
				"action": "创建播放列表"
			},
			{
				"name": "删除",
				"value": "delete",
				"description": "删除播放列表",
				"action": "删除播放列表"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取播放列表",
				"action": "获取播放列表"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "检索多个播放列表",
				"action": "获取多个播放列表"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新播放列表",
				"action": "更新播放列表"
			}
		],
		"default": "getAll"
	}
];

export const playlistFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 playlist:create                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["create"],
				"resource": ["playlist"]
			}
		},
		"default": "",
		"description": "播放列表的标题"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["create"],
				"resource": ["playlist"]
			}
		},
		"options": [
			{
				"displayName": "描述",
				"name": "description",
				"type": "string",
				"default": "",
				"description": "播放列表的描述"
			},
			{
				"displayName": "隐私状态",
				"name": "privacyStatus",
				"type": "options",
				"options": [
					{
						"name": "私有",
						"value": "private"
					},
					{
						"name": "公开",
						"value": "public"
					},
					{
						"name": "未列出",
						"value": "unlisted"
					}
				],
				"default": "",
				"description": "播放列表的隐私状态"
			},
			{
				"displayName": "标签",
				"name": "tags",
				"type": "string",
				"default": "",
				"description": "与播放列表关联的关键字标签。多个标签可以用逗号分隔定义。"
			},
			{
				"displayName": "默认语言名称或ID",
				"name": "defaultLanguage",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getLanguages"
				},
				"default": "",
				"description": "播放列表资源的标题和描述属性中的文本语言。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "代表内容所有者的频道",
				"name": "onBehalfOfContentOwnerChannel",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwnerChannel参数指定要将视频添加到的YouTube频道的频道ID。当请求指定onBehalfOfContentOwner参数的值时，此参数是必需的，并且只能与该参数一起使用。"
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数表示请求的授权凭据标识出一个YouTube CMS用户，该用户代表参数值中指定的内容所有者执行操作。"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 playlist:get                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "播放列表ID",
		"name": "playlistId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlist"]
			}
		},
		"default": "",
		"description": "播放列表的ID"
	},
	{
		"displayName": "字段",
		"name": "part",
		"type": "multiOptions",
		"options": [
			{
				"name": "*",
				"value": "*"
			},
			{
				"name": "内容详情",
				"value": "contentDetails"
			},
			{
				"name": "ID",
				"value": "id"
			},
			{
				"name": "本地化",
				"value": "localizations"
			},
			{
				"name": "播放器",
				"value": "player"
			},
			{
				"name": "片段",
				"value": "snippet"
			},
			{
				"name": "状态",
				"value": "status"
			}
		],
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlist"]
			}
		},
		"description": "字段参数指定API响应中将包含的一个或多个播放列表资源属性的逗号分隔列表",
		"default": ["*"]
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlist"]
			}
		},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数表示请求的授权凭据标识出一个YouTube CMS用户，该用户代表参数值中指定的内容所有者执行操作。"
			},
			{
				"displayName": "代表内容所有者的频道",
				"name": "onBehalfOfContentOwnerChannel",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwnerChannel参数指定要将视频添加到的YouTube频道的频道ID。"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 playlist:delete                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "播放列表ID",
		"name": "playlistId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["delete"],
				"resource": ["playlist"]
			}
		},
		"default": "",
		"description": "播放列表的ID"
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["delete"],
				"resource": ["playlist"]
			}
		},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数表示请求的授权凭据标识出一个YouTube CMS用户，该用户代表参数值中指定的内容所有者执行操作。"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 playlist:getAll                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlist"]
			}
		},
		"displayName": "字段",
		"name": "part",
		"type": "multiOptions",
		"options": [
			{
				"name": "*",
				"value": "*"
			},
			{
				"name": "内容详情",
				"value": "contentDetails"
			},
			{
				"name": "ID",
				"value": "id"
			},
			{
				"name": "本地化",
				"value": "localizations"
			},
			{
				"name": "播放器",
				"value": "player"
			},
			{
				"name": "片段",
				"value": "snippet"
			},
			{
				"name": "状态",
				"value": "status"
			}
		],
		"description": "fields参数指定了API响应中将包含的一个或多个播放列表资源属性的逗号分隔列表",
		"default": [
			"*"
		],
		"required": true
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlist"]
			}
		},
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"default": false,
		"description": "是否返回所有结果或仅限于给定的限制"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlist"],
				"returnAll": [false]
			}
		},
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"typeOptions": {
			"minValue": 1,
			"maxValue": 50
		},
		"default": 25,
		"description": "要返回的最大结果数"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlist"]
			}
		},
		"displayName": "过滤器",
		"name": "filters",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "频道ID",
				"name": "channelId",
				"type": "string",
				"default": "",
				"description": "此值指示API仅返回指定频道的播放列表"
			},
			{
				"displayName": "ID",
				"name": "id",
				"type": "string",
				"default": "",
				"description": "ID参数指定了正在检索的资源的一个或多个YouTube播放列表ID(s)的逗号分隔列表。在播放列表资源中，ID属性指定了播放列表的YouTube播放列表ID。"
			}
		]
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlist"]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "代表内容所有者频道",
				"name": "onBehalfOfContentOwnerChannel",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwnerChannel参数指定要向其添加视频的频道的YouTube频道ID。当请求指定了onBehalfOfContentOwner参数的值时，此参数是必需的，并且只能与该参数一起使用。"
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数表示请求的授权凭据标识出一个YouTube CMS用户，该用户代表参数值中指定的内容所有者执行操作。"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 playlist:update                            */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["playlist"]
			}
		},
		"displayName": "播放列表ID",
		"name": "playlistId",
		"type": "string",
		"required": true,
		"default": "",
		"description": "播放列表的标题"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["playlist"]
			}
		},
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"default": "",
		"description": "播放列表的标题"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["playlist"]
			}
		},
		"displayName": "更新字段",
		"name": "updateFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"options": [
			{
				"displayName": "默认语言名称或ID",
				"name": "defaultLanguage",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getLanguages"
				},
				"default": "",
				"description": "播放列表资源标题和描述属性中的文本的语言。从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。"
			},
			{
				"displayName": "描述",
				"name": "description",
				"type": "string",
				"default": "",
				"description": "播放列表的描述"
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数表示请求的授权凭据标识出一个YouTube CMS用户，该用户代表参数值中指定的内容所有者执行操作。"
			},
			{
				"displayName": "隐私状态",
				"name": "privacyStatus",
				"type": "options",
				"options": [
					{
						"name": "私有",
						"value": "private"
					},
					{
						"name": "公开",
						"value": "public"
					},
					{
						"name": "未列出",
						"value": "unlisted"
					}
				],
				"default": "",
				"description": "播放列表的隐私状态"
			},
			{
				"displayName": "标签",
				"name": "tags",
				"type": "string",
				"default": "",
				"description": "与播放列表关联的关键字标签。可以使用逗号分隔多个标签。"
			}
		]
	}
];
