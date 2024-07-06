import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import type { QueryRunner, QueryWithValues } from '../../helpers/interfaces';

import { prepareQueryAndReplacements, replaceEmptyStringsByNulls } from '../../helpers/utils';

import { optionsCollection } from '../common.descriptions';
import { getResolvables, updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		"displayName": "查询",
		"name": "query",
		"type": "string",
		"default": "",
		"placeholder": "例如：SELECT id, name FROM product WHERE id < 40",
		"required": true,
		"description": "要执行的 SQL 查询。您可以使用 n8n 表达式和 $1、$2、$3 等来引用下面选项中设置的“查询参数”。",
		"noDataExpression": true,
		"typeOptions": {
			"editor": "sqlEditor",
			"sqlDialect": "MySQL"
		},
		"hint": "考虑使用查询参数来防止 SQL 注入攻击。请在下面的选项中添加它们。"
	},

	optionsCollection,
];

const displayOptions = {
	show: {
		resource: ['database'],
		operation: ['executeQuery'],
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
		let rawQuery = this.getNodeParameter('query', i) as string;

		for (const resolvable of getResolvables(rawQuery)) {
			rawQuery = rawQuery.replace(resolvable, this.evaluateExpression(resolvable, i) as string);
		}

		const options = this.getNodeParameter('options', i, {});

		let values;
		let queryReplacement = options.queryReplacement || [];

		if (typeof queryReplacement === 'string') {
			queryReplacement = queryReplacement.split(',').map((entry) => entry.trim());
		}

		if (Array.isArray(queryReplacement)) {
			values = queryReplacement as IDataObject[];
		} else {
			throw new NodeOperationError(
				this.getNode(),
				'Query Replacement must be a string of comma-separated values, or an array of values',
				{ itemIndex: i },
			);
		}

		const preparedQuery = prepareQueryAndReplacements(rawQuery, values);

		if ((nodeOptions.nodeVersion as number) >= 2.3) {
			const parsedNumbers = preparedQuery.values.map((value) => {
				return Number(value) ? Number(value) : value;
			});
			preparedQuery.values = parsedNumbers;
		}

		queries.push(preparedQuery);
	}

	returnData = await runQueries(queries);

	return returnData;
}
