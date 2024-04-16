import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { gitlabApiRequest, gitlabApiRequestAllItems } from './GenericFunctions';

export class Gitlab implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitLab',
		name: 'gitlab',
		icon: 'file:gitlab.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '从 GitLab API 获取数据',
		defaults: {
			name: 'GitLab',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'gitlabApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['accessToken'],
					},
				},
			},
			{
				name: 'gitlabOAuth2Api',
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
						"name": "Access Token",
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
						"name": "发布",
						"value": "release"
					},
					{
						"name": "存储库",
						"value": "repository"
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
						"resource": ["issue"]
					}
				},
				"options": [
					{
						"name": "Create",
						"value": "create",
						"description": "创建一个新问题",
						"action": "创建一个问题"
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
						"description": "编辑一个问题",
						"action": "编辑一个问题"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取单个问题的数据",
						"action": "获取一个问题"
					},
					{
						"name": "锁定",
						"value": "lock",
						"description": "锁定一个问题",
						"action": "锁定一个问题"
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
						"description": "获取单个存储库的数据",
						"action": "获取一个存储库"
					},
					{
						"name": "获取问题",
						"value": "getIssues",
						"description": "返回存储库的问题",
						"action": "获取存储库的问题"
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
						"name": "获取存储库",
						"value": "getRepositories",
						"description": "返回用户的存储库",
						"action": "获取用户的存储库"
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
						"description": "创建一个新发布",
						"action": "创建一个发布"
					},
					{
						"name": "删除",
						"value": "delete",
						"description": "删除一个发布",
						"action": "删除一个发布"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取一个发布",
						"action": "获取一个发布"
					},
					{
						"name": "获取多个",
						"value": "getAll",
						"description": "获取多个发布",
						"action": "获取多个发布"
					},
					{
						"name": "更新",
						"value": "update",
						"description": "更新一个发布",
						"action": "更新一个发布"
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
						"description": "在存储库中创建一个新文件",
						"action": "创建一个文件"
					},
					{
						"name": "删除",
						"value": "delete",
						"description": "在存储库中删除一个文件",
						"action": "删除一个文件"
					},
					{
						"name": "编辑",
						"value": "edit",
						"description": "在存储库中编辑一个文件",
						"action": "编辑一个文件"
					},
					{
						"name": "获取",
						"value": "get",
						"description": "获取单个文件的数据",
						"action": "获取一个文件"
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


			// ----------------------------------
			//         shared
			// ----------------------------------
			{
				"displayName": "项目所有者",
				"name": "owner",
				"type": "string",
				"default": "",
				"required": true,
				"placeholder": "n8n-io",
				"description": "项目的用户、组或命名空间"
			},
			{
				"displayName": "项目名称",
				"name": "repository",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"hide": {
						"resource": ["user"],
						"operation": ["getRepositories"]
					}
				},
				"placeholder": "n8n",
				"description": "项目的名称"
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
				"displayName": "截止日期",
				"name": "due_date",
				"type": "dateTime",
				"displayOptions": {
					"show": {
						"operation": ["create"],
						"resource": ["issue"]
					}
				},
				"default": "",
				"description": "问题的截止日期"
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
				"displayName": "负责人",
				"name": "assignee_ids",
				"type": "collection",
				"typeOptions": {
					"multipleValues": true,
					"multipleValueButtonText": "添加负责人"
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
						"displayName": "负责人",
						"name": "assignee",
						"type": "number",
						"default": 0,
						"description": "要分配问题给的用户ID"
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
						"name": "description",
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
								"description": "将状态设置为“关闭”"
							},
							{
								"name": "开放",
								"value": "open",
								"description": "将状态设置为“开放”"
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
						"name": "assignee_ids",
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
								"description": "要分配问题的用户"
							}
						]
					},
					{
						"displayName": "截止日期",
						"name": "due_date",
						"type": "dateTime",
						"default": "",
						"description": "问题的截止日期"
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
						"description": "问题与主题不符"
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
						"name": "垃圾邮件",
						"value": "spam",
						"description": "问题是垃圾邮件"
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
				"displayName": "附加字段",
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
						"description": "发布的名称"
					},
					{
						"displayName": "描述",
						"name": "description",
						"type": "string",
						"typeOptions": {
							"rows": 5
						},
						"default": "",
						"description": "发布的描述"
					},
					{
						"displayName": "Ref",
						"name": "ref",
						"type": "string",
						"default": "",
						"description": "如果标签不存在，则发布将从 Ref 创建。它可以是提交 SHA、另一个标签名称或分支名称。"
					}
				]
			},


			// ----------------------------------
			//         release:get/delete
			// ----------------------------------
			{
				"displayName": "项目ID",
				"name": "projectId",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["delete", "get"],
						"resource": ["release"]
					}
				},
				"description": "项目的ID或URL编码的路径"
			},
			{
				"displayName": "标签名称",
				"name": "tag_name",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["delete", "get"],
						"resource": ["release"]
					}
				},
				"description": "与发布关联的Git标签"
			},


			// ----------------------------------
			//         release:getAll
			// ----------------------------------
			{
				"displayName": "项目ID",
				"name": "projectId",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["getAll"],
						"resource": ["release"]
					}
				},
				"description": "项目的ID或URL编码的路径"
			},
			{
				"displayName": "Return All",
				"name": "returnAll",
				"type": "boolean",
				"displayOptions": {
					"show": {
						"resource": ["release", "file", "repository"],
						"operation": ["getAll", "list", "getIssues"]
					}
				},
				"default": false,
				"description": "是否返回所有结果或仅返回给定限制",
			},
			{
				"displayName": "限制",
				"name": "limit",
				"type": "number",
				"displayOptions": {
					"show": {
						"resource": ["release", "file", "repository"],
						"operation": ["getAll", "list", "getIssues"],
						"returnAll": [false]
					}
				},
				"typeOptions": {
					"minValue": 1,
					"maxValue": 100
				},
				"default": 20,
				"description": "要返回的最大结果数"
			},
			{
				"displayName": "Additional Fields",
				"name": "additionalFields",
				"type": "collection",
				"typeOptions": {
					"multipleValueButtonText": "Add Field"
				},
				"displayOptions": {
					"show": {
						"operation": ["getAll"],
						"resource": ["release"]
					}
				},
				"default": {},
				"options": [
					{
						"displayName": "Order By",
						"name": "order_by",
						"type": "options",
						"options": [
							{
								"name": "Created At",
								"value": "created_at"
							},
							{
								"name": "Released At",
								"value": "released_at"
							}
						],
						"default": "released_at",
						"description": "用作排序的字段"
					},
					{
						"displayName": "Sort",
						"name": "sort",
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
						"description": "排序方向"
					}
				]
			},


			// ----------------------------------
			//         release:update
			// ----------------------------------
			{
				"displayName": "显示名称",
				"name": "projectId",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["update"],
						"resource": ["release"]
					}
				},
				"description": "项目的ID或URL编码的路径"
			},
			{
				"displayName": "标签名称",
				"name": "tag_name",
				"type": "string",
				"default": "",
				"required": true,
				"displayOptions": {
					"show": {
						"operation": ["update"],
						"resource": ["release"]
					}
				},
				"description": "与发布关联的Git标签"
			},
			{
				"displayName": "附加字段",
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
						"displayName": "名称",
						"name": "name",
						"type": "string",
						"default": "",
						"description": "发布的名称"
					},
					{
						"displayName": "描述",
						"name": "description",
						"type": "string",
						"default": "",
						"description": "发布的描述。您可以使用Markdown。",
					},
					{
						"displayName": "里程碑",
						"name": "milestones",
						"type": "string",
						"default": "",
						"description": "要与发布关联的每个里程碑的标题（提供以逗号分隔的标题列表）",
					},
					{
						"displayName": "发布时间",
						"name": "released_at",
						"type": "dateTime",
						"default": "",
						"description": "发布准备就绪的日期",
					}
				]
			},

			// ----------------------------------
			//         repository
			// ----------------------------------

			// ----------------------------------
			//         repository:getIssues
			// ----------------------------------
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
						"name": "assignee_username",
						"type": "string",
						"default": "",
						"description": "仅返回分配给特定用户的问题"
					},
					{
						"displayName": "创建者",
						"name": "author_username",
						"type": "string",
						"default": "",
						"description": "仅返回由特定用户创建的问题"
					},
					{
						"displayName": "搜索",
						"name": "search",
						"type": "string",
						"default": "",
						"description": "根据标题和描述搜索问题"
					},
					{
						"displayName": "标签",
						"name": "labels",
						"type": "string",
						"default": "",
						"description": "仅返回具有指定标签的问题。多个标签可以用逗号分隔。",
					},
					{
						"displayName": "更新时间在之后",
						"name": "updated_after",
						"type": "dateTime",
						"default": "",
						"description": "仅返回在此时间之后更新的问题"
					},
					{
						"displayName": "状态",
						"name": "state",
						"type": "options",
						"options": [
							{
								"name": "全部",
								"value": "",
								"description": "返回任何状态的问题"
							},
							{
								"name": "已关闭",
								"value": "closed",
								"description": "返回“已关闭”状态的问题"
							},
							{
								"name": "已打开",
								"value": "opened",
								"description": "返回“已打开”状态的问题"
							}
						],
						"default": "opened",
						"description": "要过滤的状态"
					},
					{
						"displayName": "排序",
						"name": "order_by",
						"type": "options",
						"options": [
							{
								"name": "创建时间",
								"value": "created_at",
								"description": "按创建日期排序"
							},
							{
								"name": "更新时间",
								"value": "updated_at",
								"description": "按更新日期排序"
							},
							{
								"name": "优先级",
								"value": "priority",
								"description": "按优先级排序"
							}
						],
						"default": "created_at",
						"description": "应返回问题的顺序"
					},
					{
						"displayName": "方向",
						"name": "sort",
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
				"displayOptions": {
					"show": {
						"resource": ["file"]
					},
					"hide": {
						"operation": ["list"]
					}
				},
				"placeholder": "docs/README.md",
				"description": "文件的文件路径。必须包含完整路径或将其留空以表示根文件夹。"
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
			{
				"displayName": "页面",
				"name": "page",
				"type": "number",
				"displayOptions": {
					"show": {
						"resource": ["file"],
						"operation": ["list"],
						"returnAll": [false]
					}
				},
				"typeOptions": {
					"minValue": 1,
					"maxValue": 1000
				},
				"default": 1,
				"description": "要显示的结果页码"
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
						"resource": ["file"],
						"operation": ["list"]
					}
				},
				"options": [
					{
						"displayName": "参考",
						"name": "ref",
						"type": "string",
						"default": "",
						"placeholder": "main",
						"description": "提交/分支/标签的名称。默认值为存储库的默认分支（通常为 main）。"
					},
					{
						"displayName": "递归",
						"name": "recursive",
						"type": "boolean",
						"default": false,
						"description": "是否获取递归文件树。默认值为 false。"
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
				"displayName": "将输出文件放入字段中",
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
						"displayName": "参考",
						"name": "reference",
						"type": "string",
						"default": "",
						"placeholder": "main",
						"description": "提交/分支/标签的名称。默认值为存储库的默认分支（通常为 main）。"
					}
				]
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
				"description": "是否从二进制字段获取要上传的数据"
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
				"displayName": "分支",
				"name": "branch",
				"type": "string",
				"default": "",
				"description": "要创建的新分支的名称。提交将添加到此分支。",
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
						"displayName": "开始分支",
						"name": "branchStart",
						"values": [
							{
								"displayName": "开始分支",
								"name": "branchStart",
								"type": "string",
								"default": "",
								"description": "从中创建新分支的基础分支的名称"
							}
						]
					},
					{
						"name": "author",
						"displayName": "作者",
						"values": [
							{
								"displayName": "名称",
								"name": "name",
								"type": "string",
								"default": "",
								"description": "提交作者的名称"
							},
							{
								"displayName": "电子邮件",
								"name": "email",
								"type": "string",
								"placeholder": "name@email.com",
								"default": "",
								"description": "提交作者的电子邮件"
							}
						]
					},
					{
						"name": "encoding",
						"displayName": "编码",
						"values": [
							{
								"displayName": "编码",
								"name": "encoding",
								"type": "string",
								"default": "text",
								"description": "将编码更改为 base64。默认为文本。"
							}
						]
					}
				]
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// let _credentials;

		// const authenticationMethod = this.getNodeParameter('authentication', 0);

		// try {
		// 	if (authenticationMethod === 'accessToken') {
		// 		_credentials = await this.getCredentials('gitlabApi');
		// 	} else {
		// 		_credentials = await this.getCredentials('gitlabOAuth2Api');
		// 	}
		// } catch (error) {
		// 	if (this.continueOnFail()) {
		// 		return [this.helpers.returnJsonArray([{ error: error.message }])];
		// 	}
		// 	throw new NodeOperationError(this.getNode(), error as Error);
		// }

		// Operations which overwrite the returned data
		const overwriteDataOperations = [
			'file:get',
			'file:create',
			'file:edit',
			'file:delete',
			'issue:create',
			'issue:createComment',
			'issue:edit',
			'issue:get',
			'release:create',
			'release:delete',
			'release:get',
			'release:update',
			'repository:get',
		];
		// Operations which overwrite the returned data and return arrays
		// and has so to be merged with the data of other items
		const overwriteDataOperationsArray = [
			'file:list',
			'release:getAll',
			'repository:getIssues',
			'user:getRepositories',
		];

		let responseData;
		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;
		let returnAll = false;

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

				// Request the parameters which almost all operations need
				let owner = this.getNodeParameter('owner', i) as string;

				// Replace all slashes to work with subgroups
				owner = owner.replace(new RegExp(/\//g), '%2F');

				let repository = '';
				if (fullOperation !== 'user:getRepositories') {
					repository = this.getNodeParameter('repository', i) as string;
				}

				const baseEndpoint = `/projects/${owner}%2F${repository}`;

				if (resource === 'issue') {
					if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = 'POST';

						body.title = this.getNodeParameter('title', i) as string;
						body.description = this.getNodeParameter('body', i) as string;
						body.due_date = this.getNodeParameter('due_date', i) as string;
						const labels = this.getNodeParameter('labels', i) as IDataObject[];

						const assigneeIds = this.getNodeParameter('assignee_ids', i) as IDataObject[];

						body.labels = labels.map((data) => data.label).join(',');
						body.assignee_ids = assigneeIds.map((data) => data.assignee);

						endpoint = `${baseEndpoint}/issues`;
					} else if (operation === 'createComment') {
						// ----------------------------------
						//         createComment
						// ----------------------------------
						requestMethod = 'POST';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						body.body = this.getNodeParameter('body', i) as string;

						endpoint = `${baseEndpoint}/issues/${issueNumber}/notes`;
					} else if (operation === 'edit') {
						// ----------------------------------
						//         edit
						// ----------------------------------

						requestMethod = 'PUT';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						body = this.getNodeParameter('editFields', i, {}) as IDataObject;

						if (body.labels !== undefined) {
							body.labels = (body.labels as IDataObject[]).map((data) => data.label).join(',');
						}
						if (body.assignee_ids !== undefined) {
							body.assignee_ids = (body.assignee_ids as IDataObject[]).map((data) => data.assignee);
						}

						endpoint = `${baseEndpoint}/issues/${issueNumber}`;
					} else if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						endpoint = `${baseEndpoint}/issues/${issueNumber}`;
					} else if (operation === 'lock') {
						// ----------------------------------
						//         lock
						// ----------------------------------

						requestMethod = 'PUT';

						const issueNumber = this.getNodeParameter('issueNumber', i) as string;

						body.discussion_locked = true;

						endpoint = `${baseEndpoint}/issues/${issueNumber}`;
					}
				} else if (resource === 'release') {
					if (operation === 'create') {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = 'POST';

						body = this.getNodeParameter('additionalFields', i, {});

						body.tag_name = this.getNodeParameter('releaseTag', i) as string;

						endpoint = `${baseEndpoint}/releases`;
					}
					if (operation === 'delete') {
						// ----------------------------------
						//         delete
						// ----------------------------------

						requestMethod = 'DELETE';

						const id = this.getNodeParameter('projectId', i) as string;

						const tagName = this.getNodeParameter('tag_name', i) as string;

						endpoint = `/projects/${id}/releases/${tagName}`;
					}
					if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const id = this.getNodeParameter('projectId', i) as string;

						const tagName = this.getNodeParameter('tag_name', i) as string;

						endpoint = `/projects/${id}/releases/${tagName}`;
					}
					if (operation === 'getAll') {
						// ----------------------------------
						//         getAll
						// ----------------------------------

						requestMethod = 'GET';

						const id = this.getNodeParameter('projectId', i) as string;

						qs = this.getNodeParameter('additionalFields', i, {});

						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}

						endpoint = `/projects/${id}/releases`;
					}
					if (operation === 'update') {
						// ----------------------------------
						//         update
						// ----------------------------------

						requestMethod = 'PUT';

						const id = this.getNodeParameter('projectId', i) as string;

						const tagName = this.getNodeParameter('tag_name', i) as string;

						body = this.getNodeParameter('additionalFields', i, {});
						if (body.milestones) {
							body.milestones = (body.milestones as string).split(',');
						}

						endpoint = `/projects/${id}/releases/${tagName}`;
					}
				} else if (resource === 'repository') {
					if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `${baseEndpoint}`;
					} else if (operation === 'getIssues') {
						// ----------------------------------
						//         getIssues
						// ----------------------------------

						requestMethod = 'GET';

						qs = this.getNodeParameter('getRepositoryIssuesFilters', i) as IDataObject;

						returnAll = this.getNodeParameter('returnAll', 0);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', 0);
						}

						endpoint = `${baseEndpoint}/issues`;
					}
				} else if (resource === 'user') {
					if (operation === 'getRepositories') {
						// ----------------------------------
						//         getRepositories
						// ----------------------------------

						requestMethod = 'GET';

						endpoint = `/users/${owner}/projects`;
					}
				} else if (resource === 'file') {
					if (['create', 'edit'].includes(operation)) {
						// ----------------------------------
						//         create
						// ----------------------------------

						requestMethod = operation === 'create' ? 'POST' : 'PUT';

						const filePath = this.getNodeParameter('filePath', i);
						const additionalParameters = this.getNodeParameter(
							'additionalParameters',
							i,
						) as IDataObject;

						body.branch = this.getNodeParameter('branch', i) as string;
						body.commit_message = this.getNodeParameter('commitMessage', i) as string;

						if (additionalParameters.author) {
							body.author = additionalParameters.author;
						}
						if (
							additionalParameters.branchStart &&
							(additionalParameters.branchStart as IDataObject).branchStart
						) {
							body.start_branch = (additionalParameters.branchStart as IDataObject).branchStart;
						}

						if (this.getNodeParameter('binaryData', i)) {
							// Currently internally n8n uses base64 and also GitLab expects it base64 encoded.
							// If that ever changes the data has to get converted here.
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
							// TODO: Does this work with filesystem mode
							body.content = binaryData.data;
							body.encoding = 'base64';
						} else {
							// Is text file
							if (additionalParameters.encoding === 'base64') {
								body.content = Buffer.from(
									this.getNodeParameter('fileContent', i) as string,
								).toString('base64');
							} else {
								body.content = this.getNodeParameter('fileContent', i) as string;
							}
						}

						endpoint = `${baseEndpoint}/repository/files/${encodeURIComponent(filePath)}`;
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
						body.branch = this.getNodeParameter('branch', i) as string;
						body.commit_message = this.getNodeParameter('commitMessage', i) as string;

						const filePath = this.getNodeParameter('filePath', i);

						endpoint = `${baseEndpoint}/repository/files/${encodeURIComponent(filePath)}`;
					} else if (operation === 'get') {
						// ----------------------------------
						//         get
						// ----------------------------------

						requestMethod = 'GET';

						const filePath = this.getNodeParameter('filePath', i);
						const additionalParameters = this.getNodeParameter(
							'additionalParameters',
							i,
						) as IDataObject;

						if (additionalParameters.reference) {
							qs.ref = additionalParameters.reference;
						} else {
							qs.ref = 'master';
						}

						endpoint = `${baseEndpoint}/repository/files/${encodeURIComponent(filePath)}`;
					} else if (operation === 'list') {
						requestMethod = 'GET';

						const filePath = this.getNodeParameter('filePath', i);

						qs = this.getNodeParameter('additionalParameters', i, {}) as IDataObject;
						returnAll = this.getNodeParameter('returnAll', i);

						if (!returnAll) {
							qs.per_page = this.getNodeParameter('limit', i);
							qs.page = this.getNodeParameter('page', i);
						}

						if (filePath) {
							qs.path = filePath;
						}
						endpoint = `${baseEndpoint}/repository/tree`;
					}
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
						itemIndex: i,
					});
				}

				const asBinaryProperty = this.getNodeParameter('asBinaryProperty', i, false) as boolean;
				if (returnAll) {
					responseData = await gitlabApiRequestAllItems.call(
						this,
						requestMethod,
						endpoint,
						body,
						qs,
					);
				} else {
					responseData = await gitlabApiRequest.call(this, requestMethod, endpoint, body, qs);
				}

				if (fullOperation === 'file:get' && asBinaryProperty) {
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

					items[i] = newItem;

					return [items];
				}

				if (
					overwriteDataOperations.includes(fullOperation) ||
					overwriteDataOperationsArray.includes(fullOperation)
				) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData as IDataObject),
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
							this.helpers.returnJsonArray({ error: error.message }),
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
