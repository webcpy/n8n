import set from 'lodash/set';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';

export class FilterV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 2,
			defaults: {
				name: 'Filter',
				color: '#229eff',
			},
			inputs: ['main'],
			outputs: ['main'],
			outputNames: ['Kept', 'Discarded'],
			parameterPane: 'wide',
			properties: [
				{
					displayName: '条件',
					name: 'conditions',
					placeholder: '新增条件',
					type: 'filter',
					default: {},
					typeOptions: {
						filter: {
							caseSensitive: '={{!$parameter.options.ignoreCase}}',
							typeValidation: '={{$parameter.options.looseTypeValidation ? "loose" : "strict"}}',
						},
					},
				},
				{
					"displayName": "选项",
					"name": "options",
					"type": "collection",
					"placeholder": "添加选项",
					"default": {},
					"options": [
						{
							"displayName": "忽略大小写",
							"description": "在评估条件时是否忽略字母大小写",
							"name": "ignoreCase",
							"type": "boolean",
							"default": true
						},
						{
							"displayName": "宽松类型验证",
							"description": "是否尝试根据所选运算符对值类型进行强制转换",
							"name": "looseTypeValidation",
							"type": "boolean",
							"default": true
						}
					]
				}
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const keptItems: INodeExecutionData[] = [];
		const discardedItems: INodeExecutionData[] = [];

		this.getInputData().forEach((item, itemIndex) => {
			try {
				const options = this.getNodeParameter('options', itemIndex) as {
					ignoreCase?: boolean;
					looseTypeValidation?: boolean;
				};
				let pass = false;
				try {
					pass = this.getNodeParameter('conditions', itemIndex, false, {
						extractValue: true,
					}) as boolean;
				} catch (error) {
					if (!options.looseTypeValidation) {
						set(
							error,
							'description',
							"Try changing the type of comparison. Alternatively you can enable 'Less Strict Type Validation' in the options.",
						);
					}
					set(error, 'context.itemIndex', itemIndex);
					set(error, 'node', this.getNode());
					throw error;
				}

				if (item.pairedItem === undefined) {
					item.pairedItem = { item: itemIndex };
				}

				if (pass) {
					keptItems.push(item);
				} else {
					discardedItems.push(item);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					discardedItems.push(item);
				} else {
					throw error;
				}
			}
		});

		return [keptItems, discardedItems];
	}
}
