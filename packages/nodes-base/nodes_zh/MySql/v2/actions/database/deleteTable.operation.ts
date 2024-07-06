import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type {
	QueryRunner,
	QueryValues,
	QueryWithValues,
	WhereClause,
} from '../../helpers/interfaces';

import { addWhereClauses, escapeSqlIdentifier } from '../../helpers/utils';

import {
	optionsCollection,
	selectRowsFixedCollection,
	combineConditionsCollection,
} from '../common.descriptions';
import { updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		"displayName": "命令",
		"name": "deleteCommand",
		"type": "options",
		"default": "truncate",
		"options": [
			{
				"name": "截断",
				"value": "truncate",
				"description": "仅删除表的数据并保留表的结构"
			},
			{
				"name": "删除",
				"value": "delete",
				"description": "删除与下面的“选择行”条件匹配的行。如果未进行选择，则删除表中的所有行。"
			},
			{
				"name": "删除",
				"value": "drop",
				"description": "永久删除表的数据和表的结构"
			}
		]
	},

	{
		...selectRowsFixedCollection,
		displayOptions: {
			show: {
				deleteCommand: ['delete'],
			},
		},
	},
	{
		...combineConditionsCollection,
		displayOptions: {
			show: {
				deleteCommand: ['delete'],
			},
		},
	},
	optionsCollection,
];

const displayOptions = {
	show: {
		resource: ['database'],
		operation: ['deleteTable'],
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
): Promise<INodeExecutionData[]> {
	let returnData: INodeExecutionData[] = [];

	const queries: QueryWithValues[] = [];

	for (let i = 0; i < inputItems.length; i++) {
		const table = this.getNodeParameter('table', i, undefined, {
			extractValue: true,
		}) as string;

		const deleteCommand = this.getNodeParameter('deleteCommand', i) as string;

		let query = '';
		let values: QueryValues = [];

		if (deleteCommand === 'drop') {
			query = `DROP TABLE IF EXISTS ${escapeSqlIdentifier(table)}`;
		}

		if (deleteCommand === 'truncate') {
			query = `TRUNCATE TABLE ${escapeSqlIdentifier(table)}`;
		}

		if (deleteCommand === 'delete') {
			const whereClauses =
				((this.getNodeParameter('where', i, []) as IDataObject).values as WhereClause[]) || [];

			const combineConditions = this.getNodeParameter('combineConditions', i, 'AND') as string;

			[query, values] = addWhereClauses(
				this.getNode(),
				i,
				`DELETE FROM ${escapeSqlIdentifier(table)}`,
				whereClauses,
				values,
				combineConditions,
			);
		}

		if (query === '') {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid delete command, only drop, delete and truncate are supported ',
				{ itemIndex: i },
			);
		}

		const queryWithValues = { query, values };

		queries.push(queryWithValues);
	}

	returnData = await runQueries(queries);

	return returnData;
}
