import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const FormatDateDescription: INodeProperties[] = [
	{
		"displayName": "您还可以使用表达式进行此操作，例如：<code>{{your_date.format('yyyy-MM-dd')}}</code>。<a target='_blank' href='https://docs.n8n.io/code-examples/expressions/luxon/'>更多信息</a>",
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["formatDate"]
			}
		}
	},
	{
		"displayName": "日期",
		"name": "date",
		"type": "string",
		"description": "您想要格式化的日期",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["formatDate"]
			}
		}
	},
	{
		"displayName": "格式",
		"name": "format",
		"type": "options",
		"options": [
			{
				"name": "自定义格式",
				"value": "custom"
			},
			{
				"name": "MM/DD/YYYY",
				"value": "MM/dd/yyyy",
				"description": "示例：09/04/1986"
			},
			{
				"name": "YYYY/MM/DD",
				"value": "yyyy/MM/dd",
				"description": "示例：1986/04/09"
			},
			{
				"name": "MMMM DD YYYY",
				"value": "MMMM dd yyyy",
				"description": "示例：April 09 1986"
			},
			{
				"name": "MM-DD-YYYY",
				"value": "MM-dd-yyyy",
				"description": "示例：09-04-1986"
			},
			{
				"name": "YYYY-MM-DD",
				"value": "yyyy-MM-dd",
				"description": "示例：1986-04-09"
			},
			{
				"name": "Unix Timestamp",
				"value": "X",
				"description": "示例：1672531200"
			},
			{
				"name": "Unix Ms Timestamp",
				"value": "x",
				"description": "示例：1674691200000"
			}
		],
		"default": "MM/dd/yyyy",
		"description": "要将日期转换为的格式",
		"displayOptions": {
			"show": {
				"operation": ["formatDate"]
			}
		}
	},
	{
		"displayName": "自定义格式",
		"name": "customFormat",
		"type": "string",
		"displayOptions": {
			"show": {
				"format": ["custom"],
				"operation": ["formatDate"]
			}
		},
		"hint": "特殊标记的列表<a target=\"_blank\" href=\"https://moment.github.io/luxon/#/formatting?id=table-of-tokens\">更多信息</a>",
		"default": "",
		"placeholder": "yyyy-MM-dd"
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "formattedDate",
		"description": "要将输出放入的字段名称",
		"displayOptions": {
			"show": {
				"operation": ["formatDate"]
			}
		}
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"default": {},
		"displayOptions": {
			"show": {
				"operation": ["formatDate"]
			}
		},
		"options": [includeInputFields, {
			"displayName": "日期格式",
			"name": "fromFormat",
			"type": "string",
			"default": "例如：yyyyMMdd",
			"hint": "标记区分大小写",
			"description": "输入日期的格式，在格式未能自动识别时非常有用。使用这些<a href=\"https://moment.github.io/luxon/#/formatting?id=table-of-tokens&id=table-of-tokens\" target=\"_blank\">标记</a>定义格式。"
		}, {
				"displayName": "使用工作流时区",
				"name": "timezone",
				"type": "boolean",
				"default": false,
				"description": "是否使用输入或工作流的时区"
			}]
	}

];
