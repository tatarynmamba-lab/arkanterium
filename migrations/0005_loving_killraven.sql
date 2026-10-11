CREATE TABLE `feed_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feed_comment_post_idx` ON `feed_comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `feed_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`author_id` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `feed_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `feed_like_post_idx` ON `feed_likes` (`post_id`);--> statement-breakpoint
CREATE TABLE `feed_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `feed_post_date_idx` ON `feed_posts` (`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `page_appearances` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`theme` text DEFAULT 'violet' NOT NULL,
	`object_key` text,
	`content_type` text,
	`size` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `appearance_owner_idx` ON `page_appearances` (`owner_id`);--> statement-breakpoint
CREATE TABLE `reset_objects` (
	`object_key` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`summary` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `login_accounts` ADD `setup_pending` integer DEFAULT 0 NOT NULL;