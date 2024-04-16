import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: 'Text Input',
		name: 'input',
		type: 'string',
		placeholder: '例如：这里放置示例文本',
		description: '要分类的输入文本，用于判断是否违反了审查政策',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: '简化输出',
		name: 'simplify',
		type: 'boolean',
		default: false,
		description: '是否返回简化版本的响应而不是原始数据',
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '使用稳定模型',
				name: 'useStableModel',
				type: 'boolean',
				default: false,
				description: '是否使用模型的稳定版本而不是最新版本，准确性可能稍低',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['classify'],
		resource: ['text'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const input = this.getNodeParameter('input', i) as string;
	const options = this.getNodeParameter('options', i);
	const model = options.useStableModel ? 'text-moderation-stable' : 'text-moderation-latest';

	const body = {
		input,
		model,
	};

	const { results } = await apiRequest.call(this, 'POST', '/moderations', { body });

	if (!results) return [];

	const simplify = this.getNodeParameter('simplify', i) as boolean;

	if (simplify && results) {
		return [
			{
				json: { flagged: results[0].flagged },
				pairedItem: { item: i },
			},
		];
	} else {
		return [
			{
				json: results[0],
				pairedItem: { item: i },
			},
		];
	}
}
