import type { INodeProperties } from 'n8n-workflow';

import { tableRLC } from '../common.descriptions';
import * as deleteTable from './deleteTable.operation';
import * as executeQuery from './executeQuery.operation';
import * as insert from './insert.operation';
import * as select from './select.operation';
import * as update from './update.operation';
import * as upsert from './upsert.operation';

export { deleteTable, executeQuery, insert, select, update, upsert };

export const description: INodeProperties[] = [
	{
		displayName: '操作',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				"name": "删除",
				"value": "deleteTable",
				"description": "删除整个表或表中的行",
				"action": "删除表或行"
			},
			{
				"name": "执行 SQL",
				"value": "executeQuery",
				"description": "执行 SQL 查询",
				"action": "执行 SQL 查询"
			},
			{
				"name": "插入",
				"value": "insert",
				"description": "在表中插入行",
				"action": "在表中插入行"
			},
			{
				"name": "插入或更新",
				"value": "upsert",
				"description": "在表中插入或更新行",
				"action": "在表中插入或更新行"
			},
			{
				"name": "选择",
				"value": "select",
				"description": "从表中选择行",
				"action": "从表中选择行"
			},
			{
				"name": "更新",
				"value": "update",
				"description": "更新表中的行",
				"action": "更新表中的行"
			}
		],
		displayOptions: {
			show: {
				resource: ['database'],
			},
		},
		default: 'insert',
	},
	{
		...tableRLC,
		displayOptions: { hide: { operation: ['executeQuery'] } },
	},
	...deleteTable.description,
	...executeQuery.description,
	...insert.description,
	...select.description,
	...update.description,
	...upsert.description,
];
