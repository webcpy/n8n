export const filters = (conditions: any) => [
	{
		"displayName": "属性名称或 ID",
		"name": "key",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getFilterProperties",
			"loadOptionsDependsOn": ["datatabaseId"]
		},
		"default": "",
		"description": "要根据其进行过滤的属性的名称。从列表中选择，或使用表达式指定 ID。",
	},
	{
		"displayName": "类型",
		"name": "type",
		"type": "hidden",
		"default": "={{$parameter[\"&key\"].split(\"|\")[1]}}",
	},

	...conditions,

	{
		"displayName": "标题",
		"name": "titleValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["title"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "文本",
		"name": "richTextValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["rich_text"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "电话号码",
		"name": "phoneNumberValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["phone_number"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": "",
		"description": "电话号码。不强制使用任何结构。"
	},
	{
		"displayName": "选项名称或ID",
		"name": "multiSelectValue",
		"type": "options",
		"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID",
		"typeOptions": {
			"loadOptionsMethod": "getPropertySelectValues"
		},
		"displayOptions": {
			"show": {
				"type": ["multi_select"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": []
	},
	{
		"displayName": "选项名称或ID",
		"name": "selectValue",
		"type": "options",
		"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID",
		"typeOptions": {
			"loadOptionsMethod": "getPropertySelectValues"
		},
		"displayOptions": {
			"show": {
				"type": ["select"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "状态名称或ID",
		"name": "statusValue",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getPropertySelectValues"
		},
		"displayOptions": {
			"show": {
				"type": ["status"]
			}
		},
		"default": "",
		"description": "从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID"
	},

	{
		"displayName": "电子邮件",
		"name": "emailValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["email"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "URL",
		"name": "urlValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["url"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "用户名或ID",
		"name": "peopleValue",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getUsers"
		},
		"displayOptions": {
			"show": {
				"type": ["people"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": "",
		"description": "用户列表。多个用户可以用逗号分隔定义。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID。"
	},

	{
		"displayName": "用户名或ID",
		"name": "createdByValue",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getUsers"
		},
		"displayOptions": {
			"show": {
				"type": ["created_by"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": "",
		"description": "用户列表。多个用户可以用逗号分隔定义。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID。"
	},
	{
		"displayName": "用户名或ID",
		"name": "lastEditedByValue",
		"type": "options",
		"typeOptions": {
			"loadOptionsMethod": "getUsers"
		},
		"displayOptions": {
			"show": {
				"type": ["last_edited_by"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": "",
		"description": "用户列表。多个用户可以用逗号分隔定义。从列表中选择，或使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a> 指定ID。"
	},
	{
		"displayName": "关联ID",
		"name": "relationValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["relation"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "已选中",
		"name": "checkboxValue",
		"displayOptions": {
			"show": {
				"type": ["checkbox"]
			}
		},
		"type": "boolean",
		"default": false,
		"description": "复选框是否被选中。true 代表选中。false 代表未选中。"
	},
	{
		"displayName": "数字",
		"name": "numberValue",
		"displayOptions": {
			"show": {
				"type": ["number"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"type": "number",
		"default": 0,
		"description": "数字值"
	},
	{
		"displayName": "日期",
		"name": "date",
		"displayOptions": {
			"show": {
				"type": ["date"]
			},
			"hide": {
				"condition": [
					"is_empty",
					"is_not_empty",
					"past_week",
					"past_month",
					"past_year",
					"next_week",
					"next_month",
					"next_year"
				]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601 格式日期，可选包含时间"
	},
	{
		"displayName": "创建时间",
		"name": "createdTimeValue",
		"displayOptions": {
			"show": {
				"type": ["created_time"]
			},
			"hide": {
				"condition": [
					"is_empty",
					"is_not_empty",
					"past_week",
					"past_month",
					"past_year",
					"next_week",
					"next_month",
					"next_year"
				]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601 格式日期，可选包含时间"
	},
	{
		"displayName": "上次编辑时间",
		"name": "lastEditedTime",
		"displayOptions": {
			"show": {
				"type": ["last_edited_time"]
			},
			"hide": {
				"condition": [
					"is_empty",
					"is_not_empty",
					"past_week",
					"past_month",
					"past_year",
					"next_week",
					"next_month",
					"next_year"
				]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601 格式日期，可选包含时间"
	},
	//formula types
	{
		"displayName": "数字",
		"name": "numberValue",
		"displayOptions": {
			"show": {
				"type": ["formula"],
				"returnType": ["number"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"type": "number",
		"default": 0,
		"description": "数字值"
	},
	{
		"displayName": "文本",
		"name": "textValue",
		"type": "string",
		"displayOptions": {
			"show": {
				"type": ["formula"],
				"returnType": ["text"]
			},
			"hide": {
				"condition": ["is_empty", "is_not_empty"]
			}
		},
		"default": ""
	},
	{
		"displayName": "布尔值",
		"name": "checkboxValue",
		"displayOptions": {
			"show": {
				"type": ["formula"],
				"returnType": ["checkbox"]
			}
		},
		"type": "boolean",
		"default": false,
		"description": "复选框是否被选中。true 代表选中。false 代表未选中。"
	},
	{
		"displayName": "日期",
		"name": "dateValue",
		"displayOptions": {
			"show": {
				"type": ["formula"],
				"returnType": ["date"]
			},
			"hide": {
				"condition": [
					"is_empty",
					"is_not_empty",
					"past_week",
					"past_month",
					"past_year",
					"next_week",
					"next_month",
					"next_year"
				]
			}
		},
		"type": "dateTime",
		"default": "",
		"description": "ISO 8601 格式日期，可选包含时间"
	}
];
