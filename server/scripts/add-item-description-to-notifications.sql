-- Add item_description column to user_notifications table
alter table user_notifications add column if not exists item_description text;
