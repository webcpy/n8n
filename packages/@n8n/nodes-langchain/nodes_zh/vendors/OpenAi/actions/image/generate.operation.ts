import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: '模型',
		name: 'model',
		type: 'options',
		default: 'dall-e-3',
		description: '用于图像生成的模型',
		options: [
			{
				name: 'DALL-E-2',
				value: 'dall-e-2',
			},
			{
				name: 'DALL-E-3',
				value: 'dall-e-3',
			},
		],
	},
	{
		displayName: '提示',
		name: 'prompt',
		type: 'string',
		placeholder: '例如：一只可爱的猫吃恐龙',
		description:
			'所需图像的文本描述。DALL-E-2 的最大长度为 1000 个字符，DALL-E-3 的最大长度为 4000 个字符。',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},

	{
		displayName: '选项',
		name: 'options',
		placeholder: '新增选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '图像数量',
				name: 'n',
				default: 1,
				description: '要生成的图像数量',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				displayOptions: {
					show: {
						'/model': ['dall-e-2'],
					},
				},
			},
			{
				displayName: '质量',
				name: 'quality',
				type: 'options',
				description: '将生成的图像质量，高清（HD）可以生成具有更细节和图像内一致性的图像',
				options: [
					{
						name: '高清（HD）',
						value: 'hd',
					},
					{
						name: '标准',
						value: 'standard',
					},
				],
				displayOptions: {
					show: {
						'/model': ['dall-e-3'],
					},
				},
				default: 'standard',
			},
			{
				displayName: '分辨率',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '256x256',
						value: '256x256',
					},
					{
						name: '512x512',
						value: '512x512',
					},
					{
						name: '1024x1024',
						value: '1024x1024',
					},
				],
				displayOptions: {
					show: {
						'/model': ['dall-e-2'],
					},
				},
				default: '1024x1024',
			},
			{
				displayName: '分辨率',
				name: 'size',
				type: 'options',
				options: [
					{
						name: '1024x1024',
						value: '1024x1024',
					},
					{
						name: '1792x1024',
						value: '1792x1024',
					},
					{
						name: '1024x1792',
						value: '1024x1792',
					},
				],
				displayOptions: {
					show: {
						'/model': ['dall-e-3'],
					},
				},
				default: '1024x1024',
			},
			{
				displayName: '风格',
				name: 'style',
				type: 'options',
				options: [
					{
						name: '自然',
						value: 'natural',
						description: '生成更自然的图像',
					},
					{
						name: '生动',
						value: 'vivid',
						description: '倾向于生成超现实和戏剧性的图像',
					},
				],
				displayOptions: {
					show: {
						'/model': ['dall-e-3'],
					},
				},
				default: 'vivid',
			},
			{
				displayName: '返回图像 URL',
				name: 'returnImageUrls',
				type: 'boolean',
				default: false,
				description: '是否返回图像 URL 而不是二进制文件',
				displayOptions: {
					show: {
						returnImageUrls: [false],
					},
				},
			},
			{
				displayName: '输出字段',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				hint: '将二进制文件数据放入的输出字段的名称',
				displayOptions: {
					show: {
						returnImageUrls: [false],
					},
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['image'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', i) as string;
	const prompt = this.getNodeParameter('prompt', i) as string;
	const options = this.getNodeParameter('options', i, {});
	let response_format = 'b64_json';
	let binaryPropertyOutput = 'data';

	if (options.returnImageUrls) {
		response_format = 'url';
	}

	if (options.binaryPropertyOutput) {
		binaryPropertyOutput = options.binaryPropertyOutput as string;
		delete options.binaryPropertyOutput;
	}

	delete options.returnImageUrls;

	const body: IDataObject = {
		prompt,
		model,
		response_format,
		...options,
	};

	const { data } = await apiRequest.call(this, 'POST', '/images/generations', { body });

	if (response_format === 'url') {
		return ((data as IDataObject[]) || []).map((entry) => ({
			json: entry,
			pairedItem: { item: i },
		}));
	} else {
		const returnData: INodeExecutionData[] = [];

		for (const entry of data) {
			const binaryData = await this.helpers.prepareBinaryData(
				Buffer.from(entry.b64_json as string, 'base64'),
				'data',
			);
			returnData.push({
				json: Object.assign({}, binaryData, {
					data: undefined,
				}),
				binary: {
					[binaryPropertyOutput]: binaryData,
				},
				pairedItem: { item: i },
			});
		}

		return returnData;
	}
}
