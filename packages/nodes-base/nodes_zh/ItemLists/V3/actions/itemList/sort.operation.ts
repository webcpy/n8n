import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import get from 'lodash/get';

import isEqual from 'lodash/isEqual';
import lt from 'lodash/lt';

import { shuffleArray, sortByCode } from '../../helpers/utils';
import { disableDotNotationBoolean } from '../common.descriptions';
import { updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		"displayName": "类型",
		"name": "type",
		"type": "options",
		"options": [
			{
				"name": "简单",
				"value": "simple"
			},
			{
				"name": "随机",
				"value": "random"
			},
			{
				"name": "代码",
				"value": "code"
			}
		],
		"default": "simple",
		"description": "要比较的输入项目的字段，以查看它们是否相同"
	},
	{
		"displayName": "要排序的字段",
		"name": "sortFieldsUi",
		"type": "fixedCollection",
		"typeOptions": {
			"multipleValues": true
		},
		"placeholder": "添加要排序的字段",
		"options": [
			{
				"displayName": "",
				"name": "sortField",
				"values": [
					{
						"displayName": "字段名称",
						"name": "fieldName",
						"type": "string",
						"required": true,
						"default": "",
						"description": "要按其排序的字段",
						"placeholder": "例如 id",
						"hint": "将字段名作为文本输入",
						"requiresDataPath": "single"
					},
					{
						"displayName": "顺序",
						"name": "order",
						"type": "options",
						"options": [
							{
								"name": "升序",
								"value": "ascending"
							},
							{
								"name": "降序",
								"value": "descending"
							}
						],
						"default": "ascending",
						"description": "要按其排序的顺序"
					}
				]
			}
		],
		"default": {},
		"description": "要比较的输入项目的字段，以查看它们是否相同",
		"displayOptions": {
			"show": {
				"type": ["simple"]
			}
		}
	},
	{
		"displayName": "代码",
		"name": "code",
		"type": "string",
		"typeOptions": {
			"alwaysOpenEditWindow": true,
			"editor": "jsEditor",
			"rows": 10
		},
		"default": "// 要比较的两个项目分别位于变量 a 和 b 中\n// 访问 a.json 和 b.json 中的字段\n// 如果 a 在 b 之前，返回 -1 \n// 如果 b 先于 a，则返回 1\n// 如果没有差异，则返回 0\n\nfieldName = 'myField';\n\nif (a.json[fieldName] < b.json[fieldName]) {\n    return -1;\n}\nif (a.json[fieldName] > b.json[fieldName]) {\n    return 1;\n}\nreturn 0;",
		"description": "用 Javascript 代码确定任意两个项目的顺序",
		"displayOptions": {
			"show": {
				"type": ["code"]
			}
		}
	},
	{
		"displayName": "选项",
		"name": "options",
		"type": "collection",
		"placeholder": "添加字段",
		"default": {},
		"displayOptions": {
			"show": {
				"type": ["simple"]
			}
		},
		"options": [
			{
				"displayName": "禁用点表示法",
				"name": "disableDotNotation",
				"type": "boolean",
				"default": false,
				"description": "是否禁止在字段名称中使用 `parent.child` 引用子字段"
			}
		]
	}

];

const displayOptions = {
	show: {
		resource: ['itemList'],
		operation: ['sort'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	let returnData = [...items];
	const type = this.getNodeParameter('type', 0) as string;
	const disableDotNotation = this.getNodeParameter(
		'options.disableDotNotation',
		0,
		false,
	) as boolean;

	if (type === 'random') {
		shuffleArray(returnData);
		return returnData;
	}

	if (type === 'simple') {
		const sortFieldsUi = this.getNodeParameter('sortFieldsUi', 0) as IDataObject;
		const sortFields = sortFieldsUi.sortField as Array<{
			fieldName: string;
			order: 'ascending' | 'descending';
		}>;

		if (!sortFields?.length) {
			throw new NodeOperationError(
				this.getNode(),
				'No sorting specified. Please add a field to sort by',
			);
		}

		for (const { fieldName } of sortFields) {
			let found = false;
			for (const item of items) {
				if (!disableDotNotation) {
					if (get(item.json, fieldName) !== undefined) {
						found = true;
					}
				} else if (item.json.hasOwnProperty(fieldName)) {
					found = true;
				}
			}
			if (!found && disableDotNotation && fieldName.includes('.')) {
				throw new NodeOperationError(
					this.getNode(),
					`Couldn't find the field '${fieldName}' in the input data`,
					{
						description:
							"If you're trying to use a nested field, make sure you turn off 'disable dot notation' in the node options",
					},
				);
			} else if (!found) {
				throw new NodeOperationError(
					this.getNode(),
					`Couldn't find the field '${fieldName}' in the input data`,
				);
			}
		}

		const sortFieldsWithDirection = sortFields.map((field) => ({
			name: field.fieldName,
			dir: field.order === 'ascending' ? 1 : -1,
		}));

		returnData.sort((a, b) => {
			let result = 0;
			for (const field of sortFieldsWithDirection) {
				let equal;
				if (!disableDotNotation) {
					const _a =
						typeof get(a.json, field.name) === 'string'
							? (get(a.json, field.name) as string).toLowerCase()
							: get(a.json, field.name);
					const _b =
						typeof get(b.json, field.name) === 'string'
							? (get(b.json, field.name) as string).toLowerCase()
							: get(b.json, field.name);
					equal = isEqual(_a, _b);
				} else {
					const _a =
						typeof a.json[field.name] === 'string'
							? (a.json[field.name] as string).toLowerCase()
							: a.json[field.name];
					const _b =
						typeof b.json[field.name] === 'string'
							? (b.json[field.name] as string).toLowerCase()
							: b.json[field.name];
					equal = isEqual(_a, _b);
				}

				if (!equal) {
					let lessThan;
					if (!disableDotNotation) {
						const _a =
							typeof get(a.json, field.name) === 'string'
								? (get(a.json, field.name) as string).toLowerCase()
								: get(a.json, field.name);
						const _b =
							typeof get(b.json, field.name) === 'string'
								? (get(b.json, field.name) as string).toLowerCase()
								: get(b.json, field.name);
						lessThan = lt(_a, _b);
					} else {
						const _a =
							typeof a.json[field.name] === 'string'
								? (a.json[field.name] as string).toLowerCase()
								: a.json[field.name];
						const _b =
							typeof b.json[field.name] === 'string'
								? (b.json[field.name] as string).toLowerCase()
								: b.json[field.name];
						lessThan = lt(_a, _b);
					}
					if (lessThan) {
						result = -1 * field.dir;
					} else {
						result = 1 * field.dir;
					}
					break;
				}
			}
			return result;
		});
	} else {
		returnData = sortByCode.call(this, returnData);
	}
	return returnData;
}
