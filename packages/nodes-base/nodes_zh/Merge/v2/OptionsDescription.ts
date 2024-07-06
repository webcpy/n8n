import type { INodeProperties } from 'n8n-workflow';

const clashHandlingProperties: INodeProperties = {
	"displayName": "冲突处理",
	"name": "clashHandling",
	"type": "fixedCollection",
	"default": {
		"values": {
			"resolveClash": "preferInput2",
			"mergeMode": "deepMerge",
			"overrideEmpty": false
		}
	},
	"options": [
		{
			"displayName": "值",
			"name": "values",
			"values": [
				{
					"displayName": "当字段值冲突时",
					"name": "resolveClash",
					"type": "options",
					"default": "",
					"options": [
						{
							"name": "始终在字段名称中添加输入编号",
							"value": "addSuffix"
						},
						{
							"name": "优先输入1版本",
							"value": "preferInput1"
						},
						{
							"name": "优先输入2版本",
							"value": "preferInput2"
						}
					]
				},
				{
					"displayName": "合并嵌套字段",
					"name": "mergeMode",
					"type": "options",
					"default": "deepMerge",
					"options": [
						{
							"name": "深度合并",
							"value": "deepMerge",
							"description": "在每个嵌套级别上进行合并"
						},
						{
							"name": "浅层合并",
							"value": "shallowMerge",
							"description": "仅在顶层合并（所有嵌套字段将来自同一输入）"
						}
					],
					"hint": "当顶级字段下有子字段时如何合并",
					"displayOptions": {
						"show": {
							"resolveClash": [
								"preferInput1",
								"preferInput2"
							]
						}
					}
				},
				{
					"displayName": "最小化空字段",
					"name": "overrideEmpty",
					"type": "boolean",
					"default": false,
					"description": "是否在字段为空并且另一个版本不为空时覆盖优选的输入版本。这里的'空'指未定义、null或空字符串。",
					"displayOptions": {
						"show": {
							"resolveClash": [
								"preferInput1",
								"preferInput2"
							]
						}
					}
				}
			]
		}
	]
}


export const optionsDescription: INodeProperties[] = [
	{
		displayName: '选项',
		name: 'options',
		type: 'collection',
		placeholder: '添加选项',
		default: {},
		options: [
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
					},
					hide: {
						'/joinMode': ['keepMatches', 'keepNonMatches'],
					},
				},
			},
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['mergeByFields'],
						'/joinMode': ['keepMatches'],
						'/outputDataFrom': ['both'],
					},
				},
			},
			{
				...clashHandlingProperties,
				displayOptions: {
					show: {
						'/mode': ['combine'],
						'/combinationMode': ['multiplex', 'mergeByPosition'],
					},
				},
			},
			{
				"displayName": "禁用点表示法",
				"name": "disableDotNotation",
				"type": "boolean",
				"default": false,
				"description": "是否禁止使用`parent.child`在字段名称中引用子字段",
				"displayOptions": {
					"show": {
						"/mode": ["combine"],
						"/combinationMode": ["mergeByFields"]
					}
				}
			},
			{
				"displayName": "模糊比较",
				"name": "fuzzyCompare",
				"type": "boolean",
				"default": false,
				"description": "在比较字段时是否容忍小的类型差异。例如，数字3和字符串'3'被视为相同。",
			},
			{
				"displayName": "包括任意未配对项",
				"name": "includeUnpaired",
				"type": "boolean",
				"default": false,
				"description": "如果输入1和输入2中的项数量不同，是否包括末尾没有配对项的项",
				"displayOptions": {
					"show": {
						"/mode": ["combine"],
						"/combinationMode": ["mergeByPosition"]
					}
				}
			},
			{
				"displayName": "多个匹配项",
				"name": "multipleMatches",
				"type": "options",
				"default": "all",
				"options": [
					{
						"name": "包括所有匹配项",
						"value": "all",
						"description": "如果有多个匹配项，则输出多个项目",
					},
					{
						"name": "仅包括第一个匹配项",
						"value": "first",
						"description": "每次仅输出一个匹配项",
					}
				],
				"displayOptions": {
					"show": {
						"/mode": ["combine"],
						"/combinationMode": ["mergeByFields"],
						"/joinMode": ["keepMatches"],
						"/outputDataFrom": ["both"]
					}
				}
			},
			{
				"displayName": "多个匹配项",
				"name": "multipleMatches",
				"type": "options",
				"default": "all",
				"options": [
					{
						"name": "包括所有匹配项",
						"value": "all",
						"description": "如果有多个匹配项，则输出多个项目",
					},
					{
						"name": "仅包括第一个匹配项",
						"value": "first",
						"description": "每次仅输出一个匹配项",
					}
				],
				"displayOptions": {
					"show": {
						"/mode": ["combine"],
						"/combinationMode": ["mergeByFields"],
						"/joinMode": ["enrichInput1", "enrichInput2", "keepEverything"]
					}
				}
			}
		],
		displayOptions: {
			hide: {
				mode: ['chooseBranch', 'append'],
			},
		},
	},
];
