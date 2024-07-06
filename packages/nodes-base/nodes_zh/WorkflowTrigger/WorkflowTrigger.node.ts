import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

type eventType = 'Workflow activated' | 'Workflow updated' | undefined;
type activationType = 'activate' | 'update';

export class WorkflowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Workflow Trigger',
		name: 'workflowTrigger',
		icon: 'fa:network-wired',
		group: ['trigger'],
		version: 1,
		description: '基于各种生命周期事件的触发器，比如当工作流程被激活时',
		eventTriggerDescription: '',
		mockManualExecution: true,
		activationMessage: '你的工作流程现在将在你定义的事件上触发执行。',
		defaults: {
			name: 'Workflow Trigger',
			color: '#ff6d5a',
		},
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "Events",
				"name": "events",
				"type": "multiOptions",
				"required": true,
				"default": [],
				"description": "指定触发执行的条件：<ul><li><b>活动工作流已更新</b>：当此工作流已更新时触发</li><li><b>工作流已激活</b>：当此工作流已激活时触发</li></ul>",
				"options": [
					{
						"name": "活动工作流已更新",
						"value": "update",
						"description": "当此工作流已更新时触发"
					},
					{
						"name": "工作流已激活",
						"value": "activate",
						"description": "当此工作流已激活时触发"
					}
				]
			}

		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const events = this.getNodeParameter('events', []) as activationType[];

		const activationMode = this.getActivationMode() as activationType;

		if (events.includes(activationMode)) {
			let event: eventType;
			if (activationMode === 'activate') {
				event = 'Workflow activated';
			}
			if (activationMode === 'update') {
				event = 'Workflow updated';
			}
			this.emit([
				this.helpers.returnJsonArray([
					{ event, timestamp: new Date().toISOString(), workflow_id: this.getWorkflow().id },
				]),
			]);
		}

		const manualTriggerFunction = async () => {
			this.emit([
				this.helpers.returnJsonArray([
					{
						event: 'Manual execution',
						timestamp: new Date().toISOString(),
						workflow_id: this.getWorkflow().id,
					},
				]),
			]);
		};

		return {
			manualTriggerFunction,
		};
	}
}
