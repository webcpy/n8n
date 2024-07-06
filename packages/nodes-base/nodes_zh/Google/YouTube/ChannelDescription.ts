import type { INodeProperties } from 'n8n-workflow';

export const channelOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["channel"]
			}
		},
		"options": [
			{
				"name": "获取",
				"value": "get",
				"description": "检索频道",
				"action": "获取频道"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"description": "检索多个频道",
				"action": "获取多个频道"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新频道",
				"action": "更新频道"
			},
			{
				"name": "上传横幅",
				"value": "uploadBanner",
				"description": "上传频道横幅",
				"action": "上传频道横幅"
			}
		],
		"default": "getAll"
	}
];

export const channelFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 channel:getAll                             */
	/* -------------------------------------------------------------------------- */
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
				"name": "品牌设置",
				"value": "brandingSettings"
			},
			{
				"name": "内容详细信息",
				"value": "contentDetails"
			},
			{
				"name": "内容所有者详细信息",
				"value": "contentOwnerDetails"
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
				"name": "主题详细信息",
				"value": "topicDetails"
			}
		],
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["channel"]
			}
		},
		"description": "字段参数指定一个或多个频道资源属性的逗号分隔列表，API 响应将包含这些属性",
		"default": ["*"]
	},
	{
		"displayName": "返回所有",
		"name": "returnAll",
		"type": "boolean",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["channel"]
			}
		},
		"default": false,
		"description": "是否返回所有结果，还是仅返回给定数量的结果"
	},
	{
		"displayName": "限制",
		"name": "limit",
		"type": "number",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["channel"],
				"returnAll": [false]
			}
		},
		"typeOptions": {
			"minValue": 1,
			"maxValue": 50
		},
		"default": 25,
		"description": "要返回的结果的最大数量"
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
				"resource": ["channel"]
			}
		},
		"options": [
			{
				"displayName": "类别 ID",
				"name": "categoryId",
				"type": "string",
				"default": "",
				"description": "categoryId 参数指定一个 YouTube 指南类别，从而请求与该类别关联的 YouTube 频道"
			},
			{
				"displayName": "用户名",
				"name": "forUsername",
				"type": "string",
				"default": "",
				"description": "forUsername 参数指定一个 YouTube 用户名，从而请求与该用户名关联的频道"
			},
			{
				"displayName": "ID",
				"name": "id",
				"type": "string",
				"default": "",
				"description": "ID 参数指定一个或多个要检索的资源的 YouTube 频道 ID，ID 参数在频道资源中指定频道的 YouTube 频道 ID"
			},
			{
				"displayName": "由我管理",
				"name": "managedByMe",
				"type": "boolean",
				"default": false,
				"description": "是否指示 API 仅返回由 onBehalfOfContentOwner 参数指定的内容所有者管理的频道"
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
				"resource": ["channel"]
			}
		},
		"options": [
			{
				"displayName": "语言代码",
				"name": "h1",
				"type": "options",
				"typeOptions": {
					"loadOptionsMethod": "getLanguages"
				},
				"default": "",
				"description": "hl 参数指示 API 检索特定应用程序语言的本地化资源元数据，YouTube 网站支持该语言。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定 ID"
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": "",
				"description": "onBehalfOfContentOwner 参数表示请求的授权凭据标识出一个行动的 YouTube CMS 用户，该行动是根据参数值中指定的内容所有者行动的"
			}
		]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 channel:get                                */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "频道 ID",
		"name": "channelId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["channel"]
			}
		},
		"description": "频道的 ID",
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
				"name": "品牌设置",
				"value": "brandingSettings"
			},
			{
				"name": "内容详细信息",
				"value": "contentDetails"
			},
			{
				"name": "内容所有者详细信息",
				"value": "contentOwnerDetails"
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
				"name": "主题详细信息",
				"value": "topicDetails"
			}
		],
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["get"],
				"resource": ["channel"]
			}
		},
		"description": "字段参数指定一个或多个频道资源属性的逗号分隔列表，API 响应将包含这些属性",
		"default": ["*"]
	},
	/* -------------------------------------------------------------------------- */
	/*                                 channel:update                             */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "频道 ID",
		"name": "channelId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["channel"]
			}
		},
		"description": "频道的 ID",
		"default": ""
	},
	{
		"displayName": "更新字段",
		"name": "updateFields",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["update"],
				"resource": ["channel"]
			}
		},
		"options": [
			{
				"displayName": "品牌设置",
				"name": "brandingSettingsUi",
				"type": "fixedCollection",
				"default": {},
				"description": "封装了关于频道品牌的信息",
				"placeholder": "添加品牌设置",
				"typeOptions": {
					"multipleValues": false
				},
				"options": [
					{
						"name": "channelSettingsValues",
						"displayName": "频道设置",
						"values": [
							{
								"displayName": "频道",
								"name": "channel",
								"type": "collection",
								"default": {},
								"placeholder": "添加频道设置",
								"typeOptions": {
									"multipleValues": false
								},
								"options": [
									{
										"displayName": "国家",
										"name": "country",
										"type": "string",
										"default": "",
										"description": "与频道关联的国家。更新此属性以设置 snippet.country 属性的值。"
									},
									{
										"displayName": "描述",
										"name": "description",
										"type": "string",
										"default": "",
										"description": "频道描述，显示在频道页面上的频道信息框中。属性的值最长为 1000 个字符。"
									},
									{
										"displayName": "默认语言",
										"name": "defaultLanguage",
										"type": "string",
										"default": "",
										"description": "用户在访问频道页面时应显示的默认内容选项卡。"
									},
									{
										"displayName": "默认选项卡",
										"name": "defaultTab",
										"type": "string",
										"default": "用户在访问频道页面时应显示的默认内容选项卡。",
										"description": "用户在访问频道页面时应显示的默认内容选项卡。"
									},
									{
										"displayName": "特色频道标题",
										"name": "featuredChannelsTitle",
										"type": "string",
										"default": "",
										"description": "在特色频道模块上方显示的标题。标题最长为 30 个字符。"
									},
									{
										"displayName": "特色频道 URL",
										"name": "featuredChannelsUrls",
										"type": "string",
										"typeOptions": {
											"multipleValues": true
										},
										"description": "您希望从特色频道模块链接到的最多 100 个频道列表。属性值是 YouTube 频道 ID 值的列表，每个值都唯一标识一个频道。",
										"default": []
									},
									{
										"displayName": "关键词",
										"name": "keywords",
										"type": "string",
										"placeholder": "tech,news",
										"description": "与您的频道关联的关键词。值是由空格分隔的字符串列表。",
										"default": ""
									},
									{
										"displayName": "评论审核",
										"name": "moderateComments",
										"type": "boolean",
										"description": "用户在频道页面上留下的用户提交评论是否需要频道所有者批准才能公开显示",
										"default": false
									},
									{
										"displayName": "个人资料颜色",
										"name": "profileColor",
										"type": "string",
										"default": "",
										"description": "与频道内容相补的突出颜色"
									},
									{
										"displayName": "显示相关频道",
										"name": "showRelatedChannels",
										"type": "boolean",
										"description": "YouTube 是否应在您的频道页面上显示一个由算法生成的相关频道列表",
										"default": false
									},
									{
										"displayName": "显示浏览视图",
										"name": "showBrowseView",
										"type": "boolean",
										"description": "频道页面是否应以浏览视图或订阅视图显示内容",
										"default": false
									},
									{
										"displayName": "跟踪分析账户 ID",
										"name": "trackingAnalyticsAccountId",
										"type": "string",
										"description": "您希望用于跟踪和衡量访问您的频道的流量的 Google Analytics 帐户的 ID",
										"default": ""
									},
									{
										"displayName": "取消订阅预览片段",
										"name": "unsubscribedTrailer",
										"type": "string",
										"description": "应播放的视频在取消订阅观众频道页面的浏览视图中的特色视频模块中",
										"default": ""
									}
								]
							}
						],
						"description": "channel 对象封装了频道页面的品牌属性"
					},
					{
						"name": "imageSettingsValues",
						"displayName": "图片设置",
						"values": [
							{
								"displayName": "图片",
								"name": "image",
								"type": "collection",
								"default": {},
								"placeholder": "添加频道设置",
								"description": "image 对象封装了显示在频道的频道页面或视频观看页面上的图像的信息",
								"typeOptions": {
									"multipleValues": false
								},
								"options": [
									{
										"displayName": "横幅外部 URL",
										"name": "bannerExternalUrl",
										"type": "string",
										"default": ""
									},
									{
										"displayName": "跟踪图像 URL",
										"name": "trackingImageUrl",
										"type": "string",
										"default": ""
									},
									{
										"displayName": "观看图标图像 URL",
										"name": "watchIconImageUrl",
										"type": "string",
										"default": ""
									}
								]
							}
						]
					},
					{
						"name": "statusValue",
						"displayName": "状态",
						"values": [
							{
								"displayName": "状态",
								"name": "status",
								"type": "collection",
								"default": {},
								"placeholder": "添加状态",
								"typeOptions": {
									"multipleValues": false
								},
								"options": [
									{
										"displayName": "自行声明适用于儿童",
										"name": "selfDeclaredMadeForKids",
										"type": "boolean",
										"default": false
									}
								]
							}
						]
					}
				]
			},
			{
				"displayName": "代表内容所有者",
				"name": "onBehalfOfContentOwner",
				"type": "string",
				"default": ""
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 channel:uploadBanner                       */
	/* -------------------------------------------------------------------------- */
	{
		"displayName": "频道 ID",
		"name": "channelId",
		"type": "string",
		"required": true,
		"displayOptions": {
			"show": {
				"operation": ["uploadBanner"],
				"resource": ["channel"]
			}
		},
		"description": "频道的 ID",
		"default": ""
	},
	{
		"displayName": "输入二进制字段",
		"name": "binaryProperty",
		"type": "string",
		"required": true,
		"hint": "包含要上传的文件的输入二进制字段的名称",
		"displayOptions": {
			"show": {
				"operation": ["uploadBanner"],
				"resource": ["channel"]
			}
		},
		"default": "data"
	}
];
