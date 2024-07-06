import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class Interval implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Interval',
		name: 'interval',
		icon: 'fa:hourglass',
		group: ['trigger', 'schedule'],
		version: 1,
		hidden: true,
		description: '在给定时间间隔内触发工作流		',
		eventTriggerDescription: '',
		activationMessage:
			'现在，您的时间间隔触发器将根据您定义的时间表触发执行',
		defaults: {
			name: 'Interval',
			color: '#00FF00',
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "这个工作流将根据您在此处定义的计划运行，一旦您<a data-key=\"activate\">激活</a>它。<br><br>为了测试，您也可以手动触发它：回到画布并点击 '测试工作流'",
				"name": "notice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "间隔",
				"name": "interval",
				"type": "number",
				"typeOptions": {
					"minValue": 1
				},
				"default": 1,
				"description": "间隔值"
			},
			{
				"displayName": "单位",
				"name": "unit",
				"type": "options",
				"options": [
					{
						"name": "秒",
						"value": "seconds"
					},
					{
						"name": "分钟",
						"value": "minutes"
					},
					{
						"name": "小时",
						"value": "hours"
					}
				],
				"default": "seconds",
				"description": "间隔值的单位"
			}
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const interval = this.getNodeParameter('interval') as number;
		const unit = this.getNodeParameter('unit') as string;

		if (interval <= 0) {
			throw new NodeOperationError(
				this.getNode(),
				'时间间隔必须至少设为 1 或更高！',
			);
		}

		let intervalValue = interval;
		if (unit === 'minutes') {
			intervalValue *= 60;
		}
		if (unit === 'hours') {
			intervalValue *= 60 * 60;
		}

		const executeTrigger = () => {
			this.emit([this.helpers.returnJsonArray([{}])]);
		};

		intervalValue *= 1000;

		// Reference: https://nodejs.org/api/timers.html#timers_setinterval_callback_delay_args
		if (intervalValue > 2147483647) {
			throw new NodeOperationError(this.getNode(), 'The interval value is too large.');
		}

		const intervalObj = setInterval(executeTrigger, intervalValue);

		async function closeFunction() {
			clearInterval(intervalObj);
		}

		async function manualTriggerFunction() {
			executeTrigger();
		}

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}
