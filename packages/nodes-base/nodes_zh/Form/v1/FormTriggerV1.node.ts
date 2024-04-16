/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import {
	FORM_TRIGGER_PATH_IDENTIFIER,
	type INodeType,
	type INodeTypeBaseDescription,
	type INodeTypeDescription,
	type IWebhookFunctions,
} from 'n8n-workflow';

import {
	formDescription,
	formFields,
	formRespondMode,
	formTitle,
	formTriggerPanel,
	webhookPath,
} from '../common.descriptions';
import { formWebhook } from '../utils';

const descriptionV1: INodeTypeDescription = {
	displayName: 'n8n 表单触发器',
	name: 'formTrigger',
	icon: 'file:form.svg',
	group: ['trigger'],
	version: 1,
	description: '当一个由n8n生成的网络表单被提交时，会运行相应的流程',
	defaults: {
		name: 'n8n Form Trigger',
	},
	// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
	inputs: [],
	outputs: ['main'],
	webhooks: [
		{
			name: 'setup',
			httpMethod: 'GET',
			responseMode: 'onReceived',
			isFullPath: true,
			path: `={{$parameter["path"]}}/${FORM_TRIGGER_PATH_IDENTIFIER}`,
			ndvHideUrl: true,
		},
		{
			name: 'default',
			httpMethod: 'POST',
			responseMode: '={{$parameter["responseMode"]}}',
			responseData: '={{$parameter["responseMode"] === "lastNode" ? "noData" : undefined}}',
			isFullPath: true,
			path: `={{$parameter["path"]}}/${FORM_TRIGGER_PATH_IDENTIFIER}`,
			ndvHideMethod: true,
		},
	],
	eventTriggerDescription: '等待您提交表单',
	activationMessage: '现在您可以调用您的生产表单 URL。',
	triggerPanel: formTriggerPanel,
	properties: [
		webhookPath,
		formTitle,
		formDescription,
		formFields,
		formRespondMode,
		{
			"displayName": "选项",
			"name": "options",
			"type": "collection",
			"placeholder": "添加选项",
			"default": {},
			"displayOptions": {
				"hide": {
					"responseMode": ["responseNode"]
				}
			},
			"options": [
				{
					"displayName": "表单提交后的文本",
					"name": "formSubmittedText",
					"description": "用户填写表单后显示给用户的文本",
					"type": "string",
					"default": "您的响应已记录"
				}
			]
		}

	],
};

export class FormTriggerV1 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...descriptionV1,
		};
	}

	async webhook(this: IWebhookFunctions) {
		return await formWebhook(this);
	}
}
