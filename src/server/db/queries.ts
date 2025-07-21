import { eq, and, gte, lt, desc, asc } from "drizzle-orm";
import type { Message } from "ai";
import { db } from "./index";
import { chats, messages, userRequests, users } from "./schema";

export async function upsertChat({
  userId,
  chatId,
  title,
  messages: chatMessages,
}: {
  userId: string;
  chatId: string;
  title: string;
  messages: Array<Message>;
}) {
  return await db.transaction(async (tx) => {
    // Check if a chat with this ID already exists
    const [existingChat] = await tx
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .limit(1);

    // If the chat exists but belongs to a different user, throw an error
    if (existingChat && existingChat.userId !== userId) {
      throw new Error(`Chat ID '${chatId}' already exists and belongs to a different user. Cannot create or update this chat.`);
    }

    // Upsert the chat
    const [chat] = await tx
      .insert(chats)
      .values({
        id: chatId,
        userId,
        title,
      })
      .onConflictDoUpdate({
        target: chats.id,
        set: {
          title,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Delete all existing messages for this chat
    await tx.delete(messages).where(eq(messages.chatId, chatId));

    // Insert new messages
    if (chatMessages.length > 0) {
      await tx.insert(messages).values(
        chatMessages.map((message, index) => ({
          id: message.id ?? crypto.randomUUID(),
          chatId,
          role: message.role,
          parts: message.parts ?? message.content ?? "",
          order: index,
        }))
      );
    }

    return chat;
  });
}

export async function getChat(chatId: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat || chat.userId !== userId) {
    return null;
  }

  // Get all messages for this chat
  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.order));

  return {
    ...chat,
    messages: chatMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      parts: typeof msg.parts === "string" ? [{ type: "text", text: msg.parts }] : msg.parts,
      content: typeof msg.parts === "string" ? msg.parts : JSON.stringify(msg.parts),
    })),
  };
}

export async function getChats(userId: string) {
  return await db
    .select({
      id: chats.id,
      title: chats.title,
      userId: chats.userId,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
    })
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function deleteChat(chatId: string, userId: string) {
  const [deletedChat] = await db
    .delete(chats)
    .where(eq(chats.id, chatId))
    .returning();

  if (!deletedChat || deletedChat.userId !== userId) {
    return null;
  }

  return deletedChat;
}

export async function getUserTodayRequestCount(userId: string): Promise<number> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [result] = await db
    .select({
      count: userRequests.requestCount,
    })
    .from(userRequests)
    .where(
      and(
        eq(userRequests.userId, userId),
        gte(userRequests.requestDate, startOfDay),
        lt(userRequests.requestDate, endOfDay)
      )
    )
    .limit(1);

  return result?.count || 0;
}

export async function recordUserRequest(userId: string): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Try to update existing record for today, or insert new one
  const [existingRequest] = await db
    .select()
    .from(userRequests)
    .where(
      and(
        eq(userRequests.userId, userId),
        gte(userRequests.requestDate, startOfDay),
        lt(userRequests.requestDate, endOfDay)
      )
    )
    .limit(1);

  if (existingRequest) {
    // Update existing record
    await db
      .update(userRequests)
      .set({
        requestCount: existingRequest.requestCount + 1,
      })
      .where(eq(userRequests.id, existingRequest.id));
  } else {
    // Insert new record for today
    await db
      .insert(userRequests)
      .values({
        userId,
        requestDate: startOfDay,
        requestCount: 1,
      });
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const [user] = await db
    .select({
      isAdmin: users.isAdmin,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.isAdmin || false;
} 