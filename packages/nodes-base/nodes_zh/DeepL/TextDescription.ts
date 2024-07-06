import type { INodeProperties } from 'n8n-workflow';

export const textOperations: INodeProperties[] = [{
	"displayName": "Text",
	"name": "text",
	"type": "string",
	"default": "",
	"description": "要翻译的输入文本",
	"required": true,
	"displayOptions": {
		"show": {
			"operation": ["translate"]
		}
	}
},
{
	"displayName": "目标语言名称或ID",
	"name": "translateTo",
	"type": "options",
	"typeOptions": {
		"loadOptionsMethod": "getLanguages"
	},
	"default": "",
	"description": "要翻译到的语言。从列表中选择，或使用表达式指定ID。",
	"required": true,
	"displayOptions": {
		"show": {
			"operation": ["translate"]
		}
	}
},
{
	"displayName": "附加字段",
	"name": "additionalFields",
	"type": "collection",
	"placeholder": "添加字段",
	"default": {},
	"options": [
		{
			"displayName": "源语言名称或ID",
			"name": "sourceLang",
			"type": "options",
			"default": "",
			"description": "要翻译的语言。从列表中选择，或使用表达式指定ID。",
			"typeOptions": {
				"loadOptionsMethod": "getLanguages"
			}
		},
		{
			"displayName": "分割句子",
			"name": "splitSentences",
			"type": "options",
			"default": "1",
			"description": "翻译引擎应如何分割句子",
			"options": [
				{
					"name": "仅插入标点符号",
					"value": "nonewlines",
					"description": "仅在标点符号处分割文本，忽略换行符"
				},
				{
					"name": "不分割",
					"value": "0",
					"description": "将所有文本视为单个句子"
				},
				{
					"name": "根据标点符号和换行符分割",
					"value": "1",
					"description": "根据标点符号和换行符分割文本"
				}
			]
		},
		{
			"displayName": "保留格式",
			"name": "preserveFormatting",
			"type": "options",
			"default": "0",
			"description": "翻译引擎是否应保留原始格式，即使通常会纠正一些方面",
			"options": [
				{
					"name": "应用更正",
					"value": "0",
					"description": "修正句子开头和结尾的标点符号，并修正句子开头的大小写"
				},
				{
					"name": "不更正",
					"value": "1",
					"description": "尽可能保持文本与原始文本相似"
				}
			]
		},
		{
			"displayName": "形式",
			"name": "formality",
			"type": "options",
			"default": "default",
			"description": "目标文本的正式程度。可能不支持所有语言。",
			"options": [
				{
					"name": "正式",
					"value": "more"
				},
				{
					"name": "非正式",
					"value": "less"
				},
				{
					"name": "中性",
					"value": "default"
				}
			]
		}
	],
	"displayOptions": {
		"show": {
			"operation": ["translate"]
		}
	}
}]
