import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import lt from 'lodash/lt';
import pick from 'lodash/pick';
import {
	NodeOperationError,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { prepareFieldsArray } from '../utils/utils';
import { compareItems, flattenKeys } from './utils';

export class RemoveDuplicates implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Remove Duplicates',
		name: 'removeDuplicates',
		icon: 'file:removeDuplicates.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: '删除具有匹配字段值的项目',
		defaults: {
			name: 'Remove Duplicates',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "比较",
				"name": "compare",
				"type": "options",
				"options": [
					{
						"name": "所有字段",
						"value": "allFields"
					},
					{
						"name": "除外所有字段",
						"value": "allFieldsExcept"
					},
					{
						"name": "选定字段",
						"value": "selectedFields"
					}
				],
				"default": "allFields",
				"description": "要比较的输入项目的字段，以查看它们是否相同"
			},
			{
				"displayName": "要排除的字段",
				"name": "fieldsToExclude",
				"type": "string",
				"placeholder": "例如，邮箱，姓名",
				"requiresDataPath": "multiple",
				"description": "要从比较中排除的输入字段",
				"default": "",
				"displayOptions": {
					"show": {
						"compare": ["allFieldsExcept"]
					}
				}
			},
			{
				"displayName": "要忽略的字段",
				"name": "fieldsToCompare",
				"type": "string",
				"placeholder": "例如，邮箱，姓名",
				"requiresDataPath": "multiple",
				"description": "要添加到比较中的输入字段",
				"default": "",
				"displayOptions": {
					"show": {
						"compare": ["selectedFields"]
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
						"compare": ["allFieldsExcept", "selectedFields"]
					}
				},
				"options": [
					{
						"displayName": "禁用点符号表示法",
						"name": "disableDotNotation",
						"type": "boolean",
						"default": false,
						"description": "是否禁止使用 `parent.child` 形式来引用子字段"
					},
					{
						"displayName": "删除其他字段",
						"name": "removeOtherFields",
						"type": "boolean",
						"default": false,
						"description": "是否删除未进行比较的任何字段。如果禁用此选项，则会保留第一个重复项的值。"
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const compare = this.getNodeParameter('compare', 0) as string;
		const disableDotNotation = this.getNodeParameter(
			'options.disableDotNotation',
			0,
			false,
		) as boolean;
		const removeOtherFields = this.getNodeParameter(
			'options.removeOtherFields',
			0,
			false,
		) as boolean;

		let keys = disableDotNotation
			? Object.keys(items[0].json)
			: Object.keys(flattenKeys(items[0].json));

		for (const item of items) {
			for (const key of disableDotNotation
				? Object.keys(item.json)
				: Object.keys(flattenKeys(item.json))) {
				if (!keys.includes(key)) {
					keys.push(key);
				}
			}
		}

		if (compare === 'allFieldsExcept') {
			const fieldsToExclude = prepareFieldsArray(
				this.getNodeParameter('fieldsToExclude', 0, '') as string,
				'Fields To Exclude',
			);

			if (!fieldsToExclude.length) {
				throw new NodeOperationError(
					this.getNode(),
					'No fields specified. Please add a field to exclude from comparison',
				);
			}
			if (!disableDotNotation) {
				keys = Object.keys(flattenKeys(items[0].json));
			}
			keys = keys.filter((key) => !fieldsToExclude.includes(key));
		}
		if (compare === 'selectedFields') {
			const fieldsToCompare = prepareFieldsArray(
				this.getNodeParameter('fieldsToCompare', 0, '') as string,
				'Fields To Compare',
			);
			if (!fieldsToCompare.length) {
				throw new NodeOperationError(
					this.getNode(),
					'No fields specified. Please add a field to compare on',
				);
			}
			if (!disableDotNotation) {
				keys = Object.keys(flattenKeys(items[0].json));
			}
			keys = fieldsToCompare.map((key) => key.trim());
		}

		// This solution is O(nlogn)
		// add original index to the items
		const newItems = items.map(
			(item, index) =>
				({
					json: { ...item.json, __INDEX: index },
					pairedItem: { item: index },
				}) as INodeExecutionData,
		);
		//sort items using the compare keys
		newItems.sort((a, b) => {
			let result = 0;

			for (const key of keys) {
				let equal;
				if (!disableDotNotation) {
					equal = isEqual(get(a.json, key), get(b.json, key));
				} else {
					equal = isEqual(a.json[key], b.json[key]);
				}
				if (!equal) {
					let lessThan;
					if (!disableDotNotation) {
						lessThan = lt(get(a.json, key), get(b.json, key));
					} else {
						lessThan = lt(a.json[key], b.json[key]);
					}
					result = lessThan ? -1 : 1;
					break;
				}
			}
			return result;
		});

		for (const key of keys) {
			let type: any = undefined;
			for (const item of newItems) {
				if (key === '') {
					throw new NodeOperationError(this.getNode(), 'Name of field to compare is blank');
				}
				const value = !disableDotNotation ? get(item.json, key) : item.json[key];
				if (value === undefined && disableDotNotation && key.includes('.')) {
					throw new NodeOperationError(
						this.getNode(),
						`'${key}' field is missing from some input items`,
						{
							description:
								"If you're trying to use a nested field, make sure you turn off 'disable dot notation' in the node options",
						},
					);
				} else if (value === undefined) {
					throw new NodeOperationError(
						this.getNode(),
						`'${key}' field is missing from some input items`,
					);
				}
				if (type !== undefined && value !== undefined && type !== typeof value) {
					throw new NodeOperationError(this.getNode(), `'${key}' isn't always the same type`, {
						description: 'The type of this field varies between items',
					});
				} else {
					type = typeof value;
				}
			}
		}

		// collect the original indexes of items to be removed
		const removedIndexes: number[] = [];
		let temp = newItems[0];
		for (let index = 1; index < newItems.length; index++) {
			if (compareItems(newItems[index], temp, keys, disableDotNotation, this.getNode())) {
				removedIndexes.push(newItems[index].json.__INDEX as unknown as number);
			} else {
				temp = newItems[index];
			}
		}

		let returnData = items.filter((_, index) => !removedIndexes.includes(index));

		if (removeOtherFields) {
			returnData = returnData.map((item, index) => ({
				json: pick(item.json, ...keys),
				pairedItem: { item: index },
			}));
		}

		return [returnData];
	}
}
