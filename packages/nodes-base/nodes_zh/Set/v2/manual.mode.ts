import type {
	AssignmentCollectionValue,
	FieldType,
	IDataObject,
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../utils/utilities';
import {
	parseJsonParameter,
	validateEntry,
	composeReturnItem,
	resolveRawData,
} from './helpers/utils';
import type { SetField, SetNodeOptions } from './helpers/interfaces';

const properties: INodeProperties[] = [
	{
		displayName: '设置字段',
		name: 'fields',
		placeholder: 'Add Field',
		type: 'fixedCollection',
		description: '编辑现有字段或添加新字段，修改输出数据',
		displayOptions: {
			show: {
				'@version': [3, 3.1, 3.2],
			},
		},
		typeOptions: {
			multipleValues: true,
			sortable: true,
		},
		default: {},
		options: [
			{
				"name": "values",
				"displayName": "值",
				"values": [
					{
						"displayName": "名称",
						"name": "name",
						"type": "string",
						"default": "",
						"placeholder": "例如 fieldName",
						"description": "要设置值的字段名称。支持点符号表示法。示例：data.person[0].name。",
						"requiresDataPath": "single"
					},
					{
						"displayName": "类型",
						"name": "type",
						"type": "options",
						"description": "字段值的类型",
						"options": [
							{
								"name": "字符串",
								"value": "stringValue"
							},
							{
								"name": "数字",
								"value": "numberValue"
							},
							{
								"name": "布尔值",
								"value": "booleanValue"
							},
							{
								"name": "数组",
								"value": "arrayValue"
							},
							{
								"name": "对象",
								"value": "objectValue"
							}
						],
						"default": "stringValue"
					},
					{
						"displayName": "值",
						"name": "stringValue",
						"type": "string",
						"default": "",
						"displayOptions": {
							"show": {
								"type": ["stringValue"]
							}
						},
						"validateType": "string",
						"ignoreValidationDuringExecution": true
					},
					{
						"displayName": "值",
						"name": "numberValue",
						"type": "string",
						"default": "",
						"displayOptions": {
							"show": {
								"type": ["numberValue"]
							}
						},
						"validateType": "number",
						"ignoreValidationDuringExecution": true
					},
					{
						"displayName": "值",
						"name": "booleanValue",
						"type": "options",
						"default": "true",
						"options": [
							{
								"name": "真",
								"value": "true"
							},
							{
								"name": "假",
								"value": "false"
							}
						],
						"displayOptions": {
							"show": {
								"type": ["booleanValue"]
							}
						},
						"validateType": "boolean",
						"ignoreValidationDuringExecution": true
					},
					{
						"displayName": "值",
						"name": "arrayValue",
						"type": "string",
						"default": "",
						"placeholder": "例如 [ arrayItem1, arrayItem2, arrayItem3 ]",
						"displayOptions": {
							"show": {
								"type": ["arrayValue"]
							}
						},
						"validateType": "array",
						"ignoreValidationDuringExecution": true
					},
					{
						"displayName": "值",
						"name": "objectValue",
						"type": "json",
						"default": "={}",
						"typeOptions": {
							"rows": 2
						},
						"displayOptions": {
							"show": {
								"type": ["objectValue"]
							}
						},
						"validateType": "object",
						"ignoreValidationDuringExecution": true
					}
				]
			}
		],
	},
	{
		displayName: '设置字段',
		name: 'assignments',
		type: 'assignmentCollection',
		displayOptions: {
			hide: {
				'@version': [3, 3.1, 3.2],
			},
		},
		default: {},
	},
];

const displayOptions = {
	show: {
		mode: ['manual'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	item: INodeExecutionData,
	i: number,
	options: SetNodeOptions,
	rawFieldsData: IDataObject,
	node: INode,
) {
	try {
		if (node.typeVersion < 3.3) {
			const fields = this.getNodeParameter('fields.values', i, []) as SetField[];

			const newData: IDataObject = {};

			for (const entry of fields) {
				if (
					entry.type === 'objectValue' &&
					rawFieldsData[entry.name] !== undefined &&
					entry.objectValue !== undefined &&
					entry.objectValue !== null
				) {
					entry.objectValue = parseJsonParameter(
						resolveRawData.call(this, rawFieldsData[entry.name] as string, i),
						node,
						i,
						entry.name,
					);
				}

				const { name, value } = validateEntry(
					entry.name,
					entry.type.replace('Value', '') as FieldType,
					entry[entry.type],
					node,
					i,
					options.ignoreConversionErrors,
					node.typeVersion,
				);
				newData[name] = value;
			}

			return composeReturnItem.call(this, i, item, newData, options);
		}

		const assignmentCollection = this.getNodeParameter(
			'assignments',
			i,
		) as AssignmentCollectionValue;
		const newData = Object.fromEntries(
			(assignmentCollection?.assignments ?? []).map((assignment) => {
				const { name, value } = validateEntry(
					assignment.name,
					assignment.type as FieldType,
					assignment.value,
					node,
					i,
					options.ignoreConversionErrors,
					node.typeVersion,
				);

				return [name, value];
			}),
		);
		return composeReturnItem.call(this, i, item, newData, options);
	} catch (error) {
		if (this.continueOnFail()) {
			return { json: { error: (error as Error).message, pairedItem: { item: i } } };
		}
		throw new NodeOperationError(this.getNode(), error as Error, {
			itemIndex: i,
			description: error.description,
		});
	}
}
