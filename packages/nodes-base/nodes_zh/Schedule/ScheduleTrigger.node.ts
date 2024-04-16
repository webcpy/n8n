import type {
	ITriggerFunctions,
	IDataObject,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { CronJob } from 'cron';
import moment from 'moment-timezone';
import type { IRecurencyRule } from './SchedulerInterface';
import { convertToUnixFormat, recurencyCheck } from './GenericFunctions';

export class ScheduleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Schedule Trigger',
		name: 'scheduleTrigger',
		icon: 'fa:clock',
		group: ['trigger', 'schedule'],
		version: [1, 1.1],
		description: '按给定时间表触发工作流程',
		eventTriggerDescription: '',
		activationMessage:
			'现在，您的计划触发器将根据您定义的计划触发执行。',
		defaults: {
			name: 'Schedule Trigger',
			color: '#31C49F',
		},

		inputs: [],
		outputs: ['main'],
		properties: [
			{
				"displayName":
					"此工作流将根据您在此处定义的计划运行，一旦您<a data-key=\"activate\">激活</a>它。<br><br>用于测试，您还可以手动触发它：返回到画布并点击 '测试工作流'",
				"name": "notice",
				"type": "notice",
				"default": ""
			},

			{
				displayName: '触发器规则',
				name: 'rule',
				placeholder: '新增规则',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {
					interval: [
						{
							field: 'days',
						},
					],
				},
				options: [
					{
						name: 'interval',
						displayName: '触发间隔',
						values: [
							{
								displayName: '触发间隔',
								name: 'field',
								type: 'options',
								default: 'days',
								// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
								options: [
									{
										name: 'Seconds',
										value: 'seconds',
									},
									{
										name: 'Minutes',
										value: 'minutes',
									},
									{
										name: 'Hours',
										value: 'hours',
									},
									{
										name: 'Days',
										value: 'days',
									},
									{
										name: 'Weeks',
										value: 'weeks',
									},
									{
										name: 'Months',
										value: 'months',
									},
									{
										name: 'Custom (Cron)',
										value: 'cronExpression',
									},
								],
							},
							{
								"displayName": "触发器间隔秒数",
								"name": "secondsInterval",
								"type": "number",
								"default": 30,
								"displayOptions": {
									"show": {
										"field": ["seconds"]
									}
								},
								"description": "每个工作流触发器之间的秒数"
							},
							{
								"displayName": "触发器间隔分钟数",
								"name": "minutesInterval",
								"type": "number",
								"default": 5,
								"displayOptions": {
									"show": {
										"field": ["minutes"]
									}
								},
								"description": "每个工作流触发器之间的分钟数"
							},
							{
								"displayName": "触发器间隔小时数",
								"name": "hoursInterval",
								"type": "number",
								"default": 1,
								"displayOptions": {
									"show": {
										"field": ["hours"]
									}
								},
								"description": "每个工作流触发器之间的小时数"
							},
							{
								"displayName": "触发器间隔天数",
								"name": "daysInterval",
								"type": "number",
								"default": 1,
								"displayOptions": {
									"show": {
										"field": ["days"]
									}
								},
								"description": "每个工作流触发器之间的天数"
							},
							{
								"displayName": "触发器间隔周数",
								"name": "weeksInterval",
								"type": "number",
								"default": 1,
								"displayOptions": {
									"show": {
										"field": ["weeks"]
									}
								},
								"description": "除非另有指定，否则每周运行一次"
							},
							{
								"displayName": "触发器间隔月数",
								"name": "monthsInterval",
								"type": "number",
								"default": 1,
								"displayOptions": {
									"show": {
										"field": ["months"]
									}
								},
								"description": "除非另有指定，否则每月运行一次"
							},
							{
								"displayName": "在月份的某一天触发",
								"name": "triggerAtDayOfMonth",
								"type": "number",
								"displayOptions": {
									"show": {
										"field": ["months"]
									}
								},
								"typeOptions": {
									"minValue": 1,
									"maxValue": 31
								},
								"default": 1,
								"description": "要触发的月份的某一天（1-31）",
								"hint": "如果该月没有这一天，则该节点不会触发"
							},
							{
								"displayName": "在工作日触发",
								"name": "triggerAtDay",
								"type": "multiOptions",
								"displayOptions": {
									"show": {
										"field": ["weeks"]
									}
								},
								"typeOptions": {
									"maxValue": 7
								},
								"options": [
									{
										"name": "周一",
										"value": 1
									},
									{
										"name": "周二",
										"value": 2
									},
									{
										"name": "周三",
										"value": 3
									},
									{
										"name": "周四",
										"value": 4
									},
									{
										"name": "周五",
										"value": 5
									},
									{
										"name": "周六",
										"value": 6
									},
									{
										"name": "周日",
										"value": 0
									}
								],
								"default": [0]
							},


							{
								"displayName": "按小时触发",
								"name": "triggerAtHour",
								"type": "options",
								"default": 0,
								"displayOptions": {
									"show": {
										"field": ["days", "weeks", "months"]
									}
								},
								"options": [
									{
										"name": "午夜",
										"displayName": "Midnight",
										"value": 0
									},
									{
										"name": "凌晨1点",
										"displayName": "1am",
										"value": 1
									},
									{
										"name": "凌晨2点",
										"displayName": "2am",
										"value": 2
									},
									{
										"name": "凌晨3点",
										"displayName": "3am",
										"value": 3
									},
									{
										"name": "凌晨4点",
										"displayName": "4am",
										"value": 4
									},
									{
										"name": "早上5点",
										"displayName": "5am",
										"value": 5
									},
									{
										"name": "早上6点",
										"displayName": "6am",
										"value": 6
									},
									{
										"name": "早上7点",
										"displayName": "7am",
										"value": 7
									},
									{
										"name": "上午8点",
										"displayName": "8am",
										"value": 8
									},
									{
										"name": "上午9点",
										"displayName": "9am",
										"value": 9
									},
									{
										"name": "上午10点",
										"displayName": "10am",
										"value": 10
									},
									{
										"name": "上午11点",
										"displayName": "11am",
										"value": 11
									},
									{
										"name": "中午12点",
										"displayName": "Noon",
										"value": 12
									},
									{
										"name": "下午1点",
										"displayName": "1pm",
										"value": 13
									},
									{
										"name": "下午2点",
										"displayName": "2pm",
										"value": 14
									},
									{
										"name": "下午3点",
										"displayName": "3pm",
										"value": 15
									},
									{
										"name": "下午4点",
										"displayName": "4pm",
										"value": 16
									},
									{
										"name": "下午5点",
										"displayName": "5pm",
										"value": 17
									},
									{
										"name": "下午6点",
										"displayName": "6pm",
										"value": 18
									},
									{
										"name": "晚上7点",
										"displayName": "7pm",
										"value": 19
									},
									{
										"name": "晚上8点",
										"displayName": "8pm",
										"value": 20
									},
									{
										"name": "晚上9点",
										"displayName": "9pm",
										"value": 21
									},
									{
										"name": "晚上10点",
										"displayName": "10pm",
										"value": 22
									},
									{
										"name": "晚上11点",
										"displayName": "11pm",
										"value": 23
									}
								],
								"description": "触发的小时数"
							},

							{
								"displayName": "分钟触发",
								"name": "triggerAtMinute",
								"type": "number",
								"default": 0,
								"displayOptions": {
									"show": {
										"field": ["hours", "days", "weeks", "months"]
									}
								},
								"typeOptions": {
									"minValue": 0,
									"maxValue": 59
								},
								"description": "触发的小时数（0-59）"
							},
							{
								"displayName": "您可以在<a href=\"https://crontab.guru/examples.html\" target=\"_blank\">这里</a>找到帮助生成您的cron表达式",
								"name": "notice",
								"type": "notice",
								"displayOptions": {
									"show": {
										"field": ["cronExpression"]
									}
								},
								"default": ""
							},
							{
								"displayName": "表达式",
								"name": "expression",
								"type": "string",
								"default": "",
								"placeholder": "例如 0 15 * 1 sun",
								"displayOptions": {
									"show": {
										"field": ["cronExpression"]
									}
								},
								"hint": "格式：[分钟] [小时] [月份中的某天] [月份] [星期中的某天]"
							}
						],
					},
				],
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const rule = this.getNodeParameter('rule', []) as IDataObject;
		const interval = rule.interval as IDataObject[];
		const timezone = this.getTimezone();
		const version = this.getNode().typeVersion;
		const cronJobs: CronJob[] = [];
		const intervalArr: NodeJS.Timeout[] = [];
		const staticData = this.getWorkflowStaticData('node') as {
			recurrencyRules: number[];
		};
		if (!staticData.recurrencyRules) {
			staticData.recurrencyRules = [];
		}
		const executeTrigger = async (recurency: IRecurencyRule) => {
			const resultData = {
				timestamp: moment.tz(timezone).toISOString(true),
				'Readable date': moment.tz(timezone).format('MMMM Do YYYY, h:mm:ss a'),
				'Readable time': moment.tz(timezone).format('h:mm:ss a'),
				'Day of week': moment.tz(timezone).format('dddd'),
				Year: moment.tz(timezone).format('YYYY'),
				Month: moment.tz(timezone).format('MMMM'),
				'Day of month': moment.tz(timezone).format('DD'),
				Hour: moment.tz(timezone).format('HH'),
				Minute: moment.tz(timezone).format('mm'),
				Second: moment.tz(timezone).format('ss'),
				Timezone: moment.tz(timezone).format('z Z'),
			};

			if (!recurency.activated) {
				this.emit([this.helpers.returnJsonArray([resultData])]);
			} else {
				if (recurencyCheck(recurency, staticData.recurrencyRules, timezone)) {
					this.emit([this.helpers.returnJsonArray([resultData])]);
				}
			}
		};

		for (let i = 0; i < interval.length; i++) {
			let intervalValue = 1000;
			if (interval[i].field === 'cronExpression') {
				if (version > 1) {
					// ! Remove this part if we use a cron library that follows unix cron expression
					convertToUnixFormat(interval[i]);
				}
				const cronExpression = interval[i].expression as string;
				try {
					const cronJob = new CronJob(
						cronExpression,
						async () => await executeTrigger({ activated: false } as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), 'Invalid cron expression', {
						description: 'More information on how to build them at https://crontab.guru/',
					});
				}
			}

			if (interval[i].field === 'seconds') {
				const seconds = interval[i].secondsInterval as number;
				intervalValue *= seconds;
				const intervalObj = setInterval(
					async () => await executeTrigger({ activated: false } as IRecurencyRule),
					intervalValue,
				) as NodeJS.Timeout;
				intervalArr.push(intervalObj);
			}

			if (interval[i].field === 'minutes') {
				const minutes = interval[i].minutesInterval as number;
				intervalValue *= 60 * minutes;
				const intervalObj = setInterval(
					async () => await executeTrigger({ activated: false } as IRecurencyRule),
					intervalValue,
				) as NodeJS.Timeout;
				intervalArr.push(intervalObj);
			}

			if (interval[i].field === 'hours') {
				const hour = interval[i].hoursInterval as number;
				const minute = interval[i].triggerAtMinute?.toString() as string;
				const cronTimes: string[] = [minute, '*', '*', '*', '*'];
				const cronExpression: string = cronTimes.join(' ');
				if (hour === 1) {
					const cronJob = new CronJob(
						cronExpression,
						async () => await executeTrigger({ activated: false } as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				} else {
					const cronJob = new CronJob(
						cronExpression,
						async () =>
							await executeTrigger({
								activated: true,
								index: i,
								intervalSize: hour,
								typeInterval: 'hours',
							} as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				}
			}

			if (interval[i].field === 'days') {
				const day = interval[i].daysInterval as number;
				const hour = interval[i].triggerAtHour?.toString() as string;
				const minute = interval[i].triggerAtMinute?.toString() as string;
				const cronTimes: string[] = [minute, hour, '*', '*', '*'];
				const cronExpression: string = cronTimes.join(' ');
				if (day === 1) {
					const cronJob = new CronJob(
						cronExpression,
						async () => await executeTrigger({ activated: false } as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				} else {
					const cronJob = new CronJob(
						cronExpression,
						async () =>
							await executeTrigger({
								activated: true,
								index: i,
								intervalSize: day,
								typeInterval: 'days',
							} as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				}
			}

			if (interval[i].field === 'weeks') {
				const hour = interval[i].triggerAtHour?.toString() as string;
				const minute = interval[i].triggerAtMinute?.toString() as string;
				const week = interval[i].weeksInterval as number;
				const days = interval[i].triggerAtDay as IDataObject[];
				const day = days.length === 0 ? '*' : days.join(',');
				const cronTimes: string[] = [minute, hour, '*', '*', day];
				const cronExpression = cronTimes.join(' ');
				if (week === 1) {
					const cronJob = new CronJob(
						cronExpression,
						async () => await executeTrigger({ activated: false } as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				} else {
					const cronJob = new CronJob(
						cronExpression,
						async () =>
							await executeTrigger({
								activated: true,
								index: i,
								intervalSize: week,
								typeInterval: 'weeks',
							} as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				}
			}

			if (interval[i].field === 'months') {
				const month = interval[i].monthsInterval;
				const day = interval[i].triggerAtDayOfMonth?.toString() as string;
				const hour = interval[i].triggerAtHour?.toString() as string;
				const minute = interval[i].triggerAtMinute?.toString() as string;
				const cronTimes: string[] = [minute, hour, day, '*', '*'];
				const cronExpression: string = cronTimes.join(' ');
				if (month === 1) {
					const cronJob = new CronJob(
						cronExpression,
						async () => await executeTrigger({ activated: false } as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				} else {
					const cronJob = new CronJob(
						cronExpression,
						async () =>
							await executeTrigger({
								activated: true,
								index: i,
								intervalSize: month,
								typeInterval: 'months',
							} as IRecurencyRule),
						undefined,
						true,
						timezone,
					);
					cronJobs.push(cronJob);
				}
			}
		}

		async function closeFunction() {
			for (const cronJob of cronJobs) {
				cronJob.stop();
			}
			for (const entry of intervalArr) {
				clearInterval(entry);
			}
		}

		async function manualTriggerFunction() {
			void executeTrigger({ activated: false } as IRecurencyRule);
		}

		return {
			closeFunction,
			manualTriggerFunction,
		};
	}
}
