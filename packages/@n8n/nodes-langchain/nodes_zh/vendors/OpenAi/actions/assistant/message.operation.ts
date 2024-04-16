import { AgentExecutor } from 'langchain/agents';

import { OpenAIAssistantRunnable } from 'langchain/experimental/openai_assistant';
import type { OpenAIToolType } from 'langchain/dist/experimental/openai_assistant/schema';
import { OpenAI as OpenAIClient } from 'openai';

import { NodeOperationError, updateDisplayOptions } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { formatToOpenAIAssistantTool } from '../../helpers/utils';
import { assistantRLC } from '../descriptions';

import { getConnectedTools } from '../../../../../utils/helpers';
import { getTracingConfig } from '../../../../../utils/tracing';

const properties: INodeProperties[] = [
	assistantRLC,
	{
		displayName: '提示',
		name: 'prompt',
		type: 'options',
		options: [
			{
				name: '自动获取',
				value: 'auto',
				description: '自动查找名为chatInput的输入字段',
			},
			{
				name: '在下方定义',
				value: 'define',
				description: '使用表达式引用上一个节点中的数据或输入静态文本',
			},
		],
		default: 'auto',
	},
	{
		displayName: '文本',
		name: 'text',
		type: 'string',
		default: '',
		placeholder: '例如：你好，我可以怎么帮助你？',
		typeOptions: {
			rows: 2,
		},
		displayOptions: {
			show: {
				prompt: ['define'],
			},
		},
	},
	{
		displayName: '将您自己的自定义 n8n 工具连接到画布上的这个节点',
		name: 'noticeTools',
		type: 'notice',
		default: '',
	},
	{
		displayName: '选项',
		name: 'options',
		placeholder: '添加选项',
		description: '要添加的额外选项',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: '基础URL',
				name: 'baseURL',
				default: 'https://api.openai.com/v1',
				description: '覆盖API的默认基础URL',
				type: 'string',
			},
			{
				displayName: '最大重试次数',
				name: 'maxRetries',
				default: 2,
				description: '尝试的最大重试次数',
				type: 'number',
			},
			{
				displayName: '超时',
				name: 'timeout',
				default: 10000,
				description: '允许请求花费的最长时间（毫秒）',
				type: 'number',
			},
			{
				displayName: '保留原始工具',
				name: 'preserveOriginalTools',
				type: 'boolean',
				default: true,
				description:
					'是否在此节点执行后保留助手的原始工具，否则工具将被替换为连接的工具（如果有），默认为true',
				displayOptions: {
					show: {
						'@version': [{ _cnd: { gte: 1.3 } }],
					},
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['message'],
		resource: ['assistant'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('openAiApi');
	const nodeVersion = this.getNode().typeVersion;

	const prompt = this.getNodeParameter('prompt', i) as string;

	let input;
	if (prompt === 'auto') {
		input = this.evaluateExpression('{{ $json["chatInput"] }}', i) as string;
	} else {
		input = this.getNodeParameter('text', i) as string;
	}

	if (input === undefined) {
		throw new NodeOperationError(this.getNode(), 'No prompt specified', {
			description:
				"Expected to find the prompt in an input field called 'chatInput' (this is what the chat trigger node outputs). To use something else, change the 'Prompt' parameter",
		});
	}

	const assistantId = this.getNodeParameter('assistantId', i, '', { extractValue: true }) as string;

	const options = this.getNodeParameter('options', i, {}) as {
		baseURL?: string;
		maxRetries: number;
		timeout: number;
		preserveOriginalTools?: boolean;
	};

	const client = new OpenAIClient({
		apiKey: credentials.apiKey as string,
		maxRetries: options.maxRetries ?? 2,
		timeout: options.timeout ?? 10000,
		baseURL: options.baseURL,
	});

	const agent = new OpenAIAssistantRunnable({ assistantId, client, asAgent: true });

	const tools = await getConnectedTools(this, nodeVersion > 1);
	let assistantTools;

	if (tools.length) {
		const transformedConnectedTools = tools?.map(formatToOpenAIAssistantTool) ?? [];
		const nativeToolsParsed: OpenAIToolType = [];

		assistantTools = (await client.beta.assistants.retrieve(assistantId)).tools;

		const useCodeInterpreter = assistantTools.some((tool) => tool.type === 'code_interpreter');
		if (useCodeInterpreter) {
			nativeToolsParsed.push({
				type: 'code_interpreter',
			});
		}

		const useRetrieval = assistantTools.some((tool) => tool.type === 'retrieval');
		if (useRetrieval) {
			nativeToolsParsed.push({
				type: 'retrieval',
			});
		}

		await client.beta.assistants.update(assistantId, {
			tools: [...nativeToolsParsed, ...transformedConnectedTools],
		});
	}

	const agentExecutor = AgentExecutor.fromAgentAndTools({
		agent,
		tools: tools ?? [],
	});

	const response = await agentExecutor.withConfig(getTracingConfig(this)).invoke({
		content: input,
		signal: this.getExecutionCancelSignal(),
		timeout: options.timeout ?? 10000,
	});

	if (
		options.preserveOriginalTools !== false &&
		nodeVersion >= 1.3 &&
		(assistantTools ?? [])?.length
	) {
		await client.beta.assistants.update(assistantId, {
			tools: assistantTools,
		});
	}

	return [{ json: response, pairedItem: { item: i } }];
}
