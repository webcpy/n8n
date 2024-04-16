import type { INodeProperties } from 'n8n-workflow';
import { includeInputFields } from './common.descriptions';

export const RoundDateDescription: INodeProperties[] = [
	{
		"displayName": "注意",
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"]
			}
		}
	},
	{
		"displayName": "日期",
		"name": "date",
		"type": "string",
		"description": "要四舍五入的日期",
		"default": "",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"]
			}
		}
	},
	{
		"displayName": "模式",
		"name": "mode",
		"type": "options",
		"options": [
			{
				"name": "向下取整",
				"value": "roundDown"
			},
			{
				"name": "向上取整",
				"value": "roundUp"
			}
		],
		"default": "roundDown",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"]
			}
		}
	},
	{
		"displayName": "到最近",
		"name": "toNearest",
		"type": "options",
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
			}
		],
		"default": "month",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"],
				"mode": ["roundDown"]
			}
		}
	},
	{
		"displayName": "到",
		"name": "to",
		"type": "options",
		"options": [
			{
				"name": "月底",
				"value": "month"
			}
		],
		"default": "month",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"],
				"mode": ["roundUp"]
			}
		}
	},
	{
		"displayName": "输出字段名称",
		"name": "outputFieldName",
		"type": "string",
		"default": "roundedDate",
		"description": "要将输出放入的字段名称",
		"displayOptions": {
			"show": {
				"operation": ["roundDate"]
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
				"operation": ["roundDate"]
			}
		},
		"options": [includeInputFields]
	}

];
