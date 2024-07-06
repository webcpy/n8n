import type { INodeProperties } from 'n8n-workflow';

import * as concatenateItems from './concatenateItems.operation';
import * as limit from './limit.operation';
import * as removeDuplicates from './removeDuplicates.operation';
import * as sort from './sort.operation';
import * as splitOutItems from './splitOutItems.operation';
import * as summarize from './summarize.operation';

export { concatenateItems, limit, removeDuplicates, sort, splitOutItems, summarize };

export const description: INodeProperties[] = [
	{
		"displayName": "操作",
		"name": "operation",
		"type": "options",
		"noDataExpression": true,
		"displayOptions": {
			"show": {
				"resource": ["itemList"]
			}
		},
		"options": [
			{
				"name": "连接项目",
				"value": "concatenateItems",
				"description": "将字段组合成一个列表，放入一个新的项目中",
				"action": "Concatenate Items"
			},
			{
				"name": "限制",
				"value": "limit",
				"description": "如果项目太多，则删除项目",
				"action": "Limit"
			},
			{
				"name": "删除重复项",
				"value": "removeDuplicates",
				"description": "删除相似的额外项目",
				"action": "Remove Duplicates"
			},
			{
				"name": "排序",
				"value": "sort",
				"description": "更改项目顺序",
				"action": "Sort"
			},
			{
				"name": "拆分项目",
				"value": "splitOutItems",
				"description": "将项目中的列表或对象属性的值拆分为单独的项目",
				"action": "Split Out Items"
			},
			{
				"name": "汇总",
				"value": "summarize",
				"description": "将项目聚合在一起（数据透视表）",
				"action": "Summarize"
			}
		],
		"default": "splitOutItems"
	},
	...concatenateItems.description,
	...limit.description,
	...removeDuplicates.description,
	...sort.description,
	...splitOutItems.description,
	...summarize.description,
];
