import type {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
} from 'n8n-workflow';
import { jsonParse, updateDisplayOptions } from 'n8n-workflow';
import type { Tool } from '@langchain/core/tools';
import { apiRequest } from '../../transport';
import type { ChatCompletion } from '../../helpers/interfaces';
import { formatToOpenAIAssistantTool } from '../../helpers/utils';
import { modelRLC } from '../descriptions';
import { getConnectedTools } from '../../../../../utils/helpers';
import { MODELS_NOT_SUPPORT_FUNCTION_CALLS } from '../../helpers/constants';

const properties: INodeProperties[] = [
	modelRLC,
	{
		displayName: '消息',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: {
			sortable: true,
			multipleValues: true,
		},
		placeholder: '添加消息',
		default: {
			values: [
				{
					content: '',
				},
			],
		},
		options: [
			{
				displayName: '值',
				name: 'values',
				values: [
					{
						displayName: '文本',
						name: 'content',
						type: 'string',
						description: '要发送的消息内容',
						default: '',
						typeOptions: {
							rows: 2,
						},
					},
					{
						displayName: '角色',
						name: 'role',
						type: 'options',
						description: '塑造模型响应的角色，告诉模型应该如何行为和与用户交互',
						options: [
							{
								name: '用户',
								value: 'user',
								description: '以用户身份发送消息并从模型获得响应',
							},
							{
								name: '助手',
								value: 'assistant',
								description: '告诉模型采用特定的语调或个性',
							},
							{
								name: '系统',
								value: 'system',
								description: '通常用于设置模型的行为或下一个用户消息的上下文',
							},
						],
						default: 'user',
					},
				],
			},
		],
	},
	{
		displayName: '简化输出',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: '是否返回简化版本的响应而不是原始数据',
	},
	{
		displayName: '将输出内容作为JSON',
		name: 'jsonOutput',
		type: 'boolean',
		description:
			'是否尝试以JSON格式返回响应。与GPT-4 Turbo兼容，以及所有新于gpt-3.5-turbo-1106的GPT-3.5 Turbo模型。',
		default: false,
	},
	{
		displayName: '隐藏工具',
		name: 'hideTools',
		type: 'hidden',
		default: 'hide',
		displayOptions: {
			show: {
				modelId: MODELS_NOT_SUPPORT_FUNCTION_CALLS,
				'@version': [
					{
						_cnd: {
							gte: 1.2,
						},
					},
				],
			},
		},
	},
	{
		displayName: '将您自己的自定义n8n工具连接到画布上的此节点',
		name: 'noticeTools',
		type: 'notice',
		default: '',
		displayOptions: {
			hide: {
				hideTools: ['hide'],
			},
		},
	},

	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '频率惩罚',
				name: 'frequency_penalty',
				default: 0,
				typeOptions: {
					maxValue: 2,
					minValue: -2,
					numberPrecision: 1,
				},
				description: '正值根据文本中已有的标记频率对新标记进行惩罚，降低模型直接重复相同行的可能性',
				type: 'number',
			},
			{
				displayName: '最大标记数',
				name: 'maxTokens',
				default: 16,
				description:
					'生成完成时要生成的最大标记数。大多数模型的上下文长度为2048个标记（除了最新的支持32768个标记的模型）。',
				type: 'number',
				typeOptions: {
					maxValue: 32768,
				},
			},
			{
				displayName: '完成数量',
				name: 'n',
				default: 1,
				description:
					'每个提示要生成的完成数。注意：由于此参数生成许多完成，因此可能会迅速消耗您的标记配额。请谨慎使用，并确保您对max_tokens和stop设置了合理的设置。',
				type: 'number',
			},
			{
				displayName: '存在惩罚',
				name: 'presence_penalty',
				default: 0,
				typeOptions: {
					maxValue: 2,
					minValue: -2,
					numberPrecision: 1,
				},
				description: '正值根据文本中新标记的出现情况对其进行惩罚，增加模型谈论新主题的可能性',
				type: 'number',
			},
			{
				displayName: '输出随机性（温度）',
				name: 'temperature',
				default: 1,
				typeOptions: {
					maxValue: 1,
					minValue: 0,
					numberPrecision: 1,
				},
				description:
					'控制随机性：降低会导致更少随机的完成。当温度接近零时，模型将变得确定性和重复性。我们通常建议更改此项或温度但不要同时更改两项。',
				type: 'number',
			},
			{
				displayName: '输出随机性（Top P）',
				name: 'topP',
				default: 1,
				typeOptions: {
					maxValue: 1,
					minValue: 0,
					numberPrecision: 1,
				},
				description:
					'与温度采样的替代方法，通过核心采样控制多样性：0.5表示考虑所有加权选项的一半。我们通常建议更改此项或温度但不要同时更改两项。',
				type: 'number',
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['message'],
		resource: ['text'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const nodeVersion = this.getNode().typeVersion;
	const model = this.getNodeParameter('modelId', i, '', { extractValue: true });
	let messages = this.getNodeParameter('messages.values', i, []) as IDataObject[];
	const options = this.getNodeParameter('options', i, {});
	const jsonOutput = this.getNodeParameter('jsonOutput', i, false) as boolean;

	if (options.maxTokens !== undefined) {
		options.max_tokens = options.maxTokens;
		delete options.maxTokens;
	}

	if (options.topP !== undefined) {
		options.top_p = options.topP;
		delete options.topP;
	}

	let response_format;
	if (jsonOutput) {
		response_format = { type: 'json_object' };
		messages = [
			{
				role: 'system',
				content: 'You are a helpful assistant designed to output JSON.',
			},
			...messages,
		];
	}

	const hideTools = this.getNodeParameter('hideTools', i, '') as string;

	let tools;
	let externalTools: Tool[] = [];

	if (hideTools !== 'hide') {
		const enforceUniqueNames = nodeVersion > 1;
		externalTools = await getConnectedTools(this, enforceUniqueNames);
	}

	if (externalTools.length) {
		tools = externalTools.length ? externalTools?.map(formatToOpenAIAssistantTool) : undefined;
	}

	const body: IDataObject = {
		model,
		messages,
		tools,
		response_format,
		...options,
	};

	let response = (await apiRequest.call(this, 'POST', '/chat/completions', {
		body,
	})) as ChatCompletion;

	if (!response) return [];

	let toolCalls = response?.choices[0]?.message?.tool_calls;

	while (toolCalls?.length) {
		messages.push(response.choices[0].message);

		for (const toolCall of toolCalls) {
			const functionName = toolCall.function.name;
			const functionArgs = toolCall.function.arguments;

			let functionResponse;
			for (const tool of externalTools ?? []) {
				if (tool.name === functionName) {
					const parsedArgs: { input: string } = jsonParse(functionArgs);
					const functionInput = parsedArgs.input ?? functionArgs;
					functionResponse = await tool.invoke(functionInput);
				}
			}

			if (typeof functionResponse === 'object') {
				functionResponse = JSON.stringify(functionResponse);
			}

			messages.push({
				tool_call_id: toolCall.id,
				role: 'tool',
				content: functionResponse,
			});
		}

		response = (await apiRequest.call(this, 'POST', '/chat/completions', {
			body,
		})) as ChatCompletion;

		toolCalls = response.choices[0].message.tool_calls;
	}

	if (response_format) {
		response.choices = response.choices.map((choice) => {
			try {
				choice.message.content = JSON.parse(choice.message.content);
			} catch (error) {}
			return choice;
		});
	}

	const simplify = this.getNodeParameter('simplify', i) as boolean;

	const returnData: INodeExecutionData[] = [];

	if (simplify) {
		for (const entry of response.choices) {
			returnData.push({
				json: entry,
				pairedItem: { item: i },
			});
		}
	} else {
		returnData.push({ json: response, pairedItem: { item: i } });
	}

	return returnData;
}
