/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import type {
	IDataObject,
	IExecuteWorkflowInfo,
	INodeExecutionData,
	IWorkflowBase,
	IExecuteFunctions,
	INodeType,
	INodeTypeDescription,
	SupplyData,
} from 'n8n-workflow';

import { BaseRetriever, type BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';

import type { SetField, SetNodeOptions } from 'n8n-nodes-base/dist/nodes/Set/v2/helpers/interfaces';
import * as manual from 'n8n-nodes-base/dist/nodes/Set/v2/manual.mode';
import type { CallbackManagerForRetrieverRun } from '@langchain/core/callbacks/manager';
import { logWrapper } from '../../../utils/logWrapper';

function objectToString(obj: Record<string, string> | IDataObject, level = 0) {
	let result = '';
	for (const key in obj) {
		const value = obj[key];
		if (typeof value === 'object' && value !== null) {
			result += `${'  '.repeat(level)}- "${key}":\n${objectToString(
				value as IDataObject,
				level + 1,
			)}`;
		} else {
			result += `${'  '.repeat(level)}- "${key}": "${value}"\n`;
		}
	}
	return result;
}

export class RetrieverWorkflow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Workflow Retriever',
		name: 'retrieverWorkflow',
		icon: 'fa:box-open',
		group: ['transform'],
		version: 1,
		description: '使用 n8n 工作流作为检索器',
		defaults: {
			name: 'Workflow Retriever',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Retrievers'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.retrieverworkflow/',
					},
				],
			},
		},
		inputs: [],
		outputs: [
			{
				displayName: 'Retriever',
				maxConnections: 1,
				type: NodeConnectionType.AiRetriever,
			},
		],
		properties: [
			{
				displayName: '工作流将接收"query"作为输入，并将最后一个节点的输出返回并转换为文档',
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
						name: '参数',
						value: 'parameter',
						description: '从参数加载工作流',
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
				default: '\n\n\n',
				required: true,
				description: '要执行的工作流JSON代码',
			},

			// ----------------------------------
			//         For all
			// ----------------------------------
			{
				displayName: '工作流数值',
				name: 'fields',
				placeholder: '添加数值',
				type: 'fixedCollection',
				description: '设置应在工作流中提供的数值',
				typeOptions: {
					multipleValues: true,
					sortable: true,
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: '数值',
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
										name: '真',
										value: 'true',
									},
									{
										name: '假',
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
		class WorkflowRetriever extends BaseRetriever {
			lc_namespace = ['n8n-nodes-langchain', 'retrievers', 'workflow'];

			executeFunctions: IExecuteFunctions;

			constructor(executeFunctions: IExecuteFunctions, fields: BaseRetrieverInput) {
				super(fields);
				this.executeFunctions = executeFunctions;
			}

			async _getRelevantDocuments(
				query: string,
				config?: CallbackManagerForRetrieverRun,
			): Promise<Document[]> {
				const source = this.executeFunctions.getNodeParameter('source', itemIndex) as string;

				const baseMetadata: IDataObject = {
					source: 'workflow',
					workflowSource: source,
				};

				const workflowInfo: IExecuteWorkflowInfo = {};
				if (source === 'database') {
					// Read workflow from database
					workflowInfo.id = this.executeFunctions.getNodeParameter(
						'workflowId',
						itemIndex,
					) as string;
					baseMetadata.workflowId = workflowInfo.id;
				} else if (source === 'parameter') {
					// Read workflow from parameter
					const workflowJson = this.executeFunctions.getNodeParameter(
						'workflowJson',
						itemIndex,
					) as string;
					try {
						workflowInfo.code = JSON.parse(workflowJson) as IWorkflowBase;
					} catch (error) {
						throw new NodeOperationError(
							this.executeFunctions.getNode(),
							`The provided workflow is not valid JSON: "${(error as Error).message}"`,
							{
								itemIndex,
							},
						);
					}
				}

				const rawData: IDataObject = { query };

				const workflowFieldsJson = this.executeFunctions.getNodeParameter(
					'fields.values',
					itemIndex,
					[],
					{
						rawExpressions: true,
					},
				) as SetField[];

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
					this.executeFunctions,
					{ json: { query } },
					itemIndex,
					options,
					rawData,
					this.executeFunctions.getNode(),
				);

				const items = [newItem] as INodeExecutionData[];

				let receivedItems: INodeExecutionData[][];
				try {
					receivedItems = (await this.executeFunctions.executeWorkflow(
						workflowInfo,
						items,
						config?.getChild(),
					)) as INodeExecutionData[][];
				} catch (error) {
					// Make sure a valid error gets returned that can by json-serialized else it will
					// not show up in the frontend
					throw new NodeOperationError(this.executeFunctions.getNode(), error as Error);
				}

				const returnData: Document[] = [];
				for (const [index, itemData] of receivedItems[0].entries()) {
					const pageContent = objectToString(itemData.json);
					returnData.push(
						new Document({
							pageContent: `### ${index + 1}. Context data:\n${pageContent}`,
							metadata: {
								...baseMetadata,
								itemIndex: index,
							},
						}),
					);
				}

				return returnData;
			}
		}

		const retriever = new WorkflowRetriever(this, {});

		return {
			response: logWrapper(retriever, this),
		};
	}
}
