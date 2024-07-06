import type { INodeProperties } from 'n8n-workflow';

export const playlistItemOperations: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"resource": ["playlistItem"]
			}
		},
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"default": "add",
		"options": [
			{
				"name": "添加",
				"value": "add",
				"description": "将项目添加到播放列表",
				"action": "添加播放列表项"
			},
			{
				"name": "删除",
				"value": "delete",
				"description": "从播放列表中删除项目",
				"action": "删除播放列表项"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取播放列表的项目",
				"action": "获取播放列表项"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "检索多个播放列表项目",
				"action": "获取多个播放列表项"
			}
		]
	}
];

export const playlistItemFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 playlistItem:add                           */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["add"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "播放列表名称或ID",
		"name": "playlistId",
		"type": "options",
		"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个ID",
		"typeOptions": {
			"loadOptionsMethod": "getPlaylists"
		},
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["add"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "视频ID",
		"name": "videoId",
		"type": "string",
		"description": "视频的ID",
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["add"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "结束于",
				"name": "endAt",
				"type": "dateTime",
				"default": "",
				"description": "视频停止播放的时间，以从视频开始的秒数为单位"
			},
			{
				"displayName": "注释",
				"name": "note",
				"type": "string",
				"default": "",
				"description": "此项目的用户生成的注释。该属性值的最大长度为280个字符。"
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner 参数指示请求的授权凭据标识出一个 YouTube CMS 用户，该用户代表参数值中指定的内容所有者。"
			},
			{
				"displayName": "位置",
				"name": "position",
				"type": "number",
				"typeOptions": {
					"minValue": 0
				},
				"default": "",
				"description": "项目在播放列表中出现的顺序。该值使用从零开始的索引，因此第一个项目的位置为0，第二个项目的位置为1，依此类推。"
			},
			{
				"displayName": "开始于",
				"name": "startAt",
				"type": "dateTime",
				"default": "",
				"description": "视频开始播放的时间，以从视频开始的秒数为单位"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 playlistItem:get                           */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "播放列表项ID",
		"name": "playlistItemId",
		"type": "string",
		"description": "播放列表项的ID",
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlistItem"]
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
				"name": "Content Details",
				"value": "contentDetails"
			},
			{
				"name": "ID",
				"value": "id"
			},
			{
				"name": "Snippet",
				"value": "snippet"
			},
			{
				"name": "Status",
				"value": "status"
			}
		],
		"required": true,
		"description": "字段参数指定API响应中将包含的一个或多个播放列表项资源属性的逗号分隔列表",
		"default": ["*"]
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner 参数指示请求的授权凭据标识出一个 YouTube CMS 用户，该用户代表参数值中指定的内容所有者。"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 playlistItem:delete                        */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["delete"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "播放列表项 ID",
		"name": "playlistItemId",
		"type": "string",
		"description": "播放列表项的 ID",
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["delete"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner 参数指示请求的授权凭据标识出一个 YouTube CMS 用户，该用户代表参数值中指定的内容所有者进行操作"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 playlistItem:getAll                        */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "播放列表名称或 ID",
		"name": "playlistId",
		"type": "options",
		"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定一个 ID",
		"typeOptions": {
			"loadOptionsMethod": "getPlaylists"
		},
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlistItem"]
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
				"name": "摘要",
				"value": "snippet"
			},
			{
				"name": "状态",
				"value": "status"
			}
		],
		"required": true,
		"description": "字段参数指定 API 响应中将包含的一个或多个播放列表项资源属性的逗号分隔列表",
		"default": ["*"]
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlistItem"]
			}
		},
		"displayName": "返回全部",
		"name": "returnAll",
		"type": "boolean",
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制数量的结果"
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["playlistItem"],
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
				"resource": ["playlistItem"]
			}
		},
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner 参数指示请求的授权凭据标识出一个 YouTube CMS 用户，该用户代表参数值中指定的内容所有者进行操作"
			}
		]
	}
];
