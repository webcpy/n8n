import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import type {
	QueryMode,
	QueryRunner,
	QueryValues,
	QueryWithValues,
} from '../../helpers/interfaces';

import { AUTO_MAP, BATCH_MODE, DATA_MODE } from '../../helpers/interfaces';

import { escapeSqlIdentifier, replaceEmptyStringsByNulls } from '../../helpers/utils';

import { optionsCollection } from '../common.descriptions';
import { updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		displayName: '数据模式',
		name: 'dataMode',
		type: 'options',
		options: [
			{
				name: '将输入数据自动映射到列中',
				value: DATA_MODE.AUTO_MAP,
				description: '节点输入属性名称与表格列名称完全匹配时使用	',
			},
			{
				name: '手动映射每一列',
				value: DATA_MODE.MANUAL,
				description: '手动设置各目标列的值',
			},
		],
		default: AUTO_MAP,
		description:
			'是自动还是手动映射节点输入属性和表格数据',
	},
	{
		displayName: `
		在此模式下，请确保输入数据字段的名称与表格中列的名称相同。如有需要，可在该节点前使用 "编辑字段 "节点更改字段名称。		`,
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
		displayName: '要发送的值',
		name: 'valuesToSend',
		placeholder: 'Add Value',
		type: 'fixedCollection',
		typeOptions: {
			multipleValueButtonText: 'Add Value',
			multipleValues: true,
		},
		displayOptions: {
			show: {
				dataMode: [DATA_MODE.MANUAL],
			},
		},
		default: {},
		options: [
			{
				"displayName": "数值",
				"name": "values",
				"values": [
					{
						"displayName": "列",
						"name": "column",
						"type": "options",
						"description": "从列表中选择，或者使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a> 指定 ID",
						"typeOptions": {
							"loadOptionsMethod": "getColumns",
							"loadOptionsDependsOn": ["table.value"]
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
		],
	},
	optionsCollection,
];

const displayOptions = {
	show: {
		resource: ['database'],
		operation: ['insert'],
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

	const table = this.getNodeParameter('table', 0, '', { extractValue: true }) as string;

	const dataMode = this.getNodeParameter('dataMode', 0) as string;
	const queryBatching = (nodeOptions.queryBatching as QueryMode) || BATCH_MODE.SINGLE;

	const queries: QueryWithValues[] = [];

	if (queryBatching === BATCH_MODE.SINGLE) {
		let columns: string[] = [];
		let insertItems: IDataObject[] = [];

		const priority = (nodeOptions.priority as string) || '';
		const ignore = (nodeOptions.skipOnConflict as boolean) ? 'IGNORE' : '';

		if (dataMode === DATA_MODE.AUTO_MAP) {
			columns = [
				...new Set(
					items.reduce((acc, item) => {
						const itemColumns = Object.keys(item.json);

						return acc.concat(itemColumns);
					}, [] as string[]),
				),
			];
			insertItems = this.helpers.copyInputItems(items, columns);
		}

		if (dataMode === DATA_MODE.MANUAL) {
			for (let i = 0; i < items.length; i++) {
				const valuesToSend = (this.getNodeParameter('valuesToSend', i, []) as IDataObject)
					.values as IDataObject[];

				const item = valuesToSend.reduce((acc, { column, value }) => {
					acc[column as string] = value;
					return acc;
				}, {} as IDataObject);

				insertItems.push(item);
			}
			columns = [
				...new Set(
					insertItems.reduce((acc, item) => {
						const itemColumns = Object.keys(item);

						return acc.concat(itemColumns);
					}, [] as string[]),
				),
			];
		}

		const escapedColumns = columns.map(escapeSqlIdentifier).join(', ');
		const placeholder = `(${columns.map(() => '?').join(',')})`;
		const replacements = items.map(() => placeholder).join(',');

		const query = `INSERT ${priority} ${ignore} INTO ${escapeSqlIdentifier(
			table,
		)} (${escapedColumns}) VALUES ${replacements}`;

		const values = insertItems.reduce(
			(acc: IDataObject[], item) => acc.concat(Object.values(item) as IDataObject[]),
			[],
		);

		queries.push({ query, values });
	} else {
		for (let i = 0; i < items.length; i++) {
			let columns: string[] = [];
			let insertItem: IDataObject = {};

			const options = this.getNodeParameter('options', i);
			const priority = (options.priority as string) || '';
			const ignore = (options.skipOnConflict as boolean) ? 'IGNORE' : '';

			if (dataMode === DATA_MODE.AUTO_MAP) {
				columns = Object.keys(items[i].json);
				insertItem = columns.reduce((acc, key) => {
					if (columns.includes(key)) {
						acc[key] = items[i].json[key];
					}
					return acc;
				}, {} as IDataObject);
			}

			if (dataMode === DATA_MODE.MANUAL) {
				const valuesToSend = (this.getNodeParameter('valuesToSend', i, []) as IDataObject)
					.values as IDataObject[];

				insertItem = valuesToSend.reduce((acc, { column, value }) => {
					acc[column as string] = value;
					return acc;
				}, {} as IDataObject);

				columns = Object.keys(insertItem);
			}

			const escapedColumns = columns.map(escapeSqlIdentifier).join(', ');
			const placeholder = `(${columns.map(() => '?').join(',')})`;

			const query = `INSERT ${priority} ${ignore} INTO ${escapeSqlIdentifier(
				table,
			)} (${escapedColumns}) VALUES ${placeholder};`;

			const values = Object.values(insertItem) as QueryValues;

			queries.push({ query, values });
		}
	}

	returnData = await runQueries(queries);

	return returnData;
}
