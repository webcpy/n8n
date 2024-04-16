import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { deepCopy } from 'n8n-workflow';

import { Converter } from 'showdown';

import { NodeHtmlMarkdown } from 'node-html-markdown';

import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';

export class Markdown implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Markdown',
		name: 'markdown',
		icon: 'file:markdown.svg',
		group: ['output'],
		version: 1,
		subtitle:
			'={{$parameter["mode"]==="markdownToHtml" ? "Markdown to HTML" : "HTML to Markdown"}}',
		description: '在 Markdown 和 HTML 之间转换数据',
		defaults: {
			name: 'Markdown',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				"displayName": "模式",
				"name": "mode",
				"type": "options",
				"options": [
					{
						"name": "Markdown 转 HTML",
						"value": "markdownToHtml",
						"description": "将数据从 Markdown 转换为 HTML"
					},
					{
						"name": "HTML 转 Markdown",
						"value": "htmlToMarkdown",
						"description": "将数据从 HTML 转换为 Markdown"
					}
				],
				"default": "htmlToMarkdown"
			},
			{
				"displayOptions": {
					"show": {
						"mode": [
							"htmlToMarkdown"
						]
					}
				},
				"default": "",
				"description": "要转换为 markdown 的 HTML",
				"displayName": "HTML",
				"name": "html",
				"required": true,
				"type": "string"
			},
			{
				"displayOptions": {
					"show": {
						"mode": [
							"markdownToHtml"
						]
					}
				},
				"default": "",
				"description": "要转换为 html 的 Markdown",
				"displayName": "Markdown",
				"name": "markdown",
				"required": true,
				"type": "string"
			},
			{
				"displayOptions": {
					"show": {
						"mode": [
							"markdownToHtml",
							"htmlToMarkdown"
						]
					}
				},
				"default": "data",
				"description": "要放置输出的字段。使用点指定嵌套字段，例如“level1.level2.newKey”。",
				"displayName": "Destination Key",
				"name": "destinationKey",
				"placeholder": "",
				"required": true,
				"type": "string"
			},


			//============= HTML to Markdown Options ===============
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				displayOptions: {
					show: {
						mode: ['htmlToMarkdown'],
					},
				},
				options: [
					{
						"displayName": "项目符号",
						"name": "bulletMarker",
						"type": "string",
						"default": "*",
						"description": "指定项目符号，默认为 *",
					},
					{
						"displayName": "代码块边界",
						"name": "codeFence",
						"type": "string",
						"default": "```",
						"description": "指定代码块边界，默认为 ```",
					},
					{
						"displayName": "强调符号",
						"name": "emDelimiter",
						"type": "string",
						"default": "_",
						"description": "指定强调符号，默认为 _",
					},
					{
						"displayName": "全局转义模式",
						"name": "globalEscape",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": false
						},
						"default": {},
						"description": "设置此项将覆盖默认转义设置，您可能希望使用 textReplace 选项来代替",
						"options": [
							{
								"name": "value",
								"displayName": "值",
								"values": [
									{
										"displayName": "模式",
										"name": "pattern",
										"type": "string",
										"default": "",
										"description": "正则表达式模式",
									},
									{
										"displayName": "替换",
										"name": "replacement",
										"type": "string",
										"default": "",
										"description": "字符串替换",
									}
								]
							}
						]
					},
					{
						"displayName": "忽略的元素",
						"name": "ignore",
						"type": "string",
						"default": "",
						"description": "将忽略提供的元素（忽略内部文本，不解析子元素）",
						"placeholder": "例如 h1, p ...",
						"hint": "逗号分隔的元素",
					},
					{
						"displayName": "保留包含数据的图片",
						"name": "keepDataImages",
						"type": "boolean",
						"default": false,
						"description": "是否保留包含数据的图片：URI（注意：每个图片可以达到1MB），例如 &lt;img src=\"data:image/gif;base64,R0lGODlhEAAQAMQAAORHHOVSK......0o/\"&gt;",
					},
					{
						"displayName": "行起始转义模式",
						"name": "lineStartEscape",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": false
						},
						"default": {},
						"description": "设置此项将覆盖默认转义设置，您可能希望使用 textReplace 选项来代替",
						"options": [
							{
								"name": "value",
								"displayName": "值",
								"values": [
									{
										"displayName": "模式",
										"name": "pattern",
										"type": "string",
										"default": "",
										"description": "正则表达式模式",
									},
									{
										"displayName": "替换",
										"name": "replacement",
										"type": "string",
										"default": "",
										"description": "字符串替换",
									}
								]
							}
						]
					},
					{
						"displayName": "最大连续换行数",
						"name": "maxConsecutiveNewlines",
						"type": "number",
						"default": 3,
						"description": "指定允许的最大连续换行数",
					},
					{
						"displayName": "将网址放在底部",
						"name": "useLinkReferenceDefinitions",
						"type": "boolean",
						"default": false,
						"description": "是否将网址放在底部并使用链接引用定义格式化链接",
					},
					{
						"displayName": "加粗符号",
						"name": "strongDelimiter",
						"type": "string",
						"default": "**",
						"description": "指定加粗符号，默认为 **",
					},
					{
						"displayName": "代码块样式",
						"name": "codeBlockStyle",
						"type": "options",
						"default": "fence",
						"description": "指定代码块样式，默认为“fence”",
						"options": [
							{
								"name": "Fence",
								"value": "fence",
							},
							{
								"name": "Indented",
								"value": "indented",
							}
						]
					},
					{
						"displayName": "文本替换模式",
						"name": "textReplace",
						"type": "fixedCollection",
						"typeOptions": {
							"multipleValues": true
						},
						"default": [],
						"description": "用户定义的文本替换模式（替换从节点中检索到的匹配文本）",
						"options": [
							{
								"name": "values",
								"displayName": "Values",
								"values": [
									{
										"displayName": "模式",
										"name": "pattern",
										"type": "string",
										"default": "",
										"description": "正则表达式模式",
									},
									{
										"displayName": "替换",
										"name": "replacement",
										"type": "string",
										"default": "",
										"description": "字符串替换",
									}
								]
							}
						]
					},
					{
						"displayName": "视为块级元素",
						"name": "blockElements",
						"type": "string",
						"default": "",
						"description": "提供的元素将被视为块级元素（用空行包围）",
						"placeholder": "例如 p, div, ...",
						"hint": "逗号分隔的元素",
					}
				]

			},
			//============= Markdown to HTML Options ===============
			{
				displayName: '选项',
				name: 'options',
				type: 'collection',
				placeholder: '添加选项',
				default: {},
				displayOptions: {
					show: {
						mode: ['markdownToHtml'],
					},
				},
				options: [
					{
						"displayName": "在链接中添加空格",
						"name": "openLinksInNewWindow",
						"type": "boolean",
						"default": false,
						"description": "是否将所有链接在新窗口中打开（通过将属性 target=\"_blank\" 添加到 <a> 标签）",
					},
					{
						"displayName": "自动链接到URL",
						"name": "simplifiedAutoLink",
						"type": "boolean",
						"default": false,
						"description": "是否启用自动链接到URL",
					},
					{
						"displayName": "反斜杠转义HTML标签",
						"name": "backslashEscapesHTMLTags",
						"type": "boolean",
						"default": false,
						"description": "是否支持HTML标签转义，例如：&lt;div&gt;foo&lt;/div&gt;",
					},
					{
						"displayName": "完整的HTML文档",
						"name": "completeHTMLDocument",
						"type": "boolean",
						"default": false,
						"description": "是否输出完整的HTML文档，包括 &lt;html&gt;、&lt;head&gt; 和 &lt;body&gt; 标签，而不是HTML片段",
					},
					{
						"displayName": "自定义头部ID",
						"name": "customizedHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否使用大括号中的文本作为头部ID",
					},
					{
						"displayName": "Emoji支持",
						"name": "emoji",
						"type": "boolean",
						"default": false,
						"description": "是否启用Emoji支持。例如：这是一个 :smile: 表情符号。有关可用表情符号的更多信息，请参阅 https://github.com/showdownjs/showdown/wiki/Emojis。",
					},
					{
						"displayName": "编码电子邮件",
						"name": "encodeEmails",
						"type": "boolean",
						"default": true,
						"description": "是否通过使用字符实体对电子邮件地址进行编码，将ASCII电子邮件地址转换为其等效的十进制实体",
					},
					{
						"displayName": "排除URL末尾标点符号",
						"name": "excludeTrailingPunctuationFromURLs",
						"type": "boolean",
						"default": false,
						"description": "是否排除自动链接URL末尾的标点符号。排除的标点符号：. ! ? ( )。仅当simplifiedAutoLink选项设置为true时才适用。",
					},
					{
						"displayName": "GitHub代码块",
						"name": "ghCodeBlocks",
						"type": "boolean",
						"default": true,
						"description": "是否启用对GFM代码块样式的支持",
					},
					{
						"displayName": "GitHub兼容的头部ID",
						"name": "ghCompatibleHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否生成与GitHub风格兼容的头部ID（空格替换为连字符，许多非字母数字字符被移除）",
					},
					{
						"displayName": "GitHub提及链接",
						"name": "ghMentionsLink",
						"type": "string",
						"default": "https://github.com/{u}",
						"description": "是否更改@mentions生成的链接。Showdown将使用用户名替换{u}。仅当ghMentions选项已启用时才适用。",
					},
					{
						"displayName": "GitHub提及",
						"name": "ghMentions",
						"type": "boolean",
						"default": false,
						"description": "是否启用GitHub @mentions，链接到所提及的用户名",
					},
					{
						"displayName": "GitHub任务列表",
						"name": "tasklists",
						"type": "boolean",
						"default": false,
						"description": "是否启用GFM任务列表的支持",
					},
					{
						"displayName": "标题级别开始",
						"name": "headerLevelStart",
						"type": "number",
						"default": 1,
						"description": "是否设置标题起始级别",
					},
					{
						"displayName": "标题之前强制空格",
						"name": "requireSpaceBeforeHeadingText",
						"type": "boolean",
						"default": false,
						"description": "是否强制在#和标题文本之间添加空格",
					},
					{
						"displayName": "中间单词的星号",
						"name": "literalMidWordAsterisks",
						"type": "boolean",
						"default": false,
						"description": "是否停止将单词中间的星号解释为<em>和<strong>，而是将其视为文字星号",
					},
					{
						"displayName": "中间单词的下划线",
						"name": "literalMidWordUnderscores",
						"type": "boolean",
						"default": false,
						"description": "是否停止将单词中间的下划线解释为<em>和<strong>，而是将其视为文字下划线",
					},
					{
						"displayName": "无标题ID",
						"name": "noHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否禁用自动生成标题ID",
					},
					{
						"displayName": "解析图片尺寸",
						"name": "parseImgDimensions",
						"type": "boolean",
						"default": false,
						"description": "是否启用从Markdown语法中设置图片尺寸的支持",
					},
					{
						"displayName": "前缀标题ID",
						"name": "prefixHeaderId",
						"type": "string",
						"default": "section",
						"description": "为生成的标题ID添加前缀",
					},
					{
						"displayName": "原始标题ID",
						"name": "rawHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否仅移除生成的标题ID中的空格，\' 和 \"，并用连字符（-）替换它们",
					},
					{
						"displayName": "原始前缀标题ID",
						"name": "rawPrefixHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否阻止Showdown修改前缀",
					},
					{
						"displayName": "简单换行",
						"name": "simpleLineBreaks",
						"type": "boolean",
						"default": false,
						"description": "是否将换行解析为&lt;br&gt;，类似于GitHub，无需在行尾添加2个空格",
					},
					{
						"displayName": "智能缩进修复",
						"name": "smartIndentationFix",
						"type": "boolean",
						"default": false,
						"description": "是否尝试智能修复与缩进代码中的es6模板字符串相关的缩进问题",
					},
					{
						"displayName": "空格缩进子列表",
						"name": "disableForced4SpacesIndentedSublists",
						"type": "boolean",
						"default": false,
						"description": "是否禁用将子列表缩进4个空格的要求，以便将它们嵌套，有效地恢复到以前2或3个空格就足够的旧行为",
					},
					{
						"displayName": "拆分相邻引用块",
						"name": "splitAdjacentBlockquotes",
						"type": "boolean",
						"default": false,
						"description": "是否拆分相邻的引用块",
					},
					{
						"displayName": "删除线",
						"name": "strikethrough",
						"type": "boolean",
						"default": false,
						"description": "是否启用删除线语法的支持",
					},
					{
						"displayName": "表头ID",
						"name": "tablesHeaderId",
						"type": "boolean",
						"default": false,
						"description": "是否为表头标签添加ID属性",
					},
					{
						"displayName": "表格支持",
						"name": "tables",
						"type": "boolean",
						"default": false,
						"description": "是否启用表格语法的支持",
					}
				]
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const mode = this.getNodeParameter('mode', 0) as string;

		const { length } = items;
		for (let i = 0; i < length; i++) {
			try {
				if (mode === 'htmlToMarkdown') {
					const options = this.getNodeParameter('options', i);
					const destinationKey = this.getNodeParameter('destinationKey', i) as string;

					const textReplaceOption = this.getNodeParameter(
						'options.textReplace.values',
						i,
						[],
					) as IDataObject[];
					options.textReplace = !isEmpty(textReplaceOption)
						? textReplaceOption.map((entry) => [entry.pattern, entry.replacement])
						: undefined;

					const lineStartEscapeOption = this.getNodeParameter(
						'options.lineStartEscape.value',
						i,
						{},
					) as IDataObject;
					options.lineStartEscape = !isEmpty(lineStartEscapeOption)
						? [lineStartEscapeOption.pattern, lineStartEscapeOption.replacement]
						: undefined;

					const globalEscapeOption = this.getNodeParameter(
						'options.globalEscape.value',
						i,
						{},
					) as IDataObject;
					options.globalEscape = !isEmpty(globalEscapeOption)
						? [globalEscapeOption.pattern, globalEscapeOption.replacement]
						: undefined;

					options.ignore = options.ignore
						? (options.ignore as string).split(',').map((element) => element.trim())
						: undefined;
					options.blockElements = options.blockElements
						? (options.blockElements as string).split(',').map((element) => element.trim())
						: undefined;

					const markdownOptions = {} as IDataObject;

					Object.keys(options).forEach((option) => {
						if (options[option]) {
							markdownOptions[option] = options[option];
						}
					});

					const html = this.getNodeParameter('html', i) as string;

					const markdownFromHTML = NodeHtmlMarkdown.translate(html, markdownOptions);

					const newItem = deepCopy(items[i].json);
					set(newItem, destinationKey, markdownFromHTML);
					returnData.push(newItem);
				}

				if (mode === 'markdownToHtml') {
					const markdown = this.getNodeParameter('markdown', i) as string;
					const destinationKey = this.getNodeParameter('destinationKey', i) as string;
					const options = this.getNodeParameter('options', i);

					const converter = new Converter();

					Object.keys(options).forEach((key) => converter.setOption(key, options[key]));
					const htmlFromMarkdown = converter.makeHtml(markdown);

					const newItem = deepCopy(items[i].json);
					set(newItem, destinationKey, htmlFromMarkdown);

					returnData.push(newItem);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as JsonObject).message });
					continue;
				}
				throw error;
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
