import type {
	IExecuteFunctions,
	IExecuteWorkflowInfo,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IWorkflowBase,
	SupplyData,
	ExecutionError,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type { SetField, SetNodeOptions } from 'n8n-nodes-base/dist/nodes/Set/v2/helpers/interfaces';
import * as manual from 'n8n-nodes-base/dist/nodes/Set/v2/manual.mode';

import { DynamicTool } from '@langchain/core/tools';
import get from 'lodash/get';
import isObject from 'lodash/isObject';
import type { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { getConnectionHintNoticeField } from '../../../utils/sharedFields';

export class ToolWorkflow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Custom n8n Workflow Tool',
		name: 'toolWorkflow',
		icon: 'fa:network-wired',
		group: ['transform'],
		version: [1, 1.1],
		description: '使用另一个 n8n 工作流作为工具。允许将任何 n8n 节点打包为工具。',
		defaults: {
			name: 'Custom n8n Workflow Tool',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.toolworkflow/',
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
				displayName:
					'查看一个示例工作流，使用AI建议会议时间段<a href="/templates/1953" target="_blank">这里</a>。',
				name: 'noticeTemplateExample',
				type: 'notice',
				default: '',
			},
			{
				displayName: '名称',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: '我的颜色工具',
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
				placeholder: '例如：我的颜色工具',
				validateType: 'string-alphanumeric',
				description: '要调用的函数名称，只能包含字母、数字和下划线',
				displayOptions: {
					show: {
						'@version': [{ _cnd: { gte: 1.1 } }],
					},
				},
			},
			{
				displayName: '描述',
				name: 'description',
				type: 'string',
				default: '',
				placeholder:
					'调用此工具以获取随机颜色。输入应为一个字符串，其中包含要排除的颜色名称，逗号分隔。',
				typeOptions: {
					rows: 3,
				},
			},
			{
				displayName:
					'此工具将调用您在下面定义的工作流，并在最后一个节点中查找响应。工作流需要以执行工作流触发器开始。',
				name: 'executeNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '来源',
				name: 'source',
				type: 'options',
				options: [
					{
						name: '数据库',
						value: 'database',
						description: '通过ID从数据库加载工作流',
					},
					{
						name: '在下面定义',
						value: 'parameter',
						description: '传递工作流的JSON代码',
					},
				],
				default: 'database',
				description: '从哪里获取要执行的工作流',
			},

			{
				displayName:
					'此工具将调用您在下面定义的工作流，并查找最后一个节点的响应。工作流需要以执行工作流触发器开始。',
				name: 'executeNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '来源',
				name: 'source',
				type: 'options',
				options: [
					{
						name: '数据库',
						value: 'database',
						description: '通过ID从数据库加载工作流',
					},
					{
						name: '在下面定义',
						value: 'parameter',
						description: '传递工作流的JSON代码',
					},
				],
				default: 'database',
				description: '从哪里获取要执行的工作流',
			},

			// ----------------------------------
			//         source:database
			// ----------------------------------
			{
				displayName: '工作流ID',
				name: 'workflowId',
				type: 'string',
				displayOptions: {
					show: {
						source: ['database'],
					},
				},
				default: '',
				required: true,
				description: '要执行的工作流',
				hint: '可以在工作流的URL中找到',
			},

			// ----------------------------------
			//         source:parameter
			// ----------------------------------
			{
				displayName: '工作流JSON',
				name: 'workflowJson',
				type: 'json',
				typeOptions: {
					rows: 10,
				},
				displayOptions: {
					show: {
						source: ['parameter'],
					},
				},
				default: '\n\n\n\n\n\n\n\n\n',
				required: true,
				description: '要执行的工作流JSON代码',
			},

			// ----------------------------------
			//         For all
			// ----------------------------------
			{
				displayName: '返回字段',
				name: 'responsePropertyName',
				type: 'string',
				default: 'response',
				required: true,
				hint: '工作流的最后一个执行节点中包含响应的字段',
				description:
					'指定此工具应返回的数据所在位置。n8n将在工作流的最后一个执行节点的输出中查找具有此名称的字段，并返回其值。',
			},
			{
				displayName: '额外的工作流输入',
				name: 'fields',
				placeholder: '添加值',
				type: 'fixedCollection',
				description: "这些将由被调用的工作流的'执行工作流'触发器输出",
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: '值',
						values: [
							{
								displayName: '名称',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: '例如：fieldName',
								description: '要设置值的字段名称。支持点表示法。例如：data.person[0].name。',
								requiresDataPath: 'single',
							},
							{
								displayName: '类型',
								name: 'type',
								type: 'options',
								description: '字段值类型',
								options: [
									{
										name: '字符串',
										value: 'stringValue',
									},
									{
										name: '数字',
										value: 'numberValue',
									},
									{
										name: '布尔值',
										value: 'booleanValue',
									},
									{
										name: '数组',
										value: 'arrayValue',
									},
									{
										name: '对象',
										value: 'objectValue',
									},
								],
								default: 'stringValue',
							},
							{
								displayName: '值',
								name: 'stringValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										type: ['stringValue'],
									},
								},
								validateType: 'string',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: '值',
								name: 'numberValue',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										type: ['numberValue'],
									},
								},
								validateType: 'number',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: '值',
								name: 'booleanValue',
								type: 'options',
								default: 'true',
								options: [
									{
										name: 'True',
										value: 'true',
									},
									{
										name: 'False',
										value: 'false',
									},
								],
								displayOptions: {
									show: {
										type: ['booleanValue'],
									},
								},
								validateType: 'boolean',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: '值',
								name: 'arrayValue',
								type: 'string',
								default: '',
								placeholder: '例如：[ arrayItem1, arrayItem2, arrayItem3 ]',
								displayOptions: {
									show: {
										type: ['arrayValue'],
									},
								},
								validateType: 'array',
								ignoreValidationDuringExecution: true,
							},
							{
								displayName: '值',
								name: 'objectValue',
								type: 'json',
								default: '={}',
								typeOptions: {
									rows: 2,
								},
								displayOptions: {
									show: {
										type: ['objectValue'],
									},
								},
								validateType: 'object',
								ignoreValidationDuringExecution: true,
							},
						],
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions, itemIndex: number): Promise<SupplyData> {
		const name = this.getNodeParameter('name', itemIndex) as string;
		const description = this.getNodeParameter('description', itemIndex) as string;

		const runFunction = async (
			query: string,
			runManager?: CallbackManagerForToolRun,
		): Promise<string> => {
			const source = this.getNodeParameter('source', itemIndex) as string;
			const responsePropertyName = this.getNodeParameter(
				'responsePropertyName',
				itemIndex,
			) as string;

			if (!responsePropertyName) {
				throw new NodeOperationError(this.getNode(), "Field to return can't be empty", {
					itemIndex,
					description:
						'Enter the name of a field in the last node of the workflow that contains the response to return',
				});
			}

			const workflowInfo: IExecuteWorkflowInfo = {};
			if (source === 'database') {
				// Read workflow from database
				workflowInfo.id = this.getNodeParameter('workflowId', itemIndex) as string;
			} else if (source === 'parameter') {
				// Read workflow from parameter
				const workflowJson = this.getNodeParameter('workflowJson', itemIndex) as string;
				try {
					workflowInfo.code = JSON.parse(workflowJson) as IWorkflowBase;
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`The provided workflow is not valid JSON: "${(error as Error).message}"`,
						{
							itemIndex,
						},
					);
				}
			}

			const rawData: IDataObject = { query };

			const workflowFieldsJson = this.getNodeParameter('fields.values', itemIndex, [], {
				rawExpressions: true,
			}) as SetField[];

			// Copied from Set Node v2
			for (const entry of workflowFieldsJson) {
				if (entry.type === 'objectValue' && (entry.objectValue as string).startsWith('=')) {
					rawData[entry.name] = (entry.objectValue as string).replace(/^=+/, '');
				}
			}

			const options: SetNodeOptions = {
				include: 'all',
			};

			const newItem = await manual.execute.call(
				this,
				{ json: { query } },
				itemIndex,
				options,
				rawData,
				this.getNode(),
			);

			const items = [newItem] as INodeExecutionData[];

			let receivedData: INodeExecutionData;
			try {
				receivedData = (await this.executeWorkflow(
					workflowInfo,
					items,
					runManager?.getChild(),
				)) as INodeExecutionData;
			} catch (error) {
				// Make sure a valid error gets returned that can by json-serialized else it will
				// not show up in the frontend
				throw new NodeOperationError(this.getNode(), error as Error);
			}

			const response: string | undefined = get(receivedData, [
				0,
				0,
				'json',
				responsePropertyName,
			]) as string | undefined;
			if (response === undefined) {
				throw new NodeOperationError(
					this.getNode(),
					`There was an error: "The workflow did not return an item with the property '${responsePropertyName}'"`,
				);
			}

			return response;
		};

		return {
			response: new DynamicTool({
				name,
				description,

				func: async (query: string, runManager?: CallbackManagerForToolRun): Promise<string> => {
					const { index } = this.addInputData(NodeConnectionType.AiTool, [[{ json: { query } }]]);

					let response: string = '';
					let executionError: ExecutionError | undefined;
					try {
						response = await runFunction(query, runManager);
					} catch (error) {
						// TODO: Do some more testing. Issues here should actually fail the workflow
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						executionError = error;
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						response = `There was an error: "${error.message}"`;
					}

					if (typeof response === 'number') {
						response = (response as number).toString();
					}

					if (isObject(response)) {
						response = JSON.stringify(response, null, 2);
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
