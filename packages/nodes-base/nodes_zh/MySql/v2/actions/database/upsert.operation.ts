import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import type { QueryRunner, QueryValues, QueryWithValues } from '../../helpers/interfaces';
import { AUTO_MAP, DATA_MODE } from '../../helpers/interfaces';

import { escapeSqlIdentifier, replaceEmptyStringsByNulls } from '../../helpers/utils';

import { optionsCollection } from '../common.descriptions';
import { updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		"displayName": "数据模式",
		"name": "dataMode",
		"type": "options",
		"options": [
			{
				"name": "自动映射输入数据到列",
				"value": DATA_MODE.AUTO_MAP,
				"description": "当节点输入属性名称与表列名称完全匹配时使用"
			},
			{
				"name": "映射下面的每个列",
				"value": DATA_MODE.MANUAL,
				"description": "手动设置每个目标列的值"
			}
		],
		"default": AUTO_MAP,
		"description": "是否自动或手动映射节点输入属性和表数据"
	},

	{
		"displayName": `
		在此模式下，请确保传入的数据字段与您的表中的列名相同。如果需要，请在此节点之前使用“编辑字段”节点更改字段名称。
		`,
		"name": "notice",
		"type": "notice",
		"default": "",
		"displayOptions": {
			"show": {
				"dataMode": [DATA_MODE.AUTO_MAP]
			}
		}
	},

	{
		"displayName": "匹配列",
		"name": "columnToMatchOn",
		"type": "options",
		"required": true,
		"description": "查找要更新的行时要比较的列。从列表中选择，或者使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a> 指定 ID。",
		"typeOptions": {
			"loadOptionsMethod": "getColumns",
			"loadOptionsDependsOn": ["schema.value", "table.value"]
		},
		"default": "",
		"hint": "用于查找要更新的正确行。不会被更改。必须是唯一的。"
	},
	{
		"displayName": "匹配列的值",
		"name": "valueToMatchOn",
		"type": "string",
		"default": "",
		"description": "具有与此字段中的值相对应的指定“匹配列”的值的行将被更新。对于不匹配的项，将创建新行。",
		"displayOptions": {
			"show": {
				"dataMode": [DATA_MODE.MANUAL]
			}
		}
	},
	{
		"displayName": "要发送的值",
		"name": "valuesToSend",
		"placeholder": "添加值",
		"type": "fixedCollection",
		"typeOptions": {
			"multipleValueButtonText": "添加值",
			"multipleValues": true
		},
		"displayOptions": {
			"show": {
				"dataMode": [DATA_MODE.MANUAL]
			}
		},
		"default": {},
		"options": [
			{
				"displayName": "值",
				"name": "values",
				"values": [
					{
						"displayName": "列",
						"name": "column",
						"type": "options",
						"description": "从列表中选择，或者使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a> 指定 ID。",
						"typeOptions": {
							"loadOptionsMethod": "getColumnsWithoutColumnToMatchOn",
							"loadOptionsDependsOn": ["schema.value", "table.value"]
						},
						"default": []
					},
					{
						"displayName": "值",
						"name": "value",
						"type": "string",
						"default": ""
					}
				]
			}
		]
	},
	optionsCollection,
];

const displayOptions = {
	show: {
		resource: ['database'],
		operation: ['upsert'],
	},
	hide: {
		table: [''],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	inputItems: INodeExecutionData[],
	runQueries: QueryRunner,
	nodeOptions: IDataObject,
): Promise<INodeExecutionData[]> {
	let returnData: INodeExecutionData[] = [];

	const items = replaceEmptyStringsByNulls(inputItems, nodeOptions.replaceEmptyStrings as boolean);

	const queries: QueryWithValues[] = [];

	for (let i = 0; i < items.length; i++) {
		const table = this.getNodeParameter('table', i, undefined, {
			extractValue: true,
		}) as string;

		const columnToMatchOn = this.getNodeParameter('columnToMatchOn', i) as string;

		const dataMode = this.getNodeParameter('dataMode', i) as string;

		let item: IDataObject = {};

		if (dataMode === DATA_MODE.AUTO_MAP) {
			item = items[i].json;
		}

		if (dataMode === DATA_MODE.MANUAL) {
			const valuesToSend = (this.getNodeParameter('valuesToSend', i, []) as IDataObject)
				.values as IDataObject[];

			item = valuesToSend.reduce((acc, { column, value }) => {
				acc[column as string] = value;
				return acc;
			}, {} as IDataObject);

			item[columnToMatchOn] = this.getNodeParameter('valueToMatchOn', i) as string;
		}

		const onConflict = 'ON DUPLICATE KEY UPDATE';

		const columns = Object.keys(item);
		const escapedColumns = columns.map(escapeSqlIdentifier).join(', ');
		const placeholder = `${columns.map(() => '?').join(',')}`;

		const insertQuery = `INSERT INTO ${escapeSqlIdentifier(
			table,
		)}(${escapedColumns}) VALUES(${placeholder})`;

		const values = Object.values(item) as QueryValues;

		const updateColumns = Object.keys(item).filter((column) => column !== columnToMatchOn);

		const updates: string[] = [];

		for (const column of updateColumns) {
			updates.push(`${escapeSqlIdentifier(column)} = ?`);
			values.push(item[column] as string);
		}

		const query = `${insertQuery} ${onConflict} ${updates.join(', ')}`;

		queries.push({ query, values });
	}

	returnData = await runQueries(queries);

	return returnData;
}
