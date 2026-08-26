import { mock, test } from 'node:test';
import assert from 'node:assert/strict';

const VALID_USER_ID = '507f1f77bcf86cd799439011';
const VALID_DOC_ID = '507f1f77bcf86cd799439012';
const VALID_COMMENT_ID = '507f1f77bcf86cd799439013';
const VALID_WORKSPACE_ID = '507f1f77bcf86cd799439014';
const VALID_NOTIF_ID = '507f1f77bcf86cd799439016';
const OTHER_USER_ID = '507f1f77bcf86cd799439015';
const INVALID_ID = 'not-an-object-id';

// ─── Mock builders ───────────────────────────────────────────────────────────

function buildQueryChain(result) {
  const chain = {
    _result: result,
    select: mock.fn(() => chain),
    lean: mock.fn(() => chain),
    exec: mock.fn(() => Promise.resolve(chain._result)),
    sort: mock.fn(() => chain),
    populate: mock.fn(() => chain),
  };
  return chain;
}

// ─── Mock modules ────────────────────────────────────────────────────────────

const mockNotificationModel = {
  find: mock.fn(() => buildQueryChain([])),
  findOne: mock.fn(() => buildQueryChain(null)),
  insertMany: mock.fn(async () => []),
  updateMany: mock.fn(() => ({
    exec: mock.fn(async () => ({ modifiedCount: 0 })),
  })),
  findOneAndUpdate: mock.fn(() => ({
    populate: mock.fn(() => ({
      lean: mock.fn(() => ({
        exec: mock.fn(async () => null),
      })),
    })),
  })),
  findOneAndDelete: mock.fn(() => ({
    exec: mock.fn(async () => null),
  })),
};

mock.module('../models/Notification.js', {
  namedExports: { Notification: mockNotificationModel },
});

mock.module('../../workspaces/utils/AppError.js', {
  namedExports: {
    AppError: class AppError extends Error {
      constructor(message, status = 500) {
        super(message);
        this.name = 'AppError';
        this.status = status;
      }
    },
  },
});

const { notificationService } = await import('../services/notificationService.js');

// ─── createMentionNotifications ──────────────────────────────────────────────

test('createMentionNotifications: creates notifications for mentioned users', async () => {
  mockNotificationModel.insertMany.mock.mockImplementation(async () => []);

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: [OTHER_USER_ID],
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  const calls = mockNotificationModel.insertMany.mock.calls;
  assert.ok(calls.length > 0);
  const notifications = calls[calls.length - 1].arguments[0];
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].recipient.toString(), OTHER_USER_ID);
  assert.equal(notifications[0].sender.toString(), VALID_USER_ID);
  assert.equal(notifications[0].type, 'mention');
  assert.equal(notifications[0].read, false);
});

test('createMentionNotifications: duplicate mentions produce only one notification', async () => {
  mockNotificationModel.insertMany.mock.mockImplementation(async () => []);

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: [OTHER_USER_ID, OTHER_USER_ID, OTHER_USER_ID],
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  const calls = mockNotificationModel.insertMany.mock.calls;
  const notifications = calls[calls.length - 1].arguments[0];
  assert.equal(notifications.length, 1);
});

test('createMentionNotifications: sender does not receive own notification', async () => {
  const callsBefore = mockNotificationModel.insertMany.mock.calls.length;

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: [VALID_USER_ID],
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  // Should return early without calling insertMany
  assert.equal(mockNotificationModel.insertMany.mock.calls.length, callsBefore);
});

test('createMentionNotifications: returns early for empty mentions', async () => {
  const callsBefore = mockNotificationModel.insertMany.mock.calls.length;

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: [],
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  assert.equal(mockNotificationModel.insertMany.mock.calls.length, callsBefore);
});

test('createMentionNotifications: returns early for null mentions', async () => {
  const callsBefore = mockNotificationModel.insertMany.mock.calls.length;

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: null,
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  assert.equal(mockNotificationModel.insertMany.mock.calls.length, callsBefore);
});

test('createMentionNotifications: filters out null/undefined mention IDs', async () => {
  mockNotificationModel.insertMany.mock.mockImplementation(async () => []);

  await notificationService.createMentionNotifications({
    commentId: VALID_COMMENT_ID,
    senderId: VALID_USER_ID,
    mentionedUserIds: [null, undefined, OTHER_USER_ID],
    documentId: VALID_DOC_ID,
    workspaceId: VALID_WORKSPACE_ID,
  });

  const calls = mockNotificationModel.insertMany.mock.calls;
  const notifications = calls[calls.length - 1].arguments[0];
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].recipient.toString(), OTHER_USER_ID);
});

test('createMentionNotifications: rejects invalid commentId', async () => {
  await assert.rejects(
    () => notificationService.createMentionNotifications({
      commentId: INVALID_ID,
      senderId: VALID_USER_ID,
      mentionedUserIds: [OTHER_USER_ID],
      documentId: VALID_DOC_ID,
      workspaceId: VALID_WORKSPACE_ID,
    }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('createMentionNotifications: rejects invalid workspaceId', async () => {
  await assert.rejects(
    () => notificationService.createMentionNotifications({
      commentId: VALID_COMMENT_ID,
      senderId: VALID_USER_ID,
      mentionedUserIds: [OTHER_USER_ID],
      documentId: VALID_DOC_ID,
      workspaceId: INVALID_ID,
    }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

// ─── getUserNotifications ────────────────────────────────────────────────────

test('getUserNotifications: returns notifications for the user', async () => {
  const mockNotifs = [
    { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID, read: false },
  ];
  mockNotificationModel.find.mock.mockImplementation(() => buildQueryChain(mockNotifs));

  const result = await notificationService.getUserNotifications(VALID_USER_ID);
  assert.equal(result.length, 1);
  assert.equal(result[0].recipient, VALID_USER_ID);
});

test('getUserNotifications: rejects invalid userId', async () => {
  await assert.rejects(
    () => notificationService.getUserNotifications(INVALID_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

// ─── getUnreadNotifications ─────────────────────────────────────────────────

test('getUnreadNotifications: only returns unread notifications', async () => {
  const mockNotifs = [
    { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID, read: false },
  ];
  mockNotificationModel.find.mock.mockImplementation(() => buildQueryChain(mockNotifs));

  const result = await notificationService.getUnreadNotifications(VALID_USER_ID);
  assert.equal(result.length, 1);
  assert.equal(result[0].read, false);

  const findCalls = mockNotificationModel.find.mock.calls;
  const lastCall = findCalls[findCalls.length - 1].arguments[0];
  assert.deepStrictEqual(lastCall, { recipient: VALID_USER_ID, read: false });
});

test('getUnreadNotifications: rejects invalid userId', async () => {
  await assert.rejects(
    () => notificationService.getUnreadNotifications(INVALID_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

// ─── markNotificationAsRead ─────────────────────────────────────────────────

test('markNotificationAsRead: marks a notification as read', async () => {
  const readNotif = { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID, read: true };
  mockNotificationModel.findOneAndUpdate.mock.mockImplementation(() => ({
    populate: mock.fn(() => ({
      lean: mock.fn(() => ({
        exec: mock.fn(async () => readNotif),
      })),
    })),
  }));

  const result = await notificationService.markNotificationAsRead(VALID_NOTIF_ID, VALID_USER_ID);
  assert.equal(result.read, true);
  assert.equal(result._id, VALID_NOTIF_ID);

  const calls = mockNotificationModel.findOneAndUpdate.mock.calls;
  const lastCall = calls[calls.length - 1].arguments;
  assert.deepStrictEqual(lastCall[0], { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID });
  assert.deepStrictEqual(lastCall[1], { read: true });
});

test('markNotificationAsRead: only updates the recipient\'s notification', async () => {
  mockNotificationModel.findOneAndUpdate.mock.mockImplementation(() => ({
    populate: mock.fn(() => ({
      lean: mock.fn(() => ({
        exec: mock.fn(async () => null),
      })),
    })),
  }));

  await assert.rejects(
    () => notificationService.markNotificationAsRead(VALID_NOTIF_ID, OTHER_USER_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test('markNotificationAsRead: idempotent for already-read notification', async () => {
  const alreadyRead = { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID, read: true };
  mockNotificationModel.findOneAndUpdate.mock.mockImplementation(() => ({
    populate: mock.fn(() => ({
      lean: mock.fn(() => ({
        exec: mock.fn(async () => alreadyRead),
      })),
    })),
  }));

  const result = await notificationService.markNotificationAsRead(VALID_NOTIF_ID, VALID_USER_ID);
  assert.equal(result.read, true);
});

test('markNotificationAsRead: rejects invalid notificationId', async () => {
  await assert.rejects(
    () => notificationService.markNotificationAsRead(INVALID_ID, VALID_USER_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('markNotificationAsRead: throws 404 for non-existent notification', async () => {
  mockNotificationModel.findOneAndUpdate.mock.mockImplementation(() => ({
    populate: mock.fn(() => ({
      lean: mock.fn(() => ({
        exec: mock.fn(async () => null),
      })),
    })),
  }));

  await assert.rejects(
    () => notificationService.markNotificationAsRead(VALID_NOTIF_ID, VALID_USER_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

// ─── markAllNotificationsAsRead ──────────────────────────────────────────────

test('markAllNotificationsAsRead: marks all unread as read', async () => {
  const execMock = mock.fn(async () => ({ modifiedCount: 3 }));
  mockNotificationModel.updateMany.mock.mockImplementation(() => ({ exec: execMock }));

  const result = await notificationService.markAllNotificationsAsRead(VALID_USER_ID);
  assert.deepStrictEqual(result, { modifiedCount: 3 });

  const calls = mockNotificationModel.updateMany.mock.calls;
  const lastCall = calls[calls.length - 1].arguments;
  assert.deepStrictEqual(lastCall[0], { recipient: VALID_USER_ID, read: false });
  assert.deepStrictEqual(lastCall[1], { read: true });
});

test('markAllNotificationsAsRead: safely handles zero unread notifications', async () => {
  const execMock = mock.fn(async () => ({ modifiedCount: 0 }));
  mockNotificationModel.updateMany.mock.mockImplementation(() => ({ exec: execMock }));

  const result = await notificationService.markAllNotificationsAsRead(VALID_USER_ID);
  assert.deepStrictEqual(result, { modifiedCount: 0 });
});

test('markAllNotificationsAsRead: only affects current user notifications', async () => {
  const execMock = mock.fn(async () => ({ modifiedCount: 1 }));
  mockNotificationModel.updateMany.mock.mockImplementation(() => ({ exec: execMock }));

  await notificationService.markAllNotificationsAsRead(VALID_USER_ID);

  const calls = mockNotificationModel.updateMany.mock.calls;
  const lastCall = calls[calls.length - 1].arguments;
  assert.equal(lastCall[0].recipient, VALID_USER_ID);
});

test('markAllNotificationsAsRead: rejects invalid userId', async () => {
  await assert.rejects(
    () => notificationService.markAllNotificationsAsRead(INVALID_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

// ─── deleteNotification ─────────────────────────────────────────────────────

test('deleteNotification: deletes a notification', async () => {
  const deletedNotif = { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID };
  const execMock = mock.fn(async () => deletedNotif);
  mockNotificationModel.findOneAndDelete.mock.mockImplementation(() => ({ exec: execMock }));

  const result = await notificationService.deleteNotification(VALID_NOTIF_ID, VALID_USER_ID);
  assert.deepStrictEqual(result, { deleted: true });

  const calls = mockNotificationModel.findOneAndDelete.mock.calls;
  const lastCall = calls[calls.length - 1].arguments;
  assert.deepStrictEqual(lastCall[0], { _id: VALID_NOTIF_ID, recipient: VALID_USER_ID });
});

test('deleteNotification: only deletes current user notification', async () => {
  const execMock = mock.fn(async () => null);
  mockNotificationModel.findOneAndDelete.mock.mockImplementation(() => ({ exec: execMock }));

  await assert.rejects(
    () => notificationService.deleteNotification(VALID_NOTIF_ID, OTHER_USER_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test('deleteNotification: another user cannot delete someone else\'s notification', async () => {
  const execMock = mock.fn(async () => null);
  mockNotificationModel.findOneAndDelete.mock.mockImplementation(() => ({ exec: execMock }));

  await assert.rejects(
    () => notificationService.deleteNotification(VALID_NOTIF_ID, OTHER_USER_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test('deleteNotification: rejects invalid notificationId', async () => {
  await assert.rejects(
    () => notificationService.deleteNotification(INVALID_ID, VALID_USER_ID),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test('deleteNotification: throws 404 for non-existent notification', async () => {
  const execMock = mock.fn(async () => null);
  mockNotificationModel.findOneAndDelete.mock.mockImplementation(() => ({ exec: execMock }));

  await assert.rejects(
    () => notificationService.deleteNotification(VALID_NOTIF_ID, VALID_USER_ID),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});
