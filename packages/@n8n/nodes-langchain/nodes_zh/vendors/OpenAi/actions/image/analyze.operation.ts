import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { updateDisplayOptions, NodeOperationError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: '文本输入',
		name: 'text',
		type: 'string',
		placeholder: '例如：这张图片是什么？',
		default: '这张图片是什么？',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: '输入类型',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: '图片链接',
				value: 'url',
			},
			{
				name: '二进制文件',
				value: 'base64',
			},
		],
	},
	{
		displayName: 'URL链接',
		name: 'imageUrls',
		type: 'string',
		placeholder: '例如：https://example.com/image.jpeg',
		description: '要分析的图片的URL链接，可以用逗号分隔添加多个URL链接',
		default: '',
		displayOptions: {
			show: {
				inputType: ['url'],
			},
		},
	},
	{
		displayName: '输入数据字段名称',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		placeholder: '例如：data',
		hint: '包含要处理的二进制文件数据的输入字段的名称',
		description: '包含图片的二进制属性名称',
		displayOptions: {
			show: {
				inputType: ['base64'],
			},
		},
	},
	{
		displayName: '简化输出',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: '是否简化响应',
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '详情',
				name: 'detail',
				type: 'options',
				default: 'auto',
				options: [
					{
						name: '自动',
						value: 'auto',
						description: '模型将查看图像输入大小，并决定是使用低还是高设置',
					},
					{
						name: '低',
						value: 'low',
						description: '返回更快的响应并消耗更少的令牌',
					},
					{
						name: '高',
						value: 'high',
						description: '返回更详细的响应，消耗更多的令牌',
					},
				],
			},
			{
				displayName: '描述长度（最大令牌数）',
				description: '更少的令牌将导致更短、更少详细的图像描述',
				name: 'maxTokens',
				type: 'number',
				default: 300,
				typeOptions: {
					minValue: 1,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['analyze'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = 'gpt-4-vision-preview';
	const text = this.getNodeParameter('text', i, '') as string;
	const inputType = this.getNodeParameter('inputType', i) as string;
	const options = this.getNodeParameter('options', i, {});

	const content: IDataObject[] = [
		{
			type: 'text',
			text,
		},
	];

	const detail = (options.detail as string) || 'auto';

	if (inputType === 'url') {
		const imageUrls = (this.getNodeParameter('imageUrls', i) as string)
			.split(',')
			.map((url) => url.trim());

		for (const url of imageUrls) {
			content.push({
				type: 'image_url',
				image_url: {
					url,
					detail,
				},
			});
		}
	} else {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i)
			.split(',')
			.map((propertyName) => propertyName.trim());

		for (const propertyName of binaryPropertyName) {
			const binaryData = this.helpers.assertBinaryData(i, propertyName);

			let fileBase64;
			if (binaryData.id) {
				const chunkSize = 256 * 1024;
				const stream = await this.helpers.getBinaryStream(binaryData.id, chunkSize);
				const buffer = await this.helpers.binaryToBuffer(stream);
				fileBase64 = buffer.toString('base64');
			} else {
				fileBase64 = binaryData.data;
			}

			if (!binaryData) {
				throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
			}

			content.push({
				type: 'image_url',
				image_url: {
					url: `data:${binaryData.mimeType};base64,${fileBase64}`,
					detail,
				},
			});
		}
	}

	const body = {
		model,
		messages: [
			{
				role: 'user',
				content,
			},
		],
		max_tokens: (options.maxTokens as number) || 300,
	};

	let response = await apiRequest.call(this, 'POST', '/chat/completions', { body });

	const simplify = this.getNodeParameter('simplify', i) as boolean;

	if (simplify && response.choices) {
		response = { content: response.choices[0].message.content };
	}

	return [
		{
			json: response,
			pairedItem: { item: i },
		},
	];
}
