import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

type eventType = 'Instance started' | undefined;

export class N8nTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'n8n Trigger',
		name: 'n8nTrigger',
		icon: 'file:n8nTrigger.svg',
		group: ['trigger'],
		version: 1,
		description: '在 n8n 实例上处理事件和执行操作',
		eventTriggerDescription: '',
		mockManualExecution: true,
		defaults: {
			name: 'n8n Trigger',
		},
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "事件",
				"name": "events",
				"type": "multiOptions",
				"required": true,
				"default": [],
				"description": "指定执行应发生的条件：<b>实例启动</b>：当此 n8n 实例启动或重新启动时触发",
				"options": [
					{
						"name": "实例启动",
						"value": "init",
						"description": "当此 n8n 实例启动或重新启动时触发"
					}
				]
			}
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const events = this.getNodeParameter('events', []) as string[];

		const activationMode = this.getActivationMode();

		if (events.includes(activationMode)) {
			let event: eventType;
			if (activationMode === 'init') {
				event = 'Instance started';
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
