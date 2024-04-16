import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';
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
		description:
			'包含音频文件的二进制属性名称，格式可以为以下之一：flac、mp3、mp4、mpeg、mpga、m4a、ogg、wav或webm',
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '输出随机性（温度）',
				name: 'temperature',
				type: 'number',
				default: 0,
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberPrecision: 1,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['translate'],
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = 'whisper-1';
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i);
	const options = this.getNodeParameter('options', i, {});

	const formData = new FormData();

	formData.append('model', model);

	if (options.temperature) {
		formData.append('temperature', options.temperature.toString());
	}

	const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
	const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

	formData.append('file', dataBuffer, {
		filename: binaryData.fileName,
		contentType: binaryData.mimeType,
	});

	const response = await apiRequest.call(this, 'POST', '/audio/translations', {
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
}
