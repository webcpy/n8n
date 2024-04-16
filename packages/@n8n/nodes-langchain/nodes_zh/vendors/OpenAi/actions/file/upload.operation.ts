import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { updateDisplayOptions, NodeOperationError } from 'n8n-workflow';
import FormData from 'form-data';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: '输入数据字段名称',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		hint: '包含要处理的二进制文件数据的输入字段的名称',
		placeholder: '例如：data',
		description: '包含文件的二进制属性名称。单个文件的大小最大可为512 MB或200万个标记（对于助手）',
	},
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
				default: 'assistants',
				description: "上传文件的预期用途，'Fine-tune' 仅支持 .jsonl 格式的文件",
				options: [
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
		operation: ['upload'],
		resource: ['file'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
	const options = this.getNodeParameter('options', i, {});

	const formData = new FormData();

	formData.append('purpose', options.purpose || 'assistants');

	const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
	const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	formData.append('file', dataBuffer, {
		filename: binaryData.fileName,
		contentType: binaryData.mimeType,
	});

	try {
		const response = await apiRequest.call(this, 'POST', '/files', {
			option: { formData },
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});

		return [
			{
				json: response,
				pairedItem: { item: i },
			},
		];
	} catch (error) {
		if (
			error.message.includes('Bad request') &&
			error.description?.includes('Expected file to have JSONL format')
		) {
			throw new NodeOperationError(this.getNode(), 'The file content is not in JSONL format', {
				description:
					'Fine-tuning accepts only files in JSONL format, where every line is a valid JSON dictionary',
			});
		}
		throw error;
	}
}
