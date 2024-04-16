import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const SubtractFromDateDescription: INodeProperties[] = [
	{
		"displayName": "注意",
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["subtractFromDate"]
			}
		}
	},
	{
		"displayName": "要减去的日期",
		"name": "magnitude",
		"type": "string",
		"description": "要更改的日期",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["subtractFromDate"]
			}
		},
		"required": true
	},
	{
		"displayName": "要减去的时间单位",
		"name": "timeUnit",
		"description": "下面的持续时间参数的时间单位",
		"displayOptions": {
			"show": {
				"operation": ["subtractFromDate"]
			}
		},
		"type": "options",
		"options": [
			{
				"name": "年",
				"value": "years"
			},
			{
				"name": "季度",
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
		"description": "要从日期中减去的时间单位数",
		"default": 0,
		"displayOptions": {
			"show": {
				"operation": ["subtractFromDate"]
			}
		}
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "newDate",
		"description": "要将输出放入的字段名称",
		"displayOptions": {
			"show": {
				"operation": ["subtractFromDate"]
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
				"operation": ["subtractFromDate"]
			}
		},
		"options": [includeInputFields]
	}

];
