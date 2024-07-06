import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const CurrentDateDescription: INodeProperties[] = [
	{
		"displayName":
			"您还可以通过使用 <code>{{$now}}</code> 或 <code>{{$today}}</code> 在 n8n 表达式中引用当前日期。<a target='_blank' href='https://docs.n8n.io/code-examples/expressions/luxon/'>更多信息</a>",
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["getCurrentDate"]
			}
		}
	},
	{
		"displayName": "包括当前时间",
		"name": "includeTime",
		"type": "boolean",
		"default": true,
		"description": "当未激活时，时间将被设置为午夜",
		"displayOptions": {
			"show": {
				"operation": ["getCurrentDate"]
			}
		}
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "currentDate",
		"description": "要放置输出的字段的名称",
		"displayOptions": {
			"show": {
				"operation": ["getCurrentDate"]
			}
		}
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加选项",
		"displayOptions": {
			"show": {
				"operation": ["getCurrentDate"]
			}
		},
		"default": {},
		"options": [
			includeInputFields,
			{
				"displayName": "时区",
				"name": "timezone",
				"type": "string",
				"placeholder": "America/New_York",
				"default": "",
				"description": "要使用的时区。如果未设置，则将使用 n8n 实例的时区。使用 ‘GMT’ 表示 +00:00 时区。"
			}
		]
	}
]
