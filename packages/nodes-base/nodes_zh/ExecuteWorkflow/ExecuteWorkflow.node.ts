import { NodeOperationError } from 'n8n-workflow';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { generatePairedItemData } from '../../utils/utilities';
import { getWorkflowInfo } from './GenericFunctions';

export class ExecuteWorkflow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Execute Workflow',
		name: 'executeWorkflow',
		icon: 'fa:sign-in-alt',
		group: ['transform'],
		version: 1,
		subtitle: '={{"Workflow: " + $parameter["workflowId"]}}',
		description: '执行其他工作流程',
		defaults: {
			name: 'Execute Workflow',
			color: '#ff6d5a',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				"displayName": "操作",
				"name": "operation",
				"type": "hidden",
				"noDataExpression": true,
				"default": "call_workflow",
				"options": [
					{
						"name": "调用另一个工作流",
						"value": "call_workflow"
					}
				]
			},
			{
				"displayName": "来源",
				"name": "source",
				"type": "options",
				"options": [
					{
						"name": "数据库",
						"value": "database",
						"description": "通过 ID 从数据库加载工作流"
					},
					{
						"name": "本地文件",
						"value": "localFile",
						"description": "从本地保存的文件加载工作流"
					},
					{
						"name": "参数",
						"value": "parameter",
						"description": "从参数加载工作流"
					},
					{
						"name": "URL",
						"value": "url",
						"description": "从 URL 加载工作流"
					}
				],
				"default": "database",
				"description": "从哪里获取要执行的工作流"
			},

			// ----------------------------------
			//         source:database
			// ----------------------------------
			{
				"displayName": "工作流 ID",
				"name": "workflowId",
				"type": "string",
				"displayOptions": {
					"show": {
						"source": ["database"]
					}
				},
				"default": "",
				"required": true,
				"hint": "可以在工作流的 URL 中找到",
				"description": "注意在此处使用表达式：如果此节点设置为一次运行所有项目，则它们将全部发送到<em>相同的</em>工作流程。该工作流程的 ID 将通过评估第一个输入项的表达式来计算。"
			},


			// ----------------------------------
			//         source:localFile
			// ----------------------------------
			{
				"displayName": "工作流路径",
				"name": "workflowPath",
				"type": "string",
				"displayOptions": {
					"show": {
						"source": ["localFile"]
					}
				},
				"default": "",
				"placeholder": "/data/workflow.json",
				"required": true,
				"description": "要执行的本地 JSON 工作流文件的路径"
			},


			// ----------------------------------
			//         source:parameter
			// ----------------------------------
			{
				"displayName": "Workflow JSON",
				"name": "workflowJson",
				"type": "json",
				"typeOptions": {
					"rows": 10
				},
				"displayOptions": {
					"show": {
						"source": ["parameter"]
					}
				},
				"default": "\n\n\n",
				"required": true,
				"description": "要执行的工作流 JSON 代码"
			},


			// ----------------------------------
			//         source:url
			// ----------------------------------
			{
				"displayName": "工作流 URL",
				"name": "workflowUrl",
				"type": "string",
				"displayOptions": {
					"show": {
						"source": ["url"]
					}
				},
				"default": "",
				"placeholder": "https://example.com/workflow.json",
				"required": true,
				"description": "要加载工作流的 URL"
			},
			{
				"displayName": "执行此节点时传递的任何数据都将由执行工作流触发器输出。 <a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflow/\" target=\"_blank\">更多信息</a>",
				"name": "executeWorkflowNotice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "模式",
				"name": "mode",
				"type": "options",
				"noDataExpression": true,
				"options": [
					{
						"name": "一次性运行所有项",
						"value": "once",
						"description": "将所有项传递到子工作流的单个执行中"
					},
					{
						"name": "为每个项运行一次",
						"value": "each",
						"description": "为每个项目单独调用子工作流"
					}
				],
				"default": "once"
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"default": {},
				"placeholder": "添加选项",
				"options": [
					{
						"displayName": "等待子工作流完成",
						"name": "waitForSubWorkflow",
						"type": "boolean",
						"default": true,
						"description": "主工作流是否应在继续之前等待子工作流完成其执行"
					}
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const source = this.getNodeParameter('source', 0) as string;
		const mode = this.getNodeParameter('mode', 0, false) as string;
		const items = this.getInputData();

		if (mode === 'each') {
			let returnData: INodeExecutionData[][] = [];

			for (let i = 0; i < items.length; i++) {
				try {
					const waitForSubWorkflow = this.getNodeParameter(
						'options.waitForSubWorkflow',
						i,
						true,
					) as boolean;
					const workflowInfo = await getWorkflowInfo.call(this, source, i);

					if (waitForSubWorkflow) {
						const workflowResult: INodeExecutionData[][] = await this.executeWorkflow(
							workflowInfo,
							[items[i]],
						);

						for (const [outputIndex, outputData] of workflowResult.entries()) {
							for (const item of outputData) {
								item.pairedItem = { item: i };
							}

							if (returnData[outputIndex] === undefined) {
								returnData[outputIndex] = [];
							}

							returnData[outputIndex].push(...outputData);
						}
					} else {
						void this.executeWorkflow(workflowInfo, [items[i]]);
						returnData = [items];
					}
				} catch (error) {
					if (this.continueOnFail()) {
						return [[{ json: { error: error.message }, pairedItem: { item: i } }]];
					}
					throw new NodeOperationError(this.getNode(), error, {
						message: `Error executing workflow with item at index ${i}`,
						description: error.message,
						itemIndex: i,
					});
				}
			}

			return returnData;
		} else {
			try {
				const waitForSubWorkflow = this.getNodeParameter(
					'options.waitForSubWorkflow',
					0,
					true,
				) as boolean;
				const workflowInfo = await getWorkflowInfo.call(this, source);

				if (!waitForSubWorkflow) {
					void this.executeWorkflow(workflowInfo, items);
					return [items];
				}

				const workflowResult: INodeExecutionData[][] = await this.executeWorkflow(
					workflowInfo,
					items,
				);

				const pairedItem = generatePairedItemData(items.length);

				for (const output of workflowResult) {
					for (const item of output) {
						item.pairedItem = pairedItem;
					}
				}

				return workflowResult;
			} catch (error) {
				const pairedItem = generatePairedItemData(items.length);
				if (this.continueOnFail()) {
					return [[{ json: { error: error.message }, pairedItem }]];
				}
				throw error;
			}
		}
	}
}
