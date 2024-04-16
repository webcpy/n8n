import type {
	IPollFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import moment from 'moment-timezone';
import { notionApiRequest, simplifyObjects } from './shared/GenericFunctions';

import { listSearch } from './shared/methods';

export class NotionTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notion Trigger',
		name: 'notionTrigger',
		icon: 'file:notion.svg',
		group: ['trigger'],
		version: 1,
		description: '当Notion事件发生时启动工作流程',
		subtitle: '={{$parameter["event"]}}',
		defaults: {
			name: 'Notion Trigger',
		},
		credentials: [
			{
				name: 'notionApi',
				required: true,
			},
		],
		polling: true,
		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName": "Event",
				"name": "event",
				"type": "options",
				"options": [
					{
						"name": "数据库中添加页面",
						"value": "pageAddedToDatabase"
					},
					{
						"name": "数据库中更新页面",
						"value": "pagedUpdatedInDatabase"
					}
				],
				"required": true,
				"default": "pageAddedToDatabase"
			},
			{
				"default": "",
				"type": "notice",
				"name": "notionNotice",
				"displayName": "在 Notion 中，确保<a href=\"https://www.notion.so/help/add-and-manage-connections-with-the-api\" target=\"_blank\">添加您的连接</a>到您想要访问的页面。",
			},
			{
				displayName: '数据库',
				name: 'databaseId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				modes: [
					{
						"displayName": "数据库",
						"name": "list",
						"type": "list",
						"placeholder": "选择一个数据库...",
						"typeOptions": {
							"searchListMethod": "getDatabases",
							"searchable": true
						}
					},
					{
						"displayName": "链接",
						"name": "url",
						"type": "string",
						"placeholder": "https://www.notion.so/0fe2f7de558b471eab07e9d871cdf4a9?v=f2d424ba0c404733a3f500c78c881610",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}).*",
									"errorMessage": "不是有效的 Notion 数据库 URL"
								}
							}
						],
						"extractValue": {
							"type": "regex",
							"regex": "(?:https|http)://www.notion.so/(?:[a-z0-9-]{2,}/)?([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})"
						}
					},
					{
						"displayName": "ID",
						"name": "id",
						"type": "string",
						"placeholder": "ab1545b247fb49fa92d6f4b49f4d8116",
						"validation": [
							{
								"type": "regex",
								"properties": {
									"regex": "^(([0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12})|([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}))[ \\t]*",
									"errorMessage": "不是有效的 Notion 数据库 ID"
								}
							}
						],
						"extractValue": {
							"type": "regex",
							"regex": "^([0-9a-f]{8}-?[0-9a-f]{4}-?4[0-9a-f]{3}-?[89ab][0-9a-f]{3}-?[0-9a-f]{12})"
						},
						url: '=https://www.notion.so/{{$value.replace(/-/g, "")}}',
					}

				],
				displayOptions: {
					show: {
						event: ['pageAddedToDatabase', 'pagedUpdatedInDatabase'],
					},
				},
				description: '将在 "Notion 数据库 "上运行',
			},
			{
				"displayOptions": {
					"show": {
						"event": ["pageAddedToDatabase", "pagedUpdatedInDatabase"]
					}
				},
				"default": true,
				"type": "boolean",
				"name": "simple",
				"displayName": "简化",
				"description": "是否返回响应的简化版本而不是原始数据"
			}

		],
	};

	methods = {
		listSearch,
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const webhookData = this.getWorkflowStaticData('node');
		const databaseId = this.getNodeParameter('databaseId', '', { extractValue: true }) as string;
		const event = this.getNodeParameter('event') as string;
		const simple = this.getNodeParameter('simple') as boolean;

		const lastTimeChecked = webhookData.lastTimeChecked
			? moment(webhookData.lastTimeChecked as string)
			: moment().set({ second: 0, millisecond: 0 }); // Notion timestamp accuracy is only down to the minute

		// update lastTimeChecked to now
		webhookData.lastTimeChecked = moment().set({ second: 0, millisecond: 0 });

		// because Notion timestamp accuracy is only down to the minute some duplicates can be fetch
		const possibleDuplicates = (webhookData.possibleDuplicates as string[]) ?? [];

		const sortProperty = event === 'pageAddedToDatabase' ? 'created_time' : 'last_edited_time';

		const option: IDataObject = {
			headers: {
				'Notion-Version': '2022-02-22',
			},
		};

		const body: IDataObject = {
			page_size: 1,
			sorts: [
				{
					timestamp: sortProperty,
					direction: 'descending',
				},
			],
			...(this.getMode() !== 'manual' && {
				filter: {
					timestamp: sortProperty,
					[sortProperty]: {
						on_or_after: lastTimeChecked.utc().format(),
					},
				},
			}),
		};

		let records: IDataObject[] = [];

		let hasMore = true;

		//get last record
		let { results: data } = await notionApiRequest.call(
			this,
			'POST',
			`/databases/${databaseId}/query`,
			body,
			{},
			'',
			option,
		);

		if (this.getMode() === 'manual') {
			if (simple) {
				data = simplifyObjects(data, false, 1);
			}
			if (Array.isArray(data) && data.length) {
				return [this.helpers.returnJsonArray(data)];
			}
		}

		// if something changed after the last check
		if (Array.isArray(data) && data.length && Object.keys(data[0] as IDataObject).length !== 0) {
			do {
				body.page_size = 10;
				const { results, has_more, next_cursor } = await notionApiRequest.call(
					this,
					'POST',
					`/databases/${databaseId}/query`,
					body,
					{},
					'',
					option,
				);
				records.push(...(results as IDataObject[]));
				hasMore = has_more;
				if (next_cursor !== null) {
					body.start_cursor = next_cursor;
				}
				// Only stop when we reach records strictly before last recorded time to be sure we catch records from the same minute
			} while (
				!moment(records[records.length - 1][sortProperty] as string).isBefore(lastTimeChecked) &&
				hasMore
			);

			// Filter out already processed left over records:
			// with a time strictly before the last record processed
			// or from the same minute not present in the list of processed records
			records = records.filter(
				(record: IDataObject) => !possibleDuplicates.includes(record.id as string),
			);

			// Save the time of the most recent record processed
			if (records[0]) {
				const latestTimestamp = moment(records[0][sortProperty] as string);

				// Save record ids with the same timestamp as the latest processed records
				webhookData.possibleDuplicates = records
					.filter((record: IDataObject) =>
						moment(record[sortProperty] as string).isSame(latestTimestamp),
					)
					.map((record: IDataObject) => record.id);
			} else {
				webhookData.possibleDuplicates = undefined;
			}

			if (simple) {
				records = simplifyObjects(records, false, 1);
			}

			if (Array.isArray(records) && records.length) {
				return [this.helpers.returnJsonArray(records)];
			}
		}

		return null;
	}
}
