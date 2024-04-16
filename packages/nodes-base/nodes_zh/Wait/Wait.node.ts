import { DateTime } from 'luxon';
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeTypeDescription,
	INodeProperties,
	IDisplayOptions,
	IWebhookFunctions,
} from 'n8n-workflow';
import { WAIT_TIME_UNLIMITED } from 'n8n-workflow';

import {
	authenticationProperty,
	credentialsProperty,
	defaultWebhookDescription,
	httpMethodsProperty,
	optionsProperty,
	responseBinaryPropertyNameProperty,
	responseCodeProperty,
	responseDataProperty,
	responseModeProperty,
} from '../Webhook/description';

import {
	formDescription,
	formFields,
	respondWithOptions,
	formRespondMode,
	formTitle,
} from '../Form/common.descriptions';
import { formWebhook } from '../Form/utils';
import { updateDisplayOptions } from '../../utils/utilities';
import { Webhook } from '../Webhook/Webhook.node';

const toWaitAmount: INodeProperties = {
	"displayName": "等待时长",
	"name": "amount",
	"type": "number",
	"typeOptions": {
		"minValue": 0,
		"numberPrecision": 2
	},
	"default": 1,
	"description": "等待的时间长度"
}

const unitSelector: INodeProperties = {
	"displayName": "等待单位",
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
		},
		{
			"name": "天",
			"value": "days"
		}
	],
	"default": "hours",
	"description": "等待时长的时间单位"
}


const waitTimeProperties: INodeProperties[] = [
	{
		"displayName": "限制等待时间",
		"name": "limitWaitTime",
		"type": "boolean",
		"default": false,
		"description": "工作流是否会在指定的限制类型后自动恢复执行",
		"displayOptions": {
			"show": {
				"resume": ["webhook", "form"]
			}
		}
	},
	{
		"displayName": "限制类型",
		"name": "limitType",
		"type": "options",
		"default": "afterTimeInterval",
		"description": "设置执行继续的条件。可以是指定的日期或一段时间后。",
		"displayOptions": {
			"show": {
				"limitWaitTime": [true],
				"resume": ["webhook", "form"]
			}
		},
		"options": [
			{
				"name": "时间间隔后",
				"description": "等待一定时间量",
				"value": "afterTimeInterval"
			},
			{
				"name": "指定时间",
				"description": "等待到设置的日期和时间后继续",
				"value": "atSpecifiedTime"
			}
		]
	},
	{
		"displayName": "时间量",
		"name": "resumeAmount",
		"type": "number",
		"displayOptions": {
			"show": {
				"limitType": ["afterTimeInterval"],
				"limitWaitTime": [true],
				"resume": ["webhook", "form"]
			}
		},
		"typeOptions": {
			"minValue": 0,
			"numberPrecision": 2
		},
		"default": 1,
		"description": "等待的时间长度"
	},
	{
		"displayName": "单位",
		"name": "resumeUnit",
		"type": "options",
		"displayOptions": {
			"show": {
				"limitType": ["afterTimeInterval"],
				"limitWaitTime": [true],
				"resume": ["webhook", "form"]
			}
		},
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
			},
			{
				"name": "天",
				"value": "days"
			}
		],
		"default": "hours",
		"description": "等待时间的单位"
	},
	{
		"displayName": "最大日期和时间",
		"name": "maxDateAndTime",
		"type": "dateTime",
		"displayOptions": {
			"show": {
				"limitType": ["atSpecifiedTime"],
				"limitWaitTime": [true],
				"resume": ["webhook", "form"]
			}
		},
		"default": "",
		"description": "在指定日期和时间后继续执行"
	}
]

const webhookSuffix: INodeProperties = {
	"displayName": "Webhook 后缀",
	"name": "webhookSuffix",
	"type": "string",
	"default": "",
	"placeholder": "webhook",
	"noDataExpression": true,
	"description": "此后缀路径将附加到重启 URL 上。在使用多个等待节点时很有用。"
}

const displayOnWebhook: IDisplayOptions = {
	show: {
		resume: ['webhook'],
	},
};

const displayOnFormSubmission = {
	show: {
		resume: ['form'],
	},
};

const onFormSubmitProperties = updateDisplayOptions(displayOnFormSubmission, [
	formTitle,
	formDescription,
	formFields,
	formRespondMode,
]);

const onWebhookCallProperties = updateDisplayOptions(displayOnWebhook, [
	{
		...httpMethodsProperty,
		description: 'Webhook 调用的 HTTP 方法',
	},
	responseCodeProperty,
	responseModeProperty,
	responseDataProperty,
	responseBinaryPropertyNameProperty,
]);

const webhookPath = '={{$parameter["options"]["webhookSuffix"] || ""}}';

export class Wait extends Webhook {
	authPropertyName = 'incomingAuthentication';

	description: INodeTypeDescription = {
		displayName: 'Wait',
		name: 'wait',
		icon: 'fa:pause-circle',
		group: ['organization'],
		version: [1, 1.1],
		description: '等待后继续执行',
		defaults: {
			name: 'Wait',
			color: '#804050',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: credentialsProperty(this.authPropertyName),
		webhooks: [
			{
				...defaultWebhookDescription,
				responseData: '={{$parameter["responseData"]}}',
				path: webhookPath,
				restartWebhook: true,
			},
			{
				name: 'default',
				httpMethod: 'GET',
				responseMode: 'onReceived',
				path: webhookPath,
				restartWebhook: true,
				isFullPath: true,
				isForm: true,
			},
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: '={{$parameter["responseMode"]}}',
				responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
				path: webhookPath,
				restartWebhook: true,
				isFullPath: true,
				isForm: true,
			},
		],
		properties: [
			{
				"displayName": "继续执行",
				"name": "resume",
				"type": "options",
				"options": [
					{
						"name": "时间间隔后",
						"value": "timeInterval",
						"description": "等待一定时间量后继续执行"
					},
					{
						"name": "指定时间后",
						"value": "specificTime",
						"description": "等待到指定的日期和时间后继续执行"
					},
					{
						"name": "Webhook 调用时",
						"value": "webhook",
						"description": "在继续之前等待 Webhook 调用"
					},
					{
						"name": "表单提交时",
						"value": "form",
						"description": "在继续之前等待表单提交"
					}
				],
				"default": "timeInterval",
				"description": "确定在工作流继续执行之前要使用的等待模式"
			},

			{
				...authenticationProperty(this.authPropertyName),
				description: `对于额外的安全性，应如何对来自 $execution.resumeUrl 的传入继续 Webhook 请求进行身份验证`,
				displayOptions: displayOnWebhook,
			},

			// ----------------------------------
			//         resume:specificTime
			// ----------------------------------
			{
				"displayName": "日期和时间",
				"name": "dateTime",
				"type": "dateTime",
				"displayOptions": {
					"show": {
						"resume": ["specificTime"]
					}
				},
				"default": "",
				"description": "在继续执行之前等待的日期和时间"
			},


			// ----------------------------------
			//         resume:timeInterval
			// ----------------------------------
			{
				...toWaitAmount,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
						'@version': [1],
					},
				},
			},
			{
				...toWaitAmount,
				default: 5,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
					},
					hide: {
						'@version': [1],
					},
				},
			},
			{
				...unitSelector,
				displayOptions: {
					show: {
						resume: ['timeInterval'],
						'@version': [1],
					},
				},
			},
			{
				...unitSelector,
				default: 'seconds',
				displayOptions: {
					show: {
						resume: ['timeInterval'],
					},
					hide: {
						'@version': [1],
					},
				},
			},

			// ----------------------------------
			//         resume:webhook & form
			// ----------------------------------
			{
				displayName: `Webhook URL 将在运行时生成。您可以使用<strong>$execution.resumeUrl</strong>变量引用它。在到达此节点之前将其发送到某个地方。<a href='https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait' target='_blank'>更多信息</a>`,
				name: 'webhookNotice',
				type: 'notice',
				displayOptions: displayOnWebhook,
				default: '',
			},
			{
				displayName: `表单URL将在运行时生成。您可以使用<strong>$execution.resumeFormUrl</strong>变量引用它。在到达此节点之前将其发送到某个地方。<a href='https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/?utm_source=n8n_app&utm_medium=node_settings_modal-credential_link&utm_campaign=n8n-nodes-base.wait' target='_blank'>更多信息</a>`,
				name: 'formNotice',
				type: 'notice',
				displayOptions: displayOnFormSubmission,
				default: '',
			},
			...onFormSubmitProperties,
			...onWebhookCallProperties,
			...waitTimeProperties,
			{
				...optionsProperty,
				displayOptions: displayOnWebhook,
				options: [...(optionsProperty.options as INodeProperties[]), webhookSuffix],
			},
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '新增选项',
				default: {},
				displayOptions: {
					show: {
						resume: ['form'],
					},
					hide: {
						responseMode: ['responseNode'],
					},
				},
				options: [respondWithOptions, webhookSuffix],
			},
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '新增选项',
				default: {},
				displayOptions: {
					show: {
						resume: ['form'],
					},
					hide: {
						responseMode: ['onReceived', 'lastNode'],
					},
				},
				options: [webhookSuffix],
			},
		],
	};

	async webhook(context: IWebhookFunctions) {
		const resume = context.getNodeParameter('resume', 0) as string;
		if (resume === 'form') return await formWebhook(context);
		return await super.webhook(context);
	}

	async execute(context: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resume = context.getNodeParameter('resume', 0) as string;

		if (['webhook', 'form'].includes(resume)) {
			return await this.configureAndPutToWait(context);
		}

		let waitTill: Date;
		if (resume === 'timeInterval') {
			const unit = context.getNodeParameter('unit', 0) as string;

			let waitAmount = context.getNodeParameter('amount', 0) as number;
			if (unit === 'minutes') {
				waitAmount *= 60;
			}
			if (unit === 'hours') {
				waitAmount *= 60 * 60;
			}
			if (unit === 'days') {
				waitAmount *= 60 * 60 * 24;
			}

			waitAmount *= 1000;

			// Timezone does not change relative dates, since they are just
			// a number of seconds added to the current timestamp
			waitTill = new Date(new Date().getTime() + waitAmount);
		} else {
			const dateTimeStr = context.getNodeParameter('dateTime', 0) as string;

			waitTill = DateTime.fromFormat(dateTimeStr, "yyyy-MM-dd'T'HH:mm:ss", {
				zone: context.getTimezone(),
			})
				.toUTC()
				.toJSDate();
		}

		const waitValue = Math.max(waitTill.getTime() - new Date().getTime(), 0);

		if (waitValue < 65000) {
			// If wait time is shorter than 65 seconds leave execution active because
			// we just check the database every 60 seconds.
			return await new Promise((resolve) => {
				const timer = setTimeout(() => resolve([context.getInputData()]), waitValue);
				context.onExecutionCancellation(() => clearTimeout(timer));
			});
		}

		// If longer than 65 seconds put execution to wait
		return await this.putToWait(context, waitTill);
	}

	private async configureAndPutToWait(context: IExecuteFunctions) {
		let waitTill = new Date(WAIT_TIME_UNLIMITED);
		const limitWaitTime = context.getNodeParameter('limitWaitTime', 0);

		if (limitWaitTime === true) {
			const limitType = context.getNodeParameter('limitType', 0);

			if (limitType === 'afterTimeInterval') {
				let waitAmount = context.getNodeParameter('resumeAmount', 0) as number;
				const resumeUnit = context.getNodeParameter('resumeUnit', 0);

				if (resumeUnit === 'minutes') {
					waitAmount *= 60;
				}
				if (resumeUnit === 'hours') {
					waitAmount *= 60 * 60;
				}
				if (resumeUnit === 'days') {
					waitAmount *= 60 * 60 * 24;
				}

				waitAmount *= 1000;
				waitTill = new Date(new Date().getTime() + waitAmount);
			} else {
				waitTill = new Date(context.getNodeParameter('maxDateAndTime', 0) as string);
			}
		}

		return await this.putToWait(context, waitTill);
	}

	private async putToWait(context: IExecuteFunctions, waitTill: Date) {
		await context.putExecutionToWait(waitTill);
		return [context.getInputData()];
	}
}
