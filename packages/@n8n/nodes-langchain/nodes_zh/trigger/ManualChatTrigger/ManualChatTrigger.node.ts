import {
	type ITriggerFunctions,
	type INodeType,
	type INodeTypeDescription,
	type ITriggerResponse,
	NodeConnectionType,
} from 'n8n-workflow';

export class ManualChatTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Manual Chat Trigger',
		name: 'manualChatTrigger',
		icon: 'fa:comments',
		group: ['trigger'],
		version: [1, 1.1],
		description: '在新的手动聊天消息上启动流程',
		eventTriggerDescription: '',
		maxNodes: 1,
		hidden: true,
		defaults: {
			name: 'On new manual Chat Message',
			color: '#909298',
		},
		codex: {
			categories: ['Core Nodes'],
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chattrigger/',
					},
				],
			},
			subcategories: {
				'Core Nodes': ['Other Trigger Nodes'],
			},
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: '这个节点是手动聊天工作流程执行的起点。要创建一个，请返回画布并单击“聊天”',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: '聊天并执行工作流',
				name: 'openChat',
				type: 'button',
				typeOptions: {
					action: 'openChat',
				},
				default: '',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const manualTriggerFunction = async () => {
			this.emit([this.helpers.returnJsonArray([{}])]);
		};

		return {
			manualTriggerFunction,
		};
	}
}
