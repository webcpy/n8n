/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeProperties } from 'n8n-workflow';

export const webhookPath: INodeProperties = {
	"displayName": "表单路径",
	"name": "path",
	"type": "string",
	"default": "",
	"placeholder": "webhook",
	"required": true,
	"description": "表单 URL 的最后一部分，用于测试和生产环境"
};

export const formTitle: INodeProperties = {
	"displayName": "表单标题",
	"name": "formTitle",
	"type": "string",
	"default": "",
	"placeholder": "例如：联系我们",
	"required": true,
	"description": "显示在表单顶部"
};

export const formDescription: INodeProperties = {
	"displayName": "表单描述",
	"name": "formDescription",
	"type": "string",
	"default": "",
	"placeholder": "例如：我们会尽快与您联系",
	"description": "显示在表单标题下方。可用于提示用户如何填写表单。"
};

export const formFields: INodeProperties = {
	"displayName": "表单字段",
	"name": "formFields",
	"placeholder": "添加表单字段",
	"type": "fixedCollection",
	"default": { "values": [{ "label": "", "fieldType": "text" }] },
	"typeOptions": {
		"multipleValues": true,
		"sortable": true
	},
	"options": [
		{
			"displayName": "值",
			"name": "values",
			"values": [
				{
					"displayName": "字段标签",
					"name": "fieldLabel",
					"type": "string",
					"default": "",
					"placeholder": "例如：您的姓名是？",
					"description": "标签显示在输入字段上方",
					"required": true
				},
				{
					"displayName": "字段类型",
					"name": "fieldType",
					"type": "options",
					"default": "text",
					"description": "要添加到表单的字段类型",
					"options": [
						{ "name": "日期", "value": "date" },
						{ "name": "下拉列表", "value": "dropdown" },
						{ "name": "数字", "value": "number" },
						{ "name": "密码", "value": "password" },
						{ "name": "文本", "value": "text" },
						{ "name": "文本域", "value": "textarea" }
					],
					"required": true
				},
				{
					"displayName": "字段选项",
					"name": "fieldOptions",
					"placeholder": "添加字段选项",
					"description": "可从下拉列表中选择的选项列表",
					"type": "fixedCollection",
					"default": { "values": [{ "option": "" }] },
					"required": true,
					"displayOptions": {
						"show": {
							"fieldType": ["dropdown"]
						}
					},
					"typeOptions": {
						"multipleValues": true,
						"sortable": true
					},
					"options": [
						{
							"displayName": "值",
							"name": "values",
							"values": [
								{
									"displayName": "选项",
									"name": "option",
									"type": "string",
									"default": ""
								}
							]
						}
					]
				},
				{
					"displayName": "多选",
					"name": "multiselect",
					"type": "boolean",
					"default": false,
					"description": "是否允许用户从下拉列表中选择多个选项",
					"displayOptions": {
						"show": {
							"fieldType": ["dropdown"]
						}
					}
				},
				{
					"displayName": "必填字段",
					"name": "requiredField",
					"type": "boolean",
					"default": false,
					"description": "是否要求用户在提交表单之前为此字段输入值"
				}
			]
		}
	]
}


export const formRespondMode: INodeProperties = {
	"displayName": "响应时机",
	"name": "responseMode",
	"type": "options",
	"options": [
		{
			"name": "表单提交时",
			"value": "onReceived",
			"description": "一旦此节点接收到表单提交时"
		},
		{
			"name": "工作流程完成时",
			"value": "lastNode",
			"description": "当工作流程的最后一个节点执行完毕时"
		},
		{
			"name": "使用'响应Webhook'节点",
			"value": "responseNode",
			"description": "当执行'响应Webhook'节点时"
		}
	],
	"default": "onReceived",
	"description": "何时响应表单提交"
}


export const formTriggerPanel = {
	"header": "拉取测试表单提交",
	"executionsHelp": {
		"inactive": "表单触发器有两种模式：测试模式和生产模式。<br /><br /><b>在构建工作流程时使用测试模式</b>。点击“测试步骤”按钮，然后填写在弹出的标签页中打开的测试表单。执行将显示在编辑器中。<br /><br /><b>在自动运行工作流程时使用生产模式</b>。<a data-key=\"activate\">激活</a>工作流程，然后向生产URL发出请求。然后，每当通过生产表单URL进行表单提交时，工作流程将执行。这些执行将显示在执行列表中，但不会显示在编辑器中。",
		"active": "表单触发器有两种模式：测试模式和生产模式。<br /><br /><b>在构建工作流程时使用测试模式</b>。点击“测试步骤”按钮，然后填写在弹出的标签页中打开的测试表单。执行将显示在编辑器中。<br /><br /><b>在自动运行工作流程时使用生产模式</b>。<a data-key=\"activate\">激活</a>工作流程，然后向生产URL发出请求。然后，每当通过生产表单URL进行表单提交时，工作流程将执行。这些执行将显示在执行列表中，但不会显示在编辑器中。"
	},
	"activationHint": {
		"active": "此节点还将在新的表单提交时自动触发（但这些执行不会显示在这里）。",
		"inactive": "<a data-key=\"activate\">激活</a>此工作流程，以使其对通过生产URL创建的新表单提交自动运行。"
	}
}


export const respondWithOptions: INodeProperties = {
	"displayName": "表单响应",
	"name": "respondWithOptions",
	"type": "fixedCollection",
	"placeholder": "添加选项",
	"default": { "values": { "respondWith": "text" } },
	"options": [
		{
			"displayName": "数值",
			"name": "values",
			"values": [
				{
					displayName: "响应方式",
					"name": "respondWith",
					"type": "options",
					"default": "text",
					"options": [
						{
							"name": "表单提交文本",
							"value": "text",
							"description": "向用户显示响应文本"
						},
						{
							"name": "重定向 URL",
							"value": "redirect",
							"description": "将用户重定向到 URL"
						}
					]
				},
				{
					"displayName": "要显示的文本",
					"name": "formSubmittedText",
					"description": "用户填写表单后显示给用户的文本。如果不想显示任何附加文本，请留空。",
					"type": "string",
					"default": "您的响应已记录",
					"displayOptions": {
						"show": {
							"respondWith": ["text"]
						}
					}
				},
				{
					"displayName": "要重定向到的 URL",
					"name": "redirectUrl",
					"description": "用户填写表单后将其重定向到的 URL。必须是有效的 URL。",
					"type": "string",
					"default": "",
					"validateType": "url",
					"placeholder": "例如 http://www.n8n.io",
					"displayOptions": {
						"show": {
							"respondWith": ["redirect"]
						}
					}
				}
			]
		}
	]
}
