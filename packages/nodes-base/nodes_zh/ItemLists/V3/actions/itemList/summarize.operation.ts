import type {
	GenericValue,
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import get from 'lodash/get';
import { disableDotNotationBoolean } from '../common.descriptions';
import { updateDisplayOptions } from '@utils/utilities';

type AggregationType =
	| 'append'
	| 'average'
	| 'concatenate'
	| 'count'
	| 'countUnique'
	| 'max'
	| 'min'
	| 'sum';

type Aggregation = {
	aggregation: AggregationType;
	field: string;
	includeEmpty?: boolean;
	separateBy?: string;
	customSeparator?: string;
};

type Aggregations = Aggregation[];

const AggregationDisplayNames = {
	append: 'appended_',
	average: 'average_',
	concatenate: 'concatenated_',
	count: 'count_',
	countUnique: 'unique_count_',
	max: 'max_',
	min: 'min_',
	sum: 'sum_',
};

const NUMERICAL_AGGREGATIONS = ['average', 'sum'];

type SummarizeOptions = {
	disableDotNotation?: boolean;
	outputFormat?: 'separateItems' | 'singleItem';
	skipEmptySplitFields?: boolean;
};

type ValueGetterFn = (
	item: IDataObject,
	field: string,
) => IDataObject | IDataObject[] | GenericValue | GenericValue[];

export const properties: INodeProperties[] = [
	{
		displayName: '汇总字段',
		name: 'fieldsToSummarize',
		type: 'fixedCollection',
		placeholder: 'Add Field',
		default: { values: [{ aggregation: 'count', field: '' }] },
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: '',
				name: 'values',
				values: [
					{
						"displayName": "聚合",
						"name": "aggregation",
						"type": "options",
						"options": [
							{
								"name": "追加",
								"value": "append"
							},
							{
								"name": "平均值",
								"value": "average"
							},
							{
								"name": "连接",
								"value": "concatenate"
							},
							{
								"name": "计数",
								"value": "count"
							},
							{
								"name": "计数唯一值",
								"value": "countUnique"
							},
							{
								"name": "最大值",
								"value": "max"
							},
							{
								"name": "最小值",
								"value": "min"
							},
							{
								"name": "总和",
								"value": "sum"
							}
						],
						"default": "count",
						"description": "如何组合您想要汇总的字段的值"
					},
					//field repeated to have different descriptions for different aggregations --------------------------------
					{
						"displayName": "字段",
						"name": "field",
						"type": "string",
						"default": "",
						"description": "您想要汇总的输入字段的名称",
						"placeholder": "例如成本",
						"hint": "以文本形式输入字段名称",
						"displayOptions": {
							"hide": {
								"aggregation": ["append", "average", "concatenate"]
							}
						},
						"requiresDataPath": "single"
					},
					{
						"displayName": "字段",
						"name": "field",
						"type": "string",
						"default": "",
						"description": "您想要汇总的输入字段的名称。该字段应包含数值；null、undefined、空字符串将被忽略。",
						"placeholder": "例如成本",
						"hint": "以文本形式输入字段名称",
						"displayOptions": {
							"show": {
								"aggregation": ["average", "sum"]
							}
						},
						"requiresDataPath": "single"
					},
					{
						"displayName": "字段",
						"name": "field",
						"type": "string",
						"default": "",
						"description": "您想要汇总的输入字段的名称；null、undefined、空字符串将被忽略",
						"placeholder": "例如成本",
						"hint": "以文本形式输入字段名称",
						"displayOptions": {
							"show": {
								"aggregation": ["countUnique", "count", "max", "min"]
							}
						},
						"requiresDataPath": "single"
					},
					// ----------------------------------------------------------------------------------------------------------
					{
						"displayName": "包含空值",
						"name": "includeEmpty",
						"type": "boolean",
						"default": false,
						"displayOptions": {
							"show": {
								"aggregation": ["append", "concatenate"]
							}
						}
					},
					{
						"displayName": "分隔符",
						"name": "separateBy",
						"type": "options",
						"default": ",",
						"options": [
							{
								"name": "逗号",
								"value": ","
							},
							{
								"name": "逗号和空格",
								"value": ", "
							},
							{
								"name": "换行符",
								"value": "\n"
							},
							{
								"name": "无",
								"value": ""
							},
							{
								"name": "空格",
								"value": " "
							},
							{
								"name": "其他",
								"value": "other"
							}
						],
						"hint": "在值之间插入什么",
						"displayOptions": {
							"show": {
								"aggregation": ["concatenate"]
							}
						}
					},
					{
						"displayName": "自定义分隔符",
						"name": "customSeparator",
						"type": "string",
						"default": "",
						"displayOptions": {
							"show": {
								"aggregation": ["concatenate"],
								"separateBy": ["other"]
							}
						}
					}
				],
			},
		],
	},
	// fieldsToSplitBy repeated to have different displayName for singleItem and separateItems -----------------------------
	{
		"displayName": "按字段拆分",
		"name": "fieldsToSplitBy",
		"type": "string",
		"placeholder": "例如国家，城市",
		"default": "",
		"description": "您要按其拆分摘要的输入字段的名称",
		"hint": "输入字段名称作为文本（用逗号分隔）",
		"displayOptions": {
			"hide": {
				"/options.outputFormat": ["singleItem"]
			}
		},
		"requiresDataPath": "multiple"
	},
	{
		"displayName": "按字段分组",
		"name": "fieldsToSplitBy",
		"type": "string",
		"placeholder": "例如国家，城市",
		"default": "",
		"description": "您要按其分组的摘要的输入字段的名称",
		"hint": "输入字段名称作为文本（用逗号分隔）",
		"displayOptions": {
			"show": {
				"/options.outputFormat": ["singleItem"]
			}
		},
		"requiresDataPath": "multiple"
	},
	// ----------------------------------------------------------------------------------------------------------
	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		placeholder: '添加',
		default: {},
		options: [
			disableDotNotationBoolean,
			{
				"displayName": "输出格式",
				"name": "outputFormat",
				"type": "options",
				"default": "separateItems",
				"options": [
					{
						"name": "每个拆分为单独项目",
						"value": "separateItems"
					},
					{
						"name": "所有拆分在单个项目中",
						"value": "singleItem"
					}
				]
			},
			{
				"displayName": "忽略没有有效分组字段的项目",
				"name": "skipEmptySplitFields",
				"type": "boolean",
				"default": false
			}
		],
	},
];

const displayOptions = {
	show: {
		resource: ['itemList'],
		operation: ['summarize'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

function isEmpty<T>(value: T) {
	return value === undefined || value === null || value === '';
}

function parseReturnData(returnData: IDataObject) {
	const regexBrackets = /[\]\["]/g;
	const regexSpaces = /[ .]/g;
	for (const key of Object.keys(returnData)) {
		if (key.match(regexBrackets)) {
			const newKey = key.replace(regexBrackets, '');
			returnData[newKey] = returnData[key];
			delete returnData[key];
		}
	}
	for (const key of Object.keys(returnData)) {
		if (key.match(regexSpaces)) {
			const newKey = key.replace(regexSpaces, '_');
			returnData[newKey] = returnData[key];
			delete returnData[key];
		}
	}
}

function parseFieldName(fieldName: string[]) {
	const regexBrackets = /[\]\["]/g;
	const regexSpaces = /[ .]/g;
	fieldName = fieldName.map((field) => {
		field = field.replace(regexBrackets, '');
		field = field.replace(regexSpaces, '_');
		return field;
	});
	return fieldName;
}

const fieldValueGetter = (disableDotNotation?: boolean) => {
	if (disableDotNotation) {
		return (item: IDataObject, field: string) => item[field];
	} else {
		return (item: IDataObject, field: string) => get(item, field);
	}
};

function checkIfFieldExists(
	this: IExecuteFunctions,
	items: IDataObject[],
	aggregations: Aggregations,
	getValue: ValueGetterFn,
) {
	for (const aggregation of aggregations) {
		if (aggregation.field === '') {
			continue;
		}
		const exist = items.some((item) => getValue(item, aggregation.field) !== undefined);
		if (!exist) {
			throw new NodeOperationError(
				this.getNode(),
				`The field '${aggregation.field}' does not exist in any items`,
			);
		}
	}
}

function aggregate(items: IDataObject[], entry: Aggregation, getValue: ValueGetterFn) {
	const { aggregation, field } = entry;
	let data = [...items];

	if (NUMERICAL_AGGREGATIONS.includes(aggregation)) {
		data = data.filter(
			(item) => typeof getValue(item, field) === 'number' && !isEmpty(getValue(item, field)),
		);
	}

	switch (aggregation) {
		//combine operations
		case 'append':
			if (!entry.includeEmpty) {
				data = data.filter((item) => !isEmpty(getValue(item, field)));
			}
			return data.map((item) => getValue(item, field));
		case 'concatenate':
			const separateBy = entry.separateBy === 'other' ? entry.customSeparator : entry.separateBy;
			if (!entry.includeEmpty) {
				data = data.filter((item) => !isEmpty(getValue(item, field)));
			}
			return data
				.map((item) => {
					let value = getValue(item, field);
					if (typeof value === 'object') {
						value = JSON.stringify(value);
					}
					if (typeof value === 'undefined') {
						value = 'undefined';
					}

					return value;
				})
				.join(separateBy);

		//numerical operations
		case 'average':
			return (
				data.reduce((acc, item) => {
					return acc + (getValue(item, field) as number);
				}, 0) / data.length
			);
		case 'sum':
			return data.reduce((acc, item) => {
				return acc + (getValue(item, field) as number);
			}, 0);
		//comparison operations
		case 'min':
			let min;
			for (const item of data) {
				const value = getValue(item, field);
				if (value !== undefined && value !== null && value !== '') {
					if (min === undefined || value < min) {
						min = value;
					}
				}
			}
			return min !== undefined ? min : null;
		case 'max':
			let max;
			for (const item of data) {
				const value = getValue(item, field);
				if (value !== undefined && value !== null && value !== '') {
					if (max === undefined || value > max) {
						max = value;
					}
				}
			}
			return max !== undefined ? max : null;

		//count operations
		case 'countUnique':
			return new Set(data.map((item) => getValue(item, field)).filter((item) => !isEmpty(item)))
				.size;
		default:
			//count by default
			return data.filter((item) => !isEmpty(getValue(item, field))).length;
	}
}

function aggregateData(
	data: IDataObject[],
	fieldsToSummarize: Aggregations,
	options: SummarizeOptions,
	getValue: ValueGetterFn,
) {
	const returnData = fieldsToSummarize.reduce((acc, aggregation) => {
		acc[`${AggregationDisplayNames[aggregation.aggregation]}${aggregation.field}`] = aggregate(
			data,
			aggregation,
			getValue,
		);
		return acc;
	}, {} as IDataObject);
	parseReturnData(returnData);
	if (options.outputFormat === 'singleItem') {
		parseReturnData(returnData);
		return returnData;
	} else {
		return { ...returnData, pairedItems: data.map((item) => item._itemIndex as number) };
	}
}

function splitData(
	splitKeys: string[],
	data: IDataObject[],
	fieldsToSummarize: Aggregations,
	options: SummarizeOptions,
	getValue: ValueGetterFn,
) {
	if (!splitKeys || splitKeys.length === 0) {
		return aggregateData(data, fieldsToSummarize, options, getValue);
	}

	const [firstSplitKey, ...restSplitKeys] = splitKeys;

	const groupedData = data.reduce((acc, item) => {
		let keyValuee = getValue(item, firstSplitKey) as string;

		if (typeof keyValuee === 'object') {
			keyValuee = JSON.stringify(keyValuee);
		}

		if (options.skipEmptySplitFields && typeof keyValuee !== 'number' && !keyValuee) {
			return acc;
		}

		if (acc[keyValuee] === undefined) {
			acc[keyValuee] = [item];
		} else {
			(acc[keyValuee] as IDataObject[]).push(item);
		}
		return acc;
	}, {} as IDataObject);

	return Object.keys(groupedData).reduce((acc, key) => {
		const value = groupedData[key] as IDataObject[];
		acc[key] = splitData(restSplitKeys, value, fieldsToSummarize, options, getValue);
		return acc;
	}, {} as IDataObject);
}

function aggregationToArray(
	aggregationResult: IDataObject,
	fieldsToSplitBy: string[],
	previousStage: IDataObject = {},
) {
	const returnData: IDataObject[] = [];
	fieldsToSplitBy = parseFieldName(fieldsToSplitBy);
	const splitFieldName = fieldsToSplitBy[0];
	const isNext = fieldsToSplitBy[1];

	if (isNext === undefined) {
		for (const fieldName of Object.keys(aggregationResult)) {
			returnData.push({
				...previousStage,
				[splitFieldName]: fieldName,
				...(aggregationResult[fieldName] as IDataObject),
			});
		}
		return returnData;
	} else {
		for (const key of Object.keys(aggregationResult)) {
			returnData.push(
				...aggregationToArray(aggregationResult[key] as IDataObject, fieldsToSplitBy.slice(1), {
					...previousStage,
					[splitFieldName]: key,
				}),
			);
		}
		return returnData;
	}
}

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const newItems = items.map(({ json }, i) => ({ ...json, _itemIndex: i }));

	const options = this.getNodeParameter('options', 0, {}) as SummarizeOptions;

	const fieldsToSplitBy = (this.getNodeParameter('fieldsToSplitBy', 0, '') as string)
		.split(',')
		.map((field) => field.trim())
		.filter((field) => field);

	const fieldsToSummarize = this.getNodeParameter(
		'fieldsToSummarize.values',
		0,
		[],
	) as Aggregations;

	if (fieldsToSummarize.filter((aggregation) => aggregation.field !== '').length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			"You need to add at least one aggregation to 'Fields to Summarize' with non empty 'Field'",
		);
	}

	const getValue = fieldValueGetter(options.disableDotNotation);

	const nodeVersion = this.getNode().typeVersion;

	if (nodeVersion < 2.1) {
		checkIfFieldExists.call(this, newItems, fieldsToSummarize, getValue);
	}

	const aggregationResult = splitData(
		fieldsToSplitBy,
		newItems,
		fieldsToSummarize,
		options,
		getValue,
	);

	if (options.outputFormat === 'singleItem') {
		const executionData: INodeExecutionData = {
			json: aggregationResult,
			pairedItem: newItems.map((_v, index) => ({
				item: index,
			})),
		};
		return [executionData];
	} else {
		if (!fieldsToSplitBy.length) {
			const { pairedItems, ...json } = aggregationResult;
			const executionData: INodeExecutionData = {
				json,
				pairedItem: ((pairedItems as number[]) || []).map((index: number) => ({
					item: index,
				})),
			};
			return [executionData];
		}
		const returnData = aggregationToArray(aggregationResult, fieldsToSplitBy);
		const executionData = returnData.map((item) => {
			const { pairedItems, ...json } = item;
			return {
				json,
				pairedItem: ((pairedItems as number[]) || []).map((index: number) => ({
					item: index,
				})),
			};
		});
		return executionData;
	}
}
