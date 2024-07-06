import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { snakeCase } from 'change-case';
import { getFileSha, githubApiRequest, githubApiRequestAllItems } from './GenericFunctions';

import { getRepositories, getUsers } from './SearchFunctions';

export class Github implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub',
		name: 'github',
		icon: 'file:github.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '使用 GitHub API',
		defaults: {
			name: 'GitHub',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'githubApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
			{
				name: 'githubOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		properties: [
			{
				"displayName": "认证",
				"name": "authentication",
				"type": "options",
				"options": [
					{
						"name": "访问令牌",
						"value": "accessToken"
					},
					{
						"name": "OAuth2",
						"value": "oAuth2"
					}
				],
				"default": "accessToken"
			},
			{
				"displayName": "Resource",
				"name": "resource",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "文件",
						"value": "file"
					},
					{
						"name": "问题",
						"value": "issue"
					},
					{
						"name": "组织",
						"value": "organization"
					},
					{
						"name": "发布",
						"value": "release"
					},
					{
						"name": "仓库",
						"value": "repository"
					},
					{
						"name": "审查",
						"value": "review"
					},
					{
						"name": "用户",
						"value": "user"
					}
				],
				"default": "issue"
			},


			// ----------------------------------
			//         operations
			// ----------------------------------
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"displayOptions": {
					"show": {
						"resource": ["organization"]
					}
				},
				"options": [
					{
						"name": "获取仓库",
						"value": "getRepositories",
						"description": "返回组织的所有仓库",
						"action": "获取组织的仓库"
					}
				],
				"default": "getRepositories"
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"displayOptions": {
					"show": {
						"resource": ["issue"]
					}
				},
				"options": [
					{
						"name": "创建",
						"value": "create",
						"description": "创建新问题",
						"action": "创建问题"
					},
					{
						"name": "创建评论",
						"value": "createComment",
						"description": "在问题上创建新评论",
						"action": "在问题上创建评论"
					},
					{
						"name": "编辑",
						"value": "edit",
						"description": "编辑问题",
						"action": "编辑问题"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取单个问题的数据",
						"action": "获取问题"
					},
					{
						"name": "锁定",
						"value": "lock",
						"description": "锁定问题",
						"action": "锁定问题"
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
						"resource": ["file"]
					}
				},
				"options": [
					{
						"name": "创建",
						"value": "create",
						"description": "在仓库中创建新文件",
						"action": "创建文件"
					},
					{
						"name": "删除",
						"value": "delete",
						"description": "在仓库中删除文件",
						"action": "删除文件"
					},
					{
						"name": "编辑",
						"value": "edit",
						"description": "在仓库中编辑文件",
						"action": "编辑文件"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取单个文件的数据",
						"action": "获取文件"
					},
					{
						"name": "列出",
						"value": "list",
						"description": "列出文件夹的内容",
						"action": "列出文件"
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
						"resource": ["repository"]
					}
				},
				"options": [
					{
						"name": "获取",
						"value": "get",
						"description": "获取单个仓库的数据",
						"action": "获取仓库"
					},
					{
						"name": "获取问题",
						"value": "getIssues",
						"description": "返回仓库的问题",
						"action": "获取仓库的问题"
					},
					{
						"name": "获取许可证",
						"value": "getLicense",
						"description": "如果检测到，返回仓库许可证文件的内容",
						"action": "获取仓库的许可证"
					},
					{
						"name": "获取配置文件",
						"value": "getProfile",
						"description": "获取包括指标、健康评分、描述、许可证等的仓库的社区配置文件",
						"action": "获取仓库的配置文件"
					},
					{
						"name": "列出热门路径",
						"value": "listPopularPaths",
						"description": "获取过去14天内前10个热门内容路径",
						"action": "列出仓库中热门的路径"
					},
					{
						"name": "列出引用",
						"value": "listReferrers",
						"description": "获取过去14天内前10个引用域",
						"action": "列出仓库中顶级引用"
					}
				],
				"default": "getIssues"
			},
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
						"name": "获取仓库",
						"value": "getRepositories",
						"description": "返回用户的仓库",
						"action": "获取用户的仓库"
					},
					{
						"name": "邀请",
						"value": "invite",
						"description": "邀请用户加入组织",
						"action": "邀请用户"
					}
				],
				"default": "getRepositories"
			},
			{
				"displayName": "操作",
				"name": "operation",
				"type": "options",
				"noDataExpression": true,
				"displayOptions": {
					"show": {
						"resource": ["release"]
					}
				},
				"options": [
					{
						"name": "创建",
						"value": "create",
						"description": "创建新发布",
						"action": "创建发布"
					},
					{
						"name": "删除",
						"value": "delete",
						"description": "删除发布",
						"action": "删除发布"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取发布",
						"action": "获取发布"
					},
					{
						"name": "获取多个",
						"value": "getAll",
						"description": "获取多个仓库的发布",
						"action": "获取多个发布"
					},
					{
						"name": "更新",
						"value": "update",
						"description": "更新发布",
						"action": "更新发布"
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
						"resource": ["review"]
					}
				},
				"options": [
					{
						"name": "创建",
						"value": "create",
						"description": "创建新审阅",
						"action": "创建审阅"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取拉取请求的审阅",
						"action": "获取审阅"
					},
					{
						"name": "获取多个",
						"value": "getAll",
						"description": "获取拉取请求的多个审阅",
						"action": "获取多个审阅"
					},
					{
						"name": "更新",
						"value": "update",
						"description": "更新审阅",
						"action": "更新审阅"
					}
				],
				"default": "create"
			},


			// ----------------------------------
			//         shared
			// ----------------------------------
			{
				"displayName": "仓库所有者",
				"name": "owner",
				"type": "resourceLocator",
				"default": { "mode": "list", "value": "" },
				"required": true,
				"modes": [
					{
						"displayName": "仓库所有者",
						"name": "list",
						"type": "list",
						"placeholder": "选择一个所有者...",
						"typeOptions": {
							"searchListMethod": "getUsers",
							"searchable": true,
							"searchFilterRequired": true
						}
					},
					{
						"displayName": "链接",
						"name": "url",
						"type": "string",
						"placeholder": "例如 https://github.com/n8n-io",
						"extractValue": {
							"type": "regex",
							"regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)"
						},
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)(?:.*)",
									"errorMessage": "不是有效的 Github URL"
								}
							}
						]
					},
					{
						"displayName": "按名称",
						"name": "name",
						"type": "string",
						"placeholder": "例如 n8n-io",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "[-_a-zA-Z0-9]+",
									"errorMessage": "不是有效的 Github 所有者名称"
								}
							}
						],
						"url": "=https://github.com/{{$value}}"
					}
				],
				"displayOptions": {
					"hide": {
						"operation": ["invite"]
					}
				}
			},
			{
				"displayName": "仓库名称",
				"name": "repository",
				"type": "resourceLocator",
				"default": { "mode": "list", "value": "" },
				"required": true,
				"modes": [
					{
						"displayName": "仓库名称",
						"name": "list",
						"type": "list",
						"placeholder": "选择一个仓库...",
						"typeOptions": {
							"searchListMethod": "getRepositories",
							"searchable": true
						}
					},
					{
						"displayName": "链接",
						"name": "url",
						"type": "string",
						"placeholder": "例如 https://github.com/n8n-io/n8n",
						"extractValue": {
							"type": "regex",
							"regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)"
						},
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)(?:.*)",
									"errorMessage": "不是有效的 Github 仓库 URL"
								}
							}
						]
					},
					{
						"displayName": "按名称",
						"name": "name",
						"type": "string",
						"placeholder": "例如 n8n",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "[-_.0-9a-zA-Z]+",
									"errorMessage": "不是有效的 Github 仓库名称"
								}
							}
						],
						"url": "=https://github.com/{{$parameter['owner']}}/{{$value}}"
					}
				],
				"displayOptions": {
					"hide": {
						"resource": ["user", "organization"],
						"operation": ["getRepositories"]
					}
				}
			},


			// ----------------------------------
			//         file
			// ----------------------------------

			// ----------------------------------
			//         file:create/delete/edit/get
			// ----------------------------------
			{
				"displayName": "文件路径",
				"name": "filePath",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"resource": ["file"]
					},
					"hide": {
						"operation": ["list"]
					}
				},
				"placeholder": "docs/README.md",
				"description": "文件的文件路径。必须包含完整路径。"
			},


			// ----------------------------------
			//         file:list
			// ----------------------------------
			{
				"displayName": "路径",
				"name": "filePath",
				"type": "string",
				"default": "",
				"displayOptions": {
					"show": {
						"resource": ["file"],
						"operation": ["list"]
					}
				},
				"placeholder": "docs/",
				"description": "要列出的文件夹的路径"
			},


			// ----------------------------------
			//         file:create/edit
			// ----------------------------------
			{
				"displayName": "二进制文件",
				"name": "binaryData",
				"type": "boolean",
				"default": false,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["create", "edit"],
						"resource": ["file"]
					}
				},
				"description": "是否应该从二进制字段中获取要上传的数据"
			},
			{
				"displayName": "文件内容",
				"name": "fileContent",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"binaryData": [false],
						"operation": ["create", "edit"],
						"resource": ["file"]
					}
				},
				"placeholder": "",
				"description": "文件的文本内容"
			},
			{
				"displayName": "输入二进制字段",
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"binaryData": [true],
						"operation": ["create", "edit"],
						"resource": ["file"]
					}
				},
				"placeholder": "",
				"hint": "包含要写入的文件的输入二进制字段的名称"
			},
			{
				"displayName": "提交消息",
				"name": "commitMessage",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["create", "delete", "edit"],
						"resource": ["file"]
					}
				}
			},
			{
				"displayName": "附加参数",
				"name": "additionalParameters",
				"placeholder": "添加参数",
				"description": "要添加的其他字段",
				"type": "fixedCollection",
				"default": {},
				"displayOptions": {
					"show": {
						"operation": ["create", "delete", "edit"],
						"resource": ["file"]
					}
				},
				"options": [
					{
						"name": "author",
						"displayName": "作者",
						"values": [
							{
								"displayName": "姓名",
								"name": "name",
								"type": "string",
								"default": "",
								"description": "提交的作者的姓名"
							},
							{
								"displayName": "电子邮件",
								"name": "email",
								"type": "string",
								"placeholder": "name@email.com",
								"default": "",
								"description": "提交的作者的电子邮件"
							}
						]
					},
					{
						"name": "branch",
						"displayName": "分支",
						"values": [
							{
								"displayName": "分支",
								"name": "branch",
								"type": "string",
								"default": "",
								"description": "要提交到的分支。如果未设置，则使用存储库的默认分支（通常为 master）。"
							}
						]
					},
					{
						"name": "committer",
						"displayName": "提交者",
						"values": [
							{
								"displayName": "姓名",
								"name": "name",
								"type": "string",
								"default": "",
								"description": "提交的提交者的姓名"
							},
							{
								"displayName": "电子邮件",
								"name": "email",
								"type": "string",
								"placeholder": "name@email.com",
								"default": "",
								"description": "提交的提交者的电子邮件"
							}
						]
					}
				]
			},


			// ----------------------------------
			//         file:get
			// ----------------------------------
			{
				"displayName": "作为二进制属性",
				"name": "asBinaryProperty",
				"type": "boolean",
				"default": true,
				"displayOptions": {
					"show": {
						"operation": ["get"],
						"resource": ["file"]
					}
				},
				"description": "是否将文件的数据设置为二进制属性，而不是返回原始的 API 响应"
			},
			{
				"displayName": "将输出文件放入字段",
				"name": "binaryPropertyName",
				"type": "string",
				"default": "data",
				"required": true,
				"displayOptions": {
					"show": {
						"asBinaryProperty": [true],
						"operation": ["get"],
						"resource": ["file"]
					}
				},
				"placeholder": "",
				"hint": "将文件放入的输出二进制字段的名称"
			},
			{
				"displayName": "附加参数",
				"name": "additionalParameters",
				"placeholder": "添加参数",
				"description": "要添加的其他字段",
				"type": "collection",
				"default": {},
				"displayOptions": {
					"show": {
						"operation": ["get"],
						"resource": ["file"]
					}
				},
				"options": [
					{
						"displayName": "引用",
						"name": "reference",
						"type": "string",
						"default": "",
						"placeholder": "master",
						"description": "提交/分支/标签的名称。默认值：存储库的默认分支（通常为 master）。"
					}
				]
			},


			// ----------------------------------
			//         issue
			// ----------------------------------

			// ----------------------------------
			//         issue:create
			// ----------------------------------
			{
				"displayName": "标题",
				"name": "title",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["issue"]
					}
				},
				"description": "问题的标题"
			},
			{
				"displayName": "正文",
				"name": "body",
				"type": "string",
				"typeOptions": {
					"rows": 5
				},
				"default": "",
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["issue"]
					}
				},
				"description": "问题的正文"
			},
			{
				"displayName": "标签",
				"name": "labels",
				"type": "collection",
				"typeOptions": {
					"multipleValues": true,
					"multipleValueButtonText": "添加标签"
				},
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["issue"]
					}
				},
				"default": { "label": "" },
				"options": [
					{
						"displayName": "标签",
						"name": "label",
						"type": "string",
						"default": "",
						"description": "要添加到问题的标签"
					}
				]
			},
			{
				"displayName": "被指派人",
				"name": "assignees",
				"type": "collection",
				"typeOptions": {
					"multipleValues": true,
					"multipleValueButtonText": "添加被指派人"
				},
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["issue"]
					}
				},
				"default": { "assignee": "" },
				"options": [
					{
						"displayName": "被指派人",
						"name": "assignee",
						"type": "string",
						"default": "",
						"description": "要指派问题的用户"
					}
				]
			},


			// ----------------------------------
			//         issue:createComment
			// ----------------------------------
			{
				"displayName": "问题编号",
				"name": "issueNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["createComment"],
						"resource": ["issue"]
					}
				},
				"description": "要在其上创建评论的问题编号"
			},
			{
				"displayName": "正文",
				"name": "body",
				"type": "string",
				"typeOptions": {
					"rows": 5
				},
				"displayOptions": {
					"show": {
						"operation": ["createComment"],
						"resource": ["issue"]
					}
				},
				"default": "",
				"description": "评论的正文"
			},


			// ----------------------------------
			//         issue:edit
			// ----------------------------------
			{
				"displayName": "问题编号",
				"name": "issueNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["edit"],
						"resource": ["issue"]
					}
				},
				"description": "要编辑的问题编号"
			},
			{
				"displayName": "编辑字段",
				"name": "editFields",
				"type": "collection",
				"typeOptions": {
					"multipleValueButtonText": "添加字段"
				},
				"displayOptions": {
					"show": {
						"operation": ["edit"],
						"resource": ["issue"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "标题",
						"name": "title",
						"type": "string",
						"default": "",
						"description": "问题的标题"
					},
					{
						"displayName": "正文",
						"name": "body",
						"type": "string",
						"typeOptions": {
							"rows": 5
						},
						"default": "",
						"description": "问题的正文"
					},
					{
						"displayName": "状态",
						"name": "state",
						"type": "options",
						"options": [
							{
								"name": "关闭",
								"value": "closed",
								"description": "设置状态为“已关闭”"
							},
							{
								"name": "打开",
								"value": "open",
								"description": "设置状态为“已打开”"
							}
						],
						"default": "open",
						"description": "要设置的状态"
					},
					{
						"displayName": "标签",
						"name": "labels",
						"type": "collection",
						"typeOptions": {
							"multipleValues": true,
							"multipleValueButtonText": "添加标签"
						},
						"default": { "label": "" },
						"options": [
							{
								"displayName": "标签",
								"name": "label",
								"type": "string",
								"default": "",
								"description": "要添加到问题的标签"
							}
						]
					},
					{
						"displayName": "受让人",
						"name": "assignees",
						"type": "collection",
						"typeOptions": {
							"multipleValues": true,
							"multipleValueButtonText": "添加受让人"
						},
						"default": { "assignee": "" },
						"options": [
							{
								"displayName": "受让人",
								"name": "assignee",
								"type": "string",
								"default": "",
								"description": "要分配问题给的用户"
							}
						]
					}
				]
			},


			// ----------------------------------
			//         issue:get
			// ----------------------------------
			{
				"displayName": "问题编号",
				"name": "issueNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["get"],
						"resource": ["issue"]
					}
				},
				"description": "要获取数据的问题编号"
			},


			// ----------------------------------
			//         issue:lock
			// ----------------------------------
			{
				"displayName": "问题编号",
				"name": "issueNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["lock"],
						"resource": ["issue"]
					}
				},
				"description": "要锁定的问题编号"
			},
			{
				"displayName": "锁定原因",
				"name": "lockReason",
				"type": "options",
				"displayOptions": {
					"show": {
						"operation": ["lock"],
						"resource": ["issue"]
					}
				},
				"options": [
					{
						"name": "离题",
						"value": "off-topic",
						"description": "问题与主题无关"
					},
					{
						"name": "过于激烈",
						"value": "too heated",
						"description": "讨论过于激烈"
					},
					{
						"name": "已解决",
						"value": "resolved",
						"description": "问题已解决"
					},
					{
						"name": "垃圾信息",
						"value": "spam",
						"description": "问题是垃圾信息"
					}
				],
				"default": "resolved",
				"description": "锁定问题的原因"
			},


			// ----------------------------------
			//         release
			// ----------------------------------

			// ----------------------------------
			//         release:create
			// ----------------------------------
			{
				"displayName": "标签",
				"name": "releaseTag",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["release"]
					}
				},
				"description": "发布的标签"
			},
			{
				"displayName": "额外字段",
				"name": "additionalFields",
				"type": "collection",
				"typeOptions": {
					"multipleValueButtonText": "添加字段"
				},
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["release"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "名称",
						"name": "name",
						"type": "string",
						"default": "",
						"description": "问题的名称"
					},
					{
						"displayName": "正文",
						"name": "body",
						"type": "string",
						"typeOptions": {
							"rows": 5
						},
						"default": "",
						"description": "发布的正文"
					},
					{
						"displayName": "草稿",
						"name": "draft",
						"type": "boolean",
						"default": false,
						"description": "是否创建草稿（未发布）发布，选择“false”创建已发布的发布"
					},
					{
						"displayName": "预发布",
						"name": "prerelease",
						"type": "boolean",
						"default": false,
						"description": "指出发布是否未准备好用于生产环境"
					},
					{
						"displayName": "目标提交",
						"name": "target_commitish",
						"type": "string",
						"default": "",
						"description": "指定确定从何处创建 Git 标签的提交值。可以是任何分支或提交 SHA。如果 Git 标签已经存在，则不使用。默认值：存储库的默认分支（通常为 master）"
					}
				]
			},


			// ----------------------------------
			//         release:get/delete/update
			// ----------------------------------
			{
				"displayName": "发布 ID",
				"name": "release_id",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"resource": ["release"],
						"operation": ["get", "delete", "update"]
					}
				}
			},


			// ----------------------------------
			//         release:update
			// ----------------------------------
			{
				"displayName": "额外字段",
				"name": "additionalFields",
				"type": "collection",
				"typeOptions": {
					"multipleValueButtonText": "添加字段"
				},
				"displayOptions": {
					"show": {
						"operation": ["update"],
						"resource": ["release"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "正文",
						"name": "body",
						"type": "string",
						"typeOptions": {
							"rows": 5
						},
						"default": "",
						"description": "发布的正文内容"
					},
					{
						"displayName": "草稿",
						"name": "draft",
						"type": "boolean",
						"default": false,
						"description": "是否创建草稿（未发布）发布，'false'表示创建已发布的发布"
					},
					{
						"displayName": "名称",
						"name": "name",
						"type": "string",
						"default": "",
						"description": "发布的名称"
					},
					{
						"displayName": "预发布",
						"name": "prerelease",
						"type": "boolean",
						"default": false,
						"description": "是否标注此发布为非生产就绪"
					},
					{
						"displayName": "标签名称",
						"name": "tag_name",
						"type": "string",
						"default": "",
						"description": "标签的名称"
					},
					{
						"displayName": "目标提交",
						"name": "target_commitish",
						"type": "string",
						"default": "",
						"description": "指定用于创建 Git 标签的提交值。可以是任何分支或提交 SHA。如果 Git 标签已经存在，则不使用。默认值：仓库的默认分支（通常是 master）。"
					}
				]
			},

			// ----------------------------------
			//         release:getAll
			// ----------------------------------
			{
				"displayName": "返回所有",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["release"],
						"operation": ["getAll"]
					}
				},
				"default": false,
				"description": "是否返回所有结果或仅返回到给定限制",
			},
			{
				"displayName": "限制",
				"name": "limit",
				"type": "number",
				"displayOptions": {
					"show": {
						"resource": ["release"],
						"operation": ["getAll"],
						"returnAll": [false]
					}
				},
				"typeOptions": {
					"minValue": 1,
					"maxValue": 100
				},
				"default": 50,
				"description": "要返回的最大结果数",
			},


			// ----------------------------------
			//         repository
			// ----------------------------------

			// ----------------------------------
			//         repository:getIssues
			// ----------------------------------
			{
				"displayName": "返回所有",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["repository"],
						"operation": ["getIssues"]
					}
				},
				"default": false,
				"description": "是否返回所有结果或仅返回到给定限制"
			},
			{
				"displayName": "限制",
				"name": "limit",
				"type": "number",
				"displayOptions": {
					"show": {
						"resource": ["repository"],
						"operation": ["getIssues"],
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
				"displayName": "筛选器",
				"name": "getRepositoryIssuesFilters",
				"type": "collection",
				"typeOptions": {
					"multipleValueButtonText": "添加筛选器"
				},
				"displayOptions": {
					"show": {
						"operation": ["getIssues"],
						"resource": ["repository"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "受让人",
						"name": "assignee",
						"type": "string",
						"default": "",
						"description": "仅返回分配给特定用户的问题"
					},
					{
						"displayName": "创建者",
						"name": "creator",
						"type": "string",
						"default": "",
						"description": "仅返回由特定用户创建的问题"
					},
					{
						"displayName": "提及",
						"name": "mentioned",
						"type": "string",
						"default": "",
						"description": "仅返回其中提及了特定用户的问题"
					},
					{
						"displayName": "标签",
						"name": "labels",
						"type": "string",
						"default": "",
						"description": "仅返回具有给定标签的问题。多个标签可以用逗号分隔。"
					},
					{
						"displayName": "更新自",
						"name": "since",
						"type": "dateTime",
						"default": "",
						"description": "仅返回在此时间之后或同时更新的问题"
					},
					{
						"displayName": "状态",
						"name": "state",
						"type": "options",
						"options": [
							{
								"name": "所有",
								"value": "all",
								"description": "返回任何状态的问题"
							},
							{
								"name": "关闭",
								"value": "closed",
								"description": "返回“关闭”状态的问题"
							},
							{
								"name": "打开",
								"value": "open",
								"description": "返回“打开”状态的问题"
							}
						],
						"default": "open",
						"description": "要设置的状态"
					},
					{
						"displayName": "排序",
						"name": "sort",
						"type": "options",
						"options": [
							{
								"name": "创建",
								"value": "created",
								"description": "按创建日期排序"
							},
							{
								"name": "更新",
								"value": "updated",
								"description": "按更新日期排序"
							},
							{
								"name": "评论",
								"value": "comments",
								"description": "按评论排序"
							}
						],
						"default": "created",
						"description": "应返回问题的顺序"
					},
					{
						"displayName": "方向",
						"name": "direction",
						"type": "options",
						"options": [
							{
								"name": "升序",
								"value": "asc",
								"description": "按升序排序"
							},
							{
								"name": "降序",
								"value": "desc",
								"description": "按降序排序"
							}
						],
						"default": "desc",
						"description": "排序顺序"
					}
				]
			},


			// ----------------------------------
			//         rerview
			// ----------------------------------
			// ----------------------------------
			//         review:getAll
			// ----------------------------------
			{
				"displayName": "PR编号",
				"name": "pullRequestNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["get", "update"],
						"resource": ["review"]
					}
				},
				"description": "拉取请求的编号"
			},
			{
				"displayName": "审查ID",
				"name": "reviewId",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["get", "update"],
						"resource": ["review"]
					}
				},
				"description": "审查的ID"
			},


			// ----------------------------------
			//         review:getAll
			// ----------------------------------
			{
				"displayName": "PR编号",
				"name": "pullRequestNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["getAll"],
						"resource": ["review"]
					}
				},
				"description": "拉取请求的编号"
			},
			{
				"displayName": "返回全部",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["review"],
						"operation": ["getAll"]
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
						"resource": ["review"],
						"operation": ["getAll"],
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

			// ----------------------------------
			//         review:create
			// ----------------------------------
			{
				"displayName": "PR编号",
				"name": "pullRequestNumber",
				"type": "number",
				"default": 0,
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["review"]
					}
				},
				"description": "要审查的拉取请求的编号"
			},
			{
				"displayName": "Event",
				"name": "event",
				"type": "options",
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["review"]
					}
				},
				"options": [
					{
						"name": "Approve",
						"value": "approve",
						"description": "批准拉取请求"
					},
					{
						"name": "Request Change",
						"value": "requestChanges",
						"description": "请求代码更改"
					},
					{
						"name": "Comment",
						"value": "comment",
						"description": "添加评论，不需要批准或请求更改"
					},
					{
						"name": "Pending",
						"value": "pending",
						"description": "当准备好时，您将需要提交拉取请求审查"
					}
				],
				"default": "approve",
				"description": "您要执行的审查操作"
			},
			{
				"displayName": "正文",
				"name": "body",
				"type": "string",
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["review"],
						"event": ["requestChanges", "comment"]
					}
				},
				"default": "",
				"description": "审查的正文（对于事件请求更改或评论，必填）"
			},
			{
				"displayName": "附加字段",
				"name": "additionalFields",
				"placeholder": "添加字段",
				"type": "collection",
				"default": {},
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["review"]
					}
				},
				"options": [
					{
						"displayName": "提交ID",
						"name": "commitId",
						"type": "string",
						"default": "",
						"description": "需要审查的提交的SHA，如果与最新的不同"
					}
				]
			},

			// ----------------------------------
			//         review:update
			// ----------------------------------
			{
				"displayName": "正文",
				"name": "body",
				"type": "string",
				"displayOptions": {
					"show": {
						"operation": ["update"],
						"resource": ["review"]
					}
				},
				"default": "",
				"description": "审查的正文"
			},

			// ----------------------------------
			//       user:getRepositories
			// ----------------------------------
			{
				"displayName": "返回全部",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["user"],
						"operation": ["getRepositories"]
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
						"resource": ["user"],
						"operation": ["getRepositories"],
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

			// ----------------------------------
			//         user:invite
			// ----------------------------------
			{
				"displayName": "组织",
				"name": "organization",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["invite"],
						"resource": ["user"]
					}
				},
				"description": "被邀请的用户所属的 GitHub 组织"
			},
			{
				"displayName": "邮箱",
				"name": "email",
				"type": "string",
				"placeholder": "name@email.com",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["invite"],
						"resource": ["user"]
					}
				},
				"description": "被邀请用户的电子邮件地址"
			},

			// ----------------------------------
			//    organization:getRepositories
			// ----------------------------------
			{
				"displayName": "返回所有",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["organization"],
						"operation": ["getRepositories"]
					}
				},
				"default": false,
				"description": "是否返回所有结果，还是仅返回给定限制的结果"
			},
			{
				"displayName": "限制",
				"name": "limit",
				"type": "number",
				"displayOptions": {
					"show": {
						"resource": ["organization"],
						"operation": ["getRepositories"],
						"returnAll": [false]
					}
				},
				"typeOptions": {
					"minValue": 1,
					"maxValue": 100
				},
				"default": 50,
				"description": "要返回的最大结果数"
			}

		],
	};

	methods = {
		listSearch: {
			getUsers,
			getRepositories,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		let returnAll = false;

		let responseData;

		// Operations which overwrite the returned data
		const overwriteDataOperations = [
			'file:create',
			'file:delete',
			'file:edit',
			'file:get',
			'issue:create',
			'issue:createComment',
			'issue:edit',
			'issue:get',
			'release:create',
			'release:delete',
			'release:get',
			'release:update',
			'repository:get',
			'repository:getLicense',
			'repository:getProfile',
			'review:create',
			'review:get',
			'review:update',
			'user:invite',
		];
		// Operations which overwrite the returned data and return arrays
		// and has so to be merged with the data of other items
		const overwriteDataOperationsArray = [
			'file:list',
			'repository:getIssues',
			'repository:listPopularPaths',
			'repository:listReferrers',
			'user:getRepositories',
			'release:getAll',
			'review:getAll',
			'organization:getRepositories',
		];

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;

		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);
		const fullOperation = `${resource}:${operation}`;

		for (let i = 0; i < items.length; i++) {
			try {
				// Reset all values
				requestMethod = 'GET';
				endpoint = '';
				body = {};
				qs = {};

				let owner = '';
				if (fullOperation !== 'user:invite') {
					// Request the parameters which almost all operations need
					owner = this.getNodeParameter('owner', i, '', { extractValue: true }) as string;
				}

				let repository = '';
				if (
					fullOperation !== 'user:getRepositories' &&
					fullOperation !== 'user:invite' &&
					fullOperation !== 'organization:getRepositories'
				) {
					repository = this.getNodeParameter('repository', i, '', { extractValue: true }) as string;
				}

				if (resource === 'file') {
					if (['create', 'edit'].includes(operation)) {
						// ----------------------------------
						//         create/edit
						// ----------------------------------

						requestMethod = 'PUT';

						const filePath = this.getNodeParameter('filePath', i);

						const additionalParameters = this.getNodeParameter(
							'additionalParameters',
							i,
							{},
						) as IDataObject;
						if (additionalParameters.author) {
							body.author = additionalParameters.author;
						}
						if (additionalParameters.committer) {
							body.committer = additionalParameters.committer;
						}
						if (
							additionalParameters.branch &&
							(additionalParameters.branch as IDataObject).branch
						) {
							body.branch = (additionalParameters.branch as IDataObject).branch;
						}

						if (operation === 'edit') {
							// If the file should be updated the request has to contain the SHA
							// of the file which gets replaced.
							body.sha = await getFileSha.call(
								this,
								owner,
								repository,
								filePath,
								body.branch as string | undefined,
							);
						}

						body.message = this.getNodeParameter('commitMessage', i) as string;

						if (this.getNodeParameter('binaryData', i)) {
							// Currently internally n8n uses base64 and also Github expects it base64 encoded.
							// If that ever changes the data has to get converted here.
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
							// TODO: Does this work with filesystem mode
							body.content = binaryData.data;
						} else {
							// Is text file
							// body.content = Buffer.from(this.getNodeParameter('fileContent', i) as string, 'base64');
							body.content = Buffer.from(
								this.getNodeParameter('fileContent', i) as string,
							).toString('base64');
						}

						endpoint = `/repos/${owner}/${repository}/contents/${encodeURI(filePath)}`;
					} else if (operation === 'delete') {
						// ----------------------------------
						//         delete
						// ----------------------------------

						requestMethod = 'DELETE';

						const additionalParameters = this.getNodeParameter(
							'additionalParameters',
							i,
							{},
						) as IDataObject;
						if (additionalParameters.author) {
							body.author = additionalParameters.author;
						}
						if (additionalParameters.committer) {
							body.committer = additionalParameters.committer;
						}
						if (
							additionalParameters.branch &&
							(additionalParameters.branch as IDataObject).branch
						) {
							body.branch = (additionalParameters.branch as IDataObject).branch;
						}

						const filePath = this.getNodeParameter('filePath', i);
						body.message = this.getNodeParameter('commitMessage', i) as string;

						body.sha = await getFileSha.call(
							this,
							owner,
							repository,
							filePath,
							body.branch as string | undefined,
						);

						endpoint = `/repos/${owner}/${repository}/contents/${encodeURI(filePath)}`;
					} else if (operation === 'get') {
						requestMethod = 'GET';

						const filePath = this.getNodeParameter('filePath', i);
						const additionalParameters = this.getNodeParameter(
							'additionalParameters',
							i,
						) as IDataObject;

						if (additionalParameters.reference) {
							qs.ref = additionalParameters.reference;
						}

						endpoint = `/repos/${owner}/${repository}/contents/${encodeURI(filePath)}`;
					} else if (operation === 'list') {
						requestMethod = 'GET';
						const filePath = this.getNodeParameter('filePath', i);
						endpoint = `/repos/${owner}/${repository}/contents/${encodeURI(filePath)}`;
					}
				} else if (resource === 'issue') {
					if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = 'POST';

						body.title = this.getNodeParameter('title', i) as string;
						body.body = this.getNodeParameter('body', i) as string;
						const labels = this.getNodeParameter('labels', i) as IDataObject[];

						const assignees = this.getNodeParameter('assignees', i) as IDataObject[];

						body.labels = labels.map((data) => data.label);
						body.assignees = assignees.map((data) => data.assignee);

						endpoint = `/repos/${owner}/${repository}/issues`;
					} else if (operation === 'createComment') {
						// ----------------------------------
						//         createComment
						// ----------------------------------
						requestMethod = 'POST';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						body.body = this.getNodeParameter('body', i) as string;

						endpoint = `/repos/${owner}/${repository}/issues/${issueNumber}/comments`;
					} else if (operation === 'edit') {
						// ----------------------------------
						//         edit
						// ----------------------------------

						requestMethod = 'PATCH';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						body = this.getNodeParameter('editFields', i, {}) as IDataObject;

						if (body.labels !== undefined) {
							body.labels = (body.labels as IDataObject[]).map((data) => data.label);
						}
						if (body.assignees !== undefined) {
							body.assignees = (body.assignees as IDataObject[]).map((data) => data.assignee);
						}

						endpoint = `/repos/${owner}/${repository}/issues/${issueNumber}`;
					} else if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						endpoint = `/repos/${owner}/${repository}/issues/${issueNumber}`;
					} else if (operation === 'lock') {
						// ----------------------------------
						//         lock
						// ----------------------------------

						requestMethod = 'PUT';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						qs.lock_reason = this.getNodeParameter('lockReason', i) as string;

						endpoint = `/repos/${owner}/${repository}/issues/${issueNumber}/lock`;
					}
				} else if (resource === 'release') {
					if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = 'POST';

						body = this.getNodeParameter('additionalFields', i, {});

						body.tag_name = this.getNodeParameter('releaseTag', i) as string;

						endpoint = `/repos/${owner}/${repository}/releases`;
					}
					if (operation === 'delete') {
						// ----------------------------------
						//         delete
						// ----------------------------------

						requestMethod = 'DELETE';

						const releaseId = this.getNodeParameter('release_id', i) as string;

						endpoint = `/repos/${owner}/${repository}/releases/${releaseId}`;
					}
					if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const releaseId = this.getNodeParameter('release_id', i) as string;

						endpoint = `/repos/${owner}/${repository}/releases/${releaseId}`;
					}
					if (operation === 'getAll') {
						// ----------------------------------
						//         getAll
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/repos/${owner}/${repository}/releases`;

						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}
					}
					if (operation === 'update') {
						// ----------------------------------
						//         update
						// ----------------------------------

						requestMethod = 'PATCH';

						const releaseId = this.getNodeParameter('release_id', i) as string;

						body = this.getNodeParameter('additionalFields', i, {});

						endpoint = `/repos/${owner}/${repository}/releases/${releaseId}`;
					}
				} else if (resource === 'repository') {
					if (operation === 'listPopularPaths') {
						// ----------------------------------
						//         listPopularPaths
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/repos/${owner}/${repository}/traffic/popular/paths`;
					} else if (operation === 'listReferrers') {
						// ----------------------------------
						//         listReferrers
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/repos/${owner}/${repository}/traffic/popular/referrers`;
					} else if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/repos/${owner}/${repository}`;
					} else if (operation === 'getLicense') {
						// ----------------------------------
						//         getLicense
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/repos/${owner}/${repository}/license`;
					} else if (operation === 'getIssues') {
						// ----------------------------------
						//         getIssues
						// ----------------------------------

						requestMethod = 'GET';

						qs = this.getNodeParameter('getRepositoryIssuesFilters', i) as IDataObject;

						endpoint = `/repos/${owner}/${repository}/issues`;

						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}
					}
				} else if (resource === 'review') {
					if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------
						requestMethod = 'GET';

						const reviewId = this.getNodeParameter('reviewId', i) as string;

						const pullRequestNumber = this.getNodeParameter('pullRequestNumber', i) as string;

						endpoint = `/repos/${owner}/${repository}/pulls/${pullRequestNumber}/reviews/${reviewId}`;
					} else if (operation === 'getAll') {
						// ----------------------------------
						//         getAll
						// ----------------------------------
						requestMethod = 'GET';

						returnAll = this.getNodeParameter('returnAll', 0);

						const pullRequestNumber = this.getNodeParameter('pullRequestNumber', i) as string;

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}

						endpoint = `/repos/${owner}/${repository}/pulls/${pullRequestNumber}/reviews`;
					} else if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------
						requestMethod = 'POST';

						const pullRequestNumber = this.getNodeParameter('pullRequestNumber', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i);
						Object.assign(body, additionalFields);

						body.event = snakeCase(this.getNodeParameter('event', i) as string).toUpperCase();
						if (body.event === 'REQUEST_CHANGES' || body.event === 'COMMENT') {
							body.body = this.getNodeParameter('body', i) as string;
						}

						endpoint = `/repos/${owner}/${repository}/pulls/${pullRequestNumber}/reviews`;
					} else if (operation === 'update') {
						// ----------------------------------
						//         update
						// ----------------------------------
						requestMethod = 'PUT';

						const pullRequestNumber = this.getNodeParameter('pullRequestNumber', i) as string;
						const reviewId = this.getNodeParameter('reviewId', i) as string;

						body.body = this.getNodeParameter('body', i) as string;

						endpoint = `/repos/${owner}/${repository}/pulls/${pullRequestNumber}/reviews/${reviewId}`;
					}
				} else if (resource === 'user') {
					if (operation === 'getRepositories') {
						// ----------------------------------
						//         getRepositories
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/users/${owner}/repos`;

						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}
					} else if (operation === 'invite') {
						// ----------------------------------
						//            invite
						// ----------------------------------

						requestMethod = 'POST';
						const org = this.getNodeParameter('organization', i) as string;
						endpoint = `/orgs/${org}/invitations`;
						body.email = this.getNodeParameter('email', i) as string;
					}
				} else if (resource === 'organization') {
					if (operation === 'getRepositories') {
						// ----------------------------------
						//         getRepositories
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/orgs/${owner}/repos`;
						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}
					}
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
						itemIndex: i,
					});
				}

				const asBinaryProperty = this.getNodeParameter('asBinaryProperty', i, false) as boolean;
				if (returnAll) {
					responseData = await githubApiRequestAllItems.call(
						this,
						requestMethod,
						endpoint,
						body,
						qs,
					);
				} else {
					responseData = await githubApiRequest.call(this, requestMethod, endpoint, body, qs);
				}

				if (fullOperation === 'file:get') {
					if (asBinaryProperty) {
						if (Array.isArray(responseData) && responseData.length > 1) {
							throw new NodeOperationError(this.getNode(), 'File Path is a folder, not a file.', {
								itemIndex: i,
							});
						}
						// Add the returned data to the item as binary property
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);

						const newItem: INodeExecutionData = {
							json: items[i].json,
							binary: {},
							pairedItem: items[i].pairedItem,
						};

						if (items[i].binary !== undefined) {
							// Create a shallow copy of the binary data so that the old
							// data references which do not get changed still stay behind
							// but the incoming data does not get changed.
							Object.assign(newItem.binary as object, items[i].binary!);
						}
						const { content, path } = responseData;
						newItem.binary![binaryPropertyName] = await this.helpers.prepareBinaryData(
							Buffer.from(content as string, 'base64'),
							path as string,
						);

						returnData.push(newItem);
						continue;
					}
				}

				if (fullOperation === 'release:delete') {
					responseData = { success: true };
				}

				if (
					overwriteDataOperations.includes(fullOperation) ||
					overwriteDataOperationsArray.includes(fullOperation)
				) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as IDataObject[]),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					if (
						overwriteDataOperations.includes(fullOperation) ||
						overwriteDataOperationsArray.includes(fullOperation)
					) {
						const executionErrorData = this.helpers.constructExecutionMetaData(
							[
								{
									json: {
										error: error.message,
									},
								},
							],
							{ itemData: { item: i } },
						);
						returnData.push(...executionErrorData);
					} else {
						items[i].json = { error: error.message };
					}
					continue;
				}
				throw error;
			}
		}

		if (
			overwriteDataOperations.includes(fullOperation) ||
			overwriteDataOperationsArray.includes(fullOperation)
		) {
			// Return data gets replaced
			return [returnData];
		} else {
			// For all other ones simply return the unchanged items
			return [items];
		}
	}
}
