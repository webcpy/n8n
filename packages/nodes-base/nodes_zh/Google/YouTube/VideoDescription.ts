import type { INodeProperties } from 'n8n-workflow';

export const videoOperations: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"resource": ["video"]
			}
		},
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"options": [
			{
				"name": "删除",
				"value": "delete",
				"description": "删除视频",
				"action": "删除视频"
			},
			{
				"name": "获取",
				"value": "get",
				"description": "获取视频",
				"action": "获取视频"
			},
			{
				"name": "检索多个",
				"value": "getAll",
				"description": "检索多个视频",
				"action": "获取多个视频"
			},
			{
				"name": "评分",
				"value": "rate",
				"description": "评分视频",
				"action": "评分视频"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新视频",
				"action": "更新视频"
			},
			{
				"name": "上传",
				"value": "upload",
				"description": "上传视频",
				"action": "上传视频"
			}
		],
		"default": "getAll"
	}

];

export const videoFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 video:upload                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayOptions": {
			"show": {
				"operation": ["upload"],
				"resource": ["video"]
			}
		},
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["upload"],
				"resource": ["video"]
			}
		},
		"displayName": "地区代码",
		"name": "regionCode",
		"type": "options",
		"description": "从列表中选择，或使用 <a href='https://docs.n8n.io/code-examples/expressions/'>表达式</a> 指定一个 ID",
		"typeOptions": {
			"loadOptionsMethod": "getCountriesCodes"
		},
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["upload"],
				"resource": ["video"]
			}
		},
		"displayName": "类别名称或 ID",
		"name": "categoryId",
		"type": "options",
		"description": "从列表中选择，或使用 <a href='https://docs.n8n.io/code-examples/expressions/'>表达式</a> 指定一个 ID",
		"typeOptions": {
			"loadOptionsMethod": "getVideoCategories",
			"loadOptionsDependsOn": ["regionCode"]
		},
		"default": ""
	},
	{
		"displayOptions": {
			"show": {
				"operation": ["upload"],
				"resource": ["video"]
			}
		},
		"displayName": "输入二进制字段",
		"name": "binaryProperty",
		"type": "string",
		"required": true,
		"hint": "包含要上传的文件的输入二进制字段的名称",
		"default": "data"
	},

	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		placeholder: '添加选项',
		default: {},
		displayOptions: {
			show: {
				operation: ['upload'],
				resource: ['video'],
			},
		},
		options: [
			{
				displayName: '默认语言名称或ID',
				name: 'defaultLanguage',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLanguages',
				},
				default: '',
				description:
					'播放列表资源标题和描述属性的语言。从列表中选择，或使用表达式指定ID。',
			},
			{
				displayName: '描述',
				name: 'description',
				type: 'string',
				default: '',
				description: '播放列表的描述',
			},
			{
				displayName: '可嵌入',
				name: 'embeddable',
				type: 'boolean',
				default: false,
				description: '视频是否可嵌入到其他网站',
			},
			{
				displayName: '许可证',
				name: 'license',
				type: 'options',
				options: [
					{
						name: '创作共用',
						value: 'creativeCommon',
					},
					{
						name: 'YouTube',
						value: 'youtube',
					},
				],
				default: '',
				description: '视频的许可证',
			},
			{
				displayName: '通知订阅者',
				name: 'notifySubscribers',
				type: 'boolean',
				default: false,
				description: 'YouTube 是否应向订阅视频频道的用户发送有关新视频的通知',
			},
			{
				displayName: '隐私状态',
				name: 'privacyStatus',
				type: 'options',
				options: [
					{
						name: '私有',
						value: 'private',
					},
					{
						name: '公开',
						value: 'public',
					},
					{
						name: '未公开',
						value: 'unlisted',
					},
				],
				default: '',
				description: '播放列表的隐私状态',
			},
			{
				displayName: '公开统计信息可见',
				name: 'publicStatsViewable',
				type: 'boolean',
				default: true,
				description: '视频观看页面上的扩展视频统计信息是否公开可见',
			},
			{
				displayName: '发布时间',
				name: 'publishAt',
				type: 'dateTime',
				default: '',
				description: '如果设置了此属性的值，则还必须将 status.privacyStatus 属性设置为 private。',
			},
			{
				displayName: '录制日期',
				name: 'recordingDate',
				type: 'dateTime',
				default: '',
				description: '视频录制的日期和时间',
			},
			{
				displayName: '自行声明适合儿童',
				name: 'selfDeclaredMadeForKids',
				type: 'boolean',
				default: false,
				description: '视频是否被指定为面向儿童，并包含视频的当前“适合儿童”状态',
			},
			{
				displayName: '标签',
				name: 'tags',
				type: 'string',
				default: '',
				description: '与播放列表关联的关键字标签。多个标签可以用逗号分隔。',
			},
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                                 video:delete                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "视频ID",
		"name": "videoId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["delete"],
				"resource": ["video"]
			}
		},
		"description": "视频的ID",
		"default": ""
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
				"resource": ["video"]
			}
		},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数指示请求的授权凭据标识出一个YouTube CMS用户，该用户正在代表参数值中指定的内容所有者执行操作"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 video:get                                  */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "视频ID",
		"name": "videoId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["video"]
			}
		},
		"default": ""
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
				"name": "直播流详情",
				"value": "liveStreamingDetails"
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
				"name": "录制详情",
				"value": "recordingDetails"
			},
			{
				"name": "片段",
				"value": "snippet"
			},
			{
				"name": "统计信息",
				"value": "statistics"
			},
			{
				"name": "状态",
				"value": "status"
			},
			{
				"name": "主题详情",
				"value": "topicDetails"
			}
		],
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["video"]
			}
		},
		"description": "fields参数指定API响应将包含的一个或多个视频资源属性的逗号分隔列表",
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
				"resource": ["video"]
			}
		},
		"options": [
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner参数指示请求的授权凭据标识出一个YouTube CMS用户，该用户正在代表参数值中指定的内容所有者执行操作"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 video:getAll                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["video"]
			}
		},
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制内的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["video"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 50
		},
		"default": 25,
		"description": "要返回的最大结果数"
	},
	{
		"displayName": "过滤器",
		"name": "filters",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["video"]
			}
		},
		"options": [
			{
				"displayName": "频道ID",
				"name": "channelId",
				"type": "string",
				"default": "",
				"description": "channelId参数指示API响应应仅包含由频道创建的资源"
			},
			{
				"displayName": "对开发者",
				"name": "forDeveloper",
				"type": "boolean",
				"default": false,
				"description": "是否限制搜索仅检索通过开发者的应用程序或网站上传的视频"
			},
			{
				"displayName": "发布时间晚于",
				"name": "publishedAfter",
				"type": "dateTime",
				"default": "",
				"description": "publishedAfter参数指示API响应应仅包含在指定时间之后创建的资源"
			},
			{
				"displayName": "发布时间早于",
				"name": "publishedBefore",
				"type": "dateTime",
				"default": "",
				"description": "publishedBefore参数指示API响应应仅包含在指定时间之前或在指定时间创建的资源"
			},
			{
				"displayName": "查询",
				"name": "q",
				"type": "string",
				"default": "",
				"description": "q参数指定要搜索的查询词"
			},
			{
				"displayName": "地区代码",
				"name": "regionCode",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getCountriesCodes"
				},
				"default": "",
				"description": "regionCode参数指示API选择在指定地区可用的视频排行榜。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "相关视频ID",
				"name": "relatedToVideoId",
				"type": "string",
				"default": "",
				"description": "relatedToVideoId参数检索与参数值标识的视频相关的视频列表"
			},
			{
				"displayName": "视频分类ID",
				"name": "videoCategoryId",
				"type": "string",
				"default": "",
				"description": "videoCategoryId参数标识要检索的视频类别"
			},
			{
				"displayName": "视频是否合作",
				"name": "videoSyndicated",
				"type": "boolean",
				"default": false,
				"description": "是否限制搜索仅检索可以在youtube.com之外播放的视频"
			},
			{
				"displayName": "视频类型",
				"name": "videoType",
				"type": "options",
				"options": [
					{
						"name": "任何",
						"value": "any"
					},
					{
						"name": "剧集",
						"value": "episode"
					},
					{
						"name": "电影",
						"value": "movie"
					}
				],
				"default": "",
				"description": "videoType参数允许您将搜索限制为特定类型的视频"
			}
		]
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["video"]
			}
		},
		"options": [
			{
				"displayName": "排序",
				"name": "order",
				"type": "options",
				"options": [
					{
						"name": "日期",
						"value": "date"
					},
					{
						"name": "相关性",
						"value": "relevance"
					}
				],
				"default": "relevance"
			},
			{
				"displayName": "安全搜索",
				"name": "safeSearch",
				"type": "options",
				"options": [
					{
						"name": "适度",
						"value": "moderate",
						"description": "YouTube将从搜索结果中过滤一些内容，并且至少会过滤掉在您的区域受限制的内容"
					},
					{
						"name": "无",
						"value": "none",
						"description": "YouTube不会过滤搜索结果集"
					},
					{
						"name": "严格",
						"value": "strict",
						"description": "YouTube将尝试从搜索结果集中排除所有受限制的内容"
					}
				],
				"default": ""
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 video:rate                                 */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "视频ID",
		"name": "videoId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["rate"],
				"resource": ["video"]
			}
		},
		"default": ""
	},
	{
		"displayName": "评级",
		"name": "rating",
		"type": "options",
		"displayOptions": {
			"show": {
				"operation": ["rate"],
				"resource": ["video"]
			}
		},
		"options": [
			{
				"name": "不喜欢",
				"value": "dislike",
				"description": "记录认证用户不喜欢视频"
			},
			{
				"name": "喜欢",
				"value": "like",
				"description": "记录认证用户喜欢视频"
			},
			{
				"name": "无",
				"value": "none",
				"description": "移除认证用户先前为视频设置的任何评级"
			}
		],
		"default": ""
	},

	/* -------------------------------------------------------------------------- */
	/*                                 video:update                               */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "视频ID",
		"name": "videoId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["video"]
			}
		},
		"default": ""
	},
	{
		"displayName": "标题",
		"name": "title",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["video"]
			}
		},
		"default": ""
	},
	{
		"displayName": "地区代码",
		"name": "regionCode",
		"type": "options",
		"description": "从列表中选择，或使用表达式指定ID。",
		"typeOptions": {
			"loadOptionsMethod": "getCountriesCodes"
		},
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["video"]
			}
		},
		"default": ""
	},
	{
		"displayName": "类别名称或ID",
		"name": "categoryId",
		"type": "options",
		"description": "从列表中选择，或使用表达式指定ID。",
		"typeOptions": {
			"loadOptionsMethod": "getVideoCategories",
			"loadOptionsDependsOn": ["regionCode"]
		},
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["video"]
			}
		},
		"default": ""
	},
	{
		"displayName": "更新字段",
		"name": "updateFields",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["video"]
			}
		},
		"options": [
			{
				"displayName": "默认语言名称或ID",
				"name": "defaultLanguage",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getLanguages"
				},
				"default": "",
				"description": "播放列表资源的标题和描述属性中的文本的语言。从列表中选择，或使用表达式指定ID。"
			},
			{
				"displayName": "描述",
				"name": "description",
				"type": "string",
				"default": "",
				"description": "播放列表的描述"
			},
			{
				"displayName": "可嵌入",
				"name": "embeddable",
				"type": "boolean",
				"default": false,
				"description": "视频是否可以嵌入到其他网站上"
			},
			{
				"displayName": "许可证",
				"name": "license",
				"type": "options",
				"options": [
					{
						"name": "创意共用",
						"value": "creativeCommon"
					},
					{
						"name": "YouTube",
						"value": "youtube"
					}
				],
				"default": "",
				"description": "视频的许可证"
			},
			{
				"displayName": "通知订阅者",
				"name": "notifySubscribers",
				"type": "boolean",
				"default": false,
				"description": "YouTube是否应向订阅该视频频道的用户发送有关新视频的通知"
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
						"name": "未列入",
						"value": "unlistef"
					}
				],
				"default": "",
				"description": "播放列表的隐私状态"
			},
			{
				"displayName": "公共统计信息可见",
				"name": "publicStatsViewable",
				"type": "boolean",
				"default": true,
				"description": "视频观看页面上的扩展视频统计信息是否公开可见"
			},
			{
				"displayName": "发布时间",
				"name": "publishAt",
				"type": "dateTime",
				"default": "",
				"description": "如果为此属性设置了值，则必须还设置status.privacyStatus属性为private"
			},
			{
				"displayName": "录制日期",
				"name": "recordingDate",
				"type": "dateTime",
				"default": "",
				"description": "视频录制的日期和时间"
			},
			{
				"displayName": "自声明适合儿童",
				"name": "selfDeclaredMadeForKids",
				"type": "boolean",
				"default": false,
				"description": "视频是否指定为针对儿童，以及视频的当前“适合儿童”状态"
			},
			{
				"displayName": "标签",
				"name": "tags",
				"type": "string",
				"default": "",
				"description": "与播放列表相关的关键字标签。可以用逗号分隔定义多个。"
			}
		]
	}

];
