import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const AddToDateDescription: INodeProperties[] = [
	{
		"displayName": "您还可以使用表达式完成此操作，例如：<code>{{your_date.plus(5, 'minutes')}}</code>。<a target='_blank' href='https://docs.n8n.io/code-examples/expressions/luxon/'>更多信息</a>",
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["addToDate"]
			}
		}
	},
	{
		"displayName": "要添加的日期",
		"name": "magnitude",
		"type": "string",
		"description": "您想要更改的日期",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["addToDate"]
			}
		},
		"required": true
	},
	{
		"displayName": "要添加的时间单位",
		"name": "timeUnit",
		"description": "下面的持续时间参数的时间单位",
		"displayOptions": {
			"show": {
				"operation": ["addToDate"]
			}
		},
		"type": "options",
		"options": [
			{
				"name": "年",
				"value": "years"
			},
			{
				"name": "季节",
				"value": "quarters"
			},
			{
				"name": "月",
				"value": "months"
			},
			{
				"name": "周",
				"value": "weeks"
			},
			{
				"name": "天",
				"value": "days"
			},
			{
				"name": "小时",
				"value": "hours"
			},
			{
				"name": "分钟",
				"value": "minutes"
			},
			{
				"name": "秒",
				"value": "seconds"
			},
			{
				"name": "毫秒",
				"value": "milliseconds"
			}
		],
		"default": "days",
		"required": true
	},
	{
		"displayName": "持续时间",
		"name": "duration",
		"type": "number",
		"description": "要添加到日期的时间单位数",
		"default": 0,
		"displayOptions": {
			"show": {
				"operation": ["addToDate"]
			}
		}
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "newDate",
		"description": "将输出放入的字段的名称",
		"displayOptions": {
			"show": {
				"operation": ["addToDate"]
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
				"operation": ["addToDate"]
			}
		},
		"default": {},
		"options": [includeInputFields]
	}

];
