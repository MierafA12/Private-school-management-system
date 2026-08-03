const pool         = require('../db');
const getNotifSvc  = () => require('./notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all conversations for a user (parent or teacher)
 */
const getConversations = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       c.id, c.subject, c.status, c.updated_at,
       (s.first_name || ' ' || s.last_name) AS student_name,
       (tp.first_name || ' ' || tp.last_name) AS teacher_name,
       tu.email AS teacher_email,
       pp.first_name AS parent_first, pp.last_name AS parent_last,
       pu.email AS parent_email,
       (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_id != $1) AS unread_count
     FROM conversations c
     JOIN students s  ON s.id  = c.student_id
     JOIN users   pu  ON pu.id = c.parent_id
     JOIN parents pp  ON pp.user_id = c.parent_id
     JOIN users   tu  ON tu.id = c.teacher_id
     JOIN teachers tp ON tp.user_id = c.teacher_id
     WHERE c.parent_id = $1 OR c.teacher_id = $1
     ORDER BY c.updated_at DESC`,
    [userId]
  );
  return rows;
};

/**
 * Get single conversation thread — verifies participant
 */
const getConversationById = async (conversationId, userId) => {
  const { rows: conv } = await pool.query(
    `SELECT c.*, 
       (s.first_name || ' ' || s.last_name) AS student_name,
       (tp.first_name || ' ' || tp.last_name) AS teacher_name,
       tu.email AS teacher_email
     FROM conversations c
     JOIN students s  ON s.id = c.student_id
     JOIN users   tu  ON tu.id = c.teacher_id
     JOIN teachers tp ON tp.user_id = c.teacher_id
     WHERE c.id = $1 AND (c.parent_id = $2 OR c.teacher_id = $2)`,
    [conversationId, userId]
  );
  if (!conv.length) return null;

  const { rows: msgs } = await pool.query(
    `SELECT m.id, m.body, m.is_read, m.created_at,
       u.email AS sender_email,
       COALESCE(p.first_name, t.first_name, st.first_name) AS sender_first,
       COALESCE(p.last_name,  t.last_name,  st.last_name)  AS sender_last
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     LEFT JOIN parents  p  ON p.user_id  = m.sender_id
     LEFT JOIN teachers t  ON t.user_id  = m.sender_id
     LEFT JOIN staff    st ON st.user_id = m.sender_id
     WHERE m.conversation_id = $1
     ORDER BY m.created_at`,
    [conversationId]
  );

  // Mark unread messages as read for this user
  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
    [conversationId, userId]
  );

  return { ...conv[0], messages: msgs };
};

/**
 * Start a new conversation (parent → teacher)
 * Validates that the teacher is assigned to one of the parent's linked children
 */
const startConversation = async (parentUserId, teacherUserId, studentId, subject, firstMessage, linkedStudentIds) => {
  if (!linkedStudentIds.includes(studentId)) {
    const err = new Error('You can only message teachers of your linked children.'); err.status = 403; throw err;
  }

  // Verify teacher is assigned to student's section
  const { rows: assigned } = await pool.query(
    `SELECT t.id FROM teachers t
     JOIN users u ON u.id = t.user_id
     JOIN timetables tt ON tt.teacher_id = t.id
     JOIN enrollments e ON e.section_id = tt.section_id
     WHERE u.id = $1 AND e.student_id = $2 AND e.enrollment_status = 'ACTIVE'
     LIMIT 1`,
    [teacherUserId, studentId]
  );
  if (!assigned.length) {
    const err = new Error('This teacher is not assigned to your child\'s class.'); err.status = 403; throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Upsert conversation
    const { rows: conv } = await client.query(
      `INSERT INTO conversations (student_id, parent_id, teacher_id, subject)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, parent_id, teacher_id) DO UPDATE
         SET subject = EXCLUDED.subject, status = 'OPEN', updated_at = NOW()
       RETURNING id`,
      [studentId, parentUserId, teacherUserId, subject]
    );
    const conversationId = conv[0].id;

    // Insert first message
    await client.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)`,
      [conversationId, parentUserId, firstMessage]
    );

    await client.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );

    await client.query('COMMIT');
    return { conversation_id: conversationId };
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
};

/**
 * Send a message in an existing conversation
 */
const sendMessage = async (conversationId, senderUserId, body) => {
  // Verify participant
  const { rows } = await pool.query(
    `SELECT id FROM conversations
     WHERE id = $1 AND (parent_id = $2 OR teacher_id = $2) AND status = 'OPEN'`,
    [conversationId, senderUserId]
  );
  if (!rows.length) {
    const err = new Error('Conversation not found or you are not a participant.'); err.status = 403; throw err;
  }

  const { rows: msg } = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *`,
    [conversationId, senderUserId, body]
  );

  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  // Notify the other participant (non-blocking)
  try {
    const { rows: conv } = await pool.query(
      `SELECT parent_id, teacher_id, student_id FROM conversations WHERE id = $1`, [conversationId]
    );
    if (conv.length) {
      const recipientId = conv[0].parent_id === senderUserId
        ? conv[0].teacher_id
        : conv[0].parent_id;
      getNotifSvc().dispatch(recipientId, 'new_message', {
        title:   'New Message',
        body:    body.length > 80 ? body.slice(0, 80) + '…' : body,
        link:    '/parent/messages',
        refType: 'conversation',
        refId:   conversationId,
      }).catch(() => {});
    }
  } catch (_) {}

  return msg[0];
};

module.exports = {
  getConversations,
  getConversationById,
  startConversation,
  sendMessage,
};
