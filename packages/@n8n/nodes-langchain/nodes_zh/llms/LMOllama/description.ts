import type { INodeProperties, INodeTypeDescription } from 'n8n-workflow';

export const ollamaDescription: Partial<INodeTypeDescription> = {
	credentials: [
		{
			name: 'ollamaApi',
			required: true,
		},
	],
	requestDefaults: {
		ignoreHttpStatusErrors: true,
		baseURL: '={{ $credentials.baseUrl.replace(new RegExp("/$"), "") }}',
	},
};

export const ollamaModel: INodeProperties = {
	displayName: '模型',
	name: 'model',
	type: 'options',
	default: 'llama2',
	description:
		'生成完成的模型。要下载模型，请访问<a href="https://ollama.ai/library">Ollama Models Library</a>。',
	typeOptions: {
		loadOptions: {
			routing: {
				request: {
					method: 'GET',
					url: '/api/tags',
				},
				output: {
					postReceive: [
						{
							type: 'rootProperty',
							properties: {
								property: 'models',
							},
						},
						{
							type: 'setKeyValue',
							properties: {
								name: '={{$responseItem.name}}',
								value: '={{$responseItem.name}}',
							},
						},
						{
							type: 'sort',
							properties: {
								key: 'name',
							},
						},
					],
				},
			},
		},
	},
	routing: {
		send: {
			type: 'body',
			property: 'model',
		},
	},
	required: true,
};

export const ollamaOptions: INodeProperties = {
	displayName: '选项',
	name: 'options',
	placeholder: '添加选项',
	description: '添加额外的选项',
	type: 'collection',
	default: {},
	options: [
		{
			displayName: '采样温度',
			name: 'temperature',
			default: 0.7,
			typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
			description:
				'控制随机性：降低温度会导致更少的随机完成。当温度接近零时，模型将变得确定性和重复性。',
			type: 'number',
		},
		{
			displayName: 'Top K',
			name: 'topK',
			default: -1,
			typeOptions: { maxValue: 1, minValue: -1, numberPrecision: 1 },
			description: '用于删除“long tail”低概率的响应。默认为 -1，表示禁用。',
			type: 'number',
		},
		{
			displayName: 'Top P',
			name: 'topP',
			default: 1,
			typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
			description:
				'通过核心采样控制多样性：0.5 表示考虑一半的所有可能性加权选项。我们通常建议修改这个或温度但不是两者都修改。',
			type: 'number',
		},
	],
};
