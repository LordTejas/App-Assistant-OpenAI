import OpenAI from "openai";

const BYTE_ASSISTANT_ID = "asst_BILGDw0hS2fluVxwVBYWvYkY";

const APP_NAME = "Byte Quiz: Product Recommendations";
const ASSISTANT_INSTRUCTIONS = `Please help the user with their query regarding ${APP_NAME}.
 Ignore the user's name and address them as 'you'. 
 Avoid other questions and only answer the user's query regarding the app.`;

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  maxRetries: 2,
  dangerouslyAllowBrowser: true
});

/**
 * Create a thread and return the thread object
 * @returns {Promise<Thread>}
 */
export const create_thread = async () => {
  try {
    console.time("[AI] CREATE THREAD");
    const thread = await openai.beta.threads.create();
    console.timeEnd("[AI] CREATE THREAD");
    return thread;
  } catch (error) {
    console.error(`[AI] CREATE THREAD failed: ${error}`);
  }
}

export const retrieve_thread = async (thread_id) => {
  try {
    const thread = await openai.beta.threads.retrieve(thread_id);
    return thread;
  } catch (error) {
    console.error(`[AI] RETRIEVE THREAD failed: ${error}`);
  }
}

/**
 * Get the messages from a thread and return the cleaned messages
 * @param {string} thread_id - The ID of the thread
 * @param {string} order - The order of the messages, 'asc' or 'desc'
 * @returns {Promise<Array<{id: string, thread_id: string, role: string, content: string}>>}
 */
const get_cleaned_messages = async (thread_id, order = 'asc') => {
  const messages = await openai.beta.threads.messages.list(thread_id, { order: order });

  const cleaned_messages = messages.data.map((message) => {
    return {
      id: message.id,
      thread_id: message.thread_id,
      role: message.role,
      content: message.content[0].text.value,
    };
  });
  return cleaned_messages;
}

/**
 * Create a message in a thread and return the thread ID
 * @param {string} content - The content of the message
 * @param {string} thread_id - The ID of the thread if provided, otherwise a new thread is created
 * @returns {Promise<string>}
 */
export const create_message = async (content, thread_id) => {
  try {
    console.time(`[AI] CREATE MESSAGE`);

    if (!thread_id) {
      const thread = await create_thread();
      thread_id = thread.id;
    }

    await openai.beta.threads.messages.create(thread_id, {
      role: "user",
      content: content
    });
    console.timeEnd(`[AI] CREATE MESSAGE`);

    return thread_id;
  } catch (error) {
    console.error(`[AI] CREATE MESSAGE failed: ${error}`);
  }
}

/**
 * Create a message in a thread and return the message object
 * @param {string} content - The content of the message
 * @param {string} thread_id - The ID of the thread if provided, otherwise a new thread is created
 * @returns {Promise<Message>}
 */
export const ask_assistant = async (content, thread_id) => {
  try {

    // Create a message in the thread, if thread_id is not provided, a new thread is created
    thread_id = await create_message(content, thread_id);

    console.log(`[AI] THREAD ID: ${thread_id}`);

    // Run the assistant on the thread
    console.time(`[AI] THREAD RUN`);
    const run = await openai.beta.threads.runs.createAndPoll(thread_id, {
      assistant_id: BYTE_ASSISTANT_ID,
      instructions: ASSISTANT_INSTRUCTIONS
    });
    console.timeEnd(`[AI] THREAD RUN`);

    if (run.status === 'completed') {
      const cleaned_messages = await get_cleaned_messages(run.thread_id);
      return {
        thread_id: thread_id,
        messages: cleaned_messages
      }
    } else {
      console.error(`[AI] THREAD RUN failed: ${run.status}`);
      return {
        thread_id: thread_id,
        messages: []
      }
    }

  } catch (error) {
    console.error(`[AI] ASK ASSISTANT failed: ${error}`);
    return {
      thread_id: thread_id,
      messages: []
    }
  }
}