import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type {
	ConnectionTypes,
	INodeInputConfiguration,
	INodeInputFilter,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { getTemplateNoticeField } from '../../../utils/sharedFields';
import { promptTypeOptions, textInput } from '../../../utils/descriptions';
import { conversationalAgentProperties } from './agents/ConversationalAgent/description';
import { conversationalAgentExecute } from './agents/ConversationalAgent/execute';
import { openAiFunctionsAgentProperties } from './agents/OpenAiFunctionsAgent/description';
import { openAiFunctionsAgentExecute } from './agents/OpenAiFunctionsAgent/execute';
import { planAndExecuteAgentProperties } from './agents/PlanAndExecuteAgent/description';
import { planAndExecuteAgentExecute } from './agents/PlanAndExecuteAgent/execute';
import { reActAgentAgentProperties } from './agents/ReActAgent/description';
import { reActAgentAgentExecute } from './agents/ReActAgent/execute';
import { sqlAgentAgentProperties } from './agents/SqlAgent/description';
import { sqlAgentAgentExecute } from './agents/SqlAgent/execute';

// Function used in the inputs expression to figure out which inputs to
// display based on the agent type
function getInputs(
	agent: 'conversationalAgent' | 'openAiFunctionsAgent' | 'reActAgent' | 'sqlAgent',
	hasOutputParser?: boolean,
): Array<ConnectionTypes | INodeInputConfiguration> {
	interface SpecialInput {
		type: ConnectionTypes;
		filter?: INodeInputFilter;
		required?: boolean;
	}

	const getInputData = (
		inputs: SpecialInput[],
	): Array<ConnectionTypes | INodeInputConfiguration> => {
		const displayNames: { [key: string]: string } = {
			[NodeConnectionType.AiLanguageModel]: 'Model',
			[NodeConnectionType.AiMemory]: 'Memory',
			[NodeConnectionType.AiTool]: 'Tool',
			[NodeConnectionType.AiOutputParser]: 'Output Parser',
		};

		return inputs.map(({ type, filter, required }) => {
			const input: INodeInputConfiguration = {
				type,
				displayName: type in displayNames ? displayNames[type] : undefined,
				required: type === NodeConnectionType.AiLanguageModel,
				maxConnections: [NodeConnectionType.AiLanguageModel, NodeConnectionType.AiMemory].includes(
					type as NodeConnectionType,
				)
					? 1
					: undefined,
			};

			if (filter) {
				input.filter = filter;
			}

			return input;
		});
	};

	let specialInputs: SpecialInput[] = [];

	if (agent === 'conversationalAgent') {
		specialInputs = [
			{
				type: NodeConnectionType.AiLanguageModel,
				filter: {
					nodes: [
						'@n8n/n8n-nodes-langchain.lmChatAnthropic',
						'@n8n/n8n-nodes-langchain.lmChatOllama',
						'@n8n/n8n-nodes-langchain.lmChatOpenAi',
						'@n8n/n8n-nodes-langchain.lmChatGooglePalm',
						'@n8n/n8n-nodes-langchain.lmChatMistralCloud',
						'@n8n/n8n-nodes-langchain.lmChatAzureOpenAi',
					],
				},
			},
			{
				type: NodeConnectionType.AiMemory,
			},
			{
				type: NodeConnectionType.AiTool,
			},
			{
				type: NodeConnectionType.AiOutputParser,
			},
		];
	} else if (agent === 'openAiFunctionsAgent') {
		specialInputs = [
			{
				type: NodeConnectionType.AiLanguageModel,
				filter: {
					nodes: [
						'@n8n/n8n-nodes-langchain.lmChatOpenAi',
						'@n8n/n8n-nodes-langchain.lmChatAzureOpenAi',
					],
				},
			},
			{
				type: NodeConnectionType.AiMemory,
			},
			{
				type: NodeConnectionType.AiTool,
				required: true,
			},
			{
				type: NodeConnectionType.AiOutputParser,
			},
		];
	} else if (agent === 'reActAgent') {
		specialInputs = [
			{
				type: NodeConnectionType.AiLanguageModel,
			},
			{
				type: NodeConnectionType.AiTool,
			},
			{
				type: NodeConnectionType.AiOutputParser,
			},
		];
	} else if (agent === 'sqlAgent') {
		specialInputs = [
			{
				type: NodeConnectionType.AiLanguageModel,
			},
			{
				type: NodeConnectionType.AiMemory,
			},
		];
	} else if (agent === 'planAndExecuteAgent') {
		specialInputs = [
			{
				type: NodeConnectionType.AiLanguageModel,
			},
			{
				type: NodeConnectionType.AiTool,
			},
			{
				type: NodeConnectionType.AiOutputParser,
			},
		];
	}

	if (hasOutputParser === false) {
		specialInputs = specialInputs.filter(
			(input) => input.type !== NodeConnectionType.AiOutputParser,
		);
	}
	return [NodeConnectionType.Main, ...getInputData(specialInputs)];
}

export class Agent implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AI Agent',
		name: 'agent',
		icon: 'fa:robot',
		group: ['transform'],
		version: [1, 1.1, 1.2, 1.3, 1.4, 1.5],
		description: '生成行动计划并执行它。可以使用外部工具。',
		subtitle:
			"={{ {	conversationalAgent: 'Conversational Agent', openAiFunctionsAgent: 'OpenAI Functions Agent', reActAgent: 'ReAct Agent', sqlAgent: 'SQL Agent', planAndExecuteAgent: 'Plan and Execute Agent' }[$parameter.agent] }}",
		defaults: {
			name: 'AI Agent',
			color: '#404040',
		},
		codex: {
			alias: ['LangChain'],
			categories: ['AI'],
			subcategories: {
				AI: ['Agents'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/',
					},
				],
			},
		},
		inputs: `={{
			((agent, hasOutputParser) => {
				${getInputs.toString()};
				return getInputs(agent, hasOutputParser)
			})($parameter.agent, $parameter.hasOutputParser === undefined || $parameter.hasOutputParser === true)
		}}`,
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				// eslint-disable-next-line n8n-nodes-base/node-class-description-credentials-name-unsuffixed
				name: 'mySql',
				required: true,
				testedBy: 'mysqlConnectionTest',
				displayOptions: {
					show: {
						agent: ['sqlAgent'],
						'/dataSource': ['mysql'],
					},
				},
			},
			{
				name: 'postgres',
				required: true,
				displayOptions: {
					show: {
						agent: ['sqlAgent'],
						'/dataSource': ['postgres'],
					},
				},
			},
		],
		properties: [
			{
				...getTemplateNoticeField(1954),
				displayOptions: {
					show: {
						agent: ['conversationalAgent'],
					},
				},
			},
			{
				displayName: '代理',
				name: 'agent',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: '对话代理',
						value: 'conversationalAgent',
						description: '选择工具来完成其任务，并使用记忆来回忆先前的对话',
					},
					{
						name: 'OpenAI 功能代理',
						value: 'openAiFunctionsAgent',
						description: '利用 OpenAI 的函数调用功能来选择适当的工具和参数进行执行',
					},
					{
						name: '计划和执行代理',
						value: 'planAndExecuteAgent',
						description: '计划和执行代理首先通过规划要做的事情，然后执行子任务来完成目标',
					},
					{
						name: 'ReAct 代理',
						value: 'reActAgent',
						description: '策略性地选择工具来完成给定的任务',
					},
					{
						name: 'SQL 代理',
						value: 'sqlAgent',
						description: '回答关于 SQL 数据库中数据的问题',
					},
				],
				default: 'conversationalAgent',
			},

			{
				...promptTypeOptions,
				displayOptions: {
					hide: {
						'@version': [{ _cnd: { lte: 1.2 } }],
						agent: ['sqlAgent'],
					},
				},
			},
			{
				...textInput,
				displayOptions: {
					show: {
						promptType: ['define'],
					},
					hide: {
						agent: ['sqlAgent'],
					},
				},
			},
			{
				displayName: '需要特定的输出格式',
				name: 'hasOutputParser',
				type: 'boolean',
				default: false,
				noDataExpression: true,
				displayOptions: {
					hide: {
						'@version': [
							{
								_cnd: {
									lte: 1.2,
								},
							},
						],
						agent: ['sqlAgent'],
					},
				},
			},
			{
				displayName: '在画布上连接一个输出解析器以指定所需的输出格式',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {
					show: {
						hasOutputParser: [true],
					},
				},
			},

			...conversationalAgentProperties,
			...openAiFunctionsAgentProperties,
			...reActAgentAgentProperties,
			...sqlAgentAgentProperties,
			...planAndExecuteAgentProperties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const agentType = this.getNodeParameter('agent', 0, '') as string;
		const nodeVersion = this.getNode().typeVersion;

		if (agentType === 'conversationalAgent') {
			return await conversationalAgentExecute.call(this, nodeVersion);
		} else if (agentType === 'openAiFunctionsAgent') {
			return await openAiFunctionsAgentExecute.call(this, nodeVersion);
		} else if (agentType === 'reActAgent') {
			return await reActAgentAgentExecute.call(this, nodeVersion);
		} else if (agentType === 'sqlAgent') {
			return await sqlAgentAgentExecute.call(this, nodeVersion);
		} else if (agentType === 'planAndExecuteAgent') {
			return await planAndExecuteAgentExecute.call(this, nodeVersion);
		}

		throw new NodeOperationError(this.getNode(), `The agent type "${agentType}" is not supported`);
	}
}
