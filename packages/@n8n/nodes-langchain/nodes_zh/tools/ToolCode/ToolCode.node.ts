/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import type {
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
	ExecutionError,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type { Sandbox } from 'n8n-nodes-base/dist/nodes/Code/Sandbox';
import { getSandboxContext } from 'n8n-nodes-base/dist/nodes/Code/Sandbox';
import { JavaScriptSandbox } from 'n8n-nodes-base/dist/nodes/Code/JavaScriptSandbox';
import { PythonSandbox } from 'n8n-nodes-base/dist/nodes/Code/PythonSandbox';

import { DynamicTool } from '@langchain/core/tools';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class ToolCode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Custom Code Tool',
		name: 'toolCode',
		icon: 'fa:code',
		group: ['transform'],
		version: [1, 1.1],
		description: '写一个JavaScript或Python工具',
		defaults: {
			name: 'Custom Code Tool',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolcode/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiTool],
		outputNames: ['Tool'],
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiAgent]),
			{
				displayName: `在这里<a href="/templates/1963" target="_blank">看一个使用JavaScript编写的自定义工具的对话代理的示例</a>。`,
				name: 'noticeTemplateExample',
				type: 'notice',
				default: '',
				description: '查看一个用 JavaScript 编写的具有自定义工具的对话代理的示例',
			},
			{
				displayName: '名称',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: '我的工具',
				displayOptions: {
					show: {
						'@version': [1],
					},
				},
			},
			{
				displayName: '名称',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: '例如，我的工具',
				validateType: 'string-alphanumeric',
				description: '要调用的函数名称，只能包含字母、数字和下划线',
				displayOptions: {
					show: {
						'@version': [
							{
								_cnd: {
									gte: 1.1,
								},
							},
						],
					},
				},
			},
			{
				displayName: '描述',
				name: 'description',
				type: 'string',
				default: '',
				placeholder:
					'调用此工具以获取随机颜色。输入应为一个字符串，其中包含要排除的颜色名称，以逗号分隔。',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName: '语言',
				name: 'language',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'JavaScript',
						value: 'javaScript',
					},
					{
						name: 'Python（Beta版）',
						value: 'python',
					},
				],
				default: 'javaScript',
			},
			{
				displayName: 'JavaScript',
				name: 'jsCode',
				type: 'string',
				displayOptions: {
					show: {
						language: ['javaScript'],
					},
				},
				typeOptions: {
					editor: 'jsEditor',
				},
				default: '// 例如：将传入的查询转换为大写并返回\nreturn query.toUpperCase()',
				hint: '您可以通过输入属性“query”访问工具接收到的输入。返回的值应为单个字符串。',
				description: '例如：将任何文本转换为大写',
				noDataExpression: true,
			},
			{
				displayName: 'Python',
				name: 'pythonCode',
				type: 'string',
				displayOptions: {
					show: {
						language: ['python'],
					},
				},
				typeOptions: {
					editor: 'codeNodeEditor',
					editorLanguage: 'python',
				},
				default: '# 例如：将传入的查询转换为大写并返回\nreturn query.upper()',
				hint: '您可以通过输入属性“query”访问工具接收到的输入。返回的值应为单个字符串。',
				description: '例如：将任何文本转换为大写',
				noDataExpression: true,
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const node = this.getNode();
		const workflowMode = this.getMode();

		const name = this.getNodeParameter('name', itemIndex) as string;
		const description = this.getNodeParameter('description', itemIndex) as string;

		const language = this.getNodeParameter('language', itemIndex) as string;
		let code = '';
		if (language === 'javaScript') {
			code = this.getNodeParameter('jsCode', itemIndex) as string;
		} else {
			code = this.getNodeParameter('pythonCode', itemIndex) as string;
		}

		const getSandbox = (query: string, index = 0) => {
			const context = getSandboxContext.call(this, index);
			context.query = query;

			let sandbox: Sandbox;
			if (language === 'javaScript') {
				sandbox = new JavaScriptSandbox(context, code, index, this.helpers);
			} else {
				sandbox = new PythonSandbox(context, code, index, this.helpers);
			}

			sandbox.on(
				'output',
				workflowMode === 'manual'
					? this.sendMessageToUI.bind(this)
					: (...args: unknown[]) =>
							console.log(`[Workflow "${this.getWorkflow().id}"][Node "${node.name}"]`, ...args),
			);
			return sandbox;
		};

		const runFunction = async (query: string): Promise<string> => {
			const sandbox = getSandbox(query, itemIndex);
			return await (sandbox.runCode() as Promise<string>);
		};

		return {
			response: new DynamicTool({
				name,
				description,

				func: async (query: string): Promise<string> => {
					const { index } = this.addInputData(NodeConnectionType.AiTool, [[{ json: { query } }]]);

					let response: string = '';
					let executionError: ExecutionError | undefined;
					try {
						response = await runFunction(query);
					} catch (error: unknown) {
						executionError = error as ExecutionError;
						response = `There was an error: "${executionError.message}"`;
					}

					if (typeof response === 'number') {
						response = (response as number).toString();
					}

					if (typeof response !== 'string') {
						// TODO: Do some more testing. Issues here should actually fail the workflow
						executionError = new NodeOperationError(this.getNode(), 'Wrong output type returned', {
							description: `The response property should be a string, but it is an ${typeof response}`,
						});
						response = `There was an error: "${executionError.message}"`;
					}

					if (executionError) {
						void this.addOutputData(NodeConnectionType.AiTool, index, executionError);
					} else {
						void this.addOutputData(NodeConnectionType.AiTool, index, [[{ json: { response } }]]);
					}
					return response;
				},
			}),
		};
	}
}
