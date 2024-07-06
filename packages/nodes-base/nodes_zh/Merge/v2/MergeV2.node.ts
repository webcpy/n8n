/* eslint-disable n8n-nodes-base/node-filename-against-convention */

import merge from 'lodash/merge';

import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
	IPairedItemData,
} from 'n8n-workflow';

import type {
	ClashResolveOptions,
	MatchFieldsJoinMode,
	MatchFieldsOptions,
	MatchFieldsOutput,
} from './GenericFunctions';
import {
	addSourceField,
	addSuffixToEntriesKeys,
	checkInput,
	checkMatchFieldsInput,
	findMatches,
	mergeMatched,
	selectMergeMethod,
} from './GenericFunctions';

import { optionsDescription } from './OptionsDescription';
import { preparePairedItemDataArray } from '@utils/utilities';

export class MergeV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: [2, 2.1],
			defaults: {
				name: 'Merge',
			},
			// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
			inputs: ['main', 'main'],
			outputs: ['main'],
			inputNames: ['Input 1', 'Input 2'],
			// If mode is chooseBranch data from both branches is required
			// to continue, else data from any input suffices
			requiredInputs: '={{ $parameter["mode"] === "chooseBranch" ? [0, 1] : 1 }}',
			properties: [
				{
					"displayName": "模式",
					"name": "mode",
					"type": "options",
					"options": [
						{
							"name": "追加",
							"value": "append",
							"description": "输入1的所有项目，然后输入2的所有项目"
						},
						{
							"name": "组合",
							"value": "combine",
							"description": "将匹配的项目合并在一起"
						},
						{
							"name": "选择分支",
							"value": "chooseBranch",
							"description": "输出输入数据，不进行修改"
						}
					],
					"default": "append",
					"description": "应如何合并分支数据"
				},
				{
					"displayName": "组合模式",
					"name": "combinationMode",
					"type": "options",
					"options": [
						{
							"name": "按字段合并",
							"value": "mergeByFields",
							"description": "根据相同的字段值组合项目"
						},
						{
							"name": "按位置合并",
							"value": "mergeByPosition",
							"description": "根据它们的顺序组合项目"
						},
						{
							"name": "多路复用",
							"value": "multiplex",
							"description": "所有可能的项目组合（交叉连接）"
						}
					],
					"default": "mergeByFields",
					"displayOptions": {
						"show": {
							"mode": ["combine"]
						}
					}
				},

				// mergeByFields ------------------------------------------------------------------
				{
					displayName: '匹配字段',
					name: 'mergeByFields',
					type: 'fixedCollection',
					placeholder: '添加匹配字段',
					default: { values: [{ field1: '', field2: '' }] },
					typeOptions: {
						multipleValues: true,
					},
					options: [
						{
							"displayName": "值",
							"name": "values",
							"values": [
								{
									"displayName": "输入1字段",
									"name": "field1",
									"type": "string",
									"default": "",
									"placeholder": "例如 id",
									"hint": "输入文本形式的字段名称",
									"requiresDataPath": "single"
								},
								{
									"displayName": "输入2字段",
									"name": "field2",
									"type": "string",
									"default": "",
									"placeholder": "例如 id",
									"hint": "输入文本形式的字段名称",
									"requiresDataPath": "single"
								}
							]
						}

					],
					displayOptions: {
						show: {
							mode: ['combine'],
							combinationMode: ['mergeByFields'],
						},
					},
				},
				{
					"displayName": "输出类型",
					"name": "joinMode",
					"type": "options",
					"options": [
						{
							"name": "保留匹配项",
							"value": "keepMatches",
							"description": "匹配的项目合并在一起（内连接）"
						},
						{
							"name": "保留非匹配项",
							"value": "keepNonMatches",
							"description": "不匹配的项目"
						},
						{
							"name": "保留所有项",
							"value": "keepEverything",
							"description": "匹配的项目合并在一起，加上不匹配的项目（外连接）"
						},
						{
							"name": "丰富输入1",
							"value": "enrichInput1",
							"description": "输入1的所有内容，并添加来自输入2的数据（左连接）"
						},
						{
							"name": "丰富输入2",
							"value": "enrichInput2",
							"description": "输入2的所有内容，并添加来自输入1的数据（右连接）"
						}
					],
					"default": "keepMatches",
					"displayOptions": {
						"show": {
							"mode": ["combine"],
							"combinationMode": ["mergeByFields"]
						}
					}
				},
				{
					"displayName": "输出数据来源",
					"name": "outputDataFrom",
					"type": "options",
					"options": [
						{
							"name": "两个输入合并在一起",
							"value": "both"
						},
						{
							"name": "输入1",
							"value": "input1"
						},
						{
							"name": "输入2",
							"value": "input2"
						}
					],
					"default": "both",
					"displayOptions": {
						"show": {
							"mode": ["combine"],
							"combinationMode": ["mergeByFields"],
							"joinMode": ["keepMatches"]
						}
					}
				},


				{
					"displayName": "输出数据来源",
					"name": "outputDataFrom",
					"type": "options",
					"options": [
						{
							"name": "两个输入追加在一起",
							"value": "both"
						},
						{
							"name": "输入1",
							"value": "input1"
						},
						{
							"name": "输入2",
							"value": "input2"
						}
					],
					"default": "both",
					"displayOptions": {
						"show": {
							"mode": ["combine"],
							"combinationMode": ["mergeByFields"],
							"joinMode": ["keepNonMatches"]
						}
					}
				},


				// chooseBranch -----------------------------------------------------------------
				{
					"displayName": "输出类型",
					"name": "chooseBranchMode",
					"type": "options",
					"options": [
						{
							"name": "等待两个输入到达",
							"value": "waitForBoth"
						}
					],
					"default": "waitForBoth",
					"displayOptions": {
						"show": {
							"mode": ["chooseBranch"]
						}
					}
				},
				{
					"displayName": "输出",
					"name": "output",
					"type": "options",
					"options": [
						{
							"name": "输入1数据",
							"value": "input1"
						},
						{
							"name": "输入2数据",
							"value": "input2"
						},
						{
							"name": "一个单独的空项",
							"value": "empty"
						}
					],
					"default": "input1",
					"displayOptions": {
						"show": {
							"mode": ["chooseBranch"],
							"chooseBranchMode": ["waitForBoth"]
						}
					}
				},


				...optionsDescription,
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		const mode = this.getNodeParameter('mode', 0) as string;

		if (mode === 'append') {
			for (let i = 0; i < 2; i++) {
				returnData.push.apply(returnData, this.getInputData(i));
			}
		}

		if (mode === 'combine') {
			const combinationMode = this.getNodeParameter('combinationMode', 0) as string;

			if (combinationMode === 'multiplex') {
				const clashHandling = this.getNodeParameter(
					'options.clashHandling.values',
					0,
					{},
				) as ClashResolveOptions;

				let input1 = this.getInputData(0);
				let input2 = this.getInputData(1);

				if (clashHandling.resolveClash === 'preferInput1') {
					[input1, input2] = [input2, input1];
				}

				if (clashHandling.resolveClash === 'addSuffix') {
					input1 = addSuffixToEntriesKeys(input1, '1');
					input2 = addSuffixToEntriesKeys(input2, '2');
				}

				const mergeIntoSingleObject = selectMergeMethod(clashHandling);

				if (!input1 || !input2) {
					return [returnData];
				}

				let entry1: INodeExecutionData;
				let entry2: INodeExecutionData;

				for (entry1 of input1) {
					for (entry2 of input2) {
						returnData.push({
							json: {
								...mergeIntoSingleObject(entry1.json, entry2.json),
							},
							binary: {
								...merge({}, entry1.binary, entry2.binary),
							},
							pairedItem: [
								entry1.pairedItem as IPairedItemData,
								entry2.pairedItem as IPairedItemData,
							],
						});
					}
				}
				return [returnData];
			}

			if (combinationMode === 'mergeByPosition') {
				const clashHandling = this.getNodeParameter(
					'options.clashHandling.values',
					0,
					{},
				) as ClashResolveOptions;
				const includeUnpaired = this.getNodeParameter(
					'options.includeUnpaired',
					0,
					false,
				) as boolean;

				let input1 = this.getInputData(0);
				let input2 = this.getInputData(1);

				if (input1.length === 0 || input2.length === 0) {
					// If data of any input is missing, return the data of
					// the input that contains data
					return [[...input1, ...input2]];
				}

				if (clashHandling.resolveClash === 'preferInput1') {
					[input1, input2] = [input2, input1];
				}

				if (clashHandling.resolveClash === 'addSuffix') {
					input1 = addSuffixToEntriesKeys(input1, '1');
					input2 = addSuffixToEntriesKeys(input2, '2');
				}

				if (input1 === undefined || input1.length === 0) {
					if (includeUnpaired) {
						return [input2];
					}
					return [returnData];
				}

				if (input2 === undefined || input2.length === 0) {
					if (includeUnpaired) {
						return [input1];
					}
					return [returnData];
				}

				let numEntries: number;
				if (includeUnpaired) {
					numEntries = Math.max(input1.length, input2.length);
				} else {
					numEntries = Math.min(input1.length, input2.length);
				}

				const mergeIntoSingleObject = selectMergeMethod(clashHandling);

				for (let i = 0; i < numEntries; i++) {
					if (i >= input1.length) {
						returnData.push(input2[i]);
						continue;
					}
					if (i >= input2.length) {
						returnData.push(input1[i]);
						continue;
					}

					const entry1 = input1[i];
					const entry2 = input2[i];

					returnData.push({
						json: {
							...mergeIntoSingleObject(entry1.json, entry2.json),
						},
						binary: {
							...merge({}, entry1.binary, entry2.binary),
						},
						pairedItem: [
							entry1.pairedItem as IPairedItemData,
							entry2.pairedItem as IPairedItemData,
						],
					});
				}
			}

			if (combinationMode === 'mergeByFields') {
				const matchFields = checkMatchFieldsInput(
					this.getNodeParameter('mergeByFields.values', 0, []) as IDataObject[],
				);

				const joinMode = this.getNodeParameter('joinMode', 0) as MatchFieldsJoinMode;
				const outputDataFrom = this.getNodeParameter(
					'outputDataFrom',
					0,
					'both',
				) as MatchFieldsOutput;
				const options = this.getNodeParameter('options', 0, {}) as MatchFieldsOptions;

				options.joinMode = joinMode;
				options.outputDataFrom = outputDataFrom;

				const nodeVersion = this.getNode().typeVersion;

				let input1 = this.getInputData(0);
				let input2 = this.getInputData(1);

				if (nodeVersion < 2.1) {
					input1 = checkInput(
						this.getInputData(0),
						matchFields.map((pair) => pair.field1),
						options.disableDotNotation || false,
						'Input 1',
					);
					if (!input1) return [returnData];

					input2 = checkInput(
						this.getInputData(1),
						matchFields.map((pair) => pair.field2),
						options.disableDotNotation || false,
						'Input 2',
					);
				} else {
					if (!input1) return [returnData];
				}

				if (input1.length === 0 || input2.length === 0) {
					if (!input1.length && joinMode === 'keepNonMatches' && outputDataFrom === 'input1')
						return [returnData];
					if (!input2.length && joinMode === 'keepNonMatches' && outputDataFrom === 'input2')
						return [returnData];

					if (joinMode === 'keepMatches') {
						// Stop the execution
						return [[]];
					} else if (joinMode === 'enrichInput1' && input1.length === 0) {
						// No data to enrich so stop
						return [[]];
					} else if (joinMode === 'enrichInput2' && input2.length === 0) {
						// No data to enrich so stop
						return [[]];
					} else {
						// Return the data of any of the inputs that contains data
						return [[...input1, ...input2]];
					}
				}

				if (!input1) return [returnData];

				if (!input2 || !matchFields.length) {
					if (
						joinMode === 'keepMatches' ||
						joinMode === 'keepEverything' ||
						joinMode === 'enrichInput2'
					) {
						return [returnData];
					}
					return [input1];
				}

				const matches = findMatches(input1, input2, matchFields, options);

				if (joinMode === 'keepMatches' || joinMode === 'keepEverything') {
					let output: INodeExecutionData[] = [];
					const clashResolveOptions = this.getNodeParameter(
						'options.clashHandling.values',
						0,
						{},
					) as ClashResolveOptions;

					if (outputDataFrom === 'input1') {
						output = matches.matched.map((match) => match.entry);
					}
					if (outputDataFrom === 'input2') {
						output = matches.matched2;
					}
					if (outputDataFrom === 'both') {
						output = mergeMatched(matches.matched, clashResolveOptions);
					}

					if (joinMode === 'keepEverything') {
						let unmatched1 = matches.unmatched1;
						let unmatched2 = matches.unmatched2;
						if (clashResolveOptions.resolveClash === 'addSuffix') {
							unmatched1 = addSuffixToEntriesKeys(unmatched1, '1');
							unmatched2 = addSuffixToEntriesKeys(unmatched2, '2');
						}
						output = [...output, ...unmatched1, ...unmatched2];
					}

					returnData.push(...output);
				}

				if (joinMode === 'keepNonMatches') {
					if (outputDataFrom === 'input1') {
						return [matches.unmatched1];
					}
					if (outputDataFrom === 'input2') {
						return [matches.unmatched2];
					}
					if (outputDataFrom === 'both') {
						let output: INodeExecutionData[] = [];
						output = output.concat(addSourceField(matches.unmatched1, 'input1'));
						output = output.concat(addSourceField(matches.unmatched2, 'input2'));
						return [output];
					}
				}

				if (joinMode === 'enrichInput1' || joinMode === 'enrichInput2') {
					const clashResolveOptions = this.getNodeParameter(
						'options.clashHandling.values',
						0,
						{},
					) as ClashResolveOptions;

					const mergedEntries = mergeMatched(matches.matched, clashResolveOptions, joinMode);

					if (joinMode === 'enrichInput1') {
						if (clashResolveOptions.resolveClash === 'addSuffix') {
							returnData.push(...mergedEntries, ...addSuffixToEntriesKeys(matches.unmatched1, '1'));
						} else {
							returnData.push(...mergedEntries, ...matches.unmatched1);
						}
					} else {
						if (clashResolveOptions.resolveClash === 'addSuffix') {
							returnData.push(...mergedEntries, ...addSuffixToEntriesKeys(matches.unmatched2, '2'));
						} else {
							returnData.push(...mergedEntries, ...matches.unmatched2);
						}
					}
				}
			}
		}

		if (mode === 'chooseBranch') {
			const chooseBranchMode = this.getNodeParameter('chooseBranchMode', 0) as string;

			if (chooseBranchMode === 'waitForBoth') {
				const output = this.getNodeParameter('output', 0) as string;

				if (output === 'input1') {
					returnData.push.apply(returnData, this.getInputData(0));
				}
				if (output === 'input2') {
					returnData.push.apply(returnData, this.getInputData(1));
				}
				if (output === 'empty') {
					const pairedItem = [
						...this.getInputData(0).map((inputData) => inputData.pairedItem),
						...this.getInputData(1).map((inputData) => inputData.pairedItem),
					].flatMap(preparePairedItemDataArray);

					returnData.push({
						json: {},
						pairedItem,
					});
				}
			}
		}

		return [returnData];
	}
}
