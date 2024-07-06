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
		displayName: `
		In this mode, make sure incoming data fields are named the same as the columns in your table. If needed, use an 'Edit Fields' node before this node to change the field names.
		`,
		name: 'notice',
		type: 'notice',
		default: '',
		displayOptions: {
			show: {
				dataMode: [DATA_MODE.AUTO_MAP],
			},
		},
	},

	{
		// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
		displayName: 'Column to Match On',
		name: 'columnToMatchOn',
		type: 'options',
		required: true,
		// eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-options
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/" target="_blank">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getColumns',
			loadOptionsDependsOn: ['schema.value', 'table.value'],
		},
		default: '',
		hint: "Used to find the correct row to update. Doesn't get changed.",
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
				"dataMode": [DATA_MODE.AUTO_MAP],
			},
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
						"description": "从列表中选择，或者使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a> 指定 ID",
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
		operation: ['update'],
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
		let valueToMatchOn: string | IDataObject = '';

		if (dataMode === DATA_MODE.AUTO_MAP) {
			item = items[i].json;
			valueToMatchOn = item[columnToMatchOn] as string;
		}

		if (dataMode === DATA_MODE.MANUAL) {
			const valuesToSend = (this.getNodeParameter('valuesToSend', i, []) as IDataObject)
				.values as IDataObject[];

			item = valuesToSend.reduce((acc, { column, value }) => {
				acc[column as string] = value;
				return acc;
			}, {} as IDataObject);

			valueToMatchOn = this.getNodeParameter('valueToMatchOn', i) as string;
		}

		const values: QueryValues = [];

		const updateColumns = Object.keys(item).filter((column) => column !== columnToMatchOn);

		const updates: string[] = [];

		for (const column of updateColumns) {
			updates.push(`${escapeSqlIdentifier(column)} = ?`);
			values.push(item[column] as string);
		}

		const condition = `${escapeSqlIdentifier(columnToMatchOn)} = ?`;
		values.push(valueToMatchOn);

		const query = `UPDATE ${escapeSqlIdentifier(table)} SET ${updates.join(
			', ',
		)} WHERE ${condition}`;

		queries.push({ query, values });
	}

	returnData = await runQueries(queries);

	return returnData;
}
