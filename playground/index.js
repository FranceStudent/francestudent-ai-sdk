import { FranceStudent } from 'francestudent-ai-sdk';

const fs = new FranceStudent({ sessionToken: process.env.FS_SESSION_TOKEN });

async function main() {
	try {
		// Listing the available agents
		const agents = await fs.chat.agents();
		console.log(agents.map((agent) => `${agent.id}\t${agent.name}`).join('\n'));

		// Asking a question, printing the answer as it arrives
		const response = await fs.chat.ask(
			{ agentId: agents.find((agent) => agent.isDefault)?.id ?? -1002, content: 'Bonjour !' },
			{ onDelta: (delta) => process.stdout.write(delta) },
		);
		console.log(`\n[chat: ${response.chatId}]`);
	} catch (error) {
		console.error('Error:', error);
	}
}

await main();
