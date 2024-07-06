import type { INodeProperties } from 'n8n-workflow';

export const draftOperations: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["draft"]
			}
		},
		"options": [
			{
				"name": "创建",
				"value": "create",
				"action": "创建草稿"
			},
			{
				"name": "删除",
				"value": "delete",
				"action": "删除草稿"
			},
			{
				"name": "获取",
				"value": "get",
				"action": "获取草稿"
			},
			{
				"name": "获取多个",
				"value": "getAll",
				"action": "获取多个草稿"
			}
		],
		"default": "create"
	}
];

export const draftFields: INodeProperties[] = [
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["delete", "get"]
			}
		},
		"default": "",
		"displayName": "草稿 ID",
		"placeholder": "r-3254521568507167962",
		"name": "messageId",
		"type": "string",
		"required": true
	},
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["create"]
			}
		},
		"default": "",
		"displayName": "主题",
		"placeholder": "Hello World!",
		"name": "subject",
		"type": "string",
		"required": true
	},
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["create"]
			}
		},
		"default": "text",
		"displayName": "邮件类型",
		"name": "emailType",
		"type": "options",
		"required": true,
		"noDataExpression": true,
		"options": [
			{
				"name": "HTML",
				"value": "html"
			},
			{
				"name": "文本",
				"value": "text"
			}
		]
	},
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["create"]
			}
		},
		"default": "",
		"displayName": "消息",
		"name": "message",
		"type": "string",
		"required": true
	},
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["create"]
			}
		},
		"default": {},
		"placeholder": "添加选项",
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"options": [
			{
				"default": "",
				"displayName": "收件人邮箱",
				"name": "sendTo",
				"placeholder": "info@example.com",
				"description": "收件人的电子邮件地址。多个地址可以用逗号分隔。例如 jay@getsby.com, jon@smith.com。",
				"type": "string"
			},
			{
				"default": "",
				"displayName": "密送",
				"name": "bccList",
				"description": "密送收件人的电子邮件地址。多个地址可以用逗号分隔。例如 jay@getsby.com, jon@smith.com。",
				"placeholder": "info@example.com",
				"type": "string"
			},
			{
				"default": "",
				"displayName": "抄送",
				"name": "ccList",
				"description": "抄送收件人的电子邮件地址。多个地址可以用逗号分隔。例如 jay@getsby.com, jon@smith.com。",
				"placeholder": "info@example.com",
				"type": "string"
			},
			{
				"default": "",
				"displayName": "回复地址",
				"name": "replyTo",
				"placeholder": "reply@example.com",
				"description": "回复消息发送到的电子邮件地址",
				"type": "string"
			},
			{
				"default": {},
				"displayName": "附件",
				"name": "attachmentsUi",
				"placeholder": "添加附件",
				"description": "要添加到消息的支持附件数组",
				"type": "fixedCollection",
				"typeOptions": {
					"multipleValues": true
				},
				"options": [
					{
						"values": [
							{
								"default": "",
								"displayName": "附件字段名称（在输入中）",
								"name": "property",
								"description": "从输入节点添加字段名称。可以使用逗号分隔多个属性。",
								"type": "string"
							}
						],
						"name": "attachmentsBinary",
						"displayName": "附件二进制"
					}
				]
			}
		]
	},
	{
		"displayOptions": {
			"show": {
				"resource": ["draft"],
				"operation": ["get"]
			}
		},
		"default": {},
		"placeholder": "添加选项",
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"options": [
			{
				"default": "attachment_",
				"displayName": "附件前缀",
				"name": "dataPropertyAttachmentsPrefixName",
				"description": "要写入附件的二进制属性名称的前缀。将添加从0开始的索引。例如，如果名称为'attachment_'，则第一个附件将保存为'attachment_0'。",
				"type": "string"
			},
			{
				"default": false,
				"displayName": "下载附件",
				"name": "downloadAttachments",
				"description": "是否下载草稿的附件",
				"type": "boolean"
			}
		]
	},

	/* -------------------------------------------------------------------------- */
	/*                                 draft:getAll                               */
	/* -------------------------------------------------------------------------- */
	{
		"default": false,
		"description": "是否返回所有结果或仅返回给定限制数目",
		"displayName": "返回所有",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["draft"]
			}
		},
		"name": "returnAll",
		"type": "boolean"
	},
	{
		"default": 50,
		"description": "要返回的最大结果数",
		"displayName": "限制",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["draft"],
				"returnAll": [false]
			}
		},
		"name": "limit",
		"type": "number",
		"typeOptions": {
			"minValue": 1,
			"maxValue": 500
		}
	},
	{
		"default": {},
		"description": "要写入附件的二进制属性名称的前缀。将添加从0开始的索引。例如，如果名称为'attachment_'，则第一个附件将保存为'attachment_0'。",
		"displayName": "选项",
		"placeholder": "添加选项",
		"displayOptions": {
			"show": {
				"operation": ["getAll"],
				"resource": ["draft"]
			}
		},
		"name": "options",
		"type": "collection",
		"options": [
			{
				"default": "attachment_",
				"description": "是否下载草稿的附件",
				"displayName": "附件前缀",
				"name": "dataPropertyAttachmentsPrefixName",
				"type": "string"
			},
			{
				"default": false,
				"description": "是否包含来自SPAM和TRASH的消息",
				"displayName": "包括垃圾邮件和回收站",
				"name": "includeSpamTrash",
				"type": "boolean"
			},
			{
				"default": false,
				"description": "是否下载草稿的附件",
				"displayName": "下载附件",
				"name": "downloadAttachments",
				"type": "boolean"
			}
		]
	}
];
