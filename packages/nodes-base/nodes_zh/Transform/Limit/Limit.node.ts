import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class Limit implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Limit',
		name: 'limit',
		icon: 'file:limit.svg',
		group: ['transform'],
		subtitle: '',
		version: 1,
		description: '限制项目数量',
		defaults: {
			name: 'Limit',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "最大项目数",
				"name": "maxItems",
				"type": "number",
				"typeOptions": {
					"minValue": 1
				},
				"default": 1,
				"description": "如果项目数量超过这个数字，将会移除一些项目"
			},
			{
				"displayName": "保留",
				"name": "keep",
				"type": "options",
				"options": [
					{
						"name": "首要项目",
						"value": "firstItems"
					},
					{
						"name": "末尾项目",
						"value": "lastItems"
					}
				],
				"default": "firstItems",
				"description": "在移除项目时，是否保留起始或末尾的项目"
			}

		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let returnData = items;
		const maxItems = this.getNodeParameter('maxItems', 0) as number;
		const keep = this.getNodeParameter('keep', 0) as string;

		if (maxItems > items.length) {
			return [returnData];
		}

		if (keep === 'firstItems') {
			returnData = items.slice(0, maxItems);
		} else {
			returnData = items.slice(items.length - maxItems, items.length);
		}
		return [returnData];
	}
}
