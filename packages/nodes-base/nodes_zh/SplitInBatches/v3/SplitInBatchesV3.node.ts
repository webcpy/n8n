/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPairedItemData,
} from 'n8n-workflow';
import { deepCopy } from 'n8n-workflow';

export class SplitInBatchesV3 implements INodeType {
	description: INodeTypeDescription = {
		"displayName": "循环遍历项目（分批拆分）",
		"name": "splitInBatches",
		"icon": "fa:sync",
		"group": ["organization"],
		"version": 3,
		"description": "将数据拆分成批次，并对每个批次进行迭代",
		"defaults": {
			"name": "Loop Over Items",
			"color": "#007755"
		},
		"inputs": ["main"],
		"outputs": ["main", "main"],
		"outputNames": ["done", "loop"],
		"properties": [
			{
				"displayName": "您可能不需要此节点 — n8n 节点会自动为每个输入项目运行一次。 <a href=\"https://docs.n8n.io/getting-started/key-concepts/looping.html#using-loops-in-n8n\" target=\"_blank\">更多信息</a>",
				"name": "splitInBatchesNotice",
				"type": "notice",
				"default": ""
			},
			{
				"displayName": "批次大小",
				"name": "batchSize",
				"type": "number",
				"typeOptions": {
					"minValue": 1
				},
				"default": 1,
				"description": "每次调用返回的项目数量"
			},
			{
				"displayName": "选项",
				"name": "options",
				"type": "collection",
				"placeholder": "添加选项",
				"default": {},
				"options": [
					{
						"displayName": "重置",
						"name": "reset",
						"type": "boolean",
						"default": false,
						"description": "节点是否将重置，并重新初始化当前输入数据"
					}
				]
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] | null> {
		// Get the input data and create a new array so that we can remove
		// items without a problem
		const items = this.getInputData().slice();

		const nodeContext = this.getContext('node');

		const batchSize = this.getNodeParameter('batchSize', 0) as number;

		const returnItems: INodeExecutionData[] = [];

		const options = this.getNodeParameter('options', 0, {});

		if (nodeContext.items === undefined || options.reset === true) {
			// Is the first time the node runs

			const sourceData = this.getInputSourceData();

			nodeContext.currentRunIndex = 0;
			nodeContext.maxRunIndex = Math.ceil(items.length / batchSize);
			nodeContext.sourceData = deepCopy(sourceData);

			// Get the items which should be returned
			returnItems.push.apply(returnItems, items.splice(0, batchSize));

			// Save the incoming items to be able to return them for later runs
			nodeContext.items = [...items];

			// Reset processedItems as they get only added starting from the first iteration
			nodeContext.processedItems = [];
		} else {
			// The node has been called before. So return the next batch of items.
			nodeContext.currentRunIndex += 1;
			returnItems.push.apply(
				returnItems,
				(nodeContext.items as INodeExecutionData[]).splice(0, batchSize),
			);

			const addSourceOverwrite = (pairedItem: IPairedItemData | number): IPairedItemData => {
				if (typeof pairedItem === 'number') {
					return {
						item: pairedItem,
						sourceOverwrite: nodeContext.sourceData,
					};
				}

				return {
					...pairedItem,
					sourceOverwrite: nodeContext.sourceData,
				};
			};

			function getPairedItemInformation(
				item: INodeExecutionData,
			): IPairedItemData | IPairedItemData[] {
				if (item.pairedItem === undefined) {
					return {
						item: 0,
						sourceOverwrite: nodeContext.sourceData,
					};
				}

				if (Array.isArray(item.pairedItem)) {
					return item.pairedItem.map(addSourceOverwrite);
				}

				return addSourceOverwrite(item.pairedItem);
			}

			const sourceOverwrite = this.getInputSourceData();

			const newItems = items.map((item, index) => {
				return {
					...item,
					pairedItem: {
						sourceOverwrite,
						item: index,
					},
				};
			});

			nodeContext.processedItems = [...nodeContext.processedItems, ...newItems];

			returnItems.map((item) => {
				item.pairedItem = getPairedItemInformation(item);
			});
		}

		nodeContext.noItemsLeft = nodeContext.items.length === 0;

		if (returnItems.length === 0) {
			nodeContext.done = true;
			return [nodeContext.processedItems, []];
		}

		nodeContext.done = false;

		return [[], returnItems];
	}
}
