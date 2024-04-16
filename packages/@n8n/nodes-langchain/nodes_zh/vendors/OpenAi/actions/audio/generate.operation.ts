import type {
	INodeProperties,
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: '模型',
		name: 'model',
		type: 'options',
		default: 'tts-1',
		options: [
			{
				name: 'TTS-1',
				value: 'tts-1',
			},
			{
				name: 'TTS-1-HD',
				value: 'tts-1-hd',
			},
		],
	},
	{
		displayName: '文本输入',
		name: 'input',
		type: 'string',
		placeholder: '例如：快速的棕色狐狸跳过了懒惰的狗',
		description: '生成音频的文本。最大长度为4096个字符。',
		default: '',
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: '语音',
		name: 'voice',
		type: 'options',
		default: 'alloy',
		description: '生成音频时要使用的语音',
		options: [
			{
				name: '合金',
				value: 'alloy',
			},
			{
				name: '回声',
				value: 'echo',
			},
			{
				name: '寓言',
				value: 'fable',
			},
			{
				name: '新星',
				value: 'nova',
			},
			{
				name: '玛瑙',
				value: 'onyx',
			},
			{
				name: '闪光',
				value: 'shimmer',
			},
		],
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '响应格式',
				name: 'response_format',
				type: 'options',
				default: 'mp3',
				options: [
					{
						name: 'MP3',
						value: 'mp3',
					},
					{
						name: 'OPUS',
						value: 'opus',
					},
					{
						name: 'AAC',
						value: 'aac',
					},
					{
						name: 'FLAC',
						value: 'flac',
					},
				],
			},
			{
				displayName: '音频速度',
				name: 'speed',
				type: 'number',
				default: 1,
				typeOptions: {
					minValue: 0.25,
					maxValue: 4,
					numberPrecision: 1,
				},
			},
			{
				displayName: '将输出放入字段',
				name: 'binaryPropertyOutput',
				type: 'string',
				default: 'data',
				hint: '要将二进制文件数据放入的输出字段的名称',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generate'],
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', i) as string;
	const input = this.getNodeParameter('input', i) as string;
	const voice = this.getNodeParameter('voice', i) as string;
	let response_format = 'mp3';
	let speed = 1;

	const options = this.getNodeParameter('options', i, {});

	if (options.response_format) {
		response_format = options.response_format as string;
	}

	if (options.speed) {
		speed = options.speed as number;
	}

	const body: IDataObject = {
		model,
		input,
		voice,
		response_format,
		speed,
	};

	const option = {
		useStream: true,
		returnFullResponse: true,
		encoding: 'arraybuffer',
		json: false,
	};

	const response = await apiRequest.call(this, 'POST', '/audio/speech', { body, option });

	const binaryData = await this.helpers.prepareBinaryData(
		response,
		`audio.${response_format}`,
		`audio/${response_format}`,
	);

	const binaryPropertyOutput = (options.binaryPropertyOutput as string) || 'data';

	const newItem: INodeExecutionData = {
		json: {
			...binaryData,
			data: undefined,
		},
		pairedItem: { item: i },
		binary: {
			[binaryPropertyOutput]: binaryData,
		},
	};

	return [newItem];
}
