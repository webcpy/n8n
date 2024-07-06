import type { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class ExecuteWorkflowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Execute Workflow Trigger',
		name: 'executeWorkflowTrigger',
		icon: 'fa:sign-out-alt',
		group: ['trigger'],
		version: 1,
		description: "用于调用其他n8n工作流的辅助程序。用于设计模块化、微服务风格的工作流程。",
		eventTriggerDescription: '',
		maxNodes: 1,
		defaults: {
			name: 'Execute Workflow Trigger',
			color: '#ff6d5a',
		},

		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "当一个“执行工作流”节点调用此工作流时，执行从这里开始。通过“执行工作流”节点传入的任何数据都将由此节点输出。",
				"name": "notice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "事件",
				"name": "events",
				"type": "hidden",
				"noDataExpression": true,
				"options": [
					{
						"name": "工作流调用",
						"value": "worklfow_call",
						"description": "当另一个工作流使用“执行工作流触发器”调用时",
						"action": "当被另一个工作流调用时"
					}
				],
				"default": "worklfow_call"
			}
		],
	};

	async execute(this: IExecuteFunctions) {
		return [this.getInputData()];
	}
}
