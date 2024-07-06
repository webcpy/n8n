import type {
	IPollFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { DateTime } from 'luxon';
import {
	googleApiRequest,
	googleApiRequestAllItems,
	parseRawEmail,
	prepareQuery,
	simplifyOutput,
} from './GenericFunctions';

export class GmailTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gmail Trigger',
		name: 'gmailTrigger',
		icon: 'file:gmail.svg',
		group: ['trigger'],
		version: 1,
		description:
			'从 Gmail 获取电子邮件，并在指定的轮询时间间隔内启动工作流程.',
		subtitle: '={{"Gmail Trigger"}}',
		defaults: {
			name: 'Gmail Trigger',
		},
		credentials: [
			{
				name: 'googleApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['serviceAccount'],
					},
				},
			},
			{
				name: 'gmailOAuth2',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		polling: true,
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "认证",
				"name": "authentication",
				"type": "options",
				"options": [
					{
						"name": "OAuth2 (推荐)",
						"value": "oAuth2"
					},
					{
						"name": "服务账户",
						"value": "serviceAccount"
					}
				],
				"default": "oAuth2"
			},
			{
				"displayName": "Event",
				"name": "event",
				"type": "options",
				"default": "messageReceived",
				"options": [
					{
						"name": "消息接收",
						"value": "messageReceived"
					}
				]
			},
			{
				"displayName": "简化",
				"name": "simple",
				"type": "boolean",
				"default": true,
				"description": "是否返回响应的简化版本而不是原始数据"
			},
			{
				"displayName": "过滤器",
				"name": "filters",
				"type": "collection",
				"placeholder": "添加过滤器",
				"default": {},
				"options": [
					{
						"displayName": "包括垃圾邮件和废纸篓",
						"name": "includeSpamTrash",
						"type": "boolean",
						"default": false,
						"description": "是否在结果中包括来自垃圾邮件和废纸篓的邮件"
					},
					{
						"displayName": "标签名称或ID",
						"name": "labelIds",
						"type": "multiOptions",
						"typeOptions": {
							"loadOptionsMethod": "getLabels"
						},
						"default": [],
						"description": "仅返回具有与所有指定标签ID匹配的标签的邮件。从列表中选择，或使用<a href=\"https://docs.n8n.io/code-examples/expressions/\">表达式</a>指定ID。",
						"hint": "与Gmail搜索框中的格式相同。 <a href=\"https://support.google.com/mail/answer/7190?hl=zh\">更多信息</a>。",
						"placeholder": "has:attachment"
					},
					{
						"displayName": "搜索",
						"name": "q",
						"type": "string",
						"default": "",
						"placeholder": "has:attachment",
						"hint": "与Gmail搜索框中的格式相同。 <a href=\"https://support.google.com/mail/answer/7190?hl=zh\">更多信息</a>。",
						"description": "仅返回与指定查询匹配的邮件"
					},
					{
						"displayName": "阅读状态",
						"name": "readStatus",
						"type": "options",
						"default": "unread",
						"hint": "通过是否已读来过滤邮件",
						"options": [
							{
								"name": "未读和已读邮件",
								"value": "both"
							},
							{
								"name": "仅未读邮件",
								"value": "unread"
							},
							{
								"name": "仅已读邮件",
								"value": "read"
							}
						]
					},
					{
						"displayName": "发件人",
						"name": "sender",
						"type": "string",
						"default": "",
						"description": "要过滤的发件人名称或邮箱",
						"hint": "输入发件人的邮箱或部分发件人名称"
					}
				]
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"displayOptions": {
					"hide": {
						"simple": [
							true
						]
					}
				},
				"options": [
					{
						"displayName": "附件前缀",
						"name": "dataPropertyAttachmentsPrefixName",
						"type": "string",
						"default": "attachment_",
						"description": "要写入附件的二进制属性名称的前缀。将添加从0开始的索引。因此，如果名称为'attachment_'，则第一个附件保存为'attachment_0'。"
					},
					{
						"displayName": "下载附件",
						"name": "downloadAttachments",
						"type": "boolean",
						"default": false,
						"description": "是否下载邮件的附件"
					}
				]
			}
		],
	};

	methods = {
		loadOptions: {
			// Get all the labels to display them to user so that they can
			// select them easily
			async getLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];

				const labels = await googleApiRequestAllItems.call(
					this,
					'labels',
					'GET',
					'/gmail/v1/users/me/labels',
				);

				for (const label of labels) {
					returnData.push({
						name: label.name,
						value: label.id,
					});
				}

				return returnData.sort((a, b) => {
					if (a.name < b.name) {
						return -1;
					}
					if (a.name > b.name) {
						return 1;
					}
					return 0;
				});
			},
		},
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const webhookData = this.getWorkflowStaticData('node');
		let responseData;

		const now = Math.floor(DateTime.now().toSeconds()).toString();
		const startDate = (webhookData.lastTimeChecked as string) || +now;
		const endDate = +now;

		const options = this.getNodeParameter('options', {}) as IDataObject;
		const filters = this.getNodeParameter('filters', {}) as IDataObject;

		try {
			const qs: IDataObject = {};
			filters.receivedAfter = startDate;

			if (this.getMode() === 'manual') {
				qs.maxResults = 1;
				delete filters.receivedAfter;
			}

			Object.assign(qs, prepareQuery.call(this, filters, 0), options);

			responseData = await googleApiRequest.call(
				this,
				'GET',
				'/gmail/v1/users/me/messages',
				{},
				qs,
			);
			responseData = responseData.messages;

			if (!responseData?.length) {
				webhookData.lastTimeChecked = endDate;
				return null;
			}

			const simple = this.getNodeParameter('simple') as boolean;

			if (simple) {
				qs.format = 'metadata';
				qs.metadataHeaders = ['From', 'To', 'Cc', 'Bcc', 'Subject'];
			} else {
				qs.format = 'raw';
			}

			for (let i = 0; i < responseData.length; i++) {
				responseData[i] = await googleApiRequest.call(
					this,
					'GET',
					`/gmail/v1/users/me/messages/${responseData[i].id}`,
					{},
					qs,
				);

				if (!simple) {
					const dataPropertyNameDownload =
						(options.dataPropertyAttachmentsPrefixName as string) || 'attachment_';

					responseData[i] = await parseRawEmail.call(
						this,
						responseData[i],
						dataPropertyNameDownload,
					);
				}
			}

			if (simple) {
				responseData = this.helpers.returnJsonArray(
					await simplifyOutput.call(this, responseData as IDataObject[]),
				);
			}
		} catch (error) {
			if (this.getMode() === 'manual' || !webhookData.lastTimeChecked) {
				throw error;
			}
			const workflow = this.getWorkflow();
			const node = this.getNode();
			this.logger.error(
				`There was a problem in '${node.name}' node in workflow '${workflow.id}': '${error.description}'`,
				{
					node: node.name,
					workflowId: workflow.id,
					error,
				},
			);
		}

		if (!responseData?.length) {
			webhookData.lastTimeChecked = endDate;
			return null;
		}

		const getEmailDateAsSeconds = (email: IDataObject) => {
			const { internalDate, date } = email;
			return internalDate
				? +(internalDate as string) / 1000
				: +DateTime.fromJSDate(new Date(date as string)).toSeconds();
		};

		const lastEmailDate = (responseData as IDataObject[]).reduce((lastDate, { json }) => {
			const emailDate = getEmailDateAsSeconds(json as IDataObject);
			return emailDate > lastDate ? emailDate : lastDate;
		}, 0);

		const nextPollPossibleDuplicates = (responseData as IDataObject[]).reduce(
			(duplicates, { json }) => {
				const emailDate = getEmailDateAsSeconds(json as IDataObject);
				return emailDate === lastEmailDate
					? duplicates.concat((json as IDataObject).id as string)
					: duplicates;
			},
			[] as string[],
		);

		const possibleDuplicates = (webhookData.possibleDuplicates as string[]) || [];
		if (possibleDuplicates.length) {
			responseData = (responseData as IDataObject[]).filter(({ json }) => {
				const { id } = json as IDataObject;
				return !possibleDuplicates.includes(id as string);
			});
		}

		webhookData.possibleDuplicates = nextPollPossibleDuplicates;
		webhookData.lastTimeChecked = lastEmailDate || endDate;

		if (Array.isArray(responseData) && responseData.length) {
			return [responseData as INodeExecutionData[]];
		}

		return null;
	}
}
