export const PREFIX = '“尽力回答以下问题。您可以访问以下工具：';

export const SUFFIX_CHAT = '开始！请记得在回复时始终使用确切的字符`Final Answer`。';

export const SUFFIX = `开始!

	Question: {input}
	Thought:{agent_scratchpad}`;

export const HUMAN_MESSAGE_TEMPLATE = '{input}\n\n{agent_scratchpad}';
