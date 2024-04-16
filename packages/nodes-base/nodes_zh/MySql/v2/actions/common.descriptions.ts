import type { INodeProperties } from 'n8n-workflow';
import { BATCH_MODE, SINGLE } from '../helpers/interfaces';

export const tableRLC: INodeProperties = {
	"displayName": "表",
	"name": "table",
	"type": "resourceLocator",
	"default": {
		"mode": "list",
		"value": ""
	},
	"required": true,
	"description": "您要处理的表",
	"modes": [
		{
			"displayName": "从列表中选择",
			"name": "list",
			"type": "list",
			"placeholder": "选择一个表...",
			"typeOptions": {
				"searchListMethod": "searchTables",
				"searchable": true
			}
		},
		{
			"displayName": "名称",
			"name": "name",
			"type": "string",
			"placeholder": "表名"
		}
	]
}


export const optionsCollection: INodeProperties = {
	displayName: '选项',
	name: 'options',
	type: 'collection',
	default: {},
	placeholder: '新增 选项',
	options: [
		{
			displayName: 'Connection Timeout',
			name: 'connectionTimeoutMillis',
			type: 'number',
			default: 30,
			description: 'Number of milliseconds reserved for connecting to the database',
			typeOptions: {
				minValue: 1,
			},
		},
		{
			displayName: '连接限制',
			name: 'connectionLimit',
			type: 'number',
			default: 10,
			typeOptions: {
				minValue: 1,
			},
			description: `数据库的最大连接数，设置高值可能会导致性能问题和潜在的数据库崩溃`
		},
		{
			displayName: '查询批处理',
			name: 'queryBatching',
			type: 'options',
			noDataExpression: true,
			description: '向数据库发送查询的方式',
			options: [
				{
					name: '统一查询',
					value: BATCH_MODE.SINGLE,
					description: '对所有传入项目进行一次查询',
				},
				{
					name: 'Independently',
					value: BATCH_MODE.INDEPENDENTLY,
					description: '对运行中的每个输入项执行一次查询',
				},
				{
					name: 'Transaction',
					value: BATCH_MODE.TRANSACTION,
					description: '在事务中执行所有查询，如果出现故障，则回滚所有更改'
				},
			],
			default: SINGLE,
		},

		{
			"displayName": "Query Parameters",
			"name": "queryReplacement",
			"type": "string",
			"default": "",
			"placeholder": "例如，value1,value2,value3",
			"description": "要用作查询参数的值的逗号分隔列表。您可以从左侧的输入面板中拖动这些值。 <a href=\"https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.mysql/\" target=\"_blank\">更多信息</a>",
			"hint": "逗号分隔的值列表：在查询中引用它们为 $1, $2, $3…",
			"displayOptions": {
				"show": {
					"/operation": [
						"executeQuery"
					]
				}
			}
		},
		{
			"displayName": "Output Columns",
			"name": "outputColumns",
			"type": "multiOptions",
			"description": "从列表中选择，或者使用 <a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a> 指定 ID",
			"typeOptions": {
				"loadOptionsMethod": "getColumnsMultiOptions",
				"loadOptionsDependsOn": [
					"table.value"
				]
			},
			"default": [],
			"displayOptions": {
				"show": {
					"/operation": [
						"select"
					]
				}
			}
		},
		{
			"displayName": "输出大型数字格式",
			"name": "largeNumbersOutput",
			"type": "options",
			"options": [
				{
					"name": "数字",
					"value": "numbers"
				},
				{
					"name": "文本",
					"value": "text",
					"description": "如果您期望数字长度超过 16 位，请使用此选项（否则数字可能不正确）"
				}
			],
			"hint": "仅适用于 NUMERIC 和 BIGINT 列",
			"default": "text",
			"displayOptions": {
				"show": {
					"/operation": [
						"select",
						"executeQuery"
					]
				}
			}
		},
		{
			"displayName": "优先级",
			"name": "priority",
			"type": "options",
			"options": [
				{
					"name": "低优先级",
					"value": "LOW_PRIORITY",
					"description": "延迟 INSERT 执行，直到没有其他客户端从表中读取"
				},
				{
					"name": "高优先级",
					"value": "HIGH_PRIORITY",
					"description": "覆盖 --low-priority-updates 选项的效果（如果服务器使用该选项启动）。它还会导致不使用并发插入。"
				}
			],
			"default": "LOW_PRIORITY",
			"description": "在执行 INSERT 语句时忽略任何可忽略的错误",
			"displayOptions": {
				"show": {
					"/operation": [
						"insert"
					]
				}
			}
		},
		{
			"displayName": "将空字符串替换为 NULL",
			"name": "replaceEmptyStrings",
			"type": "boolean",
			"default": false,
			"description": "在输入中将空字符串替换为 NULL，当数据来自电子表格时可能会有用",
			"displayOptions": {
				"show": {
					"/operation": [
						"insert",
						"update",
						"upsert",
						"executeQuery"
					]
				}
			}
		},
		{
			"displayName": "选择唯一值",
			"name": "selectDistinct",
			"type": "boolean",
			"default": false,
			"description": "是否删除重复的行",
			"displayOptions": {
				"show": {
					"/operation": [
						"select"
					]
				}
			}
		},
		{
			"displayName": "输出查询执行详细信息",
			"name": "detailedOutput",
			"type": "boolean",
			"default": false,
			"description": "是否在输出中显示每个语句的执行查询的详细信息，或者只是成功的确认信息"
		},
		{
			"displayName": "冲突时跳过",
			"name": "skipOnConflict",
			"type": "boolean",
			"default": false,
			"description": "如果违反唯一约束或排除约束，则跳过行并不抛出错误",
			"displayOptions": {
				"show": {
					"/operation": [
						"insert"
					]
				}
			}
		}
	],
};

export const selectRowsFixedCollection: INodeProperties = {
	"displayName": "选择行",
	"name": "where",
	"type": "fixedCollection",
	"typeOptions": {
		"multipleValues": true
	},
	"placeholder": "添加条件",
	"default": {},
	"description": "如果未设置，则选择所有行",
	"options": [
		{
			"displayName": "数值",
			"name": "values",
			"values": [
				{
					"displayName": "列",
					"name": "column",
					"type": "options",
					"description": "从列表中选择，或者使用<a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a>指定 ID",
					"default": "",
					"placeholder": "例如，ID",
					"typeOptions": {
						"loadOptionsMethod": "getColumns",
						"loadOptionsDependsOn": [
							"schema.value",
							"table.value"
						]
					}
				},
				{
					"displayName": "运算符",
					"name": "condition",
					"type": "options",
					"description": "要将列与之比较的运算符。使用 'LIKE' 运算符时，百分号（%）匹配零个或多个字符，下划线（_）匹配任何单个字符。",
					"options": [
						{
							"name": "等于",
							"value": "equal"
						},
						{
							"name": "不等于",
							"value": "!="
						},
						{
							"name": "类似",
							"value": "LIKE"
						},
						{
							"name": "大于",
							"value": ">"
						},
						{
							"name": "小于",
							"value": "<"
						},
						{
							"name": "大于或等于",
							"value": ">="
						},
						{
							"name": "小于或等于",
							"value": "<="
						},
						{
							"name": "为空",
							"value": "IS NULL"
						}
					],
					"default": "equal"
				},
				{
					"displayName": "值",
					"name": "value",
					"type": "string",
					"default": ""
				}
			]
		}
	]
}


export const sortFixedCollection: INodeProperties = {
	"displayName": "排序",
	"name": "sort",
	"type": "fixedCollection",
	"typeOptions": {
		"multipleValues": true
	},
	"placeholder": "添加排序规则",
	"default": {},
	"options": [
		{
			"displayName": "数值",
			"name": "values",
			"values": [
				{
					"displayName": "列",
					"name": "column",
					"type": "options",
					"description": "从列表中选择，或者使用<a href=\"https://docs.n8n.io/code-examples/expressions/\" target=\"_blank\">表达式</a>指定 ID",
					"default": "",
					"typeOptions": {
						"loadOptionsMethod": "getColumns",
						"loadOptionsDependsOn": [
							"schema.value",
							"table.value"
						]
					}
				},
				{
					"displayName": "方向",
					"name": "direction",
					"type": "options",
					"options": [
						{
							"name": "ASC",
							"value": "ASC"
						},
						{
							"name": "DESC",
							"value": "DESC"
						}
					],
					"default": "ASC"
				}
			]
		}
	]
}


export const combineConditionsCollection: INodeProperties = {
	"displayName": "条件组合",
	"name": "combineConditions",
	"type": "options",
	"description": "如何组合“选择行”中定义的条件：AND 需要所有条件都为真，OR 需要至少一个条件为真",
	"options": [
		{
			"name": "AND",
			"value": "AND",
			"description": "只选择满足所有条件的行"
		},
		{
			"name": "OR",
			"value": "OR",
			"description": "选择满足至少一个条件的行"
		}
	],
	"default": "AND"
}
