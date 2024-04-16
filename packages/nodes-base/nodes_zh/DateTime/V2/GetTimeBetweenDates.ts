import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const GetTimeBetweenDatesDescription: INodeProperties[] = [
	{
		"displayName": "起始日期",
		"name": "startDate",
		"type": "string",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["getTimeBetweenDates"]
			}
		}
	},
	{
		"displayName": "结束日期",
		"name": "endDate",
		"type": "string",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["getTimeBetweenDates"]
			}
		}
	},
	{
		"displayName": "单位",
		"name": "units",
		"type": "multiOptions",
		"options": [
			{
				"name": "年",
				"value": "year"
			},
			{
				"name": "月",
				"value": "month"
			},
			{
				"name": "周",
				"value": "week"
			},
			{
				"name": "日",
				"value": "day"
			},
			{
				"name": "小时",
				"value": "hour"
			},
			{
				"name": "分钟",
				"value": "minute"
			},
			{
				"name": "秒",
				"value": "second"
			},
			{
				"name": "毫秒",
				"value": "millisecond"
			}
		],
		"displayOptions": {
			"show": {
				"operation": ["getTimeBetweenDates"]
			}
		},
		"default": ["day"]
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "timeDifference",
		"description": "要将输出放入的字段名称",
		"displayOptions": {
			"show": {
				"operation": ["getTimeBetweenDates"]
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
				"operation": ["getTimeBetweenDates"]
			}
		},
		"options": [includeInputFields, {
			"displayName": "输出为 ISO 字符串",
			"name": "isoString",
			"type": "boolean",
			"default": false,
			"description": "是否输出日期为 ISO 字符串",
		}]
	}

];
