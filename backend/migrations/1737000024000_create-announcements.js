/**
 * Migration: Create announcements table
 * Purpose: School-wide or targeted notices visible to students/parents/staff.
 */

exports.up = (pgm) => {
  pgm.createTable('announcements', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    body: {
      type: 'TEXT',
      notNull: true,
    },
    audience: {
      type: 'VARCHAR(30)',
      notNull: true,
      default: "'ALL'",
    },
    // Optional targeting: if set, only that class sees the announcement
    class_id: {
      type: 'UUID',
      notNull: false,
      references: '"classes"',
      onDelete: 'SET NULL',
    },
    priority: {
      type: 'VARCHAR(20)',
      default: "'NORMAL'",
      notNull: true,
    },
    is_published: {
      type: 'BOOLEAN',
      default: true,
      notNull: true,
    },
    publish_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
    expires_at: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    created_by: {
      type: 'UUID',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
    updated_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  pgm.addConstraint(
    'announcements',
    'chk_announcements_audience',
    "CHECK (audience IN ('ALL','STUDENTS','PARENTS','TEACHERS','STAFF','CLASS'))"
  );

  pgm.addConstraint(
    'announcements',
    'chk_announcements_priority',
    "CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT'))"
  );

  pgm.createIndex('announcements', 'audience');
  pgm.createIndex('announcements', 'publish_at');
  pgm.createIndex('announcements', 'class_id');
};

exports.down = (pgm) => {
  pgm.dropTable('announcements');
};
