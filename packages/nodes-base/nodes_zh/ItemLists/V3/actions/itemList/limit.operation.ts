import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from '@utils/utilities';

const properties: INodeProperties[] = [
	{
		"displayName": "最大项目数",
		"name": "maxItems",
		"type": "number",
		"typeOptions": {
			"minValue": 1
		},
		"default": 1,
		"description": "如果项目数超过此数字，将删除一些项目"
	},
	{
		"displayName": "保留",
		"name": "keep",
		"type": "options",
		"options": [
			{
				"name": "第一个项目",
				"value": "firstItems"
			},
			{
				"name": "最后一个项目",
				"value": "lastItems"
			}
		],
		"default": "firstItems",
		"description": "在删除项目时，是保留起始项目还是末尾项目"
	}
];

const displayOptions = {
	show: {
		resource: ['itemList'],
		operation: ['limit'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	let returnData = items;
	const maxItems = this.getNodeParameter('maxItems', 0) as number;
	const keep = this.getNodeParameter('keep', 0) as string;

	if (maxItems > items.length) {
		return returnData;
	}

	if (keep === 'firstItems') {
		returnData = items.slice(0, maxItems);
	} else {
		returnData = items.slice(items.length - maxItems, items.length);
	}
	return returnData;
}
