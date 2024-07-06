import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameters,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	NodeParameterValue,
} from 'n8n-workflow';

import { compareOperationFunctions, convertDateTime } from './GenericFunctions';

export class FilterV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: 1,
			defaults: {
				name: 'Filter',
				color: '#229eff',
			},
			inputs: ['main'],
			outputs: ['main'],
			outputNames: ['Kept', 'Discarded'],
			properties: [
				{
					displayName: '条件',
					name: 'conditions',
					placeholder: '添加条件',
					type: 'fixedCollection',
					typeOptions: {
						multipleValues: true,
						sortable: true,
					},
					description: '要比较的值的类型',
					default: {},
					options: [
						{
							"displayName": "布尔值",
							"name": "boolean",
							"values": [
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"boolean"
											]
										}
									},
									"displayName": "值 1",
									"name": "value1",
									"type": "boolean",
									"default": false,
									"description": "与第二个值进行比较的值"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"boolean"
											]
										}
									},
									"displayName": "操作",
									"name": "operation",
									"type": "options",
									"options": [
										{
											"name": "相等",
											"value": "equal"
										},
										{
											"name": "不相等",
											"value": "notEqual"
										}
									],
									"default": "equal",
									"description": "决定数据应该映射到何处的操作"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"boolean"
											]
										}
									},
									"displayName": "值 2",
									"name": "value2",
									"type": "boolean",
									"default": false,
									"description": "与第一个值进行比较的值"
								}
							]
						},

						{
							"displayName": "日期与时间",
							"name": "dateTime",
							"values": [
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"dateTime"
											]
										}
									},
									"displayName": "值 1",
									"name": "value1",
									"type": "dateTime",
									"default": "",
									"description": "与第二个值进行比较的值"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"dateTime"
											]
										}
									},
									"displayName": "操作",
									"name": "operation",
									"type": "options",
									"options": [
										{
											"name": "发生于之后",
											"value": "after"
										},
										{
											"name": "发生于之前",
											"value": "before"
										}
									],
									"default": "after",
									"description": "决定数据应该映射到何处的操作"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"dateTime"
											]
										}
									},
									"displayName": "值 2",
									"name": "value2",
									"type": "dateTime",
									"default": "",
									"description": "与第一个值进行比较的值"
								}
							]
						},


						{
							"displayName": "数字",
							"name": "number",
							"values": [
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"number"
											]
										}
									},
									"displayName": "值 1",
									"name": "value1",
									"type": "number",
									"default": 0,
									"description": "与第二个值进行比较的值"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"number"
											]
										}
									},
									"displayName": "操作",
									"name": "operation",
									"type": "options",
									"options": [
										{
											"name": "小于",
											"value": "smaller"
										},
										{
											"name": "小于或等于",
											"value": "smallerEqual"
										},
										{
											"name": "等于",
											"value": "equal"
										},
										{
											"name": "不等于",
											"value": "notEqual"
										},
										{
											"name": "大于",
											"value": "larger"
										},
										{
											"name": "大于或等于",
											"value": "largerEqual"
										},
										{
											"name": "为空",
											"value": "isEmpty"
										},
										{
											"name": "不为空",
											"value": "isNotEmpty"
										}
									],
									"default": "smaller",
									"description": "决定数据应该映射到何处的操作"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"number"
											],
											"operation": [
												"smaller",
												"smallerEqual",
												"equal",
												"notEqual",
												"larger",
												"largerEqual"
											]
										}
									},
									"displayName": "值 2",
									"name": "value2",
									"type": "number",
									"default": 0,
									"description": "与第一个值进行比较的值"
								}
							]
						},


						{
							"displayName": "字符串",
							"name": "string",
							"values": [
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"string"
											]
										}
									},
									"displayName": "值 1",
									"name": "value1",
									"type": "string",
									"default": "",
									"description": "与第二个值进行比较的值"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"string"
											]
										}
									},
									"displayName": "操作",
									"name": "operation",
									"type": "options",
									"options": [
										{
											"name": "包含",
											"value": "contains"
										},
										{
											"name": "不包含",
											"value": "notContains"
										},
										{
											"name": "以...结尾",
											"value": "endsWith"
										},
										{
											"name": "不以...结尾",
											"value": "notEndsWith"
										},
										{
											"name": "等于",
											"value": "equal"
										},
										{
											"name": "不等于",
											"value": "notEqual"
										},
										{
											"name": "正则匹配",
											"value": "regex"
										},
										{
											"name": "正则不匹配",
											"value": "notRegex"
										},
										{
											"name": "以...开始",
											"value": "startsWith"
										},
										{
											"name": "不以...开始",
											"value": "notStartsWith"
										},
										{
											"name": "为空",
											"value": "isEmpty"
										},
										{
											"name": "不为空",
											"value": "isNotEmpty"
										}
									],
									"default": "equal",
									"description": "决定数据应该映射到何处的操作"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"string"
											],
											"operation": [
												"contains",
												"notContains",
												"endsWith",
												"notEndsWith",
												"equal",
												"notEqual",
												"startsWith",
												"notStartsWith"
											]
										}
									},
									"displayName": "值 2",
									"name": "value2",
									"type": "string",
									"default": "",
									"description": "与第一个值进行比较的值"
								},
								{
									"displayOptions": {
										"show": {
											"@dataType": [
												"string"
											],
											"operation": [
												"regex",
												"notRegex"
											]
										}
									},
									"displayName": "正则表达式",
									"name": "value2",
									"type": "string",
									"default": "",
									"placeholder": "/text/i",
									"description": "必须匹配的正则表达式"
								}
							]
						}

					],
				},
				{
					"displayName": "组合条件",
					"name": "combineConditions",
					"type": "options",
					"options": [
						{
							"name": "AND",
							"description": "仅当所有条件都满足时，项目才会传递到下一个节点",
							"value": "AND"
						},
						{
							"name": "OR",
							"description": "如果满足至少一个条件，则项目将传递到下一个节点",
							"value": "OR"
						}
					],
					"default": "AND",
					"description": "如何组合条件：AND 要求所有条件都为真，OR 要求至少一个条件为真"
				}
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnDataTrue: INodeExecutionData[] = [];
		const returnDataFalse: INodeExecutionData[] = [];

		const items = this.getInputData();

		const dataTypes = ['boolean', 'dateTime', 'number', 'string'];

		itemLoop: for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];

			const combineConditions = this.getNodeParameter('combineConditions', itemIndex) as string;

			for (const dataType of dataTypes) {
				const typeConditions = this.getNodeParameter(
					`conditions.${dataType}`,
					itemIndex,
					[],
				) as INodeParameters[];

				for (const condition of typeConditions) {
					let value1 = condition.value1 as NodeParameterValue;
					let value2 = condition.value2 as NodeParameterValue;

					if (dataType === 'dateTime') {
						const node = this.getNode();
						value1 = convertDateTime(node, value1);
						value2 = convertDateTime(node, value2);
					}

					const compareResult = compareOperationFunctions[condition.operation as string](
						value1,
						value2,
					);

					if (item.pairedItem === undefined) {
						item.pairedItem = [{ item: itemIndex }];
					}

					// If the operation is "OR" it means the item did match one condition no ned to check further
					if (compareResult && combineConditions === 'OR') {
						returnDataTrue.push(item);
						continue itemLoop;
					}

					// If the operation is "AND" it means the item failed one condition no ned to check further
					if (!compareResult && combineConditions === 'AND') {
						returnDataFalse.push(item);
						continue itemLoop;
					}
				}
			}

			// If the operation is "AND" it means the item did match all conditions
			if (combineConditions === 'AND') {
				returnDataTrue.push(item);
			} else {
				// If the operation is "OR" it means the the item did not match any condition.
				returnDataFalse.push(item);
			}
		}

		return [returnDataTrue, returnDataFalse];
	}
}
