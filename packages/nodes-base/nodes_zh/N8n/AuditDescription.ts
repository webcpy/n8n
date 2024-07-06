import type { INodeProperties } from 'n8n-workflow';

export const auditOperations: INodeProperties[] = [{
	displayName: '执行',
	"name": "operation",
	"type": "options",
	"noDataExpression": true,
	"default": "get",
	"displayOptions": {
		"show": {
			"resource": [
				"audit"
			]
		}
	},
	"options": [
		{
			"name": "生成",
			"value": "generate",
			"action": "生成一个安全审计",
			"description": "为此 n8n 实例生成一个安全审计",
			"routing": {
				"request": {
					"method": "POST",
					"url": "/audit"
				}
			}
		}
	]
}
]


export const auditFields: INodeProperties[] = [
	{
		"displayName": "附加选项",
		"name": "additionalOptions",
		"type": "collection",
		"placeholder": "添加筛选器",
		"displayOptions": {
			"show": {
				"resource": [
					"audit"
				]
			}
		},
		"routing": {
			"request": {
				"body": {
					"additionalOptions": "={{ $value }}"
				}
			}
		},
		"default": {},
		"options": [
			{
				"displayName": "分类",
				"name": "categories",
				"description": "在审计中包含的风险分类",
				"type": "multiOptions",
				"default": [],
				"options": [
					{
						"name": "凭据",
						"value": "credentials"
					},
					{
						"name": "数据库",
						"value": "database"
					},
					{
						"name": "文件系统",
						"value": "filesystem"
					},
					{
						"name": "实例",
						"value": "instance"
					},
					{
						"name": "节点",
						"value": "nodes"
					}
				]
			},
			{
				"displayName": "废弃工作流的天数",
				"name": "daysAbandonedWorkflow",
				"description": "工作流在未执行时被视为废弃的天数",
				"type": "number",
				"default": 90
			}
		]
	}
];
