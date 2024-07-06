import type {
	IDataObject,
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '目的',
				name: 'purpose',
				type: 'options',
				default: 'any',
				description: '只返回具有给定目的的文件',
				options: [
					{
						name: '任何 [默认]',
						value: 'any',
					},
					{
						name: '助手',
						value: 'assistants',
					},
					{
						name: 'Fine-Tune',
						value: 'fine-tune',
					},
				],
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['list'],
		resource: ['file'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const options = this.getNodeParameter('options', i, {});
	const qs: IDataObject = {};

	if (options.purpose && options.purpose !== 'any') {
		qs.purpose = options.purpose as string;
	}

	const { data } = await apiRequest.call(this, 'GET', '/files', { qs });

	return (data || []).map((file: IDataObject) => ({
		json: file,
		pairedItem: { item: i },
	}));
}
